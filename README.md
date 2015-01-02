js-github
=========

A js-git mixin that uses github as the data storage backend.

This allows live mounting of github repos without cloning or pushing.

It's implemented as a [js-git][] mixin that implements the storage backend
using Github's [Git Data][] API using REST calls.

This will work in the browser or in node.js.  Technically an access token isn't
required to read public repositories, but you will be rate-limited to a very
small amount of requests per hour.  With an auth token, you will be able to do
more, and depending on the access of the token you can read private repos or
write to repos.

I highly reccommend using a local cache in IndexedDB or LevelDB or something
available on your platform.  This way you never request resources you've asked
for before and can do more work without hitting the rate limit.

Here is a sample config for a chrome app that uses IDB for a local cache:

```js
// Start out the normal way with a plain object.
var repo = {};

// This only works for normal repos.  Github doesn't allow access to gists as
// far as I can tell.
var githubName = "creationix/js-github";

// Your user can generate these manually at https://github.com/settings/tokens/new
// Or you can use an oauth flow to get a token for the user.
var githubToken = "8fe7e5ad65814ea315daad99b6b65f2fd0e4c5aa";

// Mixin the main library using github to provide the following:
// - repo.loadAs(type, hash) => value
// - repo.saveAs(type, value) => hash
// - repo.listRefs(filter='') => [ refs ]
// - repo.readRef(ref) => hash
// - repo.updateRef(ref, hash) => hash
// - repo.createTree(entries) => hash
// - repo.hasHash(hash) => has
require('js-github/mixins/github-db')(repo, githubName, githubToken);

// Github has this built-in, but it's currently very buggy so we replace with
// the manual implementation in js-git.
require('js-git/mixins/create-tree')(repo);

// Cache github objects locally in indexeddb
require('js-git/mixins/add-cache')(repo, require('js-git/mixins/indexed-db'));

// Cache everything except blobs over 100 bytes in memory.
// This makes path-to-hash lookup a sync operation in most cases.
require('js-git/mixins/mem-cache')(repo);

// Combine concurrent read requests for the same hash
require('js-git/mixins/read-combiner')(repo);

// Add in value formatting niceties.  Also adds text and array types.
require('js-git/mixins/formats')(repo);
```

Note that this backend does not provide `loadRaw` or `saveRaw` and can't be used
with the `pack-ops` mixin required for clone, push, and pull.  The good news is
you don't need those since all changes are happening on github directly.  If you
want to "push" a new commit, simply update the ref on the repo and it will be
live.

So, here is an example to load `README.md` from an existing repo, change it to
all uppercase the save it back as a new commit.

```js
// I'm using generator syntax, but callback style also works.
// See js-git main docs for more details.
var run = require('gen-run');
run(function* () {
  var headHash = yield repo.readRef("refs/heads/master");
  var commit = yield repo.loadAs("commit", headHash);
  var tree = yield repo.loadAs("tree", commit.tree);
  var entry = tree["README.md"];
  var readme = yield repo.loadAs("text", entry.hash);

  // Build the updates array
  var updates = [
    {
      path: "README.md", // Update the existing entry
      mode: entry.mode,  // Preserve the mode (it might have been executible)
      content: readme.toUpperCase() // Write the new content
    }
  ];
  // Based on the existing tree, we only want to update, not replace.
  updates.base = commit.tree;

  // Create the new file and the updated tree.
  var treeHash = yield repo.createTree(updates);
```

At this point, the new data is live on github, but not visible as it if wasn't
pushed.  If we want to make the change permanent, we need to create a new commit
and move the master ref to point to it.

```js
  var commitHash = yield repo.saveAs("commit", {
    tree: treeHash,
    author: {
      name: "Tim Caswell",
      email: "tim@creationix.com"
    },
    parent: headHash,
    message: "Change README.md to be all uppercase using js-github"
  });

  // Now we can browse to this commit by hash, but it's still not in master.
  // We need to update the ref to point to this new commit.

  yield repo.updateRef("refs/heads/master", commitHash);
});
```

I tested this on this repo.  Here is the [commit](https://github.com/creationix/js-github/commit/b75c1114cdb5bc85b485b7f6d4cb830595c6cfc1)

[js-git]: https://github.com/creationix/js-git.git
[Git Data]: https://developer.github.com/v3/git/
