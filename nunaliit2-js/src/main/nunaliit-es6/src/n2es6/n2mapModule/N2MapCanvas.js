/**
 * @module n2es6/n2mapModule/N2MapCanvas
 */

import 'ol/ol.css';
import {default as CouchDbSource} from './N2CouchDbSource.js';
import N2ModelSource from './N2ModelSource.js';
import {default as LayerInfo} from './N2LayerInfo';
import {default as N2MapStyles} from './N2MapStyles.js';

import WMTS from 'ol/source/WMTS.js';
import {default as N2Select} from './N2Select.js';
import {default as N2SourceWithN2Intent} from './N2SourceWithN2Intent.js';

import Map from 'ol/Map.js';
import {default as VectorLayer} from 'ol/layer/Vector.js';
import {default as LayerGroup} from 'ol/layer/Group.js';
import {default as View} from 'ol/View.js';
import {default as N2DonutCluster} from '../ol5support/N2DonutCluster.js';
//import {default as N2Cluster} from '../ol5support/N2Cluster.js';
import { N2SolidLinkSource, N2DottedLinkSource } from './N2LinkSource.js';

import Panzoom from '@panzoom/panzoom';

import {extend, isEmpty, getTopLeft, getWidth} from 'ol/extent.js';
import {transform, getTransform, transformExtent, get as getProjection} from 'ol/proj.js';
import {default as Projection} from 'ol/proj/Projection.js';
import Tile from 'ol/layer/Tile.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import WKT from 'ol/format/WKT';

import mouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import {defaults as defaultsInteractionSet} from 'ol/interaction.js';

import {default as DrawInteraction} from 'ol/interaction/Draw.js';
import StadiaMaps from '../olSources/StadiaMaps.js';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import BingMaps from 'ol/source/BingMaps';
import TileWMS from 'ol/source/TileWMS';
import LayerSwitcher from 'ol-layerswitcher';
import 'ol-layerswitcher/dist/ol-layerswitcher.css';

import {defaults as Defaults} from 'ol/control';

import 'ol-ext/dist/ol-ext.css';
import Bar from 'ol-ext/control/Bar';
import EditBar from './EditBar';
import Toggle from 'ol-ext/control/Toggle';
import Popup from 'ol-ext/overlay/Popup';
import SettingsControl from './SettingsControl.js';

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvasMap';

//--------------------------------------------------------------------------
/*
 *This canvas displays a map based on OpenLayers5.
 */
//--------------------------------------------------------------------------
const VENDOR =	{
		GOOGLEMAP : 'googlemaps',
		BING : 'bing',
		WMS : 'wms',
		WMTS: 'wmts',
		OSM : 'osm',
		XYZ: 'xyz',
		STAMEN : 'stamen',
		STADIA: 'stadia',
		IMAGE : 'image',
		COUCHDB : 'couchdb'
};

const DONUT_VECTOR_LAYER_DISPLAY_NAME = "Rings";
const SOLID_LINE_VECTOR_LAYER_DISPLAY_NAME = "Solid Links";
const DASHED_LINE_VECTOR_LAYER_DISPLAY_NAME = "Dotted Links";
const MAX_MAP_ZOOM_LEVEL = 22;
const DEFAULT_MAP_FEATURE_ZOOM_LEVEL = 10;

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
		this.options = opts;
		this._classname = 'N2MapCanvas';
		this.dispatchService  = null;
		this._suppressSetHash = false;
		this.showService = null;
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.interactionId = opts.interactionId;
		this.elementGenerator = opts.elementGenerator;

		var config = opts.config;
		if( config ){
			if( config.directory ){
				this.dispatchService = config.directory.dispatchService;
				this.showService = config.directory.showService;
				this.customService = config.directory.customService;
				opts.directory = config.directory;
			}
		}

		this.sources = [];
		this.overlayInfos = [];
		this.mapLayers = [];
		this.overlayLayers = [];
		this.center = undefined;
		this.resolution = undefined;
		this.proj = undefined;
		this.lastTime = null;
		this.initialTime = null;
		this.endIdx = 0;
		this.refreshCnt = undefined;
		this.isClustering = undefined;
		this.n2View = undefined;
		this.n2Map = undefined;
		this.popupOverlay = undefined;
		this.n2MapStyles = new N2MapStyles();
		this.editbarControl = null;
		this.editLayerSource = undefined;
		this.refreshCallback = null;

		this.canvasName = null;
		if (this.options && this.options.canvasName) {
			this.canvasName = this.options.canvasName;
		}

		if ( this.customService ){
			var customService = this.customService;
			if ( !this.refreshCallback ){
				var cb = customService.getOption('mapRefreshCallback' );
				if ( typeof cb === 'function' ){
					this.refreshCallback = cb;
				}
			}
		}

		this.interactionSet = {
			selectInteraction : null,
			drawInteraction : null
		};
		this.currentInteract = null;
		this.n2intentWrapper = null;
		this._processOverlay(opts.overlays);
		this.editFeatureInfo = {
			original: {}
		};
		
		// MODES
		var addOrEditLabel = _loc('Add or Edit a Map Feature');
		var cancelLabel = _loc('Cancel Feature Editing');
		
		this.modes = {
			NAVIGATE: {
				name: "NAVIGATE"
				,buttonValue: addOrEditLabel
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}

				,onStartClick: function(feature, mapFeature) {
					//_this.initAndDisplayClickedPlaceInfo(feature);
				}

				,onEndClick: function(feature) {}

				,featureAdded: function(feature) {}
			}
			,ADD_OR_SELECT_FEATURE: {
				name: "ADD_OR_SELECT"
				,buttonValue: cancelLabel
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}

				,onStartClick: function(mapFeature) {
					var editAllowed = true;
					if( mapFeature.cluster && mapFeature.cluster.length > 1 ) {
						alert( _loc('This feature is a cluster and can not be edited directly. Please, zoom in to see features within cluster.') );
						editAllowed = false;
					}
					
					if( editAllowed ) {
						_this._dispatch({
							type: 'editInitiate'
							,doc: mapFeature.data
						});
					}
				}

				,onEndClick: function(feature) {}

				,featureAdded: function(feature) {
					_this.editFeatureInfo.original = {};
					_this.editFeatureInfo.fid = undefined;
					_this.editFeatureInfo.suppressZoom = true;
					var geometry = feature.getGeometry();
					var mapProj = new Projection({code: 'EPSG:3857'});

					_this.dispatchService.send(DH, {
						type: 'editCreateFromGeometry'
						,geometry: geometry
						,projection: mapProj
						,_origin: _this
					});
				}
			}
			,ADD_GEOMETRY: {
				name: "ADD_GEOMETRY"
				,buttonValue: cancelLabel
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				,featureAdded: function(feature) {
					var proj = null;
					if (feature 
						&& feature.layer 
						&& feature.layer.map) {
						proj = feature.layer.map.getProjectionObject();
					}
					
					_this._dispatch({
						type: 'mapGeometryAdded'
						,geometry: feature.geometry
						,projection: proj
					});
				}
			}
			,EDIT_FEATURE: {
				name: "EDIT_FEATURE"
				,buttonValue: cancelLabel
				,featureAdded: function(feature) {
				}
			}
		};

		this.currentMode = this.modes.NAVIGATE;
		this.createMapInteractionSwitch();
		
		var authService = this._getAuthService();
		if (authService) {
			authService.addListeners(function(currentUser){
				_this.loginStateChanged(currentUser);
			});
		}
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m){
				_this._handleDispatch(m);
			};
			this.dispatchService.register(DH, 'n2ViewAnimation', f);
			this.dispatchService.register(DH, 'n2rerender', f);
			this.dispatchService.register(DH, 'time_interval_change', f);
			this.dispatchService.register(DH, 'renderStyledTranscript', f);
			this.dispatchService.register(DH, 'mapExtentRequest', f);
			this.dispatchService.register(DH, 'mapFitExtent', f);
			this.dispatchService.register(DH, 'focusOn', f);
			this.dispatchService.register(DH, 'mapRefreshCallbackRequest', f);
			this.dispatchService.register(DH, 'resolutionRequest', f);
			this.dispatchService.register(DH, 'editInitiate', f);
			this.dispatchService.register(DH, 'editClosed', f);
			this.dispatchService.register(DH, 'canvasGetStylesInUse', f);
			this.dispatchService.register(DH, 'cinemapToMapSettingsUpdate', f);
		}

		$n2.log(this._classname,this);

		this.bgSources = opts.backgrounds || [];
		this.coordinates = opts.coordinates || null;
		this.renderOrderBasedOn = opts.renderOrderBasedOn || undefined;
		
		if (this.renderOrderBasedOn
			&& this.renderOrderBasedOn[0] === '='){
			try {
				var targetString = this.renderOrderBasedOn.substr(1);
				if (targetString.startsWith("doc")){
					targetString = targetString.substr(3);
					targetString = "data"+ targetString;
				}
				this.renderOrderBasedOn = $n2.styleRuleParser.parse(
						targetString);
			} catch(e) {
				this.renderOrderBasedOn = e;
			}
		}
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styles);
		this.fitMapToLatestMapTag = true;
		this.animateMapFitting = true;
		this.showRelatedImages = true;
		this.hideFeatureIfMapZoom = false;
		
		this.settingsControl = null;

		this.solidLinkSource = new N2SolidLinkSource();
		this.dottedLinkSource = new N2DottedLinkSource();
		
		this.mediaDrawerState = {
			drawer: null,
			containerElement: null,
			imageStates: []
		};

		this.initialFeatureDisplayType = opts.initialFeatureDisplay || "all";
		this.initialCinemapToMapSettings = opts.initialCinemapToMapSettings;
		this._setInitialCinemapToMapSettings();
		this._drawMap();
		opts.onSuccess();
	}

	/**
	 * Preprocess the opts.overlay. Producing overlay-sources array
	 * and overlay-infos array.
	 * @param {Array} overlays - List of overlays provided by a module's canvas.json. 
	 */
	_processOverlay(overlays) {

		var _this = this;
		if (!$n2.isArray(overlays)) {
			overlays = [overlays];
		}
			
		overlays.forEach( (function(overlay) {
			// Generate Array<layerInfo> layerInfos;
			var source;
			var layerInfoOptions = overlay;
			var layerInfo = new LayerInfo(layerInfoOptions);
			var layerOptions = {
				name: layerInfo.name
				,projection: layerInfo.sourceProjection
				,visibility: layerInfo.visibility
				,_layerInfo: layerInfo
				,clustering: overlay.clustering
			};
			var getSourceModelId = function(overlay){
				var sourceModelId;
				if (overlay.options
					&& 'string' === typeof overlay.options.sourceModelId) {
					sourceModelId = overlay.options.sourceModelId;

				} else if (overlay.options
					&& 'string' === typeof overlay.options.layerName) {
					sourceModelId = overlay.options.layerName;

				} else {
					$n2.logError('Map canvas overlay is not named. Will be ignored');
				}
				return sourceModelId;				
			};

			this.overlayInfos.push(layerOptions);

			//---------------------
			if ('couchdb' === overlay.type) {
				let sourceModelId = undefined;
				sourceModelId = getSourceModelId(overlay);

				if (sourceModelId) {
					source = new CouchDbSource({
						sourceModelId: sourceModelId
						,dispatchService: this.dispatchService
						,projCode: 'EPSG:3857'
					});
					this.sources.push(source);
				}

			} else if ('model' === overlay.type) {
				let sourceModelId = undefined;
				sourceModelId = getSourceModelId(overlay);

				if( sourceModelId ){
					source = new N2ModelSource({
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
					
					var listenerKey = source.on('change', function(e) {
						if (source.getState() == 'ready') {
							if (!_this.refreshCnt) {
								_this.refreshCnt = 1;
							}

							var curCnt = _this.refreshCnt;
							_this.dispatchService.send(DH, {
								type: 'mapRefreshCallbackRequest',
								cnt:curCnt
							});
							_this.refreshCnt++;
						}
					});
					// unByKey(listenerKey);
					this.sources.push(source);
				}

			} else if ('wfs' === overlay.type) {
				$n2.logError(overlay.type + 'is constructing');
				this.sources.push({});

			} else {
				$n2.logError('Can not handle overlay type: '+overlay.type);
				this.sources.push({});
			}

		}).bind(this) );
	}

	// === LOGIN STUFF START ========================================================

	/*
	 * function: auth module listener for login state changes.	Only called if the auth
	 * module is loaded so checks of that inside this function are not useful.
	 * 
	 * Once installed by the subsequent call to addListener(), this is immediately
	 * called and then whenever a login state change is detected.
	 */
	loginStateChanged(currentUser) {
		var showLogin = false;

		if( null == currentUser ) {
			showLogin = true;
		}

		if( showLogin ) {
			this.hideMapInteractionSwitch();
			this._switchMapMode(this.modes.NAVIGATE);

		} else {
			this.showMapInteractionSwitch();
		}
	}
	// === LOGIN STUFF END ========================================================

	// Get the jQuery selection of the 'Add or Edit a Map Feature' button
	_getMapInteractionSwitch() {
		return $("#" + this.interactionId)
			.find('.n2map_map_interaction_switch');
	}

	// Hide 'Add or Edit a Map Feature' button
	hideMapInteractionSwitch() {
		this._getMapInteractionSwitch().hide();
	}
	
	showMapInteractionSwitch() {
		this._getMapInteractionSwitch().show();
	}

	// Create and Add the 'Add or Edit a Map Feature' button to the map canvas.
	createMapInteractionSwitch() {
		var _this = this;
		var mapInteractionButton = $('<input>')
			.attr('type', 'button')
			.addClass('n2map_map_interaction_switch')
			.val(this.modes.NAVIGATE.buttonValue)
			.click(function(evt) {
				_this._clickedMapInteractionSwitch(evt);
			});

		$("#" + this.interactionId)
			.empty()
			.append(mapInteractionButton);
	}
	
	_clickedMapInteractionSwitch(e) {
		if( this.currentMode === this.modes.NAVIGATE ) {
			this.switchToEditMode();
			
		} else if( this.currentMode === this.modes.ADD_OR_SELECT_FEATURE ) {
			this._switchMapMode(this.modes.NAVIGATE);
			
		} else if( this.currentMode === this.modes.ADD_GEOMETRY ) {
			this._switchMapMode(this.modes.NAVIGATE);
			this.editLayerSource.clear();
			//this.editLayerSource.clear();
			this._cancelEditFeatureMode();
			
		} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
			this._switchMapMode(this.modes.NAVIGATE);
			this.editLayerSource.clear();
			this._cancelEditFeatureMode();
		}
		return false;
	}
	
	/**
	 * 
	 * @param {object} mode 
	 * @param {object} opts 
	 */
	//TODO the final function for different mode
	_switchMapMode(mode, opts) {
		if( this.currentMode === mode ) {
			// nothing to do
			return;
		}

		// Apply new mode
		this.currentMode = mode;
		if (this.n2intentWrapper) {
			this.n2intentWrapper.onInterationModeChanged(mode.name);
		}

		this._getMapInteractionSwitch().val(mode.buttonValue);
		if (this.currentMode === this.modes.ADD_OR_SELECT_FEATURE) {

			this.editbarControl.setVisible(true);
			this.editbarControl.setModifyWithSelect(true);
			this.editbarControl.deactivateControls();
			this.editbarControl.setActive(true);

		} else if (this.currentMode === this.modes.ADD_GEOMETRY) {

		} else if (this.currentMode === this.modes.EDIT_FEATURE) {
			//var editFeature = opts.feature;
			//this._installGeometryEditor(editFeature);
			this.editbarControl.deactivateControls();
			this.editbarControl.setModifyWithSelect(true);
			this.editbarControl.setActive(true);
			
			
		} else if (this.currentMode === this.modes.NAVIGATE) {
			this.editbarControl.deactivateControls();
			this.editbarControl.setModifyWithSelect(false);
			this.editbarControl.setActive(true);
			this.editbarControl.deactivateModify();
			this.editbarControl.setVisible(false);
			this.editLayerSource.clear();
			//this.activateSelectFeatureControl();
		}

		// Broadcast mode change
		var dispatcher = this._getDispatchService();
		if (dispatcher) {
			dispatcher.send(DH,{
				type: 'mapReportMode'
				,mapControl: this
				,mode: this.currentMode.name
			});
		}
	}

	switchToEditMode() {
		var _this = this;
		
		var authService = this._getAuthService();
		if (authService) {
			var logInRequired = true;
			
			// The auth module is present, check if user logged in
			// and is not anonymous
			var userNotAnonymous = authService.isLoggedIn();
			if (userNotAnonymous) {
				logInRequired = false;
			}
			
			if (logInRequired) {
				// User is not logged in
				authService.showLoginForm({
					prompt: '<p>You must log in as a registered user to add a point to the map.</p>'
					,anonymousLoginAllowed: false
					,onSuccess: function(){ _this.switchToEditMode(); }
				});

			} else {
				// Already logged in, just switch
				this._switchMapMode(this.modes.ADD_OR_SELECT_FEATURE);
			}

		} else {
			alert("Authentication module not installed.");
		}
	}
	
	switchToEditFeatureMode(fid, feature) {
		this._switchMapMode(this.modes.EDIT_FEATURE,{
			fid: fid
			,feature: feature
		});
	}
	
	switchToAddGeometryMode(docId) {
		this._switchMapMode(this.modes.ADD_GEOMETRY,{
			fid: docId
		});
	}
	
	_cancelEditFeatureMode() {
		this._dispatch({
			type: 'editCancel'
		});
	}
	
	// Get the AuthService Object
	_getAuthService() {
		var auth = null;
			
		if (this.options.directory) {
			auth = this.options.directory.authService;
		}
			
		return auth;
	}

	_mapBusyStatus(delta) {
		
		// TODO new version of progressControl
		// Original implementation place here for reference
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

	// Get the map canvas element
	_getElem() {
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		}
		return $elem;
	}

	// Create a OpenLayers Map Object
	_drawMap() {
		var _this = this;

		const olView = new View({
			center: transform([-75, 45.5], 'EPSG:4326', 'EPSG:3857'),
			projection: 'EPSG:3857',
			maxZoom: 22,
			zoom: 6
		});

		this.n2View = olView;
		const customMap = new Map({
			interactions: defaultsInteractionSet({mouseWheelZoom : false}).extend([
				new mouseWheelZoom({
					duration: 200,
					constrainResolution: false
				})
			]),
			target : this.canvasId,
			view: olView,
			controls: Defaults({
				attribution: true,
				attributionOptions: {
					collapsible: false,
					collapsed: false
				},
				rotate: false,
				zoom: true,
				zoomOptions: {
					zoomInTipLabel: _loc("Zoom In"),
					zoomOutTipLabel: _loc("Zoom Out")
				}
			})
		});

		this.n2Map = customMap;
		this.n2MapStyles.setMap(customMap);

		//Config the initial bound on the ol5 map
		if (this.coordinates && !this.coordinates.autoInitialBounds) {
			let bbox = this.coordinates.initialBounds;
			let boundInProj = bbox;
			const configSRSName = this.coordinates.srsName || "EPSG:4326";
			const configProjection = new Projection({code: configSRSName});
			if (configProjection.getCode() !== this.n2Map.getView().getProjection().getCode()) {
				boundInProj = transformExtent(bbox,
						configProjection,
						new Projection({code: 'EPSG:3857'})
				);
			}

			customMap.once('postrender', function(evt){
				let res = evt.frameState.viewState.resolution;
				let proj = _this.n2View.getProjection();
				let zoom = evt.frameState.viewState.zoom;
				let center = evt.frameState.viewState.center;
				_this.resolution = res;
				var extent = olView.calculateExtent();
				_this.sources.forEach(function(source){
					source.onChangedResolution(res,proj, extent);
				});
				
				var coor_string = center.join(',') + ',' + zoom + 'z';
				_this.dispatchService.send(DH, {
					type: 'viewChanged'
					,coordination: coor_string
					,_suppressSetHash : _this._suppressSetHash
				});
				customMap.getView().fit(boundInProj, {size:customMap.getSize()});
			});
		}

		//Getting the resolution whenever a frame finish rendering;
		customMap.on('postrender', function(evt){
			let res = evt.frameState.viewState.resolution;
			let proj = _this.n2View.getProjection();
			_this.resolution = res;
			_this.proj = proj;
			_this._updatedStylesInUse();
		});
		//=======================================
	
		//Listening on the map move and resolution changes.
		//Everytime a change is detected. The N2CouchDbSource/N2ModelSource will be update
		customMap.on('movestart', onMoveStart);

		function onMoveStart(evt) {
			customMap.once('moveend', function(evt) {
				//Clearing the popup
				if (_this.popupOverlay) {
					_this.popupOverlay.hide();
				}

				let res = evt.frameState.viewState.resolution;
				let proj = _this.n2View.getProjection();
				let zoom = evt.frameState.viewState.zoom;
				let center = evt.frameState.viewState.center;
				_this.resolution = res;
				_this.proj = proj;
				var extent = olView.calculateExtent();
				_this.sources.forEach(function(source){
					source.onChangedResolution(res,proj, extent);
				});
				
				var coor_string = center.join(',') + ',' + zoom + 'z';
				_this.dispatchService.send(DH, {
					type: 'viewChanged'
					,coordination: coor_string
					,_suppressSetHash : _this._suppressSetHash
				});

				_this._updatedStylesInUse();
			})
		}
		//========================================
		
		this.interactionSet.selectInteraction = new N2Select({map: customMap});
		//	create and add layers
		this.overlayLayers = this._genOverlayMapLayers(this.sources);
		this.mapLayers = this._genBackgroundMapLayers(this.bgSources);

		var customPopup= new Popup({
			popupClass: "",
			positioning: 'auto',
			autoPan: false
		});

		this.popupOverlay = customPopup;
		this.n2Map.addOverlay(customPopup);

		/**
		 * Two Groups : Overlay and Background
		 */
		customMap.set("layergroup",
			new LayerGroup({layers: [
				new LayerGroup({
					title: _loc('Background'),
					layers: this.mapLayers
				}), 
				new LayerGroup({
					title: _loc('Overlays'),
					layers: [
						new LayerGroup({
							title: _loc(DONUT_VECTOR_LAYER_DISPLAY_NAME),
							layers: this.overlayLayers
						})
					]	
				})
			]})
		);

		customMap.addControl(
			new LayerSwitcher({
				activationMode: "click",
				startActive: false,
				label: "",
				collapseLabel: "",
				tipLabel: _loc("Layer Selector"),
				collapseTipLabel: _loc("Layer Selector")
			})
		);

		this.settingsControl = new SettingsControl({
			dispatchService: this.dispatchService,
			settings: [
				{
					label: _loc("Auto-recenter map"),
					hint: _loc("Pan and zoom map to tagged places (takes zoomScale value into consideration)"),
					key: "fitMapToLatestMapTag",
					initialState: this.fitMapToLatestMapTag,
					sublevel: 0
				},
				{
					label: _loc("Animate"),
					hint: _loc("Animate pan and zoom action"),
					key: "animateMapFitting",
					initialState: this.animateMapFitting,
					sublevel: 1
				},
				{
					label: _loc("Display images"),
					hint: _loc("Display image attachment pane when tagged text contains image attachment"),
					key: "showRelatedImages",
					initialState: this.showRelatedImages,
					sublevel: 0
				},
				{
					label: _loc("Zoom threshold"),
					hint: _loc("Map symbols associated with a given place disappear when zoom level is above the place's zoomScale value"),
					key: "hideFeatureIfMapZoom",
					initialState: this.hideFeatureIfMapZoom,
					sublevel: 0
				},
				{
					label: _loc("Cluster symbols"),
					hint: _loc("Aggregate rings and links when zoomed out"),
					key: "isClustering",
					initialState: this.isClustering,
					sublevel: 0
				}
			]
		})
		customMap.addControl(this.settingsControl);

		// Add selection tool (a toggle control with a select interaction)
		var selectCtrl = new Toggle({
				html: "",
				className: "select",
				title: "Toggle selection tool",
				interaction: this.interactionSet.selectInteraction,
				active:true,
				onToggle: function(active) {}
		});

		this.interactionSet.selectInteraction.on("clicked", (function(e) {

			if (e.selected) {
				if (_this.currentMode === _this.modes.NAVIGATE) {
					this._retrivingDocsAndSendSelectedEvent(e.selected);
					if (this.currentMode.onStartClick) {
						if (e.selected.length === 1) {
							var feature = e.selected[0];
							this.currentMode.onStartClick(feature);
						}
					}

				} else {
					if (this.currentMode.onStartClick) {
						if ( e.selected.length === 1 ){
							var feature = e.selected[0];
							this.currentMode.onStartClick(feature);
						}
					}
				}
			}
		}).bind(this));
		
		this.interactionSet.selectInteraction.on("hover", (function(e) {
			var mapBrowserEvent = e.upstreamEvent;
			if (e.deselected) {
				var popup = _this.popupOverlay;
				popup.hide();
			}
			if (e.selected) {
				this._showPopup(e.selected, mapBrowserEvent);
			}
		}).bind(this));
		
		// This button has been broken since who knows when but it keeps the hover popups working so leave it shoved in the corner
		customMap.addControl(selectCtrl);

		this.interactionSet.drawInteraction = new DrawInteraction({
			type: 'Point',
			source: this.overlayLayers[0].getSource()
		});

		this.mediaDrawerState.drawer = new nunaliit2.ui.drawer({
			containerId: "content",
			width: "500px",
			addClasses: "relatedMediaDisplayDrawer",
			customizedContentFn: (drawerOptions) => {
				const {	container } = drawerOptions;
				this.mediaDrawerState.containerElement = container;
			}
		});
	}

	onMoveendCallback(evt){}

	editModeAddFeatureCallback(evt){
		var feature = evt.feature;
		var previousMode = this.currentMode;
		this.switchToEditFeatureMode(feature.fid, feature);
		previousMode.featureAdded(feature);
		this._centerMapOnFeature(feature);
	}

	_dispatch(m){
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			dispatcher.send(DH,m);
		}
	}

	_showPopup(feature, mapBrowserEvent) {
		const _this = this;
		if (_this.popupOverlay) {
			const popup = _this.popupOverlay;
			let featurePopupHtmlFn = null;
			if (!$n2.isArray(feature)) {
				if (_this.customService) {
					const cb = _this.customService.getOption('mapFeaturePopupCallback');
					if (typeof cb === 'function') {
						featurePopupHtmlFn = cb;
					}
				}
				if (featurePopupHtmlFn) {
					featurePopupHtmlFn({
						feature: feature
						, onSuccess: function (content) {
							var mousepoint = mapBrowserEvent.coordinate;
							popup.show(mousepoint, content);
						}
						, onError: () => {}
					});
				}
			}
		}
	}
	
	_clusterFeatures(state) {
		const donutLayer = this.overlayLayers.find(layer => {
			return layer.get("alias") === DONUT_VECTOR_LAYER_DISPLAY_NAME;
		});

		if (state && this.isClustering) {
			let c_source =	donutLayer.getSource();
			donutLayer.setSource(null);
			let a_source = c_source.getSource();
			let b_source = new N2DonutCluster({source: a_source});
			b_source.setSource(a_source)
			c_source = new N2SourceWithN2Intent({
				interaction: this.interactionSet.selectInteraction,
				source: b_source,
				dispatchService: this.dispatchService,
				linkCallback: (features) => {
					this.solidLinkSource.refreshCallback(features);
					this.dottedLinkSource.refreshCallback(features);
				}
			});	
			donutLayer.setSource(c_source);
			this.isClustering = true;
		}
		else if (!state && !this.isClustering) {
			let c_source =	donutLayer.getSource();
			let b_source = c_source.getSource();
			let a_source = b_source.getSource();
			c_source.setSource(a_source);
			b_source.setSource(null);
			a_source.changed();
			this.isClustering = false;
		}
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
				});

			} else if (1 < validFeatures.length) {

				let docIds = [];
				validFeatures.forEach(function(elem) {
					docIds.push(elem.data._id);
				})

				_this.dispatchService.send(DH,{
					type: 'userSelect'
						,docIds: docIds
				});
			}
		}

		function DFS(item, callback) {
			if (!item) return;
			if (item.data || typeof item.data === 'number') {
				callback (item);
				return;
			}

			let innerFeatures = item.cluster;
			if (innerFeatures && Array.isArray(innerFeatures)) {
				for (let i=0,e=innerFeatures.length; i< e; i++) {
					DFS(innerFeatures[i], callback);
				}
			}
		}
	}

	/**
	 * Create OpenLayers layers from source objects produced by the _processOverlay(). 
	 * @param {array} Sources - Array of map overlay source objects
	 * @returns {array} fg - An array of foreground overlay vector layers
	 */
	_genOverlayMapLayers(Sources) {
		var fg = [];
		var _this = this;

		/* Generate styles read in from canvas.json */
		function featureStyler(feature) {

			/* 
				If the map is zoomed in at a certain level and features with defined zoom scales
				are less than the map's zoom level, do not return a style for that feature.
				Not returning a style means that the feature does not display and
				does not have hit detection.

				Example: A feature has placeZoomScale of 10 and the map is currently at
				zoom level 20 (very zoomed in). The feature meant to be viewed at zoom level 10
				should not display.
			*/
			if (feature && feature.data && feature.data._ldata &&
				feature.data._ldata.placeZoomScale &&
				_this.hideFeatureIfMapZoom &&
				_this.n2Map.getView().getZoom() > feature.data._ldata.placeZoomScale) {
					feature.set("isVisible", false, false)
					return;
			}

			feature.set("isVisible", true, false);
			_this._enrichFeature(feature);

			const style = _this.styleRules.getStyle(feature);
			const symbolizer = style.getSymbolizer(feature);
			const symbols = {};
			symbolizer.forEachSymbol(function (name, value) {
				name = olStyleNames[name] ? olStyleNames[name] : name;

				if (stringStyles[name]) {
					if (null === value) {
						// Nothing
					} else if (typeof value === 'number') {
						value = value.toString();
					}
				}
				symbols[name] = value;
			}, feature);

			const n2mapStyles = _this.n2MapStyles;
			let innerStyle = n2mapStyles.loadStyleFromN2Symbolizer(symbols, feature);
			innerStyle = Array.isArray(innerStyle) ? innerStyle : [innerStyle];
			return innerStyle;
		}
		
		if (Sources) {
			for (var i = 0, e = Sources.length; i < e; i++){
				var overlayInfo = _this.overlayInfos[i];
				var alphasource = Sources[i];
				var betaSource = alphasource;
				if (overlayInfo.clustering) {
					if ( typeof _this.isClustering === 'undefined'){
						_this.isClustering = true;
					}
					var clsOpt = Object.assign({}, overlayInfo.clustering
							,{source: alphasource});
					betaSource = new N2DonutCluster(clsOpt);
//					betaSource = new N2Cluster(clsOpt);
				}

				var charlieSource = new N2SourceWithN2Intent({
					interaction: _this.interactionSet.selectInteraction,
					source: betaSource,
					wrapX: false,
					dispatchService: _this.dispatchService,
					linkCallback: (features) => {
						this.solidLinkSource.refreshCallback(features);
						this.dottedLinkSource.refreshCallback(features);
					}
				});

				_this.n2intentWrapper = charlieSource;
				
				const ringLayer = new VectorLayer({
					renderMode : 'vector',
					source: charlieSource,
					style: featureStyler,
					renderBuffer: 1000000000,
					renderOrder: function(feature1, feature2){
						var valueSelector = _this.renderOrderBasedOn;

						if ( typeof valueSelector === 'object'
							&& typeof valueSelector.getValue(feature1) === 'number'){
								
							var l = valueSelector.getValue(feature1),
								r = valueSelector.getValue(feature2);
							if (typeof l === 'number' && typeof r === 'number'){
								if (l < r){
									return -1;
								} else if(l > r){
									return 1;
								} else {
									return 0;
								}
							}
						} else {
							return $n2.olUtils.ol5FeatureSorting(feature1, feature2);
						}
					}
				});
				ringLayer.set("alias", DONUT_VECTOR_LAYER_DISPLAY_NAME, false);
				
				const solidLinkLayer = new VectorLayer({
					title: _loc(SOLID_LINE_VECTOR_LAYER_DISPLAY_NAME),
					renderMode: "vector",
					/*visible: false [if we do not want Links selected by default] */
					source: this.solidLinkSource,
					style: this.solidLinkSource.stylerFunction,
				});

				const dottedLinkLayer = new VectorLayer({
					title: _loc(DASHED_LINE_VECTOR_LAYER_DISPLAY_NAME),
					renderMode: "vector",
					/*visible: false [if we do not want Links selected by default] */
					source: this.dottedLinkSource,
					style: this.dottedLinkSource.stylerFunction,
				});

				solidLinkLayer.set("alias", SOLID_LINE_VECTOR_LAYER_DISPLAY_NAME, false);
				dottedLinkLayer.set("alias", DASHED_LINE_VECTOR_LAYER_DISPLAY_NAME, false);

				solidLinkLayer.on("change:visible", () => {
					if (!ringLayer.getVisible()) {
						solidLinkLayer.setVisible(false);
					}
				});
				dottedLinkLayer.on("change:visible", () => {
					if (!ringLayer.getVisible()) {
						dottedLinkLayer.setVisible(false);
					}
				});

				/* "all" is the default case where everything shows initially */
				if (this.initialFeatureDisplayType === "none") {
					ringLayer.setVisible(false);
					solidLinkLayer.setVisible(false);
					dottedLinkLayer.setVisible(false);
				}
				else if (this.initialFeatureDisplayType === "donut") {
					solidLinkLayer.setVisible(false);
					dottedLinkLayer.setVisible(false);
				}

				fg.push(ringLayer);
				fg.push(dottedLinkLayer);
				fg.push(solidLinkLayer);
			}
		}
		return (fg);
	}

	/**
	 * Create OpenLayers layers based on background objects. 
	 * @param {array} bgSources - Array of background objects provided by the canvas.json 
	 * @returns {object} bg - Created background layer
	 */
	_genBackgroundMapLayers(bgSources) {
		var bg = null;

		function _computeDefaultLayer(backgrounds, idx) {
			var i, e, layerDefinition;
			if (typeof _computeDefaultLayer.defaultLayerIdx == 'undefined' ) {
				_computeDefaultLayer.defaultLayerIdx = -1;
			}

			if (_computeDefaultLayer.defaultLayerIdx === -1 ) {
				_computeDefaultLayer.defaultLayerIdx = 0;
				for (i = 0, e = backgrounds.length; i < e; ++i) {
					layerDefinition = backgrounds[i];
					if (typeof (layerDefinition.defaultLayer) !== 'undefined'
						&& layerDefinition.defaultLayer ) {
						_computeDefaultLayer.defaultLayerIdx = i;
					}
				}
			}
			return (_computeDefaultLayer.defaultLayerIdx === idx);
		}

		if (bgSources) {
			// This is the method used when background layers are specified
			// via couchModule
			for (var i=0,e=bgSources.length; i<e; ++i) {
				var layerDefiniton = bgSources[i];
				var l = this._createOLLayerFromDefinition(layerDefiniton,
					_computeDefaultLayer( bgSources , i)
				);

				if( l && !bg ) bg = [];
				if( l ) bg[bg.length] = l;
			}
		}
		return(bg);
	}

	/**
	 * Creates an OpenLayer 5 Tile object, from the layer definition.
	 * @param {object} layerDefinition - Background layer definition defined in the module's canvas.json 
	 * in the backgrounds array. 
	 * @param {boolean} isDefaultLayer 
	 */
	_createOLLayerFromDefinition(layerDefinition, isDefaultLayer) {
		var name = _loc(layerDefinition.name);
		var _this = this;

		if (layerDefinition) {
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
		}
	}

	/**
	 * Creates an OpenLayers 5 Background map source object based on the supplied layer definition type.
	 * @param {object} layerDefinition - Background layer definition defined in the module's canvas.json 
	 * in the backgrounds array. 
	 */
	_createBackgroundMapSource (layerDefinition) {
		var sourceTypeInternal =
			layerDefinition.type.replace(/\W/g,'').toLowerCase();
		var sourceOptionsInternal = layerDefinition.options;
		var name = layerDefinition.name;
		
		if (sourceTypeInternal === VENDOR.GOOGLEMAP) {
			$n2.log('Background of Google map is under construction');

		} else if (sourceTypeInternal === VENDOR.BING) {
			return new BingMaps(sourceOptionsInternal);

		} else if (sourceTypeInternal === VENDOR.WMS) {
			if (sourceOptionsInternal
				&& sourceOptionsInternal.url
				&& sourceOptionsInternal.layers
				&& sourceOptionsInternal.styles) {
				var parameters = {};

				for (var key in sourceOptionsInternal) {
					if ('LAYERS' === key.toUpperCase()
						|| 'STYLES' === key.toUpperCase()
						|| 'WIDTH' === key.toUpperCase()
						|| 'VERSION' === key.toUpperCase()
						||	'HEIGHT'  === key.toUpperCase()
						||	'BBOX' === key.toUpperCase()
						||	'CRS'=== key.toUpperCase()){

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

		} else if (sourceTypeInternal === VENDOR.WMTS) {
			var options = sourceOptionsInternal;
			if (options) {
				var wmtsOpt = {
					url: null
					,layer: null
					,matrixSet: null
					,projection: null
					,style: null
					,wrapX: false
				};
				
				if (options.matrixSet && options.numZoomLevels) {
					var projection = getProjection(options.matrixSet);
					var projectionExtent = projection.getExtent();
					var numofzoom = parseInt(options.numZoomLevels);
					var size = getWidth(projectionExtent) / 256;
					var resolutions = new Array(numofzoom);
					var matrixIds = new Array(numofzoom);
					for (var z = 0; z < numofzoom; ++z) {
						// generate resolutions and matrixIds arrays for this WMTS
						resolutions[z] = size / Math.pow(2, z);
						matrixIds[z] = options.matrixSet + ":" + z;
					}
					
					wmtsOpt.projection = projection;
					wmtsOpt.tileGrid = new WMTSTileGrid({
						origin: getTopLeft(projectionExtent),
						resolutions: resolutions,
						matrixIds: matrixIds
					});
				}
				
				for (var key in options) {
					wmtsOpt[key] = options[key];
				}

				return new WMTS(wmtsOpt);

			} else {
				$n2.reportError('Bad configuration for layer: '+name);
				return null;
			}

		} else if ( sourceTypeInternal === VENDOR.OSM) {

			if (sourceOptionsInternal
				&& sourceOptionsInternal.url ){
				return new OSM({
					url : sourceOptionsInternal.url
				});

			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal );
			}

		} else if ( sourceTypeInternal === VENDOR.XYZ) {
			if (sourceOptionsInternal
				&& sourceOptionsInternal.url ){
					const {
						url,
						maxZoom,
						minZoom,
						wrapX
					} = sourceOptionsInternal;
					return new XYZ({
						url: url,
						maxZoom: maxZoom ? maxZoom : 42,
						minZoom: minZoom ? minZoom : 0,
						wrapX: typeof wrapX === "boolean" ? wrapX : true
					});

			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}
		} else if (sourceTypeInternal === VENDOR.STAMEN) {
			if (sourceOptionsInternal
				&& sourceOptionsInternal.layerName) {
				return new Stamen({
					layer: sourceOptionsInternal.layerName
				})
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}
		} else if (sourceTypeInternal === VENDOR.STADIA) {
			if (sourceOptionsInternal && sourceOptionsInternal.layerName) {
				return StadiaMaps(sourceOptionsInternal.layerName)
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}
		} else if (sourceTypeInternal === VENDOR.IMAGE) {

		} else if (sourceTypeInternal === VENDOR.COUCHDB) {

		} else {
			$n2.reportError('Unrecognized type (' + layerDefinition.type + ')');
		}
	}

	_getMapStylesInUse() {
		const mapStylesInUse = {};
		this.overlayLayers.forEach(layer => {
			const layerSource = layer.getSource() ? layer.getSource() : false;
			if (!layerSource) return;

			const layerFeatures = layerSource.getFeatures() ? layerSource.getFeatures() : false;
			if (!layerFeatures) return;

			this._accumulateMapStylesInUse(layerFeatures, mapStylesInUse)
		});
		return mapStylesInUse;
	}

	_enrichFeature(feature) {
		let geomType = feature.getGeometry()._n2Type;
		if (!geomType) {
			if (feature.getGeometry()
				.getType()
				.indexOf('Line') >= 0){
				geomType = feature.getGeometry()._n2Type = 'line';

			} else if (feature.getGeometry()
				.getType()
				.indexOf('Polygon') >= 0){
				geomType = feature.getGeometry()._n2Type = 'polygon';

			} else {
				geomType = feature.getGeometry()._n2Type = 'point';
			}
		}

		feature.n2_geometry = geomType;
		//Deal with n2_doc tag
		var data = feature.data;
		if (feature
			&& feature.cluster
			&& feature.cluster.length === 1) {
			data = feature.cluster[0].data;
		}

		if (!data) { //is a cluster
			data = {clusterData: true};
		}
		feature.n2_doc = data;
		return feature;
	}

	_accumulateMapStylesInUse(features, stylesInUse){
		features.forEach((f) => {
			this._enrichFeature(f);
			let style = this.styleRules.getStyle(f);
			if(style && typeof style.id === 'string') {
				var styleInfo = stylesInUse[style.id];
				if( !styleInfo ) {
					styleInfo = {
						style: style
					};
					stylesInUse[style.id] = styleInfo;
				}

				var geometryType = f.n2_geometry;
				if( geometryType && !styleInfo[geometryType] ) {
					styleInfo[geometryType] = f;
				}
			}
		});
	}

	_updatedStylesInUse() {
		this._dispatch({
			type: 'canvasReportStylesInUse',
			canvasName: this.canvasName,
			stylesInUse: this._getMapStylesInUse()
		});
	}

	_handleDispatch( m, addr, dispatcher){
		var _this = this;
		var type = m.type;
		if ('n2ViewAnimation' === type) {
			let x = m.x;
			let y = m.y;
			let zoom = m.zoom || 9;
			if (m._suppressSetHash) {
				this._suppressSetHash = m._suppressSetHash 
			}

			var extent = undefined;
			var targetCenter = [x, y];
			
			if (m.projCode) {
				let sourceProjCode = m.projCode;
				let targetProjCode = 'EPSG:3857';
				if (targetProjCode !== sourceProjCode) {
					var transformFn = getTransform( sourceProjCode, targetProjCode);
					// Convert [0,0] and [0,1] to proj
					targetCenter = transformFn([x, y]);
				}
				extent =  this._computeFullBoundingBox(m.doc, 'EPSG:4326','EPSG:3857');
			}

			_this.n2View.cancelAnimations();
			if (extent) {
				//If projCode for extent is  provided, calculate the transformed 
				//extent and zoom into that
				if (extent[0] === extent[2] || extent[1] === extent [3]) {
					//If calculated extent is a point
					_this.n2View.animate(
						{
							center: targetCenter,
							duration: 500
						}
						,{
							zoom: 9,
							duration: 500
						}
					);

				} else {
					_this.n2View.fit(extent,{duration: 1500});
				}

			} else {
				// No projCode provided, just zoom in with targetCenter
				_this.n2View.animate({
					center: targetCenter
					,zoom : zoom
					,duration : 200
				});
			}

			var inid = setInterval(function() {
				var isPlaying = _this.n2View.getAnimating();

				if (isPlaying) {
					
				} else {
					_this._suppressSetHash = false;
					clearInterval(inid);
				}
			},100);

		} else if ('n2rerender' === type){
			//This refresh strictly execute the invoke for rerender the ol5 map
			if (_this.n2Map){
				_this.overlayLayers.forEach(function(overlayLayer){
					overlayLayer.getSource().refresh();
				});
			}
		} else if ( 'mapRefreshCallbackRequest' === type ){
			//This refresh only execute the last invoke,
			//the earlier invoke will be cancelled if new invoke arrived
			if ( m.cnt + 1 === this.refreshCnt) {
				var cb = this.refreshCallback;
				if ( cb && typeof cb === 'function'){
					cb(null, this);
				}
			}

		} else if( 'editInitiate' === type ) {
			
			var fid = undefined;
			if( m.doc ){
				fid = m.doc._id;
			}
			
			var feature = null;
			var addGeometryMode = true;
			
			if( fid ){
				var feature = this._getMapFeaturesIncludeingFidMapOl5(fid);
			
				//TODO: center feature on map;
				if( feature ) {
					this._centerMapOnFeature(feature);
					addGeometryMode = false;
				}						
			}
			
			this.editFeatureInfo = {};
			this.editFeatureInfo.fid = fid;
			this.editFeatureInfo.original = {
				data: $n2.document.clone(m.doc)
			};

			var effectiveFeature = null;
			
			if( addGeometryMode ){
				// Edit a document that does not have a geometry.
				// Allow adding a geometry.
				this.switchToAddGeometryMode(fid);
			} else {
				// Do not provide the effective feature. The event 'editReportOriginalDocument'
				// will provide the original geometry. The effective feature might have a simplified
				// version of the geometry
				this.switchToEditFeatureMode(fid);
			}
			
		} else if( 'editClosed' === type ) {

			var fid = this.editFeatureInfo.fid;
			if( !fid ){
				fid = m.docId;
			}

			var reloadRequired = true;
			if( m.cancelled ){
				reloadRequired = false;
			}
			
			// By switching to the navigate mode, the feature on the
			// edit layer will be removed.
			//var editFeature = this._removeGeometryEditor();
			this.editLayerSource.clear();
			this._switchMapMode(this.modes.NAVIGATE);

			// Add back feature to map
//			this.infoLayers.forEach(function(layerInfo){
//				if( layerInfo.featureStrategy ){
//					layerInfo.featureStrategy.setEditedFeatureIds(null);
//				};
//			});
			
			// If feature was deleted, then remove it from map
			//TODO: feature removal for ol5;
			//?? Uncertain if something need to be take care of upon layerinfo ??
			if( m.deleted && fid ){
				reloadRequired = false;

				this.forEachVectorLayer(function(layerInfo, layer){
					var reloadLayer = false;
					var featuresToAdd = [];
					layerInfo.forEachFeature(function(f){
						if( f.fid === fid ){
							reloadLayer = true;
						} else {
							featuresToAdd.push(f);
						}
					});
					
					if( reloadLayer ){
						layer.removeAllFeatures({silent:true});
						layer.addFeatures(featuresToAdd);
					}
				});
			}
			
			this.editFeatureInfo = {};
			this.editFeatureInfo.original = {};	
		} else if ('resolutionRequest' === type){
			m.resolution = _this.resolution;
			m.proj = _this.proj;

		} else if ('focusOn' === type) {
		} else if ('renderStyledTranscript' === type) {
			const { hideImage, currentTime } = m;
			const donutLayerFeatures = this.overlayLayers.find(layer => {
				return layer.get("alias") === DONUT_VECTOR_LAYER_DISPLAY_NAME;
			}).getSource().getFeatures();

			if (hideImage) {
				this.mediaDrawerState.drawer.close();
			}
			else if (this.showRelatedImages){
				const actingFeature = donutLayerFeatures.find(feature => {
					return (currentTime >= feature.data._ldata.transcriptStart 
						&& currentTime < feature.data._ldata.transcriptEnd);
				});
				if (actingFeature) {
					this._showFeatureRelatedImage(actingFeature);
				}
			}

			if (this.fitMapToLatestMapTag) {
				const actingFeature = donutLayerFeatures.find(feature => {
					return (currentTime >= feature.data._ldata.transcriptStart 
						&& currentTime < feature.data._ldata.transcriptEnd);
				});
				if (actingFeature) {
					this._zoomToFeature(actingFeature);
				}
			}

		} else if ('time_interval_change' === type){
			let currTime = m.value.min;
			let incre = 100000000;
			
			if (_this.lastTime === null){
				_this.initialTime = currTime;
				_this.lastTime = currTime;
			}
			
			_this.endIdx = parseInt((currTime - _this.initialTime)/incre);
			_this.dispatchService.send(DH,{
				type: 'n2rerender'
			});

			_this.lastTime = currTime;
		} else if( 'canvasGetStylesInUse' === type && this.canvasName === m.canvasName){
			m.stylesInUse = this._getMapStylesInUse();
		} else if( 'cinemapToMapSettingsUpdate' === type ){
			const { key, state } = m;
			this[key] = state;
			if (key === "fitMapToLatestMapTag" && !state) {
				this.animateMapFitting = false;
				this.settingsControl.updateControlByKey("animateMapFitting", false);
			}
			else if (key === "animateMapFitting" && !this.fitMapToLatestMapTag) {
				this.fitMapToLatestMapTag = true;
				this.settingsControl.updateControlByKey("fitMapToLatestMapTag", true);
			}
			else if (key === "isClustering") {
				this._clusterFeatures(state);
			}
		} else if ('mapExtentRequest' === type) {
			m.value = this.n2Map.getView().calculateExtent();
		} else if ('mapFitExtent' === type) {
			this.n2Map.getView().fit(m.value);
		}
	}

	_showFeatureRelatedImage(feature) {
		if (feature && feature.data &&
			feature.data._ldata && feature.data._ldata.relatedImage !== "" && feature.data._ldata.relatedImage.length > 0) {
			this._displayNotificationImage(feature.data._ldata);
		}
	}

	_displayNotificationImage(featureData) {
		let { relatedImage } = featureData;

		this.mediaDrawerState.imageStates.forEach(state => {
			state.pzState.destroy();
			state.element.parentElement.removeEventListener("wheel", state.pzState.zoomWithWheel);
		});

		const container = this.mediaDrawerState.containerElement[0];
		while (container.firstChild && container.removeChild(container.firstChild));

		if (typeof relatedImage === "string") relatedImage = [{image: relatedImage}];
		relatedImage.forEach(image => {
			this._mediaDrawerRender(image);
		});

		this.mediaDrawerState.drawer.open();
	}
	
	_mediaDrawerRender(image) {
		const container = this.mediaDrawerState.containerElement;
		const imgContainer = document.createElement("div");
		const imgEl = document.createElement("img");
		imgEl.src = `./db${image.image}`
		const captionEl = document.createElement("p");
		captionEl.innerText = image.caption || "";
		imgContainer.setAttribute("class", "relatedMediaDisplayDrawerImageContainer");
		imgContainer.append(imgEl);
		container.append(imgContainer, captionEl);

		const pzState = Panzoom(imgEl, { contain: "outside" });
		imgEl.parentElement.addEventListener("wheel", pzState.zoomWithWheel);
		this.mediaDrawerState.imageStates.push({
			element: imgEl,
			pzState
		});
	}

	_zoomToFeature(feature) {
		const olmap = this.n2Map;
		if (!olmap) return;
		const expectedScale = feature.data._ldata.placeZoomScale;
		const zoomScale = (expectedScale 
			&& expectedScale > 0 
			&& expectedScale <= MAX_MAP_ZOOM_LEVEL) ? expectedScale : DEFAULT_MAP_FEATURE_ZOOM_LEVEL;

		let mapFitDuration = 0;
		if (this.animateMapFitting) {
			mapFitDuration = 1000;
		}

		if (!feature.n2ConvertedBbox || feature.n2ConvertedBbox.length < 2) return;
		const areaOfFocus = [feature.n2ConvertedBbox[0], feature.n2ConvertedBbox[1]];

		olmap.getView().animate({
			center: areaOfFocus,
			zoom: zoomScale,
			duration: mapFitDuration
		});
	}

	_setInitialCinemapToMapSettings() {
		if (!this.initialCinemapToMapSettings) return;
		const {
			fitMap,
			animateFitMap,
			displayMedia,
			zoomThreshold
		} = this.initialCinemapToMapSettings

		if (fitMap !== undefined && typeof fitMap === "boolean") {
			this.fitMapToLatestMapTag = fitMap;
		}
		if (animateFitMap !== undefined && typeof animateFitMap === "boolean") {
			this.animateMapFitting = animateFitMap;
			if (this.animateMapFitting) {
				this.fitMapToLatestMapTag = true;
			}
		}
		if (displayMedia !== undefined && typeof displayMedia === "boolean") {
			this.showRelatedImages = displayMedia;
		}
		if (zoomThreshold !== undefined && typeof zoomThreshold === "boolean") {
			this.hideFeatureIfMapZoom = zoomThreshold;
		}
	}

	_getMapFeaturesIncludeingFidMapOl5(fidMap) {
		var result_features = [];
		if( this.features_ && this.features_.length > 0 ) {
			
			let features = this.features_;
			for(let loop=0;loop<features.length;++loop) {
				let feature = features[loop];
				if( feature.fid && fidMap[feature.fid] ) {
					result_features.push( feature );
				} else if( feature.cluster ) {
					for(var j=0,k=feature.cluster.length; j<k; ++j){
						var f = feature.cluster[j];
						if( f.fid && fidMap[f.fid] ){
							result_features.push(f);
						}
					}
				}
			}
		}
		
		return result_features;
	}

	_centerMapOnFeature(feature){
		var extent = feature.getGeometry().getExtent();
		var map = this.n2Map;
		if(extent){
			map.getView().fit(extent, map.getSize() );
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

	_getDispatchService(){
		var d = null;
		if( this.options.directory ) {
			d = this.options.directory.dispatchService;
		}
		return d;
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

}

//--------------------------------------------------------------------------
export function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'map' ){
		m.isAvailable = true;
	}
}

//--------------------------------------------------------------------------
export function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'map' ){

		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			}
		}

		if( !options.elementGenerator ){
			// If not defined, use the one specified by type
			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
				type: options.elementGeneratorType
				,options: options.elementGeneratorOptions
				,config: m.config
			});
		}

		options.canvasId = m.canvasId;
		options.config = m.config;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		options.interactionId = m.interactionId;
		new N2MapCanvas(options);
	}
}

//--------------------------------------------------------------------------
nunaliit2.n2es6 = {
		ol_proj_Projection : Projection,
		ol_proj_transformExtent : transformExtent,
		ol_extent_extend : extend,
		ol_extent_isEmpty : isEmpty,
		ol_format_WKT: WKT,
		panzoom: Panzoom
};

nunaliit2.canvasMap = {
		MapCanvas: N2MapCanvas
		,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
		,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};
export default N2MapCanvas;
