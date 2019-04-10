/**
 * @module n2es6/n2mapModule/N2LayerInfo
 */


 /**
  * @typedef {Object} Options
  */
 /**
  * @classdesc
  * Class represents the options for one displayed layer.
  * @api
  */
class N2LayerInfo {
	/**
	 * @param {Options} opts_ Layer options.
	 */
	constructor(opts_){
		var opts = $n2.extend({
			customService: null,

			// Type of layer: 'couchdb', 'wfs', ...
			type: null,

			// Options related ot type
			options: null,

			// String to identify this layer among others
			id: null,

			 /**
			  * sourceSrsName: default source projection of WFS feature data - Geoserver can reproject but cannot
			  * handle a bbox param on a GetFeature in reprojected coordinates.  This is used to tell the atlas
			  * what coordinates to use when request the vector layer features.
			  */
			sourceSrsName: 'EPSG:4326',

			// featurePrefix and featureType jointly form the WFS typename for this layer but because we now
			// use filtering on layers, this typename (featurePrefix:featureType) is not unique.
			featurePrefix: null,
			featureType: null,

			// Full name space associated with prefix
			featureNS: null,

			// name should be unique - doesn't have to be but this is used in the layer switcher so
			// the map designer should be selecting something to differentiate ... this is used for
			// regenerating a specific layers style map.
			name: null,

			// filter for selection of features from the WFS layer
			filter: null,

			featurePopupHtmlFn: null,
			featurePopupDelay: 0,
			visibility: true,

			// Style Map fn - returns an OpenLayers style map to be installed
			// on the layer.
			//
			// If not specified, a style map based on a defaults and extended
			// using the property 'styleMap' is created.
			styleMapFn: null,

			// To update the default style associated with a layer, insert an object containing the
			// named styles e.g.
			// layerInfo.styleMap: {
			//   normal: {
			//     strokeColor: "#f4f4f4"
			//   }
			//   ,clicked: {
			//     strokeColor: "#ff0000"
			//   }
			// }
			// The style names in use are:
			// - normal -> default style for features
			// - hovered -> style when a feature is moused over
			// - clicked -> style when a feature is currently selected (clicked on)
			// - hoveredClicked -> style when a feature is currently selected (clicked on) and moused over
			// - filteredOut -> style when a feature does not fall within a filter
			//
			// If the property 'styleMapFn' is provided, then this property is most
			// likely going to be ignored.
			styleMap: null,

			selectListener: function (isSelected, layerInfo){},

			// This is the function called back when a cluster with
			// more than one feature is clicked
			clusterClickCallback: null,

			clustering: null,

			useHoverSound: false

		},opts_);

		var _this = this;

		this.id = opts.id;
		this.type = opts.type;
		this.options = opts.options;
		this.customService = opts.customService;
		this.sourceSrsName = opts.sourceSrsName;
		this.featurePrefix = opts.featurePrefix;
		this.featureType = opts.featureType;
		this.featureNS = opts.featureNS;
		this.name = opts.name;
		this.filter = opts.filter;
		this.featurePopupHtmlFn = opts.featurePopupHtmlFn;
		this.featurePopupDelay = opts.featurePopupDelay;
		this.visibility = opts.visibility;
		this.styleMapFn = opts.styleMapFn;
		this.styleMap = opts.styleMap;
		this.selectListener = opts.selectListener;
		this.clusterClickCallback = opts.clusterClickCallback;
		this.clustering = opts.clustering;
		this.useHoverSound = opts.useHoverSound;

		// Derive database projection from name
		if( this.sourceSrsName ){
			this.sourceProjection = this.sourceSrsName;
		};

		// Localize name
		if( this.name ){
			this.name = _loc(this.name);
		};

		// Popup function
		if( !this.featurePopupHtmlFn ){
			if( this.customService ){
				var cb = this.customService.getOption('mapFeaturePopupCallback');
				if( typeof cb === 'function' ) {
					this.featurePopupHtmlFn = cb;
				};
			};
		};
		if( !this.featurePopupHtmlFn ){
			this.featurePopupHtmlFn = $n2.mapAndControls.DefaultPopupHtmlFunction;
		};

		// Cluster click callback
		if( !this.clusterClickCallback ){
			if( this.customService ){
				var cb = this.customService.getOption('mapClusterClickCallback');
				if( typeof cb === 'function' ) {
					this.clusterClickCallback = cb;
				};
			};
		};
		if( !this.clusterClickCallback ){
			this.clusterClickCallback = $n2.mapAndControls.ZoomInClusterClickCallback;
		};
	}

	forEachFeature(callback){
		if( typeof callback === 'function'
		 && this.olLayer
		 && this.olLayer.features ){
			for(var i=0,e=this.olLayer.features.length; i<e; ++i){
				var feature = this.olLayer.features[i];
				if( feature.cluster ){
					for(var j=0,k=feature.cluster; j<k; ++j){
						var cf = feature.cluster[j];
						callback.call(this,cf,feature);
					};
				} else {
					callback.call(this,feature);
				};
			};
		};
	}

	accumulateMapStylesInUse(stylesInUse){
		// Loop over drawn features (do not iterate in clusters)
		if( this.olLayer
		 && this.olLayer.features ){
			for(var i=0,e=this.olLayer.features.length; i<e; ++i){
				var feature = this.olLayer.features[i];
				if( feature._n2Style
				 && typeof feature._n2Style.id === 'string'){
					var style = feature._n2Style;

					var styleInfo = stylesInUse[style.id];
					if( !styleInfo ){
						styleInfo = {
							style: style
						};
						stylesInUse[style.id] = styleInfo;
					};

					var geometryType = feature.n2_geometry;
					if( geometryType && !styleInfo[geometryType] ){
						styleInfo[geometryType] = feature;
					};
				};
			};
		};
	}
}
export default N2LayerInfo;
