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

	,getSearchInfo: function(){
		var searchInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			searchInfo = moduleInfo.search;
		};
		return searchInfo;
	}
	
	/*
	 * Finds the introduction text associated with the module and inserts it
	 * in the element provided. Once the content of the introduction is loaded
	 * in the DOM, the "onLoaded" function is called.
	 */
	,displayIntro: function(opts_){
		var opts = $n2.extend({
			elem: null
			,showService: null
			,onLoaded: function(){}
		},opts_);
		
		var $elem = opts.elem;
		
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
				
				$elem.empty();
				var $outer = $('<div>')
					.addClass('n2ModuleIntro n2ModuleIntro_html')
					.appendTo($elem);
				
				var content = $n2.couchL10n.getLocalizedString(introInfo.content);
				if( content ) {
					$outer.html(content);
				};
				opts.onLoaded();
				return true;
				
			} else if( 'text' === introInfo.type && introInfo.content ) {
				
				$elem.empty();
				var $outer = $('<div>')
					.addClass('n2ModuleIntro n2ModuleIntro_text')
					.appendTo($elem);
				
				var content = $n2.couchL10n.getLocalizedString(introInfo.content);
				if( content ) {
					var $wrapper = $('<div>')
						.text(content);
					$outer
						.empty()
						.append($wrapper);
					
					if( opts.showService ) {
						$wrapper.addClass('n2s_preserveSpaces');
						opts.showService.fixElementAndChildren($wrapper);
					};
				};
				opts.onLoaded();
				return true;
				
			} else if( 'attachment' === introInfo.type 
			 && introInfo.attachmentName
			 && this.atlasDb
			 ) {
				var displayId = $n2.getUniqueId();
				$elem.empty();
				$('<div>')
					.attr('id', displayId)
					.addClass('n2ModuleIntro n2ModuleIntro_attachment')
					.appendTo($elem);
				
				var localeStr = $n2.l10n.getStringForLocale(introInfo.attachmentName);
				if( localeStr.str ) {
					var attUrl = this.atlasDb.getAttachmentUrl(this.moduleDoc,localeStr.str);
					
					$.ajax({
				    	url: attUrl
				    	,type: 'get'
				    	,async: true
				    	,success: function(intro) {
				    		if( localeStr.fallback ){
				    			var $inner = $('<span class="n2_localized_string n2_localize_fallback"></span>');
				    			$('<span class="n2_localize_fallback_lang"></span>')
				    				.text('('+localeStr.lang+')')
				    				.appendTo($inner);
				    			$('<span></span>')
				    				.html(intro)
				    				.appendTo($inner);
			    				$('#'+displayId).empty().append($inner);
				    		} else {
					    		$('#'+displayId).html(intro);
				    		};
							opts.onLoaded();
				    	}
				    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
							$n2.log('Unable to obtain module intro: '+textStatus);
				    	}
					});
				};
				
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

	,moduleTitleName: null
	
	,contentName: null

	,mapName: null
	
	,mapInteractionName: null

	,sidePanelName: null
	
	,filterPanelName: null

	,searchPanelName: null
	
	,loginPanelNames: null
	
	,navigationName: null
	
	,navigationDoc: null
	
	,languageSwitcherName: null
	
	,helpButtonName: null
	
	,helpDialogId: null
	
	,styleMapFn: null
	
	,styles: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			moduleName: null
			,moduleDoc: null
			,config: null
			,titleName: 'title'
			,moduleTitleName: 'module_title'
			,contentName: null // specify contentName, or mapName+sidePanelName+mapInteractionName+searchPanelName
			,mapName: 'map'
			,mapInteractionName: 'map_interaction_div'
			,sidePanelName: 'side'
			,filterPanelName: 'filters'
			,searchPanelName: null
			,loginPanelName: 'login'
			,loginPanels: null
			,navigationName: 'navigation'
			,navigationDoc: null
			,languageSwitcherName: null
			,helpButtonName: null
			,styleMapFn: null
			,onSuccess: function(moduleDisplay){}
			,onError: function(err){ $n2.reportErrorForced(errorMsg); }
		},opts_);
		
		var _this = this;
	
		this.moduleName = opts.moduleName;
		this.moduleDoc = opts.moduleDoc;
		if( !this.moduleName  && !this.moduleDoc ) {
			opts.onError('"moduleName" or "moduleDoc" must be specified');
			return;
		};
		
		this.config = opts.config;
		if( !this.config ) {
			opts.onError('"config" must be specified');
			return;
		};
		
		this.contentName = opts.contentName;
		this.mapName = opts.mapName;
		this.mapInteractionName = opts.mapInteractionName;
		this.sidePanelName = opts.sidePanelName;
		this.filterPanelName = opts.filterPanelName;
		this.searchPanelName = opts.searchPanelName;
		this.navigationName = opts.navigationName;
		this.navigationDoc = opts.navigationDoc;
		this.titleName = opts.titleName;
		this.moduleTitleName = opts.moduleTitleName;
		this.languageSwitcherName = opts.languageSwitcherName;
		this.helpButtonName = opts.helpButtonName;
		this.styleMapFn = opts.styleMapFn;

		// Login panels
		this.loginPanelNames = [];
		if( opts.loginPanels ){
			$(opts.loginPanels).each(function(){
				var $loginPanel = $(this);
				var id = $loginPanel.attr('id');
				if( !id ){
					id = $n2.getUniqueId();
					$loginPanel.attr('id',id);
				};
				_this.loginPanelNames.push(id);
			});
		} else if( opts.loginPanelName ) {
			this.loginPanelNames.push(opts.loginPanelName);
		};
		
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
		var documentSource = config.documentSource;
		var customService = this._getCustomService();
		
		// Set up login widget
		for(var i=0,e=this.loginPanelNames.length;i<e;++i){
			var loginPanelName = this.loginPanelNames[i];
			config.directory.authService.createAuthWidget({
				elemId: loginPanelName
			});
		};
		
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
		
		/*
		 * Get navigation document, if required.
		 */
		if( this.navigationDoc ){
			
			var navDocNeeded = false;
			
			if( $('#'+this.navigationName).length > 0 ){
				$('#'+this.navigationName).empty();
				navDocNeeded = true;
			};
			
			if( $('#'+this.titleName).length > 0 ){
				$('#'+this.titleName).empty();
				navDocNeeded = true;
			};
			
			if( navDocNeeded ) {
				atlasDb.getDocument({
					docId: this.navigationDoc
					,onSuccess: function(doc){
						_this._navigationDocumentLoaded(doc);
					}
					,onError: function(err){ 
						$n2.log('Error obtaining navigation document '+_this.navigationDoc,err); 
					}
				});
			};
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
			var searchInfo = _this.module.getSearchInfo();
			
			// Handle content div
			if( _this.contentName ){
				var $contentDiv = $('#'+_this.contentName)
					.empty()
					;
				
				if( mapInfo ) {
					_this.mapName = $n2.getUniqueId();
					$('<div></div>')
						.attr('id',_this.mapName)
						.addClass('n2_content_map')
						.appendTo($contentDiv);
					$contentDiv.addClass('n2_content_contains_map');

					_this.mapInteractionName = $n2.getUniqueId();
					$('<div></div>')
						.attr('id',_this.mapInteractionName)
						.addClass('n2_content_map_interaction')
						.appendTo($contentDiv);

				} else {
					_this.mapName = null;
					_this.mapInteractionName = null;
					$contentDiv.addClass('n2_content_contains_no_map');
				};
				
				if( searchInfo && searchInfo.disabled ) {
					_this.searchPanelName = null;
					$contentDiv.addClass('n2_content_contains_no_search');
				} else if( _this.searchPanelName ) {
					// Search panel is specified. No need to create
					$contentDiv.addClass('n2_content_contains_search');

				} else {
					_this.searchPanelName = $n2.getUniqueId();
					$('<div></div>')
						.attr('id',_this.searchPanelName)
						.addClass('n2_content_searchInput')
						.appendTo($contentDiv);
					$contentDiv.addClass('n2_content_contains_search');
				};
				
				_this.sidePanelName = $n2.getUniqueId();
				$('<div></div>')
					.attr('id',_this.sidePanelName)
					.addClass('n2_content_text')
					.appendTo($contentDiv);
				$contentDiv.addClass('n2_content_contains_text');
			};

			// Styles
			_this.styles = new $n2.mapStyles.MapFeatureStyles( (mapInfo ? mapInfo.styles : null) );
			
			// Side panel
			_this._initSidePanel();
			
			// Title
			if( moduleInfo && moduleInfo.title ) {
				var title = $n2.couchL10n.getLocalizedString(moduleInfo.title);
				//$('head > title').text('' + moduleInfo.title);
				if( title ) {
					document.title = title; // needed for IE 6
					_this._installModuleTitle($('#'+opts.moduleTitleName), title);
				};
			} else {
				var title = _loc('Nunaliit Atlas');
				//$('head > title').text(title);
				document.title = title; // needed for IE 6
				_this._installModuleTitle($('#'+opts.moduleTitleName), title);
			};
			
			// Language switcher
			if( _this.languageSwitcherName
			 && _this.config.directory.languageService ){
				_this.config.directory.languageService.drawWidget({
					elemId: _this.languageSwitcherName
				});
			};
			
			// Help button
			if( moduleInfo.help && _this.helpButtonName ){
				_this._installHelpButton();
			};
			
			var displayFormat = 'classic';
			if( customService ){
				displayFormat = customService.getOption('displayFormat',displayFormat);
			};
			
			if( displayFormat === 'tiled' ) {
				$('body').addClass('n2_display_format_tiled');
				_this.displayControl = new $n2.couchDisplayTiles.TiledDisplay({
					documentSource: documentSource
					,displayPanelName: _this.sidePanelName
					,showService: config.directory.showService
					,editor: config.couchEditor
					,uploadService: config.directory.uploadService
					,authService: config.directory.authService
					,requestService: config.directory.requestService
					,schemaRepository: config.directory.schemaRepository
					,customService: config.directory.customService
					,dispatchService: config.directory.dispatchService
				});
				
			} else {
				if( 'classic' !== displayFormat ){
					$n2.log('Unknown display format: '+displayFormat+' Reverting to classic display.');
				};
				
				// Classic Display Logic 
				var displayOptions = {
					documentSource: documentSource
					,displayPanelName: _this.sidePanelName
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
				_this.displayControl = new $n2.couchDisplay.Display(displayOptions);
				var defaultDisplaySchemaName = 'object';
				if( displayInfo && displayInfo.defaultSchemaName ){
					defaultDisplaySchemaName = displayInfo.defaultSchemaName;
				};
				config.directory.schemaRepository.getSchema({
					name: defaultDisplaySchemaName
					,onSuccess: function(schema){
						if( _this.displayControl.setSchema ) {
							_this.displayControl.setSchema(schema);
						};
					}
				});
			};
			
			
			// Edit logic
			config.couchEditor.setPanelName(_this.sidePanelName);
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
			if( _this.searchPanelName ) {
				var searchInput = $('<input type="text" class="search_panel_input"></input>');
				searchInput.val( _loc('search the atlas') );
				$('#'+_this.searchPanelName).empty().append(searchInput);
				config.directory.searchService.installSearch({
					textInput: searchInput
					,initialSearchText: _loc('search the atlas')
					,dispatchService: config.directory.dispatchService
				});
			};
			
			// Display map
			if( mapInfo ) {
				_this._initializeMap({
					config: config
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			} else {
				opts.onSuccess(_this);
			};
		};
		
	}

	,_initializeMap: function(opts_){
		var opts = $n2.extend({
			config: null
			,onSuccess: function(moduleDisplay){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
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
			,mapIdentifier: _this.mapName
			,mapInteractionDivName: _this.mapInteractionName
			,mapCoordinateSpecifications: {
				initialBounds: null
			}
			,uniqueIdentifier: '_id'
			,addPointsOnly: addPointsOnly
			,overlays: []
			,toggleClick: toggleClick
			,sidePanelName: _this.sidePanelName
			,filterPanelName: _this.filterPanelName
			,saveFeature: _this.config.couchEditor
			,mapDisplay: {}
			,directory: _this.config.directory
			,layerSwitcher: {
				suppress: false
				,initiallyOpened: false
			}
		};
		
		// Layer selector
		if( mapInfo && mapInfo.layerSelector ){
			if( mapInfo.layerSelector.suppress ){
				mapOptions.layerSwitcher.suppress = true;
			};
			
			if( mapInfo.layerSelector.initiallyOpened ){
				mapOptions.layerSwitcher.initiallyOpened = true;
			};
		};
	
		// Initial Bounds, Map coordinates
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
			} else {
				// Defaults to EPSG:4326
				mapOptions.mapDisplay.srsName = 'EPSG:4326';
				mapOptions.mapCoordinateSpecifications.srsName = 'EPSG:4326';
			};
			
			// Detect forced display projections based on background layer
			if( mapInfo.backgrounds ){
				for(var i=0,e=mapInfo.backgrounds.length; i<e; ++i){
					if( 'Google Maps' === mapInfo.backgrounds[i].type ) {
						mapOptions.mapDisplay.srsName = 'EPSG:900913';
						
					} else if( 'osm' === mapInfo.backgrounds[i].type ) {
						mapOptions.mapDisplay.srsName = 'EPSG:900913';
						
					} else if( 'stamen' === mapInfo.backgrounds[i].type ) {
						mapOptions.mapDisplay.srsName = 'EPSG:900913';
					};
				};
			};
		};
		
		// Background Layers
		if( mapInfo && mapInfo.backgrounds ){
			mapOptions.mapDisplay.backgrounds = [];
			for(var i=0,e=mapInfo.backgrounds.length; i<e; ++i){
				var l = $n2.extend({},mapInfo.backgrounds[i]);

				if( l.type === 'image' ){
					if( l.options && l.options.attachmentName ){
						var url = _this.config.atlasDb.getAttachmentUrl(
							this.module.moduleDoc
							,l.options.attachmentName
						);
						l.options.url = url;
					};

					if( l.options 
					 && l.options.extent 
					 && mapOptions.mapDisplay.srsName != mapOptions.mapCoordinateSpecifications.srsName ){
						var defProj = new OpenLayers.Projection(mapOptions.mapCoordinateSpecifications.srsName);
						var mapProj = new OpenLayers.Projection(mapOptions.mapDisplay.srsName);
						var bl = new OpenLayers.Geometry.Point(l.options.extent[0], l.options.extent[1]);
						var tr = new OpenLayers.Geometry.Point(l.options.extent[2], l.options.extent[3]);
						bl.transform(defProj,mapProj);
						tr.transform(defProj,mapProj);
						l.options.extent[0] = bl.x;
						l.options.extent[1] = bl.y;
						l.options.extent[2] = tr.x;
						l.options.extent[3] = tr.y;
					};
				};
				
				mapOptions.mapDisplay.backgrounds.push(l);
			};
		};
	
		// Overlay Layers
		if( mapInfo && mapInfo.overlays ){
			var styleMapFn = _this.styleMapFn;
			if( !styleMapFn ) {
				styleMapFn = function(layerInfo_){ 
					return _this.styles.getStyleMapForLayerInfo(layerInfo_); 
				};
			};
			
			for(var i=0,e=mapInfo.overlays.length; i<e; ++i){
				var layerInfo = mapInfo.overlays[i];
				
				var layerDefinition = {
					id: layerInfo.id
					,name: layerInfo.name
					,type: layerInfo.type
					,visibility: layerInfo.visibility
					,featurePopupHtmlFn: _this.config.popupHtmlFn // legacy
					,featurePopupDelay: 0 // ms
					,styleMapFn: styleMapFn
					,useHoverSound: true
					,clustering: false
				};
				
				if( 'couchdb' === layerInfo.type ){
					layerDefinition.options = $n2.extend({
						viewName: 'geom'
						,layerName: null
						,documentSource: _this.config.documentSource
					},layerInfo.options);

					if( !layerDefinition.options.layerName ){
						layerDefinition.options.layerName = layerDefinition.id;
					};
					if( !layerDefinition.id 
					 && layerDefinition.options
					 && layerDefinition.options.layerName ){
						layerDefinition.id = layerDefinition.options.layerName;
					};
					
				} else {
					layerDefinition.options = layerInfo.options;
				};
	
				if( layerInfo.featurePopupDelayMs ){
					layerDefinition.featurePopupDelay = layerInfo.featurePopupDelayMs;
				};
	
				if( typeof(layerInfo.useHoverSound) === 'boolean' ){
					layerDefinition.useHoverSound = layerInfo.useHoverSound;
				};
				
				if( layerInfo.clustering ){
					layerDefinition.clustering = layerInfo.clustering;
				};
				
				// Add layer to map
				mapOptions.overlays.push( layerDefinition );
			};
		};
		
		// Adjust projection on couchDb overlays
		for(var i=0,e=mapOptions.overlays.length; i<e; ++i){
			var layerDefinition = mapOptions.overlays[i];
			
			if( layerDefinition.type === 'couchdb' ){
				layerDefinition.sourceSrsName = mapOptions.mapDisplay.srsName;
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
		
		function computeAutoInitialBounds(mapOptions, initialBounds, autoInitialBounds){
			
			// Loop over all layers, computing initial bounding box for
			// each
			var layerBoundingBox = null;
			var layersPending = 0;
			for(var i=0,e=mapOptions.overlays.length; i<e; ++i){
				var layerDef = mapOptions.overlays[i];
				if( layerDef.type === 'couchdb' ){
					++layersPending;
					var documentSource = layerDef.options.documentSource;
					var layerName = layerDef.options.layerName;
					documentSource.getGeographicBoundingBox({
						layerId: layerName
						,onSuccess: function(bbox){
							reportLayer(bbox);
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
				if( null == bounds ) {
					// ignore
				} else if( false == _this._isValidBounds(bounds) ) {
					// ignore
				} else {
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
				
				// If nothing specified by layers, just use what the user specified
				if( null == layerBoundingBox ){
					// Nothing defined by the layers, use initial bounds
					initialBoundsComputed(mapOptions, initialBounds);
					return;
				};
		
				// If computations from layers is invalid, use the initial bounds specified
				// by user
				if( false == _this._isValidBounds(layerBoundingBox) ) {
					$n2.log('Invalid bounding box reported for layer in database.',layerBoundingBox);
					initialBoundsComputed(mapOptions, initialBounds);
					return;
				};
				
				// layerBoundingBox is in EPSG:4326
				// initialBounds is in the user coordinate projection
				var userInitialBounds = new OpenLayers.Bounds(
						initialBounds[0]
						,initialBounds[1]
						,initialBounds[2]
						,initialBounds[3]
						);
				var layerInitialBounds = new OpenLayers.Bounds(
						layerBoundingBox[0]
						,layerBoundingBox[1]
						,layerBoundingBox[2]
						,layerBoundingBox[3]
						);
				if( mapOptions.mapCoordinateSpecifications.srsName !== 'EPSG:4326' ){
					var userProj = new OpenLayers.Projection(mapOptions.mapCoordinateSpecifications.srsName);
					var dbProj = new OpenLayers.Projection('EPSG:4326');
					layerInitialBounds.transform(dbProj,userProj);
				};
				
				if( userInitialBounds.containsBounds(layerInitialBounds) ){
					// Bounds defined by layers fit within the one specified by user.
					// Just use initial bounds (prevent too much zooming in)
					initialBoundsComputed(mapOptions, initialBounds);
					
				} else if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() 
				 || layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
					// The bounds defined by the layers are smaller than that of the bounds
					// specified by user. Adjust size of bounds so that zoom is not too high
					
					if( layerInitialBounds.getWidth() < userInitialBounds.getWidth() ){
						var l = userInitialBounds.getWidth()/2;
						var m = (layerInitialBounds.left+layerInitialBounds.right)/2;
						layerInitialBounds.left = m - l;
						layerInitialBounds.right = m + l;
					};
					
					if( layerInitialBounds.getHeight() < userInitialBounds.getHeight() ){
						var l = userInitialBounds.getHeight()/2;
						var m = (layerInitialBounds.bottom+layerInitialBounds.top)/2;
						layerInitialBounds.bottom = m - l;
						layerInitialBounds.top = m + l;
					};
					initialBoundsComputed(mapOptions, [
						layerInitialBounds.left
						,layerInitialBounds.bottom
						,layerInitialBounds.right
						,layerInitialBounds.top
					]);
					
				} else {
					// Use bounds computed by layers
					initialBoundsComputed(mapOptions, [
							layerInitialBounds.left
							,layerInitialBounds.bottom
							,layerInitialBounds.right
							,layerInitialBounds.top
						]);
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
				
			} else if( mapOptions.mapDisplay.srsName !== null 
			 && mapOptions.mapDisplay.srsName !== 'EPSG:4326' ) {
				mapOptions.mapCoordinateSpecifications.maxExtent =
					mapOptions.mapCoordinateSpecifications.initialBounds;
			};
			
			// Create map control
			_this.mapControl = nunaliit2.mapAndControls(mapOptions);
			$n2.log('module',_this);
			
			_this.mapControl.contributions = _this.config.contributions;
			_this.mapControl.requests = _this.config.requests;
			
			opts.onSuccess(_this);
		};
	}

	,_navigationDocumentLoaded: function(doc){
		if( doc && doc.nunaliit_navigation ){
			// Atlas title
			var $title = $('#'+this.titleName);
			if( $title.length > 0 ){
				if( doc.nunaliit_navigation.title ){
					var title = $n2.couchL10n.getLocalizedString(doc.nunaliit_navigation.title);
					$title.text(title);
				} else {
					$title.empty();
				};
			};
			
			// Navigation menu
			var $nav = $('#'+this.navigationName);
			if( $nav.length > 0 ) {
				$nav.empty();
				
				if( doc.nunaliit_navigation.items 
				 && doc.nunaliit_navigation.items.length > 0 ) {
					var $ul = $('<ul></ul>');
					$nav.append($ul);
					
					insertItems($ul, doc.nunaliit_navigation.items);
				};
			};
		};
		
		function insertItems($ul, items){
			for(var i=0,e=items.length; i<e; ++i){
				var item = items[i];
				
				var $li = $('<li></li>');
				$ul.append($li);

				if( item.title && item.href ) {
					var $a = $('<a></a>');
					$a.attr('href',item.href);
					var title = $n2.couchL10n.getLocalizedString(item.title);
					$a.text(title);
					$li.append($a);
				} else if( item.title ) {
					var $span = $('<span></span>');
					var title = $n2.couchL10n.getLocalizedString(item.title);
					$span.text(title);
					$li.append($span);
				};
				
				if( item.items && item.items.length > 0 ){
					var $innerUl = $('<ul></ul>');
					$li.append($innerUl);
					insertItems($innerUl, item.items);
				};
			};
		};
	}

	,_initSidePanel: function() {
		var _this = this;
		var $elem = $('#'+this.sidePanelName);
		
		this.module.displayIntro({
			elem: $elem
			,showService: this._getShowService()
			,onLoaded: function(){
				_this._sendDispatchMessage({type:'loadedModuleContent'});
			}
		});
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.config.directory ){
			d = this.config.directory.dispatchService;
		};
		return d;
	}
	
	,_getShowService: function(){
		var ss = null;
		if( this.config.directory ){
			ss = this.config.directory.showService;
		};
		return ss;
	}
	
	,_getCustomService: function(){
		var cs = null;
		if( this.config.directory ){
			cs = this.config.directory.customService;
		};
		return cs;
	}
	
	,_sendDispatchMessage: function(m){
		var d = this._getDispatcher();
		if( d ){
			d.send(DH,m);
		};
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
	
	,_installModuleTitle: function($elem, text){
		var _this = this;
		
		var $a = $('<a class="nunaliit_module_title_link" href="#"></a>');
		$a.text(text);
		
		$elem.empty().append($a);
		
		$a.click(function(e){
			var d = _this._getDispatcher();
			if( d ){
				d.send(DH,{
					type: 'mapResetExtent'
				});
			};
			
			// Follow link
			return true;
		});
	}
	
	,_installHelpButton: function(){
		var _this = this;
		
		var $elem = $('#'+this.helpButtonName);
		if( $elem.length < 1 ) return; // nothing to do
		
		$elem.empty();
		
		// Load help text
		var moduleInfo = this.module.getModuleInfo();
		if( moduleInfo.help 
		 && moduleInfo.help.nunaliit_type === 'reference'
		 && moduleInfo.help.doc ){
			// load up help document
			this.config.atlasDb.getDocument({
				docId: moduleInfo.help.doc
				,onSuccess: function(doc){
					if( doc 
					 && doc.nunaliit_help
					 && doc.nunaliit_help.type === 'html'
					 && doc.nunaliit_help.content ){
						helpContentHtml(doc.nunaliit_help.content);
					} else {
						$n2.log('Do not know how to interpret help document');
						$elem.attr('n2_error','Do not know how to interpret help document');
					};
				}
				,onError: function(err){
					$n2.log('Unable to load help document',err);
					$elem.attr('n2_error','Unable to load help document'+err);
				}
			});
			
		} else {
			$n2.log('Do not know how to handle help information');
			$elem.attr('n2_error','Do not know how to handle help information');
		};

		function helpContentHtml(baseContent){
			// localize content
			var content = _loc(baseContent);
			
			var $a = $('<a class="nunaliit_module_help_button" href="#"></a>');
			$a.text( _loc('Help') );
			
			$('#'+_this.helpButtonName)
				.empty()
				.append($a);
			
			$a.click(function(){
				if( !_this.helpDialogId ){
					_this.helpDialogId = $n2.getUniqueId();
				};
				
				// If open, then close it
				var $dialog = $('#'+_this.helpDialogId);
				if( $dialog.length > 0 ){
					var isOpen = $dialog.dialog('isOpen');
					if( isOpen  ) {
						$dialog.dialog('close');
					} else {
						$dialog.dialog('open');
					};
				} else {
					$dialog = $('<div id="'+_this.helpDialogId+'" class="n2module_help_content"></div>');
					$dialog
						.html(content)
						.appendTo( $('body') );
					
					var initialHeight = $dialog.height();
					
					var windowHeight = $(window).height();
					var diagMaxHeight = Math.floor(windowHeight * 0.8);

					var dialogOptions = {
						autoOpen: true
						,dialogClass:'n2module_help_dialog'
						,title: _loc('Help')
						,modal: false
						,width: 400
						,position:{
							my: 'right top'
							,at: 'right bottom'
							,of: $('#'+_this.helpButtonName+' .nunaliit_module_help_button')
						}
						,close: function(event, ui){
							var diag = $(event.target);
							diag.dialog('destroy');
							diag.remove();
						}
					};
					
					// Ensure height does not exceed maximum
					if( initialHeight > diagMaxHeight ){
						dialogOptions.height = diagMaxHeight;
					};
					
					$dialog.dialog(dialogOptions);
				};
			});
		};
	}
});

$n2.couchModule = {
	ModuleDisplay: ModuleDisplay
};

})(jQuery,nunaliit2);