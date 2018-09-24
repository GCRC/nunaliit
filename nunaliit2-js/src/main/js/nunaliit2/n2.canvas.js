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
 ,DH = 'n2.canvas'
 ;
 
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
			this.dispatchService.register(DH,'canvasIsTypeAvailable',f);
			this.dispatchService.register(DH,'canvasDisplay',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'canvasIsTypeAvailable' === m.type ){
			if( $n2.canvasForceGraph 
			 && $n2.canvasForceGraph.HandleCanvasAvailableRequest ){
				$n2.canvasForceGraph.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasRadial 
			 && $n2.canvasRadial.HandleCanvasAvailableRequest ){
				$n2.canvasRadial.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasRadialTree 
			 && $n2.canvasRadialTree.HandleCanvasAvailableRequest ){
				$n2.canvasRadialTree.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasCollapsibleRadialTree 
			 && $n2.canvasCollapsibleRadialTree.HandleCanvasAvailableRequest ){
				$n2.canvasCollapsibleRadialTree.HandleCanvasAvailableRequest(m);
			};
			
			if( $n2.canvasGrid 
			 && $n2.canvasGrid.HandleCanvasAvailableRequest ){
				$n2.canvasGrid.HandleCanvasAvailableRequest(m);
			};
					
			if( $n2.canvasPack 
			 && $n2.canvasPack.HandleCanvasAvailableRequest ){
				$n2.canvasPack.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasTree 
			 && $n2.canvasTree.HandleCanvasAvailableRequest ){
				$n2.canvasTree.HandleCanvasAvailableRequest(m);
			};
			
			if( $n2.canvasVerticalTimeline 
			 && $n2.canvasVerticalTimeline.HandleCanvasAvailableRequest ){
				$n2.canvasVerticalTimeline.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasCustomSvg 
			 && $n2.canvasCustomSvg.HandleCanvasAvailableRequest ){
				$n2.canvasCustomSvg.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasCustomHtml 
			 && $n2.canvasCustomHtml.HandleCanvasAvailableRequest ){
				$n2.canvasCustomHtml.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasReferenceBrowser 
			 && $n2.canvasReferenceBrowser.HandleCanvasAvailableRequest ){
				$n2.canvasReferenceBrowser.HandleCanvasAvailableRequest(m);
			};

			if( $n2.canvasTable 
			 && $n2.canvasTable.HandleCanvasAvailableRequest ){
				$n2.canvasTable.HandleCanvasAvailableRequest(m);
			};

		} else if( 'canvasDisplay' === m.type ) {
			if( $n2.canvasForceGraph 
			 && $n2.canvasForceGraph.HandleCanvasDisplayRequest ){
				$n2.canvasForceGraph.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasRadial 
			 && $n2.canvasRadial.HandleCanvasDisplayRequest ){
				$n2.canvasRadial.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasRadialTree 
			 && $n2.canvasRadialTree.HandleCanvasDisplayRequest ){
				$n2.canvasRadialTree.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasCollapsibleRadialTree 
			 && $n2.canvasCollapsibleRadialTree.HandleCanvasDisplayRequest ){
				$n2.canvasCollapsibleRadialTree.HandleCanvasDisplayRequest(m);
			};
			
			if( $n2.canvasGrid 
			 && $n2.canvasGrid.HandleCanvasDisplayRequest ){
				$n2.canvasGrid.HandleCanvasDisplayRequest(m);
			};
					
			if( $n2.canvasPack 
			 && $n2.canvasPack.HandleCanvasDisplayRequest ){
				$n2.canvasPack.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasTree 
			 && $n2.canvasTree.HandleCanvasDisplayRequest ){
				$n2.canvasTree.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasCustomSvg 
			 && $n2.canvasCustomSvg.HandleCanvasDisplayRequest ){
				$n2.canvasCustomSvg.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasCustomHtml 
			 && $n2.canvasCustomHtml.HandleCanvasDisplayRequest ){
				$n2.canvasCustomHtml.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasReferenceBrowser 
			 && $n2.canvasReferenceBrowser.HandleCanvasDisplayRequest ){
				$n2.canvasReferenceBrowser.HandleCanvasDisplayRequest(m);
			};

			if( $n2.canvasTable 
			 && $n2.canvasTable.HandleCanvasDisplayRequest ){
				$n2.canvasTable.HandleCanvasDisplayRequest(m);
			};	
			
			if( $n2.canvasVerticalTimeline 
			&& $n2.canvasVerticalTimeline.HandleCanvasDisplayRequest ){
				$n2.canvasVerticalTimeline.HandleCanvasDisplayRequest(m);
			};
		};
	}
});

//--------------------------------------------------------------------------
$n2.canvas = {
	Service: Service
};

})(jQuery,nunaliit2);
