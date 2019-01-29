;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var $appDiv = null;

	// *****************************************************************
	var importProfiles = null;
	
	// *****************************************************************
	// Input
	// *****************************************************************
	
	function refreshInputSection(){
		var $inputSection = $appDiv.find('.importAppInput')
			.empty();

		if( !importProfiles ){
			$inputSection.text( _loc('Loading import profiles') );
			return;
		};
		
		// Title
		var $inputTitle = $('<div>')
			.addClass('title')			
			.appendTo($inputSection);

		$('<span>')
			.addClass('mdc-typography--headline6')
			.text( _loc('Input') )
			.appendTo($inputTitle);
		
		var $buttonLine = $('<div class="buttonline">')
			.appendTo($inputSection);

		// Import Profile Select Menu
		var $importProfileSelect = $('<div>')
			.addClass('mdc-select mdc-select--outlined')
			.appendTo($buttonLine);
		
		$('<i>')
			.addClass('mdc-select__dropdown-icon')
			.appendTo($importProfileSelect);

		var $menuNotchedOutline = $('<div>')
			.addClass('mdc-notched-outline')
			.appendTo($importProfileSelect);

		$('<div>')
			.addClass('mdc-notched-outline__leading')
			.appendTo($menuNotchedOutline);

		var $menuNotchedOutlineNotch = $('<div>')
			.addClass('mdc-notched-outline__notch')
			.appendTo($menuNotchedOutline);

		$('<label>')
			.addClass('mdc-floating-label')
			.text(_loc('Import Profile'))
			.appendTo($menuNotchedOutlineNotch);

		$('<div>')
			.addClass('mdc-notched-outline__trailing')
			.appendTo($menuNotchedOutline);
														
		var $select = $('<select>')
			.addClass('import_profile mdc-select__native-control')
			.appendTo($importProfileSelect);

		if ( importProfiles.length === 0 ){
			$('<option>')
			.val(' ')
			.text(_loc('No valid import profiles available'))
			.appendTo($select);

		} else {
			for(var i=0,e=importProfiles.length; i<e; ++i){
				var importProfile = importProfiles[i];
				$('<option>')
					.val(importProfile.getId())
					.text( _loc(importProfile.getLabel())+' ('+importProfile.getType()+')' )
					.appendTo($select);
			};
		}

		// Input Textarea
		var textareaInputId = $n2.getUniqueId();
		var $inputLine = $('<div>')
			.addClass('mdc-text-field mdc-text-field--textarea')
			.appendTo($inputSection);
		
		$('<textarea>')
			.addClass('importData mdc-text-field__input')
			.attr('id',textareaInputId)
			.attr('rows','8')
			.attr('cols','40')
			.appendTo($inputLine);

		var $inputOutline = $('<div>')
			.addClass('mdc-notched-outline')
			.appendTo($inputLine);

		$('<div>')
			.addClass('mdc-notched-outline__leading')
			.appendTo($inputOutline);

		var $inputOutlineNotch = $('<div>')
			.addClass('mdc-notched-outline__notch')
			.appendTo($inputOutline);

		$('<label>')
			.attr('for',textareaInputId)
			.addClass('mdc-floating-label')
			.text(_loc('Input'))
			.appendTo($inputOutlineNotch);

		$('<div>')
			.addClass('mdc-notched-outline__trailing')
			.appendTo($inputOutline);

		// Import Verify Button
		$('<button>')
			.addClass('mdc-button')
			.text( _loc('Verify') )
			.appendTo($buttonLine)
			.click(function(){
				var $inputSection = $appDiv.find('.importAppInput');
				var importProfileId = $inputSection.find('.import_profile').val();
				var importData = $inputSection.find('.importData').val();
				
				var error = false;
				if( !importProfileId ) {
					error = true;
					reportError( _loc('An import profile must be provided') );
				};
				if( !importData ) {
					error = true;
					reportError( _loc('JSON definition must be provided') );
				};
				if( typeof JSON === 'undefined' ) {
					error = true;
					reportError( _loc('JSON library not available') );
				} else if( typeof JSON.parse !== 'function' ) {
					error = true;
					reportError( _loc('JSON.parse() is not available') );
				};

				if( error ) {
					alert( _loc('Missing input. Can not proceed.') );
					return;
				};
				
				var importProfile = null;
				if( !error ){
					for(var i=0,e=importProfiles.length; i<e; ++i){
						var ip = importProfiles[i];
						if( ip.getId() === importProfileId ){
							importProfile = ip;
						};
					};
					
					if( !importProfile ){
						fatalError( _loc('Can not find import profile with id: {id}',{id:importProfileId}) );
						return;
					};
				};

				importProfile.parseEntries({
					importData: importData
					,onSuccess: function(entries){
						importProfile.performImportAnalysis({
							entries: entries
							,onSuccess: function(analysis){
								$n2.log('analysis',analysis);
								
								new $n2.couchImportProfile.AnalysisReport({
									elem: $appDiv.find('.importAppVerify')
									,analysis: analysis
									,logFn: log
								});
							}
							,onError: function(err){
								fatalError( _loc('Error while analyzing import: {err}',{err:err}) );
							}
						});
					}
					,onError: function(err){
						fatalError( _loc('Unable to parse import data: {err}',{err:err}) );
					}
				});
			});
		
		function fatalError(err){
			reportError( err );
			alert( err );
		};

		// Attach Material Design Components
		$n2.mdc.attachMDCComponents();
	};

	// *****************************************************************
	// Logs
	// *****************************************************************
	
	// -----------------------------------------------------------------
	function getLogsDiv(){
		var $e = $appDiv.find('.importAppLogs');
		if( $e.length < 1 ) {
			$e = $('<div class="importAppLogs mdc-card"></div>');
			$appDiv.append($e);
			addHeader($e);
		};
		return $e;
		
		function addHeader($e){
			var $h = $('<div>')
				.addClass('title')
				.appendTo($e);
			
			$('<span>')
				.addClass('mdc-typography--headline6')
				.text( _loc('Logs') )
				.appendTo($h);
			
			$('<button>')
				.addClass('mdc-button')
				.text(_loc('Clear'))
				.appendTo($h)
				.click(function(){
					var $d = getLogsDiv();
					$d.empty();
					addHeader($d);
					return false;
				});
		};
	};
	
	// -----------------------------------------------------------------
	function reportError(err){
		var $e = getLogsDiv();

		var $d = $('<div class="error"></div>');
		$d.text(err);
		$e.append($d);
	};
	
	// -----------------------------------------------------------------
	function abort(err){
		reportError(err);
		alert(err);
	};
	
	// -----------------------------------------------------------------
	function log(msg){
		var $e = getLogsDiv();

		var $d = $('<div class="log"></div>');
		$d.text(msg);
		$e.append($d);
	};

	// *****************************************************************
	// Main
	// *****************************************************************
	
	// -----------------------------------------------------------------
	function main(opts_) {
		$n2.log('Options',opts_);
		config = opts_.config;
		atlasDb = opts_.config.atlasDb;
		atlasDesign = opts_.config.atlasDesign;
		serverDesign = opts_.config.serverDesign;
		schemaRepository = opts_.config.directory.schemaRepository;
		importProfileService = opts_.config.directory.importProfileService;
		couchEditor = config.couchEditor;

		$appDiv = opts_.div;
		
		if( config.directory ){
			// This application does not use hash to keep track of currently
			// selected document.
			if( config.directory.historyTracker 
			 && config.directory.historyTracker.options ) {
				config.directory.historyTracker.options.disabled = true;
			};
		};
		
		$appDiv
			.empty()
			.append( $('<div class="importAppInput mdc-card"><div>') )
			.append( $('<div class="importAppVerify mdc-card"><div>') )
			;
		
		refreshInputSection();
		getLogsDiv();
		
		importProfileService.loadImportProfiles({
			onSuccess: function(profiles){
				$n2.log('import profiles',profiles);
				importProfiles = profiles;
				refreshInputSection();
			}
			,onError: function(err){
				var msg = _loc('Unable to retrieve import profiles: {err}',{err:err});
				reportError( msg );
				alert( msg );
			}
		});

		log( _loc('Upgrade Json Application Started') );
	};

	
	$n2.importApp = {
		main: main
	};
})(jQuery,nunaliit2);