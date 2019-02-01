/**
 * @module n2es6/ol5support/N2FeatureOverlay
 */
import VectorLayer from 'ol/layer/Vector.js';
import Collection from 'ol/Collection.js';
import {assign} from 'ol/obj.js';

/**
 * @classdesc
 * N2 featureOverlay (which has been deprecated in ol4) Not sure if it going to be used. Working module for nunaliit webgis
 * @api
 */
class N2FeatureOverlay extends VectorLayer {
	/**
	* @param {Options} opts N2FeatureOverlay options
	*/
	constructor (options) {
		const opts = assign({
			updateWhileAnimating: true,
			updateWhileInteracting: true
		}, options);
		if (!opts.collection) {
			opts.collection = new Collection();
		}
		super(opts);
	};
	/**
	* Clear the feature in featureOverlay source
	*/
	clear () {
		this.getSource().clear();
	};
	/**
	* Get the selected features.
	* @return {import("../Collection.js").default<import("../Feature.js").default>} Features collection.
	* @api
	*/
	getFeatures () {
		this.getSource().getFeatures();
	};
	/**
	* Add a batch of features to the source.
	* @param {Array<import("../Feature.js").default>} features Features to add.
	* @api
	*/
	addFeatures (features) {
		this.getSource().addFeaturesInternal(features);
		this.getSource().changed();
	}
}

export default N2FeatureOverlay;
