/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: olkit.sound.isiuop.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
;(function($,$n2){

var errorNoSoundsReported = 0;

function defaultInstallSound(url,feature,options) {};

var HoverSoundService = $n2.Class({
	options: null
	
	,initialize: function(options_){
	}

	,handleFeatureHover: function(feature, opts_) {

		var options = $.extend({
			installSoundFn: defaultInstallSound
		},opts_);

		if( feature
		 && feature.attributes
		 && feature.attributes['feature_id']
		 && $.NUNALIIT_DBWEB  
		 ) {
			$.NUNALIIT_DBWEB.query({
				tableName: 'hover_sounds'
				,whereClauses: [
					$.NUNALIIT_DBWEB.formatWhereClause(
						'feature_id'
						,$.NUNALIIT_DBWEB.whereComparison_eq
						,feature.attributes['feature_id']
						)
				]
				,onSuccess: function(results){
					for(var loop=0; loop<results.length; ++loop) {
						var sound = results[loop];
						if( sound.filename ) {
							options.installSoundFn(sound.filename, feature, options_);
							break;
						}
					}
				}
				,onError: function(error) {
					if( !errorNoSoundsReported ) {
						alert("Error accessing database (sounds). Some information might be missing.");
						errorNoSoundsReported = 1;
					};
				}
			});
		};
	}
});	
	
$n2.isiuopSound = {
	HoverSoundService: HoverSoundService
};

// Install an instance as global access
$n2.hoverSoundService = new HoverSoundService();

})(jQuery,nunaliit2);