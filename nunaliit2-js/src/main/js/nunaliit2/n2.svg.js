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

var 
 _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); }
 ,DH = 'n2.svg'
 ,XMLNS = "http://www.w3.org/2000/svg"
 ;
 
//--------------------------------------------------------------------------
// Thanks to OpenLayers 2
var PredefinedGraphicsByName = {
     "star": [350,75, 379,161, 469,161, 397,215, 423,301, 350,250, 277,301,
             303,215, 231,161, 321,161, 350,75],
     "cross": [4,0, 6,0, 6,4, 10,4, 10,6, 6,6, 6,10, 4,10, 4,6, 0,6, 0,4, 4,4,
             4,0],
     "x": [0,0, 25,0, 50,35, 75,0, 100,0, 65,50, 100,100, 75,100, 50,65, 25,100, 0,100, 35,50, 0,0],
     "square": [0,0, 0,1, 1,1, 1,0, 0,0],
     "triangle": [0,10, 10,10, 5,0, 0,10]
 };
 

//--------------------------------------------------------------------------
var Renderer = $n2.Class({
	
	svgElemId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			svgElem: null
			,svgElemId: null
		},opts_);
		
		this.svgElemId = opts.svgElemId;
		if( !this.svgElemId && opts.svgElem ){
			this.svgElemId = $n2.utils.getElementIdentifier(opts.svgElem);
		};
		if( !this.svgElemId ){
			throw 'SVG element must be provided';
		};
	},
	
	_getSvgElem: function(){
		return document.getElementById(this.svgElemId);
	},
	
	_getDefsElem: function(){
		var defsElem = null;
		
		var svgElem = this._getSvgElem();
		var childNodeList = svgElem.childNodes;
		for(var i=0,e=childNodeList.length; i<e; ++i){
			var child = childNodeList.item(i);
			if( 'defs' === child.localName.toLowerCase() ){
				defsElem = child;
			};
		};
		
		if( null === defsElem ){
			defsElem = this._createNode('defs');
			svgElem.appendChild(defsElem);
		};
		
		return defsElem;
	},
	
    _importGraphic: function (graphicName)  {
    	var defsElem = this._getDefsElem();

        var graphicId = this.svgElemId + "-grpahic-" + graphicName;
        
        // Try to get by id
        var graphicNode = document.getElementById(graphicId);
        if( !graphicNode ) {
            var graphic = PredefinedGraphicsByName[graphicName];
            if (!graphic) {
                throw ('' + graphicName + ' is not a valid graphic name');
            }

            var graphicNode = this._createNode('symbol',graphicId);
            var node = this._createNode('polygon');
            graphicNode.appendChild(node);
            var maxx = null
             ,minx = null
             ,maxy = null
             ,miny = null
             ,points = []
             ,x,y;

            for (var i=0; i<graphic.length; i=i+2) {
                x = graphic[i];
                y = graphic[i+1];
                
                minx = (minx == null) ? x : Math.min(minx, x);
                maxx = (maxx == null) ? x : Math.max(maxx, x);
                miny = (miny == null) ? y : Math.min(miny, y);
                maxy = (maxy == null) ? y : Math.max(maxy, y);
            }
            
            var width = maxx - minx;
            var height = maxy - miny;
            var longestDim = width > height ? width : height;
            var factor = 2 / longestDim;
            var midX = (minx + maxx) / 2;
            var midY = (miny + maxy) / 2;

            for (var i=0; i<graphic.length; i=i+2) {
                x = (graphic[i] - midX) * factor;
                y = (graphic[i+1] - midY) * factor;
                
                if( i != 0 ){
                	points.push(' ');
                };
                points.push(x, ',', y);
            }
            
            node.setAttributeNS(null, 'points', points.join(''));
            
            graphicNode.setAttributeNS(null, 'viewBox', '-3 -3 6 6');
            
            defsElem.appendChild(graphicNode);
        };
        
        return graphicNode;
    },
	
	_createNode: function(name, id){
        var node = document.createElementNS(XMLNS, name);
        if (id) {
            node.setAttributeNS(null, "id", id);
        }
        return node;    
	}
});

//--------------------------------------------------------------------------
$n2.svg = {
	Renderer: Renderer
};

})(nunaliit2);
