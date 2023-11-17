// apiMiddleware.js
import classes from './index';

function checkClassExist(className) {
  return !!classes[className];
}

function checkMethodExist(instance, methodName) {
  return typeof instance[methodName] === 'function';
}

module.exports = function (req, res, next) {
  const { method, url } = req;
  res.end(JSON.stringify(method, url ))
  try {
    const { path } = req.Url;
    const [, , className, methodName, ...args] = path.split('/').filter(part => part !== '');
    console.log(className, methodName, args);
    if (!checkClassExist(className)) {
      res.status(404)
      res.end(`Class not found:${className} `);
      return;
    }

    const instance = new classes[className]();

    if (!checkMethodExist(instance, methodName)) {
      res.status(404)
      res.end(`Method not found :${methodName}`);
      return;
    }

    const result = instance[methodName](...args);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error(error);
    res.status(500).end('Internal Server Error: ' + error.message);
  }
};
