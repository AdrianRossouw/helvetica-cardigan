var express = require('express'),
    _ = require('underscore')._,
    Backbone = require('backbone'),
    async = require('async'),
    $ = require('jquery');

var app = express();

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/lib', express.static(__dirname + '/lib'));


var server = app.listen(8000);

var io = require('socket.io').listen(server);
io.set('log level', 2);

var common = require('./lib/common'),
    db = require('./lib/db'),
    models = common.models;

var common_words = require('./common_words.json');
var wordCount = 300;

function extractWords(text) {
    var text = text.toLowerCase();
    text = text.replace(/\n/g, ' ');
    text = text.replace(/[^A-Za-z\-\'0-9\ ]/g, '');

    var words = text.split(' ');
    words = _.filter(words, function(word) {
        return (word.trim() && word.split('-').length < 3);
    });
    return words;
}

function getWordCounts(words) {
    var counts = {};
    _.each(words, function(word) {
        counts[word] = (counts[word] || 0) + 1;
    });
    return counts;
}

function generateWords(dict, common, random) {
    // helper to return a word at a random index in the dictionary.
    function randomWords() {
        var index = Math.round(Math.random() * dict.length);
        return dict[index];
    }

    // helper function to return each word in series
    // also loops over and begins again.
    function seriesWords(i) {
        var index = i % dict.length;
        return dict[index];
    };


    // We pre-seed the words with the first 100 most common english words.
    var words = (common) ? _(common_words.words).first(100) : [];

    // 2 X
    words = words.concat(common_words.prefixes);
    words = words.concat(common_words.prefixes);

    // 2 X
    words = words.concat(common_words.suffixes);
    words = words.concat(common_words.suffixes);

    // 3 X
    words = words.concat(common_words.punctuation);
    words = words.concat(common_words.punctuation);
    words = words.concat(common_words.punctuation);

    // pick 10 of each of these

    var index;
    var numMorePrefixes = common_words.morePrefixes.length;
    var numMoreSuffixes = common_words.moreSuffixes.length;
    for (var i=0; i<10; i++) {
        index = Math.round(Math.random() * numMorePrefixes);
        words.push(common_words.morePrefixes[index]);
        index = Math.round(Math.random() * numMoreSuffixes);
        words.push(common_words.moreSuffixes[index]);
    }

    // the amount of words left to reach our max quota.
    var moreWordCount = wordCount - words.length;

    // buffer/randomize the words.
    var mapFn = (random) ? randomWords : seriesWords;
    var moreWords = _.range(0, moreWordCount).map(mapFn);

    return words.concat(moreWords);
}


common.models.Fridge.augment({
    initialize: function(parent, options) {
        parent.call(this, options);
        _.bindAll(this, 'setWords', 'setup');
    },
    setWords: function(parent) {
        var fridge = this;

        function randomDim(max) {
            return Math.round(Math.random() * (max));
        }

        function generateJson(w, i) {
            return {
                id: fridge.id + '_' + i,
                fridgeid: fridge.id,
                x: randomDim(fridge.dimensions[0]),
                y: randomDim(fridge.dimensions[1]),
                word: w
            };
        }

        var extracted = extractWords(this.get('text'));

        var words = generateWords(
            extracted,
            this.get('common'),
            this.get('randomize')
        );

        var json = _(words).map(generateJson);

        this.words.reset(json);
    },
    setup: function(parent) {
        console.log("setup run for " + this.id);
        var fridge = this;

        var nsp = '/' + fridge.id;

        this.words.on('change', function() {
            io.of(nsp).emit('words:change', arguments);
        });

        io.of(nsp).on('connection', function(socket) {
            socket.emit('fridge', fridge.toJSON());

            socket.on('words:change', function(args) {
                console.log('got change event from client');
                var json = args[0];
                var word = fridge.words.get(json.id);
                word.set({ x: json.x, y: json.y });
                word.save();
            });
        });
    },
    isNew: function(parent) {
        return !this.has('created');
    },
    sync: function(parent, method, model, options) {
        var dfr = new $.Deferred();

        dfr.then(options.success, options.error);

        if (!_.include(['read', 'create'], method)) {
            dfr.reject('Unsupported Method');
        } else if (method == 'read') {
            // fetching
            db.getFridge(model.id, function(err, fridge) {
                if (err) { return dfr.reject("Could not load fridge"); }
                dfr.resolve(fridge);
            });
        } else if (method == 'create') {
            // saving
            model.set('created', Date.now());
            db.addFridge(model.toJSON(), function(err, data) {
                if (err) return dfr.reject("Could not save fridge");
                dfr.resolve(model.toJSON()); // should we be passing data back?
            });
        }

        return dfr.promise();
    }
});

models.Word.augment({
    sync: function(parent, method, model, options) {
        var dfr = new $.Deferred();

        dfr.then(options.success, options.error);

        if (!_.include(['update'], method)) {
            dfr.reject('Unsupported Method');
        } else if (method == 'update') {
            db.setWord(model.toJSON(), function(err, data) {
                console.log(err);
                if (err) return dfr.reject("Could not update word");
                dfr.resolve(model.toJSON());
            });
        }

        return dfr.promise();
    }
});

var fridges = {};

var _fridge = fridges.default = new models.Fridge({id: 'default'});


_fridge.fetch()
    .fail(function() { _fridge.setWords(); _fridge.save(); })
    .always(_fridge.setup);

function loadFridge(req, res, next) {
    var id = req.params.id || 'default';

    if (fridges[id]) return res.sendfile('index.html');

    var fridge = fridges[id] = new models.Fridge({id: id});
    var onErr = _.bind(res.send, res, 404);

    fridge.fetch().then(function() {
        fridge.setup();
        res.sendfile('index.html');
    }, onErr);
}

app.get('/', loadFridge);
app.get('/f/:id', loadFridge);


app.post('/', function(req, res) {
    function getParams(m, d, k) {
        m[k] = req.params[k] || d;
        return m;
    }
    
    var id = _.uniqueId('fridge');

    var attrs = _(models.Fridge.prototype.defaults).reduce(getParams, {});
    attrs.id = id;

    var fridge = fridges[id] = new models.Fridge(attrs);
    fridge.setWords();

    var onErr = function() { res.redirect('/f/' + id); }

    var log = _.bind(console.log, console);
    fridge.save().then(log, log)
        .done(fridge.setup)
        .always(onErr)
});

console.log('Server running at http://0.0.0.0:8000/');
