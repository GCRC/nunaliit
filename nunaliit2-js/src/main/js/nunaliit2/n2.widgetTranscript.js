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

	videoId: null,
	
	transcriptId: null,

	name: null,

	docId: null,

	videoAttName: null,

	srtAttName: null,

	doc: null,

	srtData: null,
	
	transcript_array: null,
	
	// Time source variables
	sourceModelId: null, // id of time model, or null

	intervalChangeEventName: null, // name of event used to report changes in time interval
	intervalGetEventName: null, // name of event used to retrieve current time interval
	intervalSetEventName: null, // name of event used to set current time interval
	intervalMin: null, // integer, current interval minimum
	intervalMax: null, // integer, current interval maximum

	/*
		[
			{
				timeStart: <integer - interval start>
				,timeEnd: <integer - interval end>
				,videoStart: <integer>
				,videoEnd: <integer>
			}
		]
	 */
	timeTable: null,
	transcriptConvertor: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: undefined
			,dispatchService: undefined
			,attachmentService: undefined
			,name: undefined
			,docId: undefined
			,doc: undefined
			,sourceModelId: undefined
		},opts_);

		var _this = this;

		this.dispatchService = opts.dispatchService;
		this.attachmentService = opts.attachmentService;
		this.name = opts.name;
		this.docId = opts.docId;
		this.sourceModelId = opts.sourceModelId;
		if( opts.doc ){
			this.doc = opts.doc;
			this.docId = this.doc._id;
		};
		if( !this.name ){
			this.name = $n2.getUniqueId();
		};

		this.transcriptConvertor = new SrtToJsonConvertor();
		this.transcript_array = [];

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
			if( this.sourceModelId ){
				// Get model info
				var modelInfoRequest = {
					type: 'modelGetInfo'
					,modelId: this.sourceModelId
					,modelInfo: null
				};
				this.dispatchService.synchronousCall(DH, modelInfoRequest);
				var sourceModelInfo = modelInfoRequest.modelInfo;
				
				if( sourceModelInfo 
				 && sourceModelInfo.parameters 
				 && sourceModelInfo.parameters.interval ){
					var paramInfo = sourceModelInfo.parameters.interval;
					this.intervalChangeEventName = paramInfo.changeEvent;
					this.intervalGetEventName = paramInfo.getEvent;
					this.intervalSetEventName = paramInfo.setEvent;

					if( paramInfo.value ){
						this.intervalMin = paramInfo.value.min;
						this.intervalMax = paramInfo.value.max;
					};
				};
			};

			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH,'mediaTimeChanged',f);
			this.dispatchService.register(DH,'documentContent',f);
			if( this.intervalChangeEventName ){
				this.dispatchService.register(DH,this.intervalChangeEventName,f);
			};
			
			// If the widget was built specifying a specific document, then do not change
			// content on user selection. If no document specified, then listen to user selection.
			if( !this.docId ){
				this.dispatchService.register(DH,'selected',f);
			};
		};

		$n2.log(this._classname, this);

		this._documentChanged();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		/*
			mediaTimeChange message
			{
				type:'mediaTimeChange'
				,name: <name of widget>
				,currentTime: <integer>
				,origin: <string>
				      video => event originated from video player
				      text => event originated from clicking text
			}
		*/
		if( 'mediaTimeChanged' === m.type ){
			if( m.name == this.name ){
				this._timeChanged(m.currentTime, m.origin);
			};
			
		} else if( 'documentContent' === m.type ){
			if( m.docId == this.docId ){
				if( !this.doc ){
					this.doc = m.doc;
					this._documentChanged();
				} else if( this.doc._rev != m.doc._rev ){
					this.doc = m.doc;
					this._documentChanged();
				};
			};

		} else if( this.intervalChangeEventName === m.type ) {
			//$n2.log("intervalChangeEvent "+this.intervalChangeEventName+" => ", m);

			if( m.value ){
				this.intervalMin = m.value.min;
				this.intervalMax = m.value.max;
				
				var videoTime = this._convertTimeToVideoTime(this.intervalMin);
				if( typeof videoTime == 'number' ){
					this._timeChanged(videoTime, 'model');
				};
			};
			
		} else if( 'selected' === m.type ){
			if( m.docId != this.docId ){
				this.docId = m.docId;
				this.doc = m.doc;
				this.timeTable = [];
				this._documentChanged();
			};
		};
	},

	_convertTimeToVideoTime: function(t){
		var vTime = undefined;
		
		if( this.timeTable ){
			this.timeTable.forEach(function(timeEntry){
				if( timeEntry.timeStart < t && t < timeEntry.timeEnd ){
					var frac = (t - timeEntry.timeStart) / (timeEntry.timeEnd - timeEntry.timeStart);
					vTime = timeEntry.videoStart + (frac * (timeEntry.videoEnd - timeEntry.videoStart))
				};
			});
		};
		
		return vTime;
	},

	_convertVideoTimeToTime: function(vTime){
		var time = undefined;
		
		if( this.timeTable ){
			this.timeTable.forEach(function(timeEntry){
				if( timeEntry.videoStart < vTime && vTime < timeEntry.videoEnd ){
					var frac = (vTime - timeEntry.videoStart) / (timeEntry.videoEnd - timeEntry.videoStart);
					time = timeEntry.timeStart + (frac * (timeEntry.timeEnd - timeEntry.timeStart));
					time = Math.floor(time);
				};
			});
		};
		
		return time;
	},

	/**
	 * This method is called when we detect that the document has changed. This can be triggered
	 * through a new selection from the user, or an update to the currently selected document.
	 */
	_documentChanged: function(){
		var _this = this;

		if( !this.doc ){
			// We do not have the document. Request it.
			this.dispatchService.send(DH, {
				'type': 'requestDocument'
				,'docId': this.docId
			});

		} else if( !this.transcript ){
			this._loadTranscript(this.doc);

		} else if( !this.srtData ){
			var attSrt = undefined;
			if( this.attachmentService
			 && this.transcript 
			 && this.transcript.srtAttName ){
				attSrt = this.attachmentService.getAttachment(this.doc, this.transcript.srtAttName);
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
						_this.transcript_array = _this.transcriptConvertor.execute(srtData);
						_this._documentChanged();
					}
					,error: function(XMLHttpRequest, textStatus, errorThrown) {
						// error while getting SRT content. Jump into same error
						// as wrongly configured
						_this._documentChanged();
					}
				});
			} else {
				// element is wronly configured. Report error
				_this._renderError('Can not compute URL for SRT');
			};

		} else if( this.transcript.timeTable ){
			if( !$n2.isArray(this.transcript.timeTable) ){
				_this._renderError('timeTable must be an array');
			} else {
				this.timeTable = [];

				this.transcript.timeTable.forEach(function(timeEntry){
					if( typeof timeEntry !== 'object' ){
						throw new Error('Entries in timeTable must be objects');
					} else if( null === timeEntry ){
						throw new Error('Entries in timeTable can not be null');
					};
					
					var videoStart = timeEntry.videoStart;
					var videoEnd = timeEntry.videoEnd;
					var timeStart = timeEntry.timeStart;
					var timeEnd = timeEntry.timeEnd;

					if( typeof videoStart !== 'number' ){
						throw new Error('videoStart in timeTable must be a number');
					};
					if( typeof videoEnd !== 'number' ){
						throw new Error('videoEnd in timeTable must be a number');
					};

					// Try to parse time
					var timeStartInt = $n2.date.parseUserDate(timeStart);
					var timeEndInt = $n2.date.parseUserDate(timeEnd);
					
					var timeObj = {
						intervalStart: timeStartInt
						,intervalEnd: timeEndInt
						,timeStart: timeStartInt.min
						,timeEnd: timeEndInt.min
						,videoStart: videoStart
						,videoEnd: videoEnd
					};
					_this.timeTable.push(timeObj);
				});
			};
		};

		// At the end of all this, refresh
		this._refresh();
	},

	_refresh: function(){
		var _this = this;

		var $elem = this._getElem();
		
		$elem.empty();

		if( !this.docId ){
			return;
		};
		if( !this.transcript ){
			return;
		};

		var attVideoName = undefined;
		if( this.transcript ){
			attVideoName = this.transcript.videoAttName;
		}

		var attVideoDesc = null;
		var data = this.doc; // shorthand
		if( data 
		 && data.nunaliit_attachments
		 && data.nunaliit_attachments.files
		 && attVideoName
		 ) {
			attVideoDesc = data.nunaliit_attachments.files[attVideoName];
			if( attVideoDesc
			 && attVideoDesc.fileClass !== 'video' ){
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
			var attVideo = this.attachmentService.getAttachment(this.doc, attVideoName);
			if( attVideo ){
				attVideoUrl = attVideo.computeUrl();
			};
		};

		if( attVideoUrl ) {
			var mediaDivId = $n2.getUniqueId();
			this.videoId = $n2.getUniqueId();
			this.transcriptId = $n2.getUniqueId();

			var $mediaDiv = $('<div>')
					.attr('id', mediaDivId)
					.appendTo($elem);
			
		
			//DIV for the Video
			var $video = $('<video>')
				.attr('id', this.videoId)
				.attr('controls', 'controls')
				.attr('width', '100%')
				.attr('height', '360px')
				.appendTo($mediaDiv);

			var $videoSource = $('<source>')
				.attr('src', attVideoUrl)
				.appendTo($video);

			if( attVideoDesc.mimeType ){
				$videoSource.attr('type', attVideoDesc.mimeType);
			};

	
			$video.mediaelementplayer({
				poster: thumbnailUrl
				,alwaysShowControls : true
				,pauseOtherPlayers : false
				,features: ['volume', 'playpause', 'progress','sourcechooser']
			}); 

			var $transcript = $('<div>')
				.attr('id', this.transcriptId)
				.addClass('n2widgetTranscript_transcript')
				.appendTo($mediaDiv);
		
			prep_transcript($transcript, this.transcript_array);

			// time update function: #highlight on the span to change the color of the text
			$video
				.bind('timeupdate', function() {
					var currentTime = this.currentTime;
					_this._updateCurrentTime(currentTime, 'video');
				});

		} else {
			_this._renderError('Can not compute URL for video');
		};

		function prep_transcript($transcript, transcript_array){
			var temp;
			for (var i = 0; i < transcript_array.length; i++) {
				var transcriptElem = transcript_array[i];
				
				var id = $n2.getUniqueId();
				transcriptElem.id = id;
				
				temp = $('<span/>')
					.attr('id', id)
					.attr('data-start', transcriptElem.start)
					.text(transcriptElem.text+ ' ')
					.appendTo($transcript)
					.click(function(e) {
						var $span = $(this);
						var currentTime = $span.attr('data-start');
						_this._updateCurrentTime(currentTime, 'text');
					});
			}
		}
	},
	
	_loadTranscript: function(doc){
		// Look for transcript in-line
		if( doc && doc.nunaliit_transcript ){
			this.transcript = doc.nunaliit_transcript;
			this._documentChanged();

		} else {
			// Find the attachment for the transcript
			var transcriptAttName = this._findTranscriptAttachmentName(this.doc);
			if( transcriptAttName ){
				// Load transcript
				var att = undefined;
				if( this.attachmentService ){
					att = this.attachmentService.getAttachment(this.doc, transcriptAttName);
				};

				var url = undefined;
				if( att ){
					url = att.computeUrl();
				};

				if( url ){
					// download content of attachment and call rendering function
					$.ajax({
						url: url
						,type: 'GET'
						,async: true
						,traditional: true
						,data: {}
						,dataType: 'json'
						,success: function(transcript) {
							_this.transcript = transcript;
							_this._documentChanged();
						}
						,error: function(XMLHttpRequest, textStatus, errorThrown) {
							// error while getting transcript. Jump into same error
							// as wrongly configured
							_this._renderError('Error fetching transcript');
						}
					});
				} else {
					// element is wronly configured. Report error
					_this._renderError('Can not compute URL for transcript');
				};
			} else {
				_this._renderError('Transcript attachment name not found for '+this.doc._id);
			};
		};
	},
	
	_findTranscriptAttachmentName: function(doc){
		if( doc 
		 && doc.nunaliit_attachments 
		 && doc.nunaliit_attachments.files ){
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				if( 'transcript.json' === attName ){
					return attName;
				};
			};
		};
		
		return undefined;
	},

	_updateCurrentTime: function(currentTime, origin){
		// Send notice to dispatcher
		this.dispatchService.send(DH,{
			type: 'mediaTimeChanged'
			,name: this.name
			,currentTime: currentTime
			,origin: origin
		});
		
		// Inform time model
		if( this.intervalSetEventName ){
			var min = this._convertVideoTimeToTime(currentTime);
			
			if( typeof min == 'number' ){
				var value = new $n2.date.DateInterval({
					min: min
					,max: this.intervalMax
					,ongoing: false
				});

				this.dispatchService.send(DH,{
					type: this.intervalSetEventName
					,value: value
				});
			};
		};
	},

	_timeChanged: function(currentTime, origin){
		// Act upon the text
		for(var i =0;i<this.transcript_array.length;i++) {
			var transcriptElem = this.transcript_array[i];
			var $transcriptElem = $('#'+transcriptElem.id);

			$transcriptElem.removeClass('highlight');

			if(currentTime >= transcriptElem.start 
			 && currentTime <= transcriptElem.fin) {
				$transcriptElem.addClass('highlight');
			};

			//$n2.log('current time: '+ currentTime);
		}
		
		if( 'model' === origin ){
			var $video = $('#'+this.videoId);
			var currentVideoTime = $video[0].currentTime;
			if( Math.abs(currentVideoTime - currentTime) < 0.5 ){
				// Debounce
			} else {
				$video[0].currentTime = currentTime;
			};
			
		} else if( 'text' === origin ){
			var $video = $('#'+this.videoId);
			$video[0].currentTime = currentTime;
			$video[0].play();
		}
	},
	
	_renderError: function(errMsg){
		var $elem = this._getElem();
		
		$elem.empty();
		
		var label = _loc('Unable to display tether content({docId})',{
			docId: this.docId
		});
		$('<span>')
			.addClass('n2widgetTranscript_error')
			.text(label)
			.appendTo($elem);
		
		$n2.logError('Unable to display tether content({docId}): '+errMsg);
	}
});

//--------------------------------------------------------------------------
var SrtToJsonConvertor = $n2.Class('SrtToJsonConvertor',{
	execute: function(srtData) {
		var json = [];
		var lines = srtData.split("\n");
		if( !$n2.isArray(lines) ){
			throw new Error('srtFile data processing error');
		};
		var cur = -1;
		var totalLength = lines.length;
		
		var curSentence = "";
		while( ++cur < totalLength){
			if( lines[cur].replace(/^\s+|\s+$/g,'') === ""){
				continue;
			} else {
				var tmpIdx = lines[cur].replace(/^\s+|\s+$/g,'');
				var tmpTimecode = lines[++cur].replace(/^\s+|\s+$/g,'');
				if(tmpIdx.search(/[0-9]+/i) === -1 || 
						tmpTimecode.search(/[0-9][0-9]:[0-9][0-9]:[0-9][0-9]\,[0-9][0-9][0-9] --> [0-9][0-9]:[0-9][0-9]:[0-9][0-9]\,[0-9][0-9][0-9]/i) === -1 ) {
					continue;
				} else {
					var curEntry = {
							"start": null,
							"fin": null,
							"text": ""
					};
					//$n2.log("The"+tmpIdx+"-th transcript");
					//$n2.log("The timecode: "+ tmpTimecode);
					
					curEntry.start  =  tmpTimecode.substring(0,2)*3600 + tmpTimecode.substring(3,5)*60 
					+ tmpTimecode.substring(6,8);
					curEntry.fin = tmpTimecode.substring(17,19)*3600 + tmpTimecode.substring(20,22)*60 
					+ tmpTimecode.substring(23,25);
					while((curSentence = lines[++cur])!== ""){
						curEntry.text += curSentence;
						}
					json.push(curEntry);
					
				}
				
			}
		}
		return json;
	},
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
	,SrtToJsonConvertor: SrtToJsonConvertor
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
