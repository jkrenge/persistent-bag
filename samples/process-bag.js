const PersistentBag = require('../index');
const bag = new PersistentBag({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '',
  database: 'pyle'
});

bag.process(function (bag, done) {

  console.log(bag.data);

  setTimeout(function () {
    done();
  }, 1000);

});
