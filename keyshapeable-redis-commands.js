'use strict';
var lo = require('lodash'),
    curry = lo.curry,
    flatten = lo.flatten,
    map = lo.map;
var redis_commands = require('./redis-commands');

// Functional Utils

var get_from = curry(function(coll, prop){ return coll[prop]; });



// Create a subset of redis commands that are applicable to keyshapes
var keyshapeable_key_types = ['generic', 'list', 'set', 'hash', 'sorted_set', 'string'];
var keyshapeable_redis_commands = flatten(map(keyshapeable_key_types, get_from(redis_commands)));
module.exports = keyshapeable_redis_commands;