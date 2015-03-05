var https = require('https');
var statusCodes = require('http').STATUS_CODES;
var urlParse = require('url').parse;

module.exports = function (root, accessToken, githubHostname) {
  var cache = {};
  githubHostname = (githubHostname || "https://api.github.com/");
  return function request(method, url, body, callback) {
    if (typeof body === "function" && callback === undefined) {
      callback = body;
      body = undefined;
    }
    if (!callback) return request.bind(this, accessToken, method, url, body);
    url = url.replace(":root", root);

    var json;
    var headers = {
      "User-Agent": "node.js"
    };
    if (accessToken) {
      headers["Authorization"] = "token " + accessToken;
    }
    if (body) {
      headers["Content-Type"] = "application/json";
      try { json = new Buffer(JSON.stringify(body)); }
      catch (err) { return callback(err); }
      headers["Content-Length"] = json.length;
    }
    if (method === "GET") {
      var cached = cache[url];
      if (cached) {
        headers["If-None-Match"] = cached.etag;
      }
    }

    var urlparts = urlParse(githubHostname);
    var options = {
      hostname: urlparts.hostname,
      path: urlparts.pathname + url,
      method: method,
      headers: headers
    };

    var req = https.request(options, function (res) {
      var body = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      res.on("end", function () {
        body = Buffer.concat(body).toString();
        console.log(method, url, res.statusCode);
        console.log("Rate limit %s/%s left", res.headers['x-ratelimit-remaining'], res.headers['x-ratelimit-limit']);
        //console.log(body);
        if (res.statusCode === 200 && method === "GET" && /\/refs\//.test(url)) {
          cache[url] = {
            body: body,
            etag: res.headers.etag
          };
        }
        else if (res.statusCode === 304) {
          body = cache[url].body;
          res.statusCode = 200;
        }
        // Fake parts of the xhr object using node APIs
        var xhr = {
          status: res.statusCode,
          statusText: res.statusCode + " " + statusCodes[res.statusCode]
        };
        var response = {message:body};
        if (body){
          try { response = JSON.parse(body); }
          catch (err) {}
        }
        return callback(null, xhr, response);
      });
    });
    req.end(json);
    req.on("error", callback);
  };
};
