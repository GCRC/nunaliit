var n2utils = {

	isArray: function(o) {
		if( null === o ) return false;
		if( typeof(o) !== 'object' ) return false;
		if( typeof(o.length) !== 'number' ) return false;
		if( typeof(o.push) !== 'function' ) return false;
		if( typeof(o.pop) !== 'function' ) return false;
		if( typeof(o.concat) !== 'function' ) return false;
		if( typeof(o.join) !== 'function' ) return false;
		if( typeof(o.slice) !== 'function' ) return false;
		if( typeof(o.reverse) !== 'function' ) return false;
		if( typeof(o.splice) !== 'function' ) return false;
		if( typeof(o.sort) !== 'function' ) return false;
		
		return true;
	}
	
	,isArrayOfStrings: function(o) {
		if( !n2utils.isArray(o) ) return false;
		
		for(var i=0,e=o.length; i<e; ++i){
			if( typeof o[i] !== 'string' ) return false;
		};
		
		return true;
	}
	
	,isValidBounds: function(b) {
		if( false == n2utils.isArray(b) ) return false;
		if( b.length != 4 ) return false;
		var minx = b[0]
			,miny = b[1]
			,maxx = b[2]
			,maxy = b[3]
			;
		if( typeof(minx) !== 'number' ) return false;
		if( typeof(miny) !== 'number' ) return false;
		if( typeof(maxx) !== 'number' ) return false;
		if( typeof(maxy) !== 'number' ) return false;
		
		return true;
	}

	,isValidGeom: function(o) {
		if( typeof(o) !== 'object' ) return false;
		if( typeof(o.nunaliit_type) !== 'string' ) return false;
		if( typeof(o.wkt) !== 'string' ) return false;
		if( o.nunaliit_type !== 'geometry' ) return false;
		if( o.bbox ) {
			if( false == n2utils.isValidBounds(o.bbox) ) return false;
		} else {
			return false;
		};
		
		return true;
	}

	,geomSize: function(o) {
		if( typeof(o) !== 'object' ) return 0;

		if( typeof(o.wkt) === 'string' ) {
			return o.wkt.length;
		};
		
		return 0;
	}

	,extractLayers: function(doc) {
		var result = null;
		
		if( doc.nunaliit_layers
		 && n2utils.isArray(doc.nunaliit_layers) ) {
			var layerMap = {};
			
			for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i) {
				var l = doc.nunaliit_layers[i];
				if( typeof(l) === 'string' ) {
					layerMap[l] = true;
				};
			};
			
			for(var layerId in layerMap) {
				if( !result ) result = [];
				result.push(layerId);
			};
		};
		
		return result;
	}
	
	,excludedSearchTerms: [
		'a'
		,'the'
		,'of'
		,'an'
		,'and'
		,'or'
		,'by'
		,'in'
		,'to'
	]

	,extractSearchTerms: function(doc, indexing) {
		// Returns a map of words with associated usage.
		// The keys in the map are words and the associated
		// values are objects. The value objects contain an
		// attribute 'count' that contains the number of times
		// a word is encountered. It also contains an attribute 
		// 'index' which is the earlier reference of a word in
		// a found string.
	
		var strings = [];
		n2utils.extractStrings(doc,strings,null,n2utils.excludedSearchAttributes);
		
		var map = {};
		for(var i=0,e=strings.length;i<e;++i){
			n2utils.extractWordsFromString(strings[i],map,indexing);
		};
		
		return map;
	}
	
	,excludedSearchAttributes: [
		'_id'
		,'_rev'
		,'nunaliit_geom'
	]
	
	,reWordSplit: /[\x00-\x26\x28-\x2f\x3a-\x40\x5b-\x5e\x60\x7b-\x7f]+/ 

	,addWordToMap: function(word, index, map) {
		// Save each word in a map, with the number of times
		// the word is encountered (count) and the index of the word in 
		// the string it is found, favouring earlier indices.
		
		var word = word.toLowerCase();
		word = n2utils.removeApostrophe(word);
		if( word && word !== '' ) {
			if( map[word] ) {
				map[word].count++;
				if( index < map[word].index ) {
					map[word].index = index;
				};
			} else {
				var folded = n2utils.foldWord(word);
				map[word] = {
					index: index
					,count: 1
					,folded: folded
				};
			};
		};
	}

	,extractWordsFromString: function(str, map, indexing) {
		// For the string element, split up in words.
		// Save each word in a map of words, that keeps track
		// of number of times a word is encountered and the earliest
		// index it is found
		
		var words = str.split( n2utils.reWordSplit );
		for(var i=0,e=words.length; i<e; ++i) {
			n2utils.addWordToMap(words[i],i,map);
			
			if( indexing ) {
				var fragments = words[i].split('_');
				if( fragments.length > 1 ){
					for(var j=0,k=fragments.length; j<k; ++j){
						if( fragments[j].length > 0 ) {
							n2utils.addWordToMap(fragments[j],i,map);
						};
					};
				};
			};
		};
	}

	,extractStrings: function(obj, strings, currentPath, excludedPaths) {
		// Traverses an object to find all string elements.
		// Accumulate strings in the given array
		// Skip excluded paths

		for(var i=0,e=excludedPaths.length; i<e; ++i){
			// this path is excluded
			if( excludedPaths[i] === currentPath ) return;
		};
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( typeof(obj) === 'string' ) {
			strings.push(obj);
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				var p = currentPath ? currentPath+'.'+i : ''+i;
				n2utils.extractStrings(obj[i],strings,p,excludedPaths);
			};

		} else if( typeof(obj) === 'object' ) {
			for(var key in obj) {
				var p = currentPath ? currentPath+'.'+key : ''+key;
				n2utils.extractStrings(obj[key],strings,p,excludedPaths);
			};
		};
	}
	
	,foldedChars: {
0x60: 0x27
,0xc0: 0x61
,0xc1: 0x61
,0xc2: 0x61
,0xc3: 0x61
,0xc4: 0x61
,0xc7: 0x63
,0xc8: 0x65
,0xc9: 0x65
,0xca: 0x65
,0xcb: 0x65
,0xcc: 0x69
,0xcd: 0x69
,0xce: 0x69
,0xcf: 0x69
,0xd1: 0x6e
,0xd2: 0x6f
,0xd3: 0x6f
,0xd4: 0x6f
,0xd5: 0x6f
,0xd6: 0x6f
,0xd8: 0x6f
,0xd9: 0x75
,0xda: 0x75
,0xdb: 0x75
,0xdc: 0x75
,0xdd: 0x79
,0xe0: 0x61
,0xe1: 0x61
,0xe2: 0x61
,0xe3: 0x61
,0xe4: 0x61
,0xe7: 0x63
,0xe8: 0x65
,0xe9: 0x65
,0xea: 0x65
,0xeb: 0x65
,0xec: 0x69
,0xed: 0x69
,0xee: 0x69
,0xef: 0x69
,0xf1: 0x6e
,0xf1: 0x6e
,0xf2: 0x6f
,0xf3: 0x6f
,0xf4: 0x6f
,0xf5: 0x6f
,0xf6: 0x6f
,0xf8: 0x6f
,0xf9: 0x75
,0xfa: 0x75
,0xfb: 0x75
,0xfc: 0x75
,0xfd: 0x79
,0xff: 0x79
,0x0100: 0x61
,0x0101: 0x61
,0x0102: 0x61
,0x0103: 0x61
,0x0104: 0x61
,0x0105: 0x61
,0x0106: 0x63
,0x0107: 0x63
,0x0108: 0x63
,0x0109: 0x63
,0x010a: 0x63
,0x010b: 0x63
,0x010c: 0x63
,0x010d: 0x63
,0x010e: 0x64
,0x010f: 0x64
,0x0110: 0x64
,0x0111: 0x64
,0x0112: 0x65
,0x0113: 0x65
,0x0114: 0x65
,0x0115: 0x65
,0x0116: 0x65
,0x0117: 0x65
,0x0118: 0x65
,0x0119: 0x65
,0x011a: 0x65
,0x011b: 0x65
,0x011c: 0x67
,0x011d: 0x67
,0x011e: 0x67
,0x011f: 0x67
,0x0120: 0x67
,0x0121: 0x67
,0x0122: 0x67
,0x0123: 0x67
,0x0124: 0x68
,0x0125: 0x68
,0x0126: 0x68
,0x0127: 0x68
,0x0128: 0x69
,0x0129: 0x69
,0x012a: 0x69
,0x012b: 0x69
,0x012c: 0x69
,0x012d: 0x69
,0x012e: 0x69
,0x012f: 0x69
,0x0130: 0x69
,0x0131: 0x69
,0x0134: 0x6a
,0x0135: 0x6a
,0x0136: 0x6b
,0x0137: 0x6b
,0x0138: 0x6b
,0x0139: 0x6c
,0x013a: 0x6c
,0x013b: 0x6c
,0x013c: 0x6c
,0x013d: 0x6c
,0x013e: 0x6c
,0x013f: 0x6c
,0x0140: 0x6c
,0x0141: 0x6c
,0x0142: 0x6c
,0x0143: 0x6e
,0x0144: 0x6e
,0x0145: 0x6e
,0x0146: 0x6e
,0x0147: 0x6e
,0x0148: 0x6e
,0x0149: 0x6e
,0x014a: 0x6e
,0x014b: 0x6e
,0x014c: 0x6f
,0x014d: 0x6f
,0x014e: 0x6f
,0x014f: 0x6f
,0x0150: 0x6f
,0x0151: 0x6f
,0x0154: 0x72
,0x0155: 0x72
,0x0156: 0x72
,0x0157: 0x72
,0x0158: 0x72
,0x0159: 0x72
,0x015a: 0x73
,0x015b: 0x73
,0x015c: 0x73
,0x015d: 0x73
,0x015e: 0x73
,0x015f: 0x73
,0x0160: 0x73
,0x0161: 0x73
,0x0162: 0x74
,0x0163: 0x74
,0x0164: 0x74
,0x0165: 0x74
,0x0166: 0x74
,0x0167: 0x74
,0x0168: 0x75
,0x0169: 0x75
,0x016a: 0x75
,0x016b: 0x75
,0x016c: 0x75
,0x016d: 0x75
,0x016e: 0x75
,0x016f: 0x75
,0x0170: 0x75
,0x0171: 0x75
,0x0172: 0x75
,0x0173: 0x75
,0x0174: 0x77
,0x0175: 0x77
,0x0176: 0x79
,0x0177: 0x79
,0x0178: 0x79
,0x0179: 0x7a
,0x017a: 0x7a
,0x017b: 0x7a
,0x017c: 0x7a
,0x017d: 0x7a
,0x017e: 0x7a
,0x2018: 0x27
,0x2019: 0x27
,0x201b: 0x27
,0x2032: 0x27
,0x2035: 0x27
	}
	
	,foldWord: function(word) {
		var r = [];
		word = word.toLowerCase();
		for(var i=0,e=word.length;i<e;++i){
			var c = word.charCodeAt(i);
			if( c === c ) {
				// Is not NaN
				var s = n2utils.foldedChars[c];
				if( s ) {
					r.push( String.fromCharCode(s) );
				} else {
					r.push( String.fromCharCode(c) );
				};
			};
		};
		return r.join('');
	}
	
	,removeApostrophe: function(word){
		if( word.length > 1 && n2utils.isApostropheCodeChar(word.charCodeAt(0)) ) {
			word = word.substr(1,word.length-1);
		};
		if( word.length > 1 && n2utils.isApostropheCodeChar(word.charCodeAt(word.length-1)) ) {
			word = word.substr(0,word.length-1);
		};
		if( word.length > 2 && word[word.length-1] === 's' 
			&& n2utils.isApostropheCodeChar(word.charCodeAt(word.length-2)) ) {
			word = word.substr(0,word.length-2);
		};
		return word;
	}
	
	,isApostropheCodeChar: function(code){
		return (code === 0x27 || code === 0x60 
			|| code === 0x2018 || code === 0x2019 || code === 0x201b
			|| code === 0x2032 || code === 0x2035
			);
	}

	,extractTypes: function(obj, result, ancestors) {
		// Traverses an object to find all structure types.
		
		ancestors = ancestors ? ancestors : [];
		
		if( ancestors.indexOf(obj) >= 0 ) {
			// already visited
			return;
		};
		
		ancestors.push(obj);
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				n2utils.extractTypes(obj[i],result,ancestors);
			};

		} else if( typeof(obj) === 'object' ) {
			if( obj.nunaliit_type ) {
				// This is a type
				result[obj.nunaliit_type] = 1;
			};
			
			// Continue traversing
			for(var key in obj) {
				var value = obj[key];
				
				n2utils.extractTypes(value,result,ancestors);
			};
		};

		ancestors.pop();
	}

	,extractSpecificType: function(obj, type, result, ancestors) {
		// Traverses an object to find all components of a
		// given type.
		
		ancestors = ancestors ? ancestors : [];
		
		if( ancestors.indexOf(obj) >= 0 ) {
			// already visited
			return;
		};
		
		ancestors.push(obj);
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				n2utils.extractSpecificType(obj[i],type,result,ancestors);
			};

		} else if( typeof(obj) === 'object' ) {
			if( obj.nunaliit_type && obj.nunaliit_type === type ) {
				// This is an object of interest
				result.push(obj);
			} else {
				// This is not what we are looking for. Continue searching.
				for(var key in obj) {
					if( '__n2Source' === key ) continue;
					
					var value = obj[key];
					
					n2utils.extractSpecificType(value,type,result,ancestors);
				};
			};
		};
		
		ancestors.pop();
	}

	,extractLinks: function(obj, links) {
		// Traverses an object to find all link elements.
		// Return all link elements in a list.

		n2utils.extractSpecificType(obj, 'reference', links);
	}

	,extractGeometries: function(obj, geometries) {
		// Traverses an object to find all geometry elements.

		n2utils.extractSpecificType(obj, 'geometry', geometries);
	}
	
	,getAtlasRole: function(n2Atlas, role){
		if( !n2Atlas ) {
			return role;
		} else if( typeof(n2Atlas.name) === 'string' ) {
			return n2Atlas.name + '_' + role;
		};
		return role;
	}
	
	,validateDocumentStructure: function(doc, errorFn){
		
		// Ensure all nunaliit_type entries are strings
		n2utils.validateTypes(doc,errorFn);
		
		// Verify schema
		if( doc.nunaliit_schema 
		 && typeof doc.nunaliit_schema !== 'string' ){
			errorFn('If nunaliit_schema is specified, it must be a string');
		};
		
		// Verify geometries
		var geometries = [];
		n2utils.extractGeometries(doc, geometries);
		for(var i=0,e=geometries.length; i<e; ++i) {
			var geometry = geometries[i];
			
			if( !n2utils.isValidGeom(geometry) ) {
				errorFn('Invalid geometry');
			}
		};

		// Verify nunaliit_created
		if( doc.nunaliit_created ){
			if( typeof doc.nunaliit_created !== 'object' ) {
				errorFn('Field "nunaliit_created" must be an object');
			};
			if( doc.nunaliit_created.nunaliit_type !== 'actionstamp' ) {
				errorFn('"nunaliit_created" must be of type "actionstamp"');
			};
			if( typeof doc.nunaliit_created.time !== 'number' ) {
				errorFn('"nunaliit_created.time" must be a number');
			};
			if( doc.nunaliit_created.action !== 'created' ) {
				errorFn('"nunaliit_created.action" must be a "created"');
			};
		};

		// Verify nunaliit_last_updated
		if( doc.nunaliit_last_updated ){
			if( typeof doc.nunaliit_last_updated !== 'object' ) {
				errorFn('Field "nunaliit_last_updated" must be an object');
			};
			if( doc.nunaliit_last_updated.nunaliit_type !== 'actionstamp' ) {
				errorFn('"nunaliit_last_updated" must be of type "actionstamp"');
			};
			if( typeof doc.nunaliit_last_updated.time !== 'number' ) {
				errorFn('"nunaliit_last_updated.time" must be a number');
			};
			if( doc.nunaliit_last_updated.action !== 'updated' ) {
				errorFn('"nunaliit_last_updated.action" must be a "updated"');
			};
		};
		
		// Verify action stamps
		var actionStamps = [];
		n2utils.extractSpecificType(doc, 'actionstamp', actionStamps);
		for(var i=0,e=actionStamps.length; i<e; ++i) {
			var as = actionStamps[i];
			
			if( typeof as.name !== 'string' ){
				errorFn('Action stamps must have a string field named: "name"');
			};
			if( typeof as.time !== 'number' ) {
				errorFn('Action stamps must have a number field named: "time"');
			};
		};

		// Verify layers
		if( doc.nunaliit_layers ) {
			if( !n2utils.isArray(doc.nunaliit_layers) ) {
				errorFn('nunaliit_layers must be an array');
			};
			for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i) {
				if( typeof(doc.nunaliit_layers[i]) !== 'string' ) {
					errorFn('nunaliit_layers must be an array of strings');
				};
			};
		};

		// Verify l10n request
		if( 'translationRequest' === doc.nunaliit_type ) {
			if( typeof doc.str !== 'string' ) {
				errorFn('Translation requests must have a string "str"');
			}
			if( typeof doc.lang !== 'string' ) {
				errorFn('Translation requests must have a string "lang"');
			}
			if( doc.trans ) {
				if( typeof doc.trans !== 'string' ) {
					errorFn('Translation requests providing "trans" field must be string');
				}
			}
		};
	
		// Verify CSS
		if( doc.nunaliit_css ) {
			if( typeof doc.nunaliit_css !== 'object' ){
				errorFn('CSS fragments must have an object structure');
			};
			if( doc.nunaliit_css.nunaliit_type !== 'css' ){
				errorFn('CSS fragments must have a type of "css"');
			};
			if( typeof(doc.nunaliit_css.name) !== 'string' ) {
				errorFn('CSS fragments must have a string "name" property.');
			};
			if( typeof(doc.nunaliit_css.css) !== 'undefined'
			 && typeof(doc.nunaliit_css.css) !== 'string' ) {
				errorFn('CSS fragments must have a string "css" property.');
			};
		};

		// Verify submission
		if( doc.nunaliit_submission ) {
			if( typeof doc.nunaliit_submission !== 'object' ){
				errorFn('Submission documents must have an object structure');
			};
			if( typeof doc.nunaliit_submission.state !== 'string' ){
				errorFn('Submission documents must include a state');
			};
			if( typeof doc.nunaliit_submission.submitter_name !== 'string' ){
				errorFn('Submission documents must include the name of the submitter');
			};
			if( false == n2utils.isArrayOfStrings(doc.nunaliit_submission.submitter_roles) ){
				errorFn('Submission documents must include the roles of the submitter');
			};
			if( doc.nunaliit_submission.original_reserved ) {
				if( typeof doc.nunaliit_submission.original_reserved !== 'object' ){
					errorFn('Submission documents must have an object for field "original_reserved"');
				};
				if( typeof doc.nunaliit_submission.original_reserved.id !== 'string' ){
					errorFn('Submission documents must include the original identifier');
				};
			};
			if( typeof doc.nunaliit_submission.original_doc !== 'object' 
			 && typeof doc.nunaliit_submission.original_doc !== 'undefined' ){
				errorFn('In a submission document, if specified, "original_doc" must be an object');
			};
			if( typeof doc.nunaliit_submission.submitted_reserved !== 'object' 
			 && typeof doc.nunaliit_submission.submitted_reserved !== 'undefined' ){
				errorFn('In a submission document, if specified, "submitted_reserved" must be an object');
			};
			if( typeof doc.nunaliit_submission.submitted_doc !== 'object' 
			 && typeof doc.nunaliit_submission.submitted_doc !== 'undefined' ){
				errorFn('In a submission document, if specified, "submitted_doc" must be an object');
			};
			if( typeof doc.nunaliit_submission.deletion !== 'boolean' 
			 && typeof doc.nunaliit_submission.deletion !== 'undefined' ){
				errorFn('In a submission document, if specified, "deletion" must be a boolean');
			};
			if( !doc.nunaliit_submission.deletion ){
				if( !doc.nunaliit_submission.submitted_reserved ){
					errorFn('In a submission document, if not a deletion, then "submitted_reserved" must be specified');
				};
			};
			if( !doc.nunaliit_submission.submitted_reserved 
			 && !doc.nunaliit_submission.original_reserved ){
				errorFn('In a submission document, one of "submitted_reserved" or "original_reserved" must be specified');
			};
		};
		
		// Verify attachment descriptors
		if( doc.nunaliit_attachments ){
			if( typeof doc.nunaliit_attachments !== 'object' ){
				errorFn('"nunaliit_attachments" must be an object structure');
			};
			if( doc.nunaliit_attachments.nunaliit_type !== 'attachment_descriptions' ){
				errorFn('"nunaliit_attachments" must be of type "attachment_descriptions"');
			};
			if( typeof doc.nunaliit_attachments.files !== 'object' ){
				errorFn('"nunaliit_attachments" must have an object structure named "files"');
			};
			for(var attName in doc.nunaliit_attachments.files) {
				var att = doc.nunaliit_attachments.files[attName];
				
				if( typeof att !== 'object' ){
					errorFn('Attachment descriptors must be of type "object"');
				};
				if( att.attachmentName !== attName ){
					errorFn('Attachment descriptors must have a duplicate name in "attachmentName"');
				};
				if( typeof att.status !== 'string' ){
					errorFn('Attachment descriptors must have a "status" string');
				};
			};
		};
	}

	,validateTypes: function(obj, errorFn) {
		// Traverses an object to validate all fields
		// named: "nunaliit_type"
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				if( n2utils.validateTypes(obj[i],errorFn) ){
					return true;
				};
			};

		} else if( typeof(obj) === 'object' ) {
			if( obj.nunaliit_type ) {
				if( typeof obj.nunaliit_type !== 'string' ){
					errorFn('Fields named "nunaliit_type" must be strings');
					return true;
				};
			};
			
			// Continue traversing
			for(var key in obj) {
				var value = obj[key];
				
				if( n2utils.validateTypes(value,errorFn) ){
					return true;
				};
			};
		};
		
		return false;
	}
};

if( typeof(exports) === 'object' ) {
	exports.isArray = n2utils.isArray;
	exports.isArrayOfStrings = n2utils.isArrayOfStrings;
	exports.isValidBounds = n2utils.isValidBounds;
	exports.isValidGeom = n2utils.isValidGeom;
	exports.extractLayers = n2utils.extractLayers;
	exports.extractLinks = n2utils.extractLinks;
	exports.extractSearchTerms = n2utils.extractSearchTerms;
	exports.addWordToMap = n2utils.addWordToMap;
	exports.extractStrings = n2utils.extractStrings;
	exports.foldWord = n2utils.foldWord;
	exports.removeApostrophe = n2utils.removeApostrophe;
	exports.isApostropheCodeChar = n2utils.isApostropheCodeChar;
	exports.extractTypes = n2utils.extractTypes;
	exports.extractSpecificType = n2utils.extractSpecificType;
	exports.extractGeometries = n2utils.extractGeometries;
	exports.getAtlasRole = n2utils.getAtlasRole;
	exports.validateDocumentStructure = n2utils.validateDocumentStructure;
	exports.validateTypes = n2utils.validateTypes;
};

if( typeof(nunaliit2) === 'function' ) {
	nunaliit2.couchUtils = {};
	nunaliit2.couchUtils.isArray = n2utils.isArray;
	nunaliit2.couchUtils.isArrayOfStrings = n2utils.isArrayOfStrings;
	nunaliit2.couchUtils.isValidBounds = n2utils.isValidBounds;
	nunaliit2.couchUtils.isValidGeom = n2utils.isValidGeom;
	nunaliit2.couchUtils.extractLayers = n2utils.extractLayers;
	nunaliit2.couchUtils.extractLinks = n2utils.extractLinks;
	nunaliit2.couchUtils.extractSearchTerms = n2utils.extractSearchTerms;
	nunaliit2.couchUtils.addWordToMap = n2utils.addWordToMap;
	nunaliit2.couchUtils.extractStrings = n2utils.extractStrings;
	nunaliit2.couchUtils.foldWord = n2utils.foldWord;
	nunaliit2.couchUtils.removeApostrophe = n2utils.removeApostrophe;
	nunaliit2.couchUtils.isApostropheCodeChar = n2utils.isApostropheCodeChar;
	nunaliit2.couchUtils.extractTypes = n2utils.extractTypes;
	nunaliit2.couchUtils.extractSpecificType = n2utils.extractSpecificType;
	nunaliit2.couchUtils.extractGeometries = n2utils.extractGeometries;
	nunaliit2.couchUtils.getAtlasRole = n2utils.getAtlasRole;
	nunaliit2.couchUtils.validateDocumentStructure = n2utils.validateDocumentStructure;
	nunaliit2.couchUtils.validateTypes = n2utils.validateTypes;
};

