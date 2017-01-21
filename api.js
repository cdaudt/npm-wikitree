"use strict";
var ps = require('popsicle');

const API_URL = "http://apps.wikitree.com/api.php";

const validFields = [
  'Id',
  'Name',
  'FirstName',
  'MiddleName',
  'LastNameAtBirth',
  'LastNameCurrent',
  'Nicknames',
  'LastNameOther',
  'RealName',
  'Prefix',
  'Suffix',
  'Gender',
  'BirthDate',
  'DeathDate',
  'BirthLocation',
  'DeathLocation',
  'BirthDateDecade',
  'DeathDateDecade',
  'Photo',
  'IsLiving',
  'Privacy',
  'Mother',
  'Father',
  'Parents',
  'Children',
  'Siblings',
  'Spouses',
  'Derived.ShortName',
  'Derived.BirthNamePrivate',
  'Derived.LongNamePrivate',
  'Creator',
  'Manager'
];

const validRelations = [
  'parents',
  'children',
  'siblings',
  'spouses'
]
function api_request(sess, body) {
  return ps.request({
    url: API_URL,
    method: 'POST',
    dataType: 'json',
    body: body,
    transport: ps.createTransport({
      jar: sess.jar
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  });
};

function check_resp(res, data) {
  //console.log("check_resp:"+JSON.stringify(data))
  if (res.status != 200) {
    console.log("Invalid status:"+ res.status);
    return false;
  }
  if (data.result == 'WrongPass') {
    return false;
  }

  return true;

};

function login(email, password) {
  var sess = {'jar': ps.jar() }
  if (!email || !password) {
    return Promise.reject("Unset username/password");
  }
  return api_request(sess, {
    'action': 'login',
    'email': email,
    'password': password
  })
  .then(function(res) {
    var data = JSON.parse(res.body);
    //console.log("LOGIN:THEN:"+res.status+':'+ res.body);

    if (!check_resp(res, data.login)) {
      //console.log("Login failed");
      return Promise.reject(new Error("Invalid response"));
    }
    return {
      'token': data.login.token,
      '_userid': data.login.userid,
      connected: true,
      'jar': sess.jar
    };
  }, function(reason) {
    //TODO: Better error to return?
    //console.log("Login rejected due to:"+reason);
    return Promise.reject(reason);
  });
};

function getPerson(sess, key, fields) {
  //console.log("GETPERSON:"+JSON.stringify(sess));
  if (!('connected' in sess)) {
    return Promise.reject(new Error("Not connected"));
  }
  if (fields == null) {
    // just get all valid fields
    fields = validFields;
  } else {
    //TODO: validate fields
  }
  //console.log("getperson for:"+key);

  return api_request(sess, {
    'action': 'getPerson',
    'fields': fields.join(','),
    'key': key,
    'token': sess.token
  })
  .then(function(res) {
    //console.log("gP:then:"+JSON.stringify(res));
    var data = JSON.parse(res.body)[0];
    if (res.status == 200 &&
        typeof data.user_id != "undefined" &&
        data.status != 'Invalid user') {
      //console.log("getperson success for user:"+data.user_id);
      return data.person;
    } else {
      //console.error("wikitree login error:"+res.status);
      if (res.status != 200) {
        return Promise.reject(new Error("Wrong status ("+res.status+")"));
      } else {
        return Promise.reject(new Error("Invalid body"));
      }
    }
  }, function(reason) {
    return Promise.reject(reason);
  });
};

function getRelatives(sess, keys, relations) {
  //console.log("GETPERSON:"+JSON.stringify(sess));
  if (!('connected' in sess)) {
    return Promise.reject(new Error("Not connected"));
  }
  if (!Array.isArray(keys)) {
    return Promise.reject(new Error("Keys must be array"));
  }
  if (relations == null) {
    // just get all valid relations
    relations = validRelations;
  } else {
    //TODO: validate relations
  }
  //console.log("getRelatives for:"+keys);
  var rel = {}
  relations.forEach(function(thisrel) {
    rel[thisrel] = true;
  });
  return api_request(sess, {
    'action': 'getRelatives',
    'getParents': relations['parents'] ? 'true': 'false',
    'getChildren': relations['children'] ? 'true': 'false',
    'getSiblings': relations['siblings'] ? 'true': 'false',
    'getSpouse': relations['spouses'] ? 'true': 'false',
    'keys': keys.join(','),
    'token': sess.token
  })
  .then(function(res) {
    //console.log("gR:then:"+JSON.stringify(res, null, '\t'));
    var data = JSON.parse(res.body)[0];
    //console.log("then:"+JSON.stringify(data, null, '\t'));
    if (res.status == 200 &&
        res.statusText == 'OK' &&
        data.status == '0') {
      //console.log("getperson success for user:"+data.user_id);
      return data.items;
    } else {
      //console.error("wikitree login error:"+res.status);
      if (res.status != 200) {
        return Promise.reject(new Error("Wrong status ("+res.status+")"));
      } else {
        return Promise.reject(new Error("Invalid body"));
      }
    }
  }, function(reason) {
    return Promise.reject(reason);
  });
};

function getUserId(token) {
  return token._userid;
}

module.exports = {
  // API Calls
  login: login,
  getPerson: getPerson,
  getRelatives: getRelatives,

  // Helper functions
  getUserId: getUserId
};
