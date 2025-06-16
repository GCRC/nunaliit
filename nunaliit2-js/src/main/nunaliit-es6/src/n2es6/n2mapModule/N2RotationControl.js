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
		
		const cwTemplate = document.createElement('template');
		cwTemplate.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-clockwise" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
</svg>`
		const cwbutton = document.createElement('button');
		cwbutton.appendChild(cwTemplate.content.cloneNode(true));

		const cwelement = document.createElement('div');
		cwelement.className = 'ol-unselectable';
		cwelement.appendChild(cwbutton);

		const ccwTemplate = document.createElement('template');
		ccwTemplate.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-counterclockwise" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2z"/>
  <path d="M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466"/>
</svg>`;
		const ccwbutton = document.createElement('button');
		ccwbutton.appendChild(ccwTemplate.content.cloneNode(true));

		const ccwelement = document.createElement('div');
		cwelement.className = 'ol-unselectable';
		ccwelement.appendChild(ccwbutton);

		const element = document.createElement('div');
		element.className = 'rotate-button-group ol-unselectable ol-control';
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