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
 ,DH = 'n2.widgetNavigation'
 ;

//--------------------------------------------------------------------------
var NavigationWidget = $n2.Class({
	elemId: null,
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		var $elem = $(opts.elem);
		this.elemId = $n2.utils.getElementIdentifier($elem);

		if( this.dispatchService ){
			var f = function(m, addr, dispatchService){
				_this._handle(m, addr, dispatchService);
			};
			
			this.dispatchService.register(DH, 'historyReportState', f);
		};
		
		this._display();

		// Get current state
		if( this.dispatchService ){
			var m = {
				type: 'historyGetState'
			};
			this.dispatchService.synchronousCall(DH,m);
			if( m.state ){
				this._handleHistoryState(m.state);
			};
		};
		
		//$n2.log('NavigationWidget',this);
	},
	
	_display: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem
			.empty()
			.addClass('n2NavigationWidget_buttons');

		$('<div>')
			.addClass('n2NavigationWidget_button n2NavigationWidget_button_forward')
			.appendTo($elem)
			.click(function(){
				// Enable click only if forward is available
				if( $(this).hasClass('n2NavigationWidget_button_enabled') ){
					if( _this.dispatchService ){
						_this.dispatchService.send(DH,{
							type: 'historyForward'
						});
					};
				};
				return false;
			});
		$('<div>')
			.addClass('n2NavigationWidget_button n2NavigationWidget_button_home n2NavigationWidget_button_enabled')
			.appendTo($elem)
			.click(function(){
				if( _this.dispatchService ){
					_this.dispatchService.send(DH,{
						type: 'userUnselect'
					});
				};
				return false;
			});
		$('<div>')
			.addClass('n2NavigationWidget_button n2NavigationWidget_button_back')
			.appendTo($elem)
			.click(function(){
				// Enable click only if back is available
				if( $(this).hasClass('n2NavigationWidget_button_enabled') ){
					if( _this.dispatchService ){
						_this.dispatchService.send(DH,{
							type: 'historyBack'
						});
					};
				};
				return false;
			});
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_handleHistoryState: function(historyState){
		if( historyState ){
			var $elem = this._getElem();

			if( historyState.backIsAvailable ){
				$elem.addClass('n2NavigationWidget_button_enabled_back');
				$elem
					.find('.n2NavigationWidget_button_back')
					.addClass('n2NavigationWidget_button_enabled')
					.removeClass('n2NavigationWidget_button_disabled');
			} else {
				$elem.removeClass('n2NavigationWidget_button_enabled_back');
				$elem
					.find('.n2NavigationWidget_button_back')
					.addClass('n2NavigationWidget_button_disabled')
					.removeClass('n2NavigationWidget_button_enabled');
			};

			if( historyState.forwardIsAvailable ){
				$elem.addClass('n2NavigationWidget_button_enabled_forward');
				$elem
					.find('.n2NavigationWidget_button_forward')
					.addClass('n2NavigationWidget_button_enabled')
					.removeClass('n2NavigationWidget_button_disabled');
			} else {
				$elem.removeClass('n2NavigationWidget_button_enabled_forward');
				$elem
					.find('.n2NavigationWidget_button_forward')
					.addClass('n2NavigationWidget_button_disabled')
					.removeClass('n2NavigationWidget_button_enabled');
			};
		};
	},
	
	_handle: function(m, addr, dispatchService){
		var $elem = this._getElem();
		if( $elem.length < 1 ){
			// We have disappeared. Unregister from dispatcher
			dispatchService.deregister(addr);
			return;
		};
		
		if( 'historyReportState' === m.type ){
			var state = m.state;
			this._handleHistoryState(state);
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'navigation' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'navigation' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var config = m.config;
		
		var $elem = null;
		if( contentId ){
			$elem = $('#'+contentId);
		};
		if( !$elem || $elem.length < 1 ){
			$elem = $('<div>')
				.appendTo( $('#'+containerId) );
		};
		
		var options = {
			elem: $elem
		};
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		if( widgetOptions ){
			if( widgetOptions.sourceModelId ) options.sourceModelId = widgetOptions.sourceModelId;
		};
		
		new NavigationWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetNavigation = {
	NavigationWidget: NavigationWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
