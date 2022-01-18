/**
* @module n2es6/n2mapModule/N2LinkSource
*/

import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Feature from 'ol/Feature.js';

/**
 * @classdesc
 * Class for drawing links/lines between points
 * @api
 */
class N2LinkSource extends VectorSource {
	constructor(options) {
		super(options);
		this._dispatchService = options.dispatchService;
		this._pointFeatures = [];
		this._linestringFeatures = [];
		this._timeCoordinateData = new Map();
		this._linkStrengths = new Map();
	}

	/* 
		This class needs to update its features so that it is as
		closely related to the point sources as possible.
	*/
	refreshCallback(features) {
		console.log("N2LinkSource refreshCallback")
		console.log(features);
		this.clear();
		this._pointFeatures = features;
		this._linestringFeatures = [];
		this._timeCoordinateData.clear();
		this._linkStrengths.clear();

		if (this._pointFeatures.length < 2) return;
		this._pointFeatures.sort((featureA, featureB) => {
			const timeA = featureA.data._ldata.start;
			const timeB = featureB.data._ldata.start;
			return ((timeA > timeB) ? 1 : (timeA < timeB) ? -1 : 0);
		});

		this._collectTimeCoordinateData();
		this._generateLinkStrengths();
		this._generateLineStringFeatures();
		this.addFeatures(this._linestringFeatures);
	}

	_collectTimeCoordinateData() {
		this._pointFeatures.forEach(point => {
			const featureStartTime = point.data._ldata.start;
			const isFeatureCurrentlyShowing = point.get("isVisible");
			const pointCoordinates = [...point.getGeometry().flatCoordinates];

			if (this._timeCoordinateData.has(featureStartTime)) {
				let pointData = this._timeCoordinateData.get(featureStartTime);
				pointData.push({
					coordinates: pointCoordinates,
					isFeatureVisible: isFeatureCurrentlyShowing,
					i: point.data._ldata.timeLinkTags.placeTag
				});
			}
			else {
				this._timeCoordinateData.set(featureStartTime, [{ 
					coordinates: pointCoordinates,
					isFeatureVisible: isFeatureCurrentlyShowing,
					i: point.data._ldata.timeLinkTags.placeTag
				}]);
			}
		});
	}

	_generateLinkStrengths() {
		let previousData = [];
		this._timeCoordinateData.forEach((currentData, _) => {
			for (let i = 0; i < previousData.length; i++) {
				for (let j = 0; j < currentData.length; j++) {
					const previousDataPoint = previousData[i];
					const currentDataPoint = currentData[j];

					const prevPointString = previousDataPoint.coordinates.toString();
					const currPointString = currentDataPoint.coordinates.toString();

					if (prevPointString === currPointString) continue; // Not drawing a link from a point to the same point
					let linkStrengthKey = `${prevPointString} ${currPointString}`;
					if (prevPointString > currPointString) {
						linkStrengthKey = `${currPointString} ${prevPointString}`;
					}

					const lineStringVisibility = (previousDataPoint.isFeatureVisible && currentDataPoint.isFeatureVisible);

					if (this._linkStrengths.has(linkStrengthKey)) {
						this._linkStrengths.get(linkStrengthKey).strength += 1;
						this._linkStrengths.get(linkStrengthKey).isLinkVisible = lineStringVisibility;
					}
					else {
						this._linkStrengths.set(linkStrengthKey, {
							start: previousDataPoint.coordinates,
							end: currentDataPoint.coordinates,
							isLinkVisible: lineStringVisibility,
							strength: 1
						});
					}
				}
			}
			previousData = currentData;
		});
	}

	_generateLineStringFeatures() {
		this._linkStrengths.forEach((lineData, key) => {
			const lineStringFeature = new Feature({
				geometry: new LineString([lineData.start, lineData.end])
			});
			lineStringFeature.setId(key);
			lineStringFeature.set("isVisible", lineData.isLinkVisible, false);
			lineStringFeature.set("linkStrength", lineData.strength, false);
			this._linestringFeatures.push(lineStringFeature);
		});
	}

	stylerFunction(feature) {
		if (feature.get("isVisible") === false) return;
		return new Style({
			stroke: new Stroke({
				width: feature.get("linkStrength"),
				color: "blue"
			})
		});
	}
}
export default N2LinkSource
