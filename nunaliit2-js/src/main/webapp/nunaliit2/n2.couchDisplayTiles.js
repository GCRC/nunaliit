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

$Id: n2.couchDisplay.js 8441 2012-08-15 17:48:33Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchDisplayTiles';

function docCreationTimeSort(lhs, rhs) {
	var timeLhs = 0;
	var timeRhs = 0;
	
	if( lhs && lhs.doc && lhs.doc.nunaliit_created && lhs.doc.nunaliit_created.time ) {
		timeLhs = lhs.doc.nunaliit_created.time;
	}
	if( rhs && rhs.doc && rhs.doc.nunaliit_created && rhs.doc.nunaliit_created.time ) {
		timeRhs = rhs.doc.nunaliit_created.time;
	}
	
	if( timeLhs < timeRhs ) return -1;
	if( timeLhs > timeRhs ) return 1;
	return 0;
};

function startsWith(s, prefix) {
	var left = s.substr(0,prefix.length);
	return (left === prefix);
};

var TiledDisplay = $n2.Class({
	
	documentSource: null
	
	,displayPanelName: null
	
	,showService: null
	
	,editor: null
	
	,uploadService: null
	
	,authService: null
	
	,requestService: null
	
	,schemaRepository: null
	
	,customService: null
	
	,dispatchService: null
	
	,boolOptions: null
	
	,currentDocDetails: null
	
	,displayedDocuments: null
	
	,createRelatedDocProcess: null
	
	,requestService: null
	
	,defaultSchema: null
	
	,postProcessDisplayFns: null
	
	,dispatchHandle: null
	
	,initialize: function(opts_) {
		var opts = $n2.extend({
			documentSource: null
			,displayPanelName: null
			,showService: null
			,editor: null
			,uploadService: null
			,authService: null
			,requestService: null
			,schemaRepository: null
			,customService: null
			,dispatchService: null

			,postProcessDisplayFunction: null
			,displayRelatedInfoFunction: null
			
			// Boolean options
			,displayOnlyRelatedSchemas: false
			,displayBriefInRelatedInfo: false
			,restrictAddRelatedButtonToLoggedIn: false
		}, opts_);
		
		var _this = this;
		
		this.currentDocDetails = {};
		this.displayedDocuments = {};
		
		this.documentSource = opts.documentSource;
		this.displayPanelName = opts.displayPanelName;
		this.showService = opts.showService;
		this.editor = opts.editor;
		this.uploadService = opts.uploadService;
		this.authService = opts.authService;
		this.requestService = opts.requestService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
		this.dispatchService = opts.dispatchService;
		
		// Initialize display
		var $set = this._getDisplayDiv();
		
		// Boolean options
		this.boolOptions = {
			displayOnlyRelatedSchemas: opts.displayOnlyRelatedSchemas
			,displayBriefInRelatedInfo: opts.displayBriefInRelatedInfo
			,restrictAddRelatedButtonToLoggedIn: opts.restrictAddRelatedButtonToLoggedIn
		};
		
		// Post-process display functions
		this.postProcessDisplayFns = [];
		if( typeof(opts.postProcessDisplayFunction) === 'function' ){
			this.postProcessDisplayFns.push(opts.postProcessDisplayFunction);
		};
		if( this.customService ){
			var postProcessFns = this.customService.getOption('displayPostProcessFunctions');
			if( postProcessFns ){
				for(var i=0,e=postProcessFns.length;i<e;++i){
					if( typeof postProcessFns[i] === 'function' ){
						this.postProcessDisplayFns.push(postProcessFns[i]);
					};
				};
			};
		};

		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			var f = function(msg, addr, d){
				_this._handleDispatch(msg, addr, d);
			};
			dispatcher.register(DH, 'selected', f);
			dispatcher.register(DH, 'unselected', f);
			dispatcher.register(DH, 'searchResults', f);
			dispatcher.register(DH, 'documentDeleted', f);
			dispatcher.register(DH, 'authLoggedIn', f);
			dispatcher.register(DH, 'authLoggedOut', f);
			dispatcher.register(DH, 'editClosed', f);
			dispatcher.register(DH, 'documentContent', f);
			dispatcher.register(DH, 'documentContentCreated', f);
			dispatcher.register(DH, 'documentContentUpdated', f);
		};
		
		if( !opts.displayRelatedInfoFunction ) {
			var flag = this._getBooleanOption('displayOnlyRelatedSchemas');
			if( flag ) {
				opts.displayRelatedInfoFunction = function(opts_){
					_this._displayRelatedInfo(opts_);
				};
			} else {
				opts.displayRelatedInfoFunction = function(opts_){
					_this._displayLinkedInfo(opts_);
				};
			};
		};
		
		this.createRelatedDocProcess = new $n2.couchRelatedDoc.CreateRelatedDocProcess({
			documentSource: opts.documentSource
			,schemaRepository: this.schemaRepository
			,uploadService: this.uploadService
			,showService: this.showService
			,authService: this.authService
		});
	}

	// external
	,setSchema: function(schema) {
		this.defaultSchema = schema;
	}
	
	// external
	,addPostProcessDisplayFunction: function(fn){
		if( typeof(fn) === 'function' ){
			this.postProcessDisplayFns.push(fn);
		};
	}
	
	,_handleDispatch: function(msg, addr, dispatcher){
		var _this = this;
		
		var $div = this._getDisplayDiv();
		if( $div.length < 1 ){
			// No longer displaying. Un-register this event.
			dispatcher.deregister(addr);
			return;
		};
		
		// Selected document
		if( msg.type === 'selected' ) {
			if( msg.doc ) {
				this._displayDocument(msg.doc._id, msg.doc);
				
			} else if( msg.docId ) {
				this._displayDocument(msg.docId, null);
				
			} else if( msg.docs ) {
//				this._displayMultipleDocuments($div, msg.docs);
				
			} else if( msg.docIds ) {
//				this._displayMultipleDocumentIds($div, msg.docIds)
			};
			
		} else if( msg.type === 'unselected' ) {
			this.currentDocDetails = {};
			
		} else if( msg.type === 'searchResults' ) {
//			this._displaySearchResults(msg.results);
			
		} else if( msg.type === 'documentDeleted' ) {
//			var docId = msg.docId;
//			this._handleDocumentDeletion(docId);
			
		} else if( msg.type === 'authLoggedIn' 
			|| msg.type === 'authLoggedOut' ) {
//			$('.n2Display_buttons').each(function(){
//				var $elem = $(this);
//				_this._refreshButtons($elem);
//			});
			
		} else if( msg.type === 'editClosed' ) {
			var deleted = msg.deleted;
			if( !deleted ) {
				var doc = msg.doc;
				if( doc ) {
					this._displayDocument(doc._id, doc);
				};
			};
			
		} else if( msg.type === 'documentContent' ) {
			this._receiveDocumentContent(msg.doc);
			
		} else if( msg.type === 'documentContentCreated' ) {
			this._receiveDocumentContent(msg.doc);
			
		} else if( msg.type === 'documentContentUpdated' ) {
			this._receiveDocumentContent(msg.doc);
		};
	}
	
	,_displayDocument: function(docId, doc) {

		var _this = this;
		
		if( this.currentDocDetails
		 && this.currentDocDetails.docId === docId ){
			// Already in process of displaying this document
			return;
		};
		
		this.currentDocDetails = {
			docId: docId
			,doc: doc
		};
		
		var $set = this._getDisplayDiv();
		
		var $filters = $set.find('.n2DisplayTiled_filters');
		var $docs = $set.find('.n2DisplayTiled_documents');
		if( $filters.length < 1 || $docs.length < 1 ){
			$set.empty();
			$filters = $('<div>')
				.addClass('n2DisplayTiled_filters')
				.appendTo($set);
			$docs = $('<div>')
				.addClass('n2DisplayTiled_documents')
				.appendTo($set);
		};

		this._addDisplayedDocument(docId, doc);
		
		var $outer = $('<div>')
			.addClass('n2DisplayTiled_current')
			.addClass('n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId))
			.appendTo($docs);
		
		// Content
		var $docDiv = $('<div>')
			.addClass('n2DisplayTiled_document')
			.addClass('n2DisplayTiled_wait_for_content')
			.appendTo($outer);

		// Buttons
		var $btnDiv = $('<div>')
			.addClass('n2DisplayTiled_buttons')
			.appendTo($outer);
		
		// Get doc ids for all linked documents
		this.documentSource.getReferencesFromId({
			docId: docId
			,onSuccess: function(referenceIds){
				if( _this.currentDocDetails.docId === docId ){
					_this.currentDocDetails.referenceDocIds = referenceIds;
					_this._referencesUpdated();
				};
			}
			,onError: function(errorMsg){
				$n2.log('Error obtaining reference ids',errorMsg);
			}
		});
		
		// Request document
		if( doc ){
			this._receiveDocumentContent(doc);
		} else if( this.requestService ){
			this.requestService.requestDocument(docId);
		};
	}
	
	,_displayDocumentContent: function(doc){
		
		if( doc 
		 && doc._id 
		 && this.currentDocDetails.docId === doc._id ){
			var $set = this._getDisplayDiv();
			var $docDiv = $set.find('.n2DisplayTiled_wait_for_content');
			
			if( $docDiv.length > 0 ){
				if( this.showService ){
					this.showService.displayDocument($docDiv, {}, doc);
				} else {
					$docDiv.text(doc._id);
				};
				$docDiv.removeClass('n2DisplayTiled_wait_for_content');
			};
		};
	}
	
	,_displayDocumentButtons: function(doc, schema){
		
		var _this = this;
		
		if( doc 
		 && doc._id 
		 && this.currentDocDetails.docId === doc._id ){
			var $set = this._getDisplayDiv();
			var $btnDiv = $set.find('.n2DisplayTiled_buttons');

	 		// 'edit' button
	 		{
	 			$('<a href="#"></a>')
	 				.text( _loc('Edit') )
	 				.appendTo($btnDiv)
	 				.click(function(){
						_this._performDocumentEdit(doc);
						return false;
					});
	 		};
	
	 		// 'add related' button
			if( schema
			 && schema.relatedSchemaNames 
			 && schema.relatedSchemaNames.length
			 ) {
	 			var selectId = $n2.getUniqueId();
				var $addRelatedButton = $('<select>')
					.attr('id',selectId)
					.appendTo($btnDiv);
				$('<option>')
					.text( _loc('Add Related Item') )
					.val('')
					.appendTo($addRelatedButton);
				for(var i=0,e=schema.relatedSchemaNames.length; i<e; ++i){
					var schemaName = schema.relatedSchemaNames[i];
					$('<option>')
						.text(schemaName)
						.val(schemaName)
						.appendTo($addRelatedButton);
					
					if( this.schemaRepository ){
						this.schemaRepository.getSchema({
							name: schemaName
							,onSuccess: function(schema){
								$('#'+selectId).find('option').each(function(){
									var $option = $(this);
									if( $option.val() === schema.name
									 && schema.label ){
										$option.text(schema.label);
									};
								});
							}
						});
					};
				};
				
				$addRelatedButton.change(function(){
					var val = $(this).val();
					$(this).val('');
					if( val ) {
						_this._addRelatedDocument(doc._id, val);
					};
					return false;
				});
			};
		};
	}
	
	,_referencesUpdated: function(){
		if( this.currentDocDetails 
		 && this.currentDocDetails.doc 
		 && this.currentDocDetails.referenceDocIds ){
			// Accumulate all references
			var refDocIds = {};
			
			// Forward references
			var references = [];
			$n2.couchUtils.extractLinks(this.currentDocDetails.doc, references);
			for(var i=0, e=references.length; i<e; ++i){
				var linkDocId = references[i].doc;
				refDocIds[linkDocId] = true;
			};
			
			// Reverse links
			for(var i=0, e=this.currentDocDetails.referenceDocIds.length; i<e; ++i){
				var linkDocId = this.currentDocDetails.referenceDocIds[i];
				refDocIds[linkDocId] = true;
			};
			
			// Figure out information that must be removed
			var idsToRemove = [];
			for(var docId in this.displayedDocuments){
				if( docId === this.currentDocDetails.docId ) {
					// OK
				} else if( !refDocIds[docId] ){
					idsToRemove.push(docId);
				};
			};
			for(var i=0,e=idsToRemove.length; i<e; ++i){
				this._removeDisplayedDocument(idsToRemove[i]);
			};
			
			// Add new ones
			for(var docId in refDocIds){
				this._addDisplayedDocument(docId);
			};

			// Perform updates
			this._updateDisplayedDocuments();
		};
	},
	
	/*
	 * Verify information found in the instance variable displayedDocuments
	 * and affect the displaying accordingly
	 */
	_updateDisplayedDocuments: function(){
		var _this = this;
		
		var $set = this._getDisplayDiv();
		var $docs = $set.find('.n2DisplayTiled_documents');
		
		// Get all the required info
		var neededInfoIds = [];
		for(var docId in this.displayedDocuments){
			if( !this.displayedDocuments[docId].info ) {
				neededInfoIds.push(docId);
			};
		};
		if( neededInfoIds.length > 0 ) {
			this.documentSource.getDocumentInfoFromIds({
				docIds: neededInfoIds
				,onSuccess: function(docInfos){
					for(var i=0, e=docInfos.length; i<e; ++i){
						var docInfo = docInfos[i];
						var docId = docInfo.id;
						if( _this.displayedDocuments[docId] ){
							_this.displayedDocuments[docId].info = docInfo;
						};
					};
					performUpdate();
				}
				,onError: function(errorMsg){
					$n2.log('Unable to obtain document information',errorMsg);
				}
			});
		} else {
			performUpdate();
		};

		function performUpdate() {
			// Sort (TBD)
			var sortedDocIds = [];
			for(var docId in _this.displayedDocuments){
				sortedDocIds.push(docId);
			};
			
			// Append new ones
			for(var i=0,e=sortedDocIds.length; i<e; ++i){
				var docId = sortedDocIds[i];
				var cName = 'n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId);
				var $tile = $set.find('.'+cName);
				if( $tile.length < 1 ){
					// Add at end of set
					$('<div>')
						.addClass(cName)
						.text(docId)
						.appendTo($set);
				};
			};
		};
	},
	
	/*
	 * This function adds a new document to be displayed among the related items
	 * of the display. _updateDisplayedDocuments should be called, next.
	 */
	_addDisplayedDocument: function(docId, doc){
		if( !this.displayedDocuments[docId] ){
			this.displayedDocuments[docId] = {
				id: docId
			};
		};
		
		if( doc ){
			this.displayedDocuments[docId].doc = doc;
		};
	},
	
	/*
	 * This function removes the information relating to the document
	 * associated with the given document id. _updateDisplayedDocuments
	 * should be called, next.
	 */
	_removeDisplayedDocument: function(docId){
		var $set = this._getDisplayDiv();

		// Remove DOM element
		var cName = 'n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId);
		$set.find('.'+cName).remove();
		
		// Remove information
		if( this.displayedDocuments[docId] ){
			delete this.displayedDocuments[docId];
		};
	}
	
	,_receiveDocumentContent: function(doc){
		var _this = this;
		
		// Currently displayed
		if( doc._id === this.currentDocDetails.docId ){

			this.currentDocDetails.doc = doc;
			_this._referencesUpdated();

			if( doc.nunaliit_schema 
			 && this.schemaRepository ){
				this.schemaRepository.getSchema({
					name: doc.nunaliit_schema
					,onSuccess: function(schema){
						schemaLoaded(doc, schema);
					}
					,onError: function(err){
						schemaLoaded(doc, null);
					}
				});
			} else {
				schemaLoaded(doc, null);
			};
			
		} else {
			// Not currently displayed. Does it contain a link to the
			// currently displayed document?
			if( this.currentDocDetails.docId ){
				var forwardLinkAvailable = false;
				var references = [];
				$n2.couchUtils.extractLinks(doc, references);
				if( references.indexOf(this.currentDocDetails.docId) >= 0 ){
					forwardLinkAvailable = true;
				};
				
				if( forwardLinkAvailable && !this.displayedDocuments[doc._id] ){
					// Add new linked item
					this._addDisplayedDocument(doc._id, doc);
					this._updateDisplayedDocuments();
				} else if( !forwardLinkAvailable && this.displayedDocuments[doc._id] ) {
					// Remove item no longer linked
					this._removeDisplayedDocument(doc._id);
					this._updateDisplayedDocuments();
				};
			};
		}
		
		function schemaLoaded(doc, schema){
			_this._displayDocumentContent(doc);
			_this._displayDocumentButtons(doc, schema);
		};
	}
	
	,_addRelatedDocument: function(docId, schemaName){
		this.createRelatedDocProcess.addRelatedDocumentFromSchemaNames({
			docId: docId
			,relatedSchemaNames: [schemaName]
			,onSuccess: function(docId){
			}
		});
	},
	
	/*
	 * Initiates the editing of a document
	 */
	_performDocumentEdit: function(doc){
		this._dispatch({
			type: 'editInitiate'
			,docId: doc._id
			,doc: doc
		});
	}
	
	,_getDisplayDiv: function(){
		var divId = this.displayPanelName;
		return $('#'+divId);
	}
	
	,_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	}

	/*
	 * Get a boolean option based on a name and return it. Defaults
	 * to false. If the option is found set in either the options map
	 * or the custom service, then the result is true.
	 */
	,_getBooleanOption: function(optionName){
		var flag = false;
		
		if( this.boolOptions[optionName] ){
			flag = true;
		};
		
		var cs = this.customService;
		if( cs && !flag ){
			var o = cs.getOption(optionName);
			if( o ){
				flag = true;
			};
		};
		
		return flag;
	}
});


$n2.couchDisplayTiles = {
	TiledDisplay: TiledDisplay
};

})(jQuery,nunaliit2);
