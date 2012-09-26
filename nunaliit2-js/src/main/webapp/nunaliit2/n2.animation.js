/*
$Id: n2.animation.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($){
	/*
	 * Functional animator - uses functional interfaces of objects that control rendering of
	 * graphics to be animated to produce stepping animations.  All control values are assumed
	 * to be floats - get and update functions can mask this if needed.
	 * depends on jQuery ($.extend)
	 */
	function functionalAnimator(o_) {
		function animObject(opt_) {
			var values = {
				obj: null,       // object that controls the rendering to be animated.
				getFn: null,     // returns orderedArray of current parameter values
				updateFn: null,  // updates the rendering according to an array of values ordered as per getFn
				targets: null,   // array of target values - same order as getFn returns
				increments: null // array of increments - numeric values needed - assumed floats
			}
			var options = $.extend({}, values, opt_);
			var animDone = false;  // flag for clearing out finished animations
			
			return({
				getObj : function() {
					return(options.obj);
				},
				getGetFn : function() {
					return(options.getFn);
				},
				getTargets : function() {
					return(options.targets);
				},
				getUpdateFn : function() {
					return(options.updateFn);
				},
				getIncrements : function() {
					return(options.increments);
				},
				done : function() {
					animDone = true;
				},
				isDone : function() {
					return(animDone);
				}
			});
		}
		
		var defaults = {
			period : 40, // increment period for attribute animation - milliseconds
			postIterHook: null // function to call after animation iteration
		};
		var options = $.extend({}, defaults, o_);
		
		var objectsToAnimate = {};
		
		function add(key, obj, getFn, updateFn, targets, time) {		
			var steps = time / options.period;
			if (steps < 1) {
				steps = 1;
			}
			
			var currVals = getFn(obj);
			var increments = [];
			for (var i=0; i<currVals.length; i++) {
				var inc = (targets[i] - currVals[i]) / steps;
				increments.push(inc);
			}
			
			objectsToAnimate[key] = animObject({
				obj: obj,
				getFn: getFn,
				updateFn: updateFn,
				targets: targets,
				increments: increments
			});
		}
		
		function iterateSingleAnimObject(key, animInfo) {
			var obj = animInfo.getObj();
			var g = animInfo.getGetFn();
			var currVals = g(obj);

			var increments = animInfo.getIncrements();
			var targets = animInfo.getTargets();
			var atTargets = 0;
			for (var i=0; i<currVals.length; i++) {
				currVals[i] += increments[i];
				if ((increments[i] >= 0 && currVals[i] >= targets[i]) || // catches the case of == 0 for multi-value target lists
					(increments[i] < 0 && currVals[i] <= targets[i])) {
					currVals[i] = targets[i];
					atTargets++;
				}
			}
			if (atTargets == currVals.length) {
				animInfo.done();
			}
			
			var u = animInfo.getUpdateFn();
			u(obj, currVals);
	
			var animFinished = false;
			if (animInfo.isDone()) {
				// recheck the stored flag here - if a new animation has
				// been started (which shouldn't happen because of the
				// single-threading of javascript), the flag cleared may
				// no longer be there because a new animation object (with
				// a new target definition may have been placed in the list).
				delete objectsToAnimate[key];
				animFinished = true;
			}
			return(animFinished);
		}
		
		function animate() {
			var animFinished = true;
			for (var key in objectsToAnimate) {
				if (objectsToAnimate.hasOwnProperty(key)) {
					if (false == iterateSingleAnimObject(key, objectsToAnimate[key])) {
						// at least one not yet finished - schedule again
						animFinished = false;
					};
				}
			}
			
			if (null != options.postIterHook) {
				options.postIterHook();
			}

			return(! animFinished);
		}
		
		var isAnimRunnig = false;
		function go() {
			var reschedule = animate();
			if (reschedule) {
				setTimeout(function() { go(); }, options.period);
			} else {
				isAnimRunnig = false;
			}
		}
		
		function startAnimation() {
			if (! isAnimRunnig) {
				setTimeout(function(){ go(); }, 0); // run now on background task
				isAnimRunnig = true;
			}
		}
				
		return({
			add: add,
			startAnimation: startAnimation
		});
	};
	
	if ('undefined' == typeof $.widgets || null == $.widgets) {
		$.widgets = {};
	};
	$.widgets.functionalAnimator = functionalAnimator;
	
})(jQuery);