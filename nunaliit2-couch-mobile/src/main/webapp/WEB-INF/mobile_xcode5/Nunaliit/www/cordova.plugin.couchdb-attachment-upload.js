/*
*   Cordova CouchDB Attachment Uploader Plugin
*   Copyright 2011 Red Robot Studios Ltd. All rights reserved.
*   Based on Matt Kane's File Upload Plugin
*/


var CouchDBAttachmentUploader = function() {}

CouchDBAttachmentUploader.prototype.upload = function(filepath, couchURI, docID, docRevision,  success, failure, options) {
    
    var request = {};
    var progress = window.plugins.CouchDBAttachmentUploader.dummyProgress;
    
    // Process options
    for(var key in options) {
		var value = options[key];
		
		if( key === 'progress' && typeof(value) === 'function' ) {
			// Callback for progress
			progress = value;
			
		} else if( 'contentType' === key
		  || 'method' === key
		  || 'attachmentName' === key
		   ){
		   // Pass these options to request
		   request[key] = value;
		};
    };

	// Prepare callbacks    
    var key = 'f' + this.callbackIdx++;
    window.plugins.CouchDBAttachmentUploader.callbackMap[key] = {
        success: function(result) {
        	if( result.error ) {
        		failure(result.error);
        	} else {
            	success(result);
            };
            delete window.plugins.CouchDBAttachmentUploader.callbackMap[key]
        },
        failure: function(result) {
            failure(result);
            delete window.plugins.CouchDBAttachmentUploader.callbackMap[key]
        }
        ,progress: progress
    }
    var callback = 'window.plugins.CouchDBAttachmentUploader.callbackMap.' + key;
    return cordova.exec('CouchDBAttachmentUploader.upload', filepath, couchURI, docID, 
                         docRevision, callback + '.success', callback + '.failure',
                         callback + '.progress', request);
}

CouchDBAttachmentUploader.prototype.callbackMap = {};
CouchDBAttachmentUploader.prototype.callbackIdx = 0;
CouchDBAttachmentUploader.prototype.dummyProgress = function(bytes, total){};

cordova.addConstructor(function()  {
    if(!window.plugins) {
        window.plugins = {};
    }
    window.plugins.CouchDBAttachmentUploader = new CouchDBAttachmentUploader();
});
