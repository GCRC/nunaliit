/**
 * @module n2es6/n2mapModule/N2CanvasMap
 */
import CouchDbSource from './N2CouchDbSource.js';


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


class MapCanvas  {


    construct(opts_){
	this.canvasId= null;

	this.sourceModelId =  null;

	this.elementGenerator =  null;

	this.dispatchService  =  null;

	this.showService =  null;

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

	_getElem(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	}
	_drawMap() {
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
		var customMap = new ol.N2Map({
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
	_genBackgroundMapLayers(bgSources) {
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

	_createOLLayerFromDefinition(layerDefinition, isDefaultLayer) {
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
	 _createBackgroundMapSource (layerDefinition) {

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

    _handleDispatch( m, addr, dispatcher){
	}
};

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
