;(function($,$n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){
	
	config.directory.showService.options.preprocessDocument = function(doc) {
		
		return doc;
	};

	// Custom service
	if( config.directory.customService ){
		var customService = config.directory.customService;

		// Default table of content
		customService.setOption('defaultNavigationIdentifier','navigation.demo');
		
		// Default module
		customService.setOption('defaultModuleIdentifier','module.demo');
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