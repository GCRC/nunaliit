/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetResizingContainer'
 ;

//--------------------------------------------------------------------------
var ResizingWidgetContainer = $n2.Class('ResizingWidgetContainer',{

	dispatchService: null,

	config: null,

	elemId: null,

	anchor: null,

	resizeClasses: null,

	intervalId: null,
	
	lastDimensionValue: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,config: null
			,widgets: null
			,addClasses: null
			,anchor: 'bottom'
			,resizeClasses: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.config = opts.config;
		this.anchor = opts.anchor;
		
		if( $n2.isArray(opts.resizeClasses) ){
			this.resizeClasses = [];
			opts.resizeClasses.forEach(function(resizeClass){
				if( typeof resizeClass === 'string' ){
					_this.resizeClasses.push(resizeClass);
				};
			});
		};
		
		this.lastDimensionValue = -1;

		// Find out which widget is available
		var availableWidgets = [];
		if( $n2.isArray(opts.widgets) && this.dispatchService ){
			opts.widgets.forEach(function(widgetInfo){
				var widgetHandlerAvailable = false;
				if( widgetInfo && widgetInfo.widgetType ) {
					var msg = {
						type: 'widgetIsTypeAvailable'
						,widgetType: widgetInfo.widgetType
						,widgetOptions: widgetInfo
						,isAvailable: false
					};
					
					_this.dispatchService.synchronousCall(DH, msg);
					
					if( msg.isAvailable ){
						widgetHandlerAvailable = true;
					};
				};
				if( widgetInfo && !widgetHandlerAvailable ){
					$n2.log('Widget handler not found for type: '+widgetInfo.widgetType);
				} else {
					availableWidgets.push(widgetInfo);
				};
			});
		};
		
		// If at least one widget is available, then build container
		if( availableWidgets.length > 0 ){

			// Get container
			var containerId = opts.containerId;
			if( !containerId ){
				throw new Error('containerId must be specified');
			};
			var $container = $('#'+containerId);
			
			this.elemId = $n2.getUniqueId();

			var $widget = $('<div>')
				.attr('id',this.elemId)
				.addClass('n2widgetResizingContainer n2widgetContainer')
				.css({
					'position':'absolute'
					,'border': 'none'
					,'margin': '0'
					,'padding': '0'
				})
				.appendTo($container);
			
			if( 'bottom' === this.anchor ){
				$widget.css({
					'bottom': '0'
				});

			} else if( 'top' === this.anchor ){
				$widget.css({
					'top': '0'
				});

			} else if( 'left' === this.anchor ){
				$widget.css({
					'left': '0'
				});

			} else if( 'right' === this.anchor ){
				$widget.css({
					'right': '0'
				});
			} else {
				throw new Error('Unknown anchor: '+this.anchor);
			};
			
			// Add classes
			if( typeof opts.addClasses === 'string' ){
				$widget.addClass(opts.addClasses);
			} else if( $n2.isArray(opts.addClasses) ){
				opts.addClasses.forEach(function(className){
					if( typeof className === 'string' ){
						$widget.addClass(className);
					};
				});
			};

			// Add contained widgets
			availableWidgets.forEach(function(widgetInfo){
				_this.dispatchService.send(DH,{
					type: 'widgetDisplay'
					,widgetType: widgetInfo.widgetType
					,widgetOptions: widgetInfo
					,containerId: _this.elemId
					,config: _this.config
				});
			});
			
			this.intervalId = window.setInterval(function(){
				_this._refreshSize();
			},300);
			
			$n2.log(this._classname, this);

		} else {
			$n2.log(this._classname+': Not drawing because container is empty');
		};
	},

	_getElem: function(){
		return $('#'+this.elemId);
	},

    _refreshSize: function(){
    	var _this = this;
    	
    	var $elem = this._getElem();
    	if( $elem.length < 1 ){
    		window.clearInterval(this.intervalId);
    		return;
    	};
    	
		var currentDimensionValue;
		if( 'bottom' === this.anchor ){
			currentDimensionValue = $elem.height();
		} else if( 'top' === this.anchor ){
			currentDimensionValue = $elem.height();
		} else if( 'left' === this.anchor ){
			currentDimensionValue = $elem.width();
		} else if( 'right' === this.anchor ){
			currentDimensionValue = $elem.width();
		};
		
		if( currentDimensionValue !== this.lastDimensionValue ){
			this.lastDimensionValue = currentDimensionValue;
		
			if( $n2.isArray(this.resizeClasses) ){
				this.resizeClasses.forEach(function(resizeClass){
					if( 'bottom' === _this.anchor ){
						$('.'+resizeClass).css('bottom',currentDimensionValue+'px');
					} else if( 'top' === _this.anchor ){
						$('.'+resizeClass).css('top',currentDimensionValue+'px');
					} else if( 'left' === _this.anchor ){
						$('.'+resizeClass).css('left',currentDimensionValue+'px');
					} else if( 'right' === _this.anchor ){
						$('.'+resizeClass).css('right',currentDimensionValue+'px');
					};
				});
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'resizingWidgetContainer' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'resizingWidgetContainer' ){
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
		
		new ResizingWidgetContainer(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetResizingContainer = {
	ResizingWidgetContainer: ResizingWidgetContainer
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
