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
		applies: {
			circle: true
			,line: false
			,path: true
			,text: true
			,g: true
		}
	}
	,'fill-opacity': {
		applies: {
			circle: true
			,line: false
			,path: true
			,text: true
			,g: true
		}
	}
	,'stroke': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: true
			,g: true
		}
	}
	,'stroke-width': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: true
			,g: true
		}
	}
	,'stroke-opacity': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: true
			,g: true
		}
	}
	,'stroke-linecap': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: false
			,g: true
		}
	}
	,'stroke-dasharray': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: false
			,g: true
		}
	}
	,'r': {
		applies: {
			circle: true
			,line: false
			,path: false
			,text: false
			,g: true
		}
	}
	,'pointer-events': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: true
			,g: true
		}
	}
	,'cursor': {
		applies: {
			circle: true
			,line: true
			,path: true
			,text: true
			,g: true
		}
	}
	,'label': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'font-family': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'font-size': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'font-style': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'font-weight': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'text-anchor': {
		applies: {
			circle: false
			,line: false
			,path: false
			,text: true
			,g: true
		}
	}
	,'marker-start': {
		applies: {
			circle: false
			,line: false
			,path: true
			,text: false
			,g: true
		}
	}
	,'marker-end': {
		applies: {
			circle: false
			,line: false
			,path: true
			,text: false
			,g: true
		}
	}
	,'marker-mid': {
		applies: {
			circle: false
			,line: false
			,path: true
			,text: false
			,g: true
		}
	}
};

//--------------------------------------------------------------------------
var SymbolTranslationMap = {
	'fillColor': 'fill'	
	,'fillOpacity': 'fill-opacity'
	,'strokeColor': 'stroke'
	,'strokeWidth': 'stroke-width'
	,'strokeOpacity': 'stroke-opacity'
	,'strokeLinecap': 'stroke-linecap'
	,'strokeDashstyle': 'stroke-dasharray'
	,'pointRadius': 'r'
	,'pointEvents': 'pointer-events'
	,'fontColor': 'color'
	,'font-color': 'color'
	,'fontFamily': 'font-family'
	,'fontSize': 'font-size'
	,'fontWeight': 'font-weight'
};


//--------------------------------------------------------------------------
var Symbolizer = $n2.Class({
	
	symbols: null,
	
	initialize: function(){
		
		this.symbols = {};
		this.id = null;
		this._n2Symbolizer = true;
		
		for(var i=0,e=arguments.length; i<e; ++i){
			var otherSymbolizer = arguments[i];
			this.extendWith(otherSymbolizer);
		};
	},
	
	extendWith: function(symbolizer){
		if( symbolizer ){
			if( symbolizer._n2Symbolizer ){
				// From another instance of Symbolizer
				var att = symbolizer.symbols;
				for(var key in att){
					var value = att[key];
					this.symbols[key] = value;
				};
			} else {
				// From a user supplied dictionary. Must translate
				for(var key in symbolizer){
					var symbolValue = symbolizer[key];

					// Translate key, if needed
					if( SymbolTranslationMap[key] ){
						key = SymbolTranslationMap[key];
					};

					// Parse value if it starts with a '='
					if( symbolValue 
					 && symbolValue.length > 0 
					 && symbolValue[0] === '=' ){
						try {
							// This should return an object with a function getValue(ctxt)
							symbolValue = $n2.styleRuleParser.parse(symbolValue.substr(1));
						} catch(e) {
							symbolValue = e;
						};
					};

					if( 'opacity' === key ){
						this.symbols['fill-opacity'] = symbolValue;
						this.symbols['stroke-opacity'] = symbolValue;
					} else {
						this.symbols[key] = symbolValue;
					};
				};
			};
		};
	},
	
	getSymbolValue: function(symbolName, ctxt){
		var value = this.symbols[symbolName];
		
		if( typeof value === 'object'
		 && typeof value.getValue === 'function' ){
			value = value.getValue(ctxt);
		} else if( typeof value === 'object'
		 && 'localized' === value.nunaliit_type){
			value = _loc(value);
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
			if( info.applies[nodeName] ){
				var value = this.getSymbolValue(name,ctxt);
				
				if( 'label' === name ){
					if( value === null ){
						// ignore
					} else if( typeof value === 'object' 
					 && 'localized' === value.nunaliit_type ){
						value = _loc( value );
					} else if( typeof value === 'undefined' ){
						// ignore
					} else if( typeof value !== 'string' ){
						value = '' + value;
					};
					
					// empty()
					while ( svgDomElem.firstChild ) {
						svgDomElem.removeChild( svgDomElem.firstChild );
					};

					if( value ){
						// text(value)
						var textNode = svgDomElem.ownerDocument.createTextNode(_loc(value));
						svgDomElem.appendChild(textNode);
					};
					
				} else if( typeof value !== 'undefined' ){
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
	},
	
	adjustHtmlElement: function(htmlDomElement,ctxt){

		var cssArr = [];
		
		this.forEachSymbol(function(name,value){
			if( 'display' === name ){
				if( 'none' === value ){
					cssArr.push('display:none');
				};
				
			} else {
				cssArr.push(name+':'+value);
			};
		},ctxt);

		var cssString = cssArr.join(';');
		htmlDomElement.setAttribute("style", cssString);
	}
});

//--------------------------------------------------------------------------
var Style = $n2.Class({
	
	symbolizersByLabel: null,
	
	id: null,
	
	label: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			id: undefined
			,basicStyle: undefined
			,extendWithRule: undefined
		},opts_);
		
		this.symbolizersByLabel = {};
		this.id = opts.id;
		this.label = null;
		
		if( opts.extendWithRule ){
			this.label = opts.extendWithRule.label;
		};
		
		if( opts.basicStyle && opts.extendWithRule ){
			this.symbolizersByLabel.normal = new Symbolizer(
				opts.basicStyle.symbolizersByLabel.normal, 
				opts.extendWithRule.normal
			);
			this.symbolizersByLabel.selected = new Symbolizer(
				opts.basicStyle.symbolizersByLabel.selected, 
				opts.extendWithRule.selected
			);
			this.symbolizersByLabel.hovered = new Symbolizer(
				opts.basicStyle.symbolizersByLabel.hovered, 
				opts.extendWithRule.hovered
			);
			this.symbolizersByLabel.found = new Symbolizer(
				opts.basicStyle.symbolizersByLabel.found, 
				opts.extendWithRule.found
			);

		} else if( opts.basicStyle ){
			this.symbolizersByLabel.normal = opts.basicStyle.symbolizersByLabel.normal;
			this.symbolizersByLabel.selected = opts.basicStyle.symbolizersByLabel.selected;
			this.symbolizersByLabel.hovered = opts.basicStyle.symbolizersByLabel.hovered;
			this.symbolizersByLabel.found = opts.basicStyle.symbolizersByLabel.found;

		} else if( opts.extendWithRule ){
			this.symbolizersByLabel.normal = opts.extendWithRule.normal;
			this.symbolizersByLabel.selected = opts.extendWithRule.selected;
			this.symbolizersByLabel.hovered = opts.extendWithRule.hovered;
			this.symbolizersByLabel.found = opts.extendWithRule.found;

		} else {
			this.symbolizersByLabel.normal = new Symbolizer();
			this.symbolizersByLabel.selected = new Symbolizer();
			this.symbolizersByLabel.hovered = new Symbolizer();
			this.symbolizersByLabel.found = new Symbolizer();
		};
	},

	getSymbolizer: function(ctxt){
		var label = 'normal';
		if( ctxt.n2_selected || ctxt.n2_derived_selected ){
			label = '$selected';
			if( ctxt.n2_found ){
				label = '$selectedFound';
				if( ctxt.n2_hovered || ctxt.n2_derived_hovered ){
					label = '$selectedFoundHovered';
				};
			} else if( ctxt.n2_hovered || ctxt.n2_derived_hovered ){
				label = '$selectedHovered';
			};
		} else if( ctxt.n2_found ){
			label = '$found';
			if( ctxt.n2_hovered || ctxt.n2_derived_hovered ){
				label = '$foundHovered';
			};
		} else if( ctxt.n2_hovered || ctxt.n2_derived_hovered ){
			label = '$hovered';
		};
		
		return this._getSymbolizerFromLabel(label);
	},

	_getSymbolizerFromLabel: function(label){
		var symbolizer = this.symbolizersByLabel[label];
		
		if( !symbolizer ){
			// Need to compute it
			if( 'normal' === label ){
				symbolizer = new Symbolizer();
				
			} else if( '$hovered' === label ){
				// $hovered = normal + hovered
				var s1 = this._getSymbolizerFromLabel('normal');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.hovered);
				
			} else if( '$found' === label ){
				// $found = normal + found
				var s1 = this._getSymbolizerFromLabel('normal');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.found);
				
			} else if( '$selected' === label ){
				// $selected = normal + selected
				var s1 = this._getSymbolizerFromLabel('normal');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.selected);
				
			} else if( '$selectedFound' === label ){
				// $selectedFound = $selected + found
				var s1 = this._getSymbolizerFromLabel('$selected');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.found);
				
			} else if( '$selectedHovered' === label ){
				// $selectedHovered = $selected + hovered
				var s1 = this._getSymbolizerFromLabel('$selected');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.hovered);
				
			} else if( '$foundHovered' === label ){
				// $foundHovered = $found + hovered
				var s1 = this._getSymbolizerFromLabel('$found');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.hovered);
				
			} else if( '$selectedFoundHovered' === label ){
				// $selectedFoundHovered = $selectedFound + hovered
				var s1 = this._getSymbolizerFromLabel('$selectedFound');
				symbolizer = new Symbolizer(s1, this.symbolizersByLabel.hovered);
			};
			
			// Save computed symbolizer for next call
			if( symbolizer ){
				this.symbolizersByLabel[label] = symbolizer;
			};
		};
		
		return symbolizer;
	}
});

//--------------------------------------------------------------------------
var StyleRule = $n2.Class({
	
	condition: null,
	
	label: null,

	source: null,
	
	normal: null,
	
	selected: null,

	found: null,
	
	hovered: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			condition: null
			,label: null
			,source: null
			,normal: null
			,selected: null
			,found: null
			,hovered: null
		},opts_);
		
		this.condition = opts.condition;
		this.label = opts.label;
		this.source = opts.source;
		this.normal = new Symbolizer(opts.normal);
		this.selected = new Symbolizer(opts.selected);
		this.found = new Symbolizer(opts.found);
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
		var opts = $n2.extend({
			skipDefaults: false
		},opts_);
		
		this.rules = [];
		this.cache = {
			style: new Style({
				id: ''
			})
		};

		if( !opts.skipDefaults ) {
			var rule = loadRuleFromObject({
				condition: 'true'
				,normal: {
					'fillColor': '#ffffff'
					,'strokeColor': '#ee9999'
					,'strokeWidth': 2
					,'fillOpacity': 1
					,'strokeOpacity': 1
					,'strokeLinecap': 'round'
					,pointRadius: 6
					,pointerEvents: 'visiblePainted'
				}
				,selected: {
					'strokeColor': '#ff2200'
				}
				,found: {
					'strokeColor': '#00ffff'
					,'fillColor': '#00ffff'
				}
				,hovered: {
					'fillColor': '#0000ff'
				}
			});
			this.addRule(rule);

			var rule = loadRuleFromObject({
				condition: 'isLine()'
				,normal: {
					'fillColor': 'none'
				}
				,selected: {
					'fillColor': 'none'
				}
				,hovered:{
					'strokeColor': '#0000ff'
					,'fillColor': 'none'
				}
				,found: {
					'strokeColor': '#00ffff'
					,'fillColor': 'none'
				}
			});
			this.addRule(rule);
		};
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
	 *    ,n2_elem: HTML element, SVG element, undefined
	 * }
	 */
	getSymbolizer: function(ctxt){
		var style = this.getStyle(ctxt);
		var symbolizer = style.getSymbolizer(ctxt);
		return symbolizer;
	},

	getStyle: function(ctxt){
		var stylePath = [];
		var current = this.cache;
		for(var i=0,e=this.rules.length; i<e; ++i){
			var rule = this.rules[i];
			if( rule.isValidForContext(ctxt) ){
				stylePath.push(''+i);
				if( !current[i] ){
					var style = new Style({
						id: stylePath.join('+')
						,basicStyle: current.style
						,extendWithRule: rule
					});
					current[i] = {};
					current[i].style = style;
				};
				current = current[i];
			};
		};
		return current.style;
	}
});

//--------------------------------------------------------------------------
function loadRuleFromObject(ruleObj){
	var condition = g_TrueNode;
	if( ruleObj.condition ){
		condition = $n2.styleRuleParser.parse(ruleObj.condition);
	};
	
	function parseSymbolizer(rule) {
        if (!rule) return {};

        var parsed = $n2.extend({}, rule);

        // If icon is provided, set it as externalGraphic
        if (rule.iconSrc) {
            parsed.externalGraphic = rule.iconSrc;
            parsed.graphicWidth = rule.width || 24;
            parsed.graphicHeight = rule.height || 24;
        }

        return parsed;
    }
	
	var rule = new StyleRule({
        condition: condition,
        label: ruleObj.label,
        source: ruleObj.condition,
        normal: parseSymbolizer(ruleObj.normal),
        selected: parseSymbolizer(ruleObj.selected),
        found: parseSymbolizer(ruleObj.found),
        hovered: parseSymbolizer(ruleObj.hovered),
    });
	
	return rule;
};

//--------------------------------------------------------------------------
function loadRulesFromObject(arr, opts_){
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
	
	var styleRules = new StyleRules(opts_);
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
