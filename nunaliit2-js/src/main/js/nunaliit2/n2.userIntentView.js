/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($n2) {
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.userIntentView';

//--------------------------------------------------------------------------
/*
This class accepts nodes from a caller and manages the intent on those
nodes. Nodes should have the format:

{
	n2_id:              <string>         [input]
	,n2_selected:       <boolean>        [output]
	,n2_selectedIntent: <null or string> [output]
	,n2_hovered:        <boolean>        [output]
	,n2_hoveredIntent:  <null or string> [output]
	,n2_found:          <boolean>        [output]
	,n2_intent:         <null or string> [output]
}

*/
var IntentView = $n2.Class({
	dispatchService: null,
	
	listeners: null,

	hoverInfo: null,
	
	selectInfo: null,
	
	findInfo: null,
	
	nodesArrayById: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,suppressFindEvent: false
		}, opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		this.listeners = [];
		this.nodesArrayById = {};
		this.hoverInfo = null;
		this.selectInfo = null;
		this.findInfo = null;
		
		if( this.dispatchService ){
			var f = function(m){
				_this._handleDispatch(m);
			};
			
			this.dispatchService.register(DH,'selected',f);
			this.dispatchService.register(DH,'selectedSupplement',f);
			this.dispatchService.register(DH,'unselected',f);
			this.dispatchService.register(DH,'focusOn',f);
			this.dispatchService.register(DH,'focusOnSupplement',f);
			this.dispatchService.register(DH,'focusOff',f);
			this.dispatchService.register(DH,'searchInitiate',f);
			
			if( !opts.suppressFindEvent ){
				this.dispatchService.register(DH,'find',f);
			};
		};
	},
	
	/**
	 * Adds a function that should be called every time a monitored node
	 * is updated with new user intentions. The function should have the
	 * following signature:
	 * function(nodes){ // nodes that have been changed
	 *  ...
	 * }
	 */
	addListener: function(listener){
		this.listeners.push(listener);
	},
	
	/**
	 * This function adds nodes to be monitored for changes in the user intention.
	 * When this function returns, each node is updated with the current intention
	 * flags (n2_selected, n2_hovered)
	 */
	addNodes: function(nodes){
		for(var i=0,e=nodes.length; i<e; ++i){
			var node = nodes[i];
			var id = node.n2_id;
			var nodesArray = this.nodesArrayById[id];
			if( !nodesArray ){
				nodesArray = [];
				this.nodesArrayById[id] = nodesArray;
			};
			if( nodesArray.indexOf(node) < 0 ){
				nodesArray.push(node);
			};
			
			this._adjustIntentOnNode(node);
		};
	},
	
	removeNodes: function(nodes){
		for(var i=0,e=nodes.length; i<e; ++i){
			var node = nodes[i];
			var id = node.n2_id;
			var nodesArray = this.nodesArrayById[id];
			if( nodesArray ){
				var index = nodesArray.indexOf(node);
				if( index >= 0 ){
					if( nodesArray.length < 2 ){
						delete this.nodesArrayById[id];
					} else {
						this.nodesArrayById[id].splice(index, 1);
					};
				};
			};
		};
	},
	
	_adjustIntentOnNode: function(node){
		var changed = false;
		
		var docId = node.n2_id;
		
		// Selection
		var selected = false;
		var selectedIntent = null;
		if( this.selectInfo && this.selectInfo.docIds ){
			var intent = this.selectInfo.docIds[docId];
			if( intent ){
				selected = true;
				if( typeof intent === 'string' ){
					selectedIntent = intent;
				};
			};
		};
		if( node.n2_selected !== selected ){
			node.n2_selected = selected;
			changed = true;
		};
		if( node.n2_selectedIntent !== selectedIntent ){
			node.n2_selectedIntent = selectedIntent;
			changed = true;
		};

		// Focus
		var focus = false;
		var hoveredIntent = null;
		if( this.hoverInfo && this.hoverInfo.docIds ){
			var intent = this.hoverInfo.docIds[docId];
			if( intent ){
				focus = true;
				if( typeof intent === 'string' ){
					hoveredIntent = intent;
				};
			};
		};
		if( node.n2_hovered !== focus ){
			node.n2_hovered = focus;
			changed = true;
		};
		if( node.n2_hoveredIntent !== hoveredIntent ){
			node.n2_hoveredIntent = hoveredIntent;
			changed = true;
		};
		
		// Find on map
		var find = false;
		if( this.findInfo ){
			var intent = this.findInfo[docId];
			if( intent ){
				find = true;
			};
		};
		if( node.n2_found !== find ){
			node.n2_found = find;
			changed = true;
		};
		
		// Compute intent
		var effectiveIntent = hoveredIntent;
		if( !effectiveIntent ){
			effectiveIntent = selectedIntent;
		};
		if( node.n2_intent !== effectiveIntent ){
			node.n2_intent = effectiveIntent;
			changed = true;
		};
		
		return changed;
	},
	
	_performUnselect: function(changedArray){
		var docIds = {};

		if( this.selectInfo 
		 && this.selectInfo.docIds ) {
			for(var selectedDocId in this.selectInfo.docIds){
				docIds[selectedDocId] = true;
			};
		};

		if( this.findInfo ) {
			for(var selectedDocId in this.findInfo){
				docIds[selectedDocId] = true;
			};
		};

		// needed for _adjustIntentOnNode()
		this.selectInfo = null;
		this.findInfo = null;
		
		for(var selectedDocId in docIds){
			var nodesArray = this.nodesArrayById[selectedDocId];
			if( nodesArray ){
				for(var j=0,k=nodesArray.length; j<k; ++j){
					var n = nodesArray[j];
					if( this._adjustIntentOnNode(n) ){
						changedArray.push(n);
					};
				};
			};
		};
	},

	_performFocusOff: function(changedArray){
		if( this.hoverInfo 
		 && this.hoverInfo.docIds ) {
			var docIds = this.hoverInfo.docIds;
			this.hoverInfo = null; // needed for _adjustIntentOnNode()
			
			for(var focusDocId in docIds){
				var nodesArray = this.nodesArrayById[focusDocId];
				if( nodesArray ){
					for(var j=0,k=nodesArray.length; j<k; ++j){
						var n = nodesArray[j];
						if( this._adjustIntentOnNode(n) ){
							changedArray.push(n);
						};
					};
				};
			};
		};
		
		this.hoverInfo = null;
	},

	_handleSelect: function(docIds){
		var changed = [];

		// New selection, unselect previous
		this._performUnselect(changed);

		// Create new selection
		this.selectInfo = {
			docIds: {}
		};
		for(var i=0,e=docIds.length; i<e; ++i){
			var docId = docIds[i];
			this.selectInfo.docIds[docId] = true;

			// Adjust selected nodes
			var nodesArray = this.nodesArrayById[docId];
			if( nodesArray ){
				for(var j=0,k=nodesArray.length; j<k; ++j){
					var n = nodesArray[j];
					if( this._adjustIntentOnNode(n) ){
						changed.push(n);
					};
				};
			};
		};
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleSelectSupplement: function(docId, intent){
		var changed = [];

		// Update current selection
		if( this.selectInfo && this.selectInfo.docIds ){
			if( intent ){
				this.selectInfo.docIds[docId] = intent;
			} else {
				this.selectInfo.docIds[docId] = true;
			};

			// Adjust selected nodes
			var nodesArray = this.nodesArrayById[docId];
			if( nodesArray ){
				for(var j=0,k=nodesArray.length; j<k; ++j){
					var n = nodesArray[j];
					if( this._adjustIntentOnNode(n) ){
						changed.push(n);
					};
				};
			};
		};
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleUnselect: function(){
		var changed = [];

		this._performUnselect(changed);

		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleFind: function(docId){
		var changed = [];

		var previousNodes = [];
		if( this.findInfo ){
			for(var foundDocId in this.findInfo){
				var nodesArray = this.nodesArrayById[foundDocId];
				
				// Append all to previous nodes
				previousNodes.push.apply(previousNodes, nodesArray);
			};
		};
		
		// Create new find on map
		this.findInfo = {};
		this.findInfo[docId] = true;

		// Adjust previous nodes
		for(var i=0,e=previousNodes.length; i<e; ++i){
			var n = previousNodes[i];
			if( this._adjustIntentOnNode(n) ){
				changed.push(n);
			};
		};
		
		// Adjust selected nodes
		var nodesArray = this.nodesArrayById[docId];
		if( nodesArray ){
			for(var j=0,k=nodesArray.length; j<k; ++j){
				var n = nodesArray[j];
				if( this._adjustIntentOnNode(n) ){
					changed.push(n);
				};
			};
		};
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleFocusOn: function(docId){
		var changed = [];

		// New selection, unselect previous
		this._performFocusOff(changed);

		// Create new focus
		this.hoverInfo = {
			docId: docId
			,docIds: {}
		};
		this.hoverInfo.docIds[docId] = true;
		
		// Adjust selected nodes
		var nodesArray = this.nodesArrayById[docId];
		if( nodesArray ){
			for(var j=0,k=nodesArray.length; j<k; ++j){
				var n = nodesArray[j];
				if( this._adjustIntentOnNode(n) ){
					changed.push(n);
				};
			};
		};
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleFocusOnSupplement: function(docId, intent){
		var changed = [];

		// Update current focus
		if( this.hoverInfo && this.hoverInfo.docIds ){
			if( intent ){
				this.hoverInfo.docIds[docId] = intent;
			} else {
				this.hoverInfo.docIds[docId] = true;
			};

			// Adjust selected nodes
			var nodesArray = this.nodesArrayById[docId];
			if( nodesArray ){
				for(var j=0,k=nodesArray.length; j<k; ++j){
					var n = nodesArray[j];
					if( this._adjustIntentOnNode(n) ){
						changed.push(n);
					};
				};
			};
		};
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleFocusOff: function(){
		var changed = [];

		this._performFocusOff(changed);

		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleDispatch: function(m){
		if( 'selected' === m.type ){
			if( m.docId ){
				var docId = m.docId;
				this._handleSelect([docId]);
			} else if( m.docIds ) {
				this._handleSelect(m.docIds);
			} else if( m.doc ){
				var docId = m.doc._id;
				this._handleSelect([docId]);
			} else if( m.docs ) {
				var docIds = [];
				for(var i=0,e=m.docs.length; i<e; ++i){
					var doc = m.docs[i];
					docIds.push(doc._id);
				};
				this._handleSelect(docIds);
			} else {
				$n2.log('UserIntentView unable to handle "selected" event',m);
			};

		} else if( 'selectedSupplement' === m.type ) {
			var docId = m.docId;
			var intent = m.intent;
			this._handleSelectSupplement(docId, intent);
			
		} else if( 'unselected' === m.type ){
			this._handleUnselect();
			
		} else if( 'focusOn' === m.type ){
			var docId = m.docId;
			this._handleFocusOn(docId);

		} else if( 'focusOnSupplement' === m.type ) {
			var docId = m.docId;
			var intent = m.intent;
			this._handleFocusOnSupplement(docId, intent);
			
		} else if( 'focusOff' === m.type ){
			this._handleFocusOff();
			
		} else if( 'searchInitiate' === m.type ){
			this._handleUnselect();

		} else if( 'find' === m.type ){
			var docId = m.docId;
			this._handleFind(docId);
		};
	},
	
	_reportChangedNodes: function(changedNodes){
		for(var i=0,e=this.listeners.length; i<e; ++i){
			var l = this.listeners[i];
			l(changedNodes);
		};
	}
});

//--------------------------------------------------------------------------
$n2.userIntentView = {
	IntentView: IntentView
};

})(nunaliit2);
