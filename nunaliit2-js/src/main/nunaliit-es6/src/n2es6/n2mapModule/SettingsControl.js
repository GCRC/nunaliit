/**
* @module n2es6/n2mapModule/SettingsControl
*/

import Control from 'ol/control/Control';

/**
 * @classdesc
 * Custom control for other map settings.
 * Adapted/inspired by https://github.com/walkermatt/ol-layerswitcher/blob/master/src/ol-layerswitcher.ts
 * 
 * (Currently only) accepts a nested structure of labels and their (boolean) values
 * to render as a ul of checkboxes to toggle the state.
 * @api
 */
class SettingsControl extends Control {
	constructor(options) {
		const div = document.createElement("div");
		this.shownClassName = "settings-panel-visible";
		this.hiddenClassName = "settings-panel-hidden";
		div.classList.add(
			"ol-unselectable",
			"ol-control",
			"cinemap-to-map-settings-control",
			this.hiddenClassName
		);
		super({ element: div });

		this.dispatchService = options.dispatchService;

		this.button = document.createElement("button");
		div.append(this.button);

		this.panel = document.createElement("div");
		this.panel.classList.add("settings-control-panel");
		div.append(this.panel);

		this.button.addEventListener("click", (ev) => {
			if (this.element.classList.contains(this.hiddenClassName)) {
				this.showSettingsPanel();
			}
			else {
				this.hideSettingsPanel();
			}
			ev.preventDefault();
		});
	}

	showSettingsPanel() {
		if (!this.element.classList.contains(this.shownClassName)) {
			this.element.classList.add(this.shownClassName);
			this.renderPanel();
		}
	}

	hideSettingsPanel() {
		if (this.element.classList.contains(this.shownClassName)) {
			this.element.classList.remove(this.shownClassName);
		}
	}

	renderPanel() {
		const ul = document.createElement("ul");
		this.panel.append(ul);
	}
}

export default SettingsControl;
