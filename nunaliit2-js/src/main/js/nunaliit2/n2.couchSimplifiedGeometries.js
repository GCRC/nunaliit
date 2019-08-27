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

;(function($,$n2){
"use strict";

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchSimplifiedGeometry';
	
//*******************************************************
var SimplifiedGeometryService = $n2.Class({

	url: null,

	dispatchService: null,
	
	customService: null,
	
	documentCache: null,
	
	dbName: null,

	dbProjection: null,

	pendingRequests: null,

	/*
	 * Boolean. True when communicating with server
	 */
	sendingRequests: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,dispatchService: null
			,customService: null
			,indexedDbService: null
			,dbName: null
		},opts_);
		
		var _this = this;

		this.url = opts.url;
		this.dispatchService = opts.dispatchService;
		this.customService = opts.customService;
		this.dbName = opts.dbName;

		if( opts.indexedDbService ){
			this.documentCache = opts.indexedDbService.getDocumentCache();
		};
		
		this.sendingRequests = false;
		this.pendingRequests = {};
		
		this.dbProjection = null;
		if( typeof OpenLayers !== 'undefined' && OpenLayers.Projection ){
			this.dbProjection = new OpenLayers.Projection('EPSG:4326');
		};
		
		if( this.dispatchService ){
			var f = function(m, address, dispatchService){
				_this._handleDispatch(m, address, dispatchService);
			};
			
			this.dispatchService.register(DH, 'simplifiedGeometryRequest', f);
		};
	},
	
	_handleDispatch: function(m, address, dispatchService){
		if( 'simplifiedGeometryRequest' === m.type ){
			var requesterId = m.requester;
			// Structure for the requests:
			// {
			//    id: <string - docId>
			//    ,attName: <string - attachment name>
			// }
			if( !$n2.isArray(m.geometriesRequested) ){
				throw new Error('Event simplifiedGeometryRequest should have an array for "geometriesRequested"');
			};
			m.geometriesRequested.forEach(function(geometryRequest){
				if( typeof geometryRequest !== 'object' ){
					throw new Error('In event simplifiedGeometryRequest, geometriesRequested[*] should be an object');
				};
				if( typeof geometryRequest.id !== 'string' ){
					throw new Error('In event simplifiedGeometryRequest, geometriesRequested[*].id should be a string');
				};
				if( typeof geometryRequest.attName !== 'string' ){
					throw new Error('In event simplifiedGeometryRequest, geometriesRequested[*].attName should be a string');
				};
			});
			this._handleRequest(requesterId, m.geometriesRequested);
		};
	},
	
	_handleRequest: function(requesterId, geometriesRequested){
		this.pendingRequests[requesterId] = geometriesRequested;
		
		var count = 0;
		for(var id in this.pendingRequests){
			count += this.pendingRequests[id].length;
		};
		//$n2.log('Pending simplified geometry requests: '+count);
		
		this._sendRequests();
	},
		
	_sendRequests: function(){
		var _this = this;
		
		var outstandingRequests;
		var serverRequests;
		var cacheResults;
		
		if( this.sendingRequests ) return;

		this.sendingRequests = true;
		
		next();

		// This function turns the pending requests into an array of requests
		// stored in "outstandingRequests"
		function next(){
			var requested = {};
			outstandingRequests = [];
			
			for(var id in _this.pendingRequests){
				var geomRequests = _this.pendingRequests[id];
				
				for(var i=0,e=geomRequests.length; i<e; ++i){
					var geomRequest = geomRequests[i];
					
					var attNames = requested[geomRequest.id];
					if( !attNames ){
						attNames = {};
						requested[geomRequest.id] = attNames;
					};

					if( attNames[geomRequest.attName] ){
						// Already in this request
					} else {
						attNames[geomRequest.attName] = true;
						
						var geometryRequest = {
							id: geomRequest.id
							,attName: geomRequest.attName
						};
						
						outstandingRequests.push(geometryRequest);
					};
				};
			};
			
			if( outstandingRequests.length <= 0 ){
				// Nothing left to do
				_this.sendingRequests = false;

			} else {
				if( _this.documentCache && _this.dbName ){
					serverRequests = [];
					cacheResults = [];
					checkDocumentCache();
				} else {
					// Fallback on server
					serverRequests = outstandingRequests;
					processServerRequests();
				};
			};
		};
		
		// This function checks the document cache for the requests. It consumes the requests
		// from outstandingRequests and populates serverRequests (destined for the remote
		// server) and cacheResults with already known attachments
		function checkDocumentCache(){
			if( outstandingRequests.length <= 0 || serverRequests.length >= 100 ){
				// Clean up requests pending
				_this._cleanUpPendingRequests(cacheResults);

				// Done
				if( cacheResults.length > 0 ){
					_this.dispatchService.send(DH,{
						type: 'simplifiedGeometryReport'
						,simplifiedGeometries: cacheResults
					});
					
					cacheResults = [];
				};
				
				// Continue sending requests to the server
				processServerRequests();

			} else {
				var request = outstandingRequests.shift();
				
				_this.documentCache.getAttachment({
					dbName: _this.dbName
					,docId: request.id
					,attName: request.attName
					,onSuccess: function(att, rev){
						if( att ){
							var simplifiedGeometry = {
		        				id: request.id
		        				,rev: rev
		        				,attName: request.attName
		        				,wkt: att
							};

							if( _this.dbProjection ){
		        				simplifiedGeometry.proj = _this.dbProjection;
		        			};
							
		        			cacheResults.push(simplifiedGeometry);
							
						} else {
							// Not in cache. Request to server
							serverRequests.push(request);
						};

						// Go to next one
						checkDocumentCache();
					}
					,onError: function(err){
						// Problem accessing the cache... send to server
						serverRequests.push(request);
						
						checkDocumentCache();
					}
				});
			};
		};

		function processServerRequests(){
			var serverRequest = {
				geometryRequests: serverRequests
			};
			
			// Cut of to 100 to make the request of a manageable size
			if( serverRequest.geometryRequests.length > 100 ){
				serverRequest.geometryRequests = serverRequest.geometryRequests.slice(0,100);
			};

			// sizeLimit
			if( _this.customService ){
				var sizeLimit = _this.customService.getOption('simplifiedGeometriesSizeLimit');
				if( typeof sizeLimit === 'number' ){
					serverRequest.sizeLimit = sizeLimit;
				};
			};

			// timeLimit
			if( _this.customService ){
				var timeLimit = _this.customService.getOption('simplifiedGeometriesTimeLimit');
				if( typeof timeLimit === 'number' ){
					serverRequest.timeLimit = timeLimit;
				};
			};
			
			if( serverRequest.geometryRequests.length > 0 ){
				$.ajax({
			    	url: _this.url + 'getAttachments'
			    	,type: 'post'
			    	,async: true
			    	,data: JSON.stringify(serverRequest)
			    	,contentType: 'application/json'
			    	,dataType: 'json'
			    	,success: function(jsonResp) {
			    		if( jsonResp && jsonResp.geometries ) {
			    			receiveSimplifiedGeometries(jsonResp.geometries);
			    		} else {
			    			// Did not receive anything
			    			next();
			    		};
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						$n2.log('Unable to get simplified geometries',serverRequest);
						
						// Remove one request
						var id = undefined;
						for(id in _this.pendingRequests){
							break;
						};
						if( id ){
							delete _this.pendingRequests[id];
						};
						
						next();
			    	}
				});
			} else {
				next();
			};
		};
		
		function receiveSimplifiedGeometries(geometries){
			var simplifiedGeometries = [];
			for(var i=0,e=geometries.length; i<e; ++i){
				var geomResp = geometries[i];
				
				if( geomResp.att && geomResp.att.length > 0 ){
	    			var simplifiedGeometry = {
        				id: geomResp.id
        				,rev: geomResp.rev
        				,attName: geomResp.attName
        				,wkt: geomResp.att
        			};
        			
        			if( _this.dbProjection ){
        				simplifiedGeometry.proj = _this.dbProjection;
        			};
        			
        			simplifiedGeometries.push(simplifiedGeometry);
				};
			};
			
			// Cache simplified geometries with indexed db service
			if( _this.dbName && _this.documentCache ){
				var changes = [];
				geometries.forEach(function(geomResp){
					var change = {
						dbName: _this.dbName
        				,id: geomResp.id
        				,rev: geomResp.rev
        				,attachments: {}
					};
					change.attachments[geomResp.attName] = geomResp.att;
					changes.push(change);
				});
				_this.documentCache.performChanges(changes);
			};
			
			// Clean up requests pending
			_this._cleanUpPendingRequests(simplifiedGeometries);
			
			if( simplifiedGeometries.length > 0 ){
				_this.dispatchService.send(DH,{
					type: 'simplifiedGeometryReport'
					,simplifiedGeometries: simplifiedGeometries
				});
			};
			
			next();
		};
	},
	
	_cleanUpPendingRequests: function(simplifiedGeometries){
		// Make a map of what we have received
		var received = {};
		simplifiedGeometries.forEach(function(simplifiedGeometry){
			var docId = simplifiedGeometry.id;
			var attName = simplifiedGeometry.attName;

			var attNames = received[docId];
			if( !attNames ){
				attNames = {};
				received[docId] = attNames;
			};

			attNames[attName] = true;
		});

		// Clean up pending requests based on responses
		for(var requesterId in this.pendingRequests){
			var currentRequests = this.pendingRequests[requesterId];
			var pendingRequests = [];
			currentRequests.forEach(function(r){
				if( received[r.id] && received[r.id][r.attName] ){
					// No longer pending
				} else {
					pendingRequests.push(r);
				};
			});
			
			this.pendingRequests[requesterId] = pendingRequests;
		};
	}
});

//*******************************************************
$n2.couchSimplifiedGeometries = {
	Service: SimplifiedGeometryService	
};

})(jQuery,nunaliit2);
