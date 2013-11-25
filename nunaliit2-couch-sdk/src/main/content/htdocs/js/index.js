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
	
	// Get srs (applies to bounding box)
	var srsName = 'EPSG:4326';
	var srsParam = $n2.url.getParamValue('srs',null);
	if( srsParam ){
		srsName = '' + srsParam;
		$n2.log('srs: '+srsName);
	};

	var moduleDisplay = new $n2.couchModule.ModuleDisplay({
		moduleName: moduleName
		,config: config
		,titleName: 'title'
		,moduleTitleName: 'module_title'
		,loginPanels: $('#login1,#login2')
		,contentName: 'content'
		,navigationName: 'navigation'
		,navigationDoc: 'navigation.demo'
		,languageSwitcherName: 'language_switcher'
		,helpButtonName: 'help_button'
		,onSuccess: function(){
			config.start();
			
			if( bounds ) {
				config.directory.dispatchService.send('index.js',{
					type:'mapSetInitialExtent'
					,extent: bounds
					,srsName: srsName
					,reset: true
				});
			};
		}
		,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
	});
	
};

jQuery().ready(function() {
	nunaliitConfigure({
		configuredFunction: main_init
	});
});
