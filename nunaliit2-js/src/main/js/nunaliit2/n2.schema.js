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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };


var defaultErrorFn = function(err){ $n2.reportError(err); };
var defaultSuccessFn = function(){};

var typeClassStringPrefix = 'n2schema_type_';

var HTML = ':html';
var INPUT = ':input';
var FIELD = ':field';
var SELECTOR = ':selector';
var ITERATE = ':iterate';
var EMPTY = ':empty';
var CONTEXT = ':context';
var PARENT = ':parent';
var SELECT = '::cur-selector';
var LOCALIZE = ':localize';
var ARRAY = ':array';

//============================================================
// Object

function parseSelectorString(selStr){
	if( '.' === selStr ){
		return new $n2.objectSelector.ObjectSelector([]);
	};
	
	var selectors = selStr.split('.');
	return new $n2.objectSelector.ObjectSelector(selectors);
};

//============================================================
var customFieldHandlers = {};

function registerCustomFieldHandler(opts_){
	var opts = $n2.extend({
		customType: null
		,handler: null
	},opts_);
	
	if( typeof opts.customType === 'string'
	 && typeof opts.handler === 'function' ){
		customFieldHandlers[opts.customType] = opts.handler;
	};
};

//============================================================

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
	var objSel = parseSelectorString(key);
	var s = objSel.getValue(this);

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

function _formSingleField(r,completeSelectors,options){
	
	// option: textarea
	if( options.textarea ){
		r.push('<textarea');
	} else if( options.checkbox ){
		r.push('<input type="checkbox"');
	} else {
		r.push('<input type="text"');
	};
	
	// placeholder
	if( options.placeholder 
	 && typeof options.placeholder[0] === 'string' ){
		var placeHolderValue = options.placeholder[0];
		placeHolderValue = placeHolderValue.replace(/&/g, '&amp;');
		placeHolderValue = placeHolderValue.replace(/"/g, '&quot;');
		r.push(' placeholder="');
		r.push( _loc(placeHolderValue) );
		r.push('"');
	};
	
	r.push(' class="n2schema_input');
	
	var selClass = createClassStringFromSelector(completeSelectors);
	r.push(' '+selClass);
	
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
	
	if( options.wikiTransform ){
		r.push('<div class="n2schema_help_wiki"></div>');
	};
};

function _formField() {
	// The arguments to handlebars block expression functions are:
	// ([obj,]options)
	// obj is not provided in this case, since we do not expect any arguments
	// to {{:field}}
	// options.fn is a function to render inner content
	// options.data is provided by helper that is rendering current portion
	// options.data.n2_selector is provided by the _array() helper
	// this points to the current object
	//
	// Syntax to :form is:
	// {{#:field}}<selector>(,<option>)*{{/:field}}
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();
	
	// Compute current selector
	var currentSelector = null;
	if( options 
	 && options.data 
	 && options.data.n2_selector ){
		// Within an array, the current selector is passed in options
		currentSelector = options.data.n2_selector;

	} else if( typeof this === 'object' 
     && this !== null 
     && this[SELECT]){
		currentSelector = this[SELECT];
	};

	// Gets the text between start and end tags and
	// parse it
	var text = options.fn(this);
	
	var splits = text.split(',');
	var identifier = splits[0];
	var objSel = parseSelectorString(identifier);
	var obj = objSel.getValue(this);
	var completeSelectors = currentSelector.getChildSelector(objSel);
	
	if( obj
	 && typeof obj === 'object'
	 && !obj[SELECT] ){
		obj[SELECT] = completeSelectors;
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
			for(var j=0,k=valSplits.length; j<k; ++j){
				valSplits[j] = decodeURIComponent( valSplits[j] );
			};
			opts[optSplit[0]]=valSplits;
		} else {
			opts[optSplit[0]]=[];
		};
	};
	
	var r = [];
	
	r.push('<div class="n2schema_field_wrapper">');

	if( opts.custom ){
		r.push('<div class="n2schema_field_container n2schema_field_custom"');
		if( opts.custom.length > 0 && typeof opts.custom[0] === 'string'){
			r.push(' n2-custom-type="'+opts.custom+'"');
		} else {
			r.push(' nunaliit-error="Custom type not specified"');
		};
		r.push(' nunaliit-selector="'+completeSelectors.encodeForDomAttribute()+'"');
		r.push('>');
		r.push('</div>');
		
		
	} else if( obj && obj.nunaliit_type === 'localized' ) {
		var langs = getSortedLanguages(opts.localized, obj);
		
		// Turn on "localized" option, if not already on
		if( !opts.localized ){
			opts.localized = [];
		};
		
		for(var i=0,e=langs.length;i<e;++i){
			var lang = langs[i];
			
			var langSel = completeSelectors.getChildSelector(lang);

			r.push('<div class="n2schema_field_container n2schema_field_container_localized');
			if( opts.textarea ){
				r.push(' n2schema_field_container_textarea');
			};
			r.push('">');
			r.push('<span class="n2_localize_lang">('+lang+')</span>');
			_formSingleField(r,langSel,opts);
			r.push('</div>');
		};
		
	} else if( !obj && opts.localized ) {
		// This is a localized string that does not yet exist
		// This condition is true if obj is an empty string or
		// if obj is undefined (or null)

		var langs = getSortedLanguages(opts.localized, null);
		
		for(var i=0,e=langs.length;i<e;++i){
			var lang = langs[i];
			
			var langSel = completeSelectors.getChildSelector(lang);
			
			r.push('<div class="n2schema_field_container n2schema_field_container_localized');
			if( opts.textarea ){
				r.push(' n2schema_field_container_textarea');
			};
			r.push('">');
			r.push('<span class="n2_localize_lang">('+lang+')</span>');
			_formSingleField(r,langSel,opts);
			r.push('</div>');
		};

	} else if( opts.reference ) {
		var attr = completeSelectors.encodeForDomAttribute();
		r.push('<span class="n2schema_field_reference" nunaliit-selector="'+attr+'"');
		if( opts.search 
		 && opts.search[0] ){
			r.push(' n2-search-func="'+opts.search[0]+'"');
		};
		r.push('></span>');

	} else if( opts.geometry ) {
		var attr = completeSelectors.encodeForDomAttribute();
		r.push('<textarea class="n2schema_field_geometry" nunaliit-selector="'+attr+'"');
		r.push('></textarea>');
		
	} else {
		r.push('<div class="n2schema_field_container');
		if( opts.textarea ){
			r.push(' n2schema_field_container_textarea');
		};
		r.push('">');
		_formSingleField(r,completeSelectors,opts);
		r.push('</div>');
	};

	r.push('</div>');
	
	return r.join('');
	
	function getSortedLanguages(langOpts, localizedStr){
		var langMap = {};
		
		if( localizedStr ){
			for(var lang in localizedStr){
				if( lang === 'nunaliit_type' || lang[0] === ':' ){
					// ignore
				} else {
					langMap[lang] = true;
				};
			};
		};

		if( langOpts ){
			for(var i=0,e=langOpts.length;i<e;++i){
				var lang = langOpts[i];
				langMap[lang] = true;
			};
		};
		
		var languages = $n2.languageSupport.getLanguages();
		if( languages ){
			for(var i=0,e=languages.length; i<e; ++i){
				var lang = languages[i].code;
				langMap[lang] = true;
			};
		};
		
		var langs = [];
		for(var lang in langMap){
			langs.push(lang);
		};
		
		var locale = $n2.l10n.getLocale();
		var localeLang = locale.lang;
		langs.sort(function(l1,l2){
			if( l1 === localeLang ) return -1;
			if( l2 === localeLang ) return 1;
			if( l1 < l2 ) return -1;
			if( l1 > l2 ) return 1;
			return 0;
		});
		
		return langs;
	};
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
		completeSelectors = options.data.n2_selector;
	} else if( this[SELECT] ) {
		completeSelectors = this[SELECT];
	} else {
		return '';
	};
	if( '.' === key ) {
		// Current selector is fine
	} else {
		var sels = key.split('.');
		completeSelectors = completeSelectors.getChildSelector(sels);
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
	
			var completeSelectors = obj[SELECT];
			completeSelectors = completeSelectors.getChildSelector(i);
			var cl = createClassStringFromSelector(completeSelectors);
			
			r.push('<div class="n2schema_array_item">');

			r.push('<div class="n2schema_array_item_buttons">');
	
			r.push('<div class="n2schema_array_item_delete '+cl+'"></div>');
			
			r.push('<div class="n2schema_array_item_up '+cl+'"></div>');
			
			r.push('<div class="n2schema_array_item_down '+cl+'"></div>');

			r.push('</div>'); // close buttons
	
			r.push('<div class="n2schema_array_item_wrapper">');
	
			r.push( options.fn(item,{data:{n2_selector:completeSelectors}}) );
			
			r.push('</div></div>');
		};
	};

	// Add a new item
	var arraySelector = undefined;
	if( obj ){
		arraySelector = obj[SELECT];
	} else if( options && options.ids && options.ids.length ){
		var selectors = [];
		pathFromData(options.data, selectors);
		selectors.push(options.ids[0]);
		arraySelector = new $n2.objectSelector.ObjectSelector(selectors);
	};
	if( arraySelector ){
		var arrayClass = createClassStringFromSelector(arraySelector);
		r.push('<div class="n2schema_array_add '+arrayClass+'"');
		if( newType ) {
			r.push('n2_array_new_type="'+newType+'"');
		};
		r.push('></div>');
	};
	
	r.push('</div>');
	
	return r.join('');
	
	function pathFromData(data, path){
		if( data._parent ){
			pathFromData(data._parent, path);
		};
		if( data.contextPath ){
			path.push(data.contextPath);
		};
	};
};

function _selectorField(){
	// The arguments to handlebars block expression functions are:
	// ([obj,]options)
	// obj is not provided in this case, since we do not expect any arguments
	// to {{#:selector}}
	// options.fn is a function to render inner content
	// options.data is provided by helper that is rendering current portion
	// options.data.n2_selector is provided by the _array() helper
	// this points to the current object
	//
	// Syntax to :form is:
	// {{#:selector}}<selector>{{/:selector}}
	var args = [];
	args.push.apply(args,arguments);
	var options = args.pop();
	
	// Compute current selector
	var currentSelector = null;
	if( options 
	 && options.data 
	 && options.data.n2_selector ){
		// Within an array, the current selector is passed in options
		currentSelector = options.data.n2_selector;

	} else if( typeof this === 'object' 
     && this !== null 
     && this[SELECT]){
		currentSelector = this[SELECT];
	};
	
	if( !currentSelector ){
		return '';
	};

	// Gets the text between start and end tags and
	// parse it
	var text = options.fn(this);
	
	var objSel = parseSelectorString(text);
	var completeSelectors = currentSelector.getChildSelector(objSel);
	return completeSelectors.encodeForDomAttribute();
};


if( typeof(Handlebars) !== 'undefined' 
 && Handlebars.registerHelper ) {
	Handlebars.registerHelper(LOCALIZE ,_localizeString );
	Handlebars.registerHelper(FIELD    ,_formField      );
	Handlebars.registerHelper(INPUT    ,_inputField     );
	Handlebars.registerHelper(ARRAY    ,_arrayField     );
	Handlebars.registerHelper(SELECTOR ,_selectorField  );
} else {
	$n2.log('Unable to register helper functions with Handlebars. Schemas will not work properly.');
};

function computeViewObj(origObj, context, selector, parent) {
	
	if( !selector ){
		selector = new $n2.objectSelector.ObjectSelector([]);
	};
	
	if( null === origObj ) {
		return origObj;
		
	} else if( typeof(origObj) === 'undefined' ) {
		return null;
		
	} else if( $n2.isArray(origObj) ) {
		var view = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;
		view[SELECT] = selector;
		
		for(var i=0,e=origObj.length; i<e; ++i) {
			var childSelector = selector.getChildSelector(i);
			var value = computeViewObj(origObj[i], context, childSelector, view);
			view.push(value);
		};

		return view;
		
	} else if( typeof(origObj) === 'object' ) {
		var view = {};
		
		view[ITERATE] = [];
		view[CONTEXT] = context;
		view[PARENT] = parent;
		view[SELECT] = selector;

		for(var key in origObj) {
			if('__n2Source' === key) continue;

			var childSelector = selector.getChildSelector(key);
			var value = computeViewObj(origObj[key], context, childSelector, view);
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
		return origObj;
	};
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
};


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

	,exportInfo: null
	
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
		this.exportInfo = jsonDefinition['export'];
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
				compiledTemplate = Handlebars.compile(displayTemplate, {trackIds:true});
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

function createClassStringFromSelector(selector) {
	var cs = 
		selectorClassStringPrefix
		+selector.encodeForDomAttribute();
	return cs;
};

// Given a class name, returns an array that represents the encoded selector.
// Returns null if the class name is not encoding a selector
function createSelectorFromClassString(classString) {
	if( selectorClassStringPrefix 
			=== classString.substr(0,selectorClassStringPrefix.length) ) {
		var selectorString = classString.substr(selectorClassStringPrefix.length);
		var selector = $n2.objectSelector.decodeFromDomAttribute(selectorString);
		
		return selector;
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
			var view = computeViewObj(this.obj,this.context);
			this._setHtml(view);
			
			// We are about to empty the $elem and redraw it. If this is
			// a large form, emptying it to a size of 0 would mangle all
			// offsets associated with various scroll bars that parent elements
			// might have. Since the form will most likely be the same
			// approximate size after the redraw, take the current size,
			// apply it as minimum to retain the dimensions during the redraw,
			// and remove changes after enough time was given for everything to
			// redraw itself.
			var currentHeight = $elem.height();
			var currentWidth = $elem.width();
			if( currentHeight > 0 ){
				$elem.css('min-height',currentHeight+'px');
			};
			if( currentWidth > 0 ){
				$elem.css('min-width',currentWidth+'px');
			};
			window.setTimeout(function(){
				$elem.removeAttr('style');
			},500);
			
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

				// Install geometries
				$divEvent.find('.n2schema_field_geometry').each(function(){
					_this._installGeometry($elem, $(this));
				});

				// Install custom types
				$divEvent.find('.n2schema_field_custom').each(function(){
					_this._installCustomType($elem, $(this),_this.obj,_this.callback);
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
						var ary = classInfo.selector.getValue(_this.obj);
						if( !ary ){
							// Array does not yet exist. Try to create
							var parentSelector = classInfo.selector.getParentSelector();
							var parentObj = undefined;
							if( parentSelector ){
								parentObj = parentSelector.getValue(_this.obj);
							};
							if( parentObj && typeof parentObj === 'object' ){
								classInfo.selector.setValue(_this.obj,[]);
								ary = classInfo.selector.getValue(_this.obj);
							};
						};
						if( ary && $n2.isArray(ary) ){
							var newItem = '';
							if( 'reference' === newType ){
								newItem = null;
								
							} else if( 'date' === newType ){
								newItem = null;
								
							} else if( 'string' === newType ){
								newItem = '';
								
							} else if( 'localized' === newType ){
								newItem = {
									nunaliit_type: 'localized'
								};
								var locale = $n2.l10n.getLocale();
								var lang = locale.lang;
								newItem[lang] = '';
								
							} else if( 'textarea' === newType ){
								newItem = '';
								
							} else if( newType ){
								try {
									eval('newItem = '+newType);
								} catch(e) {
									$n2.log('Error creating a new item: '+e);
								};
							};
							ary.push(newItem);
						};
						_this.refresh($elem);
						_this.callback(_this.obj,classInfo.selector.selectors,ary);
						
					} else if( $clicked.hasClass('n2schema_array_item_delete') ){
						var itemIndex = 1 * classInfo.selector.getKey();
						var parentSelector = classInfo.selector.getParentSelector();
						var ary = parentSelector.getValue(_this.obj);
						ary.splice(itemIndex,1);
						
						var $item = $clicked.parents('.n2schema_array_item').first();
						$item.remove();
						//_this.refresh($elem);

						_this.callback(_this.obj,classInfo.selector.selectors,ary);
						
					} else if( $clicked.hasClass('n2schema_array_item_up') ){
						// Push item earlier in array
						var itemIndex = 1 * classInfo.selector.getKey();
						if( itemIndex > 0 ) {
							var parentSelector = classInfo.selector.getParentSelector();
							var ary = parentSelector.getValue(_this.obj);
							var removedItems = ary.splice(itemIndex,1);
							ary.splice(itemIndex-1,0,removedItems[0]);
							
							var $item = $clicked.parents('.n2schema_array_item').first();
							var $prevItem = $item.prev();
							$item.insertBefore($prevItem);
							//_this.refresh($elem);

							_this.callback(_this.obj,classInfo.selector.selectors,ary);
						};
						
					} else if( $clicked.hasClass('n2schema_array_item_down') ){
						// Push item later in array
						var itemIndex = 1 * classInfo.selector.getKey();
						var parentSelector = classInfo.selector.getParentSelector();
						var ary = parentSelector.getValue(_this.obj);
						if( itemIndex < (ary.length - 1) ) {
							var removedItems = ary.splice(itemIndex,1);
							ary.splice(itemIndex+1,0,removedItems[0]);
							
							var $item = $clicked.parents('.n2schema_array_item').first();
							var $nextItem = $item.next();
							$item.insertAfter($nextItem);
							//_this.refresh($elem);

							_this.callback(_this.obj,classInfo.selector.selectors,ary);
						};
						
					} else if( $clicked.hasClass('n2schema_referenceDelete') ){
						var referenceKey = classInfo.selector.getKey();
						var parentSelector = classInfo.selector.getParentSelector();
						var parentObj = parentSelector.getValue(_this.obj);
						if( parentObj[referenceKey] ){
							delete parentObj[referenceKey];
							_this.refresh($elem);
							_this.callback(_this.obj,classInfo.selector.selectors,null);
						};
						
					} else if( $clicked.hasClass('n2schema_help_date') ){
						$n2.help.ToggleHelp('dates', $clicked);
						
					} else if( $clicked.hasClass('n2schema_help_wiki') ){
						$n2.help.ToggleHelp('wiki', $clicked);
					};
				});
			};
		};
	},

	_setHtml: function(obj) {
		if( !obj ) return;
		
		for(var i=0,e=this.extensions.length; i<e; ++i) {
			var attr = this.extensions[i];
			attr._setHtml(obj);
		};

		var compiledTemplate = this.schema.formTemplate__compiled;
		if( !compiledTemplate ) {
			var formTemplate = this.schema.formTemplate;
			if( formTemplate ) {
				compiledTemplate = Handlebars.compile(formTemplate,{trackIds:true});
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
		var inputNodeName = $input.prop('nodeName');
		if( typeof inputNodeName === 'string' ){
			inputNodeName = inputNodeName.toLowerCase();
		};
		
		// Special case for references. Convert input into field
		if( 'reference' === classInfo.type 
		 && classInfo.selector ){
			var $span = $('<span>')
				.attr('nunaliit-selector',classInfo.selector.encodeForDomAttribute())
				;
			$input.after($span);
			$input.remove();
			this._installReference($elem,$span);
			return;
		};

		var selector = classInfo.selector;
		if( selector ) {
			var parentSelector = selector.getParentSelector();
			var key = selector.getKey();
			var changeHandler = this._createChangeHandler(
				obj
				,selector
				,parentSelector
				,classInfo.type
				,function(obj, selector, value){
					if( 'reference' === classInfo.type ){
						_this.refresh($elem);
					};
					callback(obj, selector.selectors, value);
				}
			);
			var keyupHandler = this._createChangeHandler(
					obj
					,selector
					,parentSelector
					,classInfo.type
					,function(obj, selector, value){
					}
				);
			$input.change(changeHandler);
			//$input.blur(handler);
			if( 'date' !== classInfo.type ){ // no key up event for date text boxes
				$input.keyup(keyupHandler);
			};
			
			// Set value
			var value = selector.getValue(obj);
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
							changeHandler.call($input);
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
						
						var layerValue = selector.getValue(obj);
						
						getLayersFn({
							currentLayers: layerValue	
							,onSelected: function(layers){ // callback with docId
								var p = parentSelector.getValue(obj);
								if( p ) {
									p[key] = layers;
									if( !layers || layers.length === 0 ){
										delete p[key];
									};
								};
								if( layers ) {
									$input.val( layers.join(',') );
									changeHandler.call($input);
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
			
			// After setting the value to a <select>, it is possible that no option
			// is representing the current value. In this case, insert an option to
			// represent the current state
			if( 'select' === inputNodeName ){
				var effectiveValue = value;
				if( null === effectiveValue || undefined === effectiveValue ){
					// This is a text field. Null does not have a meaning
					effectiveValue = '';
				};

				var selectedOptions = $input[0].selectedOptions;
				if( selectedOptions ){
					var foundCurrentValue = false;
					for(var i=0,e=selectedOptions.length; i<e; ++i){
						var selectedOption = selectedOptions.item(i);
						var $selectedOptions = $(selectedOption);
						var selectedValue = $selectedOptions.attr('value');
						if( selectedValue === effectiveValue ){
							foundCurrentValue = true;
						};
					};
					
					if( !foundCurrentValue ){
						// At this point, the value carried by the document is not
						// properly represented by the <select> form element. Correct
						// the situation by prepending an <option> element with the
						// correct value. Make this option 'disabled' so that user can
						// not choose it.
						$('<option>')
							.attr('value',effectiveValue)
							.attr('disabled','disabled')
							.text( effectiveValue )
							.prependTo($input);
						$input.val(value);
					};
				};
			};
		};
	},

	_installReference: function($container, $elem) {
		var _this = this;
		
		var domSelector = $elem.attr('nunaliit-selector');
		var objSel = $n2.objectSelector.decodeFromDomAttribute(domSelector);
		var parentSelector = objSel.getParentSelector();
		var key = objSel.getKey();

		var funcIdentifier = $elem.attr('n2-search-func');
		
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
					var parentObj = parentSelector.getValue(_this.obj);
					if( $n2.isArray(parentObj) 
					 && typeof key === 'number' 
					 && parentObj.length > key ){
						// Dealing with an array of references
						if( parentObj[key] ){
							parentObj.splice(key,1);
							_this.refresh($container);
							_this.callback(_this.obj,objSel.selectors,null);
						};
					} else {
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
			$input.change(changeHandler);
			
			// Handle focus
			var focusHandler = {
				fn: this.functionMap['getDocumentId']
				,args: []
			};
//			if( funcIdentifier 
//			 && this.functionMap[funcIdentifier] ){
//				getDocumentIdFn = this.functionMap[funcIdentifier];
//			};
			if( funcIdentifier ){
				if( $n2.docFnCall ){
					try {
						var program = $n2.docFnCall.parse(funcIdentifier);
						if( program ){
							var r = program.getValue({
								doc: _this.obj
								,funcMap: this.functionMap
							});
							if( r ){
								focusHandler = r;
							};
						};
					} catch(err) {
						$n2.logError('Error while processing focus handler '+funcIdentifier, err);
					};
				};
			};
			if( focusHandler ) {
				$input.focus(function(e, eventParam){
					var $input = $(this);

					if( eventParam && eventParam.inhibitCallback ) {
						return true;
					};
					
					window.setTimeout(function(){
						focusHandler.fn({
							contextDoc: _this.obj
							,args: focusHandler.args
							,onSelected: function(docId){ // callback with docId
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

	_installGeometry: function($container, $elem) {
		var _this = this;
		
		var domSelector = $elem.attr('nunaliit-selector');
		var objSel = $n2.objectSelector.decodeFromDomAttribute(domSelector);
		var parentSelector = objSel.getParentSelector();
		var key = objSel.getKey();

		var geom = objSel.getValue(this.obj);
		
		if( geom && geom.wkt ) {
			// There is a geometry
			$elem.val(geom.wkt);
		} else {
			$elem.val('');
		};
		
		$elem.change(function(e) {
			var $elem = $(this);
			
			var parentObj = parentSelector.getValue(_this.obj);
			if( parentObj ){
				var value = $elem.val();
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
					parentObj[key].nunaliit_type = 'geometry';
					parentObj[key].wkt = value;
					
					if( parentObj[key].bbox ){
						delete parentObj[key].bbox;
					};
					
					if( parentObj[key].simplified ){
						delete parentObj[key].simplified;
					};
					
					cbValue = parentObj[key];
				};
				
				_this.refresh($container);
				_this.callback(_this.obj,objSel.selectors,cbValue);
			};
		});
	},
	
	_installCustomType: function($container, $elem, doc , callbackFn){
		var _this = this;
		
		var customType = $elem.attr('n2-custom-type');
		
		var selectorStr = $elem.attr('nunaliit-selector');
		var selector = null;
		if( selectorStr ){
			selector = $n2.objectSelector.decodeFromDomAttribute(selectorStr);
		};
		
		function cb(value, suppressFullRefresh){
			if( suppressFullRefresh ){
				$elem.empty();

				var handler = customFieldHandlers[customType];
				if( handler ){
					var obj = undefined;
					if( selector && doc ){
						obj = selector.getValue(doc);
					};
					
					handler({
						elem: $elem
						,doc: doc
						,obj: obj
						,selector: selector
						,customType: customType
						,callbackFn: cb
						,functionMap: _this.functionMap
					});
				};
			} else {
				_this.refresh($container);
			};
			
			_this.callback(doc,selector,value);
		};
		
		if( typeof customType === 'string' ){
			var handler = customFieldHandlers[customType];
			if( handler ){
				var obj = undefined;
				if( selector && doc ){
					obj = selector.getValue(doc);
				};
				
				handler({
					elem: $elem
					,doc: doc
					,obj: obj
					,selector: selector
					,customType: customType
					,callbackFn: cb
					,functionMap: _this.functionMap
				});
			} else {
				$elem.attr('nunaliit-error','No handler found for custom type: "'+customType+'"');
			};
			
		} else {
			$elem.attr('nunaliit-error','Custom type not provided');
		};
		
	},
	
	_createChangeHandler: function(obj, selector, parentSelector, keyType, callback) {
		return function(e) {
			var $input = $(this);
			var parentObj = parentSelector.getValue(obj);
			var effectiveKey = selector.getKey();
			
			if( !parentObj ){
				if( 'localized' === keyType ) {
					var value = $input.val();
					if( value ){
						// Materialize the parent of a localized string
						parentSelector.setValue(obj,{'nunaliit_type':'localized'});
						parentObj = parentSelector.getValue(obj);
					};
				};
			};
			
			if( parentObj ) {
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
					
				} else if( 'localized' === keyType ) {
					value = $input.val();
					parentObj[effectiveKey] = value;
					assignValue = false;
					
					var shouldDelete = true;
					for(var lang in parentObj){
						if( 'nunaliit_type' === lang ){
							// ignore
						} else if( parentObj[lang] ) {
							// non-empty string
							shouldDelete = false;
						};
					};
					if( shouldDelete ){
						parentSelector.removeValue(obj);
					};
					
				} else if( 'date' === keyType ) {
					// For date, we will update object
					assignValue = false;
					
					var dateStr = $input.val();
					
					if( !dateStr ){
						if( parentObj[effectiveKey] ) {
							parentObj[effectiveKey] = null;
						};
					} else {
						var trimmedDateStr = $n2.trim(dateStr);
						if( '' === trimmedDateStr ){
							if( parentObj[effectiveKey] ) {
								parentObj[effectiveKey] = null;
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
				callback(obj,selector.selectors,value);
			};
		};
	}
});

//============================================================
// Exports
$n2.schema = {
	Schema: Schema
	,SchemaRepository: SchemaRepository
	,Display: Display
	,Form: Form
	,registerCustomFieldHandler: registerCustomFieldHandler
};

})(jQuery,nunaliit2);