## DVA Automation Tool

A multi-account automation tool for the DVA verification process. This script automates account verification for multiple wallets with proxy support and monitoring capabilities.

## Register
- [GATAXYZ](https://app.gata.xyz?invite_code=pgrq1bk9)
- Use my code: **pgrq1bk9**

## Features

- Multi-account support: Manage and automate multiple accounts simultaneously
- Proxy rotation: Distribute requests across multiple proxies for better reliability
- Automatic activity simulation: Keep sessions active with random activity
- Monitoring dashboard: Track the status of all accounts
- Screenshot capture: Automatically save screenshots for verification
- Notification system: Get alerts via Telegram or Discord
- Detailed logging: Comprehensive logging for troubleshooting

## Installation

**Clone the repository:**
```bash
git clone https://github.com/kelliark/GataXYZ-AutoBot.git
cd GataXYZ-AutoBot
```

**Install dependencies:**
```bash
npm install
npx playwright install
```

## Configure these files:

- accounts.json - Contains account details
- config.json - Contains general configuration
- proxies.txt - Contains proxy list (optional but recommended)

# Configuration
**accounts.json**
```
[
  {
    "name": "Account1",
    "address": "0x...",
    "bearer": "bearer-token",
    "data_agent_token": "data-agent-token",
    "llm_token": "llm-token",
    "task_token": "task-token",
    "invite_code": "invite-code",
    "proxy": "optional-dedicated-proxy"
  },
  {
    "name": "Account2",
    "address": "0x...",
    "bearer": "bearer-token",
    "data_agent_token": "data-agent-token",
    "llm_token": "llm-token",
    "task_token": "task-token",
    "invite_code": "invite-code"
  }
]
```
**config.json**
```
{
  "activityInterval": 120000,
  "startDelay": 15000,
  "maxRetries": 3,
  "inactivityThreshold": 300000,
  "reportInterval": 300000,
  "notifications": {
    "enabled": false,
    "type": null,
    "config": {}
  },
  "cleanupInterval": 86400000,
  "proxies": []
}
```
**You can configure:**
- **activityInterval**: Time between activity simulations (ms)
- **startDelay**: Delay between starting each account (ms)
- **maxRetries**: Maximum retry attempts per account
- **inactivityThreshold**: Time before checking inactive accounts (ms)
- **reportInterval**: Status report generation frequency (ms)
- **notifications**: Configure notifications (Telegram or Discord) // you can enable this via making it true instead of false
- **cleanupInterval**: Cleanup interval for old screenshots (ms)

**proxies.txt**
```
192.168.1.1:8080
username:password@192.168.1.2:8080
http://192.168.1.3:8080
http://username:password@192.168.1.4:8080
socks5://192.168.1.5:1080
socks5://username:password@192.168.1.6:1080
```

## Usage
**Run the bot.**
```
node index.js
```

## Notifications (Optional)
You can enable notifications to get alerts when accounts encounter errors.

**Telegram**
```
"notifications": {
  "enabled": true,
  "type": "telegram",
  "config": {
    "botToken": "your-telegram-bot-token",
    "chatId": "your-chat-id"
  }
}
```
**Discord**
```
"notifications": {
  "enabled": true,
  "type": "discord",
  "config": {
    "webhookUrl": "your-discord-webhook-url"
  }
}
```

## Disclaimer
This tool is for **educational purposes only**. Use at your own risk, all risk are borne with user.
