/**
* @module n2es6/N2FilterableLegendWidget
*/

/* import Feature from 'ol/Feature.js'; */

const _loc = function(str,args){ return $n2.loc(str,"nunaliit2",args); };
const ALL_CHOICES = "__ALL_SELECTED__";

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
        this.DH = "N2FilterableLegendWidgetWithGraphic";
        this.dispatchService = options.dispatchService;
        this.showService = options.showService;
        this.sourceModelId = options.sourceModelId;
        this.containerId = options.containerId;
        this.selectAllLabel = options.selectAllLabel;

        this.eventNames = {
            changeAvailableChoices: null,
            changeSelectedChoices: null,
            changeAllSelected: null,
            setSelectedChoices: null,
            setAllSelected: null
        }

        this.legend = null;

        this.state = {
            allSelected: true,
            availableChoices: [],
            selectedChoices: [],
            selectedChoiceIdMap: {}
        };

        Object.seal(this.state);

        if (!this.containerId) {
            throw new Error("containerId must be specified");
        }
        
        if (!this.sourceModelId) {
            throw new Error("sourceModelId must be specified");
        }
        
        this.elementId = nunaliit2.getUniqueId();

        if (this.dispatchService) {
            const modelInfoRequest = {
                type: 'modelGetInfo',
                modelId: this.sourceModelId,
                modelInfo: null
            };
            this.dispatchService.synchronousCall(this.DH, modelInfoRequest);
            const { 
                modelInfo: {
                    parameters: {
                        allSelected,
                        availableChoices,
                        selectedChoices
                    }
                } 
            } = modelInfoRequest;

            if (availableChoices) {
                this.eventNames.changeAvailableChoices = availableChoices.changeEvent;
                if (availableChoices.value) {
                    this.state.availableChoices = availableChoices.value;
                }
            }

            if (selectedChoices) {
                this.eventNames.changeSelectedChoices = selectedChoices.changeEvent;
                this.eventNames.setSelectedChoices = selectedChoices.setEvent;
                if (selectedChoices.value) {
                    this.state.selectedChoices = selectedChoices.value;
                    this.state.selectedChoiceIdMap = {};
                    this.state.selectedChoices.forEach((choiceText) => {
                        this.state.selectedChoiceIdMap[choiceText] = true;
                    });
                }
            }

            if (allSelected) {
                this.eventNames.changeAllSelected = allSelected.changeEvent;
                this.eventNames.setAllSelected = allSelected.setEvent;
                if (typeof allSelected.value === 'boolean') {
                    this.state.allSelected = allSelected.value;
                }
            }

            const fn = (message, addr, dispatcher) => {
                this._handle(message, addr, dispatcher);
            };

            if (this.eventNames.changeAvailableChoices) {
                this.dispatchService.register(this.DH, this.eventNames.changeAvailableChoices, fn);
            }

            if (this.eventNames.changeSelectedChoices) {
                this.dispatchService.register(this.DH, this.eventNames.changeSelectedChoices, fn);
            }

            if (this.eventNames.changeAllSelected) {
                this.dispatchService.register(this.DH, this.eventNames.changeAllSelected, fn);
            }

            this.dispatchService.register(this.DH, "canvasGetStylesInUse", fn);
        }

        const legendAndGraphicContainer = document.getElementById(this.containerId)

        if (legendAndGraphicContainer === null) {
            throw new Error(`containerId ${this.containerId} could not be found`)
        }

        const legendAndGraphic = document.createElement("div");
        legendAndGraphic.setAttribute("id", this.elementId);
        legendAndGraphicContainer.append(legendAndGraphic);

        this._draw();
	}

    _handle (message, addr, dispatcher) {
        const { type, value } = message;
        if (type === this.eventNames.changeAvailableChoices) {
            if (value) {
                this.state.availableChoices = value;
                this._draw();
            }
        } 
        else if (type === this.eventNames.changeSelectedChoices) {
            if (value) {
                this.state.selectedChoices = value;
                this.state.selectedChoiceIdMap = {};
                this.state.selectedChoices.forEach((choiceText) => {
                    this.state.selectedChoiceIdMap[choiceText] = true;
                });
                this._adjustSelectedItem();
            }
        } 
        else if (type === this.eventNames.changeAllSelected) {
            if (typeof value === 'boolean') {
                if (value === this.state.allSelected) return;
                this.state.allSelected = value;
                this._adjustSelectedItem();
            }
        }
        else if (type === "canvasGetStylesInUse") {
            console.log("canvasGetStylesInUse handle message placeholder")
            console.log(message);
        }
    }

    _draw() {
        const mainContainer = document.getElementById(this.elementId);
        mainContainer.innerHTML = "";
        const fragment = document.createDocumentFragment();

        const legendContainer = document.createElement("div");
        legendContainer.setAttribute("id", "n2_filterableLegendWidgetLegend")
        legendContainer.setAttribute("class", "n2widgetLegend");
        const legend = document.createElement("div");
        legend.setAttribute("class", "n2widgetLegend_outer");
        this.legend = legend; 
        
        let selectAllLabel = this.selectAllLabel || "All";
        selectAllLabel = _loc(selectAllLabel);

        const legendFragment = document.createDocumentFragment();
        this._drawLegendOption(legendFragment, ALL_CHOICES, selectAllLabel, null)

        this.state.availableChoices.forEach(choice => {
            const label = choice.label || choice.id;
            const colour = choice.color;
            this._drawLegendOption(legendFragment, choice.id, label, colour);
        });
        
        const graphic = document.createElement("div");
        legendContainer.setAttribute("id", "n2_filterableLegendWidgetGraphic");
        
        legend.append(legendFragment);
        legendContainer.append(legend);
        fragment.append(legendContainer, graphic);
        mainContainer.append(fragment);
    }

    _drawLegendOption(fragment, optionValue, optionLabel, colour) {
        const optionId = nunaliit2.getUniqueId();
        const selectionRow = document.createElement("div");
        selectionRow.setAttribute("class", "n2widgetLegend_legendEntry")
        selectionRow.setAttribute("class", "n2widgetLegend_optionSelected")
        selectionRow.setAttribute("data-n2-choiceId", optionValue)

        const checkbox = document.createElement("input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("checked", true);
        checkbox.setAttribute("id", optionId);
        checkbox.addEventListener("click", () =>{
            this._selectionChanged(optionValue);
        });
        selectionRow.append(checkbox);

        const checkboxLabel = document.createElement("label");
        checkboxLabel.setAttribute("for", optionId);
        selectionRow.append(checkboxLabel);

        const symbolColumn = document.createElement("div");
        symbolColumn.setAttribute("class", "n2widgetLegend_symbolColumn");
        checkboxLabel.append(symbolColumn);

        /* Should be able to handle other icons in the future. */
        if (colour) {
            const svgNode = document.createElement("svg");
            svgNode.setAttribute("viewBox", "-7 -7 14 14");
            svgNode.setAttribute("class", "n2widgetLegend_svg");

            const svgDonut = document.createElement("circle");
            svgDonut.setAttribute("r", "5");
            svgDonut.setAttribute("stroke", colour);
            svgDonut.setAttribute("stroke-width", "2");
            svgDonut.setAttribute("fill-opacity", "1");
            svgDonut.setAttribute("stroke-opacity", "1");
            svgDonut.setAttribute("stroke-linecap", "round");
            svgDonut.setAttribute("stroke-dasharray", "solid");
            svgDonut.setAttribute("pointerEvents", "visiblePainted");
            svgDonut.setAttribute("pointer-events", "visiblePainted");
            svgNode.append(svgDonut);
            symbolColumn.append(svgNode);
        }

        const labelColumn = document.createElement("div");
        labelColumn.setAttribute("class", "n2widgetLegend_labelColumn");
        checkboxLabel.append(labelColumn);

        const label = document.createElement("div");
        label.setAttribute("class", "n2widgetLegend_label");
        label.innerText = optionLabel;
        labelColumn.append(label);

        fragment.append(selectionRow);

        this._adjustSelectedItem();
    }

    _adjustSelectedItem() {
        if (!this.legend.hasChildNodes) return;
        [...this.legend.children].forEach(selectionRow => {
            const choiceId = selectionRow.dataset.n2Choiceid;
            const checkbox = selectionRow.children[0];
            if (this.state.allSelected || this.state.selectedChoiceIdMap[choiceId]) {
                if (checkbox.checked !== true) {
                    checkbox.checked = true;
                }
                selectionRow.children[1].style.color = "#ffffff";
            }
            else {
                if (checkbox.checked) {
                    checkbox.checked = false;
                }
                selectionRow.children[1].style.color = "#aaaaaa";
            }
        });
    }

    _selectionChanged(choiceId) {
        if (choiceId === ALL_CHOICES) {
            if (this.state.allSelected) {
                this.dispatchService.send(this.DH, {
                    type: this.eventNames.setSelectedChoices,
                    value: []
                });
            }
            else {
                this.dispatchService.send(this.DH, {
                    type: this.eventNames.setAllSelected,
                    value: true
                });
            }
        }
        else {
            let selectedChoiceIds = [];
            if (this.state.selectedChoices.includes(choiceId)) {
                selectedChoiceIds = this.state.selectedChoices.filter(choice => choice !== choiceId)
            }
            else {
                selectedChoiceIds = [...this.state.selectedChoices, choiceId];
            }
            this.dispatchService.synchronousCall(this.DH, {
                type: this.eventNames.setSelectedChoices,
                value: selectedChoiceIds
            });

            if (this.state.selectedChoices.length === this.state.availableChoices.length) {
                this.dispatchService.send(this.DH, {
                    type: this.eventNames.setAllSelected,
                    value: true
                });
            }
        }
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
