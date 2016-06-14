/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetService'
 ;
 
//--------------------------------------------------------------------------
var CreateDocumentWidget = $n2.Class({
	
	contentId: null,
	
	dispatchService: null,
	
	authService: null,
	
	showAsLink: null,
	
	containerId: null,
	
	elemId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			contentId: null
			,containerId: null
			,dispatchService: null
			,authService: null
			,showAsLink: false
		},opts_);
		
		this.contentId = opts.contentId;
		this.containerId = opts.containerId;
		this.dispatchService = opts.dispatchService;
		this.authService = opts.authService;
		this.showAsLink = opts.showAsLink;

		if( !this.containerId ){
			throw new Error('containerId must be specified');
		};
		
		this._display();
	},
	
	_display: function(){
		var _this = this;
		
		this.elemId = $n2.getUniqueId();
		
		var containerId = this.containerId;
		
		var $div = $('<div>')
			.attr('id',this.elemId)
			.addClass('n2widget_createDocument')
			.appendTo( $('#'+containerId) );
		
		if( this.showAsLink ) {
			$('<a>')
				.attr('href','#')
				.text( _loc('Create Document') )
				.appendTo($div)
				.click(function(){
					_this._startEdit();
					return false;
				});
		} else {
			$('<button>')
				.text( _loc('Create Document') )
				.appendTo($div)
				.click(function(){
					_this._startEdit();
					return false;
				});
		};
	},
	
	_startEdit: function(){
		var _this = this;
		
		if( this.authService ){
			if( false == this.authService.isLoggedIn() ){
				this.authService.showLoginForm({
					prompt: _loc('You must first log in to create a new document.')
					,anonymousLoginAllowed: false
					,onSuccess: function(){ _this._startEdit(); }
				});
				
				return;
			};
		};

		this.dispatchService.send(DH, {
			type: 'editInitiate'
			,doc: {}
		});
	}
});

//--------------------------------------------------------------------------
function BuildCreateDocumentWidgetFromRequest(m){
	var widgetOptions = m.widgetOptions;
	var contentId = m.contentId;
	var containerId = m.containerId;
	var config = m.config;
	// var moduleDisplay = m.moduleDisplay;
	
	var options = {};

	if( widgetOptions ){
		for(var key in widgetOptions){
			var value = widgetOptions[key];
			options[key] = value;
		};
	};

	options.contentId = contentId;
	options.containerId = containerId;

	if( config && config.directory ){
		options.dispatchService = config.directory.dispatchService;
		options.authService = config.directory.authService;
	};
	
	new CreateDocumentWidget(options);
};

//--------------------------------------------------------------------------
var CreateDocumentFromSchemaWidget = $n2.Class({
	
	elemId: null,
	
	dispatchService: null,

	authService: null,

	schemaRepository: null,
	
	schemaName: null,
	
	label: null,
	
	showAsLink: null,

	schema: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,authService: null
			,schemaRepository: null

			// From configuration
			,schemaName: null
			,label: null
			,showAsLink: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.authService = opts.authService;
		this.schemaRepository = opts.schemaRepository;
		this.atlasDesign = opts.atlasDesign;
		this.schemaName = opts.schemaName;
		this.label = opts.label;
		this.showAsLink = opts.showAsLink;

		this.schema = null;
		
		var $parent = $('#'+opts.containerId);
		var $elem = $('<div>')
			.addClass('n2widget_createDocumentFromSchema')
			.appendTo($parent);
		this.elemId = $n2.utils.getElementIdentifier($elem);
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
		};
		
		if( this.schemaRepository && this.schemaName ){
			this.schemaRepository.getSchema({
				name: this.schemaName
				,onSuccess: function(schema){
					_this.schema = schema;
					_this._refresh();
				}
				,onError: function(){
					$n2.log('Schema not found: '+this.schemaName);
				}
			});
		} else {
			$n2.log('Schema repository or schema name not specified');
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_refresh: function(){
		var _this = this;
		
		var $div = this._getElem();
		
		var schemaLabel = this.schema.name;
		if( this.schema.label ){
			schemaLabel = _loc(this.schema.label);
		};
		
		var controlLabel = _loc('Create {label}',{
			label: schemaLabel
		});
		if( this.label ){
			controlLabel = _loc(this.label);
		};
		
		if( this.showAsLink ) {
			$('<a>')
				.attr('href','#')
				.text(controlLabel)
				.appendTo($div)
				.click(function(){
					_this._startEdit();
					return false;
				});
		} else {
			$('<button>')
				.text(controlLabel)
				.appendTo($div)
				.click(function(){
					_this._startEdit();
					return false;
				});
		};
	},
	
	_startEdit: function(){
		var _this = this;
		
		if( this.authService ){
			if( false == this.authService.isLoggedIn() ){
				this.authService.showLoginForm({
					prompt: _loc('You must first log in to create a new document.')
					,anonymousLoginAllowed: false
					,onSuccess: function(){ _this._startEdit(); }
				});
				
				return;
			};
		};

		this.dispatchService.send(DH, {
			type: 'editInitiate'
			,doc: {
				nunaliit_schema: this.schema.name
			}
		});
	},
	
	_handle: function(m, addr, dispatcher){
	}
});

//--------------------------------------------------------------------------
function BuildCreateDocumentFromSchemaWidget(m){
	var widgetOptions = m.widgetOptions;
	var contentId = m.contentId;
	var containerId = m.containerId;
	var config = m.config;
	// var moduleDisplay = m.moduleDisplay;
	
	var options = {};

	if( widgetOptions ){
		for(var key in widgetOptions){
			options[key] = widgetOptions[key];
		};
	};
	
	options.containerId = containerId;
	
	if( config ){
		if( config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.authService = config.directory.authService;
			options.schemaRepository = config.directory.schemaRepository;
		};
	};
	
	new CreateDocumentFromSchemaWidget(options);
};

//--------------------------------------------------------------------------
var Service = $n2.Class({
	
	config: null,
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			config: null
		},opts_);
		
		var _this = this;
		
		this.config = opts.config;
		
		if( this.config && this.config.directory ){
			this.dispatchService = this.config.directory.dispatchService;
		};
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'widgetIsTypeAvailable',f);
			this.dispatchService.register(DH,'widgetDisplay',f);
			this.dispatchService.register(DH,'showPreprocessElement',f);
		};
	},
	
	_showServicePreprocess: function($elem){
		var _this = this;
		
		var $set = $elem.find('*').addBack();
		
		// Localization
		$set.filter('.n2s_insertWidget').each(function(){
			var $jq = $(this);
			_this._insertWidget($jq);
			$jq.removeClass('n2s_insertWidget').addClass('n2s_insertedWidget');
		});
	},
	
	_insertWidget: function($jq){
		var widgetType = $jq.attr('nunaliit-widget');
		var containerId = $n2.utils.getElementIdentifier($jq);
		
		var widgetConfig = undefined;
		try {
			var configText = $jq.text();
			widgetConfig = JSON.parse(configText);
		} catch(e) {
			// Ignore
		};
		if( !widgetConfig ){
			widgetConfig = {};
		};
		$jq.empty();
		
		// Check if it is available
		var m = {
			type: 'widgetIsTypeAvailable'
			,widgetType: widgetType
			,widgetOptions: widgetConfig
			,isAvailable: false
		};
		
		var d = this.dispatchService;
		if( d ){
			d.synchronousCall(DH,m);
		};
		
		if( !m.isAvailable ){
			$jq.attr('nunaliit-error','widget type not available');
			return;
		};
		
		// Insert widget
		if( d ){
			d.send(DH,{
				type: 'widgetDisplay'
				,widgetType: widgetType
				,widgetOptions: widgetConfig
				,containerId: containerId
				,config: this.config
			});
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'widgetIsTypeAvailable' === m.type ){
			if( m.widgetType === 'createDocument' ){
		        m.isAvailable = true;

			} else if( m.widgetType === 'createDocumentFromSchema' ){
				m.isAvailable = true;

			} else {
				if( $n2.couchDbPerspective 
				 && $n2.couchDbPerspective.HandleWidgetAvailableRequests ){
					$n2.couchDbPerspective.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetTime 
				 && $n2.widgetTime.HandleWidgetAvailableRequests ){
					$n2.widgetTime.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetPolarStereographicProjectionSelector 
				 && $n2.widgetPolarStereographicProjectionSelector.HandleWidgetAvailableRequests ){
					$n2.widgetPolarStereographicProjectionSelector.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetWait 
				 && $n2.widgetWait.HandleWidgetAvailableRequests ){
					$n2.widgetWait.HandleWidgetAvailableRequests(m);
				};

				if( $n2.mapAndControls 
				 && $n2.mapAndControls.HandleWidgetAvailableRequests ){
					$n2.mapAndControls.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetBookBrowser 
				 && $n2.widgetBookBrowser.HandleWidgetAvailableRequests ){
					$n2.widgetBookBrowser.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetNavigation 
				 && $n2.widgetNavigation.HandleWidgetAvailableRequests ){
					$n2.widgetNavigation.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetSplash 
				 && $n2.widgetSplash.HandleWidgetAvailableRequests ){
					$n2.widgetSplash.HandleWidgetAvailableRequests(m);
				};

				if( $n2.widgetLayer 
				 && $n2.widgetLayer.HandleWidgetAvailableRequests ){
					$n2.widgetLayer.HandleWidgetAvailableRequests(m);
				};
		    };
		    
		} else if( 'widgetDisplay' === m.type ){
			if( m.widgetType === 'createDocument' ){
				BuildCreateDocumentWidgetFromRequest(m);

			} else if( m.widgetType === 'createDocumentFromSchema' ){
				BuildCreateDocumentFromSchemaWidget(m);

			} else {
				if( $n2.couchDbPerspective 
				 && $n2.couchDbPerspective.HandleWidgetDisplayRequests ){
					$n2.couchDbPerspective.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetTime 
				 && $n2.widgetTime.HandleWidgetDisplayRequests ){
					$n2.widgetTime.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetPolarStereographicProjectionSelector 
				 && $n2.widgetPolarStereographicProjectionSelector.HandleWidgetDisplayRequests ){
					$n2.widgetPolarStereographicProjectionSelector.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetWait 
				 && $n2.widgetWait.HandleWidgetDisplayRequests ){
					$n2.widgetWait.HandleWidgetDisplayRequests(m);
				};

				if( $n2.mapAndControls 
				 && $n2.mapAndControls.HandleWidgetDisplayRequests ){
					$n2.mapAndControls.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetBookBrowser 
				 && $n2.widgetBookBrowser.HandleWidgetDisplayRequests ){
					$n2.widgetBookBrowser.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetNavigation 
				 && $n2.widgetNavigation.HandleWidgetDisplayRequests ){
					$n2.widgetNavigation.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetSplash 
				 && $n2.widgetSplash.HandleWidgetDisplayRequests ){
					$n2.widgetSplash.HandleWidgetDisplayRequests(m);
				};

				if( $n2.widgetLayer 
				 && $n2.widgetLayer.HandleWidgetDisplayRequests ){
					$n2.widgetLayer.HandleWidgetDisplayRequests(m);
				};
		    };

		} else if( 'showPreprocessElement' === m.type ){
			var $elem = m.elem;
			this._showServicePreprocess($elem);
		};
	}
});

//--------------------------------------------------------------------------
$n2.widgetBasic = {
	Service: Service
	,CreateDocumentWidget: CreateDocumentWidget
	,CreateDocumentFromSchemaWidget: CreateDocumentFromSchemaWidget
};

})(jQuery,nunaliit2);
