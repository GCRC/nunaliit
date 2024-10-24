/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.widgetSelectableFilter'
 ,ALL_CHOICES = '__ALL_CHOICES__'
 ,NO_CHOICE = '__NO_CHOICE_SELECTED__'
 ,UNKNOWN_CHOICE = '__UNKNOWN_CHOICE_SELECTED__'
 ;

//--------------------------------------------------------------------------
var SingleFilterSelectionWidget = $n2.Class('SingleFilterSelectionWidget',{
	
	dispatchService: null,
	
	showService: null,
	
	sourceModelId: null,
	
	elemId: null,

	selectedChoicesChangeEventName: null,

	selectedChoicesSetEventName: null,

	allSelectedChangeEventName: null,

	allSelectedSetEventName: null,

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,
	
	allSelected: null,
	
	allChoicesLabel: null,
	
	noChoiceLabel: null,
	
	suppressAllChoices: null,

	suppressNoChoice: null,
	
	suppressedChoicesMap: null,

	tooltip: null,
	
	/* 
	 * These are versions of functions that are throttled. These
	 * functions touch the DOM structure and should not be called too.
	 * often as they affect performance.
	 */
	_throttledAvailableChoicesUpdated: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
			,noChoiceLabel: null
			,suppressAllChoices: false
			,suppressNoChoice: false
			,suppressChoices: undefined
			,tooltip: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;
		this.noChoiceLabel = opts.noChoiceLabel;
		this.suppressAllChoices = opts.suppressAllChoices;
		this.suppressNoChoice = opts.suppressNoChoice;

		if (opts.tooltip
			&& typeof opts.tooltip === 'string'
			&& opts.tooltip.length) {
			this.tooltip = opts.tooltip;
		}

		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		this.allSelected = false;
		this.suppressedChoicesMap = [];
		this._throttledAvailableChoicesUpdated = $n2.utils.throttle(this._availableChoicesUpdated, 1500);

		if( opts.suppressChoices ){
			if( $n2.isArray(opts.suppressChoices) ){
				opts.suppressChoices.forEach(function(choice){
					if( typeof choice === 'string' ){
						_this.suppressedChoicesMap[choice] = true;
					} else {
						$n2.logError('SingleFilterSelectionWidget: suppressChoices must be an array of strings');
					};
				});
			} else {
				$n2.logError('SingleFilterSelectionWidget: suppressChoices must be an array');
			};
		};
		
		// Set up model listener
		if( this.dispatchService ){
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
			 && sourceModelInfo.parameters.availableChoices ){
				var paramInfo = sourceModelInfo.parameters.availableChoices;
				this.availableChoicesChangeEventName = paramInfo.changeEvent;

				if( paramInfo.value ){
					this._setAvailableChoices(paramInfo.value);
				};
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters  ){
				if( sourceModelInfo.parameters.selectedChoices ){
					var paramInfo = sourceModelInfo.parameters.selectedChoices;
					this.selectedChoicesChangeEventName = paramInfo.changeEvent;
					this.selectedChoicesSetEventName = paramInfo.setEvent;
	
					if( paramInfo.value ){
						this.selectedChoices = paramInfo.value;
						
						this.selectedChoiceIdMap = {};
						this.selectedChoices.forEach(function(choiceId){
							_this.selectedChoiceIdMap[choiceId] = true;
						});
					};
				};

				if( sourceModelInfo.parameters.allSelected ){
					var paramInfo = sourceModelInfo.parameters.allSelected;
					this.allSelectedChangeEventName = paramInfo.changeEvent;
					this.allSelectedSetEventName = paramInfo.setEvent;
	
					if( typeof paramInfo.value === 'boolean' ){
						this.allSelected = paramInfo.value;
					};
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};

			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
			};

			if( this.allSelectedChangeEventName ){
				this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
			};
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
			.addClass('n2widget_singleFilterSelection')
			.appendTo($container);
		
		this._availableChoicesUpdated();
		
		$n2.log('SingleFilterSelectionWidget', this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_availableChoicesUpdated: function(){
		var _this = this;

		var $elem = this._getElem();
		$elem.empty();
		
		var $selector = $('<select>')
			.appendTo($elem)
			.change(function(){
				_this._selectionChanged();
			});

		if (this.tooltip) {
			$selector.attr('title', this.tooltip);
		}

		if( !this.suppressNoChoice ){
			// No Choice
			var noChoiceLabel = _loc('--');
			if( this.noChoiceLabel ){
				noChoiceLabel = _loc(this.noChoiceLabel);
			};
			$('<option>')
				.addClass('n2widget_singleFilterSelection_optionNoChoice')
				.text( noChoiceLabel )
				.val(NO_CHOICE)
				.appendTo($selector);
		};

		if( !this.suppressAllChoices ){
			// All Choices
			var allChoicesLabel = _loc('All');
			if( this.allChoicesLabel ){
				allChoicesLabel = _loc(this.allChoicesLabel);
			};
			$('<option>')
				.addClass('n2widget_singleFilterSelection_optionAllChoices')
				.text( allChoicesLabel )
				.val(ALL_CHOICES)
				.appendTo($selector);
		};
		
		for(var i=0,e=this.availableChoices.length; i<e; ++i){
			var choice = this.availableChoices[i];
			
			var label = choice.label;
			if( !label ){
				label = choice.id;
			};
			
			var $option = $('<option>')
				.text(_loc(label))
				.val(choice.id)
				.appendTo($selector);
		};
		
		// Adjust classes reflecting if any options are available
		if( this.availableChoices.length > 0 ){
			$elem
				.removeClass('n2widget_singleFilterSelection_noChoiceAvailable')
				.addClass('n2widget_singleFilterSelection_atLeastOneChoiceAvailable');
		} else {
			$elem
				.removeClass('n2widget_singleFilterSelection_atLeastOneChoiceAvailable')
				.addClass('n2widget_singleFilterSelection_noChoiceAvailable');
		};
		
		this._adjustSelectedItem();
		
		// Select current
		//this._selectionChanged();
	},
	
	_adjustSelectedItem: function(){
		var _this = this;
		
		// Select appropriate choice
		var selectedChoiceId;
		if( this.allSelected  ){
			if( !this.suppressAllChoices ){
				selectedChoiceId = ALL_CHOICES;
			};

		} else if( this.selectedChoices.length < 1 ) {
			if( !this.suppressNoChoice ){
				selectedChoiceId = NO_CHOICE;
			};

		} else if( this.selectedChoices.length > 1 ) {
			selectedChoiceId = undefined;

		} else {
			selectedChoiceId = this.selectedChoices[0];
		};
		
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		if( selectedChoiceId ){
			$selector.val( selectedChoiceId );
			$selector.find('option.n2widget_singleFilterSelection_optionUnknown').remove();
		} else {
			// At this point, select UNKNOWN
			var $unknown = $selector.find('option.n2widget_singleFilterSelection_optionUnknown');
			if( $unknown.length < 1 ){
				$('<option>')
					.addClass('n2widget_singleFilterSelection_optionUnknown')
					.text('')
					.val(UNKNOWN_CHOICE)
					.prependTo($selector);
			};
			$selector.val(UNKNOWN_CHOICE);
		};
	},
	
	// This is called when the selected option within <select> is changed
	_selectionChanged: function(){
		var $elem = this._getElem();

		var $selector = $elem.find('select');
		var val = $selector.val();
		if( ALL_CHOICES === val ){
			this.dispatchService.send(DH,{
				type: this.allSelectedSetEventName
				,value: true
			});

		} else if( NO_CHOICE === val ){
			var selectedChoiceIds = [];
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});

		} else if( UNKNOWN_CHOICE === val ){
			// Do nothing

		} else {
			var selectedChoiceIds = [];
			selectedChoiceIds.push(val);
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});
		};
	},
	
	_setAvailableChoices: function(choices){
		var _this = this;

		this.availableChoices = [];
		
		if( $n2.isArray(choices) ){
			choices.forEach(function(choice){
				if( _this.suppressedChoicesMap[choice.id] ){
					// Do not keep this one
				} else {
					_this.availableChoices.push(choice);
				};
			});
		};
	},
	
	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableChoicesChangeEventName === m.type ){
			if( m.value ){
				this._setAvailableChoices(m.value);

				//this._availableChoicesUpdated();
				this._throttledAvailableChoicesUpdated();
			};
			
		} else if( this.selectedChoicesChangeEventName === m.type ){
			if( m.value ){
				this.selectedChoices = m.value;
				
				this.selectedChoiceIdMap = {};
				this.selectedChoices.forEach(function(choiceId){
					_this.selectedChoiceIdMap[choiceId] = true;
				});
				
				this._adjustSelectedItem();
			};

		} else if( this.allSelectedChangeEventName === m.type ){
			if( typeof m.value === 'boolean' ){
				this.allSelected = m.value;
				
				this._adjustSelectedItem();
			};
		};
	}
});

//--------------------------------------------------------------------------
var MultiFilterSelectionWidget = $n2.Class('MultiFilterSelectionWidget',{
	
	dispatchService: null,
	
	showService: null,
	
	sourceModelId: null,
	
	elemId: null,

	selectedChoicesChangeEventName: null,

	selectedChoicesSetEventName: null,

	allSelectedChangeEventName: null,

	allSelectedSetEventName: null,

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,
	
	allSelected: null,
	
	allChoicesLabel: null,

	tooltip: null,

	/* 
	 * These are versions of functions that are throttled. These
	 * functions touch the DOM structure and should not be called too.
	 * often as they affect performance.
	 */
	_throttledAvailableChoicesUpdated: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
			,tooltip: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;

		if (opts.tooltip
			&& typeof opts.tooltip === 'string'
			&& opts.tooltip.length) {
			this.tooltip = opts.tooltip;
		}
		
		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		this.allSelected = false;
		this._throttledAvailableChoicesUpdated = $n2.utils.throttle(this._availableChoicesUpdated, 1500);
		
		// Set up model listener
		if( this.dispatchService ){
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
			 && sourceModelInfo.parameters.availableChoices ){
				var paramInfo = sourceModelInfo.parameters.availableChoices;
				this.availableChoicesChangeEventName = paramInfo.changeEvent;

				if( paramInfo.value ){
					this.availableChoices = paramInfo.value;
				};
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters ){
				if( sourceModelInfo.parameters.selectedChoices ){
					var paramInfo = sourceModelInfo.parameters.selectedChoices;
					this.selectedChoicesChangeEventName = paramInfo.changeEvent;
					this.selectedChoicesSetEventName = paramInfo.setEvent;
	
					if( paramInfo.value ){
						this.selectedChoices = paramInfo.value;
						
						this.selectedChoiceIdMap = {};
						this.selectedChoices.forEach(function(choiceId){
							_this.selectedChoiceIdMap[choiceId] = true;
						});
					};
				};

				if( sourceModelInfo.parameters.allSelected ){
					var paramInfo = sourceModelInfo.parameters.allSelected;
					this.allSelectedChangeEventName = paramInfo.changeEvent;
					this.allSelectedSetEventName = paramInfo.setEvent;
	
					if( typeof paramInfo.value === 'boolean' ){
						this.allSelected = paramInfo.value;
					};
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};

			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
			};

			if( this.allSelectedChangeEventName ){
				this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
			};
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		var $selector = $('<div>')
			.attr('id',this.elemId)
			.addClass('n2widget_multiFilterSelection')
			.appendTo($container);
		

		if (this.tooltip) {
			$selector.attr('title', this.tooltip);
		}

		this._throttledAvailableChoicesUpdated();
		
		$n2.log(this._classname, this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_availableChoicesUpdated: function(){
		var _this = this;

		var $elem = this._getElem();
		$elem.empty();

		// All Choices
		var allChoicesLabel = _loc('All');
		if( this.allChoicesLabel ){
			allChoicesLabel = _loc(this.allChoicesLabel);
		};
		var $a = $('<a>')
			.addClass('n2widget_multiFilterSelection_optionAllChoices n2widget_multiFilterSelection_option')
			.attr('href','#')
			.attr('n2-choice-id',ALL_CHOICES)
			.appendTo($elem)
			.click(function(){
				var $a = $(this);
				var choiceId = $a.attr('n2-choice-id');
				_this._selectionClicked(choiceId, $a);
				return false;
			});
		$('<span>')
			.text(allChoicesLabel)
			.appendTo($a);
		
		for(var i=0,e=this.availableChoices.length; i<e; ++i){
			var choice = this.availableChoices[i];
			
			var label = choice.label;
			if( !label ){
				label = choice.id;
			};
			
			var $a = $('<a>')
				.addClass('n2widget_multiFilterSelection_option')
				.attr('href',choice.id)
				.attr('n2-choice-id',choice.id)
				.appendTo($elem)
				.click(function(){
					var $a = $(this);
					var choiceId = $a.attr('n2-choice-id');
					_this._selectionClicked(choiceId, $a);
					return false;
				});
			$('<span>')
				.text(_loc(label))
				.appendTo($a);
		};
		
		this._adjustSelectedItem();
	},
	
	_adjustSelectedItem: function(){
		var _this = this;
		
		var $elem = this._getElem();
		$elem.find('.n2widget_multiFilterSelection_option').each(function(){
			var $option = $(this);
			var choiceId = $option.attr('n2-choice-id');
			
			var selected = false;
			if( ALL_CHOICES === choiceId ){
				if( _this.allSelected ){
					selected = true;
				};
			} else {
				if( _this.selectedChoiceIdMap[choiceId] ){
					selected = true;
				};
			};
			
			if( selected ){
				$option.removeClass('n2widget_multiFilterSelection_notSelected');
				$option.addClass('n2widget_multiFilterSelection_selected');
			} else {
				$option.removeClass('n2widget_multiFilterSelection_selected');
				$option.addClass('n2widget_multiFilterSelection_notSelected');
			};
		});
	},
	
	// This is called when one of the selection is clicked
	_selectionClicked: function(choiceId, $a){
		var _this = this;

		if( ALL_CHOICES === choiceId ){
			if( this.allSelected ){
				// If already all selected, select none
				this.dispatchService.send(DH,{
					type: this.selectedChoicesSetEventName
					,value: []
				});

			} else {
				// Select all
				this.dispatchService.send(DH,{
					type: this.allSelectedSetEventName
					,value: true
				});
			};

		} else {
			var selectedChoiceIds = [];

			var removed = false;
			this.selectedChoices.forEach(function(selectedChoiceId){
				if( selectedChoiceId === choiceId ){
					removed = true;
				} else {
					selectedChoiceIds.push(selectedChoiceId);
				};
			});
			
			if( !removed ){
				selectedChoiceIds.push(choiceId);
			};
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});
		};
	},
	
	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableChoicesChangeEventName === m.type ){
			if( m.value ){
				this.availableChoices = m.value;
				
				//this._availableChoicesUpdated();
				this._throttledAvailableChoicesUpdated();
			};
			
		} else if( this.selectedChoicesChangeEventName === m.type ){
			if( m.value ){
				this.selectedChoices = m.value;
				
				this.selectedChoiceIdMap = {};
				this.selectedChoices.forEach(function(choiceId){
					_this.selectedChoiceIdMap[choiceId] = true;
				});
				
				this._adjustSelectedItem();
			};

		} else if( this.allSelectedChangeEventName === m.type ){
			if( typeof m.value === 'boolean' ){
				this.allSelected = m.value;
				
				this._adjustSelectedItem();
			};
		};
	}
});

//--------------------------------------------------------------------------
var MultiFilterSelectionDropDownWidget = $n2.Class('MultiFilterSelectionDropDownWidget',{
	
	dispatchService: null,
	
	showService: null,
	
	sourceModelId: null,
	
	elemId: null,

	selectedChoicesChangeEventName: null,

	selectedChoicesSetEventName: null,

	allSelectedChangeEventName: null,

	allSelectedSetEventName: null,

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,

	allSelected: null,
	
	allChoicesLabel: null,
	
	noChoiceLabel: null,

	label: null,

	showAsLink: null,

	tooltip: null,

	/* 
	 * These are versions of functions that are throttled. These
	 * functions touch the DOM structure and should not be called too
	 * often as they affect performance.
	 */
	_throttledAvailableChoicesUpdated: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
			,noChoiceLabel: null
			,label: null
			,showAsLink: false
			,tooltip: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;
		this.noChoiceLabel = opts.noChoiceLabel;
		this.label = opts.label;
		this.showAsLink = opts.showAsLink;

		if (opts.tooltip
			&& typeof opts.tooltip === 'string'
			&& opts.tooltip.length) {
			this.tooltip = opts.tooltip;
		}

		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		this._throttledAvailableChoicesUpdated = $n2.utils.throttle(this._availableChoicesUpdated, 1500);
		
		// Set up model listener
		if( this.dispatchService ){
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
			 && sourceModelInfo.parameters.availableChoices ){
				var paramInfo = sourceModelInfo.parameters.availableChoices;
				this.availableChoicesChangeEventName = paramInfo.changeEvent;

				if( paramInfo.value ){
					this.availableChoices = paramInfo.value;
				};
			};
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.selectedChoices ){
				var paramInfo = sourceModelInfo.parameters.selectedChoices;
				this.selectedChoicesChangeEventName = paramInfo.changeEvent;
				this.selectedChoicesSetEventName = paramInfo.setEvent;

				if( paramInfo.value ){
					this.selectedChoices = paramInfo.value;
					
					this.selectedChoiceIdMap = {};
					this.selectedChoices.forEach(function(choiceId){
						_this.selectedChoiceIdMap[choiceId] = true;
					});
				};
			};

			if( sourceModelInfo 
			 && sourceModelInfo.parameters 
			 && sourceModelInfo.parameters.allSelected ){
				var paramInfo = sourceModelInfo.parameters.allSelected;
				this.allSelectedChangeEventName = paramInfo.changeEvent;
				this.allSelectedSetEventName = paramInfo.setEvent;

				if( typeof paramInfo.value === 'boolean' ){
					this.allSelected = paramInfo.value;
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};
			
			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
			};
			
			if( this.allSelectedChangeEventName ){
				this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
			};
		};

		// Get container
		var containerId = opts.containerId;
		if( !containerId ){
			throw new Error('containerId must be specified');
		};
		var $container = $('#'+containerId);
		
		this.elemId = $n2.getUniqueId();
		
		var $elem = $('<div>')
			.attr('id',this.elemId)
			.addClass('n2widget_multiDropDownFilterSelection n2widget_multiDropDownFilterSelection_selection_hidden')
			.appendTo($container);

		if (this.tooltip) {
			$elem.attr('title', this.tooltip);
		}
		
		if( this.showAsLink ){
			$elem.addClass('n2widget_multiDropDownFilterSelection_asLink');
		};
		
		var $relDiv = $('<div>')
		.css({
			position: 'relative'
		})
		.appendTo($elem);
		
		var buttonLabel = undefined;
		if( this.label ){
			buttonLabel = _loc(this.label);
		};
		if( !buttonLabel ){
			buttonLabel = _loc('Multi-Selection');
		};
		if( this.showAsLink ){
			$('<a>')
				.attr('href',buttonLabel)
				.text( buttonLabel )
				.appendTo($relDiv)
				.click(function(){
					_this._buttonClicked();
					return false;
				});
		} else {
			$('<button>')
				.appendTo($relDiv)
				.text( buttonLabel )
				.click(function(){
					_this._buttonClicked();
				});
		};
		
		$('<div>')
			.addClass('n2widget_multiDropDownFilterSelection_position')
			.appendTo($relDiv);
		
		this._throttledAvailableChoicesUpdated();
		
		document.addEventListener('click', function(event) {
			_this._handleClickOnDoc(event);
		}, true);

		$n2.log(this._classname, this);
	},
	
	_getElem: function(){
		return $('#'+this.elemId);
	},

	_availableChoicesUpdated: function(){
		var _this = this;

		var $elem = this._getElem();
		var $position = $elem.find('.n2widget_multiDropDownFilterSelection_position');
		$position.empty();
		
		var $selectDiv = $('<div>')
			.appendTo($position)
			.addClass('n2widget_multiDropDownFilterSelection_select');

		// All Choices
		var allChoicesLabel = _loc('All');
		if( this.allChoicesLabel ){
			allChoicesLabel = _loc(this.allChoicesLabel);
		};
		addOption($selectDiv, ALL_CHOICES, allChoicesLabel);
		
		for(var i=0,e=this.availableChoices.length; i<e; ++i){
			var choice = this.availableChoices[i];
			
			var label = choice.label;
			if( !label ){
				label = choice.id;
			};
			
			addOption($selectDiv, choice.id, label);
		};
		
		this._adjustSelectedItem();
		
		// Select current
		//this._selectionChanged();
		
		function addOption($selectDiv, choiceId, label){
			var $div = $('<div>')
				.addClass('n2widget_multiDropDownFilterSelection_option')
				.attr('data-n2-choiceId',choiceId)
				.appendTo($selectDiv);

			$('<a>')
				.text(_loc(label))
				.attr('data-n2-choiceId',choiceId)
				.attr('href', '#')
				.appendTo($div)
				.click(function(){
					var $a = $(this);
					var choiceId = $a.attr('data-n2-choiceId');
					_this._selectionChanged(choiceId);
					return false;
				});
		};
	},
	
	_adjustSelectedItem: function(){
		var _this = this;

		var allSelected = this.allSelected;

		var selectedChoiceIdMap = {};
		this.selectedChoices.forEach(function(selectedChoice){
			selectedChoiceIdMap[selectedChoice] = true;
		});
		
		var $elem = this._getElem();
		$elem.find('.n2widget_multiDropDownFilterSelection_option').each(function(){
			var $a = $(this);
			var value = $a.attr('data-n2-choiceId');
			if( allSelected || selectedChoiceIdMap[value] ){
				$a
					.removeClass('n2widget_multiDropDownFilterSelection_optionUnselected')
					.addClass('n2widget_multiDropDownFilterSelection_optionSelected');
			} else {
				$a
					.removeClass('n2widget_multiDropDownFilterSelection_optionSelected')
					.addClass('n2widget_multiDropDownFilterSelection_optionUnselected');
			};
		});
	},
	
	// This is called when the selected option within <select> is changed
	_selectionChanged: function(choiceId){

		if( ALL_CHOICES === choiceId ){
			if( this.allSelected ){
				// If already all selected, select none
				this.dispatchService.send(DH,{
					type: this.selectedChoicesSetEventName
					,value: []
				});

			} else {
				// Select all
				this.dispatchService.send(DH,{
					type: this.allSelectedSetEventName
					,value: true
				});
			};

		} else {
			var selectedChoiceIds = [];

			var removed = false;
			this.selectedChoices.forEach(function(selectedChoiceId){
				if( selectedChoiceId === choiceId ){
					removed = true;
				} else {
					selectedChoiceIds.push(selectedChoiceId);
				};
			});
			
			if( !removed ){
				selectedChoiceIds.push(choiceId);
			};
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});
		};
	},
	
	_buttonClicked: function () {
		const $elem = this._getElem();
		const _this = this;

		if ($elem.hasClass('n2widget_multiDropDownFilterSelection_selection_shown')) {
			this._hideMultiDropDownFilterSelection($elem, this.elemId);
		} else {
			$elem.removeClass('n2widget_multiDropDownFilterSelection_selection_hidden')
				 .addClass('n2widget_multiDropDownFilterSelection_selection_shown');
		}
	},

	_handleClickOnDoc: function (event) {
		const $elem = this._getElem();
		if (!$(event.target).closest($elem).length && $elem.hasClass('n2widget_multiDropDownFilterSelection_selection_shown')) {
			this._hideMultiDropDownFilterSelection($elem);
		}
	},

	_hideMultiDropDownFilterSelection: function ($elem) {
		$elem.removeClass('n2widget_multiDropDownFilterSelection_selection_shown')
			 .addClass('n2widget_multiDropDownFilterSelection_selection_hidden');
	},
		
	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableChoicesChangeEventName === m.type ){
			if( m.value ){
				this.availableChoices = m.value;
				
				this._throttledAvailableChoicesUpdated();
			};
			
		} else if( this.selectedChoicesChangeEventName === m.type ){
			if( m.value ){
				this.selectedChoices = m.value;
				
				this.selectedChoiceIdMap = {};
				this.selectedChoices.forEach(function(choiceId){
					_this.selectedChoiceIdMap[choiceId] = true;
				});
				
				this._adjustSelectedItem();
			};

		} else if( this.allSelectedChangeEventName === m.type ){
			if( typeof m.value === 'boolean' ){
				this.allSelected = m.value;
				
				this._adjustSelectedItem();
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'singleFilterSelectionWidget' ){
		m.isAvailable = true;

	} else if( m.widgetType === 'multiFilterSelectionWidget' ){
		m.isAvailable = true;

	} else if( m.widgetType === 'multiFilterSelectionDropDownWidget' ){
		m.isAvailable = true;
    };
};

//--------------------------------------------------------------------------
function HandleWidgetDisplayRequests(m){
	if( m.widgetType === 'singleFilterSelectionWidget' ){
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
			options.showService = config.directory.showService;
		};
		
		new SingleFilterSelectionWidget(options);

	} else if( m.widgetType === 'multiFilterSelectionWidget' ){
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
			options.showService = config.directory.showService;
		};
		
		new MultiFilterSelectionWidget(options);

	} else if( m.widgetType === 'multiFilterSelectionDropDownWidget' ){
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
			options.showService = config.directory.showService;
		};
		
		new MultiFilterSelectionDropDownWidget(options);
    };
};

//--------------------------------------------------------------------------
$n2.widgetSelectableFilter = {
	SingleFilterSelectionWidget: SingleFilterSelectionWidget
	,MultiFilterSelectionWidget: MultiFilterSelectionWidget
	,MultiFilterSelectionDropDownWidget: MultiFilterSelectionDropDownWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
