/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
,DH='n2.mapUtilities';

//=========================================================================
var MapClusterClickToZoom = $n2.Class('MapClusterClickToZoom',{

	customService: undefined,

	initialize: function(opts_){
		var opts = $n2.extend({
			customService: undefined
		},opts_);
		
		var _this = this;
	
		this.customService = opts.customService;
		
		if( this.customService ){
			this.customService.setOption('mapClusterClickCallback',$n2.mapAndControls.ZoomInClusterClickCallback);
		};
		
		$n2.log(this._classname, this);
	}
});

//=========================================================================
var MapClusterClickToMultiSelect = $n2.Class('MapClusterClickToMultiSelect',{

	customService: undefined,

	initialize: function(opts_){
		var opts = $n2.extend({
			customService: undefined
		},opts_);
		
		var _this = this;
	
		this.customService = opts.customService;
		
		if( this.customService ){
			this.customService.setOption('mapClusterClickCallback',$n2.mapAndControls.MultiSelectClusterClickCallback);
		};
		
		$n2.log(this._classname, this);
	}
});

//=========================================================================
var MapClusterClickHandler = $n2.Class('MapClusterClickHandler',{

	customService: undefined,

	minimumCountToZoom: undefined,

	minimumResolutionToZoom: undefined,

	initialize: function(opts_){
		var opts = $n2.extend({
			customService: undefined
			,minimumCountToZoom: 0
			,minimumResolutionToZoom: -1
		},opts_);
		
		var _this = this;
	
		this.customService = opts.customService;
		if( typeof opts.minimumCountToZoom === 'number' ){
			this.minimumCountToZoom = opts.minimumCountToZoom;
		} else {
			$n2.logError('MapClusterClickHandler: minimumCountToZoom must be a number');
		};
		if( typeof opts.minimumResolutionToZoom === 'number' ){
			this.minimumResolutionToZoom = opts.minimumResolutionToZoom;
		} else {
			$n2.logError('MapClusterClickHandler: minimumResolutionToZoom must be a number');
		};
		
		if( this.customService ){
			var f = function(feature, mapAndControls){
				_this._clusterClickCallback(feature, mapAndControls);
			};

			this.customService.setOption('mapClusterClickCallback',f);
		};
		
		$n2.log(this._classname, this);
	},

	_clusterClickCallback: function(feature, mapAndControls){
		var zoom = false;
		if( feature.cluster 
		 && feature.cluster.length >= this.minimumCountToZoom ) {
			zoom = true;
		};
		if( this.minimumResolutionToZoom > 0 ){
			var resolution = mapAndControls.getResolution();
			if( resolution <= this.minimumResolutionToZoom ){
				zoom = false;
			};
		};
		
		if( zoom ){
			$n2.mapAndControls.ZoomInClusterClickCallback(feature, mapAndControls);
		} else {
			$n2.mapAndControls.MultiSelectClusterClickCallback(feature, mapAndControls);
		};
	}
});
//=========================================================================
var MapAutoZoom = $n2.Class('MapAutoZoom',{
	initialize: function(opts_){
		var opts = $n2.extend({
			customService: undefined
			,includes: undefined
		},opts_);
		
		var _this = this;
	
		this.customService = opts.customService;
		var includes = opts.includes;
		if (includes){
			if (typeof includes[0] === 'object'){
				this.alwaysIncludes = includes;
			} else if (typeof includes[0] === 'number' || 'string' === includes[0]){
				this.alwaysIncludes = [includes];
			}
		} else {
			this.alwaysIncludes = null;
		}
		if( this.customService ){
			var f = function(feature, mapAndControls){
				_this._mapRefreshCallback(feature, mapAndControls);
			};

			this.customService.setOption('mapRefreshCallback',f);
		};
		
		$n2.log(this._classname, this);
	},
	_mapRefreshCallback: function(features, mapAndControls){
		
		
		if (mapAndControls._classname === 'MapAndControls'){
			//For Openlayers 2
			if (mapAndControls.map
					&& mapAndControls.map.layers){
					var map = mapAndControls.map;
					var target_extent;
					if (this.alwaysIncludes){
						this.alwaysIncludes.forEach(function(bound){
							if (bound.length === 4){
								var alpha_extent = new OpenLayers.Bounds(bound[0], bound[1], bound[2], bound[3]);
								var dstProj = new OpenLayers.Projection('EPSG:900913');
								var srtProj = new OpenLayers.Projection('EPSG:4326');
								alpha_extent.transform(srtProj, dstProj);
								if (!target_extent){
									target_extent = alpha_extent;
								} else {
									target_extent.extend (alpha_extent);
								}
							}
						})
					}
					var layers = map.layers;
					for (var i=0,e=layers.length; i<e; i++){
						if (layers[i].isBaseLayer){

						} else {
							var tmp_extent = layers[i].getDataExtent();
							if (tmp_extent){
								if (!target_extent){
									target_extent = tmp_extent;
								} else {
									target_extent.extend( tmp_extent );
								}

							}

						}
					}
					if (target_extent){
						mapAndControls.map.zoomToExtent(target_extent, false);
						//$n2.log('-->>, need to resetExtent', target_extent);
						//var dstProj = new OpenLayers.Projection('EPSG:900913');
						//var srtProj = new OpenLayers.Projection('EPSG:4326');
						//target_extent.transform(dstProj, srtProj);
						//$n2.log('-->>, need to resetExtent-es4326', target_extent);
					}
				}
			
		} else if (mapAndControls._classname === 'N2MapCanvas') {
			//For Openlayers 5
			if ( mapAndControls.n2Map ){
					var map = mapAndControls.n2Map;
					var target_extent;
					if (this.alwaysIncludes){
						this.alwaysIncludes.forEach(function(bound){
							if (bound.length === 4){
								var alpha_extent = bound;
								var dstProj = new nunaliit2.n2es6.ol_proj_Projection({code: 'EPSG:900913'});
								var srtProj = new nunaliit2.n2es6.ol_proj_Projection({code: 'EPSG:4326'});
								nunaliit2.n2es6.ol_proj_transformExtent(alpha_extent, srtProj, dstProj);
								//alpha_extent.transform(srtProj, dstProj);
								if (!target_extent){
									target_extent = alpha_extent;
								} else {
									nunaliit2.n2es6.ol_extent_extend (target_extent, alpha_extent);
								}
							}
						})
					}
					var layers = map.getLayers();
					for (var i=0,e=layers.length; i<e; i++){
						if (layers[i].isBaseLayer){

						} else {
							var tmp_extent = layers[i].getDataExtent();
							if (tmp_extent){
								if (!target_extent){
									target_extent = tmp_extent;
								} else {
									target_extent.extend( tmp_extent );
								}

							}

						}
					}
					if (target_extent){
						mapAndControls.map.zoomToExtent(target_extent, false);
						//$n2.log('-->>, need to resetExtent', target_extent);
						//var dstProj = new OpenLayers.Projection('EPSG:900913');
						//var srtProj = new OpenLayers.Projection('EPSG:4326');
						//target_extent.transform(dstProj, srtProj);
						//$n2.log('-->>, need to resetExtent-es4326', target_extent);
					}
				}
			
		}

	}
});
//=========================================================================
function HandleUtilityCreateRequests(m, addr, dispatcher){
	if( 'mapClusterClickToZoom' === m.utilityType ){
		var options = {};
		
		if( typeof m.utilityOptions === 'object' ){
			for(var key in m.utilityOptions){
				var value = m.utilityOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.customService = m.config.directory.customService;
			};
		};
		
		new MapClusterClickToZoom(options);

		m.created = true;

	} else if( 'mapClusterClickToMultiSelect' === m.utilityType ){
		var options = {};
		
		if( typeof m.utilityOptions === 'object' ){
			for(var key in m.utilityOptions){
				var value = m.utilityOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.customService = m.config.directory.customService;
			};
		};
		
		new MapClusterClickToMultiSelect(options);

		m.created = true;

	} else if( 'mapClusterClickHandler' === m.utilityType ){
		var options = {};
		
		if( typeof m.utilityOptions === 'object' ){
			for(var key in m.utilityOptions){
				var value = m.utilityOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.customService = m.config.directory.customService;
			};
		};
		
		new MapClusterClickHandler(options);

		m.created = true;
	} else if ('mapAutoZoom' === m.utilityType ){
		var options = {};
		
		if( typeof m.utilityOptions === 'object' ){
			for(var key in m.utilityOptions){
				var value = m.utilityOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.customService = m.config.directory.customService;
			};
		};
		
		new MapAutoZoom(options);

		m.created = true;
	};
};

//=========================================================================
$n2.mapUtilities = {
	HandleUtilityCreateRequests: HandleUtilityCreateRequests
	,MapClusterClickToZoom: MapClusterClickToZoom
	,MapClusterClickToMultiSelect: MapClusterClickToMultiSelect
	,MapClusterClickHandler: MapClusterClickHandler
	,MapAutoZoom : MapAutoZoom
};

})(nunaliit2);
