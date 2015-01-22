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

$Id: n2.schema.js 8461 2012-08-29 18:54:28Z jpfiset $
*/

// @requires n2.core.js
// @requires n2.utils.js
// @requires n2.class.js

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };


var defaultErrorFn = function(err){ $n2.reportError(err); };
var defaultSuccessFn = function(){};

var typeClassStringPrefix = 'n2schema_type_';

var HTML = ':html';
var INPUT = ':input';
var FIELD = ':field';
var ITERATE = ':iterate';
var EMPTY = ':empty';
var CONTEXT = ':context';
var PARENT = ':parent';
var SELECT = ':selector';
var LOCALIZE = ':localize';
var ARRAY = ':array';

//============================================================
// Object

function getDataFromObjectSelector(o, selectors) {
	if( typeof(selectors) === 'string' ) {
		selectors = selectors.split('.');
	}
	return findDataFromObject(o, selectors, 0);
};

function findDataFromObject(o, selectors, selectorIndex) {
	if( selectorIndex >= selectors.length ) {
		return o;
	};
	
	// This is an error. There are more
	// selectors in the array but we have
	// a scalar. Return an error.
	if( null == o
	 || typeof(o) === 'number' 
	 || typeof(o) === 'string'
	 || typeof(o) === 'undefined'
	 || typeof(o) === 'function' ) {
		return null;
	};
	
	if( $n2.isArray(o) ) {
		var index = 1 * selectors[selectorIndex];
		if( index >= o.length ) {
			return null;
		};
		return findDataFromObject(o[index], selectors, (selectorIndex+1));
	}

	if( typeof(o) === 'object' ) {
		var key = selectors[selectorIndex];
		var value = o[key];
		if( value === undefined ) {
			return null;
		};
		return findDataFromObject(value, selectors, (selectorIndex+1));
	};
	
	// Should not get here. Error. Return null.
	return null;
};

//============================================================
// Context

function _localizeString() {
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();

	// Gets the text between start and end tags
	var text = options.fn(this);

	// Syntax is: <selector>(,<option>)*
	var splits = text.split(',');
	var key = splits[0];

	// <option> is one of:
	// - optionName
	// - optionName=optionValue
	// - optionsName=value1+value2+...
	var opts = {};
	for(var i=1,e=splits.length;i<e;++i){
		var optStr = splits[i];
		var optSplit = optStr.split('=');
		if( optSplit.length > 1 ){
			var valSplits = optSplit[1].split('+');
			if( valSplits.length > 1 ) {
				opts[optSplit[0]]=valSplits;
			} else {
				opts[optSplit[0]]=[optSplit[1]];
			};
		} else {
			opts[optSplit[0]]=[];
		};
	};
	
	// Get data from key
	if( '.' === key ) {
		var s = this;
	} else {
		s = getDataFromObjectSelector(this, key);
	};

	if( s
	 && typeof(s) === 'object' 
	 && s.nunaliit_type === 'localized') {
		var lang = 'en';
		if( $n2.l10n && $n2.l10n.getLocale ){
			lang = $n2.l10n.getLocale().lang;
		};
		
		if( s[lang] ) {
			if( opts.html ) {
				return s[lang];
			};
			
			var escaped = $n2.utils.escapeHtml(s[lang]);
			return escaped;
			
		} else {
			// Find a language to fall back on
			var fbLang = 'en';
			if( !s[fbLang] ) {
				fbLang = null;
				for(var l in s){
					if( l.length > 0 && l[0] === ':' ){
						// ignore
					} else if( l === 'nunaliit_type' ) {
						// ignore
					} else if( s[l] ) { // ignore empty string
						fbLang = l;
						break;
					};
				};
			};
			
			if( fbLang ){
				var result = [];
				result.push('<span class="n2_localized_string n2_localize_fallback">');
				result.push('<span class="n2_localize_fallback_lang">(');
				result.push(fbLang);
				result.push(')</span>');
				if( s[fbLang] ){
					if( opts.html ) {
						result.push(''+s[fbLang]);
					} else {
						var escaped = $n2.utils.escapeHtml(s[fbLang]);
						result.push(escaped);
					};
				};
				result.push('</span>');
				return result.join('');
				
			} else {
				return '';
			};
		};
		
	} else if( typeof(s) === 'undefined' ) {
		return '';

	} else if( s === null ) {
		return '';
		
	} else {
		// Must be string, number, boolean, float, ...
		// From Handlebars, we do not get a real "string". Instead,
		// "this" is an object that reacts like string. ''+s becomes
		// a real javascript string.
		if( opts.html ) {
			return ''+s;
		};
		
		var escaped = $n2.utils.escapeHtml(''+s);
		return escaped;
		
	};
};

function _formSingleField(r,obj,sels,options){
	
	// option: textarea
	if( options.textarea ){
		r.push('<textarea class="');
	} else if( options.checkbox ){
		r.push('<input type="checkbox" class="');
	} else {
		r.push('<input type="text" class="');
	};
	
	r.push('n2schema_input');
	
	var selector = obj[SELECT];
	if( selector ) {
		var completeSelector = selector.slice(0);
		completeSelector.push.apply(completeSelector,sels);
		var selClass = createClassStringFromSelector(completeSelector);

		r.push(' '+selClass);
	};
	
	if( options.date ){
		r.push(' ' + typeClassStringPrefix + 'date');
		
	} else if( options.numeric ){
		r.push(' ' + typeClassStringPrefix + 'numeric');
		
	} else if( options.layers ){
		r.push(' ' + typeClassStringPrefix + 'layers');
		
	} else if( options.localized ){
		r.push(' ' + typeClassStringPrefix + 'localized');
	};

	if( options.textarea ){
		r.push('"></textarea>');
	} else if( options.checkbox ){
		r.push('"/>');
	} else {
		r.push('"/>');
	};

	if( options.date ){
		r.push('<div class="n2schema_help_date"></div>');
	};
};

function _formField() {
	// The arguments to handlebars block expression functions are:
	// ([obj,]options)
	// obj is not provided in this case, since we do not expect any arguments
	// to {{:field}}
	// The options hash contains a "fn" attribute, which is a function to
	// render inner content.
	// this points to the current object
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();
	
	// Gets the text between start and end tags
	var text = options.fn(this);

	// Syntax is: <selector>(,<option>)*
	var obj,sels;
	var splits = text.split(',');
	var identifier = splits[0];
	if( '.' === identifier ){
		obj = this;
		sels = [];
	} else {
		sels = identifier.split('.');
		obj = getDataFromObjectSelector(this, sels);
	};
	
	if( obj
	 && typeof obj === 'object'
	 && !obj[SELECT]
	 && options
	 && options.data
	 && options.data.n2_selector
	 ){
		obj[SELECT] = options.data.n2_selector;
	};
	
	// <option> is one of:
	// - optionName
	// - optionName=optionValue
	// - optionsName=value1+value2+...
	var opts = {};
	for(var i=1,e=splits.length;i<e;++i){
		var optStr = splits[i];
		var optSplit = optStr.split('=');
		if( optSplit.length > 1 ){
			var valSplits = optSplit[1].split('+');
			if( valSplits.length > 1 ) {
				opts[optSplit[0]]=valSplits;
			} else {
				opts[optSplit[0]]=[optSplit[1]];
			};
		} else {
			opts[optSplit[0]]=[];
		};
	};
	
	var r = [];
	
	r.push('<div class="n2schema_field_wrapper">');

	if( obj && obj.nunaliit_type === 'localized' ) {
		var langs = [];
		for(var lang in obj){
			if( lang === 'nunaliit_type' || lang[0] === ':' ){
				// ignore
			} else if( $.inArray(lang,langs) < 0 ) {
				langs.push(lang);
			};
		};
		if( opts.localized && opts.localized.length ){
			for(var i=0,e=opts.localized.length;i<e;++i){
				var lang = opts.localized[i];
				if( $.inArray(lang,langs) < 0 ) {
					langs.push(lang);
				};
			};
		};
		langs.sort();
		
		// Turn on "localized" option, if not already on
		if( !opts.localized ){
			opts.localized = [];
		};
		
		for(var i=0,e=langs.length;i<e;++i){
			var lang = langs[i];
			r.push('<div class="n2schema_field_container n2schema_field_container_localized">');
			r.push('<span class="n2_localize_lang">('+lang+')</span>');
			_formSingleField(r,obj,[lang],opts);
			r.push('</div>');
		};
		
	} else if( !obj && opts.localized ) {
		// This is a localized string that does not yet exist

		var langs = opts.localized.slice();//copy
		langs.sort();
		
		for(var i=0,e=langs.length;i<e;++i){
			var lang = langs[i];
			
			var langSel = sels.slice();//copy
			langSel.push(lang);
			
			r.push('<div class="n2schema_field_container n2schema_field_container_localized">');
			r.push('<span class="n2_localize_lang">('+lang+')</span>');
			_formSingleField(r,this,langSel,opts);
			r.push('</div>');
		};

	} else if( opts.reference ) {
		var fullSelector = this[SELECT].slice(0); // clone
		fullSelector.push.apply(fullSelector,sels); // append selectors in tag
		var objSel = new $n2.objectSelector.ObjectSelector(fullSelector);
		var attr = objSel.encodeForDomAttribute();
		r.push('<span class="n2schema_field_reference" n2-obj-sel="'+attr+'"></span>');
		
	} else {
		r.push('<div class="n2schema_field_container">');
		_formSingleField(r,this,sels,opts);
		r.push('</div>');
	};

	r.push('</div>');
	
	return r.join('');
};

function _inputField() {
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();
	
	var text = options.fn(this);

	// Syntax is: <selector>(,<type>)?
	var splits = text.split(',');
	var key = splits[0];
	
	var completeSelectors = null;
	if( options
	 && options.data
	 && options.data.n2_selector ){
		completeSelectors = options.data.n2_selector.slice(0);
	} else if( this[SELECT] ) {
		completeSelectors = this[SELECT].slice(0);
	} else {
		return '';
	};
	if( '.' === key ) {
		// Current selector is fine
	} else {
		var sels = key.split('.');
		completeSelectors.push.apply(completeSelectors,sels);
	};	
	
	var cl = 'n2schema_input ' + createClassStringFromSelector(completeSelectors);

	var type = '';
	if( splits[1] ) {
		type = ' n2schema_type_'+splits[1];
	};
	
	return cl + type;
};

function _arrayField() {
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();
	
	var obj = args[0];
	
	var newType = null;
	if( args.length > 1 ){
		newType = args[1];
	};
	
	var r = [];
	
	r.push('<div class="n2schema_array">');

	if( obj && obj.length ) {
		for(var i=0,e=obj.length; i<e; ++i){
			var item = obj[i];
	
			var completeSelectors = obj[SELECT].slice(0);
			completeSelectors.push(i);
			var cl = createClassStringFromSelector(completeSelectors);
			
			r.push('<div class="n2schema_array_item">');
	
			r.push('<div class="n2schema_array_item_delete '+cl+'"></div>');
			r.push('<div class="n2schema_array_item_down '+cl+'"></div>');
	
			r.push('<div class="n2schema_array_item_wrapper">');
	
			r.push( options.fn(item,{data:{n2_selector:completeSelectors}}) );
			
			r.push('</div></div>');
		};
	};

	if( obj ){
		var arraySelector = obj[SELECT]
		var arrayClass = createClassStringFromSelector(arraySelector);
		r.push('<div class="n2schema_array_add '+arrayClass+'"');
		if( newType ) {
			r.push('n2_array_new_type="'+newType+'"');
		};
		r.push('></div>');
	};
	
	r.push('</div>');
	
	return r.join('');
};


if( typeof(Handlebars) !== 'undefined' 
 && Handlebars.registerHelper ) {
	Handlebars.registerHelper(LOCALIZE ,_localizeString );
	Handlebars.registerHelper(FIELD    ,_formField      );
	Handlebars.registerHelper(INPUT    ,_inputField     );
	Handlebars.registerHelper(ARRAY    ,_arrayField     );
} else {
	$n2.log('Unable to register helper functions with Handlebars. Schemas will not work properly.');
};

//============================================================
// Object Query

var ObjectQueryResults = $n2.Class({
	
	objects: null
	
	,length: 0
	
	,initialize: function(obj) {
		
		if( null === obj ) {
			this.objects = [];
		} else if( typeof(obj) === 'undefined' ) {
			this.objects = [];
		} else if( $n2.isArray(obj) ) {
			this.objects = obj;
		} else if( typeof(obj) === 'object' ) {
			this.objects = [obj];
		} else {
			this.objects = [];
		};
		this.length = this.objects.length;
	}

	,query: function(selectors) {
		if( null === selectors ) {
			var interim = this._selectInterim(null, this.objects);
			return new ObjectQueryResults(interim);
			
		} else if( typeof(selectors) === 'string' ) {
			var interim = this._selectInterim(selectors, this.objects);
			return new ObjectQueryResults(interim);
			
		} else if( typeof(selectors) === 'undefined' ) {
			return ObjectQueryResultsEmpty;

		} else if( $n2.isArray(selectors) ) {
			var interim = this.objects;
			for(var i=0,e=selectors.length; i<e; ++i){
				var sel = selectors[i];
				interim = this._selectInterim(sel, interim);
			};
			return new ObjectQueryResults(interim);
		
		} else {
			return ObjectQueryResultsEmpty;
		}
	}
	
	,each: function(f) {
		for(var i=0,e=this.objects.length; i<e; ++i) {
			var obj = this.objects[i];
			f(obj, i);
		};
	}
	
	,_selectInterim: function(sel, arr) {
		var result = [];
		for(var i=0,e=arr.length; i<e; ++i) {
			this._selectFromObject(arr[i], sel, result);
		};
		return result;
	}
	
	,_selectFromObject: function(obj, sel, result) {
		if( null === sel ) {
			// matches any
			for(var key in obj) {
				var value = obj[key];
				result.push(value);
			};
		} else if( 'string' === typeof(sel) ) {
			if( typeof(obj[sel]) !== 'undefined' ) {
				result.push(obj[sel]);
			};
		} else if( 'function' === typeof(sel) ) {
			for(var key in obj) {
				if( sel(obj, key) ) {
					result.push(obj[key]);
				};
			};
		};
	}
});

var ObjectQueryResultsEmpty = new ObjectQueryResults();

$n2.ObjectQuery = function(obj, query){
	
	var result = new ObjectQueryResults(obj);
	return result.query(query);
}


//============================================================
// Schema Repository Functions

var SchemaRepositoryFunctions = $n2.Class({
	
	onCreateFns: null
	
	,initialize: function(){
		this.onCreateFns = [];
	}

	,addOnDocumentCreateFunction: function(fn){
		if( typeof(fn) === 'function' ){
			this.onCreateFns.push(fn);
		};
	}
	
	,onDocumentCreate: function(doc, schema){
		for(var i=0,e=this.onCreateFns.length;i<e;++i){
			var f = this.onCreateFns[i];
			f(doc, schema);
		};
	}
});

//============================================================
// Schema Repository

var SchemaRepository = $n2.Class({
	
	schemasByName: null
	
	,loadSchemasFn: null
	
	,rootSchemasQueried: false
	
	,repositoryFunctions: null
	
	,initialize: function() {
		this.schemasByName = {};
		this.repositoryFunctions = new SchemaRepositoryFunctions();
	}

	,addSchemas: function(opt_) {
		
		var opt = $n2.extend({
			schemas: null
			,onSuccess: defaultSuccessFn
			,onError: defaultErrorFn
		},opt_);
		
		var schemas = opt.schemas;
		if( ! $n2.isArray(schemas) ) {
			schemas = [ schemas ];
		};
		
		for(var i=0,e=schemas.length; i<e; ++i) {
			var schema = schemas[i];
			
			if( schema.isSchema ) {
				var schemaObj = schema;
				schemaObj.repositoryFunctions = this.repositoryFunctions;
			} else {
				var schemaObj = new Schema(this, schema);
			};
			
			var name = schemaObj.name;
			this.schemasByName[name] = schemaObj;
		};
		
		this._resolveSchemaDependencies(opt);
	}

	,getSchema: function(opt_) {
		
		var _this = this;
		
		var opt = $n2.extend({
			name: null
			,onSuccess: defaultSuccessFn
			,onError: defaultErrorFn
		},opt_);
		
		if( this.schemasByName[opt.name] ) {
			if( this.schemasByName[opt.name]._error ) {
				opt.onError( 'Schema "'+opt.name+'" not found' );
			} else {
				opt.onSuccess( this.schemasByName[opt.name] );
			};
			return;
		};
		
		if( this.loadSchemasFn ) {
			this._loadSchemaDefinitions({
				names: [ opt.name ]
				,onSuccess: function(){
					if( _this.schemasByName[opt.name]._error ){
						opt.onError( 'Schema "'+opt.name+'" not found' );
					} else {
						opt.onSuccess( _this.schemasByName[opt.name] );
					};
				}
				,onError: opt.onError
			});
			return;
		};
		
		opt.onError('Can not find schema named: '+opt.name);
	}

	,getSchemas: function(opt_) {
		
		var _this = this;
		
		var opt = $n2.extend({
			names: null
			,onSuccess: defaultSuccessFn
			,onError: defaultErrorFn
		},opt_);
		
		var resultSchemas = [];
		var namesToQuery = null;
		
		// Collect schemas already cached
		for(var i=0,e=opt.names.length; i<e; ++i){
			var n = opt.names[i]; // name
			var s = this.schemasByName[n]; // schema
			if( s && s._error ) {
				// skip
			} else if( s ) {
				resultSchemas[resultSchemas.length] = s;
			} else {
				if( null === namesToQuery ) namesToQuery = [];
				namesToQuery[namesToQuery.length] = n;
			};
		};
		
		// If all in cache, just return
		if( null === namesToQuery ) {
			opt.onSuccess( resultSchemas );
			return;
		};
		
		if( this.loadSchemasFn ) {
			this._loadSchemaDefinitions({
				names: namesToQuery
				,onSuccess: function(){
					for(var i=0,e=namesToQuery.length; i<e; ++i){
						var s = _this.schemasByName[namesToQuery[i]]; // schema
						if( s && !s._error ) {
							resultSchemas[resultSchemas.length] = s;
						};
					};
					opt.onSuccess( resultSchemas );
				}
				,onError: opt.onError
			});
			return;
		};
		
		opt.onError('Can not find requested schemas: '+namesToQuery);
	}

	,getRootSchemas: function(opt_) {
		
		var opt = $n2.extend({
			onSuccess: defaultSuccessFn
			,onError: defaultErrorFn
		},opt_);
		
		var _this = this;
		
		if( !this.rootSchemasQueried 
		 && this.loadSchemasFn ) {
			var _this = this;
			this._loadSchemaDefinitions({
				rootSchemas: true
				,onSuccess: function(){
					_this.rootSchemasQueried = true;
					_this.getRootSchemas(opt_);
				}
				,onError: opt.onError
			});
			return;
		};
		
		var schemas = [];
		for(var name in this.schemasByName) {
			var schema = this.schemasByName[name];
			if( schema._error ) {
				// skip
			} else if( schema.isRootSchema ) {
				schemas.push(schema);
			};
		};
		
		opt.onSuccess( schemas );
	}
	
	// Forgets all schemas loaded, so far
	,reset: function(){
		this.schemasByName = {};
		this.rootSchemasQueried = false;
	}
	
	,getRepositoryFunctions: function(){
		return this.repositoryFunctions;
	}

	,_loadSchemaDefinitions: function(opt) {

		var _this = this;
		
		var loadingOpt = {
			names: opt.names
			,onSuccess: loaded
			,onError: opt.onError
		};
		
		this.loadSchemasFn(loadingOpt);

		function loaded(schemaDefinitions) {
			if( opt.names ) {
				// Verify that all names are returned
				for(var i=0,e=opt.names.length; i<e; ++i) {
					var name = opt.names[i];
					var def = findSchemaDefinition(name, schemaDefinitions);
					if( !def ) {
						// Insert dummy one, if not found
						schemaDefinitions.push({
							name: name
							,isRootSchema: false
							,display: ''
							,form: ''
							,brief: ''
							,create: {}
							,extensions: []
							,nunaliit_type: 'schema'
							,_error: true
						});
						$n2.log('schema definition not found: '+name);
					};
				};
			};
			
			_this.addSchemas({
				schemas: schemaDefinitions
				,onSuccess: opt.onSuccess
				,onError: opt.onError
			});
		};
		
		function findSchemaDefinition(name, definitions) {
			for(var i=0,e=definitions.length; i<e; ++i){
				var def = definitions[i];
				if( def.name === name ) {
					return def;
				};
			};
			return null;
		};
	}
	
	,_resolveSchemaDependencies: function(opt_) {
		var _this = this;
		
		var missingSchemas = {};
		var currentSchemas = this.schemasByName;
		
		for(var name in this.schemasByName) {
			var schema = this.schemasByName[name];
			schema._resolveSchemaDependencies(currentSchemas, missingSchemas);
		};
		
		var missingSchemasArr = [];
		for(var missingSchemaName in missingSchemas) {
			missingSchemasArr.push(missingSchemaName);
		};

		if( missingSchemasArr.length < 1 ) {
			// all dependencies met
			opt_.onSuccess();
			return;
		};
		
		if( missingSchemasArr.length > 0
		 && !this.loadSchemasFn 
		 ) {
			// missing dependencies, but no way to fetch more
			opt_.onError('Can not find missing dependencies');
			return;
		};
		
		this._loadSchemaDefinitions({
			names: missingSchemasArr
			,onSuccess: opt_.onSuccess
			,onError: opt_.onError
		});
	}
	
	,_getSchemaMap: function() {
		return this.schemasByName;
	}
});

//============================================================
// Schema Extension

var SchemaExtension = $n2.Class({
	
	selector: null
	
	,create: null
	
	,schemaName: null
	
	,dependentSchema: null
	
	,initialize: function(jsonDefinition) {
		
		this.selector = jsonDefinition.selector;
		this.schemaName = jsonDefinition.schemaName;
		
		this.create = false;
		if( typeof(jsonDefinition.create) === 'boolean' ) {
			this.create = jsonDefinition.create;
		};
	}

	,createObject: function(obj, defValues) {

		// Compute default values for this extension
		var targetDefValues = defValues;
		for(var i=0,e=this.selector.length-1; i<e; ++i) {
			var keyName = this.selector[i];
			if( targetDefValues ) {
				targetDefValues = targetDefValues[keyName];
			};
		};
		var keyName = this.selector[i];
		if( targetDefValues ) {
			targetDefValues = targetDefValues[keyName];
		};

		// Verify if it is necessary to create this
		// extension
		if( !this.create 
		 && !targetDefValues ) {
//$n2.log('Skip',this,targetDefValues);
			return;
		};

		// Create objects to follow selectors, if needed
		var targetObj = obj;
		for(var i=0,e=this.selector.length-1; i<e; ++i) {
			var keyName = this.selector[i];
			
			if( targetObj[keyName] ) {
				targetObj = targetObj[keyName];
			} else {
				targetObj[keyName] = {};
				targetObj = targetObj[keyName];
			};
		};
		var keyName = this.selector[i];

		// Add value
		targetObj[keyName] = this.dependentSchema.createObject(targetDefValues);
	}

	,_resolveSchemaDependencies: function(currentSchemas, missingSchemas) {
		if( ! this.dependentSchema 
		 && this.schemaName
		 ) {
			if( currentSchemas[this.schemaName] ) {
				this.dependentSchema = currentSchemas[this.schemaName];
			} else {
				missingSchemas[this.schemaName] = 1;
			};
		}
	}
});

//============================================================
// Schema

var Schema = $n2.Class({
	
	isSchema: null
	
	,isRootSchema: false
	
	,name: null
	
	,repositoryFunctions: null
	
	,displayTemplate: null
	
	,briefTemplate: null
	
	,popupTemplate: null
	
	,formTemplate: null
	
	,relatedSchemaNames: null
	
	,extensions: null
	
	,extensionsByName: null
	
	,cachedDisplay: null
	
	,cachedBrief: null
	
	,cachedPopup: null
	
	,csvExport: null
	
	,label: null

	,options: null
	
	,_error: null
	
	,initialize: function(repository, jsonDefinition) {
		
		this.repositoryFunctions = repository.getRepositoryFunctions();
			
		this.name = jsonDefinition.name;
		this.displayTemplate = jsonDefinition.display;
		this.briefTemplate = jsonDefinition.brief;
		this.popupTemplate = jsonDefinition.popup;
		this.formTemplate = jsonDefinition.form;
		this.create = jsonDefinition.create;
		this.csvExport = jsonDefinition.csvExport;
		this.label = jsonDefinition.label;
		this.options = jsonDefinition.options;
		
		if( jsonDefinition.isRootSchema ) {
			this.isRootSchema = true;
		};

		if( jsonDefinition._error ) {
			this._error = true;
		};

		this.relatedSchemaNames = jsonDefinition.relatedSchemas;
		if( !this.relatedSchemaNames ) {
			this.relatedSchemaNames = [];
		};
		
		this.extensions = [];
		this.extensionsByName = {};
		if( jsonDefinition.extensions ) {
			if( $n2.isArray(jsonDefinition.extensions) ) {
				for(var i=0,e=jsonDefinition.extensions.length; i<e; ++i) {
					var attr = new SchemaExtension(jsonDefinition.extensions[i]);
					this.extensions.push( attr );
					this.extensionsByName[attr.schemaName] = attr;
				};
			} else {
				for(var key in jsonDefinition.extensions) {
					var attr = new SchemaExtension(jsonDefinition.extensions[key]);
					this.extensions.push( attr );
					this.extensionsByName[attr.schemaName] = attr;
				};
			};
		};
		
		this.isSchema = true;
	}

	,getLabel: function(){
		if( this.label ) {
			return _loc(this.label);
		};
		return this.name;
	}

	,createObject: function(defValues) {
		var result = {};
		
		// Start with default object, if provided
		if( this.create ) {
			$n2.extend(true, result, this.create);
		};
		
		// Add all elements not covered by extensions
		if( defValues ) {
			for(var name in defValues) {
				if( !this.extensionsByName[name] ) {
					// This is not covered by an extension, copy
					result[name] = defValues[name];
				};
			};
		};

		// Go over extensions
		for(var i=0,e=this.extensions.length; i<e; ++i) {
			var attr = this.extensions[i];
			attr.createObject(result,defValues);
		};
		
		this.repositoryFunctions.onDocumentCreate(result,this);
		
		return result;
	}
	
	,display: function(obj, $elem, ctxt_) {
		if( !this.displayTemplate ) return;
		
		if( !this.cachedDisplay ) {
			this.cachedDisplay = new Display(this,'displayTemplate');
		};
		
		this.cachedDisplay.display(obj, $elem, ctxt_);
	}
	
	,brief: function(obj, $elem, ctxt_) {
		if( !this.briefTemplate ) return;
		
		if( !this.cachedBrief ) {
			this.cachedBrief = new Display(this,'briefTemplate');
		};
		
		this.cachedBrief.display(obj, $elem, ctxt_);
	}
	
	,popup: function(obj, $elem, ctxt_) {
		if( !this.popupTemplate ) return;
		
		if( !this.cachedPopup ) {
			this.cachedPopup = new Display(this,'popupTemplate');
		};
		
		this.cachedPopup.display(obj, $elem, ctxt_);
	}
	
	,form: function(obj, $elem, ctxt_, callback, functionMap) {
		var form = new Form(this);
		form.form(obj, $elem, ctxt_, callback, functionMap);
		return form;
	}

	,_resolveSchemaDependencies: function(currentSchemas, missingSchemas) {
		for(var i=0,e=this.extensions.length; i<e; ++i) {
			var attr = this.extensions[i];
			attr._resolveSchemaDependencies(currentSchemas, missingSchemas);
		}
	}
});

//============================================================
// Display

function computeViewObj(origObj, context, parent) {
	
	if( null === origObj ) {
		return origObj;
		
	} else if( typeof(origObj) === 'undefined' ) {
		return null;
		
	} else if( $n2.isArray(origObj) ) {
		var view = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;
		
		for(var i=0,e=origObj.length; i<e; ++i) {
			var value = computeViewObj(origObj[i], context, view);
			view.push(value);
		};

		return view;
		
	} else if( typeof(origObj) === 'object' ) {
		var view = {};
		
		view[ITERATE] = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;

		for(var key in origObj) {
			if('__n2Source' === key) continue;
			
			var value = computeViewObj(origObj[key], context, view);
			view[key] = value;
			view[ITERATE].push({key:key,value:value});
		};
		view[EMPTY] = (0 == view[ITERATE].length);
		
		view[ITERATE].sort(function(a,b){
			if( a.key < b.key ) {
				return -1;
			}; 
			if( a.key > b.key ) {
				return 1;
			}; 
			return 0;
		});
		
		return view;
		
	} else {
		return origObj
	};
};

function DisplaySelectAny(obj, key) {
	if( EMPTY === key 
	 || ITERATE === key
	 || CONTEXT === key 
	 ) {
		return false;
	};
	return true;
};

var DisplayExtension = $n2.Class({
	
	schemaExtension: null
	
	,subDisplay: null
	
	,selector: null
	
	,initialize: function(schemaExtension, templateName) {
		this.schemaExtension = schemaExtension;
		this.templateName = templateName;

		var subSchema = this.schemaExtension.dependentSchema;
		this.subDisplay = new Display(subSchema, templateName);
		
		this.selector = [];
		for(var i=0,e=schemaExtension.selector.length; i<e; ++i) {
			var sel = schemaExtension.selector[i];
			if( null === sel ) {
				this.selector.push(DisplaySelectAny);
			} else {
				this.selector.push(sel);
			};
		};
	}

	,getName: function() {
		return this.schemaExtension.name;
	}

	,_setHtml: function(parentObj) {
		var subDisplay = this.subDisplay;
		$n2.ObjectQuery(parentObj, this.selector).each(function(obj){
			subDisplay._setHtml(obj);
		});
	}
	
});

var Display = $n2.Class({
	
	schema: null
	
	,templateName: null
	
	,extensions: null

	,initialize: function(schema, templateName) {
		this.schema = schema;
		this.templateName = templateName;
		if( !this.templateName ) {
			this.templateName = 'displayTemplate';
		};
		
		this.extensions = [];
		for(var i=0,e=schema.extensions.length; i<e; ++i) {
			var attr = new DisplayExtension(schema.extensions[i], this.templateName);
			this.extensions.push(attr);
		};
	}

	,display: function(obj, $elem, ctxt_) {
		
		var context = {
			root: obj
		};
		
		$n2.extend(context, ctxt_);

		// Create view for displayTemplate
		var view = computeViewObj(obj, context);
		this._setHtml(view);

		if( view[HTML] ) {
			$elem.html(view[HTML]);
		}
	}
	
	,_setHtml: function(obj) {
		if( null == obj ){
			return;
		};
		
		for(var i=0,e=this.extensions.length; i<e; ++i) {
			var attr = this.extensions[i];
			attr._setHtml(obj);
		};

		var compiledTemplate = this.schema[this.templateName + '__compiled'];
		if( !compiledTemplate ) {
			var displayTemplate = this.schema[this.templateName];
			if( displayTemplate ) {
				compiledTemplate = Handlebars.compile(displayTemplate);
				this.schema[this.templateName + '__compiled'] = compiledTemplate;
			};
		};
		if( compiledTemplate ) {
			obj[HTML] = compiledTemplate(obj);
		};
	}
});

//============================================================
// Form

var selectorClassStringPrefix = 'n2schema_selector';

function escapeSelector(sel) {
	var res = [];
	for(var i=0,e=sel.length; i<e; ++i) {
		var c = sel[i];
		if( c >= 'a' && c <= 'z' ) { res.push(c); }
		else if( c >= 'A' && c <= 'Z' ) { res.push(c); }
		else if( c >= '0' && c <= '9' ) { res.push(c); }
		else {
			var code = c.charCodeAt(0);
			var o0 = (code & 0x07) + 0x30;
			var o1 = ((code >> 3) & 0x07) + 0x30;
			var o2 = ((code >> 6) & 0x07) + 0x30;
			res.push('_');
			res.push( String.fromCharCode(o2) );
			res.push( String.fromCharCode(o1) );
			res.push( String.fromCharCode(o0) );
		};
	};
	return res.join('');
};

function unescapeSelector(sel) {
	var res = [];
	for(var i=0,e=sel.length; i<e; ++i) {
		var c = sel[i];
		if( c === '_' ) { 
			++i;
			var o2 = sel.charCodeAt(i);
			++i;
			var o1 = sel.charCodeAt(i);
			++i;
			var o0 = sel.charCodeAt(i);
			
			var b = ((o2-0x30)<<6)+((o1-0x30)<<3)+(o0-0x30);
			res.push(String.fromCharCode(b));
			
		} else {
			res.push(c);
		};
	};
	return res.join('');
};

function createClassStringFromSelector(selector, key) {
	var cs = [selectorClassStringPrefix];
	for(var i=0,e=selector.length; i<e; ++i) {
		cs.push('-');
		cs.push( escapeSelector(''+selector[i]) );
	};
	if( key ) {
		cs.push('-');
		cs.push( escapeSelector(key) );
	};
	return cs.join('');
};

// Given a class name, returns an array that represents the encoded selector.
// Returns null if the class name is not encoding a selector
function createSelectorFromClassString(classString) {
	if( selectorClassStringPrefix === classString.substr(0,selectorClassStringPrefix.length) ) {
		var selectorString = classString.substr(selectorClassStringPrefix.length+1);
		var selector = selectorString.split('-');
		
		var res = [];
		for(var i=0,e=selector.length; i<e; ++i) {
			res.push( unescapeSelector(selector[i]) );
		};
		
		return res;
	};
	
	return null;
};

function parseClassNames(classNames) {
	var parsed = {};
	
	for(var i=0,e=classNames.length; i<e; ++i) {
		var className = classNames[i];
		
		var selector = createSelectorFromClassString(className);
		if( selector ) {
			parsed.selector = selector;
		};
		
		if( typeClassStringPrefix === className.substr(0,typeClassStringPrefix.length) ) {
			var typeString = className.substr(typeClassStringPrefix.length);
			parsed.type = typeString;
		};
	};
	
	return parsed;
};

function computeFormObj(origObj, context, selector, parent) {
	
	if( null === origObj ) {
		return origObj;
		
	} else if( typeof(origObj) === 'undefined' ) {
		return null;
		
	} else if( $n2.isArray(origObj) ) {
		var view = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;
		view[SELECT] = selector.slice(0);
		
		for(var i=0,e=origObj.length; i<e; ++i) {
			selector.push(i);
			var value = computeFormObj(origObj[i], context, selector, view);
			view.push(value);
			selector.pop();
		};

		return view;
		
	} else if( typeof(origObj) === 'object' ) {
		var view = {};
		
		view[ITERATE] = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;
		view[SELECT] = selector.slice(0);

		for(var key in origObj) {
			if('__n2Source' === key) continue;

			selector.push(key);
			var value = computeFormObj(origObj[key], context, selector, view);
			view[key] = value;
			view[ITERATE].push({key:key,value:value});
			selector.pop();
		};
		view[EMPTY] = (0 == view[ITERATE].length);
		
		view[ITERATE].sort(function(a,b){
			if( a.key < b.key ) {
				return -1;
			}; 
			if( a.key > b.key ) {
				return 1;
			}; 
			return 0;
		});
		
		return view;
		
	} else {
		return origObj;
	};
};

var FormExtension = $n2.Class({
	
	schemaExtension: null
	
	,innerForm: null
	
	,selector: null
	,initialize: function(schemaExtension) {
		this.schemaExtension = schemaExtension;

		var subSchema = this.schemaExtension.dependentSchema;
		this.innerForm = new Form(subSchema);
		
		this.selector = [];
		for(var i=0,e=schemaExtension.selector.length; i<e; ++i) {
			var sel = schemaExtension.selector[i];
			if( null === sel ) {
				this.selector.push(DisplaySelectAny);
			} else {
				this.selector.push(sel);
			};
		};
	}

	,getName: function() {
		return this.schemaExtension.name;
	}

	,_setHtml: function(parentObj) {
		var innerForm = this.innerForm;
		$n2.ObjectQuery(parentObj, this.selector).each(function(obj){
			innerForm._setHtml(obj);
		});
	}
});

var Form = $n2.Class({
	
	schema: null
	
	,extensions: null
	
	,obj: null
	
	,elemId: null
	
	,context: null
	
	,callback: null

	,initialize: function(schema) {
		this.schema = schema;
		
		this.extensions = [];
		for(var i=0,e=schema.extensions.length; i<e; ++i) {
			var attr = new FormExtension(schema.extensions[i]);
			this.extensions.push(attr);
		};
	}

	,form: function(obj, $elem, ctxt_, callback, functionMap) {
		
		this.obj = obj;
		
		this.context = $n2.extend({
			root: obj
		}, ctxt_);

		this.callback = callback;
		if( !this.callback ) {
			this.callback = function(obj,selector,value){};
		};
		
		this.functionMap = {};
		if( functionMap ) {
			for(var fName in functionMap) {
				this.functionMap[fName] = functionMap[fName];
			};
		};
		
		var unique = $elem.attr('id');
		if( typeof(unique) === 'undefined' ) {
			unique = $n2.getUniqueId();
			$elem.attr('id',unique);
		};
		this.elemId = $elem.attr('id');
		
		this.refresh($elem);
	}
	
	,refresh: function($elem) {
		if(typeof($elem) === 'undefined'){
			$elem = $('#'+this.elemId);
		};
		if( $elem.length > 0 ) {
			// Create view for displayTemplate
			var view = computeFormObj(this.obj, this.context, []);
			this._setHtml(view);
			
			$elem.empty();
			var $divEvent = $('<div>')
				.addClass('n2schema_editorEvent')
				.appendTo($elem);

			if( view[HTML] ) {
				$divEvent.html(view[HTML]);
				
				// Install callbacks
				var _this = this;
				$divEvent.find('.n2schema_input').each(function(){
					_this._installHandlers($elem, $(this),_this.obj,_this.callback);
				});
				
				// Install references
				$divEvent.find('.n2schema_field_reference').each(function(){
					_this._installReference($elem, $(this));
				});
				
				$divEvent.click(function(e){
					var $clicked = $(e.target);
					var classString = $clicked.attr('class');
					var classNames = null;
					if( classString ){
						classNames = classString.split(' ');
					} else {
						classNames = [];
					};
					var classInfo = parseClassNames(classNames);

					//$n2.log('click',this,e);
					if( $clicked.hasClass('n2schema_array_add') ){
						var newType = $clicked.attr('n2_array_new_type');
						var ary = getDataFromObjectSelector(_this.obj, classInfo.selector);
						if( ary ){
							var newItem = '';
							if( newType ){
								try {
									eval('newItem = '+newType);
								} catch(e) {
									$n2.log('Error creating a new item: '+e);
								};
							};
							ary.push(newItem);
						};
						_this.refresh($elem);
						_this.callback(_this.obj,classInfo.selector,ary);
						
					} else if( $clicked.hasClass('n2schema_array_item_delete') ){
						var parentSelector = classInfo.selector.slice(0);
						var itemIndex = 1 * (parentSelector.pop());
						var ary = getDataFromObjectSelector(_this.obj, parentSelector);
						ary.splice(itemIndex,1);
						_this.refresh($elem);
						_this.callback(_this.obj,classInfo.selector,ary);
						
					} else if( $clicked.hasClass('n2schema_array_item_down') ){
						var parentSelector = classInfo.selector.slice(0);
						var itemIndex = 1 * (parentSelector.pop());
						if( itemIndex > 0 ) {
							var ary = getDataFromObjectSelector(_this.obj, parentSelector);
							var removedItems = ary.splice(itemIndex,1);
							ary.splice(itemIndex-1,0,removedItems[0]);
							_this.refresh($elem);
							_this.callback(_this.obj,classInfo.selector,ary);
						};
						
					} else if( $clicked.hasClass('n2schema_referenceDelete') ){
						var parentSelector = classInfo.selector.slice(0);
						var referenceKey = parentSelector.pop();
						var parentObj = getDataFromObjectSelector(_this.obj, parentSelector);
						if( parentObj[referenceKey] ){
							delete parentObj[referenceKey];
							_this.refresh($elem);
							_this.callback(_this.obj,classInfo.selector,null);
						};
						
					} else if( $clicked.hasClass('n2schema_help_date') ){
						$n2.help.ToggleHelp('dates', $clicked);
					};
				});
			};
		};
	}
	
	,_setHtml: function(obj) {
		if( !obj ) return;
		
		for(var i=0,e=this.extensions.length; i<e; ++i) {
			var attr = this.extensions[i];
			attr._setHtml(obj);
		};

		var compiledTemplate = this.schema.formTemplate__compiled;
		if( !compiledTemplate ) {
			var formTemplate = this.schema.formTemplate;
			if( formTemplate ) {
				compiledTemplate = Handlebars.compile(formTemplate);
				this.schema.formTemplate__compiled = compiledTemplate;
			};
		};
		if( compiledTemplate ) {
			obj[HTML] = compiledTemplate(obj);
		};
	},
	
	_installHandlers: function($elem,$input,obj,callback) {
		var _this = this;
		
		var classNames = $input.attr('class').split(' ');
		var classInfo = parseClassNames(classNames);

		var selector = classInfo.selector;
		if( null != selector ) {
			var parentSelector = [];
			for(var i=0,e=selector.length-1; i<e; ++i) {
				parentSelector.push(selector[i]);
			};
			var key = selector[i];
			var handler = this._createChangeHandler(
				obj
				,selector
				,parentSelector
				,classInfo.type
				,key
				,function(obj, selector, value){
					if( 'reference' === classInfo.type ){
						_this.refresh($elem);
					};
					callback(obj, selector, value);
				}
			);
			$input.change(handler);
			//$input.blur(handler);
			if( $n2.schema.GlobalAttributes.disableKeyUpEvents ){
				// skip
			} else {
				if( 'date' !== classInfo.type ){ // no key up event for date text boxes
					$input.keyup(handler);
				};
			};
			
			// Set value
			var value = getDataFromObjectSelector(obj, selector);
			var type = $input.attr('type');
			if( 'checkbox' === type ) {
				if( value ) {
					$input.attr('checked',true);
				} else {
					$input.attr('checked',false);
				};
				
			} else if( 'date' === classInfo.type ) {
				if( value ) {
					value = value.date;
				};
				$input.val(value);
				$input.attr('n2OriginalDate',value);

				if( $input.datepicker ) {
					$input.datepicker({
						dateFormat: 'yy-mm-dd'
						,gotoCurrent: true
						,changeYear: true
						,constrainInput: false
						,onSelect: function(){
							var $input = $(this);
							handler.call($input);
						}
					});
				};
				
			} else if( 'numeric' === classInfo.type ) {
				//if( false == $n2.utils.isNumber(value) ) {
				//	value = 0;
				//};
				$input.val(value);

				// On key down, save previous value
				$input.keydown(function(event) {
					var $input = $(this);
					
					var val = $input.val();
					$input.attr('n2Numeric', val);

					//$n2.log('key down',val,event.keyCode,event);
				});

				// On key up, verify that new value is correct
				// Else, restore previous value
				$input.keyup(function(event) {
					var $input = $(this);
					
					var previous = $input.attr('n2Numeric');
					
					var val = $input.val();
					if( '' === val 
						|| '+' === val
						|| '-' === val
					  ){
						// OK. Allow starting a new number

					} else if( $n2.utils.isNumber(val) ){
						// OK. Allow a number

					} else if( 
							// Allow: delete
							event.keyCode === 46 
							// Allow: backspace
							|| event.keyCode === 8 
							// Allow: tab
							|| event.keyCode === 9 
							// Allow: escape
							|| event.keyCode === 27 
				             // Allow: Ctrl+A
				            || (event.keyCode === 65 && event.ctrlKey) 
				             // Allow: home and end
				            || (event.keyCode >= 35 && event.keyCode <= 36)
				             // Allow: left
				            || (event.keyCode === 37)
				             // Allow: right
				            || (event.keyCode === 39)
				             // Allow: ctrl, shift, alt
				            || (event.keyCode >= 16 && event.keyCode <= 18)
					  ){
						// OK. Allow special characters so that user
						// can perform editing of a value, even if it is
						// not yet numeric
						
					} else {
						// Restore previous
						$input.val(previous);
					}

					//$n2.log('key up',val,event);
					
					return true;
				});
				
			} else if( 'layers' === classInfo.type ) {
				if( $n2.isArray(value) ) {
					value = value.join(',');
				};
				$input.val(value);
				
				var getLayersFn = this.functionMap['getLayers'];
				if( getLayersFn && $input.is('input') ) {
					$input.focus(function(e, eventParam){
						if( eventParam && eventParam.inhibitCallback ) {
							return true;
						};
						
						var layerValue = getDataFromObjectSelector(obj, selector);
						
						getLayersFn({
							currentLayers: layerValue	
							,onSelected: function(layers){ // callback with docId
								var p = getDataFromObjectSelector(obj, parentSelector);
								if( p ) {
									p[key] = layers;
									if( !layers || layers.length === 0 ){
										delete p[key];
									};
								};
								if( layers ) {
									$input.val( layers.join(',') );
									handler.call($input);
								};
								$input.trigger('focus',{inhibitCallback:true});
							}
							,onReset: function(){ // reset function
								$input.trigger('focus',{inhibitCallback:true});
							}
						});
						
						return true;
					});
				};
				
			} else {
				$input.val(value);
			};
		};
	},
	
	_installReference: function($container, $elem) {
		var _this = this;
		
		var domSelector = $elem.attr('n2-obj-sel');
		var objSel = $n2.objectSelector.decodeFromDomAttribute(domSelector);
		var parentSelector = objSel.getParentSelector();
		var key = objSel.getKey();

		var ref = objSel.getValue(this.obj);
		
		if( ref && ref.doc ) {
			// There is a reference
			$elem.empty();
			
			// Brief
			$('<span>')
				.addClass('n2s_briefDisplay')
				.text(ref.doc)
				.appendTo($elem);
			
			// Delete button
			$('<div>')
				.addClass('n2schema_referenceDelete')
				.appendTo($elem)
				.click(function(){
					if( parentSelector && key ){
						var parentObj = parentSelector.getValue(_this.obj);
						if( parentObj[key] ){
							delete parentObj[key];
							_this.refresh($container);
							_this.callback(_this.obj,objSel.selectors,null);
						};
					};
				});
			
		} else {
			// There is no reference. Install a
			// text input
			$elem.empty();

			var $input = $('<input>')
				.attr('type','text')
				.appendTo($elem);
			
			// Handle changes
			var changeHandler = function(e) {
				var $input = $(this);
				
				if( parentSelector && key ){
					var parentObj = parentSelector.getValue(_this.obj);
					if( parentObj ){
						var value = $input.val();
						var cbValue = null;
						
						if( null === value || value === '' ) {
							// delete
							if( parentObj[key] ) {
								delete parentObj[key];
							};
							
						} else {
							// update
							if( !parentObj[key] ) {
								parentObj[key] = {};
							};
							parentObj[key].nunaliit_type = 'reference';
							parentObj[key].doc = value;
							
							cbValue = parentObj[key];
						};
						
						_this.refresh($container);
						_this.callback(_this.obj,objSel.selectors,cbValue);
					};
				};
			};
			$input.change(changeHandler);
			
			// Handle focus
			var getDocumentIdFn = this.functionMap['getDocumentId'];
			if( getDocumentIdFn ) {
				$input.focus(function(e, eventParam){
					var $input = $(this);

					if( eventParam && eventParam.inhibitCallback ) {
						return true;
					};
					
					window.setTimeout(function(){
						getDocumentIdFn({
							onSelected: function(docId){ // callback with docId
								if( parentSelector && key ){
									var parentObj = parentSelector.getValue(_this.obj);
									if( parentObj ){
										if( !parentObj[key] ){
											parentObj[key] = {};
										};
										parentObj[key].nunaliit_type = 'reference';
										parentObj[key].doc = docId;

										// Update input
										$input.val(docId);
										
										// Call change handler
										changeHandler.call($input);
										
										// Put focus in input
										$input.trigger('focus',{inhibitCallback:true});
									};
								};
							}
							,onReset: function(){ // reset function
								$input.trigger('focus',{inhibitCallback:true});
							}
						});
					}, 0);
					
					return true;
				});
			};
			
		};
	},
	
	_createChangeHandler: function(obj, selector, parentSelector, keyType, key, callback) {
		return function(e) {
			var $input = $(this);
			var parentObj = getDataFromObjectSelector(obj, parentSelector);
			var effectiveKey = key;
			var effectiveSelector = selector;
			
			if( !parentObj ){
				if( 'localized' === keyType ) {
					// Materialize the parent of a localized string
					var gpSel = parentSelector.slice();
					var parentKey = gpSel.pop();
					
					var gpObj = getDataFromObjectSelector(obj, gpSel);
					if( gpObj ){
						parentObj = {'nunaliit_type':'localized'};
						gpObj[parentKey] = parentObj;
					};
				};
			};
			
			if( null != parentObj ) {
				var assignValue = true;
				var type = $input.attr('type');
				if( 'checkbox' === type ) {
					if( $input.is(':checked') ) {
						var value = true;
					} else {
						value = false;
					};
					
				} else if( 'reference' === keyType ) {
					value = $input.val();
					if( null === value || value === '' ) {
						assignValue = false;
						if( parentObj[effectiveKey] ) {
							delete parentObj[effectiveKey];
						};
					} else {
						if( !parentObj[effectiveKey] ) {
							parentObj[effectiveKey] = {nunaliit_type:'reference'};
						} else {
							parentObj[effectiveKey].nunaliit_type = 'reference';
						};
						parentObj = parentObj[effectiveKey];
						effectiveKey = 'doc';
					};
					
				} else if( 'date' === keyType ) {
					// For date, we will update object
					assignValue = false;
					
					var dateStr = $input.val();
					
					if( !dateStr ){
						if( parentObj[effectiveKey] ) {
							delete parentObj[effectiveKey];
						};
					} else {
						var trimmedDateStr = $n2.trim(dateStr);
						if( '' === trimmedDateStr ){
							if( parentObj[effectiveKey] ) {
								delete parentObj[effectiveKey];
							};
						} else {

							var dateInt = null;
							try {
								dateInt = $n2.date.parseUserDate(dateStr);
							} catch(e) {
								var msg = _loc('Invalid date: {err}',{err:e});
								$n2.log(msg);
								alert( msg );
								var original = $input.attr('n2OriginalDate');
								$input.val(original);
							};

							if( dateInt ){
								parentObj[effectiveKey] = dateInt.getDocumentStructure();
							};
						};
					};
					
					// We should be updating parent object with the
					// complete date structure
					value = parentObj[effectiveKey];
					
					
				} else if( 'numeric' === keyType ) {
					value = $input.val();

					if( false == $n2.utils.isNumber(value) ){
						assignValue = false;
					} else {
						// Convert to number
						value = 1 * value;
					};
					
				} else if( 'layers' === keyType ) {
					value = $input.val();
					if( null === value || value === '' ) {
						assignValue = false;
						if( parentObj[effectiveKey] ) {
							delete parentObj[effectiveKey];
						};
					} else {
						value = value.split(',');
						for(var i=0,e=value.length; i<e; ++i){
							value[i] = $n2.trim(value[i]);
						};
					};

				} else {
					value = $input.val();
				};
				if( assignValue ) {
					parentObj[effectiveKey] = value;
				};
				callback(obj,effectiveSelector,value);
			};
		};
	}
});

//============================================================
// Exports
$n2.schema = {
	Schema: Schema
	,SchemaRepository: SchemaRepository
//	,DefaultRepository: new SchemaRepository()
	,Display: Display
	,Form: Form
	,GlobalAttributes: {
		disableKeyUpEvents: false
	}
};

})(jQuery,nunaliit2);