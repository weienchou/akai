/*
 * Worker-related tasks
 */

// Dependencies
const fs = require('fs');
const path = require('path');

const http = require('http');
const https = require('https');

const _data = require('./data');
const helpers = require('./helpers');
// const config = require('./config');
const url = require('url');

// Instantiate the worker object

let workers = {};

workers.gatherAllChecks = () => {
    _data.list('checks', (err, checks) => {
        if (!err && checks && checks.length > 0) {
            checks.forEach((check) => {
                // Read check
                _data.read('checks', check, (err, originalCheckData) => {
                    if (!err && originalCheckData) {
                        // pass it, check
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.error('Error Reading one of check\'s data.',err);
                    }
                });
            });
        } else {
            console.error('Error: Could not find any checks to process');
        }
    });
}

workers.validateCheckData = (originalCheckData) => {
    originalCheckData = typeof(originalCheckData) === 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof(originalCheckData.id) === 'string' && originalCheckData.id.length === 22 ? originalCheckData.id.trim() : false;
    originalCheckData.name = typeof(originalCheckData.name) === 'string' && originalCheckData.name.length > 0 ? originalCheckData.name.trim() : false;

    originalCheckData.portocoal = typeof(originalCheckData.portocoal) === 'string' && ['http', 'https'].indexOf(originalCheckData.portocoal) > -1 ? originalCheckData.portocoal : false;
    originalCheckData.url = typeof(originalCheckData.url) === 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof(originalCheckData.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method : false;
    originalCheckData.successCodes = typeof(originalCheckData.successCodes) === 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : false;
    originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) === 'number' && (originalCheckData.timeoutSeconds % 1 === 0) && originalCheckData.timeoutSeconds > 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    originalCheckData.state = typeof(originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // if all the checks pass 
    if (originalCheckData.id &&
        originalCheckData.name && originalCheckData.portocoal &&
        originalCheckData.url && originalCheckData.method &&
        originalCheckData.successCodes && originalCheckData.timeoutSeconds &&
        originalCheckData.state && originalCheckData.lastChecked) {
        workers.performCheck(originalCheckData);
    } else {
        console.error('Error: One of the checks is not properly formatted, skipping it.');
    }
};

workers.performCheck = (originalCheckData) => {
    // prepare init check outcome
    let checkOutcome = {
        error: false,
        responseCode: false,
    };

    let outcomeSent = false;

    // parse the hostname
    const parsedUrl = url.parse(originalCheckData.portocoal + '://' + originalCheckData.url, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path; // for query string

    // Construct the request
    const requestDetail = {
        protocal: originalCheckData.portocoal + ':',
        hostname: hostName,
        method: originalCheckData.method.toUpperCase(),
        path: path,
        timeout: originalCheckData.timeoutSeconds * 1000,
    };

    const _moduleToUse = originalCheckData.portocoal === 'http' ? http : https;
    const req = _moduleToUse.request(requestDetail, (res) => {
        const status = res.statusCode;

        checkOutcome.responseCode = status;

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

        // if (originalCheckData.successCodes.indexOf(status) > -1) {
        //     callback(false);
        // } else {
        //     callback('Error status code: ' + status);
        // }
    });

    req.on('error', (e) => {
        checkOutcome.error = {
            error: true,
            value: e,
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.on('timeout', (e) => {
        checkOutcome.error = {
            error: true,
            value: 'timeout',
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    req.end();
};

workers.processCheckOutcome = (originalCheckData, checkOutcome) => {
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    // update the check data
    const newCheckData = originalCheckData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, (err) => {
        if (!err) {
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.error('checkOutcome has not changed, so no alert');
            }
        } else {
            console.error('Error: trying to save updates');
        }
    })
};

workers.alertUserToStatusChange = (newCheckData) => {
    const msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' +
        newCheckData.portocoal + '://' + newCheckData.url + ' is currently ' + newCheckData.state;

    helpers.sendSms(newCheckData.name, msg, (err) => {
        if (!err) {
            console.log('Success: User was alerted to status change ', msg);
        } else {
            console.error('Error: Could not send sms alert.');
        }
    });
}

// timer to execute the worker-process once per minute
workers.loop = () => {
    setInterval(() => {
        workers.gatherAllChecks();
    }, 1000 * 60);
}

// init Script
workers.init = () => {
    // Execute all the checks
    workers.gatherAllChecks();

    // Call the loop so the checks will execute late on 
    workers.loop();
};



workers.init();

module.exports = workers;