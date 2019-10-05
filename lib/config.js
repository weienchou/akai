/*
 * Create and export confg varables
 */

const env = {};

env.develop = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'develop',
    hashingSecret: 'pu0HoV-W@CrEsuTrl4ri',

};

env.staging = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'staging',
    hashingSecret: 'sw!h-w68xi8Of#*fIv=9',

};

env.production = {
    httpPort: 80,
    httpsPort: 443,
    envName: 'production',
    hashingSecret: 'CR0-Rust0ni6u-i+ESij',

};

// Determine which env was passed as a command-line args
const currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check the currentEnv is one of the env above, if not, default develop
const envToExport = typeof(env[currentEnv]) === 'object' ? env[currentEnv] : env.develop;

// Export the module
module.exports = envToExport;