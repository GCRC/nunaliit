/**
 * @module n2es6/n2mapModule/N2MapScale
 */

import {ScaleLine} from 'ol/control';

/**
 * @classdesc
 * The N2MapScale class enables the Open Layers ScaleLine feature 
 * @api
 */

class N2MapScale {
	constructor(opt_options) {
		this.options = $n2.extend({
			unit: "imperial"
		}, opt_options);

		this.unit = this.options.unit;
	}

	setMap = function (customMap) {
		let control;
			control = new ScaleLine({
				units: this.unit,
			});
		customMap.addControl(control);
	}
}
export default N2MapScale;