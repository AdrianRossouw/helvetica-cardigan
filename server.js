var express = require('express'),
    _ = require('underscore')._,
    Backbone = require('backbone');

var app = express();

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/lib', express.static(__dirname + '/lib'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

var server = app.listen(8000);

var io = require('socket.io').listen(server);
io.set('log level', 2);

var common = require('./lib/common');

var common_words = require('./common_words.json');
var hipster_words = require('./hipster_words.json');

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

function generateWords(dict) {
    // helper to return a word at a random index in the dictionary.
    function randomWords() {
        var index = Math.round(Math.random() * dict.length);
        return dict[index];
    }

    // We pre-seed the words with the first 100 most common english words.
    var baseWords = _(common_words).first(100);

    // the amount of words left to reach our max quota.
    var moreWordCount = wordCount - baseWords.length;

    // get the random words.
    var moreWords = _.range(0, moreWordCount).map(randomWords);

    return baseWords.concat(moreWords);
}


common.models.Fridge.augment({
    setup: function(parent) {
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

        var json = _(generateWords(hipster_words)).map(generateJson);

        this.words.reset(json);

        this.words.on('change', function() {
            io.sockets.emit('words:change', arguments);
        });

        io.sockets.on('connection', function(socket) {
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


var state = new common.models.Fridge({ id: 'default' });

state.setup();

console.log('Server running at http://0.0.0.0:8000/');
