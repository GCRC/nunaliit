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

// This file contains code that corrects/fixes issues when using jQuery with Nunaliit

;(function($,$n2){

// In IE8, must disable caching of $.ajax requests
var browserInfo = $n2.utils.getBrowserInfo();
if( browserInfo && browserInfo.browser === 'Explorer' ){
	// This is IE
	if( typeof(browserInfo.version) === 'number' ){
		if( browserInfo.version < 9 ){
			// IE8 or older, disable caching on AJAX calls
			if( $.ajaxSetup ){
				$.ajaxSetup({
					cache: false
				});				
			};
		};
	};
};

// Custom Drop-Down widget
$.widget( 'nunaliit.dropselector', {
	_create: function() {
		this.wrapper = $('<span>').addClass('nunaliit-dropselector')
			.insertAfter(this.element);

		this.element.hide();
		this._createButton();
		this._createMenu();
	}
	
	,_createButton: function() {

		var wrapper = this.wrapper
			,buttonText = this.element.find('option').first().text()
			,clickFn = $.proxy(this._toggleMenu,this);
		
		this.button = $('<button>')
			.appendTo(this.wrapper)
			.text(buttonText)
			.button({
				icons: {
					primary: 'ui-icon-triangle-1-s'
				}
				,text: true
			})
			.addClass('nunaliit-dropselector-button')
			.click(clickFn);
	}

	,_createMenu: function() {

		var _this = this;
		
		this.menuParent = $('<div>')
			.addClass('nunaliit-dropselector-menu-wrapper')
			.css('position','absolute')
			.appendTo(this.wrapper)
			.hide();
			
		var $menu = $('<ul>')
			.appendTo(this.menuParent)
			.addClass('nunaliit-dropselector-menu');
		
		this.element.find('option').each(function(){
			var $opt = $(this);
			
			var value = $opt.val();
			if( value ) {
				var $li = $('<li>').appendTo($menu);
				$('<a>')
					.appendTo($li)
					.attr('href','#')
					.text($opt.text())
					.click(createClickHandler(value))
					;
			};
		});
		
		$menu.menu();
		
		function createClickHandler(value){
			return function(){
				_this._click(value);
			};
		};
	}
	
	,_toggleMenu: function(){
		var wrapper = this.wrapper
			,menu = wrapper.find('.nunaliit-dropselector-menu-wrapper');
		
		// Close if already visible
		if( menu.is(':visible') ) {
			$(wrapper).find('.ui-button-icon-primary')
				.removeClass('ui-icon-triangle-1-n')
				.addClass('ui-icon-triangle-1-s');
			menu.hide();
		} else {
			$(wrapper).find('.ui-button-icon-primary')
				.removeClass('ui-icon-triangle-1-s')
				.addClass('ui-icon-triangle-1-n');
			menu
				.show()
				.position({
					my:'left top'
					,at: 'left bottom'
					,collision: 'none'
					,of: this.button
				})
				;
		};
	}

	,_click: function(value) {
		this._toggleMenu();
		this.element.val(value);
		this.element.trigger('change');
	}
	
	,_destroy : function() {
		this.wrapper.remove();
		this.element.show();
	}
});

// Custom Menu for <select> elements
$.widget( 'nunaliit.menuselector', {
	_create: function() {
		var _this = this;

		this.wrapper = $('<span>')
			.addClass('nunaliit-menuselector')
			.insertAfter(this.element);
		
		var classes = this.element.attr('class');
		
		var text = this.element.find('option').first().text();
		this.button = $('<select>')
			.appendTo(this.wrapper)
			.mousedown(function(e){
				_this._toggleMenu();
				return false;
			});
		if( classes ){
			this.button.attr('class',classes);
		};
		$('<option>')
			.text(text)
			.appendTo(this.button);

		this.menu = $('<div>')
			.addClass('nunaliit-menuselector')
			.css('position','absolute')
			.css('left','0px')
			.css('top','0px')
			.css('display','block')
			.css('z-index',1000)
			.hide()
			.appendTo(this.wrapper);

		this.element.hide();
	}
	
	,_createMenu: function(wrapper) {

		var _this = this;
		
		var $menu = $('<ul>')
			.appendTo(wrapper)
			.addClass('nunaliit-menuselector-menu');
		
		this.element.find('option').each(function(){
			var $opt = $(this);
			
			var value = $opt.val();
			if( value ) {
				var $li = $('<li>').appendTo($menu);
				$('<a>')
					.appendTo($li)
					.attr('href','#')
					.text($opt.text())
					.click(createClickHandler(value))
					;
			};
		});
		
		$menu.menu();
		
		function createClickHandler(value){
			return function(){
				_this._click(value);
				return false;
			};
		};
	}
	
	,_toggleMenu: function(){
		var wrapper = this.wrapper
			,menu = wrapper.children('div');
		
		// Close if already visible
		if( menu.is(':visible') ) {
			menu.empty();
			menu.hide();
		} else {
			this._createMenu(menu);
			menu.show();
			menu.position({
					my:'left top'
					,at: 'left bottom'
					//,collision: 'none'
					,of: this.button
				})
				;
		};
	}
	
	,_click: function(value) {
		this._toggleMenu();
		this.element.val(value);
		this.element.trigger('change');
	}
	
	,_destroy : function() {
		this.wrapper.remove();
		this.element.show();
	}
});

})(jQuery,nunaliit2);