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


// *******************************************************
var CouchDataSource = $n2.Class($n2.document.DataSource, {
	
	db: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			id: null
			,db: null
		},opts_);
		
		$n2.document.DataSource.prototype.initialize.call(this,opts);

		this.db = opts.db;
	}

	,createDocument: function(opts_){
		var opts = $.extend(true, {
				doc: {}
				,onSuccess: function(doc){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		this.db.createDocument({
			data: opts.doc
			,onSuccess: function(docInfo){
				doc._id = docInfo.id;
				doc._rev = docInfo.rev;
				doc.__n2Source = this;
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,getDocument: function(opts_){
		var opts = $.extend(true, {
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

	,saveDocument: function(opts_){
		var opts = $.extend(true, {
				doc: null
				,onSuccess: function(doc){}
				,onError: function(errorMsg){}
			}
			,options_
		);
		
		var copy = {};
		for(var key in opts.doc){
			if( key === '__n2Source' ){
				// Do not copy
			} else {
				copy[key] = opts.doc[key];
			};
		};
		
		this.db.updateDocument({
			data: opts.doc
			,onSuccess: function(docInfo){
				doc._rev = docInfo.rev;
				opts.onSuccess(doc);
			}
			,onError: opts.onError
		});
	}

	,deleteDocument: function(opts_){
		var opts = $.extend(true, {
				doc: null
				,onSuccess: function(){}
				,onError: function(errorMsg){ $n2.reportErrorForced(errorMsg); }
			}
			,options_
		);
		
		this.db.deleteDocument({
			data: opts.doc
			,onSuccess: function(docInfo){
				opts.onSuccess();
			}
			,onError: opts.onError
		});
	}
});

//*******************************************************
$n2.couchDocument = {
	CouchDataSource: CouchDataSource
};

})(jQuery,nunaliit2);
