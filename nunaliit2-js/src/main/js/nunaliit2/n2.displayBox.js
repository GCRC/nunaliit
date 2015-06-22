/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//=========================================================================

var DisplayImageSource = $n2.Class({
	
	images: null,
	
	initialize: function(opts_){
//		var opts = $n2.extend({
//			
//		},opts_);
		
		this.images = [];
	},
	
	getCountInfo: function(index){
		var result = {
			count: this.images.length
			,index: (index + 1)
		};
		return result;
	},
	
	getInfo: function(index){
		var info = null;
		var image = this.images[index];
		if( image ){
			info = {
				index: index
				,url: image.url
				,type: image.type
				,isPhotosphere: image.isPhotosphere
				,width: image.width
				,height: image.height
			};
		};
		return info;
	},
	
	printText: function(index, $elem, cb){
		$elem.empty();
		
		var image = this.images[index];
		if( image && image.text){
			$elem.text(image.text);
			
			if( cb ){
				cb(index);
			};
		};
	},
	
	loadImage: function(index, cb){
		var _this = this;
		
		var image = this.images[index];
		if( image ){
			if( image.loaded ){
				if( cb ) {
					var info = this.getInfo(index);
					cb(info);
				};
			} else {
				if( cb ) {
					if( image.cb ) {
						image.cb.push(cb);
					} else {
						image.cb = [cb];
					};
				};

				if( !image.preload ) {
					image.preload = new Image();
					image.preload.onload = function() {

						var image = _this.images[index];
						
						image.loaded = true;
						
						// Save original width and height
						image.width = image.preload.width;
						image.height = image.preload.height;
						
						// Forget onload
						image.preload.onload=function(){};
						
						if( image.cb ){
							var cbs = image.cb;
							image.cb = null;
							
							var info = _this.getInfo(index);
							for(var i=0,e=cbs.length; i<e; ++i){
								cbs[i](info);
							};
						};
					};
					
					var info = this.getInfo(index);
					image.preload.src = info.url;
				};
			};
		};
	},
	
	addImage: function(url, text){
		this.images.push({
			url: url
			,text: text
			,type: 'image'
			,isPhotosphere: false
		});
	},
	
	addPhotosphere: function(url, text){
		this.images.push({
			url: url
			,text: text
			,type: 'image'
			,isPhotosphere: true
		});
	},
	
	getPreviousIndex: function(index, cb){
		if( this.images.length < 2 ) return;

		var previousIndex = index - 1;
		if( previousIndex < 0 ){
			previousIndex = this.images.length - 1;
		};
		
		cb(previousIndex, index);
	},
	
	getNextIndex: function(index, cb){
		if( this.images.length < 2 ) return;

		var nextIndex = index + 1;
		if( nextIndex >= this.images.length ){
			nextIndex = 0;
		};
		
		cb(nextIndex, index);
	}
});

//=========================================================================

var DisplayImageSourceDoc = $n2.Class({
	
	showService: null,
	
	images: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			showService: null
		},opts_);
		
		this.images = [];
		
		this.showService = opts.showService;
	},
	
	getCountInfo: function(index){
		var result = {
			count: this.images.length
			,index: (index + 1)
		};
		return result;
	},
	
	getInfo: function(index){
		var info = null;
		var image = this.images[index];
		if( image ){
			var doc = image.doc;
			var docSource = doc.__n2Source;
			var url = docSource.getDocumentAttachmentUrl(doc, image.attName);

			var type = image.att.fileClass;
			var isPhotoshpere = false;
			if( image.att.photosphere 
			 && 'panorama' === image.att.photosphere.type ){
				isPhotoshpere = true;
			};
			
			info = {
				index: index
				,url: url
				,type: type
				,isPhotosphere: isPhotoshpere
				,width: image.width
				,height: image.height
			};
		};
		return info;
	},
	
	printText: function(index, $elem, cb){
		$elem.empty();
		
		var image = this.images[index];
		if( image && this.showService ){
			this.showService.displayBriefDescription(
				$elem
				,{
					onDisplayed: displayed
				}
				,image.doc
			);
		};
		
		function displayed($elem, doc, schema, opt_){
			if( cb ){
				cb(index);
			};
		};
	},
	
	loadImage: function(index, cb){
		var _this = this;
		
		var image = this.images[index];
		if( image ){
			if( image.loaded ){
				if( cb ) {
					var info = this.getInfo(index);
					cb({
						index: index
						,url: info.url
						,type: info.type
						,isPhotosphere: info.isPhotosphere
						,width: image.width
						,height: image.height
					});
				};
			} else {
				if( cb ) {
					if( image.cb ) {
						image.cb.push(cb);
					} else {
						image.cb = [cb];
					};
				};

				if( !image.preload ) {
					var info = this.getInfo(index);
					
					image.preload = new Image();
					image.preload.onload = function() {

						var image = _this.images[index];
						
						image.loaded = true;
						
						// Save original width and height
						image.width = image.preload.width;
						image.height = image.preload.height;
						
						// Forget onload
						image.preload.onload=function(){};
						
						if( image.cb ){
							var cbs = image.cb;
							image.cb = null;
							
							for(var i=0,e=cbs.length; i<e; ++i){
								cbs[i]({
									index: index
									,url: info.url
									,type: info.type
									,isPhotosphere: info.isPhotosphere
									,width: image.width
									,height: image.height
								});
							};
						};
					};
					
					image.preload.src = info.url;
				};
			};
		};
	},
	
	addDocument: function(doc, attachmentName){
		var att = null;
		if( doc 
		 && doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files 
		 && doc.nunaliit_attachments.files[attachmentName] ){
			att = doc.nunaliit_attachments.files[attachmentName];
		};
		
		if( att ){
			this.images.push({
				doc: doc
				,att: att
				,attName: attachmentName
			});
		};
	},
	
	getPreviousIndex: function(index, cb){
		if( this.images.length < 2 ) return;
		
		var previousIndex = index - 1;
		if( previousIndex < 0 ){
			previousIndex = this.images.length - 1;
		};
		
		cb(previousIndex, index);
	},
	
	getNextIndex: function(index, cb){
		if( this.images.length < 2 ) return;

		var nextIndex = index + 1;
		if( nextIndex >= this.images.length ){
			nextIndex = 0;
		};
		
		cb(nextIndex, index);
	}
});

//=========================================================================
/*

<div id="nunaliit2_uniqueId_127" class="n2DisplayBoxOuter" style="top: 84.5px; left: 0px;">
	<!-- This div is for setting the top position -->
	<div class="n2DisplayBoxImageOuter" style="width: 906px; height: 685px;">
		<div class="n2DisplayBoxImageInner">
			<img class="n2DisplayBoxImage" src="./db/4ae77032f04d840a2f0fd8c7f1006562/GOPR0027.jpg" style="width: 886px; height: 665px; display: inline;">
			<a href="#" class="n2DisplayBoxNavBtn n2DisplayBoxNavBtnPrev" style="display: none; height: 685px;"></a>
			<a href="#" class="n2DisplayBoxNavBtn n2DisplayBoxNavBtnNext" style="display: none; height: 685px;"></a>
			<div class="n2DisplayBoxLoading" style="display: none;">
				<a class="n2DisplayBoxLoadingLink" href="#">
					<img class="n2DisplayBoxLoadingImg">
				</a>
			</div>
		</div>
	</div>
	<div class="n2DisplayBoxDataOuter" style="display: block; width: 886px;">
		<div class="n2DisplayBoxDataInner">
			<div class="n2DisplayBoxDataDetails">
				<span class="n2DisplayBoxDataCaption n2ShowUpdateDoc_4ae77032f04d840a2f0fd8c7f1006562 n2ShowDocBrief" style="display: inline;">
					<span class="n2s_localized">Demo Media</span>
					(Breakfast at Voyageur Camp)
				</span>
				<span class="n2DisplayBoxDataNumber" style="display: block;">1/1</span>
			</div>
			<div class="n2DisplayBoxButtons">
				<a href="#" class="n2DisplayBoxButtonClose"></a>
			</div>
		</div>
	</div>
</div>

 */

var DisplayBox = $n2.Class({
	
	overlayId: null,
	
	displayDivId: null,
	
	settings: null,
	
	windowResizeHandler: null,

	resizing: null,
	
	imageSource: null,
	
	currentImageIndex: null,

	/* Information about height and width */
	currentImage: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,text: null
			,imageSource: null
			,startIndex: 0
		},opts_);
		
		var _this = this;
	
		this.resizing = false;
		this.currentImageIndex = opts.startIndex;
		
		this._initSettings();

		this.windowResizeHandler = function(){
			_this._windowResized();
		};
		$(window).on('resize',this.windowResizeHandler);
		
		if( opts.imageSource ){
			this.imageSource = opts.imageSource;
		} else {
			this.imageSource = new DisplayImageSource();
			
			if( opts.url && opts.text ){
				this.imageSource.addImage(opts.url, opts.text);
			};
		};
		
		this._draw();
		
		this._setImageToView();
	},
	
	_draw: function(){
		var _this = this;

		var $body = $('body');
		
		// Hide elements for IE
		$('embed, object, select').css('visibility','hidden');
		
		// Add overlay div
		this.overlayId = $n2.getUniqueId();
		var $overlayDiv = $('<div>')
			.attr('id',this.overlayId)
			.addClass('n2DisplayBoxOverlay')
			.appendTo($body);
		
		// Add display div
		this.displayDivId = $n2.getUniqueId();
		var $displayDiv = $('<div>')
			.attr('id',this.displayDivId)
			.addClass('n2DisplayBoxOuter')
			.appendTo($body);
		
		// Image area
		var $imageOuterDiv = $('<div>')
			.addClass('n2DisplayBoxImageOuter')
			.appendTo($displayDiv);
		var $imageInnerDiv = $('<div>')
			.addClass('n2DisplayBoxImageInner')
			.appendTo($imageOuterDiv)
			.click(function(){
				// Do not close when clicking picture
				return false;
			});
//		var $navDiv = $('<div>')
//			.addClass('n2DisplayBoxNav')
//			.appendTo($imageInnerDiv);
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtn n2DisplayBoxNavBtnPrev')
			.appendTo($imageInnerDiv)
			.bind('click',function() {
				_this._previousImage();
				return false;
			});
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtn n2DisplayBoxNavBtnNext')
			.appendTo($imageInnerDiv)
			.bind('click',function() {
				_this._nextImage();
				return false;
			});
		var $loadingDiv = $('<div>')
			.addClass('n2DisplayBoxLoading')
			.appendTo($imageInnerDiv);
		var $loadingLink = $('<a>')
			.addClass('n2DisplayBoxLoadingLink')
			.attr('href','#')
			.appendTo($loadingDiv)
			.click(function(){
				_this._close();
				return false;
			});
		$('<img>')
			.addClass('n2DisplayBoxLoadingImg')
			.appendTo($loadingLink);
		
		// Data area
		var $dataOuterDiv = $('<div>')
			.addClass('n2DisplayBoxDataOuter')
			.appendTo($displayDiv)
			.click(function(){
				// Do not close when clicking data
				return false;
			});
		var $dataInnerDiv = $('<div>')
			.addClass('n2DisplayBoxDataInner')
			.appendTo($dataOuterDiv);
		var $dataDetailsDiv = $('<div>')
			.addClass('n2DisplayBoxDataDetails')
			.appendTo($dataInnerDiv);
		$('<span>')
			.addClass('n2DisplayBoxDataCaption')
			.appendTo($dataDetailsDiv);
		$('<span>')
			.addClass('n2DisplayBoxDataNumber')
			.appendTo($dataDetailsDiv);
		var $dataButtonsDiv = $('<div>')
			.addClass('n2DisplayBoxButtons')
			.appendTo($dataInnerDiv);
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxButtonClose')
			//.text( _loc('Close') )
			.appendTo($dataButtonsDiv)
			.click(function(){
				_this._close();
				return false;
			});
		
		// Get page sizes and scroll
		var pageSize = this._getPageSize();
		var pageScroll = this._getPageScroll();

		// Style overlay and show it
		$overlayDiv
			.css({
				backgroundColor: this.settings.overlayBgColor
				,opacity: this.settings.overlayOpacity
			})
			.hide()
			.click(function(){
				_this._close();
				return false;
			});
		this._resizeOverlay();

		// Calculate top and left offset for the jquery-lightbox div object and show it
		$displayDiv
			.css({
				top:	pageScroll.yScroll + (pageSize.windowHeight / 10),
				left:	pageScroll.xScroll
			})
			.show()
			.click(function(){
				_this._close();
				return false;
			});
	},
	
	_close: function(){
		var $overlayDiv = this._getOverlayDiv();
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.remove();
		$overlayDiv.fadeOut(function() { 
			$overlayDiv.remove(); 
		});
		
		// Show some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
		$('embed, object, select').css('visibility', 'visible');
		
		this.imageSource = null;
	},
	
	_windowResized: function(){
		var $overlayDiv = this._getOverlayDiv();
		if( $overlayDiv.length < 1 ){
			$(window).off('resize',this.windowResizeHandler);
		} else {
			$overlayDiv.hide();

			var pageSizes = this._getPageSize();
			var pageScroll = this._getPageScroll();

			// Calculate top and left offset for the display div object and show it
			var $displayDiv = this._getDisplayDiv();
			$displayDiv.css({
				top: pageScroll.yScroll + (pageSizes.windowHeight / 10),
				left: pageScroll.xScroll
			});
			
			var _this = this;
			window.setTimeout(function(){
				_this._resizeOverlay();
				_this._resizeContainerImageBox();
			},0);
		};
	},
	
	_resizeOverlay: function(){
		var $overlayDiv = this._getOverlayDiv();

		// Get page dimensions
		var pageSizes = this._getPageSize();
//		var pageScroll = this._getPageScroll();

//		$n2.log('pageWidth='+pageSizes.pageWidth
//			+' pageHeight='+pageSizes.pageHeight
//			+' windowWidth='+pageSizes.windowWidth
//			+' windowHeight='+pageSizes.windowHeight
//			+' xScroll='+pageScroll.xScroll
//			+' yScroll='+pageScroll.yScroll
//		);
		
		// Style overlay and show it
		$overlayDiv
			.css({
				width: pageSizes.pageWidth,
				height: pageSizes.pageHeight
			})
			.show();
	},
	
	_resizeContainerImageBox: function() {
		if( this.resizing ) return;

		var $displayDiv = this._getDisplayDiv();
		if( $displayDiv.length < 1 ) return;
		
		var _this = this;
		
		this.resizing = true;
		
		var intImageWidth = this.currentImage.width;
		var intImageHeight = this.currentImage.height;
		if( this.settings.constrainImage ) {
			var pageSizes = this._getPageSize();
			var ratio = 1;
			var intMaxWidth = pageSizes.windowWidth - (2 * this.settings.containerBorderSize);
			if (intImageWidth > intMaxWidth) {
				ratio = intMaxWidth / intImageWidth;
			};
			var intMaxHeight = pageSizes.windowHeight - (2 * this.settings.containerBorderSize) - 60 - 100;
			if (intImageHeight > intMaxHeight) {
			    var tmpRatio = intMaxHeight / intImageHeight;
			    if( tmpRatio < ratio ) {
			    	ratio = tmpRatio;
			    };
			};
			intImageWidth = Math.floor(ratio * intImageWidth);
			intImageHeight = Math.floor(ratio * intImageHeight);
			$displayDiv.find('.n2DisplayBoxImageWrapper')
				.css({ width: intImageWidth, height: intImageHeight })
				.hide();
//$n2.log('intImageWidth='+intImageWidth+' intImageHeight='+intImageHeight);			
			$displayDiv.find('.n2DisplayBoxLoadingLink').show();
			$displayDiv.find('.n2DisplayBoxDataOuter').hide();
			$displayDiv.find('.n2DisplayBoxDataNumber').hide();
		};
		
		// Get the width and height of the selected image plus the padding
		var intWidth = (intImageWidth + (this.settings.containerBorderSize * 2)); // Plus the image's width and the left and right padding value
		var intHeight = (intImageHeight + (this.settings.containerBorderSize * 2)); // Plus the image's height and the top and bottom padding value
		
		$displayDiv.find('.n2DisplayBoxImageOuter').css({
			width: intWidth
			,height: intHeight
		});
		window.setTimeout(function(){
			_this._showImage(); 
		},0);
		
		$displayDiv.find('.n2DisplayBoxDataOuter').css({ width: intImageWidth });
		$displayDiv.find('.n2DisplayBoxNavBtnPrev').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
		$displayDiv.find('.n2DisplayBoxNavBtnNext').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
		
		this.resizing = false;
	},
	
	_showImage: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxLoading').hide();
		$displayDiv.find('.n2DisplayBoxImageWrapper').fadeIn(function() {
			_this._showImageData();
			_this._setNavigation();
		});
		_this._preloadNeighborImages();
	},
	
	_showImageData: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxDataOuter').slideDown('fast');
		
		var $caption = $displayDiv.find('.n2DisplayBoxDataCaption').hide();
		this.imageSource.printText(
			this.currentImageIndex
			,$caption
			,function(index){
				if( _this.currentImageIndex == index ){
					$caption.show();
				};
			}
		);

		// If we have an image set, display 'Image X of X'
		var imageCountInfo = this.imageSource.getCountInfo(this.currentImageIndex);
		if( imageCountInfo ) {
			var label = _loc('{index}/{count}', {
				index: imageCountInfo.index
				,count: imageCountInfo.count
			});
			
			$displayDiv.find('.n2DisplayBoxDataNumber')
				.text(label)
				.show();
		} else {
			$displayDiv.find('.n2DisplayBoxDataNumber')
				.hide();
		};
	},
	
	_setNavigation: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxNavBtnPrev').hide();
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex,currentIndex){
			if( _this.currentImageIndex === currentIndex ){
				$displayDiv.find('.n2DisplayBoxNavBtnPrev').show();
			};
		});

		$displayDiv.find('.n2DisplayBoxNavBtnNext').hide();
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex,currentIndex){
			if( _this.currentImageIndex === currentIndex ){
				$displayDiv.find('.n2DisplayBoxNavBtnNext').show();
			};
		});
		
		// Enable keyboard navigation
		//_enable_keyboard_navigation();
	},
	
	_nextImage: function(){
		var _this = this;
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex){
			_this.currentImageIndex = nextIndex;
			_this._setImageToView();
		});
	},
	
	_previousImage: function(){
		var _this = this;
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex){
			_this.currentImageIndex = previousIndex;
			_this._setImageToView();
		});
	},
	
	_setImageToView: function() { // show the loading
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		// Show the loading
		$displayDiv.find('.n2DisplayBoxLoading').show();
		$displayDiv.find('.n2DisplayBoxImageWrapper').hide();
		$displayDiv.find('.n2DisplayBoxDataOuter').hide();
		$displayDiv.find('.n2DisplayBoxDataNumber').hide();
		$displayDiv.find('.n2DisplayBoxNavBtn').hide();
		
		this.imageSource.loadImage(this.currentImageIndex, function(data){
			// Load only current image
			if( _this.currentImageIndex === data.index ){
				var $divImageInner = $displayDiv.find('.n2DisplayBoxImageInner');
				$divImageInner.find('.n2DisplayBoxImageWrapper').remove();

				// Save original width and height
				_this.currentImage = {
					width: data.width
					,height: data.height
				};
				
				if( 'image' === data.type ){
					if( data.isPhotosphere 
					 && $n2.photosphere 
					 && $n2.photosphere.IsAvailable() ) {
						var $photosphere = $('<div>')
							.addClass('n2DisplayBoxImageWrapper')
							.prependTo($divImageInner);
						new $n2.photosphere.PhotosphereDisplay({
							elem: $photosphere
							,url: data.url
						});

						// In phtoshpere, make image a fixed ratio
						_this.currentImage.width = Math.floor(_this.currentImage.height * 3 / 2);

					} else {
						var $wrapper = $('<div>')
							.addClass('n2DisplayBoxImageWrapper')
							.prependTo($divImageInner);
						
						$('<img>')
							.addClass('n2DisplayBoxImage')
							.attr('src',data.url)
							.css({
								height: '100%'
								,width: '100%'
							})
							.appendTo($wrapper);
					};
				};
				
				// Performance an effect in the image container resizing it
				_this._resizeContainerImageBox();
			};
		});
	},
	
	_preloadNeighborImages: function() {
		var _this = this;
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex){
			_this.imageSource.loadImage(previousIndex);
		});
		
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex){
			_this.imageSource.loadImage(nextIndex);
		});
	},
	
	_getDisplayDiv: function() {
		return $('#'+this.displayDivId);
	},
	
	_getOverlayDiv: function() {
		return $('#'+this.overlayId);
	},
	
	_getPageSize: function() {
		var xScroll, yScroll, windowWidth = 0, windowHeight = 0, pageWidth, pageHeight;
		
		if (window.innerHeight && window.scrollMaxY) {	
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight;
		} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight;
		};

		if( window.self.innerHeight ) {	// all except Explorer
			if(document.documentElement.clientWidth){
				windowWidth = document.documentElement.clientWidth; 
			} else {
				windowWidth = window.self.innerWidth;
			};
			if(document.documentElement.clientWidth){
				windowHeight = document.documentElement.clientHeight; 
			} else {
				windowHeight = window.self.innerHeight;
			};
		} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight;
		} else if (document.body) { // other Explorers
			windowWidth = document.body.clientWidth;
			windowHeight = document.body.clientHeight;
		};
		
		// for small pages with total height less then height of the viewport
		if(yScroll < windowHeight){
			pageHeight = windowHeight;
		} else { 
			pageHeight = yScroll;
		};
		
		// for small pages with total width less then width of the viewport
		if(xScroll < windowWidth){	
			pageWidth = xScroll;		
		} else {
			pageWidth = windowWidth;
		};
		
		var pageSize = {
			pageWidth: pageWidth
			,pageHeight: pageHeight
			,windowWidth: windowWidth
			,windowHeight: windowHeight
		};
		return pageSize;
	},
	
	_getPageScroll: function() {
		var xScroll = 0, yScroll = 0;
		if (window.self.pageYOffset) {
			yScroll = window.self.pageYOffset;
			xScroll = window.self.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;	
		};
		
		var pageScroll = {
			xScroll: xScroll
			,yScroll: yScroll
		};
		return pageScroll;
	},
	
	_initSettings: function(){
		this.settings = {
			// Configuration related to overlay
			overlayBgColor: '#000'
			,overlayOpacity: 0.8
			// Configuration related to container image box
			,containerBorderSize: 10
			// Don't alter these variables in any way
			,constrainImage: true
		};
	},
	
	_imageZoom: function(change){
		var $displayDiv = this._getDisplayDiv();
		if( $displayDiv.length < 1 ) return;
		
		var $img = $displayDiv.find('.n2DisplayBoxImage');
		$n2.log('width:'+$img.css('width')+' height:'+$img.css('height'));
		
	}
});

//=========================================================================
/*

<div id="nunaliit2_uniqueId_127" class="n2DisplayBoxOuter" style="top: 84.5px; left: 0px;">
	<!-- This div is for setting the top position -->
	<div class="n2DisplayBoxImageOuter" style="width: 906px; height: 685px;">
		<div class="n2DisplayBoxImageInner">
			<div class="n2DisplayBoxImageWrapper">
				<img class="n2DisplayBoxImage" src="./db/4ae77032f04d840a2f0fd8c7f1006562/GOPR0027.jpg" style="width: 886px; height: 665px; display: inline;">
			</div>
			<a href="#" class="n2DisplayBoxNavBtn n2DisplayBoxNavBtnPrev" style="display: none; height: 685px;"></a>
			<a href="#" class="n2DisplayBoxNavBtn n2DisplayBoxNavBtnNext" style="display: none; height: 685px;"></a>
			<div class="n2DisplayBoxLoading" style="display: none;">
				<a class="n2DisplayBoxLoadingLink" href="#">
					<img class="n2DisplayBoxLoadingImg">
				</a>
			</div>
		</div>
	</div>
	<div class="n2DisplayBoxDataOuter" style="display: block; width: 886px;">
		<div class="n2DisplayBoxDataInner">
			<div class="n2DisplayBoxDataDetails">
				<span class="n2DisplayBoxDataCaption n2ShowUpdateDoc_4ae77032f04d840a2f0fd8c7f1006562 n2ShowDocBrief" style="display: inline;">
					<span class="n2s_localized">Demo Media</span>
					(Breakfast at Voyageur Camp)
				</span>
				<span class="n2DisplayBoxDataNumber" style="display: block;">1/1</span>
			</div>
			<div class="n2DisplayBoxButtons">
				<a href="#" class="n2DisplayBoxButtonClose"></a>
			</div>
		</div>
	</div>
</div>

 */

var DisplayBox2 = $n2.Class({
	
	overlayId: null,
	
	displayDivId: null,
	
	settings: null,
	
	windowResizeHandler: null,

	resizing: null,
	
	imageSource: null,
	
	currentImageIndex: null,

	/* Information about height and width */
	currentImage: null,
	
	currentGeometries: null,
	
	imageLastClick: null,
	
	clickOrigin: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,text: null
			,imageSource: null
			,startIndex: 0
		},opts_);
		
		var _this = this;
	
		this.resizing = false;
		this.currentImageIndex = opts.startIndex;
		
		this.currentGeometries = {};
		this.imageLastClick = 0;
		this.clickOrigin = null;
		
		this._initSettings();
		this._refreshCurrentGeometries();

		this.windowResizeHandler = function(){
			_this._windowResized();
		};
		$(window).on('resize',this.windowResizeHandler);
		
		if( opts.imageSource ){
			this.imageSource = opts.imageSource;
		} else {
			this.imageSource = new DisplayImageSource();
			
			if( opts.url && opts.text ){
				this.imageSource.addImage(opts.url, opts.text);
			};
		};
		
		this._draw();
		
		this._setImageToView();
	},
	
	_draw: function(){
		var _this = this;

		var $body = $('body');
		
		// Hide elements for IE
		$('embed, object, select').css('visibility','hidden');
		
		// Add overlay div
		this.overlayId = $n2.getUniqueId();
		var $overlayDiv = $('<div>')
			.attr('id',this.overlayId)
			.addClass('n2DisplayBoxOverlay')
			.appendTo($body);
		
		// Add display div
		this.displayDivId = $n2.getUniqueId();
		var $displayDiv = $('<div>')
			.attr('id',this.displayDivId)
			.addClass('n2DisplayBoxOuter')
			.appendTo($body);
		
		// Image area
		var $imageOuterDiv = $('<div>')
			.addClass('n2DisplayBoxImageOuter')
			.appendTo($displayDiv);
		var $imageInnerDiv = $('<div>')
			.addClass('n2DisplayBoxImageInner')
			.appendTo($imageOuterDiv)
			.click(function(){
				// Do not close when clicking picture
				return false;
			});
//		var $navDiv = $('<div>')
//			.addClass('n2DisplayBoxNav')
//			.appendTo($imageInnerDiv);
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtn n2DisplayBoxNavBtnPrev')
			.appendTo($imageInnerDiv)
			.bind('click',function() {
				_this._previousImage();
				return false;
			});
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtn n2DisplayBoxNavBtnNext')
			.appendTo($imageInnerDiv)
			.bind('click',function() {
				_this._nextImage();
				return false;
			});
		var $loadingDiv = $('<div>')
			.addClass('n2DisplayBoxLoading')
			.appendTo($imageInnerDiv);
		var $loadingLink = $('<a>')
			.addClass('n2DisplayBoxLoadingLink')
			.attr('href','#')
			.appendTo($loadingDiv)
			.click(function(){
				_this._close();
				return false;
			});
		$('<img>')
			.addClass('n2DisplayBoxLoadingImg')
			.appendTo($loadingLink);
		
		// Data area
		var $dataOuterDiv = $('<div>')
			.addClass('n2DisplayBoxDataOuter')
			.appendTo($displayDiv)
			.click(function(){
				// Do not close when clicking data
				return false;
			});
		var $dataInnerDiv = $('<div>')
			.addClass('n2DisplayBoxDataInner')
			.appendTo($dataOuterDiv);
		var $dataDetailsDiv = $('<div>')
			.addClass('n2DisplayBoxDataDetails')
			.appendTo($dataInnerDiv);
		$('<span>')
			.addClass('n2DisplayBoxDataCaption')
			.appendTo($dataDetailsDiv);
		$('<span>')
			.addClass('n2DisplayBoxDataNumber')
			.appendTo($dataDetailsDiv);
		var $dataButtonsDiv = $('<div>')
			.addClass('n2DisplayBoxButtons')
			.appendTo($dataInnerDiv);
		$('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxButtonClose')
			//.text( _loc('Close') )
			.appendTo($dataButtonsDiv)
			.click(function(){
				_this._close();
				return false;
			});
		
		// Style overlay and show it
		$overlayDiv
			.css({
				backgroundColor: this.settings.overlayBgColor
				,opacity: this.settings.overlayOpacity
			})
			.fadeIn()
			.click(function(){
				_this._close();
				return false;
			});

		// Calculate top and left offset for the jquery-lightbox div object and show it
		$displayDiv
			.hide()
			.click(function(){
				_this._close();
				return false;
			});

		this._resizeOverlay();
		this._resizeDisplay();
	},
	
	_close: function(){
		var $overlayDiv = this._getOverlayDiv();
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.remove();
		$overlayDiv.fadeOut(function() { 
			$overlayDiv.remove(); 
		});
		
		// Show some elements to avoid conflict with overlay in IE. These elements appear above the overlay.
		$('embed, object, select').css('visibility', 'visible');
		
		this.imageSource = null;
	},
	
	_windowResized: function(){
		var _this = this;

		var $overlayDiv = this._getOverlayDiv();
		var $displayDiv = this._getDisplayDiv();
		
		if( $overlayDiv.length < 1 
		 && $displayDiv.length < 1 ){
			$(window).off('resize',this.windowResizeHandler);
			
		} else {
			$overlayDiv.hide();
			$displayDiv.hide();

			window.setTimeout(function(){
				_this._refreshCurrentGeometries();
				
				_this._resizeOverlay();
				_this._resizeDisplay();
			},0);
		};
	},
	
	_refreshCurrentGeometries: function(){
		var pageSizes = this._getPageSize();
		this.currentGeometries.pageHeight = pageSizes.pageHeight;
		this.currentGeometries.pageWidth = pageSizes.pageWidth;
		this.currentGeometries.windowWidth = pageSizes.windowWidth;
		this.currentGeometries.windowHeight = pageSizes.windowHeight;

		var pageScroll = this._getPageScroll();
		this.currentGeometries.xScroll = pageScroll.xScroll;
		this.currentGeometries.yScroll = pageScroll.yScroll;
		
		$n2.log('windowWidth:'+this.currentGeometries.windowWidth
				+' windowHeight:'+this.currentGeometries.windowHeight
				+' pageWidth:'+this.currentGeometries.pageWidth
				+' pageHeight:'+this.currentGeometries.pageHeight
				);
	},
	
	_resizeOverlay: function(){
		var $overlayDiv = this._getOverlayDiv();

		// Style overlay and show it
		$overlayDiv
			.css({
				width: this.currentGeometries.pageWidth,
				height: this.currentGeometries.pageHeight
			})
			.show();
	},
	
	_resizeDisplay: function(){
		// Calculate top and left offset for the display div object and show it
		var $displayDiv = this._getDisplayDiv();
		$displayDiv.css({
			top: this.currentGeometries.yScroll + (this.currentGeometries.windowHeight / 10),
			left: this.currentGeometries.xScroll
		});

		this._resizeContainerImageBox();
	},
	
	_resizeContainerImageBox: function() {
		if( this.resizing ) return;

		var $displayDiv = this._getDisplayDiv();
		if( $displayDiv.length < 1 ) return;
		
		var _this = this;
		
		this.resizing = true;
		
		var ratios = this._computeMinMaxRatios();
		if( ratios && this.currentImage ){
			// Recall last ratio
			if( typeof this.currentImage.ratio === 'number' ){
				if( this.currentImage.ratio < ratios.min ){
					this.currentImage.ratio = ratios.min;
				};
				if( this.currentImage.ratio > ratios.max ){
					this.currentImage.ratio = ratios.max;
				};
			} else {
				this.currentImage.ratio = ratios.min;
			};
			if( this.currentImage.viewFullImage ){
				this.currentImage.ratio = ratios.min;
			};
			
			$n2.log('effective ratio: '+this.currentImage.ratio);

			var intImageWidth = Math.floor(this.currentImage.ratio * this.currentImage.width);
			var intImageHeight = Math.floor(this.currentImage.ratio * this.currentImage.height);
			var intWrapperWidth = Math.floor(ratios.min * this.currentImage.width);
			var intWrapperHeight = Math.floor(ratios.min * this.currentImage.height);
			
			this.currentGeometries.imageWrapperWidth = intWrapperWidth;
			this.currentGeometries.imageWrapperHeight = intWrapperHeight;
			
			$displayDiv
				.css({
					//top: Math.floor(pageSizes.windowHeight / 10)+'px',
					top: '30px',
					left: 0
				})
				.show();
			$displayDiv.find('.n2DisplayBoxImageWrapper')
				.css({ width: intWrapperWidth, height: intWrapperHeight })
				.hide();
			$displayDiv.find('.n2DisplayBoxImage')
				.css({ width: intImageWidth, height: intImageHeight });
			$displayDiv.find('.n2DisplayBoxLoadingLink').show();
			$displayDiv.find('.n2DisplayBoxDataOuter').hide();
			$displayDiv.find('.n2DisplayBoxDataNumber').hide();
			
			// Get the width and height of the selected image plus the padding
			var intWidth = (intWrapperWidth + (this.settings.containerBorderSize * 2)); // Plus the image's width and the left and right padding value
			var intHeight = (intWrapperHeight + (this.settings.containerBorderSize * 2)); // Plus the image's height and the top and bottom padding value
			
			$displayDiv.find('.n2DisplayBoxImageOuter').css({
				width: intWidth
				,height: intHeight
			});
			window.setTimeout(function(){
				_this._showImage(); 
			},0);
			
			$displayDiv.find('.n2DisplayBoxDataOuter').css({ width: intWrapperWidth });
			$displayDiv.find('.n2DisplayBoxNavBtnPrev').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
			$displayDiv.find('.n2DisplayBoxNavBtnNext').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
		};
		
		this.resizing = false;
	},
	
	_computeMinMaxRatios: function(){
		var results = null;

		if( this.currentImage ){
			var intImageWidth = this.currentImage.width;
			var intImageHeight = this.currentImage.height;
			if( this.settings.constrainImage ) {
				var ratio = 1;
				var intMaxWidth = this.currentGeometries.windowWidth - (2 * this.settings.containerBorderSize);
				if (intImageWidth > intMaxWidth) {
					ratio = intMaxWidth / intImageWidth;
				};
				var intMaxHeight = this.currentGeometries.windowHeight - (2 * this.settings.containerBorderSize) - 60 - 100;
				if (intImageHeight > intMaxHeight) {
				    var tmpRatio = intMaxHeight / intImageHeight;
				    if( tmpRatio < ratio ) {
				    	ratio = tmpRatio;
				    };
				};

				results = {
					min: ratio
					,max: 1
				};

			} else {
				results = {
					min: 1
					,max: 1
				};
			};

			$n2.log('ratio min:'+results.min+' max:'+results.max);
		};
		
		
		return results;
	},
	
	_showImage: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxLoading').hide();
		$displayDiv.find('.n2DisplayBoxImageWrapper').fadeIn(function() {
			_this._showImageData();
			_this._setNavigation();
			_this._imagePositionUpdated();
		});
		_this._preloadNeighborImages();
	},
	
	_showImageData: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxDataOuter').slideDown('fast');
		
		var $caption = $displayDiv.find('.n2DisplayBoxDataCaption').hide();
		this.imageSource.printText(
			this.currentImageIndex
			,$caption
			,function(index){
				if( _this.currentImageIndex == index ){
					$caption.show();
				};
			}
		);

		// If we have an image set, display 'Image X of X'
		var imageCountInfo = this.imageSource.getCountInfo(this.currentImageIndex);
		if( imageCountInfo ) {
			var label = _loc('{index}/{count}', {
				index: imageCountInfo.index
				,count: imageCountInfo.count
			});
			
			$displayDiv.find('.n2DisplayBoxDataNumber')
				.text(label)
				.show();
		} else {
			$displayDiv.find('.n2DisplayBoxDataNumber')
				.hide();
		};
	},
	
	_setNavigation: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxNavBtnPrev').hide();
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex,currentIndex){
			if( _this.currentImageIndex === currentIndex ){
				$displayDiv.find('.n2DisplayBoxNavBtnPrev').show();
			};
		});

		$displayDiv.find('.n2DisplayBoxNavBtnNext').hide();
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex,currentIndex){
			if( _this.currentImageIndex === currentIndex ){
				$displayDiv.find('.n2DisplayBoxNavBtnNext').show();
			};
		});
		
		// Enable keyboard navigation
		//_enable_keyboard_navigation();
	},
	
	_nextImage: function(){
		var _this = this;
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex){
			_this.currentImageIndex = nextIndex;
			_this._setImageToView();
		});
	},
	
	_previousImage: function(){
		var _this = this;
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex){
			_this.currentImageIndex = previousIndex;
			_this._setImageToView();
		});
	},
	
	_setImageToView: function() { // show the loading
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		// Show the loading
		$displayDiv.find('.n2DisplayBoxLoading').show();
		$displayDiv.find('.n2DisplayBoxImageWrapper').hide();
		$displayDiv.find('.n2DisplayBoxDataOuter').hide();
		$displayDiv.find('.n2DisplayBoxDataNumber').hide();
		$displayDiv.find('.n2DisplayBoxNavBtn').hide();
		
		this.imageSource.loadImage(this.currentImageIndex, function(data){
			// Load only current image
			if( _this.currentImageIndex === data.index ){
				var $divImageInner = $displayDiv.find('.n2DisplayBoxImageInner');
				$divImageInner.find('.n2DisplayBoxImageWrapper').remove();

				// Save original width and height
				_this.currentImage = {
					width: data.width
					,height: data.height
					,viewFullImage: true
					,top: 0
					,left: 0
				};
				
				if( 'image' === data.type ){
					if( data.isPhotosphere 
					 && $n2.photosphere 
					 && $n2.photosphere.IsAvailable() ) {
						var $photosphere = $('<div>')
							.addClass('n2DisplayBoxImageWrapper')
							.prependTo($divImageInner);
						new $n2.photosphere.PhotosphereDisplay({
							elem: $photosphere
							,url: data.url
						});

						// In phtoshpere, make image a fixed ratio
						_this.currentImage.width = Math.floor(_this.currentImage.height * 3 / 2);

					} else {
						var $wrapper = $('<div>')
							.addClass('n2DisplayBoxImageWrapper')
							.prependTo($divImageInner)
							.mouseout(function(e){
								_this._imageMouseOut(e);
							})
							;
						
						$('<img>')
							.addClass('n2DisplayBoxImage')
							.attr('src',data.url)
							.appendTo($wrapper)
							.mousedown(function(e){
								_this._imageMouseDown(e);
							})
							.mousemove(function(e){
								_this._imageMouseMove(e);
							})
							.mouseup(function(e){
								_this._imageMouseUp(e);
							})
							;
						
						$('<div>')
							.addClass('n2DisplayBoxImageZoomPlus')
							.appendTo($wrapper)
							.click(function(e){
								e.preventDefault();
								_this._imageZoom(+1);
								return false;
							});
						
						$('<div>')
							.addClass('n2DisplayBoxImageZoomMinus')
							.appendTo($wrapper)
							.click(function(e){
								e.preventDefault();
								_this._imageZoom(-1);
								return false;
							});
					};
				};
				
				// Performance an effect in the image container resizing it
				_this._resizeContainerImageBox();
			};
		});
	},
	
	_preloadNeighborImages: function() {
		var _this = this;
		this.imageSource.getPreviousIndex(this.currentImageIndex,function(previousIndex){
			_this.imageSource.loadImage(previousIndex);
		});
		
		this.imageSource.getNextIndex(this.currentImageIndex,function(nextIndex){
			_this.imageSource.loadImage(nextIndex);
		});
	},
	
	_getDisplayDiv: function() {
		return $('#'+this.displayDivId);
	},
	
	_getOverlayDiv: function() {
		return $('#'+this.overlayId);
	},
	
	_getPageSize: function() {
		var xScroll, yScroll, windowWidth = 0, windowHeight = 0, pageWidth, pageHeight;
		
		if (window.innerHeight && window.scrollMaxY) {	
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight;
		} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight;
		};

		if( window.self.innerHeight ) {	// all except Explorer
			if(document.documentElement.clientWidth){
				windowWidth = document.documentElement.clientWidth; 
			} else {
				windowWidth = window.self.innerWidth;
			};
			if(document.documentElement.clientWidth){
				windowHeight = document.documentElement.clientHeight; 
			} else {
				windowHeight = window.self.innerHeight;
			};
		} else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight;
		} else if (document.body) { // other Explorers
			windowWidth = document.body.clientWidth;
			windowHeight = document.body.clientHeight;
		};
		
		// for small pages with total height less then height of the viewport
		if(yScroll < windowHeight){
			pageHeight = windowHeight;
		} else { 
			pageHeight = yScroll;
		};
		
		// for small pages with total width less then width of the viewport
		if(xScroll < windowWidth){	
			pageWidth = xScroll;		
		} else {
			pageWidth = windowWidth;
		};
		
		var pageSize = {
			pageWidth: pageWidth
			,pageHeight: pageHeight
			,windowWidth: windowWidth
			,windowHeight: windowHeight
		};
		return pageSize;
	},
	
	_getPageScroll: function() {
		var xScroll = 0, yScroll = 0;
		if (window.self.pageYOffset) {
			yScroll = window.self.pageYOffset;
			xScroll = window.self.pageXOffset;
		} else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
			yScroll = document.documentElement.scrollTop;
			xScroll = document.documentElement.scrollLeft;
		} else if (document.body) {// all other Explorers
			yScroll = document.body.scrollTop;
			xScroll = document.body.scrollLeft;	
		};
		
		var pageScroll = {
			xScroll: xScroll
			,yScroll: yScroll
		};
		return pageScroll;
	},
	
	_initSettings: function(){
		this.settings = {
			// Configuration related to overlay
			overlayBgColor: '#000'
			,overlayOpacity: 0.8
			// Configuration related to container image box
			,containerBorderSize: 10
			// Don't alter these variables in any way
			,constrainImage: true
		};
	},
	
	_imageZoom: function(change){
		var $displayDiv = this._getDisplayDiv();
		if( $displayDiv.length < 1 ) return;
		
		var ratio = this.currentImage.ratio;
		if( typeof ratio === 'number' ){
			if( change > 0 ){
				ratio = ratio + 0.25;
			} else {
				ratio = ratio - 0.25;
			};
			
			this.currentImage.viewFullImage = false;
			
			var ratios = this._computeMinMaxRatios();
			if( ratios ){
				if( ratio < ratios.min ){
					ratio = ratios.min;
				};
				if( ratio > ratios.max ){
					ratio = ratios.max;
				};
				
				// Must save centre
				var cx = this.currentGeometries.imageWrapperWidth/2 - this.currentImage.left;
				cx = cx / this.currentImage.ratio;
				var cy = this.currentGeometries.imageWrapperHeight/2 - this.currentImage.top;
				cy = cy / this.currentImage.ratio;
				
				this.currentImage.ratio = ratio;
				
				// Recompute top and left from centre
				this.currentImage.left = Math.floor( (this.currentGeometries.imageWrapperWidth/2) 
					- (cx * this.currentImage.ratio) );
				this.currentImage.top = Math.floor( (this.currentGeometries.imageWrapperHeight/2) 
					- (cy * this.currentImage.ratio) );
				
				this._imagePositionUpdated();
			};
		};
	},
	
	_imagePositionUpdated: function(){
		var $displayDiv = this._getDisplayDiv();
		if( $displayDiv.length < 1 ) return;
		
		var $img = $displayDiv.find('.n2DisplayBoxImage');
		$n2.log('width:'+$img.css('width')+' height:'+$img.css('height'));

		var height = this.currentImage.height * this.currentImage.ratio;
		var width = this.currentImage.width * this.currentImage.ratio;
		
		// Check limits on left and top
		var minTop = this.currentGeometries.imageWrapperHeight - height;
		var minLeft = this.currentGeometries.imageWrapperWidth - width;
		if( this.currentImage.top > 0 ){
			this.currentImage.top = 0;
		};
		if( this.currentImage.top < minTop ){
			this.currentImage.top = minTop;
		};
		if( this.currentImage.left > 0 ){
			this.currentImage.left = 0;
		};
		if( this.currentImage.left < minLeft ){
			this.currentImage.left = minLeft;
		};
		
		$img.css({
				height: height
				,width: width
				,top: this.currentImage.top
				,left: this.currentImage.left
				,position: 'relative'
			});

		// disable zoom buttons, if needed
		var ratios = this._computeMinMaxRatios();
		if( this.currentImage.ratio <= ratios.min ){
			$displayDiv.find('.n2DisplayBoxImageZoomMinus').addClass('n2DisplayBoxImageZoomDisabled');
		} else {
			$displayDiv.find('.n2DisplayBoxImageZoomMinus').removeClass('n2DisplayBoxImageZoomDisabled');
		};
		if( this.currentImage.ratio >= ratios.max ){
			$displayDiv.find('.n2DisplayBoxImageZoomPlus').addClass('n2DisplayBoxImageZoomDisabled');
		} else {
			$displayDiv.find('.n2DisplayBoxImageZoomPlus').removeClass('n2DisplayBoxImageZoomDisabled');
		};
	},
	
	_imageMouseDown: function(e){

		//--------------------------------------------------
		// Event

		e.preventDefault();

		//--------------------------------------------------
		// Double tap/click event

		var now = new Date().getTime();
		if( this.imageLastClick > (now - 200) ) {
			this._imageZoom(1);
		} else {
			this.imageLastClick = now;
		};

		//--------------------------------------------------
		// Add events

		// http://www.quirksmode.org/blog/archives/2010/02/the_touch_actio.html
		// http://www.quirksmode.org/m/tests/drag.html

//		if (e.type === 'touchstart') {
//
//			this.img_ref.onmousedown = null;
//			this.img_ref.ontouchmove = image_move_event;
//			this.img_ref.ontouchend = function() {
//				this.img_ref.ontouchmove = null;
//				this.img_ref.ontouchend = null;
//			};
//
//		} else {
//
//			document.onmousemove = image_move_event;
//			document.onmouseup = function() {
//				document.onmousemove = null;
//				document.onmouseup = null;
//			};
//
//		};

		//--------------------------------------------------
		// Record starting position

		this.currentImage.startLeft = this.currentImage.left;
		this.currentImage.startTop = this.currentImage.top;
		

		this.clickOrigin = this._getEventCoords(e);
	},
	
	_imageMouseUp: function(e){
		this.clickOrigin = null;
	},
	
	_imageMouseOut: function(e){
		this.clickOrigin = null;
	},
	
	_imageMouseMove: function(e) {
		
		if( this.clickOrigin ){

			e.preventDefault();

			var currentPos = this._getEventCoords(e);

			this.currentImage.left = (this.currentImage.startLeft + (currentPos[0] - this.clickOrigin[0]));
			this.currentImage.top = (this.currentImage.startTop + (currentPos[1] - this.clickOrigin[1]));

			this._imagePositionUpdated();

			return false;
		};
		
		return true;
	},
	

	_getEventCoords: function(e) {
		var coords = [];
		if( e.touches && e.touches.length ) {
			coords[0] = e.touches[0].clientX;
			coords[1] = e.touches[0].clientY;
		} else {
			coords[0] = e.clientX;
			coords[1] = e.clientY;
		};
		return coords;
	}
});

// =========================================================================

$n2.displayBox = {
	DisplayBox: DisplayBox2
	,DisplayImageSource: DisplayImageSource
	,DisplayImageSourceDoc: DisplayImageSourceDoc
};	
	
})(jQuery,nunaliit2);
