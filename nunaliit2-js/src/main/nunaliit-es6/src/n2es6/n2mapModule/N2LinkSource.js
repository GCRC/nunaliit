/**
* @module n2es6/n2mapModule/N2LinkSource
*/

import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature.js';
/* import {listen, unlisten, unlistenByKey} from 'ol/events.js';
import EventType from 'ol/events/EventType.js'; */

/**
 * @classdesc
 * Class for drawing links/lines between points
 * @api
 */
class N2LinkSource extends VectorSource {
	constructor(options) {
		super(options);
		this._dispatchService = options.dispatchService;
		/* this._source = options.source || null;
		this._sourceChangeKey = null; */
		/* if (options.source){
			this._source = options.source;
			this._sourceChangeKey =
				listen(this.source, EventType.CHANGE, this.refresh, this); */

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
			const featureDuration = point.data._ldata.start;
			
			/* const featureGeomBbox = point.data.nunaliit_geom.bbox;
			// clusters don't have bbox
			const pointCoordinates = [featureGeomBbox[0], featureGeomBbox[1]]; */

			const pointCoordinates = [point.n2ConvertedBbox[0], point.n2ConvertedBbox[1]];
			if (this._timeCoordinateData.has(featureDuration)) {
				const pointLocations = this._timeCoordinateData.get(featureDuration);
				pointLocations.push(pointCoordinates);
			}
			else {
				this._timeCoordinateData.set(featureDuration, [pointCoordinates]);
			}
		});
	}

	_generateLinkStrengths() {
		let previousPoints = [];
		this._timeCoordinateData.forEach((currPoints, _) => {
			for (let i = 0; i < previousPoints.length; i++) {
				for (let j = 0; j < currPoints.length; j++) {
					/* cluster check for strength here */
					const prevPointString = previousPoints[i].toString();
					const currPointString = currPoints[j].toString();

					if (prevPointString === currPointString) continue;
					let linkStrengthKey = `${prevPointString} ${currPointString}`;
					if (prevPointString > currPointString) {
						linkStrengthKey = `${currPointString} ${prevPointString}`;
					}
					if (this._linkStrengths.has(linkStrengthKey)) {
						this._linkStrengths.get(linkStrengthKey).strength += 1;
					}
					else {
						this._linkStrengths.set(linkStrengthKey, {
							start: previousPoints[i],
							end: currPoints[j],
							strength: 1
						});
					}
				}
			}
			previousPoints = currPoints;
		});
	}

	_generateLineStringFeatures() {
		this._linkStrengths.forEach((lineData, key) => {
			const lineStringFeature = new Feature({
				geometry: new LineString([lineData.start, lineData.end])
			});
			lineStringFeature.setId(key);
			this._linestringFeatures.push(lineStringFeature);
		});
	}
}
export default N2LinkSource
