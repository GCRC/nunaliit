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
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,DH = 'n2.document'
;

//*******************************************************
var dataSourceFromId = {};

function getDocumentSourceFromId(id){
	return dataSourceFromId[id];
};

// *******************************************************
var DocumentSource = $n2.Class('DocumentSource', {
	id: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			id: null
		},opts_);
		
		this.id = opts.id;
		if( !this.id ){
			this.id = $n2.getUniqueId();
		};
		if( this.id ){
			dataSourceFromId[this.id] = this;
		};
	},

	getId: function(){
		return this.id;
	},

	/**
	 * This method accepts a document and modifies it so that it reflects that
	 * the document belongs to this source. This is useful if a document is
	 * retrieved on behalf of the document source.
	 */
	adoptDocument: function(doc){
		throw new Error('Subclasses must implement adoptDocument(doc)');
	},

	createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);

		opts.onError('Data source does not support the "createDocument" call.');
	},

	getDocument: function(opts_){
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
		
		opts.onError('Data source does not support the "getDocument" call.');
	},

	getDocuments: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getDocuments" call.');
	},

	getDocumentAttachments: function(doc){
		throw new Error('Subclasses must implement getDocumentAttachments(doc)');
	},

	getDocumentAttachment: function(doc, attachmentName){
		throw new Error('Subclasses must implement getDocumentAttachment(doc,attachmentName)');
	},

	getDocumentAttachmentUrl: function(doc, attachmentName){
		throw new Error('Subclasses must implement getDocumentAttachmentUrl(doc,attachmentName)');
	},

	verifyDocumentExistence: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(info){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "verifyDocumentExistence" call.');
	},

	updateDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "updateDocument" call.');
	},

	deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "deleteDocument" call.');
	},

	getLayerDefinitions: function(opts_){
		var opts = $n2.extend({
				onSuccess: function(layerDefinitions){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getLayerDefinitions" call.');
	},

	getDocumentInfoFromIds: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docInfos){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getDocumentInfoFromIds" call.');
	},

	getReferencesFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getReferencesFromId" call.');
	},

	getProductFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getProductFromId" call.');
	},

	getDocumentsFromGeographicFilter: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,layerId: null
				,bbox: null
				,projectionCode: null
				,onSuccess: function(docs){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getDocumentsFromGeographicFilter" call.');
	},

	getGeographicBoundingBox: function(opts_){
		var opts = $n2.extend({
				layerId: null
				,bbox: null
				,onSuccess: function(bbox){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getGeographicBoundingBox" call.');
	}
});

//*******************************************************

var getDocumentSourceFromDocument = function(opts_) {
	var opts = $n2.extend({
		doc: null
		,dispatchService: null
		,dispatchHandle: DH
	},opts_);

	var doc = opts.doc;
	var dispatchService = opts.dispatchService;
	
	if( !doc ) return undefined;
	if( !dispatchService ) return undefined;
	
	var m = {
		type: 'documentSourceFromDocument'
		,doc: opts.doc
	};
	opts.dispatchService.synchronousCall(opts.dispatchHandle,m);

	return m.documentSource;
};

//*******************************************************

// Deep copy of document
var clone = function(doc){
	var copy = {};
	
	for(var key in doc){
		if( '__n2Source' === key ){
			copy[key] = doc[key];
		} else {
			copy[key] = $n2.deepCopy(doc[key]);
		};
	};
	
	return copy;
};

//*******************************************************
$n2.document = {
	DocumentSource: DocumentSource
	,getDocumentSourceFromDocument: getDocumentSourceFromDocument
	,getDocumentSourceFromId: getDocumentSourceFromId
	,clone: clone
};

})(nunaliit2);
