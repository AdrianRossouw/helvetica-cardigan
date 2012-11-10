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

// Backbone Augment wrapper.
Backbone.Model.augment = Backbone.Collection.augment =
Backbone.Router.augment = Backbone.View.augment = function(props) {
    var obj = this.prototype;
    for (var key in props) {
        if (typeof props[key] === 'function') {
            obj[key] = _.wrap(obj[key], props[key]);
        } else if (_.isArray(props[key])) {
            obj[key] = _.isArray(obj[key]) ? obj[key].concat(props[key]) : props[key];
        } else if (typeof props[key] === 'object') {
            obj[key] = _.extend({}, obj[key], props[key]);
        } else {
            obj[key] = props[key];
        }
    }

    return this;
};


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
        this.dimensions = [75, 75];
        _.bindAll(this, 'setup');
    },

    setup: function(socket) {
        var fridge = this;

        this.words.on('change', function() {
            socket.emit('words:change', arguments);
        });
        socket.on('words:change', function(args) {
            var model = args[0];
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
