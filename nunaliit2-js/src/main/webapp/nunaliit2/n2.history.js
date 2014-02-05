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

$Id: n2.form.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.core.js
// @requires n2.utils.js
// @requires n2.class.js

;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var TYPE_SELECTED = 'x';
var TYPE_SEARCH = 's';

// ======================= MONITOR ====================================
// Tracks the changes to hash and reports them as dispatcher messages.
// Accepts 'historyBack', 'historyForward' and 'setHash' messages.

var Monitor = $n2.Class({
	
	options: null
	
	,initialize: function(opts_){
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
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var h = d.getHandle('n2.history');
			d.register(h,'historyBack',f)
			d.register(h,'historyForward',f)
			d.register(h,'setHash',f)
			d.register(h,'replaceHash',f)
		};
	}

	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}

	,_dispatch: function(m){
		var d = this._getDispatcher();
		if( d ){
			var h = d.getHandle('n2.history');
			d.send(h,m);
		};
	}
	
	,_hashChange: function(e){
		var hash = window.location.hash;
		if( hash ) { hash = hash.substr(1); };
		
		var m = {
			type: 'hashChanged'
			,hash: hash
		};
		this._dispatch(m);
	}
	
	,_handle: function(m){
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
		};
	}
});
	
//======================= MONITOR ====================================
// Keeps track of currently selected document and encodes it in the
// URL. On hashChanged events, re-selects the document.

var Tracker = $n2.Class({
	
	options: null
	
	,last: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			directory: null
			,disabled: false
		},opts_);
		
		var _this = this;
		
		this.last = {};
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var h = d.getHandle('n2.history.Tracker');
			d.register(h,'start',f);
			d.register(h,'hashChanged',f);
			d.register(h,'userSelect',f);
			d.register(h,'unselected',f);
			d.register(h,'documentDeleted',f);
			d.register(h,'searchInitiate',f);
			d.register(h,'editInitiate',f);
			d.register(h,'editClosed',f);
		};
	}

	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}

	,_dispatch: function(m){
		var d = this._getDispatcher();
		if( d ){
			var h = d.getHandle('n2.history.Tracker');
			d.send(h,m);
		};
	}
	
	,_handle: function(m){
		if( this.options.disabled ){
			return;
		};

		if( 'start' === m.type ){
			var hash = window.location.hash;
			if( hash && hash !== '') {
				hash = hash.substr(1);
				this._dispatch({
					type: 'hashChanged'
					,hash: hash
				});
			};

		} else if( 'userSelect' === m.type ){
			this.last = {
				selected: m.docId	
			};

			if( !m._suppressHashChange ) {
				var type = 'setHash';
				if( m._replaceHash ) type = 'replaceHash';
				
				var j = JSON.stringify({t:TYPE_SELECTED,i:m.docId});
				var u = $n2.Base64.encode(j);
				this._dispatch({
					type: type
					,hash: u
				});
			};

		} else if( 'unselected' === m.type ){
			this.last = {
				unselected: true	
			};

			if( !m._suppressHashChange ) {
				this._dispatch({
					type: 'setHash'
					,hash: null
				});
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

			if( !m._suppressHashChange ) {
				var j = JSON.stringify({t:TYPE_SEARCH,l:m.searchLine});
				var u = $n2.Base64.encode(j);
				this._dispatch({
					type: 'setHash'
					,hash: u
				});
			};

		} else if( 'editInitiate' === m.type ){
			this.last = {
				edit: true
			};

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

			if( m.inserted ) {
				// A document was created. Select it so it is reflected in the
				// history hash
				this._dispatch({
					type: 'userSelect'
					,docId: m.doc._id
					,_replaceHash: true
				});

			} else if( m.saved ) {
				if(lastIsEditInitiate) {
					this._dispatch({
						type: 'historyBack'
					});
				};	
				
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
			
			if( 'nostate' === m.hash ){
				// Do not do anything
				
			} else if( this.last.edit ) {
				if( confirm( _loc('Do you wish to leave document editor?') ) ) {
					// OK, continue
					this.last = {
						editClosed: true
					};
					this._dispatch({
						type: 'editCancel'
					});
					this._reloadHash(m.hash);
					
				} else {
					// Go back to edit state
					this._dispatch({
						type: 'historyForward'
					});
				};
				
			} else if( '' === m.hash || !m.hash ){
				if( !this.last.unselected ){
					this._dispatch({
						type: 'unselected'
						,_suppressHashChange: true
					});
				};
				
			} else  {
				// Attempt to interpret hash
				this._reloadHash(m.hash);
			};
		};
	}
	
	,_reloadHash: function(hash){
		var o = null;
		try {
			var d = $n2.Base64.decode(hash);
			o = JSON.parse(d);
		} catch(s) {};

		if( o ){
			if( TYPE_SELECTED === o.t ){
				var docId = o.i;
				if( docId !== this.last.selected ){
					this._dispatch({
						type: 'userSelect'
						,docId: docId
						,_suppressHashChange: true
					});
				};
			} else if( TYPE_SEARCH === o.t ){
				var searchLine = o.l;
				this._dispatch({
					type: 'searchInitiate'
					,searchLine: searchLine
					,_suppressHashChange: true
				});
			};
		};
	}
});

// Export
$n2.history = {
	Monitor: Monitor
	,Tracker: Tracker
};

})(jQuery,nunaliit2);