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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.userIntentView';

//--------------------------------------------------------------------------
/*
This class accepts nodes from a caller and manages the intent on those
nodes. Nodes should have the format:

{
	_id: <string>
	,_selected: <boolean>
	,_focus: <boolean>
}

*/
var IntentView = $n2.Class({
	dispatchService: null,
	
	listeners: null,

	focusInfo: null,
	
	selectInfo: null,
	
	nodesArrayById: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		}, opts_);

		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		this.listeners = [];
		this.nodesArrayById = {};
		
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
	 * flags (_selected, _focus)
	 */
	addNodes: function(nodes){
		for(var i=0,e=nodes.length; i<e; ++i){
			var node = nodes[i];
			var id = node._id;
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
			var id = node._id;
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
		
		var docId = node.getDocId();
		
		// Selection
		var selected = false;
		if( this.selectInfo && this.selectInfo.docIds ){
			if( this.selectInfo.docIds[docId] ){
				selected = true;
			};
		};
		if( node._selected !== selected ){
			node._selected = selected;
			changed = true;
		};

		// Focus
		var focus = false;
		if( this.focusInfo && this.focusInfo.docIds ){
			if( this.focusInfo.docIds[docId] ){
				focus = true;
			};
		};
		if( node._focus !== focus ){
			node._focus = focus;
			changed = true;
		};
		
		return changed;
	},
	
	_performUnselect: function(changedArray){
		if( this.selectInfo 
		 && this.selectInfo.docIds ) {
			var docIds = this.selectInfo.docIds;
			this.selectInfo = null; // needed for _adjustIntentOnNode()
			
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
		};
		
		this.selectInfo = null;
	},

	_performFocusOff: function(changedArray){
		if( this.focusInfo 
		 && this.focusInfo.docIds ) {
			var docIds = this.focusInfo.docIds;
			this.focusInfo = null; // needed for _adjustIntentOnNode()
			
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
		
		this.focusInfo = null;
	},

	_handleSelect: function(docId){
		var changed = [];

		// New selection, unselect previous
		this._performUnselect(changed);

		// Create new selection
		this.selectInfo = {
			docId: docId
			,docIds: {}
		};
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
		
		// Report to listener the nodes that were changed
		if( changed.length > 0 ){
			this._reportChangedNodes(changed);
		};
	},

	_handleSelectSupplement: function(docId){
		var changed = [];

		// Update current selection
		if( this.selectInfo && this.selectInfo.docIds ){
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

	_handleUnselect: function(){
		var changed = [];

		this._performUnselect(changed);

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
		this.focusInfo = {
			docId: docId
			,docIds: {}
		};
		this.focusInfo.docIds[docId] = true;
		
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

	_handleFocusOnSupplement: function(docId){
		var changed = [];

		// Update current focus
		if( this.focusInfo && this.focusInfo.docIds ){
			this.focusInfo.docIds[docId] = true;

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
			var docId = m.docId;
			this._handleSelect(docId);

		} else if( 'selectedSupplement' === m.type ) {
			var docId = m.docId;
			this._handleSelectSupplement(docId);
			
		} else if( 'unselected' === m.type ){
			this._handleUnselect();
			
		} else if( 'focusOn' === m.type ){
			var docId = m.docId;
			this._handleFocusOn(docId);

		} else if( 'focusOnSupplement' === m.type ) {
			var docId = m.docId;
			this._handleFocusOnSupplement(docId);
			
		} else if( 'focusOff' === m.type ){
			this._handleFocusOff();
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
