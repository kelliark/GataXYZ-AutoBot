const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

// Ensure screenshots directory exists
const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function takeScreenshot(page, accountName) {
    try {
        // Clean up old screenshot first
        await cleanupScreenshot(accountName);
        
        // Take new screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${accountName}.png`);
        await page.screenshot({ path: screenshotPath });
        logger.info(`Screenshot taken for ${accountName}`);
        return screenshotPath;
    } catch (error) {
        logger.error(`Error taking screenshot for ${accountName}: ${error.message}`);
        return null;
    }
}

async function cleanupScreenshot(accountName) {
    try {
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${accountName}.png`);
        if (fs.existsSync(screenshotPath)) {
            fs.unlinkSync(screenshotPath);
        }
    } catch (error) {
        logger.error(`Error cleaning up screenshot for ${accountName}: ${error.message}`);
    }
}

function cleanupOldScreenshots(maxAgeHours = 24) {
    try {
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        const now = Date.now();
        
        fs.readdirSync(SCREENSHOTS_DIR).forEach(file => {
            const filePath = path.join(SCREENSHOTS_DIR, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtimeMs > maxAgeMs) {
                fs.unlinkSync(filePath);
                logger.info(`Removed old screenshot: ${file}`);
            }
        });
    } catch (error) {
        logger.error(`Error cleaning up old screenshots: ${error.message}`);
    }
}

module.exports = {
    takeScreenshot,
    cleanupScreenshot,
    cleanupOldScreenshots
};