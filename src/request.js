var https = require('https');
module.exports = function (root, accessToken) {
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
      try { json = JSON.stringify(body); }
      catch (err) { return callback(err); }
    }
    var options = {
      hostname: "api.github.com",
      path: url,
      method: method,
      headers: headers
    };
    var req = https.request(options, function (res) {
      var response;
      var body = [];
      res.on("data", function (chunk) {
        body.push(chunk);
      });
      res.on("end", function () {
        body = Buffer.concat(body).toString();
        // console.log(method, url, res.statusCode);
        if (res.statusCode >= 400 && res.statusCode < 500) return callback();
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return callback(new Error("Invalid HTTP response: " + res.statusCode));
        }
        if (body) {
          try { response = JSON.parse(body); }
          catch (err) { return callback(err); }
        }
        return callback(null, response);
      });
    });
    req.end(json);
  };
};
