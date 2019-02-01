/**
* @module n2es6/n2mapModule/N2StyleMapFunc
*/


export function adjustFilterProperties (feature) {
	feature.isFilteredIn = false;
	feature.isFilteredOut = false;
	for (var key in this.styleFilters) {
		feature.isFilteredIn = true;

		var f = this.styleFilters[key].matchFn;
		if( !f(feature) ) {
			feature.isFilteredIn = false;
			feature.isFilteredOut = true;
			return true;
		};
	};
	return false;
};

export function _createStyleMap (styleOptions) {
	var providedMap = styleOptions
	? $.extend(true,{},this.defaultStyleMap,styleOptions)
	: this.defaultStyleMap;

	var normalStyle = new OpenLayers.Style( providedMap.normal );
	var clickedStyle = new OpenLayers.Style( providedMap.clicked );
	var hoveredStyle = new OpenLayers.Style( providedMap.hovered );
	var hoveredClickedStyle = new OpenLayers.Style( providedMap.hoveredClicked );
	var filteredOutStyle = new OpenLayers.Style( providedMap.filteredOut );
	var styles = {
		'normal': normalStyle
		,'clicked': clickedStyle
		,'hovered': hoveredStyle
		,'hoveredClicked': hoveredClickedStyle
		,'filteredOut': filteredOutStyle
	};


	var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){

		var effectiveIntent = null;

		if( null == effectiveIntent && feature.isFilteredOut ) {
			effectiveIntent = 'filteredOut';
		};

		if( null == effectiveIntent && feature.isHovered ) {
			if( feature.isClicked ) {
				effectiveIntent = 'hoveredClicked';
			} else {
				effectiveIntent = 'hovered';
			};
		};

		if( null == effectiveIntent && feature.isClicked ) {
			effectiveIntent = 'clicked';
		};

		var style = styles[effectiveIntent];
		if( null == style ) {
			style = styles.normal;
		};

		return style.createSymbolizer(feature);
	});

	return styleMap;
}

export function _createStyleMapFromLayerInfo (layerInfo) {

	var styleOptions = null;
	if( layerInfo && layerInfo.styleMap ) {
		styleOptions = layerInfo.styleMap;
	};
	return this._createStyleMap(styleOptions);
}

export function _createEffectiveStyleMap (layerInfo) {

	var _this = this;

	// The caller can specify a style map in multiple ways:
	// 1. provide a style map function (layerInfo.styleMapFn)
	// 2. provide a style extension (layerInfo.styleMapFn === _createStyleMapFromLayerInfo)
	//    and styleMap object is used.
	// Either way, a style map wrapping the caller's is needed to perform
	// some work prior to calling the caller's style map. This function creates
	// this wrapper.

	// Determine the style map function for this layer
	var innerStyleMap = null;
	if( layerInfo ) {
		innerStyleMap = layerInfo.styleMapFn(layerInfo);
	} else {
		// Editing layer currently has no options for styling. Use
		// defaults.
		innerStyleMap = this._createStyleMap();
	};

	// Create wrapping style map based on StyleMapCallback. Perform
	// some work and then defer to caller's style map.
	var styleMap = new OpenLayers.StyleMapCallback(function(feature,intent){

		// A virtual style is requested when feature is null.
		// ModifyFeature control requests a virtual style for
		// its virtual vertices. Always return a style on
		// null feature.
		if( null == feature ) {
			return {
				fillColor: "#0000ff",
				fillOpacity: 0.4,
				strokeColor: "#0000ff",
				strokeOpacity: 1,
				strokeWidth: 1,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 6,
				pointerEvents: "visiblePainted",
				cursor: "pointer"
			};
		};

		// If a feature is being edited by the ModifyFeature control,
		// then vertices and handles are drawn on the map. Those vertices
		// and handles are marked as "_sketch". In that case, offer the style
		// for editing.
		if( feature._sketch ) {
			return {
				fillColor: "#0000ff",
				fillOpacity: 0.4,
				strokeColor: "#0000ff",
				strokeOpacity: 1,
				strokeWidth: 1,
				strokeLinecap: "round", //[butt | round | square]
				strokeDashstyle: "solid", //[dot | dash | dashdot | longdash | longdashdot | solid]
				pointRadius: 6,
				pointerEvents: "visiblePainted",
				cursor: "pointer"
			};
		};

		_this.adjustFilterProperties(feature);

		var symbolizer = innerStyleMap.createSymbolizer(feature,intent);

		return symbolizer;
	});

	// Add styles that are expected to be hard coded
	if( !styleMap.styles ) {
		styleMap.styles = {};
	}

	// This style is needed by the DrawFeature control in sketch
	// mode (while editing)
	if( !styleMap.styles['temporary'] ) {
		styleMap.styles['temporary'] = {
			fillColor: "#66cccc",
			fillOpacity: 0.2,
			hoverFillColor: "white",
			hoverFillOpacity: 0.8,
			strokeColor: "#66cccc",
			strokeOpacity: 1,
			strokeLinecap: "round",
			strokeWidth: 2,
			strokeDashstyle: "solid",
			hoverStrokeColor: "red",
			hoverStrokeOpacity: 1,
			hoverStrokeWidth: 0.2,
			pointRadius: 6,
			hoverPointRadius: 1,
			hoverPointUnit: "%",
			pointerEvents: "visiblePainted",
			cursor: "inherit"
		};
	};

	// I have no idea if this is needed. I put it here for completeness.
	if( !styleMap.styles['delete'] ) {
		styleMap.styles['delete'] = {
			display: "none"
		};
	};

	return styleMap;
}

export function turnOffStyleFilter ( label ) {
	if( this.styleFilters[label] ) {
		delete this.styleFilters[label];
		this.redrawMap();
	};
}

export function	removeStyleFilter ( filter ) {
	var label = null;
	if( typeof(filter) === 'string' ) {
		label = filter;
	} else if( typeof(filter) === 'string' ) {
		label = filter.label;
	};
	if( null == label ) {
		return;
	};
	turnOffStyleFilter(label);
	$('#_olkit_styleFilter_'+label).remove();
}

export function addStyleFilter (filter_) {
	var _this = this;

	var defaultFilter = {
		description: 'Unknown Filter'
		,refreshFunction: function(options_){}
	};
	var filter = $.extend(defaultFilter, filter_);

	// This method returns a label to be used in removing
	// an installed filter
	var filterLabel = ''+this.styleFilterIndex;
	++this.styleFilterIndex;
	filter.label = filterLabel;

	var span = $('<span id="_olkit_styleFilter_'+filterLabel+'"></span>');

	var filterPanelId = this.options.filterPanelName;
	if( null == filterPanelId ) {
		return false;
	};
	$('#'+filterPanelId).append(span);

	var cb = $('<input type="checkbox"/>');
	var warning = $('<span></span>');
	var text = $('<span>'+filter.description+'</span>');
	var removeButton = $('<input type="button" value="Delete"/>');
	var br = $('<br/>');
	span.append(cb);
	span.append(removeButton);
	span.append(warning);
	span.append(text);
	span.append(br);

	cb.bind('change',function(){
		var checked = cb.attr('checked');
		if( checked ) {
			refreshFilter();
		} else {
			removeFilter();
		};
	});
	removeButton.click(function(){
		deleteFilter();
		return false;
	});

	refreshFilter();

	function onError() {
		warning.text('!!!');
		cb.attr('checked',false);
		disableAll(span, false);
		if( null != filterLabel ) {
			this.removeStyleFilter(filterLabel);
			filterLabel = null;
		};
	};

	function refreshFilter() {
		warning.empty();
		disableAll(span, true);

		filter.refreshFunction({
			onError: onError
			,filterOnFids: filterFids
		});
	};

	function filterFids(fids) {
		// Make map for faster access
		var fidMap = {};
		for(var loop=0; loop<fids.length; ++loop) {
			fidMap[fids[loop]] = 1;
		};

		filter.matchFn = function(feature) {
			if( fidMap[feature.attributes.id] ) {
				return true;
			};
			return false;
		};
		styleFilters[filter.label] = filter;

		cb.attr('checked',true);
		disableAll(span, false);

		_this.redrawMap();
	};

	function removeFilter() {
		warning.empty();
		_this.turnOffStyleFilter(filterLabel);
	};

	function deleteFilter() {
		if( null != filterLabel ) {
			_this.removeStyleFilter(filterLabel);
			filterLabel = null;
		};
	};

	function disableAll(jQuerySet, flag) {
		if( flag ) {
			jQuerySet
			.attr('disabled',true)
			.addClass('olkitDisabled')
			;
		} else {
			jQuerySet
			.removeAttr('disabled')
			.removeClass('olkitDisabled')
			;
		};

		jQuerySet.children().each(function(i,elem){ disableAll($(elem), flag); });
	};

	return false;
}
