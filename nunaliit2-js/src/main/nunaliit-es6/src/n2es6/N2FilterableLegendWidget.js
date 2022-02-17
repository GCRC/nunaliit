/**
* @module n2es6/N2FilterableLegendWidget
*/

/* import Feature from 'ol/Feature.js'; */

const _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
const DH = 'N2.FilterableLegendWidget';

const filterableLegends = [
    "filterableLegendWidgetWithGraphic"
];

/**
 * @classdesc
 * A legend widget that allows one to filter out the groups of documents.
 * It can optionally display a related graphic about the current information being displayed.
 * @api
 */
class N2FilterableLegendWidgetWithGraphic {
	constructor(options) {
		this.dispatchService = options.dispatchService;
        this.showService = options.showService;
        this.sourceModelId = options.sourceModelId;
        this.selectAllLabel = options.selectAllLabel;
        this.containerId = options.containerId;
        this.state = {};

        if (!this.containerId) {
            throw new Error('containerId must be specified');
        }

        if (!this.sourceModelId) {
            throw new Error('sourceModelId must be specified');
        }

        /* this.dispatchService.register(DH, 'loadedModuleContent', f);
        this.dispatchService.register(DH, 'modelStateUpdated', f);

        if (this.sourceModelId) {
            const m = {
                type: 'modelGetState'
                , modelId: this.sourceModelId
            };

            this.dispatchService.synchronousCall(DH, m);
            if (m.state) {
                this._sourceModelUpdated(m.state);
            }
        } 
        if (this.availableChoicesChangeEventName) {
            this.dispatchService.register(DH, this.availableChoicesChangeEventName, fn);
        }

        if (this.selectedChoicesChangeEventName) {
            this.dispatchService.register(DH, this.selectedChoicesChangeEventName, fn);
        }

        if (this.allSelectedChangeEventName) {
            this.dispatchService.register(DH, this.allSelectedChangeEventName, fn);
        } */
	}

    _handle (m, addr, dispatcher) {
        var _this = this;

        /* if (this.availableChoicesChangeEventName === m.type) {
            if (m.value) {
                this.availableChoices = m.value;
                this._throttledAvailableChoicesUpdated();
            }

        } else if (this.selectedChoicesChangeEventName === m.type) {
            if (m.value) {
                this.selectedChoices = m.value;
                this.selectedChoiceIdMap = {};
                this.selectedChoices.forEach(function (choiceId) {
                    _this.selectedChoiceIdMap[choiceId] = true;
                });

                this._adjustSelectedItem();
            }

        } else if (this.allSelectedChangeEventName === m.type) {
            if (typeof m.value === 'boolean') {
                this.allSelected = m.value;
                this._adjustSelectedItem();
            }
        } */
    }
}

export function widgetAvailable(message) {
    const { widgetType } = message;
    if (filterableLegends.includes(widgetType)) {
        message.isAvailable = true;
    }
}

export function widgetDisplay(message) {
    const { widgetType, widgetOptions, containerId, config } = message;
    if (!filterableLegends.includes(widgetType)) return;
    let options = {};

    if (widgetOptions) {
        const { sourceModelId } = widgetOptions;
        if (typeof sourceModelId !== "string") {
            throw new Error("sourceModelId must be a string!")
        }
        options = { ...widgetOptions };
    }

    options.containerId = containerId;

    if (config && config.directory) {
        options.dispatchService = config.directory.dispatchService;
        options.showService = config.directory.showService;
    }

    if (widgetType === "filterableLegendWidgetWithGraphic"){
        new N2FilterableLegendWidgetWithGraphic(options);
    }
}

nunaliit2.filterableLegendWidget = {
    filterableLegendWidgetWithGraphic: N2FilterableLegendWidgetWithGraphic,
    widgetAvailable: widgetAvailable,
    widgetDisplay: widgetDisplay
};

export default N2FilterableLegendWidgetWithGraphic;
