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
	
	lastSelectedChoiceId: null,
	
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
		this.lastSelectedChoiceId = ALL_CHOICES;
		
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
			.text( noChoiceLabel )
			.val(NO_CHOICE)
			.appendTo($selector);

		// All Choices
		var allChoicesLabel = _loc('All');
		if( this.allChoicesLabel ){
			allChoicesLabel = _loc(this.allChoicesLabel);
		};
		$('<option>')
			.text( allChoicesLabel )
			.val(ALL_CHOICES)
			.appendTo($selector);
		
		var currentFound = null;
		var optionElements = [];
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

			optionElements.push($option);
			
			if( choice.id === this.lastSelectedChoiceId ){
				currentFound = choice.id;
			};
		};
		
		if( currentFound ){
			$selector.val(currentFound);
			//$n2.log('selector => '+currentFound);
		} else {
			$selector.val(ALL_CHOICES);
			//$n2.log('selector => empty');
		};
		
		// Select current
		this._selectionChanged();
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
			
		} else {
			var selectedChoiceIds = [];
			selectedChoiceIds.push(val);
			
			this.dispatchService.send(DH,{
				type: this.selectedChoicesSetEventName
				,value: selectedChoiceIds
			});
		};
	},
	
	_selectedChoicesUpdated: function(){
		var $elem = this._getElem();
		var $selector = $elem.find('select');
		$selector.val( this.lastSelectedChoiceId );
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
				var selectedMap = {};
				var selectedChoiceId = undefined;
				m.value.forEach(function(choiceId){
					selectedMap[choiceId] = true;
					selectedChoiceId = choiceId;
				});
				
				// Detect all layers
				var allChoices = true;
				var noChoice = true;
				this.availableChoices.forEach(function(choice){

					if( selectedMap[choice.id] ){
						noChoice = false;
					} else {
						allChoices = false;
					};
				});
				
				if( allChoices ){
					this.lastSelectedChoiceId = ALL_CHOICES;
				} else if( noChoice ) {
					this.lastSelectedChoiceId = NO_CHOICE;
				} else {
					this.lastSelectedChoiceId = selectedChoiceId;
				};
				
				this._selectedChoicesUpdated();
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleWidgetAvailableRequests(m){
	if( m.widgetType === 'singleFilterSelectionWidget' ){
		if( $.fn.slider ) {
			m.isAvailable = true;
		};
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
    };
};

//--------------------------------------------------------------------------
$n2.widgetSelectableFilter = {
	SingleFilterSelectionWidget: SingleFilterSelectionWidget
	,HandleWidgetAvailableRequests: HandleWidgetAvailableRequests
	,HandleWidgetDisplayRequests: HandleWidgetDisplayRequests
};

})(jQuery,nunaliit2);
