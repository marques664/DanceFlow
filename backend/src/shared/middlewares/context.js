const crypto = require('crypto');
const { contextStorage } = require('../utils/context');

function contextMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('x-request-id', requestId);

  const store = {
    requestId,
    schoolId: null,
    userId: null
  };

  contextStorage.run(store, () => {
    next();
  });
}

module.exports = { contextMiddleware };
