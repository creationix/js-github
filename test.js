var domBuilder = require('dombuilder');
var jsGithub = require('./src/repo.js');
var getMime = require('simple-mime')('application/octet-stream');

var accessToken = localStorage.getItem("accessToken");
if (!accessToken) {
  accessToken = prompt("Enter personal access token from https://github.com/settings/applications");
  if (!accessToken) throw new Error("Aborted by user");
  localStorage.setItem("accessToken", accessToken);
}

var $ = {};
document.body.textContent = "";
document.body.appendChild(domBuilder([
  ["nav", "Repos",["ul$0"]],
  ["nav", "Refs", ["ul$1"]],
  ["nav$n1", "Commits", ["ul$2"]],
  ["nav$n2", "Files", ["ul$3"]],
  [".body$4"]
], $));

window.addEventListener("resize", function () {
  var evt = new window.Event('scroll');
  $.n1.dispatchEvent(evt);
  $.n2.dispatchEvent(evt);
}, false);

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
  fixedList(0, repos, function (repo) {
    repo.onCommitStream = onCommitStream.bind(repo);
    repo.onRefs = onRefs.bind(repo);
    return ["li.row", repo.name];
  }, function (repo) {
    repo.listRefs("", repo.onRefs);
  }, function (root) {
    return jsGithub(root, accessToken);
  }, "user/project");
}

function onRefs(err, refs) {
  if (err) throw err;
  var repo = this;
  var names = Object.keys(refs);
  names.unshift("HEAD");
  refs.HEAD = "HEAD";
  fixedList(1, names, function (name) {
    return ["li.row", {title: refs[name]}, name];
  }, function (name) {
    loadAny(repo, refs[name]);
  });
}

function loadAny(repo, hash) {
  var type = repo.typeCache[hash] || "commit";
  if (type === "commit") return repo.logWalk(hash, repo.onCommitStream);
  if (type === "tag") {
    return repo.loadAs("tag", hash, function (err, tag) {
      if (err) throw err;
      console.log("Annotated tag", tag);
      loadAny(repo, tag.object);
    });
  }
  if (type === "tree") {
    clear(2);
    return repo.treeWalk(hash, onFileStream);
  }
  if (type === "blob") {
    clear(2);
    return repo.loadAs("blob", hash, function (err, blob) {
      if (err) throw err;
      onFile({
        name: "",
        body: blob
      });
    });
  }
}


function onCommitStream(err, commitStream) {
  if (err) throw err;
  var repo = this;

  dynamicList(2, commitStream, function (commit) {
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

  dynamicList(3, fileStream, function (entry) {
    if (entry.type !== "blob") return;
    return ["li.row", {title: entry.hash}, entry.path ];
  }, onFile);
}

function onFile(entry) {
  clear(4);
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
}

function clear(index) {
  while (index <= 4) $[index++].textContent = "";
}

function showText(entry, text) {
  $[4].appendChild(domBuilder([
    ["pre", ["textarea.fill", text]]
  ]));
}

function showBinary(entry, mime) {
  var blob = new Blob([entry.body], {type: mime});
  var url = window.URL.createObjectURL(blob);
  $[4].appendChild(domBuilder(
    ["img", {src:url}]
  ));
}

function fixedList(index, list, formatter, onclick, onadd, placeholder) {
  var selected = null;
  var last;
  var ul = $[index];
  clear(index);
  list.forEach(onItem);
  if (onadd) {
    last = domBuilder(["form",
      {
        onsubmit: function (evt) {
          evt.preventDefault();
          evt.stopPropagation();
          var item = onadd(this.root.value);
          this.root.value = "";
          onItem(item);
        }
      }, ["input", {name: "root", placeholder: placeholder}]
    ]);
    ul.appendChild(last);
  }
  function onItem(item) {
    var child = domBuilder(formatter(item));
    child.onclick = function (evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (selected) selected.classList.remove("selected");
      selected = child;
      selected.classList.add("selected");
      onclick(item);
    };
    if (last) ul.insertBefore(child, last);
    else ul.appendChild(child);
  }
}

function dynamicList(index, stream, formatter, onclick) {
  var ul = $[index];
  clear(index);
  var container = ul.parentElement;
  var selected = null;
  container.onscroll = onScroll;
  var bottom = 0;
  var height = container.offsetHeight + container.scrollTop;
  var loading = false;
  check();

  function onRead(err, item) {
    loading = false;
    if (err) throw err;
    if (!item) return;
    var json = formatter(item);
    if (!json) {
      loading = true;
      return stream.read(onRead);
    }
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
