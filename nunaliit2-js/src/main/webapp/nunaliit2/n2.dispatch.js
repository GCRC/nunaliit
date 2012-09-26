/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.dispatch.js 8443 2012-08-16 18:04:28Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

// *******************************************************
var Dispatcher = $n2.Class({
	
	options: null
	
	,listeners: null
	
	,handles: null

	,initialize: function(options_){
		this.options = $n2.extend({
			logging: false
		},options_);
		
		this.listeners = {};
		this.handles = {};
	}

	,getHandle: function(name){
		var h = this.handles[name];
		if( !h ) {
			h = {
				dispatch: true
				,name: name
				,receives: {}
				,sends: {}
			};
			this.handles[name] = h;
		};
		return h;
	}

	,register: function(handle, type, l){
		if( !this.listeners[type] ){
			this.listeners[type] = [];
		};
		this.listeners[type].push({
			handle: handle
			,fn: l
		});

		handle.receives[type] = true;
	}
	
	,send: function(handle, m){
		var logging = this.options.logging;
		
		var type = m.type;
		
		handle.sends[type] = true;
		
		var listeners = this.listeners[type];
		if( listeners ) {
			for(var i=0,e=listeners.length; i<e; ++i){
				var l = listeners[i];
				
				if( logging ){
					$n2.log(''+handle.name+' >'+type+'> '+l.handle.name);
				};
				
//				try {
					l.fn(m);
//				} catch(e) {
//					$n2.log('Error while dispatching: '+e);
//				};
			};
		};
	}
});

//*******************************************************
$n2.dispatch = {
	Dispatcher: Dispatcher
};

})(jQuery,nunaliit2);
