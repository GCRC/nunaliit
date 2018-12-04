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
	
	mdcDialogComponent: null,
	
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
	
	_getDialogElem: function(){
		return $('#'+this.helpDialogId);
	},
	
	show: function($elem){
		var _this = this;
		var content = "";
		var $dialog = $('<div>')
			.attr('id',this.helpDialogId)
			.attr('role','alertdialog')
			.attr('aria-modal','true')
			.attr('aria-labelledby','my-dialog-title')
			.attr('aria-describedby','my-dialog-content')
			.addClass('n2help_content mdc-dialog')
			.appendTo($('body'));

		var $dialogContainer = $('<div>')
			.addClass('mdc-dialog__container')
			.appendTo($dialog);

		var $dialogSurface = $('<div>')
			.addClass('mdc-dialog__surface')
			.appendTo($dialogContainer);

		$('<h2>')
			.addClass('mdc-dialog__title')
			.text(_loc(this.title))
			.appendTo($dialogSurface);

		var $dialogMessage = $('<div>')
			.addClass('n2dialogs_alert_message mdc-dialog__content')
			.text(content)
			.appendTo($dialogSurface);

		if( this.htmlContent ){
			// localize content
			$dialogMessage.html(_loc(this.htmlContent));
		} else if( this.textContent ){
			$dialogMessage.text(_loc(this.textContent));
		} else {
			return;
		};

		var $footer = $('<footer>')
			.addClass('mdc-dialog__actions')
			.appendTo($dialogSurface);

		var $button = $('<button>')
			.addClass('n2dialogs_alert_okButton mdc-button mdc-dialog__button')
			.text(_loc('Close'))
			.appendTo($footer)
			.click(function(){
				_this.mdcDialogComponent.close();
				$dialog.remove();
				return false;
			});
		
		$('<div>')
			.addClass('mdc-dialog__scrim')
			.click(function(){
				_this.mdcDialogComponent.close();
				$dialog.remove();
				return false;
			})
			.appendTo($dialog);

		// Attach ripple to button
		mdc.ripple.MDCRipple.attachTo($button[0]);

		// Attach mdc component to alert dialog
		this.mdcDialogComponent = new mdc.dialog.MDCDialog($dialog[0]);
		this.mdcDialogComponent.open();

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
	,InstallHelpInfo: InstallHelpInfo
};

})(jQuery,nunaliit2);
