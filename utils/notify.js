const axios = require('axios');

async function setupNotifications(config) {
    // Get the logger after it's been properly initialized
    const { logger } = require('./logger');
    
    if (!config.notifications || !config.notifications.enabled) {
        logger.info('Notifications are disabled');
        return null;
    }
    
    let notifier = null;
    
    // Set up based on notification type
    switch (config.notifications.type) {
        case 'telegram':
            if (config.notifications.config.botToken && config.notifications.config.chatId) {
                notifier = {
                    sendAlert: async (message) => {
                        try {
                            await axios.post(
                                `https://api.telegram.org/bot${config.notifications.config.botToken}/sendMessage`,
                                {
                                    chat_id: config.notifications.config.chatId,
                                    text: message,
                                    parse_mode: 'Markdown'
                                }
                            );
                            logger.info('Telegram notification sent');
                        } catch (error) {
                            logger.error(`Failed to send Telegram notification: ${error.message}`);
                        }
                    }
                };
                logger.info('Telegram notifications enabled');
            } else {
                logger.warn('Telegram notifications enabled but missing botToken or chatId');
            }
            break;
            
        case 'discord':
            if (config.notifications.config.webhookUrl) {
                notifier = {
                    sendAlert: async (message) => {
                        try {
                            await axios.post(
                                config.notifications.config.webhookUrl,
                                {
                                    content: message,
                                    username: 'DVA Automation'
                                }
                            );
                            logger.info('Discord notification sent');
                        } catch (error) {
                            logger.error(`Failed to send Discord notification: ${error.message}`);
                        }
                    }
                };
                logger.info('Discord notifications enabled');
            } else {
                logger.warn('Discord notifications enabled but missing webhookUrl');
            }
            break;
            
        default:
            logger.warn(`Unknown notification type: ${config.notifications.type}`);
    }

    // Test notification
    if (notifier) {
        try {
            await notifier.sendAlert('🟢 DVA Automation started - Notification system active');
        } catch (error) {
            logger.error(`Failed to send test notification: ${error.message}`);
        }
    }

    return notifier;
}

module.exports = {
    setupNotifications
};