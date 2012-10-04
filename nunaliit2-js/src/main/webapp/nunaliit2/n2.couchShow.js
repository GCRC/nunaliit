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
var _loc = function(str){ return $n2.loc(str,'nunaliit2-couch'); };

var couchUserPrefix = 'org.couchdb.user:';

function noop(){};

// *******************************************************
var DomStyler = $n2.Class({
	
	options: null

	,showService: null
	
	,initialize: function(options_, showService_){
		this.options = options_;
		this.showService = showService_;
	}

	,fixElementAndChildren: function($elem, opt, contextDoc){
		var _this = this;
		
		// Localization
		$elem.find('.n2_localize').each(function(){
			var $jq = $(this);
			_this._localize($jq, opt);
			$jq.removeClass('n2_localize').addClass('n2_localized');
		});
		$elem.find('.n2s_localize').each(function(){
			var $jq = $(this);
			_this._localize($jq, opt);
			$jq.removeClass('n2s_localize').addClass('n2_localized');
		});
		
		// Preserve Space
		$elem.find('.n2s_preserveSpaces').each(function(){
			var $jq = $(this);
			_this._preserveSpaces($jq, opt);
			$jq.removeClass('n2s_preserveSpaces').addClass('n2s_preservedSpaces');
		});
		
		// Brief display
		$elem.find('.n2_briefDisplay').each(function(){
			var $jq = $(this);
			_this._briefDisplay($jq, opt);
			$jq.removeClass('n2_briefDisplay').addClass('n2_briefDisplayed');
		});

		// Reference Link
		$elem.find('.n2s_referenceLink').each(function(){
			var $jq = $(this);
			_this._insertReferenceLink($jq, opt);
			$jq.removeClass('n2s_referenceLink').addClass('n2s_insertedReferenceLink');
		});
		
		// Time
		$elem.find('.n2s_insertTime').each(function(){
			var $jq = $(this);
			_this._insertTime($jq, opt);
			$jq.removeClass('n2s_insertTime').addClass('n2s_insertedTime');
		});
		
		// User
		$elem.find('.n2s_insertUserName').each(function(){
			var $jq = $(this);
			_this._insertUserName($jq, opt);
			$jq.removeClass('n2s_insertUserName').addClass('n2s_insertedUserName');
		});
		
		// Media View
		$elem.find('.n2s_insertMediaView').each(function(){
			var $jq = $(this);
			_this._insertMediaView(contextDoc, $jq, opt);
			$jq.removeClass('n2s_insertMediaView').addClass('n2s_insertedMediaView');
		});
		
		// Insert Hover Sound
		$elem.find('.n2s_insertHoverSoundIcon').each(function(){
			var $jq = $(this);
			_this._insertHoverSoundIcon(contextDoc, $jq, opt);
			$jq.removeClass('n2s_insertHoverSoundIcon').addClass('n2s_insertedHoverSoundIcon');
		});
		
		// External links to media file
		$elem.find('.n2s_externalMediaLink').each(function(){
			var $jq = $(this);
			_this._insertExternalMediaLink(contextDoc, $jq, opt);
			$jq.removeClass('n2s_externalMediaLink').addClass('n2s_insertedExternalMediaLink');
		});

		// Follow geometry
		$elem.find('.n2s_clickFindGeometryOnMap').each(function(){
			var $jq = $(this);
			_this._clickFindGeometryOnMap(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickFindGeometryOnMap').addClass('n2s_findGeometryOnMap');
		});

		// Turn on layer
		$elem.find('.n2s_clickAddLayerFromDefinition').each(function(){
			var $jq = $(this);
			_this._clickAddLayerFromDefinition(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickAddLayerFromDefinition').addClass('n2s_addLayerFromDefinition');
		});

		// Document editing
		$elem.find('.n2s_clickEdit').each(function(){
			var $jq = $(this);
			_this._clickEdit(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickEdit').addClass('n2s_edit');
		});

		// Document deleting
		$elem.find('.n2s_clickDelete').each(function(){
			var $jq = $(this);
			_this._clickDelete(contextDoc, $jq, opt);
			$jq.removeClass('n2s_clickDelete').addClass('n2s_delete');
		});
		
		// Mouse Hover
		$elem.find('.n2s_handleHover').each(function(){
			var $jq = $(this);
			_this._handleHover(contextDoc, $jq, opt);
			$jq.removeClass('n2s_handleHover').addClass('n2s_handledHover');
		});
		if( $elem.hasClass('n2s_handleHover') ){
			_this._handleHover(contextDoc, $elem, opt);
			$elem.removeClass('n2s_handleHover').addClass('n2s_handledHover');
		};
	}

	,_localize: function($jq, opt_) {
		var _this = this;

		var text = $jq.text();
		var locText = _loc(text);
		if( locText ) {
			$jq.text(locText);
		};
	}
	
	,_preserveSpaces: function($jq, opt_) {
		var _this = this;

		var text = $jq.text();
		var lines = text.split('\n');
		if( lines.length > 0 ) {
			$jq.empty();
			for(var i=0,e=lines.length; i<e; ++i){
				var $p = $('<p></p>');
				$p.text(lines[i]);
				$jq.append($p);
			};
		};
	}
	
	,_briefDisplay: function($jq, opt_) {
		var _this = this;

		var docId = $jq.text();
		this.showService.printBriefDescription($jq, docId);
	}
	
	,_insertReferenceLink: function($jq, opt_) {
		var _this = this;

		var docId = $jq.text();
		this.showService.printBriefDescription($jq, docId);
		$jq.click(function(){
			var dispatchService = _this.showService.getDispatchService();
			if( dispatchService ) {
				var dispatchHandle = _this.showService.dispatchHandle;
				dispatchService.send(dispatchHandle, {type:'selected',docId:docId});
			};

			if( _this.options.displayFunction ) {
				_this.options.displayFunction(docId,opt_);
			};

			return false;
		});
	}
	
	,_insertTime: function($jq, opt_) {
		var _this = this;

		var time = 1 * $jq.text();
		var timeStr = (new Date(time)).toString();
		$jq.text(timeStr);
	}
	
	,_insertUserName: function($jq, opt_) {
		var _this = this;

		var userName = $jq.text();
		
		this.showService.printUserName(
			$jq
			,userName
			,{showHandle:true}
			);
	}

	,_insertMediaView: function(data, $insertView, opt_) {
		var _this = this;
		var attachmentName = $insertView.text();

		$insertView.empty();

		var file = null;
		if( data 
		 && data.nunaliit_attachments 
		 && data.nunaliit_attachments.files ) {
			file = data.nunaliit_attachments.files[attachmentName];
		};
		
		if( file
		 && data._attachments 
		 && data._attachments[attachmentName] ) {
			
			var docUrl = this.options.db.getDocumentUrl(data);

			// An attachment was uploaded for this file
			var linkDiv = null;
			if( file.fileClass === 'image' 
			 && file.thumbnail
			 && data._attachments[file.thumbnail]
			 ) {
				linkDiv = $('<div class="n2Show_icon_wrapper"><img src="'+docUrl+'/'+file.thumbnail+'"/></div>');

			} else if( file.fileClass === 'image' ) {
				linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_image"></div></div>');
			
			} else if( file.fileClass === 'audio' ) {
				linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_audio"></div></div>');
				
			} else if( file.fileClass === 'video' 
			 && file.thumbnail
			 && data._attachments[file.thumbnail]
			 ) {
				linkDiv = $('<div class="n2Show_icon_wrapper"><img src="'+docUrl+'/'+file.thumbnail+'"/></div>');
			
			} else if( file.fileClass === 'video' ) {
				linkDiv = $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_video"></div></div>');
			};
			
			if( null != linkDiv ) {
				$insertView.append(linkDiv);
				var cb = createMediaCallback(
						file.fileClass
						,docUrl
						,data
						,attachmentName
					);
				linkDiv.click(cb);
			};
		};
		
		function createMediaCallback(uploadType, docUrl, doc, attachmentName) {
			
			return function(evt) {
				var mediaOptions = {
					url: docUrl +'/'+attachmentName
				};
				
				// Mime type
				var attachment = null;
				if( doc._attachments && doc._attachments[attachmentName] ){
					attachment = doc._attachments[attachmentName];
				};
				if( attachment ) {
					mediaOptions.mimeType = attachment.content_type;
				};
				
				var fileDescriptor = doc.nunaliit_attachments.files[attachmentName];
				// Title
				if( fileDescriptor
				 && fileDescriptor.data
				 && fileDescriptor.data.title ) {
					mediaOptions.title = fileDescriptor.data.title;
					
				} else if( doc.nunaliit_contribution 
				 && doc.nunaliit_contribution.title ) {
					mediaOptions.title = doc.nunaliit_contribution.title;
				};

				// Generate brief HTML
				var $temp = $('<div></div>');
				_this.showService._displayDocumentBrief($temp,doc,{
					onDisplayed:function(){
						var html = $temp.html();
						mediaOptions.metaDataHtml = html;
							
						// Display media
						if( uploadType === 'image' ) {
							mediaOptions.type = 'image';
							$n2.mediaDisplay.displayMedia(mediaOptions);
							
						} else if( uploadType === 'video' ) {
							mediaOptions.type = 'video';
							$n2.mediaDisplay.displayMedia(mediaOptions);
							
						} else if( uploadType === 'audio' ) {
							mediaOptions.type = 'audio';
							$n2.mediaDisplay.displayMedia(mediaOptions);
						};
					}
				});

				
				return false;
			};
		};
	}
	
	,_insertHoverSoundIcon: function(data, $insertHoverSoundIcon, opt_){
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
			var dispatchService = _this.showService.getDispatchService();
			if( dispatchService ) {
				var dispatchHandle = _this.showService.dispatchHandle;
				if( !playSound ) {
					dispatchService.send(dispatchHandle, {type:'playHoverSoundOn',doc:data});
					playSound = true;
				} else {
					dispatchService.send(dispatchHandle, {type:'playHoverSoundOff',doc:data});
					playSound = false;
				};
			};
		};
	}
	
	,_insertExternalMediaLink: function(data, $externalLink, opt_) {
		var attachmentName = $externalLink.attr('href');
		
		var file = null;
		if( data 
		 && data.nunaliit_attachments 
		 && data.nunaliit_attachments.files ) {
			file = data.nunaliit_attachments.files[attachmentName];
		};
		
		if( file
		 && data._attachments 
		 && data._attachments[attachmentName] ) {
			
			var docUrl = this.options.db.getDocumentUrl(data);

			var linkUrl = docUrl +'/'+attachmentName;
			$externalLink.attr('href',linkUrl);
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
	}
	
	,_clickFindGeometryOnMap: function(contextDoc, $jq, opt){
		var _this = this;

		if( this.options.findGeometryFunction ) {
			if( contextDoc
			 && contextDoc.nunaliit_geom ) {
				var x = (contextDoc.nunaliit_geom.bbox[0] + contextDoc.nunaliit_geom.bbox[2]) / 2;
				var y = (contextDoc.nunaliit_geom.bbox[1] + contextDoc.nunaliit_geom.bbox[3]) / 2;
				
				$jq.click(function(){
					_this.options.findGeometryFunction(contextDoc,x,y,opt);
					return false;
				});
			} else {
				$jq.remove();
			};
		} else {
			$jq.remove();
		};
	}
	
	,_clickAddLayerFromDefinition: function(contextDoc, $jq, opt){
		var _this = this;

		var viewLayerFunction = this.options.viewLayerFunction;
		var dispatchService = _this.showService.getDispatchService();
		
		if( viewLayerFunction || dispatchService ) {
			if( contextDoc
			 && contextDoc.nunaliit_layer_definition ) {
				$jq.click(function(){
					var layerDefinition = contextDoc.nunaliit_layer_definition;
					
					if( viewLayerFunction ) {
						viewLayerFunction(contextDoc);
					};
					
					if( dispatchService ) {
						var layer = {
							id: layerDefinition.id
							,name: layerDefinition.name
							,couchDb: {
								viewName: 'geom'
								,layerName: layerDefinition.id
								,db: _this.options.db
								,designDoc: _this.options.designDoc
							}
						};
						
						var dispatchHandle = _this.showService.dispatchHandle;
						dispatchService.send(
							dispatchHandle
							,{
								type: 'addLayerToMap'
								,layer: layer
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
	}
	
	,_clickEdit: function(contextDoc, $jq, opt){
		var _this = this;

		if( this.options.editFunction ) {
			$jq.click(function(){
				_this.options.editFunction(contextDoc,opt);
				return false;
			});
		} else {
			$jq.empty();
		};
	}
	
	,_clickDelete: function(contextDoc, $jq, opt){
		var _this = this;

		if( this.options.deleteFunction ) {
			$jq.click(function(){
				_this.options.deleteFunction(contextDoc,opt);
				return false;
			});
		} else {
			$jq.empty();
		};
	}
	
	,_handleHover : function(contextDoc, $jq, opt){

		var dispatchService = this.showService.getDispatchService();

		if( dispatchService ) {
			var dispatchHandle = this.showService.dispatchHandle;
			$jq.hover(
				function(){ // in
					dispatchService.send(dispatchHandle, {
						type:'focusOn'
						,docId:contextDoc._id
						,doc:contextDoc
					});
				}
				,function(){ // out
					dispatchService.send(dispatchHandle, {
						type:'focusOff'
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

	options: null
	
	,domStyler: null
	
	,dispatchHandle: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			db: null
			,designDoc: null
			,serviceDirectory: null
			,defaultSchema: null
			,displayFunction: null
			,editFunction: null
			,deleteFunction: null
			,findGeometryFunction: null
			,viewLayerFunction: null
			,preprocessDocument: function(doc){ return doc; }
			,eliminateDeniedMedia: false
			,eliminateNonApprovedMedia: false
		},opts_);
		
		var _this = this;
		
		this.domStyler = new DomStyler(this.options, this);

		var requestService = this.getRequestService();
		if( requestService ){
			requestService.addUserListener(function(userDoc){
				_this._displayUserDocument(userDoc);
			});
			requestService.addDocumentListener(function(doc){
				_this._displayDocument(doc);
			});
		};
		
		var notifierService = this.getNotifierService();
		if( notifierService ) {
			notifierService.addListener(function(change){
				_this._notifierUpdate(change);
			});
		};
		
		var dispatchService = this.getDispatchService();
		if( dispatchService ) {
			this.dispatchHandle = dispatchService.getHandle('n2.couchShow');
		};
	}

	,getRequestService: function(){
		if( this.options.requestService ){
			return this.options.requestService;
		};
		
		if( this.options.serviceDirectory 
		 && this.options.serviceDirectory.requestService ) {
			return this.options.serviceDirectory.requestService;
		};
		
		return null;
	}

	,getNotifierService: function(){
		if( this.options.notifierService ){
			return this.options.notifierService;
		};
		
		if( this.options.serviceDirectory 
		 && this.options.serviceDirectory.notifierService ) {
			return this.options.serviceDirectory.notifierService;
		};
		
		return null;
	}

	,getDispatchService: function(){
		if( this.options.serviceDirectory 
		 && this.options.serviceDirectory.dispatchService ) {
			return this.options.serviceDirectory.dispatchService;
		};
		
		return null;
	}

	,getSchemaRepository: function(){
		if( this.options.schemaRepository ){
			return this.options.schemaRepository;
		};
		
		if( this.options.serviceDirectory 
		 && this.options.serviceDirectory.schemaRepository ) {
			return this.options.serviceDirectory.schemaRepository;
		};
		
		return null;
	}

	,fixElementAndChildren: function($elem, opt, contextDoc){
		this.domStyler.fixElementAndChildren($elem, opt, contextDoc);
	}
	
	,displayBriefDescription: function($elem, opt, doc){
		var _this = this;

		var schema = null;

		// Remember to update
		if( doc && doc._id ) {
			$elem.addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(doc._id));
			$elem.addClass('n2ShowDocBrief');
		};
		
		this._displayDocumentBrief($elem, doc);
	}
	
	,displayDocument: function($elem, opt, doc){
		var _this = this;

		var schema = null;

		// Remember to update
		if( doc && doc._id ) {
			$elem.addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(doc._id));
		};
		
		this._displayDocumentFull($elem, doc, opt);
	}
	
	,printUserName: function($elem, userName, opts){
		$elem.addClass('n2ShowUser_'+$n2.utils.stringToHtmlId(userName));
		if( opts.showHandle ) {
			$elem.addClass('n2ShowUserDisplayAndHandle');
		} else {
			$elem.addClass('n2ShowUserDisplay');
		};
		$elem.text('('+userName+')');

		this._requestUser(userName); // fetch document
	}
	
	,printBriefDescription: function($elem, docId, opts){
		$elem.addClass('n2ShowDoc_'+$n2.utils.stringToHtmlId(docId));
		$elem.addClass('n2ShowDocBrief');
		$elem.text(docId);

		this._requestDocument(docId); // fetch document
	}
	
	,printDocument: function($elem, docId, opts_){
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
	}
	
	,_displayUserDocument: function(userDoc){
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
	}

	,_displayDocument: function(doc){
		var _this = this;
		
		var id = doc._id;
		
		var showClass = 'n2ShowDoc_'+$n2.utils.stringToHtmlId(id);
		
		$('.'+showClass).each(function(i,elem){
			var $elem = $(elem);
			
			$elem.removeClass(showClass).addClass('n2ShowUpdateDoc_'+$n2.utils.stringToHtmlId(id));

			if( _this.options.eliminateNonApprovedMedia ) {
				if( $n2.couchMap.documentContainsMedia(doc) 
				 && false == $n2.couchMap.documentContainsApprovedMedia(doc) ) {
					$elem.empty();
					return;
				};
				
			} else if( _this.options.eliminateDeniedMedia ) {
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
	}

	,_updateDocument: function(doc){
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
	}
	
	,_displayDocumentBrief: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: function($elem, doc, opt_){}
		},opt_);

		var _this = this;

		// Peform pre-processing, allowing client to
		// augment document prior to display
		doc = this.options.preprocessDocument(doc);

		if( doc.nunaliit_schema ) {
			_this.getSchemaRepository().getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema_) {
					printBrief($elem,schema_);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( _this.options.defaultSchema ) {
			printBrief($elem, _this.options.defaultSchema);
			
		} else {
			displayError($elem);
		};
		
		function printBrief($elem, schema){
			schema.brief(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			opt.onDisplayed($elem, doc, schema, opt_);
		};
		
		function displayError($elem){
			$elem.text( _loc('Unable to display brief description') );
			opt.onDisplayed($elem, doc, null, opt_);
		};
	}
	
	,_displayDocumentFull: function($elem, doc, opt_){
		
		var opt = $n2.extend({
			onDisplayed: function($elem, doc, opt_){}
		},opt_);
		
		var _this = this;
		
		// Peform pre-processing, allowing client to
		// augment document prior to display
		doc = this.options.preprocessDocument(doc);
		
		if( doc.nunaliit_schema ) {
			_this.getSchemaRepository().getSchema({
				name: doc.nunaliit_schema
				,onSuccess: function(schema){
					displaySchema($elem, schema);
				}
				,onError: function(){
					displayError($elem);
				}
			});
			
		} else if( _this.options.defaultSchema ) {
			displaySchema($elem, _this.options.defaultSchema);
			
		} else {
			displayError($elem);
		};
		
		function displaySchema($elem,schema){
			schema.display(doc,$elem);
			_this.fixElementAndChildren($elem, {}, doc);
			opt.onDisplayed($elem, doc, schema, opt_);
		};
		
		function displayError($elem){
			$elem.text( _loc('Unable to display document') );
		};
	}
	
	,_requestUser: function(userName){
		var requestService = this.getRequestService();
		if( requestService ){
			requestService.requestUser(userName); // fetch document
		};
	}
	
	,_requestDocument: function(docId,cbFn){
		var requestService = this.getRequestService();
		if( requestService ){
			requestService.requestDocument(docId,cbFn); // fetch document
		};
	}
	
	,_notifierUpdate: function(change){
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
	}
});

//*******************************************************
$n2.couchShow = {
	Show: Show	
};

})(jQuery,nunaliit2);
