const pino = require('pino');
const { contextStorage } = require('./context');

const baseLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

const logger = {
  info: (msg, details = {}) => {
    const store = contextStorage.getStore() || {};
    baseLogger.info({ ...store, ...details }, msg);
  },
  error: (msg, details = {}) => {
    const store = contextStorage.getStore() || {};
    baseLogger.error({ ...store, ...details }, msg);
  },
  warn: (msg, details = {}) => {
    const store = contextStorage.getStore() || {};
    baseLogger.warn({ ...store, ...details }, msg);
  },
  debug: (msg, details = {}) => {
    const store = contextStorage.getStore() || {};
    baseLogger.debug({ ...store, ...details }, msg);
  }
};

module.exports = { logger };
