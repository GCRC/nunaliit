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
			for(var i=0,e=doc.nunaliit_layers.length; i<e; ++i) {
				var l = doc.nunaliit_layers[i];
				if( typeof(l) === 'string' ) {
					if( !result ) result = [];
					result.push(l);
				};
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

	,extractSearchTerms: function(doc) {
		// Returns a map of words with associated usage.
		// The keys in the map are words and the associated
		// values are objects. The value objects contain an
		// attribute 'count' that contains the number of times
		// a word is encountered. It also contains an attribute 
		// 'index' which is the earlier reference of a word in
		// a found string.
	
		var result = [];
		
		var map = {};
		n2utils.extractWords(doc,map,'');
		
		return map;
	}
	
	,excludedSearchAttributes: [
		'_id'
		,'_rev'
		,'nunaliit_geom'
	]
	
//	,reWordSplit: /[^a-zA-Z0-9\x80-\xff]+/
	// handle extended characters
	,reWordSplit: /[\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/ 

	,extractWords: function(obj, map, path) {
		// Traverses an object to find all string elements.
		// For each string element, split up in words.
		// Save each word in a map, with the number of times
		// the word is encountered (count) and the index of the word in 
		// the string it is found, favouring earlier indices.
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( typeof(obj) === 'string' ) {
			var words = obj.split( n2utils.reWordSplit );
			for(var i=0,e=words.length; i<e; ++i) {
				var word = words[i].toLowerCase();
				if( word && word !== '' ) {
					if( map[word] ) {
						map[word].count++;
						if( i < map[word].index ) {
							map[word].index = i;
						};
					} else {
						map[word] = {
							index: i
							,count: 1
						};
					};
				};
			};
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				n2utils.extractWords(obj[i],map,path+i+'.');
			};

		} else if( typeof(obj) === 'object' ) {
			for(var key in obj) {
				var s = path+key;
				
				if( n2utils.excludedSearchAttributes.indexOf(s) < 0 ) {
					n2utils.extractWords(obj[key],map,s+'.');
				};
			};
		};
	}

	,extractTypes: function(obj, result) {
		// Traverses an object to find all structure types.
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				n2utils.extractTypes(obj[i],result);
			};

		} else if( typeof(obj) === 'object' ) {
			if( obj.nunaliit_type ) {
				// This is a type
				result[obj.nunaliit_type] = 1;
			};
			
			// Continue traversing
			for(var key in obj) {
				var value = obj[key];
				
				n2utils.extractTypes(value,result);
			};
		};
	}

	,extractSpecificType: function(obj, type, result) {
		// Traverses an object to find all components of a
		// given type.
		
		if( null === obj ) {
			// Nothing to do
			
		} else if( n2utils.isArray(obj) ) {
			for(var i=0,e=obj.length; i<e; ++i) {
				n2utils.extractSpecificType(obj[i],type,result);
			};

		} else if( typeof(obj) === 'object' ) {
			if( obj.nunaliit_type && obj.nunaliit_type === type ) {
				// This is an object of interest
				result.push(obj);
			} else {
				// This is not what we are looking for. Continue searching.
				for(var key in obj) {
					var value = obj[key];
					
					n2utils.extractSpecificType(value,type,result);
				};
			};
		};
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
};

if( typeof(exports) === 'object' ) {
	exports.isArray = n2utils.isArray;
	exports.isValidBounds = n2utils.isValidBounds;
	exports.isValidGeom = n2utils.isValidGeom;
	exports.extractLayers = n2utils.extractLayers;
	exports.extractLinks = n2utils.extractLinks;
	exports.extractSpecificType = n2utils.extractSpecificType;
	exports.extractGeometries = n2utils.extractGeometries;
	exports.getAtlasRole = n2utils.getAtlasRole;
};

if( typeof(nunaliit2) === 'function' ) {
	nunaliit2.couchUtils = {};
	nunaliit2.couchUtils.isArray = n2utils.isArray;
	nunaliit2.couchUtils.isValidBounds = n2utils.isValidBounds;
	nunaliit2.couchUtils.isValidGeom = n2utils.isValidGeom;
	nunaliit2.couchUtils.extractLayers = n2utils.extractLayers;
	nunaliit2.couchUtils.extractLinks = n2utils.extractLinks;
	nunaliit2.couchUtils.extractSpecificType = n2utils.extractSpecificType;
	nunaliit2.couchUtils.extractGeometries = n2utils.extractGeometries;
	nunaliit2.couchUtils.getAtlasRole = n2utils.getAtlasRole;
};