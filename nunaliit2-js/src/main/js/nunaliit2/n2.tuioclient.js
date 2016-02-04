;(function($,$n2){
	"use strict";

	var DH = 'n2.tuio';

	var MAX_SPRING_K = 160.0;
	var SPRING_LEN = 0.0000000000001;

	var usePhysics = true;

	// Time in ms to fade spring influence in or out
	var springFadeTime = 400.0;

	// Socket to tuioserver.js that emits TUIO events in JSON
	var socket = undefined;

	// Keep track if connection occurred
	var tuioConnected = false;

	// Keeps track if a service has been defined
	var g_tuioService = undefined;

	// Configuration
	var tuioConfiguration = undefined;

	// Number of escape keys pressed in the last while
	var escapeKeyCount = 0;

	// Speed factor for drag scrolling
	var scrollSpeed = 1.0;

	// Time in ms to wait until abandoning a draw and starting pinch/pan
	var moveDelay = 200.0;

	// Time in ms a cursor must be gone to be considered up
	var clickDelay = 1000;

	// Maximum cursor travel distance (in TUIO coordinates) for a click/press
	var clickDistance = 0.1;

	// Distance in pixels below which to consider two drawn points the same
	var pointDistance = 16.0;

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

	// Calibration
	var calibration = null;
	var calibrationDirty = false;

	// Pinch zoom parameters
	var lastPinchZoomDistance = undefined;
	var pinchZoomThreshold = 0.14;

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

	var moduleDisplay = undefined;

	//==================================================================
	function IsTuioConnected() {
		return tuioConnected;
	};

	//==================================================================
	function IsTableModeOn() {
		var isTableModeOn = $('body').hasClass('nunaliit_tuio');
		return isTableModeOn;
	};

	//==================================================================
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

	//==================================================================

	/** Return the absolute distance between two points. */
	function distance(x1, y1, x2, y2) {
		return Math.abs(Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)));
	}

	/** Return the distance travelled along a line string.
	 *
	 * Returned distance is in the same unit used in the x and y fields of the
	 * input points (typicallly pixels).
	 */
	function lineStringDistance(points) {
		if (points.length < 2) {
			return 0.0;
		}

		var d = 0.0;
		for (var i = 0; i < points.length - 1; ++i) {
			var p = points[i];
			var q = points[i + 1];
			d += distance(p.x, p.y, q.x, q.y);
		}
		return d;
	}

	/** Return the area of a polygon specified by a set of points. */
	function area(points) {
		var area = 0;
		var j = points.length - 1;

		for (var i = 0; i < points.length; j = i++) {
			var pi = points[i];
			var pj = points[j];
			area += (pj.x + pi.x) * (pj.y - pi.y)
		}

		return area / 2;
	};

	/** Return the center of a set of points. */
	function centerPoint(points) {
		if (points.length == 1) {
			// Center of a single point is that point
			return points[0];
		} else if (points.length == 2) {
			// Center of a line is the midpoint of that line
			return new Vector((points[0].x + points[1].x) / 2,
			                  (points[0].y + points[1].y) / 2);
		}

		var minX = Infinity;
		var minY = Infinity;
		var maxX = 0;
		var maxY = 0;
		for (var i = 0; i < points.length; ++i) {
			minX = Math.min(minX, points[i].x);
			minY = Math.min(minY, points[i].y);
			maxX = Math.max(maxX, points[i].x);
			maxY = Math.max(maxY, points[i].y);
		}

		return new Vector(minX + (maxX - minX) / 2,
		                  minY + (maxY - minY) / 2);
	};

	/** Return the intersection between the line segments p0->p1 and p2->p3, or null.
	 *
	 * Based on algorithm from "Tricks of the Windows Game Programming Gurus" by Andre LeMothe
	 */
	function lineIntersection(p0, p1, p2, p3) {
		var s1 = p1.subtract(p0);
		var s2 = p3.subtract(p2);

		var s = (-s1.y * (p0.x - p2.x) + s1.x * (p0.y - p2.y)) / (-s2.x * s1.y + s1.x * s2.y);
		var t = ( s2.x * (p0.y - p2.y) - s2.y * (p0.x - p2.x)) / (-s2.x * s1.y + s1.x * s2.y);

		if (s >= 0.0 && s <= 1.0 && t >= 0.0 && t <= 1.0) {
			return new Vector(p0.x + (t * s1.x), p0.y + (t * s1.y));
		}

		return null;
	}

	/** Return a simplified polygon based on the given line string, or null.
	 *
	 * The returned polygon is the given points up until the point where two
	 * segments intersect.  The intersecting segments are not included in the
	 * returned list of points, so the returned list does not intersect itself.
	 */
	function simplifyPolygon(points) {
		if (points.length < 4) {
			return null;
		}

		for (var i = 0; i < points.length - 3; ++i) {
			var p0 = points[i];
			var p1 = points[i + 1];

			for (var j = i + 2; j < points.length - 1; ++j) {
				var p2 = points[j];
				var p3 = points[j + 1];
				var intersection = lineIntersection(p0, p1, p2, p3);
				if (intersection != null) {
					return points.slice(i + 1, j);
				}
			}
		}

		return null;
	}

	/** Return the force exerted by a spring between vectors p1 and p2. */
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

	//==================================================================
	/** A 2-D point with velocity, used for fingers (cursors) and hands. */
	function Body(x, y) {
		Vector.call(this, x, y);

		this.targetPos = new Vector(x, y);
		this.vel = new Vector(0, 0);
		this.div = undefined;
		this.dirty = false;
		this.alive = true;
		this.birthTime = Date.now();
		this.deathTime = undefined;
		this.distanceMoved = 0.0;
		this.lastTime = null;
	}

	Body.prototype = Object.create(Vector.prototype);

	/** Set the target coordinate for the body to move towards. */
	Body.prototype.moveTo = function(x, y) {
		if (!isNaN(this.x) && !isNaN(this.y)) {
			this.distanceMoved += distance(this.x, this.y, x, y);
		}

		if (x != this.targetPos.x || y != this.targetPos.y) {
			this.targetPos = new Vector(x, y);
			if (isNaN(this.x) || isNaN(this.y)) {
				this.x = this.targetPos.x;
				this.y = this.targetPos.y;
			}
			this.dirty = true;
		}

		if (!usePhysics) {
			this.x = this.targetPos.x;
			this.y = this.targetPos.y;
		}

		return this.dirty;
	}

	/** Update position, moving towards the target if necessary. */
	Body.prototype.updatePosition = function(timestamp, energy) {
		if (!usePhysics) {
			this.x = this.targetPos.x;
			this.y = this.targetPos.y;
			return true;
		} else if (!this.lastTime) {
			// Initial call, but we need a time delta, wait for next tick
			this.lastTime = timestamp;
			return true;
		} else if (!this.dirty ||
				   (this.x == this.targetPos.x &&
					this.y == this.targetPos.y)) {
			// Nothing to do
			this.dirty = false;
			this.lastTime = timestamp;
			return false;
		}

		// Time since start in ms
		var elapsed = timestamp - this.lastTime;
		var dur = elapsed / 200;  // Arbitrary scale for in-universe time
		this.lastTime = timestamp;

		// Damp old velocity to avoid oscillation
		this.vel = this.vel.scale(0.1);

		// Calculate amount to move based on spring force
		var force = springForce(this.targetPos, this, SPRING_LEN, MAX_SPRING_K);
		var velocity = this.vel.add(force.scale(dur)).scale(energy);
		var dPos = velocity.scale(dur);

		// Calculate new position
		var newPos = this.add(dPos);
		this.x = newPos.x;
		this.y = newPos.y;
		this.vel = velocity;

		var snap = dPos.magnitude() < 0.0001;
		if (snap) {
			// New position is very close, snap to target
			this.x = this.targetPos.x;
			this.y = this.targetPos.y;
			this.vel = new Vector(0, 0);
		}

		// Clamp to valid coordinate space
		this.x = Math.min(Math.max(0.0, this.x), 1.0);
		this.y = Math.min(Math.max(0.0, this.y), 1.0);

		return true;
	}

	//==================================================================
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
				this.div = createDot(this.x, this.y, this.index);
			}

			this.div.style.left = ((this.x * window.innerWidth) - 10) + "px";
			this.div.style.top = ((this.y * window.innerHeight) - 10) + "px";
		}
	}

	Cursor.prototype = Object.create(Body.prototype);
	Cursor.prototype.constructor = Cursor;

	//==================================================================
	/** Construct a new tangible (block). */
	function Tangible() {
		this.id = new Number();
		this.x = new Number();
		this.y = new Number();
		this.angle = new Number();
		this.div = undefined;
	}

	//==================================================================
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
			var f = springForce(cursor, this, SPRING_LEN, spring_k);
			force = force.add(f);
		}

		var velocity = this.vel.add(force.scale(dur)).scale(energy);
		var dPos = velocity.scale(dur);

		// Calculate new position
		var newPos = this.add(dPos);
		this.x = newPos.x;
		this.y = newPos.y;
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
			this.div = createDot(this.x, this.y, "H" + this.index);
		}

		this.div.style.left = ((this.x * window.innerWidth) - 10) + "px";
		this.div.style.top = ((this.y * window.innerHeight) - 10) + "px";
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
						distance(this.cursors[i].x, this.cursors[i].y,
						         this.cursors[j].x, this.cursors[j].y));
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
				var d = distance(cursor.x, cursor.y, this.x, this.y);
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

	//==================================================================
	// Collections of currently alive things
	var cursors = new Object();
	var tangibles = new Object();
	var hands = new Object();

	/** Get the topmost DOM element at a TUIO position. */
	function getElementAtTablePoint(x, y) {
		if (isNaN(x) || isNaN(y)) {
			return null;
		}

		// Convert table coordinates to browser coordinates
		var winX = x * window.innerWidth;
		var winY = y * window.innerHeight;

		// Return the topmost DOM element at this position
		return document.elementFromPoint(winX, winY);
	}

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

		dispatchMouseEventTo(eventType, el, winX, winY);
	}

	/** Dispatch a mouse event to a specific DOM element. */
	function dispatchMouseEventTo(eventType, el, winX, winY)
	{
		// Create synthetic mouse event of the given type
		var event = new MouseEvent(eventType, {
			'view': window,
			'bubbles': true,
			'cancelable': true,
			'clientX': winX,
			'clientY': winY,
			'button': 0
		});

		// console.log("Dispatch " + eventType + " @ " + winX + "," + winY +
		// 			" => " + el + " #" + el.id + " ." + el.className);

		// Dispatch to element
		el.dispatchEvent(event);
	}

	function removeObject(dict, inst) {
		// Object is long dead and no longer influential, remove

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
		var aliveMap = {};
		for(var i=0,e=alive.length; i<e; ++i) {
			var id = alive[i];
			aliveMap[id] = true;
		};

		// Remove any dead objects
		for (var inst in dict) {
			if (!dict.hasOwnProperty(inst)) {
				continue; // Ignore prototypes
			}

			if (dict[inst].alive) {
				// Check if this instance is still alive
				if( !aliveMap[inst] ) {
					// No longer alive, flag as dead and schedule removal
					dict[inst].alive = false;
					dict[inst].deathTime = Date.now();

					// Issue cursor up immediately for responsive clicking
					if (dict == cursors) {
						onCursorUp(inst);
					}

					// Schedule full removal for when spring no longer has influence
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
		div.className = "n2tuio_feedback_circle n2tuio_remove";
		div.style.width = dotSize + "px";
		div.style.height = dotSize + "px";
		div.style.left = ((x * window.innerWidth) - (dotSize / 2)) + "px";
		div.style.top = ((y * window.innerHeight) - (dotSize / 2)) + "px";
		div.innerHTML = content;
		document.body.appendChild(div);

		return div;
	}

	function createRing() {
		var $div = $('<div>')
			.addClass('n2tuio_edit_ring n2tuio_remove')
			.appendTo( $('#content') );
	}

	function displayError() {
		$('.n2tuio_edit_ring').css({
			'background-color': 'red'
		});
		window.setTimeout(function() {
			$('.n2tuio_edit_ring').css({
				'background-color': 'transparent'
			});
		}, 1000);
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
						distance(hand.cursors[i].x, hand.cursors[i].y,
						         hand.cursors[j].x, hand.cursors[j].y));
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
			if( overlay ){
				overlay.show();
			};
			drawZooming = true;
			dispatchMouseEvent('mousedown', cursor.x, cursor.y);
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
			if (overlay) {
				overlay.show();
			}
			drawZooming = true;
			dispatchMouseEvent('mousedown', cursor.x, cursor.y);
			pressCursor = inst;
		}

		if (inst == pressCursor) {
			if (drawZooming) {
				dispatchMouseEvent('mousemove', cursor.x, cursor.y);
			}

			var elapsed = Date.now() - cursor.birthTime;
			if (cursor.distanceMoved <= clickDistance && elapsed > pressDelay) {
				console.log("Long press!");
				// Hide overlay so it does not intercept mouse events
				if (overlay) {
					overlay.abortStroke();
				}

				// Dispatch click to select map element, if applicable
				dispatchMouseEvent('click', cursor.x, cursor.y);

				// Toggle information pane
				togglePane();

				pressCursor = undefined;
				drawZooming = false;
			}
		} else if (drawZooming && downCursors > 1 && Date.now() - cursor.birthTime > moveDelay) {
			// Multiple cursors have been down for a while, abort draw zoom
			if (overlay) {
				overlay.abortStroke();
			}
			drawZooming = false;
		}
	}

	/** Called when a cursor is released. */
	function onCursorUp(inst) {
		var cursor = cursors[inst];
		if (inst == pressCursor) {
			// Get the element (underneath the overlay) at the cursor position
			var wasSensitive = overlay.setSensitive(false);
			var el = getElementAtTablePoint(cursor.x, cursor.y);
			overlay.setSensitive(wasSensitive);

			// Check if this down/up sequence was fast enough to be a click
			var elapsed = Date.now() - cursor.birthTime;
			var isClick = cursor.distanceMoved <= clickDistance && elapsed < clickDelay;
			if (el && isClick &&
				((el.nodeName.toLowerCase() == "input" || el.nodeName.toLowerCase() == "textarea") &&
				 el.getAttribute("type") != "button")) {
				$(el).focus();  // Focus non-button input element before mouseup

			}

			dispatchMouseEvent('mouseup', cursor.x, cursor.y);

			if (el && isClick) {
				var winX = cursor.x * window.innerWidth;
				var winY = cursor.y * window.innerHeight;
				if (el.id.startsWith("OpenLayers")) {
					hidePane();
				}

				/* Re-sending the mousedown and mouseup events here immediately
				   before the click seems to be necessary to make OpenLayers
				   buttons work. */
				dispatchMouseEventTo('mousedown', el, winX, winY);
				dispatchMouseEventTo('mouseup', el, winX, winY);
				dispatchMouseEventTo('click', el, winX, winY);
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
			// dispatchMouseEvent('mousedown', hand.x, hand.y);
			mouseHand = inst;
		} else {
			if (drawZooming) {
				// Multiple hands down, terminate draw zoom immediately
				pressCursor = undefined;
				if (overlay) {
					overlay.abortStroke();
				}
				drawZooming = false;
			}

			/* A hand was acting as the mouse cursor for map dragging, but now we
			   have several hands.  Stop drag since this no longer makes sense. */
			var oldMouseHand = hands[mouseHand];
			// dispatchMouseEvent('mouseup', oldMouseHand.x, oldMouseHand.y);
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
			// dispatchMouseEvent('mousemove', hand.x, hand.y);

			if (scrollX == undefined && scrollY == undefined) {
				/* Initial scroll, jump hand position immediately to center.  This
				   avoids a jumpy scroll because the hand is still moving towards
				   the center points of the fingers, but we don't need this
				   smoothing until after scrolling starts. */
				hand.moveTo(centerPoint(hand.cursors));
				hand.x = hand.targetPos.x;
				hand.y = hand.targetPos.y;
			} else if (typeof(moduleDisplay) !== 'undefined') {
				// Scroll OpenLayers manually
				var dx = (scrollX - hand.x);
				var dy = (scrollY - hand.y);
				moduleDisplay.mapControl.map.pan(dx * window.innerWidth * scrollSpeed,
				                                 dy * window.innerHeight * scrollSpeed,
				                                 { animate: false, dragging: true });
			}
			scrollX = hand.x;
			scrollY = hand.y;
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
					distance(zoomHands[i].x, zoomHands[i].y,
					         zoomHands[i + 1].x, zoomHands[i + 1].y));
			}

			if (lastPinchZoomDistance != undefined) {
				var delta = lastPinchZoomDistance - d;
				var currentZoom = moduleDisplay.mapControl.map.getZoom();
				var nZoomLevels = moduleDisplay.mapControl.map.getNumZoomLevels();
				if (delta > pinchZoomThreshold) {
					if (currentZoom > 1) {
						moduleDisplay.mapControl.map.zoomOut();
					} else {
						displayError();
					}
					lastPinchZoomDistance = d;
				} else if (delta < -pinchZoomThreshold) {
					if (currentZoom < nZoomLevels - 1) {
						moduleDisplay.mapControl.map.zoomIn();
					} else {
						displayError();
					}
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
			// dispatchMouseEvent('mouseup', hand.x, hand.y);
			mouseHand = undefined;
			scrollX = undefined;
			scrollY = undefined;
		}

		lastPinchZoomDistance = undefined;

		delete hands[inst];
	}

	function onPathDraw(bounds, points) {
		// In edit mode, draw a new feature
		if( g_tuioService && g_tuioService.isEditing() ){
			var geometryCapture = new GeometryCapture({
				tuioService: g_tuioService
			});
			for(var i=0,e=points.length; i<e; ++i){
				geometryCapture.addPoint(points[i][0], points[i][1]);
			};
			geometryCapture.endDrawing();

		} else {
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
				// Disable because TUIO onCursorUp etc handlers deal with clicks

				/*
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
				*/
				return;
			}

			// Convert to lon/lat
			var tl = moduleDisplay.mapControl.map.getLonLatFromPixel(
				new OpenLayers.Pixel(left, top));
			var br = moduleDisplay.mapControl.map.getLonLatFromPixel(
				new OpenLayers.Pixel(right, bottom));

			// Zoom/center map to/on bounding rectangle
			moduleDisplay.mapControl.map.zoomToExtent([tl.lon, br.lat, br.lon, tl.lat]);
		};
	}

	/** Associate a cursor with a hand, creating a new hand if necessary. */
	function addCursorToHand(cursor)
	{
		// Associate cursor with a hand
		var hand = bestHand(cursor.x, cursor.y);
		if (hand) {
			// Add to existing hand
			hand.cursors.push(cursor);
			hand.dirty = true;
		} else {
			// No existing hand is appropriate, create a new one
			hand = new Hand(cursor.x, cursor.y);
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

			var newX = (set[inst][0] - 0.5) * calibration.cursorXScale + 0.5 + calibration.cursorXOffset;
			var newY = (set[inst][1] - 0.5) * calibration.cursorYScale + 0.5 + calibration.cursorYOffset;
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
					distance(cursors[inst].x, cursors[inst].y,
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
		};

		if( g_tuioService ){
			g_tuioService._updateCursors(cursors, hands);
		};
	}

	function updateTangibles(set) {
		for (var inst in set) {
			if (!set.hasOwnProperty(inst)) {
				continue; // Ignore prototypes
			}

			if (set[inst] != undefined && tangibles[inst] != undefined) {
				tangibles[inst]['id'] = set[inst][0];
				tangibles[inst]['x'] = (set[inst][1] - 0.5) * calibration.cursorXScale + 0.5 + calibration.cursorXOffset;
				tangibles[inst]['y'] = (set[inst][2] - 0.5) * calibration.cursorYScale + 0.5 + calibration.cursorYOffset;
				tangibles[inst]['angle'] = set[inst][3];
				tangibles[inst]['alive'] = true;
			}
		}

		if( g_tuioService ){
			g_tuioService._updateTangibles(tangibles);
		};
	}

	function getPaneRotateAngle(e) {
		var pane = document.getElementsByClassName("n2_content_text")[0];
		var bounds = pane.getBoundingClientRect();
		var originX = bounds.left + (bounds.width / 2.0);
		var originY = bounds.top + (bounds.height / 2.0);
		return Math.atan2(e.pageY - originY, e.pageX - originX) * (180 / Math.PI);
	}

	function onRotateHandleDown(e) {
		var pane = document.getElementsByClassName("n2_content_text")[0];
		e.preventDefault();
		e.stopPropagation();
		paneRotating = true;
		paneRotateMouseStartAngle = getPaneRotateAngle(e);
		document.addEventListener("mousemove", onRotateHandleMove, true);
		document.addEventListener("mouseup", onRotateHandleUp, true);
	}

	function onRotateHandleMove(e) {
		if (paneRotating) {
			var pane = document.getElementsByClassName("n2_content_text")[0];
			var diff = getPaneRotateAngle(e) - paneRotateMouseStartAngle;
			e.preventDefault();
			e.stopPropagation();
			paneRotateAngle = paneRotateStartAngle + diff;
			pane.style.transform = 'rotate(' + paneRotateAngle + 'deg)';
		}
	}

	function onRotateHandleUp(e) {
		if (paneRotating) {
			e.preventDefault();
			e.stopPropagation();
			paneRotateStartAngle = paneRotateAngle;
			paneRotating = false;
			document.removeEventListener("mousemove", onRotateHandleMove);
			document.removeEventListener("mouseup", onRotateHandleUp);
		}
	}

	function createRotateHandle() {
		var handle = document.createElement('div');
		handle.className = "n2tuio_rotate_handle n2tuio_remove";
		handle.innerHTML = "&orarr;";
		handle.onmousedown = onRotateHandleDown;

		return handle;
	}

	function showPane() {
		var $pane = $('.n2_content_text');
		var pane = document.getElementsByClassName("n2_content_text")[0];

		$pane.addClass('n2tuio_showPane');

		pane.style.transform = 'rotate(' + paneRotateAngle + 'deg)';

		// Create left side rotation handle
		var lHandle = createRotateHandle();
		lHandle.id = "left_rotate_handle";
		lHandle.style.left = "-88px";
		lHandle.style.borderTopLeftRadius = "130px";
		lHandle.style.borderBottomLeftRadius = "130px";
		pane.appendChild(lHandle);

		// Create right side rotation handle
		var rHandle = createRotateHandle();
		rHandle.id = "right_rotate_handle";
		rHandle.style.left = "450px";
		rHandle.style.borderTopRightRadius = "130px";
		rHandle.style.borderBottomRightRadius = "130px";
		pane.appendChild(rHandle);
	}

	function hidePane() {
		var $pane = $('.n2_content_text');

		$pane.removeClass('n2tuio_showPane');
		$pane.removeAttr('style');
		$pane.children('.n2tuio_rotate_handle').remove();
	}

	function togglePane() {
		var $pane = $('.n2_content_text');
		var isPaneVisible = $pane.hasClass('n2tuio_showPane');
		if (!isPaneVisible) {
			showPane();
		} else {
			hidePane();
		}
	}

	var lastTime = null;
	var dirty = false;
	var energy = 1.0;

	function reschedule(callback) {
		var fps = 30;
		window.setTimeout(function() {
			window.requestAnimationFrame(callback);
		}, 1000 / fps);
	}

	function tick(timestamp) {
		if (!dirty || !lastTime) {
			// Nothing to do now, just schedule next tick
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

	//==================================================================
	function DrawOverlay(parent, width, height, pathCallback) {
		var self = this;

		this.parent = parent;
		this.drawing = false;
		this.isMouseDown = false;
		this.startTime = Date.now();
		this.points = [];
		this.pathCallback = pathCallback;

		this.canvas = document.createElement('canvas');
		this.canvas.className = "n2tuio_overlay n2tuio_remove";
		if( width ){
			this.canvas.width = width;
		};
		if( height ){
			this.canvas.height = height;
		};
		parent.appendChild(this.canvas);

		this.context = this.canvas.getContext('2d');

		this.getMousePosition = function (e) {
			var box = self.canvas.getBoundingClientRect();
			return { x: e.clientX - box.left,
			         y: e.clientY - box.top };
		}

		this.canvas.onmousedown = function (e) {
			var pos = self.getMousePosition(e);
			self.isMouseDown = true;
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
			self.mouseUpTime = Date.now();
			self.isMouseDown = false;
			window.setTimeout(function() { self.endStroke(); }, drawDelay);
		};
	}

	DrawOverlay.prototype.setSensitive = function (sensitive) {
		var wasSensitive = (this.canvas.style.pointerEvents != "none");
		if (sensitive) {
			this.canvas.style.pointerEvents = "auto";
		} else {
			this.canvas.style.pointerEvents = "none";
		}
		return wasSensitive;
	}

	DrawOverlay.prototype.show = function () {
		this.canvas.style.left = "0px";
		this.canvas.style.width = "100%";
		this.setSensitive(true);
	}

	DrawOverlay.prototype.hide = function () {
		this.canvas.style.left = "100%";
		this.canvas.style.width = "0";
		this.setSensitive(false);
	}

	DrawOverlay.prototype.startStroke = function (x, y) {
		this.context.lineCap = 'round';
		this.context.lineWidth = 2;
		if (g_tuioService && g_tuioService.isEditing()) {
			this.context.strokeStyle = '#FF0000';
		} else {
			this.context.strokeStyle = '#00FF00';
		}
		this.context.imageSmoothingEnabled = true;
		if (!this.drawing) {
			this.context.beginPath();
			this.context.moveTo(x, y);
			this.drawing = true;
		} else {
			this.context.lineTo(x, y);
		}

		this.points.push([x, y]);
	}

	DrawOverlay.prototype.moveTo = function (x, y) {
		if (!this.drawing) {
			return;
		} else if (this.points.length > 0 &&
		           this.points[this.points.length - 1].x == x &&
		           this.points[this.points.length - 1].y == y) {
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
		if (!this.isMouseDown && Date.now() - this.mouseUpTime >= drawDelay / 2.0) {
			// Save bounding box for passing to path callback
			var box = this.canvas.getBoundingClientRect();

			// Move canvas out of the way so path callback can dispatch events to
			// elements underneath it (like the map)
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.hide();

			if (this.points.length > 0) {
				this.pathCallback(box, this.points);
				this.points = [];
			}
			this.drawing = false;
		} else {
			/* The mouse went away, but came back, so reschedule an endStroke.
			   This should happen on the next mouseup event anyway, but if
			   events get funny/unreliable, we want to ensure the stroke is
			   ended, otherwise it will stay visible on the canvas and do
			   nothing. */
			var self = this;
			window.setTimeout(function() { self.endStroke(); }, drawDelay);
		}
	}

	//==================================================================
	var TuioConfiguration = $n2.Class({

		initialize: function(opts_){
			var opts = $n2.extend({

			},opts_);
		},

		loadConfiguration: function(){
			var localStorage = $n2.storage.getLocalStorage();

			var tuioConfStr = localStorage.getItem('n2tuio_configuration');

			var tuioConf = undefined;
			if( tuioConfStr ){
				try {
					tuioConf = JSON.parse(tuioConfStr);
				} catch(e) {
					$n2.log('Unable to parse TUIO configuration:'+e);
				};
			};

			if( !tuioConf ){
				tuioConf = {};
			};

			return tuioConf;
		},

		saveConfiguration: function(tuioConf){
			var localStorage = $n2.storage.getLocalStorage();

			var tuioConfStr = JSON.stringify(tuioConf);
			localStorage.setItem('n2tuio_configuration',tuioConfStr);
		},

		deleteConfiguration: function(){
			var localStorage = $n2.storage.getLocalStorage();
			localStorage.removeItem('n2tuio_configuration');
		},

		isEnabled: function(){
			var tuioConf = this.loadConfiguration();
			return tuioConf.enabled;
		},

		setEnabled: function(flag){
			var tuioConf = this.loadConfiguration();
			tuioConf.enabled = flag;
			this.saveConfiguration(tuioConf);
		},

		isTableModeActive: function(){
			var tuioConf = this.loadConfiguration();
			return tuioConf.active;
		},

		setTableModeActive: function(flag){
			var tuioConf = this.loadConfiguration();
			tuioConf.active = flag;
			this.saveConfiguration(tuioConf);
		},

		getCalibration: function(){
			// Default calibration
			var calibration = {
				// Input calibration
				cursorXScale: 0.672
				,cursorYScale: 0.953
				,cursorXOffset: -0.04
				,cursorYOffset: 0.002
				// Map visual size and position
				,xMargin: 450
				,xOffset: -90
				,yMargin: 15
				,yOffset: 10
			};

			var tuioConf = this.loadConfiguration();

			if( tuioConf.calibration ){
				calibration = $n2.extend(calibration, tuioConf.calibration);
			};

			return calibration;
		},

		setCalibration: function(calibration){
			var tuioConf = this.loadConfiguration();
			tuioConf.calibration = calibration;
			this.saveConfiguration(tuioConf);
		}
	});


	//==================================================================
	/**
	 * Switch into table mode
	 */
	function startTableMode() {
		if( !IsTableModeOn() ){
			$('body').addClass('nunaliit_tuio');
			
			var $content = $('.nunaliit_content');

			$content.css({
				left: (calibration.xMargin + calibration.xOffset) + 'px'
				,right: (calibration.xMargin - calibration.xOffset) + 'px'
				,top: (calibration.yMargin + calibration.yOffset) + 'px'
				,bottom: (calibration.yMargin - calibration.yOffset) + 'px'
			});

			// Create draw overlay
			var $map = $('.n2_content_map');
			if ($map.length > 0) {
				var map = $map[0];
				overlay = new DrawOverlay(
					map, map.offsetWidth, map.offsetHeight, onPathDraw);
				drawZooming = true;
			}
			
			// Create reset extent button
			var $resetOuter = $('<div>')
				.addClass('n2tuio_resetExtent_outer n2tuio_remove')
				.appendTo( $('.nunaliit_content') );
			$('<a>')
				.addClass('n2tuio_resetExtent')
				.attr('href','#')
				.text( '#' )
				.appendTo( $resetOuter )
				.click(function(){
					if( g_tuioService ){
						g_tuioService.resetMapToInitialExtent();
					};
					return false;
				});

			// Create green/red edit ring
			createRing();
			
			// Remember that table mode is active
			if( tuioConfiguration ){
				tuioConfiguration.setTableModeActive(true);
			};
			
			// Disable map toggle
			g_tuioService.disableMapToggleClick();

			// Inform OpenLayers that map was resized
			if( moduleDisplay
				&& moduleDisplay.mapControl
				&& moduleDisplay.mapControl.map ){
				window.setTimeout(function(){
					moduleDisplay.mapControl.map.updateSize();
				},200);
			};
		};
	};

	//==================================================================
	/**
	 * Return to regular atlas mode
	 */
	function endTableMode() {
		
		if( IsTableModeOn() ){
			$('body').removeClass('nunaliit_tuio');
			
			var $content = $('.nunaliit_content');

			$content.removeAttr('style');
			$('.n2tuio_remove').remove();
			hidePane();
			
			// Remember that table mode is inactive
			if( tuioConfiguration ){
				tuioConfiguration.setTableModeActive(false);
			};
			
			// Restore map toggle
			g_tuioService.restoreMapToggleClick();

			// Inform OpenLayers that map was resized
			if( moduleDisplay
				&& moduleDisplay.mapControl
				&& moduleDisplay.mapControl.map ){
				window.setTimeout(function(){
					moduleDisplay.mapControl.map.updateSize();
				},200);
			};
		};
	};
	
	//==================================================================
	/**
	 * If in regular mode, switch to table mode.
	 * If in table mode, get out of it.
	 */
	function toggleTableMode() {
		if( !IsTableModeOn() ){
			startTableMode();
		} else {
			endTableMode();
		};
	};

	//==================================================================
	function Main(){
		// Configuration from local storage
		tuioConfiguration = new TuioConfiguration();

		if( tuioConfiguration.isEnabled()
			&& typeof io === 'function' ){
			socket = io('http://localhost:3000');

			if( socket ){
				socket.on('cursor update', function(update) {
					updateAlive(cursors, update.alive);
					updateCursors(update.set);
				});

				socket.on('tangibles update', function(update) {
					updateAlive(tangibles, update.alive);
					updateTangibles(update.set);
				});

				socket.on('welcome', function(update) {
					tuioConnected = true;
					$n2.log('tuio connected');
				});

				socket.emit('new client',{});
			};

			// Load saved calibration
			calibration = tuioConfiguration.getCalibration();

			// At regular intervals, attempt to save calibration data
			window.setInterval(function(){
				escapeKeyCount = 0;

				if( calibrationDirty ){
					if( $n2.storage
						&& $n2.storage.getLocalStorage
						&& typeof JSON !== 'undefined'
						&& JSON.stringify
						&& JSON.parse ){
						tuioConfiguration.setCalibration(calibration);
						calibrationDirty = false;
					};
				};
			},2000);

			window.onkeydown = function (e) {
				var code = e.keyCode ? e.keyCode : e.which;

				if (code === 27) {
					// Escape pressed, toggle non-map UI visibility
					++escapeKeyCount;
					if( escapeKeyCount >= 3 ){
						escapeKeyCount = 0;
						toggleTableMode();
					};
				};

				if( IsTableModeOn() ){
					var $content = $('.nunaliit_content');
					var content = $content[0];

					if (code == 70) {
						// f pressed, toggle visual feedback
						showDots = !showDots;
					} else if ( 67 === code && escapeKeyCount >= 2) {
						// <esc> <esc> c : calibrate
						if( g_tuioService ){
							g_tuioService.startCalibration();
						};
					} else if (code == 66) {
						// b, toggle border
						$('.n2tuio_edit_ring').toggleClass('n2tuio_hide');
					} else if (e.shiftKey) {
						// TUIO calibration
						if (code == 37) {
							if (e.altKey) {
								// Shift+Alt+left, offset TUIO left
								calibration.cursorXOffset -= 0.001;
							} else {
								// Shift+left, shrink TUIO horizontally
								calibration.cursorXScale -= 0.001;
							}
							calibrationDirty = true;
						} else if (code == 39) {
							if (e.altKey) {
								// Shift+Alt+right, offset TUIO right
								calibration.cursorXOffset += 0.001;
							} else {
								// Shift+right, expand TUIO horizontally
								calibration.cursorXScale += 0.001;
							}
							calibrationDirty = true;
						} else if (code == 40) {
							if (e.altKey) {
								// Shift+Alt+down, offset TUIO down
								calibration.cursorYOffset += 0.001;
							} else {
								// Shift+down, shrink TUIO vertically
								calibration.cursorYScale -= 0.001;
							}
							calibrationDirty = true;
						} else if (code == 38) {
							if (e.altKey) {
								// Shift+Alt+up, offset TUIO up
								calibration.cursorYOffset -= 0.001;
							} else {
								// Shift+up, grow TUIO vertically
								calibration.cursorYScale += 0.001;
							}
							calibrationDirty = true;
						}
					} else if (code == 37) {
						if (e.altKey) {
							// Alt+left, shrink horizontally
							calibration.xMargin += 2;
						} else {
							// Left, shift left
							calibration.xOffset -= 2;
						}

						content.style.left = (calibration.xMargin + calibration.xOffset) + "px";
						content.style.right = (calibration.xMargin - calibration.xOffset) + "px";
						calibrationDirty = true;
					} else if (code == 39) {
						if (e.altKey) {
							// Alt+right, grow horizontally
							calibration.xMargin -= 2;
						} else {
							// Right, shift right
							calibration.xOffset += 2;
						}

						content.style.left = (calibration.xMargin + calibration.xOffset) + "px";
						content.style.right = (calibration.xMargin - calibration.xOffset) + "px";
						calibrationDirty = true;
					} else if (code == 40) {
						if (e.altKey) {
							// Alt+down, shrink vertically
							calibration.yMargin += 2;
						} else {
							// Down, shift up
							calibration.yOffset += 2;
						}

						content.style.top = (calibration.yMargin + calibration.yOffset) + "px";
						content.style.bottom = (calibration.yMargin - calibration.yOffset) + "px";
						calibrationDirty = true;
					} else if (code == 38) {
						if (e.altKey) {
							// Alt+up, grow vertically
							calibration.yMargin -= 2;
						} else {
							// Up, shift down
							calibration.yOffset -= 2;
						}

						content.style.top = (calibration.yMargin + calibration.yOffset) + "px";
						content.style.bottom = (calibration.yMargin - calibration.yOffset) + "px";
						calibrationDirty = true;
					} else if (code == 80) {
						// P, show/hide pane
						togglePane();
					};
				};
			};

			if (usePhysics) {
				window.requestAnimationFrame(tick);
			};
			
			// Restore mode
			if( tuioConfiguration.isTableModeActive() ){
				startTableMode();
			};
		};
	};

	//==================================================================
	var CalibrationProcess = $n2.Class({

		intervalId: null,

		timeLeft: null,

		canvasId: null,

		canvasContext: null,

		// Canvas geometries

		width: null,

		height: null,

		initialize: function(opts_){
			var opts = $n2.extend({

			},opts_);

			var _this = this;

			// Timeout for abort
			this.timeLeft = 10;
			this.intervalId = window.setInterval(function(){
				_this.timeLeft = _this.timeLeft - 1;
				if( _this.timeLeft <= 0 ){
					$n2.log('CalibrationProcess aborting',this);
					_this._abortProcess();
				};
			},500);

			// Install canvas
			var $content = $('.nunaliit_content');
			this.width = $content.width();
			this.height = $content.height();
			this.canvasId = $n2.getUniqueId();
			var $canvas = $('<canvas>')
				.attr('id', this.canvasId)
				.attr('width',this.width)
				.attr('height',this.height)
				.css({
					position: 'absolute'
					,left: '0'
					,top: '0'
				})
				.appendTo($content);
			var canvasElem = $canvas[0];
			this.canvasContext = canvasElem.getContext('2d');
			canvasElem.onmousedown = function (e) {
				return _this._mouseDown(e);
			};
			this._startFirstStep();

			$n2.log('CalibrationProcess',this);
		},

		_mouseDown: function(e){
			var pos = this._getMousePosition(e);
			$n2.log('calibration mouse down',pos);

			if( 1 == this.step ){
				this.press1 = pos;
				this._clearCanvas();
				this._startSecondStep();

			} else if( 2 == this.step ){
				this.press2 = pos;
				this._clearCanvas();
				this._calibrate();
			};

			return false;
		},

		_calibrate: function(){
			this._abortProcess();
		},

		_clearCanvas: function(){
			this.canvasContext.clearRect(0,0,this.width,this.height);
		},

		_startFirstStep: function(){
			//this.canvasContext.fillStyle = 'rgba(255,0,0,64)';
			//this.canvasContext.fillRect(0,0,this.width,this.height);

			this.step = 1;
			this.step1 = {
				x: Math.floor(this.width / 2)
				,y: Math.floor(this.height / 2)
			};

			this._drawMarker(this.step1);
		},

		_startSecondStep: function(){
			this.step = 2;
			this.step2 = {
				x: this.step1.x + 250
				,y: this.step1.y + 250
			};

			this._drawMarker(this.step2);
		},

		_drawMarker: function(pos){
			this.canvasContext.fillStyle = '#000000';
			this.canvasContext.fillRect(pos.x-7,pos.y-7,14,14);

			this.canvasContext.fillStyle = '#ffff00';
			this.canvasContext.fillRect(pos.x-5,pos.y-5,10,10);

			this.canvasContext.fillStyle = '#000000';
			this.canvasContext.fillRect(pos.x-1,pos.y-1,2,2);
		},

		_getMousePosition: function(e) {
			var $canvas = $('#'+this.canvasId);
			var canvasElem = $canvas[0];
			var box = canvasElem.getBoundingClientRect();
			return { x: e.clientX - box.left,
			         y: e.clientY - box.top };
		},

		_abortProcess: function(){
			window.clearInterval(this.intervalId);

			$('#'+this.canvasId).remove();
			this.canvasContext = null;

			$n2.log('CalibrationProcess ended',this);
		}
	});

	//==================================================================
	var GeometryCapture = $n2.Class({

		tuioService: null,

		positions: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				tuioService: null
			},opts_);

			this.positions = [];

			this.tuioService = opts.tuioService;
		},

		addPoint: function(x,y){
			if (this.positions.length == 0 ||
			    this.positions[this.positions.length - 1].x != x ||
			    this.positions[this.positions.length - 1].y != y) {
			    this.positions.push(new Vector(x, y));
			}
		},

		// Convert captured pixel positions to a list of OpenLayers Points
		positionsToPoints: function(positions){
			var points = [];

			for(var i = 0; i < positions.length; ++i) {
				var position = positions[i];
				var lonlat = this.tuioService.getMapPosition(position.x, position.y);
				if( lonlat ){
					var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);

					points.push(point);
				};
			};

			//$n2.log('points',points);

			return points;
		},

		// Get captured positions as an OpenLayers Geometry
		getGeometry: function(){
			if (this.positions.length == 0) {
				return null;
			}

			var first = this.positions[0];
			var last = this.positions[this.positions.length - 1];
			var poly = null;

			if (lineStringDistance(this.positions) <= pointDistance) {
				// Gesture didn't move very far, create a single point
				var pos = centerPoint(this.positions);
				var lonlat = this.tuioService.getMapPosition(pos.x, pos.y);
				if (lonlat) {
					return new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
				}
			} else if ((poly = simplifyPolygon(this.positions)) != null ||
					   distance(first.x, first.y, last.x, last.y) <= pointDistance) {
				// Start/end are close, or there is an intersection, create a polygon
				var points = (poly ? this.positionsToPoints(poly)
				                   : this.positionsToPoints(this.positions));
				var ring = new OpenLayers.Geometry.LinearRing();
				for (var i = 0; i < points.length; ++i) {
					ring.addPoint(points[i]);
				}
				return new OpenLayers.Geometry.Polygon([ring]);
			} else {
				// Doesn't seem to be a point or closed polygon, create a line string
				var points = this.positionsToPoints(this.positions);
				var geom = new OpenLayers.Geometry.LineString();
				for (var i = 0; i < points.length; ++i) {
					geom.addPoint(points[i]);
				}
				return geom;
			}

			return null;
		},

		endDrawing: function(){
			if( !this.tuioService.isEditing() ){
				return;
			};

			var geom = this.getGeometry();
			if (!geom) {
				return;
			}

			//$n2.log('geom',geom);

			var mapControl = this.tuioService.getMapControl();
			if( mapControl ){
				$n2.log('mapControl',mapControl);
				mapControl.initiateEditFromGeometry({
					geometry: geom
					,suppressCenter: true
				});

				// Save (empty) document for drawn geometry
				this.tuioService.dispatch({
					type: 'editTriggerSave'
				});
			};
		}
	});

	//==================================================================
	var TuioService = $n2.Class({

		dispatchService: null,

		tangibleState: null,

		unrecognizedTangibles: null,

		editing: null,

		mapEditing: null,

		moduleDisplay: null,
		
		originalMapToggleClick: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				dispatchService: null
			},opts_);

			var _this = this;

			this.tangibleState = {};
			this.unrecognizedTangibles = {};
			this.editing = false;
			this.mapEditing = false;
			this.originalMapToggleClick = true;

			this.dispatchService = opts.dispatchService;

			if( this.dispatchService ){
				var f = function(m, addr, dispatcher){
					_this._handle(m, addr, dispatcher);
				};

				this.dispatchService.register(DH,'tuioGetState',f);
				this.dispatchService.register(DH,'reportModuleDisplay',f);
				this.dispatchService.register(DH,'editInitiate',f);
				this.dispatchService.register(DH,'mapReportMode',f);
				this.dispatchService.register(DH,'editClosed',f);
				this.dispatchService.register(DH,'start',f);
			};

			// Register with global variable
			g_tuioService = this;
		},

		startCalibration: function(){
			new CalibrationProcess();
		},

		getModuleDisplay: function(){
			return this.moduleDisplay;
		},

		isEditing: function(){
			if( this.editing ){
				return true;
			};

			if( this.mapEditing ){
				return true;
			};

			return false;
		},

		getMapControl: function(){
			var mapControl = undefined;

			if( this.moduleDisplay ){
				mapControl = this.moduleDisplay.mapControl;
			};

			return mapControl;
		},

		getOpenLayersMap: function(){
			var olMap = undefined;

			var mapControl = this.getMapControl();
			if( mapControl ){
				olMap = mapControl.map;
			};

			return olMap;
		},

		getMapPosition: function(x,y){
			var position = undefined;

			var olMap = this.getOpenLayersMap();
			if( olMap ){
				position = olMap.getLonLatFromPixel({
					x: x
					,y: y
				});
			};

			return position;
		},

		getMapProjection: function(){
			var proj = undefined;

			var olMap = this.getOpenLayersMap();
			if( olMap ){
				proj = olMap.getProjectionObject();
			};

			return proj;
		},
		
		resetMapToInitialExtent: function(){
			this.dispatch({
				type: 'mapResetExtent'
			});
		},
		
		disableMapToggleClick: function(){
			var mapControl = this.getMapControl();
			if( mapControl && mapControl.options ){
				mapControl.options.toggleClick = false;
			};
		},

		restoreMapToggleClick: function(){
			var mapControl = this.getMapControl();
			if( mapControl && mapControl.options ){
				mapControl.options.toggleClick = this.originalMapToggleClick;
			};
		},

		dispatch: function(m){
			if( this.dispatchService ){
				this.dispatchService.send(DH,m);
			};
		},

		_handle: function(m, addr, dispatcher){
			if( 'tuioGetState' === m.type ){
				// Synchronous call
				if( IsTuioConnected() ){
					m.connected = true;
				};

				if( IsTableModeOn() ){
					m.mode = 'table';
				} else {
					m.mode = 'regular';
				};

			} else if( 'reportModuleDisplay' === m.type ) {
				moduleDisplay = m.moduleDisplay;
				this.moduleDisplay = m.moduleDisplay;
				
				var mapControl = this.getMapControl();
				if( mapControl && mapControl.options ){
					this.originalMapToggleClick = mapControl.options.toggleClick;
				};

			} else if( 'editInitiate' === m.type ) {
				this.editing = true;

			} else if( 'editClosed' === m.type ) {
				this.editing = false;

			} else if( 'mapReportMode' === m.type ) {
				var mapControl = m.mapControl;
				if( mapControl
					&& mapControl.modes
					&& mapControl.modes.NAVIGATE ){
					if( m.mode === mapControl.modes.NAVIGATE.name ){
						this.mapEditing = false;
						$('body').removeClass('nunaliit_editing');
					} else {
						this.mapEditing = true;
						$('body').addClass('nunaliit_editing');
					};
				};

			} else if( 'start' === m.type ) {
				// Configuration is done. Begin operation
				Main();
			};
		},

		_updateTangibles: function(tangibles){
			for(var tangibleSeq in tangibles){
				var tangible = tangibles[tangibleSeq];
				var tangibleId = tangible.id;

				if( !tangible.service ){
					tangible.service = {};
				};

				// Process this tangible
				if( 0 === tangibleId ){
					if( tangible.alive
						&& !tangible.service.start ){
						tangible.service.start = true;
						this.dispatchService.send(DH,{
							type: 'loginShowForm'
						});
					} else if( !tangible.alive
					           && !tangible.service.end ){
						tangible.service.end = true;
						this.dispatchService.send(DH,{
							type: 'logout'
						});
					};

				} else if( 1 === tangibleId ){
					// Calibration
					if( !tangible.service.start ){
						tangible.service.start = true;
						this.startCalibration();
					};

				} else {
					// Tangible id not known. Report in log
					if( !this.unrecognizedTangibles[tangibleId] ){
						this.unrecognizedTangibles[tangibleId] = true;
						$n2.log('Tangible not recognized: '+tangibleId);
					};
				};
			};

			this.tangibleState.tangibles = tangibles;

			if( this.dispatchService ){
				this.dispatchService.send(DH,{
					type: 'tuioTangiblesUpdate'
					,tangibles: this.tangibleState
				});
			};
		},

		_updateCursors: function(cursors, hands){
			this.tangibleState.cursors = cursors;
			this.tangibleState.hands = hands;

			if( this.dispatchService ){
				this.dispatchService.send(DH,{
					type: 'tuioTangiblesUpdate'
					,tangibles: this.tangibleState
				});
			};
		}
	});

	$n2.tuioClient = {
		IsTuioConnected: IsTuioConnected
		,TuioService: TuioService
		,TuioConfiguration: TuioConfiguration
	};

})(jQuery, nunaliit2);
