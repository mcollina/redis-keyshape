'use strict';
var util = require('util'),
    format = util.format;
var lo = require('lodash'),
    curry = lo.curry,
    first = lo.first,
    rest = lo.rest,
    transform = lo.transform,
    isFunction = lo.isFunction,
    keys = lo.keys,
    isArray = lo.isArray;
var redis_commands = require('./redis-commands');

// Functional Utils
function arrayify(maybe_array){
  return isArray(maybe_array) ? maybe_array : [maybe_array] ;
}

function splat(f, args){
  return f.apply(null, args);
}

function push(a, array){
  return concat([a], array);
}

function concat(a, b){
  return a.concat(b);
}



module.exports = curry(create_keyshape);

function create_keyshape(redis_client, key_type, key_format){
  // validate the given key_type
  assert_valid_key_type(key_type);
  var key_commands = get_key_commands(key_type);
  var make_key = create_key_maker(key_format);
  return do_create_keyshape(redis_client, make_key, key_commands);
}


// Used to generate a database-key name.
//
// @key_format
//   There are two ways to create a keyMaker based on type:
//   1 <String>s are wrapped in a function which when invoked
//     interpolates its arguments into string in order, ALA sprintf.
//   2 <Function>s are used as-is (user handles logic).
function create_key_maker(key_format){
  return isFunction(key_format) ? key_format : Default_Key_Maker(key_format) ;
}
function Default_Key_Maker(key_format){
  function make_key(given_key){
    return splat(format, push(key_format, arrayify(given_key)));
  }
  return make_key;
}


function do_create_keyshape(redis_client, make_key, command_names){
  // Create a factory that accepts a given_key, and returns
  // an object of redis commands whose 'key' argument
  // has been partially applied with the result of
  // given_key processed by keyFactory
  function fn(given_key){
    function do_transform(obj, command_name){
      obj[command_name] = redis_client[command_name].bind(redis_client, make_key(given_key));
    }
    return transform(command_names, do_transform, {});
  }
  // Decorate factory with redis commands which
  // are NOT curried but WILL pass the given_key
  // to keyFactory
  function do_transform(obj, command_name){
    obj[command_name] = function(/*key_name_vars, key_args...*/){
      return splat(redis_client[command_name].bind(redis_client), push(make_key(first(arguments)), rest(arguments)));
    };
  }
  return transform(command_names, do_transform, fn);
}



// Domain Helpers
function get_key_commands(key_type){
  // always add generic redis-commands in addition to the key_type's
  return concat(redis_commands[key_type], redis_commands['generic']);
}

function assert_valid_key_type(key_type){
  if (!redis_commands[key_type]) throw Error_Unknown_key(key_type);
}

function Error_Unknown_key(key_type){
  var msg = format('Unknown redis key type: %j. Redis keys are: %j', key_type, keys(redis_commands));
  return new Error(msg);
}