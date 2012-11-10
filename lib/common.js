/**
 * Code that is shared between the server and the client.
*/

// Backbone.noConflict support. Save local copy of Backbone object.
var Backbone, _;

// CommonJS shim
if (typeof window === 'undefined') {
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
});

models.Words = Backbone.Collection.extend({
    model: models.Word
});


models.Fridge = Backbone.Model.extend({
    initialize: function(opts) {
        this.words = new models.Words();
        this.dimensions = [100, 100];
        _.bindAll(this, 'setupServer', 'setupClient');
    },
    setupServer: function(io) {
        var fridge = this;

        var test_text = 'Tofu farm-to-table cardigan helvetica before they sold out mumblecore'
            + ' truffaut iphone seitan master cleanse trust fund banh mi shoreditch retro PBR master cleanse pop-up quinoa Jean shorts terry richardson readymade squid mlkshk tattooed Post-ironic thundercats kogi ethical swag art party street art Aesthetic helvetica readymade fingerstache american apparel messenger bag Vinyl sustainable mlkshk gastropub you probably haven\'t heard of them VHS salvia narwhal ennui lo-fi tattooed Photo booth art party blog pinterest occupy pour-over bespoke skateboard pitchfork food truck High life polaroid pickled williamsburg hella master cleanse 8-bit single-origin coffee tumblr fanny pack stumptown skateboard letterpress pickled, organic chambray jean shorts narwhal american apparel cosby sweater Scenester raw denim tattooed godard letterpress Austin blog squid dreamcatcher keffiyeh pinterest kogi umami banh mi ethnic American apparel mixtape bushwick leggings cosby sweater biodiesel vinyl high life brunch lomo next level Austin post-ironic bespoke Pop-up bespoke raw denim +1 banksy typewriter leggings whatever mlkshk stumptown wayfarers cliche skateboard beard shoreditch';

        var json = _(test_text.split(' ')).map(function(w, i) {
            return {
                id: _.uniqueId('word'),
                x: 5 + Math.round(Math.random() * (fridge.dimensions[0] - 5) * 0.5),
                y: 5 + Math.round(Math.random() * (fridge.dimensions[1] - 5) * 0.5),
                word: w
            };
        });

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
    setupClient: function(socket) {
        this.words.on('change', function() {
            socket.emit('words:change', arguments);
        });
        socket.on('words:change', function(args) {
            var model = args[0];
            console.log('got change event from server');
            fridge.words.get(model.id).set({
                    x: model.x,
                    y: model.y
                });
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

if (typeof window === 'undefined') {
    module.exports = {
        models: models
    };
}
