document.addEventListener("keydown", function(e) {
  if (e.keyCode == 13) {
    toggleFullScreen();
  }
}, false);

var t=0;

var stage = new Stage("canvas-container")
  , colorPalette = document.getElementById("color-palette")
  , colors = [].slice.apply(colorPalette.getElementsByClassName("color"))
  , navbar = document.getElementById("navbar")
  , buttons = [].slice.apply(navbar.getElementsByClassName("btn"))
  , eventSource = new MouseEventSource("canvas-container")
  , layer = new Layer(eventSource)
  , remoteInputs = {}
  ,	remoteLayers = [];

colors.map(function (element) {
	element.style.backgroundColor = element.getAttribute("color");
});

navbar.addEventListener("click", function (e) {
	if(e.target.className.indexOf("btn") > -1) eventSource.fire(e.target.getAttribute("event"), { value: e.target.getAttribute("value")});
})
colorPalette.addEventListener("click", function (e) {
	if(e.target.className.indexOf("color") > -1) eventSource.fire("changecolor", { value: e.target.getAttribute("color")});
});

var infinity = new AnimationFrameLoop(function () {
	stage.clear();

	eventSource.setTime(t);

	layer.draw(t,stage);
	remoteLayers.map( function (layer) { 
		layer.draw(t, stage); 
	});

	t += 1;
});

var socket = io.connect('http://localhost:3000/');

socket.on('welcome', function (data) {
	console.log(data.msg);
	eventSource.onAny(function (type, e) {
		socket.emit('remote event', [].slice.call(arguments) );
	})
});

socket.on('new player', function (data) {
	console.log(data.msg);
	remoteInputs[data.id] = makeObservable({});
	remoteLayers.push(new Layer(remoteInputs[data.id]));

	socket.emit('remote event history', {
		id: data.id,
		events: layer.eventHistory 
	});	
});

socket.on('remote event history', function (data) {
	console.log(data.msg);
	remoteInputs[data.id] = makeObservable({});
	remoteLayers.push(new Layer(remoteInputs[data.id]));
	remoteInputs[data.id].fireMany( data.events );
});

socket.on('remote event', function (data) {
	console.log(data.msg);
	if(remoteInputs[data.id]!== undefined) remoteInputs[data.id].fire.apply(null, data.event) ;
});





