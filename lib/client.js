/**
 * Client side code for application.
 *
 * This is primarily the views and so forth.
 */


$(document).ready(function() {
    var socket = io.connect();
    socket.on('helloWorld', function() {
        $('body').html('HELLO WORLD, your sockets are ready!');
    });
});
