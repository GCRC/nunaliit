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

$Id: n2.l10n.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// L10N = LOCALIZATION

// @requires n2.core.js
// @requires n2.utils.js
// @namespace nunaliit2
;(function($n2){

var cachedLocale = null;

var strings = null;

var translationRequests = {};

function getLocale() {
	if( cachedLocale ) return cachedLocale;
	
	if( null == cachedLocale && $n2.url ) {
		var lang = $n2.url.getParamValue('lang',null);
		if( lang ) {
			cachedLocale = createLocaleFromLanguage(lang);
		};
	};
	
	if ( null == cachedLocale && navigator ) {
		if ( navigator.language ) {
	    	cachedLocale = createLocaleFromLanguage(navigator.language);
	        
	    } else if ( navigator.browserLanguage ) {
	    	cachedLocale = createLocaleFromLanguage(navigator.browserLanguage);
	        
	    } else if ( navigator.systemLanguage ) {
	    	cachedLocale = createLocaleFromLanguage(navigator.systemLanguage);
	        
	    } else if ( navigator.userLanguage ) {
	    	cachedLocale = createLocaleFromLanguage(navigator.userLanguage);
	    };
	    
	};
	
	// Default
	if( null == cachedLocale ) {
		cachedLocale = createLocaleFromLanguage('en-US');
	};

	return cachedLocale;
	
	function createLocaleFromLanguage(lang) {
		if( null == lang ) return null;
	    var splits = lang.toLowerCase().split('-');
	    if( 2 != splits.length ) {
	    	$n2.log('Locale specified, but not in xx-YY format. Ignored.',lang);
	    	return null;
	    };
	    return {
			locale: lang
			,lang: splits[0]
			,country: splits[1]
		};
	};
};

function getDictionaryFromLang(lang) {
	if( null == strings ) {
		strings = $n2.l10n.strings;
	}
	
	if( null == strings[lang] ) {
		strings[lang] = {};
	}
	
	return strings[lang];
};

function getLocalizedString(str, packageName, args) {
	var locale = getLocale();
	
	if( 'en' === locale.lang ) {
		if( args ){
			return $n2.utils.formatString(str,args);
		};
		return str;
	};
	
	var dic = getDictionaryFromLang(locale.lang);
	var langStr = dic[str];
	
	if( null == langStr ) {
		// Not found in translation table. Request
		// translation if a translation service is
		// available.
		requestTranslation(str, locale.lang, packageName);
		
		// Store english version for now
		langStr = str;
		dic[str] = langStr;
	};
	
	if( args ){
		return $n2.utils.formatString(langStr,args);
	};
	return langStr;
};

function getTranslationRequestsFromLang(lang) {
	var dic = translationRequests[lang];
	if( null == dic ) {
		dic = {};
		translationRequests[lang] = dic;
	};
	return dic;
};

function requestTranslation(str, lang, packageName) {
	var dic = getTranslationRequestsFromLang(lang);
	var request = dic[str];
	
	if( null == request ) {
		// Request has not yet been made
		request = {
			lang: lang
			,str: str
			,packageName: packageName
		};
		
		// Remember request
		dic[str] = request;
		
		// Send request
		if( $n2.l10n.sendTranslationRequest ) {
			$n2.l10n.sendTranslationRequest(request);
		};
	};
};

if( !$n2.l10n ) $n2.l10n = {};
if( !$n2.l10n.strings ) $n2.l10n.strings = {};

$n2.l10n.getLocale = getLocale;
$n2.l10n.getLocalizedString = getLocalizedString;
$n2.l10n.requestTranslation = requestTranslation;
$n2.l10n.translationRequests = translationRequests;

// Load core translations
if( $n2.scripts ) {
	var locale = getLocale();
	
	// Do not load default language
	if( 'en' === locale.lang ) {
		return;
	};
	
	var coreLocation = $n2.scripts.getCoreScriptLocation();
	if( coreLocation ) {
		var url = coreLocation.location + 'nunaliit2.'+locale.lang+'.js';
		$n2.scripts.loadScript(url, coreLocation);
	};
};

})(nunaliit2);