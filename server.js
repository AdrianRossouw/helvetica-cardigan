var express = require('express'),
    _ = require('underscore')._,
    Backbone = require('backbone');

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
    var words = (common) ? _(common_words).first(100) : [];

    // the amount of words left to reach our max quota.
    var moreWordCount = wordCount - words.length;

    // buffer/randomize the words.
    var mapFn = (random) ? randomWords : seriesWords;
    var moreWords = _.range(0, moreWordCount).map(mapFn);

    return words.concat(moreWords);
}


common.models.Fridge.augment({
    setWords: function(parent) {
        var fridge = this;

        function randomDim(max) {
            return Math.round(Math.random() * (max));
        }

        function generateJson(w, i) {
            return {
                id: _.uniqueId('word'),
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
        var fridge = this;

        var nsp = '/' + fridge.id;

        this.words.on('change', function() {
            io.of(nsp).emit('words:change', arguments);
        });

        io.of(nsp).on('connection', function(socket) {
            socket.emit('fridge', fridge.deflate());

            socket.on('words:change', function(args) {
                var model = args[0];
                console.log('got change event from client');
                fridge.words.get(model.id).set({
                    x: model.x,
                    y: model.y
                });
            });
        });
    },
});


var fridges = {};

db.getFridge('default', function(err, fridge) {
    if (err) {
        // doesnt exist or we couldnt load it. create a new one?
        fridges.default = new models.Fridge({id: 'default'});
        fridges.default.setWords();
    } else {
        fridges.default = fridge;
    }

    fridges.default.setup();
});


app.get('/:id?', function(req, res) {
    var id = req.params.id || 'default';
    if (!fridges[id]) {
        // add conditional fridge loading code in here.
        return res.send(404, 'Sorry, we cannot find that!');
    }
    res.sendfile('index.html');
});

app.post('/', function(req, res) {
    function getParams(d, k) { return req.params[k] || d; }

    var id = _.uniqueId('fridge');
    var attrs = _(models.Fridge.prototype.defaults).map(getParams);
    attrs.id = id;

    fridges[id] = new models.Fridge(attrs);
    fridges[id].setup();
    res.redirect('/' + id);
});

console.log('Server running at http://0.0.0.0:8000/');
