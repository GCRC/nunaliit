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

;(function($,$n2){
"use strict";

var 
	_loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
	,DH = 'n2.help'
	;

//=========================================================================	

var helpDisplayByKey = {};	
	
//=========================================================================	
var HelpDisplay = $n2.Class({
	
	helpDialogId: null,
	
	title: null,
	
	htmlContent: null,
	
	textContent: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			title: 'Help'
			,htmlContent: null
			,textContent: null
		},opts_);
		
		this.title = opts.title;
		this.htmlContent = opts.htmlContent;
		this.textContent = opts.textContent;
		
		this.helpDialogId = $n2.getUniqueId();
	},
	
	show: function($elem){
		// If open, then close it
		var $dialog = this._getDialogElem();
		if( $dialog.length > 0 ){
			$dialog.dialog('open');
		} else {
			this._createDialog($elem);
		};
	},
	
	hide: function(){
		var $dialog = this._getDialogElem();
		if( $dialog.length > 0 ){
			$dialog.dialog('close');
		};
	}, 
	
	toggle: function($elem){
		var $dialog = this._getDialogElem();
		if( $dialog.length > 0 ){
			var isOpen = $dialog.dialog('isOpen');
			if( isOpen  ) {
				this.hide($elem);
			} else {
				this.show($elem);
			};
		} else {
			this.show($elem);
		};
	},
	
	_getDialogElem: function(){
		return $('#'+this.helpDialogId);
	},
	
	_createDialog: function($elem){

		// Check that dialog support is available
		if( !$.fn ) return;
		if( !$.fn.dialog ) return;
		
		var $dialog = $('<div>')
			.attr('id',this.helpDialogId)
			.attr('tabindex', 0)
			.addClass('n2help_content')
			.appendTo( $('body') );
		
		if( this.htmlContent ){
			// localize content
			var content = _loc(this.htmlContent);
			$dialog.html(content);
		} else if( this.textContent ){
			var content = _loc(this.textContent);
			$dialog.text(content);
		} else {
			return;
		};
		
		$dialog.appendTo( $('body') );
		
		var initialHeight = $dialog.height();
		var initialWidth = $dialog.width();
		
		var windowHeight = $(window).height();
		var windowWidth = $(window).width();
		
		var diagMaxHeight = Math.floor(windowHeight * 0.8);
		var diagMaxWidth = Math.floor(windowWidth * 0.8);

		var dialogOptions = {
			autoOpen: true
			,dialogClass:'n2help_dialog'
			,title: _loc(this.title)
			,modal: false
			,width: 400
//			,position:{
//				my: 'right top'
//				,at: 'right bottom'
//				,of: $('#'+_this.helpButtonName+' .nunaliit_module_help_button')
//			}
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		
		// Ensure to not exceed available geometry
		var height = initialHeight;
		if( initialHeight > diagMaxHeight ){
			dialogOptions.height = diagMaxHeight;
			height = diagMaxHeight;
		};
		var width = initialWidth;
		if( initialWidth > diagMaxWidth ){
			dialogOptions.width = diagMaxWidth;
			width = diagMaxWidth;
		};
		
		if( $elem ){
			var offset = $elem.offset();
			
			var fitsAbove = false;
			var fitsBelow = false;
			var fitsLeft = false;
			var fitsRight = false;
			
			if( offset.top >= height ){
				fitsAbove = true;
			};
			if( (windowHeight - offset.top - $elem.height()) >= height ){
				fitsBelow = true;
			};
			if( offset.left >= width ){
				fitsLeft = true;
			};
			if( (windowWidth - offset.left - $elem.width()) >= height ){
				fitsRight = true;
			};
			
			if( fitsBelow && fitsLeft ){
				dialogOptions.position = {
					my: 'right top'
					,at: 'right bottom'
					,of: $elem
				};
				
			} else if( fitsBelow && fitsRight ){
				dialogOptions.position = {
					my: 'left top'
					,at: 'left bottom'
					,of: $elem
				};
				
			} else if( fitsBelow ){
				dialogOptions.position = {
					my: 'center top'
					,at: 'center bottom'
					,of: $elem
				};
				
			} else if( fitsAbove && fitsLeft ){
				dialogOptions.position = {
					my: 'right bottom'
					,at: 'right top'
					,of: $elem
				};
				
			} else if( fitsAbove && fitsRight ){
				dialogOptions.position = {
					my: 'left bottom'
					,at: 'left top'
					,of: $elem
				};
				
			} else if( fitsAbove ){
				dialogOptions.position = {
					my: 'center bottom'
					,at: 'center top'
					,of: $elem
				};
				
			} else if( fitsLeft ){
				dialogOptions.position = {
					my: 'right center'
					,at: 'left center'
					,of: $elem
				};
				
			} else if( fitsRight ){
				dialogOptions.position = {
					my: 'left center'
					,at: 'right center'
					,of: $elem
				};
			};
		};
		
		$dialog.dialog(dialogOptions);
	}
});
	
//=========================================================================	

function ShowHelp(key, $elem){
	var helpDisplay = helpDisplayByKey[key];
	if( helpDisplay ){
		helpDisplay.show($elem);
	};
};

//=========================================================================	

function ToggleHelp(key, $elem){
	var helpDisplay = helpDisplayByKey[key];
	if( helpDisplay ){
		helpDisplay.toggle($elem);
	};
};

//=========================================================================	

function InstallHelpInfo(key, helpInfo){
	if( key && helpInfo ){
		if( 'html' === helpInfo.type 
		 && helpInfo.content ){
			helpDisplayByKey[key] = new HelpDisplay({
				htmlContent: helpInfo.content
				,title: helpInfo.title
			});
			
		} else if( 'text' === helpInfo.type 
		 && helpInfo.content ){
			helpDisplayByKey[key] = new HelpDisplay({
				textContent: helpInfo.content
				,title: helpInfo.title
			});
		};
	};
};

//=========================================================================	

$n2.help = {
	ShowHelp: ShowHelp
	,ToggleHelp: ToggleHelp
	,InstallHelpInfo: InstallHelpInfo
};

})(jQuery,nunaliit2);
