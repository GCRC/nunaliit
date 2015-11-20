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
 ,DH = 'n2.mail'
 ;

var MailService = $n2.Class({
	
	url: null,
	
	dispatchService: null,
	
	welcome: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.url = opts.url;
		this.dispatchService = opts.dispatchService;
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'mailShowMailForm',f);
			this.dispatchService.register(DH,'showPreprocessElement',f);
		};
		
		this.getWelcome({
			onSuccess: function(welcome){
				$n2.log('mail service',welcome);
			}
		});
	},
	
	getWelcome: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(welcome){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		if( this.welcome ){
			opts.onSuccess( this.welcome );
		} else {
			$.ajax({
				url: this.url
				,type: 'get'
				,async: true
				,dataType: 'json'
				,success: function(res) {
					if( res.ok ) {
						_this.welcome = res;
						opts.onSuccess(res);
					} else {
						opts.onError('Malformed welcome reported');
					};
				}
				,error: function(XMLHttpRequest, textStatus, errorThrown) {
					var errStr = $n2.utils.parseHttpJsonError(XMLHttpRequest, textStatus);
					opts.onError('Error obtaining welcome: '+errStr);
				}
			});
		};
	},
	
	formEmailAvailable: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(available){}
			,onError: function(err){}
		},opts_);
		
		this.getWelcome({
			onSuccess: function(welcome){
				var available = false;
				
				if( welcome.ok 
				 && welcome.configured 
				 && welcome.defaultRecipientCount > 0 ){
					available = true;
				};
				
				opts.onSuccess(available);
			}
			,onError: opts.onError
		});
	},
	
	sendFormEmail: function(opts_){
		var opts = $n2.extend({
			destination: null
			,contact: null
			,message: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var request = {};
		if( opts.destination ){
			request.destination = opts.destination;
		};
		if( opts.contact ){
			request.contact = opts.contact;
		};
		if( opts.message ){
			request.body = opts.message;
		};
		
		if( !request.contact 
		 || (typeof request.contact === 'string' && request.contact.length < 1) ){
			opts.onError( _loc('You must provide contact information') );
			return;
		};
		
		if( !request.message 
		 || (typeof request.message === 'string' && request.message.length < 1) ){
			opts.onError( _loc('You must provide a message') );
			return;
		};
		
		$.ajax({
			url: this.url + 'sendFormMail'
			,type: 'post'
			,async: true
			,dataType: 'json'
			,data: request
			,success: function(res) {
				if( res.ok ) {
					opts.onSuccess(res);
				} else {
					opts.onError('Problem: '+res.error);
				};
			}
			,error: function(XMLHttpRequest, textStatus, errorThrown) {
				var errStr = $n2.utils.parseHttpJsonError(XMLHttpRequest, textStatus);
				if( typeof errStr === 'object' && errStr.error ){
					errStr = errStr.error;
				};
				opts.onError('Error sending form e-mail: '+errStr);
			}
		});
	},
	
	showMailForm: function(){
		var _this = this;
		
		var diagId = $n2.getUniqueId();
		var $diag = $('<div>')
			.addClass('n2mailForm_dialog')
			.attr('id',diagId)
			.appendTo( $('body') );

		var $content = $('<div>')
			.addClass('n2mailForm_content')
			.appendTo( $diag );
		
		$('<div>')
			.addClass('n2mailForm_label')
			.text( _loc('Contact Information') )
			.appendTo($content);
		
		$('<textarea>')
			.addClass('n2mailForm_input n2mailForm_input_contact')
			.attr('placeholder', _loc('Information to contact you'))
			.appendTo($content);
		
		$('<div>')
			.addClass('n2mailForm_label')
			.text( _loc('Message') )
			.appendTo($content);
		
		$('<textarea>')
			.addClass('n2mailForm_input n2mailForm_input_message')
			.appendTo($content);
		
		var $buttons = $('<div>')
			.addClass('n2mailForm_buttons')
			.appendTo($diag);
		
		$('<a>')
			.addClass('n2mailForm_button n2mailForm_button_cancel')
			.text( _loc('Cancel') )
			.attr('href','#')
			.appendTo($buttons)
			.click(function(){
				var $diag = $('#'+diagId);
				$diag.dialog('close');
				return false;
			});
		
		$('<a>')
			.addClass('n2mailForm_button n2mailForm_button_send')
			.text( _loc('Send') )
			.attr('href','#')
			.appendTo($buttons)
			.click(function(){
				var $diag = $('#'+diagId);
				$diag.find('input').attr('disabled','disabled');
				$diag.find('textarea').attr('disabled','disabled');
				$diag.find('.n2mailForm_button').addClass('n2mailForm_button_cancel');
				
				var contact = $diag.find('.n2mailForm_input_contact').val();
				var message = $diag.find('.n2mailForm_input_message').val();
				
				_this.sendFormEmail({
					destination: null
					,contact: contact
					,message: message
					,onSuccess: function(){
						var $diag = $('#'+diagId);
						$diag.find('.n2mailForm_content')
							.empty()
							.text(_loc('Your message was sent'));
						var $buttons = $diag.find('.n2mailForm_buttons')
							.empty();

						$('<a>')
							.addClass('n2mailForm_button n2mailForm_button_close')
							.text( _loc('Close') )
							.attr('href','#')
							.appendTo($buttons)
							.click(function(){
								var $diag = $('#'+diagId);
								$diag.dialog('close');
							});
					}
					,onError: function(err){
						alert( _loc('Unable to send e-mail: {err}',{
							err: err
						}) );
						var $diag = $('#'+diagId);
						$diag.dialog('close');
					}
				});
				
				return false;
			});
		
		$diag.dialog({
			autoOpen: true
			,title: _loc('E-mail Form')
			,modal: true
			,width: 'auto'
			,close: function(event, ui){
				var $diag = $('#'+diagId);
				$diag.remove();
			}
		});
	},
	
	_insertMailFormButton: function($elem){
		var _this = this;
		
		$elem.empty();
		var elemId = $n2.utils.getElementIdentifier($elem);
		
		var label = $elem.attr('nunaliit-label');
		if( !label ){
			label = _loc('Send us information');
		};
		
		this.formEmailAvailable({
			onSuccess: function(available){
				if( available && _this.dispatchService ){
					var $elem = $('#'+elemId);
					
					$('<a>')
						.addClass('n2mailFormButton')
						.attr('href','#')
						.text( label )
						.appendTo($elem)
						.click(function(){
							_this.dispatchService.send(DH,{
								type: 'mailShowMailForm'
							});
							return false;
						});
				};
			}
			,onError: function(err){}
		});
	},
	
	_showPreprocessElement: function($elem){
		var _this = this;
		
		var $set = $elem.find('*').addBack();
		
		$set.filter('.n2s_insertMailFormButton').each(function(){
			var $jq = $(this);
			_this._insertMailFormButton($jq);
			$jq.removeClass('n2s_insertMailFormButton').addClass('n2s_insertedMailFormButton');
		});
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'mailShowMailForm' === m.type ){
			this.showMailForm();

		} else if( 'showPreprocessElement' === m.type ){
			var $elem = m.elem;
			this._showPreprocessElement($elem);
		};
	}
});
 
//--------------------------------------------------------------------------
$n2.mail = {
	MailService: MailService
};

})(jQuery,nunaliit2);
