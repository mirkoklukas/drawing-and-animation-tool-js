var express = require('express')
  , http = require('http')
  , app = express()
  , server = app.listen(3000)
  , io = require('socket.io').listen(server)
  , MongoClient = require('mongodb').MongoClient
  , GoogleStrategy = require('passport-google-oauth').OAuthStrategy;

app.use(express.static(__dirname + '/public'));

var clients = {};

io.sockets.on('connection', function (socket) {
	
	socket.emit("welcome", {
		"msg": "You're connected..." + socket.id,
		"id": socket.id
	});

	socket.broadcast.emit('new player', { 
		'msg': socket.id + " joined...", 
		'id': socket.id
	});

	socket.on('remote event history', function (data) {
		io.sockets.socket(data.id).emit('remote event history', { 
			msg: "Hey " + data.id + ", here is " + socket.id + "\'s history", 
			id: socket.id, 
			events: data.events
		});
	});

	socket.on('remote event', function (data) {
		socket.broadcast.emit('remote event', { 
			"msg": "Received remote event...", 
			"id": socket.id, 
			"event": data
		});
	});
	
	socket.on('disconnect', function () {
		console.log('Disconnect: ' + socket.id);
		socket.broadcast.emit('player left', { 
			msg: socket.id + " left..."
		});
    });
});

app.get('/', function(req, res){
	res.sendfile("./public/chrono.html");
});


