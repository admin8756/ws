// apiMiddleware.js
import classes from './index';

module.exports = function (req, res, next) {
  const { url } = req;
  // method = 'GET || POST'
  try {
    const [className, methodName, ...args] = url.split('/').slice(1);
    if (!classes[className]) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Class not found: ${className}`)
      return
    }

    if (!classes[className][methodName]) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Method not found: ${methodName}`);
      return
    }

    const result = classes[className][methodName](...args || []);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('internalServerError: ' + error.message);
  }
};