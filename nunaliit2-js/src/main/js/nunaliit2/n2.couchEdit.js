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

;(function($,$n2) {
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couchEdit'
;

function getDefaultCouchProjection(){
	var defaultCouchProj = null;
	if( typeof(OpenLayers) !== 'undefined' 
	 && OpenLayers.Projection ) {
		defaultCouchProj = new OpenLayers.Projection('EPSG:4326');
	};
	return defaultCouchProj;
};

//++++++++++++++++++++++++++++++++++++++++++++++


function isKeyEditingAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;
	
	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	if( selectors[0] === '__n2Source' ) return false;
	
	return true;
}

function isValueEditingAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;

	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	if( selectors[0] === '__n2Source' ) return false;
	
	return true;
};

function isKeyDeletionAllowed(obj, selectors, data) {
	
	if( !selectors ) return false;

	if( selectors[0] === '_id' ) return false;
	if( selectors[0] === '_rev' ) return false;
	if( selectors[0] === '__n2Source' ) return false;
	
	return true;
};

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

var CouchSimpleDocumentEditor = $n2.Class({

	elemId: null

	,editedDocument: null
	
	,schema: null
	
	,defaultEditSchema: null

	,schemaRepository: null
	
	,schemaEditorService: null
	
	,dispatchService: null
	
	,editors: null
	
	,couchProj: null
	
	,treeEditor: null
	
	,slideEditor: null
	
	,isInsert: null
	
	,editorsContainerId: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,elemId: null
			,doc: null
			,schema: null // schema name, array of schema name or special option
			,defaultEditSchema: null
			,schemaRepository: null
			,schemaEditorService: null
			,dispatchService: null
			,editors: null
			,couchProj: null
		},opts_);
		
		this.elemId = opts.elemId;
		if( opts.elem ){
			var $elem = $(opts.elem);
			this.elemId = $elem.attr('id');
			if( !this.elemId ){
				this.elemId = $n2.getUniqueId();
				$elem.attr('id',this.elemId);
			};
		};
		
		this.schema = opts.schema;
		this.defaultEditSchema = opts.defaultEditSchema;
		this.schemaRepository = opts.schemaRepository;
		this.schemaEditorService = opts.schemaEditorService;
		this.dispatchService = opts.dispatchService;
		this.editors = opts.editors;
		this.couchProj = opts.couchProj;

		this.editedDocument = {};
		var clonedDoc = $n2.extend(true,{},opts.doc); // deep copy
		for(var key in clonedDoc){
			if( '__n2Source' === key ){
				// Drop information about document source so it does not
				// appear in the editor
			} else {
				this.editedDocument[key] = clonedDoc[key];
			};
		};
		
		// Obtain documentSource
		this.editedDocumentSource = undefined;
		if( this.dispatchService ){
			var m = {
				type: 'documentSourceFromDocument'
				,doc: opts.doc
			};
			this.dispatchService.synchronousCall(DH,m);
			this.editedDocumentSource = m.documentSource;
		};
		
		this.isInsert = false;
		
		if( !this.couchProj ){
			this.couchProj = getDefaultCouchProjection();
		};
		
		if( this.dispatchService ){
			var f = function(m){ _this._handle(m); };
			this.dispatchService.register(DH, 'editGeometryModified', f);
			this.dispatchService.register(DH, 'mapGeometryAdded', f);
		};
		
		if( !this.editors ){
			// Default
			this.editors = [
				$n2.couchEdit.Constants.FORM_EDITOR
				,$n2.couchEdit.Constants.TREE_EDITOR
				,$n2.couchEdit.Constants.SLIDE_EDITOR
				,$n2.couchEdit.Constants.RELATION_EDITOR
			];
		};
		
		this._edit();
	}

	,getDocument: function(){
		return this.editedDocument;
	}

	,_getDiv: function(){
		return $('#'+this.elemId);
	}

	,_edit: function(){
		var _this = this;
		
		this.isInsert = (typeof this.editedDocument._rev === 'undefined' 
			|| this.editedDocument._rev === null);
	
		this._selectSchema(schemaSelected);
		
		function schemaSelected(schema) {
			if( _this.isInsert ) {
				// Create original object by augmenting current one with template
				if( schema ) {
					var template = schema.createObject({});
					$n2.extend(true, _this.editedDocument, template);
				};
			};
			
			_this._displayEditor(schema);
		};
	}
	
    ,_displayEditor: function(selectedSchema) {
    	var _this = this;
    	
    	var data = this.editedDocument;
		
    	// Give an opportunity to adjust document before edit
    	this._synchronousCall({
    		type: 'editorStartDocumentEdit'
    		,doc: data
    	});
    	
		// Update feature data with user info
		$n2.couchDocument.adjustDocument(data);
		
		// Figure out if accordion is needed
		var accordionNeeded = false;
		var relationEditorNeeded = false;
		var editorCount = 0;
		for(var i=0,e=this.editors.length;i<e;++i){
			var editorDesc = this.editors[i];
			if( $n2.couchEdit.Constants.FORM_EDITOR === editorDesc ){
				if( selectedSchema && this.schemaEditorService ){
					++editorCount;
				};
			} else if( $n2.couchEdit.Constants.TREE_EDITOR === editorDesc ){
				++editorCount;
			} else if( $n2.couchEdit.Constants.SLIDE_EDITOR === editorDesc ){
				++editorCount;
			} else if( $n2.couchEdit.Constants.RELATION_EDITOR === editorDesc ){
				relationEditorNeeded = true;
			};
		};
		if( editorCount > 1 ){
			accordionNeeded = true;
		};
    	
		var $div = this._getDiv();
		$div.empty();
		
		this.editorsContainerId = $n2.getUniqueId();
		var $editorsContainer = $('<div id="'+this.editorsContainerId+'" class="n2CouchEditor_container"></div>');
		$div.append($editorsContainer);

		for(var i=0,e=this.editors.length;i<e;++i){
			var editorDesc = this.editors[i];
			
			if( $n2.couchEdit.Constants.FORM_EDITOR === editorDesc
			 && selectedSchema 
			 && this.schemaEditorService ) {
				// Accordion Header
				if( accordionNeeded ) {
					var $schemaHeader = $('<h3>')
						.appendTo($editorsContainer);
					$('<a>')
						.attr('href','#')
						.text( _loc('Form View') )
						.appendTo($schemaHeader);
				};
				
				var $schemaContainer = $('<div class="n2CouchEditor_schema"></div>')
					.addClass('n2CouchEditor_schema')
					.appendTo($editorsContainer);
				
				this.schemaEditor = this.schemaEditorService.editDocument({
					doc: data
					,schema: selectedSchema
					,$div: $schemaContainer
					,onChanged: function(){
						_this._adjustInternalValues(_this.editedDocument);
						if( _this.treeEditor ) {
							_this.treeEditor.refresh();
						};
						if( _this.slideEditor ) {
							_this.slideEditor.refresh();
						};
						_this._refreshRelations(data);
						_this._onEditorObjectChanged(data);
					}
				});
				
			} else if( $n2.couchEdit.Constants.TREE_EDITOR === editorDesc ) {
				// Accordion Header for Tree
				if( accordionNeeded ) {
					var $treeHeader = $('<h3>')
						.appendTo($editorsContainer);
					$('<a>')
						.attr('href','#')
						.text( _loc('Tree View') )
						.appendTo($treeHeader);
				};
		
				// Tree container
				var $treeContainer = $('<div>')
					.addClass('n2CouchEditor_tree')
					.appendTo($editorsContainer);
				var editorOptions = {
					onObjectChanged: function() {
						_this._adjustInternalValues(_this.editedDocument);
						if( _this.slideEditor ) {
							_this.slideEditor.refresh();
						};
						if( _this.schemaEditor ) {
							_this.schemaEditor.refresh();
						};
						_this._refreshRelations(data);
						_this._onEditorObjectChanged(data);
					}
					,isKeyEditingAllowed: isKeyEditingAllowed
					,isValueEditingAllowed: isValueEditingAllowed
					,isKeyDeletionAllowed: isKeyDeletionAllowed
				};
				var objectTree = new $n2.tree.ObjectTree($treeContainer, data, editorOptions);
				this.treeEditor = new $n2.tree.ObjectTreeEditor(objectTree, data, editorOptions);
			
			} else if( $n2.couchEdit.Constants.SLIDE_EDITOR === editorDesc ) {
				// Accordion Header for slide editor
				if( accordionNeeded ) {
					var $slideHeader = $('<h3>')
						.appendTo($editorsContainer);
					$('<a>')
						.attr('href','#')
						.text( _loc('Editor View') )
						.appendTo($slideHeader);
				};
	
				// Content for slide editor
				var $slideContainer = $('<div>')
					.addClass('n2CouchEditor_slide')
					.appendTo($editorsContainer);
				var slideEditorOptions = {
					onObjectChanged: function() {
						_this._adjustInternalValues(_this.editedDocument);
						if( _this.treeEditor ) {
							_this.treeEditor.refresh();
						};
						if( _this.schemaEditor ) {
							_this.schemaEditor.refresh();
						};
						_this._refreshRelations(data);
						_this._onEditorObjectChanged(data);
					}
					,isKeyEditingAllowed: isKeyEditingAllowed
					,isValueEditingAllowed: isValueEditingAllowed
					,isKeyDeletionAllowed: isKeyDeletionAllowed
				};
				this.slideEditor = new $n2.slideEditor.Editor($slideContainer, data, slideEditorOptions);
			};
		};
		
		if( accordionNeeded ) {
			$editorsContainer.accordion({ collapsible: true });
		};
		
		// Report relations
		if( relationEditorNeeded ) {
			var $displayRelationsDiv = $('<div class="editorDisplayRelations"></div>');
			$editorsContainer.append( $displayRelationsDiv );
			this._refreshRelations(data);
		};
	}

	,_selectSchema: function(callbackFn) {
		var _this = this;

		// Check hint from document
		if( this.editedDocument.nunaliit_schema ) {
			this.schemaRepository.getSchema({
				name: this.editedDocument.nunaliit_schema
				,onSuccess: function(schema){
					callbackFn(schema);
				}
				,onError: function(err){
					$n2.log('Error fetching schema: '+_this.editedDocument.nunaliit_schema,err);
					callbackFn(null);
				}
			});
			
		} else if( this.schema && this.isInsert ) {
			if( $n2.couchEdit.Constants.ALL_SCHEMAS === this.schema ) {
				// Must select a schema from all root schemas
				this.schemaRepository.getRootSchemas({
					onSuccess: function(schemas){
						selectFromSchemas(schemas);
					}
					,onError: function(err){
						$n2.log('Error fetching root schemas',err);
						callbackFn(null);
					}
				});
				
			} else if( $n2.isArray(this.schema) ) {
				// Must select a schema
				selectFromSchemas(this.schema);
				
			} else {
				// Only one schema to select from
				callbackFn(this.schema);
			};
			
		} else if( this.defaultEditSchema && !this.isInsert ) {
			// If the object does not specify a schema, use default schema
			// if specified
			callbackFn(this.defaultEditSchema);
			
		} else {
			// No schema specified, go directly to displaying editor
			callbackFn(null);
		};
		
		function selectFromSchemas(schemas) {
			// shortcuts
			if( schemas.length < 1 ) {
				callbackFn(null);
				return;
				
			} else if( schemas.length == 1 ) {
				callbackFn(schemas[0]);
				return;
			};
			
			var dialogId = $n2.getUniqueId();
			var selectId = $n2.getUniqueId();
			var $dialog = $('<div id="'+dialogId+'" class="editorSelectSchemaDialog">'
					+'<label for="'+selectId+'">'+_loc('Select a schema:')+'</label>'
					+'<select id="'+selectId+'"></select>'
					+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
					+'</div>');
			
			var $select = $dialog.find('select');
			for(var i=0,e=schemas.length; i<e; ++i) {
				$select.append( $('<option>'+schemas[i].name+'</option>') );
			}
			
			var cancelOnClose = true;
			
			$dialog.find('button')
				.first()
					.button({icons:{primary:'ui-icon-check'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						var $select = $dialog.find('select');
						var schemaName = $select.val();

						$n2.log('schemaName',schemaName);
						_this.schemaRepository.getSchema({
							name: schemaName
							,onSuccess: function(schema){
								callbackFn(schema);
							}
							,onError: function(err){
								reportError('Unable to get selected schema: '+err);
								_this._cancelEdit();
							}
						});
				
						cancelOnClose = false;
						$dialog.dialog('close');
						return false;
					})
				.next()
					.button({icons:{primary:'ui-icon-cancel'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						$dialog.dialog('close');
						return false;
					})
				;
			
			var dialogOptions = {
				autoOpen: true
				,title: _loc('Select Document Schema')
				,modal: true
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
					
					if( cancelOnClose ){
						_this._cancelEdit();
					};
				}
			};
			$dialog.dialog(dialogOptions);
		};
	}

	,_dispatch: function(m){
		if( this.dispatchService ){
			this.dispatchService.send(DH,m);
		};
	}

	,_synchronousCall: function(m){
		if( this.dispatchService ){
			this.dispatchService.send(DH,m);
		};
	}

	,_handle: function(m, address, dispatcher){
		// Check that we are still alive
		var $div = this._getDiv();
		if( $div.length < 1 ){
			// No longer in use, de-register from dispatcher
			dispatcher.deregister(address);
		};
		
		if( m.type === 'editGeometryModified' ){
			if( m._origin !== this ){
				this._geometryModified(m.docId, m.geom, m.proj);
			};
		} else if( m.type === 'mapGeometryAdded' ){
			this._addGeometry(m.geometry, m.projection);
		};
	}

	,_adjustInternalValues: function(obj) {
		// BBOX
		if( typeof(OpenLayers) !== 'undefined' ) {
			var geomData = obj.nunaliit_geom;
			if( geomData ) {
				// Check if editor has changed the geometry's WKT
				if( this.currentGeometryWkt != geomData.wkt ) {
					$n2.couchGeom.updatedGeometry(geomData);
				};
			};
		};
	}

	,_refreshRelations: function(data){
		var _this = this;
		var $div = this._getDiv();
		var $displayRelationsDiv = $div.find('.editorDisplayRelations');
		if( $displayRelationsDiv.length < 1 ) return;

    	var showService = this.showService;
    	if( !showService ) return;

    	// Compute relations
		var docIdMap = {};
		if( data 
		 && data.nunaliit_relations
		 && data.nunaliit_relations.length ){
			for(var i=0,e=data.nunaliit_relations.length; i<e; ++i){
				var ref = data.nunaliit_relations[i];
				if( ref.doc ) {
					docIdMap[ref.doc] = true;
				};
			};
		};
		if( data 
		 && data.nunaliit_source
		 && data.nunaliit_source.doc ){
			docIdMap[data.nunaliit_source.doc] = true;
		};
		
		// Remove displayed relations that are no longer valid
		$displayRelationsDiv.find('.editorDisplayRelation').each(function(){
			var $display = $(this);
			var relDocId = $display.attr('nunaliitRelationDocId');
			if( !docIdMap[relDocId] ){
				$display.remove();
			} else {
				// This relDocId is already displayed. Remove from map.
				delete docIdMap[relDocId];
			};
		});
		
		// Function to delete a relation
		var removeRelationFn = function(e){
			var $btn = $(this);
			var $removeRelationDiv = $btn.parents('.editorDisplayRelation');
			if( $removeRelationDiv.length > 0 ){
				var relDocId = $removeRelationDiv.attr('nunaliitRelationDocId');
				_this._removeRelation(relDocId);
				$removeRelationDiv.remove();
			};
			
			return false;
		};
		
		// Add missing relations. At this point, docIdMap contains
		// only missing relations
		for(var relDocId in docIdMap){
			var $displayRelationDiv = $('<div class="editorDisplayRelation"></div>');
			$displayRelationsDiv.append($displayRelationDiv);
			$displayRelationDiv.attr('nunaliitRelationDocId',relDocId);

			$('<span></span>')
				.text( _loc('Relation: '))
				.appendTo($displayRelationDiv);
			
			var $brief = $('<span></span>')
				.text(relDocId)
				.appendTo($displayRelationDiv);
			if( showService ){
				showService.printBriefDescription($brief, relDocId);
			};
			
			$('<button class="editorDisplayRelationButton"></button>')
				.text( _loc('Remove') )
				.appendTo($displayRelationDiv)
				.button({icons:{primary:'ui-icon-trash'}})
				.click(removeRelationFn)
				;
		};
	}
	
	,_onEditorObjectChanged: function(obj) {
		var geomData = obj.nunaliit_geom;
		
		if( !geomData ) return; // avoid errors
		if( typeof(OpenLayers) === 'undefined' ) return;
			
		// Check if editor has changed the geometry's WKT
		if( this.currentGeometryWkt !== geomData.wkt ) {
		
			this.currentGeometryWkt = geomData.wkt;

			var olGeom = $n2.couchGeom.getOpenLayersGeometry({couchGeom:geomData});
			
			this._dispatch({
				type: 'editGeometryModified'
				,docId: obj._id
				,geom: olGeom
				,proj: this.couchProj
				,_origin: this
			});
		};
	}

	,_geometryModified: function(docId, geom, proj) {

		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.options.couchProj);
		};
    	
		var geomData = this.editedDocument.nunaliit_geom;
		geomData.wkt = geom.toString();
		$n2.couchGeom.updatedGeometry(geomData);
		this.currentGeometryWkt = geomData.wkt;
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.slideEditor ) {
			this.slideEditor.refresh();
		};
    }
	
    ,_addGeometry: function(geom, proj) {
		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.couchProj);
		};
    	
		var geomData = this.editedDocument.nunaliit_geom;
		if( !geomData ){
			geomData = {
				nunaliit_type: 'geometry'
			};
			this.editedDocument.nunaliit_geom = geomData;
		};
		geomData.wkt = geom.toString();
		$n2.couchGeom.updatedGeometry(geomData);
		this.currentGeometryWkt = geomData.wkt;
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.slideEditor ) {
			this.slideEditor.refresh();
		};
    }
});

//++++++++++++++++++++++++++++++++++++++++++++++

var CouchDocumentEditor = $n2.Class({
	
	panelName: null,
	uploadService: null,
	searchService: null,
	showService: null,
	schemaEditorService: null,
	schemaRepository: null,
	customService: null,
	dispatchService: null,
	dialogService: null,
	initialLayers: null,
	schema: null,
	defaultEditSchema: null,
	documentSource: null,
	couchProj: null,
	onCancelFn: null,
	onCloseFn: null,
	enableAddFile: null,
	relatedDocProcess: null,
	schemaEditor: null,
	treeEditor: null,
	slideEditor: null,
	attachmentEditor: null,
	originalDocument: null,
	editedDocument: null,
	editedDocumentSchema: null,
	currentGeometryWkt: null,
	editorContainerId: null,
	isInsert: null,
	userButtons: null,
	editorSuppressSlideView: null,
	editorSuppressTreeView: null,
	editorSuppressFormView: null,
	onRefreshFunctions: null,
	
	initialize: function(
		opts_
		) {
		
		var opts = $n2.extend({
			panelName: null
			,uploadService: null
			,searchService: null
			,showService: null
			,schemaEditorService: null
			,schemaRepository: null
			,customService: null
			,dispatchService: null
			,dialogService: null
			,initialLayers: []
			,schema: null
			,defaultEditSchema: null
			,documentSource: null
			,couchProj: null
			,onCancelFn: function(doc){}
			,onCloseFn: function(){}
			,enableAddFile: false
			,relatedDocProcess: null
			
			// buttonX....
		}, opts_);
		
		var _this = this;
		
		this.panelName = opts.panelName;
		this.uploadService = opts.uploadService;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.schemaEditorService = opts.schemaEditorService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
		this.dispatchService = opts.dispatchService;
		this.dialogService = opts.dialogService;
		this.initialLayers = opts.initialLayers;
		this.schema = opts.schema;
		this.defaultEditSchema = opts.defaultEditSchema;
		this.documentSource = opts.documentSource;
		this.couchProj = opts.couchProj;
		this.onCancelFn = opts.onCancelFn;
		this.onCloseFn = opts.onCloseFn;
		this.enableAddFile = opts.enableAddFile;
		this.relatedDocProcess = opts.relatedDocProcess;
		
		this.userButtons = [];
		var label = 'button';
		for(var key in opts) {
			if( key.substr(0,label.length) === label ) {
				this.userButtons.push(opts[key]);
			};
		};

		this.editorSuppressSlideView = false;
		this.editorSuppressTreeView = false;
		this.editorSuppressFormView = false;
		this.onRefreshFunctions = [];
		var cs = this.customService;
		if( cs ){
			this.editorSuppressSlideView = cs.getOption('editorSuppressSlideView',false);
			this.editorSuppressTreeView = cs.getOption('editorSuppressTreeView',false);
			this.editorSuppressFormView = cs.getOption('editorSuppressFormView',false);
			
			var flag = cs.getOption('editorEnableAddFile',false);
			if( flag ){
				this.enableAddFile = true;
			};
			
			var onRefreshFunctions = cs.getOption('editorOnRefreshFunctions',[]);
			onRefreshFunctions.forEach(function(onRefresh){
				if( typeof onRefresh === 'function' ){
					_this.onRefreshFunctions.push(onRefresh);
				};
			});
		};
	},
	
	isEditing: function(){
		if( this.editedDocument ){
			return true;
		};
		return false;
	},

	startEditingFromGeometry: function(olGeom, olProj) {
		
		var _this = this;
	
		this.editedDocument = {};
		this.editedDocumentSchema = null;
	
		this.currentGeometryWkt = undefined;
		
		this.isInsert = true;

		this._selectSchema(schemaSelected);
		
		function schemaSelected() {
			// Create original object by augmenting current one with template
			if( _this.editedDocumentSchema ) {
				var template = _this.editedDocumentSchema.createObject({});
				$n2.extend(true, _this.editedDocument, template);
			};

			// Geometry
			if( olProj.getCode() != _this.couchProj.getCode() ) {
				// Need to convert
				var geom = olGeom.clone();
				geom.transform(olProj,_this.couchProj);
				olGeom = geom;
			};
	    	var g = $n2.couchGeom.getCouchGeometry(olGeom);
	    	_this.editedDocument.nunaliit_geom = g;
	    	_this.currentGeometryWkt = g.wkt;
			
			// Add default layers?
	    	if( _this.initialLayers 
	    	 && _this.initialLayers.length > 0 ) {
	    		_this.editedDocument.nunaliit_layers = _this.initialLayers;
	    	};

	    	// Give a chance to external processes to modify document
			_this.dispatchService.synchronousCall(DH,{
				type: 'preDocCreation'
				,doc: _this.editedDocument
			});
			
			_this._prepareDocument();
		};
	},

	startDocumentEditing: function(doc_) {

		var _this = this;
		
		this.editedDocument = {};
		this.editedDocumentSchema = null;
		var clonedDoc = $n2.extend(true,{},doc_); // deep copy
		for(var key in clonedDoc){
			if( '__n2Source' === key ) {
				// Drop information about document source so it does not
				// appear in the editor
			} else {
				this.editedDocument[key] = clonedDoc[key];
			};
		};

		// Obtain documentSource
		this.editedDocumentSource = undefined;
		if( this.dispatchService ){
			var m = {
				type: 'documentSourceFromDocument'
				,doc: doc_
			};
			this.dispatchService.synchronousCall(DH,m);
			this.editedDocumentSource = m.documentSource;
		};
	
		this.currentGeometryWkt = undefined;
		if( this.editedDocument 
		 && this.editedDocument.nunaliit_geom ) {
			this.currentGeometryWkt = this.editedDocument.nunaliit_geom.wkt;
		};
		
		this.isInsert = (typeof(this.editedDocument._rev) === 'undefined' || this.editedDocument._rev === null);

		this._selectSchema(schemaSelected);
		
		function schemaSelected() {
			if( _this.isInsert ) {
				// Create original object by augmenting current one with template
				if( _this.editedDocumentSchema ) {
					var template = _this.editedDocumentSchema.createObject({});
					$n2.extend(true, template, _this.editedDocument);
					_this.editedDocument = template;
				};
				
				// Give a chance to external processes to modify document
				_this.dispatchService.synchronousCall(DH,{
					type: 'preDocCreation'
					,doc: _this.editedDocument
				});
			};
			
			_this._prepareDocument();
		};
	},

	_prepareDocument: function() {

		var _this = this;

		// Retrieve original geometry
		var editedDoc = _this.editedDocument;
		var nunaliit_geom = editedDoc.nunaliit_geom;
		
		if( nunaliit_geom 
		 && nunaliit_geom.simplified
		 && nunaliit_geom.simplified.original ) {
			// Must reload original geometry
			var attName = nunaliit_geom.simplified.original;
			
			// Check that attachment is available
			if( editedDoc._attachments 
			 && editedDoc._attachments[attName]
			 && this.editedDocumentSource ){
				var url = this.editedDocumentSource.getDocumentAttachmentUrl(editedDoc, attName);
				$.ajax({
					url: url
					,type: 'get'
					,async: true
					,dataType: 'text'
					,success: function(wkt) {
						$n2.couchGeom.updateDocumentWithWktGeometry({
				    		doc: editedDoc
				    		,wkt: wkt
				    	});
						startEditor();
					}
					,error: function(XMLHttpRequest, textStatus, errorThrown) {
						$n2.log('Unable to retrieve original geometry',editedDoc);
						startEditor();
					}
				});
				
			} else {
				startEditor();
			};
		} else {
			startEditor();
		};
		
		function startEditor(){
			_this.originalDocument = $n2.extend(true,{},editedDoc);
			
			var olGeom = $n2.couchGeom.getOpenLayersGeometry({
				doc: editedDoc
			});

			_this._dispatch({
				type: 'editReportOriginalDocument'
				,docId: editedDoc._id
				,doc: editedDoc
				,geometry: olGeom
				,projection: _this.couchProj
				,_origin: _this
			});
			
			_this._displayEditor();
		};
	},
	
	_selectSchema: function(callbackFn) {
		var _this = this;

		this.editedDocumentSchema = null;
		
		// Check hint from document
		if( this.editedDocument.nunaliit_schema ) {
			this.schemaRepository.getSchema({
				name: this.editedDocument.nunaliit_schema
				,onSuccess: function(schema){
					_this.editedDocumentSchema = schema;
					callbackFn(schema);
				}
				,onError: function(err){
					$n2.log('Error fetching schema: '+_this.editedDocument.nunaliit_schema,err);
					callbackFn(null);
				}
			});
			
		} else if( this.schema && this.isInsert ) {
			if( $n2.couchEdit.Constants.ALL_SCHEMAS === this.schema ) {
				// Must select a schema from all root schemas
				this.dialogService.selectSchema({
					onSelected: function(schema){
						_this.editedDocumentSchema = schema;
						callbackFn(schema);
					}
					,onReset: function(){
						_this._cancelEdit();
					}
				});
				
			} else if( $n2.isArray(this.schema) ) {
				// Must select a schema
				this.dialogService.selectSchema({
					schemas: this.schema
					,onSelected: function(schema){
						_this.editedDocumentSchema = schema;
						callbackFn(schema);
					}
					,onReset: function(){
						_this._cancelEdit();
					}
				});
				
			} else {
				// Only one schema to select from
				this.editedDocumentSchema = this.schema;
				callbackFn(this.schema);
			};
			
		} else if( this.defaultEditSchema && !this.isInsert ) {
			// If the object does not specify a schema, use default schema
			// if specified
			this.editedDocumentSchema = this.defaultEditSchema;
			callbackFn(this.defaultEditSchema);
			
		} else {
			// No schema specified, go directly to displaying editor
			callbackFn(null);
		};
	},
    
    _displayEditor: function() {
    	var _this = this;
    	
    	var selectedSchema = this.editedDocumentSchema;
		
		$('body').addClass('nunaliit_editing');
		$('.n2_disable_on_edit')
			.attr('disabled','disabled');
    	
    	var data = this.editedDocument;
		
    	// Give an opportunity to adjust document before edit
    	this._synchronousCall({
    		type: 'editorStartDocumentEdit'
    		,doc: data
    	});
    	
		// Update feature data with user info
		$n2.couchDocument.adjustDocument(data);

		// Compute which views to show
		var showFormView = false;
		var showTreeView = false;
		var showSlideView = false;
		var viewCount = 0;
		var showAccordion = false;
		var schemaEditorService = this.schemaEditorService;
		if( !this.editorSuppressFormView 
		 && selectedSchema 
		 && schemaEditorService ){
			showFormView = true;
			++viewCount;
		};
		if( !this.editorSuppressTreeView ){
			showTreeView = true;
			++viewCount;
		};
		if( !this.editorSuppressTreeView ){
			showSlideView = true;
			++viewCount;
		};
		if( viewCount > 1 ){
			showAccordion = true;
		};
    	
		var attributeDialog = $('#'+this.panelName);
		attributeDialog.empty();
		
		this.editorContainerId = $n2.getUniqueId();
		var $editorContainer = $('<div id="'+this.editorContainerId+'" class="n2CouchEditor_container"></div>');
		attributeDialog.append($editorContainer);

		if( showFormView ) {
			if( showAccordion ) {
				var $schemaHeader = $('<h3>').appendTo($editorContainer);
				$('<a>')
					.attr('href','#')
					.text( _loc('Form View') )
					.appendTo($schemaHeader);
			};

			var $schemaContainer = $('<div>')
				.addClass('n2CouchEditor_schema')
				.appendTo($editorContainer);
			
			this.schemaEditor = schemaEditorService.editDocument({
				doc: data
				,schema: selectedSchema
				,$div: $schemaContainer
				,onChanged: function(){
					_this._adjustInternalValues(_this.editedDocument);
					if( _this.treeEditor ) {
						_this.treeEditor.refresh();
					};
					if( _this.slideEditor ) {
						_this.slideEditor.refresh();
					};
					if( _this.attachmentEditor ) {
						_this.attachmentEditor.refresh();
					};
					_this._refreshRelations(data);
					_this.onEditorObjectChanged(data);
				}
			});
		};

		if( showTreeView ) {
			if( showAccordion ) {
				var $treeHeader = $('<h3>').appendTo($editorContainer);
				$('<a>')
					.attr('href','#')
					.text( _loc('Tree View') )
					.appendTo($treeHeader);
			};
			
			var $treeContainer = $('<div>')
				.addClass('n2CouchEditor_tree')
				.appendTo($editorContainer);
			var editorOptions = {
				onObjectChanged: function() {
					_this._adjustInternalValues(_this.editedDocument);
					if( _this.slideEditor ) {
						_this.slideEditor.refresh();
					};
					if( _this.schemaEditor ) {
						_this.schemaEditor.refresh();
					};
					if( _this.attachmentEditor ) {
						_this.attachmentEditor.refresh();
					};
					_this._refreshRelations(data);
					_this.onEditorObjectChanged(data);
				}
				,isKeyEditingAllowed: isKeyEditingAllowed
				,isValueEditingAllowed: isValueEditingAllowed
				,isKeyDeletionAllowed: isKeyDeletionAllowed
			};
			var objectTree = new $n2.tree.ObjectTree($treeContainer, data, editorOptions);
			this.treeEditor = new $n2.tree.ObjectTreeEditor(objectTree, data, editorOptions);
		};
		
		if( showSlideView ) {
			if( showAccordion ) {
				var $slideHeader = $('<h3>').appendTo($editorContainer);
				$('<a>')
					.attr('href','#')
					.text( _loc('Editor View') )
					.appendTo($slideHeader);
			};
			
			var $slideContainer = $('<div>')
				.addClass('n2CouchEditor_slide')
				.appendTo($editorContainer);
			var slideEditorOptions = {
				onObjectChanged: function() {
					_this._adjustInternalValues(_this.editedDocument);
					if( _this.treeEditor ) {
						_this.treeEditor.refresh();
					};
					if( _this.schemaEditor ) {
						_this.schemaEditor.refresh();
					};
					if( _this.attachmentEditor ) {
						_this.attachmentEditor.refresh();
					};
					_this._refreshRelations(data);
					_this.onEditorObjectChanged(data);
				}
				,isKeyEditingAllowed: isKeyEditingAllowed
				,isValueEditingAllowed: isValueEditingAllowed
				,isKeyDeletionAllowed: isKeyDeletionAllowed
			};
			this.slideEditor = new $n2.slideEditor.Editor($slideContainer, data, slideEditorOptions);
		};
		
		if( showAccordion ) {
			$editorContainer.accordion({ collapsible: true });
		};
		
		// Report relations
		$('<div>')
			.addClass('editorDisplayRelations')
			.appendTo($editorContainer);
		this._refreshRelations(data);
		
		// Attachment editor
		{
			var disableAttachmentEditorButtons = ! this.enableAddFile;
			var $attachmentsDiv = $('<div>')
				.addClass('editorAttachments')
				.appendTo($editorContainer);
			this.attachmentEditor = new AttachmentEditor({
				doc: data
				,elem: $attachmentsDiv
				,documentSource: this.documentSource
				,uploadService: this.uploadService
				,disableAddFile: disableAttachmentEditorButtons
				,disableRemoveFile: disableAttachmentEditorButtons
				,onChangedFn: function(){
					_this._adjustInternalValues(_this.editedDocument);
					if( _this.schemaEditor ) {
						_this.schemaEditor.refresh();
					};
					if( _this.treeEditor ) {
						_this.treeEditor.refresh();
					};
					if( _this.slideEditor ) {
						_this.slideEditor.refresh();
					};
					_this._refreshRelations(data);
					_this.onEditorObjectChanged(data);
				}
			});
		};

		var formButtons = $('<div class="editorButtons"></div>');
		$editorContainer.append(formButtons);

		var saveBtn = $('<button class="save">'+_loc('Save')+'</button>');
		formButtons.append(saveBtn);
		saveBtn.button({icons:{primary:'ui-icon-check'}});
		saveBtn.click(function(){
			_this._save();
			return false;
		});

		if( !this.isInsert
		 && $n2.couchMap.canDeleteDoc(data)
			) {
			var deleteBtn = $('<button class="delete">'+_loc('Delete')+'</button>');
			formButtons.append(deleteBtn);
			deleteBtn.button({icons:{primary:'ui-icon-trash'}});
			deleteBtn.click(function(evt){
		  		if( confirm( _loc('Do you really want to delete this feature?') ) ) {
    				deletion(data);
		  		};
		  		return false;
			});
		};
		
		if( this.attachmentEditor ){
			this.attachmentEditor.printButtons({
				elem: formButtons
			});
		};

		var addRelationBtn = $('<button class="relation">'+_loc('Add Relation')+'</button>');
		formButtons.append(addRelationBtn);
		addRelationBtn.button({icons:{primary:'ui-icon-plusthick'}});
		addRelationBtn.click(function(){ _this._addRelationDialog(); return false; });

		var layersBtn = $('<button class="layers">'+_loc('Layers')+'</button>');
		formButtons.append(layersBtn);
		layersBtn.button({icons:{primary:'ui-icon-link'}});
		layersBtn.click(function(){ _this._manageLayersDialog(); return false; });

		var cancelBtn = $('<button class="cancel">'+_loc('Cancel')+'</button>');
		formButtons.append(cancelBtn);
		cancelBtn.button({icons:{primary:'ui-icon-cancel'}});
		cancelBtn.click(function(){ 
			_this._cancelEdit();
			return false;
		});
		
		// Add user buttons
		for(var i=0,e=this.userButtons.length; i<e; ++i) {
			var userButton = this.userButtons[i];
			
			var $uBtn = $('<button>'+_loc(''+userButton.label)+'</button>');
			if( userButton.buttonClass ) {
				$uBtn.addClass(userButton.buttonClass);
			};
			if( userButton.before ) {
				var $anchor = formButtons.find('button.'+userButton.before);
				$anchor.before($uBtn);
			} else if( userButton.after ) {
				var $anchor = formButtons.find('button.'+userButton.after);
				$anchor.after($uBtn);
			} else {
				formButtons.append($uBtn);
			};
			$uBtn.button(userButton.options);
			installUserButtonClick($uBtn, userButton);
		};
		
		// First time to call refresh
		var $editorContainer = _this._getEditorContainer();
		_this.onRefreshFunctions.forEach(function(refreshFunction){
			refreshFunction(_this.editedDocument, $editorContainer, _this);
		});
    	
    	function deletion(editedDocument) {
			_this.documentSource.deleteDocument({
				doc: _this.editedDocument
				,onSuccess: function() {
					_this._discardEditor({deleted:true});
				}
				,onError: function(err){
		    		_this._enableControls();
					$n2.reportErrorForced('Unable to delete document: '+err);
				}
			});
    	};
    	
		function installUserButtonClick($uBtn, userButton){
			$uBtn.click(function(){
				if( userButton.click ){
					return userButton.click(_this.editedDocument, _this, userButton);
				};
				return false;
			});
		};
	},
    
    _save: function(){
    	
    	var _this = this;
    	
		// Disable use of editor during uploading
		this._disableControls();
		
		// Verify that upload server is available
		if( this.uploadService ){
			// Verify that server is available
    		this.uploadService.getWelcome({
				onSuccess: function(){ 
					preSaveAttachmentEditor(); 
				}
				,onError: function(err) {
		    		_this._enableControls();
					$n2.reportErrorForced('Server is not available: '+err);
				}
			});
		} else {
			preSaveAttachmentEditor();
		};
		
		function preSaveAttachmentEditor() {
			if( _this.attachmentEditor ){
				_this.attachmentEditor.performPreSavingActions({
					onSuccess: function(doc){
						removeCompulsoryAttachmentFlag();
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced(err);
					}
				});
			} else {
				removeCompulsoryAttachmentFlag();
			};
		};
		
		function removeCompulsoryAttachmentFlag(){
			if( _this.editedDocument 
			 && _this.editedDocument.nunaliit_attachments ){
				
				if( typeof _this.editedDocument.nunaliit_attachments._compulsory !== 'undefined' ){
					delete _this.editedDocument.nunaliit_attachments._compulsory;
				};
				
				if( _this.editedDocument.nunaliit_attachments.files ){
					for(var attName in _this.editedDocument.nunaliit_attachments.files){
						var att = _this.editedDocument.nunaliit_attachments.files[attName];
						if( typeof att._compulsory !== 'undefined' ){
							delete att._compulsory;
						};
					};
				};
			};
			
			updateDocument();
		};
			
		function updateDocument() {
			var isSubmissionDs = false;
			if( _this.documentSource.isSubmissionDataSource ){
				isSubmissionDs = true;
			};

			// Create or update document
			if( _this.isInsert ) {
				// This is an insert
				_this.documentSource.createDocument({
					doc: _this.editedDocument
					,onSuccess: function(updatedDoc) {
						postSaveAttachmentEditor(updatedDoc, true, isSubmissionDs);
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced( _loc('Unable to submit document: {err}',{err:err}) );
					}
				});
			} else {
				// This is an update
				_this.documentSource.updateDocument({
					doc: _this.editedDocument
					,originalDoc: _this.originalDocument
					,onSuccess: function(updatedDoc) {
						postSaveAttachmentEditor(updatedDoc, false, isSubmissionDs);
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced( _loc('Unable to submit document: {err}',{err:err}) );
					}
				});
			};
		};
		
		function postSaveAttachmentEditor(editedDocument, inserted, isSubmissionDs) {
			if( _this.attachmentEditor ){
				_this.attachmentEditor.performPostSavingActions({
					onSuccess: function(doc){
						completeSave(editedDocument, inserted, isSubmissionDs);
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced(err);
					}
				});
			} else {
				completeSave(editedDocument, inserted, isSubmissionDs);
			};
		};

		function completeSave(editedDocument, inserted, isSubmissionDs) {
			// Report that save is complete
			var discardOpts = {
				saved: true
				,submissionDs: isSubmissionDs
			};
			if( inserted ) {
				discardOpts.inserted = true;
			} else {
				discardOpts.updated = true;
			};
			_this._discardEditor(discardOpts);
    	};
    },
	
	_addRelationDialog: function() {
		var _this = this;

		if( this.dialogService ){
			this.dialogService.searchForDocumentId({
				onSelected: function(docId){
					_this._addRelation(docId);
				}
			});
		};
	},
    
    _addRelation: function(relDocId){
    	var data = this.editedDocument;

    	if( data 
    	 && data.nunaliit_source 
    	 && data.nunaliit_source.doc === relDocId ){
    		return;
    	};

    	if( data 
    	 && data.nunaliit_relations 
    	 && data.nunaliit_relations.length ){
    		for(var i=0,e=data.nunaliit_relations.length; i<e; ++i){
    			var rel = data.nunaliit_relations[i];
    			if( rel.doc === relDocId ){
    				return;
    			};
    		};
    	};
    	
    	if( data ){
    		if( !data.nunaliit_relations ){
    			data.nunaliit_relations = [];
    		};
    		
    		data.nunaliit_relations.push({
    			nunaliit_type: 'reference'
    			,doc: relDocId
    		});
    		
    		this.refresh();
    	};
    },
    
    _removeRelation: function(relDocId){
    	var data = this.editedDocument;
    	var refreshRequired = false;
    	
    	if( data 
    	 && data.nunaliit_source 
    	 && data.nunaliit_source.doc === relDocId ){
    		delete data.nunaliit_source;
    		refreshRequired = true;
    	};

    	if( data 
    	 && data.nunaliit_relations 
    	 && data.nunaliit_relations.length ){
    		var relRemoved = false;
    		var newRels = [];
    		for(var i=0,e=data.nunaliit_relations.length; i<e; ++i){
    			var rel = data.nunaliit_relations[i];
    			if( rel.doc === relDocId ){
    				relRemoved = true;
    			} else {
    				newRels.push(rel);
    			};
    		};
    		
    		if( newRels.length < 1 ){
        		delete data.nunaliit_relations;
        		refreshRequired = true;
    		} else if( relRemoved ){
    			data.nunaliit_relations = newRels;
        		refreshRequired = true;
    		};
    	};
    	
    	if( refreshRequired ){
    		this.refresh();
    	};
    },
    
    _manageLayersDialog: function(){
    	var _this = this;
    	var data = this.editedDocument;
    	var layers = data.nunaliit_layers;
    	if( !layers ){
    		layers = [];
    	};
    	if( this.dialogService ){
    		this.dialogService.selectLayersDialog({
        		currentLayers: layers
    			,onSelected: function(selectedLayers){
    	    		if( selectedLayers.length < 1 ){
    	    			if( data.nunaliit_layers ){
    	    				delete data.nunaliit_layers;
    	    			};
    	    		} else {
    	    			data.nunaliit_layers = selectedLayers;
    	    		};
    	    		_this.refresh();
    			}
    		});
    	};
    },
    
    _removeAttachment: function(attNameToRemove){
    	var data = this.editedDocument;
    	
    	// Accumulate all the keys that must be removed
    	var keys = {};
    	if( data 
    	 && data.nunaliit_attachments 
    	 && data.nunaliit_attachments.files ){
    		for(var attName in data.nunaliit_attachments.files){
    			var att = data.nunaliit_attachments.files[attName];
    			if( attName === attNameToRemove ){
    				keys[attName] = true;
    			} else if( att.source === attNameToRemove ){
    				// Remove associated thumbnail and original
    				keys[attName] = true;
    			};
    		};
    	};
    	
    	// Delete necessary keys
    	var refreshRequired = false;
    	var attName = null;
    	for(attName in keys){
    		if( data._attachments && data._attachments[attName] ){
    			delete data._attachments[attName];
    			refreshRequired = true;
    		};
    		if( data.nunaliit_attachments.files[attName] ){
    			delete data.nunaliit_attachments.files[attName];
    			refreshRequired = true;
    		};
    	};
    	
    	// Remove _attachments if empty
    	if( data._attachments ){
    		var empty = true;
    		for(attName in data._attachments){
    			empty = false;
    		};
    		if( empty ){
    			delete data._attachments;
    			refreshRequired = true;
    		};
    	};
    	
    	// Remove nunaliit_attachments if empty
    	if( data.nunaliit_attachments ){
    		var empty = true;
    		if( data.nunaliit_attachments.files ) {
	    		for(attName in data.nunaliit_attachments.files){
	    			empty = false;
	    		};
    		};
    		if( empty ){
    			delete data.nunaliit_attachments;
    			refreshRequired = true;
    		};
    	};
    	
    	if( refreshRequired ){
    		this.refresh();
    	};
    },
    
    _cancelEdit: function(){
		this._dispatch({
			type: 'editCancel'
			,doc: this.editedDocument
		});
    },

	// Restores feature geometry before discarding the form
	performCancellation: function(opts_) {
		var opts = $n2.extend({
			suppressEvents:false
		},opts_);
		if( null == this.editedDocument ) {
			return;
		};
	
		this.onCancelFn(this.editedDocument);

		this._discardEditor({
			cancelled:true
			,suppressEvents: opts.suppressEvents
		});
	},
	
	performSave: function(opts_) {
		var opts = $n2.extend({
		},opts_);

		if( null == this.editedDocument ) {
			return;
		};
	
		this._save();
	},

	_discardEditor: function(opts_) {
		var opts = $n2.extend({
			saved: false
			,inserted: false
			,updated: false
			,submissionDs: false
			,deleted: false
			,cancelled: false
			,suppressEvents: false
		},opts_);
		
		if( null == this.editedDocument ) {
			return;
		};
		
		var originalDocument = this.originalDocument;
		var editedDocument = this.editedDocument;
		this.editedDocument = null;
		
		var $editorContainer = this._getEditorContainer();
		$editorContainer.remove();

		this.onCloseFn(editedDocument, this, {
			saved: opts.saved
			,inserted: opts.inserted
			,updated: opts.updated
			,deleted: opts.deleted
			,cancelled: opts.cancelled
		});
		
		if( !opts.suppressEvents ) {
			var doc = undefined;
			var docId = undefined;
			if( opts.cancelled ) {
				// If cancelled, send original document
				if( originalDocument && originalDocument._id ){
					// Send a document only if it already existed
					doc = originalDocument;
					docId = doc._id;
				};
			} else if( opts.saved && editedDocument && editedDocument._id ) {
				// If saved, send edited document
				doc = editedDocument;
				docId = doc._id;
			};
			
			this._dispatch({
				type: 'editClosed'
				,docId: docId
				,doc: doc
				,saved: opts.saved
				,inserted: opts.inserted
				,updated: opts.updated
				,deleted: opts.deleted
				,cancelled: opts.cancelled
				,submissionDs: opts.submissionDs
			});
		};
		
		this.editorContainerId = null;
		
		$('body').removeClass('nunaliit_editing');
		$('.n2_disable_on_edit')
			.removeAttr('disabled');
	},
	
	refresh: function() {
		this._adjustInternalValues(this.editedDocument);
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.slideEditor ) {
			this.slideEditor.refresh();
		};
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
		this._refreshRelations(this.editedDocument);
		this.onEditorObjectChanged(this.editedDocument);
	},
	
	_adjustInternalValues: function(obj) {
		// BBOX
		if( typeof(OpenLayers) !== 'undefined' ) {
			var geomData = obj.nunaliit_geom;
			if( geomData ) {
				// Check if editor has changed the geometry's WKT
				if( this.currentGeometryWkt != geomData.wkt ) {
					$n2.couchGeom.updatedGeometry(geomData);
				};
			};
		};
	},
	
	_refreshRelations: function(data){
		var _this = this;
		var $editorContainer = this._getEditorContainer();
		var $displayRelationsDiv = $editorContainer.find('.editorDisplayRelations');
		if( $displayRelationsDiv.length < 1 ) return;

    	var showService = this.showService;

    	// Compute relations
		var docIdMap = {};
		if( data 
		 && data.nunaliit_relations
		 && data.nunaliit_relations.length ){
			for(var i=0,e=data.nunaliit_relations.length; i<e; ++i){
				var ref = data.nunaliit_relations[i];
				if( ref.doc ) {
					docIdMap[ref.doc] = true;
				};
			};
		};
		if( data 
		 && data.nunaliit_source
		 && data.nunaliit_source.doc ){
			docIdMap[data.nunaliit_source.doc] = true;
		};
		
		// Remove displayed relations that are no longer valid
		$displayRelationsDiv.find('.editorDisplayRelation').each(function(){
			var $display = $(this);
			var relDocId = $display.attr('nunaliitRelationDocId');
			if( !docIdMap[relDocId] ){
				$display.remove();
			} else {
				// This relDocId is already displayed. Remove from map.
				delete docIdMap[relDocId];
			};
		});
		
		// Function to delete a relation
		var removeRelationFn = function(e){
			var $btn = $(this);
			var $removeRelationDiv = $btn.parents('.editorDisplayRelation');
			if( $removeRelationDiv.length > 0 ){
				var relDocId = $removeRelationDiv.attr('nunaliitRelationDocId');
				_this._removeRelation(relDocId);
				$removeRelationDiv.remove();
			};
			
			return false;
		};
		
		// Add missing relations. At this point, docIdMap contains
		// only missing relations
		for(var relDocId in docIdMap){
			var $displayRelationDiv = $('<div class="editorDisplayRelation"></div>');
			$displayRelationsDiv.append($displayRelationDiv);
			$displayRelationDiv.attr('nunaliitRelationDocId',relDocId);

			$('<span></span>')
				.text( _loc('Relation: '))
				.appendTo($displayRelationDiv);
			
			var $brief = $('<span></span>')
				.text(relDocId)
				.appendTo($displayRelationDiv);
			if( showService ){
				showService.printBriefDescription($brief, relDocId);
			};
			
			$('<button class="editorDisplayRelationButton"></button>')
				.text( _loc('Remove') )
				.appendTo($displayRelationDiv)
				.button({icons:{primary:'ui-icon-trash'}})
				.click(removeRelationFn)
				;
		};
	},
	
	onEditorObjectChanged: function(obj) {
		var _this = this;
		
		var wkt = undefined;
		if( obj 
		 && obj.nunaliit_geom ){
			wkt = obj.nunaliit_geom.wkt;
		};
			
		// Check if editor has changed the geometry's WKT
		if( typeof OpenLayers  !== 'undefined' 
		 && this.currentGeometryWkt !== wkt ) {
		
			this.currentGeometryWkt = wkt;

			var olGeom = null;
			if( wkt ){
				olGeom = $n2.couchGeom.getOpenLayersGeometry({wkt:wkt});
			};
			
			this._dispatch({
				type: 'editGeometryModified'
				,docId: obj._id
				,geom: olGeom
				,proj: this.couchProj
				,_origin: this
			});
		};
		
		var $editorContainer = this._getEditorContainer();
		this.onRefreshFunctions.forEach(function(refreshFunction){
			refreshFunction(_this.editedDocument, $editorContainer, _this);
		});
	},
	
    _geometryModified: function(docId, geom, proj) {

		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.couchProj);
		};
    	
		var geomData = this.editedDocument.nunaliit_geom;
		geomData.wkt = geom.toString();
		$n2.couchGeom.updatedGeometry(geomData);
		this.currentGeometryWkt = geomData.wkt;
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.slideEditor ) {
			this.slideEditor.refresh();
		};
    },
	
    _addGeometry: function(geom, proj) {
		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.couchProj);
		};
    	
		var geomData = this.editedDocument.nunaliit_geom;
		if( !geomData ){
			geomData = {
				nunaliit_type: 'geometry'
			};
			this.editedDocument.nunaliit_geom = geomData;
		};
		geomData.wkt = geom.toString();
		$n2.couchGeom.updatedGeometry(geomData);
		this.currentGeometryWkt = geomData.wkt;
		if( this.schemaEditor ) {
			this.schemaEditor.refresh();
		};
		if( this.treeEditor ) {
			this.treeEditor.refresh();
		};
		if( this.slideEditor ) {
			this.slideEditor.refresh();
		};
    },
	
	_getEditorContainer: function() {
		var $editorContainer = $('#'+this.editorContainerId);
		return $editorContainer;
	},
	
	_disableControls: function() {
		var $editorContainer = this._getEditorContainer();
		$editorContainer.find('button').attr('disabled','disabled');
		$editorContainer.find('input:text').attr('disabled','disabled');
		
		// Do not disable text fields from upload forms, since it does not send
		// the information
		$editorContainer.find('.editorAttachFile').find('input:text').removeAttr('disabled');
	},
	
	_enableControls: function() {
		var $editorContainer = this._getEditorContainer();
		$editorContainer.find('button').removeAttr('disabled');
		$editorContainer.find('input:text').removeAttr('disabled');
	},
	
	_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ){
			dispatcher.send(DH,m);
		};
	},
	
	_synchronousCall: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ){
			dispatcher.synchronousCall(DH,m);
		};
	},
	
	_handle: function(m){
		if( m.type === 'editGeometryModified' ){
			if( m._origin !== this ){
				this._geometryModified(m.docId, m.geom, m.proj);
			};
			
		} else if( m.type === 'mapGeometryAdded' ){
			this._addGeometry(m.geometry, m.projection);

		} else if( 'historyIsHashChangePermitted' === m.type ) {
			if( null != this.editedDocument ) {
				if( confirm( _loc('Do you wish to leave document editor?') ) ) {
					// OK, cancel editor
					this._cancelEdit();
					
				} else {
					// Do not allow change in hash
					m.permitted = false;
				};
			};
		};
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

var CouchEditService = $n2.Class({

	options: null,
	
	documentSource: null,
	
	panelName: null,
	
	couchProj: null,
	
	schema: null,
	
	defaultEditSchema: null,
	
	schemaRepository: null,
	
	uploadService: null,
	
	showService: null,
	
	authService: null,
	
	dispatchService: null,
	
	searchService: null,
	
	schemaEditorService: null,
	
	customService: null,
	
	dialogService: null,
	
	enableAddFile: null,
	
	initialLayers: null,
	
	userButtons: null,
	
	relatedDocProcess: null,

	isFormEditor: null,

	currentEditor: null,

	initialize: function(opts_) {
		var opts = $n2.extend({
			documentSource: null // must be provided
			,panelName: null // location where editor is opened
			,couchProj: null
			,schema: null
			,defaultEditSchema: null
			,schemaRepository: null
			,uploadService: null
			,showService: null
			,authService: null
			,dispatchService: null
			,searchService: null
			,schemaEditorService: null
			,customService: null
			,dialogService: null
			,createDocProcess: null
			,enableAddFile: false
			,initialLayers: []
		},opts_);
		
		var _this = this;
		
		this.options = {};
		this.documentSource = opts.documentSource;
		this.panelName = opts.panelName;
		this.couchProj = opts.couchProj;
		this.options.schema = opts.schema;
		this.defaultEditSchema = opts.defaultEditSchema;
		this.enableAddFile = opts.enableAddFile;
		this.initialLayers = opts.initialLayers;
		this.schemaRepository = opts.schemaRepository;
		this.uploadService = opts.uploadService;
		this.showService = opts.showService;
		this.authService = opts.authService;
		this.dispatchService = opts.dispatchService;
		this.searchService = opts.searchService;
		this.schemaEditorService = opts.schemaEditorService;
		this.customService = opts.customService;
		this.dialogService = opts.dialogService;
		this.isFormEditor = true;
		this.relatedDocProcess = opts.createDocProcess;
		
		if( !this.couchProj ) {
			this.couchProj = getDefaultCouchProjection();
		};
		
		var dispatcher = this.dispatchService;
		if( dispatcher ){
			var f = function(m){ _this._handle(m); };
			dispatcher.register(DH, 'editInitiate', f);
			dispatcher.register(DH, 'editCreateFromGeometry', f);
			dispatcher.register(DH, 'editCancel', f);
			dispatcher.register(DH, 'editTriggerSave', f);
			dispatcher.register(DH, 'editGetState', f);
			dispatcher.register(DH, 'selected', f);

			// The following events will be routed to the current editor
			dispatcher.register(DH, 'editGeometryModified', f);
			dispatcher.register(DH, 'mapGeometryAdded', f);
			dispatcher.register(DH, 'historyIsHashChangePermitted', f);
		};
		
		// Service defined buttons
		this.userButtons = {};
		var label = 'button';
		for(var key in opts) {
			if( key.substr(0,label.length) === label ) {
				this.userButtons[key] = opts[key];
			};
		};
	},

    showDocumentForm: function(document_, editorOptions_) {
    	if( null != this.currentEditor ) {
    		this.currentEditor.performCancellation();
    		this.currentEditor = null;
    	};
    	
    	this.currentEditor = this._createEditor(editorOptions_);
    	this.currentEditor.startDocumentEditing(
    		document_
    		);
	},
    
    _createEditor: function(o_){
    	
    	o_ = o_ ? o_ : {};
    	
    	var opts = {
			panelName: o_.panelName ? o_.panelName : this.panelName
			,initialLayers: o_.initialLayers ? o_.initialLayers : this.initialLayers
			,enableAddFile: o_.enableAddFile ? o_.enableAddFile : this.enableAddFile
			,schema: o_.schema ? o_.schema : this.options.schema
			,onCancelFn: o_.onCancelFn
			,onCloseFn: o_.onCloseFn
			,uploadService: this.uploadService
			,searchService: this.searchService
			,showService: this.showService
			,schemaEditorService: this.schemaEditorService
			,schemaRepository: this.schemaRepository
			,customService: this.customService
			,dispatchService: this.dispatchService
			,dialogService: this.dialogService
			,defaultEditSchema: this.defaultEditSchema
			,documentSource: this.documentSource
			,couchProj: this.couchProj
			,relatedDocProcess: this.relatedDocProcess
			
			// buttonX....
    	};
    	
    	// Add service buttons
    	for(var key in this.userButtons){
    		opts[key] = this.userButtons[key];
    	};

    	// Add caller buttons
		var label = 'button';
		for(var key in o_) {
			if( key.substr(0,label.length) === label ) {
				opts[key] = o_[key];
			};
		};
    	
    	var editor = new CouchDocumentEditor(opts);
    	
    	return editor;
    },

	cancelDocumentForm: function(opts) {
    	if( null != this.currentEditor ) {
    		this.currentEditor.performCancellation(opts);
    		this.currentEditor = null;
    	};
	},
	
	saveDocumentForm: function(opts){
    	if( null != this.currentEditor ) {
    		this.currentEditor.performSave(opts);
    		this.currentEditor = null;
    	};
	},

	setPanelName: function(panelName) {
		this.panelName = panelName;
	},
	
	setSchemas: function(schemas){
		this.options.schema = schemas;
	},

	getInitialLayerIds: function() {
		return this.initialLayers;
	},

	setInitialLayerIds: function(layerIds) {
		this.initialLayers = layerIds;
	},
	
	_initiateEditor: function(doc){
		var _this = this;
		
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this._initiateEditor(doc);
				}
			});
			return;
		};
		
		this.showDocumentForm(doc);
	},
	
	_createFromGeometry: function(olGeom, olProj){
		var _this = this;
		
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this._createFromGeometry(olGeom, olProj);
				}
			});
			return;
		};
		
    	if( null != this.currentEditor ) {
    		this.currentEditor.performCancellation();
    		this.currentEditor = null;
    	};
    	
    	this.currentEditor = this._createEditor();
    	this.currentEditor.startEditingFromGeometry(olGeom, olProj);
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'editInitiate' === m.type ){
			this._initiateEditor(m.doc);
			
		} else if( 'editCreateFromGeometry' === m.type ) {
			this._createFromGeometry(m.geometry, m.projection);
			
		} else if( 'editCancel' === m.type ) {
			this.cancelDocumentForm();

		} else if( 'editTriggerSave' === m.type ) {
			this.saveDocumentForm();

		} else if( 'editGetState' === m.type ) {
			// Synchronous event
			if( this.currentEditor 
			 && this.currentEditor.isEditing() ){
				m.isEditing = true;
			};

		} else if( 'selected' === m.type ) {
			if( null != this.currentEditor ){
				this.cancelDocumentForm();

				// Re-send the selection event
				this.dispatchService.send(DH,m);
			};
			
		} else if( this.currentEditor
		 && this.currentEditor.isEditing() ) {
    		this.currentEditor._handle(m);
    	};
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++
// Create an editor based on a schema. This
// performs only the portion that deals with the
// schema.

var SchemaEditor = $n2.Class({

	doc: null,
	
	schema: null,
	
	$div: null,
	
	onChanged: null,
	
	formEditor: null,
	
	postProcessFns: null,

	showService: null,

	initialize: function(opts_) {
		var opts = $n2.extend({
			doc: null
			,schema: null
			,$div: null
			,onChanged: function(){}
			,funcMap: null
			,postProcessFns: null
			,showService: null
		},opts_);
		
		var _this = this;
		
		this.doc = opts.doc;
		
		this.schema = opts.schema;
		this.$div = opts.$div;
		this.onChanged = opts.onChanged;
		this.postProcessFns = opts.postProcessFns;
		this.showService = opts.showService;
		
		this.formEditor = this.schema.form(
			this.doc
			,this.$div
			,{} // context
			,function(){ // callback on changes
				var showService = _this.showService;
				if( showService ){
					showService.fixElementAndChildren(_this.$div, {}, _this.doc);
				};
				
				_this.onChanged();
			}
			,opts.funcMap
		);
		
		var showService = this.showService;
		if( showService ){
			showService.fixElementAndChildren(this.$div, {}, this.doc);
		};
		
		this._performPostProcess();
	},

	refresh: function(){
		this.formEditor.refresh();
		
		var showService = this.showService;
		if( showService ){
			showService.fixElementAndChildren(this.$div, {}, this.doc);
		};
		
		this._performPostProcess();
	},

	_performPostProcess: function(){
		
		for(var i=0,e=this.postProcessFns.length; i<e; ++i){
			var fn = this.postProcessFns[i];
			if( typeof(fn) === 'function' ){
				fn(this.doc, this.$div);
			};
		};
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++
// Schema editing service. This should be used to set
// attributes that all schema editors should have in
// common.
var _defaultOnChanged = function(){};

var SchemaEditorService = $n2.Class({

	documentSource: null,
	
	showService: null,

	searchService: null,
	
	dispatchService: null,

	dialogService: null,
	
	funcMap: null,
	
	postProcessFunctions: null,

	initialize: function(opts_) {
		var opts = $n2.extend({
			postProcessFn: null
			,documentSource: null
			,showService: null
			,searchService: null
			,dispatchService: null
			,dialogService: null
		},opts_);
	
		var _this = this;
		
		this.postProcessFunctions = [];
		this.documentSource = opts.documentSource;
		this.showService = opts.showService;
		this.searchService = opts.searchService;
		this.dispatchService = opts.dispatchService;
		this.dialogService = opts.dialogService;
		
		this.funcMap = {};
		if( this.dialogService ){
			this.funcMap = this.dialogService.getFunctionMap();
		};
		
		if( opts.postProcessFn ){
			this.postProcessFunctions.push( opts.postProcessFn );
		};
	},

	editDocument: function(opts_){
		var opts = $n2.extend({
			doc: null // document
			,schema: null // schema that should be used for editing document
			,$div: null // location where editor should be
			,onChanged: _defaultOnChanged
		},opts_);
		
		var editor = new SchemaEditor({
			doc: opts.doc
			,schema: opts.schema
			,$div: opts.$div
			,onChanged: opts.onChanged
			,funcMap: this.funcMap
			,postProcessFns: this.postProcessFunctions
			,showService: this.showService
		});
		
		return editor;
	},
	
	addPostProcessFunction: function(fn){
		if( typeof(fn) === 'function' ){
			this.postProcessFunctions.push(fn);
		};
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

var AttachmentEditor = $n2.Class({
	
	doc: null,
	
	elemId: null,
	
	documentSource: null,
	
	uploadService: null,
	
	onChangedFn: null,
	
	creationAttachmentNames: null,
	
	compulsoryAttachmentNames: null,

	disableAddFile: null,
	
	disableRemoveFile: null,

	recordingButton: null,

	recordingStatus: null,

	recorder: null,

  recordingStream: null,

	recordingInterval: null,

	currentRecordingType: null,

  maxAudioRecordingLengthSeconds: null,

	maxVideoRecordingLengthSeconds: null,

	recordVideoSize: null,

	mediaElementEl: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			doc: null
			,elem: null
			,documentSource: null
			,uploadService: null
			,onChangedFn: function(){}
			,disableAddFile: false
			,disableRemoveFile: false
		},opts_);
		
		this.doc = opts.doc;
		this.documentSource = opts.documentSource;
		this.uploadService = opts.uploadService;
		this.onChangedFn = opts.onChangedFn;
		this.disableAddFile = opts.disableAddFile;
		this.disableRemoveFile = opts.disableRemoveFile;
		
		this.creationAttachmentNames = [];
		this.compulsoryAttachmentNames = [];

    this.maxAudioRecordingLengthSeconds = 300;
		this.maxVideoRecordingLengthSeconds = 300;
		this.recordVideoSize = {width: 640, height: 480};
		
		var $elem = $(opts.elem);
		$elem.addClass('attachmentEditor');

		this.elemId = $n2.utils.getElementIdentifier( $elem );

		//load configuration
		if( this.doc
			&& !this.doc._rev) {
			if(typeof this.doc._maxAudioRecordingLengthSeconds !== 'undefined') {
				this.maxAudioRecordingLengthSeconds = this.doc._maxAudioRecordingLengthSeconds;
				delete this.doc._maxAudioRecordingLengthSeconds;
			}
			if(typeof this.doc._maxVideoRecordingLengthSeconds !== 'undefined') {
				this.maxVideoRecordingLengthSeconds = this.doc._maxVideoRecordingLengthSeconds;
				delete this.doc._maxVideoRecordingLengthSeconds;
			}
			if(typeof this.doc._recordVideoSize !== 'undefined') {
				var videoSizeParts = this.doc._recordVideoSize.split('x');
				this.recordVideoSize = {width: videoSizeParts[0], height: videoSizeParts[1]};
				delete this.doc._recordVideoSize;
			}
		}

		// When a document is first created, if attachments are already present,
		// this is because they were created from schema.
		var compulsory = true;
		if( this.doc
		 && !this.doc._rev
		 && this.doc.nunaliit_attachments ){
			if( typeof this.doc.nunaliit_attachments._compulsory !== 'undefined' ){
				compulsory = this.doc.nunaliit_attachments._compulsory;
			};

			if( this.doc.nunaliit_attachments.files ){
				for(var attName in this.doc.nunaliit_attachments.files){
					var att = this.doc.nunaliit_attachments.files[attName];
					
					var attCompulsory = compulsory;
					if( typeof att._compulsory !== 'undefined' ){
						attCompulsory = att._compulsory;
					};
					
					this.creationAttachmentNames.push(attName);
					if( attCompulsory ){
						this.compulsoryAttachmentNames.push(attName);
					};
					
					att.attachmentName = attName;
					att.status = "waiting for upload";
					if( !att.data ){
						att.data = {};
					};
				};
			};
		};
		
		this.refresh();
	},
	
	/*
	 * This is when the view must be recomputed because we suspect a change
	 * in the document
	 */
	refresh: function(){
		
		var $elem = this._getElem();
		if( $elem.length < 1 ) return;
		
		var _this = this;
		
		// Scan document for attachments
		var attachments = {};
		if( this.doc.nunaliit_attachments 
		 && this.doc.nunaliit_attachments.files ){
			for(var attName in this.doc.nunaliit_attachments.files){
				var att = this.doc.nunaliit_attachments.files[attName];
				attachments[attName] = att;
			};
		};
		
		// Remove attachments that are derived from others
		var discountAttNames = [];
		for(var attName in attachments){
			var att = attachments[attName];
			var sourceName = att.source;
			if( sourceName 
			 && attachments[sourceName] ){
				// Do not display if this is a derived attachment and
				// original is displayed
				discountAttNames.push(attName);
			};
		};
		for(var i=0,e=discountAttNames.length; i<e; ++i){
			var attName = discountAttNames[i];
			delete attachments[attName];
		};
		
		// Sort attachments by name
		var attNames = [];
		for(var attName in attachments){
			attNames.push(attName);
		};
		attNames.sort();
		
		// Remove deleted attachments
		$elem.find('.attachmentEditor_att').each(function(){
			var $div = $(this);
			var attName = $div.attr('n2AttName');
			if( !attName ){
				$div.remove();
			} else if( !attachments[attName] ){
				$div.remove();
			};
		});
		
		// Add new attachments
		for(var i=0,e=attNames.length; i<e; ++i){
			var attName = attNames[i];
			
			var className = 'attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName);
			var $div = $elem.find('.'+className);
			if( $div.length < 1 ) {
				var label = _loc('File');
				
				if( this.creationAttachmentNames.indexOf(attName) >= 0 ) {
					// This is an initial attachemnt
					this._addCreationAttachmentElement({
						attName: attName
						,label: label
					});
					
				} else if( !this.disableRemoveFile ){
					this._addFileElement({
						attName: attName
						,label: label
					});
				};
			};
		};
	},
	
	printButtons: function(opts_){
		var opts = $n2.extend({
			elem: null
			,classNames: null
		},opts_);
		
		var _this = this;
		
		if( this.disableAddFile ){
			return;
		};
		
		var $elem = $(opts.elem);

		var attachBtn = $('<button>')
			.text(_loc('Add File'))
			.appendTo($elem)
			.click(function(){
				_this._openAddFileDialog();
				return false;
			});
		
		if( opts.classNames ){
			attachBtn.addClass(opts.classNames);
		};

		attachBtn.button({icons:{primary:'ui-icon-plusthick'}});
	},
	
	performPreSavingActions: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var documentSource = this.documentSource;
		
		var $elem = this._getElem();

		// Verify that all compulsory files are provided
		var missingAttachment = null;
		for(var i=0,e=this.compulsoryAttachmentNames.length; i<e; ++i){
			var attName = this.compulsoryAttachmentNames[i];
			var $form = $elem.find('.attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName));
			var $file = $form.find('input[type="file"]');
			var fileName = $file.val();
			if(!fileName) {
				if(hasMediaPlayerFile($form)) {
					fileName = 'recordedFile';
				}
			}

			if( !fileName ){
				missingAttachment = attName;	
			};
		};
		if( missingAttachment ){
			opts.onError( _loc('A file must be selected or recorded') );
			return;
		};

		//Stop video capturing with close of the form
		if(typeof _this.recordingStream !== 'undefined' && _this.recordingStream != null) {
			_this.recordingStream.stop();
		}
		
		// Remove forms that do not have a file assigned
		for(var i=0,e=this.creationAttachmentNames.length; i<e; ++i){
			var attName = this.creationAttachmentNames[i];
			var $form = $elem.find('.attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName));
			var $file = $form.find('input[type="file"]');
			var fileName = $file.val();
			if(!fileName) {
				if(hasMediaPlayerFile($form)) {
					fileName = 'recordedFile';
				}
			}
			if( !fileName ){
				$form.remove();
				
				if( this.doc.nunaliit_attachments 
				 && this.doc.nunaliit_attachments.files
				 && this.doc.nunaliit_attachments.files[attName] ){
					delete this.doc.nunaliit_attachments.files[attName];
				};
			};
		};
		
		// Remove doc.nunaliit_attachments if empty
		if( this.doc.nunaliit_attachments ){
			var count = 0;
			if( this.doc.nunaliit_attachments.files ){
				for(var attName in this.doc.nunaliit_attachments.files){
					++count;
				};
			};
			
			if( count < 1 ){
				delete this.doc.nunaliit_attachments;
			};
		};
		
		// If nothing to load, no point in continuing
		var $forms = $elem.find('form');
		var formCount = $forms.length;
		if( formCount < 1 ){
			// Nothing to do
			opts.onSuccess();
			return;
		};
		
		// Obtain uuids for the forms
		var uuids = [];
		getUuids();
		
		function getUuids(){
			if( uuids.length >= formCount ){
				onUuids();
			} else {
				documentSource.getUniqueIdentifier({
					onSuccess: function(uuid){
						uuids.push(uuid);
						getUuids();
					}
					,onError: function(err){
						opts.onError( _loc('Unable to reach server: {err}',{err:err}) );
					}
				});
			};
		};
		
		function onUuids(){
			var doc = _this.doc;
			
			$forms.each(function(){
				var $form = $(this);
				var attName = $form.attr('n2AttName');
				var uuid = uuids.pop();
				
				var att = null;
				if( doc 
				 && doc.nunaliit_attachments 
				 && doc.nunaliit_attachments.files ){
					att = doc.nunaliit_attachments.files[attName];
				};
				
				if( att ){
					att.uploadId = uuid;
					
					if( doc._id ) {
						$('<input type="hidden">')
							.attr('name','id')
							.attr('value',doc._id)
							.prependTo($form);
					};
					
					if( doc._rev ) {
						$('<input type="hidden">')
							.attr('name','rev')
							.attr('value',doc._rev)
							.prependTo($form);
					};
					
					if( uuid ) {
						$('<input type="hidden">')
							.attr('name','uploadId')
							.attr('value',uuid)
							.prependTo($form);
					};
					
				} else {
					$form.remove();
				};
			});
			
			opts.onSuccess();
		};

		function hasMediaPlayerFile($form) {
			var audioFile = $form.find('audio');
			var videoFile = $form.find('video');
			var mediaPlayer = null;
			if(audioFile.length > 0) {
				mediaPlayer = audioFile[0];
			} else if(videoFile.length > 0) {
				mediaPlayer = videoFile[0];
			}
			if(mediaPlayer &&
				mediaPlayer.currentSrc !== null &&
				mediaPlayer.currentSrc !== '' &&
				mediaPlayer.srcObject === null) {
					return true;
			}
			return false;
		}
	},
	
	performPostSavingActions: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(doc){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		var $elem = this._getElem();
		
		var $forms = $elem.find('form');
		var formCount = $forms.length;
		if( formCount < 1 ){
			// Nothing to do
			opts.onSuccess();
			return;
		};
		
		// From this point on, the logic is to deal with the first form
		// and when done, continue on to the next one by calling recursively
		// this function.
		var $form = $forms.first();
		var attName = $form.attr('n2AttName');
		
		var uploadId = null;
		var att = null;
		if( this.doc
		 && this.doc.nunaliit_attachments
		 && this.doc.nunaliit_attachments.files 
		 && attName 
		 && this.doc.nunaliit_attachments.files[attName] ){
			att = this.doc.nunaliit_attachments.files[attName];
			uploadId = att.uploadId;
		};
		
		var $fileInput = $form.find('input[type="file"]');
		var filename = $fileInput.val();
		var mediaFile = null;
		//generate file data for mp3 file.
		if(!filename) {
			var audio = $form.find('audio');
			if(audio.length > 0) {
				audio = audio[0];
				mediaFile = mediaTagToFile(audio, 'audio/mp3', '.mp3');
				filename = 'audio.mp3';
			}
		}
		if(!filename) {
			var video = $form.find('video');
			if(video.length > 0) {
				video = video[0];
				if(video.currentSrc !== null && video.currentSrc !== '' && video.srcObject === null) {
					mediaFile = mediaTagToFile(video, 'video/webm', '.webm');
					filename = 'video.webm';
				}
			}
		}

		if( !filename || !att || !uploadId ){
			$form.remove();
			continueUpload();
			
		} else {
			// Upload file via the upload service.

			// Perform actual upload
			this.uploadService.submitForm({
				form: $form
				,uploadFile: mediaFile
				,suppressInformationDialog: true
				,onSuccess: function(){
					$form.remove();
					continueUpload();
				}
				,onError: function(err) {
					opts.onError( _loc('Unable to upload file. Cause: {err}',{err:err}) );
				}
			});
		};

		function continueUpload(){
			_this.performPostSavingActions(opts_);
		};

		function mediaTagToFile(element, mediaType, extension) {
			var blob = dataURLtoBlob(element.src, mediaType);
			//Check that File API Constructor is supported by this browser
			if(typeof File === 'function' && File.length >= 2) {
				filename = (Math.random() * new Date().getTime()).toString(36).replace( /\./g , '') + extension;
				return new File([blob], filename, { type: mediaType });
			} else {
				return new Blob([blob], {type: mediaType});
			}
		}

		function dataURLtoBlob(dataURL, mediaType) {
			//Based on https://github.com/bubkoo/dataurl-to-blob (MIT License)
			if (!window || window.window !== window) {
				throw new Error('This module is only available in browser');
			}

			var Blob = window.Blob || window.MozBlob || window.WebKitBlob;
			if (!Blob) {
				throw new Error('Blob was not supported');
			}

			var dataURLPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;

			// parse the dataURL components as per RFC 2397
			var matches = dataURL.match(dataURLPattern);
			if (!matches) {
				throw new Error('invalid dataURI');
			}

			// default to text/plain;charset=utf-8
			var isBase64   = !!matches[4];
			var dataString = dataURL.slice(matches[0].length);
			var byteString = isBase64
				// convert base64 to raw binary data held in a string
				? atob(dataString)
				// convert base64/URLEncoded data component to raw binary
				: decodeURIComponent(dataString);

			var array = [];
			for (var i = 0; i < byteString.length; i++) {
				array.push(byteString.charCodeAt(i));
			}

			return new Blob([new Uint8Array(array)], { type: mediaType });
		}
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_openAddFileDialog: function(){
		var _this = this;
		
		var $elem = this._getElem();
		if( $elem.length < 1 ) {
			return;
		};
		
		var dialogId = $n2.getUniqueId();
		var addFileFormId = $n2.getUniqueId();
		
		var $addFileDialog = $('<div>')
			.attr('id',dialogId)
			.addClass('attachmentEditor_dialog');

		var $content = $('<div>')
			.addClass('attachmentEditor_dialog_content')
			.appendTo($addFileDialog);

		var $addFileForm = $('<form>')
			.attr('id',addFileFormId)
			.addClass('attachmentEditor_form')
			.appendTo($content);
		
		$('<input type="file">')
			.attr('name','media')
			.appendTo($addFileForm);

		var $buttons = $('<div>')
			.addClass('attachmentEditor_dialog_buttons')
			.appendTo($addFileDialog);

		var $addBtn = $('<button>')
			.text( _loc('Attach') )
			.appendTo($buttons)
			.click(function(){
				var $addFileDialog = $('#'+dialogId);
				var $addFileForm = $('#'+addFileFormId);
				var $input = $addFileForm.find('input');
				var filename = $input.val();
				if( filename ) {
					_this._addFileForm($addFileForm);
					$addFileDialog.dialog('close');
				} else {
					alert( _loc('You must select a file') );
				};
				return false;
			});
		$addBtn.button({icons:{primary:'ui-icon-plusthick'}});

		var $cancelBtn = $('<button>')
			.text( _loc('Cancel') )
			.appendTo($buttons)
			.click(function(){
				var $addFileDialog = $('#'+dialogId);
				$addFileDialog.dialog('close');
				return false;
			});
		$cancelBtn.button({icons:{primary:'ui-icon-cancel'}});
		
		$addFileDialog.dialog({
			autoOpen: true
			,title: _loc('Add File')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		});
	},
	
	_addFileForm: function($addFileForm){
		
		if( !this.doc ){
			return;
		};
		if( !this.doc.nunaliit_attachments ){
			this.doc.nunaliit_attachments = {
				nunaliit_type: 'attachment_descriptions'
				,files: {}
			};
		};
		if( !this.doc.nunaliit_attachments.files ){
			this.doc.nunaliit_attachments.files = {};
		};
		
		// Compute a new attachment name
		var attName = 'media';
		if( this.doc.nunaliit_attachments.files[attName] ){
			var prefix = 'media_';
			var count = 0;
			while( this.doc.nunaliit_attachments.files[attName] ){
				++count;
				attName = prefix + count;
				
				if( count > 100 ){
					$n2.log('Unable to compute attachment name for new attachment');
					return;
				};
			};
		};

		// Update document
		this.doc.nunaliit_attachments.files[attName] = {
			attachmentName: attName
			,status: "waiting for upload"
			,data: {}
		};
		
		// Add form to the list of files
		$addFileForm.attr('n2AttName',attName);
		$addFileForm.addClass('attachmentEditor_form');
		this._addFileElement({
			attName: attName
			,label: _loc('New File')
			,form: $addFileForm
		});
		
		// Let editor know that document was changed
		this.onChangedFn();
	},
	
	_removeAttachment: function(attName){
		var docChanged = false;
		
		var derivedNames = [];
		if( this.doc 
		 && this.doc.nunaliit_attachments 
		 && this.doc.nunaliit_attachments.files ){
			
			if( this.doc.nunaliit_attachments.files[attName] ){
				delete this.doc.nunaliit_attachments.files[attName];
				docChanged = true;
			};
			
			// Delete derived attachments
			for(var otherName in this.doc.nunaliit_attachments.files){
				var att = this.doc.nunaliit_attachments.files[otherName];
				
				if( attName === att.source ){
					derivedNames.push(otherName);
				};
			};
			for(var i=0,e=derivedNames.length; i<e; ++i){
				var derivedName = derivedNames[i];
				delete this.doc.nunaliit_attachments.files[derivedName];
				docChanged = true;
			};
			
			var count = 0;
			for(otherName in this.doc.nunaliit_attachments.files){
				++count;
			};
			if( count < 1 ){
				delete this.doc.nunaliit_attachments;
			};
		};
		
		if( this.doc 
		 && this.doc._attachments ){
			if( this.doc._attachments[attName] ){
				delete this.doc._attachments[attName];
				docChanged = true;
			};

			for(var i=0,e=derivedNames.length; i<e; ++i){
				var derivedName = derivedNames[i];

				if( this.doc._attachments[derivedName] ){
					delete this.doc._attachments[derivedName];
					docChanged = true;
				};
			};
		};
		
		if( docChanged ){
			this.refresh();
			this.onChangedFn();
		};
	},
	
	_addCreationAttachmentElement: function(opts_){
		var opts = $n2.extend({
			attName: null
			,label: null
		},opts_);

		var _this = this;
		
		var $elem = this._getElem();
		var attName = opts.attName;
		var className = 'attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName);
		
		var $div = $('<div>')
			.addClass('attachmentEditor_att')
			.addClass(className)
			.attr('n2AttName',attName)
			.appendTo($elem);

		var $form = $('<form>')
			.addClass('attachmentEditor_creationForm')
			.attr('n2AttName',attName)
			.appendTo($div);

		//clearfix div to prevent buttons from floating
		$('<div>')
			.addClass('attachmentEditor_clearfix')
			.appendTo($div);
		
		var firstTabDisplayed = 'file';
	
    var $tabList = $('<div>')
			.addClass('attachmentEditor_uploadTabs')
			.appendTo($form);

		$('<button>')
			.text(_loc('File Upload'))
			.addClass('attachmentEditor_uploadTab_file')
			.appendTo($tabList)
			.click(function(event) {
				event.preventDefault();
				_this._clickTab(attName, 'file');
			});

		var $chooseFileDiv = $('<div>')
			.addClass('attachmentEditor_uploadTabContent attachmentEditor_uploadTabContent_file')
			.appendTo($form);

		$('<input type="file">')
			.attr('name','media')
      .change(function(event) {
        _this._attachmentFileChanged(event);
      })
			.appendTo($chooseFileDiv);

    //only display recording if libraries required are present and https
    var protocolSupportsRecording = false;
    if(document.location.protocol == 'https:'
      || window.location.hostname == 'localhost'
      || window.location.hostname.startsWith('127.0.')) {
      protocolSupportsRecording = true;
    }

    if(typeof DetectRTC !== 'undefined'
      && typeof RecordRTC !== 'undefined'
      && typeof lamejs !== 'undefined'
      && protocolSupportsRecording) {

      DetectRTC.load(function() {
        if(DetectRTC.hasMicrophone) {
          $('<button>')
            .text(_loc('Record Audio'))
            .addClass('attachmentEditor_uploadTab_audio')
            .click(function(event) {
        	  event.preventDefault();
              _this._clickTab(attName, 'audio');
            })
            .appendTo($tabList);
          
          //firstTabDisplayed = 'audio';

          var $recordDiv = $('<div>')
            .addClass('attachmentEditor_uploadTabContent attachmentEditor_uploadTabContent_audio')
            .appendTo($form);

           var recordInputDiv = $('<div>')
            .addClass('attachmentEditor_recordingContainer')
            .appendTo($recordDiv);

          _this.audioRecordingButton = $('<button>')
            .addClass('attachmentEditor_micButton')
            .appendTo(recordInputDiv)
            .click(function(event) {
              _this._clickRecording(event, 'audio');
            })[0];
          _this.audioRecordingButton = $(_this.audioRecordingButton);

          _this.audioRecordStatus = $('<div>')
            .addClass('attachmentEditor_recordStatus')
            .appendTo(recordInputDiv);

					if(DetectRTC.hasWebcam && !DetectRTC.browser.isEdge) {
					  $form.addClass('attachmentEditor_creationFormWithVideo');
            $('<button>')
              .text(_loc('Record Video'))
              .addClass('attachmentEditor_uploadTab_video')
              .click(function(event) {
          	    event.preventDefault();
                _this._clickTab(attName, 'video');
              })
              .appendTo($tabList);

            //firstTabDisplayed = 'video';
            
						var $recordVideoDiv = $('<div>')
							.addClass('attachmentEditor_uploadTabContent attachmentEditor_uploadTabContent_video')
							.appendTo($form);

						var recordInputVideoDiv = $('<div>')
							.addClass('attachmentEditor_videoRecordingContainer')
							.appendTo($recordVideoDiv);

						_this.videoRecordingButton = $('<button>')
							.addClass('attachmentEditor_videoButton')
							.appendTo(recordInputVideoDiv)
							.click(function(event) {
								_this._clickRecording(event, 'video');
							})[0];
						_this.videoRecordingButton = $(_this.videoRecordingButton);

						var meVideoEl = $('<div>').addClass('attachmentEditor_meVideo').appendTo(recordInputVideoDiv);

						_this.videoRecordStatus = $('<div>')
							.addClass('attachmentEditor_recordStatus')
							.appendTo(meVideoEl);
					} else {
						$n2.log('no webcam present');
					}
        } else {
          $n2.log('no microphone present');
        }
        
        allTabsDisplayed();
      });
    } else {
    	allTabsDisplayed();
	}
    
		function allTabsDisplayed() {
			_this._clickTab(attName, firstTabDisplayed);
		}
	},
	
	_addFileElement: function(opts_){
		var opts = $n2.extend({
			attName: null
			,label: null
			,form: null
		},opts_);

		var _this = this;
		
		var $elem = this._getElem();
		var attName = opts.attName;
		var className = 'attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName);
		
		var $div = $('<div>')
			.addClass('attachmentEditor_att')
			.addClass(className)
			.attr('n2AttName',attName)
			.appendTo($elem);
		
		$('<span>')
			.addClass('attachmentEditor_label')
			.text( opts.label )
			.appendTo($div);
	
		if( opts.form ) {
			var fileName = opts.form.find('input[type="file"]').val();
			if( fileName ){
				var index = fileName.lastIndexOf('/');
				if( index >= 0 ){
					fileName = fileName.substr(index+1);
				};
			};
			if( fileName ){
				var index = fileName.lastIndexOf('\\');
				if( index >= 0 ){
					fileName = fileName.substr(index+1);
				};
			};
			$('<span>')
				.addClass('attachmentEditor_attName')
				.text(fileName)
				.appendTo($div);
		} else {
			$('<span>')
				.addClass('attachmentEditor_attName')
				.text(attName)
				.appendTo($div);
		};
		
		$('<a>')
			.attr('href','#')
			.attr('n2AttName',attName)
			.addClass('attachmentEditor_delete')
			.text( _loc('Remove') )
			.appendTo($div)
			.click(function(){
				var $a = $(this);
				var attName = $a.attr('n2AttName');
				if( attName ) {
					_this._removeAttachment(attName);
				};
				return false;
			});
		
		if( opts.form ) {
			opts.form.appendTo($div);
		};
	},

  _attachmentFileChanged: function(event) {
	  var _this = this;
    if( typeof RecordRTC === 'undefined' && typeof lamejs === 'undefined') {
      return;
    }
  },

	_clickTab: function(attName, type) {
		var _this = this;
		
		var $elem = this._getElem();
		var $attachmentEditor = $elem.find('.attachmentEditor_att_' + $n2.utils.stringToHtmlId(attName));
		var $clickedTab = $attachmentEditor.find('.attachmentEditor_uploadTab_'+type);

		var contentClass = 'attachmentEditor_uploadTabContent_' + type;
		
		// Check if already selected
		var currentType = $attachmentEditor.attr('n2attType');
		if( type === currentType ){
			// Already selected
			return;
		};
		$attachmentEditor.attr('n2attType',type);
		
		$attachmentEditor.find('.attachmentEditor_uploadTabContent').hide();
		$attachmentEditor.find('.attachmentEditor_uploadTabs button').removeClass('active');
		if(_this.recordingInterval !== null) {
			_this._cancelRecording();
		}
		if(typeof _this.recordStatus !== 'undefined') {
			_this.recordStatus.text('');
		}
		var $recordingVideos = $attachmentEditor.find('.attachmentEditor_videoRecordingContainer video');
		if($recordingVideos.length > 0) {
			if(typeof _this.recordingStream !== 'undefined' && _this.recordingStream != null) {
				_this.recordingStream.stop();
			}
			$recordingVideos.remove();
			_this.mediaElementEl.remove();
			$attachmentEditor.find('.attachmentEditor_videoRecordingContainer .mejs__container')[0].remove();
		}
		var $recordingAudio = $attachmentEditor.find('.attachmentEditor_recordingContainer audio');
		if($recordingAudio.length > 0) {
			$recordingAudio.remove();
		}
		
		// Clear file upload
		$attachmentEditor.find('.attachmentEditor_uploadTabContent_file input').val('')
		
		$clickedTab.addClass('active');
		$attachmentEditor.find('.'+contentClass).show();
		if(type === 'audio' || type === 'video') {
			_this._setupRecording(type);
			_this.currentRecordingType = type;
		}
	},

	_clickRecording: function(event, recordType) {
	  event.preventDefault();
    var _this = this;

    if(_this.recordingInterval === null) {
			_this._startRecording(recordType);
		} else {
			_this._stopRecording(recordType);
		}
	},

  _setupRecording: function(recordType) {
    var _this = this;
    if(recordType === 'audio') {
      _this.recordStatus = _this.audioRecordStatus;
      _this.recordingButton = _this.audioRecordingButton;
    } else if(recordType === 'video') {
      _this.recordStatus = _this.videoRecordStatus;
      _this.recordingButton = _this.videoRecordingButton;
    }

    _this._captureUserMedia(recordType, function(stream) {
      _this.recordingStream = stream;
      if(recordType === 'audio') {
        _this.recorder = RecordRTC(stream, {
          type: 'audio',
          recorderType: StereoAudioRecorder,
          numberOfAudioChannels: 1
        });
      } else {
        _this._setupVideoPreview(stream);
				var mimeType = 'video/webm';
				if(_this._isMimeTypeSupported('video/webm;codecs=h264')) {
					mimeType = 'video/webm;codecs=h264'
				}
				_this.recorder = RecordRTC(stream, { mimeType: mimeType });
      }

      var oldAudio = $('.attachmentEditor_recordingContainer audio');
      if(oldAudio.length > 0) {
        oldAudio[0].remove();
      }
    });
  },

	_setupVideoPreview: function(stream) {
  	var _this = this;
		var recordingVideos = $('.attachmentEditor_videoRecordingContainer video');
		if(recordingVideos.length > 0) {
			_this.mediaElementEl.remove();
			delete recordingVideos[0];
			$('.attachmentEditor_videoRecordingContainer .mejs__container')[0].remove();
		}

		var mejsDiv = $('.attachmentEditor_meVideo');
		var height = 320/(_this.recordVideoSize.width/_this.recordVideoSize.height);

		var recordingVideo = ($('<video>')
			.attr('controls', 'controls')
			.attr('height', height + 'px')
			.attr('width', '320px')
			.prependTo(mejsDiv))[0];

		if($.fn && $.fn.mediaelementplayer) {
			_this.mediaElementEl = $(recordingVideo).mediaelementplayer({
				features: ['fullscreen']
			});

			$('.attachmentEditor_videoRecordingContainer .mejs__container .mejs__overlay-play .mejs__overlay-button').hide();
		}

		recordingVideo.muted = true;
		recordingVideo.controlls = false;
		recordingVideo.src = null;
		recordingVideo.srcObject = stream;
		recordingVideo.play();
	},

  _isMimeTypeSupported: function(mimeType) {
    if(DetectRTC.browser.name === 'Edge' || DetectRTC.browser.name === 'Safari' || typeof MediaRecorder === 'undefined') {
      return false;
    }

    if(typeof MediaRecorder.isTypeSupported !== 'function') {
      return true;
    }

    return MediaRecorder.isTypeSupported(mimeType);
  },

	_startRecording: function(recordType) {
		var _this = this;
		var obj = this.obj;
    _this.recordStatus.text('');
    _this.recorder.startRecording();

    if(recordType === 'audio') {
      _this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_micButton');
    } else {
      _this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_videoButton');
			var recordingVideos = $('.attachmentEditor_videoRecordingContainer video');
			if(recordingVideos[0].srcObject == null) {
				_this._setupVideoPreview(_this.recordingStream);
			}
    }
    _this._recordingTimer(recordType);
	},

	_recordingTimer: function(recordType) {
		var _this = this;
		var seconds_elapsed = 0;
		var max_time = recordType === 'audio' ? _this.maxAudioRecordingLengthSeconds : _this.maxVideoRecordingLengthSeconds;
    var max_time_str = _this._secondsToTimeString(max_time);

		_this.recordingInterval = setInterval(function() {
			seconds_elapsed++;

			if(seconds_elapsed >= max_time) {
				_this._stopRecording();
				return;
			}

			var cur_time_str = _this._secondsToTimeString(seconds_elapsed);
			_this.recordStatus.text(cur_time_str + '/' + max_time_str);
		}, 1000);
	},

  _secondsToTimeString: function(seconds) {
    var min = Math.floor(seconds/60);
    var sec = seconds - min * 60;
    if(sec < 10) {
      sec = '0' + sec;
    }
    return min + ':' + sec
  },

	_stopRecordingTimer: function() {
	  var _this = this;
		clearInterval(_this.recordingInterval);
		_this.recordingInterval = null;
	},

	_captureUserMedia: function(type, success_callback) {
		var _this = this;
		var session = {
			audio: true
		};
		if(type === 'video') {
			var videoHints = true;

			if (DetectRTC.browser.name === 'Firefox' || (DetectRTC.browser.name === 'Chrome' && DetectRTC.browser.version >= 60)) {
				videoHints = {
					width: _this.recordVideoSize.width,
					height: _this.recordVideoSize.height
				};
			} else {
			  videoHints = {
			    optional: [],
          mandatory: {
			      minWidth: _this.recordVideoSize.width,
            minHeight: _this.recordVideoSize.height
          }
        }
      }
			session.video = videoHints;
		}

		navigator.getUserMedia(session, success_callback, function(error) {
			alert(_loc('Unable to capture your microphone and/or camera.'));
			$n2.logError(error);
		});
	},

  _cancelRecording: function() {
    var _this = this;
    _this._stopRecordingTimer();
    _this.recorder.stopRecording();
    _this.recordingStream.stop();
		if(_this.currentRecordingType === 'video') {
			_this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_videoButton');
		} else if(_this.currentRecordingType === 'audio') {
			_this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_micButton');
		}
    _this.recordStatus.text('');
  },

	_stopRecording: function(recordType) {
		var _this = this;
		var obj = this.obj;

		_this._stopRecordingTimer();
		_this.recordingButton.prop('disabled', true);
		_this.recordStatus.text(_loc('Processing...'));

		_this.recorder.stopRecording(function() {
			var blobResult = _this.recorder.getBlob();

			if(recordType === 'audio') {
				_this._processAudioRecording(blobResult);
			} else {
				_this.recorder.getDataURL(function(dataURL) {
					_this._processVideoRecording(dataURL);
				});
			}
		});
	},

	_processAudioRecording: function(blob) {
		var _this = this;
		var fileReader = new FileReader();
		fileReader.onload = function() {
			var samples = _this._getWavSamples(this.result);
			var mp3Blob = _this._encodeMp3(samples);

      var reader = new FileReader();
      reader.onload = function(event) {
        var oldAudio = $('.attachmentEditor_recordingContainer audio');
        if(oldAudio.length > 0) {
          oldAudio[0].src = event.target.result;
        } else {
          $('<audio>')
            .attr('src', event.target.result)
            .attr('controls', 'controls')
            .insertAfter(_this.recordingButton);
        }

				_this.recordingButton.prop('disabled', false);
				_this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_micButton');

				_this.recordStatus.text(_loc('Captured Audio'));
			};
			reader.readAsDataURL(mp3Blob);
		};
		fileReader.readAsArrayBuffer(blob);
	},

	_processVideoRecording: function(dataURL) {
		var _this = this;
		var oldVideo = $('.attachmentEditor_videoRecordingContainer video');
		if(oldVideo.length > 0) {
			_this.mediaElementEl.remove();
			delete oldVideo[0];
			$('.attachmentEditor_videoRecordingContainer .mejs__container')[0].remove();
		}

		var mejsDiv = $('.attachmentEditor_meVideo');
		var height = 320/(_this.recordVideoSize.width/_this.recordVideoSize.height);
		var video = $('<video>')
			.attr('src', dataURL)
			.attr('height', height + 'px')
			.attr('width', '320px')
			.attr('controls', 'controls')
			.prependTo(mejsDiv);
		_this.mediaElementEl = $(video).mediaelementplayer({
			features: ['playpause', 'progress','volume','fullscreen']
		});

		_this.recordingButton.prop('disabled', false);
		_this.recordingButton.toggleClass('attachmentEditor_stopRecordingButton attachmentEditor_videoButton');

		_this.recordStatus.text(_loc('Captured Video'));
	},

	_getWavSamples: function(arrayBuffer) {
		var samples = new Int16Array(arrayBuffer);
		var wavHeader = lamejs.WavHeader.readHeader(new DataView(arrayBuffer));

		if (wavHeader.channels === 2) {
			var left = [];
			var right = [];
			var i = 0;

			while (i < samples.length) {
				left.push(samples[i]);
				right.push(samples[i + 1]);

				i += 2;
			}

			samples = new Int16Array(left);
		}
    //trim the first and last millisecond to remove click noise at start
    return samples.slice(45, samples.length - 45);

	},

	_encodeMp3: function(samples) {
		var channels = 1;
		var sampleRate = 44100;
		var kbps = 128;
		var mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
		var mp3Data = [];
		var sampleBlockSize = 1152; //can be anything but make it a multiple of 576 to make encoders life easier

		for (var i = 0; i < samples.length; i += sampleBlockSize) {
			var sampleChunk = samples.subarray(i, i + sampleBlockSize);
			var mp3buf = mp3encoder.encodeBuffer(sampleChunk);
			if (mp3buf.length > 0) {
				mp3Data.push(mp3buf);
			}
		}
		var mp3buf = mp3encoder.flush();   //finish writing mp3

		if (mp3buf.length > 0) {
			mp3Data.push(new Int8Array(mp3buf));
		}

		return new Blob(mp3Data, {type: 'audio/mp3'});
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

$n2.couchEdit = {
	EditService: CouchEditService
	,SchemaEditorService: SchemaEditorService
	,CouchSimpleDocumentEditor: CouchSimpleDocumentEditor
	,Constants: {
		ALL_SCHEMAS: {}
		,FORM_EDITOR: {}
		,TREE_EDITOR: {}
		,SLIDE_EDITOR: {}
		,RELATION_EDITOR: {}
	}
	,AttachmentEditor: AttachmentEditor
};

// Support legacy code
$n2.CouchEditor = {
	Constants: $n2.couchEdit.Constants 
};

})(jQuery,nunaliit2);
