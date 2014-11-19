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

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/*
* Template for document display
*/
var GridTemplateDocument = $n2.Class({
	height: null,
	
	tileHeight: null,
	
	initialize: function(height, tileHeight){
		this.height = (height ? height : 0);
		this.tileHeight = (tileHeight ? tileHeight : 150);
	},
	
	get: function(numCols, targetTiles) {
		// Have space to grow
		targetTiles = targetTiles + 12;
		
      var numRows = Math.ceil(targetTiles / numCols),
	        rects = [],
	        x, y, i;
	
      var firstTileHeight = Math.max(1, Math.ceil(this.height / this.tileHeight));
      
      // First tile is 2x1
      var firstTileWidth = 2;
      rects.push(new Tiles.Rectangle(0, 0, firstTileWidth, firstTileHeight));
      
      x = firstTileWidth - 1;
      y = 0;
      
      for(i = 1; i<targetTiles; ++i){
      	x = x + 1;
      	while( x >= numCols ){
      		y = y + 1;
      		x = 0;
      		
      		if( y < firstTileHeight ){
      			x = firstTileWidth;
      		};
      	};
      	
          rects.push(new Tiles.Rectangle(x, y, 1, 1));
      };
	
	    return new Tiles.Template(rects, numCols, numRows);
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var TiledDisplay = $n2.Class({
	
	documentSource: null,
	
	displayPanelName: null,
	
	showService: null,
	
	editor: null,
	
	uploadService: null,
	
	authService: null,
	
	requestService: null,
	
	schemaRepository: null,
	
	customService: null,
	
	dispatchService: null,
	
	boolOptions: null,
	
	restrictAddRelatedButtonToLoggedIn: null,
	
	currentDetails: null,
	
	displayedDocumentsOrder: null,
	
	displayedDocuments: null,
	
	grid: null,
	
	createRelatedDocProcess: null,
	
	requestService: null,
	
	defaultSchema: null,
	
	relatedDocumentDiscoveryProcess: null,
	
	documentInfoFunction: null,
	
	sortFunction: null,
	
	filterFactory: null,
	
	filter: null,
	
	hoverInFn: null,
	
	hoverOutFn: null,
	
	hoverDocId: null,
	
	initialize: function(opts_) {
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
			,createDocProcess: null
			,displayRelatedInfoFunction: null
			
			// Boolean options
			,displayOnlyRelatedSchemas: false
			,displayBriefInRelatedInfo: false
			,restrictAddRelatedButtonToLoggedIn: false
			
			// Process used to discover related information from
			// a document
			,relatedDocumentDiscoveryProcess: null
			
			// Function to obtain document information structures based on
			// document ids
			,documentInfoFunction: null
			
			// Function to sort documents based on info structures
			,sortFunction: null
			
			// Factory to create filters
			,filterFactory: null
		}, opts_);
		
		var _this = this;
		
		/*
			currentDetails = {
				// single document selection
				docId // document identifier
				doc // document content
				schema // schema associated with the document
				height // last detected content height for current document
				referenceDocIds // doc ids of related info
				
				// multiple document selection
				docIds // document identifiers
				docs // map of document contents by id
			}
		 */
		this.currentDetails = {};
		/*
		 	displayedDocuments = {
		 		<doc-id>: {
		 			id: <doc-id>
		 			,info: <info object>
		 			,doc: <content>
		 		}
		 	}
		 */
		this.displayedDocuments = {};
		/*
		 	Array of document ids
		 */
		this.displayedDocumentsOrder = null;
		
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
		this.createRelatedDocProcess = opts.createdDocProcess;
		
		// Initialize display
		this._getDisplayDiv();
		
		// Boolean options
		this.boolOptions = {
			displayOnlyRelatedSchemas: opts.displayOnlyRelatedSchemas
			,displayBriefInRelatedInfo: opts.displayBriefInRelatedInfo
		};
		this.restrictAddRelatedButtonToLoggedIn = opts.restrictAddRelatedButtonToLoggedIn;
		if( !this.restrictAddRelatedButtonToLoggedIn 
		 && this.customService ){
			this.restrictAddRelatedButtonToLoggedIn = 
				this.customService.getOption('restrictAddRelatedButtonToLoggedIn',false);
		};

		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			var f = function(msg, addr, d){
				_this._handleDispatch(msg, addr, d);
			};
			dispatcher.register(DH, 'selected', f);
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
		
		// Related document discovery process
		this.relatedDocumentDiscoveryProcess = opts.relatedDocumentDiscoveryProcess;
		if( !this.relatedDocumentDiscoveryProcess 
		 && this.customService ){
			this.relatedDocumentDiscoveryProcess = 
				this.customService.getOption('relatedDocumentDiscoveryProcess',null);
		};
		if( !this.relatedDocumentDiscoveryProcess ){
			this.relatedDocumentDiscoveryProcess = new ReferenceRelatedDocumentDiscovery({
				documentSource: this.documentSource
			});
		};
		
		// Document info function
		this.documentInfoFunction = opts.documentInfoFunction;
		if( !this.documentInfoFunction 
		 && this.customService ){
			var docInfoFn = this.customService.getOption('displayDocumentInfoFunction');
			if( typeof docInfoFn === 'function' ){
				this.documentInfoFunction = docInfoFn;
			};
		};
		if( !this.documentInfoFunction ){
			this.documentInfoFunction = function(opts_){
				var opts = $n2.extend({
					docIds: null
					,display: null
					,onSuccess: function(docInfos){}
					,onError: function(err){}
				},opts_);
				
				var ds = opts.display.documentSource;
				ds.getDocumentInfoFromIds({
					docIds: opts.docIds
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			};
		};
		
		// Sort function
		this.sortFunction = opts.sortFunction;
		if( !this.sortFunction 
		 && this.customService ){
			var sortFn = this.customService.getOption('displaySortFunction');
			if( typeof sortFn === 'function' ){
				this.sortFunction = sortFn;
			};
		};
		if( !this.sortFunction ){
			this.sortFunction = function(infos){
				infos.sort(function(a,b){
					if( a.updatedTime && b.updatedTime ){
						if( a.updatedTime > b.updatedTime ){
							return -1;
						};
						if( a.updatedTime < b.updatedTime ){
							return 1;
						};
					};

					if( a.id > b.id ){
						return -1;
					};
					if( a.id < b.id ){
						return 1;
					};
					
					return 0;
				});
			};
		};
		
		// Filter factory
		this.filterFactory = opts.filterFactory;
		if( !this.filterFactory 
		 && this.customService ){
			var factory = this.customService.getOption('displayFilterFactory');
			if( factory && typeof factory.get === 'function' ){
				this.filterFactory = factory;
			};
		};
		if( !this.filterFactory ){
			this.filterFactory = new SchemaFilterFactory({
				schemaRepository: this.schemaRepository
			});
		};
		
		// Hover in and out
		this.hoverInFn = function(){
			var $tile = $(this);
			var docId = $tile.attr('n2DocId');
			if( docId && docId !== _this.hoverDocId ) {
				_this.hoverDocId = docId;
				_this._dispatch({
					type: 'userFocusOn'
					,docId: docId
				});
			};
		};
		this.hoverOutFn = function(){
			var $tile = $(this);
			var docId = $tile.attr('n2DocId');
			if( docId && docId === _this.hoverDocId ) {
				_this.hoverDocId = null;
				_this._dispatch({
					type: 'userFocusOff'
					,docId: docId
				});
			};
		};
		
		// Detect changes in displayed current content size
		var intervalID = window.setInterval(function(){
			var $set = _this._getDisplayDiv();
			if( $set.length < 0 ) {
				window.clearInterval(intervalID);
			} else {
				_this._performIntervalTask();
			};
		}, 500);
	},

	// external
	setSchema: function(schema) {
		this.defaultSchema = schema;
	},
	
	_handleDispatch: function(msg, addr, dispatcher){
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
				var ids = [];
				for(var i=0, e=msg.docs.length; i<e; ++i){
					ids.push( msg.docs[i]._id );
				};
				this._displayMultipleDocuments(ids, msg.docs);
				
			} else if( msg.docIds ) {
				this._displayMultipleDocuments(msg.docIds, null);
			};
			
		} else if( msg.type === 'searchResults' ) {
			this._displaySearchResults(msg.results);
			
		} else if( msg.type === 'documentDeleted' ) {
//			var docId = msg.docId;
//			this._handleDocumentDeletion(docId);
			
		} else if( msg.type === 'authLoggedIn' 
			|| msg.type === 'authLoggedOut' ) {
			
			// Redisplay buttons
			if( this.currentDetails 
			 && this.currentDetails.docId 
			 && this.currentDetails.doc ){
				this._receiveDocumentContent(this.currentDetails.doc);
				this._displayDocumentButtons(this.currentDetails.doc, this.currentDetails.schema);
			};
			
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
	},
	
	_displayDocument: function(docId, doc) {

//		var _this = this;
		
		this._reclaimDisplayDiv();
		
		if( this.currentDetails
		 && this.currentDetails.docId === docId ){
			// Already in process of displaying this document
			return;
		};
		
		this.currentDetails = {
			docId: docId
		};

		this._addDisplayedDocument(docId, doc);

		var $set = this._getDisplayDiv();

		var $current = $set.find('.n2DisplayTiled_info');
		$current.hide();

		// Use template for document display
		this.grid.template = null;
		this.grid.templateFactory = new GridTemplateDocument();
		
		this._adjustCurrentTile(docId);
		
		// Request document
		if( doc ){
			this._receiveDocumentContent(doc);
		} else {
			this._requestDocumentWithId(docId);
		};
	},
	
	/*
	 * Accepts search results and display them in tiled mode
	 */
	_displaySearchResults: function(results){
		
		this._reclaimDisplayDiv();
		
		var ids = [];
		if( results && results.sorted && results.sorted.length ) {
			for(var i=0,e=results.sorted.length; i<e; ++i){
				ids.push(results.sorted[i].id);
			};
		};
		
		this._displayMultipleDocuments(ids, null);
		
		if( ids.length < 1 ){
			var $set = this._getDisplayDiv();
			var $current = $set.find('.n2DisplayTiled_info');
			$current
				.text( _loc('Empty search results') )
				.show();
		};
	},
	
	/*
	 * Displays multiple documents
	 */
	_displayMultipleDocuments: function(ids, docs){
		
		this._reclaimDisplayDiv();

		var $set = this._getDisplayDiv();
		var $current = $set.find('.n2DisplayTiled_info');
		$current.hide();
		
		this.currentDetails = {
			docIds: ids
			,docs: {}
		};
		
		// Use template for multiple documents display
		this.grid.template = null;
		this.grid.templateFactory = Tiles.UniformTemplates;
		
		this._adjustCurrentTile(null);
		
		var docsById = {};
		if( docs ){
			for(var i=0,e=docs.length; i<e; ++i){
				var doc = docs[i];
				this.currentDetails.docs[doc._id] = doc;
				docsById[doc._id] = doc;
			};
		};

		this._changeDisplayedDocuments(ids, docsById);
	},
	
	_displayDocumentButtons: function(doc, schema){
		
		var _this = this;
		
		if( doc 
		 && doc._id 
		 && this.currentDetails.docId === doc._id ){
			var $set = this._getDisplayDiv();
			var $btnDiv = $set.find('.n2DisplayTiled_current_buttons')
				.empty();

	 		// 'edit' button
	 		if( $n2.couchMap.canEditDoc(doc) ) {
	 			$('<a href="#"></a>')
	 				.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_edit')
	 				.text( _loc('Edit') )
	 				.appendTo($btnDiv)
	 				.click(function(){
						_this._performDocumentEdit(doc);
						return false;
					});
	 		};

	 		// Show 'delete' button
	 		if( $n2.couchMap.canDeleteDoc(doc) ) {
	 			$('<a href="#"></a>')
	 				.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_delete')
	 				.text( _loc('Delete') )
	 				.appendTo($btnDiv)
	 				.click(function(){
						_this._performDocumentDelete(doc);
						return false;
					});
	 		};
	
	 		// 'add related' button
			if( schema
			 && schema.relatedSchemaNames 
			 && schema.relatedSchemaNames.length
			 ) {
				var showAddRelatedButton = true;
				if( this.restrictAddRelatedButtonToLoggedIn ){
					var isLoggedIn = false;

					if( this.dispatchService ){
						var m = {
							type: 'authIsLoggedIn'
							,isLoggedIn: false
						};
						this.dispatchService.synchronousCall(DH,m);
						isLoggedIn = m.isLoggedIn;
					};
					
					if( !isLoggedIn ){
						showAddRelatedButton = false;
					};
				};
				
				if( showAddRelatedButton ) {
		 			var selectId = $n2.getUniqueId();
					var $addRelatedButton = $('<select>')
		 				.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_add_related_item')
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
										if( $option.val() === schema.name ){
											$option.text(schema.getLabel());
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
							_this._addRelatedDocument(doc, val);
						};
						return false;
					});
				}; // show button
			};
			
	 		// Show 'find on map' button
			if( this.dispatchService 
			 && this.dispatchService.isEventTypeRegistered('findIsAvailable')
			 && this.dispatchService.isEventTypeRegistered('find')
			 ) {
				// Check if document can be displayed on a map
				var showFindOnMapButton = false;
				var m = {
					type: 'findIsAvailable'
					,doc: doc
					,isAvailable: false
				};
				this.dispatchService.synchronousCall(DH,m);
				if( m.isAvailable ){
					showFindOnMapButton = true;
				};

				if( showFindOnMapButton ) {
					$('<a href="#"></a>')
						.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_find_on_map')
		 				.text( _loc('Find on Map') )
		 				.appendTo($btnDiv)
		 				.click(function(){
		 					_this._dispatch({
		 						type: 'find'
	 							,docId: doc._id
	 							,doc: doc
	 						});
							return false;
						});
				};
			};

			// Show 'Add Layer' button
			if( doc
			 && doc.nunaliit_layer_definition
			 && this.dispatchService
			 && this.dispatchService.isEventTypeRegistered('addLayerToMap')
			 ) {
				$('<a href="#"></a>')
					.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_add_layer')
	 				.text( _loc('Add Layer') )
	 				.appendTo($btnDiv)
	 				.click(function(){
	 					_this._performAddLayerToMap(doc);
						return false;
					});
			};

			// Show 'Tree View' button
			if( doc ) {
				$('<a href="#"></a>')
					.addClass('n2DisplayTiled_current_button n2DisplayTiled_current_button_tree_view')
	 				.text( _loc('Tree View') )
	 				.appendTo($btnDiv)
	 				.click(function(){
	 					_this._performTreeView(doc);
						return false;
					});
			};
		};
	},
	
	_currentDocReferencesUpdated: function(){
		if( this.currentDetails 
		 && this.currentDetails.doc 
		 && this.currentDetails.referenceDocIds ){
			// Accumulate all references
			var refDocIds = {};
			for(var i=0, e=this.currentDetails.referenceDocIds.length; i<e; ++i){
				var linkDocId = this.currentDetails.referenceDocIds[i];
				refDocIds[linkDocId] = true;
			};
			
			// Figure out information that must be removed
			var idsToRemove = [];
			for(var docId in this.displayedDocuments){
				if( docId === this.currentDetails.docId ) {
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
			
			// Use dynamic sorting
			this.displayedDocumentsOrder = null;

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
		
		// Get all the required info
		var neededInfoIds = [];
		for(var docId in this.displayedDocuments){
			if( !this.displayedDocuments[docId].info ) {
				neededInfoIds.push(docId);
			};
		};
		if( neededInfoIds.length > 0 ) {
			this.documentInfoFunction({
				docIds: neededInfoIds
				,display: this
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
			// Ensure we have display
			_this._getDisplayDiv();

			// Sort
			var sortedDocIds = null;
			if( _this.displayedDocumentsOrder ){
				sortedDocIds = _this.displayedDocumentsOrder;

				var infos = [];
				for(var i=0,e=sortedDocIds.length; i<e; ++i){
					var docId = sortedDocIds[i];
					if( _this.displayedDocuments[docId] 
					 && _this.displayedDocuments[docId].info ){
						infos.push( _this.displayedDocuments[docId].info );
					};
				};
				
				_this.filter.display(infos,_this);
				infos = _this.filter.filter(infos,_this);

				sortedDocIds = [];
				for(var i=0,e=infos.length; i<e; ++i){
					var info = infos[i];
					sortedDocIds.push(info.id);
				};
				
			} else {
				var infos = [];
				for(var docId in _this.displayedDocuments){
					if( _this.displayedDocuments[docId].info ){
						infos.push( _this.displayedDocuments[docId].info );
					};
				};

				_this.filter.display(infos,_this);
				infos = _this.filter.filter(infos,_this);
				
				_this.sortFunction(infos);

				var alreadySorted = {};
				sortedDocIds = [];
				if( _this.currentDetails
				 && _this.currentDetails.docId ){
					sortedDocIds.push(_this.currentDetails.docId);
					alreadySorted[_this.currentDetails.docId] = true;
				};
				
				for(var i=0,e=infos.length; i<e; ++i){
					var docId = infos[i].id;
					
					// Remove duplicates
					if( !alreadySorted[docId] ) {
						sortedDocIds.push(docId);
						alreadySorted[docId] = true;
					};
				};
			};
			
			_this.grid.updateTiles(sortedDocIds);
			_this.grid.isDirty = true; // force redraw to reflect change in order
            _this.grid.redraw(true);

            // Request content for documents
			for(var i=0,e=sortedDocIds.length; i<e; ++i){
				var docId = sortedDocIds[i];
				_this._requestDocumentWithId(docId);
			};
		};
	},
	
	/*
	 * Changes the list of displayed documents
	 */
	_changeDisplayedDocuments: function(docIds, docsById){
		var displayDocsByIds = {};
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			displayDocsByIds[docId] = true;
		};
		
		for(var docId in this.displayedDocuments){
			if( !displayDocsByIds[docId] ){
				this._removeDisplayedDocument(docId);
			};
		};
		
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			var doc = null;
			if( docsById && docsById[docId] ){
				doc = docsById[docId];
			};
			
			this._addDisplayedDocument(docId, doc);
		};
		
		this.displayedDocumentsOrder = docIds;
		
		this._updateDisplayedDocuments();
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
		// Remove information
		if( this.displayedDocuments[docId] ){
			delete this.displayedDocuments[docId];
		};
	},
	
	_receiveDocumentContent: function(doc){
		var _this = this;

		var $set = this._getDisplayDiv();
		
		var docId = doc._id;
		if( this.displayedDocuments[docId] ){
			// We are interested in this document. Save the content
			this.displayedDocuments[docId].doc = doc;
		};

		// Currently displayed document?
		if( doc._id === this.currentDetails.docId ){
			
			var update = false;
			
			if( !this.currentDetails.doc ) {
				// We do not yet have the content of the current document
				this.currentDetails.doc = doc;
				update = true;
				
			} else {
				// We already have the content. Check for update.
				
				if( doc._rev !== this.currentDetails.doc._rev ) {
					this.currentDetails.doc = doc;
					update = true;
				};
			};
			
			if( update ){
				// Renew related document ids
				this.relatedDocumentDiscoveryProcess.getRelatedDocumentIds({
					doc: doc
					,onSuccess: function(doc, refDocIds){
						if( _this.currentDetails.docId === doc._id ){
							_this.currentDetails.referenceDocIds = refDocIds;
							_this._currentDocReferencesUpdated();
						};
					}
					,onError: function(err){
						$n2.log('Error obtaining reference ids',err);
					}
				});
			};
		};
		
		// Display brief associated with the document
		var waitClassName = 'n2DisplayTiled_wait_brief_' + $n2.utils.stringToHtmlId(docId);
		$set.find('.'+waitClassName).each(function(){
			var $div = $(this);
			if( _this.showService ) {
				_this.showService.displayBriefDescription($div, {}, doc);
			};
			$div.removeClass(waitClassName);
		});
		
		// Display full document for currently selected document
		var waitClassName = 'n2DisplayTiled_wait_current_' + $n2.utils.stringToHtmlId(docId);
		$set.find('.'+waitClassName).each(function(){
			var $div = $(this)
				.empty();

			$('<div>')
				.addClass('n2DisplayTiled_current_buttons')
				.appendTo($div);			

			var $content = $('<div>')
				.appendTo($div);
			if( _this.showService ) {
				_this.showService.displayDocument($content, {}, doc);
			} else {
				$content.text( doc._id );
			};
			
			_this._displayDocumentButtons(doc, _this.currentDetails.schema);
			
			$div.removeClass(waitClassName);
		});
		
		// Set tile classes based on media associated with document, and schema name
		var includesImage = false;
		var includesAudio = false;
		var includesVideo = false;
		var thumbnailName = null;
		var schemaName = null;
		if( doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files ){
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				if( att.source ) {
					// discount thumbnails
				} else {
					if( 'image' === att.fileClass ) {
						includesImage = true;
					} else if( 'audio' === att.fileClass ) {
						includesAudio = true;
					} else if( 'video' === att.fileClass ) {
						includesVideo = true;
					};
					if( att.thumbnail ){
						thumbnailName = att.thumbnail;
					};
				};
			};
		};
		if( doc.nunaliit_schema ){
			schemaName = doc.nunaliit_schema;
		};
		$set.find('.n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId)).each(function(){
			var $tile = $(this);
			
			$tile.removeClass('n2DisplayTiled_tile_image n2DisplayTiled_tile_audio n2DisplayTiled_tile_video');
			if(includesVideo){
				$tile.addClass('n2DisplayTiled_tile_video');
			} else if(includesAudio){
				$tile.addClass('n2DisplayTiled_tile_audio');
			} else if(includesImage){
				$tile.addClass('n2DisplayTiled_tile_image');
			};
			
			if( schemaName ){
				$tile.addClass('n2DisplayTiled_tile_schema_'+$n2.utils.stringToHtmlId(schemaName));
			};
		});
		if( thumbnailName ){
			// Check that thumbnail is attached
			if( doc.nunaliit_attachments.files[thumbnailName]
			 && doc.nunaliit_attachments.files[thumbnailName].status === 'attached' ){
				// OK
			} else {
				thumbnailName = null;
			};
		};
		if( thumbnailName ){
			var url = this.documentSource.getDocumentAttachmentUrl(doc,thumbnailName);
			if( url ){
				$set.find('.n2DisplayTiled_wait_thumb_' + $n2.utils.stringToHtmlId(docId)).each(function(){
					var $div = $(this);
					$div.empty();
					$('<img>')
						.attr('src',url)
						.appendTo($div);
				});
			};
		};
		

		// Obtain the schema associated with the document
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
		
		// Check if the given document contains links to the currently
		// displayed document
		if( this.currentDetails.doc 
		 && doc._id !== this.currentDetails.docId ){
			
			this.relatedDocumentDiscoveryProcess.areDocumentsRelated({
				selectedDoc: this.currentDetails.doc
				,relatedDoc: doc
				,onRelated: function(selectedDoc, relatedDoc){
					// Check validity of callback
					if( selectedDoc._id === _this.currentDetails.docId ){
						var refIndex = -1;
						if( _this.currentDetails.referenceDocIds ) {
							refIndex = _this.currentDetails.referenceDocIds.indexOf(doc._id);
						};
						
						if( refIndex < 0 ) {
							// The previous time we saw this document, there were no reference to the
							// currently displayed document. Now, this new version of the document
							// contains a reference to the displayed document. Add reference and
							// re-display.
							if( !_this.currentDetails.referenceDocIds ){
								_this.currentDetails.referenceDocIds = [];
							};
							_this.currentDetails.referenceDocIds.push(doc._id);
							_this._currentDocReferencesUpdated();
						};
					};
				}
				,onNotRelated: function(selectedDoc, relatedDoc){
					// Check validity of callback
					if( selectedDoc._id === _this.currentDetails.docId ){
						var refIndex = -1;
						if( _this.currentDetails.referenceDocIds ) {
							refIndex = _this.currentDetails.referenceDocIds.indexOf(doc._id);
						};

						if( refIndex >= 0 ) {
							// The previous time we saw this document, it had a reference to the
							// currently displayed document. Now, this reference is no longer there.
							// Remove the reference and redisplay
							_this.currentDetails.referenceDocIds.splice(refIndex,1);
							_this._currentDocReferencesUpdated();
						};
					};
				}
				,onError: function(err){
					$n2.log('Error in displayTiled. Unable to check relation.',err);
				}
			});
		};
		
		function schemaLoaded(doc, schema){
			if( _this.currentDetails.docId === doc._id ){
				// This is the schema associated with the current
				// document.
				if( schema && !_this.currentDetails.schema ){
					_this.currentDetails.schema = schema;
					_this._displayDocumentButtons(doc, schema);
					
				} else if( _this.currentDetails.schema && !schema ) {
					_this.currentDetails.schema = null;
					_this._displayDocumentButtons(doc, null);
				
				} else if( _this.currentDetails.schema 
				 && schema
				 && _this.currentDetails.schema.name !== schema.name
				 ) {
					// Schema is changed
					_this.currentDetails.schema = schema;
					_this._displayDocumentButtons(doc, schema);
				};
			};
		};
	},
	
	_addRelatedDocument: function(doc, schemaName){
		this.createRelatedDocProcess.createDocumentFromSchemaNames({
			schemaNames: [schemaName]
			,relatedDoc: doc
			,onSuccess: function(docId){
			}
		});
	},
	
	/*
	 * Initiates the editing of a document
	 */
	_performDocumentEdit: function(doc){
		var _this = this;
		
		this.documentSource.getDocument({
			docId: doc._id
			,onSuccess: function(doc){
				_this._dispatch({
					type: 'editInitiate'
					,docId: doc._id
					,doc: doc
				});
			}
			,onError: function(errorMsg){
				$n2.log('Unable to load document: '+errorMsg);
			}
		});
	},
	
	/*
	 * Initiates the deletion of a document
	 */
	_performDocumentDelete: function(doc){
		if( confirm( _loc('You are about to delete this document. Do you want to proceed?') ) ) {
			this.documentSource.deleteDocument({
				doc: doc
				,onSuccess: function() {}
			});
		};
	},
	
	/*
	 * Initiates the 'Add Layer to Map' action for the button
	 */
	_performAddLayerToMap: function(doc){
		var layerDefinition = doc.nunaliit_layer_definition;
		var layerId = layerDefinition.id;
		if( !layerId ){
			layerId = doc._id;
		};
		var layerDef = {
			name: layerDefinition.name
			,type: 'couchdb'
			,options: {
				layerName: layerId
				,documentSource: this.documentSource
			}
		};
		
		this._dispatch({
			type: 'addLayerToMap'
			,layer: layerDef
			,options: {
				setExtent: {
					bounds: layerDefinition.bbox
					,crs: 'EPSG:4326'
				}
			}
		});
	},
	
	/*
	 * Opens a tree view dialog
	 */
	_performTreeView: function(doc){
		new $n2.couchDisplay.TreeDocumentViewer({
			doc: doc
		});
	},
	
	/*
	 * This function should be called before any displaying is performed.
	 * This ensures that the div element in use still contains the required
	 * elements for performing display.
	 */
	_reclaimDisplayDiv: function() {
		var _this = this;
		
		var $set = this._getDisplayDiv();
		
		var $filters = $set.find('.n2DisplayTiled_filters');
		var $current = $set.find('.n2DisplayTiled_info');
		var $docs = $set.find('.n2DisplayTiled_documents');
		if( $filters.length < 1 
		 || $current.length < 1
		 || $docs.length < 1 ){
			$set.empty();
			$filters = $('<div>')
				.addClass('n2DisplayTiled_filters')
				.appendTo($set);
			$current = $('<div>')
				.addClass('n2DisplayTiled_info')
				.appendTo($set);
			$docs = $('<div>')
				.addClass('n2DisplayTiled_documents')
				.appendTo($set);
			
			// When the side panel must be re-claimed, then we must
			// forget what is currently displayed since it has to be
			// re-computed
			this.currentDetails = {};
			
			// Create grid
			this.grid = new Tiles.Grid($docs);
			this.grid.createTile = function(docId) {
		        var $elem = $('<div>')
		        	.addClass('n2DisplayTiled_tile')
		        	.addClass('n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId))
		        	.attr('n2DocId',docId);
		        
		        $elem.hover(
	        		_this.hoverInFn
	        		,_this.hoverOutFn
		        );

		        var tile = new Tiles.Tile(docId, $elem);
		        
		        if( _this.currentDetails
		         && _this.currentDetails.docId === docId ){
		        	// Current document
		        	$elem.addClass('n2DisplayTiled_tile_current');
		        	_this._generateCurrentDocumentContent($elem, docId);

		        } else {
		        	// Not current document
		        	_this._generateDocumentContent($elem, docId);
		        };
		        return tile;
		    };
		    
		    // Create document filter
		    this.filter = this.filterFactory.get($filters,function(){
		    	_this._documentFilterChanged();
		    });
		};
	},
	
	/*
	 * Goes over all the tiles and remove the class 'n2DisplayTiled_tile_current'
	 * to from tiles that should not have it. Also, it adds the class to the tile
	 * that should have it, if it exists.
	 * 
	 * When adding and removing the class, adjust the content accordingly.
	 */
	_adjustCurrentTile: function(docId){
		var _this = this;
		
		var $set = this._getDisplayDiv();
		var $docs = $set.find('.n2DisplayTiled_documents');
		
		var targetClass = null;
		if( docId ){
			targetClass = 'n2DisplayTiled_tile_' + $n2.utils.stringToHtmlId(docId);
		};
		
		// Remove
		$docs.find('.n2DisplayTiled_tile_current').each(function(){
			var $elem = $(this);
			if( targetClass && $elem.hasClass(targetClass) ) {
				// That's OK. Leave it
			} else {
				$elem.removeClass('n2DisplayTiled_tile_current');
				var id = $elem.attr('n2DocId');
				_this._generateDocumentContent($elem, id);
			};
		});
		
		// Add
		if( targetClass ) {
			$docs.find('.'+targetClass).each(function(){
				var $elem = $(this);
				if( $elem.hasClass('n2DisplayTiled_tile_current') ) {
					// That's OK. Leave it
				} else {
					$elem.addClass('n2DisplayTiled_tile_current');
					var id = $elem.attr('n2DocId');
					_this._generateCurrentDocumentContent($elem, id);
				};
			});
		};
	},
	
	_getDisplayDiv: function(){
		var divId = this.displayPanelName;
		return $('#'+divId);
	},
	
	_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	},

	/*
	 * Get a boolean option based on a name and return it. Defaults
	 * to false. If the option is found set in either the options map
	 * or the custom service, then the result is true.
	 */
	_getBooleanOption: function(optionName){
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
	},
	
	/*
	 * Look at documents stored in display code and return if one
	 * found with the correct identifier.
	 */
	_getCachedDocumentFromId: function(docId){
		if( this.displayedDocuments 
		 && this.displayedDocuments[docId]
		 && this.displayedDocuments[docId].doc ){
			return this.displayedDocuments[docId].doc;
		};
		
		if( this.currentDetails 
		 && this.currentDetails.docId === docId 
		 && this.currentDetails.doc ){
			return this.currentDetails.doc;
		};
		
		return null;
	},
	
	/*
	 * Given a document identifier, request the document content.
	 */
	_requestDocumentWithId: function(docId){
		// Look internally, first
		var doc = this._getCachedDocumentFromId(docId);
		if( doc ){
			this._receiveDocumentContent(doc);
			return;
		};
		
		if( this.requestService ){
			this.requestService.requestDocument(docId);
		};
	},
	
	_generateCurrentDocumentContent: function($elem, docId){
		$elem.empty();
		
		var waitClassName = 'n2DisplayTiled_wait_current_' + $n2.utils.stringToHtmlId(docId);
		$('<div>')
			.addClass(waitClassName)
			.addClass('n2DisplayTiled_tile_content')
			.text(docId)
			.appendTo($elem);
	},
	
	_generateDocumentContent: function($elem, docId){
		var _this = this;
		
		$elem.empty();
		
		$('<div>')
			.addClass('n2DisplayTiled_thumb n2DisplayTiled_wait_thumb_' + $n2.utils.stringToHtmlId(docId))
			.appendTo($elem);
		
		$('<div>')
			.addClass('n2DisplayTiled_wait_brief_' + $n2.utils.stringToHtmlId(docId))
			.addClass('n2DisplayTiled_tile_brief')
			.text(docId)
			.appendTo($elem);

		var clickInstalled = $elem.attr('n2Click');
		if( !clickInstalled ) {
			$elem.click(function(){
				_this._dispatch({
					type:'userSelect'
					,docId: docId
				});
			});
			$elem.attr('n2Click','installed');
		};
	},
	
	_performIntervalTask: function(){
		var $set = this._getDisplayDiv();
		var $docs = $set.find('.n2DisplayTiled_documents');

		if( this.currentDetails
		 && this.currentDetails.docId ){
			var $currentTile = $docs.find('.n2DisplayTiled_tile_current')
				.find('.n2DisplayTiled_tile_content');
			if( $currentTile.length > 0 ){
				var height = $currentTile.height();
				if( height != this.currentDetails.height ){
					this.currentDetails.height = height;
					var cellSize = this.grid.cellSize;
					this.grid.template = null;
					this.grid.templateFactory = new GridTemplateDocument(height,cellSize);
					this.grid.redraw(true);
				};
			};
		};
	},
	
	_documentFilterChanged: function(){
		this._updateDisplayedDocuments();
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var SchemaFilter = $n2.Class({
	
	elemId: null,
	
	changeCallback: null,
	
	schemaRepository: null,
	
	selectedSchema: null,
	
	initialize: function(elem, changeCallback, schemaRepository){
		var $elem = $(elem);
		this.elemId = $elem.attr('id');
		if( !this.elemId ){
			this.elemId = $n2.getUniqueId();
			$elem.attr('id',this.elemId);
		};
		
		this.changeCallback = changeCallback;
		this.schemaRepository = schemaRepository;
	},
	
	display: function(infos){
		var _this = this;
		
		var schemas = {};
		if( infos ){
			for(var i=0,e=infos.length; i<e; ++i){
				var info = infos[i];
				if( info.schema ){
					schemas[info.schema] = true;
				};
			};
		};
		
		var schemaNames = [];
		for(var schemaName in schemas){
			schemaNames.push(schemaName);
		};
		
		this.schemaRepository.getSchemas({
			names: schemaNames
			,onSuccess: function(schemas){
				_this._displaySchemas(schemas);
			}
			,onError: function(err){
				$n2.log('Error getting schemas for displaying schema filter',err);
			}
		});
	},
	
	filter: function(infos){
		if( this.selectedSchema ){
			var filteredInfos = [];
			
			for(var i=0,e=infos.length; i<e; ++i){
				var info = infos[i];
				
				if( info.schema === this.selectedSchema ){
					filteredInfos.push(info);
				};
			};
			
			return filteredInfos;
			
		} else {
			// Return all
			return infos;
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_displaySchemas: function(schemas){
		var _this = this;
		
		var $elem = this._getElem();
		
		$elem.empty();
		
		var clickFn = function(){
			var $a = $(this);
			
			var schemaName = $a.attr('n2SchemaName');
			schemaName = schemaName ? schemaName : null;
			
			_this._schemaSelected(schemaName);
			
			return false;
		};
		
		$('<a>')
			.attr('href','#')
			.text( _loc('All') )
			.addClass('n2DisplayTiled_filter')
			.addClass('n2DisplayTiled_filter_all')
			.appendTo($elem)
			.click(clickFn);

		var keepCurrentSelection = false;
		for(var i=0,e=schemas.length; i<e; ++i){
			var schema = schemas[i];
			
			if( schema.name === this.selectedSchema ){
				keepCurrentSelection = true;
			};
			
			var schemaLabel = schema.name;
			if( schema.label ){
				schemaLabel = _loc(schema.label);
			};

			$('<a>')
				.attr('href','#')
				.attr('n2SchemaName',schema.name)
				.text( schemaLabel )
				.addClass('n2DisplayTiled_filter_schema')
				.addClass('n2DisplayTiled_filter_schema_'+$n2.utils.stringToHtmlId(schema.name))
				.appendTo($elem)
				.click(clickFn);
		};
		
		if( !keepCurrentSelection ) {
			this.selectedSchema = null;
		};
		
		this._adjustSelection();
	},
	
	_adjustSelection: function(){
		var $elem = this._getElem();
		
		$elem.find('.n2DisplayTiled_filter_selected')
			.removeClass('n2DisplayTiled_filter_selected');
		
		if( this.selectedSchema ){
			$elem.find('.n2DisplayTiled_filter_schema_'+$n2.utils.stringToHtmlId(this.selectedSchema))
				.addClass('n2DisplayTiled_filter_selected');
			
		} else {
			$elem.find('.n2DisplayTiled_filter_all')
				.addClass('n2DisplayTiled_filter_selected');
		};
	},
	
	_schemaSelected: function(schemaName){
		this.selectedSchema = schemaName;
		this._adjustSelection();
		this.changeCallback();
	}
});

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var SchemaFilterFactory = $n2.Class({
	
	schemaRepository: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			schemaRepository: null
		},opts_);
		
		this.schemaRepository = opts.schemaRepository;
	},

	get: function(elem, changeCallback){
		return new SchemaFilter(elem, changeCallback, this.schemaRepository);
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

var ReferenceRelatedDocumentDiscovery = $n2.Class({
	
	documentSource: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: null
		},opts_);
		
		this.documentSource = opts.documentSource;
	},
	
	getRelatedDocumentIds: function(opts_){
		var opts = $n2.extend({
			doc: null
			,onSuccess: function(doc, refDocIds){}
			,onError: function(err){}
		},opts_);
		
		var doc = opts.doc;

		this.documentSource.getReferencesFromId({
			docId: doc._id
			,onSuccess: loadedRefIds
			,onError: function(errorMsg){
				opts.onError(errorMsg);
			}
		});
		
		function loadedRefIds(referenceIds){
			// Map to accumulate all references
			var docIdMap = {};
			
			// Forward references
			var references = [];
			$n2.couchUtils.extractLinks(doc, references);
			for(var i=0, e=references.length; i<e; ++i){
				var linkDocId = references[i].doc;
				docIdMap[linkDocId] = true;
			};
			
			// Reverse links
			for(var i=0, e=referenceIds.length; i<e; ++i){
				var linkDocId = referenceIds[i];
				docIdMap[linkDocId] = true;
			};
			
			// Convert map to array
			var refDocIds = [];
			for(var docId in docIdMap){
				refDocIds.push(docId);
			};
			
			opts.onSuccess(doc, refDocIds);
		};
	},
	
	areDocumentsRelated: function(opts_){
		var opts = $n2.extend({
			selectedDoc: null
			,relatedDoc: null
			,onRelated: function(selectedDoc, relatedDoc){}
			,onNotRelated: function(selectedDoc, relatedDoc){}
			,onError: function(err){}
		},opts_);
		
		var selectedDoc = opts.selectedDoc;
		var relatedDoc = opts.relatedDoc;
		
		// Try to find related document in selected document
		var references = [];
		$n2.couchUtils.extractLinks(selectedDoc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			if( linkDocId === relatedDoc._id ){
				opts.onRelated(selectedDoc, relatedDoc);
				return;
			};
		};
		
		// Try to find selected document in related document
		var references = [];
		$n2.couchUtils.extractLinks(relatedDoc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			if( linkDocId === selectedDoc._id ){
				opts.onRelated(selectedDoc, relatedDoc);
				return;
			};
		};
		
		// At this point, the two documents are deemed not related
		opts.onNotRelated(selectedDoc, relatedDoc);
	}
});

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

$n2.couchDisplayTiles = {
	TiledDisplay: TiledDisplay
	,SchemaFilterFactory: SchemaFilterFactory
	,ReferenceRelatedDocumentDiscovery: ReferenceRelatedDocumentDiscovery
};

})(jQuery,nunaliit2);
