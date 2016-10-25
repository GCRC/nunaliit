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

//--------------------------------------------------------------------------
var MapAutoInitialBoundsCouchDb = $n2.Class({
	atlasDesign: null,
	
	documentSource: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: null
			,documentSource: null
		},opts_);
		
		this.atlasDesign = opts.atlasDesign;
		this.documentSource = opts.documentSource;
	},
	
	computeInitialBounds: function(opts_){
		var opts = $n2.extend({
			mapOptions: null
			,initialBounds: null
			,onSuccess: function(bounds, srsName){}
			,onError: function(err){}
		},opts_);
		
		var mapOptions = opts.mapOptions;
		var initialBounds = opts.initialBounds;
		var documentSource = this.documentSource;
		
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
			if( mapOptions.mapCoordinateSpecifications.srsName !== 'EPSG:4326' ){
				var userProj = new OpenLayers.Projection(mapOptions.mapCoordinateSpecifications.srsName);
				var dbProj = new OpenLayers.Projection('EPSG:4326');
				layerInitialBounds.transform(dbProj,userProj);
			};
			
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
	if( 'mapAutoInitialBoundsCouchDb' === m.instanceConfiguration.type ){
		var config = getCurrentConfiguration(dispatcher);
		
		var opts = $n2.extend({},m.instanceConfiguration);
		
		if( config ){
			opts.atlasDesign = config.atlasDesign;
			opts.documentSource = config.documentSource;
		};
		
		m.instance = new MapAutoInitialBoundsCouchDb(opts);
	};
};

//--------------------------------------------------------------------------
$n2.mapInitialBounds = {
	handleInstanceCreate: handleInstanceCreate
	,MapAutoInitialBoundsCouchDb: MapAutoInitialBoundsCouchDb
};

})(nunaliit2);
