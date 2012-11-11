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
    // We pre-set these defaults to the default room, because it's a bit cleaner
    // than finding some additional place to do this.
    defaults: {
        title: "Helvetica Cardigan",
        description: "Hipster Fridge Poetry",
        text: "occupy semiotics high life authentic wes anderson put a bird on it thundercats mlkshk vinyl pork belly umami swag cardigan pop-up kale chips small batch organic raw denim chillwave street art austin banh mi post-ironic cray pitchfork mcsweeney's selvage wayfarers helvetica pbr gentrify flexitarian keytar ethnic chambray messenger bag freegan typewriter letterpress wolf carles gastropub aesthetic iphone farm-to-table tofu sustainable hella pour-over direct trade cliche cosby sweater odd future brooklyn artisan fingerstache ennui keffiyeh mustache party single-origin coffee shoreditch four loko polaroid moon twee photo booth marfa truffaut pinterest sriracha echo park you probably haven't heard of them bicycle rights pickled next level jean shorts tattooed whatever readymade locavore banksy williamsburg etsy 8-bit lomo godard mumblecore kogi before they sold out diy narwhal vegan leggings yr blog synth brunch skateboard trust fund american apparel scenester craft beer irony beard salvia dreamcatcher terry richardson seitan food truck stumptown quinoa squid lo-fi gluten-free portland mixtape sartorial hoodie master cleanse butcher vice fanny pack viral fixie biodiesel bushwick cred bespoke ethical retro forage tumblr vhs",
        common: true,
        randomize: true
    },
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
        return { attrs: this.toJSON(), words: this.words.toJSON(), dimensions: this.dimensions };
    },
    inflate: function(data) {
        this.set(data.attrs);
        this.dimensions = data.dimensions;
        this.words.reset(data.words);
    }
});

if (typeof window === 'undefined') {
    module.exports = {
        models: models
    };
}
