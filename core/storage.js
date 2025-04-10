const { logger } = require('../utils/logger');

async function setRequiredLocalStorage(page, account) {
    try {
        await page.evaluate((acc) => {
            localStorage.setItem(acc.address, acc.bearer);
            localStorage.setItem('AGG_USER_IS_LOGIN', '1');
            localStorage.setItem('Gata_Chat_GotIt', '1');
            localStorage.setItem('aggr_current_address', acc.address);
            localStorage.setItem(`aggr_data_agent_token_${acc.address}`, acc.data_agent_token);
            localStorage.setItem(`aggr_llm_token_${acc.address}`, acc.llm_token);
            localStorage.setItem(`aggr_task_token_${acc.address}`, acc.task_token);
            localStorage.setItem(`invite_code_${acc.address}`, acc.invite_code);
            localStorage.setItem('wagmi.recentConnectorId', '"metaMask"');
            localStorage.setItem('wagmi.store', JSON.stringify({
                state: {
                    connections: {
                        __type: "Map",
                        value: [[
                            "e52bdc16f63",
                            {
                                accounts: [acc.address],
                                chainId: 1017,
                                connector: {
                                    id: "metaMask",
                                    name: "MetaMask",
                                    type: "injected",
                                    uid: "e52bdc16f63"
                                }
                            }
                        ]]
                    },
                    chainId: 1017,
                    current: "e52bdc16f63"
                },
                version: 2
            }));
        }, account);
        
        logger.info(`LocalStorage set for account: ${account.name || account.address.slice(0, 8)}`);
        return true;
    } catch (error) {
        logger.error(`Failed to set localStorage: ${error.message}`);
        return false;
    }
}

module.exports = {
    setRequiredLocalStorage
};