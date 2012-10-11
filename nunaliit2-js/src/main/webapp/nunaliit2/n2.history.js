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
var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

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
			window.addEventListener('hashchange', function(e){
				_this._hashChange(e);
			}, false);
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
		
		if( hash ){
			var m = {
				type: 'hashChanged'
				,hash: hash
			};
			this._dispatch(m);
		};
	}
	
	,_handle: function(m){
		if( 'selected' === m.type ){
			var j = JSON.stringify({type:'selected',docId:m.docId});
			var u = $n2.Base64.encode(j);
			window.location = '#'+u;
			
		} else if( 'historyBack' === m.type ){
			window.history.back();
			
		} else if( 'historyForward' === m.type ){
			window.history.forward();
			
		} else if( 'setHash' === m.type ){
			var hash = m.hash;
			if( hash ) {
				window.location = '#'+hash;
			} else {
				window.location = '#';
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
		},opts_);
		
		var _this = this;
		
		this.last = {};
		
		var d = this._getDispatcher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			var h = d.getHandle('n2.history');
			d.register(h,'start',f)
			d.register(h,'hashChanged',f)
			d.register(h,'selected',f)
			d.register(h,'searchInitiate',f)
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
	
	,_handle: function(m){
		if( 'start' === m.type ){
			var hash = window.location.hash;
			if( hash && hash !== '') {
				hash = hash.substr(1);
				this._dispatch({
					type: 'hashChanged'
					,hash: hash
				});
			};

		} else if( 'selected' === m.type ){
			this.last = {
				selected: m.docId	
			};

			if( !m._suppressHashChange ) {
				var j = JSON.stringify({type:'selected',docId:m.docId});
				var u = $n2.Base64.encode(j);
				this._dispatch({
					type: 'setHash'
					,hash: u
				});
			};

		} else if( 'searchInitiate' === m.type ){
			this.last = {
				search: m.searchLine
			};

			if( !m._suppressHashChange ) {
				var j = JSON.stringify({type:'search',l:m.searchLine});
				var u = $n2.Base64.encode(j);
				this._dispatch({
					type: 'setHash'
					,hash: u
				});
			};

		} else if( 'hashChanged' === m.type ){
			var o = null;

			try {
				var d = $n2.Base64.decode(m.hash);
				o = JSON.parse(d);
			} catch(s) {};

			if( o ){
				if( 'selected' === o.type ){
					var docId = o.docId;
					if( docId !== this.last.selected ){
						this._dispatch({
							type: 'selected'
							,docId: docId
							,_suppressHashChange: true
						});
					};
				} else if( 'search' === o.type ){
					var searchLine = o.l;
					if( searchLine !== this.last.search ){
						this._dispatch({
							type: 'searchInitiate'
							,searchLine: searchLine
							,_suppressHashChange: true
						});
					};
				};
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