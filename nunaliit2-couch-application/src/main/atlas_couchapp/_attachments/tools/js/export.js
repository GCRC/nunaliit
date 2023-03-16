;(function($,$n2){
"use strict";
	
// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

var config = null;
var atlasDb = null;
var atlasDesign = null;
var serverDesign = null;
var schemaRepository = null;
var showService = null;
var exportService = null;
var $exportDiv = null;

function showDocs(opts_){
	var opts = $n2.extend({
		schema: null
		,layerId: null
		,format: null
	},opts_);

	var schema = opts.schema;
	var layerId = opts.layerId;
	
	$('.exportError').empty();
	$('.exportResult').html('<div class="olkit_wait"></div>');
	
	var format = 'csv';
	if( opts.format ){
		format = opts.format;
	};
	
	if( schema ){
		exportService.exportBySchemaName({
			schemaName: schema.name
			,format: format
			,onSuccess: function(csv){
				$('.exportResult').empty();
				var $textarea = $('<textarea class="exportCsv"></textarea>');
				$('.exportResult').append($textarea);
				$textarea.text(csv);
			}
			,onError: function(errStr,error) {
				$('.exportResult').empty();
				if( error ){
					reportError(error);
				} else {
					reportError('Problem exporting by schema name: '+errStr);
				};
			}
		});

	} else if( layerId ) {
		exportService.exportByLayerId({
			layerId: layerId
			,format: format
			,onSuccess: function(csv){
				$('.exportResult').empty();
				var $textarea = $('<textarea class="exportCsv"></textarea>');
				$('.exportResult').append($textarea);
				$textarea.text(csv);
			}
			,onError: function(errStr, error) {
				$('.exportResult').empty();
				if( error ){
					reportError(error);
				} else {
					reportError('Problem exporting by layer id: '+errStr);
				};
			}
		});
	};
};

function downloadDocs(opts_){
	var opts = $n2.extend({
		schema: null
		,layerId: null
		,format: null
	},opts_);

	var schema = opts.schema;
	var layerId = opts.layerId;

	const format = opts.format || 'csv';
	let fileName = 'export.';
	if ('csv' === format) fileName += 'csv';
	else if ('geojson' === format) fileName += 'geojson';
	else if ('turtle' === format) fileName += 'ttl';
	else if ('jsonld' === format) fileName += 'jsonld';
	else if ('rdfxml' === format) fileName += 'rdf';
	else fileName = fileName.slice(0, -1);
	
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
	
	if( schema ){
		exportService.exportBySchemaName({
			schemaName: schema.name
			,targetWindow: windowId
			,filter: 'all'
			,contentType: 'application/binary'
			,fileName: fileName
			,format: format
			,onError: function(err){
				alert(_loc('Error during export')+': '+err);
			}
		});

	} else if( layerId ){
		exportService.exportByLayerId({
			layerId: layerId
			,targetWindow: windowId
			,filter: 'all'
			,contentType: 'application/binary'
			,fileName: fileName
			,format: format
			,onError: function(err){
				alert(_loc('Error during export')+': '+err);
			}
		});
	};
};

function loadSchemaDocumentIds(opts_){
	var opts = $n2.extend({
		schemaName: null
		,onSuccess: function(docIds, schemaName){}
		,onError: function(err){
			reportError('Error. Unable to load document related to selected schema: '+err);
		}
	},opts_);
	
	var schemaName = opts.schemaName;
	if( !schemaName ) {
		throw 'Schema name not specified';
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

function loadLayerDocumentIds(opts_){
	var opts = $n2.extend({
		layerId: null
		,onSuccess: function(docIds){}
		,onError: function(err){
			reportError('Error. Unable to load document related to selected layer: '+err);
		}
	},opts_);
	
	var layerId = opts.layerId;
	if( !layerId ) {
		throw 'layerId not specified';
	};
	
	atlasDesign.queryView({
		viewName: 'layers'
		,startkey: layerId
		,endkey: layerId
		,onSuccess: function(rows){
			var docIds = [];
			for(var i=0,e=rows.length; i<e; ++i){
				docIds.push(rows[i].id);
			};
			opts.onSuccess(docIds);
		}
		,onError: function(err) {
			opts.onError('Problem querying view layers: '+err);
		}
	});
};

function showButtons(opts_){
	var opts = $n2.extend({
		schema: null
		,layerId: null
		,div: null
	},opts_);
	
	var $div = $( opts.div );
	$div.empty();

	var $formatSel = $('<select>')
		.addClass('.exportControls_formatSelector')
		.appendTo( $div );
	var formatSelId = $n2.utils.getElementIdentifier($formatSel);
	var formats = ['csv','geojson', 'turtle', 'jsonld', 'rdfxml'];
	for(var i=0,e=formats.length; i<e; ++i){
		var format = formats[i];
		$('<option>')
			.text( format )
			.val( format )
			.appendTo($formatSel);
	};
	
	$('<button>')
		.text( _loc('Show') )
		.appendTo( $div )
		.click(function(){
			var $formatSel = $('#'+formatSelId);
			var format = $formatSel.val();
			showDocs({
				schema: opts.schema
				,layerId: opts.layerId
				,format: format
			});
			return false;
		});

	$('<button>')
		.text( _loc('Download') )
		.appendTo( $div )
		.click(function(){
			var $formatSel = $('#'+formatSelId);
			var format = $formatSel.val();
			downloadDocs({
				schema: opts.schema
				,layerId: opts.layerId
				,format: format
			});
			return false;
		});
};

function schemaSelected($sel){

	$('.exportResult').empty();
	$('.exportError').empty();
	var $result = $('.exportControls_schemaResult').empty();
	
	$('<span>')
		.addClass('exportDocCount')
		.appendTo($result);

	$('<span>')
		.addClass('exportButtons')
		.appendTo($result);

	var schemaName = $sel.val();
	
	loadSchemaDocumentIds({
		schemaName: schemaName
		,onSuccess: function(docIds, schemaName){
			$('.exportDocCount').text(''+docIds.length+' document(s)');
		}
		,onError: function(err){}
	});
	
	schemaRepository.getSchema({
		name: schemaName
		,onSuccess: function(schema){
			showButtons({
				schema: schema
				,div: $('.exportButtons')
			});
		}
		,onError: function(err){}
	});
};

function layerSelected($sel){

	$('.exportResult').empty();
	$('.exportError').empty();
	var $result = $('.exportControls_layerResult').empty();
	
	$('<span>')
		.addClass('exportDocCount')
		.appendTo($result);

	$('<span>')
		.addClass('exportButtons')
		.appendTo($result);

	var layerId = $sel.val();
	
	loadLayerDocumentIds({
		layerId: layerId
		,onSuccess: function(docIds){
			$('.exportDocCount').text(''+docIds.length+' document(s)');
		}
		,onError: function(err){}
	});
	
	showButtons({
		layerId: layerId
		,div: $('.exportButtons')
	});
};

function methodChanged($select){
	$('.exportControls_methodResult')
		.empty();
	
	if( 'schema' === $select.val() ){
		schemaRepository.getRootSchemas({
			onSuccess: function(schemas){
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
				
				var $methodResult = $('.exportControls_methodResult').empty();
				if( exportableSchemas.length > 0 ) {
					var $sel = $('<select>')
						.appendTo($methodResult);

					for(var i=0,e=exportableSchemas.length; i<e; ++i){
						var s = exportableSchemas[i];
						var $o = $('<option></option>');
						$o.text(s.name);
						$sel.append($o);
					};
					
					$sel.change(function(){
						var $sel = $(this);
						schemaSelected($sel);
						return true;
					});

					$('<span>')
						.addClass('exportControls_schemaResult')
						.appendTo($methodResult);
					
					schemaSelected($sel);

				} else {
					$('.exportControls_methodResult').text('No exportable schema found');
				};
			}
			,onError: function(err){
				reportError('Error. Unable to get schemas: '+err);
			}
		});

	} else if( 'layer' === $select.val() ){
		atlasDesign.queryView({
			viewName: 'layers'
			,reduce: true
			,group: true
			,onSuccess: function(rows){
				var layerIds = [];
				for(var i=0,e=rows.length; i<e; ++i){
					var layerId = rows[i].key;
					layerIds.push(layerId);
				};
				
				var $methodResult = $('.exportControls_methodResult').empty();
				
				if( layerIds.length > 0 ){
					var $sel = $('<select>')
						.appendTo($methodResult);
					for(var i=0,e=layerIds.length; i<e; ++i){
						var layerId = layerIds[i];
						var $o = $('<option></option>')
							.val(layerId)
							.text(layerId)
							.appendTo($sel);
						
						if( showService ){
							showService.printLayerName($o, layerId);
						};
					};
					
					$sel.change(function(){
						var $sel = $(this);
						layerSelected($sel);
						return true;
					});

					$('<span>')
						.addClass('exportControls_layerResult')
						.appendTo($methodResult);
					
					layerSelected($sel);
				};
			}
			,onError: function(err){
				reportError(_loc('Unable to obtain list of layers')+': '+err);
			}
		});

	} else {
		$('.exportControls_methodResult').text('Not implemented:'+$select.val());
	};
};

function installMethodButton(){
	var $controls = $('.exportControls')
		.empty();
	
	var $select = $('<select>')
		.addClass('exportControls_methodSelector')
		.appendTo($controls)
		.change(function(){
			var $sel = $(this);
			methodChanged($sel);
			return true;
		});

	$('<option>')
		.text( _loc('Schemas') )
		.val('schema')
		.appendTo($select);

	$('<option>')
		.text( _loc('Layers') )
		.val('layer')
		.appendTo($select);
	
	$('<span>')
		.addClass('exportControls_methodResult')
		.appendTo($controls);
	
	methodChanged($select);
};

function reportError(err){
	var $e = $('.exportError');
	if( $e.length < 1 ) {
		$e = $('<div class="exportError"></div>');
		$exportDiv.append($e);
	};
	
	if( typeof err === 'string' ){
		var $d = $('<div></div>');
		$d.text(err);
		$e.append($d);

	} else if( typeof err === 'object' && err.error ) {
		var cause = err;
		while( cause ){
			var $d = $('<div></div>');
			$d.text(cause.error);
			$e.append($d);
			
			cause = cause.cause;
		};
		
	} else {
		var $d = $('<div></div>');
		$d.text(''+err);
		$e.append($d);
	};
};

function main(opts_) {
	var opts = $n2.extend({
		config: null
		,div: null
	},opts_);
	
	config = opts.config;
	$exportDiv = $(opts.div);
	
	if( config ){
		atlasDb = config.atlasDb;
		atlasDesign = config.atlasDesign;
		serverDesign = config.serverDesign;
		
		if( config.directory ){
			schemaRepository = config.directory.schemaRepository;
			showService = config.directory.showService;
			exportService = config.directory.exportService;
		};
	};
	
	$exportDiv
		.empty()
		;
	$('<div>')
		.addClass('exportControls')
		.appendTo($exportDiv);
	$('<div>')
		.addClass('exportResult')
		.appendTo($exportDiv);
	$('<div>')
		.addClass('exportError')
		.appendTo($exportDiv);

	if( !exportService ) {
		$('.exportControls').text( _loc('Export service is not configured') );
	} else {
		exportService.checkAvailable({
			onAvailable: installMethodButton
			,onNotAvailable: function(){
				$('.exportControls').text( _loc('Export service is not available') );
			}
		});
	};
};

$n2.exportApp = {
	main: main
};

})(jQuery,nunaliit2);

