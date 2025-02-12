/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

function onProgressUpdate(tracker) {
	var progressKey = tracker.getProgressKey();
	var $set = $('#n2UploadProgress_'+progressKey);
	if( $set.length < 1 ) {
		// Element is gone, stop tracking
		tracker.cancel();
	} else {
		var total = tracker.getTotal();
		var count = tracker.getCurrent();
		var percent = 0;
		if( total != 0 ) {
			percent = ((count / total) * 100);
		}
		$set.find('.n2UploadProgressBar').css('width',''+percent+'%').attr('alt','File Upload '+percent+'%');
		$set.find('.n2UploadProgressBarBackground').attr('alt','File Upload '+percent+'%');
	};
};

var UploadDefaultOptions = {
	url: null
	,progressServer: null // Instance of n2.progress.ProgressTracker
};

var Upload = $n2.Class({
	
	options: null
	
	,welcomeMessage: null
	
	,initialize: function(options_) {
		this.options = $n2.extend({},UploadDefaultOptions,options_);
	}

	,buildForm: function(jQuerySet, options_) {
		var upload = this;
		
		var opts = $.extend({
				onSuccess: function(res){}
				,onError: function(errorMsg){ $n2.reportError(errorMsg); }
			}
			,this.options
			,options_
		);
		
		// Empty jQuerySet
		jQuerySet.empty();
		
		// This works only if jquery.form is available
		if( !$.fn.ajaxSubmit ) {
			opts.onError( _loc('Can not perform file uploads unless jquery.form.js is included') );
		};
		
		jQuerySet.each(function(i, elem){
			installForm(elem, opts.docId, opts.rev);
		});
		
		function installForm(elem, docId, docRev) {
			var $elem = $(elem)
				,$form = $('<form class="n2UploadForm" method="post"></form>')
				,$button = $('<input class="n2UploadInputButton" type="button"/>')
				;
			$form.append( $('<input class="n2UploadInputFile" type="file" name="_attachments"/>') );
			$button.val( _loc('Upload') );
			$form.append( $button );
			$elem.append($form);
			
			$button.click(uploadClicked);
		};

		function uploadClicked(evt) {
			var $btn = $(this);
			var $form = $btn.parents('.n2UploadForm');

			// Disable elements while file is uploading
			$form.find('.n2UploadInputButton').attr('disabled','disabled');

			if( opts.progressServer ) {
				opts.progressServer.requestProgressKey(function(key){
					performUpload($form, key);
				});
			} else {
				performUpload($form, null);
			}
		};
		
		function performUpload($form, progressKey) {

			$form.find('.n2UploadProgressId').remove();
			if( progressKey ) {
				$form.prepend( $('<input class="n2UploadProgressId" type="hidden" name="progressId" value="'+progressKey+'"/>') );
			};

			$form.ajaxSubmit({
				type: 'post'
				,url: opts.url + 'put'
				,dataType: 'json'
				,success: function(res) {
					$form.find('*').removeAttr('disabled');
					if( res.error ) {
						opts.onError(_loc('Error while uploading: ')+res.error,options_);
					} else {
						opts.onSuccess(res,options_);
					}
				}
				,error: function(xhr, status, err) {
					$form.find('*').removeAttr('disabled');
					opts.onError(_loc('Error while uploading: ')+err,options_);
				}
			});
			
			// Add progress div, if required
			if( progressKey ) {
				var progressDiv = $('<div id="n2UploadProgress_'+progressKey+'" class="n2UploadProgress">'
						               +'<div class="n2UploadProgressBarBackground">'
						                  +'<div class="n2UploadProgressBar">'
						             +'</div></div></div>');
				$form.after(progressDiv);
				upload.options.progressServer.createProgressTracker({
					progressKey: progressKey
					,onUpdate: onProgressUpdate
				});
			};
		};
	}

	,submitForm: function(options_) {
		var _this = this;
		
		var opts = $.extend({
				form: null
				,uploadFile: null
				,suppressInformationDialog: false
				,onSuccess: function(res){}
				,onError: function(errorMsg){ $n2.reportError(errorMsg); }
			}
			,this.options
			,options_
		);
		
		// This works only if jquery.form is available
		if( !$.fn.ajaxSubmit ) {
			opts.onError( 'Can not perform file uploads unless jquery.form.js is included' );
			return;
		};
		
		if( !opts.form ) {
			opts.onError( 'Form element is required' );
			return;
		};
		var $form = opts.form;
		if( typeof($form) === 'string' ) {
			$form = $('#'+$form);
		};
		
		// Disable elements while file is uploading
		$form.find('.n2UploadInputButton').attr('disabled','disabled');

		if( opts.progressServer ) {
			opts.progressServer.requestProgressKey(function(key){
				performUpload($form, opts.uploadFile, key);
			});
		} else {
			performUpload($form, null);
		};
		
		function performUpload($form, uploadFile, progressKey) {

			$form.find('.n2UploadProgressId').remove();
			if( progressKey ) {
				$form.prepend( $('<input class="n2UploadProgressId" type="hidden" name="progressId" value="'+progressKey+'"/>') );
			};

			const formData = new FormData($form[0]);
			if (opts.uploadFile !== null) {
				formData.append('media', uploadFile);
			}
			for (let [name, value] of formData.entries()) {
				if (name === 'media') {
					const filesize = value?.size
					const serverMaxSize = _this?.welcomeMessage?.maxSize
					if (!isNaN(filesize) && !isNaN(serverMaxSize)) {
						// 500 is a guess for the remainder of the request contents
						// Because the server actually checks for entire request size (not just file size) in reality
						if ((filesize + 500) >= serverMaxSize) {
							const filesizeWarningDivID = "filesizeWarning"
							if ($('#' + filesizeWarningDivID).length === 0) {
								const filesizeWarningDiv = $(
									'<div id="' + filesizeWarningDivID + '" style="color: red;">' 
									+ _loc('Maximum file size allowed') + ': '
									+  Math.floor((serverMaxSize / 1000000) / 10) * 10
									+ 'MB'
									+ '</div>');
								$form.before(filesizeWarningDiv);
							}
							return
						}
					}
				}
			}

			$.ajax({
				type: 'POST'
				,url: opts.url + 'put'
				,data: formData
				,dataType: 'json'
				,processData: false
				,contentType: false
				,success: function(res) {
					$form.find('*').removeAttr('disabled');
					if( res.error ) {
						opts.onError(_loc('Error while uploading: ')+res.error,options_);
					} else {
						if( !opts.suppressInformationDialog ) {
							_this._uploadSucessfulDialog();
						};
						opts.onSuccess(res,options_);
					}
				}
				,error: function(xhr, status, err) {
					$form.find('*').removeAttr('disabled');
					opts.onError(_loc('Error while uploading: ')+err,options_);
				}
			});
			
			// Add progress div, if required
			if( progressKey ) {
				var progressDiv = $('<div id="n2UploadProgress_'+progressKey+'" class="n2UploadProgress">'
						               +'<div class="n2UploadProgressBarBackground">'
						                  +'<div class="n2UploadProgressBar">'
						             +'</div></div></div>');
				$form.after(progressDiv);
				_this.options.progressServer.createProgressTracker({
					progressKey: progressKey
					,onUpdate: onProgressUpdate
				});
			};
		};
	}
	
	/**
	 * Get welcome message from the upload server if none has been
	 * obtained before. If this is the first try, reaches the server
	 * for the welcome.
	 */
	,checkWelcome: function(options_){
		var opts = $.extend({
				onSuccess: function(message){}
				,onError: function(errorMsg){ $n2.reportError(errorMsg); }
			}
			,this.options
			,options_
		);
		
		if( this.welcomeMessage ) {
			opts.onSuccess(this.welcomeMessage);
		} else {
			this.getWelcome(opts);
		};
	}

	/**
	 * Forces to fetch a welcome message from the upload server
	 */
	,getWelcome: function(options_) {
		var opts = $.extend({
				onSuccess: function(message){}
				,onError: function(errorMsg){ $n2.reportError(errorMsg); }
			}
			,this.options
			,options_
		);
		
		var _this = this;
		
		$.ajax({
			url: opts.url+'welcome'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.ok ) {
					_this.welcomeMessage = data;
					opts.onSuccess(data);
				} else {
					opts.onError(data);
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				opts.onError(errorThrown);
			}
		});
	}
	
	,_uploadSucessfulDialog: function(){
		if( ! $.fn.button 
		 || ! $.fn.dialog ) {
			// No jquery-ui. Ignore
			return;
		};
		
		// Inform user of approval process
		var infoDialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+infoDialogId+'"></div>');

		var $label = $('<span></span>');
		$label.text( _loc('Your file was uploaded and will become available when it has been approved.') );
		$dialog.append($label);
		
		$('<br/>').appendTo($dialog);
		
		var $ok = $('<button></button>');
		$ok.text( _loc('OK') );
		$ok.button({icons:{primary:'ui-icon-check'}});
		$dialog.append( $ok );
		$ok.click(function(){
			var $diag = $('#'+infoDialogId);
			$diag.dialog('close');
			return false;
		});
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('File Uploaded')
			,modal: true
			,width: 500
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
	}
});
	
$n2.upload = {
	Upload: Upload
	
};

})(jQuery,nunaliit2);