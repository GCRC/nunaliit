/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); },
 DH = 'n2.couchShow',
 couchUserPrefix = 'org.couchdb.user:',
 suppressLeaveConfirmation = false;

// Required library: material design components
var $mdc = window.mdc;
if (!$mdc) {
	return;
}

function noop(){};

var reUrl = /(^|\s)(https?:\/\/[^\s]*)(\s|$)/;

//*******************************************************

/**
 * This function iterates over all the descendants of a
 * DOM node, calling the specified function for each
 * element.
 * @param element Node where search should start from
 * @param fn Function to be called for each descendant element
 */
function iterateOverChildElements(element, fn){
	var childElements = [];
	var nodeList = element.childNodes;
	for(var i=0;i<nodeList.length;++i){
		var childNode = nodeList.item(i);
		if( childNode 
		 && childNode.nodeType === 1 ){ // element
			childElements.push(childNode);
		};
	};
	
	childElements.forEach(function(childElement){
		fn(childElement);
		iterateOverChildElements(childElement, fn)
	});
};

function getChildElements(element){
	var childElements = [];
	addDescendants(element, childElements);
	return childElements;
	
	function addDescendants(node, arr){
		var nodeList = node.childNodes;
		for(var i=0;i<nodeList.length;++i){
			var childNode = nodeList.item(i);
			if( childNode 
			 && childNode.nodeType === 1 ){ // element
				arr.push(childNode);
				addDescendants(childNode, arr);
			};
		};
	};
};

function replaceClassName(element, sourceClassName, targetClassName){
	var classes = element.className;
	if( classes ){
		var classNames = classes.split(' ');
		var newClassNames = [];
		classNames.forEach(function(className){
			if( className === sourceClassName ){
				newClassNames.push(targetClassName);
			} else {
				newClassNames.push(className);
			};
		});
		var newClasses = newClassNames.join(' ');
		element.className = newClasses;
	};
};


// *******************************************************
var DomStyler = $n2.Class({
	
	db: null,
	
	documentSource: null,

	showService: null,
	
	displayFunction: null,
	
	editFunction: null,
	
	deleteFunction: null,
	
	viewLayerFunction: null,
	
	changes: null,

	changesWithContext: null,

	observerChangeMap: null,

	mutationObserver: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,documentSource: null
			,showService: null
			,displayFunction: null
			,editFunction: null
			,deleteFunction: null
			,viewLayerFunction: null
		},opts_);
		
		this.db = opts.db;
		this.documentSource = opts.documentSource;
		this.showService = opts.showService;
		this.displayFunction = opts.displayFunction;
		this.editFunction = opts.editFunction;
		this.deleteFunction = opts.deleteFunction;
		this.viewLayerFunction = opts.viewLayerFunction;

		var _this = this;
		
		// This is a list of all DOM changes performed by
		// the show service:
		// - source : String. Class name to find element to change
		// - target : String. Class name to switch element to after change
		// - fn : Function. Function to call to perform change
		// - acceptsContextDocument : Boolean. If true, specify the context
		//                            document
		this.changes = [
			{
				source: 'n2s_localize'
				,target: 'n2s_localized'
				,fn: this._localize
				,acceptsContextDocument: false
			},
			{
				source: 'n2_localize'
				,target: 'n2_localized'
				,fn: this._localize
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_briefDisplay'
				,target: 'n2s_briefDisplayed'
				,fn: this._briefDisplay
				,acceptsContextDocument: true
			},
			{
				source: 'n2_briefDisplay'
				,target: 'n2_briefDisplayed'
				,fn: this._briefDisplay
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_fullDisplay'
				,target: 'n2s_fullDisplayed'
				,fn: this._fullDisplay
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_referenceLink'
				,target: 'n2s_insertedReferenceLink'
				,fn: this._insertReferenceLink
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_insertTime'
				,target: 'n2s_insertedTime'
				,fn: this._insertTime
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_insertUserName'
				,target: 'n2s_insertedUserName'
				,fn: this._insertUserName
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_insertLayerName'
				,target: 'n2s_insertedLayerName'
				,fn: this._insertLayerName
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertMediaView'
				,target: 'n2s_insertedMediaView'
				,fn: this._insertMediaView
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertMediaPlayer'
				,target: 'n2s_insertedMediaPlayer'
				,fn: this._insertMediaPlayer
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertModuleName'
				,target: 'n2s_insertedModuleName'
				,fn: this._insertModuleName
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertFirstThumbnail'
				,target: 'n2s_insertedFirstThumbnail'
				,fn: this._insertFirstThumbnail
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertHoverSoundIcon'
				,target: 'n2s_insertedHoverSoundIcon'
				,fn: this._insertHoverSoundIcon
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_externalMediaLink'
				,target: 'n2s_adjustedExternalMediaLink'
				,fn: this._adjustExternalMediaLink
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_insertExternalMediaLink'
				,target: 'n2s_insertedExternalMediaLink'
				,fn: this._insertExternalMediaLink
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_convertTextUrlToLink'
				,target: 'n2s_convertedTextUrlToLink'
				,fn: this._convertTextUrlToLink
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_clickFindGeometryOnMap'
				,target: 'n2s_findGeometryOnMap'
				,fn: this._clickFindGeometryOnMap
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_clickAddLayerFromDefinition'
				,target: 'n2s_addLayerFromDefinition'
				,fn: this._clickAddLayerFromDefinition
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_clickEdit'
				,target: 'n2s_edit'
				,fn: this._clickEdit
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_clickDelete'
				,target: 'n2s_delete'
				,fn: this._clickDelete
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_handleHover'
				,target: 'n2s_handledHover'
				,fn: this._handleHover
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_installMaxHeight'
				,target: 'n2s_installedMaxHeight'
				,fn: this._installMaxHeight
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_clickLogin'
				,target: 'n2s_login'
				,fn: this._clickLogin
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_clickMapEdit'
				,target: 'n2s_mapEdit'
				,fn: this._clickMapEdit
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_preserveSpaces'
				,target: 'n2s_preservedSpaces'
				,fn: this._preserveSpaces
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_insertDocumentList'
				,target: 'n2s_insertedDocumentList'
				,fn: this._insertDocumentList
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_select'
				,target: 'n2s_selected'
				,fn: this._select
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_installTiledImageClick'
				,target: 'n2s_installedTiledImageClick'
				,fn: this._installTiledImageClick
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_custom'
				,target: 'n2s_customed'
				,fn: this._custom
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_userEvents'
				,target: 'n2s_userEvents_installed'
				,fn: this._userEvents
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_wikiTransform'
				,target: 'n2s_wikiTransformed'
				,fn: this._wikiTransform
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_showFindAvailable'
				,target: 'n2s_showedFindAvailable'
				,fn: this._showFindAvailable
				,acceptsContextDocument: true
			},
			{
				source: 'n2s_attachMDCButton'
				,target: 'n2s_attachedMDCButton'
				,fn: this._attachMDCButton
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCCheckbox'
				,target: 'n2s_attachedMDCCheckbox'
				,fn: this._attachMDCCheckbox
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCChipSet'
				,target: 'n2s_attachedMDCChipSet'
				,fn: this._attachMDCChipSet
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCDataTable'
				,target: 'n2s_attachedMDCDataTable'
				,fn: this._attachMDCDataTable
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCDrawer'
				,target: 'n2s_attachedMDCDrawer'
				,fn: this._attachMDCDrawer
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCFormField'
				,target: 'n2s_attachedMDCFormField'
				,fn: this._attachMDCFormField
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCList'
				,target: 'n2s_attachedMDCList'
				,fn: this._attachMDCList
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCMenu'
				,target: 'n2s_attachedMDCMenu'
				,fn: this._attachMDCMenu
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCRadio'
				,target: 'n2s_attachedMDCRadio'
				,fn: this._attachMDCRadio
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCSelect'
				,target: 'n2s_attachedMDCSelect'
				,fn: this._attachMDCSelect
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCTabBar'
				,target: 'n2s_attachedMDCTabBar'
				,fn: this._attachMDCTabBar
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCTextField'
				,target: 'n2s_attachedMDCTextField'
				,fn: this._attachMDCTextField
				,acceptsContextDocument: false
			},
			{
				source: 'n2s_attachMDCTopAppBar'
				,target: 'n2s_attachedMDCTopAppBar'
				,fn: this._attachMDCTopAppBar
				,acceptsContextDocument: false
			}
		];
	
		// Make an array of changes that accepts a context document
		this.changesWithContext = [];
		this.changes.forEach(function(change){
			if( change.acceptsContextDocument ){
				_this.changesWithContext.push(change);
			};
		});
		
		// Make a maps of changes for V3 processing
		this.changesMap = {};
		this.changes.forEach(function(change){
			_this.changesMap[change.source] = change;
		});
		
		// The mutation observer can make changes that do not require a context.
		// The mutation observer observes all changes on a document.
		this.mutationObserver = null;
//		if( typeof MutationObserver == 'function' ){
//			// Create a dictionary of changes to support observer
//			this.observerChangeMap = {};
//			this.changes.forEach(function(change){
//				if( !change.acceptsContextDocument ){
//					_this.observerChangeMap[change.source] = change;
//				};
//			});
//
//			this.mutationObserver = new MutationObserver(function(mutations, observer){
//				_this._observeMutations(mutations);
//			});
//			
//			this.mutationObserver.observe($('body')[0], {
//				childList: true
//				,subtree: true
//				,attributes: true
//				,attributeFilter: ['class']
//			});
//		};
	},

	fixElementAndChildren: function($elem, opt, contextDoc){
//		if( typeof performance !== 'undefined' ){
//			var _this = this;
//			var start = performance.now();
//		};
		
		this._fixElementAndChildrenV3($elem, opt, contextDoc);

//		if( typeof performance !== 'undefined' ){
//			var end = performance.now();
//			var elapsed = end-start;
//			if( this.maxElapsed === undefined ){
//				this.maxElapsed = elapsed;
//			} else if( elapsed > this.maxElapsed ){
//				this.maxElapsed = elapsed;
//			};
//			if( this.totalElapsed === undefined ){
//				this.totalElapsed = elapsed;
//			} else {
//				this.totalElapsed += elapsed;
//			};
//			if( !this.performanceInstalled ){
//				this.performanceInstalled = true;
//				$('<a>')
//					.attr('href','#')
//					.text( _loc('Log Perf') )
//					.css({
//						'text-decoration': 'none',
//				    	'color': '#fff'
//					})
//					.appendTo( $('.nunaliit_footer') )
//					.click(function(){
//						$n2.log('total: '+_this.totalElapsed+' max: '+_this.maxElapsed);
//						return false;
//					});
//				$('<a>')
//					.attr('href','#')
//					.text( _loc('Reset Perf') )
//					.css({
//						'text-decoration': 'none',
//				    	'color': '#fff'
//					})
//					.appendTo( $('.nunaliit_footer') )
//					.click(function(){
//						_this.totalElapsed = 0;
//						_this.maxElapsed = 0;
//						return false;
//					});
//			};
//		};
	},

	// V3 is 24% faster than V2 and 31% faster than V1
	_fixElementAndChildrenV3: function($elem, opt, contextDoc){
		var _this = this;
		
		// Call custom code to modify element
		var dispatchService = this.showService.dispatchService;
		if( dispatchService ) {
			dispatchService.synchronousCall(DH, {
				type:'showPreprocessElement'
				,elem: $elem
				,doc: contextDoc
				,showService: this.showService
			});
		};
		
		$elem.each(function(){
			modifyElement(this);
//				var childElems = getChildElements(this);
//				childElems.forEach(function(node){
//					modifyElement(node);
//				});
			iterateOverChildElements(this, modifyElement);
		});
		
		function modifyContextedElement(element){
			var classes = element.className;
			if( typeof classes === 'string' ){
				var classNames = classes.split(' ');
				classNames.forEach(function(className){
					var changes = _this.changesWithContext[className];
					if( changes 
					 && typeof changes.target === 'string' 
					 && typeof changes.fn === 'function' ){
						try {
							replaceClassName(element, className, changes.target);
							changes.fn.call(_this, $(element), contextDoc, opt);
						} catch(e) {
							console.log('Error applying change: '+className,e);
						};
					};
				});
			};
		};
		
		function modifyElement(element){
			var classes = element.className;
			if( typeof classes === 'string' ){
				var classNames = classes.split(' ');
				classNames.forEach(function(className){
					var changes = _this.changesMap[className];
					if( changes 
					 && typeof changes.target === 'string' 
					 && typeof changes.fn === 'function' ){
						try {
							replaceClassName(element, className, changes.target);
							changes.fn.call(_this, $(element), contextDoc, opt);
						} catch(e) {
							console.log('Error applying change: '+className,e);
						};
					};
				});
			};
		};
	},

	// V2 is 9% faster than V1
	_fixElementAndChildrenV2: function($elem, opt, contextDoc){
		var _this = this;
		
		// Call custom code to modify element
		var dispatchService = this.showService.dispatchService;
		if( dispatchService ) {
			dispatchService.synchronousCall(DH, {
				type:'showPreprocessElement'
				,elem: $elem
				,doc: contextDoc
				,showService: this.showService
			});
		};
		
		
		var $set = $elem;
		
		if( this.mutationObserver ){
			// Perform all changes based on context, leaving the changes that
			// do not require a context to the mutation observer
			this.changesWithContext.forEach(function(change){
				var sourceClassName = change.source;
				var targetClassName = change.target;
				var fn = change.fn;
				
				findAndExecute($set, sourceClassName, targetClassName, fn);
			});

		} else {
			// There is no mutation observer. Perform all changes
			this.changes.forEach(function(change){
				var sourceClassName = change.source;
				var targetClassName = change.target;
				var fn = change.fn;
				
				findAndExecute($set, sourceClassName, targetClassName, fn);
			});
		};
		
		
		function findAndExecute($set, sourceClass, targetClass, fn){
			if( $set.hasClass(sourceClass) ){
				execute($set, sourceClass, targetClass, fn);
			};
			$set.find('.'+sourceClass).each(function(){
				execute($(this), sourceClass, targetClass, fn);
			});
		};
		
		function execute($set, sourceClass, targetClass, fn){
			$set
				.removeClass(sourceClass)
				.addClass(targetClass);
			fn.call(_this, $set, contextDoc, opt);
		};
	},
	
	_fixElementAndChildrenV1: function($elem, opt, contextDoc){
		var _this = this;
		
		// Call custom code to modify element
		var dispatchService = this.showService.dispatchService;
		if( dispatchService ) {
			dispatchService.synchronousCall(DH, {
				type:'showPreprocessElement'
				,elem: $elem
				,doc: contextDoc
				,showService: this.showService
			});
		};
		
		
		var $set = $elem.find('*').addBack();

		// Perform all changes
		this.changes.forEach(function(change){
			var sourceClassName = change.source;
			var targetClassName = change.target;
			var fn = change.fn;
			
			$set.filter('.'+sourceClassName).each(function(){
				var $jq = $(this);
				$jq.removeClass(sourceClassName).addClass(targetClassName);
				fn.call(_this, $jq, contextDoc, opt);
			});
		});
	},
	
	_observeMutations: function(mutations){
		var _this = this;

		mutations.forEach(function(mutation) {
			if( mutation.type === 'attributes' ){
				if( mutation.target 
				 && mutation.target.nodeType === 1 /* element */ ){
					fixElement(mutation.target);
				};

			} else if( mutation.type === 'childList' ){
				if( mutation.addedNodes 
				 && mutation.addedNodes.length ){
					for(var i=0; i<mutation.addedNodes.length; ++i){
						var node = mutation.addedNodes.item(i);
						if( node && node.nodeType === 1 /*element*/ ){
							fixElement(node);
						};
					};
				};

			} else {
				console.log('mutation: '+mutation.type,mutation);
			};
		});
		
		function fixElement(element){
			var classes = element.className;
			if( typeof classes === 'string' ){
				var classNames = classes.split(' ');
				classNames.forEach(function(className){
					var changes = _this.observerChangeMap[className];
					if( changes 
					 && typeof changes.target === 'string' 
					 && typeof changes.fn === 'function' ){
						try {
							replaceClassName(element, className, changes.target);
							changes.fn.call(_this, $(element));
						} catch(e) {
							console.log('Error applying change: '+className,e);
						};
					};
				});
			};
		};
	},
	
	_receivedDocumentContent: function(doc){
		var _this = this;
		
		var docId = undefined;
		if( doc ){
			docId = doc._id;
		};
		
		var contentClass = undefined;
		if( docId ){
			contentClass = 'n2show_documentContent_' + $n2.utils.stringToHtmlId(docId);
		};
		
		if( contentClass ){
			$('.'+contentClass).each(function(){
				var $jq = $(this);

				_this._refreshElementWithDocument($jq, doc);

				var isContinuous = $jq.attr('data-content-continuous');
				
				// Content was received. No longer waiting for it.
				if( !isContinuous ){
					$jq.removeClass(contentClass);
				};
			});
		};
		
		// Handle layer definitions
		if( doc 
		 && doc.nunaliit_layer_definition ){
			var layerId = doc.nunaliit_layer_definition.id;
			if( !layerId ){
				layerId = doc._id;
			};

			if( layerId ){
				contentClass = 'n2show_layerContent_' + $n2.utils.stringToHtmlId(layerId);

				$('.'+contentClass).each(function(){
					var $jq = $(this);
					
					// No longer waiting for layer. Update with
					// document
					$jq.removeClass(contentClass);
					_this._associateDocumentToElement(doc, $jq);

					_this._refreshElementWithDocument($jq, doc);
				});
			};
		};
	},

	_receivedDocumentUpdate: function(doc){
		var _this = this;
		
		var docId = undefined;
		if( doc ){
			docId = doc._id;
		};
		
		var updateClass = undefined;
		if( docId ){
			updateClass = 'n2show_documentUpdate_' + $n2.utils.stringToHtmlId(docId);
		};
		
		if( updateClass ){
			$('.'+updateClass).each(function(){
				var $jq = $(this);

				_this._refreshElementWithDocument($jq, doc);
			});
		};
		
		// On update, it is possible that a list is affected.
		$('.n2show_documentList').each(function(){
			var $jq = $(this);

			_this._insertDocumentList($jq);
		});
	},

	_refreshElementWithDocument: function($jq, doc){
		var dispatchService = this.showService.dispatchService;
		if( dispatchService ) {
			dispatchService.synchronousCall(DH, {
				type:'showPreprocessElement'
				,elem: $jq
				,doc: doc
				,showService: this.showService
			});
		};

		if( $jq.hasClass('n2s_insertedMediaView') ){
			this._insertMediaView($jq, doc);
		};

		if( $jq.hasClass('n2s_insertedMediaPlayer') ){
			this._insertMediaPlayer($jq, doc);
		};
		
		if( $jq.hasClass('n2s_insertedFirstThumbnail') ){
			this._insertFirstThumbnail($jq, doc);
		};
		
		if( $jq.hasClass('n2s_customed') ){
			this._custom($jq, doc);
		};
		
		if( $jq.hasClass('n2s_userEvents_installed') ){
			this._userEvents($jq, doc);
		};

		if( $jq.hasClass('n2s_briefDisplayed') ){
			this._briefDisplay($jq, doc);
		};

		if( $jq.hasClass('n2s_fullDisplayed') ){
			this._fullDisplay($jq, doc);
		};

		if( $jq.hasClass('n2s_insertedLayerName') ){
			this._insertLayerName($jq, doc);
		};

		if( $jq.hasClass('n2s_insertedModuleName') ){
			this._insertModuleName($jq, doc);
		};

		if( $jq.hasClass('n2s_showedFindAvailable') ){
			this._showFindAvailable($jq, doc);
		};
	},

	_localize: function($jq) {
		var text = $jq.text();
		var locText = undefined;
		if( $n2.l10n 
		 && $n2.l10n.lookupDictionaryTranslation ){
			locText = $n2.l10n.lookupDictionaryTranslation(text, 'nunaliit2-couch');
		};
		if( typeof locText === 'string' ) {
			$jq.text(locText);
		} else {
			$jq.addClass('n2s_waiting_for_localization');
		};
	},
	
	_preserveSpaces: function($jq) {
		$jq.each(function(){
			performPreserveSpace(this);
		});
		
		function performPreserveSpace(parent){
			var node = parent.firstChild;
			while(node){
				if( node.nodeType === 3 ){ // text node
					$(node.parentNode).css('white-space','pre-wrap');
					node = node.nextSibling;
				} else {
					performPreserveSpace(node);
					node = node.nextSibling;
				};
			};
		};
	},
	
	_insertDocumentList: function($jq){
		var listType = $jq.attr('nunaliit-list-type');
		if( typeof listType === 'undefined' ){
			listType = $jq.attr('n2-list-type');
			if( listType ){
				$jq.attr('nunaliit-list-type',listType);
			};
		};
		var listName = $jq.attr('nunaliit-list-name');
		if( typeof listName === 'undefined' ){
			listName = $jq.attr('n2-list-name');
			if( listName ){
				$jq.attr('nunaliit-list-name',listName);
			};
		};
		
		$jq
			.addClass('n2show_documentList n2show_documentList_wait')
			.empty();
		
		var dispatchService = this.showService.dispatchService;
		if( dispatchService ) {
			dispatchService.send(DH, {
				type:'documentListQuery'
				,listType: listType
				,listName: listName
			});
		};
	},

	_select: function($jq){
		var choiceName = $jq.attr('n2-choice');
		
		var found = false;
		$jq.find('.n2s_choice').each(function(){
			var $choice = $(this);
			var name = $choice.attr('n2-choice');
			if( name === choiceName ){
				found = true;
			} else {
				$choice.remove();
			};
		});

		if( found ){
			$jq.find('.n2s_choiceDefault').remove();
		};
	},
	
	_briefDisplay: function($jq, data) {
		var docId = $jq.attr('nunaliit-document');
		if( !docId ){
			docId = $jq.text();
			$jq.attr('nunaliit-document',docId);
		};

		var docId = this._associateDocumentToElement(data, $jq);
		
		if( data && data._id === docId ){
			this.showService._displayDocumentBrief($jq, data);
		};
	},
	
	_fullDisplay: function($jq, data, opt_) {
		var docId = this._associateDocumentToElement(data, $jq);
		
		if( data && data._id === docId ){
			var $card = $jq.find('.n2_card_content');

			if ($card.length) {
				this.showService._displayDocumentFull($card, data, opt_);
			} else {
				this.showService._displayDocumentFull($jq, data, opt_);
			}
		};
	},
	
	_insertReferenceLink: function($jq) {
		var _this = this;

		var docId = $jq.attr('nunaliit-document');
		if( !docId ){
			docId = $jq.text();
			$jq.attr('nunaliit-document',docId);
		};

		this.showService.printBriefDescription($jq, docId);
		$jq.click(function(){
			var dispatchService = _this.showService.dispatchService;
			if( dispatchService ) {
				dispatchService.send(DH, {type:'userSelect',docId:docId});
			};

			if( _this.displayFunction ) {
				_this.displayFunction(docId,opt_);
			};

			return false;
		});
	},
	
	_insertTime: function($jq) {
		var time = 1 * $jq.text();
		var timeStr = (new Date(time)).toString();
		$jq.text(timeStr);
	},
	
	_insertUserName: function($elem) {
		var userName = $elem.attr('nunaliit-user');
		if( !userName ){
			userName = $elem.text();
		};
		
		this.showService.printUserName(
			$elem
			,userName
			,{showHandle:true}
			);
	},
	
	_insertLayerName: function($elem, data) {
		var layerIdentifier = $elem.attr('nunaliit-layer');
		var docId = $elem.attr('nunaliit-document');
		
		// Legacy: layer id used to be specified as text
		if( !layerIdentifier && !docId ){
			layerIdentifier = $elem.text();
			$elem.attr('nunaliit-layer',layerIdentifier);
		};
		
		// Compute inline layer definition
		var inlineDefinition = undefined;
		if( data 
		 && data.nunaliit_layer_definition ){
			inlineDefinition = data.nunaliit_layer_definition;
			if( !inlineDefinition.id ){
				// Legacy: layer definition uses doc id
				inlineDefinition.id = data._id;
			};
		};

		// Associated by layer id?
		var doc = undefined;
		if( layerIdentifier ){
			if( inlineDefinition 
			 && inlineDefinition.id === layerIdentifier ){
				// No need to make a request. We already have the document.
				doc = data;
			} else {
				var associated = $elem.hasClass('n2show_layerAssociated');
				if( !associated ){
					// Must request this layer definition
					$elem.addClass('n2show_layerAssociated');
					var contentClass = 'n2show_layerContent_' + $n2.utils.stringToHtmlId(layerIdentifier);
					$elem.addClass(contentClass);

					// Request this document
					this.showService._requestLayerDefinition(layerIdentifier);
				};
			};
			
		} else if( docId ) {
			// Associated by docId?
			if( data && data._id === docId ){
				// No need to make a request. We already have the document
				doc = data;
			};
			this._associateDocumentToElement(data, $elem);
			
		} else if( inlineDefinition ){
			// Associated with inline-document?
			doc = data;
			this._associateDocumentToElement(data, $elem);
		};

		
		if( doc 
		 && doc.nunaliit_layer_definition ){
			var layerId = doc.nunaliit_layer_definition.id;
			if( !layerId ){
				layerId = doc._id;
			};
			
			if( layerId === layerIdentifier ){
				if( doc.nunaliit_layer_definition.name ){
					var name = _loc(doc.nunaliit_layer_definition.name);
					
					$elem.text(name);
				};
			};
		};
	},

	_insertMediaView: function($insertView, data) {
		var _this = this;
		
		var docId = this._associateDocumentToElement(data, $insertView);
		
		var attachmentName = $insertView.attr('nunaliit-attachment');
		if( !attachmentName ) {
			attachmentName = $insertView.text();
			$insertView.attr('nunaliit-attachment', attachmentName);
		};

		$insertView.empty();

		// Do we have document?
		if( data && data._id === docId ){
			var attachment = null;
			if( data._attachments 
			 && data._attachments[attachmentName] ){
				attachment = data._attachments[attachmentName];
			};

			var attDesc = null;
			if( data 
			 && data.nunaliit_attachments 
			 && data.nunaliit_attachments.files ) {
				attDesc = data.nunaliit_attachments.files[attachmentName];
			};
			
			if( attDesc
			 && attDesc.status === 'attached'
			 && attachment ) {
				
				var attUrl = this.db.getAttachmentUrl(data,attachmentName);

				// An attachment was uploaded for this file
				var linkDiv = null;
				if( attDesc.thumbnail
				 && data._attachments[attDesc.thumbnail]
				 ) {
					var thumbUrl = this.db.getAttachmentUrl(data,attDesc.thumbnail);
					linkDiv = $('<div class="n2Show_thumb_wrapper"><img src="'+thumbUrl+'"/></div>');

				} else if( attDesc.fileClass === 'image' ) {
					linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_image"></div></div>');
				
				} else if( attDesc.fileClass === 'audio' ) {
					linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_audio"></div></div>');
				
				} else if( attDesc.fileClass === 'video' ) {
					linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_video"></div></div>');
					
				} else {
					linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_file"></div></div>');
				};
				
				if( null != linkDiv ) {
					$insertView.append(linkDiv);
					var cb = createMediaCallback(
							attDesc.fileClass
							,attUrl
							,data
							,attachmentName
						);
					linkDiv.click(cb);
				};
			};

		} else {
			// Do not have document
			var label = _loc('Media({docId},{attName})',{
				docId: docId
				,attName: attachmentName
			});
			$('<span>')
				.addClass('n2s_insertMediaView_wait')
				.text(label)
				.appendTo($insertView);
		};
		
		function createMediaCallback(uploadType, attachmentUrl, doc, attachmentName) {
			
			return function(evt) {
				var mediaOptions = {
					url: attachmentUrl
					,suppressLeaveConfirmation: suppressLeaveConfirmation
				};
				
				// Mime type
				var attachment = null;
				if( doc._attachments && doc._attachments[attachmentName] ){
					attachment = doc._attachments[attachmentName];
				};
				if( attachment ) {
					mediaOptions.mimeType = attachment.content_type;
				};
				
				var attDesc = doc.nunaliit_attachments.files[attachmentName];
				// Title
				if( attDesc
				 && attDesc.data
				 && attDesc.data.title ) {
					mediaOptions.title = attDesc.data.title;
				};
				
				// Height and width
				if( attDesc ){
					if(attDesc.width){
						mediaOptions.width = attDesc.width;
					};

					if(attDesc.height){
						mediaOptions.height = attDesc.height;
					};

					if( 'image' === uploadType 
					 && attDesc.photosphere
					 && attDesc.photosphere.type === 'panorama' ) {
						uploadType = 'photosphere';
					};
				};
				
				if( 'image' === uploadType || 'photosphere' === uploadType ){
					_this.showService.displayImageSourceFactory.getImageSourceForDoc({
						doc: doc
						,attName: attachmentName
						,showService: _this.showService
						,onSuccess: function(imageSource, doc, startIndex){
							new nunaliit2.displayBox.DisplayBox({
								imageSource: imageSource
								,startIndex: startIndex
							});
						}
						,onError: function(err){
							$n2.log('Error while creating image source factory', err);
						}
					});
					
				} else {
					// Generate brief HTML
					var $temp = $('<div></div>');
					_this.showService._displayDocumentBrief($temp,doc,{
						onDisplayed:function(){
							var html = $temp.html();
							mediaOptions.metaDataHtml = html;
								
							// Display media
							mediaOptions.type = uploadType;
							$n2.mediaDisplay.displayMedia(mediaOptions);
						}
					});
				};
				
				return false;
			};
		};
	},


	_insertMediaPlayer: function($insertView, data) {
		var _this = this;

		var docId = this._associateDocumentToElement(data, $insertView);

		var attachmentName = $insertView.attr('nunaliit-attachment');
		if( !attachmentName ){
			attachmentName = $insertView.text();
			$insertView.attr('nunaliit-attachment', attachmentName);
		};

		$insertView.empty();

		if( data && data._id === docId ){
			var attachment = null;
			if( data._attachments 
				&& data._attachments[attachmentName] ){
				attachment = data._attachments[attachmentName];
			};

			var attDesc = null;
			if( data 
				&& data.nunaliit_attachments 
				&& data.nunaliit_attachments.files ) {
				attDesc = data.nunaliit_attachments.files[attachmentName];
			};

			var thumbnailURL = null;
			if( attDesc && attDesc.thumbnail ){
				thumbnailURL = this.db.getAttachmentUrl(data,attDesc.thumbnail);
			};

			if( attDesc
				&& attDesc.status === 'attached'
				&& attachment ) {

				var attUrl = this.db.getAttachmentUrl(data,attachmentName);
				var mediaDivId = $n2.getUniqueId();
				var mediaId = $n2.getUniqueId();
				var audioWidth = 300;

				if( attDesc.fileClass === 'audio' && attUrl ){

					var $mediaDiv = $('<div>')
						.attr('id', mediaDivId)
						.appendTo($insertView);

					var $audio = $('<audio>')
						.attr('id', mediaId)
						.attr('controls', 'controls')
						.attr('width', audioWidth)
						.appendTo($mediaDiv);

					var $audioSource = $('<source>')
						.attr('src', attUrl)
						.appendTo($audio);

					if( attDesc.mimeType ){
						$audioSource.attr('type', attDesc.mimeType);
					};

					$('#'+mediaId).mediaelementplayer({
						features: ['playpause','progress','volume','sourcechooser']
					});

				} else if( attDesc.fileClass === 'video' && attUrl ){

					var $mediaDiv = $('<div>')
						.attr('id', mediaDivId)
						.appendTo($insertView);

					var $video = $('<video>')
						.attr('id', mediaId)
						.attr('controls', 'controls')
						.attr('width', attDesc.width)
						.attr('height', attDesc.height)
						.appendTo($mediaDiv);

					var $videoSource = $('<source>')
						.attr('src', attUrl)
						.appendTo($video);

					if( attDesc.mimeType ){
						$videoSource.attr('type', attDesc.mimeType);
					};

					$('#'+mediaId).mediaelementplayer({
						poster: thumbnailURL
						,features: ['playpause','progress','volume','sourcechooser','fullscreen']
					});
				};

				var $docBrief = $('<span>')
					.addClass('n2s_briefDisplay')
					.attr('nunaliit-document',data._id)
					.appendTo($insertView);
		
				_this.fixElementAndChildren($docBrief, {}, null);
			};

		} else {
			// Do not have playable media document
			var label = _loc('Media({docId},{attName})',{
				docId: docId
				,attName: attachmentName
			});
			$('<span>')
				.addClass('n2s_insertMediaPlayer_wait')
				.text(label)
				.appendTo($insertView);
		};
	},

	_insertModuleName: function($jq, data) {
		var docId = this._associateDocumentToElement(data, $jq);
		
		if( data 
		 && data._id === docId 
		 && data.nunaliit_module
		 && data.nunaliit_module.title ){
			var title = _loc(data.nunaliit_module.title);
			$jq.text(title);
		};
	},
	
	_insertFirstThumbnail: function($insertElem, doc){

		var docId = this._associateDocumentToElement(doc, $insertElem);

		$insertElem.empty();

		var attachmentService = null;
		if( this.showService ){
			attachmentService = this.showService.attachmentService;
		};

		if( doc && doc._id === docId ){
			// Select first thumbnail
			var attachment = null;
			if( attachmentService ){
				var attachments = attachmentService.getAttachments(doc);
				for(var i=0,e=attachments.length; i<e; ++i){
					var att = attachments[i];
					if( att.isSource  ){
						var thumbnailAtt = att.getThumbnailAttachment();
						if( thumbnailAtt 
						 && thumbnailAtt.isAttached() ){
							attachment = thumbnailAtt;
							break;
						};
					};
				};
			};
			
			if( attachment ){
				$('<img>')
					.attr('src',attachment.computeUrl())
					.appendTo($insertElem);
			};
		};
	},
	
	_insertHoverSoundIcon: function($insertHoverSoundIcon, data){
		var _this = this;
		var playSound = false;

		if( $n2.couchSound
		 && $n2.couchSound.DocumentContainsHoverSound
		 && $n2.couchSound.DocumentContainsHoverSound(data) ) {
			var $wrapper = $('<div>')
				.addClass('n2Show_icon_wrapper')
				.appendTo($insertHoverSoundIcon);
			$('<div>')
				.addClass('n2Show_icon_speaker')
				.appendTo($wrapper)
				.click(function(){
					toggleHoverSound();
					return false;
				});
		};
		
		function toggleHoverSound(){
			var dispatchService = _this.showService.dispatchService;
			if( dispatchService ) {
				if( !playSound ) {
					dispatchService.send(DH, {type:'playHoverSoundOn',doc:data});
					playSound = true;
				} else {
					dispatchService.send(DH, {type:'playHoverSoundOff',doc:data});
					playSound = false;
				};
			};
		};
	},
	
	_adjustExternalMediaLink: function($externalLink, data) {
		var attachmentName = $externalLink.attr('href');
		
		var attachment = null;
		if( data._attachments 
		 && data._attachments[attachmentName] ) {
			attachment = data._attachments[attachmentName];
		};
		
		var attDesc = null;
		if( data 
		 && data.nunaliit_attachments 
		 && data.nunaliit_attachments.files ) {
			attDesc = data.nunaliit_attachments.files[attachmentName];
		};
		
		if( attDesc
		 && attDesc.status === 'attached' 
		 && attachment ) {
			
			var attUrl = this.db.getAttachmentUrl(data,attachmentName);

			$externalLink.attr('href',attUrl);
			$externalLink.click(function(e){
				if( suppressLeaveConfirmation ){
					return true;
				};

				if( confirm( _loc('You are about to leave this page. Do you wish to continue?') ) ) {
					return true;
				};
				return false;
			});
			
		} else {
			// At this point, we have a link that leads nowhere. Simply report
			// error to user.
			$externalLink.click(function(e){
				alert( _loc('File is not currently available') );
				return false;
			});
		};
	},
	
	_insertExternalMediaLink: function($div, data) {
		var attachmentName = $div.attr('nunaliit-attachment');
		
		$div.empty();
		
		var attachment = null;
		if( data 
		 && data._attachments 
		 && data._attachments[attachmentName] ) {
			attachment = data._attachments[attachmentName];
		};
		
		var attDesc = null;
		if( data 
		 && data.nunaliit_attachments 
		 && data.nunaliit_attachments.files ) {
			attDesc = data.nunaliit_attachments.files[attachmentName];
		};
		
		if( attDesc
		 && attDesc.status === 'attached' 
		 && attachment ) {
			var attUrl = this.db.getAttachmentUrl(data,attachmentName);
			
			// Check if original is available
			if( attDesc.originalAttachment
			 && data._attachments[attDesc.originalAttachment] ) {
				// Use original attachment, instead
				attUrl = this.db.getAttachmentUrl(data,attDesc.originalAttachment);
			};

			// <a class="n2s_externalMediaLink" href="{{.}}">
			//   <span class="n2s_externalMediaLinkName">({{../originalName}})</span>
			// </a>

			var $a = $('<a></a>')
				.addClass('n2s_adjustedExternalMediaLink')
				.attr('href',attUrl)
				.click(function(e){
					if( suppressLeaveConfirmation ){
						return true;
					};

					if( confirm( _loc('You are about to leave this page. Do you wish to continue?') ) ) {
						return true;
					};
					return false;
				})
				.appendTo($div);

			var name = attDesc.originalName;
			if( !name ){
				name = attachmentName;
			};
			
			$('<span></span>')
				.addClass('n2s_externalMediaLinkName')
				.text(name)
				.appendTo($a);
		};
	},
	
	_convertTextUrlToLink: function($jq) {
		$jq.each(function(){
			performTextUrlToLink(this);
		});
		
		function performTextUrlToLink(parent){
			var node = parent.firstChild;
			while(node){
				if( node.nodeType === 3 ){ // text node
					var nextSibling = node.nextSibling;
					convertTextElement(parent, node);
					node = nextSibling;
				} else {
					performTextUrlToLink(node);
					node = node.nextSibling;
				};
			};
		};
		
		function convertTextElement(parent, textNode){
			var text = textNode.nodeValue;
			
			var removeTextNode = false;
			var m = reUrl.exec(text);
			var after = null;
			while(m){
				removeTextNode = true;
				
				after = m[3] + text.substr(m.index + m[0].length);
				var before = text.substr(0, m.index) + m[1];
				
				if( before.length > 0 ){
					var t2 = parent.ownerDocument.createTextNode(before);
					parent.insertBefore(t2,textNode);
				};
				
				// Create link
				var aNode = parent.ownerDocument.createElement('a');
				aNode.setAttribute('href',m[2]);
				aNode.setAttribute('class','n2s_convertedUrl');
				var t1 = parent.ownerDocument.createTextNode(m[2]);
				aNode.appendChild(t1);
				parent.insertBefore(aNode,textNode);
				
				// Continue search
				text = after;
				m = reUrl.exec(text);
			};
			
			if( after ){
				var t3 = parent.ownerDocument.createTextNode(after);
				parent.insertBefore(t3,textNode);
			};

			if( removeTextNode ) {
				parent.removeChild(textNode);
			};
		};
	},
	
	_clickFindGeometryOnMap: function($jq, data){
		var dispatcher = this.showService.dispatchService;

		if( data 
		 && data.nunaliit_geom 
		 && dispatcher
		 && dispatcher.isEventTypeRegistered('find')
		 ) {

			$jq.click(function(){
				dispatcher.send(
					DH
					,{
						type: 'find'
						,docId: data._id
						,doc: data
					}
				);
				return false;
			});
		} else {
			$jq.remove();
		};
	},
	
	_clickAddLayerFromDefinition: function($jq, contextDoc){
		var _this = this;

		var viewLayerFunction = this.viewLayerFunction;
		var dispatchService = _this.showService.dispatchService;
		
		if( viewLayerFunction || dispatchService ) {
			if( contextDoc
			 && contextDoc.nunaliit_layer_definition ) {
				$jq.click(function(){
					var layerDefinition = contextDoc.nunaliit_layer_definition;
					
					if( viewLayerFunction ) {
						viewLayerFunction(contextDoc);
					};
					
					if( dispatchService ) {
						var layerId = layerDefinition.id;
						if( !layerId ){
							layerId = contextDoc._id;
						};
						var layerDef = {
							name: layerDefinition.name
							,type: 'couchdb'
							,options: {
								layerName: layerId
								,documentSource: _this.documentSource
							}
						};
						
						dispatchService.send(
							DH
							,{
								type: 'addLayerToMap'
								,layer: layerDef
								,options: {
									setExtent: {
										bounds: layerDefinition.bbox
										,crs: 'EPSG:4326'
									}
								}
							}
						);
					};
					
					return false;
				});
			} else {
				$jq.remove();
			};
		} else {
			$jq.remove();
		};
	},
	
	_clickEdit: function($jq, contextDoc, opt){
		var _this = this;

		if( this.editFunction ) {
			$jq.click(function(){
				_this.editFunction(contextDoc,opt);
				return false;
			});
		} else {
			$jq.empty();
		};
	},
	
	_clickDelete: function($jq, contextDoc, opt){
		var _this = this;

		if( this.deleteFunction ) {
			$jq.click(function(){
				_this.deleteFunction(contextDoc,opt);
				return false;
			});
		} else {
			$jq.empty();
		};
	},
	
	_clickLogin: function($jq){
		var _this = this;

		$jq.click(function(){
			var dispatchService = _this.showService.dispatchService;
			if( dispatchService ) {
				dispatchService.send(DH, {
					type:'loginShowForm'
				});
			};
			return false;
		});
	},
	
	_clickMapEdit: function($jq){
		var _this = this;

		$jq.click(function(){
			var dispatchService = _this.showService.dispatchService;
			if( dispatchService ) {
				dispatchService.send(DH, {
					type:'mapSwitchToEditMode'
				});
			};
			return false;
		});
	},
	
	_installMaxHeight: function($jq){
		var maxHeight = $jq.attr('_maxheight');
		
		if( !maxHeight ) {
			$jq.attr('n2s_error','Attribute _maxheight not found');
			$n2.log('n2Show installMaxHeight: Attribute _maxHeight not found');
		} else if( $jq.height() > maxHeight ) {
			var showText = _loc('More');
			var hideText = _loc('Less');
			
			var id = $n2.getUniqueId();
			var $children = $jq.contents();
			var $content = $('<div class="n2show_maxHeightContent n2show_maxHeight_truncated"></div>')
				.attr('id',id);
			
			$jq.append($content);
			
			$children.each(function(){
				$(this).appendTo($content);
			});
			
			$content.css({
				overflow: 'hidden'
				,height: maxHeight + 'px'
			});
			
			var $link = $('<a href="#" class="n2show_maxHeightLink"></a>')
				.text(showText)
				.click(function(e) {
					e.preventDefault();

					var $link = $(this);
					var $content = $('#'+id);
					if ($content.height() > maxHeight) {
						$link.text(showText);
						$content
							.css('height', maxHeight + 'px')
							.addClass('n2show_maxHeight_truncated')
							.removeClass('n2show_maxHeight_full');
					} else {
						$link.text(hideText);
						$content
							.css('height', 'auto')
							.addClass('n2show_maxHeight_full')
							.removeClass('n2show_maxHeight_truncated');
					};
					
					return false;
				});

			$('<div class="n2show_maxHeightLinkContainer"></div>')
				.append($link)
				.appendTo($jq);
		};
	},
	
	_handleHover: function($jq, contextDoc){

        var dispatchService = this.showService.dispatchService;
        var docId = this._getDocumentIdentifier(contextDoc, $jq);

        if( dispatchService ) {
            $jq.hover(
                function(){ // in
                    dispatchService.send(DH, {
                        type:'userFocusOn'
                        ,docId:docId
                    });
                }
                ,function(){ // out
                    dispatchService.send(DH, {
                        type:'userFocusOff'
                        ,docId:docId
                    });
                }
            );
        };
    },

	_installTiledImageClick: function($elem, doc){
		var _this = this;
		
		var docId = this._getDocumentIdentifier(doc, $elem);
		var attName = $elem.attr('nunaliit-attachment');
		
		if( !docId ){
			$elem.attr('nunaliit-error','No document specified');
		} else if( !attName ){
			$elem.attr('nunaliit-error','No attachment specified');
		} else {
			// docId and attName are specified
			// Get URL
			var url = this.db.getAttachmentUrl({_id:docId},attName);
			
			$elem
				.css('cursor','pointer')
				.click(function(){
					new $n2.displayTiledImage.DisplayTiledImage({
						url: url
						,tileMapResourceName: 'tilemapresource.xml'
						,docId: docId
						,showService: _this.showService
					});
					return false;
				});
		};
	},

	_custom: function($elem, doc){
		var _this = this;
		
		var docId = this._associateDocumentToElement(doc, $elem);
		var customType = $elem.attr('nunaliit-custom');
		
		if( !customType ){
			$elem.attr('nunaliit-error','No custom type specified');
		} else if( doc ){
			// We have a document and a custom type

			// Get selector
			var selectorStr = $elem.attr('nunaliit-selector');
			var selector = undefined;
			if( selectorStr ){
				selector = $n2.objectSelector.decodeFromDomAttribute(selectorStr);
			};

			// Call dispatcher
			var dispatchService = this.showService.dispatchService;
			if( dispatchService ) {
				dispatchService.synchronousCall(DH, {
					type:'showCustom'
					,elem: $elem
					,doc: doc
					,customType: customType
					,selector: selector
					,showService: this.showService
				});
			};
		} else {
			// We have only a custom type

			// Call dispatcher
			var dispatchService = this.showService.dispatchService;
			if( dispatchService ) {
				dispatchService.synchronousCall(DH, {
					type:'showCustom'
					,elem: $elem
					,customType: customType
					,showService: this.showService
				});
			};
		};
	},
	
	_userEvents: function($elem, doc){
		var _this = this;
		
		var docId = this._getDocumentIdentifier(doc, $elem);
		
		var disableClick = false;
		var disableClickAttr = $elem.attr('nunaliit-disable-click');
		if( 'true' == disableClickAttr ){
			disableClick = true;
		};
		
		var disableHover = false;
		var disableHoverAttr = $elem.attr('nunaliit-disable-hover');
		if( 'true' == disableHoverAttr ){
			disableHover = true;
		};
		
		if( docId ){
			// We have a document identifier
			var eventClass = 'n2s_userEvents_doc_' + $n2.utils.stringToHtmlId(docId);
			$elem.addClass(eventClass);

			// Get current intent from user intent service
			var dispatchService = this.showService.dispatchService;
			if( dispatchService ) {
				// Update classes
				var msg = {
					type:'userIntentGetCurrent'
					,intentMap: null
				};
				dispatchService.synchronousCall(DH, msg);
				if( msg.intentMap ){
					// Is there a state for this node?
					var docState = msg.intentMap[docId];
					if( docState ){
						if( docState.n2_selected ){
							$elem.addClass('nunaliit_selected');
						};
						if( docState.n2_hovered ){
							$elem.addClass('nunaliit_hovered');
						};
						if( docState.n2_find ){
							$elem.addClass('nunaliit_found');
						};
					};
				};
				
				// Install events
				if( !disableClick ){
					$elem.click(function(){
						var $elem = $(this);
						
						var createSchema = $elem.attr('nunaliit-create-schema');
						if( createSchema ){
							_this.showService._createDocIfInexistant(docId, createSchema);
						} else {
							dispatchService.send(DH,{
								type:'userSelect'
								,docId: docId
							});
						};

						return false;
					});
				};

				if( !disableHover ){
					$elem.mouseover(function(e){
	 		 			dispatchService.send(DH,{
	 		 				type: 'userFocusOn'
	 		 				,docId: docId
	 		 			});
	 				})
					.mouseout(function(e){
	 		 			dispatchService.send(DH,{
	 		 				type: 'userFocusOff'
	 		 				,docId: docId
	 		 			});
	 				});
				};
			};
		};
	},
	
	_wikiTransform: function($elem, contextDoc){
		var _this = this;
		
		var text = $elem.text();

		if( $n2.wiki ){
			var html = $n2.wiki.WikiToHtml({
				wiki: text
			});

			$elem.html(html);
			
			$elem.find('.n2s_createDocOnClick').each(function(){
				var $node = $(this);
				if( contextDoc 
				 && contextDoc.nunaliit_schema ){
					$node.attr('nunaliit-create-schema',contextDoc.nunaliit_schema);
				};
			});
			
			$elem.children().each(function(){
				_this.fixElementAndChildren($(this), {}, contextDoc);
			});
		};
	},
	
	/*
	 * Keep track of a document's availability for the 'find' event. Adjust
	 * classes on the element depending on status: 'n2show_findAvailable' or 
	 * 'n2show_findNotAvailable'
	 */
	_showFindAvailable: function($elem, doc){
		var _this = this;
		
		var docId = this._associateDocumentToElement(doc, $elem);
		
		// "find is available" is special. It should be recomputed for every
		// received document content.
		var contentClass = 'n2show_documentContent_' + $n2.utils.stringToHtmlId(docId);
		$elem
			.addClass(contentClass)
			.attr('data-content-continuous','true');

		if( doc && doc._id === docId ){
			var findAvailable = false;
			
			var dispatchService = this.showService.dispatchService;
			if( dispatchService ) {
				var msg = {
					type: 'findIsAvailable'
					,docId: docId
					,doc: doc
					,isAvailable: false
				};
				dispatchService.synchronousCall(DH,msg);
				if( msg.isAvailable ){
					findAvailable = true;
				};
			};
			
			if( findAvailable ){
				$elem
					.removeClass('n2show_findNotAvailable')
					.addClass('n2show_findAvailable');
			} else {
				$elem
					.removeClass('n2show_findAvailable')
					.addClass('n2show_findNotAvailable');
			};
		};
	},
	
	_getDocumentIdentifier: function(doc, $elem){
		var docId = $elem.attr('nunaliit-document');

		if( !docId && doc ){
			docId = doc._id;
		};
		
		return docId;
	},
	
	_associateDocumentToElement: function(doc, $elem){
		var docId = this._getDocumentIdentifier(doc, $elem);

		var associated = $elem.hasClass('n2show_documentAssociated');
		
		if( docId && !associated ){
			$elem.attr('nunaliit-document', docId);
			$elem.addClass('n2show_documentAssociated');

			// Ready to receive updates
			var updateClass = 'n2show_documentUpdate_' + $n2.utils.stringToHtmlId(docId);
			$elem.addClass(updateClass);
			
			if( doc && doc._id === docId ){
				// Already have document
			} else {
				// Ready to receive content
				var contentClass = 'n2show_documentContent_' + $n2.utils.stringToHtmlId(docId);
				$elem.addClass(contentClass);

				// Request this document
				this.showService._requestDocument(docId);
			};
		};

		return docId;
	},

	_attachMDCButton: function($jq) {
		var btn = $jq[0];
		if (btn) {
			$mdc.ripple.MDCRipple.attachTo(btn);
		}
	},

	_attachMDCCheckbox: function($jq) {
		var chkbox = $jq[0];
		if (chkbox) {
			$mdc.checkbox.MDCCheckbox.attachTo(chkbox);
		}
	},

	_attachMDCChipSet: function($jq) {
		var attachedChipSet, $chipInput, chipInputId;
		var chipSet = $jq[0];

		function updateTagList(){
			var chipsList = [];
			var chips = $jq.find('.mdc-chip__text');

			for (var i = 0, e = chips.length; i < e; i += 1) {
				chipsList.push(chips[i].textContent);
			}

			// Store chips list data in chipset
			$('#' + chipSet.id).data('tags',chipsList);
			return chipsList;
			//alert($('#' + chipSet.id).first().data('tags'));
		};

		function generateChip(chipObj, type_opt){
			var $chip;
			var chipText;
			if (typeof chipObj === 'string'){
				chipText = chipObj;
				var chipId = $n2.getUniqueId();

				$chip = $('<div>').addClass('mdc-chip')
					.attr('id', chipId)
					.attr('tabindex','0');
				var chipOriType = 'unknown';
				if (type_opt){
					chipOriType = type_opt;
				}
				$chip.data('n2Chip', {
					chipText: chipObj,
					type: chipOriType,
					fraction: 'full'
				})
			} else if ( typeof chipObj === 'object'){
				chipText = chipObj.value;
				var fraction= undefined;
				if ( chipObj.fraction ){
					fraction = chipObj.fraction;
				};
				var chipId = $n2.getUniqueId();

				$chip = $('<div>').addClass('mdc-chip')
					.attr('id', chipId)
					.attr('tabindex','0');
				
				if (typeof fraction === 'undefined'){
					
				} else if (fraction === 'full'){
					$chip.addClass('mdc-chip-full');
				} else {
					$chip.addClass('mdc-chip-partial');
				}
				var chipOriType = 'unknown';
				if (type_opt){
					chipOriType = type_opt;
				}
				$chip.data('n2Chip', $n2.extend({type: chipOriType }, chipObj));
			}
			
			if (chipText) {
				$('<div>').addClass('mdc-chip__text')
					.text(chipText)
					.appendTo($chip);
			}

			$('<i>')
				.addClass('material-icons mdc-chip__icon mdc-chip__icon--trailing')
				.attr('tabindex','0')
				.attr('role','button')
				.text('x')
				.appendTo($chip);

			return $chip;
		};

		if (chipSet) {
			attachedChipSet = $mdc.chips.MDCChipSet.attachTo(chipSet);

			updateTagList();

			if ($jq.attr('n2associatedmdc')){
				chipInputId = $jq.attr('n2associatedmdc');
				$chipInput = $('#' + chipInputId);
				var chipsetsUpdateCallback = $('#' + chipSet.id).data('chipsetsUpdateCallback');
				$chipInput.keydown(function(event){
					if (event.key === 'Enter' || event.keyCode === 13) {
						if ($chipInput.val()){
							var newTagText = $chipInput.val()
							// Get Input Value
							var chipEl = generateChip({
								value: $chipInput.val()+'',
								fraction: 'full',
								type: 'unknown'
							});

							// Clear Input Field
							$chipInput.val('');
							chipEl.insertBefore($chipInput);
							attachedChipSet.addChip(chipEl[0]);

							var chiplist = updateTagList();
							if (typeof chipsetsUpdateCallback === 'function'){
								chipsetsUpdateCallback(chiplist, "ADD", {
									chipText: newTagText,
									type: 'unknown',
									fraction: 'full'}
								);
								
							}
						}
					}
				});

				attachedChipSet.listen('MDCChip:removal', function(event){
					if (event.detail && event.detail.chipId) {
						var $removedChip = $(event.target);
						var $removedChipText = $removedChip.find('.mdc-chip__text')[0];
						var delTagProfile = $removedChip.data('n2Chip');
						if (!delTagProfile){
							alert('NO delTagProfile');
						}
//						var delTagText = $removedChipText.innerText.slice();
						$removedChip.remove();
						var chiplist = updateTagList();
						if (typeof chipsetsUpdateCallback === 'function'){
							chipsetsUpdateCallback(chiplist, "DELETE", delTagProfile );
						}
					}
				});
			}
		}
	},

	_attachMDCDataTable: function($jq) {
		var datatable = $jq[0];
		if (datatable) {
			$mdc.dataTable.MDCDataTable.attachTo(datatable);
		}
	},

	_attachMDCDrawer: function($jq) {
		var attachedDrawer, drawerBtnId;
		var drawer = $jq[0];
		if (drawer) {
			attachedDrawer = $mdc.drawer.MDCDrawer.attachTo(drawer);
			if ($jq.attr('n2associatedmdc')){
				drawerBtnId = $jq.attr('n2associatedmdc');
				$('#' + drawerBtnId).click(function(){
					if (attachedDrawer) {
						attachedDrawer.open = !attachedDrawer.open;
					}
				});
			}
		}
	},

	_attachMDCFormField: function($jq) {
		var formField = $jq[0];
		if (formField) {
			$mdc.formField.MDCFormField.attachTo(formField);
		}
	},
	
	_attachMDCList: function($jq) {
		var list = $jq[0];
		if (list) {
			$mdc.list.MDCList.attachTo(list);
		}
	},
	
	_attachMDCMenu: function($jq) {
		var attachedMenu, menuBtnId;
		var menu = $jq[0];
		if (menu) {
			attachedMenu = $mdc.menu.MDCMenu.attachTo(menu);
			if ($jq.attr('n2associatedmdc')){
				menuBtnId = $jq.attr('n2associatedmdc');
				$('#' + menuBtnId).click(function(){
					if (attachedMenu) {
						attachedMenu.open = !attachedMenu.open;
					}
				});
			}
		}
	},
	
	_attachMDCRadio: function($jq) {
		var radioBtn = $jq[0];
		if (radioBtn) {
			$mdc.radio.MDCRadio.attachTo(radioBtn);
		}
	},
	
	_attachMDCSelect: function($jq) {
		var attachedSelect;
		var menu = $jq[0];
		if (menu) {
			attachedSelect = $mdc.select.MDCSelect.attachTo(menu);
			attachedSelect.layout();
		}
	},

	_attachMDCTabBar: function($jq) {
		var attachedTabBar;
		var tabBar = $jq[0];
		if (tabBar) {
			attachedTabBar = $mdc.tabBar.MDCTabBar.attachTo(tabBar);
			attachedTabBar.listen('MDCTabBar:activated', function(event){
				if (event.detail && event.detail.index) {
					attachedTabBar.activateTab(event.detail.index);
				}
			});
		}
	},
	
	_attachMDCTextField: function($jq) {
		var attachedTextField;
		var txtFld = $jq[0];
		var $txtFldLabel = $jq.find('label');
		if (txtFld) {
			attachedTextField = $mdc.textField.MDCTextField.attachTo(txtFld);
			attachedTextField.layout();

			// Update Notch width to match text field width if tag box
			if ($jq.hasClass('n2-tag-box')) {
				var labelWidth = $txtFldLabel.width();
				var labelScaleFactor = 0.75;
				var labelPadding = 8;
				var notchWidth = (labelWidth * labelScaleFactor) + labelPadding;
				$txtFldLabel.parent().css('max-width', notchWidth + 'px');
			}
		}
	},
	
	_attachMDCTopAppBar: function($jq) {
		var mdcTopAppBar;
		var _this = this;
		var topAppBar = $jq[0];
		if (topAppBar) {
			mdcTopAppBar = $mdc.topAppBar.MDCTopAppBar.attachTo(topAppBar);
			mdcTopAppBar.setScrollTarget(document.body);
		}
	}
});

//*******************************************************
var Show = $n2.Class({

	options: null,
	
	db: null,
	
	documentSource: null,
	
	requestService: null,
	
	dispatchService: null,
	
	schemaRepository: null,
	
	customService: null,
	
	attachmentService: null,
	
	displayImageSourceFactory: null,
	
	defaultSchema: null,
	
	displayFunction: null,
	
	editFunction: null,
	
	deleteFunction: null,
	
	viewLayerFunction: null,
	
	preprocessDocument: null,
	
	eliminateDeniedMedia: null,
	
	eliminateNonApprovedMedia: null,
	
	domStyler: null,
	
	postProcessDisplayFns: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,documentSource: null
			,requestService: null
			,dispatchService: null
			,schemaRepository: null
			,customService: null
			,attachmentService: null
			,displayImageSourceFactory: null
			,defaultSchema: null
			,displayFunction: null
			,editFunction: null
			,deleteFunction: null
			,viewLayerFunction: null
			,preprocessDocument: null
			,eliminateDeniedMedia: false
			,eliminateNonApprovedMedia: false
		},opts_);
		
		var _this = this;
		
		// Legacy
		this.options = {};
		
		this.db = opts.db;
		this.documentSource = opts.documentSource;
		this.requestService = opts.requestService;
		this.dispatchService = opts.dispatchService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
		this.attachmentService = opts.attachmentService;
		this.displayImageSourceFactory = opts.displayImageSourceFactory;
		this.defaultSchema = opts.defaultSchema;
		this.displayFunction = opts.displayFunction;
		this.editFunction = opts.editFunction;
		this.deleteFunction = opts.deleteFunction;
		this.viewLayerFunction = opts.viewLayerFunction;
		this.options.preprocessDocument = opts.preprocessDocument;
		this.eliminateDeniedMedia = opts.eliminateDeniedMedia;
		this.eliminateNonApprovedMedia = opts.eliminateNonApprovedMedia;
		this.postProcessDisplayFns = [];
		
		this.domStyler = new DomStyler({
			db: this.db
			,documentSource: this.documentSource
			,showService: this
			,displayFunction: this.displayFunction
			,editFunction: this.editFunction
			,deleteFunction: this.deleteFunction
			,viewLayerFunction: this.viewLayerFunction
		});

		var requestService = this.requestService;
		if( requestService ){
			requestService.addUserListener(function(userDoc){
				_this._displayUserDocument(userDoc);
			});
		};
		
		var dispatchService = this.dispatchService;
		if( dispatchService ){
			var f = function(msg, address, dispatchService){
				_this._handleDispatch(msg, address, dispatchService);
			};
			dispatchService.register(DH, 'start', f);
			dispatchService.register(DH, 'documentListResults', f);
			dispatchService.register(DH, 'documentContent', f);
			dispatchService.register(DH, 'documentDeleted', f);
			dispatchService.register(DH, 'documentContentCreated', f);
			dispatchService.register(DH, 'documentContentUpdated', f);
			dispatchService.register(DH, 'userIntentChanged', f);
			dispatchService.register(DH, 'findAvailabilityChanged', f);
		};
	},

	addPostProcessDisplayFunction: function(fn){
		if( typeof(fn) === 'function' ){
			this.postProcessDisplayFns.push(fn);
		};
	},

	fixElementAndChildren: function($elem, opt, contextDoc){
		this.domStyler.fixElementAndChildren($elem, opt, contextDoc);
	},
	
	displayBriefDescription: function($elem, opt_, doc){
		var opt = $n2.extend({
			onDisplayed: null // function($elem, doc, opt_){}
			,schemaName: null
		},opt_);

		if( doc && doc._id ) {
			$elem.addClass('n2s_briefDisplayed');
			$elem.attr('nunaliit-document',doc._id);

			this.domStyler._associateDocumentToElement(doc, $elem);
			
			this._displayDocumentBrief($elem, doc, opt);
		};
	},
	
	displayDocument: function($elem, opt_, doc){
		var opt = $n2.extend({
			onDisplayed: null // function($elem, doc, opt_){}
			,schemaName: null
		},opt_);

		if( doc && doc._id ) {
			$elem.addClass('n2s_fullDisplayed');
			$elem.attr('nunaliit-document',doc._id);

			this.domStyler._associateDocumentToElement(doc, $elem);

			this._displayDocumentFull($elem, doc, opt);
		};
	},
	
	printUserName: function($elem, userName, opts){
		$elem.addClass('n2ShowUser_'+$n2.utils.stringToHtmlId(userName));
		if( opts && opts.showHandle ) {
			$elem.addClass('n2ShowUserDisplayAndHandle');
		} else {
			$elem.addClass('n2ShowUserDisplay');
		};

		this._adjustUserNameNode($elem, userName, undefined);

		this._requestUser(userName); // fetch document
	},
	
	printBriefDescription: function($elem, docId){
		$elem.addClass('n2s_briefDisplayed');
		$elem.addClass('n2Show_docNotFound');
		$elem.attr('nunaliit-document',docId);

		this.domStyler._briefDisplay($elem);
	},
	
	printDocument: function($elem, docId){
		$elem.addClass('n2s_fullDisplayed');
		$elem.addClass('n2Show_docNotFound');
		$elem.attr('nunaliit-document',docId);
		
		this.domStyler._fullDisplay($elem);
	},
	
	printLayerName: function($elem, layerIdentifier){
		$elem.addClass('n2s_insertedLayerName');
		$elem.attr('nunaliit-layer',layerIdentifier);

		$elem.text(layerIdentifier);
		
		this.domStyler._insertLayerName($elem);
	},
	
	installUserEvents: function(opts_){
		var opts = $n2.extend({
			doc: null
			,elem: null
			,disableClick: false
			,disableHover: false
		},opts_);
		
		var $elem = $(opts.elem);
		
		if( opts.disableClick ){
			$elem.attr('nunaliit-disable-click','true');
		};
		if( opts.disableHover ){
			$elem.attr('nunaliit-disable-hover','true');
		};
		
		this.domStyler._userEvents($elem, opts.doc);
	},
	
	showFindAvailable: function(opts_){
		var opts = $n2.extend({
			doc: null
			,docId: null
			,elem: null
		},opts_);
		
		var doc = opts.doc;
		var docId = opts.docId;

		if( !docId && doc ){
			docId = doc._id;
		};

		var $elem = null;
		if( opts.elem ){
			$elem = $(opts.elem);
		};

		if( docId && $elem && $elem.length > 0 ){
			$elem.addClass('n2s_showedFindAvailable');
			$elem.attr('nunaliit-document',docId);
			
			this.domStyler._showFindAvailable($elem, doc);
		};
	},

	_displayUserDocument: function(userDoc){
		var _this = this;

		var id = userDoc._id;
		
		// Get display name
		var displayName = userDoc.display;
		
		// Get short name
		var userName = null;
		if( id.substr(0,couchUserPrefix.length) === couchUserPrefix ) {
			userName = id.substr(couchUserPrefix.length);
		};

		if( userName ) {
			$('.n2ShowUser_'+$n2.utils.stringToHtmlId(userName)).each(function(){
				var $elem = $(this);
				
				_this._adjustUserNameNode($elem, userName, displayName);
			});
		};
	},
	
	_adjustUserNameNode: function($elem, userName, displayName){
		var showHandle = true;
		if( $elem.hasClass('n2ShowUserDisplay') ) {
			showHandle = false;
		} else if( $elem.hasClass('n2ShowUserDisplayAndHandle') ){
			showHandle = true; // redundant
		};

		$elem
			.empty()
			.removeClass('n2ShowInsertedUserDisplayName');

		// Defaults to display name
		if( displayName ) {
			$('<span>')
				.addClass('n2Show_userDisplayName')
				.text(displayName)
				.appendTo($elem);
			$elem.addClass('n2ShowInsertedUserDisplayName');
		};

		if( showHandle ){
			$('<span>')
				.addClass('n2Show_userName')
				.text(userName)
				.appendTo($elem);
		}
	},
	
	_displayDocumentBrief: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: null // function($elem, doc, opt_){}
			,schemaName: null
		},opt_);

		var _this = this;

		// Perform pre-processing, allowing client to
		// augment document prior to display
		doc = this._preprocessDocument(doc);

		if( opt.schemaName ) {
			_this.schemaRepository.getSchema({
				name: opt.schemaName
				,onSuccess: function(schema_) {
					printBrief($elem,schema_);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( doc.nunaliit_schema ) {
			_this.schemaRepository.getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema_) {
					printBrief($elem,schema_);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( _this.defaultSchema ) {
			printBrief($elem, _this.defaultSchema);
			
		} else {
			displayError($elem);
		};
		
		function printBrief($elem, schema){
			$elem.removeClass('n2Show_docNotFound');
			schema.brief(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			_this._postProcessDisplay($elem, doc);

			if( typeof opt.onDisplayed === 'function' ){
				opt.onDisplayed($elem, doc, schema, opt_);
			};
		};
		
		function displayError($elem){
			$elem.text( _loc('Unable to display brief description') );

			if( typeof opt.onDisplayed === 'function' ){
				opt.onDisplayed($elem, doc, null, opt_);
			};
		};
	},
	
	_displayDocumentFull: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: null // function($elem, doc, opt_){}
			,schemaName: null
		},opt_);
		
		var _this = this;
		
		// Peform pre-processing, allowing client to
		// augment document prior to display
		doc = this._preprocessDocument(doc);
		
		if( opt.schemaName ) {
			_this.schemaRepository.getSchema({
				name: opt.schemaName
				,onSuccess: function(schema){
					displaySchema($elem, schema);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( doc.nunaliit_schema ) {
			_this.schemaRepository.getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema){
					displaySchema($elem, schema);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( _this.defaultSchema ) {
			displaySchema($elem, _this.defaultSchema);
			
		} else {
			displayError($elem);
		};
		
		function displaySchema($elem,schema){
			$elem.removeClass('n2Show_docNotFound');
			schema.display(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			_this._postProcessDisplay($elem, doc);

			if( typeof opt.onDisplayed === 'function' ){
				opt.onDisplayed($elem, doc, schema, opt_);
			};
		};
		
		function displayError($elem){
			$elem.text( _loc('Unable to display document') );
		};
	},
	
	_preprocessDocument: function(doc_){
		var doc = doc_;
		
		if( this.options 
		 && this.options.preprocessDocument ){
			doc = this.options.preprocessDocument(doc);
		};
		
		return doc;
	},

	_postProcessDisplay: function($sElem, data){
		// Perform post-process function 
		for(var i=0,e=this.postProcessDisplayFns.length; i<e; ++i){
			var fn = this.postProcessDisplayFns[i];
			fn(data, $sElem);
		};
	},
	
	_requestUser: function(userName){
		var requestService = this.requestService;
		if( requestService ){
			requestService.requestUser(userName); // fetch document
		};
	},

	_requestDocument: function(docId,cbFn){
		var requestService = this.requestService;
		if( requestService ){
			requestService.requestDocument(docId,cbFn); // fetch document
		};
	},

	_requestLayerDefinition: function(layerId){
		var requestService = this.requestService;
		if( requestService ){
			requestService.requestLayerDefinition(layerId); // fetch document
		};
	},
	
	_handleDocumentListResults: function(m){
		var _this = this;
		
		$('.n2show_documentList_wait').each(function(){
			var $elem = $(this);
			
			var listType = $elem.attr('nunaliit-list-type');
			if( typeof listType === 'undefined'){
				listType = $elem.attr('n2-list-type');
			};
			var listName = $elem.attr('nunaliit-list-name');
			if( typeof listName === 'undefined'){
				listName = $elem.attr('n2-list-name');
			};
			var listLive = $elem.attr('nunaliit-list-live');
			if( listLive === 'false'){
				listLive = undefined;
			};
			
			if( listType === m.listType 
			 && listName === m.listName ){
				$elem.removeClass('n2show_documentList_empty');

				if( !listLive ) {
					// If not live, do not wait for any more updates
					$elem.removeClass('n2show_documentList_wait');
				};
				
				$elem.empty();

				// Are documents provided?
				if( m.docs && m.docs.length > 0 ){
					for(var i=0,e=m.docs.length; i<e; ++i){
						var doc = m.docs[i];
						var docId = doc._id;
						
						var $doc = $('<div>')
							.addClass('n2show_documentList_item')
							.addClass('n2s_userEvents')
							.attr('nunaliit-document',docId)
							.appendTo($elem);
						
						var $a = $('<a>')
							.attr('href','#')
							.appendTo($doc);
	
						_this._displayDocumentBrief($a, doc);
					};

					_this.fixElementAndChildren($elem, {}, null);
					
				// If documents are not provided, docIds are compulsory
				} else if( m.docIds && m.docIds.length > 0 ){
					for(var i=0,e=m.docIds.length; i<e; ++i){
						var docId = m.docIds[i];
						
						var $doc = $('<div>')
							.addClass('n2show_documentList_item')
							.addClass('n2s_userEvents')
							.attr('nunaliit-document',docId)
							.appendTo($elem);
						
						var $a = $('<a>')
							.attr('href','#')
							.addClass('n2s_briefDisplay')
							.attr('nunaliit-document',docId)
							.text(docId)
							.appendTo($doc);
					};
					
					_this.fixElementAndChildren($elem, {}, null);
					
				// If empty, set class to report it
				} else {
					$elem.addClass('n2show_documentList_empty');
				};
			};
		});
	},
	
	_handleDocumentContent: function(doc){
		if( doc ){
			this.domStyler._receivedDocumentContent(doc);
		};
	},

	_handleDocumentUpdate: function(doc){
		if( doc ){
			this.domStyler._receivedDocumentUpdate(doc);
		};
	},
	
	_handleUserIntentChanged: function(changes){
		if( changes && changes.length > 0 ){
			for(var i=0,e=changes.length; i<e; ++i){
				var change = changes[i];
				var docId = change.n2_id;
				var eventClass = 'n2s_userEvents_doc_' + $n2.utils.stringToHtmlId(docId);
				$('.'+eventClass).each(function(){
					var $elem = $(this);

					if( change.n2_selected ){
						$elem.addClass('nunaliit_selected');
					} else {
						$elem.removeClass('nunaliit_selected');
					};

					if( change.n2_hovered ){
						$elem.addClass('nunaliit_hovered');
					} else {
						$elem.removeClass('nunaliit_hovered');
					};

					if( change.n2_find ){
						$elem.addClass('nunaliit_found');
					} else {
						$elem.removeClass('nunaliit_found');
					};
				});
			};
		};
	},
	
	_handleDispatch: function(m, address, dispatchService){
		if( 'start' === m.type ){
			// Accept Post-process display functions that are
			// set during configuration
			var customService = this.customService;
			if( customService ){
				var postProcessFns = customService.getOption('displayPostProcessFunctions');
				if( postProcessFns ){
					for(var i=0,e=postProcessFns.length;i<e;++i){
						var fn = postProcessFns[i];
						this.addPostProcessDisplayFunction(fn);
					};
				};
				
				suppressLeaveConfirmation = 
					customService.getOption('displaySuppressLeaveConfirmation',false);
			};
			
		} else if( 'documentListResults' === m.type ) {
			this._handleDocumentListResults(m);
			
		} else if( 'documentDeleted' === m.type ) {
			var docId = m.docId;
			
			if( docId ){
				var escaped = $n2.utils.stringToHtmlId(docId);
				$('.n2show_documentUpdate_'+escaped).remove();
			};

		} else if( 'documentContentCreated' === m.type ) {
			var doc = m.doc;
			if( doc ){
				this._handleDocumentUpdate(doc);
			};

		} else if( 'documentContentUpdated' === m.type ) {
			var doc = m.doc;
			if( doc ){
				this._handleDocumentUpdate(doc);
			};

		} else if( 'documentContent' === m.type ) {
			this._handleDocumentContent(m.doc);
			
		} else if( 'userIntentChanged' === m.type ) {
			if( m.changes ){
				this._handleUserIntentChanged(m.changes);
			};
			
		} else if( 'findAvailabilityChanged' === m.type ) {
			// A canvas is reporting a different set of documents
			// available for 'find'. Compile all docIds related to
			// 'find'
			var docIdMap = {};
			$('.n2s_showedFindAvailable').each(function(){
				var $elem = $(this);
				var docId = $elem.attr('nunaliit-document');
				if( docId ){
					docIdMap[docId] = true;
				};
			});
			
			// Get the content of the documents, since 'findIsAvailable' synchronous
			// call requires the document content. When receiving document content,
			// all elements with class 'n2s_showedFindAvailable' are updated accordingly
			for(var docId in docIdMap){
				this._requestDocument(docId);
			};
		};
	},
	
	_createDocIfInexistant: function(docId, schemaName){
		var _this = this;
		
		this.documentSource.getDocumentInfoFromIds({
			docIds: [ docId ]
			,onSuccess: function(docInfos){
				var docInfosById = {};
				for(var i=0,e=docInfos.length; i<e; ++i){
					var info = docInfos[i];
					docInfosById[info.id] = info;
				};
				
				if( docInfosById[docId] ){
					// Exists. Select
					_this.dispatchService.send(DH,{
						type:'userSelect'
						,docId: docId
					});
				} else {
					// Does not exist. Create
					_this.schemaRepository.getSchema({
						name: schemaName
						,onSuccess: function(schema) {
							var doc = schema.createObject({
								_id: docId
							});
							_this.dispatchService.send(DH,{
								type:'editInitiate'
								,doc: doc
							});
						}
					});
				};
			}
		});
	}
});

//*******************************************************
$n2.couchShow = {
	Show: Show	
};

})(jQuery,nunaliit2);
