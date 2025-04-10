const path = require('path');
const { createBrowser } = require('./browser');
const { setRequiredLocalStorage } = require('./storage');
const { takeScreenshot, cleanupScreenshot } = require('./screenshot');
const { simulateActivity } = require('./activity');
const { logger } = require('../utils/logger');
const { loadConfig } = require('../utils/config');

const config = loadConfig();
const BASE_URL = 'https://app.gata.xyz/dataAgent';
const PAGE_TIMEOUT = 120000;
const ACTIVE_SESSION_DURATION = 8 * 60 * 60 * 1000;

async function waitForPageLoad(page) {
    try {
        await Promise.race([
            page.waitForLoadState('domcontentloaded', { timeout: PAGE_TIMEOUT }),
            page.waitForLoadState('load', { timeout: PAGE_TIMEOUT })
        ]);
        await page.waitForTimeout(5000);
        return true;
    } catch (error) {
        logger.warn('Page load timeout, but continuing execution...');
        return false;
    }
}

async function findAndClickStartButton(page, accountName) {
    logger.info('Looking for Start button on DVA page...');
    
    try {
        await takeScreenshot(page, `before_start_${accountName}`);
        
        const currentUrl = page.url();
        if (!currentUrl.includes('/dataAgent')) {
            logger.info('Not on DVA page, navigating...');
            await page.goto(BASE_URL);
            await waitForPageLoad(page);
        }

        await page.waitForTimeout(5000);

        const buttonFound = await page.evaluate(() => {
            const isVisible = (elem) => {
                if (!elem) return false;
                const style = window.getComputedStyle(elem);
                return style.display !== 'none' && 
                       style.visibility !== 'hidden' && 
                       style.opacity !== '0' &&
                       elem.offsetParent !== null;
            };

            const relevantTexts = ['start', 'begin', 'launch', 'dva', 'verify'];
            const elements = Array.from(document.querySelectorAll('button, div[role="button"], a[role="button"], div[class*="button"]'));
            
            for (const element of elements) {
                const text = element.innerText.toLowerCase().trim();
                if (isVisible(element) && relevantTexts.some(t => text.includes(t))) {
                    element.click();
                    return true;
                }
            }

            const buttonSelectors = [
                '[class*="start"]',
                '[class*="begin"]',
                '[class*="launch"]',
                '[class*="verify"]',
                '[class*="dva"]'
            ];

            for (const selector of buttonSelectors) {
                const elements = Array.from(document.querySelectorAll(selector))
                    .filter(el => isVisible(el));
                
                if (elements.length > 0) {
                    elements[0].click();
                    return true;
                }
            }

            return false;
        });

        if (buttonFound) {
            logger.success('Successfully clicked Start button');
            await takeScreenshot(page, `after_start_${accountName}`);
            return true;
        }

        logger.error('Start button not found. Saving page content...');
        return false;

    } catch (error) {
        logger.error(`Error finding Start button: ${error.message}`);
        await takeScreenshot(page, `error_${accountName}`);
        return false;
    }
}

async function runAccountSession(account, proxyManager, monitor) {
    const accountName = account.name || account.address.slice(0, 8);
    let proxy = account.proxy;
    let browser, context, page, activityInterval;
    let retryCount = 0;
    
    async function setupSession() {
        try {
            // Get proxy if needed
            if (!proxy) {
                proxy = proxyManager.getNextProxy();
                logger.info(`Using backup proxy for account ${accountName}: ${proxy}`);
            }
            
            // Create browser
            const browserInstance = await createBrowser(proxy);
            browser = browserInstance.browser;
            context = browserInstance.context;
            page = await context.newPage();
            
            // Set up monitoring
            monitor.registerAccount(accountName, {
                address: account.address,
                proxy: proxy,
                status: 'initializing',
                lastActivity: new Date(),
                browser: browser
            });
            
            // Navigate and set up
            logger.info(`Navigating to DVA page for account: ${accountName}`);
            await page.goto(BASE_URL);
            await waitForPageLoad(page);
            
            // Set localStorage and reload
            await setRequiredLocalStorage(page, account);
            await Promise.all([
                page.reload(),
                waitForPageLoad(page)
            ]);
            
            await page.waitForTimeout(5000);
            
            // Click start button
            const buttonClicked = await findAndClickStartButton(page, accountName);
            
            if (buttonClicked) {
                logger.success(`DVA start successful for account: ${accountName}`);
                monitor.updateAccountStatus(accountName, 'active');
                
                // Set up activity simulation
                const startTime = Date.now();
                activityInterval = setInterval(async () => {
                    if (Date.now() - startTime > ACTIVE_SESSION_DURATION) {
                        clearInterval(activityInterval);
                        logger.info(`Session duration limit reached for account: ${accountName}`);
                        await cleanupSession();
                        return;
                    }
                    
                    try {
                        await simulateActivity(page, accountName);
                        monitor.updateAccountLastActivity(accountName);
                    } catch (error) {
                        logger.error(`Activity simulation error for ${accountName}: ${error.message}`);
                        // Try to recover
                        if (retryCount < config.maxRetries) {
                            retryCount++;
                            logger.info(`Attempting recovery for account ${accountName} (${retryCount}/${config.maxRetries})`);
                            await cleanupSession();
                            await setupSession();
                        } else {
                            logger.error(`Max retries reached for account ${accountName}`);
                            monitor.updateAccountStatus(accountName, 'failed');
                            await cleanupSession(false);
                        }
                    }
                }, config.activityInterval);
                
                return true;
            } else {
                logger.error(`Could not find DVA Start button for account: ${accountName}`);
                monitor.updateAccountStatus(accountName, 'error');
                await cleanupSession(false);
                return false;
            }
        } catch (error) {
            logger.error(`Error in session for account ${accountName}: ${error.message}`);
            monitor.updateAccountStatus(accountName, 'error');
            
            // Try with another proxy if available
            if (retryCount < config.maxRetries) {
                retryCount++;
                logger.info(`Retrying with new proxy for account ${accountName} (${retryCount}/${config.maxRetries})`);
                proxy = proxyManager.getNextProxy();
                await cleanupSession();
                return await setupSession();
            } else {
                logger.error(`Max retries reached for account ${accountName}`);
                await cleanupSession(false);
                return false;
            }
        }
    }
    
    async function cleanupSession(retry = true) {
        try {
            if (activityInterval) {
                clearInterval(activityInterval);
            }
            
            if (browser) {
                await browser.close();
            }
            
            if (!retry) {
                await cleanupScreenshot(accountName);
            }
        } catch (error) {
            logger.error(`Error during cleanup for ${accountName}: ${error.message}`);
        }
    }
    
    return await setupSession();
}

module.exports = {
    runAccountSession
};