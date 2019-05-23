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

			// Attach MDC Components
			$n2.mdc.attachMDCComponents();
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
				.attr('aria-orientation','vertical')
				.appendTo($confContent);

			// Bad Proxy
			var badProxyId = $n2.getUniqueId();

			var $badProxyListItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($debugList);

			var $badProxyCheckboxDiv = $('<div>')
				.addClass('n2debug_configuration_content_badProxy mdc-checkbox')
				.appendTo($badProxyListItem);

			var $badProxyCB = $('<input>')
				.addClass('mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',badProxyId)
				.appendTo($badProxyCheckboxDiv)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setBadProxyEnabled(true);
					} else {
						_this.debugConfiguration.setBadProxyEnabled(false);
					};
					_this._refresh();
				});

			var $badProxyCheckboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($badProxyCheckboxDiv);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($badProxyCheckboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($badProxyCheckboxBackground);

			$('<label>')
				.attr('for',badProxyId)
				.text( _loc('Bad Proxy Circumvention') )
				.appendTo($badProxyListItem);

			if( this.debugConfiguration.isBadProxyEnabled() ){
				$badProxyCB.attr('checked','checked');
			};

			// Logging
			var loggingId = $n2.getUniqueId();

			var $loggingListItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($debugList);

			var $loggingCheckboxDiv = $('<div>')
				.addClass('n2debug_configuration_content_logging mdc-checkbox')
				.appendTo($loggingListItem);

			var $loggingCB = $('<input>')
				.addClass('mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',loggingId)
				.appendTo($loggingCheckboxDiv)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setEventLoggingEnabled(true);
					} else {
						_this.debugConfiguration.setEventLoggingEnabled(false);
					};
					_this._refresh();
				});

			var $loggingCheckboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($loggingCheckboxDiv);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($loggingCheckboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($loggingCheckboxBackground);

			$('<label>')
				.attr('for',loggingId)
				.text( _loc('Dispatcher Event Logging') )
				.appendTo($loggingListItem);

			if( this.debugConfiguration.isEventLoggingEnabled() ){
				$loggingCB.attr('checked','checked');
			};

			// CouchDb Caching
			var couchDbCachingId = $n2.getUniqueId();

			var $couchDbCachingListItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($debugList);

			var $couchDbCachingCheckboxDiv = $('<div>')
				.addClass('n2debug_configuration_content_couchDbCaching mdc-checkbox')
				.appendTo($couchDbCachingListItem);

			var $couchDbCachingCB = $('<input>')
				.addClass('mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',couchDbCachingId)
				.appendTo($couchDbCachingCheckboxDiv)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setCouchDbCachingEnabled(true);
					} else {
						_this.debugConfiguration.setCouchDbCachingEnabled(false);
					};
					_this._refresh();
				});

			var $couchDbCachingCheckboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($couchDbCachingCheckboxDiv);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($couchDbCachingCheckboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($couchDbCachingCheckboxBackground);

			$('<label>')
				.attr('for',couchDbCachingId)
				.text( _loc('CouchDb Caching') )
				.appendTo($couchDbCachingListItem);

			if( this.debugConfiguration.isCouchDbCachingEnabled() ){
				$couchDbCachingCB.attr('checked','checked');
			};

			// Disable CouchDb Caching
			var disableCouchDbCachingId = $n2.getUniqueId();

			var $disableCouchDbCachingListItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($debugList);

			var $disableCouchDbCachingCheckboxDiv = $('<div>')
				.addClass('n2debug_configuration_content_disableCouchDbCaching mdc-checkbox')
				.appendTo($disableCouchDbCachingListItem);

			var $disableCouchDbCachingCB = $('<input>')
				.addClass('mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',disableCouchDbCachingId)
				.appendTo($disableCouchDbCachingCheckboxDiv)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setCouchDbCachingDisabled(true);
					} else {
						_this.debugConfiguration.setCouchDbCachingDisabled(false);
					};
					_this._refresh();
				});

			var $disableCouchDbCachingCheckboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($disableCouchDbCachingCheckboxDiv);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($disableCouchDbCachingCheckboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($disableCouchDbCachingCheckboxBackground);

			$('<label>')
				.attr('for',disableCouchDbCachingId)
				.text( _loc('Disable CouchDb Caching') )
				.appendTo($disableCouchDbCachingListItem);

			if( this.debugConfiguration.isCouchDbCachingDisabled() ){
				$disableCouchDbCachingCB.attr('checked','checked');
			};

			// Force slow connection handling
			var slowConnectionHandlingId = $n2.getUniqueId();

			var $slowConnectionListItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($debugList);

			var $slowConnectionCheckboxDiv = $('<div>')
				.addClass('n2debug_configuration_content_slowConnectionHandling mdc-checkbox')
				.appendTo($slowConnectionListItem);

			var $slowConnectionCB = $('<input>')
				.addClass('mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',slowConnectionHandlingId)
				.appendTo($slowConnectionCheckboxDiv)
				.change(function(){
					var $cb = $(this);
					if( $cb.attr('checked') ) {
						_this.debugConfiguration.setForceSlowConnectionHandling(true);
					} else {
						_this.debugConfiguration.setForceSlowConnectionHandling(false);
					};
					_this._refresh();
				});

			var $slowConnectionCheckboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($slowConnectionCheckboxDiv);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($slowConnectionCheckboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($slowConnectionCheckboxBackground);

			$('<label>')
				.attr('for',slowConnectionHandlingId)
				.text( _loc('Force slow connection handling') )
				.appendTo($slowConnectionListItem);

			if( this.debugConfiguration.forceSlowConnectionHandling() ){
				$slowConnectionCB.attr('checked','checked');
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
