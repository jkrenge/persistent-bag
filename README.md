> This is to bags like redis is to queues. A bag (or multiset) is filled over time and processed at once.

Table of Contents: [Overview](#overview), [Install](#install), [Use](#use), [Dependencies](#dependencies), [Todos/ Contribution](#todos-and-contribution)


# Overview

This node module `persistent-bag` aims to be a persistent bag (also called [multiset][1]) for accumulating data over the lifetime of an application and then emitting the data after a fixed interval in one aggregated object. Goal is to work like [redis][2] but not process the entries (or jobs) individually, but aggregated by time intervals. Therefore the API is a bit designed like [kue][3] (but not as good).

[1]: https://en.wikipedia.org/wiki/Set_(abstract_data_type)#Multiset
[2]: http://redis.io/
[3]: https://github.com/Automattic/kue

# Install

Business as usual: `npm install persistent-bag --save`.

The MySQL database ([see below](#dependencies)) needs already to be set up. The tables are auto-generated on first launch.

# Use

Examples can also be found in `/samples`.

## Init persistent-bag

```javascript
const PersistentBag = require('../index');
const bag = new PersistentBag({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: '',
  database: 'test'
});
```

This initializes the `persistent-bag` and opens the connection to the MySQL database for persistence. If the required data structure (i.e. one table called `_persistent-bag`) does not exist yet, it will be created.

## Add something to a bag

```javascript
bag.add({ test: false }, function (err, dataId) {
  console.log('Entry id: ' + dataId);
});
```

There is only one large `bag` where items can be `add()`ed to. So right now, there's no way to have two logical types of `bag` at the same time (see [todos](#todos-and-contribution)).

Although in fact, each new time interval (fixed to `15 minutes`) is it's own bag, which is emitted right after the time interval for this bag is over. By the way, we could also make the time interval dynamic (see [todos](#todos-and-contribution)).

## Process a bag

```javascript
bag.process(function worker(bag, done) {

  console.log(bag.data);

  setTimeout(function () {
    done();
  }, 1000);

});
```

Processing `bag`s is done by subscribing to `persistent-bag` as listed above. This supplied worker function then gets the whole `bag` with the aggregated data that has been added in `bag.data`.

After the `bag` has been processed, the provided callback `done()` needs to be called. This tells `persistent-bag` to emit the next `bag`. If `done(err)` is called with an error, the `bag` will not be marked as successfully processed and emitted again.

# Dependencies

The items in the bag are stored persistently using a [MySQL][11] database, so first and most obvious dependecy is MySQL.

Furthermore, several npm modules are added as dependencies in the `package.json`. Those are:


* [async][12] for control flow
* [moment][13] for working with the time intervals
* [mysql][14] to connect to the MySQL database
* [node-schedule][15] to schedule processing
* [sha1][16] to create the hashes for the bags
* [underscore][17] as utility belt

[11]: http://dev.mysql.com/downloads/
[12]: https://github.com/caolan/async
[13]: http://momentjs.com/
[14]: https://github.com/felixge/node-mysql
[15]: https://github.com/node-schedule/node-schedule
[16]: https://github.com/pvorb/node-sha1
[17]: http://underscorejs.org/

# TODOs and Contribution

If you want to contribute, please do. Some suggestions:

1. Enable different types of `bag`: Just like [kue][21] has different type of jobs, we want different type of `bag`s.
2. Make time interval dynamic: Currently, a new `bag` is created and emitted every `15 minutes`. It would be useful to make this dynamic somehow, while stilling enabling persistence.

[21]: https://github.com/Automattic/kue#creating-jobs
