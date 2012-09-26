/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.progress.js 8165 2012-05-31 13:14:37Z jpfiset $
*/

/*
 * @requires n2.utils.js
 * @requires n2.class.js
 */
;(function($,$n2){

// Localization
var _loc = function(str){ return $n2.loc(str,'nunaliit2'); };

var ProgressKeyCache = $n2.Class({
	
	options: null
	
	,progressKeyCache: null
	
	,initialize: function(options_) {
		this.options = options_;
		
		this.progressKeyCache = [];
	}

	,getKey: function(callback) {
		var key = this.progressKeyCache.shift();
		if( key ) {
			callback(key);
		} else {
			this.refresh(callback);
		}
	}
	
	/*
	 * This function calls the progress servlet to get a set of 
	 * unique keys for tracking progress of various activities. This
	 * function does not return anything. Instead, it is an 
	 * asynchronous function that performs a callback when keys
	 * are available. The callback should be in the form of:
	 *    function keyCallback(key) { ... };
	 * where <key> is one unique key.
	 */
	,refresh: function(callback) {
		var cache = this;
		
		$.ajax({
	    	url: this.options.url + 'getIds'
	    	,type: 'get'
	    	,async: true
	    	,data: { count: 20 }
	    	,dataType: 'json'
	    	,success: function(res) {
	    		if( res && res.progressIds ) {
    				var key;
    				while( key = res.progressIds.shift() ) {
    					cache.progressKeyCache.push(key);
    				};

    				var id = cache.progressKeyCache.shift();
    				if( id ) callback(id);

	    		} else {
	    			cache.options.onError( _loc('Error occurred with progress service') );
	    			$n2.log('Progress service did not return any results');
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
				cache.options.onError( _loc('Error occurred with progress service') );
    			$n2.log('Progress service returned error',textStatus, errorThrown);
	    	}
		});
	}
});

var nextProgressTrackerId = 0;

var ProgressTrackerDefaultOptions = {
	progressKey: null
	,onStart: function(tracker){}
	,onUpdate: function(tracker){}
	,onComplete: function(tracker){}
	,onRemove: function(tracker){}
};

var ProgressTracker = $n2.Class({
	
	options: null
	
	,id: null
	
	,progressServer: null
	
	,progressKey: null

	,startSent: false

	,completedSent: false
	
	,info: {
		count: 0
		,total: 0
		,completed: false
	}
	
	,initialize: function(progressServer, options_) {
		this.progressServer = progressServer;
		this.options = options_;
		
		this.id = 'progressTracker' + nextProgressTrackerId;
		++nextProgressTrackerId;
	}

	,getId: function() {
		return this.id;
	}

	,getProgressKey: function() {
		return this.options.progressKey;
	}
	
	,cancel: function() {
		this.progressServer._unregisterProgressTracker(this);
	}
	
	,getTotal: function() {
		return this.info.total;
	}
	
	,getCurrent: function() {
		return this.info.current;
	}
	
	,isCompleted: function() {
		return this.info.completed;
	}
	
	,_update: function(info) {
		this.info = info;
		
		if( this.completedSent ) return;
			
		if( false == this.startSent ) {
			this.options.onStart(this);
			this.startSent = true;
		}

		this.options.onUpdate(this);
		
		if( info.completed ) {
			this.options.onComplete(this);
			this.completedSent = true;
		}
	}
});


var ProgressServerDefaultOptions = {
	url: null
	,pollingIntervalInMs: 750
	,onError: function(str){ $n2.reportError(str); }
};

var ProgressServer = $n2.Class({
	
	options: null
	
	,progressKeyCache: null
	
	,progressTrackers: null
	
	,pollingInProgress: false
	
	,initialize: function(options_) {
		this.options = $n2.extend({},ProgressServerDefaultOptions,options_);
		this.progressKeyCache = new ProgressKeyCache(this.options);
		
		this.progressTrackers = {};
	}

	/*
	 * This function is used to get a unique progress key. Progress
	 * keys are given by the progress servlet, are unique and used
	 * to track the progress of activities via the servlet. Other
	 * services, such as file upload, use this service.
	 * This is an asynchronous function and it does not return 
	 * anything. Instead, it performs a callback with the requested
	 * key when one is available. The callback should be in the form of:
	 *    function keyCallback(key) { ... };
	 * where <key> is one unique key.
	 */
	,requestProgressKey: function(callback) {
		this.progressKeyCache.getKey(callback);
	}
	
	,createProgressTracker: function(options_) {
		var opts = $n2.extend({},ProgressTrackerDefaultOptions,options_);
		if( ! opts.progressKey ) {
			return null;
		}
		
		var progressTracker = new ProgressTracker(this, opts);
		
		this._registerProgressTracker(progressTracker);
		
		return progressTracker;
	}
	
	,_registerProgressTracker: function(progressTracker) {
		var progressKey = progressTracker.getProgressKey();
		var progressTrackerId = progressTracker.getId();
		
		var keyTrackers = this.progressTrackers[progressKey];
		if( !keyTrackers ) {
			keyTrackers = {};
			this.progressTrackers[progressKey] = keyTrackers;
		}
		
		var tracker = keyTrackers[progressTrackerId];
		if( !tracker ) {
			keyTrackers[progressTrackerId] = progressTracker;
		}
		
		this._initiatePolling();
	}
	
	,_unregisterProgressTracker: function(progressTracker) {
		var progressKey = progressTracker.getProgressKey();
		var progressTrackerId = progressTracker.getId();
		
		var keyTrackers = this.progressTrackers[progressKey];
		if( !keyTrackers ) {
			// Nothing to do
			return;
		}
		
		var tracker = keyTrackers[progressTrackerId];
		if( tracker ) {
			delete keyTrackers[progressTrackerId];
		}
		
		// Count number of trackers left
		var count = 0;
		for(var trackerId in keyTrackers) {
			++count;
		};
		
		if( count < 1 ) {
			delete this.progressTrackers[progressKey];
		};
	}
	
	,_initiatePolling: function() {
		if( this.pollingInProgress ) return;
		
		// Accumulate keys
		var keys = [];
		for(var key in this.progressTrackers) {
			keys.push(key);
		}
		
		if( keys.length < 1 ) return;
		
		// Make request
		var server = this;
		$.ajax({
	    	url: this.options.url + 'getProgresses'
	    	,type: 'get'
	    	,async: true
			,traditional: true
	    	,data: { progressId: keys }
	    	,dataType: 'json'
	    	,success: function(data) {
	    		if( server._processProgressResults(data) ) {
	    			setTimeout(function(){ server._initiatePolling(); }, server.options.pollingIntervalInMs);
	    		} else {
	    			server.pollingInProgress = false;
	    		};
	    	}
	    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
    			server.pollingInProgress = false;
				server.options.onError( _loc('Error occurred with progress service') );
    			$n2.log('Progress service returned error on getProgresses',textStatus, errorThrown);
	    	}
		});
	}
	
	// Returns true if polling should be continued
	,_processProgressResults: function(data) {
		//$n2.log('_processProgressResults',data);
		
		var trackingInProgress = false;
		
		if( data && data.results ) {
			// Update all tracked activities
			var trackersToUnregister = [];
			var reportedKeys = {};
			for(var i=0,e=data.results.length; i<e; ++i) {
				var info = data.results[i];
				var key = info.id;
				
				// Remember which keys were reported
				reportedKeys[key] = info;
				
				var trackers = this.progressTrackers[key];
				if( trackers ) {
					for(var trackerId in trackers) {
						var tracker = trackers[trackerId];
						if( tracker ) {
							tracker._update(info);
							if( info.completed ) {
								trackersToUnregister.push(tracker);
							} else {
								trackingInProgress = true;
							};
						};
					};
				};
			};

			// Forget all trackers that are done
			for(var i=0,e=trackersToUnregister.length; i<e; ++i) {
				var tracker = trackersToUnregister[i];
				this._unregisterProgressTracker(tracker);
			};
			
			// Check end condition. If there is no tracking left, it
			// is possible that a new tracker was added during the last request
			if( !trackingInProgress ) {
				for(var key in this.progressTrackers) {
					var trackers = this.progressTrackers[key];
					if( trackers ) {
						for(var trackerId in trackers) {
							if( !reportedKeys[key] ) {
								// This is a new tracker since last call
								trackingInProgress = true;
							}
						};
					};
				};
			};
		};
		
		return trackingInProgress;
	}

});
	
$n2.progress = {
	ProgressServer: ProgressServer
	
};

})(jQuery,nunaliit2);