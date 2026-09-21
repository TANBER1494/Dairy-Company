const NodeCache = require('node-cache');

const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      console.error('لا يمكن تخزين طلبات غير GET');
      return next();
    }

    const key = req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.status(200).json(cachedResponse);
    } else {
      res.originalJson = res.json;
      res.json = (body) => {
        cache.set(key, body, duration);
        res.originalJson(body);
      };
      next();
    }
  };
};

const clearCache = (keyPattern) => {
  const keys = cache.keys();
  const keysToDelete = keys.filter(key => key.includes(keyPattern));
  cache.del(keysToDelete);
};

module.exports = {
  cacheMiddleware,
  clearCache
};