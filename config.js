/*
 * Create and export confg varables
 */

const env = {};

env.develop = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'develop',

};

env.staging = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'staging',

};

env.production = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'production',

};

// Determine which env was passed as a command-line args
const currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check the currentEnv is one of the env above, if not, default develop
const envToExport = typeof(env[currentEnv]) === 'object' ? env[currentEnv] : env.develop;

// Export the module
module.exports = envToExport;