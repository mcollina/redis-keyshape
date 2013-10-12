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
var db = require('redis').createClient()

var key1 = 'foo:' + foo_id
db.hget(key1, 'foo_field', function(err, foo_field){...})

var key2 = 'foo:' + foo_id + ':member:' + member_id
db.smembers(key2, 'foo_field', function(err, members){...})
```

### Solution
- Keynames managed in a single place, DRY
- No temporary variables

```js
var db = require('redis').createClient()
var keyshape = require('redis-keyshape')

// Create some keyshapes

db.foo = keyshape(db, 'foo:%s', 'hash')
db.foo_member = keyshape(db, 'foo:%s:member:%s', 'set')

// Use them like

db.foo.hget(foo_id, 'foo_field', function(err, foo_field){...})
db.foo_member.smembers([foo_id, member_id], 'foo_field', function(err, members){...})

// or alternatively

db.foo(foo_id).hget('foo_field', function(err, foo_field){...})
db.foo_member(foo_id, member_id).smembers('foo_field', function(err, members){...})

// The alternative style is sometimes nicer

var foo = db.foo(foo_id)
async.series([
  foo.hmget.bind(db, 'foo_field', 'foo2_field'),
  foo.hincby.bind(db, 'bar_field', 1),
  foo.del.bind(db, 'foobar_field'),
  foo.len.bind(db),
], callback)
```

## API
##### `module.exports(redis_client, keyshape, redis_key_type)`
- **@param** `redis_client` `<Object>`  
  a redis client to derive command functions from

- **@param** `keyshape` `<String>`  
  a pattern defining the keyshape. Use `%s` wherever interpolation should occur

- **@param** `redis_key_type` `<String>`  
  The type of key ('set', 'hash', etc). This datum is used to ensure
  the correct redis commands are exposed on the returned object

- **@return** `<Function>/<Object>`  
  Object of redis-commands for the key-type (as well as generic commands applicable to all types).  
  Each commands' first argument accepts the key variable instead of the full keyname. If the keyname
  has multiple variables supply them as an array (See example above).  
  `Function(key_var, ...)`
  - @param `key_var` `<String>`  
    variable-number of arguments for each variable in keyshape
  - @return `<Object>`  
    Object of redis-commands for the key-type (as well as generic commands applicable to all types).  
    Each commands' first argument (the key) is partially applied freeing the user from having to supply it.
