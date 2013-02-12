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

$Id: n2.couchRequests.js 8443 2012-08-16 18:04:28Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

$n2.couchRequests = $n2.Class({
	options: null
	
	,currentRequests: null
	
	,scheduled: null
	
	,userListeners: null
	
	,documentListeners: null
	
	,initialize: function(options_) {
		this.options = $n2.extend({},{
			db: null
			,userDb: null
			,designDoc: null
			,cacheService: null
			,directory: null
		},options_);
		
		this.currentRequests = {};
		
		this.scheduled = false;

		this.userListeners = [];
		
		this.documentListeners = [];
	}

	,addUserListener: function(listener){
		if( typeof(listener) === 'function' ) {
			this.userListeners.push(listener);
		};
	}

	,addDocumentListener: function(listener){
		if( typeof(listener) === 'function' ) {
			this.documentListeners.push(listener);
		};
	}
	
	,requestUser: function(userName){
		// Remember request
		if( !this.currentRequests.users ) {
			this.currentRequests.users = {};
		};
		this.currentRequests.users[userName] = 1;
		
		this._schedule();
	}
	
	,requestDocument: function(docId, cbFn){
		// Remember request
		if( !this.currentRequests.docs ) {
			this.currentRequests.docs = {};
		};
		
		if( !this.currentRequests.docs[docId] ) {
			this.currentRequests.docs[docId] = [];
		};
		
		if( cbFn ) {
			this.currentRequests.docs[docId].push(cbFn);
		};
		
		this._schedule();
	}

	,_schedule: function() {
		if( this.scheduled ) return;
		
		var _this = this;
		this.scheduled = true;
		setTimeout(function(){
			_this.scheduled = false;
			_this._performRequests();
		},0);
	}
	
	,_performRequests: function() {
		var _this = this;
		
		var requests = this.currentRequests;
		this.currentRequests = {};
		
		// Users
		if( requests.users && this.options.userDb ) {
			for(var userName in requests.users) {
				this.options.userDb.getUser({
					name: userName
					,onSuccess: function(user) {
						_this._callUserListeners(user);
					}
					,onError: function(err){}
				});
			};
		};
		
		// Documents
		var cachedDocs = null;
		if( requests.docs && this.options.db ) {
			var docIds = [];
			for(var docId in requests.docs) {
				// Check cache
				var cachedDoc = null;
				if( this.options.cacheService ) {
					cachedDoc = this.options.cacheService.retrieve(docId);
				};
				
				if( cachedDoc ) {
					if( !cachedDocs ) {
						cachedDocs = [];
					};
					cachedDocs.push(cachedDoc);
				} else {
					// Not cached. Must request from db
					docIds.push(docId);
				};
			};

			// Request the required documents from db
			if( docIds.length ) {
				this.options.db.getDocuments({
					docIds: docIds
					,onSuccess: function(docs) {
						_this._callDocumentListeners(docs, requests);
					}
				});
			};
		};
		
		// Report cached documents, if any
		if( null !== cachedDocs ) {
			this._callDocumentListeners(cachedDocs, requests);
		};
	}
	
	,_callUserListeners: function(userDoc){
		//$n2.log('Requested user doc: ',userDoc);		

		for(var j=0,f=this.userListeners.length; j<f; ++j){
			var listener = this.userListeners[j];
			
			//try {
				listener(userDoc);
			//} catch(e){
			//	$n2.log('Error during user document listener: '+e);
			//}
		};
	}
	
	,_callDocumentListeners: function(docs, requests){
		//$n2.log('Requested docs: ',docs);		
		for(var i=0,e=docs.length; i<e; ++i){
			var doc = docs[i];
			
			this._dispatch({
				type: 'documentVersion'
				,docId: doc._id
				,rev: doc._rev
			});

			// Call document listeners
			for(var j=0,f=this.documentListeners.length; j<f; ++j){
				var listener = this.documentListeners[j];
				
				//try {
					listener(doc);
				//} catch(e){
				//	$n2.log('Error during document listener: '+e);
				//}
			};
			
			// Call listeners specific to this document
			var docId = doc._id;
			if( requests.docs && requests.docs[docId] ) {
				for(var j=0,f=requests.docs[docId].length; j<f; ++j){
					var listener = requests.docs[docId][j];
					listener(doc);
				};
			};
		};
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var h = dispatcher.getHandle('n2.couchRequests');
			dispatcher.send(h,m);
		};
	}
});

})(jQuery,nunaliit2);
