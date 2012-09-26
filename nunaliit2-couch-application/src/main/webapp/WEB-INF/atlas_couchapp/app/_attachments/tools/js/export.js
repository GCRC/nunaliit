
var config = null;
var atlasDb = null;
var atlasDesign = null;
var serverDesign = null;
var schemaRepository = null;
var $exportDiv = null;

function showDocs(schema){

	$('.exportResult').html('<div class="olkit_wait"></div>');
	
	atlasDesign.queryView({
		viewName: 'nunaliit-schema'
		,listName: 'csv_export'
		,startkey: schema.name
		,endkey: schema.name
		,onlyRows: false
		,include_docs: true
		,csvExport: schema.csvExport
		,rawResponse: true
		,onSuccess: function(csv){
			$('.exportResult').empty();
			var $textarea = $('<textarea class="exportCsv"></textarea>');
			$('.exportResult').append($textarea);
			$textarea.text(csv);
		}
		,onError: function(err) {
			reportError('Problem querying view/list nunaliit-schema: '+err);
		}
	});
};

function getCurrentSchemaName(){
	var $sel = $('.exportSelect').find('select');
	if( $sel.length < 1 ) {
		return null;
	};
	var schemaName = $sel.val();
	return schemaName;
};

function loadCurrentSchema(opts_){
	var opts = $n2.extend({
		onSuccess: function(schema){}
		,onError: function(err){
			reportError('Error. Unable to load current schema: '+err);
		}
	},opts_);

	var schemaName = getCurrentSchemaName();
	if( !schemaName ) {
		opts.onError('No schema selected');
		return;
	};

	schemaRepository.getSchema({
		name: schemaName
		,onSuccess: opts.onSuccess
		,onError: opts.onError
	});
};

function loadSchemaDocumentIds(opts_){
	var opts = $n2.extend({
		onSuccess: function(docIds, schemaName){}
		,onError: function(err){
			reportError('Error. Unable to load document related to selected schema: '+err);
		}
	},opts_);
	
	var schemaName = getCurrentSchemaName();
	if( !schemaName ) {
		opts.onError('No schema selected');
		return;
	};
	
	atlasDesign.queryView({
		viewName: 'nunaliit-schema'
		,startkey: schemaName
		,endkey: schemaName
		,onSuccess: function(rows){
			var docIds = [];
			for(var i=0,e=rows.length; i<e; ++i){
				docIds.push(rows[i].id);
			};
			opts.onSuccess(docIds, schemaName);
		}
		,onError: function(err) {
			opts.onError('Problem querying view nunaliit-schema: '+err);
		}
	});
};

function updateButtons(){

	$('.exportDocCount').empty();
	$('.exportButtons').empty();
	
	loadSchemaDocumentIds({
		onSuccess: function(docIds, schemaName){
			$('.exportDocCount').text(''+docIds.length+' document(s)');
		}
		,onError: function(err){}
	});
	
	loadCurrentSchema({
		onSuccess: function(schema){
			// Show local
			var $showBtn = $('<button>Show</button>');
			$('.exportButtons').append($showBtn);
			$showBtn.click(function(){
				showDocs(schema);
				return false;
			});

			// Download form
			var actionUrl = atlasDesign.getQueryUrl({
				viewName: 'nunaliit-schema'
				,listName: 'csv_export'
			});
			var $downloadForm = $('<form class="exportForm" method="GET" action="'+actionUrl+'"></form>');
			$('.exportButtons').append($downloadForm);
			$downloadForm.append( $('<input type="hidden" name="include_docs" value="true"/>') );
			$('<input type="hidden" name="startkey"/>')
				.attr('value',JSON.stringify(schema.name))
				.appendTo($downloadForm);
			$('<input type="hidden" name="endkey"/>')
				.attr('value',JSON.stringify(schema.name))
				.appendTo($downloadForm);
			$('<input type="hidden" name="csvExport"/>')
				.attr('value',JSON.stringify(schema.csvExport))
				.appendTo($downloadForm);
			$downloadForm.append( $('<input type="submit" value="Download All"/>') );
		}
		,onError: function(err){}
	});
};

function loadedRootSchemas(schemas){
	var exportableSchemas = [];
	for(var i=0,e=schemas.length; i<e; ++i){
		var s = schemas[i];
		if( s.csvExport ) {
			exportableSchemas.push(s);
		};
	};
	
	exportableSchemas.sort(function(a,b){
		if( a.name < b.name ) {
			return -1;
		} else if( a.name > b.name ){
			return 1;
		} else {
			return 0;
		};
	});
	
	$('.exportSelect').empty();
	if( exportableSchemas.length > 0 ) {
		var $sel = $('<select></select>');
		for(var i=0,e=exportableSchemas.length; i<e; ++i){
			var s = exportableSchemas[i];
			var $o = $('<option></option>');
			$o.text(s.name);
			$sel.append($o);
		};
		$('.exportSelect').append($sel);
		
		$sel.change(function(){
			$('.exportResult').empty();
			updateButtons();
		});
	} else {
		$('.exportSelect').text('No exportable schema found');
	};
	
	updateButtons();
};

function reportError(err){
	var $e = $('.exportError');
	if( $e.length < 1 ) {
		$e = $('<div class="exportError"></div>');
		$exportDiv.append($e);
	};
	
	var $d = $('<div></div>');
	$d.text(err);
	$e.append($d);
};

function exportMain(opts_) {
	config = opts_.config;
	atlasDb = opts_.config.atlasDb;
	atlasDesign = opts_.config.atlasDesign;
	serverDesign = opts_.config.serverDesign;
	schemaRepository = opts_.config.directory.schemaRepository;
	$exportDiv = opts_.div;
	
	$exportDiv
		.empty()
		.append( $('<div class="exportControls"><span class="exportSelect"></span><span class="exportDocCount"></span><span class="exportButtons"></span><div>') )
		.append( $('<div class="exportResult"><div>') )
		.append( $('<div class="exportError"><div>') )
		;
	
	// Get all schemas and select those with CSV export
	schemaRepository.getRootSchemas({
		onSuccess: function(schemas){
			loadedRootSchemas(schemas);
		}
		,onError: function(err){
			reportError('Error. Unable to get schemas: '+err);
		}
	});
};

