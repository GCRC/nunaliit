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

	var $l;
	var _loc = function(str,args) {
		return $n2.loc(str,'nunaliit2',args);
	};
	var DH = 'n2.canvasVerticalTimeline';

	// Required library: luxon
	if (window.luxon) {
		$l = window.luxon;
	} else {
		return;
	}

	/**
	 * Walk-thru document and return the first Nunaliit date object it finds
	 * @param object
	 * @returns {object} Nunaliit date object
	 */
	function getDateFromDoc(object) {
		var key, result;

		// Return object if the object is a Nunaliit date object.
		if (Object.hasOwnProperty.call(object, 'nunaliit_type')
			&& object.nunaliit_type === 'date') {
			return object;
		}

		for (key in object) {
			if (Object.hasOwnProperty.call(object, key)
				&& typeof object[key] === 'object') {
				// Recursively check if nested object contains a Nunaliit
				// date object.
				result = getDateFromDoc(object[key]);

				if (result) {
					// return result if it's not undefined
					return result;
				}
			}
		}

		return result;
	}

	/**
	 * Get the current height of the canvas.
	 * @param canvasId
	 * @returns {number} canvas height in pixels
	 */
	function getCanvasHeight(canvasId) {
		var canvasHeight = $('#' + canvasId).height();

		if (canvasHeight <= 0) {
			canvasHeight = 0;
		}

		return canvasHeight;
	}

	// -------------------------------------------------------------------------
	/**
	 * @class
	 * The vertical timeline canvas displays an ordered list of elements.
	 *
	 * The attribute for each timeline element is described here:
	 * - id: String. Unique identifier for this element
	 * - n2_doc: Document used to create the element item
	 * - sort: Optional String. Used to sort the cells in the vertical timeline.
	 * If no sort value is provided, sort by element date values is attempted.
	 * - fragments: Map map of fragments that make this element. Gives a list of
	 * documents used to make up this element.
	 *
	 * @param {string} canvasId - Unique identified for the canvas
	 * @param {string} sourceModelId - Unique identified of the model used by
	 * the canvas
	 * @param {string} [elementGeneratorType] Name of element generator type
	 * @param {object} [elementGeneratorOptions] Element generator options
	 * @param {string} [labelDateFormat] Date format string for canvas label
	 * @param {boolean} [ascendingSortOrder=true] Defines if ascending sort
	 * order should be used or not.
	 * @param {boolean} [displayIndex=true] Defines if the side index should be
	 * shown or not
	*/
	var VerticalTimelineCanvas = $n2.Class('VerticalTimelineCanvas',{

		canvasId: null,

		canvasContainerId: null,

		indexElemId: null,

		canvasListElemId: null,

		itemWidth: null,

		timelineIndex: null,

		sortedIndex: null,

		indexElements: null,

		sortedElements: null,

		timelineList: null,

		dispatchService: null,

		showService: null,

		dateRange: null,

		elementGenerator: null,

		sourceModelId: null,

		ascendingSortOrder: null,

		displayIndex: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				canvasId: null,
				displayIndex: true,
				ascendingSortOrder: true,
				sourceModelId: null,
				elementGenerator: null,
				config: null,
				moduleDisplay: null,
				onSuccess: function() {},
				onError: function(err) {}
			},opts_);

			var _this = this;
			this.canvasId = opts.canvasId;
			this.displayIndex = opts.displayIndex;
			this.ascendingSortOrder = opts.ascendingSortOrder;
			this.sourceModelId = opts.sourceModelId;
			this.elementGenerator = opts.elementGenerator;
			this.elementsById = {};
			this.sortedElements = [];
			this.canvasContainerId = $n2.getUniqueId();
			this.canvasIndexId = $n2.getUniqueId();
			this.canvasTimelineId = $n2.getUniqueId();

			var config = opts.config;
			if (config) {
				if (config.directory) {
					this.dispatchService = config.directory.dispatchService;
					this.showService = config.directory.showService;
				}
			}

			// Register to events
			if (this.dispatchService) {
				var f = function(m) {
					_this._handleDispatch(m);
				};

				this.dispatchService.register(DH,'modelGetInfo',f);
				this.dispatchService.register(DH,'modelStateUpdated',f);
				this.dispatchService.register(DH,'windowResized',f);
				this.dispatchService.register(DH,'userUnselect',f);
			}

			// Element generator
			if (this.elementGenerator) {
				this.elementGenerator.setElementsChangedListener(function(added, updated, removed) {
					_this._elementsChanged(added, updated, removed);
				});
			}

			this._createTimeline();
			opts.onSuccess();

			$n2.log(this._classname,this);
		},

		// Send unselect event when the background is clicked
		_backgroundClicked: function() {
			if (this.dispatchService) {
				this.dispatchService.send(DH,{
					type: 'userUnselect'
				});
			}
		},

		// Dynamically calculate the width for each item in the list
		_calcListItemWidth: function() {
			var width;
			var itemPadding = 30;

			width = ($('#' + this.canvasTimelineId).width() / 2) - itemPadding;
			this.itemWidth = width;
		},

		_linkIdExists: function(id) {
			var currentlyExists = false;
			if ($('#' + id).length > 0) {
				currentlyExists = true;
			}
			return currentlyExists;
		},

		_linkIndexToListItems: function() {
			var i, e, arrayItem, indexItemId, indexItemSortValue, itemsArray;
			var	sortValue, index;

			var getSortValue = function(arrayItem) {
				var sortValue;
				if (arrayItem
					&& arrayItem.attributes
					&& arrayItem.attributes.n2_sortvalue
					&& arrayItem.attributes.n2_sortvalue.value) {
					sortValue = arrayItem.attributes.n2_sortvalue.value;
				}
				return sortValue;
			};

			if (!this.ascendingSortOrder) {
				itemsArray = $('#' + this.canvasId + ' .n2_vertical_timeline_item_label')
					.get().reverse();

			} else {
				itemsArray = $('#' + this.canvasId + ' .n2_vertical_timeline_item_label');
			}

			for (i = 0, e = itemsArray.length; i < e; i += 1) {
				arrayItem = itemsArray[i];
				sortValue = getSortValue(arrayItem);

				for (index in this.indexElements) {
					if (this.indexElements.hasOwnProperty(index)) {
						if (this.indexElements[index].id
							&& this.indexElements[index].sort) {
							indexItemId = this.indexElements[index].id;
							indexItemSortValue = this.indexElements[index].sort;

							if (sortValue >= indexItemSortValue
								&& !this._linkIdExists(indexItemId)) {
								arrayItem.id = indexItemId;
							}
						}
					}
				}
			}
		},

		_createTimeline: function() {
			var $target, $canvas, $canvasList;
			var _this = this;

			// Remove old canvas container if it already exists
			$canvas = $('#' + this.canvasId).find('#' + this.canvasContainerId);
			$canvas.remove();

			// Add container for timeline canvas
			$('<div>')
				.attr('class', 'n2_vertical_timeline')
				.attr('id', this.canvasContainerId)
				.click(function(e) {
					$target = $(e.target);
					if ($target.hasClass('n2_vertical_timeline_item')
						|| $target.parents('.n2_vertical_timeline_item').length > 0) {
						// Ignore
					} else {
						_this._backgroundClicked();
					}
				})
				.appendTo($('#' + this.canvasId));

			// Add container for timeline index
			if (this.displayIndex) {
				$('<div>')
					.attr('class','n2_vertical_timeline_index')
					.attr('id',this.canvasIndexId)
					.appendTo('#' + this.canvasContainerId);
			}

			// Add container for timeline list
			$canvasList = $('<div>')
				.attr('class','n2_vertical_timeline_list')
				.appendTo($('#' + this.canvasContainerId))
				.on('scroll', function() {
					_this._handleScrollEvent();
				});

			if (!this.displayIndex) {
				$canvasList.css('width','100%');
			}

			$('<ul>')
				.attr('id', this.canvasTimelineId)
				.appendTo($canvasList);

			// Add canvas padding to bottom
			// Needed for index active status updating when scrolling canvas
			$('<div>')
				.addClass('n2_vertical_timeline_padding')
				.css('height', getCanvasHeight(this.canvasId))
				.appendTo($canvasList);

			this._refresh();
		},

		_updateTimelinePadding: function() {
			$('#' + this.canvasContainerId + ' .n2_vertical_timeline_list')
				.find('.n2_vertical_timeline_padding')
				.css('height', getCanvasHeight(this.canvasId));
		},

		_refresh: function() {
			var i, e, timelineItemOptions, timelineIndexOptions, $timelineList, $index;

			// Empty canvas timeline list
			$timelineList = $('#' + this.canvasContainerId)
				.find('#' + this.canvasTimelineId);
			$timelineList.empty();

			// Empty canvas index list
			$index = $('#' + this.canvasContainerId)
				.find('#' + this.canvasIndexId);
			$index.empty();

			if (this.sortedElements.length > 0) {
				timelineIndexOptions = {
					'canvasId': this.canvasId,
					'canvasIndexId': this.canvasIndexId,
					'sortedElements': this.sortedElements,
					'ascendingSortOrder': this.ascendingSortOrder
				};

				this.timelineIndex = new TimelineIndex(timelineIndexOptions);
				this.sortedIndex = this.timelineIndex.getSortedIndex();
				this.indexElements = this.timelineIndex.getIndexElements();
				this._updateTimelinePadding();

				// Re-Calculate Item Width based on available window space
				this._calcListItemWidth();

				for (i = 0, e = this.sortedElements.length; i < e; i += 1) {
					// Exclude link elements if produced by
					// the generic element generator
					if (this.elementGenerator._classname === 'GenericElementGenerator'
						&& this.sortedElements[i].isLink) {
						// Do nothing
					} else {
						timelineItemOptions = {
							element: this.sortedElements[i],
							timelineList: this.canvasTimelineId,
							itemWidth: this.itemWidth
						};
						new TimelineItem(timelineItemOptions);
					}
				}

				this._linkIndexToListItems();
				this.showService.fixElementAndChildren($timelineList);
			}
		},

		_handleScrollEvent: function() {
			var i, e, index, elem;
			var headerHeight = 100;
			if (this.sortedIndex && this.indexElements) {
				for (i = 0, e = this.sortedIndex.length; i < e; i += 1) {
					index = this.sortedIndex[i];
					if (this.indexElements.hasOwnProperty(index)) {
						if (this.indexElements[index].id) {
							elem = document.getElementById(this.indexElements[index].id);
							if (elem
								&& elem.getBoundingClientRect().top > headerHeight) {
								this.timelineIndex.setActiveIndexItem(this.indexElements[index].label);
								break;
							}
						}
					}
				}
			}
		},

		// Sort elements based on sort value and label
		_sortElements: function() {
			var elementId, element, i, e;
			var uniqueLabels = [];
			this.sortedElements = [];

			for (elementId in this.elementsById) {
				if (this.elementsById.hasOwnProperty(elementId)) {
					element = this.elementsById[elementId];

					if (element.sort && element.label) {
						this.sortedElements.push(element);
					}
				}
			}

			this.sortedElements.sort(function(a,b) {
				if (a.sort < b.sort) {
					return -1;
				}
				if (a.sort > b.sort) {
					return 1;
				}
				if (a.sort === b.sort) {
					if (!a.label && b.label) {
						return -1;
					} else if (a.label && !b.label) {
						return 1;
					}
				}
				return 0;
			});

			if (!this.ascendingSortOrder) {
				this.sortedElements.reverse();
			}

			// Remove duplicate labels from canvas
			for (i = 0, e = this.sortedElements.length; i < e; i += 1) {
				if (uniqueLabels.indexOf(this.sortedElements[i].label) >= 0) {
					// Not unique, remove label from element.
					delete this.sortedElements[i].label;
				} else {
					uniqueLabels.push(this.sortedElements[i].label);
				}
			}
		},

		_elementsChanged: function(addedElements, updatedElements, removedElements) {
			var i, e, removed, added, updated;

			// Remove elements that are no longer there
			for (i = 0, e = removedElements.length; i < e; i += 1) {
				removed = removedElements[i];
				delete this.elementsById[removed.id];
			}

			// Add elements
			for (i = 0, e = addedElements.length; i < e; i += 1) {
				added = addedElements[i];
				this.elementsById[added.id] = added;
			}

			// Update elements
			for (i = 0, e = updatedElements.length; i < e; i += 1) {
				updated = updatedElements[i];
				this.elementsById[updated.id] = updated;
			}

			this._sortElements();

			this._refresh();
		},

		_sourceModelUpdated: function(state) {
			this.elementGenerator.sourceModelUpdated(state);
		},

		_handleDispatch: function(m) {
			if (m.type === 'modelStateUpdated') {
				if (this.sourceModelId === m.modelId) {
					if (m.state) {
						this._sourceModelUpdated(m.state);
					}
				}

			} else if (m.type === 'windowResized') {
				this._refresh();
			}
		}
	});

	/**
	 * Creates an vertical timeline index
	 * @class
	 *
	 * @param {string} canvasId
	 * @param {string} canvasIndexId
	 * @param {boolean} ascendingSortOrder
	 * @param {array} sortedElements
	 */
	var TimelineIndex = $n2.Class('TimelineIndex', {

		canvasId: null,

		canvasIndexId: null,

		dispatchService: null,

		indexRange: null,

		sortedElements: null,

		ascendingSortOrder: null,

		sortedIndex: null,

		indexElements: null,

		uniqueIndexValues: null,

		itemHeight: null,

		itemMargin: null,

		itemPadding: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				canvasId: null,
				canvasIndexId: null,
				ascendingSortOrder: null,
				timelineItems: null,
				onSuccess: function() {},
				onError: function(err) {}
			},opts_);

			this.canvasId = opts.canvasId;
			this.canvasIndexId = opts.canvasIndexId;
			this.ascendingSortOrder = opts.ascendingSortOrder;
			this.sortedElements = opts.sortedElements;
			this.indexRange = {'startIndex': null, 'endIndex': null};
			this.sortedIndex = [];
			this.indexElements = {};
			this.itemHeight = 15;
			this.itemPadding = 1;
			this.itemMargin = 4;

			this._generateIndex();

			this._addTimelineIndexToCanvas();

			opts.onSuccess();
		},

		_generateIndex: function() {
			var i, e, sortValue, labelValue, uniqueId;
			this.uniqueIndexValues = [];
			var uniqueIndexObjects = {};

			for (i = 0, e = this.sortedElements.length; i < e; i += 1) {
				sortValue = this.sortedElements[i].sort;
				labelValue = this.sortedElements[i].label;

				if (sortValue) {
					this._updateIndexRange(sortValue);

					if (this.uniqueIndexValues.indexOf(sortValue) < 0) {
						this.uniqueIndexValues.push(sortValue);

						if (!uniqueIndexObjects.hasOwnProperty(sortValue)) {
							uniqueId = $n2.getUniqueId();

							uniqueIndexObjects[sortValue] = {
								sort: sortValue,
								label: labelValue,
								id: uniqueId
							};
						}
					}
				}
			}

			if (this.uniqueIndexValues.length > 1) {
				this.uniqueIndexValues.sort(function(a,b) {
					if (a < b) {
						return -1;
					}
					if (a > b) {
						return 1;
					}
					return 0;
				});

				// Set index with uniqueIndexValues
				this._setIndex(this.uniqueIndexValues, uniqueIndexObjects);

				// Update index with reversed order
				if (!this.ascendingSortOrder) {
					this._setIndex(this.uniqueIndexValues.reverse(), uniqueIndexObjects);
				}
			}
		},

		_addTimelineIndexToCanvas: function() {
			var i, e, indexList, indexItem, indexElements, itemId, itemLabel, sortedIndex, sortedIndexItem;

			indexList = $('<ul>')
				.appendTo('#' + this.canvasIndexId);

			sortedIndex = this.getSortedIndex();
			indexElements = this.getIndexElements();

			for (i = 0, e = sortedIndex.length; i < e; i += 1) {
				sortedIndexItem = sortedIndex[i];
				itemId = indexElements[sortedIndexItem].id;
				itemLabel = indexElements[sortedIndexItem].label;
				indexItem = $('<li>')
					.css('min-height', this.itemHeight + "px")
					.css('padding', this.itemPadding)
					.css('margin', "0px auto " + this.itemMargin + "px auto")
					.appendTo(indexList);

				// If first item make it active
				if (i === 0) {
					indexItem.addClass('active');
				}

				$('<a>')
					.text(itemLabel)
					.attr('href', '#' + itemId)
					.appendTo(indexItem);
			}
		},

		getSortedIndex: function() {
			return this.sortedIndex;
		},

		getIndexElements: function() {
			return this.indexElements;
		},

		_setIndex: function(sortedIndex, indexElements) {
			this.sortedIndex = sortedIndex;
			this.indexElements = indexElements;
		},

		_getIndexRange: function() {
			return this.indexRange;
		},

		_setIndexRange: function(startIndex, endIndex) {
			this.indexRange.startIndex = startIndex;
			this.indexRange.endIndex = endIndex;
		},

		_updateIndexRange: function(sortValue) {
			var currentIndexRange = this._getIndexRange();

			if (!currentIndexRange.startIndex && !currentIndexRange.endIndex) {
				currentIndexRange.startIndex = sortValue;
				currentIndexRange.endIndex = sortValue;
			} else if (sortValue < currentIndexRange.startIndex) {
				currentIndexRange.startIndex = sortValue;
			} else if (sortValue > currentIndexRange.endIndex) {
				currentIndexRange.endIndex = sortValue;
			}

			if (currentIndexRange.startIndex && currentIndexRange.endIndex) {
				this._setIndexRange(currentIndexRange.startIndex, currentIndexRange.endIndex);
			}
		},

		setActiveIndexItem: function(itemLabel) {
			var i, e, indexItem, indexItems, indexItemText;

			// Update item with active class
			indexItems = $('#' + this.canvasIndexId + ' li');

			for (i = 0, e = indexItems.length; i < e; i += 1) {
				indexItem = indexItems.eq(i);
				indexItemText = indexItem.text();
				if (indexItemText === String(itemLabel)) {
					indexItem.addClass('active');
				} else {
					indexItem.removeClass('active');
				}
			}
		}
	});

	/**
	 * @class
	 * Class used for creating Timeline items for the Vertical Timeline Canvas.
	 *
	 * @param element
	 * @param itemWidth
	 * @param timelineList
	 */
	var TimelineItem = $n2.Class('TimelineItem', {

		element: null,

		itemWidth: null,

		timelineList: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				element: null,
				itemWidth: null,
				timelineList: null,
				onSuccess: function() {},
				onError: function(err) {}
			}, opts_);

			this.element = opts.element;
			this.itemWidth = opts.itemWidth;
			this.timelineList = opts.timelineList;

			this._addItemToList();

			opts.onSuccess();
		},

		_getDocIdFromDoc: function(doc) {
			if (doc && doc._id) {
				return doc._id;
			}
		},

		_getAttachment: function(doc) {
			var file;
			if (doc
				&& doc.nunaliit_attachments
				&& doc.nunaliit_attachments.files) {
				for (file in doc.nunaliit_attachments.files) {
					if (doc.nunaliit_attachments.files.hasOwnProperty(file)) {
						if (doc.nunaliit_attachments.files[file].originalName) {
							return doc.nunaliit_attachments.files[file].originalName;
						}
					}
				}
			}
		},

		_addItemToList: function() {
			var $timelineItem, $timelineItemContent, $timelineItemContentText;
			var sortValue = this.element.sort;
			var itemLabel = this.element.label;
			var docId = this._getDocIdFromDoc(this.element.n2_doc);
			var attachmentName = this._getAttachment(this.element.n2_doc);

			if (sortValue) {

				$timelineItem = $('<li>')
					.attr('class', 'n2_vertical_timeline_item n2s_userEvents')
					.attr('nunaliit-document', docId);

				if (itemLabel) {
					$('<div>')
						.attr('class', 'n2_vertical_timeline_item_label')
						.attr('n2_sortvalue', sortValue)
						.text(itemLabel)
						.appendTo($timelineItem);
				}

				$('<div>')
					.attr('class', 'n2_vertical_timeline_item_node')
					.appendTo($timelineItem);

				$timelineItemContent = $('<div>')
					.attr('class', 'n2_vertical_timeline_item_content')
					.css('width', this.itemWidth + 'px')
					.css('transform', 'translateX(-' + this.itemWidth + 'px)')
					.appendTo($timelineItem);

				if (attachmentName) {
					$('<div>')
						.attr('class', 'n2s_insertMediaView')
						.attr('nunaliit-document', docId)
						.attr('nunaliit-attachment', attachmentName)
						.appendTo($timelineItemContent);
				}

				$timelineItemContentText = $('<div>')
					.attr('class', 'n2_vertical_timeline_item_content_text')
					.appendTo($timelineItemContent);

				$('<div>')
					.attr('class', 'n2s_briefDisplay')
					.attr('nunaliit-document', docId)
					.appendTo($timelineItemContentText);

				$timelineItem.appendTo('#' + this.timelineList);
			}
		}
	});

	// -------------------------------------------------------------------------
	/**
	 * Creates an default vertical timeline element generator if custom element
	 * generator is not provided.
	 * @class
	 *
	 * @param {string} [labelDateFormat='yyyy-LL-dd'] label date format defined
	 * by luxon library.
	 */
	var DefaultVerticalTimelineElementGenerator = $n2.Class('DefaultVerticalTimelineElementGenerator', $n2.canvasElementGenerator.ElementGenerator, {

		labelDateFormat: null,

		initialize: function(opts_) {
			var opts = $n2.extend({
				labelDateFormat: 'yyyy-LL-dd'
			}, opts_);

			this.labelDateFormat = opts.labelDateFormat;

			$n2.canvasElementGenerator.ElementGenerator.prototype.initialize.call(this, opts_);
		},

		_createFragmentsFromDoc: function(doc) {
			return [
				{
					id: doc._id
					,n2_id: doc._id
					,n2_doc: doc
				}
			];
		},

		_updateElements: function(fragmentMap, currentElementMap) {
			var doc, date, luxonDate, fragId, frag, elementId, element;
			var elementsById = {};

			for (fragId in fragmentMap) {
				frag = fragmentMap[fragId];

				elementId = fragId;
				element = currentElementMap[elementId];

				if (!element) {
					element = {
						id: elementId
					};
				}
				element.fragments = {};
				element.fragments[fragId] = frag;
				elementsById[elementId] = element;

				doc = frag.n2_doc;
				element.cells = {
					id: {
						value: doc._id
					}
					,rev: {
						value: doc._rev
					}
				};
				element.n2_doc = doc;
				element.n2_id = doc._id;

				date = getDateFromDoc(element);

				// Define the element label
				if (date) {
					luxonDate = $l.DateTime.fromMillis(date.min);
					if (this.labelDateFormat) {
						element.label = _loc(luxonDate.toFormat(this.labelDateFormat));
					}
				}

				// Define the element sort value
				if (date) {
					element.sort = date.min;
				}
			}

			return elementsById;
		}
	});

	/**
	 * Creates an default vertical timeline element generator factory.
	 * Used to add the default vertical timeline element generator type.
	 * @class
	 */
	function DefaultVerticalTimelineElementGeneratorFactory(opts_) {
		var opts = $n2.extend({
			type: null
			,options: null
			,config: null
		}, opts_);

		var options = {};
		if (opts.options) {
			for (var key in opts.options) {
				var value = opts.options[key];
				options[key] = value;
			}
		}

		if (opts.config
			&& opts.config.directory) {
			options.dispatchService = opts.config.directory.dispatchService;
		}

		return new DefaultVerticalTimelineElementGenerator(options);
	}

	$n2.canvasElementGenerator.AddElementGeneratorFactory({
		type: 'verticalTimelineDefault'
		,factoryFn: DefaultVerticalTimelineElementGeneratorFactory
	});

	// -------------------------------------------------------------------------
	function HandleCanvasAvailableRequest(m) {
		if (m.canvasType === 'vertical_timeline') {
			m.isAvailable = true;
		}
	}

	// -------------------------------------------------------------------------
	function HandleCanvasDisplayRequest(m) {
		var key, options;

		if (m.canvasType === 'vertical_timeline') {

			options = {
				elementGeneratorType: 'verticalTimelineDefault'
			};

			if (m.canvasOptions) {
				for (key in m.canvasOptions) {
					if (m.canvasOptions.hasOwnProperty(key)) {
						options[key] = m.canvasOptions[key];
					}
				}
			}

			if (!options.elementGenerator) {
				// If not defined, use the one specified by type
				options.elementGenerator = $n2.canvasElementGenerator.CreateElementGenerator({
					type: options.elementGeneratorType,
					options: options.elementGeneratorOptions,
					config: m.config
				});
			}

			options.canvasId = m.canvasId;
			options.config = m.config;
			options.onSuccess = m.onSuccess;
			options.onError = m.onError;

			new VerticalTimelineCanvas(options);
		}
	}

	// -------------------------------------------------------------------------
	$n2.canvasVerticalTimeline = {
		TimelineIndex: TimelineIndex,
		TimelineItem: TimelineItem,
		VerticalTimelineCanvas: VerticalTimelineCanvas,
		HandleCanvasAvailableRequest: HandleCanvasAvailableRequest,
		HandleCanvasDisplayRequest: HandleCanvasDisplayRequest
	};

}(jQuery,nunaliit2));
