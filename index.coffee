redis_commands = require('./redis-commands')
format = require('util').format



module.exports = (db, keyFormat, keyType)->
  # validate the given keyType
  if not redis_commands[keyType] then throw new Error format('Unknown redis key type: %j. Redis keys are: %j', keyType, _.keys(redis_commands))
  # always add generic redis-commands in addition to the keyType's
  redis_commands_sub_set = _.flatten(
    [redis_commands[keyType], redis_commands['generic']]
  )
  makeKey = create_key_maker(keyFormat)
  do_create_key_guard(db, makeKey, redis_commands_sub_set)


# Used to generate a database-key name.
#
# @keyFormat
#   There are two ways to create a keyMaker based on type:
#   1 <String>s are wrapped in a function which when invoked
#     interpolates its arguments into string in order, ALA sprintf.
#   2 <Function>s are used as-is (user handles logic).
create_key_maker = (keyFormat)->
  make_key_from_strings = (givenKey)->
    format(keyFormat, _.arrayify(givenKey)...)
  switch typeof keyFormat
    when 'function' then keyFormat
    when 'string'   then make_key_from_strings
    else # TODO err


do_create_key_guard = (db, makeKey, commandNames)->
  # Create a factory that accepts a givenKey, and returns
  # an object of redis commands whose 'key' argument
  # has been "curried" with the result of givenKey processed by keyFactory
  fn = (givenKey)->
    do_transform = (obj, commandName)->
      obj[commandName] = db[commandName].bind(db, makeKey(givenKey))
    _.transform commandNames, do_transform, {}
  # Decorate factory with redis commands which
  # are NOT curried but WILL pass the givenKey
  # to keyFactory
  do_transform = (obj, commandName)->
    obj[commandName] = (givenKey, args...)->
      db[commandName](makeKey(givenKey), args...)
  _.transform commandNames, do_transform, fn