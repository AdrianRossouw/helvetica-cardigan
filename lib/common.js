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


if ( typeof window === 'undefined' ) {
    module.exports = {
        models: models
    };
}
