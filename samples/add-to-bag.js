const PersistentBag = require('../index');
const bag = new PersistentBag({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '',
  database: 'test'
});

bag.add({ test: false }, function (err, dataId) {
  console.log(dataId);
});
