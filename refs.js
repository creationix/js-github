var isHash = require('./ishash.js');
// Implement the js-git references interface using github APIs
module.exports = function (repo) {

  repo.resolve = resolve;       // (hash-ish) -> hash
  repo.updateHead = updateHead; // (hash)
  repo.getHead = getHead;       // () -> ref
  repo.setHead = setHead;       // (ref)
  repo.readRef = readRef;       // (ref) -> hash
  repo.createRef = createRef;   // (ref, hash)
  repo.updateRef = updateRef;   // (ref, hash)
  repo.deleteRef = deleteRef;   // (ref)
  repo.listRefs = listRefs;     // (prefix) -> refs

};

function resolve(hash, callback) {
  if (!callback) return resolve.bind(this, hash);
  hash = hash.trim();
  var repo = this;
  if (isHash(hash)) return callback(null, hash);
  if (hash === "HEAD") return repo.getHead(onBranch);
  throw "TODO: Implement more";

  function onBranch(err, ref) {
    if (err) return callback(err);
    if (!ref) return callback();
    return repo.resolve(ref, callback);
  }
}

function updateHead(hash, callback) {
  return this.updateRef("refs/heads/master", hash, callback);
}

function getHead(callback) {
  if (!callback) return getHead.bind(this);
  this.apiGet("/repos/:root/git/refs/heads/master", function (err, result) {
    if (err) return callback(err);
    callback(null, result.object.sha);
  });
}

function setHead(branchName, callback) {
  if (!callback) return setHead.bind(this, branchName);
  throw "TODO: Implement repo.setHead";
}

function readRef(ref, callback) {
  if (!callback) return readRef.bind(this, ref);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  return this.apiGet("/repos/:root/git/" + ref, onRef);

  function onRef(err, result) {
    if (result === undefined) return callback(err);
    return callback(null, result.object.sha);
  }
}

function createRef(ref, hash, callback) {
  if (!callback) return createRef(this, ref, hash);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  this.apiPost("/repos/:root/git/refs", {
    ref: ref,
    sha: hash
  }, function (err) {
    if (err) return callback(err);
    callback();
  });
}

function updateRef(ref, hash, callback) {
  if (!callback) return updateRef(this, ref, hash);
  if (!(/^refs\//).test(ref)) {
    return callback(new Error("Invalid ref: " + ref));
  }
  this.apiPatch("/repos/:root/git/" + ref, {
    sha: hash,
    force: true
  }, function (err) {
    if (err) return callback(err);
    callback();
  });
}

function deleteRef(ref, callback) {
  if (!callback) return deleteRef(this, ref);
  throw "TODO: Implement repo.deleteRef";
}

function listRefs(prefix, callback) {
  if (!callback) return listRefs.bind(this, prefix);
  throw "TODO: Implement repo.listRefs";
}

