// Socket to tuioserver.js that emits TUIO events in JSON
var socket = io('http://localhost:3000');

// Speed factor for drag scrolling
var scrollSpeed = 1.0;

// Toggle for whether non-map page elements are visible (kludge)
var barsVisible = true;

// Time in ms a cursor must be gone to be considered up
var clickDelay = 500;

// Distance a cursor must remain within to count as a click
var clickDistance = 0.005;

// Maximum distance to consider cursors to be on the same hand
var handSpan = 0.25;

// Next hand instance ID counter
var nextHandIndex = 1;

// Cursor key currently acting as the mouse, if any
var mouseCursor = undefined;

// Calibration configuration
var minX = 0.118;
var minY = 0.00;
var maxX = 0.850;
var maxY = 1.0;
var dotSize = 16.0;

function Point(x, y) {
	this.x = x;
	this.y = y;
}

function normalize(c, min, max) {
	if (isNaN(c)) {
		return Number.NaN;
	}

	return ((c - 0.5) / (max - min)) + 0.5;
}

function normalizeX(x) {
	return normalize(x, minX, maxX);
}

function normalizeY(y) {
	return normalize(y, minY, maxY);
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
		area += (pj.x + pi.x) * (pj.y - pi.y)
	}

	return area / 2;
};

/** Return the center point of a polygon specified by a set of points. */
function centroid(points) {
	if (points.length == 1) {
		// Center of a single point is that point
		return points[0];
	} else if (points.length == 2) {
		// Center of a line is the midpoint of that line
		return new Point((points[0].x + points[1].x) / 2,
						 (points[0].y + points[1].y) / 2);
	}

	var x = 0;
	var y = 0;
	var j = points.length - 1;

	for (var i = 0; i < points.length; j = i++) {
		var pi = points[i];
		var pj = points[j];
		var f = pi.x * pj.y - pj.x * pi.y;
		x += (pi.x + pj.x) * f;
		y += (pi.y + pj.y) * f;
	}

	var g = area(points) * 6;

	return new Point(x / g, y / g);
};

/** Construct a new cursor (finger). */
function Cursor() {
	this.x = Number.NaN;
	this.y = Number.NaN;
	this.down = false;
	this.downX = Number.NaN;
	this.downY = Number.NaN;
	this.index = Number.NaN;
	this.div = undefined;
	this.lastSeen = Date.now();
	this.hand = undefined;
	this.show = function() {
		if (this.div == undefined) {
			this.div = createDot(this.x, this.y, this.index);
		}

		this.div.style.left = ((this.x * window.innerWidth) - 10) + "px";
		this.div.style.top = ((this.y * window.innerHeight) - 10) + "px";
	}
}

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
	this.cursors = [];
	this.positionDirty = false;
	this.x = x;
	this.y = y;
	this.index = nextHandIndex++;
	this.div = undefined;

	/** Update the hand position based on cursor positions. */
	this.updatePosition = function() {
		this.positionDirty = false;
		if (this.cursors.length < 0) {
			return;
		}

		var pos = centroid(this.cursors);
		this.x = pos.x;
		this.y = pos.y;
	}

	this.removeCursor = function(cursor) {
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
			this.updatePosition();
			this.show();
		}
	}

	/** Display a circle representing this hand for feedback. */
	this.show = function() {
		if (this.div == undefined) {
			this.div = createDot(this.x, this.y, "H" + this.index);
		}

		this.div.style.left = ((this.x * window.innerWidth) - 10) + "px";
		this.div.style.top = ((this.y * window.innerHeight) - 10) + "px";
		this.div.style.borderColor = "red";
	}

	/** Return the maximum distance a hand currently spans. */
	this.span = function() {
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
	this.trimCursors = function() {
		orphans = [];

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
		var d = distance(x, y, hands[h].x, hands[h].y);
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
					distance(hand.cursors[i].x, hand.cursors[i].y,
							 hand.cursors[j].x, hand.cursors[j].y));
			}
		}
	}

	return maxDistance;
}

/** Called on the initial position update after a cursor is down. */
function onCursorDown(inst) {
	// if (mouseCursor == undefined) {
	// 	dispatchMouseEvent('mousedown', newX, newY);
	// 	mouseCursor = inst;
	// }
}

function onCursorMove(inst) {
	// if (inst == mouseCursor) {
	// 	dispatchMouseEvent('mousemove', newX, newY);
	// }
}

function onCursorUp(inst) {
	// if (inst == mouseCursor) {
	// 	// This cursor is currently emulating the mouse
	// 	// Dispatch mouseup event
	// 	dispatchMouseEvent('mouseup', dict[inst].x, dict[inst].y);

	// 	// If the cursor is unmoved since mousedown, this is a click
	// 	var d = distance(dict[inst].x, dict[inst].y,
	// 					 dict[inst].downX, dict[inst].downY);
	// 	if (alive.length == 1 && d < clickDistance) {
	// 		dispatchMouseEvent('click', dict[inst].x, dict[inst].y);
	// 	}

	// 	mouseCursor = undefined;
	// }
}

function onHandDown(inst) {
}

function onHandMove(inst) {
}

function onHandUp(inst) {
	var hand = hands[inst];

	if (hand.div != undefined) {
		// Remove calibration div
		document.body.removeChild(hand.div);
	}

	if (mouseCursor == hand.index) {
		// Hand is acting as mouse cursor, dispatch mouse up
		dispatchMouseEvent('mouseup', hand.x, hand.y);
		mouseCursor = undefined;
	}

	delete hands[hand.index];
}

/** Associate a cursor with a hand, creating a new hand if necessary. */
function addCursorToHand(cursor)
{
	// Associate cursor with a hand
	var hand = bestHand(cursor.x, cursor.y);
	if (hand) {
		// Add to existing hand
		hand.cursors.push(cursor);
		hand.positionDirty = true;
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

		var newX = normalizeX(set[inst][0]);
		var newY = normalizeY(set[inst][1]);
		if (isNaN(newX) || isNaN(newY)) {
			continue;
		}

		// Update stored cursor position
		cursors[inst].x = newX;
		cursors[inst].y = newY;

		if (!cursors[inst].down) {
			// Initial cursor position update (cursor down)
			cursors[inst].down = true;
			cursors[inst].downX = newX;
			cursors[inst].downY = newY;

			addCursorToHand(cursors[inst]);
			onCursorDown(inst);
		} else {
			// Position update for down cursor (cursor move)
			onCursorMove(inst);
		}

		// Update cursor visual feedback
		cursors[inst].show();

		if (cursors[inst].hand) {
			// Flag hand position as dirty for recalculation
			cursors[inst].hand.positionDirty = true;
		}
	}

	// Update the position of any hands that have changed
	var cursorsMoved = false;
	for (var inst in hands) {
		var hand = hands[inst];
		if (hand.positionDirty) {
			hand.updatePosition();
		}

		// Check if any cursors have moved outside a reasonable hand span
		var orphans = hand.trimCursors();
		if (orphans.length > 0) {
			for (var i = 0; i < orphans.length; ++i) {
				var orphan = orphans[i];
				console.log(orphan);
				addCursorToHand(orphan);
			}
			cursorsMoved = true;
		}
	}

	// Show hand visual feedback
	for (var inst in hands) {
		var hand = hands[inst];
		if (hand.positionDirty) {
			hand.updatePosition();
		}

		hand.show();
	}
}

function updateTangibles(set) {
	for (var inst in set) {
		if (!set.hasOwnProperty(inst)) {
			continue; // Ignore prototypes
		}

		if (set[inst] != undefined && tangibles[inst] != undefined) {
			tangibles[inst]['id'] = set[inst][0];
			tangibles[inst]['x'] = normalizeX(set[inst][1]);
			tangibles[inst]['y'] = normalizeY(set[inst][2]);
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
		var text = document.getElementById("nunaliit2_uniqueId_67");
		var foot = document.getElementsByClassName("nunaliit_footer")[0];
		if (!barsVisible) {
			head.style.display = "none";
			map.style.right = "0";
			zoom.style.top = "45%";
			but.style.top = "45%";
			but.style.right = "20px";
			pane.style.display = "none";
			text.style.display = "none";
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
			text.style.display = "block";
			foot.style.display = "block";
			content.style.top = "102px";
			content.style.bottom = "17px";
		}
		barsVisible = !barsVisible;
	}
};
