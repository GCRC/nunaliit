/**
* @module n2es6/n2mapModule/SettingsControl
*/

import Control from 'ol/control/Control';

/**
 * @classdesc
 * Custom control for other map settings.
 * Adapted/inspired by https://github.com/walkermatt/ol-layerswitcher/blob/master/src/ol-layerswitcher.ts
 * 
 * (Currently only) accepts an array of objects that have the following:
 * {
 * 		label - Text to be displayed for the setting option
 * 		initialState - boolean (checkboxes)
 * 		sublevel - Appearance of the setting if it should look like a sub-setting (add left padding)
 * 		interactionCallback - function reference to be called when the setting is interacted with
 * }
 * @api
 */
class SettingsControl extends Control {
	constructor(options) {
		const div = document.createElement("div");
		super({ element: div });

		this.shownClassName = "settings-panel-visible";
		div.classList.add(
			"ol-unselectable",
			"ol-control",
			"cinemap-to-map-settings-control"
		);

		this.dispatchService = options.dispatchService;
		this.settings = options.settings;

		this.button = document.createElement("button");
		div.append(this.button);

		this.panel = document.createElement("div");
		this.panel.classList.add("settings-control-panel");
		div.append(this.panel);

		this.renderPanel();

		this.button.addEventListener("click", (ev) => {
			if (!this.element.classList.contains(this.shownClassName)) {
				this.element.classList.add(this.shownClassName);
			}
			else if (this.element.classList.contains(this.shownClassName)) {
				this.element.classList.remove(this.shownClassName);
			}
			ev.preventDefault();
		});
	}

	renderPanel() {
		this.settings.forEach(setting => {
			const ul = document.createElement("ul");
			
		});
	}
}

export default SettingsControl;
