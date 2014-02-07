# redis-keyshape [![Dependency Status](https://gemnasium.com/jasonkuhrt/redis-keyshape.png)](https://gemnasium.com/jasonkuhrt/redis-keyshape)

# Install
```
npm install jasonkuhrt/redis-keyshape
```

## Example
### Problem
- keyname repeated across application
- Temporary variables for key access

```js
var redis_client = require('redis').createClient()

var key1 = 'foo:' + foo_id
redis_client.hget(key1, 'foo_field', function(err, foo_field){...})

var key2 = 'foo:' + foo_id + ':member:' + member_id
redis_client.smembers(key2, 'foo_field', function(err, members){...})
```

### Solution
- Keynames managed in a single place, DRY
- No temporary variables

```js
var redis_client = require('redis').createClient();
var keyshape = require('redis-keyshape'),
    create_keyshape = keyshape.create_keyshape,
    add_keyshape = keyshape.add_keyshape;

// Create some keyshapes.

redis_client.foo = create_keyshape(redis_client, 'foo:%s', 'hash');
redis_client.foo_member = create_keyshape(redis_client, 'foo:%s:member:%s', 'set');

// OR, augment the redis_client with keyshapes if the key pattern follows convention*.
// * https://github.com/jasonkuhrt/redis-keyshape/issues/7

add_keyshape(redis_client, 'foo:%s', 'hash'); // redis_client.foo now a keyshape
add_keyshape(redis_client, 'foo:%s:member:%s', 'set'); // redis_client.foo_member now a keyshape

// Keyshapes take the same signature except that the key argument
// need only include the keyshape's variable.

redis_client.foo.hget(foo_id, 'foo_field', function(err, foo_field){...})

// Often keyshapes require multiple variables. In such cases use an array
// to provide the keyshape variables.

redis_client.foo_member.smembers([foo_id, member_id], 'foo_field', function(err, members){...})
```

## API

  TODO