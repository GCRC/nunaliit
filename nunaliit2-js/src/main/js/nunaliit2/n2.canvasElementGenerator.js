/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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

;(function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.canvasElementGenerator'
;
 
// An instance of ElementGenerator is responsible of taking a set of documents
// from a data source and producing a set of graphic elements, based on those
// document, destined to a canvas.
//
// The instance of ElementGenerator is informed when the data set is changed and
// propagates those changes, in terms of elements, to the canvas. It is also
// responsible to keep track of user intents on the source documents, translate
// these intents in terms of elements and inform the canvas.
//
// In reverse, an instance of ElementGenerator is informed by the canvas when the
// clicks or hovers an element. Then, it translates these intents from elements
// to documents and informs the remainder of the system by sending the appropriate
// events through the dispatcher.
//
// The algorithm used by instances of ElementGenerator is to break up documents into
// fragments and then combine the fragments into clusters. Therefore, the elements
// provided to the canvas are generally clusters.
 
//--------------------------------------------------------------------------
// doc 1---1 context 1---N fragment N---N cluster
//
// doc
//   must have the following attributes:
//      _id
//
// context
//   must have the following attributes:
//      n2_id : document identifier for the supporting document
//      n2_doc : supporting document
//      fragments : list of fragments generated from supporting document
//
// fragment
//   must have the following attributes:
//      id : unique identifier for fragment
//      n2_id : document identifier for the supporting document
//      n2_doc : supporting document
//      context : context associated with supporting document
//      clusters : cluster map, by cluster id, for each cluster associated 
//                 with the fragment
//
// cluster
//   must have the following attributes:
//      id : unique identifier for cluster
//      fragments : map of fragments, by fragment id, making up cluster
var ElementGenerator = $n2.Class('ElementGenerator', {
	
	elementsChanged: null,
	
	intentChanged: null,
	
	contextByDocId: null,

	fragmentById: null,

	clusterById: null,
	
	dispatchService: null,
	
	userIntentView: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
			,elementsChanged: function(added, updated, removed){}
			,intentChanged: function(updated){}
		},opts_);
		
		var _this = this;
		
		this.elementsChanged = opts.elementsChanged;
		this.intentChanged = opts.intentChanged;
		
		this.contextByDocId = {};
		this.fragmentById = {};
		this.clusterById = {};
	
		this.dispatchService = opts.dispatchService;
		
		this.userIntentView = new $n2.userIntentView.IntentView({
			dispatchService: opts.dispatchService
		});
		this.userIntentView.addListener(function(changedNodes){
			_this._intentChangedContexts(changedNodes);
		});
	},
	
	setElementsChangedListener: function(listener){
		this.elementsChanged = listener;
	},
	
	setIntentChangedListener: function(listener){
		this.intentChanged = listener;
	},
	
	/*
	 * This function gets called when changes in the underlying documents
	 * are detected.
	 */
	sourceModelUpdated: function(opts_){
 		var opts = $n2.extend({
 			added: null
 			,updated: null
 			,removed: null
 		},opts_);
 		
 		//$n2.log('sourceModelUpdated',opts);

 		var contextsAdded = [];
 		var contextsUpdated = [];
 		var contextsRemoved = [];

 		if( opts.added ){
 			for(var i=0,e=opts.added.length; i<e; ++i){
 				var doc = opts.added[i];

 				var context = {
 					n2_id: doc._id
					,n2_doc: doc
					,fragments: []
 				};
 				contextsAdded.push(context);
 				
 				this.contextByDocId[doc._id] = context;
 			};
 		};

 		if( opts.updated ){
 			for(var i=0,e=opts.updated.length; i<e; ++i){
 				var doc = opts.updated[i];

 				var context = this.contextByDocId[doc._id];
 				if( context ){
					context.n2_doc = doc;
					contextsUpdated.push(context);
 					
 				} else {
 	 				var context = {
 	 					n2_id: doc._id
 						,n2_doc: doc
 						,fragments: []
 	 				};
 	 				contextsAdded.push(context);
 	 				
 	 				this.contextByDocId[doc._id] = context;
 				};
 			};
 		};

 		if( opts.removed ){
 			for(var i=0,e=opts.removed.length; i<e; ++i){
 				var doc = opts.removed[i];

 				var context = this.contextByDocId[doc._id];
 				if( context ){
 					delete this.contextByDocId[doc._id];
 					contextsRemoved.push(context);
 				};
 			};
 		};

 		// Before fragments and clusters are created, update contexts with user
 		// intent
		if( contextsRemoved 
		 && contextsRemoved.length ){
			this.userIntentView.removeNodes(contextsRemoved);
		};
		if( contextsAdded 
		 && contextsAdded.length ){
			this.userIntentView.addNodes(contextsAdded);
		};

 		if( contextsAdded.length > 0 
 		 || contextsUpdated.length > 0 
 		 || contextsRemoved.length > 0 ){
 			this._contextsUpdated(contextsAdded, contextsUpdated, contextsRemoved);
 		};
 		
	},

	/*
	 * This method is called by the canvas to indicate that an element (cluster)
	 * has been selected.
	 */
	selectOn: function(element){
		if( element ){
			var docsById = this._docsFromCluster(element);
			
			var docIds = [];
			var docs = [];
			for(var docId in docsById){
				var doc = docsById[docId];
				docIds.push(docId);
				docs.push(doc);
			};
			
			if( docIds.length == 1 ){
				this.dispatchService.send(DH,{
					type: 'userSelect'
					,docId: docIds[0]
					,doc: docs[0]
				});
			} else if( docIds.length > 1 ){
				this.dispatchService.send(DH,{
					type: 'userSelect'
					,docIds: docIds
					,docs: docs
				});
			};
		};
	},

	/*
	 * This method is called by the canvas to indicate that an element (cluster)
	 * has been unselected.
	 */
	selectOff: function(element){
		if( element ){
			var docsById = this._docsFromCluster(element);

			for(var docId in docsById){
				var doc = docsById[docId];
				this.dispatchService.send(DH,{
					type: 'userUnselect'
					,docId: docId
					,doc: doc
				});
			};
		};
	},

	/*
	 * This method is called by the canvas to indicate that an element (cluster)
	 * is hovered by the user (in focus).
	 */
	focusOn: function(element){
		if( element ){
			var docsById = this._docsFromCluster(element);
			
			var docIds = [];
			var docs = [];
			for(var docId in docsById){
				var doc = docsById[docId];
				docIds.push(docId);
				docs.push(doc);
			};
			
			if( docIds.length > 1 ){
				this.dispatchService.send(DH,{
					type: 'userFocusOn'
					,docIds: docIds
					,docs: docs
				});

			} else if( docIds.length > 0 ){
				this.dispatchService.send(DH,{
					type: 'userFocusOn'
					,docId: docIds[0]
					,doc: docs[0]
				});
			};
		};
	},

	/*
	 * This method is called by the canvas to indicate that an element (cluster)
	 * is no longer hovered by the user (out of focus).
	 */
	focusOff: function(element){
		if( element ){
			var docsById = this._docsFromCluster(element);

			for(var docId in docsById){
				var doc = docsById[docId];
				this.dispatchService.send(DH,{
					type: 'userFocusOff'
					,docId: docId
					,doc: doc
				});
			};
		};
	},
	
	/*
	 * This gets called as a result of changes in the underlying documents. It
	 * recomputes the fragments from the documents.
	 */
	_contextsUpdated: function(contextsAdded, contextsUpdated, contextsRemoved){

		var fragmentsAdded = [];
		//var fragmentsUpdated = [];
		var fragmentsRemoved = [];
		
		if( contextsAdded || contextsUpdated ){
			var addedAndUpdated = [];
			if( contextsAdded ){
				addedAndUpdated.push.apply(addedAndUpdated, contextsAdded);
			};
			if( contextsUpdated ){
				addedAndUpdated.push.apply(addedAndUpdated, contextsUpdated);
			};
			
 			for(var i=0,e=addedAndUpdated.length; i<e; ++i){
 				var context = addedAndUpdated[i];

 				var previousFragments = context.fragments;
 				
 				for(var fragIndex=0; fragIndex<previousFragments.length; ++fragIndex){
 					var frag = previousFragments[fragIndex];
 					fragmentsRemoved.push(frag);
 				};

 				context.fragments = this._createFragmentsFromDoc(context.n2_doc);
 				
 				for(var fragIndex=0; fragIndex<context.fragments.length; ++fragIndex){
 					var frag = context.fragments[fragIndex];
 					frag.context = context;
 					fragmentsAdded.push(frag);
 				};
 			};
 		};
 		
		if( contextsRemoved ){
 			for(var i=0,e=contextsRemoved.length; i<e; ++i){
 				var context = contextsRemoved[i];

 				var previousFragments = context.fragments;
 				
 				for(var fragIndex=0; fragIndex<previousFragments.length; ++fragIndex){
 					var frag = previousFragments[fragIndex];
 					fragmentsRemoved.push(frag);
 				};
 			};
		};

		for(var fragIndex=0; fragIndex<fragmentsRemoved.length; ++fragIndex){
			var frag = fragmentsRemoved[fragIndex];
			frag.context = null;
		};
		
		if( fragmentsAdded.length > 0 
		 || fragmentsRemoved.length > 0 ){
			this._fragmentsUpdated(fragmentsAdded, fragmentsRemoved);
		};
	},
	
	/*
	 * This method is used to create a set of fragments given a document. The default
	 * implementation is to create a node for each document and a link for each reference
	 * to other document.
	 * 
	 * This method should be re-implemented by sub-classes to establish other representations.
	 */
	_createFragmentsFromDoc: function(doc){
		var fragments = [];
		
		var node = {
			isNode: true
			,id: 'node_'+doc._id
			,n2_id: doc._id
			,n2_doc: doc
			,n2_geometry: 'point'
		};
		fragments.push(node);
		
 		// Create links for references
 		var refDocIds = {};
 		var references = [];
 		$n2.couchUtils.extractLinks(doc, references);
 		for(var i=0,e=references.length; i<e; ++i){
 			var ref = references[i];
 			if( ref.doc ){
 				refDocIds[ref.doc] = true;
 			};
 		};
 		for(var refDocId in refDocIds){
 			var link = {
 				isLink: true
 	 			,id: 'link_' + doc._id + '_' + refDocId
 	 			,n2_id: doc._id
 	 			,n2_doc: doc
 	 			,n2_geometry: 'line'
 			};
 			
 			var sourceId = doc._id;
 			var targetId = refDocId;
 			
 			if( sourceId < targetId ){
 				link.sourceId = sourceId;
 				link.targetId = targetId;
 			} else {
 				link.sourceId = targetId;
 				link.targetId = sourceId;
 			};
 			
 			link.linkId = link.sourceId + '|' + link.targetId;
 			
 			fragments.push(link);
 		};
 		
		return fragments;
	},
	
	/*
	 * This function is called when the set of fragments have changed. This is
	 * ultimately due because of changes in the underlying documents.
	 */
	_fragmentsUpdated: function(fragmentsAdded, fragmentsRemoved){
		
		// Update fragment map
		for(var fragIndex=0; fragIndex<fragmentsRemoved.length; ++fragIndex){
			var frag = fragmentsRemoved[fragIndex];
			var fragId = frag.id;
			frag.clusters = {};
			if( this.fragmentById[fragId] ){
				delete this.fragmentById[fragId];
			};
		};
		for(var fragIndex=0; fragIndex<fragmentsAdded.length; ++fragIndex){
			var frag = fragmentsAdded[fragIndex];
			var fragId = frag.id;
			this.fragmentById[fragId] = frag;
		};
		
		// Reset clusters on fragments
		for(var fragId in this.fragmentById){
			var frag = this.fragmentById[fragId];
			frag.clusters = {};
		};
		
		var clusters = this._createClusters(this.fragmentById);
		
		var newClusterMap = {};
		for(var clusterIndex=0; clusterIndex<clusters.length; ++clusterIndex){
			var cluster = clusters[clusterIndex];
			var clusterId = cluster.id;
			
			newClusterMap[clusterId] = cluster;
			
			for(var fragId in cluster.fragments){
				var frag = cluster.fragments[fragId];
				frag.clusters[clusterId] = cluster;
			};
		};
		
		var clustersAdded = [];
		var clustersUpdated = [];
		var clustersRemoved = [];
		
		for(var clusterId in this.clusterById){
			if( typeof newClusterMap[clusterId] === 'undefined' ){
				clustersRemoved.push( this.clusterById[clusterId] );
			};
		};
		
		for(var clusterId in newClusterMap){
			if( typeof this.clusterById[clusterId] === 'undefined' ){
				clustersAdded.push( newClusterMap[clusterId] );
			} else {
				clustersUpdated.push( newClusterMap[clusterId] );
			};
		};
		
		this.clusterById = newClusterMap;
		
		// Fix style information
		for(var clusterId in this.clusterById){
			var cluster = this.clusterById[clusterId];
			this._adjustClusterIntent(cluster);
		};
		
		//$n2.log('elementsChanged',clustersAdded, clustersUpdated, clustersRemoved);
		
		this.elementsChanged(clustersAdded, clustersUpdated, clustersRemoved);
	},
	
	/*
	 * This method takes a map of all fragments (fragments by identifier) and computes
	 * a set of clusters based on the fragments.
	 * 
	 * By default, it creates one cluster for each fragment node. It also creates a cluster
	 * for each link where the source and target are present.
	 * 
	 * Sub-classes should re-implement this method.
	 */
	_createClusters: function(fragmentMap){
		var clusters = [];
		
		var nodeMap = {};
		for(var fragId in fragmentMap){
			var frag = fragmentMap[fragId];
			
			if( frag.isNode ){
				var cluster = this.clusterById[frag.id];
				if( !cluster ){
					cluster = {
						id: fragId
					};
				};
				
				cluster.fragments = {};
				cluster.fragments[fragId] = frag;
				cluster.n2_id = frag.context.n2_id;
				cluster.n2_doc = frag.context.n2_doc;
				cluster.n2_geometry = 'point';
				cluster.isLink = frag.isLink;
				cluster.isNode = frag.isNode;
				
				clusters.push(cluster);
				
				nodeMap[frag.context.n2_id] = cluster;
			};
		};

		for(var fragId in fragmentMap){
			var frag = fragmentMap[fragId];
			
			if( frag.isLink 
			 && nodeMap[frag.sourceId] 
			 && nodeMap[frag.targetId] ){
				var clusterId = fragId;
				var cluster = this.clusterById[clusterId];
				if( !cluster ){
					cluster = {
						id: clusterId
					};
				};
				
				cluster.fragments = {};
				cluster.fragments[frag.id] = frag;
				cluster.n2_id = frag.context.n2_id;
				cluster.n2_doc = frag.context.n2_doc;
				cluster.n2_geometry = 'line';
				cluster.isLink = frag.isLink;
				cluster.isNode = frag.isNode;
				cluster.source = nodeMap[frag.sourceId];
				cluster.target = nodeMap[frag.targetId];

				clusters.push(cluster);
			};
		};

		return clusters;
	},
	
	/*
	 * Given a cluster, re-compute the cluster's state based on the supporting
	 * contexts. By default, this method marks a cluster selected if any of its
	 * fragment is selected. The same is true with the hovered state.
	 * 
	 * As far as intents are concerned, the intent of a fragment is copied to the
	 * cluster unles it collides with a different fragment, at which point the result
	 * is null.
	 * 
	 * Sub-classes should re-implement this method if a different behaviour is required.
	 */
	_adjustClusterIntent: function(cluster){
		cluster.n2_selected = false;
		cluster.n2_selectedIntent = undefined;
		cluster.n2_hovered = false;
		cluster.n2_hoveredIntent = undefined;
		cluster.n2_found = false;
		cluster.n2_intent = undefined;
		
		if( cluster.fragments ){
			for(var fragId in cluster.fragments){
				var fragment = cluster.fragments[fragId];
				var context = fragment.context;
				
				if( context ){
					if( context.n2_selected ){
						cluster.n2_selected = true;
					};
					if( context.n2_hovered ){
						cluster.n2_hovered = true;
					};
					if( context.n2_found ){
						cluster.n2_found = true;
					};
					if( context.n2_selectedIntent ){
						if( cluster.n2_selectedIntent === null ){
							// collision
						} else if( cluster.n2_selectedIntent === undefined ){
							cluster.n2_selectedIntent = context.n2_selectedIntent;
						} else {
							cluster.n2_selectedIntent = null;
						};
					};
					if( context.n2_hoveredIntent ){
						if( cluster.n2_hoveredIntent === null ){
							// collision
						} else if( cluster.n2_hoveredIntent === undefined ){
							cluster.n2_hoveredIntent = context.n2_hoveredIntent;
						} else {
							cluster.n2_hoveredIntent = null;
						};
					};
					if( context.n2_intent ){
						if( cluster.n2_intent === null ){
							// collision
						} else if( cluster.n2_intent === undefined ){
							cluster.n2_intent = context.n2_intent;
						} else {
							cluster.n2_intent = null;
						};
					};
				};
			};
		};
	},
	
	/*
	 * This method is called by the UserIntentView to notify changes
	 * in the user intent. The input array contains instances of context.
	 */
	_intentChangedContexts: function(changedContextNodes){
		// Accumulate all clusters from document contexts
		var changedClusterMap = {};
		for(var ci=0,ce=changedContextNodes.length; ci<ce; ++ci){
			var context = changedContextNodes[ci];
			for(var fi=0,fe=context.fragments.length; fi<fe; ++fi){
				var fragment = context.fragments[fi];
				if( fragment.clusters ){
					for(var clusterId in fragment.clusters){
						var cluster = fragment.clusters[clusterId];
						changedClusterMap[clusterId] = cluster;
					};
				};
			};
		};

		// Adjust all intentions on clusters
		var changedClusters = [];
		for(var clusterId in changedClusterMap){
			var cluster = changedClusterMap[clusterId];
			this._adjustClusterIntent(cluster);
			changedClusters.push(cluster);
		};
		
		// Report changes
		if( changedClusters.length ){
			this.intentChanged(changedClusters);
		};
	},
	
	/*
	 * This function returns a map all the documents, indexed by document identifier,
	 * associated with a cluster.
	 */
	_docsFromCluster: function(cluster_){
		var cluster = cluster_;
		if( typeof cluster === 'string' ){
			cluster = this.clusterById[cluster];
		};

		var docsById = {};
		if( cluster && cluster.fragments ){
			for(var fragId in cluster.fragments){
				var fragment = cluster.fragments[fragId];
				var context = fragment.context;

				var doc = null;
				if( context ){
					doc = context.n2_doc;
				};
				
				var docId = null;
				if( doc ){
					docId = doc._id;
				};

				if( docId ){
					docsById[docId] = doc;
				};
			};
		};
		
		return docsById;
	}
});

//--------------------------------------------------------------------------
var GroupLinks = $n2.Class('GroupLinks', ElementGenerator, {
	initialize: function(opts_){
		ElementGenerator.prototype.initialize.call(this, opts_);
	},
	
	_createClusters: function(fragmentMap){
		var clusters = [];
		
		var nodeMap = {};
		var fragMap = {};
		for(var fragId in fragmentMap){
			var frag = fragmentMap[fragId];
			
			if( frag.isNode ){
				var cluster = this.clusterById[frag.id];
				if( !cluster ){
					cluster = {
						id: fragId
					};
				};
				
				cluster.fragments = {};
				cluster.fragments[fragId] = frag;
				cluster.n2_id = frag.context.n2_id;
				cluster.n2_doc = frag.context.n2_doc;
				cluster.n2_geometry = 'point';
				cluster.isLink = frag.isLink;
				cluster.isNode = frag.isNode;
				
				clusters.push(cluster);
				
				nodeMap[frag.context.n2_id] = cluster;
				fragMap[frag.context.n2_id] = frag;
			};
		};

		var linkClustersById = {};
		for(var fragId in fragmentMap){
			var frag = fragmentMap[fragId];
			
			if( frag.isLink 
			 && nodeMap[frag.sourceId] 
			 && nodeMap[frag.targetId] ){
				var clusterId = 'link'+frag.sourceId+'|'+frag.targetId;
				var cluster = linkClustersById[clusterId];
				if( !cluster ){
					cluster = this.clusterById[clusterId];
					if( cluster ){
						clusters.push(cluster);
					};
				};
				if( !cluster ){
					cluster = {
						id: clusterId
						,count: 0
					};
					clusters.push(cluster);
				};
				linkClustersById[clusterId] = cluster;
				
				if( !cluster.fragments ){
					cluster.fragments = {};
				};
				
				cluster.fragments[frag.id] = frag;
				cluster.n2_id = frag.context.n2_id;
				cluster.n2_doc = frag.context.n2_doc;
				cluster.n2_geometry = 'line';
				cluster.isLink = frag.isLink;
				cluster.isNode = frag.isNode;
				cluster.count = cluster.count + 1;
				cluster.source = nodeMap[frag.sourceId];
				cluster.target = nodeMap[frag.targetId];
				
				// Associate the document node fragments with this cluster
				if( fragMap[frag.sourceId] ){
					var nodeFrag = fragMap[frag.sourceId]; 
					cluster.fragments[nodeFrag.id] = nodeFrag;
				};
				if( fragMap[frag.targetId] ){
					var nodeFrag = fragMap[frag.targetId]; 
					cluster.fragments[nodeFrag.id] = nodeFrag;
				};
			};
		};

		return clusters;
	}
});

//--------------------------------------------------------------------------
var elementGeneratorFactoriesByType = {};

function AddElementGeneratorFactory(opts_){
	var opts = $n2.extend({
		type: null
		,factoryFn: null
	},opts_);
	
	var type = opts.type;
	var factoryFn = opts.factoryFn;
	
	if( typeof type === 'string' 
	 && typeof factoryFn === 'function' ){
		elementGeneratorFactoriesByType[type] = factoryFn;
		
	} else {
		$n2.log('Unable to register ElementGenerator factory: '+opts.type);
	};
};

function CreateElementGenerator(opts_){
	var opts = $n2.extend({
		type: null
		,options: null
		,config: null
	},opts_);
	
	var type = opts.type;
	var options = opts.options;
	var config = opts.config;
	
	var elementGenerator = null;
	
	// Default
	if( 'default' === type 
	 && config 
	 && config.directory 
	 && config.directory.dispatchService ){
		elementGenerator = new ElementGenerator({
			dispatchService: config.directory.dispatchService
			,options: options
		});
	};
	
	// GroupLinks
	if( !elementGenerator 
	 && 'GroupLinks' === type 
	 && config 
	 && config.directory 
	 && config.directory.dispatchService ){
		elementGenerator = new GroupLinks({
			dispatchService: config.directory.dispatchService
			,options: options
		});
	};

	// Custom
	if( !elementGenerator 
	 && elementGeneratorFactoriesByType[type]
	 && config ){
		var factoryFn = elementGeneratorFactoriesByType[type];
		elementGenerator = factoryFn({
			type: type
			,options: options
			,config: config
		});
	};
	
	// Fallback on default
	if( !elementGenerator 
	 && config 
	 && config.directory 
	 && config.directory.dispatchService ){
		
		$n2.log('Type of ElementGenerator not recognized: '+type);
		
		elementGenerator = new ElementGenerator({
			dispatchService: config.directory.dispatchService
			,options: options
		});
	};
	
	return elementGenerator;
};

//--------------------------------------------------------------------------
$n2.canvasElementGenerator = {
	CreateElementGenerator: CreateElementGenerator
	,AddElementGeneratorFactory: AddElementGeneratorFactory
	,ElementGenerator: ElementGenerator
	,GroupLinks: GroupLinks
};

})(jQuery,nunaliit2);
