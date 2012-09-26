// This function should probably be shared between all mobile
// applications
function runConfiguration(config, mainFn, reportFn) {
	if( typeof(nunaliit2) !== 'undefined' 
       && typeof(Mustache) !== 'undefined'
       && nunaliit2.couch ) {
		$n2 = nunaliit2;

		loaded = true;
		
		initCouchServer();
	} else {
	 	window.setTimeout(function(){runConfiguration(config, mainFn, reportFn);},200);
	};
	
	function initCouchServer() {
		reportFn('Initializing CouchDb server...');
	 	$n2.couch.initialize({
	    	pathToServer: '../../../'
	    	,onSuccess: n2Auth
			,onError: reportError
	 	});
	};
	
	function n2Auth() {
		reportFn('Initializing Authentication client...');
		$.NUNALIIT_AUTH.init({
			onSuccess: configure
			,onError: reportError
			,autoAnonymousLogin: false
		});
	};
	
	function configure() {
		reportFn('Set up configuration...');
		config.mobileDb = $n2.couch.getDb({dbUrl:'../../'});
		config.mobileDesign = config.mobileDb.getDesignDoc({ddName:'mobile'});
		config.searchServer = new $n2.couchSearch.SearchServer({
			designDoc: config.mobileDesign
			,db: config.mobileDb
		});
		
		reportFn('Schema preload...');
		if( viewUpdateIssueIsFixed ) {
			// This code does not work because the views
			// do not update
			$n2.schema.CouchSchemaConfigure({
				db: config.mobileDb
				,designDoc: config.mobileDesign
			});
			$n2.schema.CouchPreload({
				onSuccess: authenticate
				,onError: reportError
			});
		} else {
			reloadAllSchemas({
				db: config.mobileDb
				,onSuccess: authenticate
				,onError: reportError
			});						
		};
	};
	
	function authenticate() {
		var schemasByName = $n2.schema.DefaultRepository._getSchemaMap();
		$n2.log('$n2.schema.DefaultRepository',$n2.schema.DefaultRepository,schemasByName);
		for(var sn in schemasByName) {
			var s = schemasByName[sn];
			reportFn('Schema '+s.name+' root: '+s.isRootSchema);
		};
		reportFn('Authenticate...');
		$n2.couch.DefaultServer.getSession().login({
			name: 'admin'
			,password: 'admin'
			,onSuccess: callMain
			,onError: reportError
		});
	};
	
	function callMain() {
		reportFn('Starting main...');
		mainFn(config);
	};
	
	function reportError(err) {
		reportFn('Error during configuration: '+err);
	};
};
