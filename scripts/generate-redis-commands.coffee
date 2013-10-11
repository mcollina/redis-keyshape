fs = require('fs')
path = require('path')
format = require('util').format
async = require('async')
request = require('request')
_ = require('lodash')



# Functional Helpers

_.mixin
  zipObjectArrays: (keys_array, values_array)->
    do_transform = (acc, value, index)->
      acc[value] ||= []
      acc[value].push(values_array[index])
    _.transform(keys_array, do_transform, {})


# Settings

redis_commands_json_uri = 'http://redis.io/commands.json'
file_name_to_write = path.basename(__filename, '.coffee').replace('generate-','') + '.json'
file_location_to_write = path.join(__dirname, '../', file_name_to_write)


# Main

# What redis json gives us initially:
# A hash of hashes where each top-level key
# is a command name and the nested
# hash has various data about that command.
#
# What we want:
# An object where keys are redis command TYPES and
# values are arrays of command names (strings) for
# that particular redis command type.

commands_get = (callback)->
  request.get(redis_commands_json_uri, callback)

commands_restructure = (res, json, callback)->
  commands = JSON.parse(json)
  commands_ = _.zipObjectArrays(_.pluck(commands, 'group'), _.invoke(_.keys(commands), 'toLowerCase'))
  callback(null, JSON.stringify(commands_, null, 2))

commands_save = (commands_json, callback)->
  fs.writeFile(file_location_to_write, commands_json, callback)

fin = (err)->
  throw err if err
  console.log(format('◲  generated: %s', file_location_to_write))

async.waterfall [
  commands_get
  commands_restructure
  commands_save
], fin