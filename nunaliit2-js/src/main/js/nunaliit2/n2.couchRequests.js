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

var DH = 'n2.couchRequests',
	MAX_REQUEST_SIZE = 25;

//======================================================
function DocumentRequest(cbFn, multipleDocs){
	this.pending = {};
	this.docsbyId = {};
	this.cbFn = cbFn;
	this.multipleDocs = multipleDocs;
};
DocumentRequest.prototype.waitForDocId = function(docId){
	this.pending[docId] = true;
};
DocumentRequest.prototype.continueDocId = function(docId){
	delete this.pending[docId];
};
DocumentRequest.prototype.isPending = function(){
	for(var docId in this.pending){
		return true;
	};
	return false;
};
DocumentRequest.prototype.receiveDocument = function(doc){
	var docId = doc._id;
	if( this.docsbyId[docId] ){
		this.docsbyId[docId] = doc;
	};
	if( this.pending[docId] ){
		delete this.pending[docId];
		this.docsbyId[docId] = doc;
	};
};
DocumentRequest.prototype.callListener = function(){
	if( typeof this.cbFn === 'function' ){
		if( this.multipleDocs ){
			var docs = [];
			for(var docId in this.docsbyId){
				var doc = this.docsbyId[docId];
				docs.push(doc);
			};
			this.cbFn(docs);
		} else {
			for(var docId in this.docsbyId){
				var doc = this.docsbyId[docId];
				this.cbFn(doc);
			};
		};
		
		// Do not call again
		this.cbFn = null;
	};
};

//======================================================
var DOCUMENT_REQUEST_NO_CALLBACK = new DocumentRequest();
DOCUMENT_REQUEST_NO_CALLBACK.waitForDocId = function(){};
DOCUMENT_REQUEST_NO_CALLBACK.continueDocId = function(){};
DOCUMENT_REQUEST_NO_CALLBACK.isPending = function(){ return false; };
DOCUMENT_REQUEST_NO_CALLBACK.receiveDocument = function(){};
DOCUMENT_REQUEST_NO_CALLBACK.callListener = function(){};

//======================================================
$n2.couchRequests = $n2.Class({
	options: null
	
	,currentRequests: null
	
	,scheduled: null
	
	,userListeners: null
	
	,documentListeners: null
	
	,initialize: function(options_) {
		this.options = $n2.extend({},{
			documentSource: null
			,userDb: null
			,dispatchService: null
			,userServerUrl: null
		},options_);
		
		var _this = this;
		
		this.currentRequests = {};
		
		this.scheduled = false;

		this.userListeners = [];
		
		this.documentListeners = [];
		
		if( this.options.dispatchService ){
			var f = function(m){
				_this._handleMessage(m);
			};
			this.options.dispatchService.register(DH, 'requestDocument', f);
			this.options.dispatchService.register(DH, 'requestDocuments', f);
			this.options.dispatchService.register(DH, 'requestUserDocument', f);
			this.options.dispatchService.register(DH, 'requestUserDocumentComplete', f);
			this.options.dispatchService.register(DH, 'requestLayerDefinition', f);
			this.options.dispatchService.register(DH, 'requestLayerDefinitions', f);
		};
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
	
	,requestCompleteUserDocument: function(userName){
		// Remember request
		if( !this.currentRequests.completeUsers ) {
			this.currentRequests.completeUsers = {};
		};
		this.currentRequests.completeUsers[userName] = 1;
		
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
		
		var request = undefined;
		if( cbFn ){
			request = new DocumentRequest(cbFn);
		} else {
			request = DOCUMENT_REQUEST_NO_CALLBACK;
		};

		request.waitForDocId(docId);

		this.currentRequests.docs[docId].push(request);
		
		this._schedule();
	}

	,requestDocuments: function(docIds, cbFn){
		var _this = this;

		// Remember request
		if( !this.currentRequests.docs ) {
			this.currentRequests.docs = {};
		};
		
		var request = undefined;
		if( cbFn ){
			request = new DocumentRequest(cbFn, true);
		} else {
			request = DOCUMENT_REQUEST_NO_CALLBACK;
		};
		
		docIds.forEach(function(docId){
			request.waitForDocId(docId);

			if( !_this.currentRequests.docs[docId] ) {
				_this.currentRequests.docs[docId] = [];
			};
			
			_this.currentRequests.docs[docId].push(request);
		});
		
		this._schedule();
	}
	
	,requestLayerDefinition: function(layerId){
		// Remember request
		if( !this.currentRequests.layerIds ) {
			this.currentRequests.layerIds = {};
		};
		
		this.currentRequests.layerIds[layerId] = true;
		
		this._schedule();
	}
	
	,requestLayerDefinitions: function(layerIds){
		var _this = this;

		if( $n2.isArray(layerIds) ){
			layerIds.forEach(function(layerId){
				if( typeof layerId === 'string' ){
					_this.requestLayerDefinition(layerId);
				};
			});
		};
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
		if( requests.users && this.options.userServerUrl ) {
			var params = [];
			for(var userName in requests.users) {
				params.push({
					name: 'user'
					,value: userName
				});
			};
			
			var url = this.options.userServerUrl + 'getUsers';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: params
		    	,dataType: 'json'
		    	,success: function(result) {
		    		if( result.users ) {
		    			for(var i=0,e=result.users.length;i<e;++i){
		    				var user = result.users[i];
		    				_this._callUserListeners(user);
		    			};
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {}
			});
			
		} else if( requests.users && this.options.userDb ) {
			// Attempt directly against user database. However, this is
			// likely to fail
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

		// Complete user documents
		if( requests.completeUsers && this.options.userServerUrl ) {
			var params = [];
			for(var userName in requests.completeUsers) {
				params.push({
					name: 'user'
					,value: userName
				});
			};
			
			var url = this.options.userServerUrl + 'getUserDocuments';
			
			$.ajax({
		    	url: url
		    	,type: 'GET'
		    	,async: true
		    	,traditional: true
		    	,data: params
		    	,dataType: 'json'
		    	,success: function(result) {
		    		if( result.users ) {
		    			for(var i=0,e=result.users.length;i<e;++i){
		    				var user = result.users[i];
		    				_this._callCompleteUserListeners(user);
		    			};
		    		};
		    	}
		    	,error: function(XMLHttpRequest, textStatus, errorThrown) {}
			});
		};
		
		// Documents
		var cachedDocs = null;
		if( requests.docs && this.options.documentSource ) {
			var docIds = [];
			for(var docId in requests.docs) {
				// Check cache
				var cachedDoc = this._getCachedDoc(docId);
				
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
				var effectiveDocIds = docIds;
				if( effectiveDocIds.length > MAX_REQUEST_SIZE ){
					var extraDocIds = effectiveDocIds.splice(MAX_REQUEST_SIZE);
					
					var extraRequests = this.currentRequests.docs;
					if( !extraRequests ){
						extraRequests = {};
						this.currentRequests.docs = extraRequests;
					};
					extraDocIds.forEach(function(docId){
						extraRequests[docId] = requests.docs[docId];
					});
					
					this._schedule();
				};
				
				this.options.documentSource.getDocuments({
					docIds: effectiveDocIds
					,onSuccess: function(docs) {
						_this._callDocumentListeners(docs, requests, true, effectiveDocIds);
					}
				});
			};
		};
		
		// Report cached documents, if any
		if( null !== cachedDocs ) {
			this._callDocumentListeners(cachedDocs, requests, false);
		};
		
		// Layer definitions
		if( requests.layerIds 
		 && this.options.documentSource ) {

			var layerIds = [];
			for(var layerId in requests.layerIds){
				layerIds[layerIds.length] = layerId;
			};
			
			if( layerIds.length > 0 ){
				this.options.documentSource.getLayerDefinitions({
					layerIds: layerIds
					,fullDocuments: true
					,onSuccess: function(docs) {
						_this._callDocumentListeners(docs, requests, true);
					}
				});
			};
		};
	}
	
	,_callUserListeners: function(userDoc){
		//$n2.log('Requested user doc: ',userDoc);		

		this._dispatch({
			type: 'userInfo'
			,userInfo: userDoc
		});

		for(var j=0,f=this.userListeners.length; j<f; ++j){
			var listener = this.userListeners[j];
			
			//try {
				listener(userDoc);
			//} catch(e){
			//	$n2.log('Error during user document listener: '+e);
			//}
		};
	}
	
	,_callCompleteUserListeners: function(userDoc){
		//$n2.log('Requested user doc: ',userDoc);		

		this._dispatch({
			type: 'userDocument'
			,userDoc: userDoc
		});
	}
	
	,_callDocumentListeners: function(docs, requests, sendVersionEvent, requestedDocIds){
		//$n2.log('Requested docs: ',docs);		
		for(var i=0,e=docs.length; i<e; ++i){
			var doc = docs[i];
			
			if( sendVersionEvent ){
				this._dispatch({
					type: 'documentVersion'
					,docId: doc._id
					,rev: doc._rev
				});
			};
			
			this._dispatch({
				type: 'documentContent'
				,docId: doc._id
				,doc: doc
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
			
			// Associate document with a request
			var docId = doc._id;
			if( requests.docs && requests.docs[docId] ) {
				var documentRequests = requests.docs[docId];
				documentRequests.forEach(function(documentRequest){
					documentRequest.receiveDocument(doc);
				});
			};
		};
		
		// Stop waiting for documents if they do not exist
		if( requestedDocIds ) {
			requestedDocIds.forEach(function(requestedId){
				if( requests.docs && requests.docs[requestedId] ){
					var documentRequests = requests.docs[requestedId];
					documentRequests.forEach(function(documentRequest){
						documentRequest.continueDocId(requestedId);
					});
				};
			});
		};

		// Call listeners specific to requests
		if( requests.docs ){
			for(var docId in requests.docs){
				var documentRequests = requests.docs[docId];
				documentRequests.forEach(function(documentRequest){
					if( !documentRequest.isPending() ){
						documentRequest.callListener();
					};
				});
			};
		};
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.dispatchService ){
			d = this.options.dispatchService;
		};
		return d;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			dispatcher.send(DH,m);
		};
	}
	
	,_handleMessage: function(m){
		if( 'requestDocument' === m.type ) {
			var docId = m.docId;
			this.requestDocument(docId, m.callback);
			
		} else if( 'requestDocuments' === m.type ) {
			var docIds = m.docIds;
			this.requestDocuments(docIds, m.callback);

		} else if( 'requestUserDocument' === m.type ) {
			var userId = m.userId;
			this.requestUser(userId);

		} else if( 'requestUserDocumentComplete' === m.type ) {
			var userId = m.userId;
			this.requestCompleteUserDocument(userId);

		} else if( 'requestLayerDefinition' === m.type ) {
			var layerId = m.layerId;
			this.requestLayerDefinition(layerId);

		} else if( 'requestLayerDefinitions' === m.type ) {
			var layerIds = m.layerIds;
			this.requestLayerDefinitions(layerIds);
		};
	}
	
	,_getCachedDoc: function(docId){
		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var m = {
				type: 'cacheRetrieveDocument'
				,docId: docId
				,doc: null
			};
			
			dispatcher.synchronousCall(DH,m);
			
			if( m.doc ){
				return m.doc;
			};
		};
		
		return null;
	}
});

})(jQuery,nunaliit2);
