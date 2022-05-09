/**
* @module n2es6/widgets/N2FilterableLegendWidget
*/

import './N2FilterableLegendWidget.css';

const _loc = function(str,args){ return $n2.loc(str,"nunaliit2",args); };
const ALL_CHOICES = "__ALL_SELECTED__";

const filterableLegends = [
    "filterableLegendWidgetWithGraphic"
];

const supportedGraphicTypes = [
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
        this.name = options.name;
        this.dispatchService = options.dispatchService;
        this.showService = options.showService;
        this.sourceModelId = options.sourceModelId;
        this.containerId = options.containerId;
        this.designatedCanvasName = options.sourceCanvasName;
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

        this.graphicToggle = null;
        this.graphicVisibility = true;

        this.cachedSymbols = {};

        this.state = {
            allStyles: {},
            stylesByKey: new Map(),
            sourceModelDocuments: {},
            allSelected: true,
            availableChoices: [],
            selectedChoices: [],
            selectedChoiceIdMap: {}
        };

        Object.seal(this.state);
        
        if (!this.name) {
            throw new Error("name must be specified");
        }

        if (!this.containerId) {
            throw new Error("containerId must be specified");
        }
        
        if (!this.sourceModelId) {
            throw new Error("sourceModelId must be specified");
        }

        if (!this.designatedCanvasName) {
            throw new Error("sourceCanvasName must be specified");
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

        this._debouncedDrawLegend = $n2.utils.debounce(this._drawLegend, 1000);

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
	    
        this.dispatchService.register(this.DH, "canvasReportStylesInUse", this.dispatchHandler);

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
                this._debouncedDrawLegend();
                this._drawGraphic();
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
        else if (type === "canvasReportStylesInUse") {
            const { canvasName, stylesInUse } = message;
            if (canvasName !== this.designatedCanvasName) return;
            this.state.allStyles = {
                ...this.state.allStyles
                , ...stylesInUse
            };
            this._debouncedDrawLegend();
        }
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
        
        this._debouncedDrawLegend();
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

        Object.values(this.state.allStyles).forEach(style => {
            this.state.stylesByKey.set(_loc(style.style.label), style);
        });

        this.state.availableChoices.forEach(choice => {
            const label = choice.label || choice.id;
            this._drawLegendOption(legendFragment, choice.id, _loc(label));
        });

        legend.append(legendFragment);
        this.legendContainer.append(legend);
        this._adjustSelectedItem();
    }

    _drawLegendOption(fragment, optionValue, optionLabel) {
        const optionId = nunaliit2.getUniqueId();
        const selectionRow = document.createElement("div");
        selectionRow.classList.add("n2widgetLegend_legendEntry", "n2widgetLegend_optionSelected");
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

        if (optionValue !== ALL_CHOICES) {
            symbolColumn.append(...this._getSVGSymbol(optionLabel));
        }

        const labelColumn = document.createElement("div");
        labelColumn.setAttribute("class", "n2widgetLegend_labelColumn");
        checkboxLabel.append(labelColumn);

        const label = document.createElement("div");
        label.setAttribute("class", "n2widgetLegend_label");
        label.innerText = optionLabel;
        labelColumn.append(label);

        fragment.append(selectionRow);
    }

    _getSVGSymbol(matchingLabel) {
        const symbols = [];
        const styleObj = this.state.stylesByKey.get(matchingLabel)
        if (!styleObj) return symbols;
        const style = styleObj.style;
        if (!style) return symbols;
        
        Object.entries(styleObj).forEach(([key, value]) => {
            if (key === "style") return;

            const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgNode.setAttribute("viewBox", "-7 -7 14 14");
            svgNode.setAttribute("class", "n2widgetLegend_svg");
            
            const styleFeature = value[key];
            const context = {
                ...styleFeature
                , n2_hovered: false
                , n2_selected: false
                , n2_found: false
            };
            const symbolizer = style.getSymbolizer(context);
            let geometry = null;
            
            // TODO: cluster?
            if (key === "point") {
                const graphicName = symbolizer.getSymbolValue("graphicName", context);
                let symbol = null;
                if (graphicName && (symbol = this.cachedSymbols[graphicName])) {
                    geometry = document.createElementNS(svgNode.namespaceURI, "path");
                    geometry.setAttributeNS(null, "d", symbol);
                }
                else if ( graphicName && (symbol = OpenLayers.Renderer.symbol[graphicName])) {
                    const path = this._computePathFromSymbol(symbol);
                    this.cachedSymbols[graphicName] = path;
                    geometry = document.createElementNS(svgNode.namespaceURI, "path");
                    geometry.setAttributeNS(null, "d", this.cachedSymbols[graphicName]);
                }
                else {
                    geometry = document.createElementNS(svgNode.namespaceURI, "circle");
                    geometry.setAttributeNS(null, "r" , 5);
                }
        
                symbolizer.forEachSymbol((name, value) => {
                    if (name === "r") { }
                    else if (name === "fill-opacity") {
                        const noticeableOpacity = (value * 0.5) + 0.5;
                        geometry.setAttributeNS(null, name, noticeableOpacity);
                    }
                    else {
                        geometry.setAttributeNS(null, name, value)
                    }
                }, context);
            }
            else if (key === "line") {
                geometry = document.createElementNS(svgNode.namespaceURI, "line");
                geometry.setAttributeNS(null, "x1", -5);
                geometry.setAttributeNS(null, "y1", 0);
                geometry.setAttributeNS(null, "x2", 5);
                geometry.setAttributeNS(null, "y2", 0);

                symbolizer.forEachSymbol((name, value) => {
                    geometry.setAttributeNS(null, name, value);
                }, context);
            }
            else if (key === "polygon") {
                geometry = document.createElementNS(svgNode.namespaceURI, "path");
                geometry.setAttributeNS(null, "d", "M -5 -5 L -2.5 5 L 5 5 L 2.5 -5 Z");

                symbolizer.forEachSymbol((name, value) => {
                    if (name === "fill-opacity") {
                        const noticeableOpacity = (value * 0.5) + 0.5;
                        geometry.setAttributeNS(null, name, noticeableOpacity);
                    }
                    else {
                        geometry.setAttributeNS(null, name, value)
                    }
                }, context);
            }

            svgNode.append(geometry);
            symbols.push(svgNode);
        }); 
        return symbols;
    }

    _computePathFromSymbol(symbol) {
        // Basically copied over from n2.widgetLegend
        let area = 0,
            minx = undefined,
            maxx = undefined,
            miny = undefined,
            maxy = undefined;

        for (let i = 0, e = symbol.length; i < e; i = i + 2) {
            let x = symbol[i];
            let y = symbol[i + 1];

            if (typeof minx === 'undefined') {
                minx = x;
            } else if (minx > x) {
                minx = x;
            }

            if (typeof maxx === 'undefined') {
                maxx = x;
            } else if (maxx < x) {
                maxx = x;
            }

            if (typeof miny === 'undefined') {
                miny = y;
            } else if (miny > y) {
                miny = y;
            }

            if (typeof maxy === 'undefined') {
                maxy = y;
            } else if (maxy < y) {
                maxy = y;
            }
        }

        let path = [],
            transx = (minx + maxx) / 2,
            transy = (miny + maxy) / 2,
            width = maxx - minx,
            height = maxy - miny,
            factor = (width > height) ? width / 10 : height / 10;
        if (factor <= 0) {
            factor = 1;
        }
        for (let i = 0, e = symbol.length; i < e; i = i + 2) {
            let x = symbol[i];
            let y = symbol[i + 1];

            let effX = (x - transx) / factor;
            let effY = (y - transy) / factor;

            effX = Math.floor(effX * 100) / 100;
            effY = Math.floor(effY * 100) / 100;

            if (i === 0) {
                path.push('M ');
            } else {
                path.push('L ');
            }
            path.push('' + effX);
            path.push(' ' + effY + ' ');
        }
        path.push('Z');
        return path.join('');
    }

    _drawGraphic() {
        if (this.graphicContainer === null) return;
        if (this.isGraphicNone) return;
        this.graphicContainer.innerHTML = "";
        const graphic = document.createElement("div");
        graphic.setAttribute("class", "n2_FilterableLegendWidgetGraphicArea");
        graphic.setAttribute("id", "filterableLegendWidgetGraphicArea");
        this.graphicContainer.append(graphic);
        this.graphic = graphic;

        this._drawGraphicToggle();
        if (!this.graphicVisibility) {
            this.graphic.classList.add("filterableLegendWidgetGraphicAreaHidden");
        }
        else if (this.graphicType === "custom") {
            this.graphic.classList.add("n2_CustomGraphic");
            this._drawCustom();
        }
    }

    _drawCustom() {
        this.drawCustom(this.prepareGraphicData(this.state.sourceModelDocuments));
    }

    _drawGraphicToggle() {
        const minimize = "n2_filterableLegendWidgetWithGraphicMinimize";
        const maximize = "n2_filterableLegendWidgetWithGraphicMaximize";
        const hideClass = "filterableLegendWidgetGraphicAreaHidden";
        const toggleSpan = document.createElement("span");
        toggleSpan.setAttribute("id", "n2_filterableLegendWidgetWithGraphicToggle");
        if (this.graphicVisibility) {
            toggleSpan.classList.add(minimize);
        }
        else {
            toggleSpan.classList.add(maximize);
        }
        toggleSpan.addEventListener("click", () => {
            if (toggleSpan.classList.contains(minimize)) {
                toggleSpan.classList.remove(minimize);
                toggleSpan.classList.add(maximize);
                this.graphic.classList.add(hideClass);
                this.graphicVisibility = false;
            }
            else {
                toggleSpan.classList.remove(maximize);
                toggleSpan.classList.add(minimize);
                this.graphic.classList.remove(hideClass);
                this.graphicVisibility = true;
            }
        });
        this.graphicContainer.append(toggleSpan);
        if (this.graphicToggle !== null) {
            if (this.graphicToggle !== undefined) {
                this.graphicToggle.remove();
            }
            this.graphicToggle = null;
        }
        this.graphicToggle = toggleSpan;
    }

    _adjustSelectedItem() {
        if (!this.legend || !this.legend.hasChildNodes()) return;
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
            this.dispatchService.send(this.DH, {
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

    drawCustom(..._) {
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
