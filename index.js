/*
*  Primary file for the API
*
*
*/

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

// Instantiate the HTTP server
const httpServer = http.createServer(function(req, res) {
    unifiedServer(req, res);
});

// Start the server, and have it listen on port 3000
httpServer.listen(config.httpPort, function(){
    console.log(`Server is listening on port ${config.httpPort} in ${config.envName} mode`);
});


// Instantiate the HTTPS server
const httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem') ,
};
const httpsServer = https.createServer(httpsServerOptions, function(req, res) {
    unifiedServer(req, res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log(`Server is listening on port ${config.httpsPort} in ${config.envName} mode`);
});

// All the server logic for both the https and https server
const unifiedServer = function(req, res) {
    // Get the URL and parse it.
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    // Regex will replace trailing / from url foo/bar still works
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an Object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    const method = req.method.toUpperCase();

    // Get the Headers as an Object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function(){
        buffer += decoder.end();

        // Choose the handlers this request should go to if one is not found use the not found handler
        const choosenHandler = typeof(router[trimmedPath]) !== 'undefined'? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handlers
        const data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer,
        };

        // Route the request to the handler specified in the router
        choosenHandler(data, function(statudCode, payload){
            // User the status Code called back by the handler or default to 200
            statudCode = typeof(statudCode)  == 'number' ? statudCode: 200;

            // Use the payload called back by the handler or default to empty object
            payload = typeof(payload) == 'object' ? payload: {};

            // Convert the payload to a String
            const payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statudCode);
            res.end(payloadString);

            // Log the request path
            console.log('Request is received on path:' + trimmedPath +
                '\nwith method: ' + method +
                '\nwith these query string parameter:',  queryStringObject,
                '\nRequest received with these headers:', headers,
                '\nRequest received with this payload:', buffer,
                '\nReturning this response: ', statudCode, ' ', payloadString);
        });
    });
};

// Define a handlers
const handlers = {};

// Defining a handler for hello 
handlers.hello = function(data, callback) {
    // callback a HTTP status code, and payload object
    callback(200, {message: 'Hello World, Node Js is Powerfull and its Eating the world'});
};


handlers.notFound = function(data, callback) {
    callback(404)
};
// Not found handler

// Define a request router
const router = {
    hello: handlers.hello,
};