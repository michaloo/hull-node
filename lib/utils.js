"use strict";

var crypto = require('crypto');

module.exports = {
  /**
   * Calculates the hash for a user so an external userbase can be linked to hull.io services
   *
   * @param {String} userId The id of the user.
   * @param {String} secret the app secret
   * @returns {String} The signed hash to identity the user.
   * @TODO Check if this works with only an email as the id
   * @TODO Check if this works with only a numeric id
   */
  signUserId: function (userId, secret) {
    var timestamp = Math.round(new Date().getTime() / 1000);
    var message   = (new Buffer(userId.toString())).toString('base64');
    var signature = crypto.createHmac('sha1', secret).update([message, timestamp].join(' ')).digest('hex');
    var parts = [
      message,
      signature,
      timestamp
    ];
    return parts.join(' ');
  },

  /**
   * Checks the signed userId - used in middleware to authenticate the current user locally via signed cookies.
   *
   * @param {String} userId.  the userId to check
   * @param {String} userSig. the signed userId
   * @param {String} secret the app secret
   * @returns {String|Boolean} the userId if the signature matched, false otherwise.
   */
  checkSignedUserId: function(userId, userSig, secret) {
    if (!userId || !userSig) { return false; }
    var sig       = userSig.split("."),
        time      = sig[0],
        signature = sig[1],
        digest    = crypto.createHmac('sha1', secret).update([time, userId].join("-")).digest('hex');

    if (digest === signature) {
      return userId;
    } else {
      return false;
    }
  }
};