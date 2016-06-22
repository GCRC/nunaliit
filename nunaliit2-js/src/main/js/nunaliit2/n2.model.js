/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.model'
 ;

//--------------------------------------------------------------------------
 /**
  * This class manages a parameter based on a model. A parameter supports
  * 3 events:
  * - get
  * - change
  * - set
  * 
  * The "get" event returns the current value of a parameter.
  * The "change" event is sent to the parameter, indicating the new value desired
  * by the user.
  * The "set" event is sent went the parameter value is modified.
  */
var ModelParameter = $n2.Class({

	model: null,
	
	parameterId: null,
	
	type: null,
	
	name: null,
	
	label: null,
	
	setFn: null,
	
	getFn: null,
	
	dispatchService: null,
	
	eventNameSet: null,
	
	eventNameGet: null,
	
	eventNameChange: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			model: null
			,modelId: null // optional
			,type: null
			,name: null
			,label: null
			,setFn: null
			,getFn: null
			,dispatchService: null
		},opts_);
	
		var _this = this;
		
		this.model = opts.model;
		this.type = opts.type;
		this.name = opts.name;
		this.label = opts.label;
		this.setFn = opts.setFn;
		this.getFn = opts.getFn;
		this.dispatchService = opts.dispatchService;
		
		var modelId = opts.modelId;
		if( !modelId ){
			modelId = $n2.getUniqueId('parameter_');
		};
		
		if( !this.label ){
			this.label = this.name;
		};
		
		this.parameterId = modelId + '_' + this.name;
		this.eventNameSet = this.parameterId + '_set';
		this.eventNameGet = this.parameterId + '_get';
		this.eventNameChange = this.parameterId + '_change';
		
		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, this.eventNameSet, fn);
			this.dispatchService.register(DH, this.eventNameGet, fn);
		};
	},

	getInfo: function(){
		var info = {
			parameterId: this.parameterId
			,type: this.type
			,name: this.name
			,label: this.label
			,setEvent: this.eventNameSet
			,getEvent: this.eventNameGet
			,changeEvent: this.eventNameChange
		};
		
		var effectiveValue = this._getValue();
		info.value = effectiveValue;
		
		return info;
	},

	sendUpdate: function(){
		var effectiveValue = this._getValue();
		this.dispatchService.send(DH, {
			type: this.eventNameChange
			,parameterId: this.parameterId
			,value: effectiveValue
		});
	},

	_getValue: function(){
		var value = null;
		
		if( this.getFn ){
			value = this.getFn.call(this.model);
		} else {
			value = this.model[this.name];
		};
		
		return value;
	},

	_setValue: function(value){
		if( this.setFn ){
			this.setFn.call(this.model, value);
		} else {
			this.model[this.name] = value;
			this.sendUpdate();
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( m.type === this.eventNameSet ){
			var value = m.value;
				
			this._setValue(value);
	 			
		} else if( m.type === this.eventNameGet ){
			var effectiveValue = this._getValue();
			m.value = effectiveValue;
		};
	}
});

//--------------------------------------------------------------------------
/**
 * This class implements a generic Observer to monitor a ParameterModel.
 * Build an instance of observer by providing the info structure obtained
 * by a model.
 */
var ModelParameterObserver = $n2.Class({

	dispatchService: null,
	
	onChangeFn: null,

	// Variables obtained from info
	
	parameterId: null,

	type: null,

	name: null,

	label: null,

	setEvent: null,
	
	getEvent: null,
	
	changeEvent: null,
	
	// Cached value that was observed last
	
	lastValue: null,

	initialize: function(opts_){
		var opts = $n2.extend({
			parameterInfo: null
			,dispatchService: null
			,onChangeFn: null
		},opts_);
	
		var _this = this;
		
		this.onChangeFn = opts.onChangeFn;
		this.dispatchService = opts.dispatchService;
		this.lastValue = undefined;

		if( opts.parameterInfo 
		 && typeof opts.parameterInfo === 'object' ){
			this.parameterId = opts.parameterInfo.parameterId;
			this.type = opts.parameterInfo.type;
			this.name = opts.parameterInfo.name;
			this.label = opts.parameterInfo.label;
			this.setEvent = opts.parameterInfo.setEvent;
			this.getEvent = opts.parameterInfo.getEvent;
			this.changeEvent = opts.parameterInfo.changeEvent;
			this.lastValue = opts.parameterInfo.value;
		} else {
			throw new Error('parameterInfo must be provided');
		};

		if( this.dispatchService ){
			var fn = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH, this.changeEvent, fn);
		};
	},
	
	getValue: function(){
		return this.lastValue;
	},
	
	setValue: function(value){
		this.lastValue = value;

		this.dispatchService.send(DH, {
			type: this.setEvent
			,value: value
		});
	},

	_handle: function(m, addr, dispatcher){
		if( m.type === this.changeEvent  
		 && m.parameterId === this.parameterId ){
			var value = m.value;
			
			if( this.lastValue !== value ){
				var previousValue = this.lastValue;
				this.lastValue = value;
				if( typeof this.onChangeFn === 'function' ){
					this.onChangeFn(this.lastValue, previousValue);
				};
			};
		};
	}
});

//--------------------------------------------------------------------------
var Service = $n2.Class({
	
	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: null
		},opts_);
		
		var _this = this;
		
		this.dispatchService = opts.dispatchService;
		
		// Register to events
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handle(m, addr, dispatcher);
			};
			this.dispatchService.register(DH,'modelCreate',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'modelCreate' === m.type ){
			if( ! m.modelType ){
				$n2.log('modelType must be provided when creating a model');
				return;
			};
			
			if( ! m.modelId ){
				$n2.log('modelId must be provided when creating a model: '+m.modelType);
				return;
			};
			
			if( $n2.modelUtils && typeof $n2.modelUtils.handleModelCreate === 'function' ){
				$n2.modelUtils.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.modelTime && typeof $n2.modelTime.handleModelCreate === 'function' ){
				$n2.modelTime.handleModelCreate(m, addr, dispatcher);
			};

			if( $n2.modelLayer && typeof $n2.modelLayer.handleModelCreate === 'function' ){
				$n2.modelLayer.handleModelCreate(m, addr, dispatcher);
			};
			
			try {
				if( 'couchDb' === m.modelType 
				 || 'couchDbDataSource' === m.modelType ){
			        this._createCouchDbModel(m);
			    };
			} catch(err) {
				$n2.log('Error while creating model '+m.modelType+'/'+m.modelId+': '+err);
			};
		};
	},
	
	_createCouchDbModel: function(m){
		if( $n2.couchDbPerspective 
		 && $n2.couchDbPerspective.DbPerspective ){
			var options = {
				modelId: m.modelId
			};
			
			if( m && m.config ){
				options.atlasDesign = m.config.atlasDesign;
				
				if( m.config.directory ){
					options.dispatchService = m.config.directory.dispatchService;
				};
			};
			
			var dbPerspective = new $n2.couchDbPerspective.DbPerspective(options);
			
			// Load layers
			if( m.modelOptions 
			 && m.modelOptions.selectors ){
				var selectors = m.modelOptions.selectors;
				for(var i=0,e=selectors.length; i<e; ++i){
					var selectorConfig = selectors[i];
					dbPerspective.addDbSelectorFromConfigObject(selectorConfig);
				};
			};
			
			m.created = true;

		} else {
			throw 'DbPerspective is not available';
		};
	}
});

//--------------------------------------------------------------------------
$n2.model = {
	Service: Service
	,ModelParameter: ModelParameter
	,ModelParameterObserver: ModelParameterObserver
};

})(jQuery,nunaliit2);
