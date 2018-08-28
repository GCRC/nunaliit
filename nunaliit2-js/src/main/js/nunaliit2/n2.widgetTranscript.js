/*
Copyright (c) 2018, Geomatics and Cartographic Research Centre, Carleton 
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
"use strict";

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.widgetTranscript'
 ;

//--------------------------------------------------------------------------
var TranscriptWidget = $n2.Class('TranscriptWidget',{
	
	dispatchService: null,

	attachmentService: null,

	elemId: null,

	docId: null,

	videoAttName: null,

	srtAttName: null,

	doc: null,

	srtData: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: undefined
			,dispatchService: undefined
			,attachmentService: undefined
			,docId: undefined
			,doc: undefined
			,videoAttName: undefined
			,srtAttName: undefined
		},opts_);

		var _this = this;

		this.dispatchService = opts.dispatchService;
		this.attachmentService = opts.attachmentService;
		this.docId = opts.docId;
		this.videoAttName = opts.videoAttName;
		this.srtAttName = opts.srtAttName;
		if( opts.doc ){
			this.doc = opts.doc;
			this.docId = this.doc._id;
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
			.addClass('n2widgetTranscript')
			.appendTo($container);

		// Set up dispatcher
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'mediaTimeChanged',f);
			this.dispatchService.register(DH,'documentContent',f);
		};

		$n2.log(this._classname, this);

		this._refresh();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( 'mediaTimeChanged' === m.type ){
			
		} else if( 'documentContent' === m.type ){
			if( m.docId == this.docId ){
				if( !this.doc ){
					this.doc = m.doc;
					this._refresh();
				} else if( this.doc._rev != m.doc._rev ){
					this.doc = m.doc;
					this._refresh();
				};
			};
		};
	},
	
	_refresh: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem.empty();

		if( !this.doc ){
			this.dispatchService.send(DH, {
				'type': 'requestDocument'
				,'docId': this.docId
			});
			return;
		};

		if( !this.srtData ){
			var attSrt = undefined;
			if( this.attachmentService ){
				attSrt = this.attachmentService.getAttachment(this.doc, this.srtAttName);
			};

			var srtUrl = undefined;
			if( attSrt ){
				srtUrl = attSrt.computeUrl();
			};

			if( srtUrl ){
				// download content of attachment and call rendering function
				$.ajax({
					url: srtUrl
					,type: 'GET'
					,async: true
					,traditional: true
					,data: {}
					,dataType: 'text'
					,success: function(srtData) {
						_this.srtData = srtData;
						_this._refresh();
					}
					,error: function(XMLHttpRequest, textStatus, errorThrown) {
						// error while getting SRT content. Jump into same error
						// as wrongly configured
						_this._renderError();
					}
				});
			} else {
				// element is wronly configured. Report error
				_this._renderError();
			};
			
			return;
		};

		$n2.log('SRT',this.srtData);

		var attVideoDesc = null;
		var data = this.doc; // shorthand
		if( data 
		 && data.nunaliit_attachments
		 && data.nunaliit_attachments.files
		 ) {
			attVideoDesc = data.nunaliit_attachments.files[this.videoAttName];
			if( attVideoDesc.fileClass !== 'video' ){
				attVideoDesc = undefined;
			};
		};

		var thumbnailUrl = null;
		if( attVideoDesc
		 && attVideoDesc.thumbnail ){
			var attThumb = this.attachmentService.getAttachment(this.doc, attVideoDesc.thumbnail);
			if( attThumb ){
				thumbnailUrl = attThumb.computeUrl();
			};
		};

		var attVideoUrl = undefined;
		if( attVideoDesc 
		 && attVideoDesc.status === 'attached' ) {
			var attVideo = this.attachmentService.getAttachment(this.doc, this.videoAttName);
			if( attVideo ){
				attVideoUrl = attVideo.computeUrl();
			};
		};

		if( attVideoUrl ) {
			var mediaDivId = $n2.getUniqueId();
			var mediaId = $n2.getUniqueId();
			var transcriptId = $n2.getUniqueId();

			var $mediaDiv = $('<div>')
					.attr('id', mediaDivId)
					.appendTo($elem);
			/* var mediaOptions = {
						insertView: $insertView
						,videoUrl : attVideoUrl
						,mediaDivId : mediaDivId
						,mediaId : mediaId
						,mimeType : attVideoDesc.mimeType || null
					}
			_this._insertMediaPlayerNative($insertView,mediaOptions); */
		
			//DIV for the Video
			var $video = $('<video>')
				.attr('id', mediaId)
				.attr('controls', 'controls')
				.attr('width', '100%')
				//.attr('height', attDesc.height)
				.appendTo($mediaDiv);

			var $videoSource = $('<source>')
				.attr('src', attVideoUrl)
				.appendTo($video);

			if( attVideoDesc.mimeType ){
				$videoSource.attr('type', attVideoDesc.mimeType);
			};

	
			$('#'+mediaId).mediaelementplayer({
				poster: thumbnailUrl
				,features: ['playpause','progress','volume','sourcechooser','fullscreen']
			}); 

			//little refine for css : specically for transcript
			//$('.n2_content_text').css('overflow','hidden');

			var $transcript = $('<div>')
				.attr('id', 'transcript')
				.appendTo($mediaDiv);

			var transcript_array = [
				{"start": "0.00",
					"fin": "5.00",
					"text": "Now that we've looked at the architecture of the internet, let's see how you might connect your personal devices to the internet inside your house."},
				{"start": "5.01",
					"fin": "10.00",
					"text": "Well there are many ways to connect to the internet, and most often people connect wirelessly."},
				{"start": "10.01",
					"fin": "15.00",
					"text": "Let's look at an example of how you can connect to the internet."},
				{"start": "15.01",
					"fin": "20.00",
					"text": "If you live in a city or a town, you probably have a coaxial cable for cable Internet, or a phone line if you have DSL, running to the outside of your house, that connects you to the Internet Service Provider, or ISP."},
				{"start": "20.01",
					"fin": "25.00",
					"text": "If you live far out in the country, you'll more likely have a dish outside your house, connecting you wirelessly to your closest ISP, or you might also use the telephone system."},
				{"start": "25.01",
					"fin": "30.00",
					"text": "Whether a wire comes straight from the ISP hookup outside your house, or it travels over radio waves from your roof, the first stop a wire will make once inside your house, is at your modem."},
				
			];
		
			prep_transcript($transcript, transcript_array, mediaId);

			// time update function: #highlight on the span to change the color of the text
			$('#'+mediaId).bind('timeupdate', function() {
				
				//send the currentTime to DH system
				for(var i =0;i<transcript_array.length;i++) {
					document.getElementById(transcript_array[i].start).classList.remove('highlight');
					if(this.currentTime >= transcript_array[i].start && this.currentTime <= transcript_array[i].fin) {
						document.getElementById(transcript_array[i].start).classList.add('highlight');
						//$n2.log(tar.prop('tagname'));
					}

					//var currentTime = this.currentTime;
					//$n2.log('current time: '+ currentTime);
				}

			});

		} else {
			_this._renderError();
		};

		function prep_transcript($transcript, transcript_array, mediaId){
			var temp;
			for (var i = 0; i < transcript_array.length; i++) {
				
				temp = $('<span />');
				temp.html(transcript_array[i].text + ' ')
				.attr('id', transcript_array[i].start)
				.appendTo($transcript);
	
				// attach event listener that will fire skip_to_text when span is clicked
				temp.bind('click', function(e) {
					var $video = $('#'+mediaId);
					$video[0].currentTime = e.target.id;
					$video[0].play();


				});
			}
		}
	},
	
	_renderError: function(){
		var $elem = this._getElem();
		
		$elem.empty();
		
		var label = _loc('Unable to display tether content({docId})',{
			docId: this.docId
		});
		$('<span>')
			.addClass('n2widgetTranscript_error')
			.text(label)
			.appendTo($elem);
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'transcriptWidget' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'transcriptWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = m.containerId;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.containerId = containerId;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.attachmentService = config.directory.attachmentService;
		};
		
		new TranscriptWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetTranscript = {
	TranscriptWidget: TranscriptWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
