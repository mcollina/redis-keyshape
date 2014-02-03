'use strict';
var util = require('util'),
    format = util.format;
var lo = require('lodash'),
    curry = lo.curry,
    first = lo.first,
    filter = lo.filter,
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



exports.setup_keyshapes = setup_keyshapes;
exports.create_keyshape = create_keyshape;

// Augment redis_client with keyshapes exposed
// as methods whose names' are inferred from each
// one's given key_pat.
function setup_keyshapes(redis_client){
  var actions = {
    // Add keyshape to redis_client exposed
    // as method named using key_pat_to_fname
    // inferance.
    add: function(key_pat, keytype){
      actions.add_manual(key_pat_to_fname(key_pat), key_pat, keytype);
      return actions;
    },
    // Add keyshape to redis_client exposed
    // as method named using custom identifier.
    add_manual: function(fname, key_pat, keytype){
      redis_client[fname] = create_keyshape(redis_client, keytype, key_pat);
      return actions;
    }
  };
  return actions;
}

// Create an object with redis_client methods that
// augment the given 'key' arg, and then passthrough
// to the wrapped redis_client.
function create_keyshape(redis_client, key_type, key_pat){
  // validate the given key_type
  assert_valid_key_type(key_type);
  var key_commands = get_key_commands(key_type);
  var make_key = create_key_maker(key_pat);
  return do_create_keyshape(redis_client, make_key, key_commands);
}

function do_create_keyshape(redis_client, make_key, command_names){
  function do_transform(obj, command_name){
    obj[command_name] = function(/*key_name_vars, key_args...*/){
      return splat(redis_client[command_name].bind(redis_client), push(make_key(first(arguments)), rest(arguments)));
    };
  }
  return transform(command_names, do_transform, {});
}



// Domain Helpers

function key_pat_to_fname(key_pat){
  return filter(key_pat.split(':'), function(part){ return part !== '%s'; }).join('_');
}


// Generate a function that resolves given input to a redis-key.
//
// @key_pat
//   There are two ways to create a keyMaker based on type:
//   1 <String>s are wrapped in a function which when invoked
//     interpolates its arguments into string in order, ALA sprintf.
//   2 <Function>s are used as-is (user handles logic).
function create_key_maker(key_pat){
  return isFunction(key_pat) ? key_pat : Default_Key_Maker(key_pat) ;
}

function Default_Key_Maker(key_pat){
  function make_key(given_key){
    return splat(format, push(key_pat, arrayify(given_key)));
  }
  return make_key;
}


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