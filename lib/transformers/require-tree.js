var fs = require('fs');
var path = require('path');
var importsLoader = path.join(__dirname, '../../node_modules/imports-loader');

var { getFilesInDirectory } = require('../utils.js');
var pathIndication = 'assets/javascripts';
var importsNothing = importsLoader +
  '?module=>undefined'  +
  ',exports=>undefined' +
  ',define=>undefined'  +
  ',require=>undefined' +
  ',this=>window!';
var importsOnlyRequire = importsLoader +
  '?module=>undefined'  +
  ',exports=>undefined' +
  ',define=>undefined'  +
  ',this=>window!';

function getAllFilesInTree(context, directory) {
  return getFilesInDirectory(directory).reduce(function(requires, file) {
    var newPath = path.join(directory, file);

    if(fs.statSync(newPath).isDirectory()) {
      return requires.concat(getAllFilesInTree(context, newPath));
    } else {
      relativePath = path.relative(context, newPath);
      if (/.eco$/.exec(newPath)) {
        // There is a better way to do this...
        // - get root path for rails javascript assets from context
        assetsRoot = context.slice(0, context.indexOf(pathIndication) + pathIndication.length);
        relativePathFromAssetsRoot = path.relative(assetsRoot, newPath);

        var lines = [
          'window.JST = window.JST || {};',
          'window.JST[\'' + relativePathFromAssetsRoot + '\'] = ' + 'require(\'' + importsOnlyRequire + './' + relativePath + '\');'
        ];

        return requires.concat(lines);
      } else {
        return requires.concat(['require(\'' + importsOnlyRequire + './' + relativePath + '\');']);
      }
    }
  }, []);
}

module.exports = function requireTreeTransformer(context, requireDir) {
  var assetDir = path.join(context, requireDir);

  if (assetDir) {
    return getAllFilesInTree(context, assetDir);
  } else {
    console.log('TREE UNRESOLVED:', context, requireDir);
    return [];
  }
};