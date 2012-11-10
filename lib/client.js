/**
 * Client side code for application.
 *
 * This is primarily the views and so forth.
 */

var state;
var fridgeView;
var unitSize = 22;

var WordView = Backbone.Marionette.ItemView.extend({
    className: "word",

    render: function() {
        this.$el.html(this.model.get('word'));

        this.$el.css({
            left: this.model.get('x')*unitSize+'px',
            top: this.model.get('y')*unitSize+'px'
        });

        return this;
    }
});

var WordsView = Backbone.Marionette.CollectionView.extend({
    className: "words",
    itemView: WordView,

    initialize: function(options) {
        this.fridgeWidth = options.dimensions[0];
        this.fridgeHeight = options.dimensions[1];
    },

    onBeforeRender: function() {
        this.$el.css({
            width: this.fridgeWidth*unitSize+'px',
            height: this.fridgeHeight*unitSize+'px'
        });
    }
});

var PlayerView = Backbone.Marionette.ItemView.extend({
    className: "player",

    render: function() {
        this.$el.html(this.model.get('name'));

        return this;
    }
});

var PlayersView = Backbone.Marionette.CollectionView.extend({
    clasName: "players",
    itemView: PlayerView
});

var FridgeView = Backbone.View.extend({
    className: "fridge",

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
    if (!state) state = new models.State();
    if (!fridgeView) {
        fridgeView = new FridgeView({model: state});
        $('body').html(fridgeView.render().el);
    }

    state.inflate(json);
}

$(document).ready(function() {
    var socket = io.connect();
    socket.on('state', function(json) {
        //$('body').html('HELLO WORLD, your sockets are ready!');
        console.log('state received!', json);
        init(json);
    });
});
