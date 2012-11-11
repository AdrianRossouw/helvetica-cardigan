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
            var fridge = replies[0];
            var wordids = replies[1];
            async.map(wordids, getWord, function(err, words) {
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

    client.multi()
        .sadd('fridgeids', json.id)
        .hset('fridge:'+json.id, 'id', json.id)
        .exec(function(err, replies) {
            if (err) return callback(err);
            async.map(json.words, db.addWord, callback);
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

db.getWord = function(id) {
    client.hgetall('word:'+id, callback);
};

db.setWord = function(json, callback) {
    if (!json.id || !json.fridgeid) {
        return callback("Make sure everything has an id!");
    }
    client.multi()
        .sadd('fridgeid:'+json.fridgeid+':wordids', json.id)
        .hmset('word:'+json.id, json)
        .exec(callback);
};

module.exports = db;

