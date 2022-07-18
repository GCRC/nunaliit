/**
* @module n2es6/widgets/N2ModelExportWidget
*/

import './N2ModelExportWidget.css';

const _loc = function (str, args) { return $n2.loc(str, "nunaliit2", args); };

/**
 * @classdesc
 * A widget that downloads the JSON contents of a model when clicked.
 * This differs from exportWidget because it should automatically start a download when clicked
 * and does not require any further user input to select a script or file format.
 * @api
 */
class N2ModelExportWidget {
    constructor(options) {
        this.DH = "N2ModelExportWidget";
        this.containerId = options.containerId;
        this.sourceModelId = options.sourceModelId;
        this.dispatchService = options.dispatchService;
        this.moduleInfo = options.moduleDisplay;
        this.label = options.label;
        this.state = {};

        if (!saveAs) alert("FileSaver is not available! Exporting won't work!");

        if (!this.containerId) {
            throw new Error("containerId must be specified");
        }
        if (!this.sourceModelId) {
            throw new Error("sourceModelId must be specified");
        }
        if (!this.dispatchService) {
            throw new Error("dispatchService must be provided");
        }
        if (!this.label) {
            this.label = `Export ${this.sourceModelId} Data`;
        }
        const container = document.getElementById(this.containerId)
        if (container === null) {
            throw new Error(`containerId ${this.containerId} could not be found`)
        }

        this.elementId = nunaliit2.getUniqueId();

        this._performDispatcherSetup();

        const widgetDiv = document.createElement("div");
        const widgetAnchor = document.createElement("a");

        widgetDiv.setAttribute("id", this.elementId);
        widgetDiv.setAttribute("class", "n2ModelExportWidget");
        widgetDiv.append(widgetAnchor);
        widgetAnchor.setAttribute("class", "n2ModelExportWidgetButton");
        widgetAnchor.innerHTML = _loc(this.label);
        widgetAnchor.href = "#";
        widgetAnchor.addEventListener("click", (ev) => {
            this._download();
        });

        container.append(widgetDiv);
    }

    _performDispatcherSetup() {
        if (!this.dispatchService) return;

        this.dispatchHandler = (message, addr, dispatcher) => {
            this._handle(message, addr, dispatcher);
        };

        this.dispatchService.register(this.DH, "modelStateUpdated", this.dispatchHandler);
    }

    _handle(message, addr, dispatcher) {
        const { type, modelId, state } = message;
        if (type === "modelStateUpdated") {
            if (modelId === this.sourceModelId) {
                this._sourceModelUpdated(state);
            }
        }
    }

    _sourceModelUpdated(modelState) {
        if (!modelState) return;
        if (modelState.added) {
            modelState.added.forEach(doc => {
                this.state[doc._id] = doc;
            });
        }
        if (modelState.updated) {
            modelState.updated.forEach(doc => {
                this.state[doc._id] = doc;
            });
        }
        if (modelState.removed) {
            modelState.removed.forEach(doc => {
                delete this.state[doc._id];
            });
        }
    }

    _download() {
        const shapedData = this._shapeState(this.state);
        const blob = new Blob([JSON.stringify(shapedData, null, 2)], {
            type: "text/json"
        });
        saveAs(blob, `${this._formatDate()}_${this.moduleInfo.moduleId}.json`)
    }

    _formatDate() {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = (now.getMonth() + 1).toString().padStart(2, "0");
        const day = (now.getDate()).toString().padStart(2, "0");
        return year + month + day;
    }

    _shapeState(state) {
        return state;
    }
}

export function widgetAvailable(message) {
    const { widgetType } = message;
    if (widgetType === "modelExportWidget") {
        message.isAvailable = true;
    }
}

export function widgetDisplay(message) {
    const { widgetType, widgetOptions, config } = message;

    if (widgetType === "modelExportWidget") {
        let options = {};
        if (widgetOptions) {
            const { sourceModelId } = widgetOptions;
            if (typeof sourceModelId !== "string") {
                throw new Error("sourceModelId must be a string!")
            }
            options = { ...widgetOptions };
        }
        options.dispatchService = config?.directory?.dispatchService;
        options.moduleDisplay = config?.moduleDisplay;
        new N2ModelExportWidget(options);
    }
}

nunaliit2.modelExportWidget = {
    modelExportWidget: N2ModelExportWidget,
    widgetAvailable: widgetAvailable,
    widgetDisplay: widgetDisplay
};

export default N2ModelExportWidget;
