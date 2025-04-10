const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

function setupMonitor(config, notifications) {
    const accounts = {};
    let statusInterval;
    let statusReportInterval;
    
    // Create status directory
    const STATUS_DIR = path.join(process.cwd(), 'status');
    if (!fs.existsSync(STATUS_DIR)) {
        fs.mkdirSync(STATUS_DIR, { recursive: true });
    }
    
    // Start status monitoring
    statusInterval = setInterval(() => {
        const now = Date.now();
        
        Object.keys(accounts).forEach(name => {
            const account = accounts[name];
            
            // Check for inactive accounts
            if (account.status === 'active' && 
                now - account.lastActivity > config.inactivityThreshold) {
                logger.warn(`Account ${name} appears inactive, marking for check`);
                account.status = 'checking';
                
                // Schedule recovery check
                setTimeout(async () => {
                    // If still in checking status, attempt recovery
                    if (accounts[name] && accounts[name].status === 'checking') {
                        logger.info(`Attempting recovery for inactive account: ${name}`);
                        // Recovery logic could be implemented here
                        // For now, just mark as recovered
                        accounts[name].status = 'active';
                        accounts[name].lastActivity = Date.now();
                    }
                }, 60000); // Check after 1 minute
            }
        });
    }, 30000); // Check every 30 seconds
    
    // Generate status reports periodically
    statusReportInterval = setInterval(() => {
        generateStatusReport();
    }, config.reportInterval || 300000); // Every 5 minutes by default
    
    function generateStatusReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                accounts: Object.keys(accounts).map(name => ({
                    name: name,
                    address: accounts[name].address,
                    status: accounts[name].status,
                    proxy: accounts[name].proxy,
                    lastActivity: new Date(accounts[name].lastActivity).toISOString()
                })),
                summary: {
                    total: Object.keys(accounts).length,
                    active: Object.values(accounts).filter(a => a.status === 'active').length,
                    error: Object.values(accounts).filter(a => a.status === 'error' || a.status === 'failed').length,
                    initializing: Object.values(accounts).filter(a => a.status === 'initializing').length,
                    checking: Object.values(accounts).filter(a => a.status === 'checking').length
                }
            };
            
            // Save report to file
            fs.writeFileSync(
                path.join(STATUS_DIR, `status_${new Date().toISOString().replace(/:/g, '-')}.json`),
                JSON.stringify(report, null, 2)
            );
            
            // Display in console
            console.log('\n' + chalk.yellow('='.repeat(60)));
            console.log(chalk.cyan('STATUS REPORT') + chalk.gray(` | ${new Date().toLocaleString()}`));
            console.log(chalk.yellow('='.repeat(60)));
            
            console.log(chalk.cyan('SUMMARY:'));
            console.log(`Total Accounts: ${chalk.white(report.summary.total)}`);
            console.log(`Active: ${chalk.green(report.summary.active)}`);
            console.log(`Error/Failed: ${chalk.red(report.summary.error)}`);
            console.log(`Initializing: ${chalk.blue(report.summary.initializing)}`);
            console.log(`Checking: ${chalk.yellow(report.summary.checking)}`);
            console.log(chalk.yellow('-'.repeat(60)));
            
            // Send notification if configured
            if (notifications && report.summary.error > 0) {
                notifications.sendAlert(`
                    🚨 DVA AUTOMATION ALERT 🚨
                    ${report.summary.error} accounts in error state!
                    Total: ${report.summary.total}
                    Active: ${report.summary.active}
                    Please check the status dashboard.
                `);
            }
            
            return report;
        } catch (error) {
            logger.error(`Error generating status report: ${error.message}`);
        }
    }
    
    return {
        registerAccount: (name, accountInfo) => {
            accounts[name] = accountInfo;
        },
        
        updateAccountStatus: (name, status) => {
            if (accounts[name]) {
                accounts[name].status = status;
                
                // Send notification on errors if configured
                if ((status === 'error' || status === 'failed') && notifications) {
                    notifications.sendAlert(`
                        🚨 DVA AUTOMATION ALERT 🚨
                        Account ${name} status changed to ${status}
                        Address: ${accounts[name].address}
                        Proxy: ${accounts[name].proxy}
                    `);
                }
            }
        },
        
        updateAccountLastActivity: (name) => {
            if (accounts[name]) {
                accounts[name].lastActivity = Date.now();
            }
        },
        
        getAccountStatus: (name) => {
            return accounts[name] || null;
        },
        
        getAllAccounts: () => {
            return { ...accounts };
        },
        
        generateReport: generateStatusReport,
        
        shutdown: async () => {
            clearInterval(statusInterval);
            clearInterval(statusReportInterval);
            
            // Close all browsers
            for (const name in accounts) {
                if (accounts[name].browser) {
                    try {
                        await accounts[name].browser.close();
                    } catch (error) {
                        logger.error(`Error closing browser for ${name}: ${error.message}`);
                    }
                }
            }
            
            // Generate final report
            generateStatusReport();
        }
    };
}

module.exports = {
    setupMonitor
};