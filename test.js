var domBuilder = require('dombuilder');
var jsGithub = require('./src/repo.js');

var accessToken = localStorage.getItem("accessToken");
if (!accessToken) {
  accessToken = prompt("Enter access token");
  if (!accessToken) throw new Error("Aborted by user");
  localStorage.setItem("accessToken", accessToken);
}

var repo = jsGithub("creationix/conquest", accessToken);
var commitStream, fileStream;

console.log(repo);

var $ = {};
document.body.appendChild(domBuilder([
  ["nav.history", ["ul$history"]],
  ["nav.tree", ["ul$tree"]],
], $));

repo.logWalk("HEAD", onCommitStream);

function onCommitStream(err, result) {
  if (err) throw err;
  commitStream = result;
  commitStream.read(onCommitRead);
}

function onCommitRead(err, commit) {
  if (err) throw err;
  if (!commit) return;
  $.history.appendChild(domBuilder([
    ["li.row", { onclick: onClick },
      [".message", {title: commit.message}, commit.message.split("\n")[0]],
      [".date", {title: commit.author.name + " - " + commit.author.date.toString() }, commit.author.date.toDateString()],
    ]
  ]));
  console.log(commit);
  commitStream.read(onCommitRead);
  function onClick(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    repo.treeWalk(commit.tree, onFileStream);
  }
}

function onFileStream(err, result) {
  if (err) throw err;
  fileStream = result;
  fileStream.read(onFileRead);
}

function onFileRead(err, entry) {
  if (err) throw err;
  console.log("FILE", entry);
}
