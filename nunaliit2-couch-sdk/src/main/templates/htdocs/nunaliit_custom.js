;(function($,$n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){
	
	config.directory.showService.options.preprocessDocument = function(doc) {
		
		return doc;
	};
	
	// Dispatch service
	if( config.directory.dispatchService ){
		var dispatchService = config.directory.dispatchService;
		
		// Handler called when atlas starts
		dispatchService.register('demo','start',function(m){
		});
		
		// Handler called when the module content is loaded
		dispatchService.register('demo','loadedModuleContent',function(m){
		});
	};
	
	callback();
};

})(jQuery,nunaliit2);
