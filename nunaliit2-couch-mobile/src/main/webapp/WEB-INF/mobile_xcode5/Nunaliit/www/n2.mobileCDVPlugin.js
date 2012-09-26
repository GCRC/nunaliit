;(function($n2){

var dummyFn = function(){};

var CDVPluginNunaliit = function() {
	this.callbackMap = {};
	this.callbackIdx = 0;
};

CDVPluginNunaliit.prototype.restartCouchDb = function(options) {
    
    var request = {};
    var onSuccess = dummyFn;
    var onError = dummyFn;
    
    // Process options
    for(var key in options) {
		var value = options[key];
		
		if( key === 'onSuccess' && typeof(value) === 'function' ) {
			onSuccess = value;

		} else if( key === 'onError' && typeof(value) === 'function' ) {
			onError = value;
			
		} else if( typeof(value) !== 'function' ){
		   // Pass these options to request
		   request[key] = value;
		};
    };

	// Prepare callbacks    
    var key = 'f' + this.callbackIdx++;
    this.callbackMap[key] = {
        success: function(result) {
        	if( result.error ) {
        		onError(result.error);
        	} else {
            	onSuccess(result);
            };
            delete this.callbackMap[key]
        },
        failure: function(result) {
            onError(result);
            delete this.callbackMap[key]
        }
    }
    var callback = 'window.plugins.CDVPluginNunaliit.callbackMap.' + key;
    return cordova.exec(
    	'CDVPluginNunaliit.restartCouchDb'
    	,callback + '.success'
    	,callback + '.failure'
    	,request
    	);
}

CDVPluginNunaliit.prototype.couchBaseInfo = function(options) {
    
    var request = {};
    var onSuccess = dummyFn;
    var onError = dummyFn;
    
    // Process options
    for(var key in options) {
		var value = options[key];
		
		if( key === 'onSuccess' && typeof(value) === 'function' ) {
			onSuccess = value;

		} else if( key === 'onError' && typeof(value) === 'function' ) {
			onError = value;
			
		} else if( typeof(value) !== 'function' ){
		   // Pass these options to request
		   request[key] = value;
		};
    };

	// Prepare callbacks    
    var key = 'f' + this.callbackIdx++;
    this.callbackMap[key] = {
        success: function(result) {
        	if( result.error ) {
        		onError(result.error);
        	} else {
            	onSuccess(result);
            };
            delete this.callbackMap[key]
        },
        failure: function(result) {
            onError(result);
            delete this.callbackMap[key]
        }
    }
    var callback = 'window.plugins.CDVPluginNunaliit.callbackMap.' + key;
    return cordova.exec(
    	'CDVPluginNunaliit.couchBaseInfo'
    	,callback + '.success'
    	,callback + '.failure'
    	,request
    	);
}

cordova.addConstructor(function()  {
    if(!window.plugins) {
        window.plugins = {};
    }
    window.plugins.CDVPluginNunaliit = new CDVPluginNunaliit();
});

})(nunaliit2);