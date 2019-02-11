/**
* @module n2es6/n2mapModule/N2MapCanvas
*/

import 'ol/ol.css';
import {default as CouchDbSource} from './N2CouchDbSource.js';
import {default as LayerInfo} from './N2LayerInfo';

import Map from 'ol/Map.js';
import {default as VectorLayer} from 'ol/layer/Vector.js';
import {default as LayerGroup} from 'ol/layer/Group.js';
import {default as View} from 'ol/View.js';

import {transform} from 'ol/proj.js';
import Tile from 'ol/layer/Tile.js';

import {click as clickCondition} from 'ol/events/condition.js';
import {default as SelectInteraction} from 'ol/interaction/Select.js';
import {default as DrawInteraction} from 'ol/interaction/Draw.js';
import Stamen from 'ol/source/Stamen.js';
import LayerSwitcher from 'ol-layerswitcher';

import 'ol-ext/dist/ol-ext.css';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';



var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvasMap';


// --------------------------------------------------------------------------
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


/**
 * @classdesc
 * N2 Map canvas (The playground for ol5 lib update in nunaliit 2)
 * @api
 */
class N2MapCanvas  {

	constructor(opts_){
		this.canvasId= null;

		this.sourceModelId = null;

		this.elementGenerator = null;

		this.dispatchService  = null;

		this.showService = null;

		var opts = $n2.extend({
			canvasId: undefined
			,sourceModelId: undefined
			,elementGenerator: undefined
			,config: undefined
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;

	//	try {
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


			/**
			 * @protected
			 * @type {Array} sources : Array<ol.source.Vector>
			 */
			this.sources = [];
			/**
			 * @protected
			 * @type {Array} overlayInfos : Array<./N2LayerInfo>
			 */
			this.overlayInfos = [];

			this._prepOverlay(opts.overlays ,this.sources, this.overlayInfos);

					// Register to events
					if( this.dispatchService ){
						var f = function(m){
							_this._handleDispatch(m);
						};

					};

					$n2.log(this._classname,this);

					this.bgSources = opts.backgrounds || [];
					this._drawMap();

//				} catch(err) {
//					var error = new Error('Unable to create '+this._classname+': '+err);
//					console.trace();
//					opts.onError(error);
//				};

				opts.onSuccess();
	}

	/**
	* Preprocess the opts.overlay. Producing overlay-sources array
	* and overlay-infos array.
	* @param  {[type]} overlays [description]
	* @param  {[type]} sources [description]
	* @param  {[type]} overlayInfos [description]
	*/
	_prepOverlay (overlays, sources, overlayInfos) {
		if( $n2.isArray(overlays) ){
			overlays.forEach( (function(overlay){

				//Generate Array<layerInfo> layerInfos;
//				var layerInfoOptions = jQuery.extend({
//					styleMapFn: function(layerInfo) {
//						return createStyleMapFromLayerInfo(layerInfo);
//					}
//				}, overlays);
//				var layerInfo = new LayerInfo(layerInfoOptions);
//				var layerOptions = {
//					name: layerInfo.name
//					,projection: layerInfo.sourceProjection
//					,visibility: layerInfo.visibility
//					,_layerInfo: layerInfo
//				};
//
//				overlayInfos.push(layerOptions);
				//---------------------
				//---------------------
				if ('couchdb' === overlay.type) {
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
									,dispatchService: this.dispatchService
									,projCode: 'EPSG:3857'
								});
								this.sources.push(source);
							};
				} else if ('model' ===  overlay.type ) {
					$n2.logError(overlay.type + 'is constructing');
				} else if ('wfs' === overlay.type) {
					$n2.logError(overlay.type + 'is constructing');
				} else {
					$n2.logError('Can not handle overlay type: '+overlay.type);
				}
			}).bind(this) );
		};



	};

	_registerLayerForEvents(layerInfo) {



	};
	_getElem(){
			var $elem = $('#'+this.canvasId);
			if( $elem.length < 1 ){
				return undefined;
			};
			return $elem;
	}

	_drawMap() {
			var _this = this;

			/**
			* declare and init two layers array -- map and overlay
			*/
			var mapLayers = [];
			var overlayLayers = [];

			/**
			* filling in the vector layers
			*/

			overlayLayers = this._genOverlayMapLayers(this.sources);
			mapLayers = this._genBackgroundMapLayers(this.bgSources);

			/**
			* Two Groups : Overlay and Background
			*/
			var overlayGroup = new LayerGroup({
				title: 'Overlays',
				layers: overlayLayers
			});
			var bgGroup = new LayerGroup({
				title: 'Background',
				layers: mapLayers
			});

			/**
			* ol.View tweaking listen on the resolution changing.
			*/
			var olView = new View({
				center: transform([-75, 45.5], 'EPSG:4326', 'EPSG:3857'),
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
			var customMap = new Map({
				target : this.canvasId,
				layers: [
					bgGroup,
					overlayGroup
				],
				view: olView
			});



			var customLayerSwitcher = new LayerSwitcher({
				tipLabel: 'Legend' // Optional label for button
			});


			customMap.addControl(customLayerSwitcher);


			var mainbar = new Bar();
			customMap.addControl(mainbar);
			mainbar.setPosition("top");
			/* Nested toobar with one control activated at once */
			var nested = new Bar ({ toggleOne: true, group:true });
			var selectInteraction= new SelectInteraction ();
			mainbar.addControl (nested);
			// Add selection tool (a toggle control with a select interaction)
			var selectCtrl = new Toggle(
					{	html: '<i class="fa fa-hand-pointer-o"></i>',
						className: "select",
						title: "Select",
						interaction: selectInteraction,
						active:true,
						onToggle: function(active)
						{	
						}
					});
			selectInteraction.on("select", (function(e) {
				this._retrivingDocsAndSendSelectedEvent(e.selected);
				}).bind(this)
			);
			nested.addControl(selectCtrl);
			
			// Add editing tools
			var pedit = new Toggle(
					{	html: '<i class="fa fa-map-marker" ></i>',
						className: "edit",
						title: 'Point',
						interaction: new DrawInteraction
						({	type: 'Point',
							source: overlayLayers[0].getSource()
						}),
						onToggle: function(active)
						{	
						}
					});
			nested.addControl ( pedit );

			/* Standard Controls */
//			mainbar.addControl (new ZoomToExtent({  extent: [ 265971,6243397 , 273148,6250665 ] }));
//			mainbar.addControl (new Rotate());
//			mainbar.addControl (new FullScreen());

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
					,docId: t.get('data')._id
					,doc: t.get('data')
					,feature: t
				})
			} else if (1 < validFeatures.length){
				
				let docIds = [];
				validFeatures.forEach(function(elem) {
					docIds.push(elem.get('data')._id);
				})
				_this.dispatchService.send(DH,{
					type: 'userSelect'
					,docIds: docIds
				});
			};
		};
		
		
		function DFS(item , callback){
			if(!item) return;
			if ( item.get('data')){
				callback (item);
				return;
			}
			let innerFeatures = item.get('featuresInCluster');
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
			if( Sources) {
				Sources.forEach(function(source){

					var clusterSource = new n2es6.ol5support.N2Cluster({
						distance : 20,
						source: source
					});
					var vectorLayer = new VectorLayer({
						title: "CouchDb",
						source: clusterSource,
						renderOrder: function(feature1, feature2){
							return $n2.olUtils.ol5FeatureSorting(feature1, feature2);
						}
					});
//					var layerOptions = _this.overlayInfos.shift();
//					var layerStyleMap = createStyleMap(layerOptions._layerInfo);
//					vectorLayer.set('styleMap', layerStyleMap);
					fg.push(vectorLayer);
				});

			}
			return (fg);
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
