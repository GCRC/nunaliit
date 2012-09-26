;(function($,$n2){

//=============================================================
var MobileDebugPage = $n2.Class({
	
	options: null
	
	,pageId: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			config: null
		},opts_);
	
		this.pageId = $n2.getUniqueId();
	
		this._createPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $('#'+this.pageId);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_createPage: function(){
		
		var $pageContainer = this.getPageContainer();
		
		var $newPage = this.getPage();
		if( $newPage.length < 1 ) {
			// Create page
			var documentBase = $.mobile.getDocumentBase(true);
			var absUrl = $.mobile.path.makeUrlAbsolute( "debug.html", documentBase.hrefNoHash );
			var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );

			$newPage = $('<div id="'+this.pageId+'" data-url="'+dataUrl+'" data-role="page" data-add-back-btn="true" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1>Debug</h1></div>');
			$newPage.append('<div class="mobileDebugContent" data-role="content" data-theme="b"></div>');
			
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $this = $( this ),
					prEvent = new $.Event( "pageremove" );

				$this.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$this.removeWithDependents();
				};
			});
		};
		
		this._displayDebugInfo();
		
		// Load this page
		var newPageOptions = {
		};
		if( this.options.pageOptions ) {
			newPageOptions = this.options.pageOptions;
		};
		$.mobile.changePage($newPage, newPageOptions);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_displayDebugInfo: function(){
		var _this = this;
		
		var $page = this.getPage();
		var $content = $page.find('.mobileDebugContent');
		
		$content.html('<div class="mobileDebugLog"></div>'
			+'<div class="mobileDebugButtons"></div>'
			);
			
		// Install buttons
		var $buttons = $page.find('.mobileDebugButtons');
		$('<button>Refresh Logs</button>')
			.click(function(){
				_this._refreshLogs();
				return false;
			})
			.appendTo($buttons);
		$('<button>Restart Database</button>')
			.click(function(){
				_this._restartDatabase();
				return false;
			})
			.appendTo($buttons);
		$('<button>Fetch Database Info</button>')
		.click(function(){
			_this._fetchDatabaseInfo();
			return false;
		})
		.appendTo($buttons);

		// Report logs
		this._refreshLogs();
		
		$page.trigger('create');
	}
	
	,_refreshLogs: function(){
		var $page = this.getPage();

		var $log = $page.find('.mobileDebugLog');
		$log.empty();
		
		if( $n2.mobile 
		 && $n2.mobile.logger
		 && $n2.mobile.logger.getLogStatements
		 ){
			var statements = $n2.mobile.logger.getLogStatements();
			if( statements && statements.length ) {
				for(var i=0,e=statements.length; i<e; ++i){
					var $div = $('<div></div>');
					$div.text(statements[i]);
					$log.append( $div );
				};
			};
		};
	}
	
	,_restartDatabase: function(){
		if( window
		 && window.plugins
		 && window.plugins.CDVPluginNunaliit
		 && window.plugins.CDVPluginNunaliit.restartCouchDb ) {
			window.plugins.CDVPluginNunaliit.restartCouchDb({
				onSuccess: function(){
					alert('Database restarting... Wait a couple of '
						+'seconds and click button to fecth database information');
				}
				,onError: function(err){
					alert('Error restarting database: '+err);
				}
			});
		} else {
			alert('Restart Database API not detected');
		};
	}
	
	,_fetchDatabaseInfo: function(){
		var _this = this;
		
		if( window
		 && window.plugins
		 && window.plugins.CDVPluginNunaliit
		 && window.plugins.CDVPluginNunaliit.couchBaseInfo ) {
			window.plugins.CDVPluginNunaliit.couchBaseInfo({
				onSuccess: function(result){
					$n2.log('Couchbase location: '+result.location);
					$n2.log('Couchbase error msg: '+result.errorMsg);
					
					// If a location is returned, reboot server
					if( result.location ){
						window.couchLocation = result.location;
						if( typeof(window.couchBoot) === 'function' ){
							window.couchBoot();
						};
					};
					
					_this._refreshLogs();
				}
				,onError: function(err){
					alert('Error obtaining CouchBase info: '+err);
				}
			});
		} else {
			alert('Database info API not detected');
		};
	}
});

$n2.mobile.MobileDebugPage = MobileDebugPage;

})(jQuery,nunaliit2);