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

			const featureData = {
				coordinates: pointCoordinates,
				isFeatureVisible: isFeatureCurrentlyShowing,
				name: point.data._ldata.timeLinkTags.placeTag
			};

			if (this._timeCoordinateData.has(featureStartTime)) {
				let pointData = this._timeCoordinateData.get(featureStartTime);
				pointData.push(featureData);
			}
			else {
				this._timeCoordinateData.set(featureStartTime, [featureData]);
			}
		});
	}

	_generateLinkStrengths() {
		let previousData = [];
		this._timeCoordinateData.forEach((currentData) => {
			
			/* Generating same time links */
			if (currentData.length > 1) {
				for (let m = 0; m < currentData.length - 1; m++) {
					for (let n = m; n < currentData.length - 1; n++) {
						const placeA = currentData[m];
						const placeB = currentData[n+1];
						const placeAStr = placeA.coordinates.toString();
						const placeBStr = placeB.coordinates.toString();
						if (placeAStr === placeBStr) continue;
						const dashedLinkVisibility = (placeA.isFeatureVisible && placeB.isFeatureVisible);
						const sameTimePlaceKey = `${placeAStr} ${placeBStr} dashed`;
						if (this._linkStrengths.has(sameTimePlaceKey)) {
							this._linkStrengths.get(sameTimePlaceKey).isLinkVisible = dashedLinkVisibility;
						}
						else {
							this._linkStrengths.set(sameTimePlaceKey, {
								start: placeA.coordinates,
								end: placeB.coordinates,
								places: [placeA.name, placeB.name],
								isLinkVisible: dashedLinkVisibility,
								strength: 1,
								style: [10, 20]
							});
						}
					}
				}
			}

			for (let i = 0; i < previousData.length; i++) {

				const previousDataPoint = previousData[i];
				const prevPointString = previousDataPoint.coordinates.toString();

				for (let j = 0; j < currentData.length; j++) {

					const currentDataPoint = currentData[j];
					const currPointString = currentDataPoint.coordinates.toString();

					/* Not drawing a link from a point to the same point */
					if (prevPointString === currPointString) continue;

					let linkStrengthKey = `${prevPointString} ${currPointString} default`;
					if (prevPointString > currPointString) {
						linkStrengthKey = `${currPointString} ${prevPointString} default`;
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
							places: [currentDataPoint.name, previousDataPoint.name],
							isLinkVisible: lineStringVisibility,
							strength: 1,
							style: null
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
			lineStringFeature.set("linkStyle", lineData.style, false);
			lineStringFeature.set("places", lineData.places, false);
			this._linestringFeatures.push(lineStringFeature);
		});
	}

	stylerFunction(feature) {
		if (feature.get("isVisible") === false || feature.get("isVisible") === undefined) return;
		const linkStyle = feature.get("linkStyle");
		const defaultZ = linkStyle === null ? 5 : 0;
		return [
			new Style({
				stroke: new Stroke({
					width: feature.get("linkStrength") + 2,
					color: "white",
					lineDash: linkStyle
				}),
				zIndex: defaultZ + 0
			}),
			new Style({
				stroke: new Stroke({
					width: feature.get("linkStrength"),
					color: "#404040",
					lineDash: linkStyle
				}),
				zIndex: defaultZ + 1
			})
		]
	}
}
export default N2LinkSource;
