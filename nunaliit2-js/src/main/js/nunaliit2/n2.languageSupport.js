/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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

var DH = 'n2.languageSupport';

var DEFAULT_LANGUAGES = [
	 {
		 code: 'en'
		 ,name: 'English'
	 }
	 ,{
		 code: 'fr'
		 ,name: 'Français'
	 }
];

var g_LanguageService = undefined;

/*
 * ======================================================
 * HTML Language Switching Widget
 */
var LanguageSwitcher = $n2.Class({
	
	elemId: null,
	
	dispatcher: null,
	
	languages: null,
	
	languageService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,elemId: null
			,dispatcher: null
			,languages: null
			,languageService: null
		},opts_);

		// Get element id
		this.elemId = opts.elemId;
		if( opts.elem ){
			var $elem = $(opts.elem);
			var id = $elem.attr('id');
			if( !id ){
				id = $n2.getUniqueId();
				$elem.attr('id',id);
			};
			this.elemId = id;
		};
		
		this.dispatcher = opts.dispatcher;
		this.languages = opts.languages;
		this.languageService = opts.languageService;
		
		this._display();
	},

	_getLanguages: function(){
		if( this.languageService ){
			return this.languageService.getLanguages();
		};
		
		if( this.languages ){
			return this.languages;
		};
		
		return DEFAULT_LANGUAGES;
	},

	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_display: function(){
		var _this = this;
		
		var $elem = this._getElem();
		
		$elem.empty();
		
		$('<a>')
			.text( _loc('Language') )
			.attr('href','#')
			.appendTo($elem)
			.click(function(){
				_this._dialog();
				// Material Design library has styling for radio buttons in focus. Initially
				// setting inputs to blur, prevents the first radio button from being in focus
				$('.n2lang_langSelect_list input').blur();
				return false;
			});
	},

	_dialog: function(){
		var mdcDialogComponent; 
		var _this = this;
		var diagId = $n2.getUniqueId();

		var $langDialog = $('<div>')
			.attr('id',diagId)
			.attr('role','alertdialog')
			.attr('aria-modal','true')
			.attr('aria-labelledby','my-dialog-title')
			.attr('aria-describedby','my-dialog-content')
			.addClass('n2lang_langSelect_dialog mdc-dialog')
			.appendTo($('body'));

		var $dialogContainer = $('<div>')
			.addClass('mdc-dialog__container')
			.appendTo($langDialog);

		var $dialogSurface = $('<div>')
			.addClass('mdc-dialog__surface')
			.appendTo($dialogContainer);

		$('<h2>')
			.addClass('mdc-dialog__title')
			.text(_loc('Select Language'))
			.appendTo($dialogSurface);

		var $langList = $('<div>')
			.addClass('n2lang_langSelect_list mdc-dialog__content')
			.appendTo($dialogSurface);
		
		var $footer = $('<footer>')
			.addClass('mdc-dialog__actions')
			.appendTo($dialogSurface);

		var $button = $('<button>')
			.addClass('n2dialogs_alert_okButton mdc-button mdc-dialog__button')
			.text(_loc('Close'))
			.appendTo($footer)
			.click(function(){
				mdcDialogComponent.close();
				$langDialog.remove();
				return false;
			});

		$('<div>')
			.addClass('mdc-dialog__scrim')
			.click(function(){
				mdcDialogComponent.close();
				$langDialog.remove();
				return false;
			})
			.appendTo($langDialog);

		// Attach ripple to button
		mdc.ripple.MDCRipple.attachTo($button[0]);

		// Attach mdc component to alert dialog
		mdcDialogComponent = new mdc.dialog.MDCDialog($langDialog[0]);
		mdcDialogComponent.open();
		
		var onClick = function(e){
			var $input = $(this);
			if( $input.is(':checked') ){
				var code = $input.attr('n2Code');
				var local = $n2.l10n.getLocale();
				if (local.lang !== code){
					_this._selectLanguage(code);
					mdcDialogComponent.close();
					$langDialog.remove();
				}
			};
			return false;
		};
		
		var languages = this._getLanguages();
		for(var i=0,e=languages.length;i<e;++i){
			var l = languages[i];
			addLanguage($langList, l.name, l.code);
		};

		addLanguage($langList, _loc('Default'), null);

		function addLanguage($list, name, code){
			var id = $n2.getUniqueId();
			var $formDiv = $('<div>')
				.addClass('mdc-form-field radio_form_field')
				.appendTo($list);
			var $div = $('<div>')
				.addClass('mdc-radio')
				.appendTo($formDiv);
			var $input = $('<input>')
				.attr('id',id)
				.attr('type','radio')
				.attr('name','languageSelect')
				.click(onClick)
				.addClass('mdc-radio__native-control')
				.appendTo($div);

			var $mdcRadioBackground = $('<div>')
				.addClass('mdc-radio__background')
				.appendTo($div);
			$('<div>')
				.addClass('mdc-radio__outer-circle')
				.appendTo($mdcRadioBackground);
			$('<div>')
				.addClass('mdc-radio__inner-circle')
				.appendTo($mdcRadioBackground);
			
			if( code ){
				$input.attr('n2Code',code);
			};
			
			var locale = $n2.l10n.getLocale();
			if( locale.lang === code ){
				$input.attr('checked', 'checked');
			};
			
			$('<label/>')
				.attr('for',id)
				.text(name)
				.appendTo($list);

			$('<br/>').appendTo($list);

		};
	},
	
	_selectLanguage: function(code){
		if( this.dispatcher ){
			this.dispatcher.send(DH,{
				type: 'languageSelect'
				,lang: code
			});
		};
	}
});

/*
 * ======================================================
 * HTML Language Toggle Widget
 */
var LanguageToggler = $n2.Class({
	
	elemId: null,
	
	dispatcher: null,
	
	languages: null,
	
	languageService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,elemId: null
			,dispatcher: null
			,languages: null
			,languageService: null
		},opts_);

		// Get element id
		this.elemId = opts.elemId;
		if( opts.elem ){
			var $elem = $(opts.elem);
			var id = $elem.attr('id');
			if( !id ){
				id = $n2.getUniqueId();
				$elem.attr('id',id);
			};
			this.elemId = id;
		};
		
		this.dispatcher = opts.dispatcher;
		this.languages = opts.languages;
		this.languageService = opts.languageService;
		
		this._display();
	},

	_getLanguages: function(){
		if( this.languageService ){
			return this.languageService.getLanguages();
		};
		
		if( this.languages ){
			return this.languages;
		};
		
		return DEFAULT_LANGUAGES;
	},

	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_display: function(){
		var _this = this;
		
		var $elem = this._getElem();
		
		$elem.empty();
		
		var language = this._pickLanguageToDisplay();
		if( language ){
			$('<a>')
				.text( language.name )
				.attr('href','#')
				.appendTo($elem)
				.click(function(){
					_this._selectLanguage(language.code);
					return false;
				});
		};
	},
	
	_pickLanguageToDisplay: function(){
		var locale = $n2.l10n.getLocale();
		
		var lang = null;
		if( locale ){
			lang = locale.lang;
		};
		
		var languages = this._getLanguages();
		for(var i=0,e=languages.length;i<e;++i){
			var l = languages[i];
			if( l.code !== lang ){
				return l;
			};
		};
		
		return null;
	},
	
	_selectLanguage: function(code){
		if( this.dispatcher ){
			this.dispatcher.send(DH,{
				type: 'languageSelect'
				,lang: code
			});
		};
	}
});

/*
 * ======================================================
 * Language Service
 */
var LanguageService = $n2.Class({
	
	dispatcher: null,
	
	languages: null,
	
	useToggleWidget: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			directory: null
			,languages: null
		},opts_);

		var _this = this;
		
		// Save in global variable
		g_LanguageService = this;
		
		if( opts.directory ){
			this.dispatcher = opts.directory.dispatchService;
		};
		
		this.languages = opts.languages;
		if( !this.languages ){
			this.languages = DEFAULT_LANGUAGES.slice(0);
		};
		
		this.useToggleWidget = false;
		
		var d = this.dispatcher;
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			d.register(DH,'languageSelect',f);
		};
	},

	getLanguages: function(){
		return this.languages;
	},
	
	addLanguage: function(language){
		if( language.name && language.code ){
			this.languages.push(language);
		};
	},
	
	setUseToggleWidget: function(f){
		this.useToggleWidget = f;
	},

	drawWidget: function(opts_){
		var opts = $n2.extend({
				elem: null
				,elemId: null
			}
			,opts_
			,{
				dispatcher: this.dispatcher
				,languageService: this
			}
		);
		
		if( this.useToggleWidget ) {
			return new LanguageToggler(opts);
		} else {
			return new LanguageSwitcher(opts);
		};
	},
	
	_send: function(msg){
		var d = this.dispatcher;
		if( d ){
			d.send(DH,msg);
		};
	},
	
	_handle: function(msg){
		if( 'languageSelect' === msg.type ){
			if( msg.lang ) {
				this._selectLanguage(msg.lang);
			} else {
				this._resetLanguage();
			};
		};
	},
	
	_selectLanguage: function(lang){
		// Set cookie
		$n2.cookie.setCookie({
			name: 'nunaliit-l10n'
			,value: lang
			,path: '/'
			// session cookie ,end: (60 * 60 * 24 * 90) // 90 days in seconds
		});
		
		// Reload page
		location.reload();
	},
	
	_resetLanguage: function(){
		// Remove cookie
		$n2.cookie.deleteCookie('nunaliit-l10n');
		
		// Reload page
		location.reload();
	}
});

/*
 * ======================================================
 * Function to retrieve languages currently in use
 */
function getLanguages(){
	if( g_LanguageService ){
		return g_LanguageService.getLanguages();
	};
	
	return DEFAULT_LANGUAGES;
};

/*
 * ======================================================
 * Exports
 */
$n2.languageSupport = {
	LanguageService: LanguageService
	,LanguageSwitcher: LanguageSwitcher
	,LanguageToggler: LanguageToggler
	,getLanguages: getLanguages
};

})(jQuery,nunaliit2);
