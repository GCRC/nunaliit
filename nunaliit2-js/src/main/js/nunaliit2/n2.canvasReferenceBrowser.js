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
 ,DH = 'n2.canvasReferenceBrowser'
 ;

// --------------------------------------------------------------------------
var ReferenceBrowserCanvas = $n2.Class({

	canvasId: null,
 	
	atlasDesign: null,
	
	schemaRepository: null,
	
	showService: null,
	
	dispatchService: null,
	
	docsById: null,
	
	briefsById: null,
	
	schemaNames: null,
	
	schemaLabelByName: null,
	
	sortingSchemaNames: null,
	
	refs: null,
 	
	initialize: function(opts_){
		var opts = $n2.extend({
			canvasId: null
			,config: null
			,schemaNames: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
 		
		this.canvasId = opts.canvasId;
		this.docsById = {};
		this.briefsById = {};
		this.schemaLabelByName = {};
		this.refs = [];
		
		this.schemaNames = opts.schemaNames;
		this.sortingSchemaNames = this.schemaNames.slice(); // clone
		
		if( opts.config ){
			this.atlasDesign = opts.config.atlasDesign;
			
			if( opts.config.directory ){
				this.schemaRepository = opts.config.directory.schemaRepository;
				this.showService = opts.config.directory.showService;
				this.dispatchService = opts.config.directory.dispatchService;
			};
		};
		
		if( this.dispatchService ){
			var f = function(m,addr,dispatcher){
				_this._handle(m,addr,dispatcher);
			};
			
			this.dispatchService.register(DH,'documentContent',f);
			this.dispatchService.register(DH,'documentContentCreated',f);
			this.dispatchService.register(DH,'documentContentUpdated',f);
			this.dispatchService.register(DH,'documentDeleted',f);
		};
		
		opts.onSuccess();
		
		this._display();
		
		this._loadDocs();
		
		if( this.schemaRepository ){
			this.schemaRepository.getSchemas({
				names: this.schemaNames
				,onSuccess: function(schemas){
					var schemasByName = {};
					
					schemas.forEach(function(schema){
						var label = schema.name;
						if( schema.label ){
							label = _loc( schema.label );
						};
						_this.schemaLabelByName[schema.name] = label;
					});

					_this._display();
				}
			});
		};
	},
	
	_getElem: function(){
		var $elem = $('#'+this.canvasId);
		if( $elem.length < 1 ){
			return undefined;
		};
		return $elem;
	},
	
	_display: function(){
		var _this = this;
		
		var $elem = this._getElem();
		if( $elem ){
			$elem
				.empty()
				.addClass('n2ReferenceBrowserCanvas')
				.click(function(e){
					_this._backgroundClicked();
				});
			
			$('<button>')
				.text(_loc('Export CSV'))
				.appendTo($elem)
				.click(function(){
					_this._exportCsv();
					return false;
				});
			
			var $table = $('<table>').appendTo($elem);
			
			// Headings
			var $tr = $('<tr>').appendTo($table);
			for(var i=0,e=_this.schemaNames.length; i<e; ++i){
				var schemaName = _this.schemaNames[i];
				var schemaLabel = _this.schemaLabelByName[schemaName];
				if( !schemaLabel ){
					schemaLabel = schemaName;
				};
				var $th = $('<th>')
					.appendTo($tr);
				
				$('<a>')
					.text(schemaLabel)
					.attr('href','#')
					.attr('data-schema-name',schemaName)
					.appendTo($th)
					.click(function(){
						var $a = $(this);
						var schemaName = $a.attr('data-schema-name');
						_this._sortOnCriteria(schemaName);
						return false;
					})
					;
					
			};
			
			// Data
			for(var i=0,e=_this.refs.length; i<e; ++i){
				var ref = _this.refs[i];
				
				var $tr = $('<tr>').appendTo($table);
				for(var j=0,k=_this.schemaNames.length; j<k; ++j){
					var schemaName = _this.schemaNames[j];
					
					var info = ref[schemaName];
					if( info ){
						var display = info.display;
						var docId = info.id;
						var doc = _this.docsById[docId];
						
							var $td = $('<td>')
								.appendTo($tr);
							var $a = $('<a>')
								.text(display)
								.attr('href','#')
								.attr('n2-doc-id',docId)
								.appendTo($td)
								.click(function(){
									var $a = $(this);
									var docId = $a.attr('n2-doc-id');
									_this._select(docId);
									return false;
								})
								;

						if( _this.showService && doc ){
							_this.showService.displayBriefDescription($a, {}, doc);
						};
						
					} else {
						$('<td>')
							.appendTo($tr);
					};
				};
			};
		};
	},
	
	_backgroundClicked: function(){
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userUnselect'
			});
		};
	},
	
	_loadDocs: function(){
		var _this = this;
		
		this.atlasDesign.queryView({
			viewName: 'nunaliit-schema'
			,keys: this.schemaNames
			,include_docs: true
			,onSuccess: function(rows){
				var loaded = false;
				for(var i=0,e=rows.length;i<e;++i){
					var row = rows[i];
					var doc = row.doc;
					var docId = doc._id;
					
					_this.docsById[docId] = doc;
					
					if( _this.briefsById[docId] ){
						delete _this.briefsById[docId];
					};
					
					loaded = true;
				};
				
				if( loaded ){
					_this._computeSortValues({
						onSuccess: sortValuesComputed
					});
				};
			}
			,onError: function(errorMsg){ 
				$n2.reportErrorForced(errorMsg); 
			}
		});
		
		function sortValuesComputed(){
			_this._computeReferences();
			_this._display();
		};
	},
	
	_computeReferences: function(){
		// Accumulate all references in a double map. Sort
		// docIds so that a -> b is the same as b -> a
		var map = {};
		for(var docId in this.docsById){
			var doc = this.docsById[docId];
			
			var refs = [];
			$n2.couchUtils.extractLinks(doc,refs);
			
			for(var i=0,e=refs.length; i<e; ++i){
				var ref = refs[i];
				if( ref && ref.doc ){
					var refId = ref.doc;
					
					// check that reference points back to a document
					// that is interesting
					if( this.docsById[refId] ){
						var a = docId;
						var b = refId;
						if( b < a ){
							a = refId;
							b = docId;
						};
						
						// Put in map
						if( !map[a] ){
							map[a] = {};
						};
						map[a][b] = true;
					};
				};
			};
		};
		
		// Convert into array
		var links = [];
		for(var id1 in map){
			var subMap = map[id1];
			for(var id2 in subMap){
				var doc1 = this.docsById[id1];
				var doc2 = this.docsById[id2];
				
				var schemaName1 = doc1.nunaliit_schema;
				var schemaName2 = doc2.nunaliit_schema;

				var display1 = this.briefsById[id1];
				var display2 = this.briefsById[id2];
				
				var link = {};
				link[schemaName1] = {
					id: id1
					,display: display1
				};
				link[schemaName2] = {
					id: id2
					,display: display2
				};
				links.push(link);
			};
		};
		
		this.refs = links;
		
		this._sortReferences();
	},
	
	_sortOnCriteria: function(name){
		var index = this.sortingSchemaNames.indexOf(name);
		if( index >= 0 ){
			this.sortingSchemaNames.splice(index,1);
			this.sortingSchemaNames.unshift(name);
			
			this._sortReferences();
			
			this._display();
		};
	},
	
	_sortReferences: function(){
		var _this = this;
		
		this.refs.sort(function(a,b){
			for(var i=0,e=_this.sortingSchemaNames.length; i<e; ++i){
				var criteria = _this.sortingSchemaNames[i];
				
				var aInfo = a[criteria];
				var bInfo = b[criteria];
				
				if( aInfo && bInfo ){
					var aDisplay = aInfo.display;
					var bDisplay = bInfo.display;
					
					if( aDisplay < bDisplay ){
						return -1;
					} else if( aDisplay > bDisplay ){
						return 1;
					} else {
						// wait for next criteria
					};
					
				} else if( aInfo ) {
					// no bInfo
					return -1;
				} else if( bInfo ){
					// no aInfo
					return 1;
				};
			};
			
			return 0;
		});
	},
	
	_computeSortValues: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
		},opts_);
		
		var _this = this;
		
		this.schemaRepository.getSchemas({
			names: this.schemaNames
			,onSuccess: function(schemas){
				var schemasByName = {};
				
				for(var i=0,e=schemas.length; i<e; ++i){
					var schema = schemas[i];
					var schemaName = schema.name;
					schemasByName[schemaName] = schema;
				};
				
				for(var docId in _this.docsById){
					var doc = _this.docsById[docId];
					var brief = _this.briefsById[docId];
					if( !brief ){
						var schema = schemasByName[doc.nunaliit_schema];
						
						if( schema ){
							var $elem = $('<div>');
							schema.brief(doc,$elem);
							brief = $elem.text();
						} else {
							brief = doc._id;
						};
						
						_this.briefsById[docId] = brief;
					};
				};
				
				opts.onSuccess();
			}
		});
	},
	
	_select: function(docId){
		var doc = this.docsById[docId];
		
		if( this.dispatchService ){
			this.dispatchService.send(DH,{
				type: 'userSelect'
				,docId: docId
				,doc: doc
			});
		};
	},

	_addDocument: function(doc){
		var _this = this;
		
		var docId = doc._id;
		var added = false;
		
		if( ! this.docsById[docId] ){
			this.docsById[docId] = doc;
			added = true;
			
		} else if( this.docsById[docId]._rev !== doc._rev ) {
			this.docsById[docId] = doc;
			delete this.briefsById[docId];
			added = true;
		};
		
		if( added ){
			this._computeSortValues({
				onSuccess: sortValuesComputed
			});
		};

		function sortValuesComputed(){
			_this._computeReferences();
			_this._display();
		};
	},

	_deleteDocument: function(docId){
		if( this.docsById[docId] ){
			delete this.docsById[docId];
			delete this.briefsById[docId];
			this._computeReferences();
			this._display();
		};
	},
	
	_handle: function(m,addr,dispatcher){
		if( 'documentContent' === m.type 
		 || 'documentContentCreated' === m.type 
		 || 'documentContentUpdated' === m.type ){
			var doc = m.doc;
			if( doc ){
				var schemaName = doc.nunaliit_schema;
				if( this.schemaNames.indexOf(schemaName) < 0 ){
					// Should be deleted
					var docId = doc._id;
					this._deleteDocument(docId);
					
				} else {
					// Should be added
					this._addDocument(doc);
				};
			};
			
		} else if( 'documentDeleted' === m.type ){
			var docId = m.docId;
			this._deleteDocument(docId);
		};
	},
	
	_computeCsvContent: function(){
		var table = [];
		
		// Headings
		var headLine = [];
		table.push(headLine);
		for(var i=0,e=this.schemaNames.length; i<e; ++i){
			var schemaName = this.schemaNames[i];
			headLine.push( schemaName + '(docId)' );
			headLine.push( schemaName + '(description)' );
		};
		
		// Data
		for(var i=0,e=this.refs.length; i<e; ++i){
			var ref = this.refs[i];
			
			var line = [];
			table.push(line);
			for(var j=0,k=this.schemaNames.length; j<k; ++j){
				var schemaName = this.schemaNames[j];
				
				var info = ref[schemaName];
				if( info ){
					var display = info.display;
					var docId = info.id;
					line.push(docId);
					line.push(display);
				} else {
					line.push('');
					line.push('');
				};
			};
		};
		
		var csvContent = $n2.csv.ValueTableToCsvString(table);
		
		return csvContent;
	},
	
	_exportCsv: function(){
		var csvContent = this._computeCsvContent();
		
		if( typeof Blob !== 'undefined' 
		 && typeof saveAs === 'function' ){
			var blob = new Blob([csvContent],{type: "text/plain;charset=" + document.characterSet});
			saveAs(blob, 'references.csv');
			
		} else {
			var $dialog = $('<div>')
				.addClass('n2canvasReferenceBrowser_exportCsv_dialog');
			var diagId = $n2.utils.getElementIdentifier($dialog);
			
			$('<textarea>')
				.addClass('n2canvasReferenceBrowser_exportCsv_text')
				.text(csvContent)
				.appendTo($dialog);
			
			$dialog.dialog({
				autoOpen: true
				,title: _loc('References')
				,modal: true
				,width: 370
				,close: function(event, ui){
					var diag = $('#'+diagId);
					diag.dialog('destroy');
					diag.remove();
				}
			});
		};
	}
});
 
//--------------------------------------------------------------------------
function HandleCanvasAvailableRequest(m){
	if( m.canvasType === 'referenceBrowser' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleCanvasDisplayRequest(m){
	if( m.canvasType === 'referenceBrowser' ){
		
		var options = {};
		if( m.canvasOptions ){
			for(var key in m.canvasOptions){
				options[key] = m.canvasOptions[key];
			};
		};
		
		options.canvasId = m.canvasId;
		options.interactionId = m.interactionId;
		options.config = m.config;
		options.moduleDisplay = m.moduleDisplay;
		options.onSuccess = m.onSuccess;
		options.onError = m.onError;
		
		new ReferenceBrowserCanvas(options);
	};
};

//--------------------------------------------------------------------------
$n2.canvasReferenceBrowser = {
	ReferenceBrowserCanvas: ReferenceBrowserCanvas
	,HandleCanvasAvailableRequest: HandleCanvasAvailableRequest
	,HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
};

})(jQuery,nunaliit2);
