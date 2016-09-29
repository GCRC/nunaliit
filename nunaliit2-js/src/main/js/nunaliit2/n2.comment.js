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
	
	lastDoc: null,
	
	lastDivId: null,
	
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
			this.dispatchService.register(DH, 'documentContent', f);
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
		var documentSource = this.documentSource;
		var showService = this.showService;
		
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
		
		this.lastDoc = doc;
		this.lastDivId = $n2.utils.getElementIdentifier($elem);

		// Get references
		documentSource.getReferencesFromOrigin({
			docId: docId
			,onSuccess: loadedDocIds
		});
		
		function loadedDocIds(refDocIds){
			// Get documents that include comments
			documentSource.getDocumentInfoFromIds({
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
			$elem.empty();
			for(var i=0,e=docInfos.length; i<e; ++i){
				var docInfo = docInfos[i];
				var docId = docInfo.id;
				var $commentDiv = $('<div>')
					.addClass('n2DisplayComment_doc n2DisplayComment_doc_'+$n2.utils.stringToHtmlId(docId))
					.attr('n2DocId',docId)
					.appendTo($elem);
				var $content = $('<div>')
					.addClass('n2DisplayComment_content')
					.appendTo($commentDiv);
				showService.printDocument($content, docId);

				var $buttons = $('<div>')
					.addClass('n2DisplayComment_buttons')
					.appendTo($commentDiv);
				
				$('<a>')
					.attr('href','#')
					.text( _loc('Reply') )
					.addClass('n2DisplayComment_button_reply')
					.appendTo($buttons)
					.click(function(){
						var docId = $(this).parents('.n2DisplayComment_doc').attr('n2DocId');
						_this._addReply(docId);
						return false;
					});
				
				$('<a>')
					.attr('href','#')
					.text( _loc('More Details') )
					.addClass('n2DisplayComment_button_focus')
					.appendTo($buttons)
					.click(function(){
						var docId = $(this).parents('.n2DisplayComment_doc').attr('n2DocId');
						_this._changeFocus(docId);
						return false;
					});
			};
		};
	},
	
	_addReply: function(docId){
		var _this = this;
		var documentSource = this.documentSource;
		var createRelatedDocProcess = this.createRelatedDocProcess;
		
		documentSource.getDocument({
			docId: docId
			,onSuccess: function(doc){
				createRelatedDocProcess.replyToDocument({
					doc: doc
					,schema: _this.commentSchema
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
		if( 'documentContent' === m.type ){
			var doc = m.doc;
			this._handleDocumentContent(doc);
		};
	},
	
	_handleDocumentContent: function(doc){
		if( doc.nunaliit_origin ){
			// Check if we should add an entry for this document
			if( doc.nunaliit_origin.doc === this.lastDoc._id ){
				// Related. Check if we are still displaying comments
				var $section = $('#'+this.lastDivId);
				if( $section.length > 0 ){
					var $entry = $section.find('.n2DisplayComment_doc_'+$n2.utils.stringToHtmlId(doc._id));
					if( $entry.length < 1 ){
						// OK, need to add a comment entry. Refresh.
						this.display({
							divId: this.lastDivId
							,doc: this.lastDoc
							,schema: null
						});
					};
				};
			};
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
	},

	/**
	 * Use this function to add a button to an element. The button
	 * initiates adding a comment associated with the given document.
	 */
	addButton: function(opts_){
		var opts = $n2.extend({
			div: null
			,doc: null
		},opts_);
		
		var _this = this;

		if( this.commentSchema ){
			var doc = opts.doc;
			var $buttons = $(opts.div);
			
	 		// Show 'add comment' button
			var $button = $('<a>')
				.attr('href','#')
				.text( _loc('Add Comment') )
				.appendTo($buttons)
				.click(function(){
					_this._addComment(doc);
					return false;
				});

			$button.addClass('nunaliit_form_link');
			$button.addClass('nunaliit_form_link_add_related_item');
		};
		
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
