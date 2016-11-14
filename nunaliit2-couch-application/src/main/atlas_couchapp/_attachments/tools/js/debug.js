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
				.addClass('n2debug_configuration')
				.appendTo($outer);
			var $header = $('<div>')
				.addClass('n2debug_header')
				.appendTo($conf);
			$('<span>')
				.text( _loc('Debug Configuration') )
				.appendTo($header);
			$('<div>')
				.addClass('n2debug_configuration_content')
				.appendTo($conf);
			
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

			// Bad Proxy
			var $div = $('<div>')
				.addClass('n2debug_configuration_content_badProxy')
				.appendTo($confContent);
			var badProxyId = $n2.getUniqueId();
			$('<label>')
				.attr('for',badProxyId)
				.text( _loc('Bad Proxy Circumvention') )
				.appendTo($div);
			var $cb = $('<input>')
				.attr('type','checkbox')
				.attr('name',badProxyId)
				.appendTo($div)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setBadProxyEnabled(true);
					} else {
						_this.debugConfiguration.setBadProxyEnabled(false);
					};
					_this._refresh();
				});
			if( this.debugConfiguration.isBadProxyEnabled() ){
				$cb.attr('checked','checked');
			};

			// Logging
			var $div = $('<div>')
				.addClass('n2debug_configuration_content_logging')
				.appendTo($confContent);
			var loggingId = $n2.getUniqueId();
			$('<label>')
				.attr('for',loggingId)
				.text( _loc('Dispatcher Event Logging') )
				.appendTo($div);
			var $cb = $('<input>')
				.attr('type','checkbox')
				.attr('name',loggingId)
				.appendTo($div)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setEventLoggingEnabled(true);
					} else {
						_this.debugConfiguration.setEventLoggingEnabled(false);
					};
					_this._refresh();
				});
			if( this.debugConfiguration.isEventLoggingEnabled() ){
				$cb.attr('checked','checked');
			};

			// CouchDb Caching
			var $div = $('<div>')
				.addClass('n2debug_configuration_content_couchDbCaching')
				.appendTo($confContent);
			var couchDbCachingId = $n2.getUniqueId();
			$('<label>')
				.attr('for',couchDbCachingId)
				.text( _loc('CouchDb Caching') )
				.appendTo($div);
			var $cb = $('<input>')
				.attr('type','checkbox')
				.attr('name',couchDbCachingId)
				.appendTo($div)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setCouchDbCachingEnabled(true);
					} else {
						_this.debugConfiguration.setCouchDbCachingEnabled(false);
					};
					_this._refresh();
				});
			if( this.debugConfiguration.isCouchDbCachingEnabled() ){
				$cb.attr('checked','checked');
			};
			var $cb = $('<button>')
				.text( _loc('Clear Cache') )
				.appendTo($div)
				.click(function(){
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
				});

			// Force slow connection handling
			var $div = $('<div>')
				.addClass('n2debug_configuration_content_slowConnectionHandling')
				.appendTo($confContent);
			var slowConnectionHandlingId = $n2.getUniqueId();
			$('<label>')
				.attr('for',slowConnectionHandlingId)
				.text( _loc('Force slow connection handling') )
				.appendTo($div);
			var $cb = $('<input>')
				.attr('type','checkbox')
				.attr('name',slowConnectionHandlingId)
				.appendTo($div)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setForceSlowConnectionHandling(true);
					} else {
						_this.debugConfiguration.setForceSlowConnectionHandling(false);
					};
					_this._refresh();
				});
			if( this.debugConfiguration.forceSlowConnectionHandling() ){
				$cb.attr('checked','checked');
			};
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

		$('.debugAppTitle').text( _loc('Debug Application') );
	};

	
	$n2.debugApp = {
		main: main
		,DebugApp: DebugApp
	};
})(jQuery,nunaliit2);