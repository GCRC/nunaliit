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

$Id: n2.couchEdit.js 8458 2012-08-29 13:12:06Z jpfiset $
*/

;(function($,$n2) {

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchEdit';

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
	
	,geomName: null
	
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
			,geomName: 'nunaliit_geom'
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
		this.geomName = opts.geomName;
		this.couchProj = opts.couchProj;

		if( opts.doc.__n2Source ){
			this.editedDocument = {};
			for(var key in opts.doc){
				if( '__n2Source' === key ){
					this.editedDocumentSource = opts.doc[key];
				} else {
					this.editedDocument[key] = opts.doc[key];
				};
			};
		} else {
			this.editedDocument = opts.doc;
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
				$n2.CouchEditor.Constants.FORM_EDITOR
				,$n2.CouchEditor.Constants.TREE_EDITOR
				,$n2.CouchEditor.Constants.SLIDE_EDITOR
				,$n2.CouchEditor.Constants.RELATION_EDITOR
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
		
		this.isInsert = (typeof this.editedDocument._id === 'undefined' 
			|| this.editedDocument._id === null);
	
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
			if( $n2.CouchEditor.Constants.FORM_EDITOR === editorDesc ){
				if( selectedSchema && this.schemaEditorService ){
					++editorCount;
				};
			} else if( $n2.CouchEditor.Constants.TREE_EDITOR === editorDesc ){
				++editorCount;
			} else if( $n2.CouchEditor.Constants.SLIDE_EDITOR === editorDesc ){
				++editorCount;
			} else if( $n2.CouchEditor.Constants.RELATION_EDITOR === editorDesc ){
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
			
			if( $n2.CouchEditor.Constants.FORM_EDITOR === editorDesc
			 && selectedSchema 
			 && this.schemaEditorService ) {
				$n2.schema.GlobalAttributes.disableKeyUpEvents = true;
	
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
				
			} else if( $n2.CouchEditor.Constants.TREE_EDITOR === editorDesc ) {
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
			
			} else if( $n2.CouchEditor.Constants.SLIDE_EDITOR === editorDesc ) {
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
			if( $n2.CouchEditor.Constants.ALL_SCHEMAS === this.schema ) {
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
				this._featureModified(m.docId, m.geom, m.proj);
			};
		} else if( m.type === 'mapGeometryAdded' ){
			this._addGeometry(m.geom, m.proj);
		};
	}

	,_adjustInternalValues: function(obj) {
		// BBOX
		if( typeof(OpenLayers) !== 'undefined' ) {
			var geomData = obj[this.geomName];
			if( geomData ) {
				// Check if editor has changed the geometry's WKT
				if( this.currentGeometryWkt != geomData.wkt ) {
					$n2.couchGeom.adjustBboxOnCouchGeom(geomData);
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
		var geomData = obj[this.geomName];
		
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

	,_featureModified: function(docId, geom, proj) {

		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.options.couchProj);
		};
    	
		var geomData = this.editedDocument[this.geomName];
		geomData.wkt = geom.toString();
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
    	
		var geomData = this.editedDocument[this.geomName];
		if( !geomData ){
			geomData = {
				nunaliit_type: 'geometry'
			};
			this.editedDocument[this.geomName] = geomData;
		};
		geomData.wkt = geom.toString();
		$n2.couchGeom.adjustBboxOnCouchGeom(geomData);
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
	geomName: null,
	initialLayers: null,
	schema: null,
	defaultEditSchema: null,
	documentSource: null,
	couchProj: null,
	onFeatureInsertedFn: null,
	onFeatureUpdatedFn: null,
	onFeatureDeletedFn: null,
	onCancelFn: null,
	onCloseFn: null,
	enableAddFile: null,
	relatedDocProcess: null,
	schemaEditor: null,
	treeEditor: null,
	slideEditor: null,
	attachmentEditor: null,
	editedDocument: null,
	editedFeature: null,
	currentGeometryWkt: null,
	editorContainerId: null,
	isInsert: null,
	userButtons: null,
	editorSuppressSlideView: null,
	editorSuppressTreeView: null,
	editorSuppressFormView: null,
	
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
			,geomName: null
			,initialLayers: ['public']
			,schema: null
			,defaultEditSchema: null
			,documentSource: null
			,couchProj: null
			,onFeatureInsertedFn: function(fid,feature){}
			,onFeatureUpdatedFn: function(fid,feature){}
			,onFeatureDeletedFn: function(fid,feature){}
			,onCancelFn: function(feature){}
			,onCloseFn: function(){}
			,enableAddFile: false
			,relatedDocProcess: null
			
			// buttonX....
		}, opts_);
		
		this.panelName = opts.panelName;
		this.uploadService = opts.uploadService;
		this.searchService = opts.searchService;
		this.showService = opts.showService;
		this.schemaEditorService = opts.schemaEditorService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
		this.dispatchService = opts.dispatchService;
		this.dialogService = opts.dialogService;
		this.geomName = opts.geomName;
		this.initialLayers = opts.initialLayers;
		this.schema = opts.schema;
		this.defaultEditSchema = opts.defaultEditSchema;
		this.documentSource = opts.documentSource;
		this.couchProj = opts.couchProj;
		this.onFeatureInsertedFn = opts.onFeatureInsertedFn;
		this.onFeatureUpdatedFn = opts.onFeatureUpdatedFn;
		this.onFeatureDeletedFn = opts.onFeatureDeletedFn;
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
		var cs = this.customService;
		if( cs ){
			this.editorSuppressSlideView = cs.getOption('editorSuppressSlideView',false);
			this.editorSuppressTreeView = cs.getOption('editorSuppressTreeView',false);
			this.editorSuppressFormView = cs.getOption('editorSuppressFormView',false);
			
			var flag = cs.getOption('editorEnableAddFile',false);
			if( flag ){
				this.enableAddFile = true;
			};
		};
	}

	,startFeatureEditing: function(
		feature_
		) {
		
		var _this = this;
	
		this.editedFeature = feature_;
		this.editedDocument = {};
		for(var key in feature_.data){
			if( '__n2Source' === key ) {
				this.editedDocumentSource = feature_.data[key];
			} else {
				this.editedDocument[key] = feature_.data[key];
			};
		};
	
		this.currentGeometryWkt = undefined;
		if( this.editedDocument 
		 && this.editedDocument[this.geomName] ) {
			this.currentGeometryWkt = this.editedDocument[this.geomName].wkt;
		};
		
		this.isInsert = (typeof(this.editedFeature.fid) === 'undefined' || this.editedFeature.fid === null);
		
		if( this.isInsert ) {
			// must do initial object work
	    	var geom = this.convertFeatureGeometryForDb(this.editedFeature);
	    	var g = $n2.couchGeom.getCouchGeometry(geom);
	    	this.editedDocument[this.geomName] = g;
			
			// Add default layers?
	    	if( this.initialLayers 
	    	 && this.initialLayers.length > 0 ) {
	    		this.editedDocument.nunaliit_layers = this.initialLayers;
	    	};
		};

		this._selectSchema(schemaSelected);
		
		function schemaSelected(schema) {
			if( _this.isInsert ) {
				// Create original object by augmenting current one with template
				if( schema ) {
					var template = schema.createObject({});
					$n2.extend(true, _this.editedDocument, template);
				};

				// must do initial object work
		    	var geom = _this.convertFeatureGeometryForDb(_this.editedFeature);
		    	var g = $n2.couchGeom.getCouchGeometry(geom);
		    	_this.editedDocument[_this.geomName] = g;
				
				// Add default layers?
		    	if( _this.initialLayers 
		    	 && _this.initialLayers.length > 0 ) {
		    		_this.editedDocument.nunaliit_layers = _this.initialLayers;
		    	};
			};
			
			_this._displayEditor(schema);
		};
	}

	,startDocumentEditing: function(
		doc_
		) {

		var _this = this;
		
		this.editedDocument = {};
		for(var key in doc_){
			if( '__n2Source' === key ) {
				this.editedDocumentSource = doc_[key];
			} else {
				this.editedDocument[key] = doc_[key];
			};
		};
	
		this.currentGeometryWkt = undefined;
		if( this.editedDocument 
		 && this.editedDocument[this.geomName] ) {
			this.currentGeometryWkt = this.editedDocument[this.geomName].wkt;
		};
		
		this.isInsert = (typeof(this.editedDocument._id) === 'undefined' || this.editedDocument._id === null);
	
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
			if( $n2.CouchEditor.Constants.ALL_SCHEMAS === this.schema ) {
				// Must select a schema from all root schemas
				this.dialogService.selectSchema({
					onSelected: callbackFn
				});
				
			} else if( $n2.isArray(this.schema) ) {
				// Must select a schema
				this.dialogService.selectSchema({
					schemas: this.schema
					,onSelected: callbackFn
				});
				
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
			};
			
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
    
    ,_displayEditor: function(selectedSchema) {
    	var _this = this;
		
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
			$n2.schema.GlobalAttributes.disableKeyUpEvents = true;
			
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
		
    	
    	function deletion(editedDocument) {
			_this.documentSource.deleteDocument({
				doc: _this.editedDocument
				,onSuccess: function() {
					_this.onFeatureDeletedFn(editedDocument._id,_this.editedFeature);
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
	}
    
    ,_save: function(){
    	
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
			// Create or update document
			if( _this.isInsert ) {
				// This is an insert
				var isSubmissionDs = false;
				if( _this.documentSource.isSubmissionDataSource ){
					isSubmissionDs = true;
				};
				_this.documentSource.createDocument({
					doc: _this.editedDocument
					,onSuccess: function(updatedDoc) {
						if( isSubmissionDs ){
							// In the case of a submission database, the new document
							// is not yet inserted
							postSaveAttachmentEditor(updatedDoc, false);
						} else {
							postSaveAttachmentEditor(updatedDoc, true);
						};
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
					,onSuccess: function(updatedDoc) {
						postSaveAttachmentEditor(updatedDoc, false);
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced( _loc('Unable to submit document: {err}',{err:err}) );
					}
				});
			};
		};
		
		function postSaveAttachmentEditor(editedDocument, inserted) {
			if( _this.attachmentEditor ){
				_this.attachmentEditor.performPostSavingActions({
					onSuccess: function(doc){
						completeSave(editedDocument, inserted);
					}
					,onError: function(err){
			    		_this._enableControls();
						$n2.reportErrorForced(err);
					}
				});
			} else {
				completeSave(editedDocument, inserted);
			};
		};

		function completeSave(editedDocument, inserted) {
			// Report that save is complete
			var discardOpts = {
				saved: true
			};
			if( inserted ) {
				_this.onFeatureInsertedFn(editedDocument._id,_this.editedFeature);
				discardOpts.inserted = true;
			} else {
				_this.onFeatureUpdatedFn(editedDocument._id,_this.editedFeature);
				discardOpts.updated = true;
			};
			_this._discardEditor(discardOpts);
    	};
    }
	
	,_addRelationDialog: function() {
		var _this = this;

		if( this.dialogService ){
			this.dialogService.searchForDocumentId({
				onSelected: function(docId){
					_this._addRelation(docId);
				}
			});
		};
	}
    
    ,_addRelation: function(relDocId){
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
    }
    
    ,_removeRelation: function(relDocId){
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
    }
    
    ,_manageLayersDialog: function(){
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
    }
    
    ,_removeAttachment: function(attNameToRemove){
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
    }
    
    ,_cancelEdit: function(){
		this._dispatch({
			type: 'editCancel'
			,doc: this.editedDocument
		});
    }

	// Restores feature geometry before discarding the form
	,performCancellation: function(opts_) {
		var opts = $n2.extend({
			suppressEvents:false
		},opts_);
		if( null == this.editedDocument ) {
			return;
		};
	
		this.onCancelFn(this.editedFeature);

		this._discardEditor({
			cancelled:true
			,suppressEvents: opts.suppressEvents
		});
	}

	,_discardEditor: function(opts_) {
		var opts = $n2.extend({
			saved: false
			,inserted: false
			,updated: false
			,deleted: false
			,cancelled: false
			,suppressEvents: false
		},opts_);
		
		if( null == this.editedDocument ) {
			return;
		};

		var $editorContainer = this._getEditorContainer();
		$editorContainer.remove();

		this.onCloseFn(this.editedDocument, this);
		
		if( !opts.suppressEvents ) {
			// Send document only if it was saved or already
			// existed.
			var docId = null;
			var doc = null;
			if( this.editedDocument._id ){
				doc = this.editedDocument;
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
			});
		};
		
		this.editedDocument = null;
		this.editedFeature = null;
		this.editorContainerId = null;
		
		$('body').removeClass('nunaliit_editing');
		$('.n2_disable_on_edit')
			.removeAttr('disabled');
	}
	
	,refresh: function() {
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
	}
	
	,_adjustInternalValues: function(obj) {
		// BBOX
		if( typeof(OpenLayers) !== 'undefined' ) {
			var geomData = obj[this.geomName];
			if( geomData ) {
				// Check if editor has changed the geometry's WKT
				if( this.currentGeometryWkt != geomData.wkt ) {
					$n2.couchGeom.adjustBboxOnCouchGeom(geomData);
				};
			};
		};
	}
	
	,_refreshRelations: function(data){
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
	}
	
	,onEditorObjectChanged: function(obj) {
		if( typeof(OpenLayers) === 'undefined' ) return;
		
		var wkt = undefined;
		if( obj 
		 && obj[this.geomName] ){
			wkt = obj[this.geomName].wkt;
		};
			
		// Check if editor has changed the geometry's WKT
		if( this.currentGeometryWkt !== wkt ) {
		
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
	}
	
    ,convertFeatureGeometryForDb: function(feature) {
		var mapProj = feature.layer.map.getProjectionObject();
		if( mapProj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			var geom = feature.geometry.clone();
			geom.transform(mapProj,this.couchProj);
			return geom;
		};
		return feature.geometry;
    }
	
    ,_featureModified: function(docId, geom, proj) {

		if( proj.getCode() != this.couchProj.getCode() ) {
			// Need to convert
			geom = geom.clone();
			geom.transform(proj,this.couchProj);
		};
    	
		var geomData = this.editedDocument[this.geomName];
		geomData.wkt = geom.toString();
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
    	
		var geomData = this.editedDocument[this.geomName];
		if( !geomData ){
			geomData = {
				nunaliit_type: 'geometry'
			};
			this.editedDocument[this.geomName] = geomData;
		};
		geomData.wkt = geom.toString();
		$n2.couchGeom.adjustBboxOnCouchGeom(geomData);
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
	
	,_getEditorContainer: function() {
		var $editorContainer = $('#'+this.editorContainerId);
		return $editorContainer;
	}
	
	,_disableControls: function() {
		var $editorContainer = this._getEditorContainer();
		$editorContainer.find('button').attr('disabled','disabled');
		$editorContainer.find('input:text').attr('disabled','disabled');
		
		// Do not disable text fields from upload forms, since it does not send
		// the information
		$editorContainer.find('.editorAttachFile').find('input:text').removeAttr('disabled');
	}
	
	,_enableControls: function() {
		var $editorContainer = this._getEditorContainer();
		$editorContainer.find('button').removeAttr('disabled');
		$editorContainer.find('input:text').removeAttr('disabled');
	}
	
	,_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ){
			dispatcher.send(DH,m);
		};
	}
	
	,_synchronousCall: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ){
			dispatcher.synchronousCall(DH,m);
		};
	}
	
	,_handle: function(m){
		if( m.type === 'editGeometryModified' ){
			if( m._origin !== this ){
				this._featureModified(m.docId, m.geom, m.proj);
			};
			
		} else if( m.type === 'mapGeometryAdded' ){
			this._addGeometry(m.geom, m.proj);
		};
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

var CouchEditor = $n2.Class({

	options: null,
	
	documentSource: null,
	
	panelName: null,
	
	geomName: null,
	
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
			,geomName: 'nunaliit_geom'
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
			,initialLayers: ['public']
		},opts_);
		
		var _this = this;
		
		this.options = {};
		this.documentSource = opts.documentSource;
		this.panelName = opts.panelName;
		this.geomName = opts.geomName;
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
			dispatcher.register(DH, 'editGeometryModified', f);
			dispatcher.register(DH, 'mapGeometryAdded', f);
			dispatcher.register(DH, 'editInitiate', f);
			dispatcher.register(DH, 'editCancel', f);
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

    _showAttributeForm: function(feature_, editorOptions_) {
    	if( null != this.currentEditor ) {
    		this.currentEditor.performCancellation();
    		this.currentEditor = null;
    	};
    	
    	this.currentEditor = this._createEditor(editorOptions_);
    	this.currentEditor.startFeatureEditing(
    		feature_
    		);
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
			,geomName: o_.geomName ? o_.geomName : this.geomName
			,initialLayers: o_.initialLayers ? o_.initialLayers : this.initialLayers
			,enableAddFile: o_.enableAddFile ? o_.enableAddFile : this.enableAddFile
			,schema: o_.schema ? o_.schema : this.options.schema
			,onFeatureInsertedFn: o_.onFeatureInsertedFn
			,onFeatureUpdatedFn: o_.onFeatureUpdatedFn
			,onFeatureDeletedFn: o_.onFeatureDeletedFn
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
	
	_initiateEditor: function(m){
		var _this = this;
		
		// Check that we are logged in
		var authService = this.authService;
		if( authService && false == authService.isLoggedIn() ) {
			authService.showLoginForm({
				onSuccess: function(result,options) {
					_this._initiateEditor(m);
				}
			});
			return;
		};
		
		if( m.feature ) {
			this._showAttributeForm(m.feature);
		} else {
			this.showDocumentForm(m.doc);
		};
	},
	
	_handle: function(m){
		if( 'editInitiate' === m.type ){
			this._initiateEditor(m);
			
		} else if( 'editCancel' === m.type ) {
			this.cancelDocumentForm();
			
		} else if( null != this.currentEditor ) {
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
	
	documentSource: null,

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
		
		var $elem = $(opts.elem);
		$elem.addClass('attachmentEditor');

		this.elemId = $n2.utils.getElementIdentifier( $elem );
		
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
			if( !fileName ){
				missingAttachment = attName;	
			};
		};
		if( missingAttachment ){
			opts.onError( _loc('A file must be selected') );
			return;
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
		if( !filename || !att || !uploadId ){
			$form.remove();
			continueUpload();
			
		} else {
			// Upload file via the upload service.

			// Perform actual upload
			this.uploadService.submitForm({
				form: $form
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
		
		$('<span>')
			.addClass('attachmentEditor_label')
			.text( opts.label )
			.appendTo($form);
	
		$('<input type="file">')
			.attr('name','media')
			.appendTo($form);
	
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
	}
});

//++++++++++++++++++++++++++++++++++++++++++++++

$n2.CouchEditor = {
	Editor: CouchEditor
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

})(jQuery,nunaliit2);
