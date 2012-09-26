;(function($,$n2){

//=============================================================
var MobileSelectDialog = $n2.Class({
	
	options: null
	
	,diagId: null
	
	,selection: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			title: ''
			,selections: []
			,onSelect: function(selection){}
			,onCancel: function(){}
		},opts_);
		
		this.diagId = $n2.getUniqueId();
		
		this.createPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $.mobile.pageContainer.children('#'+this.diagId);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createPage: function(){

		var _this = this;
		
		var $newPage = this.getPage();
		if( $newPage.length < 1 ) {
			var documentBase = $.mobile.getDocumentBase(true);
			var absUrl = $.mobile.path.makeUrlAbsolute( this.diagId, documentBase.hrefNoHash );
			var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
			
			// Create page
			$newPage = $('<div id="'+this.diagId+'" data-url="'+dataUrl+'" data-role="page" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1><span class="mobileSelectDialogHeader"></span></h1></div>');
			$newPage.append('<div class="mobileSelectDialogContent" data-role="content" data-theme="c"></div>');
			
			var $pageContainer = this.getPageContainer();
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.dialog();
			$newPage.bind('pagehide',function(){
				var $this = $( this ),
					prEvent = new $.Event( "pageremove" );

				$this.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$this.removeWithDependents();
				};
				
				// After removing page, call client
				if( _this.selection ) {
					_this.options.onSelect(_this.selection);
				} else {
					_this.options.onCancel();
				};
			});
		};
		
		this._showSelections();
		
		// Load this page
		var newPageOptions = $.extend(
			{}
			,{
				role:'dialog'
				,transition:'pop'
			}
		);
		$.mobile.changePage($newPage,newPageOptions);

	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_showSelections: function(){
		var _this = this;
		
		var $page = this.getPage();
		var $header = $page.find('.mobileSelectDialogHeader');
		var $content = $page.find('.mobileSelectDialogContent');

		$header.text(this.options.title);

		$content.empty();
		
		for(var i=0,e=this.options.selections.length; i<e; ++i){
			var sel = this.options.selections[i];
			if( typeof(sel) === 'string' ) {
				var label = sel;
			} else {
				label = sel.label;
			};
			var $b = $('<a class="mobileMediaCaptureTakePicture" href="#" data-role="button"></a>');
			$b.text(label);
			this._installSelectionClick($b,i);
			$content.append( $b );
		};
		
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_installSelectionClick: function($button,selectionIndex){
		var _this = this;
		$button.click(function(){
			_this._select(selectionIndex);
			return false;
		});
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_select: function(selectionIndex){
		var _this = this;
		
		// Close dialog
		var $page = this.getPage();
		$page.dialog('close');

		// Wait until pop up was removed before calling client
		this.selection = this.options.selections[selectionIndex];
		//this.options.onSelect(sel);
	}
});

$n2.mobile.MobileSelectDialog = MobileSelectDialog;

})(jQuery,nunaliit2);