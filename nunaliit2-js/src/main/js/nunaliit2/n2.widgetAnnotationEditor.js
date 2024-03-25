/*
Copyright (c) 2019, Geomatics and Cartographic Research Centre, Carleton
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
	var DH = 'n2.widgetAnnotationEditor';

	var CineAnnotationEditorMode = {
		TAGSELECTION: 'tagselection',
		TAGGROUPING: 'taggrouping',
		TAGSETTING: 'tagsetting'
	};

	var context_menu_text = [
		'widget.annotationEditor.contextMenu.timeLink',
		'widget.annotationEditor.contextMenu.mapThemes',
		'widget.annotationEditor.contextMenu.settings'
	];

	// Find the time links based on start & end time link values.
	function findTimeLink(timeLinks, startTime, endTime) {
		var result = [];
		var timeLink, i, e, start_in_ms, end_in_ms;
		var target_start = startTime.replace(',', '.');
		var target_end = endTime.replace(',', '.');
		if (target_start && target_end) {

			for (i = 0, e = timeLinks.length; i < e; i += 1) {
				try {
					timeLink = timeLinks[i];
					start_in_ms = timeLink.starttime.replace(',', '.');
					end_in_ms = timeLink.endtime.replace(',', '.');

					// Add time link element to result if start and end times
					// match the time link values.
					if (start_in_ms &&
						end_in_ms &&
						start_in_ms === target_start &&
						end_in_ms === target_end) {
						result.push(timeLink);
					}
				} catch (err) {
					// $n2.log('Error: timelink formatting error');
					// console.log('Index:' + i + err.stack);
					continue;
				}
			}
		}
		return result;
	}

	// +++++++++++++++++++++++++++++++++++++++++++++++
	// Given a timelink, find a tag by value
	function findTimeLinkTagByValue(timeLink, value) {
		var result = undefined;

		if (timeLink && timeLink.tags) {
			timeLink.tags.forEach(function(tag) {
				if (tag
					&& tag.value
					&& tag.value + '--' + tag.type === value) {
					result = tag;
				}
			});
		}
		return result;
	}

	// +++++++++++++++++++++++++++++++++++++++++++++++
	// Given a timelink and tags, update the timelink
	function updateTimeLinkWithTags(timeLink, tagValues) {
		var kv, tag;
		var updated = false;

		for (kv in tagValues) {
			tag = findTimeLinkTagByValue(timeLink, kv);
			if (!tag) {
				tag = tagValues[kv];
				delete tag['fraction'];
				if (!timeLink.tags) {
					timeLink.tags = [];
				}
				timeLink.tags.push(tag);
				updated = true;
			}
		}
		return updated;
	}

	// +++++++++++++++++++++++++++++++++++++++++++++++
	/**
	* Creates a new data depot object, containing data on the focused sentence.
 	* @classdesc The data depot for focusing sentence.
 	*/
	var AnnotationEditorDataDepot = $n2.Construct('AnnotationEditorDataDepot',{
		initialize: function(opts_) {
			var opts = $n2.extend({
				dispatchService: undefined
			}, opts_);

			this.dispatchService = opts.dispatchService;
			this.editorMode = undefined;
			this.focusSentences = [];
			/*	focusSentences : [
			{
				start: '0',
				end: '10',
				tags : {
					'a (k+'--'+ v)':'alpha',
					'b (k+'--'+ v)': 'beta'
				}
			},
			{
				start: '11',
				end: '20',
				tags : {
					'a (k+'--'+ v)':'alpha',
					'c (k+'--'+ v)': 'charlie'
				}
			}
		]*/
			this._doc = undefined;
			this._data = undefined;
			this._option = undefined;
		},

		/**
		 * Add a new full tag profile object to a sentence tag array.
		 * @param {object} tagProfile A tag profile object containing tag data;
		 * tag value, chip text, fraction type (full), and tag type.
		 */
		addFullTag: function(tagProfile) {
			this.focusSentences.forEach(function(sentence) {
				var k = tagProfile.value + '--' + tagProfile.type;
				sentence.tags[k] = tagProfile;
			});
		},

		/**
		 * Add a new partial tag profile object to a sentence tag array.
		 * @param {object} tagProfile A tag profile object containing tag data;
		 * tag value, chip text, fraction type (full), and tag type.
		 * @param {string} start start time value
		 * @param {string} end end time value
		 */
		addPartialTag: function(start, end, tagProfile) {
			this.focusSentences.forEach(function(sentence) {
				var k;
				if (sentence.start === start
					&& sentence.end === end) {
					k = tagProfile.value + '--' + tagProfile.type;
					sentence.tags[k] = tagProfile;
				}
			});
		},

		/**
		 * Delete a full tag profile object from a sentence tag array.
		 * @param {object} tagProfile A tag profile object containing tag data;
		 * tag value, fraction type, and tag type.
		 */
		deleteTag: function(tagProfile) {
			this.focusSentences.forEach(function(sentence) {
				var k = tagProfile.value + '--' + tagProfile.type;
				delete sentence.tags[k];
			});
		},

		/**
		 * Delete a partial tag profile object from a sentence tag array.
		 * @param {object} tagProfile A tag profile object containing tag data;
		 * tag value, fraction type, and tag type.
		 * @param {string} start start time value
		 * @param {string} end end time value
		 */
		deletePartialTag: function(start, end, tagProfile) {
			this.focusSentences.forEach(function(sentence) {
				var k;
				if (sentence.start === start
					&& sentence.end === end) {
					k = tagProfile.value + '--' + tagProfile.type;
					delete sentence.tags[k];
				}
			});
		},

		/**
		 * Retrieve the matching sentence based on start and end time codes
		 * @param {object} startTimeCode Time code for the start of the sentence
		 * @param {object} endTimeCode Time code for the end of the sentence.
		 * @return {array} A list of sentence objects which match the start and
		 * end time codes.
		 */
		getMatchingSen: function(startTimeCode, endTimeCode) {
			var result = [];
			this.focusSentences.forEach(function(fs) {
				var start = fs.start;
				var end = fs.end;
				if (start === startTimeCode
					&& end === endTimeCode) {
					result.push(fs);
				}
			});
			return result;
		},

		// Get the list of focus sentence data.
		getData: function() {
			return this.focusSentences;
		},

		// Set the list of focus sentence values
		setData: function(data) {
			var _this = this;
			// reset sentences in focus
			this.reset();
			var doc = this._doc;

			// Get timelinks from selected document.
			if (doc
				&& doc.atlascine_cinemap) {
				var timeLinks = doc.atlascine_cinemap.timeLinks;
				if (!timeLinks) {
					// Create timeLinks if it doesn't exist
					timeLinks = [];
					doc.atlascine_cinemap.timeLinks = timeLinks;
					// return;
				}

				if (data && $n2.isArray(data)) {
					data.forEach(function(d) {
						var start = d.startTimeCode;
						var end = d.finTimeCode;
						var text = d.text;
						var totalTags = {};

						// Get time links with match start and end times
						var matchingLinks = findTimeLink(
							timeLinks,
							start,
							end);

						// Create a new time link object, if no matching links
						// exists.
						if (!matchingLinks.length) {
							var newTimeLink = {
								'starttime': start
								,'endtime': end
								,'tags': []
								,'relatedImage': []
								,'notes': ''
//								,"linkRef": {
//									"nunaliit_type": "reference"
//									"doc": "stock.rwanda"
//								}
							};
							matchingLinks.push(newTimeLink);
						}

						let relatedImage = [];
						let notes = "";

						matchingLinks.forEach(function(e) {
							if (e.tags) {
								e.tags.forEach(function(t) {
									var key = t.value + '--' + t.type;
									totalTags[key] = t;
								});
							}
							/* This appears to only ever return one thing... */
							relatedImage = e.relatedImage;
							notes = e.notes;
						});

						// Create Sentence Record
						var senRec = {
							start
							, end
							, tags: totalTags
							, relatedImage
							, notes
							, text
						};

						_this.focusSentences.push(senRec);
					});
				}
			}
		},

		getDoc: function() {
			return this._doc;
		},

		setDoc: function(doc) {
			this._doc = doc;
		},

		setOption: function() {

		},

		reset: function() {
			this.focusSentences.length = 0;
		},
	});

	/**
	 * @classdesc The real editor for sentence annotation. It is created for
	 * atlascine and aims to provide sentence annotation function for
	 * widgetTranscript widget. It can live in AnnotationWidget container or
	 * other container if user want to.
	 */
	var CineAnnotationEditorView = $n2.Class('CineAnnotationEditorView',{

		dispatchService: null,

		dialogService: null,

		onSaved: null,

		onCancel: null,

		editorId: null,

		innerFormId: null,

		currentDoc: null,

		currentStartTime: null,

		currentEndTime: null,

		tagbox: null,

		editorMode: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				dispatchService: undefined,
				attachmentService: undefined,
				onSaved: undefined,
				onCancel: undefined
			}, opts_);

			var _this = this;
			this.dispatchService = opts.dispatchService;
			this.dialogService = opts.dialogService;
			this.onSaved = opts.onSaved;
			this.onCancel = opts.onCancel;
			this.editorId = $n2.getUniqueId();
			this.innerFormId = $n2.getUniqueId();
			this.currentDoc = undefined;
			this.currentStartTime = undefined;
			this.currentEndTime = undefined;
			this.editorMode = undefined;
			this.editorAggregateMode = true;
			this.dataDepot = new AnnotationEditorDataDepot({});
			this._default_setting = {
				globalScaleFactor: 1
				, globalTimeOffset: 0.5
				, globalDefaultPlaceZoomLevel: 10
				, globalInitialMapExtent: [0]
			};

			this.gloScaleFactorId = $n2.getUniqueId();
			this.gloTimeOffsetId = $n2.getUniqueId();
			this.cinemapDefaultPlaceZoomLevelId = $n2.getUniqueId();
			this.cinemapInitialMapViewId = $n2.getUniqueId();

			var f = function(m, addr, dispatcher) {
				_this._handle(m, addr, dispatcher);
			};

			if (this.dispatchService) {
				this.dispatchService.register(DH, 'annotationEditorViewRefresh', f);
				this.dispatchService.register(DH, 'annotationEditorViewAggregateModeChanged', f);
			}
		},

		_handle: function(m, addr, dispatcher) {
			var _this = this;
			if (m.type === 'annotationEditorViewRefresh') {
				var option = m.option;
				var data = m.data;
				var doc = m.doc;
				this.refresh({
					option: option,
					data: data,
					doc: doc
				});

				_this.dispatchService.send(DH, {
					type: 'annotationEditorViewRefreshDone'
				});

			} else if (m.type === 'annotationEditorViewAggregateModeChanged') {
				var checked = m.value;
				_this.onEditorAggregateModeChanged(checked);
			}
		},

		getElem: function() {
			return $('#' + this.editorId);
		},

		// Get the element id of the inner form div
		getInnerForm: function() {
			return $('#' + this.innerFormId);
		},

		// Add annotation editor control and form container.
		render: function(opts){
			var _this = this;
			var $container = opts.container;
			var $formField = $('<div>')
				.attr('id', this.editorId)
				.appendTo($container);

			// Style switch to be placed in-line with content below.
			var $switchContainer = $('<div>')
				.css('margin', '10px 0px 0px 20px')
				.appendTo($formField);

			// Add switch for aggregation
			/*new $n2.mdc.MDCSwitch({
				parentElem: $switchContainer,
				label: _loc('Aggregation'),
				initiallyOn: _this.editorAggregateMode,
				onChangeCallBack: function(checked) {
					_this.dispatchService.send(DH, {
						type: 'annotationEditorShowLoader'
					});

					setTimeout(function() {
						_this.dispatchService.send(DH, {
							type: 'annotationEditorViewAggregateModeChanged'
							,value: checked
						});
					}, 0);
				}
			});*/

			// Add container div for theme tag box, place tag box, and
			// comments text box.
			$('<div>')
				.attr('id', this.innerFormId)
				.appendTo($formField);

			// Add Save and Cancel Control Buttons.
			new $n2.mdc.MDCButton({
				parentElem: $formField,
				btnLabel: _loc('Save'),
				onBtnClick: function() {
					_this._clickedSave();
				}
			});

			if (this.onCancel) {
				new $n2.mdc.MDCButton({
					parentElem: $formField,
					btnLabel: _loc('Cancel'),
					onBtnClick: function() {
						_this._clickedCancel();
					}
				});
			}
			return $formField;
		},

		onEditorAggregateModeChanged: function(checked) {
			var _this = this;
			this.editorAggregateMode = checked;
			this.refresh();

			_this.dispatchService.send(DH, {
				type: 'annotationEditorViewRefreshDone'
			});
		},

		// Handle clicking the save button.
		_clickedSave: function() {
			var _this = this;
			var isLoggedIn = undefined;
			if (this.dispatchService) {
				var m = {
					type: 'authIsLoggedIn',
					isLoggedIn: false
				};
				this.dispatchService.synchronousCall(DH, m);
				isLoggedIn = m.isLoggedIn;
			}

			if (!isLoggedIn) {
				$n2.log("Auth is not logged in.");
				this.dispatchService.send(DH,{
					type: 'loginShowForm'
				});
				// alert("Please sign in before adding annotations");
				return;
			}

			var docId = undefined;
			if (this.currentDoc) {
				docId = this.currentDoc._id;

			} else {
				alert('Current document not selected');
				return;
			}

			// Load current document
			var documentSource = undefined;
			if (this.dispatchService) {
				var m = {
					type: 'documentSourceFromDocument'
					,doc: this.currentDoc
				};
				this.dispatchService.synchronousCall(DH, m);
				documentSource = m.documentSource;
			}

			if (!documentSource) {
				$n2.logError('Can not find document source for: ' + this.currentDoc._id);
			}

			documentSource.getDocument({
				docId: this.currentDoc._id
				,onSuccess: function(doc) {
					switch(_this.editorMode) {
					case CineAnnotationEditorMode.TAGSELECTION:
						updateDocForTags(doc, _this.dataDepot);
						break;
					case CineAnnotationEditorMode.TAGGROUPING:
						updateDocForTagGrouping(doc);
						break;
					case CineAnnotationEditorMode.TAGSETTING:
						updateDocForTagSetting(doc);
						break;
					default:
						break;
					}
				}
				,onError: function(err) {
					$n2.reportErrorForced(_loc('Unable to reload document: {err}',{err: err}));
				}
			});

			// Update document if modified.
			function updateDocForTags(doc, depot) {
				var senData = depot.getData();
				var modified = false;
				senData.forEach(function(sd) {
					var start = sd.start;
					var end = sd.end;
					var tagValues = sd.tags;
					if (typeof start !== "undefined"
						&& typeof end !== "undefined"
						&& typeof tagValues !== "undefined") {
						modified |= singleSectionUpdate (doc, tagValues, start, end);
					}
				})

				if (modified) {
					documentSource.updateDocument({
						doc: doc
						,onSuccess: onSaved
						,onError: function(err) {
							$n2.reportErrorForced(_loc('Unable to submit document: {err}',{err: err}));
						}
					});

				} else {
					alert('Not changed!');
				}
			}

			function singleSectionUpdate(doc, tagValues, start, end) {
				// Modify current document
				var modified = false;
				var lastTagsMapByTimelink = {};
				if (doc
					&& doc.atlascine_cinemap) {
					var timeLinks = doc.atlascine_cinemap.timeLinks;
					if (!timeLinks) {
						// Create if it does not exist
						timeLinks = [];
						doc.atlascine_cinemap.timeLinks = timeLinks;
					}

					var matchingLinks = findTimeLink(
						timeLinks,
						start,
						end
					);

					if (matchingLinks.length < 1) {
						// Should I create one? If so, how?
						var newTimeLink = {
							'starttime': start
							,'endtime': end
							,'tags': []
							,'relatedImage': []
							,'notes': ''
//							,"linkRef": {
//								"nunaliit_type": "reference"
//								"doc": "stock.rwanda"
//							}
						};
						doc.atlascine_cinemap.timeLinks.push(newTimeLink);
						matchingLinks.push(newTimeLink);
					}


					// Check and verify deleting tag(s)
					matchingLinks.forEach(function(timeLink) {
						if (timeLink.tags
							&& $n2.isArray(timeLink.tags)) {
							timeLink.tags.forEach(function(tag) {
								var tagString = tag.value + '--' + tag.type;
								if (!Object.hasOwnProperty.call(lastTagsMapByTimelink, tagString)) {
									lastTagsMapByTimelink[tagString] = [];
								}
								lastTagsMapByTimelink[tagString].push(timeLink);
							});
						}
					});

					for (var lsttag in lastTagsMapByTimelink) {
						if (tagValues[lsttag] === undefined) {
							lastTagsMapByTimelink[lsttag].forEach(function(link) {
								var trashbin = [];
								for (var i = 0,e = link.tags.length; i < e; i++) {
									var tarkey = link.tags[i].value + '--' + link.tags[i].type;
									if (tarkey === lsttag) {
										trashbin.push(i);
									}
								}
								trashbin.forEach(function(tsh) {
									link.tags.splice(tsh, 1);
								});
							});
							modified = true;
						}
					}

					const tagNotesSelector = "n2WidgetAnnotationEditorTaggingNotes";
					const newImages = [];
					[...document.getElementsByClassName("n2WidgetAnnotationEditorTaggingImages")].forEach(container => {
						[...container.children].forEach(imageSection => {
							const newImage = {};
							[...imageSection.children].forEach((child, index) => {
								if (index === 0) {
									newImage.image = child?.children[0]?.children[1]?.dataset.trueUrl;
								}
								else if (index === 1) {
									newImage.caption = child?.children[0].value;
								}
							});
							newImages.push(newImage);
						});
					});
					const taggingNotes = document.getElementById(tagNotesSelector) ? document.getElementById(tagNotesSelector).value : "";

					matchingLinks.forEach(timeLink => {
						if (updateTimeLinkWithTags(timeLink, tagValues)) {
							modified = true;
						}
						if (timeLink.relatedImage !== newImages) {
							timeLink.relatedImage = newImages;
							modified = true;
						}
						if (timeLink.notes !== taggingNotes) {
							timeLink.notes = taggingNotes;
							modified = true;
						}
					});
				}
				return modified;
			}

			function updateDocForTagGrouping (doc) {
				var $formfieldSections = $('div#' + _this.innerFormId + ' div.n2WidgetAnnotation_tagGroup_formfieldSection');
				var modified = false;
				var oldTagColors = doc.atlascine_cinemap.tagColors;
				var oldTagGroups = doc.atlascine_cinemap.tagGroups;
				var newTagColors = {};
				var newTagGroups = {};

				let invalidColour = false;
				const hexColourRegex = /#(?:[0-9a-fA-F]{6})/;
				const invalidColours = [];
				let missingTags = false;
				let invalidGroupTagName = false;
				const invalidGroupTagNames = [];

				$formfieldSections.each(function() {
					var color = $(this).find('input.n2transcript_input.input_colorpicker').val();
					var name = $(this).find('input.n2transcript_input.input_tagname').val();
					var tagbox = $(this).find('div.n2-tag-box > div.mdc-chip-set');
					var tagValues = (tagbox.first().data('tags'));
					if (typeof name !== "undefined"
						&& (name.length === 0
							|| name.trim().length === 0)) {
						invalidGroupTagName = true;
						invalidGroupTagNames.push(name);
					}
					if (typeof color !== "undefined"
						&& color.length === 7
						&& hexColourRegex.test(color)
						&& typeof name !== "undefined") {
						newTagColors[name] = color;
					}
					else {
						invalidColour = true;
						invalidColours.push(color);
					}

					if (typeof tagValues !== "undefined"
						&& Array.isArray(tagValues)
						&& tagValues.length > 0
						&& typeof name !== "undefined") {
						newTagGroups[name] = tagValues;
					}
					else {
						missingTags = true;
					}
				});
				
				if (invalidGroupTagName) {
					new $n2.mdc.MDCDialog({
						dialogHtmlContent: `${_loc("widget.annotationeditor.grouptag.invalid.name")}<br>${invalidGroupTagNames.toString()}`
						, closeBtn: true
					});
					return;
				}

				if (invalidColour) {
					new $n2.mdc.MDCDialog({
						dialogHtmlContent: `${_loc("widget.annotationeditor.grouptag.invalid.colour")}<br>${invalidColours.toString()}`
						, closeBtn: true
					});
					return;
				}

				if (missingTags) {
					new $n2.mdc.MDCDialog({
						dialogHtmlContent: `${_loc("widget.annotationeditor.grouptag.missing.tags")}`
						, closeBtn: true
					});
					return;
				}

				modified = tagGroupsIsModified(oldTagColors, oldTagGroups, newTagColors, newTagGroups);
				
				if (modified) {
					doc.atlascine_cinemap.tagColors = newTagColors;
					doc.atlascine_cinemap.tagGroups = newTagGroups;
					$n2.log('newTagColors: ', newTagColors);
					$n2.log('newtagGroups: ', newTagGroups);
					documentSource.updateDocument({
						doc: doc
						,onSuccess: onSaved
						,onError: function(err) {
							$n2.reportErrorForced(_loc('Unable to submit document: {err}',{err: err}));
						}
					});
				}
				else {
					new $n2.mdc.MDCDialog({
						dialogHtmlContent: `${_loc("widget.annotationeditor.grouptag.unmodified")}`
						, closeBtn: true
					});
					return;
				}
			}

			function updateDocForTagSetting (doc) {
				var $formfieldSections = $('div.n2WidgetAnnotation_tagSettings_formfieldSection');
				$formfieldSections.each(function() {
					const _gsfInput = $(this).find('input.n2transcript_input.input_scaleFactor');
					const _gtoInput = $(this).find('input.n2transcript_input.input_timeOffset');
					const _gpzInput = $(this).find('input.n2transcript_input.input_defaultPlaceZoomLevel');
					const _gsvInput = $(this).find('input.n2transcript_input.input_cinemapStartingView');
					if (_gsfInput.get(0) !== document || _gtoInput.get(0) !== document
					|| _gpzInput.get(0) !== document || _gsvInput.get(0) !== document) {
						const _gsfInputValue = _gsfInput.val();
						const _gtoInputValue = _gtoInput.val();
						const _gpzInputValue = _gpzInput.val();
						const _gsvInputValue = _gsvInput.val().split(",").map(v => Number(v));
						if (!validateMapExtent(_gsvInputValue)) {
							alert("The cinemap initial view format is invalid.\nIt must be 4 comma separated numbers or 0 for no default view.");
							return;
						}
						if (_gsfInputValue || _gtoInputValue || _gpzInputValue || _gsvInputValue){
							if (typeof doc.atlascine_cinemap.settings === 'undefined') {
								doc.atlascine_cinemap.settings = {};
							}
							doc.atlascine_cinemap.settings.globalScaleFactor = _gsfInputValue;
							doc.atlascine_cinemap.settings.globalTimeOffset = _gtoInputValue;
							doc.atlascine_cinemap.settings.globalDefaultPlaceZoomLevel = _gpzInputValue;
							doc.atlascine_cinemap.settings.globalInitialMapExtent = _gsvInputValue;
							documentSource.updateDocument({
								doc: doc
								,onSuccess: onSaved
								,onError: function(err) {
									$n2.reportErrorForced(_loc('Unable to submit document: {err}',{err: err}));
								}
							});
						}

					} else {
						alert('An error occurred when trying to save the cinemap settings.');
					}
				});
			}

			function validateMapExtent(extent) {
				return (
					Array.isArray(extent) 
					&& (
						((extent.length === 4)
						&& extent.every(coordinate => {
							return (
								typeof coordinate === "number"
								&& !Number.isNaN(coordinate)
							);
						}))
						||
						(extent.length === 1 && extent[0] === 0)
					)
				);
			}

			function tagGroupsIsModified(oldTagColors,
				oldTagGroups, newTagColors, newTagGroups) {

				if (!oldTagColors || !oldTagGroups
					|| !newTagColors || !newTagGroups) {
					// same
					return true;
				}

				if ($n2.keys(oldTagColors).length !== $n2.keys(newTagColors).length) {
					return true;
				}

				if ($n2.keys(oldTagGroups).length !== $n2.keys(newTagGroups).length) {
					return true;
				}

				for (var otagname in oldTagColors) {
					if (!(otagname in newTagColors)) {
						return true;
					}
					if (newTagColors[otagname] !== oldTagColors[otagname]) {
						return true;
					}
				}

				for (var otagname in oldTagGroups) {
					if (!(otagname in newTagGroups)) {
						return true;
					}

					if (typeof (newTagGroups[otagname]) !== typeof (oldTagGroups[otagname])) {
						return true;
					}

					if (newTagGroups[otagname].length !== oldTagGroups[otagname].length) {
						return true;
					}

					for (var i = 0, e = newTagGroups[otagname].length; i < e; i++) {
						if (newTagGroups[otagname][i] !== oldTagGroups[otagname][i]) {
							return true;
						}
					}
				}
				return false;
			}

			// function singleSectionUpForTagGrouping (doc, tagname, tagcolor, chilrenTags){
			//	if( doc && doc.atlascine_cinemap ){}
			// }

			function onSaved(doc) {
				if (_this.onSaved) {
					_this.onSaved(this);
				}
			}
		},

		_clickedCancel: function() {
			if (this.onCancel) {
				this.onCancel(this);
			}
		},

		_addTagSetting: function($parent) {
			//current cinemap doc;
			const doc = this.currentDoc;
			let _setting = $n2.extend({}, this._default_setting);

			const $formFieldSection = $('<div>')
				.addClass('n2WidgetAnnotation_tagSettings_formfieldSection')
				.appendTo($parent);

			$('<div>')
				.addClass('formfieldSection_header')
				.appendTo($formFieldSection);

			if (doc
				&& doc.atlascine_cinemap
				&& doc.atlascine_cinemap.settings) {
				_setting = $n2.extend(_setting, doc.atlascine_cinemap.settings);
			}

			for (let se in _setting) {
				const _sf = _setting[se];
				if (se === 'globalScaleFactor') {
					$('<label>')
						.attr('for', this.gloScaleFactorId)
						.html(_loc('Global Scale Factor'))
						.attr('title', _loc('global.scale.factor.tooltip'))
						.appendTo($formFieldSection);
					$('<input>')
						.attr('id', this.gloScaleFactorId)
						.addClass('n2transcript_input input_scaleFactor')
						.val(_sf)
						.appendTo($formFieldSection);
				} else if (se === 'globalTimeOffset') {
					$('<label>')
						.attr('for', this.gloTimeOffsetId)
						.html(_loc('Global Time Offset'))
						.attr('title', _loc('global.time.offset.tooltip'))
						.css("display", "none")
						.appendTo($formFieldSection);
					$('<input>')
						.attr('id', this.gloTimeOffsetId)
						.addClass('n2transcript_input input_timeOffset')
						.val(_sf)
						.css("display", "none")
						.appendTo($formFieldSection);
				} else if (se === 'globalDefaultPlaceZoomLevel') {
					$('<label>')
						.attr('for', this.cinemapDefaultPlaceZoomLevelId)
						.html(_loc('Default Place Zoom Level'))
						.attr('title', _loc('global.default.place.zoom.level.tooltip'))
						.appendTo($formFieldSection);
					$('<input>')
						.attr('id', this.cinemapDefaultPlaceZoomLevelId)
						.addClass('n2transcript_input input_defaultPlaceZoomLevel')
						.val(_sf)
						.appendTo($formFieldSection);
				} else if (se === 'globalInitialMapExtent') {
					const container = document.createElement("div");
					container.setAttribute("id", "initialMapExtentLabel");
					container.style.display = "flex";
					container.style.flexDirection = "column";
					container.style.justifyContent = "space-evenly";
					$('<label>')
						.attr('for', this.cinemapInitialMapViewId)
						.html(_loc('Initial Map View*'))
						.attr('title', _loc('The order of this bounding box is bottom left (x, y) and top right (x, y).\nUse a value of "0" if the cinemap should not have a default view.'))
						.appendTo(container);
					$('<button>')
						.html(_loc('Get Current Map View'))
						.click(() => {
							const request = {
								type: "mapExtentRequest"
								, value: null
							};
							this.dispatchService.synchronousCall(DH, request);
							const mapViewInput = document.getElementById(this.cinemapInitialMapViewId);
							mapViewInput.value = nunaliit2.n2es6.ol_proj_transformExtent(
								request.value,
								new nunaliit2.n2es6.ol_proj_Projection({code: "EPSG:3857"}),
								new nunaliit2.n2es6.ol_proj_Projection({code: "EPSG:4326"})
							);
						})
						.appendTo(container);
					$formFieldSection.append(container);
					$('<input>')
						.attr('id', this.cinemapInitialMapViewId)
						.addClass('n2transcript_input input_cinemapStartingView')
						.val(_sf)
						.appendTo($formFieldSection);
				}
				
			}

			let timeLinks = [];
			if (doc && doc.atlascine_cinemap && doc.atlascine_cinemap.timeLinks) {
				timeLinks = [...doc.atlascine_cinemap.timeLinks];
			}

			timeLinks.sort((a,b) => {
				if (a.starttime > b.starttime) return 1;
				else if (a.starttime < b.starttime) return -1;
				return 0;
			});

			let htmlString = "<div>";
			const listHtml = timeLinks.reduce((accumulator, timeLink) => {
				const commaTags = timeLink.tags.map(tag => tag.value).join(" ");

				let images = [];
				if (typeof timeLink.relatedImage === "string") {
					if (timeLink.relatedImage !== "") images = [{image: timeLink.relatedImage, caption: ""}];
				}
				else {
					images = timeLink.relatedImage || [];
				}
				let tlImageHtml = images.reduce((acc, image) => {
					let string = "";
					if (image.image) string += `<p>${image.image.split('/').pop()}</p>`
					if (image.caption) string += `<p style="white-space: pre-line;">${image.caption}</p>`
					return acc + string;
				}, "");

				return `${accumulator}<li style="border: 1px solid #ccc; border-radius: 5px; margin-top: 0.5em; margin-bottom: 0.5em; list-style-type: none;">
					<div style="padding: 1em;">
						<h4>${timeLink.starttime} - ${timeLink.endtime}</h4>
						<p>${commaTags ? commaTags : _loc("widget.annotationEditor.settingsViewAllTimelinksNoAnnotationsText")}</p>
						<p>${timeLink.notes ? timeLink.notes : _loc("No notes added.")}</p>
						${tlImageHtml}
					</div>
				</li>		
				`;
			}, htmlString);

			htmlString += `${listHtml}</div>`;

			const timeMetadataContainer = $("<div>")
				.attr("id", "timeMetadataContainer")
				.addClass("n2WidgetAnnotation_formfieldSection")
				.appendTo($parent)
			const metadata = [
				{ text: `Created: ${new Date(doc?.nunaliit_created?.time)}` },
				{ text: `Created By: ${doc?.nunaliit_created?.name}` },
				{ text: `Last Modified: ${new Date(doc?.nunaliit_last_updated?.time)}` },
				{ text: `Last Modified By: ${doc?.nunaliit_last_updated?.name}` }
			]
			metadata.forEach(m => {
				timeMetadataContainer.append($("<p>").text(m.text))
			})

			const notesButtonContainer = $("<div>")
				.attr("id", "notesButtonContainer")
				.addClass('n2WidgetAnnotation_formfieldSection')
				.appendTo($parent);

			new $n2.mdc.MDCButton({
				parentElem: notesButtonContainer,
				btnLabel: _loc("View All Annotations"),
				btnRaised: true,
				onBtnClick: () => {
					new $n2.mdc.MDCDialog({
						dialogTitle: _loc("Annotations"),
						dialogHtmlContent: htmlString,
						closeBtn: true,
						scrollable: true
					});
				}
			});

			const exportAsGeoJSONButtonContainer = $("<div>")
				.attr("id", "exportGeoJSONButtonContainer")
				.addClass('n2WidgetAnnotation_formfieldSection')
				.appendTo($parent);

			new $n2.mdc.MDCButton({
				parentElem: exportAsGeoJSONButtonContainer,
				btnLabel: _loc("Export Cinemap as GeoJSON"),
				btnRaised: true,
				onBtnClick: () => {
					new nunaliit2.exports.CinemapToGeoJSON({
						dispatch: this.dispatchService
						, cinemap: doc
					});
				}
			});
		},

		/**
		 * Add tag group form view to annotation editor.
		 * @param {Object} $parent jQuery reference to the DOM element, which
		 * will be the container for the tag group form.
		 */
		_addTagGroupEditing: function($parent){
			var _this = this;
			var doc = this.currentDoc;
			var existingTagGroupArr = [];
			if (doc
				&& doc.atlascine_cinemap
				&& doc.atlascine_cinemap.tagColors) {
				for (var tagName in doc.atlascine_cinemap.tagGroups) {
					if (tagName === 'place' || tagName === 'location') {
						continue;
					}

					var taginfo = {
						name: tagName,
						color: doc.atlascine_cinemap.tagColors[tagName],
						children: []
					};

					var tagchildren = findChildTags(tagName);
					if (tagchildren) {
						taginfo.children = tagchildren;
					}
					existingTagGroupArr.push(taginfo);
				}

				// generate existing tagGroupEditors
				_this._addExistingTagGroupSingleUnit($parent, existingTagGroupArr);
			}

			$('<hr>').appendTo($parent);
			new $n2.mdc.MDCButton({
				parentElem: $parent,
				mdcClasses: ['n2WidgetAnnotation_tagGroup_addNewGroupBtn'],
				btnLabel: _loc('widget.annotationEditor.mapThemeAddNewTheme'),
				onBtnClick: function() {
					var $taggroupContainer = $('<div>')
						.addClass('n2WidgetAnnotation_tagGroup_container')
						.insertBefore($('.n2WidgetAnnotation_tagGroup_addNewGroupBtn'));
					_this._addEmptyTagGroupSingleUnit($taggroupContainer);
				}
			});

			/**
			 * Find and returns a list of tags associated with a tag group name
			 * @param {string} groupName tag group name.
			 * @return {array} list of tags associated with a tag group.
			 */
			function findChildTags(groupName) {
				var tagName;
				var result = [];
				for (tagName in doc.atlascine_cinemap.tagGroups) {
					if (tagName === groupName
						&& doc.atlascine_cinemap.tagGroups[tagName].length) {
						// clone the children tags group
						result = doc.atlascine_cinemap.tagGroups[tagName].slice(0);
					}
				}
				return result;
			}
		},

		_addExistingTagGroupSingleUnit: function($parent, tagGroupArr) {
			var $formField = $parent;
			tagGroupArr.forEach(function(taginfo) {

				var $formFieldSection = $('<div>')
					.addClass('n2WidgetAnnotation_tagGroup_formfieldSection')
					.appendTo($formField);

				$('<hr>').appendTo($formFieldSection);
//				var colorPk = new $n2.mdc.MDCTextField({
//					txtFldLabel: 'color',
//					parentElem: $formFieldSection
//				});
//				var colorPkInputId = colorPk.getInputId();
//				$('input#'+ colorPkInputId)

				var $headdiv = $('<div>')
					.addClass('formfieldSection_header')
					.appendTo($formFieldSection);

				var $leftdiv = $('<div>')
					.addClass('formfieldSection_leftcol')
					.appendTo($formFieldSection);

				var $rightdiv = $('<div>')
					.addClass('formfieldSection_rightcol')
					.appendTo($formFieldSection);

				var $footerdiv = $('<div>')
					.addClass('formfieldSection_footer')
					.appendTo($formFieldSection);

				var $mdcColorInputDiv = $('<div>')
					.addClass('input_group_for_customMDC for_color')
					.appendTo($leftdiv);

				$('<input>')
					.addClass('n2transcript_input input_colorpicker')
					.colorPicker({
						opacity: false,
						renderCallback: function($elm, toggled) {
							$elm.val('#' + this.color.colors.HEX);
						}
					})
					.val(taginfo.color)
					.css("background-color", taginfo.color)
					.appendTo($mdcColorInputDiv);

				$('<span>')
					.addClass('highlight')
					.appendTo($mdcColorInputDiv);

				$('<span>')
					.addClass('bar')
					.appendTo($mdcColorInputDiv);

				$('<label>')
					.text(_loc('Color'))
					.appendTo($mdcColorInputDiv);

				var $mdcTagInputDiv = $('<div>')
					.addClass('input_group_for_customMDC for_tagname')
					.appendTo($headdiv);

				$('<input>')
					.addClass('n2transcript_input input_tagname')
					.val(taginfo.name)
					.appendTo($mdcTagInputDiv);

				$('<span>')
					.addClass('highlight')
					.appendTo($mdcTagInputDiv);

				$('<span>')
					.addClass('bar')
					.appendTo($mdcTagInputDiv);

				$('<label>')
					.text(_loc('widget.annotationEditor.mapThemeName'))
					.appendTo($mdcTagInputDiv);

				new $n2.mdc.MDCTagBox({
					parentElem: $rightdiv,
					label: _loc('widget.annotationEditor.mapThemeAssociatedTags'),
					placeholder: _loc('widget.annotationEditor.mapThemeTagBoxPlaceholder'),
					mdcClasses: ['n2transcript_label','label_tagbox_tagGroupMembers'],
					chips: taginfo.children
				});

				new $n2.mdc.MDCButton({
					parentElem: $footerdiv,
					btnLabel: _loc('Delete'),
					onBtnClick: function() {
						$formFieldSection.remove();
					}
				});
			});
		},

		_addEmptyTagGroupSingleUnit: function($parent) {
			var $formField = $parent;
			var $formFieldSection = $('<div>')
				.addClass('n2WidgetAnnotation_tagGroup_formfieldSection')
				.appendTo($formField);

			$('<hr>').appendTo($formFieldSection);

			var $headdiv = $('<div>')
				.addClass('formfieldSection_header')
				.appendTo($formFieldSection);

			var $leftdiv = $('<div>')
				.addClass('formfieldSection_leftcol')
				.appendTo($formFieldSection);

			var $rightdiv = $('<div>')
				.addClass('formfieldSection_rightcol')
				.appendTo($formFieldSection);

			var $footerdiv = $('<div>')
				.addClass('formfieldSection_footer')
				.appendTo($formFieldSection);

			var $mdcInputDiv = $('<div>')
				.addClass('input_group_for_customMDC for_color')
				.appendTo($leftdiv);

			$('<input>')
				.addClass('n2transcript_input input_colorpicker')
				.colorPicker({
					opacity: false,
					renderCallback: function($elm, toggled) {
						$elm.val('#' + this.color.colors.HEX);
					}
				})
				.appendTo($mdcInputDiv);

			$('<span>')
				.addClass('highlight')
				.appendTo($mdcInputDiv);

			$('<span>')
				.addClass('bar')
				.appendTo($mdcInputDiv);

			$('<label>')
				.text(_loc('Color'))
				.appendTo($mdcInputDiv);

			var $mdcInputDiv = $('<div>')
				.addClass('input_group_for_customMDC for_tagname')
				.appendTo($headdiv);

			$('<input>')
				.addClass('n2transcript_input input_tagname')
				.appendTo($mdcInputDiv);

			$('<span>')
				.addClass('highlight')
				.appendTo($mdcInputDiv);

			$('<span>')
				.addClass('bar')
				.appendTo($mdcInputDiv);

			$('<label>')
				.text(_loc('widget.annotationEditor.mapThemeName'))
				.appendTo($mdcInputDiv);

			new $n2.mdc.MDCTagBox({
				parentElem: $rightdiv,
				label: _loc('widget.annotationEditor.mapThemeAssociatedTags'),
				placeholder: _loc('widget.annotationEditor.mapThemeTagBoxPlaceholder'),
				mdcClasses: ['n2transcript_label','label_tagbox_tagGroupMembers'],
				chips: []
			});

			new $n2.mdc.MDCButton({
				parentElem: $formFieldSection,
				btnLabel: _loc('Delete'),
				onBtnClick: function() {
					$formFieldSection.remove();
				}
			});
		},

		/**
		 * Add single unit annotation form view to annotation editor widget.
		 * - Form includes; place tag tagbox field, theme tag tagbox field,
		 * comments, and sentence text.
		 * @param {object} $parent jQuery Reference to the DOM element which
		 * will contains the annotation form.
		 */
		_addFormViewForSingleUnit: function($parent){
			var _this = this;
			var $formField = $parent;
			var depot = this.dataDepot;
			var senData = depot.getData();

			$n2.utils.processLargeArrayAsync(senData, function(opts, index, array) {
				var $formFieldSection = $('<div>')
					.addClass('n2WidgetAnnotation_formfieldSection')
					.appendTo($formField);

				$('<span>')
					.addClass('n2transcript_label_name')
					.text(_loc('Start: '))
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label label_startTimeCode')
					.text(opts.start)
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label_name')
					.text(_loc('End: '))
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label label_finTimeCode')
					.text(opts.end)
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label label_transcriptText')
					.text(opts.text)
					.appendTo($formFieldSection);

				$('<hr>').appendTo($formFieldSection);

				var doc = _this.currentDoc;
				var lastThemeTags = [];
				var lastPlaceTags = [];
				if (doc && doc.atlascine_cinemap) {
					var timeLinks = doc.atlascine_cinemap.timeLinks;
					if (!timeLinks) {
						// No timeLinks no worry
						return;
					}

					var matchingSen = depot.getMatchingSen(opts.start, opts.end);
					if (matchingSen) {
						matchingSen.forEach(function(timeLink) {
							if (timeLink.tags) {
								for (var tag in timeLink.tags) {
									var tagProfile = timeLink.tags[tag];
									if ('place' === tagProfile.type
										|| 'location' === tagProfile.type) {
										lastPlaceTags.push(tagProfile);
									} else {
										lastThemeTags.push(tagProfile);
									}
								}
							}
						});
					}

					new $n2.mdc.MDCTagBox({
						parentElem: $formFieldSection,
						autoCompleteViewName: 'theme',
						label: _loc('Theme Tags'),
						placeholder: _loc('widget.annotationEditor.timeLinkTagBoxPlaceholder'),
						mdcClasses: ['n2transcript_label','label_tagbox_themetags'],
						chips: lastThemeTags,
						chipsetsUpdateCallback: function(tagList, operation, target) {
							var value, addtar, deltar;
							switch(operation) {
							case 'ADD':
								value = target.chipText;
								addtar = $n2.extend({value: value}, target);
								delete addtar['fraction'];
								_this.dataDepot.addPartialTag(opts.start, opts.end, addtar)
								$n2.log('Adding tags', target);
								break;
							case 'DELETE':
								value = target.chipText;
								deltar = $n2.extend({value: value}, target);
								_this.dataDepot.deletePartialTag(opts.start, opts.end, deltar);
								$n2.log('Deleting tags', target);
								break;
							default:
								break;
							}
						// $n2.log('I wonder what is this: ', tagList);
						}
					});

					new $n2.mdc.MDCTagBox({
						parentElem: $formFieldSection,
						autoCompleteViewName: 'place',
						label: _loc('Place Tags'),
						placeholder: _loc('widget.annotationEditor.timeLinkTagBoxPlaceholder'),
						mdcClasses: ['n2transcript_label','label_tagbox_placetags'],
						chips: lastPlaceTags,
						chipsetsUpdateCallback: function(tagList, operation, target) {
							var value;
							switch(operation) {
							case 'ADD':
								value = target.chipText;
								var addtar = $n2.extend({value: value}, target);
								addtar['type'] = 'place';
								delete addtar['fraction'];
								_this.dataDepot.addPartialTag(opts.start, opts.end, addtar)
								$n2.log('Adding tags', addtar);
								break;
							case 'DELETE':
								value = target.chipText;
								var deltar = $n2.extend({value: value}, target);
								deltar['type'] = 'place';
								_this.dataDepot.deletePartialTag(opts.start, opts.end, deltar);
								$n2.log('Deleting tags', deltar);
								break;
							}
						//$n2.log('I wonder what is this: ', tagList);
						}
					});

				} else {
					alert('Current document does not have (atlascine_cinemap) property');
					return;
				}
			});
		},

		/**
		 * Creates full and partial tag profiles for all theme tags
		 * @param {Object} senData Sentence data for each time link.
		 * Sentence data objects contains; start and end times, tags, comments,
		 * and the sentence text.
		 * @return {array} tag profiles which indicate if a sentence theme tag
		 * is either full or partial.
		 */
		_buildThemeTagProfiles: function(senData) {
			var result = [];
			var fracMap, senTag, mapTag;
			if (senData.length) {
				fracMap = {};

				// true means full cover; false means partial
				// All non-place tags are initially set to full fraction.
				senData.forEach(function(sd) {
					for (senTag in sd.tags) {
						if (sd.tags[senTag].type !== 'place'
							&& sd.tags[senTag].type !== 'location') {
							fracMap[senTag] = $n2.extend(
								{fraction: 'full'},
								sd.tags[senTag]
							);
						}
					}
				});

				// Tags which are in the fraction map which don't exist in the
				// sentence data, are defined as a partial fraction.
				for (mapTag in fracMap) {
					senData.forEach(function(se) {
						if (!Object.hasOwnProperty.call(se.tags, mapTag)) {
							fracMap[mapTag].fraction = 'partial';
						}
					});
				}

			} else {
				$n2.log("focusSentences data is not valid");
			}

			if (fracMap) {
				for (var tag in fracMap) {
					result.push(fracMap[tag]);
				}
			}
			return result;
		},

		/**
		 * Creates full and partial tag profiles for all place tags
		 * @param {Object} senData Sentence data for each time link.
		 * Sentence data objects contains; start and end times, tags, comments,
		 * and the sentence text.
		 * @return {array} tag profiles which indicate if a sentence place tag
		 * is either full or partial.
		 */
		_buildPlaceTagProfiles: function(senData) {
			var result = [];
			var fracMap, senTag, mapTag;
			if (senData.length) {
				fracMap = {};

				// true means full cover; false means partial
				// All place tags are initially set to full fraction.
				senData.forEach(function(sd) {
					for (senTag in sd.tags) {
						if (sd.tags[senTag].type
							&& (sd.tags[senTag].type === 'place'
							|| sd.tags[senTag].type === 'location')) {
							fracMap[senTag] = $n2.extend(
								{fraction: 'full'},
								sd.tags[senTag]
							);
						}
					}
				});

				// Tags which are in the fraction map which don't exist in the
				// sentence data, are defined as a partial fraction.
				for (mapTag in fracMap) {
					senData.forEach(function(se) {
						if (!(mapTag in se.tags)) {
							fracMap[mapTag].fraction = 'partial';
						}
					});
				}

			} else {
				$n2.log("focusSentences data is not valid");
			}

			if (fracMap) {
				for (var tag in fracMap) {
					result.push(fracMap[tag]);
				}
			}
			return result;
		},

		/**
		 * Add aggregated annotation form view to annotation editor widget.
		 * - Form includes; place tag tagbox field, theme tag tagbox field,
		 * comments, and sentence text.
		 * @param {object} $parent jQuery Reference to the DOM element which
		 * will contains the annotation form.
		 */
		_addFormViewAggregated: function($parent) {
		// Instead read and parsing the tags from cinemap
		// We receive the data from dataDepot now for aggregateView
			var _this = this;
			var $formField = $parent;
			var $formFieldSection = $('<div>')
				.addClass('n2WidgetAnnotation_formfieldSection')
				.appendTo($formField);
			var depot = this.dataDepot;
			var senData = depot.getData();
			let addImageButton = null;

			var lastThemeTags = this._buildThemeTagProfiles(senData);
			lastThemeTags = lastThemeTags || [];

			var lastPlaceTags = this._buildPlaceTagProfiles(senData);

			var aggreText = '';
			senData.forEach(function(sd) {
				aggreText += sd.text + ' ';
			});

			// Add span containing the selected transcript text
			$('<span>')
				.addClass('n2transcript_label label_transcriptText')
				.text(aggreText)
				.appendTo($formFieldSection);

			$('<hr>').appendTo($formFieldSection);

			const aggregateThemeTagBoxSelector = `#${_this.innerFormId} > div.n2WidgetAnnotation_formfieldSection > div:nth-of-type(1)`;
			const { 
				atlascine_cinemap: {
					tagColors,
					tagGroups
				}
			} = this.currentDoc;

			const findColourFromTag = (tagValue) => {
				return Object.entries(tagGroups).find(entry => {
					return entry[1].includes(tagValue)
				})
			};

			const checkIfPlacesPresent = (sentences) => {
				for (const s of sentences) {
					if (s.tags) {
						return Object.keys(s.tags).some(k => {
							return k.slice(-5) === "place"
						});
					}
				}
			};

			// Add theme tags tagbox component.
			new $n2.mdc.MDCTagBox({
				parentElem: $formFieldSection,
				autoCompleteViewName: 'theme',
				label: _loc('Theme Tags'),
				placeholder: _loc('widget.annotationEditor.timeLinkTagBoxPlaceholder'),
				mdcClasses: ['n2transcript_label','label_tagbox_themetags'],
				chips: lastThemeTags,
				chipsetsUpdateCallback: (tagList, operation, target) => {
					var addtar, deltar;
					const themeTagBox = document.querySelector(aggregateThemeTagBoxSelector);
					const value = target.chipText;
					let validTag = findColourFromTag(value);
					switch (operation) {
						case 'ADD':
							if (validTag) {
								const lineColour = tagColors[validTag[0]];
								themeTagBox.style.boxShadow = `inset 0em -0.7em ${lineColour}`;
								const chipHolder = themeTagBox.children[1].children;
								chipHolder[chipHolder.length - 2].style.borderColor = lineColour;
							}
							addtar = $n2.extend({value: value}, target);
							_this.dataDepot.addFullTag(addtar);
							$n2.log('Adding tags', target);
							break;
						case 'DELETE':
							deltar = $n2.extend({value: value}, target);
							_this.dataDepot.deleteTag(deltar);
							const themeTagProfiles =  _this._buildThemeTagProfiles(_this.dataDepot.getData());
							for (let i = -1; i >= -Math.abs(themeTagProfiles.length); i--) {
								const lastTheme = themeTagProfiles.at(i);
								if (lastTheme) {
									validTag = findColourFromTag(lastTheme.chipText);
									if (validTag) {
										const lineColour = tagColors[validTag[0]];
										themeTagBox.style.boxShadow = `inset 0em -0.7em ${lineColour}`;
										break;
									}
								}
								themeTagBox.style.boxShadow = "";
							}
							if (themeTagProfiles.length === 0) {
								themeTagBox.style.boxShadow = "";
							}
							$n2.log('Deleting tags', target);
							break;
						default:
							break;
					}
				}
			});

			// Add place tags tagbox component
			new $n2.mdc.MDCTagBox({
				parentElem: $formFieldSection,
				label: _loc('Place Tags'),
				placeholder: _loc('widget.annotationEditor.timeLinkTagBoxPlaceholder'),
				autoCompleteViewName: 'place',
				mdcClasses: ['n2transcript_label','label_tagbox_placetags'],
				chips: lastPlaceTags,
				chipsetsUpdateCallback: function(tagList, operation, target) {
					var value, addtar, deltar;
					switch (operation) {
					case 'ADD':
						value = target.chipText;
						addtar = $n2.extend(
							{value: value, type: 'place'},
							target
						);
						addtar['type'] = 'place';
						_this.dataDepot.addFullTag(addtar);
						$n2.log('Adding tags', addtar);
						if (checkIfPlacesPresent(_this.dataDepot.getData())) {
							addImageButton.setDisabled(false);
						}
						break;
					case 'DELETE':
						value = target.chipText;
						deltar = $n2.extend(
							{value: value, type: 'place'},
							target
						);
						deltar['type'] = 'place';
						_this.dataDepot.deleteTag(deltar);
						$n2.log('Deleting tags', deltar);
						if (!checkIfPlacesPresent(_this.dataDepot.getData())) {
							addImageButton.setDisabled(true);
						}
						break;
					default:
						break;
					}
				// $n2.log('I wonder what is this: ', tagList);
				}
			});

			const themeTagBox = document.querySelector(aggregateThemeTagBoxSelector);

			for (let i = -1; i >= -Math.abs(lastThemeTags.length); i--) {
				const lastTheme = lastThemeTags.at(i);
				if (lastTheme) {
					const validTag = findColourFromTag(lastTheme.chipText);
					if (validTag) {
						const lineColour = tagColors[validTag[0]];
						themeTagBox.style.boxShadow = `inset 0em -0.7em ${lineColour}`;
						break;
					}
				}
				themeTagBox.style.boxShadow = "";
			}

			const chipHolder = themeTagBox.children[1].children;
			
			lastThemeTags.forEach((theme, index) => {
				const validTag = findColourFromTag(theme.chipText);
				if (validTag) {
					const lineColour = tagColors[validTag[0]];
					chipHolder[index].style.borderColor = lineColour;
				}
			});

			const getRelatedImages = (senData) => {
				if (senData.length > 0) {
					const field = senData[0]?.relatedImage;
					if (typeof field === "string" && field !== "") return [{image: field, caption: ""}];
					else if (Array.isArray(field)) return field;
					else return [];
				}
				return [];
			};
			const getNotes = (senData) => {
				if (senData.length > 0) {
					return senData[0]?.notes || "";
				}
				return "";
			};

			const createImageCard = (imageData) => {
				const container = document.createElement("div");
				
				let displayImageText = imageData.image.split("/");
				if (displayImageText.length > 1) displayImageText = displayImageText.pop();

				const cardId = $n2.getUniqueId();
				new $n2.mdc.MDCCard({
					parentElem: container,
					mdcId: cardId, 
					label: displayImageText,
					infoGenerator: () => { return displayImageText },
					imageGenerator: () => { return `<img src=./db${imageData.image}>` },
					initiallyOn: false
				});

				const imageCaptionField = new $n2.mdc.MDCTextField({
					txtFldLabel: _loc("Image Caption"),
					txtFldOutline: true,
					txtFldArea: true,
					txtFldFullWidth: true,
					prefilled: imageData?.caption || "",
					parentElem: container
				});
				
				new $n2.mdc.MDCButton({
					parentElem: container,
					btnLabel: _loc("Remove Image"),
					btnRaised: true,
					onBtnClick: () => {
						container.remove();
					}
				});

				imagesContainer.append(container);

				const relatedImageCaptionTextArea = imageCaptionField.getTextInput()[0];
				relatedImageCaptionTextArea.nextSibling.classList.add("mdc-notched-outline--notched");
				relatedImageCaptionTextArea.nextSibling.children[1].children[0].classList.add("mdc-floating-label--float-above") ;
				relatedImageCaptionTextArea.style.resize = "vertical";
				document.querySelector(`#${cardId} > div.mdc-card__primary-action`).style.cursor = "default";
				document.querySelector(`#${cardId} > div.mdc-card__primary-action > div.n2card__primary`).dataset.trueUrl = imageData.image;
			};

			const getDialogSelection = (doc) => {
				if (!doc) return;
				if (!doc._id) return;
				if (!doc.nunaliit_attachments) return;
				if (!doc.nunaliit_attachments.files) return;
				
				let attachmentUrl = null;

				Object.entries(doc.nunaliit_attachments.files).forEach(attachment => {
					if (attachment[0].includes("_thumb")) return;
					const {
						attachmentName,
						fileClass,
						mimeType
					} = attachment[1];
					if (fileClass !== "image") return;
					if (!mimeType.startsWith("image")) return;
					attachmentUrl = attachmentName;
				});

				if (attachmentUrl !== null) {
					const media = doc?.atlascine_media;
					let defaultCaption = "";
					if (media.name) defaultCaption += media.name + "\n";
					if (media.caption) defaultCaption += media.caption + "\n";
					if (media.credit) defaultCaption += media.credit;
					if (defaultCaption.slice(-1) === "\n") defaultCaption = defaultCaption.slice(0, -1);
					createImageCard({
						image: `/${doc._id}/${attachmentUrl}`,
						caption: defaultCaption
					});
				}
				else {
					alert(_loc("The selected document is not an image."))
				}
			}

			/* Notes Area */
			const timeLinkTextAreaId = "n2WidgetAnnotationEditorTaggingNotes";
			new $n2.mdc.MDCTextField({
				txtFldLabel: _loc("Notes"),
				txtFldInputId: timeLinkTextAreaId,
				txtFldOutline: true,
				txtFldArea: true,
				txtFldFullWidth: true,
				prefilled: getNotes(senData),
				parentElem: $formFieldSection
			});
			const timeLinkNotesTextArea = document.getElementById(timeLinkTextAreaId);
			timeLinkNotesTextArea.nextSibling.classList.add("mdc-notched-outline--notched");
			timeLinkNotesTextArea.nextSibling.children[1].children[0].classList.add("mdc-floating-label--float-above") 
			timeLinkNotesTextArea.style.resize = "vertical";
			/* Notes Area */

			addImageButton = new $n2.mdc.MDCButton({
				parentElem: $formFieldSection,
				btnLabel: _loc("Add Image"),
				btnRaised: true,
				onBtnClick: () => {
					_this.dialogService.searchForDocumentId({
						onSelected: function(docId) {
							const docRequestMessage =  {
								type: "requestDocument",
								docId: docId,
								callback: getDialogSelection
							};
							_this.dispatchService.send(DH, docRequestMessage)
						}
					});
				}
			});
			const imagesContainer = document.createElement("div");
			imagesContainer.classList.add("n2WidgetAnnotationEditorTaggingImages");
			$formFieldSection.append(imagesContainer);
			if (lastPlaceTags.length < 1) addImageButton.setDisabled(true);

			getRelatedImages(senData).forEach(image => {
				createImageCard(image);
			});
		},

		/**
		 * Depending on if aggregated mode is on or not, either show the
		 * aggregated or single unit form view.
		 */
		_addTagSelEditing: function() {
			var _this = this;
			if (_this.editorAggregateMode) {
				_this._addFormViewAggregated(_this.getInnerForm());
			} else {
				_this._addFormViewForSingleUnit(_this.getInnerForm());
			}
		},

		// Blocking method
		refresh: function(opts_) {
			var opt, data, doc;
			var _this = this;
			var $elem = this.getInnerForm();
			$elem.empty();

			if (opts_) {
				opt = opts_.option;
				data = opts_.data;
				doc = opts_.doc;

				// Set editor mode based on user selection
				if (opt === context_menu_text[0]) {
					this.editorMode = CineAnnotationEditorMode.TAGSELECTION;

				} else if (opt === context_menu_text[1]) {
					this.editorMode = CineAnnotationEditorMode.TAGGROUPING;

				} else if (opt === context_menu_text[2]) {
					this.editorMode = CineAnnotationEditorMode.TAGSETTING;
				}

				this.dataDepot.setDoc(doc);
				this.dataDepot.setOption(opt);
				this.dataDepot.setData(data);
			}

			if (doc) {
				this.currentDoc = doc;
			}

			switch (this.editorMode) {
			case CineAnnotationEditorMode.TAGSELECTION:
				_this._addTagSelEditing();
				break;
			case CineAnnotationEditorMode.TAGGROUPING:
				_this._addTagGroupEditing($elem);
				break;
			case CineAnnotationEditorMode.TAGSETTING:
				_this._addTagSetting($elem);
				break;
			default:
				break;
			}
		}
	});

	/**
	* @classdesc This is a container for real annotationEditorView. From UI
	* perspective, this widget can be seen as the sidebar Drawer, that can
	* listen on user intention, model and other widget's changes
 	*/
	var AnnotationEditorWidget = $n2.Class('AnnotationEditorWidget',{

		dispatchService: null,
		
		dialogService: null,

		elemId: null,

		// Model that selects the document to edit
		sourceModelId: null,

		docsById: null,

		currentDocId: null,

		annotationEditorView: null,

		drawer: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				containerId: undefined
				,dispatchService: undefined
				,dialogService: undefined
				,sourceModelId: undefined
			},opts_);

			var _this = this;

			this.dispatchService = opts.dispatchService;
			this.dialogService = opts.dialogService;
			this.sourceModelId = opts.sourceModelId;

			// Get container
			var containerId = opts.containerId;
			if (!containerId) {
				throw new Error('containerId must be specified');
			}

			var $container = $('#' + containerId);

			this.docsById = {};
			this.currentDocId = null;

			// The real annotationEditor lives inside annotationWidget container
			this.annotationEditorView = new CineAnnotationEditorView({
				dispatchService: this.dispatchService,
				dialogService: this.dialogService,
				onSaved: function() {
					_this._closeEditor();
					_this.dispatchService.send(DH,{
						type: 'annotationEditorFinished'
					});
				},
				onCancel: function() {
					_this._closeEditor();
				}
			});

			this.drawer = null;
			this.elemId = $n2.getUniqueId();
			this.loaderDivId = $n2.getUniqueId();
			this.contentDivId = $n2.getUniqueId();

			var $annotationEditor = $('<div>')
				.attr('id', this.elemId)
				.addClass('n2AnnotationEditor')
				.appendTo($container);

			$('<div>')
				.attr('id', this.loaderDivId)
				.addClass('loading')
				.appendTo($annotationEditor);

			$('<div>')
				.attr('id', this.contentDivId)
				.addClass('n2AnnotationEditorView')
				.appendTo($annotationEditor);

			// Set up dispatcher
			if (this.dispatchService) {
				var f = function(m, addr, dispatcher) {
					_this._handle(m, addr, dispatcher);
				};

				this.dispatchService.register(DH, 'modelStateUpdated', f);
				this.dispatchService.register(DH, 'annotationEditorStart', f);
				this.dispatchService.register(DH, 'annotationEditorClose', f);
				this.dispatchService.register(DH, 'annotationEditorIsAvailable', f);
				this.dispatchService.register(DH, 'annotationEditorShowLoader', f);
				this.dispatchService.register(DH, 'annotationEditorViewRefreshDone', f);

				if (this.sourceModelId) {
					// Initialize state
					var state = $n2.model.getModelState({
						dispatchService: this.dispatchService
						,modelId: this.sourceModelId
					});

					if (state) {
						this._sourceModelUpdated(state);
					}
				}
			}

			this._showContent();
			$n2.log(this._classname, this);
		},

		_getElem: function() {
			return $('#' + this.elemId);
		},

		// Get the element id of the loader
		_getLoaderDiv: function() {
			return $("#" + this.loaderDivId);
		},

		// Get the element id of the content view div.n2AnnotationEditorView
		_getContentViewDiv: function() {
			return $('#' + this.contentDivId);
		},

		// Add structure of annotation editor to sliding drawer
		_drawEditor: function(opts_) {
			var opts = $n2.extend({
				container: undefined
				,containerId: undefined
				,config: undefined
			}, opts_);

			// Add annotation editor to drawer.
			this.annotationEditorView.render(opts);
		},

		// Start the Annotation Editor Widget when tag selection option is clicked.
		_startEditor: function(ctxMenuOption, senDataArr){
			var _this = this;
			var currentDoc;

			if (this.annotationEditorView) {
				if (!this.drawer) {
					var $container = this._getContentViewDiv();
					var containerId = $n2.utils.getElementIdentifier($container);

					// Add a sliding drawer to content view
					// div.n2AnnotationEditorView
					this.drawer = new $n2.ui.drawer({
						containerId: containerId,
						width: '500px',
						customizedContentFn: function(opts){
							_this._drawEditor(opts);
						}
					});
				}
			}

			if (this.currentDocId) {
				currentDoc = this.docsById[this.currentDocId];
			}

			this._showLoader();
			// Open editor sliding drawer
			this.drawer.open();

			setTimeout(function() {
				_this.dispatchService.send(DH, {
					type: 'annotationEditorViewRefresh',
					option: ctxMenuOption,
					data: senDataArr,
					doc: currentDoc
				});
			}, 0);

//			this.annotationEditorView.refresh({
//				option: ctxMenuOption,
//				data: senDataArr,
//				doc: currentDoc
//			});
		},

		// Close the editor drawer
		_closeEditor: function() {
			if (this.drawer) {
				this.drawer.close();
			}
		},

		_showContent: function() {
			var $loader = this._getLoaderDiv();
			var $content = this._getContentViewDiv();
			$loader.hide();
			// $content.show();
		},

		_showLoader: function(){
			var $loader = this._getLoaderDiv();
			var $content = this._getContentViewDiv();
			$loader.show();
			// $content.hide();
		},

		_handle: function(m, addr, dispatcher) {
			var ctxMenuOption, senDataArr;
			var _this = this;

			if (m.type === 'annotationEditorStart') {
				ctxMenuOption = m.ctxMenuOption;
				senDataArr = m.senDataArr;
				this._startEditor(ctxMenuOption, senDataArr);

			} else if (m.type === 'annotationEditorClose') {
				this._closeEditor();

			} else if (m.type === 'annotationEditorIsAvailable') {
				m.available = true;

			} else if (m.type === 'modelStateUpdated') {
				// Does it come from one of our sources?
				if (this.sourceModelId === m.modelId) {
					this._sourceModelUpdated(m.state);
				}

			} else if (m.type === 'annotationEditorViewRefreshDone') {
				_this._showContent();
				this.drawer.open();

			} else if (m.type === 'annotationEditorShowLoader') {
				_this._showLoader();
			}
		},

		_refreshCurrentDoc: function() {
			var docId, doc;
			if (this.docsById[this.currentDocId]) {
				// OK, nothing has changed

			} else {
				// Select a new document
				this.currentDocId = undefined;
				for (docId in this.docsById) {
					this.currentDocId = docId;
				}

				if (!this.currentDocId) {
					this._closeEditor();

				} else if (this.annotationEditorView) {
					this._closeEditor();
					doc = this.docsById[this.currentDocId];
					this.annotationEditorView.refresh({
						doc: doc
					});
				}
			}
		},

		_sourceModelUpdated: function(sourceState) {
			var i, e, doc, docId;
			if (sourceState.added) {
				for (i = 0, e = sourceState.added.length; i < e; i += 1) {

					// Temporary workup for single cinemap selection
					// Better bug fix the SelectableDocumentFilter
					this.docsById = {};

					doc = sourceState.added[i];
					docId = doc._id;

					this.docsById[docId] = doc;
				}
			}

			if (sourceState.updated) {
				for (i = 0, e = sourceState.updated.length; i < e; i += 1) {
					doc = sourceState.updated[i];
					docId = doc._id;

					this.docsById[docId] = doc;
				}
			}

			if (sourceState.removed) {
				for (i = 0, e = sourceState.removed.length; i < e; i += 1) {
					doc = sourceState.removed[i];
					docId = doc._id;

					delete this.docsById[docId];
				}
			}
			this._refreshCurrentDoc();
		}
	});

	function HandleWidgetAvailableRequests(m) {
		if (m.widgetType === 'annotationEditorWidget') {
			m.isAvailable = true;
		}
	}

	// -------------------------------------------------------------------------
	function HandleWidgetDisplayRequests(m) {
		var options, config, containerId, widgetOptions, key, value;
		if (m.widgetType === 'annotationEditorWidget') {
			widgetOptions = m.widgetOptions;
			containerId = widgetOptions.containerId;
			config = m.config;

			options = {};

			if (widgetOptions) {
				for (key in widgetOptions) {
					value = widgetOptions[key];
					options[key] = value;
				}
			}

			options.containerId = containerId;

			if (config && config.directory) {
				options.dispatchService = config.directory.dispatchService;
				options.dialogService = config.directory.dialogService;
			}

			new AnnotationEditorWidget(options);
		}
	}

	$n2.widgetAnnotationEditor = {
		AnnotationEditorWidget: AnnotationEditorWidget
		,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
		,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
	};

})(jQuery,nunaliit2);
