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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var DH = 'n2.languageSupport';

/*
 * ======================================================
 * HTML Language Switching Widget
 */
var LanguageSwitcher = $n2.Class({
	
	elemId: null
	
	,dispatcher: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,elemId: null
			,dispatcher: null
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
		
		this._display();
	}

	,_getElem: function(){
		return $('#'+this.elemId);
	}
	
	,_display: function(){
		var _this = this;
		
		var $elem = this._getElem();
		
		$elem.empty();
		
		var $a = $('<a/>')
			.text( _loc('Language') )
			.attr('href','#')
			.appendTo($elem)
			.click(function(){
				_this._dialog();
				return false;
			});
	}
	
	,_dialog: function(){
		var _this = this;
		
		var diagId = $n2.getUniqueId();
		var $langDialog = $('<div id="'+diagId+'" class="n2lang_langSelect_dialog"></div>');

		var $langList = $('<div class="n2lang_langSelect_list"></div>')
			.appendTo($langDialog);

		var languages = [
			 {
				 code: 'en'
				 ,name: 'English'
			 }
			 ,{
				 code: 'fr'
				 ,name: 'Français'
			 }
		];
		
		var onChange = function(e){
			var $input = $(this);
			if( $input.is(':checked') ){
				var code = $input.attr('n2Code');
				_this._selectLanguage(code);
				$('#'+diagId).dialog('close');
			};
			return false;
		};
		
		for(var i=0,e=languages.length;i<e;++i){
			var l = languages[i];
			addLanguage($langList, l.name, l.code);
		};

		addLanguage($langList, _loc('Default'), null);

		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select Language')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$langDialog.dialog(dialogOptions);
		
		function addLanguage($list, name, code){
			var $div = $('<div/>').appendTo($list);
			var id = $n2.getUniqueId();
			var $input = $('<input type="radio" name="languageSelect"/>')
				.attr('id',id)
				.appendTo($div)
				.change(onChange);
			if( code ){
				$input.attr('n2Code',code)
			};
			$('<label/>')
				.attr('for',id)
				.text(name)
				.appendTo($div);
		};
	}
	
	,_selectLanguage: function(code){
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
	
	options: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			directory: null
		},opts_);

		var _this = this;
		
		var d = this._getDisptacher();
		if( d ){
			var f = function(m){
				_this._handle(m);
			};
			d.register(DH,'languageSelect',f);
		};
	}

	,_getDisptacher: function(){
		var d = null;
		if( this.options 
		 && this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}
	
	,_send: function(msg){
		var d = this._getDisptacher();
		if( d ){
			d.send(DH,msg);
		};
	}
	
	,_handle: function(msg){
		if( 'languageSelect' === msg.type ){
			if( msg.lang ) {
				this._selectLanguage(msg.lang);
			} else {
				this._resetLanguage();
			};
		};
	}
	
	,_selectLanguage: function(lang){
		// Set cookie
		$n2.cookie.setCookie({
			name: 'nunaliit-l10n'
			,value: lang
			,path: '/'
			,end: (60 * 60 * 24 * 90) // 90 days in seconds
		});
		
		// Reload page
		location.reload();
	}
	
	,_resetLanguage: function(){
		// Remove cookie
		$n2.cookie.deleteCookie('nunaliit-l10n');
		
		// Reload page
		location.reload();
	}
});

// Exports
$n2.languageSupport = {
	LanguageService: LanguageService
	,LanguageSwitcher: LanguageSwitcher
};

})(jQuery,nunaliit2);
