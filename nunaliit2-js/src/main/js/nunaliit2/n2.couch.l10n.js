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

// L10N = LOCALIZATION

// @ requires n2.core.js
// @ requires n2.utils.js
// @ requires n2.l10n.js
// @namespace nunaliit2
;(function($n2){
"use strict";

var DH = 'n2.couchL10n';

//----------------------------------------------------------------------------
var LocalizationService = $n2.Class({
	
	db: null,

	designDoc: null,
	
	dispatchService: null,
	
	lookupViewName: null,
	
	translatedViewName: null,
	
	scriptList: null,
	
	isLoggedIn: null,
	
	pendingRequests: null,
	
	processingRequests: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			db: null // must be supplied
			,designDoc: null // must be supplied
			,dispatchService: null
			,lookupViewName: 'l10n-all'
			,translatedViewName: 'l10n-translated'
			,scriptList: 'l10n'
		},opts_);
		
		var _this = this;
		
		this.db = opts.db;
		this.designDoc = opts.designDoc;
		this.dispatchService = opts.dispatchService;
		this.lookupViewName = opts.lookupViewName;
		this.translatedViewName = opts.translatedViewName;
		this.scriptList = opts.scriptList;
	
		this.pendingRequests = [];
		this.processingRequests = false;
		this.isLoggedIn = false;
		
		if( this.dispatchService ){
			var f = function(m, address, dispatcher){
				_this._handle(m, address, dispatcher);
			};
			
			this.dispatchService.register(DH, 'authLoggedIn', f);
			this.dispatchService.register(DH, 'authLoggedOut', f);
			
			// Check if already logged in
			var m = {
				type: 'authIsLoggedIn'
				,isLoggedIn: false
			};
			this.dispatchService.synchronousCall(DH,m);
			if( m.isLoggedIn ){
				this.isLoggedIn = true;
			};
		};
		
		// Configure $n2.l10n.sendTranslationRequest to call this implementation
		$n2.l10n.sendTranslationRequest = function(request){
			_this.sendTranslationRequest(request);
		};
		
		// Load translations stored in database
		this._loadTranslatedStrings();
		
		// Start loading translation requests in database
		this._processPendingRequests();
	},
		
	sendTranslationRequest: function(request) {
		$n2.log('Translate '+request.str+' to '+request.lang+' ('+request.packageName+')');
		this.pendingRequests.push(request);
		this._processPendingRequests();
	},
	
	_handle: function(m, address, dispatcher){
		if( 'authLoggedIn' === m.type ){
			this.isLoggedIn = true;
			this._processPendingRequests();
			
		} else if( 'authLoggedOut' === m.type ){
			this.isLoggedIn = false;
		};
	},
	
	_tryPostingRequests: function() {
		var _this = this;
		
		if( this.pendingRequests.length < 1 ) {
			this.processingRequests = false;
			return;
		};
		if( !this.isLoggedIn ) {
			this.processingRequests = false;
			return;
		};
		
		var request = this.pendingRequests.shift();
		var startkey = [request.lang, request.str];
		
		
		this.designDoc.queryView({
			viewName: this.lookupViewName
			,startkey: startkey
			,endkey: startkey
			,onSuccess: function(results) {
				if( results.length < 1 ) {
					// Must upload
					_uploadRequest(request);
				} else {
					// Go to next one
					_this._tryPostingRequests();
				}
			}
			,onError: function(errorMsg) {
				$n2.log(errorMsg);
				_this._tryPostingRequests();
			}
		});
		
		function _uploadRequest(request) {
			// Get user name
			var userName = null;
			var sessionContext = $n2.couch.getSession().getContext();
			if( sessionContext ) {
				userName = sessionContext.name;
			};
			
			// Get now
			var nowTime = (new Date()).getTime();
			
			var data = {
				nunaliit_type: 'translationRequest'
				,nunaliit_schema: 'translationRequest'
				,str: request.str
				,lang: request.lang
				,packageName: request.packageName
			};

			if( userName ) {
				data.nunaliit_created = {
					nunaliit_type: 'actionstamp'
					,name: userName
					,time: nowTime
					,action: 'created'
				};
				
				data.nunaliit_last_updated = {
					nunaliit_type: 'actionstamp'
					,name: userName
					,time: nowTime
					,action: 'updated'
				};
				
				_this.db.createDocument({
					data: data
					,onSuccess: function(){
						_this._tryPostingRequests();
					}
					,onError: function(errorMsg) {
						$n2.reportError(errorMsg);
						_this._tryPostingRequests();
					}
				});
			} else {
				// Not logged in. Strange.
				$n2.log('User not logged in. Translation request ignored.');
				_this._tryPostingRequests();
			};
		};
	},

	_processPendingRequests: function() {
		if( !this.processingRequests ) {
			this.processingRequests = true;
			this._tryPostingRequests();
		};
	},
	
	_loadTranslatedStrings: function() {
		if( $n2.scripts ) {
			var lang = $n2.l10n.getLocale().lang;
			
			// Load already translated strings
			var url = this.designDoc.ddUrl 
				+ '_list/' + this.scriptList
				+ '/' + this.translatedViewName
				+ '?startkey="' + lang
				+ '"&endkey="' + lang
				+ '"'
				+ '&include_docs=true&reduce=false'
				;

			var coreLocation = $n2.scripts.getCoreScriptLocation();
			$n2.scripts.loadScript(url, coreLocation);
		};
	}
});

//----------------------------------------------------------------------------
$n2.couchL10n = {
	LocalizationService: LocalizationService
};

})(nunaliit2);