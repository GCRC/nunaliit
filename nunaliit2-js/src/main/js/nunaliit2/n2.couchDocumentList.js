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
"use strict";

// Localization
var 
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
	,DH = 'n2.couchDocumentList'
	;

//*******************************************************
var DocumentListService = $n2.Class({
	
	atlasDesign: null,
	
	dispatchService: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.atlasDesign = opts.atlasDesign;
		this.dispatchService = opts.dispatchService;
		
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'documentListQuery', fn);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'documentListQuery' === m.type ){
			if( 'layer' === m.listType ){
				this._handleLayerQuery(m);
			};
		};
	},
	
	_handleLayerQuery: function(m){
		var _this = this;
		
		var keys = [];
		if( m.listName ){
			keys = m.listName.split(',');
			for(var i=0,e=keys.length; i<e; ++i){
				keys[i] = $n2.trim( keys[i] );
			};
		};
		
		if( this.dispatchService 
		 && this.atlasDesign 
		 && keys.length > 0 ){
			this.atlasDesign.queryView({
				viewName: 'layers'
				,keys: keys
				,include_docs: true
				,onSuccess: function(rows){
					var docIds = [];
					var docs = [];
					for(var i=0,e=rows.length; i<e; ++i){
						docIds.push( rows[i].id );
						docs.push( rows[i].doc );
					};
					_this.dispatchService.send(DH,{
						type: 'documentListResults'
						,listType: m.listType
						,listName: m.listName
						,docIds: docIds
						,docs: docs
					});
				}
				,onError: function(err){
					$n2.log('Unable to retrieve document list ('+m.listType+'/'+m.listName+')',err);
				}
			});
		};
	}
});

//*******************************************************
$n2.couchDocumentList = {
	DocumentListService: DocumentListService
};

})(jQuery,nunaliit2);
