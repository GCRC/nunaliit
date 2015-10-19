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
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var DH = 'n2.displayRibbon';

// ===================================================================================

var Display = $n2.Class({
	
	options: null
	
	,documentSource: null
	
	,displayPanelName: null
	
	,currentFeature: null
	
	,createRelatedDocProcess: null
	
	,defaultSchema: null
	
	,displayRelatedInfoProcess: null
	
	,displayOnlyRelatedSchemas: null
	
	,displayBriefInRelatedInfo: null
	
	,restrictAddRelatedButtonToLoggedIn: null
	
	,restrictReplyButtonToLoggedIn: null
	
	,classDisplayFunctions: null
	
	,showService: null
	
	,uploadService: null
	
	,customService: null
	
	,authService: null
	
	,requestService: null
	
	,dispatchService: null
	
	,schemaRepository: null
	
	,initialize: function(opts_) {

		$('body').addClass('n2_display_format_ribbon');
		
		$n2.log('DisplayRibbon',this);
	}
});

//===================================================================================
function HandleDisplayAvailableRequest(m){
	if( m.displayType === 'ribbon' ){
		m.isAvailable = true;
	};
};

function HandleDisplayRenderRequest(m){
	if( m.displayType === 'ribbon' ){
		var options = {};
		if( m.displayOptions ){
			for(var key in m.displayOptions){
				options[key] = m.displayOptions[key];
			};
		};
		
		options.documentSource = m.config.documentSource;
		options.displayPanelName = m.displayId;
		options.showService = m.config.directory.showService;
		options.uploadService = m.config.directory.uploadService;
		options.createDocProcess = m.config.directory.createDocProcess;
		options.serviceDirectory = m.config.directory;
		
		var displayControl = new Display(options);

		m.onSuccess();
	};
};

//===================================================================================

// Exports
$n2.displayRibbon = {
	Display: Display
	,HandleDisplayAvailableRequest: HandleDisplayAvailableRequest
	,HandleDisplayRenderRequest: HandleDisplayRenderRequest
};

})(jQuery,nunaliit2);
