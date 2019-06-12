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

 
//+++++++++++++++++++++++++++++++++++++++++++++++
var CinemapMonitor = $n2.Construct('CinemapMonitor',{
	initialize: function(opts_){
		var opts = $n2.extend({
			cinemapUpdateCallback: function(cinemapByDocId){
				$n2.log('a cinemapUpdateCallback need to be implemented'
						+'and provided to cinemapMonitor');
			},
			sourceModelId: undefined
		}, opts_);
		var _this = this;
		
		this.cinemapUpdateCallback = opts.cinemapUpdateCallback
		this.cinemapByDocId = {};
		this.lastTargetCinemap = undefined;
		
		this.modelObserver = new $n2.model.DocumentModelObserver({
			dispatchService : this.dispatchService,
			sourceModelId: opts.sourceModelId,
			updatedCallback : function(state){
				_this._modelSourceUpdated(state);
			}
		});
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleDispatch(m, addr, dispatcher);
			};

			//this.dispatchService.register(DH,'modelGetInfo',f);
			//this.dispatchService.register(DH,'modelStateUpdated',f);
			//this.dispatchService.register(DH,'simplifiedGeometryReport',f);
		};
	},
	_modelSourceUpdated: function(state){
		
		var _this = this;
		var hasChangedInCinemaps = false;
		if( state.added ){
			state.added.forEach(function(addedDoc){
				if (addedDoc.atlascine2_cinemap){
					var cinemapId = addedDoc._id;
					var docInfo = _this.cinemapByDocId[cinemapId]
					if (!docInfo){
						docInfo = {};
						_this.cinemapByDocId [cinemapId]= docInfo;
					};
					docInfo.doc = addedDoc;
					hasChangedInCinemaps = true;
				}
			});
		};
		if( state.updated ){
			state.updated.forEach(function(updatedDoc){
				if(updatedDoc.atlascine2_cinemap){
					var docId = updatedDoc._id;
					var docInfo = _this.cinemapByDocId[docId];
					if( !docInfo ){
						docInfo = {};
						_this.cinemapByDocId[docId] = docInfo;
					};
					if( docInfo.doc ){
						if( docInfo.doc._rev !== updatedDoc._rev ){
							// New version of document. Clear simplified info
							delete docInfo.doc;
						};
					}
					docInfo.doc = updatedDoc;
					hasChangedInCinemaps = true;
				}
			});
				
		};
		if( state.removed ){
			state.removed.forEach(function(removedDoc){
				if(updatedDoc.atlascine2_cinemap){
					var docId = removedDoc._id;
					delete _this.cinemapByDocId[docId];
					hasChangedInCinemaps = true;
				}
			});
		};
		if( hasChangedInCinemaps) {
			this._documentUpdated();
		}
	},
	_documentUpdated: function(){
		if (typeof this.cinemapUpdateCallback === 'function'){
			this.cinemapUpdateCallback (this.cinemapByDocId);
		}
	}
	,getCinemapById (cinemapId){
		
	}
	,getCinemapByMediaDocId(mediaDocId){
		var rstDocInfo = undefined;
		for (var cinemapId in this.cinemapByDocId){
			var docInfo = this.cinemapByDocId[cinemapId];
			var cinemapProp = docInfo.doc.atlascine2_cinemap;
			var mediaDocProp = cinemapProp.media_doc_ref;
			var curMediaDocId = undefined;
			if (mediaDocProp.nunaliit_type === "reference"){
				curMediaDocId = mediaDocProp.doc;
			} else {
				throw new Error('The nunaliit_type prop in media_doc_ref must be a reference');
			};
			
			if (curMediaDocId 
				&& curMediaDocId === mediaDocId){
				rstDocInfo = docInfo;
			} 
			
		}
		this.lastTargetCinemap = rstDocInfo;
		return rstDocInfo;
	}
});


 
//+++++++++++++++++++++++++++++++++++++++++++++++
var CineAnnotationEditorView = $n2.Class('CineAnnotationEditorView',{
	
	currentDoc: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			
		}, opts_);
		
		this.$domNode = null;
		this.editorId = undefined;
		this.currentDoc = undefined;
		
		var mnt_opts = {};
		mnt_opts.cinemapUpdateCallback = function(cinemapByDocId){
			//TODO
		};
		mnt_opts.sourceModelId = "couchDb";
		this.monitor = new CinemapMonitor(mnt_opts);
	},
	render: function(){
		if (!this.editorId){
			this.editorId = $n2.getUniqueId();
		}
		var $formField = new $n2.mdc.MDCFormField({t:1});
		var $timepoints_start_label_name = $('<span>')
								.addClass('n2transcript_label_name')
								
								.text('Start: ' );
		var $timepoints_start_label = $('<span>')
									.addClass('n2transcript_label label_startTimeCode')
									.text('00.00.00,000');
		var $timepoints_fin_label_name = $('<span>')
						.addClass('n2transcript_label_name')
						.text('End: ');
		var $timepoints_fin_label = $('<span>')
									.addClass('n2transcript_label label_finTimeCode')
									.text('00.00.00,000');
		var $text_label = $('<span>')
							.addClass('n2transcript_label label_transcriptText')
							.text('');
		var tagBox = $('<div>')
						.attr('id', this.editorId )
						.n2TagBox();
		var $saveBtn = new $n2.mdc.MDCButton({
			btnLabel : 'Save',
			onBtnClick: function(){
				$n2.log("save button has been clicked");
			}
		});
		var $cancelBtn = new $n2.mdc.MDCButton({
			btnLabel : 'Cancel',
			onBtnClick: function(){
				$n2.log("cancel button has been clicked");
			}
		});
		
		$formField.append($timepoints_start_label_name);
		$formField.append($timepoints_start_label);
		$formField.append($timepoints_fin_label_name);
		$formField.append($timepoints_fin_label);
		$formField.append($text_label);
		$formField.append(tagBox);
		$formField.append($saveBtn);
		$formField.append($cancelBtn);
		
		
		this.$domNode = $formField.getDomRef();
		
//		this.$domNode = 
		return this.$domNode;
	},
	refresh: function(opts_){
		var opt = opts_.option;
		var data = opts_.data;
		var doc = opts_.doc;
		if( opt ){
			switch ( opt){
			case 'Annotation': 
				this.$domNode.find('span.label_startTimeCode').text(data.startTimeCode);
				this.$domNode.find('span.label_finTimeCode').text(data.finTimeCode);
				this.$domNode.find('span.label_transcriptText').text(data.text);
				break;
			default:
				break;
			}
		};
		
		if( doc ){
			this.currentDoc = doc;
		};
		
		var thisData = opts_._data;
		return this.$domNode;
	},
	_handle: function(){
		
	}
});
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
	rangeChangeEventName: null,
	rangeGetEventName: null,
	rangeSetEventName: null,

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

	isInsideContentTextPanel : null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerClass: undefined
			,dispatchService: undefined
			,attachmentService: undefined
			,name: undefined
			,docId: undefined
			,doc: undefined
			,sourceModelId: undefined
			, isInsideContentTextPanel : true
		},opts_);

		var _this = this;

		this.dispatchService = opts.dispatchService;
		this.attachmentService = opts.attachmentService;
		this.name = opts.name;
		this.docId = opts.docId;
		this.sourceModelId = opts.sourceModelId;
		
		
		this.isInsideContentTextPanel = opts.isInsideContentTextPanel;

		if( opts.doc ){
			this.doc = opts.doc;
			this.docId = this.doc._id;
		};
		if( !this.name ){
			this.name = $n2.getUniqueId();
		};

		this.transcriptConvertor = new SrtToJsonConvertor();
		this.transcriptDiv = undefined;
		this.transcript_array = [];

		this.lastTimeUserScroll = 0;
		this.mediaDivId = undefined;
		this.annotationEditor = undefined;
		
		// Get container
		var containerClass = opts.containerClass;
		if( !containerClass ){
			throw new Error('containerClass must be specified');
		};
		var $container = $('.'+containerClass);
		
		this.elemId = $n2.getUniqueId();
		
		if (this.isInsideContentTextPanel) {

			$('<div>')
			.attr('id',this.elemId)
			.addClass('n2widgetTranscript n2widgetTranscript_insideTextPanel')
			.appendTo($container);

		} else {
			$('<div>')
			.attr('id',this.elemId)
			.addClass('n2widgetTranscript')
			.appendTo($container);
		}
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
				 && sourceModelInfo.parameters ){
					if( sourceModelInfo.parameters.interval ){
						var paramInfo = sourceModelInfo.parameters.interval;
						this.intervalChangeEventName = paramInfo.changeEvent;
						this.intervalGetEventName = paramInfo.getEvent;
						this.intervalSetEventName = paramInfo.setEvent;
	
						if( paramInfo.value ){
							this.intervalMin = paramInfo.value.min;
							this.intervalMax = paramInfo.value.max;
						};
					};

					if( sourceModelInfo.parameters.range ){
						var paramInfo = sourceModelInfo.parameters.range;
						this.rangeChangeEventName = paramInfo.changeEvent;
						this.rangeGetEventName = paramInfo.getEvent;
						this.rangeSetEventName = paramInfo.setEvent;
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
				this.transcript = undefined;
				this.srtData = undefined;
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

				var videoMinStart = undefined;
				var videoMaxEnd = undefined;

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
					
					if( undefined === videoMinStart ){
						videoMinStart = videoStart;
					} else if(videoMinStart > videoStart) {
						videoMinStart = videoStart;
					};
					if( undefined === videoMaxEnd ){
						videoMaxEnd = videoEnd;
					} else if(videoMaxEnd < videoEnd) {
						videoMaxEnd = videoEnd;
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
				
				// Report video start and end
				$n2.log('Video start:'+videoMinStart+' end:'+videoMaxEnd);
				_this._rangeChanged(videoMinStart,videoMaxEnd);
			};
		};

		// At the end of all this, refresh
		this._refresh();
	},
	
	_rangeChanged: function(rangeStart, rangeEnd){
		var value = new $n2.date.DateInterval({
			min: rangeStart
			,max: rangeEnd
			,ongoing: false
		});

		this.dispatchService.send(DH,{
			type: this.rangeSetEventName
			,value: value
		});
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
			this.mediaDivId = $n2.getUniqueId();
			var mediaDivId = this.mediaDivId;
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
				,features: ['playpause','progress','volume','sourcechooser','fullscreen']
			}); 

			//little refine for css : specically for transcript
			//$('.n2_content_text').css('overflow','hidden');

			var $transcript = $('<div>')
				.attr('id', this.transcriptId)
				.addClass('n2widgetTranscript_transcript')
				.appendTo($mediaDiv);
			
			/*this.transcript_array = [
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
				
			];*/
		
			prep_transcript($transcript, this.transcript_array);

			// time update function: #highlight on the span to change the color of the text
			$video
				.bind('timeupdate', function() {
					var currentTime = this.currentTime;
					_this._updateCurrentTime(currentTime, 'video');
				})
				.bind('durationchange', function(e) {
					var duration = this.duration;
					$n2.log('duration changed: '+duration);
				});

		} else {
			_this._renderError('Can not compute URL for video');
		};

		function prep_transcript($transcript, transcript_array){
			var temp;
			var contextMenu = $('div.transcript-context-menu').remove();
			
			var context_menu_text = ['Annotation', 'Extra'];
			var transcript_context_menu_list = $('<ul>');
			$.each(context_menu_text, function(i){
				var li = $('<li/>')
							.text(context_menu_text[i])
							.click(function(){
								var curSentenceData = contextMenu.data();
								if (curSentenceData){
									_this._renderDrawer(context_menu_text[i], curSentenceData);
								};
							})
							.appendTo(transcript_context_menu_list);
			});
			var contextMenu = $('<div>')
								.addClass("transcript-context-menu")
								.addClass("transcript-context-menu-hide")
								.append(transcript_context_menu_list)
								.appendTo(document.body);
			for (var i = 0; i < transcript_array.length; i++) {
				var transcriptElem = transcript_array[i];
				
				var id = $n2.getUniqueId();
				transcriptElem.id = id;
				
				temp = $('<span/>')
					.attr('id', id)
					.attr('data-start', transcriptElem.start)
					.attr('data-fin', transcriptElem.fin)
					.attr('data-startcode', transcriptElem.startTimeCode)
					.attr('data-fincode', transcriptElem.finTimeCode)
					.addClass('n2-transcriptWidget-sentence')
					.text(transcriptElem.text+ ' ')
					.appendTo($transcript)
					.contextmenu( function(e){
						var elmnt = e.target;
						
						e.preventDefault();

						var isEditorAvailable = _this._isAnnotationEditorAvailable();
						if( isEditorAvailable ){
							var eid = $(elmnt).attr('id');
							var curStart =$(elmnt).attr('data-start');
							var curFin = $(elmnt).attr('data-fin');
							var startTimeCode = $(elmnt).attr('data-startcode');
							var finTimeCode = $(elmnt).attr('data-fincode');
							var curTxt = $(elmnt).text();
							contextMenu.data({
								start: curStart,
								startTimeCode: startTimeCode,
								finTimeCode: finTimeCode,
								end: curFin,
								text: curTxt
							})
							contextMenu[0].style.left = e.pageX + 'px';
							contextMenu[0].style.top = e.pageY + 'px';
							contextMenu.removeClass('transcript-context-menu-hide');
							//contextMenu[0].style.display = 'block';

							for(var i =0;i<_this.transcript_array.length;i++) {
								var transcriptElem = _this.transcript_array[i];
								var $transcriptElem = $('#'+transcriptElem.id);
								$transcriptElem.removeClass('sentence-highlight-pending');
							}
							$(this).addClass('sentence-highlight-pending')
							//_this._renderDrawer();
							 //var toRepl = "to=" + eid.toString()
							 //contextMenu.innerHTML = contextMenu.innerHTML.replace(/to=\d+/g,toRepl)
							 //alert(rgtClickContextMenu.innerHTML.toString())
						};
					})
					.click(function(e) {
						switch(e.which){
						case 1:
							contextMenu.addClass('transcript-context-menu-hide');
							$(this).removeClass('sentence-highlight-pending')
							var $span = $(this);
							var currentTime = $span.attr('data-start');
							_this._updateCurrentTime(currentTime, 'text');
							break;
						case 2:
							break;
						case 3:
							break;
						
						}
						// close the context menu, if it still exists
						
					});
				
			}
			$transcript.on('scroll', function(){
				
				contextMenu.addClass('transcript-context-menu-hide');
				_this._closeDrawer();
				
				for(var i =0;i<_this.transcript_array.length;i++) {
					var transcriptElem = _this.transcript_array[i];
					var $transcriptElem = $('#'+transcriptElem.id);
					$transcriptElem.removeClass('sentence-highlight-pending');
				}
			})
			$(document).on('click', function(e){
				// TBD: This will never be true
				if(_this.drawer){
					var $clickTarget = e.target;
					if ( $clickTarget.closest('.transcript-context-menu')){

						contextMenu.addClass('transcript-context-menu-hide');
						for(var i =0;i<_this.transcript_array.length;i++) {
							var transcriptElem = _this.transcript_array[i];
							var $transcriptElem = $('#'+transcriptElem.id);
							$transcriptElem.removeClass('sentence-highlight-pending');
						}
					}
					//not click on editor drawer, close drawer
					else if ( !$clickTarget.closest('#' + _this.drawer.getId())){
						contextMenu.addClass('transcript-context-menu-hide');
						_this._closeDrawer();
						
						for(var i =0;i<_this.transcript_array.length;i++) {
							var transcriptElem = _this.transcript_array[i];
							var $transcriptElem = $('#'+transcriptElem.id);
							$transcriptElem.removeClass('sentence-highlight-pending');
						}
					} 
				}	
			})
		}
	},
	_closeDrawer: function(){
		this.dispatchService.send(DH,{
			type: 'annotationEditorClose'
		});
	}
	,
	_renderDrawer: function(ctxMenuOption, curSentenceData){
		
		this.dispatchService.send(DH,{
			type: 'annotationEditorStart'
			,ctxMenuOption: ctxMenuOption
			,curSentenceData: curSentenceData
		});
	},

	_isAnnotationEditorAvailable: function(){
		var m = {
			type: 'annotationEditorIsAvailable'
			,available: false
		};

		this.dispatchService.synchronousCall(DH,m);

		return m.available;
	},

	_loadTranscript: function(doc){
		var _this = this;
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

	/**
	 * Receives the current time as video time
	 */
	_updateCurrentTime: function(currentTime, origin){
		// Send notice to dispatcher
		this.dispatchService.send(DH,{
			type: 'mediaTimeChanged'
			,name: this.name
			,currentTime: currentTime
			,origin: origin
		});
		
		 //Inform time model
		if( this.intervalSetEventName ){
			//var min = this._convertVideoTimeToTime(currentTime);
			var max = currentTime;
			
			if( typeof max == 'number' ){
				var value = new $n2.date.DateInterval({
					min: 0
					,max: max
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
		
		var _this = this;
		
		// console.dir($._data($('#'+ this.transcriptId)[0], 'events'));
		// Act upon the text
		for(var i =0;i<this.transcript_array.length;i++) {
			var transcriptElem = this.transcript_array[i];
			var $transcriptElem = $('#'+transcriptElem.id);

			$transcriptElem.removeClass('highlight');

			if(currentTime >= transcriptElem.start 
			 && currentTime < transcriptElem.fin) {
				$transcriptElem.addClass('highlight');
				//scroll transcript div, so that the ongoing subtitle always stay in the viewport
				if ($.now() - this.lastTimeUserScroll > 5000){
				
					this._scrollToView($transcriptElem);
				}

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
				$video[0].play();
			};
			
		} else if( 'text' === origin ){
			var $video = $('#'+this.videoId);
			$video[0].currentTime = currentTime;
			$video[0].play();
		}
	},
	
	_onUserScrollAction: function(evt){
		this.lastTimeUserScroll = $.now();
	},
	_scrollToView: function($dst) {
		var _this = this;
		var parent_height = $dst.parent().innerHeight();
		var curr_pos = $dst.offset().top - $dst.parent().offset().top;
		if (curr_pos > parent_height *2 / 3 || curr_pos < 0){
			$('#'+ this.transcriptId).off("scroll", _this._onUserScrollAction.bind(_this));
			var oldOffset = $dst.parent().scrollTop();
			$dst.parent().scrollTop(oldOffset + curr_pos);
			
			var inid = setInterval(function(){
				var curOffset = $dst.parent().scrollTop();
				if(curOffset !== oldOffset){
					
				} else {
					$('#'+ _this.transcriptId).on("scroll", _this._onUserScrollAction.bind(_this));
					clearInterval(inid);
				}
				oldOffset = curOffset;
			},100);
		}
	},
	_renderError: function(errMsg){
		var $elem = this._getElem();
		
		$elem.empty();
		//If no valid tether transcript content to show, only logging into console
//
//		var label = _loc('Unable to display tether content({docId})',{
//			docId: this.docId
//		});
//		$('<span>')
//			.addClass('n2widgetTranscript_error')
//			.text(label)
//			.appendTo($elem);
//
		$n2.logError('Unable to display tether content({docId}): '+errMsg);
	}
});

//--------------------------------------------------------------------------
var AnnotationEditorWidget = $n2.Class('AnnotationEditorWidget',{
	
	dispatchService: null,

	elemId: null,

	// Model that selects the document to edit
	sourceModelId: null,
	
	docsById: null,
	
	currentDocId: null,
	
	annotationEditor: null,
	
	drawer: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: undefined
			,dispatchService: undefined
			,sourceModelId: undefined
		},opts_);

		var _this = this;

		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		
		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);

		this.docsById = {};
		this.currentDocId = null;
		this.annotationEditor = null;
		this.drawer = null;
		
		this.elemId = $n2.getUniqueId();
		$('<div>')
			.attr('id', this.elemId)
			.addClass('n2AnnotationEditor')
			.appendTo($container);
		
		
		// Set up dispatcher
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			this.dispatchService.register(DH, 'modelStateUpdated', f);
			this.dispatchService.register(DH,'annotationEditorStart',f);
			this.dispatchService.register(DH,'annotationEditorClose',f);
			this.dispatchService.register(DH,'annotationEditorIsAvailable',f);

			if( this.sourceModelId ){
				// Initialize state
				var state = $n2.model.getModelState({
					dispatchService: this.dispatchService
					,modelId: this.sourceModelId
				});
				if( state ){
					this._sourceModelUpdated(state);
				};
			};
		};

		$n2.log(this._classname, this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_startEditor: function(ctxMenuOption, curSentenceData){
		if (!this.annotationEditor) {
			this.annotationEditor = new CineAnnotationEditorView({
				
			});

			var drawerContainer = this.annotationEditor.render();
			if( !this.drawer ){
				var $container = this._getElem();
				var containerId = $n2.utils.getElementIdentifier($container);
				this.drawer = new $n2.ui.drawer({
					containerId: containerId,
					customizedContent: drawerContainer,
					width : '500px'
				});
			}
			
		};
		
		var currentDoc = undefined;
		if( this.currentDocId ){
			currentDoc = this.docsById[this.currentDocId];
		};
		
		this.annotationEditor.refresh({
			option: ctxMenuOption,
			data: curSentenceData,
			doc: currentDoc
		});
		
		this.drawer.open();
	},
	
	_closeEditor: function(){
		if (this.drawer) {
			this.drawer.close();
		}
	},

	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( 'annotationEditorStart' === m.type ){
			var ctxMenuOption = m.ctxMenuOption;
			var curSentenceData = m.curSentenceData;

			this._startEditor(ctxMenuOption, curSentenceData);

		} else if( 'annotationEditorClose' === m.type ){
			this._closeEditor();

		} else if( 'annotationEditorIsAvailable' === m.type ){
			m.available = true;

		} else if( 'modelStateUpdated' === m.type ){
			// Does it come from one of our sources?
			if( this.sourceModelId === m.modelId ){
				this._sourceModelUpdated(m.state);
			};
		};
	},
	
	_refreshCurrentDoc: function(){
		if( this.docsById[this.currentDocId] ){
			// OK, nothing has changed
		} else {
			// Select a new document
			this.currentDocId = undefined;
			for(var docId in this.docsById){
				this.currentDocId = docId;
			};
			
			if( !this.currentDocId ){
				this._closeEditor();

			} else if( this.annotationEditor ){
				var doc = this.docsById[this.currentDocId];
				this.annotationEditor.refresh({
					doc: doc
				});
			};
		};
	},
	
	_sourceModelUpdated: function(sourceState){
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;
				
				this.docsById[docId] = doc;
			};
		};
		if( sourceState.updated ){
			for(var i=0,e=sourceState.updated.length; i<e; ++i){
				var doc = sourceState.updated[i];
				var docId = doc._id;
				
				this.docsById[docId] = doc;
			};
		};
		if( sourceState.removed ){
			for(var i=0,e=sourceState.removed.length; i<e; ++i){
				var doc = sourceState.removed[i];
				var docId = doc._id;
				
				delete this.docsById[docId];
			};
		};
		
		this._refreshCurrentDoc();
	}
});

//--------------------------------------------------------------------------
var reTimeCode = /([0-9][0-9]):([0-9][0-9]):([0-9][0-9])((\,|\.)[0-9]+)?\s*-->\s*([0-9][0-9]):([0-9][0-9]):([0-9][0-9])((\,|\.)[0-9]+)?/i;
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
		while( ++cur < (totalLength-1)){
			if( lines[cur].replace(/^\s+|\s+$/g,'') === ""){
				continue;
			} else {
				var tmpIdx = lines[cur].replace(/^\s+|\s+$/g,'');
				var tmpTimecode = lines[++cur].replace(/^\s+|\s+$/g,'');
				var matcher = reTimeCode.exec(tmpTimecode);
				if(tmpIdx.search(/[0-9]+/i) === -1
				 || !matcher ) {
					continue;
				} else {
					var curEntry = {
							"start": null,
							"startTimeCode": matcher[1]+ ':' + matcher[2] + ':' + matcher[3] + matcher[4],
							"fin": null,
							"finTimeCode": matcher[6]+ ':' + matcher[7] + ':' + matcher[8] + matcher[9],
							"text": ""
					};
					//$n2.log("The"+tmpIdx+"-th transcript");
					//$n2.log("The timecode: "+ tmpTimecode);

					curEntry.start  =  3600*matcher[1] + 60*matcher[2] + 1*matcher[3];
					curEntry.fin = 3600*matcher[6] + 60*matcher[7] + 1*matcher[8];
					while(++cur < totalLength){
						curSentence = lines[cur];
						if( curSentence.replace(/^\s+|\s+$/g,'') === "" ){
							break;
						};
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

	} else if( m.widgetType === 'annotationEditorWidget' ){
		m.isAvailable = true;
	};
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'transcriptWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerClass = widgetOptions.containerClass;
		var config = m.config;
		
		var options = {};
		
		if( widgetOptions ){
			for(var key in widgetOptions){
				var value = widgetOptions[key];
				options[key] = value;
			};
		};

		options.containerClass = containerClass;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.attachmentService = config.directory.attachmentService;
		};
		
		new TranscriptWidget(options);

	} else if( m.widgetType === 'annotationEditorWidget' ){
		var widgetOptions = m.widgetOptions;
		var containerId = widgetOptions.containerId;
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
		};
		
		new AnnotationEditorWidget(options);
	};
};

//--------------------------------------------------------------------------
$n2.widgetTranscript = {
	TranscriptWidget: TranscriptWidget
	,AnnotationEditorWidget: AnnotationEditorWidget
	,SrtToJsonConvertor: SrtToJsonConvertor
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
