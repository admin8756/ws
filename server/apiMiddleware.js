// apiMiddleware.js
import bodyParser from 'body-parser';
import classes from './index';
export default function (req, res, next) {
  bodyParser.json()(req, res, () => {
    const { url, method, body } = req;
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
      if (method === 'GET') {
        const result = classes[className][methodName](...args || []);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        res.end(JSON.stringify(result));
      } else if (method === 'POST') {
        const result = classes[className][methodName](body);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });
        res.end(JSON.stringify(result));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('internalServerError: ' + error.message);
    }

  });
};