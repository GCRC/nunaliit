/**
* @module n2es6/widget/BookBrowser
*/
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

/**
 * @function module:BookBrowser
 * @api
 */
var BookBrowser = (function($,$n2) {
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetBookBrowser'
 ;

//--------------------------------------------------------------------------
// Abstract class representing a Page in a Book. 
// A page is made up of:
// - a URL for an image
// - a document id (to select document associated with page)
// - an index value (to sort pages in a Book)
var Page = $n2.Class({

	imageUrl: null,
	
	docId: null,
	
	index: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			imageUrl: null
			,docId: null
			,index: null
		},opts_);

		this.imageUrl = opts.imageUrl;
		this.docId = opts.docId;
		this.index = opts.index;
	},
	
	/**
	 * Returns the URL associated with this page
	 */
	getImageUrl: function(){
		return this.imageUrl;
	},
	
	/**
	 * Returns the identifier of the document associated with this
	 * page. Returns null or undefined if the page is not associated with
	 * a document.
	 */
	getDocId: function(){
		return this.docId;
	},
	
	/**
	 * Returns an index representing the position of the page in the book.
	 */
	getIndex: function(){
		return this.index;
	}
});

//--------------------------------------------------------------------------
// Abstract class for the representation of a Book, which can be displayed in
// the BookBrowser. This is mainly a collection of ordered pages.
var Book = $n2.Class({
	
	pages: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
		},opts_);
		
		this.pages = null;
	},
	
	/**
	 * Returns an array of Page instances. Returns null or
	 * undefined if the pages are not yet loaded
	 */
	getPages: function(){
		return this.pages;
	},
	
	/**
	 * Load the pages associated with the book and calls one of
	 * the callbacks when it is done.
	 */
	loadPages: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(pages, book){}
			,onError: function(err){}
		},opts_);
		
		throw 'Subclasses of book must implement loadPages()';
	}
});
 
//--------------------------------------------------------------------------
// The book browser widget creates a vertical scrolling that displays individual
// pages from a book. Each page from the book is an image that is loaded only when
// in comes into view.
//
// When the book browser is scrolled, the currently seen page is used to generate a selection
// event through the dispatcher. The document selected is the one associated with the current
// page. The current page is determined as the one crossing the horizontal line dividing
// the book browser in halves.
//
// The book browser also listens to dispatcher events. When a selected doc id corresponds to
// one of the pages, then the book is scrolled to show that page.
// 
// The widget creates HTML elements in the following format:
// <div class="n2BookBrowser_container">
//    <div class="n2BookBrowser_content">
//       <div class="n2BookBrowser_pagesOuter" scrollTop="x"> <!-- this is where the scrolling happens -->
//          <div class="n2BookBrowser_pagesInner">
//             <!-- There is a div.n2BookBrowser_page for each page of the book -->
//             <div class="n2BookBrowser_page" style="position:relative;height:x">
//                <div class="n2BookBrowser_pageTitleContainer"> <!-- only if a title is specified -->
//                   <div class="n2BookBrowser_pageTitleContent">
//                      text (title)
//                   </div>
//                </div>
//                <div class="n2BookBrowser_pageImageContainer">
//                </div>
//             </div>
//             ...
//             <div class="n2BookBrowser_preview"> <!-- to display overlay of page title, momentarily -->
//                <div class="n2BookBrowser_previewContent">
//                   text (title)
//                </div>
//             </div>
//          </div>
//       </div>
//    </div>
// </div>
var BookBrowser = $n2.Class({
	
	dispatchService: null,
	
	pagePadding: null,
	
	pageResizing: null,
	
	book: null,
	
	elemId: null,
	
	focusDocId: null,

	lastScrollTop: null,

	lastPreviewTitle: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,pagePadding: 2
			,pageResizing: true
			,book: null
		},opts_);
		
		var _this = this;

		this.pagePadding = opts.pagePadding;
		this.pageResizing = opts.pageResizing;
		this.book = opts.book;
		this.focusDocId = undefined;
		this.lastScrollTop = undefined;
		this.lastPreviewTitle = undefined;
		
		this.dispatchService = opts.dispatchService;
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH, 'selected', fn);
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		$('<div>')
			.attr('id',this.elemId)
			.addClass('n2BookBrowser_container')
			.appendTo($container);
		
		this._display();
		
		$n2.log('BookBrowser', this);
		
		if( this.book ){
			this.book.loadPages({
				onSuccess: function(pages, book){
					_this._pagesChanged();
				}
				,onError: function(err){
					// ?
				}
			});
		};
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_display: function(){
		var _this = this;
		
		var pagePadding = this.pagePadding;
		
		var $elem = this._getElem()
			.empty();
		
		var $content = $('<div>')
			.addClass('n2BookBrowser_content')
			.appendTo($elem);

		var $pagesOuter = $('<div>')
			.addClass('n2BookBrowser_pagesOuter')
			.appendTo($content)
			.scroll(function(){
				_this._scrollChanged( $(this) );
				return false;
			});
		
		var $pagesInner = $('<div>')
			.addClass('n2BookBrowser_pagesInner')
			.appendTo($pagesOuter);

		var pages = this.book.getPages();
		if( pages ){
			var offset = pagePadding;
			for(var i=0,e=pages.length; i<e; ++i){
				var page = pages[i];
				
				if( !page._bookBrowser ){
					page._bookBrowser = {};
				};
				
				var $page = $('<div>')
					.addClass('n2BookBrowser_page')
					.css('position','relative')
					.appendTo($pagesInner);
				
				var pageId = $n2.utils.getElementIdentifier($page);
				
				page._bookBrowser.offset = offset;
				page._bookBrowser.pageId = pageId;
				
				if( page.imageHeight ){
					$page.css('height',page.imageHeight);
					var h = $page.height();
					//$n2.log('h:'+h+' imageHeight:'+page.imageHeight);
					offset += page.imageHeight;
				};
				
				offset += (2 * pagePadding);
				
				if( page.title ){
					var $pageTitleContainer = $('<div>')
						.addClass('n2BookBrowser_pageTitleContainer')
						.appendTo($page);
					var $pageTitleContent = $('<div>')
						.addClass('n2BookBrowser_pageTitleContent')
						.text( page.title )
						.appendTo($pageTitleContainer);
				};

				$('<div>')
					.addClass('n2BookBrowser_pageImageContainer')
					.appendTo($page);
			};
		};
		
		var $preview = $('<div>')
			.addClass('n2BookBrowser_preview')
			.appendTo($content);
		
		this._loadImages();
	},
	
	_pagesChanged: function(){
		//var pages = this.book.getPages();
		this._display();
		if( this.focusDocId ){
			this._selectDocId(this.focusDocId);
		};
	},
	
	_scrollChanged: function( $pagesOuter ){
		var _this = this;
		
		var scrollTop = $pagesOuter.scrollTop();

		var $elem = this._getElem();
		
		var middleOffset = 0;
		var $outer = $elem.find('.n2BookBrowser_pagesOuter');
		if( $outer.length > 0 ){
			middleOffset = $outer.height() / 2;
		};
		
		var bookOffset = scrollTop + middleOffset;
		var page = this._getPageFromOffset(bookOffset);

		var $preview = $elem.find('.n2BookBrowser_preview');
		if( page ){
			if( page.title 
			 && this.lastPreviewTitle !== page.title ){
				this.lastPreviewTitle = page.title;

				$preview.empty();
				
				$('<div>')
					.addClass('n2BookBrowser_previewContent')
					.text(page.title)
					.appendTo($preview)
					.delay(500)
					.fadeOut(300,function(){
						_this._getElem().find('.n2BookBrowser_preview').empty();
					})
					;
			};
			
			this._pageInFocus(page);
		};
		
		// Wait a bit before loading images
		this.lastScrollTop = scrollTop;
		window.setTimeout(function(){
			if( _this.lastScrollTop === scrollTop ){
				_this._loadImages();
			};
		},500);
	},
	
	_pageInFocus: function(page){
		var _this = this;
		var docId = page.docId;
		
		if( this.focusDocId !== docId ){
			this.focusDocId = docId;
			window.setTimeout(function(){
				if( _this.focusDocId === docId ){
					if( _this.dispatchService ){
						_this.dispatchService.send(DH,{
							type: 'userSelect'
							,docId: docId
						});
					};
				};
			},800);
		};
	},
	
	_getPageFromOffset: function(bookOffset){
		var page = undefined;

		var pages = this.book.getPages();
		if( pages ){
			for(var i=0,e=pages.length; i<e; ++i){
				var page = pages[i];

				if( page._bookBrowser ){
					var startOffset = page._bookBrowser.offset;
					var endOffset = startOffset + page.imageHeight;
					
					if( startOffset <= bookOffset 
					 && bookOffset <= endOffset ){
						return page;
					};
				};
			};
		};
		
		return page;
	},
	
	_getPageFromPageId: function(pageId_){
		var pages = this.book.getPages();
		if( pages ){
			for(var i=0,e=pages.length; i<e; ++i){
				var page = pages[i];

				if( page._bookBrowser ){
					var pageId = page._bookBrowser.pageId;
					
					if( pageId_ === pageId ){
						return page;
					};
				};
			};
		};
		
		return undefined;
	},
	
	_getViewportMiddleOffset: function(){
		var $elem = this._getElem();
		var $pagesOuter = $elem.find('.n2BookBrowser_pagesOuter');
		var scrollTop = $pagesOuter.scrollTop();
		var middleOffset = 0;
		var $outer = $elem.find('.n2BookBrowser_pagesOuter');
		if( $outer.length > 0 ){
			middleOffset = $outer.height() / 2;
		};
		var computedOffset = scrollTop + middleOffset;
		return computedOffset;
	},

	_selectDocId: function(docId){
		var bookOffset = this._getViewportMiddleOffset();

		var currentPage = this._getPageFromOffset(bookOffset);
		if( currentPage ){
			var currentDocId = currentPage.getDocId();
			if( currentDocId === docId ){
				// No need to move the scroll
				return;
			};
		};
		
		var pages = this.book.getPages();
		if( pages ){
			for(var i=0,e=pages.length; i<e; ++i){
				var page = pages[i];

				if( page.docId === docId ){
					if( page._bookBrowser 
					 && typeof page._bookBrowser.offset === 'number' ){
						var $elem = this._getElem();
						var $pagesOuter = $elem.find('.n2BookBrowser_pagesOuter');
						$pagesOuter.scrollTop( page._bookBrowser.offset );
					};
				};
			};
		};
	},
	
	_loadImages: function(){
		var _this = this;
		var pages = this.book.getPages();
		if( pages ){
			var $elem = this._getElem();
			var $pagesOuter = $elem.find('.n2BookBrowser_pagesOuter');
			var bookOffsetTop = $pagesOuter.scrollTop();
			var bookOffsetBottom = bookOffsetTop + $pagesOuter.height();
			
			var unloadByPageId = {};
			var loadByPageId = {};

			for(var i=0,e=pages.length; i<e; ++i){
				var page = pages[i];

				if( page._bookBrowser 
				 && typeof page._bookBrowser.offset === 'number' ){
					var pageId = page._bookBrowser.pageId;
					var pageOffsetTop = page._bookBrowser.offset;
					var pageOffsetBottom = pageOffsetTop + page.imageHeight;
					
					if( pageOffsetTop > bookOffsetBottom 
					 || pageOffsetBottom < bookOffsetTop ){
						// Not currently visible
						unloadByPageId[pageId] = page;
						
					} else {
						// Currently visible, or partly visible
						loadByPageId[pageId] = page;

						// Load page after
						var nextIndex = i + 1;
						if( nextIndex < pages.length ){
							var nextPage = pages[nextIndex];
							if( nextPage._bookBrowser 
							 && nextPage._bookBrowser.pageId ){
								var nextPageId = nextPage._bookBrowser.pageId;
								loadByPageId[nextPageId] = nextPage;
							};
						};

						// Load previous
						var previousIndex = i - 1;
						if( previousIndex >= 0 ){
							var previousPage = pages[previousIndex];
							if( previousPage._bookBrowser 
							 && previousPage._bookBrowser.pageId ){
								var previousPageId = previousPage._bookBrowser.pageId;
								loadByPageId[previousPageId] = previousPage;
							};
						};
					};
				};
			};

			// Load pages
			for(var pageId in loadByPageId){
				var page = loadByPageId[pageId];
				var $page = $('#'+pageId);

				// Do not unload loaded pages
				if( unloadByPageId[pageId] ){
					delete unloadByPageId[pageId];
				};
				
				var imageUrl = page.getImageUrl();
				if( imageUrl ){
					var $imageContainer = $page.find('.n2BookBrowser_pageImageContainer');
					var $image = $imageContainer.find('img');
					if( $image.length < 1 ){
						// Must load
						$('<img>')
							.addClass('n2BookBrowser_pageImage')
							.attr('n2PageId',pageId)
							.load(function(){
								var $img = $(this);
								var height = $img.height();
								var pageId = $img.attr('n2PageId');
								_this._setPageHeight(pageId,height);
								return true;
							}) // must come before setting src attribute
							.attr('src',imageUrl)
							.appendTo($imageContainer);
					};
				};
			};

			// Unload pages
			for(var pageId in unloadByPageId){
				var page = loadByPageId[pageId];
				var $page = $('#'+pageId);

				var $imageContainer = $page.find('.n2BookBrowser_pageImageContainer');
				$imageContainer.find('img').remove();
			};
		};
	},
	
	_setPageHeight: function(pageId,height){
		if( this.pageResizing ){
			var page = this._getPageFromPageId(pageId);
			if( page 
			 && page.imageHeight !== height ){
				// About to resize a page. Get offset of current page. Resize the page.
				// Recompute all page offsets. Re-adjust the the scrollTop so that the
				// same offset in the current page is preserved.
				
				// ... compute offset into current page
				var bookOffset = this._getViewportMiddleOffset();
				var currentPage = this._getPageFromOffset(bookOffset);
				var currentPageRatio = undefined;
				if( currentPage 
				 && currentPage._bookBrowser 
				 && typeof currentPage._bookBrowser.offset === 'number' 
				 && typeof currentPage.imageHeight === 'number' 
				 && currentPage.imageHeight > 0 ){
					currentPageRatio = (bookOffset - currentPage._bookBrowser.offset) / currentPage.imageHeight;
					if( currentPageRatio < 0 ){
						currentPageRatio = 0;
					};
					if( currentPageRatio > 1 ){
						currentPageRatio = 1;
					};
				};
				
				// ... resize page
				page.imageHeight = height;
				var $page = $('#'+pageId);
				$page.css('height',page.imageHeight);

				// ... recompute page offsets for all pages
				var pagePadding = this.pagePadding;
				var pages = this.book.getPages();
				if( pages ){
					var offset = pagePadding;
					for(var i=0,e=pages.length; i<e; ++i){
						var page = pages[i];
						
						if( !page._bookBrowser ){
							page._bookBrowser = {};
						};
						
						page._bookBrowser.offset = offset;
						
						if( page.imageHeight ){
							offset += page.imageHeight;
						};
						
						offset += (2 * pagePadding);
					};
				};
				
				// ... reposition book so that same offset in the current
				// page is displayed
				if( typeof currentPageRatio === 'number' ){
					var effectiveOffset = currentPage._bookBrowser.offset +
						(currentPageRatio * currentPage.imageHeight);

					var $elem = this._getElem();
					var middleOffset = 0;
					var $outer = $elem.find('.n2BookBrowser_pagesOuter');
					if( $outer.length > 0 ){
						middleOffset = $outer.height() / 2;
					};

					var viewPortTopOffset = effectiveOffset - middleOffset;
					if( viewPortTopOffset < 0 ){
						viewPortTopOffset = 0;
					};

					var $pagesOuter = $elem.find('.n2BookBrowser_pagesOuter');
					$pagesOuter.scrollTop(viewPortTopOffset);
				};
			};
		};
	},

	_handle: function(m, addr, dispatcher){
		if( 'selected' === m.type ){
			var docId = m.docId;
			this.focusDocId = docId;
			this._selectDocId(docId);
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'bookBrowser' ){
		m.isAvailable = true;
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'bookBrowser' ){
		var widgetOptions = m.widgetOptions;
		var contentId = m.contentId;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var opName in widgetOptions){
				options[opName] = widgetOptions[opName];
			};
		};
		
		options.contentId = contentId;
		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
		};
		
		new BookBrowser(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetBookBrowser = {
	BookBrowser: BookBrowser
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
	,Book: Book
	,Page: Page
};

})(jQuery,nunaliit2);

export default BookBrowser;
