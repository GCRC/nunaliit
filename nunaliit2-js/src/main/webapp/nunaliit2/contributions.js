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

$Id: contributions.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

// @requires n2.utils.js

NUNALIIT_CONTRIBUTIONS = null;

function olkitContributions($, options_) { // defined here - but explicitly invoked by initContributionHandler() below

	// Localization
	var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

// === UTILITY ====================================	

	var _formIntroString =
		'Contribute information about this place to the atlas. ' +
		'Your contribution will appear along with other comments about ' +
		'this place shown in the side panel. You can also upload ' +
		'an audio recording, video or images about the place.';
	var _formUpdateNotice = 'If you proceed you will <i>UPDATE the following comment</i>.';
	var _formAddNotice = 'If you proceed you will <i>ADD a new comment</i>.';
	var defaults = {
		db: null
		,putUrl: 'upload/put'
		,deleteUrl: 'contributions/delete'
		,table: 'contributions'
		,anonymousAllowed: true
		,formData: {
			formIntroText: _formIntroString
			,updateNotice: _formUpdateNotice
			,addNotice: _formAddNotice
			,editFields: [  // code specific to these fields exists to create the form - these are the defaults
				{
					name: 'title'
					,label: 'Title'
					,type: 'text'
				}
				,{
					name: 'notes'
					,label: 'Comment'
					,type: 'textarea'
					,cols: '50'
					,rows: '10'
				}
				,{
					name: 'filename'
					,label: '' // this gets filled in
					,type: 'file'
				}
// sample date field - not used in default atlas
//				,{
//					name: 'sort_date'
//					,label: 'Earliest date'
//					,type: 'date'
//					,dpOptionsFn: function() { // return obj containing datepicker options - seems convoluted but this delays evaluation }
//				}
			]
		}
		,data: {} // used dynamically to carry restful parms - don't initialize programmatically
		,onSuccess: function(msg, textStatus){}
		,onError: function(xmlHttpRequest, textStatus, errorThrown){}
	};
	var contributionOptions = $.extend(true, {}, defaults, options_)
	
	var index = 0;
	var dialog = null;
	var form = null;

	function UserSubmit() {
		form.remove();
		form.css({display:"none",postion:"absolute",top:"0px",left:"0px"});
		//holder.append(form);
		$(document.body).append(form);
		dialog.dialog('close');

		var myForm = form;
		form = null;

		_SubmitForm(myForm);
	};

	function UserCancel() {
		dialog.dialog('close');
		if( form ) {
			form.remove();
			form = null;
		}
	};

	function _SubmitForm(myForm) {
		try {
			$(myForm).ajaxSubmit({
				beforeSubmit: BeforeFormSubmit
				,success: function(data,success){OnFormSuccess(data,success,myForm);}
				,error: function(xhr, status, e){OnFormError(xhr, status, e, myForm);}
				,iframe: true
			});
		} catch(error) {
			OnFormError(null, 'error', error, myForm);
		}
	};

	function _SubmitFormImmediate(options,form) {
		try {
			form.ajaxSubmit({
				success: function(data,success){ form.remove(); }
				,error: function(xhr, status, e){ form.remove(); }
				,iframe: true
			});
		} catch(error) {
			form.remove();
		};
	};
	
	function InstallKey(myForm,key) {
		$(myForm).attr("contributions-key",key);
		_SubmitForm(myForm);
	};

	function BeforeFormSubmit(parmArray,form,options) {
		var $form = $(form);
		
		var needKey = 1;
		
		if( ! $.progress ) {
			// There is no progress tracker, do not attempt
			// to get a key.
			needKey = 0;
		}
		
		var key = $form.attr("contributions-key");
		if( key ) {
			// There is a key, do not need to get one
			needKey = 0;
		}
		
		if( needKey ) {
			// Get key
			$.progress.getProgressKey(function(key){
				InstallKey(form,key);
			});
			
			// We need a key. Abort submitting.
			return false;
		}
		
		// At this point, we have a key or we do not need one
		if( key ) {
			$.progress.startProgressTrackingOn(key,'Submit contribution');
			
			$form.prepend('<input type="hidden" name="progressId" value="'+key+'"/>');
		};
		
		return true;
	};
	
	function OnFormSuccess(data, status, myForm) {
		//if( window.console && window.console.log ) window.console.log('OnCompletion',status,data);
		
		myForm.remove();
	};

	function OnFormError(xhr, status, e, myForm) {
		//if( window.console && window.console.log ) window.console.log('OnError',status,xhr,e);
		
		myForm.remove();
	};

	function clearFileFields(oObj) {
		oObj.filename = null;
		oObj.original_filename = null;
		oObj.mimetype = null;
		oObj.file_size = null;
	}
	
	function createForm(options) {
		var fileDivName = '____contrib_fileDiv';
		var fileDeleteDivName = '____contrib_fileDeleteDiv';
		var deleteCBName = '___contrib_deleteCB';
		
		/*
		 * If want multiple files attached, then will need to sort out field handling in the server as well
		 * for all of the fields derived from the upload: size, mimetype, etc.
		 *
		 * The assumptions about labelling made here are just part of the story.
		 */
		function insertFileReplaceDialog() {
			if (!options.data.deleteFile) {
				$('#'+fileDeleteDivName).html(
					'<span class="jqmContributions_input_heading">Replace attached file:</span>' +
						'<input class="jqmContributions_input" type="file" name="upload"/>');
			} else {
				$('#'+fileDeleteDivName).empty();
			}
		}
		
		function insertFileDiv() {
			var offerFileDelete = (typeof options.data.deleteFile != 'undefined');
			if (!offerFileDelete) { // no existing file - delete option not needed
				var htmlString = 
					'<span class="jqmContributions_input_heading">Attach file:</span>' +
						'<input class="jqmContributions_input" type="file" name="upload"/>';
			} else {
				var htmlString = 
					'<span class="jqmContributions_input_heading">Delete attached file:</span>' +
						'<input class="jqmContributions_input" type="checkbox" id="' + deleteCBName + '"/>' +
					'<div id="' + fileDeleteDivName + '"></div>';
			}
			$('#'+fileDivName).html(htmlString);
			
			if (offerFileDelete) {
				insertFileReplaceDialog();
				
				$('#'+deleteCBName).click(function() {
					if ($('#'+deleteCBName).attr('checked')) {
						options.data.deleteFile = true;
						clearFileFields(options.data);
					} else {
						options.data.deleteFile = false;
					}
					insertFileReplaceDialog();
				});
			}
		}
		
		function isEditField(name) {
			for (var i=0; i<options.formData.editFields.length; i++) {
				if (name == options.formData.editFields[i].name) {
					return(true);
				}
			}
			return(false);
		}
		
		function isFileDerivedField(name) {
			return(name == 'filename' ||
				name == 'mimetype' ||
				name == 'original_filename' ||
				name == 'file_size');
		}
		
		if( !form ) {
			var myIndex = index;
			++index;
			
			var hiddenData = '';
			for (var name in options.data) {
				if (!options.data.isUpdate || // these fields should not actually be there if not an update
						(!isEditField(name) &&
						 !isFileDerivedField(name) &&
						 name != 'deleteFile' &&
						 name != 'fileuse')) {
					var value = options.data[name];
					hiddenData += '<input type="hidden" name="'+name+'" value="'+value+'"/>';
				}
			};
			
			$(dialog).empty();
			var formId = 'contributionForm_'+myIndex;
			form = $('<form id="'+formId+'" action="'+options.putUrl+'" method="post" enctype="multipart/form-data">' + hiddenData + '</form>');
			$(dialog).append(form);
			form.append(
				'<p class="jqmContributions_instructions">' + options.formData.formIntroText + '</p>' +
				'<p class="jqmContributions_instructions">' +
					(options.data.isUpdate ? options.formData.updateNotice : options.formData.addNotice) +
				'</p>');
				
			// The name attributes in the form SHOULD MATCH the db schema column names
			// otherwise the server side has to contain hacks to translate it.  Use
			// whatever terminology you want in the accompanying label spans.  See 
			// comment/notes for example: the default db column name is notes but 
			// comment is used on the web form.
			for (var i=0; i < options.formData.editFields.length; i++) {
			
				/*
				 * create HTML
				 */
				var inputs = '';
				var iElem = $('<p></p>');
				form.append(iElem);
				
				if (options.formData.editFields[i].type != 'file') { // special handling for file labels
					iElem.append('<span class="jqmContributions_input_heading">' + options.formData.editFields[i].label + ':</span>');
				}
				
				if (options.formData.editFields[i].type == 'text') { // TEXT
				
					inputs =
						'<input class="jqmContributions_input" type="text" name="' +
						options.formData.editFields[i].name + '"/>';
						
				} else if (options.formData.editFields[i].type == 'textarea') { // TEXTAREA
				
					var _r = options.formData.editFields[i].rows;
					var _c = options.formData.editFields[i].cols;
					inputs =
						'<textarea class="jqmContributions_input" ' +
							'cols="' + (typeof _c != 'undefined' && _c != null && _c != '' ? _c : '50') + '" ' +
							'rows="' + (typeof _r != 'undefined' && _r != null && _r != '' ? _r : '10') + '" name="' +
							options.formData.editFields[i].name + '"></textarea>';
							
				} else if (options.formData.editFields[i].type == 'date') { // DATE - jQuery datepicker

						inputs = '<input id="__contrib_date_' + options.formData.editFields[i].name +
							'" class="jqmContributions_input" name="' + options.formData.editFields[i].name + '" type="text">';
				
				} else if (options.formData.editFields[i].type == 'file') { // FILE - attach/replace file dialog
				
						inputs = '<div id="' + fileDivName + '"></div>';
					
				} else { // NO MATCH - complain
					alert('contributions::createForm: unknown field type: '+options.formData.editFields[i].type);
				}
				iElem.append(inputs);
				
				/*
				 * init element if needed
				 */
				if ('file' == options.formData.editFields[i].type) { // FILE
				
					insertFileDiv();
			
				} else if ('date' == options.formData.editFields[i].type) { // DATE

					var dpBaseOpts = {
						dateFormat: 'yy-mm-dd'
						,gotoCurrent: true
						,changeYear: true
					};
					var dpOpt = $.extend({}, dpBaseOpts, options.formData.editFields[i].dpOptionsFn());
					$('#__contrib_date_' + options.formData.editFields[i].name).datepicker(dpOpt);
					
				}
				
			}
			form.append(
				'<p>' +
					'<input class="jqmContributions_input" id="contributionSubmit_'+myIndex+'" ' +
						'type="button" value="Submit"/>' +
					'<input class="jqmContributions_input" id="contributionCancel_'+myIndex+'" ' +
						'type="button" value="Cancel"/><br/>' +
				'</p>');
			
			if (options.data.isUpdate) { // fill the editable fields
				for (var i=0; i<options.formData.editFields.length; i++) {
					var efName = options.formData.editFields[i].name;
					if ('date' == options.formData.editFields[i].type) {
						if (isDefined(options.data[efName]) && isDefined(options.data[efName].formatted)) {
							$('#'+formId+' [name="'+efName+'"]').val(options.data[efName].formatted);
						}
					} else {
						$('#'+formId+' [name="'+efName+'"]').val(options.data[efName]);
					}
				};
			};

			$('#contributionSubmit_'+myIndex).click(function(evt){
				if (typeof options.data.deleteFile != 'undefined' && options.data.deleteFile) {
					$('#'+formId).append('<input type="hidden" name="deleteFile" value="'+options.data.deleteFile+'"/>');
					$('#'+formId).append('<input type="hidden" name="fileuse" value=""/>'); // also clear the file use flag if deleting a file
				} else {
					$('#'+formId).append('<input type="hidden" name="fileuse" value="'+
						(typeof options.data.fileuse == 'undefined' ? '' : options.data.fileuse) +'"/>');
				}
				UserSubmit();
			});
			$('#contributionCancel_'+myIndex).click(function(evt){
				UserCancel();
			});
		}
	};
	
	function createHiddenForm(options) {
		var form = $('<form action="'+options.putUrl+'" method="post" enctype="multipart/form-data"></form>');
		
		for(var name in options.data) {
			var value = options.data[name];

			var data = $('<input type="hidden" name="'+name+'"/>');
			form.append(data);
			data.attr('value',value);
		};
		
		return form;
	};
	
	function createDialog(options) {
		if( !dialog ) {
			dialog = $('<div></div>');
			$(dialog).dialog({
				autoOpen: false
				,modal: true
				,width: 'auto'
				,title: _loc( 'Contribution' )
				,close: function(event, ui){
					var diag = $(event.target);
					//diag.dialog('destroy');
					//diag.remove();
				}
			});
		}
		
		createForm(options);
	};

	return {
		acceptsContribution: function(options_) {
			var options = $.extend(true, {}, contributionOptions, options_);
			
			options.data.isUpdate = false;
			createDialog(options);
			$(dialog).dialog('open');
		}
		,acceptsContributionUpdate: function(options_) {
			var options = $.extend(true, {}, contributionOptions, options_);
			
			function setFileFields(offerDelete) {
				clearFileFields(options.data);
				if (offerDelete) {
					// by default, don't delete existing file but this will
					// cause the option to be offered.
					options.data.deleteFile = false;
				}
			}
			
			options.data.isUpdate = true;
			if (typeof options.data.filename != 'undefined' &&
				options.data.filename != null) {
				// for update - clear existing file fields.  Offer options to 
				// allow addition (if no file exists now) or delete/replace
				// if a file does exist.
				if (options.data.filename != '') {
					setFileFields(true);
				} else {
					setFileFields(false);
				}
			} else {
				setFileFields(false);
			}
			
			createDialog(options);
			$(dialog).dialog('open');
		}
		,deleteContribution: function(options_) {
			var options = $.extend(true, {}, contributionOptions, options_);
			
			$.ajax({
				type: 'GET'
				,url: options.deleteUrl
				,data: options.data
				,dataType: 'json'
				,async: true
				,success: options.onSuccess
				,error: options.onError
			});
		}
		,addContribution: function(options_) {
			var options = $.extend(true, {}, contributionOptions, options_);
			
			options.data.isUpdate = false;
			var form = createHiddenForm(options);
			$(document.body).append(form);
			_SubmitFormImmediate(options,form);
		}
		,allowAnonymousContribution: function() {
			return(contributionOptions.anonymousAllowed);
		}
	};
};

function initContributionHandler($, options_) {
	NUNALIIT_CONTRIBUTIONS = olkitContributions($, options_);
}
