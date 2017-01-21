api = require('../index').api;
var argv = require('minimist')(process.argv.slice(2));

try {
  var p = api.login(argv['user'], argv['pass']).
    then(function(sess) {
      console.log("Login returns:"+JSON.stringify(sess));
      var uid = api.getUserId(sess);
      console.log("UID:"+uid);
      if (uid) {
        api.getPerson(sess, uid, ['Id', 'Name', 'BirthDate']).
          then(function(user) {
            console.log("USER:"+JSON.stringify(user));
            api.getRelatives(sess, [uid, '11041717'], null).
              then(function(info) {
                console.log("GETRELATIVES:"+JSON.stringify(info, null, '\t'));
              }, function(reason) {
                console.log("Get Relatives failed due to:"+reason);
              });
          }, function(reason) {
            console.log("Get Person failed due to:"+reason);
          });
      }
    }, function(reason) {
      console.log("Login failed due to:"+reason);
    });
} catch (e) {
  console.log("Failed on :"+e);
}
console.log("Goodby");
