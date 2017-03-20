/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchEvents';

//==========================================================
/*
 * This is an abstract class. An instance of this class allows an atlas designer 
 * to change the default behaviour associated with user selections and focus. 
 * Because the logic of focus translation is closely related to pop-ups found in canvas,
 * this class also deals with modifying the default content found in pop-ups.
 * 
 * Since this is an abstract class, its default behaviour does nothing worth noticing:
 * - it translates the event 'userSelect' to 'selected'; and, 
 * - it translates the event 'userFocusOn' to 'focusOn'.
 * 
 * To take advantage of the logic provided by this class, an atlas designer should
 * subclass this class and re-implement the following methods:
 * - translateUserSelection (required)
 * - generatePopupHtmlFromDocuments (optional)
 *
 * To use this logic, an atlas designer should create a new instance of this class (really,
 * a subclass) within the configuration function in nunaliit_custom.js. The abstract logic
 * has the ability of installing itself in the right locations.
 */
var SelectionRedirector = $n2.Class('SelectionRedirector',{

	dispatchService: null,
	
	eventService: null,
	
	atlasDb: null,

	customService: null,

	showService: null,
	
	originalEventHandler: null,
	
	currentSelectionNumber: null,
	
	currentFocusNumber: null,
	
	popupMaxLines: null,

	/**
	 * If set, when a selection translation returns empty,
	 * then do not send an empty selection. Simply ignore.
	 */
	suppressEmptySelection: null,

	/**
	 * By default, if a selection translation returns empty, then
	 * focus event is not sent. If this is set, force the focus event.
	 */
	forceEmptyFocus: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,eventService: null
			,atlasDb: null
			,customService: null
			,showService: null
			,popupMaxLines: 12
			,suppressEmptySelection: false
			,forceEmptyFocus: false
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.eventService = opts.eventService;
		this.atlasDb = opts.atlasDb;
		this.customService = opts.customService;
		this.showService = opts.showService;
		this.popupMaxLines = opts.popupMaxLines;
		
		this.suppressEmptySelection = false;
		if( opts.suppressEmptySelection ){
			this.suppressEmptySelection = true;
		};
		
		this.forceEmptyFocus = false;
		if( opts.forceEmptyFocus ){
			this.forceEmptyFocus = true;
		};
		
		if( !this.dispatchService ){
			throw new Error('SelectionRedirector requires dispatchService');
		};
		if( !this.eventService ){
			throw new Error('SelectionRedirector requires eventService');
		};
		if( !this.atlasDb ){
			throw new Error('SelectionRedirector requires atlasDb');
		};
		
		// Keep track of current selection
		this.currentSelectionNumber = 0;
		this.currentFocusNumber = 0;
		
		// Install on event service
		this.originalEventHandler = this.eventService.getHandler();
		this.eventService.register('userSelect');
		this.eventService.register('userFocusOn');
		this.eventService.setHandler(function(m, addr, dispatcher){
			_this._handleEvent(m, addr, dispatcher);
		});
		
		// Install map pop-up replacement
		if( this.customService && this.showService ){
			this.customService.setOption('mapFeaturePopupCallback', function(opts_){
				_this._handleMapFeaturePopup(opts_);
			});
		};
	},
	
	_retrieveDocuments: function(opts_){
		var opts = $n2.extend({
			docId: null
			,docIds: null
			,doc: null
			,docs: null
			,onSuccess: function(docs){}
			,onError: function(err){}
		}, opts_);
		
		var _this = this;
		
		if( opts.doc ){
			opts.onSuccess([opts.doc]);

		} else if( opts.docs ){
			opts.onSuccess( opts.docs );

		} else if( opts.docId ){
			retrieveDocumentFromIds([opts.docId]);

		} else if( opts.docIds ){
			retrieveDocumentFromIds(opts.docIds);
		};
		
		function retrieveDocumentFromIds(docIds){
			// Look up cache
			var docs = [];
			var missingDocIds = [];
			docIds.forEach(function(docId){
				var doc = undefined;
				
				if( _this.dispatchService ){
					var m = {
						type: 'cacheRetrieveDocument'
						,docId: docId
					};
					_this.dispatchService.synchronousCall(DH,m);
					doc = m.doc;
				};
				
				if( doc ){
					docs.push(doc);
				} else {
					missingDocIds.push(docId);
				};
			});

			if( missingDocIds.length < 1 ){
				// Got everything from cache
				opts.onSuccess(docs);
			} else {
				// Need to get documents from database
				_this.atlasDb.getDocuments({
					docIds: missingDocIds
					,onSuccess: function(missingDocs){
						missingDocs.forEach(function(doc){
							docs.push(doc);
						});
						opts.onSuccess(docs);
					}
					,onError: function(errorMsg){
						opts.onError(errorMsg);
					}
				});
			};
		};
	},
	
	_handleUserSelect: function(m, addr, dispatcher, selectionNumber){
		var _this = this;

		this._getDocumentsFromSelectedDocument({
			docId: m.docId
			,docIds: m.docIds
			,doc: m.doc
			,docs: m.docs
			,isSelect: true
			,onSuccess: function(selectedDocs, supplementDocIds){
				if( selectionNumber === _this.currentSelectionNumber ){
					var msg = {};
					
					// Copy attributes from original message
					for(var name in m){
						var value = m[name];
						msg[name] = value;
					};
					
					if( selectedDocs.length > 1 ){
						delete msg.docId;
						delete msg.docIds;
						delete msg.doc;
						delete msg.docs;

						msg.type = 'selected';
						msg.docIds = [];
						msg.docs = [];
						for(var i=0,e=selectedDocs.length; i<e; ++i){
							var doc = selectedDocs[i];
							msg.docs.push(doc);
							msg.docIds.push(doc._id);
						};
						_this.dispatchService.send(DH,msg);

					} else if ( selectedDocs.length > 0 ){
						delete msg.docId;
						delete msg.docIds;
						delete msg.doc;
						delete msg.docs;

						msg.type = 'selected';
						msg.doc = selectedDocs[0];
						msg.docId = selectedDocs[0]._id;
						_this.dispatchService.send(DH,msg);

					} else {
						// At this point, no document was found associated with
						// the initial selection. By default, simply continue with 
						// selection.
						if( _this.suppressEmptySelection ){
							// ignore
						} else {
							msg.type = 'selected';
							_this.dispatchService.send(DH,msg);
						};
					};
					
					if( supplementDocIds && selectedDocs.length > 0 ){
						supplementDocIds.forEach(function(supplementDocId){
							_this.dispatchService.send(DH,{
								type: 'selectedSupplement'
								,docId: supplementDocId
								,origin: selectedDocs[0]._id
							});
						});
					};
				};
			}
			,onError: function(err){
				// On error, perform default behaviour
				if( selectionNumber === _this.currentSelectionNumber ){
					this._performOriginalHandler(m, addr, dispatcher);
				};
			}
		});
	},
	
	_handleUserFocus: function(m, addr, dispatcher, focusNumber){
		var _this = this;

		this._getDocumentsFromSelectedDocument({
			docId: m.docId
			,docIds: m.docIds
			,doc: m.doc
			,docs: m.docs
			,isFocus: true
			,onSuccess: function(selectedDocs, supplementDocIds){
				if( focusNumber === _this.currentFocusNumber ){
					var msg = {};
					
					// Copy attributes from original message
					for(var name in m){
						var value = m[name];
						msg[name] = value;
					};

					if( selectedDocs.length > 1 ){
						delete msg.docId;
						delete msg.docIds;
						delete msg.doc;
						delete msg.docs;

						msg.type = 'focusOn';
						msg.docIds = [];
						msg.docs = [];
						for(var i=0,e=selectedDocs.length; i<e; ++i){
							var doc = selectedDocs[i];
							msg.docs.push(doc);
							msg.docIds.push(doc._id);
						};
						_this.dispatchService.send(DH,msg);

					} else if ( selectedDocs.length > 0 ){
						delete msg.docId;
						delete msg.docIds;
						delete msg.doc;
						delete msg.docs;

						msg.type = 'focusOn';
						msg.doc = selectedDocs[0];
						msg.docId = selectedDocs[0]._id;
						_this.dispatchService.send(DH,msg);

					} else {
						// At this point, no document was found associated
						// with the focus. By default, ignore.
						if( _this.forceEmptyFocus ){
							msg.type = 'focusOn';
							_this.dispatchService.send(DH,msg);
						};
					};
					
					if( supplementDocIds && selectedDocs.length > 0 ){
						supplementDocIds.forEach(function(supplementDocId){
							_this.dispatchService.send(DH,{
								type: 'focusOnSupplement'
								,docId: supplementDocId
								,origin: selectedDocs[0]._id
							});
						});
					};
				};
			}
			,onError: function(err){
				// On error, perform default behaviour
				if( focusNumber === _this.currentFocusNumber ){
					this._performOriginalHandler(m, addr, dispatcher);
				};
			}
		});
	},
	
	_getDocumentsFromSelectedDocument: function(opts_){
		var opts = $n2.extend({
			docId: null
			,docIds: null
			,doc: null
			,docs: null
			,isSelect: false
			,isFocus: false
			,onSuccess: function(selectedDocs, supplementDocids){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		this._retrieveDocuments({
			docId: opts.docId
			,docIds: opts.docIds
			,doc: opts.doc
			,docs: opts.docs
			,onSuccess: function(docs){
				
				_this.translateUserSelection({
					docs: docs
					,isSelect: opts.isSelect
					,isFocus: opts.isFocus
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			}
			,onError: function(err){
				// On error, continue with original selection
				$n2.log('Error while retrieving selected documents',err);
				opts.onError(err);
			}
		});
	},

	/*
	 * This is the work horse of the class. It defines the translation of selecting
	 * a document into another one.
	 * 
	 * Basically, this methods accepts a number of documents (full document contents)
	 * and must return a number of documents that should be selected instead of the
	 * ones given in argument. Optionally, a number of supplemental document identifiers
	 * can be provided in the results.
	 * 
	 * Supplemental selection/focus are useful to colour elements in a canvas to draw attention
	 * to it given a selection.
	 * 
	 * For example, if an atlas is built in such a way that a geometry is drawn on a map
	 * representing a place, but a number of names are associated with that geometry. In that
	 * atlas, when the geometry is clicked, the atlas designer wants the associated name
	 * documents to be selected. Also, when a name document is selected, the associated map
	 * geometry is highlighted. In this example, this method should:
	 * 1. when presented with a geometry document, return a list of name documents
	 * 2. when presented with a name document, return the name document and a list of
	 *    supplemental document identifiers that represent the geometries
	 */
	translateUserSelection: function(opts_){
		var opts = $n2.extend({
			docs: null
			,isSelect: false
			,isFocus: false
			,onSuccess: function(selectedDocs, supplementDocids){}
			,onError: function(err){}
		},opts_);

		// Default behaviour is to perform no translation
		opts.onSuccess(opts.docs,[]);
	},
	
	_handleEvent: function(m, addr, dispatcher){
		var eventHandled = false;
		
		if( 'userSelect' === m.type ){
			this.currentSelectionNumber = this.currentSelectionNumber + 1;
			this._handleUserSelect(m, addr, dispatcher, this.currentSelectionNumber);
			eventHandled = true;

		} else if( 'userFocusOn' === m.type ){
			this.currentFocusNumber = this.currentFocusNumber + 1;
			this._handleUserFocus(m, addr, dispatcher, this.currentFocusNumber);
			eventHandled = true;
		};
		
		if( !eventHandled ){
			this._performOriginalHandler(m, addr, dispatcher);
		};
	},
	
	_performOriginalHandler: function(m, addr, dispatcher){
		this.originalEventHandler(m, addr, dispatcher);
	},
	
	_handleMapFeaturePopup: function(opts_){
		var opts = $n2.extend({
			feature: null
			,layerInfo: null
			,onSuccess: function(html){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var feature = opts.feature;
		
		var selectedDocs = [];
		
		if( feature.cluster ){
			feature.cluster.forEach(function(cf){
				var doc = cf.data;
				if( doc ){
					selectedDocs.push(doc);
				};
			});
		} else {
			var doc = feature.data;
			if( doc ){
				selectedDocs.push(doc);
			};
		};

		this._getDocumentsFromSelectedDocument({
			docs: selectedDocs
			,onSuccess: function(selectedDocs, supplementDocids){
				if( selectedDocs.length > 0 ) {
					showDocs(selectedDocs);
				} else {
					// display the geometry
					showDefault();
				};
			}
			,onError: showDefault // ignore errors
		});

		function showDefault(){
			var $div = $('<div></div>');
			var doc = feature.data;
			_this.showService.displayBriefDescription($div,{},doc);
			var html = $div.html();
			opts.onSuccess(html);
		};
		
		function showDocs(docs){
			var html = _this.generatePopupHtmlFromDocuments(docs);
			opts.onSuccess(html);
		};
	},
	
	generatePopupHtmlFromDocuments: function(docs){
		var _this = this;

		// Now that everything is categorized, print popup
		var maxLines = this.popupMaxLines;
		var $div = $('<div>');

		// Count lines that will be printed
		var numLines = docs.length;
		var numLinesNotPrinted = 0;
		if( numLines > maxLines ){
			--maxLines;
			numLinesNotPrinted = numLines - maxLines;
		};
		
		// Print briefs
		docs.forEach(function(doc){
			if( maxLines > 0 ){
				--maxLines;
				
				var $line = $('<div>')
					.addClass('n2redirect_popup_line n2redirect_popup_doc')
					.appendTo($div);
				_this.showService.displayBriefDescription($line,{},doc);
			};
		});
		
		// Print number of lines not printed
		if( numLinesNotPrinted > 0 ){
			var $line = $('<div>')
				.addClass('n2redirect_popup_line n2redirect_popup_overflow')
				.text( _loc('More lines... ({num})',{num:numLinesNotPrinted}) )
				.appendTo($div);
		};
		
		var html = $div.html();
		return html;
	}
});

//==========================================================
var EventSupport = $n2.Class('EventSupport',{
	options: null

	,dispatchCallback: null
	
	,handler: null
	
	,registeredEvents: null
	
	,initialize: function(opts_){
		this.options = $n2.extend({
			directory: null
		},opts_);
		
		var _this = this;
	
		this.registeredEvents = {};
		
		this.handler = function(m, addr, dispatcher){
			_this._defaultHandler(m, addr, dispatcher);
		};
		
		this.dispatchCallback = function(m, addr, dispatcher){
			_this.handler(m, addr, dispatcher);
		};
		
		this.register('userSelect');
		this.register('userUnselect');
		this.register('userFocusOn');
		this.register('userFocusOff');
	}

	,register: function(type){
		if( !this.registeredEvents[type] ) {
			var d = this._getDispatcher();
			if( d ){
				d.register(DH,type,this.dispatchCallback);
			};
			this.registeredEvents[type] = true;
		};
	}
	
	,setHandler: function(handler){
		if( typeof(handler) === 'function' ){
			this.handler = handler;
		};
	}
	
	,getHandler: function(){
		return this.handler;
	}
	
	,_getDispatcher: function(){
		var d = null;
		if( this.options.directory ){
			d = this.options.directory.dispatchService;
		};
		return d;
	}
	
	,_dispatch: function(m){
		var d = this._getDispatcher();
		if( d ){
			d.send(DH,m);
		};
	}

	,_defaultHandler: function(m, addr, dispatcher){
		if( 'userSelect' === m.type ) {
			var forwardAllowed = true;
			var d = this._getDispatcher();
			if( d ){
				var c = {
					type: 'historyIsHashChangePermitted'
					,permitted: true
				};
				d.synchronousCall(DH,c);
				
				if( !c.permitted ){
					forwardAllowed = false;
				};
			};
			
			if( forwardAllowed ){
				var forward = {
					type:'selected'
				};
				for(var key in m){
					if( 'type' === key ){
						forward.type = 'selected';
					} else {
						forward[key] = m[key];
					};
				};
				this._dispatch(forward);
			} else {
				this._dispatch({
					type:'userSelectCancelled'
				});
			};
			
		} else if( 'userUnselect' === m.type ) {
			var forward = {};
			for(var key in m){
				forward[key] = m[key];
			};
			forward.type = 'unselected';
			this._dispatch(forward);
			
		} else if( 'userFocusOn' === m.type ) {
			this._dispatch({
				type:'focusOn'
				,docId: m.docId
				,doc: m.doc
				,docIds: m.docIds
				,docs: m.docs
				,feature: m.feature
			});
			
		} else if( 'userFocusOff' === m.type ) {
			this._dispatch({
				type:'focusOff'
				,docId: m.docId
				,doc: m.doc
				,docIds: m.docIds
				,docs: m.docs
				,feature: m.feature
			});
		};
	}
});

//==========================================================
$n2.couchEvents = {
	EventSupport: EventSupport
	,SelectionRedirector: SelectionRedirector
};

})(nunaliit2);
