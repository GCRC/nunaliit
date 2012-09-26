;(function($,$n2){

//=============================================================
var MobileMediaEditor = $n2.Class({
	
	options: null
	
	,pageId: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,doc: null
			,attachmentName: null
			,onClosed: function(){}
		},opts_);
		
		this.pageId = 'editMedia_' + $n2.getUniqueId();

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
		var $pageContainer = this.getPageContainer();
		
		var documentBase = $.mobile.getDocumentBase(true);
		var absUrl = $.mobile.path.makeUrlAbsolute( this.pageId, documentBase.hrefNoHash );
		var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
		
		var $newPage = $pageContainer.children('#'+this.pageId);
		if( $newPage.length < 1 ) {
			// Create page
			$newPage = $('<div id="'+this.pageId+'" data-url="'+dataUrl+'" data-role="page" data-add-back-btn="true" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1>Edit Media&nbsp;&nbsp;<span class="mobileEditMediaLabel"></span></h1></div>');
			$newPage.append('<div class="mobileEditMediaContent" data-role="content" data-theme="d"></div>');
			$newPage.append('<div class="mobileEditMediaFooter" data-role="footer" data-theme="b"></div>');
			
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $page = $(this),
					prEvent = new $.Event('pageremove');

				$page.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$page.removeWithDependents();
				};
				
				_this.options.onClosed();
			});
		};
		
		this._editMedia();
		
		// Load this page
		var newPageOptions = {
		};
		$.mobile.changePage($newPage, newPageOptions);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_editMedia: function(){
		var _this = this;
		
		var currentDb = this.getCurrentDb();
		var attName = this.options.attachmentName;
		var doc = this.options.doc;
		
		var $page = this.getPage();
		var $content = $page.find('.mobileEditMediaContent');
		var $label = $page.find('.mobileEditMediaLabel');
		var $footer = $page.find('.mobileEditMediaFooter');
		
		$label.empty();
		$content.empty();
		$footer.empty();

		// Label
		$label.text(attName);

		// Report type and size
		if( doc._attachments
		 && doc._attachments[attName] ) {
			var _att = doc._attachments[attName];
			
			if( _att.content_type ) {
				$content.append( $('<div>Type: '+_att.content_type+'</div>') );
			};
			
			if( _att.length ) {
				$content.append( $('<div>Size: '+_att.length+'</div>') );
			};
		};
		
		// Display media
		var $div = $('<div></div>');
		$content.append( $div );
		$n2.mobile.DisplayMedia(this.getDb(), $div, doc, attName);
		
		// Remove button
		var $removeButton = $('<a href="#" data-role="button" data-theme="e" data-icon="delete">Remove File</a>');
		$content.append( $removeButton );
		$removeButton.click(function(){
			if( confirm('Are you sure you want to remove this media from the document?') ) {
				if( doc && doc._attachments && doc._attachments[attName] ) {
					delete doc._attachments[attName];
				};
				if( doc 
				 && doc.nunaliit_attachments 
				 && doc.nunaliit_attachments.files 
				 && doc.nunaliit_attachments.files[attName] ) {
					delete doc.nunaliit_attachments.files[attName];
				};
				
				// Close this window
				window.history.back();
			};
			return false;
		});
		
		$page.trigger('create');
	}
});


$n2.mobile.MobileMediaEditor = MobileMediaEditor;

})(jQuery,nunaliit2);