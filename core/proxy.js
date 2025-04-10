const { logger } = require('../utils/logger');

function setupProxyManager() {
    // Array to store proxies
    let proxies = [];
    let currentIndex = 0;
    
    return {
        // Add a proxy to the pool
        addProxy: (proxy) => {
            if (proxy && !proxies.includes(proxy)) {
                proxies.push(proxy);
                logger.info(`Added proxy to pool: ${proxy}`);
            }
        },
        
        // Add multiple proxies at once
        addProxies: (proxyList) => {
            if (Array.isArray(proxyList)) {
                const newProxies = proxyList.filter(proxy => proxy && !proxies.includes(proxy));
                proxies = [...proxies, ...newProxies];
                logger.info(`Added ${newProxies.length} proxies to pool`);
            }
        },
        
        // Get the next proxy in rotation
        getNextProxy: () => {
            if (proxies.length === 0) {
                logger.warn('No proxies available in proxy pool');
                return null;
            }
            
            const proxy = proxies[currentIndex];
            currentIndex = (currentIndex + 1) % proxies.length;
            return proxy;
        },
        
        // Get all proxies
        getAllProxies: () => {
            return [...proxies];
        },
        
        // Get the number of proxies in the pool
        getProxyCount: () => {
            return proxies.length;
        }
    };
}

module.exports = {
    setupProxyManager
};