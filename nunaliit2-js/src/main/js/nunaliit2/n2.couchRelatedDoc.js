/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchRelatedDoc';

//===============================================================

var CreateDocWidget = $n2.Class({
	
	elemId: null,
	
	schemaNames: null,
	
	allSchemas: null,
	
	label: null,
	
	dialogPrompt: null,
	
	createDocProcess: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,schemaNames: null
			,allSchemas: false
			,label: null
			,dialogPrompt: null
			,createDocProcess: null
		},opts_);
		
		this.createDocProcess = opts.createDocProcess;
		this.schemaNames = opts.schemaNames;
		this.allSchemas = opts.allSchemas;
		this.label = opts.label;
		this.dialogPrompt = opts.dialogPrompt;
		
		this.elemId = $n2.utils.getElementIdentifier(opts.elem);
		
		if( !this.label ){
			this.label = _loc('Create Document');
		};
		
		this._refresh();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_refresh: function(){
		var _this = this;
		
		var $elem = this._getElem();
		$elem.empty();
		
		$('<button>')
			.text( this.label )
			.appendTo($elem)
			.click(function(){
				_this._createDocClicked();
			});
	},
	
	_createDocClicked: function(){
		this.createDocProcess.createDocumentFromSchemaNames({
			schemaNames: this.schemaNames
			,allSchemas: this.allSchemas
			,prompt: this.dialogPrompt
		});
	}
});

//===============================================================
var Editor = $n2.Class({
	
	documentSource: null,

	uploadService: null,
	
	showService: null,
	
	dialogService: null,
	
	obj: null,
	
	schema: null,
	
	prompt: null,
	
	onSuccess: null,
	
	onError: null,
	
	onCancel: null,
	
	diagId: null,
	
	attachmentUploadHandler: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend(
			{
				documentSource: null
				,uploadService: null
				,showService: null
				,dialogService: null
				,obj: null
				,schema: null
				,prompt: null
				,elem: null // location where editor should be opened
				,onSuccess: function(docId){}
				,onError: $n2.reportErrorForced
				,onCancel: function(){}
			}
			,opts_
		);
		
		this.documentSource = opts.documentSource;
		this.uploadService = opts.uploadService;
		this.showService = opts.showService;
		this.dialogService = opts.dialogService;
		this.schema = opts.schema;
		this.prompt = opts.prompt;
		this.onSuccess = opts.onSuccess;
		this.onError = opts.onError;
		this.onCancel = opts.onCancel;

		this.obj = {};
		for(var key in opts.obj){
			if( '__n2Source' === key ){
				// ignore
			} else {
				this.obj[key] = opts.obj[key];
			};
		};

		var _this = this;
		
		var diagId = $n2.getUniqueId();
		this.diagId = diagId;
		var $dialog = $('<div>')
			.attr('id',diagId)
			.addClass('n2RelatedDoc_dialog');
		
		if( opts.elem ){
			var $elem = $(opts.elem);
			$dialog
				.addClass('n2RelatedDoc_located')
				.appendTo($elem);
		} else {
			$dialog.appendTo( $('body') );
		};
		
		var obj = this.obj;
		var schema = this.schema;
		
		var funcMap = {};
		if( this.dialogService ){
			funcMap = this.dialogService.getFunctionMap();
		};
		
		var $diagContent = $('<div>')
			.addClass('n2RelatedDoc_dialogContent')
			.appendTo($dialog);
		
		var $form = $('<div>')
			.appendTo($diagContent);
		schema.form(
			obj
			,$form
			,null // context
			,function(){ // callback on changes
				if( _this.showService ){
					_this.showService.fixElementAndChildren($form, {}, obj);
				};
			}
			,funcMap
		);
		
		if( this.showService ){
			this.showService.fixElementAndChildren($form, {}, obj);
		};

		var $fileElement = $('<div>')
			.appendTo($diagContent);
		this.attachmentUploadHandler = new $n2.couchEdit.AttachmentEditor({
			doc: obj
			,elem: $fileElement
			,documentSource: this.documentSource
			,uploadService: this.uploadService
			,disableAddFile: true
			,disableRemoveFile: true
		});
		
		// OK
		$('<button>')
			.text( _loc('OK') )
			.button({icons:{primary:'ui-icon-check'}})
			.appendTo($diagContent)
			.click(function(){
				_this._clickOK();
				return false;
			});
		
		// Cancel
		$('<button>')
			.text( _loc('Cancel') )
			.button({icons:{primary:'ui-icon-cancel'}})
			.appendTo( $diagContent )
			.click(function(){
				_this._clickCancel();
				return false;
			});
		
		if( !opts.elem ){
			var dialogOptions = {
				autoOpen: true
				,title: _loc('Fill Out Related Document')
				,modal: true
				,width: 740
				,close: function(event, ui){
					var diag = $('#'+diagId);
					diag.remove();
				}
			};
			$dialog.dialog(dialogOptions);
		};
	},

	_clickOK: function(){

		var _this = this;
		var obj = this.obj;

		// Check that a file was provided
		this.attachmentUploadHandler.performPreSavingActions({
			doc: obj
			,documentSource: this.documentSource
			,onSuccess: function(){
				_this._saveObj();
			}
			,onError: function(err){
				alert(err);
			}
		});
	},

	_clickCancel: function(){
		var $diag = $('#'+this.diagId);
		
		if( $diag.hasClass('n2RelatedDoc_located') ){
			$diag.remove();
		} else {
			$('#'+this.diagId).dialog('close');
		};

		this.onCancel();
	},
	
	_saveObj: function(){
		var _this = this;
		var obj = this.obj;

		$n2.couchDocument.adjustDocument(obj);

		this.documentSource.createDocument({
			doc: obj
			,onSuccess: function(updatedDoc) {
				_this._uploadFile(updatedDoc);
			}
			,onError: function(err){
				_this._error( _loc('Unable to reach database to submit document: {err}',{err:err}) );
			}
		});
	},
	
	_uploadFile: function(doc){
		var _this = this;

		this.attachmentUploadHandler.performPostSavingActions({
			doc: doc
			,onSuccess: function(){
				_this._success(doc._id);
			}
			,onError: function(err){
				_this._error( 
					_loc('Error occurred after related document was created. Error: {err}',{err:err})
				);
			}
		});
	},
	
	_success: function(docId){
		// Close upload dialog
		$('#'+this.diagId).dialog('close');
		
		// Call back client
		this.onSuccess(docId);
	},
	
	_error: function(err){
		var _this = this;
		
		var $content = $('#'+this.diagId).find('.n2RelatedDoc_dialogContent')
			.empty();
		
		$('<div>')
			.addClass('n2RelatedDoc_error')
			.text( err )
			.appendTo($content);

		$('<button>')
			.text( _loc('Cancel') )
			.button({icons:{primary:'ui-icon-cancel'}})
			.appendTo( $content )
			.click(function(){
				_this._clickCancel();
				return false;
			});
		
		// Call back client
		this.onError(err);
	}
});

// ===============================================================
var CreateRelatedDocProcess = $n2.Class({
	
	documentSource: null,

	schemaRepository: null,
	
	uploadService: null,
	
	showService: null,
	
	authService: null,

	dialogService: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend(
			{
				documentSource: null
				,schemaRepository: null
				,dispatchService: null
				,uploadService: null
				,showService: null
				,authService: null
				,dialogService: null
			}
			,opts_
		);
		
		this.documentSource = opts.documentSource;
		this.schemaRepository = opts.schemaRepository;
		this.uploadService = opts.uploadService;
		this.showService = opts.showService;
		this.authService = opts.authService;
		this.dialogService = opts.dialogService;
		this.dispatchService = opts.dispatchService;
	},
	
	getCreateWidget: function(opts_){
		var opts = $n2.extend({
			elem: null
			,schemaNames: null
			,allSchemas: false
			,label: null
			,dialogPrompt: null
		},opts_);
		
		return new CreateDocWidget({
			elem: opts.elem
			,schemaNames: opts.schemaNames
			,allSchemas: opts.allSchemas
			,label: opts.label
			,dialogPrompt: opts.dialogPrompt
			,createDocProcess: this
		});
	},

	createDocumentFromSchema: function(opt_){
	
		var _this = this;
	
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this.createDocumentFromSchema(opt_);
				}
			});
			return;
		};
	
		var opt = $n2.extend({
			schema: null
			,elem: null
			,relatedDoc: null
			,originDocId: null
			,prompt: null
			,onSuccess: function(docId){}
			,onError: $n2.reportErrorForced
			,onCancel: function(){}
		},opt_);
		
		if( opt.schema && opt.schema.isSchema ) {
			// OK
		} else {
			opt.onError( _loc('A valid schema must be provided') );
			return;
		};
		
		// Check that upload service is available
		this.uploadService.checkWelcome({
			onSuccess: uploadServiceAvailable
			,onError: function(err){
				alert( _loc('Upload service can not be reached. Unable to submit a related document.') );
			}
		});
	
		function uploadServiceAvailable(){
			var obj = opt.schema.createObject();
			
			if( opt.relatedDoc ){
				obj.nunaliit_source = {
					nunaliit_type: 'reference'
					,doc: opt.relatedDoc._id
					,category: 'attachment'
				};
			};
			
			if( opt.originDocId ){
				obj.nunaliit_origin = {
					nunaliit_type: 'reference'
					,doc: opt.originDocId
				};
			};
			
			if( _this.dispatchService ){
				_this.dispatchService.synchronousCall(DH,{
					type: 'preDocCreation'
					,doc: obj
					,relatedDoc: opt.relatedDoc
				});
			};
			
			// Compute prompt, if not provided
			var prompt = opt.prompt;
			if( !prompt ){
				if( opt.originDocId ){
					prompt = _loc('Fill Out Reply');
					
				} else if( opt.relatedDoc ){
					prompt = _loc('Fill Out Related Document');

				} else {
					prompt = _loc('Fill out content of new document');
				};
			};
			
			new Editor({
				documentSource: _this.documentSource
				,uploadService: _this.uploadService
				,showService: _this.showService
				,dialogService: _this.dialogService
				,obj: obj
				,schema: opt.schema
				,prompt: prompt
				,elem: opt.elem
				,onSuccess: opt.onSuccess
				,onError: opt.onError
				,onCancel: opt.onCancel
			});
		};
	},

	createDocumentFromSchemaNames: function(opt_){
		
		var _this = this;
		
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this.createDocumentFromSchemaNames(opt_);
				}
			});
			return;
		};
		
		var opt = $n2.extend({
			schemaNames: []
			,allSchemas: false
			,relatedDoc: null
			,originDocId: null
			,prompt: null
			,onSuccess: function(docId){}
			,onError: $n2.reportErrorForced
			,onCancel: function(){}
		},opt_);
		
		if( opt.allSchemas ){
			this.dialogService.selectSchema({
				onSelected: selectedSchema
				,onError: opt.onError
				,onReset: opt.onCancel
			});
		} else {
			this.dialogService.selectSchemaFromNames({
				schemaNames: opt.schemaNames
				,onSelected: selectedSchema
				,onError: opt.onError
				,onReset: opt.onCancel
			});
		};
		
		function selectedSchema(schema){
			_this.createDocumentFromSchema({
				schema: schema
				,relatedDoc: opt.relatedDoc
				,originDocId: opt.originDocId
				,prompt: opt.prompt
				,onSuccess: opt.onSuccess
				,onError: opt.onError
				,onCancel: opt.onCancel
			});
		};
	},

	replyToDocument: function(opt_){
		
		var _this = this;
		
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this.replyToDocument(opt_);
				}
			});
			return;
		};
		
		var opt = $n2.extend({
			doc: null
			,elem: null
			,schema: null
			,originDocId: null
			,onSuccess: function(docId){}
			,onError: $n2.reportErrorForced
			,onCancel: function(){}
		},opt_);

		if( opt.schema && opt.schema.isSchema ) {
			// OK
		} else {
			opt.onError( _loc('A valid schema must be provided') );
			return;
		};
		
		var originDocId = null;
		if( opt.originDocId ){
			originDocId = opt.originDocId;
		} else if( opt.doc.nunaliit_origin && opt.doc.nunaliit_origin.doc ) {
			originDocId = opt.doc.nunaliit_origin.doc;
		} else if( opt.doc.nunaliit_source && opt.doc.nunaliit_source.doc ) {
			originDocId = opt.doc.nunaliit_source.doc;
		};
		
		this.createDocumentFromSchema({
			schema: opt.schema
			,elem: opt.elem
			,relatedDoc: opt.doc
			,originDocId: originDocId
			,onSuccess: opt.onSuccess
			,onError: opt.onError
			,onCancel: opt.onCancel
		});
	},
	
	insertAddRelatedSelection: function(opts_){
		var opts = $n2.extend({
			placeHolderElem: null
			,doc: null
			,onElementCreated: function($elem){}
			,onRelatedDocumentCreated: function(docId){}
		},opts_);
		
		var _this = this;
		
		var $placeHolder = $(opts.placeHolderElem);
		var doc = opts.doc;
		
		var docSchemaName = doc.nunaliit_schema;
		if( !docSchemaName ){
			noButton();
			return;
		};
		
		this.schemaRepository.getSchema({
			name: docSchemaName
			,onSuccess: function(docSchema){
				// Check if there are any related document schemas
				if( docSchema.relatedSchemaNames 
				 && docSchema.relatedSchemaNames.length > 0 ){
					_this.schemaRepository.getSchemas({
						names: docSchema.relatedSchemaNames
						,onSuccess: loadedRelatedSchemas
						,onError: noButton
					});
				} else {
					noButton();
				};
			}
			,onError: noButton
		});
		
		function loadedRelatedSchemas(relatedSchemas){
			if( relatedSchemas.length < 1 ){
				noButton();
				return;
			};
			
			var $select = $('<select>');

			$('<option>')
				.text( _loc('Add Related Item') )
				.val('')
				.appendTo($select);
			
			for(var i=0,e=relatedSchemas.length; i<e; ++i){
				var relatedSchema = relatedSchemas[i];
				
				$('<option>')
					.text( relatedSchema.getLabel() )
					.val( relatedSchema.name )
					.appendTo($select);
			};
			
			$select.insertBefore($placeHolder)
				.change(function(){
					var val = $(this).val();
					$(this).val('');
					if( val && val.length > 0 ) {
						_this.createDocumentFromSchemaNames({
							schemaNames: [val]
							,relatedDoc: doc
							,onSuccess: opts.onRelatedDocumentCreated
						});
					};
					return false;
				});
			
			$placeHolder.remove();
			
			opts.onElementCreated($select);
		};
		
		function noButton(){
			$placeHolder.remove();
		};
	}
});


$n2.couchRelatedDoc = {
	CreateRelatedDocProcess: CreateRelatedDocProcess	
};

})(jQuery,nunaliit2);
