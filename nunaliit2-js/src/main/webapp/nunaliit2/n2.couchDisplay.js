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
var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

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

var defaultOptions = {
	db: null
	,designDoc: null
	,displayPanelName: null
	,showService: null // asynchronous resolver
	,editor: null
	,uploadService: null
	,serviceDirectory: null
	,postProcessDisplayFunction: null
	,displayRelatedInfoFunction: null
	
	/*
	 * if defined, used by the map display logic to invoke a function to initiate 
	 * side panel display processing as a result of clicking a map feature.  
	 * 
	 * @return null => nothing done so continue with normal display processing; otherwise
	 *         display was done and the default clicked feature handling is bypassed.
	 */
	,translateCallback: null
	,classDisplayFunctions: {}
};	

$n2.couchDisplay = $n2.Class({
	
	options: null
	
	,mapAndControl: null
	
	,currentFeature: null
	
	,createRelatedDocProcess: null
	
	,requestService: null
	
	,defaultSchema: null
	
	,postProcessDisplayFns: null
	
	,dispatchHandle: null
	
	,initialize: function(options_) {
		var _this = this;
		
		this.options = $n2.extend({}, defaultOptions, options_);
		
		this.postProcessDisplayFns = [];
		if( typeof(this.options.postProcessDisplayFunction) === 'function' ){
			this.postProcessDisplayFns.push(this.options.postProcessDisplayFunction);
		};

		var dispatcher = this._getDispatcher();
		if( dispatcher ) {
			this.dispatchHandle = dispatcher.getHandle('n2.couchDisplay');
			var f = function(msg){
				_this._handleDispatch(msg);
			};
			dispatcher.register(this.dispatchHandle, 'selected', f);
			dispatcher.register(this.dispatchHandle, 'searchResults', f);
			dispatcher.register(this.dispatchHandle, 'editClosed', f);
			dispatcher.register(this.dispatchHandle, 'documentDeleted', f);
		};

		var requestService = this._getRequestService();
		if( requestService ){
			requestService.addDocumentListener(function(doc){
				_this._receiveRequestedDocument(doc);
			});
		};
		
		if( !this.options.displayRelatedInfoFunction ) {
			this.options.displayRelatedInfoFunction = function(opts_){
				_this._displayRelatedInfo(opts_);
			}
		};
		
		this.createRelatedDocProcess = new $n2.couchRelatedDoc.CreateRelatedDocProcess({
			db: this.options.db
			,schemaRepository: this._getSchemaRepository()
			,uploadService: this.options.uploadService
		});
	}

	,shouldSuppressNonApprovedMedia: function(){
		return this._getShowService().options.eliminateNonApprovedMedia;
	}

	,shouldSuppressDeniedMedia: function(){
		return this._getShowService().options.eliminateDeniedMedia;
	}

	,setSchema: function(schema) {
		this.defaultSchema = schema;
	}
	
	,getDisplayDivName: function(){
		var divId = null;
		if( this.options.displayPanelName ){
			divId = this.options.displayPanelName;
		} else if( this.mapAndControl ) {
			divId = this.mapAndControl.getSidePanelName();
		};
		return divId;
	}
	
	,getDisplayDiv: function(){
		var divId = this.getDisplayDivName();
		return $('#'+divId);
	}
	
	,_getShowService: function(){
		if( this.options.showService ){
			return this.options.showService;
		};
		
		return this.options.serviceDirectory.showService;
	}
	
	,_getRequestService: function(){
		return this.options.serviceDirectory.requestService;
	}
	
	,addPostProcessDisplayFunction: function(fn){
		if( typeof(fn) === 'function' ){
			this.postProcessDisplayFns.push(fn);
		};
	}
	
	,_getSchemaRepository: function(){
		var repository = null;
		if( this.options
		 && this.options.serviceDirectory ){
			repository = this.options.serviceDirectory.schemaRepository;
		};
		return repository;
	}
	
	,_displayObject: function($side, data, opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			onUpdated: function(){ 
			}
			,onDeleted: function() {
			}
			,suppressContributionReferences: false
			,showContributionReplyButton: false
			,showAddContributionButton: false
			,showRelatedContributions: false
		},opt_);

		var docId = data._id;
		
		var $elem = $('<div class="couchDisplay_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
		$side.append($elem);

		var $sElem = $('<div class="n2s_handleHover"></div>');
		$elem.append($sElem);
		
		this._getShowService().displayDocument($sElem, {
			onDisplayed: onDisplayed
		}, data);
		
		function onDisplayed($sElem, data, schema, opt_){
			$sElem.find('.n2s_referenceLink').each(function(){
				var $jq = $(this);
				_this._insertReferenceLink(data, $jq, opt);
				$jq.removeClass('n2s_referenceLink').addClass('n2s_insertedReferenceLink');
			});
			$sElem.find('.n2s_clickFindGeometryOnMap').each(function(){
				var $jq = $(this);
				_this._clickFindGeometryOnMap(data, $jq, opt);
				$jq.removeClass('n2s_clickFindGeometryOnMap');
			});
			$sElem.find('.n2s_clickAddContribution').each(function(){
				var $jq = $(this);
				_this._clickAddContribution(data, $jq, opt);
				$jq.removeClass('n2s_clickAddContribution');
			});
			$sElem.find('.n2s_clickEdit').each(function(){
				var $jq = $(this);
				_this._clickEdit(data, $jq, opt);
				$jq.removeClass('n2s_clickEdit');
			});
			$sElem.find('.n2s_clickDelete').each(function(){
				var $jq = $(this);
				_this._clickDelete(data, $jq, opt);
				$jq.removeClass('n2s_clickDelete');
			});
			$sElem.find('.n2s_clickAddLayerFromDefinition').each(function(){
				var $jq = $(this);
				_this._clickAddLayerFromDefinition(data, $jq, opt);
				$jq.removeClass('n2s_clickAddLayerFromDefinition');
			});
			
			if( _this.options.classDisplayFunctions ) {
				for(var className in _this.options.classDisplayFunctions){
					var fn = _this.options.classDisplayFunctions[className];
					var jqCallback = eachFunctionForClass(className, fn, data, opt);
					$sElem.find('.'+className).each(jqCallback);
				};
			};
			
			// Perform post-process function 
			for(var i=0,e=_this.postProcessDisplayFns.length; i<e; ++i){
				var fn = _this.postProcessDisplayFns[i];
				fn(data, $sElem);
			};
			
			_this._addButtons($elem, data, {
				schema: schema
				,related: true
				,geom: true
				,edit: true
				,'delete': true
			});
			
			var relatedInfoId = $n2.getUniqueId();
			var $div = $('<div id="'+relatedInfoId+'"></div>');
			$elem.append($div);
			_this.options.displayRelatedInfoFunction({
				divId: relatedInfoId
				,doc: data
				,schema: schema
			});
		};

		function eachFunctionForClass(className, fn, data, opt){
			return function(){
				var $jq = $(this);
				fn(data, $jq, opt);
				$jq.removeClass(className);
			};
		};
		

		// OLD CODE
//		var _this = this;
//		
//		// Specific schema?
//		if( data.nunaliit_schema ) {
//			$n2.schema.DefaultRepository.getSchema({
//				name: data.nunaliit_schema
//				,onSuccess: function(schema){
//					_this._displayObjectUsingSchema($elem, data, schema, opt_);
//				}
//				,onError: function(){
//					_this._displayObjectUsingSchema($elem, data, _this.defaultSchema, opt_);
//				}
//			});
//			
//		} else {
//			this._displayObjectUsingSchema($elem, data, this.defaultSchema, opt_);
//		};
	
		// Contribution Code
//		if( opt.showRelatedContributions 
//		 && this.mapAndControl.contributions
//		 ) {
//			$elem.append( $('<div class="placename_header">'+_loc('Contributions:')+'</div>') );
//			// Div to hold associated contributions
//			var contId = $n2.getUniqueId();
//			var $div = $('<div id="'+contId+'"></div>');
//			$elem.append($div);
//			this.mapAndControl.contributions.getContributionsForReference({
//				docId: data._id
//				,onSuccess: function(contributions){
//					_this.reportContributions(data, opt, contId, contributions);
//				}
//			});
//		};
	}
	
	,_addButtons: function($elem, data, opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			schema: null
			,focus: false
			,related: false
			,geom: false
			,edit: false
			,'delete': false
		},opt_);

		var $buttons = $('<div class="nunaliit_form_linkset"></div>');
		$elem.append( $buttons );

		var firstButton = true;

 		// Show 'focus' button
 		if( opt.focus 
 		 && data
 		 && data._id ) {
 			if( firstButton ) {
 				firstButton = false;
 			} else {
 				$buttons.append( $('<span>&nbsp;</span>') );
 			};
			var $focusButton = $('<a href="#"></a>');
			var focusText = _loc('Focus');
			$focusButton.text( focusText );
			$buttons.append($focusButton);
			$focusButton.click(function(){
				_this.DisplayClickedDocument(data._id);
				return false;
			});
			addClasses($focusButton, focusText);
 		};

 		// Show 'edit' button
 		if( opt.edit 
 		 && $n2.couchMap.canEditDoc(data) ) {
 			if( firstButton ) {
 				firstButton = false;
 			} else {
 				$buttons.append( $('<span>&nbsp;</span>') );
 			};
			var $editButton = $('<a href="#"></a>');
			var editText = _loc('Edit');
			$editButton.text( editText );
			$buttons.append($editButton);
			$editButton.click(function(){
				_this.performDocumentEdit(data, opt);
				return false;
			});
			addClasses($editButton, editText);
 		};

 		// Show 'delete' button
 		if( opt['delete'] 
 		 && $n2.couchMap.canDeleteDoc(data) ) {
 			if( firstButton ) {
 				firstButton = false;
 			} else {
 				$buttons.append( $('<span>&nbsp;</span>') );
 			};
			var $deleteButton = $('<a href="#"></a>');
			var deleteText = _loc('Delete');
			$deleteButton.text( deleteText );
			$buttons.append($deleteButton);
			$deleteButton.click(function(){
				_this.performDocumentDelete(data, opt);
				return false;
			});
			addClasses($deleteButton, deleteText);
 		};
		
 		// Show 'add related' button
		if( opt.related
		 && opt.schema
		 && opt.schema.relatedSchemaNames 
		 && opt.schema.relatedSchemaNames.length
		 ) {
 			if( firstButton ) {
 				firstButton = false;
 			} else {
 				$buttons.append( $('<span>&nbsp;</span>') );
 			};
			var $addRelatedButton = $('<a href="#"></a>');
			var addRelatedText = _loc('Add Related');
			$addRelatedButton.text( addRelatedText );
			$buttons.append($addRelatedButton);
			$addRelatedButton.click(function(){
				_this.addRelatedDocument(data._id, opt.schema.relatedSchemaNames);
				return false;
			});
			addClasses($addRelatedButton, addRelatedText);
		};
		
 		// Show 'find on map' button
		if( opt.geom
		 && data 
		 && data.nunaliit_geom 
		 && this.mapAndControl
		 && this.mapAndControl.centerMapOnFeatureId
		 ) {
 			if( firstButton ) {
 				firstButton = false;
 			} else {
 				$buttons.append( $('<span>&nbsp;</span>') );
 			};
			var $findGeomButton = $('<a href="#"></a>');
			var findGeomText = _loc('Find on Map');
			$findGeomButton.text( findGeomText );
			$buttons.append($findGeomButton);

			var x = (data.nunaliit_geom.bbox[0] + data.nunaliit_geom.bbox[2]) / 2;
			var y = (data.nunaliit_geom.bbox[1] + data.nunaliit_geom.bbox[3]) / 2;
			
			$findGeomButton.click(function(){
				_this.mapAndControl.centerMapOnFeatureId({fid:data._id}, x, y);
				return false;
			});
			addClasses($findGeomButton, findGeomText);
		};

		/**
		 * Generate and insert css classes for the generated element, based on the given tag.
		 * @param elem the jQuery element to be modified
		 * @param tag the string tag to be used in generating classes for elem
		 */
		function addClasses(elem, tag) {
			elem.addClass('nunaliit_form_link');
			
			var compactTag = tag;
			var spaceIndex = compactTag.indexOf(' ');
			while (-1 !== spaceIndex) {
				compactTag = compactTag.slice(0,spaceIndex) + '_' +
					compactTag.slice(spaceIndex + 1);
				spaceIndex = compactTag.indexOf(' ');
			};
			elem.addClass('nunaliit_form_link_' + compactTag.toLowerCase());
		};
		
	}
	
	,_insertReferenceLink: function(data, $referenceLink, opt_) {
		var _this = this;
		
		var refDocId = $referenceLink.text();
		
		$referenceLink.click(function(){
			var $div = _this.getDisplayDiv();
			_this.DisplayDocumentId($div, refDocId);
			return false;
		});
		
		if( _this._getShowService() ) {
			_this._getShowService().printBriefDescription($referenceLink, refDocId);
		};
	}
	
	,_clickFindGeometryOnMap: function(data, $jq, opt_) {
		var _this = this;

		if( data 
		 && data.nunaliit_geom ) {
			var x = (data.nunaliit_geom.bbox[0] + data.nunaliit_geom.bbox[2]) / 2;
			var y = (data.nunaliit_geom.bbox[1] + data.nunaliit_geom.bbox[3]) / 2;
			
			$jq.click(function(){
			_this.mapAndControl.centerMapOnFeatureId({fid:data._id}, x, y);
				return false;
			});
		} else {
			$jq.remove();
		};
	}
	
	,_clickAddContribution: function(data, $jq, opt_) {
		var _this = this;

		var referenceId = data._id;
		var contId = null;
		if( data.nunaliit_contribution
		 && data.nunaliit_contribution.nunaliit_type === 'contribution'
		 && data.nunaliit_contribution.reference
		 && data.nunaliit_contribution.reference.doc
		 ) {
			referenceId = data.nunaliit_contribution.reference.doc;
			contId = data._id;
		};
 			
		$jq.click(function(){
			_this.performContributionReply(referenceId, opt_, contId);
			return false;
		});
	}
	
	,_clickEdit: function(data, $jq, opt_) {
		var _this = this;

 		// Show 'edit' button
 		if( $n2.couchMap.canEditDoc(data) ) {
			$jq.click(function(){
				_this.performDocumentEdit(data, opt_);
				return false;
			});
 		} else {
 			$jq.remove();
 		};
	}
	
	,_clickDelete: function(data, $jq, opt_) {
		var _this = this;

		var referenceId = data._id;
 			
 		// Show 'delete' button
 		if( $n2.couchMap.canDeleteDoc(data) ) {
			$jq.click(function(){
				_this.performDocumentDelete(data, opt_);
				return false;
			});
 		} else {
 			$jq.remove();
 		};
	}
	
	,_clickAddLayerFromDefinition: function(data, $jq, opt_) {
		var _this = this;

		var layerDefinition = data.nunaliit_layer_definition;

		if( layerDefinition ) {
			$jq.click(function(){
				_this._addAndDisplayLayerFromDefinition(layerDefinition, opt_);
				return false;
			});
		} else {
			$jq.remove();
		};
	}
	
	,_localize: function(data, $jq, opt_) {
		var _this = this;

		var text = $jq.text();
		var locText = $n2.loc(text,'display');
		if( locText ) {
			$jq.text(locText);
		};
	}

	,_addAndDisplayLayerFromDefinition: function(layerDefinition, opt_) {
		// Look if layer was already inserted
		var olLayer = this.mapAndControl.findLayerFromId(layerDefinition.id);
		if( !olLayer ) {
			this.mapAndControl.addLayer({
				id: layerDefinition.id
				,name: layerDefinition.name
				,couchDb: {
					viewName: 'geom'
					,layerName: layerDefinition.id
					,db: this.options.db
					,designDoc: this.options.designDoc
				}
			});
			olLayer = this.mapAndControl.findLayerFromId(layerDefinition.id);
		};
		
		// Turn on
		if( olLayer ) {
			olLayer.setVisibility(true);
		};

		// Zoom
		if( layerDefinition.bbox ) {
			var bounds = layerDefinition.bbox;
			this.mapAndControl.setNewExtent(bounds, 'EPSG:4326');
		};
	}
	
	,_displayBrief: function($elem,doc) {
		var defaultSchema = this.defaultSchema;
		
		if( doc.nunaliit_schema ) {
			var schemaRepository = this._getSchemaRepository();
			if( schemaRepository ) {
				schemaRepository.getSchema({
					name: doc.nunaliit_schema
					,onSuccess: function(schema) {
						schema.brief(doc,$elem);
					}
					,onError: function(){
						if( defaultSchema ) {
							defaultSchema.brief(doc,$elem);
						} else {
							// leave as is
						};
					}
				});
			};
			
		} else if( defaultSchema ) {
			defaultSchema.brief(doc,$elem);
			
		} else {
			// leave as is
		};
	}
	
	,_displayRelatedInfo: function(opts_){
		var opts = $n2.extend({
			divId: null
			,doc: null
			,schema: null
		},opts_);
		
		var _this = this;
		var $elem = $('#'+opts.divId);
		var doc = opts.doc;
		var docId = doc._id;
		var schema = opts.schema;
		
		if( !schema ){
			return;
		};
		
 		// Add section with related documents
		if( schema.relatedSchemaNames 
		 && schema.relatedSchemaNames.length
		 ) {
			for(var i=0,e=schema.relatedSchemaNames.length; i<e; ++i){
				var relatedSchemaName = schema.relatedSchemaNames[i];
				
				// Div to hold documents with this schema
				var contId = $n2.getUniqueId();
				var $div = $('<div id="'+contId+'"></div>');
				$elem.append($div);
				
				fetchRelatedDocuments(contId, relatedSchemaName, docId);
			};
		};

		function fetchRelatedDocuments(contId, relatedSchemaName, docId){
			_this.options.designDoc.queryView({
				viewName: 'link-references-schemas'
				,keys: [[docId,relatedSchemaName]]
				,onSuccess: function(rows){
					var relatedDocIds = [];
					var seenDocIds = {};
					for(var i=0,e=rows.length;i<e;++i){
						var id = rows[i].id;
						if( !seenDocIds[id] ) {
							seenDocIds[id] = true;
							relatedDocIds.push(id);
						};
					};
					_this._displayRelatedDocuments(contId, relatedSchemaName, relatedDocIds);
				}
			});
		}
	}
	
	
	,_displayRelatedDocuments: function(contId, relatedSchemaName, relatedDocIds){
		var _this = this;
		var $container = $('#'+contId);
		
		if( !relatedDocIds || relatedDocIds.length < 1 ) {
			$container.remove();
			return;
		};
		
		//legacyDisplay();
		blindDisplay();
		
		function blindDisplay(){

			var blindId = $n2.getUniqueId();
			var $blindWidget = $('<div id="'+blindId+'" class="_n2DocumentListParent"><h3></h3><div style="padding-left:0px;padding-right:0px;"></div></div>');
			$container.append($blindWidget);
			var bw = $n2.blindWidget($blindWidget,{
				data: relatedDocIds
				,onBeforeOpen: beforeOpen
			});
			bw.setHtml('<span class="_n2DisplaySchemaName"></span> (<span class="_n2DisplayDocCount"></span>)');
			$blindWidget.find('._n2DisplaySchemaName').text(relatedSchemaName);
			$blindWidget.find('._n2DisplayDocCount').text(''+relatedDocIds.length);
			
			var schemaRepository = _this._getSchemaRepository();
			if( schemaRepository ){
				schemaRepository.getSchema({
					name: relatedSchemaName
					,onSuccess: function(schema){
						var $blindWidget = $('#'+blindId);
						$blindWidget.find('._n2DisplaySchemaName').text(schema.getLabel());
					}
				});
			};

			function beforeOpen(info){
				var $div = info.content;
				
				var $dataloaded = $div.find('.___n2DataLoaded');
				if( $dataloaded.length > 0 ) {
					// nothing to do
					return;
				};
				
				// Fetch data
				var docIds = info.data;
				$div.empty();
				$div.append( $('<div class="___n2DataLoaded" style="display:none;"></div>') );
				for(var i=0,e=docIds.length; i<e; ++i){
					var docId = docIds[i];
					
					var $docWrapper = $('<div></div>');
					$div.append($docWrapper);
					if ( 0 === i ) { // mark first and last one
						$docWrapper.addClass('n2_search_startResults');
					};
					if ( (e-1) === i ) {
						$docWrapper.addClass('n2_search_endResults');
					};
					$docWrapper
						.addClass('_n2DocumentListEntry')
						.addClass('_n2DocumentListEntry_'+$n2.utils.stringToHtmlId(docId))
						.addClass('olkitSearchMod2_'+(i%2))
						.addClass('n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId))
						.addClass('n2SupressDeniedMedia_'+$n2.utils.stringToHtmlId(docId))
						;
					
					var $doc = $('<div></div>');
					$docWrapper.append($doc);

					if( _this._getShowService() ) {
						_this._getShowService().printDocument($doc,docId);
					} else {
						$doc.text(docId);
					};
					if( _this._getRequestService() ) {
						var $buttonDiv = $('<div class="displayRelatedButton displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
						$docWrapper.append($buttonDiv);
						_this._getRequestService().requestDocument(docId);
					};
				};
			};
		};
		
//		function legacyDisplay() {
//			var $title = $('<h3></h3>');
//			$title.text(relatedSchemaName);
//			$container.append( $title );
//			
//			for(var i=0,e=relatedDocIds.length; i<e; ++i){
//				var relatedDocId = relatedDocIds[i];
//				
//				var dClass = 'olkitSearchMod2_'+(i%2);
//				var $div = $('<div class="'+dClass+'"></div>');
//				$container.append($div);
//	
//				var $contentDiv = $('<div class="n2s_handleHover"></div>');
//				$div.append($contentDiv);
//				this._getShowService().printDocument($contentDiv, relatedDocId);
//	
//				if( this._getRequestService() ) {
//					var $buttonDiv = $('<div class="displayRelatedButton displayRelatedButton_'+$n2.utils.stringToHtmlId(relatedDocId)+'"></div>');
//					$div.append($buttonDiv);
//					this._getRequestService().requestDocument(relatedDocId);
//				};
//			};
//		};
	}

	,addRelatedDocument: function(docId, relatedSchemaNames){
		var _this = this;
		
		this.createRelatedDocProcess.addRelatedDocumentFromSchemaNames({
			docId: docId
			,relatedSchemaNames: relatedSchemaNames
			,onSuccess: function(docId){
				_this.RefreshClickedFeature();
			}
		});
	}
	
	,_receiveRequestedDocument: function(doc){

		var _this = this;
		var docId = doc._id;
		
		$('.displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)).each(function(){
			var $buttonDiv = $(this);
			$buttonDiv.empty();
			_this._addButtons($buttonDiv, doc, {
				focus: true
				,geom: true
			});
		});
		
		if( this.shouldSuppressNonApprovedMedia() ){
			if( $n2.couchMap.documentContainsMedia(doc) 
			 && false == $n2.couchMap.documentContainsApprovedMedia(doc) ) {
				$('.n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId)).each(function(){
					var $div = $(this);
					var $parent = $div.parent();
					$div.remove();
					_this._fixDocumentList($parent);
				});
			};
		} else if( this.shouldSuppressDeniedMedia() ){
			if( $n2.couchMap.documentContainsMedia(doc) 
			 && $n2.couchMap.documentContainsDeniedMedia(doc) ) {
				$('.n2SupressDeniedMedia_'+$n2.utils.stringToHtmlId(docId)).each(function(){
					var $div = $(this);
					var $parent = $div.parent();
					$div.remove();
					_this._fixDocumentList($parent);
				});
			};
		};
	}
	
	,_fixDocumentList: function($elem){
		if( $elem.hasClass('_n2DocumentListParent') ) {
			var $relatedDiv = $elem;
		} else {
			$relatedDiv = $elem.parents('._n2DocumentListParent');
		};
		if( $relatedDiv.length > 0 ){
			var $docDiv = $relatedDiv.find('._n2DocumentListEntry');
			var count = $docDiv.length;
			$relatedDiv.find('._n2DisplayDocCount').text(''+count);
			
			$docDiv.each(function(i){
				var $doc = $(this);
				$doc.removeClass('olkitSearchMod2_0');
				$doc.removeClass('olkitSearchMod2_1');
				$doc.addClass('olkitSearchMod2_'+(i%2));
			});
		};
	}
	
	,DisplayClickedDocument: function(docId) {
		var _this = this;
		
		var displayDivName = this.getDisplayDivName();

		if( null != docId 
		 && null != displayDivName ) {
			var $displayDiv = $('#'+displayDivName);
			
			$displayDiv.empty();
			$displayDiv.text('Document '+docId);
			
			this.currentFeature = null;
			
			// Get document
			this.options.db.getDocument({
				docId: docId
				,onSuccess: function(doc) {
					if( doc.place
					 && doc.place.nunaliit_type
					 && doc.place.nunaliit_type === 'placename' ) {
						_this.DisplayClickedMapFeature(doc, {displayDiv: displayDivName});
					} else {
						var $displayDiv = $('#'+displayDivName);
						$displayDiv.empty();
						if (null !== _this.options.translateCallback) {
							var retVal = _this.options.translateCallback(doc,{displayDiv: displayDivName});
							if (null !== retVal) {
								return;
							};
						};
						_this._displayObject($displayDiv, doc, {
							onUpdated: function(){
								_this.DisplayClickedDocument(docId)
							}
							,onDeleted: function() {
								$displayDiv.empty();
							}
						});
					};
				}
			});
		};
	}
	
	,DisplayClickedMapFeature: function(data, options) {
		var _this = this;
		
		var $displayDiv = $('#'+options.displayDiv);
		
		$displayDiv.empty();
		
		/*
		 * If translateCallback defined, invoke it here and exit.  It may
		 * make some decisions and then reinvoke display functions (such as
		 * DisplayDocument, defined below).
		 */
		if (null !== this.options.translateCallback) {
			var retVal = this.options.translateCallback(data, options);
			if (null !== retVal) {
				return;
			};
		};
		
		var displayObjectOptions = {
			showAddContributionButton: true
			,showRelatedContributions: true
			,onUpdated: function() {
				_this.DisplayClickedMapFeature(data, options);
			}
			,onDeleted: function() {
				$displayDiv.empty();
			}
		};
		this._displayObject($displayDiv, data, displayObjectOptions);
	}
	
	,FeatureUpdated: function(feature) {

		if( this.currentFeature
		 && feature
		 && this.currentFeature.fid
		 && feature.fid == this.currentFeature.fid
		 && this.currentFeature.feature
		 && this.currentFeature.options
		 ) {
			this.currentFeature.feature = feature;
			this.RefreshClickedFeature();
		};
	}

	,Configure: function(mapAndControl_) {
		this.mapAndControl = mapAndControl_;
	}

	,ClickedFeatureHandler: function(feature, options_) {
		var _this = this;
		
		var options = $.extend({
			displayDiv: null // must be supplied
		},options_);

		if( null != feature ) {
			this.currentFeature = {
				fid: feature.fid
				,feature: feature
				,options: options
			};

			this.DisplayClickedMapFeature(feature.data, options);
		};
	}
	
	,RefreshClickedFeature: function(){
		// Verify if our display is still in place
		var fid = this.currentFeature ? this.currentFeature.fid : null;
		var $elems = $('.couchDisplay_'+$n2.utils.stringToHtmlId(fid));
		if( $elems.length > 0
		 && this.currentFeature
		 && this.currentFeature.feature
		 && this.currentFeature.feature.data
		 ) {
			// If still displayed, then refresh
			this.DisplayClickedMapFeature(
					this.currentFeature.feature.data
					,this.currentFeature.options
				);
		};
	}
	
	,reportContributions: function(data, options_, contId, contributions) {
		var $div = $('#'+contId);
		if( $div.length > 0 
		 && this.mapAndControl.contributions ) {
			$div.empty();

			// Sort contributions
			var map = {};
			for(var i=0,e=contributions.length; i<e; ++i) {
				var c = contributions[i];
				var docId = c._id;
				var replyTo = null;
				if( c.nunaliit_contribution
				 && c.nunaliit_contribution.reply 
				 && c.nunaliit_contribution.reply.nunaliit_type 
				 && c.nunaliit_contribution.reply.nunaliit_type === 'reference' 
			     && c.nunaliit_contribution.reply.doc ) {
					replyTo = c.nunaliit_contribution.reply.doc;
				};
				map[docId] = {
					doc: c
					,replies: []
					,replyTo: replyTo
				};
			};
			
			for(var docId in map) {
				var c = map[docId];
				if( c.replyTo ) {
					if( map[c.replyTo] ) {
						map[c.replyTo].replies.push(c);
					} else {
						// Turn off replyTo, can not find reference
						c.replyTo = null;
					};
				}
			};
			
			// Get top replies
			var topContributions = [];
			for(var docId in map) {
				var c = map[docId];
				if( null == c.replyTo ) {
					topContributions.push(c);
				};
			};
			topContributions.sort(docCreationTimeSort);
			
			for(var i=0,e=topContributions.length; i<e; ++i) {
				this.reportContribution(data, options_, $div, topContributions[i]);
			};
		};
	}
	
	,reportContribution: function(data, options_, $elem, contributionObj) {
		var _this = this;
		var $c = $('<div class="contributionReply"></div>');
		$elem.append($c);

		var contributionOptions = $n2.extend(
			{}
			,options_
			,{
				suppressContributionReferences:true
				,showContributionReplyButton: true
				,showRelatedContributions: false
				,onDeleted: options_.onUpdated // Deleting a contribution should update parent
			}
		);
		this._displayObject($c,contributionObj.doc,contributionOptions);

		if( contributionObj.replies.length > 0 ) {
			contributionObj.replies.sort(docCreationTimeSort);
			for(var i=0,e=contributionObj.replies.length; i<e; ++i) {
				var c = contributionObj.replies[i];
				this.reportContribution(data, options_, $c, c);
			};
		};
	}
	
	,performContributionReply: function(referenceId, options_, contId) {
		var _this = this;
		
		// Check that we are logged in
		if( $.NUNALIIT_AUTH ) {
			if( false == $.NUNALIIT_AUTH.isLoggedIn() ) {
				$.NUNALIIT_AUTH.login({
					onSuccess: function(result,options) {
						_this.performContributionReply(referenceId, options_, contId);
					}
				});
				return;
			};
		};

		var $contributionDialog = $('<div></div>');

		this.mapAndControl.contributions.buildAddContributionForm({
			elem: $contributionDialog
			,referenceDocId: referenceId
			,replyContributionId: contId
			,onSuccess: function(){
				$contributionDialog.dialog('close');
				options_.onUpdated();
			}
			,onCancel: function(){
				$contributionDialog.dialog('close');
			}
		});
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Add Contribution')
			,modal: true
			,width: 740
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$contributionDialog.dialog(dialogOptions);
	}
	
	,performDocumentEdit: function(data, options_) {
		var editing = false;
		if( this.mapAndControl ) {
			editing = this.mapAndControl.initiateFeatureEdit(data._id);
		};
		if( !editing 
		 && this.options.editor 
		 && this.options.editor.showDocumentForm
		 ) {
			var panelName = this.getDisplayDivName();
			this.options.editor.showDocumentForm(data,{
				panelName: panelName
			});
		};
	}
	
	,performDocumentDelete: function(data, options_) {
		var _this = this;

		if( confirm( _loc('You are about to delete this document. Do you want to proceed?') ) ) {
			this.options.db.deleteDocument({
				data: data
				,onSuccess: function() {
					if( _this.mapAndControl ) {
						_this.mapAndControl.removeFeature(data._id);
					};
					_this._dispatch({
						type: 'documentDeleted'
						,docId: data._id
					});
					if( options_.onDeleted ) {
						options_.onDeleted();
					};
				}
			});
		};
	}
	
	,DisplayDocument: function($set, doc) {

		var _this = this;
		
		this._displayObject($set, doc, {
			onUpdated: function() {
				_this.DisplayDocument($set, doc);
			}
			,onDeleted: function() {
				$set.empty();
			}
		});
	}
	
	,DisplayDocumentId: function($set, docId) {

		var _this = this;
		
		$set.empty();

		this.options.db.getDocument({
			docId: docId
			,onSuccess: function(doc) {
				_this.DisplayDocument($set, doc);
			}
			,onError: function(err) {
				$set.text( _loc('Unable to retrieve document') );
			}
		});
	}
	
	,_handleDispatch: function(msg){
		// Selected document
		if( msg.type === 'selected' ) {
			if( msg.doc ) {
				var $div = this.getDisplayDiv();
				this.DisplayDocument($div, msg.doc);
				
			} else if( msg.docId ) {
				var $div = this.getDisplayDiv();
				this.DisplayDocumentId($div, msg.docId);
				
			} else if( msg.docs ) {
				var $div = this.getDisplayDiv();
				this.DisplayMultipleDocuments($div, msg.docs);
				
			} else if( msg.docIds ) {
				var $div = this.getDisplayDiv();
				this.DisplayMultipleDocumentIds($div, msg.docIds)
			};
			
		} else if( msg.type === 'searchResults' ) {
			this._displaySearchResults(msg.results);
			
		} else if( msg.type === 'editClosed' ) {
			var docId = msg.doc._id;
			var deleted = msg.deleted;
			if( !deleted ) {
				var $div = this.getDisplayDiv();
				this.DisplayDocumentId($div, docId);
			};
			
		} else if( msg.type === 'documentDeleted' ) {
			var docId = msg.docId;
			this._handleDocumentDeletion(docId);
		};
	}
	
	,DisplayMultipleDocuments: function($container, docs) {

		var _this = this;
		
		var $list = $('<div class="_n2DocumentListParent"></div>');
		$container.append($list);
		
		for(var i=0,e=docs.length; i<e; ++i) {
			var doc = docs[i];
			
			var $div = $('<div></div>')
				.addClass('_n2DocumentListEntry')
				.addClass('_n2DocumentListEntry_'+$n2.utils.stringToHtmlId(docId))
				.addClass('olkitSearchMod2_'+(i%2))
				.addClass('n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId))
				.addClass('n2SupressDeniedMedia_'+$n2.utils.stringToHtmlId(docId))
				;
			$list.append($div);

			var $contentDiv = $('<div class="n2s_handleHover"></div>');
			$div.append($contentDiv);
			this._getShowService().displayBriefDescription($contentDiv, {}, doc);

			var $buttonDiv = $('<div></div>');
			$div.append($buttonDiv);
			this._addButtons($buttonDiv, doc, {focus:true,geom:true});
		};
	}
	
	,DisplayMultipleDocumentIds: function($container, docIds) {

		var _this = this;
		
		var $list = $('<div class="_n2DocumentListParent"></div>');
		$container.append($list);
		
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			
			var $div = $('<div></div>')
				.addClass('_n2DocumentListEntry')
				.addClass('_n2DocumentListEntry_'+$n2.utils.stringToHtmlId(docId))
				.addClass('olkitSearchMod2_'+(i%2))
				.addClass('n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId))
				.addClass('n2SupressDeniedMedia_'+$n2.utils.stringToHtmlId(docId))
				;
			$list.append($div);

			var $contentDiv = $('<div class="n2s_handleHover"></div>');
			$div.append($contentDiv);
			this._getShowService().printBriefDescription($contentDiv, docId);
			
			if( this._getRequestService() ) {
				var $buttonDiv = $('<div class="displayRelatedButton displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
				$div.append($buttonDiv);
				this._getRequestService().requestDocument(docId);
			};
		};
	}
	
	,_displaySearchResults: function(results){
		var ids = [];
		if( results && results.sorted && results.sorted.length ) {
			for(var i=0,e=results.sorted.length; i<e; ++i){
				ids.push(results.sorted[i].id);
			};
		};
		var $div = this.getDisplayDiv();
		$div.empty();
		if( ids.length < 1 ) {
			$div.append( $('<div>'+_loc('Search results empty')+'</div>') );
		} else {
			this.DisplayMultipleDocumentIds($div, ids)
		};
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.serviceDirectory 
		 && this.options.serviceDirectory.dispatchService ) {
			d = this.options.serviceDirectory.dispatchService;
		};
		return d;
	}
	
	,_dispatch: function(m){
		var dispatcher = this._getDispatcher();
		if( dispatcher ) {
			var h = dispatcher.getHandle('n2.couchDisplay');
			dispatcher.send(h,m);
		};
	}
	
	,_handleDocumentDeletion: function(docId){
		var _this = this;
		
		// Main document displayed
		var $elems = $('.couchDisplay_'+$n2.utils.stringToHtmlId(docId));
		$elems.remove();
		
		// Documents in list
		var $entries = $('._n2DocumentListEntry_'+$n2.utils.stringToHtmlId(docId));
		$entries.each(function(){
			var $entry = $(this);
			var $p = $entry.parent();
			$entry.remove();
			_this._fixDocumentList($p);
		});
		
	}
});

// Exports
$.olkitDisplay = null; 
//{
//	Configure: Configure
//	,ClickedFeatureHandler: ClickedFeatureHandler
//	,FeatureUpdated: FeatureUpdated
//	
//	// Specific to couchDb
//	,DisplayDocument: DisplayDocument
//};

})(jQuery,nunaliit2);
