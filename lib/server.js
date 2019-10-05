/*
 * Server-releated tasks
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// instantiate the server module object
const server = {};

// instantite the https server
server.httpsServerOPtions = {
    key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

// instantite the http server
server.httpServer = http.createServer((req, res) => {
    server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(server.httpsServerOPtions, (req, res) => {
    server.unifiedServer(req, res);
});

// all the server logic both http and https server
server.unifiedServer = (req, res) => {
    // get url and parse it
    const parsedUrl = url.parse(req.url, true);

    // get path
    const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

    // get Method
    const method = req.method.toLowerCase();

    // get Query object
    const query = parsedUrl.query;

    // get header object
    const headers = req.headers;

    // get payload
    const decoder = new stringDecoder('utf-8');
    let buffer = '';

    req.on('data', (data) => {
        buffer += decoder.write(data);
    });

    req.on('end', () => {
        buffer += decoder.end();

        // choose the handler for this request
        const chosenHandler = typeof(server.router[path]) !== 'undefined' ? server.router[path] : handlers.nofound;

        // construct the data object
        const data = {
            path: path,
            query: query,
            method: method,
            headers: headers,
            payload: helpers.parseJsonToObject(buffer),
        }

        // route the request
        chosenHandler(data, (statusCode, payload) => {
            // use staus code called back by the handler, or default 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            // use the payload called back by the handler, or defalt to empty object 
            payload = typeof(payload) === 'object' ? payload : {};

            // convert the payload to a string
            const payloadString = JSON.stringify(payload);

            // send response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log it
            console.log('Response:', statusCode, payloadString);
        });
    });
}

// router
server.router = {
    status: handlers.status,
    users: handlers.users,
    tokens: handlers.tokens,
    checks: handlers.checks,
};

// init script
server.init = () => {
    // Start http Server 
    server.httpServer.listen(config.httpPort, () => {
        console.log('server:: run on port ' + config.httpPort);
    });

    // Start https Server 
    server.httpsServer.listen(config.httpsPort, () => {
        console.log('server:: run on port ' + config.httpsPort);
    });
}

module.exports = server;