/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetSplash'
 ;

//--------------------------------------------------------------------------
var SplashPageWidget = $n2.Class({
	
	dispatchService: null,

	showService: null,
	
	interactionSeen: null,
	
	dialogId: null,
	
	pages: null,
	
	title: null,
	
	dialogWidth: null,
	
	pageIndex: null,
	
	showSplashPage: null,
	
	version: null,
	
	cookieName: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			contentId: null
			,containerId: null
			,dispatchService: null
			,showService: null
			,pages: null
			,title: null
			,dialogWidth: 800
			,version: 1
			,cookieName: 'NunaliitSplashDontShow'
		},opts_);
		
		var _this = this;

		this.interactionSeen = false;
		this.showSplashPage = false;
		this.dialogId = undefined;
		this.pages = undefined;
		this.pageIndex = 0;
		
		this.title = opts.title;
		this.dialogWidth = opts.dialogWidth;
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.version = opts.version;
		this.cookieName = opts.cookieName;
		
		if( opts.pages && $n2.isArray(opts.pages) ){
			this.pages = opts.pages;
		};
		
		// Set up model listener
		if( this.dispatchService ){
			// The following code has to do with displaying the initial
			// introduction page. It can not be done when the module is
			// first loaded since it relies on the event system and that
			// the events are not translated until the 'start' is sent.
			// However, on 'start', the HashTracker may elect to send
			// a 'select' or 'searchInitiate' event to repeat what is
			// specified in the URL. Therefore, we must wait after the
			// start to see if a selection was done before we can override
			// with our own event.

			// Do not show splash page before the start event is sent
			this.dispatchService.register(DH,'start',function(){
				// Wait to see if reloading page, the hash will load something
				window.setTimeout(function(){
					if( !_this.interactionSeen ){
						_this.showSplashPage = true;
						_this._showInitialSplash();
					};
				},0);
			});

			var f = function(m, addr, dispatcher){ 
				_this._handle(m, addr, dispatcher); 
			};

			this.dispatchService.register(DH,'searchInitiate',f);
			this.dispatchService.register(DH,'selected',f);
			this.dispatchService.register(DH,'splashWidgetSetPages',f);
			this.dispatchService.register(DH,'showPreprocessElement',f);
			this.dispatchService.register(DH,'splashShowSplashPage',f);
		};
		
		this._showInitialSplash();
		
		this._handleShowPreprocessElement( $('body') );

		$n2.log('SplashPageWidget', this);
	},
	
	_showInitialSplash: function(){
		// If a selection is performed from the initial URL,
		// do not show splash page
		if( !this.showSplashPage ) return;

		// We are about to show splash. Check if a cookie is
		// set to prevent us from showing splash
		if( $n2.cookie && $n2.cookie.getCookie ){
			var cookie = $n2.cookie.getCookie(this.cookieName);
			var cookieVersion = 1 * cookie;
			if( cookieVersion >= this.version ){
				return;
			};
		};

		this._showSplash(true);
	},
	
	_showSplash: function(isInitialPage){
		var _this = this;

		if( !this.pages ) return;

		// We are about to show splash. Check if a cookie is
		// set to prevent us from showing splash
		if( $n2.cookie && $n2.cookie.getCookie ){
			var cookie = $n2.cookie.getCookie(this.cookieName);
			var cookieVersion = 1 * cookie;
			if( cookieVersion >= this.version ){
				return;
			};
		};
		
		var $dialog = $('<div>')
			.addClass('n2Splash_dialog')
			.appendTo( $('body') );
		this.dialogId = $n2.utils.getElementIdentifier($dialog);
		
		var $content = $('<div>')
			.addClass('n2Splash_container')
			.appendTo( $dialog );

		var $buttons = $('<div>')
			.addClass('n2Splash_buttons')
			.appendTo( $dialog );

		$('<a>')
			.addClass('n2Splash_button n2Splash_button_previous n2Splash_button_disabled')
			.text( _loc('Previous') )
			.attr('href','#')
			.appendTo($buttons)
			.click(function(){
				_this._changeCurrentPage(-1);
				return false;
			});
		
		$('<span>')
			.addClass('n2Splash_index')
			.appendTo($buttons);

		$('<a>')
			.addClass('n2Splash_button n2Splash_button_next n2Splash_button_disabled')
			.text( _loc('Next') )
			.attr('href','#')
			.appendTo($buttons)
			.click(function(){
				_this._changeCurrentPage(+1);
				return false;
			});

		if( isInitialPage ){
			var cbId = $n2.getUniqueId();
			$('<label>')
				.addClass('n2Splash_label n2Splash_label_dontshow')
				.attr('for',cbId)
				.text( _loc('Do not show again') )
				.appendTo($buttons);

			$('<input>')
				.addClass('n2Splash_button n2Splash_button_dontshow')
				.attr('type','checkbox')
				.attr('id',cbId)
				.appendTo($buttons)
				.click(function(){
					var $cb = $(this);
					var isChecked = $cb.is(':checked');
					_this._doNotShowAgain(isChecked);
					return true;
				});
		};
		
		$('<a>')
			.addClass('n2Splash_button n2Splash_button_close n2Splash_button_enabled')
			.text( _loc('Close') )
			.attr('href','#')
			.appendTo($buttons)
			.click(function(){
				var $diag = $('#'+_this.dialogId);
				$diag.dialog('close');
				return false;
			});

		// Print HTML
		this._showCurrentPage();
		
		var title = undefined;
		if( this.title ){
			title = _loc(this.title);
		};
		if( !title ){
			title = _loc('Welcome');
		};
		var diagOptions = {
			autoOpen: true
			,title: title
			,modal: true
			,width: this.dialogWidth
			,close: function(event, ui){
				var $diag = $(event.target);
				$diag.dialog('destroy');
				$diag.remove();
			}
		};
		
		$dialog.dialog(diagOptions);
	},

	_showCurrentPage: function(){
		var page = this.pages[this.pageIndex];

		var $dialog = $('#'+this.dialogId);
		
		var $container = $dialog.find('.n2Splash_container')
			.empty();
		
		if( page.html ){
			var html = page.html;
			if( typeof html === 'object' 
			 && 'localized' === html.nunaliit_type ){
				html = _loc(html);
			};
			
			$container.html(html);
			if( this.showService ){
				this.showService.fixElementAndChildren($container, {}, page.doc);
			};

		} else if( page.text ){
			$container.text(page.text);
		};
		
		var $index = $dialog.find('.n2Splash_index').empty();
		if( this.pages.length > 1 ){
			var indexStr = '('+(this.pageIndex+1)+'/'+this.pages.length+')';
			$index.text( indexStr );
		};

		var $prevButton = $dialog.find('.n2Splash_button_previous');
		if( 0 == this.pageIndex ){
			$prevButton.removeClass('n2Splash_button_enabled');
			$prevButton.addClass('n2Splash_button_disabled');
		} else {
			$prevButton.addClass('n2Splash_button_enabled');
			$prevButton.removeClass('n2Splash_button_disabled');
		};

		var $nextButton = $dialog.find('.n2Splash_button_next');
		if( this.pageIndex >= (this.pages.length-1) ){
			$nextButton.removeClass('n2Splash_button_enabled');
			$nextButton.addClass('n2Splash_button_disabled');
		} else {
			$nextButton.addClass('n2Splash_button_enabled');
			$nextButton.removeClass('n2Splash_button_disabled');
		};
	},

	_changeCurrentPage: function(pageDelta){
		if( pageDelta < 0 ){
			--this.pageIndex;
			if( this.pageIndex < 0 ){
				this.pageIndex = 0;
			};

		} else if( pageDelta > 0 ){
			++this.pageIndex;
			if( this.pageIndex >= this.pages.length ){
				this.pageIndex = this.pages.length - 1;
			};
		};
		
		this._showCurrentPage();
	},

	_doNotShowAgain: function(dontShow){
		if( dontShow ){
			var now = new Date();
			var expiry = new Date(now.getTime() + (1000 * 60 * 60 * 24 * 400)); // 440 days
			$n2.cookie.setCookie({
				name: this.cookieName
				,value: ''+this.version
				,end: '' + expiry
				,path: '/'
			});
		} else {
			$n2.cookie.deleteCookie(this.cookieName);
		};
	},
	
	_insertShowSplashPageButton: function($elem){
		var _this = this;
		
		$elem.empty();
		var elemId = $n2.utils.getElementIdentifier($elem);
		
		var label = $elem.attr('nunaliit-label');
		if( !label ){
			label = _loc('Help');
		};
		
		if( this.dispatchService ){
			var $elem = $('#'+elemId);
			
			$('<a>')
				.addClass('n2splash_showSplashButton')
				.attr('href','#')
				.text( label )
				.appendTo($elem)
				.click(function(){
					_this.dispatchService.send(DH,{
						type: 'splashShowSplashPage'
					});
					return false;
				});
		};
	},
	
	_handleShowPreprocessElement: function($elem){
		var _this = this;

		var $set = $elem.find('*').addBack();
		
		// Localization
		$set.filter('.n2s_insertShowSplashPageButton').each(function(){
			var $jq = $(this);
			_this._insertShowSplashPageButton($jq);
			$jq
				.removeClass('n2s_insertShowSplashPageButton')
				.addClass('n2s_insertedShowSplashPageButton');
		});
	}, 
	
	_handle: function(m, addr, dispatcher){
		// If a 'selected' or 'searchInitiate' event is seen, then the page
		// has been reloaded
		if( 'searchInitiate' === m.type 
		 || 'selected' === m.type ){
			this.interactionSeen = true;

		} else if( 'splashWidgetSetPages' === m.type ){
			if( $n2.isArray(m.pages) ){
				this.pages = m.pages;
				
				if( typeof m.version === 'number' ){
					this.version = m.version;
				};
				
				if( typeof m.cookieName === 'string' ){
					this.cookieName = m.cookieName;
				};
				
				this.pageIndex = 0;
				this._showInitialSplash();
			};

		} else if( 'showPreprocessElement' === m.type ){
			var $elem = m.elem;
			this._handleShowPreprocessElement($elem);

		} else if( 'splashShowSplashPage' === m.type ){
			this._showSplash(false);
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'splashPage' ){
		m.isAvailable = true;
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'splashPage' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {
			contentId: contentId
			,containerId: containerId
		};

		if( widgetOptions ){
			for(var key in widgetOptions){
				options[key] = widgetOptions[key];
			};
		};
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.showService = config.directory.showService;
		};
		
		new SplashPageWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetSplash = {
	SplashPageWidget: SplashPageWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
