/*
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
let helpers = {};

helpers.hash = (str) => {
    if (typeof(str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

helpers.parseJsonToObject = (str) => {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
};

helpers.createRandomString = (stringLength) => {
    stringLength = typeof(stringLength) === 'number' && stringLength > 0 ? stringLength : false;
    if (stringLength) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        let randomString = '';
        for (let i = 1; i <= stringLength; i++) {
            let randomChar = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

            randomString += randomChar;
        }

        return randomString;
    } else {
        return false;
    }
};


module.exports = helpers;