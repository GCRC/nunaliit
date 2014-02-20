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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var dataSourceFromId = {};

function getDataSourceFromId(id){
	return dataSourceFromId[id];
};

// *******************************************************
var DataSource = $n2.Class({
	id: null
	
	,initialize: function(opts_){
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
	}

	,getId: function(){
		return this.id;
	}


	,createDocument: function(opts_){
		var opts = $n2.extend({
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);

		opts.onError('Data source does not support the "createDocument" call.');
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
		
		opts.onError('Data source does not support the "getDocument" call.');
	}

	,verifyDocumentExistence: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(info){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "verifyDocumentExistence" call.');
	}

	,updateDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "updateDocument" call.');
	}

	,deleteDocument: function(opts_){
		var opts = $n2.extend({
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "deleteDocument" call.');
	}

	,getLayerDefinitions: function(opts_){
		var opts = $n2.extend({
				onSuccess: function(layerDefinitions){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getLayerDefinitions" call.');
	}

	,getDocumentInfoFromIds: function(opts_){
		var opts = $n2.extend({
				docIds: null
				,onSuccess: function(docInfos){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getDocumentInfoFromIds" call.');
	}

	,getReferencesFromId: function(opts_){
		var opts = $n2.extend({
				docId: null
				,onSuccess: function(referenceIds){}
				,onError: function(errorMsg){}
			}
			,opts_
		);
		
		opts.onError('Data source does not support the "getReferencesFromId" call.');
	}

	,getDocumentsFromGeographicFilter: function(opts_){
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
	}

	,getGeographicBoundingBox: function(opts_){
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

var DocumentWrapper = $n2.Class({
	
	doc: null
	
	,initialize: function(doc){
		this.doc = doc;
	}

	,getDataSource: function(){
		var source = null;
		if( this.doc ){
			source = this.doc.__n2Source;
		};
		return source;
	}
});

//*******************************************************
$n2.document = {
	DataSource: DataSource
	,DocumentWrapper: DocumentWrapper
	,getDataSourceFromId: getDataSourceFromId
};

})(jQuery,nunaliit2);
