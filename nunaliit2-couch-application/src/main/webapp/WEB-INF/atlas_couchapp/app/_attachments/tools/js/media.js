;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var schemaRepository = null;
	var showService = null;
	var exportService = null;
	var couchEditor = null;
	var $mediaAppDiv = null;
	var databaseInfo = null;
	var mediaDirInfo = null;

	
	// -----------------------------------------------------------------
	function reportRemoveCommands(){
		var err = null;
		if( !databaseInfo ){
			err = _loc('You must first load the database info.');
		} else if( !mediaDirInfo ) {
			err = _loc('You must first load the media directory listing.');
		};
		if( err ){
			reportError(err);
			alert(err);
		};
		
		logClear();
		
		// Report files in media directory that are not referenced in the database
		for(var filename in mediaDirInfo){
			if( !databaseInfo[filename] ){
				log('rm '+filename);
			};
		};
	};

	// -----------------------------------------------------------------
	function performAnalysis(){
		var err = null;
		if( !databaseInfo ){
			err = _loc('You must first load the database info.');
		} else if( !mediaDirInfo ) {
			err = _loc('You must first load the media directory listing.');
		};
		if( err ){
			reportError(err);
			alert(err);
		};
		
		logClear();

		// Report documents that points to non-existing files in the
		// media directory
		for(var filename in databaseInfo){
			if( !mediaDirInfo[filename] ){
				var mediaInfo = databaseInfo[filename];
				for(var docId in mediaInfo){
					var docInfo = mediaInfo[docId];
					for(var attName in docInfo){
						log(''+docId+'('+attName+') points to a non-existing file: '+filename);
					};
				};
			};
		};
		
		// Report files in media directory that are not referenced in the database
		for(var filename in mediaDirInfo){
			if( !databaseInfo[filename] ){
				log('File '+filename+' is not referenced from the database');
			};
		};
	};

	// -----------------------------------------------------------------
	function loadMediaDirectory(){
		var dialogId = $n2.getUniqueId();
		
		var $dialog = $('<div id="'+dialogId+'" class="n2MediaMediaDialog">'
			+'<div class="n2Media_textWrapper">'
			+'<textarea class="n2Media_text"></textarea>'
			+'</div>'
			+'<div class="n2Media_explainWrapper">'
			+'Perform a directory listing of the media directory and paste '
			+'to text area above. The listing should be one file name per line '
			+'(ls -1)'
			+'</div>'
			+'<div class="n2Media_buttons">'
			+'</div>'
			+'</div>');
		
		var $buttons = $dialog.find('.n2Media_buttons');
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Upload') )
			.click(function(){
				upload();
				return false;
			});
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Cancel') )
			.click(function(){
				$('#'+dialogId).dialog('close');
				return false;
			});
			
		var dialogOptions = {
			autoOpen: true
			,title: _loc('Upload Media Directory Listing')
			,modal: true
			,closeOnEscape: false
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		$dialog.dialog(dialogOptions);
		
		function upload() {
			var $dialog = $('#'+dialogId);
			var text = $dialog.find('.n2Media_text').val();
			var files = text.split('\n');
			
			mediaDirInfo = {};
			for(var i=0,e=files.length; i<e; ++i){
				var filename = files[i];
				
				if( filename ) {
					mediaDirInfo[filename] = true;
				};
			};
			
			$dialog.dialog('close');
		};
	};
	
	// -----------------------------------------------------------------
	function loadDatabaseInfo(){
		var docIds = {};
		var docIdsToLoad = null;
		
		atlasDesign.queryView({
			viewName: 'attachments'
			,onSuccess: function(rows){
				for(var i=0,e=rows.length; i<e; ++i){
					var docId = rows[i].id;
					docIds[docId] = true;
				};
				loadAttachmentDocuments();
			}
			,onError: function(err){
				alert(_loc('Unable to obtain list of documents with attachments')+': '+err);
				reportError(_loc('Unable to obtain list of documents with attachments')+': '+err);
			}
		});
		
		function loadAttachmentDocuments(){
			docIdsToLoad = [];
			databaseInfo = {};
			for(var docId in docIds){
				docIdsToLoad.push(docId);
			};
			loadAttachmentDocument();
		};
		
		function loadAttachmentDocument(){
			if( docIdsToLoad.length < 1 ){
				analyzeData();
				return;
			};
			
			var docId = docIdsToLoad.pop();
			log( _loc('Loading document: ') + docId );
			atlasDb.getDocument({
				docId: docId
				,onSuccess: function(doc){
					if( doc.nunaliit_attachments
					 && doc.nunaliit_attachments.files ){
						for(var attName in doc.nunaliit_attachments.files){
							var att = doc.nunaliit_attachments.files[attName];
							
							if( att.mediaFile ) addMediaFile(att.mediaFile, doc._id, attName);

							if( att.original 
							 && att.original.mediaFile ) {
								addMediaFile(att.original.mediaFile, doc._id, attName);
							};
						};
					};
					loadAttachmentDocument();
				}
				,onError: function(errorMsg){ 
					reportError(_loc('Unable to load document')+': '+docId);
					loadAttachmentDocument();
				}
			});
		};
		
		function addMediaFile(mediaFile, docId, attName){
			var mediaInfo = databaseInfo[mediaFile];
			if( !mediaInfo ) {
				mediaInfo = {};
				databaseInfo[mediaFile] = mediaInfo;
			};
			
			var docInfo = mediaInfo[docId];
			if( !docInfo ){
				docInfo = {};
				mediaInfo[docId] = docInfo;
			};
			
			docInfo[attName] = true;
		};
		
		function analyzeData(){
			log( _loc('Done.') );
		};
	};
	
	// -----------------------------------------------------------------
	function refreshButtons(){
		var $buttons = $mediaAppDiv.find('.mediaAppButtons');
		
		$buttons.empty();
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Load Info From Database') )
			.click(function(){
				loadDatabaseInfo();
				return false;
			});
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Load Listing of Media Directory') )
			.click(function(){
				loadMediaDirectory();
				return false;
			});
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Perform Analysis') )
			.click(function(){
				performAnalysis();
				return false;
			});
		
		$('<button>')
			.appendTo($buttons)
			.text( _loc('Commands for removal') )
			.click(function(){
				reportRemoveCommands();
				return false;
			});
	};

	// -----------------------------------------------------------------
	function getLogsDiv(){
		var $e = $mediaAppDiv.find('.mediaAppLogs');
		if( $e.length < 1 ) {
			$e = $('<div class="mediaAppLogs"></div>');
			$mediaAppDiv.append($e);
			logAddHeader($e);
		};
		return $e;
	};
	
	// -----------------------------------------------------------------
	function reportError(err){
		var $e = getLogsDiv();

		var $d = $('<div class="error"></div>');
		$d.text(err);
		$e.append($d);
	};
	
	// -----------------------------------------------------------------
	function log(msg){
		var $e = getLogsDiv();

		var $d = $('<div class="log"></div>');
		$d.text(msg);
		$e.append($d);
	};
	
	// -----------------------------------------------------------------
	function logClear(){
		var $d = getLogsDiv();
		$d.empty();
		logAddHeader($d);
	};

	// -----------------------------------------------------------------
	function logAddHeader($e){
		var $h = $('<h1><span></span> <button></button></h1>');
		$e.append($h);
		$h.find('span').text( _loc('Logs') );
		$h.find('button')
			.text( _loc('Clear') )
			.click(function(){
				logClear();
				return false;
			});
	};
	
	// -----------------------------------------------------------------
	function main(opts_) {
		$n2.log('Options',opts_);
		config = opts_.config;
		atlasDb = opts_.config.atlasDb;
		atlasDesign = opts_.config.atlasDesign;
		serverDesign = opts_.config.serverDesign;
		schemaRepository = opts_.config.directory.schemaRepository;
		couchEditor = config.couchEditor;

		$mediaAppDiv = opts_.div;
		
		$('.mediaAppTitle').text( _loc('Media Application') );
		
		if( config.directory ){
			showService = config.directory.showService;
			exportService = config.directory.exportService;
			
			// This application does not use hash to keep track of currently
			// selected document.
			if( config.directory.historyTracker 
			 && config.directory.historyTracker.options ) {
				config.directory.historyTracker.options.disabled = true;
			};
		};
		
		$mediaAppDiv
			.empty()
			.append( $('<div class="mediaAppButtons"><div>') )
			;
		
		refreshButtons();

		log( _loc('Media application started') );
	};

	
	$n2.mediaApp = {
		main: main
	};
})(jQuery,nunaliit2);