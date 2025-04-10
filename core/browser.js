const { chromium } = require('playwright');
const { logger } = require('../utils/logger');

async function createBrowser(proxy = null) {
    const launchOptions = {
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-web-security'
        ]
    };

    // Configure proxy if provided
    if (proxy) {
        try {
            // Handle different proxy formats
            if (proxy.includes('@')) {
                // Format with authentication
                let server, username, password;
                
                if (proxy.includes('://')) {
                    // Format: http://username:password@hostname:port
                    const urlObj = new URL(proxy);
                    server = `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`;
                    const auth = urlObj.username + (urlObj.password ? ':' + urlObj.password : '');
                    [username, password] = auth.split(':');
                } else {
                    // Format: username:password@hostname:port
                    const [auth, hostPort] = proxy.split('@');
                    [username, password] = auth.split(':');
                    server = `http://${hostPort}`;
                }
                
                launchOptions.proxy = {
                    server,
                    username,
                    password
                };
                
            } else if (proxy.startsWith('socks5://') || proxy.startsWith('http://') || proxy.startsWith('https://')) {
                // Simple URL format without auth
                launchOptions.proxy = { server: proxy };
            } else {
                // Simple IP:PORT format
                launchOptions.proxy = { server: `http://${proxy}` };
            }
            
            logger.info(`Configured proxy: ${launchOptions.proxy.server} ${launchOptions.proxy.username ? '(with auth)' : ''}`);
        } catch (error) {
            logger.error(`Failed to parse proxy string: ${proxy}. Error: ${error.message}`);
            // Fallback to using the proxy string directly
            launchOptions.proxy = { server: proxy };
        }
    }

    try {
        const browser = await chromium.launch(launchOptions);
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ignoreHTTPSErrors: true
        });
        
        return { browser, context };
    } catch (error) {
        logger.error(`Failed to create browser: ${error.message}`);
        throw error;
    }
}

async function validateIPChange(page, expectedIP) {
    try {
        await page.goto('https://api.ipify.org?format=json', { timeout: 30000 });
        const ipInfo = await page.evaluate(() => {
            return JSON.parse(document.body.textContent);
        });
        
        return ipInfo.ip === expectedIP;
    } catch (error) {
        logger.error(`IP validation failed: ${error.message}`);
        return false;
    }
}

module.exports = {
    createBrowser,
    validateIPChange
};