var domBuilder = require('dombuilder');
var jsGithub = require('./src/repo.js');
var getMime = require('simple-mime')('application/octet-stream');

var accessToken = localStorage.getItem("accessToken");
if (!accessToken) {
  accessToken = prompt("Enter access token");
  if (!accessToken) throw new Error("Aborted by user");
  localStorage.setItem("accessToken", accessToken);
}

var $ = {};
document.body.appendChild(domBuilder([
  ["nav.repos", ["ul$repos"]],
  ["nav.refs", ["ul$refs"]],
  ["nav.history", ["ul$history"]],
  ["nav.tree", ["ul$tree"]],
  [".body$body"]
], $));

renderRepos([
  jsGithub("creationix/conquest", accessToken),
  jsGithub("creationix/exploder", accessToken),
  jsGithub("creationix/js-github", accessToken),
  jsGithub("creationix/js-git", accessToken),
  jsGithub("creationix/dombuilder", accessToken),
  jsGithub("creationix/simple-mime", accessToken),
  jsGithub("creationix/luv", accessToken),
  jsGithub("luvit/luvit", accessToken),
  jsGithub("joyent/node", accessToken),
  jsGithub("joyent/libuv", accessToken),
]);

function renderRepos(repos) {
  fixedList($.repos, repos, function (repo) {
    repo.onCommitStream = onCommitStream.bind(repo);

    return ["li.row", repo.name];
  }, function (repo) {
    console.log("repo", repo);
    repo.logWalk("HEAD", repo.onCommitStream);
  });
}


function onCommitStream(err, commitStream) {
  if (err) throw err;
  var repo = this;

  dynamicList($.history, commitStream, function (commit) {
    var title = commit.hash +
         "\n" + commit.author.name + " - " + commit.author.date.toString() +
         "\n" + commit.message;
    return ["li.row", {title: title },
      [".message", commit.message.split("\n")[0]],
      [".date", commit.author.date.toDateString()],
    ];
  }, function onClick(commit) {
    repo.treeWalk(commit.tree, onFileStream);
  });
}

function onFileStream(err, fileStream) {
  if (err) throw err;

  dynamicList($.tree, fileStream, function (entry) {
    if (entry.type !== "blob") return;
    return ["li.row", {title: entry.hash}, entry.path ];
  }, function onClick(entry) {
    $.body.textContent = "";
    var mime = getMime(entry.name);
    if (/^image\//.test(mime)) return showBinary(entry, mime);
    var isText = true;
    var text = "";
    for (var i = 0, l = entry.body.length; i < l; i++) {
      var byte = entry.body[i];
      if (entry.body[i] & 0x80) {
        isText = false;
        break;
      }
      text += String.fromCharCode(byte);
    }
    if (isText) return showText(entry, text);
    showBinary(entry, mime);
  });
}

function showText(entry, text) {
  $.body.appendChild(domBuilder([
    ["pre", ["textarea.fill", text]]
  ]));
}

function showBinary(entry, mime) {
  var blob = new Blob([entry.body], {type: mime});
  var url = window.URL.createObjectURL(blob);
  $.body.appendChild(domBuilder(
    ["img", {src:url}]
  ));
}

function fixedList(ul, list, formatter, onclick) {
  var selected = null;
  ul.textContent = "";
  list.forEach(function (item) {
    var child = domBuilder(formatter(item));
    child.onclick = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (selected) selected.classList.remove("selected");
      selected = child;
      selected.classList.add("selected");
      onclick(item);
    };
    ul.appendChild(child);
  });
}

function dynamicList(ul, stream, formatter, onclick) {
  var container = ul.parentElement;
  var selected = null;
  container.onscroll = onScroll;
  ul.textContent = "";
  var bottom = 0;
  var height = container.offsetHeight + container.scrollTop;
  var loading = false;
  check();

  function onRead(err, item) {
    loading = false;
    if (err) throw err;
    if (!item) return;
    var json = formatter(item);
    if (!json) return stream.read(onRead);
    var child = domBuilder(json);
    child.onclick = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (selected) selected.classList.remove("selected");
      selected = child;
      selected.classList.add("selected");
      onclick(item);
    };
    ul.appendChild(child);
    bottom = child.offsetTop + child.offsetHeight;
    check();
  }

  function onScroll() {
    height = container.offsetHeight + container.scrollTop;
    check();
  }

  function check() {
    if (loading || (bottom > height)) return;
    loading = true;
    stream.read(onRead);
  }

}
