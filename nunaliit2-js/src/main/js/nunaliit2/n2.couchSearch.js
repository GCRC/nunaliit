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

// Dispatcher
var DH = 'n2.couchSearch';

function SplitSearchTerms(line) {
	if( !line ) return null;
	
	var map = $n2.couchUtils.extractSearchTerms(line, false);

	var searchTerms = [];
	for(var term in map){
		var folded = map[term].folded;
		if( folded ) {
			searchTerms.push(folded);
		};
	};
	
	return searchTerms;
};

//============ ResearchResult ========================
// Class that convey the result of a research
var ResearchResult = $n2.Class({
	
	// identifier of the document found in research
	id: null,
	
	// How relevant this result is (lower number is better)
	index: null,
	
	// How many terms matched by this result
	count: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			id: null
			,index: null
			,count: null
		},opts_);
		
		this.id = opts.id;
		this.index = opts.index;
		
		if( opts.count ){
			this.count = opts.count;
		} else {
			this.count = 1;
		};
	},
	
	add: function(result){
		if( this.index > result.index ){
			this.index = result.index;
		};
		
		this.count += result.count;
	}
});

//============ Research ========================
// Abstract class that defines the API for researching
// a concept in the database
var Research = $n2.Class({
	
	id: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			
		},opts_);
		
		this.id = $n2.getUniqueId();
	},
	
	execute: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(resultMap, research){}
			,onError: function(err, research){}
			,onPartial: function(resultMap, research){}
		},opts_);

		throw 'Subclasses must implement method execute';
	}
});

//============ ResearchTerm ========================
// Specialization of Research that looks up all documents
// associated with one search term
var ResearchTerm = $n2.Class(Research,{
	textTerm: null,

	constraint: null,
	
	designDoc: null,
	
	searchView: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			textTerm: null
			,constraint: null
			,designDoc: null
			,searchView: null
		},opts_);
		
		Research.prototype.initialize.apply(this,arguments);

		this.textTerm = opts.textTerm;
		this.constraint = opts.constraint;
		this.designDoc = opts.designDoc;
		this.searchView = opts.searchView;
		
		if( typeof this.textTerm !== 'string' ){
			throw 'In ResearchTerm constructor, the textTerm must be a string';
		};
		if( typeof this.designDoc !== 'object' ){
			throw 'In ResearchTerm constructor, the designDoc must be provided';
		};
		if( typeof this.searchView !== 'string' ){
			throw 'In ResearchTerm constructor, the searchView must be provided';
		};
	},
	
	execute: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(resultMap, research){}
			,onError: function(err, research){}
			,onPartial: function(resultMap, research){}
		},opts_);

		// Search terms are stored lower case in database
		var term = this.textTerm.toLowerCase();
		
		var startKey = [term,0];
		var endKey = [term,{}];
		if( this.constraint ){
			startKey = [this.constraint,term,0];
			endKey = [this.constraint,term,{}];
		};
		
		this.designDoc.queryView({
			viewName: this.searchView
			,startkey: startKey
			,endkey: endKey
			,onSuccess: function(rows) {
				var resultsByDocId = {};
				for(var i=0,e=rows.length; i<e; ++i) {
					var docId = rows[i].id;
					var index = rows[i].key[1];
					
					if( resultsByDocId[docId] 
					 && resultsByDocId[docId].index <= index ){
						// Do nothing
					} else {
						var result = new ResearchResult({
							id: docId
							,index: index
						});
						resultsByDocId[docId] = result;
					};
				};
				
				opts.onSuccess(resultsByDocId);
			}
			,onError: function(err) {
				opts.onError(err);
			}
		});
	}
});

//============ ResearchDate ========================
// Specialization of Research that looks up all documents
// associated with a date interval
var ResearchDate = $n2.Class(Research,{
	
	dateInterval: null,

	dateService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dateInterval: null
			,dateService: null
		},opts_);
		
		Research.prototype.initialize.apply(this,arguments);

		this.dateInterval = opts.dateInterval;
		this.dateService = opts.dateService;
		
		if( typeof this.dateInterval !== 'object' ){
			throw 'In ResearchDate constructor, the dateInterval must be provided';
		};
		if( typeof this.dateService !== 'object' ){
			throw 'In ResearchDate constructor, the dateService must be provided';
		};
	},
	
	execute: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(resultMap, research){}
			,onError: function(err, research){}
			,onPartial: function(resultMap, research){}
		},opts_);
		
		this.dateService.getDocIdsFromInterval({
			interval: this.dateInterval
			,onSuccess: function(docIds){
				var dateResults = [];
				for(var i=0,e=docIds.length; i<e; ++i) {
					dateResults.push({
						docId: docIds[i]
						,index: 0
					});
				};
				var resultsByDocId = {};
				for(var i=0,e=docIds.length; i<e; ++i) {
					var docId = docIds[i];
					var index = 0;
					
					var result = new ResearchResult({
						id: docId
						,index: index
					});
					resultsByDocId[docId] = result;
				};
				
				opts.onSuccess(resultsByDocId);
			}
			,onError: function(err) {
				opts.onError(err);
			}
		});
	}
});

//============ ResearchUnion ========================
// Specialization of Research that accepts a number
// of instances of Research and provides a result which
// is a union of all research results from children.
var ResearchUnion = $n2.Class(Research,{
	
	childrenById: null,
	
	resultsByDocId: null,
	
	count: null,
	
	waiting: null,
	
	error: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			
		},opts_);
		
		Research.prototype.initialize.apply(this,arguments);
		
		this.childrenById = {};
		this.resultsByDocId = {};
	},
	
	addResearch: function(research){
		var id = research.id;
		this.childrenById[id] = research;
	},
	
	execute: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(resultMap, research){}
			,onError: function(err, research){}
			,onPartial: function(resultMap, research){}
		},opts_);
		
		var _this = this;

		var f = function(resultMap, research){
			_this._receiveResult(resultMap, research, opts.onSuccess, opts.onPartial);
		};
		
		// Reset error
		this.error = undefined;

		// Count children
		this.count = 0;
		for(var id in this.childrenById){
			++this.count;
		};
		this.waiting = this.count;
		
		// Request results
		this.resultsByDocId = {};
		for(var id in this.childrenById){
			var childResearch = this.childrenById[id];
			childResearch.execute({
				onSuccess: f
				,onError: function(err){
					--_this.waiting;
					if( !_this.error ){
						_this.error = err;
						opts.onError(err);
					};
				}
			});
		};

		if( this.count < 1 ){
			this._checkIfFinished(opts.onSuccess, opts.onPartial);
		};
	},
	
	_receiveResult: function(resultMap, research, onSuccess, onPartial){
		for(var docId in resultMap){
			var result = resultMap[docId];
			
			result.count = 1;
			
			if( this.resultsByDocId[docId] ){
				this.resultsByDocId[docId].add(result);
			} else {
				this.resultsByDocId[docId] = result;
			};
		};
		
		--this.waiting;
		this._checkIfFinished(onSuccess, onPartial);
	},
	
	_checkIfFinished: function(onSuccess, onPartial){
		if( this.error ){
			// Error already reported. Do nothing

		} else if( this.waiting < 1 ){
			// Complete
			onSuccess(this.resultsByDocId, this);

		} else {
			// Partial
			onPartial(this.resultsByDocId, this);
		};
	}
});

//============ ResearchIntersection ========================
// Specialization of Research that accepts a number
// of instances of Research and provides a result which
// is an intersection of all research results from children.
var ResearchIntersection = $n2.Class(Research,{
	
	childrenById: null,
	
	resultsByDocId: null,
	
	waiting: null,

	count: null,
	
	error: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			
		},opts_);
		
		Research.prototype.initialize.apply(this,arguments);
		
		this.childrenById = {};
		this.resultsByDocId = {};
	},
	
	addResearch: function(research){
		var id = research.id;
		this.childrenById[id] = research;
	},
	
	execute: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(resultMap, research){}
			,onError: function(err, research){}
			,onPartial: function(resultMap, research){}
		},opts_);
		
		var _this = this;

		var f = function(resultMap, research){
			_this._receiveResult(resultMap, research, opts.onSuccess, opts.onPartial);
		};
		
		// Reset error
		this.error = undefined;

		// Count children
		this.count = 0;
		for(var id in this.childrenById){
			++this.count;
		};
		this.waiting = this.count;
		
		// Request results
		this.resultsByDocId = {};
		for(var id in this.childrenById){
			var childResearch = this.childrenById[id];
			childResearch.execute({
				onSuccess: f
				,onError: function(err){
					--_this.waiting;
					if( !_this.error ){
						_this.error = err;
						opts.onError(err);
					};
				}
			});
		};

		if( this.count < 1 ){
			this._checkIfFinished(opts.onSuccess, opts.onPartial);
		};
	},
	
	_receiveResult: function(resultMap, research, onSuccess, onPartial){
		// The first time, accept all results
		if( this.waiting === this.count ){
			for(var docId in resultMap){
				var result = resultMap[docId];
				
				result.count = 1;
				
				this.resultsByDocId[docId] = result;
			};
		} else {
			// Import results that were already present
			for(var docId in resultMap){
				var result = resultMap[docId];
				
				if( this.resultsByDocId[docId] ) {
					this.resultsByDocId[docId].add(result);
				};
			};
			
			// Remove from previous results the one not offered by this
			// result map
			var docIdsToRemove = [];
			for(var docId in this.resultsByDocId){
				if( !resultMap[docId] ){
					docIdsToRemove.push(docId);
				};
			};
			for(var i=0,e=docIdsToRemove.length; i<e; ++i){
				var docId = docIdsToRemove[i];
				delete this.resultsByDocId[docId];
			};
		};
		
		--this.waiting;
		this._checkIfFinished(onSuccess, onPartial);
	},
	
	_checkIfFinished: function(onSuccess, onPartial){
		if( this.error ){
			// Error already reported. Do nothing

		} else if( this.waiting < 1 ){
			// Complete
			onSuccess(this.resultsByDocId, this);

		} else {
			// Partial
			onPartial(this.resultsByDocId, this);
		};
	}
});

//============ SearchRequest ========================
/*
 * Returns a search result:
 * {
 *    pending: <integer> // number of search terms that have not yet been returned
 *    ,actionReturnedCount: <integer> // number of search terms returned so far
 *    ,terms: <array of strings> // search terms
 *    ,sorted: <array of found result> // Sorted list of found results
 *    ,list: <array of found result> // Same as "sorted" but including only the found results
 *                                   // with the most search terms matched
 * }
 * 
 * found result:
 * {
 *    id: <document id>
 *    ,index: <integer> // earliest position of found term in a field
 *    ,terms: <integer> // number of terms matched
 * }
 */
var SearchRequest = $n2.Class({
	
	options: null,
	
	searchResults: null,
	
	initialize: function(searchTermsLine, opts_) {
		this.options = $n2.extend({
			designDoc: null
			,db: null
			,constraint: null
			,dateService: null
			,searchLimit: 25
			,onlyFinalResults: false
			,strict: true
			,onSuccess: function(searchResults){}
			,onError: function(err){ $n2.reportErrorForced(err); }
		},opts_);

		// If search terms are array, rejoin into a line
		if( $n2.isArray(searchTermsLine) ){
			searchTermsLine = searchTerms.join(' ');
		};
		
		// Extract dates and date ranges from search term line
		var dateTerms = [];
		if( this.options.dateService ){
			var dateStrings = $n2.date.findAllDateStrings(searchTermsLine);
			for(var i=0,e=dateStrings.length; i<e; ++i){
				dateTerms.push( dateStrings[i] );
				
				var dateStr = dateStrings[i].str;
				if( searchTermsLine.indexOf(dateStr) >= 0 ){
					searchTermsLine = searchTermsLine.replace(dateStr,'');
				};
			};
		};
		
		// Break out into search terms
		var searchTerms = undefined;
		if( typeof(searchTermsLine) === 'string' ) {
			searchTerms = SplitSearchTerms(searchTermsLine);
			if( !searchTerms ){
				searchTerms = [];
			};
		} else {
			throw 'Search terms must be a string or an array';
		};
		
		// Start research
		var research = undefined;
		if( this.options.strict ){
			research = new ResearchIntersection();
		} else {
			research = new ResearchUnion();
		};

		// Figure out view
		var searchView = 'text-search';
		if( this.options.constraint ){
			searchView = 'text-search-constrained';
		};

		// Initialize results
		this.searchResults = {
			terms: []
			,actionReturnedCount: 0
			,pending: 0
			,map: {}
			,sorted: []
			,list: []
		};
		
		// Add research for each term
		for(var i=0,e=searchTerms.length; i<e; ++i){
			var childResearch = new ResearchTerm({
				textTerm: searchTerms[i]
				,constraint: this.options.constraint
				,designDoc: this.options.designDoc
				,searchView: searchView
			});
			
			research.addResearch(childResearch);
			++this.searchResults.pending;
		};
		
		// Add research for dates. Each date research is a union between
		// a date interval research and a research of the terms. This is because
		// a user that enters a string that looks like a date but means to look
		// for a particular string should be able to find either one
		for(var i=0,e=dateTerms.length; i<e; ++i){
			var dateTerm = dateTerms[i];
			
			var childResearch = new ResearchUnion();
			
			// Add the date research
			var dateResearch = new ResearchDate({
				dateInterval: dateTerm.interval
				,dateService: this.options.dateService
			});
			childResearch.addResearch(dateResearch);
			
			// Split the terms and add them to the research, one at a time
			var textTerms = SplitSearchTerms(dateTerm.str);
			for(var j=0,k=textTerms.length; j<k; ++j){
				var textTerm = textTerms[j];
				
				var textResearch = new ResearchTerm({
					textTerm: textTerm
					,constraint: this.options.constraint
					,designDoc: this.options.designDoc
					,searchView: searchView
				});
				
				childResearch.addResearch(textResearch);
			};
			
			research.addResearch(childResearch);
			++this.searchResults.pending;
		};
		
		// Handle case where nothing is asked
		if( this.searchResults.pending < 1 ) {
			this._returnSearchResults();
			return;
		};
		
		// Execute research
		var _this = this;
		research.execute({
			onSuccess: function(resultMap, research){
				_this._receiveSearchResults(resultMap, false);
			}
			,onError: function(err, research){
				_this.searchResults = null;
				_this.options.onError(err);
			}
			,onPartial: function(resultMap, research){
				_this._receiveSearchResults(resultMap, true);
			}
		});
	},

	abortSearch: function() {
		this.searchResults = null;
	},
	
	/*
	 * Receives a map of results by docIds. Each result is:
	 * {
	 *    docId: <docId>
	 *    ,index: <integer>
	 *    ,count: <integer>
	 * }
	 * 
	 * The higher the count, the better the match
	 * The lower the index, the better the match.
	 */
	_receiveSearchResults: function(interimResults, isInterim) {
	
		var searchResults = this.searchResults;
		
		// Aborted
		if( !searchResults ) return;
		
		// Remember the returned response
		--searchResults.pending;
		++searchResults.actionReturnedCount;

		searchResults.map = interimResults;
		
		if( isInterim ) {
			if( !this.options.onlyFinalResults ){
				this._returnSearchResults();
			};
		} else {
			this._returnSearchResults();
		};
	},
	
	_returnSearchResults: function() {
		
		var searchResults = this.searchResults;

		// Aborted?
		if( !searchResults ) return;

		var _this = this;

		// Created sorted results. This is a list of all results
		// ordered in importance
		var maxCount = 0;
		searchResults.sorted = [];
		for(var docId in searchResults.map){
			var result = searchResults.map[docId];
			searchResults.sorted.push(result);
			if( maxCount < result.count ){
				maxCount = result.count;
			};
		};
		searchResults.sorted.sort(function(a,b){
			if( a.count > b.count ) {
				return -1;
			} else if( a.count < b.count ) {
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
		
		// Create list that should be consumed by the client. Include only
		// the results that match the most terms
		searchResults.list = [];
		for(var i=0,e=searchResults.sorted.length; i<e; ++i){
			var r = searchResults.sorted[i];
			if( r.count >= maxCount ) {
				searchResults.list.push(r);
			};
		};
		
		this.options.onSuccess(searchResults);
	}
});

//============ LookAheadService ========================

var LookAheadService = $n2.Class({

	designDoc: null,
	
	lookAheadLimit: null,
	
	lookAheadPrefixMin: null,
	
	lookAheadCacheSize: null,
	
	lookAheadMap: null,
	
	lookAheadCounter: null,
	
	constraint: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			designDoc: null
			,lookAheadLimit: 5
			,lookAheadPrefixMin: 3
			,lookAheadCacheSize: 10
			,constraint: null
		},opts_);
		
		this.designDoc = opts.designDoc;
		this.lookAheadLimit = opts.lookAheadLimit;
		this.lookAheadPrefixMin = opts.lookAheadPrefixMin;
		this.lookAheadCacheSize = opts.lookAheadCacheSize;
		this.constraint = opts.constraint;
		
		this.lookAheadMap = {};
		this.lookAheadCounter = 0;
	},
	
	setConstraint: function(constraint){
		this.constraint = constraint;
	},

	queryPrefix: function(prefix,callback) {
		var _this = this;
	
		var words = this._retrievePrefix(prefix);
		if( words ) {
			callback(prefix,words);
			return;
		};
		
		// Figure out query view
		var viewName = 'text-lookahead';
		if( this.constraint ){
			viewName = 'text-lookahead-constrained';
		};
		
		// Figure out start and end keys
		var startKey = [prefix,null];
		var endKey = [prefix + '\u9999',{}];
		if( this.constraint ){
			startKey = [this.constraint, prefix, null];
			endKey = [this.constraint, prefix + '\u9999', {}];
		};
		
		// Make request
		this.designDoc.queryView({
			viewName: viewName
			,listName: 'text-lookahead'
			,startkey: startKey
			,endkey: endKey
			,top: this.lookAheadLimit
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
	},
	
	queryTerms: function(terms,callback) {

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
		if( lastTerm.length < this.lookAheadPrefixMin ) {
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
	},
	
	_cachePrefix: function(prefixResult) {
		
		// Save result under prefix
		this.lookAheadMap[prefixResult.prefix] = prefixResult;
		
		// Mark generation
		prefixResult.counter = this.lookAheadCounter;
		++(this.lookAheadCounter);
		
		// Trim cache
		var keysToDelete = [];
		var cachedMap = this.lookAheadMap; // faster access
		var limit = this.lookAheadCounter - this.lookAheadCacheSize;
		for(var key in cachedMap) {
			if( cachedMap[key].counter < limit ) {
				keysToDelete.push(key);
			};
		};
		for(var i=0,e=keysToDelete.length; i<e; ++i) {
			delete cachedMap[keysToDelete[i]];
		};
	},
	
	_retrievePrefix: function(prefix) {
		
		// Do we have exact match in cache?
		if( this.lookAheadMap[prefix] ) {
			return this.lookAheadMap[prefix].words;
		};
		
		// Look for complete results from shorter prefix
		var sub = prefix.substring(0,prefix.length-1);
		while( sub.length >= this.lookAheadPrefixMin ) {
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
	},

	getJqAutoCompleteSource: function() {
		var _this = this;
		return function(request, cb) {
			_this._jqAutoComplete(request, cb);
		};
	},
	
	_jqAutoComplete: function(request, cb) {
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
			,constraint: null
			,displayFn: null // one of displayFn or
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
		this.textInputId = $n2.utils.getElementIdentifier($textInput);
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
		
		if( !this.options.initialSearchText ){
			this.options.initialSearchText = '';
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
	
	,getSearchLine: function(){
		var $textInput = this.getTextInput();
		var line = $textInput.val();
		if( line && line.length > 0 ) {
			if( line === this.options.initialSearchText ){
				return '';
			} else {
				return line;
			};
		} else {
			return '';
		};
	}
	
	,performSearch: function(line){
		
		var _this = this;

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
			var line = this.getSearchLine();
			if( line.length > 0 ) {
				this._closeLookAhead();
				this.performSearch(line);
				this._closeLookAhead();
			};
		};
	}
	
	,_clickSearch: function(e){
		var line = this.getSearchLine();
		if( line.length > 0 ) {
			this._closeLookAhead();
			this.performSearch(line);
			this._closeLookAhead();
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
			
		} else {
			$n2.log('Unable to return search results');
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
		};
	}

	,_displayWait: function(){
		if( this.options.displayFn ) {
			this.options.displayFn({type:'wait'});
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
	
	options: null,

	designDoc: null,
	
	db: null,
	
	dateService: null,
	
	dispatchService: null,
	
	customService: null,
	
	constraint: null,
	
	searchLimit: null,
	
	lookAheadLimit: null,
	
	lookAheadPrefixMin: null,
	
	lookAheadCacheSize: null,
	
	lookAheadService: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			designDoc: null
			,db: null
			,dateService: null
			,dispatchService: null
			,customService: null
			,constraint: null
			,searchLimit: 25
			,lookAheadLimit: 5
			,lookAheadPrefixMin: 3
			,lookAheadCacheSize: 10
		},opts_);
		
		var _this = this;

		this.designDoc = opts.designDoc;
		this.db = opts.db;
		this.dateService = opts.dateService;
		this.dispatchService = opts.dispatchService;
		this.customService = opts.customService;
		this.constraint = opts.constraint;
		this.searchLimit = opts.searchLimit;
		this.lookAheadLimit = opts.lookAheadLimit;
		this.lookAheadPrefixMin = opts.lookAheadPrefixMin;
		this.lookAheadCacheSize = opts.lookAheadCacheSize;

		this.lookAheadService = null;

		var d = this.dispatchService;
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var h = d.getHandle('n2.couchSearch');
			d.register(h,'searchInitiate',f);
		};
	},
	
	setConstraint: function(constraint){
		this.constraint = constraint;
		
		if( this.lookAheadService ){
			this.lookAheadService.setConstraint(constraint);
		};
	},

	getLookAheadService: function() {
		if( null === this.lookAheadService ) {
			this.lookAheadService = new LookAheadService({
				designDoc: this.designDoc
				,lookAheadLimit: this.lookAheadLimit
				,lookAheadPrefixMin: this.lookAheadPrefixMin
				,lookAheadCacheSize: this.lookAheadCacheSize
				,constraint: this.constraint
			});
		};
		
		return this.lookAheadService;
	},

	/*
	 * Creates a request for search terms and returns an
	 * object to represent the request. The returned object
	 * is an instance of class SearchRequest 
	 */
	submitRequest: function(searchTerms, opts_) {
		var requestOptions = $n2.extend({
			designDoc: this.designDoc
			,db: this.db
			,dateService: this.dateService
			,searchLimit: this.searchLimit
			,constraint: this.constraint
		},opts_);
		
		return new SearchRequest(searchTerms, requestOptions);
	},
	
	getJqAutoCompleteSource: function() {
		return this.getLookAheadService().getJqAutoCompleteSource();
	},
	
	installSearch: function(opts_) {
		return new SearchInput(opts_, this);
	},
	
	installSearchWidget: function(opts_) {
		var opts = $n2.extend({
			elem: null
			,label: null
			,useButton: false
			,buttonLabel: null
			,doNotDisable: false
			,constraint: null
		},opts_);
		
		var customService = this.customService;
		
		// Parent element
		var $elem = $(opts.elem);

		// Text box label
		var searchWidgetLabel = opts.label;
		if( null === searchWidgetLabel 
		 && customService){
			searchWidgetLabel = customService.getOption('searchWidgetText',null);
		};
		if( null === searchWidgetLabel ){
			searchWidgetLabel = _loc('search the atlas');
		};

		// Text box
		$elem.empty();
		var searchInput = $('<input type="text">')
			.addClass('search_panel_input')
			.val( searchWidgetLabel )
			.appendTo($elem);
		
		if( opts.doNotDisable ){
			// OK
		} else {
			searchInput.addClass('n2_disable_on_edit');
		};
		
		// Search button label
		var searchButtonLabel = opts.buttonLabel;
		if( null === searchButtonLabel 
		 && customService ){
			searchButtonLabel = customService.getOption('searchButtonText',null);
		};
		if( null === searchButtonLabel ){
			searchButtonLabel = _loc('Search');
		};
		
		// Search button
		var searchButton = null;
		if( opts.useButton ){
			searchButton = $('<input type="button">')
				.val( searchButtonLabel )
				.appendTo($elem);
		};
		
		return new SearchInput({
				textInput: searchInput
				,initialSearchText: searchWidgetLabel
				,dispatchService: this.dispatchService
				,searchButton: searchButton
				,constraint: opts.constraint
			}, this);
	},
	
	_handle: function(m){
		if( 'searchInitiate' === m.type ){
			var searchTerms = m.searchLine;

			var dispatcher = this.dispatchService;
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

// ================ API ===============================

$n2.couchSearch = {
	SearchServer: SearchServer
	,SearchRequest: SearchRequest
};

})(jQuery,nunaliit2);