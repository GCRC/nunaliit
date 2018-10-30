"use strict";
var n2tiles = {

	format4326_65K: null
	,format4326_200: null
	,format4326_25M: null

	,makeFormat: function(minx,miny,maxx,maxy,resx,resy) {
		var tilesX = (maxx - minx) * resx;
		var tilesY = (maxy - miny) * resy;
		var tiles = tilesX * tilesY;
		
		var incx = (maxx - minx) / tilesX;
		var incy = (maxy - miny) / tilesY;
	
		return {
			minx: minx
			,miny: miny
			,maxx: maxx
			,maxy: maxy
			,resx: resx
			,resy: resy
			,tiles: tiles
			,nx: tilesX
			,ny: tilesY
			,incx: incx
			,incy: incy
		};
	}
	
	,getBoundsFromTile: function(format, tileNumber) {
		var coordX = tileNumber % format.nx;
		var coordY = (tileNumber - coordX) / format.nx;
		
		var minx = ((coordX * format.incx) + format.minx);
		var miny = ((coordY * format.incy) + format.miny);
		
		return {
			minx: minx
			,miny: miny
			,maxx: (minx + format.incx)
			,maxy: (miny + format.incy)
		};
	}
	
	,getTileFromPosition: function(format, x, y) {
		return (y * format.nx) + x;
	}
	
	,getTilePositionFromCoords: function(format, x, y) {
		var coordX = Math.floor((x - format.minx) / format.incx);
		var coordY = Math.floor((y - format.miny) / format.incy);
		
		if( coordX < 0 ) coordX = 0;
		if( coordX >= format.nx ) coordX = format.nx - 1;
		if( coordY < 0 ) coordY = 0;
		if( coordY >= format.ny ) coordY = format.ny - 1;
		
		return {
			x: coordX
			,y: coordY
			,tile: n2tiles.getTileFromPosition(format, coordX, coordY)
		};
	}
	
	,getTileFromCoords: function(format, x, y) {
		var coordX = Math.floor((x - format.minx) / format.incx);
		var coordY = Math.floor((y - format.miny) / format.incy);
		
		if( coordX < 0 ) coordX = 0;
		if( coordX >= format.nx ) coordX = format.nx - 1;
		if( coordY < 0 ) coordY = 0;
		if( coordY >= format.ny ) coordY = format.ny - 1;
		
		return n2tiles.getTileFromPosition(format, coordX, coordY);
	}
	
	,getTilesFromBounds: function(format, minx, miny, maxx, maxy, maxTiles) {
		
		var blTilePosition = n2tiles.getTilePositionFromCoords(format, minx, miny);
		var trTilePosition = n2tiles.getTilePositionFromCoords(format, maxx, maxy);
		
		var leftX = blTilePosition.x;
		var rightX = trTilePosition.x;
		var trTile = trTilePosition.tile;
		
		if( minx > maxx // wrap around situation
		 && leftX === rightX // end up on same tile
		 ){
			--rightX;
			if( rightX < 0 ){
				rightX = format.nx - 1;
			};
		};
		
//$n2.log('leftX',leftX);
//$n2.log('rightX',rightX);
//$n2.log('trTile',trTile);

		var result = [];
		
//var count = 0;		
		var done = 0;
		var x = blTilePosition.x;
		var y = blTilePosition.y;
		var tile = n2tiles.getTileFromPosition(format, x, y);
		while(!done) {
			result.push(tile);
//$n2.log('tile',tile);

			if( tile == trTile ) {
				done = 1;
				
			} else if( x == rightX ) {
				x = leftX;
				y = y + 1;
				while( y >= format.ny ){
					y = y - format.ny;
				};
				
			} else {
				x = x + 1;
				while( x >= format.nx ){
					x = x - format.nx;
				};
			}

			tile = n2tiles.getTileFromPosition(format, x, y);
//++count;
//if(count>10) return result;
			if(result.length>format.tiles) return []; // error			
			if( maxTiles && result.length>maxTiles) return []; // max reached
		};
		
		return result;
	}
	
	,getApproxTilesForBounds: function(format, minx, miny, maxx, maxy) {
		var cX = (maxx>minx) ? ((maxx - minx) / format.incx) :
			(((format.maxx - maxx) + (minx - format.minx)) / format.incx);
		var cY = (maxy>miny) ? ((maxy - miny) / format.incy) :
			(((format.maxy - maxy) + (miny - format.miny)) / format.incy);
		
		return (Math.floor(cX)+1) * (Math.floor(cY) + 1);
	}
};

//n2tiles.format4326_65K = n2tiles.makeFormat(-180,-90,180,90,1,1);
n2tiles.format4326_200 = {
minx: -180
,miny: -90
,maxx: 180
,maxy: 90
,resx: 0.05
,resy: 0.05
,tiles: 162
,nx: 18
,ny: 9
,incx: 20
,incy: 20
};

//n2tiles.format4326_200 = n2tiles.makeFormat(-180,-90,180,90,0.05,0.05);
n2tiles.format4326_65K = {
minx: -180
,miny: -90
,maxx: 180
,maxy: 90
,resx: 1
,resy: 1
,tiles: 64800
,nx: 360
,ny: 180
,incx: 1
,incy: 1
};

//n2tiles.format4326_25M = n2tiles.makeFormat(-180,-90,180,90,20,20);
n2tiles.format4326_25M = {
minx: -180
,miny: -90
,maxx: 180
,maxy: 90
,resx: 20
,resy: 20
,tiles: 25920000
,nx: 7200
,ny: 3600
,incx: 0.05
,incy: 0.05
};

if( typeof exports === 'object' ) {
	exports.makeFormat = n2tiles.makeFormat;
	exports.getBoundsFromTile = n2tiles.getBoundsFromTile;
	exports.getTileFromCoords = n2tiles.getTileFromCoords;
	exports.getTilesFromBounds = n2tiles.getTilesFromBounds;
	exports.getApproxTilesForBounds = n2tiles.getApproxTilesForBounds;
	exports.format4326_65K = n2tiles.format4326_65K;
	exports.format4326_200 = n2tiles.format4326_200;
	exports.format4326_25M = n2tiles.format4326_25M;
};
if( typeof nunaliit2 === 'function' ) {
	nunaliit2.tiles = {};
	nunaliit2.tiles.makeFormat = n2tiles.makeFormat;
	nunaliit2.tiles.getBoundsFromTile = n2tiles.getBoundsFromTile;
	nunaliit2.tiles.getTilePositionFromCoords = n2tiles.getTilePositionFromCoords;
	nunaliit2.tiles.getTileFromCoords = n2tiles.getTileFromCoords;
	nunaliit2.tiles.getTilesFromBounds = n2tiles.getTilesFromBounds;
	nunaliit2.tiles.getApproxTilesForBounds = n2tiles.getApproxTilesForBounds;
	nunaliit2.tiles.format4326_65K = n2tiles.format4326_65K;
	nunaliit2.tiles.format4326_200 = n2tiles.format4326_200;
	nunaliit2.tiles.format4326_25M = n2tiles.format4326_25M;
};