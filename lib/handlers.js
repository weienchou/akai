/*
 * Request hanlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

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
                                callback(200);
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
    const id = typeof(data.query.id) === 'string' && data.query.id.trim().length > 0 ? data.query.id.trim() : false;
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
                callback(400, { msg: 'The specified user does not exist.' });
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
}

handlers.status = (data, callback) => {
    // callback a http status code, and a payload object
    callback(200);
};

handlers.nofound = (data, callback) => {
    callback(404);
};

module.exports = handlers;