// Dependencies
const http = require('http');
const url = require('url');
const stringDecoder = require('string_decoder').StringDecoder;

// Set Server Response
const server = http.createServer((req, res) => {
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
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log it
            console.log('Response:', statusCode, payloadString);
        });
    });
});

// Start Server 
server.listen(80, () => {
    console.log('server:: run on port 80.');
});

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