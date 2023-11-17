// index.js

class User {
  static getUser(id) {
    return { id, name: 'John Doe' };
  }
}

class Logs {
  static getLogs() {
    return [{ id: 1, message: 'Log entry 1' }, { id: 2, message: 'Log entry 2' }];
  }
}

export default {
  User,
  Logs,
};
