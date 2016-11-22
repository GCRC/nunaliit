/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

// This should be set to true if the server is being accessed being a bad proxy
var badProxy = false;

function httpJsonError(XMLHttpRequest, defaultStr) {
	// Need JSON
	if( !JSON || typeof(JSON.parse) !== 'function' ) {
		return $n2.error.fromString(defaultStr);
	};
	
	// Need a response text
	var text = XMLHttpRequest.responseText;
	if( !text ) return $n2.error.fromString(defaultStr);
	
	// Parse
	var error = JSON.parse(text);
	if( !error ) return $n2.error.fromString(defaultStr);
	
	var err = undefined;
	if( typeof error.reason === 'string' ) {
		err = $n2.error.fromString(error.reason);
	} else {
		err = $n2.error.fromString(defaultStr);
	};
	
	if( error.error ){
		var condition = 'couchDb_' + error.error;
		err.setCondition(condition);
	};
	
	return err;
};

// Fix name: no spaces, all lowercase
function fixUserName(userName) {
	return userName.toLowerCase().replace(' ','');
};

/*
 * This should be set if the client is run behind a bad proxy
 */
function isBadProxy(){
	return badProxy;
};
function setBadProxy(flag){
	if( flag ){
		badProxy = true;
	} else {
		badProxy = false;
	};
};

// =============================================
// Session
// =============================================

/*
 * Accepts two CouchDb session context objects and compares
 * them. If they are equivalent, returns true. Otherwise, false.
 */
function compareSessionContexts(s1, s2){
	// This takes care of same object and both objects null
	if( s1 === s2 ) {
		return true;
	};
	
	// Check that one of them is null or undefined
	if( !s1 ){
		return false;
	};
	if( !s2 ){
		return false;
	};
	
	if( s1.name !== s2.name ){
		return false;
	};

	// Compare roles
	var s1Roles = {};
	if( s1.roles ){
		for(var i=0,e=s1.roles.length; i<e; ++i){
			var role = s1.roles[i];
			s1Roles[role] = true;
		};
	};
	var s2Roles = {};
	if( s2.roles ){
		for(var i=0,e=s2.roles.length; i<e; ++i){
			var role = s2.roles[i];
			s2Roles[role] = true;
		};
	};
	for(var role in s1Roles){
		if( !s2Roles[role] ){
			return false;
		};
	};
	for(var role in s2Roles){
		if( !s1Roles[role] ){
			return false;
		};
	};
	
	return true;
};

var Session = $n2.Class({
	
	server: null
	
	,pathToSession: null
	
	,changedContextListeners: null
	
	,lastSessionContext: null
	
	,initialize: function(server_, sessionInfo_){
	
		this.server = server_;
		
		this.changedContextListeners = [];
		this.lastSessionContext = null;
		
		if( sessionInfo_ ){
    		if( sessionInfo_.ok ) {
    			var context = sessionInfo_.userCtx;
    			this.changeContext(context);
    		};
		};
	}

	,getUrl: function() {
		return this.server.getSessionUrl();
	}
	
	,getContext: function() {
		return this.lastSessionContext;
	}

	,addChangedContextListener: function(listener){
		if( typeof(listener) === 'function' ) {
			this.changedContextListeners.push(listener);
			
			if( this.lastSessionContext ) {
				listener(this.lastSessionContext);
			};
		};
	}
	
	,changeContext: function(context) {
		this.lastSessionContext = context;
		if( this.lastSessionContext ) {
			for(var i=0,e=this.changedContextListeners.length; i<e; ++i) {
				var listener = this.changedContextListeners[i];
				try {
					listener(this.lastSessionContext);
				} catch(e) {};
			};
		};
	}
	
	,refreshContext: function(opts_) {
		var opts = $.extend({
				onSuccess: function(context) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);
		
		var _this = this;
		var sessionUrl = this.getUrl();
		
		var data = {};
		
		if( badProxy ){
			data.r = Date.now();
		};
		
		$.ajax({
			url: sessionUrl
			,type: 'get'
			,async: true
			,dataType: 'json'
			,data: data
			,success: function(res) {
				if( res.ok ) {
					var context = res.userCtx;
					_this.changeContext(context);
					opts.onSuccess(context);
				} else {
					opts.onError('Malformed context reported');
				};
			}
			,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error obtaining context: '+errStr);
			}
		});
	}
	
	,login: function(opts_) {
		var opts = $.extend({
				name: null
				,password: null
				,onSuccess: function(context) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);

		var _this = this;
		var sessionUrl = this.getUrl();

		if( badProxy ){
			sessionUrl += '?r='+Date.now();
		};
		
		// Login does not happen often. Always assume bad proxy.
		//if( badProxy ){
			sessionUrl += '?r='+Date.now();
		//};
		
		// Fix name: no spaces, all lowercase
		if( opts.name ) {
			var name = fixUserName(opts.name);
		} else {
			opts.onError('A name must be supplied when logging in');
			return;
		};
		
		$.ajax({
	    	url: sessionUrl
    		,type: 'post'
    		,async: true
	    	,data: {
	    		name: name
	    		,password: opts.password
	    	}
	    	,contentType: 'application/x-www-form-urlencoded'
    		,dataType: 'json'
    		,success: function(info) {
	    		if( info && info.ok ) {
	    			_this.refreshContext({
	    				onSuccess: opts.onSuccess
	    				,onError: opts.onError
	    			});
	    		} else {
    				opts.onError('Unknown error during log in');
	    		};
	    	}
    		,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error during log in: '+errStr);
	    	}
		});
	}
	
	,logout: function(opts_) {
		var opts = $.extend({
				onSuccess: function(context) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);

		var _this = this;
		var sessionUrl = this.getUrl();
		
		$.ajax({
	    	url: sessionUrl
    		,type: 'DELETE'
    		,async: true
    		,dataType: 'json'
    		,success: function(info) {
	    		if( info && info.ok ) {
	    			_this.refreshContext({
	    				onSuccess: opts.onSuccess
	    				,onError: opts.onError
	    			});
	    		} else {
    				opts.onError('Unknown error during log out');
	    		};
	    	}
    		,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error during log out: '+errStr);
	    	}
		});
	}
});

// =============================================
// Design Document
// =============================================

var designDoc = $n2.Class({
	ddUrl: null,
	
	ddName: null,
	
	db: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			ddUrl: null
			,ddName: null
			,db: null
		},opts_);
		
		this.ddUrl = opts.ddUrl;
		this.ddName = opts.ddName;
		this.db = opts.db;
	},
	
	getDatabase: function(){
		return this.db;
	},
	
	getQueryUrl: function(opts_){
		var opts = $.extend(true, {
				viewName: null
				,listName: null
			}
			,opts_
		);
		
		if( opts.listName ) {
			return this.ddUrl + '_list/' + opts.listName + '/' + opts.viewName;
		} else {
			return this.ddUrl + '_view/' + opts.viewName;
		};
	},

	queryView: function(options_) {
		var opts = $.extend(true, {
				viewName: null
				,listName: null
				,viewUrl: null
				,startkey: null
				,endkey: null
				,keys: null
				,group: null
				,include_docs: null
				,limit: null
				,onlyRows: true
				,rawResponse: false
				,reduce: false
				,onSuccess: function(rows){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to query a view');
		};
		
		var viewUrl = opts.viewUrl;
		if( !viewUrl ) {
			if( opts.listName ) {
				viewUrl = this.ddUrl + '_list/' + opts.listName + '/' + opts.viewName;
			} else {
				viewUrl = this.ddUrl + '_view/' + opts.viewName;
			};
		};
		
		var mustBePost = false;
		var queryCount = 0;
		var query = {};
		var data = {};
		for(var k in opts) {
			if( k === 'viewName' 
			 || k === 'listName'
			 || k === 'viewUrl'
			 || k === 'onlyRows'
			 || k === 'rawResponse'
			 || k === 'onSuccess'
			 || k === 'onError'
			 || typeof(opts[k]) === 'undefined'
			 || opts[k] === null
			 ) { 
			 // Nothing to do
			} else if ( k === 'keys' ) {
				mustBePost = true;
				data[k] = opts[k];
			} else {
				++queryCount;
				query[k] = JSON.stringify( opts[k] );
			};
		};
		
		var dataType = 'json';
		if( opts.rawResponse ) {
			dataType = 'text';
		};
		
		if( mustBePost ) {
			var jsonData = JSON.stringify( data );
			
			var effectiveUrl = viewUrl;
			if( queryCount > 0 ){
				var params = $.param(query);
				effectiveUrl = viewUrl + '?' + params;
			};
			
			$.ajax({
		    	url: effectiveUrl
		    	,type: 'POST'
		    	,async: true
		    	,data: jsonData
		    	,contentType: 'application/json'
		    	,dataType: dataType
		    	,success: processResponse
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					var errStr = httpJsonError(XMLHttpRequest, textStatus);
		    		opts.onError('Error during view query '+opts.viewName+': '+errStr);
		    	}
			});
			
		} else {
			if( badProxy ){
				query.r = Date.now();
			};

			$.ajax({
		    	url: viewUrl
		    	,type: 'GET'
		    	,async: true
		    	,cache: false
		    	,data: query
		    	,dataType: dataType
		    	,success: processResponse
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					var errStr = httpJsonError(XMLHttpRequest, textStatus);
		    		opts.onError('Error during view query '+opts.viewName+': '+errStr);
		    	}
			});
		};
		
		function processResponse(queryResponse) {
			if( opts.onlyRows ) {
	    		if( queryResponse.rows ) {
	    			opts.onSuccess(queryResponse.rows);
	    		} else {
		    		opts.onError('Unexpected response during view query '+opts.view);
	    		};
    		} else {
    			// Send the whole response
    			opts.onSuccess(queryResponse);
    		};
		};
	}
});

// =============================================
// Change Notifier
// =============================================

var ChangeNotifier = $n2.Class({

	changeUrl: null,
	
	include_docs: null,
	
	pollInterval: null,
	
	longPoll: null,
	
	timeout: null,
	
	style: null,
	
	db: null,
	
	listeners: null,
	
	lastSequence: null,

	currentRequest: null,
	
	currentWait: null,
	
	onError: function(err) { $n2.log(err); },

	initialized: null,
	
	initializationListeners: null,

	initialize: function(opts_) {
		var opts = $n2.extend({
			db: null
			,changeUrl: null
			,include_docs: false
			,pollInterval: 5000
			,longPoll: false
			,timeout: 20000
			,style: 'all_docs'
			,listeners: null
			,onSuccess: function(notifier){}
		},opts_);

		var _this = this;
		
		this.initialized = false;
		this.initializationListeners = [];
		this.listeners = [];

		this.db = opts.db;
		this.changeUrl = opts.changeUrl;
		this.include_docs = opts.include_docs;
		this.pollInterval = opts.pollInterval;
		this.longPoll = opts.longPoll;
		this.timeout = opts.timeout;
		this.style = opts.style;

		if( $n2.isArray(opts.listeners) ) {
			opts.listeners.forEach(function(listener){
				if( typeof listener === 'function' ){
					_this.listeners.push( listener );
				};
			});
		};

		if( typeof opts.onSuccess === 'function' ){
			this.initializationListeners.push(opts.onSuccess);
		};
		
		if( opts.doNotReset ) {
			finishInitialization();
		} else {
			this.resetLastSequence({
				onSuccess: finishInitialization
				,onError: finishInitialization
			});
		};
		
		function finishInitialization() {
			_this.reschedule();
			_this.requestChanges();
			
			_this.initialized = true;
			_this.initializationListeners.forEach(function(listener){
				listener(_this);
			});
			_this.initializationListeners = null;
		};
	},

	addListener: function(listener) {
		if( typeof(listener) === 'function' ) {
			this.listeners.push(listener);
			
			this.requestChanges();
		};
	},

	addInitializationListener: function(listener) {
		if( typeof listener === 'function' ) {
			if( this.initialized ){
				listener(this);
			} else {
				this.initializationListeners.push(listener);
			};
		};
	},
	
	/*
	 * This function does not report any changes. Instead, it
	 * updates the last sequence number to the current one. This
	 * means that the next request for changes will report only
	 * changes that have happened since 'now'.
	 */
	resetLastSequence: function(opt_) {
		
		var opt = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opt_);

		var _this = this;
		
		this.db.getInfo({
	    	onSuccess: function(dbInfo) {
				_this.lastSequence = dbInfo.update_seq;
				opt.onSuccess();
	    	}
	    	,onError: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opt.onError('Error during a query of current update sequence: '+errStr);
	    	}
		});
	},
	
	getLastSequence: function(){
		return this.lastSequence;
	},
	
	_reportChanges: function(changes) {
		
		if( changes.last_seq ) {
			this.lastSequence = changes.last_seq;
		};
		
		if( changes.results && changes.results.length > 0 ) {
			for(var i=0,e=this.listeners.length; i<e; ++i) {
				this.listeners[i](changes);
			};
		};
	},
	
	/**
		Request the server for changes.
	 */
	requestChanges: function() {
		
		if( !this.listeners 
		 || this.listeners.length < 1 ) {
			// Nothing to do
			return;
		};
		if( this.currentRequest ) {
			// A request already in progress
			return;
		};
		if( this.currentWait ) {
			// Already scheduled
			return;
		};
	
		var req = {
			feed: 'normal'
			,style: this.style
		};
	
		if( typeof(this.lastSequence) === 'number' ) {
			req.since = this.lastSequence;
		};
		
		if( this.include_docs ) {
			req.include_docs = this.include_docs;
		};
		
		if( this.longPoll ) {
			req.feed = 'longpoll';
			req.timeout = this.timeout;
		};
		
		if( badProxy ){
			req.r = Date.now();
		};
		
		this.currentRequest = req;
		
		var _this = this;
		
		$.ajax({
	    	url: this.changeUrl
	    	,type: 'GET'
	    	,async: true
	    	,data: req
	    	,dataType: 'json'
	    	,success: function(changes) {
				_this.currentRequest = null;
				
	    		_this._reportChanges(changes);
	    		
	    		_this.reschedule();
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				_this.onError('Error during a server notifications: '+errStr);
	    		_this.reschedule();
	    	}
		});
	},
	
	/**
		Reschedule the next request for changes
	 */
	reschedule: function() {

		var now = $n2.utils.getCurrentTime();
		var expected = now + this.pollInterval;
		
		if( this.currentWait ) {
			// Already waiting
			if( this.currentWait.expected > expected ) {
				// We need to reschedule, earlier
				if( typeof(clearTimeout) === 'function' ) {
					clearTimeout(this.currentWait.timerId);
				}
				this.currentWait = null;
			} else {
				// There is already a timer sufficiently early to
				// handle the request
				return;
			}; 
		};

		// Start a new timeout	
		this.currentWait = {
			delayInMs: this.pollInterval
			,expected: expected
		};
		
		var _this = this;
		
		this.currentWait.timerId = setTimeout(function(){
				_this.currentWait = null;
				_this.requestChanges();
			}
			,this.currentWait.delayInMs
		);
	}
});

//=============================================
// Database Callbacks
//=============================================

var DatabaseCallbacks = $n2.Class({
	
	onCreatedCallbacks: null
	
	,onUpdatedCallbacks: null
	
	,onDeletedCallbacks: null
	
	,initialize: function(){
		this.onCreatedCallbacks = [];
		this.onUpdatedCallbacks = [];
		this.onDeletedCallbacks = [];
	}

	,addOnCreatedCallback: function(f){
		if( typeof(f) === 'function' ) {
			this.onCreatedCallbacks.push(f);
		}
	}

	,addOnUpdatedCallback: function(f){
		if( typeof(f) === 'function' ) {
			this.onUpdatedCallbacks.push(f);
		}
	}

	,addOnDeletedCallback: function(f){
		if( typeof(f) === 'function' ) {
			this.onDeletedCallbacks.push(f);
		}
	}
	
	,_reportOnCreated: function(docInfo){
		for(var i=0,e=this.onCreatedCallbacks.length; i<e; ++i){
			var f = this.onCreatedCallbacks[i];
			f(docInfo);
		};
	}
	
	,_reportOnUpdated: function(docInfo){
		for(var i=0,e=this.onCreatedCallbacks.length; i<e; ++i){
			var f = this.onUpdatedCallbacks[i];
			f(docInfo);
		};
	}
	
	,_reportOnDeleted: function(docInfo){
		for(var i=0,e=this.onDeletedCallbacks.length; i<e; ++i){
			var f = this.onUpdatedCallbacks[i];
			f(docInfo);
		};
	}
});

// =============================================
// Database
// =============================================

var Database = $n2.Class({
	
	dbUrl: null
	
	,dbName: null
	
	,server: null
	
	,callbacks: null
	
	,changeNotifier: null
	
	,changeNotifierRefreshIntervalInMs: null
	
	,initialize: function(opts_, server_) {
		var opts = $n2.extend({
			dbUrl: null
			,dbName: null
			,changeNotifierRefreshIntervalInMs: 5000
		},opts_);
	
		this.server = server_;
		
		this.dbUrl = opts.dbUrl;
		this.dbName = opts.dbName;
		this.changeNotifierRefreshIntervalInMs = opts.changeNotifierRefreshIntervalInMs;
		
		if( !this.dbUrl ) {
			var pathToServer = server_.getPathToServer();
			this.dbUrl = pathToServer + this.dbName + '/';
		};
		
		this.callbacks = new DatabaseCallbacks();
	}

	,getUrl: function(){
		return this.dbUrl;
	}
	
	,getServer: function(){
		return this.server;
	}
	
	,getDesignDoc: function(opts_) {
		var ddOpts = $.extend({
				ddUrl: null
				,ddName: null
			}
			,opts_
		);
		
		if( typeof ddOpts.ddUrl !== 'string' ) {
			if( typeof ddOpts.ddName !== 'string' ){
				throw new Error('Database.getDesignDoc() must specify ddName as a string if ddUrl is not');
			};
			ddOpts.ddUrl = this.dbUrl + '_design/' + ddOpts.ddName + '/';
		};
		
		ddOpts.db = this;
		
		return new designDoc(ddOpts);
	}
	
	,getChangeNotifier: function(opts_) {
		var opts = $n2.extend({
			onSuccess: function(notifier){}
		},opts_);
		
		if( !this.changeNotifier ){
			this.changeNotifier = new ChangeNotifier({
				db: this
				,changeUrl: this.dbUrl + '_changes'
				,pollInterval: this.changeNotifierRefreshIntervalInMs
				,onSuccess: opts.onSuccess
			});
		} else {
			this.changeNotifier.addInitializationListener(opts.onSuccess);
		};
			
		return this.changeNotifier;
	}
	
	,getChanges: function(opt_) {
		var opt = $n2.extend({
			since: null
			,limit: null
			,descending: false
			,include_docs: false
			,onSuccess: function(changes){}
			,onError: function(msg){ $n2.reportErrorForced(msg); }
		},opt_);
		
		var req = {
			feed: 'normal'
		};
	
		if( opt.since ) {
			req.since = opt.since;
		};
		
		if( opt.limit ) {
			req.limit = opt.limit;
		};
		
		if( opt.descending ) {
			req.descending = opt.descending;
		};
		
		if( opt.include_docs ) {
			req.include_docs = opt.include_docs;
		};
		
		if( badProxy ){
			req.r = Date.now();
		};
		
		var changeUrl = this.dbUrl + '_changes';

		$.ajax({
	    	url: changeUrl
	    	,type: 'GET'
	    	,async: true
	    	,data: req
	    	,dataType: 'json'
	    	,success: opt.onSuccess
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error obtaining database changes: '+errStr);
	    	}
		});
	}

	,getDocumentUrl: function(doc) {
		
		if( typeof(doc) === 'string' ) {
			var docId = doc;
		} else {
			docId = doc._id;
		};
		
		return this.dbUrl + docId;
	}

	,getAttachmentUrl: function(doc,attName) {
		
		var docUrl = this.getDocumentUrl(doc);
		var url = docUrl + '/' + encodeURIComponent(attName);
		
		return url;
	}
	
	,getDocumentRevision: function(opts_) {
		var opts = $.extend({
				docId: null
				,onSuccess: function(info){}
				,onError: function(msg){ $n2.reportErrorForced(msg); }
			}
			,opts_
		);
		
		if( !opts.docId ) {
			opts.onError('No docId set. Can not retrieve document information');
			return;
		};
		
		var data = {
    		startkey: '"' + opts.docId + '"'
    		,endkey: '"' + opts.docId + '"'
    		,include_docs: false
    	};
		
		if( badProxy ){
			data.r = Date.now();
		};

	    $.ajax({
	    	url: this.dbUrl + '_all_docs'
	    	,type: 'get'
	    	,async: true
	    	,data: data
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res.rows && res.rows[0] && res.rows[0].value && res.rows[0].value.rev ) {
	    			opts.onSuccess(res.rows[0].value.rev);
	    		} else {
					opts.onError('Malformed document revision for: '+opts.docId);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error obtaining document revision for '+opts.docId+': '+errStr);
	    	}
	    });
	}
	
	,getDocumentRevisions: function(opts_) {
		var opts = $.extend({
				docIds: null
				,onSuccess: function(info){}
				,onError: function(msg){ $n2.reportErrorForced(msg); }
			}
			,opts_
		);
		
		if( !opts.docIds ) {
			opts.onError('No docIds set. Can not retrieve document revisions');
			return;
		};
		if( !$n2.isArray(opts.docIds) ) {
			opts.onError('docIds must ba an array. Can not retrieve document revisions');
			return;
		};

		var data = {
			keys: opts.docIds
		};
		
	    $.ajax({
	    	url: this.dbUrl + '_all_docs?include_docs=false'
	    	,type: 'POST'
	    	,async: true
	    	,data: JSON.stringify(data)
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res.rows ) {
	    			var info = {};
    				for(var i=0,e=res.rows.length; i<e; ++i){
    					var row = res.rows[i];
    					if( row.id && row.value && row.value.rev ){
    						if( !row.value.deleted ) {
    							info[row.id] = row.value.rev;
    						};
    					};
    				};
	    			opts.onSuccess(info);
	    		} else {
					opts.onError('Malformed document revisions');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error obtaining document revision for '+opts.docId+': '+errStr);
	    	}
	    });
	}
	
	,buildUploadFileForm: function(jQuerySet, options_) {
		var _this = this;
		
		var opts = $.extend({
				docId: null
				,rev: null
				,doc: null
				,onSuccess: function(res){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		// Empty jQuerySet
		jQuerySet.empty();
		
		// This works only if jquery.form is available
		if( !$.fn.ajaxSubmit ) {
			opts.onError('Can not perform file uploads unless jquery.form.js is included');
		};
		
		if( null == opts.docId ) {
			if( opts.doc ) opts.docId = opts.doc._id;
		};
		if( null == opts.docId ) {
			opts.onError('Must specify document id when performing file uploads');
		};
		
		// Get revision for document
		if( null == opts.rev ) {
			if( opts.doc ) opts.rev = opts.doc._rev;
		};
		if( null == opts.rev ) {
			this.getDocumentRevision({
				docId: opts.docId
				,onSuccess: function(docRev){
					jQuerySet.each(function(i, elem){
						installForm(elem, opts.docId, docRev);
					});
				}
				,onError: opts.onError
			});
		} else {
			jQuerySet.each(function(i, elem){
				installForm(elem, opts.docId, opts.rev);
			});
		};
		
		function installForm(elem, docId, docRev) {
			var $elem = $(elem)
				,$form = $('<form method="post"></form>')
				,$button = $('<input class="n2CouchInputButton" type="button"/>')
				;
			$form.append( $('<input class="n2CouchInputFile" type="file" name="_attachments"/>') );
			$form.append( $('<input type="hidden" name="_rev" value="'+docRev+'"/>') );
			$button.val( _loc('Upload') );
			$form.append( $button );
			$elem.append($form);
			
			$button.click(function(){
				$form.ajaxSubmit({
					type: 'post'
					,url: _this.dbUrl + docId
					,dataType: 'json'
					,success: function(res) {
						$elem.find('*').removeAttr('disabled');
						if( res.error ) {
							opts.onError(_loc('Error while uploading: ')+res.error,options_);
						} else {
							opts.onSuccess(res,options_);
						}
					}
					,error: function(xhr, status, err) {
						$elem.find('*').removeAttr('disabled');
						opts.onError(_loc('Error while uploading: ')+err,options_);
					}
				});
				
				// Disable elements while file is uploading
				$elem.find('.n2CouchInputButton').attr('disabled','disabled');
			});
		};
	}
	
	,createDocument: function(options_) {
		var opts = $.extend(true, {
				data: {}
				,onSuccess: function(docInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to create database documents');
		};
		
		var _s = this;
		
		var docId = opts.data._id;
		if( docId ) {
			// If _id was specified
			onUuid(docId);
		} else {
			this.server.getUniqueId({
				onSuccess: onUuid
				,onError: opts.onError
			});
		};
		
		function onUuid(docId){
			$.ajax({
		    	url: _s.dbUrl + docId
		    	,type: 'put'
		    	,async: true
		    	,data: JSON.stringify(opts.data)
		    	,contentType: 'application/json'
		    	,dataType: 'json'
		    	,success: function(docInfo) {
		    		_s.callbacks._reportOnCreated(docInfo);
		    		opts.onSuccess(docInfo);
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
					var cause = httpJsonError(XMLHttpRequest, textStatus);
					var err = $n2.error.fromString(_loc('Error creating document'),cause);
		    		opts.onError(err);
		    	}
			});
		};
	}
	
	,updateDocument: function(options_) {
		var opts = $.extend(true, {
				data: null
				,onSuccess: function(docInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to update database documents');
			return;
		};
		
		if( !opts.data || !opts.data._id || !opts.data._rev ) {
			opts.onError('On update, a valid document with _id and _rev attributes must be supplied');
			return;
		};
		
		var _s = this;
		
		$.ajax({
	    	url: _s.dbUrl + opts.data._id
	    	,type: 'PUT'
	    	,async: true
	    	,data: JSON.stringify(opts.data)
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(docInfo) {
	    		_s.callbacks._reportOnUpdated(docInfo);
	    		opts.onSuccess(docInfo);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var cause = httpJsonError(XMLHttpRequest, textStatus);
				var err = $n2.error.fromString(_loc('Error updating document'),cause);
	    		opts.onError(err);
	    	}
		});
	}
	
	,deleteDocument: function(options_) {
		var opts = $.extend(true, {
				data: null
				,onSuccess: function(docInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to delete database documents');
			return;
		};
		
		if( !opts.data || !opts.data._id || !opts.data._rev ) {
			opts.onError('On delete, a valid document with _id and _rev attributes must be supplied');
			return;
		};
		
		var _s = this;
		
		$.ajax({
	    	url: _s.dbUrl + opts.data._id + '?rev=' + opts.data._rev
	    	,type: 'DELETE'
	    	,async: true
	    	,dataType: 'json'
	    	,success: function(docInfo) {
	    		_s.callbacks._reportOnDeleted(docInfo);
	    		opts.onSuccess(docInfo);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var cause = httpJsonError(XMLHttpRequest, textStatus);
				var err = $n2.error.fromString(_loc('Error deleting document'),cause);
	    		opts.onError(err);
	    	}
		});
	}
	
	/**
		Inserts and/or updates a number of documents
	 	@name bulkDocuments
	 	@function
	 	@memberOf nunaliit2.couch.Database
	 	@param {Array} documents Array of documents
	 	@param {Object} options_ Options associated with operations
	 
	 */
	,bulkDocuments: function(documents, options_) {
		var opts = $.extend(true, {
				onSuccess: function(docInfos){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to create database documents');
		};
		
		var data = JSON.stringify({ docs: documents });
		
		var _s = this;

		// Bulk documents operations use POST		
		$.ajax({
	    	url: _s.dbUrl + '_bulk_docs'
	    	,type: 'POST'
	    	,async: true
	    	,data: data
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(docInfos) {
	    		opts.onSuccess(docInfos);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error on bulk document operation: '+errStr);
	    	}
		});
	}
	
	,getDocument: function(options_) {
		var opts = $.extend(true, {
				docId: null
				,rev: null
				,revs_info: false
				,revisions: false
				,conflicts: false
				,deleted_conflicts: false
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		if( !opts.docId ) {
			opts.onError('No docId set. Can not retrieve document');
		};
		
		var data = {};
		
		if( opts.rev ) {
			data.rev = opts.rev;
		};
		
		if( opts.revs_info ) {
			data.revs_info = 'true';
		};
		
		if( opts.revisions ) {
			data.revs = 'true';
		};

		if( opts.conflicts ) {
			data.conflicts = 'true';
		};

		if( opts.deleted_conflicts ) {
			data.deleted_conflicts = 'true';
		};
		
		if( badProxy ){
			data.r = Date.now();
		}
		
		var url = this.dbUrl + opts.docId;
		
	    $.ajax({
	    	url: url
	    	,type: 'get'
	    	,async: true
	    	,data: data
	    	,dataType: 'json'
	    	,success: function(res) {
	    		opts.onSuccess(res);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error obtaining document content for '+opts.docId+': '+errStr);
	    	}
	    });
	}

	,getDocuments: function(opts_) {
		var opts = $.extend(true, {
				docIds: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){ $n2.log(errorMsg); }
			}
			,opts_
		);
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to query multiple documents');
			return;
		};
		
		if( !opts.docIds ) {
			opts.onError('No docIds set. Can not retrieve documents');
			return;
		};
		
		var viewUrl = this.dbUrl + '_all_docs?include_docs=true';
		
		var data = {
			keys: opts.docIds // requires POST
		};
		
		$.ajax({
	    	url: viewUrl
	    	,type: 'POST'
	    	,async: true
	    	,data: JSON.stringify(data)
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(queryResult) {
	    		if( queryResult.rows ) {
	    			var docs = [];
	    			for(var i=0,e=queryResult.rows.length; i<e; ++i) {
	    				var row = queryResult.rows[i];
	    				if( row && row.doc ) {
	    					docs.push(row.doc);
	    				}
	    			};
	    			opts.onSuccess(docs);
	    		} else {
		    		opts.onError('Unexpected response during query of multiple documents');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during query of multiple documents: '+errStr);
	    	}
		});
	}

	,listAllDocuments: function(opts_) {
		var opts = $.extend(true, {
				onSuccess: function(docIds){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var viewUrl = this.dbUrl + '_all_docs?include_docs=false';
		
		if( badProxy ){
			viewUrl += '&r=' + Date.now();
		};
		
		$.ajax({
	    	url: viewUrl
	    	,type: 'GET'
	    	,async: true
	    	,dataType: 'json'
	    	,success: function(queryResult) {
	    		if( queryResult.rows ) {
	    			var docIds = [];
	    			for(var i=0,e=queryResult.rows.length; i<e; ++i) {
	    				var row = queryResult.rows[i];
	    				if( row && row.id ) {
	    					docIds.push(row.id);
	    				}
	    			};
	    			opts.onSuccess(docIds);
	    		} else {
		    		opts.onError('Unexpected response during listing of all documents');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during listing of all documents: '+errStr);
	    	}
		});
	}

	,getAllDocuments: function(opts_) {
		var opts = $.extend(true, {
				startkey: null
				,endkey: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);

		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to query a view');
		};
		
		var data = {
			include_docs: true
		};
		for(var k in opts) {
			if( null === opts[k] ){
				// Ignore

			} else if( k === 'startkey' 
					|| k === 'endkey' ) { 
				data[k] = JSON.stringify( opts[k] );
			};
		};
		
		var viewUrl = this.dbUrl + '_all_docs';
		
		if( badProxy ){
			data.r = Date.now();
		};
		
		$.ajax({
	    	url: viewUrl
	    	,type: 'GET'
	    	,async: true
	    	,data: data
	    	,dataType: 'json'
	    	,success: function(queryResult) {
	    		if( queryResult.rows ) {
	    			var docs = [];
	    			for(var i=0,e=queryResult.rows.length; i<e; ++i) {
	    				var row = queryResult.rows[i];
	    				if( row && row.doc ) {
	    					docs.push(row.doc);
	    				};
	    			};
	    			opts.onSuccess(docs);
	    		} else {
		    		opts.onError('Unexpected response during retrieval of all documents');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during retrieval of all documents: '+errStr);
	    	}
		});
	}
	
	,getInfo: function(opts_) {
		var opts = $.extend(true, {
				onSuccess: function(dbInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var data = {};
		
		if( badProxy ){
			data.r = Date.now();
		};
		
		$.ajax({
	    	url: this.dbUrl
	    	,type: 'GET'
	    	,async: true
	    	,dataType: 'json'
	    	,data: data
	    	,success: function(dbInfo) {
	    		if( dbInfo.error ) {
		    		opts.onError(dbInfo.error);
	    		} else {
		    		opts.onSuccess(dbInfo);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during databse infro: '+errStr);
	    	}
		});
	}
	
	,queryTemporaryView: function(opts_){
		var opts = $n2.extend({
			map: null
			,reduce: null
			,onSuccess: function(rows){}
			,onError: $n2.reportErrorForced
		},opts_);

		if( !opts.map ) {
			opts.onError('"map" must be provided in temporary view');
		};
		
		var data = {
			map: opts.map
		};
		
		if( opts.reduce ) {
			data.reduce = opts.reduce;
		};
			
		var viewUrl = this.dbUrl + '_temp_view';
		
		$.ajax({
	    	url: viewUrl
	    	,type: 'post'
	    	,async: true
	    	,dataType: 'json'
	    	,data: JSON.stringify( data )
	    	,contentType: 'application/json'
	    	,success: function(queryResult) {
	    		if( queryResult.rows ) {
	    			opts.onSuccess(queryResult.rows);
	    		} else {
		    		opts.onError('Unexpected response during query of temporary view');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during query temporary view: '+errStr);
	    	}
		});
	}
});

//=============================================
// User DB
//=============================================

var UserDb = $n2.Class(Database,{
	
	initialize: function(server_,dbName_){
		if( !dbName_ ){
			dbName = '_users';
		};
		Database.prototype.initialize.call(this,{dbName:dbName_},server_);
	}
	
	,createUser: function(opts_) {
		var opts = $.extend({
				name: null
				,password: null
				,onSuccess: function(docInfo) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);

		var userDbUrl = this.getUrl();

		// Check that JSON is installed
		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to create database documents');
			return;
		};
	
	    this.server.getUniqueId({
			onSuccess: onUuid
	    });
	    
	    function onUuid(uuid) {
			var id = 'org.couchdb.user:'+fixUserName(opts.name);
			var salt = uuid;
			var password_sha = $n2.crypto.hex_sha1(opts.password + salt);
		
			// Create user document
			var doc = {};
			for(var key in opts) {
				if( key !== 'name' 
				 && key !== 'password' 
				 && key !== 'onSuccess' 
				 && key !== 'onError' 
				 ) {
					doc[key] = opts[key];
				};
			};
			doc.type = "user";
			doc.name = fixUserName(opts.name);
			doc.password_sha = password_sha;
			doc.salt = salt;
			if( !$n2.isArray(doc.roles) ) {
				doc.roles = [];
			};
			
			$.ajax({
		    	url: userDbUrl + id
	    		,type: 'put'
	    		,async: true
		    	,data: JSON.stringify(doc)
		    	,contentType: 'application/json'
	    		,dataType: 'json'
	    		,success: opts.onSuccess
	    		,error: function(XMLHttpRequest, textStatus, errorThrown) {
					var errStr = httpJsonError(XMLHttpRequest, textStatus);
		    		opts.onError('Error during user creation: '+errStr);
		    	}
			});
		};
	}
	
	,updateUser: function(options_) {
		var opts = $.extend(true, {
				user: null
				,onSuccess: function(docInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);

		var userDbUrl = this.getUrl();
		
		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to update user documents');
			return;
		};
		
		if( !opts.user || !opts.user._id ) {
			opts.onError('On update, a valid document with _id attribute must be supplied');
			return;
		};
		
		$.ajax({
	    	url: userDbUrl + opts.user._id
	    	,type: 'PUT'
	    	,async: true
	    	,data: JSON.stringify(opts.user)
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(docInfo) {
	    		opts.onSuccess(docInfo);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error updating user: '+errStr);
	    	}
		});
	}

	,setUserPassword: function(options_) {
		var opts = $.extend(true, {
				user: null
				,password: null
				,onSuccess: function(docInfo){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);

		var userDbUrl = this.getUrl();

		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to set user password');
			return;
		};
		
		if( !opts.user || !opts.user._id || !opts.user._rev ) {
			opts.onError('On password change, a valid user document with _id and _rev attributes must be supplied');
			return;
		};
		
		if( !opts.password ) {
			opts.onError('On password change, a valid password must be supplied');
			return;
		};
		
		this.computeUserPassword({
			userDoc: opts.user
			,password: opts.password
			,onSuccess: function(userDoc){
				$.ajax({
			    	url: userDbUrl + opts.user._id
			    	,type: 'PUT'
			    	,async: true
			    	,data: JSON.stringify(userDoc)
			    	,contentType: 'application/json'
			    	,dataType: 'json'
			    	,success: function(docInfo) {
			    		opts.onSuccess(docInfo);
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						var errStr = httpJsonError(XMLHttpRequest, textStatus);
			    		opts.onError('Error changing user password: '+errStr);
			    	}
				});
			}
			,onError: opts.onError
		});
	}

	,computeUserPassword: function(options_) {
		var opts = $.extend({
				userDoc: null
				,password: null
				,onSuccess: function(userDoc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);

		if( !JSON || typeof(JSON.stringify) !== 'function' ) {
			opts.onError('json.js is required to set user password');
			return;
		};
		
		if( !opts.userDoc ) {
			opts.onError('On setting password, a user document must be provided');
			return;
		};
		
		if( !opts.password ) {
			opts.onError('On setting change, a valid password must be supplied');
			return;
		};
		
	    this.server.getUniqueId({
			onSuccess: onUuid
	    });
	    
	    function onUuid(uuid) {
			var salt = uuid;
			var password_sha = $n2.crypto.hex_sha1(opts.password + salt);
			
			// Remove unwanted fields
			if( opts.userDoc.password ) delete opts.userDoc.password;
			if( opts.userDoc.password_scheme ) delete opts.userDoc.password_scheme;
			if( opts.userDoc.iterations ) delete opts.userDoc.iterations;
			if( opts.userDoc.derived_key ) delete opts.userDoc.derived_key;
			if( opts.userDoc.salt ) delete opts.userDoc.salt;
			if( opts.userDoc.password_sha ) delete opts.userDoc.password_sha;
		
			// Update user document
			opts.userDoc.password_sha = password_sha;
			opts.userDoc.salt = salt;

			opts.onSuccess(opts.userDoc);
		};
	}
	
	,deleteUser: function(opts_) {
		var opts = $.extend({
				user: null // a user document (do not need to specify id, rev)
				,id: null
				,rev: null
				,name: null
				,onSuccess: function(docInfo) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);
		var userDbUrl = this.getUrl();

		var id = null;
		var rev = null;
		if( opts.user ) {
			id = opts.user._id;
			rev = opts.user._rev;
		}
		
		if( !id && opts.id ) {
			id = opts.id;
		}
		
		if( !id && opts.name ) {
			id = 'org.couchdb.user:'+fixUserName(opts.name);
		}
		if( !rev && opts.rev ) {
			rev = opts.rev;
		}
		
		$.ajax({
	    	url: userDbUrl + id + '?rev=' + rev 
 		,type: 'DELETE'
 		,async: true
 		,dataType: 'json'
 		,success: opts.onSuccess
 		,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during user deletion: '+errStr);
	    	}
		});
	}
	
	,getUser: function(options_) {
		var opts = $.extend(true, {
				name: null
				,id: null
				,onSuccess: function(user){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		var userDbUrl = this.getUrl();
		
		var id = opts.id;
		if( !id ) {
			id = 'org.couchdb.user:'+fixUserName(opts.name);
		};
		
		var data = {};
		
		if( badProxy ){
			data.r = Date.now();
		};
		
	    $.ajax({
	    	url: userDbUrl + id 
	    	,type: 'get'
	    	,async: true
	    	,dataType: 'json'
	    	,data: data
	    	,success: function(userDoc) {
	    		opts.onSuccess(userDoc);
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError( _loc('Error obtaining user document for {id}: {err}',{
	    			id: id
	    			,err: errStr
	    		}) );
	    	}
	    });
	}
	
	,getUsers: function(options_) {
		var opts = $.extend(true, {
				names: null
				,ids: null
				,onSuccess: function(users){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		var _this = this;
		
		var effectiveUrl = this.getUrl() + '_all_docs?include_docs=true';
		
		var ids = null;
		if( opts.ids && opts.ids.length ){
			ids = opts.ids.slice(0); // clone
		} else {
			ids = [];
		};
		if( opts.names && opts.names.length ) {
			for(var i=0,e=opts.names.length; i<e; ++i) {
				ids.push('org.couchdb.user:'+fixUserName(opts.names[i]));
			};
		};
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to query multiple users');
			return;
		};
		
		var data = {
			keys: ids // requires POST
		};
		
		var users = [];
		var missingIds = {};
	    $.ajax({
	    	url: effectiveUrl
	    	,type: 'POST'
	    	,async: true
	    	,data: JSON.stringify(data)
	    	,contentType: 'application/json'
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res.rows ) {
	    			var isMissing = false;
	    			for(var i=0,e=res.rows.length; i<e; ++i) {
	    				var row = res.rows[i];
	    				if( row && row.doc ) {
	    					if( row.doc._id ){
		    					users.push(row.doc);
	    					} else {
	    						// Work around for bug in CouchDB 1.4.0
	    						// https://issues.apache.org/jira/browse/COUCHDB-1888
	    						// Keep a list of dacuments returned without preperties and
	    						// try to retrieve them one at a time
	    						isMissing = true;
	    						missingIds[row.id] = true;
	    						retrieveUser(row.id);
	    					};
	    				}
	    			};
	    			if( !isMissing ){
	    				// All documents available. Simply return to caller
		    			opts.onSuccess(users);
	    			};
	    		} else {
		    		opts.onError('Unexpected response during query of multiple users');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during query of multiple users: '+errStr);
	    	}
	    });
		
		function retrieveUser(userId){
			_this.getUser({
				id: userId
				,onSuccess: function(user){
					if( user._id ){
						users.push(user);
					};
					delete missingIds[userId];
					returnUsers();
				}
				,onError: function(errorMsg){
					delete missingIds[userId];
					returnUsers();
				}
			});
		};
		
		function returnUsers(){
			for(var id in missingIds){
				// still waiting for some documents to be returned
				return id; // return id to remove warning
			};
			opts.onSuccess(users);
		};
	}

	,getAllUsers: function(opts_) {
		var opts = $.extend({
				onSuccess: function(users) {}
				,onError: $n2.reportErrorForced
			}
			,opts_
		);
		
		var _this = this;
		
		if( JSON && JSON.stringify ) {
			// OK
		} else {
			opts.onError('json.js is required to query a view');
			return;
		};
		
		var viewUrl = this.getUrl() + '_all_docs';
		
		var data = {
			startkey: JSON.stringify('org.couchdb.user:')
			,endkey: JSON.stringify('org.couchdb.user=')
			,include_docs: true
		};
		
		if( badProxy ){
			data.r = Date.now();
		};
		
		var users = [];
		var missingIds = {};
		$.ajax({
	    	url: viewUrl
	    	,type: 'get'
	    	,async: true
	    	,data: data
	    	,dataType: 'json'
	    	,success: function(queryResult) {
	    		if( queryResult.rows ) {
	    			var isMissing = false;
	    			for(var i=0,e=queryResult.rows.length; i<e; ++i) {
	    				var row = queryResult.rows[i];
	    				if( row && row.doc ) {
	    					if( row.doc._id ){
		    					users.push(row.doc);
	    					} else {
	    						// Work around for bug in CouchDB 1.4.0
	    						// https://issues.apache.org/jira/browse/COUCHDB-1888
	    						// Keep a list of dacuments returned without preperties and
	    						// try to retrieve them one at a time
	    						isMissing = true;
	    						missingIds[row.id] = true;
	    						retrieveUser(row.id);
	    					};
	    				}
	    			};
	    			if( !isMissing ){
	    				// All documents available. Simply return to caller
		    			opts.onSuccess(users);
	    			};
	    		} else {
		    		opts.onError('Unexpected response during query of all users');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error during query of all users: '+errStr);
	    	}
		});
		
		function retrieveUser(userId){
			_this.getUser({
				id: userId
				,onSuccess: function(user){
					if( user._id ){
						users.push(user);
					};
					delete missingIds[userId];
					returnUsers();
				}
				,onError: function(errorMsg){
					delete missingIds[userId];
					returnUsers();
				}
			});
		};
		
		function returnUsers(){
			for(var id in missingIds){
				// still waiting for some documents to be returned
				return id; // return id to remove warning
			};
			opts.onSuccess(users);
		};
	}
});

// =============================================
// Server
// =============================================

var Server = $n2.Class({
	
	options: null
	
	,isInitialized: false
	
	,uuids: null
	
	,userDbName: null
	
	,userDb: null
	
	,session: null
	
	,initListeners: null

	,initialize: function(options_, initListeners_){
		this.options = $n2.extend({
				pathToServer: '../'
				,pathToSession: null
				,pathToUserDb: null
				,pathToUuids: null
				,pathToReplicate: null
				,pathToActiveTasks: null
				,pathToAllDbs: null
				,version: null
				,skipSessionInitialization: false
				,userDbName: null
				,onSuccess: function(server){}
				,onError: function(err){}
			}
			,options_
		);
	
		this.isInitialized = false;
		this.uuids = [];
		this.userDbName = this.options.userDbName;
		this.userDb = null;
		this.session = null;
		this.initListeners = initListeners_;
		if( !this.initListeners ) {
			this.initListeners = [];
		};

		var _this = this;

		getServerVersion();
		
		function getServerVersion() {
			if( _this.options.version ) {
				// Do not need to get version, it was specified
				refreshContext();

			} else {
				var data = {};
				
				if( badProxy ){
					data.r = Date.now();
				};
				
				$.ajax({
			    	url: _this.options.pathToServer
			    	,type: 'get'
			    	,async: true
			    	,dataType: 'json'
			    	,data: data
			    	,success: function(res) {
			    		if( res.version ) {
			    			_this.options.version = res.version;
			    			
			    			// Now, refresh context
			    			getUserDbName();
			    			
			    		} else {
			    			errorInitialize('Malformed database welcome message.');
			    		};
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						var errStr = httpJsonError(XMLHttpRequest, textStatus);
						errorInitialize('Error obtaining database welcome: '+errStr);
			    	}
				});
			};
		};
		
		function getUserDbName(){
			if( null != _this.userDbName ){
				// User Db Name provided, no need to look for it
				refreshContext(null);
				
			} else {
				var sessionUrl = _this.getSessionUrl();
				
				var data = {};
				
				if( badProxy ){
					data.r = Date.now();
				};
				
				$.ajax({
			    	url: sessionUrl
			    	,type: 'get'
			    	,async: true
			    	,dataType: 'json'
			    	,data: data
			    	,success: function(res) {
			    		if( res.ok ) {
			    			// Retrieve user db, if available
			    			if( res && res.info && res.info.authentication_db ) {
			    				_this.userDbName = res.info.authentication_db;
			    			};

			    			refreshContext(res);
			    			
			    		} else {
			    			errorInitialize('Malformed session information message.');
			    		};
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						var errStr = httpJsonError(XMLHttpRequest, textStatus);
						errorInitialize('Error obtaining session information: '+errStr);
			    	}
				});
			};
		}
		
		function refreshContext(sessionInfo) {
			if( _this.options.skipSessionInitialization ) {
				finishInitialize();
				
			} else {
				_this.getSession().refreshContext({
					onSuccess: finishInitialize
					,onError: errorInitialize
				});
			};
		};
		
		function finishInitialize() {
			_this.isInitialized = true;
			
			// Call back all listeners
			for(var i=0,e=_this.initListeners; i<e; ++i) {
				var listener = _this.initListeners[i];
				try { listener(); } catch(e){}
			};
			_this.initListeners = [];
			
			_this.options.onSuccess(_this);
			
			// release callbacks
			delete _this.options['onSuccess'];
			delete _this.options['onError'];
		};
		
		function errorInitialize(err) {
			_this.options.onError(err);
			
			// release callbacks
			delete _this.options['onSuccess'];
			delete _this.options['onError'];
		};
	}

	,getPathToServer: function() {
		return this.options.pathToServer;
	}

	,getVersion: function() { return this.options.version; }
	
	,getReplicateUrl: function() {
		if( null == this.options.pathToReplicate ) {
			return this.options.pathToServer + '_replicate';
		}
		
		return this.options.pathToReplicate; 
	}
	
	,getActiveTasksUrl: function() {
		if( null == this.options.pathToActiveTasks ) {
			return this.options.pathToServer + '_active_tasks';
		}
		
		return this.options.pathToActiveTasks; 
	}
	
	,getSessionUrl: function() {
		var result = this.options.pathToSession;
		if( !result ) {
			result = this.options.pathToServer + '_session';
		};
		return result;
	}
	
	,getUniqueId: function(options_) {
		var opts = $.extend({
				onSuccess: function(uuid){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		var _this = this;
		
		if( this.uuids.length > 0 ) {
			var uuid = this.uuids.pop();
			opts.onSuccess(uuid);
			return;
		};
		
		var pathUUids = this.options.pathToUuids;
		if( !pathUUids ) {
			pathUUids = this.options.pathToServer + '_uuids';
		};
		
		var data = {
	    	count: 10
		};

		if( badProxy ){
			data.r = Date.now();
		};
		
		$.ajax({
	    	url: pathUUids
	    	,type: 'get'
	    	,async: true
	    	,data: data
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res.uuids ) {
	    			for(var i=0,e=res.uuids.length; i<e; ++i) {
	    				var uuid = res.uuids[i];
	    				_this.uuids.push(uuid);
	    			};
					var uuid = _this.uuids.pop();
					opts.onSuccess(uuid);
					return;
	    		}
	    		opts.onError('Malformed uuids from database.');
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error obtaining new uuids from database: '+errStr);
	    	}
		});
	}
	
	,listDatabases: function(options_) {
		var opts = $.extend({
				onSuccess: function(dbNameArray){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);

		var pathToAllDbs = this.options.pathToAllDbs;
		if( !pathToAllDbs ) {
			pathToAllDbs = this.options.pathToServer + '_all_dbs';
		};
		
		var data = {};

		if( badProxy ){
			data.r = Date.now();
		};

		$.ajax({
	    	url: pathToAllDbs
	    	,type: 'get'
	    	,async: true
	    	,dataType: 'json'
	    	,data: data
	    	,success: opts.onSuccess
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error obtaining list of databases: '+errStr);
	    	}
		});
	}

	,getUserDb: function() {
		if( !this.userDb ) {
			this.userDb = new UserDb(this,this.userDbName);
		};
		return this.userDb; 
	}

	,getSession: function(sessionInfo) {
		if( !this.session ) {
			this.session = new Session(this,sessionInfo);
		};
		
		return this.session;
	}
	
	,getDb: function(opts) {
		return new Database(opts, this);
	}
	
	,createDb: function(opts_) {
		var opts = $n2.extend({
			dbName: null
			,onSuccess: function(db){}
			,onError: $n2.reportErrorForced
		},opts_);
		
		if( !opts.dbName ) {
			opts.onError('"dbName" must be provided when creating a database');
			return;
		};

		var dbUrl = this.getPathToServer() + opts.dbName;
		
		var _s = this;
		
		$.ajax({
	    	url: dbUrl
	    	,type: 'put'
	    	,async: true
	    	,dataType: 'json'
	    	,success: function(creationInfo) {
	    		if( creationInfo.ok ) {
	    			var db = _s.getDb({dbUrl: dbUrl});
	    			opts.onSuccess(db);
	    		} else {
	    			opts.onError('Error occurred when creating database: '+creationInfo.error);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error creating database: '+errStr);
	    	}
		});
	}
	
	,deleteDb: function(opts_) {
		var opts = $n2.extend({
			dbName: null
			,onSuccess: function(){}
			,onError: $n2.reportErrorForced
		},opts_);
		
		if( !opts.dbName ) {
			opts.onError('"dbName" must be provided when deleting a database');
			return;
		};

		var dbUrl = this.getPathToServer() + opts.dbName;
		
		var _s = this;
		
		$.ajax({
	    	url: dbUrl
	    	,type: 'DELETE'
	    	,async: true
	    	,dataType: 'json'
	    	,success: function(info) {
	    		if( info.ok ) {
	    			opts.onSuccess();
	    		} else {
	    			opts.onError('Error occurred when deleting database: '+info.error);
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
	    		opts.onError('Error deleting database: '+errStr);
	    	}
		});
	}
	
	,replicate: function(opts_){
		var opts = $n2.extend({
			source: null
			,target: null
			,filter: null
			,docIds: null
			,continuous: false
			,onSuccess: function(db){}
			,onError: $n2.reportErrorForced
		},opts_);

		if( !opts.source ) {
			opts.onError('"source" must be provided for replication');
			return;
		};
		if( !opts.target ) {
			opts.onError('"target" must be provided for replication');
			return;
		};
		
		var request = {
			source: opts.source
			,target: opts.target
		};
		if( opts.filter ) {
			request.filter = opts.filter;
		};
		if( opts.continuous ) {
			request.continuous = true;
		};
		if( opts.docIds ) {
			request.doc_ids = opts.docIds;
		};

		var serverPath = this.getReplicateUrl();

		$.ajax({
	    	url: serverPath
	    	,type: 'POST'
	    	,async: true
	    	,data: JSON.stringify(request)
	    	,contentType: 'application/json'
    		,dataType: 'json'
    		,success: function(res) {
	    		if( res.error ) {
	    			opts.onError('Error while initiating replication: '+res.error);
	    		} else {
	    			opts.onSuccess(res);
	    		};
    		}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = httpJsonError(XMLHttpRequest, textStatus);
				opts.onError('Error initiating replication: '+errStr);
    		}
		});
	}
	
	,addInitializedListener: function(listener) {
		if( typeof(listener) === 'function' ) {
			if( this.isInitialized ) {
				try { listener(); } catch(e) {}
			} else {
				this.initListeners.push(listener);
			};
		};
	}

});

//=============================================
// Utilities
//=============================================

function addAttachmentToDocument(opts_){
	var opts = $n2.extend({
		doc: null // Document to add attachment
		,data: null // The binary data in the attachment
		,attachmentName: null // name of attachment
		,contentType: 'application/binary'
	},opts_);
	
	if( !opts.doc || !opts.data || !opts.attachmentName ) {
		return 'Invalid parameters';
	};
	
	if( typeof($n2.Base64) == 'undefined' ) {
		return 'Base64 not included';
	};
	
	if( !opts.doc._attachments ) {
		opts.doc._attachments = {};
	};
	
	opts.doc._attachments[opts.attachmentName] = {};
	opts.doc._attachments[opts.attachmentName].content_type = opts.contentType;
	opts.doc._attachments[opts.attachmentName].data = $n2.Base64.encode(opts.data);
	
	return null;
};

//=============================================
// Couch Default
//=============================================

$n2.couch = $.extend({},{
	
	isBadProxy: isBadProxy

	,setBadProxy: setBadProxy
	
	,getServer: function(opt_) {
		return new Server(opt_);
	}
	
	/* Following deals with "default" server */
	,DefaultServer: null
	
	,defaultInitializeListeners: []
	
	,getPathToServer: function() {
		return $n2.couch.DefaultServer.getPathToServer();
	}
	
	,addInitializedListener: function(listener) {
		if( $n2.couch.DefaultServer ) {
			$n2.couch.DefaultServer.addInitializedListener(listener);
		} else {
			if( typeof(listener) === 'function' ) {
				$n2.couch.defaultInitializeListeners.push(listener);
			};
		};
	}
	
	,initialize: function(opts_) {
		$n2.couch.DefaultServer = new Server(opts_, $n2.couch.defaultInitializeListeners);
	}
	
	,getVersion: function() { 
		return $n2.couch.DefaultServer.getVersion(); 
	}
	
	,getSession: function() {
		return $n2.couch.DefaultServer.getSession(); 
	}

	,getUserDb: function() { 
		return $n2.couch.DefaultServer.getUserDb();
	}
	
	,getReplicateUrl: function() {
		return $n2.couch.DefaultServer.getReplicateUrl();
	}
	
	,getActiveTasksUrl: function() {
		return $n2.couch.DefaultServer.getActiveTasksUrl();
	}
	
	,getDb: function(opts) {
		return $n2.couch.DefaultServer.getDb(opts);
	}

	,getUniqueId: function(options_) {
		$n2.couch.DefaultServer.getUniqueId();
	}
	
	,addAttachmentToDocument: addAttachmentToDocument
	
	,compareSessionContexts: compareSessionContexts
});


$.fn.couchUploadFile = function(opts) {
	var db = $n2.couch.getDb(opts);
	db.buildUploadFileForm(this, opts);
	return this;
};

})(jQuery,nunaliit2);
