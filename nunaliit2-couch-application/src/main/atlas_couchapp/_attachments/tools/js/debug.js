;(function($,$n2){
"use strict";
	
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); },
		DH = 'debug.js';

	// -----------------------------------------------------------------
	var ConfigurationEditor = $n2.Class({

		divId: null,
		
		confObj: null,
		
		debugConfiguration: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				div: null
			},opts_);

			var _this = this;

			this.divId = $n2.utils.getElementIdentifier( opts.div );
			
			this.debugConfiguration = new $n2.debug.DebugConfiguration();

			var $outer = this._getDiv();
			$outer
				.addClass('n2debug_editor')
				.empty();

			// Configuration
			var $conf = $('<div>')
				.addClass('n2debug_configuration mdc-card')
				.appendTo($outer);
			var $header = $('<div>')
				.addClass('n2debug_header')
				.appendTo($conf);
			$('<span>')
				.text( _loc('Debug Configuration') )
				.addClass('mdc-typography--headline6')
				.appendTo($header);
			$('<div>')
				.addClass('n2debug_configuration_content')
				.appendTo($conf);

			var $buttonsContainer = $('<div>')
				.addClass('mdc-card__actions')
				.appendTo($conf);

			new $n2.mdc.MDCButton({
				parentId: $n2.utils.getElementIdentifier($buttonsContainer),
				btnLabel: 'Clear Cache',
				onBtnClick: function(){
					$n2.indexedDb.openIndexedDb({
						onSuccess: function(indexedDbConnection){
							var documentCache = indexedDbConnection.getDocumentCache({});
							documentCache.clearCache({
								onSuccess: function(){
									alert('Cache was cleared');
								}
								,onError: function(err){
									alert('Error while clearing cache: '+err);
								}
							});
						}
						,onError: function(err){
							alert('Error while obtaining cache: '+err);
						}
					});
				}
			});

			this._refresh();
		},

		_getDiv: function(){
			return $('#'+this.divId);
		},
		
		_refresh: function(){
			var _this = this;

			var $outer = this._getDiv();

			var $confContent = $outer.find('.n2debug_configuration_content');
			$confContent.empty();

			var $debugList = $('<ul>')
				.addClass('mdc-list')
				.attr('role', 'group')
				.appendTo($confContent);
			
//			new $n2.mdc.MDCFormField({
//				parentId: $n2.utils.getElementIdentifier($confContent)
//			});
			
			// Bad Proxy
			var $badProxyListItem = $('<li>')
				.addClass('mdc-list-item')
				.attr('role', 'checkbox')
				.appendTo($debugList);

			if (this.debugConfiguration.isBadProxyEnabled()) {
				var badProxyChkboxChecked = true;
			};

			new $n2.mdc.MDCCheckbox({
				parentId: $n2.utils.getElementIdentifier($badProxyListItem),
				mdcClasses: ['n2debug_configuration_content_badProxy'],
				chkboxChecked: badProxyChkboxChecked, 
				chkboxLabel: 'Bad Proxy Circumvention',
				chkboxChgFunc: function(){
					var $cb = $(this);
					if ($cb.attr('checked')) {
						_this.debugConfiguration.setBadProxyEnabled(true);
					} else {
						_this.debugConfiguration.setBadProxyEnabled(false);
					}
					_this._refresh();
				}
			});

			// Logging
			var $loggingListItem = $('<li>')
				.addClass('mdc-list-item')
				.attr('role', 'checkbox')
				.appendTo($debugList);

			if( this.debugConfiguration.isEventLoggingEnabled() ){
				var loggingChkboxChecked = true;
			};

			new $n2.mdc.MDCCheckbox({
				parentId: $n2.utils.getElementIdentifier($loggingListItem),
				mdcClasses: ['n2debug_configuration_content_logging'],
				chkboxChecked: loggingChkboxChecked, 
				chkboxLabel: 'Dispatcher Event Logging',
				chkboxChgFunc: function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setEventLoggingEnabled(true);
					} else {
						_this.debugConfiguration.setEventLoggingEnabled(false);
					};
					_this._refresh();
				}
			});

			// CouchDb Caching
			var $couchDBCachingListItem = $('<li>')
				.addClass('mdc-list-item')
				.attr('role', 'checkbox')
				.appendTo($debugList);

			if( this.debugConfiguration.isCouchDbCachingEnabled() ){
				var couchDBCachingChkboxChecked = true;
			};

			new $n2.mdc.MDCCheckbox({
				parentId: $n2.utils.getElementIdentifier($couchDBCachingListItem),
				mdcClasses: ['n2debug_configuration_content_couchDbCaching'],
				chkboxChecked: couchDBCachingChkboxChecked, 
				chkboxLabel: 'CouchDb Caching',
				chkboxChgFunc: function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setCouchDbCachingEnabled(true);
					} else {
						_this.debugConfiguration.setCouchDbCachingEnabled(false);
					};
					_this._refresh();
				}
			});

			// Disable CouchDb Caching
			var $disableCouchDBCachingListItem = $('<li>')
				.addClass('mdc-list-item')
				.attr('role', 'checkbox')
				.appendTo($debugList);

			if( this.debugConfiguration.isCouchDbCachingDisabled() ){
				var disableCouchDBCachingCheckboxChecked = true;
			};

			new $n2.mdc.MDCCheckbox({
				parentId: $n2.utils.getElementIdentifier($disableCouchDBCachingListItem),
				mdcClasses: ['n2debug_configuration_content_disableCouchDbCaching'],
				chkboxChecked: disableCouchDBCachingCheckboxChecked, 
				chkboxLabel: 'Disable CouchDb Caching',
				chkboxChgFunc: function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setCouchDbCachingDisabled(true);
					} else {
						_this.debugConfiguration.setCouchDbCachingDisabled(false);
					};
					_this._refresh();
				}
			});

			// Force slow connection handling
			var $slowConnectionListItem = $('<li>')
				.addClass('mdc-list-item')
				.attr('role', 'checkbox')
				.appendTo($debugList);

			if( this.debugConfiguration.forceSlowConnectionHandling() ){
				var slowConnectionChkboxChecked = true;
			};

			new $n2.mdc.MDCCheckbox({
				parentId: $n2.utils.getElementIdentifier($slowConnectionListItem),
				mdcClasses: ['n2debug_configuration_content_slowConnectionHandling'],
				chkboxChecked: slowConnectionChkboxChecked, 
				chkboxLabel: 'Force slow connection handling',
				chkboxChgFunc: function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setForceSlowConnectionHandling(true);
					} else {
						_this.debugConfiguration.setForceSlowConnectionHandling(false);
					};
					_this._refresh();
				}
			});
		}
	});

	// -----------------------------------------------------------------
	var DebugApp = $n2.Class({
		
		dispatchService: null,
		
		divId: null,
		
		initialize: function(opts_){
			var opts = $n2.extend({
				div: null
				,dispatchService: null
			},opts_);

			var _this = this;
			
			this.divId = $n2.utils.getElementIdentifier( opts.div );
			this.dispatchService = opts.dispatchService;
			
			if( this.dispatchService ){
				var f = function(m, addr, dispatcher){
					_this._handle(m, addr, dispatcher);
				};
			};
			
			var $div = this._getDiv();
			$div.empty();

			var $editor = $('<div>')
				.addClass('n2debug_editor')
				.appendTo($div);
			new ConfigurationEditor({
				div: $editor
			});
		},
		
		_getDiv: function(){
			return $('#'+this.divId);
		},
		
		_handle: function(m, addr, dispatcher){
		}
	});
	
	// -----------------------------------------------------------------
	function main(opts_) {
		var config = opts_.config;
		var $div = opts_.div;

		var dispatchService = null;
		if( config ){
			if( config.directory ){
				dispatchService = config.directory.dispatchService;
			};
		};

		var App = new DebugApp({
			div: $div
			,dispatchService: dispatchService
		});
	};

	function addHamburgerMenu(){
		// Tools Drawer
		var drawer = new $n2.mdc.MDCDrawer({
			hamburgerDrawer: true,
			navHeaderTitle: 'Nunaliit Tools',
			navItems: [
				{"text": "User Management", "href": "./users.html"},
				{"text": "Approval for Uploaded Files", "href": "./upload.html"},
				{"text": "Data Browser", "href": "./browse.html"},
				{"text": "Localization", "href": "./translation.html"},
				{"text": "Data Export", "href": "./export.html"},
				{"text": "Data Modification", "href": "./select.html"},
				{"text": "Schemas", "href": "./schemas.html"},
				{"text": "Restore Tool", "href": "./restore.html"},
				{"text": "Submission Tool", "href": "./submission.html"},
				{"text": "Import Tool", "href": "./import.html"},
				{"text": "Debug Tool", "href": "./debug.html", "activated": true},
				{"text": "Schema Editor", "href": "./schema_editor.html"}
			]	
		});
	
		// Top-App-Bar
		var topAppBar = new $n2.mdc.MDCTopAppBar({
			barTitle: 'Debug Application'
		});
	};
	
	$n2.debugApp = {
		main: main
		,DebugApp: DebugApp
		,addHamburgerMenu: addHamburgerMenu
	};
})(jQuery,nunaliit2);
