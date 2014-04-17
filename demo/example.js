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
  , layer = new Layer(eventSource); 

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

	t += 1;
});





