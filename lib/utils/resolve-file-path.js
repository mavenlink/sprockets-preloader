var fileExists = require('./file-exists.js');

module.exports = function resolveFilePath(requireFile) {
  var filePaths = [
    requireFile + '',
    requireFile + '.js',
    requireFile + '.coffee',
    requireFile + '.js.coffee',
    requireFile + '.coffee.js',
    requireFile + '.jst.eco',
    requireFile + '.jst.hbs',
    requireFile + '/index.js',
    requireFile + '/index.coffee',
  ];

  return filePaths.find(fileExists);
}
