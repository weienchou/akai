/*
 * Helpers for various tasks
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

const https = require('https');
const queryString = require('querystring');

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

helpers.sendSms = (phone, msg, callback) => {
    phone = typeof(phone) === 'string' && phone.trim().length == 9 ? phone.trim() : false;
    msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length < 160 ? msg.trim() : false;

    if (phone && msg) {
        const payload = {
            'From': config.twilio.fromPhone,
            'To': '+886' + phone,
            'Body': msg,
        };

        const stringPayload = JSON.stringify(payload);
        const requestDetail = {
            protocal: 'https:',
            hostname: 'api.twilio.com',
            method: 'post',
            path: '/2010-04-01/Accounts/' + config.twilio.accountID + '/Messages.json',
            auth: config.twilio.accountID + ':' + config.twilio.authToken,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload),
            }
        }

        const req = https.request(requestDetail, (res) => {
            const status = res.statusCode;
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                callback('Error status code: ' + status);
            }
        });

        req.on('error', (e) => {
            callback(e);
        });

        req.write(stringPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid.');
    }
};


module.exports = helpers;