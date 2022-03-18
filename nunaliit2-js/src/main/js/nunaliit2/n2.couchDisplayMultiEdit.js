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

var DH = 'n2.couchDisplayMultiEdit';

var DisplayMultiEdit = $n2.Class({
	
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
			,showService: null
			,serviceDirectory: null
			,classDisplayFunctions: {}
		}, opts_);
		
		this.documentSource = opts.documentSource;
		this.displayPanelName = opts.displayPanelName;
		this.classDisplayFunctions = opts.classDisplayFunctions;
		
		if( opts.serviceDirectory ){
			this.showService = opts.serviceDirectory.showService;
			this.customService = opts.serviceDirectory.customService;
			this.authService = opts.serviceDirectory.authService;			
			this.requestService = opts.serviceDirectory.requestService;
			this.schemaRepository = opts.serviceDirectory.schemaRepository;
			this.dispatchService = opts.serviceDirectory.dispatchService;
		}
		
		if( !this.showService ){
			this.showService = opts.showService;
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
			dispatcher.register(DH, 'editClosed', f);
			dispatcher.register(DH, 'documentContentCreated', f);
			dispatcher.register(DH, 'documentContentUpdated', f);
		}

		if( this.requestService ){
			this.requestService.addDocumentListener(function(doc){
				console.log('Do something here?');
				// _this._refreshDocument(doc);
				// _this._populateWaitingDocument(doc);
			});
		}
		
		$('body').addClass('n2_display_multi_edit');
		const $container = this._getDisplayDiv();
		$('<div>')
			.addClass('n2DisplayMultiEdit_display')
			.appendTo($container);	
		$('<form>')
			.addClass('n2DisplayMultiEdit_form')
			.appendTo($container);	
		
		$n2.log('DisplayMultiEdit',this);
	}

	// external
	,setSchema: function(schema) {
		this.defaultSchema = schema;
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
	
	,_displayForm: function($buttons){
		const $container = this._getDisplayDiv();
		//TODO: Don't empty the form...or save the fields and reinput...not sure
		let $formDiv = $container.find('.n2DisplayMultiEdit_form').empty();
		//probably should loop over all docs and check edit
		//$n2.couchMap.canEditDoc(doc)
		$('<input type="text">').appendTo($formDiv)
		$('<a href="#"></a>')
			.addClass('n2DisplayMultiEdit_button_add')
			.text( _loc('Add Tag') )
			.appendTo($formDiv)
			.click(function(){
				console.log('clicked the add tag button');
				return false;
			});
	}
	
	/**
	 * This function replaces a section that is waiting for the
	 * appearance of a document. It replaces the section with an
	 * actual display of the document.
	 */
	,_populateWaitingDocument: function(doc){
		console.log('Do something here?');
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
				this.docIds = [msg.doc._id];
				this.docs = [msg.docs];
			} else if( msg.docId ) {
				this.docIds = [msg.docId];
				this.docs = null;
			} else if( msg.docs ) {
				this.docs = [msg.docs]
				this.docIds = msg.docs.map(function(doc) {
					return doc._id;
				})
			} else if( msg.docIds ) {
				this.docIds = msg.docIds;
				this.docs = null;
			};
			this._updateDisplay()
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
			console.log('editClose: no action?');
		} else if( msg.type === 'documentContentCreated' ) {
			console.log('documentContentCreated: Do nothing here?');
		} else if( msg.type === 'documentContentUpdated' ) {
			this._refreshDocument(msg.doc);
			this._populateWaitingDocument(msg.doc);
		};
	}
	
	,_updateDisplay: function() {
		const len = this.docIds.length;
		const $container = this._getDisplayDiv();
		const $displayDiv = $container.find('.n2DisplayMultiEdit_display').empty();
		$displayDiv.empty();
		$displayDiv.append(`<div>${len}</div>`);
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
	if( m.displayType === 'multiEdit' ){
		m.isAvailable = true;
	};
};

function HandleDisplayRenderRequest(m){
	if( m.displayType === 'multiEdit' ){
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
		
		var displayControl = new DisplayMultiEdit(options);

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
	DisplayMultiEdit: DisplayMultiEdit
	,HandleDisplayAvailableRequest: HandleDisplayAvailableRequest
	,HandleDisplayRenderRequest: HandleDisplayRenderRequest
};

})(jQuery,nunaliit2);
