/**
 * @module n2es6/n2mapModule/N2RotationControl
 */

import { Control } from "ol/control";
import './N2RotationControl.css';
import { get as getProjection } from 'ol/proj.js';

/**
 * @classdesc
 * The N2RotationControl class enables rotation buttons.
 * note that alt-shift-drag always works to rotate canvas
 * @api
 */

class N2RotationControl extends Control{
	constructor(opt_options) {
		const options = opt_options || {};
		
		const cwbutton = document.createElement('button');
		cwbutton.className = 'n2_ol_cw_button';
		const cwelement = document.createElement('div');
		cwelement.className = 'ol-unselectable';
		cwelement.appendChild(cwbutton);

		const ccwbutton = document.createElement('button');
		ccwbutton.className = 'n2_ol_ccw_button';
		const ccwelement = document.createElement('div');
		cwelement.className = 'ol-unselectable';
		ccwelement.appendChild(ccwbutton);

		const element = document.createElement('div');
		element.className = 'n2_rotate_button_group ol-unselectable ol-control';
		element.appendChild(cwelement);
		element.appendChild(ccwelement);
		super({
			element: element,
			target: options.target,
		});

		cwbutton.addEventListener('click', this.handleRotateCW.bind(this), false);
		ccwbutton.addEventListener('click', this.handleRotateCCW.bind(this), false);

		if(options.autoRotateCurrentPosition) {
			const lon_0 = options.lon_0 || 0;
			navigator.geolocation.getCurrentPosition((position) => {
				const long = position.coords.longitude;
				const rotationAmount = long - lon_0;
				const radianRotation = rotationAmount * 0.01745;
				this.getMap().getView().adjustRotation(radianRotation);
			});
		}
		
	}

	handleRotateCW() {
		this.getMap().getView().adjustRotation(0.5236);
	}

	handleRotateCCW() {
		this.getMap().getView().adjustRotation(-0.5236);
	}
}
export default N2RotationControl;