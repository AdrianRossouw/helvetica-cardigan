var redis = require('redis');
var async = require('async');
var _ = require('underscore')._;


var port = process.env.REDIS_PORT || 6379;
var host = process.env.REDIS_HOST || '127.0.0.1';
var pass = process.env.REDIS_PASS || null;

var client = redis.createClient(port, host);

if (pass) {
    client.auth(pass, function (err) {
        if (err) throw err;

        // You are now connected to your redis.
    });
}

client.on("error", function(err) {
    console.log("redis error " + err);
});

var db = {};
db.resetFridges = function(callback) {
    client.flushall(callback);
}

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
    var fridgeData = _.reduce(json, reduceFn, {});
    client.multi()
        .sadd('fridgeids', json.id)
        .hmset('fridge:'+json.id, fridgeData)
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

