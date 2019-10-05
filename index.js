/*
 * Primany file for the API
 */

// Dependencies
const server = require('./lib/server');
const workers = require('./lib/workers');

// Declare the app
let app = {};

// init funciton 

app.init = () => {
    // start the server
    server.init();

    // start the workders
    workers.init();  
}

// execute;
app.init();

// export the app
module.exports = app;