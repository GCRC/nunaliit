/*
Copyright (c) 2016, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

*/

;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.geometry'
;

// =============================================
var Geometry = $n2.Class('Geometry',{
	
});

//=============================================
var Point = $n2.Class('Point', Geometry,{
	x: undefined,
	
	y: undefined,
	
	z: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			x: undefined
			,y: undefined
			,z: undefined
		},opts_);
		
		this.x = opts.x;
		this.y = opts.y;
		this.z = opts.z;
	},
	
	toString: function(){
		return 'POINT(' + this.x 
			+ ' ' + this.y 
			+ (this.z !== undefined ? ' ' + this.z : '') 
			+ ')';
	}
});

//=============================================
var LineString = $n2.Class('LineString', Geometry,{

	points: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			points: undefined
		},opts_);
		
		var _this = this;

		this.points = [];
		
		if( $n2.isArray(opts.points) ){
			opts.points.forEach(function(point){
				_this.points.push(point);
			});
		};
	},
	
	getPoints: function(){
		return this.points;
	},
	
	toString: function(){
		var acc = [];
		acc.push('LINESTRING(');
		var first = true;
		this.points.forEach(function(point){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};
			
			acc.push(point.x);
			acc.push(' ');
			acc.push(point.y);
			
			if( undefined !== point.z ){
				acc.push(' ');
				acc.push(point.z);
			};
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var Polygon = $n2.Class('Polygon', Geometry,{

	linearRings: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			linearRings: undefined
		},opts_);
		
		var _this = this;

		this.linearRings = [];
		
		if( $n2.isArray(opts.linearRings) ){
			opts.linearRings.forEach(function(linearRing){
				_this.linearRings.push(linearRing);
			});
		};
	},
	
	getLinearRings: function(){
		return this.linearRings;
	},
	
	toString: function(){
		var acc = [];
		acc.push('POLYGON(');
		var first = true;
		this.linearRings.forEach(function(linearRing){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};

			acc.push('(');

			var points = linearRing.getPoints();
			var firstPoint = true;
			points.forEach(function(point){
				if( firstPoint ){
					firstPoint = false;
				} else {
					acc.push(',');
				};

				acc.push(point.x);
				acc.push(' ');
				acc.push(point.y);
				
				if( undefined !== point.z ){
					acc.push(' ');
					acc.push(point.z);
				};
			});

			acc.push(')');
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var GeometryCollection = $n2.Class('GeometryCollection', Geometry,{

	geometries: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			geometries: undefined
		},opts_);
		
		var _this = this;

		this.geometries = [];
		
		if( $n2.isArray(opts.geometries) ){
			opts.geometries.forEach(function(geometry){
				_this.geometries.push(geometry);
			});
		};
	},
	
	getGeometries: function(){
		return this.geometries;
	},
	
	toString: function(){
		var acc = [];
		acc.push('GEOMETRYCOLLECTION(');
		var first = true;
		this.geometries.forEach(function(geometry){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};

			acc.push(geometry.toString());
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var GeometryAssembly = $n2.Class('GeometryAssembly', Geometry,{

	getSize: function(){
		throw new Error('Subclasses to GeometryAssembly must implements getSize()');
	},
	
	getGeometries: function(){
		throw new Error('Subclasses to GeometryAssembly must implements getGeometries()');
	}
});

//=============================================
var MultiPoint = $n2.Class('MultiPoint', GeometryAssembly,{

	points: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			points: undefined
		},opts_);
		
		var _this = this;

		this.points = [];
		
		if( $n2.isArray(opts.points) ){
			opts.points.forEach(function(point){
				_this.points.push(point);
			});
		};
	},

	getSize: function(){
		return points.length;
	},
	
	getGeometries: function(){
		return this.points;
	},
	
	toString: function(){
		var acc = [];
		acc.push('MULTIPOINT(');
		var first = true;
		this.points.forEach(function(point){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};

			acc.push('(');
			
			acc.push(point.x);
			acc.push(' ');
			acc.push(point.y);
			
			if( undefined !== point.z ){
				acc.push(' ');
				acc.push(point.z);
			};

			acc.push(')');
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var MultiLineString = $n2.Class('MultiLineString', GeometryAssembly,{

	lineStrings: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			points: undefined
		},opts_);
		
		var _this = this;

		this.lineStrings = [];
		
		if( $n2.isArray(opts.lineStrings) ){
			opts.lineStrings.forEach(function(lineString){
				_this.lineStrings.push(lineString);
			});
		};
	},

	getSize: function(){
		return lineStrings.length;
	},
	
	getGeometries: function(){
		return this.lineStrings;
	},
	
	toString: function(){
		var acc = [];
		acc.push('MULTILINESTRING(');
		var first = true;
		this.lineStrings.forEach(function(lineString){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};

			acc.push('(');
			
			var points = lineString.getPoints();
			var firstPoint = true;
			points.forEach(function(point){
				if( firstPoint ){
					firstPoint = false;
				} else {
					acc.push(',');
				};
				
				acc.push(point.x);
				acc.push(' ');
				acc.push(point.y);
				
				if( undefined !== point.z ){
					acc.push(' ');
					acc.push(point.z);
				};
			});

			acc.push(')');
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var MultiPolygon = $n2.Class('MultiPolygon', GeometryAssembly,{

	polygons: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			polygons: undefined
		},opts_);
		
		var _this = this;

		this.polygons = [];
		
		if( $n2.isArray(opts.polygons) ){
			opts.polygons.forEach(function(polygon){
				_this.polygons.push(polygon);
			});
		};
	},

	getSize: function(){
		return polygons.length;
	},
	
	getGeometries: function(){
		return this.polygons;
	},
	
	toString: function(){
		var acc = [];
		acc.push('MULTIPOLYGON(');
		var first = true;
		this.polygons.forEach(function(polygon){
			if( first ){
				first = false;
			} else {
				acc.push(',');
			};

			acc.push('(');
			
			var linearRings = polygon.getLinearRings();
			var firstLinearRing = true;
			linearRings.forEach(function(linearRing){
				if( firstLinearRing ){
					firstLinearRing = false;
				} else {
					acc.push(',');
				};

				acc.push('(');
				
				var points = linearRing.getPoints();
				var firstPoint = true;
				points.forEach(function(point){
					if( firstPoint ){
						firstPoint = false;
					} else {
						acc.push(',');
					};
					
					acc.push(point.x);
					acc.push(' ');
					acc.push(point.y);
					
					if( undefined !== point.z ){
						acc.push(' ');
						acc.push(point.z);
					};
				});

				acc.push(')');
			});
			
			acc.push(')');
		});
		acc.push(')');
		return acc.join('');
	}
});

//=============================================
var CharacterStream = $n2.Class({
	
	str: undefined,
	
	index: undefined,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			str: undefined
		},opts_);
		
		if( typeof opts.str !== 'string' ){
			throw new Error('CharacterStream must be initialized with a string');
		};
		
		this.str = opts.str;
		
		this.index = 0;
	},
	
	getPosition: function(){
		return this.index;
	},
	
	setPosition: function(index){
		if( index > this.str.length ){
			throw new Error('CharacterStream.setPosition() index is out of bounds');
		};
		this.index = index;
	},
	
	peekChar: function(){
		if(this.index < this.str.length){
			return this.str[this.index];
		};
		return undefined;
	},
	
	getChar: function(){
		if(this.index < this.str.length){
			var c = this.str[this.index];
			++this.index;
			return c;
		};
		return undefined;
	},
	
	startsWith: function(str, ignoreCase){
		var sizeLeft = this.str.length - this.index;
		if( sizeLeft < str.length ){
			return false;
		};
		
		var portion = this.str.substr(this.index, str.length);
		
		if( ignoreCase ){
			return str.toLowerCase() === portion.toLowerCase();
		} else {
			return str === portion;
		};
	},
	
	skipCharacters: function(count){
		if( this.index + count > this.str.length ){
			throw new Error('CharacterStream.skipCharacters() out of bounds');
		};
		
		this.index += count;
	},
	
	skipSpaces: function(){
		while(this.index < this.str.length){
			var c = this.str[this.index];
			if( isSpace(c) ){
				++this.index;
			} else {
				break;
			};
		};

		function isSpace(c){
			if( ' ' === c 
			 || '\n' === c 
			 || '\r' === c ){
				return true;
			};
			return false;
		};
	}
});

//=============================================
var WktParser = $n2.Class({
	initialize: function(){
		
	},
	
	parseWkt: function(str){
		var stream = new CharacterStream({
			str: str
		});
		
		return this._parseWktFromStream(stream);
	},
	
	_parseWktFromStream: function(stream){
		stream.skipSpaces();
		
		// POINT(x y) or POINT(x y z)
		if( stream.startsWith("POINT(",true) ){
			stream.skipCharacters("POINT(".length);
			var point = this._parsePoint(stream);
			stream.skipSpaces();
			var c = stream.getChar();
			if( ')' !== c ){
				throw new Error('Unexpected character at position: '+stream.getPosition());
			};
			return point;

		} else if( stream.startsWith("MULTIPOINT(",true) ){
			// MULTIPOINT((x y))
			// MULTIPOINT((x y),(x y))
			// MULTIPOINT(x y)
			// MULTIPOINT(x y, x y)
			var points = [];
			stream.skipCharacters("MULTIPOINT(".length);
			stream.skipSpaces();

			var done = false;
			while( !done ){
				var c = stream.peekChar();
				if( '(' === c ){
					// (x y) (x y z)
					stream.getChar();
					var point = this._parsePoint(stream);
					points.push(point);
					stream.skipSpaces();
					var end = stream.getChar();
					if( ')' !== end ){
						throw new Error('Expected character ")" at position: '+stream.getPosition());
					};
					
				} else {
					// x y
					// x y z
					var point = this._parsePoint(stream);
					points.push(point);
				};

				// Check if we reached end
				c = stream.peekChar();
				if( ')' === c ){
					stream.getChar();
					done = true;
				};
				
				// If not done, we are expecting a ","
				if( !done ){
					stream.skipSpaces();
					var comma = stream.getChar();
					if( ',' !== comma ){
						throw new Error('Expected character "," at position: '+stream.getPosition());
					};
					stream.skipSpaces();
				};
			};

			var multiPoint = new MultiPoint({points:points});
			return multiPoint;
		};
	},
	
	_parsePoint: function(stream){
		stream.skipSpaces();
		var x = this._parseNumber(stream);
		stream.skipSpaces();
		var y = this._parseNumber(stream);
		
		// Third position?
		var z;
		var c = stream.peekChar();
		if( ' ' === c ){
			stream.skipSpaces();
			z = this._parseNumber(stream);
		};
		
		var point = new Point({
			x: x
			,y: y
			,z: z
		});
		
		return point;
	},
	
	_parseNumber: function(stream){
		var position = stream.getPosition();
		
		var factor = 1;
		var c = stream.peekChar();
		if( '-' === c ){
			stream.getChar();
			factor = -1;
			c = stream.peekChar();
		};

		var value = 0;
		if( '0' <= c && '9' >= c ){
			while( '0' <= c && '9' >= c ){
				stream.getChar();
				value = value * 10;
				value = value + c - '0';
				c = stream.peekChar();
			};
			
			if( '.' === c ){
				stream.getChar();

				// Floating point
				var frac = 1;
				c = stream.peekChar();
				while( '0' <= c && '9' >= c ){
					stream.getChar();
					frac = frac / 10;
					value = value + (frac * (c - '0'));
					c = stream.peekChar();
				};
			};
		} else {
			stream.setPosition(position);
			throw new Error('Number expected at position: '+position);
		};
		
		return factor * value;
	}
});

//=============================================
function compareGeometries(geom1, geom2){
	if( geom1 === geom2 ) return 0;
	if( !geom1 ) return -1;
	if( !geom2 ) return 1;
	
	// If not the same class, order using class name
	if( geom1.getClass() !== geom2.getClass() ){
		// Different classes
		var className1 = geom1._classname;
		var className2 = geom2._classname;

		// The following line takes care of undefined === undefined
		if( className1 === className2 ) return 0;
		
		if( !className1 ) return -1;
		if( !className2 ) return 1;

		if( className1 < className2 ) return -1;
		if( className1 > className2 ) return 1;
	};
	
	// At this point, both geometries are from the same class
	if( geom1.getClass() === Point ){
		return comparePoints(geom1, geom2);
	};
	if( geom1.getClass() === MultiPoint ){
		return compareMultiPoints(geom1, geom2);
	};
	if( geom1.getClass() === LineString ){
		return compareLineStrings(geom1, geom2);
	};
	if( geom1.getClass() === MultiLineString ){
		return compareMultiLineStrings(geom1, geom2);
	};
	if( geom1.getClass() === Polygon ){
		return comparePolygons(geom1, geom2);
	};
	if( geom1.getClass() === MultiPolygon ){
		return compareMultiPolygons(geom1, geom2);
	};
	if( geom1.getClass() === GeometryCollection ){
		return compareCollections(geom1.getGeometries(), geom2.getGeometries());
	};

	throw new Error('Unable to compare geometries: '+geom1._classname+' '+geom2._classname);
	
	function comparePoints(point1, point2){
		if( point1.x !== point2.x ){
			return point1.x - point2.x;
		};
		if( point1.y !== point2.y ){
			return point1.y - point2.y;
		};
		if( point1.z !== point2.z ){
			if( typeof point1.z === 'number' 
			 && typeof point2.z === 'number' ){
				return point1.z - point2.z;
			};
			if( typeof point1.z === undefined ){
				return -1;
			};
			if( typeof point1.z === null ){
				return -1;
			};
			if( typeof point2.z === undefined ){
				return 1;
			};
			if( typeof point2.z === null ){
				return 1;
			};
		};
		return 0;
	};

	function compareMultiPoints(multiPoint1, multiPoint2){
		var geoms1 = multiPoint1.getGeometries();
		var geoms2 = multiPoint2.getGeometries();
		
		return compareCollections(geoms1, geoms2)
	};

	function compareLineStrings(lineString1, lineString2){
		var points1 = lineString1.getPoints();
		var points2 = lineString2.getPoints();
		
		if( points1.length !== points2.length ){
			return points1.length - points2.length;
		};

		for(var i=0,e=points1.length; i<e; ++i){
			var point1 = points1[i];
			var point2 = points2[i];
			
			var c = comparePoints(point1, point2);
			if( 0 !== c ) return c;
		};
		
		return 0;
	};

	function compareMultiLineStrings(multiLineString1, multiLineString2){
		var geoms1 = multiLineString1.getGeometries();
		var geoms2 = multiLineString2.getGeometries();
		
		return compareCollections(geoms1, geoms2)
	};

	function comparePolygons(poly1, poly2){
		var linearRings1 = poly1.getLinearRings();
		var linearRings2 = poly2.getLinearRings();
		
		if( linearRings1.length !== linearRings2.length ){
			return linearRings1.length - linearRings2.length;
		};

		for(var i=0,e=linearRings1.length; i<e; ++i){
			var linearRing1 = linearRings1[i];
			var linearRing2 = linearRings2[i];
			
			var c = compareLineStrings(linearRing1, linearRing2);
			if( 0 !== c ) return c;
		};
		
		return 0;
	};

	function compareMultiPolygons(multiPolygon1, multiPolygon2){
		var geoms1 = multiPolygon1.getGeometries();
		var geoms2 = multiPolygon2.getGeometries();
		
		return compareCollections(geoms1, geoms2)
	};

	function compareCollections(collection1, collection2){
		if( collection1.length !== collection2.length ){
			return collection1.length - collection2.length;
		};
		
		var clone1 = collection1.slice();
		var clone2 = collection2.slice();
		
		clone1.sort(compareGeometries);
		clone2.sort(compareGeometries);

		for(var i=0,e=clone1.length; i<e; ++i){
			var geom1 = clone1[i];
			var geom2 = clone2[i];
			
			var c = compareGeometries(geom1, geom2);
			if( 0 !== c ) return c;
		};
		
		return 0;
	};
};


//=============================================

$n2.geometry = {
	Point: Point
	,LineString: LineString
	,Polygon: Polygon
	,GeometryCollection: GeometryCollection
	,MultiPoint: MultiPoint
	,MultiLineString: MultiLineString
	,MultiPolygon: MultiPolygon
	,WktParser: WktParser
	,compareGeometries: compareGeometries
};

})(nunaliit2);
