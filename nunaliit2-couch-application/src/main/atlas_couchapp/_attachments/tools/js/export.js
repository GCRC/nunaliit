;(function($,$n2){
"use strict";
	
// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var config = null;
var atlasDb = null;
var atlasDesign = null;
var serverDesign = null;
var schemaRepository = null;
var exportService = null;
var $exportDiv = null;

function showDocs(schema){

	$('.exportResult').html('<div class="olkit_wait"></div>');
	
	exportService.exportBySchemaName({
		schemaName: schema.name
		,format: 'csv'
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

function downloadDocs(schema){

	var windowId = $n2.getUniqueId();
	
	// Open a new iframe to get results
	$('<iframe>')
		.attr('name',windowId)
		.attr('src','javascript:false')
		.css({
			visibility: 'hidden'
			,display: 'none'
		})
		.appendTo( $('body') );
	
	exportService.exportBySchemaName({
		schemaName: schema.name
		,targetWindow: windowId
		,filter: 'all'
		,contentType: 'application/binary'
		,fileName: 'export.csv'
		,format: 'csv'
		,onError: function(err){
			alert(_loc('Error during export')+': '+err);
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
	
	if( !exportService ) {
		$('.exportDocCount').text( _loc('Export service is not configured') );
	} else {
		exportService.checkAvailable({
			onAvailable: prepareForExport
			,onNotAvailable: function(){
				$('.exportDocCount').text( _loc('Export service is not available') );
			}
		});
	};
	
	function prepareForExport(){
		loadSchemaDocumentIds({
			onSuccess: function(docIds, schemaName){
				$('.exportDocCount').text(''+docIds.length+' document(s)');
			}
			,onError: function(err){}
		});
		
		loadCurrentSchema({
			onSuccess: function(schema){
				// Show local
				var $showBtn = $('<button>')
					.text( _loc('Show') )
					.appendTo( $('.exportButtons') )
					.click(function(){
						showDocs(schema);
						return false;
					});

				var $downloadBtn = $('<button>')
					.text( _loc('Download') )
					.appendTo( $('.exportButtons') )
					.click(function(){
						downloadDocs(schema);
						return false;
					});
			}
			,onError: function(err){}
		});
	};
};

function loadedRootSchemas(schemas){
	var exportableSchemas = [];
	for(var i=0,e=schemas.length; i<e; ++i){
		var s = schemas[i];
		if( s.exportInfo ) {
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

function main(opts_) {
	var opts = $n2.extend({
		config: null
		,div: null
	},opts_);
	
	config = opts.config;
	atlasDb = config.atlasDb;
	atlasDesign = config.atlasDesign;
	serverDesign = config.serverDesign;
	schemaRepository = config.directory.schemaRepository;
	exportService = config.directory.exportService;
	$exportDiv = $(opts.div);
	
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

$n2.exportApp = {
	main: main
};

})(jQuery,nunaliit2);

