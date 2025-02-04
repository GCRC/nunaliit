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
"use strict";

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
			
			// IE8 or older, Array.indexOf does not exist
			if (!Array.prototype.indexOf) {
				Array.prototype.indexOf = function(elt /*, from*/) {
					var len = this.length >>> 0;
					
					var from = Number(arguments[1]) || 0;
					from = (from < 0) ? Math.ceil(from) : Math.floor(from);
					if (from < 0) from += len;
					
					for(; from < len; ++from) {
						if( from in this 
						 && this[from] === elt) {
							return from;
						};
					};
					return -1;
				};
			};
		};
	};
};

/*
 *  jQuery-UI Widget: menuselector
 * 
 *  This is a widget that should be installed on a <select> element for
 *  making it easier to style the drop-down list.
 *  
 *  Usage:
 *  	$elem.menuselector(options);
 *  
 *  Example:
 *  	<select id="sel">
 *  		<option>Select one...</option>
 *  		<option value="first">ABC</option>
 *  		<option value="second">DEF</option>
 *  	</select>
 *  
 *  	$('#sel').menuselector();
 */
if( typeof $.widget === 'function' ){
	$.widget( 'nunaliit.menuselector', {
		
		options: {
			menuClass: null,
			spanClass: null
		}
	
		,_create: function() {
			var _this = this;
	
			this.wrapper = $('<span>')
				.addClass('nunaliit-menuselector')
				.addClass('nunaliit_form_link_add_related_item_wrapper')
				.insertAfter(this.element);

			if (this.options.wrapperSpanClass) {
				this.wrapper.addClass(this.options.wrapperSpanClass)
			}

			var classes = this.element.attr('class');
			
			var text = this.element.find('option').first().text();
			this.button = $('<select>')
				.appendTo(this.wrapper)
				.on('mousedown', function(e) {
					_this._toggleMenu();
					return false;
				})
				.on('keydown', function(e) {
					if (e.key === 'Enter' || e.keyCode === 13) {
						_this._toggleMenu();
						return false;
					}
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
				.attr('tabindex',0)
				.hide()
				.appendTo(this.wrapper);
			
			this.menu.on('focusout', function(e) {
				if (!_this.menu.has(e.relatedTarget).length) {
					_this.menu.hide();
				}
			});
			this.element.hide();
		}
		
		,_createMenu: function(wrapper) {
	
			var _this = this;
			
			var $menu = $('<ul>')
				.appendTo(wrapper)
				.addClass('nunaliit-menuselector-menu');
			
			if( this.options.menuClass ){
				$menu.addClass(this.options.menuClass);
			};
			
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
				menu.empty();
				this._createMenu(menu);
				menu.show();
				menu.find('a').attr('tabindex', 0);
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
};

/**
 * Enhances the jQuery UI Dialog to maintain focus on the element that opened it.
 * This prevents focus from moving to the document root after the dialog closes.
 */
const enhanceDialog = () => {
    const originalClose = $.ui.dialog.prototype.close;
    const originalOpen = $.ui.dialog.prototype.open;

    // Extend the jQuery UI Dialog widget
    $.extend($.ui.dialog.prototype, {
        close: function (event) {
			originalClose.call(this, event);

			// Focus the element that triggered the dialog, if available
			if (this.triggerElement) {
				this.triggerElement.focus();
			}
        },

        open: function (event) {
            // Capture the element that triggered the dialog
            this.triggerElement = $(document.activeElement);
            originalOpen.call(this, event);
        },
    });
};
enhanceDialog()

})(jQuery,nunaliit2);