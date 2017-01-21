var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var should = chai.should();
var assert = chai.assert;
var sinon = require('sinon');
var api = require('../index').api;
var ps = require('popsicle');

//"url":"http://apps.wikitree.com/api.php"
//"method":"POST"
//"dataType":"json"
///"body":{
// "action":"login",
// "email":"goodlogin@"
//  "password":"mysecret"}
// "transport":{"use":[null,null]},"headers":{"Content-Type":"application/x-www-form-urlencoded"}}

var login_intercept = function(req) {
    if (req.body.email == 'goodlogin@') {
        var res = {
            'body': JSON.stringify({
                'login': {
                    'token': 'abcdef',
                    'userid': '12345'
                }
            }),
            'status': 200
        }
    } else if (req.body.email == 'networkerr@') {
        return Promise.reject(new ps.PopsicleError('Unable to connect to "http://apps.wikitree.com/api.php"'));
    } else {
        var res = {
            'body': JSON.stringify({
                'login': {
                    'result': 'WrongPass'
                }
            }),
            'status': 200
        }
    }
    return Promise.resolve(res);
}
var getPerson_intercept = function(req) {
    //console.log("GETPERSON_INTERCEPT:" + JSON.stringify(req.body.key));
    if (req.body.key == '1') {
        var res = {
            body: JSON.stringify([{
                user_id: '1',
                person: {
                    Id: 1,
                    Name: "Test-1",
                    BirthDate: "1901-01-01",
                    status: '0'
                }
            }]),
            status: 200
        }
    } else if (req.body.key == 'networkerr') {
        console.log("Rejecting");
        return Promise.reject(new ps.PopsicleError('Network error'));
    } else {
        var res = {
            body: JSON.stringify([{
                user_id: req.body.key,
                status: "Invalid user"
            }]),
            status: 200,
            statusText: "OK"
        }
    }
    return Promise.resolve(res);
}

var getRelatives_intercept = function(req) {
    //console.log("GETRELATIVES_INTERCEPT:" + JSON.stringify(req, null, '\t'));
    if (req.body.keys == '1') {
        var res = {
            body: JSON.stringify([{
                items: [{
                  key: '1',
                  user_id: '1',
                  person: {
                    Id: '1',
                    parents: {
                      '2': {
                        Id: '2'
                      },
                      '3': {
                        Id: '3'
                      }
                    }
                  }
                }],
                status: '0'
              }]),
            status: 200,
            statusText: "OK"
        }
    } else if (req.body.keys == 'networkerr') {
        return Promise.reject(new ps.PopsicleError('Network error'));
    } else {
        var res = {
            body: JSON.stringify([{
                user_id: req.body.key,
                status: "Invalid user"
            }]),
            status: 200,
            statusText: "OK"
        }
    }
    return Promise.resolve(res);
}


var req_intercept = function(req) {
    //console.log("GET REQUEST:"+JSON.stringify(req));
    chai.assert(req.method == 'POST', 'req.method == post');
    chai.assert(req.dataType == 'json', 'req.dataType == json');
    if (req.body.action == 'login') {
        return login_intercept(req);
    } else if (req.body.action == 'getPerson') {
        return getPerson_intercept(req);
    } else if (req.body.action == 'getRelatives') {
      return getRelatives_intercept(req);
    } else {
        chai.assert(false, 'unknown action:' + req.body.action);
    }
    //return Promise.resolve(res);
}

var request = sinon.stub(ps, 'request', req_intercept);

describe('api:login', function() {
    //var request = sinon.stub(ps, 'request', goodlogin);

    it('fails misconfigured session', function() {
        s2 = api.login(null, null);
        return s2.should.be.rejected;
    });
    it('fails wrong credentials session', function() {
        s2 = api.login('badlogin@', 'password');
        return s2.should.be.rejected;
    });

    it('fails on network error', function() {
        s = api.login('networkerr@', 'password');
        return s.should.be.rejected;
    });

    it('login success attempt;', function() {
        s1 = api.login('goodlogin@', 'mysecret');
        //s1.should.be.an.instanceof(Promise);
        //console.log("CHECK:PROMISE:"+JSON.stringify(s1));
        return s1.should.eventually.have.property("_userid", "12345");
    });
    //console.log("Stub:"+(request.firstCall)? request.firstCall.args: null);
});

describe('api:getPerson', function() {
    var s1, p1;
    it('getPerson fails wrong sess;', function() {
        p1 = api.getPerson({}, '12344', null);

        return p1.should.be.rejected;
    });

    it('getPerson fails wrong userid', function() {
        s1 = api.login('goodlogin@', 'mysecret');
        return s1.then(function(sess) {
            p1 = api.getPerson(sess, '123', null)

            return p1.should.be.rejected;
        });
    });

    it('getPerson fails on network error', function() {
        s1 = api.login('goodlogin@', 'duh');
        return s1.then(function(sess) {
            p1 = api.getPerson(sess, '_networkerr', null)

            p1.should.be.rejected;
        })
    })
    it('getPerson success', function() {
        s1 = api.login('goodlogin@', 'mysecret');

        return s1.then(function(sess) {
            p1 = api.getPerson(sess, '1', null)
            return p1.should.eventually.have.property('Id', 1);
        });
    });


});

describe('api:getRelatives', function() {
    var s1, p1;
    it('getRelatives fails wrong sess;', function() {
        p1 = api.getRelatives({}, ['12344'], null);

        return p1.should.be.rejected;
    });

    it('getRelatives fails wrong key', function() {
        s1 = api.login('goodlogin@', 'mysecret');
        return s1.then(function(sess) {
            p1 = api.getRelatives(sess, ['123'], null)

            return p1.should.be.rejected;
        });
    });

    it('getRelatives fails wrong relations', function() {
        s1 = api.login('goodlogin@', 'mysecret');
        return s1.then(function(sess) {
            p1 = api.getRelatives(sess, ['123'], ['brothers'])

            return p1.should.be.rejected;
        });
    });


    it('getRelatives fails on network error', function() {
        s1 = api.login('goodlogin@', 'duh');
        return s1.then(function(sess) {
            p1 = api.getRelatives(sess, ['networkerr'], null)

            return p1.should.be.rejected;
        })
    })

    it('getRelatives success', function() {
        s1 = api.login('goodlogin@', 'mysecret');

        return s1.then(function(sess) {
            p1 = api.getRelatives(sess, ['1'], null)
            return Promise.all([
              p1.should.eventually.have.deep.property('[0].key'),
              p1.should.eventually.have.deep.property('[0].person.parents'),
            ]);
        });
    });


});
