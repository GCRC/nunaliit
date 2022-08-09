/**
 * @module n2es6/n2mapModule/N2MapSpy
 */

import { getRenderPixel } from 'ol/render'

/**
 * @classdesc
 * The N2MapSpy class enables the ability to compare tile layers 
 * with a spyglass feature in OpenLayers 6
 * @api
 */

class N2MapSpy {
	constructor(opt_options) {
		this.options = $n2.extend({
			elem: undefined,
			radius: 100,
			overlayLayers: undefined,
		}, opt_options);
	}
	setMap = function (customMap) {
		const this_ = this;

		document.addEventListener('keydown', function (evt) {
			if (evt.key === "ArrowUp") {
				this_.options.radius = Math.min(this_.options.radius + 5, 1000);
				customMap.render();
				evt.preventDefault();
			} else if (evt.key === "ArrowDown") {
				this_.options.radius = Math.max(this_.options.radius - 5, 1);
				customMap.render();
				evt.preventDefault();
			} else if (evt.key === " ") {
				this_.options.radius = 150;
				customMap.render();
				evt.preventDefault();
			}
		});

		// get the pixel position with every move
		let mousePosition = null;

		this_.options.elem.addEventListener('mousemove', function (event) {
			mousePosition = customMap.getEventPixel(event);
			customMap.render();
		});

		this_.options.elem.addEventListener('mouseout', function () {
			mousePosition = null;
			customMap.render();
		});

		// before rendering the layer, do some clipping
		let i = 0;
		this_.options.overlayLayers.forEach(ml => {
			++i;
			if (i > 1) {
				ml.on('prerender', function (event) {
					const ctx = event.context;
					ctx.save();
					ctx.beginPath();
					if (mousePosition) {
						// only show a circle around the mouse
						const pixel = getRenderPixel(event, mousePosition);
						const offset = getRenderPixel(event, [
							mousePosition[0] + this_.options.radius,
							mousePosition[1],
						]);
						const canvasRadius = Math.sqrt(
							Math.pow(offset[0] - pixel[0], 2) + Math.pow(offset[1] - pixel[1], 2)
						);
						ctx.arc(pixel[0], pixel[1], canvasRadius, 0, 2 * Math.PI);
						ctx.lineWidth = (5 * canvasRadius) / this_.options.radius;
						ctx.strokeStyle = 'rgba(0,0,0,0.5)';
						ctx.stroke();
					}
					ctx.clip();

				});

				// after rendering the layer, restore the canvas context
				ml.on('postrender', function (event) {
					const ctx = event.context;
					ctx.restore();
				});
			}
		});
	}
}


export default N2MapSpy