/**
* @module n2es6/n2mapModule/N2StackingHistory
*/
import {listen, unlisten} from 'ol/events.js';
class N2StackingHistory {

	constructor(opt_options){
		var opts = $n2.extend({
			map: null,
			precision: 0.0000001
		}, opt_options)
		this._history = {};
		this._map = opts.map;
		this._precision = opts.precision;
		listen(this._map, 'postcompose', this.clear , this);
		//listen(this._map, '', , this);
	}

	getStackingHistory(ext){
		var rst = undefined;
		var hashkey = undefined;
		if (Array.isArray(ext) && ext.length === 4){
			hashkey = ext[0] + '' + ext[1];
		}

		if ( this._history[hashkey] ){
			rst = this._history[hashkey] ;
		}

		return	rst;
	}

	addStackingHistory(ext, extraInfo){
		var hashkey = undefined;
		if (Array.isArray(ext) && ext.length === 4){
			hashkey =  ext[0] +''+ ext[1];
		}

		var pointInfo = {
			extra: extraInfo
		};

		if ( !this._history[hashkey] ){
			this._history[hashkey] = [];
		}
		this._history[hashkey].push(pointInfo);
		return this._history[hashkey];
	}

	_isCloseEnough(f1, f2){
		var precision = this._precision;
		var ext1 = f1.getGeometry().getExtent();
		var ext2 = f2.getGeometry().getExtent();
		var rst = false;
		if (ext1[1] !== ext1[3]
			|| ext1[0] !== ext1[2]){
			return false;
		}
		if (ext2[1] !== ext2[3]
			|| ext2[0] !== ext2[2]){
			return false;
		}
		if ( Math.abs(ext1[0] - ext2[0]) <= precision
			&& Math.abs(ext1[1] - ext2[1]) <= precision ){
			rst = true;
		}
		return rst;
	}

	clear(){
		for (var key in this._history) {
		delete this._history[key];
		}
	}
}

export default N2StackingHistory;
