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
"use strict";

if( !$n2.l10n ) $n2.l10n = {};
if( !$n2.l10n.strings ) $n2.l10n.strings = {};
if( !$n2.l10n.strings['en'] ) $n2.l10n.strings['en'] = {};

var reLangCountry = /^([a-z][a-z])-([a-zA-Z][a-zA-Z])$/;
var reLang = /^([a-z][a-z])$/;

// Short-cut
var strings = $n2.l10n.strings;

var cachedLocale = null;

var translationRequests = {};

function getLocale() {
	if( cachedLocale ) return cachedLocale;
	
	if( null == cachedLocale && $n2.cookie ) {
		var lang = $n2.cookie.getCookie('nunaliit-l10n');
		if( lang ) {
			cachedLocale = createLocaleFromLanguage(lang);
		};
	};
	
	if( null == cachedLocale && $n2.url ) {
		var lang = $n2.url.getParamValue('lang',null);
		if( lang ) {
			cachedLocale = createLocaleFromLanguage(lang);
		};
	};
	
	if ( null == cachedLocale && typeof navigator === 'object' ) {
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
		
		var mLangCountry = lang.match(reLangCountry);
	    if( mLangCountry ) {
	    	return {
				locale: lang
				,lang: mLangCountry[1]
				,country: mLangCountry[2]
			};
		};

		var mLang = lang.match(reLang);
	    if( mLang ) {
	    	return {
				locale: lang
				,lang: mLang[1]
				,country: null
			};
		};

		$n2.log('Locale specified, but not in xx-YY format. Ignored.',lang);
    	return null;
	};
};

function getDictionaryFromLang(lang) {
	var dict = strings[lang];
	
	if( !dict ) {
		dict = {};
		strings[lang] = dict;
	};
	
	return dict;
};

function getStringForLang(str,lang){
	var result = {
		str: null
		,lang: null
		,fallback: false
	};

	// Handle content that contains translation
	if( typeof(str) === 'string' ) {
		result.str = str;
		
	} else if( typeof(str) === 'object' 
	 && str.nunaliit_type === 'localized' ){
		// Check request language
		if( typeof(str[lang]) === 'string' ) {
			result.str = str[lang];
			result.lang = lang;

		} else if( typeof(str.en) === 'string' ) {
			// Fallback to 'en'
			result.str = str.en;
			result.lang = lang;
			result.fallback = true;
			
		} else {
			// Fallback to any language
			for(var fbLang in str){
				if( 'nunaliit_type' === fbLang ){
					// ignore
				} else {
					result.str = str[fbLang];
					result.lang = fbLang;
					result.fallback = true;
					break;
				};
			};
		};
	};
	
	return result;
};

function getStringForLocale(str){
	var locale = getLocale();
	var lang = locale.lang;
	
	return getStringForLang(str,lang);
};

function getLocalizedString(str, packageName, args) {
	var suppressTranslationRequest = false;
	
	var locale = getLocale();
	var lang = locale.lang;

	// Assume that input str is english
	var lookupStr = str;
	var lookupLang = 'en';

	// Handle content that contains translation
	if( str.nunaliit_type === 'localized' ){
		// Translation should be provided in string, not
		// dictionary
		suppressTranslationRequest = true;
		
		lookupStr = null;
		
		// Check request language
		if( typeof(str[lang]) === 'string' ) {
			lookupStr = str[lang];
			lookupLang = lang;

		} else if( typeof(str.en) === 'string' ) {
			// Fallback to 'en'
			lookupStr = str.en;
			lookupLang = lang;
			
		} else {
			// Fallback to any language
			for(var fbLang in str){
				if( 'nunaliit_type' === fbLang ){
					// ignore
				} else if(typeof str[fbLang] === 'string' ) {
					lookupStr = str[fbLang];
					lookupLang = fbLang;
					break;
				};
			};
		};
	};

	// Get translation from dictionary
	var dic = getDictionaryFromLang(lang);
	var langStr = dic[lookupStr];
	
	if( !langStr ) {
		// Not in dictionary. Use lookup string
		langStr = lookupStr;

		if( lookupLang !== lang ) {
			// Request tranlation for this language
			if( !suppressTranslationRequest ){
				requestTranslation(lookupStr, lang, packageName);
			};
			
			// Store english version for now
			dic[lookupStr] = langStr;
		};
	};

	if( args ){
		return $n2.utils.formatString(langStr,args);
	};
	return langStr;
};

/**
 * Looks up a string in the dictionary of translations for the current
 * locale. If a string is not found, return undefined
 */
function lookupDictionaryTranslation(str, packageName, args){
	var locale = getLocale();
	var lang = locale.lang;

	var dic = getDictionaryFromLang(lang);
	var langStr = dic[str];
	
	if( !langStr ) {
		// Not in dictionary. Assume that input str is english
		if( 'en' !== lang ) {
			// Request tranlation for this language
			requestTranslation(str, lang, packageName);
		} else {
			// A request made in english. If not in dictionary, just use
			// input string
			langStr = str;
		};
	};

	// Need to format?
	if( langStr && args ){
		return $n2.utils.formatString(langStr,args);
	};
	
	return langStr;
};

function addLocalizedString(enStr, lang, langStr) {
	var dict = getDictionaryFromLang(lang);
	dict[enStr] = langStr;
	
	$n2.l10n.refreshLocalizedStrings();
};

function addLocalizedStrings(lang, strings) {
	var dict = getDictionaryFromLang(lang);

	for(var key in strings) {
		dict[key] = strings[key];
	};
	
	$n2.l10n.refreshLocalizedStrings();
};


function getTranslationRequestsFromLang(lang) {
	var dic = translationRequests[lang];
	if( !dic ) {
		dic = {};
		translationRequests[lang] = dic;
	};
	return dic;
};

function requestTranslation(str, lang, packageName) {
	var dic = getTranslationRequestsFromLang(lang);
	var request = dic[str];
	
	if( !request ) {
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

function refreshLocalizedStrings(){
	if( typeof jQuery !== 'undefined' ) {
		jQuery('body').find('.n2s_waiting_for_localization').each(function(){
			var $jq = $(this);
			var text = $jq.text();
			var locText = $n2.l10n.lookupDictionaryTranslation(text, 'nunaliit2');
			if( typeof locText === 'string' ) {
				$jq.text(locText);
				$jq.removeClass('n2s_waiting_for_localization');
			};
		});
	};
};

$n2.l10n.getLocale = getLocale;
$n2.l10n.getLocalizedString = getLocalizedString;
$n2.l10n.getStringForLang = getStringForLang;
$n2.l10n.getStringForLocale = getStringForLocale;
$n2.l10n.requestTranslation = requestTranslation;
$n2.l10n.translationRequests = translationRequests;
$n2.l10n.lookupDictionaryTranslation = lookupDictionaryTranslation;
$n2.l10n.addLocalizedString = addLocalizedString;
$n2.l10n.addLocalizedStrings = addLocalizedStrings;
$n2.l10n.refreshLocalizedStrings = refreshLocalizedStrings;

// Load core translations
if( $n2.scripts ) {
	var locale = getLocale();
	
	var coreLocation = $n2.scripts.getCoreScriptLocation();
	if( coreLocation ) {
		// Do not load default language
		if( 'en' !== locale.lang ) {
			var url = coreLocation.location + 'nunaliit2.'+locale.lang+'.js';
			$n2.scripts.loadScript(url, coreLocation);
		};		

		var langUrl = coreLocation.location + '../nunaliit_lang.'+locale.lang+'.js';
		$n2.scripts.loadScript(langUrl, coreLocation);
	};
	
	// Notify via DOM classes
	if( typeof jQuery !== 'undefined' ) {
		jQuery('body').addClass('nunaliit_language_'+locale.lang);
	};
};

})(nunaliit2);