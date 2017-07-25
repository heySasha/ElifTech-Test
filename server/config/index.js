const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
    config = require('./config.json');
    process.env = Object.assign({}, process.env, config[env]);
}