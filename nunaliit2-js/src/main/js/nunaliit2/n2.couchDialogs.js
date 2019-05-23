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
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchDialogs';

// ++++++++++++++++++++++++++++++++++++++++++++++
function computeMaxDialogWidth(preferredWidth){
	var dialogWidth = preferredWidth;
	
	var screenWidth = $('body').width();
	if( typeof screenWidth === 'number' ){
		var maxWidth = screenWidth * 0.90;
		if( dialogWidth > maxWidth ){
			dialogWidth = maxWidth;
		};
	};

	return dialogWidth;
};

// **********************************************************************
var ProgressDialog = $n2.Class({
	
	dialogId: null,
	
	progressLabel: null,
	
	onCancelFn: null,
	
	cancellingLabel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			title: _loc('Progress')
			,progressLabel: _loc('Progress')
			,onCancelFn: null
			,cancelButtonLabel: _loc('Cancel') 
			,cancellingLabel: _loc('Cancelling Operation...')
		},opts_);
		
		var _this = this;
		
		this.dialogId = $n2.getUniqueId();
		this.progressLabel = opts.progressLabel;
		this.onCancelFn = opts.onCancelFn;
		this.cancellingLabel = opts.cancellingLabel;

		var $dialog = $('<div id="'+this.dialogId+'" class="n2dialogs_progress">'
			+'<div class="n2dialogs_progress_message">'
			+'<span class="n2dialogs_progress_label"></span>: <span class="n2dialogs_progress_percent"></span>'
			+'</div></div>');
		$dialog.find('span.n2dialogs_progress_label').text( this.progressLabel );
		
		var dialogOptions = {
			autoOpen: true
			,title: opts.title
			,modal: true
			,closeOnEscape: false
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		// Remove close button
		$dialog.parents('.ui-dialog').first().find('.ui-dialog-titlebar-close').hide();

		// Add cancel button, if needed
		if( typeof(opts.onCancelFn) === 'function'  ) {
			var cancelLine = $('<div><button class="n2dialogs_progress_cancelButton"></button></div>');
			$dialog.append(cancelLine);
			cancelLine.find('button')
				.text(opts.cancelButtonLabel)
				.click(function(){
					_this.cancel();
					return false;
				})
				;
		};
		
		this.updatePercent(0);
	},

	cancel: function(){
		if( typeof(this.onCancelFn) === 'function' ) {
			var $dialog = $('#'+this.dialogId);
			var $cb = $dialog.find('.n2dialogs_progress_cancelButton');
			var $m = $('<span></span>').text(this.cancellingLabel);
			$cb.before($m).remove();
			
			this.onCancelFn();
		};
	},

	close: function(){
		var $dialog = $('#'+this.dialogId);
		$dialog.dialog('close');
	},

	updatePercent: function(percent){
		var $dialog = $('#'+this.dialogId);
		var $p = $dialog.find('.n2dialogs_progress_percent');
		$p.text( ''+Math.floor(percent)+'%' );
	},
	
	updateHtmlMessage: function(html){
		var $dialog = $('#'+this.dialogId);
		var $div = $dialog.find('.n2dialogs_progress_message');
		$div.html( html );
	}
});


// **********************************************************************
var AlertDialog = $n2.Class({
	
	initialize: function(opts_){
		var opts = $n2.extend({
			title: _loc('Alert')
			,message: null
		},opts_);
		
		var alertDialog = new $n2.mdc.MDCDialog({
			mdcClasses: ['n2dialogs_alert'],
			dialogTitle: opts.title,
			dialogTextContent: opts.message,
			closeBtn: true,
			closeBtnText: 'OK'
		});

		$('#' + alertDialog.contentId).addClass('n2dialogs_alert_message');
	}
});


// ++++++++++++++++++++++++++++++++++++++++++++++
function searchForDocumentId(options_){

	var options = $n2.extend({
		searchServer: null
		,showService: null
		,onSelected: function(docId){}
		,onReset: function(){}
	},options_);
	
	var shouldReset = true;
	var inputId = $n2.getUniqueId();
	var searchButtonId = $n2.getUniqueId();
	var displayId = $n2.getUniqueId();

	var searchDocDialog = new $n2.mdc.MDCDialog({
		mdcClasses: ['editorSelectDocumentDialog'],
		dialogTitle: 'Select Document',
		scrollable: true,
		closeBtn: true,
		closeBtnText: 'Cancel'
	});

	new $n2.mdc.MDCTextField({
		parentId: searchDocDialog.contentId,
		txtFldLabel: 'Search',
		txtFldInputId: inputId
	});

	$('<div>')
		.attr('id',displayId)
		.addClass('editorSelectDocumentDialogResults')
		.appendTo('#' + searchDocDialog.contentId);

	new $n2.mdc.MDCButton({
		parentId: searchDocDialog.footerId, 
		mdcId: searchButtonId,
		mdcClasses: ['mdc-dialog__button'],
		btnLabel: 'Search'
	});
	
	options.searchServer.installSearch({
		textInput: $('#'+inputId)
		,searchButton: $('#'+searchButtonId)
		,displayFn: receiveSearchResults
		,onlyFinalResults: true
	});
	
	$('#'+inputId).focus();
	
	function receiveSearchResults(displayData) {
		if( !displayData ) {
			reportError('Invalid search results returned');

		} else if( 'wait' === displayData.type ) {
			$('#'+displayId).empty();

		} else if( 'results' === displayData.type ) {
			var docIds = [];
			for(var i=0,e=displayData.list.length; i<e; ++i) {
				var docId = displayData.list[i].id;
				docIds.push(docId);
			};
			displayDocIds(docIds);
			
		} else {
			reportError('Invalid search results returned');
		};
	};
	
	function displayDocIds(docIds){
		if( docIds.length < 1 ){
			$('#'+displayId)
				.empty()
				.append( _loc('Search result is empty') );
			
		} else {
			var $table = $('<table></table>');
			$('#'+displayId).empty().append($table);
		
			for(var i=0,e=docIds.length; i<e; ++i) {
				var docId = docIds[i];
				
				var $tr = $('<tr>')
					.appendTo($table);

				var $td = $('<td>')
					.addClass('n2_search_result')
					.appendTo($tr);
				
				var $a = $('<a>')
					.attr('href','#'+docId)
					.attr('alt',docId)
					.appendTo($td)
					.click( createClickHandler(docId) );

				if( options.showService ) {
					options.showService.printBriefDescription($a,docId);
				} else {
					$a.text(docId);
				};
			};
		};
	};
	
	function createClickHandler(docId) {
		return function(e){
			options.onSelected(docId);
			shouldReset = false;
			searchDocDialog.closeDialog();
			$('#' + searchDocDialog.getId()).remove();
			return false;
		};
	};
};

// ++++++++++++++++++++++++++++++++++++++++++++++
function selectLayersDialog(opts_){
	
	var opts = $n2.extend({
		currentLayers: []
		,cb: function(selectedLayerIds){}
		,resetFn: function(){}
		,documentSource: null
		,showService: null
		,dispatchService: null
	},opts_);
	
	var dialogId = $n2.getUniqueId();
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

	var selectLayerDialog = new $n2.mdc.MDCDialog({
		mdcId: dialogId,
		mdcClasses: ['editorSelectLayerDialog'],
		dialogTitle: 'Select Layers',
		scrollable: true,
		closeBtn: true,
		closeBtnText: 'Cancel'
	});

	$('#' + selectLayerDialog.contentId).addClass('editorSelectLayerContent');
	$('#' + selectLayerDialog.footerId).addClass('editorSelectLayerButtons');

	new $n2.mdc.MDCButton({
		parentId: selectLayerDialog.footerId,
		mdcClasses: ['ok', 'mdc-dialog__button'],
		btnLabel: 'OK',
		btnRaised: true,
		onBtnClick: function(){
			var selectedLayers = [];
			var $diag = $('#'+dialogId);
			$diag.find('input.layer').each(function(){
				var $input = $(this);
				if ($input.is(':checked')) {
					var layerId = $input.attr('name');
					selectedLayers.push(layerId);
				}
			});
			opts.cb(selectedLayers);

			selectLayerDialog.closeDialog();
			$('#' + selectLayerDialog.getId()).remove();
			return false;
		}
	});

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

		var $list = $('<ul>')
			.addClass('mdc-list')
			.attr('aria-orientation','vertical')
			.appendTo($c);

		for(var layerId in layers){
			var label = layerId;
			if( layers[layerId].label ){
				label = _loc( layers[layerId].label );
			};
			
			var inputId = $n2.getUniqueId();

			var $listItem = $('<li>')
				.addClass('mdc-list-item')
				.appendTo($list);
				
			var $div = $('<div>')
				.addClass('mdc-checkbox')
				.appendTo($listItem);

			var $input = $('<input>')
				.addClass('layer mdc-checkbox__native-control')
				.attr('type','checkbox')
				.attr('id',inputId)
				.attr('name',layerId)
				.appendTo($div);

			var $checkboxBackground = $('<div>')
				.addClass('mdc-checkbox__background')
				.appendTo($div);

			$('<svg class="mdc-checkbox__checkmark" viewBox="0 0 24 24"><path fill="none" stroke="white" class="mdc-checkbox__checkmark-path" d="M1.73,12.91 8.1,19.28 22.79,4.59" /></svg>')
				.appendTo($checkboxBackground);

			$('<div>')
				.addClass('mdc-checkbox__mixedmark')
				.appendTo($checkboxBackground);

			var $label = $('<span>')
				.addClass('mdc-list-item__text')
				.text(label)
				.appendTo($listItem)

			if( layers[layerId].currentlySelected ){
				$input.attr('checked','checked');
			};
			
			if( opts.showService && !layers[layerId].label ){
				opts.showService.printLayerName($label, layerId);
			};
		};

		// Attach Material Design Components
		$n2.mdc.attachMDCComponents();
	};
	
	function reportError(err){
		$('#'+dialogId).find('.editorSelectLayerContent').text('Error: '+err);
	};
};

// ++++++++++++++++++++++++++++++++++++++++++++++
// This is a factory class to generate a dialog function that
// can be used in selecting a document id from a list of presented
// documents. This is an abstract class and it must be specialized
// before it can be useful. Each sub-class should implement the
// method getDocuments() to return a sorted list of documents that
// can be selected.
//
// The dialog presented offers a search box which narrows the list
// of presented documents, based on the displayed brief.
var SearchBriefDialogFactory = $n2.Class({

	showService: null,
	
	dialogPrompt: null,
	
	sortOnBrief: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			showService: null
			,sortOnBrief: false
			,dialogPrompt: _loc('Select')
		},opts_);
		
		this.showService = opts.showService;
		this.dialogPrompt = opts.dialogPrompt;
		this.sortOnBrief = opts.sortOnBrief;
	},
	
	/*
	 * This method returns a function that can be used in
	 * DialogService.addFunctionToMap
	 */
	getDialogFunction: function(){
		var _this = this;
		return function(opts){
			_this.showDialog(opts);
		};
	},
	
	/*
	 * This method must be implemented by sub-classes
	 */
	getDocuments: function(opts_){
		var opts = $n2.extend({
			args: []
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		$n2.log('Subclasses to SearchBriefDialogFactory must implement getDocuments()');
		
		opts.onSuccess([]);
	},
	
	showDialog: function(opts_){
		var opts = $n2.extend({
			args: []
			,onSelected: function(docId){}
			,onReset: function(){}
		},opts_);
		
		var _this = this;

		var shouldReset = true;
		
		var dialogId = $n2.getUniqueId();
		var inputId = $n2.getUniqueId();
		var displayId = $n2.getUniqueId();
		var $dialog = $('<div>')
			.attr('id',dialogId)
			.addClass('editorSelectDocumentDialog')
			;
		
		var $searchLine = $('<div>')
			.appendTo($dialog);
		
		$('<label>')
			.attr('for', inputId)
			.text( _loc('Search:') )
			.appendTo($searchLine);
		
		$('<input>')
			.attr('id', inputId)
			.attr('type', 'text')
			.appendTo($searchLine)
			.keyup(function(){
				var $input = $(this);
				var text = $input.val();
				var frags = text.split(' ');
				var words = [];
				for(var i=0,e=frags.length; i<e; ++i){
					var frag = $n2.trim( frags[i].toLowerCase() );
					if( frag.length > 0 ){
						words.push(frag);
					};
				};
				$n2.log('text : '+words.join('+'));
				filterList(words);
			});
		
		var $results = $('<div>')
			.attr('id',displayId)
			.addClass('editorSelectDocumentDialogResults')
			.appendTo($dialog);

		$('<div>')
			.addClass('olkit_wait')
			.appendTo($results);

		var $buttons = $('<div>')
			.appendTo($dialog);
		
		$('<button>')
			.addClass('cancel')
			.text( _loc('Cancel') )
			.appendTo($buttons)
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			});
		
		var dialogOptions = {
			autoOpen: true
			,title: this.dialogPrompt
			,modal: true
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
				if( shouldReset ) {
					opts.onReset();
				};
			}
		};
		
		var width = computeMaxDialogWidth(370);
		if( typeof width === 'number' ){
			dialogOptions.width = width;
		};

		$dialog.dialog(dialogOptions);

		this.getDocuments({
			args: opts.args
			,onSuccess: displayDocs
			,onError: function(errorMsg){ 
				reportError( _loc('Unable to retrieve documents: {err}',{
					err: errorMsg
				}) ); 
			}
		});

		function displayDocs(docs) {

			if( docs.length < 1 ){
				$('#'+displayId)
					.empty()
					.text( _loc('No document found') );
				
			} else {
				var $table = $('<table></table>');
				$('#'+displayId).empty().append($table);
				
				var displayedById = {};

				for(var i=0,e=docs.length; i<e; ++i) {
					var doc = docs[i];
					var docId = doc._id;
					
					if( displayedById[docId] ){
						// Already displayed. Skip
					} else {
						displayedById[docId] = true;
						
						var $tr = $('<tr>')
							.addClass('trResult')
							.appendTo($table);

						var $td = $('<td>')
							.addClass('n2_search_result olkitSearchMod2_'+(i%2))
							.appendTo($tr);
						
						var $a = $('<a>')
							.attr('href','#'+docId)
							.attr('alt',docId)
							.appendTo($td)
							.click( createClickHandler(docId) );
						
						if( _this.showService ) {
							_this.showService.displayBriefDescription($a, {}, doc);
						} else {
							$a.text(docId);
						};
					};
				};
				
				if( _this.sortOnBrief ){
					sortTable($table);
				};
			};
		};
		
		function sortTable($table){
			// Get all rows
			var $trs = $table.find('tr');
			
			// Assign the text value as a sort key to each row
			$trs.each(function(){
				var $tr = $(this);
				$tr.attr('n2-sort-key',$tr.text());
			});
			
			// Sort on the key
			var trArray = $trs.toArray().sort(function(trA,trB){
				var keyA = $(trA).attr('n2-sort-key');
				var keyB = $(trB).attr('n2-sort-key');
				if( keyA === keyB ){
					return 0;
				} else if( !keyA ){
					return -1;
				} else if( !keyB ){
					return 1;
				} else if( keyA < keyB ){
					return -1;
				} else if( keyA > keyB ){
					return 1;
				} else {
					// should not get here
					return 0;
				};
			});

			// Re-order table
			trArray.forEach(function(tr){
				$table.append(tr);
			});
		};
		
		function filterList(words){
			var $dialog = $('#'+dialogId);
			var $trs = $dialog.find('.trResult');
			if( !words || words.length < 1 ){
				$trs.show();
			} else {
				$trs.each(function(){
					var $tr = $(this);
					var trText = $tr.text().toLowerCase();
					//$n2.log('trText : '+trText);
					var show = true;
					for(var i=0,e=words.length; i<e && show; ++i){
						var word = words[i];
						if( trText.indexOf(word) < 0 ){
							show = false;
						};
					};
					
					if( show ){
						$tr.show();
					} else {
						$tr.hide();
					};
				});
			};
		};
		
		function createClickHandler(docId) {
			return function(e){
				opts.onSelected(docId);
				shouldReset = false;
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			};
		};
		
		function reportError(err){
			$('#'+displayId)
				.empty()
				.text( err );
		};
	}

});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
 * Search for documents based on schema name(s)
 * @class
 */
var SearchOnSchemaDialogFactory = $n2.Class('SearchOnSchemaDialogFactory', SearchBriefDialogFactory, {

	atlasDesign: null,
	
	showService: null,
	
	dialogPrompt: null,
	
	/**
	 * @constructor
	 */
	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: undefined
			,showService: undefined
			,sortOnBrief: true
			,dialogPrompt: _loc('Select a Document')
		},opts_);
		
		$n2.couchDialogs.SearchBriefDialogFactory.prototype.initialize.call(this, opts);
		
		this.atlasDesign = opts.atlasDesign;
	},

	getDocuments: function(opts_){
		var opts = $n2.extend({
			args: []
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var keys = [];
		var errorEncountered = true;
		if( $n2.isArray(opts.args) 
		 && opts.args.length > 0 ){
			errorEncountered = false;
			
			var keys = [];
			opts.args.forEach(function(k){
				if( typeof k === 'string' ){
					keys.push(k);
				} else {
					errorEncountered = true;
				};
			});
		};
		
		if( errorEncountered ){
			$n2.logError('Can not search for documents based on schema', opts.args);
			opts.onError( _loc('Can not search for documents based on schema') ); 

		} else {
			this.atlasDesign.queryView({
				viewName: 'nunaliit-schema'
				,keys: keys
				,include_docs: true
				,onSuccess: function(rows){
					var docs = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var doc = rows[i].doc;
						if( doc ){
							docs.push(doc);
						};
					};
					
					opts.onSuccess(docs);
				}
				,onError: function(errorMsg){
					$n2.logError('Unable to retrieve documents for schema '+keys+': '+errorMsg);
					opts.onError( _loc('Unable to retrieve documents for schema {name}', {name:''+keys}) ); 
				}
			});
		};
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
* Search for documents based on layer identifier
* @class
*/
var SearchOnLayerDialogFactory = $n2.Class('SearchOnLayerDialogFactory', SearchBriefDialogFactory, {

	atlasDesign: null,
	
	showService: null,
	
	dialogPrompt: null,
	
	/**
	 * @constructor
	 */
	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDesign: undefined
			,showService: undefined
			,sortOnBrief: true
			,dialogPrompt: _loc('Select a Document')
		},opts_);
		
		$n2.couchDialogs.SearchBriefDialogFactory.prototype.initialize.call(this, opts);
		
		this.atlasDesign = opts.atlasDesign;
	},

	getDocuments: function(opts_){
		var opts = $n2.extend({
			args: []
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var keys = [];
		var errorEncountered = true;
		if( $n2.isArray(opts.args) 
		 && opts.args.length > 0 ){
			errorEncountered = false;
			
			var keys = [];
			opts.args.forEach(function(k){
				if( typeof k === 'string' ){
					keys.push(k);
				} else {
					errorEncountered = true;
				};
			});
		};
		
		if( errorEncountered ){
			$n2.logError('Can not search for documents based on layer', opts.args);
			opts.onError( _loc('Can not search for documents based on layer') ); 

		} else {
			this.atlasDesign.queryView({
				viewName: 'layers'
				,keys: keys
				,include_docs: true
				,onSuccess: function(rows){
					var docs = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var doc = rows[i].doc;
						if( doc ){
							docs.push(doc);
						};
					};
					
					opts.onSuccess(docs);
				}
				,onError: function(errorMsg){
					$n2.logError('Unable to retrieve documents for layer '+keys+': '+errorMsg);
					opts.onError( _loc('Unable to retrieve documents for layer {name}', {name:''+keys}) ); 
				}
			});
		};
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
 * Search for a related media file
 * @class
 */
var SearchRelatedMediaDialogFactory = $n2.Class('SearchRelatedMediaDialogFactory',{

	documentSource: null,
	
	searchService: null,
	
	showService: null,
	
	dialogPrompt: null,

	mdcDialogComponent: null,
	
	/**
	 * @constructor
	 */
	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: null
			,searchService: null
			,showService: null
			,dialogPrompt: _loc('Select a Media')
		},opts_);
		
		this.documentSource = opts.documentSource;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.dialogPrompt = opts.dialogPrompt;
	},
	
	/*
	 * This method returns a function that can be used in
	 * DialogService.addFunctionToMap
	 */
	getDialogFunction: function(){
		var _this = this;
		return function(opts){
			_this.showDialog(opts);
		};
	},
	
	/*
	 * Keeps only documents that have a media attachment
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var docsWithMedia = [];
		
		if( $n2.isArray(opts.docs) ){
			opts.docs.forEach(function(doc){
				var attachments = $n2.couchAttachment.getAttachments(doc);
				attachments.forEach(function(att){
					if( att.isSource() 
					 && att.isAttached() ){
						docsWithMedia.push(doc);
					};
				});
			});
		};
		
		opts.onSuccess( docsWithMedia );
	},
	
	showDialog: function(opts_){
		var opts = $n2.extend({
			contextDoc: null
			,onSelected: function(docId){}
			,onReset: function(){}
		},opts_);
		
		var _this = this;

		var shouldReset = true;
		
		var dialogId = $n2.getUniqueId();
		var inputId = $n2.getUniqueId();
		var searchButtonId = $n2.getUniqueId();
		var suggestionId = $n2.getUniqueId();
		var displayId = $n2.getUniqueId();
		
		var searchRelatedMediaDialog = new $n2.mdc.MDCDialog({
			mdcClasses: ['editorSelectDocumentDialog', 'editorSelectDocumentDialog_relatedMedia'],
			dialogTitle: this.dialogPrompt
		});

		var $suggestionContainer = $('<div>')
			.attr('class','editorSelectDocumentDialog_suggested')
			.appendTo($('#' + searchRelatedMediaDialog.contentId));

		$('<div>')
			.attr('class','editorSelectDocumentDialog_suggestedHeader')
			.text(_loc('Suggestions'))
			.appendTo($suggestionContainer);

		$('<div>')
			.attr('id',suggestionId)
			.attr('class','editorSelectDocumentDialog_suggestedList')
			.appendTo($suggestionContainer);

		var $searchLine = $('<div>')
			.attr('class','editorSelectDocumentDialog_searchLine')
			.appendTo($('#' + searchRelatedMediaDialog.contentId));

		new $n2.mdc.MDCTextField({
			parentId: $n2.utils.getElementIdentifier($searchLine),
			txtFldInputId: inputId,
			txtFldLabel: 'Search'
		});

		$('<div>')
			.attr('id',displayId)
			.attr('class','editorSelectDocumentDialogResults')
			.appendTo($('#' + searchRelatedMediaDialog.contentId));

		new $n2.mdc.MDCButton({
			parentId: searchRelatedMediaDialog.footerId,
			mdcClasses: ['cancel', 'mdc-dialog__button'],
			btnLabel: 'Cancel',
			onBtnClick: function(){
				searchRelatedMediaDialog.closeDialog();
				$('#' + searchRelatedMediaDialog.getId()).remove();
				if (shouldReset) {
					opts.onReset();
				};
				return false;
			}
		});

		new $n2.mdc.MDCButton({
			parentId: searchRelatedMediaDialog.footerId,
			mdcId: searchButtonId,
			mdcClasses: ['mdc-dialog__button'],
			btnLabel: 'Search'
		});

		this.searchService.installSearch({
			textInput: $('#'+inputId)
			,searchButton: $('#'+searchButtonId)
			,displayFn: receiveSearchResults
			,onlyFinalResults: true
		});

		$('#'+inputId).focus();

		// Get suggestions
		if( opts.contextDoc && typeof opts.contextDoc._id === 'string' ){
			this.documentSource.getReferencesFromId({
				docId: opts.contextDoc._id
				,onSuccess: receiveSuggestions
				,onError: function(errorMsg){
					// Ignore
					$n2.logError('Unable to fetch related documents for ' + opts.contextDoc._id);
				}
			});
		};

		function receiveSearchResults(displayData) {
			if( !displayData ) {
				reportError( _loc('Invalid search results returned') );

			} else if( 'wait' === displayData.type ) {
				$('#'+displayId).empty();

			} else if( 'results' === displayData.type ) {
				var docIds = [];

				for(var i=0,e=displayData.list.length; i<e; ++i) {
					var docId = displayData.list[i].id;
					docIds.push(docId);
				};

				if( docIds.length < 1 ){
					displayDocs([]);

				} else {
					_this.documentSource.getDocuments({
						docIds: docIds
						,onSuccess: function(docs){

							_this.filterDocuments({
								docs: docs
								,onSuccess: function(docs){
									displayDocs(docs, displayId);
								}
								,onError: reportError
							});
						}
						,onError: function(errorMsg){ 
							reportError( _loc('Unable to retrieve documents') );
						}
					});
				};
				
			} else {
				reportError( _loc('Invalid search results returned') );
			};
		};

		function receiveSuggestions(docIds) {
			if( docIds.length < 1 ){
				displayDocs([]);
				
			} else {
				_this.documentSource.getDocuments({
					docIds: docIds
					,onSuccess: function(docs){

						_this.filterDocuments({
							docs: docs
							,onSuccess: function(docs){
								displayDocs(docs, suggestionId);
							}
							,onError: reportError
						});
					}
					,onError: function(errorMsg){ 
						reportError(_loc('Unable to retrieve documents'));
					}
				});
			};
		};

		function displayDocs(docs, elemId) {

			if( docs.length < 1 ){
				$('#'+elemId)
					.empty()
					.text( _loc('No results returned by search') );
				
			} else {
				var $table = $('<table></table>');
				$('#'+elemId).empty().append($table);

				for(var i=0,e=docs.length; i<e; ++i) {
					var doc = docs[i];
					var docId = doc._id;
					
					var $tr = $('<tr></tr>');

					$table.append($tr);

					var $td = $('<td>')
						.addClass('n2_search_result')
						.appendTo($tr);
					
					var $a = $('<a>')
						.attr('href','#'+docId)
						.attr('alt',docId)
						.appendTo($td)
						.click( createClickHandler(docId) );
					
					if( _this.showService ) {
						_this.showService.displayBriefDescription($a, {}, doc);
					} else {
						$a.text(docId);
					};
				};
			};
		};
		
		function createClickHandler(docId) {
			return function(e){
				opts.onSelected(docId);
				shouldReset = false;
				var $dialog = $('#'+dialogId);
				searchRelatedMediaDialog.closeDialog();
				$('#' + searchRelatedMediaDialog.getId()).remove();
				return false;
			};
		};
		
		function reportError(err){
			$('#'+displayId)
				.empty()
				.text( err );
		};
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
 * Search for a related image media file
 * @class
 */
var SearchRelatedImageDialogFactory = $n2.Class('SearchRelatedImageDialogFactory', SearchRelatedMediaDialogFactory, {

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: undefined
			,searchService: undefined
			,showService: undefined
			,dialogPrompt: _loc('Select a Related Image')
		},opts_);
		
		SearchRelatedMediaDialogFactory.prototype.initialize.call(this, opts);
	},
	
	/*
	 * Keeps only documents that have an audio attachment
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var selectedDocs = [];
		
		if( $n2.isArray(opts.docs) ){
			opts.docs.forEach(function(doc){
				var attachments = $n2.couchAttachment.getAttachments(doc);
				attachments.forEach(function(att){
					if( att.isSource() 
					 && att.isAttached() 
					 && 'image' === att.getFileClass() ){
						selectedDocs.push(doc);
					};
				});
			});
		};
		
		opts.onSuccess( selectedDocs );
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
 * Search for a related audio media file
* @class
*/
var SearchRelatedAudioDialogFactory = $n2.Class('SearchRelatedAudioDialogFactory', SearchRelatedMediaDialogFactory, {

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: undefined
			,searchService: undefined
			,showService: undefined
			,dialogPrompt: _loc('Select a Related Audio File')
		},opts_);
		
		SearchRelatedMediaDialogFactory.prototype.initialize.call(this, opts);
	},
	
	/*
	 * Keeps only documents that have an audio attachment
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var selectedDocs = [];
		
		if( $n2.isArray(opts.docs) ){
			opts.docs.forEach(function(doc){
				var attachments = $n2.couchAttachment.getAttachments(doc);
				attachments.forEach(function(att){
					if( att.isSource() 
					 && att.isAttached() 
					 && 'audio' === att.getFileClass() ){
						selectedDocs.push(doc);
					};
				});
			});
		};
		
		opts.onSuccess( selectedDocs );
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
* Search for a related video media file
* @class
*/
var SearchRelatedVideoDialogFactory = $n2.Class('SearchRelatedVideoDialogFactory', SearchRelatedMediaDialogFactory, {

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: undefined
			,searchService: undefined
			,showService: undefined
			,dialogPrompt: _loc('Select a Related Video File')
		},opts_);
		
		SearchRelatedMediaDialogFactory.prototype.initialize.call(this, opts);
	},
	
	/*
	 * Keeps only documents that have an audio attachment
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var selectedDocs = [];
		
		if( $n2.isArray(opts.docs) ){
			opts.docs.forEach(function(doc){
				var attachments = $n2.couchAttachment.getAttachments(doc);
				attachments.forEach(function(att){
					if( att.isSource() 
					 && att.isAttached() 
					 && 'video' === att.getFileClass() ){
						selectedDocs.push(doc);
					};
				});
			});
		};
		
		opts.onSuccess( selectedDocs );
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
/**
 * Search for a related hover sound file
 * @class
 */
var HoverSoundSearchDialogFactory = $n2.Class('HoverSoundSearchDialogFactory', SearchRelatedMediaDialogFactory, {

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: undefined
			,searchService: undefined
			,showService: undefined
			,dialogPrompt: _loc('Select a Hover Sound')
		},opts_);
		
		SearchRelatedMediaDialogFactory.prototype.initialize.call(this, opts);
	},
	
	/*
	 * Keeps only documents that have an audio attachment
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		var docsWithHoverSound = [];
		
		if( $n2.isArray(opts.docs) ){
			opts.docs.forEach(function(doc){
				var attachments = $n2.couchAttachment.getAttachments(doc);
				attachments.forEach(function(att){
					if( att.isSource() 
					 && att.isAttached() 
					 && 'audio' === att.getFileClass() ){
						docsWithHoverSound.push(doc);
					};
				});
			});
		};
		
		opts.onSuccess( docsWithHoverSound );
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
// This is a factory class to generate a dialog function that
// can be used in selecting a document id from a list of presented
// documents. This is an abstract class and it must be specialized
// before it can be useful. Each sub-class should implement the
// method filterDocuments() to return a sorted list of documents that
// can be selected.
//
// The dialog presented offers a search box which performs a text
// search through the database. The documents retrieved this way
// are filtered and sorted by the sub-class. Then filtered list is
// presented to the user for selection.
var FilteredSearchDialogFactory = $n2.Class({

	atlasDb: null,
	
	searchService: null,
	
	showService: null,
	
	dialogPrompt: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			atlasDb: null
			,searchService: null
			,showService: null
			,dialogPrompt: _loc('Search')
		},opts_);
		
		this.atlasDb = opts.atlasDb;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.dialogPrompt = opts.dialogPrompt;
	},
	
	/*
	 * This method returns a function that can be used in
	 * DialogService.addFunctionToMap
	 */
	getDialogFunction: function(){
		var _this = this;
		return function(opts){
			_this.showDialog(opts);
		};
	},
	
	/*
	 * This method must be implemented by sub-classes
	 */
	filterDocuments: function(opts_){
		var opts = $n2.extend({
			docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		},opts_);
		
		$n2.log('Subclasses to FilteredSearchDialogFactory must implement filterDocuments()');
		
		opts.onSuccess( opts.docs );
	},
	
	showDialog: function(opts_){
		var opts = $n2.extend({
			onSelected: function(docId){}
			,onReset: function(){}
		},opts_);
		
		var _this = this;

		var shouldReset = true;
		
		var dialogId = $n2.getUniqueId();
		var inputId = $n2.getUniqueId();
		var searchButtonId = $n2.getUniqueId();
		var displayId = $n2.getUniqueId();
		
		var $dialog = $('<div>')
			.attr('id',dialogId)
			.addClass('editorSelectDocumentDialog');
		
		var $searchLine = $('<div>')
			.appendTo($dialog);

		$('<label>')
			.attr('for', inputId)
			.text( _loc('Search:') )
			.appendTo($searchLine);

		$('<input>')
			.attr('id', inputId)
			.attr('type', 'text')
			.appendTo($searchLine);

		$('<button>')
			.attr('id', searchButtonId)
			.text( _loc('Search') )
			.appendTo($searchLine);
		
		$('<div>')
			.attr('id',displayId)
			.addClass('editorSelectDocumentDialogResults')
			.appendTo($dialog);
		
		var $buttons = $('<div>')
			.appendTo($dialog);
		
		$('<button>')
			.addClass('cancel')
			.text( _loc('Cancel') )
			.appendTo($buttons)
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			});

		var dialogOptions = {
			autoOpen: true
			,title: this.dialogPrompt
			,modal: true
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
				if( shouldReset ) {
					opts.onReset();
				};
			}
		};
		
		var width = computeMaxDialogWidth(370);
		if( typeof width === 'number' ){
			dialogOptions.width = width;
		};

		$dialog.dialog(dialogOptions);

		this.searchService.installSearch({
			textInput: $('#'+inputId)
			,searchButton: $('#'+searchButtonId)
			,displayFn: receiveSearchResults
			,onlyFinalResults: true
		});
		
		var $input = $('#'+inputId);
		$('#'+inputId).focus();
		
		function receiveSearchResults(displayData) {
			if( !displayData ) {
				reportError( _loc('Invalid search results returned') );

			} else if( 'wait' === displayData.type ) {
				$('#'+displayId).empty();

			} else if( 'results' === displayData.type ) {
				var docIds = [];
			
				for(var i=0,e=displayData.list.length; i<e; ++i) {
					var docId = displayData.list[i].id;
					docIds.push(docId);
				};
				
				if( docIds.length < 1 ){
					displayDocs([]);
					
				} else {
					_this.atlasDb.getDocuments({
						docIds: docIds
						,onSuccess: function(docs){

							_this.filterDocuments({
								docs: docs
								,onSuccess: displayDocs
								,onError: reportError
							});
						}
						,onError: function(errorMsg){ 
							reportError( _loc('Unable to retrieve documents') );
						}
					});
				};
				
			} else {
				reportError( _loc('Invalid search results returned') );
			};
		};

		function displayDocs(docs) {

			if( docs.length < 1 ){
				$('#'+displayId)
					.empty()
					.text( _loc('No results returned by search') );
				
			} else {
				var $table = $('<table></table>');
				$('#'+displayId).empty().append($table);

				for(var i=0,e=docs.length; i<e; ++i) {
					var doc = docs[i];
					var docId = doc._id;
					
					var $tr = $('<tr></tr>');

					$table.append($tr);

					var $td = $('<td>')
						.addClass('n2_search_result olkitSearchMod2_'+(i%2))
						.appendTo($tr);
					
					var $a = $('<a>')
						.attr('href','#'+docId)
						.attr('alt',docId)
						.appendTo($td)
						.click( createClickHandler(docId) );
					
					if( _this.showService ) {
						_this.showService.displayBriefDescription($a, {}, doc);
					} else {
						$a.text(docId);
					};
				};
			};
		};
		
		function createClickHandler(docId) {
			return function(e){
				opts.onSelected(docId);
				shouldReset = false;
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			};
		};
		
		function reportError(err){
			$('#'+displayId)
				.empty()
				.text( err );
		};
	}
});

// ++++++++++++++++++++++++++++++++++++++++++++++
var DialogService = $n2.Class({

	dispatchService: null,
	
	documentSource: null,

	searchService: null,
	
	showService: null,
	
	schemaRepository: null,
	
	funcMap: null,
	
	atlasDesign: null,
	
	initialize: function(opts_) {
		var opts = $n2.extend({
			dispatchService: null
			,documentSource: null
			,searchService: null
			,showService: null
			,schemaRepository: null
			,funcMap: null
			,atlasDesign: null
		},opts_);
	
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.documentSource = opts.documentSource;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.schemaRepository = opts.schemaRepository;
		this.atlasDesign = opts.atlasDesign;
		
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

		if( !this.funcMap['getRelatedMedia'] ){
			var relatedMediaDialogFactory = new SearchRelatedMediaDialogFactory({
				documentSource: this.documentSource
				,searchService: this.searchService
				,showService: this.showService
			});
			this.funcMap['getRelatedMedia'] = relatedMediaDialogFactory.getDialogFunction();
		};

		if( !this.funcMap['getRelatedImage'] ){
			var factory = new SearchRelatedImageDialogFactory({
				documentSource: this.documentSource
				,searchService: this.searchService
				,showService: this.showService
			});
			this.funcMap['getRelatedImage'] = factory.getDialogFunction();
		};

		if( !this.funcMap['getRelatedAudio'] ){
			var factory = new SearchRelatedAudioDialogFactory({
				documentSource: this.documentSource
				,searchService: this.searchService
				,showService: this.showService
			});
			this.funcMap['getRelatedAudio'] = factory.getDialogFunction();
		};

		if( !this.funcMap['getRelatedVideo'] ){
			var factory = new SearchRelatedVideoDialogFactory({
				documentSource: this.documentSource
				,searchService: this.searchService
				,showService: this.showService
			});
			this.funcMap['getRelatedVideo'] = factory.getDialogFunction();
		};

		if( !this.funcMap['getHoverSound'] ){
			var hoverSoundDialogFactory = new HoverSoundSearchDialogFactory({
				documentSource: this.documentSource
				,searchService: this.searchService
				,showService: this.showService
			});
			this.funcMap['getHoverSound'] = hoverSoundDialogFactory.getDialogFunction();
		};

		if( !this.funcMap['getDocumentFromSchema'] ){
			var factory = new SearchOnSchemaDialogFactory({
				atlasDesign: this.atlasDesign
				,showService: this.showService
			});
			this.funcMap['getDocumentFromSchema'] = factory.getDialogFunction();
		};

		if( !this.funcMap['getDocumentFromLayer'] ){
			var factory = new SearchOnLayerDialogFactory({
				atlasDesign: this.atlasDesign
				,showService: this.showService
			});
			this.funcMap['getDocumentFromLayer'] = factory.getDialogFunction();
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

		if (!window.cordova) {
			var $label = $('<span></span>');
			$label.text( _loc('Select schema') + ': ' );
			$dialog.append($label);
		}
		
		var $select = $('<select></select>');

		if (window.cordova) {
			$select.addClass('cordova-select-dropdown');
		}

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
		
		var mustReset = true;
		
		var $btnContainer;
		if (window.cordova) {
			$btnContainer = $('<div></div>')
				.addClass('cordova-button-container');
		}

		var $ok;
		if (window.cordova) {
			$ok = $('<label></label>')
				.text(_loc('Select'))
				.addClass('cordova-dialog-btn')
			$btnContainer.append($ok);
		} else {
			$ok = $('<button></button>');
			$ok.text( _loc('OK') );
			$ok.button({icons:{primary:'ui-icon-check'}});
			$dialog.append( $ok );
		} 
		$ok.click(function(){
			mustReset = false;
			
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
		
		var $cancel;
		if (window.cordova) {
			$cancel = $('<label></label>')
				.addClass('cordova-dialog-btn');
			$btnContainer.append($cancel);
		} else {
			$cancel = $('<button></button>');
			$cancel.button({icons:{primary:'ui-icon-cancel'}});
			$dialog.append( $cancel );
		}
		$cancel.text( _loc('Cancel') );
		$cancel.click(function(){
			$('#'+diagId).dialog('close');
			return false;
		});

		if (window.cordova) {
			$dialog.append($btnContainer);
		}

		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select a schema')
			,modal: true
			,resizable: !window.cordova
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
				
				if( mustReset ){
					opt.onReset();
				};
			}
			,open: function(event, ui) {
				if (window.cordova) {
					$(".ui-dialog-titlebar-close", ui.dialog | ui).hide();
				}
    	}
		};
		
		if (window.cordova) {
			// Make the dialog title larger on Cordova
			$("<style type='text/css'> .ui-dialog-title { font-size: large } </style>").appendTo("head");
		}
		
		if (window.cordova) {
			dialogOptions.maxWidth = '300px'
		} else {
			var width = computeMaxDialogWidth(740);
			if( typeof width === 'number' ){
				dialogOptions.width = width;
			};
		}
		
		$dialog.dialog(dialogOptions);
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

$n2.couchDialogs = {
	DialogService: DialogService
	,SearchBriefDialogFactory: SearchBriefDialogFactory
	,FilteredSearchDialogFactory: FilteredSearchDialogFactory
	,ProgressDialog: ProgressDialog
	,AlertDialog: AlertDialog
	,SearchRelatedMediaDialogFactory: SearchRelatedMediaDialogFactory
};

})(jQuery,nunaliit2);
