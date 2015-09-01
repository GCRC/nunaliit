var SPRING_K = 80.0;
var SPRING_LEN = 0.0000000000001;

// Socket to tuioserver.js that emits TUIO events in JSON
var socket = io('http://localhost:3000');

// Speed factor for drag scrolling
var scrollSpeed = 1.0;

// Toggle for whether non-map page elements are visible (kludge)
var barsVisible = true;

// Time in ms a cursor must be gone to be considered up
var clickDelay = 500;

// Distance a cursor must remain within to count as a click or press
var clickDistance = 0.005;

// Time in ms a cursor must be down and still for a long press
var pressDelay = 1000;

// Maximum distance to consider cursors to be on the same hand
var handSpan = 0.4;

// Next hand instance ID counter
var nextHandIndex = 1;

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
	this.lastTime = null;
}

function springForce(p1, p2, length, k) {
	var vec = p2.subtract(p1);
	var mag = vec.magnitude();
	var displacement = length - mag;

	return vec.scale(k * displacement * 0.5 / mag);
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
	return this.dirty;
}

/** Update position, moving towards the target if necessary. */
Body.prototype.updatePosition = function(timestamp, energy) {
	if (!this.lastTime) {
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
	var dur = (timestamp - this.lastTime) / 500;
	this.lastTime = timestamp;

	// Damp old velocity to avoid oscillation
	this.vel = this.vel.scale(0.1);

	// Calculate amount to move based on spring force
	var force = springForce(this.targetPos, this.pos, SPRING_LEN, SPRING_K);
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

	// Move div to current position
	if (this.div != undefined) {
		this.div.style.left = this.pos.x - (dotSize / 2) + "px";
		this.div.style.top = this.pos.y - (dotSize / 2) + "px";
	}

	return true;
}

/** Construct a new cursor (finger). */
function Cursor() {
	Body.call(this, Number.NaN, Number.NaN);

	this.down = false;
	this.downTime = Date.now();
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
Hand.prototype.updateTargetPosition = function(timestamp, energy) {
	if (this.cursors.length > 0) {
		var center = centerPoint(this.cursors);
		this.moveTo(center.x, center.y);
	}
}

Hand.prototype.updatePosition = function(timestamp, energy) {
	if (this.cursors.length < 1) {
		return;
	}

	var center = centerPoint(this.cursors);
	this.moveTo(center.x, center.y);

	Body.prototype.updatePosition.call(this, timestamp, energy);
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
	orphans = [];

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

	// Get the topmost DOM element at this position
	var el = document.elementFromPoint(winX, winY);
	if (el == null) {
		return;
	}

	//console.log(eventType + " at " + winX + "," + winY + ": " + el + " id: " + el.id);

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

		// Check if this instance is still alive
		var found = false;
		for (var i = alive.length - 1; i >= 0; i--) {
			if (inst == alive[i]) {
				dict[inst].lastSeen = Date.now();
				found = true;
				break;
			}
		}

		// Instance is not alive, so delete from dict
		// if (!found && (Date.now() - dict[inst].lastSeen) > clickDelay) {
		if (!found) {
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
		var d = distance(x, y, hands[h].pos.x, hands[h].pos.y);
		if (d <= handSpan &&
			hands[h].cursors.length < 5 &&
			d <= bestDistance) {
			hand = hands[h];
			bestDistance = d;
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
	if (downCursors == 0 && pressCursor == undefined) {
		// First cursor down, start potential long press
		pressCursor = inst;
	} else if (downCursors > 1) {
		// Multiple cursors down, terminate pending long press
		pressCursor = undefined;
	}

	++downCursors;
}

/** Called when a down cursor is moved. */
function onCursorMove(inst) {
	var cursor = cursors[inst];
	if (inst == pressCursor) {
		var d = distance(cursor.pos.x, cursor.pos.y, cursor.downX, cursor.downY);
		var elapsed = Date.now() - cursor.downTime;
		if (d < clickDistance && elapsed > pressDelay) {
			console.log("Long press!");
			pressCursor = undefined;
		}
	}
}

/** Called when a cursor is released. */
function onCursorUp(inst) {
	var cursor = cursors[inst];
	if (inst == pressCursor) {
		var d = distance(cursor.pos.x, cursor.pos.y, cursor.downX, cursor.downY);
		var elapsed = Date.now() - cursor.downTime;
		if (d < clickDistance && elapsed < clickDelay) {
			console.log("Click!");
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
		dispatchMouseEvent('mousedown', hand.pos.x, hand.pos.y);
		mouseHand = inst;
	} else {
		/* A hand was acting as the mouse cursor for map dragging, but now we
		   have several hands.  Stop drag since this no longer makes sense. */
		var oldMouseHand = hands[mouseHand];
		dispatchMouseEvent('mouseup', oldMouseHand.pos.x, oldMouseHand.pos.y);
		mouseHand = undefined;
	}
}

/** Called when a down hand is moved. */
function onHandMove(inst) {
	var hand = hands[inst];

	if (inst == mouseHand) {
		// Hand is acting as mouse cursor, dispatch mouse move
		// dispatchMouseEvent('mousemove', hand.pos.x, hand.pos.y);

		// Scroll OpenLayers manually
		var mapSize = moduleDisplay.mapControl.map.getSize();
		if (scrollX != undefined && scrollY != undefined) {
			var dx = (scrollX - hand.pos.x);
			var dy = (scrollY - hand.pos.y);
			moduleDisplay.mapControl.map.pan(dx * mapSize.w * scrollSpeed,
											 dy * mapSize.h * scrollSpeed,
											 { animate: false, dragging: true });
		}
		scrollX = hand.pos.x;
		scrollY = hand.pos.y;
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
		dispatchMouseEvent('mouseup', hand.pos.x, hand.pos.y);
		mouseHand = undefined;
		scrollX = undefined;
		scrollY = undefined;
	}

	delete hands[inst];
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

		var newX = set[inst][0];
		var newY = set[inst][1];
		if (isNaN(newX) || isNaN(newY)) {
			continue;
		}

		// Update stored cursor position
		cursors[inst].moveTo(newX, newY);
		dirty = true;

		if (!cursors[inst].down) {
			// Initial cursor position update (cursor down)
			cursors[inst].down = true;
			cursors[inst].downTime = Date.now();
			cursors[inst].downX = newX;
			cursors[inst].downY = newY;

			addCursorToHand(cursors[inst]);
			onCursorDown(inst);

			energy = Math.min(1.0, energy + 0.1);
		} else {
			// Position update for down cursor (cursor move)
			onCursorMove(inst);

			// Increase energy for spring layout calculation
			var increase = Math.abs(
				distance(cursors[inst].pos.x, cursors[inst].pos.y,
						 newX, newY));
			energy = Math.min(1.0, energy + increase);
		}

		// Update cursor visual feedback
		cursors[inst].show();

		if (cursors[inst].hand) {
			// Flag hand position as dirty for recalculation
			cursors[inst].hand.dirty = true;
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
			tangibles[inst]['x'] = set[inst][1];
			tangibles[inst]['y'] = set[inst][2];
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

window.onkeydown = function (e) {
	var code = e.keyCode ? e.keyCode : e.which;
	if (code === 27) {
		// Escape pressed, toggle non-map UI visibility
		var content = document.getElementById("content");
		var head = document.getElementsByClassName("nunaliit_header")[0];
		var map = document.getElementById("nunaliit2_uniqueId_65");
		var zoom = document.getElementsByClassName("olControlZoom")[0];
		var pane = document.getElementsByClassName("n2_content_text")[0];
		var but = document.getElementsByClassName("n2_content_map_interaction")[0];
		var foot = document.getElementsByClassName("nunaliit_footer")[0];
		if (barsVisible) {
			head.style.display = "none";
			map.style.right = "0";
			zoom.style.top = "45%";
			but.style.top = "45%";
			but.style.right = "20px";
			pane.style.display = "none";
			foot.style.display = "none";
			content.style.top = "0";
			content.style.bottom = "0";
		} else {
			head.style.display = "block";
			map.style.right = "450px";
			zoom.style.top = "35px";
			but.style.top = "33px";
			but.style.right = "468px";
			pane.style.display = "block";
			foot.style.display = "block";
			content.style.top = "102px";
			content.style.bottom = "17px";
		}
		barsVisible = !barsVisible;
	} else if (code == 70) {
		// f pressed, toggle visual feedback
		showDots = !showDots;
	}
};

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
	if (!dirty || !lastTime) {
		// Nothing to do now, just schedule next tick
		start = timestamp;
		lastTime = timestamp;
		reschedule(tick);
		return;
	}

	// Time since last tick in ms
	var dur = (timestamp - lastTime) / 500;
	lastTime = timestamp;

	// Reduce overall energy to converge on stable positions
	energy = Math.max(0.0, energy - (dur * 0.5));

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

	reschedule(tick);
}

requestAnimationFrame(tick);
