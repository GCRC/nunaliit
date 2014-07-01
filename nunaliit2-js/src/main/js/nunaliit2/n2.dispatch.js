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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

// *******************************************************
var Dispatcher = $n2.Class({
	
	options: null
	
	,listeners: null
	
	,handles: null
	
	,dispatching: null
	
	,queue: null

	,initialize: function(options_){
		this.options = $n2.extend({
			logging: false
			,loggingIncludesMessage: false
		},options_);
		
		this.listeners = {};
		this.handles = {};
		this.dispatching = false;
		this.queue = [];
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
		if( typeof(handle) === 'string' ){
			handle = this.getHandle(handle);
		};
		if( !this.listeners[type] ){
			this.listeners[type] = [];
		};
		var address = {
			type: type
			,id: $n2.getUniqueId()
		};
		this.listeners[type].push({
			handle: handle
			,fn: l
			,address: address
		});

		handle.receives[type] = true;
		
		return address;
	}
	
	,deregister: function(address){
		if( address ){
			var type = address.type;
			var id = address.id;
			if( type && id ){
				var list = this.listeners[type];
				if( list ){
					var index = -1;
					for(var i=0,e=list.length; i<e; ++i){
						var l = list[i];
						if( l.address && l.address.id === id ){
							index = i;
							break;
						};
					};
					
					if( index >= 0 ){
						this.listeners[type].splice(index,1);
					};
				};
			};
		};
	}
	
	/*
	 * Returns true if any listener is registered for the
	 * given event type. 
	 */
	,isEventTypeRegistered: function(type){
		var listeners = this.listeners[type];
		if( listeners && listeners.length > 0 ) {
			return true;
		};
		return false;
	}
	
	,send: function(handle, m){
		
		if( typeof(handle) === 'string' ){
			handle = this.getHandle(handle);
		};
		
		if( this.dispatching ) {
			// Already dispatching a message, put this one in queue
			this.queue.push({
				h: handle
				,m: m
			});
		} else {
			// Send now
			this._sendImmediate(handle, m);
			
			// Deal with items in queue
			while(this.queue.length > 0){
				var i = this.queue.splice(0,1)[0];
				this._sendImmediate(i.h, i.m);
			};
		};
	}
	
	,_sendImmediate: function(h, m) {
		var logging = this.options.logging;
		var loggingIncludesMessage = this.options.loggingIncludesMessage;

		var t = m.type;

		// Remember that this message is sent by this handle
		h.sends[t] = true;

		this.dispatching = true;
		var listeners = this.listeners[t];
		if( listeners ) {
			for(var i=0,e=listeners.length; i<e; ++i){
				var l = listeners[i];
				
				if( logging ){
					if( loggingIncludesMessage ) {
						$n2.log(''+h.name+' >'+t+'> '+l.handle.name,m);
					} else {
						$n2.log(''+h.name+' >'+t+'> '+l.handle.name);
					};
				};
				
				try {
					l.fn(m, l.address, this);
				} catch(e) {
					$n2.log('Error while dispatching: '+e);
					if( e.stack ) {
						$n2.log('Stack',e.stack);
					};
				};
			};
		} else if( typeof listeners === 'undefined' ){
			// Keep track of events sent, even if none is listening
			listeners = [];
			this.listeners[t] = listeners;
		};
		
		if( !listeners || listeners.length < 1 ){
			if( logging ){
				if( loggingIncludesMessage ) {
					$n2.log(''+h.name+' >'+t+' not observed',m);
				} else {
					$n2.log(''+h.name+' >'+t+' not observed');
				};
			};
		};
		
		this.dispatching = false;
	}
	
	/**
	 * A synchronous call is like a function call without a pre-defined
	 * receiver defined. Therefore, the recipient of a synchronous call can
	 * store the answer on the message itself.
	 */
	,synchronousCall: function(handle, m){
		
		if( typeof(handle) === 'string' ){
			handle = this.getHandle(handle);
		};
		
		// Send right away
		var previous = this.dispatching;
		this._sendImmediate(handle, m);
		this.dispatching = previous;
		
		// Deal with items that were put in queue during synchronous call
		if( !previous ) {
			while(this.queue.length > 0){
				var i = this.queue.splice(0,1)[0];
				this._sendImmediate(i.h, i.m);
			};
		};
	}
});

//*******************************************************
$n2.dispatch = {
	Dispatcher: Dispatcher
};

})(jQuery,nunaliit2);
