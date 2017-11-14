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
*/

;(function($,$n2){
"use strict";

var 
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
	,DH = 'n2.couchModule'
	;

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
	
	moduleDoc: null,
	
	atlasDb: null,
	
	initialize: function(moduleDoc, atlasDb){
		this.moduleDoc = moduleDoc;
		this.atlasDb = atlasDb;
	},

	getModuleInfo: function(){
		var moduleInfo = null;
		if( this.moduleDoc ){
			moduleInfo = this.moduleDoc.nunaliit_module;
		};
		return moduleInfo;
	},

	getMapInfo: function(){
		var mapInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			mapInfo = moduleInfo.map;
		};
		return mapInfo;
	},

	getCanvasInfo: function(){
		var canvasInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			canvasInfo = moduleInfo.canvas;
		};
		return canvasInfo;
	},

	getDisplayInfo: function(){
		var displayInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			displayInfo = moduleInfo.display;
		};
		return displayInfo;
	},

	getEditInfo: function(){
		var editInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			editInfo = moduleInfo.edit;
		};
		return editInfo;
	},

	getSearchInfo: function(){
		var searchInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			searchInfo = moduleInfo.search;
		};
		return searchInfo;
	},

	getModelInfos: function(){
		var modelInfos = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			modelInfos = moduleInfo.models;
		};
		if( !modelInfos ){
			modelInfos = [];
		};
		return modelInfos;
	},
	
	getUtilityInfos: function(){
		var utilityInfos = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			utilityInfos = moduleInfo.utilities;
		};
		if( !utilityInfos ){
			utilityInfos = [];
		};
		return utilityInfos;
	},

	getWidgetInfos: function(){
		var widgetInfos = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			widgetInfos = moduleInfo.widgets;
		};
		if( !widgetInfos ){
			widgetInfos = [];
		};
		return widgetInfos;
	},

	getModuleCSS: function(){
		var css;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			css = moduleInfo.css;
		};
		return css;
	},
	
	/*
	 * Finds the introduction text associated with the module and inserts it
	 * in the element provided. Once the content of the introduction is loaded
	 * in the DOM, the "onLoaded" function is called.
	 */
	displayIntro: function(opts_){
		var opts = $n2.extend({
			elem: null
			,showService: null
			,dispatchService: null
			,onLoaded: function(){}
		},opts_);
		
		var _this = this;
		var $elem = opts.elem;
		
		var introInfo = null;
		var moduleInfo = this.getModuleInfo();
		if( moduleInfo ){
			introInfo = moduleInfo.introduction;
		};

		// Keep track if we need to empty content area
		var introDisplayed = false;

		// Via the dispatcher, see if a component can display introduction
		if( opts.dispatchService ){
			var msg = {
				type: 'modulePerformIntroduction'
				,performed: false
				,elem: opts.elem
				,module: this
			};
			opts.dispatchService.synchronousCall(DH,msg);
			
			// If an introduction was performed, then no need
			// to empty the element
			if( msg.performed ){
				introDisplayed = true;
			};
		};
		
		if( !introDisplayed && introInfo ){
			if( 'html' === introInfo.type && introInfo.content ) {
				
				$elem.empty();
				var $outer = $('<div>')
					.addClass('n2ModuleIntro n2ModuleIntro_html')
					.appendTo($elem);
				
				var content = _loc(introInfo.content);
				if( content ) {
					$outer.html(content);
					
					if( opts.showService ) {
						opts.showService.fixElementAndChildren($outer, {}, this.moduleDoc);
					};					
				};
				opts.onLoaded();
				introDisplayed = true;
				
			} else if( 'text' === introInfo.type && introInfo.content ) {
				
				$elem.empty();
				var $outer = $('<div>')
					.addClass('n2ModuleIntro n2ModuleIntro_text')
					.appendTo($elem);
				
				var content = _loc(introInfo.content);
				if( content ) {
					var $wrapper = $('<div>')
						.text(content);
					$outer
						.empty()
						.append($wrapper);
					
					if( opts.showService ) {
						$wrapper.addClass('n2s_preserveSpaces');
						opts.showService.fixElementAndChildren($wrapper, {}, this.moduleDoc);
					};
				};
				opts.onLoaded();
				introDisplayed = true;
				
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
				introDisplayed = true;
				
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
							if( opts.showService ) {
								opts.showService.fixElementAndChildren($('#'+displayId), {}, _this.moduleDoc);
							};
							opts.onLoaded();
				    	}
				    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
							$n2.log('Unable to obtain module intro: '+textStatus);
				    	}
					});
				};
			};
		};
		
		if( !introDisplayed ){
			$elem.empty();
			return false;
		};
		
		return true;
	},
	
	getAttachmentUrl: function(attachmentName){
		return this.atlasDb.getAttachmentUrl(this.moduleDoc, attachmentName);
	}
});
	
//=========================================================================	
var ModuleDisplay = $n2.Class({

	config: null,

	moduleId: null,
	
	module: null,
	
	mapControl: null,
	
	displayControl: null,

	titleName: null,

	moduleTitleName: null,
	
	contentName: null,

	mapName: null,
	
	mapInteractionName: null,

	sidePanelName: null,
	
	filterPanelName: null,

	searchPanelName: null,
	
	loginPanelNames: null,
	
	navigationName: null,
	
	navigationDocId: null,

	languageSwitcherName: null,
	
	helpButtonName: null,
	
	helpDialogId: null,
	
	styleMapFn: null,
	
	mapStyles: null,
	
	// Services
	
	dispatchService: null,
	
	navigationService: null,
	
	initialize: function(opts_){
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
	
		if( !opts.moduleName  && !opts.moduleDoc ) {
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
		this.navigationDocId = opts.navigationDoc;
		this.titleName = opts.titleName;
		this.moduleTitleName = opts.moduleTitleName;
		this.languageSwitcherName = opts.languageSwitcherName;
		this.helpButtonName = opts.helpButtonName;
		this.styleMapFn = opts.styleMapFn;
		
		if( this.config && this.config.directory ){
			this.dispatchService = this.config.directory.dispatchService;
			this.navigationService = this.config.directory.navigationService;
		};

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
		
		// Quick access
		var config = this.config;
		var atlasDb = config.atlasDb;
		var atlasDesign = config.atlasDesign;
		var documentSource = config.documentSource;
		var customService = this._getCustomService();
		
		// dispatcher
		var d = this.dispatchService;
		if( d ){
			d.register(DH,'unselected',function(m){
				_this._initSidePanel();
			});
			d.register(DH,'moduleGetCurrent',function(m){
				m.moduleId = _this.getCurrentModuleId();
				
				if( _this.module ){
					m.module = _this.module;
					m.doc = _this.module.moduleDoc;
					m.moduleDisplay = _this;
				};
			});
		};
		
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
		if( ! $n2.isDefined(opts.moduleDoc) ) {
			this.moduleId = opts.moduleName;
			atlasDb.getDocument({
				docId: opts.moduleName
				,onSuccess: moduleDocumentLoaded
				,onError: function(err){ 
					opts.onError('Unable to load module: '+err); 
				}
			});
		} else {
			moduleDocumentLoaded(opts.moduleDoc);
		};
		
		/*
		 * Get navigation document, if required.
		 */
		if( this.navigationDocId ){
			
			var $title = $('#'+this.titleName);
			if( $title.length > 0 ){
				$title.empty();

				if( this.navigationService ){
					this.navigationService.printTitle({
						elem: $title
					});
				};
			};
			
			var $menu = $('#'+this.navigationName);
			if( $menu.length > 0 ){
				$menu.empty();

				if( this.navigationService ){
					this.navigationService.printMenu({
						elem: $menu
					});
				};
			};
			
			if( this.navigationService ){
				this.navigationService.setCurrentNavigation({
					docId: this.navigationDocId
				});
			};
		};
		
		function moduleDocumentLoaded(moduleDoc){
			if( !moduleDoc.nunaliit_module ) {
				opts.onError('Loaded document does not include module information');
				return;
			};

			if( moduleDoc._id ){
				_this.moduleId = moduleDoc._id;
				var safeId = $n2.utils.stringToHtmlId(moduleDoc._id);
				$('body').addClass('nunaliit_module_'+safeId);
				
				// Update any associated navigation items
				$('.n2_nav_module+'+safeId).addClass('n2_nav_currentModule');
			};

			_this.module = new Module(moduleDoc, atlasDb);
			
			_this._sendDispatchMessage({
				type: 'reportModuleDocument'
				,doc: moduleDoc
				,moduleId: moduleDoc._id
				,module: _this.module
				,moduleDisplay: _this
			});
			
			var moduleInfo = _this.module.getModuleInfo();
			var mapInfo = _this.module.getMapInfo();
			var canvasInfo = _this.module.getCanvasInfo();
			var displayInfo = _this.module.getDisplayInfo();
			var searchInfo = _this.module.getSearchInfo();
			var modelInfos = _this.module.getModelInfos();
			var utilityInfos = _this.module.getUtilityInfos();
			
			// Load up CSS, if specified
			var css = _this.module.getModuleCSS();
			if( typeof css === 'string' ){
				$n2.css.setCss({
					css: css
					,name: 'module'
				});
			};
			
			// Create models
			if( modelInfos ){
				for(var i=0,e=modelInfos.length; i<e; ++i){
					var modelInfo = modelInfos[i];

					var msg = {
						type: 'modelCreate'
						,modelType: modelInfo.modelType
						,modelId: modelInfo.modelId
						,modelOptions: modelInfo
						,created: false
						,config: config
						,moduleDisplay: _this
					};
						
					_this._sendSynchronousMessage(msg);
						
					if( ! msg.created ){
						$n2.logError('Model not created: '+modelInfo.modelType+'/'+modelInfo.modelId);
					};
				};
			};
			
			// Create utilities
			var inputChangeDetectorSpecified = false;
			if( utilityInfos ){
				for(var i=0,e=utilityInfos.length; i<e; ++i){
					var utilityInfo = utilityInfos[i];

					if( 'inputChangeDetector' === utilityInfo.utilityType ){
						inputChangeDetectorSpecified = true;
					};
					
					var msg = {
						type: 'utilityCreate'
						,utilityType: utilityInfo.utilityType
						,utilityOptions: utilityInfo
						,created: false
						,config: config
						,moduleDisplay: _this
					};
						
					_this._sendSynchronousMessage(msg);
						
					if( ! msg.created ){
						$n2.logError('Utility not created: '+utilityInfo.utilityType);
					};
				};
			};
			
			// Add utility 'inputChangeDetector', if not already specified
			if( !inputChangeDetectorSpecified ){
				var msg = {
					type: 'utilityCreate'
					,utilityType: 'inputChangeDetector'
					,utilityOptions: {
						type: 'inputChangeDetector'
					}
					,created: false
					,config: config
					,moduleDisplay: _this
				};
					
				_this._sendSynchronousMessage(msg);
					
				if( ! msg.created ){
					$n2.logError('Unable to add utility inputChangeDetector');
				};
			};
			
			// Check if support for canvas is available
			var canvasHandlerAvailable = false;
			if( canvasInfo && canvasInfo.canvasType ) {
				var msg = {
					type: 'canvasIsTypeAvailable'
					,canvasType: canvasInfo.canvasType
					,canvasOptions: canvasInfo
					,isAvailable: false
				};
				
				_this._sendSynchronousMessage(msg);
				
				if( msg.isAvailable ){
					canvasHandlerAvailable = true;
				};
			};
			if( canvasInfo && !canvasHandlerAvailable ){
				$n2.logError('Canvas handler not found for type: '+canvasInfo.canvasType);
				canvasInfo = null;
			};
			
			// Handle content div
			if( _this.contentName ){
				var $contentDiv = $('#'+_this.contentName)
					.empty()
					;
				
				if( mapInfo || canvasInfo ) {
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
					// Therefore, search is not located within the content
					$contentDiv.addClass('n2_content_contains_no_search');

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
			if( mapInfo && $n2.isArray(mapInfo.styles) ){
				_this.mapStyles = new $n2.mapStyles.MapStylesAdaptor({
					ruleArray: mapInfo.styles
					,dispatchService: this.dispatchService
				});

			} else if( mapInfo && typeof mapInfo.styles === 'object' ){
				_this.mapStyles = new $n2.mapStyles.MapFeatureStyles(mapInfo.styles);
			
			} else {
				_this.mapStyles = new $n2.mapStyles.MapFeatureStyles(null);
			};
			
			// Title
			if( moduleInfo && moduleInfo.title ) {
				var title = _loc(moduleInfo.title);
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
			
			// Display 
			if( displayInfo ){
				var displayFormat = null;
				if( displayInfo.type ){
					displayFormat = displayInfo.type;
				};
				if( !displayFormat && customService ){
					displayFormat = customService.getOption('displayFormat',displayFormat);
				};
				if( !displayFormat ){
					displayFormat = 'classic';
				};
				
				var displayHandlerAvailable = false;
				var msg = {
					type: 'displayIsTypeAvailable'
					,displayType: displayFormat
					,isAvailable: false
					,displayOptions: displayInfo
				};
				_this._sendSynchronousMessage(msg);
				if( msg.isAvailable ){
					displayHandlerAvailable = true;
				};
				
				if( displayHandlerAvailable ){
					_this._sendDispatchMessage({
						type: 'displayRender'
						,displayType: displayFormat
						,displayOptions: displayInfo
						,displayId: _this.sidePanelName
						,config: config
						,moduleDisplay: _this
						,onSuccess: function(displayControl){
							_this.displayControl = displayControl;
							drawCanvas(searchInfo, mapInfo, canvasInfo);
						}
						,onError: opts.onError
					});
				} else {
					drawCanvas(searchInfo, mapInfo, canvasInfo);
				};
			};
		};
			
		function drawCanvas(searchInfo, mapInfo, canvasInfo) {
			var editInfo = _this.module.getEditInfo();

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
					config.couchEditor.setSchemas( $n2.couchEdit.Constants.ALL_SCHEMAS );
					
				} else if( editInfo.newDocumentSchemaNames.length ){
					config.directory.schemaRepository.getSchemas({
						names: editInfo.newDocumentSchemaNames
						,onSuccess: function(schemas){
							config.couchEditor.setSchemas( schemas );
						}
						,onError: function(err){
							$n2.log('Error obtaining new edit document schemas: '+err);
						}
					});
				};
			};

			// Search
			if( searchInfo && searchInfo.constraint ){
				config.directory.searchService.setConstraint(searchInfo.constraint);
			};
			if( _this.searchPanelName ) {
				config.directory.searchService.installSearchWidget({
					elem: $('#'+_this.searchPanelName)
				});
			};
			
			// Display map
			if( mapInfo ) {
				_this._initializeMap({
					config: config
					,onSuccess: drawWidgets
					,onError: opts.onError
				});
				
			} else if( canvasInfo ) {
				_this._sendDispatchMessage({
					type: 'canvasDisplay'
					,canvasType: canvasInfo.canvasType
					,canvasOptions: canvasInfo
					,canvasId: _this.mapName
					,interactionId: _this.mapInteractionName
					,config: config
					,moduleDisplay: _this
					,onSuccess: drawWidgets
					,onError: opts.onError
				});
				
			} else {
				drawWidgets();
			};
		};
		
		function drawWidgets(){
			var widgetInfos = _this.module.getWidgetInfos();

			// Check for widget support
			var availableWidgets = [];
			if( widgetInfos ){
				for(var i=0,e=widgetInfos.length; i<e; ++i){
					var widgetInfo = widgetInfos[i];
					var widgetHandlerAvailable = false;
					if( widgetInfo && widgetInfo.widgetType ) {
						var msg = {
							type: 'widgetIsTypeAvailable'
							,widgetType: widgetInfo.widgetType
							,widgetOptions: widgetInfo
							,isAvailable: false
						};
						
						_this._sendSynchronousMessage(msg);
						
						if( msg.isAvailable ){
							widgetHandlerAvailable = true;
						};
					};
					if( widgetInfo && !widgetHandlerAvailable ){
						$n2.logError('Widget handler not found for type: '+widgetInfo.widgetType);
					} else {
						availableWidgets.push(widgetInfo);
					};
				};
			};

			// Widgets
			var modelBrowserSpecified = false;
			for(i=0,e=availableWidgets.length; i<e; ++i){
				widgetInfo = availableWidgets[i];
				var widgetDisplayMsg = {
					type: 'widgetDisplay'
					,widgetType: widgetInfo.widgetType
					,widgetOptions: widgetInfo
					,contentId: _this.contentName
					,config: config
					,moduleDisplay: _this
				};

				var widgetDisplayed = false;
				
				// Install at containerId
				if( widgetInfo.containerId ){
					widgetDisplayMsg.containerId = widgetInfo.containerId;
					_this._sendDispatchMessage(widgetDisplayMsg);
					widgetDisplayed = true;
				};
				
				// Install under each containerClass
				if( widgetInfo.containerClass ){
					$('.'+widgetInfo.containerClass).each(function(){
						var containerId = $n2.utils.getElementIdentifier(this);
						widgetDisplayMsg.containerId = containerId;
						_this._sendDispatchMessage(widgetDisplayMsg);
					});
					widgetDisplayed = true;
				};
				
				if( !widgetDisplayed ) {
					// At this point, neither containerId nor containerClass
					// were specified
					widgetDisplayMsg.containerId = _this.contentName;
					_this._sendDispatchMessage(widgetDisplayMsg);
				};
				
				if( 'modelBrowserWidget' === widgetInfo.widgetType ){
					modelBrowserSpecified = true;
				};
			};
			
			// Add model browser widget, if not specified
			if( !modelBrowserSpecified ){
				var $footer = $('.nunaliit_footer');
				if( $footer.length > 0 ){
					var containerId = $n2.utils.getElementIdentifier($footer);
					var widgetDisplayMsg = {
						type: 'widgetDisplay'
						,widgetType: 'modelBrowserWidget'
						,widgetOptions: {
							widgetType: 'modelBrowserWidget'
						}
						,contentId: _this.contentName
						,containerId: containerId
						,config: config
						,moduleDisplay: _this
					};
					_this._sendDispatchMessage(widgetDisplayMsg);
				};
			};

			displayComplete();
		};
		
		function displayComplete(){
			// Side panel
			_this._initSidePanel();

			_this._sendDispatchMessage({
				type:'reportModuleDisplay'
				,moduleDisplay: _this
			});

			opts.onSuccess(_this);
		};
	},
	
	getCurrentModuleId: function(){
		if( this.module && this.module._id ){
			return this.module._id;
		};
		
		return this.moduleId;
	},

	_initializeMap: function(opts_){
		var opts = $n2.extend({
			config: null
			,onSuccess: function(moduleDisplay){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var mapInfo = _this.module.getMapInfo();
		var customService = this._getCustomService();
		
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
		
		// ScaleLine
		var scaleLine = {
			visible: false
		};

		if( mapInfo && mapInfo.scaleLine && mapInfo.scaleLine.visible ){
			scaleLine = mapInfo.scaleLine;
		};

		// Enable wheel zoom
		var enableWheelZoom = false;
		if( mapInfo && mapInfo.enableWheelZoom ){
			enableWheelZoom = true;
		};
		
		// dbSearchEngine
		var dbSearchEngine = { 
			relMediaPath: './'
		};
		if( mapInfo && mapInfo.dbSearchEngine ){
			dbSearchEngine = mapInfo.dbSearchEngine;
		};
		
		// canvasName
		var canvasName = undefined;
		if( mapInfo && typeof mapInfo.canvasName === 'string' ){
			canvasName = mapInfo.canvasName;
		};
		
		var mapOptions = {
			dbSearchEngine: dbSearchEngine
			,canvasName: canvasName
			,mapIdentifier: _this.mapName
			,mapInteractionDivName: _this.mapInteractionName
			,mapCoordinateSpecifications: {
				initialBounds: null
			}
			,uniqueIdentifier: '_id'
			,addPointsOnly: addPointsOnly
			,overlays: []
			,toggleClick: toggleClick
			,scaleLine: scaleLine
			,enableWheelZoom: enableWheelZoom
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

			
			if( mapInfo.coordinates.mousePositionSrsName ){
				mapOptions.mapCoordinateSpecifications.mousePositionSrsName = 
					mapInfo.coordinates.mousePositionSrsName;
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
			if( !styleMapFn && customService ) {
				styleMapFn = customService.getOption('mapGetStyleFunctionForLayer');
				if( typeof styleMapFn !== 'function' ){
					styleMapFn = null;
				};
			};
			if( !styleMapFn ) {
				styleMapFn = function(layerInfo_){ 
					return _this.mapStyles.getStyleMapForLayerInfo(layerInfo_); 
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
				
				if ($n2.isDefined(layerInfo.gutter)) {
					layerDefinition.gutter = layerInfo.gutter;
				};
				if ($n2.isDefined(layerInfo.displayInLayerSwitcher)) {
					layerDefinition.displayInLayerSwitcher = layerInfo.displayInLayerSwitcher;
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

				if( typeof layerInfo.minimumLinePixelSize === 'number' ){
					layerDefinition.minimumLinePixelSize = layerInfo.minimumLinePixelSize;
				};

				if( typeof layerInfo.minimumPolygonPixelSize === 'number' ){
					layerDefinition.minimumPolygonPixelSize = layerInfo.minimumPolygonPixelSize;
				};
				
				// Add layer to map
				mapOptions.overlays.push( layerDefinition );
			};
		};
		
		if( mapInfo 
		 && mapInfo.coordinates
		 && mapInfo.coordinates.autoInitialBounds
		 ){
			// Figure out projection for configuration
			var coordinateProjection = undefined;
			if( mapOptions.mapCoordinateSpecifications.srsName ){
				coordinateProjection = new OpenLayers.Projection(mapOptions.mapCoordinateSpecifications.srsName);
			} else {
				coordinateProjection = new OpenLayers.Projection('EPSG:4326');
			};
			
			var autoBounds = undefined;
			if( typeof mapInfo.coordinates.autoInitialBounds === 'object' ){
				// Make a copy of configuration that contains map info
				var instanceConfiguration = $n2.extend({},mapInfo.coordinates.autoInitialBounds);
				instanceConfiguration._mapInfo = mapInfo;
				
				// Initial bounds computed from a configured object
				var m = {
					type: 'instanceCreate'
					,instanceConfiguration: instanceConfiguration
				};
				_this.dispatchService.synchronousCall(DH,m);
				autoBounds = m.instance;
			};
			
			if( !autoBounds ){
				// Default
				var m = {
					type: 'instanceCreate'
					,instanceConfiguration: {
						type: 'mapAutoInitialBoundsCouchDbOverlays'
					}
				};
				_this.dispatchService.synchronousCall(DH,m);
				autoBounds = m.instance;
			};
			
			if( autoBounds 
			 && typeof autoBounds.computeInitialBounds === 'function' ){
				autoBounds.computeInitialBounds({
					mapOptions: mapOptions
					,mapInfo: mapInfo
					,initialBounds: initialBounds
					,coordinateProjection: coordinateProjection
					,onSuccess: function(bounds){
						if( !bounds ){
							initialBoundsComputed(mapOptions, initialBounds);
						} else {
							initialBoundsComputed(mapOptions, bounds);
						};
					}
					,onError: function(err){
						$n2.log('Error while computing initial bounds: '+err);
						initialBoundsComputed(mapOptions, initialBounds);
					}
				});
			} else {
				initialBoundsComputed(mapOptions, initialBounds);
			};

		} else {
			initialBoundsComputed(mapOptions, initialBounds);
		};
		
		function initialBoundsComputed(mapOptions, initialBounds){
			if( !initialBounds ) {
				opts.onError('Initial map extent not specified');
				return;
			};
		
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
			try {
				_this.mapControl = nunaliit2.mapAndControls(mapOptions);
				_this.mapControl.contributions = _this.config.contributions;
				_this.mapControl.requests = _this.config.directory.requestService;
			} catch(e) {
				$n2.log('Error while creating map: '+e);
				if( e.stack ) {
					$n2.log('Stack',e.stack);
				};
			};

			$n2.log('module',_this);
			opts.onSuccess(_this);
		};
	}

	,_initSidePanel: function() {
		var _this = this;

		var customService = this._getCustomService();
		
		var $elem = $('#'+this.sidePanelName);
		
		var displayIntroFn = customService.getOption('moduleDisplayIntroFunction', null);
		if( displayIntroFn ){
			displayIntroFn({
				elem: $elem
				,config: this.config
				,moduleDisplay: this
			});
		} else {
			this.module.displayIntro({
				elem: $elem
				,showService: this._getShowService()
				,dispatchService: this.dispatchService
				,onLoaded: function(){
					_this._sendDispatchMessage({type:'loadedModuleContent'});
				}
			});
		};
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
		var d = this.dispatchService;
		if( d ){
			d.send(DH,m);
		};
	}
	
	,_sendSynchronousMessage: function(m){
		var d = this.dispatchService;
		if( d ){
			d.synchronousCall(DH,m);
		};
	}
	
	,_installModuleTitle: function($elem, text){
		var _this = this;
		
		$elem.empty();

		var $a = $('<a class="nunaliit_module_title_link" href="#"></a>')
			.addClass('nunaliit_module_title_link')
			.attr('href','#')
			.text(text)
			.appendTo($elem)
			.click(function(e){
				var d = _this.dispatchService;
				if( d ){
					d.send(DH,{
						type: 'mapResetExtent'
					});
				};
				
				// Follow link
				return true;
			});

		var moduleId = this.moduleId;
		if( moduleId ){
			$a.addClass('n2s_insertModuleName');
			$a.attr('nunaliit-document',moduleId);

			var showService = this._getShowService();
			if( showService ){
				showService.fixElementAndChildren($elem);
			};
		};
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
					 && doc.nunaliit_help ){
						$n2.help.InstallHelpInfo('main',doc.nunaliit_help);
						installHelpButton();
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

		function installHelpButton(){
			
			var $a = $('<a class="nunaliit_module_help_button" href="#"></a>');
			$a.text( _loc('Help') );
			
			$('#'+_this.helpButtonName)
				.empty()
				.append($a);
			
			$a.click(function(){
				var $btn = $(this);
				
				$n2.help.ToggleHelp('main', $btn);

				return false;
			});
		};
	}
});

$n2.couchModule = {
	ModuleDisplay: ModuleDisplay
};

})(jQuery,nunaliit2);
