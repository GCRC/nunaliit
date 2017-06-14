/*
Copyright (c) 2017, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.utilitiesModel'
 ;

//--------------------------------------------------------------------------
var Action = $n2.Class({
	initialize: function(opts_){
		var opts = $n2.extend({
			
		},opts_);
	},
	
	execute: function(){
		throw new Exception('Action.execute() must be implemented by subclasses');
	}
});

//--------------------------------------------------------------------------
var SetFilterSelectionAction = $n2.Class('SetFilterSelectionAction', Action, {

	dispatchService: null,

	modelId: null,

	selection: null,

	selectedChoicesSetEventName: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
			,modelId: undefined
			,selection: undefined
		},opts_);
		
		this.dispatchService = opts.dispatchService;
		this.modelId = opts.modelId;
		this.selection = opts.selection;

		if( ! $n2.isArray(this.selection) ){
			throw new Error('selection must be an array of strings');
		};
		this.selection.forEach(function(sel){
			if( typeof sel !== 'string' ){
				throw new Error('selection must be an array of strings');
			};
		});

		if( typeof this.modelId !== 'string' ){
			throw new Error('modelId must be a string');
		};

		// Get information from model
		if( this.dispatchService ){
			// Get model info
			var modelInfoRequest = {
				type: 'modelGetInfo'
				,modelId: this.modelId
				,modelInfo: null
			};
			this.dispatchService.synchronousCall(DH, modelInfoRequest);
			var sourceModelInfo = modelInfoRequest.modelInfo;
			
			if( sourceModelInfo 
			 && sourceModelInfo.parameters  ){
				if( sourceModelInfo.parameters.selectedChoices ){
					var paramInfo = sourceModelInfo.parameters.selectedChoices;
					this.selectedChoicesSetEventName = paramInfo.setEvent;
				};
			};
		};
	},
	
	execute: function(){
		this.dispatchService.send(DH, {
			type: this.selectedChoicesSetEventName
			,value: this.selection
		});
	}
});

//--------------------------------------------------------------------------
function createActionFromDefinition(dispatchService, definition){
	
	if( typeof definition != 'object' ){
		throw new Error('Unable to create an instance of Action since definition is not provided');
	};
	
	// Legacy actionType => type
	if( typeof definition.actionType === 'string' 
	 && typeof definition.type !== 'string' ){
		definition.type = definition.actionType;
	};
	
	// Create instance from definition
	var m = {
		type: 'instanceCreate'
		,instanceConfiguration: definition
		,instance: undefined
	};
	dispatchService.synchronousCall(DH,m);
	var instance = m.instance;
	
	if( !instance ){
		throw new Error('Unable to create an instance of type: '+definition.type);
	};
	
	if( typeof instance != 'object' ){
		throw new Error('Instance of type: '+definition.type+' is not an object');
	};
	
	if( typeof instance.execute != 'function' ){
		throw new Error('Instance of type: '+definition.type+' must implement execute() method');
	};
	
    return instance;
};

//--------------------------------------------------------------------------
var FilterMonitor = $n2.Class('FilterMonitor', {
		
	dispatchService: null,

	sourceModelId: null,

	allSelectedAction: null,

	notAllSelectedAction: null,

	selectedChoicesChangeEventName: null,

	allSelectedChangeEventName: null,

	allSelected: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
			,sourceModelId: undefined
			,onAllSelected: undefined
			,onNotAllSelected: undefined
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		this.sourceModelId = opts.sourceModelId;
		
		if( typeof opts.onAllSelected === 'object' ){
			this.allSelectedAction = createActionFromDefinition(this.dispatchService, opts.onAllSelected);
		};
		if( typeof opts.onNotAllSelected === 'object' ){
			this.notAllSelectedAction = createActionFromDefinition(this.dispatchService, opts.onNotAllSelected);
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
			 && sourceModelInfo.parameters  ){
				if( sourceModelInfo.parameters.selectedChoices ){
					var paramInfo = sourceModelInfo.parameters.selectedChoices;
					this.selectedChoicesChangeEventName = paramInfo.changeEvent;
	
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
	
					if( typeof paramInfo.value === 'boolean' ){
						this.allSelected = paramInfo.value;
						
						if( this.allSelected ){
							if( this.allSelectedAction ){
								this.allSelectedAction.execute();
							};
						} else {
							if( this.notAllSelectedAction ){
								this.notAllSelectedAction.execute();
							};
						};
					};
				};
			};
			
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};

			if( this.selectedChoicesChangeEventName ){
				this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
			};

			if( this.allSelectedChangeEventName ){
				this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
			};
		};
		
		$n2.log(this._classname, this);
	},
	
	_handle: function(m, addr, dispatcher){
		if( this.allSelectedChangeEventName === m.type ){
			if( typeof m.value === 'boolean' ){
				if( this.allSelected && !m.value ){
					if( this.notAllSelectedAction ){
						this.notAllSelectedAction.execute();
					};
				} else if( !this.allSelected && m.value ){
					if( this.allSelectedAction ){
						this.allSelectedAction.execute();
					};
				};
				
				this.allSelected = m.value;
			};
		};
	}
});

//--------------------------------------------------------------------------
function HandleUtilityCreateRequests(m, addr, dispatcher){
	if( 'filterMonitor' === m.utilityType ){
		var options = {};
		
		if( typeof m.utilityOptions === 'object' ){
			for(var key in m.utilityOptions){
				var value = m.utilityOptions[key];
				options[key] = value;
			};
		};
		
		if( m.config ){
			if( m.config.directory ){
				options.dispatchService = m.config.directory.dispatchService;
			};
		};
		
        new FilterMonitor(options);
        
        m.created = true;
	};
};

//--------------------------------------------------------------------------
function getCurrentConfiguration(dispatcher){
	var config = undefined;
	
	if( dispatcher ){
		var m = {
			type: 'configurationGetCurrentSettings'
		};
		dispatcher.synchronousCall(DH,m);
		config = m.configuration;
	};

	return config;
};

//--------------------------------------------------------------------------
function handleInstanceCreate(m, addr, dispatcher){
	if( 'setFilterSelection' === m.instanceConfiguration.type ){
		var config = getCurrentConfiguration(dispatcher);
		
		var options = {};
		
		if( typeof m.instanceConfiguration === 'object' ){
			for(var key in m.instanceConfiguration){
				var value = m.instanceConfiguration[key];
				options[key] = value;
			};
		};
		
		
		if( config ){
			if( config.directory ){
				options.dispatchService = config.directory.dispatchService;
			};
		};
		
		m.instance = new SetFilterSelectionAction(options);
	};
};

//--------------------------------------------------------------------------
$n2.utilitiesModel = {
	HandleUtilityCreateRequests: HandleUtilityCreateRequests
	,handleInstanceCreate: handleInstanceCreate
	,FilterMonitor: FilterMonitor
};

})(jQuery,nunaliit2);
