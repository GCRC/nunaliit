/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchDialogs';

//++++++++++++++++++++++++++++++++++++++++++++++
function searchForDocumentId(options_){

	var options = $n2.extend({
		searchServer: null
		,showService: null
		,onSelected: function(docId){}
		,onReset: function(){}
	},options_);
	
	var shouldReset = true;
	
	var dialogId = $n2.getUniqueId();
	var inputId = $n2.getUniqueId();
	var searchButtonId = $n2.getUniqueId();
	var displayId = $n2.getUniqueId();
	var $dialog = $('<div id="'+dialogId+'" class="editorSelectDocumentDialog">'
			+'<div><label for="'+inputId+'">'+_loc('Search:')+'</label>'
			+'<input id="'+inputId+'" type="text"/>'
			+'<button id="'+searchButtonId+'">'+_loc('Search')+'</button></div>'
			+'<div  class="editorSelectDocumentDialogResults" id="'+displayId+'"></div>'
			+'<div><button class="cancel">'+_loc('Cancel')+'</button></div>'
			+'</div>');
	
	$dialog.find('button.cancel')
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			})
		;
	
	var dialogOptions = {
		autoOpen: true
		,title: _loc('Select Document')
		,modal: true
		,width: 370
		,close: function(event, ui){
			var diag = $(event.target);
			diag.dialog('destroy');
			diag.remove();
			if( shouldReset ) {
				options.onReset();
			};
		}
	};
	$dialog.dialog(dialogOptions);

	options.searchServer.installSearch({
		textInput: $('#'+inputId)
		,searchButton: $('#'+searchButtonId)
		,displayFn: displaySearch
		,onlyFinalResults: true
	});
	
	var $input = $('#'+inputId);
	$('#'+inputId).focus();
	
	function displaySearch(displayData) {
		if( !displayData ) {
			reportError('Invalid search results returned');

		} else if( 'wait' === displayData.type ) {
			$('#'+displayId).empty();

		} else if( 'results' === displayData.type ) {
			var $table = $('<table></table>');
			$('#'+displayId).empty().append($table);
		
			for(var i=0,e=displayData.list.length; i<e; ++i) {
				var docId = displayData.list[i].id;
				var $tr = $('<tr></tr>');

				$table.append($tr);
				
				$td = $('<td class="n2_search_result olkitSearchMod2_'+(i%2)+'">'
					+'<a href="#'+docId+'" alt="'+docId+'"></a></td>');
				$tr.append($td);
				if( options.showService ) {
					options.showService.printBriefDescription($td.find('a'),docId);
				} else {
					$td.find('a').text(docId);
				};
				$td.find('a').click( createClickHandler(docId) );
			};
			
		} else {
			reportError('Invalid search results returned');
		};
	};
	
	function createClickHandler(docId) {
		return function(e){
			options.onSelected(docId);
			shouldReset = false;
			var $dialog = $('#'+dialogId);
			$dialog.dialog('close');
			return false;
		};
	};
};

//++++++++++++++++++++++++++++++++++++++++++++++
function selectLayersDialog(opts_){
	
	var opts = $n2.extend({
		currentLayers: []
		,cb: function(selectedLayerIds){}
		,resetFn: function(){}
		,documentSource: null
		,showService: null
		,dispatchService: null
	},opts_);
	
	var layers = {};
	if( typeof(opts.currentLayers) === 'string' ){
		var layerNames = opts.currentLayers.split(',');
		for(var i=0,e=layerNames.length;i<e;++i){
			var layerId = $n2.trim(layerNames[i]);
			layers[layerId] = {
				currentlySelected: true
				,id: layerId
				,label: null
			};
		};
		
	} else if( $n2.isArray(opts.currentLayers) ){
		for(var i=0,e=opts.currentLayers.length;i<e;++i){
			var layerId = $n2.trim(opts.currentLayers[i]);
			layers[layerId] = {
				currentlySelected: true
				,id: layerId
				,label: null
			};
		};
	};

	var shouldReset = true;
	var dialogId = $n2.getUniqueId();
	var $dialog = $('<div id="'+dialogId+'" class="editorSelectLayerDialog">'
			+'<div class="editorSelectLayerContent"></div>'
			+'<div class="editorSelectLayerButtons"><button class="ok">'+_loc('OK')+'</button>'
			+'<button class="cancel">'+_loc('Cancel')+'</button></div>'
			+'</div>');
	
	$dialog.find('button.cancel')
		.button({icons:{primary:'ui-icon-cancel'}})
		.click(function(){
			var $dialog = $('#'+dialogId);
			$dialog.dialog('close');
			return false;
		});
	$dialog.find('button.ok')
		.button({
			icons:{primary:'ui-icon-check'}
			,disabled: true
		});
	
	var dialogOptions = {
		autoOpen: true
		,title: _loc('Select Layers')
		,modal: true
		,width: 370
		,close: function(event, ui){
			var diag = $(event.target);
			diag.dialog('destroy');
			diag.remove();
			if( shouldReset ) {
				opts.resetFn();
			};
		}
	};
	$dialog.dialog(dialogOptions);
	
	// Get layers
	if( opts.documentSource ){
		opts.documentSource.getLayerDefinitions({
			onSuccess: function(layerDefs){
				for(var i=0,e=layerDefs.length;i<e;++i){
					var layerDef = layerDefs[i];
					var layerId = layerDef.id;
					if( !layers[layerId] ){
						layers[layerId] = {
							currentlySelected: false
						};
					};
					if( layerDef.name ){
						layers[layerId].label = layerDef.name;
					};
				};
				getInnerLayers();
			}
			,onError: function(errorMsg){ 
				reportError(errorMsg);
			}
		});
	} else {
		getInnerLayers();
	};
	
	function getInnerLayers(){
		var m = {
			type: 'mapGetLayers'
			,layers: {}
		};
		opts.dispatchService.synchronousCall(DH, m);
		for(var layerId in m.layers){
			if( !layers[layerId] ){
				layers[layerId] = {
					currentlySelected: false	
				};
			};
		};
		displayLayers();
	};
	
	function displayLayers(){
		var $diag = $('#'+dialogId);
		
		var $c = $diag.find('.editorSelectLayerContent');
		$c.empty();
		for(var layerId in layers){
			var label = layerId;
			if( layers[layerId].label ){
				label = _loc( layers[layerId].label );
			};
			
			var inputId = $n2.getUniqueId();
			var $div = $('<div>')
				.appendTo($c);
			var $input = $('<input type="checkbox">')
				.addClass('layer')
				.attr('id',inputId)
				.attr('name',layerId)
				.appendTo($div);
			var $label = $('<label>')
				.attr('for',inputId)
				.text(label)
				.appendTo($div);

			if( layers[layerId].currentlySelected ){
				$input.attr('checked','checked');
			};
			
			if( opts.showService && !layers[layerId].label ){
				opts.showService.printLayerName($label, layerId);
			};
		};
		
		$diag.find('button.ok')
			.button('option','disabled',false)
			.click(function(){
				var selectedLayers = [];
				var $diag = $('#'+dialogId);
				$diag.find('input.layer').each(function(){
					var $input = $(this);
					if( $input.is(':checked') ){
						var layerId = $input.attr('name');
						selectedLayers.push(layerId);
					};
				});
				opts.cb(selectedLayers);

				shouldReset = false;
				$diag.dialog('close');
			});
	};
	
	function reportError(err){
		$('#'+dialogId).find('.editorSelectLayerContent').text('Error: '+err);
	};
};

//++++++++++++++++++++++++++++++++++++++++++++++
var DialogService = $n2.Class({

	dispatchService: null,
	
	documentSource: null,

	searchService: null,
	
	showService: null,
	
	schemaRepository: null,
	
	funcMap: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			dispatchService: null
			,documentSource: null
			,searchService: null
			,showService: null
			,schemaRepository: null
			,funcMap: null
		},opts_);
	
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.documentSource = opts.documentSource;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.schemaRepository = opts.schemaRepository;
		
		this.funcMap = {};
		for(var key in opts.funcMap){
			var fn = opts.funcMap[key];
			
			if( typeof(fn) === 'function' ){
				this.funcMap[key] = fn;
			};
		};
		
		// Add 'getDocumentId', if not defined
		if( !this.funcMap['getDocumentId'] ){
			this.funcMap['getDocumentId'] = function(opts){
				_this.searchForDocumentId(opts);
			};			
		};
		if( !this.funcMap['getLayers'] ){
			this.funcMap['getLayers'] = function(opts){
				_this.selectLayersDialog(opts);
			};			
		};
	},
	
	getFunctionMap: function(){
		return this.funcMap;
	},
	
	addFunctionToMap: function(fnName, fn){
		if( typeof(fn) === 'function' ){
			this.funcMap[fnName] = fn;
		};
	},

	searchForDocumentId: function(opts_){
		var opts = $n2.extend({
			onSelected: function(docId){}
			,onReset: function(){}
		},opts_);
		
		
		var searchServer = this.searchService;
		var showService = this.showService;
		
		searchForDocumentId({
			searchServer: searchServer
			,showService: showService
			,onSelected: opts.onSelected
			,onReset: opts.onReset
		});
	},
	
	selectLayersDialog: function(opts_){
		var opts = $n2.extend({
			currentLayers: []
			,onSelected: function(layerIds){}
			,onReset: function(){}
		},opts_);

		selectLayersDialog({
			currentLayers: opts.currentLayers
			,cb: opts.onSelected
			,resetFn: opts.onReset
			,showService: this.showService
			,dispatchService: this.dispatchService
			,documentSource: this.documentSource
		});
	},

	selectSchemaFromNames: function(opt_){
		var opt = $n2.extend({
			schemaNames: []
			,onSelected: function(schema){}
			,onError: $n2.reportErrorForced
			,onReset: function(){}
		},opt_);
		
		var _this = this;
		
		this.schemaRepository.getSchemas({
			names: opt.schemaNames
			,onSuccess: function(schemas){
				_this.selectSchema({
					schemas: schemas
					,onSelected: opt.onSelected
					,onError: opt.onError
					,onReset: opt.onReset
				});
			}
			,onError: opt.onError
		});
	},
	
	selectSchema: function(opt_){
		var opt = $n2.extend({
			schemas: null
			,onSelected: function(schema){}
			,onError: $n2.reportErrorForced
			,onReset: function(){}
		},opt_);
		
		var _this = this;
		
		// Check if all schemas
		if( null === opt.schemas ){
			this.schemaRepository.getRootSchemas({
				names: opt.schemaNames
				,onSuccess: function(schemas){
					_this.selectSchema({
						schemas: schemas
						,onSelected: opt.onSelected
						,onError: opt.onError
						,onReset: opt.onReset
					});
				}
				,onError: opt.onError
			});
			return;
		};
		
		if( !opt.schemas.length ) {
			opt.onReset();
			return;
		}

		if( opt.schemas.length == 1 ) {
			opt.onSelected( opt.schemas[0] );
			return;
		}
		
		var diagId = $n2.getUniqueId();
		var $dialog = $('<div id="'+diagId+'"></div>');

		var $label = $('<span></span>');
		$label.text( _loc('Select schema') + ': ' );
		$dialog.append($label);
		
		var $select = $('<select></select>');
		$dialog.append($select);
		for(var i=0,e=opt.schemas.length; i<e; ++i){
			var schema = opt.schemas[i];
			var schemaName = schema.name;
			var schemaLabel = schema.getLabel();
			$('<option>')
				.text(schemaLabel)
				.val(schemaName)
				.appendTo($select);
		};

		$dialog.append( $('<br/>') );
		
		var $ok = $('<button></button>');
		$ok.text( _loc('OK') );
		$ok.button({icons:{primary:'ui-icon-check'}});
		$dialog.append( $ok );
		$ok.click(function(){
			var $diag = $('#'+diagId);
			var schemaName = $diag.find('select').val();
			$diag.dialog('close');
			_this.schemaRepository.getSchema({
				name: schemaName
				,onSuccess: opt.onSelected
				,onError: function(err){
					opt.onError( _loc('Unable to fetch schema') );
				}
			});
			return false;
		});
		
		var $cancel = $('<button></button>');
		$cancel.text( _loc('Cancel') );
		$cancel.button({icons:{primary:'ui-icon-cancel'}});
		$dialog.append( $cancel );
		$cancel.click(function(){
			$('#'+diagId).dialog('close');
			opt.onReset();
			return false;
		});
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select a schema')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

$n2.couchDialogs = {
	DialogService: DialogService
};

})(jQuery,nunaliit2);
