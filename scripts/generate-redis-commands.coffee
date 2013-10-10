async = require('async')
request = require('request')
fs = require('fs')
_ = require('lodash')
path = require('path')



redis_commands_json_uri = 'http://redis.io/commands.json'
file_name = path.basename(__filename, '.coffee').replace('generate-','') + '.json'
file_location = path.join(__dirname, '../', file_name)

get_redis_commands = ->
  async.waterfall [
    (cb)-> request.get(redis_commands_json_uri, cb)
    (res, body, cb)-> restructure_response_json(body, cb)
    (commands_json, cb)->
      fs.writeFile(file_location, commands_json, cb)
  ], finish

restructure_response_json = (json, cb)->
  do_transform = (acc, val, key)->
    acc[val.group] ?= []
    acc[val.group].push(key.toLowerCase())
  commands_original = JSON.parse(json)
  commands_transformed = _.transform(commands_original, do_transform, {})
  cb(null, JSON.stringify(commands_transformed))

finish = (err)->
  throw err if err
  console.log("◲  Generated: #{file_location}")



get_redis_commands()