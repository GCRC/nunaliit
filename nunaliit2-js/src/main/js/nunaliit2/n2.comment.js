/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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
DH = 'n2.comment';

//===================================================================================
/*
 * There should be one instance of this class, per Nunaliit configuration. This is
 * because this component registers events with the dispatcher.
 */

var CommentStreamDisplay = $n2.Class({
	
	commentService: null,
	
	dispatchService: null,
	
	documentSource: null,
	
	showService: null,
	
	createDocProcess: null,
	
	cachedCommentsByDocId: null,
	
	reinsertElementsId: null,
	
	initialize: function(opts_){
		
		var opts = $n2.extend({
			commentService: null
			,dispatchService: null
			,documentSource: null
			,showService: null
			,createDocProcess: null
		},opts_);
		
		var _this = this;
		
		this.commentService = opts.commentService;
		this.dispatchService = opts.dispatchService;
		this.documentSource = opts.documentSource;
		this.showService = opts.showService;
		this.createDocProcess = opts.createDocProcess;
		
		if( this.dispatchService ){
			var f = function(msg, addr, dispatcher){
				_this._handleDispatch(msg, addr, dispatcher);
			};
			this.dispatchService.register(DH, 'documentContentCreated', f);
			this.dispatchService.register(DH, 'documentContentUpdated', f);
			this.dispatchService.register(DH, 'documentDeleted', f);
			this.dispatchService.register(DH, 'cacheRetrieveDocument', f);
		};
		
		// Create an area to keep elements that should be re-inserted in the
		// comment stream on a redraw.
		var $reinsertElements = $('<div>')
			.css({
				position: 'absolute'
				,display: 'none'
			})
			.addClass('n2comment_reinsert_cache')
			.appendTo( $('body') );
		this.reinsertElementsId = $n2.utils.getElementIdentifier($reinsertElements);
	},
	
	display: function(opts_){
		var opts = $n2.extend({
			divId: null
			,div: null
			,doc: null
		},opts_);
		
		var _this = this;
		
		var doc = opts.doc;
		var docId = doc._id;
		var showService = this.showService;
		
		var buttonDisplay = new $n2.couchDisplay.ButtonDisplay();
		
		var $elem = opts.div;
		if( ! $elem ) {
			$elem = $('#'+opts.divId);
		};
		if( ! $elem.length) {
			return;
		};
		if( !showService ) {
			$n2.log('Show service not available for comment process');
			return;
		};
		
		$elem.empty();
		
		// Insert comment stream
		$('<div>')
			.addClass('n2Comment_stream n2Comment_stream_'+$n2.utils.stringToHtmlId(docId))
			.appendTo($elem);
		this._refreshStream({
			docId: docId
		});

		// Insert 'Add Comment' section
		var $addSection = $('<div>')
			.addClass('n2Comment_add_section')
			.appendTo($elem);
		this._resetAddSection(doc, $addSection);
	},
	
	_refreshStream: function(opts_){
		var opts = $n2.extend({
			docId: null
		},opts_);
		
		var _this = this;

		var originId = opts.docId;
		var buttonDisplay = new $n2.couchDisplay.ButtonDisplay();
		
		// Get references
		this.documentSource.getReferencesFromOrigin({
			docId: originId
			,onSuccess: loadedDocIds
		});
		
		function loadedDocIds(refDocIds){
			// Get documents that include comments
			_this.documentSource.getDocuments({
				docIds: refDocIds
				,onSuccess: loadedDocs
			});
		};
		
		function loadedDocs(docs){
			// Cache documents to save show service from reloading them
			_this.cachedCommentsByDocId = {};
			docs.forEach(function(doc){
				var docId = doc._id;
				_this.cachedCommentsByDocId[docId] = doc;
			});
			
			// Sort comments by last updated time
			docs.sort(function(a,b){
				var aTime = undefined;
				if( a && a.nunaliit_created ){
					aTime = a.nunaliit_created.time;
				};
				if( a && a.nunaliit_last_updated ){
					aTime = a.nunaliit_last_updated.time;
				};

				var bTime = undefined;
				if( b && b.nunaliit_created ){
					bTime = b.nunaliit_created.time;
				};
				if( b && b.nunaliit_last_updated ){
					bTime = b.nunaliit_last_updated.time;
				};
				
				if( typeof aTime === 'number' 
				 && typeof bTime === 'number' ){
					return bTime - aTime;
				};
				if( aTime ) return -1;
				if( bTime ) return 1;
				
				if( a._id > b._id ) {
					return 1;
				}
				return -1;
			});
			
			// Create comment stream tree
			var leavesByDocId = {};
			var tree = {};
			docs.forEach(function(doc){
				var docId = doc._id;
				var leaf = {
					docId: docId
					,doc: doc
					,replies: {}
					,inReplyToId: undefined
				};
				leavesByDocId[docId] = leaf;
			});
			for(var docId in leavesByDocId){
				var leaf = leavesByDocId[docId];
				var doc = leaf.doc;
				var topLevelLeaf = true;
				if( doc 
				 && doc.nunaliit_source 
				 && typeof doc.nunaliit_source.doc === 'string' ){
					var inReplyToId = doc.nunaliit_source.doc;
					var replyToLeaf = leavesByDocId[inReplyToId];
					if( replyToLeaf ){
						leaf.inReplyToId = inReplyToId;
						replyToLeaf.replies[docId] = leaf;
						topLevelLeaf = false;
					};
				};
				
				if( topLevelLeaf ){
					tree[docId] = leaf;
				};
			};
			
			// Retrieve display element cache
			var $reinsertElementsCache = $('#'+_this.reinsertElementsId);

			// Display comments
			var $stream = $('.n2Comment_stream_'+$n2.utils.stringToHtmlId(originId));
			if( $stream.length > 0 ){
				// Save elements that require surviving of redraw
				var $reinsertElements = $stream.find('.n2Comment_reinsert');
				$reinsertElements.appendTo($reinsertElementsCache);
				
				$stream.empty();
				var commentIndex = 0;
				docs.forEach(function(doc){
					var docId = doc._id;
					var $commentDiv = $('<div>')
						.addClass('n2Comment_doc n2Comment_doc_'+$n2.utils.stringToHtmlId(docId))
						.attr('n2DocId',docId)
						.appendTo($stream);
					var $content = $('<div>')
						.addClass('n2Comment_content nunaliit_list_mod2_'+(commentIndex%2))
						.appendTo($commentDiv);
					_this.showService.printDocument($content, docId);

					var $buttons = $('<div>')
						.addClass('n2Comment_buttons')
						.appendTo($commentDiv);
					
					buttonDisplay.drawButton({
						elem: $buttons
						,name: 'reply'
						,label: _loc('Reply')
						,click: function(){
							var $outer = $(this).parents('.n2Comment_doc');
							var docId = $outer.attr('n2DocId');
							_this._addReply(docId,$outer);
						}
					});

					buttonDisplay.drawButton({
						elem: $buttons
						,name: 'more_details'
						,label: _loc('More Details')
						,click: function(){
							var docId = $(this).parents('.n2Comment_doc').attr('n2DocId');
							_this._changeFocus(docId);
						}
					});
					
					// Re-insert the elements, if present
					$reinsertElementsCache
						.find('.n2Comment_reinsert_'+$n2.utils.stringToHtmlId(docId))
						.appendTo($commentDiv);
					
					++commentIndex;
				});
			};

			// No need for cached elements, anymore
			$reinsertElementsCache.empty();
		};
	},
	
	_resetAddSection: function(doc, $addSection){
		var _this = this;

		var buttonDisplay = new $n2.couchDisplay.ButtonDisplay();

		$addSection.empty();
		buttonDisplay.drawButton({
			elem: $addSection
			,name: 'add_comment'
			,label: _loc('Add Comment')
			,click: function(){
				var $addSection = $(this).parents('.n2Comment_add_section');
				$addSection.empty();
				_this._addComment(doc,$addSection);
			}
		});

	},

	_addComment: function(doc, $elem){
		var _this = this;

		var createRelatedDocProcess = this.createDocProcess;
		var commentSchema = this.commentService.getCommentSchema();

		var $outerDiv = $('<div>')
			.appendTo($elem);
		
		createRelatedDocProcess.replyToDocument({
			doc: doc
			,schema: commentSchema
			,originDocId: doc._id
			,elem: $outerDiv
			,onSuccess: function(docId){
				_this._resetAddSection(doc, $elem);
			}
			,onError: function(err){
				_this._resetAddSection(doc, $elem);
			}
			,onCancel: function(){
				_this._resetAddSection(doc, $elem);
			}
		});
	},
	
	_addReply: function(docId, $outerDiv){
		var _this = this;
		var documentSource = this.documentSource;
		var createRelatedDocProcess = this.createDocProcess;
		var commentSchema = this.commentService.getCommentSchema();
		
		var $elem = undefined;
		if( $outerDiv.length > 0 ){
			$elem = $('<div>')
				.addClass('n2Comment_reply n2Comment_reinsert n2Comment_reinsert_'+$n2.utils.stringToHtmlId(docId))
				.appendTo($outerDiv);
		};
		
		documentSource.getDocument({
			docId: docId
			,onSuccess: function(doc){
				createRelatedDocProcess.replyToDocument({
					doc: doc
					,schema: commentSchema
					,elem: $elem
				});
			}
		});
	},
	
	_changeFocus: function(docId){
		var _this = this;

		this.dispatchService.send(DH,{
			type: 'userSelect'
			,docId: docId
		});
	},
	
	_handleDispatch: function(m, address, dispatcher){
		if( 'documentContentCreated' === m.type ){
			var doc = m.doc;
			this._handleDocumentContent(doc);

		} else if( 'documentContentUpdated' === m.type ){
			var doc = m.doc;
			this._handleDocumentContent(doc);

		} else if( 'documentDeleted' === m.type ){
			var docId = m.docId;
			this._handleDocumentDeleted(docId);

		} else if( 'cacheRetrieveDocument' === m.type ){
			// Synchronous call
			var docId = m.docId;
			if( this.cachedCommentsByDocId ){
				var doc = this.cachedCommentsByDocId[docId];
				
				if( doc ){
					m.doc = doc;
				};
			};
		};
	},
	
	_handleDocumentContent: function(doc){
		// Update cache
		if( this.cachedCommentsByDocId 
		 && this.cachedCommentsByDocId[doc._id]){
			this.cachedCommentsByDocId[doc._id] = doc;
		};
		
		if( doc.nunaliit_origin 
		 && typeof doc.nunaliit_origin.doc === 'string' ){
			var originId = doc.nunaliit_origin.doc;
			var $stream = $('.n2Comment_stream_'+$n2.utils.stringToHtmlId(originId));
			if( $stream.length > 0 ){
				// OK, need to refresh this stream
				this._refreshStream({
					docId: originId
				});
			};
		} else {
			// This document does not have an origin. Should no longer be part of a
			// comment stream
			var $commentDoc = $('.n2Comment_doc_'+$n2.utils.stringToHtmlId(doc._id));
			$commentDoc.remove();
		};
	},
	
	_handleDocumentDeleted: function(docId){
		// Remove associated streams
		var $section = $( '.n2Comment_stream_'+$n2.utils.stringToHtmlId(docId) );
		$section.remove();
		
		// Remove associated sections
		var $section = $( '.n2Comment_doc_'+$n2.utils.stringToHtmlId(docId) );
		$section.remove();
	}
});

//===================================================================================
var CommentService = $n2.Class({

	documentSource: null,

	showService: null,

	createDocProcess: null,
	
	dispatchService: null,
	
	customService: null,
	
	commentSchema: null,
	
	commentStreamDisplay: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			documentSource: null
			,showService: null
			,createDocProcess: null
			,dispatchService: null
			,customService: null
			,commentSchema: null
		},opts_);
		
		this.documentSource = opts.documentSource;
		this.showService = opts.showService;
		this.createDocProcess = opts.createDocProcess;
		this.dispatchService = opts.dispatchService;
		this.customService = opts.customService;
		this.commentSchema = opts.commentSchema;
	},

	getCommentSchema: function(){
		return this.commentSchema;
	},

	setCommentSchema: function(commentSchema){
		this.commentSchema = commentSchema;
		
		if( this.commentSchema ){
			$('.n2Comment_button_addcomment')
				.removeClass('n2Comment_button_addcomment_unavailable')
				.addClass('n2Comment_button_addcomment_available');
		} else {
			$('.n2Comment_button_addcomment')
				.removeClass('n2Comment_button_addcomment_available')
				.addClass('n2Comment_button_addcomment_unavailable');
		};
	},

	/**
	 * Use this function to add a button to an element. The button
	 * initiates adding a comment associated with the given document.
	 */
	insertAddCommentButton: function(opts_){
		var opts = $n2.extend({
			div: null
			,doc: null
			,buttonDisplay: null
		},opts_);
		
		var _this = this;

		var doc = opts.doc;
		var $buttons = $(opts.div);
		
		var buttonDisplay = opts.buttonDisplay;
		if( !buttonDisplay ){
			buttonDisplay = new $n2.couchDisplay.ButtonDisplay();
		};
		
		var classNames = ['n2Comment_button_addcomment'];
		if( this.commentSchema ){
			classNames.push('n2Comment_button_addcomment_available');
		} else {
			classNames.push('n2Comment_button_addcomment_unavailable');
		};

		// Show 'add comment' button
		buttonDisplay.drawButton({
			elem: $buttons
			,name: 'add_comment'
			,label: _loc('Add Comment')
			,classNames: classNames
			,click: function(){
				_this._addComment(doc);
			}
		});
	},
	
	_addComment: function(doc){
		var createRelatedDocProcess = this.createDocProcess;
		createRelatedDocProcess.replyToDocument({
			doc: doc
			,schema: this.commentSchema
			,originDocId: doc._id
		});
	},
	
	getCommentStreamDisplay: function(){
		if( !this.commentStreamDisplay ){
			this.commentStreamDisplay = new CommentStreamDisplay({
				commentService: this
				,dispatchService: this.dispatchService
				,documentSource: this.documentSource
				,showService: this.showService
				,createDocProcess: this.createDocProcess
			});
		};
		
		return this.commentStreamDisplay;
	}
});


//===================================================================================

// Exports
$n2.comment = {
	Service: CommentService
	,CommentStreamDisplay: CommentStreamDisplay
};

})(jQuery,nunaliit2);
