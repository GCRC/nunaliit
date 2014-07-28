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

$Id: n2.couchShow.js 8496 2012-09-24 19:54:26Z jpfiset $
*/
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var DH = 'n2.couchShow';
	
var couchUserPrefix = 'org.couchdb.user:';

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
		var _this = this;
		
		var $set = $elem.find('*').addBack();
		
		// Localization
		$set.filter('.n2_localize').each(function(){
			var $jq = $(this);
			_this._localize($jq, opt);
			$jq.removeClass('n2_localize').addClass('n2_localized');
		});
		$set.filter('.n2s_localize').each(function(){
			var $jq = $(this);
			_this._localize($jq, opt);
			$jq.removeClass('n2s_localize').addClass('n2s_localized');
		});
		
		// Brief display
		$set.filter('.n2_briefDisplay').each(function(){
			var $jq = $(this);
			_this._briefDisplay($jq, opt);
			$jq.removeClass('n2_briefDisplay').addClass('n2_briefDisplayed');
		});

		// Reference Link
		$set.filter('.n2s_referenceLink').each(function(){
			var $jq = $(this);
			_this._insertReferenceLink($jq, opt);
			$jq.removeClass('n2s_referenceLink').addClass('n2s_insertedReferenceLink');
		});
		
		// Time
		$set.filter('.n2s_insertTime').each(function(){
			var $jq = $(this);
			_this._insertTime($jq, opt);
			$jq.removeClass('n2s_insertTime').addClass('n2s_insertedTime');
		});
		
		// User
		$set.filter('.n2s_insertUserName').each(function(){
			var $jq = $(this);
			_this._insertUserName($jq, opt);
			$jq.removeClass('n2s_insertUserName').addClass('n2s_insertedUserName');
		});
		
		// Layer name
		$set.filter('.n2s_insertLayerName').each(function(){
			var $jq = $(this);
			_this._insertLayerName($jq, opt);
			$jq.removeClass('n2s_insertLayerName').addClass('n2s_insertedLayerName');
		});
		
		// Media View
		$set.filter('.n2s_insertMediaView').each(function(){
			var $jq = $(this);
			_this._insertMediaView(contextDoc, $jq, opt);
			$jq.removeClass('n2s_insertMediaView').addClass('n2s_insertedMediaView');
		});
		
		// Insert Hover Sound
		$set.filter('.n2s_insertHoverSoundIcon').each(function(){
			var $jq = $(this);
			_this._insertHoverSoundIcon(contextDoc, $jq, opt);
			$jq.removeClass('n2s_insertHoverSoundIcon').addClass('n2s_insertedHoverSoundIcon');
		});
		
		// External links to media file
		$set.filter('.n2s_externalMediaLink').each(function(){
			var $jq = $(this);
			_this._adjustExternalMediaLink(contextDoc, $jq, opt);
			$jq.removeClass('n2s_externalMediaLink').addClass('n2s_adjustedExternalMediaLink');
		});
		
		// External links to media file
		$set.filter('.n2s_insertExternalMediaLink').each(function(){
			var $jq = $(this);
			_this._insertExternalMediaLink(contextDoc, $jq, opt);
			$jq.removeClass('n2s_insertExternalMediaLink').addClass('n2s_insertedExternalMediaLink');
		});
		
		// Convert text URLs to Links
		$set.filter('.n2s_convertTextUrlToLink').each(function(){
			var $jq = $(this);
			_this._convertTextUrlToLink(contextDoc, $jq, opt);
			$jq.removeClass('n2s_convertTextUrlToLink').addClass('n2s_convertedTextUrlToLink');
		});

		// Follow geometry
		$set.filter('.n2s_clickFindGeometryOnMap').each(function(){
			var $jq = $(this);
			_this._clickFindGeometryOnMap(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickFindGeometryOnMap').addClass('n2s_findGeometryOnMap');
		});

		// Turn on layer
		$set.filter('.n2s_clickAddLayerFromDefinition').each(function(){
			var $jq = $(this);
			_this._clickAddLayerFromDefinition(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickAddLayerFromDefinition').addClass('n2s_addLayerFromDefinition');
		});

		// Document editing
		$set.filter('.n2s_clickEdit').each(function(){
			var $jq = $(this);
			_this._clickEdit(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickEdit').addClass('n2s_edit');
		});

		// Document deleting
		$set.filter('.n2s_clickDelete').each(function(){
			var $jq = $(this);
			_this._clickDelete(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickDelete').addClass('n2s_delete');
		});
		
		// Mouse Hover
		$set.filter('.n2s_handleHover').each(function(){
			var $jq = $(this);
			_this._handleHover(contextDoc, $jq, opt);
			$jq.removeClass('n2s_handleHover').addClass('n2s_handledHover');
		});

		// Install maximum height
		$set.filter('.n2s_installMaxHeight').each(function(){
			var $jq = $(this);
			_this._installMaxHeight(contextDoc, $jq, opt);
			$jq.removeClass('n2s_installMaxHeight').addClass('n2s_installedMaxHeight');
		});
		
		// Preserve Space
		$set.filter('.n2s_preserveSpaces').each(function(){
			var $jq = $(this);
			_this._preserveSpaces($jq, opt);
			$jq.removeClass('n2s_preserveSpaces').addClass('n2s_preservedSpaces');
		});
	},

	_localize: function($jq, opt_) {
		var text = $jq.text();
		var locText = _loc(text);
		if( locText ) {
			$jq.text(locText);
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
	
	_briefDisplay: function($jq, opt_) {
		var docId = $jq.text();
		this.showService.printBriefDescription($jq, docId);
	},
	
	_insertReferenceLink: function($jq, opt_) {
		var _this = this;

		var docId = $jq.text();
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
	
	_insertUserName: function($jq, opt_) {
		var userName = $jq.text();
		
		this.showService.printUserName(
			$jq
			,userName
			,{showHandle:true}
			);
	},
	
	_insertLayerName: function($jq, opt_) {
		var layerIdentifier = $jq.text();
		
		this.showService.printLayerName(
			$jq
			,layerIdentifier
			);
	},

	_insertMediaView: function(data, $insertView, opt_) {
		var _this = this;
		var attachmentName = $insertView.attr('nunaliit-attachment');
		if( !attachmentName ) {
			attachmentName = $insertView.text();
		};

		$insertView.empty();
		
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
		
		function createMediaCallback(uploadType, attachmentUrl, doc, attachmentName) {
			
			return function(evt) {
				var mediaOptions = {
					url: attachmentUrl
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

				} else if( doc.nunaliit_contribution 
				 && doc.nunaliit_contribution.title ) {
					mediaOptions.title = doc.nunaliit_contribution.title;
				};
				
				// Height and width
				if( attDesc ){
					if(attDesc.width){
						mediaOptions.width = attDesc.width;
					};

					if(attDesc.height){
						mediaOptions.height = attDesc.height;
					};
				};

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

				
				return false;
			};
		};
	},
	
	_insertHoverSoundIcon: function(data, $insertHoverSoundIcon, opt_){
		var _this = this;
		var playSound = false;

		if( $n2.couchSound
		 && $n2.couchSound.DocumentContainsHoverSound
		 && $n2.couchSound.DocumentContainsHoverSound(data) ) {
			$insertHoverSoundIcon.append( 
					$('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_speaker"></div></div>') );
				$insertHoverSoundIcon.find('.n2Show_icon_speaker').click(function(){
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
					nextSibling = node.nextSibling;
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
			
			var m = reUrl.exec(text);
			var after = null;
			while(m){
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
				parent.removeChild(textNode);
			};
		};
	},
	
	_clickFindGeometryOnMap: function(data, $jq, opt){
		var dispatcher = this.showService.dispatchService;

		if( data 
		 && data.nunaliit_geom 
		 && dispatcher
		 && dispatcher.isEventTypeRegistered('findOnMap')
		 ) {
			var x = (data.nunaliit_geom.bbox[0] + data.nunaliit_geom.bbox[2]) / 2;
			var y = (data.nunaliit_geom.bbox[1] + data.nunaliit_geom.bbox[3]) / 2;
			
			$jq.click(function(){
				dispatcher.send(
					DH
					,{
						type: 'findOnMap'
						,fid: data._id
						,srsName: 'EPSG:4326'
						,x: x
						,y: y
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
	
	_handleHover : function(contextDoc, $jq, opt){

		var dispatchService = this.showService.dispatchService;

		if( dispatchService ) {
			$jq.hover(
				function(){ // in
					dispatchService.send(DH, {
						type:'userFocusOn'
						,docId:contextDoc._id
						,doc:contextDoc
					});
				}
				,function(){ // out
					dispatchService.send(DH, {
						type:'userFocusOff'
						,docId:contextDoc._id
						,doc:contextDoc
					});
				}
			);
		};
	}
});

//*******************************************************
var Show = $n2.Class({

	options: null,
	
	db: null,
	
	documentSource: null,
	
	requestService: null,
	
	notifierService: null,
	
	dispatchService: null,
	
	schemaRepository: null,
	
	customService: null,
	
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
			,notifierService: null
			,dispatchService: null
			,schemaRepository: null
			,customService: null
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
		this.notifierService = opts.notifierService;
		this.dispatchService = opts.dispatchService;
		this.schemaRepository = opts.schemaRepository;
		this.customService = opts.customService;
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
			requestService.addDocumentListener(function(doc){
				_this._displayDocument(doc);
			});
		};
		
		var notifierService = this.notifierService;
		if( notifierService ) {
			notifierService.addListener(function(change){
				_this._notifierUpdate(change);
			});
		};
		
		var dispatchService = this.dispatchService;
		if( dispatchService ){
			var f = function(msg, address, dispatchService){
				_this._handleDispatch(msg, address, dispatchService);
			};
			dispatchService.register(DH, 'start', f);
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
	
	displayBriefDescription: function($elem, opt, doc){
		// Remember to update
		if( doc && doc._id ) {
			$elem.addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(doc._id));
			$elem.addClass('n2ShowDocBrief');
		};
		
		this._displayDocumentBrief($elem, doc, opt);
	},
	
	displayDocument: function($elem, opt, doc){
		// Remember to update
		if( doc && doc._id ) {
			$elem.addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(doc._id));
		};
		
		this._displayDocumentFull($elem, doc, opt);
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
	
	printBriefDescription: function($elem, docId, opts){
		$elem.addClass('n2ShowDoc_'+$n2.utils.stringToHtmlId(docId));
		$elem.addClass('n2ShowDocBrief');
		$elem.text(docId);

		this._requestDocument(docId); // fetch document
	},
	
	printDocument: function($elem, docId, opts_){
		var opts = $n2.extend({
			eliminateNonApprovedMedia: false
			,eliminateDeniedMedia: false
		},opts_);
		
		$elem.addClass('n2ShowDoc_'+$n2.utils.stringToHtmlId(docId));
		
		if( opts.eliminateNonApprovedMedia ) {
			$elem.addClass('n2NoShowNonApprovedMedia');
		};
		if( opts.eliminateDeniedMedia ) {
			$elem.addClass('n2NoShowDenied');
		};
		
		$elem.text(docId);

		this._requestDocument(docId); // fetch document
	},
	
	printLayerName: function($elem, layerIdentifier, opts_){
		
		$elem.addClass('n2ShowLayerName_'+$n2.utils.stringToHtmlId(layerIdentifier));
		
		$elem.text(layerIdentifier);

		this._requestDocument(layerIdentifier); // fetch document
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

	_displayDocument: function(doc){
		var _this = this;
		
		var id = doc._id;
		
		var showClass = 'n2ShowDoc_'+$n2.utils.stringToHtmlId(id);
		
		$('.'+showClass).each(function(i,elem){
			var $elem = $(elem);
			
			$elem.removeClass(showClass).addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(id));

			if( _this.eliminateNonApprovedMedia ) {
				if( $n2.couchMap.documentContainsMedia(doc) 
				 && false == $n2.couchMap.documentContainsApprovedMedia(doc) ) {
					$elem.empty();
					return;
				};
				
			} else if( _this.eliminateDeniedMedia ) {
				if( $n2.couchMap.documentContainsMedia(doc) 
				 && true == $n2.couchMap.documentContainsDeniedMedia(doc) ) {
					$elem.empty();
					return;
				};
			};
			
			if( $elem.hasClass('n2ShowDocBrief') ) {
				_this._displayDocumentBrief($elem, doc);
				return;
				
			};

			// Non-brief behaviour
			_this._displayDocumentFull($elem, doc);
		});
		
		// Layer definition
		if( doc.nunaliit_layer_definition
		 && doc.nunaliit_layer_definition.name ){
			var name = _loc(doc.nunaliit_layer_definition.name);
			
			var layerClass = 'n2ShowLayerName_'+$n2.utils.stringToHtmlId(id);
			$('.'+layerClass).each(function(i,elem){
				var $elem = $(elem);
				$elem.text( name );
			});
		};
	},

	_updateDocument: function(doc){
		var _this = this;
		
		var id = doc._id;
		
		var updateClass = 'n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(id);
		
		$('.'+updateClass).each(function(i,elem){
			var $elem = $(elem);
			
			if( $elem.hasClass('n2ShowDocBrief') ) {
				_this._displayDocumentBrief($elem, doc);
				return;
				
			};

			// Non-brief behaviour
			_this._displayDocumentFull($elem, doc);
		});
	},
	
	_displayDocumentBrief: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: function($elem, doc, opt_){}
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
			schema.brief(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			_this._postProcessDisplay($elem, doc);
			opt.onDisplayed($elem, doc, schema, opt_);
		};
		
		function displayError($elem){
			$elem.text( _loc('Unable to display brief description') );
			opt.onDisplayed($elem, doc, null, opt_);
		};
	},
	
	_displayDocumentFull: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: function($elem, doc, opt_){}
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
			schema.display(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			_this._postProcessDisplay($elem, doc);
			opt.onDisplayed($elem, doc, schema, opt_);
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
	
	_notifierUpdate: function(change){
		var _this = this;
		
		var updatedDocIds = {};
		var deletedDocIds = {};
		if( change 
		 && change.results 
		 && change.results.length ) {
			for(var i=0,e=change.results.length; i<e; ++i){
				var docId = change.results[i].id;
				var isDeleted = false;
				if( change.results[i].deleted ) {
					isDeleted = true;
				};
				if( isDeleted ) {
					deletedDocIds[docId] = true;
					if( updatedDocIds[docId] ) {
						delete updatedDocIds[docId];
					};
				} else {
					updatedDocIds[docId] = true;
				};
			};
		};
		
		// Remove DOM elements that have deleted document
		for(var docId in deletedDocIds){
			var escaped = $n2.utils.stringToHtmlId(docId);
			$('.n2ShowDoc_'+escaped).remove();
			$('.n2ShowUpdateDoc_'+escaped).remove();
		};
		
		// Request documents that we are interested in
		var requestDocIds = [];
		for(var docId in updatedDocIds){
			var $elems = $('.n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(docId));
			if( $elems.length > 0 ) {
				requestDocIds.push(docId);
			};
		};
		for(var i=0,e=requestDocIds.length; i<e; ++i) {
			this._requestDocument(requestDocIds[i], function(doc){
				_this._updateDocument(doc);
			});
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
			};
		};
	}
});

//*******************************************************
$n2.couchShow = {
	Show: Show	
};

})(jQuery,nunaliit2);
