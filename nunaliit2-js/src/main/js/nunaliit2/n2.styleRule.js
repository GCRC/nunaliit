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

;(function($n2) {
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.styleRule';

//--------------------------------------------------------------------------
var TrueNode = $n2.Class({
	initialize: function(){},
	getValue: function(ctxt){
		return true;
	}
});
var g_TrueNode = new TrueNode();

//--------------------------------------------------------------------------
var svgSymbolNames = {
	'fill': {
		alt: 'fillColor'
		,applies: {
			circle: true
			,line: false
			,path: true
		}
	}
	,'fill-opacity': {
		alt: 'fillOpacity'
		,applies: {
			circle: true
			,line: false
			,path: true
		}
	}
	,'stroke': {
		alt: 'strokeColor'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
	,'stroke-width': {
		alt: 'strokeWidth'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
	,'stroke-opacity': {
		alt: 'strokeOpacity'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
	,'stroke-linecap': {
		alt: 'strokeLinecap'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
	,'r': {
		alt: 'pointRadius'
		,applies: {
			circle: true
			,line: false
			,path: false
		}
	}
	,'pointer-events': {
		alt: 'pointEvents'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
	,'cursor': {
		alt: 'cursor'
		,applies: {
			circle: true
			,line: true
			,path: true
		}
	}
};

//--------------------------------------------------------------------------
var Symbolizer = $n2.Class({
	
	symbols: null,
	
	initialize: function(){
		
		this.symbols = {};
		this._n2Symbolizer = true;
		
		for(var i=0,e=arguments.length; i<e; ++i){
			var otherSymbolizer = arguments[i];
			this.extendWith(otherSymbolizer);
		};
	},
	
	extendWith: function(symbolizer){
		if( symbolizer ){
			if( symbolizer._n2Symbolizer ){
				var att = symbolizer.symbols;
				for(var key in att){
					this.symbols[key] = att[key];
				};
			} else {
				for(var key in symbolizer){
					var symbolValue = symbolizer[key];
					if( symbolValue 
					 && symbolValue.length > 0 
					 && symbolValue[0] === '=' ){
						try {
							symbolValue = $n2.styleRuleParser.parse(symbolValue.substr(1));
						} catch(e) {
							symbolValue = e;
						};
					};
					this.symbols[key] = symbolValue;
				};
			};
		};
	},
	
	getSymbolValue: function(symbolName, ctxt){
		var value = this.symbols[symbolName];
		
		if( typeof value === 'object'
		 && typeof value.getValue === 'function' ){
			value = value.getValue(ctxt);
		};
		
		return value;
	},
	
	forEachSymbol: function(fn, ctxt){
		if( typeof fn === 'function' ){
			for(var name in this.symbols){
				var value = this.getSymbolValue(name, ctxt);
				fn(name,value);
			};
		};
	},
	
	adjustSvgElement: function(svgDomElem,ctxt){

		var nodeName = svgDomElem.nodeName.toLowerCase();

		for(var name in svgSymbolNames){
			var info = svgSymbolNames[name];
			var value = this.getSymbolValue(name,ctxt);
			if( !value && info.alt ){
				value = this.getSymbolValue(info.alt,ctxt);
			};
			
			if( value ){
				if( info.applies[nodeName] ){
					svgDomElem.setAttributeNS(null, name, value);
				};
			};
		};

		var value = this.getSymbolValue('display',ctxt);
		if( 'none' === value ){
			svgDomElem.setAttributeNS(null, 'display', 'none');
		} else {
			svgDomElem.setAttributeNS(null, 'display', 'inherit');
		};
	}
});

//--------------------------------------------------------------------------
var StyleRule = $n2.Class({
	
	condition: null,

	source: null,
	
	normal: null,
	
	selected: null,
	
	hovered: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			condition: null
			,source: null
			,normal: null
			,selected: null
			,hovered: null
		},opts_);
		
		this.condition = opts.condition;
		this.source = opts.source;
		this.normal = new Symbolizer(opts.normal);
		this.selected = new Symbolizer(opts.selected);
		this.hovered = new Symbolizer(opts.hovered);
	},
	
	isValidForContext: function(ctxt){
		if( !this.condition ){
			return false;
		};
		try {
			var result = this.condition.getValue(ctxt);
			return result;
		} catch(e) {
			return false;
		};
	}
});

//--------------------------------------------------------------------------
var StyleRules = $n2.Class({
	
	rules: null,
	
	cache: null,
	
	initialize: function(opts_){
//		var opts = $n2.extend({
//		},opts_);
		
		this.rules = [];
		this.cache = {
			normal: new Symbolizer()
			,selected: new Symbolizer()
			,hovered: new Symbolizer()
		};

		var rule = loadRuleFromObject({
			condition: "true"
			,normal: {
				'fillColor': '#ffffff'
				,'strokeColor': '#ee9999'
				,'strokeWidth': 2
				,'fillOpacity': 0.4
				,'strokeOpacity': 1
				,'strokeLinecap': "round"
				,'strokeDashstyle': "solid"
				,pointRadius: 6
				,pointerEvents: "visiblePainted"
			}
			,selected: {
				'strokeColor': "#ff2200"
			}
			,hovered: {
				'fillColor': "#0000ff"
			}
		});
		this.addRule(rule);

		var rule = loadRuleFromObject({
			condition: "isLine()"
			,hovered:{
				'strokeColor': "#0000ff"
			}
			,hoveredClicked:{
				'strokeColor': "#0000ff"
			}
		});
		this.addRule(rule);
	},
	
	addRule: function(rule){
		rule.id = $n2.getUniqueId();
		this.rules.push(rule);
	},
	
	/**
	 * ctxt: {
	 *    n2_selected: <boolean>
	 *    ,n2_hovered: <boolean>
	 *    ,n2_found: <boolean>
	 *    ,n2_intent: <null or string>
	 *    ,n2_doc: <object>
	 * }
	 */
	getSymbolizer: function(ctxt){
		var effectiveStyle = this._getStyleFromContext(ctxt);
		var symbolizer = this._getSymbolizerFromStyleAndContext(effectiveStyle, ctxt);
		return symbolizer;
	},
	
	_getSymbolizerFromStyleAndContext: function(style, ctxt){
		var label = 'normal';
		if( ctxt.n2_selected ){
			label = '$selected';
			if( ctxt.n2_hovered ){
				label = '$selectedHovered';
			};
		} else if( ctxt.n2_hovered ){
			label = '$hovered';
		};
		
		return this._getSymbolizerFromStyleAndLabel(style,label);
	},
	
	_getSymbolizerFromStyleAndLabel: function(style, label){
		if( 'normal' === label ){
			if( !style.normal ){
				style.normal = new Symbolizer();
			};
			return style.normal;
			
		} else if( '$hovered' === label ){
			if( !style.$hovered ){
				var s1 = this._getSymbolizerFromStyleAndLabel(style,'normal');
				style.$hovered = new Symbolizer(s1, style.hovered);
			};
			return style.$hovered;
			
		} else if( '$selected' === label ){
			if( !style.$selected ){
				var s1 = this._getSymbolizerFromStyleAndLabel(style,'normal');
				style.$selected = new Symbolizer(s1, style.selected);
			};
			return style.$selected;
			
		} else if( '$selectedHovered' === label ){
			if( !style.$selectedHovered ){
				var s1 = this._getSymbolizerFromStyleAndLabel(style,'$selected');
				style.$selectedHovered = new Symbolizer(s1, style.hovered);
			};
			return style.$selectedHovered;
		};
	},
	
	_getStyleFromContext: function(ctxt){
		var current = this.cache;
		for(var i=0,e=this.rules.length; i<e; ++i){
			var rule = this.rules[i];
			if( rule.isValidForContext(ctxt) ){
				var ruleId = rule.id;
				if( current[ruleId] ){
					current = current[ruleId];
				} else {
					var style = this._extendCachedStyle(current, rule);
					current[ruleId] = style;
					current = style;
				};
			};
		};
		return current;
	},
	
	_extendCachedStyle: function(style, rule){
		var extended = {};
		extended.normal = new Symbolizer(style.normal, rule.normal);
		extended.selected = new Symbolizer(style.selected, rule.selected);
		extended.hovered = new Symbolizer(style.hovered, rule.hovered);
		extended.source = rule.source;
		return extended;
	}
});

//--------------------------------------------------------------------------
function loadRuleFromObject(ruleObj){
	var condition = g_TrueNode;
	if( ruleObj.condition ){
		condition = $n2.styleRuleParser.parse(ruleObj.condition);
	};
	
	var rule = new StyleRule({
		condition: condition
		,source: ruleObj.condition
		,normal: ruleObj.normal ? ruleObj.normal : {}
		,selected: ruleObj.selected ? ruleObj.selected : {}
		,hovered: ruleObj.hovered ? ruleObj.hovered : {}
	});
	
	return rule;
};

//--------------------------------------------------------------------------
function loadRulesFromObject(arr){
	var rules = [];
	if( arr ){
		for(var i=0,e=arr.length; i<e; ++i){
			var ruleObj = arr[i];
			try {
				var rule = loadRuleFromObject(ruleObj);
				rules.push(rule);
			} catch(e) {
				$n2.log('Error trying to load style rule: '+e);
			};
		};
	};
	
	var styleRules = new StyleRules();
	for(var i=0,e=rules.length; i<e; ++i){
		var rule = rules[i];
		styleRules.addRule(rule);
	};
	
	return styleRules;
};

//--------------------------------------------------------------------------
$n2.styleRule = {
	loadRulesFromObject: loadRulesFromObject
};

})(nunaliit2);
