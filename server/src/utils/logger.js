const logger = {
  info: (msg, data = '') => {
    console.log(`ℹ️  [INFO] ${msg}`, data);
  },
  error: (msg, err = '') => {
    console.error(`❌ [ERROR] ${msg}`, err);
  },
  warn: (msg, data = '') => {
    console.warn(`⚠️  [WARN] ${msg}`, data);
  },
  ai: (msg, data = '') => {
    console.log(`🤖 [AI] ${msg}`, data);
  }
};

export default logger;