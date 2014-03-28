document.addEventListener("keydown", function(e) {
  if (e.keyCode == 13) {
    toggleFullScreen();
  }
}, false);

var t=0;

var stage = new Stage(window.innerWidth, window.innerHeight);

var inputter = new Inputter(),
	layer = new Layer(inputter),
	remoteInputs = {},
	remoteLayers = [];

var infinity = new AnimationFrameLoop(function () {
	stage.clear();
	stage.rect([window.innerWidth*mod(t,100)/100,window.innerHeight-10],[1,20] );		

	inputter.setTime(t);

	layer.draw(t,stage);
	remoteLayers.map( function (layer) { 
		layer.draw(t,stage); });

	t += 1;
});

var socket = io.connect('http://10.0.3.106:3000');

socket.on('welcome', function (data) {
	inputter.onAny(function (type, e) {
		socket.emit('remote event', [].slice.call(arguments) );
	})
});

socket.on('new player', function (data) {
	remoteInputs[data.id] = makeObservable({});
	remoteLayers.push(new Layer(remoteInputs[data.id]));

	socket.emit('remote event history', {
		id: data.id,
		events: layer.eventHistory 
	});	
});

socket.on('remote event history', function (data) {
	remoteInputs[data.id] = makeObservable({});
	remoteLayers.push(new Layer(remoteInputs[data.id]));
	remoteInputs[data.id].fireMany( data.events );
});

socket.on('remote event', function (data) {
	if(remoteInputs[data.id]!== undefined) remoteInputs[data.id].fire.apply(null, data.event) ;
});





