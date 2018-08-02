var path = require('path');
var childProcess = require('child_process');

var decorate = require('../decorate.js');
var { resolveFilePath } = require('../utils.js');

var vendorPath = 'vendor/assets/javascripts';
var npmPath = 'node_modules';
var bowerPath = 'vendor/assets/bower_components';
var appPath = 'app/assets/javascripts';
var pathIndication = 'assets/javascripts';

function getAssetPath(context, requireFile) {
  var assetFilePath;

  if (requireFile[0] == '.') {
    assetFilePath = path.join(context, requireFile);
  } else {
    // There is a better way to do this...
    // - get root path for rails javascript assets from context
    var assetsRoot = context.slice(0, context.indexOf(pathIndication) + pathIndication.length);
    assetFilePath = path.join(assetsRoot, requireFile);
  }

  var assetFile = resolveFilePath(assetFilePath);
  if (assetFile) return assetFile;
}

function getByPath(tryPath, requireFile) {
  var vendorFilePath = path.join(tryPath, requireFile);
  var vendorFile = resolveFilePath(vendorFilePath);
  if (vendorFile) return vendorFile;
}

function getGemAssetPath(requireFile) {
  var gem, assetPath;
  [gem, ...assetPath] = requireFile.split('/');

  if (process.env.IMPORTANT_JS_GEM_PATHS)
    // Avoid using `bundle` inside webpack by passing all gem paths as an env
    var gemPath = process.env.IMPORTANT_JS_GEM_PATHS.split(':').find(function(path) {
      return path.split('/').pop().indexOf(gem) > -1;
    });
  else
    var gemPath = childProcess.spawnSync('bundle', ['show', gem]).output[1].toString().trim();

  var gemPaths = [
    path.join(gemPath, vendorPath, ...assetPath),
    path.join(gemPath, appPath, ...assetPath),
    path.join(gemPath, vendorPath, requireFile),
    path.join(gemPath, appPath, requireFile),
    path.join(gemPath, vendorPath),
    path.join(gemPath, appPath),
  ];

  // Gem assets can contain other sprocket directives which will invoke sprockets-preloader again
  // The additional requires will follow the `assetFile` code flow which means `require` cannot be turned off
  var gemFile = gemPaths
    .map(function(gemPath) { return resolveFilePath(gemPath); })
    .find(function(gemPath) { return gemPath; });

  if (gemFile) return gemFile;
}

module.exports = function requireTransformer(context, requireFile) {
  var asset = getAssetPath(context, requireFile);
  if (asset) return decorate(context, asset, { require: true });

  var vendorAsset = getByPath(vendorPath, requireFile);
  if (vendorAsset) return decorate(context, vendorAsset);

  var npmAsset = getByPath(npmPath, requireFile);
  if (npmAsset) return decorate(context, npmAsset);

  var bowerAsset = getByPath(bowerPath, requireFile);
  if (bowerAsset) return decorate(context, bowerAsset);

  var gemAsset = getGemAssetPath(requireFile);
  if (gemAsset) return decorate(context, gemAsset, { require: true });

  console.warn('FILE UNRESOLVED:', context, requireFile);
  return decorate(context, requireFile, { require: true }); // Unknown file: perhaps a weird gem require or it's just missing, so let webpack try to resolve it
};
