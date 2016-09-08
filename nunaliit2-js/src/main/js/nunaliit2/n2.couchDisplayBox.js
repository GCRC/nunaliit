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

;(function($,$n2) {
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

//=========================================================================

var DisplayImageSourceFactory = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		this.dispatchService = opts.dispatchService;
	},

	getImageSourceForDoc: function(opts_){
		var opts = $n2.extend({
			doc: null
			,attName: null
			,showService: null
			,onSuccess: function(imageSource, doc){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var doc = opts.doc;
		
		var documentSource = $n2.document.getDocumentSourceFromDocument({
			doc: doc
			,dispatchService: this.dispatchService
		});

		// Map to accumulate all references
		var docIdMap = {};
		
		// Forward references
		var references = [];
		$n2.couchUtils.extractLinks(doc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			docIdMap[linkDocId] = true;
		};

		// Obtain reverse references
		documentSource.getReferencesFromId({
			docId: doc._id
			,onSuccess: function(referenceIds){
				for(var i=0, e=referenceIds.length; i<e; ++i){
					var linkDocId = referenceIds[i];
					docIdMap[linkDocId] = true;
				};
				
				loadProductIds();
			}
			,onError: function(errorMsg){
				opts.onError(errorMsg);
			}
		});
		
		function loadProductIds(){
			
			// If we have a source, load all documents with the same source
			if( doc.nunaliit_source 
			 && doc.nunaliit_source.doc ){
				documentSource.getProductFromId({
					docId: doc.nunaliit_source.doc
					,onSuccess: function(docIds){
						for(var i=0, e=docIds.length; i<e; ++i){
							var productDocId = docIds[i];
							docIdMap[productDocId] = true;
						};
						getDocuments();
					}
					,onError: function(errorMsg){
						opts.onError(errorMsg);
					}
				});
			} else {
				getDocuments();
			};
		};
		
		function getDocuments() {
			// Convert map to array
			var refDocIds = [];
			for(var docId in docIdMap) {
				if( docId !== doc._id ) {
					refDocIds.push(docId);
				};
			};
			
			documentSource.getDocuments({
				docIds: refDocIds
				,onSuccess: loadedDocs
				,onError: function(errorMsg){
					opts.onError(errorMsg);
				}
			});
		};
		
		function loadedDocs(docs){
			// Create an image source
			var imageSource = new $n2.displayBox.DisplayImageSourceDoc({
				showService: opts.showService
				,dispatchService: _this.dispatchService
			});
			imageSource.addDocument(doc, opts.attName);
			
			// Go over all documents and look for viable attachments
			for(var i=0,e=docs.length; i<e; ++i){
				var refDoc = docs[i];
				var atts = documentSource.getDocumentAttachments(refDoc);
				for(var j=0,k=atts.length; j<k; ++j){
					var att = atts[j];
					if( 'image' === att.getFileClass() 
					 && 'attached' === att.getStatus()
					 && att.isSource() ){
						var refAttName = att.getName();
						imageSource.addDocument(refDoc, refAttName);
					};
				};
			};
			
			opts.onSuccess(imageSource, doc);
		};
	}
});

// =========================================================================

$n2.couchDisplayBox = {
	DisplayImageSourceFactory: DisplayImageSourceFactory
};	
	
})(jQuery,nunaliit2);
