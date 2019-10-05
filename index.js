// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// instantite the http server
const httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start http Server 
httpServer.listen(config.httpPort, () => {
    console.log('server:: run on port ' + config.httpPort);
});

// instantite the https server
const httpsServerOPtions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem'),
};
const httpsServer = https.createServer(httpsServerOPtions, (req, res) => {
    unifiedServer(req, res);
});

// Start https Server 
httpsServer.listen(config.httpsPort, () => {
    console.log('server:: run on port ' + config.httpsPort);
});

// all the server logic both http and https server
const unifiedServer = (req, res) => {
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
        const chosenHandler = typeof(router[path]) !== 'undefined' ? router[path] : handlers.nofound;

        // construct the data object
        const data = {
            path: path,
            query: query,
            method: method,
            headers: headers,
            payload: buffer,
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

// handlers
const handlers = {};

handlers.sample = (data, callback) => {
    // callback a http status code, and a payload object
    callback(406, { name: 'sample handler' });
};

handlers.nofound = (data, callback) => {
    callback(404);
};

// router
const router = {
    'sample': handlers.sample,
};