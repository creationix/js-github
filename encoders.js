var bops = require('bops');

var modeToType = {
  "40000": "tree",
  "100644": "blob",  // normal file
  "100655": "blob",  // executable file
  "120000": "blob",  // symlink
  "160000": "commit" // gitlink
};

module.exports = {
  commit: encodeCommit,
  tag: encodeTag,
  tree: encodeTree,
  blob: encodeBlob
};

function encodeCommit(commit) {
  var out = {};
  out.message = commit.message;
  out.tree = commit.tree;
  if (commit.parents) out.parents = commit.parents;
  else if (commit.parent) out.parents = [commit.parent];
  else commit.parents = [];
  if (commit.author) out.author = encodePerson(commit.author);
  if (commit.committer) out.committer = encodePerson(commit.committer);
  return out;
}

function encodeTag(tag) {
  return {
    tag: tag.tag,
    message: tag.message,
    object: tag.object,
    tagger: encodePerson(tag.tagger)
  };
}

function encodePerson(person) {
  return {
    name: person.name,
    email: person.email,
    date: (person.date || new Date()).toISOString()
  };
}

function encodeTree(tree) {
  return {
    tree: tree.map(pickTree)
  };
}

function pickTree(entry) {
  var mode = entry.mode.toString(8);
  return {
    path: entry.name,
    mode: mode,
    type: modeToType[mode],
    sha: entry.hash
  };
}

function encodeBlob(blob) {
  if (typeof blob === "string") return {
    content: blob,
    encoding: "utf-8"
  };
  if (bops.is(blob)) return {
    content: bops.to(blob, "base64"),
    encoding: "base64"
  };
  throw new TypeError("Invalid blob type, must be binary of string");
}
