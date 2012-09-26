;(function($,$n2){

//=============================================================
function jqmRefreshPage(){
	if( $.mobile.fixedToolbars ) {
		window.setTimeout(function(){
			$.mobile.fixedToolbars.show(true);
		},100);
	};
};

//=============================================================
var MainPage = $n2.Class({
	
	options: null

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			config: null
			,pageId: null
		},opts_);

		var _this = this;
		
		this.options.config.addSetCurrentDbListener(function(){
			_this.refreshPage();
		});
		this.options.config.addSyncCurrentDbListener(function(){
			_this.refreshPage();
		});
		
		this.refreshPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getConfig: function(){
		return this.options.config;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $('#'+this.options.pageId);
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,refreshPage: function(){
		var _this = this;
		
		var config = this.getConfig();
		var $page = this.getPage();
		var $content = $page.find('.mobileMainContent');
		$content.empty();
		var $label = $page.find('.mobileMainDbLabel');
		$label.empty();

		// Install new doc button
		$page.find('a.mobileMainNewDoc').click(function(){
			_this._createNewDoc();
			return false;
		}).removeClass('mobileMainNewDoc');
		
		var currentDb = null;
		var db = null;
		var designDoc = null;
		var connection = null;
		var rootSchemas = {};
		
		$n2.mobile.ShowWaitScreen('Updating List');
		
		config.getCurrentDb({
			onSuccess: function(currentDb_){
				currentDb = currentDb_;
				
				if( !currentDb 
				 || !currentDb.getDb() ) {
					$content.html('<p>Click the "Settings" button above to add a server to work with.</p>');
					done();
					
				} else {
					// Label
					connection = currentDb.getConnection();
					if( connection ) {
						$label.text(': '+connection.getLabel());
					};
					
					$n2.mobile.ShowWaitScreen('Preparing Search Operations');

					currentDb.getDesignDoc().queryView({
						viewName:'text-search'
						,limit: 25
						,onSuccess: installSearchBar
						,onError: function(err){ 
							alert('Unable to prepare search operations ('+err+')');
							done();
						}
					});
				};
			}
			,onError: error
		});
		
		function installSearchBar(){
			$n2.mobile.HideWaitScreen();
			
			// Search bar
			var $searchDiv = $('<div class="mobileMainSearch"></div>');
			$content.append($searchDiv);

			$('<input class="mobileMainSearchInput" type="text" data-type="search" autocapitalize="off" autocorrect="off" returnkey="search"/>')
				.appendTo($searchDiv)
//				.bind('change',function(e){
//					var text = $(this).val();
//					$(this).blur();
//					_this._searchTermsChanged(text);
//				})
				.bind('keyup',function(e){
					if( e && 13 == e.keyCode ) {
						var text = $(this).val();
						$(this).blur();
						_this._searchTermsChanged(text);
					};
					return false;
				})
				;
			
			// Content
			var $contentDiv = $('<div class="mobileMainSearchResult"></div>');
			$content.append($contentDiv);
			
			$contentDiv.html('<p>Use search field above to find a document. Enter search words and press "enter".</p>');

			done();
		};

		function error(str){
			$n2.mobile.logger.log('Error on main page: '+str);
			done();
		};

		function done(){
			$n2.mobile.HideWaitScreen();
			$content.trigger('create');
			jqmRefreshPage();
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_createNewDoc: function(){
		this.getConfig().getCurrentDb({
			onSuccess: function(currentDb){
				if( currentDb ) {
					new $n2.mobile.CreateNewDocument({
						currentDb: currentDb
					});
				};
			}
			,onError: function(err){}
		});
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_searchTermsChanged: function(text){
		var _this = this;
		
		var $page = this.getPage();
		var $search = $page.find('.mobileMainSearchResult');

		$search.empty();
		
		$n2.mobile.ShowWaitScreen('Searching...');

		this.getConfig().getCurrentDb({
			onSuccess: function(currentDb){
				if( currentDb ) {
					currentDb.getSearchServer().submitRequest(
						text
						,{
							searchLimit: 50
							,onlyFinalResults: true
							,strict: true
							,onSuccess: function(searchResults){
								$n2.mobile.HideWaitScreen();
								_this._receiveSearchResults(currentDb, searchResults);
							}
							,onError: function(err){
								$n2.mobile.HideWaitScreen();
								alert('Error while searching');
							}
						}
					);
				} else {
					$n2.mobile.HideWaitScreen();
					alert('Unable to connect to database');
				};
			}
			,onError: function(err){
				$n2.mobile.HideWaitScreen();
				alert('Unable to connect to database');
			}
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_receiveSearchResults: function(currentDb, searchResults){
		var _this = this;
		
		var showService = currentDb.getShowService();

		var $page = this.getPage();
		var $search = $page.find('.mobileMainSearchResult');
		var limit = 100;
		
		$search.empty();
		
		if( !searchResults.sorted.length ) {
			$search.html('<p>No results found.</p>');
		} else {
			
			if( searchResults.sorted.length > limit ) {
				$search.append( $('<p>Only '+limit+' results displayed. Please, refine your search further.</p>') );
			};

			var $listview = $('<ul style="margin-top:10px;"></ul>');
			$search.append($listview);
			
			for(var i=0, e=searchResults.sorted.length; i<e && i<limit; ++i){
				var r = searchResults.sorted[i];
				var url = $n2.mobile.MobileViewer.ComputeUrlFromId(r.id);
				var $li = $('<li><a href="'+url+'"></a></li>');
				$listview.append( $li );
				showService.printBriefDescription($li.find('a'), r.id);
			};
			
			$listview.listview();
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
//	,_refreshPage: function(){
//		var _this = this;
//		
//		var config = this.getConfig();
//		var $page = this.getPage();
//		var $content = $page.find('.mobileMainContent');
//		$content.empty();
//		var $label = $page.find('.mobileMainDbLabel');
//		$label.empty();
//
//		var currentDb = null;
//		var db = null;
//		var designDoc = null;
//		var connection = null;
//		var rootSchemas = {};
//		
//		$n2.mobile.ShowWaitScreen('Updating List');
//		
//		config.getCurrentDb({
//			onSuccess: function(currentDb_){
//				currentDb = currentDb_;
//				
//				if( !currentDb 
//				 || !currentDb.getDb() ) {
//					$content.html('<p>Click the "Settings" button above to add a server to work with.</p>');
//					done();
//					return;
//				};
//				
//				db = currentDb.getDb();
//				designDoc = currentDb.getDesignDoc();
//				connection = currentDb.getConnection();
//				
//				if( connection ) {
//					$label.text(': '+connection.getLabel());
//				};
//				
//				// Install new doc button
//				$page.find('a.mobileMainNewDoc').click(function(){
//					new $n2.mobile.CreateNewDocument({
//						currentDb: currentDb
//					});
//					return false;
//				}).removeClass('mobileMainNewDoc');
//				
//				getRootSchemas();
//			}
//			,onError: error
//		});
//		
//		function getRootSchemas(){
//			currentDb.getSchemaRepository().getRootSchemas({
//				onSuccess: function(rootSchemas_){
//					for(var i=0,e=rootSchemas_.length; i<e; ++i){
//						var schema = rootSchemas_[i];
//						rootSchemas[schema.name] = schema;
//					};
//					getDbDocIds();
//				}
//				,onError: getDbDocIds
//			});
//		};
//
//		function getDbDocIds(){
//			var docIds = [];
//			designDoc.queryView({
//				viewName: 'document-list'
//				,onSuccess: function(rows){
//					for(var i=0,e=rows.length; i<e; ++i){
//						var docId = rows[i].key;
//						docIds.push(docId);
//					};
//
//					getDbDocuments(docIds);
//				}
//				,onError: error
//			});
//		};
//
//		function getDbDocuments(docIds){
//			db.getDocuments({
//				docIds: docIds
//				,onSuccess: reportDocuments
//				,onError: error
//			});
//		};
//
//		function reportDocuments(docs){
//			var $list = $('<ul id="mobileMainList" data-role="listview" data-filter="true" data-theme="d"></ul>');
//			$content.append($list);
//			for(var i=0,e=docs.length; i<e; ++i){
//				var doc = docs[i];
//				
//				if( doc.nunaliit_schema
//				 && rootSchemas[doc.nunaliit_schema]
//				 && rootSchemas[doc.nunaliit_schema].briefTemplate ) {
//					// print brief description
//					var $a = $('<a href="doc_'+doc._id+'"></a>');
//					rootSchemas[doc.nunaliit_schema].brief(doc,$a);
//					$a.append( $('<span> ('+doc._id+')</span>') );
//					var $li = $('<li></li>');
//					$li.append($a);
//					$list.append( $li );
//					
//				} else {
//					$list.append( $('<li><a href="doc_'
//						+doc._id+'">'
//						+doc._id
//						+'</a></li>') );
//				};
//			};
//			
//			done();
//		};
//
//		function error(str){
//			$n2.mobile.logger.log('Error on main page: '+str);
//			done();
//		};
//
//		function done(){
//			$n2.mobile.HideWaitScreen();
//			$content.trigger('create');
//			jqmRefreshPage();
//		};
//	}
});

$n2.mobile.MainPage = MainPage;

})(jQuery,nunaliit2);