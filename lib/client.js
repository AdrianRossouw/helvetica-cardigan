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

var ToggleFormView = Backbone.View.extend({
    formVisible: false,

    events: {
        'click .toggle-form': 'toggleForm'
    },

    toggleForm: function() {
        if (this.formVisible) {
            this.hideForm();
        } else {
            this.showForm();
        }
    },

    showForm: function() {
        this.formVisible = true;
        this.$form.removeClass('hidden').addClass('visible');
    },

    hideForm: function() {
        this.formVisible = false;
        this.$form.addClass('hidden').removeClass('visible');
    }
});

var addFridgeView;
var AddFridgeView = ToggleFormView.extend({
    className: "add-fridge-ui",

    events: _.defaults({
        'focus textarea[name=text]': 'focusText'
    }, ToggleFormView.prototype.events),

    render: function() {
        this.$toggleButton = $(
            '<button class="btn toggle-form">add</button>');

        this.$form = $(
            '<form action="/" method="post" class="add-form"></form>');

        // title
        this.$titleField = $('<div class="field"></div>');
        this.$titleLabel = $('<label for="title">title</label>');
        this.$titleInput = $('<input type="text" name="title" value="">');
        this.$titleField.append(this.$titleLabel);
        this.$titleField.append(this.$titleInput);
        this.$form.append(this.$titleField);

        // description
        this.$descriptionField = $('<div class="field"></div>');
        this.$descriptionLabel = $(
            '<label for="description">description</label>');
        this.$descriptionInput = $(
            '<textarea name="description"></textarea>');
        this.$descriptionField.append(this.$descriptionLabel);
        this.$descriptionField.append(this.$descriptionInput);
        this.$form.append(this.$descriptionField);

        // text
        this.$textField = $('<div class="field"></div>');
        this.$textLabel = $('<label for="text">words</label>');
        this.$textInput = $('<textarea name="text"></textarea>');
        this.$textField.append(this.$textLabel);
        this.$textField.append(this.$textInput);
        this.$form.append(this.$textField);

        this.$textInput.val(this.model.get('text'));

        //common (bool)
        this.$commonField = $('<div class="field"></div>');
        this.$commonLabel = $(
            '<label for="common">include common words, punctuation,<br>'+
            'prefixes and suffixes</label>');
        this.$commonInput = $(
            '<input type="checkbox" name="common" checked value="true">');
        this.$commonField.append(this.$commonInput);
        this.$commonField.append(this.$commonLabel);
        this.$form.append(this.$commonField);

        // randomize (bool)
        this.$randomizeField = $('<div class="field"></div>');
        this.$randomizeLabel = $('<label for="randomize">randomize</label>');
        this.$randomizeInput = $(
            '<input type="checkbox" name="randomize" checked value="true">');
        this.$randomizeField.append(this.$randomizeInput);
        this.$randomizeField.append(this.$randomizeLabel);
        this.$form.append(this.$randomizeField);

        this.$formButtons = $('<div class="buttons"></div>');
        this.$addButton = $('<input type="submit" class="btn" '+
            'value="create my fridge">');
        //this.$cancelButton = $('<button class="cancel">Cancel</button>');
        this.$formButtons.append(this.$addButton);
        this.$formButtons.append(this.$cancelButton);
        this.$form.append(this.$formButtons);

        this.$el.append(this.$toggleButton);
        this.$el.append(this.$form);

        this.hideForm();

        return this;
    },

    focusText: function() {
        setTimeout(_.bind(function() {
            this.$textInput.get(0).select();
        }, this));
    }
});

var shareFridgeView;
var ShareFridgeView = ToggleFormView.extend({
    className: "share-fridge-ui",

    events: _.defaults({
        'focus input[name=url]': 'focusURL'
    }, ToggleFormView.prototype.events),

    render: function() {
        this.$toggleButton = $(
            '<button class="btn toggle-form">share</button>');
        this.$form = $(
            '<form action="/" method="post" class="share-form"></form>');

        // url
        this.$urlField = $('<div class="field"></div>');
        this.$urlInput = $(
            '<input type="text" name="url" value="" readonly>');
        this.$urlField.append(this.$urlInput);
        this.$form.append(this.$urlField);

        this.$urlInput.val(location.href);

        this.$el.append(this.$toggleButton);
        this.$el.append(this.$form);

        this.hideForm();

        return this;
    },

    focusURL: function() {
        setTimeout(_.bind(function() {
            this.$urlInput.get(0).select();
        }, this));
    }
});

function addCreateUI(fridge) {
    addFridgeView = new AddFridgeView({model: fridge});
    $('body').append(addFridgeView.render().el);
    $('body').append('<a href="/" class="word back">Helvetica Cardigan</a>')
}

function addShareUI(fridge) {
    shareFridgeView = new ShareFridgeView({model: fridge});
    $('body').append(shareFridgeView.render().el);
    $('body').append('<a href="/" class="word back">&larr;</a>')
}

function init(json) {
    if (!fridge) {
        fridge = new models.Fridge();
        fridge.setup(socket);
    }
    fridge.set(fridge.parse(json));

    $('title').text(fridge.get('title'));

    if (!fridgeView) {
        fridgeView = new FridgeView({model: fridge});
        $('body').append(fridgeView.render().el);

        if (fridge.id == 'default') {
            addCreateUI(fridge);
        } else {
            addShareUI(fridge);
        }
    }

}

$(document).ready(function() {
    // connect to a specfic namespace.
    var parts = document.location.pathname.slice(1).split('/');

    var id = (parts.length > 1 && parts[0] == 'f') ? parts[1] : 'default';
    socket = io.connect('/' + id);

    socket.on('fridge', function(json) {
        //console.log('fridge received!', json);
        init(json);
    });
});
