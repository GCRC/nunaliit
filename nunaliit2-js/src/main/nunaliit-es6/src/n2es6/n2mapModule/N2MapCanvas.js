/**
 * @module n2es6/n2mapModule/N2MapCanvas
 */

import 'ol/ol.css';
import './N2MapCanvas.css';
import { default as CouchDbSource } from './N2CouchDbSource.js';
import N2ModelSource from './N2ModelSource.js';
import { default as LayerInfo } from './N2LayerInfo';
import { default as N2MapStyles } from './N2MapStyles.js';

import WMTS from 'ol/source/WMTS.js';
import { default as VectorSource } from 'ol/source/Vector.js';
import { default as N2Select } from './N2Select.js';
import { default as N2SourceWithN2Intent } from './N2SourceWithN2Intent.js';

import Map from 'ol/Map.js';
import { default as VectorLayer } from 'ol/layer/Vector.js';
import { default as LayerGroup } from 'ol/layer/Group.js';
import { default as View } from 'ol/View.js';
import { default as N2DonutCluster } from '../ol5support/N2DonutCluster.js';

import { extend, isEmpty, getTopLeft, getWidth } from 'ol/extent.js';
import { transform, getTransform, transformExtent, get as getProjection } from 'ol/proj.js';
import { default as Projection } from 'ol/proj/Projection.js';
import Tile from 'ol/layer/Tile.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import WKT from 'ol/format/WKT';

import mouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import { defaults as defaultsInteractionSet } from 'ol/interaction.js';

import { default as DrawInteraction } from 'ol/interaction/Draw.js';
import Stamen from 'ol/source/Stamen.js';
import OSM from 'ol/source/OSM';
import BingMaps from 'ol/source/BingMaps';
import TileWMS from 'ol/source/TileWMS';
import LayerSwitcher from 'ol-layerswitcher';
import 'ol-layerswitcher/src/ol-layerswitcher.css';

import 'ol-ext/dist/ol-ext.css';
import EditBar from './EditBar';
import Popup from 'ol-ext/overlay/Popup';

import { defaults as Defaults } from 'ol/control';

const _loc = function (str, args) { return $n2.loc(str, 'nunaliit2', args); };
const DH = 'n2.canvasMap';

//--------------------------------------------------------------------------
/*
 *This canvas displays a map based on OpenLayers 6.
 */
//--------------------------------------------------------------------------
const VENDOR = {
	BING: 'bing',
	WMS: 'wms',
	WMTS: 'wmts',
	OSM: 'osm',
	STAMEN: 'stamen'
};

const olStyleNames = {
	"fill": "fillColor"
	, "fill-opacity": "fillOpacity"
	, "stroke": "strokeColor"
	, "stroke-opacity": "strokeOpacity"
	, "stroke-width": "strokeWidth"
	, "stroke-linecap": "strokeLinecap"
	, "stroke-dasharray": "strokeDashstyle"
	, "r": "pointRadius"
	, "pointer-events": "pointEvents"
	, "color": "fontColor"
	, "font-family": "fontFamily"
	, "font-size": "fontSize"
	, "font-weight": "fontWeight"
};

const stringStyles = {
	"label": true
};

/**
 * @classdesc
 * N2MapCanvas - canvas type "map"
 * @api
 */
class N2MapCanvas {
	constructor(opts_) {
		const opts = $n2.extend({
			canvasId: undefined
			, sourceModelId: undefined
			, elementGenerator: undefined
			, config: undefined
			, onSuccess: function () { }
			, onError: function (err) { }
		}, opts_);

		const _this = this;
		this.options = opts;
		this._classname = 'N2MapCanvas';
		this.dispatchService = null;
		this._suppressSetHash = false;
		this.showService = null;
		this.canvasId = opts.canvasId;
		this.sourceModelId = opts.sourceModelId;
		this.interactionId = opts.interactionId;
		this.elementGenerator = opts.elementGenerator;

		const config = opts.config;
		if (config) {
			if (config.directory) {
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
		this._retrievingDocsAndPaintPopupthrottled = $n2.utils.debounce(this._retrievingDocsAndPaintPopup, 30);
		this.isClustering = undefined;
		this.n2View = undefined;
		this.n2Map = undefined;
		this.popupOverlay = undefined;
		this.n2MapStyles = new N2MapStyles();
		this.editbarControl = null;
		this.editLayerSource = undefined;
		this.refreshCallback = null;

		this.canvasName = null;
		if (this.options) {
			this.canvasName = this.options.canvasName;
		}

		if (this.customService) {
			if (!this.refreshCallback) {
				const cb = this.customService.getOption('mapRefreshCallback');
				if (typeof cb === 'function') {
					this.refreshCallback = cb;
				}
			}
		}

		this.interactionSet = {
			selectInteraction: null,
			drawInteraction: null
		};
		this.currentInteract = null;
		this.n2intentWrapper = null;
		this._processOverlay(opts.overlays);
		this.editFeatureInfo = {
			original: {}
		};

		// MODES
		const addOrEditLabel = _loc('Add or Edit a Map Feature');
		const cancelLabel = _loc('Cancel Feature Editing');

		this.modes = {
			NAVIGATE: {
				name: "NAVIGATE"
				, buttonValue: addOrEditLabel
				, onStartHover: function (feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				, onStartClick: function (feature, mapFeature) { }
				, onEndClick: function (feature) { }
				, featureAdded: function (feature) { }
			}
			, ADD_OR_SELECT_FEATURE: {
				name: "ADD_OR_SELECT"
				, buttonValue: cancelLabel
				, onStartHover: function (feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				, onStartClick: function (mapFeature) {
					let editAllowed = true;
					if (mapFeature.cluster && mapFeature.cluster.length > 1) {
						alert(_loc('This feature is a cluster and can not be edited directly. Please, zoom in to see features within cluster.'));
						editAllowed = false;
					}
					if (editAllowed) {
						_this._dispatch({
							type: 'editInitiate'
							, doc: mapFeature.data
						});
					}
				}
				, onEndClick: function (feature) { }
				, featureAdded: function (feature) {
					_this.editFeatureInfo.original = {};
					_this.editFeatureInfo.fid = undefined;
					_this.editFeatureInfo.suppressZoom = true;
					_this.dispatchService.send(DH, {
						type: 'editCreateFromGeometry'
						, geometry: feature.getGeometry()
						, projection: new Projection({ code: 'EPSG:3857' })
						, _origin: _this
					});
				}
			}
			, ADD_GEOMETRY: {
				name: "ADD_GEOMETRY"
				, buttonValue: cancelLabel
				, onStartHover: function (feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				, featureAdded: function (feature) {
					let proj = null;
					if (feature
						&& feature.layer
						&& feature.layer.map) {
						proj = feature.layer.map.getProjectionObject();
					}
					_this._dispatch({
						type: 'mapGeometryAdded'
						, geometry: feature.geometry
						, projection: proj
					});
				}
			}
			, EDIT_FEATURE: {
				name: "EDIT_FEATURE"
				, buttonValue: cancelLabel
				, featureAdded: function (feature) { }
			}
		};

		this.currentMode = this.modes.NAVIGATE;
		this.createMapInteractionSwitch();

		const authService = this._getAuthService();
		if (authService) {
			authService.addListeners(function (currentUser) {
				_this.loginStateChanged(currentUser);
			});
		}

		// Register to events
		if (this.dispatchService) {
			const f = function (m) {
				_this._handleDispatch(m);
			};
			this.dispatchService.register(DH, 'n2ViewAnimation', f);
			this.dispatchService.register(DH, 'n2rerender', f);
			this.dispatchService.register(DH, 'mapRefreshCallbackRequest', f);
			this.dispatchService.register(DH, 'resolutionRequest', f);
			this.dispatchService.register(DH, 'editInitiate', f);
			this.dispatchService.register(DH, 'editClosed', f);
			this.dispatchService.register(DH, 'canvasGetStylesInUse', f);
		}

		$n2.log(this._classname, this);

		this.bgSources = opts.backgrounds || [];
		this.coordinates = opts.coordinates || null;
		this.renderOrderBasedOn = opts.renderOrderBasedOn || undefined;

		if (this.renderOrderBasedOn
			&& this.renderOrderBasedOn[0] === '=') {
			try {
				let targetString = this.renderOrderBasedOn.substr(1);
				if (targetString.startsWith("doc")) {
					targetString = targetString.substr(3);
					targetString = "data" + targetString;
				}
				this.renderOrderBasedOn = $n2.styleRuleParser.parse(
					targetString);
			} catch (e) {
				this.renderOrderBasedOn = e;
			}
		}
		this.styleRules = $n2.styleRule.loadRulesFromObject(opts.styles);

		this._drawMap();
		opts.onSuccess();
	}

	/**
	 * Preprocess the opts.overlay. Producing overlay-sources array
	 * and overlay-infos array.
	 * @param {Array} overlays - List of overlays provided by a module's canvas.json. 
	 */
	_processOverlay(overlays) {
		const _this = this;
		if (!$n2.isArray(overlays)) {
			overlays = [overlays];
		}

		overlays.forEach((function (overlay) {
			const layerInfo = new LayerInfo(overlay);
			const layerOptions = {
				name: layerInfo.name
				, projection: layerInfo.sourceProjection
				, visibility: layerInfo.visibility
				, _layerInfo: layerInfo
				, clustering: overlay.clustering
			};
			const getSourceModelId = function (overlay) {
				let sourceModelId = null;
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

			let source = null;

			if ('couchdb' === overlay.type) {
				let sourceModelId = undefined;
				sourceModelId = getSourceModelId(overlay);

				if (sourceModelId) {
					source = new CouchDbSource({
						sourceModelId: sourceModelId
						, dispatchService: this.dispatchService
						, projCode: 'EPSG:3857'
					});
					this.sources.push(source);
				}

			} else if ('model' === overlay.type) {
				let sourceModelId = undefined;
				sourceModelId = getSourceModelId(overlay);

				if (sourceModelId) {
					source = new N2ModelSource({
						sourceModelId: sourceModelId
						, dispatchService: this.dispatchService
						, projCode: 'EPSG:3857'
						, onUpdateCallback: function (state) { }
						, notifications: {
							readStart: function () { }
							, readEnd: function () { }
						}
					});
					/* var listenerKey = source.on('change', function (e) {
						if (source.getState() == 'ready') {
							if (!_this.refreshCnt) {
								_this.refreshCnt = 1;
							}

							var curCnt = _this.refreshCnt;
							_this.dispatchService.send(DH, {
								type: 'mapRefreshCallbackRequest',
								cnt: curCnt
							});
							_this.refreshCnt++;
						}
					}); */
					this.sources.push(source);
				}
			} else if (overlay.type === VENDOR.WMS) {
				this.sources.push(overlay)
			} else if ('wfs' === overlay.type) {
				$n2.logError(overlay.type + 'is not available');
				this.sources.push({});
			} else {
				$n2.logError('Cannot handle overlay type: ' + overlay.type);
				this.sources.push({});
			}
		}).bind(this));
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
		let showLogin = false;

		if (null === currentUser) {
			showLogin = true;
		}

		if (showLogin) {
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
		const mapInteractionButton = $('<input>')
			.attr('type', 'button')
			.addClass('n2map_map_interaction_switch')
			.val(this.modes.NAVIGATE.buttonValue)
			.click((evt) => {
				this._clickedMapInteractionSwitch(evt);
			});

		$("#" + this.interactionId)
			.empty()
			.append(mapInteractionButton);
	}

	_clickedMapInteractionSwitch(ev) {
		if (this.currentMode === this.modes.NAVIGATE) {
			this.switchToEditMode();

		} else if (this.currentMode === this.modes.ADD_OR_SELECT_FEATURE) {
			this._switchMapMode(this.modes.NAVIGATE);

		} else if (this.currentMode === this.modes.ADD_GEOMETRY) {
			this._switchMapMode(this.modes.NAVIGATE);
			this.editLayerSource.clear();
			this._cancelEditFeatureMode();

		} else if (this.currentMode === this.modes.EDIT_FEATURE) {
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
	_switchMapMode(mode, opts) {
		if (this.currentMode === mode) {
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
		}

		// Broadcast mode change
		const dispatcher = this._getDispatchService();
		if (dispatcher) {
			dispatcher.send(DH, {
				type: 'mapReportMode'
				, mapControl: this
				, mode: this.currentMode.name
			});
		}
	}

	switchToEditMode() {
		const authService = this._getAuthService();
		if (authService) {
			let logInRequired = true;

			// The auth module is present, check if user logged in
			// and is not anonymous
			const userNotAnonymous = authService.isLoggedIn();
			if (userNotAnonymous) {
				logInRequired = false;
			}
			if (logInRequired) {
				// User is not logged in
				authService.showLoginForm({
					prompt: '<p>You must log in as a registered user to add a point to the map.</p>'
					, anonymousLoginAllowed: false
					, onSuccess: () => { this.switchToEditMode(); }
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
		this._switchMapMode(this.modes.EDIT_FEATURE, {
			fid: fid
			, feature: feature
		});
	}

	switchToAddGeometryMode(docId) {
		this._switchMapMode(this.modes.ADD_GEOMETRY, {
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
		let auth = null;
		if (this.options.directory) {
			auth = this.options.directory.authService;
		}
		return auth;
	}

	_mapBusyStatus(delta) {
	}

	// Get the map canvas element
	_getElem() {
		const $elem = $('#' + this.canvasId);
		if ($elem.length < 1) {
			return undefined;
		}
		return $elem;
	}

	_allSourceChangeResolution(sources, res, proj, extent) {
		sources.forEach(function (source) {
			if (typeof source.onChangedResolution !== 'undefined') {
				source.onChangedResolution(res, proj, extent);
			}
		});
	}

	_drawMap() {
		const _this = this;

		const olView = new View({
			center: transform([-75, 45.5], 'EPSG:4326', 'EPSG:3857'),
			projection: 'EPSG:3857',
			zoom: 6
		});

		this.n2View = olView;
		const customMap = new Map({
			interactions: defaultsInteractionSet({ mouseWheelZoom: false }).extend([
				new mouseWheelZoom({
					duration: 200,
					constrainResolution: false
				})
			]),
			target: this.canvasId,
			view: olView,
			controls: Defaults({
				attribution: true,
				attributionOptions: {
					collapsible: false,
					collapsed: false
				},
				rotate: false,
				zoom: true
			})
		});

		this.n2Map = customMap;
		this.n2MapStyles.setMap(customMap);

		//Config the initial bound on the map
		if (this.coordinates && !this.coordinates.autoInitialBounds) {
			const bbox = this.coordinates.initialBounds;
			const boundInProj = transformExtent(bbox,
				new Projection({ code: 'EPSG:4326' }),
				new Projection({ code: 'EPSG:3857' })
			);

			customMap.once('postrender', function (evt) {
				const res = evt.frameState.viewState.resolution;
				const proj = _this.n2View.getProjection();
				const zoom = evt.frameState.viewState.zoom;
				const center = evt.frameState.viewState.center;
				const extent = olView.calculateExtent();

				_this.resolution = res;
				_this._allSourceChangeResolution(_this.sources, res, proj, extent);

				const coor_string = center.join(',') + ',' + zoom + 'z';
				_this.dispatchService.send(DH, {
					type: 'viewChanged'
					, coordination: coor_string
					, _suppressSetHash: _this._suppressSetHash
				});
				customMap.getView().fit(boundInProj, { size: customMap.getSize() });
			});
		}

		//Getting the resolution whenever a frame finish rendering;
		customMap.on('postrender', function (evt) {
			const res = evt.frameState.viewState.resolution;
			const proj = _this.n2View.getProjection();
			_this.resolution = res;
			_this.proj = proj;
			_this._updatedStylesInUse()
		});

		//Listening on the map move and resolution changes.
		//Everytime a change is detected. The N2CouchDbSource/N2ModelSource will be update
		customMap.on('movestart', onMoveStart);

		function onMoveStart(evt) {
			customMap.once('moveend', function (evt) {
				//Clearing the popup
				if (_this.popupOverlay) {
					_this.popupOverlay.hide();
				}

				const res = evt.frameState.viewState.resolution;
				const proj = _this.n2View.getProjection();
				const zoom = evt.frameState.viewState.zoom;
				const center = evt.frameState.viewState.center;
				_this.resolution = res;
				_this.proj = proj;
				const extent = olView.calculateExtent();
				_this._allSourceChangeResolution(_this.sources, res, proj, extent);

				const coor_string = center.join(',') + ',' + zoom + 'z';
				_this.dispatchService.send(DH, {
					type: 'viewChanged'
					, coordination: coor_string
					, _suppressSetHash: _this._suppressSetHash
				});

				_this._updatedStylesInUse()
			})
		}

		this.interactionSet.selectInteraction = new N2Select({ map: customMap });
		//	create and add layers
		this.overlayLayers = this._genOverlayMapLayers(this.sources);
		this.mapLayers = this._genBackgroundMapLayers(this.bgSources);

		const customPopup = new Popup({
			popupClass: "",
			positioning: 'auto',
			autoPan: true,
			autoPanAnimation: { duration: 250 }
		});

		this.popupOverlay = customPopup;
		this.n2Map.addOverlay(customPopup);

		/**
		 * Two Groups : Overlay and Background
		 */
		const overlayGroup = new LayerGroup({
			title: 'Overlays',
			layers: this.overlayLayers
		});

		const bgGroup = new LayerGroup({
			title: 'Background',
			layers: this.mapLayers
		});

		customMap.set("layergroup",
			new LayerGroup({ layers: [bgGroup, overlayGroup] })
		);

		const customLayerSwitcher = new LayerSwitcher({
			tipLabel: 'Legend' // Optional label for button
		});

		customMap.addControl(customLayerSwitcher);

		this.overlayInfos.forEach((info, idx) => {
			if (info._layerInfo.options.wmsLegend && info.visibility) {
				const legendUrl = _this.overlayLayers[idx].values_.source.getLegendUrl()
				_this.dispatchService.send(DH,
					{
						type: 'imageUrlLegendDisplay'
						, visible: true
						, legendUrl: legendUrl
						, wmsId: _this.overlayLayers[idx].ol_uid
						, canvasName: _this.canvasName
					})
			}
			if (info._layerInfo.options.wmsLegend) {
				const legendUrl = _this.overlayLayers[idx].values_.source.getLegendUrl()
				_this.overlayLayers[idx].on('change:visible', function (e) {
					if (e.oldValue) {
						_this.dispatchService.send(DH,
							{
								type: 'imageUrlLegendDisplay'
								, visible: false
								, legendUrl: legendUrl
								, wmsId: e.target.ol_uid
								, canvasName: _this.canvasName
							})
					} else {
						_this.dispatchService.send(DH,
							{
								type: 'imageUrlLegendDisplay'
								, visible: true
								, legendUrl: legendUrl
								, wmsId: e.target.ol_uid
								, canvasName: _this.canvasName
							})
					}
				});
			}
		});

		this.interactionSet.selectInteraction.on("clicked", (function (e) {
			if (e.selected) {
				if (_this.currentMode === _this.modes.NAVIGATE) {
					this._retrievingDocsAndSendSelectedEvent(e.selected);
					if (this.currentMode.onStartClick) {
						if (e.selected.length === 1) {
							const feature = e.selected[0];
							this.currentMode.onStartClick(feature);
						}
					}

				} else {
					if (this.currentMode.onStartClick) {
						if (e.selected.length === 1) {
							const feature = e.selected[0];
							this.currentMode.onStartClick(feature);
						}
					}
				}
			}
		}).bind(this));

		this.interactionSet.selectInteraction.on("hover", (function (e) {
			const mapBrowserEvent = e.upstreamEvent;
			if (e.deselected) {
				_this.popupOverlay.hide();
			}
			if (e.selected) {
				this._retrievingDocsAndPaintPopupthrottled(e.selected, mapBrowserEvent);
			}
		}).bind(this));

		this.interactionSet.drawInteraction = new DrawInteraction({
			type: 'Point',
			source: this.overlayLayers[0].getSource()
		});

		//Create editing layer
		this.editLayerSource = new VectorSource();
		const editLayer = new VectorLayer({
			//no title so this is not shown in the switcher
			source: this.editLayerSource
		});
		customMap.addLayer(editLayer);
		this.overlayLayers.push(editLayer);

		this.editbarControl = new EditBar({
			interactions: {
				Select: this.interactionSet.selectInteraction
			},
			source: editLayer.getSource()
		});

		customMap.addControl(this.editbarControl);
		this.editbarControl.setVisible(false);
		this.editbarControl.getInteraction('Select').on('clicked', function (e) {
			if (_this.currentMode === _this.modes.ADD_OR_SELECT_FEATURE
				|| _this.currentMode === _this.modes.EDIT_FEATURE) {
				return false;
			}
		});

		this.editbarControl.getInteraction('ModifySelect').on('modifystart', function (e) {
			$n2.log('Modifying features:', e.features);
		});

		this.editbarControl.getInteraction('ModifySelect').on('modifyend', onModifyEnd);
		function onModifyEnd(e) {
			const features = e.features;
			for (let i = 0, e = features.length; i < e; i++) {
				const geometry = features[i].getGeometry();
				_this.dispatchService.send(DH, {
					type: 'editGeometryModified'
					, docId: features[i].fid
					, geom: geometry
					, proj: new Projection({ code: 'EPSG:3857' })
					, _origin: _this
				});
			}
			return false;
		}

		this.editbarControl.getInteraction('DrawPoint').on('drawend', function (e) {
			_this.editModeAddFeatureCallback(e);
		});

		this.editbarControl.getInteraction('DrawLine').on('drawend', function (evt) {
			_this.editModeAddFeatureCallback(evt);
		});

		this.editbarControl.getInteraction('DrawPolygon').on('drawend', function (evt) {
			_this.editModeAddFeatureCallback(evt);
		});
	}

	onMoveendCallback(evt) { }

	editModeAddFeatureCallback(evt) {
		const feature = evt.feature;
		const previousMode = this.currentMode;
		this.switchToEditFeatureMode(feature.fid, feature);
		previousMode.featureAdded(feature);
		this._centerMapOnFeature(feature);
	}

	_dispatch(m) {
		const dispatcher = this._getDispatchService();
		if (dispatcher) {
			dispatcher.send(DH, m);
		}
	}

	_retrievingDocsAndPaintPopup(feature, mapBrowserEvent) {
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
							const mousepoint = mapBrowserEvent.coordinate;
							popup.show(mousepoint, content);
						}
						, onError: function () { }
					});
				}
			} else {
				//n2es6 does not support multi hover, so does nunaliit2 
			}
		}
	}

	_retrievingDocsAndSendSelectedEvent(features) {
		const _this = this;
		const validFeatures = [];
		for (let i = 0, v = features.length; i < v; i++) {
			let feature = features[i];
			DFS(feature, function (t) {
				validFeatures.push(t)
			})
		}

		if (_this.dispatchService) {
			if (0 === validFeatures.length) {
				return;
			} else if (1 === validFeatures.length) {
				let t = validFeatures[0];
				_this.dispatchService.send(DH, {
					type: 'userSelect'
					, docId: t.data._id
					, doc: t.data
					, feature: t
				});

			} else if (1 < validFeatures.length) {
				let docIds = [];
				validFeatures.forEach(function (elem) {
					docIds.push(elem.data._id);
				})

				_this.dispatchService.send(DH, {
					type: 'userSelect'
					, docIds: docIds
				});
			}
		}

		function DFS(item, callback) {
			if (!item) return;
			if (item.data || typeof item.data === 'number') {
				callback(item);
				return;
			}

			let innerFeatures = item.cluster;
			if (innerFeatures && Array.isArray(innerFeatures)) {
				for (let i = 0, e = innerFeatures.length; i < e; i++) {
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
		const fg = [];
		const _this = this;

		function StyleFn(feature, resolution) {
			_this._enrichFeature(feature)
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
			for (let i = 0, e = Sources.length; i < e; i++) {
				const overlayInfo = _this.overlayInfos[i];
				const alphasource = Sources[i];
				if (typeof alphasource.type !== 'undefined' && alphasource.type === 'wms') {
					const visible = typeof alphasource.visibility === 'undefined' || alphasource.visibility ? true : false;
					fg.push(this._createOLLayerFromDefinition(alphasource, visible));
					continue;
				}
				let betaSource = alphasource;
				if (overlayInfo.clustering) {
					if (typeof _this.isClustering === 'undefined') {
						_this.isClustering = true;
					}
					const clsOpt = Object.assign({}, overlayInfo.clustering
						, { source: alphasource });
					betaSource = new N2DonutCluster(clsOpt);
				}

				const charlieSource = new N2SourceWithN2Intent({
					interaction: _this.interactionSet.selectInteraction,
					source: betaSource,
					dispatchService: _this.dispatchService
				});

				_this.n2intentWrapper = charlieSource;
				const vectorLayer = new VectorLayer({
					title: "CouchDB",
					renderMode: 'vector',
					source: charlieSource,
					style: StyleFn,
					renderOrder: function (feature1, feature2) {
						const valueSelector = _this.renderOrderBasedOn;

						if (typeof valueSelector === 'object'
							&& typeof valueSelector.getValue(feature1) === 'number') {

							const l = valueSelector.getValue(feature1);
							const r = valueSelector.getValue(feature2);
							if (typeof l === 'number' && typeof r === 'number') {
								if (l < r) {
									return -1;
								} else if (l > r) {
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
				fg.push(vectorLayer);
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
		let bg = null;

		function _computeDefaultLayer(backgrounds, idx) {
			if (typeof _computeDefaultLayer.defaultLayerIdx == 'undefined') {
				_computeDefaultLayer.defaultLayerIdx = -1;
			}

			if (_computeDefaultLayer.defaultLayerIdx === -1) {
				_computeDefaultLayer.defaultLayerIdx = 0;
				for (let i = 0, e = backgrounds.length; i < e; ++i) {
					const layerDefinition = backgrounds[i];
					if (typeof (layerDefinition.defaultLayer) !== 'undefined'
						&& layerDefinition.defaultLayer) {
						_computeDefaultLayer.defaultLayerIdx = i;
					}
				}
			}
			return (_computeDefaultLayer.defaultLayerIdx === idx);
		}

		if (bgSources) {
			// This is the method used when background layers are specified
			// via couchModule
			for (let i = 0, e = bgSources.length; i < e; ++i) {
				const layerDefiniton = bgSources[i];
				const layer = this._createOLLayerFromDefinition(
					layerDefiniton,
					_computeDefaultLayer(bgSources, i),
					true
				);

				if (layer && !bg) bg = [];
				if (layer) bg[bg.length] = layer;
			}
		}
		return (bg);
	}

	/**
	 * Creates an OpenLayers Tile object, from the layer definition.
	 * @param {object} layerDefinition - Background layer definition defined in the module's canvas.json 
	 * in the backgrounds array. 
	 * @param {boolean} isDefaultLayer 
	 */
	_createOLLayerFromDefinition(layerDefinition, isDefaultLayer, isBaseLayer) {
		const name = _loc(layerDefinition.name);
		const _this = this;

		if (layerDefinition) {
			if (isBaseLayer) {
				return new Tile({
					title: layerDefinition.name,
					type: 'base',
					visible: isDefaultLayer,
					source: _this._createBackgroundMapSource(layerDefinition)
				});
			} else {
				return new Tile({
					title: layerDefinition.name,
					visible: isDefaultLayer,
					source: _this._createBackgroundMapSource(layerDefinition)
				});
			}
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
	_createBackgroundMapSource(layerDefinition) {
		const sourceTypeInternal =
			layerDefinition.type.replace(/\W/g, '').toLowerCase();
		const sourceOptionsInternal = layerDefinition.options;
		const name = layerDefinition.name;

		if (sourceTypeInternal === VENDOR.BING) {
			return new BingMaps(sourceOptionsInternal);

		} else if (sourceTypeInternal === VENDOR.WMS) {
			if (sourceOptionsInternal
				&& sourceOptionsInternal.url
				&& sourceOptionsInternal.layers) {
				const parameters = {};

				for (let key in sourceOptionsInternal) {
					if ('LAYERS' === key.toUpperCase()
						|| 'STYLES' === key.toUpperCase()
						|| 'WIDTH' === key.toUpperCase()
						|| 'VERSION' === key.toUpperCase()
						|| 'HEIGHT' === key.toUpperCase()
						|| 'BBOX' === key.toUpperCase()
						|| 'CRS' === key.toUpperCase()) {

						parameters[key.toUpperCase()] = sourceOptionsInternal[key]
					}
				}

				return new TileWMS({
					url: sourceOptionsInternal.url,
					params: parameters
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}

		} else if (sourceTypeInternal === VENDOR.WMTS) {
			const options = sourceOptionsInternal;
			if (options) {
				const wmtsOpt = {
					url: null
					, layer: null
					, matrixSet: null
					, projection: null
					, style: null
					, wrapX: false
				};

				if (options.matrixSet && options.numZoomLevels) {
					const projection = getProjection(options.matrixSet);
					const projectionExtent = projection.getExtent();
					const numofzoom = parseInt(options.numZoomLevels, 10);
					const size = getWidth(projectionExtent) / 256;
					const resolutions = new Array(numofzoom);
					const matrixIds = new Array(numofzoom);
					for (let z = 0; z < numofzoom; ++z) {
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

				for (let key in options) {
					wmtsOpt[key] = options[key];
				}

				return new WMTS(wmtsOpt);

			} else {
				$n2.reportError('Bad configuration for layer: ' + name);
				return null;
			}

		} else if (sourceTypeInternal === VENDOR.OSM) {

			if (sourceOptionsInternal
				&& sourceOptionsInternal.url) {
				return new OSM({
					url: sourceOptionsInternal.url
				});

			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}

		} else if (sourceTypeInternal === VENDOR.STAMEN) {
			if (sourceOptionsInternal
				&& sourceOptionsInternal.layerName) {
				return new Stamen({
					layer: sourceOptionsInternal.layerName
				});
			} else {
				$n2.reportError('Parameter is missing for source: ' + sourceTypeInternal);
			}
		} else {
			$n2.reportError('Unrecognized type (' + layerDefinition.type + ')');
		}
	}

	_enrichFeature(feature) {
		let geomType = feature.getGeometry()._n2Type;
		if (!geomType) {
			if (feature.getGeometry()
				.getType()
				.indexOf('Line') >= 0) {
				geomType = feature.getGeometry()._n2Type = 'line';

			} else if (feature.getGeometry()
				.getType()
				.indexOf('Polygon') >= 0) {
				geomType = feature.getGeometry()._n2Type = 'polygon';

			} else {
				geomType = feature.getGeometry()._n2Type = 'point';
			}
		}

		feature.n2_geometry = geomType;
		//Deal with n2_doc tag
		let data = feature.data;
		if (feature
			&& feature.cluster
			&& feature.cluster.length === 1) {
			data = feature.cluster[0].data;
		}

		if (!data) { //is a cluster
			data = { clusterData: true };
		}
		feature.n2_doc = data;
		return feature;
	}

	_getMapStylesInUse() {
		const mapStylesInUse = {};
		for (let i in this.overlayLayers) {
			const layer = this.overlayLayers[i];
			//if model or couch
			if (layer && layer.values_ && layer.values_.source && layer.values_.source.features_) {
				this._accumulateMapStylesInUse(layer.values_.source.features_, mapStylesInUse);
			}
		};
		return mapStylesInUse;
	}

	_accumulateMapStylesInUse(features, stylesInUse) {
		// Loop over drawn features (do not iterate in clusters)
		features.forEach((f) => {
			this._enrichFeature(f);
			const style = this.styleRules.getStyle(f);
			if (style && typeof style.id === 'string') {
				let styleInfo = stylesInUse[style.id];
				if (!styleInfo) {
					styleInfo = {
						style: style
					};
					stylesInUse[style.id] = styleInfo;
				}

				let geometryType = f.n2_geometry;
				if (geometryType && !styleInfo[geometryType]) {
					styleInfo[geometryType] = f;
				}
			}
		});
	}

	// Called when the map detects that features have been redrawn
	_updatedStylesInUse() {
		this._dispatch({
			type: 'canvasReportStylesInUse'
			, canvasName: this.canvasName
			, stylesInUse: this._getMapStylesInUse()
		});
	}

	_handleDispatch(m, addr, dispatcher) {
		const _this = this;
		const { type } = m;

		if ('n2ViewAnimation' === type) {
			const { x, y } = m;
			const zoom = m.zoom || 9;
			if (m._suppressSetHash) {
				this._suppressSetHash = m._suppressSetHash
			}

			let extent = null;
			let targetCenter = [x, y];

			if (m.projCode) {
				const sourceProjCode = m.projCode;
				const targetProjCode = 'EPSG:3857';
				if (targetProjCode !== sourceProjCode) {
					const transformFn = getTransform(sourceProjCode, targetProjCode);
					// Convert [0,0] and [0,1] to proj
					targetCenter = transformFn([x, y]);
				}
				extent = this._computeFullBoundingBox(m.doc, 'EPSG:4326', 'EPSG:3857');
			}

			_this.n2View.cancelAnimations();
			if (extent) {
				//If projCode for extent is  provided, calculate the transformed 
				//extent and zoom into that
				if (extent[0] === extent[2] || extent[1] === extent[3]) {
					//If calculated extent is a point
					_this.n2View.animate({
							center: targetCenter,
							duration: 500
						}
						, {
							zoom: 9,
							duration: 500
						}
					);

				} else {
					_this.n2View.fit(extent, { duration: 1500 });
				}

			} else {
				// No projCode provided, just zoom in with targetCenter
				_this.n2View.animate({
					center: targetCenter
					, zoom: zoom
					, duration: 200
				});
			}

			const inid = setInterval(function () {
				const isPlaying = _this.n2View.getAnimating();

				if (isPlaying) {

				} else {
					_this._suppressSetHash = false;
					clearInterval(inid);
				}
			}, 100);

		} else if ('n2rerender' === type) {
			//This refresh strictly execute the invoke for rerender the ol5 map
			if (_this.n2Map) {
				_this.overlayLayers.forEach(function (overlayLayer) {
					overlayLayer.getSource().refresh();
				});
			}

		} else if ('mapRefreshCallbackRequest' === type) {
			//This refresh only execute the last invoke,
			//the earlier invoke will be cancelled if new invoke arrived
			if (m.cnt + 1 === this.refreshCnt) {
				const cb = this.refreshCallback;
				if (cb && typeof cb === 'function') {
					cb(null, this);
				}
			}

		} else if ('editInitiate' === type) {
			let fid = null;
			if (m.doc) {
				fid = m.doc._id;
			}

			let feature = null;
			let addGeometryMode = true;

			if (fid) {
				feature = this._getMapFeaturesIncludeingFidMapOl5(fid);

				if (feature) {
					this._centerMapOnFeature(feature);
					addGeometryMode = false;
				}
			}

			this.editFeatureInfo = {};
			this.editFeatureInfo.fid = fid;
			this.editFeatureInfo.original = {
				data: $n2.document.clone(m.doc)
			};

			if (addGeometryMode) {
				// Edit a document that does not have a geometry.
				// Allow adding a geometry.
				this.switchToAddGeometryMode(fid);
			} else {
				// Do not provide the effective feature. The event 'editReportOriginalDocument'
				// will provide the original geometry. The effective feature might have a simplified
				// version of the geometry
				this.switchToEditFeatureMode(fid);
			}

		} else if ('editClosed' === type) {
			let fid = this.editFeatureInfo.fid;
			if (!fid) {
				fid = m.docId;
			}

			let reloadRequired = true;
			if (m.cancelled) {
				reloadRequired = false;
			}

			// By switching to the navigate mode, the feature on the
			// edit layer will be removed.
			this.editLayerSource.clear();
			this._switchMapMode(this.modes.NAVIGATE);

			if (m.deleted && fid) {
				reloadRequired = false;

				this.forEachVectorLayer(function (layerInfo, layer) {
					let reloadLayer = false;
					const featuresToAdd = [];
					layerInfo.forEachFeature(function (f) {
						if (f.fid === fid) {
							reloadLayer = true;
						} else {
							featuresToAdd.push(f);
						}
					});

					if (reloadLayer) {
						layer.removeAllFeatures({ silent: true });
						layer.addFeatures(featuresToAdd);
					}
				});
			}

			this.editFeatureInfo = {};
			this.editFeatureInfo.original = {};

		} else if ('resolutionRequest' === type) {
			m.resolution = _this.resolution;
			m.proj = _this.proj;

		} else if ('canvasGetStylesInUse' === type && this.canvasName === m.canvasName) {
			m.stylesInUse = this._getMapStylesInUse();
			this.overlayInfos.forEach((info, idx) => {
				if (info._layerInfo.options.wmsLegend && info.visibility) {
					const legendUrl = _this.overlayLayers[idx].values_.source.getLegendUrl();
					_this.dispatchService.send(DH,
						{
							type: 'imageUrlLegendDisplay'
							, visible: true
							, legendUrl: legendUrl
							, wmsId: _this.overlayLayers[idx].ol_uid
							, canvasName: _this.canvasName
						})
				}
			})
		}
	}

	_getMapFeaturesIncludeingFidMapOl5(fidMap) {
		const result_features = [];
		if (this.features_ && this.features_.length > 0) {
			const features = this.features_;
			for (let loop = 0; loop < features.length; ++loop) {
				const feature = features[loop];
				if (feature.fid && fidMap[feature.fid]) {
					result_features.push(feature);
				} else if (feature.cluster) {
					for (let j = 0, k = feature.cluster.length; j < k; ++j) {
						const f = feature.cluster[j];
						if (f.fid && fidMap[f.fid]) {
							result_features.push(f);
						}
					}
				}
			}
		}

		return result_features;
	}

	_centerMapOnFeature(feature) {
		const extent = feature.getGeometry().getExtent();
		if (extent) {
			const map = this.n2Map;
			map.getView().fit(extent, map.getSize());
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
			&& f.nunaliit_geom.bbox) {
			const bbox = f.nunaliit_geom.bbox;
			let geomBounds = null;
			if (Array.isArray(bbox)) {
				geomBounds = transformExtent(bbox,
					new Projection({ code: srcProj }),
					new Projection({ code: dstProj })
				);
				return geomBounds;
			}
		}
	}

	_getDispatchService() {
		let d = null;
		if (this.options.directory) {
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

export function HandleCanvasAvailableRequest(m) {
	if (m.canvasType === 'map') {
		m.isAvailable = true;
	}
}

export function HandleCanvasDisplayRequest(m) {
	if (m.canvasType === 'map') {

		const options = {};
		if (m.canvasOptions) {
			for (let key in m.canvasOptions) {
				options[key] = m.canvasOptions[key];
			}
		}

		if (!options.elementGenerator) {
			// If not defined, use the one specified by type
			options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
				type: options.elementGeneratorType
				, options: options.elementGeneratorOptions
				, config: m.config
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
	ol_proj_Projection: Projection,
	ol_proj_transformExtent: transformExtent,
	ol_extent_extend: extend,
	ol_extent_isEmpty: isEmpty,
	ol_format_WKT: WKT
};

nunaliit2.canvasMap = {
	MapCanvas: N2MapCanvas
	, HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	, HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};
export default N2MapCanvas;
