// apiMiddleware.js
import classes from './index';

console.log(classes)
function isClassExist(className) {
  return classes[className];
}

function isMethodExist(instance, methodName) {
  return typeof instance[methodName] === 'function';
}

module.exports = function (req, res, next) {
  // 解析请求路径
  if (req.path) {
    console.log('req.path', req.path)
    const parts = req.path.split('/').filter(part => part !== '');  // 过滤掉空的部分
    const className = parts[2];
    const methodName = parts[3];
    console.log('className', className)
    console.log('methodName', methodName)
    // 检查类是否存在
    if (!isClassExist(className)) {
      res.statusCode = 404;
      res.end(`Class not found : ${className}`);
      return;
    }
    const instance = new classes[className]();

    // 检查方法是否存在
    if (!isMethodExist(instance, methodName)) {
      res.statusCode = 404;
      res.end('Method not found');
      return;
    }

    try {
      // 调用方法
      const result = instance[methodName](...parts.slice(4));
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.end('Internal Server Error: ' + error.message);
    }
  } else {
    next();
  }
};
