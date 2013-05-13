;(function($,$n2){

// DEBUG UPDATE TEST
function debugUpdateTest(opts_){
	
	var opts = $n2.extend({
		db: null
		,designDoc: null
		,viewName: 'identity'
		,onSuccess: function(){}
		,onError: function(err){}
	},opts_);
	
	var docId1 = null;
	var docId2 = null;
	
	createDoc1();
	
	function createDoc1() {
		debugLog('Creating document 1');
		opts.db.createDocument({
			data: {
				demo:{
					description: ''
					,reference: {
						doc: ''
						,nunaliit_type: 'reference'
					}
					,title: 'Interal Test Doc 1'
				}
				,nunaliit_created: {
					action: 'created'
					,name: 'admin'
					,nunaliit_type: 'actionstamp'
					,time: 1313684610751
				}
				,nunaliit_last_updated: {
					action: 'updated'
					,name: 'admin'
					,nunaliit_type: 'actionstamp'
					,time: 1313684610751
				}
				,nunaliit_schema: 'demo_doc'
				,nunaliit_type: 'demo_doc'
			}
			,onSuccess: function(docInfo) {
				docId1 = docInfo.id;
				debugLog('Document 1: '+docId1);
				queryIdentities1();
			}
			,onError: fail
		});
	};
	
	function queryIdentities1() {
		debugLog('Querying Identities');
		opts.designDoc.queryView({
			viewName: opts.viewName
			,onSuccess: function(rows) {
				var ids = {};
				for(var i=0,e=rows.length; i<e; ++i) {
					var docId = rows[i].id;
					ids[docId] = true;
					//debugLog('Id: '+docId);
				};
				
				if( !ids[docId1] ) {
					debugLog('Error: id for document 1 not reported');
					fail();
				} else {
					createDoc2();
				};
			}
			,onError: fail
		});
	};
	
	function createDoc2() {
		debugLog('Creating document 2');
		opts.db.createDocument({
			data: {
				name: 'just another test'
			}
			,onSuccess: function(docInfo) {
				docId2 = docInfo.id;
				debugLog('Document 2: '+docId2);
				queryIdentities2();
			}
			,onError: fail
		});
	};
	
	function queryIdentities2() {
		debugLog('Querying Identities');
		opts.designDoc.queryView({
			viewName: opts.viewName
			,onSuccess: function(rows) {
				var ids = {};
				for(var i=0,e=rows.length; i<e; ++i) {
					var docId = rows[i].id;
					ids[docId] = true;
					//debugLog('Id: '+docId);
				};
				
				if( !ids[docId1] ) {
					debugLog('Error: id for document 1 not reported');
					fail();
				} else if( !ids[docId2] ) {
					debugLog('Error: id for document 2 not reported');
					fail();
				} else {
					debugLog('Tests completed successfully');
				};
				
				opts.onSuccess();
			}
			,onError: fail
		});
	};
	
	function fail() {
		debugLog('Error: Test case failures');
		opts.onError('Test failed');
	};
	
	function debugLog(str) {
		$n2.log(str);
	};
};
// DEBUG UPDATE TEST

	// DEBUG CAPTURE VIDEO TEST
	function debugCaptureVideoTest(opts_){
		var opts = $n2.extend({
			config: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var db = null;
		var designDoc = null;
		
		config.getCurrentDb({
			onSuccess: function(currentDb_){
				db = currentDb_.getDb();
				designDoc = currentDb_.getDesignDoc();
				captureVideo();
			}
			,onError: error
		});
		
		function captureVideo(){
			try {
				navigator.device.capture.captureVideo(
					captureSuccess
					,error
					,{
						limit: 1
					}
				);
			
			} catch(e) {
				$n2.log('Exception in debugCaptureVideoTest: '+e);
			};
		};
		
		function captureSuccess(mediaFiles){
			$n2.log('mediaFiles: '+typeof(mediaFiles));
			if( mediaFiles ) {
				$n2.log('mediaFiles.length: '+mediaFiles.length);
				for(var i=0,e=mediaFiles.length; i<e; ++i){
					var mediaFile = mediaFiles[i];
					for(var key in mediaFile){
						$n2.log('mediaFile['+i+'] '+key+'='+mediaFile[key]);
					};
				};
				
				if( mediaFiles.length ) {
					readFile(mediaFiles[0]);
				} else {
					error('No media file reported');
				};
			};
		};
		
		function readFile(mediaFile) {
			try{
				var reader = new FileReader();
				reader.onloadend = ReaderLoadEnd;
				reader.onerror = error;
				reader.readAsDataURL(mediaFile);
				
			}catch(e){
				error('Error accessing file reader: '+e);
			};
		};
		
		function ReaderLoadEnd(evt){
			var data = null;
			if( evt 
			 && evt.target 
			 && evt.target.result ) {
				data = evt.target.result;
			};
			
			if( data ) {
				$n2.log('Data: '+data.substr(0,40));
			
				LoadVideo(data);
			} else {
				error('No data returned');
			};
		};
		
		function LoadVideo(data){
			var B64 = ';base64,';
			var DATA = 'data:';
			
			var b64Index = data.search(B64);
			var dataIndex = data.search(DATA);
			if( b64Index >= 0
		     && dataIndex >= 0
		     && b64Index > dataIndex ) {
		     var mimeType = data.substr(dataIndex+DATA.length, b64Index-dataIndex-DATA.length);
		     var content = data.substr(b64Index+B64.length);
		     
		     var doc = {
		     	_attachments:{
		     		video:{
		     			content_type: mimeType
		     			,data: content
		     		}
		     	}
		     };
		     
		     db.createDocument({
		     	data: doc
		     	,onSuccess:DocumentSaved
		     	,onError: error
		     });
		     
		    } else {
		    	error('Unable to interpret data');
		    };
		};
		
		function DocumentSaved(){
			done();
		};

		function done(){
			$n2.log('Capture Success');
			opts.onSuccess();
		};
		
		function error(str){
			$n2.log('Capture Video Test Failed: '+str);
			opts.onError(str);
		};
	};
	// DEBUG CAPTURE VIDEO TEST

	// DEBUG UPLOAD VIDEO TEST
	function debugUploadVideoTest(opts_){
		var opts = $n2.extend({
			config: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var db = null;
		var designDoc = null;
		var mediaFile = null;
		var doc = null;
		
		config.getCurrentDb({
			onSuccess: function(currentDb_){
				db = currentDb_.getDb();
				designDoc = currentDb_.getDesignDoc();
				captureVideo();
			}
			,onError: error
		});
		
		function captureVideo(){
			try {
				navigator.device.capture.captureVideo(
					captureSuccess
					,error
					,{
						limit: 1
					}
				);
			
			} catch(e) {
				$n2.log('Exception in debugCaptureVideoTest: '+e);
			};
		};
		
		function captureSuccess(mediaFiles){
			$n2.log('mediaFiles: '+typeof(mediaFiles));
			if( mediaFiles ) {
				if( mediaFiles.length ) {
					mediaFile = mediaFiles[0];
					createDoc();
				} else {
					error('No media file reported');
				};
			};
		};
		
		function createDoc() {
		     var doc = {
		    	test: 'Video File Upload'
		     };
		     
		     db.createDocument({
		     	data: doc
		     	,onSuccess:DocumentSaved
		     	,onError: error
		     });
		};
		
		function DocumentSaved(docInfo){
			db.getDocument({
				docId: docInfo.id
				,onSuccess: function(doc_){
					doc = doc_;
					upload();
				}
				,onError: error
			});
		};
		
		function upload(){
			
			var docUrl = db.getDocumentUrl(doc);
			var attName = 'video_1';
			
			var options = new FileUploadOptions();
			options.fileKey="file";
			options.fileName=attName;
			options.mimeType="video/quicktime";

			var params = {
				rev: doc._rev
			};

			options.params = params;
			
			var ft = new FileTransfer();
			ft.upload(
				'file://'+mediaFile.fullPath
				,docUrl+'/'+attName
				,function(uploadResult){
					for(var key in uploadResult){
						var value = uploadResult[key];
						$n2.log('uploadResult['+key+']:'+value);
					};
					if( uploadResult && uploadResult.response ) {
						if(uploadResult.response.error){
						}else{
							done();
						};
					} else {
						error('Upload result did not return a response');
					};
				}
				,error
				,options
			);
		};

		function done(){
			$n2.log('Video Upload Success');
			opts.onSuccess();
		};
		
		function error(str){
			$n2.log('Video Upload Failed: '+str);
			opts.onError(str);
		};
	};
	// DEBUG UPLOAD VIDEO TEST
	
	// DEBUG CAPTURE AUDIO TEST
	function debugCaptureAudioTest(opts_){
		var opts = $n2.extend({
			config: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var db = null;
		var designDoc = null;
		
		config.getCurrentDb({
			onSuccess: function(currentDb_){
				db = currentDb_.getDb();
				designDoc = currentDb_.getDesignDoc();
				captureAudio();
			}
			,onError: error
		});
		
		function captureAudio(){
			try {
				navigator.device.capture.captureAudio(
					captureSuccess
					,error
					,{
						limit: 1
					}
				);
			
			} catch(e) {
				$n2.log('Exception in debugCaptureAudioTest: '+e);
			};
		};
		
		function captureSuccess(mediaFiles){
			$n2.log('mediaFiles: '+typeof(mediaFiles));
			if( mediaFiles ) {
				$n2.log('mediaFiles.length: '+mediaFiles.length);
				for(var i=0,e=mediaFiles.length; i<e; ++i){
					var mediaFile = mediaFiles[i];
					for(var key in mediaFile){
						$n2.log('mediaFile['+i+'] '+key+'='+mediaFile[key]);
					};
				};
				
				if( mediaFiles.length ) {
					readFile(mediaFiles[0]);
				} else {
					error('No media file reported');
				};
			};
		};
		
		function readFile(mediaFile) {
			try{
				var reader = new FileReader();
				reader.onloadend = ReaderLoadEnd;
				reader.onerror = error;
				reader.readAsDataURL(mediaFile);
				
			}catch(e){
				error('Error accessing file reader: '+e);
			};
		};
		
		function ReaderLoadEnd(evt){
			var data = null;
			if( evt 
			 && evt.target 
			 && evt.target.result ) {
				data = evt.target.result;
			};
			
			if( data ) {
				$n2.log('Data: '+data.substr(0,40));
			
				LoadAudio(data);
			} else {
				error('No data returned');
			};
		};
		
		function LoadAudio(data){
			var B64 = ';base64,';
			var DATA = 'data:';
			
			var b64Index = data.search(B64);
			var dataIndex = data.search(DATA);
			if( b64Index >= 0
		     && dataIndex >= 0
		     && b64Index > dataIndex ) {
		     var mimeType = data.substr(dataIndex+DATA.length, b64Index-dataIndex-DATA.length);
		     var content = data.substr(b64Index+B64.length);
		     
		     var doc = {
		     	_attachments:{
		     		audio:{
		     			content_type: mimeType
		     			,data: content
		     		}
		     	}
		     };
		     
		     db.createDocument({
		     	data: doc
		     	,onSuccess:DocumentSaved
		     	,onError: error
		     });
		     
		    } else {
		    	error('Unable to interpret data');
		    };
		};
		
		function DocumentSaved(){
			done();
		};

		function done(){
			$n2.log('Capture Audio Success');
			opts.onSuccess();
		};
		
		function error(str){
			$n2.log('Capture Audio Test Failed: '+str);
			opts.onError(str);
		};
	};
	// DEBUG CAPTURE AUDIO TEST

	
	// DEBUG VIDEO URI TEST
	function debugVideoUriTest(opts_){
		var opts = $n2.extend({
			config: null
			,container: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		new $n2.mobile.MobileCaptureMedia({
			onCapture: function(fileData){
				attach(fileData);
			}
			,onError: error
		});
		
		function attach(fileData){
			// Create video tags with media file
			var $container = $('#'+opts.container);
			if( $container.length < 1 ) {
				window.setTimeout(function(){attach(fileData);},10);
				return;
			};
			
			// data:uri
			var src = 'data:'+fileData.mimeType+';base64,'+fileData.content;
			var mimeType = fileData.mimeType;
			$n2.log('data:uri '+src.substr(0,30));
			$container.append( $('<div>"data:" URI</div>') );
			$container.append( $('<div><video width="320" height="240" controls="controls">'
					+'<source src="'+src+'" type="'+mimeType+'"/>'
					+'</video></div>') );
			
			// file:uri
			var src = 'file://'+fileData.mediaFile.fullPath;
			$n2.log('file:uri '+src);
			$container.append( $('<div>"file:" URI</div>') );
			$container.append( $('<div><video width="320" height="240" controls="controls">'
					+'<source src="'+src+'" type="'+mimeType+'"/>'
					+'</video></div>') );
		};
		
		function done(){
			$n2.log('Debug Video URIs completed');
			opts.onSuccess();
		};
		
		function error(str){
			$n2.log('Debug Video URIs failed: '+str);
			opts.onError(str);
		};
	};
	// DEBUG VIDEO URI TEST

  $n2.mobileDebug = {
        debugUpdateTest: debugUpdateTest
        ,debugCaptureVideoTest: debugCaptureVideoTest
        ,debugCaptureAudioTest: debugCaptureAudioTest
        ,debugUploadVideoTest: debugUploadVideoTest
        ,debugVideoUriTest: debugVideoUriTest
  };

})(jQuery,nunaliit2);
