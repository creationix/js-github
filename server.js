var http = require('http');
var send = require('send');
var fs = require('fs');
var pathJoin = require('path').resolve;
var urlParse = require('url').parse;
var compile = require('js-linker');


http.createServer(function (req, res) {
  var url = urlParse(req.url, true);
  if (url.query.bundle) {
    return compile(nodeLoader, "." + url.pathname, function (err, js) {
      res.setHeader("Content-Type", "application/javascript");
      res.end(js);
    });
  }
  send(req, req.url)
    .root(__dirname)
    .pipe(res);
}).listen(8080, function () {
  console.log("Dev server listening at http://localhost:8080/test.html");
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