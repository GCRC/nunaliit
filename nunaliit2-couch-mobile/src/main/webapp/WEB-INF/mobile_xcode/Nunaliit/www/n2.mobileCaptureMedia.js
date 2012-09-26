;(function($,$n2){

var B64 = ';base64,';
var DATA = 'data:';

//=============================================================
var MobileCaptureMedia = $n2.Class({
	
	options: null
	
	,fileData: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			suppressMetaData: false
			,onCapture: function(captureData){}
			,onError: function(err){}
		},opts_);
		
		this.createPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPageContainer: function(){
		return $.mobile.pageContainer;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $.mobile.pageContainer.children('#mobileMediaCapture');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createPage: function(){

		var _this = this;
		
		var $newPage = this.getPage();
		if( $newPage.length < 1 ) {
			var documentBase = $.mobile.getDocumentBase(true);
			var absUrl = $.mobile.path.makeUrlAbsolute( 'mobileMediaCapture', documentBase.hrefNoHash );
			var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
			
			// Create page
			$newPage = $('<div id="mobileMediaCapture" data-url="'+dataUrl+'" data-role="page" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1><span class="mobileMediaCaptureHeader"></span></h1></div>');
			$newPage.append('<div class="mobileMediaCaptureContent" data-role="content" data-theme="c"></div>');
			
			var $pageContainer = this.getPageContainer();
			$pageContainer.append($newPage);
			
			// Enhance page
			$newPage.dialog();
			$newPage.bind('pagehide',function(){
				var $this = $( this ),
					prEvent = new $.Event( "pageremove" );

				$this.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$this.removeWithDependents();
				};
				
				if( _this.fileData ) {
					_this.options.onCapture(_this.fileData);
				};
			});
		};
		
		this.showSelectSource();
		
		// Load this page
		//$.mobile.changePage($newPage, options);
		var newPageOptions = $.extend(
			{}
			,{
				role:'dialog'
				,transition:'pop'
			}
		);
		$.mobile.changePage($newPage,newPageOptions);

	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,showSelectSource: function(){
		var _this = this;
		
		var $page = this.getPage();
		var $header = $page.find('.mobileMediaCaptureHeader');
		var $content = $page.find('.mobileMediaCaptureContent');

		$header.text('Select Media Source');

		$content.empty();
		$content.append( $('<span>Select source of picture:</span>') );
		$content.append( $('<a class="mobileMediaCaptureTakePicture" href="#" data-role="button">Take Picture using Camera</a>') );
		$content.append( $('<a class="mobileMediaCaptureImageLibrary" href="#" data-role="button">Select Picture from Library</a>') );
		$content.append( $('<a class="mobileMediaCaptureRecordVideo" href="#" data-role="button">Record Video</a>') );
		$content.append( $('<a class="mobileMediaCaptureVideoLibrary" href="#" data-role="button">Select Video from Library</a>') );
		$content.append( $('<a class="mobileMediaCaptureRecordAudio" href="#" data-role="button">Record Audio</a>') );
		
		$content.find('a').click(function(){
			var $button = $(this);
			
			if( $button.hasClass('mobileMediaCaptureTakePicture') ) {
				_this._takePicture(1);
				
			} else if( $button.hasClass('mobileMediaCaptureImageLibrary') ) {
				_this._takePicture(0);
				
			} else if( $button.hasClass('mobileMediaCaptureRecordVideo') ) {
				_this._captureVideo(1);
				
			} else if( $button.hasClass('mobileMediaCaptureVideoLibrary') ) {
				_this._captureVideo(0);
				
			} else if( $button.hasClass('mobileMediaCaptureRecordAudio') ) {
				_this._captureAudio();
				
			} else {
				_this.options.onError('Unable to handle media type');
			}
			
			return false;
		});
		
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,showMetaData: function(){
		var _this = this;
		
		var $page = this.getPage();
		var $header = $page.find('.mobileMediaCaptureHeader');
		var $content = $page.find('.mobileMediaCaptureContent');

		$header.text('Enter Media Information');

		$content.empty();
		$content.append( $('<div data-role="fieldcontain"><label for="media_title">Title:</label><input type="text" name="media_title" id="media_title" value="" autocapitalize="off" autocorrect="off" /></div>') );
		$content.append( $('<div data-role="fieldcontain"><label for="media_description">Description:</label><textarea name="media_description" id="media_description" autocapitalize="off" autocorrect="off"></textarea></div>') );
		$content.append( $('<a data-role="button">Accept Media File</a>') );
		
		$content.find('a').click(function(){
			var $button = $(this);

			var $page = _this.getPage();

			var title = $('#media_title').val();
			var desc = $('#media_description').val();

			_this._setFileMetaData({
				title: title
				,description: desc
			});
			
			return false;
		});
		
		$page.trigger('create');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCameraImplementation: function(){
		var impl = null;

		if( typeof(navigator) !== 'undefined'
		 && navigator.camera
		 && navigator.camera.getPicture
		 ) {
			impl = navigator.camera;

		} else if( typeof(fake) !== 'undefined'
			 && fake.camera
			 && fake.camera.getPicture
			 ) {
			impl = fake.camera;
		};
		
		return impl;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCaptureImplementation: function(){
		var impl = null;

		if( typeof(navigator) !== 'undefined'
		 && navigator.device
		 && navigator.device.capture
		 && navigator.device.capture.captureVideo
		 && navigator.device.capture.captureAudio
		 ) {
			impl = navigator.device.capture;

		} else if( typeof(fake) !== 'undefined'
			 && fake.capture
			 && fake.capture.captureVideo
			 && fake.capture.captureAudio
			 ) {
			impl = fake.capture;
		};
		
		return impl;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_takePicture: function(pictureSource_){
		
		// pictureSource_ = 0 -> LIBRARY
		// pictureSource_ = 1 -> CAMERA
		
		var _this = this;
		
		var impl = this.getCameraImplementation();
		
		if( !impl ) {
			this._error('No camera implementation available');
			return;
		};
		
		impl.getPicture(
			onCameraSuccess
			,onCameraError
			,{
				quality: 50
				,destinationType: 0 // DATA_URL
				,sourceType: pictureSource_
			}
		);

		function onCameraSuccess(imageData) {
			var fileData = {
				fileClass: 'image'
				,mimeType: 'image/jpeg'
				,content: imageData
			};
			
			_this._acceptFileData(fileData);
        };
                           
        function onCameraError(message) {
			_this._error(message);
        };
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_captureVideo: function(sourceType_){
		// 1 -> camera
		// 0 -> library

		var _this = this;
		
		var capture = this.getCaptureImplementation();
		if( !capture ) {
			this._error('No capture implementation available');
			return;
		};
		
		try {
			capture.captureVideo(
				captureSuccess
				,error
				,{
					limit: 1
					,sourceType: sourceType_
				}
			);
		} catch(e) {
			error('Error during capture: '+e);
		};
		
		function captureSuccess(mediaFiles){
			if( mediaFiles ) {
				if( mediaFiles.length ) {
					var mediaFile = mediaFiles[0];
					
					var mimeType = mediaFile.type;
					
					var fileClass = null;
					var mimeTypeSepIndex = mimeType.search('/');
					if( mimeTypeSepIndex >= 0 ){
						fileClass = mimeType.substr(0,mimeTypeSepIndex);
					};
					 
					var fileData = {
						fileClass: fileClass
						,mimeType: mimeType
						,mediaFile: mediaFile
						,fullPath: mediaFile.fullPath
					};

					_this._acceptFileData(fileData);

				} else {
					error('No media file reported');
				};
			} else {
				error('No media file reported');
			};
		};
		
		function error(err){
			_this._error(err);
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_captureAudio: function(){

		var _this = this;
		
		var capture = this.getCaptureImplementation();
		
		if( !capture ) {
			this._error('No capture implementation available');
			return;
		};
		
		try {
			capture.captureAudio(
				captureSuccess
				,error
				,{
					limit: 1
				}
			);
		} catch(e) {
			error('Error during capture: '+e);
		};
		
		function captureSuccess(mediaFiles){
			if( mediaFiles ) {
				if( mediaFiles.length ) {
					var mediaFile = mediaFiles[0];
					
					var mimeType = mediaFile.type;
					if( !mimeType ) {
						// Assume audio/wav for phonegap-iphone does
						// not include one
						mimeType = 'audio/wav';
					};
					
					var fileClass = null;
					var mimeTypeSepIndex = mimeType.search('/');
					if( mimeTypeSepIndex >= 0 ){
						fileClass = mimeType.substr(0,mimeTypeSepIndex);
					};
					 
					var fileData = {
						fileClass: fileClass
						,mimeType: mimeType
						,mediaFile: mediaFile
						,fullPath: mediaFile.fullPath
					};

					_this._acceptFileData(fileData);

				} else {
					error('No media file reported');
				};
			} else {
				error('No media file reported');
			};
		};
		
		function error(err){
			_this._error(err);
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_readMediaFileBase64: function(opts_){

		var opts = $n2.extend({
			mediaFile: null // required
			,onSuccess: function(b64Content){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var mediaFile = opts.mediaFile;
		
		if( !mediaFile ) {
			opts.onError('Invalid media file (null) can not be read.');
			return;
		};
		
		try{
			var reader = new FileReader();
			reader.onloadend = ReaderLoadEnd;
			reader.onerror = error;
			reader.readAsDataURL(mediaFile);
			
		} catch(e) {
			error('Error accessing file reader: '+e);
		};
		
		function ReaderLoadEnd(evt){
			var data = null;
			if( evt 
			 && evt.target 
			 && evt.target.result ) {
				data = evt.target.result;
			};
			
			if( data ) {
				var parsedData = _this._parseDataUrl(data);
				if( parsedData ) {
					opts.onSuccess(parsedData.content);
				} else {
					error('Invalid data format');
				};
			} else {
				error('No data returned');
			};
		};
		
		function error(err){
			opts.onError(err);
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_parseDataUrl: function(data){
		var b64Index = data.search(B64);
		var dataIndex = data.search(DATA);

		if( b64Index >= 0
	     && dataIndex >= 0
	     && b64Index > dataIndex ) {
		     var mimeType = data.substr(dataIndex+DATA.length, b64Index-dataIndex-DATA.length);
		     var content = data.substr(b64Index+B64.length);
		     
		     var fileClass = null;
		     var mimeTypeSepIndex = mimeType.search('/');
		     if( mimeTypeSepIndex >= 0 ){
		    	 fileClass = mimeType.substr(0,mimeTypeSepIndex);
		     };
		     
		     return {
		    	fileClass: fileClass
		    	,mimeType: mimeType
		    	,content: content
		     };

		} else {
			return null;
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_acceptFileData: function(fileData_){
		var _this = this;
		
		this.fileData = fileData_;
		
		// Accept meta data
		if( this.options.suppressMetaData ) {
			// Go directly to completion
			this._success();
		} else {
			this.showMetaData();
		};
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_setFileMetaData: function(data_){
		this.fileData.metaData = data_;

		this._success();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_success: function(){

		var _this = this;
		
		var fileData = this.fileData;
		
		fileData.getBase64Content = function(opts_){
			var opts = $n2.extend({
				onSuccess: function(b64Content){}
				,onError: function(err){}
			},opts_);
			
			_this._readMediaFileBase64({
				mediaFile: fileData.mediaFile
				,onSuccess: opts.onSuccess
				,onError: opts.onError
			});
		};

		// Close dialog
		var $page = this.getPage();
		$page.dialog('close');
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,_error: function(err){
		this.fileData = null;
		this.options.onError(err);
	}
});

$n2.mobile.MobileCaptureMedia = MobileCaptureMedia;

})(jQuery,nunaliit2);