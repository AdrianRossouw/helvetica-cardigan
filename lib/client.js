/**
 * Client side code for application.
 *
 * This is primarily the views and so forth.
 */

var unitSize = 22;

var WordView = Backbone.View.extend({
    className: "word",

    render: function() {
        this.$el.html(this.model.get('word'));

        this.$el.css({
            top: this.model.get('x')*unitSize,
            left: this.model.get('y')*unitSize
        });

        return this;
    }
});

var WordsView = Backbone.Marionette.CollectionView.extend({
    clasName: "words",
    itemView: WordView
});

var PlayerView = Backbone.View.extend({
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
        this.wordsView = new WordsView({collection: options.words});
        //this.playersView = new PlayersView({collection: options.players});
    },

    render: function() {
        this.$el.append(this.wordsView.render().el);
        //this.$el.append(this.playersView.render().el);
        return this;
    }
});

$(document).ready(function() {
    var socket = io.connect();
    socket.on('state', function(state) {
        //$('body').html('HELLO WORLD, your sockets are ready!');
        console.log('state received!', state);
    });
});
