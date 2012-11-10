var express = require('express');

var app = express();

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/lib', express.static(__dirname + '/lib'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

var server = app.listen(8000);

var io = require('socket.io').listen(server);
io.set('log level', 2);

var common = require('./lib/common');

var state = new common.models.State();

state.setupServer();

io.sockets.on('connection', function (socket) {
    socket.emit('state', state.deflate());

    socket.on('words:change', function(args) {
        var model = args[0];

        console.log('got change event');
        state.words.get(model.id).set(model);
    });
});

console.log('Server running at http://0.0.0.0:8000/');
