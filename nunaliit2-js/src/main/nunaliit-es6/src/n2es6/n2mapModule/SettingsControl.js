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

		this.DH = "CinemapToMapCanvasSettingsControl";
		this.dispatchService = options.dispatchService;
		this.settings = options.settings;
		this.keyControlMap = new Map();

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
			const uid = $n2.getUniqueId();
			const li = document.createElement("li");
			const label = document.createElement("label");
			const checkbox = document.createElement("input");

			checkbox.type = "checkbox";
			checkbox.id = uid;
			checkbox.checked = setting.initialState;
			checkbox.addEventListener("change", (ev) => {
				this.dispatchService.send(this.DH, {
					type: "cinemapToMapSettingsUpdate",
					key: setting.key,
					state: ev.target.checked
				});
			});

			this.keyControlMap.set(setting.key, checkbox);

			label.htmlFor = uid;
			label.innerHTML = setting.label;
			// use setting.sublevel to determine padding-left
			li.append(checkbox, label);
			ul.append(li);
			this.panel.append(ul);
		});
	}

	updateControlByKey(key, state) {
		const control = this.keyControlMap.get(key);
		if (control === undefined) return;
		control.checked = state;
	}
}

export default SettingsControl;