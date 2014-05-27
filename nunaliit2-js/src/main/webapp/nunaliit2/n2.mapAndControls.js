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
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
	var DH = 'n2.mapAndControls';

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
        		if( buttons.Save ) { installSaveButton( buttons.Save ); };
        		if( buttons['Delete'] ) { installDeleteButton( buttons['Delete'] ); };
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
var GazetteerProcess = $n2.Class({
	
	geoNamesService: null
	
	,initialize: function(geoNamesService_){
		this.geoNamesService = geoNamesService_;
	}

	,initiateCapture: function(mapControl){
		var _this = this;
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div></div>')
			.attr('id',dialogId)
			.addClass('n2MapAndControls_gazette_dialog');
		
		var inputId = $n2.getUniqueId();
		$('<div><input id="'+inputId+'" type="text"/></div>')
			.appendTo($dialog);

		$('<div class="n2MapAndControls_gazette_results"></div>')
			.appendTo($dialog);

		var dialogOptions = {
			autoOpen: true
			,modal: true
			,title: _loc('Create feature from name')
			,width: 'auto'
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		var $input = $('#'+inputId);
		
		this.geoNamesService.installAutoComplete({
			input: $input
		});

		var request = {
			mapControl: mapControl
			,dialogId: dialogId
			,val: null
			,location: null
		};
		
		$input.keydown(function(e){
			var key = e.which;
			
			// $n2.log('key',key);
			
			if( key === 13 ) {
				var $input = $('#'+inputId);
				var val = $input.val();
				
				if( $input.autocomplete ){
					$input.autocomplete('close');
				};

				request.name = val;
				
				_this._searchForName(request);
			};
			
			return true;
		});
		
		// Get centre of map to find biased country
		this._findCurrentLocation(request);
	}
	
	,_searchForName: function(request){
		var _this = this;
		
		var countryBias = null;
		if( request.location
		 && request.location.countryCode ){
			countryBias = request.location.countryCode;
		};
		
		$('#'+request.dialogId).find('.n2MapAndControls_gazette_results').empty();
		
		this.geoNamesService.getName({
			name: request.name
			,featureClass: $n2.GeoNames.FeatureClass.PLACES
			,maxRows: 25
			,countryBias: countryBias
			,onSuccess: function(results){
				var $div = $('#'+request.dialogId).find('.n2MapAndControls_gazette_results')
					.empty();
				
				for(var i=0,e=results.length; i<e; ++i){
					var entry = results[i];
					
					if( entry.geonameId ) {
						var $entry = $('<div></div>')
							.addClass('n2MapAndControls_gazette_result')
							.appendTo($div);
						
						var name = entry.name;
						if( entry.adminName1 ){
							name += ', ' + entry.adminName1;
						};
						if( entry.countryName ){
							name += ', ' + entry.countryName;
						};
						$('<div></div>')
							.addClass('n2MapAndControls_gazette_result_name')
							.text(name)
							.appendTo($entry);
						
						_this._installOnClick(request, $entry, entry);

						if( entry.lng && entry.lat ) {
							var longLat = entry.lng + ',' + entry.lat;
							$('<div></div>')
								.addClass('n2MapAndControls_gazette_result_location')
								.text(longLat)
								.appendTo($entry);
						};
					};
				};
			}
		});
	}
	
	,_installOnClick: function(request, $entry, entry){
		var _this = this;
		
		$entry.click(function(){
			_this._selectEntry(request, entry);
		});
	}
	
	,_selectEntry: function(request, entry){
		var $dialog = $('#'+request.dialogId);
		$dialog.dialog('close');
		
		var editLayer = request.mapControl.editLayer;
		var map = request.mapControl.map;
		
		var geom = new OpenLayers.Geometry.Point(1 * entry.lng, 1 * entry.lat);

		// Reproject geometry
		var mapProjection = map.projection;
		var gazetteProjection = new OpenLayers.Projection('EPSG:4326');
		if( gazetteProjection.getCode() != mapProjection.getCode() ) {
			geom.transform(gazetteProjection, mapProjection);
		};
		
		// Center map on geometry
		var ll = new OpenLayers.LonLat(geom.x, geom.y);
		map.setCenter(ll);

		// Create and add feature
		var feature = new OpenLayers.Feature.Vector(geom);
		editLayer.addFeatures([feature]);
	}
	
	,_findCurrentLocation: function(request){
		var map = request.mapControl.map;
		var ll = map.getCenter();
		if( ll ) {
			// Reproject geometry
			var mapProjection = map.projection;
			var gazetteProjection = new OpenLayers.Projection('EPSG:4326');
			if( gazetteProjection.getCode() != mapProjection.getCode() ) {
				ll.transform(mapProjection, gazetteProjection);
			};

			this.geoNamesService.findNearby({
				lng: ll.lon
				,lat: ll.lat
				,maxRows: 1
				,onSuccess: function(results){
					if(results && results.length){
						var entry = results[0];
						request.location = entry;
					};
				}
				,onError: function(err){
					// Ignore
				}
			});
		};
	}
});

//**************************************************
//**************************************************

var zoomInClusterClickCallback = function(feature, mapAndControls){
	var clusterGeom = feature.geometry;
	
	var newCenter = null;
	if( clusterGeom ){
		newCenter = clusterGeom.getBounds().getCenterLonLat();
	};
    
	if( newCenter ){
		mapAndControls.map.setCenter(newCenter, mapAndControls.map.zoom + 1);
		//var xy = mapAndControls.map.getPixelFromLonLat(newCenter);
		//mapAndControls.map.zoomTo(mapAndControls.map.zoom + 1, xy);
		mapAndControls._endHover();
	};
};

var multiSelectClusterClickCallback = function(feature, mapAndControls){
	var docIds = [];
	
	if( feature.cluster ) {
		for(var i=0,e=feature.cluster.length; i<e; ++i){
			var f = feature.cluster[i];
			if( f && f.data && f.data._id ){
				docIds.push(f.data._id);
			};
		};
	};
	
	if( docIds.length ) {
		mapAndControls._dispatch({
			type: 'userSelect'
			,docIds: docIds
		});
	};
};

//**************************************************
//**************************************************

// Legacy. Probably no longer in use.
function basicPopupHtmlFunction(opt_) {
	var attrs = opt_.feature.attributes;
	var resArray = [];
	resArray.push('Name: '+  (attrs.placename?attrs.placename:'') + '<br/>');
	resArray.push('Meaning: '+  (attrs.meaning?attrs.meaning:'') + '<br/>');
	resArray.push('Entity: '+  (attrs.entity?attrs.entity:'') + '<br/>');
	var html = resArray.join('');
	opt_.onSuccess(html);
};

function suppressPopupHtmlFunction(opts_){
	var opts = $n2.extend({
		feature: null
		,layerInfo: null
		,onSuccess: null
		,onError: null
	},opts_);
	
	// Do not display anything
	opts.onSuccess(null);
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
    @param {Number} options_.layerInfo.displayInLayerSwitcher
		Show layer in Layer Switcher (true, default) or hide layer in switcher (true).
		Applied in WMS layers only.
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
    @param {Number} options_.layerInfo.gutter
		Extra sapce, specified in pixels, to add around images fetched from WMS.
		Useful for WMS labelling in use with tiled service.
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

var MapAndControls = $n2.Class({
	
	options: null
	,dbSearchEngine: null
	,contributionDb: null
	,map: null
	,editLayer: null
	,html: null
 	,lastMapXy: null
 	,mapMouseMoveListeners: null
	,olkitDisplayOptions: null
	,pendingMarkInfo: null
	,attributeFormManagerOptions: null
	,attributeFormManager: null
	,currentPopup: null
	,dhtmlSoundDivId: null
	,initialZoomBounds: null

    // HOVER and CLICK
	,selectFeatureControl: null
	,hoverInfo: null
	,clickedInfo: null
	,focusInfo: null
	,findFeatureInfo: null

    // MODES
	,modes: null
	,currentMode: null

	// MAP MODES
	,navigationControls: null
	,editControls: null
	,editFeatureControls: null

 	// EDIT mode callbacks
	,editModeAddFeatureEnabled: null
	,editModeAddFeatureCallback: null
    ,convertToMultiGeometry: null
    
    // EDIT_FEATURE mode
    ,editFeatureFid: null

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
	,mapLayers: null
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
			,mapInteractionDivName: 'map_interaction_div' 
		};
		this.options = $.extend(true, {}, defaultOptions, options_);

		this.dbSearchEngine = $n2.dbSearchEngine( (options_ ? options_.dbSearchEngine : null) );

		this.contributionDb = $n2.contributionDb( (options_ ? options_.contributionDb : null) );

		this.map = null;
		this.editLayer = null;
		this.html = "";
		this.lastMapXy = null;
		this.mapMouseMoveListeners = [];
		this.olkitDisplayOptions = {};
		this.pendingMarkInfo = null;
		this.mapBusyCount = 0;
		this.dhtmlSoundDivId = $n2.getUniqueId();
		this.editFeatureFid = null;

	    // HOVER and CLICK
		this.selectFeatureControl = null;
	    this.hoverInfo = {
	    	feature: null
			,endFn: []
		};
		this.clickedInfo = {
			features: []
			,endFn: []
			,fids: {}
			,selectedId: null
		};
		this.focusInfo = {
			fids: {}
			,features: []
		};
		this.findFeatureInfo = {
			fid: null
			,features: []
		};

		// MODES
		this.modes = {
			NAVIGATE: {
				name        : "NAVIGATE"
				,buttonValue : _loc('Add or Edit a Map Feature')
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				,onStartClick: function(feature, mapFeature) {
					_this.initAndDisplayClickedPlaceInfo(feature);
				}
				,onEndClick: function(feature) {
				}
			}
			,EDIT: {
				name        : "EDIT"
				,buttonValue : _loc('Cancel Feature Editing')
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				,onStartClick: function(feature, mapFeature) {

					var editAllowed = true;
					if( mapFeature.cluster && mapFeature.cluster.length > 1 ) {
						alert( _loc('This feature is a cluster and can not be edited directly. Please, zoom in to see features within cluster.') );
						editAllowed = false;
					};
					
					if( editAllowed ) {
						_this.switchToEditFeatureMode(feature.fid, mapFeature);
						
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
				,buttonValue : _loc('Cancel Feature Editing')
			}
		};
		this.currentMode = this.modes.NAVIGATE;

	 	// COMETD
	    this.cometEnabled = true;
	    this.fidChannel = '/fid';
	    this.contributionChannel = '/contribution';
	    
	    this._registerDispatch('documentVersion');
	    this._registerDispatch('documentDeleted');
	    this._registerDispatch('cacheRetrieveDocument');
	    this._registerDispatch('featureCreated');
	    this._registerDispatch('featureUpdated');
	    this._registerDispatch('addLayerToMap');
	    this._registerDispatch('selected');
	    this._registerDispatch('selectedSupplement');
	    this._registerDispatch('unselected');
	    this._registerDispatch('focusOn');
	    this._registerDispatch('focusOff');
	    this._registerDispatch('focusOnSupplement');
	    this._registerDispatch('findOnMap');
	    this._registerDispatch('searchInitiate');
	    this._registerDispatch('editInitiate');
	    this._registerDispatch('editCancel');
	    this._registerDispatch('editClosed');
	    this._registerDispatch('editGeometryModified');
	    this._registerDispatch('mapRedrawLayer');
	    this._registerDispatch('mapSetInitialExtent');
	    this._registerDispatch('mapSetExtent');
	    this._registerDispatch('mapResetExtent');
	    this._registerDispatch('mapGetLayers');
	    this._registerDispatch('setMapLayerVisibility');
		
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
				return _this._createStyleMapFromLayerInfo(layerInfo); 
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
			
			// This is the function called back when a cluster with
			// more than one feature is clicked
			,clusterClickCallback: null
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
		if( $n2.placeInfo ) {
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
		var authService = this._getAuthService();
	    if( authService ) {
	    	authService.addListeners(function(currentUser){
				_this.loginStateChanged(currentUser);
			});
	    };
	    
	    // EDIT mode callbacks
	    this.editModeAddFeatureEnabled = true;
		this.editModeAddFeatureCallback = function(evt) {
			// This function is called when a feature is added
			// to the edit layer. This happens when a toolbar adds
			// a new feature i.e. when the user selects to add a new
			// point, line or polygon.
	    	if( _this.editModeAddFeatureEnabled ) {
		    	var feature = evt.feature;
		    	if( feature ) {
		    		// Remember that this is a newly added feature
		    		feature._n2MapNewFeature = true;
		    	};
	    		_this.switchToEditFeatureMode(feature.fid, feature);
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

		var mapProjection = new OpenLayers.Projection(this.options.mapDisplay.srsName);
		var userCoordProjection = new OpenLayers.Projection(this.options.mapCoordinateSpecifications.srsName);

		// Convert initial bounds to the map's projection
		this.initialZoomBounds = new OpenLayers.Bounds(
			this.options.mapCoordinateSpecifications.initialBounds[0]
			,this.options.mapCoordinateSpecifications.initialBounds[1]
			,this.options.mapCoordinateSpecifications.initialBounds[2]
			,this.options.mapCoordinateSpecifications.initialBounds[3]
		);
		if( userCoordProjection.getCode() != mapProjection.getCode() ) {
			this.initialZoomBounds.transform(userCoordProjection, mapProjection);
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
			,zoomMethod: null  // Zoom with features does not look good
		});
		
		// Disable zoom on mouse wheel
		var navControls = this.map.getControlsByClass('OpenLayers.Control.Navigation');
		for(var i=0,e=navControls.length; i<e; ++i) {
			navControls[i].disableZoomWheel();
		};
		if( this.map.div ){
			var $map = $(this.map.div);
			$map.find('.olControlZoomIn').attr('title', _loc('Zoom In'));
			$map.find('.olControlZoomOut').attr('title', _loc('Zoom Out'));
		};
		
		// Fix zoomToMaxExtent to zoom to initial extent
		this.map.zoomToMaxExtent = function(){
	        this.zoomToExtent(this.initialZoomBounds);
		};

		// Create control before layers start loading
		this.busyMapControl = new OpenLayers.Control.N2LoadingPanel();

		// Create map layers
		this.mapLayers = [];
		this.vectorLayers = [];
		this.infoLayers = [];
		
		// Generate background layers
		this._genBackgroundMapLayers(this.options);
		
		// Create edit layer
		var editLayerStyleMap = this._createEffectiveStyleMap(null);
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
		this.mapLayers.push(this.editLayer);
		this.vectorLayers.push(this.editLayer);
		var modifiedHandler = this._createFeatureModifiedHandler(this.editLayer);
		this.editLayer.events.register('featuremodified', null, modifiedHandler);
		
		// Create vector layer for user defined layers (legacy)
		this.layers = {};
		if( this.options.layerInfo ) {
			for(var loop=0; loop<this.options.layerInfo.length; ++loop) {
				var layerOptions = this.options.layerInfo[loop];
				var lInfo = this.createLayerFromOptions(layerOptions);
				if( lInfo && lInfo.olLayer ){
					this.mapLayers.push(lInfo.olLayer);
				};
			};
		};
		
		// Create overlay layers based on layer definition used in couchModule
		if( this.options.overlays ) {
			for(var loop=0; loop<this.options.overlays.length; ++loop) {
				var layerDefinition = this.options.overlays[loop];
				var l = this._createOLLayerFromDefinition(layerDefinition,false);
				if( l ){
					this.mapLayers.push(l);
				};
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
		
		this.map.addLayers(this.mapLayers);

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
			var layerSwitcherControl = null;
			if( OpenLayers.Control.NunaliitLayerSwitcher ){
				layerSwitcherControl = new OpenLayers.Control.NunaliitLayerSwitcher();
			} else {
				layerSwitcherControl = new OpenLayers.Control.LayerSwitcher();
			};
			this.map.addControl(layerSwitcherControl);
			if( layerSwitcherControl 
			 && layerSwitcherControl.div ) {
				layerSwitcherControl.div.setAttribute('title', _loc('Layer Selector'));
			};
			if( this.options.layerSwitcher
			 && this.options.layerSwitcher.initiallyOpened ) {
				layerSwitcherControl.maximizeControl();
			} else if( allLayersInitiallyInvisible ) {
				layerSwitcherControl.maximizeControl();
			};
		};

		// Zoom to initial bounds
		this.map.zoomToExtent(this.initialZoomBounds);

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
    		if( OpenLayers.Control.NunaliitGazetteer
    		 && this.options.directory
    		 && this.options.directory.geoNamesService ) {
    			var geoNamesService = this.options.directory.geoNamesService;
    			var gazetteerProcess = new GazetteerProcess(geoNamesService);
    			var control = new OpenLayers.Control.NunaliitGazetteer({
    				activateListener: function(){
    					gazetteerProcess.initiateCapture(_this);
    				}
    			});
    			this.editControls.toolbar.addControls([ control ]);
    		};
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
		var $dhtmlSoundDiv = $('#'+this.dhtmlSoundDivId);
		if( $dhtmlSoundDiv.length < 1 ){
			$dhtmlSoundDiv = $('<div></div>')
				.attr('id',this.dhtmlSoundDivId)
				.appendTo( $('body') )
				;
		};
		if (surl) {
			var effectiveUrl = this.dbSearchEngine.getRelMediaPath(surl);
			$dhtmlSoundDiv.html('<embed src="'+effectiveUrl+'" hidden="true" autostart="true" loop="false"/>');
		} else {
			$dhtmlSoundDiv.empty();
		};
	}
	
	,initAndDisplayClickedPlaceInfo: function(feature) {
		var dispatchService = this._getDispatchService();
		if( dispatchService ) {
			dispatchService.send(DH, {
				type: 'userSelect'
				,docId: feature.data._id
				,doc: feature.data
				,feature: feature
	 		});

		} else {
			$n2.placeInfo.setFeatureReinitDisplay(feature);
			$n2.placeInfo.loadAndRenderContributions();
		};
	}
	
	,_getMapFeaturesIncludingFid: function(fid){
		var features = [];
		
		for(var loop=0; loop<this.infoLayers.length; ++loop) {
			var layerInfo = this.infoLayers[loop];
			var feature = this._getLayerFeatureIncludingFid(layerInfo.olLayer,fid);
			if( feature ) {
				features.push(feature);
			};
		};
		
		return features;
	}
	
	,_getLayerFeatureIncludingFid: function(layer,fid) {
		
		if( layer && layer.features ) {
			var loop;
			var features = layer.features;
			for(loop=0;loop<features.length;++loop) {
				var feature = features[loop];
				if( feature.fid && feature.fid === fid ) {
					return feature;
				} else if( feature.cluster ) {
					for(var j=0,k=feature.cluster.length; j<k; ++j){
						var f = feature.cluster[j];
						if( f.fid && f.fid === fid ){
							return feature;
						};
					};
				};
			};
		};
		
		return null;
	}
	
	,_getLayerFeaturesFromFilter: function(layer,filter) {
		var r = [];
		
		if( layer && layer.features ) {
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
		// Figure out which layers to reload
		var reloadInfoLayers = [];
		for(var loop=0; loop<this.infoLayers.length; ++loop) {
			var layerInfo = this.infoLayers[loop];
			var features = this._getLayerFeaturesFromFilter(layerInfo.olLayer,filter);
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
			
			this._loadFeatureOnLayer(layerInfo, filter, options_);
		};
	}
	
	/*
	 * Attempts to reload features given a specified layer and filter
	 */
	,_loadFeatureOnLayer: function(layerInfo,filter,options_){
		var _this = this;
		
		// Figure out options
		var reloadOptions = $n2.extend({
			onReloaded: function(feature){}
		},options_);

		var protocol = layerInfo.protocol;
		
		// Create filter
		var olFilter = filter.getOpenLayerFilter();
		
        protocol.read({
	        filter: olFilter
	        ,callback: createCallback(layerInfo, reloadOptions)
	        //,scope: this
        });
		
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
		        
				// Analyze features
		        var featuresToAdd = [];
		        var featuresToDestroy = [];
				for(var featureLoop=0; featureLoop<features.length; ++featureLoop) {
					// Read in feature
					var loadedFeature = features[featureLoop];
					featuresToAdd.push(loadedFeature);
					
					var feature = _this._getLayerFeatureIncludingFid(layerInfo.olLayer,loadedFeature.fid);
					if( feature ) {
						if( feature.cluster ){
							for(var j=0,k=feature.cluster.length; j<k; ++j){
								var cf = feature.cluster[j];
								if( cf.fid !== loadedFeature.fid ){
									featuresToAdd.push(cf);
								};
							};
						};
						
						featuresToDestroy.push(feature);
					}
				};
				
				// Remove features
				if( featuresToDestroy.length > 0 ){
					layerInfo.olLayer.destroyFeatures(featuresToDestroy);
				};
					
				// Add feature to layer
				// If in edit mode, first disable editAttribute widget
				if( _this.currentMode === _this.modes.EDIT ) {
					_this.editModeAddFeatureEnabled = false;
					
					layerInfo.olLayer.addFeatures(featuresToAdd);
					
					_this.editModeAddFeatureEnabled = true;
				} else {
					layerInfo.olLayer.addFeatures(featuresToAdd);
				};

				// Report feature reloaded
				for(var featureLoop=0; featureLoop<features.length; ++featureLoop) {
					// Read in feature
					var loadedFeature = features[featureLoop];
					reloadOptions.onReloaded(loadedFeature);
				};
			};
			
			return cb;
		};
	}
	
	,_removeFeature: function(fid) {
		for(var loop=0; loop<this.vectorLayers.length; ++loop) {
			var mapLayer = this.vectorLayers[loop];
			var feature = this._getLayerFeatureIncludingFid(mapLayer,fid);
			if( feature ) {
				if( feature.fid === fid ){
					mapLayer.destroyFeatures(feature);
					
				} else if( feature.cluster ){
					// Accumulate left over features from cluster
					var remainingFeatures = null;
					for(var j=0,k=feature.cluster.length; j<k; ++j){
						var cf = feature.cluster[j];
						if( cf.fid !== fid ){
							if( !remainingFeatures ) remainingFeatures = [];
							remainingFeatures.push(cf);
						};
					};
					
					// Destroy cluster feature
					mapLayer.destroyFeatures(feature);
					
					// Add remaining features, if needed
					if( remainingFeatures ){
						mapLayer.addFeatures(remainingFeatures);
					};
				};
			};
		};
	}
	
	,_centerMapOnFeature: function(feature) {
    	var geom = feature.geometry;
    	var bbox = geom.getBounds();
		var x = (bbox.left + bbox.right) / 2;
		var y = (bbox.bottom + bbox.top) / 2;
		
		this._centerMapOnXY(x,y,null); // same projection as map
	}

	,_centerMapOnXY: function(x, y, projCode) {
		var ll = new OpenLayers.LonLat(x, y);
		
		if( projCode 
		 && projCode != this.map.projection.getCode() ) {
			var proj = new OpenLayers.Projection(projCode);
			ll.transform(proj, this.map.projection); // transform in place
		};
		
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	}
	
	,_installGeometryEditor: function(feature){
		// Can not install geometry editor if the feature is not on the map.
		if( !feature ) return;
		if( !feature.layer ) return;
		
		this._removeGeometryEditor(false);
		
   		var modifyFeatureGeometry = new OpenLayers.Control.ModifyFeature(
   			this.editLayer
   			,{
   				'displayClass': 'olControlMoveFeature'
   				,standalone: true
   				,clickout: false
   			}
   		);
   		modifyFeatureGeometry.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
		this.map.addControl(modifyFeatureGeometry);
		modifyFeatureGeometry.activate();
    	this.editFeatureControls.modifyFeatureGeometry = modifyFeatureGeometry;
    	
    	if( feature._n2MapNewFeature ){
    		// This is a new feature that is on the EDIT layer
    		modifyFeatureGeometry.selectFeature(feature);
    		
    	} else {
    		// This is editing an already existing feature from a layer
    		// other than the EDIT layer
    		
	    	// Remove feature from current layer
	    	var featureLayer = feature.layer;
	    	if( featureLayer ) {
	    		featureLayer.removeFeatures([feature],{silent:true});
	    	};
	    	
	    	// Compute the actual underlying feature
	    	var effectiveFeature = null;
	    	var geom = null;
	    	var featuresToAddBack = [];
	    	if( this.editFeatureFid === feature.fid ){
	        	effectiveFeature = feature;
	        	geom = feature.geometry;
	        	
	    	} else if( feature.cluster ){
	    		for(var i=0,e=feature.cluster.length; i<e; ++i){
	    			if( this.editFeatureFid === feature.cluster[i].fid ){
	    	    		effectiveFeature = feature.cluster[i];
	    	    		geom = feature.cluster[i].geometry;
	    			} else {
	    				featuresToAddBack.push(feature.cluster[i]);
	    			};
	    		};
	    	};
	    	
	    	// In cluster, add back the features that are not the one currently
	    	// in edit mode
	    	if( featureLayer && featuresToAddBack.length > 0 ){
	    		featureLayer.addFeatures(featuresToAddBack);
	    	};
	    	
	    	// Clone feature for edit layer
	    	if( geom ) {
		    	var editFeature = new OpenLayers.Feature.Vector(geom.clone());
		    	editFeature.fid = effectiveFeature.fid;
		    	editFeature._n2Original = {
		    		restoreGeom: false
		    		,layer: featureLayer
		    		,feature: effectiveFeature
		    		,data: $n2.extend(true, {}, effectiveFeature.data)
		    		,style: feature.style
		    	};
		    	
		    	this.editModeAddFeatureEnabled = false;
		    	this.editLayer.addFeatures([editFeature]);
		    	this.editModeAddFeatureEnabled = true;
	
		    	modifyFeatureGeometry.selectFeature(editFeature);
	    	};
    	};
	}
	
	,_removeGeometryEditor: function(reinstateOrginalGeometry){
		if( null != this.editFeatureControls.modifyFeatureGeometry ) {
			var editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
    		if( null != editFeature ) {
    			this.editFeatureControls.modifyFeatureGeometry.unselectFeature(editFeature);
    		};
    		this.editFeatureControls.modifyFeatureGeometry.deactivate();
    		this.map.removeControl( this.editFeatureControls.modifyFeatureGeometry );
    		this.editFeatureControls.modifyFeatureGeometry.destroy();
    		this.editFeatureControls.modifyFeatureGeometry = null;
    		
			if( reinstateOrginalGeometry && editFeature ){
				var originalLayer = null;
				var originalFeature = null;
				var originalData = null;
				var originalStyle = null;
				var restoreGeom = false;
				if( editFeature._n2Original ) {
					originalLayer = editFeature._n2Original.layer;
					originalFeature = editFeature._n2Original.feature;
					originalData = editFeature._n2Original.data;
					originalStyle = editFeature._n2Original.style;
					restoreGeom = editFeature._n2Original.restoreGeom;
				};
				
				// Compute effective feature
				var effectiveFeature = null;
				var featuresToAdd = [];
				if( originalFeature && editFeature.fid === originalFeature.fid ){
					effectiveFeature = originalFeature;
					featuresToAdd.push(originalFeature);
					
				} else if( originalFeature && originalFeature.cluster ){
					for(var i=0,e=originalFeature.cluster.length; i<e; ++i){
						var cf = originalFeature.cluster[i];
						if( editFeature.fid === cf.fid ){
							effectiveFeature = cf;
						};
						featuresToAdd.push(cf);
					};
				};

				// Clone geometry if feature was sucessfully updated
				if( effectiveFeature ){
					if( restoreGeom ){
						effectiveFeature.data = originalData;
					} else {
						effectiveFeature.geometry = editFeature.geometry.clone();
					};
					effectiveFeature.style = originalStyle;
				};

	    		// Remove feature from edit layer
				if( editFeature.layer ) {
					editFeature.layer.destroyFeatures([editFeature]);
				};

				// Add features back to original layer
				if( originalLayer && featuresToAdd.length > 0 ){
					originalLayer.addFeatures(featuresToAdd);
				};
			};
		};
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

		var cs = this._getCustomService();
		
		var layerInfo = $.extend({}, this.defaultLayerInfo, layerDefinition);
		
		// Derive database projection from name
		layerInfo.sourceProjection = new OpenLayers.Projection(layerInfo.sourceSrsName);

		layerInfo.name = _loc(layerInfo.name);
		
		// Popup function
		if( !layerInfo.featurePopupHtmlFn ){
			if( cs ){
				var cb = cs.getOption('mapFeaturePopupCallback');
				if( typeof cb === 'function' ) {
					layerInfo.featurePopupHtmlFn = cb;
				};
			};
		};
		if( !layerInfo.featurePopupHtmlFn ){
			layerInfo.featurePopupHtmlFn = $n2.mapAndControls.DefaultPopupHtmlFunction;
		};
		
		// Cluster click callback
		if( !layerInfo.clusterClickCallback ){
			if( cs ){
				var cb = cs.getOption('mapClusterClickCallback');
				if( typeof cb === 'function' ) {
					layerInfo.clusterClickCallback = cb;
				};
			};
		};
		if( !layerInfo.clusterClickCallback ){
			layerInfo.clusterClickCallback = $n2.mapAndControls.ZoomInClusterClickCallback;
		};
		
		var layerOptions = {
			name: layerInfo.name
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
				,sourceProjection: layerInfo.sourceProjection
			});
			layerInfo.protocol = new OpenLayers.Protocol.Couch(couchProtocolOpt);
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
			$n2.reportError('Unrecognized type ('+layerInfo.type+') for layer: '+layerInfo.name);
		};

		// Create style map
		var layerStyleMap = this._createEffectiveStyleMap(layerInfo);
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
		
		if( !layerOptions.strategies ){
			layerOptions.strategies = [];
		}
		if( layerInfo.clustering ) {
			var clusterOptions = {};
			for(var cProp in layerInfo.clustering){
				var cValue = layerInfo.clustering[cProp];
				if( 'distance' === cProp
				 || 'threshold' === cProp
				 || 'disableDynamicClustering' === cProp
				 || 'minimumPolygonPixelSize' === cProp
				 || 'minimumLinePixelSize' === cProp
				 || 'clusterPointsOnly' === cProp ){
					clusterOptions[cProp] = cValue;
				};
			};
			layerOptions.strategies.push( new OpenLayers.Strategy.NunaliitCluster(clusterOptions) );
		};
		
		// Sort features on a layer so that polygons do not hide points  
		layerOptions.strategies.push( new OpenLayers.Strategy.NunaliitLayerSorting() );
		
		//layerOptions.renderers = ['Canvas','SVG','VML'];
		layerOptions.renderers = ['SVG','VML'];

		layerInfo.olLayer = new OpenLayers.Layer.Vector(layerInfo.name, layerOptions);

		// Add events to layer
		this._registerLayerForEvents(layerInfo);

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
		var name = _loc(layerDefinition.name);
		
		if( 'Bing' == layerDefinition.type ){
			var options = layerDefinition.options;
			if( options
			 && options.key ) {
				var opts = $n2.extend({
					name: name
				},options);
				var l = new OpenLayers.Layer.Bing(opts);
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+name);
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
				var l = new OpenLayers.Layer.Google(name, options);
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+name);
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
				if ($n2.isDefined(layerDefinition.gutter)) {
					layerOptions.gutter = layerDefinition.gutter;
				};
				if ($n2.isDefined(layerDefinition.displayInLayerSwitcher)) {
					layerOptions.displayInLayerSwitcher = layerDefinition.displayInLayerSwitcher;
				};
				for(var key in options){
					if( 'url' === key ) {
						wmsUrl = options[key];
						
					} else if( 'opacity' === key ) {
						layerOptions.opacity = options[key];
						
					} else {
						wmsOptions[key] = options[key];
					};
				};
				var l = new OpenLayers.Layer.WMS(name, wmsUrl, wmsOptions, layerOptions);
				
				return l;
				
			} else {
				$n2.reportError('Bad configuration for layer: '+name);
				return null;
			};
			
		} else if( 'osm' === layerDefinition.type ){
			var url = null;
			var layerOptions = {
				isBaseLayer: isBaseLayer
			};

			if( typeof(layerDefinition.visibility) === 'boolean' ){
				layerOptions.visibility = layerDefinition.visibility;
			};

			var options = layerDefinition.options;
			if( options ) {
				for(var optionKey in options){
					var optionValue = options[optionKey];
					
					if( optionKey === 'url' ){
						url = optionValue;
					} else {
						layerOptions[optionKey] = optionValue;
					};
				};
			};

			var l = new OpenLayers.Layer.OSM(name, url, layerOptions);
			return l;
			
		} else if( 'stamen' === layerDefinition.type ){
			var layerName = null;
			var layerOptions = {
				isBaseLayer: isBaseLayer
			};

			if( typeof(layerDefinition.visibility) === 'boolean' ){
				layerOptions.visibility = layerDefinition.visibility;
			};

			var options = layerDefinition.options;
			if( options ) {
				for(var optionKey in options){
					var optionValue = options[optionKey];
					
					if( optionKey === 'layerName' ){
						layerName = optionValue;
					} else {
						layerOptions[optionKey] = optionValue;
					};
				};
			};

			if( OpenLayers.Layer.Stamen ) {
				if( !layerName ){
					$n2.reportError('Option layerName must be specified for a Stamen background.');
				}else{
					var l = new OpenLayers.Layer.Stamen(layerName, layerOptions);
					if( name ) {
						l.name = name;
					};
					return l;
				};
			} else {
				$n2.log('Stamen layer can not be added since Javascript library is not included');
			};
			
		} else if( 'image' === layerDefinition.type ){
			var url = null;
			var height = null;
			var width = null;
			var extent = null;
			var layerOptions = {
				isBaseLayer: isBaseLayer
			};

			if( typeof(layerDefinition.visibility) === 'boolean' ){
				layerOptions.visibility = layerDefinition.visibility;
			};

			var options = layerDefinition.options;
			if( options ) {
				for(var optionKey in options){
					var optionValue = options[optionKey];
					
					if( optionKey === 'url' ){
						url = optionValue;
					} else if( optionKey === 'height' ){
							height = 1 * optionValue;
					} else if( optionKey === 'width' ){
						width = 1 * optionValue;
					} else if( optionKey === 'extent' ){
						extent = optionValue;
					} else {
						layerOptions[optionKey] = optionValue;
					};
				};
			};

			if( OpenLayers.Layer.Image ) {
				var effectiveExtent = null;
				if( extent
				 && $n2.isArray(extent)
				 && extent.length == 4 ) {
					effectiveExtent = new OpenLayers.Bounds(extent[0], extent[1], extent[2], extent[3]);
				};
				
				if( !url ){
					$n2.reportError('Option url must be specified for an Image background.');
				} else if( !height ) {
					$n2.reportError('Option height must be specified for an Image background.');
				} else if( !width ) {
					$n2.reportError('Option width must be specified for an Image background.');
				} else if( !effectiveExtent ) {
					$n2.reportError('Option extent must be specified as an array of four numbers for an Image background.');
				} else {
					var size = new OpenLayers.Size(width,height);
					
					var l = new OpenLayers.Layer.Image(name, url, effectiveExtent, size, layerOptions);
					return l;
				};
				
			} else {
				$n2.log('Image layer can not be added since OpenLayers does not support this type of background');
			};
			
		} else {
			$n2.reportError('Unknown layer type: '+layerDefinition.type);
		};
		
		return null;
	}
	
	,_registerLayerForEvents: function(layerInfo){
		var _this = this;
		
		// Report change in visibility for the layer
		layerInfo.olLayer.events.register('visibilitychanged', null, function(evt_){
			var selected = evt_.object.visibility;
			layerInfo.selectListener(selected,layerInfo);
		});
		
		// Adjust isClicked and isHovered attributes before the feature is added to the layer
		layerInfo.olLayer.events.register('beforefeaturesadded', null, function(evt_){
			var features = evt_.features;
			if( features ){
				for(var i=0,e=features.length;i<e;++i){
					var f = features[i];
					if( _this.clickedInfo.fids[f.fid] ){
						var featureInfo = _this.clickedInfo.fids[f.fid];
						
						_this.clickedInfo.features.push(f);
						
						if( featureInfo.clicked ) {
							f.isClicked = true;
						};
						
						if( featureInfo.intent ) {
							f.n2SelectIntent = featureInfo.intent;
						};
					};
					if( _this.focusInfo.fids[f.fid] ){
						_this.focusInfo.features.push(f);
						f.isHovered = true;
					};
					if( _this.findFeatureInfo.fid === f.fid ){
						_this.findFeatureInfo.features.push(f);
						f.n2Intent = 'find';
					};
					if( f.cluster ){
						for(var j=0,k=f.cluster.length; j<k; ++j){
							var clusterFeature = f.cluster[j];
							if( _this.clickedInfo.fids[clusterFeature.fid] ){
								var featureInfo = _this.clickedInfo.fids[clusterFeature.fid];
								_this.clickedInfo.features.push(f);
								if( featureInfo.clicked ) {
									f.isClicked = true;
								};
								if( featureInfo.intent ) {
									f.n2SelectIntent = featureInfo.intent;
								};
							};
							if( _this.focusInfo.fids[clusterFeature.fid] ){
								_this.focusInfo.features.push(f);
								f.isHovered = true;
							};
							if( _this.findFeatureInfo.fid === clusterFeature.fid ){
								_this.findFeatureInfo.features.push(f);
								f.n2Intent = 'find';
							};
						};
					};
				};
			};
		});
		
		layerInfo.olLayer.events.register('featuresadded', null, function(evt_){

			// Clear the cache associated with the layer.
			var layer = null;
			var infoLayer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				layer = evt_.features[0].layer;
			};
			if( layer ) {
				infoLayer = layer._layerInfo;
			};
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};

			// In case a feature is loaded after the EDIT_FEATURE mode is entered,
			// install geometry editor on the feature.
			// This happens when edit is initiated from outside the map. The map
			// is then moved over to the location of the geometry. In that case,
			// the geometry might load up after the mode was switched.
			if( _this.currentMode === _this.modes.EDIT_FEATURE
			 && _this.editFeatureFid
			 && evt_
			 && evt_.features 
			 && evt_.features.length ){
				var editFeatureFid = _this.editFeatureFid;
				
				for(var i=0,e=evt_.features.length; i<e; ++i){
					var f = evt_.features[i];
					if( f.fid === editFeatureFid ){
						_this._installGeometryEditor(f);
						
					} else if( f.cluster ){
						for(var j=0,k=f.cluster.length; j<k; ++j){
							var cf = f.cluster[j];
							if( cf.fid === editFeatureFid ){
								_this._installGeometryEditor(f);
							};
						};
					};
				};
			};
		});
		
		// When features are removed, clear the cache associated with the layer.
		layerInfo.olLayer.events.register('featuresremoved', null, function(evt_){
			var layer = null;
			var infoLayer = null;
			if( evt_ 
			 && evt_.features 
			 && evt_.features.length 
			 && evt_.features[0] 
			 && evt_.features[0].layer ) {
				layer = evt_.features[0].layer;
			};
			if( layer ) {
				infoLayer = layer._layerInfo;
			};
			
			if( infoLayer ) {
				_this._clearValueCache(infoLayer);
			};
		});
		
		this._createFeatureModifiedHandler(layerInfo.olLayer);
	}
    
    ,_createFeatureModifiedHandler: function(olLayer){
    	var _this = this;
    	
        // Called when the feature on the map is modified
    	return function(evt){
        	var feature = evt.feature;
        	_this._dispatch({
        		type: 'editGeometryModified'
        		,docId: feature.fid
        		,geom: feature.geometry
        		,proj: olLayer.map.projection
        		,_origin: _this
        	});
    	};
    }

	,_genBackgroundMapLayers: function(options) {
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
		
		if( bg ) {
			for(var i=0,e=bg.length;i<e;++i){
				var bgLayer = bg[i];
				
				this.mapLayers.push( bgLayer );
			};
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

   	,_startClicked: function(mapFeature, forced) {
   		var feature = mapFeature;
   		if( feature && feature.cluster && feature.cluster.length == 1 ){
   			feature = feature.cluster[0];
   		};
   		
		var clickedAgain = false;
   		if( !forced ) {
			clickedAgain = (feature && feature.fid && this.clickedInfo.selectedId === feature.fid);
   		};
		if( !forced && !this.options.toggleClick && clickedAgain ) {
			// ignore click again
			return;
		};
		
		if( feature.cluster ){
			var layerInfo = feature.layer._layerInfo;

			layerInfo.clusterClickCallback(feature, this);
			
			return;
		};
		
		this._endClicked();
		
		if( !forced && this.options.toggleClick && clickedAgain ) {
			this._dispatch({type:'userUnselect',docId:feature.fid});
			
		} else if( feature.fid ) {
			this.clickedInfo.features = [feature];

			this.clickedInfo.fids = {};
			this.clickedInfo.fids[feature.fid] = { clicked: true };
			this.clickedInfo.selectedId = feature.fid;
			
			feature.isClicked = true;
			if( feature.layer ) {
				feature.layer.drawFeature(feature);
			}
			
			if( this.currentMode.onStartClick ) {
				this.currentMode.onStartClick(feature, mapFeature);
			};
		};
	}
	
	,_endClicked: function() {
		this._endFindFeature();
		
		if( this.clickedInfo.features ) {
			for(var i=0,e=this.clickedInfo.features.length;i<e;++i){
				var feature = this.clickedInfo.features[i];
				
				if( feature.isClicked ) {
					feature.isClicked = false;
					feature.n2SelectIntent = null;
					if( feature.layer ) {
						feature.layer.drawFeature(feature);
					};
				
					if( this.currentMode.onEndClick ) {
						this.currentMode.onEndClick(feature);
					};
				};
			};
		};

		if( this.clickedInfo.endFn ) {
			for(var i=0,e=this.clickedInfo.endFn.length; i<e; ++i) {
				//try{
				this.clickedInfo.endFn[i](); 
				//} catch(e){};
			};
		};

		this.clickedInfo.endFn = [];
		this.clickedInfo.features = [];
		this.clickedInfo.fids = {};
		this.clickedInfo.selectedId = null;
	}
	
	,_selectedFeatures: function(features, fids){
		if( this.currentMode !== this.modes.NAVIGATE ){
			this.switchMapMode(this.modes.NAVIGATE);
		};
		
		this._endClicked();
		
		this.clickedInfo.fids = {};
		if( fids ) {
			for(var i=0,e=fids.length; i<e; ++i){
				var fid = fids[i];
				
				this.clickedInfo.fids[fid] = { clicked: true };
				
				if( !this.clickedInfo.selectedId ){
					this.clickedInfo.selectedId = fid;
				};
			};
		};
		
		if( features ) {
			for(var i=0,e=features.length; i<e; ++i){
				var feature = features[i];

				this.clickedInfo.features.push(feature);

				feature.isClicked = true;
				if( feature.layer ) {
					feature.layer.drawFeature(feature);
				};
			};
		};
	}

	/**
	 * Add map selection to current selection.
	 */
	,_selectedFeaturesSupplement: function(opts){
		
		if( this.currentMode !== this.modes.NAVIGATE ){
			this.switchMapMode(this.modes.NAVIGATE);
		};
		
		if( opts.fid ) {
			this.clickedInfo.fids[opts.fid] = {
				clicked: true
			};
			if( opts.intent ){
				this.clickedInfo.fids[opts.fid].intent = opts.intent;
			};
		};
		
		if( opts.features ) {
			for(var i=0,e=opts.features.length; i<e; ++i){
				var f = opts.features[i];

				this.clickedInfo.features.push(f);

				f.isClicked = true;

				if( opts.intent ){
					f.n2SelectIntent = opts.intent;
				};
				
				if( f.layer ) {
					f.layer.drawFeature(f);
				};
			};
		};
	}

	/**
	 * Unselect the currently selected feature
	 */
   	,_unselectFeature: function(){
   		if( this.clickedInfo.selectedId ) {
   			this._dispatch({
   				type:'userUnselect'
   				,docId:this.clickedInfo.selectedId
   			});
   		};
   		
		this._endClicked();
   	}
	
	,_startHover: function(feature) {
		var layer = feature.layer;
   		if( feature && feature.cluster && feature.cluster.length == 1 ){
   			feature = feature.cluster[0];
   		};
   		
		// Check if anything is needed
		if( this.hoverInfo.feature === feature ) {
		 	// Nothing to do. This one is already the hover
		 	// feature.
		 	return;
		};
	
		// If a feature is still marked as "hovered", quit
		// it. This one is taking over.
		this._endHover();
		
		// Remember this new feature as "hovered"
		this.hoverInfo.feature = feature;

		// Perform mode specific hover actions
		if( this.currentMode.onStartHover ) {
			this.currentMode.onStartHover(feature, layer);
		};
	}
	
	,_endHover: function() {

		for(var i=0,e=this.hoverInfo.endFn.length; i<e; ++i) {
			//try{
			this.hoverInfo.endFn[i](); 
			//} catch(e){};
		};
		
		this.hoverInfo.feature = null;
		this.hoverInfo.endFn = [];
	}
	
	,_registerEndHoverFn: function(fn) {
		this.hoverInfo.endFn.push(fn);
	}

	,_startFocus: function(features, fid){
		this._endFocus();
		
		this.focusInfo.origin = fid;
		
		this._addFocus({
			features: features
			,fid: fid
			,origin: fid
		});
	}

	,_addFocus: function(opts){
		if( opts.origin && opts.origin !== this.focusInfo.origin ){
			// Ignore. Arrived too late.
			return;
		};
		
		this.focusInfo.fids[opts.fid] = true;
		
		for(var i=0,e=opts.features.length; i<e; ++i){
			var f = opts.features[i];
			if( f && !f.isHovered ) {
				f.isHovered = true;
				if( opts.intent ){
					f.n2HoverIntent = opts.intent;
				};
				if( f.layer ) f.layer.drawFeature(f);
				this.focusInfo.features.push( f );
			};
		};
	}
	
	,_endFocus: function() {
		for(var i=0,e=this.focusInfo.features.length;i<e;++i) {
			var feature = this.focusInfo.features[i];
			if( feature.isHovered ) {
				feature.isHovered = false;
				feature.n2HoverIntent = null;
				if( feature.layer ) feature.layer.drawFeature(feature);
			};
		};

		this.focusInfo.features = [];
		this.focusInfo.fids = {};
		this.focusInfo.origin = null;
	}
	
	,_startFindFeature: function(fid, features){
		this._endFindFeature();

		this.findFeatureInfo.fid = fid;
		this.findFeatureInfo.features = features;

		if( features ){
			for(var i=0,e=features.length; i<e; ++i){
				var f = features[i];
				if( f ){
					f.n2Intent = 'find';
					if( f.layer ) f.layer.drawFeature(f);
				};
			};
		};
	}
	
	,_endFindFeature: function(){
		
		for(var i=0,e=this.findFeatureInfo.features.length; i<e; ++i){
			var f = this.findFeatureInfo.features[i];
			if( f ) {
				f.n2Intent = null;
				if( f.layer ) f.layer.drawFeature(f);
			};
		};
		
		this.findFeatureInfo.fid = null;
		this.findFeatureInfo.features = [];
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
		this._endHover();
		this._endClicked();
	}

	,_hoverFeature: function(feature, layer) {
		if( null == feature ) {
			return;
		};
		if( null == layer ) {
			return;
		};
		
		var layerInfo = layer._layerInfo;
		if( null == layerInfo ) {
			return;
		};

		var dispatchService = this._getDispatchService();

		this._registerEndHoverFn(function(){
			dispatchService.send(DH, {
				type: 'userFocusOff'
				,docId: feature.fid
				,doc: feature.data
				,feature: feature
	 		});
		});

		dispatchService.send(DH, {
			type: 'userFocusOn'
			,docId: feature.fid
			,doc: feature.data
			,feature: feature
 		});
	}
	
	,_hoverFeaturePopup: function(feature, layer) {
		var _this = this;
		
		if( null == feature ) {
			return;
		};
		if( null == layer ) {
			return;
		};
	
		var layerInfo = layer._layerInfo;
		if( null == layerInfo ) {
			return;
		};
		
		var popupHtmlFn = layerInfo.featurePopupHtmlFn;
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
			if( _this.hoverInfo.feature ) {
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
	    	var popup = new OpenLayers.Popup.Anchored(
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
			_this._registerEndHoverFn(destroyCurrentPopup);
			
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
		var authService = this._getAuthService();
	    if( authService ) {
    		// The auth module is present, check if user logged in
			return authService.isLoggedIn();
    	} else {
    		// Authentication module is not loaded
    		return false;
    	};
	}
	
	,isUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		var authService = this._getAuthService();
	    if( authService ) {
			return authService.isUser();
    	} else {
    		return false;
    	};
	}
	
	,isAdminUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		var authService = this._getAuthService();
	    if( authService ) {
			return authService.isAdmin();
    	} else {
    		return false;
    	};
	}
	
	,isAnonymousUser: function() {
		if( !this.isLoggedIn() ) return false;
		
		var authService = this._getAuthService();
	    if( authService ) {
			return authService.isAnonymous();
    	} else {
    		return false;
    	};
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
    		var authService = this._getAuthService();
     		if( this.isAnonymousUser() 
     		 && authService
     		 && authService.autoAnonymousBehaviour() ) {
		    	showLogin = true;
     		};
    	};
    	
    	if( showLogin ) {
    		this.hideMapInteractionSwitch();
			this.switchMapMode(this.modes.NAVIGATE);
    	} else {
    		if( this.isUser() ) {
    			this.showMapInteractionSwitch();
    		};
    	};
    }
    	
    // === LOGIN STUFF END ========================================================
	
    // === MAP MODES START ========================================================
    
 	,createMapInteractionSwitch: function() {
 		var _this = this;
 		var mapInteractionButton = $('<input type="button" class="n2map_map_interaction_switch"/>')
 			.val(this.modes.NAVIGATE.buttonValue)
 			.click( function(evt) { 
 				_this._clickedMapInteractionSwitch(evt);
 			})
 			;
		$("#"+this.options.mapInteractionDivName)
			.empty()
			.append(mapInteractionButton);
	}
 	
 	,_getMapInteractionSwitch: function(){
 		return $("#"+this.options.mapInteractionDivName)
 			.find('.n2map_map_interaction_switch');
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
 		this._getMapInteractionSwitch().hide();
	}
	
	,showMapInteractionSwitch: function() {
 		this._getMapInteractionSwitch().show();
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
    		this.editFeatureFid = null;
    		this._removeGeometryEditor(true);
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.deactivateSelectFeatureControl();
    	};

    	// Apply new mode
    	this.currentMode = mode;
    	this._getMapInteractionSwitch().val(mode.buttonValue);
    	if( this.currentMode === this.modes.EDIT ) {
    		this.editLayer.events.register('featureadded', null, this.editModeAddFeatureCallback);
    		this.editLayer.events.register('beforefeaturesadded', null, this.convertToMultiGeometry);
    		this.activateControl( this.editControls.addPoints );
    		this.activateControl( this.editControls.toolbar );
    		this.activateControl( this.editControls.modifyFeature );
    		
    		this.activateSelectFeatureControl();
    		
    		if( this.editControls.toolbar 
    		 && this.editControls.toolbar.div ){
    			var $toolbar = $(this.editControls.toolbar.div);
    			$toolbar.find('.olControlNavigationItemActive').attr('title',_loc('Scroll Map'));
    			$toolbar.find('.olControlDrawFeaturePointItemInactive').attr('title',_loc('Add a point to the map'));
    			$toolbar.find('.olControlDrawFeaturePathItemInactive').attr('title',_loc('Add a line to the map'));
    			$toolbar.find('.olControlDrawFeaturePolygonItemInactive').attr('title',_loc('Add a polygon to the map'));
    			$toolbar.find('.olControlNunaliitGazetteerItemInactive').attr('title',_loc('Add a feature to the map based on a gazetteer service'));
    		};
            
    	} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
    		this.editFeatureFid = opts.fid;

    		var editFeature = opts.feature;
    		if( editFeature ) {
    			this._installGeometryEditor(editFeature);
    		};
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.activateSelectFeatureControl();
    	};
    }
    
    ,switchToEditMode: function() {
    	var _this = this;
    	
    	var authService = this._getAuthService();
    	if( authService ) {
    		var logInRequired = true;
    		
    		// The auth module is present, check if user logged in
    		// and is not anonymous
    		var userNotAnonymous = authService.userLoggedInAndNotAnonymous();
    		if( userNotAnonymous ) {
    			logInRequired = false;
    		};
    		
    		if( logInRequired ) {
    			// User is not logged in
    			authService.showLoginForm({
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
    
    ,switchToEditFeatureMode: function(fid, feature) {
    	this.switchMapMode(this.modes.EDIT_FEATURE,{
    		fid: fid
    		,feature: feature
    	});
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
			}
		});
	}
    
	,onAttributeFormUpdated: function(fid, feature) {
		// This is an update
		var fid = feature.fid;
		this.fidUpdated(fid);
		var filter = $n2.olFilter.fromFid(fid);
		this._reloadFeature(filter);
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
		
		var selectWindow = null;
		if( placeId ) {
			this.insertSound();
			
			selectWindow = $('<div class="selectMedia" style="z-index:3005"></div>');
			
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
				this._removeFeature(msg.data.fid);
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
	
	,_createStyleMap: function(styleOptions) {
	
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
	
	,_createStyleMapFromLayerInfo: function(layerInfo) {
	
		var styleOptions = null;
		if( layerInfo && layerInfo.styleMap ) {
			styleOptions = layerInfo.styleMap;
		};
		return this._createStyleMap(styleOptions);
	}
	
	,_createEffectiveStyleMap: function(layerInfo) {
	
		var _this = this;
		
		// The caller can specify a style map in multiple ways:
		// 1. provide a style map function (layerInfo.styleMapFn)
		// 2. provide a style extension (layerInfo.styleMapFn === _createStyleMapFromLayerInfo)
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
			innerStyleMap = this._createStyleMap();
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
			
			jQuerySet.children().each(function(i,elem){ disableAll($(elem), flag); });
		};
		
		return false; 
	}

    // === STYLE MAP STUFF END ========================================================

	// === START -- LAYER MANAGEMENT ========================================================

	// Legacy method
	,createLayerFromOptions: function(opt_) {
		var _this = this;
		
		var cs = this._getCustomService();
		
		var layerInfo = $.extend({}, this.defaultLayerInfo, opt_);
		
		// Popup function
		if( !layerInfo.featurePopupHtmlFn ){
			if( cs ){
				var cb = cs.getOption('mapFeaturePopupCallback');
				if( typeof cb === 'function' ) {
					layerInfo.featurePopupHtmlFn = cb;
				};
			};
		};
		if( !layerInfo.featurePopupHtmlFn ){
			layerInfo.featurePopupHtmlFn = $n2.mapAndControls.DefaultPopupHtmlFunction;
		};

		layerInfo.typename = layerInfo.featurePrefix + ':' + layerInfo.featureType;
		layerInfo.schema = layerInfo.wfsUrl 
			+ '?service=WFS&version=' + layerInfo.wfsVersion 
			+ '&request=DescribeFeatureType&typeName=' + layerInfo.typename;
		
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
		var layerStyleMap = this._createEffectiveStyleMap(layerInfo);
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
		
		if( !layerOptions.strategies ){
			layerOptions.strategies = [];
		}
		layerOptions.strategies.push( new OpenLayers.Strategy.NunaliitLayerSorting() );
		
		//layerOptions.renderers = ['Canvas','SVG','VML'];
		layerOptions.renderers = ['SVG','VML'];

		layerInfo.olLayer = new OpenLayers.Layer.Vector(layerInfo.name, layerOptions);

		// Add events to layer
		this._registerLayerForEvents(layerInfo);

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
	
	,addLayer: function(layerDefinition, isBaseLayer) {
		var olLayer = this._createOLLayerFromDefinition(layerDefinition, isBaseLayer);
		this.map.addLayer( olLayer );
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
		
		// The callbacks defined below are passed to an internal instance
		// of Feature handler
		var navHighlightOptions = {
			hover: true
			,callbacks: {
//	            click: function(feature) {
//					_this._startClicked(feature, false);
//				}
//	            ,clickout: function(){
//					_this._unselectFeature();
//				}
//	            ,over: function(feature){ 
//					_this._startHover(feature); 
//				}
//	            ,out: function(){ 
//					_this._endHover(); 
//				}
			}
		};
		this.selectFeatureControl = new OpenLayers.Control.SelectFeature(
			this.vectorLayers
			,navHighlightOptions
		);

		// Overwrite the feature handler used by SelectFeature control
		// This is necessary until fixes are ported to OpenLayers.Handler.Feature
		this.selectFeatureControl.handlers.feature = new OpenLayers.Handler.NunaliitFeature(
			{} // null generates an error
			,this.selectFeatureControl.layer
			,{
	            click: function(feature) {
					_this._startClicked(feature, false);
				}
	            ,clickout: function(feature){
					_this._unselectFeature();
				}
	            ,over: function(feature){ 
					_this._startHover(feature); 
				}
	            ,out: function(feature){ 
					_this._endHover(); 
				}
			}
			,{
				geometryTypes: this.selectFeatureControl.geometryTypes
			}
	    );

		this.map.addControl(this.selectFeatureControl);
		this.selectFeatureControl.activate();
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
			alert('redefineFeatureLayerStylesAndRules: unknown layer name: ' + layerName);
		} else {
    		//this._endClicked();
    		layerInfo.olLayer.redraw();    			
		};
	}
	
	,recentreMap: function (ll) { // @param ll OpenLayers LonLat in map projection for centre of map
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	}
	
	/*
	 * Returns map to initial bounds/extent
	 */
	,resetExtent: function(){
		if( this.initialZoomBounds ){
			this.map.zoomToExtent(this.initialZoomBounds);
		};
	}
	
	,setInitialExtent: function(bounds, srsName, reset) {

		var initialExt = new OpenLayers.Bounds(bounds[0], bounds[1], bounds[2], bounds[3]);
	
		if( null != srsName ) {
			this.convertBoundsToMapProjection(initialExt, srsName);
		};
	
		this.initialZoomBounds = initialExt;
		
		if( reset ){
			this.resetExtent();
		};
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
	 *                 the first is the browser event; the second is the instance of
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
				// Make a copy for the caller
				return $n2.extend(true,{},valueMap[id]);
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
				if( feature.fid ) {
					valueMap[feature.fid] = feature.data;
				};
				if( feature.cluster ){
					for(var j=0,k=feature.cluster.length;j<k;++j){
						var cf = feature.cluster[j];
						if( cf.fid ){
							valueMap[cf.fid] = cf.data;
						};
					};
				};
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
	
	,_getAuthService: function(){
		var auth = null;
		
		if( this.options.directory ) {
			auth = this.options.directory.authService;
		};
		
		return auth;
	}
	
	,_getCustomService: function(){
		var cs = null;
		
		if( this.options.directory ) {
			cs = this.options.directory.customService;
		};
		
		return cs;
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
			dispatcher.send(DH,m);
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

			dispatcher.register(DH,event,fn);
		};
	}
	
	,_handleDispatch: function(m){
		var type = m.type;
		if( 'documentVersion' === type ) {
			this._cacheUpdateDocumentVersion(m.docId,m.rev);
			
		} else if( 'documentDeleted' === type ) {
			this._removeFeature(m.docId);

		} else if( 'cacheRetrieveDocument' === type ) {
			var doc = this._retrieveCachedValue(m.docId);
			if( doc ){
				m.doc = doc;
			};
			
		} else if( 'featureCreated' === type ) {
			var doc = m.doc;
			
			// Compute map of layer ids
			var layerIdMap = {};
			if( doc && doc.nunaliit_layers ){
				for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i){
					layerIdMap[ doc.nunaliit_layers[i] ] = true;
				};
			};
			
			// Check added to layer
			for(var i=0,e=this.infoLayers.length; i<e; ++i) {
				var infoLayer = this.infoLayers[i];
				var layerId = infoLayer.id;
				if( layerIdMap[layerId] ){
					var feature = this._getLayerFeatureIncludingFid(infoLayer.olLayer,doc._id);
					var mustLoad = true;
					if( feature && feature.data ){
						if( feature.data._rev === doc._rev ){
							// Feature already present
							mustLoad = false;
						};
					};
					
					if( mustLoad ) {
						// This feature belongs on this layer. Load it.
						var filter = $n2.olFilter.fromFid(m.docId);
						this._loadFeatureOnLayer(infoLayer, filter);
					};
				};
			};
			
		} else if( 'featureUpdated' === type ) {
			var doc = m.doc;

			// Compute map of layer ids
			var layerIdMap = {};
			if( doc && doc.nunaliit_layers ){
				for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i){
					layerIdMap[ doc.nunaliit_layers[i] ] = true;
				};
			};
			
			// Check removed from layer
			for(var i=0,e=this.infoLayers.length; i<e; ++i) {
				var infoLayer = this.infoLayers[i];
				var layerId = infoLayer.id;
				if( !layerIdMap[layerId] ){
					// This feature does not belong on this layer. If
					// this feature id is found on the layer, then remove
					// it (it was removed from layer)
					var feature = this._getLayerFeatureIncludingFid(infoLayer.olLayer,doc._id);
					if( feature ) {
						var featuresToAdd = null;
						if( feature.cluster ){
							for(var j=0,k=feature.cluster.length; j<k; ++j){
								var cf = feature.cluster[j];
								if( cf.fid !== doc._id ){
									if( !featuresToAdd ) featuresToAdd= [];
									featuresToAdd.push(cf);
								};
							};
						};
						
						// Remove features
						infoLayer.olLayer.destroyFeatures(feature);
						
						// If cluster, add back 
						if( featuresToAdd ){
							infoLayer.olLayer.addFeatures(featuresToAdd);
						};
					};
				};
			};
			
			// Check updated on layer
			for(var i=0,e=this.infoLayers.length; i<e; ++i) {
				var infoLayer = this.infoLayers[i];
				var layerId = infoLayer.id;
				if( layerIdMap[layerId] ){
					var mustUpdate = true;
					if( doc && doc._rev ){
						var feature = this._getLayerFeatureIncludingFid(infoLayer.olLayer,doc._id);
						if( feature 
						 && feature.fid === doc._id 
						 && feature.data 
						 && feature.data._rev === doc._rev ){
							// Feature is present and revision is already
							// up to date. No need to update
							mustUpdate = false;
							
						} else if( feature && feature.cluster ){
							for(var j=0,k=feature.cluster.length; j<k; ++j){
								var cf = feature.cluster[j];
								if( cf 
								 && cf.fid === doc._id 
								 && cf.data 
								 && cf.data._rev === doc._rev ){
									mustUpdate = false;
								};
							};
						};
					};
					
					if( mustUpdate ) {
						// This feature belongs on this layer. Update it.
						// This takes care if geometry was modified or if feature
						// was recently added to the layer.
						var filter = $n2.olFilter.fromFid(m.docId);
						this._loadFeatureOnLayer(infoLayer, filter);
					};
				};
			};
			
		} else if( 'addLayerToMap' === type ) {
			this._handleAddLayerToMap(m);
			
		} else if( 'selected' === type ) {
			if( m.docId ) {
				var features = this._getMapFeaturesIncludingFid(m.docId);
				this._selectedFeatures(features, [m.docId]);
				
			} else if( m.docIds ) {
				var features = [];
				for(var i=0,e=m.docIds.length; i<e; ++i){
					var feats = this._getMapFeaturesIncludingFid(m.docIds[i]);
					for(var j=0,k=feats.length; j<k; ++j){
						var f = feats[j];
						if( features.indexOf(f) < 0 ){
							features.push(f);
						};
					};
				};
				this._selectedFeatures(features, m.docIds);
			};
			
		} else if( 'selectedSupplement' === type ) {
			var fid = m.docId;
			if( fid ) {
				var features = this._getMapFeaturesIncludingFid(fid);
				this._selectedFeaturesSupplement({
					fid: fid
					,features: features
					,intent: m.intent
				});
			};
			
		} else if( 'unselected' === type ) {
			this._endClicked();
			
		} else if( 'focusOn' === type ) {
			var fid = m.docId;

			var features = this._getMapFeaturesIncludingFid(fid);
			this._startFocus(features,fid);
			
		} else if( 'focusOff' === type ) {
			this._endFocus();
			
		} else if( 'focusOnSupplement' === type ) {
			var fid = m.docId;
			if( fid ) {
				var features = this._getMapFeaturesIncludingFid(fid);
				this._addFocus({
					fid: fid
					,features: features
					,intent: m.intent
					,origin: m.origin
				});
			};
			
		} else if( 'findOnMap' === type ) {
			this._centerMapOnXY(m.x, m.y, m.srsName);
			var fid = m.fid;
			var features = this._getMapFeaturesIncludingFid(fid);
			this._startFindFeature(fid, features);
			
		} else if( 'searchInitiate' === type ) {
			this._endClicked();
			
		} else if( 'editInitiate' === type ) {
			var fid = m.docId;
			if( fid ){
				var features = this._getMapFeaturesIncludingFid(fid);
				
				var feature = null;
				if( features.length > 0 ){
					feature = features[0];
				};
				
				if( feature ) {
					this._centerMapOnFeature(feature);
				} else {
					// must center map on feature, if feature contains
					// a geometry
					if( m.doc 
					 && m.doc.nunaliit_geom 
					 && m.doc.nunaliit_geom.bbox 
					 && m.doc.nunaliit_geom.bbox.length >= 4 ) {
						var bbox = m.doc.nunaliit_geom.bbox;
						var x = (bbox[0] + bbox[2]) / 2;
						var y = (bbox[1] + bbox[3]) / 2;
						this._centerMapOnXY(x, y, 'EPSG:4326');
					};
				};
				
				this.switchToEditFeatureMode(fid, feature);
			};
			
		} else if( 'editCancel' === type ) {
			if( this.currentMode === this.modes.EDIT_FEATURE ){
				// Indicate that this modification is cancelled 
				if( this.editFeatureControls.modifyFeatureGeometry ) {
	    			var editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
		    		if( editFeature && editFeature._n2Original ) {
		    			editFeature._n2Original.restoreGeom = true;
		    		};
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
					var features = this._getMapFeaturesIncludingFid(docId);
					this._selectedFeatures(features, [docId]);
				};
			};
			
		} else if( 'editGeometryModified' === type ) {
			if( m._origin !== this ){
				this._geometryModified(m.docId, m.geom, m.proj);
			};
			
		} else if( 'mapRedrawLayer' === type ) {
			var layerId = m.layerId;
			this.redefineFeatureLayerStylesAndRules(layerId);
			
		} else if( 'mapSetInitialExtent' === type ) {
			var extent = m.extent;
			var srsName = m.srsName;
			var reset = m.reset;
			this.setInitialExtent(extent, srsName, reset);
			
		} else if( 'mapSetExtent' === type ) {
			var extent = m.extent;
			var srsName = m.srsName;
			this.setNewExtent(extent, srsName);
			
		} else if( 'mapResetExtent' === type ) {
			this.resetExtent();
			
		} else if( 'mapGetLayers' === type ) {
			// Synchronous call. Response sent on message.
			if( !m.layers ){
				m.layers = {};
			};
			for(var i=0,e=this.infoLayers.length; i<e; ++i) {
				var infoLayer = this.infoLayers[i];
				var layerId = infoLayer.id;
				var olLayer = infoLayer.olLayer;

				var report = m.layers[layerId];
				if( !report ){
					report = {
						id: layerId
					};
					m.layers[layerId] = report;
				};
				
				if( olLayer && olLayer.visibility ) {
					report.visible = true;
				};
			};
		} else if( 'setMapLayerVisibility' === type ) {
			var layerId = m.layerId;
			var visible = m.visible;
			
			if( this.layers[layerId] ){
				this.layers[layerId].setVisibility(visible);
			};
		};
	}
	
	,_handleAddLayerToMap: function(m){
		var layerDef = m.layer;
		var isBaseLayer = false;
		if( typeof(m.isBaseLayer) !== 'undefined' ){
			isBaseLayer = m.isBaseLayer;
		};
		
		var olLayer = this.findLayerFromId(layerDef.id);
		if( !olLayer ) {
			this.addLayer(layerDef,isBaseLayer);
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
$n2.mapAndControls.BasicPopupHtmlFunction = basicPopupHtmlFunction;
$n2.mapAndControls.SuppressPopupHtmlFunction = suppressPopupHtmlFunction;

// Cluster click callback
$n2.mapAndControls.ZoomInClusterClickCallback = zoomInClusterClickCallback;
$n2.mapAndControls.MultiSelectClusterClickCallback = multiSelectClusterClickCallback;

})(jQuery,nunaliit2);
