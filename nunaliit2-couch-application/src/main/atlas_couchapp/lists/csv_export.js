function(head, req) {

	provides("csv",function(){

		var csvExport = req.query.csvExport;
		
		if( !csvExport ) {
			send('csvExport is not defined');
		} else if( typeof(JSON) === 'undefined' ) {
			send('JSON is not defined');
		} else if( typeof(JSON.parse) !== 'function' ){
			send('JSON.parse is not defined');
		} else {
			// Preprocess csvExport
			csvExport = JSON.parse(csvExport);
			for(var i=0,e=csvExport.length; i<e; ++i){
				var selector = csvExport[i].select;
				csvExport[i]._s = selector.split('.');
			};
			
			// Headers
			var values = extractTitles(csvExport);
			var line = getCsvLine(values);
			send(line);
			send('\n');

			var row = null;
			while(row = getRow()) {
				if( row.doc ) {
					values = extractValues(row.doc,csvExport);
					line = getCsvLine(values);
					send(line);
					send('\n');
				};
			};
		};
	});
	
	function extractTitles(csvExport){
		var values = [];
		for(var i=0,e=csvExport.length; i<e; ++i){
			var label = csvExport[i].label;
			if( !label ) {
				label = csvExport.select;
			};
			values.push(label);
		};
		return values;
	};

	function selectValue(doc, sels, type){
		var obj = doc;
		for(var i=0,e=sels.length; i<e; ++i){
			var sel = sels[i];
			obj = obj[sel];
			if( null === obj ) {
				return '';
			} else if( typeof(obj) === 'undefined' ) {
				return '';
			};
		};

		if( null === obj ) {
			return '';
			
		} else if( typeof(obj) === 'undefined' ) {
			return '';
			
		} else if( typeof(obj) === 'string' ) {
			return obj;
			
		} else if( typeof(obj) === 'number' ) {
			return obj;
			
		} else if( 'json' === type ) {
			return JSON.stringify(obj);

		} else {
			return '';
		};
	};

	function extractValues(doc, csvExport){
		var values = [];
		for(var i=0,e=csvExport.length; i<e; ++i){
			var value = selectValue(doc, csvExport[i]._s, csvExport[i].type);
			values.push(value);
		};
		return values;
	};

	function getCsvLine(values){
		var line = [];
		for(var j=0,k=values.length; j<k; ++j){
			var value = values[j];
			if( typeof(value) === 'string' ) {
				value = value.replace(/"/g,'""');
				line.push('"'+value+'"');
			} else {
				line.push(''+value);
			};
		};
		
		return line.join(',');
	};
}