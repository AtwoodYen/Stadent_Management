const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// 自訂日誌格式
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logger = winston.createLogger({
  level: 'info', // 記錄 info 等級以上的日誌
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }), // 確保錯誤堆疊被記錄
    logFormat
  ),
  transports: [
    // 將 'error' 等級的日誌寫入 error.log 檔案
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // 將所有日誌寫入 combined.log 檔案
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// 如果不是在生產環境，也在主控台輸出日誌
// 這樣在開發時可以方便地看到帶有顏色的日誌
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      logFormat
    ),
  }));
}

module.exports = logger;