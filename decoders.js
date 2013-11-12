var bops = require('bops');

module.exports = {
  commit: decodeCommit,
  tag: decodeTag,
  tree: decodeTree,
  blob: decodeBlob
};

function decodeCommit(result) {
  return {
    tree: result.tree.sha,
    parents: result.parents.map(pickSha),
    author: pickPerson(result.author),
    committer: pickPerson(result.committer),
    message: result.message
  };
}

function decodeTag(result) {
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
  return result.tree.map(function (entry) {
    typeCache[entry.sha] = entry.type;
    return {
      mode: parseInt(entry.mode, 8),
      name: entry.path,
      hash: entry.sha
    };
  });
}

function decodeBlob(result) {
  if (result.encoding === 'base64') {
    return bops.from(result.content.replace(/\n/g, ''), 'base64');
  }
  if (result.encoding === 'utf-8') {
    return bops.from(result.content, 'utf8');
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

function pickSha(object) {
  return object.sha;
}
