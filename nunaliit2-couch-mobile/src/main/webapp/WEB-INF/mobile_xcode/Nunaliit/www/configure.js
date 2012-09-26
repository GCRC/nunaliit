var configurationAlreadyCalled = false;

function runConfiguration(mainFunction) {
	if( configurationAlreadyCalled ) return;
	
	configurationAlreadyCalled = true;
	
	init();
	
	function init(){
		var couchLocation = getCouchLocation();
		
		if( !couchLocation ) {
			// Wait for couch location
			wait();

		} else if( typeof(nunaliit2) === 'undefined'
		 || !nunaliit2 ) {
			// Wait for nunaliit2 to load
			wait();

		} else if( typeof(nunaliit2.mobile) === 'undefined'
			 || typeof(nunaliit2.mobile.BootStrapper) === 'undefined' ) {
			// Wait for mobile bootstrapper
			wait();

		} else {
			var bootStrapper = new nunaliit2.mobile.BootStrapper({
				listener: mainFunction
				,getCouchLocationFn: getCouchLocation
			});
		};
	};
	
	function wait(){
		window.setTimeout(init, 200);
	};
	
	function getCouchLocation() {
		if( typeof(window.couchLocation) === 'undefined' ) {
			return null;
		};
		
		if( !window.couchLocation ) {
			return null;
		};
		
		return window.couchLocation;
	};
};