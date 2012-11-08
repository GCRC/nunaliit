;(function($,$n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){
	
	config.directory.showService.options.preprocessDocument = function(doc) {
		
		return doc;
	};
	
	
	callback();
};

})(jQuery,nunaliit2);