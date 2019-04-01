/**
 * @module n2es6/n2mapModule/N2MapCanvas
 */

import 'ol/ol.css';
import {default as CouchDbSource} from './N2CouchDbSource.js';
import N2ModelSource from './N2ModelSource.js';
import {default as LayerInfo} from './N2LayerInfo';
import {default as N2MapStyles} from './N2MapStyles.js';
import {default as customPointStyle} from './N2CustomPointStyle.js';
import {Fill, RegularShape, Stroke, Style, Text} from 'ol/style.js';
import {createDefaultStyle} from 'ol/style/Style.js'

import {default as ImageSource} from 'ol/source/Image.js';
import {default as N2Select} from './N2Select.js';
import {default as N2SourceWithN2Intent} from './N2SourceWithN2Intent.js';



import Map from 'ol/Map.js';
import WebGLMap from 'ol/WebGLMap';
import {default as VectorLayer} from 'ol/layer/Vector.js';
import {default as LayerGroup} from 'ol/layer/Group.js';
import {default as ImageLayer} from 'ol/layer/Image.js';
import {default as View} from 'ol/View.js';

import {transform, getTransform, transformExtent} from 'ol/proj.js';
import {default as Projection} from 'ol/proj/Projection.js';
import Tile from 'ol/layer/Tile.js';

import {click as clickCondition} from 'ol/events/condition.js';
import mouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import {defaults as defaultsInteractionSet} from 'ol/interaction.js';

import {default as DrawInteraction} from 'ol/interaction/Draw.js';
import Stamen from 'ol/source/Stamen.js';
import OSM from 'ol/source/OSM';
import LayerSwitcher from 'ol-layerswitcher';

import 'ol-ext/dist/ol-ext.css';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';



var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvasMap';


//--------------------------------------------------------------------------
/*
This canvas displays a map based on OpenLayers5.

 */

//--------------------------------------------------------------------------
const VENDOR =  {
		GOOGLEMAP : 'googlemaps',
		BING : 'bing',
		WMS : 'wms',
		OSM : 'osm',
		STAMEN : 'stamen',
		IMAGE : 'image',
		COUCHDB : 'couchdb'
};

const olStyleNames = {
		"fill": "fillColor"
		,"fill-opacity": "fillOpacity"
		,"stroke": "strokeColor"
		,"stroke-opacity": "strokeOpacity"
		,"stroke-width": "strokeWidth"
		,"stroke-linecap": "strokeLinecap"
		,"stroke-dasharray": "strokeDashstyle"
		,"r": "pointRadius"
		,"pointer-events": "pointEvents"
		,"color": "fontColor"
		,"font-family": "fontFamily"
		,"font-size": "fontSize"
		,"font-weight": "fontWeight"
};
const stringStyles = {
		"label": true
};

var featureStyleFunctions = {
		getDocuments: function(){
			// this is the feature

			var documents = [];

			if( $n2.isArray(this.cluster) ) {
				this.cluster.forEach(function(f){
					documents.push(f.data);
				});
			} else {
				documents.push(this.data);
			};

			return documents;
		}
};

/**
 * @classdesc
 * N2 Map canvas (The playground for ol5 lib update in nunaliit 2)
 * @api
 */
class N2MapCanvas  {

	constructor(opts_){
		var opts = $n2.extend({
			canvasId: undefined
			,sourceModelId: undefined
			,elementGenerator: undefined
			,config: undefined
			,onSuccess: function(){}
		,onError: function(err){}
		},opts_);

		var _this = this;
		this.dispatchService  = null;

		this.showService = null;

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

		this.overlayInfos = [];


		this.mapLayers = [];
		this.overlayLayers = [];

		this.center = undefined;
		this.resolution = undefined;




		this.n2View = undefined;
		this.n2Map = undefined;

		this.n2MapStyles = new N2MapStyles();


		this.interactionSet = {
				selectInteraction : null,
				drawInteraction : null
		};
		this.currentInteract = null;
		this._processOverlay(opts.overlays);

		// Register to events
		if( this.dispatchService ){
			var f = function(m){
				_this._handleDispatch(m);
			};
			this.dispatchService.register(DH,'n2ViewAnimation',f);
			this.dispatchService.register(DH, 'n2rerender', f);
		};

		$n2.log(this._classname,this);

		this.bgSources = opts.backgrounds || [];


		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styles);

		this._drawMap();
		opts.onSuccess();
		
		
	}

	/**
	 * Preprocess the opts.overlay. Producing overlay-sources array
	 * and overlay-infos array.
	 * @param  {Array} overlays [description]
	 */
	_processOverlay (overlays) {


		var _this = this;
		if( $n2.isArray(overlays) ){
			overlays.forEach( (function(overlay){

				// Generate Array<layerInfo> layerInfos;
				var layerInfoOptions = overlay;
				var layerInfo = new LayerInfo(layerInfoOptions);
				var layerOptions = {
						name: layerInfo.name
						,projection: layerInfo.sourceProjection
						,visibility: layerInfo.visibility
						,_layerInfo: layerInfo
				};

				this.overlayInfos.push(layerOptions);
				//---------------------
				//---------------------
				if ('couchdb' === overlay.type) {
					let sourceModelId = undefined;
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
							,dispatchService: this.dispatchService
							,projCode: 'EPSG:3857'
						});
						this.sources.push(source);
					};
				} else if ( 'model' === overlay.type ) {

					let sourceModelId = undefined;
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
						var source = new N2ModelSource({
							sourceModelId: sourceModelId
							,dispatchService: this.dispatchService
							,projCode: 'EPSG:3857'
								,onUpdateCallback : function(state){
									//_this._modelLayerUpdated(layerOptions, state);
								}
						,notifications: {
							readStart: function(){
								//_this._mapBusyStatus(1);
							}
						,readEnd: function(){
							//_this._mapBusyStatus(-1);
						}
						}
						});
						this.sources.push(source);
					};
				} else if ('wfs' === overlay.type) {
					$n2.logError(overlay.type + 'is constructing');
				} else {
					$n2.logError('Can not handle overlay type: '+overlay.type);
				}
			}).bind(this) );
		};



	};


	_mapBusyStatus(delta){
		//TODO new version of progressControl
//		var previous = this.mapBusyCount;
//		this.mapBusyCount += delta;
//		if( previous < 1 && this.mapBusyCount > 0 ) {
//		$n2.log('Start map busy');
//		};
//		if( previous > 0 && this.mapBusyCount < 1 ) {
//		$n2.log('End map busy');
//		};
//		if( this.busyMapControl && delta < 0 ) {
//		this.busyMapControl.decreaseCounter();
//		} else if( this.busyMapControl && delta > 0 ) {
//		this.busyMapControl.increaseCounter();
//		}
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

		var olView = new View({
			center: transform([-75, 45.5], 'EPSG:4326', 'EPSG:3857'),
			projection: 'EPSG:3857',
			zoom: 6
		});
		this.n2View = olView;


//		olView.on('change:resolution',function(event){
//		var olView = event.target;
//		if( olView ){
//		var res = olView.getResolution();
//		var oldres = _this.resolution;
//		var proj = olView.getProjection();
//		if (typeof _this.resolution === 'undefined'
//		|| Math.abs((res - oldres)/oldres) > 0.01){
//		var extent = olView.calculateExtent();
//		//$n2.log('resolution',res,proj);
//		_this.resolution = res;
//		_this.sources.forEach(function(source){
//		source.onChangedResolution(res,proj,extent);
//		});
//		}

//		};
//		return true;
//		});



		var customMap = new Map({
			interactions: defaultsInteractionSet({mouseWheelZoom : false}).extend([
				new mouseWheelZoom({
					duration: 200,
					constrainResolution: true
				})
				]),
				target : this.canvasId,
				view: olView

		});
		this.n2Map = customMap;
		customMap.on('movestart', onMoveStart);

		function onMoveStart(evt){
			customMap.once('moveend', function(evt){
				let res = evt.frameState.viewState.resolution;
				let proj = _this.n2View.getProjection();
				_this.resolution = res;
				var extent = olView.calculateExtent();
				_this.sources.forEach(function(source){
					source.onChangedResolution(res,proj, extent);
				});
			})
		}

		this.interactionSet.selectInteraction = new N2Select({map: customMap});

//		------------------------------
//		------------------------------ create and add layers
		this.overlayLayers = this._genOverlayMapLayers(this.sources);
		this.mapLayers = this._genBackgroundMapLayers(this.bgSources);	
		/**
		 * Two Groups : Overlay and Background
		 */
		var overlayGroup = new LayerGroup({
			title: 'Overlays',
			layers: this.overlayLayers
		});
		var bgGroup = new LayerGroup({
			title: 'Background',
			layers: this.mapLayers
		});


		customMap.set("layergroup",
				new LayerGroup({layers: [bgGroup, overlayGroup]}) 
		);

		
		var customLayerSwitcher = new LayerSwitcher({
					tipLabel: 'Legend' // Optional label for button
				});
		customMap.addControl(customLayerSwitcher);


		var mainbar = new Bar();
		customMap.addControl(mainbar);
		mainbar.setPosition("top");
		/* Nested toobar with one control activated at once */
		var nested = new Bar ({ toggleOne: true, group:true });
//		var selectInteraction= new SelectInteraction ();
		mainbar.addControl (nested);


		// Add selection tool (a toggle control with a select interaction)
		var selectCtrl = new Toggle(
				{	html: '<i class="fa fa-hand-pointer-o"></i>',
					className: "select",
					title: "Select",
					interaction: this.interactionSet.selectInteraction,
					active:true,
					onToggle: function(active)
					{
					}
				});
		this.interactionSet.selectInteraction.on("clicked", (function(e) {
			if (e.selected) {
				this._retrivingDocsAndSendSelectedEvent(e.selected);
			}	
		}).bind(this)

		);
		nested.addControl(selectCtrl);

		this.interactionSet.drawInteraction = new DrawInteraction
		({	type: 'Point',
			source: this.overlayLayers[0].getSource()
		});
		// Add editing tools
		var pedit = new Toggle(
				{	html: '<i class="fa fa-map-marker" ></i>',
					className: "edit",
					title: 'Point',
					interaction: this.interactionSet.drawInteraction,
					onToggle: function(active)
					{
					}
				});
		nested.addControl ( pedit );


		/* Standard Controls */
//		mainbar.addControl (new ZoomToExtent({  extent: [ 265971,6243397 , 273148,6250665 ] }));
//		mainbar.addControl (new Rotate());
//		mainbar.addControl (new FullScreen());
		//_changeToImageRender();
	}

	_changeToImageRender(){
		let neutralSource = this.overlayLayers[0].getSource();
		let postLayer = new ol.layer.ImageLayer({
			source: new ol.source.ImageSource({
				source: neutralSource
			})
		})

		this.overlayLayers = [postLayer];

	}

	_retrivingDocsAndSendSelectedEvent(features) {

		var _this = this;
		var validFeatures = [];
		for ( let i = 0, v = features.length;i< v ;i++) {

			let feature = features[i];
			DFS(feature, function(t) {
				validFeatures.push(t)
			})
		}
		if (_this.dispatchService ) {
			if( 0 === validFeatures.length){
				return;
			} else if ( 1 === validFeatures.length) {
				let t = validFeatures[0];
				_this.dispatchService.send(DH, {
					type: 'userSelect'
						,docId: t.data._id
						,doc: t.data
						,feature: t
				})
			} else if (1 < validFeatures.length){

				let docIds = [];
				validFeatures.forEach(function(elem) {
					docIds.push(elem.data._id);
				})
				_this.dispatchService.send(DH,{
					type: 'userSelect'
						,docIds: docIds
				});
			};
		};


		function DFS(item, callback){
			if(!item) return;
			if ( item.data){
				callback (item);
				return;
			}
			let innerFeatures = item.cluster;
			if( innerFeatures && Array.isArray(innerFeatures)){
				for( let i=0,e=innerFeatures.length; i< e; i++){
					DFS(innerFeatures[i], callback);
				}
			}
		}
	}

	_genOverlayMapLayers(Sources) {

		var fg = [];
		var _this = this;
		var DONETESTCACHE = {};
		if( Sources) {
			Sources.forEach(function(source){

				var clusterSource = new n2es6.ol5support.N2Cluster({
					source: source
				});
				var n2IntentSource = new N2SourceWithN2Intent({
					interaction: _this.interactionSet.selectInteraction,
					source: clusterSource,
					dispatchService: _this.dispatchService
				});
				var vectorLayer = new VectorLayer({
					title: "CouchDb",
					renderMode : 'image',
					declutter : true,
					source: n2IntentSource,
					style: StyleFn,
					renderOrder: function(feature1, feature2){
						return $n2.olUtils.ol5FeatureSorting(feature1, feature2);
					}
				});
//				var layerOptions = _this.overlayInfos.shift();
//				var layerStyleMap = createStyleMap(layerOptions._layerInfo);
//				vectorLayer.set('styleMap', layerStyleMap);
				fg.push(vectorLayer);
			});

		}
		return (fg);
		function StyleFn(feature, resolution){

			var f = feature;
			
//			if(f.getGeometry().getType() === "Point"){
//				if (!DONETESTCACHE[f.fid]){
//				var ldata =[];
//				let e = Math.round(10*Math.random());
//				let nb = 0;
//				for(var k =0;k<e;k++){
//					let n = Math.round(10*Math.random());
//					ldata.push(n);
//					nb += n;
//				}
//				let thisradius = nb;
//				
//				
//				
//				let thisStyle = new Style({
//					image: new customPointStyle({
//						type: "treering", 
//						radius : thisradius,
//						data: ldata,
//						animation: false,
//						stroke: new Stroke({
//							color: "#000",
//							width: 2
//						})
//					})
//				})
//				DONETESTCACHE[f.fid] = thisStyle;
//				return [thisStyle];
//			} else {
//				return DONETESTCACHE[f.fid];
//			}
//			}
			
			for(var fnName in featureStyleFunctions){
				f[fnName] = featureStyleFunctions[fnName];
			};
			var geomType = f.getGeometry()._n2Type;
			if ( !geomType ) {
				if ( f
						.getGeometry()
						.getType()
						.indexOf('Line') >= 0){
					geomType = f.getGeometry()._n2Type = 'line';

				} else if ( f
						.getGeometry()
						.getType()
						.indexOf('Polygon') >= 0){
					geomType = f.getGeometry()._n2Type = 'polygon';
				} else {
					geomType = f.getGeometry()._n2Type = 'point';
				}
			}
			f.n2_geometry = geomType;

			//Deal with n2_doc tag
			var data = f.data;
			if (f 
					&& f.cluster
					&& f.cluster.length === 1) {
				data = f.cluster[0].data;
			};
			f.n2_doc = data;

			//(import $n2.styleRule.js).Style
			let style = _this.styleRules.getStyle(feature);

			let symbolizer = style.getSymbolizer(feature);
			var symbols = {};
			symbolizer.forEachSymbol(function(name,value){
				name = olStyleNames[name] ? olStyleNames[name] : name;

				if( stringStyles[name] ){
					if( null === value ){
						// Nothing
					} else if( typeof value === 'number' ) {
						value = value.toString();
					};
				};
				symbols[name] = value;
			},feature);

			if (typeof f._cached_style !== 'undefined'){
				if (typeof f._style_change !== 'undefined' && ! f._style_change ) {
					return f._cached_style;
				}
			}
			let n2mapStyles = _this.n2MapStyles;
			let innerStyle = n2mapStyles.loadStyleFromN2Symbolizer(symbols, 
					feature.n2_geometry);
			f._cached_style = innerStyle;
			return innerStyle;
		}
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
					var layerDefinition = backgrounds[i];
					if ( typeof (layerDefinition.defaultLayer) !== 'undefined'
						&& layerDefinition.defaultLayer ) {
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
			var ol5layer = new Tile({
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

		if ( sourceTypeInternal == VENDOR.GOOGLEMAP ) {

			$n2.log('Background of Google map is under construction');

		} else if ( sourceTypeInternal == VENDOR.BING) {

			return new BingMaps(sourceOptionsInternal);

		} else if ( sourceTypeInternal == VENDOR.WMS ) {
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

		} else if ( sourceTypeInternal == VENDOR.OSM) {

			if (sourceOptionsInternal
					&& sourceOptionsInternal.url ){
				return new OSM({
					url : sourceOptionsInternal.url
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}


		} else if ( sourceTypeInternal == VENDOR.STAMEN) {
			if (sourceOptionsInternal
					&& sourceOptionsInternal.layerName ){
				return new Stamen({
					layer:  sourceOptionsInternal.layerName
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}
		} else if ( sourceTypeInternal == VENDOR.IMAGE) {

		} else if ( sourceTypeInternal == VENDOR.COUCHDB) {

		} else {

			$n2.reportError('Unrecognized type (' + layerDefinition.type + ')');
		}
	}

	_handleDispatch( m, addr, dispatcher){

		var _this = this;
		var type = m.type;
		if ('n2ViewAnimation' === type){
			let x = m.x;
			let y = m.y;
			let sourceProjCode = m.projCode;
			let targetProjCode = 'EPSG:3857';
			var targetCenter = [x, y];
			if ( targetProjCode !== sourceProjCode){
				var transformFn = getTransform( sourceProjCode, targetProjCode);
				// Convert [0,0] and [0,1] to proj
				targetCenter = transformFn([x, y]);
			}

			let extent =  this._computeFullBoundingBox(m.doc, 'EPSG:4326','EPSG:3857');	



//			_this.n2View.animate({
//			center: targetCenter,
//			duration: 1000
//			});
//			_this.n2View.animate({
//			zoom: _this.n2View.getZoom()-1,
//			duration: 500
//			});
			if (extent[0] === extent[2] || extent[1] === extent [3]){
				_this.n2View.animate({
					center: targetCenter,
					duration: 500
				},{
					zoom: 9,
					duration: 500
				});
			} else {
				_this.n2View.fit(extent,{duration: 1500});
			}

		} else if ('n2rerender' === type){
			if (_this.n2Map){
				_this.overlayLayers.forEach(function(overlayLayer){
						overlayLayer.changed();
					
				});
			}
		}
		
	}

	/**
	 * Compute the bounding box of the original geometry. This may differ from
	 * the bounding box of the geometry on the feature since this can be a
	 * simplification.
	 * @param {Feature} f The bounding box value from nunaliit project, which considers both the simplified geometries and original one.
	 * @return {Array<number>} Extent
	 * @protected
	 */
	_computeFullBoundingBox(f, srcProj, dstProj) {
		if (f && f.nunaliit_geom
				&& f.nunaliit_geom.bbox){
			let bbox = f.nunaliit_geom.bbox;
			let geomBounds = undefined;
			if ( Array.isArray(bbox)) {
				geomBounds = transformExtent(bbox,
						new Projection({code: srcProj}),
						new Projection({code: dstProj})
				);
				return geomBounds;

			}
		}


	}
	_computeFeatureOriginalBboxForMapProjection(f, mapProj) {
		// Each feature has a projection stored at f.n2GeomProj
		// that represents the original projection for a feature
		//
		// Each feature has a property named 'n2ConvertedBbox' that contains
		// the full geometry bbox converted for the map projection, if
		// already computed.

		if (f && f.n2ConvertedBbox) {
			return f.n2ConvertedBbox;
		}

		let geomBounds = undefined;
		if (f.data
				&& f.data.nunaliit_geom
				&& f.data.nunaliit_geom.bbox
				&& f.n2GeomProj
				&& mapProj) {

			const bbox = f.data.nunaliit_geom.bbox;
			if (Array.isArray(bbox)
					&& bbox.length >= 4) {
				geomBounds = bbox;

				if (mapProj.getCode() !== f.n2GeomProj.getCode) {
					geomBounds = transformExtent(bbox, f.n2GeomProj, mapProj);
				}

				f.n2ConvertedBbox = geomBounds;
			}
		}

		return geomBounds;
	}

};

//--------------------------------------------------------------------------
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
export function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'map' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
export function HandleCanvasDisplayRequest(m){
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

		new N2MapCanvas(options);
	};
};

//--------------------------------------------------------------------------


nunaliit2.canvasMap = {
		MapCanvas: N2MapCanvas
		,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
		,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};
export default N2MapCanvas;
