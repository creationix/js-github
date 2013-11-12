exports.accessToken = null;

exports.get = apiGet;
function apiGet(url, callback) {
  if (!exports.accessToken) throw new TypeError("Must set accessToken first");
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://api.github.com' + url, true);
  xhr.setRequestHeader("Authorization", "token " + exports.accessToken);
  xhr.onreadystatechange = makeHandler(xhr, callback);
  xhr.send();
}

exports.post = apiPost;
function apiPost(url, body, callback) {
  if (!exports.accessToken) throw new TypeError("Must set accessToken first");
  var json;
  try { json = JSON.stringify(body); }
  catch (err) { return callback(err); }
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.github.com' + url, true);
  xhr.setRequestHeader("Authorization", "token " + exports.accessToken);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = makeHandler(xhr, callback);
  xhr.send(json);
}

exports.patch = apiPatch;
function apiPatch(url, body, callback) {
  if (!exports.accessToken) throw new TypeError("Must set accessToken first");
  var json;
  try { json = JSON.stringify(body); }
  catch (err) { return callback(err); }
  var xhr = new XMLHttpRequest();
  xhr.open('PATCH', 'https://api.github.com' + url, true);
  xhr.setRequestHeader("Authorization", "token " + exports.accessToken);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.onreadystatechange = makeHandler(xhr, callback);
  xhr.send(json);
}

function makeHandler(xhr, callback) {
  return function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status >= 400 && xhr.status < 500) return callback();
    if (xhr.status < 200 || xhr.status >= 300) {
      return callback(new Error("Invalid HTTP response: " + xhr.status));
    }
    var response;
    try { response = JSON.parse(xhr.responseText); }
    catch (err) { return callback(err); }
    return callback(null, response);
  };
}

