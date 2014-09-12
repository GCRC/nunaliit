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

;(function($n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-mobile',args); };

var HTTP = 'http://';
var HTTPS = 'https://';
var PROT_SEPARATOR = '://';


//===============================================
var Connection = $n2.Class({

	doc: null,

	configDb: null,
	
	initialize: function(doc, configDb){
		this.doc = doc;
		this.configDb = configDb;
		
		//alert( JSON.stringify(this.doc) );
	},
	
	getConnectionId: function(){
		return this.doc._id;
	},
	
	getLabel: function(){
		return this.doc.label;
	},
	
	getLocalDbName: function(){
		return this.doc.local.dbName;
	},
	
	getRemoteDbName: function(){
		return this.doc.remote.dbName;
	},
	
	getRemoteProtocol: function(){
		return this.doc.remote.protocol;
	},
	
	getRemoteServer: function(){
		return this.doc.remote.server;
	},
	
	getRemoteUser: function(){
		return this.doc.remote.user;
	},
	
	getRemotePassword: function(){
		return this.doc.remote.password;
	},

	getRemoteServerUrl: function(){
		var url = this.getRemoteServer();
		var user = this.getRemoteUser();
		var pw = this.getRemotePassword();
		
		var index = url.indexOf(PROT_SEPARATOR);
		
		//alert('url='+url+' user='+user+' pw'+pw+' index='+index);
		
		if( index >= 0 && user && pw ){
			var prot = url.substr(0,index+PROT_SEPARATOR.length);
			var suffix = url.substr(index+PROT_SEPARATOR.length);
			url = prot + user + ':' + pw + '@' + suffix;
		};

		return url;
	},

	getRemoteReplicationUrl: function(){
		return this.getRemoteServerUrl() + '_replicate';
	},
	
	save: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		if( this.doc._id 
		 && this.doc._rev ){
			this._getDb().updateDocument({
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
			this._getDb().createDocument({
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
	},
	
	deleteConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		this.configDb.removeConnection({
			connection: this
			,onSuccess: opts.onSuccess
			,onError: opts.onError
			,onProgress: opts.onProgress
		});
	},
	
	createLocalDb: function(opts_){
		var opts = $n2.extend({
			dbName: null
			,onSuccess: function(db){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		var couchServer = this._getCouchServer();
		
		// Set up variables for local name search
		var baseName = opts.dbName;
		var count = 0;
		var limit = 30;
		var currentName = baseName;
		
		findAvailableDbName();
		
		function findAvailableDbName(){
			var testDb = couchServer.getDb({dbName:currentName});
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
			$n2.log('Creating local database: '+currentName);

			couchServer.createDb({
				dbName: currentName
				,onSuccess: function(db){
					_this.doc.local.dbName = currentName;
					opts.onSuccess(db, currentName);
				}
				,onError: function(err){
					opts.onError('Unable to create local database: '+err)
				}
			});
		};
	},
	
	getLocalDb: function(){
		var db = this._getCouchServer.getDb({dbName:this.doc.local.dbName});
		return db;
	},
	
	deleteLocalDb: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		
		var localDbName = this.getLocalDbName();
		if( !localDbName ) {
			// Nothing to do
			opts.onSuccess();
		} else {
			var couchServer = this._getCouchServer();
			couchServer.deleteDb({
				dbName: localDbName
				,onSuccess: function(){
					_this.doc.local.dbName = null;
					opts.onSuccess();
				}
				,onError: opts.onError
			});
		};
	},
	
	verifyRemoteCommunications: function(opts_){
		var opts = $n2.extend({
			authenticate: false
			,verifyDbName: false
			,verifyDesignDoc: false
			,onSuccess: function(remoteServer,remoteDb){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var remoteServerUrl = this.getRemoteServerUrl();
		var remoteUser = this.getRemoteUser();
		var remotePassword = this.getRemotePassword();
		var remoteDbName = this.getRemoteDbName();
		var remoteDb = null;
		
		
		opts.onProgress('verifyRemoteCommunications: remoteServerUrl='+remoteServerUrl);
		var remoteServer = $n2.couch.getServer({
			pathToServer: remoteServerUrl + '/'
			,skipSessionInitialization: true
			,onSuccess: function(){
				var version = remoteServer.getVersion();
				opts.onProgress('Remote Server contacted. Version: '+version);
				remoteAuthenticate();
			}
			,onError: function(err){
				remoteServerError('Can not reach remote server: '+err);
			}
		});
		
		function remoteAuthenticate() {
			if( !opts.authenticate ) {
				// Skip authentication
				checkRemoteDatabaseName();
				
			} else if( remoteUser && remotePassword ){
				opts.onProgress('Authenticating with remote server...');
				remoteServer.getSession().login({
					name: remoteUser
					,password: remotePassword
					,onSuccess: checkRemoteDatabaseName
					,onError: remoteServerError
				});
				
			} else {
				// Credentials not provided
				checkRemoteDatabaseName();
			};
		};
		
		function checkRemoteDatabaseName() {
			remoteDb = remoteServer.getDb({dbName:remoteDbName});

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
	},
	
	syncConnection: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);
		
		var _this = this;
		
		var currentDb = this._getDb();
		var couchServer = this._getCouchServer();
		
		var remoteServer = null;
		var remoteDb = null;
		var allDocIds = null;
		var downloadDocIds = null;
		var purgeDocIds = null;
		var remoteDocIdsToDelete = null;
		var purgedDocIdsNotOnRemote = null;
		
		var remoteReplicationUrl = this.getRemoteReplicationUrl();

		opts.onProgress('Trying to reach remote server');

		this.verifyRemoteCommunications({
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

			currentDb.listAllDocuments({
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
			opts.onProgress('remoteReplicationUrl='+remoteReplicationUrl);
			opts.onProgress('_this.getLocalDbName()='+_this.getLocalDbName());

			couchServer.replicate({
				source: remoteReplicationUrl
				,target: _this.getLocalDbName()
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
			
			couchServer.replicate({
				source: remoteReplicationUrl
				,target: _this.getLocalDbName()
				,docIds: docIds
				,onSuccess: upload
				,onError: function(err){
					opts.onError('Error during replication from remote server: '+err);
				}
			});
		};
		
		function upload(){
			opts.onProgress('Uploading to remote server');

			couchServer.replicate({
				source: _this.getLocalDbName()
				,target: remoteReplicationUrl
				,filter: 'mobile/notDeleted'
				,onSuccess: forceViewCheckpoint
				,onError: function(err){
					opts.onError('Error during replication to remote server: '+err);
				}
			});
		};

		function forceViewCheckpoint(){
			opts.onProgress('Force view checkpoint');
			_this._getDesignDoc().queryView({
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
	},
	
	_getCouchServer: function(){
		return this.configDb.couchServer;
	},
	
	_getDb: function(){
		return this.configDb.db;
	},
	
	_getDesignDoc: function(){
		var db = this._getDb();
		var dd = db.getDesignDoc({ddName:'nunaliit'});
		return dd;
	}
	
});

//===============================================
var ConfigDb = $n2.Class({
	
	couchServer: null,
	
	dbName: null,
	
	db: null,
	
	designDoc: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			couchServer: null
			,dbName: 'nunaliit_mobile_config'
		},opts_);
		
		this.couchServer = opts.couchServer;
		this.dbName = opts.dbName;

		this.db = this.couchServer.getDb({
			dbName: opts.dbName
		});
		
		this.designDoc = this.db.getDesignDoc({ ddName:'nunaliit' });
	},
	
	createDb: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		// Check if it exists
		this.couchServer.listDatabases({
			onSuccess: function(dbNames){
				if( dbNames.indexOf(_this.dbName) >= 0 ){
					// Already exist
					$n2.log('nunaliit2 configDb already exists');
					loadDesignDoc();
				} else {
					// Must create
					performCreateDb();
				};
			}
			,onError: opts.onError
		});
		
		function performCreateDb(){
			$n2.log('creating nunaliit2 configDb');
			_this.couchServer.createDb({
				dbName: _this.dbName
				,onSuccess: loadDesignDoc
				,onError: opts.onError
			});
		};
		
		function loadDesignDoc() {
			var designDoc = {
				_id: '_design/nunaliit'
				,language: 'javascript'
				,n2Version: 1
				,views: {
					identity: {
						map: "function(doc){emit(doc._id,null);}"
					}
					,connections: {
						map: "function(doc){if(doc.nunaliit_type==='connection'){emit(doc._id,null);};}"
					}
				}
			};
			
			_this.db.getDocument({
				docId: designDoc._id
				,onSuccess: function(dbDoc){
					if( designDoc.n2Version === dbDoc.n2Version ) {
						initDocs();
					} else {
						$n2.log('updating configDb design document');
						designDoc._rev = dbDoc._rev;
						_this.db.updateDocument({
							data: designDoc
							,onSuccess: initDocs
							,onError: function(err){
								opts.onError('Unable to update configuration design document: '+err);
							}
						});
					};
				}
				,onError: function(errorMsg){
					$n2.log('creating configDb design document');
					_this.db.createDocument({
						data: designDoc
						,onSuccess: initDocs
						,onError: function(err){
							opts.onError('Unable to create configuration design document: '+err);
						}
					});
				}
			});
		}
		
		function initDocs() {
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
					done();
					return;
				};
				var doc = docs.pop();
				var docId = doc._id;
				
				_this.db.getDocument({
					docId: docId
					,onSuccess: nextDoc // already loaded
					,onError: function(errorMsg){ 
						$n2.log('creating configDb document: ' + docId);
						_this.db.createDocument({
							data: doc
							,onSuccess: nextDoc
							,onError: function(err){
								opts.onError('Unable to upload default documents to configDb: '+err);
							}
						}); 
					}
				});
			};
		};
		
		function done(){
			opts.onSuccess();
		};
	},
	
	getConnections: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(connections){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		this.designDoc.queryView({
			viewName:'connections'
			,include_docs: true
			,onSuccess: function(rows){
				var conns = [];
				for(var i=0,e=rows.length; i<e; ++i){
					var connDoc = rows[i].doc;
					console.log('connDoc : '+connDoc);
					var conn = new Connection(connDoc, _this);
					conns.push( conn );
				};
				opts.onSuccess(conns);
			}
			,onError: opts.onError
		});
	},
	
	getConnection: function(opts_){
		var opts = $n2.extend({
			id: null
			,onSuccess: function(connection){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		this.db.getDocument({
			docId: opts.id
			,onSuccess: function(doc){
				var conn = new Connection(doc, _this);
				opts.onSuccess(conn);
			}
			,onError: function(err){ 
				opts.onError('Can not find connection document: '+err); 
			}
		});
	},
	
	addConnection: function(opts_){
		var opts = $n2.extend({
			remoteAtlasUrl: null
			,remoteUser: null
			,remotePassword: null
			,onSuccess: function(connection){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		// Erase cached current database
//		this.currentDatabase = null;
		
		var _this = this;
		
		var connDoc = {
			nunaliit_type: 'connection'
			,label: '???'
			,local: {
				dbName: null
			}
			,remote: {
				protocol: 'http'
				,server: null
				,dbName: null
				,atlasServer: null
				,user: opts.remoteUser
				,password: opts.remotePassword
			}
		};
		
		var remoteAtlasUrl = opts.remoteAtlasUrl;
		var remoteAtlasUrl = opts.remoteAtlasUrl.toLowerCase(); 
		if( remoteAtlasUrl.substr(0, HTTP.length) === HTTP ) {
			remoteAtlasUrl = remoteAtlasUrl.substr(HTTP.length);
		} else if( remoteAtlasUrl.substr(0, HTTPS.length) === HTTPS ) {
			remoteAtlasUrl = remoteAtlasUrl.substr(HTTPS.length);
			connDoc.remote.protocol = 'https';
		};
		if( remoteAtlasUrl[remoteAtlasUrl.length-1] === '/' ) {
			remoteAtlasUrl = remoteAtlasUrl.substr(0,server.length-1);
		};
		connDoc.remote.atlasServer = remoteAtlasUrl;
		
		var effectiveRemoteAtlasUrl = connDoc.remote.protocol + '://' + remoteAtlasUrl + '/';
		this.findRemoteServerParameters({
			serverUrl: effectiveRemoteAtlasUrl
			,onSuccess:  parametersLoaded
			,onError: function(err){
				opts.onError('Unable to find remote parameters: '+err);
			}
			,onProgress: opts.onProgress
		});
		
		var connection = null;
		function parametersLoaded(serverUrl, dbName) {
			opts.onProgress('Parameters: '+serverUrl+' '+dbName);
			connDoc.remote.server = serverUrl;
			connDoc.remote.dbName = dbName;
		
			// Compute label
			_this.computeNewConnectionLabel({
				remoteDbName: connDoc.remote.dbName
				,remoteServerName: connDoc.remote.atlasServer
				,onSuccess: function(label){
					connDoc.label = label;
					opts.onProgress(label);
					connection = new Connection(connDoc, _this);
					checkCommunications();
				}
				,onError: opts.onError
			});
		};
		
		// Check remote server
		function checkCommunications(){
			opts.onProgress('checkCommunications');
			connection.verifyRemoteCommunications({
				authenticate: true
				,verifyDbName: true
				,verifyDesignDoc: true
				,onSuccess: createLocalDb
				,onError: opts.onError
				,onProgress: opts.onProgress
			});
		};
		
		function createLocalDb() {
			opts.onProgress('createLocalDb');
			connection.createLocalDb({
				dbName: connDoc.remote.dbName
				,onSuccess: saveConnection
				,onError: opts.onError
			});
		};
		
		function saveConnection(){
			opts.onProgress('saveConnection');
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
			});
		};
		
		function replicate(){
			opts.onProgress('replicate');
			connection.syncConnection({
				onSuccess: setCurrent
				,onError: function(err){
					opts.onError('Error synchronizing database: '+err);
				}
				,onProgress: opts.onProgress
			});
		};
		
		function setCurrent(){
			opts.onProgress('Set new connection as current one');

			_this.setCurrentConnection({
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
	},
	
	removeConnection: function(opts_){
		var opts = $n2.extend({
			connection: null
			,onSuccess: function(){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		var _this = this;
		
		var connId = opts.connection.getConnectionId();
		
		this.db.getDocument({
			docId: connId
			,onSuccess: connDocLoaded
			,onError: function(err){ 
				opts.onError('Unable to find connection document: '+connId); 
			}
		});
		
		function connDocLoaded(connDoc){
			var dbName = connDoc.local.dbName;

			_this.couchServer.deleteDb({
				dbName: dbName
				,onSuccess: function(){
					dbDeleted(connDoc);
				}
				,onError: function(err){ 
					opts.onError('Unable to delete local database'); 
				}
			});
		};
		
		function dbDeleted(connDoc){
			var dbName = connDoc.local.dbName;

			_this.db.deleteDocument({
				data: connDoc
				,onSuccess: opts.onSuccess
				,onError: function(err){ 
					opts.onError('Unable to delete connection document'); 
				}
			});
		};
	},
	
	findRemoteServerParameters: function(opts_){
		var opts = $n2.extend({
			serverUrl: null
			,onSuccess: function(serverUrl, dbName){}
			,onError: function(err){}
			,onProgress: function(str){}
		},opts_);

		var dbName = null;
		var remoteServerUrl = null;
		
		// Find db name
		opts.onProgress('Find remote database');
		var dbUrl = opts.serverUrl + 'db';
		opts.onProgress('dbUrl: '+dbUrl);
		$.ajax({
	    	url: dbUrl
	    	,type: 'get'
	    	,async: true
	    	,dataType: 'json'
		}).done(function(data){
			dbName = data.db_name;
			if( dbName ){
				findRemoteServer();
			} else {
				opts.onError('Can not find name of remote database');
			};
		}).fail(function(jqXHR, textStatus, errorThrown){
			opts.onError('Can not reach remote database');
		});
		
		function findRemoteServer(){
			opts.onProgress('Find remote server');
			remoteServerUrl = opts.serverUrl + 'server/';
			$.ajax({
		    	url: remoteServerUrl
		    	,type: 'get'
		    	,async: true
		    	,dataType: 'json'
			}).done(function(data){
				if( data.couchdb ){
					opts.onSuccess(remoteServerUrl, dbName);
				} else {
					opts.onError('Can not find remote server');
				};
			}).fail(function(jqXHR, textStatus, errorThrown){
				opts.onError('Can not reach remote server');
			});
		};
	},
	
	computeNewConnectionLabel: function(opts_){
		var opts = $n2.extend({
			remoteDbName: null
			,remoteServerName: null
			,onSuccess: function(label){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		// Get all connection documents, compiling
		// labels
		var labels = {};
		this.getConnections({
			onSuccess: function(connections){
				for(var i=0,e=connections.length; i<e; ++i){
					var connection = connections[i];
					var label = connection.getLabel();
					labels[label] = true;
				};
				pickLabel();
			}
			,onError: opts.onError
		});
		
		function pickLabel(){
			var baseLabel = opts.remoteDbName  + ' (' + opts.remoteServerName + ')';
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
			
			opts.onSuccess(currentLabel);
		};
	},
	
	setCurrentConnection: function(opts_){
		var opts = $n2.extend({
			connection: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var connectionId = null;
		if( opts.connection ) {
			connectionId = opts.connection.getConnectionId();
		};
		
		var db = this.db;
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
		};
	}
});

//======================= EXPORT ========================
$n2.mobileConfigDb = {
	ConfigDb: ConfigDb
};

})(nunaliit2);