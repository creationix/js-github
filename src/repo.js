var xhr = require('./xhr.js');

module.exports = function (root, accessToken) {
  var request = xhr(root, accessToken);
  var repo = {
    apiGet: request.bind(null, "GET"),
    apiPost: request.bind(null, "POST"),
    apiPatch: request.bind(null, "PATCH"),
    apiDelete: request.bind(null, "DELETE"),
  };

  require('./objects.js')(repo);

  require('./refs.js')(repo);

  require('js-git/mixins/walkers.js')(repo);

  return repo;

};
