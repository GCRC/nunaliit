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
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchDocument';


// *******************************************************
var CouchDataSource = $n2.Class($n2.document.DataSource, {
	
	db: null
	
	,designDoc: null
	
	,dispatchService: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
				id: null
				,db: null
				,dispatchService: null
			}
			,opts_
		);
		
		$n2.document.DataSource.prototype.initialize.call(this,opts);

		this.db = opts.db;
		this.dispatchService = opts.dispatchService;
		
		this.designDoc = this.db.getDesignDoc({ddName:'atlas'});
	}

	,createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		this._adjustDocument(doc);

		this.db.createDocument({
			data: doc
			,onSuccess: function(docInfo){
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				doc.__n2Source = this;
				
				_this._dispatch({
					type: 'documentVersion'
					,docId: docInfo.id
					,rev: docInfo.rev
				});
				_this._dispatch({
					type: 'documentCreated'
					,docId: docInfo.id
				});
				
				
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,getDocument: function(opts_){
		var opts = $n2.extend({
				docId: null
				,rev: null
				,revs_info: false
				,revisions: false
				,conflicts: false
				,deleted_conflicts: false
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.db.getDocument({
			docId: opts.docId
			,rev: opts.rev
			,revs_info: opts.revs_info
			,revisions: opts.revisions
			,conflicts: opts.conflicts
			,deleted_conflicts: opts.deleted_conflicts
			,onSuccess: function(doc){
				doc.__n2Source = this;
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,verifyDocumentExistence: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(info){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var docIds = opts.docIds;
		
		this.db.getDocumentRevisions({
			docIds: docIds
			,onSuccess: function(info){
				var result = {};
				for(var id in info){
					result[id] = {
						rev: info[id]
					};
				};
				
				opts.onSuccess(result);
			}
			,onError: opts.onError
		});
	}

	,saveDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;

		this._adjustDocument(doc);

		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};
		
		this.db.updateDocument({
			data: copy
			,onSuccess: function(docInfo){
				doc._rev = docInfo.rev;

				_this._dispatch({
					type: 'documentVersion'
					,docId: docInfo.id
					,rev: docInfo.rev
				});
				_this._dispatch({
					type: 'documentUpdated'
					,docId: docInfo.id
				});
				
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var _this = this;

		var doc = opts.doc;
		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};
		
		this.db.deleteDocument({
			data: copy
			,onSuccess: function(docInfo){
				_this._dispatch({
					type: 'documentDeleted'
					,docId: doc._id
				});
				opts.onSuccess();
			}
			,onError: opts.onError
		});
	}

	,getLayerDefinitions: function(opts_){
		var opts = $n2.extend({
				onSuccess: function(layerDefinitions){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'layer-definitions'
			,onSuccess: function(rows){
				var layerIdentifiers = [];
				for(var i=0,e=rows.length;i<e;++i){
					if( rows[i].nunaliit_layer_definition ){
						var d = rows[i].nunaliit_layer_definition;
						if( !d.id ){
							d.id = rows[i]._id;
						};
						layerIdentifiers.push(d);
					};
				};
				opts.onSuccess(layerIdentifiers);
			}
			,onError: opts.onError
		});
	}

	,getDocumentInfoFromIds: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docInfos){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'info'
			,keys: opts.docIds
			,onSuccess: function(rows){
				var infos = [];
				for(var i=0,e=rows.length;i<e;++i){
					infos.push(rows[i].value);
				};
				opts.onSuccess(infos);
			}
			,onError: opts.onError
		});
	}

	,getReferencesFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		this.designDoc.queryView({
			viewName: 'link-references'
			,startkey: opts.docId
			,endkey: opts.docId
			,onSuccess: function(rows){
				var refIdMap = {};
				for(var i=0,e=rows.length;i<e;++i){
					refIdMap[rows[i].id] = true;
				};
				
				var refIds = [];
				for(var refId in refIdMap){
					refIds.push(refId);
				};
				opts.onSuccess(refIds);
			}
			,onError: opts.onError
		});
	}

	,_adjustDocument: function(doc) {

		// Get user name
		var userName = null;
		var sessionContext = $n2.couch.getSession().getContext();
		if( sessionContext ) {
			userName = sessionContext.name;
		};
		
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
	
	,_dispatch: function(m){
		if( this.dispatchService ){
			this.dispatchService.send(DH,m);
		};
	}
});

//*******************************************************
var CouchDataSourceWithSubmissionDb = $n2.Class(CouchDataSource, {
	
	submissionDb: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			submissionDb: null
		},opts_);
		
		CouchDataSource.prototype.initialize.call(this,opts);

		this.submissionDb = opts.submissionDb;
	},
	
	/*
	 * When creating a document, send a submission request
	 */
	createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		if( !opts.doc ){
			opts.onError('Document must be provided');
		};

		// Compute document id
		if( opts.doc._id ){
			onUuidComputed(opts.doc._id);
		} else {
			var server = this.db.server;
			if( server ){
				server.getUniqueId({
					onSuccess: onUuidComputed
					,onError: opts.onError
				});
			};
		};
		
		function onUuidComputed(docId){
			// create a submission request
			var doc = opts.doc;
			doc._id = docId;
			
			this._adjustDocument(doc);
			
			var request = {
				nunaliit_type: 'document_submission'
				,nunaliit_submission: {
					original_info: {
						id: docId
					}
					,doc: doc
				}
			};

			this._adjustDocument(request);
			
			this.submissionDb.createDocument({
				data: request
				,onSuccess: function(docInfo){
					doc.__n2Source = this;
					opts.onSuccess(doc);
				}
				,onError: opts.onError
			});
		};
	},

	/*
	 * When updating a document, make a submission request
	 */
	saveDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		var doc = opts.doc;
		
		this._adjustDocument(doc);
		
		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};

		// create a submission request
		var request = {
			nunaliit_type: 'document_submission'
			,nunaliit_submission: {
				original_info: {
					id: docId
					,rev: doc._rev
				}
				,doc: doc
			}
		};

		this._adjustDocument(request);
		
		this.submissionDb.createDocument({
			data: request
			,onSuccess: function(docInfo){
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	},

	/*
	 * When deleting a document, make a submission request
	 */
	deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,opts_
		);
		
		var doc = opts.doc;
		
		var copy = {};
		for(var key in doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = doc[key];
			};
		};

		// create a submission request
		var request = {
			nunaliit_type: 'document_submission'
			,nunaliit_submission: {
				original_info: {
					id: docId
					,rev: doc._rev
				}
				,deletion: true
				,doc: doc
			}
		};

		this._adjustDocument(request);

		this.submissionDb.createDocument({
			data: request
			,onSuccess: function(docInfo){
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}
});

//*******************************************************
$n2.couchDocument = {
	CouchDataSource: CouchDataSource
	,CouchDataSourceWithSubmissionDb: CouchDataSourceWithSubmissionDb
};

})(jQuery,nunaliit2);
