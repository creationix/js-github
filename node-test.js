var accessToken = process.env.TOKEN;
var jsGithub = require('./src/repo.js');

var repo = jsGithub("creationix/js-github", accessToken);

repo.loadAs("commit", "HEAD", function (err, commit) {
  if (err) throw err;
  console.log("COMMIT", commit);
  repo.loadAs("tree", commit.tree, function (err, tree) {
    if (err) throw err;
    console.log("TREE", tree);
  });
});

