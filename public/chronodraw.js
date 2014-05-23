var extractMousePosition = function(e) {
	var posx = 0;
	var posy = 0;
	if (!e) var e = window.event;
	if (e.pageX || e.pageY) 	{
		posx = e.pageX;
		posy = e.pageY;
	}
	else if (e.clientX || e.clientY) 	{
		posx = e.clientX + document.body.scrollLeft
			+ document.documentElement.scrollLeft;
		posy = e.clientY + document.body.scrollTop
			+ document.documentElement.scrollTop;
	}
	return [posx, posy];
}

var Stage = function (containerId) {
	var container = window.document.getElementById(containerId);
	var canvas = window.document.createElement("canvas");
	container.appendChild(canvas);
	canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
	var ctx = canvas.getContext('2d');

	this.resize = function () {
		canvas.width = container.offsetWidth;
    	canvas.height = container.offsetHeight;
	};

    this.pixel = function(position) {
	    ctx.fillStyle = '#ffffff';
	    ctx.fillRect(position[0], position[1], 1, 1);
	};
	
	this.rect = function(position, size) {
	    ctx.fillStyle = '#ffffff';
	    ctx.fillRect(position[0], position[1], size[0], size[1]);
	};

	this.path = function(vertices, w, color) {
		if(vertices.length > 0) {

			// todo: if we have a constant path, 
			// i.e. the vertices are all equal, nothing is printed

			ctx.beginPath();
			ctx.lineWidth = w;
			ctx.strokeStyle= color;
			ctx.moveTo(vertices[0][0],vertices[0][1]);

			for(var i = 1, max = vertices.length; i < max; i++) {
				ctx.lineTo(vertices[i][0],vertices[i][1]);
			}

			ctx.stroke(); 
		}
	};

	this.clear = function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

};

var makeObservable = function (obj) {
	var callbacks =  {};

	obj.on =  function (type, f) {
		(callbacks[type] = callbacks[type] || []).push(f);
		return obj;
	};

	obj.fire = function (type, data) {
		var args = [].slice.call(arguments, 1);
		(callbacks[type] || []).map(function (f) {
			f.apply(obj, args || null);
		});
		
		(callbacks["any"] || []).map(function (f) {
			f.apply(obj, [type].concat(args) );
		});
		return obj;
	};

	obj.fireMany = function (events) {
		var that = this;
		events.map(function (args) {
			that.fire.apply(that, args);
		});
	};
	
	obj.onAny = function (f) {
		(callbacks["any"] = callbacks["any"] || []).push(f);
		return obj;
	};

	return obj;
}

var mutateObservable = function (obj, f) {
	var mutation = makeObservable({});
	obj.onAny(bind(mutation,f));
	return mutation;
};

var AnimationFrameLoop = function (update) {
	var requestAnimationFrame = window.requestAnimationFrame || 
								window.mozRequestAnimationFrame ||
                              	window.webkitRequestAnimationFrame || 
                              	window.msRequestAnimationFrame;


	requestAnimationFrame(function tick() {
		update();
		requestAnimationFrame(tick);
	});
};

var MouseEventSource = function (elementId) {
	var time
	  , element = window.document.getElementById(elementId)
	  , parentOffset = element.getBoundingClientRect()
	  , that = this;

	makeObservable(this);

	this.setTime = function (t) {
		time = t;
	}

	window.addEventListener("mousedown", function (e) {
		that.fire("mousedown", { 
			time: time,
			t: time,
			x: e.pageX - parentOffset.left,
			y: e.pageY - parentOffset.top
		});
    });

	window.addEventListener("mouseup", function (e) {
    	that.fire("mouseup",  { 
			time: time,
			t: time,
			x: e.pageX - parentOffset.left,
			y: e.pageY - parentOffset.top
		});
    });

	window.addEventListener("mousemove", function (e) {
    	that.fire("mousemove",  { 
			time: time,
			t: time,
			x: e.pageX - parentOffset.left,
			y: e.pageY - parentOffset.top
		});
    });
}


var Layer = function (eventSource) {

	this.eventSource = eventSource;
	this.active = false;
	this.traces = [];
	this.eventHistory = [];
	this.attr = {
		tail: 30,
		period: 100,
		width: 2,
		color: "#ddd"
	};

	// Default Behavior
	eventSource.onAny( bind(this,function (type, e) {
		this.eventHistory.push([].slice.call(arguments));
	}));
	eventSource.on("mousedown", bind(this, this.onMouseDown));
	eventSource.on("mouseup", bind(this, this.onMouseUp));
	eventSource.on("mousemove", bind(this, this.onMouseMove));
	eventSource.on("changecolor", bind(this, this.onChangeColor) );
	eventSource.on("changewidth", bind(this, this.onChangeWidth) );
	eventSource.on("changetail", bind(this, this.onChangeTail) );
};

Layer.prototype.isActive = function () {
	return this.active;
};

Layer.prototype.setTail = function (length) {
	this.attr.tail = length;
};

Layer.prototype.setPeriod = function (length) {
	this.attr.period = length;
};

Layer.prototype.setWidth = function (width) {
	this.attr.width = width;
};

Layer.prototype.setColor = function (color) {
	this.attr.color = color;
};

Layer.prototype.newTrace = function (attr) {
	this.traces.push({
		attr: {
			color: this.attr.color,
			tail: this.attr.tail,
			period: this.attr.period,
			width: this.attr.width
		},
		vertices: []
	});
}

Layer.prototype.addVertex = function (v, index) {
	this.traces[index || this.traces.length - 1].vertices.push(v.slice());
}

Layer.prototype.addVertices = function (vs, index) {
	var that = this;
	vs.map(function (v) {
		that.addVertex(v, index);
	});
}

Layer.prototype.getLastVertex = function (index) {
	return this.traces[index || this.traces.length - 1].vertices.last();
}

Layer.prototype.createLineInSpacetime = function(a, b) {
	var line = [],
		i = a[0], 
		l = b[0] - a[0],
		s;

	if(l < 0) throw "createLineInSpacetime: sorry we only walk forward in time...";
	if( (a === undefined && b !== undefined) || 
		(a !== undefined && b === undefined) ) return [a || b];

	for(i=a[0]; i<=b[0]; i++) {
		s = (i - a[0])/l;
		line.push([i, a[1] + s*(b[1] - a[1]), a[	2] + s*(b[2] - a[2])]);
	}

	return line;
}

// 
// Default behavior of a Layer,
// with respect to mouse input and other custom events
// 
Layer.prototype.onMouseDown = function (e) {
	this.newTrace(this.attr);
	this.addVertex([e.time, e.x, e.y]);
	this.active = true;
};

Layer.prototype.onMouseUp = function (e) {
	this.active = false;
	this.addVertices(this.createLineInSpacetime(this.getLastVertex(), [e.time, e.x, e.y]).slice(1));
};

Layer.prototype.onMouseMove = function (e) {
	if(this.isActive()) {
			this.addVertices(this.createLineInSpacetime(this.getLastVertex(), [e.time, e.x, e.y]).slice(1));
	}
};

Layer.prototype.onChangeColor = function (e) {
	this.setColor(e.value);
};


Layer.prototype.onChangeWidth = function (e) {
	this.setWidth(e.value);
};

Layer.prototype.onChangeTail = function (e) {
	this.setTail(e.value);
};

// 
// The layer's draw function 
// (you need to hand it a `stage`, which implements basic drawing functions 
// like `line` and `path` and so on...)
// 
Layer.prototype.draw = function (t, stage) {
	
	var that = this;

	this.traces.map(function (trace) {
		var tail = trace.attr.tail;
		var T = trace.attr.period;
		var w = trace.attr.width;
		var color = trace.attr.color;

		var trace = trace.vertices.slice();
		if (trace.length > 0) {
			var start = mod(trace[0][0],T),
				tailend = mod(t- tail, T);

				var chunks = [];
				var rest = [];

				if(mod(start - tailend,T) < tail ) {
					// inside the tail
					chunks.push( trace.slice(0, tail - mod(start - tailend,T) ) );
					rest = trace.slice( tail - mod(start - tailend,T) + T - tail );
				} else {
					// outside the tail
					rest = trace.slice( T - mod(start - tailend,T) ) ;
				}

				while(rest.length > 0) {
					chunks.push(rest.slice(0,tail) );
					rest = rest.slice(T);
				}
				chunks.map(function (chunk) {
					stage.path(chunk.map(function (vertex) {
							return [vertex[1], vertex[2]];
					}), w, color );
				});
		}
	});
};




