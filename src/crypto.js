'use strict';

import _ from 'lodash';
import crypto from'crypto';
import jwt from 'jwt-simple';


function getSecret(config = {}, secret) {
  return secret || config.accessToken || config.platformSecret;
}
function sign(config, data) {
  if (!_.isString(data)) {
    throw new Error('Signatures can only be generated for Strings');
  }
  const sha1 = getSecret(config);
  return crypto
  .createHmac('sha1', sha1)
  .update(data)
  .digest('hex');
}
function checkConfig(config) {
  if (!config || !_.isObject(config) || !config.platformId || !config.platformSecret) {
    throw new Error(`invalid config in Crypto: ${JSON.stringify(config)}`);
  }
}

function buildToken(config, claims = {}) {
  if (claims.nbf) { claims.nbf = Number(claims.nbf);}
  if (claims.exp) { claims.exp = Number(claims.exp);}
  const iat = Math.floor(new Date().getTime() / 1000);
  const claim = {
    iss: config.platformId,
    iat: iat,
    exp: iat + 600,
    ...claims
  };
  return jwt.encode(claim, getSecret(config));
}

module.exports = {
  sign(config, data) {
    checkConfig(config);
    return sign(config, data);
  },
  /**
   * Calculates the hash for a user so an external userbase can be linked to hull.io services
   *
   * @param {Object} config object
   * @param {Object} user object or user ID as string
   * @param {Object} additionnal claims
   * @returns {String} The jwt token to identity the user.
   */
  userToken(config, user = {}, claims = {}) {
    checkConfig(config);
    if (_.isString(user)) {
      if (!user) { throw new Error('Missing user ID'); }
      claims.sub = user;
    } else {
      if (!_.isObject(user) || !user.email) {
        throw new Error('you need to pass a User hash with an `email` field');
      }
      claims['io.hull.user'] = user;
    }
    return buildToken(config, claims);
  },

  /**
   * Checks the signed userId - used in middleware to authenticate the current user locally via signed cookies.
   *
   * @param {String} userId.  the userId to check
   * @param {String} userSig. the signed userId
   * @returns {String|Boolean} the userId if the signature matched, false otherwise.
   */
  currentUserId(config, userId, userSig) {
    checkConfig(config);
    if (!userId || !userSig) { return false; }
    const [time, signature] = userSig.split('.');
    const data = [time, userId].join('-');
    return sign(config, data) === signature;
  }


};