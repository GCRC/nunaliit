/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.widgetMapWait'
 ;

//--------------------------------------------------------------------------
var WaitWidget = $n2.Class({
	
	dispatchService: null,
	
	elemId: null,
	
	/*
	   Dictionary, by requester identifier, of waiting objects (dictionary). Each dictionary
	   is based on the 'name' of what is waited on. Finally, each
	   waiting object has the following structure
	   {
	      count: <integer, total number of items we are waiting for>
	      ,name: <string, represents what is waited on>
	      ,label: <string or localized string, name of what we are waiting for>
	   }
	 */
	waitingByRequesterId: null,
	
	showNames: null,
	
	refreshIntervalInMs: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			
			// From configuration
			,showNames: null
			,refreshIntervalInMs: null
		},opts_);
		
		var _this = this;
		
		this.waitingByRequesterId = {};
		this.showNames = false;

		if( typeof opts.showNames === 'boolean' ){
			this.showNames = opts.showNames;
		};

		if( typeof opts.refreshIntervalInMs === 'number' ){
			this.refreshIntervalInMs = opts.refreshIntervalInMs;
		} else {
			this.refreshIntervalInMs = 300;
		};
		
		this.dispatchService = opts.dispatchService;
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH, 'waitReport', fn);
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2wait')
			.appendTo($container);
		
		this._display();
		
		$n2.log('WaitWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	getCount: function(){
		var count = 0;
		
		for(var requesterId in this.waitingByRequesterId){
			var waitObjects = this.waitingByRequesterId[requesterId];
			for(var name in waitObjects){
				var waitObject = waitObjects[name];
				count += waitObject.count;
			};
		};
		
		return count;
	},
	
	_displayNames: function($names){
		var infoByName = {};
		
		// Organize by name
		for(var requesterId in this.waitingByRequesterId){
			var waitObjects = this.waitingByRequesterId[requesterId];
			for(var name in waitObjects){
				var waitObject = waitObjects[name];
				if( waitObject.count > 0 ){
					var info = infoByName[name];
					if( !info ){
						info = {
							name: name
							,label: waitObject.label
							,count: 0
						};
						infoByName[name] = info;
					};
					info.count += waitObject.count;
				};
			};
		};
		
		// Sort by label
		var infos = [];
		for(var name in infoByName){
			infos.push( infoByName[name] );
		};
		infos.sort(function(a,b){
			if( a.label === b.label ) return 0;
			if( a.label < b.label ) return -1;
			if( a.label > b.label ) return 1;
			return 0;
		});
		
		// Display
		for(var i=0,e=infos.length; i<e; ++i){
			var info = infos[i];
			var $name = $('<div>')
				.addClass('n2_wait_name')
				.appendTo($names);
			$('<span>')
				.addClass('n2_wait_name_label')
				.text( _loc(info.label) )
				.appendTo($name);
			$('<span>')
				.addClass('n2_wait_name_count')
				.text( '' + info.count )
				.appendTo($name);
		};
	},
	
	_display: function(){
		var _this = this;
		
		var $elem = this._getElem();
		if( $elem.hasClass('n2wait_showing') ){
			// Already showing
		} else {
			displayTask();
		};
		
		function displayTask(){
			var $elem = _this._getElem()
				.empty();

			var count = _this.getCount();
			if( count > 0 ){
				$elem
					.show()
					.addClass('n2wait_showing');
				
				if( _this.showNames ){
					var $names = $('<div>')
						.addClass('n2wait_names')
						.appendTo($elem);
					
					_this._displayNames($names);
				};
				
				$('<div>')
					.addClass('olkit_wait')
					.appendTo($elem);
				
				setTimeout(displayTask, _this.refreshIntervalInMs); // Reschedule
				
			} else {
				$elem
					.hide()
					.removeClass('n2wait_showing');
			};
		};
	},

	_handle: function(m, addr, dispatcher){
		if( 'waitReport' === m.type ){
			var requesterId = m.requester;
			var name = m.name;
			var count = m.count;
			var label = m.label;
			if( !label ){
				label = name;
			};
			
			if( typeof requesterId === 'string'
			 && typeof name === 'string' 
			 && typeof count === 'number' ){
				// Insert information
				var waitObjects = this.waitingByRequesterId[requesterId];
				if( !waitObjects ){
					waitObjects = {};
					this.waitingByRequesterId[requesterId] = waitObjects;
				};
				
				var waitObject = waitObjects[name];
				if( !waitObject ){
					waitObject = {
						name: name
						,label: label
					};
					waitObjects[name] = waitObject;
				};
				
				waitObject.count = count;
				
				// Refresh
				this._display();
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'wait' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'wait' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var opName in widgetOptions){
				options[opName] = widgetOptions[opName];
			};
		};

		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		new WaitWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetWait = {
	WaitWidget: WaitWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
