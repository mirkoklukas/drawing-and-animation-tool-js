function toggleFullScreen() {
  if (!document.fullscreenElement &&    // alternative standard method
      !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  }
}

var Stage = function (width, height) {
	var canvas = window.document.getElementById('canvas');
	canvas.width = width;
    canvas.height = height;
	var ctx = canvas.getContext('2d');

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

			for(var i=1; i< vertices.length; i++) {
				ctx.lineTo(vertices[i][0],vertices[i][1]);
			}

			ctx.stroke(); 
		}
	};

	this.clear = function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

};

function makeObservable(obj) {
	var callbacks =  {};

	obj.on =  function (type, f) {
		(callbacks[type] = callbacks[type] || []).push(f);
		return obj;
	};

	obj.fire = function (type, _) {
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

function mutateObservable(obj, f) {

	var mutation = makeObservable({});

	obj.onAny(bind(mutation,f));

	return mutation;
};

var AnimationFrameLoop = function (update) {
	requestAnimationFrame(function tick() {
		update();
		requestAnimationFrame(tick);
	});
};

var Inputter = function () {
	var time;

	var that = this;
	makeObservable(this);

	this.setTime = function (t) {
		time = t;
	}

	window.onmousedown = function(e) {

		that.fire("mousedown", { 
			time: time,
			t: time,
			x: e.clientX,
			y: e.clientY,
			clientX: e.clientX,
			clientY: e.clientY
		});
    };

    window.onmouseup = function(e) {

    	that.fire("mouseup",  { 
			time: time,
			t: time,
			x: e.clientX,
			y: e.clientY,
			clientX: e.clientX,
			clientY: e.clientY
		});
    };

    window.onmousemove =function(e) {

    	that.fire("mousemove",  { 
			time: time,
			t: time,
			x: e.clientX,
			y: e.clientY,
			clientX: e.clientX,
			clientY: e.clientY
		});
    };

    window.onkeydown = function(e) {

    	that.fire("keydown",  { 
			time: time,
			t: time,
			keyCode: e.keyCode
		});
    };

}


var Layer = function (eventSource) {

	this.stage = stage; 
	this.eventSource = eventSource;
	this.active = false;
	this.traces = [];
	this.eventHistory = [];
	this.attr = {
		tail: 30,
		period: 100,
		width: 2,
		color: "#fff"
	};

	// Default behavior
	eventSource.onAny( bind(this,function (type, e) {
		this.eventHistory.push([].slice.call(arguments));
	}));
	eventSource.on("mousedown", bind(this, this.onMouseDown));
	eventSource.on("mouseup", bind(this, this.onMouseUp));
	eventSource.on("mousemove", bind(this, this.onMouseMove));
	eventSource.on("keydown", bind(this, this.onKeyDown));
};

Layer.prototype.isActive = function () {
	return this.active;
}

Layer.prototype.newTrace = function (attr) {
	this.traces.push({
		attr: attr,
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
		line.push([i, a[1] + s*(b[1] - a[1]), a[2] + s*(b[2] - a[2])]);
	}

	return line;
}

// 
// Default behavior of a Layer,
// with respect to mouse and keyboard input
// 
Layer.prototype.onMouseDown = function (e) {
	this.newTrace(this.attr);
	this.addVertex([e.time, e.clientX, e.clientY]);
	this.active = true;
}

Layer.prototype.onMouseUp = function (e) {
	this.active = false;
	this.addVertices(this.createLineInSpacetime(this.getLastVertex(), [e.time, e.clientX, e.clientY]).slice(1));
}

Layer.prototype.onMouseMove = function (e) {
	if(this.isActive()) {
			this.addVertices(this.createLineInSpacetime(this.getLastVertex(), [e.time, e.clientX, e.clientY]).slice(1));
	}
}

Layer.prototype.onKeyDown = function (e) {
	if( e.keyCode === 13 ) {
		console.log(this.traces);
	}
}

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




