/*
 * Lib for storing and editing data
 */

// Dependencies
const fs = require('fs');
const path = require('path');

// container for the module (exported)
let lib = {};

// base dir of the data folder
lib.base = path.join(__dirname, '../.data/');

lib.create = (dir, file, data, callback) => {
    // open the file for writing
    fs.open(lib.base + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            // Convert data to string
            let stringData = JSON.stringify(data);

            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (!err) {
                    fs.close(fileDescriptor, (err) => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file');
                        }
                    });
                } else {
                    callback('Error writing to new file');
                }
            })
        } else {
            callback('Could not create new file, it may already exists.');
        }
    });
};

lib.read = (dir, file, callback) => {
    fs.readFile(lib.base + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        callback(err, data);
    });
};

lib.update = (dir, file, data, callback) => {
    // open the file for writing
    fs.open(lib.base + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            let stringData = JSON.stringify(data);

            // Truncate the file
            fs.ftruncate(fileDescriptor, (err) => {
                if (!err) {
                    //write to the file and close it.
                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if (!err) {
                            fs.close(fileDescriptor, (err) => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Error closing the file.');
                                }
                            })
                        } else {
                            callback('Error writing to existing file.');
                        }
                    })
                } else {
                    callback('Error truncating file');
                }
            });
        } else {
            callback('Could not open the file for updating, it may not exist yet.')
        }
    });
};

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.base + dir + '/' + file + '.json', (err, data) => {
    	if(!err) {
    		callback(false);
    	} else {
    		callback('Error deleting file.');
    	}
    });
};

module.exports = lib;