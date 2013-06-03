;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var schemaRepository = null;
	var showService = null;
	var exportService = null;
	var couchEditor = null;
	var $selectAppDiv = null;
	var documentTransforms = [];
	var allLists = [];
	var selectedList = null;

	// **********************************************************************
	var ProgressDialog = $n2.Class({
		
		dialogId: null
		
		,onCancelFn: null
		
		,cancellingLabel: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				title: _loc('Progress')
				,onCancelFn: null
				,cancelButtonLabel: _loc('Cancel') 
				,cancellingLabel: _loc('Cancelling Operation...')
			},opts_);
			
			var _this = this;
			
			this.dialogId = $n2.getUniqueId();
			this.onCancelFn = opts.onCancelFn;
			this.cancellingLabel = opts.cancellingLabel;

			var $dialog = $('<div id="'+this.dialogId+'">'
				+'<span class="selectAppLabel"></span>: <span class="selectAppProgress"></span>'
				+'</div>');
			$dialog.find('span.selectAppLabel').text( _loc('Progress') );
			
			var dialogOptions = {
				autoOpen: true
				,title: opts.title
				,modal: true
				,closeOnEscape: false
				,close: function(event, ui){
					var diag = $(event.target);
					diag.dialog('destroy');
					diag.remove();
				}
			};
			$dialog.dialog(dialogOptions);
			
			// Remove close button
			$dialog.parents('.ui-dialog').first().find('.ui-dialog-titlebar-close').hide();

			// Add cancel button, if needed
			if( typeof(opts.onCancelFn) === 'function'  ) {
				var cancelLine = $('<div><button class="n2ProgressModalCancel"></button></div>');
				$dialog.append(cancelLine);
				cancelLine.find('button')
					.text(opts.cancelButtonLabel)
					.click(function(){
						_this.cancel();
						return false;
					})
					;
			};
			
			this.updatePercent(0);
		}
	
		,cancel: function(){
			if( typeof(this.onCancelFn) === 'function' ) {
				var $dialog = $('#'+this.dialogId);
				var $cb = $dialog.find('.n2ProgressModalCancel');
				var $m = $('<span></span>').text(this.cancellingLabel);
				$cb.before($m).remove();
				
				this.onCancelFn();
			};
		}
	
		,close: function(){
			var $dialog = $('#'+this.dialogId);
			$dialog.dialog('close');
		}
	
		,updatePercent: function(percent){
			var $dialog = $('#'+this.dialogId);
			var $p = $dialog.find('.selectAppProgress');
			$p.text( ''+Math.floor(percent)+'%' );
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
				name: null
				,options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;

			if( typeof(this.getFilterFunction) !== 'function' ) {
				opts.onError('Subclass must implement function getFilterFunction()');
				return;
			};
			
			this.getFilterFunction({
				options: opts.options
				,onSuccess: function(filterFn, createName){
					if( !opts.name ) {
						opts.name = createName;
					};
					if( !opts.name ) {
						opts.name = _this.name;
					};
					_this.createListFilterAllDocs({
						filterFn: filterFn
						,name: opts.name
						,progressTitle: opts.progressTitle
						,onSuccess: opts.onSuccess
						,onError: opts.onError
					});
				}
				,onError: opts.onError
			});
		}
		
		,createListFilterAllDocs: function(opts_){
			var opts = $n2.extend({
				filterFn: null
				,name: null
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
			
			if( !opts.name ) {
				opts.name = this.name;
			};

			var progressDialog = new ProgressDialog({
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
				
				_this.createListFilterDocIds({
					filterFn: opts.filterFn
					,name: opts.name
					,docIds: allDocIds_
					,progressTitle: opts.progressTitle
					,onSuccess: opts.onSuccess
					,onError: opts.onError
				});
			};
		}
		
		,createListFilterDocIds: function(opts_){
			var opts = $n2.extend({
				filterFn: null
				,name: null
				,docIds: null
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
			
			if( !opts.name ) {
				opts.name = this.name;
			};

			var opCancelled = false;
			var progressDialog = new ProgressDialog({
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
						,onSuccess: receiveDocs
						,onError: function(err){
							progressDialog.close();
							opts.onError( _loc('Unable to retrieve documents')+': '+err);
						}
					});
				} else {
					progressDialog.updatePercent(100);

					// List is complete
					var l = new DocumentList({
						docIds: filteredDocIds
						,name: opts.name
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

				for(var i=0, e=docs.length; i<e; ++i){
					if( opts.filterFn(docs[i]) ){
						filteredDocIds.push(docs[i]._id);
					};
				};
				nextFetch();
			};
			
			function cancel(){
				reportError( _loc('Operation cancelled by user') );
				progressDialog.close();
			};
		}
		
		,refineList: function(opts_){
			var opts = $n2.extend({
				list: null
				,name: null
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
			if( !opts.name ){
				opts.onError( _loc('A name must be provided when refining a list') );
				return;
			};
			if( typeof(this.getFilterFunction) !== 'function' ) {
				opts.onError('Subclass must implement function getFilterFunction()');
				return;
			};
			
			this.getFilterFunction({
				options: opts.options
				,onSuccess: function(filterFn){
					_this.createListFilterDocIds({
						filterFn: filterFn
						,name: opts.name
						,docIds: opts.list.docIds
						,progressTitle: opts.progressTitle
						,onSuccess: opts.onSuccess
						,onError: opts.onError
					});
				}
				,onError: opts.onError
			});
		}
	});
	
	SearchFilter.availableSearchFilters = [];
	SearchFilter.availableCreateFilters = [];
	
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
		for(var i=0,e=SearchFilter.availableCreateFilters.length; i<e; ++i) {
			var searchFilter = SearchFilter.availableCreateFilters[i];
			var $o = $('<option></option>');
			$o.text(searchFilter.name);
			$o.attr('value',searchFilter.id);
			$select.append( $o );
		};
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
			for(var i=0,e=SearchFilter.availableCreateFilters.length; i<e; ++i) {
				var searchFilter = SearchFilter.availableCreateFilters[i];
				if( searchFilter.id === id ) {
					return searchFilter;
				};
			};
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
			+'<div>'+_loc('Name of new list')+': <input type="text"/></div>'
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
					var listName = $dialog.find('input').val();
					var $options = $dialog.find('.searchFilterOptions');
					var filterId = $dialog.find('select.searchFilterSelector').val();
					
					if( !listName || '' === listName ){
						alert( _loc('A list name must be supplied') );
						$dialog.find('input').focus();
						return;
					};
	
					$dialog.dialog('close');

					var useFilter = findSearchFilterFromId(filterId);
					if( useFilter ) {
						useFilter.refineList({
							list: opts.list
							,name: listName
							,options: $options
							,onSuccess: opts.onSuccess
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
	var SearchFilterTextSearch = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('Text Search');
		}
	
		,printOptions: function($parent){
			var $options = $('<div>'
				+_loc('Search term')+': <input type="text"/>'
				+'</div>');
			$parent.append( $options );
		}
	
		,getFilterFunction: function(opts_){
			var opts = $n2.extend({
				options: null
				,onSuccess: function(filterFn, creationName){}
				,onError: reportError
			},opts_);

			var _this = this;
			
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
			opts.onSuccess(filterFn, _loc('All documents containing {searchTerm}',{
				searchTerm: searchTerm
			}));
			
			return false;
		}
	});
	
	SearchFilter.availableSearchFilters.push(new SearchFilterTextSearch());
	
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
			
			$options.find('textarea').val('function(doc){\n\t// return true for selected document\n}')

			$parent.append( $options );
		}

		,getFilterFunction: function(opts_){
			var opts = $n2.extend({
				options: null
				,onSuccess: function(filterFn, creationName){}
				,onError: reportError
			},opts_);
			var _this = this;
			
			var $options = opts.options;
			var script = $options.find('textarea').val();
			var scriptFn = null;
			try {
				eval('scriptFn = '+script);
				scriptFn({_id:'test',_revision:'1-abcde'});
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
	var CreateFilterAllDocs = $n2.Class(SearchFilter, {

		initialize: function(){
			SearchFilter.prototype.initialize.apply(this);
			this.name = _loc('All Documents');
		}
	
		,printOptions: function($parent){
		}

		,createList: function(opts_){
			var opts = $n2.extend({
				name: null
				,options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;

			atlasDb.listAllDocuments({
				onSuccess: function(docIds){
					var l = new DocumentList({
						docIds: docIds
						,name: _loc('All Documents')
					});
					opts.onSuccess(l);
				}
				,onError: opts.onError
			});
		}
	});

	SearchFilter.availableCreateFilters.push(new CreateFilterAllDocs());

	// **********************************************************************
	var CreateFilterByLayer = $n2.Class(SearchFilter, {

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
					var names = [];
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

		,createList: function(opts_){
			var opts = $n2.extend({
				name: null
				,options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;

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
						var l = new DocumentList({
							docIds: docIds
							,name: locStr
						});
						opts.onSuccess(l);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from layer')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableCreateFilters.push(new CreateFilterByLayer());

	// **********************************************************************
	var CreateFilterBySchemaType = $n2.Class(SearchFilter, {

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
					var names = [];
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

		,createList: function(opts_){
			var opts = $n2.extend({
				name: null
				,options: null
				,progressTitle: _loc('List Creation Progress')
				,onSuccess: function(list){}
				,onError: reportError
			},opts_);
			
			var _this = this;

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
						var l = new DocumentList({
							docIds: docIds
							,name: locStr
						});
						opts.onSuccess(l);
					}
					,onError: function(err){
						alert(_loc('Problem obtaining documents from schema')+': '+err);
						opts.onError(err);
					}
				});
			};
		}
	});

	SearchFilter.availableCreateFilters.push(new CreateFilterBySchemaType());

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
				,onCompleted: function(totalCount, skippedCount, okCount, failCount){}
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
				,onCompleted: function(totalCount, skippedCount, okCount, failCount){}
				,onError: reportError
			},opts_);
			
			var _this = this;

			if( !opts.list ) {
				opts.onError(_loc('List is required on transformation'));
				return;
			};
			if( !opts.transformFn ) {
				opts.onError(_loc('Function is required on transformation'));
				return;
			};

			var opCancelled = false;
			var progressDialog = new ProgressDialog({
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
			var failCount = 0;
			
			processNext();
			
			function processNext(){
				if( opCancelled ) {
					cancel();
					return;
				};

				if(docIdsLeft.length < 1){
					progressDialog.updatePercent(100);
					opts.onCompleted(totalCount, skippedCount, okCount, failCount);
					progressDialog.close();
				} else {
					if( totalCount ) {
						progressDialog.updatePercent( (skippedCount + okCount + failCount) * 100 / totalCount );
					} else {
						progressDialog.updatePercent(0);
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

				opts.transformFn(doc
					,function(){ // onTransformedFn
						saveDocument(doc);
					}
					,function(){ // onSkippedFn
						skippedCount += 1;
						processNext();
					}
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
			var _this = this;
			
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
			var _this = this;
			
			var dialogId = $n2.getUniqueId();
			var $dialog = $('<div id="'+dialogId+'" class="selectAppDocumentTransformJavascript">'
				+'<div>'+_loc('Javascript')+':<br/><textarea></textarea></div>'
				+'<div><button>'+_loc('OK')+'</button><button>'+_loc('Cancel')+'</button></div>'
				+'</div>');

			$dialog.find('textarea').val('function(doc, onTransformedFn, onSkippedFn){\n\t// return true for selected document\n}')

			$dialog.find('button')
				.first()
					.button({icons:{primary:'ui-icon-check'}})
					.click(function(){
						var $dialog = $('#'+dialogId);
						var script = $dialog.find('textarea').val();
						var scriptFn = null;
						try {
							eval('scriptFn = '+script);
							scriptFn({_id:'test',_revision:'1-abcde'},function(){},function(){});
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
	var DocumentList = $n2.Class({
		docIds: null
		
		,name: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				docIds: null
				,name: _loc('Unknown List')
			},opts_);
			
			this.docIds = opts.docIds;
			if( !this.docIds ){
				this.docIds = [];
			};
			
			this.name = opts.name;
		}
	
		,print: function(){
			var locStr = _loc('{count} document(s)',{
				count: this.docIds.length
			});
			return this.name + ' - ' + locStr;
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
		};
		
		function installView(list, $a){
			$a.click(function(e){
				e.stopPropagation();
				selectList(list);
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
		
		var $tx = $('<button></button>');
		$tx.text( _loc('Tranform') );
		$h.append($tx);
		$tx.click(function(){
			transformList(list);
			return false;
		});
		
		var $dx = $('<button></button>');
		$dx.text( _loc('Delete') );
		$h.append($dx);
		$dx.click(function(){
			deleteDocumentsFromList(list);
			return false;
		});
		
		var $rx = $('<button></button>');
		$rx.text( _loc('Refine List') );
		$h.append($rx);
		$rx.click(function(){
			SearchFilter.refineList({
				list: list
				,onSuccess: function(refinedList){
					addList(refinedList);
				}
			});
			return false;
		});
		
		var $ex = $('<button></button>');
		$ex.text( _loc('Export Geometries') );
		$h.append($ex);
		$ex.click(function(){
			exportList(list);
			return false;
		});
		
		var $resubmitMedia = $('<button></button>');
		$resubmitMedia.text( _loc('Re-Submit Media') );
		$h.append($resubmitMedia);
		$resubmitMedia.click(function(){
			resubmitMediaInList(list);
			return false;
		});

		for(var i=0,e=list.docIds.length; i<e; ++i){
			var docId = list.docIds[i];
			var $d = $('<div></div>');
			$div.append($d);
			
			var $a = $('<a href="#"></a>');
			$d.append($a);
			
			if( showService ) {
				showService.printBriefDescription($a, docId);
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
						useTransform.transformList({
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
				var progressDialog = new ProgressDialog({
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
			
			$('<div>'+_loc('Exporting')+' <span></span></div>')
				.find('span').text(list.print()).end()
				.appendTo($dialog);

			var $select = $('<select></select>');
			$dialog.append($select);
			$('<option value="all"></options>')
				.text( _loc('All Documents') )
				.appendTo($select);
			$('<option value="points"></options>')
				.text( _loc('All Point Geometries') )
				.appendTo($select);
			$('<option value="linestrings"></options>')
				.text( _loc('All LineString Geometries') )
				.appendTo($select);
			$('<option value="polygons"></options>')
				.text( _loc('All Polygon Geometries') )
				.appendTo($select);
			
			var inputId = $n2.getUniqueId();
			$('<div><label for="'+inputId+'">'+_loc('File Name')+': </label>'
				+'<input type="text" name="'+inputId+'" class="n2_export_fileNameInput" value="export.geojson"/>'
				+'</div>').appendTo($dialog);

			$('<div><button>'+_loc('Export')+'</button></div>')
				.appendTo($dialog);
			$dialog.find('button').click(function(){
				var $dialog = $('#'+dialogId);
				var geomType = $dialog.find('select').val();
				
				var fileName = $dialog.find('.n2_export_fileNameInput').val();
				if( '' === fileName ) {
					fileName = null;
				};
				
				$dialog.dialog('close');
				performExport(geomType,fileName);
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
		};
		
		function performExport(geomType,fileName){
			
			var windowId = $n2.getUniqueId();
			
			// Open a new window to get results
			open('about:blank', windowId);
			
			var docIds = list.docIds;
			exportService.exportByDocIds({
				docIds: list.docIds
				,targetWindow: windowId
				,geometryType: geomType
				,contentType: 'application/binary'
				,fileName: fileName
				,onError: function(err){
					alert(_loc('Error during export')+': '+err);
				}
			});
		};
	};
	
	// -----------------------------------------------------------------
	function resubmitMediaInList(list){
		var docIds = list.docIds;
		var errors = 0;
		var documentsModified = 0;
		
		processDocument(0);
		
		function processDocument(index){
			if( index >= docIds.length ) {
				// Finished
				var docModifiedStr = _loc('No document modified.');
				if( documentsModified > 0 ) {
					docModifiedStr = _loc('{count} document(s) modified.',{
						count: documentsModified
					});
				};
				
				if( errors > 0 ) {
					var locStr = _loc('Errors in process: {count}.',{
						count: errors
					});
					reportError(locStr+' '+docModifiedStr);
				} else {
					log(_loc('Process completed.')+' '+docModifiedStr);
				};
				return;
			};
			
			var docId = docIds[index];
			atlasDb.getDocument({
				docId: docId
				,onSuccess: function(doc){
					documentFetched(index, doc);
				}
				,onError: function(errorMsg){
					++errors;
					var locStr = _loc('Unable to obtain document {docId}',{
						docId: docId
					});
					reportError(locStr+': '+errorMsg);
					processDocument(index+1);
				}
			});
		};
		
		function documentFetched(index, doc){
			// Mark all attachments as submitted
			var updateRequired = false;
			var keysToRemove = [];
			
			if( doc.nunaliit_attachments 
			 && doc.nunaliit_attachments.files ) {
				for(var attName in doc.nunaliit_attachments.files){
					var att = doc.nunaliit_attachments.files[attName];
					att.status = 'submitted';
					updateRequired = true;
					
					if( att.thumbnail ) {
						keysToRemove.push(att.thumbnail);
					};
					
					if( att.originalAttachment ) {
						keysToRemove.push(att.originalAttachment);
					};
				};
			};
			
			// Remove thumbnails and original attachments
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
				atlasDb.updateDocument({
					data: doc
					,onSuccess: function(docInfo){
						++documentsModified;
						log('Updated '+doc._id);
						processDocument(index+1);
					}
					,onError: function(errorMsg){
						++errors;
						reportError('Unable to update document '+doc._id+': '+errorMsg);
						processDocument(index+1);
					}
				});
			} else {
				log( _loc('No media found on {docId}',{
					docId: doc._id
				}) );
				processDocument(index+1);
			};
		};
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
		
		var editDoc = $n2.extend(true,{},doc);
		
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
		schemaRepository = opts_.config.directory.schemaRepository;
		couchEditor = config.couchEditor;

		$selectAppDiv = opts_.div;
		
		$('.selectAppTitle').text( _loc('Data Modification Application') );
		
		if( config.directory ){
			showService = config.directory.showService;
			exportService = config.directory.exportService;
			
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