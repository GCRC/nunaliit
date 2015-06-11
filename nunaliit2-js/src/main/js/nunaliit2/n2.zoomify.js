/*******************************************************************************************
 * zoomify
 * Written by Craig Francis
 * Absolutely minimal version of GSIV to work with touch screens and very slow processors.
********************************************************************************************/

(function($,$n2) {
"use strict";

//--------------------------------------------------
var ZoomImage = $n2.Class({

	img_ref: null,
	
	div_ref: null,

	div_half_width: null,

	div_half_height: null,

	zoom_control_refs: null,

	zoom_levels: null,

	zoom_level_count: null,

	img_current_left: null,

	img_current_top: null,

	zoom_level: null,

	img_orig_width: null,

	img_orig_height: null,
	
	img_zoom_width: null,
	
	img_zoom_height: null,
	
	click_last: null,

	img_start_left: null,

	img_start_top: null,

	origin: null,
		
	initialize: function(opts_) {
		var opts = $n2.extend({
			imageElem: null
			,wrapperElem: null
		},opts_);
		
		var _this = this;

		this.img_current_left = null;
		this.zoom_control_refs = {};
		this.zoom_levels = [];
		this.zoom_level_count = 0;
		this.zoom_level = 0;
		this.click_last = 0;
		this.img_start_left = null;
		this.img_start_top = null;
		this.origin = null;

		this.img_ref = $(opts.imageElem)
			.addClass('n2_zoomify_image');

		if(this.img_ref.length > 0) {
			if( opts.wrapperElem ){
				this.div_ref = $(opts.wrapperElem);
			} else {
				this.div_ref = $('<div>')
					.insertBefore( this.img_ref );
				this.img_ref.appendTo(this.div_ref);
			};
			this.div_ref.addClass('n2_zoomify_image_wrapper');

			//--------------------------------------------------
			// Wrapper size

			var div_border;
			try {
				var div_style = getComputedStyle(this.div_ref[0], '');
				div_border = div_style.getPropertyValue('border-top-width');
				this.div_half_width = div_style.getPropertyValue('width');
				this.div_half_height = div_style.getPropertyValue('height');
			} catch(e) {
				div_border = this.div_ref.css('border-top-width');
				this.div_half_width = this.div_ref.css('width');
				this.div_half_height = this.div_ref.css('height');
			}

			this.div_half_width = Math.round(parseInt(this.div_half_width, 10) / 2);
			this.div_half_height = Math.round(parseInt(this.div_half_height, 10) / 2);

			//--------------------------------------------------
			// Original size

			this.img_orig_width = this.img_ref.width();
			this.img_orig_height = this.img_ref.height();

			//--------------------------------------------------
			// Add zoom controls

			var buttons = [{'t' : 'in', 's' : 'on'}, {'t' : 'in', 's' : 'off'}, {'t' : 'out', 's' : 'on'}, {'t' : 'out', 's' : 'off'}];

			for(var k = 0, len = buttons.length; k < len; ++k) {

				var button = buttons[k];
				var name = button.t + '-' + button.s;

				this.zoom_control_refs[name] = $('<div>')
					.addClass('n2_zoomify_control n2_zoomify_' + button.t + ' n2_zoomify_' + button.s);

				if (button.t === 'in') {
					if (button.s === 'on') {
						this.zoom_control_refs[name]
							.mousedown(function(){
								return _this.image_zoom_in();
							});
					};
				} else {
					if (button.s === 'on') {
						this.zoom_control_refs[name]
							.mousedown(function(){
								return _this.image_zoom_out();
							});
					};
				};

				if (button.s === 'on') {
					this.zoom_control_refs[name].css({cursor:'pointer'});
				};

				this.zoom_control_refs[name].appendTo(this.div_ref);
			};

			//--------------------------------------------------
			// Zoom levels

			//--------------------------------------------------
			// Defaults

			var div_width = (this.div_half_width * 2);
			var div_height = (this.div_half_height * 2);

			var width = this.img_orig_width;
			var height = this.img_orig_height;

			this.zoom_levels[this.zoom_levels.length] = width;

			while (width > div_width || height > div_height) {
				width = (width * 0.75);
				height = (height * 0.75);
				this.zoom_levels[this.zoom_levels.length] = Math.round(width);
			}

			this.zoom_levels.reverse(); 

			//--------------------------------------------------
			// Mobile phone, over zoom

			//if (parseInt(div_border, 10) === 5) { // img width on webkit will return width before CSS is applied
				this.zoom_levels[this.zoom_levels.length] = Math.round(this.img_orig_width * 1.75);
				this.zoom_levels[this.zoom_levels.length] = Math.round(this.img_orig_width * 3);
			//};

			//--------------------------------------------------
			// Set default

			this.zoom_level_count = (this.zoom_levels.length - 1);

			this.image_zoom(0);

			//--------------------------------------------------
			// Make visible

			this.img_ref.css({visibility:'visible'});
			
			this.div_ref.addClass('js-active');

			//--------------------------------------------------
			// Add events

			this.img_ref
				.mousedown(function(){
					return _this.image_move_start();
				})
				.bind('touchstart', function(){
					return _this.image_move_start();
				});

			this.div_ref.bind('DOMMouseScroll',function(e){
				return _this.scroll_event(e);
			});
			this.div_ref.bind('mousewheel',function(e){
				return _this.scroll_event(e);
			});

			document.onkeyup = function(e) {
				var keyCode = (e ? e.which : window.event.keyCode);

				if (keyCode === 37 || keyCode === 39) { // left or right

					_this.img_current_left = (_this.img_current_left + (keyCode === 39 ? 50 : -50));

					_this.image_move_update();

				} else if (keyCode === 38 || keyCode === 40) { // up or down

					_this.img_current_top = (_this.img_current_top + (keyCode === 40 ? 50 : -50));

					_this.image_move_update();

				} else if (keyCode === 107 || keyCode === 187 || keyCode === 61) { // + or = (http://www.javascripter.net/faq/keycodes.htm)

					_this.image_zoom_in();

				} else if (keyCode === 109 || keyCode === 189) { // - or _

					_this.image_zoom_out();

				};
			};
		};
		
		$n2.log('ZoomImage',this);
	},

	//--------------------------------------------------
	// Zooming

	image_zoom: function(change) {
		var _this = this;
		
		//--------------------------------------------------
		// Zoom level

		var new_zoom = (this.zoom_level + change);

		if( new_zoom >= this.zoom_level_count ) {
			if( new_zoom > this.zoom_level_count ) {
				this.div_ref.css({opacity:0.5});
				setTimeout(function() {
					_this.div_ref.css({opacity:1});
				}, 150);
				return;
			};
			this.zoom_control_refs['in-on'].css({display:'none'});
			this.zoom_control_refs['in-off'].css({display:'block'});
		} else {
			this.zoom_control_refs['in-on'].css({display:'block'});
			this.zoom_control_refs['in-off'].css({display:'none'});
		};

		if( new_zoom <= 0 ) {
			if( new_zoom < 0 ) {
				this.div_ref.css({opacity:0.5});
				setTimeout(function() {
					_this.div_ref.css({opacity:1});
				}, 150);
				return;
			};
			this.zoom_control_refs['out-on'].css({display:'none'});
			this.zoom_control_refs['out-off'].css({display:'block'});
		} else {
			this.zoom_control_refs['out-on'].css({display:'block'});
			this.zoom_control_refs['out-off'].css({display:'none'});
		};

		this.zoom_level = new_zoom;

		//--------------------------------------------------
		// New width

		var new_zoom_width = this.zoom_levels[new_zoom];
		var new_zoom_height = (this.zoom_levels[new_zoom] * (this.img_orig_height / this.img_orig_width));

		this.img_ref.width(new_zoom_width);
		this.img_ref.height(new_zoom_height);

		//--------------------------------------------------
		// Update position

		if (this.img_current_left === null) { // Position in the middle on page load

			this.img_current_left = (this.div_half_width - (new_zoom_width  / 2));
			this.img_current_top  = (this.div_half_height - (new_zoom_height / 2));

		} else {

			var ratio = (new_zoom_width / this.img_zoom_width);

			this.img_current_left = (this.div_half_width - ((this.div_half_width - this.img_current_left) * ratio));
			this.img_current_top  = (this.div_half_height - ((this.div_half_height - this.img_current_top)  * ratio));

		}

		this.img_zoom_width = new_zoom_width;
		this.img_zoom_height = new_zoom_height;

		this.img_ref.css({
			'left': this.img_current_left + 'px'
			,'top': this.img_current_top + 'px'
		});

	},

	image_zoom_in: function() {
		this.image_zoom(1);
	},

	image_zoom_out: function() {
		this.image_zoom(-1);
	},

	scroll_event: function(e) {

		//--------------------------------------------------
		// Event

		e = e || window.event;

		var wheelData = (e.detail ? e.detail * -1 : e.wheelDelta / 40);

		this.image_zoom(wheelData > 0 ? 1 : -1);

		//--------------------------------------------------
		// Prevent default

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		};

		return false;
	},

	//--------------------------------------------------
	// Movement

	event_coords: function(e) {
		var coords = [];
		if( e.touches && e.touches.length ) {
			coords[0] = e.touches[0].clientX;
			coords[1] = e.touches[0].clientY;
		} else {
			coords[0] = e.clientX;
			coords[1] = e.clientY;
		};
		return coords;
	},

	image_move_update: function() {

		//--------------------------------------------------
		// Boundary check

		var max_left = (this.div_half_width - this.img_zoom_width),
			max_top = (this.div_half_height - this.img_zoom_height);

		if (this.img_current_left > this.div_half_width)  { this.img_current_left = this.div_half_width; };
		if (this.img_current_top  > this.div_half_height) { this.img_current_top  = this.div_half_height; };
		if (this.img_current_left < max_left)        { this.img_current_left = max_left; };
		if (this.img_current_top  < max_top)         { this.img_current_top  = max_top;  };

		//--------------------------------------------------
		// Move

		this.img_ref.css({
			left:this.img_current_left + 'px'
			,top:this.img_current_top + 'px'
		});

	},

	image_move_event: function(e) {

		//--------------------------------------------------
		// Calculations

		e = e || window.event;

		var currentPos = this.event_coords(e);

		this.img_current_left = (this.img_start_left + (currentPos[0] - this.origin[0]));
		this.img_current_top = (this.img_start_top + (currentPos[1] - this.origin[1]));

		this.image_move_update();

		//--------------------------------------------------
		// Prevent default

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false;
		}

		return false;
	},

	image_move_start: function(e) {

		//--------------------------------------------------
		// Event

		e = e || window.event;

		if (e.preventDefault) {
			e.preventDefault();
		} else {
			e.returnValue = false; // IE: http://stackoverflow.com/questions/1000597/
		};

		//--------------------------------------------------
		// Double tap/click event

		var now = new Date().getTime();
		if( this.click_last > (now - 200) ) {
			this.image_zoom_in();
		} else {
			this.click_last = now;
		};

		//--------------------------------------------------
		// Add events

		// http://www.quirksmode.org/blog/archives/2010/02/the_touch_actio.html
		// http://www.quirksmode.org/m/tests/drag.html

//		if (e.type === 'touchstart') {
//
//			this.img_ref.onmousedown = null;
//			this.img_ref.ontouchmove = image_move_event;
//			this.img_ref.ontouchend = function() {
//				this.img_ref.ontouchmove = null;
//				this.img_ref.ontouchend = null;
//			};
//
//		} else {
//
//			document.onmousemove = image_move_event;
//			document.onmouseup = function() {
//				document.onmousemove = null;
//				document.onmouseup = null;
//			};
//
//		};

		//--------------------------------------------------
		// Record starting position

		this.img_start_left = this.img_current_left;
		this.img_start_top = this.img_current_top;

		this.origin = this.event_coords(e);
	}
});

//----------------------------------------------------------
function zoomImage(opts_){
	return new ZoomImage(opts_);
};

//----------------------------------------------------------
$n2.zoomify = {
	zoomImage: zoomImage
};
		
}(jQuery,nunaliit2));
