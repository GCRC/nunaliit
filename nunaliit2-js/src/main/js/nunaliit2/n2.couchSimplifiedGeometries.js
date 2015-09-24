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
		},opts_);
		
		var _this = this;

		this.url = opts.url;
		this.dispatchService = opts.dispatchService;
		this.customService = opts.customService;
		
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
		
		if( this.sendingRequests ) return;

		this.sendingRequests = true;
		
		next();
		
		function next(){
			var serverRequest = {
				geometryRequests: []
			};
			var requested = {};
			var requestCount = 0;
			
			for(var id in _this.pendingRequests){
				var geomRequests = _this.pendingRequests[id];
				
				for(var i=0,e=geomRequests.length; i<e && requestCount < 100; ++i){
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
						
						serverRequest.geometryRequests.push(geometryRequest);
						
						++requestCount;
					};
				};
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
			
			if( serverRequest.geometryRequests.length ){
				processServerRequest(serverRequest);
				
			} else {
				_this.sendingRequests = false;
			};
		};

		function processServerRequest(serverRequest){
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
		};
		
		function receiveSimplifiedGeometries(geometries){
			var simplifiedGeometries = [];
			var received = {};
			
			for(var i=0,e=geometries.length; i<e; ++i){
				var geomResp = geometries[i];
				
    			var simplifiedGeometry = {
    				id: geomResp.id
    				,attName: geomResp.attName
    				,wkt: geomResp.att
    			};
    			
    			if( _this.dbProjection ){
    				simplifiedGeometry.proj = _this.dbProjection;
    			};
    			
    			simplifiedGeometries.push(simplifiedGeometry);
    			
    			var attNames = received[geomResp.id];
    			if( !attNames ){
    				attNames = {};
    				received[geomResp.id] = attNames;
    			};
    			attNames[geomResp.attName] = true;
			};
			
			// Clean up requests pending
			for(var requesterId in _this.pendingRequests){
				var currentRequests = _this.pendingRequests[requesterId];
				var pendingRequests = [];
				for(var i=0,e=currentRequests.length; i<e; ++i){
					var r = currentRequests[i];
					if( received[r.id] && received[r.id][r.attName] ){
						// No longer pending
					} else {
						pendingRequests.push(r);
					};
				};
				
				_this.pendingRequests[requesterId] = pendingRequests;
			};
			
			if( simplifiedGeometries.length > 0 ){
				_this.dispatchService.send(DH,{
					type: 'simplifiedGeometryReport'
					,simplifiedGeometries: simplifiedGeometries
				});
			};
			
			next();
		};
	}
});

//*******************************************************
$n2.couchSimplifiedGeometries = {
	Service: SimplifiedGeometryService	
};

})(jQuery,nunaliit2);
