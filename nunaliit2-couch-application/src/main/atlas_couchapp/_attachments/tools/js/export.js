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
			,format: 'csv'
			,onSuccess: function(csv){
				$('.exportResult').empty();
				var $textarea = $('<textarea class="exportCsv"></textarea>');
				$('.exportResult').append($textarea);
				$textarea.text(csv);
			}
			,onError: function(errStr, error) {
				$('.exportResult').empty();
				if (error) {
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
	
	var format = 'csv';
	var fileName = 'export.csv';
	if (opts.format) {
		format = opts.format;
		
		if (format === 'geojson') {
			fileName = 'export.geojson';
		};
	};

	var windowId = $n2.getUniqueId();
	
	// Open a new iframe to get results
	$('<iframe>')
		.attr('name',windowId)
		.attr('src','javascript:false')
		.css({
			visibility: 'hidden'
			,display: 'none'
		})
		.appendTo($('body'));
	
	if (schema) {
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

	} else if (layerId) {
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
			reportError('Error. Unable to load document related to selected schema: ' + err);
		}
	},opts_);
	
	var schemaName = opts.schemaName;
	if (!schemaName) {
		throw 'Schema name not specified';
	};
	
	atlasDesign.queryView({
		viewName: 'nunaliit-schema'
		,startkey: schemaName
		,endkey: schemaName
		,onSuccess: function(rows){
			var docIds = [];
			for (var i = 0, e = rows.length; i < e; i += 1) {
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
			reportError('Error. Unable to load document related to selected layer: ' + err);
		}
	},opts_);
	
	var layerId = opts.layerId;
	if (!layerId) {
		throw 'layerId not specified';
	};
	
	atlasDesign.queryView({
		viewName: 'layers'
		,startkey: layerId
		,endkey: layerId
		,onSuccess: function(rows){
			var docIds = [];
			for (var i = 0, e = rows.length; i < e; i += 1) {
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
	
	var $div = $(opts.div);
	$div.empty();

	var formatSelect = new $n2.mdc.MDCSelect({
		parentId: $n2.utils.getElementIdentifier($div),
		preSelected: true,
		menuLabel: 'Export Format',
		menuOpts: [
			{
				"value": "csv",
				"label": "csv",
				"selected": true
			},
			{
				"value": "geojson",
				"label": "geojson"
			}
		]
	});

	$('#' + formatSelect.getSelectId()).addClass('exportControls_formatSelector');

	var btnParentId = $n2.utils.getElementIdentifier($div);

	new $n2.mdc.MDCButton({
		parentId: btnParentId,
		btnLabel: 'Show',
		onBtnClick: function(){
			var $formatSel = $('#' + formatSelect.getSelectId());
			var format = $formatSel.val();
			showDocs({
				schema: opts.schema
				,layerId: opts.layerId
				,format: format
			});
			return false;
		}
	});

	new $n2.mdc.MDCButton({
		parentId: btnParentId,
		btnLabel: 'Download',
		onBtnClick: function(){
			var $formatSel = $('#' + formatSelect.getSelectId());
			var format = $formatSel.val();
			downloadDocs({
				schema: opts.schema
				,layerId: opts.layerId
				,format: format
			});
			return false;
		}
	});

	// Attach Material Design Components
	$n2.mdc.attachMDCComponents();
};

function schemaSelected(schemaName){

	$('.exportResult').empty();
	$('.exportError').empty();
	var $result = $('.exportControls_schemaResult').empty();
	
	$('<span>')
		.addClass('exportButtons')
		.appendTo($result);

	$('<span>')
		.addClass('exportDocCount')
		.appendTo($result);
	
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

function layerSelected(layerId){

	$('.exportResult').empty();
	$('.exportError').empty();
	var $result = $('.exportControls_layerResult').empty();
	
	$('<span>')
		.addClass('exportButtons')
		.appendTo($result);

	$('<span>')
		.addClass('exportDocCount')
		.appendTo($result);
	
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

function installSchemaLayerSelect(menuOptions) {
	var $methodResult = $('.exportControls_methodResult');
	var schemaLayerSelect = new $n2.mdc.MDCSelect({
		parentId: $n2.utils.getElementIdentifier($methodResult),
		menuChgFunction: function(){
			var $sel = $(this);
			var selectedType = $('.exportControls_methodSelector').val();
			if (selectedType === 'schema') {
				schemaSelected($sel.val());
				return true;

			} else if (selectedType === 'layer') {
				layerSelected($sel.val());
				return true;
			}
		},
		menuLabel: 'Schema / Layer Name',
		menuOpts: menuOptions
	});
	
	// Add result spans based on type
	var selectionType = $('.exportControls_methodSelector').val();
	if (selectionType === 'schema') {
		$('<span>')
			.addClass('exportControls_schemaResult')
			.appendTo($methodResult);
		
		schemaSelected($('#' + schemaLayerSelect.getSelectId()).val());

	} else if (selectionType === 'layer') {
		$('<span>')
			.addClass('exportControls_layerResult')
			.appendTo($methodResult);
		
		layerSelected($('#' + schemaLayerSelect.getSelectId()).val());
	}
};

function methodChanged(selectVal){
	var methodChgFunction;
	var selected = false;
	var menuOptions = [];
	var $methodResult = $('.exportControls_methodResult').empty();

	if (selectVal === 'schema') {
		schemaRepository.getRootSchemas({
			onSuccess: function(schemas){
				var exportableSchemas = [];
				for (var i = 0, e = schemas.length; i < e; i += 1) {
					var s = schemas[i];
					if (s.csvExport) {
						exportableSchemas.push(s);
					}
				}
				
				exportableSchemas.sort(function(a,b){
					if( a.name < b.name ) {
						return -1;
					} else if( a.name > b.name ){
						return 1;
					} else {
						return 0;
					}
				});
				
				if (exportableSchemas.length > 0) {
					for (var i = 0 , e = exportableSchemas.length; i < e; i += 1) {
						var s = exportableSchemas[i];

						if (i === 0) {
							selected = true;
						}

						menuOptions.push({
							'value': s.name,
							'label': s.name,
							'selected': selected
						});
					}
					installSchemaLayerSelect(menuOptions);

				} else {
					$('.exportControls_methodResult').text('No exportable schema found');
				}
			}
			,onError: function(err){
				reportError('Error. Unable to get schemas: '+err);
			}
		});

	} else if (selectVal === 'layer') {
		atlasDesign.queryView({
			viewName: 'layers'
			,reduce: true
			,group: true
			,onSuccess: function(rows){
				var layerIds = [];
				for (var i = 0, e = rows.length; i < e; i += 1) {
					var layerId = rows[i].key;
					layerIds.push(layerId);
				}
				
				if (layerIds.length > 0) {
					for (var i = 0, e = layerIds.length; i < e; i += 1) {
						var layerId = layerIds[i];

						if (i === 0) {
							selected = true;
						}

						menuOptions.push({
							'value': layerId,
							'label': layerId,
							'selected': selected
						});
					}
					installSchemaLayerSelect(menuOptions);
				}
			}
			,onError: function(err){
				reportError(_loc('Unable to obtain list of layers') + ': ' + err);
			}
		});

	} else {
		$('.exportControls_methodResult').text('Not implemented:' + selectVal);
	}
};

function installMethodButton(){
	var $controls = $('.exportControls')
		.empty();
	
	var typeSelect = new $n2.mdc.MDCSelect({
		parentId: $n2.utils.getElementIdentifier($controls),
		preSelected: true,
		menuChgFunction: function(){
			var $sel = $(this);
			methodChanged($sel.val());
			return true;
		},
		menuLabel: 'Type',
		menuOpts: [
			{
				'value':'schema',
				'label':'Schemas',
				'selected': true
			},
			{
				'value':'layer',
				'label':'Layers'
			}
		]
	});

	$('#' + typeSelect.getSelectId()).addClass('exportControls_methodSelector');
	
	$('<span>')
		.addClass('exportControls_methodResult')
		.appendTo($controls);
	
	methodChanged($('#' + typeSelect.getSelectId()).val());
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
	
	$exportDiv.empty();

	$exportDiv.addClass('mdc-card');

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

