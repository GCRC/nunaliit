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

var _loc = function(str,args) { 
	return $n2.loc(str,'nunaliit2',args); 
};

var DH = 'n2.widgetTranscript';

//+++++++++++++++++++++++++++++++++++++++++++++++
// Given start and end time, find timeLinks matching in the set
// timeLink = {
//    "starttime": "00:00:36,230"
//    "endtime":   "00:00:42,780"
//    "tags": [
//        {
//            "type": "place"
//            "value": "rwanda"
//        }
//        {
//            "type": "theme"
//            "value": "violence"
//        }
//    ]
//    "linkRef": {
//        "nunaliit_type": "reference"
//        "doc": "stock.rwanda"
//    }
// }
 
var context_menu_text = ['Tag Selection...', 'Map Tags...', 'Settings...'];
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
	
	_contextMenuClass: null,
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
	subtitleFormat : null, 

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

	tagsBySentenceSpanIds: null,

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
			,cinemapModelId: undefined
			,subtitleModelId: undefined
			, isInsideContentTextPanel : true
		},opts_);

		var _this = this;

		this.dispatchService = opts.dispatchService;
		this.attachmentService = opts.attachmentService;
		this.name = opts.name;
		this.docId = opts.docId;
		this.sourceModelId = opts.sourceModelId;
		this.subtitleModelId = opts.subtitleModelId;
		this._contextMenuClass = 'transcript-context-menu';
		
		this.isInsideContentTextPanel = opts.isInsideContentTextPanel;

		if( opts.doc ){
			this.doc = opts.doc;
			
			// The mediaDocument id, since media document is the target referenced by cinemapdoc and srtdoc
			this.docId = this.doc._id;
		}

		if( !this.name ){
			this.name = $n2.getUniqueId();
		}

		this.transcriptDiv = undefined;
		this.transcript_array = [];
		this.subtitleFormat = undefined;
		this.lastTimeUserScroll = 0;
		this.mediaDivId = undefined;
		this.annotationEditor = undefined;
		this._lastCtxTime = undefined;
		
		// Get container
		var containerClass = opts.containerClass;
		if( !containerClass ){
			throw new Error('containerClass must be specified');
		}

		var $container = $('.'+containerClass);
		
		this.elemId = $n2.getUniqueId();
		this.mediaAndSubtitleDivId = $n2.getUniqueId();
		this.mediaDivId = $n2.getUniqueId();
		this.subtitleDivId = $n2.getUniqueId();
		this.subtitleSelectionDivId = $n2.getUniqueId();
		this.srtSelectionId = $n2.getUniqueId();
		this.srtSelector = undefined;

		this.tagsBySentenceSpanIds = {};
		
		if (this.isInsideContentTextPanel) {
			var $elem = $('<div>')
				.attr('id',this.elemId)
				.appendTo($container);
			
			$('<div>')
				.attr('id', this.subtitleSelectionDivId)
				.appendTo($elem);
			
			var $mediaAndSubtitleDiv = $('<div>')
				.attr('id', this.mediaAndSubtitleDivId)
				.addClass('n2widgetTranscript n2widgetTranscript_insideTextPanel')
				.appendTo($elem);
			
			$('<div>')
				.attr('id', this.mediaDivId)
				.appendTo($mediaAndSubtitleDiv);
			
			$('<div>')
				.attr('id', this.subtitleDivId)
				.addClass('n2widgetTranscript_transcript')
				.appendTo($mediaAndSubtitleDiv);
			
			this._reInstallSubtitleSel();

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
						}
					}

					if( sourceModelInfo.parameters.range ){
						var paramInfo = sourceModelInfo.parameters.range;
						this.rangeChangeEventName = paramInfo.changeEvent;
						this.rangeGetEventName = paramInfo.getEvent;
						this.rangeSetEventName = paramInfo.setEvent;
					}
				}
			}

			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			this.dispatchService.register(DH, 'modelStateUpdated', f);
			this.dispatchService.register(DH,'mediaTimeChanged',f);
			this.dispatchService.register(DH,'documentContent',f);
			this.dispatchService.register(DH,'replyColorForDisplayedSentences', f);

			if( this.intervalChangeEventName ){
				this.dispatchService.register(DH,this.intervalChangeEventName,f);
			}
			
			// If the widget was built specifying a specific document, then do not change
			// content on user selection. If no document specified, then listen to user selection.
			if( !this.docId ){
				//this.docId = m.docId;
				//this.doc = m.doc;
				this.timeTable = [];
				this.transcript = undefined;
				this.srtData = undefined;
				this.subtitleFormat = undefined;
				//this.dispatchService.register(DH,'selected',f);
			}
		}

		$n2.log(this._classname, this);

		this._documentChanged();
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_getMediaAndSubtitleDiv: function(){
		return $('#' + this.mediaAndSubtitleDivId );
	},
	
	_getMediaDiv: function(){
		return $('#' + this.mediaDivId );
	},
	
	_getSubtitleDiv: function(){
		return $('#' + this.subtitleDivId );
	},
	
	_getSubtitleSelectionDiv: function(){
		return $('#' + this.subtitleSelectionDivId );
	},

	_getSubtitleSelection: function(){
		return $('#' + this.srtSelectionId );
	},
	
	_reInstallSubtitleSel: function(){
		var _this = this;
		var $elem = this._getSubtitleSelectionDiv();
		
		$elem.empty();
		if (this.srtSelector) {
			delete this.srtSelector;
			this.srtSelector = undefined;
		}
		
		var menOpts = [];
		if (this.docId
			&& _this.mediaDocIdToSrtDocs
			&& _this.mediaDocIdToSrtDocs[this.docId]){
			_this.mediaDocIdToSrtDocs[this.docId].forEach(function(srtDoc){
				menOpts.push({
					value: srtDoc._id,
					text: srtDoc.atlascine_subtitle.language
				})
			});
		}
		
		if (menOpts.length > 0){
			this.srtSelector = new $n2.mdc.MDCSelect({
				selectId: _this.srtSelectionId,
				menuOpts: menOpts,
				parentElem: $elem,
				preSelected: true,
				menuLabel: 'Language',
				menuChgFunction:function(){
					var $sel = $(this)
						.find('li.mdc-list-item--selected');

					var selectValue;
					if ($sel[0] && $sel[0].dataset && $sel[0].dataset.value) {
						selectValue = $sel[0].dataset.value;
					}
					$n2.log('Change Subtitle File: ' + selectValue);
					_this._handleSrtSelectionChanged(selectValue);
				}
			})
		}
	},
	
	/**
	 * Event handling method that's called when the srt selection is changed.
	 * The method gets the new transcript attachment, and the document is changed. 
	 * @param {string} docId - document id
	 */
	_handleSrtSelectionChanged: function(docId){
		var _this = this;
		var selectSrtDocId = docId;
		if ( !selectSrtDocId ) return;

		var transcriptAttName = _this._findTranscriptAttachmentName(selectSrtDocId);
		if (transcriptAttName && _this.transcript) {
			_this.transcript = $n2.extend(_this.transcript, {
				srtDocId: selectSrtDocId,
				srtAttName : transcriptAttName
			})

			_this.srtData = undefined;
			_this._documentChanged();

		} else {	
			_this._renderError('Transcript or media attachment names not found for ' + selectSrtDocId);
			alert('Transcript or media attachment not found in media document ' + selectSrtDocId);
		}
	},
	
	_handle: function(m, addr, dispatcher){
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
			if( m.name === this.name ){
				this._timeChanged(m.currentTime, m.origin);
			}
			
		} else if( 'documentContent' === m.type ){
			if( m.docId === this.docId ){
				if( !this.doc ){
					this.doc = m.doc;
					this._documentChanged();
				} else if( this.doc._rev !== m.doc._rev ){
					this.doc = m.doc;
					this._documentChanged();
				}
			}

		} else if( this.intervalChangeEventName === m.type ) {
			//$n2.log("intervalChangeEvent "+this.intervalChangeEventName+" => ", m);

			if( m.value ){
				this.intervalMin = m.value.min;
				this.intervalMax = m.value.max;
				
				var videoTime = this._convertTimeToVideoTime(this.intervalMin);
				if( typeof videoTime == 'number' ){
					this._timeChanged(videoTime, 'model');
				}
			}
			
		} else if ( 'modelStateUpdated' === m.type){
			if( this.sourceModelId === m.modelId ){
				// Check if cinemap selection changed;
				var mediaDocChanged = this._cinemapUpdated(m.state);
				if (mediaDocChanged){
					this.timeTable = [];
					this.transcript = undefined;
					this.srtData = undefined;
					this.subtitleFormat = undefined;
					this._refresh();
					this._documentChanged();
				}

			} else if (this.subtitleModelId === m.modelId ){
				this._updateMediaToSrtMap(m.state);
				this._reInstallSubtitleSel();
			}

		} else if( 'selected' === m.type ){
			if( m.docId != this.docId ){
				this.docId = m.docId;
				this.doc = m.doc;
				this.timeTable = [];
				this.transcript = undefined;
				this.srtData = undefined;
				this.subtitleFormat = undefined;
				this._documentChanged();
			}

		} else if ( 'replyColorForDisplayedSentences' === m.type ){
			//$n2.log('colors: ', m.data);
			this._color_transcript(m.data);
		}
	},
	
	_updateMediaToSrtMap: function(sourceState){
		if( sourceState.added ){
			for(var i=0,e=sourceState.added.length; i<e; ++i){
				var doc = sourceState.added[i];
				var docId = doc._id;
			
				if( doc.atlascine_subtitle ){
					this.mediaDocIdToSrtDocs = this.mediaDocIdToSrtDocs || {};
					this.srtDocs = this.srtDocs || {};
					this.srtDocs[docId] = doc;
					
					if ( doc.atlascine_subtitle.linkedMediaDocId ){
						var mediaDocId = doc.atlascine_subtitle.linkedMediaDocId.doc;
						if ( !this.mediaDocIdToSrtDocs[mediaDocId] ){
							this.mediaDocIdToSrtDocs[mediaDocId] = [];
						} 
						this.mediaDocIdToSrtDocs[mediaDocId].push(doc);
					}
				}
			}
		}
	},
	
	_getTranscriptDiv: function(){
		var $rst = $('div.n2widgetTranscript_transcript');
		if ($rst.length < 1 || $rst.get(0) == document) {
			return null;
		} else {
			return $rst;
		}
	},
	
	_cinemapUpdated: function(sourceState){
		var i, e, doc, docId, media_doc_ref, mediaDocId;
		var _this = this;
		var cineIsUpdated = false;

		// Loop through all removed documents
		if( sourceState.removed ){
			for(i=0, e=sourceState.removed.length; i<e; ++i){
				doc = sourceState.removed[i];
				docId = doc._id;
				if( doc.atlascine_cinemap ){
					//_this.docId = undefined;
				}
			}
		}
		
		if( sourceState.added ){
			for(i=0,e=sourceState.added.length; i<e; ++i){
				doc = sourceState.added[i];
				docId = doc._id;

				//If new cinemapDocument is added, update the cinemap info in this widget
				if( doc.atlascine_cinemap ){
					media_doc_ref = doc.atlascine_cinemap.media_doc_ref;
					if (media_doc_ref){
						mediaDocId = media_doc_ref.doc;
						if (mediaDocId
							&& mediaDocId !== _this.docId) {
							_this.docId = mediaDocId;
							cineIsUpdated = true;
						}
					}
				}
			}
		}

		// Loop through all updated documents
		if( sourceState.updated ){
			for(i=0, e=sourceState.updated.length; i<e; ++i){
				doc = sourceState.updated[i];
				docId = doc._id;
				if( doc.atlascine_cinemap ){
					media_doc_ref = doc.atlascine_cinemap.media_doc_ref;
					mediaDocId = media_doc_ref.doc;
					if (mediaDocId
						&& mediaDocId !== _this.docId) {
						_this.docId = mediaDocId;
						cineIsUpdated = true;
					}
				}
			}
		}
		return cineIsUpdated;
	},

	_convertTimeToVideoTime: function(t){
		var vTime = undefined;
		
		if( this.timeTable ){
			this.timeTable.forEach(function(timeEntry){
				if( timeEntry.timeStart < t && t < timeEntry.timeEnd ){
					var frac = (t - timeEntry.timeStart) / (timeEntry.timeEnd - timeEntry.timeStart);
					vTime = timeEntry.videoStart + (frac * (timeEntry.videoEnd - timeEntry.videoStart))
				}
			});
		}
		return vTime;
	},

	/**
	 * This method is called when we detect that the document has changed. This can be triggered
	 * through a new selection from the user, or an update to the currently selected document.
	 */
	_documentChanged: function(){
		var _this = this;
		if (!this.docId){
			$n2.log('n2.widgetTranscript inital document change');
			return;

		} else if( !this.doc || this.docId !== this.doc._id ){
			// We do not have the document. Request it.
			this.doc = undefined;
			this.dispatchService.send(DH, {
				'type': 'requestDocument'
				,'docId': this.docId
			});
			this._reInstallSubtitleSel();
			//return;

		} else if( !this.transcript ){
		
			this._loadVideoFile();
			this._loadTranscript(this.doc);
			//return;

		} else if( !this.srtData ){
			var attSrt = undefined;
			if (this.attachmentService
				&& this.transcript 
				&& this.transcript.fromMediaDoc){
				attSrt = this.attachmentService.getAttachment(this.doc, this.transcript.srtAttName);
			} else if( this.attachmentService
				&& this.transcript 
				&& this.transcript.srtAttName ){
				attSrt = this.attachmentService.getAttachment(this.srtDocs[this.transcript.srtDocId], this.transcript.srtAttName);
			}

			var srtUrl = undefined;
			if( attSrt ){
				srtUrl = attSrt.computeUrl();
			}

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
						_this.subtitleFormat = _this.subtitleFormat || 'SRT';
						switch(_this.subtitleFormat){
							case 'SRT':
								_this.transcript_array = SubtitleFileParser.srt.parse(srtData);
								break;
							case 'WEBVTT':
								_this.transcript_array = SubtitleFileParser.webvtt.parse(srtData);
								break;
						}
						_this._documentChanged();
					}

					,error: function(XMLHttpRequest, textStatus, errorThrown) {
						// error while getting SRT content. Jump into same error
						// as wrongly configured
						_this._documentChanged();
					}
				});

			} else {
				$n2.log('Can not find any valid SRT/WEBVTT file');
			}
//		} else if( this.transcript.timeTable ){
		}

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
		var $subtitleSelectionDiv = this._getSubtitleSelectionDiv();
		
		// this $elem is the media and subtitle div
		var $elem = this._getMediaDiv();
		$elem.empty();
		$elem = this._getSubtitleDiv();
		$elem.empty();

		if( !this.doc || this.docId !== this.doc._id ){
			return;
		}

		if ( !this.transcript || !this.transcript.videoAttName ){
			//Blocking method to load video file first;
			//this._loadVideoFile();
			return;
		}

		var attVideoName = undefined;
		if( this.transcript ){
			attVideoName = this.transcript.videoAttName;
		}

		var attVideoDesc = null;
		var data = this.doc; // shorthand
		if( data 
			&& data.nunaliit_attachments
			&& data.nunaliit_attachments.files
			&& attVideoName ) {
			attVideoDesc = data.nunaliit_attachments.files[attVideoName];

			if( attVideoDesc
				&& attVideoDesc.fileClass !== 'video' ){
				attVideoDesc = undefined;
			}
		}

		var thumbnailUrl = null;
		if( attVideoDesc
			&& attVideoDesc.thumbnail ){
			var attThumb = this.attachmentService.getAttachment(this.doc, attVideoDesc.thumbnail);

			if( attThumb ){
				thumbnailUrl = attThumb.computeUrl();
			}
		}

		var attVideoUrl = undefined;
		if( attVideoDesc 
			&& attVideoDesc.status === 'attached' ) {
			var attVideo = this.attachmentService.getAttachment(this.doc, attVideoName);

			if( attVideo ){
				attVideoUrl = attVideo.computeUrl();
			}
		}

		if( attVideoUrl ) {
			//this.mediaDivId = $n2.getUniqueId();
			var mediaDivId = this.mediaDivId;
			this.videoId = $n2.getUniqueId();
			this.transcriptId = this.subtitleDivId;

			var $mediaDiv = this._getMediaDiv();
			$mediaDiv.empty();
			
			//DIV for the Video
			var $video = $('<video>')
				.attr('id', this.videoId)
				.attr('controls', 'controls')
				.attr('width', '100%')
				.attr('height', '360px')
				.attr('preload', 'metadata')
				.appendTo($mediaDiv);

			var $videoSource = $('<source>')
				.attr('src', attVideoUrl)
				.appendTo($video);

			if( attVideoDesc.mimeType ){
				$videoSource.attr('type', attVideoDesc.mimeType);
			}
	
			$video.mediaelementplayer({
				poster: thumbnailUrl
				,alwaysShowControls : true
				,pauseOtherPlayers : false
				,features: ['volume', 'playpause', 'progress','sourcechooser']
			}); 

			$video
				.bind('timeupdate', function() {
					var currentTime = this.currentTime;
					_this._updateCurrentTime(currentTime, 'video');
				})
				.bind('durationchange', function(e) {
					_this.dispatchService.send(DH, {
						type: "transcriptVideoDurationChange",
						value: this.duration
					});
					_this.dispatchService.send(DH, {
						type: _this.intervalSetEventName
						, value: new $n2.date.DateInterval({
							min: 0
							, max: this.duration
							, ongoing: false
						})
					});
				});
			
			// If using embedded srt, remove the srt file selector
			if ( this.transcript.fromMediaDoc ){
				this._getSubtitleSelectionDiv().empty();
			}
			
			if ( this.transcript && this.transcript.srtAttName ){
				var $transcript = this._getSubtitleDiv();
				$transcript.empty();
				prep_transcript($transcript, this.transcript_array);

			} else {
				//this._documentChanged();
			}

		} else {
			_this._renderError('Can not compute URL for video');
		}

		function _rightClickCallback (e, $this, contextMenu, selections){
			var hoveredElem = e.target;
			//e.preventDefault();

			var isEditorAvailable = _this._isAnnotationEditorAvailable();
			
			if( isEditorAvailable ){
				for(var i =0;i<_this.transcript_array.length;i++) {
					var transcriptElem = _this.transcript_array[i];
					var $transcriptElem = $('#'+transcriptElem.id);
					$transcriptElem.removeClass('sentence-highlight-pending');
				}

				if (! selections || selections.size() === 0) {
					return;
				}
				
				var ctxdata = [];
				var idxOfHoverEl = selections.index(
					$('div#'+ $(hoveredElem).attr('id'))
				);

				if (idxOfHoverEl >= 0){
					selections.each(function(){
						var $elmnt = $(this);
						var curStart =$elmnt.attr('data-start');
						var curFin = $elmnt.attr('data-fin');
						var startTimeCode = $elmnt.attr('data-startcode');
						var finTimeCode = $elmnt.attr('data-fincode');
						var curTxt = $elmnt.text();
						
						var _d = {
							start: curStart,
							startTimeCode: startTimeCode,
							finTimeCode: finTimeCode,
							end: curFin,
							text: curTxt
						};
						ctxdata.push(_d);
						$elmnt.addClass('sentence-highlight-pending');
					})		

				} else {
					$(hoveredElem)
						.parent()
						.children().each(function(){
							if ($(this).hasClass('selected')){
								$(this).removeClass('selected');
							}
						});
					$(hoveredElem).addClass('selected');
					
					var $elmnt = $(hoveredElem);
					var curStart =$elmnt.attr('data-start');
					var curFin = $elmnt.attr('data-fin');
					var startTimeCode = $elmnt.attr('data-startcode');
					var finTimeCode = $elmnt.attr('data-fincode');
					var curTxt = $elmnt.text();
					
					var _d = {
						start: curStart,
						startTimeCode: startTimeCode,
						finTimeCode: finTimeCode,
						end: curFin,
						text: curTxt
					};
					ctxdata.push(_d);
				}
				
				contextMenu.data({value: ctxdata});
				contextMenu[0].style.left = e.pageX + 'px';
				contextMenu[0].style.top = e.pageY + 'px';
				contextMenu.removeClass('transcript-context-menu-hide');
			}
		}

		function prep_transcript($transcript, transcript_array){
			var currentSelectSentences = undefined;
			
			//Create contextMenu for transcripts
			var contextMenu = $('div.' + _this._contextMenuClass);
			if (contextMenu.length > 0){
				contextMenu.remove();
			}

			var transcript_context_menu_list = $('<ul>');
			$.each(context_menu_text, function(i){
				$('<li/>')
					.text(context_menu_text[i])
					.click(function(){
						var senDataArr = contextMenu.data().value;
						if (senDataArr && senDataArr.length == 1 ){
							var currentTime = senDataArr[0].start;
							if (typeof currentTime !== "undefined"){
								_this._updateCurrentTime(currentTime, 'startEditing');
							}
						}

						if (senDataArr && senDataArr.length > 0){
							_this._renderDrawer(context_menu_text[i], senDataArr);
						}

						$('div.' + _this._contextMenuClass).addClass("transcript-context-menu-hide");
					})
					.appendTo(transcript_context_menu_list);
			});

			contextMenu = $('<div>')
				.addClass( _this._contextMenuClass)
				.addClass("transcript-context-menu-hide")
				.append(transcript_context_menu_list)
				.appendTo(document.body);

			//drawing all the sentence and binding event for click and right click
			_this.tagsBySentenceSpanIds = {};
			for (var i = 0,e = transcript_array.length; i < e; i++) {
				var transcriptElem = transcript_array[i];
				//hack to seperate single click and double click
				var DELAY = 300, clicks = 0, timer = null;
				var id = $n2.getUniqueId();
				transcriptElem.id = id;
				_this.tagsBySentenceSpanIds[id] = {
					start:transcriptElem.startTimeCode
					,end : transcriptElem.finTimeCode
				}

				$('<div>')
					.attr('id', id)
					.attr('data-start', transcriptElem.start)
					.attr('data-fin', transcriptElem.fin)
					.attr('data-startcode', transcriptElem.startTimeCode)
					.attr('data-fincode', transcriptElem.finTimeCode)
					.addClass('n2-transcriptWidget-sentence')
					.addClass('n2transcript_sentence_' + $n2.utils.stringToHtmlId(id))
					.html(transcriptElem.text+ " ")
					.appendTo($transcript)
			}

			$('div#'+ _this.transcriptId).multiSelect({
				unselectOn: 'head',
				keepSelection: false,
				stop: function($sel, $elem) {
					currentSelectSentences = undefined;
					currentSelectSentences = $sel;
				}
			});
			
			$('div.n2widgetTranscript_transcript div').on('mouseup', function(e){
				e.preventDefault();
				var _that = this;
				if (e.ctrlKey){
					e.preventDefault();
					return false;
				}

				clicks++;
				if(clicks === 1) {
					timer = setTimeout(function() {
						//perform single-click action  
						switch(e.which){
						case 1:
							contextMenu.addClass('transcript-context-menu-hide');
							if (e.ctrlKey || e.metaKey || e.shiftKey){
								
							} else {
								$(_that).removeClass('sentence-highlight-pending')
								var $span = $(_that);
								var currentTime = $span.attr('data-start');
								_this._updateCurrentTime(currentTime, 'text-oneclick');
							}
							
							break;
						case 2:
							break;
						case 3:
							_rightClickCallback(e, $(this), contextMenu, currentSelectSentences);

						}  
						clicks = 0;             //after action performed, reset counter
					}, DELAY);

				} else {
					clearTimeout(timer);    //prevent single-click action
					//perform double-click action
					switch(e.which){
					case 1:
						contextMenu.addClass('transcript-context-menu-hide');
						$(_that).removeClass('sentence-highlight-pending')
						var $span = $(_that);
						var currentTime = $span.attr('data-start');
						_this._updateCurrentTime(currentTime, 'text');
						break;
					case 2:
						break;
					case 3:
						break;
					}
					clicks = 0;             //after action performed, reset counter
				}
				// close the context menu, if it still exists
			})
			.on('dblclick', function(e){
				e.preventDefault();
			})
			.on ('contextmenu', function(e){
				e.preventDefault();
				return true;
			});
			
			_this.dispatchService.send(DH, {
				type: 'resetDisplayedSentences'
				,data: _this.tagsBySentenceSpanIds
			})
			
			// Deal with scrolling, the scrolling should close the annotationEditor
			$transcript.on('scroll', function(e){
				e.stopPropagation();
				contextMenu.addClass('transcript-context-menu-hide');
				_this._closeDrawer();
	
//				for(var i =0;i<_this.transcript_array.length;i++) {
//					var transcriptElem = _this.transcript_array[i];
//					var $transcriptElem = $('#'+transcriptElem.id);
//					$transcriptElem.removeClass('sentence-highlight-pending');
//				}
			})
		}

		function closeCtxMenu(){
			
		}
	},

	_color_transcript: function(colorMap){
		var $set = this._getTranscriptDiv();
		if ( $set ){
			$set.find('.n2widgetTranscript_transcript').each(function(){
				var $elem = $(this);
				$elem.css({"background-color" : 'transparent'});
			})
		}

		for (var id in colorMap) {
			var _data = colorMap[id];
			var _color = _data.color;
			if ( _color ){
				if ( $set ){
					$set.find('.n2transcript_sentence_' + $n2.utils.stringToHtmlId(id)).each(function(){
						var $elem = $(this);
						$elem.css({"background-color" : _color});
					})
				}
			}
		}
	},

	_closeDrawer: function(){
		this.dispatchService.send(DH,{
			type: 'annotationEditorClose'
		});
	},

	_renderDrawer: function(ctxMenuOption, senDataArr){
		this.dispatchService.send(DH,{
			type: 'annotationEditorStart'
			,ctxMenuOption: ctxMenuOption
			,senDataArr: senDataArr
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

	_loadVideoFile: function(){
		var mediaDocId = this.docId;
		var mediaAttName = this._findVideoAttachmentName(this.doc);
		if ( mediaAttName ){
			this.transcript = {};
			this.transcript.videoAttName = mediaAttName;
			//_this._documentChanged();

		} else {	
			this._renderError('Media attachment names not found for '+this.doc._id);
			alert('Media attachment not found in media document ' + this.doc._id);
		}
	},
	
	_loadTranscript: function(doc){
		var _this = this;
		var transcriptAttName;
		// Look for transcript in-line
		if( doc && doc.nunaliit_transcript ){
			this.transcript = doc.nunaliit_transcript;
			this._documentChanged();

		} else if (doc) {
			// Found srt attachment in media doc
			transcriptAttName =  this._findTranscriptAttachmentNameFromMediaDoc(doc);
			if ( transcriptAttName ){
				_this.transcript = $n2.extend(_this.transcript, {
					fromMediaDoc: true,
					srtAttName : transcriptAttName
				})
				_this._documentChanged();
				return;
			}
			
			// Retrieve srt attachments from atlascine_subtitle documents.
			var selectSrtDocId;

			if (this.srtSelector) {
				selectSrtDocId = this.srtSelector.getSelectedValue();
			}

			if (!selectSrtDocId) {
				return;
			}
 
			transcriptAttName = this._findTranscriptAttachmentName(selectSrtDocId);
			if ( transcriptAttName && _this.transcript){
				_this.transcript = $n2.extend(_this.transcript, {
					srtDocId: selectSrtDocId,
					srtAttName : transcriptAttName
				})

				_this._documentChanged();

			} else {	
				_this._renderError('Transcript or media attachment names not found for '+this.doc._id);
				alert('Transcript or media attachment not found in media document ' + this.doc._id);
			}
			
		} else {
			// Find the attachment for the transcript
			transcriptAttName = this._findTranscriptAttachmentName(this.doc);
			if( transcriptAttName ){
				// Load transcript
				var att = undefined;
				if( this.attachmentService ){
					att = this.attachmentService.getAttachment(this.doc, transcriptAttName);
				}

				var url = undefined;
				if( att ){
					url = att.computeUrl();
				}

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
				}

			} else {
				_this._renderError('Transcript attachment name not found for '+this.doc._id);
			}
		}
	},
	
	/**
	 * Retrieve subtitle attachment (either src or vtt format) from media document.
	 * This is for backward compatibility consideration
	 * @param {object} doc - Media doc.
	 * @returns {string} - Returns the attachement file name.
	 */
	_findTranscriptAttachmentNameFromMediaDoc: function(doc){
		if( doc 
			&& doc.nunaliit_attachments 
			&& doc.nunaliit_attachments.files ){
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				if( attName.endsWith('.srt')){
					this.subtitleFormat = 'SRT';
					return attName;
				} else if( attName.endsWith('.vtt') ){
					this.subtitleFormat = 'WEBVTT';
					return attName;
				}
			}
		}
		return undefined;
	},
	
	/**
	 * Retrieve subtitle attachment (either src or vtt format) from subtitle document
	 * @param {string} docId - Doc id for subtitle document.
	 * @returns {string} - Returns the attachement file name.
	 */
	_findTranscriptAttachmentName: function(docId){
		if( this.srtDocs[docId] ){
			var doc = this.srtDocs[docId];
			if(doc 
				&& doc.nunaliit_attachments 
				&& doc.nunaliit_attachments.files ){
				for(var attName in doc.nunaliit_attachments.files){
					var att = doc.nunaliit_attachments.files[attName];
					if( attName.endsWith('.srt')){
						this.subtitleFormat = 'SRT';
						return attName;
					} else if( attName.endsWith('.vtt') ){
						this.subtitleFormat = 'WEBVTT';
						return attName;
					}
				}
			}
		}
		return undefined;
	},
	
	_findVideoAttachmentName: function(doc){
		if( doc 
			&& doc.nunaliit_attachments 
			&& doc.nunaliit_attachments.files ){
			for(var attName in doc.nunaliit_attachments.files){
				var att = doc.nunaliit_attachments.files[attName];
				if( (att.fileClass === 'video'|| att.fileClass === 'audio')
					&& att.conversionPerformed){
					return attName;
				}
			}
		}
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
		
		// Inform time model
		if( this.intervalSetEventName ){
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
			}
		}
	},

	_timeChanged: function(currentTime, origin){
		var $video;
		var _this = this;
		var n_cur = Number (currentTime);
			// console.dir($._data($('#'+ this.transcriptId)[0], 'events'));
		// Act upon the text
		$('#' + _this.transcriptId + ' > div').removeClass('highlight');
		
		$n2.utils.processLargeArrayAsync(_this.transcript_array, function(transcriptElem, _index_, _array_ ){
			var $transcriptElem = $('#'+transcriptElem.id);
			//$transcriptElem.removeClass('highlight');

			if(n_cur >= transcriptElem.start 
				&& n_cur < transcriptElem.fin) {
				$transcriptElem.addClass('highlight');
				//scroll transcript div, so that the ongoing subtitle always stay in the viewport
				if ($.now() - _this.lastTimeUserScroll > 5000){
				
					_this._scrollToView($transcriptElem);
				}
			}
		});
		
		if( 'model' === origin ){
			$video = $('#'+this.videoId);
			var currentVideoTime = $video[0].currentTime;
			if( Math.abs(currentVideoTime - currentTime) < 0.5 ){
				// Debounce
			} else {
				$video[0].currentTime = currentTime;
				$video[0].play();
			}
			
		} else if( 'text' === origin ){
			$video = $('#'+this.videoId);
			$video[0].currentTime = currentTime;
			$video[0].play();
		
		} else if ('text-oneclick' === origin){
			$video = $('#'+this.videoId);
			_this.pauseVideo($video[0], currentTime);
			
		} else if('startEditing' === origin){
			_this._lastCtxTime = currentTime;
	
		} else if ( 'savedState' === origin ){
			$video = $('#'+this.videoId);
			$video[0].load();
			$video[0].currentTime = currentTime;

			$video[0].play();
			var inid = setInterval(function(){
				var isPlaying = $video[0].currentTime > 0 && !$video[0].paused && !$video[0].ended 
					&& $video[0].readyState > 2;

				if(!isPlaying){
						
				} else {
					$video[0].pause();
					clearInterval(inid);
				}				
			},100);
		} 
	},
	
	pauseVideo: function($video, currentTime){
		$video.currentTime = currentTime;
		var volume = $video.getVolume();
		$video.setMuted(true);
		$video.play();
		var inid = setInterval(function(){
			var isPlaying = $video.currentTime > 0 && !$video.paused && !$video.ended 
				&& $video.readyState > 2;

			if(!isPlaying){
				
			} else {
				$video.pause();
				$video.setMuted(false);
				$video.setVolume(volume);
				clearInterval(inid);
			}
		},50);
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
				if(curOffset !== oldOffset) {
					
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
		$n2.logError('Unable to display tether content({docId}): '+errMsg);
	}
});

// --------------------------------------------------------------------------
var SubtitleFileParser = {
	srt:{
		parse: function(srtData) {
			var reTimeCode = /^([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/;
			var reTimeCode_s = /([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})((\,|\.)([0-9]+))?\s*/i;
			var json = [];
			var lines = srtData.split(/\r?\n/);
			if( !$n2.isArray(lines) ){
				throw new Error('srtFile data processing error');
			}
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
							"startTimeCode": matcher[1],
							"fin": null,
							"finTimeCode": matcher[3],
							"text": ""
						};
						//$n2.log("The"+tmpIdx+"-th transcript");
						//$n2.log("The timecode: "+ tmpTimecode);

						curEntry.start  =  $n2.utils.convertSMPTEtoSeconds(matcher[1]);
						curEntry.fin = $n2.utils.convertSMPTEtoSeconds(matcher[3]);
						while(++cur < totalLength){
							curSentence = lines[cur];
							if( curSentence.replace(/^\s+|\s+$/g,'') === "" ){
								curEntry.text += ' ';
								break;
							}
							curEntry.text += curSentence;
						}

						json.push(curEntry);
						}
					}
				}
				return json;
			}
		},
		
		webvtt:{
			pattern_identifier : /^([a-zA-z]+-)?[0-9]+$/
			,pattern_timecode : /^([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{1,3})?) --\> ([0-9]{2}:[0-9]{2}:[0-9]{2}([,.][0-9]{3})?)(.*)$/
			,parse: function(trackText) {
			// match start "chapter-" (or anythingelse)
				
			var i = 0,
				lines = trackText.split(/\r?\n/),
				//entries = {text:[], times:[]},
				entries = [],
				timecode,
				text;

			for(; i<lines.length; i++) {
				// check for the line number
				//if (this.pattern_identifier.exec(lines[i])){
				// skip to the next line where the start --> end time code should be
				//i++;
				timecode = this.pattern_timecode.exec(lines[i]);				
				//if (timecode) {
				if (timecode && i<lines.length){
					i++;
					// grab all the (possibly multi-line) text that follows
					text = lines[i];
					i++;

					while(lines[i] !== '' && i<lines.length){
						text = text + '\n' + lines[i];
						i++;
					}

					//text = $.trim(text).replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig, "<a href='$1' target='_blank'>$1</a>");
					// Text is in a different array so I can use .join
					//entries.text.push(text);
					entries.push({
						'start': ($n2.utils.convertSMPTEtoSeconds(timecode[1]) == 0) ? 0.000 : $n2.utils.convertSMPTEtoSeconds(timecode[1]),
						'fin': $n2.utils.convertSMPTEtoSeconds(timecode[3]),
						'startTimeCode' : timecode[1], 
						'finTimeCode': timecode[3],
						'settings': timecode[5],
						'text' : text
					});
				}
			}
			return entries;
		}
	}
}

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	
	if( m.widgetType === 'transcriptWidget' ){
		m.isAvailable = true;
	}
}

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
			}
		}

		options.containerClass = containerClass;
		
		if( config && config.directory ){
			options.dispatchService = config.directory.dispatchService;
			options.attachmentService = config.directory.attachmentService;
		}
		
		new TranscriptWidget(options);
	}
}

//--------------------------------------------------------------------------
$n2.widgetTranscript = {
	TranscriptWidget: TranscriptWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
