/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.mapAndControls.js 8494 2012-09-21 20:06:50Z jpfiset $
*/

// @requires n2.utils.js

;(function($,$n2){

	// Localization
	var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

//**************************************************

var FeatureEvents = $n2.Class({
	
	options: null
	
	,initialize: function(options_) {
		this.options = $n2.extend({
				context: null
				,onOver: function() {}
				,onOut: function() {}
				,onClick: function() {}
				,onClickOut: function() {}
			},options_);
	}

	,over: function(feature){
		this._callback('onOver',[feature]);
	}
	
	,out: function(feature){
		this._callback('onOut',[feature]);
	}
	
	,click: function(feature){
		this._callback('onClick',[feature]);
	}
	
	,clickout: function(feature){
		this._callback('onClickOut',[feature]);
	}
	
	,_callback: function(type, args) {
		var fn = this.options[type];
		if( fn ) {
			fn.apply(this.options.context, args);
		};
	}
	
});	
	
//**************************************************
function OlkitAttributeFormManagerSidePanel(options_) {
	var defaultOptions = {
		tableName: 'names'
		,geomName: 'the_geom'
		,panelName: 'side'
		,selectAudioFn: function(feature_,cbFn){ alert('Feature not supported'); }
		,onFeatureInsertedFn: function(fid,feature){}
		,onFeatureUpdatedFn: function(fid,feature){}
		,onFeatureDeletedFn: function(fid,feature){}
		,onCancelFn: function(){}
		,onCloseFn: function(){}
		,uniqueIdentifier: 'place_id'
	};
	
	var options = $.extend({},defaultOptions,options_);
	
	var defaultFieldOpts = {
		'layer': {
			defaultValue: 1
			,choices: [
				{value:0,label:'Admin'}
				,{value:1,label:'Public'}
			]
		}
		,'hover_audio': {
			defaultValue: ''
			,select: function(cbFn){options.selectAudioFn(feature_,cbFn);}
		}
	};

	var cancelled = true;
	var editedFeature = null;
	var editedLayer = null;
	var originalGeometry = null;
	var originalStyle = null;
	var attributeDialog = null;
	var dbWebForm = null;
	var isInsert = 0;

    function showAttributeForm(feature_) {
    	editedFeature = feature_;
		editedLayer = editedFeature.layer;
    	cancelled = false;
    	isInsert = false;

		originalGeometry = editedFeature.geometry.clone();
		originalStyle = editedFeature.style;

		editedLayer.events.register('featuremodified', editedFeature, featureModified);

    	var attributeForm = null;
    	
		attributeDialog = $('#'+options.panelName);
		attributeDialog.empty();

		var dialogHeader = $('<p class="olkitAttrFormFeatureInstructions">Enter or edit the place attribute values:</p>');
		attributeDialog.append( dialogHeader );

		var attributeForm = $('<div class="olkitAttrFormFeatureAttributes"></div>');
		attributeDialog.append( attributeForm );

		var formButtons = $('<div class="olkitAttrFormButtons"></div>');
		installCancelButton();
		attributeDialog.append( formButtons );
		
		var fOpts = $.extend({}, defaultFieldOpts, options.fieldOpts);
        var dbWebFormOptions = {
        	tableName: options.tableName
        	,installButtons: function(buttons) {
        		formButtons.empty();
        		if( buttons.Save ) { installSaveButton( buttons.Save ) };
        		if( buttons['Delete'] ) { installDeleteButton( buttons['Delete'] ) };
        		installCancelButton();
        	}
        	,fieldOpts: fOpts
        	,onError: onError
        };
        var ids = editedFeature.fid ? editedFeature.fid.split('.') : [];
        if( ids.length > 1 ) {
			// Use id, if possible
        	dbWebFormOptions.whereClauses = [
 	        		$.NUNALIIT_DBWEB.formatWhereClause(
 	        			'id'
 	        			,$.NUNALIIT_DBWEB.whereComparison_eq
 	        			,ids[1]
 	        			)
 	        	];
        } else if( editedFeature.attributes[options.uniqueIdentifier] ) {
        	dbWebFormOptions.whereClauses = [
        		$.NUNALIIT_DBWEB.formatWhereClause(
        			options.uniqueIdentifier
        			,$.NUNALIIT_DBWEB.whereComparison_eq
        			,editedFeature.attributes[options.uniqueIdentifier]
        			)
        	];
        } else {
        	isInsert = true;
        	// Adding a new point, provide geometries from map
        	dbWebFormOptions.data = $.extend({},editedFeature.attributes);
        	
        	var geom = convertFeatureGeometryForDb(editedFeature);
        	dbWebFormOptions.data[options.geomName] = ''+geom;
        };
        dbWebForm = attributeForm.dbWebForm(dbWebFormOptions);
    	
    	function installSaveButton(cbFn) {
			var button = $('<input type="button" value="Save"/>');
			button.click(function(evt){
				cbFn({
					onSuccess: onSaved
					,onError: function(){alert('Error occurred while saving data');}
				});
			});
			formButtons.append(button);
    	};
    	
    	function installDeleteButton(cbFn) {
			var button = $('<input type="button" value="Delete"/>');
			button.click(function(evt){
		  		if( confirm('Do you really want to delete this feature?') ) {
    				cbFn({
    					onSuccess:onDeleted
    					,onError: function(){alert('Error occurred while deleting data');}
    				});
		  		};
			});
			formButtons.append(button);
    	};
    	
    	function installCancelButton() {
			var button = $('<input type="button" value="Cancel"/>');
			button.click(function(evt){
				cancelAttributeForm();
			});
			formButtons.append(button);
    	};
    	
    	function onSaved(savedData) {
			if( isInsert ) {
				// This is an insert
				var fid = options.tableName+'.'+savedData.id;
				options.onFeatureInsertedFn(fid,editedFeature);
			} else {
				// This is an update
				var fid = feature_.fid;
				options.onFeatureUpdatedFn(fid,editedFeature);
			};
			discardAttributeForm();
    	};
    	
    	function onDeleted() {
			var fid = feature_.fid;
			options.onFeatureDeletedFn(fid,feature_);
 			discardAttributeForm();
    	};
    	
    	function onError(error) {
			attributeDialog.empty();

			var errorDiv = $('<div class="olkitAttrFormError"></div>');
			attributeDialog.append( errorDiv );

			formButtons.empty();
			installCancelButton();
			attributeDialog.append( formButtons );
			
			// Print error
			var ul = $('<ul></ul>');
			errorDiv.append(ul);
			
			currentError = error;
			while(currentError) {
				var li = $('<li>'+currentError.message+'</li>');
				ul.append(li);
				
				currentError = currentError.cause;
			};
    	};
	};

	// Restores feature geometry before discarding the form
	function cancelAttributeForm() {
		if( cancelled ) return;
		cancelled = true;
	
		options.onCancelFn(editedFeature);

		// Reinstate the previous geometry		
		if( editedFeature && originalGeometry ) {
			// Erase feature before changing geometry
			if( editedFeature.layer ) {
				editedFeature.layer.eraseFeatures([editedFeature]);
			};
			editedFeature.geometry = originalGeometry;
		};
		
		discardAttributeForm();
	};

	function discardAttributeForm() {
		if( null == attributeDialog ) {
			return;
		};
		
		attributeDialog.empty();
		attributeDialog = null;
		dbWebForm = null;

		if( editedFeature ) {
			editedLayer.events.unregister('featuremodified', editedFeature, featureModified);
			
			// Reinstate the original style
			if( null !== editedFeature.layer ) { // test for deletion
				editedFeature.style = originalStyle;
				editedFeature.layer.drawFeature(editedFeature);
			};
		};

		options.onCloseFn(editedFeature);
		
		editedFeature = null;
		editedLayer = null;
		originalGeometry = null;
		originalStyle = null;
	};
	
    function convertFeatureGeometryForDb(feature) {
		var proj = feature.layer.map.projection;
		var internalSrsName = proj.getCode();
		if( internalSrsName != 'EPSG:4326' ) {
			// Need to convert
			var geom = editedFeature.geometry.clone();
			var dbProj = new OpenLayers.Projection('EPSG:4326');
			geom.transform(proj,dbProj);
			return geom;
		};
		return feature.geometry;
    };
	
    function featureModified(evt_) {
    	var feature = evt_.feature;
    	var geom = convertFeatureGeometryForDb(feature);
    	
    	if( dbWebForm ) {
    		dbWebForm.updateData(options.geomName,''+geom);
    	};
    };
	
	return {
		showAttributeForm: showAttributeForm
		,cancelAttributeForm:  cancelAttributeForm
	};
};

//**************************************************
//**************************************************

/**
	Creates an atlas and all associated controls. An
	elaborate set of options are provided to configure
	the atlas. The returning map contains functions that
	can be used to control the atlas after it is created.

 	@name mapAndControls
 	@function
 	@memberOf nunaliit2
 	@param {Object} options_ 
 		Object that describes options to configure the map and controls.
    @param {Object} options_.mapCoordinateSpecifications
    	Optional specification of map coordinate parameters, including:
    	- srsName: the coordinate system in which these parameters are expressed.
		- maxExtent: maximum geographical extent of the map - an array [ minX, minY, maxX, maxY ]
		- initialBounds: initially displayed map extent - an array [ minX, minY, maxX, maxY ]
		- useForMapControls: true => use projection specified by above srsName for map
		  controls (mouse position, etc.).
    @param {Object} options_.mapDisplay
    	Option specification of the map display (projection, resolution, background layers, units, optional display handler hook)
    @param {Boolean} options_.addPointsOnly=false
    	If true, editing the map can only add points.
    @param {Object} options_.placeDisplay
    	Options for the display handler.
    @param {Object} options_.background
    	Options for the display of background layers.
    @param {Object} options_.saveFeature
    	Defines how features are saved via the editing interface. Or, instance of editor.
    @param {String} options_.sidePanelName='side' 
    	Identifier of the &lt;div&gt; element where the textual display should be rendered.
    @param {String} options_.filterPanelName
    	Identifier of the &lt;div&gt; element where local map filters should be displayed.
		If not specified (null), then local map filtering is disabled.
    @param {Boolean} options_.toggleClick=true 
    	If set, then clicking on a feature in a clicked 'state' turns off
		the clicking state. When turning off this way, the event 'unselected' is
		dispatched. If reset, clicking on a feature multiple
		times is ignored.
    @param {String} options_.uniqueIdentifier='place_id'
		Name of the feature attribute which uniquely identifies the feature.
		This is important to coordinate all the map extensions. It defaults to 'place_id'
		for legacy reasons.
    @param {Object} options_.dbSearchEngine
		Options to configure the database search engine (@link nunaliit2#dbSearchEngine). 
    @param {Object} options_.contributionDb
		Options to configure the contribution database.
    @param {Array} options_.layerInfo
		Object or Array of Objects. Each object represents the options for one displayed layer.
    @param {String} options_.layerInfo.sourceSrsName
		Projection name used in WFS requests. Defaults to 'EPSG:4326'
    @param {String} options_.layerInfo.featurePrefix
		Short name used in WFS request as 'namespace' or 'workspace'.
    @param {String} options_.layerInfo.featureType
		Name used in WFS request to identify a particular layer. 
    @param {String} options_.layerInfo.featureNS
		Full namespace for layer used in WFS requests.
    @param {String} options_.layerInfo.name
		Label by which layer should be referred to.
    @param {Object} options_.layerInfo.filter
		Null if not used. Null by default. This is a JSON object
		that represents a filter for the layer. If specified,
		the filter is sent during WFS requests. Syntax for
		filters is defined by nunaliit2.CreateOpenLayersFilter().
    @param {Function} options_.layerInfo.featurePopupHtmlFn
		Function called when a feature pop up is displayed. This function
		is called with an object contain the feature being hovered and
		a call back function (onSuccess). The onSuccess callback should
		be called with the generated HTML when it is available. If no
		popup should be created for this feature, then onSuccess should not
		be called. By default this option is null and popups are not
		generated.
    @param {Number} options_.layerInfo.featurePopupDelay
		Amount of time, in milliseconds, that should elapse between the
		time a user hovers a feature and the time the popup is generated for it.
		Defaults to 0.
    @param {Boolean} options_.layerInfo.visibility=true
		If set, the layer is initially visible. If false, the layer is
 		initially turned off.
    @param {Function} options_.layerInfo.styleMapFn
		Function called to retrieve a style map for the layer.
		If not specified, a style map based on defaults and extended using
		the property 'styleMap' is built.
    @param {Object} options_.layerInfo.styleMap
		Options to override default styles for a layer. If property
		'styleMapFn' is specified, then this property is probably ignored.
    @param {Function} options_.layerInfo.selectListener
		This function is called when the visibility of a layer
		is changed. Protoype is: function(isSelected, layerInfo)

    @returns {Object} Map of function that can be called
                      to control the behaviour of the 
                      atlas after it is created.
 */

function defaultPopupHtml(opt_) {
	var attrs = opt_.feature.attributes;
	var resArray = [];
	resArray.push('Name: '+  (attrs.placename?attrs.placename:'') + '<br/>');
	resArray.push('Meaning: '+  (attrs.meaning?attrs.meaning:'') + '<br/>');
	resArray.push('Entity: '+  (attrs.entity?attrs.entity:'') + '<br/>');
	var html = resArray.join('');
	opt_.onSuccess(html);
};

var MapAndControls = $n2.Class({
	
	options: null
	,dbSearchEngine: null
	,contributionDb: null
	,map: null
	,editLayer: null
	,html: null
	,dbSrsName: null
 	,lastMapXy: null
 	,mapMouseMoveListeners: null
	,olkitDisplayOptions: null
	,pendingMarkInfo: null
	,attributeFormManagerOptions: null
	,attributeFormManager: null
	,currentPopup: null

    // HOVER and CLICK
	,selectFeatureControl: null
	,hoverInfo: null
	,clickedInfo: null

    // MODES
	,modes: null
	,currentMode: null

	// MAP MODES
	,navigationControls: null
	,editControls: null
	,editFeatureControls: null
	,mapInteractionName: null
	,mapInteractionDivName: null
 	,mapInteractionButton: null

 	// EDIT mode callbacks
	,editModeAddFeatureEnabled: null
	,editModeAddFeatureCallback: null
    ,convertToMultiGeometry: null
    ,featureModifiedCallback: null

    // COMETD
    ,cometEnabled: null
    ,fidChannel: null
    ,contributionChannel: null

    // STYLE
	,defaultStyleMap: null
	,styleFilterIndex: null
	,styleFilters: null

	// map layers
	,defaultLayerInfo: null
	,baseLayers: null
	,vectorLayers: null
	,infoLayers: null
	,layers: null
	,mapBusyCount: null
	,busyMapControl: null
	
	,initialize: function(options_){
		var _this = this;
		
		if( typeof(OpenLayers) == 'undefined' ) {
			$n2.reportError('OpenLayers is required.');
			return null;
		};
		
		var defaultOptions = {
			mapCoordinateSpecifications: {
				/*
				 * The set of (internally) consistent defaults for describing the map display.  Note that the default
				 * map display is set up for Google backgrounds and uses Google's spherical Mercator (900913).  So this
				 * is a description of the map coordinate space for Google's projection BUT specified in WGS84 lat long
				 * coordinate space.  It is transformed as needed to the actual target coordinate space.
				 */
				srsName: 'EPSG:4326'
				,maxExtent: [-180,-85.05,180,85.05] // Max extent provided by Google imagery
				,restrictedExtent: null
				,initialBounds: [-180,-90,180,90]
				
				/*
				 * Use this coordinate space for map controls (such as the mouse position tracker)?  By default,
				 * OpenLayers will use the map projection but, if specified, this reprojects back to a different
				 * projection for user displays (this is supposed to be LESS confusing).
				 *
				 * Default is TRUE because the original atlases used this behaviour to display Google map backgrounds
				 * (using the default mapDisplay.srsName projection below which is in meter units) with the controls 
				 * configured to display NAD83 lat lon (EPSG:4326).  Perfectly reasonable if the user is used to
				 * working with their data in lat/long (as evidenced by the boundng box, etc. being specified in
				 * lat/long).
				 */ 
				,useForMapControls: true
			}
			,mapDisplay: {
				srsName: 'EPSG:900913' // the projection the map is actually displayed in.
				,background: null
				,maxResolution: 156543.0339 // if not using Google proj, compute as maxExtent / expected map display size (in pixels).
				,units: 'm' // map units

				// sets up map display if needed BEFORE the point is marked.
				// @param feature attributes for feature about to be marked.
				// @return millisecond counter to be used as a delay before trying to continue to highlight searched location.
				,markFeatureAsClicked_setupHandler: function(attributes){ return 0; }
			}
			,addPointsOnly: false
			,placeDisplay: { // place info panel display options.
				attribDisplayType: 'attributes' // default - just list the attributes in a table	
				,attribTableHeading: "Place Data:" // display heading for place attributes table format.
				,attribTableDiv: "side_attrib" /* this div is created dynamically */
				,attribTableClassBase: "attrib" /* modified as needed to create columns - see $n2.placeInfo */
				,attribHtmlFn: null // attribHtmlFn(divName, options, attributeObj) - returns html string 

				,contribTableDiv: "side_contrib"  /* this div is created dynamically */
				,contribTableClassBase: "contrib" /* modified as needed to create columns - see $n2.placeInfo */
				,contribTableShowAuthor: true // default - show the contributor id
				,contribTableShowCreateTS: true // default - show creation timestamp
				,contribEmbedAudioDirectly: false // default - link to modal display for contribution audio player
				,contribShowLastEditInfo: true // default - show id and time for last update
				,contribMediaDisplayVideoHeight: 240
				,contribMediaDisplayVideoWidth: 320
				,contribAdditionalFields: [] // default none - see contributionDisplayFormatter for format comment
				,contribIndexingType: 'default' // standard contributions (with related responses) sorting
				
				// should the atlas auto-add a contribution record when a feature is added?
				,contribInsertedReloadAddContrib: true // yes by default
				,contribInsertedReloadDataFn: null // use built-in by default which makes assumptions about the structure of contributions records

				,contributionOptions: { // mostly form layout and db exchange handling - see contributions.js
					anonymousAllowed: true
				}
			}
			,saveFeature: {} // save feature details
			,sidePanelName: 'side'
			,filterPanelName: null
			,toggleClick: true
			,uniqueIdentifier: 'place_id'
			,layerSwitcher: {
				suppress: false
				,initiallyOpened: false
			}
			,directory: null // service directory
			,mapIdentifier: 'map'
		};
		this.options = $.extend(true, {}, defaultOptions, options_);

		this.dbSearchEngine = $n2.dbSearchEngine( (options_ ? options_.dbSearchEngine : null) );

		this.contributionDb = $n2.contributionDb( (options_ ? options_.contributionDb : null) );

		this.map = null;
		this.editLayer = null;
		this.html = "";
		this.dbSrsName = null; // Need to get SRS name from database, but for now that's OK
		this.lastMapXy = null;
		this.mapMouseMoveListeners = [];
		this.olkitDisplayOptions = {};
		this.pendingMarkInfo = null;
		this.mapBusyCount = 0;

	    // HOVER and CLICK
		this.selectFeatureControl = null;
	    this.hoverInfo = {
			feature: null
			,endFn: []
		};
		this.clickedInfo = {
			feature: null
			,endFn: []
			,fids: {}
		}

		// MODES
		this.modes = {
			NAVIGATE: {
				name        : "NAVIGATE"
				,buttonValue : "Add or Edit a Map Feature"
				,onStartHover: function(feature) {
					_this.hoverFeature(feature);
					_this.hoverFeaturePopup(feature);
				}
				,onEndHover: function(feature) {
				}
				,onStartClick: function(feature) {
					_this.initAndDisplayClickedPlaceInfo(feature);
				}
				,onEndClick: function(feature) {
				}
			}
			,EDIT: {
				name        : "EDIT"
				,buttonValue : "Cancel Feature Editing"
				,onStartHover: function(feature) {
					_this.hoverFeature(feature);
					_this.hoverFeaturePopup(feature);
				}
				,onEndHover: function(feature) {
				}
				,onStartClick: function(feature) {

					var editAllowed = true;
					if( typeof feature.attributes.layer != 'undefined' ) {
						if( '0' == feature.attributes.layer && !this.isAdminUser() ) {
							editAllowed = false;
							alert('This feature can be edited only by an administrator');
						};
					};
					
					if( editAllowed ) {
						_this.switchToEditFeatureMode(feature);
			    		_this._dispatch({
			    			type: 'editInitiate'
			    			,docId: null
			    			,feature: feature
			    			,create: true
			    		});
					};
				}
				,onEndClick: function(feature) {
				}
			}
			,EDIT_FEATURE: {
				name        : "EDIT_FEATURE"
				,buttonValue : "Cancel Feature Editing"
			}
		};
		this.currentMode = this.modes.NAVIGATE;

	    // MAP MODES
		this.mapInteractionName = "map_interaction";
		this.mapInteractionDivName = this.mapInteractionName + "_div";
	 	this.mapInteractionButton = null;

	 	// COMETD
	    this.cometEnabled = true;
	    this.fidChannel = '/fid';
	    this.contributionChannel = '/contribution';
	    
	    this._registerDispatch('documentVersion');
	    this._registerDispatch('documentDeleted');
	    this._registerDispatch('featureCreated');
	    this._registerDispatch('featureUpdated');
	    this._registerDispatch('addLayerToMap');
	    this._registerDispatch('selected');
	    this._registerDispatch('unselected');
	    this._registerDispatch('focusOn');
	    this._registerDispatch('focusOff');
	    this._registerDispatch('findOnMap');
	    this._registerDispatch('searchInitiate');
	    this._registerDispatch('editInitiate');
	    this._registerDispatch('editCancel');
	    this._registerDispatch('editClosed');
	    this._registerDispatch('geometryModified');
		
		// Layers
		this.defaultLayerInfo = { // feature layer access details.
			 /*
			  * sourceSrsName: default source projection of WFS feature data - Geoserver can reproject but cannot
			  * handle a bbox param on a GetFeature in reprojected coordinates.  This is used to tell the atlas 
			  * what coordinates to use when request the vector layer features.
			  */
			sourceSrsName: 'EPSG:4326'
			
			// featurePrefix and featureType jointly form the WFS typename for this layer but because we now
			// use filtering on layers, this typename (featurePrefix:featureType) is not unique.
			,featurePrefix: null
			,featureType: null
			
			// Full name space associated with prefix
			,featureNS: null
			
			// name should be unique - doesn't have to be but this is used in the layer switcher so
			// the map designer should be selecting something to differentiate ... this is used for
			// regenerating a specific layers style map.
			,name: null
			
			// filter for selection of features from the WFS layer
			,filter: null
			
			,featurePopupHtmlFn: null
			,featurePopupDelay: 0
			,visibility: true
			
			// Style Map fn - returns an OpenLayers style map to be installed
			// on the layer.  
			//
			// If not specified, a style map based on a defaults and extended
			// using the property 'styleMap' is created.
			,styleMapFn: function(layerInfo){ 
				return _this.CreateStyleMapFromLayerInfo(layerInfo); 
			}

			// To update the default style associated with a layer, insert an object containing the
			// named styles e.g.
			// layerInfo.styleMap: {
			//   normal: {
			//     strokeColor: "#f4f4f4"		
			//   }
			//   ,clicked: {
			//     strokeColor: "#ff0000"
			//   }
			// }
			// The style names in use are:
			// - normal -> default style for features
			// - hovered -> style when a feature is moused over
			// - clicked -> style when a feature is currently selected (clicked on)
			// - hoveredClicked -> style when a feature is currently selected (clicked on) and moused over
			// - filteredOut -> style when a feature does not fall within a filter
			// 
			// If the property 'styleMapFn' is provided, then this property is most
			// likely going to be ignored. 
			,styleMap: null

			,selectListener: function(isSelected, layerInfo){}
		};
		this.infoLayers = [];
		
		if( typeof(this.options.layerInfo) === 'object' && !$n2.isArray(this.options.layerInfo) ) {
			this.options.layerInfo = [this.options.layerInfo];
		};
		
		// Feature Attribute Form
		this.attributeFormManagerOptions = {
			selectAudioFn: function(feature, onSelectCallback){ _this.selectAudioMedia(feature, onSelectCallback); }
			,onFeatureInsertedFn: function(fid, feature){ _this.onAttributeFormInserted(fid, feature); }
			,onFeatureUpdatedFn: function(fid, feature){ _this.onAttributeFormUpdated(fid, feature); }
			,onFeatureDeletedFn: function(fid, feature){ _this.onAttributeFormDeleted(fid, feature); }
			,onCancelFn: function(editedFeature){ _this.onAttributeFormCancelled(editedFeature); }
			,onCloseFn: function(editedFeature){ _this.onAttributeFormClosed(editedFeature); }
			,uniqueIdentifier: this.options.uniqueIdentifier
			,panelName: null
		};
		this.attributeFormManagerOptions.panelName = this.options.sidePanelName;
		if( this.options.saveFeature && this.options.saveFeature.isFormEditor ) {
			this.attributeFormManager = this.options.saveFeature;
		} else {
			// Legacy
			var afmOpts = $.extend(
				{}
				,this.attributeFormManagerOptions
				,(null != this.options.saveFeature ? this.options.saveFeature : {})
			);
			var attributeFormManagerCreateFn = afmOpts.createFn;
			if( !attributeFormManagerCreateFn ) {
				attributeFormManagerCreateFn = OlkitAttributeFormManagerSidePanel;
			}
			this.attributeFormManager = attributeFormManagerCreateFn( afmOpts );
		};
		
		initContributionHandler(jQuery, this.options.placeDisplay.contributionOptions);
		
		// Install callback
		if( $.progress && $.progress.addProgressTracker) {
			function progressOnStopCb(keyInfo,options) {
				if( keyInfo && keyInfo.data && keyInfo.data.place_id ) {
					if ($n2.placeInfo.getPlaceId() == keyInfo.data.place_id) {
						$n2.placeInfo.loadAndRenderContributions();
					}
				}
			};
		
			$.progress.addProgressTracker({
					onStart: function(){} 
					,onUpdate: function(){} 
					,onComplete: progressOnStopCb
					,onRemove: function(){}
				});
		} else {
			log('Progress module not found. Activity tracking will not be available.'); 
		};
		
		// Configure display
		if( $.olkitDisplay ) {
			$.olkitDisplay.Configure(this);
			this.olkitDisplayOptions = $.extend(
					{}
					,this.options.placeDisplay
					,{ 
						displayDiv: this.options.sidePanelName
					}
				);
		} else if( $n2.placeInfo ) {
			this.olkitDisplayOptions = $.extend(
				{}
				,this.options.placeDisplay
				,{
					displayDiv: this.options.sidePanelName
				}
			);
			$n2.placeInfo.Configure(this.olkitDisplayOptions,this.dbSearchEngine, this.contributionDb);
		};

		// STYLE
		//
		// This is the default style used by the atlas. Each layer is built
		// using this style, unless an attribute "styleMap" is defined. If
		// "styleMap" is defined, then the default map is extended using the
		// provided one and the OpenLayers StyleMap is created from it.
		//
		this.defaultStyleMap = {
			'normal': {
				fillColor: "#ffffff",
				fillOpacity: 0.4,
				strokeColor: "#ee9999",
				strokeOpacity: 1,
				strokeWidth: 1,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 6,
				pointerEvents: "visiblePainted"
			}
			,'clicked': {
				fillColor: "#ffffff",
				fillOpacity: 0.1,
				strokeColor: "#ff2200",
				strokeOpacity: 1,
				strokeWidth: 3,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 8,
				pointerEvents: "visiblePainted"
			}
			,'hovered': {
				fillColor: "#0000ff",
				fillOpacity: 0.4,
				strokeColor: "#0000ff",
				strokeOpacity: 1,
				strokeWidth: 1,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 6,
				pointerEvents: "visiblePainted",
				cursor: "pointer"
			}
			,'hoveredClicked': {
				fillColor: "#0000ff",
				fillOpacity: 0.4,
				strokeColor: "#ff2200",
				strokeOpacity: 1,
				strokeWidth: 3,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 8,
				pointerEvents: "visiblePainted",
				cursor: "pointer"
			}
			,'filteredOut': {
				display: 'none'
			}
		};
		this.styleFilterIndex = 0;
		this.styleFilters = {};

		// Create switch before installing auth listener 
		// as to have constant behaviour
		this.createMapInteractionSwitch();

	    /*
	     * Install login listener - it is run when first added
	     * Note that initialization of auth happens in app specific code.
	     */
	    if( $.NUNALIIT_AUTH ) {
			$.NUNALIIT_AUTH.addListener(function(currentUser){
				_this.loginStateChanged(currentUser);
			});
	    };
	    
	    // Install feature caching
	    if( $n2.cache && $n2.cache.defaultCacheService ) {
	    	$n2.cache.defaultCacheService.addCacheFunction(function(id){
	    		return _this._retrieveCachedValue(id);
	    	});
	    };
	    
	    // EDIT mode callbacks
	    this.editModeAddFeatureEnabled = true;
		this.editModeAddFeatureCallback = function(evt) {
			// This function is called when a feature is added
			// to the edit layer. This happens when a toolbar adds
			// a new feature i.e. when the user selects to add a new
			// point, line or polygon.
			// This function could also called when a feature is added
			// by another user and detected via cometd.
	    	if( _this.editModeAddFeatureEnabled ) {
		    	var feature = evt.feature;
		    	if( feature ) {
		    		// Remember that this is a newly added feature
		    		feature._n2MapNewFeature = true;
		    	};
	    		_this.switchToEditFeatureMode(feature);
	    		_this._dispatch({
	    			type: 'editInitiate'
	    			,docId: null
	    			,feature: feature
	    			,create: true
	    		});
	    	};
		};
	    this.convertToMultiGeometry = function(evt) {
			for (var i=0; i<evt.features.length; ++i) {
				if( evt.features[i].geometry.CLASS_NAME === OpenLayers.Geometry.Point.prototype.CLASS_NAME ) {
					evt.features[i].geometry = new OpenLayers.Geometry.MultiPoint([evt.features[i].geometry]);
					
				} else if( evt.features[i].geometry.CLASS_NAME === OpenLayers.Geometry.LineString.prototype.CLASS_NAME ) {
					evt.features[i].geometry = new OpenLayers.Geometry.MultiLineString([evt.features[i].geometry]);
					
				} else if( evt.features[i].geometry.CLASS_NAME === OpenLayers.Geometry.Polygon.prototype.CLASS_NAME ) {
					evt.features[i].geometry = new OpenLayers.Geometry.MultiPolygon([evt.features[i].geometry]);
				};
			};
	    };
	    this.featureModifiedCallback = function(evt){
	    	_this._featureModified(evt);
	    };

		var mapProjection = new OpenLayers.Projection(this.options.mapDisplay.srsName);
		var userCoordProjection = new OpenLayers.Projection(this.options.mapCoordinateSpecifications.srsName);

		// Convert initial bounds to the map's projection
		var initialZoomBounds = new OpenLayers.Bounds(
			this.options.mapCoordinateSpecifications.initialBounds[0]
			,this.options.mapCoordinateSpecifications.initialBounds[1]
			,this.options.mapCoordinateSpecifications.initialBounds[2]
			,this.options.mapCoordinateSpecifications.initialBounds[3]
		);
		if( userCoordProjection.getCode() != mapProjection.getCode() ) {
			initialZoomBounds.transform(userCoordProjection, mapProjection);
		};
		
		// Convert max extent from map coord specification space to map display projection
		var maxExt = new OpenLayers.Bounds(
				this.options.mapCoordinateSpecifications.maxExtent[0]
				,this.options.mapCoordinateSpecifications.maxExtent[1]
				,this.options.mapCoordinateSpecifications.maxExtent[2]
				,this.options.mapCoordinateSpecifications.maxExtent[3]
				);
		if( userCoordProjection.getCode() != mapProjection.getCode() ) {
			maxExt.transform(userCoordProjection, mapProjection);
		};
		
		// Convert restrictedExtent
		var restrictedExtent = null;
		if( this.options.mapCoordinateSpecifications.restrictedExtent ){
			restrictedExtent = new OpenLayers.Bounds(
					this.options.mapCoordinateSpecifications.restrictedExtent[0]
					,this.options.mapCoordinateSpecifications.restrictedExtent[1]
					,this.options.mapCoordinateSpecifications.restrictedExtent[2]
					,this.options.mapCoordinateSpecifications.restrictedExtent[3]
					);
			if( userCoordProjection.getCode() != mapProjection.getCode() ) {
				restrictedExtent.transform(userCoordProjection, mapProjection);
			};
		};

		this.map = new OpenLayers.Map(this.options.mapIdentifier, {
			projection: mapProjection
			,displayProjection: (this.options.mapCoordinateSpecifications.useForMapControls ? userCoordProjection : mapProjection)
			,units: this.options.mapDisplay.units
			,maxResolution: this.options.mapDisplay.maxResolution
			,maxExtent: maxExt
			,restrictedExtent: restrictedExtent
			,theme: null // Let host page control loading of appropriate CSS style sheet
		});
		
		// Disable zoom on mouse wheel
		var navControls = this.map.getControlsByClass('OpenLayers.Control.Navigation');
		for(var i=0,e=navControls.length; i<e; ++i) {
			navControls[i].disableZoomWheel();
		};
		
		// Fix zoomToMaxExtent to zoom to initial extent
		this.map.zoomToMaxExtent = function(){
	        this.zoomToExtent(initialZoomBounds);
		};

		// Create control before layers start loading
		this.busyMapControl = new OpenLayers.Control.N2LoadingPanel();

		// Create map layers
		this.baseLayers = [];
		this.vectorLayers = [];
		this.infoLayers = [];
		
		// Generate background layers
		this.genBackgroundMapLayers(this.options);
		
		// Create edit layer
		var editLayerStyleMap = this.CreateEffectiveStyleMap(null);
		this.editLayer = new OpenLayers.Layer.Vector(
			'Edit'
			,{
				//styleMap: generateDefaultFeatureLayerStyleMap()
				styleMap: editLayerStyleMap
				,displayInLayerSwitcher:false
				,projection: new OpenLayers.Projection('EPSG:4326')
				//,renderers: ['Canvas','SVG','VML']
				,renderers: ['SVG','VML']
			}
		);
		this.vectorLayers.push(this.editLayer);
		
		// Create vector layer for user defined layers
		this.layers = {};
		if( this.options.layerInfo ) {
			for(var loop=0; loop<this.options.layerInfo.length; ++loop) {
				var layerOptions = this.options.layerInfo[loop];
				this.createLayerFromOptions(layerOptions);
			};
		};
		
		// Create vector layers based on layer definition used in couchModule
		if( this.options.overlays ) {
			for(var loop=0; loop<this.options.overlays.length; ++loop) {
				var layerDefinition = this.options.overlays[loop];
				this._createOLLayerFromDefinition(layerDefinition,false);
			};
		};
		
		// Detect if all layers are invisible set to be invisible
		var allLayersInitiallyInvisible = true;
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var olLayer = this.infoLayers[i].olLayer;
			if( true == olLayer.visibility ) {
				allLayersInitiallyInvisible = false;
			};
		};
		
		this.map.addLayers(this.baseLayers.concat(this.vectorLayers));

		this.map.addControl(new OpenLayers.Control.MousePosition({
			displayProjection: (this.options.mapCoordinateSpecifications.useForMapControls ? 
					userCoordProjection : mapProjection)
		}));
		
		// Layer switcher control
		var showLayerSwitcher = true;
		if( this.options.layerSwitcher
		 && this.options.layerSwitcher.suppress ) {
			showLayerSwitcher = false;
		};
		if( showLayerSwitcher ) {
			var layerSwitcherControl = new OpenLayers.Control.LayerSwitcher();
			this.map.addControl(layerSwitcherControl);
			if( this.options.layerSwitcher
			 && this.options.layerSwitcher.initiallyOpened ) {
				layerSwitcherControl.maximizeControl();
			} else if( allLayersInitiallyInvisible ) {
				layerSwitcherControl.maximizeControl();
			};
		};

		// Zoom to initial bounds
		this.map.zoomToExtent(initialZoomBounds);

		// Draw controls
		this.navigationControls = {
		};
		this.editControls = {
		};
		this.editFeatureControls = {
		};
		
		// Handle feature events
		this._installFeatureSelector();
		
    	// Select adding of new features
    	if( this.options.addPointsOnly ) {
    		// Maps with points only
    		this.editControls.addPoints = new OpenLayers.Control.DrawFeature(this.editLayer,OpenLayers.Handler.Point);
    		this.map.addControl(this.editControls.addPoints);
    	} else {
    		// Maps with all geometry types
    		this.editControls.toolbar = new OpenLayers.Control.EditingToolbar(this.editLayer, {autoActivate: false});
    		this.map.addControl(this.editControls.toolbar);
    		this.editControls.toolbar.deactivate();
        	
        	// Work around for bug in EditingToolbar (http://trac.openlayers.org/ticket/2182)
    		this.editControls.toolbar.defaultControl = this.editControls.toolbar.controls[0];
    	};
		
		// Busy map control should be last so it is drawn on top
		this.map.addControl(this.busyMapControl);
		
    	this.map.events.register( 'mousemove', null, function(evt){
    		_this._handleMapMousePosition(evt);
		});

		this.initCometChannels();
	}

	,getNamedLayerInfo: function(name) {
		for(var i=0,e=this.infoLayers.length; i<e; ++i) {
			var layer = this.infoLayers[i];
			if( layer.name === name ) {
				return layer;
			} else if( layer.id === name ) {
				return layer;
			};
		}
		return null;
	}

	,insertSound: function(surl) {
		if (surl) {
			var effectiveUrl = this.dbSearchEngine.getRelMediaPath(surl);
			$('#dhtmlsound').html('<embed src="'+effectiveUrl+'" hidden="true" autostart="true" loop="false"/>');
		} else {
			$('#dhtmlsound').empty();
		};
	}
	
	,initAndDisplayClickedPlaceInfo: function(feature) {
		var dispatchService = this._getDispatchService();
		if( dispatchService ) {
			var handle = dispatchService.getHandle('n2.mapAndControls');
			
			dispatchService.send(handle, {
				type: 'selected'
				,docId: feature.data._id
				,doc: feature.data
				,feature: feature
	 		});

		} else {
			$n2.placeInfo.setFeatureReinitDisplay(feature);
			$n2.placeInfo.loadAndRenderContributions();
		};
	}
	
	,markFeatureAsClicked: function(opts_) {
		
		var _this = this;

		var pendingInfo = $.extend({
				uniqueId: null
				,fid: null
				,highlightHoverOnly: false
			}
			,opts_
			,{
				count: 15
				,cancelled: false
			}
		);

		// Cancel previous requests
		if( this.pendingMarkInfo ) {
			this.pendingMarkInfo.cancelled = true;
		};
		
		// Remember new options
		this.pendingMarkInfo = pendingInfo;
		
		tryMarkFeatureAsClicked(pendingInfo);
		
		function tryMarkFeatureAsClicked(pendingInfo) {
			
			function findFeature(pend) {
				var found = null;
				for (var loop=0; loop<_this.vectorLayers.length; ++loop) {
					var mapLayer = _this.vectorLayers[loop];
					for (var i=0; i<mapLayer.features.length; i++) {
						var f = mapLayer.features[i];
						if ($n2.isDefined(pend.fid) && pend.fid == f.fid) {
							found = f;
							break;
						} else if ($n2.isDefined(pend.uniqueId) &&  pend.uniqueId == f.attributes[options.uniqueIdentifier]) {
							found = f;
							break;
						};
					};
				};
				return found;
			};
			
			/*
			 * note that both users of this share the same sanity count ... it is not restarted because it
			 * is essentially infinity...!
			 */
			function decrementAndTryAgain(pendingInfo, stFn) { // @param st a to be called in setTimeout
				if( --pendingInfo.count > 0 ) { // Try again in 1 sec
					setTimeout(stFn, 1000);
				} else {
					$n2.log('tryMarkFeatureAsClicked: sanity count expired.');
				};
			};
			
			function tryForcedFeatureClick(pendingInfo) {
				if( pendingInfo.cancelled ) return;
				
				/*
				 * redo the feature search - layer activity can regen features it seems leaving the feature
				 * found earlier as a stranded (destroyed) feature.  Go back to the layers... and don't pass 
				 * the old feature in as an argument.
				 */
				var f = findFeature(pendingInfo);
				if ($n2.isDefined(f) && $n2.isDefined(f.layer)) {
					if( pendingInfo.highlightHoverOnly ) {
						_this._highlightHoveredFeature(f, true)
					} else {
						_this.startClicked(f, true);
					};
				} else {
					decrementAndTryAgain(pendingInfo, function(){ tryForcedFeatureClick(pendingInfo); });
				};
			};
			
			function delayedFeatureClick(pendingInfo, d) {
				setTimeout(function(){ tryForcedFeatureClick(pendingInfo); }, d);
			};

			// Check if cancelled
			if( pendingInfo.cancelled ) return;
			
			var foundFeature = findFeature(pendingInfo);
			
			if ($n2.isDefined(foundFeature) && $n2.isDefined(foundFeature.attributes)) {
				var addDelay = _this.options.mapDisplay.markFeatureAsClicked_setupHandler(foundFeature.attributes);
				delayedFeatureClick(pendingInfo, addDelay);
			} else {
				// Not found
				decrementAndTryAgain(pendingInfo, function(){ tryMarkFeatureAsClicked(pendingInfo); });
			};
		};
	}

	,getFeatureFromFid: function(fid){
		for(var loop=0; loop<this.infoLayers.length; ++loop) {
			var layerInfo = this.infoLayers[loop];
			var feature = this.getLayerFeatureFromFid(layerInfo.olLayer,fid);
			if( feature ) {
				return feature;
			};
		};
		
		return null;
	}
	
	,getLayerFeatureFromFid: function(layer,fid) {
		
		if( layer && layer.features ) {
			var loop;
			var features = layer.features;
			for(loop=0;loop<features.length;++loop) {
				if( features[loop].fid && features[loop].fid === fid ) {
					return features[loop];
				};
			};
		};
		
		return null;
	}
	
	,getLayerFeaturesFromFilter: function(layer,filter) {
		var r = [];
		
		if( layer && layer.features ) {
			var loop;
			var features = layer.features;
			for(var i=0,e=features.length; i<e; ++i) {
				var f = features[i];
				if( filter.matches(f) ) {
					r.push(f);
				};
			};
		};
		
		return r;
	}
	
	,_reloadFeature: function(filter,options_) {
		var _this = this;
		
		// Figure out options
		var reloadOptions = $.extend({
			onReloaded: function(feature){}
		},options_);

		// Figure out which layers to reload
		var reloadInfoLayers = [];
		for(var loop=0; loop<this.infoLayers.length; ++loop) {
			var layerInfo = this.infoLayers[loop];
			var features = this.getLayerFeaturesFromFilter(layerInfo.olLayer,filter);
			if( features.length > 0 ) {
				reloadInfoLayers.push(layerInfo);
			};
		};
		
		// If no layer was selected, then it must be a new feature.
		// Attempt reloading all
		if( 0 == reloadInfoLayers.length ) {
			for(var loop=0; loop<this.infoLayers.length; ++loop) {
				var layerInfo = this.infoLayers[loop];
				reloadInfoLayers.push(layerInfo);
			};
		};
		
		// Reload selected layers		
		for(var loop=0; loop<reloadInfoLayers.length; ++loop) {
			var layerInfo = reloadInfoLayers[loop];
			var protocol = layerInfo.protocol;
			
			// Create filter
			var olFilter = filter.getOpenLayerFilter();
			
	        protocol.read({
    	        filter: olFilter
    	        ,callback: createCallback(layerInfo, reloadOptions)
    	        //,scope: this
	        });
		};
		
		function createCallback(layerInfo, reloadOptions) {
			var cb = function(resp) {
				if( resp.code !== OpenLayers.Protocol.Response.SUCCESS ) {
					alert('Error while obtaining a new feature.\n'
						 +'Map might not display up-to-date information.\n'
						 +'You might need to refresh your page.');
				};

				// Filter features
				var features = [];
				if( resp.features ) {
					for(var featureLoop=0; featureLoop<resp.features.length; ++featureLoop) {
						var feature = resp.features[featureLoop];
						if( null != layerInfo.olFilter ) {
							if( false == layerInfo.olFilter.evaluate(feature.attributes) ) {
								feature = null;
							};
						};
						if( null != feature ) {
							features.push(feature);
						};
					};
				};
				
				// Reproject features, if needed
		        if( features.length > 0) {
		            var remote = layerInfo.olLayer.projection;
        		    var local = layerInfo.olLayer.map.getProjectionObject();
		            if( false == local.equals(remote) ) {
		                for(var featureLoop=0; featureLoop<features.length; ++featureLoop) {
        		            var geom = features[featureLoop].geometry;
                		    if( null != geom ) {
                        		geom.transform(remote, local);
		                    };
        		        };
		            };
		        };
		        
				// Merge features
				for(var featureLoop=0; featureLoop<features.length; ++featureLoop) {
					// Read in feature
					var loadedFeature = features[featureLoop];
					var feature = _this.getLayerFeatureFromFid(layerInfo.olLayer,loadedFeature.fid);
					if( feature ) {
						layerInfo.olLayer.destroyFeatures([feature]);
					}
					
					// Create new feature and add to layer
					// If in edit mode, first disable editAttribute widget
					if( _this.currentMode === _this.modes.EDIT ) {
						_this.editModeAddFeatureEnabled = false;
						
						layerInfo.olLayer.addFeatures(loadedFeature);
						
						_this.editModeAddFeatureEnabled = true;
					} else {
						layerInfo.olLayer.addFeatures(loadedFeature);
					}
					reloadOptions.onReloaded(loadedFeature);
				};
			};
			
			return cb;
		};
	}
	
	,removeFeature: function(fid) {
		for(var loop=0; loop<this.vectorLayers.length; ++loop) {
			var mapLayer = this.vectorLayers[loop];
			var feature = this.getLayerFeatureFromFid(mapLayer,fid);
			if( feature ) {
				mapLayer.destroyFeatures(feature);
			} else {
				// Nothing to do
			};
		};
	}
	
	,_initiateFeatureEdit: function(feature) {
		if( feature ) {
			this.centerMapOnFeature(feature);
			this.switchToEditFeatureMode(feature);
			return true;
		};
		
		return false;
	}
	
	,centerMapOnFeature: function(feature) {
    	var geom = feature.geometry;
    	var bbox = geom.getBounds();
		var x = (bbox.left + bbox.right) / 2;
		var y = (bbox.bottom + bbox.top) / 2;
		var ll = new OpenLayers.LonLat(x, y);
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	}

	,_centerMapOnFeatureId: function(fid, latLongX, latLongY) {
		var _this = this;
		
		var ll = new OpenLayers.LonLat(latLongX, latLongY);
		
		var dbProj = new OpenLayers.Projection(this.dbSrsName);
		
		ll.transform(dbProj, this.map.projection); // transform in place
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
		
		window.setTimeout(function() { 
				_this.markFeatureAsClicked({
					fid: fid
					,highlightHoverOnly: true
				}); 
			},0);
	}

	// @param bounds Instance of OpenLayers.Bounds
	,convertBoundsToMapProjection: function(bounds, srsName) {
		// TBD: Can we get the projection directly from the map?
		var mapProjection = new OpenLayers.Projection(this.options.mapDisplay.srsName);
		var userCoordProjection = new OpenLayers.Projection(srsName);

		if (userCoordProjection.getCode() != mapProjection.getCode()) {
			bounds.transform(userCoordProjection, mapProjection);
		};
	}
	
	,redrawMap: function() {
		var layers = this.map.layers;
		for(var loop=0; loop<layers.length; ++loop) {
	        if (layers[loop].isBaseLayer )  {
	        	// nothing
	        } else {
	            layers[loop].redraw();
	        };
		};
	}

	,_createOverlayFromDefinition: function(layerDefinition, isBaseLayer) {
		var _this = this;
		
		var layerInfo = $.extend({}, this.defaultLayerInfo, layerDefinition);

		// If a SRS has not been defined for the database, pick the first one defined
		// for a layer
		if( null == this.dbSrsName ) {
			this.dbSrsName = layerInfo.sourceSrsName;
		};
		
		// Derive database projection from name
		layerInfo.sourceProjection = new OpenLayers.Projection(layerInfo.sourceSrsName);

		var layerOptions = {
			name: layerDefinition.name
			,projection: layerInfo.sourceProjection
			,visibility: layerInfo.visibility
			,_layerInfo: layerInfo
		};

		if( 'couchdb' === layerDefinition.type ) {
			// This is a couch layer
			var couchProtocolOpt = $n2.extend({},layerInfo.options,{
				notifications: {
					readStart: function(){
						_this._mapBusyStatus(1);
					}
					,readEnd: function(){
						_this._mapBusyStatus(-1);
					}
				}
			});
			layerInfo.protocol = new OpenLayers.Protocol.Couch(couchProtocolOpt);
		    if( $n2.cache && $n2.cache.defaultCacheService ) {
				layerInfo.protocol.cache = $n2.cache.defaultCacheService;
		    };
			layerOptions.protocol = layerInfo.protocol;
			
		} else if( 'wfs' === layerDefinition.type ) {
			// This is a WFS layer
			
			var wfsProtocolOptions = {
				url:null
				,featurePrefix: null
				,featureType: null
				,featureNS: null
				,version: '1.1.0'
				,geometryName: 'the_geom'
			};
			
			// Parse layer options
			if( layerDefinition.options ){
				for(var key in layerDefinition.options){
					// Options associated with protocol
					if( 'url' === key
					 || 'featurePrefix' === key 
					 || 'featureType' === key 
					 || 'featureNS' === key 
					 || 'version' === key 
					 || 'geometryName' === key 
					 ){
						wfsProtocolOptions[key] = layerDefinition.options[key];
					};
				};
			};
			
			// Protocol to output in JSON format
			wfsProtocolOptions.readFormat = new OpenLayers.Format.GeoJSON();
			wfsProtocolOptions.outputFormat = 'json';
			
			// Compute schema name
			layerInfo.typename = layerInfo.featurePrefix + ':' + layerInfo.featureType;
			layerInfo.schema = wfsProtocolOptions.url 
				+ '?service=WFS&version=' + wfsProtocolOptions.version 
				+ '&request=DescribeFeatureType&typeName=' + layerInfo.typename;

			layerInfo.protocol = new OpenLayers.Protocol.WFS(wfsProtocolOptions);
			layerOptions.protocol = layerInfo.protocol;
			
		} else {
			// Unrecognized layer
			$n2.reportError('Unrecognized type ('+layerDefinition.type+') for layer: '+layerDefinition.name);
		};

		// Create style map
		var layerStyleMap = this.CreateEffectiveStyleMap(layerInfo);
		layerOptions.styleMap = layerStyleMap;

		// Filter
		layerInfo.olFilter = null;
		if( layerInfo.filter ) {
			layerInfo.olFilter = $n2.olFilter.CreateOpenLayersFilter(layerInfo.filter);

			if( null == layerInfo.olFilter ) {
				alert('Encountered invalid filter');
			} else {
				layerOptions.filter = layerInfo.olFilter;
			};
		};

		if( layerInfo.useFixedStrategy ) {
			// Compute bbox string in the source coordinate space of the vector layer
			var vecSourceExtent = new OpenLayers.Bounds(
				options.mapCoordinateSpecifications.maxExtent[0]
				,options.mapCoordinateSpecifications.maxExtent[1]
				,options.mapCoordinateSpecifications.maxExtent[2]
				,options.mapCoordinateSpecifications.maxExtent[3]
				);
			if( userCoordProjection.getCode() != layerInfo.sourceProjection.getCode() ) {
				/*
				 * if the user coordinate space is different from the source projection of the vector layer
				 * then project the max extent bounding box back to the source projection of the vector layer.
				 * The WFS request can reproject the data but it cannot handle a bbox request in the reprojected
				 * coordinate space.
				 */
				vecSourceExtent.transform(userCoordProjection, layerInfo.sourceProjection);
			}

			// Add a BBOX filter
			var bboxFilter = new OpenLayers.Filter.Spatial({
				type: OpenLayers.Filter.Spatial.BBOX
				,property:  layerInfo.geometryName
				,value: vecSourceExtent
			});

			// Add filter
			if( null == layerOptions.filter ) {
				layerOptions.filter = bboxFilter;
			} else {
				var andFilter = new OpenLayers.Filter.Logical({
					type: OpenLayers.Filter.Logical.AND
					,filters: [ layerOptions.filter, bboxFilter ]
				});
				layerOptions.filter = andFilter;
			}

			// Installing strategies make sense only if a protocol is provided
			if( layerOptions.protocol ) {
				layerOptions.strategies = [ new OpenLayers.Strategy.Fixed() ];
			};

		} else {
			// Installing strategies make sense only if a protocol is provided
			if( layerOptions.protocol ) {
				layerOptions.strategies = [ new OpenLayers.Strategy.BBOX() ];
			};
		};
		//layerOptions.renderers = ['Canvas','SVG','VML'];
		layerOptions.renderers = ['SVG','VML'];

		layerInfo.olLayer = new OpenLayers.Layer.Vector(layerInfo.name, layerOptions);
		
		layerInfo.olLayer.events.register('visibilitychanged', null, function(evt_){
			var selected = evt_.object.visibility;
			evt_.object._layerInfo.selectListener(selected,evt_.object._layerInfo);
		});
		
		layerInfo.olLayer.events.register('beforefeaturesadded', null, function(evt_){
			var features = evt_.features;
			if( features ){
				for(var i=0,e=features.length;i<e;++i){
					var f = features[i];
					if( _this.clickedInfo.fids[f.fid] ){
						_this.clickedInfo.feature = f;
						f.isClicked = true;
					};
				};
			};
		});
		
		layerInfo.olLayer.events.register('featuresadded', null, function(evt_){
			_this._resortLayerFeatures(evt_);
			
			var layer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				var layer = evt_.features[0].layer;
			};
			if( layer ) {
				var infoLayer = layer._layerInfo;
			};
			
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};
		});
		
		layerInfo.olLayer.events.register('featuresremoved', null, function(evt_){
			var layer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				var layer = evt_.features[0].layer;
			};
			if( layer ) {
				var infoLayer = layer._layerInfo;
			};
			
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};
		});

		// Remember
		this.infoLayers.push( layerInfo );
		this.vectorLayers.push( layerInfo.olLayer );
		
		// Allow caller to access layers
		if( layerInfo.id ) {
			this.layers[layerInfo.id] = layerInfo.olLayer;
		} else {
			this.layers[layerInfo.name] = layerInfo.olLayer;
		};
		
		return layerInfo.olLayer;
	}
	
	/*
	 * Creates a Layer from OpenLayers given the layer definition.
	 */
	,_createOLLayerFromDefinition: function(layerDefinition, isBaseLayer){
		if( 'Bing' == layerDefinition.type ){
			var options = layerDefinition.options;
			if( options
			 && options.key ) {
				var opts = $n2.extend({
					name: layerDefinition.name
				},options);
				var l = new OpenLayers.Layer.Bing(options);
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+layerDefinition.name);
				return null;
			};
			
		} else if( 'Google Maps' == layerDefinition.type ){
			var options = layerDefinition.options;
			
			if( options && 'string' === typeof(options.type) ){
				var mapTypeId = null;
				if( google && google.maps && google.maps.MapTypeId ){
					mapTypeId = google.maps.MapTypeId[options.type];
				};
				if( mapTypeId ) {
					options.type = mapTypeId;
				} else {
					$n2.reportError('Can not find Google map type id: '+options.type);
					return null;
				};
			};
			
			if( options
			 && options.type ) {
				var l = new OpenLayers.Layer.Google(layerDefinition.name, options);
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+layerDefinition.name);
				return null;
			};
			
		} else if( 'couchdb' === layerDefinition.type
		 || 'wfs' === layerDefinition.type ){
			if( isBaseLayer ) {
				$n2.reportError('Layer type not suitable for background: '+layerDefinition.type);
			} else {
				return this._createOverlayFromDefinition(layerDefinition, isBaseLayer);
			};
			
		} else if( 'wms' === layerDefinition.type ){
			var options = layerDefinition.options;
			
			if( options ) {
				var wmsUrl = null;
				var wmsOptions = {};
				var layerOptions = {
					isBaseLayer: isBaseLayer
				};
				if( typeof(layerDefinition.visibility) === 'boolean' ){
					layerOptions.visibility = layerDefinition.visibility;
				};
				for(var key in options){
					if( 'url' === key ) {
						wmsUrl = options[key];
					} else {
						wmsOptions[key] = options[key];
					};
				};
				var l = new OpenLayers.Layer.WMS(layerDefinition.name, wmsUrl, wmsOptions, layerOptions);
				
				if( !isBaseLayer ){
					this.vectorLayers.push( l );
				};
				
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+layerDefinition.name);
				return null;
			};
			
		} else {
			$n2.reportError('Unknown layer type: '+layerDefinition.type);
		};
		
		return null;
	}

	,genBackgroundMapLayers: function(options) {
		var bg = null;
		
		if( options
		 && options.mapDisplay
		 && options.mapDisplay.backgrounds ) {
			// This is the method used when background layers are specified
			// via couchModule
			for(var i=0,e=options.mapDisplay.backgrounds.length; i<e; ++i){
				var layerDefiniton = options.mapDisplay.backgrounds[i];
			
				var l = this._createOLLayerFromDefinition(layerDefiniton, true);
				if( l && !bg ) bg = [];
				if( l ) bg[bg.length] = l;
			};
			
		} else if( options
		 && options.mapDisplay
		 && options.mapDisplay.background ) {
			// Legacy code calling map/control directly
			
			var background = options.mapDisplay.background;
			
			if( typeof(background.callback) === 'function' ) {
				bg = background.callback(background);
				
			} else if( 'Bing' == background.type ) {
				if( background.key
				 && OpenLayers
				 && OpenLayers.Layer
				 && OpenLayers.Layer.Bing
				 ) {
					if( background.layers
					 && $n2.isArray(background.layers)
					 ) {
						bg = [];
						for(var i=0,e=background.layers.length; i<e; ++i) {
							var lOpt = $n2.extend({
								key: background.key
							},background.layers[i]);
							var l = new OpenLayers.Layer.Bing(lOpt);
							bg.push(l);
						};
					} else {
						// Default layers
						bg = [];
						bg.push( new OpenLayers.Layer.Bing({name:'Satellite',type:'Aerial',key:background.key}) );
						bg.push( new OpenLayers.Layer.Bing({name:'Road',type:'Road',key:background.key}) );
						bg.push( new OpenLayers.Layer.Bing({name:'Hybrid',type:'AerialWithLabels',key:background.key}) );
					};
				} else {
					$n2.reportError('Bad configuration for background type: '+background.type);
				};
				
			} else if( 'Google Maps' == background.type ) {
					if( OpenLayers
					 && OpenLayers.Layer
					 && OpenLayers.Layer.Google
					 ) {
						if( background.layers
						 && $n2.isArray(background.layers) 
						 ) {
							bg = [];
							for(var i=0,e=background.layers.length; i<e; ++i) {
								var lOpt = background.layers[i];
								var l = new OpenLayers.Layer.Google(lOpt.name, lOpt);
								bg.push(l);
							};
						} else {
							// Default layers
							bg = getDefaultGoogleLayers();
						};
					} else {
						$n2.reportError('Bad configuration for background type: '+background.type);
					};
					
			} else {
				$n2.reportError('Unknown background type: '+background.type);
			};
			
		} else {
			// Not specified...
			bg = getDefaultGoogleLayers();
		};
		
		for(var i=0,e=bg.length;i<e;++i){
			this.baseLayers.push( bg[i] );
		};
		
		return(bg);
		
		function getDefaultGoogleLayers() {
			var bg = null;
			// GMap version 2
			if( typeof(GMap2) === 'function' ) {
				bg = [];
				
				bg.push( new OpenLayers.Layer.Google("Google Satellite",{type:G_SATELLITE_MAP,'sphericalMercator': true}) );
				bg.push( new OpenLayers.Layer.Google("Google Physical",{type: G_PHYSICAL_MAP,'sphericalMercator': true}) );
				bg.push( new OpenLayers.Layer.Google("Google Hybrid",{type: G_HYBRID_MAP,'sphericalMercator': true}) );
				
			} else if( google
				&& google.maps
				&& google.maps.MapTypeId 
				) {
				
				if( google.maps.Map ) {
					// disable annoying pop up
					google.maps.Map.disableDefaultUI = true;
				};
				
				// GMap v3
				bg = [];
				bg.push( new OpenLayers.Layer.Google("Google Satellite",{type:google.maps.MapTypeId.SATELLITE,numZoomLevels: 20}) );
				bg.push( new OpenLayers.Layer.Google("Google Physical",{type:google.maps.MapTypeId.TERRAIN,numZoomLevels:20}) );
				bg.push( new OpenLayers.Layer.Google("Google Hybrid",{type:google.maps.MapTypeId.HYBRID,numZoomLevels: 20}) );
			};
			return bg;
		};
	}
	
    // === HOVER AND CLICK START ========================================================

   	,startClickEvent: function(evt) {
   		var feature = this.hoverInfo.feature;
   		this.startClicked(feature, false);
	}
	
   	,startClicked: function(feature, forced) {
		var clickedAgain = false;
   		if( !forced ) {
			clickedAgain = (null != this.clickedInfo && this.clickedInfo.feature == feature);
   		};
		if( !forced && !this.options.toggleClick && clickedAgain ) {
			// ignore click again
			return;
		};
		
		this._endClicked();
		
		if( !forced && this.options.toggleClick && clickedAgain ) {
			this._dispatch({type:'unselected',docId:feature.fid});
			
		} else {
			this.clickedInfo.feature = feature;

			this.clickedInfo.fids = {};
			this.clickedInfo.fids[feature.fid] = true;
			
			feature.isClicked = true;
			if( feature.layer ) {
				feature.layer.drawFeature(feature);
			}
			
			if( this.currentMode.onStartClick ) {
				this.currentMode.onStartClick(feature);
			};
		};
	}
	
	,_endClicked: function() {
		if( this.clickedInfo && this.clickedInfo.feature ) {
			var feature = this.clickedInfo.feature;
			
			if( feature.isClicked ) {
				feature.isClicked = false;
				if( feature.layer ) {
					feature.layer.drawFeature(feature);
				};
			
				if( this.currentMode.onEndClick ) {
					this.currentMode.onEndClick(feature);
				};
			};
		};

		if( this.clickedInfo ) {
			if( this.clickedInfo.endFn ) {
				for(var i=0,e=this.clickedInfo.endFn.length; i<e; ++i) {
					//try{
					this.clickedInfo.endFn[i](); 
					//} catch(e){};
				};
			};
			this.clickedInfo.endFn = [];
			this.clickedInfo.feature = null;
			this.clickedInfo.fids = {};
		};
	}
	
	,registerEndClickFn: function(fn) {
		this.clickedInfo.endFn.push(fn);
	}
	
	,_selectedFeature: function(feature, fid){
		if( this.currentMode !== this.modes.NAVIGATE ){
			this.switchMapMode(this.modes.NAVIGATE);
		};
		
		this._endClicked();
		
		this.clickedInfo.fids = {};
		if( fid ) {
			this.clickedInfo.fids[fid] = true;
		};
		
		if( feature ) {
			this.clickedInfo.feature = feature;

			feature.isClicked = true;
			if( feature.layer ) {
				feature.layer.drawFeature(feature);
			};
		};
	}
	
	,startHover: function(feature) {
		// Check if anything is needed
		if( this.hoverInfo 
		 && this.hoverInfo.feature
		 &&  this.hoverInfo.feature === feature
		 ) {
		 	// Nothing to do. This one is already the hover
		 	// feature.
		 	return;
		};
	
		// If a feature is still marked as "hovered", quit
		// it. This one is taking over.
		this.endHover();
		
		// Remember this new feature as "hovered"
		this.hoverInfo.feature = feature;

		// Perform mode specific hover actions
		if( this.currentMode.onStartHover ) {
			this.currentMode.onStartHover(feature);
		};
	}
	
	,endHover: function() {
		if( this.hoverInfo && this.hoverInfo.feature ) {
			var feature = this.hoverInfo.feature;
			if( feature.isHovered ) {
				if( this.currentMode.onEndHover ) {
					this.currentMode.onEndHover(feature);
				};
			};
		};
		if( this.hoverInfo ) {
			if( this.hoverInfo.endFn ) {
				for(var i=0,e=this.hoverInfo.endFn.length; i<e; ++i) {
					//try{
					this.hoverInfo.endFn[i](); 
					//} catch(e){};
				};
			};
			this.hoverInfo.endFn = [];
			this.hoverInfo.feature = null;
		};
	}
	
	,_highlightHoveredFeature: function(feature, isInFocus){
		if( feature.isHovered != isInFocus ) {
			feature.isHovered = isInFocus ? true : false;
			if( feature.layer ) feature.layer.drawFeature(feature);
		};
	}
	
	,registerEndHoverFn: function(fn) {
		this.hoverInfo.endFn.push(fn);
	}

	,activateSelectFeatureControl: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.activate();
		};
	}

	,deactivateSelectFeatureControl: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.unselectAll();
			this.selectFeatureControl.deactivate();
		};
		this.endHover();
		this._endClicked();
	}

	,hoverFeature: function(feature) {
		var _this = this;
		
		if( null == feature ) {
			return;
		};
		if( null == feature.layer ) {
			return;
		};
		
		var layerInfo = feature.layer._layerInfo;
		if( null == layerInfo ) {
			return;
		};

		var dispatchService = this._getDispatchService();
		if( dispatchService ) {
			var handle = dispatchService.getHandle('n2.mapAndControls');
			
			this.registerEndHoverFn(function(){
				dispatchService.send(handle, {
					type: 'focusOff'
					,docId: feature.data._id
					,doc: feature.data
					,feature: feature
		 		});
			});
			dispatchService.send(handle, {
				type: 'focusOn'
				,docId: feature.data._id
				,doc: feature.data
				,feature: feature
	 		});
			
		} else {
			// No dispatcher, redraw feature directly
			this._highlightHoveredFeature(feature, true);

			this.registerEndHoverFn(function(){
				_this._highlightHoveredFeature(feature, false);
			});
		};
	}
	
	,hoverFeaturePopup: function(feature) {
		var _this = this;
		
		if( null == feature ) {
			return;
		};
		if( null == feature.layer ) {
			return;
		};
	
		var layerInfo = feature.layer._layerInfo;
		if( null == layerInfo ) {
			return;
		};
		
		var popupHtmlFn = layerInfo.featurePopupHtmlFn;
		if( !popupHtmlFn ) {
			popupHtmlFn = $n2.mapAndControls.DefaultPopupHtmlFunction;
		};
		if( null == popupHtmlFn ) {
			return;
		};

		// Figure out delay
		var delay = 0;
		if( typeof(layerInfo.featurePopupDelay) === 'number' ){
			delay = Math.floor(layerInfo.featurePopupDelay);
		};
		
		// Start or delay popup
		if( delay > 0 ) {
			window.setTimeout(function(){
				// Is it still relevant?
				if( isPopupCurrent() ) {
					initiatePopup();
				};
			},delay);
		} else {
			// immediate
			initiatePopup();
		};
		
		function isPopupCurrent(){
			// Asynchronous call. Check that the popup we want
			// to generate is still the one associated with the
			// feature being hovered.
			var hoveredFid = null;
			if( _this.hoverInfo && _this.hoverInfo.feature ) {
				hoveredFid = _this.hoverInfo.feature.fid;
			};
			if( hoveredFid !== feature.fid ) {
				// We have been called for a feature that is no longer
				// hovered
				return false;
			};
			
			return true; // still good
		};
		
		function computePopupPosition(){
	    	var popup_lonlat = null;
			var lastMapXy = _this.lastMapXy;
	    	if( null != lastMapXy ) {    	
	            var lonLat = _this.map.getLonLatFromPixel(lastMapXy);
	            if( lonLat ) { 
	            	popup_lonlat = lonLat;
	            };
	    	};
	    	if( !popup_lonlat ) {
	    		// Take centre of geometry
		    	popup_lonlat = feature.geometry.getBounds().getCenterLonLat();
	    	};
	    	return popup_lonlat;
		};
		
		function initiatePopup(){
			// Variables to manage wait pop-up
			var needWaitingPopup = true;
			
			// Call client function to generate HTML for popup
			popupHtmlFn({
				feature: feature
				,layerInfo: layerInfo
				,onSuccess: function(html){
					// We do not need to show a waiting pop-up
					// if it is not already up.
					needWaitingPopup = false;
					
					displayPopup(html);
				}
				,onError: function(){}//ignore
			});
			
			// If the popupHtmlFn() calls onSuccess before we
			// get here, then the variable needWaitingPopup is
			// false. In that situation, we do not need to create
			// a waiting pop-up (not waiting, the main pop-up is already
			// drawn). If the popupHtmlFn() is truly asynchronous (need
			// to fetch data over the network, for example), then
			// this code is reached before the onSuccess is called and
			// the variable needWaitingPopup is true.
			if( needWaitingPopup ) {
				displayPopup('<div class="olkit_wait"></div>');
			};
		};
	
		function displayPopup(popupHtml){
			if( !isPopupCurrent() ) {
				// Took too long. We are now displaying a popup for a
				// different feature.
				return;
			};
			
			// Destroy current pop-up if one is up
			destroyCurrentPopup();
			
			if( null === popupHtml || '' === popupHtml ) {
				// No error. Nothing to display.
				return;
			};

			// Figure out popup position
	    	var popup_lonlat = computePopupPosition();
	    	
	    	// Create pop-up
	    	var popup = new OpenLayers.Popup.AnchoredBubble(
	    		null // Let OpenLayers assign id
	    		,popup_lonlat
	    		,null
	    		,popupHtml
	    		,{
	    			size: new OpenLayers.Size(10,10)
	    			,offset: new OpenLayers.Pixel(-5,-5)
				}
				,false
				,onPopupClose
			);
	    	popup.autoSize = true;
	    	popup.panMapIfOutOfView = true;
			popup.setOpacity("80");
			
			// Install new pop-up
			_this.currentPopup = popup;
			_this.map.addPopup(popup);

			// Add clean up routine
			_this.registerEndHoverFn(destroyCurrentPopup);
			
			// Add routine to adjust popup position, once
			_this.addMapMousePositionListener(function(evt){
				if( _this.currentPopup === popup && _this.lastMapXy ) {
					_this.currentPopup.lonlat = _this.map.getLonLatFromPixel(_this.lastMapXy);
					_this.currentPopup.updatePosition();
					return true; // keep listener
				};
				
				return false; // remove listener
			});
		};
		
		
		function destroyCurrentPopup() {
			var map = _this.map;
			var popup = _this.currentPopup;
			if( popup ) {
				map.removePopup(popup);
				popup.destroy();
				_this.currentPopup = null;
			};
		};
		
		function onPopupClose(evt) {
	    };
	}

    // === LOGIN STUFF START ========================================================

	,isLoggedIn: function() {
    	if( $.NUNALIIT_AUTH ) {
    		// The auth module is present, check if user logged in
			return $.NUNALIIT_AUTH.isLoggedIn();
    	} else {
    		// Authentication module is not loaded
    		return false;
    	};
	}
	
	,isUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		return $.NUNALIIT_AUTH.isUser();
	}
	
	,isAdminUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		return $.NUNALIIT_AUTH.isAdmin();
	}
	
	,isAnonymousUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		return $.NUNALIIT_AUTH.isAnonymous();
	}
    
    /*
     * function: auth module listener for login state changes.  Only called if the auth
     * module is loaded so checks of that inside this function are not useful.
     * 
     * Once installed by the subsequent call to addListener(), this is immediately
     * called and then whenever a login state change is detected.
     */
    ,loginStateChanged: function(currentUser) {
    	var showLogin = false;
    	if( null == currentUser ) {
    		showLogin = true;
    	} else {
     		if( this.isAnonymousUser() && $.NUNALIIT_AUTH.autoAnonymousBehaviour() ) {
		    	showLogin = true;
     		};
    	};
    	
   		$('#login').empty();
    	if( showLogin ) {
     		var aElem = $('<a class="loginLink" href="javascript:Login">Login</a>');
    		aElem.click(function(){
    			if( $.NUNALIIT_AUTH ) $.NUNALIIT_AUTH.login();
    			return false;
    		});
    		var nameElem = $('<span class="loginGreeting">Welcome.&nbsp</span>');
    		$('#login').append(aElem).append(nameElem);
    		this.hideMapInteractionSwitch();
			this.switchMapMode(this.modes.NAVIGATE);
    	} else {
    		var aElem = $('<a class="loginLink" href="javascript:Logout">Logout</a>');
    		aElem.click(function(){
    			if( $.NUNALIIT_AUTH ) {
  					if ($.NUNALIIT_AUTH.autoAnonymousBehaviour()) {
    					$.NUNALIIT_AUTH.autoAnonLogin();
  					} else {
    					$.NUNALIIT_AUTH.logout();
    				};
    			};
    			return false;
    		});
    		var display = currentUser.display;
    		if( !display ) display = currentUser.name;
    		var nameElem = $('<span class="loginGreeting">' + display + '&nbsp</span>');
    		$('#login').append(aElem).append(nameElem);
    		if( this.isUser() ) {
    			this.showMapInteractionSwitch();
    		};
    	};
    }
    	
    // === LOGIN STUFF END ========================================================
	
    // === MAP MODES START ========================================================
    
 	,createMapInteractionSwitch: function() {
 		var _this = this;
 		this.mapInteractionButton = $('<input type="button" value="'+this.modes.NAVIGATE.buttonValue+'"/>'); 
 		this.mapInteractionButton.click( function(evt) { 
			_this._clickedMapInteractionSwitch(evt);
		});
		$("#"+this.mapInteractionDivName)
			.empty()
			.append(this.mapInteractionButton);
	}
	
	,_clickedMapInteractionSwitch: function(e){
		if( this.currentMode === this.modes.NAVIGATE ) {
			this.switchToEditMode();
			
		} else if( this.currentMode === this.modes.EDIT ) {
			this.switchMapMode(this.modes.NAVIGATE);
			
		} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
			this._cancelEditFeatureMode();
		};
		return false;
	}
	
 	,hideMapInteractionSwitch: function() {
 		if( null != this.mapInteractionButton ) {
	 		this.mapInteractionButton.hide();
	 	};
	}
	
	,showMapInteractionSwitch: function() {
  		if( null != this.mapInteractionButton ) {
 			this.mapInteractionButton.show();
 		};
	}
	
	,activateControl: function(control) {
		if( control ) control.activate();
	}
	
	,deactivateControl: function(control) {
		if( control ) control.deactivate();
	}
			
    ,switchMapMode: function(mode, opts) {
    	if( this.currentMode === mode ) {
    		// nothing to do
    		return;
    	};
    	
    	// Remove current mode
    	if( this.currentMode === this.modes.EDIT ) {
    		this.deactivateControl( this.editControls.addPoints );
    		this.deactivateControl( this.editControls.toolbar );
    		this.deactivateControl( this.editControls.modifyFeature );
    		this.editLayer.events.unregister('featureadded', null, this.editModeAddFeatureCallback);
            this.editLayer.events.unregister('beforefeaturesadded', null, this.convertToMultiGeometry);

            this.deactivateSelectFeatureControl();
            
    	} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
    		if( null != this.editFeatureControls.modifyFeatureGeometry ) {
    			var editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
	    		if( null != editFeature ) {
	    			this.editFeatureControls.modifyFeatureGeometry.unselectFeature(editFeature);
	    		};
	    		editFeature.layer.events.unregister('featuremodified', editFeature, this.featureModifiedCallback);
	    		this.editFeatureControls.modifyFeatureGeometry.deactivate();
	    		this.map.removeControl( this.editFeatureControls.modifyFeatureGeometry );
	    		this.editFeatureControls.modifyFeatureGeometry.destroy();
	    		this.editFeatureControls.modifyFeatureGeometry = null;
	    		
	    		// If this is the cancellation of a new feature creation, remove feature
	    		// from map
	    		if( editFeature 
	    		 && editFeature.layer ) {
		    		if( editFeature._n2MapNewFeature ) {
	   	    			editFeature.layer.destroyFeatures([editFeature]);
	   	    			
	   	    		} else if( editFeature._n2MapOriginal ) {
	   	    			editFeature.layer.eraseFeatures([editFeature]);
	   	    			if( editFeature._n2MapOriginal.restoreGeom ){
	   	    				editFeature.geometry = editFeature._n2MapOriginal.geometry;
	   	    			};
	   	    			editFeature.data = editFeature._n2MapOriginal.data;
	   	    			editFeature.style = editFeature._n2MapOriginal.style;
	   	    			editFeature.layer.drawFeature(editFeature);
	   	    			delete editFeature._n2MapOriginal;
	   	    		};
	    		};
    		};
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.deactivateSelectFeatureControl();
    	};

    	// Apply new mode
    	this.currentMode = mode;
    	this.mapInteractionButton.val(mode.buttonValue);
    	if( this.currentMode === this.modes.EDIT ) {
    		this.editLayer.events.register('featureadded', null, this.editModeAddFeatureCallback);
    		this.editLayer.events.register('beforefeaturesadded', null, this.convertToMultiGeometry);
    		this.activateControl( this.editControls.addPoints );
    		this.activateControl( this.editControls.toolbar );
    		this.activateControl( this.editControls.modifyFeature );
    		
    		this.activateSelectFeatureControl();
            
    	} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
    		opts.feature.layer.events.register('featuremodified', opts.feature, this.featureModifiedCallback);

    		var editFeature = opts.feature;
    		if( editFeature ) {
	    		editFeature._n2MapOriginal = {
	    			restoreGeom: false
	    		};
	    		editFeature._n2MapOriginal.geometry = editFeature.geometry.clone();
	    		editFeature._n2MapOriginal.style = editFeature.style;
	    		editFeature._n2MapOriginal.data = $n2.extend(true, {}, editFeature.data);
    		};
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.activateSelectFeatureControl();
    	};
    }
    
    ,switchToEditMode: function() {
    	var _this = this;
    	
    	if( $.NUNALIIT_AUTH ) {
    		var logInRequired = true;
    		
    		// The auth module is present, check if user logged in
    		// and is not anonymous
    		var userNotAnonymous = $.NUNALIIT_AUTH.userLoggedInAndNotAnonymous();
    		if( userNotAnonymous ) {
    			logInRequired = false;
    		};
    		
    		if( logInRequired ) {
    			// User is not logged in
    			$.NUNALIIT_AUTH.login({
    				prompt: '<p>You must log in as a registered user to add a point to the map.</p>'
    				,anonymousLoginAllowed: false
    				,onSuccess: function(){ _this.switchToEditMode(); }
    			});
    		} else {
    			// Already logged in, just switch
    	    	this.switchMapMode(this.modes.EDIT);
    		};
    	} else {
    		alert("Authentication module not installed.");
    	};
    }
    
    ,switchToEditFeatureMode: function(feature) {
    	this.switchMapMode(this.modes.EDIT_FEATURE,{
    		feature: feature
    	});

    	if( null != this.editFeatureControls.modifyFeatureGeometry ) {
    		if( null != this.editFeatureControls.modifyFeatureGeometry.feature ) {
    			this.editFeatureControls.modifyFeatureGeometry.unselectFeature(
    				this.editFeatureControls.modifyFeatureGeometry.feature
    			);
    		};
   			this.editFeatureControls.modifyFeatureGeometry.deactivate();
   			this.map.removeControl( this.editFeatureControls.modifyFeatureGeometry );
   			this.editFeatureControls.modifyFeatureGeometry.destroy();
   			this.editFeatureControls.modifyFeatureGeometry = null;
    	};

   		var modifyFeatureGeometry = new OpenLayers.Control.ModifyFeature(
   			feature.layer
   			,{
   				'displayClass': 'olControlMoveFeature'
   				,standalone: true
   			}
   		);
   		modifyFeatureGeometry.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
		this.map.addControl(modifyFeatureGeometry);
		modifyFeatureGeometry.activate();
    	this.editFeatureControls.modifyFeatureGeometry = modifyFeatureGeometry;

   		modifyFeatureGeometry.selectFeature(feature);
    }
    
    ,_cancelEditFeatureMode: function() {
   		this._dispatch({
   			type: 'editCancel'
   		});
    }
    
    // === NAVIGATION MODE ========================================================


    // === EDIT MODE ========================================================

    ,createFirstContribution: function(feature, dataOptions) {
		if( feature.attributes && feature.attributes.place_id ) {
			if( NUNALIIT_CONTRIBUTIONS ) {
				// NUNALIIT_CONTRIBUTIONS module is needed
				NUNALIIT_CONTRIBUTIONS.addContribution(dataOptions);
			};
    	};
    }
    
    // ======= EDIT_FEATURE MODE =======================================================

    ,_geometryModified: function(fid, olGeom, proj){
    	if( this.currentMode !== this.modes.EDIT_FEATURE ) return;
    	
		var editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
		
		// Check that this relates to the right feature
		if( fid && fid !== editFeature.fid ) return;
		if( !fid && editFeature.fid ) return;
    	
		if( editFeature ) {
			var mapProj = editFeature.layer.map.projection;
			if( mapProj.getCode() != proj.getCode() ) {
				olGeom.transform(proj, mapProj);
			};
		};
		
		// Redraw
		var modifyFeatureControl = this.editFeatureControls.modifyFeatureGeometry;
		if( modifyFeatureControl ) {
			modifyFeatureControl.unselectFeature(editFeature);
			editFeature.layer.eraseFeatures([editFeature]);
			editFeature.geometry = olGeom;
			editFeature.layer.drawFeature(editFeature);
			modifyFeatureControl.selectFeature(editFeature);
		};
    }
    
    // Called when the feature on the map is modified
    ,_featureModified: function(evt){
    	var feature = evt.feature;
    	this._dispatch({
    		type: 'geometryModified'
    		,docId: feature.fid
    		,geom: feature.geometry
    		,proj: feature.layer.map.projection
    		,_origin: this
    	});
    }
    
    ,onAttributeFormClosed: function(editedFeature) {
    	// When closing the dialog with the user, the feature
    	// must be removed from the map if it is a new one, since it does
    	// not have a valid fid. The feature will be reloaded, anyway. However,
    	// in the case of an INSERT, the currently drawn feature will not
    	// be repopulated since it can not be matched via fid.
		if( editedFeature && editedFeature.state === OpenLayers.State.INSERT ) {
			this.editLayer.destroyFeatures(editedFeature);
		};
		
		this.switchMapMode(this.modes.NAVIGATE);
    }

	,onAttributeFormCancelled: function(editedFeature) {
		this.switchMapMode(this.modes.NAVIGATE);
	}
    
	,onAttributeFormInserted: function(fid, feature) {
		var _this = this;
		
		// This is an insert

		// Remove feature which is on the edit layer. Feature
		// will be reloaded on the correct layer.
		if( feature && feature.layer ) {
			feature.layer.destroyFeatures([feature]);
		};

		this.fidAdded(fid);
		var filter = $n2.olFilter.fromFid(fid);
		this._reloadFeature(filter,{
			onReloaded: function(feature) {
				if( _this.options.contribInsertedReloadAddContrib ) {
					if( _this.options.contribInsertedReloadDataFn === null ) {
						_this.createFirstContribution(
							feature,
							{
								data: {
									title: 'Added point'
									,notes: ''
									,place_id: feature.attributes.place_id
								}
							});
					} else {
						_this.createFirstContribution(
							feature,
							_this.options.contribInsertedReloadDataFn(feature)); // return obj with filled data fields as above
					};
				};
				_this.markFeatureAsClicked({fid:fid}); // back in navigation mode - click the feature
			}
		});
	}
    
	,onAttributeFormUpdated: function(fid, feature) {
		var _this = this;
		
		// This is an update
		var fid = feature.fid;
		this.fidUpdated(fid);
		var filter = $n2.olFilter.fromFid(fid);
		this._reloadFeature(filter, {
			onReloaded: function(feature) {
				_this.markFeatureAsClicked({fid:fid}); // back in navigation mode - click the feature
			}
		});
	}
	
	,onAttributeFormDeleted: function(fid, feature) {
		this.fidDeleted(fid);
		var layer = feature.layer;
		if( layer ) {
			layer.destroyFeatures([feature]);
		};
	}
    
	,selectAudioMedia: function(feature, onSelectCallback) {
		var _this = this;
		
		var placeId = null;
		if( feature && feature.attributes && feature.attributes.place_id ) {
			placeId = feature.attributes.place_id;
		};
		
		if( placeId ) {
			this.insertSound();
			
			var selectWindow = $('<div class="selectMedia" style="z-index:3005"></div>');
			
			var head = $('<h1>Select a hover audio file</h2>');
			selectWindow.append(head);
			
			var listElem = $('<div></div>');
			selectWindow.append(listElem);
			
			// Buttons
			var cancelButton = $('<input type="button" value="Cancel"/>');
			cancelButton.click(function(){
				selectWindow.dialog('close');
			});
			selectWindow.append(cancelButton);

			var dialogOptions = {
				autoOpen: true
				,modal: true
				,title: _loc('Select a media')
				,width: 'auto'
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			};
			selectWindow.dialog(dialogOptions);
			
			this.dbSearchEngine.getAudioMediaFromPlaceId(placeId,function(mediaArray){
				if( 0 == mediaArray.length ) {
					listElem.html('<span>There are no audio files available</span>');
				} else {
					var tableElem = $('<table class="mediaSelection"></table>');
					listElem.append(tableElem);
					
					for(var loop=0; loop<mediaArray.length; ++loop) {
						var media = mediaArray[loop];
						addMedia(tableElem, media);
					};
				};
			});
		} else {
			alert('No media to select');
		};
		
		function addMedia(tableElem, media) {
			var trElem = $('<tr></tr>');

			var tdElem = $('<td></td>');
			
			if( media.title ) {
				var html = $('<span>'+'title: '+media.title+'</span>');
				tdElem.append(html);
				tdElem.append( $('<br/>') );
			};
			
			if( media.mimetype ) {
				var html = $('<span>'+'MIME type: '+media.mimetype+'</span>');
				tdElem.append(html);
				tdElem.append( $('<br/>') );
			};
			
			if( media.filename ) {
				var html = $('<span>'+'file: '+media.filename+'</span>');
				tdElem.append(html);
				tdElem.append( $('<br/>') );
			};
			
			trElem.hover(function(){
				var value = media.filename?media.filename:'';
				_this.insertSound(value);
			},function(){
				_this.insertSound();
			});
			trElem.click(function(){
				var value = media.filename?media.filename:'';
				_this.insertSound();
				onSelectCallback(value);
				selectWindow.dialog('close');
				return false;
			});

			trElem.append(tdElem);

			tableElem.append(trElem);
		};
	}
	
    // === EDIT MODE STUFF END ======================================================================

    // === COMETD MODE STUFF START ========================================================
    
    ,initCometChannels: function() {
    	var _this = this;
    	if( this.cometEnabled && $.cometd ) {
			$.cometd.init('./cometd');
			$.cometd.subscribe(
				this.fidChannel
				,function(msg){ _this.fidHandler(msg); }
			);
			$.cometd.subscribe(
				this.contributionChannel
				,function(msg){ _this.contributionHandler(msg); }
			);
    	}
    }
    
	,fidHandler: function(msg) {
		//log('fidHandler',msg);
		if( msg.data && msg.data.type && msg.data.fid ) {
			// Invalidate cache
			this._cacheInvalidateFeature(msg.data.fid);
			
			// Reload feature
			if( msg.data.type == 'added' ) {
				var filter = $n2.olFilter.fromFid(msg.data.fid);
				this._reloadFeature(filter);
				
			} else if( msg.data.type == 'updated' ) {
				var filter = $n2.olFilter.fromFid(msg.data.fid);
				this._reloadFeature(filter);
				
			} else if( msg.data.type == 'deleted' ) {
				this.removeFeature(msg.data.fid);
			};
		};
	}	
    	
	,fidAdded: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'added'
			};
			$.cometd.publish(this.fidChannel,msg);
		};
	}
	
	,fidUpdated: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'updated'
			};
			$.cometd.publish(this.fidChannel,msg);
		}
	}
	
	,fidDeleted: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'deleted'
			};
			$.cometd.publish(this.fidChannel,msg);
		};
	}

	,contributionHandler: function(msg) {
		//log('contributionHandler',msg);
		if( msg.data ) {
			var data = msg.data;
			
			if( data.place_id 
			 && $n2.placeInfo 
			 && $n2.placeInfo.getPlaceId() == data.place_id ) {
				$n2.placeInfo.loadAndRenderContributions();
			};
		};
	}	
	
    // === COMETD MODE STUFF END ========================================================

    // === STYLE MAP STUFF START ========================================================

	,adjustFilterProperties: function(feature) {
	
		feature.isFilteredIn = false;
		feature.isFilteredOut = false;
		
		for(var key in this.styleFilters) {
			feature.isFilteredIn = true;
			
			var f = this.styleFilters[key].matchFn;
			if( !f(feature) ) {
				feature.isFilteredIn = false;
				feature.isFilteredOut = true;
				return true;
			};
		};
		return false;
	}
	
	,CreateStyleMap: function(styleOptions) {
	
		var providedMap = styleOptions 
			? $.extend(true,{},this.defaultStyleMap,styleOptions)
			: this.defaultStyleMap;
			
		var normalStyle = new OpenLayers.Style( providedMap.normal );
		var clickedStyle = new OpenLayers.Style( providedMap.clicked );
		var hoveredStyle = new OpenLayers.Style( providedMap.hovered );
		var hoveredClickedStyle = new OpenLayers.Style( providedMap.hoveredClicked );
		var filteredOutStyle = new OpenLayers.Style( providedMap.filteredOut );
		var styles = {
			'normal': normalStyle 
			,'clicked': clickedStyle 
			,'hovered': hoveredStyle
			,'hoveredClicked': hoveredClickedStyle
			,'filteredOut': filteredOutStyle
		};
		
		
		var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){ 
		        
		        var effectiveIntent = null;
		        
		        if( null == effectiveIntent && feature.isFilteredOut ) {
		        	effectiveIntent = 'filteredOut';
		        };
		        
	        	if( null == effectiveIntent && feature.isHovered ) {
			        if( feature.isClicked ) {
		        		effectiveIntent = 'hoveredClicked';
		        	} else {
		        		effectiveIntent = 'hovered';
			        };
	        	};
	        	
	        	if( null == effectiveIntent && feature.isClicked ) {
	        		effectiveIntent = 'clicked';
	        	};

				var style = styles[effectiveIntent];
				if( null == style ) {
					style = styles.normal;
				};
		        
		        return style.createSymbolizer(feature);
			});
			
		return styleMap;
	}
	
	,CreateStyleMapFromLayerInfo: function(layerInfo) {
	
		var styleOptions = null;
		if( layerInfo && layerInfo.styleMap ) {
			styleOptions = layerInfo.styleMap;
		};
		return this.CreateStyleMap(styleOptions);
	}
	
	,CreateEffectiveStyleMap: function(layerInfo) {
	
		var _this = this;
		
		// The caller can specify a style map in multiple ways:
		// 1. provide a style map function (layerInfo.styleMapFn)
		// 2. provide a style extension (layerInfo.styleMapFn === CreateStyleMapFromLayerInfo)
		//    and styleMap object is used.
		// Either way, a style map wrapping the caller's is needed to perform
		// some work prior to calling the caller's style map. This function creates
		// this wrapper. 
	
		// Determine the style map function for this layer
		var innerStyleMap = null;
		if( layerInfo ) {
			innerStyleMap = layerInfo.styleMapFn(layerInfo);
		} else {
			// Editing layer currently has no options for styling. Use
			// defaults.
			innerStyleMap = this.CreateStyleMap();
		};
	
		// Create wrapping style map based on StyleMapCallback. Perform
		// some work and then defer to caller's style map.
		var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){

			// A virtual style is requested when feature is null.
			// ModifyFeature control requests a virtual style for
			// its virtual vertices. Always return a style on
			// null feature.
			if( null == feature ) {
				return {
					fillColor: "#0000ff",
					fillOpacity: 0.4,
					strokeColor: "#0000ff",
					strokeOpacity: 1,
					strokeWidth: 1,
					strokeLinecap: "round", //[butt | round | square]
					strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
					pointRadius: 6,
					pointerEvents: "visiblePainted",
					cursor: "pointer"
				};
			};
	
			// If a feature is being edited by the ModifyFeature control,
			// then vertices and handles are drawn on the map. Those vertices
			// and handles are marked as "_sketch". In that case, offer the style
			// for editing.
			if( feature._sketch ) {
				return {
					fillColor: "#0000ff",
					fillOpacity: 0.4,
					strokeColor: "#0000ff",
					strokeOpacity: 1,
					strokeWidth: 1,
					strokeLinecap: "round", //[butt | round | square]
					strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
					pointRadius: 6,
					pointerEvents: "visiblePainted",
					cursor: "pointer"
				};
			};
	        
	        _this.adjustFilterProperties(feature);
	        
	        var symbolizer = innerStyleMap.createSymbolizer(feature,intent);
	        
	        return symbolizer;
		});

		// Add styles that are expected to be hard coded
		if( !styleMap.styles ) {
			styleMap.styles = {};
		}
		
		// This style is needed by the DrawFeature control in sketch
		// mode (while editing)
		if( !styleMap.styles['temporary'] ) {
			styleMap.styles['temporary'] = {
		        fillColor: "#66cccc",
		        fillOpacity: 0.2, 
		        hoverFillColor: "white",
		        hoverFillOpacity: 0.8,
		        strokeColor: "#66cccc",
		        strokeOpacity: 1,
		        strokeLinecap: "round",
		        strokeWidth: 2,
		        strokeDashstyle: "solid",
		        hoverStrokeColor: "red",
		        hoverStrokeOpacity: 1,
		        hoverStrokeWidth: 0.2,
		        pointRadius: 6,
		        hoverPointRadius: 1,
		        hoverPointUnit: "%",
		        pointerEvents: "visiblePainted",
		        cursor: "inherit"
		    };
		};
		
		// I have no idea if this is needed. I put it here for completeness.
		if( !styleMap.styles['delete'] ) {
			styleMap.styles['delete'] = {
		        display: "none"
		    };
		};
			
		return styleMap;
	}
	
	,turnOffStyleFilter: function( label ) {
		if( this.styleFilters[label] ) {
			delete this.styleFilters[label];
			
			this.redrawMap();
		};
	}
	
	,removeStyleFilter: function( filter ) {
		var label = null;
		if( typeof(filter) === 'string' ) {
			label = filter;
		} else if( typeof(filter) === 'string' ) {
			label = filter.label;
		};
		if( null == label ) {
			return;
		};
		turnOffStyleFilter(label);
		$('#_olkit_styleFilter_'+label).remove();
	}
	
	,addStyleFilter: function( filter_ ) {
		var _this = this;
		
		var defaultFilter = {
			description: 'Unknown Filter'
			,refreshFunction: function(options_){}
		};
		var filter = $.extend(defaultFilter, filter_);
	
		// This method returns a label to be used in removing
		// an installed filter
		var filterLabel = ''+this.styleFilterIndex;
		++this.styleFilterIndex;
		filter.label = filterLabel;

		var span = $('<span id="_olkit_styleFilter_'+filterLabel+'"></span>');
		
		var filterPanelId = this.options.filterPanelName;
		if( null == filterPanelId ) {
			return false;
		};
		$('#'+filterPanelId).append(span);
		
		var cb = $('<input type="checkbox"/>');
		var warning = $('<span></span>');
		var text = $('<span>'+filter.description+'</span>');
		var removeButton = $('<input type="button" value="Delete"/>');
		var br = $('<br/>');
		span.append(cb);
		span.append(removeButton);
		span.append(warning);
		span.append(text);
		span.append(br);
		
		cb.bind('change',function(){
			var checked = cb.attr('checked');
			if( checked ) {
				refreshFilter();
			} else {
				removeFilter();
			};
		});
		removeButton.click(function(){
			deleteFilter();
			return false;
		});
		
		refreshFilter();
		
		function onError() {
			warning.text('!!!');
			cb.attr('checked',false);
			disableAll(span, false);
			if( null != filterLabel ) {
				this.removeStyleFilter(filterLabel);
				filterLabel = null;
			};
		};
		
		function refreshFilter() {
			warning.empty();
			disableAll(span, true);
			
			filter.refreshFunction({
				onError: onError
				,filterOnFids: filterFids 
			});
		};
		
		function filterFids(fids) {
			// Make map for faster access
			var fidMap = {};
			for(var loop=0; loop<fids.length; ++loop) {
				fidMap[fids[loop]] = 1;
			};
			
			filter.matchFn = function(feature) {
				if( fidMap[feature.attributes.id] ) {
					return true;
				};
				return false;
			}; 
			styleFilters[filter.label] = filter;

			cb.attr('checked',true);
			disableAll(span, false);
			
			_this.redrawMap();
		};
	
		function removeFilter() {
			warning.empty();
			_this.turnOffStyleFilter(filterLabel);
		};
		
		function deleteFilter() {
			if( null != filterLabel ) {
				_this.removeStyleFilter(filterLabel);
				filterLabel = null;
			};
		};
		
		function disableAll(jQuerySet, flag) {
			if( flag ) {
				jQuerySet
					.attr('disabled',true)
					.addClass('olkitDisabled')
					;
			} else {
				jQuerySet
					.removeAttr('disabled')
					.removeClass('olkitDisabled')
					;
			};
			
			jQuerySet.children().each(function(i,elem){ disableAll($(elem), flag) });
		};
		
		return false; 
	}

    // === STYLE MAP STUFF END ========================================================

	// === START -- LAYER MANAGEMENT ========================================================

	,createLayerFromOptions: function(opt_) {
		var _this = this;
		
		var layerInfo = $.extend({}, this.defaultLayerInfo, opt_);

		layerInfo.typename = layerInfo.featurePrefix + ':' + layerInfo.featureType;
		layerInfo.schema = layerInfo.wfsUrl 
			+ '?service=WFS&version=' + layerInfo.wfsVersion 
			+ '&request=DescribeFeatureType&typeName=' + layerInfo.typename;
		
		if( null == this.dbSrsName ) {
			this.dbSrsName = layerInfo.sourceSrsName;
		}
		
		layerInfo.sourceProjection = new OpenLayers.Projection(layerInfo.sourceSrsName);

		var layerOptions = {
			projection: layerInfo.sourceProjection
			,visibility: layerInfo.visibility
			,_layerInfo: layerInfo
		};

		if( layerInfo.couchDb ) {
			// This is a couch layer
			var couchProtocolOpt = $n2.extend({},layerInfo.couchDb,{
				notifications: {
					readStart: function(){
						_this._mapBusyStatus(1);
					}
					,readEnd: function(){
						_this._mapBusyStatus(-1);
					}
				}
			});
			layerInfo.protocol = new OpenLayers.Protocol.Couch(couchProtocolOpt);
		    if( $n2.cache && $n2.cache.defaultCacheService ) {
				layerInfo.protocol.cache = $n2.cache.defaultCacheService;
		    };
			layerOptions.protocol = layerInfo.protocol;
		} else if( layerInfo.wfsUrl ) {
			// This is a WFS layer
			layerInfo.protocol = new OpenLayers.Protocol.WFS.v1_1_0({
					url: layerInfo.wfsUrl
					,featureType: layerInfo.featureType
					,featureNS: layerInfo.featureNS
					,featurePrefix: layerInfo.featurePrefix
					,geometryName: layerInfo.geometryName
					,readFormat: new OpenLayers.Format.GeoJSON()
					,outputFormat: 'json'
				});
			layerOptions.protocol = layerInfo.protocol;
		} else {
			// Unrecognized layer
			$n2.reportError('Unrecognized layer: '+layerInfo.name);
		};

		// Create style map
		var layerStyleMap = this.CreateEffectiveStyleMap(layerInfo);
		layerOptions.styleMap = layerStyleMap;

		// Filter
		layerInfo.olFilter = null;
		if( layerInfo.filter ) {
			layerInfo.olFilter = $n2.olFilter.CreateOpenLayersFilter(layerInfo.filter);

			if( null == layerInfo.olFilter ) {
				alert('Encountered invalid filter');
			} else {
				layerOptions.filter = layerInfo.olFilter;
			};
		};

		if( layerInfo.useFixedStrategy ) {
			// Compute bbox string in the source coordinate space of the vector layer
			var vecSourceExtent = new OpenLayers.Bounds(
				options.mapCoordinateSpecifications.maxExtent[0]
				,options.mapCoordinateSpecifications.maxExtent[1]
				,options.mapCoordinateSpecifications.maxExtent[2]
				,options.mapCoordinateSpecifications.maxExtent[3]
				);
			if( userCoordProjection.getCode() != layerInfo.sourceProjection.getCode() ) {
				/*
				 * if the user coordinate space is different from the source projection of the vector layer
				 * then project the max extent bounding box back to the source projection of the vector layer.
				 * The WFS request can reproject the data but it cannot handle a bbox request in the reprojected
				 * coordinate space.
				 */
				vecSourceExtent.transform(userCoordProjection, layerInfo.sourceProjection);
			}

			// Add a BBOX filter
			var bboxFilter = new OpenLayers.Filter.Spatial({
				type: OpenLayers.Filter.Spatial.BBOX
				,property:  layerInfo.geometryName
				,value: vecSourceExtent
			});

			// Add filter
			if( null == layerOptions.filter ) {
				layerOptions.filter = bboxFilter;
			} else {
				var andFilter = new OpenLayers.Filter.Logical({
					type: OpenLayers.Filter.Logical.AND
					,filters: [ layerOptions.filter, bboxFilter ]
				});
				layerOptions.filter = andFilter;
			}

			// Installing strategies make sense only if a protocol is provided
			if( layerOptions.protocol ) {
				layerOptions.strategies = [ new OpenLayers.Strategy.Fixed() ];
			};

		} else {
			// Installing strategies make sense only if a protocol is provided
			if( layerOptions.protocol ) {
				layerOptions.strategies = [ new OpenLayers.Strategy.BBOX() ];
			};
		};
		//layerOptions.renderers = ['Canvas','SVG','VML'];
		layerOptions.renderers = ['SVG','VML'];

		layerInfo.olLayer = new OpenLayers.Layer.Vector(layerInfo.name, layerOptions);
		
		layerInfo.olLayer.events.register('visibilitychanged', null, function(evt_){
			var selected = evt_.object.visibility;
			evt_.object._layerInfo.selectListener(selected,evt_.object._layerInfo);
		});
		
		layerInfo.olLayer.events.register('beforefeaturesadded', null, function(evt_){
			var features = evt_.features;
			if( features ){
				for(var i=0,e=features.length;i<e;++i){
					var f = features[i];
					if( _this.clickedInfo.fids[f.fid] ){
						_this.clickedInfo.feature = f;
						f.isClicked = true;
					};
				};
			};
		});
		
		layerInfo.olLayer.events.register('featuresadded', null, function(evt_){
			_this._resortLayerFeatures(evt_);
			
			var layer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				var layer = evt_.features[0].layer;
			};
			if( layer ) {
				var infoLayer = layer._layerInfo;
			};
			
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};
		});
		
		layerInfo.olLayer.events.register('featuresremoved', null, function(evt_){
			var layer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				var layer = evt_.features[0].layer;
			};
			if( layer ) {
				var infoLayer = layer._layerInfo;
			};
			
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};
		});

		// Remember
		this.infoLayers.push( layerInfo );
		this.vectorLayers.push( layerInfo.olLayer );
		
		// Allow caller to access layers
		if( layerInfo.id ) {
			this.layers[layerInfo.id] = layerInfo.olLayer;
		} else {
			this.layers[layerInfo.name] = layerInfo.olLayer;
		};
		
		return layerInfo;
	}
	
	,findLayerFromId:  function(id) {
		return this.layers[id];
	}
	
	,addLayer: function(opt_) {
		var layerInfo = this.createLayerFromOptions(opt_);
		this.map.addLayer( layerInfo.olLayer );
		this._installFeatureSelector();
	}
	
	,_uninstallFeatureSelector: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.deactivate();
			this.map.removeControl(this.selectFeatureControl);
			this.selectFeatureControl = null;
		};
	}
	
	,_installFeatureSelector: function() {
		var _this = this;
		
		if( this.selectFeatureControl ) this._uninstallFeatureSelector();
		
		var navHighlightOptions = {
				hover: true
				,onSelect: function(feature){ 
					_this.startHover(feature); 
				}
				,onUnselect: function(){ 
					_this.endHover(); 
				}
			};
		this.selectFeatureControl = new OpenLayers.Control.SelectFeature(
			this.vectorLayers
			,navHighlightOptions
		);
		var selControl = new FeatureEvents({
			onOver: function(feature){ 
				_this.startHover(feature); 
			}
			,onOut: function(){ 
				_this.endHover(); 
			}
			,onClick: function(feature, forced) {
				_this.startClicked(feature, forced);
			}
			,onClickOut: function(){
				_this._endClicked();
			}
		});
		this.selectFeatureControl.handlers.feature = new OpenLayers.Handler.Feature(
				selControl
				,this.selectFeatureControl.layer
				,{
					over: selControl.over
					,out: selControl.out
					,click: selControl.click
					,clickout: selControl.clickout
				}
				,{
					geometryTypes: this.selectFeatureControl.geometryTypes
				}
            );
		this.map.addControl(this.selectFeatureControl);
		this.selectFeatureControl.activate();
	}
	
	,_resortLayerFeatures: function(evt_){

		if( this.resortFeatureLock ) return; // do not re-enter

		this.resortFeatureLock = true;

		var layer = null;
		if( evt_ 
		 && evt_.features 
		 && evt_.features.length 
		 && evt_.features[0] 
		 && evt_.features[0].layer ) {
			var layer = evt_.features[0].layer;
		};

		if( layer ) {
			var features = layer.features;
			var resortingRequired = false;
			for(var i=0,e=features.length-2; i<=e; ++i){
				var c = $n2.olUtils.featureSorting(features[i],features[i+1]);
				if( c > 0 ) {
					resortingRequired = true;
					break;
				};
			};

			if( resortingRequired ) {
				// At this point, resorting is required. Remove all features
				// from layer, re-sort them and add them back.
				layer.removeAllFeatures();
				$n2.olUtils.sortFeatures(features);
				layer.addFeatures(features);
			}; // if(resortingRequired)
		}; // if(layer)

		this.resortFeatureLock = false;
	}
	
	,_mapBusyStatus: function(delta){
		var previous = this.mapBusyCount;
		this.mapBusyCount += delta;
		if( previous < 1 && this.mapBusyCount > 0 ) {
			$n2.log('Start map busy');
		};
		if( previous > 0 && this.mapBusyCount < 1 ) {
			$n2.log('End map busy');
		};
		if( this.busyMapControl && delta < 0 ) {
			this.busyMapControl.decreaseCounter();
		} else if( this.busyMapControl && delta > 0 ) {
			this.busyMapControl.increaseCounter();
		}
	}
	
	// === END -- LAYER MANAGEMENT ========================================================

	,redefineFeatureLayerStylesAndRules : function(layerName) {
		var layerInfo = this.getNamedLayerInfo(layerName);
		if (null == layerInfo) {
			alert('redefineFeatureLayerStylesAndRules: unknown layer name: ' + layerName)
		} else {
    		this._endClicked();
    		layerInfo.olLayer.redraw();    			
		};
	}
	
	,recentreMap: function (ll) { // @param ll OpenLayers LonLat in map projection for centre of map
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	}
	
	,setNewExtent: function(bounds, srsName) { // @param bounds OpenLayers Bounds values in array (in map projection coordinates)

		var maxExt = new OpenLayers.Bounds(bounds[0], bounds[1], bounds[2], bounds[3]);
	
		if( null != srsName ) {
			this.convertBoundsToMapProjection(maxExt, srsName);
		};
	
		this.map.zoomToExtent(
			maxExt
			,true
		);
	}
	
	,getMediaPath: function() {
		return this.dbSearchEngine.getRelMediaPath();
	}
	
	,getSidePanelName: function() {
		return this.options.sidePanelName;
	}

	,getFilterPanelName: function() {
		return this.options.filterPanelName;
	}

	/*
	 * Add a listener that receives information about the mouse position
	 * on the map.
	 * 
	 * @param listener Function that is called on every event that updates
	 *                 the mouse position. This function should accept two arguments:
	 *                 the first is the browser event; the second is the intance of
	 *                 map and control. For example: f(event, mapAndControl). To obtain
	 *                 the current position, retrieve it from the mapAndControl instance
	 *                 (mapAndControl.lastMapXy).
	 *                 If the listener returns true, then it will be kept on the listener queue.
	 *                 If the listener returns false, then it is removed from subsequent calls.
	 * 
	 */
	,addMapMousePositionListener: function(listener){
		if( typeof(listener) === 'function' ) {
			this.mapMouseMoveListeners.push(listener);
		};
	}
	
	,_retrieveCachedValue: function(id) {
		// Look through the layers
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var layerInfo = this.infoLayers[i];
			var valueMap = this._getCachedValueMap(layerInfo);
			if( valueMap 
			 && valueMap[id]
			 && !valueMap[id].__n2_cache_invalid
			 ) {
				return valueMap[id];
			};
		};
		
		return null;
	}
	
	,_getCachedValueMap: function(layerInfo) {
		if( layerInfo.cachedValues ) {
			var valueMap = layerInfo.cachedValues;
		} else {
			valueMap = {};
			layerInfo.cachedValues = valueMap;
			
			var olLayer = layerInfo.olLayer;
			var features = olLayer.features;
			for(var i=0,e=features.length; i<e; ++i){
				var feature = features[i];
				valueMap[feature.fid] = feature.data;
			};
		};
		
		return valueMap;
	}
	
	,_clearValueCache: function(layerInfo){
		layerInfo.cachedValues = null;
	}
	
	,_cacheInvalidateFeature: function(id) {
		// Invalidate feature on each layer
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var layerInfo = this.infoLayers[i];
			var valueMap = this._getCachedValueMap(layerInfo);
			if( valueMap && valueMap[id] ) {
				valueMap[id].__n2_cache_invalid = true;
			};
		};
	}
	
	,_cacheUpdateDocumentVersion: function(id,rev){
		// Iterate over all layers
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var layerInfo = this.infoLayers[i];
			var valueMap = this._getCachedValueMap(layerInfo);

			// Invalidate feature if revision has changed
			if( valueMap && valueMap[id] ) {
				if( valueMap[id]._rev !== rev ) {
					valueMap[id].__n2_cache_invalid = true;
				};
			};
		};
	}

	,_handleMapMousePosition: function(evt){
		if( null == evt ) {
			this.lastMapXy = null;
		} else {
			this.lastMapXy = this.map.events.getMousePosition(evt);
		};
		
		// Call listeners, removing those that do not need to be called again
		var newListeners = [];
		for(var i=0,e=this.mapMouseMoveListeners.length; i<e; ++i){
			var l = this.mapMouseMoveListeners[i];
			try {
				var keep = l(evt, this);
				if( keep ) {
					newListeners.push(l);
				};
			} catch(e){
				// ignore error. remove listener
			};
		};
		this.mapMouseMoveListeners = newListeners;
	}
	
	,_getDispatchService: function(){
		var d = null;
		if( this.options.directory ) {
			d = this.options.directory.dispatchService;
		};
		
		return d;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			var h = dispatcher.getHandle('n2.mapAndControls');
			dispatcher.send(h,m);
		};
	}
	
	,_registerDispatch: function(event, fn){
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			var _this = this;
			if( !fn ) {
				fn = this._handleDispatch_;
			};
			if( !fn ){
				fn = function(m){
					_this._handleDispatch(m);
				};
			};

			var h = dispatcher.getHandle('n2.mapAndControls');
			dispatcher.register(h,event,fn);
		};
	}
	
	,_handleDispatch: function(m){
		var type = m.type;
		if( 'documentVersion' === type ) {
			this._cacheUpdateDocumentVersion(m.docId,m.rev);
			
		} else if( 'documentDeleted' === type ) {
			this.removeFeature(m.docId);
			
		} else if( 'featureCreated' === type ) {
			var doc = m.doc;
			if( doc && doc._rev ){
				var feature = this.getFeatureFromFid(doc._id);
				if( feature && feature.data ){
					if( feature.data._rev === doc._rev ){
						// Nothing to do
						return;
					};
				};
			};
			
			var filter = $n2.olFilter.fromFid(m.docId);
			this._reloadFeature(filter);
			
		} else if( 'featureUpdated' === type ) {
			var doc = m.doc;
			if( doc && doc._rev ){
				var feature = this.getFeatureFromFid(doc._id);
				if( feature && feature.data ){
					if( feature.data._rev === doc._rev ){
						// Nothing to do
						return;
					};
				};
			};
			
			var filter = $n2.olFilter.fromFid(m.docId);
			this._reloadFeature(filter);
			
		} else if( 'addLayerToMap' === type ) {
			this._handleAddLayerToMap(m);
			
		} else if( 'selected' === type ) {
			var feature = m.feature;
			if( !feature ) {
				feature = this.getFeatureFromFid(m.docId);
			};
			this._selectedFeature(feature, m.docId);
			
		} else if( 'unselected' === type ) {
			this._endClicked();
			
		} else if( 'focusOn' === type ) {
			var feature = m.feature;
			if( !feature ) {
				feature = this.getFeatureFromFid(m.docId);
			};
			if( feature ) {
				this._highlightHoveredFeature(feature, true);
			};
			
		} else if( 'focusOff' === type ) {
			var feature = m.feature;
			if( !feature ) {
				feature = this.getFeatureFromFid(m.docId);
			};
			if( feature ) {
				this._highlightHoveredFeature(feature, false);
			};
			
		} else if( 'findOnMap' === type ) {
			this._centerMapOnFeatureId(m.fid, m.x, m.y);
			
		} else if( 'searchInitiate' === type ) {
			this._endClicked();
			
		} else if( 'editInitiate' === type ) {
			var fid = m.docId;
			if( fid ){
				var feature = this.getFeatureFromFid(fid);
				this._initiateFeatureEdit(feature);
			};
			
		} else if( 'editCancel' === type ) {
			if( this.currentMode === this.modes.EDIT_FEATURE ){
    			var editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
	    		if( editFeature 
	    		 && editFeature._n2MapOriginal ) {
	    			editFeature._n2MapOriginal.restoreGeom = true;
	    		};

	    		this.switchMapMode(this.modes.NAVIGATE);
			};
			
		} else if( 'editClosed' === type ) {
			if( this.currentMode !== this.modes.NAVIGATE ){
				this.switchMapMode(this.modes.NAVIGATE);
			};
			var deleted = m.deleted;
			if( !deleted ) {
				var docId = m.docId;
				if( docId ) {
					var feature = this.getFeatureFromFid(docId);
					this._selectedFeature(feature, docId);
				};
			};
			
		} else if( 'geometryModified' === type ) {
			if( m._origin !== this ){
				this._geometryModified(m.docId, m.geom, m.proj);
			};
		};
	}
	
	,_handleAddLayerToMap: function(m){
		var layerDef = m.layer;
		
		var olLayer = this.findLayerFromId(layerDef.id);
		if( !olLayer ) {
			this.addLayer(layerDef);
			olLayer = this.findLayerFromId(layerDef.id);
		};
		
		// Turn on
		if( olLayer ) {
			olLayer.setVisibility(true);
		};

		// Zoom
		if( m.options && m.options.setExtent ) {
			var bounds = m.options.setExtent.bounds;
			var srsName = m.options.setExtent.crs;
			this.setNewExtent(bounds, srsName);
		};
	}
});

$n2.mapAndControls = function(opts_){
	return new MapAndControls(opts_);
};
$n2.mapAndControls.MapAndControls = MapAndControls;

// Pop-up management
$n2.mapAndControls.DefaultPopupHtmlFunction = null;
$n2.mapAndControls.BasicPopupHtmlFunction = defaultPopupHtml;

})(jQuery,nunaliit2);