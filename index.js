"use strict";
var api = require('./api.js');


module.exports = {
  api: {
    login: api.login,
    getPerson: api.getPerson,
    getRelatives: api.getRelatives,

    getUserId: api.getUserId
  }
};
