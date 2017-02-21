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

;(function($n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.instance'
 ;

// Requires OpenLayers
if( typeof OpenLayers !== 'undefined' ) {

//--------------------------------------------------------------------------
// This instance attempts to compute the initial extent by looking up each
// couchDb overlay specified in the map options.
var MapAutoInitialBoundsCouchDbOverlays = $n2.Class({
	
	documentSource: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: null
		},opts_);
		
		this.documentSource = opts.documentSource;
	},
	
	computeInitialBounds: function(opts_){
		var opts = $n2.extend({
			mapOptions: null
			,mapInfo: null
			,initialBounds: null
			,coordinateProjection: null
			,onSuccess: function(bounds){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var mapOptions = opts.mapOptions;
		var initialBounds = opts.initialBounds;
		var documentSource = this.documentSource;
		var coordinateProjection = opts.coordinateProjection;
		
		// Loop over all layers, computing initial bounding box for
		// each
		var layerBoundingBox = null;
		var layersPending = 0;
		for(var i=0,e=mapOptions.overlays.length; i<e; ++i){
			var layerDef = mapOptions.overlays[i];
			if( layerDef.type === 'couchdb' ){
				++layersPending;
				var documentSource = layerDef.options.documentSource;
				var layerName = layerDef.options.layerName;
				documentSource.getGeographicBoundingBox({
					layerId: layerName
					,onSuccess: function(bbox){
						reportLayer(bbox);
					}
					,onError: function(errorMsg){ 
						$n2.log('Error computing bounds for layer '+layerName+': '+errorMsg); 
						reportLayer(null);
					}
				});
			};
		};
		testDone();
		
		function reportLayer(bounds){
			--layersPending;
			if( null == bounds ) {
				// ignore
			} else if( false == _this._isValidBounds(bounds) ) {
				// ignore
			} else {
				if( null == layerBoundingBox ) {
					layerBoundingBox = bounds;
				} else {
					if( layerBoundingBox[0] > bounds[0] ) layerBoundingBox[0] = bounds[0];
					if( layerBoundingBox[1] > bounds[1] ) layerBoundingBox[1] = bounds[1];
					if( layerBoundingBox[2] < bounds[2] ) layerBoundingBox[2] = bounds[2];
					if( layerBoundingBox[3] < bounds[3] ) layerBoundingBox[3] = bounds[3];
				};
			};
			testDone();
		};
		
		function testDone(){
			if( layersPending > 0 ){
				return;
			};
			
			// If nothing specified by layers, just use what the user specified
			if( null == layerBoundingBox ){
				// Nothing defined by the layers, use initial bounds
				opts.onSuccess(null);
				return;
			};
	
			// If computations from layers is invalid, use the initial bounds specified
			// by user
			if( false == _this._isValidBounds(layerBoundingBox) ) {
				$n2.log('Invalid bounding box reported for layer in database.',layerBoundingBox);
				opts.onSuccess(null);
				return;
			};
			
			// layerBoundingBox is in EPSG:4326
			// initialBounds is in the user coordinate projection
			var userInitialBounds = new OpenLayers.Bounds(
				initialBounds[0]
				,initialBounds[1]
				,initialBounds[2]
				,initialBounds[3]
			);
			var layerInitialBounds = new OpenLayers.Bounds(
				layerBoundingBox[0]
				,layerBoundingBox[1]
				,layerBoundingBox[2]
				,layerBoundingBox[3]
			);

			var dbProj = new OpenLayers.Projection('EPSG:4326');
			layerInitialBounds.transform(dbProj,coordinateProjection);
			
			if( userInitialBounds.containsBounds(layerInitialBounds) ){
				// Bounds defined by layers fit within the one specified by user.
				// Just use initial bounds (prevent too much zooming in)
				opts.onSuccess(initialBounds);
				
			} else if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() 
			 || layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
				// The bounds defined by the layers are smaller than that of the bounds
				// specified by user. Adjust size of bounds so that zoom is not too high
				
				if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() ){
					var l = userInitialBounds.getWidth()/2;
					var m = (layerInitialBounds.left+layerInitialBounds.right)/2;
					layerInitialBounds.left = m - l;
					layerInitialBounds.right = m + l;
				};
				
				if( layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
					var l = userInitialBounds.getHeight()/2;
					var m = (layerInitialBounds.bottom+layerInitialBounds.top)/2;
					layerInitialBounds.bottom = m - l;
					layerInitialBounds.top = m + l;
				};
				opts.onSuccess([
					layerInitialBounds.left
					,layerInitialBounds.bottom
					,layerInitialBounds.right
					,layerInitialBounds.top
				]);
				
			} else {
				// Use bounds computed by layers
				opts.onSuccess([
					layerInitialBounds.left
					,layerInitialBounds.bottom
					,layerInitialBounds.right
					,layerInitialBounds.top
				]);
			};
		};
	},
	
	_isValidBounds: function(bounds){
		if( !bounds.length ) return false;
		if( bounds.length < 4 ) return false;
		
		if( bounds[0] < -180 || bounds[0] > 180 ) return false;
		if( bounds[2] < -180 || bounds[2] > 180 ) return false;
		if( bounds[1] < -90 || bounds[1] > 90 ) return false;
		if( bounds[3] < -90 || bounds[3] > 90 ) return false;
		
		return true;
	}
});

//--------------------------------------------------------------------------
// This instance computes the initial extent by looking up a number of layers 
// in the CouchDb database. The layers can be specified as an array or an option
// 'allLayers' can be specified to look them all up.
var MapAutoInitialBoundsCouchDbLayers = $n2.Class({

	atlasDesign: null,

	layerIds: null,
	
	allLayers: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: null
			,layers: null
			,allLayers: null
		},opts_);
		
		var _this = this;
		
		this.atlasDesign = opts.atlasDesign;
		
		this.layerIds = [];
		if( $n2.isArray(opts.layers) ){
			opts.layers.forEach(function(layerId){
				if( typeof layerId === 'string' ){
					_this.layerIds.push(layerId);
				};
			});
		};
		
		this.allLayers = false;
		if( typeof opts.allLayers === 'boolean' ){
			this.allLayers = opts.allLayers;
		};
	},
	
	computeInitialBounds: function(opts_){
		var opts = $n2.extend({
			mapOptions: null
			,mapInfo: null
			,initialBounds: null
			,coordinateProjection: null
			,onSuccess: function(bounds){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		var mapOptions = opts.mapOptions;
		var initialBounds = opts.initialBounds;
		var documentSource = this.documentSource;
		var coordinateProjection = opts.coordinateProjection;
		
		// Query view to get bounding box
		var queryOpt = {
			viewName: 'geom-layer-bbox'
			,reduce: true
			,onSuccess: bboxLoaded
			,onError: opts.onError
		};
		
		if( this.allLayers ){
			// Do not specify anything
		} else {
			queryOpt.keys = [];
			queryOpt.group = true;
			this.layerIds.forEach(function(layerId){
				queryOpt.keys.push(layerId);
			});
		};
		
		this.atlasDesign.queryView(queryOpt);
		
		// This is called as a result of the query
		function bboxLoaded(rows){
			var layerBoundingBox = undefined;
			
			rows.forEach(function(row){
				var bounds = row.value;
				
				if( !bounds ) {
					// ignore
				} else if( false == _this._isValidBounds(bounds) ) {
					// ignore
				} else {
					if( !layerBoundingBox ) {
						layerBoundingBox = bounds;
					} else {
						if( layerBoundingBox[0] > bounds[0] ) layerBoundingBox[0] = bounds[0];
						if( layerBoundingBox[1] > bounds[1] ) layerBoundingBox[1] = bounds[1];
						if( layerBoundingBox[2] < bounds[2] ) layerBoundingBox[2] = bounds[2];
						if( layerBoundingBox[3] < bounds[3] ) layerBoundingBox[3] = bounds[3];
					};
				};
			});
			
			// If nothing specified by layers, just use what the user specified
			if( !layerBoundingBox ){
				// Nothing defined by the layers, use initial bounds
				opts.onSuccess(null);
				return;
			};
	
			// If computations from layers is invalid, use the initial bounds specified
			// by user
			if( !_this._isValidBounds(layerBoundingBox) ) {
				$n2.log('Invalid bounding box reported for layer in database.',layerBoundingBox);
				opts.onSuccess(null);
				return;
			};
			
			// layerBoundingBox is in EPSG:4326
			// initialBounds is in the user coordinate projection
			var userInitialBounds = new OpenLayers.Bounds(
				initialBounds[0]
				,initialBounds[1]
				,initialBounds[2]
				,initialBounds[3]
			);
			var layerInitialBounds = new OpenLayers.Bounds(
				layerBoundingBox[0]
				,layerBoundingBox[1]
				,layerBoundingBox[2]
				,layerBoundingBox[3]
			);

			var dbProj = new OpenLayers.Projection('EPSG:4326');
			layerInitialBounds.transform(dbProj,coordinateProjection);
			
			if( userInitialBounds.containsBounds(layerInitialBounds) ){
				// Bounds defined by layers fit within the one specified by user.
				// Just use initial bounds (prevent too much zooming in)
				opts.onSuccess(initialBounds);
				
			} else if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() 
			 || layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
				// The bounds defined by the layers are smaller than that of the bounds
				// specified by user. Adjust size of bounds so that zoom is not too high
				
				if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() ){
					var l = userInitialBounds.getWidth()/2;
					var m = (layerInitialBounds.left+layerInitialBounds.right)/2;
					layerInitialBounds.left = m - l;
					layerInitialBounds.right = m + l;
				};
				
				if( layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
					var l = userInitialBounds.getHeight()/2;
					var m = (layerInitialBounds.bottom+layerInitialBounds.top)/2;
					layerInitialBounds.bottom = m - l;
					layerInitialBounds.top = m + l;
				};
				opts.onSuccess([
					layerInitialBounds.left
					,layerInitialBounds.bottom
					,layerInitialBounds.right
					,layerInitialBounds.top
				]);
				
			} else {
				// Use bounds computed by layers
				opts.onSuccess([
					layerInitialBounds.left
					,layerInitialBounds.bottom
					,layerInitialBounds.right
					,layerInitialBounds.top
				]);
			};
		};
	},
	
	_isValidBounds: function(bounds){
		if( !bounds.length ) return false;
		if( bounds.length < 4 ) return false;
		
		if( bounds[0] < -180 || bounds[0] > 180 ) return false;
		if( bounds[2] < -180 || bounds[2] > 180 ) return false;
		if( bounds[1] < -90 || bounds[1] > 90 ) return false;
		if( bounds[3] < -90 || bounds[3] > 90 ) return false;
		
		return true;
	}
});

//--------------------------------------------------------------------------
// This instance computes the initial extent by looking up the position of
// the user based on what the browser returns for geolocation. Adjust centre
// of defined 
var MapAutoInitialBoundsCentreOnUserPosition = $n2.Class({

	adjustLatitude: null,
	
	adjustLongitude: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			adjustLatitude: true
			,adjustLongitude: true
			,_mapInfo: null
		},opts_);
		
		var _this = this;
		
		this.adjustLatitude = opts.adjustLatitude;
		this.adjustLongitude = opts.adjustLongitude;
	},
	
	computeInitialBounds: function(opts_){
		var opts = $n2.extend({
			mapOptions: null
			,mapInfo: null
			,initialBounds: null
			,coordinateProjection: null
			,onSuccess: function(bounds){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		// Check initial bounds
		if( $n2.isArray(opts.initialBounds) && opts.initialBounds.length >=4 ){
			// OK
		} else {
			$n2.logError("MapAutoInitialBoundsCentreOnUserPosition: Do not understand initial bounds", opts.initialBounds);
			opts.onSuccess(opts.initialBounds);
		};
		
		// Get user location
		if( typeof navigator !== 'undefined' ){
			if( navigator.geolocation 
			 && typeof navigator.geolocation.getCurrentPosition === 'function' ){
				navigator.geolocation.getCurrentPosition(
					function(position){
						//$n2.log("getCurrentPosition()",position);
						var myCurrentLoc;
						if( position && position.coords ){
							var lat = position.coords.latitude;
							var lng = position.coords.longitude;
							
							if( typeof lat === 'number' 
							 && typeof lng === 'number' ){
								myCurrentLoc = new OpenLayers.Geometry.Point(lng, lat);
							};
						};
						
						if( myCurrentLoc ){
							receivedCoords(myCurrentLoc);
						} else {
							$n2.logError("MapAutoInitialBoundsCentreOnUserPosition: error during getCurrentPosition(): do not understand", position);
							opts.onSuccess(opts.initialBounds);
						};
						
					},function(err){
						$n2.logError("MapAutoInitialBoundsCentreOnUserPosition: error during getCurrentPosition()",err);
						opts.onSuccess(opts.initialBounds);
					},{ // options
						
					}
				);
			} else {
				// No geolocation.getCurrentPosition()
				opts.onSuccess(opts.initialBounds);
			};
		} else {
			// No Navigator
			opts.onSuccess(opts.initialBounds);
		};
		
		function receivedCoords(myCurrentLoc){
			// The coordinates received from browser are lat/long (EPSG:4326)
			var browserProj = new OpenLayers.Projection('EPSG:4326');
			if( browserProj.getCode() !== opts.coordinateProjection.getCode() ){
				myCurrentLoc.transform(browserProj, opts.coordinateProjection);
			};
			
			var initialBounds = [
				opts.initialBounds[0]
				,opts.initialBounds[1]
				,opts.initialBounds[2]
				,opts.initialBounds[3]
			];
			
			if( _this.adjustLatitude ){
				var halfHeight = (1 * opts.initialBounds[3] - 1 * opts.initialBounds[1]) / 2;
				initialBounds[1] = myCurrentLoc.y - halfHeight;
				initialBounds[3] = myCurrentLoc.y + halfHeight;
			};

			if( _this.adjustLongitude ){
				var halfWidth = (1 * opts.initialBounds[2] - 1 * opts.initialBounds[0]) / 2;
				initialBounds[0] = myCurrentLoc.x - halfWidth;
				initialBounds[2] = myCurrentLoc.x + halfWidth;
			};
			
			opts.onSuccess(initialBounds);
		};
	}
});

//--------------------------------------------------------------------------
function getCurrentConfiguration(dispatcher){
	var config = undefined;
	
	if( dispatcher ){
		var m = {
			type: 'configurationGetCurrentSettings'
		};
		dispatcher.synchronousCall(DH,m);
		config = m.configuration;
	};

	return config;
};

//--------------------------------------------------------------------------
function handleInstanceCreate(m, addr, dispatcher){
	if( 'mapAutoInitialBoundsCouchDbOverlays' === m.instanceConfiguration.type ){
		var config = getCurrentConfiguration(dispatcher);
		
		var opts = $n2.extend({},m.instanceConfiguration);
		
		if( config ){
			opts.documentSource = config.documentSource;
		};
		
		m.instance = new MapAutoInitialBoundsCouchDbOverlays(opts);

	} else if( 'mapAutoInitialBoundsCouchDbLayers' === m.instanceConfiguration.type ){
		var config = getCurrentConfiguration(dispatcher);
		
		var opts = $n2.extend({},m.instanceConfiguration);
		
		if( config ){
			opts.atlasDesign = config.atlasDesign;
		};
		
		m.instance = new MapAutoInitialBoundsCouchDbLayers(opts);

	} else if( 'mapAutoInitialBoundsCentreOnUserPosition' === m.instanceConfiguration.type ){
		var opts = $n2.extend({},m.instanceConfiguration);
		
		m.instance = new MapAutoInitialBoundsCentreOnUserPosition(opts);
	};
};

//--------------------------------------------------------------------------
$n2.mapInitialBounds = {
	handleInstanceCreate: handleInstanceCreate
	,MapAutoInitialBoundsCouchDbOverlays: MapAutoInitialBoundsCouchDbOverlays
	,MapAutoInitialBoundsCouchDbLayers: MapAutoInitialBoundsCouchDbLayers
};

}; // OpenLayers

})(nunaliit2);
