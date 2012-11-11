/**
 * Client side code for application.
 *
 * This is primarily the views and so forth.
 */

var fridge;
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

var FridgeView = Backbone.View.extend({
    className: 'fridge',

    initialize: function(options) {
        this.wordsView = new WordsView({
            collection: this.model.words,
            dimensions: this.model.dimensions
        });
    },

    render: function() {
        this.$el.append(this.wordsView.render().el);
        return this;
    }
});

var addFridgeView;
var AddFridgeView = Backbone.View.extend({
    events: {
        'click .show-form': 'show'
    },

    render: function() {
        this.$showButton = $('<button class="show">Add</button>');
        this.$form = $(
            '<form action="/" method="post" class="add-form"></form>');

        // title
        this.$titleField = $('<div class="field"></div>');
        this.$titleLabel = $('<label for="title">title</label>');
        this.$titleInput = $('<input type="text" name="title" value="">');
        this.$titleLabel.append(this.$titleInput);
        this.$titleField.append(this.$titleLabel);
        this.$form.append(this.$titleField);

        // description
        this.$descriptionField = $('<div class="field"></div>');
        this.$descriptionLabel = $(
            '<label for="description">description</label>');
        this.$descriptionInput = $(
            '<textarea name="description"></textarea>');
        this.$descriptionLabel.append(this.$descriptionInput);
        this.$descriptionField.append(this.$descriptionLabel);
        this.$form.append(this.$descriptionField);

        // text
        this.$textField = $('<div class="field"></div>');
        this.$textLabel = $('<label for="text">words</label>');
        this.$textInput = $('<textarea name="text"></textarea>');
        this.$textLabel.append(this.$textInput);
        this.$textField.append(this.$textLabel);
        this.$form.append(this.$textField);

        //common (bool)
        this.$commonField = $('<div class="field"></div>');
        this.$commonLabel = $(
            '<label for="common">include common words, '+
            'prefixes and suffixes</label>');
        this.$commonInput = $(
            '<input type="checkbox" name="common" value="true">');
        this.$commonLabel.prepend(this.$commonInput);
        this.$commonField.append(this.$commonLabel);
        this.$form.append(this.$commonField);

        // randomize (bool)
        this.$randomizeField = $('<div class="field"></div>');
        this.$randomizeLabel = $('<label for="randomize">randomize</label>');
        this.$randomizeInput = $(
            '<input type="checkbox" name="randomize" value="true">');
        this.$randomizeLabel.prepend(this.$randomizeInput);
        this.$randomizeField.append(this.$randomizeLabel);
        this.$form.append(this.$randomizeField);

        this.$formButtons = $('<div class="buttons"></div>');
        this.$addButton = $('<input type="submit" value="Create">');
        this.$cancelButton = $('<button class="cancel">Cancel</button>');
        this.$formButtons.append(this.$addButton);
        this.$formButtons.append(this.$cancelButton);
        this.$form.append(this.$formButtons);

        this.$el.append(this.$showButton);
        this.$el.append(this.$form);

        return this;
    },

    show: function() {
    },

    hide: function() {
    }
});

var shareFridgeView;
var ShareFridgeView = Backbone.View.extend({
    events: {
        'click .show-form': 'show'
    },

    render: function() {
        this.$showButton = $('<button class="show">Share</button>');
        this.$form = $(
            '<form action="/" method="post" class="share-form"></form>');

        this.$el.append(this.$showButton);
        this.$el.append(this.$form);

        return this;
    },

    show: function() {
    },

    hide: function() {
    }
});

function addCreateUI() {
    console.log('create view');
    addFridgeView = new AddFridgeView();
    $('body').append(addFridgeView.render().el);
}

function addShareUI() {
    console.log('share view');
    shareFridgeView = new ShareFridgeView();
    $('body').append(shareFridgeView.render().el);
}

function init(json) {
    if (!fridge) {
        fridge = new models.Fridge();
        fridge.setup(socket);
    }
    if (!fridgeView) {
        fridgeView = new FridgeView({model: fridge});
        $('body').append(fridgeView.render().el);

        console.log(json.id);
        if (json.id == 'default') {
            addCreateUI();
        } else {
            addShareUI();
        }
    }

    fridge.inflate(json);
}

$(document).ready(function() {
    // connect to a specfic namespace.
    var pathname = document.location.pathname.replace('/', '');
    var id = pathname.length ? pathname : 'default';
    socket = io.connect('/' + id);

    socket.on('fridge', function(json) {
        console.log('fridge received!', json);
        init(json);
    });
});
