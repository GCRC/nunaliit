/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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
 ,DH = 'n2.display'
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
			this.dispatchService.register(DH,'displayIsTypeAvailable',f);
			this.dispatchService.register(DH,'displayRender',f);
		};
	},
	
	_handle: function(m, addr, dispatcher){
		if( 'displayIsTypeAvailable' === m.type ){
			if( $n2.couchDisplay 
			 && $n2.couchDisplay.HandleDisplayAvailableRequest ){
				$n2.couchDisplay.HandleDisplayAvailableRequest(m);
			};

			if( $n2.couchDisplayTiles 
			 && $n2.couchDisplayTiles.HandleDisplayAvailableRequest ){
				$n2.couchDisplayTiles.HandleDisplayAvailableRequest(m);
			};

			if( $n2.displayRibbon 
			 && $n2.displayRibbon.HandleDisplayAvailableRequest ){
				$n2.displayRibbon.HandleDisplayAvailableRequest(m);
			};

			if( $n2.displayRibbon2 
			 && $n2.displayRibbon2.HandleDisplayAvailableRequest ){
				$n2.displayRibbon2.HandleDisplayAvailableRequest(m);
			};

		} else if( 'displayRender' === m.type ) {
			if( $n2.couchDisplay 
			 && $n2.couchDisplay.HandleDisplayRenderRequest ){
				$n2.couchDisplay.HandleDisplayRenderRequest(m);
			};

			if( $n2.couchDisplayTiles 
			 && $n2.couchDisplayTiles.HandleDisplayRenderRequest ){
				$n2.couchDisplayTiles.HandleDisplayRenderRequest(m);
			};

			if( $n2.displayRibbon 
			 && $n2.displayRibbon.HandleDisplayRenderRequest ){
				$n2.displayRibbon.HandleDisplayRenderRequest(m);
			};

			if( $n2.displayRibbon2 
			 && $n2.displayRibbon2.HandleDisplayRenderRequest ){
				$n2.displayRibbon2.HandleDisplayRenderRequest(m);
			};
		};
	}
});

//--------------------------------------------------------------------------
$n2.display = {
	Service: Service
};

})(jQuery,nunaliit2);
