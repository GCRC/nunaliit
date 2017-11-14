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

*/

;(function($,$n2){
"use strict";

	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
	var DH = 'n2.mapAndControls';

// **************************************************
// Generic bridge between document model and map
var MapBridge = $n2.Class({

    sourceModelId: null,
    
    dispatchService: null,
    
    mapControl: null,
    
    initialize: function (opts_) {
        var opts = $n2.extend({
            dispatchService: null
            
            // From configuration object
            ,sourceModelId: null
        }, opts_);

        var _this = this;
        
        this.sourceModelId = opts.sourceModelId;
        this.dispatchService = opts.dispatchService;

        // Register to events
        if( this.dispatchService ) {
            var f = function (m, addr, dispatcher){
                _this._handle (m, addr, dispatcher);
            };
            this.dispatchService.register(DH, 'modelStateUpdated', f);
            this.dispatchService.register(DH, 'reportModuleDisplay', f);
            this.dispatchService.register(DH, 'mapInitialized', f);
            this.dispatchService.register(DH, 'start', f);
            
            if( this.sourceModelId ){
                // Initialize state
                var m = {
                    type:'modelGetState'
                    ,modelId: this.sourceModelId
                };
                this.dispatchService.synchronousCall(DH, m);
                if (m.state) {
                    this._sourceModelUpdated(m.state);
                };
            };
        };
    },
    
    _handle: function (m, addr, dispatcher) {
    	if( 'modelStateUpdated' === m.type ) {
            // Does it come from one of our sources?
            if (this.sourceModelId === m.modelId) {
                this._sourceModelUpdated(m.state);

                // Redraw map
            	this._updateMap();
            };

    	} else if( 'reportModuleDisplay' === m.type ) {
    		if( m.moduleDisplay 
    		 && m.moduleDisplay.mapControl 
    		 && !this.mapControl ){
    			this.mapControl = m.moduleDisplay.mapControl;
            	this._updateMap();
    		};

    	} else if( 'mapInitialized' === m.type ) {
    		if( m.mapControl 
    		 && !this.mapControl ){
    			this.mapControl = m.mapControl;
            	this._updateMap();
    		};

    	} else if( 'start' === m.type ) {
            this._updateMap();
        };
    },
    
    _sourceModelUpdated: function(sourceState) {
    	throw 'Subclasses must implement _sourceModelUpdated()'
    },
    
    /**
     * Returns array of document ids that are currently visible
     */
    _getVisibleDocumentIds: function(){
    	throw new Error('Subclasses must implement _getVisibleDocumentIds()');
    },
    
    _updateMap: function() {
        var mapControl = this._getMapControl();
        if( mapControl 
         && mapControl.infoLayers ){
        	var visibleDocIds = this._getVisibleDocumentIds();
        	
        	// Iterate over all layers
    		for(var loop=0; loop<mapControl.infoLayers.length; ++loop) {
    			var layerInfo = mapControl.infoLayers[loop];
                
                // Interested only in vector layers
                if( layerInfo 
                 && layerInfo.featureStrategy ) {
                	layerInfo.featureStrategy.setWhiteListDocumentIds(visibleDocIds);
                };
            };
        };
    },
    
    _getMapControl: function(){
    	var _this = this;
    	
    	return this.mapControl;
    }
});

var TimeTransformMapBridge = $n2.Class(MapBridge, {

    docStateById: null,

    initialize: function (opts_) {
        var opts = $n2.extend({
            dispatchService: null
            
            // From configuration object
            ,sourceModelId: null
        }, opts_);

        this.docStateById = {};
        
        MapBridge.prototype.initialize.apply(this, arguments);

        $n2.log('timeTransformToMapAndControlBridge', this);
    },
    
    _sourceModelUpdated: function(sourceState) {
    	var _this = this;
    	
        // Update the nodes according to changes in source model
    	if( sourceState ){
    		if( sourceState.added && sourceState.added.length ){
    			for(var i=0,e=sourceState.added.length; i<e; ++i){
    				var doc = sourceState.added[i];
    				updateDoc(doc);
    			};
    		};

    		if( sourceState.updated && sourceState.updated.length ){
    			for(var i=0,e=sourceState.updated.length; i<e; ++i){
    				var doc = sourceState.updated[i];
    				updateDoc(doc);
    			};
    		};

    		if( sourceState.removed && sourceState.removed.length ){
    			for(var i=0,e=sourceState.removed.length; i<e; ++i){
    				var doc = sourceState.removed[i];
    				var docId = doc._id;
    				if( this.docStateById[docId] ){
    					delete this.docStateById[docId];
    				};
    			};
    		};
    	};
    	
    	function updateDoc(doc){
    		var docId = doc._id;
    		
    		if( doc._n2TimeTransform ){
    			if( !_this.docStateById[docId] ){
    				_this.docStateById[docId] = {};
    			};
    			
    			if( doc._n2TimeTransform.intervalSize <= 0 ){
    				// The document does not contain any time intervals. By default,
    				// show
    				_this.docStateById[docId].visible = true;
    			} else {
        			_this.docStateById[docId].visible = doc._n2TimeTransform.intersects;
    			};
    			
    		} else if( _this.docStateById[docId] ){
    			delete _this.docStateById[docId];
    		}
    	};
    },
    
    _getVisibleDocumentIds: function(){
    	var docIds = [];
    	for(var docId in this.docStateById){
    		if( this.docStateById[docId].visible ){
    			docIds.push(docId);
    		};
    	};
    	return docIds;
    }
});

var ModelMapBridge = $n2.Class(MapBridge, {

    docStateById: null,

    initialize: function (opts_) {
        var opts = $n2.extend({
            dispatchService: null
            
            // From configuration object
            ,sourceModelId: null
        }, opts_);

        this.docStateById = {};
        
        MapBridge.prototype.initialize.apply(this, arguments);

        $n2.log('modelToMapAndControlBridge', this);
    },
    
    _sourceModelUpdated: function(sourceState) {
    	var _this = this;
    	
        // Update the nodes according to changes in source model
    	if( sourceState ){
    		if( sourceState.added && sourceState.added.length ){
    			for(var i=0,e=sourceState.added.length; i<e; ++i){
    				var doc = sourceState.added[i];
    				var docId = doc._id;
    				this.docStateById[docId] = true;
    			};
    		};

    		if( sourceState.updated && sourceState.updated.length ){
    			for(var i=0,e=sourceState.updated.length; i<e; ++i){
    				var doc = sourceState.updated[i];
    				var docId = doc._id;
    				this.docStateById[docId] = true;
    			};
    		};

    		if( sourceState.removed && sourceState.removed.length ){
    			for(var i=0,e=sourceState.removed.length; i<e; ++i){
    				var doc = sourceState.removed[i];
    				var docId = doc._id;
    				if( this.docStateById[docId] ){
    					delete this.docStateById[docId];
    				};
    			};
    		};
    	};
    },
    
    _getVisibleDocumentIds: function(){
    	var docIds = [];
    	for(var docId in this.docStateById){
   			docIds.push(docId);
    	};
    	return docIds;
    }
});

function HandleWidgetAvailableRequests(m){
    if( m.widgetType === 'timeTransformToMapAndControlBridge' ){
        m.isAvailable = true;
    } else if( m.widgetType === 'modelToMapAndControlBridge' ){
        m.isAvailable = true;
    };
};

function HandleWidgetDisplayRequests(m){
    if( m.widgetType === 'timeTransformToMapAndControlBridge' ){
        var options = {};
        
        if( m.widgetOptions ) {
        	for(var key in m.widgetOptions){
        		options[key] = m.widgetOptions[key];
        	};
        };
        
        if( m.config ){
            if( m.config.directory ){
            	options.dispatchService = m.config.directory.dispatchService;
            };
        };
        
        new TimeTransformMapBridge(options);

    } else if( m.widgetType === 'modelToMapAndControlBridge' ){
        var options = {};
        
        if( m.widgetOptions ) {
        	for(var key in m.widgetOptions){
        		options[key] = m.widgetOptions[key];
        	};
        };
        
        if( m.config ){
            if( m.config.directory ){
            	options.dispatchService = m.config.directory.dispatchService;
            };
        };
        
        new ModelMapBridge(options);
    };
};

//**************************************************
var GazetteerProcess = $n2.Class({
	
	geoNamesService: null,
	
	inputId: null,
	
	initialize: function(geoNamesService_){
		this.geoNamesService = geoNamesService_;
	},

	initiateCapture: function(mapControl){
		var _this = this;
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div></div>')
			.attr('id',dialogId)
			.addClass('n2MapAndControls_gazette_dialog');
		
		this.inputId = $n2.getUniqueId();
		$('<div><input id="'+this.inputId+'" type="text"/></div>')
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
		
		var $input = $('#'+this.inputId);
		
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
			
			var $input = $('#'+_this.inputId);
			if( key === 13 ) {
				var val = $input.val();
				
				if( $input.autocomplete ){
					$input.autocomplete('close');
					$input.autocomplete('option','disabled',true);
				};

				request.name = val;
				
				_this._searchForName(request);
			} else {
				if( $input.autocomplete ){
					$input.autocomplete('option','disabled',false);
				};
			};
			
			return true;
		});
		
		// Get centre of map to find biased country
		this._findCurrentLocation(request);
	},
	
	_searchForName: function(request){
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
	},
	
	_installOnClick: function(request, $entry, entry){
		var _this = this;
		
		$entry.click(function(){
			_this._selectEntry(request, entry);
		});
	},
	
	_selectEntry: function(request, entry){
		var $dialog = $('#'+request.dialogId);
		$dialog.dialog('close');
		
		var editLayer = request.mapControl.editLayer;
		var map = request.mapControl.map;
		
		var geom = new OpenLayers.Geometry.Point(1 * entry.lng, 1 * entry.lat);

		// Reproject geometry
		var mapProjection = map.getProjectionObject();
		var gazetteProjection = new OpenLayers.Projection('EPSG:4326');
		if( gazetteProjection.getCode() != mapProjection.getCode() ) {
			geom.transform(gazetteProjection, mapProjection);
		};
		
		// Center map on geometry
		var ll = new OpenLayers.LonLat(geom.x, geom.y);
		map.setCenter(ll);

		// Create and add feature
		var feature = new OpenLayers.Feature.Vector(geom);
		
		feature.data.nunaliit_gazetteer = {};
		for(var key in entry){
			var value = entry[key];
			feature.data.nunaliit_gazetteer[key] = value;
		};
		
		editLayer.addFeatures([feature]);
	},
	
	_findCurrentLocation: function(request){
		var map = request.mapControl.map;
		var ll = map.getCenter();
		if( ll ) {
			// Reproject geometry
			var mapProjection = map.getProjectionObject();
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
var LayerInfo = $n2.Class({

	customService: null,
	
	id: null,
	
	type: null,
	
	options: null,

	sourceSrsName: null,
	
	sourceProjection: null,
		
	featurePrefix: null,

	featureType: null,
	
	featureNS: null,
	
	name: null,
	
	filter: null,
	
	featurePopupHtmlFn: null,

	featurePopupDelay: null,

	visibility: null,
	
	styleMapFn: null,

	styleMap: null,

	selectListener: null,
	
	clusterClickCallback: null,
	
	// Options relating to clustering process
	clustering: null,

	// Boolean
	useHoverSound: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			customService: null,
			
			// Type of layer: 'couchdb', 'wfs', ...
			type: null,

			// Options related ot type
			options: null,
			
			// String to identify this layer among others
			id: null,
			
			 /*
			  * sourceSrsName: default source projection of WFS feature data - Geoserver can reproject but cannot
			  * handle a bbox param on a GetFeature in reprojected coordinates.  This is used to tell the atlas 
			  * what coordinates to use when request the vector layer features.
			  */
			sourceSrsName: 'EPSG:4326',
			
			// featurePrefix and featureType jointly form the WFS typename for this layer but because we now
			// use filtering on layers, this typename (featurePrefix:featureType) is not unique.
			featurePrefix: null,
			featureType: null,
			
			// Full name space associated with prefix
			featureNS: null,
			
			// name should be unique - doesn't have to be but this is used in the layer switcher so
			// the map designer should be selecting something to differentiate ... this is used for
			// regenerating a specific layers style map.
			name: null,
			
			// filter for selection of features from the WFS layer
			filter: null,
			
			featurePopupHtmlFn: null,
			featurePopupDelay: 0,
			visibility: true,
			
			// Style Map fn - returns an OpenLayers style map to be installed
			// on the layer.  
			//
			// If not specified, a style map based on a defaults and extended
			// using the property 'styleMap' is created.
			styleMapFn: null,

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
			styleMap: null,

			selectListener: function(isSelected, layerInfo){},
			
			// This is the function called back when a cluster with
			// more than one feature is clicked
			clusterClickCallback: null,
			
			clustering: null,
			
			useHoverSound: false
			
		},opts_);
		
		var _this = this;

		this.id = opts.id;
		this.type = opts.type;
		this.options = opts.options;
		this.customService = opts.customService;
		this.sourceSrsName = opts.sourceSrsName;
		this.featurePrefix = opts.featurePrefix;
		this.featureType = opts.featureType;
		this.featureNS = opts.featureNS;
		this.name = opts.name;
		this.filter = opts.filter;
		this.featurePopupHtmlFn = opts.featurePopupHtmlFn;
		this.featurePopupDelay = opts.featurePopupDelay;
		this.visibility = opts.visibility;
		this.styleMapFn = opts.styleMapFn;
		this.styleMap = opts.styleMap;
		this.selectListener = opts.selectListener;
		this.clusterClickCallback = opts.clusterClickCallback;
		this.clustering = opts.clustering;
		this.useHoverSound = opts.useHoverSound;

		// Derive database projection from name
		if( this.sourceSrsName ){
			this.sourceProjection = new OpenLayers.Projection(this.sourceSrsName);
		};

		// Localize name
		if( this.name ){
			this.name = _loc(this.name);
		};

		// Popup function
		if( !this.featurePopupHtmlFn ){
			if( this.customService ){
				var cb = this.customService.getOption('mapFeaturePopupCallback');
				if( typeof cb === 'function' ) {
					this.featurePopupHtmlFn = cb;
				};
			};
		};
		if( !this.featurePopupHtmlFn ){
			this.featurePopupHtmlFn = $n2.mapAndControls.DefaultPopupHtmlFunction;
		};
		
		// Cluster click callback
		if( !this.clusterClickCallback ){
			if( this.customService ){
				var cb = this.customService.getOption('mapClusterClickCallback');
				if( typeof cb === 'function' ) {
					this.clusterClickCallback = cb;
				};
			};
		};
		if( !this.clusterClickCallback ){
			this.clusterClickCallback = $n2.mapAndControls.ZoomInClusterClickCallback;
		};
	},
	
	forEachFeature: function(callback){
		if( typeof callback === 'function'
		 && this.olLayer 
		 && this.olLayer.features ){
			for(var i=0,e=this.olLayer.features.length; i<e; ++i){
				var feature = this.olLayer.features[i];
				if( feature.cluster ){
					for(var j=0,k=feature.cluster; j<k; ++j){
						var cf = feature.cluster[j];
						callback.call(this,cf,feature);
					};
				} else {
					callback.call(this,feature);
				};
			};
		};
	},
	
	accumulateMapStylesInUse: function(stylesInUse){
		// Loop over drawn features (do not iterate in clusters)
		if( this.olLayer 
		 && this.olLayer.features ){
			for(var i=0,e=this.olLayer.features.length; i<e; ++i){
				var feature = this.olLayer.features[i];
				if( feature._n2Style 
				 && typeof feature._n2Style.id === 'string'){
					var style = feature._n2Style;
					
					var styleInfo = stylesInUse[style.id];
					if( !styleInfo ){
						styleInfo = {
							style: style
						};
						stylesInUse[style.id] = styleInfo;
					};
					
					var geometryType = feature.n2_geometry;
					if( geometryType && !styleInfo[geometryType] ){
						styleInfo[geometryType] = feature;
					};
				};
			};
		};
	}
});


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
    	
    	{Object} mapCoordinateSpecifications
    	Optional specification of map coordinate parameters, including:
    	- srsName: the coordinate system in which these parameters are expressed.
		- maxExtent: maximum geographical extent of the map - an array [ minX, minY, maxX, maxY ]
		- initialBounds: initially displayed map extent - an array [ minX, minY, maxX, maxY ]
		- useForMapControls: true => use projection specified by above srsName for map
		  controls (mouse position, etc.).

    	{Object} mapDisplay
    	Option specification of the map display (projection, resolution, background layers, units, optional display handler hook)
    
		{Boolean} addPointsOnly=false
    	If true, editing the map can only add points.
	
		{Object} scaleLine
    	Defines properties for the scale line control

		{Boolean} enableWheelZoom=false
    	If true, mouse wheel zooms in and out.
    
    	{Object} placeDisplay
    	Options for the display handler.
    
    	{Object} background
    	Options for the display of background layers.

		{Object} saveFeature
    	Defines how features are saved via the editing interface. Or, instance of editor.
    
		{String} sidePanelName='side' 
    	Identifier of the &lt;div&gt; element where the textual display should be rendered.
    
		{String} filterPanelName
    	Identifier of the &lt;div&gt; element where local map filters should be displayed.
		If not specified (null), then local map filtering is disabled.
    
		{Boolean} toggleClick=true 
    	If set, then clicking on a feature in a clicked 'state' turns off
		the clicking state. When turning off this way, the event 'unselected' is
		dispatched. If reset, clicking on a feature multiple
		times is ignored.
    
		{String} uniqueIdentifier='place_id'
		Name of the feature attribute which uniquely identifies the feature.
		This is important to coordinate all the map extensions. It defaults to 'place_id'
		for legacy reasons.
    
    	{Object} dbSearchEngine
		Options to configure the database search engine (@link nunaliit2#dbSearchEngine). 
    
    	{Object} contributionDb
		Options to configure the contribution database.
    
    	{Array} layerInfo
		Object or Array of Objects. Each object represents the options for one displayed layer.
    
    	{String} layerInfo.sourceSrsName
		Projection name used in WFS requests. Defaults to 'EPSG:4326'
    
    	{Number} layerInfo.displayInLayerSwitcher
		Show layer in Layer Switcher (true, default) or hide layer in switcher (true).
		Applied in WMS layers only.
    
    	{String} layerInfo.featurePrefix
		Short name used in WFS request as 'namespace' or 'workspace'.
    
		{String} layerInfo.featureType
		Name used in WFS request to identify a particular layer. 
    
		{String} layerInfo.featureNS
		Full namespace for layer used in WFS requests.
    
		{String} layerInfo.name
		Label by which layer should be referred to.
    
    	{Object} layerInfo.filter
		Null if not used. Null by default. This is a JSON object
		that represents a filter for the layer. If specified,
		the filter is sent during WFS requests. Syntax for
		filters is defined by nunaliit2.CreateOpenLayersFilter().
    
		{Function} layerInfo.featurePopupHtmlFn
		Function called when a feature pop up is displayed. This function
		is called with an object contain the feature being hovered and
		a call back function (onSuccess). The onSuccess callback should
		be called with the generated HTML when it is available. If no
		popup should be created for this feature, then onSuccess should not
		be called. By default this option is null and popups are not
		generated.
    	
    	{Number} layerInfo.featurePopupDelay
		Amount of time, in milliseconds, that should elapse between the
		time a user hovers a feature and the time the popup is generated for it.
		Defaults to 0.
    
    	{Number} layerInfo.gutter
		Extra sapce, specified in pixels, to add around images fetched from WMS.
		Useful for WMS labelling in use with tiled service.
    
		{Boolean} layerInfo.visibility=true
		If set, the layer is initially visible. If false, the layer is
 		initially turned off.
    
		{Function} layerInfo.styleMapFn
		Function called to retrieve a style map for the layer.
		If not specified, a style map based on defaults and extended using
		the property 'styleMap' is built.
    
    	{Object} layerInfo.styleMap
		Options to override default styles for a layer. If property
		'styleMapFn' is specified, then this property is probably ignored.
    
		{Function} layerInfo.selectListener
		This function is called when the visibility of a layer
		is changed. Protoype is: function(isSelected, layerInfo)

    @returns {Object} Map of function that can be called
                      to control the behaviour of the 
                      atlas after it is created.
 */

var MapAndControls = $n2.Class({
	
	options: null,
	dbSearchEngine: null,
	contributionDb: null,
	mapId: null,
	map: null,
	editLayer: null,
	html: null,
 	lastMapXy: null,
 	mapMouseMoveListeners: null,
	olkitDisplayOptions: null,
	pendingMarkInfo: null,
	currentPopup: null,
	dhtmlSoundDivId: null,
	initialZoomBounds: null,

    // HOVER and CLICK
	selectFeatureControl: null,
	hoverInfo: null,
	clickedInfo: null,
	focusInfo: null,
	findFeatureInfo: null,

    // MODES
	modes: null,
	currentMode: null,

	// MAP MODES
	navigationControls: null,
	editControls: null,
	editFeatureControls: null,

 	// EDIT mode callbacks
	editModeAddFeatureEnabled: null,
	editModeAddFeatureCallback: null,
    convertToMultiGeometry: null,
    
    // EDIT_FEATURE mode
    editFeatureInfo: undefined,

    // COMETD
    cometEnabled: null,
    fidChannel: null,
    contributionChannel: null,

    // STYLE
	defaultStyleMap: null,
	styleFilterIndex: null,
	styleFilters: null,

	// map layers
	mapLayers: null,
	vectorLayers: null,
	infoLayers: null,
	layers: null,
	mapBusyCount: null,
	busyMapControl: null,
	
	initialize: function(options_){
		var _this = this;
		
		this.mapId = 'map_' + $n2.getUniqueId();
		
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
			,scaleLine: {
				visible: false
			}
			,enableWheelZoom: false
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
			,canvasName: null
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
			,keepPopUpsOpen: false
			,keepPopUpsStatic: false
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
		this.editFeatureInfo = {
			original: {}
		};

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
		
		var addOrEditLabel = _loc('Add or Edit a Map Feature');
		var cancelLabel = _loc('Cancel Feature Editing');
		var customService = this._getCustomService();
		if( customService ){
			var customAdd = customService.getOption('mapLabelEditFeature',null);
			if( customAdd ){
				addOrEditLabel = customAdd;
			};

			var customCancel = customService.getOption('mapLabelCancelEdit',null);
			if( customCancel ){
				cancelLabel = customCancel;
			};
		};

		// MODES
		this.modes = {
			NAVIGATE: {
				name        : "NAVIGATE"
				,buttonValue : addOrEditLabel
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				,onStartClick: function(feature, mapFeature) {
					_this.initAndDisplayClickedPlaceInfo(feature);
				}
				,onEndClick: function(feature) {
				}
				,featureAdded: function(feature) {
					
				}
			}
			,ADD_OR_SELECT_FEATURE: {
				name        : "ADD_OR_SELECT"
				,buttonValue : cancelLabel
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
			    		_this._dispatch({
			    			type: 'editInitiate'
			    			,doc: feature.data
			    		});
					};
				}
				,onEndClick: function(feature) {
				}
				,featureAdded: function(feature) {
					_this.editFeatureInfo.original = {};
					_this.editFeatureInfo.fid = undefined;
					_this.editFeatureInfo.suppressZoom = true;
					
					var mapProj = feature.layer.map.getProjectionObject();

		    		_this._dispatch({
		    			type: 'editCreateFromGeometry'
		    			,geometry: feature.geometry.clone()
		    			,projection: mapProj
		    			,_origin: _this
		    		});
				}
			}
			,ADD_GEOMETRY: {
				name        : "ADD_GEOMETRY"
				,buttonValue : cancelLabel
				,onStartHover: function(feature, layer) {
					_this._hoverFeature(feature, layer);
					_this._hoverFeaturePopup(feature, layer);
				}
				,featureAdded: function(feature) {
					var proj = null;
					if( feature 
					 && feature.layer 
					 && feature.layer.map ){
						proj = feature.layer.map.getProjectionObject();
					};
					
		    		_this._dispatch({
		    			type: 'mapGeometryAdded'
		        		,geometry: feature.geometry
		        		,projection: proj
		    		});
				}
			}
			,EDIT_FEATURE: {
				name        : "EDIT_FEATURE"
				,buttonValue : cancelLabel
				,featureAdded: function(feature) {
				}
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
	    this._registerDispatch('documentContentCreated');
	    this._registerDispatch('documentContentUpdated');
	    this._registerDispatch('addLayerToMap');
	    this._registerDispatch('selected');
	    this._registerDispatch('selectedSupplement');
	    this._registerDispatch('unselected');
	    this._registerDispatch('focusOn');
	    this._registerDispatch('focusOff');
	    this._registerDispatch('focusOnSupplement');
	    this._registerDispatch('findIsAvailable');
	    this._registerDispatch('find');
	    this._registerDispatch('searchInitiate');
	    this._registerDispatch('editInitiate');
	    this._registerDispatch('editClosed');
	    this._registerDispatch('editGeometryModified');
	    this._registerDispatch('editReportOriginalDocument');
	    this._registerDispatch('mapRedrawLayer');
	    this._registerDispatch('mapSetInitialExtent');
	    this._registerDispatch('mapSetExtent');
	    this._registerDispatch('mapResetExtent');
	    this._registerDispatch('mapGetLayers');
	    this._registerDispatch('setMapLayerVisibility');
	    this._registerDispatch('mapSwitchToEditMode');
	    this._registerDispatch('simplifiedGeometryReport');
	    this._registerDispatch('canvasGetStylesInUse');
	    
		// Layers
		this.infoLayers = [];
		
		if( typeof(this.options.layerInfo) === 'object' && !$n2.isArray(this.options.layerInfo) ) {
			this.options.layerInfo = [this.options.layerInfo];
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
		    	var previousMode = _this.currentMode;
	    		_this.switchToEditFeatureMode(feature.fid, feature);
	    		previousMode.featureAdded(feature);
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

		this.map = new OpenLayers.N2Map(this.options.mapIdentifier, {
			projection: mapProjection
			,displayProjection: (this.options.mapCoordinateSpecifications.useForMapControls ? userCoordProjection : mapProjection)
			,units: this.options.mapDisplay.units
			,maxResolution: this.options.mapDisplay.maxResolution
			,maxExtent: maxExt
			,restrictedExtent: restrictedExtent
			,theme: null // Let host page control loading of appropriate CSS style sheet
			,zoomMethod: null  // Zoom with features does not look good
		});
		
		// Create Scale line 
		if( this.options.scaleLine && this.options.scaleLine.visible ){
			// Default OpenLayers Scale Line Properties:
			// ------------------------------------
			// bottomOutUnits: mi
			// bottomInUnits: ft
			// topOutUnits: km
			// topInUnits: m
			// maxWidth: 100 (in pixels)
			// geodesic: false

			var scaleLine = new OpenLayers.Control.ScaleLine({
				bottomOutUnits: this.options.scaleLine.bottomOutUnits
				,bottomInUnits: this.options.scaleLine.bottomInUnits
				,topOutUnits: this.options.scaleLine.topOutUnits
				,topInUnits: this.options.scaleLine.topInUnits
				,maxWidth: this.options.scaleLine.maxWidth
				,geodesic: this.options.scaleLine.geodesic
			});

			this.map.addControl(scaleLine);
		};

		// Disable zoom on mouse wheel
		if( this.options.enableWheelZoom ) {
			// Do nothing. Enabled by default
		} else {
			// Turn off wheel
			var navControls = this.map.getControlsByClass('OpenLayers.Control.Navigation');
			for(var i=0,e=navControls.length; i<e; ++i) {
				navControls[i].disableZoomWheel();
			};
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
		
		// Re-project vector layer features when base layer is changed
        this.map.events.register('changebaselayer',null,function(evt){
        	// var baseLayer = evt.layer;
        	var lastProjectionObj = evt.oldProjection;
        	var currentProjectionObj = _this.map.getProjectionObject();

        	// Makes sense only when projection is changed
        	if( currentProjectionObj 
           	 && lastProjectionObj 
           	 && currentProjectionObj.getCode() !== lastProjectionObj.getCode() ){
        		
        		// Loop over vector layers
        		for(var li=0,le=_this.vectorLayers.length; li<le; ++li) {
        			var vectorLayer = _this.vectorLayers[li];

        			// Process each feature
            		var features = vectorLayer.features;
            		
            		vectorLayer.removeAllFeatures({silent:true});
            		
            		for(var fi=0,fe=features.length; fi<fe; ++fi){
            			var f = features[fi];
            			f.geometry.transform(lastProjectionObj, currentProjectionObj);
            			
            			// Convert members of cluster, as well, if present
            			if( f.cluster && f.cluster.length ){
                    		for(var ci=0,ce=f.cluster.length; ci<ce; ++ci){
                    			var clustered = f.cluster[ci];
                    			clustered.geometry.transform(lastProjectionObj, currentProjectionObj);
                    		};
            			};
            		};
            		
            		vectorLayer.addFeatures(features,{silent:true});
            	};
    		};
        });
		
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

		// Install mouse position widget
		var mousePositionProjection = this.options.mapCoordinateSpecifications.useForMapControls ? 
				userCoordProjection : mapProjection;
		if( this.options.mapCoordinateSpecifications.mousePositionSrsName ){
			mousePositionProjection = new OpenLayers.Projection(
				this.options.mapCoordinateSpecifications.mousePositionSrsName
			);
		};
		this.map.addControl(new OpenLayers.Control.MousePosition({
			displayProjection: mousePositionProjection
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
		
    	// When changing zoom, check if new simpilified geometries should be loaded
    	this.map.events.register( 'zoomend', null, function(evt){
    		_this._refreshSimplifiedGeometries();
    		_this._updatedStylesInUse();
		});
		
    	// When changing zoom, check if new simpilified geometries should be loaded
    	this.map.events.register( 'move', null, function(evt){
    		_this._mapMoved();
		});

		this.initCometChannels();
		
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			dispatcher.send(DH,{
				type: 'mapInitialized'
				,mapControl: this
			});
		};
	},
	
	getCanvasName: function(){
		if( this.options ){
			return this.options.canvasName;
		};
		return undefined;
	},

	getNamedLayerInfo: function(name) {
		for(var i=0,e=this.infoLayers.length; i<e; ++i) {
			var layer = this.infoLayers[i];
			if( layer.name === name ) {
				return layer;
			} else if( layer.id === name ) {
				return layer;
			};
		}
		return null;
	},

	insertSound: function(surl) {
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
	},
	
	initAndDisplayClickedPlaceInfo: function(feature) {
		var dispatchService = this._getDispatchService();
		if( dispatchService ) {
			dispatchService.send(DH, {
				type: 'userSelect'
				,docId: feature.data._id
				,doc: feature.data
				,feature: feature
	 		});
		};
	},
	
	forEachVectorLayer: function(callback){
		if( this.infoLayers && typeof callback === 'function' ){
			for(var i=0,e=this.infoLayers.length; i<e; ++i){
				var layerInfo = this.infoLayers[i];
				var layer = layerInfo.olLayer;
				callback.call(this,layerInfo,layer);
			};
		};
	},
	
	_getMapFeaturesIncludingFid: function(fid){
		var fidMap = {};
		fidMap[fid] = true;
		
		var features = this._getMapFeaturesIncludingFidMap(fidMap);
		return features;
	},
	
	_getMapFeaturesIncludingFids: function(fids){
		var fidMap = {};
		for(var i=0,e=fids.length; i<e; ++i){
			var fid = fids[i];
			fidMap[fid] = true;
		};
		
		var features = this._getMapFeaturesIncludingFidMap(fidMap);
		return features;
	},
	
	_getMapFeaturesIncludingFidMap: function(fidMap){
		var features = [];
		
		for(var loop=0; loop<this.infoLayers.length; ++loop) {
			var layerInfo = this.infoLayers[loop];
			var feature = this._getLayerFeatureIncludingFidMap(layerInfo.olLayer,fidMap);
			if( feature ) {
				features.push(feature);
			};
		};
		
		return features;
	},
	
	_getLayerFeatureIncludingFid: function(layer, fid){
		var map = {};
		map[fid] = true;
		return this._getLayerFeatureIncludingFidMap(layer, map);
	},
	
	_getLayerFeatureIncludingFidMap: function(layer,fidMap) {
		
		if( layer && layer.features ) {
			var loop;
			var features = layer.features;
			for(loop=0;loop<features.length;++loop) {
				var feature = features[loop];
				if( feature.fid && fidMap[feature.fid] ) {
					return feature;
				} else if( feature.cluster ) {
					for(var j=0,k=feature.cluster.length; j<k; ++j){
						var f = feature.cluster[j];
						if( f.fid && fidMap[f.fid] ){
							return feature;
						};
					};
				};
			};
		};
		
		return null;
	},
	
	_getLayerFeaturesFromFilter: function(layer,filter) {
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
	},
	
	_reloadFeature: function(filter,options_) {
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
	},
	
	/*
	 * Attempts to reload features given a specified layer and filter
	 */
	_loadFeatureOnLayer: function(layerInfo,filter,options_){
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
				if( _this.currentMode === _this.modes.ADD_OR_SELECT_FEATURE 
				 || _this.currentMode === _this.modes.ADD_GEOMETRY ) {
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
				
				// Refresh styles
				_this._updatedStylesInUse();
			};
			
			return cb;
		};
	},
	
	_removeFeature: function(fid) {
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
	},
	
	_centerMapOnFeature: function(feature) {
    	var geom = feature.geometry;
    	var bbox = geom.getBounds();
		var x = (bbox.left + bbox.right) / 2;
		var y = (bbox.bottom + bbox.top) / 2;
		
		this._centerMapOnXY(x,y,null); // same projection as map
	},

	_centerMapOnXY: function(x, y, projCode) {
		var ll = new OpenLayers.LonLat(x, y);
		
		var mapProj = this.map.getProjectionObject();
		
		if( projCode 
		 && projCode != mapProj.getCode() ) {
			var proj = new OpenLayers.Projection(projCode);
			ll.transform(proj, mapProj); // transform in place
		};
		
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	},
	
	_installGeometryEditor: function(feature){
		// Remove previous editor
		this._removeGeometryEditor();
		
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
    	
    	if( feature ){
    		// This is a new feature that is on the EDIT layer
    		modifyFeatureGeometry.selectFeature(feature);
    	};
	},
	
	_updateGeometryEditor: function(olGeom, proj){
		// Reproject, if needed
		var mapProj = this.map.getProjectionObject();
		if( olGeom 
		 && proj 
		 && mapProj.getCode() != proj.getCode() ) {
			olGeom = olGeom.clone();
			olGeom.transform(proj, mapProj);
		} else if( olGeom ) {
			olGeom = olGeom.clone();
		};

		var modifyFeatureControl = this.editFeatureControls.modifyFeatureGeometry;
		
		var editFeature = modifyFeatureControl.feature;
		if( editFeature ) {
			// Redraw
			modifyFeatureControl.unselectFeature(editFeature);
			editFeature.layer.eraseFeatures([editFeature]);
			editFeature.geometry = olGeom;
			editFeature.layer.drawFeature(editFeature);
			modifyFeatureControl.selectFeature(editFeature);
		} else {
			// Add
	    	editFeature = new OpenLayers.Feature.Vector(olGeom);
	    	editFeature.fid = this.editFeatureInfo.fid;

	    	// Add to edit layer
	    	this.editModeAddFeatureEnabled = false;
	    	this.editLayer.addFeatures([editFeature]);
	    	this.editModeAddFeatureEnabled = true;

	    	modifyFeatureControl.selectFeature(editFeature);
		};
	},
	
	_removeGeometryEditor: function(){
		var editFeature = undefined;
		if( this.editFeatureControls.modifyFeatureGeometry ) {
			editFeature = this.editFeatureControls.modifyFeatureGeometry.feature;
    		if( editFeature ) {
    			this.editFeatureControls.modifyFeatureGeometry.unselectFeature(editFeature);
    		};
    		this.editFeatureControls.modifyFeatureGeometry.deactivate();
    		this.map.removeControl( this.editFeatureControls.modifyFeatureGeometry );
    		this.editFeatureControls.modifyFeatureGeometry.destroy();
    		this.editFeatureControls.modifyFeatureGeometry = null;

    		// Remove feature from edit layer
			if( editFeature && editFeature.layer ) {
				editFeature.layer.destroyFeatures([editFeature]);
			};
		};
		
		return editFeature;
	},

	// @param bounds Instance of OpenLayers.Bounds
	convertBoundsToMapProjection: function(bounds, srsName) {
		// TBD: Can we get the projection directly from the map?
		var mapProjection = new OpenLayers.Projection(this.options.mapDisplay.srsName);
		var userCoordProjection = new OpenLayers.Projection(srsName);

		if (userCoordProjection.getCode() != mapProjection.getCode()) {
			bounds.transform(userCoordProjection, mapProjection);
		};
	},
	
	redrawMap: function() {
		var layers = this.map.layers;
		for(var loop=0; loop<layers.length; ++loop) {
	        if (layers[loop].isBaseLayer )  {
	        	// nothing
	        } else {
	            layers[loop].redraw();
	        };
		};
		
		this._updatedStylesInUse();
	},

	_createOverlayFromDefinition: function(layerDefinition, isBaseLayer) {
		var _this = this;
		var cs = this._getCustomService();

		// Create LayerInfo
		var layerInfoOptions = $.extend({
			styleMapFn: function(layerInfo){ 
				return _this._createStyleMapFromLayerInfo(layerInfo); 
			}
		}, layerDefinition);
		layerInfoOptions.customService = cs; 
		var layerInfo = new LayerInfo(layerInfoOptions);
		
		var layerOptions = {
			name: layerInfo.name
			,projection: layerInfo.sourceProjection
			,visibility: layerInfo.visibility
			,_layerInfo: layerInfo
		};

		if( 'couchdb' === layerDefinition.type ) {
			// This is a couch layer
			var couchProtocolOpt = $n2.extend({},layerDefinition.options,{
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
			layerInfo.cachingAllowed = true;
			
		} else if( 'model' === layerDefinition.type ) {
			var modelProtocolOptions = $n2.extend({},layerDefinition.options);
			modelProtocolOptions.dispatchService = this._getDispatchService();
			modelProtocolOptions.onUpdateCallback = function(state){
				_this._modelLayerUpdated(layerOptions, state);
			};
			modelProtocolOptions.notifications = {
				readStart: function(){
					_this._mapBusyStatus(1);
				}
				,readEnd: function(){
					_this._mapBusyStatus(-1);
				}
			};
			
			layerInfo.protocol = new OpenLayers.Protocol.Model(modelProtocolOptions);
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
				if( 'couchdb' === layerDefinition.type ) {
					layerOptions.strategies = [ new OpenLayers.Strategy.N2BBOX() ];
				} else if( 'model' === layerDefinition.type ){
					// no bounding box strategies for model layers
					layerOptions.strategies = [ new OpenLayers.Strategy.Fixed() ];
				} else {
					layerOptions.strategies = [ new OpenLayers.Strategy.BBOX() ];
				};
			};
		};
		
		if( !layerOptions.strategies ){
			layerOptions.strategies = [];
		};
		layerInfo.featureStrategy = new OpenLayers.Strategy.NunaliitFeatureStrategy();
		layerOptions.strategies.push( layerInfo.featureStrategy );
		if( typeof layerDefinition.minimumLinePixelSize === 'number' 
		 || typeof layerDefinition.minimumPolygonPixelSize === 'number' ){
			var minimumSizeOptions = {};
			if( typeof layerDefinition.minimumLinePixelSize === 'number' ){
				minimumSizeOptions.minimumLinePixelSize = layerDefinition.minimumLinePixelSize;
			};
			if( typeof layerDefinition.minimumPolygonPixelSize === 'number' ){
				minimumSizeOptions.minimumPolygonPixelSize = layerDefinition.minimumPolygonPixelSize;
			};
			layerInfo.featureStrategy.setMinimumSize(minimumSizeOptions);
		};
		if( layerInfo.clustering ) {
			var clusterOptions = {};
			
			if( typeof layerDefinition.minimumLinePixelSize === 'number' ){
				clusterOptions.minimumLinePixelSize = layerDefinition.minimumLinePixelSize;
			};
			if( typeof layerDefinition.minimumPolygonPixelSize === 'number' ){
				clusterOptions.minimumPolygonPixelSize = layerDefinition.minimumPolygonPixelSize;
			};
			
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
			layerInfo.featureStrategy.setClustering(clusterOptions);
		};
		
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
	},
	
	/*
	 * Creates a Layer from OpenLayers given the layer definition.
	 */
	_createOLLayerFromDefinition: function(layerDefinition, isBaseLayer){
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
			//this._checkGoogleMapAPI();
			
			var options = layerDefinition.options;
			
			if( options && 'string' === typeof(options.type) ){
				var mapTypeId = null;
				if( typeof google !== 'undefined' 
				 && google.maps 
				 && google.maps.MapTypeId ){
					mapTypeId = google.maps.MapTypeId[options.type];
				};
				if( mapTypeId ) {
					options.type = mapTypeId;
				} else {
					$n2.reportError('Attempting to load a Google Map background. A map API key must be configured');
					$n2.logError('Unable to load Google Map type: '+options.type);
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
		 || 'model' === layerDefinition.type
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

					} else if( 'srsName' === key ) {
						var proj = new OpenLayers.Projection( options[key] );
						layerOptions.projection = proj;

					} else if( 'opacity' === key
							|| 'scales' === key 
							|| 'resolutions' === key 
							|| 'maxScale' === key
							|| 'minScale' === key
							|| 'maxResolution' === key
							|| 'minResolution' === key
							|| 'numZoomLevels' === key
							|| 'maxZoomLevel' === key ) {
						layerOptions[key] = options[key];
						
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
	},
	
	_registerLayerForEvents: function(layerInfo){
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
			
			return true;
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

			// When features are added, check the map for new simplified geometries
			_this._refreshSimplifiedGeometries();
			
			_this._updatedStylesInUse();
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

			_this._updatedStylesInUse();
		});
	},
    
    _createFeatureModifiedHandler: function(olLayer){
    	var _this = this;
    	
        // Called when the feature on the map is modified
    	return function(evt){
        	var feature = evt.feature;
        	
        	_this._dispatch({
        		type: 'editGeometryModified'
        		,docId: feature.fid
        		,geom: feature.geometry
        		,proj: olLayer.map.getProjectionObject()
        		,_origin: _this
        	});
    	};
    },

	_genBackgroundMapLayers: function(options) {
		var _this = this;
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
						this._checkGoogleMapAPI();
						
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
				
			} else if( typeof google !== 'undefined'
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
	},
	
	_checkGoogleMapAPI: function(){
		var googleMapApiLoaded = false;
		if( typeof window === 'object' 
		 && window.google 
		 && window.google.maps ){
			googleMapApiLoaded = true;
		};
		if( !googleMapApiLoaded ){
			$n2.logError('Google Map API is not loaded. Please, configure a Google Map API key');
		};
	},

	getBaseLayers: function() {
		var baseLayers = [];
		
		if( this.map 
		 && this.map.layers ){
			for(var i=0,e=this.map.layers.length; i<e; ++i){
				var layer = this.map.layers[i];
				if( layer.isBaseLayer ){
					var layerInfo = {
						id: layer.id
						,projection: layer.projection
					};
					
					baseLayers.push( layerInfo );
				};
			};
		};
		
		return baseLayers;
	},

	setBaseLayer: function(layerId) {

		var baseLayer = null;
		if( this.map 
		 && this.map.layers ){
			for(var i=0,e=this.map.layers.length; i<e; ++i){
				var layer = this.map.layers[i];
				if( layer.isBaseLayer 
				 && layer.id === layerId ){
					baseLayer = layer;
					break;
				};
			};
		};
		
		if( baseLayer ){
			this.map.setBaseLayer(baseLayer);
		};
	},
	
    // === HOVER AND CLICK START ========================================================

   	_startClicked: function(mapFeature, forced) {
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
	},
	
	_endClicked: function() {
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
	},
	
	_selectedFeatures: function(features, fids){
		if( this.currentMode !== this.modes.NAVIGATE ){
			this._switchMapMode(this.modes.NAVIGATE);
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
	},

	/**
	 * Add map selection to current selection.
	 */
	_selectedFeaturesSupplement: function(opts){
		
		if( this.currentMode !== this.modes.NAVIGATE ){
			this._switchMapMode(this.modes.NAVIGATE);
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
	},

	/**
	 * Unselect the currently selected feature
	 */
   	_unselectFeature: function(){
   		if( this.clickedInfo.selectedId ) {
   			this._dispatch({
   				type:'userUnselect'
   				,docId:this.clickedInfo.selectedId
   			});
   		};
   		
		this._endClicked();
   	},
	
	_startHover: function(feature) {
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
	},
	
	_endHover: function() {

		for(var i=0,e=this.hoverInfo.endFn.length; i<e; ++i) {
			//try{
			this.hoverInfo.endFn[i](); 
			//} catch(e){};
		};
		
		this.hoverInfo.feature = null;
		this.hoverInfo.endFn = [];
	},
	
	_registerEndHoverFn: function(fn) {
		this.hoverInfo.endFn.push(fn);
	},

	_startFocus: function(fids){
		this._endFocus();
		
		this.focusInfo.origin = {};
		for(var i=0,e=fids.length; i<e; ++i){
			var fid = fids[i];
			this.focusInfo.origin[fid] = true;
		};
		
		this._addFocus({
			fids: fids
		});
	},

	_addFocus: function(opts_){
		var opts = $n2.extend({
			fids: null
			,intent: null
		},opts_);

		if( opts.fids ){
			for(var i=0,e=opts.fids.length; i<e; ++i){
				var fid = opts.fids[i];
				this.focusInfo.fids[fid] = true;
			};
		};
		
		var features = this._getMapFeaturesIncludingFidMap(this.focusInfo.fids);
		
		for(var i=0,e=features.length; i<e; ++i){
			var f = features[i];
			if( f && !f.isHovered ) {
				f.isHovered = true;
				if( opts.intent ){
					f.n2HoverIntent = opts.intent;
				};
				if( f.layer ) f.layer.drawFeature(f);
				this.focusInfo.features.push( f );
			};
		};
	},
	
	_endFocus: function() {
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
	},
	
	_startFindFeature: function(fid, features){
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
	},
	
	_endFindFeature: function(){
		
		for(var i=0,e=this.findFeatureInfo.features.length; i<e; ++i){
			var f = this.findFeatureInfo.features[i];
			if( f ) {
				f.n2Intent = null;
				if( f.layer ) f.layer.drawFeature(f);
			};
		};
		
		this.findFeatureInfo.fid = null;
		this.findFeatureInfo.features = [];
	},

	activateSelectFeatureControl: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.activate();
		};
	},

	deactivateSelectFeatureControl: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.unselectAll();
			this.selectFeatureControl.deactivate();
		};
		this._endHover();
		this._endClicked();
	},

	_hoverFeature: function(feature, layer) {
		if( !feature ) {
			return;
		};
		if( !layer ) {
			return;
		};
		
		var layerInfo = layer._layerInfo;
		if( !layerInfo ) {
			return;
		};

		var dispatchService = this._getDispatchService();
		
		var docIds = [];
		var docs = [];
		if( feature.cluster ){
			for(var ci=0,ce=feature.cluster.length; ci<ce; ++ci){
				var f = feature.cluster[ci];
				docIds.push( f.fid );
				docs.push( f.data );
			};
			
		} else {
			docIds.push( feature.fid );
			docs.push( feature.data );
		};

		this._registerEndHoverFn(function(){
			dispatchService.send(DH, {
				type: 'userFocusOff'
				,docIds: docIds
				,docs: docs
				,feature: feature
	 		});
		});

		if( docIds.length > 1 ){
			dispatchService.send(DH, {
				type: 'userFocusOn'
				,docIds: docIds
				,docs: docs
				,feature: feature
	 		});
		} else if( docIds.length > 0 ){
			dispatchService.send(DH, {
				type: 'userFocusOn'
				,docId: docIds[0]
				,doc: docs[0]
				,feature: feature
	 		});
		};
	},
	
	_hoverFeaturePopup: function(feature, layer) {
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

			// Set maximum pop-up size
			var mapSize = _this.map.getSize();
			if( mapSize ){
				popup.maxSize = new OpenLayers.Size(
					Math.floor(mapSize.w/3),
					Math.floor(mapSize.h/3)
				);
			};
			
			// Install new pop-up
			_this.currentPopup = popup;
			_this.map.addPopup(popup);

			// Add clean up routine
			if( _this.options && _this.options.keepPopUpsOpen ){
				// Leave opened (debugging)
			} else {
				_this._registerEndHoverFn(destroyCurrentPopup);
			};
			
			// Add routine to adjust popup position, once
			if( _this.options && _this.options.keepPopUpsStatic ){
				// Leave opened (debugging)
			} else {
				_this.addMapMousePositionListener(function(evt){
					if( _this.currentPopup === popup && _this.lastMapXy ) {
						_this.currentPopup.lonlat = _this.map.getLonLatFromPixel(_this.lastMapXy);
						_this.currentPopup.updatePosition();
						return true; // keep listener
					};
					
					return false; // remove listener
				});
			};
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
	},

    // === LOGIN STUFF START ========================================================

    /*
     * function: auth module listener for login state changes.  Only called if the auth
     * module is loaded so checks of that inside this function are not useful.
     * 
     * Once installed by the subsequent call to addListener(), this is immediately
     * called and then whenever a login state change is detected.
     */
    loginStateChanged: function(currentUser) {
    	var showLogin = false;

		if( null == currentUser ) {
    		showLogin = true;
    	};
    	
    	if( showLogin ) {
    		this.hideMapInteractionSwitch();
			this._switchMapMode(this.modes.NAVIGATE);
    	} else {
   			this.showMapInteractionSwitch();
    	};
    },
    	
    // === LOGIN STUFF END ========================================================
	
    // === MAP MODES START ========================================================
    
 	createMapInteractionSwitch: function() {
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
	},
 	
 	_getMapInteractionSwitch: function(){
 		return $("#"+this.options.mapInteractionDivName)
 			.find('.n2map_map_interaction_switch');
 	},
	
	_clickedMapInteractionSwitch: function(e){
		if( this.currentMode === this.modes.NAVIGATE ) {
			this.switchToEditMode();
			
		} else if( this.currentMode === this.modes.ADD_OR_SELECT_FEATURE ) {
			this._switchMapMode(this.modes.NAVIGATE);
			
		} else if( this.currentMode === this.modes.ADD_GEOMETRY ) {
			this._cancelEditFeatureMode();
			
		} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
			this._cancelEditFeatureMode();
		};
		return false;
	},
	
 	hideMapInteractionSwitch: function() {
 		this._getMapInteractionSwitch().hide();
	},
	
	showMapInteractionSwitch: function() {
 		this._getMapInteractionSwitch().show();
	},
	
	activateControl: function(control) {
		if( control ) control.activate();
	},
	
	deactivateControl: function(control) {
		if( control ) control.deactivate();
	},
			
    _switchMapMode: function(mode, opts) {
    	if( this.currentMode === mode ) {
    		// nothing to do
    		return;
    	};
    	
    	// Remove current mode
    	if( this.currentMode === this.modes.ADD_OR_SELECT_FEATURE ) {
    		this.deactivateControl( this.editControls.addPoints );
    		this.deactivateControl( this.editControls.toolbar );
    		this.deactivateControl( this.editControls.modifyFeature );
    		this.editLayer.events.unregister('featureadded', null, this.editModeAddFeatureCallback);
            this.editLayer.events.unregister('beforefeaturesadded', null, this.convertToMultiGeometry);

            this.deactivateSelectFeatureControl();
            
    	} else if( this.currentMode === this.modes.ADD_GEOMETRY ) {
    		this.deactivateControl( this.editControls.addPoints );
    		this.deactivateControl( this.editControls.toolbar );
    		this.deactivateControl( this.editControls.modifyFeature );
    		this.editLayer.events.unregister('featureadded', null, this.editModeAddFeatureCallback);
            this.editLayer.events.unregister('beforefeaturesadded', null, this.convertToMultiGeometry);

            this.deactivateSelectFeatureControl();
            
    	} else if( this.currentMode === this.modes.EDIT_FEATURE ) {
    		this._removeGeometryEditor();
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.deactivateSelectFeatureControl();
    	};

    	// Apply new mode
    	this.currentMode = mode;
    	this._getMapInteractionSwitch().val(mode.buttonValue);
    	if( this.currentMode === this.modes.ADD_OR_SELECT_FEATURE ) {
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
            
    	} else if( this.currentMode === this.modes.ADD_GEOMETRY ) {
    		this.editLayer.events.register('featureadded', null, this.editModeAddFeatureCallback);
    		this.editLayer.events.register('beforefeaturesadded', null, this.convertToMultiGeometry);
    		this.activateControl( this.editControls.addPoints );
    		this.activateControl( this.editControls.toolbar );
    		this.activateControl( this.editControls.modifyFeature );
    		
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
    		var editFeature = opts.feature;
   			this._installGeometryEditor(editFeature);
            
    	} else if( this.currentMode === this.modes.NAVIGATE ) {
    		this.activateSelectFeatureControl();
    	};

    	// Broadcast mode change
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			dispatcher.send(DH,{
				type: 'mapReportMode'
				,mapControl: this
				,mode: this.currentMode.name
			});
		};
    },
    
    switchToEditMode: function() {
    	var _this = this;
    	
    	var authService = this._getAuthService();
    	if( authService ) {
    		var logInRequired = true;
    		
    		// The auth module is present, check if user logged in
    		// and is not anonymous
    		var userNotAnonymous = authService.isLoggedIn();
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
    	    	this._switchMapMode(this.modes.ADD_OR_SELECT_FEATURE);
    		};
    	} else {
    		alert("Authentication module not installed.");
    	};
    },
    
    switchToEditFeatureMode: function(fid, feature) {
    	this._switchMapMode(this.modes.EDIT_FEATURE,{
    		fid: fid
    		,feature: feature
    	});
    },
    
    switchToAddGeometryMode: function(docId) {
    	this._switchMapMode(this.modes.ADD_GEOMETRY,{
    		fid: docId
    	});
    },
    
    _cancelEditFeatureMode: function() {
   		this._dispatch({
   			type: 'editCancel'
   		});
    },
    
    // === NAVIGATION MODE ========================================================


    // === ADD OR SELECT FEATURE MODE =============================================

    // ======= EDIT_FEATURE MODE ==================================================

    _geometryModified: function(fid, olGeom, proj){
		// Check that this relates to the right feature
		if( fid && fid !== this.editFeatureInfo.fid ) return;
		if( !fid && this.editFeatureInfo.fid ) return;
    	
		if( this.currentMode === this.modes.EDIT_FEATURE 
		 && !olGeom ){
			// Geometry was deleted by external editor
			
			// Remove feature. By switching out of EDIT mode,
			// the feature on the EDIT layer will be removed. 
			this.switchToAddGeometryMode(fid);

		} else if( this.currentMode === this.modes.EDIT_FEATURE 
		 && olGeom ){
			// Normal mode: we are editing a feature and the geometry was updated
			this._updateGeometryEditor(olGeom, proj);

		} else if( this.currentMode !== this.modes.EDIT_FEATURE 
		 && olGeom ){
			// A geometry was added and the map is not yet in edit mode
			this.switchToEditFeatureMode(fid);
			this._updateGeometryEditor(olGeom, proj);
		};
    },

    onAttributeFormClosed: function(editedFeature) {
    	// When closing the dialog with the user, the feature
    	// must be removed from the map if it is a new one, since it does
    	// not have a valid fid. The feature will be reloaded, anyway. However,
    	// in the case of an INSERT, the currently drawn feature will not
    	// be repopulated since it can not be matched via fid.
		if( editedFeature && editedFeature.state === OpenLayers.State.INSERT ) {
			this.editLayer.destroyFeatures(editedFeature);
		};
		
		this._switchMapMode(this.modes.NAVIGATE);
    },

	onAttributeFormCancelled: function(editedFeature) {
		this._switchMapMode(this.modes.NAVIGATE);
	},
    
	onAttributeFormInserted: function(fid, feature) {
		var _this = this;
		
		// This is an insert

		// Remove feature which is on the edit layer. Feature
		// will be reloaded on the correct layer.
		if( feature && feature.layer ) {
			feature.layer.destroyFeatures([feature]);
		};

		this.fidAdded(fid);
	},
    
	onAttributeFormUpdated: function(fid, feature) {
		// This is an update
		var fid = feature.fid;
		this.fidUpdated(fid);
		var filter = $n2.olFilter.fromFid(fid);
		this._reloadFeature(filter);
	},
	
	onAttributeFormDeleted: function(fid, feature) {
		this.fidDeleted(fid);
		var layer = feature.layer;
		if( layer ) {
			layer.destroyFeatures([feature]);
		};
	},
    
	selectAudioMedia: function(feature, onSelectCallback) {
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
	},
	
    // === EDIT MODE STUFF END ======================================================================

    // === COMETD MODE STUFF START ========================================================
    
    initCometChannels: function() {
    	var _this = this;
    	if( this.cometEnabled && $.cometd ) {
			$.cometd.init('./cometd');
			$.cometd.subscribe(
				this.fidChannel
				,function(msg){ _this.fidHandler(msg); }
			);
    	}
    },
    
	fidHandler: function(msg) {
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
	},	
    	
	fidAdded: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'added'
			};
			$.cometd.publish(this.fidChannel,msg);
		};
	},
	
	fidUpdated: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'updated'
			};
			$.cometd.publish(this.fidChannel,msg);
		}
	},
	
	fidDeleted: function(fid) {
		if( this.cometEnabled && $.cometd ) {
			var msg = {
				fid: fid
				,type: 'deleted'
			};
			$.cometd.publish(this.fidChannel,msg);
		};
	},
	
    // === COMETD MODE STUFF END ========================================================

    // === STYLE MAP STUFF START ========================================================

	adjustFilterProperties: function(feature) {
	
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
	},
	
	_createStyleMap: function(styleOptions) {
	
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
	},
	
	_createStyleMapFromLayerInfo: function(layerInfo) {
	
		var styleOptions = null;
		if( layerInfo && layerInfo.styleMap ) {
			styleOptions = layerInfo.styleMap;
		};
		return this._createStyleMap(styleOptions);
	},
	
	_createEffectiveStyleMap: function(layerInfo) {
	
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
	},
	
	turnOffStyleFilter: function( label ) {
		if( this.styleFilters[label] ) {
			delete this.styleFilters[label];
			
			this.redrawMap();
		};
	},
	
	removeStyleFilter: function( filter ) {
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
	},
	
	addStyleFilter: function( filter_ ) {
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
	},

    // === STYLE MAP STUFF END ========================================================

	// === START -- LAYER MANAGEMENT ========================================================

	// Legacy method
	createLayerFromOptions: function(opt_) {
		var _this = this;
		
		var cs = this._getCustomService();
		
		// Create LayerInfo
		var layerInfoOptions = $.extend({
			styleMapFn: function(layerInfo){ 
				return _this._createStyleMapFromLayerInfo(layerInfo); 
			}
		}, opt_);
		layerInfoOptions.customService = cs; 
		var layerInfo = new LayerInfo(layerInfoOptions);
		
		layerInfo.typename = layerInfo.featurePrefix + ':' + layerInfo.featureType;
		layerInfo.schema = layerInfo.wfsUrl 
			+ '?service=WFS&version=' + layerInfo.wfsVersion 
			+ '&request=DescribeFeatureType&typeName=' + layerInfo.typename;
		
		var layerOptions = {
			projection: layerInfo.sourceProjection
			,visibility: layerInfo.visibility
			,_layerInfo: layerInfo
		};

		if( layerInfo.couchDb ) {
			// This is a couch layer
			var couchProtocolOpt = $n2.extend({},opt_.couchDb,{
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
				if( layerInfo.couchDb ) {
					layerOptions.strategies = [ new OpenLayers.Strategy.N2BBOX() ];
				} else {
					layerOptions.strategies = [ new OpenLayers.Strategy.BBOX() ];
				};
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
	},
	
	findLayerFromId:  function(id) {
		return this.layers[id];
	},
	
	addLayer: function(layerDefinition, isBaseLayer) {
		var olLayer = this._createOLLayerFromDefinition(layerDefinition, isBaseLayer);
		this.map.addLayer( olLayer );
		this._installFeatureSelector();
	},
	
	_uninstallFeatureSelector: function() {
		if( this.selectFeatureControl ) {
			this.selectFeatureControl.deactivate();
			this.map.removeControl(this.selectFeatureControl);
			this.selectFeatureControl = null;
		};
	},
	
	_installFeatureSelector: function() {
		var _this = this;
		
		if( this.selectFeatureControl ) this._uninstallFeatureSelector();
		
		// The callbacks defined below are passed to an internal instance
		// of Feature handler
		var navHighlightOptions = {
			hover: true
			,callbacks: {
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
	},
	
	_mapBusyStatus: function(delta){
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
	},
	
	// === END -- LAYER MANAGEMENT ========================================================

	// === START -- SIMPLIFIED GEOMETRIES =================================================
	
	_refreshSimplifiedGeometries: function(){
		var _this = this;

		var epsg4326Proj = new OpenLayers.Projection('EPSG:4326');
		var epsg4326Resolution = this._getResolutionInProjection(epsg4326Proj);
		//$n2.log('epsg4326Resolution',epsg4326Resolution);
		var mapProjection = this.map.getProjectionObject();
		
		// Accumulate all geometries that are required
		var geomsNeeded = {};
		
		// Figure out extent of the map
		var mapExtent = this.map.getExtent();
		
		// Iterate over layers
		var layers = this.map.layers;
		for(var li=0,le=layers.length; li<le; ++li){
			var layer = layers[li];

			// Iterate features
			if( layer.features ){
				for(var fi=0,fe=layer.features.length; fi<fe; ++fi){
					var feature = layer.features[fi];
					
					// If feature is a cluster, iterate over its components
					if( feature.cluster ){
						for(var ci=0,ce=feature.cluster.length; ci<ce; ++ci){
							var f = feature.cluster[ci];
							checkFeature(f,epsg4326Resolution,geomsNeeded,mapExtent);
						};
					} else {
						checkFeature(feature,epsg4326Resolution,geomsNeeded,mapExtent);
					};
				};
			};
		};

		// Requested geometries for features that need them
		var geometriesRequested = [];
		var simplificationsReported = [];
		for(var id in geomsNeeded){
			var request = geomsNeeded[id];
			var attName = request.attName;
			
			// Check if we already have the simplification in memory
			if( '__inline' === attName ){
				var simplification = {
    				id: id
    				,attName: attName
    				,wkt: request.doc.nunaliit_geom.wkt
    				,proj: request.feature.n2GeomProj
				};
				simplificationsReported[simplificationsReported.length] = simplification;
				
			} else if( request.feature 
			 && request.feature.n2SimplifiedGeoms 
			 && request.feature.n2SimplifiedGeoms[attName] ){
				var simplification = request.feature.n2SimplifiedGeoms[attName];
				simplificationsReported[simplificationsReported.length] = simplification;
			
			} else {
				if( geomsNeeded[id].feature && geomsNeeded[id].feature.n2FilteredOut ){
					// Do not fetch simplifications for features not currently shown
				} else {
					geometriesRequested[geometriesRequested.length] = geomsNeeded[id];
				};
			};
		};
		if( simplificationsReported.length ){
			//$n2.log('simplificationsReported',simplificationsReported);
			window.setTimeout(function(){
				_this._updateSimplifiedGeometries(simplificationsReported);
			},0);
		};
		if( geometriesRequested.length ){
			var mapCenter = this.map.getCenter();
			if( mapCenter ){
				if( mapProjection 
				 && mapProjection.getCode() !== epsg4326Proj.getCode ){
					mapCenter.transform(mapProjection, epsg4326Proj);
				};
				
				// Sort the requested geometries so that the ones closest to the
				// center of the view port are listed first
				for(var i=0,e=geometriesRequested.length; i<e; ++i){
					var geometryRequest = geometriesRequested[i];
					var x = (geometryRequest.bbox[0] + geometryRequest.bbox[2]) / 2;
					var y = (geometryRequest.bbox[1] + geometryRequest.bbox[3]) / 2;
					
					var dx = x - mapCenter.lon;
					var dy = y - mapCenter.lat;
					
					geometryRequest.d = (dx * dx) + (dy * dy); // do not bother with Math.sqrt()
				};
				
				geometriesRequested.sort(function(a,b){
					var aSeen = true;
					var bSeen = true;
					
					if( a.feature && a.feature.n2FilteredOut ){
						aSeen = false;
					};
					if( b.feature && b.feature.n2FilteredOut ){
						bSeen = false;
					};
					
					if( aSeen && !bSeen ) return -1;
					if( bSeen && !aSeen ) return 1;
					
					if( a.d < b.d ) return -1;
					if( a.d > b.d ) return 1;

					return 0;
				});
			};
			
			//$n2.log('geometriesRequested',geometriesRequested);
			this._dispatch({
				type: 'simplifiedGeometryRequest'
				,geometriesRequested: geometriesRequested
				,requester: this.mapId
			});
		};
		// Report wait
		this._dispatch({
			type: 'waitReport'
			,requester: this.mapId
			,name: 'simplifiedGeometries'
			,label: 'Simplified Geometries'
			,count: geometriesRequested.length
		});
		
		function checkFeature(f, res, geomsNeeded, mapExtent){
			// Check if feature falls within viewable boundaries of
			// map
			if( mapExtent 
			 && f.data 
			 && f.data.nunaliit_geom
			 && f.data.nunaliit_geom.bbox ){
				
				var bbox = f.data.nunaliit_geom.bbox;
				if( $n2.isArray(bbox) 
				 && bbox.length >= 4
				 && mapProjection ){
					var geomBound = new OpenLayers.Bounds(bbox[0], bbox[1], bbox[2], bbox[3]);

					if( mapProjection 
					 && mapProjection.getCode() !== epsg4326Proj.getCode ){
						geomBound.transform(epsg4326Proj, mapProjection);
					};
					
					if( geomBound.intersectsBounds(mapExtent) ){
						// We should continue and get a simplified geometry
						// for this feature. Its BBOX intersetcs with the visible
						// portion of the map.
					} else {
						// Not on screen. Do not bother
						return;
					};
				};
			};
			
			// Operate only on features that have simplification information
			if( f.data 
			 && f.data.nunaliit_geom
			 && f.data.nunaliit_geom.simplified
			 && f.data.nunaliit_geom.simplified.resolutions ){
				// Compute which attachment name and resolution would be
				// ideal for this feature. The best resolution is the greatest
				// one defined which is smaller than the one requested by the map
				var bestAttName = undefined;
				var bestResolution = undefined;
				for(var attName in f.data.nunaliit_geom.simplified.resolutions){
					var attRes = 1 * f.data.nunaliit_geom.simplified.resolutions[attName];
					if( attRes < res ){
						if( typeof bestResolution === 'undefined' ){
							bestResolution = attRes;
							bestAttName = attName;
						} else if( attRes > bestResolution ){
							bestResolution = attRes;
							bestAttName = attName;
						};
					};
				};
				
				// If the best resolution is the one given inline, no need to
				// fetch it
				if( typeof bestResolution !== 'undefined' ){
					if( f.data.nunaliit_geom.simplified.reported_resolution === bestResolution ){
						bestAttName = '__inline';
					};
				};

				// If we can not determine an optimal resolution, it is because
				// the maps resolution is better than the best simplification. Go
				// with original geometry
				if( !bestAttName ){
					if( f.data.nunaliit_geom.simplified.original ){
						bestAttName = f.data.nunaliit_geom.simplified.original;
					};
				};
				
				// If we still can not figure out the best resolution, something
				// went wrong and ignore this feature
				if( !bestAttName ) return;
				
				// Check what geometry is currently displayed on the map
				var currentGeomAttName = undefined;
				if( f.n2CurrentGeomAttName ){
					currentGeomAttName = f.n2CurrentGeomAttName;
				};
				
				// If the best geometry and the current geometry do not match, add
				// an entry in the dictionary
				if( currentGeomAttName !== bestAttName ){
					geomsNeeded[f.fid] = {
						id: f.fid
						,attName: bestAttName
						,doc: f.data
						,feature: f
						,bbox: f.data.nunaliit_geom.bbox
					};
					
					// Save that we have requested the best geometry
					f.n2TargetGeomAttName = bestAttName;
				};
			};
		};
	},
	
	/*
	   simplifiedGeometries is an array of object like this:
	   {
	   		id: <docId or fid>
	   		,attName: <string, attachment name>
	   		,wkt: <string, well known text of simplified geometry>
	   		,proj: <object(OpenLayers.Projection), projection of simplified geometry>
	   }
	 */
	_updateSimplifiedGeometries: function(simplifiedGeometries){
		var _this = this;
		
		// Often used
		var wktFormat = new OpenLayers.Format.WKT();

		// Make a map of all simplified geometries based on id (fid)
		var simplifiedGeometriesById = {};
		for(var i=0,e=simplifiedGeometries.length; i<e; ++i){
			var simplifiedGeometry = simplifiedGeometries[i];
			simplifiedGeometriesById[simplifiedGeometry.id] = simplifiedGeometry;
		};
		
		// Look for which layers need to be reloaded
		var layersToReload = {};
		var layers = this.map.layers;
		for(var li=0,le=layers.length; li<le; ++li){
			var layer = layers[li];

			// Iterate features and find those that must be modified
			if( layer.features ){
				for(var fi=0,fe=layer.features.length; fi<fe; ++fi){
					var feature = layer.features[fi];
					
					// If feature is a cluster, iterate over its components
					if( feature.cluster ){
						for(var ci=0,ce=feature.cluster.length; ci<ce; ++ci){
							var f = feature.cluster[ci];
							updateFeature(layer,f,simplifiedGeometriesById,layersToReload);
						};
					} else {
						updateFeature(layer,feature,simplifiedGeometriesById,layersToReload);
					};
				};
			};
		};
		
		// Reload layers that need it
		var layerReloaded = false;
		for(var layerId in layersToReload){
			var layer = layersToReload[layerId];
			
			// Accumulate all features
			var features = [];
			for(var fi=0,fe=layer.features.length; fi<fe; ++fi){
				var feature = layer.features[fi];
				
				// If feature is a cluster, iterate over its components
				if( feature.cluster ){
					for(var ci=0,ce=feature.cluster.length; ci<ce; ++ci){
						features[features.length] = feature.cluster[ci];
					};
				} else {
					features[features.length] = feature;
				};
			};
			
			// Remove all features
			layer.removeAllFeatures({silent:true});
			
			// Add them again so that clustering and drawing is based on the
			// new geometry
//			$n2.log('Reload features');
//			for(var i=0;i<features.length;++i){
//				var f = features[i];
//				var g = f.geometry;
//				$n2.log(''+g);
//			};
			layer.addFeatures(features);
			
			layerReloaded = true;
		};
		
		if( !layerReloaded ){
			// No work this time around.
			this._refreshSimplifiedGeometries();
		};
		
		if( layerReloaded ){
			this._updatedStylesInUse();
		};
		
		function updateFeature(layer, f, simplifiedGeometryById, layersToReload){
			var simplifiedGeometry = simplifiedGeometryById[f.fid];
			if( simplifiedGeometry ){
				// Save this information
				if( !f.n2SimplifiedGeoms ){
					f.n2SimplifiedGeoms = {};
				};
				f.n2SimplifiedGeoms[simplifiedGeometry.attName] = simplifiedGeometry;
				
				// If this simplification is already installed, then there is nothing
				// to do
				if( simplifiedGeometry.attName 
				 && simplifiedGeometry.attName !== f.n2CurrentGeomAttName ){
					// If this simplification is not the target simplification,
					// then there is nothing to do
					if( simplifiedGeometry.attName 
					 && simplifiedGeometry.attName === f.n2TargetGeomAttName ){
						// OK, we must install this simplification
						if( simplifiedGeometry.wkt ){
							var f2 = wktFormat.read(simplifiedGeometry.wkt);
							
							var projectedGeom = undefined;
							
							// wktFormat.read() returns an array when WKT is GEOMETRYCOLLECTION
							if( $n2.isArray(f2) ){
								var components = [];
								for(var i=0,e=f2.length; i<e; ++i){
									var vectorFeature = f2[i];
									if( vectorFeature.geometry ){
										components.push(vectorFeature.geometry);
									};
								};
								projectedGeom = new OpenLayers.Geometry.Collection(components);
								
							} else if( f2 && f2.geometry ) {
								projectedGeom = f2.geometry;
							};
							
							if( projectedGeom ){
								// Reproject geometry
								if( simplifiedGeometry.proj ){
									projectedGeom = 
										_this._reprojectGeometryForMap(projectedGeom, simplifiedGeometry.proj);
								};
								
								// Swap geometry
								f.geometry = projectedGeom;
								f.n2CurrentGeomAttName = simplifiedGeometry.attName;
								
								// Mark this layer for reload
								layersToReload[layer.id] = layer;
							};
						};
					};
				};
			};
		};
	},
    
	_getResolutionInProjection: function(proj){
    	var targetResolution = this.map.resolution;
    	
    	if( this.map.projection.getCode() !== proj.getCode() ){
    		// Convert [0,0] and [0,1] to proj
    		var p0 = OpenLayers.Projection.transform({x:0,y:0},this.map.projection,proj);
    		var p1 = OpenLayers.Projection.transform({x:0,y:1},this.map.projection,proj);
    		
    		var factor = Math.sqrt( ((p0.x-p1.x)*(p0.x-p1.x)) + ((p0.y-p1.y)*(p0.y-p1.y)) );
    		
    		targetResolution = this.map.resolution * factor;
    	};
    	
    	return targetResolution;
    },
    
	_reprojectGeometryForMap: function(geom, proj){
    	var targetGeometry = geom;
    	
    	if( this.map.projection.getCode() !== proj.getCode() ){
    		geom.transform(proj,this.map.projection);
    	};
    	
    	return targetGeometry;
    },
	
	// === END -- SIMPLIFIED GEOMETRIES ===================================================

    // === START -- MAP STYLES IN USE ===================================================

    _getMapStylesInUse: function(){
    	var mapStylesInUse = {};

    	for(var i in this.infoLayers){
    		var layerInfo = this.infoLayers[i];
    		layerInfo.accumulateMapStylesInUse(mapStylesInUse);
    	};
		
		return mapStylesInUse;
    },
    
    // Called when the map detects that features have been redrawn
    _updatedStylesInUse: function(){
    	var mapStylesInUse = this._getMapStylesInUse();
    	
    	this._dispatch({
    		type: 'canvasReportStylesInUse'
    		,canvasName: this.getCanvasName()
    		,stylesInUse: mapStylesInUse
    	});
    },
    
    // === END -- MAP STYLES IN USE ===================================================

	redefineFeatureLayerStylesAndRules : function(layerName) {
		var layerInfo = this.getNamedLayerInfo(layerName);
		if (null == layerInfo) {
			alert('redefineFeatureLayerStylesAndRules: unknown layer name: ' + layerName);
		} else {
    		//this._endClicked();
    		layerInfo.olLayer.redraw();    			
		};
	},
	
	recentreMap: function (ll) { // @param ll OpenLayers LonLat in map projection for centre of map
		var z = this.map.getZoom();
		this.map.setCenter(ll, z, false, false);
	},
	
	getResolution: function(){
		return this.map.getResolution();
	},
	
	/**
	 * This is called when the map has moved. 
	 */
	_mapMoved: function(){
		var _this = this;

		if( this.mapWasMoved ) return;
		
		this.mapWasMoved = true;
		setTimeout(function(){
			_this.mapWasMoved = false;
			_this._refreshSimplifiedGeometries();
			_this._updatedStylesInUse();
		},200);
	},
	
	/*
	 * Returns map to initial bounds/extent
	 */
	resetExtent: function(){
		if( this.initialZoomBounds ){
			this.map.zoomToExtent(this.initialZoomBounds);
		};
	},
	
	setInitialExtent: function(bounds, srsName, reset) {

		var initialExt = new OpenLayers.Bounds(bounds[0], bounds[1], bounds[2], bounds[3]);
	
		if( null != srsName ) {
			this.convertBoundsToMapProjection(initialExt, srsName);
		};
	
		this.initialZoomBounds = initialExt;
		
		if( reset ){
			this.resetExtent();
		};
	},
	
	setNewExtent: function(bounds, srsName) { // @param bounds OpenLayers Bounds values in array (in map projection coordinates)

		var maxExt = new OpenLayers.Bounds(bounds[0], bounds[1], bounds[2], bounds[3]);
	
		if( null != srsName ) {
			this.convertBoundsToMapProjection(maxExt, srsName);
		};
	
		this.map.zoomToExtent(
			maxExt
			,true
		);
	},
	
	getMediaPath: function() {
		return this.dbSearchEngine.getRelMediaPath();
	},
	
	getSidePanelName: function() {
		return this.options.sidePanelName;
	},

	getFilterPanelName: function() {
		return this.options.filterPanelName;
	},

	/**
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
	addMapMousePositionListener: function(listener){
		if( typeof(listener) === 'function' ) {
			this.mapMouseMoveListeners.push(listener);
		};
	},

	initiateEditFromGeometry: function(opts_){
		var opts = $n2.extend({
			geometry: null
			,suppressCenter: false
		},opts_);

		if( !opts.geometry ){
			throw 'Geometry must be provided';
		};

    	if( this.currentMode === this.modes.ADD_OR_SELECT_FEATURE ) {
    		this._switchMapMode(this.modes.ADD_OR_SELECT_FEATURE);
    	};
		
		if( opts.suppressCenter ){
			this.editFeatureInfo.suppressCenter = true;
		};
		
		var editLayer = this.editLayer;

		var feature = new OpenLayers.Feature.Vector(opts.geometry);
		editLayer.addFeatures([feature]);

	},
	
	// === START -- DOCUMENT CACHE ===================================================
	
	_retrieveCachedValue: function(id) {
		// Look through the layers
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var layerInfo = this.infoLayers[i];
			var valueMap = this._getCachedValueMap(layerInfo);
			if( valueMap 
			 && valueMap[id]
			 && !valueMap[id].__n2_cache_invalid
			 ) {
				// Make a copy for the caller
				return $n2.document.clone(valueMap[id]);
			};
		};
		
		return null;
	},
	
	_getCachedValueMap: function(layerInfo) {
		var valueMap = undefined;

		if( layerInfo.cachingAllowed ) {
			if( layerInfo.cachedValues ) {
				valueMap = layerInfo.cachedValues;
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
		};
		
		return valueMap;
	},
	
	_clearValueCache: function(layerInfo){
		layerInfo.cachedValues = null;
	},
	
	_cacheInvalidateFeature: function(id) {
		// Invalidate feature on each layer
		for(var i=0,e=this.infoLayers.length; i<e; ++i){
			var layerInfo = this.infoLayers[i];
			var valueMap = this._getCachedValueMap(layerInfo);
			if( valueMap && valueMap[id] ) {
				valueMap[id].__n2_cache_invalid = true;
			};
		};
	},
	
	_cacheUpdateDocumentVersion: function(id,rev){
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
	},

	// === END -- DOCUMENT CACHE ===================================================

	_handleMapMousePosition: function(evt){
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
	},
	
	_getAuthService: function(){
		var auth = null;
		
		if( this.options.directory ) {
			auth = this.options.directory.authService;
		};
		
		return auth;
	},
	
	_getCustomService: function(){
		var cs = null;
		
		if( this.options.directory ) {
			cs = this.options.directory.customService;
		};
		
		return cs;
	},
	
	_getDispatchService: function(){
		var d = null;
		if( this.options.directory ) {
			d = this.options.directory.dispatchService;
		};
		
		return d;
	},
	
	_dispatch: function(m){
		var dispatcher = this._getDispatchService();
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	},
	
	_registerDispatch: function(event, fn){
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
	},
	
	_handleDispatch: function(m){
		var _this = this;

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
			
		} else if( 'documentContentCreated' === type ) {
			var doc = m.doc;
			
			if( doc && doc.nunaliit_geom ){
				// Compute map of layer ids
				var layerIdMap = {};
				if( doc.nunaliit_layers ){
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
			};
			
		} else if( 'documentContentUpdated' === type ) {
			var doc = m.doc;
			var reloaded = false;

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
						
						reloaded = true;
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
			
			if( reloaded ){
				this._updatedStylesInUse();
			};
			
		} else if( 'addLayerToMap' === type ) {
			this._handleAddLayerToMap(m);
			
		} else if( 'selected' === type ) {
			if( m.docId ) {
				var features = this._getMapFeaturesIncludingFid(m.docId);
				this._selectedFeatures(features, [m.docId]);
				
			} else if( m.docIds ) {
				var features = this._getMapFeaturesIncludingFids(m.docIds);
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
			if( m.docId ){
				this._startFocus([m.docId]);
			} else if( m.docIds ){
				this._startFocus(m.docIds);
			};
			
		} else if( 'focusOff' === type ) {
			this._endFocus();
			
		} else if( 'focusOnSupplement' === type ) {
			var fid = m.docId;
			
			// Check if this is still valid
			var valid = true;
			if( m.origin ){
				valid = false;
				if( this.focusInfo 
				 && this.focusInfo.origin
				 && this.focusInfo.origin[m.origin] ){
					valid = true;
				};
			};
			
			if( fid && valid ) {
				this._addFocus({
					fids: [fid]
					,intent: m.intent
				});
			};
			
		} else if( 'findIsAvailable' === type ) {
			// Synchronous call. Response sent on message.
			var doc = m.doc;
			if( doc.nunaliit_geom 
			 && doc.nunaliit_layers ){
				for(var i=0,e=this.infoLayers.length; i<e; ++i) {
					var infoLayer = this.infoLayers[i];
					var layerId = infoLayer.id;
					if( doc.nunaliit_layers.indexOf(layerId) >= 0 ){
						m.isAvailable = true;
						break;
					};
				};
			};
			
		} else if( 'find' === type ) {
			var doc = m.doc;
			if( doc && doc.nunaliit_geom ){
				var x = (doc.nunaliit_geom.bbox[0] + doc.nunaliit_geom.bbox[2]) / 2;
				var y = (doc.nunaliit_geom.bbox[1] + doc.nunaliit_geom.bbox[3]) / 2;
				this._centerMapOnXY(x, y, 'EPSG:4326');
			};
			
			// Remember that this feature is looked for by user
			var fid = m.docId;
			var features = this._getMapFeaturesIncludingFid(fid);
			this._startFindFeature(fid, features);
			
			// Check if we need to turn a layer on
			if( doc && doc.nunaliit_layers ) {
				var visible = false;
				var olLayerToTurnOn = null;
				for(var i=0,e=this.infoLayers.length; i<e; ++i) {
					var infoLayer = this.infoLayers[i];
					var layerId = infoLayer.id;
					var olLayer = infoLayer.olLayer;

					if( doc.nunaliit_layers.indexOf(layerId) >= 0 
					 && olLayer ) {
						if( olLayer.visibility ) {
							visible = true;
						} else {
							olLayerToTurnOn = olLayer;
						};
					};
				};
	
				// Turn on layer
				if( !visible && olLayerToTurnOn ){
					olLayerToTurnOn.setVisibility(true);
				};
			};
			
		} else if( 'searchInitiate' === type ) {
			this._endClicked();
			
		} else if( 'editInitiate' === type ) {
			
			var fid = undefined;
			if( m.doc ){
				fid = m.doc._id;
			};
			
			var feature = null;
			var addGeometryMode = true;
			
			if( fid ){
				var features = this._getMapFeaturesIncludingFid(fid);
				
				if( features.length > 0 ){
					feature = features[0];
				};
				
				if( feature ) {
					this._centerMapOnFeature(feature);
					addGeometryMode = false;
					
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

						addGeometryMode = false;
					};
				};
			};
			
			// Remove feature from map
			this.infoLayers.forEach(function(layerInfo){
				if( layerInfo.featureStrategy ){
					layerInfo.featureStrategy.setEditedFeatureIds([fid]);
				};
			});
			
			this.editFeatureInfo = {};
    		this.editFeatureInfo.fid = fid;
			this.editFeatureInfo.original = {
				data: $n2.document.clone(m.doc)
			};
	    	var effectiveFeature = null;
			if( feature ){
		    	// Remove feature from current layer
		    	var featureLayer = feature.layer;

		    	// Compute the actual underlying feature
		    	if( fid === feature.fid ){
		        	effectiveFeature = feature;
		        	
		    	} else if( feature.cluster ){
		    		for(var i=0,e=feature.cluster.length; i<e; ++i){
		    			if( fid === feature.cluster[i].fid ){
		    	    		effectiveFeature = feature.cluster[i];
		    			};
		    		};
		    	};
		    	
		    	this.editFeatureInfo.original.layer = featureLayer;
		    	this.editFeatureInfo.original.feature = effectiveFeature;
			};
			
			if( addGeometryMode ){
				// Edit a document that does not have a geometry.
				// Allow adding a geometry.
				this.switchToAddGeometryMode(fid);
			} else {
				// Do not provide the effective feature. The event 'editReportOriginalDocument'
				// will provide the original geometry. The effective feature might have a simplified
				// version of the geometry
				this.switchToEditFeatureMode(fid);
			};
			
		} else if( 'editClosed' === type ) {

			var fid = this.editFeatureInfo.fid;
			var reloadRequired = true;
			if( m.cancelled ){
				reloadRequired = false;
			};
			
			// By switching to the navigate mode, the feature on the
			// edit layer will be removed.
			var editFeature = this._removeGeometryEditor();
			this._switchMapMode(this.modes.NAVIGATE);

			// Add back feature to map
			this.infoLayers.forEach(function(layerInfo){
				if( layerInfo.featureStrategy ){
					layerInfo.featureStrategy.setEditedFeatureIds(null);
				};
			});
			
			// If feature was deleted, then remove it from map
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
						};
					});
					
					if( reloadLayer ){
						layer.removeAllFeatures({silent:true});
						layer.addFeatures(featuresToAdd);
					};
				});
			};
			
			this.editFeatureInfo = {};
			this.editFeatureInfo.original = {};
			
			// Reload feature
			if( reloadRequired ){
				var filter = $n2.olFilter.fromFid(fid);
				this._reloadFeature(filter);
			};
			
		} else if( 'editGeometryModified' === type ) {
			if( m._origin !== this ){
				this._geometryModified(m.docId, m.geom, m.proj);
			};

		} else if( 'editReportOriginalDocument' === type ) {
			if( m.geometry 
			 && m.docId === this.editFeatureInfo.fid ){
				// Adjust geometry
				this._geometryModified(m.docId, m.geometry, m.projection);

				var zoomRequired = true;
				if( this.editFeatureInfo.suppressZoom ){
					zoomRequired = false;
				};

				// Zoom/Center
				if( m.doc
				 && m.doc.nunaliit_geom
				 && m.doc.nunaliit_geom.bbox 
				 && m.projection ){
					var xmin = m.doc.nunaliit_geom.bbox[0];
					var ymin = m.doc.nunaliit_geom.bbox[1];
					var xmax = m.doc.nunaliit_geom.bbox[2];
					var ymax = m.doc.nunaliit_geom.bbox[3];
					
					var xdiff = (xmax - xmin) / 3;
					var ydiff = (ymax - ymin) / 3;
					
					// Do not zoom on points
					if( xdiff <= 0 && ydiff <= 0 ){
						zoomRequired = false;
					};
					
					if( zoomRequired ){
						xmin = xmin - xdiff;
						xmax = xmax + xdiff;
						ymin = ymin - ydiff;
						ymax = ymax + ydiff;
						
						this.setNewExtent(
							[xmin,ymin,xmax,ymax]
							,m.projection.getCode()
						);
					} else if( !this.editFeatureInfo.suppressCenter ) {
						// Center on geometry
						var x = (xmin + xmax)/2;
						var y = (ymin + ymax)/2;
						this._centerMapOnXY(x,y,m.projection.getCode());
					};
				};
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
		} else if( 'mapSwitchToEditMode' === type ) {
			this.switchToEditMode();
			
		} else if( 'simplifiedGeometryReport' === type ) {
			this._updateSimplifiedGeometries(m.simplifiedGeometries);

		} else if( 'canvasGetStylesInUse' === type ) {
			if( this.getCanvasName() === m.canvasName ){
				m.stylesInUse = this._getMapStylesInUse();
			};
		};
	},
	
	_modelLayerUpdated: function(layerOptions, state){
		//$n2.log('_modelLayerUpdated',layerOptions, state);
		
		var _this = this;
		var layerInfo = layerOptions._layerInfo;
		var mapLayer = layerInfo.olLayer;

		var mustReproject = false;
        var remoteProjection = mapLayer.projection;
	    var localProjection = layerInfo.olLayer.map.getProjectionObject();
        if( localProjection 
         && false == localProjection.equals(remoteProjection) ) {
        	mustReproject = true;
        };
		
		// Remove features. Remove features that are to be updated
        var featureIdsToRemoveMap = {};
        state.removed.forEach(function(f){
        	featureIdsToRemoveMap[f.fid] = true;
        });
        state.updated.forEach(function(f){
        	featureIdsToRemoveMap[f.fid] = true;
        });
        var featuresToRemove = [];
        var featuresToAdd = [];
		if( mapLayer && mapLayer.features ) {
			var loop;
			var features = mapLayer.features;
			for(loop=0;loop<features.length;++loop) {
				var feature = features[loop];
				if( feature.fid && featureIdsToRemoveMap[feature.fid] ) {
					featuresToRemove.push(feature);
				} else if( feature.cluster ) {
					var removeCluster = false;
					for(var j=0,k=feature.cluster.length; j<k; ++j){
						var f = feature.cluster[j];
						if( f.fid && featureIdsToRemoveMap[f.fid] ){
							removeCluster = true;
						};
					};
					if( removeCluster ){
						featuresToRemove.push(feature);
						for(var j=0,k=feature.cluster.length; j<k; ++j){
							var f = feature.cluster[j];
							if( f.fid && !featureIdsToRemoveMap[f.fid] ){
								featuresToAdd.push(f);
							};
						};
					};
				};
			};
		};
			
		// Prepare features to be added to layer
        state.added.forEach(function(f){
			if( mustReproject ){
	            var geom = f.geometry;
			    if( geom ) {
	        		geom.transform(remoteProjection, localProjection);
	            };
			};
        	featuresToAdd.push(f);
        });
        state.updated.forEach(function(f){
			if( mustReproject ){
	            var geom = f.geometry;
			    if( geom ) {
	        		geom.transform(remoteProjection, localProjection);
	            };
			};
        	featuresToAdd.push(f);
        });

        // Remove features
        if( featuresToRemove.length ){
			mapLayer.destroyFeatures(featuresToRemove);
		};

		// Add features
		if( featuresToAdd.length > 0 ){
			// If in edit mode, first disable editAttribute widget
			this.editModeAddFeatureEnabled = false;

			mapLayer.addFeatures(featuresToAdd);
			
			this.editModeAddFeatureEnabled = true;
		};
		
		// Update styles
		this._updatedStylesInUse();
	},
	
	_handleAddLayerToMap: function(m){
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
$n2.mapAndControls.SuppressPopupHtmlFunction = suppressPopupHtmlFunction;

// Cluster click callback
$n2.mapAndControls.ZoomInClusterClickCallback = zoomInClusterClickCallback;
$n2.mapAndControls.MultiSelectClusterClickCallback = multiSelectClusterClickCallback;

// Widgets
$n2.mapAndControls.TimeTransformMapBridge = TimeTransformMapBridge;
$n2.mapAndControls.ModelMapBridge = ModelMapBridge;
$n2.mapAndControls.HandleWidgetAvailableRequests = HandleWidgetAvailableRequests;
$n2.mapAndControls.HandleWidgetDisplayRequests = HandleWidgetDisplayRequests;

})(jQuery,nunaliit2);
