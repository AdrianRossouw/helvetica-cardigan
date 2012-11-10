/**
 * Code that is shared between the server and the client.
*/

// Backbone.noConflict support. Save local copy of Backbone object.
var Backbone, _;

// CommonJS shim
if ( typeof window === 'undefined' ) {
    Backbone = require('backbone');
    _ = require('underscore')._;
}
else {
    Backbone = window.Backbone;
    _ = window._;
}

// Container for all the backbone.js models that represent the data.
var models = {};

models.Word = Backbone.Model.extend({
    initialize: function() {
        this.set('id', this.cid);
    }
});

models.Words = Backbone.Collection.extend({
    model: models.Word
});


models.State = Backbone.Model.extend({
    initialize: function(opts) {
        this.words = new models.Words();
        this.dimensions = [100, 100];
        _.bindAll(this, 'setupServer', 'setupClient');
    },
    setupServer: function(io) {
        var state = this;

        var test_text = 'Tofu farm-to-table cardigan helvetica before they sold out mumblecore'
            + ' truffaut iphone seitan master cleanse trust fund banh mi shoreditch retro';

        var json = _(test_text.split(' ')).map(function(w, i) {
            return {x: 0, y: i, word: w};
        });

        this.words.reset(json);

        this.words.on('change', function() {
            io.sockets.emit('words:change', arguments);
        });


        io.sockets.on('connection', function (socket) {
            socket.emit('state', state.deflate());

            socket.on('words:change', function(args) {
                var model = args[0];

                console.log('got change event from client');
                state.words.get(model.id).set(model);
            });
        });
    },
    setupClient: function(socket) {
        this.words.on('change', function() {
            socket.emit('words:change', arguments);
        });
        socket.on('words:change', function(args) {
            var model = args[0];
            console.log('got change event from server');
            state.words.get(model.id).set(model);
        });
    },
    deflate: function() {
        return { words: this.words.toJSON(), dimensions: this.dimensions };
    },
    inflate: function(data) {
        this.dimensions = data.dimensions;
        this.words.reset(data.words);
    }
});

if ( typeof window === 'undefined' ) {
    module.exports = {
        models: models
    };
}
