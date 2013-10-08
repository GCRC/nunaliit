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

$Id: n2.couch.l10n.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// L10N = LOCALIZATION

// @ requires n2.core.js
// @ requires n2.utils.js
// @ requires n2.l10n.js
// @namespace nunaliit2
;(function($n2){

var configuration = null;
var pendingRequests = [];
var processingRequests = false;

function uploadRequest(request) {
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
			,action: 'lastUpdated'
		};
		
		configuration.db.createDocument({
			data: data
			,onSuccess: verifyRequests
			,onError: function(errorMsg) {
				$n2.reportError(errorMsg);
				verifyRequests();
			}
		});
	} else {
		$n2.log('User not logged in. Translation requests ignored.');
	};
};

function verifyRequests() {
	if( pendingRequests.length < 1 ) {
		processingRequests = false;
		return;
	};
	
	var request = pendingRequests.shift();
	var startkey = [request.lang, request.str];
	
	
	configuration.designDoc.queryView({
		viewName: configuration.lookupViewName
		,startkey: startkey
		,endkey: startkey
		,onSuccess: function(results) {
			if( results.length < 1 ) {
				// Must upload
				uploadRequest(request);
			} else {
				// Go to next one
				verifyRequests();
			}
		}
		,onError: function(errorMsg) {
			$n2.log(errorMsg);
			verifyRequests();
		}
	});
};

function processPendingRequests() {
	if( configuration 
	 && pendingRequests.length > 0
	 && false == processingRequests
	 ) {
		processingRequests = true;
		verifyRequests();
	};
};
	
function sendTranslationRequest(request) {
	$n2.log('Translate '+request.str+' to '+request.lang+' ('+request.packageName+')');
//$n2.log('conf',configuration,pendingRequests);	
	pendingRequests.push(request);
	processPendingRequests();
};

function loadTranslatedStrings() {
	var lang = $n2.l10n.getLocale().lang;
	
	// Load already translated strings
	var url = configuration.designDoc.ddUrl 
		+ '_list/' + configuration.scriptList
		+ '/' + configuration.translatedViewName
		+ '?startkey="' + lang
		+ '"&endkey="' + lang
		+ '"'
		+ '&include_docs=true&reduce=false'
		;
	if( $n2.scripts ) {
		var coreLocation = $n2.scripts.getCoreScriptLocation();
		$n2.scripts.loadScript(url, coreLocation);
	};
};

var defaultOptions = {
	db: null // must be supplied
	,designDoc: null // must be supplied
	,lookupViewName: 'l10n-all'
	,translatedViewName: 'l10n-translated'
	,scriptList: 'l10n'
};
function Configure(opt_) {
	configuration = $n2.extend({},defaultOptions,opt_);
	loadTranslatedStrings();
	processPendingRequests();
};

function getLocalizedString(str, packageName, args){
	if( typeof(str) === 'string' ){
		return $n2.l10n.getLocalizedString(str, packageName, args);
	};

	if( str.nunaliit_type === 'localized' ){
		var locale = $n2.l10n.getLocale();
		var lang = locale.lang;
		
		// Check request language
		if( typeof(str[lang]) === 'string' ) {
			var result = str[lang];
			if( args && args.length > 0 ){
				result = $n2.utils.formatString(result,args);
			};
			result.nunaliit_lang = lang;
			return result;
		};
		
		// Fallback to 'en'
		if( typeof(str.en) === 'string' ) {
			var result = str.en;
			if( args && args.length > 0 ){
				result = $n2.utils.formatString(result,args);
			};
			result.nunaliit_lang = 'en';
			result.nunaliit_lang_fallback = true;
			return result;
		};
		
		// Fallback to any language
		for(var fbLang in str){
			if( 'nunaliit_type' === fbLang ){
				// ignore
			} else {
				var result = str[fbLang];
				if( args && args.length > 0 ){
					result = $n2.utils.formatString(result,args);
				};
				result.nunaliit_lang = fbLang;
				result.nunaliit_lang_fallback = true;
				return result;
			};
		};
	};
	
	return null;
};
	
$n2.l10n.sendTranslationRequest = sendTranslationRequest;

$n2.couchL10n = {
	Configure: Configure
	,getLocalizedString: getLocalizedString
};

})(nunaliit2);