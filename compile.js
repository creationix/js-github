var fs = require('fs');
var compile = require('js-linker');

compileHtml(nodeLoader, "test.html", function (err, html) {
  if (err) throw err;
  console.log(html);
});


function compileHtml(loader, index, callback) {
  var findRegExp = /<script[^>]+src="[^".]+.js\?bundle=true"[^>]*><\/script>/g;
  var matchRegExp = /<script[^>]+src="([^".]+.js)\?bundle=true"[^>]*><\/script>/;
  loader(index, false, function (err, html) {
    if (html === undefined) return callback(err);
    console.log(html);
    var targets = html.match(findRegExp).map(function (script) {
      return {
        original: script,
        target: script.match(matchRegExp)[1]
      };
    });
    var next;
    check();
    function check() {
      next = targets.shift();
      if (!next) return callback(null, html);
      compile(loader, "./" + next.target, onJs);
    }

    function onJs(err, js) {
      if (err) return callback(err);
      html = html.replace(next.original, '<script>\n' + js.trim() + '\n</script>');
      check();
    }
  });
}

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