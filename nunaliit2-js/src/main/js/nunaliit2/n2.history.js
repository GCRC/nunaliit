/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
,TYPE_SELECTED = 'x'
,TYPE_MULTI_SELECTED = 'm'
,TYPE_SEARCH = 's'
;

// ======================= HASH ENCODING ==============================
// The hash stored in the URL is a Base64 encoding of a JSON object.
// The JSON object has the following syntax:
// {
//   t: <string, type>
//   ,s: <number, timestamp>
//   ...
// }
//
// where the type (t) is one of
//    'x' for user selection
//    'm' for user multi-selection
//    's' for user search
//
//
// User Selection:
// {
//   t: 'x'  (TYPE_SELECTED)
//   ,s: <number, timestamp>
//   ,i: <string, document id>
// }
//
// This is a user selection for a particular document id.
//
//
// User Multi-Selection:
// {
//   t: 'm'  (TYPE_MULTI_SELECTED)
//   ,s: <number, timestamp>
// }
//
// This is a user selection for multiple document ids. Since the hash
// might not have the capacity to store a long list of document ids, a
// timestamp is stored in the hash, instead. This timestamp is related to
// a list of document identifiers (array) using the session storage.
//
//
// User Search:
// {
//   t: 's'  (TYPE_SEARCH)
//   ,s: <number, timestamp>
//   ,l: <string, search parameters>
// }
//
// This is a user search action. The search line is stored in the
// 'l' key.


//======================= UTILITIES ===================================
function computeHashFromEntry(entry){
	var json = JSON.stringify(entry);
	var hash = $n2.Base64.encode(json);
	return hash;
};
 
function decodeEntryFromHash(hash){
	var entry = undefined;
	
	try {
		var d = $n2.Base64.decode(hash);
		entry = JSON.parse(d);
	} catch(s) {};
	
	return entry;
};

function createNewEntry(entry){
	if( !entry.s ){
		entry.s = (new Date()).getTime();
	};
	return entry;
};

function getCurrentHash(){
	var hash = window.location.hash;
	if( hash ) {
		hash = hash.substr(1); 
	};
	return hash;
};

function getEventFromHash(hash){
	var event = undefined;
	
	if( 'nostate' === hash ){
		// No event
		
	} else if( !hash || '' === hash ){
		event = {
			type: 'unselected'
		};
	} else {
		var entry = decodeEntryFromHash(hash);
		
		if( entry && TYPE_SELECTED === entry.t ){
			var docId = entry.i;
			event = {
				type: 'userSelect'
				,docId: docId
			};

		} else if( entry && TYPE_MULTI_SELECTED === entry.t ){
			var timestamp = entry.s;
			
			var info = getStorageInfo(timestamp);
			var docIds = info.docIds;
			if( !docIds ){
				docIds = [];
			};
			
			event = {
				type: 'userSelect'
				,docIds: docIds
			};
		
		} else if( entry && TYPE_SEARCH === entry.t ){
			var searchLine = entry.l;
			event = {
				type: 'searchInitiate'
				,searchLine: searchLine
			};
		};
	};
	
	return event;
};

function getEventFromHref(href){
	
	var url = new $n2.url.Url({
		url: href
	});
	var hash = url.getHash();
	return getEventFromHash(hash);
};

//======================= HISTORY =====================================
// This class mimicks the information stored in the browser's history.
// This class is needed because deeper queries are needed than what
// is offered by the browsers.

function reloadStoredHistories(){
	var storage = $n2.storage.getSessionStorage();
	var value = storage.getItem('n2_history');
	
	var raw = null;
	try {
		raw = JSON.parse(value);
	} catch(e) {
		raw = {};
	};
	if( !raw ){
		raw = {};
	};
	
	var histories = [];
	for(var sessionId in raw){
		var h = raw[sessionId];
		var history = new History({
			sessionId: sessionId
		});
		history._reloadFromJson(h);
		histories.push(history);
	};
	
	return histories;
};

var History = $n2.Class({
	
	sessionId: null,
	
	dispatchService: null,
	
	entries: null,
	
	currentEntry: null,
	
	lastUpdated: null,

	lastHref: null,

	lastHistorySize: null,
	
	retrievedFromStorage: null,
	
	hint: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			sessionId: undefined
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.sessionId = opts.sessionId;
		this.dispatchService = opts.dispatchService;
		
		this.entries = [];
		this.currentEntry = undefined;
		this.lastHref = undefined;
		this.lastHistorySize = undefined;
		this.lastUpdated = undefined;
		this.retrievedFromStorage = false;
		this.hint = undefined;
		
		if( !this.sessionId ){
			this.sessionId = 's' + (new Date()).getTime();
		};
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			var DH = 'n2.history.History';
			
			this.dispatchService.register(DH,'start',f);
			this.dispatchService.register(DH,'historyHashModified',f);
			this.dispatchService.register(DH,'historyGetState',f);
			this.dispatchService.register(DH,'historyBack',f);
			this.dispatchService.register(DH,'historyForward',f);
		};
	},
	
	saveToStorage: function(){
		function removeOldestEntry(raw){
			var histories = [];
			for(var sessionId in raw){
				var h = raw[sessionId];
				histories.push({
					s: sessionId
					,h: h
				});
			};
			
			histories.sort(function(a,b){
				var aTime = a.h.lastUpdated;
				var bTime = b.h.lastUpdated;
				
				if( aTime < bTime ) -1;
				if( aTime > bTime ) 1;

				return 0;
			});
			
			if( histories.length > 1 ){
				var sessionId = histories[0].s;
				delete raw[sessionId];
				return true;
			};
			
			return false;
		};
		
		// Create object to represent history
		var h = {
			entries: []
			,lastUpdated: this.lastUpdated
		};
		for(var i=0,j=this.entries.length; i<j; ++i){
			var entry = this.entries[i];
			var e = {
				h: entry.href
				,i: entry.historySize
			};
			h.entries.push(e);
		};

		var storage = $n2.storage.getSessionStorage();
		var value = storage.getItem('n2_history');
		
		var raw = null;
		try {
			raw = JSON.parse(value);
		} catch(e) {
			raw = {};
		};
		if( !raw ){
			raw = {};
		};
		
		raw[this.sessionId] = h;

		var newValue = JSON.stringify(raw);
		while( newValue.length > 2000000 ){
			var removed = removeOldestEntry(raw);
			if( removed ){
				newValue = JSON.stringify(raw);
			} else {
				break;
			};
		};
		
		storage.setItem('n2_history', newValue);
	},

	_reloadFromJson: function(h){
		this.entries = [];
		if( h && h.entries ){
			for(var i=0,j=h.entries.length; i<j; ++i){
				var e = h.entries[i];
				var entry = {
					href: e.h
					,historySize: e.i
					,event: getEventFromHref(e.h)
				};
				this.entries.push(entry);
			};
		};
		this.lastUpdated = h.lastUpdated;
	},

	_reloadFromStorage: function(href,historySize){
		var reloaded = false;

		if( !this.retrievedFromStorage ){
			var histories = reloadStoredHistories();
			
			var candidateCount = 0;
			var candidateHistory = undefined;
			var candidateEntry = undefined;
			for(var i=0,j=histories.length; i<j; ++i){
				var history = histories[i];
				var entry = history._entryWithHref(href,historySize);
				if( entry ){
					++candidateCount;
					candidateHistory = history;
					candidateEntry = entry;
				};
			};
			
			if( 1 === candidateCount ){
				if( this.sessionId === candidateHistory.sessionId ){
					// No need to reload. What we found in storage
					// is a copy of this history. What is in memory is
					// fine.
				} else {
					// Adopt this history
					this.sessionId = candidateHistory.sessionId;
					this.lastUpdated = candidateHistory.lastUpdated;
					
					var entries = [];
					for(var i=0,j=candidateHistory.entries.length; i<j; ++i){
						var entry = candidateHistory.entries[i];
						entries.push(entry);
					};
					this.entries = entries;
					this.currentEntry = candidateEntry;

					reloaded = true;
				};

				this.retrievedFromStorage = true;
			};
		};
		
		return reloaded;
	},
	
	_entryWithHref: function(href, historySize){
		var entry = undefined;
		
		for(var i=0,j=this.entries.length; i<j; ++i){
			var e = this.entries[i];
			if( e.href === href ){
				if( e.historySize <= historySize ){
					entry = e;
				};
			};
		};
		
		return entry;
	},
	
	_indexFromEntry: function(entry){
		var index = undefined;
		for(var i=0,j=this.entries.length; i<j; ++i){
			var e = this.entries[i];
			if( e === entry ){
				index = i;
			};
		};
		return index;
	},
	
	_handle: function(m, addr, dispatcher){
		if( m ){
			if( 'historyHashModified' === m.type ){
				this._checkHistoryChange();

			} else if( 'start' === m.type ) {
				this._checkHistoryChange();

			} else if( 'historyGetState' === m.type ) {
				// Synchronous call
				var state = this._computeState();
				m.state = state;

			} else if( 'historyBack' === m.type ) {
				this.hint = 'back';

			} else if( 'historyForward' === m.type ) {
				this.hint = 'forward';
			};
		};
	},
	
	_checkHistoryChange: function(){
		var historySize = undefined;
		if( window && window.history ){
			historySize = window.history.length;
		};
		
		var href = window.location.href;

		if( this.lastHref !== href ){
			this._historyChanged(href, historySize);
		};
	},

	_historyChanged: function(href, historySize){
		function insertNewEntry(history, href, historySize){
			var entry = {
				href: href
				,historySize: historySize
				,event: getEventFromHref(href)
			};
			
			// Replace the entry with the same history index and remove the
			// entries after
			var found = undefined;
			for(var i=0,j=history.entries.length; i<j; ++i){
				var e = history.entries[i];
				if( e.historySize === historySize ){
					found = i;
					break;
				};
			};

			if( typeof found === 'number' ){
				history.entries = history.entries.slice(0,found);
			};
			
			history.entries.push(entry);
			history.currentEntry = entry;
		};

		//$n2.log('historySize:'+historySize+' href:'+href);
		
		// See if we can find the full history from storage
		var reloaded = this._reloadFromStorage(href, historySize);
		if( reloaded ){
			$n2.log('history reloaded from storage');

		} else if( this.lastHistorySize !== historySize ){
			// This happens only when the history is modified
			// Must create a new entry
			insertNewEntry(this, href, historySize);
			
		} else {
			// In general, when the index does not change, it is because
			// the user is moving forward and back through the history
			// Find entries with matching href
			var indices = [];
			var currentIndex = undefined;
			for(var i=0,j=this.entries.length; i<j; ++i){
				var e = this.entries[i];
				if( e.href === href ){
					indices.push(i);
				};
				if( e === this.currentEntry ){
					currentIndex = i;
				};
			};

			if( indices.length < 1 ){
				// Can not find a matching entry. Has the last entry changed?
				// This happens when while the second last href is displayed,
				// a new one is selected
				if( this.currentEntry 
				 && this.currentEntry.historySize === (historySize - 1) ){
					insertNewEntry(this, href, historySize);

				} else {
					// Not sure what to do here
					$n2.log('history problem. Lost position');
				};

			} else {
				// If hint is 'back', then reverse the indices in
				// order to favour indices earlier in the history
				if( 'back' === this.hint ){
					indices.reverse();
				};

				// Find closest entry and make it current
				var minDistance = undefined;
				var minIndex = undefined;
				if( typeof currentIndex === 'number' ){
					for(var i=0,j=indices.length; i<j; ++i){
						var index = indices[i];
						var distance = (index < currentIndex) ?
								currentIndex - index :
								index - currentIndex;
						if( typeof minDistance === 'undefined' ){
							minDistance = distance;
							minIndex = index;

						} else if(distance <= minDistance) {
							minDistance = distance;
							minIndex = index;
						};
					};
				};
				
				if( typeof minIndex === 'number' ){
					var currentEntry = this.entries[minIndex];
					this.currentEntry = currentEntry;
				};
			};
		};
		
		this.lastHref = href;
		this.lastHistorySize = historySize;

		this.lastUpdated = (new Date()).getTime();
		this.saveToStorage();
		this._reportChange();
	},
	
	_computeState: function(){
		var currentIndex = this._indexFromEntry(this.currentEntry);

		var backIsAvailable = false;
		var forwardIsAvailable = false;
		if( typeof currentIndex === 'number' ){
			if( currentIndex > 0 ){
				backIsAvailable = true;
			};
			if( currentIndex < (this.entries.length - 1) ){
				forwardIsAvailable = true;
			};
		};
		
		var state = {
			entries: this.entries
			,currentEntry: this.currentEntry
			,currentIndex: currentIndex
			,backIsAvailable: backIsAvailable
			,forwardIsAvailable: forwardIsAvailable
		};
		
		return state;
	},
	
	_reportChange: function(){
		var state = this._computeState();
		
		var m = {
			type: 'historyReportState'
			,state: state
		};
		this._dispatch(m);
		
		//$n2.log('historyReportState', state);
	},
	
	_dispatch: function(m){
		var d = this.dispatchService;
		if( d ){
			d.send('n2.history.History',m);
		};
	}
});

// ======================= MONITOR ====================================
// Tracks the changes to hash and reports them as dispatcher messages.
// Accepts 'historyBack', 'historyForward' and 'setHash' messages.

var Monitor = $n2.Class({
	
	options: null,
	
	initialize: function(opts_){
		this.options = $n2.extend({
			directory: null
		},opts_);
		
		var _this = this;
		
		if( window && 'onhashchange' in window ) {
			// Supported
			$(window).bind('hashchange',function(e){
				_this._hashChange(e);
			});
		};
		
		var oldHref = document.location.href;

		window.onload = function() {

			var
			bodyList = document.querySelector("body")

			,observer = new MutationObserver(function(mutations) {

				mutations.forEach(function(mutation) {

					if (oldHref != document.location.href) {

						oldHref = document.location.href;

						_this._urlChanged();

					}

				});

			});

			var config = {
					childList: true,
					subtree: true
			};

			observer.observe(bodyList, config);

		};
		
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var DH = 'n2.history.Monitor';

			d.register(DH,'historyBack',f);
			d.register(DH,'historyForward',f);
			d.register(DH,'setHash',f);
			d.register(DH,'replaceHash',f);
		};
	},

	_urlChanged: function(){
		$n2.log('URL CHANGED');
	},
	
	_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	},

	_dispatch: function(m){
		var d = this._getDispatcher();
		if( d ){
			d.send('n2.history.Monitor',m);
		};
	},
	
	_hashChange: function(e){
		var hash = getCurrentHash();

		// Report changes in hash from browser
		this._dispatch({
			type: 'hashChanged'
			,hash: hash
		});

		// Event associated with all changes top hash
		this._dispatch({
			type: 'historyHashModified'
			,hash: hash
		});
	},
	
	_handle: function(m){
		if( 'historyBack' === m.type ){
			if( window.history.back ) {
				window.history.back();
			};
			
		} else if( 'historyForward' === m.type ){
			if( window.history.forward ) {
				window.history.forward();
			};
			
		} else if( 'setHash' === m.type ){
			var hash = m.hash;
			if( window.history.pushState ){
				if( hash ) {
					window.history.pushState({},'','#'+hash);
				} else {
					window.history.pushState({},'','#');
				};
			} else {
				if( hash ) {
					window.location = '#'+hash;
				} else {
					window.location = '#';
				};
			};

			this._dispatch({
				type: 'historyHashModified'
				,hash: getCurrentHash()
			});
			
		} else if( 'replaceHash' === m.type ){
			var hash = m.hash;
			if( window.history.replaceState ){
				if( hash ) {
					window.history.replaceState({},'','#'+hash);
				} else {
					window.history.replaceState({},'','#');
				};
			} else {
				if( hash ) {
					window.location = '#'+hash;
				} else {
					window.location = '#';
				};
			};

			this._dispatch({
				type: 'historyHashModified'
				,hash: getCurrentHash()
			});
		};
	}
});
	
//======================= TRACKER ====================================
// Keeps track of currently selected document and encodes it in the
// URL. On hashChanged events, re-selects the document.

var Tracker = $n2.Class({
	
	options: null,
	
	last: null,
	
	waitingDocId: null,
	
	forceHashReplay: null,
	
	initialize: function(opts_){
		this.options = $n2.extend({
			dispatchService: null
			,disabled: false
		},opts_);
		
		var _this = this;
		
		this.last = {};
		this.forceHashReplay = false;
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var DH = 'n2.history.Tracker';

			d.register(DH,'start',f);
			d.register(DH,'hashChanged',f);
			d.register(DH,'userSelect',f);
			d.register(DH,'userSelectCancelled',f); 
			d.register(DH,'unselected',f);
			d.register(DH,'documentCreated',f);
			d.register(DH,'documentUpdated',f);
			d.register(DH,'documentDeleted',f);
			d.register(DH,'searchInitiate',f);
			d.register(DH,'editInitiate',f);
			d.register(DH,'editCreateFromGeometry',f);
			d.register(DH,'editClosed',f);
		};
	},
	
	getForceHashReplay: function(){
		return this.forceHashReplay;
	},
	
	setForceHashReplay: function(flag){
		if( flag ){
			this.forceHashReplay = true;
		} else {
			this.forceHashReplay = false;
		};
	},

	_getDispatcher: function(){
		var d = null;
		if( this.options ){
			d = this.options.dispatchService;
		};
		return d;
	},

	_dispatch: function(m){
		var d = this._getDispatcher();
		if( d ){
			d.send('n2.history.Tracker',m);
		};
	},

	_synchronousCall: function(m){
		var d = this._getDispatcher();
		if( d ){
			d.synchronousCall('n2.history.Tracker',m);
		};
	},
	
	_handle: function(m){
		if( this.options.disabled ){
			return;
		};

		if( 'start' === m.type ){
			var hash = getCurrentHash();
			if( hash && hash !== '') {
				this._dispatch({
					type: 'hashChanged'
					,hash: hash
				});
			};

		} else if( 'userSelect' === m.type ){
			if( m.docId ) {
				this.last = {
					selected: m.docId	
				};
	
				if( !m._suppressSetHash ) {
					var type = 'setHash';
					if( m._replaceHash ) type = 'replaceHash';
					
					var entry = createNewEntry({t:TYPE_SELECTED,i:m.docId});
					var hash = computeHashFromEntry(entry);
					this._dispatch({
						type: type
						,hash: hash
					});

					this.waitingDocId = null;
				};

			} else if( m.docIds ) {
				this.last = {
					multi_selected: m.docIds
				};
	
				if( !m._suppressSetHash ) {
					var type = 'setHash';
					if( m._replaceHash ) type = 'replaceHash';

					// Save doc ids with a session object associated
					// with the timestamp
					var ts = (new Date()).getTime();
					saveStorageInfo(ts, {
						docIds: m.docIds
					});
					
					var entry = createNewEntry({t:TYPE_MULTI_SELECTED,s:ts});
					var hash = computeHashFromEntry(entry);
					this._dispatch({
						type: type
						,hash: hash
					});

					this.waitingDocId = null;
				};
			};

		} else if( 'userSelectCancelled' === m.type ){
			this.last = {
				selectCancel: true
			};

			if( !m._suppressSetHash ) {
				this._dispatch({
					type: 'historyBack'
				});
			};

		} else if( 'userUnselect' === m.type ){
			this.last = {
				unselected: true	
			};

			if( !m._suppressSetHash ) {
				this._dispatch({
					type: 'setHash'
					,hash: null
				});

				this.waitingDocId = null;
			};

		} else if( 'documentDeleted' === m.type ){
			var deletedDocId = m.docId;
			if( this.last.selected === deletedDocId ){
				this.last = {
					deleted: deletedDocId
				};
				
				this._dispatch({
					type: 'historyBack'
				});
			};

		} else if( 'searchInitiate' === m.type ){
			this.last = {
				search: m.searchLine
			};

			if( !m._suppressSetHash ) {
				var entry = createNewEntry({t:TYPE_SEARCH,l:m.searchLine});
				var hash = computeHashFromEntry(entry);
				this._dispatch({
					type: 'setHash'
					,hash: hash
				});

				this.waitingDocId = null;
			};

		} else if( 'editInitiate' === m.type 
		 ||  'editCreateFromGeometry' === m.type ){
			this.last = {
				edit: true
			};

			this.waitingDocId = null;

			this._dispatch({
				type: 'setHash'
				,hash: 'nostate'
			});

		} else if( 'editClosed' === m.type ) {
			var lastIsEditInitiate = false;
			if( this.last.edit ){
				lastIsEditInitiate = true;
			};
			
			this.last = {
				editClosed: true
			};

			if( m.inserted && !m.submissionDs) {
				// A document was created. Select it so it is reflected in the
				// history hash
				this._dispatch({
					type: 'userSelect'
					,docId: m.doc._id
					,_replaceHash: true
				});

			} else if( m.inserted && m.submissionDs ){
				// For now, go back and wait for document
				if(lastIsEditInitiate) {
					this._dispatch({
						type: 'historyBack'
					});
				};
				
				this.waitingDocId  = m.doc._id;

			} else {
				// cancelled or deleted
				if(lastIsEditInitiate) {
					this._dispatch({
						type: 'historyBack'
					});
				};
			};

		} else if( 'hashChanged' === m.type ){
			var o = null;

			if( !this.last.editClosed ){
				this.waitingDocId = null;
			};
			
			if( 'nostate' === m.hash ){
				// Do not do anything
				
			} else {
				var c = {
					type: 'historyIsHashChangePermitted'
					,permitted: true
				};
				this._synchronousCall(c);
				
				if( c.permitted ){
					if( '' === m.hash || !m.hash ){
						if( !this.last.unselected ){
							this._dispatch({
								type: 'unselected'
								,_suppressSetHash: true
							});
						};
						
					} else  {
						// Attempt to interpret hash
						this._reloadHash(m.hash);
					};					
				} else {
					// Go back to edit state
					this._dispatch({
						type: 'historyForward'
					});
				};
			};

		} else if( 'documentCreated' === m.type 
		 || 'documentUpdated' === m.type ){
			if( m.docId && m.docId === this.waitingDocId ){
				// OK, we have been waiting for this document. Select it
				this._dispatch({
					type: 'userSelect'
					,docId: m.docId
				});
			};
		};
	},
	
	_reloadHash: function(hash){
		var m = getEventFromHash(hash);
		
		if( m ){
			m._suppressSetHash = true;
			
			if( 'userSelect' === m.type
			 && typeof m.docId === 'string'
			 && this.last.selected === m.docId ){
				// Do not replay selection if already selected
				if( this.forceHashReplay ){
					// Unless specifically requested
					this._dispatch(m);
				};

			} else {
				this._dispatch(m);
			};
		};
	}
});

// ======================= SESSION STORAGE ========================
// Handle saving information relating to a URL

function getStorageInfo(timestamp){
	var storage = $n2.storage.getSessionStorage();
	var value = storage.getItem('n2_historyHash');
	if( !value ){
		return {};
	};
	
	var raw = null;
	try {
		raw = JSON.parse(value);
	} catch(e) {
		$n2.log('Error parsing history hash(1):'+value);
		raw = {};
	};
	if( !raw ){
		raw = {};
	};
	
	var info = raw[''+timestamp];
	if( !info ){
		return {};
	};
	return info;
};

function saveStorageInfo(timestamp, info){
	$n2.log('Save hash '+timestamp);
	var storage = $n2.storage.getSessionStorage();
	var value = storage.getItem('n2_historyHash');
	
	var raw = null;
	try {
		raw = JSON.parse(value);
	} catch(e) {
		$n2.log('Error parsing history hash(2):'+value);
		raw = {};
	};
	if( !raw ){
		raw = {};
	};
	
	raw[''+timestamp] = info;
	var newValue = JSON.stringify(raw);
	while( newValue.length > 2000000 ){
		_removeOldestEntry(raw);
		newValue = JSON.stringify(raw);
	};
	
	storage.setItem('n2_historyHash', newValue);

	return value;
};

function _removeOldestEntry(raw){
	var oldestKey = null;
	for(var key in raw){
		if( !oldestKey ){
			oldestKey = key;
		} else if( key < oldestKey ) {
			oldestKey = key;
		};
	};
	if( oldestKey ){
		delete raw[oldestKey];
	};
};

//======================= EXPORT ++++++++++========================
$n2.history = {
	Monitor: Monitor
	,Tracker: Tracker
	,History: History
};

})(jQuery,nunaliit2);
