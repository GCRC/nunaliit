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

$Id: n2.couchSearch.js 8464 2012-08-30 15:43:23Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

// Dispatcher
var DH = 'n2.couchSearch';

function SplitSearchTerms(line) {
	if( !line ) return null;
	
	var map = $n2.couchUtils.extractSearchTerms(line);

	var searchTerms = [];
	for(var term in map){
		var folded = map[term].folded;
		if( folded ) {
			searchTerms.push(folded);
		};
	};
	
	return searchTerms;
};

//============ SearchRequest ========================

var SearchRequest = $n2.Class({
	
	options: null
	
	,searchResults: null
	
	,initialize: function(searchTerms, opts_) {
		this.options = $n2.extend({
			designDoc: null
			,db: null
			,searchView: 'text-search'
			,searchLimit: 25
			,onlyFinalResults: false
			,strict: false
			,onSuccess: function(searchResults){}
			,onError: function(err){ $n2.reportErrorForced(err); }
		},opts_);
		
		if( typeof(searchTerms) === 'string' ) {
			searchTerms = SplitSearchTerms(searchTerms);
		};

		// Initialize results
		this.searchResults = {
			terms: []
			,pending: searchTerms.length
			,map: {}
			,sorted: []
			,list: []
		};
		
		// Handle case where nothing is asked
		if( !searchTerms.length ) {
			this._returnSearchResults();
			return;
		};
		
		// Search terms are stored lower case in database
		for(var i=0,e=searchTerms.length; i<e; ++i) {
			var t = searchTerms[i].toLowerCase();
			this.searchResults.terms.push(t);
		};

		// Search for each term, and merge results later
		var _this = this;
		for(var i=0,e=this.searchResults.terms.length; i<e; ++i) {
			var term = this.searchResults.terms[i];
			this.options.designDoc.queryView({
				viewName: this.options.searchView
				,startkey: [term, 0]
				,endkey: [term, {}]
//				,limit: this.options.searchLimit
				,onSuccess: function(rows) {
					_this._receiveSearchResults(rows);
				}
				,onError: function(err) {
					_this.searchResults = null;
					_this.options.onError(err);
				}
			});
		};
	}

	,abortSearch: function() {
		this.searchResults = null;
	}
	
	,_receiveSearchResults: function(rows) {
	
		var searchResults = this.searchResults;
		
		if( !searchResults ) return;
		
		// Remember the returned response
		--searchResults.pending;
		var termsReceived = searchResults.terms.length - searchResults.pending;

		// Strict
		// In this mode, return only the results that meet
		// all the search terms. If not in strict mode,
		// it returns all result that meet any term.
		if( this.options.strict && termsReceived > 1 ) {
			// Add only the new results that match old ones
			for(var i=0,e=rows.length; i<e; ++i) {
				var docId = rows[i].id;
				var index = rows[i].key[1];
				
				if( searchResults.map[docId] ) {
					// Document already found, increment terms
					var m = searchResults.map[docId];
					++m.terms;
					if( m.index > index ) m.index = index;
				} else {
					// Do not add, it does not match a previous result
				};
			};

			// Remove previous results that do not match the number
			// of terms received so far 
			var docIdsToDelete = [];
			for(var docId in searchResults.map){
				if( searchResults.map[docId].terms < termsReceived ) {
					docIdsToDelete.push(docId);
				};
			};
			// Remove invalid search results
			for(var i=0,e=docIdsToDelete.length; i<e; ++i){
				delete searchResults.map[docIdsToDelete[i]];
			};
			// Rebuilt sorted list
			searchResults.sorted = [];
			for(var docId in searchResults.map){
				searchResults.sorted.push(searchResults.map[docId]);
			};
		} else {
			// This happens in non-strict mode or in the first
			// round of strict mode. Add all results to map.
			for(var i=0,e=rows.length; i<e; ++i) {
				var docId = rows[i].id;
				var index = rows[i].key[1];
				
				if( searchResults.map[docId] ) {
					// Document already found, increment terms
					var m = searchResults.map[docId];
					++m.terms;
					if( m.index > index ) m.index = index;
				} else {
					var m = {
						id: docId
						,index: index
						,terms: 1
						,contentRequested: false
					};
					searchResults.map[docId] = m;
					searchResults.sorted.push(m);
				};
			};
		};
		
		this._returnSearchResults();
	}
	
	,_returnSearchResults: function() {
		
		var searchResults = this.searchResults;
		
		if( !searchResults ) return;

		var _this = this;
		
		if( this.options.onlyFinalResults ) {
			if( searchResults.pending > 0 ) {
				return;
			};
		};
		
		// Sort results
		searchResults.sorted.sort(function(a,b){
			if( a.terms > b.terms ) {
				return -1;
			} else if( a.terms < b.terms ) {
				return 1;
			} else {
				if( a.index < b.index ) {
					return -1;
				} else if( a.index > b.index ) {
					return 1;
				};
			};
			
			return 0;
		});
		
		// Create list that should be consumed by the client
		if( (searchResults.terms.length - searchResults.pending) <= 1 ) {
			// Only one term returned so far
			searchResults.list = searchResults.sorted;
		} else {
			// Copy only the results that match the most terms
			searchResults.list = [];
			if( searchResults.sorted.length > 0 ) {
				var termCount = searchResults.sorted[0].terms;
				for(var i=0,e=searchResults.sorted.length; i<e; ++i){
					var r = searchResults.sorted[i];
					if( r.terms >= termCount ) {
						searchResults.list.push(r);
					};
				};
			};
		};
		
		this.options.onSuccess(searchResults);
	}
});

//============ LookAheadService ========================

var LookAheadService = $n2.Class({

	options: null
	
	,lookAheadMap: null
	
	,lookAheadCounter: null
	
	,initialize: function(opts_) {
		this.options = opts_;
		
		this.lookAheadMap = {};
		this.lookAheadCounter = 0;
	}

	,queryPrefix: function(prefix,callback) {
		var _this = this;
	
		var words = this._retrievePrefix(prefix);
		if( words ) {
			callback(prefix,words);
			return;
		};
		
		// Make request
		this.options.designDoc.queryView({
			viewName: this.options.lookAheadView
			,listName: this.options.lookAheadList
			,startkey: [prefix,null]
			,endkey: [prefix + '\u9999',{}]
			,top: this.options.lookAheadLimit
			,group: true
			,onlyRows: false
			,reduce: true
			,onSuccess: function(response) {
				var rows = response.rows;
	
				var words = [];
				for(var i=0,e=rows.length; i<e; ++i) {
					words.push(rows[i][0]);
				};
				
				// Cache these results
				_this._cachePrefix({
					prefix: prefix
					,words: words
					,full: response.all_rows
				});
				
				if( 0 == words.length ) {
					callback(prefix,null);
				} else {
					callback(prefix,words);
				};
			}
			,onError: function(){
				callback(prefix,null);
			}
		});
	}
	
	,queryTerms: function(terms,callback) {

		if( null === terms
		 || 0 == terms.length ) {
			callback(null);
			return;
		};
		
		var index = terms.length - 1;
		while( index >= 0 ) {
			var lastTerm = terms[index];
			if( '' === lastTerm ) {
				--index;
			} else {
				var previousWords = null;
				if( index > 0 ) {
					previousWords = terms.slice(0,index);
				};
				break;
			};
		};
		
		lastTerm = lastTerm.toLowerCase();
		
		if( !lastTerm ) {
			callback(null);
			return;
		};
		if( lastTerm.length < this.options.lookAheadPrefixMin ) {
			callback(null);
			return;
		};
		
		var previousWordsString = '';
		if( previousWords ) {
			previousWordsString = previousWords.join(' ') + ' ';
		};
		
		this.queryPrefix(lastTerm,function(prefix,words){
			
			if( null === words ) {
				callback(null);
			} else {
				var results = [];
				for(var i=0,e=words.length; i<e; ++i) {
					results.push( previousWordsString + words[i] );
				};
				callback(results);
			};
		});
	}
	
	,_cachePrefix: function(prefixResult) {
		
		// Save result under prefix
		this.lookAheadMap[prefixResult.prefix] = prefixResult;
		
		// Mark generation
		prefixResult.counter = this.lookAheadCounter;
		++(this.lookAheadCounter);
		
		// Trim cache
		var keysToDelete = [];
		var cachedMap = this.lookAheadMap; // faster access
		var limit = this.lookAheadCounter - this.options.lookAheadCacheSize;
		for(var key in cachedMap) {
			if( cachedMap[key].counter < limit ) {
				keysToDelete.push(key);
			};
		};
		for(var i=0,e=keysToDelete.length; i<e; ++i) {
			delete cachedMap[keysToDelete[i]];
		};
	}
	
	,_retrievePrefix: function(prefix) {
		
		// Do we have exact match in cache?
		if( this.lookAheadMap[prefix] ) {
			return this.lookAheadMap[prefix].words;
		};
		
		// Look for complete results from shorter prefix
		var sub = prefix.substring(0,prefix.length-1);
		while( sub.length >= this.options.lookAheadPrefixMin ) {
			if( this.lookAheadMap[sub] && this.lookAheadMap[sub].full ) {
				var cachedWords = this.lookAheadMap[sub].words;
				var words = [];
				for(var i=0,e=cachedWords.length; i<e; ++i) {
					var word = cachedWords[i];
					if( word.length >= prefix.length ) {
						if( word.substr(0,prefix.length) === prefix ) {
							words.push(word);
						};
					};
				};
				return words;
			};
			sub = sub.substring(0,sub.length-1);
		};
		
		// Nothing of value found
		return null;
	}

	,getJqAutoCompleteSource: function() {
		var _this = this;
		return function(request, cb) {
			_this._jqAutoComplete(request, cb);
		};
	}
	
	,_jqAutoComplete: function(request, cb) {
		var terms = SplitSearchTerms(request.term);
		var callback = cb;
//		var callback = function(res){
//			$n2.log('look ahead results',res);
//			cb(res);
//		}
		this.queryTerms(terms, callback);
	}

});

//============ SearchInput ========================

var SearchInput = $n2.Class({
	options: null
	
	,searchServer: null
	
	,textInputId: null
	
	,searchButtonId: null
	
	,keyPressedSinceLastSearch: null
	
	,dispatchHandle: null
	
	,initialize: function(opts_, server_){
		this.options = $n2.extend({
			textInput: null
			,searchButton: null
			,initialSearchText: null
			,displayDiv: null // one of displayDiv,
			,displayFn: null // displayFn or
			,dispatchService: null // dispatchService should be supplied
		},opts_);
		
		var _this = this;
		
		this.searchServer = server_;

		this.keyPressedSinceLastSearch = false;
		
		if( this.options.dispatchService ) {
			var f = function(m){
				_this._handle(m);
			};
			this.options.dispatchService.register(DH,'searchInitiate',f);
			this.options.dispatchService.register(DH,'selected',f);
			this.options.dispatchService.register(DH,'unselected',f);
		};
		
		// Figure out id. We should not hold onto a reference
		// to the input since it would create a circular reference.
		// This way, if the element is removed from the window tree,
		// it all cleans up easy.
		var $textInput = this.options.textInput;
		var textInputId = $textInput.attr('id');
		if( !textInputId ) {
			textInputId = $n2.getUniqueId();
			$textInput.attr('id',textInputId);
		};
		this.textInputId = textInputId;
		this.options.textInput = null; // get rid of reference

		// Same for button
		if( this.options.searchButton ) {
			var $searchButton = this.options.searchButton;
			var searchButtonId = $searchButton.attr('id');
			if( !searchButtonId ) {
				searchButtonId = $n2.getUniqueId();
				$searchButton.attr('id',searchButtonId);
			};
			this.searchButtonId = searchButtonId;
			this.options.searchButton = null; // get rid of reference
		};
		
		this._install();
	}

	,getTextInput: function() {
		return $('#'+this.textInputId);
	}

	,getSearchButton: function() {
		if( this.searchButtonId ) {
			return $('#'+this.searchButtonId);
		};
		return null;
	}
	
	,performSearch: function(line, $textInput){
		
		var _this = this;

		if( !$textInput ) {
			$textInput = this.getTextInput();
		};
		
		if( !line ) {
			line = $textInput.val();
		} else if( $textInput ) {
			$textInput.val(line);
		};
		
		if( this.options.dispatchService ) {
			this.options.dispatchService.send(DH, {
				type: 'searchInitiate'
				,searchLine: line
			});
			
		} else if( this.searchServer ){
			this.searchServer.submitRequest(
				line
				,{
					onSuccess: function(searchResults){
						_this._processSearchResults(searchResults);
					}
					,onError: function(err){ 
						_this._processSearchError(err);
					}
				}
			);
		};

		this.keyPressedSinceLastSearch = false;
		this._displayWait();
		this._closeLookAhead($textInput);
	}

	,_install: function(){
		
		var _this = this;
		
		var $textInput = this.getTextInput();
		
		if( this.options.initialSearchText ) {
			$textInput.val(this.options.initialSearchText);
		};
		
		if( $textInput.autocomplete ) {
			$textInput.autocomplete({
				source: this._getJqAutoCompleteSource()
			});
		};
		
		$textInput.keydown(function(e){
			_this._keyDown(e);
		});
		
		$textInput.focus(function(e) {
			_this._focus(e);
		});
		
		$textInput.blur(function(e) { 
			_this._blur(e);
		});
		
		var $searchButton = this.getSearchButton();
		if( $searchButton ) {
			$searchButton.click(function(e){
				_this._clickSearch(e);
			});
		};
	}
	
	,_focus: function(e) {
		var $textInput = this.getTextInput();
		if( this.options.initialSearchText ) {
			var value = $textInput.val();
			if(this.options.initialSearchText === value) {
				$textInput.val('');
			};
		};
		$textInput.select();
	}
	
	,_blur: function(e){
		if( this.options.initialSearchText ) {
			var $textInput = this.getTextInput();

			var value = $textInput.val();
			if( '' === value ) {
				$textInput.val(this.options.initialSearchText);
			};
		};
	}
	
	,_keyDown: function(e) {
		var charCode = null;
		if( null === e ) {
			e = window.event; // IE
		};
		if( null !== e ) {
			if( e.keyCode ) {
				charCode = e.keyCode;
			};
		};
		
		this.keyPressedSinceLastSearch = true;

//		$n2.log('_keyDown',charCode,e);
		if (13 === charCode || null === charCode) {
			// carriage return or I'm not detecting key codes
			// and have to submit on each key press - yuck...
			var $textInput = this.getTextInput();
			var line = $textInput.val();
			if( line && line.length > 0 ) {
				this._closeLookAhead($textInput);
				this.performSearch(line, $textInput);
			};
		};
	}
	
	,_clickSearch: function(e){
		var $textInput = this.getTextInput();
		var line = $textInput.val();
		if( line && line.length > 0 ) {
			this._closeLookAhead($textInput);
			this.performSearch(line, $textInput);
		};
	}
	
	,_closeLookAhead: function($textInput){
		if( !$textInput ) {
			$textInput = this.getTextInput();
		};
		if( $textInput.autocomplete ) {
			// Close autocomplete
			$textInput.autocomplete('close');
		};
	}
	
	,_processSearchResults: function(searchResults){
		var _this = this;
		
		if( this.options.displayFn ) {
			searchResults.type = 'results';
			this.options.displayFn(searchResults);
			
		} else if( this.options.dispatchService ) {
			this.options.dispatchService.send(DH, {
				type: 'searchResults'
				,results: searchResults
			});
			
		} else if( this.options.displayDiv ) {
			var $display = $('#'+this.options.displayDiv).empty();
			
			if( !searchResults ) return;
			
			if( searchResults.sorted.length < 1 ) {
				$display.append( $('<div>'+_loc('Search results empty')+'</div>') );
			} else {
				var docIds = [];
				for(var i=0,e=searchResults.sorted.length; i<e; ++i) {
					var docId = searchResults.list[i].id;
					
					if( docId ) {
						docIds.push(docId);
						var div = $('<div class="olkitSearchMod2_'+(i%2)
							+' n2searchDocId_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
						div.text(docId);
				
						$display.append(div);
					};
				};
				
				// Request data (THIS SHOULD ALL BE DONE IN N2.SHOW)
				this.searchServer.options.db.getDocuments({
					docIds: docIds
					,onSuccess: function(docs){
						for(var i=0,e=docs.length; i<e; ++i) {
							var doc = docs[i];
							
							if( doc ) {
								var $div = $('.n2searchDocId_'+$n2.utils.stringToHtmlId(doc._id));
								if( $div.length > 0 ) {
									$div.empty();
									$.olkitDisplay.DisplayDocument($div,doc);
								};
							};
						};
					}
				});
				
			};
		};
	}

	,_processSearchError: function(err){
		if( this.options.displayFn ) {
			var display = {
				type:'error'
				,error: err
			};

			this.options.displayFn(display);
			
		} else if( this.options.dispatchService ) {
			this.options.dispatchService.send(DH, {
				type: 'searchResults'
				,error: err
			});
			
		} else {
			var $display = $('#'+this.options.displayDiv).empty();
			$display.append( $('<div>'+_loc('Search error:')+err+'</div>') );
		};
	}

	,_displayWait: function(){
		if( this.options.displayFn ) {
			this.options.displayFn({type:'wait'});
		} else {
			var $displayDiv = $('#'+this.options.displayDiv).empty();
			$displayDiv.append( $('<div class="olkit_wait"></div>') );
		};
	}

	,_getJqAutoCompleteSource: function() {
		var _this = this;
		return function(request, cb) {
			_this._jqAutoComplete(request, cb);
		};
	}
	
	,_jqAutoComplete: function(request, cb) {
		// Redirect to look ahead service, but intercept
		// result.
		var _this = this;
		var lookAheadService = this.searchServer.getLookAheadService();
		lookAheadService._jqAutoComplete(request, function(res){
			if( _this.keyPressedSinceLastSearch ) {
				cb(res);
			} else {
				// suppress since the result of look ahead service
				// comes after search was requested
				cb(null);
			};
		});
	}

	,_handle: function(m){
		if( 'searchInitiate' === m.type ){
			var $textInput = this.getTextInput();
			$textInput.val(m.searchLine);
			
		} else if( 'selected' === m.type 
		 || 'unselected' === m.type ){
			var $textInput = this.getTextInput();
			if( this.options.initialSearchText ) {
				$textInput.val(this.options.initialSearchText);
			} else {
				$textInput.val('');
			};
		};
	}
});

// ============ SearchServer ========================

var SearchServer = $n2.Class({
	
	options: null
	
	,lookAheadService: null
	
	,initialize: function(opts_) {
		this.options = $n2.extend({
			designDoc: null
			,db: null
			,directory: null
			,searchView: 'text-search'
			,searchLimit: 25
			,lookAheadView: 'text-lookahead'
			,lookAheadList: 'text-lookahead'
			,lookAheadLimit: 5
			,lookAheadPrefixMin: 3
			,lookAheadCacheSize: 10
		},opts_);
		
		var _this = this;
		
		this.lookAheadService = null;
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var h = d.getHandle('n2.couchSearch');
			d.register(h,'searchInitiate',f);
		};
	}

	,getLookAheadService: function() {
		if( null === this.lookAheadService ) {
			this.lookAheadService = new LookAheadService(this.options);
		};
		
		return this.lookAheadService;
	}

	/*
	 * Creates a request for search terms and returns an
	 * object to represent the request. The returned object
	 * is an instance of class SearchRequest 
	 */
	,submitRequest: function(searchTerms, opts_) {
		var requestOptions = $n2.extend({
			designDoc: this.options.designDoc
			,db: this.options.db
			,searchView: this.options.searchView
			,searchLimit: this.options.searchLimit
		},opts_);
		
		return new SearchRequest(searchTerms, requestOptions);
	}
	
	,getJqAutoCompleteSource: function() {
		return this.getLookAheadService().getJqAutoCompleteSource();
	}
	
	,installSearch: function(opts_) {
		return new SearchInput(opts_, this);
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}
	
	,_handle: function(m){
		if( 'searchInitiate' === m.type ){
			var searchTerms = m.searchLine;

			var dispatcher = this._getDispatcher();
			var h = dispatcher.getHandle('n2.couchSearch');
			this.submitRequest(searchTerms, {
				onSuccess: function(searchResults){
					dispatcher.send(h, {
						type: 'searchResults'
						,results: searchResults
					});
				}
				,onError: function(err){
					dispatcher.send(h, {
						type: 'searchError'
						,error: err
					});
				}
			});
		};
	}
});

// ==================== Legacy =============================

//Install on jQuery the OLKIT callback
$.olkitSearchHandler = function(options_) {

	var options = $.extend({
		displayDiv: null // must be supplied
		,displayFn: null // must be supplied if displayDiv is not
		,textInputDivName: null // must be supplied
		,lookAheadDivName: null // must be supplied
		,designDoc: null // must be supplied
		,db: null // must be supplied
		
		,initialSearchText: null
		,inputName: '_olkit_searchInput'
		,searchView: 'text-search'
		,searchLimit: 25
		,lookAheadView: 'text-lookahead'
		,lookAheadList: 'text-lookahead'
		,lookAheadLimit: 5
		,lookAheadPrefixMin: 3
		,lookAheadCacheSize: 10
	},options_);

	
	var searchServer = new $n2.couchSearch.SearchServer({
		designDoc: options.designDoc
		,db: options.db
		,searchView: options.searchView
		,searchLimit: options.searchLimit
		,lookAheadView: options.lookAheadView
		,lookAheadList: options.lookAheadList
		,lookAheadLimit: options.lookAheadLimit
		,lookAheadPrefixMin: options.lookAheadPrefixMin
		,lookAheadCacheSize: options.lookAheadCacheSize
	});
	
	/*
	 * install search text input
	 */
	var input = $('<input id="'+options.inputName+'" type="text" class="search_panel_input"'+
		' value="'+options.initialSearchText+'"></input>');
	$("#"+options.textInputDivName).empty().append(input);

	searchServer.installSearch({
		textInput: input
		,searchButton: null
		,initialSearchText: options.initialSearchText
		,displayDiv: options.displayDiv
		,displayFn: options.displayFn
	});

};

// ================ API ===============================

$n2.couchSearch = {
	SearchServer: SearchServer
	,SearchRequest: SearchRequest
};

})(jQuery,nunaliit2);