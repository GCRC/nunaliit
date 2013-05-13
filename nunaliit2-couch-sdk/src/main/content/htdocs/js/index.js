var _loc = function(str,args){ return $n2.loc(str,'nunaliit_demo',args); };

function main_init(config) {
	
	// Get module name from URL parameters
	var moduleName = $n2.url.getParamValue('module',null);
	if( !moduleName ){
		moduleName = 'module.demo';
	};
	$n2.log('module: '+moduleName);

	// Get module bounding box
	var bounds = null;
	var bboxParam = $n2.url.getParamValue('bbox',null);
	if( bboxParam ){
		var bbox = bboxParam.split(',');
		bounds = [];
		for(var i=0,e=bbox.length;i<e;++i){
			bounds.push( 1 * bbox[i] );
		};
		$n2.log('bbox: '+bboxParam);
	};

	var moduleDisplay = new $n2.couchModule.ModuleDisplay({
		moduleName: moduleName
		,config: config
		,titleName: 'title'
		,moduleTitleName: 'module_title'
		,sidePanelName: 'side'
		,filterPanelName: 'filters'
		,searchPanelName: 'searchInput'
		,navigationName: 'navigation'
		,navigationDoc: 'navigation.demo'
		,onSuccess: function(){
			config.start();
			
			if( bounds ) {
				config.directory.dispatchService.send('index.js',{
					type:'mapSetInitialExtent'
					,extent: bounds
					,srsName: 'EPSG:4326'
					,reset: true
				});
			};
		}
		,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
	});
	
};

jQuery().ready(function() {
	runConfiguration({
		configuredFunction: main_init
	});
});
