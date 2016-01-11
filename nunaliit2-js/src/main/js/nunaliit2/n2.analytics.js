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
;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.analytics'
;

// *******************************************************
/**
 * This service registers to the dispatcher and sends the appropriate
 * events to Google Analytics if it is installed.
 */
var AnalyticsService = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'start',f);
			this.dispatchService.register(DH,'selected',f);
		};
	},
	
	_sendEvent: function(action, value){
		if( typeof ga === 'function' ){
			var event = {
				hitType: 'event'
				,eventCategory: 'nunaliit'
				,eventAction: action
			};
			
			if( typeof value === 'number' ){
				event.eventValue = value;
			} else if( typeof value === 'string' ){
				event.eventLabel = value;
			};
			
			ga('send',event);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'start' === m.type ){
			// Record module
			var msg = {
				type: 'moduleGetCurrent'	
			};
			this.dispatchService.synchronousCall(DH,msg);
			if( msg.moduleId ){
				this._sendEvent('module', msg.moduleId);
			};

		} else if( 'selected' === m.type ) {
			if( m.docId ){
				this._sendEvent('selected', m.docId);

			} else if( m.doc && m.doc._id ){
				this._sendEvent('selected', m.doc._id);
			};
		};
	}
});

//*******************************************************
$n2.analytics = {
	AnalyticsService: AnalyticsService
};

})(nunaliit2);
