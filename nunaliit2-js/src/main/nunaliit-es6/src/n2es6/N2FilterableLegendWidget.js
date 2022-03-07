/**
* @module n2es6/N2FilterableLegendWidget
*/

const _loc = function(str,args){ return $n2.loc(str,"nunaliit2",args); };
const ALL_CHOICES = "__ALL_SELECTED__";

const filterableLegends = [
    "filterableLegendWidgetWithGraphic"
];

const supportedGraphicTypes = [
    "pie",
    "custom",
    "none"
];

/**
 * @classdesc
 * A legend widget that allows one to filter out the groups of documents.
 * The source model of this legend widget needs to pass through a selectable document filter.
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
        this.designatedCanvasName = options.designatedCanvasName;
        this.selectAllLabel = options.allLabel;
        this.graphicType = options.graphicType;
        this.isGraphicNone = this.graphicType === "none" ? true : false;
        this.hasPerformedInitialDraw = false;
        this.preloadCallback = (..._) => {};

        this.eventNames = {
            changeAvailableChoices: null,
            changeSelectedChoices: null,
            changeAllSelected: null,
            setSelectedChoices: null,
            setAllSelected: null
        }

        this.legendContainer = null;
        this.legend = null;

        this.graphicContainer = null;
        this.graphic = null;

        this.state = {
            currentStyles: {},
            sourceModelDocuments: {},
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

        if (!this.designatedCanvasName) {
            throw new Error("designatedCanvasName must be specified");
        }

        if (!this.selectAllLabel) {
            throw new Error("selectAllLabel must be specified");
        }

        if (!supportedGraphicTypes.includes(this.graphicType)) {
            throw new Error(`graphicType ${this.graphicType} not supported`)
        }
        
        const legendAndGraphicContainer = document.getElementById(this.containerId)

        if (legendAndGraphicContainer === null) {
            throw new Error(`containerId ${this.containerId} could not be found`)
        }

        this.elementId = nunaliit2.getUniqueId();

        this._performDispatcherSetup();

        const legendAndGraphic = document.createElement("div");
        legendAndGraphic.setAttribute("id", this.elementId);
        legendAndGraphicContainer.append(legendAndGraphic);

        this._draw();
	}

    _performDispatcherSetup() {
        /* Initial dispatcher message "modelGetInfo" to load in options and events for legend updating */
        if (!this.dispatchService) return;
        const modelInfoRequest = {
            type: "modelGetInfo",
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
                availableChoices.value.forEach(choice => {
                    if (choice.id === undefined || choice.label === undefined) {
                        throw new Error("The available choices format expected an 'id' and 'label' property. Ensure that both properties exist.");
                    }
                });
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
            if (typeof allSelected.value === "boolean") {
                this.state.allSelected = allSelected.value;
            }
        }

        this.dispatchHandler = (message, addr, dispatcher) => {
            this._handle(message, addr, dispatcher);
        };

        if (this.eventNames.changeAvailableChoices) {
            this.dispatchService.register(this.DH, this.eventNames.changeAvailableChoices, this.dispatchHandler);
        }

        if (this.eventNames.changeSelectedChoices) {
            this.dispatchService.register(this.DH, this.eventNames.changeSelectedChoices, this.dispatchHandler);
        }

        if (this.eventNames.changeAllSelected) {
            this.dispatchService.register(this.DH, this.eventNames.changeAllSelected, this.dispatchHandler);
        }

        /* this.dispatchService.register(this.DH, "canvasReportStylesInUse", this.dispatchHandler); */

        /* Dispatch to get the current styles in use by the canvas */
        const stylesRequestMessage = {
            type: "canvasGetStylesInUse",
            canvasName: this.designatedCanvasName
        };
        this.dispatchService.synchronousCall(this.DH, stylesRequestMessage);
        if (stylesRequestMessage.stylesInUse) {
            this.state.currentStyles = stylesRequestMessage.stylesInUse;
        }

        this.dispatchService.register(this.DH, "documentContent", this.dispatchHandler);

        if (!this.isGraphicNone) {
            this.dispatchService.register(this.DH, "modelStateUpdated", this.dispatchHandler);
            const modelStateMessage = {
                type: "modelGetState",
                modelId: this.sourceModelId
            };

            this.dispatchService.synchronousCall(this.DH, modelStateMessage);
            if (modelStateMessage.state) {
                this._sourceModelUpdated(modelStateMessage.state);
            }
        }
    }

    _handle (message, addr, dispatcher) {
        const { type, value, modelId, state } = message;
        if (type === this.eventNames.changeAvailableChoices) {
            if (value) {
                this.state.availableChoices = value;
                this._drawLegend();
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
            if (typeof value === "boolean") {
                if (value === this.state.allSelected) return;
                this.state.allSelected = value;
                this._adjustSelectedItem();
            }
        }
        else if (type === "modelStateUpdated" && this.hasPerformedInitialDraw) {
            if (modelId === this.sourceModelId) {
                this._sourceModelUpdated(state);
            }
        }
        /* else if (type === "canvasReportStylesInUse") {
            const { canvasName, stylesInUse } = message;
            if (canvasName !== this.designatedCanvasName) return;
            this.state.currentStyles = stylesInUse;
        } */
    }

    _sourceModelUpdated(modelState) {
        if (!modelState) return;
        if (modelState.added) {
            modelState.added.forEach(doc => {
                this.state.sourceModelDocuments[doc._id] = doc;
            });
        }
        if (modelState.updated) {
            modelState.updated.forEach(doc => {
                this.state.sourceModelDocuments[doc._id] = doc;
            });
        }
        if (modelState.removed) {
            modelState.removed.forEach(doc => {
                delete this.state.sourceModelDocuments[doc._id];
            });
        }
        if (modelState.added || modelState.updated || modelState.removed) {
            this.preloadCallback(this.dispatchService);
            this._drawGraphic();
        }
    }

    _draw() {
        this.hasPerformedInitialDraw = true;
        const mainContainer = document.getElementById(this.elementId);
        mainContainer.innerHTML = "";
        mainContainer.setAttribute("class", "n2_filterableLegendWidgetWithGraphic");   
        
        const legendContainer = document.createElement("div");
        legendContainer.setAttribute("id", "n2_filterableLegendWidgetLegend");
        legendContainer.setAttribute("class", "n2widgetLegend");
        this.legendContainer = legendContainer;

        const graphicContainer = document.createElement("div");
        graphicContainer.setAttribute("id", "n2_filterableLegendWidgetGraphic");
        this.graphicContainer = graphicContainer;

        mainContainer.append(this.legendContainer);
        mainContainer.append(this.graphicContainer);
        
        this._drawLegend();
        this._drawGraphic();
    }

    _drawLegend() {
        if (this.legendContainer === null) return;
        this.legendContainer.innerHTML = "";
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
            this._drawLegendOption(legendFragment, choice.id, _loc(label), colour);
        });

        legend.append(legendFragment);
        this.legendContainer.append(legend);
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
            const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");;
            svgNode.setAttribute("viewBox", "-7 -7 14 14");
            svgNode.setAttribute("class", "n2widgetLegend_svg");

            const svgDonut = document.createElementNS(svgNode.namespaceURI, "circle");
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

    _drawGraphic() {
        if (this.graphicContainer === null) return;
        this.graphicContainer.innerHTML = "";
        const graphic = document.createElement("div");
        graphic.setAttribute("class", "n2_FilterableLegendWidgetGraphicArea");
        graphic.setAttribute("id", "filterableLegendWidgetGraphicArea");
        this.graphicContainer.append(graphic);

        if (this.graphicType === "pie") {
            const D3V3 = window.d3;
            if (D3V3 === undefined) throw new Error("The d3 (V3) library is not available!")
            throw new Error("This isn't implemented yet. Come back soon!");
        }
        else if (this.graphicType === "custom") {
            this.drawCustom();
        }
    }

    _adjustSelectedItem() {
        if (!this.legend.hasChildNodes) return;
        [...this.legend.children].forEach(selectionRow => {
            const choiceId = selectionRow.dataset.n2Choiceid;
            const checkbox = selectionRow.children[0];
            if (this.state.allSelected || this.state.selectedChoiceIdMap[choiceId]) {
                checkbox.checked = true;
                selectionRow.children[1].style.color = "#ffffff";
            }
            else {
                checkbox.checked = false;
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

    drawCustom() {
        throw new Error("The 'custom' graphicType needs to define drawing behaviour.");
    }

    prepareGraphicData(docs) {
        if (!this.isGraphicNone) {
            throw new Error ("graphicTypes other than 'None' must define behaviour. Override 'prepareGraphicData'")
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
