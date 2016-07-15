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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

// =========================================================================
var ExportApplication = $n2.Class('ExportApplication',{
	
	exportService: null,

	atlasDb: null,

	atlasDesign: null,
	
	config: null,
	
	logger: null,
	
	docIds: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			exportService: null
			,atlasDb: null
			,atlasDesign: null
			,config: null
			,logger: null
			,docIds: null
		},opts_);

		var _this = this;
		
		this.exportService = opts.exportService;
		this.atlasDb = opts.atlasDb;
		this.atlasDesign = opts.atlasDesign;
		this.config = opts.config;
		this.logger = opts.logger;
		this.docIds = opts.docIds;
		
		if( !$n2.isArray(this.docIds) ){
			throw new Error('In ExportApplication, docIds must be supplied as an array');
		};
		
		if( !this.exportService ){
			throw new Error('In ExportApplication, export service must be supplied');
		} else {
			this.exportService.checkAvailable({
				onAvailable: function(){
					_this._getExportSettings();
				}
				,onNotAvailable: function(){
					_this._reportError( _loc('Export service is not available') );
				}
			});
		};
	},
	
	_reportError: function(message, title){
		new $n2.couchDialogs.AlertDialog({
			title: title ? title : _loc('Export Error')
			,message: message
		});
	},
	
	_logError: function(err){
		if( this.logger ){
			this.logger.reportError(err);
		};
	},
	
	_getExportSettings: function(){
		var _this = this;

		var knownScriptById = {};
		var currentScript = 'function(opts){\n\tvar config = opts.config;\n\tvar doc = opts.doc;\n\tif( doc ){\n\t\tvar record = { _id: doc._id, _geometry: doc._id };\n\t\topts.addRecord(record);\n\t};\n\topts.next();\n}';

		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'"></div>');

		$('<div>')
			.text( _loc('Exporting') )
			.appendTo($dialog);

		// Method
		var methodId = $n2.getUniqueId();
		var $methodDiv = $('<div>')
			.appendTo($dialog);
		$('<label>')
			.text( _loc('Script:') )
			.attr('for',filterId)
			.appendTo($methodDiv);
		var $methodSelect = $('<select>')
			.attr('id',methodId)
			.appendTo($methodDiv)
			.change(methodChanged);
		$('<option>')
			.val('__custom__')
			.text( _loc('Custom Script') )
			.appendTo($methodSelect);
		
		// Filter
		var filterId = $n2.getUniqueId();
		var $filterDiv = $('<div>')
			.appendTo($dialog);
		$('<label>')
			.text( _loc('Filter:') )
			.attr('for',filterId)
			.appendTo($filterDiv);
		var $filterSelect = $('<select>')
			.attr('id',filterId)
			.appendTo($filterDiv);
		$('<option value="all"></options>')
			.text( _loc('All Geometries') )
			.appendTo($filterSelect);
		$('<option value="points"></options>')
			.text( _loc('Only Point Geometries') )
			.appendTo($filterSelect);
		$('<option value="linestrings"></options>')
			.text( _loc('Only LineString Geometries') )
			.appendTo($filterSelect);
		$('<option value="polygons"></options>')
			.text( _loc('Only Polygon Geometries') )
			.appendTo($filterSelect);

		// Format
		var formatId = $n2.getUniqueId();
		var $formatDiv = $('<div>')
			.appendTo($dialog);
		$('<label>')
			.text( _loc('Format:') )
			.attr('for',formatId)
			.appendTo($formatDiv);
		var $formatSelect = $('<select>')
			.attr('id',formatId)
			.appendTo($formatDiv)
			.change(formatChanged);
		$('<option value="geojson"></options>')
			.text( _loc('geojson') )
			.appendTo($formatSelect);
		
		// File name
		var fileNameId = $n2.getUniqueId();
		var $fileNameDiv = $('<div>')
			.appendTo($dialog);
		$('<label>')
			.text( _loc('File Name:') )
			.attr('for',fileNameId)
			.appendTo($fileNameDiv);
		$('<input>')
			.attr('type','text')
			.attr('id',fileNameId)
			.addClass('n2_export_fileNameInput')
			.val('export.geojson')
			.appendTo($dialog);
		
		// Script text area
		var scriptAreaId = $n2.getUniqueId();
		var scriptDisplayId = $n2.getUniqueId();
		var $scriptDiv = $('<div>')
			.appendTo($dialog);
		$('<label>')
			.text( _loc('Script:') )
			.attr('for',scriptAreaId)
			.appendTo($scriptDiv);
		$('<textarea>')
			.attr('id',scriptAreaId)
			.addClass('n2_export_scriptArea')
			.appendTo($scriptDiv);
		$('<div>')
			.attr('id',scriptDisplayId)
			.addClass('n2_export_scriptDisplay')
			.appendTo($scriptDiv);

		var $btnLine = $('<div>')
			.appendTo($dialog);
		$('<button>')
			.text( _loc('Export') )
			.appendTo($btnLine)
			.click(function(){
				var filter = $('#'+filterId).val();
				var format = $('#'+formatId).val();
				
				var fileName = $('#'+fileNameId).val();
				if( '' === fileName ) {
					fileName = null;
				};
				
				var scriptText = $('#'+scriptAreaId).val();
				
				$dialog.dialog('close');
				_this._performExportScript({
					filter: filter
					,fileName: fileName
					,format: format
					,script: scriptText
				});
				return false;
			});
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Export')
			,modal: true
			,width: 550
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		formatChanged();
		methodChanged();
		
		// Load up known scripts for export
		if( this.atlasDesign ){
			this.atlasDesign.queryView({
				viewName: 'nunaliit-script'
				,include_docs: true
				,onSuccess: function(rows){
					rows.forEach(function(row){
						var $sel = $('#'+methodId);

						var scriptDoc = row.doc;
						if( scriptDoc 
						 && scriptDoc.nunaliit_script 
						 && scriptDoc.nunaliit_script.type === 'export' 
						 && scriptDoc.nunaliit_script.script ){
							var label = undefined;
							if( scriptDoc.nunaliit_script.label ){
								label = _loc(scriptDoc.nunaliit_script.label);
							} else {
								label = scriptDoc.nunaliit_script.name;
							};
							if( !label ){
								label = scriptDoc._id;
							};
							
							$('<option>')
								.val(scriptDoc._id)
								.text( label )
								.appendTo($sel);

							knownScriptById[scriptDoc._id] = scriptDoc.nunaliit_script.script;
						};
					});
				}
				,onError: function(err){
					var errMessage = _loc('Unable to obtain list of export scripts')+': '+err;
					_this._reportError(errMessage);
					_this._logError(errMessage);
				}
			});
		};
		
		function formatChanged(){
			var extension = $('#'+formatId).val();
			var name = $('#'+fileNameId).val();
			var i = name.lastIndexOf('.');
			if( i >= 0 ){
				name = name.substr(0,i);
			};
			name = name + '.' + extension;
			$('#'+fileNameId).val(name);
		};
		
		function methodChanged(){
			var method = $('#'+methodId).val();

			var scriptText = knownScriptById[method];
			if( scriptText ){
				currentScript = scriptText;
			};

			var $scriptArea = $('#'+scriptAreaId);
			var $scriptDisplay = $('#'+scriptDisplayId);
			
			$scriptArea.text(currentScript);
			$scriptDisplay.text(currentScript);
			
			if( '__custom__' === method ){
				$scriptArea
					.removeAttr('disabled')
					.css('display','');
				$scriptDisplay
					.css('display','none');
			} else {
				$scriptArea
					.attr('disabled','disabled')
					.css('display','none');
				$scriptDisplay
					.css('display','');
			};
			
			return true;
		};
	},
	
	_performExportScript: function(opts_){
		var opts = $n2.extend({
			filter: 'all'
			,fileName: 'export'
			,format: 'geojson'
			,script: null
		},opts_);
		
		var _this = this;
		
		if( typeof opts.script !== 'string' ){
			throw new Error('Script is not a string');
		};
		
		// Initialize with all doc ids
		var docIdsRemaining = [];
		for(var i=0,e=this.docIds.length; i<e; ++i){
			docIdsRemaining.push( this.docIds[i] );
		};
		var totalCount = docIdsRemaining.length;
		var processedCount = 0;
		var errorCount = 0;
		var opCancelled = false;
		var records = [];
		
		// Create a copy of the configuration so that user
		// can save temporary objects to it
		var my_scriptConfig = $n2.extend({},this.config);

		// Compile script
		var scriptFn = null;
		//$n2.log('Script',opts.script);
		try {
			scriptFn = eval('('+opts.script+');');
		} catch(e) {
			this._reportError(_loc('Error')+': '+e);
			this._logError('Unable to evaluate script: '+e,opts.script);
			return;
		};
		if( typeof(scriptFn) !== 'function' ) {
			this._reportError( _loc('You must enter a valid function') );
			return;
		};
		
		var progressDialog = new $n2.couchDialogs.ProgressDialog({
			title: _loc('Compiling records')
			,onCancelFn: function(){
				opCancelled = true;
			}
		});
		
		processNextDocument();
		
		function processNextDocument(){
			if( opCancelled ) {
				cancel();
				return;
			};

			if(docIdsRemaining.length < 1){
				progressDialog.updateHtmlMessage('<span>100%</span>');

				// Do not include document to indicate that the export
				// is completed. This allows the script to perform record
				// operations before performing export
				scriptFn({
					config: my_scriptConfig
					,addRecord: addRecord
					,next: onFinish
				});
				
				
			} else {
				if( totalCount ) {
					var percent = Math.floor((processedCount) * 100 / totalCount);
					var html = ['<div>'];
					html.push('<span>Percent: '+percent+'%</span><br/>');
					html.push('<span>Processed: '+processedCount+'</span><br/>');
					html.push('<span>Error: '+errorCount+'</span><br/>');
					html.push('</div>');
					progressDialog.updateHtmlMessage( html.join('') );
				} else {
					progressDialog.updateHtmlMessage('<span>0%</span>');
				};
				
				var docId = docIdsRemaining.pop();
				_this.atlasDb.getDocument({
					docId: docId
					,onSuccess: retrievedDocument
					,onError: function(err){
						var locStr = _loc('Failure to fetch {docId}',{
							docId: docId
						});
						_this._logError(locStr);
						errorCount += 1;
						processNextDocument();
					}
				});
			};
		};
		
		function retrievedDocument(doc){
			if( opCancelled ) {
				cancel();
				return;
			};

			scriptFn({
				doc: doc
				,config: my_scriptConfig
				,addRecord: addRecord
				,next: next
			});
		};
		
		function addRecord(record){
			records.push(record);
		};
		
		function next(){
			processedCount += 1;

			processNextDocument();
		};

		function onFinish(){
			progressDialog.updateHtmlMessage('<span>Sending records to server</span>');
			
			// Open a new window to get results
			// open('about:blank', windowId);
			var windowId = $n2.getUniqueId();
			$('<iframe>')
				.attr('name',windowId)
				.attr('src','javascript:false')
				.css({
					visibility: 'hidden'
					,display: 'none'
				})
				.appendTo( $('body') );
			
			_this.exportService.exportByRecords({
				records: records
				,targetWindow: windowId
				,filter: opts.filter
				,contentType: 'application/binary'
				,fileName: opts.fileName
				,format: opts.format
				,onError: function(err){
					alert(_loc('Error during export')+': '+err);
				}
			});

			progressDialog.close();
			
			new $n2.couchDialogs.AlertDialog({
				title: _loc('Warning')
				,message: _loc('Please, wait until download starts. It might take a while.')
			});
		};
		
		function cancel(){
			_this._logError(_loc('Operation cancelled by user'));
			progressDialog.close();
		};
	}
});

//=========================================================================
var ExportService = $n2.Class('ExportService',{
	
	serverUrl: null,
	
	atlasDb: null,

	atlasDesign: null,

	config: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,atlasDb: null
			,atlasDesign: null
			,config: null
		},opts_);
		
		this.serverUrl = opts.url;
		this.atlasDb = opts.atlasDb;
		this.atlasDesign = opts.atlasDesign;
		this.config = opts.config;
	},

	checkAvailable: function(opts_){
		var opts = $n2.extend({
			onAvailable: function(){}
			,onNotAvailable: function(){}
		},opts_);
		
		if( !this.serverUrl ){
			opts.onNotAvailable();
			return;
		};
		
		$.ajax({
			url: this.serverUrl+'welcome'
			,type: 'GET'
			,dataType: 'json'
			,success: function(data, textStatus, jqXHR){
				if( data && data.ok ) {
					opts.onAvailable(data);
				} else {
					opts.onNotAvailable();
				};
			}
			,error: function(jqXHR, textStatus, errorThrown){
				opts.onNotAvailable();
			}
		});
	},
	
	createExportApplication: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,atlasDb: this.atlasDb
			,atlasDesign: this.atlasDesign
			,config: this.config
			,logger: null
		}, opts_);
		
		opts.exportService = this;
		
		return new ExportApplication(opts);
	},
	
	exportByRecords: function(opts_){
		var opts = $n2.extend({
			records: null
			,targetWindow: null
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !$n2.isArray(opts.records) ) {
			throw new Error('records must be provided as an array when exporting by records');
		};
		
		var url = this.serverUrl + 'records/';
		if( opts.fileName ){
			url = url + opts.fileName;
		} else {
			url = url + 'export';
		};
		var $form = $('<form>')
			.attr('action',url)
			.attr('method','POST')
			.attr('enctype','multipart/form-data')
			.css({
				display: 'none'
				,visibility: 'hidden'
			});

		// Target window
		if( opts.targetWindow ){
			$form.attr('target',opts.targetWindow);
		};
		
		if( opts.contentType ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','contentType')
				.val(opts.contentType)
				.appendTo($form);
		};

		if( opts.filter ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val(opts.filter)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val('all')
				.appendTo($form);
		};

		if( opts.format ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val(opts.format)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val('geojson')
				.appendTo($form);
		};
		
		// Data
		$('<input type="hidden" name="data"></input>')
			.val( JSON.stringify(opts.records) )
			.appendTo($form);

		$('body').append($form);
		
		$form.submit();
	},
	
	exportByDocIds: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,targetWindow: null
			,filter: 'all'
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.docIds ) {
			onError('docIds must be provided when exporting by docIds');
		};
		
		var url = this.serverUrl + 'export/definition/';
		if( opts.fileName ){
			url = url + opts.fileName;
		} else {
			url = url + 'export';
		};
		var $form = $('<form>')
			.attr('action',url)
			.attr('method','POST')
			.css({
				display: 'none'
				,visibility: 'hidden'
			});

		// Target window
		if( opts.targetWindow ){
			$form.attr('target',opts.targetWindow);
		};
		
		$('<input type="hidden" name="method" value="doc-id"></input>').appendTo($form);

		if( opts.contentType ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','contentType')
				.val(opts.contentType)
				.appendTo($form);
		};

		if( opts.filter ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val(opts.filter)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val('all')
				.appendTo($form);
		};

		if( opts.format ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val(opts.format)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val('geojson')
				.appendTo($form);
		};
		
		for(var i=0,e=opts.docIds.length; i<e; ++i){
			var docId = opts.docIds[i];
			$('<input type="hidden" name="name"></input>')
				.val(docId)
				.appendTo($form);
		};
		
		$('body').append($form);
		
		$form.submit();
	},
	
	exportBySchemaName: function(opts_){
		var opts = $n2.extend({
			schemaName: null
			,targetWindow: null
			,filter: 'all'
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.schemaName ) {
			opts.onError('schemaName must be provided when exporting by schema name');
		};
		
		opts.docIds = undefined;
		opts.layerId = undefined;

		if( opts.targetWindow ){
			this._exportByForm(opts);
		} else {
			this._exportByAjax(opts);
		};
	},
	
	exportByLayerId: function(opts_){
		var opts = $n2.extend({
			layerId: null
			,targetWindow: null
			,filter: 'all'
			,contentType: null
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		if( !opts.layerId ) {
			opts.onError('layerId must be provided when exporting by layer identifier');
		};
		
		opts.docIds = undefined;
		opts.schemaName = undefined;

		if( opts.targetWindow ){
			this._exportByForm(opts);
		} else {
			this._exportByAjax(opts);
		};
	},
	
	_exportByForm: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,schemaName: null
			,layerId: null
			,targetWindow: null
			,filter: 'all'
			,contentType: 'application/binary'
			,fileName: null
			,format: null
			,onError: $n2.reportError
		},opts_);
		
		var url = this.serverUrl + 'export/definition/';
		if( opts.fileName ){
			url = url + opts.fileName;
		} else {
			url = url + 'export';
		};
		var $form = $('<form>')
			.attr('action',url)
			.attr('method','POST')
			.css({
				display: 'none'
				,visibility: 'hidden'
			});

		// Target window
		if( opts.targetWindow ){
			$form.attr('target',opts.targetWindow);
		};

		if( opts.docIds ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','method')
				.attr('value','doc-id')
				.appendTo($form);

			for(var i=0,e=opts.docIds.length; i<e; ++i){
				var docId = opts.docIds[i];
				$('<input>')
					.attr('type','hidden')
					.attr('name','name')
					.val(docId)
					.appendTo($form);
			};

		} else if( opts.schemaName ) {
			$('<input>')
				.attr('type','hidden')
				.attr('name','method')
				.attr('value','schema')
				.appendTo($form);
			$('<input>')
				.attr('type','hidden')
				.attr('name','name')
				.val(opts.schemaName)
				.appendTo($form);

		} else if( opts.layerId ) {
			$('<input>')
				.attr('type','hidden')
				.attr('name','method')
				.attr('value','layer')
				.appendTo($form);
			$('<input>')
				.attr('type','hidden')
				.attr('name','name')
				.val(opts.layerId)
				.appendTo($form);

		} else {
			opts.onError('Unrecognized export method');
		};

		if( opts.contentType ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','contentType')
				.val(opts.contentType)
				.appendTo($form);
		};

		if( opts.filter ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val(opts.filter)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','filter')
				.val('all')
				.appendTo($form);
		};

		if( opts.format ){
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val(opts.format)
				.appendTo($form);
		} else {
			$('<input>')
				.attr('type','hidden')
				.attr('name','format')
				.val('geojson')
				.appendTo($form);
		};
		
		$('body').append($form);
		
		$form.submit();
	},
	
	_exportByAjax: function(opts_){
		var opts = $n2.extend({
			docIds: null
			,schemaName: null
			,layerId: null
			,filter: 'all'
			,format: null
			,onSuccess: function(result){}
			,onError: $n2.reportError
		},opts_);
		
		var url = this.serverUrl + 'export/definition/export';

		var data = {};
		if( opts.docIds ){
			data.method = 'doc-id';
			data.name = opts.docIds;

		} else if( opts.schemaName ) {
			data.method = 'schema';
			data.name = opts.schemaName;

		} else if( opts.layerId ) {
			data.method = 'layer';
			data.name = opts.layerId;

		} else {
			opts.onError('Unrecognized export method');
		};

		if( opts.contentType ){
			data.contentType = 'text/plain';
		};

		if( opts.filter ){
			data.filter = opts.filter;
		} else {
			data.filter = 'all';
		};

		if( opts.format ){
			data.format = opts.format;
		} else {
			data.format = 'geojson';
		};
		
		$.ajax({
			url: url
			,type: 'POST'
			,data: data
			,traditional: true
			,dataType: 'text'
			,success: function(res, textStatus, jqXHR){
				opts.onSuccess(res);
			}
			,error: function(jqXHR, textStatus, httpError){
				var error = $n2.utils.parseHttpJsonError(jqXHR,textStatus);
				opts.onError(error.error,error);
			}
		});
	}
});
	
$n2.couchExport = {
	ExportService: ExportService
	,ExportApplication: ExportApplication
};

})(jQuery,nunaliit2);