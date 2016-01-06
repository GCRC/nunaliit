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

var CouchSchemaRepository = $n2.Class($n2.schema.SchemaRepository,{
	
	couchOptions: null
	
	,initialize: function(opts_){
		$n2.schema.SchemaRepository.prototype.initialize.apply(this);
		
		this.couchOptions = $n2.extend({
			db: null
			,designDoc: null
			,viewNameSchemas: 'schemas'
			,viewNameRootSchemas: 'schemas-root'
			,dispatchService: null
			,preload: false
			,preloadedCallback: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		this.loadSchemasFn = function(o){
			_this._loadSchemas(o);
		};

		var dispatcher = this._getDispatcher();
		if( dispatcher ){
			var dispatcherHandle = dispatcher.getHandle('n2.couchSchema');
			
			var f = function(m){
				_this._handle(m);
			};
			
			dispatcher.register(dispatcherHandle, 'documentContentCreated', f);
			dispatcher.register(dispatcherHandle, 'documentContentUpdated', f);
		};
		
		if( this.couchOptions.preload ){
			this._preload();
		};
	}
	
	,_loadSchemas: function(opt_){
		var opt = $n2.extend({
			names: null
			,rootSchemas: false
			,onSuccess: function(schemaDefinitions){}
			,onError: function(err){ $n2.reportError(err); }
		},opt_);
		
		var viewRequest = {
			viewName: this.couchOptions.viewNameSchemas
			,include_docs: true
			,onSuccess: function(rows){
				var defs = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					defs.push(rows[i].doc);
				};
				opt.onSuccess(defs);
			}
			,onError: opt.onError
		};
		
		if( opt.names ) {
			viewRequest.keys = opt.names;
		};
		
		if( opt.rootSchemas ) {
			viewRequest.viewName = this.couchOptions.viewNameRootSchemas;
		};
		
		// Query view
		this.couchOptions.designDoc.queryView(viewRequest);
	}
	
	,_handle: function(m){
		if( 'documentContentCreated' === m.type
		 || 'documentContentUpdated' === m.type ) {
			var doc = m.doc;
			
			if( doc.nunaliit_type === 'schema' ) {
				this.addSchemas({
					schemas: [doc]
					,onError: function(err){
						$n2.log('Error adding created/updated schema ('+doc._id+') to repository: '+err);
					}
				});
			};
		};
	}
	
	,_getDispatcher: function(){
		return this.couchOptions.dispatchService;
	}

	,_preload: function(){

		var _this = this;
		
		this.couchOptions.designDoc.queryView({
			viewName: this.couchOptions.viewNameSchemas
			,include_docs: true
			,onSuccess: function(rows){
				var defs = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					defs.push(rows[i].doc);
				};
				_this.addSchemas({
					schemas: defs
				});
				_this.rootSchemasQueried = true;
				_this.couchOptions.preloadedCallback();
			}
			,onError: function(err){
				_this.couchOptions.onError( _loc('Unable to preload schemas: {err}',{err:err}) );
			}
		});
	}
});


//============================================================
// Exports
$n2.couchSchema = {
	CouchSchemaRepository: CouchSchemaRepository
};

})(jQuery,nunaliit2);