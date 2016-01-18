;(function($,$n2){
"use strict";

var MAX_SPRING_K = 120.0;
var SPRING_LEN = 0.0000000000001;

var usePhysics = true;

// Time in ms to fade spring influence in or out
var springFadeTime = 400.0;

// Socket to tuioserver.js that emits TUIO events in JSON
var socket = io('http://localhost:3000');

// Speed factor for drag scrolling
var scrollSpeed = 1.0;

// Time in ms to wait until abandoning a draw and starting pinch/pan
var moveDelay = 250.0;

// Time in ms a cursor must be gone to be considered up
var clickDelay = 1000;

// Distance a cursor must remain within to count as a click or press
var clickDistance = 0.005;

// Time in ms a cursor must be down and still for a long press
var pressDelay = 1250;

// Maximum distance to consider cursors to be on the same hand
var handSpan = 0.25;

// Next hand instance ID counter
var nextHandIndex = 1;

// True if currently drawing a zoom region
var drawZooming = false;

// Key for hand currently acting as the mouse, if any
var mouseHand = undefined;

// Key for cursor currently doing an exclusive long press, if any
var pressCursor = undefined;

// Number of cursors currently down
var downCursors = 0;

// Visual finger and hand feedback
var showDots = false;
var dotSize = 16.0;

// Last scroll hand coordinates
var scrollX = undefined;
var scrollY = undefined;

// Map visual size and position
var xMargin = 455;
var xOffset = -105;
var yMargin = 15;
var yOffset = 10;

// TUIO input calibration
var cursorXScale = 0.672;
var cursorYScale = 0.951;
var cursorXOffset = -0.04;
var cursorYOffset = -0.002;

// Pinch zoom parameters
var lastPinchZoomDistance = undefined;
var pinchZoomThreshold = 0.175;

// Draw overlay canvas
var overlay = undefined;

// Time to wait until a finger draw is considered finished, in ms
var drawDelay = 1000.0;

// Whether or not the pane is currently being rotated
var paneRotating = false;

// Visible rotation of the pane at the start of a rotation drag
var paneRotateStartAngle = 0.0;
var paneRotateAngle = 0.0;

// Angle of initial mouse down point of a rotation drag
var paneRotateMouseStartAngle = 0.0;


function Vector(x, y) {
	this.x = x;
	this.y = y;
}

Vector.prototype.add = function(v) {
	return new Vector(this.x + v.x, this.y + v.y);
}

Vector.prototype.subtract = function(v) {
	return new Vector(this.x - v.x, this.y - v.y);
}

Vector.prototype.scale = function(s) {
	return new Vector(this.x * s, this.y * s);
}

Vector.prototype.magnitude = function(v) {
	return Math.sqrt(this.x * this.x + this.y * this.y);
}

Vector.prototype.distance = function(v) {
	var dx = this.x - v.x;
	var dy = this.y - v.y;

	return Math.sqrt((dx * dx) + (dy * dy));
}

/** Return the absolute distance between two points. */
function distance(x1, y1, x2, y2) {
	return Math.abs(Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)));
}

/** Return the area of a polygon specified by a set of points. */
function area(points) {
	var area = 0;
	var j = points.length - 1;

	for (var i = 0; i < points.length; j = i++) {
		var pi = points[i];
		var pj = points[j];
		area += (pj.pos.x + pi.pos.x) * (pj.pos.y - pi.pos.y)
	}

	return area / 2;
};

/** Return the center of a set of points. */
function centerPoint(points) {
	if (points.length == 1) {
		// Center of a single point is that point
		return points[0].pos;
	} else if (points.length == 2) {
		// Center of a line is the midpoint of that line
		return new Vector((points[0].pos.x + points[1].pos.x) / 2,
						  (points[0].pos.y + points[1].pos.y) / 2);
	}

	var minX = Infinity;
	var minY = Infinity;
	var maxX = 0;
	var maxY = 0;
	for (var i = 0; i < points.length; ++i) {
		minX = Math.min(minX, points[i].pos.x);
		minY = Math.min(minY, points[i].pos.y);
		maxX = Math.max(maxX, points[i].pos.x);
		maxY = Math.max(maxY, points[i].pos.y);
	}

	return new Vector(minX + (maxX - minX) / 2,
	                  minY + (maxY - minY) / 2);
};

function Body(x, y) {
	this.pos = new Vector(x, y);
	this.targetPos = new Vector(x, y);
	this.vel = new Vector(0, 0);
	this.div = undefined;
	this.dirty = false;
	this.alive = true;
	this.birthTime = Date.now();
	this.deathTime = undefined;
	this.lastTime = null;
}

function springForce(p1, p2, length, k) {
	var vec = p2.subtract(p1);
	var mag = vec.magnitude();
	var displacement = length - mag;

	if (mag < length) {
		return new Vector(0, 0);
	} else {
		return vec.scale(k * displacement * 0.5 / mag);
	}
}

/** Set the target coordinate for the body to move towards. */
Body.prototype.moveTo = function(x, y) {
	if (x != this.targetPos.x || y != this.targetPos.y) {
		this.targetPos = new Vector(x, y);
		if (isNaN(this.pos.x) || isNaN(this.pos.y)) {
			this.pos = this.targetPos;
		}
		this.dirty = true;
	}

	if (!usePhysics) {
		this.pos = this.targetPos;
	}

	return this.dirty;
}

/** Update position, moving towards the target if necessary. */
Body.prototype.updatePosition = function(timestamp, energy) {
	if (!usePhysics) {
		this.pos.x = this.targetPos.x;
		this.pos.y = this.targetPos.y;
		return true;
	} else if (!this.lastTime) {
		// Initial call, but we need a time delta, wait for next tick
		this.lastTime = timestamp;
		return true;
	} else if (!this.dirty ||
			   (this.pos.x == this.targetPos.x &&
				this.pos.y == this.targetPos.y)) {
		// Nothing to do
		this.dirty = false;
		this.lastTime = timestamp;
		return false;
	}

	// Time since start in ms
	var elapsed = timestamp - this.lastTime;
	var dur = elapsed / 250;  // Arbitrary scale for in-universe time
	this.lastTime = timestamp;

	// Damp old velocity to avoid oscillation
	this.vel = this.vel.scale(0.1);

	// Calculate amount to move based on spring force
	var force = springForce(this.targetPos, this.pos, SPRING_LEN, MAX_SPRING_K);
	var velocity = this.vel.add(force.scale(dur)).scale(energy);
	var dPos = velocity.scale(dur);

	// Calculate new position
	this.pos = this.pos.add(dPos);
	this.vel = velocity;

	var snap = dPos.magnitude() < 0.0001;
	if (snap) {
		// New position is very close, snap to target
		this.pos = this.targetPos;
		this.vel = new Vector(0, 0);
	}

	// Clamp to valid coordinate space
	this.pos.x = Math.min(Math.max(0.0, this.pos.x), 1.0);
	this.pos.y = Math.min(Math.max(0.0, this.pos.y), 1.0);

	return true;
}

/** Construct a new cursor (finger). */
function Cursor() {
	Body.call(this, Number.NaN, Number.NaN);

	this.down = false;
	this.downX = Number.NaN;
	this.downY = Number.NaN;
	this.index = Number.NaN;
	this.lastSeen = Date.now();
	this.hand = undefined;
	this.show = function() {
		if (!showDots) {
			return;
		} else if (this.div == undefined) {
			this.div = createDot(this.pos.x, this.pos.y, this.index);
		}

		this.div.style.left = ((this.pos.x * window.innerWidth) - 10) + "px";
		this.div.style.top = ((this.pos.y * window.innerHeight) - 10) + "px";
	}
}

Cursor.prototype = Object.create(Body.prototype);
Cursor.prototype.constructor = Cursor;

/** Construct a new tangible (block). */
function Tangible() {
	this.id = new Number();
	this.x = new Number();
	this.y = new Number();
	this.angle = new Number();
	this.div = undefined;
}

/** Construct a new hand (grouping of cursors). */
function Hand(x, y) {
	Body.call(this, x, y);

	this.cursors = [];
	this.index = nextHandIndex++;
}

Hand.prototype = Object.create(Body.prototype);
Hand.prototype.constructor = Hand;

/** Update the target position based on cursor positions. */
Hand.prototype.updateTargetPosition = function() {
	if (this.cursors.length > 0) {
		var center = centerPoint(this.cursors);
		this.moveTo(center.x, center.y);
	}
}

Hand.prototype.updatePosition = function(timestamp, energy) {
	if (this.cursors.length < 1) {
		return;
	}

	if (!usePhysics) {
		var center = centerPoint(this.cursors);
		this.moveTo(center.x, center.y);
		return true;
	} else if (!this.lastTime) {
		// Initial call, but we need a time delta, wait for next tick
		this.lastTime = timestamp;
		return true;
	} else if (!this.dirty) {
		// Nothing to do
		this.dirty = false;
		this.lastTime = timestamp;
		return false;
	}

	// Time since start in ms
	var dur = (timestamp - this.lastTime) / 500;
	this.lastTime = timestamp;

	// Damp old velocity to avoid oscillation
	this.vel = this.vel.scale(0.1);

	var force = new Vector(0, 0);
	for (var c = 0; c < this.cursors.length; ++c) {
		var cursor = this.cursors[c];
		var spring_k = 0.0;
		if (cursor.alive) {
			var age = Date.now() - cursor.birthTime;
			spring_k = Math.min((age / springFadeTime) * MAX_SPRING_K, MAX_SPRING_K);
		} else {
			var rot = Date.now() - cursor.deathTime;
			spring_k = Math.min(((springFadeTime - rot) / springFadeTime) * MAX_SPRING_K, MAX_SPRING_K);
		}

		// Calculate and add force due to this cursor's spring
		var f = springForce(cursor.pos, this.pos, SPRING_LEN, spring_k);
		force = force.add(f);
	}

	var velocity = this.vel.add(force.scale(dur)).scale(energy);
	var dPos = velocity.scale(dur);

	// Calculate new position
	this.pos = this.pos.add(dPos);
	this.vel = velocity;

	return true;
}

Hand.prototype.numAliveCursors = function() {
	var n = 0;
	for (var c = 0; c < this.cursors.length; ++c) {
		if (this.cursors[c].alive) {
			++n;
		}
	}
	return n;
}

Hand.prototype.removeCursor = function(cursor) {
	// Remove cursor from its associated hand's list
	for (var f = 0; f < this.cursors.length; ++f) {
		if (this.cursors[f] == cursor) {
			this.cursors.splice(f, 1);
			break;
		}
	}

	if (this.cursors.length == 0) {
		// Last finger removed from hand, delete hand
		onHandUp(this.index);
	} else {
		// Update position for hand feedback
		this.updateTargetPosition();
		this.show();
	}
}

/** Display a circle representing this hand for feedback. */
Hand.prototype.show = function() {
	if (!showDots) {
		return;
	} else if (this.div == undefined) {
		this.div = createDot(this.pos.x, this.pos.y, "H" + this.index);
	}

	this.div.style.left = ((this.pos.x * window.innerWidth) - 10) + "px";
	this.div.style.top = ((this.pos.y * window.innerHeight) - 10) + "px";
	this.div.style.borderColor = "red";
}

/** Return the maximum distance a hand currently spans. */
Hand.prototype.span = function() {
	var maxDistance = 0;
	for (var i = 0; i < this.cursors.length; ++i) {
		for (var j = 0; j < this.cursors.length; ++j) {
			if (i != j) {
				maxDistance = Math.max(
					maxDistance,
					distance(this.cursors[i].pos.x, this.cursors[i].pos.y,
							 this.cursors[j].pos.x, this.cursors[j].pos.y));
			}
		}
	}

	return maxDistance;
}

/** Remove any cursors that can not be a part of this hand.
 *
 * A list of the removed cursors is returned.  This is used to correct
 * situations where the original cursor:hand association proves to be
 * incorrect after some cursor movement.
 */
Hand.prototype.trimCursors = function() {
	var orphans = [];

	while (this.span() > handSpan) {
		// Find the point furthest from the center
		var maxDistance = 0;
		var furthest = undefined;
		for (var i = 0; i < this.cursors.length; ++i) {
			var cursor = this.cursors[i];
			var d = distance(cursor.pos.x, cursor.pos.y, this.pos.x, this.pos.y);
			if (d > maxDistance) {
				maxDistance = d;
				furthest = i;
			}
		}

		// Remove it
		if (furthest != undefined) {
			orphans.push(this.cursors[furthest]);
			this.removeCursor(this.cursors[furthest]);
		}
	}

	return orphans;
}

// Collections of currently alive things
var cursors = new Object();
var tangibles = new Object();
var hands = new Object();

/** Dispatch a mouse event as a result of a cursor change.
 * eventType: mousedown, mousemove, mouseup, or click
 * x, y: 0..1 normalized TUIO cordinates
 */
function dispatchMouseEvent(eventType, x, y) {
	if (isNaN(x) || isNaN(y)) {
		return;
	}

	// Convert table coordinates to browser coordinates
	var winX = x * window.innerWidth;
	var winY = y * window.innerHeight;

	dispatchMouseEventWin(eventType, winX, winY);
}

/** Like dispatchMouseEvent but with window-relative coordinates. */
function dispatchMouseEventWin(eventType, winX, winY)
{
	// Get the topmost DOM element at this position
	var el = document.elementFromPoint(winX, winY);
	if (el == null) {
		return;
	}

	// console.log(eventType + " at " + winX + "," + winY + ": " + el +
	//             " id: " + el.id + " class: " + el.className);

	// Create synthetic mouse event of the given type
	var event = new MouseEvent(eventType, {
		'view': window,
		'bubbles': true,
		'cancelable': true,
		'clientX': winX,
		'clientY': winY,
		'button': 0
	});

	// Dispatch to element
	el.dispatchEvent(event);
}

function removeObject(dict, inst) {
	// Object is long dead and no longer influential, remove
	if (dict == cursors) {
		// Cursor is no longer alive, (cursor up)
		onCursorUp(inst);
	}

	if (dict[inst].div != undefined) {
		// Remove calibration div
		document.body.removeChild(dict[inst].div);
	}

	if (dict[inst].hand != undefined) {
		dict[inst].hand.removeCursor(dict[inst]);
	}

	// Remove cursor from dictionary
	delete dict[inst];
}

/** Update the list of things that are alive.
 * dict: Dictionary of cursors or tangibles.
 * alive: Updated alive array.
 */
function updateAlive(dict, alive) {
	// Remove any dead objects
	for (var inst in dict) {
		if (!dict.hasOwnProperty(inst)) {
			continue; // Ignore prototypes
		}

		if (dict[inst].alive) {
			// Check if this instance is still alive
			var found = false;
			for (var i = alive.length - 1; i >= 0; i--) {
				if (inst == alive[i]) {
					dict[inst].lastSeen = Date.now();
					found = true;
					break;
				}
			}

			if (!found) {
				// No longer alive, flag as dead and schedule removal
				dict[inst].alive = false;
				dict[inst].deathTime = Date.now();
				window.setTimeout(removeObject, springFadeTime, dict, inst);
			}
		}
	}

	// Add newly alive objects
	for (var i = alive.length - 1; i >= 0; i--) {
		if (!dict.hasOwnProperty(alive[i])) {
			var a = alive[i];
			if (dict == cursors) {
				/* This is a mousedown, but we do not have a position here.
				   Instead mousedown is dispatched on the initial position
				   update after a cursor becomes alive. */
				dict[a] = new Cursor();
				dict[a].index = a;
			} else if (dict == tangibles) {
				dict[a] = new Tangible();
			}
		}
	}
}

/** Update the visible calibration point for a cursor. */
function createDot(x, y, content) {
	var div = document.createElement("div");
	div.style.position = "absolute";
	div.style.width = dotSize + "px";
	div.style.height = dotSize + "px";
	div.style.background = "gray";
	div.style.borderRadius = "50%";
	div.style.border = "2px solid white";
	div.style.color = "white";
	div.style.textAlign = "center";
	div.style.verticalAlign = "middle";
	div.style.zIndex = "10";
	div.style.pointerEvents = "none";
	div.style.left = ((x * window.innerWidth) - (dotSize / 2)) + "px";
	div.style.top = ((y * window.innerHeight) - (dotSize / 2)) + "px";
	div.innerHTML = content;
	document.body.appendChild(div);

	return div;
}

/** Find the closest non-full hand to the given point. */
function bestHand(x, y) {
	var bestDistance = Infinity;
	var hand = null;

	for (var h in hands) {
		if (hands.hasOwnProperty(h)) {
			var center = centerPoint(hands[h].cursors);
			var d = distance(x, y, center.x, center.y);
			if (d <= handSpan &&
				hands[h].numAliveCursors() < 5 &&
				d <= bestDistance) {
				hand = hands[h];
				bestDistance = d;
			}
		}
	}

	return hand;
}

/** Return true if the current cursor/hand association seems reasonable. */
function handsAreSane(x, y) {
	// Check that individual hands are not too large
	for (var h in hands) {
		if (handSpan(hands[h]) > handSpan) {
			return false;
		}
	}

	// Check that distinct hands are not too close together
	var minDistance = Infinity;
	for (var i = 0; i < hand.cursors.length; ++i) {
		for (var j = 0; j < hand.cursors.length; ++j) {
			if (i != j) {
				maxDistance = Math.max(
					maxDistance,
					distance(hand.cursors[i].pos.x, hand.cursors[i].pos.y,
							 hand.cursors[j].pos.x, hand.cursors[j].pos.y));
			}
		}
	}

	return maxDistance;
}

/** Called on the initial position update after a cursor is down. */
function onCursorDown(inst) {
	var cursor = cursors[inst];
	if (downCursors == 0 && pressCursor == undefined) {
		// First cursor down, start potential long press
		pressCursor = inst;
		overlay.show();
		drawZooming = true;
		dispatchMouseEvent('mousedown', cursor.pos.x, cursor.pos.y);
	} else if (downCursors > 0) {
		// Multiple cursors down, terminate pending long press
		pressCursor = undefined;
	}

	++downCursors;
}

/** Called when a down cursor is moved. */
function onCursorMove(inst) {
	var cursor = cursors[inst];

	if (pressCursor == undefined && drawZooming) {
		// Had a press cursor, but this showed up before it went away,
		// so take over drawing duties
		overlay.show();
		drawZooming = true;
		dispatchMouseEvent('mousedown', cursor.pos.x, cursor.pos.y);
		pressCursor = inst;
	}

	if (inst == pressCursor) {
		if (drawZooming) {
			dispatchMouseEvent('mousemove', cursor.pos.x, cursor.pos.y);
		}

		var d = distance(cursor.pos.x, cursor.pos.y, cursor.downX, cursor.downY);
		var elapsed = Date.now() - cursor.birthTime;
		if (d < clickDistance && elapsed > pressDelay) {
			console.log("Long press!");
			pressCursor = undefined;
		}
	} else if (drawZooming && downCursors > 1 && Date.now() - cursor.birthTime > moveDelay) {
		// Multiple cursors have been down for a while, abort draw zoom
		overlay.abortStroke();
		drawZooming = false;
	}
}

/** Called when a cursor is released. */
function onCursorUp(inst) {
	var cursor = cursors[inst];
	if (inst == pressCursor) {
		if (drawZooming) {
			dispatchMouseEvent('mouseup', cursor.pos.x, cursor.pos.y);
		}

		var d = distance(cursor.pos.x, cursor.pos.y, cursor.downX, cursor.downY);
		var elapsed = Date.now() - cursor.birthTime;
		if (d < clickDistance && elapsed < clickDelay) {
			console.log("Click!");
			dispatchMouseEvent('mousedown', cursor.pos.x, cursor.pos.y);
			dispatchMouseEvent('mouseup', cursor.pos.x, cursor.pos.y);
			dispatchMouseEvent('click', cursor.pos.x, cursor.pos.y);
		}
		pressCursor = undefined;
	}

	--downCursors;
}

/** Called on the initial position update after a hand is down. */
function onHandDown(inst) {
	var hand = hands[inst];

	if (mouseHand == undefined) {
		/* No hand is down yet, start a mouse motion for map dragging. */
		// dispatchMouseEvent('mousedown', hand.pos.x, hand.pos.y);
		mouseHand = inst;
	} else {
		if (drawZooming) {
			// Multiple hands down, terminate draw zoom immediately
			pressCursor = undefined;
			overlay.abortStroke();
			drawZooming = false;
		}

		/* A hand was acting as the mouse cursor for map dragging, but now we
		   have several hands.  Stop drag since this no longer makes sense. */
		var oldMouseHand = hands[mouseHand];
		// dispatchMouseEvent('mouseup', oldMouseHand.pos.x, oldMouseHand.pos.y);
		mouseHand = undefined;
		scrollX = undefined;
		scrollY = undefined;
	}
}

/** Called when a down hand is moved. */
function onHandMove(inst) {
	var hand = hands[inst];

	if (drawZooming) {
		return;
	} else if (mouseHand == undefined) {
		/* Mouse hand is no longer around, if this is the only remaining hand,
		   take over scrolling. */
		if (Object.keys(hands).length == 1) {
			mouseHand = inst;
		}
	}

	if (inst == mouseHand && hand.cursors.length > 1) {
		// Hand is acting as mouse cursor, dispatch mouse move
		// dispatchMouseEvent('mousemove', hand.pos.x, hand.pos.y);

		if (scrollX == undefined && scrollY == undefined) {
			/* Initial scroll, jump hand position immediately to center.  This
			   avoids a jumpy scroll because the hand is still moving towards
			   the center points of the fingers, but we don't need this
			   smoothing until after scrolling starts. */
			hand.moveTo(centerPoint(hand.cursors));
			hand.pos = hand.targetPos;
		} else {
			// Scroll OpenLayers manually
			var dx = (scrollX - hand.pos.x);
			var dy = (scrollY - hand.pos.y);
			moduleDisplay.mapControl.map.pan(dx * window.innerWidth * scrollSpeed,
											 dy * window.innerHeight * scrollSpeed,
											 { animate: false, dragging: true });
		}
		scrollX = hand.pos.x;
		scrollY = hand.pos.y;
	} else {
		// Get the hands involved in the zoom gesture
		var zoomHands = [];
		for (var inst in hands) {
 			if (hands.hasOwnProperty(inst) && hands[inst].alive) {
				zoomHands.push(hands[inst]);
			}
		}

		if (zoomHands.length < 2) {
			return;  // Not enough alive hands for pinch zooming
		}

		// Find the greatest distance between any two hands
		var d = 0.0;
		for (var i = 0; i < zoomHands.length - 1; ++i) {
			d = Math.max(
				d,
				distance(zoomHands[i].pos.x, zoomHands[i].pos.y,
						 zoomHands[i + 1].pos.x, zoomHands[i + 1].pos.y));
		}

 		if (lastPinchZoomDistance != undefined) {
			var delta = lastPinchZoomDistance - d;
			if (delta > pinchZoomThreshold) {
				moduleDisplay.mapControl.map.zoomOut();
				lastPinchZoomDistance = d;
			} else if (delta < -pinchZoomThreshold) {
				moduleDisplay.mapControl.map.zoomIn();
				lastPinchZoomDistance = d;
			}
		} else {
			lastPinchZoomDistance = d;
		}
	}
}

/** Called when a hand is released. */
function onHandUp(inst) {
	var hand = hands[inst];

	if (hand.div != undefined) {
		// Remove calibration div
		document.body.removeChild(hand.div);
	}

	if (inst == mouseHand) {
		// Hand is acting as mouse cursor, dispatch mouse up
		// dispatchMouseEvent('mouseup', hand.pos.x, hand.pos.y);
		mouseHand = undefined;
		scrollX = undefined;
		scrollY = undefined;
	}

	lastPinchZoomDistance = undefined;

	delete hands[inst];
}

function onPathDraw(bounds, points) {
	drawZooming = false;
	if (points.length < 2) {
		return;  // Not enough points to do anything sensible
	}

	// Find bounding rectangle (in pixels)
	var left = Infinity;
	var bottom = 0;
	var right = 0;
	var top = Infinity;
	for (var i = 0; i < points.length; ++i) {
		left = Math.min(left, points[i][0]);
		bottom = Math.max(bottom, points[i][1]);
		right = Math.max(right, points[i][0]);
		top = Math.min(top, points[i][1]);
	}

	// Ensure bounding rectangle has a reasonable size
	var width = (right - left);
	var height = (bottom - top);
	var area = width * height;
	if (width < 16 || height < 16 || area < 16) {
		// Gesture did not move very far, dispatch click
		var midX = left + (right - left) / 2.0;
		var midY = top + (bottom - top) / 2.0;

		// Convert from canvas-relative to client-relative for dispatch
		midX += bounds.left;
		midY += bounds.top;

		// Dispatch click
		dispatchMouseEventWin('mousedown', midX, midY);
		dispatchMouseEventWin('mouseup', midX, midY);
		dispatchMouseEventWin('click', midX, midY);
		return;
	}

	// Convert to lon/lat
	var tl = moduleDisplay.mapControl.map.getLonLatFromPixel(
		new OpenLayers.Pixel(left, top));
	var br = moduleDisplay.mapControl.map.getLonLatFromPixel(
		new OpenLayers.Pixel(right, bottom));

	// Zoom/center map to/on bounding rectangle
	moduleDisplay.mapControl.map.zoomToExtent([tl.lon, br.lat, br.lon, tl.lat]);
}

/** Associate a cursor with a hand, creating a new hand if necessary. */
function addCursorToHand(cursor)
{
	// Associate cursor with a hand
	var hand = bestHand(cursor.pos.x, cursor.pos.y);
	if (hand) {
		// Add to existing hand
		hand.cursors.push(cursor);
		hand.dirty = true;
	} else {
		// No existing hand is appropriate, create a new one
		hand = new Hand(cursor.pos.x, cursor.pos.y);
		hand.cursors = [cursor];
		hands[hand.index] = hand;
		onHandDown(hand.index);
	}

	cursor.hand = hand;

	return hand;
}

/** Update cursor coordinates according to a position update. */
function updateCursors(set) {
	for (var inst in set) {
		if (!set.hasOwnProperty(inst)) {
			continue; // Ignore prototypes
		} else if (set[inst] == undefined || cursors[inst] == undefined) {
			continue; // Unknown cursor ID
		}

		var newX = (set[inst][0] - 0.5) * cursorXScale + 0.5 + cursorXOffset;
		var newY = (set[inst][1] - 0.5) * cursorYScale + 0.5 + cursorYOffset;
		if (isNaN(newX) || isNaN(newY)) {
			continue;
		}

		// Update stored cursor position
		cursors[inst].moveTo(newX, newY);
		dirty = true;

		if (!cursors[inst].down) {
			// Initial cursor position update (cursor down)
			cursors[inst].down = true;
			cursors[inst].birthTime = Date.now();
			cursors[inst].downX = newX;
			cursors[inst].downY = newY;

			addCursorToHand(cursors[inst]);
			onCursorDown(inst);

			energy = Math.min(1.0, energy + 1.0);
		} else {
			// Position update for down cursor (cursor move)
			onCursorMove(inst);

			// Increase energy for spring layout calculation
			var increase = Math.abs(
				distance(cursors[inst].pos.x, cursors[inst].pos.y,
						 newX, newY));
			energy = Math.min(1.0, energy + increase * 1000);
		}

		// Update cursor visual feedback
		if (!usePhysics) {
			cursors[inst].show();
		}

		if (cursors[inst].hand) {
			// Flag hand position as dirty for recalculation
			cursors[inst].hand.dirty = true;
		}
	}

	if (!usePhysics) {
		// Update the position of any hands that have changed
		for (var inst in hands) {
			var hand = hands[inst];
			hand.updateTargetPosition();

			// Check if any cursors have moved outside a reasonable hand span
			var orphans = hand.trimCursors();
			if (orphans.length > 0) {
				for (var i = 0; i < orphans.length; ++i) {
					addCursorToHand(orphans[i]);
				}
				cursorsMoved = true;
			}
		}

		// Show hand visual feedback
		for (var inst in hands) {
			var hand = hands[inst];
			// Re-calculate hand position based on cursors
			hand.updateTargetPosition();

			if (hand.dirty) {
				onHandMove(hand.index);
			}

			hand.show();
		}
	}
}

function updateTangibles(set) {
	for (var inst in set) {
		if (!set.hasOwnProperty(inst)) {
			continue; // Ignore prototypes
		}

		if (set[inst] != undefined && tangibles[inst] != undefined) {
			tangibles[inst]['id'] = set[inst][0];
			tangibles[inst]['x'] = (set[inst][1] - 0.5) * cursorXScale + 0.5 + cursorXOffset;
			tangibles[inst]['y'] = (set[inst][2] - 0.5) * cursorYScale + 0.5 + cursorYOffset;
			tangibles[inst]['angle'] = set[inst][3];
		}
	}
}

socket.on('cursor update', function(update) {
	updateAlive(cursors, update.alive);
	updateCursors(update.set);
});

socket.on('tangibles update', function(update) {
	updateAlive(tangibles, update.alive);
	updateTangibles(update.set);
});

function getPaneRotateAngle(e) {
	var pane = document.getElementsByClassName("n2_content_text")[0];
	var originX = pane.offsetLeft + (pane.offsetWidth / 2.0);
	var originY = pane.offsetTop + (pane.offsetHeight / 2.0);
	return Math.atan2(e.pageY - originY, e.pageX - originX) * (180 / Math.PI);
}

function onRotateHandleDown(e) {
	var pane = document.getElementsByClassName("n2_content_text")[0];
	e.preventDefault();
	e.stopPropagation();
	paneRotating = true;
	paneRotateMouseStartAngle = getPaneRotateAngle(e);
	document.addEventListener("mousemove", onRotateHandleMove);
	document.addEventListener("mouseup", onRotateHandleUp);
}

function onRotateHandleMove(e) {
	if (paneRotating) {
		var pane = document.getElementsByClassName("n2_content_text")[0];
		var diff = getPaneRotateAngle(e) - paneRotateMouseStartAngle;
		paneRotateAngle = paneRotateStartAngle + diff;
		pane.style.transform ='rotate(' + paneRotateAngle + 'deg)';
	}
}

function onRotateHandleUp(e) {
	if (paneRotating) {
		paneRotateStartAngle = paneRotateAngle;
		paneRotating = false;
		document.removeEventListener("mousemove", onRotateHandleMove);
		document.removeEventListener("mouseup", onRotateHandleUp);
	}
}

function createRotateHandle() {
	var handle = document.createElement('div');
	handle.className = "rotate_handle";
	handle.style.position = "absolute";
	handle.style.width = "40px";
	handle.style.top = "350px";
	handle.style.backgroundColor = "#000";
	handle.style.color = "#EED";
	handle.style.opacity = "0.75";
	handle.style.fontSize = "xx-large";
	handle.style.lineHeight = "100px";
	handle.style.textAlign = "center";
	handle.style.padding = "4px";
	handle.style.cursor = "move";
	handle.innerHTML = "&orarr;";
	handle.onmousedown = onRotateHandleDown;

	return handle;
}

window.onkeydown = function (e) {
	var code = e.keyCode ? e.keyCode : e.which;
	var $content = $('.nunaliit_content');
	var content = $content[0];
	if (code === 27) {
		// Escape pressed, toggle non-map UI visibility
		$('body').toggleClass('nunaliit_tuio');
		var isTuioEnabled = $('body').hasClass('nunaliit_tuio');
		if (isTuioEnabled) {
			content.style.left = (xMargin + xOffset) + "px";
			content.style.right = (xMargin - xOffset) + "px";
		} else {
			$('.nunaliit_content').removeAttr('style');
			
			$('.n2_content_text')
				.removeAttr('style')
				.removeClass('n2tuio_showPane');
		};
	} else if (code == 70) {
		// f pressed, toggle visual feedback
		showDots = !showDots;
	} else if (e.shiftKey) {
		// TUIO calibration
		if (code == 37) {
			if (e.altKey) {
				// Shift+Alt+left, offset TUIO left
				cursorXOffset -= 0.001;
			} else {
				// Shift+left, shrink TUIO horizontally
				cursorXScale -= 0.001;
			}
		} else if (code == 39) {
			if (e.altKey) {
				// Shift+Alt+right, offset TUIO right
				cursorXOffset += 0.001;
			} else {
				// Shift+right, expand TUIO horizontally
				cursorXScale += 0.001;
			}
		} else if (code == 40) {
			if (e.altKey) {
				// Shift+Alt+down, offset TUIO down
				cursorYOffset += 0.001;
			} else {
				// Shift+down, shrink TUIO vertically
				cursorYScale -= 0.001;
			}
		} else if (code == 38) {
			if (e.altKey) {
				// Shift+Alt+up, offset TUIO up
				cursorYOffset -= 0.001;
			} else {
				// Shift+up, grow TUIO vertically
				cursorYScale += 0.001;
			}
		}

		console.log("TUIO scale " + cursorXScale + "," + cursorYScale +
					" offset " + cursorXOffset + "," + cursorYOffset);

	} else if (code == 37) {
		if (e.altKey) {
			// Alt+left, shrink horizontally
			xMargin += 5;
		} else {
			// Left, shift left
			xOffset -= 5;
		}

		content.style.left = (xMargin + xOffset) + "px";
		content.style.right = (xMargin - xOffset) + "px";
		console.log("X margin " + xMargin + " offset " + xOffset);
	} else if (code == 39) {
		if (e.altKey) {
			// Alt+right, grow horizontally
			xMargin -= 5;
		} else {
			// Right, shift right
			xOffset += 5;
		}

		content.style.left = (xMargin + xOffset) + "px";
		content.style.right = (xMargin - xOffset) + "px";
		console.log("X margin " + xMargin + " offset " + xOffset);
	} else if (code == 40) {
		if (e.altKey) {
			// Alt+down, shrink vertically
			yMargin += 5;
		} else {
			// Down, shift up
			yOffset += 5;
		}

		content.style.top = (yMargin + yOffset) + "px";
		content.style.bottom = (yMargin - yOffset) + "px";
		console.log("Y margin " + yMargin + " offset " + yOffset);
	} else if (code == 38) {
		if (e.altKey) {
			// Alt+up, grow vertically
			yMargin -= 5;
		} else {
			// Up, shift down
			yOffset -= 5;
		}

		content.style.top = (yMargin + yOffset) + "px";
		content.style.bottom = (yMargin - yOffset) + "px";
		console.log("Y margin " + yMargin + " offset " + yOffset);
	} else if (code == 80) {
		// P, show/hide pane
		var pane = document.getElementsByClassName("n2_content_text")[0];
		var $pane = $('.n2_content_text');
		$pane.toggleClass('n2tuio_showPane');
		var isPaneVisible = $pane.hasClass('n2tuio_showPane');
		if( isPaneVisible ) {
			// Show pane
			pane.style.transform ='rotate(' + paneRotateAngle + 'deg)';

			// Create left side rotation handle
			var lHandle = createRotateHandle();
			lHandle.id = "left_rotate_handle";
			lHandle.style.left = "-48px";
			lHandle.style.borderTopLeftRadius = "50px";
			lHandle.style.borderBottomLeftRadius = "50px";
			pane.appendChild(lHandle);

			// Create right side rotation handle
			var rHandle = createRotateHandle();
			rHandle.id = "right_rotate_handle";
			rHandle.style.left = "450px";
			rHandle.style.borderTopRightRadius = "50px";
			rHandle.style.borderBottomRightRadius = "50px";
			pane.appendChild(rHandle);
		} else {
			$pane.removeAttr('style');
			$pane.children('.rotate_handle').remove();
		};

	}
};

var start = undefined;
var lastTime = null;
var dirty = false;
var energy = 1.0;

function reschedule(callback) {
	var fps = 30;
	setTimeout(function() {
		requestAnimationFrame(callback);
	}, 1000 / fps);
}

function tick(timestamp) {
	if (!overlay) {
		// Initialize draw overlay (first tick)
		var $map = $('.n2_content_map');
		if( $map.length > 0 ) {
			var map = $map[0];
			overlay = new DrawOverlay(map, map.offsetWidth, map.offsetHeight, onPathDraw);
			drawZooming = true;
		}
	}

	if (!dirty || !lastTime) {
		// Nothing to do now, just schedule next tick
		start = timestamp;
		lastTime = timestamp;
		reschedule(tick);
		return;
	}

	var interval = Math.min(timestamp - lastTime, 15.0);
	for (var t = lastTime + interval; dirty && t <= timestamp; t += interval) {
		subtick(t);
	}

	reschedule(tick);
}

function subtick(timestamp) {
	// Time since last tick in ms
	var dur = timestamp - lastTime;
	lastTime = timestamp;

	// Reduce overall energy to converge on stable positions
	energy = Math.max(0.0, Math.min(energy, energy - (dur / 1000.0)));

	// Update the position of each cursor
	var moving = false;
	for (var inst in cursors) {
		if (!cursors.hasOwnProperty(inst)) {
			continue; // Ignore prototypes
		}

		var cursor = cursors[inst];
		moving = cursor.updatePosition(timestamp, energy) || moving;
		cursor.show();
	}

	// Update the position of any hands that have changed
	var cursorsMoved = false;
	for (var inst in hands) {
		var hand = hands[inst];
		hand.updateTargetPosition();

		// Check if any cursors have moved outside a reasonable hand span
		var orphans = hand.trimCursors();
		if (orphans.length > 0) {
			for (var i = 0; i < orphans.length; ++i) {
				addCursorToHand(orphans[i]);
			}
			cursorsMoved = true;
		}
	}

	// Show hand visual feedback
	for (var inst in hands) {
		var hand = hands[inst];
		if (cursorsMoved) {
			// Cursors have moved hands, re-calculate target position
			hand.updateTargetPosition();
		}

		if (hand.dirty) {
			moving = hand.updatePosition(timestamp, energy) || moving;
			onHandMove(hand.index);
		}

		hand.show();
	}

	if (!moving) {
		dirty = false;
	}
}

function DrawOverlay(parent, width, height, pathCallback) {
	var self = this;

	this.parent = parent;
	this.drawing = false;
	this.startTime = Date.now();
	this.points = [];
	this.pathCallback = pathCallback;

	this.canvas = document.createElement('canvas');
	this.canvas.className = "overlay";
	this.canvas.width = width || 100;
	this.canvas.height = height || 100;
	this.canvas.style.position = "absolute";
	this.canvas.style.left = "0px";
	this.canvas.style.top = "0px";
	this.canvas.style.width = "100%";
	this.canvas.style.height = "100%";
	this.canvas.style.zIndex = "999999999";
	parent.appendChild(this.canvas);

	this.context = this.canvas.getContext('2d');

	this.getMousePosition = function (e) {
		var box = self.canvas.getBoundingClientRect();
		return { x: e.clientX - box.left,
		         y: e.clientY - box.top };
	}

	this.canvas.onmousedown = function (e) {
		var pos = self.getMousePosition(e);
		self.startStroke(pos.x, pos.y);
	};

	this.canvas.onmousemove = function (e) {
		if (self.drawing) {
			var pos = self.getMousePosition(e);
			self.moveTo(pos.x, pos.y);
		}
	};

	this.canvas.onmouseup = function (e) {
		var pos = self.getMousePosition(e);
		self.moveTo(pos.x, pos.y);
		self.drawing = false;
		self.mouseUpTime = Date.now();
		window.setTimeout(function() { self.endStroke(); }, drawDelay);
	};
}

DrawOverlay.prototype.show = function () {
	this.canvas.style.left = "0px";
	this.canvas.style.width = "100%";
}

DrawOverlay.prototype.hide = function () {
	this.canvas.style.left = "100%";
	this.canvas.style.width = "0";
}

DrawOverlay.prototype.startStroke = function (x, y) {
	this.drawing = true;
	this.context.lineCap = 'round';
	this.context.lineWidth = 2;
	this.context.strokeStyle = '#00FF00';
	this.context.beginPath();
	this.context.imageSmoothingEnabled = true;
	this.context.moveTo(x, y);
	this.points.push([x, y]);
}

DrawOverlay.prototype.moveTo = function (x, y) {
	if (!this.drawing) {
		return;
	}

	this.context.lineTo(x, y);
	this.context.stroke();
	this.points.push([x, y]);
}

DrawOverlay.prototype.abortStroke = function () {
	if (this.drawing) {
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.hide();
		this.drawing = false;
		this.points = [];
	}
}

DrawOverlay.prototype.endStroke = function () {
	if (!this.drawing && Date.now() - this.mouseUpTime >= drawDelay / 2.0) {
		// Save bounding box for passing to path callback
		var box = this.canvas.getBoundingClientRect();

		// Move canvas out of the way so path callback can dispatch events to
		// elements underneath it (like the map)
		this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.hide();

		this.pathCallback(box, this.points);
		this.points = [];
	}
}

if (usePhysics) {
	requestAnimationFrame(tick);
}

})(jQuery,nunaliit2);

