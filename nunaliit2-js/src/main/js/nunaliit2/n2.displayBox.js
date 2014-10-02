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
		var opts = $n2.extend({
			
		},opts_);
		
		this.images = [];
	},
	
	getCount: function(){
		return this.images.length;
	},
	
	getUrl: function(index){
		var url = null;
		var image = this.images[index];
		if( image ){
			url = image.url;
		};
		return url;
	},
	
	printText: function(index, $elem){
		$elem.empty();
		
		var image = this.images[index];
		if( image && image.text){
			$elem.text(image.text);
		};
	},
	
	loadImage: function(index, cb){
		var _this = this;
		
		var image = this.images[index];
		if( image ){
			if( image.loaded ){
				cb({
					index: index
					,url: image.url
					,width: image.width
					,height: image.height
				});
			} else {
				if( image.cb ) {
					image.cb.push(cb);
				} else {
					image.cb = [cb];
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
					};
					
					image.preload.src = image.url;
				};
			};
		};
	},
	
	addImage: function(url, text){
		this.images.push({
			url: url
			,text: text
		});
	},
	
	getPreviousIndex: function(index){
		--index;
		if( index < 0 ){
			index = this.images.length - 1;
		};
		return index;
	},
	
	getNextIndex: function(index){
		++index;
		if( index >= this.images.length ){
			index = 0;
		};
		return index;
	}
});

//=========================================================================

var DisplayBox = $n2.Class({
	
	overlayId: null,
	
	displayDivId: null,
	
	settings: null,
	
	windowResizeHandler: null,

	resizing: null,
	
	imageSource: null,
	
	currentImageIndex: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			url: null
			,text: null
			,imageSource: null
		},opts_);
		
		var _this = this;
	
		this.resizing = false;
		this.currentImageIndex = 0;
		
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
		
		// Unset total images in imageArray
		this.settings.imageArray = [
			[opts.url, opts.text]
		];
		// Unset image active information
		this.settings.activeImage = 0;
		
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
			.appendTo($imageOuterDiv);
		var $image = $('<img>')
			.addClass('n2DisplayBoxImage')
			.appendTo($imageInnerDiv);
		var $navDiv = $('<div>')
			.addClass('n2DisplayBoxNav')
			.appendTo($imageInnerDiv);
		var $btnPrev = $('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtnPrev')
			.appendTo($navDiv);
		var $btnNext = $('<a>')
			.attr('href','#')
			.addClass('n2DisplayBoxNavBtnNext')
			.appendTo($navDiv);
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
		var $loadingImg = $('<img>')
			.addClass('n2DisplayBoxLoadingImg')
			.appendTo($loadingLink);
		
		// Data area
		var $dataOuterDiv = $('<div>')
			.addClass('n2DisplayBoxDataOuter')
			.appendTo($displayDiv);
		var $dataInnerDiv = $('<div>')
			.addClass('n2DisplayBoxDataInner')
			.appendTo($dataOuterDiv);
		var $dataDetailsDiv = $('<div>')
			.addClass('n2DisplayBoxDataDetails')
			.appendTo($dataInnerDiv);
		var $captionSpan = $('<span>')
			.addClass('n2DisplayBoxDataCaption')
			.appendTo($dataDetailsDiv);
		var $numberSpan = $('<span>')
			.addClass('n2DisplayBoxDataNumber')
			.appendTo($dataDetailsDiv);
		var $dataButtonsDiv = $('<div>')
			.addClass('n2DisplayBoxButtons')
			.appendTo($dataInnerDiv);
		var $buttonClose = $('<a>')
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
		$overlayDiv.css({
			backgroundColor: this.settings.overlayBgColor
			,opacity: this.settings.overlayOpacity
		}).fadeIn()
			.click(function(){
				_this._close();
				return false;
			});
		this._resizeOverlay();

		// Calculate top and left offset for the jquery-lightbox div object and show it
		$displayDiv.css({
			top:	pageScroll.yScroll + (pageSize.windowHeight / 10),
			left:	pageScroll.xScroll
		}).show()
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
		var pageScroll = this._getPageScroll();

		$n2.log('pageWidth='+pageSizes.pageWidth
			+' pageHeight='+pageSizes.pageHeight
			+' windowWidth='+pageSizes.windowWidth
			+' windowHeight='+pageSizes.windowHeight
			+' xScroll='+pageScroll.xScroll
			+' yScroll='+pageScroll.yScroll
		);
		
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
		
		var intImageWidth = this.settings.imageArray[this.settings.activeImage][2];
		var intImageHeight = this.settings.imageArray[this.settings.activeImage][3];
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
			$displayDiv.find('.n2DisplayBoxImage')
				.css({ width: intImageWidth, height: intImageHeight })
				.hide();
//$n2.log('intImageWidth='+intImageWidth+' intImageHeight='+intImageHeight);			
			$displayDiv.find('.n2DisplayBoxLoadingLink').show();
			$displayDiv.find('.n2DisplayBoxDataOuter').hide();
			$displayDiv.find('.n2DisplayBoxDataNumber').hide();
		};
		
		// Get current width and height
		var $imageBox = $displayDiv.find('.n2DisplayBoxImage');
		var intCurrentWidth = $imageBox.width();
		var intCurrentHeight = $imageBox.height();
		
		// Get the width and height of the selected image plus the padding
		var intWidth = (intImageWidth + (this.settings.containerBorderSize * 2)); // Plus the image's width and the left and right padding value
		var intHeight = (intImageHeight + (this.settings.containerBorderSize * 2)); // Plus the image's height and the left and right padding value
		
		// Differences
		var intDiffW = intCurrentWidth - intWidth;
		var intDiffH = intCurrentHeight - intHeight;
		
		// Performance the effect
//		$displayDiv.find('.n2DisplayBoxImageOuter').animate(
//			{
//				width: intWidth
//				,height: intHeight
//			}
//			,this.settings.containerResizeSpeed
//			,function() { _this._showImage(); }
//		);
		$displayDiv.find('.n2DisplayBoxImageOuter').css({
			width: intWidth
			,height: intHeight
		});
		window.setTimeout(function(){
			_this._showImage(); 
		},0);
		
//		if ( ( intDiffW == 0 ) && ( intDiffH == 0 ) ) {
//			if ( $.browser.msie ) {
//				___pause(250);
//			} else {
//				___pause(100);	
//			}
//		};
		
		$displayDiv.find('.n2DisplayBoxDataOuter').css({ width: intImageWidth });
		$displayDiv.find('.n2DisplayBoxNavBtnPrev').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
		$displayDiv.find('.n2DisplayBoxNavBtnNext').css('height', intImageHeight + (this.settings.containerBorderSize * 2));
		
		this.resizing = false;
	},
	
	_showImage: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxLoading').hide();
		$displayDiv.find('.n2DisplayBoxImage').fadeIn(function() {
			_this._showImageData();
			_this._setNavigation();
		});
		_this._preloadNeighborImages();
	},
	
	_showImageData: function() {
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxDataOuter').slideDown('fast');
		$displayDiv.find('.n2DisplayBoxDataCaption').hide();
		if( this.settings.imageArray[this.settings.activeImage][1] ) {
			$displayDiv.find('.n2DisplayBoxDataCaption')
				.html(this.settings.imageArray[this.settings.activeImage][1])
				.show();
		};
		// If we have a image set, display 'Image X of X'
		if( this.settings.imageArray.length > 1 ) {
			var current = this.settings.activeImage + 1;
			var count = this.settings.imageArray.length;
			var label = _loc('{index}/{count}', {
				index: current
				,count: count
			});
			
			$displayDiv.find('.n2DisplayBoxDataNumber')
				.text(label)
				.show();
		}		
	},
	
	_setNavigation: function() {
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		$displayDiv.find('.n2DisplayBoxNav').show();

		// Instead to define this configuration in CSS file, we define here. And it's need to IE. Just.
//		$('#lightbox-nav-btnPrev,#lightbox-nav-btnNext').css({ 'background' : 'transparent url(' + settings.imageLocation + settings.imageBlank + ') no-repeat' });
		
		// Show the prev button, if not the first image in set
		if( this.settings.activeImage != 0 ) {
			if( this.settings.fixedNavigation ) {
				$displayDiv.find('.n2DisplayBoxNavBtnPrev')
					.bind('click',function() {
						_this.settings.activeImage = _this.settings.activeImage - 1;
						_this._setImageToView();
						return false;
					});
			} else {
				// Show the images button for Next buttons
				$displayDiv.find('.n2DisplayBoxNavBtnPrev')
					.show()
					.bind('click',function() {
						_this.settings.activeImage = _this.settings.activeImage - 1;
						_this._setImageToView();
						return false;
					});
			};
		};
		
		// Show the next button, if not the last image in set
		if( this.settings.activeImage != ( this.settings.imageArray.length -1 ) ) {
			if( this.settings.fixedNavigation ) {
				$displayDiv.find('.n2DisplayBoxNavBtnNext')
					.bind('click',function() {
						_this.settings.activeImage = _this.settings.activeImage + 1;
						_this._setImageToView();
						return false;
					});
			} else {
				// Show the images button for Next buttons
				$displayDiv.find('.n2DisplayBoxNavBtnNext')
					.show().bind('click',function() {
						_this.settings.activeImage = _this.settings.activeImage + 1;
						_this._setImageToView();
						return false;
					});
			};
		};
		
		// Enable keyboard navigation
		//_enable_keyboard_navigation();
	},
	
	_setImageToView: function() { // show the loading
		var _this = this;
		
		var $displayDiv = this._getDisplayDiv();

		// Show the loading
		$displayDiv.find('.n2DisplayBoxLoading').show();
		if( this.settings.fixedNavigation ) {
			$displayDiv.find('.n2DisplayBoxImage').hide();
			$displayDiv.find('.n2DisplayBoxDataOuter').hide();
			$displayDiv.find('.n2DisplayBoxDataNumber').hide();
		} else {
			$displayDiv.find('.n2DisplayBoxImage').hide();
			$displayDiv.find('.n2DisplayBoxDataOuter').hide();
			$displayDiv.find('.n2DisplayBoxDataNumber').hide();
			$displayDiv.find('.n2DisplayBoxNav').hide();
		};
		
		// Image preload process
		var objImagePreloader = new Image();
		objImagePreloader.onload = function() {
			$displayDiv.find('.n2DisplayBoxImage')
				.attr('src',_this.settings.imageArray[_this.settings.activeImage][0]);
			
			// Save original width and height
			_this.settings.imageArray[_this.settings.activeImage][2] = objImagePreloader.width;
			_this.settings.imageArray[_this.settings.activeImage][3] = objImagePreloader.height;
			
			// Performance an effect in the image container resizing it
			_this._resizeContainerImageBox()
			;
			//	clear onLoad, IE behaves irratically with animated gifs otherwise
			objImagePreloader.onload=function(){};
		};
		
		objImagePreloader.src = this.settings.imageArray[this.settings.activeImage][0];
	},
	
	_preloadNeighborImages: function() {
		if( (this.settings.imageArray.length -1) > this.settings.activeImage ) {
			objNext = new Image();
			objNext.src = this.settings.imageArray[this.settings.activeImage + 1][0];
		};
		
		if( this.settings.activeImage > 0 ) {
			objPrev = new Image();
			objPrev.src = this.settings.imageArray[this.settings.activeImage -1][0];
		}
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
			overlayBgColor: '#000'		// (string) Background color to overlay; inform a hexadecimal value like: #RRGGBB. Where RR, GG, and BB are the hexadecimal values for the red, green, and blue values of the color.
			,overlayOpacity: 0.8		// (integer) Opacity value to overlay; inform: 0.X. Where X are number from 0 to 9
			// Configuration related to navigation
			,fixedNavigation: false		// (boolean) Boolean that informs if the navigation (next and prev button) will be fixed or not in the interface.
			// Configuration related to images
			,imageLocation: 'js-external/css/jquery.lightbox.resources/'
			,imageLoading: 'lightbox-ico-loading.gif'		// (string) Path and the name of the loading icon
			,imageBtnPrev: 'lightbox-btn-prev.gif'			// (string) Path and the name of the prev button image
			,imageBtnNext: 'lightbox-btn-next.gif'			// (string) Path and the name of the next button image
			,imageBtnClose: 'lightbox-btn-close.gif'		// (string) Path and the name of the close btn
			,imageBlank: 'lightbox-blank.gif'			// (string) Path and the name of a blank image (one pixel)
			// Configuration related to container image box
			,containerBorderSize: 10			// (integer) If you adjust the padding in the CSS for the container, #lightbox-container-image-box, you will need to update this value
			,containerResizeSpeed: 400		// (integer) Specify the resize duration of container image. These number are miliseconds. 400 is default.
			// Configuration related to keyboard navigation
			,keyToClose: 'c'		// (string) (c = close) Letter to close the jQuery lightBox interface. Beyond this letter, the letter X and the SCAPE key is used to.
			,keyToPrev: 'p'		// (string) (p = previous) Letter to show the previous image
			,keyToNext: 'n'		// (string) (n = next) Letter to show the next image.
			// Don't alter these variables in any way
			,imageArray: []
			,activeImage: 0
			,constrainImage: true
		};
	}
});

// =========================================================================

$n2.displayBox = {
	DisplayBox: DisplayBox
};	
	
})(jQuery,nunaliit2);
