var compile = require('js-linker');
var fs = require('fs');

compile(nodeLoader, "./repo.js", function (err, js) {
  if (err) throw err;
  fs.writeFile("js-github.js", js);
});

// Load files using node.js APIs
function nodeLoader(path, binary, callback) {
  fs.readFile(path, binary ? null : 'utf8', function (err, code) {
    if (err) {
      if (err.code === "ENOENT") return callback();
      return callback(err);
    }
    return callback(null, code);
  });
}