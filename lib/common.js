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
        text: "fairest increase beauty's decease tender memory thou thine thy flame abundance lies self cruel world's ornament spring waste due brow weed treasure praise sum count repair dost tomb self-love calls lovely april prime windows shalt despite wrinkles golden remember'd image spend nature's gives doth lend lends beauteous abuse canst audit unused frame dwell summer winter confounds leaves summer's flowers substance lo gracious heavenly mortal weary thyself music sweets war lov'st ear chide parts shouldst mark sing song seeming wilt prove weep hast shape hath grant belov'd hate 'gainst o fairer grow'st mayst decay store rude gift brave behold o'er barren heat beauties grow time's scythe defence takes hence lease rage death's eternal stars pluck methinks brief oft constant wouldst doom grows holds nought shows whereon height wear conceit wherefore bloody tyrant blessed rhyme maiden virtuous painted lines pen inward outward keeps drawn skill verse fill'd numbers graces touches ne'er antique compare shake buds date sometime complexion shade blunt burn wide forbid crime love's draw woman's false women's hue men's wert muse rehearse moon rare heaven's truly cover breast bearing babe gav'st dumb express'd writ wit wherein 'tis turns therein cunning grace boast whilst triumph buried frown glory fight forgot remov'd merit witness bare star loving toil haste body's blind shadow jewel clouds blot flatter daily disgrace scope contented haply wealth lack precious woe moan expense hearts holy stol'n lov'd grown growing birth style i'll sovereign basest ride hide west shine alack stain didst base wound grief sorrow bears cross deeds roses thorns canker sweetest faults amiss sins fault lawful plea needs thief twain loves remain steal evermore lest report fortune's dearest argument vulgar invention outlive absence torment leisure blame injury kill foes absent excuse know'st approve gain losing flattery shadows dull slow swift motion assur'd straight eye's heart's picture chest whence thence prize greet reasons desert seek speed groan pace tend cheek odour hang virtue gilded record judgment edge appetite to-day feeding to-morrow fill ocean shore thrice slave control hell main crown'd stands mock elsewhere sin painting knife brass win taught fears action flower steel faith forsworn tongue-tied infection bastard ere another's mend tongues add rank smell weeds suspect flies mourn vile worms birds pine eternity brain others' works sick fame sail anew cheeks praises true' bonds wretched what's errors seem'd lays growth sinful constancy confin'd prov'd proof receives brand cure catch plague minds whereto foul unkind mistress' fingers kiss perjur'd swear 'will' angel 'i hate' sworn conscience oaths bath dost thine doth doth thou thou thou thy thy thy thy",
        common: true,
        randomize: true
    },
    url: function() {
        return ((this.id === 'default') ? '' : 'f/' + this.id);
    },
    embedUrl: function() {
        return ((this.id === 'default') ? 'e/' : 'e/' + this.id);
    },
    initialize: function(opts) {
        this.words = new models.Words();
        this.dimensions = [75, 35];
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
    parse: function(data) {
        //this.dimensions = data.dimensions;
        //delete data.dimensions;

        this.words.reset(data.words);
        delete data.words;

        return data;
    }
});

models.Fridge.augment({
    toJSON: function(parent) {
        var json = parent.call(this);
        json.words = this.words.toJSON();
        //json.dimensions = this.dimensions;
        return json;
    }
});

if (typeof window === 'undefined') {
    module.exports = {
        models: models
    };
}
