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

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,
	
	allChoicesLabel: null,
	
	noChoiceLabel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
			,noChoiceLabel: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;
		this.noChoiceLabel = opts.noChoiceLabel;
		
		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		
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
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};
			
			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
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
		
		for(var i=0,e=this.availableChoices.length; i<e; ++i){
			var choice = this.availableChoices[i];
			
			var label = choice.label;
			if( !label ){
				label = choice.id;
			};
			
			var $option = $('<option>')
				.text(label)
				.val(choice.id)
				.appendTo($selector);
		};
		
		this._adjustSelectedItem();
		
		// Select current
		//this._selectionChanged();
	},
	
	_adjustSelectedItem: function(){
		var _this = this;
		
		// Detect situation where all option is selected
		var allChoices = true;
		this.availableChoices.forEach(function(choice){
			if( !_this.selectedChoiceIdMap[choice.id] ){
				allChoices = false;
			};
		});
		
		var selectedChoiceId;
		if( allChoices ){
			selectedChoiceId = ALL_CHOICES;
		} else if( this.selectedChoices.length < 1 ) {
			selectedChoiceId = NO_CHOICE;
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
			var selectedChoiceIds = [];
			this.availableChoices.forEach(function(choice){
				selectedChoiceIds.push(choice.id);
			});
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
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
	
	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableChoicesChangeEventName === m.type ){
			if( m.value ){
				this.availableChoices = m.value;
				
				this._availableChoicesUpdated();
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

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,
	
	allChoicesLabel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;
		
		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		
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
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};
			
			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
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
			.addClass('n2widget_multiFilterSelection')
			.appendTo($container);
		
		this._availableChoicesUpdated();
		
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
				.text(label)
				.appendTo($a);
		};
		
		this._adjustSelectedItem();
	},
	
	_adjustSelectedItem: function(){
		var _this = this;
		
		// Detect situation where all option is selected
		var allChoices = true;
		this.availableChoices.forEach(function(choice){
			if( !_this.selectedChoiceIdMap[choice.id] ){
				allChoices = false;
			};
		});

		var $elem = this._getElem();
		$elem.find('.n2widget_multiFilterSelection_option').each(function(){
			var $option = $(this);
			var choiceId = $option.attr('n2-choice-id');
			
			var selected = false;
			if( ALL_CHOICES === choiceId ){
				if( allChoices ){
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
			// Detect situation where all options are selected
			var allChoices = true;
			this.availableChoices.forEach(function(choice){
				if( !_this.selectedChoiceIdMap[choice.id] ){
					allChoices = false;
				};
			});

			var selectedChoiceIds = [];
			if( allChoices ){
				// Turn off all selections
			} else {
				// Turn on all selections
				this.availableChoices.forEach(function(choice){
					selectedChoiceIds.push(choice.id);
				});
			};
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});

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
				
				this._availableChoicesUpdated();
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

	availableChoicesChangeEventName: null,

	availableChoices: null,
	
	selectedChoices: null,
	
	selectedChoiceIdMap: null,
	
	allChoicesLabel: null,
	
	noChoiceLabel: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			containerId: null
			,dispatchService: null
			,showService: null
			,sourceModelId: null
			,allChoicesLabel: null
			,noChoiceLabel: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.showService = opts.showService;
		this.sourceModelId = opts.sourceModelId;
		this.allChoicesLabel = opts.allChoicesLabel;
		this.noChoiceLabel = opts.noChoiceLabel;
		
		this.availableChoices = [];
		this.selectedChoices = [];
		this.selectedChoiceIdMap = {};
		
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
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			
			if( this.availableChoicesChangeEventName ){
				this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
			};
			
			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
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
			.attr('multiple',true)
			.change(function(){
				_this._selectionChanged();
			});

//		// No Choice
//		var noChoiceLabel = _loc('--');
//		if( this.noChoiceLabel ){
//			noChoiceLabel = _loc(this.noChoiceLabel);
//		};
//		$('<option>')
//			.addClass('n2widget_singleFilterSelection_optionNoChoice')
//			.text( noChoiceLabel )
//			.val(NO_CHOICE)
//			.appendTo($selector);

//		// All Choices
//		var allChoicesLabel = _loc('All');
//		if( this.allChoicesLabel ){
//			allChoicesLabel = _loc(this.allChoicesLabel);
//		};
//		$('<option>')
//			.addClass('n2widget_singleFilterSelection_optionAllChoices')
//			.text( allChoicesLabel )
//			.val(ALL_CHOICES)
//			.appendTo($selector);
		
		for(var i=0,e=this.availableChoices.length; i<e; ++i){
			var choice = this.availableChoices[i];
			
			var label = choice.label;
			if( !label ){
				label = choice.id;
			};
			
			var $option = $('<option>')
				.text(label)
				.val(choice.id)
				.appendTo($selector);
		};
		
		this._adjustSelectedItem();
		
		// Select current
		//this._selectionChanged();
	},
	
	_adjustSelectedItem: function(){
		var _this = this;
		
		var selectedChoiceIds = [];
		this.selectedChoices.forEach(function(selectedChoice){
			selectedChoiceIds.push(selectedChoice);
		});
		
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		$selector.val( selectedChoiceIds );
	},
	
	// This is called when the selected option within <select> is changed
	_selectionChanged: function(){
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		var values = $selector.val();

		var selectedChoiceIds = [];
		values.forEach(function(val){
			selectedChoiceIds.push(val);
		});
		
		this.dispatchService.send(DH,{
			type: this.selectedChoicesSetEventName
			,value: selectedChoiceIds
		});
	},
	
	_handle: function(m, addr, dispatcher){
		var _this = this;

		if( this.availableChoicesChangeEventName === m.type ){
			if( m.value ){
				this.availableChoices = m.value;
				
				this._availableChoicesUpdated();
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
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
