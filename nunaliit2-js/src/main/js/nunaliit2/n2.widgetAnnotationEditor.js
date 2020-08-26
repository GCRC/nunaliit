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

	var context_menu_text = ['Tag Selection...', 'Map Tags...', 'Settings...'];

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

		addFullTag: function(tagProfile) {
			this.focusSentences.forEach(function(s) {
				var k = tagProfile.value + '--' + tagProfile.type;
				s.tags[k] = tagProfile;
			});
		},

		addPartialTag: function(start, end, tagProfile) {
			this.focusSentences.forEach(function(s) {
				var k;
				if (s.start === start
					&& s.end === end) {
					k = tagProfile.value + '--' + tagProfile.type;
					s.tags[k] = tagProfile;
				}
			});
		},

		deleteTag: function(tagProfile) {
			this.focusSentences.forEach(function(s) {
				var k = tagProfile.value + '--' + tagProfile.type;
				delete s.tags[k];
			});
		},

		deletePartialTag: function(start, end, tagProfile) {
			this.focusSentences.forEach(function(s) {
				var k;
				if (s.start === start
					&& s.end === end) {
					k = tagProfile.value + '--' + tagProfile.type;
					delete s.tags[k];
				}
			});
		},

		getMatchingSen: function(startTimeCode, finTimeCode) {
			var rst = undefined;
			this.focusSentences.forEach(function(fs) {
				var start = fs.start;
				var end = fs.end;
				if (start === startTimeCode
					&& end === finTimeCode) {
					if (!rst) {
						rst = [];
					}
					rst.push(fs);
				}
			});
			return rst;
		},

		getData: function() {
			return this.focusSentences;
		},

		setData: function(data) {
			var _this = this;
			this.reset();
			var doc = this._doc;

			if (doc
				&& doc.atlascine_cinemap) {
				var timeLinks = doc.atlascine_cinemap.timeLinks;
				if (!timeLinks) {
					// Create if it does not exist
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

						if (matchingLinks.length < 1) {
							// Should I create one? If so, how?
							var newTimeLink = {
								'starttime': start
								,'endtime': end
								,'tags': []
//								,"linkRef": {
//									"nunaliit_type": "reference"
//									"doc": "stock.rwanda"
//								}
							};
							matchingLinks.push(newTimeLink);
						}

						matchingLinks.forEach(function(e) {
							if (e.tags) {
								e.tags.forEach(function(t) {
									var key = t.value + '--' + t.type;
									totalTags[key] = t;
								});
							}

						});

						var senRec = {
							start: start,
							end: end,
							tags: totalTags,
							text: text
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
				onSaved: undefined,
				onCancel: undefined
			}, opts_);

			var _this = this;
			this.dispatchService = opts.dispatchService;
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
				globalScaleFactor: 5
				,globalTimeOffset: 0.5
			};

			var f = function(m, addr, dispatcher) {
				_this._handle(m, addr, dispatcher);
			};

			if (this.dispatchService) {
				this.dispatchService.register(DH, 'annotationEditorViewRefresh', f);
				this.dispatchService.register(DH, 'annotationEditorViewAggregateModeChanged', f);
			}
		},

		_handle: function( m, addr, dispatcher) {
			var _this = this;
			if ('annotationEditorViewRefresh' === m.type) {
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

			} else if ('annotationEditorViewAggregateModeChanged' === m.type) {
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

		render: function(opts){
			var _this = this;
			var $container = opts.container;
			var $formField = $('<div>')
				.attr('id', this.editorId)
				.appendTo($container);

			// Add switch for aggregation
			new $n2.mdc.MDCSwitch({
				parentElem: $formField,
				label: 'Aggregation',
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
			});

			// Add container div for theme tag box, place tag box, and
			// comments text box.
			$('<div>')
				.attr('id', this.innerFormId)
				.appendTo($formField);

			// Add Save and Cancel Control Buttons.
			new $n2.mdc.MDCButton({
				parentElem: $formField,
				btnLabel: 'Save',
				onBtnClick: function() {
					_this._clickedSave();
				}
			});

			if (this.onCancel) {
				new $n2.mdc.MDCButton({
					parentElem: $formField,
					btnLabel: 'Cancel',
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
				,onSuccess:function(doc) {
					switch(_this.editorMode) {
					case CineAnnotationEditorMode.TAGSELECTION:
						updateDocForTags(doc, _this.dataDepot);
						break;
					case CineAnnotationEditorMode.TAGGROUPING:
						updateDocForTagGrouping(doc);
						alert('Tag group info has been saved');
						break;
					case CineAnnotationEditorMode.TAGSETTING:
						updateDocForTagSetting(doc);
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
						&& typeof tagValues !== "undefined"){
						modified |= singleSectionUpdate (doc, tagValues, start, end);
					}
				})

//  		var modified = false;
//			$formfieldSections.each(function(){
//				var start = $(this).find('span.n2transcript_label.label_startTimeCode')
//					.text();
//				var end = $(this).find('span.n2transcript_label.label_finTimeCode')
//					.text();
//				var tagbox =$(this).find('div.n2-tag-box > div.mdc-chip-set');
//				var tagValues = (tagbox.first().data('tags'));
//				if (typeof start !== "undefined"
//					&& typeof end !== "undefined"
//					&& typeof tagValues !== "undefined"){
//					modified |= singleSectionUpdate (doc, tagValues, start, end);
//				}
//			});
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

			function singleSectionUpdate(doc, tagValues, start, end){
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
						&& Array.isArray(timeLink.tags)) {
							timeLink.tags.forEach(function(tag) {
								var tagString = tag.value + '--' + tag.type;
								if (!lastTagsMapByTimelink[tagString]) {
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

					// Check and verify adding new tag(s)
					matchingLinks.forEach(function(timeLink) {
						if (updateTimeLinkWithTags(timeLink, tagValues)) {
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
				$formfieldSections.each(function() {
					var color = $(this).find('input.n2transcript_input.input_colorpicker').val();
					var name = $(this).find('input.n2transcript_input.input_tagname').val();
					var tagbox = $(this).find('div.n2-tag-box > div.mdc-chip-set');
					var tagValues = (tagbox.first().data('tags'));
					if (typeof color !== "undefined"
						&& color.length === 7
						&& typeof name !== "undefined") {
						newTagColors[name] = color;
					}

					if (typeof tagValues !== "undefined"
						&& Array.isArray(tagValues)
						&& tagValues.length > 0) {
						newTagGroups[name] = tagValues;
					}
				});

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

				} else {
					alert('Nothing has been changed!');
				}
			}

			function updateDocForTagSetting (doc) {
				var $formfieldSections = $('div.n2WidgetAnnotation_tagSettings_formfieldSection');
				$formfieldSections.each(function() {
					var _gsfInput = $(this).find('input.n2transcript_input.input_scaleFactor');
					var _gtoInput = $(this).find('input.n2transcript_input.input_timeOffset');
					if (_gsfInput.get(0) !== document || _gtoInput.get(0) !== document) {
						var _gsfInputValue = _gsfInput.val();
						var _gtoInputValue = _gtoInput.val();
						if (_gsfInputValue || _gtoInputValue){
							if (typeof doc.atlascine_cinemap.settings === 'undefined') {
								doc.atlascine_cinemap.settings = {};
							}
							doc.atlascine_cinemap.settings.globalScaleFactor = _gsfInputValue;
							doc.atlascine_cinemap.settings.globalTimeOffset = _gtoInputValue;
							documentSource.updateDocument({
								doc: doc
								,onSuccess: onSaved
								,onError: function(err) {
									$n2.reportErrorForced(_loc('Unable to submit document: {err}',{err: err}));
								}
							});
						}

					} else {
						alert('scaleFactor field doesnot exist');
					}
				});
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

				if ($n2.keys(oldTagGroups).length !== $n2.keys(newTagGroups ).length) {
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

		_clickedCancel: function(){
			if( this.onCancel ){
				this.onCancel(this);
			}
		},

		_addTagSetting: function($parent){
			var _this = this;
			//current cinemap doc;
			var doc = this.currentDoc;
			this.gloScaleFactorId = $n2.getUniqueId();
			this.gloTimeOffsetId = $n2.getUniqueId();
			var _setting = $n2.extend({}, _this._default_setting);

			var $formFieldSection = $('<div>')
				.addClass('n2WidgetAnnotation_tagSettings_formfieldSection')
				.appendTo($parent);

			var $headdiv = $('<div>')
				.addClass('formfieldSection_header')
				.appendTo($formFieldSection);

			if (doc
				&& doc.atlascine_cinemap
				&& doc.atlascine_cinemap.settings) {
				_setting = $n2.extend(_setting, doc.atlascine_cinemap.settings);
			}

			for (var se in _setting) {
				if (se === 'globalScaleFactor') {
					var _sf = _setting[se];
					$('<label>')
						.attr('for', _this.gloScaleFactorId)
						.html('GlobalScaleFactor')
						.appendTo($formFieldSection);

					$('<input>')
						.attr('id', _this.gloScaleFactorId)
						.addClass('n2transcript_input input_scaleFactor')
						.val(_sf)
						.appendTo($formFieldSection);

				} else if (se === 'globalTimeOffset'){
					var _sf = _setting[se];
					$('<label>')
						.attr('for', _this.gloTimeOffsetId)
						.html('GlobalTimeOffset')
						.appendTo($formFieldSection);
					$('<input>')
						.attr('id', _this.gloTimeOffsetId)
						.addClass('n2transcript_input input_timeOffset')
						.val(_sf)
						.appendTo($formFieldSection);
				}
			}
		},

		_addTagGroupEditing: function($parent){
			var _this = this;
			var doc = this.currentDoc;
			var existingTagGroupArr = [];
			if (doc
				&& doc.atlascine_cinemap
				&& doc.atlascine_cinemap.tagColors) {
				for (var tagna in doc.atlascine_cinemap.tagGroups) {
					if (tagna === 'place' || tagna === 'location'){
						continue;
					}
					var taginfo = {
						name: tagna,
						color: doc.atlascine_cinemap.tagColors[tagna],
						children: []
					};
					var tagchildren = findChildTags(tagna);
					if (tagchildren) {
						taginfo.children = tagchildren;
					}
					existingTagGroupArr.push(taginfo);
				}

				//generate existing tagGroupEditors
				_this._addExistingTagGroupSingleUnit($parent, existingTagGroupArr);
			}

			$('<hr>').appendTo($parent);
			new $n2.mdc.MDCButton({
				parentElem: $parent,
				mdcClasses: ['n2WidgetAnnotation_tagGroup_addNewGroupBtn'],
				btnLabel: 'Add new tag group',
				onBtnClick: function(){
					var _self = this;
					var $taggroupContainer = $('<div>')
						.addClass('n2WidgetAnnotation_tagGroup_container')
						.insertBefore($('.n2WidgetAnnotation_tagGroup_addNewGroupBtn'));
					_this._addEmptyTagGroupSingleUnit($taggroupContainer);
				}
			});

			function findChildTags(target){
				var rst = undefined;
				for (var tagna in doc.atlascine_cinemap.tagGroups) {
					if (tagna === target
						&& doc.atlascine_cinemap.tagGroups[tagna].length > 0) {
						if (!rst) {
							rst = [];
						}
						// clone the children tags group
						rst = doc.atlascine_cinemap.tagGroups[tagna].slice(0);
					}
				}
				return rst;
			}
		},

		_addExistingTagGroupSingleUnit: function($parent, tagGroupArr){
			var $formField = $parent;
			tagGroupArr.forEach(function(taginfo){

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
					.text('Color')
					.appendTo($mdcColorInputDiv);

				var $mdcTagInputDiv= $('<div>')
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
					.text('Tag Name')
					.appendTo($mdcTagInputDiv);

				new $n2.mdc.MDCTagBox({
					parentElem : $rightdiv,
					label: 'TagGroupMember',
					mdcClasses: ['n2transcript_label','label_tagbox_tagGroupMembers'],
					chips: taginfo.children
				});

				new $n2.mdc.MDCButton({
					parentElem: $footerdiv,
					btnLabel : 'Delete',
					onBtnClick: function(){
						$formFieldSection.remove();
					}
				});
			});
		},

		_addEmptyTagGroupSingleUnit: function($parent, opts) {
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
				.text('Color')
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
				.text('Tag Name')
				.appendTo($mdcInputDiv);

			new $n2.mdc.MDCTagBox({
				parentElem: $rightdiv,
				label: 'TagGroupMember',
				mdcClasses: ['n2transcript_label','label_tagbox_tagGroupMembers'],
				chips: []
			});

			new $n2.mdc.MDCButton({
				parentElem: $formFieldSection,
				btnLabel: 'Delete',
				onBtnClick: function() {
					$formFieldSection.remove();
				}
			});
		},

		_addFormViewForSingleUnit: function($parent, data){
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
					.text('Start: ')
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label label_startTimeCode')
					.text(opts.start)
					.appendTo($formFieldSection);

				$('<span>')
					.addClass('n2transcript_label_name')
					.text('End: ')
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
//					.appendTo($formFieldSection);

				var doc = _this.currentDoc;
				var lastThemeTags = [];
				var lastPlaceTags = [];
				if (doc && doc.atlascine_cinemap) {
					var timeLinks = doc.atlascine_cinemap.timeLinks;
					if (!timeLinks) {
//						No timeLinks no worry
						return;
					}

					var matchingSen = depot.getMatchingSen(opts.start, opts.end);
					if (matchingSen) {
						matchingSen.forEach(function(timeLink) {
							if (timeLink.tags) {
								for (var tag in timeLink.tags) {
									var tagProfile = timeLink.tags[tag];
									if ('place' ===  tagProfile.type || 'location' === tagProfile.type) {
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
						autoCompleteViewName: 'tags',
						label: 'Theme Tags',
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
							}
						// $n2.log('I wonder what is this: ', tagList);
						}
					});

					new $n2.mdc.MDCTagBox({
						parentElem: $formFieldSection,
						autoCompleteViewName: 'tags',
						label: 'Place Tags',
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

//		senData.forEach(function(opts){
//			var $formFieldSection = $('<div>')
//			.addClass('n2WidgetAnnotation_formfieldSection')
//			.appendTo($formField);
//
//			$('<span>')
//			.addClass('n2transcript_label_name')
//			.text('Start: ' )
//			.appendTo($formFieldSection);
//
//			$('<span>')
//			.addClass('n2transcript_label label_startTimeCode')
//			.text(opts.start)
//			.appendTo($formFieldSection);
//
//			$('<span>')
//			.addClass('n2transcript_label_name')
//			.text('End: ')
//			.appendTo($formFieldSection);
//
//			$('<span>')
//			.addClass('n2transcript_label label_finTimeCode')
//			.text(opts.end)
//			.appendTo($formFieldSection);
//
//			$('<span>')
//			.addClass('n2transcript_label label_transcriptText')
//			.text(opts.text)
//			.appendTo($formFieldSection);
//
//			$('<hr>').appendTo($formFieldSection);
////			.appendTo($formFieldSection);
//
//			var doc = _this.currentDoc;
//			var lastThemeTags = [];
//			var lastPlaceTags = [];
//			if( doc
//					&& doc.atlascine_cinemap ){
//				var timeLinks = doc.atlascine_cinemap.timeLinks;
//				if( !timeLinks ){
////					No timeLinks no worry
//					return;
//				};
//
//				var matchingSen = depot.getMatchingSen(opts.start, opts.end);
//				if (matchingSen){
//					matchingSen.forEach(function(timeLink){
//						if (timeLink.tags){
//							for (var tag in timeLink.tags){
//								var tagProfile = timeLink.tags[tag];
//								if ( 'place' ===  tagProfile.type || 'location' === tagProfile.type) {
//									lastPlaceTags.push(tagProfile);
//								} else {
//									lastThemeTags.push(tagProfile);
//								}
//							}
//						}
//					});
//				}
//
//				new $n2.mdc.MDCTagBox({
//					parentElem : $formFieldSection,
//					autoCompleteViewName : 'tags',
//					label: 'Theme Tags',
//					mdcClasses: ['n2transcript_label','label_tagbox_themetags'],
//					chips: lastThemeTags,
//					chipsetsUpdateCallback: function(tagList, operation, target){
//						switch(operation){
//							case 'ADD':
//								var value = target.chipText;
//								var addtar = $n2.extend({value: value}, target);
//							delete addtar['fraction'];
//								_this.dataDepot.addPartialTag(opts.start, opts.end, addtar)
//								$n2.log('Adding tags', target);
//								break;
//							case 'DELETE':
//								var value = target.chipText;
//								var deltar = $n2.extend({value: value}, target);
//								_this.dataDepot.deletePartialTag(opts.start, opts.end, deltar);
//								$n2.log('Deleting tags', target);
//								break;
//						}
//						//$n2.log('I wonder what is this: ', tagList);
//					}
//				});
//
//				new $n2.mdc.MDCTagBox({
//					parentElem : $formFieldSection,
//					autoCompleteViewName: 'tags',
//					label: 'Place Tags',
//					mdcClasses: ['n2transcript_label','label_tagbox_placetags'],
//					chips:lastPlaceTags,
//					chipsetsUpdateCallback: function(tagList, operation, target){
//						switch(operation){
//							case 'ADD':
//								var value = target.chipText;
//								var addtar = $n2.extend({value: value}, target);
//								addtar['type'] = 'place';
//								delete addtar['fraction'];
//								_this.dataDepot.addPartialTag(opts.start, opts.end, addtar)
//								$n2.log('Adding tags', addtar);
//								break;
//							case 'DELETE':
//								var value = target.chipText;
//								var deltar = $n2.extend({value: value}, target);
//								deltar['type'] = 'place';
//								_this.dataDepot.deletePartialTag(opts.start, opts.end, deltar);
//								$n2.log('Deleting tags', deltar);
//								break;
//						}
//						//$n2.log('I wonder what is this: ', tagList);
//					}
//				})
//			} else {
//				alert('Current document doesnot have (atlascine_cinemap) property');
//				return;
//			};
//		});
		},

		_buildThemeTagProfiles: function(senData) {
			var rst = [];
			var fracMap = undefined;
			if (senData.length > 0) {
				fracMap = {}; // true means full cover; false means partial

				senData.forEach(function(sd) {
					for (var tag in sd.tags) {
						if (sd.tags[tag].type !== 'place'
						&& sd.tags[tag].type !== 'location') {
							fracMap[tag] = $n2.extend({fraction: 'full'}, sd.tags[tag]);
						}
					}
				});

				for (var tag in fracMap) {
					senData.forEach(function(se) {
						if (!(tag in se.tags)) {
							fracMap[tag].fraction = 'partial';
						}
					});
				}

			} else {
				$n2.log("focusSentences data is not valid");
			}

			if (fracMap) {
				for (var tag in fracMap) {
					rst.push(fracMap[tag]);
				}
			}
			return rst;
		},

		_buildPlaceTagProfiles: function(senData) {
			var rst = [];
			var fracMap = undefined;
			if (senData.length > 0) {
				fracMap = {};//true means full cover; false means partial

				senData.forEach(function(sd){
					for (var tag in sd.tags){
						if (sd.tags[tag].type
							&& (sd.tags[tag].type === 'place'
							|| sd.tags[tag].type === 'location')) {
							fracMap[tag] = $n2.extend({fraction: 'full'}, sd.tags[tag]);
						}
					}
				});

				for (var tag in fracMap) {
					senData.forEach(function(se) {
						if (!(tag in se.tags)) {
							fracMap[tag].fraction = 'partial';
						}
					});
				}

			} else {
				$n2.log("focusSentences data is not valid");
			}

			if (fracMap) {
				for (var tag in fracMap) {
					rst.push(fracMap[tag]);
				}
			}
			return rst;
		},

		/**
		 * Add annotation form field section to annotation editor widget.
		 *  - Form includes; place tag tagbox field, theme tag tagbox field,
		 * comments, and sentance text.
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

			// Add theme tags tagbox component.
			new $n2.mdc.MDCTagBox({
				parentElem: $formFieldSection,
				autoCompleteViewName: 'tags',
				label: 'Theme Tags',
				mdcClasses: ['n2transcript_label','label_tagbox_themetags'],
				chips: lastThemeTags,
				chipsetsUpdateCallback: function(tagList, operation, target) {
					var value, addtar, deltar;
					switch (operation) {
					case 'ADD':
						value = target.chipText;
						addtar = $n2.extend({value: value}, target);
						_this.dataDepot.addFullTag(addtar);
						$n2.log('Adding tags', target);
						break;
					case 'DELETE':
						value = target.chipText;
						deltar = $n2.extend({value: value}, target);
						_this.dataDepot.deleteTag(deltar);
						$n2.log('Deleting tags', target);
						break;
					default:
						break;
					}
				// $n2.log('I wonder what is this: ', tagList);
				}
			});

			// Add place tags tagbox component
			new $n2.mdc.MDCTagBox({
				parentElem: $formFieldSection,
				label: 'Place Tags',
				autoCompleteViewName: 'tags',
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
						break;
					default:
						break;
					}
				// $n2.log('I wonder what is this: ', tagList);
				}
			});

		},

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
				,sourceModelId: undefined
			},opts_);

			var _this = this;

			this.dispatchService = opts.dispatchService;
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
				.addClass('n2AnnotationEditorLoader')
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

		// Get the element id of the loader div (div.n2AnnotationEditorLoader)
		_getLoaderDiv: function() {
			return $("#" + this.loaderDivId);
		},

		// Get the element id of the content view div (div.n2AnnotationEditorView)
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

		// Start the Annotation Editor Widget when tag selection button is clicked.
		_startEditor: function(ctxMenuOption, senDataArr){
			var _this = this;

			if (this.annotationEditorView) {
				if (!this.drawer) {
					var $container = this._getContentViewDiv();
					var containerId = $n2.utils.getElementIdentifier($container);
					// Add a sliding drawer to content view div (div.n2AnnotationEditorView)
					this.drawer = new $n2.ui.drawer({
						containerId: containerId,
						width: '500px',
						customizedContentFn: function(opts){
							_this._drawEditor(opts);
						}
					});
				}
			}

			var currentDoc = undefined;
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

//		this.annotationEditorView.refresh({
//			option: ctxMenuOption,
//			data: senDataArr,
//			doc: currentDoc
//		});
		},

		/**
	 	* Close the editor drawer
	 	*/
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
			var _this = this;

			if ('annotationEditorStart' === m.type) {
				var ctxMenuOption = m.ctxMenuOption;
				var senDataArr = m.senDataArr;
				this._startEditor(ctxMenuOption, senDataArr);

			} else if ('annotationEditorClose' === m.type) {
				this._closeEditor();

			} else if ('annotationEditorIsAvailable' === m.type) {
				m.available = true;

			} else if ('modelStateUpdated' === m.type) {
				// Does it come from one of our sources?
				if (this.sourceModelId === m.modelId) {
					this._sourceModelUpdated(m.state);
				}

			} else if ('annotationEditorViewRefreshDone' === m.type) {
				_this._showContent();
				this.drawer.open();

			} else if ('annotationEditorShowLoader' === m.type) {
				_this._showLoader();
			}
		},

		_refreshCurrentDoc: function() {
			if (this.docsById[this.currentDocId]) {
				// OK, nothing has changed

			} else {
				// Select a new document
				this.currentDocId = undefined;
				for (var docId in this.docsById) {
					this.currentDocId = docId;
				}

				if (!this.currentDocId) {
					this._closeEditor();

				} else if (this.annotationEditorView) {
					this._closeEditor();
					var doc = this.docsById[this.currentDocId];
					this.annotationEditorView.refresh({
						doc: doc
					});
				}
			}
		},

		_sourceModelUpdated: function(sourceState) {
			var i, e, doc, docId;
			if (sourceState.added) {
				for (i = 0, e = sourceState.added.length; i < e; ++i) {

					// Temporary workup for single cinemap selection
					// Better bug fix the SelectableDocumentFilter
					this.docsById = {};

					doc = sourceState.added[i];
					docId = doc._id;

					this.docsById[docId] = doc;
				}
			}

			if (sourceState.updated) {
				for (i = 0, e = sourceState.updated.length; i < e; ++i) {
					doc = sourceState.updated[i];
					docId = doc._id;

					this.docsById[docId] = doc;
				}
			}

			if (sourceState.removed) {
				for (i=0, e=sourceState.removed.length; i<e; ++i) {
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
		if (m.widgetType === 'annotationEditorWidget') {
			var widgetOptions = m.widgetOptions;
			var containerId = widgetOptions.containerId;
			var config = m.config;

			var options = {};

			if (widgetOptions) {
				for (var key in widgetOptions) {
					var value = widgetOptions[key];
					options[key] = value;
				}
			}

			options.containerId = containerId;

			if (config && config.directory) {
				options.dispatchService = config.directory.dispatchService;
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
