"use strict";

function session(user_id, user_name, user_password) {
    this.user_id    = user_id;
    this.user_name  = user_name;
    this.user_password  = user_password;
    this.loggedIn  = false;
    console.log("Session started for user:"  +
        this.user_id + "/" +
        this.user_name +
        " with password:" + this.user_password);
};
module.exports = {
 "session": session,
};
