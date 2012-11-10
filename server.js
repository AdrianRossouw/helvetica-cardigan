var express = require('express');

var app = express();

app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

app.listen(8000);

console.log('Server running at http://0.0.0.0:8000/');
