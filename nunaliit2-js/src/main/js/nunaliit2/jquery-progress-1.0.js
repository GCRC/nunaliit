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

*/
(function($){
"use strict";
	var uniqueId = 0;
	var polling = false;
	var progressKeyCache = [];
	var trackedKeys = {};
	var trackerElements = [];

	var getId = function() {
		var result = 'progress_id_' + uniqueId;
		++uniqueId;
		return result;
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
	var refreshProgressKeyCache = function(callback) {
		$.get("progress/getIds?count=5", function(data) {
			if (!data) {
				if( window.console && window.console.log ) window.console.log('No data returned by progress service');
				return;
			}
	 
			var response;
			eval ("response = " + data);
	 
			if (!response) {
				if( window.console && window.console.log ) window.console.log('No response returned by progress service');
				return;
			}

			if( response.progressIds ) {
				var key;
				while( key = response.progressIds.shift() ) {
					progressKeyCache.push(key);
				}
			}
			
			if( callback ) {
				var id = progressKeyCache.shift();
				if( id ) callback(id);
			}
		});
	};

	var onStartDefault = function(keyInfo,options) {
		var key = options.id + '_' + keyInfo.key;
		var elem = $(
			'<div id="progress_'+key+'">'+
				'<div id="progressbar_'+key+'"></div>'+
				'<div>'+
					'<span class="progress-x" id="progressa_'+key+'">X</span>'+keyInfo.desc+
					'<span id="progresstext_'+key+'">Starting...</span>'+
				'</div>'+
			'</div>');
		var parent = $('#'+options.trackerId);
		elem.appendTo(parent);
		$('#progressbar_'+key).progressbar();
		$('#progressa_'+key).click(function(evt){
			$.progress.removeDisplayOn(keyInfo.key);
			return false;
		});

	};
	 
	var onCompleteDefault = function(keyInfo,options) {
		var key = options.id + '_' + keyInfo.key;
		$('#progressbar_'+key).progressbar('value',100);
		$('#progresstext_'+key).text('Done.');
	};

	var onUpdateDefault = function(keyInfo,options) {
		var key = options.id + '_' + keyInfo.key;
		$('#progressbar_'+key).progressbar('value',keyInfo.value);
		$('#progresstext_'+key).text(''+keyInfo.value+'%');
	};

	var onRemoveDefault = function(key,options) {
		var key = options.id + '_' + key;
		$('#progress_'+key).remove();
	};

	var createActivity = function(keyInfo, trackerOptions) {
		if( trackerOptions.onStart ) {
			trackerOptions.onStart(keyInfo, trackerOptions);
		}
	}

	var updateActivity = function(keyInfo, trackerOptions) {
		if( trackerOptions.onUpdate ) {
			trackerOptions.onUpdate(keyInfo, trackerOptions);
		}
	}
	
	var forEachTracker = function(callback) {
		var loop;
		for(loop=0; loop<trackerElements.length; ++loop) {
			var trackerOptions = trackerElements[loop];
			callback(trackerOptions);
		};
	};
	
	var forEachActivity = function(callback) {
		for(var activityKey in trackedKeys) {
			var keyInfo = trackedKeys[activityKey];

			callback(activityKey, keyInfo);
		};
	};
	
	// Access progress servlet and get counters
	// for tracked activities. Update various
	// trackers when results are available
	var pollProgress = function() {
		// Check if any activity is being tracked
		var params = null;
		for(var key in trackedKeys) {
			if(!params) {
				params = '?progressId=' + key;
			} else {
				params += '&progressId=' + key;
			}
		}
		if( !params ) {
			polling = false;
			return;
		};

		// Check if any tracker are displayed
		var trackerDisplayed = false;
		forEachTracker(function(trackerOptions){
			trackerDisplayed = true;
		});
		if( !trackerDisplayed ) {
			polling = false;
			return;
		};

		polling = true;
		
		$.get('progress/getProgresses' + params, function(data) {
			if (!data) {
				if(window.console && window.console.log)window.console.log('No data');
				polling = false;
				return;
			}
	 
			var response;
			eval ('response = ' + data);
	 
			if (!response) {
				if(window.console && window.console.log)window.console.log('Empty response');
				polling = false;
				return;
			}

			var array = response.results;
			while( array.length > 0 ) {
				var info = array.shift();

				// Compute percentage
				var key = info.id;
				var total = 1 * info.total;
				var current = 1 * info.current;
				var percentage = 0;
				if( 0 != total ) {
					percentage = Math.floor(100 * current / total);
				}
				
				// Detect chained activities
				if( info.chained ) {
					var chainedInfos = info.chained;
					for(var loop=0; loop<chainedInfos.length; ++loop) {
						var chainedInfo = chainedInfos[loop];
						if( !trackedKeys[chainedInfo.id] ) {
							$.progress.startProgressTrackingOn(chainedInfo.id, chainedInfo.description);
						}
					}
				}
				
				// Update data
				var keyInfo = trackedKeys[key];
				if( keyInfo ) {
					if( keyInfo.value == percentage ) {
						keyInfo.duplicates = keyInfo.duplicates + 1;
					} else {
						keyInfo.duplicates = 0;
					};
					
					keyInfo.value = percentage;
					if( info.data ) {
						keyInfo.data = info.data;
					}

					forEachTracker(function(trackerOptions){
						updateActivity(keyInfo, trackerOptions);
					});
					
					// When activity is completed, stop tracking it
					if( info.completed ) {
						keyInfo.completed = true;
						
						$.progress.stopProgressTrackingOn(key);
					} else if( keyInfo.duplicates > 15 ) {
						// This activity is not moving, kill it
						$.progress.stopProgressTrackingOn(key);
					};
				}
			}
			 
			setTimeout(pollProgress, 750);
		});
	};
	
	/*
	 * This is the public API. Access via $.progress.XXX();
	 */
	$.progress = {
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
			getProgressKey: function(callback) {
				var key = progressKeyCache.shift();
				if( key ) {
					callback(key);
				} else {
					refreshProgressKeyCache(callback);
				}
			}
				
			,startProgressTrackingOn: function(key,desc) {
				var keyInfo = trackedKeys[key] = {
					value: 0
					,key: key
					,desc: desc
					,duplicates: 0
				};

				forEachTracker(function(trackerOptions){
					createActivity(keyInfo, trackerOptions);
				});

				// Start polling for progress, if needed
				if( !polling ) {			
					pollProgress();
				}
			}
			
			,stopProgressTrackingOn: function(key) {
				var keyInfo = trackedKeys[key];
				
				if( keyInfo ) {
					forEachTracker(function(trackerOptions){
						if( trackerOptions.onComplete ) {
							trackerOptions.onComplete(keyInfo, trackerOptions);
						}
					});
					
					delete trackedKeys[key];
				}
			}
			
			,removeDisplayOn: function(key) {
				$.progress.stopProgressTrackingOn(key);
				
				forEachTracker(function(trackerOptions){
					if( trackerOptions.onRemove ) {
						trackerOptions.onRemove(key, trackerOptions);
					}
				});
			}
			
			/*
			 * Default options
			 */
			,progressTrackerDefaultOptions: {
				onStart: onStartDefault 
				,onUpdate: onUpdateDefault 
				,onComplete: onCompleteDefault
				,onRemove: onRemoveDefault
			}
			
			,addProgressTracker: function(trackerOptions){
				var options = $.extend({},$.progress.progressTrackerDefaultOptions,trackerOptions);

				trackerElements.push(options);
	
				forEachActivity(function(activityKey, keyInfo){
					createActivity(keyInfo, options);
					updateActivity(keyInfo, options);
				});
	
				// Start polling for progress, if needed
				if( !polling ) {			
					pollProgress();
				};
			}
	};

	
	/*
	 * This is the jquery function that is called for each object
	 * found returned by a query. "this" is a set of elements returned
	 * by jquery.
	 * To use:
	 *   $('#id').progressTracker();
	 */
	$.fn.progressTracker = function(options_) {
		return this.each(function(){
			var self = this;
			var id = getId();
			var tracker = $('<div id="'+id+'"></div>').appendTo(this);
			options_.trackerId = id;

			$.progress.addProgressTracker(options_);
		});
	};

	/*
	 * This function installs a button on an element when a progress
	 * key is available. This button is used to open a file upload
	 * dialog.
	 * The reason that the button is created only when a progress key
	 * is available is that:
     * - The file upload servlet is co-located with the progress servlet
     * - If the progress servlet is not available, then the file upload servlet
     *   is not, either
     * - there is little point in created a useless element
     * - progress keys are used to track the progress of uploading the file,
     *   we should wait for a key before allowing a user to load a file to have
     *   a consistent look and feel.
	 */
	var installButton = function(elem, currentButton, key, options) {
		var button = $('<input type="button" value="'+options.message+'">');
		button.click(function(evt){

			options.onClick(elem,key);
			
			// Remove button and add a new one
			setTimeout(function(){
				$.progress.getProgressKey(function(newKey){
					installButton(elem, button, newKey, options);
				});
			},0);
		});
		if( currentButton ) {
			currentButton.after(button);
			currentButton.remove();
		} else {
			$(elem).append(button);
		}
	};

	/*
	 * Default options
	 */
	var keyedButtonDefaultOptions = {
		onClick: function(){} 
		,message: "OK" 
	};
	
	/*
	 * This is the jquery function that is called for each object
	 * found returned by a query. "this" is a set of elements returned
	 * by jquery.
	 * To use:
	 *   $('#id').keyedButton();
	 */
	$.fn.keyedButton = function(options_) {
		return this.each(function(){
			var options = $.extend({},keyedButtonDefaultOptions,options_);
			var self = this;
			$.progress.getProgressKey(function(key){
				installButton(self, null, key, options);
			});
		});
	};
})(jQuery);

