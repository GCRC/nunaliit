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

function noop(){};

var reUrl = /(^|\s)(https?:\/\/[^\s]*)(\s|$)/;

// *******************************************************
var DomStyler = $n2.Class({
	
	db: null,
	
	documentSource: null,

	showService: null,
	
	displayFunction: null,
	
	editFunction: null,
	
	deleteFunction: null,
	
	viewLayerFunction: null,
	
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
	},

	fixElementAndChildren: function($elem, opt, contextDoc){
		if( typeof performance !== 'undefined' ){
			var _this = this;
			var start = performance.now();
		};
		
		this._fixElementAndChildrenV2($elem, opt, contextDoc);

		if( typeof performance !== 'undefined' ){
			var end = performance.now();
			var elapsed = end-start;
			if( this.maxElapsed === undefined ){
				this.maxElapsed = elapsed;
			} else if( elapsed > this.maxElapsed ){
				this.maxElapsed = elapsed;
			};
			if( this.totalElapsed === undefined ){
				this.totalElapsed = elapsed;
			} else {
				this.totalElapsed += elapsed;
			};
			if( !this.performanceInstalled ){
				this.performanceInstalled = true;
				$('<a>')
					.attr('href','#')
					.text( _loc('Log Perf') )
					.css({
						'text-decoration': 'none',
				    	'color': '#fff'
					})
					.appendTo( $('.nunaliit_footer') )
					.click(function(){
						$n2.log('total: '+_this.totalElapsed+' max: '+_this.maxElapsed);
						return false;
					});
				$('<a>')
					.attr('href','#')
					.text( _loc('Reset Perf') )
					.css({
						'text-decoration': 'none',
				    	'color': '#fff'
					})
					.appendTo( $('.nunaliit_footer') )
					.click(function(){
						_this.totalElapsed = 0;
						_this.maxElapsed = 0;
						return false;
					});
			};
		};
	},

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
		
		// Localization
		findAndExecute($set, 'n2s_localize', 'n2s_localized', function($jq){
			_this._localize($jq, opt);
		});
		findAndExecute($set, 'n2_localize', 'n2_localized', function($jq){
			// Legacy
			_this._localize($jq, opt);
		});
		
		// Brief display
		findAndExecute($set, 'n2s_briefDisplay', 'n2s_briefDisplayed', function($jq){
			_this._briefDisplay($jq, contextDoc, opt);
		});
		findAndExecute($set, 'n2_briefDisplay', 'n2_briefDisplayed', function($jq){
			// Legacy
			_this._briefDisplay($jq, contextDoc, opt);
		});
		
		// Full display
		findAndExecute($set, 'n2s_fullDisplay', 'n2s_fullDisplayed', function($jq){
			_this._fullDisplay($jq, contextDoc, opt);
		});

		// Reference Link
		findAndExecute($set, 'n2s_referenceLink', 'n2s_insertedReferenceLink', function($jq){
			_this._insertReferenceLink($jq, opt);
		});
		
		// Time
		findAndExecute($set, 'n2s_insertTime', 'n2s_insertedTime', function($jq){
			_this._insertTime($jq, opt);
		});
		
		// User
		findAndExecute($set, 'n2s_insertUserName', 'n2s_insertedUserName', function($jq){
			_this._insertUserName($jq, opt);
		});
		
		// Layer name
		findAndExecute($set, 'n2s_insertLayerName', 'n2s_insertedLayerName', function($jq){
			_this._insertLayerName($jq, contextDoc, opt);
		});
		
		// Media View
		findAndExecute($set, 'n2s_insertMediaView', 'n2s_insertedMediaView', function($jq){
			_this._insertMediaView(contextDoc, $jq);
		});
		
		// Module Name
		findAndExecute($set, 'n2s_insertModuleName', 'n2s_insertedModuleName', function($jq){
			_this._insertModuleName($jq, contextDoc);
		});
		
		// Insert first thumbnail
		findAndExecute($set, 'n2s_insertFirstThumbnail', 'n2s_insertedFirstThumbnail', function($jq){
			_this._insertFirstThumbnail(contextDoc, $jq, opt);
		});
		
		// Insert Hover Sound
		findAndExecute($set, 'n2s_insertHoverSoundIcon', 'n2s_insertedHoverSoundIcon', function($jq){
			_this._insertHoverSoundIcon(contextDoc, $jq, opt);
		});
		
		// External links to media file
		findAndExecute($set, 'n2s_externalMediaLink', 'n2s_adjustedExternalMediaLink', function($jq){
			_this._adjustExternalMediaLink(contextDoc, $jq, opt);
		});
		
		// External links to media file
		findAndExecute($set, 'n2s_insertExternalMediaLink', 'n2s_insertedExternalMediaLink', function($jq){
			_this._insertExternalMediaLink(contextDoc, $jq, opt);
		});
		
		// Convert text URLs to Links
		findAndExecute($set, 'n2s_convertTextUrlToLink', 'n2s_convertedTextUrlToLink', function($jq){
			_this._convertTextUrlToLink(contextDoc, $jq, opt);
		});

		// Follow geometry
		findAndExecute($set, 'n2s_clickFindGeometryOnMap', 'n2s_findGeometryOnMap', function($jq){
			_this._clickFindGeometryOnMap(contextDoc, $jq, opt);
		});

		// Turn on layer
		findAndExecute($set, 'n2s_clickAddLayerFromDefinition', 'n2s_addLayerFromDefinition', function($jq){
			_this._clickAddLayerFromDefinition(contextDoc, $jq, opt);
		});

		// Document editing
		findAndExecute($set, 'n2s_clickEdit', 'n2s_edit', function($jq){
			_this._clickEdit(contextDoc, $jq, opt);
		});

		// Document deleting
		findAndExecute($set, 'n2s_clickDelete', 'n2s_delete', function($jq){
			_this._clickDelete(contextDoc, $jq, opt);
		});
		
		// Mouse Hover
		findAndExecute($set, 'n2s_handleHover', 'n2s_handledHover', function($jq){
			_this._handleHover(contextDoc, $jq, opt);
		});

		// Install maximum height
		findAndExecute($set, 'n2s_installMaxHeight', 'n2s_installedMaxHeight', function($jq){
			_this._installMaxHeight(contextDoc, $jq, opt);
		});
		
		// Login
		findAndExecute($set, 'n2s_clickLogin', 'n2s_login', function($jq){
			_this._clickLogin($jq, opt);
		});
		
		// Map Edit
		findAndExecute($set, 'n2s_clickMapEdit', 'n2s_mapEdit', function($jq){
			_this._clickMapEdit($jq, opt);
		});
		
		// Preserve Space
		findAndExecute($set, 'n2s_preserveSpaces', 'n2s_preservedSpaces', function($jq){
			_this._preserveSpaces($jq, opt);
		});

		// Document List
		findAndExecute($set, 'n2s_insertDocumentList', 'n2s_insertedDocumentList', function($jq){
			_this._insertDocumentList($jq, opt);
		});

		// Select
		findAndExecute($set, 'n2s_select', 'n2s_selected', function($jq){
			_this._select($jq, opt);
		});

		// Install Tiled Image Click
		findAndExecute($set, 'n2s_installTiledImageClick', 'n2s_installedTiledImageClick', function($jq){
			_this._installTiledImageClick(contextDoc, $jq);
		});

		// Custom
		findAndExecute($set, 'n2s_custom', 'n2s_customed', function($jq){
			_this._custom($jq, contextDoc);
		});

		// User Events
		findAndExecute($set, 'n2s_userEvents', 'n2s_userEvents_installed', function($jq){
			_this._userEvents($jq, contextDoc);
		});

		// Wiki
		findAndExecute($set, 'n2s_wikiTransform', 'n2s_wikiTransformed', function($jq){
			_this._wikiTransform($jq, contextDoc);
		});

		// Find Available
		findAndExecute($set, 'n2s_showFindAvailable', 'n2s_showedFindAvailable', function($jq){
			_this._showFindAvailable($jq, contextDoc);
		});
		
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
			fn($set);
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
		
		// Localization
		$set.filter('.n2_localize').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2_localize').addClass('n2_localized');
			_this._localize($jq, opt);
		});
		$set.filter('.n2s_localize').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_localize').addClass('n2s_localized');
			_this._localize($jq, opt);
		});
		
		// Brief display
		$set.filter('.n2s_briefDisplay').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_briefDisplay').addClass('n2s_briefDisplayed');
			_this._briefDisplay($jq, contextDoc, opt);
		});
		$set.filter('.n2_briefDisplay').each(function(){
			// Legacy
			var $jq = $(this);
			$jq.removeClass('n2_briefDisplay').addClass('n2_briefDisplayed');
			_this._briefDisplay($jq, contextDoc, opt);
		});
		
		// Full display
		$set.filter('.n2s_fullDisplay').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_fullDisplay').addClass('n2s_fullDisplayed');
			_this._fullDisplay($jq, contextDoc, opt);
		});

		// Reference Link
		$set.filter('.n2s_referenceLink').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_referenceLink').addClass('n2s_insertedReferenceLink');
			_this._insertReferenceLink($jq, opt);
		});
		
		// Time
		$set.filter('.n2s_insertTime').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertTime').addClass('n2s_insertedTime');
			_this._insertTime($jq, opt);
		});
		
		// User
		$set.filter('.n2s_insertUserName').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertUserName').addClass('n2s_insertedUserName');
			_this._insertUserName($jq, opt);
		});
		
		// Layer name
		$set.filter('.n2s_insertLayerName').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertLayerName').addClass('n2s_insertedLayerName');
			_this._insertLayerName($jq, contextDoc, opt);
		});
		
		// Media View
		$set.filter('.n2s_insertMediaView').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertMediaView').addClass('n2s_insertedMediaView');
			_this._insertMediaView(contextDoc, $jq);
		});
		
		// Module Name
		$set.filter('.n2s_insertModuleName').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertModuleName').addClass('n2s_insertedModuleName');
			_this._insertModuleName($jq, contextDoc);
		});
		
		// Insert first thumbnail
		$set.filter('.n2s_insertFirstThumbnail').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertFirstThumbnail').addClass('n2s_insertedFirstThumbnail');
			_this._insertFirstThumbnail(contextDoc, $jq, opt);
		});
		
		// Insert Hover Sound
		$set.filter('.n2s_insertHoverSoundIcon').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertHoverSoundIcon').addClass('n2s_insertedHoverSoundIcon');
			_this._insertHoverSoundIcon(contextDoc, $jq, opt);
		});
		
		// External links to media file
		$set.filter('.n2s_externalMediaLink').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_externalMediaLink').addClass('n2s_adjustedExternalMediaLink');
			_this._adjustExternalMediaLink(contextDoc, $jq, opt);
		});
		
		// External links to media file
		$set.filter('.n2s_insertExternalMediaLink').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertExternalMediaLink').addClass('n2s_insertedExternalMediaLink');
			_this._insertExternalMediaLink(contextDoc, $jq, opt);
		});
		
		// Convert text URLs to Links
		$set.filter('.n2s_convertTextUrlToLink').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_convertTextUrlToLink').addClass('n2s_convertedTextUrlToLink');
			_this._convertTextUrlToLink(contextDoc, $jq, opt);
		});

		// Follow geometry
		$set.filter('.n2s_clickFindGeometryOnMap').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickFindGeometryOnMap').addClass('n2s_findGeometryOnMap');
			_this._clickFindGeometryOnMap(contextDoc, $jq, opt);
		});

		// Turn on layer
		$set.filter('.n2s_clickAddLayerFromDefinition').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickAddLayerFromDefinition').addClass('n2s_addLayerFromDefinition');
			_this._clickAddLayerFromDefinition(contextDoc, $jq, opt);
		});

		// Document editing
		$set.filter('.n2s_clickEdit').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickEdit').addClass('n2s_edit');
			_this._clickEdit(contextDoc, $jq, opt);
		});

		// Document deleting
		$set.filter('.n2s_clickDelete').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickDelete').addClass('n2s_delete');
			_this._clickDelete(contextDoc, $jq, opt);
		});
		
		// Mouse Hover
		$set.filter('.n2s_handleHover').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_handleHover').addClass('n2s_handledHover');
			_this._handleHover(contextDoc, $jq, opt);
		});

		// Install maximum height
		$set.filter('.n2s_installMaxHeight').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_installMaxHeight').addClass('n2s_installedMaxHeight');
			_this._installMaxHeight(contextDoc, $jq, opt);
		});
		
		// Login
		$set.filter('.n2s_clickLogin').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickLogin').addClass('n2s_login');
			_this._clickLogin($jq, opt);
		});
		
		// Map Edit
		$set.filter('.n2s_clickMapEdit').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_clickMapEdit').addClass('n2s_mapEdit');
			_this._clickMapEdit($jq, opt);
		});
		
		// Preserve Space
		$set.filter('.n2s_preserveSpaces').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_preserveSpaces').addClass('n2s_preservedSpaces');
			_this._preserveSpaces($jq, opt);
		});

		// Document List
		$set.filter('.n2s_insertDocumentList').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_insertDocumentList').addClass('n2s_insertedDocumentList');
			_this._insertDocumentList($jq, opt);
		});

		// Select
		$set.filter('.n2s_select').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_select').addClass('n2s_selected');
			_this._select($jq, opt);
		});

		// Install Tiled Image Click
		$set.filter('.n2s_installTiledImageClick').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_installTiledImageClick').addClass('n2s_installedTiledImageClick');
			_this._installTiledImageClick(contextDoc, $jq);
		});

		// Custom
		$set.filter('.n2s_custom').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_custom').addClass('n2s_customed');
			_this._custom($jq, contextDoc);
		});

		// User Events
		$set.filter('.n2s_userEvents').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_userEvents').addClass('n2s_userEvents_installed');
			_this._userEvents($jq, contextDoc);
		});

		// Wiki
		$set.filter('.n2s_wikiTransform').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_wikiTransform').addClass('n2s_wikiTransformed');
			_this._wikiTransform($jq, contextDoc);
		});

		// Find Available
		$set.filter('.n2s_showFindAvailable').each(function(){
			var $jq = $(this);
			$jq.removeClass('n2s_showFindAvailable').addClass('n2s_showedFindAvailable');
			_this._showFindAvailable($jq, contextDoc);
		});
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
			this._insertMediaView(doc, $jq);
		};
		
		if( $jq.hasClass('n2s_insertedFirstThumbnail') ){
			this._insertFirstThumbnail(doc, $jq);
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

	_localize: function($jq, opt_) {
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
	
	_preserveSpaces: function($jq, opt_) {
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
	
	_insertDocumentList: function($jq, opt_){
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

	_select: function($jq, opt_){
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
	
	_briefDisplay: function($jq, data, opt_) {
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
			this.showService._displayDocumentFull($jq, data, opt_);
		};
	},
	
	_insertReferenceLink: function($jq, opt_) {
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
	
	_insertTime: function($jq, opt_) {
		var time = 1 * $jq.text();
		var timeStr = (new Date(time)).toString();
		$jq.text(timeStr);
	},
	
	_insertUserName: function($elem, opt_) {
		var userName = $elem.text();
		
		this.showService.printUserName(
			$elem
			,userName
			,{showHandle:true}
			);
	},
	
	_insertLayerName: function($elem, data, opt_) {
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

	_insertMediaView: function(data, $insertView) {
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
	
	_insertFirstThumbnail: function(doc, $insertElem, opt_){

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
	
	_insertHoverSoundIcon: function(data, $insertHoverSoundIcon, opt_){
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
	
	_adjustExternalMediaLink: function(data, $externalLink, opt_) {
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
	
	_insertExternalMediaLink: function(data, $div, opt_) {
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
	
	_convertTextUrlToLink: function(data, $jq, opt_) {
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
	
	_clickFindGeometryOnMap: function(data, $jq, opt){
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
	
	_clickAddLayerFromDefinition: function(contextDoc, $jq, opt){
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
	
	_clickEdit: function(contextDoc, $jq, opt){
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
	
	_clickDelete: function(contextDoc, $jq, opt){
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
	
	_clickLogin: function($jq, opt){
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
	
	_clickMapEdit: function($jq, opt){
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
	
	_installMaxHeight: function(contextDoc, $jq, opt){
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
	
	_handleHover: function(contextDoc, $jq, opt){

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

	_installTiledImageClick: function(doc, $elem){
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
		$elem.text('('+userName+')');

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
		var id = userDoc._id;
		
		// Get display name
		var displayName = userDoc.display;
		
		// Get short name
		var userName = null;
		if( id.substr(0,couchUserPrefix.length) === couchUserPrefix ) {
			userName = id.substr(couchUserPrefix.length);
		};

		if( userName ) {
			$('.n2ShowUser_'+$n2.utils.stringToHtmlId(userName)).each(function(i,elem){
				var $elem = $(elem);
				
				if( $elem.hasClass('n2ShowUserDisplay') ) {
					if( displayName ) {
						$elem.text(displayName);
					};
				} else if( $elem.hasClass('n2ShowUserDisplayAndHandle') ){
					if( displayName && userName ) {
						$elem.text(displayName+' ('+userName+')');
					};
				} else {
					// Defaults to display name
					if( displayName ) {
						$elem.text(displayName);
					};
				};
			});
		};
	},
	
	_displayDocumentBrief: function($elem, doc, opt_){
		
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
