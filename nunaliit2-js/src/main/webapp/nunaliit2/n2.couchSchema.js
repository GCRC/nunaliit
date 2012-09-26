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

$Id: n2.couchSchema.js 8404 2012-07-30 19:34:41Z jpfiset $
*/

// @ requires n2.utils.js

;(function($,$n2){

var defaultOptions = {
	db: null
	,designDoc: null
	,viewNameSchemas: 'schemas'
	,viewNameRootSchemas: 'schemas-root'
};

var options = defaultOptions;

$n2.schema.DefaultRepository.loadSchemasFn = function(opt_) {
	var opt = $n2.extend({
		names: null
		,rootSchemas: false
		,onSuccess: function(schemaDefinitions){}
		,onError: function(err){ $n2.reportError(err); }
	},opt_);
	
	var viewRequest = {
		viewName: options.viewNameSchemas
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
		viewRequest.viewName = options.viewNameRootSchemas;
	};
	
	// Query view
	options.designDoc.queryView(viewRequest);
};	
	
$n2.schema.CouchSchemaConfigure = function(options_){
	options = $n2.extend({},defaultOptions,options_);
};

$n2.schema.CouchPreload = function(options_){
	var opts = $n2.extend({
		onSuccess: function(){}
		,onError: function(){}
	},defaultOptions,options,options_);

	opts.designDoc.queryView({
		viewName: opts.viewNameSchemas
		,include_docs: true
		,onSuccess: function(rows){
			var defs = [];
			for(var i=0,e=rows.length; i<e; ++i) {
				defs.push(rows[i].doc);
			};
			$n2.schema.DefaultRepository.addSchemas({
				schemas: defs
				,onSuccess: function(){
					opts.onSuccess(defs);
				}
				,onError: opts.onError
			});
			$n2.schema.DefaultRepository.rootSchemasQueried = true;
		}
		,onError: opts.onError
	});
};

})(jQuery,nunaliit2);