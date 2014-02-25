/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.couchConfiguration.js 8445 2012-08-22 19:11:38Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

function Configure(options_){
	
	var options = $n2.extend({
		couchServerUrl: null // string
		,atlasDbUrl: null // string
		,atlasDesignName: 'atlas'
		,siteDesignName: 'site'
		,progressServerUrl: null // string
		,mediaUrl: null // string
		,uploadServerUrl: null // string
		,exportServerUrl: null // string
		,userServerUrl: null // string
		,submissionDbUrl: null // string
		,onSuccess: function(config){}
	},options_);

	var configuration = {
		directory: {}
	};
	
	// Start function
	configuration.start = function(){
		if( configuration.directory.dispatchService ){
			configuration.directory.dispatchService.send('n2.couchConfiguration',{type:'start'});
		};
	};

	// Dispatcher
	configuration.directory.dispatchService = new $n2.dispatch.Dispatcher();
	
	// History monitoring
	configuration.directory.historyMonitor = new $n2.history.Monitor({
		directory: configuration.directory
	});
	configuration.directory.historyTracker = new $n2.history.Tracker({
		directory: configuration.directory
	});
	
	// Event translation
	configuration.directory.eventService = new $n2.couchEvents.EventSupport({
		directory: configuration.directory
	});
	
	// Custom Service
	configuration.directory.customService = new $n2.custom.CustomService({
		directory: configuration.directory
	});
	
 	// Turn off cometd
 	$.cometd = {
 		init: function(){}
 		,subscribe: function(){}
 		,publish: function(){}
 	};
 	
 	$n2.couch.initialize({
    	pathToServer: options.couchServerUrl
    	,onSuccess: couchInitialized
 	});
	
	function couchInitialized() {
		
		configuration.couchServer = $n2.couch.DefaultServer;
		configuration.directory.couchServer = configuration.couchServer;
		
		configuration.atlasDb = configuration.couchServer.getDb({dbUrl:options.atlasDbUrl});
		configuration.atlasDesign = configuration.atlasDb.getDesignDoc({ddName:options.atlasDesignName});
		configuration.siteDesign = configuration.atlasDb.getDesignDoc({ddName:options.siteDesignName});
		
		if( options.submissionDbUrl ){
			configuration.submissionDb = configuration.couchServer.getDb({dbUrl:options.submissionDbUrl});
		};
		
		configuration.dataSources = [];
		
		var couchDbDs = null;
		if( configuration.submissionDb ){
			couchDbDs = new $n2.couchDocument.CouchDataSourceWithSubmissionDb({
				id: 'main'
				,db: configuration.atlasDb
				,submissionDb: configuration.submissionDb
				,dispatchService: configuration.directory.dispatchService
			});
		} else {
			couchDbDs = new $n2.couchDocument.CouchDataSource({
				id: 'main'
				,db: configuration.atlasDb
				,dispatchService: configuration.directory.dispatchService
			});
		};
		configuration.dataSources.push(couchDbDs);
		configuration.documentSource = couchDbDs;

		// Check browser compliance
		if( $n2.couchHelp 
		 && $n2.couchHelp.CheckBrowserCompliance ){
			$n2.couchHelp.CheckBrowserCompliance({
				db: configuration.atlasDb
			});
		};

		configuration.directory.authService = new $n2.couchAuth.AuthService({
			onSuccess: authInitialized
			,autoAnonymousLogin: false
			,directory: configuration.directory
			,userServerUrl: options.userServerUrl
		});
	};
	
	function authInitialized() {
		
		configuration.auth = $.NUNALIIT_AUTH;
		
		configuration.atlasDb.getChangeNotifier({
			onSuccess: function(notifier){
				configuration.atlasNotifier = notifier;
				configuration.directory.notifierService = notifier;
				notifierInitialized();
			}
		});
	};
	
	function notifierInitialized() {
		configuration.directory.schemaRepository = new $n2.couchSchema.CouchSchemaRepository({
			db: configuration.atlasDb
			,designDoc: configuration.atlasDesign
			,dispatchService: configuration.directory.dispatchService
			,preload: true
			,preloadedCallback: schemasPreloaded 
		});
	};
	
	function schemasPreloaded() {
		
	 	$n2.couchL10n.Configure({
			db: configuration.atlasDb
	 		,designDoc: configuration.atlasDesign 
	 	});

	 	configuration.progressServer = new $n2.progress.ProgressServer({
			url: options.progressServerUrl
		});

	 	configuration.uploadServer = new $n2.upload.Upload({
			url: options.uploadServerUrl
			,progressServer: configuration.progressServer
		});
		configuration.directory.uploadService = configuration.uploadServer;

		configuration.directory.exportService = new $n2.couchExport.Export({
			url: options.exportServerUrl
		});
		
	 	configuration.searchServer = new $n2.couchSearch.SearchServer({
			designDoc: configuration.atlasDesign
			,db: configuration.atlasDb
			,directory: configuration.directory
		});
		configuration.directory.searchService = configuration.searchServer;
		
	 	configuration.mediaRelativePath = options.mediaUrl;

	 	configuration.requests = new $n2.couchRequests({
			db: configuration.atlasDb
			,userDb: $n2.couch.getUserDb()
			,designDoc: configuration.atlasDesign
			,dispatchService: configuration.directory.dispatchService
			,userServerUrl: options.userServerUrl
		});
		configuration.directory.requestService = configuration.requests;

		configuration.directory.dispatchSupport = new $n2.couchDispatchSupport.DispatchSupport({
			db: configuration.atlasDb
			,directory: configuration.directory
		});

		configuration.directory.languageService = new $n2.languageSupport.LanguageService({
			directory: configuration.directory
		});
		
	 	configuration.show = new $n2.couchShow.Show({
			db: configuration.atlasDb
			,designDoc: configuration.atlasDesign
			,documentSource: configuration.documentSource
			,serviceDirectory: configuration.directory
		});
		configuration.directory.showService = configuration.show;
		
	 	configuration.couchEditor = new $n2.CouchEditor.Editor({
			documentSource: configuration.documentSource
			,serviceDirectory: configuration.directory
		});
		
	 	configuration.directory.schemaEditorService = new $n2.CouchEditor.SchemaEditorService({
			documentSource: configuration.documentSource
			,serviceDirectory: configuration.directory
		});
		
	 	configuration.directory.userService = new $n2.couchUser.UserService({
			userDb: $n2.couch.getUserDb()
			,schemaRepository: configuration.directory.schemaRepository
			,schemaEditorService: configuration.directory.schemaEditorService
			,userServerUrl: options.userServerUrl
		});

	 	configuration.contributions = new $n2.couchContributions({
			db: configuration.atlasDb
			,designDoc: configuration.atlasDesign
			,showService: configuration.show
			,uploads: configuration.uploadServer
		});
	 	
	 	configuration.popupHtmlFn = function(opt_){
	 		var feature = opt_.feature;
	 		
	 		if( feature.cluster && feature.cluster.length === 1 ){
	 			feature = feature.cluster[0];
	 		};
	 		
	 		if( feature.cluster ){
				var $tmp = $('<span></span>');
				$tmp.text( _loc('This cluster contains {count} features',{
					count: feature.cluster.length
				}) );

		 		var $wrapper = $('<div></div>');
		 		$wrapper.append($tmp);
		 		var html = $wrapper.html();
		 		
		 		opt_.onSuccess(html);

	 		} else {
		 		var doc = opt_.feature.data;
		 		
		 		var $tmp = $('<span></span>');
		 		configuration.directory.showService.displayBriefDescription($tmp,{},doc);
		 		
		 		var $wrapper = $('<div></div>');
		 		$wrapper.append($tmp);
		 		var html = $wrapper.html();
		 		
		 		opt_.onSuccess(html);
	 		};
	 	};
	 	
	 	// Cometd replacement
	 	configuration.serverSideNotifier = new $n2.couchServerSide.Notifier({
	 		dbChangeNotifier: configuration.atlasNotifier
	 		,directory: configuration.directory
	 	});
	 	configuration.directory.serverSideNotifier = configuration.serverSideNotifier;

	 	// Set up hover sound
	 	configuration.hoverSoundService = new $n2.couchSound.HoverSoundService({
			db: configuration.atlasDb
			,serviceDirectory: configuration.directory
	 	});
	 	$n2.hoverSoundService = configuration.hoverSoundService;
		configuration.directory.hoverSoundService = configuration.hoverSoundService;
		
		// Set up GeoNames service
		var geoNamesOptions = {};
		if( window.nunaliit_custom
		 && window.nunaliit_custom.geoNames ){
			if( window.nunaliit_custom.geoNames.username ){
				geoNamesOptions.username = window.nunaliit_custom.geoNames.username;
			};
		};
		configuration.directory.geoNamesService = new $n2.GeoNames.Service(geoNamesOptions);
		
		callCustomConfiguration();
	};
	
	function callCustomConfiguration(){
		if( window 
		 && window.nunaliit_custom 
		 && typeof(window.nunaliit_custom.configuration) === 'function' ){
			window.nunaliit_custom.configuration(configuration, configurationDone);
		} else {
			configurationDone();
		};
	};
	
	function configurationDone(){
		// Fix HTML from page
		if( configuration.directory.showService ){
			configuration.directory.showService.fixElementAndChildren( $('body') );
		};
		
		$n2.log('nunaliit configuration',configuration);
		options.onSuccess(configuration);
	};
};

$n2.couchConfiguration = {
	Configure: Configure
};

})(jQuery,nunaliit2);
