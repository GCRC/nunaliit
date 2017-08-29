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



;(function($,$n2){
"use strict";

/* 
 * ------------------------------------------------------------------------------
 * Description: Atlas utility that detects if an input field value is empty or not.
 * When the input value is not empty, an input_detected class is added to the element.
 * ------------------------------------------------------------------------------
 */
var InputChangeDetector = $n2.Class('InputChangeDetector', {
	
	disable: null, 
	
	initialize: function(opts_){

		var opts = $n2.extend({
			config: null
			,disable: false
			,options: null
		},opts_);
		
		var _this = this;
		
		if( opts.disable && typeof opts.disable === 'boolean' ){
			this.disable = opts.disable;
		};		
		
		if ( !this.disable ){
			$('body').addClass('n2_input_change_detector');
			this.startDetector();
		};
	},
	
	startDetector: function(){
		
		$('body').change(function(){
			$(this).find('input').each(function(){
				var value = $(this).val();

				if( value !== '' && !$(this).hasClass('input_detected') ){
					$(this).addClass('input_detected');
	
				} else if( value === '' && $(this).hasClass('input_detected') ){
					$(this).removeClass('input_detected');
				};
			});
		});
	}
});

//--------------------------------------------------------------------------
function HandleUtilityCreateRequests(m, addr, dispatcher){
	if( 'inputChangeDetector' === m.utilityType ){
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
		
        new InputChangeDetector(options);
        
        m.created = true;
	};
};

//--------------------------------------------------------------------------
$n2.utilitiesChangeDetectors = {
	HandleUtilityCreateRequests: HandleUtilityCreateRequests
	,InputChangeDetector: InputChangeDetector
};

})(jQuery,nunaliit2);
