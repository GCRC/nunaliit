/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.
   
THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.
*/

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,"nunaliit2",args); }
 ,DH = "n2.widgetDrawer"
 ;

 /*
  *  Drawer Widget Options
  * -------------------------------
  *  containerId: The container of the drawer
  *  buttonContainerClass: The container of the open drawer button
  *  buttonText: String representing the button text 
  *  widgets: Array of widgets placed inside the drawer widget
  *  width: Set width of drawer (in px or %)
  *  height: Set height of drawer (in px or %)
  *  xPos: Set xPos of drawer position (in px or %)
  *  yPos: Set yPos of drawer position (in px or %)
  *  pullDirection: UP, DOWN, LEFT, RIGHT (default)
  *  addClasses: Specify a class <string> or classes <array of strings> to the widget
  *  addButtonClasses: Specify a class <string> or classes <array of strings> to the button
  */
  
//--------------------------------------------------------------------------
var DrawerWidget = new $n2.Class("DrawerWidget",{
	
	dispatchService: null,
	config: null,
	drawerId: null,
	maskId: null,
	containerId: null,
	buttonContainerId: null,
	buttonText: null,
	drawer:null,
	addButtonClasses:null,

	initialize: function(opts_){
		var opts = $n2.extend({
			config: null
			,dispatchService: null
			,containerId: null
			,buttonContainerClass: null
			,buttonText: null
			,widgets: null
			,width: null
			,height: null
			,xPos: null
			,yPos: null
			,pullDirection: "RIGHT"
			,addClasses: null
			,addButtonClasses: null
		},opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.config = opts.config;

		this.containerId = opts.containerId;
		this.buttonText = opts.buttonText;
		this.addButtonClasses = opts.addButtonClasses;
		this.drawerId = $n2.getUniqueId();
		this.maskId = $n2.getUniqueId();
		this.drawer = {};

		this.buttonContainerId = this.containerId;
		if( typeof opts.buttonContainerClass === 'string' ){
			var $buttonContainer = $('.'+opts.buttonContainerClass).first();
			if( $buttonContainer.length > 0 ){
				this.buttonContainerId = $n2.utils.getElementIdentifier($buttonContainer);
			};
		};
	
		// Set Drawer Position & Dimensions
		// ---------------------------------------------
		this._setDrawerPosition(opts);
		this._setDrawerDimensions(opts);		
				
		// Find out which widget is available
		var availableWidgets = [];
		if ($n2.isArray(opts.widgets) && this.dispatchService) {
			opts.widgets.forEach(function(widgetInfo){
				var widgetHandlerAvailable = false;
				if (widgetInfo && widgetInfo.widgetType) {
					var msg = {
						type: "widgetIsTypeAvailable"
						,widgetType: widgetInfo.widgetType
						,widgetOptions: widgetInfo
						,isAvailable: false
					};

					_this.dispatchService.synchronousCall(DH, msg);

					if (msg.isAvailable) {
						widgetHandlerAvailable = true;
					};
				};
				if (widgetInfo && !widgetHandlerAvailable) {
					$n2.log("Widget handler not found for type: " + widgetInfo.widgetType);
				} else {
					availableWidgets.push(widgetInfo);
				};
			});
		};

		// If at least one widget is available, then build container
		if (availableWidgets.length > 0) {

			// Get container
			if (!this.containerId) {
				throw new Error("Drawer container class must be specified");
			};

			var $drawerContainer = $("#" + this.containerId);

			var $widget = $("<div>")
				.attr("id",this.drawerId)
				.addClass("n2widget_drawer")
				.css("left", this.drawer.xPos)
				.css("top", this.drawer.yPos)
				.css("width", this.drawer.width)
				.css("height", this.drawer.height)
				.appendTo($drawerContainer);

			// Set Transform translateX depending on pull direction
			if (this.drawer.pullDirection === "RIGHT") {
				$widget.css("transform", "translateX(-" + this.drawer.width + ")");
			} else if (this.drawer.pullDirection === "LEFT") {
				$widget.css("transform", "translateX(0px)");
			} else if (this.drawer.pullDirection === "UP") {
				$widget.css("transform", "translateY(0px)");
			} else if (this.drawer.pullDirection === "DOWN") {
				$widget.css("transform", "translateY(-" + this.drawer.height + ")");
			};

			// Add classes
			if (typeof opts.addClasses === "string") {
				$widget.addClass(opts.addClasses);
			} else if ($n2.isArray(opts.addClasses)) {
				opts.addClasses.forEach(function(className){
					if (typeof className === "string") {
						$widget.addClass(className);
					};
				});
			};

			var widgetContainerId = $n2.getUniqueId();
			var $widgetContainer = $("<div>")
				.attr("id",widgetContainerId)
				.addClass("n2widget_drawer_container")
				.appendTo($widget);

			availableWidgets.forEach(function(widgetInfo){
				_this.dispatchService.send(DH,{
					type: "widgetDisplay"
					,widgetType: widgetInfo.widgetType
					,widgetOptions: widgetInfo
					,containerId: widgetContainerId
					,config: _this.config
				});
			});

			this._addCloseButton();
			this._addOpenButton();
			this._addMask();

			$n2.log(this._classname, this);
		} else {
			$n2.log(this._classname + ": Not drawing because drawer is empty");
		};
	},

	_setDrawerPosition: function(opts){

		var validPullDirections = false;
		if( typeof opts.pullDirection === 'string' ){
			validPullDirections = opts.pullDirection.toUpperCase() === "LEFT"
				|| opts.pullDirection.toUpperCase() === "RIGHT"
				|| opts.pullDirection.toUpperCase() === "UP"
				|| opts.pullDirection.toUpperCase() === "DOWN";
		};

		if (validPullDirections) {
			if (opts.pullDirection.toUpperCase() === "RIGHT") {
				this.drawer.pullDirection = "RIGHT";
				this.drawer.xPos = "0%";
			} else if (opts.pullDirection.toUpperCase() === "LEFT") {
				this.drawer.pullDirection = "LEFT";
				this.drawer.xPos = "100%";
			} else if (opts.pullDirection.toUpperCase() === "UP") {
				this.drawer.pullDirection = "UP";
				this.drawer.yPos = "100%";
			} else if (opts.pullDirection.toUpperCase() === "DOWN") {
				this.drawer.pullDirection = "DOWN";
				this.drawer.yPos = "0%";
			};
		} else {
			// default pull direction is right
			this.drawer.pullDirection = "RIGHT";
			this.drawer.xPos = "0%";
		};

		// Set drawer x position
		if (!this.drawer.xPos) {
			if (opts.xPos) {
				if (Number.isInteger(parseInt(opts.xPos))) {
					this.drawer.xPos = parseInt(opts.xPos)+"px";
				} else if (opts.xPos.slice(-1) === "%" || opts.xPos.slice(-2) === "px") {
					this.drawer.xPos = opts.xPos;
				};				
			} else {
				// set default x position
				this.drawer.xPos = "0%";
			};
		};

		// Set drawer y position
		if (!this.drawer.yPos) {
			if (opts.yPos) {
				if (Number.isInteger(parseInt(opts.yPos))) {
					this.drawer.yPos = parseInt(opts.yPos)+"px";
				} else if (opts.yPos.slice(-1) === "%" || opts.yPos.slice(-2) === "px") {
					this.drawer.yPos = opts.yPos;
				};
			} else {
				// set default y position
				this.drawer.yPos = "0%";
			};			
		};
	},

	_setDrawerDimensions: function(opts){
		// Set drawer width
		if (!this.drawer.width && opts.width) {
			if (opts.width.slice(-1) === "%" || opts.width.slice(-2) === "px") {
				this.drawer.width = opts.width;
			} else if (Number.isInteger(parseInt(opts.width))) {
				this.drawer.width = parseInt(opts.width)+"px";
			};
		} else {
			// default drawer width values
			if (this.drawer.pullDirection === "RIGHT" || this.drawer.pullDirection === "LEFT") {
				this.drawer.width = "250px";
			} else {
				this.drawer.width = "100%";
			};
		};

		// Set drawer height
		if (!this.drawer.height && opts.height) {
			if (opts.height.slice(-1) === "%" || opts.height.slice(-2) === "px") {
				this.drawer.height = opts.height;
			} else if (Number.isInteger(parseInt(opts.height))) {
				this.drawer.height = parseInt(opts.height)+"px";
			};
		} else {
			// default drawer height values
			if (this.drawer.pullDirection === "UP" || this.drawer.pullDirection === "DOWN") {
				this.drawer.height = "250px";
			} else {
				this.drawer.height = "100%";
			}
		};
	},

	_addCloseButton: function(){
		var _this = this;

		var $container = $("#" + this.drawerId);

		var $button = $("<span>")
			.addClass("n2widget_drawer_close_button")
			.text("\u2716")
			.click(function(){
				// Set Transform translateX depending on pull direction
				if (_this.drawer.pullDirection === "RIGHT") {					
					$("#"+_this.drawerId).css("transform", "translateX(-" + _this.drawer.width + ")");		
				} else if (_this.drawer.pullDirection === "LEFT") {
					$("#"+_this.drawerId).css("transform", "translateX(0px)");
				} else if (_this.drawer.pullDirection === "UP") {
					$("#"+_this.drawerId).css("transform", "translateY(0px)");
				} else if (_this.drawer.pullDirection === "DOWN") {
					$("#"+_this.drawerId).css("transform", "translateY(-" + _this.drawer.height + ")");
				};
				
				var $drawer_content_mask = $("#" + _this.maskId);
				$drawer_content_mask.css("visibility","hidden");
			});

		$button.prependTo($container);
	},

	_addOpenButton: function(){
		var _this = this;

		var $buttonContainer = $(".nunaliit_header_container");

		if (typeof this.buttonContainerId === "string") {
			$buttonContainer = $("#"+this.buttonContainerId);
		};

		var openButtonText = "\u2261";
		if (typeof this.buttonText === "string") {
			openButtonText = this.buttonText;
		};

		var $button = $("<span>")
			.addClass("n2widget_drawer_open_button")
			.text(openButtonText)
			.click(function() {
				// Set Transform translateX depending on pull direction
				if (_this.drawer.pullDirection === "RIGHT") {					
					$("#"+_this.drawerId).css("transform", "translateX(0px)");		
				} else if (_this.drawer.pullDirection === "LEFT") {
					$("#"+_this.drawerId).css("transform", "translateX(-" + _this.drawer.width + ")");
				} else if (_this.drawer.pullDirection === "UP") {
					$("#"+_this.drawerId).css("transform", "translateY(-" + _this.drawer.height + ")");
				} else if (_this.drawer.pullDirection === "DOWN") {
					$("#"+_this.drawerId).css("transform", "translateY(0px)");
				};

				var $drawer_content_mask = $("#"+_this.maskId);
				$drawer_content_mask.css("visibility","visible");
				$n2.log($drawer_content_mask);
			});

		// Add button classes
		if (typeof this.addButtonClasses === "string") {
			$button.addClass(this.addButtonClasses);
		} else if ($n2.isArray(this.addButtonClasses)) {
			this.addButtonClasses.forEach(function(className){
				if (typeof className === "string") {
					$button.addClass(className);
				};
			});
		};

		$button.prependTo($buttonContainer);
	},

	_addMask: function(){
		var _this = this;

		var $drawerContainer = $("body");
		if (typeof this.containerId === "string") {
			$drawerContainer = $("#"+this.containerId);
		};

		// Add an atlas content mask
		// Used to hide content not related to drawer navigation menu
		$("<div>")
			.attr("id",this.maskId)
			.appendTo($drawerContainer)
			.addClass("drawer_content_mask")
			.click(function(){	
				// Set Transform translateX depending on pull direction
				if (_this.drawer.pullDirection === "RIGHT") {					
					$("#"+_this.drawerId).css("transform", "translateX(-" + _this.drawer.width + ")");		
				} else if (_this.drawer.pullDirection === "LEFT") {
					$("#"+_this.drawerId).css("transform", "translateX(0px)");
				} else if (_this.drawer.pullDirection === "UP") {
					$("#"+_this.drawerId).css("transform", "translateY(0px)");
				} else if (_this.drawer.pullDirection === "DOWN") {
					$("#"+_this.drawerId).css("transform", "translateY(-" + _this.drawer.height + ")");
				};

				var $drawer_content_mask = $("#"+_this.maskId);
				$drawer_content_mask.css("visibility","hidden");
			});
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'drawerWidget' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'drawerWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;

		var options = {};

		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};
		
		options.containerId = containerId;

		if( config ){
			options.config = config;

			if( config.directory ){
				options.dispatchService = config.directory.dispatchService;
			};
		};

		new DrawerWidget(options);
	};
};

//--------------------------------------------------------------------------
$n2.widgetDrawer = {
	DrawerWidget: DrawerWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
