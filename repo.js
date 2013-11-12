var gXHR = require('./xhr.js');


module.exports = function (root) {
  var repo = {
    apiGet: function (template, callback) {
      gXHR.get(template.replace(":root", root), callback);
    },
    apiPost: function (template, body, callback) {
      gXHR.post(template.replace(":root", root), body, callback);
    },
    apiPatch: function (template, body, callback) {
      gXHR.patch(template.replace(":root", root), body, callback);
    }
  };

  require('./objects.js')(repo);

  require('./refs.js')(repo);

  require('js-git/mixins/walkers.js')(repo);

  return repo;

};
