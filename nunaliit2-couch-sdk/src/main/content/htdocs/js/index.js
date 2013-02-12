var _loc = function(str,args){ return $n2.loc(str,'generic',args); };

function main_init(config) {
	
	// Get module name from URL parameters
	var moduleName = $n2.url.getParamValue('module',null);
	if( !moduleName ){
		moduleName = 'generic.module:default';
	};
	$n2.log('module: '+moduleName);

	var moduleDisplay = new $n2.couchModule.ModuleDisplay({
		moduleName: moduleName
		,config: config
		,titleName: 'title'
		,sidePanelName: 'side'
		,filterPanelName: 'filters'
		,searchPanelName: 'searchInput'
		,onSuccess: function(){
			config.start();
		}
		,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
	});
	
};

jQuery().ready(function() {
	runConfiguration({
		configuredFunction: main_init
	});
});
