const { takeScreenshot } = require('./screenshot');
const { logger } = require('../utils/logger');

async function simulateActivity(page, accountName) {
    try {
        await page.evaluate(() => {
            // Simulate random scroll
            const scrollY = Math.floor(Math.random() * 500);
            window.scrollTo(0, scrollY);
            
            // Simulate mouse movement
            const event = new MouseEvent('mousemove', {
                'view': window,
                'bubbles': true,
                'cancelable': true,
                'clientX': Math.random() * window.innerWidth,
                'clientY': Math.random() * window.innerHeight
            });
            document.dispatchEvent(event);
            
            // After a delay, scroll back up
            setTimeout(() => window.scrollTo(0, 0), 1000);
        });
        
        logger.info(`Activity simulated for ${accountName} at ${new Date().toLocaleTimeString()}`);
        await takeScreenshot(page, accountName);
        return true;
    } catch (error) {
        logger.error(`Error during activity simulation for ${accountName}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    simulateActivity
};