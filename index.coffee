_ = require('lodash')
redis_commands = require('./redis-commands')
format = require('util').format



# Utilities

arrayify = (maybe_array)->
  if _.isArray(maybe_array) then maybe_array else [maybe_array]


module.exports = (db, key_format, key_type)->
  # validate the given key_type
  if not redis_commands[key_type] then throw new Error format('Unknown redis key type: %j. Redis keys are: %j', key_type, _.keys(redis_commands))
  # always add generic redis-commands in addition to the key_type's
  redis_commands_sub_set = _.flatten(
    [redis_commands[key_type], redis_commands['generic']]
  )
  make_key = create_key_maker(key_format)
  do_create_key_guard(db, make_key, redis_commands_sub_set)


# Used to generate a database-key name.
#
# @key_format
#   There are two ways to create a keyMaker based on type:
#   1 <String>s are wrapped in a function which when invoked
#     interpolates its arguments into string in order, ALA sprintf.
#   2 <Function>s are used as-is (user handles logic).
create_key_maker = (key_format)->
  make_key_from_strings = (givenKey)->
    format(key_format, arrayify(givenKey)...)
  switch typeof key_format
    when 'function' then key_format
    when 'string'   then make_key_from_strings
    else # TODO err


do_create_key_guard = (db, make_key, command_names)->
  # Create a factory that accepts a givenKey, and returns
  # an object of redis commands whose 'key' argument
  # has been "curried" with the result of givenKey processed by keyFactory
  fn = (givenKey)->
    do_transform = (obj, command_name)->
      obj[command_name] = db[command_name].bind(db, make_key(givenKey))
    _.transform command_names, do_transform, {}
  # Decorate factory with redis commands which
  # are NOT curried but WILL pass the givenKey
  # to keyFactory
  do_transform = (obj, command_name)->
    obj[command_name] = (givenKey, args...)->
      db[command_name](make_key(givenKey), args...)
  _.transform command_names, do_transform, fn