/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.blindWidget.js 8437 2012-08-14 17:59:23Z jpfiset $
*/

// @requires n2.core.js
// @requires n2.utils.js

/*
 * This is a widget based on the jquery-ui accordion styles
 * and behaviour.
 * It enables to opening and closing of one pane, with appropriate
 * callbacks.
 */
;(function($,$n2){
	
	var noopFn = function(){}
	
	var BlindWidget = $n2.Class({
		options: null
		
		,id: null
		
		,initialize: function($elem, opts_){

			var _this = this;
			
			this.options = $n2.extend({
				time: 500
				,data: null
				,onBeforeOpen: noopFn
				,onAfterOpen: noopFn
				,onBeforeClose: noopFn
				,onAfterClose: noopFn
			},opts_);
			
			var id = $elem.attr('id');
			if( null === id || typeof(id) === 'undefined' ) {
				id = $n2.getUniqueId();
				$elem.attr('id',id);
			};
			this.id = id;
			
			var $header = $elem.children().first();
			var $div = $header.next();
			
			$elem.addClass('n2Blind ui-accordion ui-widget ui-helper-reset ui-accordion-icons');
			
			var headerText = $header.text();
			$header.empty()
				.append( $('<span class="ui-icon ui-icon-triangle-1-e"></span>') )
				.append( $('<a class="n2BlindA" href="#"></a>') );
			$header.find('a')
				.text(headerText)
				.click(function(){
					_this._headerClicked();
					return false;
				});
			$header.addClass('ui-accordion-header ui-helper-reset ui-state-default ui-corner-top');
			
			$div
				.addClass('ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active')
				.css('display','none');
		}
	
		,setText: function(t){
			var $elem = $('#'+this.id);
			var $header = $elem.children().first();
			$header.find('a').text(t);
		}
		
		,setHtml: function(h){
			var $elem = $('#'+this.id);
			var $header = $elem.children().first();
			$header.find('a').html(h);
		}

		,_headerClicked: function(){

			var _this = this;

			var $sections = $('#'+this.id);
			if( $sections.length < 1 ) {
				return;
			};
			var $header = $sections.children().first();
			var $a = $header.find('a');
			var $div = $header.next();
			
			var info = {
				data: this.options.data
				,link: $a
				,content: $div
			};

			if( $div.hasClass('n2uiActive') ) {
				$header.removeClass('ui-state-active ');
				$header.find('span')
					.removeClass('ui-icon-triangle-1-s')
					.addClass('ui-icon-triangle-1-e');
				$div.removeClass('n2uiActive');
				this.options.onBeforeClose(info);
				$div.hide('blind',{},this.options.time,function(){
					_this.options.onAfterClose(info);
				});
			} else {
				$header.addClass('ui-state-active ');
				$header.find('span')
					.removeClass('ui-icon-triangle-1-e')
					.addClass('ui-icon-triangle-1-s');
				$div.addClass('n2uiActive');
				this.options.onBeforeOpen(info);
				$div.show('blind',{},this.options.time,function(){
					_this.options.onAfterOpen(info);
				});
			};
		}
	});
	
	$n2.blindWidget = function($jq,options){
		return new BlindWidget($jq.first(),options);
	};
})(jQuery, nunaliit2);
