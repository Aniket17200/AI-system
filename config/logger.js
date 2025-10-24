const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logLine);
    
    const consoleColors = {
      info: '\x1b[36m',
      error: '\x1b[31m',
      warn: '\x1b[33m',
      success: '\x1b[32m'
    };
    
    console.log(`${consoleColors[level] || ''}[${level.toUpperCase()}] ${timestamp} - ${message}\x1b[0m`, meta);
  }

  info(message, meta) { this.log('info', message, meta); }
  error(message, meta) { this.log('error', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  success(message, meta) { this.log('success', message, meta); }
}

module.exports = new Logger();
