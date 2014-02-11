'use strict';
var util = require('util'),
    format = util.format;
var lo = require('lodash'),
    first = lo.first,
    map = lo.map,
    flatten = lo.flatten,
    curry = lo.curry,
    each = lo.each,
    filter = lo.filter,
    rest = lo.rest,
    transform = lo.transform,
    isFunction = lo.isFunction,
    isArray = lo.isArray;
var keyshapeable_redis_commands = require('./keyshapeable-redis-commands');

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

function augment(o, k, v){
  if (o[k]) throw new Error('Cannot augment object, key already taken: ' + k);
  o[k] = v;
  return o;
}

function to_upper_case(str){
  return str.toUpperCase();
}



// Augment redis_client with keyshapes exposed
// as methods whose names' are inferred from each
// one's given key_pat.

// Add keyshape to redis_client exposed
// as method named using key_pat_to_fname
// inferance.
//
// @api public
//
function add_keyshape(redis_client, key_pat){
  add_keyshape_manual(redis_client, key_pat_to_fname(key_pat), key_pat);
}

exports.add_keyshape = curry(add_keyshape);


// Create an object with redis_client methods that
// augment the given 'key' arg, and then passthrough
// to the wrapped redis_client.
//
// @api public
//
function create_keyshape(redis_client, key_pat){
  var make_key = create_key_maker(key_pat);
  return do_create_keyshape(redis_client, make_key);
}

exports.create_keyshape = curry(create_keyshape);


// Add keyshape to redis_client exposed
// as method named using custom identifier.
//
// @api private
//
function setup_keyshape_hash(redis_client){
  redis_client._keyshapes = {};
  // Wrap multi command to return an object with all keyshapes.
  var multi = redis_client.multi;
  redis_client.multi = function(){
    var mutli_client = multi.apply(redis_client, arguments);
    each(redis_client._keyshapes, function(keyshape, fname){
      augment(mutli_client, fname, keyshape);
    });
    return mutli_client;
  };
}

function add_keyshape_manual(redis_client, fname, key_pat){
  if (!redis_client._keyshapes) setup_keyshape_hash(redis_client);
  // Add new keyshape to existing keyshapes hash.
  augment(redis_client._keyshapes, fname, create_keyshape(redis_client, key_pat));
  // Expose new keyshape directly on
  // redis_client for api ergonomics.
  augment(redis_client, fname, redis_client._keyshapes[fname]);
  return redis_client;
}


function do_create_keyshape(redis_client, make_key){
  function do_transform(obj, command_name){
    var redis_keyshape_command = function(){
      var key = make_key(first(arguments));
      var args = rest(arguments);
      var f = redis_client[command_name].bind(redis_client);
      return splat(f, push(key, args));
    };
    // Keep API delta between node-redis and
    // redis-keyshape low by exposing command
    // command function on obj in both
    // lowercase AND uppercase.
    augment(obj, command_name, redis_keyshape_command);
    augment(obj, to_upper_case(command_name), redis_keyshape_command);
  }
  return transform(keyshapeable_redis_commands, do_transform, {});
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