;(function($,$n2){

var HTTP = 'http://';
var HTTPS = 'https://';
var B64 = ';base64,';
var DATA = 'data:';

function isKeyEditingAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

function isValueEditingAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};

function isKeyDeletionAllowed(obj, selectors, data) {
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	
	return true;
};


//=============================================================
// A connection object represents the link between a local
// database and a remote database. In mobile applications, this
// link is important since the local database is simply a proxy
// for the remote database, used while the user in away from the
// remote database.
var Connection = $n2.Class({
	
	doc: null
	
	,options: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(connectionDoc_, opts_){
		
		this.options = $n2.extend({
				server: null
				,db: null
				,designDoc: null
			}
			,opts_
		);
		
		this.doc = $n2.extend(
			true
			,{
				//_id: null
				//_rev: null
				nunaliit_type: 'connection'
				,label: null
				,localDb: null
				,remoteDb: {
					protocol: null
					,server: null
					,db: null
					,user: null
					,password: null
				}
			}
			,connectionDoc_
		);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConnectionId: function(){
		return this.doc._id;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getLocalDbName: function(){
		return this.doc.localDb;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getLabel: function(){
		return this.doc.label;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRemoteUser: function(){
		return this.doc.remoteDb.user;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRemoteServerUrl: function(){
		var remoteDb = this.doc.remoteDb;
		
		var sourceUrl = [remoteDb.protocol,'://'];
		sourceUrl.push(remoteDb.server);
		sourceUrl.push('/');
		
		return sourceUrl.join('');
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRemoteReplicationUrl: function(){
		var remoteDb = this.doc.remoteDb;
		
		var sourceUrl = [remoteDb.protocol,'://'];
		if( remoteDb.user && remoteDb.password ) {
			sourceUrl.push(remoteDb.user);
			sourceUrl.push(':');
			sourceUrl.push(remoteDb.password);
			sourceUrl.push('@');
		};
		sourceUrl.push(remoteDb.server);
		sourceUrl.push('/');
		sourceUrl.push(remoteDb.db);

		return sourceUrl.join('');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,save: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var _this = this;
		
		opts.onProgress('Saving connection');

		if( this.doc._id 
		 && this.doc._rev ){
			this.options.db.updateDocument({
				data: this.doc
				,onSuccess: function(docInfo){
					_this.doc._rev = docInfo.rev;
					opts.onSuccess();
				}
				,onError: function(err){
					opts.onError('Unable to save connection: '+err);
				}
			});
		} else {
			this.options.db.createDocument({
				data: this.doc
				,onSuccess: function(docInfo){
					_this.doc._id = docInfo.id;
					_this.doc._rev = docInfo.rev;
					opts.onSuccess();
				}
				,onError: function(err){
					opts.onError('Unable to save connection: '+err);
				}
			});
		};
		
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,computeLabel: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		var _this = this;
		
		opts.onProgress('Assigning name to connection');

		var remoteDb = this.doc.remoteDb;

		// Get all connection documents, compiling
		// labels
		var labels = {};
		this.options.designDoc.queryView({
			viewName:'connections'
			,onSuccess: function(rows){
				for(var i=0,e=rows.length; i<e; ++i){
					var connDoc = rows[i].value;
					if( connDoc.label ) {
						labels[connDoc.label] = true;
					};
				};
				pickLabel();
			}
			,onError: opts.onError
		});
		
		function pickLabel(){
			var baseLabel = remoteDb.db  + ' (' + remoteDb.server + ')';
			var index = 0;
			var limit = 30;
			var currentLabel = baseLabel;
			
			while( labels[currentLabel] ){
				++index;
				--limit;
				
				if( limit <= 0 ) {
					opts.onError('Unable to find a unique label');
				};
				
				currentLabel = baseLabel + ' - '+index;
			};
			
			_this.doc.label = currentLabel;
			opts.onSuccess(currentLabel);
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,verifyRemoteCommunications: function(opts_){
		var opts = $n2.extend({
			authenticate: false
			,verifyDbName: false
			,verifyDesignDoc: false
			,onSuccess: function(remoteServer,remoteDb){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		opts.onProgress('Verify remote server communications');
		
		var remoteServerUrl = this.getRemoteServerUrl();
		var remoteDbObj = this.doc.remoteDb;
		var remoteDb = null;
		
		var remoteServer = $n2.couch.getServer({
			pathToServer: remoteServerUrl
			,skipSessionInitialization: true
			,onSuccess: function(){
				var version = remoteServer.getVersion();
				opts.onProgress('Remote Server contacted. Version: '+version);
				remoteAuthenticate();
			}
			,onError: function(){
				remoteServerError('Can not reach remote server');
			}
		});
		
		function remoteAuthenticate() {
			if( !opts.authenticate ) {
				// Skip authentication
				checkRemoteDatabaseName();
				
			} else if( remoteDbObj.user 
			 && remoteDbObj.password ){
				opts.onProgress('Authenticating with remote server...');
				remoteServer.getSession().login({
					name: remoteDbObj.user
					,password: remoteDbObj.password
					,onSuccess: checkRemoteDatabaseName
					,onError: remoteServerError
				});
				
			} else {
				// Credentials not provided
				checkRemoteDatabaseName();
			};
		};
		
		function checkRemoteDatabaseName() {
			remoteDb = remoteServer.getDb({dbName:remoteDbObj.db});

			if( !opts.verifyDbName ) {
				communicationsOK();
				
			} else {
				opts.onProgress('Connecting to remote database...');
				remoteDb.getInfo({
					onSuccess: checkRemoteDatabaseDesignDocument
					,onError: function() {
						remoteServerError('Can not find database on remote server');
					}
				});
			};
		};
		
		function checkRemoteDatabaseDesignDocument() {
			if( !opts.verifyDesignDoc ) {
				communicationsOK();
				
			} else {
				opts.onProgress('Verifying remote database...');
				remoteDb.getDocumentRevision({
					docId: '_design/mobile'
					,onSuccess: communicationsOK
					,onError: function(){
						remoteServerError('Unable to detect proper design in remote database');
					}
				});
			};
		};
		
		function communicationsOK(){
			opts.onSuccess(remoteServer,remoteDb);
		};
		
		function remoteServerError(err) {
			opts.onProgress('Error: '+err);
			opts.onError(err);
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createLocalDb: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		var _this = this;
		
		// Set up variables for local name search
		var baseName = this.doc.remoteDb.db;
		var count = 0;
		var limit = 30;
		var currentName = baseName;
		
		opts.onProgress('Looking for local database name');
		findAvailableDbName();
		
		function findAvailableDbName(){
			var testDb = _this.options.server.getDb({dbName:currentName});
			testDb.getInfo({
				onError: createDb
				,onSuccess: function(){
					--limit;
					if( limit <= 0 ) {
						opts.onError('Unable to find available local name');
					} else {
						++count;
						currentName = baseName+'_'+count;
						findAvailableDbName();
					};
				}
			});
		};
		
		function createDb(){
			opts.onProgress('Creating local database');

			_this.doc.localDb = currentName;
			
			_this.options.server.createDb({
				dbName:currentName
				,onSuccess: opts.onSuccess
				,onError: function(err){
					opts.onError('Unable to create local database: '+err)
				}
			});
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,deleteLocalDb: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		var _this = this;
		
		var localDbName = this.getLocalDbName();
		if( null == localDbName ) {
			// Nothing to do
			opts.onSuccess();
		} else {
			opts.onProgress('Removing local database');

			this.options.server.deleteDb({
				dbName: localDbName
				,onSuccess: function(){
					_this.doc.localDb = null;
					opts.onSuccess();
				}
				,onError: opts.onError
			});
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,addPurgedDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var doc = this.doc;
		if( !doc.purgedDocs ) {
			doc.purgedDocs = [];
		};
		doc.purgedDocs.push( opts.docId );
		
		this.save({
			onSuccess: opts.onSuccess
			,onError: opts.onError
		});
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,removePurgedDocuments: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var savingRequired = false;

		var purgedDocs = this.doc.purgedDocs;
		if( purgedDocs && purgedDocs.length > 0 ) {
			for(var i=0,e=opts.docIds.length; i<e; ++i){
				var index = purgedDocs.indexOf(opts.docIds[i]);
				
				if( index >= 0 ) {
					purgedDocs.splice(index,1);
					savingRequired = true;
				};
			};
		};

		if( savingRequired ) {
			this.save({
				onSuccess: opts.onSuccess
				,onError: opts.onError
			});
		} else {
			opts.onSuccess();
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPurgedDocuments: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(purgeDocIds){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var doc = this.doc;
		var purgedDocs = doc.purgedDocs;
		if( !purgedDocs ) {
			purgedDocs = [];
		};
		opts.onSuccess(purgedDocs);
	}
});

// =============================================================
// An instance of CurrentDatabase is used to represent which
// database is in use, within the context of a mobile application.
// In mobile applications, multiple databases can be stored locally
// to replicate remote ones (connection). However, the instance
// of CurrentDatabase narrows the services that are available when
// one of these databases are selected.
var CurrentDatabase = $n2.Class({

	options: null
	
	,designDoc: null
	
	,serviceDirectory: null

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			connection: null
			,db: null
			,onSuccess: function(currentDb){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		this.serviceDirectory = {};

		// Dispatch service
		this.serviceDirectory.dispatchService = new $n2.dispatch.Dispatcher();
		
		// Design Doc
		this.designDoc = this.options.db.getDesignDoc({ddName:'mobile'});

		// Search Server
		this.serviceDirectory.searchService = new $n2.couchSearch.SearchServer({
			designDoc: this.getDesignDoc()
			,db: this.getDb()
		});
		
		// Request Service
		this.serviceDirectory.requestService = new $n2.couchRequests({
			db: this.options.db
			,userDb: null
			,designDoc: this.designDoc
			,cacheService: null
		});
		
		// Schema Repository
		this.serviceDirectory.schemaRepository = new $n2.schema.SchemaRepository();
		this.serviceDirectory.schemaRepository.loadSchemasFn = function(loadingOptions){
			_this._loadSchemas(loadingOptions);
		};
		
		// Show service
		this.serviceDirectory.showService = new $n2.couchShow.Show({
			db: this.getDb()
			,designDoc: this.getDesignDoc()
			,serviceDirectory: this.serviceDirectory
			,defaultSchema: null
			,displayFunction: function(docId,opt_){
				new $n2.mobile.MobileViewer({
					currentDb: _this
					,docId: docId
					,pageOptions: null
				});
			}
			,editFunction: null
			,deleteFunction: null
			,findGeometryFunction: null
			,viewLayerFunction: null
		});
		this.serviceDirectory.showService.domStyler._insertMediaView = function(data, $insertView, opt_) {
			var attachmentName = $insertView.text();

			$insertView.empty();
			
			var $button = $('<a href="#">View</a>');
			$insertView.append( $button );

			$n2.mobile.DisplayMediaThumbnail(_this.options.db, $button, data, attachmentName);

			$button.click(function(){
				new $n2.mobile.MobileMediaViewer({
					currentDb: _this
					,doc: data
					,attachmentName: attachmentName
				});
				return false;
			});
		};
		this.serviceDirectory.showService.domStyler._insertExternalMediaLink = function(data, $externalLink, opt_) {
			var attachmentName = $externalLink.attr('href');
			
			var file = null;
			if( data 
			 && data.nunaliit_attachments 
			 && data.nunaliit_attachments.files ) {
				file = data.nunaliit_attachments.files[attachmentName];
			};
			
			if( file
			 && data._attachments 
			 && data._attachments[attachmentName] ) {
				
				$externalLink.click(function(e){
					new $n2.mobile.MobileMediaViewer({
						currentDb: _this
						,doc: data
						,attachmentName: attachmentName
					});
					return false;
				});

			} else {
				// At this point, we have a link that leads nowhere. Simply report
				// error to user.
				$externalLink.click(function(e){
					alert( _loc('File is not currently available') );
					return false;
				});
			};
		};

	 	// Set up hover sound
		this.serviceDirectory.hoverSoundService = new $n2.couchSound.HoverSoundService({
			db: this.getDb()
			,serviceDirectory: this.serviceDirectory
	 	});
		this.serviceDirectory.hoverSoundService._insertSoundElement = function($div, url){
			$div.html('<audio src="'+url+'" autoplay="autoplay"/>');
		};
		
		this.options.onSuccess(this);

		delete this.options.onSuccess;
		delete this.options.onError;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConnection: function(){
		return this.options.connection;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDb: function(){
		return this.options.db;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDesignDoc: function(){
		return this.designDoc;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getSearchServer: function(){
		return this.serviceDirectory.searchService;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getSchemaRepository: function(){
		return this.serviceDirectory.schemaRepository;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRequestService: function(){
		return this.serviceDirectory.requestService;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getShowService: function(){
		return this.serviceDirectory.showService;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRemoteUserName: function(){
		// Get user name
		var userName = null;
		var connection = this.getConnection();
		if( connection ) {
			userName = connection.getRemoteUser();
		};
		return userName;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getRemoteUserName: function(){
		// Get user name
		var userName = null;
		var connection = this.getConnection();
		if( connection ) {
			userName = connection.getRemoteUser();
		};
		return userName;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,adjustLastUpdated: function(doc){
		// Get user name
		var userName = this.getRemoteUserName();
		
		// Get now
		var nowTime = (new Date()).getTime();
		
		if( userName ) {
			if( null == doc.nunaliit_created ) {
				doc.nunaliit_created = {
					nunaliit_type: 'actionstamp'
					,name: userName
					,time: nowTime
					,action: 'created'
				};
			};
			
			doc.nunaliit_last_updated = {
				nunaliit_type: 'actionstamp'
				,name: userName
				,time: nowTime
				,action: 'updated'
			};
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	// This is called when current connection was synced
	// and this instance must forget information previously
	// loaded from the database
	,resetCached: function(){
		var _this = this;
		
		// Reset Schema Repository
		this.serviceDirectory.schemaRepository.reset();
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_computeSchemaRepository: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(schemaRepository){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var _this = this;
		
		if( null !== this.serviceDirectory.schemaRepository ) {
			opts.onSuccess(this.serviceDirectory.schemaRepository);
			return;
		};

		// Get a list of all schema documents
		opts.onProgress('Query schema view');
		var designDoc = this.getDesignDoc();
		designDoc.queryView({
			viewName:'schemas'
			,onSuccess: function(rows){
				var ids = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					var docId = rows[i].id;
					ids.push(docId);
				};
				getDocs(ids);
			}
			,onError: opts.onError
		});
		
		// Get content of all documents, selecting those that are
		// schemas
		function getDocs(ids) {
			opts.onProgress('Get all documents ('+ids.length+')');
			_this.options.db.getDocuments({
				docIds: ids
				,onSuccess: function(docs){
					var schemas = [];
					for(var i=0,e=docs.length; i<e; ++i) {
						var doc = docs[i];
						schemas.push(doc);
					};
					restoreDefaultSchemaRepository(schemas);
				}
				,onError: onError
			});
		};
		
		// Create a new repository containing the schemas, and
		// install it as default repository
		function restoreDefaultSchemaRepository(schemaDefs) {
			opts.onProgress('Installing schema definitions');

			var schemaRepository = new $n2.schema.SchemaRepository();
			schemaRepository.addSchemas({
				schemas: schemaDefs
				,onSuccess: function(){
					onSuccess(schemaRepository);
				}
				,onError: onError
			});
		};
		
		function onSuccess(schemaRepository) {
			_this.serviceDirectory.schemaRepository = schemaRepository;
			opts.onProgress('Completed schema repository');
			opts.onSuccess(_this.serviceDirectory.schemaRepository);
		};
		
		function onError(err) {
			opts.onProgress('Error while creating schema repository: '+err);
			opts.onError(err);
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_loadSchemas: function(opts_){
		var opt = $n2.extend({
			names: null
			,rootSchemas: false
			,onSuccess: function(schemaDefinitions){}
			,onError: function(err){ $n2.reportError(err); }
		},opts_);
		
		var _this = this;
		
		var viewRequest = {
			viewName: 'schemas'
			,onSuccess: function(rows){
				var docIds = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					docIds.push(rows[i].id);
				};
				getDocs(docIds);
			}
			,onError: opt.onError
		};
		
		if( opt.names ) {
			viewRequest.keys = opt.names;
		};
		
		if( opt.rootSchemas ) {
			viewRequest.viewName = 'schemas-root';
		};
		
		// Query view
		this.designDoc.queryView(viewRequest);
		
		// Get content of schema documents
		function getDocs(docIds) {
			_this.options.db.getDocuments({
				docIds: docIds
				,onSuccess: function(docs){
					opt.onSuccess(docs);
				}
				,onError: opt.onError
			});
		};
	}
});

//=============================================================
var Configuration = $n2.Class({

	options: null
	
	,currentDatabase: null
	
	,currentDbListeners: null
	
	,syncListeners: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			server: null
			,db: null
			,designDoc: null
		},opts_);
		
		this.currentDatabase = null;
		this.currentDbListeners = [];
		this.syncListeners = [];
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getServer: function(){
		return this.options.server;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDb: function(){
		return this.options.db;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDesignDoc: function(){
		return this.options.designDoc;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,addSetCurrentDbListener: function(listener){
		this.currentDbListeners.push(listener);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,addSyncCurrentDbListener: function(listener){
		this.syncListeners.push(listener);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCurrentDb: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(currentDb){}
			,onError: function(){}
		},opts_);

		var _this = this;
		var currentDb = null;
		
		if( null !== this.currentDatabase ) {
			opts.onSuccess(this.currentDatabase);
		} else {
			// load from current object
			this.options.db.getDocument({
				docId:'currentDb'
				,onSuccess: currentDbLoaded
				,onError: function(){
					// If no currentDb object, then return null
					opts.onSuccess(null);
				}
			});
		};
		
		function currentDbLoaded(currentDb_){
			currentDb = currentDb_;
			
			if( ! currentDb.connectionId ){
				opts.onSuccess(null);
				
			} else {
				_this.getConnection({
					connectionId: currentDb.connectionId
					,onSuccess: connectionLoaded
					,onError: opts.onError
				});
			};
		};
		
		function connectionLoaded(connection){
			var db = _this.options.server.getDb({dbName:connection.getLocalDbName()});
			new CurrentDatabase({
				connection: connection
				,db: db
				,onSuccess: currentDatabaseInitialized
				,onError: opts.onError
			});
		};
		
		function currentDatabaseInitialized(currentDatabase){
			_this.currentDatabase = currentDatabase;
			opts.onSuccess(_this.currentDatabase);
		}
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,setCurrentDb: function(opts_){
		var opts = $n2.extend({
			connection: null
			,onSuccess: function(){}
			,onError: function(){}
		},opts_);
		
		var _this = this;

		// Erase cached current database
		this.currentDatabase = null;

		var connectionId = null;
		var localDbName = null;
		if( opts.connection ) {
			connectionId = opts.connection.getConnectionId();
			localDbName = opts.connection.getLocalDbName();
		};
		
		var db = this.options.db;
		db.getDocument({
			docId:'currentDb'
			,onSuccess: function(currentDoc){
				currentDoc.connectionId = connectionId;
				db.updateDocument({
					data: currentDoc
					,onSuccess: success
					,onError: opts.onError
				});
			}
			,onError: function(){
				var currentDoc = {
					_id: 'currentDb'
					,nunaliit_type: 'currentDb'
					,connectionId: connectionId
				};
				db.createDocument({
					data: currentDoc
					,onSuccess: success
					,onError: opts.onError
				});
			}
		});
		
		function success(){
			opts.onSuccess();
			for(var i=0,e=_this.currentDbListeners.length; i<e; ++i){
				_this.currentDbListeners[i]();
			};
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCurrentConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(currentConnection){}
			,onError: function(){}
		},opts_);

		var _this = this;
		this.getCurrentDb({
			onSuccess: function(currentDb){
				if( ! currentDb ) {
					opts.onSuccess(null);
				} else {
					opts.onSuccess( currentDb.getConnection() );
				};
			}
			,onError: opts.onError
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConnection: function(opts_){
		var opts = $n2.extend({
			connectionId: null
			,onSuccess: function(connection){}
			,onError: function(){}
		},opts_);

		var _this = this;
		
		this.options.db.getDocument({
			docId: opts.connectionId
			,onSuccess: connectionDocLoaded
			,onError: opts.onError
		});
		
		function connectionDocLoaded(connectionDoc){
			var conn = new Connection(
				connectionDoc
				,_this.options
				);
			opts.onSuccess(conn);
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConnections: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(connections){}
			,onError: function(){}
		},opts_);
		
		var _this = this;

		this.options.designDoc.queryView({
			viewName:'connections'
			,onSuccess: function(rows){
				var conns = [];
				for(var i=0,e=rows.length; i<e; ++i){
					var connDoc = rows[i].value;
					var conn = new Connection(
						connDoc
						,_this.options
						);
					conns.push( conn );
				};
				opts.onSuccess(conns);
			}
			,onError: opts.onError
		});
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,deleteCurrentConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		// Erase cached current database
		this.currentDatabase = null;
		
		var currentConnection = null;
		
		var _this = this;
		
		opts.onProgress('Retrieve current connection');
		this.getCurrentConnection({
			onSuccess: receiveCurrentConnection
			,onError: opts.onError
		});
		
		function receiveCurrentConnection(currentConnection_){
			currentConnection = currentConnection_;
			
			opts.onProgress('Erasing local database');
			currentConnection.deleteLocalDb({
				onSuccess: databaseDeleted
				,onError: opts.onError
			});
		};
		
		function databaseDeleted(){
			opts.onProgress('Removing configuration');
			_this.options.db.deleteDocument({
				data: currentConnection.doc
				,onSuccess: connectionDeleted
				,onError: opts.onError
			});
		};
		
		function connectionDeleted(){
			opts.onProgress('Fetching remaining connections');
			_this.getConnections({
				onSuccess: selectNewConnection
				,onError: opts.onError
			});
		};
		
		function selectNewConnection(remainingConnections){
			opts.onProgress('Selecting new connection as current');
			for(var i=0,e=remainingConnections.length; i<e; ++i){
				if( remainingConnections[i].getConnectionId() !== currentConnection.getConnectionId() ) {
					_this.setCurrentDb({
						connection: remainingConnections[i]
						,onSuccess: done
						,onError: opts.onError
					});
					return;
				};
			};
			
			// At this point, no more connections
			_this.setCurrentDb({
				connection: null
				,onSuccess: done
				,onError: opts.onError
			});
		};
		
		function done(){
			opts.onProgress('Completed');
			opts.onSuccess();
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,syncCurrentConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var _this = this;
		
		opts.onProgress('Retrieve current connection');
		this.getCurrentDb({
			onSuccess: function(currentDb_){
				_this.syncConnection({
					currentDb: currentDb_
					,onSuccess: success
					,onError: opts.onError
					,onProgress: opts.onProgress
				});
			}
			,onError: opts.onError
		});
		
		function success(){
			opts.onSuccess();
			for(var i=0,e=_this.syncListeners.length; i<e; ++i){
				_this.syncListeners[i]();
			};
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,syncConnection: function(opts_){
		var opts = $n2.extend({
			currentDb: null
			,onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var currentDb = opts.currentDb;
		var remoteServer = null;
		var remoteDb = null;
		var allDocIds = null;
		var downloadDocIds = null;
		var purgeDocIds = null;
		var remoteDocIdsToDelete = null;
		var purgedDocIdsNotOnRemote = null;
		
		var _this = this;
		
		currentDb.resetCached();
		var currentConnection = currentDb.getConnection();
		var remoteReplicationUrl = currentConnection.getRemoteReplicationUrl();

		opts.onProgress('Trying to reach remote server');

		currentConnection.verifyRemoteCommunications({
			authenticate: true
			,verifyDbName: true
			,onSuccess: function(remoteServer_,remoteDb_){
				remoteServer = remoteServer_;
				remoteDb = remoteDb_;
				obtainListOfUploads();
			}
			,onError: opts.onError
			,onProgress: opts.onProgress
		});
		
		function obtainListOfUploads(){
			opts.onProgress('Computing list of documents to synchronize');

			currentDb.getDb().listAllDocuments({
				onSuccess: function(docIds_){
					allDocIds = docIds_;
					upgrade();
				}
				,onError: function(err){
					opts.onError('Error during replication to remote server: '+err);
				}
			});
		};
		
		function upgrade(){
			opts.onProgress('Updating design documents from remote server');

			_this.options.server.replicate({
				source: remoteReplicationUrl
				,target: currentConnection.getLocalDbName()
				,filter: 'mobile/onlyMobileApplication'
				,onSuccess: getRemoteDownloadList
				,onError: function(err){
					opts.onError('Error during replication from remote server: '+err);
				}
			});
		};
		
		function getRemoteDownloadList(){
			opts.onProgress('Get remote download document list');

			var remoteMobileDesignDoc = remoteDb.getDesignDoc({ddName:'mobile'});
			remoteMobileDesignDoc.queryView({
				viewName: 'download-list'
				,onSuccess: function(rows){
					downloadDocIds = [];

					for(var i=0,e=rows.length; i<e; ++i){
						downloadDocIds.push(rows[i].key);
					};
					
					download();
				}
				,onError: function(err){ 
					opts.onError('Error getting remote list of documents to download: '+err);
				}
			});
		};
		
		function download(){
			opts.onProgress('Downloading from remote server');

			// Create a list of all documents to download
			var docIds = [];
			for(var i=0,e=allDocIds.length; i<e; ++i){
				docIds.push(allDocIds[i]);
			};
			for(var i=0,e=downloadDocIds.length; i<e; ++i){
				docIds.push(downloadDocIds[i]);
			};
			
			_this.options.server.replicate({
				source: remoteReplicationUrl
				,target: currentConnection.getLocalDbName()
				,docIds: docIds
				,onSuccess: upload
				,onError: function(err){
					opts.onError('Error during replication from remote server: '+err);
				}
			});
		};
		
		function upload(){
			opts.onProgress('Uploading to remote server');

			_this.options.server.replicate({
				source: currentConnection.getLocalDbName()
				,target: remoteReplicationUrl
				,filter: 'mobile/notDeleted'
				,onSuccess: getPurgedDocuments
				,onError: function(err){
					opts.onError('Error during replication to remote server: '+err);
				}
			});
		};
		
		function getPurgedDocuments(){
			opts.onProgress('Retrieve list of purged documents');

			currentConnection.getPurgedDocuments({
				onSuccess: function(purgeDocIds_){
					purgeDocIds = purgeDocIds_;
					getRemoteDocumentsToPurge();
				}
				,onError: function(err){
					opts.onError('Error getting purged documents: '+err);
				}
			});
		};

		function getRemoteDocumentsToPurge(){
			opts.onProgress('Verify with remote server for document deletions');

			var remoteMobileDesign = remoteDb.getDesignDoc({
				ddName: 'mobile'
			});
			
			remoteMobileDesign.queryView({
				viewName: 'revisions'
				,keys: purgeDocIds
				,onSuccess: function(rows){
					remoteDocIdsToDelete = [];
					var remoteIds = {};
					for(var i=0,e=rows.length; i<e; ++i){
						remoteDocIdsToDelete.push({
							_id: rows[i].id
							,_rev: rows[i].value
						});
						remoteIds[rows[i].id] = true;
					};
					
					// Figure out purged documents not on remote server
					purgedDocIdsNotOnRemote = [];
					for(var i=0,e=purgeDocIds.length; i<e; ++i){
						var purgedDocId = purgeDocIds[i];
						if( ! remoteIds[purgedDocId] ) {
							purgedDocIdsNotOnRemote.push(purgedDocId);
						};
					};
					
					cleanPurgedDocumentList();
				}
				,onError: function(err){ 
					opts.onError('Error getting remote list of documents to delete: '+err);
				}
			});
		};
		
		function cleanPurgedDocumentList(){
			if( purgedDocIdsNotOnRemote.length > 0 ) {
				opts.onProgress('Clean up purged document list');

				currentConnection.removePurgedDocuments({
					docIds: purgedDocIdsNotOnRemote
					,onSuccess: purgeRemoteDocuments
					,onError: function(err){ 
						opts.onError('Error saving list of purged documents: '+err);
					}
				});
			} else {
				purgeRemoteDocuments();
			};
		};
		
		function purgeRemoteDocuments(){
			if( remoteDocIdsToDelete.length < 1 ) {
				forceViewCheckpoint();
			} else {
				opts.onProgress('Delete document on remote server');

				var doc = remoteDocIdsToDelete.pop();
				remoteDb.deleteDocument({
					data: doc
					,onSuccess: function(){
						removePurgedDocumentFromList(doc);
					}
					,onError: function(err){ 
						opts.onError('Error deleting remote document: '+err);
					}
				});
			};
		};
		
		function removePurgedDocumentFromList(doc){
			currentConnection.removePurgedDocuments({
				docIds: [ doc._id ]
				,onSuccess: purgeRemoteDocuments
				,onError: function(err){ 
					opts.onError('Error saving list of purged documents: '+err);
				}
			});
		};
		
		function forceViewCheckpoint(){
			opts.onProgress('Force view checkpoint');
			currentDb.getDesignDoc().queryView({
				viewName:'text-search'
				,limit: 25
				,onSuccess: done
				,onError: function(err){ 
					//opts.onError('Error while performing view checkpoint: '+err);
					done(); // just ignore if it times out
				}
			});
		};

		function done(){
			opts.onProgress('Completed');
			opts.onSuccess();
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,addDatabase: function(opts_) {
		var opts = $n2.extend({
			serverUrl: null
			,remoteDbName: null
			,remoteUserName: null
			,remoteUserPassword: null
			,onSuccess: function(dbConfig){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		// Erase cached current database
		this.currentDatabase = null;
		
		var _this = this;
		
		var connDoc = {
			nunaliit_type: 'connection'
			,label: '???'
			,localDb: null
			,remoteDb: {
				protocol: 'http'
				,server: null
				,db: opts.remoteDbName
				,user: opts.remoteUserName
				,password: opts.remoteUserPassword
			}
		};
		
		// Figure out server and protocol
		var server = opts.serverUrl.toLowerCase(); 
		if( server.substr(0, HTTP.length) === HTTP ) {
			server = server.substr(HTTP.length);
		} else if( server.substr(0, HTTPS.length) === HTTPS ) {
			server = server.substr(HTTPS.length);
			connDoc.remoteDb.protocol = 'https';
		};
		if( server[server.length-1] === '/' ) {
			server = server.substr(0,server.length-1);
		};
		connDoc.remoteDb.server = server;
		
		// Create connection object
		var connection = new Connection(
				connDoc
				,this.options
				);
		
		// Check remote server
		connection.verifyRemoteCommunications({
			authenticate: true
			,verifyDbName: true
			,verifyDesignDoc: true
			,onSuccess: computeLabel
			,onError: opts.onError
			,onProgress: opts.onProgress
		});
		
		function computeLabel(){
			connection.computeLabel({
				onSuccess: createLocalDb
				,onError: opts.onError
				,onProgress: opts.onProgress
			});
		};
		
		function createLocalDb() {
			connection.createLocalDb({
				onSuccess: saveConnection
				,onError: opts.onError
				,onProgress: opts.onProgress
			});
		};
		
		function saveConnection(){
			connection.save({
				onSuccess: replicate
				,onError: function(){
					// Remove local database
					connection.deleteLocalDb({
						onSuccess: opts.onError
						,onError: opts.onError
						,onProgress: opts.onProgress
					});
				}
				,onProgress: opts.onProgress
			});
		};
		
		function replicate(){
			opts.onProgress('Replicating');

			var db = _this.options.server.getDb({dbName:connection.getLocalDbName()});
			new CurrentDatabase({
				connection: connection
				,db: db
				,onSuccess: function(currentDb){
					_this.syncConnection({
						currentDb: currentDb
						,onSuccess: setCurrent
						,onError: function(err){
							opts.onError('Error synchronizing database: '+err);
						}
						,onProgress: opts.onProgress
					});
				}
				,onError: function(err){
					opts.onError('Error creating instance of CurrentDatabase: '+err);
				}
			});
		};
		
		function setCurrent(){
			opts.onProgress('Set new connection as current one');

			_this.setCurrentDb({
				connection: connection
				,onSuccess: done
				,onError: function(err){
					opts.onError('Error while saving current connection: '+err);
				}
			});
		};
		
		function done() {
			opts.onProgress('Completed');
			opts.onSuccess(connection);
		};
	}
});	

//=============================================================
var Logger = $n2.Class({

	options: null
	
	,rawLoggingFn: null

	,logStatements: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			limit: 25
		},opts_);
		
		var _this = this;
		
		this.logStatements = [];

		// Install has replacement for $n2.log
		this.rawLoggingFn = $n2.log;
		$n2.log = function(){
			_this.log.apply(_this,arguments);
		};
	}

	,log: function(){
		// Call underlying function
		if( typeof(this.rawLoggingFn) === 'function' ) {
			this.rawLoggingFn.apply(null,arguments);
		};
		
		// Create a string and store it
		var logStr = arguments[0];
		this.logStatements.push(logStr);
		
		this.trimStatements();
	}
	
	,trimStatements: function(){
		var limit = this.options.limit;
		
		if( typeof(limit) !== 'number' ) {
			limit = 0;
		} else if( limit < 0 ) {
			limit = 0;
		};
		
		var statements = this.logStatements;
		while( statements.length > limit ){
			statements.shift();
		};
	}
	
	,getLogStatements: function(){
		return this.logStatements;
	}
});

//=============================================================
// The aim of this class is to wait for the CouchDb server to be
// available and notify a client when it is. If the location of the
// CouchDb server changes, the client should be notified again.
var BootStrapper = $n2.Class({
	
	options: null
	
	,couchServer: null
	
	,session: null
	
	,configDb: null
	
	,configDesignDoc: null
	
	,configuration: null
	
	,listeners: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			adminUser: 'admin'
			,adminPassword: 'admin'
			,configDbName: 'nunaliit_mobile_conf'
			,configDesignName: 'mobileconf'
			,listener: null
			,getCouchLocationFn: function(){
				return window.couchLocation;
			}
		},opts_);
		
		this.listeners = [];
		
		if( this.options.listener ) {
			this.listeners.push(this.options.listener);
		};
		
		// Configure jquery mobile
		$.mobile.changePage.defaults.allowSamePageTransition = true;
		
		this.reachCouchServer();
	}

	,addListener: function(listenerFn){
		if( typeof(listenerFn) === 'function' ) {
			this.listeners.push(listenerFn);
		};
	}
	
	,getCouchLocation: function(){
		return this.options.getCouchLocationFn();
	}

	,reachCouchServer: function(){
		
		var _this = this;
		
		$n2.mobile.ShowWaitScreen('Initializing CouchDb library');
		
		var couchLocation = this.getCouchLocation();
		$n2.log('couchLocation = '+couchLocation);
		
	 	$n2.couch.initialize({
	    	pathToServer: couchLocation
	    	,onSuccess: function(){
	    		_this.couchServer = $n2.couch.DefaultServer;
				$n2.log('CouchDb version = '+_this.couchServer.getVersion());
	    		_this.session = _this.couchServer.getSession();
	    		_this.authenticateToLocalServer();
	    		_this.senseCouchLocationChange();
	    	}
	 		,onError: function(err){
	 			$n2.log('Unable to initialize server: '+err);

	 			// Wait a while and test again
				window.setTimeout(function(){
						_this.senseCouchLocationChange();
					}, 5000); // 5 seconds
	 		}
	 	});
	}
	
	,senseCouchLocationChange: function(){
		var _this = this;

		var couchLocation = this.getCouchLocation();
		
		var lastCouchLocation = _this.couchServer.options.pathToServer;
		if( lastCouchLocation !== couchLocation ) {
			// Must restart boot loading configuration
			this.reachCouchServer();
		} else {
			// Wait a while and test again
			window.setTimeout(function(){
					_this.senseCouchLocationChange();
				}, 5000); // 5 seconds
		};
	}
	
	,authenticateToLocalServer: function() {
		var _this = this;

		$n2.mobile.SetWaitMessage('Authenticating to local CouchDb server');
		
		this.session.login({
			name: this.options.adminUser
			,password: this.options.adminPassword
			,onSuccess: function(){
				_this.setUpConfigDb();
			}
			,onError: function(){
				alert('Unable to authenticate to local database server');
			}
		});
	}
	
	,setUpConfigDb: function() {
		var _this = this;

		$n2.mobile.SetWaitMessage('Retrieving configuration');
		
		this.configDb = this.couchServer.getDb({
			dbName: this.options.configDbName
		});
		this.configDesignDoc = this.configDb.getDesignDoc({
			ddName: this.options.configDesignName
		});
		this.configuration = new Configuration({
			server: this.couchServer
			,db: this.configDb
			,designDoc: this.configDesignDoc
		});
		
		// Verify if database exists
		$.ajax({
	    	url: this.configDb.dbUrl
	    	,type: 'GET'
	    	,async: true
	    	,cache: false
	    	,dataType: 'json'
	    	,success: function() {
	    		// It exists, continue
	    		_this.createConfigDesign();
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
	    		// Assume it does not exist. Create
	    		_this.createConfigDb();
	    	}
		});
	}

	,createConfigDb: function() {
		var _this = this;
		
		$n2.mobile.SetWaitMessage('Creating configuration');

		this.couchServer.createDb({
			dbName: this.options.configDbName
			,onSuccess: function(){
				_this.createConfigDesign();
			}
			,onError: function(){
				alert('Unable to create configuration database');
			}
		});
	}

	,createConfigDesign: function() {
		var _this = this;
		
		$n2.mobile.SetWaitMessage('Adjusting configuration');

		var designDoc = {
			_id: '_design/' + this.options.configDesignName
			,language: 'javascript'
			,n2Version: 1
			,views: {
				identity: {
					map: "function(doc){emit(doc._id,null);}"
				}
				,connections: {
					map: "function(doc){if(doc.nunaliit_type==='connection'){emit(doc._id,doc);};}"
				}
			}
		};
		
		this.configDb.getDocument({
			docId: designDoc._id
			,onSuccess: function(dbDoc){
				if( designDoc.n2Version === dbDoc.n2Version ) {
					_this.initializeConfigDb();
				} else {
					designDoc._rev = dbDoc._rev;
					_this.configDb.updateDocument({
						data: designDoc
						,onSuccess: function(){
							_this.initializeConfigDb();
						}
						,onError: function(){
							alert('Unable to update configuration design document');
						}
					});
				};
			}
			,onError: function(errorMsg){
				_this.configDb.createDocument({
					data: designDoc
					,onSuccess: function(){
						_this.initializeConfigDb();
					}
					,onError: function(){
						alert('Unable to create configuration design document');
					}
				});
			}
		});
	}

	,initializeConfigDb: function() {
		var _this = this;

		$n2.mobile.SetWaitMessage('Checking initial data');

		var docs = [
			{
				_id: 'currentDb'
				,nunaliit_type: 'currentDb'
				,connectionId: null
			}
		];
		
		nextDoc();
		
		function nextDoc(){
			if( docs.length < 1 ) {
				_this.callMain();
				return;
			};
			var doc = docs.pop();
			var docId = doc._id;
			
			_this.configDb.getDocument({
				docId: docId
				,onSuccess: nextDoc // already loaded
				,onError: function(errorMsg){ 
					_this.configDb.createDocument({
						data: doc
						,onSuccess: nextDoc
						,onError: function(){
							alert('Unable to upload default documents');
						}
					}); 
				}
			});
		};
	}
	
	,callMain: function(){
		$n2.mobile.SetWaitMessage('Initializing application');

		for(var i=0,e=this.listeners.length; i<e; ++i){
			var listener = this.listeners[i];
			try {
				listener(this.configuration);
			} catch(e) {
				// ignore error
			};
		};

		$n2.mobile.HideWaitScreen();
	}
});

$n2.mobile = {
	Configuration: Configuration
	,BootStrapper: BootStrapper
	,logger: new Logger()
};

})(jQuery,nunaliit2);