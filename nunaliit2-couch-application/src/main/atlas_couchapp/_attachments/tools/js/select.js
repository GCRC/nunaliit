;(function($,$n2){
"use strict";
	
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var g_scriptConfig = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var siteDesign = null;
	var schemaRepository = null;
	var showService = null;
	var exportService = null;
	var searchService = null;
	var couchEditor = null;
	var $selectAppDiv = null;
	var documentTransforms = [];
	var allLists = [];
	var selectedList = null;

	// **********************************************************************
	var DocumentList = $n2.Class({
		docIds: null,
		
		name: null,
		
		fromList: null,
		
		initialize: function(opts_){
			var opts = $n2.extend({
				docIds: null
				,name: _loc('Unknown List')
				,fromList: null
			},opts_);
			
			this.docIds = opts.docIds;
			this.fromList = opts.fromList;

			if( !this.docIds ){
				this.docIds = [];
			};
			
			this.docIds = [];
			var mapById = {};
			if( opts.docIds && opts.docIds.length ){
				for(var i=0,e=opts.docIds.length; i<e; ++i){
					var docId = opts.docIds[i];
					
					// Remove duplicates
					if( !mapById[docId] ){
						this.docIds.push(docId);
						mapById[docId]= true;
					};
				};
			};
			
			this.name = opts.name;
		},
	
		print: function(){
			var locStr = _loc('{count} document(s)',{
				count: this.docIds.length
			});

			var label = this.name + ' - ' + locStr;
			
			if( this.fromList ){
				label = label + ' (from:' + this.fromList.name + ')'; 
			};
			
			return label;
		}
	});

	// **********************************************************************
	var SearchFilter = $n2.Class({
		name: null
		
		,id: null
		
		,initialize: function(){
			this.id = $n2.getUniqueId();
			this.name = _loc('Unknown Filter');
		}
	
		,createList: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;
			
			if( typeof this._retrieveDocIds === 'function' ){
				// Create list by getting the document ids (generally faster)
				this._retrieveDocIds({
					options: opts.options
					,progressTitle: opts.progressTitle
					,onSuccess: function(docIds, listName){
						var l = new DocumentList({
							docIds: docIds
							,name: listName
						});
						opts.onSuccess(l);
					}
					,onError: opts.onError
				});
				
			} else if( typeof this._getFilterFunction === 'function' ) {
				// Create list by filtering all documents
				this._getFilterFunction({
					options: opts.options
					,onSuccess: function(filterFn, createName){
						if( !opts.name ) {
							opts.name = createName;
						};
						if( !opts.name ) {
							opts.name = _this.name;
						};
						_this._createListFilterAllDocs({
							filterFn: filterFn
							,name: opts.name
							,progressTitle: opts.progressTitle
							,onSuccess: opts.onSuccess
							,onError: opts.onError
						});
					}
					,onError: opts.onError
				});

			} else {
				opts.onError('Subclass must implement function _retrieveDocIds() or _getFilterFunction()');
			};
		}
		
		,refineList: function(opts_){
			var opts = $n2.extend({
				list: null
				,options: null
				,progressTitle: _loc('List Refinement Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;

			if( !opts.list ){
				opts.onError( _loc('A list must be provided for refining') );
				return;
			};
			
			if( typeof this._retrieveDocIds === 'function' ) {
				// Refine list by getting docIds and filtering the list based
				// on those
				this._retrieveDocIds({
					options: opts.options
					,progressTitle: opts.progressTitle
					,onSuccess: function(docIds, listName){
						var docIdMap = {};
						for(var i=0,e=docIds.length; i<e; ++i){
							docIdMap[docIds[i]] = true;
						};
						
						var newListIds = [];
						for(var i=0,e=opts.list.docIds.length; i<e; ++i){
							var docId = opts.list.docIds[i];
							if( docIdMap[docId] ){
								newListIds.push(docId);
							};
						};
						
						var l = new DocumentList({
							docIds: newListIds
							,name: listName
							,fromList: opts.list
						});

						opts.onSuccess(l);
					}
					,onError: opts.onError
				});

			} else if( typeof this._getFilterFunction === 'function' ) {
				this._getFilterFunction({
					options: opts.options
					,onSuccess: function(filterFn, listName){
						_this._createListFilterDocIds({
							filterFn: filterFn
							,name: listName
							,docIds: opts.list.docIds
							,fromList: opts.list
							,progressTitle: opts.progressTitle
							,onSuccess: opts.onSuccess
							,onError: opts.onError
						});
					}
					,onError: opts.onError
				});

			} else {
				opts.onError('Subclass must implement function _getFilterFunction() or _retrieveDocIds()');
			};
		}
		
		,_createListFilterAllDocs: function(opts_){
			var opts = $n2.extend({
				filterFn: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;
			var opCancelled = false;
			
			if( !opts.filterFn ) {
				opts.onError( _loc('A filter function must be supplied') );
				return;
			};

			var progressDialog = new $n2.couchDialogs.ProgressDialog({
				title: _loc('Fetching All Document Ids')
				,onCancelFn: function(){
					opCancelled = true;
				}
			});
			
			// Get all docIds
			atlasDb.listAllDocuments({
				onSuccess: receiveAllDocIds
				,onError: function(err){
					progressDialog.close();
					opts.onError(err);
				}
			});

			function receiveAllDocIds(allDocIds_) {
				if( opCancelled ){
					reportError( _loc('Operation cancelled by user') );
					progressDialog.close();
					return;
				};

				progressDialog.updatePercent(100);
				progressDialog.close();
				
				_this._createListFilterDocIds({
					filterFn: opts.filterFn
					,docIds: allDocIds_
					,progressTitle: opts.progressTitle
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			};
		}
		
		,_createListFilterDocIds: function(opts_){
			var opts = $n2.extend({
				filterFn: null
				,name: null
				,docIds: null
				,fromList: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			
			if( !opts.filterFn ) {
				opts.onError( _loc('A filter function must be supplied') );
				return;
			};
			if( !opts.docIds ) {
				opts.onError( _loc('Doc ids must be supplied when creating a list from document ids') );
				return;
			};
			
			var listName = opts.name;
			if( !listName ) {
				listName = this.name;
			};

			var opCancelled = false;
			var progressDialog = new $n2.couchDialogs.ProgressDialog({
				title: opts.progressTitle
				,onCancelFn: function(){
					opCancelled = true;
				}
			});
			
			var filteredDocIds = [];
			var allDocIds = [];
			for(var i=0,e=opts.docIds.length; i<e; ++i){
				allDocIds.push(opts.docIds[i]);
			};
			var fullCount = allDocIds.length;
			
			// Create a copy of the configuration so that user
			// can save temporary objects to it
			var my_scriptConfig = $n2.extend({},g_scriptConfig);
			
			// Fetch documents, filtering each
			nextFetch();
			
			function nextFetch(){
				if( opCancelled ) {
					cancel();
					return;
				};
				
				if( fullCount ) {
					var percent = (fullCount - allDocIds.length) * 100 / fullCount;
					progressDialog.updatePercent(percent);
				};
				
				// Fetch documents, a batch at a time
				var batchSize = 5;
				var fetchDocIds = [];
				while( allDocIds.length > 0 
				 && fetchDocIds.length < batchSize ){
					fetchDocIds.push( allDocIds.pop() );
				};
				
				if( fetchDocIds.length ) {
					atlasDb.getDocuments({
						docIds: fetchDocIds
						,skipCache: true
						,onSuccess: receiveDocs
						,onError: function(err){
							progressDialog.close();
							opts.onError( _loc('Unable to retrieve documents')+': '+err);
						}
					});
				} else {
					progressDialog.updatePercent(100);

					var effectiveListName = my_scriptConfig.listName;
					if( !effectiveListName ){
						effectiveListName = listName;
					};
					
					// List is complete
					var l = new DocumentList({
						docIds: filteredDocIds
						,name: effectiveListName
						,fromList: opts.fromList
					});
					opts.onSuccess(l);

					progressDialog.close();
				};
			};
			
			function receiveDocs(docs){
				if( opCancelled ) {
					cancel();
					return;
				};

				if( docs.length > 0 ){
					var doc = docs.shift();
					nextDoc(doc, docs);
				} else {
					nextFetch();
				};
			};
			
			function nextDoc(doc, docs){
				if( opCancelled ) {
					cancel();
					return;
				};

				// Adjust config
				var callbackExecuted = false;
				my_scriptConfig.continueOnExit = true;
				my_scriptConfig.includeDocument = function(shouldBeIncluded){
					if( callbackExecuted ) return; // ignore second call
					if( my_scriptConfig.continueOnExit ) return; // error
					
					resultOnDocument(doc, shouldBeIncluded, docs);
				};

				// Perform filter function
				var shouldBeIncluded = opts.filterFn(doc, my_scriptConfig);
				if( my_scriptConfig.continueOnExit ){
					resultOnDocument(doc, shouldBeIncluded, docs)
				};
			};
			
			function resultOnDocument(doc, shouldBeIncluded, docs){
				if( shouldBeIncluded ){
					filteredDocIds.push(doc._id);
				};
				receiveDocs(docs);
			};
			
			function cancel(){
				reportError( _loc('Operation cancelled by user') );
				progressDialog.close();
			};
		}
	});
	
	SearchFilter.availableSearchFilters = [];
	
	// Opens a dialog, selects a search filter from available ones, and create
	// a new list
	SearchFilter.createNewList = function(opts_){
		var opts = $n2.extend({
			onSuccess: function(list){}
			,onError: function(err){ alert('Unable to create a new list: '+err); }
		},opts_);
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'">'
			+'<select class="searchFilterSelector"></select>'
			+'<div class="searchFilterOptions"></div>'
			+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
			+'</div>');

		var $select = $dialog.find('select.searchFilterSelector');
		for(var i=0,e=SearchFilter.availableSearchFilters.length; i<e; ++i) {
			var searchFilter = SearchFilter.availableSearchFilters[i];
			var $o = $('<option></option>');
			$o.text(searchFilter.name);
			$o.attr('value',searchFilter.id);
			$select.append( $o );
		};
		$select.change(function(e){
			var $dialog = $('#'+dialogId);
			var $select = $dialog.find('select.searchFilterSelector');

			var id = $select.val();
			var sf = findSearchFilterFromId(id);
			
			var $options = $dialog.find('.searchFilterOptions');
			$options.empty();
			
			if( sf && typeof(sf.printOptions) === 'function' ) {
				sf.printOptions($options);
			};
		});
		
		$dialog.find('button')
			.first()
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					var $options = $dialog.find('.searchFilterOptions');
					var $select = $dialog.find('select.searchFilterSelector');
					var filterId = $select.val();
	
					$dialog.dialog('close');

					var useFilter = findSearchFilterFromId(filterId);
					if( useFilter ) {
						useFilter.createList({
							options: $options
							,onSuccess: opts.onSuccess
						});
					} else {
						alert( _loc('Unable to find search filter') );
					};
					
					return false;
				})
			.next()
				.button({icons:{primary:'ui-icon-cancel'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					$dialog.dialog('close');
					return false;
				})
			;
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select Search Filter')
			,modal: true
			,width: 400
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		function findSearchFilterFromId(id){
			for(var i=0,e=SearchFilter.availableSearchFilters.length; i<e; ++i) {
				var searchFilter = SearchFilter.availableSearchFilters[i];
				if( searchFilter.id === id ) {
					return searchFilter;
				};
			};
			return null;
		};
	};

	// Opens a dialog, selects a search filter from available ones, and refines
	// a given list
	SearchFilter.refineList = function(opts_){
		var opts = $n2.extend({
			list: null
			,onSuccess: function(list){}
			,onError: function(err){ alert( _loc('Unable to create a new list')+': '+err); }
		},opts_);
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'">'
			+'<div>'+_loc('Type of refinement')+': <select class="searchFilterSelector"></select></div>'
			+'<div class="searchFilterOptions"></div>'
			+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
			+'</div>');

		var $select = $dialog.find('select.searchFilterSelector');
		for(var i=0,e=SearchFilter.availableSearchFilters.length; i<e; ++i) {
			var searchFilter = SearchFilter.availableSearchFilters[i];
			var $o = $('<option></option>');
			$o.text(searchFilter.name);
			$o.attr('value',searchFilter.id);
			$select.append( $o );
		};
		$select.change(function(e){
			var $dialog = $('#'+dialogId);
			adjustOptions($dialog);
		});

		adjustOptions($dialog);
		
		$dialog.find('button')
			.first()
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					var $options = $dialog.find('.searchFilterOptions');
					var filterId = $dialog.find('select.searchFilterSelector').val();
					
					$dialog.dialog('close');

					var useFilter = findSearchFilterFromId(filterId);
					if( useFilter ) {
						useFilter.refineList({
							list: opts.list
							,options: $options
							,onSuccess: opts.onSuccess
							,onError: function(err){
								$n2.log('Error refining list: '+err);
							}
						});
					} else {
						alert( _loc('Unable to find document search filter') );
					};
					
					return false;
				})
			.next()
				.button({icons:{primary:'ui-icon-cancel'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					$dialog.dialog('close');
					return false;
				})
			;
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Refine List')+': '+opts.list.name
			,modal: true
			,width: 400
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);

		function adjustOptions($dialog){
			var $select = $dialog.find('select.searchFilterSelector');

			var id = $select.val();
			var sf = findSearchFilterFromId(id);
			
			var $options = $dialog.find('.searchFilterOptions');
			$options.empty();
			
			if( sf && typeof(sf.printOptions) === 'function' ) {
				sf.printOptions($options);
			};
		};
		
		function findSearchFilterFromId(id){
			for(var i=0,e=SearchFilter.availableSearchFilters.length; i<e; ++i) {
				var searchFilter = SearchFilter.availableSearchFilters[i];
				if( searchFilter.id === id ) {
					return searchFilter;
				};
			};
			return null;
		};
	};

	// **********************************************************************
	var SearchFilterAllDocs = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('All Documents');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDb.listAllDocuments({
				onSuccess: function(docIds){
					opts.onSuccess(docIds,_loc('All Documents'));
				}
				,onError: opts.onError
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterAllDocs());

	// **********************************************************************
	var SearchFilterSearchTerms = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Search Terms');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Search terms')+': <input type="text"/>'
				+'</div>');
			$parent.append( $options );
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);

			// Get search terms
			var $options = opts.options;
			var $input = $options.find('input');
			var searchTerms = $input.val();
			
			// Obtain docIds from search service
			searchService.submitRequest(searchTerms, {
				onlyFinalResults: true
				,strict: true
				,onSuccess: function(searchResults){
					var docIds = [];
					if( searchResults && searchResults.list ){
						for(var i=0,e=searchResults.list.length; i<e; ++i){
							var foundItem = searchResults.list[i];
							var docId = foundItem.id;
							docIds.push(docId);
						};
					};
					
					var name = _loc('All documents containing {searchTerm}',{
						searchTerm: searchTerms
					});

					opts.onSuccess(docIds,name);
				}
				,onError: reportError
			});
		}
	});
	
	SearchFilter.availableSearchFilters.push(new SearchFilterSearchTerms());

	// **********************************************************************
	var SearchFilterRegexSearch = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Regex Search');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Regex Expression')+': <input type="text"/>'
				+'</div>');
			$parent.append( $options );
		}
	
		,_getFilterFunction: function(opts_){
			var opts = $n2.extend({
				options: null
				,onSuccess: function(filterFn, creationName){}
				,onError: reportError
			},opts_);

			var $options = opts.options;
			var $input = $options.find('input');
			var searchTerm = $input.val();
			var regex = new RegExp(searchTerm, 'ig');

			var filterFn = function(doc){
				var result = false;
				iterateObjectLiteralFields(doc,function(value){
					if( typeof(value) === 'string' ) {
						if( value.match(regex) ) {
							result = true;
						};
					};
				});
				return result;
			};
			opts.onSuccess(filterFn, _loc('All documents matching regex {regex}',{
				regex: searchTerm
			}));
			
			return false;
		}
	});
	
	SearchFilter.availableSearchFilters.push(new SearchFilterRegexSearch());

	// **********************************************************************
	var SearchFilterJavascript = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select from Javascript');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Javascript')+':<br/><textarea></textarea>'
				+'</div>');
			
			$options.find('textarea').val('function(doc){\n'
					+'\t// return true for selected document\n'
					+'}');

			$parent.append( $options );
		}

		,_getFilterFunction: function(opts_){
			var opts = $n2.extend({
				options: null
				,onSuccess: function(filterFn, creationName){}
				,onError: reportError
			},opts_);
			
			var $options = opts.options;
			var script = $options.find('textarea').val();
			var scriptFn = null;

			// Create a copy of the configuration so that user
			// can save temporary objects to it
//			var my_scriptConfig = $n2.extend({},g_scriptConfig);
//			my_scriptConfig.includeDocument = function(shouldBeIncluded){};
			
			try {
				eval('scriptFn = '+script);
//				scriptFn({_id:'test',_revision:'1-abcde'},my_scriptConfig);
			} catch(e) {
				alert(_loc('Error')+': '+e);
				return;
			};
			if( typeof(scriptFn) !== 'function' ) {
				alert( _loc('You must enter a valid function') );
				return;
			};

			opts.onSuccess(scriptFn, _loc('All documents filtered by script') );
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterJavascript());

	// **********************************************************************
	var SearchFilterByGeomLayer = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select geometries from a layer');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Layer name')+':<br/><select class="layerNameList"></select>'
				+'</div>');
			
			$parent.append( $options );
			
			atlasDesign.queryView({
				viewName: 'layers'
				,reduce: true
				,group: true
				,onSuccess: function(rows){
					var $sel = $options.find('select.layerNameList');
					for(var i=0,e=rows.length; i<e; ++i){
						var layerId = rows[i].key;
						var $o = $('<option></option>')
							.val(layerId)
							.text(layerId)
							.appendTo($sel);
						
						if( showService ){
							showService.printLayerName($o, layerId);
						};
					};
				}
				,onError: function(err){
					alert(_loc('Unable to obtain list of layers')+': '+err);
					reportError(_loc('Unable to obtain list of layers')+': '+err);
				}
			});
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('select.layerNameList');
			var layerName = $i.val();
			if( !layerName || '' == layerName ) {
				alert(_loc('Must enter a layer name'));
			} else {
				atlasDesign.queryView({
					viewName: 'geom-layer'
					,startkey: layerName
					,endkey: layerName
					,onSuccess: function(rows){
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							docIds.push(row.id);
						};

						var locStr = _loc('Geometries from layer {layerName}',{
							layerName: layerName
						});

						opts.onSuccess(docIds,locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from layer')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByGeomLayer());
	
	// **********************************************************************
	var SearchFilterByDocLayer = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents from a layer');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Layer name')+':<br/><select class="layerNameList"></select>'
				+'</div>');
			
			$parent.append( $options );
			
			atlasDesign.queryView({
				viewName: 'layers'
				,reduce: true
				,group: true
				,onSuccess: function(rows){
					var $sel = $options.find('select.layerNameList');
					for(var i=0,e=rows.length; i<e; ++i){
						var layerId = rows[i].key;
						var $o = $('<option></option>')
							.val(layerId)
							.text(layerId)
							.appendTo($sel);
						
						if( showService ){
							showService.printLayerName($o, layerId);
						};
					};
				}
				,onError: function(err){
					alert(_loc('Unable to obtain list of layers')+': '+err);
					reportError(_loc('Unable to obtain list of layers')+': '+err);
				}
			});
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('select.layerNameList');
			var layerName = $i.val();
			if( !layerName || '' == layerName ) {
				alert(_loc('Must enter a layer name'));
			} else {
				atlasDesign.queryView({
					viewName: 'layers'
					,startkey: layerName
					,endkey: layerName
					,reduce: false
					,onSuccess: function(rows){
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							docIds.push(row.id);
						};
						var locStr = _loc('Documents from layer {layerName}',{
							layerName: layerName
						});

						opts.onSuccess(docIds,locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from layer')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByDocLayer());

	// **********************************************************************
	var SearchFilterBySchemaType = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents from a schema type');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Schema')+': <br/><select class="schemaList"></select>'
				+'</div>');
			
			$parent.append( $options );
			
			atlasDesign.queryView({
				viewName: 'schemas-root'
				,onSuccess: function(rows){
					var $sel = $options.find('select.schemaList');
					for(var i=0,e=rows.length; i<e; ++i){
						var schemaName = rows[i].key;
						$('<option></option>')
							.val(schemaName)
							.text(schemaName)
							.appendTo($sel);
					};
				}
				,onError: function(err){
					alert(_loc('Unable to obtain list of schemas')+': '+err);
					reportError(_loc('Unable to obtain list of schemas')+': '+err);
				}
			});
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('select.schemaList');
			var schemaName = $i.val();
			if( !schemaName || '' == schemaName ) {
				alert(_loc('Must enter a schema name'));
			} else {
				atlasDesign.queryView({
					viewName: 'nunaliit-schema'
					,startkey: schemaName
					,endkey: schemaName
					,onSuccess: function(rows){
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							docIds.push(row.id);
						};
						var locStr = _loc('Documents from schema type {schemaName}',{
							schemaName: schemaName
						});

						opts.onSuccess(docIds,locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from schema')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterBySchemaType());

	// **********************************************************************
	var SearchFilterByImportProfile = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents from an import profile');
		}
	
		,printOptions: function($parent){
			var optionId = $n2.getUniqueId();
			var $options = $('<div>')
				.attr('id',optionId)
				.appendTo($parent);

			$('<span>')
				.text( _loc('Import Profile: ') )
				.appendTo($options);

			$('<br>')
				.appendTo($options);
			
			// Obtain all profile ids from entries
			atlasDesign.queryView({
				viewName: 'nunaliit-import'
				,include_docs: false
				,reduce: true
				,group: true
				,group_level: 1
				,onSuccess: function(rows){
					var profileLabelById = {};
					
					rows.forEach(function(row){
						var profileId = undefined;
						if( row 
						 && row.key 
						 && typeof row.key[0] === 'string' ){
							profileId = row.key[0];
						};
						if( profileId ){
							profileLabelById[profileId] = profileId;
						};
					});

					getProfiles(profileLabelById);
				}
				,onError: function(err){
					alert(_loc('Unable to obtain list of import entries')+': '+err);
					reportError(_loc('Unable to obtain list of import entries')+': '+err);
				}
			});
			
			function getProfiles(profileLabelById){
				atlasDesign.queryView({
					viewName: 'nunaliit-import-profile'
					,include_docs: true
					,onSuccess: function(rows){
						for(var i=0,e=rows.length; i<e; ++i){
							var profileId = rows[i].key;
							var importProfileDoc = rows[i].doc;
							
							var profileName = profileId;
							if( importProfileDoc 
							 && importProfileDoc.nunaliit_import_profile
							 && importProfileDoc.nunaliit_import_profile.label ){
								profileName = _loc(importProfileDoc.nunaliit_import_profile.label);
							};

							profileLabelById[profileId] = profileName;
						};
						
						displayOptions(profileLabelById);
					}
					,onError: function(err){
						alert(_loc('Unable to obtain list of import profiles')+': '+err);
						reportError(_loc('Unable to obtain list of import profiles')+': '+err);
					}
				});
			};
			
			function displayOptions(profileLabelById){
				var $options = $('#'+optionId);

				var $sel = $('<select>')
					.addClass('importProfileList')
					.appendTo($options);
				
				for(var profileId in profileLabelById){
					var profileLabel = profileLabelById[profileId];

					$('<option></option>')
						.val(profileId)
						.text(profileLabel)
						.appendTo($sel);
				};
			};
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('select.importProfileList');
			var profileId = $i.val();
			if( !profileId || '' == profileId ) {
				alert(_loc('Must select an import profile'));
			} else {
				atlasDesign.queryView({
					viewName: 'nunaliit-import'
					,startkey: [profileId,null]
					,endkey: [profileId,{}]
					,onSuccess: function(rows){
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							docIds.push(row.id);
						};
						var locStr = _loc('Documents from import profile: {profileId}',{
							profileId: profileId
						});

						opts.onSuccess(docIds,locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from import profile')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByImportProfile());

	// **********************************************************************
	var SearchFilterByView = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents reported in a view');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('View')+': <br/><select class="viewList"></select>'
				+'</div>');
			
			$parent.append( $options );
			
			atlasDb.getAllDocuments({
				startkey: '_design'
				,endkey: '_design~'
				,onSuccess: function(docs){
					var sortedViewLabels = [];
					docs.forEach(function(designDoc){
						var docId = designDoc._id;
						var names = docId.split('/');
						if( names.length > 1 ){
							var designName = names[1];
							if( designDoc && designDoc.views ){
								for(var viewName in designDoc.views){
									var label = designName + '/' + viewName;
									sortedViewLabels.push(label);
								};
							};
						};
					});
					
					sortedViewLabels.sort();
					
					var $sel = $options.find('select.viewList');
					sortedViewLabels.forEach(function(viewLabel){
						$('<option></option>')
							.val(viewLabel)
							.text(viewLabel)
							.appendTo($sel);
					});
				}
				,onError: function(err){
					alert(_loc('Unable to obtain list of views')+': '+err);
					reportError(_loc('Unable to obtain list of views')+': '+err);
				}
			});
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('select.viewList');
			var label = $i.val();
			if( !label ) {
				alert(_loc('Must select a view'));
			} else {
				var names = label.split('/');
				var designName = names[0];
				var viewName = names[1];
				var design = atlasDb.getDesignDoc({ddName:designName});
				design.queryView({
					viewName: viewName
					,onSuccess: function(rows){
						var docIds = [];
						var docIdMap = {};
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							var docId = row.id;
							if( !docIdMap[docId] ){
								docIds.push(docId);
								docIdMap[docId] = true;
							};
						};
						var locStr = _loc('Documents from view {label}',{
							label: label
						});

						opts.onSuccess(docIds,locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from view')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByView());

	// **********************************************************************
	var SearchFilterByDocumentReference = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents that reference another one');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Document Id')+': <br/><input class="filterDocumentId" type="text"/>'
				+'</div>');
			
			$parent.append( $options );
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			var $i = opts.options.find('input.filterDocumentId');
			var docId = $i.val();
			if( !docId || '' == docId ) {
				alert(_loc('Must enter a document identifier'));
			} else {
				atlasDesign.queryView({
					viewName: 'link-references'
					,startkey: docId
					,endkey: docId
					,onSuccess: function(rows){
						var docIds = [];
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							docIds.push(row.id);
						};
						var locStr = _loc('Documents referencing {docId}',{
							docId: docId
						});

						opts.onSuccess(docIds, locStr);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from schema')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByDocumentReference());

	// **********************************************************************
	var SearchFilterByDanglingReference = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents that have broken references');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDb.listAllDocuments({
				onSuccess: docIdsLoaded
				,onError: opts.onError
			});
			
			function docIdsLoaded(docIds){
				// Make a map
				var docIdsMap = {};
				for(var i=0,e=docIds.length; i<e; ++i){
					var docId = docIds[i];
					docIdsMap[docId] = true;
				};
				
				atlasDesign.queryView({
					viewName: 'link-references'
					,onSuccess: function(rows){
						var brokenDocIds = {};
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							var docId = row.id;
							var refId = row.key;
							
							if( !docIdsMap[refId] ){
								brokenDocIds[docId] = true;
							};
						};
						
						reportBrokenDocuments(brokenDocIds);
					}
					,onError: opts.onError
				});
			};

			function reportBrokenDocuments(brokenDocIds){
				var docIds = [];
				for(var docId in brokenDocIds){
					docIds.push(docId);
				};
				
				var locStr = _loc('Documents with dangling references');

				opts.onSuccess(docIds, locStr);
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterByDanglingReference());

	// **********************************************************************
	var SearchFilterInvalidSourceReference = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents that have an invalid source');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDb.listAllDocuments({
				onSuccess: docIdsLoaded
				,onError: opts.onError
			});
			
			function docIdsLoaded(docIds){
				// Make a map
				var docIdsMap = {};
				for(var i=0,e=docIds.length; i<e; ++i){
					var docId = docIds[i];
					docIdsMap[docId] = true;
				};
				
				atlasDesign.queryView({
					viewName: 'link-references'
					,onSuccess: function(rows){
						var brokenDocIds = {};
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							var docId = row.id;
							var refId = row.key;
							
							if( !docIdsMap[refId] ){
								brokenDocIds[docId] = true;
							};
						};
						
						documentsWithInvalidReferences(docIdsMap, brokenDocIds);
					}
					,onError: opts.onError
				});
			};

			function documentsWithInvalidReferences(currentDocIdsMap, brokenDocIds){
				var docIds = [];
				for(var docId in brokenDocIds){
					docIds.push(docId);
				};

				atlasDb.getDocuments({
					docIds: docIds
					,skipCache: true
					,onSuccess: function(docs){
						var invalidSourceIds = [];
						
						for(var i=0,e=docs.length; i<e; ++i){
							var doc = docs[i];
							if( doc 
							 && doc.nunaliit_source 
							 && doc.nunaliit_source.doc ){
								var sourceDocId = doc.nunaliit_source.doc;
								if( !currentDocIdsMap[sourceDocId] ){
									invalidSourceIds.push(doc._id);
								};
							};
						};
						
						reportInvalidSourceDocuments(invalidSourceIds);
					}
					,onError: opts.onError
				});
			};
			
			function reportInvalidSourceDocuments(docIds){
				var locStr = _loc('Documents that have an invalid source');

				opts.onSuccess(docIds,locStr);
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterInvalidSourceReference());

	// **********************************************************************
	var SearchFilterNotReachableByReference = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents that are not reachable by reference');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDb.listAllDocuments({
				onSuccess: docIdsLoaded
				,onError: opts.onError
			});
			
			function docIdsLoaded(docIds){
				// Make a map
				var docIdsMap = {};
				for(var i=0,e=docIds.length; i<e; ++i){
					var docId = docIds[i];
					docIdsMap[docId] = true;
				};
				
				atlasDesign.queryView({
					viewName: 'link-references'
					,onSuccess: function(rows){
						var referenceInfo = {};
						for(var i=0,e=rows.length; i<e; ++i){
							var row = rows[i];
							var docId = row.id;
							var refId = row.key;

							if( docIdsMap[docId] && !referenceInfo[docId] ) {
								referenceInfo[docId] = {};
							};
							if( docIdsMap[refId] && !referenceInfo[refId] ) {
								referenceInfo[refId] = {};
							};

							if( docIdsMap[refId] && docIdsMap[docId] ){
								referenceInfo[docId].reachable = true;
								referenceInfo[refId].reachable = true;
							};
						};
						
						reportUnreachableDocuments(referenceInfo);
					}
					,onError: opts.onError
				});
			};

			function reportUnreachableDocuments(referenceInfo){
				var docIds = [];
				for(var docId in referenceInfo){
					var info = referenceInfo[docId];
					if( !info.reachable ){
						docIds.push(docId);
					};
				};
				
				var locStr = _loc('Documents not reachable by reference');

				opts.onSuccess(docIds,locStr);
			};
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterNotReachableByReference());

	// **********************************************************************
	var SearchFilterSkeleton = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select skeleton documents');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'skeleton-docs'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Skeleton documents');

					opts.onSuccess(docIds,locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining skeleton documents')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterSkeleton());

	// **********************************************************************
	var SearchFilterMediaSubmitted = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents with submitted media files');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'attachments'
				,startkey: 'submitted'
				,endkey: 'submitted'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Documents with media files in submitted state');

					opts.onSuccess(docIds,locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining documents with media files in submitted state')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterMediaSubmitted());

	// **********************************************************************
	var SearchFilterMediaAnalyzed = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents with analyzed media files');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'attachments'
				,startkey: 'analyzed'
				,endkey: 'analyzed'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Documents with media files in analyzed state');

					opts.onSuccess(docIds,locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining documents with media files in analyzed state')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterMediaAnalyzed());

	// **********************************************************************
	var SearchFilterMediaWaiting = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents with waiting media files');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'attachments'
				,startkey: 'waiting for approval'
				,endkey: 'waiting for approval'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Documents with media files in waiting state');

					opts.onSuccess(docIds,locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining documents with media files in waiting state')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterMediaWaiting());

	// **********************************************************************
	var SearchFilterMediaApproved = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents with approved media files');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'attachments'
				,startkey: 'approved'
				,endkey: 'approved'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Documents with media files in approved state');

					opts.onSuccess(docIds, locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining documents with media files in approved state')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterMediaApproved());

	// **********************************************************************
	var SearchFilterMediaAttached = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select documents with attached media files');
		}
	
		,printOptions: function($parent){
		}

		,_retrieveDocIds: function(opts_){
			var opts = $n2.extend({
				options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(docIds,name){}
				,onError: reportError
			},opts_);
			
			atlasDesign.queryView({
				viewName: 'attachments'
				,startkey: 'attached'
				,endkey: 'attached'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						docIds.push(row.id);
					};
					var locStr = _loc('Documents with media files in attached state');

					opts.onSuccess(docIds,locStr);
				}
				,onError: function(err){
					alert(_loc('Problem obtaining documents with media files in attached state')+': '+err);
					opts.onError(err);
				}
			});
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterMediaAttached());

	// **********************************************************************
	var SearchFilterInvalidDocument = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Select invalid documents');
		}
	
		,printOptions: function($parent){
		}

		,_getFilterFunction: function(opts_){
			var opts = $n2.extend({
				options: null
				,onSuccess: function(filterFn, creationName){}
				,onError: reportError
			},opts_);

			var filterFn = function(doc){
				var invalid = false;
				$n2.couchUtils.validateDocumentStructure(
					doc
					,function(err){
						invalid = true;
						reportError( ''+doc._id+' : '+err );
					}
				);
				return invalid;
			};

			opts.onSuccess(filterFn, _loc('Documents that are invalid') );
		}
	});

	SearchFilter.availableSearchFilters.push(new SearchFilterInvalidDocument());

	// **********************************************************************
	var DocumentTransform = $n2.Class({
		
		name: null
		
		,id: null
		
		,initialize: function(){
			this.id = $n2.getUniqueId();
			this.name = _loc('Unknown Transform');
		}
	
		,transformList: function(opts_){
			var opts = $n2.extend({
				list: null
				,onCompleted: function(totalCount, skippedCount, okCount, failCount, transformedCount, deletedCount){}
				,onError: reportError
			},opts_);
			
			var _this = this;
			
			if( typeof(this.getTransformFunction) !== 'function' ){
				opts.onError('Class must implemented function "getTransformFunction()"');
				return;
			};
			
			this.getTransformFunction({
				onSuccess: function(transformFn){
					_this.transformListUsingFunction({
						list: opts.list
						,transformFn: transformFn
						,onCompleted: opts.onCompleted
						,onError: opts.onError
					});
				}
				,onError: opts.onError
			});
		}
	
		,transformListUsingFunction: function(opts_){
			var opts = $n2.extend({
				list: null
				,transformFn: null
				,onCompleted: function(totalCount, skippedCount, okCount, failCount, transformedCount, deletedCount){}
				,onError: reportError
			},opts_);
			
			if( !opts.list ) {
				opts.onError(_loc('List is required on transformation'));
				return;
			};
			if( !opts.transformFn ) {
				opts.onError(_loc('Function is required on transformation'));
				return;
			};

			var opCancelled = false;
			var progressDialog = new $n2.couchDialogs.ProgressDialog({
				title: _loc('Transform Progress')
				,onCancelFn: function(){
					opCancelled = true;
				}
			});
			
			var docIdsLeft = [];
			for(var i=0,e=opts.list.docIds.length; i<e; ++i){
				docIdsLeft.push( opts.list.docIds[i] );
			};
			
			var totalCount = docIdsLeft.length;
			var skippedCount = 0;
			var okCount = 0;
			var deletedCount = 0;
			var transformedCount = 0;
			var failCount = 0;

			// Create a copy of the configuration so that user
			// can save temporary objects to it
			var my_scriptConfig = $n2.extend({},g_scriptConfig);
			
			processNext();
			
			function processNext(){
				if( opCancelled ) {
					cancel();
					return;
				};

				if(docIdsLeft.length < 1){
					progressDialog.updateHtmlMessage('<span>100%</span>');
					opts.onCompleted(totalCount, skippedCount, okCount, failCount, transformedCount, deletedCount);
					progressDialog.close();
				} else {
					if( totalCount ) {
						var percent = Math.floor((skippedCount + okCount + failCount) * 100 / totalCount);
						var html = ['<div>'];
						html.push('<span>Percent: '+percent+'%</span><br/>');
						html.push('<span>Transformed: '+okCount+'</span><br/>');
						html.push('<span>Skipped: '+skippedCount+'</span><br/>');
						html.push('<span>Failed: '+failCount+'</span><br/>');
						html.push('</div>');
						progressDialog.updateHtmlMessage( html.join('') );
					} else {
						progressDialog.updateHtmlMessage('<span>0%</span>');
					};
					
					var docId = docIdsLeft.pop();
					atlasDb.getDocument({
						docId: docId
						,skipCache: true
						,onSuccess: retrievedDocument
						,onError: function(err){
							var locStr = _loc('Failure to fetch {docId}',{
								docId: docId
							});
							reportError(locStr);
							failCount += 1;
							processNext();
						}
					});
				};
			};
			
			function retrievedDocument(doc){
				if( opCancelled ) {
					cancel();
					return;
				};

				opts.transformFn(
					doc
					,function(opts_){ // onTransformedFn
						var opts = $n2.extend({
							deleteDocument: false
						},opts_);
						
						if( opts.deleteDocument ){
							deleteDocument(doc);
						} else {
							saveDocument(doc);
						};
					}
					,function(){ // onSkippedFn
						skippedCount += 1;
						processNext();
					}
					,my_scriptConfig
				);
			};
			
			function saveDocument(doc){
				if( opCancelled ) {
					cancel();
					return;
				};

				atlasDb.updateDocument({
					data: doc
					,onSuccess: function(docInfo){
						var locStr = _loc('{docId} transformed and saved',{
							docId: doc._id
						});
						log(locStr);
						okCount += 1;
						transformedCount += 1;
						processNext();
					}
					,onError: function(errorMsg){ 
						var locStr = _loc('Failure to save {docId}',{
							docId: doc._id
						});
						reportError(locStr+': '+errorMsg);
						failCount += 1;
						processNext();
					}
				});
			};
			
			function deleteDocument(doc){
				if( opCancelled ) {
					cancel();
					return;
				};

				atlasDb.deleteDocument({
					data: doc
					,onSuccess: function(docInfo){
						var locStr = _loc('{docId} deleted',{
							docId: doc._id
						});
						log(locStr);
						okCount += 1;
						deletedCount += 1;
						processNext();
					}
					,onError: function(errorMsg){ 
						var locStr = _loc('Failure to delete {docId}',{
							docId: doc._id
						});
						reportError(locStr+': '+errorMsg);
						failCount += 1;
						processNext();
					}
				});
			};
			
			function cancel(){
				reportError(_loc('Operation cancelled by user'));
				progressDialog.close();
			};
		}
	});

	// **********************************************************************
	var DocumentTransformTextReplace = $n2.Class(DocumentTransform, {
		
		initialize: function(){
			DocumentTransform.prototype.initialize.apply(this);
			this.name = _loc('Text Replace');
		}
	
		,getTransformFunction: function(opts_){
			var opts = $n2.extend({
				onSuccess: function(transformFn){}
				,onError: reportError
			},opts_);
			var dialogId = $n2.getUniqueId();
			var $dialog = $('<div id="'+dialogId+'">'
				+'<div>'+_loc('From')+': <input class="selectAppFrom" type="text"/></div>'
				+'<div>'+_loc('To')+': <input class="selectAppTo" type="text"/></div>'
				+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
				+'</div>');

			$dialog.find('button')
				.first()
					.button({icons:{primary:'ui-icon-check'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						var fromText = $dialog.find('.selectAppFrom').val();
						var toText = $dialog.find('.selectAppTo').val();
						
						$dialog.dialog('close');

						createFunction(fromText, toText);
						
						return false;
					})
				.next()
					.button({icons:{primary:'ui-icon-cancel'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						$dialog.dialog('close');
						return false;
					})
				;
			
			var dialogOptions = {
				autoOpen: true
				,title: _loc('Replace Text')
				,modal: true
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			};
			$dialog.dialog(dialogOptions);
			
			function createFunction(fromText, toText) {
				var fromRegex = new RegExp(fromText,'ig');

				var transformFn = function(doc, onTransformedFn, onSkippedFn){
					
					var found = false;
					iterateObjectLiteralFields(doc,function(value, parent, parentSelector, root, selectors){
						if( typeof(value) === 'string' ) {
							var temp = value.replace(fromRegex, toText);
							if( temp !== value ) {
								found = true;
								parent[parentSelector] = temp;
							};
						};
					});
					
					if( found ) {
						onTransformedFn();
					} else {
						onSkippedFn();
					};
				};
				
				opts.onSuccess(transformFn);
			};
		}
	});

	// **********************************************************************
	var DocumentTransformJavascript = $n2.Class(DocumentTransform, {
		
		initialize: function(){
			DocumentTransform.prototype.initialize.apply(this);
			this.name = _loc('Javascript Replace');
		}
	
		,getTransformFunction: function(opts_){
			var opts = $n2.extend({
				onSuccess: function(transformFn){}
				,onError: reportError
			},opts_);
			var dialogId = $n2.getUniqueId();
			var $dialog = $('<div id="'+dialogId+'" class="selectAppDocumentTransformJavascript">'
				+'<div>'+_loc('Javascript')+':<br/><textarea></textarea></div>'
				+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
				+'</div>');

			$dialog.find('textarea').val('function(doc, onTransformedFn, onSkippedFn, config){\n\t// Modify document, then call onTransformedFn() to save it\n\t// Otherwise, call onSkippedFn()\n}')

			$dialog.find('button')
				.first()
					.button({icons:{primary:'ui-icon-check'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						var script = $dialog.find('textarea').val();
						var scriptFn = null;
						
						// Create a copy of the configuration so that user
						// can save temporary objects to it
						var my_scriptConfig = $n2.extend({},g_scriptConfig);

						try {
							eval('scriptFn = '+script);
							scriptFn({_id:'test',_revision:'1-abcde'},function(){},function(){},my_scriptConfig);
						} catch(e) {
							alert(_loc('Error')+': '+e);
							return;
						};
						if( typeof(scriptFn) !== 'function' ) {
							alert(_loc('You must enter a valid function'));
							return;
						};
						
						$dialog.dialog('close');

						opts.onSuccess(scriptFn);
						
						return false;
					})
				.next()
					.button({icons:{primary:'ui-icon-cancel'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						$dialog.dialog('close');
						return false;
					})
				;
			
			var dialogOptions = {
				autoOpen: true
				,title: _loc('Replace Text')
				,modal: true
				,width: 550
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			};
			$dialog.dialog(dialogOptions);
		}
	});
	
	// **********************************************************************
	var DocumentTransformOnFunction = $n2.Class(DocumentTransform, {
		
		transformFn: null,
		
		initialize: function(transformFn, name){
			DocumentTransform.prototype.initialize.apply(this);
			
			this.transformFn = transformFn;
			this.name = name ? name : _loc('Function Transformation');
		},
	
		getTransformFunction: function(opts_){
			var opts = $n2.extend({
				onSuccess: function(transformFn){}
				,onError: reportError
			},opts_);
			
			opts.onSuccess(this.transformFn);
		}
	});

	// -----------------------------------------------------------------
	function iterateObjectLiteralFields(obj,fn){
		var selectors = [];
		
		traverse(obj, obj, selectors);
		
		function traverse(root, obj, selectors){
			if( $n2.isArray(obj) ) {
				for(var i=0,e=obj.length; i<e; ++i){
					var parentSelector = i;
					selectors.push(parentSelector);
					handle(obj[parentSelector], obj, parentSelector, root, selectors);
					selectors.pop();
				};
			} else if( typeof(obj) === 'object' ){
				for(var key in obj){
					var parentSelector = key;
					selectors.push(parentSelector);
					handle(obj[parentSelector], obj, parentSelector, root, selectors);
					selectors.pop();
				};
			};
		};
		
		function handle(value, parent, parentSelector, root, selectors){
			if( null === value ) {
				fn(value, parent, parentSelector, root, selectors);
			} else if( typeof(value) === 'string' ) {
				fn(value, parent, parentSelector, root, selectors);
			} else if( typeof(value) === 'number' ) {
				fn(value, parent, parentSelector, root, selectors);
			} else if( $n2.isArray(value) ) {
				traverse(root, value, selectors);
			} else if( typeof(value) === 'object' ){
				traverse(root, value, selectors);
			};
		};
	};

	// -----------------------------------------------------------------
	function getListsDiv(){
		var $e = $selectAppDiv.find('.selectAppLists');
		if( $e.length < 1 ) {
			$e = $('<div class="selectAppLists"></div>');
			$selectAppDiv.append($e);
		};
		return $e;
	};
	
	// -----------------------------------------------------------------
	function refreshAllLists(){
		var $lists = getListsDiv();
		$lists.empty();
		
		var $h = $('<h1><span></span> <button></button></h1>');
		$h.find('span').text( _loc('Queries') );
		$h.find('button').text( _loc('Add') );
		$lists.append($h);
		
		$h.find('button').click(function(){
			SearchFilter.createNewList({
				onSuccess: function(list){
					addList(list);
				}
			});
			return false;
		});
		
		for(var i=0,e=allLists.length; i<e; ++i){
			var list = allLists[i];
			
			var $d = $('<div></div>');
			$lists.append($d);
			installView(list, $d);
			
			if( list === selectedList ) {
				$d.addClass('selectAppListSelected');
			};
			
			var $s = $('<span></span>');
			$s.text( list.print() );
			$d.append($s);
			
			var $a = $('<a href="#"></a>');
			$a.text( _loc('View') );
			$d.append($a);
			installView(list, $a);
			
			var $a = $('<a href="#"></a>');
			$a.text( _loc('Text') );
			$d.append($a);
			installText(list, $a);
		};
		
		function installView(list, $a){
			$a.click(function(e){
				e.stopPropagation();
				selectList(list);
				return false;
			});
		};
		
		function installText(list, $a){
			$a.click(function(e){
				e.stopPropagation();
				selectText(list);
				return false;
			});
		};
	};
	
	// -----------------------------------------------------------------
	function addList(list){
		allLists.push(list);
		selectList(list);
	};
	
	// -----------------------------------------------------------------
	function selectList(list){
		selectedList = list;
		refreshAllLists();
		
		viewList(list);
	};
	
	// -----------------------------------------------------------------
	function getListViewDiv(){
		var $e = $selectAppDiv.find('.selectAppListView');
		if( $e.length < 1 ) {
			$e = $('<div class="selectAppListView"></div>');
			$selectAppDiv.append($e);
		};
		return $e;
	};
	
	// -----------------------------------------------------------------
	function clearList(){
		var $div = getListViewDiv();
		
		clearDocument();
		
		$div.html('<h1></h1><div class="selectAppMinHeight"></div>');
		$div.find('h1').text( _loc('No list Selected') );
	};
	
	// -----------------------------------------------------------------
	function viewList(list){
		var $div = getListViewDiv();
		
		clearDocument();
		
		$div.empty();

		var $h = $('<h1></h1>');
		$div.append($h);
		$h.text(list.name);
		
		$('<button>')
			.text( _loc('Transform') )
			.appendTo($h)
			.click(function(){
				transformList(list);
				return false;
			});
		
		$('<button>')
			.text( _loc('Delete') )
			.appendTo($h)
			.click(function(){
				deleteDocumentsFromList(list);
				return false;
			});
		
		$('<button>')
			.text( _loc('Refine List') )
			.appendTo($h)
			.click(function(){
				SearchFilter.refineList({
					list: list
					,onSuccess: function(refinedList){
						addList(refinedList);
					}
				});
				return false;
			});
		
		$('<button>')
			.text( _loc('Report') )
			.appendTo($h)
			.click(function(){
				reportList(list);
				return false;
			});
		
		$('<button>')
			.text( _loc('Export') )
			.appendTo($h)
			.click(function(){
				exportList(list);
				return false;
			});
		
		$('<button>')
			.text( _loc('Export by Script') )
			.appendTo($h)
			.click(function(){
				exportListByScript(list);
				return false;
			});
		
		$('<button>')
			.text( _loc('Re-Submit Geometries') )
			.appendTo($h)
			.click(function(){
				resubmitGeometriesInList(list);
				return false;
			});

		for(var i=0,e=list.docIds.length; i<e; ++i){
			var docId = list.docIds[i];
			var $d = $('<div>')
				.appendTo($div);
			
			var $a = $('<a>')
				.attr('href','#')
				.appendTo($d);
			
			if( showService && list.docIds.length < 100 ) {
				showService.printBriefDescription($a, docId);
			} else if( showService ) {
				$a
					.addClass('n2SelectApp_waitForMouseOver')
					.attr('nunaliit-document',docId)
					.text(docId)
					.mouseover(mouseOverDisplay);
			} else {
				$a.text(docId);
			};
			installViewDoc($a, docId);
		};
		
		function installViewDoc($a, docId){
			$a.click(function(){
				viewDocument(docId);
				return false;
			});
		};

		function mouseOverDisplay(){
			var $a = $(this);
			if( $a.hasClass('n2SelectApp_waitForMouseOver') ){
				$a.removeClass('n2SelectApp_waitForMouseOver');
				var docId = $a.attr('nunaliit-document');
				showService.printBriefDescription($a, docId);
			};
		};
	};
	
	// -----------------------------------------------------------------
	function transformListUsing(list, transformation){
		transformation.transformList({
			list: list
			,onCompleted: function(totalCount, skippedCount, okCount, failCount){
				var locStr = _loc('Transformations completed. Successful: {ok} Failures: {fail} Skipped: {skipped}',{
					ok: okCount
					,fail: failCount
					,skipped: skippedCount
				});
				log(locStr);
				if( failCount > 0 ) {
					alert(_loc('Transformations completed with some failures'));
				};
			}
		});
	};
	
	// -----------------------------------------------------------------
	function transformList(list){
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'">'
			+'<select></select>'
			+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
			+'</div>');

		var $select = $dialog.find('select');
		for(var i=0,e=documentTransforms.length; i<e; ++i) {
			var documentTransform = documentTransforms[i];
			var $o = $('<option></option>');
			$o.attr('value',documentTransform.id);
			$o.text(documentTransform.name);
			$select.append( $o );
		};
		
		$dialog.find('button')
			.first()
				.button({icons:{primary:'ui-icon-check'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					var $select = $dialog.find('select');
					var transformId = $select.val();
	
					$dialog.dialog('close');

					var useTransform = null;
					for(var i=0,e=documentTransforms.length; i<e; ++i) {
						var documentTransform = documentTransforms[i];
						if( documentTransform.id === transformId ) {
							useTransform = documentTransform;
							break;
						};
					};
					if( useTransform ) {
						transformListUsing(list, useTransform);
					} else {
						alert(_loc('Unable to find document transform'));
					};
					
					return false;
				})
			.next()
				.button({icons:{primary:'ui-icon-cancel'}})
				.click(function(){
					var $dialog = $('#'+dialogId);
					$dialog.dialog('close');
					return false;
				})
			;
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Select Document Transform')
			,modal: true
			,width: 400
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
	};
	
	// -----------------------------------------------------------------
	function deleteDocumentsFromList(list){
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div id="'+dialogId+'">'
			+'<span class="deleteDocumentsApproveText"></span>'
			+'<div><button class="buttonOK">'+_loc('OK')+'</button>'
			+'<button class="buttonCancel">'+_loc('Cancel')+'</button></div>'
			+'</div>');

		var $span = $dialog.find('span.deleteDocumentsApproveText');
		var locStr = _loc('Do you really wish to delete the {count} document(s) referenced by this list?',{
			count: list.docIds.length
		});
		$span.text(locStr);
		
		$dialog.find('button.buttonOK')
			.button({icons:{primary:'ui-icon-check'}})
			.click(function(){
				var $dialog = $('#'+dialogId);

				$dialog.dialog('close');

				var opCancelled = false;
				var progressDialog = new $n2.couchDialogs.ProgressDialog({
					title: _loc('Deletion Progress')
					,onCancelFn: function(){
						opCancelled = true;
					}
				});
				
				var docIdsLeft = [];
				for(var i=0,e=list.docIds.length; i<e; ++i){
					docIdsLeft.push( list.docIds[i] );
				};
				
				var totalCount = docIdsLeft.length;
				var okCount = 0;
				var failCount = 0;
				
				processNext();
				
				function processNext(){
					if( opCancelled ) {
						cancel();
						return;
					};

					if(docIdsLeft.length < 1){
						progressDialog.updatePercent(100);
						progressDialog.close();

					} else {
						if( totalCount ) {
							progressDialog.updatePercent( (okCount + failCount) * 100 / totalCount );
						} else {
							progressDialog.updatePercent(0);
						};
						
						var docId = docIdsLeft.pop();
						atlasDb.getDocument({
							docId: docId
							,skipCache: true
							,onSuccess: retrievedDocument
							,onError: function(err){
								var locStr = _loc('Failure to fetch {docId}',{
									docId: docId
								});
								reportError(locStr);
								failCount += 1;
								processNext();
							}
						});
					};
				};
				
				function retrievedDocument(doc){
					if( opCancelled ) {
						cancel();
						return;
					};

					atlasDb.deleteDocument({
						data: doc
						,onSuccess: function(docInfo){
							log( _loc('{docId} deleted',{
								docId: doc._id
							}) );
							okCount += 1;
							processNext();
						}
						,onError: function(errorMsg){ 
							var locStr = _loc('Failure to delete {docId}',{
								docId: doc._id
							});
							reportError(locStr+': '+errorMsg);
							failCount += 1;
							processNext();
						}
					});
				};
				
				function cancel(){
					reportError( _loc('Operation cancelled by user') );
					progressDialog.close();
				};
				
				return false;
			});
		
		$dialog.find('button.buttonCancel')
			.button({icons:{primary:'ui-icon-cancel'}})
			.click(function(){
				var $dialog = $('#'+dialogId);
				$dialog.dialog('close');
				return false;
			});
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Confirm')
			,modal: true
			,width: 400
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
	};

	// -----------------------------------------------------------------
	function reportList(list){
		
		var dialogId = $n2.getUniqueId();
		var $dialog = $('<div>')
			.attr('id',dialogId)
			;
		
		$('<textarea>')
			.addClass('n2select_report_script')
			.val( 'function(opts_){\n\tvar opts = nunaliit2.extend({\n\t\tconfig: null\n\t\t,doc: null\n\t\t,logger: null\n\t},opts_);\n\n\tif( opts.doc ){\n\n\t} else {\n\t\topts.logger.log("Finished");\n\t}\n}' )
			.appendTo($dialog);

		$('<div>')
			.addClass('n2select_report_result')
			.appendTo($dialog);

		var $buttons = $('<div>')
			.addClass('n2select_report_buttons')
			.appendTo($dialog);

		$('<button>')
			.text( _loc('OK') )
			.click(function(){
				performReport();
				return false;
			})
			.appendTo($buttons);
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Enter Report Script')
			,modal: true
			,width: 550
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		function performReport(){
			var funcStr = $('#'+dialogId).find('.n2select_report_script').val();
			
			var func = null;
			try {
				eval('func = '+funcStr);
			} catch(e) {
				alert(_loc('Error')+': '+e);
				return;
			};
			if( typeof(func) !== 'function' ) {
				alert( _loc('You must enter a valid function') );
				return;
			};
			
			var docIdsLeft = [];
			for(var i=0,e=list.docIds.length; i<e; ++i){
				docIdsLeft.push( list.docIds[i] );
			};
			var totalCount = docIdsLeft.length;
			var processedCount = 0;
			var failCount = 0;
			var opCancelled = false;
			
			var progressDialog = new $n2.couchDialogs.ProgressDialog({
				title: _loc('Preparing Report')
				,onCancelFn: function(){
					opCancelled = true;
				}
			});
			
			var logger = new $n2.logger.HtmlLogger({
				elem: $('#'+dialogId).find('.n2select_report_result')
			});

			// Create a copy of the configuration so that user
			// can save temporary objects to it
			var my_scriptConfig = $n2.extend({},g_scriptConfig);
			
			processNext();
			
			function processNext(){
				if( opCancelled ) {
					cancel();
					return;
				};

				if(docIdsLeft.length < 1){
					progressDialog.updateHtmlMessage('<span>100%</span>');

					// Call one last time, without a document
					my_scriptConfig.continueOnExit = true;
					my_scriptConfig.onContinue = onFinish;
					func({
						config: my_scriptConfig
						,logger: logger
					});
					if( my_scriptConfig.continueOnExit ){
						onFinish();
					};
					
					
				} else {
					if( totalCount ) {
						var percent = Math.floor((processedCount+failCount) * 100 / totalCount);
						var html = ['<div>'];
						html.push('<span>Percent: '+percent+'%</span><br/>');
						html.push('<span>Processed: '+processedCount+'</span><br/>');
						html.push('<span>Failures: '+failCount+'</span><br/>');
						html.push('</div>');
						progressDialog.updateHtmlMessage( html.join('') );
					} else {
						progressDialog.updateHtmlMessage('<span>0%</span>');
					};
					
					var docId = docIdsLeft.pop();
					atlasDb.getDocument({
						docId: docId
						,onSuccess: retrievedDocument
						,onError: function(err){
							var locStr = _loc('Failure to fetch {docId}',{
								docId: docId
							});
							reportError(locStr);
							failCount += 1;
							processNext();
						}
					});
				};
			};
			
			function retrievedDocument(doc){
				if( opCancelled ) {
					cancel();
					return;
				};

				my_scriptConfig.continueOnExit = true;
				my_scriptConfig.onContinue = onContinue;
				func({
					doc: doc
					,config: my_scriptConfig
					,logger: logger
				});
				
				if( my_scriptConfig.continueOnExit ){
					onContinue();
				};
				
			};

			function onFinish(){
				progressDialog.close();
			};

			function onContinue(){
				processedCount += 1;

				processNext();
			};
			
			function cancel(){
				reportError(_loc('Operation cancelled by user'));
				progressDialog.close();
			};
		};
	};
	
	// -----------------------------------------------------------------
	function exportList(list){

		// Check if service is available
		if( !exportService ) {
			alert( _loc('Export service is not configured') );
		} else {
			exportService.checkAvailable({
				onAvailable: getExportSettings
				,onNotAvailable: function(){
					alert( _loc('Export service is not available') );
				}
			});
		};
		
		function getExportSettings(){
			var dialogId = $n2.getUniqueId();
			var $dialog = $('<div id="'+dialogId+'"></div>');

			var fileNameId = $n2.getUniqueId();
			
			$('<div>'+_loc('Exporting')+' <span></span></div>')
				.find('span').text(list.print()).end()
				.appendTo($dialog);

			// Filter
			var filterId = $n2.getUniqueId();
			var $filterDiv = $('<div>')
				.appendTo($dialog);
			$('<label>')
				.text( _loc('Filter:') )
				.attr('for',filterId)
				.appendTo($filterDiv);
			var $filterSelect = $('<select>')
				.attr('id',filterId)
				.appendTo($filterDiv);
			$('<option value="all"></options>')
				.text( _loc('All Documents') )
				.appendTo($filterSelect);
			$('<option value="points"></options>')
				.text( _loc('All Point Geometries') )
				.appendTo($filterSelect);
			$('<option value="linestrings"></options>')
				.text( _loc('All LineString Geometries') )
				.appendTo($filterSelect);
			$('<option value="polygons"></options>')
				.text( _loc('All Polygon Geometries') )
				.appendTo($filterSelect);

			// Format
			var formatId = $n2.getUniqueId();
			var $formatDiv = $('<div>')
				.appendTo($dialog);
			$('<label>')
				.text( _loc('Format:') )
				.attr('for',formatId)
				.appendTo($formatDiv);
			var $formatSelect = $('<select>')
				.attr('id',formatId)
				.appendTo($formatDiv)
				.change(formatChanged);
			$('<option value="geojson"></options>')
				.text( _loc('geojson') )
				.appendTo($formatSelect);
			$('<option value="csv"></options>')
				.text( _loc('csv') )
				.appendTo($formatSelect);
			
			// File name
			var $fileNameDiv = $('<div>')
				.appendTo($dialog);
			$('<label>')
				.text( _loc('File Name:') )
				.attr('for',fileNameId)
				.appendTo($fileNameDiv);
			$('<input>')
				.attr('type','text')
				.attr('id',fileNameId)
				.addClass('n2_export_fileNameInput')
				.val('export.geojson')
				.appendTo($dialog);

			$('<div><button>'+_loc('Export')+'</button></div>')
				.appendTo($dialog);
			$dialog.find('button').click(function(){
				var filter = $('#'+filterId).val();
				var format = $('#'+formatId).val();
				
				var fileName = $('#'+fileNameId).val();
				if( '' === fileName ) {
					fileName = null;
				};
				
				$dialog.dialog('close');
				performExport({
					filter: filter
					,fileName: fileName
					,format: format
				});
				return false;
			});
			
			var dialogOptions = {
				autoOpen: true
				,title: _loc('Export')
				,modal: true
				,width: 400
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			};
			$dialog.dialog(dialogOptions);
			
			formatChanged();
			
			function formatChanged(){
				var extension = $('#'+formatId).val();
				var name = $('#'+fileNameId).val();
				var i = name.lastIndexOf('.');
				if( i >= 0 ){
					name = name.substr(0,i);
				};
				name = name + '.' + extension;
				$('#'+fileNameId).val(name);
			};
		};
		
		function performExport(opts_){
			var opts = $n2.extend({
				filter: 'all'
				,fileName: 'export'
				,format: 'geojson'
			},opts_);
			
			var windowId = $n2.getUniqueId();
			
			// Open a new window to get results
			//open('about:blank', windowId);
			$('<iframe>')
				.attr('name',windowId)
				.attr('src','javascript:false')
				.css({
					visibility: 'hidden'
					,display: 'none'
				})
				.appendTo( $('body') );
			
			exportService.exportByDocIds({
				docIds: list.docIds
				,targetWindow: windowId
				,filter: opts.filter
				,contentType: 'application/binary'
				,fileName: opts.fileName
				,format: opts.format
				,onError: function(err){
					alert(_loc('Error during export')+': '+err);
				}
			});
		};
	};
	
	// -----------------------------------------------------------------
	function exportListByScript(list){

		// Check if service is available
		if( !exportService ) {
			alert( _loc('Export service is not configured') );
		} else {
			var docIds = [];
			for(var i=0,e=list.docIds.length; i<e; ++i){
				docIds.push( list.docIds[i] );
			};
			
			exportService.createExportApplication({
				docIds: docIds
				,logger: new $n2.logger.CustomLogger({
					logFn: log
					,reportErrorFn: reportError
				})
			});
		};
	};
	
	// -----------------------------------------------------------------
	function resubmitMediaInList(doc, onTransformed, onSkipped, scriptConfig){
		// Figure out original attachments so as to not mess with them
		var originalKeyMap = {};
		if( doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files ) {
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];

				if( att.originalAttachment ) {
					originalKeyMap[att.originalAttachment] = true;
				};
				if( att.isOriginalUpload ){
					originalKeyMap[attName] = true;
				};
			};
		};
		
		// Mark all attachments as submitted
		var updateRequired = false;
		var keysToRemove = [];
		
		if( doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files ) {
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				
				if( att.source ) {
					// Remove all derived attachments except for original files
					if( originalKeyMap[attName] ) {
						// Do not remove
					} else {
						// remove
						keysToRemove.push(attName);
					};
				} else {
					att.status = 'submitted';
					updateRequired = true;
				};
			};
		};
		
		// Remove excess attachment descriptors
		for(var i=0,e=keysToRemove.length; i<e; ++i){
			var keyToRemove = keysToRemove[i];
			
			var attachmentName = null;
			
			if( doc.nunaliit_attachments 
			 && doc.nunaliit_attachments.files
			 && doc.nunaliit_attachments.files[keyToRemove]
			 ) {
				attachmentName = doc.nunaliit_attachments.files[keyToRemove].attachmentName;
				delete doc.nunaliit_attachments.files[keyToRemove];
				updateRequired = true;
			};

			if( attachmentName
			 && doc._attachments 
			 && doc._attachments[attachmentName]
			 ) {
				delete doc._attachments[attachmentName];
				updateRequired = true;
			};
		};
		
		// Update document, if required
		if( updateRequired ) {
			onTransformed();
		} else {
			onSkipped();
		};
	};

	// -----------------------------------------------------------------
	function resubmitGeometriesInList(doc, onTransformed, onSkipped, scriptConfig){
		if( doc.nunaliit_geom 
		 && doc.nunaliit_geom.simplified
		 && doc.nunaliit_geom.simplified.original ) {
			var attName = doc.nunaliit_geom.simplified.original;
			var originalUrl = atlasDb.getAttachmentUrl(doc,attName);
			$.ajax({
				url: originalUrl
				,dataType: 'text'
				,success: function(wkt){
					var geom = OpenLayers.Geometry.fromWKT(wkt);
					var bounds = geom.getBounds();
					doc.nunaliit_geom = {
						nunaliit_type: 'geometry'
						,wkt: wkt
						,bbox: [
							bounds.left
							,bounds.bottom
							,bounds.right
							,bounds.top
						]
					};

					onTransformed();
				}
				,error: function(){
					reportError('Unable to load attachment '+attName+' from doc '+doc._id);
					onSkipped();
				}
			});
			
		} else {
			onSkipped();
		};
	};
	
	// -----------------------------------------------------------------
	function selectText(list){
		var docIds = list.docIds;
		
		var dialogId = $n2.getUniqueId();

		var $dialog = $('<div id="'+dialogId+'">'
			+'<textarea class="selectAppTextDocIds"></textarea>'
			+'</div></div>');
		
		var text = docIds.join('\n');
		
		$dialog.find('textarea.selectAppTextDocIds').text( text );
		
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Document Identifiers')
			,modal: true
			,closeOnEscape: false
			,dialogClass: 'selectAppTextDialog'
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
	};
	
	// -----------------------------------------------------------------
	function getDocumentDiv(){
		var $e = $selectAppDiv.find('.selectAppDocument');
		if( $e.length < 1 ) {
			$e = $('<div class="selectAppDocument"></div>');
			$selectAppDiv.append($e);
		};
		return $e;
	};
	
	// -----------------------------------------------------------------
	function clearDocument(){
		var $div = getDocumentDiv();
		
		$div.html('<h1></h1><div class="selectAppMinHeight"></div>');
		$div.find('h1').text( _loc('No Document') );
	};
	
	// -----------------------------------------------------------------
	function viewDocument(docId){
		var $div = getDocumentDiv();
		
		$div.html('<h1>'+docId+'</h1><div class="olkit_wait"></div>');
		
		atlasDb.getDocument({
			docId: docId
			,skipCache: true
			,onSuccess: function(doc){
				$div.empty();
				
				var $h = $('<h1></h1>');
				$div.append($h);
				if( showService ){
					showService.printBriefDescription($h,docId);
				} else {
					$h.text(docId);
				};

				var $tree = $('<div></div>');
				$div.append($tree);
				
				new $n2.tree.ObjectTree($tree, doc);

				var $buttons = $('<div></div>');
				$div.append($buttons);
				
				var $edit = $('<button></button>');
				$edit.text( _loc('Edit') );
				$buttons.append($edit);
				$edit.click(function(){
					editDocument(doc);
					return false;
				});
			}
			,onError: function(err){
				reportError(err);
			}
		});
	};
	
	// -----------------------------------------------------------------
	function editDocument(doc){
		
		var editDoc = $n2.document.clone(doc);
		
		var $div = getDocumentDiv();
		
		$div.empty();
		
		var $h = $('<h1></h1>');
		$div.append($h);
		if( showService ){
			showService.displayBriefDescription($h,null,editDoc);
		} else {
			$h.text(editDoc._id);
		};

		var editDivId = $n2.getUniqueId();
		var $editDiv = $('<div id="'+editDivId+'"></div>');
		$div.append($editDiv);

		couchEditor.showDocumentForm(doc,{
			panelName: editDivId
			,onCancelFn: function(){
				viewDocument(doc._id);
			}
		});
	};
	
	// -----------------------------------------------------------------
	function getLogsDiv(){
		var $e = $selectAppDiv.find('.selectAppLogs');
		if( $e.length < 1 ) {
			$e = $('<div class="selectAppLogs"></div>');
			$selectAppDiv.append($e);
			addHeader($e);
		};
		return $e;
		
		function addHeader($e){
			var $h = $('<h1><span></span> <button></button></h1>');
			$e.append($h);
			$h.find('span').text( _loc('Logs') );
			$h.find('button')
				.text( _loc('Clear') )
				.click(function(){
					var $d = getLogsDiv();
					$d.empty();
					addHeader($d);
					return false;
				});
		};
	};
	
	// -----------------------------------------------------------------
	function reportError(err){
		var $e = getLogsDiv();

		var $d = $('<div class="error"></div>');
		$d.text(err);
		$e.append($d);
	};
	
	// -----------------------------------------------------------------
	function log(msg){
		var $e = getLogsDiv();

		var $d = $('<div class="log"></div>');
		$d.text(msg);
		$e.append($d);
	};
	
	// -----------------------------------------------------------------
	function bs(){
		var $b = $('<button></button>');
		$b.text( _loc('Test Temporary View') );
		$selectAppDiv.append($b);
		
		$b.click(function(){
			atlasDb.queryTemporaryView({
				map: 'function(doc){ emit(null,null); }'
				,onSuccess: function(rows){
					var docIds = [];
					for(var i=0,e=rows.length; i<e; ++i){
						docIds.push( rows[i].id );
					};
					
					var l = new DocumentList({
						docIds: docIds
						,name: _loc('Temporary View')
					});
					addList(l);
				}
			});
			return false;
		});

		var $b = $('<button></button>');
		$b.text( _loc('All Documents') );
		$selectAppDiv.append($b);
		
		$b.click(function(){
			atlasDb.listAllDocuments({
				onSuccess: function(docIds){
					var l = new DocumentList({
						docIds: docIds
						,name: _loc('All Documents')
					});
					addList(l);
				}
			});
			return false;
		});
	};
	
	// -----------------------------------------------------------------
	function main(opts_) {
		$n2.log('Options',opts_);
		config = opts_.config;
		atlasDb = opts_.config.atlasDb;
		atlasDesign = opts_.config.atlasDesign;
		serverDesign = opts_.config.serverDesign;
		siteDesign = opts_.config.siteDesign;
		schemaRepository = opts_.config.directory.schemaRepository;
		couchEditor = config.couchEditor;
		
		g_scriptConfig = $n2.extend(
			{}
			,config
			,{
				log: log
				,reportError: reportError
			}
		);

		$selectAppDiv = opts_.div;
		
		$('.selectAppTitle').text( _loc('Data Modification Application') );
		
		if( config.directory ){
			showService = config.directory.showService;
			exportService = config.directory.exportService;
			searchService = config.directory.searchService;
			
			// This application does not use hash to keep track of currently
			// selected document.
			if( config.directory.historyTracker 
			 && config.directory.historyTracker.options ) {
				config.directory.historyTracker.options.disabled = true;
			};
		};
		
		// Install transforms
		documentTransforms.push(new DocumentTransformTextReplace());
		documentTransforms.push(new DocumentTransformJavascript());
		documentTransforms.push(new DocumentTransformOnFunction(resubmitMediaInList, 'Resubmit Media'));
		documentTransforms.push(new DocumentTransformOnFunction(resubmitGeometriesInList, 'Resubmit Geometries'));
		
		$selectAppDiv
			.empty()
			.append( $('<div class="selectAppLists"><div>') )
			.append( $('<div class="selectAppListView"><div>') )
			.append( $('<div class="selectAppDocument"><div>') )
			;
		
		refreshAllLists();
		clearList();
		clearDocument();
		getLogsDiv();
		
		bs();

		log( _loc('Select application started') );
	};

	
	$n2.selectApp = {
		main: main
	};
})(jQuery,nunaliit2);
