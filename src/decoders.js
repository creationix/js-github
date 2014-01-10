var from = require('bops/from.js');
var to = require('bops/to.js');

module.exports = {
  commit: decodeCommit,
  tag: decodeTag,
  tree: decodeTree,
  blob: decodeBlob,
  text: decodeText
};

function decodeCommit(result) {
  var typeCache = this.typeCache;
  typeCache[result.tree.sha] = "tree";
  return {
    tree: result.tree.sha,
    parents: result.parents.map(function (object) {
      typeCache[object.sha] = "commit";
      return object.sha;
    }),
    author: pickPerson(result.author),
    committer: pickPerson(result.committer),
    message: result.message
  };
}

function decodeTag(result) {
  this.typeCache[result.object.sha] = result.object.type;
  return {
    object: result.object.sha,
    type: result.object.type,
    tag: result.tag,
    tagger: pickPerson(result.tagger),
    message: result.message
  };
}

function decodeTree(result) {
  var typeCache = this.typeCache;
  var tree = {};
  result.tree.forEach(function (entry) {
    typeCache[entry.sha] = entry.type;
    tree[entry.path] = {
      mode: parseInt(entry.mode, 8),
      hash: entry.sha
    };
  });
  return tree;
}

function decodeBlob(result) {
  if (result.encoding === 'base64') {
    return from(result.content.replace(/\n/g, ''), 'base64');
  }
  if (result.encoding === 'utf-8') {
    return from(result.content, 'utf8');
  }
  throw new Error("Unknown blob encoding: " + result.encoding);
}

function decodeText(result) {
  if (result.encoding === 'base64') {
    return to(from(result.content.replace(/\n/g, ''), 'base64'), "utf8");
  }
  if (result.encoding === 'utf-8') {
    return result.content;
  }
  throw new Error("Unknown blob encoding: " + result.encoding);
}

function pickPerson(person) {
  return {
    name: person.name,
    email: person.email,
    date: new Date(person.date)
  };
}
