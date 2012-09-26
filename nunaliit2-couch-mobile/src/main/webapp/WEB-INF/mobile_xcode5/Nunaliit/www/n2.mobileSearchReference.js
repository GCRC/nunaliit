;(function($,$n2){

//=============================================================
var CreatePage = $n2.Class({
	
	options: null
	
	,pageId: null
	
	,selectedDocId: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,onSuccess: function(docId){}
			,onCancel: function(){}
		},opts_);
		
		this.pageId = 'reference_'+$n2.getUniqueId();
		
		this.createPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCurrentDb: function(){
		return this.options.currentDb;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDb: function(){
		return this.options.currentDb.getDb();
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $('#'+this.pageId);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createPage: function(){

		var _this = this;
		var pageId = this.pageId;
		var $pageContainer = this.getPageContainer();
		
		var documentBase = $.mobile.getDocumentBase(true);
		var absUrl = $.mobile.path.makeUrlAbsolute( pageId, documentBase.hrefNoHash );
		var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
		
		var $newPage = $pageContainer.children('#'+pageId);
		if( $newPage.length < 1 ) {
			// Create page
			$newPage = $('<div id="'+pageId+'" data-url="'+dataUrl+'" data-role="page" data-add-back-btn="true" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1><span class="mobileSearchReferenceLabel"></span></h1></div>');
			$newPage.append('<div class="mobileSearchReferenceContent" data-role="content" data-theme="d"></div>');
			$newPage.append('<div class="mobileSearchReferenceFooter" data-role="footer" data-theme="b"></div>');
			
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $page = $(this),
					prEvent = new $.Event( "pageremove" );

				$page.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$page.removeWithDependents();
				};
				
				if( _this.selectedDocId ){
					_this.options.onSuccess(_this.selectedDocId);
				} else {
					_this.options.onCancel();
				};
			});
		};
		
		this.pageId = pageId;
		
		this.showDocument();
		
		// Load this page
		$.mobile.changePage($newPage);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,showDocument: function(){
		var _this = this;
		
		var currentDb = this.getCurrentDb();
		
		var $page = this.getPage();
		var $content = $page.find('.mobileSearchReferenceContent');
		var $label = $page.find('.mobileSearchReferenceLabel');
		
		// Label
		$label.text('Search for Reference');

		// Describe content
		$content.empty();
		
		// Search bar
		var $searchDiv = $('<div class="mobileSearchReferenceSearch"></div>');
		$content.append($searchDiv);

		$('<input class="mobileSearchReferenceInput" type="text" data-type="search" autocapitalize="off" autocorrect="off" returnkey="search"/>')
			.appendTo($searchDiv)
			.bind('keyup',function(e){
				if( e && 13 == e.keyCode ) {
					var text = $(this).val();
					_this._search(text);
				};
				return false;
			})
			;
		
		// Content
		var $contentDiv = $('<div class="mobileSearchReferenceResult"></div>');
		$content.append($contentDiv);
		
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_search: function(text){
		var _this = this;
		
		var $page = this.getPage();
		var $search = $page.find('.mobileSearchReferenceResult');

		$search.empty();
		
		var request = this.options.currentDb.getSearchServer().submitRequest(
			text
			,{
				searchLimit: 50
				,onlyFinalResults: false
				,onSuccess: function(searchResults){
					_this._receiveSearchResults(searchResults);
				}
			}
		);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_receiveSearchResults: function(searchResults){
		var _this = this;
		
		var showService = this.options.currentDb.getShowService();

		var $page = this.getPage();
		var $search = $page.find('.mobileSearchReferenceResult');

		$search.empty();

		for(var i=0, e=searchResults.sorted.length; i<e; ++i){
			var r = searchResults.sorted[i];
			var $a = $('<a href="#" data-role="button"></a>');
			installClick($a,r.id);
			$search.append($a);

			$a.button();
			var btnWidget = $.data($a[0],'button');
			if( !btnWidget ) {
				var $s = $a.find('.ui-btn-text');
			} else if( btnWidget.button ) {
				var $s = btnWidget.button.find('.ui-btn-text');
			} else if( btnWidget.element ) {
				var $s = btnWidget.element.find('.ui-btn-text');
			};
			showService.printBriefDescription($s, r.id);
		};
		
		function installClick($a,id){
			$a.click(function(){
				_this._selectDocId(id);
				return false;
			});
		};
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_selectDocId: function(docId){
		this.selectedDocId = docId;
		window.history.back();
	}
});

$n2.mobile.searchReference = {
	CreatePage: CreatePage
};

})(jQuery,nunaliit2);