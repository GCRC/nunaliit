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

;(function($,$n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchDisplay';

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

function boolOption(optionName, options, customService){
	var flag = false;
	
	if( options[optionName] ){
		flag = true;
	};
	
	if( customService && !flag ){
		var o = customService.getOption(optionName);
		if( o ){
			flag = true;
		};
	};
	
	return flag;
};

// ===================================================================================

var Display = $n2.Class({
	
	options: null
	
	,documentSource: null
	
	,displayPanelName: null
	
	,currentFeature: null
	
	,createRelatedDocProcess: null
	
	,defaultSchema: null
	
	,displayRelatedInfoProcess: null
	
	,displayOnlyRelatedSchemas: null
	
	,displayBriefInRelatedInfo: null
	
	,restrictAddRelatedButtonToLoggedIn: null
	
	,restrictReplyButtonToLoggedIn: null
	
	,classDisplayFunctions: null
	
	,showService: null
	
	,uploadService: null
	
	,customService: null
	
	,authService: null
	
	,requestService: null
	
	,dispatchService: null
	
	,schemaRepository: null
	
	,initialize: function(opts_) {
		var _this = this;
		
		var opts = $n2.extend({
			documentSource: null
			,displayPanelName: null
			,showService: null // asynchronous resolver
			,uploadService: null
			,createDocProcess: null
			,serviceDirectory: null
			,displayRelatedInfoFunction: null // legacy
			,displayRelatedInfoProcess: null
			,classDisplayFunctions: {}
		
			// Boolean options
			,displayOnlyRelatedSchemas: false
			,displayBriefInRelatedInfo: false
			,restrictAddRelatedButtonToLoggedIn: false
			,restrictReplyButtonToLoggedIn: false
		}, opts_);
		
		this.documentSource = opts.documentSource;
		this.displayPanelName = opts.displayPanelName;
		this.uploadService = opts.uploadService;
		this.classDisplayFunctions = opts.classDisplayFunctions;
		this.createRelatedDocProcess = opts.createDocProcess;
		
		if( opts.serviceDirectory ){
			this.showService = opts.serviceDirectory.showService;
			this.customService = opts.serviceDirectory.customService;
			this.authService = opts.serviceDirectory.authService;			
			this.requestService = opts.serviceDirectory.requestService;
			this.schemaRepository = opts.serviceDirectory.schemaRepository;
			this.dispatchService = opts.serviceDirectory.dispatchService;
		};
		
		if( !this.showService ){
			this.showService = opts.showService;
		};
		
		this.displayOnlyRelatedSchemas = 
			boolOption('displayOnlyRelatedSchemas',opts,this.customService);
		this.displayBriefInRelatedInfo = 
			boolOption('displayBriefInRelatedInfo',opts,this.customService);
		this.restrictAddRelatedButtonToLoggedIn = 
			boolOption('restrictAddRelatedButtonToLoggedIn',opts,this.customService);
		this.restrictReplyButtonToLoggedIn = 
			boolOption('restrictReplyButtonToLoggedIn',opts,this.customService);
			
		var customService = this.customService;

		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			var f = function(msg, addr, dispatcher){
				_this._handleDispatch(msg, addr, dispatcher);
			};
			dispatcher.register(DH, 'selected', f);
			dispatcher.register(DH, 'searchResults', f);
			dispatcher.register(DH, 'documentDeleted', f);
			dispatcher.register(DH, 'authLoggedIn', f);
			dispatcher.register(DH, 'authLoggedOut', f);
			dispatcher.register(DH, 'editClosed', f);
			dispatcher.register(DH, 'documentContentCreated', f);
			dispatcher.register(DH, 'documentContentUpdated', f);
		};

		if( this.requestService ){
			this.requestService.addDocumentListener(function(doc){
				_this._refreshDocument(doc);
				_this._populateWaitingDocument(doc);
			});
		};
		
		// Function to display related information
		if( opts.displayRelatedInfoProcess ){
			this.displayRelatedInfoProcess = opts.displayRelatedInfoProcess;
		};
		if( !this.displayRelatedInfoProcess 
		 && opts.displayRelatedInfoFunction ){
			this.displayRelatedInfoProcess 
				= new LegacyDisplayRelatedFunctionAdapter(opts.displayRelatedInfoFunction);
		};
		if( !this.displayRelatedInfoProcess 
		 && customService ){
			var displayRelatedProcess = customService.getOption('displayRelatedInfoProcess');
			if( displayRelatedProcess ){
				this.displayRelatedInfoProcess = displayRelatedProcess;
			};
		};
		if( !this.displayRelatedInfoProcess 
		 && customService ){
			var displayRelatedFn = customService.getOption('displayRelatedInfoFunction');
			if( typeof displayRelatedFn === 'function' ){
				this.displayRelatedInfoProcess 
					= new LegacyDisplayRelatedFunctionAdapter(displayRelatedFn);
			};
		};
		if( !this.displayRelatedInfoProcess ) {
			if( this.displayOnlyRelatedSchemas ) {
				this.displayRelatedInfoProcess 
					= new LegacyDisplayRelatedFunctionAdapter(DisplayRelatedInfo);
			} else {
				this.displayRelatedInfoProcess 
					= new LegacyDisplayRelatedFunctionAdapter(DisplayLinkedInfo);
			};
		};

		$('body').addClass('n2_display_format_classic');
		
		$n2.log('ClassicDisplay',this);
	}

	// external
	,setSchema: function(schema) {
		this.defaultSchema = schema;
	}
	
	,_displayDocument: function($set, doc) {

		var _this = this;
		
		$set.empty();
		
		this._displayObject($set, doc, {
			onUpdated: function() {
				_this._displayDocument($set, doc);
			}
			,onDeleted: function() {
				$set.empty();
			}
		});
	}

	,_shouldSuppressNonApprovedMedia: function(){
		return this.showService.eliminateNonApprovedMedia;
	}

	,_shouldSuppressDeniedMedia: function(){
		return this.showService.eliminateDeniedMedia;
	}
	
	,_getDisplayDiv: function(){
		var divId = this.displayPanelName;
		return $('#'+divId);
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
		
		this.showService.displayDocument($sElem, {
			onDisplayed: onDisplayed
		}, data);

		if( data.nunaliit_schema ) {
			var schemaRepository = _this.schemaRepository;
			if( schemaRepository ) {
				schemaRepository.getSchema({
					name: data.nunaliit_schema
					,onSuccess: function(schema) {
						continueDisplay(schema);
					}
					,onError: function(){
						continueDisplay(null);
					}
				});
				
			} else {
				continueDisplay(null);
			};
			
		} else {
			continueDisplay(null);
		};
		
		function continueDisplay(schema){
			_this._addAttachmentProgress($elem, data);
			
			_this._addButtons($elem, data, {
				schema: schema
				,related: true
				,reply: true
				,geom: true
				,edit: true
				,'delete': true
				,addLayer: true
				,treeView: true
				,simplifiedGeoms: true
			});
			
			var $div = $('<div>')
				.addClass('n2Display_relatedInfo couchDisplayRelated_'+$n2.utils.stringToHtmlId(data._id))
				.appendTo($elem);
			var relatedInfoId = $n2.utils.getElementIdentifier($div);
			_this.displayRelatedInfoProcess.display({
				divId: relatedInfoId
				,display: _this
				,doc: data
				,schema: schema
			});
		};
		
		function onDisplayed($sElem, data, schema, opt_){
			if( _this.classDisplayFunctions ) {
				for(var className in _this.classDisplayFunctions){
					var fn = _this.classDisplayFunctions[className];
					var jqCallback = eachFunctionForClass(className, fn, data, opt);
					$sElem.find('.'+className).each(jqCallback);
				};
			};
		};

		function eachFunctionForClass(className, fn, data, opt){
			return function(){
				var $jq = $(this);
				fn(data, $jq, opt);
				$jq.removeClass(className);
			};
		};
	}
	
	,_addButtons: function($elem, data, opt_) {
		var _this = this;
		
		var opt = $n2.extend({
			schema: null
			,focus: false
			,related: false
			,reply: false
			,geom: false
			,edit: false
			,'delete': false
			,addLayer: false
			,treeView: false
			,simplifiedGeoms: false
		},opt_);

		var $buttons = $('<div></div>');
		$buttons.addClass('n2Display_buttons');
		$buttons.addClass('n2Display_buttons_'+$n2.utils.stringToHtmlId(data._id));
		$elem.append( $buttons );
		
		var optionClass = 'options';
		if( opt.focus ) optionClass += '_focus';
		if( opt.edit ) optionClass += '_edit';
		if( opt.related ) optionClass += '_related';
		if( opt.reply ) optionClass += '_reply';
		if( opt.geom ) optionClass += '_geom';
		if( opt['delete'] ) optionClass += '_delete';
		if( opt.addLayer ) optionClass += '_addLayer';
		if( opt.treeView ) optionClass += '_treeView';
		if( opt.simplifiedGeoms ) optionClass += '_simplifiedGeoms';
		$buttons.addClass(optionClass);

		var opts = {
			doc: data
			,schema: opt.schema
			,focus: opt.focus
			,edit: opt.edit
			,related: opt.related
			,reply: opt.reply
			,geom: opt.geom
			,addLayer: opt.addLayer
			,treeView: opt.treeView
			,simplifiedGeoms: opt.simplifiedGeoms
		};
		opts['delete'] = opt['delete'];
		this._displayButtons($buttons, opts);
	}
	
	,_refreshButtons: function($elem){
		var _this = this;
		
		var docId = null;
		var fFocus = false;
		var fEdit = false;
		var fRelated = false;
		var fReply = false;
		var fGeom = false;
		var fDelete = false;
		var fAddLayer = false;
		var fTreeView = false;
		var fSimplifiedGeoms = false;
		var classAttr = $elem.attr('class');
		var classes = classAttr.split(' ');
		for(var i=0,e=classes.length; i<e; ++i){
			var className = classes[i];
			if( startsWith(className,'n2Display_buttons_') ){
				var escapedDocId = className.substr('n2Display_buttons_'.length);
				docId = $n2.utils.unescapeHtmlId(escapedDocId);
				
			} else if( startsWith(className,'options') ){
				var options = className.split('_');
				for(var j=0,k=options.length; j<k; ++j){
					var o = options[j];
					if( 'focus' === o ){ fFocus = true; }
					else if( 'edit' === o ){ fEdit = true; }
					else if( 'related' === o ){ fRelated = true; }
					else if( 'reply' === o ){ fReply = true; }
					else if( 'geom' === o ){ fGeom = true; }
					else if( 'addLayer' === o ){ fAddLayer = true; }
					else if( 'treeView' === o ){ fTreeView = true; }
					else if( 'simplifiedGeoms' === o ){ fSimplifiedGeoms = true; }
					else if( 'delete' === o ){ fDelete = true; };
				};
			};
		};
		
		if( docId ){
			this.documentSource.getDocument({
				docId: docId
				,onSuccess: getSchema
				,onError:function(){}
			});
		};
		
		function getSchema(doc){
			if( doc.nunaliit_schema ) {
				var schemaRepository = _this.schemaRepository;
				if( schemaRepository ) {
					schemaRepository.getSchema({
						name: doc.nunaliit_schema
						,onSuccess: function(schema) {
							drawButtons(doc,schema);
						}
						,onError: function(){
							drawButtons(doc,null);
						}
					});
					
				} else {
					drawButtons(doc,null);
				};
				
			} else {
				drawButtons(doc,null);
			};
		};
		
		function drawButtons(doc,schema){
			var opts = {
				doc: doc
				,schema: schema
				,focus: fFocus
				,edit: fEdit
				,related: fRelated
				,reply: fReply
				,geom: fGeom
				,addLayer: fAddLayer
				,treeView: fTreeView
				,simplifiedGeoms: fSimplifiedGeoms
			};
			opts['delete'] = fDelete;
			$elem.empty();
			_this._displayButtons($elem, opts);
		};
	}
	
	,_displayButtons: function($buttons, opt){

		var _this = this;
		var data = opt.doc;
		var schema = opt.schema;
		
		var buttonDisplay = new ButtonDisplay();
		
		var dispatcher = this.dispatchService;
		var schemaRepository = _this.schemaRepository;

 		// Show 'focus' button
 		if( opt.focus 
 		 && data
 		 && data._id ) {
 			buttonDisplay.drawButton({
 				elem: $buttons
 				,name: 'more_info'
 				,label: _loc('More Info')
 				,click: function(){
 					_this._dispatch({
 						type:'userSelect'
 						,docId: data._id
 					});
 				}
 			});
 		};

 		// Show 'edit' button
 		if( opt.edit 
 		 && $n2.couchMap.canEditDoc(data) ) {
			const editButtonCfg = {
				elem: $buttons
				,name: 'edit'
				,label: _loc('Edit')
				,click: function(){
					_this._performDocumentEdit(data, opt);
				}
			}
			if ($n2.couchMap.documentOwnedBySessionUser(data)) {
				editButtonCfg.classNames = ['n2_document_user_owned_editable']
			}
 			buttonDisplay.drawButton(editButtonCfg);
 		};

 		// Show 'delete' button
 		if( opt['delete'] 
 		 && $n2.couchMap.canDeleteDoc(data) ) {
			const deleteButtonCfg = {
				elem: $buttons
				,name: 'delete'
				,label: _loc('Delete')
				,click: function(){
					_this._performDocumentDelete(data, opt);
				}
			}
			if ($n2.couchMap.documentOwnedBySessionUser(data)) {
				deleteButtonCfg.classNames = ['n2_document_user_owned_deletable']
			}
 			buttonDisplay.drawButton(deleteButtonCfg);
 		};
		
 		// Show 'add related' button
		if( opt.related
		 && this.displayRelatedInfoProcess ) {
			let showAddRelatedButton = true
			if (this.restrictAddRelatedButtonToLoggedIn) {
				var isLoggedInMsg = {
					type: 'authIsLoggedIn'
					, isLoggedIn: false
				}
				if (dispatcher) {
					dispatcher.synchronousCall(DH, isLoggedInMsg);
				}
				if (!isLoggedInMsg.isLoggedIn) {
					showAddRelatedButton = false;
				}
			}
			if (showAddRelatedButton) {
				this.displayRelatedInfoProcess.addButton({
					display: this
					,div: $buttons[0]
					,doc: data
					,schema: opt.schema
					,buttonDisplay: buttonDisplay
				});
			}
			
 		};
		
 		// Show 'reply' button
		if( opt.reply
		 && opt.schema
		 && opt.schema.options 
		 && opt.schema.options.enableReplies
		 ) {
			var showReplyButton = true;
			if( this.restrictReplyButtonToLoggedIn ){
				var isLoggedInMsg = {
					type: 'authIsLoggedIn'
					,isLoggedIn: false
				};
				if( dispatcher ){
					dispatcher.synchronousCall(DH,isLoggedInMsg);
				};
				if( !isLoggedInMsg.isLoggedIn ) {
					showReplyButton = false;
				};
			};
			
			if( showReplyButton ) {
	 			buttonDisplay.drawButton({
	 				elem: $buttons
	 				,name: 'reply'
	 				,label: _loc('Reply')
	 				,click: function(){
						_this._replyToDocument(data, opt.schema);
	 				}
	 			});
			};
		};
		
 		// Show 'find on map' button
		if( data ) {
			var $findGeomButton = buttonDisplay.drawButton({
 				elem: $buttons
 				,name: 'find_on_map'
 				,label: _loc('Find on Map')
 				,click: function(){
 					_this._dispatch({
 						type: 'find'
 						,docId: data._id
 						,doc: data
 					});
 				}
 			});
			
			this.showService.showFindAvailable({
				elem: $findGeomButton
				,doc: data
			});
		};

		// Show 'Add Layer' button
		if( opt.addLayer
		 && data
		 && data.nunaliit_layer_definition
		 && dispatcher
		 && dispatcher.isEventTypeRegistered('addLayerToMap')
		 ) {
 			buttonDisplay.drawButton({
 				elem: $buttons
 				,name: 'add_layer'
 				,label: _loc('Add Layer')
 				,click: function(){
 					var layerDefinition = data.nunaliit_layer_definition;
 					var layerId = layerDefinition.id;
 					if( !layerId ){
 						layerId = data._id;
 					};
 					var layerDef = {
 						name: layerDefinition.name
 						,type: 'couchdb'
 						,options: {
 							layerName: layerId
 							,documentSource: _this.documentSource
 						}
 					};

 					_this._dispatch({
 						type: 'addLayerToMap'
 						,layer: layerDef
 						,options: {
 							setExtent: {
 								bounds: layerDefinition.bbox
 								,crs: 'EPSG:4326'
 							}
 						}
 					});
 				}
 			});
		};

		// Show 'Tree View' button
		if( opt.treeView
		 && data
		 ) {
 			buttonDisplay.drawButton({
 				elem: $buttons
 				,name: 'tree_view'
 				,label: _loc('Tree View')
 				,click: function(){
					_this._performDocumentTreeView(data);
 				}
 			});
		};

		// Show 'Simplified Geoms' button
		if( opt.simplifiedGeoms
		 && data
		 && data.nunaliit_geom
		 ) {
 			buttonDisplay.drawButton({
 				elem: $buttons
 				,name: 'simplified_geoms'
 				,label: _loc('Geometries')
 				,click: function(){
					_this._performSimplifiedGeometries(data);
 				}
 			});
		};
	}
	
	,_addAttachmentProgress: function($elem, data){
		var $progress = $('<div></div>')
			.addClass('n2Display_attProgress')
			.addClass('n2Display_attProgress_'+$n2.utils.stringToHtmlId(data._id) )
			.appendTo( $elem );
		
		this._refreshAttachmentProgress($progress, data);
	}
	
	,_refreshAttachmentProgress: function($progress, data){

		var status = null;
		
		$progress.empty();

		// Display a preview of local Cordova attachments
		if (window.cordova && data.nunaliit_mobile_attachments) {
			var lastSlashIndex = data.nunaliit_mobile_attachments.lastIndexOf('/');
			var filename = data.nunaliit_mobile_attachments.substring(lastSlashIndex + 1);
			$('<p>1 mobile attachment: ' + filename + '</p>')
				.appendTo($progress);

			window.resolveLocalFileSystemURL('file:' + data.nunaliit_mobile_attachments, 
				function(fileEntry) {
					fileEntry.file(function(file) {
						if (file && file.type) {
							if (file.type.startsWith('image')) {
								// If the file is an image, display it
								$('<img>', {src: data.nunaliit_mobile_attachments})
									.addClass('n2Display_cordovaImgAttachmentPreview')
									.on('error', function() { 
										$(this).hide();
									})
									.appendTo($progress);
							} else {
								var $previewButtton = $('<label>')
									.addClass('cordova-btn cordova-preview-button icon-preview width-100')
									.appendTo($progress)
									.text(_loc('Preview'))
									.click(function(event) {
										event.preventDefault();
										// Try to open it using a plugin
										window.cordova.plugins.fileOpener2.open(
											data.nunaliit_mobile_attachments,
											file.type, {
												error : function(error) { console.error('Error opening file', file); }, 
												success : function() { console.log('Opening file', file); } 
											});
									});
							}
						} 
					});
				});
		}
		
		// Find an attachment which is in progress
		if( data.nunaliit_attachments 
		 && data.nunaliit_attachments.files ){
			for(var attName in data.nunaliit_attachments.files){
				var att = data.nunaliit_attachments.files[attName];
				
				// Skip non-original attachments
				if( !att.source ){
					if( att.status 
					 && 'attached' !== att.status ){
						// OK, progress must be reported. Accumulate
						// various status since there could be more than
						// one attachment.
						if( !status ){
							status = {};
						};
						status[att.status] = true;
					};
				};
			};
		};

		// Report status
		if( status ){
			var $outer = $('<div></div>')
				.addClass('n2Display_attProgress_outer')
				.appendTo($progress);

			$('<div></div>')
				.addClass('n2Display_attProgress_icon')
				.appendTo($outer);
		
			if( status['waiting for approval'] ){
				$outer.addClass('n2Display_attProgress_waiting');
				
				$('<div></div>')
					.addClass('n2Display_attProgress_message')
					.text( _loc('Attachment is waiting for approval') )
					.appendTo($outer);
				
			} else if( status['denied'] ){
				$outer.addClass('n2Display_attProgress_denied');
				
				$('<div></div>')
					.addClass('n2Display_attProgress_message')
					.text( _loc('Attachment has been denied') )
					.appendTo($outer);
				
			} else {
				// Robot is working
				$outer.addClass('n2Display_attProgress_busy');
				
				$('<div></div>')
					.addClass('n2Display_attProgress_message')
					.text( _loc('Attachment is being processed') )
					.appendTo($outer);
			};

			$('<div></div>')
				.addClass('n2Display_attProgress_outer_end')
				.appendTo($outer);
		};
	}
	
	,_getAllReferences: function(opts_){
		var opts = $n2.extend({
			doc: null
			,onSuccess: function(refInfo){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var doc = opts.doc;
		
		// Keep track of docIds and associated schemas
		var refInfo = {};
		
		// Compute forward references
		var references = [];
		$n2.couchUtils.extractLinks(doc, references);
		for(var i=0, e=references.length; i<e; ++i){
			var linkDocId = references[i].doc;
			if( !refInfo[linkDocId] ){
				refInfo[linkDocId] = {};
			};
			refInfo[linkDocId].forward = true;
		};
		
		// Get identifiers of all documents that reference this one
		this.documentSource.getReferencesFromId({
			docId: doc._id
			,onSuccess: function(refIds){
				for(var i=0,e=refIds.length;i<e;++i){
					var id = refIds[i];
					if( !refInfo[id] ){
						refInfo[id] = {};
					};
					refInfo[id].reverse = true;
				};
				
				getRefSchemas();
			}
			,onError: getRefSchemas
		});

		function getRefSchemas(){
			var requestDocIds = [];
			for(var requestDocId in refInfo){
				requestDocIds.push(requestDocId);
			};

			if( requestDocIds.length > 0 ){
				_this.documentSource.getDocumentInfoFromIds({
					docIds: requestDocIds
					,onSuccess: function(infos){
						for(var i=0,e=infos.length;i<e;++i){
							var requestDocId = infos[i].id;
							
							refInfo[requestDocId].exists = true;
							if( infos[i].schema ) {
								refInfo[requestDocId].schema = infos[i].schema;
							};
						};
						
						opts.onSuccess(refInfo);
					}
					,onError: opts.onError
				});
			} else {
				opts.onSuccess(refInfo);
			};
		};
	}

	,_replyToDocument: function(doc, schema){
		var _this = this;
		
		this.createRelatedDocProcess.replyToDocument({
			doc: doc
			,schema: schema
			,onSuccess: function(docId){
			}
		});
	},
	
	/**
	 * This function refreshes the sections surrounding the display of a
	 * document, such as the buttons below the document displayed.
	 */
	_refreshDocument: function(doc){

		var _this = this;
		
		// Retrieve schema document
		var schemaRepository = this.schemaRepository;
		if( doc.nunaliit_schema && schemaRepository ) {
			schemaRepository.getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema) {
					refreshDocWithSchema(doc, schema);
				}
				,onError: function(){
					refreshDocWithSchema(doc, null);
				}
			});
		} else {
			refreshDocWithSchema(doc, null);
		};
	
		function refreshDocWithSchema(doc, schema){
			var docId = doc._id;

			// Refresh buttons under main document display
			$('.n2Display_buttons_'+$n2.utils.stringToHtmlId(docId)).each(function(){
				var $elem = $(this);
				_this._refreshButtons($elem);
			});
			
			$('.displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)).each(function(){
				var $buttonDiv = $(this);
				$buttonDiv.empty();
				_this._addButtons($buttonDiv, doc, {
					schema: schema
					,focus: true
					,geom: true
					,reply: true
					,treeView: true
					,simplifiedGeoms: true
				});
			});
			
			$('.n2Display_attProgress_'+$n2.utils.stringToHtmlId(docId)).each(function(){
				var $progress = $(this);
				_this._refreshAttachmentProgress($progress,doc);
			});
			
			if( _this._shouldSuppressNonApprovedMedia() ){
				if( $n2.couchMap.documentContainsMedia(doc) 
				 && false == $n2.couchMap.documentContainsApprovedMedia(doc) ) {
					$('.n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId)).each(function(){
						var $div = $(this);
						var $parent = $div.parent();
						$div.remove();
						_this._fixDocumentList($parent);
					});
				};
			} else if( _this._shouldSuppressDeniedMedia() ){
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
		};
	},
	
	/**
	 * This function replaces a section that is waiting for the
	 * appearance of a document. It replaces the section with an
	 * actual display of the document.
	 */
	_populateWaitingDocument: function(doc){
		var _this = this;
		
		if( doc ) {
			var docId = doc._id;
			var escaped = $n2.utils.stringToHtmlId(docId);
			var cName = 'couchDisplayWait_'+escaped;
			$('.'+cName).each(function(){
				var $set = $(this);
				$set
					.removeClass(cName)
					.addClass('couchDisplayAdded_'+escaped);
				_this._displayDocument($set, doc);
			});
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
	
	,_performDocumentEdit: function(data, options_) {
		var _this = this;
		
		this.documentSource.getDocument({
			docId: data._id
			,onSuccess: function(doc){
				_this._dispatch({
					type: 'editInitiate'
					,doc: doc
				});
			}
			,onError: function(errorMsg){
				$n2.log('Unable to load document: '+errorMsg);
			}
		});
	}
	
	,_performDocumentDelete: function(data, options_) {
		var _this = this;

		if( confirm( _loc('You are about to delete this document. Do you want to proceed?') ) ) {
			this.documentSource.deleteDocument({
				doc: data
				,onSuccess: function() {
					if( options_.onDeleted ) {
						options_.onDeleted();
					};
				}
			});
		};
	}
	
	,_performDocumentTreeView: function(data) {
		new TreeDocumentViewer({
			doc: data
		});
	}
	
	,_performSimplifiedGeometries: function(doc){
		var contentId = $n2.getUniqueId();
		
		if( doc 
		 && doc.nunaliit_geom 
		 && doc.nunaliit_geom.wkt ){
			var geometries = [];
			
			// Inline
			geometries.push({
				label: _loc('Inline')
				,wkt: doc.nunaliit_geom.wkt
			});
			if( doc.nunaliit_geom.simplified 
			 && doc.nunaliit_geom.simplified.reported_resolution ){
				geometries[0].resolution = doc.nunaliit_geom.simplified.reported_resolution;
			};

			if( doc.nunaliit_geom.simplified ){
				
				var simplified = doc.nunaliit_geom.simplified;
				if( simplified.original ){
					var url = this.documentSource.getDocumentAttachmentUrl(doc,simplified.original);
					geometries.push({
						label: _loc('Original')
						,url: url
						,attName: simplified.original
					});
				};
				
				if( simplified.resolutions ){
					var resolutions = [];
					for(var attName in simplified.resolutions){
						var res = simplified.resolutions[attName];
						var url = this.documentSource.getDocumentAttachmentUrl(doc,attName);
						resolutions.push({
							label: _loc('Resolution')
							,url: url
							,attName: attName
							,resolution: res
						});
					};
					resolutions.sort(function(a,b){
						if( a.resolution < b.resolution ) return -1;
						if( a.resolution > b.resolution ) return 1;
						return 0;
					});
					
					for(var i=0,e=resolutions.length; i<e; ++i){
						geometries.push( resolutions[i] );
					};
				};
			};
			
			var $content = $('<div>')
				.attr('id', contentId)
				;
			
			display($content);
			
			$content.dialog({
				autoOpen: true
				,title: _loc('Geometries')
				,modal: true
				,width: 600
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			});

			// Request attachments
			for(var i=0,e=geometries.length; i<e; ++i){
				var geometry = geometries[i];
				if( geometry.url && geometry.attName ){
					loadAttachment(geometry.attName, geometry.url);
				};
			};
		};
		
		function display($content){
			
			if( !$content ){
				$content = $('#'+contentId);
			};

			$content.empty();
			
			for(var i=0,e=geometries.length; i<e; ++i){
				var geometry = geometries[i];

				var heading = geometry.label;
				if( geometry.resolution ){
					heading += ' - ' + geometry.resolution;
				};
				if( geometry.attName ){
					heading += ' - ' + geometry.attName;
				};
				
				$('<div>')
					.addClass('n2display_geometries_heading')
					.text( heading )
					.appendTo($content);
	
				if( geometry.wkt ){
					var wkt = geometry.wkt + ' ['+geometry.wkt.length+']';
					$('<div>')
						.addClass('n2display_geometries_wkt')
						.text( wkt )
						.appendTo($content);
				};
			};
		};
		
		function loadAttachment(attName, url){
			$.ajax({
				url: url
				,dataType: 'text'
				,success: function(wkt){
					for(var i=0,e=geometries.length; i<e; ++i){
						var geometry = geometries[i];
						if( geometry.attName === attName ){
							geometry.wkt = wkt;
						};
					};
					
					display();
				}
			});
		};
	}
	
	,_displayDocumentId: function($set, docId) {

		var _this = this;
		
		$set.empty();

		this.documentSource.getDocument({
			docId: docId
			,onSuccess: function(doc) {
				_this._displayDocument($set, doc);
			}
			,onError: function(err) {
				$set.empty();
				$('<div>')
					.addClass('couchDisplayWait_'+$n2.utils.stringToHtmlId(docId))
					.text( _loc('Unable to retrieve document') )
					.appendTo($set);
			}
		});
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
				this._displayDocument($div, msg.doc);
				
			} else if( msg.docId ) {
				this._displayDocumentId($div, msg.docId);
				
			} else if( msg.docs ) {
				this._displayMultipleDocuments($div, msg.docs);
				
			} else if( msg.docIds ) {
				$div.empty();
				this._displayMultipleDocumentIds($div, msg.docIds)
			};
			
		} else if( msg.type === 'searchResults' ) {
			this._displaySearchResults(msg.results);
			
		} else if( msg.type === 'documentDeleted' ) {
			var docId = msg.docId;
			this._handleDocumentDeletion(docId);
			
		} else if( msg.type === 'authLoggedIn' 
			|| msg.type === 'authLoggedOut' ) {
			$('.n2Display_buttons').each(function(){
				var $elem = $(this);
				_this._refreshButtons($elem);
			});
			
		} else if( msg.type === 'editClosed' ) {
			var deleted = msg.deleted;
			if( !deleted ) {
				var doc = msg.doc;
				if( doc ) {
					this._displayDocument($div, doc);
				};
			};
			
		} else if( msg.type === 'documentContentCreated' ) {
			this._handleDocumentCreation(msg.doc);
			this._populateWaitingDocument(msg.doc);
			
		} else if( msg.type === 'documentContentUpdated' ) {
			this._refreshDocument(msg.doc);
			this._populateWaitingDocument(msg.doc);
		};
	}
	
	,_displayMultipleDocuments: function($container, docs) {

		var _this = this;
		
		var $list = $('<div class="_n2DocumentListParent"></div>');
		$container
			.empty()
			.append($list);
		
		for(var i=0,e=docs.length; i<e; ++i) {
			var doc = docs[i];
			var docId = doc._id;
			
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
			this.showService.displayBriefDescription($contentDiv, {}, doc);

			var $buttonDiv = $('<div></div>');
			$div.append($buttonDiv);
			this._addButtons($buttonDiv, doc, {focus:true,geom:true});
		};
	}

	,_displayMultipleDocumentIds: function($container, docIds) {

		var _this = this;
		
		var $list = $('<div class="_n2DocumentListParent"></div>');
		$container
			.empty()
			.append($list);
		
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
			this.showService.printBriefDescription($contentDiv, docId);
			
			if( this.requestService ) {
				var $progressDiv = $('<div class="n2Display_attProgress n2Display_attProgress_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
				$div.append($progressDiv);

				var $buttonDiv = $('<div class="displayRelatedButton displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
				$div.append($buttonDiv);
				
				this.requestService.requestDocument(docId);
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
		var $div = this._getDisplayDiv();
		$div.empty();
		if( ids.length < 1 ) {
			$div.append( $('<div>'+_loc('Search results empty')+'</div>') );
		} else {
			var $results = $('<div class="n2_search_result"></div>')
				.appendTo($div);
			this._displayMultipleDocumentIds($results, ids);
		};
	}
	
	,_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	}
	
	,_handleDocumentDeletion: function(docId){
		var _this = this;
		
		// Main document displayed
		var $elems = $('.couchDisplay_'+$n2.utils.stringToHtmlId(docId));
		$elems.remove();
		
		// Document waiting to be displayed
		var $elems = $('.couchDisplayWait_'+$n2.utils.stringToHtmlId(docId));
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
	
	,_handleDocumentCreation: function(doc){
		var _this = this;
		
		// Find all documents referenced by this one
		var links = [];
		$n2.couchUtils.extractLinks(doc, links);
		for(var i=0,e=links.length;i<e;++i){
			var refDocId = links[i].doc;
			if( refDocId ){
				// Check if we have a related document section displayed for
				// this referenced document
				var $elems = $('.couchDisplayRelated_'+$n2.utils.stringToHtmlId(refDocId));
				if( $elems.length > 0 ){
					// We must redisplay this related info section
					refreshRelatedInfo(refDocId, $elems);
				};
			};
		};

		function refreshRelatedInfo(docId, $elems) {
			// Get document
			var request = _this.requestService;
			if( request ){
				request.requestDocument(docId,function(d){
					loadedData(d, $elems);
				});
			};
		};
		
		function loadedData(data, $elems) {
			// Get schema
			var schemaName = data.nunaliit_schema ? data.nunaliit_schema : null;
			var schemaRepository = _this.schemaRepository;
			if( schemaName && schemaRepository ) {
				schemaRepository.getSchema({
					name: schemaName
					,onSuccess: function(schema) {
						loadedSchema(data, schema, $elems);
					}
					,onError: function(){
						loadedSchema(data, null, $elems);
					}
				});
			} else {
				loadedSchema(data, null, $elems);
			};
		};
		
		function loadedSchema(data, schema, $elems){
			$elems.each(function(){
				var $e = $(this);
				// Refresh
				$e.empty();
				_this.displayRelatedInfoProcess.display({
					div: $e
					,display: _this
					,doc: data
					,schema: schema
				});
			});
		};
	}
});

//===================================================================================

var LegacyDisplayRelatedFunctionAdapter = $n2.Class({
	legacyFunction: null,
	
	initialize: function(legacyFunction){
		this.legacyFunction = legacyFunction;
	},
	
	display: function(opts_){
		return this.legacyFunction(opts_);
	},
	
	addButton: function(opts_){
		var opts = $n2.extend({
			display: null
			,div: null
			,doc: null
			,schema: null
		},opts_);
		
		var display = opts.display;
		var doc = opts.doc;
		var $buttons = $(opts.div);
		var createRelatedDocProcess = display.createRelatedDocProcess;
		
		var $placeHolder = $('<span>')
			.appendTo($buttons);
		
		createRelatedDocProcess.insertAddRelatedSelection({
			placeHolderElem: $placeHolder
			,doc: doc
			,onElementCreated: function($addRelatedButton){
				$addRelatedButton.addClass('nunaliit_form_link');
				$addRelatedButton.addClass('nunaliit_form_link_add_related_item');
				const options = {}
				if ($n2.couchMap.documentOwnedBySessionUser(this.doc)) {
					options.wrapperSpanClass = 'n2_document_user_owned_can_add_related'
				}

				$addRelatedButton.menuselector(options);
			}
			,onRelatedDocumentCreated: function(docId){}
		});
	}
});

//===================================================================================

function _displayRelatedDocuments(display_, contId, relatedSchemaName, relatedDocIds){
	var $container = $('#'+contId);
	
	if( !relatedDocIds || relatedDocIds.length < 1 ) {
		$container.remove();
		return;
	};
	
	var blindId = $n2.getUniqueId();
	var $blindWidget = $('<div id="'+blindId+'" class="_n2DocumentListParent"><h3></h3><div style="padding-left:0px;padding-right:0px;"></div></div>');
	$container.append($blindWidget);
	var bw = $n2.blindWidget($blindWidget,{
		data: relatedDocIds
		,onBeforeOpen: beforeOpen
		,classes: ['blindWidget_' + relatedSchemaName]
	});
	bw.setHtml('<span class="_n2DisplaySchemaName"></span> (<span class="_n2DisplayDocCount"></span>)');
	if( null == relatedSchemaName ) {
		$blindWidget.find('._n2DisplaySchemaName').text( _loc('Uncategorized') );
	} else {
		$blindWidget.find('._n2DisplaySchemaName').text(relatedSchemaName);
	};
	$blindWidget.find('._n2DisplayDocCount').text(''+relatedDocIds.length);
	
	var schemaRepository = display_.schemaRepository;
	if( schemaRepository && relatedSchemaName ){
		schemaRepository.getSchema({
			name: relatedSchemaName
			,onSuccess: function(schema){
				var $blindWidget = $('#'+blindId);
				$blindWidget.find('._n2DisplaySchemaName').text( _loc(schema.getLabel()) );
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
				$docWrapper.addClass('_n2DocumentListStart');
			};
			if ( (e-1) === i ) {
				$docWrapper.addClass('_n2DocumentListEnd');
			};
			$docWrapper
				.addClass('_n2DocumentListEntry')
				.addClass('_n2DocumentListEntry_'+$n2.utils.stringToHtmlId(docId))
				.addClass('olkitSearchMod2_'+(i%2))
				.addClass('n2SupressNonApprovedMedia_'+$n2.utils.stringToHtmlId(docId))
				.addClass('n2SupressDeniedMedia_'+$n2.utils.stringToHtmlId(docId))
				;
			
			var $doc = $('<div>')
				.addClass('n2s_handleHover')
				.appendTo($docWrapper);

			if( display_.showService ) {
				if( display_.displayBriefInRelatedInfo ){
					display_.showService.printBriefDescription($doc,docId);
				} else {
					display_.showService.printDocument($doc,docId);
				};
			} else {
				$doc.text(docId);
			};
			if( display_.requestService ) {
				var $progressDiv = $('<div class="n2Display_attProgress n2Display_attProgress_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
				$docWrapper.append($progressDiv);

				var $buttonDiv = $('<div class="displayRelatedButton displayRelatedButton_'+$n2.utils.stringToHtmlId(docId)+'"></div>');
				$docWrapper.append($buttonDiv);
				
				display_.requestService.requestDocument(docId);
			};
		};
	};
};

function DisplayRelatedInfo(opts_){
	var opts = $n2.extend({
		divId: null
		,div: null
		,display: null
		,doc: null
		,schema: null
	},opts_);
	
	var doc = opts.doc;
	var docId = doc._id;
	var display = opts.display;
	var schema = opts.schema;
	
	var $elem = opts.div;
	if( ! $elem ) {
		$elem = $('#'+opts.divId);
	};
	if( ! $elem.length) {
		return;
	};
	
	if( !schema 
	 || !schema.relatedSchemaNames
	 || !schema.relatedSchemaNames.length ){
		return;
	};
	
	// Make a map of related schemas
	var schemaInfoByName = {};
	for(var i=0,e=schema.relatedSchemaNames.length; i<e; ++i){
		var relatedSchemaName = schema.relatedSchemaNames[i];
		schemaInfoByName[relatedSchemaName] = { docIds:[] };
	};

	// Get references
	display._getAllReferences({
		doc: doc
		,onSuccess: showSections
	});

	function showSections(refInfo){
		// Accumulate document ids under the associated schema
		for(var requestDocId in refInfo){
			if( refInfo[requestDocId].exists 
			 && refInfo[requestDocId].reverse
			 && refInfo[requestDocId].schema ) {
				var schemaName = refInfo[requestDocId].schema;
				var schemaInfo = schemaInfoByName[schemaName];
				if( schemaInfo ){
					schemaInfo.docIds.push(requestDocId);
				};
			};
		};

		// Add section with related documents
		for(var schemaName in schemaInfoByName){
			var schemaInfo = schemaInfoByName[schemaName];
			if( schemaInfo.docIds.length > 0 ) {
				var contId = $n2.getUniqueId();
				var $div = $('<div id="'+contId+'"></div>');
				$elem.append($div);

				var relatedDocIds = schemaInfo.docIds;
				
				_displayRelatedDocuments(display, contId, schemaName, relatedDocIds);
			};
		};
	};
};

//===================================================================================

function DisplayLinkedInfo(opts_){
	var opts = $n2.extend({
		divId: null
		,div: null
		,display: null
		,doc: null
		,schema: null
	},opts_);
	
	var display = opts.display;
	var doc = opts.doc;
	var docId = doc._id;
	
	var $elem = opts.div;
	if( ! $elem ) {
		$elem = $('#'+opts.divId);
	};
	if( ! $elem.length) {
		return;
	};

	// Get references
	display._getAllReferences({
		doc: doc
		,onSuccess: showSections
	});

	function showSections(refInfo){
		// Accumulate document ids under the associated schema
		var relatedDocsFromSchemas = {};
		var uncategorizedDocIds = [];
		for(var requestDocId in refInfo){
			if( refInfo[requestDocId].exists ) {
				var schemaName = refInfo[requestDocId].schema;
				
				if( schemaName ) {
					if( !relatedDocsFromSchemas[schemaName] ) {
						relatedDocsFromSchemas[schemaName] = {
							docIds: []
						};
					};
					relatedDocsFromSchemas[schemaName].docIds.push(requestDocId);
				} else {
					uncategorizedDocIds.push(requestDocId);
				};
			};
		};

		// Add section with related documents
		for(var schemaName in relatedDocsFromSchemas){
			var contId = $n2.getUniqueId();
			var $div = $('<div id="'+contId+'"></div>');
			$elem.append($div);

			var relatedDocIds = relatedDocsFromSchemas[schemaName].docIds;
			
			_displayRelatedDocuments(display, contId, schemaName, relatedDocIds);
		};
		
		// Add uncategorized
		if( uncategorizedDocIds.length > 0 ) {
			var contId = $n2.getUniqueId();
			var $div = $('<div id="'+contId+'"></div>');
			$elem.append($div);

			_displayRelatedDocuments(display, contId, null, uncategorizedDocIds);
		};
	};
};

//===================================================================================

var CommentRelatedInfo = $n2.Class({
	
	commentSchema: null,
	
	dispatchService: null,
	
	commentService: null,
	
	initialize: function(opts_){
		
		var opts = $n2.extend({
			schema: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.commentSchema = opts.schema;
		this.dispatchService = opts.dispatchService;
		
		if( this.dispatchService ){
			var m = {
				type: 'configurationGetCurrentSettings'
			};
			this.dispatchService.synchronousCall(DH, m);
			
			if( m.configuration && m.configuration.directory ){
				this.commentService = m.configuration.directory.commentService;
			};
		};
	},
	
	display: function(opts_){
		var opts = $n2.extend({
			divId: null
			,div: null
			,doc: null
		},opts_);
		
		var _this = this;

		if( !this.commentService ){
			$n2.log('Comment service not available for comment process');
			return;
		};
		
		// Set schema for comments
		if( this.commentSchema ){
			this.commentService.setCommentSchema(this.commentSchema);
		};
		
		var commentStreamDisplay = this.commentService.getCommentStreamDisplay();
		if( commentStreamDisplay ){
			commentStreamDisplay.display(opts_);
		};
	},
	
	addButton: function(opts_){
		var opts = $n2.extend({
			display: null
			,div: null
			,doc: null
			,schema: null
			,buttonDisplay: null
		},opts_);
		
		if( !this.commentService ){
			$n2.log('Comment service not available for comment process');
			return;
		};
		
		this.commentService.insertAddCommentButton({
			div: opts.div
			,doc: opts.doc
			,buttonDisplay: opts.buttonDisplay
		});
	}
});

//===================================================================================
// An instance of this class is used to draw a HTML button in the DOM structure.
var ButtonDisplay = $n2.Class({

	initialize: function(opts_){
		
	},
	
	drawButton: function(opts_){
		var opts = $n2.extend({
			// Location where button is to be drawn
			elem: null,
			
			// Name of button
			name: null,
			
			// Label is shown on the button
			label: null,
			
			// Function to be called when button is clicked
			click: null,
			
			// String. Class name to be added to button
			className: null,
			
			// Array of string. Class names to be added to button
			classNames: null
		},opts_);
		
		if( !opts.elem ){
			throw new Error('In ButtonDisplay.drawButton(), parameter "elem" must be provided');
		};
		
		var $elem = $(opts.elem);
		var name = opts.name;
		var label = opts.label;
		if( !label ){
			label = name;
		};
		
		var $linkButton = $('<a>')
			.attr('href','#')
			.appendTo($elem)
			.addClass('nunaliit_form_link')
			.click(wrapAndReturnFalse(opts.click));
		
		if( label ){
			$linkButton.text(label);
		};

		if( name ){
			var compactTag = name;
			var spaceIndex = compactTag.indexOf(' ');
			while (-1 !== spaceIndex) {
				compactTag = compactTag.slice(0,spaceIndex) + '_' +
					compactTag.slice(spaceIndex + 1);
				spaceIndex = compactTag.indexOf(' ');
			};
			$linkButton.addClass('nunaliit_form_link_' + compactTag.toLowerCase());
		};
		
		if( typeof opts.className === 'string' ){
			$linkButton.addClass(opts.className);
		};
		
		if( $n2.isArray(opts.classNames) ){
			opts.classNames.forEach(function(className){
				if( typeof className === 'string' ){
					$linkButton.addClass(className);
				};
			});
		};
		
		return $linkButton;

		function wrapAndReturnFalse(callback){
			return function(){
				if( typeof callback === 'function' ){
					callback.apply(this,arguments);
				};
				return false;
			};
		};
	}
});

//===================================================================================

var TreeDocumentViewer = $n2.Class({
	
	doc: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			doc: null
		},opts_);
		
		this.doc = {};
		for(var key in opts.doc){
			if( key !== '__n2Source' ){
				this.doc[key] = opts.doc[key];
			};
		};
		
		this._display();
	},
	
	_display: function(){
		var $dialog = $('<div>')
			.addClass('n2Display_treeViewer_dialog');
		var diagId = $n2.utils.getElementIdentifier($dialog);
		
		var $container = $('<div>')
			.addClass('n2Display_treeViewer_content')
			.appendTo($dialog);
		
		new $n2.tree.ObjectTree($container, this.doc);
		
		var $buttons = $('<div>')
			.addClass('n2Display_treeViewer_buttons')
			.appendTo($dialog);
		
		$('<button>')
			.text( _loc('Close') )
			.appendTo($buttons)
			.click(function(){
				var $diag = $('#'+diagId);
				$diag.dialog('close');
				return false;
			});
		
		$dialog.dialog({
			autoOpen: true
			,title: _loc('Tree View')
			,modal: true
			,width: 370
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		});
	}
});

//===================================================================================
function HandleDisplayAvailableRequest(m){
	if( m.displayType === 'classic' ){
		m.isAvailable = true;
	};
};

function HandleDisplayRenderRequest(m){
	if( m.displayType === 'classic' ){
		var options = {};
		if( m.displayOptions ){
			for(var key in m.displayOptions){
				options[key] = m.displayOptions[key];
			};
		};
		
		options.documentSource = m.config.documentSource;
		options.displayPanelName = m.displayId;
		options.showService = m.config.directory.showService;
		options.uploadService = m.config.directory.uploadService;
		options.createDocProcess = m.config.directory.createDocProcess;
		options.serviceDirectory = m.config.directory;
		
		var displayControl = new Display(options);

		var defaultDisplaySchemaName = 'object';
		if( m.displayOptions && m.displayOptions.defaultSchemaName ){
			defaultDisplaySchemaName = m.displayOptions.defaultSchemaName;
		};
		m.config.directory.schemaRepository.getSchema({
			name: defaultDisplaySchemaName
			,onSuccess: function(schema){
				if( displayControl.setSchema ) {
					displayControl.setSchema(schema);
				};
			}
		});

		m.onSuccess(displayControl);
	};
};

//===================================================================================

// Exports
$n2.couchDisplay = {
	Display: Display,
	CommentRelatedInfo: CommentRelatedInfo,
	TreeDocumentViewer: TreeDocumentViewer
	,HandleDisplayAvailableRequest: HandleDisplayAvailableRequest
	,HandleDisplayRenderRequest: HandleDisplayRenderRequest
	,ButtonDisplay: ButtonDisplay
//	DisplayRelatedInfo: DisplayRelatedInfo,
//	DisplayLinkedInfo: DisplayLinkedInfo
	
};

})(jQuery,nunaliit2);
