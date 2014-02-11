# redis-keyshape [![Code Climate](https://codeclimate.com/github/jasonkuhrt/redis-keyshape.png)](https://codeclimate.com/github/jasonkuhrt/redis-keyshape) [![Dependency Status](https://gemnasium.com/jasonkuhrt/redis-keyshape.png)](https://gemnasium.com/jasonkuhrt/redis-keyshape)

Easily, consistently, clearly access redis keys.


## Installation
```
npm install redis-keyshape
```


## API

#### addKeyshape(redisClient, key_pattern)
  TODO

#### createKeyshape(redisClient, key_pattern)
  TODO


## Example

### Problem
- keyname repeated across application
- Temporary variables for key access

```js
var redisClient = require('redis').createClient();

var key1 = 'foo:' + foo_id;
redisClient.hget(key1, 'foo_field', function(err, foo_field){...});

var key2 = 'foo:' + foo_id + ':bar:' + bar_id;
redisClient.SMEMBERS(key2, function(err, members){...});
```

### Solution

```js
var redisClient = require('redis').createClient();
var keyshape = require('redis-keyshape'),
    createKeyshape = keyshape.createKeyshape,
    addKeyshape = keyshape.addKeyshape;

// Create some keyshapes.

redisClient.foo = createKeyshape(redisClient, 'foo:%s');
redisClient.fooBar = createKeyshape(redisClient, 'foo:%s:bar:%s');

// OR, augment the redisClient with keyshapes if the key pattern follows convention*.
// * https://github.com/jasonkuhrt/redis-keyshape/issues/7

addKeyshape(redisClient, 'foo:%s'); // auto-exposes as redisClient.foo
addKeyshape(redisClient, 'foo:%s:bar:%s'); // auto-exposes as redisClient.foo_bar

// Keyshapes take the same signature except that the key argument
// need only include the keyshape's variable.

redisClient.foo.hget(foo_id, 'foo_field', function(err, foo_field){...})

// Often keyshapes require multiple variables. In such cases use an array
// to provide the keyshape variables.

redisClient.foo_member.SMEMBERS([foo_id, bar_id], function(err, members){...})
```

## Notes

Only works with [`node-redis`](https://github.com/mranney/node_redis).


## License

  BSD-2-Clause
