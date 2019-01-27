/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.canvasMap'
 ;

// --------------------------------------------------------------------------
/* 
This canvas displays a map based on OpenLayers5.  

*/
 
//--------------------------------------------------------------------------
 var BACKGROUND_VENDOR = {
	GOOGLEMAP : 'googlemaps',
	BING : 'bing',
	WMS : 'wms',
	OSM : 'osm',
	STAMEN : 'stamen',
	IMAGE : 'image',
	COUCHDB : 'couchdb'
 };
 

// --------------------------------------------------------------------------

 var CouchDbSource = $n2.Construct(ol.source.Vector,{
 	
 	sourceId: null,
 	sourceModelId: null,
 	dispatchService: null,
 	elementGenerator: null,
 	infoByDocId: null,
 	mapProjCode: null,
 	epsg4326Resolution: null,

 	constructor: function(opts_){
 		var opts = $n2.extend({
 			sourceModelId: undefined
 			,dispatchService: undefined
 			,projCode: undefined
 		},opts_);

 		var _this = this;

 		this.sourceId = $n2.getUniqueId();
 		this.infoByDocId = {};

 		CouchDbSource.base(this, 'constructor', opts_);
 		
 		this.sourceModelId = opts.sourceModelId;
 		this.dispatchService = opts.dispatchService;
 		this.mapProjCode = opts.projCode;

 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m, addr, dispatcher){
 				_this._handleDispatch(m, addr, dispatcher);
 			};
 			
 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
 			this.dispatchService.register(DH,'simplifiedGeometryReport',f);
 		};
 		
 		// Request for current state
  		if( this.sourceModelId ){
  			if( this.dispatchService ){
  				var msg = {
  					type: 'modelGetState'
  					,modelId: this.sourceModelId
  					,state: null
  				};
  				this.dispatchService.synchronousCall(DH,msg);
  				if( msg.state ){
  					this._sourceModelStateUpdated(msg.state);
  				};
  			};
  		};
 	},

 	_sourceModelStateUpdated: function(state){
 		var _this = this;

 		//$n2.log('map canvas receives update',state);
 		if( state.added ){
 			state.added.forEach(function(addedDoc){
 				var docId = addedDoc._id;
 				var docInfo = _this.infoByDocId[docId];
 				if( !docInfo ){
 					docInfo = {};
 					_this.infoByDocId[docId] = docInfo;
 				};
 				docInfo.doc = addedDoc;
 			});
 		};
 		if( state.updated ){
 			state.updated.forEach(function(updatedDoc){
 				var docId = updatedDoc._id;
 				var docInfo = _this.infoByDocId[docId];
 				if( !docInfo ){
 					docInfo = {};
 					_this.infoByDocId[docId] = docInfo;
 				};
 				if( docInfo.doc ){
 					if( docInfo.doc._rev !== updatedDoc._rev ){
 						// New version of document. Clear simplified info
 						delete docInfo.simplifications;
 						delete docInfo.simplifiedName;
 						delete docInfo.simplifiedResolution;
 						delete docInfo.simplifiedInstalled;
 					};
 				}
 				docInfo.doc = updatedDoc;
 			});
 		};
 		if( state.removed ){
 			state.removed.forEach(function(removedDoc){
 				var docId = removedDoc._id;
 				delete _this.infoByDocId[docId];
 			});
 		};

 		this._reloadAllFeatures();
 	},

 	_handleDispatch: function(m, addr, dispatcher){
 		var _this = this;

 		if('modelStateUpdated' === m.type) {
 			if( this.sourceModelId === m.modelId ){
 				this._sourceModelStateUpdated(m.state);
 			};
 		} else if('simplifiedGeometryReport' === m.type) {
 			if( $n2.isArray(m.simplifiedGeometries) ){
 				var atLeastOne = false;
 				m.simplifiedGeometries.forEach(function(simplifiedGeom){
 					var docId = simplifiedGeom.id;
 					var attName = simplifiedGeom.attName;
 					var wkt = simplifiedGeom.wkt;
 					
 					var docInfo = _this.infoByDocId[docId];
 					if( docInfo ){
 						if( !docInfo.simplifications ){
 							docInfo.simplifications = {};
 						};
 						docInfo.simplifications[attName] = wkt;
 						atLeastOne = true;
 					};
 				});
 				
 				if( atLeastOne ){
 					this._reloadAllFeatures();
 				};
 			};
 		}
 	},
 	
 	/**
 	 * This function is called when the map resolution is changed
 	 */
 	changedResolution: function(res,proj){
 		//$n2.log('resolution',res,proj);
 		this.epsg4326Resolution = this._getResolutionInProjection(res,proj);
 		
 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( doc && doc.nunaliit_geom
 			 && doc.nunaliit_geom.simplified 
 			 && doc.nunaliit_geom.simplified.resolutions ){
 				var bestAttName = undefined;
 				var bestResolution = undefined;
 				for(var attName in doc.nunaliit_geom.simplified.resolutions){
 					var attRes = 1 * doc.nunaliit_geom.simplified.resolutions[attName];
 					if( attRes < this.epsg4326Resolution ){
 						if( typeof bestResolution === 'undefined' ){
 							bestResolution = attRes;
 							bestAttName = attName;
 						} else if( attRes > bestResolution ){
 							bestResolution = attRes;
 							bestAttName = attName;
 						};
 					};
 				};
 				
 				// At this point, if bestResolution is set, then this is the geometry we should
 				// be displaying
 				if( undefined !== bestResolution ){
 					docInfo.simplifiedName = bestAttName;
 					docInfo.simplifiedResolution = bestResolution;
 				};
 			};
 		};
 		
 		var geometriesRequested = [];
 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( docInfo.simplifiedName ) {
 				// There is a simplification needed, do I have it already?
 				var wkt = undefined;
 				if( docInfo.simplifications ){
 					wkt = docInfo.simplifications[docInfo.simplifiedName];
 				};

 				// If I do not have it, request it
 				if( !wkt ){
 					var geomRequest = {
 						id: docId
 						,attName: docInfo.simplifiedName
 						,doc: doc
 					};
 					geometriesRequested.push(geomRequest);
 				};
 			};
 		}
 		
 		this.dispatchService.send(DH,{
 			type: 'simplifiedGeometryRequest'
 			,geometriesRequested: geometriesRequested
 			,requester: this.sourceId
 		});
 		
 		this._reloadAllFeatures();
 	},

 	_getResolutionInProjection: function(targetResolution, proj){

 		if( proj.getCode() !== 'EPSG:4326' ){
 			var transformFn = ol.proj.getTransform(proj.getCode(), 'EPSG:4326')
 			// Convert [0,0] and [0,1] to proj
 			var p0 = transformFn([0,0]);
 			var p1 = transformFn([0,1]);
 			
 			var factor = Math.sqrt( ((p0[0]-p1[0])*(p0[0]-p1[0])) + ((p0[1]-p1[1])*(p0[1]-p1[1])) );
 			
 			targetResolution = targetResolution * factor;
 		};
 		
 		return targetResolution;
 	},

 	_reloadAllFeatures: function(){
 		var _this = this;

 		var wktFormat = new ol.format.WKT();

 		var features = [];
 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( doc
 			 && doc.nunaliit_geom
 			 && doc.nunaliit_geom.wkt ){
 				var wkt = doc.nunaliit_geom.wkt;
 				if( docInfo.simplifiedName
 				 && docInfo.simplifications 
 				 && docInfo.simplifications[docInfo.simplifiedName] ){
 					// If there is a simplification loaded for this geometry,
 					// use it
 					wkt = docInfo.simplifications[docInfo.simplifiedName];
 					docInfo.simplifiedInstalled = docInfo.simplifiedName;
 				};

 				var geometry = wktFormat.readGeometryFromText(wkt);
 				geometry.transform('EPSG:4326', _this.mapProjCode);

 				var feature = new ol.Feature();
 				feature.setGeometry(geometry);
 				feature.setId(docId);
 				
 				docInfo.feature = feature;

// 				if (geoJSONFeature['properties']) {
// 					feature.setProperties(geoJSONFeature['properties']);
// 				}
 				
 				features.push(feature);
 			};
 		};

 		this.clear();
 		this.addFeatures(features);
 	}
 })
// ================================= 
 
var MapCanvas = $n2.Class('MapCanvas',{

	canvasId: null,

	sourceModelId: null,
	
	elementGenerator: null,

	dispatchService: null,

	showService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: undefined
			,sourceModelId: undefined
			,elementGenerator: undefined
			,config: undefined
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		try {
			this.canvasId = opts.canvasId;
			this.sourceModelId = opts.sourceModelId;
			this.elementGenerator = opts.elementGenerator;
	
			var config = opts.config;
			if( config ){
				if( config.directory ){
					this.dispatchService = config.directory.dispatchService;
					this.showService = config.directory.showService;
				};
			};

			this.sources = [];
			if( $n2.isArray(opts.overlays) ){
				opts.overlays.forEach(function(overlay){
					if( 'couchdb' === overlay.type ){
						var sourceModelId = undefined;
						if( overlay.options
						 && 'string' === typeof overlay.options.sourceModelId ){
							sourceModelId = overlay.options.sourceModelId;
						} else if( overlay.options
						 && 'string' === typeof overlay.options.layerName ){
							sourceModelId = overlay.options.layerName;
						} else {
							$n2.logError('Map canvas overlay is not named. Will be ignored');
						};

						if( sourceModelId ){
							var source = new CouchDbSource({
								sourceModelId: sourceModelId
								,dispatchService: _this.dispatchService
								,projCode: 'EPSG:3857'
							});
							_this.sources.push(source);
						};
					} else {
						$n2.logError('Can not handle overlay type: '+overlay.type);
					}
				});
			};
	
			// Register to events
			if( this.dispatchService ){
				var f = function(m){
					_this._handleDispatch(m);
				};
				
			};
			
			$n2.log(this._classname,this);
			
			this.bgSources = opts.backgrounds || [];
			this._drawMap();
			
		} catch(err) {
			var error = new Error('Unable to create '+this._classname+': '+err);
			opts.onError(error);
		};
		
		opts.onSuccess();
	}
	
	,_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},

	_drawMap: function() {
		var _this = this;
		 var image = new ol.style.Circle({
		        radius: 5,
		        fill: null,
		        stroke: new ol.style.Stroke({color: 'red', width: 1})
		      });

		      var styles = {
		        'Point': new ol.style.Style({
		          image: image
		        }),
		        'LineString': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'green',
		            width: 1
		          })
		        }),
		        'MultiLineString': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'green',
		            width: 1
		          })
		        }),
		        'MultiPoint': new ol.style.Style({
		          image: image
		        }),
		        'MultiPolygon': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'yellow',
		            width: 1
		          }),
		          fill: new ol.style.Fill({
		            color: 'rgba(255, 255, 0, 0.1)'
		          })
		        }),
		        'Polygon': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'blue',
		            lineDash: [4],
		            width: 3
		          }),
		          fill: new ol.style.Fill({
		            color: 'rgba(0, 0, 255, 0.1)'
		          })
		        }),
		        'GeometryCollection': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'magenta',
		            width: 2
		          }),
		          fill: new ol.style.Fill({
		            color: 'magenta'
		          }),
		          image: new ol.style.Circle({
		            radius: 10,
		            fill: null,
		            stroke: new ol.style.Stroke({
		              color: 'magenta'
		            })
		          })
		        }),
		        'Circle': new ol.style.Style({
		          stroke: new ol.style.Stroke({
		            color: 'red',
		            width: 2
		          }),
		          fill: new ol.style.Fill({
		            color: 'rgba(255,0,0,0.2)'
		          })
		        })
		      };

		      var styleFunction = function(feature) {
		        return styles[feature.getGeometry().getType()];
		      };
		      
		/**
		 * declare and init two layers array -- map and overlay 
		 */
		var mapLayers = [];
		var overlayLayers = [];
		
		/**
		 * filling in the vector layers
		 */
		/**
		 * Define the geometryFunction for the clusterSource
		 *
		 */
		function n2geometryFunc(feature) {
			var geom = feature.getGeometry();
			//console.log("A new geometry with type: " + geom.getType());
			if(geom.getType() == 'Point'){
				return geom;
			} else if(geom.getType() == 'LineString'){
				return new ol.geom.Point(geom.getLastCoordinate());
			} else if(geom.getType() == 'Polygon'){
				return geom.getInteriorPoint();
			} else if(geom.getType() == 'MultiPoint'){
				return new ol.geom.Point(geom.getLastCoordinate());
			} else if(geom.getType() == 'MultiPolygon') {
				return new ol.geom.Point(geom.getLastCoordinate());
			} else if(geom.getType() == 'MultiLineString'){
				return new ol.geom.Point(geom.getLastCoordinate());
			}
			return null;
			
		};
		
//		/**
//		 * Testing the N2Cluster performance
//		 *
//		 */
//		var count = 200;
//		var features = new Array(count);
//		var e = 4500000;
//		var ox = 2*e *Math.random() -e;
//		var oy = 2*e *Math.random() -e;
//		for(var i=0;i<count;++i) {
//			
//			var coordinates = [[[ox, oy],[ ox+10000, oy-100*i],[ox+100000, oy+100*i]]];
//			features[i] = new ol.Feature(new ol.geom.Polygon(coordinates));
//		}
//		this.sources.push(new ol.source.Vector({features: features}));
		
		
		this.sources.forEach(function(source){
			
			/** 
			 * Testing the cluster wrapper (I wonder what polygon and line are going to 
			 * be rendered in default cluster class
			 */
			var clusterSource = new n2es6.ol5support.N2Cluster({
				distance : 20,
				source: source
			});
			var vectorLayer = new ol.layer.Vector({
				title: "CouchDb",
				source: clusterSource,
				style: styleFunction,
				renderOrder: function(feature1, feature2){
					return $n2.olUtils.ol5FeatureSorting(feature1, feature2);
				}
			});
			overlayLayers.push(vectorLayer);
		});
		
		
		mapLayers = this._genBackgroundMapLayers(this.bgSources);
		
		/**
		 * Two Groups : Overlay and Background
		 */
		var overlayGroup = new ol.layer.Group({
			title: 'Overlays',
			layers: overlayLayers
		});
		var bgGroup = new ol.layer.Group({
			title: 'Background',
			layers: mapLayers
		});
		
		/**
		 * ol.View tweaking listen on the resolution changing
		 */
		var olView = new ol.View({
			center: ol.proj.transform([-75, 45.5], 'EPSG:4326', 'EPSG:3857'),
			projection: 'EPSG:3857',
			zoom: 6
		});
		olView.on('change:resolution',function(event){
			var olView = event.target;
			if( olView ){
				var res = olView.getResolution();
				var proj = olView.getProjection();
				//$n2.log('resolution',res,proj);
				_this.sources.forEach(function(source){
					source.changedResolution(res,proj);
				});
				
			};
		});
		var customMap = new ol.Map({
			target : this.canvasId,
			layers: [
				bgGroup,
				overlayGroup
			],
			view: olView
		});
		
		
		
		var customLayerSwitcher = new ol.control.N2LayerSwitcher({
			tipLabel: 'Legend' // Optional label for button
		});
		
		
		customMap.addControl(customLayerSwitcher);
		
		var selectClick = new ol.interaction.Select({
			condition: ol.events.condition.click
		});
		selectClick.on('select', function(e){
			console.log('Test select func; Selected Feature: ' + e.selected.length);
		})
		
		customMap.addInteraction(selectClick);
		
	}
	,_genBackgroundMapLayers: function (bgSources) {
		var _this = this;
		var bg = null;
		if( bgSources ) {
					// This is the method used when background layers are specified
					// via couchModule
			for(var i=0,e=bgSources.length; i<e; ++i){
				var layerDefiniton = bgSources[i];
				var l = this._createOLLayerFromDefinition(layerDefiniton, 
						_computeDefaultLayer( bgSources , i)
						);
				if( l && !bg ) bg = [];
				if( l ) bg[bg.length] = l;
			};
					
		};
		
		return(bg);
		
		
		function _computeDefaultLayer(backgrounds, idx) {
			if( typeof _computeDefaultLayer.defaultLayerIdx == 'undefined' ) {
				_computeDefaultLayer.defaultLayerIdx = -1;
		    }
			if( _computeDefaultLayer.defaultLayerIdx === -1 ){
				_computeDefaultLayer.defaultLayerIdx = 0;
				for(var i=0,e=backgrounds.length; i<e; ++i){
					var layerDefiniton = backgrounds[i];
					if ( typeof (layerDefiniton.defaultLayer) !== undefined 
						&& layerDefiniton.defaultLayer ) {
						_computeDefaultLayer.defaultLayerIdx = i;
					}
				};
			};
			return (_computeDefaultLayer.defaultLayerIdx === idx);
		}
	}
	
	,_createOLLayerFromDefinition: function(layerDefinition, isDefaultLayer) {
		var name = _loc(layerDefinition.name);
		var _this = this;
		
		if( layerDefinition ) {
			var ol5layer = new ol.layer.Tile({
				title: layerDefinition.name,
				type: 'base',
				visible: isDefaultLayer,
				source: _this._createBackgroundMapSource(layerDefinition)
			});
			return ol5layer;
		} else {
			$n2.reportError('Bad configuration for layer: ' + name);
			return null;
		};
		

		
	}
	, _createBackgroundMapSource : function(layerDefinition) {
		
		var sourceTypeInternal = 
			layerDefinition.type.replace(/\W/g,'').toLowerCase();
		var sourceOptionsInternal = layerDefinition.options;
			
		if ( sourceTypeInternal == BACKGROUND_VENDOR.GOOGLEMAP ) {
			
			$n2.log('Background of Google map is under construction');
			
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.BING) {
			
			return new BingMaps(sourceOptionsInternal);
			
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.WMS ) {
			if (sourceOptionsInternal 
				&& sourceOptionsInternal.url 
				&& sourceOptionsInternal.layers
				&& sourceOptionsInternal.styles ) {
			var parameters = {};
			for ( var key in sourceOptionsInternal){
				if( 'LAYERS' === key.toUpperCase()
					|| 'STYLES' === key.toUpperCase()
					|| 'WIDTH' === key.toUpperCase()
					|| 'VERSION' === key.toUpperCase()
					||  'HEIGHT'  === key.toUpperCase()
					||  'BBOX' === key.toUpperCase()
					||  'CRS'=== key.toUpperCase()){
					
					parameters[key.toUpperCase()] = sourceOptionsInternal[key]
				}
				
			}
			return new TileWMS({
				url: sourceOptionsInternal.url,
				params: parameters
			});
			} else {
				
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}
			
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.OSM) {
			
			if (sourceOptionsInternal
					&& sourceOptionsInternal.url ){
				return new OSM({
					url : sourceOptionsInternal.url
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}
			
			
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.STAMEN) {
			if (sourceOptionsInternal
					&& sourceOptionsInternal.layerName ){
				return new ol.source.Stamen({
					layer:  sourceOptionsInternal.layerName
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.IMAGE) {
			
		} else if ( sourceTypeInternal == BACKGROUND_VENDOR.COUCHDB) {
			
		} else {
			
			$n2.reportError('Unrecognized type (' + layerDefinition.type + ')');
		}
	}
	
	,_handleDispatch: function(m, addr, dispatcher){
	}
});

//--------------------------------------------------------------------------
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'map' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'map' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
 		if( !options.elementGenerator ){
 			// If not defined, use the one specified by type
 			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
 	 			type: options.elementGeneratorType
 	 			,options: options.elementGeneratorOptions
 	 			,config: m.config
 	 		});
 		};
 		
		options.canvasId = m.canvasId;
		options.config = m.config;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new MapCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasMap = {
	MapCanvas: MapCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
