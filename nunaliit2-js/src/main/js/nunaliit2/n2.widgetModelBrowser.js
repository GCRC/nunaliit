/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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

/*
 To use this widget, add the following definition to a module widget list:
	{
		"_comment": "Debug models"
        ,"containerClass": "nunaliit_footer"
		,"widgetType": "modelBrowserWidget"
		,"sourceModelIds":[
			...
		]
	}
 */
;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetModelBrowser'
 ;

//--------------------------------------------------------------------------
var ModelBrowserWidget = $n2.Class({
	
	dispatchService: null,
	
	showService: null,
	
	sourceModelIds: null,
	
	elemId: null,
	
	browserId: null,
	
	selectedModelId: null,
	
	selectedDocId: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelIds: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelIds = opts.sourceModelIds;
		
		this.selectedModelId = null;
		this.selectedDocId = null;

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		this.browserId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2modelBrowserWidget')
			.appendTo($container);
		
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'documentContent', f);
		};
		
		$n2.log('ModelBrowserWidget', this);
		
		this._display();
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'documentContent' === m.type ){
			if( m.docId === this.selectedDocId ){
				// Get document tree pane
				var $dialog = $('#'+this.browserId);
				var $treePane = $dialog.find('.n2modelBrowserWidget_document_tree');
				
				$treePane.empty();
				new $n2.tree.ObjectTree($treePane, m.doc);
			};
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_display: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem.empty();
		
		$('<a>')
			.addClass('n2modelBrowserWidget_button')
			.attr('href','#')
			.text( _loc('Models') )
			.appendTo($elem)
			.click(function(){
				var $browsers = $('#'+_this.browserId);
				if( $browsers.length > 0 ){
					$browsers.dialog('close');
				} else {
					_this._showBrowser();
				};
				return false;
			});
	},

	_showBrowser: function(){
		var _this = this;

		var $dialog = $('<div>')
			.addClass('n2modelBrowserWidget_window')
			.attr('id', this.browserId)
			.appendTo($('body'))
			;
		
		$('<div>')
			.addClass('n2modelBrowserWidget_models')
			.appendTo($dialog);
		
		$('<div>')
			.addClass('n2modelBrowserWidget_list')
			.appendTo($dialog);
		
		$('<div>')
			.addClass('n2modelBrowserWidget_document')
			.appendTo($dialog);
		
		this._refreshModels();
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Model Browser')
			,modal: false
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		
		$dialog.dialog(dialogOptions);
	},
	
	_refreshModels: function(){
		var _this = this;

		var $dialog = $('#'+this.browserId);
		var $modelsPane = $dialog.find('.n2modelBrowserWidget_models')
			.empty();
		
		if( this.sourceModelIds ){
			var sourceModelIdMap = {};

			for(var i=0,e=this.sourceModelIds.length; i<e; ++i){
				var sourceModelId = this.sourceModelIds[i];

				sourceModelIdMap[sourceModelId] = true;
				
				var $a = $('<a>')
					.addClass('n2modelBrowserWidget_model')
					.attr('href','#')
					.attr('nunaliit-source-model-id',sourceModelId)
					.text(sourceModelId)
					.appendTo($modelsPane)
					.click(function(){
						var $a = $(this);
						var sourceModelId = $a.attr('nunaliit-source-model-id');
						_this.selectedModelId = sourceModelId;
						_this._refreshModels();
						return false;
					});
				
				if( sourceModelId === this.selectedModelId ){
					$a.addClass('n2modelBrowserWidget_model_selected');
				};
			};
			
			if( !sourceModelIdMap[this.selectedModelId] ){
				this.selectedModelId = null;
			};
		};

		_this._refreshList();
	},
	
	_refreshList: function(){
		var _this = this;

		var $dialog = $('#'+this.browserId);
		var $listPane = $dialog.find('.n2modelBrowserWidget_list')
			.empty();
		
		if( this.selectedModelId ){
			// Get current state
			var sourceState = $n2.model.getModelState({
				dispatchService: this.dispatchService
				,modelId: this.selectedModelId
			});
			var docIdMap = {};
			var docIds = [];
			if( sourceState.added ){
				for(var i=0,e=sourceState.added.length; i<e; ++i){
					var doc = sourceState.added[i];
					var docId = doc._id;
					
					if( docIdMap[docId] ){
						// Ignore
					} else {
						docIdMap[docId] = true;
						docIds.push(docId);
					};
				};
			};
			docIds.sort();
			
			if( !docIdMap[this.selectedDocId] ){
				this.selectedDocId = null;
			};
			
			var $count = $('<div>')
				.addClass('n2modelBrowserWidget_list_count')
				.text( _loc('Number of documents: {count}', {count:docIds.length}) )
				.appendTo($listPane);
			
			var $items = $('<div>')
				.addClass('n2modelBrowserWidget_list_docIds')
				.appendTo($listPane);
			
			docIds.forEach(function(docId){
				var $a = $('<a>')
					.addClass('n2modelBrowserWidget_list_docId')
					.attr('href','#')
					.attr('nunaliit-document-id',docId)
					.appendTo($items)
					.text( docId )
					.click(function(){
						var $a = $(this);
						var docId = $a.attr('nunaliit-document-id');
						_this.selectedDocId = docId;
						_this._refreshList();
						return false;
					});
				
				if( _this.selectedDocId === docId ){
					$a.addClass('n2modelBrowserWidget_list_docId_selected');
				};
			});
		};
		
		this._refreshDocument();
	},
	
	_refreshDocument: function(){
		var _this = this;

		var $dialog = $('#'+this.browserId);
		var $docPane = $dialog.find('.n2modelBrowserWidget_document')
			.empty();
		
		if( this.selectedDocId ){
			$('<div>')
				.addClass('n2modelBrowserWidget_document_id')
				.text( _loc('Document: {id}', {id:this.selectedDocId}) )
				.appendTo($docPane);

			$('<div>')
				.addClass('n2modelBrowserWidget_document_tree')
				.attr('nunaliit-document', this.selectedDocId)
				.appendTo($docPane);
			
			// Request this document
			if( this.dispatchService ){
				this.dispatchService.send(DH,{
					type: 'requestDocument'
					,docId: this.selectedDocId
				});
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'modelBrowserWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'modelBrowserWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			var sourceModelIds = [];
			
			for(var key in widgetOptions){
				var value = widgetOptions[key];

				if( 'sourceModelId' === key ){
					if( typeof value === 'string' ){
						sourceModelIds.push(value);
					} else {
						throw new Error('In modelBrowserWidget configuration, sourceModelId must be a string');
					};
					
				} else if( 'sourceModelIds' === key ){
					if( $n2.isArray(value) ){
						value.forEach(function(sourceModelId){
							if( typeof sourceModelId === 'string' ){
								sourceModelIds.push(sourceModelId);
							} else {
								throw new Error('In modelBrowserWidget configuration, sourceModelIds must be an array of strings');
							};
						});
					} else {
						throw new Error('In modelBrowserWidget configuration, sourceModelIds must be an array of strings');
					};
					
				} else {
					options[key] = value;
				};
			};
			
			options.sourceModelIds = sourceModelIds;
		};

		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.showService = config.directory.showService;
		};
		
		new ModelBrowserWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetModelBrowser = {
	ModelBrowserWidget: ModelBrowserWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
