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
		
		,onSelect: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				container: null
				,idFn: function(d){ return d._id; }
				,textFn: null
				,onSelect: function(d){}
			},opts_);

			var _this = this;
			
			this.svgId = 'nunaliit_relationGraph_'+nextRelationId;
			++nextRelationId;
			
			this.idFn = opts.idFn;
			this.onSelect = opts.onSelect;
			
			this.textFn = opts.textFn;
			if( !this.textFn ){
				this.textFn = this.idFn;
			};
			
			var d3svg = d3.select(opts.container)
				.append('svg')
				.attr('id',this.svgId)
				.attr('width',300)
				.attr('height',300);
			
			var translator = d3svg.append('g')
				.attr('class','translator')
				.attr('transform','translate(150,150)');

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
					var r = 100;
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
				.attr('class',function(d){ return 'node_'+d.id; })
				.attr('cx',0)
				.attr('cy',0)
				.attr('r',25)
				.attr('stroke','#000000')
				.attr('stroke-width',1)
				.attr('fill',function(d){
					if( d.x===0 && d.y===0 ) {
						return '#ff0000';
					} else {
						return '#0000ff';
					}; 
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
					if( d.selected ) {
						return '#ff0000';
					} else {
						return '#0000ff';
					}; 
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
					var c = translator.select('circle.node_'+id);
					var res = 0;
					if( c && c.length ){
						res = c.attr('cx');
					};
					return res;
				})
				.attr('y1',function(d){
					var id = d.doc1.id;
					var c = translator.select('circle.node_'+id);
					var res = 0;
					if( c && c.length ){
						res = c.attr('cy');
					};
					return res;
				})
				.attr('x2',function(d){
					var id = d.doc2.id;
					var c = translator.select('circle.node_'+id);
					var res = 0;
					if( c && c.length ){
						res = c.attr('cx');
					};
					return res;
				})
				.attr('y2',function(d){
					var id = d.doc2.id;
					var c = translator.select('circle.node_'+id);
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
	function selectDocId(docId){
		currentDocId = docId;
		
		var selectedDoc = null;
		var linkedDocsById = {};
		
		atlasDb.getDocument({
			docId: docId
			,onSuccess: loadedDoc
			,onError: function(errorMsg){ 
				alert('Unable to retrieve document'); 
			}
		});
		
		function loadedDoc(doc){
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
		};
		
		function findForwardLinks(){
			var links = [];
			$n2.couchUtils.extractLinks(selectedDoc,links);
			var missingIdMap = {};
			for(var i=0,e=links.length;i<e;++i){
				var refId = links[i].doc;
				if( !linkedDocsById[refId] ){
					missingIdMap[refId] = true;
				};
			};
			var missingRefIds = [];
			for(var refId in missingIdMap){
				missingRefIds.push(refId);
			};
			if( missingRefIds.length ){
				atlasDb.getDocuments({
					docIds: missingRefIds
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
		
//		atlasDb.listAllDocuments({
//			onSuccess: function(docIds){
//				if( docIds && docIds.length ){
//					var index = Math.floor(Math.random() * docIds.length);
//					var docId = docIds[index];
//					selectDocId(docId);
//				};
//			}
//			,onError: function(errorMsg){
//				alert('Can not get list of documents');
//			}
//		});
		
//		$graphAppDiv
//			.empty()
//			.append( $('<div class="graphAppButtons"><div>') )
//			.append( $('<div class="graphAppCanvas"><div>') )
//			.append( $('<div class="graphAppViewer"><div>') )
//			;
//
//		$graphAppDiv.find('#graphAppCanvas').append( $('<svg xmlns="http://www.w3.org/2000/svg"></svg>') );
		
		log( _loc('Graph application started') );
	};

	
	$n2.graphApp = {
		main: main
	};
})(jQuery,nunaliit2);