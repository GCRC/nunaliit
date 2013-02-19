/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.mediaDisplay.js 8265 2012-06-29 20:28:56Z glennbrauen $
*/

// @requires n2.utils.js
// @requires n2.class.js

;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
	
var defaultDialogTitle = _loc('View Media');

var baseDialogOptions = {
	autoOpen: true
	,modal: true
	,dialogClass: 'n2MediaDisplayDialog' // jQuery dialog option
};

$n2.MediaDisplay = $n2.Class({
	 initialize: function() {

	}

	,displayMedia: function(opts_) {
		var opts = $n2.extend({
			type: null
			,url: null
			,mimeType: null
			,title: null
			,author: null
			,description: null
			,videoWidth: 320 // not used for inline embed generation
			,videoHeight: 240 // not used for inline embed generation
			,onClose: function(opts) {}
			,onError: function(err){ $n2.reportError(err); }
		},opts_);
		
		var onCloseHook = function(event, ui) {
			opts.onClose(opts);
		};
		opts.onCloseHook = onCloseHook;
		
		if( null == opts.url ) {
			opts.onError('URL must be provided to display a media');
		};
		
		if( 'image' === opts.type ) {
			this._displayImage(opts);
		} else if( 'audio' === opts.type ) {
			this._displayAudio(opts);
		} else if( 'video' === opts.type ) {
			this._displayVideo(opts);
		} else {
			this._displayUnknown(opts);
		};
	}

	,_displayImage: function(opts) {
		if( $.lightBox ) {
			var lightBoxOptions = {};
			
			var title = '';
			if( opts.metaDataHtml ) {
				title = opts.metaDataHtml;
			} else {
				if( opts.title ) {
					title += opts.title;
				};
				if( opts.author ) {
					title += ' (by ' + opts.author +')';
				};
				if( opts.description ) {
					title += ' <br />' + opts.description;
				};
			};
			
			$.lightBox(lightBoxOptions,[{
				href:opts.url
				,title:title
				}]);

		} else {

			var dialogTitle = defaultDialogTitle;
			if( opts.title ) {
				dialogTitle = opts.title;
			};

			var mediaDialogId = $n2.getUniqueId();
			
			var alt = 'image';
			if( opts.title ){
				alt = opts.title;
			};

			var $mediaDialog = $('<div id="'+mediaDialogId+'"><img alt="'+alt+'"/></div>');
			var $metaDataDiv = $('<div class="n2_dialogMetaData"></div>');
			$mediaDialog.append($metaDataDiv);
			this._addMetaData(opts, $metaDataDiv);
			
			var dialogOptions = $n2.extend({},baseDialogOptions,{
				title: dialogTitle
				,width: 360
				,height: 360
				,close: function(){
					$('#'+mediaDialogId).remove();
					opts.onCloseHook();
				}
			});
			$mediaDialog.dialog(dialogOptions);

			// Image preload process
			var objImagePreloader = new Image();
			objImagePreloader.onload = function() {
				var $d = $('#'+mediaDialogId);

				$d.find('img').attr('src',opts.url);
				// Save original width and height
				var width = objImagePreloader.width;
				var height = objImagePreloader.height;
				//	clear onLoad, IE behaves irratically with animated gifs otherwise
				objImagePreloader.onload=function(){};
				
				var $md = $d.find('.n2_dialogMetaData');
				var mdWidth = $md.width() || 0;
				var mdHeight = $md.height() || 0;
				
				var dWidth = width;
				if( dWidth < mdWidth ) {
					dWidth = mdWidth;
				};
				var dHeight = height + mdHeight;
				
				$d.dialog('option','width',dWidth+30);
				$d.dialog('option','height',dHeight+60);
			};
			objImagePreloader.src = opts.url;
		}
	}

	,_displayVideo: function(opts) {
		var dialogTitle = defaultDialogTitle;
		if( opts.title ) {
			dialogTitle = opts.title;
		};

		var mediaDialogId = $n2.getUniqueId();
		
		var mkup = [];
		mkup.push('<div id="'+mediaDialogId+'">');

		var browserInfo = $n2.utils.getBrowserInfo();
		if( "Safari" === browserInfo.browser &&
				5.0 <= browserInfo.version){
			var embedHtml = this.generateHtml5Tag({
				url: opts.url
				,sourceType: 'video'
				,mimeType: opts.mimeType
//				,width: 200
//				,height: 16
				,autoplay: true
				,loop: false
				,controller: true
			});
		} else {
			var embedOptions = $n2.extend({},
					{
				url: opts.url
				,sourceType: 'video'
					,mimeType: opts.mimeType
					,width: 320
					,height: 256
					,controller: true
					}
			);

			if( opts.mediaDisplayVideoWidth ) {
				embedOptions.width = opts.mediaDisplayVideoWidth;
			};
			if( opts.mediaDisplayVideoHeight ) {
				embedOptions.height = opts.mediaDisplayVideoHeight + 16;
			};

			var embedHtml = this.generateEmbedMarkup(embedOptions);
		};
		
		mkup.push(embedHtml);
		
		mkup.push('</div>');

		var $mediaDialog = $( mkup.join('') );
		
		this._addMetaData(opts, $mediaDialog);

		var dialogOptions = $n2.extend(
			{},
			baseDialogOptions,
			{
				title: dialogTitle
				,width: 360
				,close: function(){
					$('#'+mediaDialogId).remove();
					opts.onCloseHook();
				}
			}
		);
		if( opts.mediaDisplayVideoWidth ) {
			dialogOptions.width = opts.mediaDisplayVideoWidth + 40;
		};
		if( opts.mediaDisplayVideoHeight ) {
			dialogOptions.height = opts.mediaDisplayVideoHeight + 56;
		};
		$mediaDialog.dialog(dialogOptions);
	}

	,_displayAudio: function(opts) {
		var dialogTitle = defaultDialogTitle;
		if( opts.title ) {
			dialogTitle = opts.title;
		};

		var mediaDialogId = $n2.getUniqueId();

		if( $.jPlayer ) {
			var $mediaDialog = $('<div id="'+mediaDialogId+'"></div>');
			var $player = $('<div class="n2Media_jPlayer"></div>');
			$mediaDialog.append($player);
			
		} else {
			var browserInfo = $n2.utils.getBrowserInfo();

			// Generate local markup
			var mkup = [];
			mkup.push('<div id="'+mediaDialogId+'">');
			if( "Safari" === browserInfo.browser &&
					5.0 <= browserInfo.version){
				var embedHtml = this.generateHtml5Tag({
					url: opts.url
					,sourceType: 'audio'
					,mimeType: opts.mimeType
//					,width: 200
//					,height: 16
					,autoplay: true
					,loop: false
					,controller: true
				});
			} else {
				var embedHtmlOpts = {
						url: opts.url
						,sourceType: 'audio'
						,mimeType: opts.mimeType
						// Let float
						//,height: 16
						,controller: true
					};
				var embedHtml = this.generateEmbedMarkup(embedHtmlOpts);
			};
			mkup.push(embedHtml);
	
			mkup.push('</div>');
	
			var $mediaDialog = $( mkup.join('') );
		};
		
		this._addMetaData(opts, $mediaDialog);

		var dialogOptions = $n2.extend({},baseDialogOptions,{
			title: dialogTitle
			,width: 320
			,close: function(){
				$('#'+mediaDialogId).remove();
				opts.onCloseHook();
			}
		});
		$mediaDialog.dialog(dialogOptions);
		
		if( $.jPlayer ) {
			var $player = $mediaDialog.find('.n2Media_jPlayer');
			$player.jPlayer({
				ready: function(){
					var $m = $(this);
					$m.jPlayer('setMedia',{
						mp3: opts.url
					});
				}
				,swfPath:'./js-external/jQuery.jPlayer/'
				,size: {
					width: 100
					,height: 100
				}
			});
		};
	}

	,_displayUnknown: function(opts) {
		var dialogTitle = defaultDialogTitle;
		if( opts.title ) {
			dialogTitle = opts.title;
		};

		var mediaDialogId = $n2.getUniqueId();

		// Generate local markup
		var $mediaDialog = $('<div></div>');
		$mediaDialog.attr('id',mediaDialogId);
		
		var $meta = $('<div></div>')
			.appendTo($mediaDialog);
		this._addMetaData(opts, $mediaDialog);
		
		var $explain = $('<div class="n2Media_explain"></div>');
		$explain.text( _loc('You must leave the atlas to view this file.') );
		$mediaDialog.append($explain);
		
		var $buttons = $('<div class="n2Display_buttons"></div>')
			.appendTo($mediaDialog);
		$('<a class="nunaliit_form_link"></a>')
			.attr('href',opts.url)
			.text( _loc('Proceed') )
			.appendTo($buttons);

		var dialogOptions = $n2.extend({},baseDialogOptions,{
			title: dialogTitle
			,width: 320
			,close: function(){
				$('#'+mediaDialogId).remove();
				opts.onCloseHook();
			}
		});
		$mediaDialog.dialog(dialogOptions);
	}
	
	,_addMetaData: function(opts, $elem) {
		$elem.append( $('<br/>') );
		
		if( opts.metaDataHtml ) {
			var $meta = $('<span></span>');
			$meta.html(opts.metaDataHtml);
			$elem.append( $meta );
			
		} else {
			if( opts.author ) {
				var $author = $('<span></span>');
				$author.text( _loc('(by {author})',{
					author: opts.author
				}) );
				$elem.append( $author );
				$elem.append( $('<br/>') );
			};
			if( opts.description ) {
				var $desc = $('<span></span>');
				$desc.text( opts.description );
				$elem.append( $desc );
			};
		};
	}
	
	,generateInlineHtmlForMedia: function(opts_) {	
		var opts = $n2.extend({
			type: null
			,url: null
			,mimeType: null
			,autoplay: true
			,caption: null
			,headerHtml: null
			,footerHtml: null
			,onError: function(err){ $n2.reportError(err); }
		},opts_);

		var html = [];
		html.push('<div><p>');
		
		if( opts.headerHtml ) {
			html.push(opts.headerHtml);
			html.push('</p><p>');
		
		};
		
		if( opts.type === 'image' ) {
			html.push('<img src="'+ opts.url +'" alt="');
			if( typeof(opts.caption) === 'string'
			 && opts.caption !== '' ) {
				html.push(opts.caption);
			} else {
				html.push( _loc('an image') );
			};	
			html.push('"/>');

		} else if( opts.type === 'video' ) {
			var mkup = this.generateEmbedMarkup({
				url: opts.url
				,sourceType: 'video'
				,mimeType: opts.mimeType
				,width: 320
    			,height: 256
    			,autoplay: opts.autoplay
    		});
    		html.push(mkup);
    		
		} else if( opts.type === 'audio' ) {
			var browserInfo = $n2.utils.getBrowserInfo();
			var embedOpts = {
				url: opts.url
				,sourceType: 'audio'
				,mimeType: opts.mimeType
				,width: 250
				// Let height float
    			//,height: 16
    			,autoplay: opts.autoplay
			};
			if( "Safari" === browserInfo.browser ){
				embedOpts.height = 16;
			};
			var mkup = this.generateEmbedMarkup(embedOpts);
    		html.push(mkup);
		};
		
		if( opts.footerHtml) {
			html.push('</p><p>');
			html.push(opts.footerHtml);
		};

		html.push('</p></div>');
		
		return html.join('');
	}

	,generateEmbedMarkup: function(opts_) {
		var opts = $n2.extend({
			url: null
			,sourceType: null
			,mimeType: null
			,width: null
			,height: null
			,autoplay: false
			,loop: false
			,controller: false
		},opts_);
		
		if( typeof(QT_GenerateOBJECTText) === 'function' ) {
			// Call Apple Computer code, if available
			var args = [];
			args.push(opts.url);
			args.push(opts.width);
			args.push(opts.height);
			args.push(''); // ActiveX version
			if( opts.autoplay ) {
				args.push('autoplay');
				args.push('true');
			};
			if( opts.loop ) {
				args.push('loop');
				args.push('true');
			};
			if( opts.controller ) {
				args.push('controller');
				args.push('true');
			};
			return QT_GenerateOBJECTText.apply(null, args);
		};
		
		// HTML5
//		var html = this.generateHtml5Tag(opts);
//		if( html ) {
//			return html;
//		};

		// Generate object/embed sequence
		var html = [];
		html.push('<object');
		if( opts.width ) {
			html.push(' width="'+opts.width+'"');
		};
		if( opts.height ) {
			html.push(' height="'+opts.height+'"');
		};
		html.push(' codebase="http://www.apple.com/qtactivex/qtplugin.cab#version=7,3,0,0"');
		html.push('classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B"');
		html.push('><param name="src" value="');
		html.push(opts.url);
		html.push('">');
		html.push('<param name="autoplay" value="');
		if( opts.autoplay ) {
			html.push('true">');
		} else {
			html.push('false">');
		};
		if( opts.controller ) {
			html.push('<param name="controller" value="true">');
		};
		if( opts.loop ) {
			html.push('<param name="loop" value="true">');
		};
		html.push('<embed');
		if( opts.width ) {
			html.push(' width="'+opts.width+'"');
		};
		if( opts.height ) {
			html.push(' height="'+opts.height+'"');
		};
		if( opts.autoplay ) {
			html.push(' autoplay="true"');
		} else {
			html.push(' autoplay="false"');
		};
		if( opts.controller ) {
			html.push(' controller="true"');
		};
		if( opts.loop ) {
			html.push(' loop="true"');
		};
		html.push(' pluginspage="http://www.apple.com/quicktime/download/" src="');
		html.push(opts.url);
		html.push('"></embed></object>');
		 
		return html.join(''); 
	}

	,generateHtml5Tag: function(opts_) {
		var opts = $n2.extend({
			url: null
			,sourceType: null
			,mimeType: null
			,width: null
			,height: null
			,autoplay: false
			,loop: false
			,controller: false
		},opts_);
		
		var html = [];
		if( 'video' === opts.sourceType ) {
			html.push('<video');
		} else if( 'audio' === opts.sourceType ) {
			html.push('<audio');
		} else {
			return null;
		};
		
		if( opts.width ) {
			html.push(' width="'+opts.width+'"');
		};
		if( opts.height ) {
			html.push(' height="'+opts.height+'"');
		};
		if( opts.controller ) {
			html.push(' controls="controls"');
		};
		if( opts.autoplay ) {
			html.push(' autoplay="autoplay"');
		};
		
		// Source
		html.push(' src="');
		html.push(opts.url);
		html.push('"');
		
		if( opts.mimeType ) {
			html.push(' type="'+opts.mimeType+'"');
		};
		
		html.push('>');
		
		// Embed tag in case HTML 5 is not supported
		html.push('<embed');
		if( opts.width ) {
			html.push(' width="'+opts.width+'"');
		};
		if( opts.height ) {
			html.push(' height="'+opts.height+'"');
		};
		if( opts.autoplay ) {
			html.push(' autoplay="true"');
		} else {
			html.push(' autoplay="false"');
		};
		if( opts.controller ) {
			html.push(' controller="true"');
		};
		if( opts.loop ) {
			html.push(' loop="true"');
		};
		html.push(' src="');
		html.push(opts.url);
		html.push('"></embed>');
		
		// Close Tag
		if( 'video' === opts.sourceType ) {
			html.push('</video>');
		} else if( 'audio' === opts.sourceType ) {
			html.push('</audio>');
		} else {
			return null;
		};
		 
		return html.join(''); 
	}
});

$n2.mediaDisplay = new $n2.MediaDisplay();

})(jQuery,nunaliit2);