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
$.widget( 'nunaliit.combobox', {
	_create: function() {
		this.wrapper = $('<span>').addClass('nunaliit-combobox')
			.insertAfter(this.element);

		this.element.hide();
		this._createAutocomplete();
		this._createShowAllButton();
	}

	,_createAutocomplete: function() {
		var selected = this.element.children(':selected')
			,value = selected.val() ? selected.text() : '';

		this.input = $('<input>')
			.appendTo(this.wrapper)
			.val(value)
			.attr('title', '')
			.addClass('custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left')
			.autocomplete({
				delay : 0,
				minLength : 0,
				source : $.proxy(this, '_source')
			})
			.tooltip({
				tooltipClass : 'ui-state-highlight'
			});

		this._on(
			this.input
			,{
				autocompleteselect: function(event, ui) {
					ui.item.option.selected = true;
					this._trigger('select', event, {
						item : ui.item.option
					});
				}
				,autocompletechange: '_removeIfInvalid'
			}
		);
	}
	
	,_createShowAllButton: function() {
		var input = this.input, wasOpen = false;

		$('<a>')
			.attr('tabIndex', -1)
			.attr('title','Show All Items')
			.tooltip()
			.appendTo(this.wrapper)
			.button({
				icons: {
					primary : 'ui-icon-triangle-1-s'
				}
				,text: false
			})
			.removeClass('ui-corner-all')
			.addClass('custom-combobox-toggle ui-corner-right')
			.mousedown(function() {
				wasOpen = input.autocomplete('widget').is(':visible');
			})
			.click(function() {
				input.focus();

				// Close if already visible
				if( wasOpen ) {
					return;
				}

				// Pass empty string as value to search
				// for, displaying all results
				input.autocomplete('search', '');
			});
	}

	,_source: function(request, response) {
		var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), 'i');
		response(
			this.element.children('option').map(
				function() {
					var text = $(this).text();
					if (this.value
					 && (!request.term || matcher.test(text)) ) {
						return {
							label : text,
							value : text,
							option : this
						};
					};
				}
			)
		);
	}
	
	,_removeIfInvalid: function(event, ui) {

		// Selected an item, nothing to do
		if (ui.item) {
			return;
		};

		// Search for a match (case-insensitive)
		var value = this.input.val()
			,valueLowerCase = value.toLowerCase()
			,valid = false;

		this.element
			.children('option')
			.each(function() {
				if( $(this).text().toLowerCase() === valueLowerCase ) {
					this.selected = valid = true;
					return false;
				}
			});

		// Found a match, nothing to do
		if (valid) {
			return;
		};

		// Remove invalid value
		this.input
			.val('')
			.attr('title',value + ' didn\'t match any item')
			.tooltip('open');
		this.element.val('');
		this._delay(function() {
			this.input
				.tooltip('close')
				.attr('title', '');
			}
			,2500
		);
		this.input.data('ui-autocomplete').term = '';
	}
	
	,_destroy : function() {
		this.wrapper.remove();
		this.element.show();
	}
});

})(jQuery,nunaliit2);