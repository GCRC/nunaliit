;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var schemaRepository = null;
	var showService = null;
	var $graphAppDiv = null;
	var graphApp = null;
	
	// -----------------------------------------------------------------
	var nextRelationId = 0;
	var RelationGraph = $n2.Class({
		svgId: null

		,idFn: null

		,textFn: null
		
		,colourFn: null
		
		,onSelect: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				container: null
				,idFn: function(d){ return d._id; }
				,textFn: null
				,colourFn: function(d,node){
					if( node.selected ){
						return '#ff6666';
					};
					return '#6666ff';
				}
				,onSelect: function(d){}
			},opts_);

			var _this = this;
			
			this.svgId = 'nunaliit_relationGraph_'+nextRelationId;
			++nextRelationId;
			
			this.idFn = opts.idFn;
			this.colourFn = opts.colourFn;
			this.onSelect = opts.onSelect;
			
			this.textFn = opts.textFn;
			if( !this.textFn ){
				this.textFn = this.idFn;
			};
			
			var width = 600;
			var height = 600;
			
			var d3svg = d3.select(opts.container)
				.append('svg')
				.attr('id',this.svgId)
				.attr('width',width)
				.attr('height',height);
			
			var translator = d3svg.append('g')
				.attr('class','translator')
				.attr('transform','translate('+Math.floor(width/2)+','+Math.floor(height/2)+')');

			translator.append('g')
				.attr('class','lines');

			translator.append('g')
				.attr('class','circles');
			
			translator.append('g')
				.attr('class','labels');
		}

		// mainDoc is the document selected
		// linkedDocs is an array of related document
		// document has the following syntax:
		// - id : unique identifier
		// 
		,update: function(mainDoc, linkedDocs){
			var _this = this;
			
			var entries = [];
			var lineEntries = [];
			
			var mainEntry = {
				doc: mainDoc
				,id: this.idFn(mainDoc)
				,selected: true
				,x: 0
				,y: 0
			};
			entries.push(mainEntry);
			
			if( linkedDocs ) {
				for(var i=0,e=linkedDocs.length;i<e;++i){
					var linkedDoc = linkedDocs[i];

					// Document entries
					var r = 250;
					var a = 2 * Math.PI * i / linkedDocs.length;
					var x = r * Math.sin(a);
					var y = r * Math.cos(a);
					docEntry = {
						doc: linkedDoc
						,id: this.idFn(linkedDoc)
						,x: x
						,y: y
					};
					entries.push(docEntry);
					
					// Line entries
					var lineEntry = {};
					if( this.idFn(mainDoc) < this.idFn(linkedDoc) ){
						lineEntry.doc1 = mainEntry;
						lineEntry.doc2 = docEntry;
					} else {
						lineEntry.doc1 = docEntry;
						lineEntry.doc2 = mainEntry;
					};
					lineEntry.id = lineEntry.doc1.id + '=' + lineEntry.doc2.id;
					lineEntries.push(lineEntry);
				};
			};
			
			var translator = d3.select('#'+this.svgId).select('.translator');
			
			// Circles
			var updateCircles = translator.select('.circles').selectAll('circle')
				.data(entries, function(d){
					return d.id;
				})
				;
			
			var enter = updateCircles.enter()
				.append('circle')
				.attr('class',function(d){ return 'node_'+$n2.utils.stringToHtmlId(d.id); })
				.attr('cx',0)
				.attr('cy',0)
				.attr('r',25)
				.attr('stroke','#000000')
				.attr('stroke-width',1)
				.attr('fill',function(d){
					return _this.colourFn(d.doc,d);
				})
				.on('click',function(){
					var d3Circle = d3.select(this);
					var data = d3Circle.data();
					if( data && data.length ){
						_this.onSelect(data[0].doc);
					};
				})
				;

			updateCircles.transition()
				.duration(750)
				.attr('cx',function(d){return d.x;})
				.attr('cy',function(d){return d.y;})
				.attr('fill',function(d){
					return _this.colourFn(d.doc,d);
				})
				;
		
			
			var exit = updateCircles.exit()
				.remove();
			
			// Labels
			var updateLabels = translator.select('.labels').selectAll('text')
				.data(entries, function(d){
					return d.id;
				})
				;
			
			var enterLabels = updateLabels.enter()
				.append('text')
				.attr('x',0)
				.attr('y',0)
				.text(function(d){ return _this.textFn(d.doc); })
				.attr('text-anchor','middle')
				.attr('pointer-events','none')
				;

			updateLabels.transition()
				.duration(750)
				.attr('x',function(d){return d.x;})
				.attr('y',function(d){return d.y;})
				;
			
			var exitLabels = updateLabels.exit()
				.remove();
			
			// Lines
			var updateLines = translator.select('.lines').selectAll('line')
				.data(lineEntries, function(d){
					return d.id;
				})
				;
			
			var enter = updateLines.enter()
				.append('line')
				.attr('x1',function(d){
					var id = d.doc1.id;
					var c = translator.select('circle.node_'+$n2.utils.stringToHtmlId(id));
					var res = 0;
					if( c && c.length ){
						res = c.attr('cx');
					};
					return res;
				})
				.attr('y1',function(d){
					var id = d.doc1.id;
					var c = translator.select('circle.node_'+$n2.utils.stringToHtmlId(id));
					var res = 0;
					if( c && c.length ){
						res = c.attr('cy');
					};
					return res;
				})
				.attr('x2',function(d){
					var id = d.doc2.id;
					var c = translator.select('circle.node_'+$n2.utils.stringToHtmlId(id));
					var res = 0;
					if( c && c.length ){
						res = c.attr('cx');
					};
					return res;
				})
				.attr('y2',function(d){
					var id = d.doc2.id;
					var c = translator.select('circle.node_'+$n2.utils.stringToHtmlId(id));
					var res = 0;
					if( c && c.length ){
						res = c.attr('cy');
					};
					return res;
				})
				.attr('stroke','#000000')
				.attr('stroke-width',1)
				;

			updateLines.transition()
				.duration(750)
				.attr('x1',function(d){return d.doc1.x;})
				.attr('y1',function(d){return d.doc1.y;})
				.attr('x2',function(d){return d.doc2.x;})
				.attr('y2',function(d){return d.doc2.y;})
				;
			
			var exit = updateLines.exit()
				.remove();
		}
	});

	// -----------------------------------------------------------------
	var currentDocId = null;
	var fakeLayerPrefix = '__layer__';
	function selectDocId(docId){
		$n2.log('Select: '+docId);
		currentDocId = docId;
		
		var selectedDoc = null;
		var linkedDocsById = {};
		var requestedDocsById = {};

		// If a document is a fake layer document, handle it
		// specially
		if( docId.substr(0,fakeLayerPrefix.length) === fakeLayerPrefix ){
			var layerName = docId.substr(fakeLayerPrefix.length);
			var doc = {
				_id: fakeLayerPrefix+layerName
				,name: layerName
				,nunaliit_type: '__fakeLayer__'
			};
			loadedDoc(doc);
			
		} else {
			// Fetch document
			atlasDb.getDocument({
				docId: docId
				,onSuccess: loadedDoc
				,onError: function(errorMsg){ 
					alert('Unable to retrieve document'); 
				}
			});
		};
		
		function loadedDoc(doc){
			$n2.log('Selected',doc);
			selectedDoc = doc;
			updateCanvas();
			
			atlasDesign.queryView({
				viewName: 'link-references'
				,startkey: doc._id
				,endkey: doc._id
				,include_docs: true
				,onSuccess: function(rows){
					for(var i=0,e=rows.length;i<e;++i){
						var linkedDoc = rows[i].doc;
						linkedDocsById[linkedDoc._id] = linkedDoc;
					};
					updateCanvas();
					findForwardLinks();
				}
				,onError: findForwardLinks
			});
			
			// Get schema document
			if( doc.nunaliit_schema ){
				atlasDesign.queryView({
					viewName: 'schemas'
					,startkey: doc.nunaliit_schema
					,endkey: doc.nunaliit_schema
					,include_docs: true
					,onSuccess: function(rows){
						for(var i=0,e=rows.length;i<e;++i){
							var linkedDoc = rows[i].doc;
							linkedDocsById[linkedDoc._id] = linkedDoc;
						};
						updateCanvas();
					}
					,onError: function(){}
				});
			};
			
			// If a schema document, find all documents associated with schema
			if( doc.nunaliit_type === 'schema' && doc.name ){
				atlasDesign.queryView({
					viewName: 'nunaliit-schema'
					,startkey: doc.name
					,endkey: doc.name
					,include_docs: true
					,onSuccess: function(rows){
						for(var i=0,e=rows.length;i<e;++i){
							var linkedDoc = rows[i].doc;
							linkedDocsById[linkedDoc._id] = linkedDoc;
						};
						updateCanvas();
					}
					,onError: function(){}
				});
			};
			
			// If a document contains layers, report them
			if( doc.nunaliit_layers ){
				for(var i=0,e=doc.nunaliit_layers.length;i<e;++i){
					// Create a fake document to report layer
					var layerName = doc.nunaliit_layers[i];
					var doc = {
						_id: fakeLayerPrefix+layerName
						,name: layerName
						,nunaliit_type: '__fakeLayer__'
					};
					linkedDocsById[doc._id] = doc;
				};
				updateCanvas();
			};
			
			// If a document is representing a layer, then fetch all
			// documents associated with layer
			if( doc.nunaliit_type === '__fakeLayer__' ){
				atlasDesign.queryView({
					viewName: 'layers'
					,startkey: doc.name
					,endkey: doc.name
					,include_docs: true
					,onSuccess: function(rows){
						for(var i=0,e=rows.length;i<e;++i){
							var linkedDoc = rows[i].doc;
							linkedDocsById[linkedDoc._id] = linkedDoc;
						};
						updateCanvas();
					}
					,onError: function(){}
				});
			};
		};
		
		function findForwardLinks(){
			var links = [];
			$n2.couchUtils.extractLinks(selectedDoc,links);
			var docIds = [];
			for(var i=0,e=links.length;i<e;++i){
				var refId = links[i].doc;
				docIds.push(refId);
			};
			requestDocumentsById(docIds);
		};
		
		function requestDocumentsById(docIds){
			var idsToRequest = [];
			if( docIds ) {
				for(var i=0,e=docIds.length;i<e;++i){
					var docId = docIds[i];
					if( !requestedDocsById[docId] 
					 && !linkedDocsById[docId] ){
						idsToRequest.push(docId);
						requestedDocsById[docId] = true;
					};
				};
			};
			
			if( idsToRequest.length ){
				atlasDb.getDocuments({
					docIds: idsToRequest
					,onSuccess: function(docs){
						for(var i=0,e=docs.length;i<e;++i){
							var linkedDoc = docs[i];
							linkedDocsById[linkedDoc._id] = linkedDoc;
						};
						updateCanvas();
					}
					,onError: function(){}
				});
			};
		};
		
		function updateCanvas(){
			if( docId !== currentDocId ) return;
			
			var linkedDocs = [];
			for(var id in linkedDocsById){
				linkedDocs.push( linkedDocsById[id] );
			};
			
			graphApp.update(selectedDoc,linkedDocs);
		};
	};
	
	// -----------------------------------------------------------------
	function main(opts_) {
		var opts = $n2.extend({
			config: null
			,title: null
			,div: null
		},opts_);
		
		$n2.log('Graph App Options',opts);

		config = opts_.config;
		atlasDb = opts_.config.atlasDb;
		atlasDesign = opts_.config.atlasDesign;
		serverDesign = opts_.config.serverDesign;
		schemaRepository = opts_.config.directory.schemaRepository;
		
		if( config.directory ){
			showService = config.directory.showService;
		};
		
		$graphAppDiv = $(opts.div);
		
		if( opts.title ) {
			$(opts.title).text( _loc('Nunaliit Graph') );
		};
		
		graphApp = new RelationGraph({
			container: $graphAppDiv[0]
			,idFn: function(d){ return d._id; }
			,textFn: function(d){ return d._id; }
			,colourFn: function(d){
				if( d.nunaliit_type === 'schema' ){
					return '#44ff44';
				} else if( d.nunaliit_type === '__fakeLayer__' ){
					return '#ffff44';
				};
				return '#6666ff';
			}
			,onSelect: function(d){ selectDocId(d._id); }
		});
		
		atlasDesign.queryView({
			viewName: 'link-references'
			,onSuccess: function(rows){
				var index = Math.floor(Math.random() * rows.length);
				var docId = rows[index].id;
				selectDocId(docId);
			}
			,onError: function(err){
				alert('Unable to retrieve a referenced document');
			}
		});
		
		log( _loc('Graph application started') );
	};

	
	$n2.graphApp = {
		main: main
	};
})(jQuery,nunaliit2);