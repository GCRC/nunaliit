;(function($,$n2){
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

	var config = null;
	var atlasDb = null;
	var atlasDesign = null;
	var serverDesign = null;
	var schemaRepository = null;
	var showService = null;
	var couchEditor = null;
	var $schemaAppDiv = null;

	
	// ********************************
	// OPTIONAL SHEMAS
	// ********************************
	
	// Optional schemas
	var optionalSchemas = [
		// book
		{
		  "name": "book"
		  ,"isRootSchema": true
		  ,"brief": "Book: {{#book}}{{name}}{{\/book}}"
		  ,"display":
'<div class="n2_form_object"><div style="font-family: sans-serif;">\n'
+'{{#book}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Name</div>\n'
+'<div style="float:left;width:65%;" class="value">{{name}}</div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{#description}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Description</div>\n'
+'<div style="float:left;width:65%;" class="value n2s_preserveSpaces">{{description}}</div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{/description}}\n'
+'{{/book}}\n'
+'{{#nunaliit_source}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Author</div>\n'
+'<div style="float:left;width:65%;" class="value"><a class=\"n2s_referenceLink\" href=\".\">{{doc}}</a></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{/nunaliit_source}}\n'
+'</div></div>'
		  ,"form": 
'<div class="n2_form_object"><div>\n'
+'{{#book}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Name</div>\n'
+'<div style="float:left;width:65%;" class="value"><input type="text" class="{{#:input}}name{{/:input}}"/></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Description</div>\n'
+'<div style="float:left;width:65%;" class="value"><textarea class="{{#:input}}description{{/:input}}"></textarea></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{/book}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Author</div>\n'
+'<div style="float:left;width:65%;" class="value"><input type="text" class="{{#:input}}nunaliit_source,reference{{/:input}}"/></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'</div></div>'
		  ,"extensions": [
 		    {
 		      "selector": ["book","author"]
 		      ,"create": false
 		      ,"schemaName": "reference"
 		    }
 		  ]
		  ,"attributes": [
		  ]
		  ,"create": {
		    "book": {}
		    ,"nunaliit_schema": "book"
		    ,"nunaliit_type": "book"
		  }
		  ,"nunaliit_type": "schema"
		  ,"nunaliit_schema": "schema"
		}
		// person
		,{
		  "name": "person"
		  ,"isRootSchema": true
		  ,"brief": "{{#person}}{{first}} {{name}}{{\/person}}"
		  ,"display": 
'<div class="n2_form_object"><div style="font-family: sans-serif;">\n'
+'{{#person}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Last Name</div>\n'
+'<div style="float:left;width:65%;" class="value">{{name}}</div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">First Name</div>\n'
+'<div style="float:left;width:65%;" class="value n2s_preserveSpaces">{{first}}</div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{/person}}\n'
+'</div></div>'
		  ,"form": 
'<div class="n2_form_object"><div>\n'
+'{{#person}}\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">Last Name</div>\n'
+'<div style="float:left;width:65%;" class="value"><input type="text" class="{{#:input}}name{{/:input}}"/></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'<div>\n'
+'<div style="float:left;width:30%;" class="label n2s_localize">First Name</div>\n'
+'<div style="float:left;width:65%;" class="value"><input type="text" class="{{#:input}}first{{/:input}}"/></div>\n'
+'<div style="clear:both;"></div>\n'
+'</div>\n'
+'{{/person}}\n'
+'</div></div>'
		  ,"attributes": [
		  ]
		  ,"create": {
		    "person": {}
		    ,"nunaliit_schema": "person"
		    ,"nunaliit_type": "person"
		  }
		  ,"relatedSchemas": ["book"]
		  ,"nunaliit_type": "schema"
		  ,"nunaliit_schema": "schema"
		}
	];

	// -----------------------------------------------------------------
	function getOptionalSchemaDiv(){
		var $e = $schemaAppDiv.find('.schemaAppOptionalSchemas');
		if( $e.length < 1 ) {
			$e = $('<div class="schemaAppOptionalSchemas"></div>');
			$schemaAppDiv.append($e);
			addHeader($e);
		};
		
		var $c = $e.find('.schemaAppOptionalSchemasContent');
		if( $c.length < 1 ) {
			$c = addContent($e);
		};
		
		return $c;
		
		function addHeader($e){
			var $h = $('<h1>Optional Schemas</h1>');
			$e.append($h);
			return $h;
		};

		function addContent($e){
			var $c = $('<div class="schemaAppOptionalSchemasContent"></div>');
			$e.append($c);
			return $c;
		};
	};
	
	function refreshOptionalSchemaList(){
		var $d = getOptionalSchemaDiv();
		$d.empty().html('<div class="olkit_wait"></div>');
		
		// Get all optional schema names
		var schemaNames = [];
		for(var i=0,e=optionalSchemas.length; i<e; ++i){
			schemaNames.push( optionalSchemas[i].name );
		};
		
		// Get from the database all installed schemas
		atlasDesign.queryView({
			viewName: 'schemas'
			,keys: schemaNames
			,onSuccess: schemasReceived
			,onError: function(errorMsg){
				var e = 'Error obtaining schmas: '+errorMsg;
				var $d = getOptionalSchemaDiv();
				$d.empty().text(e);
				reportError(e);
			}
		});
		
		function schemasReceived(rows){
			var received = {};
			for(var i=0,e=rows.length; i<e; ++i){
				var name = rows[i].key;
				received[name] = rows[i];
			};
			
			var $d = getOptionalSchemaDiv();
			$d.empty();
			
			var $table = $('<table></table>');
			$d.append($table);
			
			for(var i=0,e=optionalSchemas.length; i<e; ++i){
				var schema = optionalSchemas[i];
				var name = schema.name;
				
				var isInstalled = false;
				if( received[name] ) isInstalled = true;
				
				var $tr = $('<tr></tr>');
				$table.append($tr);
				
				var $th = $('<th></th>');
				$th.text(name);
				$tr.append($th);
				
				var $td = $('<td></td>');
				$tr.append($td);
				if( isInstalled ) {
					$td.text('Installed');
				} else {
					$td.text('Not Installed');
				};
				
				var $td = $('<td></td>');
				$tr.append($td);
				if( isInstalled ) {
					var $b = $('<button>Replace</button>');
					$td.append($b);
					$b.click( createClickReplaceSchema(schema, received[name]) );
				} else {
					var $b = $('<button>Install</button>');
					$td.append($b);
					$b.click( createClickInstallSchema(schema) );
				};
			};
		};
		
		function createClickInstallSchema(schema){
			return function(e){
				installSchema(schema);
				return false;
			};
		};
		
		function createClickReplaceSchema(schema, row){
			return function(e){
				replaceSchema(schema, row.id);
				return false;
			};
		};
	};
	
	// -----------------------------------------------------------------
	function installSchema(schema){

		var $d = getOptionalSchemaDiv();
		$d.empty().html('<div class="olkit_wait"></div>');
		
		var data = $n2.extend({},schema);
		
		$n2.couchDocument.adjustDocument(data);
		
		atlasDb.createDocument({
			data: data
			,onSuccess: function(docInfo){
				log('Schema '+data.name+' created: '+docInfo.id);
				refreshOptionalSchemaList();
			}
			,onError: function(errorMsg){
				var e = 'Unable to create schema '+data.name+': '+errorMsg;
				reportError(e); 
				alert(e);
				refreshOptionalSchemaList();
			}
		});
	};
	
	// -----------------------------------------------------------------
	function replaceSchema(schema, id){

		var $d = getOptionalSchemaDiv();
		$d.empty().html('<div class="olkit_wait"></div>');
		
		var data = $n2.extend({},schema);
		$n2.couchDocument.adjustDocument(data);

		atlasDb.getDocument({
			docId: id
			,onSuccess: fetchedDoc
			,onError: function(errorMsg){ 
				var e = 'Unable to fetch current schema document ('+id+'): '+errorMsg;
				reportError(e); 
				alert(e);
				refreshOptionalSchemaList();
			}
		});
		
		function fetchedDoc(doc){
			data._id = doc._id;
			data._rev = doc._rev;
			if( doc.nunaliit_created ) {
				data.nunaliit_created = doc.nunaliit_created;
			};
			
			atlasDb.updateDocument({
				data: data
				,onSuccess: function(docInfo){
					log('Schema '+data.name+' updated: '+docInfo.id);
					refreshOptionalSchemaList();
				}
				,onError: function(errorMsg){
					var e = 'Unable to update schema '+data.name+': '+errorMsg;
					reportError(e); 
					alert(e);
					refreshOptionalSchemaList();
				}
			});
		};
	};
	
	// ********************************
	// LOGS
	// ********************************
	
	// -----------------------------------------------------------------
	function getLogsDiv(){
		var $e = $schemaAppDiv.find('.schemaAppLogs');
		if( $e.length < 1 ) {
			$e = $('<div class="schemaAppLogs"></div>');
			$schemaAppDiv.append($e);
			addHeader($e);
		};
		return $e;
		
		function addHeader($e){
			var $h = $('<h1>Logs <button>Clear</button></h1>');
			$e.append($h);
			$h.find('button').click(function(){
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
	function log(msg){
		var $e = getLogsDiv();

		var $d = $('<div class="log"></div>');
		$d.text(msg);
		$e.append($d);
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

		$schemaAppDiv = opts_.div;
		
		if( config.directory ){
			showService = config.directory.showService;
		};
		
		$schemaAppDiv.empty();
		
		// Install divs
		getOptionalSchemaDiv();
		getLogsDiv();
		
		// Start
		log('Schema application started');

		refreshOptionalSchemaList();
	};

	
	$n2.schemaApp = {
		main: main
	};
})(jQuery,nunaliit2);