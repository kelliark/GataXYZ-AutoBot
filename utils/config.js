const fs = require('fs');
const path = require('path');

// Default configuration
const DEFAULT_CONFIG = {
    activityInterval: 120000, // 2 minutes
    startDelay: 15000, // Delay between starting accounts (15 seconds)
    maxRetries: 3, // Maximum retry attempts per account
    inactivityThreshold: 300000, // 5 minutes of inactivity before checking
    reportInterval: 300000, // Status report every 5 minutes
    notifications: {
        enabled: false,
        type: null, // 'telegram' or 'discord'
        config: {}
    },
    cleanupInterval: 86400000, // 24 hours for screenshot cleanup
    proxies: [] // Will be populated from proxies.txt if available
};

function loadConfig() {
    try {
        let config = { ...DEFAULT_CONFIG };
        
        // Try to load config from file
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
            const userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config = { ...config, ...userConfig };
        } else {
            // Create default config file
            fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
        }
        
        // Load proxies from proxies.txt if available
        const proxiesPath = path.join(process.cwd(), 'proxies.txt');
        if (fs.existsSync(proxiesPath)) {
            const proxiesContent = fs.readFileSync(proxiesPath, 'utf8');
            const proxiesList = proxiesContent
                .split('\n')
                .map(line => line.trim())
                .filter(line => line && !line.startsWith('#'));
                
            if (proxiesList.length > 0) {
                config.proxies = proxiesList;
                console.log(`Loaded ${proxiesList.length} proxies from proxies.txt`);
            }
        }
        
        return config;
    } catch (error) {
        console.error('Error loading configuration:', error);
        return DEFAULT_CONFIG;
    }
}

module.exports = {
    loadConfig
};