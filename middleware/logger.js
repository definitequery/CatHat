function appLogger(request, response) {
    console.log(`    Application ${process.env.APP_NAME} v${process.env.APP_VERS} on port ${process.env.APP_PORT} received request
    |   Client IP: ${request.ip}
    |   Type: ${request.protocol}
    |   Method: ${request.method}
    |   Timestamp: ${new Date().toISOString()}`);
    request.next();
}

module.exports = appLogger;