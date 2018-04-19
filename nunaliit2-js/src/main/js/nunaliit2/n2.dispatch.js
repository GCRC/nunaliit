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
*/
;(function($n2){
"use strict";

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var HANDLEMARKER = {}
,ADDRESSMARKER = {}
;

// *******************************************************
/**
 * This is a service that connects components via an event or messaging system.
 * The dispatch system supports two types of events or messages:
 * - asynchronous events
 * - synchronous messages
 * 
 * An event is sent using the sent() function. All events are distributed in the
 * order in which they were received. All recipients registered for an event will
 * be given the opportunity to accept the event before the next event is processed.
 * Events are asynchronous, therefore the sender of the event can not predict when
 * the event will be completely processed. Therefore, an event sender can not expect
 * a reply unless it comes in the form of a separate event.
 * 
 * A synchronous message is sent using the syncrhonousCall() function. Unlike events,
 * synchronous messages are delivered immediately, before any events if any are in queue.
 * All recipients of a synchronous message are called before the function synchronousCall()
 * returns. Therefore, the reply to a synchronous call can be saved on the message to be
 * consumed by the sender. A synchronous message is similar to a remote function call.
 * 
 * The information transmitted by asynchronous events and synchronous messages are encoded
 * in a message structure. The message structure is a Javascript object with a "type"
 * attribute:
 * {
 *    "type": "<a message type>"
 * } 
 * 
 * The message type is used to route the events and messages to the appropriate recipients.
 * 
 * In a message structure, any attribute other than "type" is defined by the message type.
 * 
 */
var Dispatcher = $n2.Class({
	
	logging: null,
	
	loggingIncludesMessage: null,
	
	loggingHandleMap: null,

	loggingTypeMap: null,
	
	listeners: null,
	
	handles: null,
	
	dispatching: null,
	
	queue: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			logging: false
			,loggingIncludesMessage: false
			,loggingHandles: null
			,loggingTypes: null
		},opts_);
		
		var _this = this;
		
		this.logging = opts.logging;
		this.loggingIncludesMessage = opts.loggingIncludesMessage;
		
		this.loggingHandleMap = {};
		if( $n2.isArray(opts.loggingHandles) ){
			opts.loggingHandles.forEach(function(handle){
				if( typeof handle === 'string' ){
					_this.loggingHandleMap[handle] = true;
				};
			});
		};
		
		this.loggingTypeMap = {};
		if( $n2.isArray(opts.loggingTypes) ){
			opts.loggingTypes.forEach(function(type){
				if( typeof type === 'string' ){
					_this.loggingTypeMap[type] = true;
				};
			});
		};
		
		this.listeners = {};
		this.handles = {};
		this.dispatching = false;
		this.queue = [];

	},

	/**
	 * Create a handle based on a string. The string should be unique to help
	 * debugging.
	 */
	getHandle: function(name){
		var h = this.handles[name];
		if( !h ) {
			h = {
				dispatch: true
				,name: name
				,receives: {}
				,sends: {}
				,_marker: HANDLEMARKER
			};
			this.handles[name] = h;
		};
		return h;
	},
	
	isHandle: function(h){
		if( typeof h !== 'object' ) return false;
		
		if( h._marker === HANDLEMARKER ){
			return true;
		};
		
		return false;
	},
	
	isAddress: function(addr){
		if( typeof addr !== 'object' ) return false;
		
		if( addr._marker === ADDRESSMARKER ){
			return true;
		};
		
		return false;
	},

	/**
	 * Registers a recipient to receive events and messages of a specific type.
	 * @param handle A handle or a string identifying the recipient.
	 * @param type A string specifying which message type to receive
	 * @param l A function which is called back with the message when it is received. The
	 *          signature for this function is function(message, address, dispatcher)
	 * @return An address (object structure) that can be used in the deregister() function
	 */
	register: function(handle, type, l){
		if( typeof handle === 'string' ){
			handle = this.getHandle(handle);
		};
		if( !this.isHandle(handle) ){
			throw new Error('DispatchService.register: invalid handle');
		};
		if( typeof type !== 'string' ){
			throw new Error('DispatchService.register: type must be a string');
		};
		if( typeof l !== 'function' ){
			throw new Error('DispatchService.register must provide a function');
		};
		
		if( !this.listeners[type] ){
			this.listeners[type] = [];
		};
		var address = {
			type: type
			,id: $n2.getUniqueId()
			,_marker: ADDRESSMARKER
		};
		this.listeners[type].push({
			handle: handle
			,fn: l
			,address: address
		});

		handle.receives[type] = true;
		
		return address;
	},
	
	/**
	 * Removes a registration based on an address.
	 * @param address An address previously obtained using register() or when
	 *                recipient is called back.
	 */
	deregister: function(address){
		if( this.isAddress(address) ){
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
		} else {
			throw new Error('DispatchService.deregister: invalid address');
		};
	},
	
	/**
	 * Returns true if any listener is registered for the
	 * given event type.
	 * @param type Message type that is seeked
	 * @return True is anyone has registered for the given message type
	 */
	isEventTypeRegistered: function(type){
		var listeners = this.listeners[type];
		if( listeners && listeners.length > 0 ) {
			return true;
		};
		return false;
	},
	
	/**
	 * Sends an asynchronous event.
	 * @param handle Sender's handle or a string. This helps in debugging of dispatcher.
	 * @param m Message structure to be sent to all recipients registered with the message type.
	 */
	send: function(handle, m){
		
		m.time = Date.now();
		
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
	},
	
	_sendImmediate: function(h, m) {
		var _this = this;
		
		var logging = false;
		if( this.logging ){
			logging = true;
		} else if( this.loggingHandleMap[h.name] ){
			logging = true;
		} else if( this.loggingTypeMap[m.type] ){
			logging = true;
		};
		var loggingIncludesMessage = this.loggingIncludesMessage;

		var t = m.type;

		// Remember that this message is sent by this handle
		h.sends[t] = true;

		this.dispatching = true;
		var listeners = this.listeners[t];
		if( listeners ) {
			var copy = listeners.slice(0); // make copy to handle deregister during processing
			for(var i=0,e=copy.length; i<e; ++i){
				var l = copy[i];
				
				if( logging ){
					var timeStr = '';
					if( m.time ){
						timeStr = '' + (m.time/1000)+' ';
					};
					
					if( loggingIncludesMessage ) {
						$n2.log(timeStr+h.name+' >'+t+'> '+l.handle.name,m);
					} else {
						$n2.log(timeStr+h.name+' >'+t+'> '+l.handle.name);
					};
				};
				
				try {
					l.fn(m, l.address, this);
				} catch(e) {
					_this._reportError(e,m);
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
	},
	
	_reportError: function(e,m){
		$n2.log('Error while dispatching '+m.type+': '+e);
		if( e.stack ) {
			$n2.log('Stack: '+e.stack);
		};
	},
	
	/**
	 * Sends a synchronous message to all recipients that have registered for the
	 * message type.
	 * @param handle Sender's handle or a string. This helps in debugging of dispatcher.
	 * @param m Message structure to be sent to all recipients registered with the message type.
	 */
	synchronousCall: function(handle, m){
		
		m.time = Date.now();

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

})(nunaliit2);
