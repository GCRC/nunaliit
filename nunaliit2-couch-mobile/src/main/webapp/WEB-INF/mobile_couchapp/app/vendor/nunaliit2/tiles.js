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
	
	,getTileFromCoords: function(format, x, y) {
		var coordX = Math.floor((x - format.minx) / format.incx);
		var coordY = Math.floor((y - format.miny) / format.incy);
		
		if( coordX < 0 ) coordX = 0;
		if( coordX >= format.nx ) coordX = format.nx - 1;
		if( coordY < 0 ) coordY = 0;
		if( coordY >= format.ny ) coordY = format.ny - 1;
		
		return (coordY * format.nx) + coordX;
	}
	
	,getTilesFromBounds: function(format, minx, miny, maxx, maxy) {
		var blTile = n2tiles.getTileFromCoords(format, minx, miny);
		var brTile = n2tiles.getTileFromCoords(format, maxx, miny);
		var trTile = n2tiles.getTileFromCoords(format, maxx, maxy);
//$n2.log('blTile',blTile);
//$n2.log('brTile',brTile);
//$n2.log('trTile',trTile);

		var result = [];
		
//var count = 0;		
		var done = 0;
		var tile = blTile;
		while(!done) {
			result.push(tile);
//$n2.log('tile',tile);

			if( tile == trTile ) {
				done = 1;
			} else if( tile == brTile ) {
				blTile = (blTile + format.nx) % (format.tiles);
				brTile = (brTile + format.nx) % (format.tiles);
				tile = blTile;
			} else {
				tile = (Math.floor(tile / format.nx)) * format.nx + ((tile+1) % format.nx);
			}
//++count;
//if(count>10) return result;			
			if(result.length>format.tiles) return []; // error			
		}
		
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

n2tiles.format4326_65K = n2tiles.makeFormat(-180,-90,180,90,1,1);
n2tiles.format4326_200 = n2tiles.makeFormat(-180,-90,180,90,0.05,0.05);
n2tiles.format4326_25M = n2tiles.makeFormat(-180,-90,180,90,20,20);

if( typeof(exports) === 'object' ) {
	exports.makeFormat = n2tiles.makeFormat;
	exports.getBoundsFromTile = n2tiles.getBoundsFromTile;
	exports.getTileFromCoords = n2tiles.getTileFromCoords;
	exports.getTilesFromBounds = n2tiles.getTilesFromBounds;
	exports.getApproxTilesForBounds = n2tiles.getApproxTilesForBounds;
	exports.format4326_65K = n2tiles.format4326_65K;
	exports.format4326_200 = n2tiles.format4326_200;
	exports.format4326_25M = n2tiles.format4326_25M;
};
if( typeof(nunaliit2) === 'function' ) {
	nunaliit2.tiles = {};
	nunaliit2.tiles.makeFormat = n2tiles.makeFormat;
	nunaliit2.tiles.getBoundsFromTile = n2tiles.getBoundsFromTile;
	nunaliit2.tiles.getTileFromCoords = n2tiles.getTileFromCoords;
	nunaliit2.tiles.getTilesFromBounds = n2tiles.getTilesFromBounds;
	nunaliit2.tiles.getApproxTilesForBounds = n2tiles.getApproxTilesForBounds;
	nunaliit2.tiles.format4326_65K = n2tiles.format4326_65K;
	nunaliit2.tiles.format4326_200 = n2tiles.format4326_200;
	nunaliit2.tiles.format4326_25M = n2tiles.format4326_25M;
};