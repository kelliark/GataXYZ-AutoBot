const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');

// Start with basic error handling before trying to load modules
try {
    // Display banner directly in index.js to ensure it works
    console.log(chalk.cyan(figlet.textSync('KELLIARK', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
    })));
    console.log(chalk.yellow('='.repeat(60)));
    console.log(chalk.green('DVA Automation Tool') + chalk.gray(' | ') + 
                chalk.blue(`Multi-Account Edition v1.0`));
    console.log(chalk.yellow('='.repeat(60)) + '\n');

    // Check for required files before proceeding
    const requiredFiles = [
        'accounts.json',
        'config.json',
        path.join('core', 'accounts.js'),
        path.join('core', 'activity.js'),
        path.join('core', 'browser.js'),
        path.join('core', 'monitor.js'),
        path.join('core', 'proxy.js'),
        path.join('core', 'screenshot.js'),
        path.join('core', 'storage.js'),
        path.join('utils', 'config.js'),
        path.join('utils', 'logger.js'),
        path.join('utils', 'notify.js')
    ];

    console.log('Checking required files...');
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            console.error(chalk.red(`Error: Required file not found: ${file}`));
            process.exit(1);
        }
    }

    // Check if proxies.txt exists and warn if not
    if (!fs.existsSync('proxies.txt')) {
        console.warn(chalk.yellow('Warning: proxies.txt file not found. Consider adding proxies for better reliability.'));
    }

    // Now load modules
    console.log('Loading modules...');
    const { runAccountSession } = require('./core/accounts');
    const { setupProxyManager } = require('./core/proxy');
    const { setupMonitor } = require('./core/monitor');
    const { loadConfig } = require('./utils/config');
    const { setupLogger } = require('./utils/logger');
    const { setupNotifications } = require('./utils/notify');

    // Initialize
    console.log('Setting up logger...');
    const logger = setupLogger();
    
    console.log('Loading configuration...');
    const config = loadConfig();

    async function main() {
        try {
            // Setup components
            console.log('Setting up proxy manager...');
            const proxyManager = setupProxyManager();
            
            // Load proxies from configuration
            console.log('Loading proxies...');
            if (config.proxies && Array.isArray(config.proxies) && config.proxies.length > 0) {
                proxyManager.addProxies(config.proxies);
                logger.info(`Loaded ${config.proxies.length} proxies from configuration`);
            } else {
                logger.warn('No proxies found in configuration. Running without proxies.');
            }
            
            console.log('Setting up notifications...');
            const notifications = await setupNotifications(config);
            
            console.log('Setting up monitoring system...');
            const monitor = setupMonitor(config, notifications);
            
            // Add a fallback proxy if none are available
            if (proxyManager.getProxyCount() === 0) {
                logger.warn('No proxies available! Accounts will run without proxies.');
            }
            
            // Load accounts
            console.log('Loading account data...');
            if (!fs.existsSync('accounts.json')) {
                logger.error('accounts.json file not found');
                process.exit(1);
            }
            
            const accounts = JSON.parse(fs.readFileSync('accounts.json', 'utf8'));
            
            if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
                logger.error('No accounts found or invalid accounts.json format');
                process.exit(1);
            }
            
            logger.info(`Starting DVA automation with ${accounts.length} accounts`);
            
            // Start account sessions with staggered delays
            for (let i = 0; i < accounts.length; i++) {
                const account = accounts[i];
                setTimeout(() => {
                    runAccountSession(account, proxyManager, monitor);
                    logger.info(`Started session for account: ${account.name || account.address.slice(0, 8)}`);
                }, i * config.startDelay);
            }
            
            // Graceful shutdown
            process.on('SIGINT', async () => {
                logger.info('Received shutdown signal, closing all sessions...');
                await monitor.shutdown();
                process.exit(0);
            });
            
        } catch (error) {
            console.error(chalk.red('Fatal error in main process:'), error);
            process.exit(1);
        }
    }

    main();
} catch (error) {
    console.error(chalk.red('INITIALIZATION ERROR:'), error);
}