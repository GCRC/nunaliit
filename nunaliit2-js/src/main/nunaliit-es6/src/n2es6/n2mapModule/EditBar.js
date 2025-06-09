

/**
* @module n2es6/n2mapModule/EditBar
*/

import ol_control_Bar from 'ol-ext/control/Bar.js'
import ol_control_Button from 'ol-ext/control/Button.js'
import ol_control_Editbar from 'ol-ext/control/EditBar.js'

import { shiftKeyOnly as ol_events_condition_shiftKeyOnly } from 'ol/events/condition.js'
import { click as ol_events_condition_click } from 'ol/events/condition.js'
import ol_interaction_Select from 'ol/interaction/Select.js'

import { default as N2Select } from './N2Select.js';

import ol_interaction_ModifyFeature from 'ol-ext/interaction/ModifyFeature.js'
import ol_control_Toggle from 'ol-ext/control/Toggle.js'
import ol_interaction_Delete from 'ol-ext/interaction/Delete.js'
import ol_interaction_Offset from 'ol-ext/interaction/Offset.js'
import ol_interaction_Transform from 'ol-ext/interaction/Transform.js'
import ol_interaction_Split from 'ol-ext/interaction/Split.js'

class EditBar extends ol_control_Editbar {
	constructor(options) {
		super(options)
		this.modifyWithSelect = true
	}

	activateModify() {
		this._interactions['ModifySelect'].setActive(true);
	}

	deactivateModify() {
		this._interactions['ModifySelect'].setActive(false);
	}

	setModifyWithSelect(isActive) {
		this.modifyWithSelect = isActive || false
	}

	// override
	_setSelectInteraction(options) {
		var self = this

		// Sub bar
		var sbar = new ol_control_Bar()
		var selectCtrl

		// Delete button
		if (options.interactions.Delete !== false) {
			if (options.interactions.Delete instanceof ol_interaction_Delete) {
				this._interactions.Delete = options.interactions.Delete
			} else {
				this._interactions.Delete = new ol_interaction_Delete()
			}
			var del = this._interactions.Delete
			del.setActive(false)
			if (this.getMap())
				this.getMap().addInteraction(del)
			sbar.addControl(new ol_control_Button({
				className: 'ol-delete',
				title: this._getTitle(options.interactions.Delete) || "Delete",
				name: 'Delete',
				handleClick: function (e) {
					// Delete selection
					del.delete(selectCtrl.getInteraction().getFeatures())
					var evt = {
						type: 'select',
						selected: [],
						deselected: selectCtrl.getInteraction().getFeatures().getArray().slice(),
						mapBrowserEvent: e.mapBrowserEvent
					}
					selectCtrl.getInteraction().getFeatures().clear()
					selectCtrl.getInteraction().dispatchEvent(evt)
				}
			}))
		}

		// Info button
		if (options.interactions.Info !== false) {
			sbar.addControl(new ol_control_Button({
				className: 'ol-info',
				name: 'Info',
				title: this._getTitle(options.interactions.Info) || "Show informations",
				handleClick: function () {
					self.dispatchEvent({
						type: 'info',
						features: selectCtrl.getInteraction().getFeatures()
					})
				}
			}))
		}

		// Select button
		if (options.interactions.Select !== false) {
			// START CUSTOM
			if (options.interactions.Select instanceof ol_interaction_Select
				|| options.interactions.Select instanceof N2Select) {
			// END CUSTOM
				this._interactions.Select = options.interactions.Select
			} else {
				this._interactions.Select = new ol_interaction_Select({
					condition: ol_events_condition_click
				})
			}
			var sel = this._interactions.Select
			selectCtrl = new ol_control_Toggle({
				className: 'ol-selection',
				name: 'Select',
				title: this._getTitle(options.interactions.Select) || "Select",
				interaction: sel,
				bar: sbar.getControls().length ? sbar : undefined,
				autoActivate: true,
				active: true
			})

			this.addControl(selectCtrl)
			sel.on('change:active', function () {
				if (!sel.getActive())
					sel.getFeatures().clear()
			})
		}
	}

	// override 
	_setModifyInteraction(options) {
		// Modify on selected features
		if (options.interactions.ModifySelect !== false && options.interactions.Select !== false) {
			if (options.interactions.ModifySelect instanceof ol_interaction_ModifyFeature) {
				this._interactions.ModifySelect = options.interactions.ModifySelect
			} else {
				this._interactions.ModifySelect = new ol_interaction_ModifyFeature({
					features: this.getInteraction('Select').getFeatures()
				})
			}
			if (this.getMap())
				this.getMap().addInteraction(this._interactions.ModifySelect)
			// Activate with select
			this._interactions.ModifySelect.setActive(this._interactions.Select.getActive())
			this._interactions.Select.on('change:active', function () {
				// START CUSTOM
				if (!this._interactions.Select.getActive()) {
					this._interactions.ModifySelect.setActive(this._interactions.Select.getActive());
				} else if (this.modifyWithSelect) {
					this._interactions.ModifySelect.setActive(this._interactions.Select.getActive());
				}
				// END CUSTOM
			}.bind(this))
		}

		if (options.interactions.Transform !== false) {
			if (options.interactions.Transform instanceof ol_interaction_Transform) {
				this._interactions.Transform = options.interactions.Transform
			} else {
				this._interactions.Transform = new ol_interaction_Transform({
					addCondition: ol_events_condition_shiftKeyOnly
				})
			}
			var transform = new ol_control_Toggle({
				html: '<i></i>',
				className: 'ol-transform',
				title: this._getTitle(options.interactions.Transform) || 'Transform',
				name: 'Transform',
				interaction: this._interactions.Transform
			})
			this.addControl(transform)
		}

		if (options.interactions.Split !== false) {
			if (options.interactions.Split instanceof ol_interaction_Split) {
				this._interactions.Split = options.interactions.Split
			} else {
				this._interactions.Split = new ol_interaction_Split({
					sources: this._source
				})
			}
			var split = new ol_control_Toggle({
				className: 'ol-split',
				title: this._getTitle(options.interactions.Split) || 'Split',
				name: 'Split',
				interaction: this._interactions.Split
			})
			this.addControl(split)
		}

		if (options.interactions.Offset !== false) {
			if (options.interactions.Offset instanceof ol_interaction_Offset) {
				this._interactions.Offset = options.interactions.Offset
			} else {
				this._interactions.Offset = new ol_interaction_Offset({
					source: this._source
				})
			}
			var offset = new ol_control_Toggle({
				html: '<i></i>',
				className: 'ol-offset',
				title: this._getTitle(options.interactions.Offset) || 'Offset',
				name: 'Offset',
				interaction: this._interactions.Offset
			})
			this.addControl(offset)
		}
	}
}

export default EditBar
