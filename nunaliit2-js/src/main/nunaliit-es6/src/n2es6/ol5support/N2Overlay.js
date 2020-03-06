/**
 * @module n2es6/ol5support/N2Overlay
 */
import Overlay from 'ol/Overlay.js';
import {assign} from 'ol/obj.js';
/**
 * @classdesc
 * The N2Control class is the core component of nunaliit
 * atlas. It connects the style system in nunaliit and the
 * feature overlay in openlayers 5
 */

class N2Overlay extends Overlay {
	constructor(options){
		options = assign({}
		, options);
		super(options);

		if (!options.map) {
			throw new Error('N2Overlay: map is required');
		} else {
			this._map = options.map;
		}

		if (!options.select) {
			this._select = getDefaultSelects();
		}



		this._interactions = options.interactions ? options.interactions :
			getDefaultInteractions();

		this._select.on('');




	}

	getDefaultSelects() {

	}

}
export default N2Overlay;
