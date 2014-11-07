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

$Id: n2.couchRelatedDoc.js 8484 2012-09-05 19:38:37Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

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
			.addClass('n2RelatedDoc_dialog')
			.appendTo( $('body') );
		
		var obj = this.obj;
		var schema = this.schema;
		
		var funcMap = {};
		if( this.dialogService ){
			funcMap = this.dialogService.getFunctionMap();
		};
		
		var $form = $('<div></div>');
		$dialog.append($form);
		schema.form(obj, $form, null, null, funcMap);
		
		if( this.showService ){
			this.showService.fixElementAndChildren($form, {}, obj);
		};

		var $fileElement = $('<div></div>');
		$dialog.append($fileElement);
		this.attachmentUploadHandler = new $n2.CouchEditor.AttachmentEditor({
			doc: obj
			,elem: $fileElement
			,documentSource: this.documentSource
			,uploadService: this.uploadService
			,disableAddFile: true
			,disableRemoveFile: true
		});
		
		var $ok = $('<button></button>');
		$ok.text( _loc('OK') );
		$ok.button({icons:{primary:'ui-icon-check'}});
		$dialog.append( $ok );
		$ok.click(function(){
			_this._clickOK();
			return false;
		});
		
		var $cancel = $('<button></button>');
		$cancel.text( _loc('Cancel') );
		$cancel.button({icons:{primary:'ui-icon-cancel'}});
		$dialog.append( $cancel );
		$cancel.click(function(){
			_this._clickCancel();
			return false;
		});
		
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
		$('#'+this.diagId).dialog('close');
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
				_this.onError( _loc('Unable to reach database to submit document: {err}',{err:err}) );
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
				_this.onError( 
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
			,relatedDocId: null
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
			
			if( opt.relatedDocId ){
				obj.nunaliit_source = {
					nunaliit_type: 'reference'
					,doc: opt.relatedDocId
					,category: 'attachment'
				};
			};
			
			if( opt.originDocId ){
				obj.nunaliit_origin = {
					nunaliit_type: 'reference'
					,doc: opt.originDocId
				};
			};
			
			// Compute prompt, if not provided
			var prompt = opt.prompt;
			if( !prompt ){
				if( opt.originDocId ){
					prompt = _loc('Fill Out Reply');
					
				} else if( opt.relatedDocId ){
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
			,relatedDocId: null
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
				,relatedDocId: opt.relatedDocId
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
			,relatedDocId: opt.doc._id
			,originDocId: originDocId
			,onSuccess: opt.onSuccess
			,onError: opt.onError
			,onCancel: opt.onCancel
		});
	}
});


$n2.couchRelatedDoc = {
	CreateRelatedDocProcess: CreateRelatedDocProcess	
};

})(jQuery,nunaliit2);
