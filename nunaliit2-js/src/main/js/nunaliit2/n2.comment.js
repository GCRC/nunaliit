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

var CommentStreamDisplay = $n2.Class({
	
	commentSchema: null,
	
	dispatchService: null,
	
	documentSource: null,
	
	showService: null,
	
	createDocProcess: null,
	
	initialize: function(opts_){
		
		var opts = $n2.extend({
			schema: null
			,dispatchService: null
			,documentSource: null
			,showService: null
			,createDocProcess: null
		},opts_);
		
		var _this = this;
		
		this.commentSchema = opts.schema;
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
		};
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
			_this.documentSource.getDocumentInfoFromIds({
				docIds: refDocIds
				,onSuccess: loadedDocInfos
			});
		};
		
		function loadedDocInfos(docInfos){
			// Sort comments by last updated time
			docInfos.sort(function(a,b){
				var aTime = a.updatedTime;
				if( !aTime ){
					aTime = a.createdTime;
				};

				var bTime = b.updatedTime;
				if( !bTime ){
					bTime = b.createdTime;
				};
				
				if( aTime && bTime ){
					return bTime - aTime;
				};
				if( aTime ) return -1;
				if( bTime ) return 1;
				
				if( a.id > b.id ) {
					return 1;
				}
				return -1;
			});

			// Display comments
			var $stream = $('.n2Comment_stream_'+$n2.utils.stringToHtmlId(originId));
			if( $stream.length > 0 ){
				$stream.empty();
				docInfos.forEach(function(docInfo){
					var docId = docInfo.id;
					var $commentDiv = $('<div>')
						.addClass('n2Comment_doc n2Comment_doc_'+$n2.utils.stringToHtmlId(docId))
						.attr('n2DocId',docId)
						.appendTo($stream);
					var $content = $('<div>')
						.addClass('n2Comment_content')
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
				});
			};
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

	_addComment: function(doc, elem){
		var _this = this;

		var createRelatedDocProcess = this.createDocProcess;
		createRelatedDocProcess.replyToDocument({
			doc: doc
			,schema: this.commentSchema
			,originDocId: doc._id
			,elem: elem
			,onSuccess: function(docId){
				_this._resetAddSection(doc, elem);
			}
			,onError: function(err){
				_this._resetAddSection(doc, elem);
			}
			,onCancel: function(){
				_this._resetAddSection(doc, elem);
			}
		});
	},
	
	_addReply: function(docId, $outerDiv){
		var _this = this;
		var documentSource = this.documentSource;
		var createRelatedDocProcess = this.createDocProcess;
		
		var $elem = undefined;
		if( $outerDiv.length > 0 ){
			$elem = $('<div>')
				.addClass('n2Comment_reply')
				.appendTo($outerDiv);
		};
		
		documentSource.getDocument({
			docId: docId
			,onSuccess: function(doc){
				createRelatedDocProcess.replyToDocument({
					doc: doc
					,schema: _this.commentSchema
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
		};
	},
	
	_handleDocumentContent: function(doc){
		if( doc.nunaliit_origin 
		 && typeof doc.nunaliit_origin.doc === 'string' ){
			var originId = doc.nunaliit_origin.doc;
			var $stream = $('.n2Comment_stream_'+$n2.utils.stringToHtmlId(originId));
			if( $stream.length > 0 ){
				// OK, need to refresh this stream
				var divId = $n2.utils.getElementIdentifier($stream);
				this._refreshStream({
					docId: originId
				});
			};
		};
	},
	
	_handleDocumentDeleted: function(docId){
		if( doc.nunaliit_origin 
		 && typeof doc.nunaliit_origin.doc === 'string' ){
			// Remove associated streams
			var $section = $( '.n2Comment_stream_'+$n2.utils.stringToHtmlId(docId) );
			$section.remove();
			
			// Remove associated sections
			var $section = $( '.n2Comment_doc_'+$n2.utils.stringToHtmlId(docId) );
			$section.remove();
		};
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
		var commentStreamDisplay = new CommentStreamDisplay({
			schema: this.commentSchema
			,dispatchService: this.dispatchService
			,documentSource: this.documentSource
			,showService: this.showService
			,createDocProcess: this.createDocProcess
		});
		
		return commentStreamDisplay;
	}
});


//===================================================================================

// Exports
$n2.comment = {
	Service: CommentService
	,CommentStreamDisplay: CommentStreamDisplay
};

})(jQuery,nunaliit2);
