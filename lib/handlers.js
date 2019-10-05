/*
 * Request hanlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

// handlers
let handlers = {};

handlers.users = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the users submethods
handlers._users = {};

// Required data: name, password, tosAgreement
// optional data: none
handlers._users.post = (data, callback) => {
    const name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

    if (name && password && tosAgreement) {
        // check the user is exist
        _data.read('users', name, (err, data) => {
            if (err) {
                // hash password
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    let userObject = {
                        name: name,
                        password: hashedPassword,
                        tosAgreement: tosAgreement,
                    };

                    _data.create('users', name, userObject, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { msg: 'Could not create the user.' });
                        }
                    });
                } else {
                    callback(500, { msg: 'Could not hash the user password' });
                }
            } else {
                callback(400, { msg: 'A user already exist.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

// Required data: name
// optional data: none
handlers._users.get = (data, callback) => {
    const name = typeof(data.query.name) === 'string' && data.query.name.trim().length > 0 ? data.query.name.trim() : false;
    if (name) {
        let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, name, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', name, (err, data) => {
                    if (!err && data) {
                        delete data.password;
                        callback(200, data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403, { msg: 'Missing required token in header.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

// Required data: name
// optional data: password
handlers._users.put = (data, callback) => {
    const name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    // const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

    if (name && password) {
        let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, name, (tokenIsValid) => {
            if (tokenIsValid) {
                // if (password) {
                _data.read('users', name, (err, userData) => {
                    if (!err && userData) {
                        // if (password) {
                        const hashedPassword = helpers.hash(password);
                        userData.password = hashedPassword;
                        // }

                        _data.update('users', name, userData, (err) => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { msg: 'Could not update the user.' });
                            }
                        });
                    } else {
                        callback(400, { msg: 'The specified user does not exist.' });
                    }
                });
            } else {
                callback(403, { msg: 'Missing required token in header.' });
            }
        });
        // } else {
        //     callback(400, { msg: 'Missing fields to update.' });
        // }
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

handlers._users.delete = (data, callback) => {
    const name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    if (name) {
        let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, name, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', name, (err, userData) => {
                    if (!err && userData) {
                        _data.delete('users', name, (err) => {
                            if (!err) {
                                const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checkToDelete = userChecks.length;

                                if (checkToDelete > 0) {
                                    let checkDeleted = 0;
                                    let deletionError = false;

                                    userChecks.foreach((checkID) => {
                                        _data.delete('checks', checkID, (err) => {
                                            if (err) {
                                                deletionError = true;
                                            }

                                            checkDeleted++;

                                            if (checkDeleted === checkToDelete) {
                                                if (!deletionError) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { msg: 'Errors encountered while attempting to delete all the user\'s checks' });
                                                }
                                            }
                                        });
                                    });
                                } else {
                                    callback(200);
                                }
                            } else {
                                callback(500, { msg: 'Could not delete the user.' });
                            }
                        });
                    } else {
                        callback(400, { msg: 'The specified user does not exist.' });
                    }
                });
            } else {
                callback(403, { msg: 'Missing required token in header.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

handlers.tokens = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the tokens submethods
handlers._tokens = {};

// Required data: name, password
// optional data: none
handlers._tokens.post = (data, callback) => {
    const name = typeof(data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (name && password) {
        // check the user is exist
        _data.read('users', name, (err, userData) => {
            if (!err && userData) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword === userData.password) {
                    const tokenID = helpers.createRandomString(20);
                    const expires = Date.now() + 100 * 60 * 60;

                    const tokenObject = {
                        name: name,
                        id: tokenID,
                        expires: expires,
                    };

                    _data.create('tokens', tokenID, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject);
                        } else {
                            callback(500, { msg: 'Could not create a token' });
                        }
                    })

                } else {
                    callback(400, { msg: 'Password did not match.' });
                }
            } else {
                callback(400, { msg: 'The specified user does not exist.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

// Required data: id
// optional data: none
handlers._tokens.get = (data, callback) => {
    const id = typeof(data.query.id) === 'string' && data.query.id.trim().length == 20 ? data.query.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

// Required data: id, extend
// optional data: none
handlers._tokens.put = (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
    const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend ? data.payload.extend : false;

    if (id && extend) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                // callback(200, tokenData);
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 100 * 60 * 60;

                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { msg: 'The token has already expired.' });
                        }
                    });
                } else {
                    callback(400, { msg: 'The token has already expired.' });
                }
            } else {
                callback(400, { msg: 'The specified user does not exist.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

handlers._tokens.delete = (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { msg: 'Could not delete the specified token.' });
                    }
                });
            } else {
                callback(400, { msg: 'The specified token does not exist.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

// verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, name, callback) => {
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.name === name && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Checks
handlers.checks = (data, callback) => {
    let acceptableMethods = ['post', 'get', 'put', 'delete'];

    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }
};

// container for the checks submethods
handlers._checks = {};

// Required data: portocoal, url, method, successCodes, timeoutSeconds
// optional data: none
handlers._checks.post = (data, callback) => {
    const portocoal = typeof(data.payload.portocoal) === 'string' && ['http', 'https'].indexOf(data.payload.portocoal) > -1 ? data.payload.portocoal : false;
    const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && (data.payload.timeoutSeconds % 1 === 0) && data.payload.timeoutSeconds > 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (portocoal && url && method && successCodes && timeoutSeconds) {
        let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                const name = tokenData.name;

                _data.read('users', name, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

                        if (userChecks.length < config.maxChecks) {
                            const checkID = helpers.createRandomString(22);
                            const checkObject = {
                                id: checkID,
                                userName: name,
                                portocoal: portocoal,
                                url: url,
                                method: method,
                                successCodes: successCodes,
                                timeoutSeconds: timeoutSeconds,
                            };

                            _data.create('checks', checkID, checkObject, (err) => {
                                if (!err) {
                                    userData.checks = userChecks;
                                    userData.checks.push(checkID);

                                    _data.update('users', name, userData, (err) => {
                                        if (!err) {
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, { msg: 'Could not update the user with the new check.' });
                                        }
                                    });
                                } else {
                                    callback(500, { msg: 'Could not create the checks.' });
                                }
                            });
                        } else {
                            callback(400, { msg: 'The user already has a maximum number of checks (' + config.maxChecks + ').' });
                        }
                    } else {
                        callback(403);
                    }
                });
            } else {
                callback(403);
            }
        });

        // handlers._tokens.verifyToken(token, name, (tokenIsValid) => {
        //     if (tokenIsValid) {

        //     } else {
        //         callback(403, { msg: 'Missing required token in header.' });
        //     }
        // });
    } else {
        callback(400, { msg: 'Missing required fields or inputs are invalid.' });
    }
};

handlers._checks.get = (data, callback) => {
    const id = typeof(data.query.id) === 'string' && data.query.id.trim().length == 22 ? data.query.id.trim() : false;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userName, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, checkData);
                    } else {
                        callback(403, { msg: 'Missing required token in header.' });
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

handlers._checks.put = (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length == 22 ? data.payload.id.trim() : false;

    const portocoal = typeof(data.payload.portocoal) === 'string' && ['http', 'https'].indexOf(data.payload.portocoal) > -1 ? data.payload.portocoal : false;
    const url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    const method = typeof(data.payload.method) === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && (data.payload.timeoutSeconds % 1 === 0) && data.payload.timeoutSeconds > 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (id) {
        if (portocoal || url || method || successCodes || timeoutSeconds) {
            _data.read('checks', id, (err, checkData) => {
                if (!err && checkData) {
                    let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                    handlers._tokens.verifyToken(token, checkData.userName, (tokenIsValid) => {
                        if (tokenIsValid) {

                            if (portocoal) {
                                checkData.portocoal = portocoal;
                            }

                            if (url) {
                                checkData.url = url;
                            }

                            if (method) {
                                checkData.method = method;
                            }

                            if (successCodes) {
                                checkData.successCodes = successCodes;
                            }

                            if (timeoutSeconds) {
                                checkData.timeoutSeconds = timeoutSeconds;
                            }

                            _data.update('checks', id, checkData, (err) => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500, { msg: 'Could not create the checks.' });
                                }
                            });

                        } else {
                            callback(403, { msg: 'Missing required token in header.' });
                        }
                    });
                } else {
                    callback(404);
                }
            });
        } else {
            callback(400, { msg: 'Missing field to update.' });
        }
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};

handlers._checks.delete = (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;
    if (id) {
        _data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                let token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
                handlers._tokens.verifyToken(token, checkData.userName, (tokenIsValid) => {
                    if (tokenIsValid) {
                        _data.read('users', checkData.userName, (err, userData) => {
                            if (!err && userData) {
                                const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                                const checkPositon = userChecks.indexOf(id);

                                if (checkPositon > -1) {
                                    userChecks.splice(checkPositon, 1);

                                    userData.checks = userChecks;
                                    _data.update('users', checkData.userName, userData, (err) => {
                                        if (!err) {
                                            _data.delete('checks', id, (err) => {
                                                if (!err) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { msg: 'Could not delete the specified check but its removed from the user.' });
                                                }
                                            });
                                        } else {
                                            callback(500, { msg: 'Could not update the user with the check.' });
                                        }
                                    });
                                } else {
                                    callback(500, { msg: 'Could not find the specified check on this user.' });
                                }

                            } else {
                                callback(500, { msg: 'Could not find the specified user.' });
                            }
                        });

                    } else {
                        callback(403, { msg: 'Missing required token in header.' });
                    }
                });
            } else {
                callback(400, { msg: 'The specified check does not exist.' });
            }
        });
    } else {
        callback(400, { msg: 'Missing required fields.' });
    }
};


handlers.status = (data, callback) => {
    // callback a http status code, and a payload object
    callback(200);
};

handlers.nofound = (data, callback) => {
    callback(404);
};

module.exports = handlers;