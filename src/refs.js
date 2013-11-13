var isHash = require('./ishash.js');
// Implement the js-git references interface using github APIs
module.exports = function (repo) {

  repo.readRef = readRef;       // (ref) -> hash
  repo.listRefs = listRefs;     // (prefix) -> refs
  repo.createRef = createRef;   // (ref, hash)
  repo.updateRef = updateRef;   // (ref, hash)
  repo.deleteRef = deleteRef;   // (ref)

  repo.resolve = resolve;       // (hash-ish) -> hash
  repo.updateHead = updateHead; // (hash)
  repo.getHead = getHead;       // () -> ref
  repo.setHead = setHead;       // (ref)

};

function readRef(ref, callback) {
  if (!callback) return readRef.bind(this, ref);
  if (!(/^refs\//).test(ref)) {
    return callback(new TypeError("Invalid ref: " + ref));
  }
  var typeCache = this.typeCache;
  return this.apiGet("/repos/:root/git/" + ref, onRef);

  function onRef(err, result) {
    if (result === undefined) return callback(err);
    typeCache[result.object.sha] = result.object.type;
    return callback(null, result.object.sha);
  }
}

function listRefs(prefix, callback) {
  if (!callback) return listRefs.bind(this, prefix);
  prefix = prefix || "refs";
  if (!(/^refs/).test(prefix)) {
    return callback(new TypeError("Invalid prefix: " + prefix));
  }
  var typeCache = this.typeCache;
  return this.apiGet("/repos/:root/git/" + prefix, onRefs);

  function onRefs(err, results) {
    if (results === undefined) return callback(err);
    var refs = {};
    results.forEach(function (result) {
      typeCache[result.object.sha] = result.object.type;
      refs[result.ref] = result.object.sha;
    });
    return callback(null, refs);
  }
}

function createRef(ref, hash, callback) {
  if (!callback) return createRef(this, ref, hash);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  var typeCache = this.typeCache;
  return this.apiPost("/repos/:root/git/refs", {
    ref: ref,
    sha: hash
  }, onResult);

  function onResult(err, result) {
    if (result === undefined) return callback(err);
    typeCache[result.object.sha] = result.object.type;
    callback();
  }
}

function updateRef(ref, hash, callback) {
  if (!callback) return updateRef(this, ref, hash);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  var typeCache = this.typeCache;
  return this.apiPatch("/repos/:root/git/" + ref, {
    sha: hash,
    force: true
  }, onResult);

  function onResult(err, result) {
    if (err) return callback(err);
    typeCache[result.object.sha] = result.object.type;
    callback();
  }
}

function deleteRef(ref, callback) {
  if (!callback) return deleteRef(this, ref);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  return this.apiDelete("/repos/:root/git/" + ref, callback);
}

function resolve(hash, callback) {
  if (!callback) return resolve.bind(this, hash);
  hash = hash.trim();
  var repo = this;
  if (isHash(hash)) return callback(null, hash);
  if (hash === "HEAD") hash = "refs/heads/master";
  // TODO: handle short names like bare branch or tag names.
  return repo.readRef(hash, callback);
}

function updateHead(hash, callback) {
  return this.updateRef("refs/heads/master", hash, callback);
}

function getHead(callback) {
  if (!callback) return getHead.bind(this);
  callback(null, "refs/heads/master");
}

function setHead(branchName, callback) {
  if (!callback) return setHead.bind(this, branchName);
  if (branchName !== "refs/heads/master") {
    return callback(new Error("Only master branch allowed on mounted github repos"));
  }
  callback();
}