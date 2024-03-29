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

var DH = 'n2.displayTagAssignment';

var TagAssignment = $n2.Class({
	displayPanelName: null
	,defaultSchema: null
	,dispatchService: null
	,schemaRepository: null
	,couchDocumentEditService: null
	,authService: null
	,tagService: null
	,tagField: null
	
	,initialize: function(opts_) {
		var _this = this;
		
		var opts = $n2.extend({
			displayPanelName: null
			,serviceDirectory: null
			,couchDocumentEditService: null
			,tagService: null
		}, opts_);
		
		this.updateIds = [];
		this.docIds = [];
		this.docs = [];
		this.addTags = [];
		this.displayPanelName = opts.displayPanelName;
		this.tagField = opts.tagField;
		
		if( opts.serviceDirectory ){
			this.couchDocumentEditService = opts.serviceDirectory.couchDocumentEditService;
			this.schemaRepository = opts.serviceDirectory.schemaRepository;
			this.dispatchService = opts.serviceDirectory.dispatchService;
			this.tagService = opts.serviceDirectory.tagService;
			this.authService = opts.serviceDirectory.authService;			
		}
		
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
			dispatcher.register(DH, 'documentContentCreated', f);
			dispatcher.register(DH, 'documentContentUpdated', f);
		}

		if(!this.tagField) {
			throw new Error('tag field is required');
		}

		$n2.log('TagAssignment',this);
	}

	// external
	,setSchema: function(schema) {
		this.defaultSchema = schema;
	}
	
	,_getDisplayDiv: function(){
		var divId = this.displayPanelName;
		return $('#'+divId);
	}
	
	,_preUpdateDocuments: function(docs, field, tags) {
		const _this = this;
		this.couchDocumentEditService.checkUploadService(
			function()  {
				_this._updateDocs(docs, field, tags)
			},
			function() {
				console.error('Upload service not available');
			}
		)
	}

	,_updateDocs: function(field, tags) {
		const _this = this;
		this.updateIds.push(...this.docIds);
		this._formStateUpdate();
		this.docs.forEach( doc => {
			if(!_this.couchDocumentEditService.addTagsToDocument(doc, field, tags)) {
				_this.updateIds = _this.updateIds.filter(function(value){ 
					return value !== doc._id;
				});
			}
		})
		this.addTags = [];
		this._displayTags();
		this._formStateUpdate();
	}

	,_displayTags: function() {
		const _this = this;
		let $tags = $('#n2TagChips').empty();
		for(let i = 0; i < this.addTags.length; i++) {
			const $tag = $('<div>').addClass('n2_tag_element').appendTo($tags);
			$('<span>').text(this.addTags[i]).appendTo($tag);
			$('<span>').attr('aria-label', 'delete this tag')
				.addClass('n2schema_tag_item_delete')
				.text('x')
				.click(function() {
					_this.addTags.splice(i, 1);
					_this._displayTags();
					return false;
				})
				.appendTo($tag);
		}
	}

	,_displayTagBox: function($formDiv) {
		const _this = this;
		let $tagBox = $formDiv.find('.n2schema_taginput_container');
		if($tagBox.length > 0) {
			$tagBox.empty();
		} else {
			$tagBox = $('<div>').addClass('n2schema_taginput_container').appendTo($formDiv);
		}

		$("<div id='n2TagChips'>").appendTo($tagBox)
		this._displayTags();
		
		let $tagInput = $('<input id="tagInput" type="search" placeholder="Add a tag" autocomplete="off" role="textbox" aria-autocomplete="list" aria-haspopup="true">')
			.addClass('n2schema_input').addClass('n2schema_type_tag').addClass('ui-autocomplete-input')
			.appendTo($tagBox);

		$tagInput.autocomplete({
			source: function(req, res) {
				_this.tagService.autocompleteQuery(req, res, _this.tagField, 10)
			}, // callback params: text = current value of input, res = format of data - array or string as described in docs,
			delay: 300,
			minLength: 3
		});
		$tagInput.keypress(function(event){
			if(event.keyCode == 13){
				event.preventDefault();
				if($tagInput.val().length > 0) {
					_this.addTags.push($tagInput.val());
					_this._displayTags();
					$tagInput.val("");
				}
			}
		});
	}

	,_displayForm: function(){
		const _this = this;
		const $container = this._getDisplayDiv();
		let $formDiv = $container.find('.n2TagAssignment_form').empty();
		//probably should loop over all docs and check edit
		//$n2.couchMap.canEditDoc(doc)
		this._displayTagBox($formDiv);
		const $buttonDiv = $('<div>').appendTo($formDiv);
		$('<input type="submit" value="' + _loc('save') + '">')
			.addClass('n2TagAssignment_button_add')
			.appendTo($buttonDiv)
			.click(function(event){
				event.preventDefault();
				if(_this.addTags.length > 0) {
					_this._preUpdateDocuments(_this.tagField, _this.addTags);
				}
			});

		$('<div class="progress">Saving!</div>')
			.hide()
			.appendTo($formDiv);
	}

	,_formStateUpdate: function() {
		if(this.updateIds.length > 0) {
			$(".n2TagAssignment_form :input").prop('disable', true);
			$(".n2TagAssignment_form .progress").show();
		} else {
			$(".n2TagAssignment_form :input").prop('disable', false);
			$(".n2TagAssignment_form .progress").hide();
		}
	}
	
	
	,_handleDispatch: function(msg, addr, dispatcher){
		const _this = this;
		
		var $div = this._getDisplayDiv();
		if( $div.length < 1 ){
			// No longer displaying. Un-register this event.
			dispatcher.deregister(addr);
			return;
		};
		
		// Selected document
		if( msg.type === 'selected' ) {
			if( msg.doc ) {
				this.docIds = [msg.doc._id];
				this.docs = [msg.doc];
			} else if( msg.docId ) {
				this.docIds = [msg.docId];
				this.docs = null;
			} else if( msg.docs ) {
				this.docs = msg.docs
				this.docIds = msg.docs.map(function(doc) {
					return doc._id;
				})
			} else if( msg.docIds ) {
				this.docIds = msg.docIds;
				this.docs = null;
			}
			this.updateIds = [];
			// Check that we are logged in
			if( this.authService && false == this.authService.isLoggedIn() ) {
				const $container = this._getDisplayDiv();
				$('<div>').text(_loc('Login to Continue')).appendTo($container);
				this.authService.showLoginForm({
					onSuccess: function() {
						_this._updateDisplay();
					}
				});
				return;
			} else {
				this._updateDisplay();
			}
			
		} else if( msg.type === 'searchResults' ) {
			console.error('search results not implemented');
			
		} else if( msg.type === 'documentDeleted' ) {
			var docId = msg.docId;
			this._handleDocumentDeletion(docId);
		} else if( msg.type === 'authLoggedIn' || msg.type === 'authLoggedOut' ) {
			//Show/hide buttons?
		} else if( msg.type === 'documentContentUpdated' ) {
			this.updateIds = this.updateIds.filter(function(value){ 
				return value !== msg.doc._id;
			});
			for(let i = 0; i < this.docs.length; i++) {
				if(this.docs[i]._id === msg.doc._id) {
					this.docs[i] = msg.doc;
				}
			}
			this._formStateUpdate();
		}
	}
	
	,_updateDisplay: function() {
		$('body').addClass('n2_display_multi_edit');
		const $container = this._getDisplayDiv();
		let $displayDiv = $container.find('.n2TagAssignment_display');
		if($displayDiv.length > 0) {
			$displayDiv.empty();
		} else {
			$container.empty();
			$displayDiv = $('<div>').addClass('n2TagAssignment_display');
			$displayDiv.appendTo($container);
			$('<form>')
			.addClass('n2TagAssignment_form')
			.appendTo($container);	
		}
		const len = this.docIds.length;
		$displayDiv.append(`<div>${_loc('Selected')}: ${len}</div>`);
		this._displayForm();
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
			$div.append('<div>Search Results Not Implemented</div>');
		}
	}
	
	,_dispatch: function(m){
		var dispatcher = this.dispatchService;
		if( dispatcher ) {
			dispatcher.send(DH,m);
		};
	}
	
	,_handleDocumentDeletion: function(docId){
		console.log('Not currently implemented');
		//Need to remove docId and doc from this.docIds and this.docs
		//then this._updateDisplay()
	}
	
	,_handleDocumentCreation: function(doc){
		console.log('Do we need this?');
	}
});


//===================================================================================
function HandleDisplayAvailableRequest(m){
	if( m.displayType === 'tagAssignment' ){
		m.isAvailable = true;
	};
};

function HandleDisplayRenderRequest(m){
	if( m.displayType === 'tagAssignment' ){
		var options = {};
		if( m.displayOptions ){
			for(var key in m.displayOptions){
				options[key] = m.displayOptions[key];
			};
		};
		
		options.displayPanelName = m.displayId;
		options.createDocProcess = m.config.directory.createDocProcess;
		options.serviceDirectory = m.config.directory;
		
		var displayControl = new TagAssignment(options);

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
$n2.displayTagAssignment = {
	TagAssignment: TagAssignment
	,HandleDisplayAvailableRequest: HandleDisplayAvailableRequest
	,HandleDisplayRenderRequest: HandleDisplayRenderRequest
};

})(jQuery,nunaliit2);
