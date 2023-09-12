/**
 * @module n2es6/olNunaliitSupport/N2OpenLayersExtOverrides.js
 */

import { default as N2Select } from '../n2mapModule/N2Select.js'

export function NunaliitEditBarOverrides(ins) {
    ins._setSelectInteraction = function (options) {
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
            // Nunaliit customization
            if (options.interactions.Select instanceof ol_interaction_Select
                || options.interactions.Select instanceof N2Select) {
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

    ins.setModifyWithSelect = function (active) {
        this.modifyWithSelect = active || false
    }

    ins.activateModify = function () {
        this._interactions['ModifySelect'].setActive(true);
    }

    ins.deactivateModify = function () {
        this._interactions['ModifySelect'].setActive(false);
    }
}

export function NunaliitModifyFeatureOverrides(ins) {
    
}