var redis = require('redis');
var client = redis.createClient();
var async = require('async');
var _ = require('underscore')._;


client.on("error", function(err) {
    console.log("Error " + err);
});

var db = {};

// fridges

db.getFridges = function(callback) {
    getFridgeIds(function(err, ids) {
        if (err) return callback(err);
        async.map(ids, getFridge, callback);
    });
};

db.getFridgeIds = function(callback) {
    client.smembers("fridgeids", callback);
};

db.getFridge = function(id, callback) {
    client.multi()
        .hgetall('fridge:'+id)
        .smembers('fridge:'+id+':wordids')
        .exec(function(err, replies) {
            if (err) return callback(err);
            if (!replies[0]) return callback("Not found");

            var fridge = replies[0];
            var wordids = replies[1];
            console.log(wordids);
            async.map(wordids, db.getWord, function(err, words) {
                if (err) return callback(err);
                fridge.words = words;
                callback(null, fridge);
            });
        });
};

db.addFridge = function(json, callback) {
    var hasId = json.id;
    var hasIds = true;
    _.each(json.words, function(word) {
        if (!word.id) hasIds = false;
        if (!word.fridgeid) {
            word.fridgeid = json.id;
        }
    });
    if (!hasId || !hasIds) {
        return callback("Make sure everything has an id!");
    }

    function reduceFn(m, p, k) {
        !_.isArray(p) && (m[k] = p);
        return m;
    }
    client.multi()
        .sadd('fridgeids', json.id)
        .hmset('fridge:'+json.id, 'id', _.reduce(json, reduceFn, {}))
        .exec(function(err, replies) {
            if (err) return callback(err);
            async.map(json.words, db.setWord, callback);
        });
};

db.updateFridge = function(json, callback) {
    if (!json.id) {
        return callback("Make sure everything has an id!");
    }
    client.hmset('fridge:'+json.id, json, callback);
};

// words

/*
db.getWords = function(fridgeId) {
};

db.getWordIds = function(fridgeId) {
};
*/

db.getWord = function(id, callback) {
    client.hgetall('word:'+id, callback);
};

db.setWord = function(json, callback) {
    if (!json.id || !json.fridgeid) {
        return callback("Make sure everything has an id!");
    }
    client.multi()
        .sadd('fridge:'+json.fridgeid+':wordids', json.id)
        .hmset('word:'+json.id, json)
        .exec(callback);
};

module.exports = db;

