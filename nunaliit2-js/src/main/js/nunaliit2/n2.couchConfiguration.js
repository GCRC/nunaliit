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

*/
;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couchConfiguration';

//===========================================================

var ConfigService = $n2.Class('ConfigurationService',{

	serverUrl: null,
	
	dispatchService: null,
	
	configuration: null,
	
	serverVersion: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,dispatchService: null
			,configuration: null
		},opts_);
		
		var _this = this;
		
		this.serverUrl = opts.url;
		this.dispatchService = opts.dispatchService;
		this.configuration = opts.configuration;
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH, 'configurationGetCurrentSettings', f);
		};
	},
	
	getNunaliitServerRoles: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(roles){}
			,onError: function(err){}
		},opts_);

		$.ajax({
			url: this.serverUrl+'getServerRoles'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.roles ) {
					opts.onSuccess(data.roles);
				} else {
					opts.onError( _loc('Invalid server response') );
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				var err = $n2.utils.parseHttpJsonError(jqXHR, textStatus);
				opts.onError(err);
			}
		});
	},
	
	getAtlasRoles: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(roles){}
			,onError: function(err){}
		},opts_);

		$.ajax({
			url: this.serverUrl+'getAtlasRoles'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.roles ) {
					opts.onSuccess(data.roles);
				} else {
					opts.onError( _loc('Invalid server response') );
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				var err = $n2.utils.parseHttpJsonError(jqXHR, textStatus);
				opts.onError(err);
			}
		});
	},
	

	_handle: function(m, addr, dispatcher){
		if( 'configurationGetCurrentSettings' === m.type ){
			// Synchronous call to retrieve current configuration
			m.configuration = this.configuration;
		};
	},

	testConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(isBadProxy){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var connectionInfo = {
			badProxy: false // Assume that there is no bad proxy
			,speed: 0 // assume fast
		};

		// Get two random strings from server. The server always return
		// a new string. If two responses are the same, then there exists
		// a proxy badly configured between client and server.
		var randomStr1;
		var randomStr2;
		var startTime = Date.now();
		var endTime;
		this._getChannelRandom({
			onSuccess: firstRandomReceived
			,onError: testFailed
		});
		
		function firstRandomReceived(str){
			randomStr1 = str;
			_this._getChannelRandom({
				onSuccess: secondRandomReceived
				,onError: testFailed
			});
		};

		function secondRandomReceived(str){
			endTime = Date.now();
			randomStr2 = str;
			
			if( randomStr1 && randomStr1 === randomStr2 ){
				connectionInfo.badProxy = true;
			};
			
			connectionInfo.testDurationInMs = endTime - startTime;
			if( connectionInfo.testDurationInMs > 1500 ){
				connectionInfo.speed = 1; // slow
			};
			
			done();
		};
		
		function testFailed(err){
			$n2.log('Problem testing for bad proxy',err);
			done();
		};
		
		function done(){
			_this.connectionInfo = connectionInfo;
			opts.onSuccess(connectionInfo);
		};
	},
	
	_getChannelRandom: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(randomString){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		$.ajax({
			url: this.serverUrl+'testChannel'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.version ){
					_this._reportServerVersion(data.version);
				};

				if( data && data.random ) {
					opts.onSuccess(data.random);
				} else {
					opts.onError( 'Did not receive random from server' );
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				var err = $n2.utils.parseHttpJsonError(jqXHR, textStatus);
				opts.onError(err);
			}
		});
	},
	
	_reportServerVersion: function(version){
		if( !this.serverVersion ){
			this.serverVersion = version;

			if( this.configuration ){
				this.configuration.serverVersion = version;
			};
			
			if( n2atlas ){
				if( this.serverVersion !== n2atlas.version ){
					$n2.logError('Version mismatch. Client: '+n2atlas.version+' Server: '+this.serverVersion);
				};
			};
		};
	}
});

// ===========================================================
function Configure(options_){
	
	var options = $n2.extend({
		rootPath: null // string
		,couchServerUrl: null // string
		,atlasDbUrl: null // string
		,atlasDesignName: 'atlas'
		,siteDesignName: 'site'
		,progressServerUrl: null // string
		,mediaUrl: null // string
		,uploadServerUrl: null // string
		,exportServerUrl: null // string
		,configServerUrl: null // string
		,userServerUrl: null // string
		,submissionDbUrl: null // string
		,submissionServerUrl: null // string
		,dateServerUrl: null // string
		,simplifiedGeometryServerUrl: null // string
		,mailServerUrl: null // string
		,onSuccess: function(config){}
	},options_);

	var configuration = {
		directory: {}
		,rootPath: options.rootPath
	};
	var isSlowConnection = false;
	var couchDbCachingEnabled = false;
	var debugConfiguration;
	
	loadLibraries();
	
	function loadLibraries(){
		if( n2atlas 
		 && n2atlas.googleMapApiKey ){
			$n2.scripts.loadGoogleMapApi({
				googleMapApiKey: n2atlas.googleMapApiKey
				,onLoaded: librariesLoaded
				,onError: function(err){
					$n2.logError('Error while loading Google Map API: '+err);
					librariesLoaded();
				}
			});
		} else {
			librariesLoaded();
		};
	};
	
	function librariesLoaded(){
		// Start function
		configuration.start = function(){
			if( configuration.directory.dispatchService ){
				configuration.directory.dispatchService.send('n2.couchConfiguration',{type:'start'});
			};
		};
		
		// Custom Service
		configuration.directory.customService = new $n2.custom.CustomService({
			directory: configuration.directory
		});
		
		// Adjust configuration based on custom service
		if( configuration.directory.customService.getOption('couchDbCachingEnabled',false) ){
			couchDbCachingEnabled = true;
		};
		if( configuration.directory.customService.getOption('couchDbCachingDisabled',false) ){
			couchDbCachingEnabled = false;
		};

		// Adjust configuration based on local storage
		debugConfiguration = new $n2.debug.DebugConfiguration();
		if( debugConfiguration.isBadProxyEnabled() ){
			$n2.couch.setBadProxy(true);
		};
		if( debugConfiguration.isCouchDbCachingEnabled() ){
			couchDbCachingEnabled = true;
		};
		if( debugConfiguration.isCouchDbCachingDisabled() ){
			couchDbCachingEnabled = false;
		};
	
		// Dispatcher
		var dispatchLogging = false;
		if( debugConfiguration.isEventLoggingEnabled() ){
			dispatchLogging = true;
		};
		configuration.directory.dispatchService = new $n2.dispatch.Dispatcher({
			logging: dispatchLogging
		});

		$n2.couchMap.Configure({
			dispatchService: configuration.directory.dispatchService
		});
	
		// History monitoring
		configuration.directory.historyMonitor = new $n2.history.Monitor({
			directory: configuration.directory
		});
		configuration.directory.historyTracker = new $n2.history.Tracker({
			dispatchService: configuration.directory.dispatchService
		});
		configuration.directory.history = new $n2.history.History({
			dispatchService: configuration.directory.dispatchService
		});
	
		// Event translation
		configuration.directory.eventService = new $n2.couchEvents.EventSupport({
			directory: configuration.directory
		});
	
		// Analytics Service
		configuration.directory.analyticsService = new $n2.analytics.AnalyticsService({
			dispatchService: configuration.directory.dispatchService
		});
	
		// Intent Service
		configuration.directory.userIntentService = new $n2.userIntentView.IntentService({
			dispatchService: configuration.directory.dispatchService
		});
	
		// Turn off cometd
	 	$.cometd = {
	 		init: function(){}
	 		,subscribe: function(){}
	 		,publish: function(){}
	 	};
	
		// Configuration
		configuration.directory.configService = new ConfigService({
			url: options.configServerUrl
			,dispatchService: configuration.directory.dispatchService
			,configuration: configuration
		});
		
		// Test to see if sitting behind a bad proxy
		if( debugConfiguration.forceSlowConnectionHandling() ){
			isSlowConnection = true;
		};
		configuration.directory.configService.testConnection({
			onSuccess: function(connectionInfo){
				$n2.log('Connection speed:'+ connectionInfo.speed +' elapsed:'+connectionInfo.testDurationInMs+'ms');
				if( connectionInfo.badProxy ){
					$n2.couch.setBadProxy(true);
					$n2.log('Detected bad proxy in communication channel');
				};
				if( connectionInfo.speed > 0 ){
					isSlowConnection = true;
					$n2.log('Detected slow connection');
				} else {
					
				};
				communicationsTested();
			}
			,onError: communicationsTested // continue
		});
	};
	
	function communicationsTested(){
		if( isSlowConnection ){
			$n2.log('Slow connection handling requested');
		};
		if( $n2.couch.isBadProxy() ){
			$n2.log('Bad proxy circumvention requested');
		};
		
		// Open Indexed DB
		$n2.indexedDb.openIndexedDb({
			dispatchService: configuration.directory.dispatchService
			,onSuccess: function(indexedDbService){
				configuration.directory.indexedDbService = indexedDbService;
				indexedDbInitialized();
			}
			,onError: indexedDbInitialized
		});
	};

	function indexedDbInitialized(){

		// Initialize CouchDB
		if( couchDbCachingEnabled
		 && configuration.directory.indexedDbService ){
	 	 	$n2.couch.initialize({
	 	    	pathToServer: options.couchServerUrl
	 	    	,onSuccess: function(couchServer){
	 				$n2.couchIndexedDb.getServer({
	 					couchServer: couchServer
	 					,dispatchService: configuration.directory.dispatchService
	 					,indexedDbService: configuration.directory.indexedDbService
	 					,onSuccess: couchInitialized
	 					,onError: function(err){
	 				 		$n2.log('Error while initializing cached server.',err);
	 				 		couchInitialized(couchServer);
	 					}
	 				});
	 	    	}
	 	 		,onError: couchInitError
	 	 	});
	 	} else {
	 	 	$n2.couch.initialize({
	 	    	pathToServer: options.couchServerUrl
	 	    	,onSuccess: couchInitialized
	 	    	,onError: couchInitError
	 	 	});
	 	};
	 	
	 	function couchInitError(err){
	 		$n2.log('Unable to initialize with CouchDb server.',err);
	 	};
	};
	
	function couchInitialized(couchServer) {
		
		configuration.couchServer = couchServer;
		configuration.directory.couchServer = couchServer;
		
		var remoteDocumentCountLimit = undefined;
		var remoteRevisionCountLimit = undefined;
		var changeNotifierRefreshIntervalInMs = undefined;
		if( isSlowConnection ){
			remoteDocumentCountLimit = 100;
			remoteRevisionCountLimit = 1000;
			changeNotifierRefreshIntervalInMs = 15000;
		};
		configuration.atlasDb = configuration.couchServer.getDb({
			dbUrl:options.atlasDbUrl
			,allowCaching: true
			,remoteDocumentCountLimit: remoteDocumentCountLimit
			,remoteRevisionCountLimit: remoteRevisionCountLimit
			,changeNotifierRefreshIntervalInMs: changeNotifierRefreshIntervalInMs
		});
		configuration.atlasDesign = configuration.atlasDb.getDesignDoc({ddName:options.atlasDesignName});
		configuration.siteDesign = configuration.atlasDb.getDesignDoc({ddName:options.siteDesignName});

		configuration.atlasDb.getInfo({
			onSuccess: function(dbInfo){
				configuration.atlasDbName = dbInfo.db_name;
				atlasDbInfoRetrieved();
			}
			,onError: atlasDbInfoRetrieved
		});
	};
	
	function atlasDbInfoRetrieved() {

		configuration.directory.attachmentService = new $n2.couchAttachment.AttachmentService({
			mediaRelativePath: options.mediaUrl
			,dispatchService: configuration.directory.dispatchService
		});
		
		if( options.submissionDbUrl ){
			configuration.submissionDb = configuration.couchServer.getDb({dbUrl:options.submissionDbUrl});
		};
		
		configuration.dataSources = [];
		
		var couchDbDs = null;
		if( configuration.submissionDb ){
			couchDbDs = new $n2.couchDocument.CouchDocumentSourceWithSubmissionDb({
				id: 'main'
				,db: configuration.atlasDb
				,submissionDb: configuration.submissionDb
				,submissionServerUrl: options.submissionServerUrl
				,dispatchService: configuration.directory.dispatchService
				,attachmentService: configuration.directory.attachmentService
				,isDefaultDocumentSource: true
			});
		} else {
			couchDbDs = new $n2.couchDocument.CouchDocumentSource({
				id: 'main'
				,db: configuration.atlasDb
				,dispatchService: configuration.directory.dispatchService
				,attachmentService: configuration.directory.attachmentService
				,isDefaultDocumentSource: true
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
		configuration.directory.schemaRepository = new $n2.couchSchema.CouchSchemaRepository({
			db: configuration.atlasDb
			,designDoc: configuration.atlasDesign
			,dispatchService: configuration.directory.dispatchService
			,preload: true
			,preloadedCallback: schemasPreloaded 
		});
	};
	
	function schemasPreloaded() {
		var refreshIntervalInSec = undefined; // do not change default
		if( isSlowConnection ){
			refreshIntervalInSec = 10;
		};
		configuration.directory.authService = new $n2.couchAuth.AuthService({
			onSuccess: authInitialized
			,atlasDb: configuration.atlasDb
			,schemaRepository: configuration.directory.schemaRepository
			,directory: configuration.directory
			,userServerUrl: options.userServerUrl
			,refreshIntervalInSec: refreshIntervalInSec
		});
	};
	
	function authInitialized() {

		configuration.directory.localizationService = new $n2.couchL10n.LocalizationService({
			db: configuration.atlasDb
	 		,designDoc: configuration.atlasDesign
	 		,dispatchService: configuration.directory.dispatchService
	 	});

	 	configuration.directory.progressService = new $n2.progress.ProgressServer({
			url: options.progressServerUrl
		});

	 	configuration.directory.uploadService = new $n2.upload.Upload({
			url: options.uploadServerUrl
			,progressServer: configuration.directory.progressService
		});

	 	configuration.directory.mailService = new $n2.mail.MailService({
			url: options.mailServerUrl
			,dispatchService: configuration.directory.dispatchService
			,customService: configuration.directory.customService
		});

		configuration.directory.exportService = new $n2.couchExport.ExportService({
			url: options.exportServerUrl
			,atlasDb: configuration.atlasDb
			,atlasDesign: configuration.atlasDesign
			,config: configuration
		});

		configuration.directory.dateService = new $n2.dateService.DateService({
			url: options.dateServerUrl
		});
		
	 	configuration.directory.searchService = new $n2.couchSearch.SearchServer({
			designDoc: configuration.atlasDesign
			,db: configuration.atlasDb
			,dispatchService: configuration.directory.dispatchService
			,customService: configuration.directory.customService
			,dateService: configuration.directory.dateService
		});
		
	 	configuration.mediaRelativePath = options.mediaUrl;

	 	configuration.directory.requestService = new $n2.couchRequests({
			documentSource: configuration.documentSource
			,userDb: $n2.couch.getUserDb()
			,dispatchService: configuration.directory.dispatchService
			,userServerUrl: options.userServerUrl
		});

		configuration.directory.dispatchSupport = new $n2.couchDispatchSupport.DispatchSupport({
			dispatchService: configuration.directory.dispatchService
		});

		configuration.directory.languageService = new $n2.languageSupport.LanguageService({
			directory: configuration.directory
		});
		
		configuration.directory.displayImageSourceFactory = new $n2.couchDisplayBox.DisplayImageSourceFactory({
			dispatchService: configuration.directory.dispatchService
		});
		
		configuration.directory.showService = new $n2.couchShow.Show({
			db: configuration.atlasDb
			,documentSource: configuration.documentSource
			,requestService: configuration.directory.requestService
			,dispatchService: configuration.directory.dispatchService
			,schemaRepository: configuration.directory.schemaRepository
			,customService: configuration.directory.customService
			,attachmentService: configuration.directory.attachmentService
			,displayImageSourceFactory: configuration.directory.displayImageSourceFactory
		});
		
		// Navigation Service
		configuration.directory.navigationService = new $n2.couchNavigation.NavigationService({
			dispatchService: configuration.directory.dispatchService
			,showService: configuration.directory.showService
			,documentSource: configuration.documentSource
		});

		configuration.directory.dialogService = new $n2.couchDialogs.DialogService({
			dispatchService: configuration.directory.dispatchService
			,documentSource: configuration.documentSource
			,searchService: configuration.directory.searchService
			,showService: configuration.directory.showService
			,schemaRepository: configuration.directory.schemaRepository
		});
		
		configuration.directory.createDocProcess = new $n2.couchRelatedDoc.CreateRelatedDocProcess({
			documentSource: configuration.documentSource
			,schemaRepository: configuration.directory.schemaRepository
			,uploadService: configuration.directory.uploadService
			,showService: configuration.directory.showService
			,authService: configuration.directory.authService
			,dialogService: configuration.directory.dialogService
			,dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.commentService = new $n2.comment.Service({
			documentSource: configuration.documentSource
			,showService: configuration.directory.showService
			,createDocProcess: configuration.directory.createDocProcess
			,dispatchService: configuration.directory.dispatchService
			,customService: configuration.directory.customService
		});
		
	 	configuration.directory.schemaEditorService = new $n2.couchEdit.SchemaEditorService({
			documentSource: configuration.documentSource
			,showService: configuration.directory.showService
			,searchService: configuration.directory.searchService
			,dispatchService: configuration.directory.dispatchService
			,dialogService: configuration.directory.dialogService
		});
		
	 	configuration.directory.editService = new $n2.couchEdit.EditService({
			documentSource: configuration.documentSource
			,schemaRepository: configuration.directory.schemaRepository
			,uploadService: configuration.directory.uploadService
			,showService: configuration.directory.showService
			,authService: configuration.directory.authService
			,dispatchService: configuration.directory.dispatchService
			,searchService: configuration.directory.searchService
			,schemaEditorService: configuration.directory.schemaEditorService
			,customService: configuration.directory.customService
			,dialogService: configuration.directory.dialogService
			,createDocProcess: configuration.directory.createDocProcess
		});
	 	configuration.couchEditor = configuration.directory.editService; // legacy
		
	 	configuration.directory.userService = new $n2.couchUser.UserService({
			userDb: $n2.couch.getUserDb()
			,configService: configuration.directory.configService
			,schemaRepository: configuration.directory.schemaRepository
			,schemaEditorService: configuration.directory.schemaEditorService
			,userServerUrl: options.userServerUrl
			,customService: configuration.directory.customService
		});
		
	 	configuration.directory.modelService = new $n2.model.Service({
			dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.utilityService = new $n2.utilities.Service({
			dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.instanceService = new $n2.instance.Service({
			dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.canvasService = new $n2.canvas.Service({
			dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.displayService = new $n2.display.Service({
			dispatchService: configuration.directory.dispatchService
		});
		
	 	configuration.directory.widgetService = new $n2.widgetBasic.Service({
	 		config: configuration
		});
	 	
	 	$n2.mapAndControls.DefaultPopupHtmlFunction = function(opt_){
	 		var feature = opt_.feature;
	 		
	 		if( feature.cluster && feature.cluster.length === 1 ){
	 			feature = feature.cluster[0];
	 		};
	 		
	 		if( feature.cluster ){
	 			var clusterSize = feature.cluster.length;
	 			if( feature.attributes && feature.attributes.count ){
		 			clusterSize = feature.attributes.count;
	 			};
	 			
				var $tmp = $('<span class="n2_popup"></span>');
				$tmp.text( _loc('This cluster contains {count} features',{
					count: clusterSize
				}) );

		 		var $wrapper = $('<div></div>');
		 		$wrapper.append($tmp);
		 		var html = $wrapper.html();
		 		
		 		opt_.onSuccess(html);

	 		} else {
		 		var doc = opt_.feature.data;
		 		
		 		var $tmp = $('<span class="n2_popup"></span>');
		 		configuration.directory.showService.displayBriefDescription($tmp,{},doc);
		 		
		 		var $wrapper = $('<div></div>');
		 		$wrapper.append($tmp);
		 		var html = $wrapper.html();
		 		
		 		opt_.onSuccess(html);
	 		};
	 	};

	 	// Set up hover sound
	 	configuration.directory.hoverSoundService = new $n2.couchSound.HoverSoundService({
			db: configuration.atlasDb
			,dispatchService: configuration.directory.dispatchService
			,requestService: configuration.directory.requestService
			,customService: configuration.directory.customService
	 	});
		
		// Set up GeoNames service
		var geoNamesOptions = {};
		if( window.nunaliit_custom
		 && window.nunaliit_custom.geoNames ){
			if( window.nunaliit_custom.geoNames.username ){
				geoNamesOptions.username = window.nunaliit_custom.geoNames.username;
			};
		};
		configuration.directory.geoNamesService = new $n2.GeoNames.Service(geoNamesOptions);

		configuration.directory.importProfileService = new $n2.couchImportProfile.ImportProfileService({
			atlasDb: configuration.atlasDb
			,atlasDesign: configuration.atlasDesign
			,schemaRepository: configuration.directory.schemaRepository
		});

		configuration.directory.documentListService = new $n2.couchDocumentList.DocumentListService({
			atlasDesign: configuration.atlasDesign
			,dispatchService: configuration.directory.dispatchService
		});

		configuration.directory.simplifiedGeometryService = new $n2.couchSimplifiedGeometries.Service({
			url: options.simplifiedGeometryServerUrl
			,atlasDb: configuration.atlasDb
			,dispatchService: configuration.directory.dispatchService
			,customService: configuration.directory.customService
			,indexedDbService: couchDbCachingEnabled ? configuration.directory.indexedDbService : null
			,dbName: configuration.atlasDbName
		});

		if( $n2.tuioClient ){
			configuration.directory.tuioService = new $n2.tuioClient.TuioService({
				dispatchService: configuration.directory.dispatchService
			});
		};
		
		// Load help files
		if( configuration.atlasDb ){
			$n2.couchHelp.InstallHelpDocument({
				db: configuration.atlasDb
				,id: 'help.dates'
				,key: 'dates'
			});

			$n2.couchHelp.InstallHelpDocument({
				db: configuration.atlasDb
				,id: 'help.wiki'
				,key: 'wiki'
			});
		};
		
		callCustomConfiguration();
	};
	
	function callCustomConfiguration(){
		if( !$n2.scripts.areAllCustomScriptsLoaded() ){
			// More scripts needed to load
			window.setTimeout(callCustomConfiguration, 100);
			return;
		};

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
	,ConfigService: ConfigService
};

})(jQuery,nunaliit2);
