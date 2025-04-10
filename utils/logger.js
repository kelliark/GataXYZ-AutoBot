const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const logStream = fs.createWriteStream(
    path.join(LOGS_DIR, `dva_${new Date().toISOString().replace(/:/g, '-')}.log`),
    { flags: 'a' }
);

function formatLogMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

// Initialize the logger object
const logger = {
    info: (message) => {
        const formattedMessage = formatLogMessage('info', message);
        console.log(chalk.blue('[INFO]') + ' ' + message);
        logStream.write(formattedMessage + '\n');
    },
    
    success: (message) => {
        const formattedMessage = formatLogMessage('success', message);
        console.log(chalk.green('[SUCCESS]') + ' ' + message);
        logStream.write(formattedMessage + '\n');
    },
    
    warn: (message) => {
        const formattedMessage = formatLogMessage('warn', message);
        console.log(chalk.yellow('[WARN]') + ' ' + message);
        logStream.write(formattedMessage + '\n');
    },
    
    error: (message) => {
        const formattedMessage = formatLogMessage('error', message);
        console.log(chalk.red('[ERROR]') + ' ' + message);
        logStream.write(formattedMessage + '\n');
    },
    
    debug: (message) => {
        if (process.env.DEBUG) {
            const formattedMessage = formatLogMessage('debug', message);
            console.log(chalk.gray('[DEBUG]') + ' ' + message);
            logStream.write(formattedMessage + '\n');
        }
    }
};

function setupLogger() {
    // Make logger globally available
    global.logger = logger;
    return logger;
}

module.exports = {
    setupLogger,
    logger
};