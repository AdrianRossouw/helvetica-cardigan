/**
 * Client side code for application.
 *
 * This is primarily the views and so forth.
 */

var state;
var fridgeView;
var socket;
var unitSize = 22;

var WordView = Backbone.Marionette.ItemView.extend({
    className: 'word',

    modelEvents: {
        change: 'modelChange'
    },

    initialize: function(options) {
        _.bindAll(this, 'preventAnimation', 'setPosition');
    },

    updatePosition: function() {
        this.$el.addClass('animate');
        this.$el.css({
            left: Math.round(this.model.get('x') * unitSize) + 'px',
            top: Math.round(this.model.get('y') * unitSize) + 'px'
        });
    },

    render: function() {
        this.$el.html(this.model.get('word'));

        this.updatePosition();

        // HACK
        setTimeout(_.bind(function() {
            this.attach();
        }, this), 0);

        return this;
    },

    modelChange: function() {
        this.updatePosition();
    },

    attach: function() {
        this.$el.draggable({
            start: this.preventAnimation,
            stop: this.setPosition
        });
    },

    preventAnimation: function() {
        this.$el.removeClass('animate');
    },

    setPosition: function() {
        var left = parseInt(this.$el.css('left'), 0);
        var top = parseInt(this.$el.css('top'), 0);

        var x = left / unitSize;
        var y = top / unitSize;

        //console.log("setting", x, y);

        this.model.set({
            x: x,
            y: y
        });
    }
});

var WordsView = Backbone.Marionette.CollectionView.extend({
    className: 'words',
    itemView: WordView,

    initialize: function(options) {
        this.fridgeWidth = options.dimensions[0];
        this.fridgeHeight = options.dimensions[1];
    },

    onBeforeRender: function() {
        this.$el.css({
            width: this.fridgeWidth * unitSize + 'px',
            height: this.fridgeHeight * unitSize + 'px'
        });
    }
});

var PlayerView = Backbone.Marionette.ItemView.extend({
    className: 'player',

    render: function() {
        this.$el.html(this.model.get('name'));

        return this;
    }
});

var PlayersView = Backbone.Marionette.CollectionView.extend({
    clasName: 'players',
    itemView: PlayerView
});

var FridgeView = Backbone.View.extend({
    className: 'fridge',

    initialize: function(options) {
        this.wordsView = new WordsView({
            collection: this.model.words,
            dimensions: this.model.dimensions
        });
        //this.playersView = new PlayersView({
        //    collection: this.model.players
        //});
    },

    render: function() {
        this.$el.append(this.wordsView.render().el);
        //this.$el.append(this.playersView.render().el);
        return this;
    }
});

function init(json) {
    if (!state) {
        state = new models.State();
        state.setupClient(socket);
    }
    if (!fridgeView) {
        fridgeView = new FridgeView({model: state});
        $('body').append(fridgeView.render().el);
    }

    state.inflate(json);
}

$(document).ready(function() {
    socket = io.connect();
    socket.on('state', function(json) {
        //$('body').html('HELLO WORLD, your sockets are ready!');
        console.log('state received!', json);
        init(json);
    });
});
