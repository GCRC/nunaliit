/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.couchModule.js 8494 2012-09-21 20:06:50Z jpfiset $
*/

;(function($,$n2){

var DH = 'n2.couchModule'; // dispatcher handle

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

//=========================================================================
/*
 
      Each style comprises 4 states: normal, hovered, clicked, hoveredClicked. In each,
      style, the states are computed according to the diagram below
      
        normal
          V
          |-------------|--------------|----------------|
          |             |              |                |
          |       hovered delta  clicked delta  hoveredClicked delta
          |             |              |                |
          V             V              V                V
        Normal       Hovered        Clicked       HoveredClicked   (4 states constitute
        State         State          State            State          a style)
      
 
      Base style
          V
          |-------------|--------------|-------------|
          |             |              |             |
          |        point delta     line delta  polygon delta
          |             |              |             |
          |             V              V             V
          |        Point Style     Line Style  Polygon Style     (default styles)
          |
     layer delta
          V
          |-------------|--------------|-------------|
                        |              |             |
                   point delta     line delta  polygon delta
                        |              |             |
                   layer point     layer line   layer polygon
                      delta          delta         delta
                        |              |             |
                        V              V             V
                   Layer Point     Layer Line   Layer Polygon  (styles for layer)
                      Style           Style        Style

     Schema styles are computed the same way as layer styles.
     
     Styles are selected in the following order:
     - if a schema name matches a style, then the matching style is selected
     - if a layer name matches a style, then the matching style is selected
     - the default style is selected
          
*/
var MapFeatureStyles = $n2.Class({
	
	defaultStyle: {
		normal:{
			fillColor: '#ffffff'
			,strokeColor: '#ee9999'
			,strokeWidth: 2
			,fillOpacity: 0.4
			,strokeOpacity: 1
			,strokeLinecap: "round"
			,strokeDashstyle: "solid"
			,pointRadius: 6
			,pointerEvents: "visiblePainted"
		}
		,clicked:{
			strokeColor: "#ff2200"
		}
		,hovered:{
			fillColor: "#0000ff"
		}
		,hoveredClicked:{
			fillColor: "#0000ff"
			,strokeColor: "#ff2200"
		}
	}

	,initialDeltas: {
		base: null
		,point: null
		,line: null
		,polygon: null
	}
	
	,basicStyles: null
	
	,stylesFromLayer: null
	
	,stylesFromSchema: null
	
	,initialize: function(userStyles){
		
		if( userStyles ) {
			this.initialDeltas.base = (userStyles.base ? userStyles.base : null);
			this.initialDeltas.point = (userStyles.point ? userStyles.point : null);
			this.initialDeltas.line = (userStyles.line ? userStyles.line : null);
			this.initialDeltas.polygon = (userStyles.polygon ? userStyles.polygon : null);
		};

		// Create style for default behaviour
		this.basicStyles = this._computeStyleSet({});

		// Creates styles for layers
		this.stylesFromLayer = {};
		if( userStyles && userStyles.layers ){
			for(var layerName in userStyles.layers){
				var layerDef = userStyles.layers[layerName];
				var layerSet = this._computeStyleSet(layerDef);
				this.stylesFromLayer[layerName] = layerSet;
			};
		};
		
		// Create styles for schemas
		this.stylesFromSchema = {};
		if( userStyles && userStyles.schemas ){
			for(var schemaName in userStyles.schemas){
				var schemaDef = userStyles.schemas[schemaName];
				var schemaSet = this._computeStyleSet(schemaDef);
				this.stylesFromSchema[schemaName] = schemaSet;
			};
		};
	}

	/*
	 * Computes the three variants of a style: point, line, polygon
	 */
	,_computeStyleSet: function(setDelta){
		
		var computedSet = {};
		
		computedSet.point = this._computeStyle(
				this.defaultStyle
				,this.initialDeltas.base
				,setDelta.base
				,this.initialDeltas.point
				,setDelta.point
				);
		computedSet.line = this._computeStyle(
				this.defaultStyle
				,this.initialDeltas.base
				,setDelta.base
				,this.initialDeltas.line
				,setDelta.line
				);
		computedSet.polygon = this._computeStyle(
				this.defaultStyle
				,this.initialDeltas.base
				,setDelta.base
				,this.initialDeltas.polygon
				,setDelta.polygon
				);

		return computedSet;
	}

	,_computeStyle: function(baseStyle, delta1_, delta2_){
		
		var computedStyle = {};

		// Compute normal state by applying all deltas
		computedStyle.normal = $n2.extend({},baseStyle.normal);
		for(var i=1,e=arguments.length; i<e; ++i){
			var delta = arguments[i];
			if( delta && delta.normal ) {
				$n2.extend(computedStyle.normal, delta.normal);
			};
		};
		
		// Derive the other states from the normal one
		computedStyle.hovered = $n2.extend({},computedStyle.normal,baseStyle.hovered);
		computedStyle.clicked = $n2.extend({},computedStyle.normal,baseStyle.clicked);
		computedStyle.hoveredClicked = $n2.extend({},computedStyle.normal,baseStyle.hoveredClicked);
		
		// Apply deltas to other states
		for(var i=1,e=arguments.length; i<e; ++i){
			var delta = arguments[i];
			if( delta && delta.hovered ) {
				$n2.extend(computedStyle.hovered, delta.hovered);
			};
			if( delta && delta.clicked ) {
				$n2.extend(computedStyle.clicked, delta.clicked);
			};
			if( delta && delta.hoveredClicked ) {
				$n2.extend(computedStyle.hoveredClicked, delta.hoveredClicked);
			};
		};
		
		computedStyle.normal = new OpenLayers.Style(computedStyle.normal);
		computedStyle.hovered = new OpenLayers.Style(computedStyle.hovered);
		computedStyle.clicked = new OpenLayers.Style(computedStyle.clicked);
		computedStyle.hoveredClicked = new OpenLayers.Style(computedStyle.hoveredClicked);
		
		return computedStyle;
	}
	
	/*
	 * Returns a style map function for a given layer
	 */
	,getStyleMapForLayerInfo: function(layerInfo){
		
		var _this = this;
		
		var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){ 
	        
			// Figure out intent
	        var effectiveIntent = null;
	        
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
	    	
	    	if( null == effectiveIntent ) {
	    		effectiveIntent = 'normal';
	    	};
	    	
	    	// Figure out type of geometry
	    	var geomType = feature.geometry._n2Type;
	    	if( !geomType ){
	    		if( feature.geometry.CLASS_NAME.indexOf('Line') >= 0 ) {
	    			geomType = feature.geometry._n2Type = 'line';
	    		} else if( feature.geometry.CLASS_NAME.indexOf('Polygon') >= 0 ) {
	    			geomType = feature.geometry._n2Type = 'polygon';
	    		} else {
	    			geomType = feature.geometry._n2Type = 'point';
	    		};
	    	};
	    	
	    	var layerId = layerInfo.id;
	    	var schemaName = null;
			if( feature 
			 && feature.data 
			 && feature.data.nunaliit_schema ) {
				schemaName = feature.data.nunaliit_schema;
			};

			var style = null;
			if( schemaName && _this.stylesFromSchema[schemaName] ) {
				style = _this.stylesFromSchema[schemaName][geomType][effectiveIntent];
			};
			if( null == style && layerId && _this.stylesFromLayer[layerId] ) {
				style = _this.stylesFromLayer[layerId][geomType][effectiveIntent];
			};
			if( null == style ) {
				style = _this.basicStyles[geomType][effectiveIntent];
			};
	        
	        return style.createSymbolizer(feature);
		});
		
		return styleMap;
	}
}); 

//=========================================================================	

function isSrsNameSupported(srsName){
	if( typeof(OpenLayers) !== 'undefined'
	 && OpenLayers.Projection
	 && OpenLayers.Projection.transforms
	 && OpenLayers.Projection.transforms[srsName] ){
		return true;
	};
	
	if( typeof(Proj4js) !== 'undefined'
	 && Proj4js.Proj ){
		var proj = new Proj4js.Proj(srsName);
		if( proj.readyToUse ){
			return true;
		};
	};
	
	return false;
};

//=========================================================================	
var Module = $n2.Class({
	
	moduleDoc: null
	
	,atlasDb: null
	
	,initialize: function(moduleDoc, atlasDb){
		this.moduleDoc = moduleDoc;
		this.atlasDb = atlasDb;
	}

	,getModuleInfo: function(){
		var moduleInfo = null;
		if( this.moduleDoc ){
			moduleInfo = this.moduleDoc.nunaliit_module;
		};
		return moduleInfo;
	}

	,getMapInfo: function(){
		var mapInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			mapInfo = moduleInfo.map;
		};
		return mapInfo;
	}

	,getDisplayInfo: function(){
		var displayInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			displayInfo = moduleInfo.display;
		};
		return displayInfo;
	}

	,getEditInfo: function(){
		var editInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			editInfo = moduleInfo.edit;
		};
		return editInfo;
	}
	
	,displayIntro: function($elem){
		var introInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			introInfo = moduleInfo.introduction;
		};
		
		if( !introInfo ){
			$elem.empty();
			return false;

		} else {
			if( 'html' === introInfo.type && introInfo.content ) {
				var content = $n2.couchL10n.getLocalizedString(introInfo.content);
				$elem.html(content);
				return true;
				
			} else if( 'text' === introInfo.type && introInfo.content ) {
				var content = $n2.couchL10n.getLocalizedString(introInfo.content);
				$elem.html(content);
				return true;
				
			} else if( 'attachment' === introInfo.type 
			 && introInfo.attachmentName
			 && this.atlasDb
			 ) {
				var displayId = $n2.getUniqueId();
				$elem.empty().append( $('<div id="'+displayId+'"></div>') );
				var docUrl = this.atlasDb.getDocumentUrl(this.moduleDoc);
				var attUrl = docUrl + '/' + introInfo.attachmentName;
				
				$.ajax({
			    	url: attUrl
			    	,type: 'get'
			    	,async: true
			    	,success: function(intro) {
			    		$('#'+displayId).html(intro);
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						$n2.log('Unable to obtain module intro: '+textStatus);
			    	}
				});
				
				return true;
				
			} else {
				$elem.empty();
				return false;
			};
		}
	}
});
	
//=========================================================================	
var ModuleDisplay = $n2.Class({

	config: null
	
	,moduleName: null
	
	,module: null
	
	,mapControl: null
	
	,displayControl: null

	,titleName: null

	,sidePanelName: null
	
	,filterPanelName: null

	,searchPanelName: null
	
	,loginPanelName: null
	
	,styles: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			moduleName: null
			,moduleDoc: null
			,config: null
			,titleName: 'title'
			,mapName: 'map'
			,sidePanelName: 'side'
			,filterPanelName: 'filters'
			,searchPanelName: 'searchInput'
			,loginPanelName: 'login'
			,styleMapFn: null
			,onSuccess: function(){}
			,onError: function(err){ $n2.reportErrorForced(errorMsg); }
		},opts_);
		
		var _this = this;
	
		this.moduleName = opts.moduleName;
		this.moduleDoc = opts.moduleDoc
		if( !this.moduleName  && !this.moduleDoc ) {
			opts.onError('"moduleName" or "moduleDoc" must be specified');
			return;
		};
		
		this.config = opts.config;
		if( !this.config ) {
			opts.onError('"config" must be specified');
			return;
		};
		
		this.sidePanelName = opts.sidePanelName;
		this.filterPanelName = opts.filterPanelName;
		this.searchPanelName = opts.searchPanelName;
		this.loginPanelName = opts.loginPanelName;
		
		// dispatcher
		var d = this._getDispatcher();
		if( d ){
			d.register(DH,'unselected',function(m){
				_this._initSidePanel();
			});
		};
		
		// Quick access
		var config = this.config;
		var atlasDb = config.atlasDb;
		var atlasDesign = config.atlasDesign;
		
		// Set up login widget
		config.directory.authService.createAuthWidget({
			elemId: this.loginPanelName
		});
		
		/*
		 * Get module document, if required.
		 * 
		 * Allow for the module document to be passed in along with the moduleName.
		 * This allows for run-time insertion of layer options (e.g., styling functions).
		 */
		if( ! $n2.isDefined(this.moduleDoc) ) {
			atlasDb.getDocument({
				docId: this.moduleName
				,onSuccess: moduleDocumentLoaded
				,onError: function(err){ 
					opts.onError('Unable to load module: '+err); 
				}
			});
		} else {
			moduleDocumentLoaded(this.moduleDoc);
		};
		
		function moduleDocumentLoaded(moduleDoc){
			if( !moduleDoc.nunaliit_module ) {
				opts.onError('Loaded document does not include module information');
				return;
			};

			_this.module = new Module(moduleDoc, atlasDb);
			
			var moduleInfo = _this.module.getModuleInfo();
			var mapInfo = _this.module.getMapInfo();
			var displayInfo = _this.module.getDisplayInfo();
			var editInfo = _this.module.getEditInfo();

			// Styles
			_this.styles = new MapFeatureStyles( (mapInfo ? mapInfo.styles : null) );
			
			// Side panel
			_this._initSidePanel();
			
			// Title
			if( moduleInfo && moduleInfo.title ) {
				var title = $n2.couchL10n.getLocalizedString(moduleInfo.title);
				//$('head > title').text('' + moduleInfo.title);
				document.title = title; // needed for IE 6
				$('#'+opts.titleName).text(title);
			} else {
				//$('head > title').text('Nunaliit Atlas');
				document.title = 'Nunaliit Atlas'; // needed for IE 6
				$('#'+opts.titleName).text('Nunaliit Atlas');
			};
			
			// Display Logic 
			var displayOptions = {
				db: atlasDb
				,designDoc: atlasDesign
				,displayPanelName: opts.sidePanelName
				,showService: _this.config.show
				,editor: _this.config.couchEditor
				,uploadService: _this.config.uploadServer
				,serviceDirectory: _this.config.directory
			};
			if( displayInfo && displayInfo.displayOnlyRelatedSchemas ){
				displayOptions.displayOnlyRelatedSchemas 
					= displayInfo.displayOnlyRelatedSchemas;
			};
			if( displayInfo && displayInfo.displayBriefInRelatedInfo ){
				displayOptions.displayBriefInRelatedInfo
					= displayInfo.displayBriefInRelatedInfo;
			};
			$.olkitDisplay = _this.displayControl = new $n2.couchDisplay(displayOptions);
			var defaultDisplaySchemaName = 'object';
			if( displayInfo && displayInfo.defaultSchemaName ){
				defaultDisplaySchemaName = displayInfo.defaultSchemaName;
			};
			config.directory.schemaRepository.getSchema({
				name: defaultDisplaySchemaName
				,onSuccess: function(schema){
					if( $.olkitDisplay.setSchema ) {
						$.olkitDisplay.setSchema(schema);
					};
				}
			});
			
			// Edit logic
			var defaultEditSchemaName = 'object';
			if( editInfo && editInfo.defaultSchemaName ){
				defaultEditSchemaName = editInfo.defaultSchemaName;
			};
			config.directory.schemaRepository.getSchema({
				name: defaultEditSchemaName
				,onSuccess: function(schema){
					config.couchEditor.options.defaultEditSchema = schema;
				}
			});
			if( editInfo && editInfo.newDocumentSchemaNames ){
				if( 'ALL_SCHEMAS' === editInfo.newDocumentSchemaNames ){
					config.couchEditor.options.schema = $n2.CouchEditor.Constants.ALL_SCHEMAS;
					
				} else if( editInfo.newDocumentSchemaNames.length ){
					config.directory.schemaRepository.getSchemas({
						names: editInfo.newDocumentSchemaNames
						,onSuccess: function(schemas){
							config.couchEditor.options.schema = schemas;
						}
						,onError: function(err){
							$n2.log('Error obtaining new edit document schemas: '+err);
						}
					});
				};
			};

			// Search
			var searchInput = $('<input type="text" class="search_panel_input"></input>');
			searchInput.val( _loc('search the atlas') );
			$('#'+_this.searchPanelName).empty().append(searchInput);
			config.directory.searchService.installSearch({
				textInput: searchInput
				,initialSearchText: _loc('search the atlas')
				,dispatchService: config.directory.dispatchService
			});
			
			// Display map
			defineMap();
		};
		
		function defineMap(){
			var mapInfo = _this.module.getMapInfo();
			
			// Add points only
			var addPointsOnly = false;
			if( mapInfo && mapInfo.addPointsOnly ){
				addPointsOnly = mapInfo.addPointsOnly;
			};
			
			// Toggle click
			var toggleClick = false;
			if( mapInfo && mapInfo.toggleClick ){
				toggleClick = mapInfo.toggleClick;
			};
			
			// dbSearchEngine
			var dbSearchEngine = { 
				relMediaPath: './'
			};
			if( mapInfo && mapInfo.dbSearchEngine ){
				dbSearchEngine = mapInfo.dbSearchEngine;
			};
			
			var mapOptions = {
				dbSearchEngine: dbSearchEngine
				,mapIdentifier: opts.mapName
				,mapCoordinateSpecifications: {
					initialBounds: null
				}
				,uniqueIdentifier: '_id'
				,addPointsOnly: addPointsOnly
				,overlays: []
				,toggleClick: toggleClick
				,sidePanelName: opts.sidePanelName
				,filterPanelName: opts.filterPanelName
				,saveFeature: config.couchEditor
				,mapDisplay: null
				,directory: config.directory
			};
			
			// Overlay Layers
			if( mapInfo && mapInfo.overlays ){
				var styleMapFn = opts.styleMapFn;
				if( !styleMapFn ) {
					styleMapFn = function(layerInfo_){ 
						return _this.styles.getStyleMapForLayerInfo(layerInfo_); 
					};
				};
				
				for(var i=0,e=mapInfo.overlays.length; i<e; ++i){
					var layerInfo = mapInfo.overlays[i];
					
					var layerDefiniton = {
						id: layerInfo.id
						,name: layerInfo.name
						,type: layerInfo.type
						,visibility: layerInfo.visibility
						,featurePopupHtmlFn: config.popupHtmlFn
						,featurePopupDelay: 0 // ms
						,styleMapFn: styleMapFn
						,useHoverSound: true
					};
					
					if( 'couchdb' === layerInfo.type ){
						layerDefiniton.options = $n2.extend({
							viewName: 'geom'
							,layerName: null
							,db: atlasDb
							,designDoc: atlasDesign
						},layerInfo.options);
						
						if( !layerDefiniton.options.layerName ){
							layerDefiniton.options.layerName = layerDefiniton.id;
						};
						
					} else {
						layerDefiniton.options = layerInfo.options;
					};

					if( layerInfo.featurePopupDelayMs ){
						layerDefiniton.featurePopupDelay = layerInfo.featurePopupDelayMs;
					};

					if( typeof(layerInfo.useHoverSound) === 'boolean' ){
						layerDefiniton.useHoverSound = layerInfo.useHoverSound;
					};
					
					// Add layer to map
					mapOptions.overlays.push( layerDefiniton );
				};
			};
			
			// Background Layers
			mapOptions.mapDisplay = {};
			if( mapInfo && mapInfo.backgrounds ){
				mapOptions.mapDisplay.backgrounds = mapInfo.backgrounds;
			};

			// Initial Bounds
			var initialBounds = null;
			if( mapInfo && mapInfo.coordinates ){
				initialBounds = mapInfo.coordinates.initialBounds;
				
				if( mapInfo.coordinates.srsName ){
					// Verify if SRS name is supported
					if( false == isSrsNameSupported(mapInfo.coordinates.srsName) ) {
						var msg = _loc('The projection {srsName} is not supported. Atlas may no function properly.',{
							srsName: mapInfo.coordinates.srsName
						});
						alert(msg);
					};
					
					mapOptions.mapDisplay.srsName = mapInfo.coordinates.srsName;
					mapOptions.mapCoordinateSpecifications.srsName = mapInfo.coordinates.srsName;
				};
				
				// If "Google Maps" is specified, then the map must display in
				// EPSG:900913
				if( mapInfo.backgrounds ){
					for(var i=0,e=mapInfo.backgrounds.length; i<e; ++i){
						if( 'Google Maps' === mapInfo.backgrounds[i].type ) {
							mapOptions.mapDisplay.srsName = 'EPSG:900913';
						};
					};
				};
			};
			if( !initialBounds ) {
				opts.onError('Initial map extent not specified');
				return;
			};
			if( mapInfo 
			 && mapInfo.coordinates
			 && mapInfo.coordinates.autoInitialBounds
			 ){
				computeAutoInitialBounds(
					mapOptions
					,initialBounds
					,mapInfo.coordinates.autoInitialBounds
					);
			} else {
				initialBoundsComputed(mapOptions, initialBounds);
			};
		};

		function computeAutoInitialBounds(mapOptions, initialBounds, autoInitialBounds){
			
			// Loop over all layers, computing initial bounding box for
			// each
			var layerBoundingBox = null;
			var layersPending = 0;
			for(var i=0,e=mapOptions.overlays.length; i<e; ++i){
				var layerDef = mapOptions.overlays[i];
				if( layerDef.type === 'couchdb' ){
					++layersPending;
					var layerName = layerDef.options.layerName;
					var designDoc = layerDef.options.designDoc;
					designDoc.queryView({
						viewName: 'geom-layer'
						,startkey: layerName
						,endkey: layerName
						,onlyRows: true
						,reduce: true
						,onSuccess: function(rows){
							if( rows.length > 0 ) {
								reportLayer(rows[0].value);
							} else {
								reportLayer(null);
							};
						}
						,onError: function(errorMsg){ 
							$n2.log('Error computing bounds for layer '+layerName+': '+errorMsg); 
							reportLayer(null);
						}
					});
				};
			};
			testDone();
			
			function reportLayer(bounds){
				--layersPending;
				if( null != bounds ) {
					if( null == layerBoundingBox ) {
						layerBoundingBox = bounds;
					} else {
						if( layerBoundingBox[0] > bounds[0] ) layerBoundingBox[0] = bounds[0];
						if( layerBoundingBox[1] > bounds[1] ) layerBoundingBox[1] = bounds[1];
						if( layerBoundingBox[2] < bounds[2] ) layerBoundingBox[2] = bounds[2];
						if( layerBoundingBox[3] < bounds[3] ) layerBoundingBox[3] = bounds[3];
					};
				};
				testDone();
			};
			
			function testDone(){
				if( layersPending > 0 ){
					return;
				};
				if( null == layerBoundingBox ){
					// Nothing defined by the layers, use initial bounds
					initialBoundsComputed(mapOptions, initialBounds);
	
				} else if( false == _this._isValidBounds(layerBoundingBox) ) {
					$n2.log('Invalid bounding box reported for layer in database.',layerBoundingBox);
					initialBoundsComputed(mapOptions, initialBounds);
					
				} else if( layerBoundingBox[0] >= initialBounds[0]
				 && layerBoundingBox[1] >= initialBounds[1]
				 && layerBoundingBox[2] <= initialBounds[2]
				 && layerBoundingBox[3] <= initialBounds[3]
				 ){
					// Bounds defined by layers fit within the initial one.
					// Just use initial bounds (prevent too much zooming in)
					initialBoundsComputed(mapOptions, initialBounds);
					
				} else if( (layerBoundingBox[2]-layerBoundingBox[0]) < (initialBounds[2]-initialBounds[0]) 
				 || (layerBoundingBox[3]-layerBoundingBox[1]) < (initialBounds[3]-initialBounds[1]) ){
					// The bounds defined by the layer are smaller than that defined by initial
					// bounds. Adjust size of bounds so that zoom is not too high
					
					if( (layerBoundingBox[2]-layerBoundingBox[0]) < (initialBounds[2]-initialBounds[0]) ){
						var l = (initialBounds[2]-initialBounds[0])/2;
						var m = (layerBoundingBox[2]+layerBoundingBox[0])/2;
						layerBoundingBox[0] = m - l;
						layerBoundingBox[2] = m + l;
					};
					
					if( (layerBoundingBox[3]-layerBoundingBox[1]) < (initialBounds[3]-initialBounds[1]) ){
						var l = (initialBounds[3]-initialBounds[1])/2;
						var m = (layerBoundingBox[3]+layerBoundingBox[1])/2;
						layerBoundingBox[1] = m - l;
						layerBoundingBox[3] = m + l;
					};
					initialBoundsComputed(mapOptions, layerBoundingBox);
					
				} else {
					initialBoundsComputed(mapOptions, layerBoundingBox);
				};
			};
		};
		
		function initialBoundsComputed(mapOptions, initialBounds){

			mapOptions.mapCoordinateSpecifications.initialBounds = initialBounds;
			
			// Map max extent
			var mapInfo = _this.module.getMapInfo();
			if( mapInfo 
			 && mapInfo.coordinates
			 && mapInfo.coordinates.maxExtent
			 ){
				mapOptions.mapCoordinateSpecifications.maxExtent = 
					mapInfo.coordinates.maxExtent;
			};
			
			_this.mapControl = nunaliit2.mapAndControls(mapOptions);
			$n2.log('module',_this);
			
			_this.mapControl.contributions = config.contributions;
			_this.mapControl.requests = config.requests;
			
			opts.onSuccess(_this);
		};
	}

	,_initSidePanel: function() {
		var $elem = $('#'+this.sidePanelName);
		this.module.displayIntro($elem);
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.config.directory ){
			d = this.config.directory.dispatchService;
		};
		return d;
	}
	
	,_isValidBounds: function(bounds){
		if( !bounds.length ) return false;
		if( bounds.length < 4 ) return false;
		
		if( bounds[0] < -180 || bounds[0] > 180 ) return false;
		if( bounds[2] < -180 || bounds[2] > 180 ) return false;
		if( bounds[1] < -90 || bounds[1] > 90 ) return false;
		if( bounds[3] < -90 || bounds[3] > 90 ) return false;
		
		return true;
	}
});

$n2.couchModule = {
	ModuleDisplay: ModuleDisplay
};

})(jQuery,nunaliit2);