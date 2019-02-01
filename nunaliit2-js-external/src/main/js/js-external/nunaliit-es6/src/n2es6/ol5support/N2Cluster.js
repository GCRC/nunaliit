/**
* @module n2es6/ol5support/N2Cluster
*/

import {getUid} from 'ol/util.js';
import Cluster from 'ol/source/Cluster.js';
import {transformExtent} from 'ol/proj.js';
import {getCenter, buffer, createEmpty, createOrUpdateFromCoordinate} from 'ol/extent.js';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import {scale as scaleCoordinate, add as addCoordinate} from 'ol/coordinate.js';
/**
* @classdesc
* Layer source to cluster vector data. Working module for nunaliit webgis
* system
* @api
*/
class N2Cluster extends Cluster {

	/**
	* @param {Options} options CLuster options
	*/
	constructor(options) {
		options = assign({
			distance: 20,
			minimumPolygonPixelSize : 20,
			minimumLinePixelSize : 20,
			clusterPointsOnly : false,
			threshold: null,
			clusterPrefix: null
		}, options);
		super(options);

		/**
		* @type {number|undefined}
		* @protected
		*/
		this.distance = options.distance;
		/**
		* @type {number}
		*/
		this.minimumPolygonPixelSize = options.minimumPolygonPixelSize ;

		/**
		* @type {number}
		*/
		this.minimumLinePixelSize = options.minimumLinePixelSize ;
		/**
		* @type {boolean}
		*/
		this.disableDynamicClustering = options.disableDynamicClustering ;
		/**
		* @type {boolean}
		*/
		if(options.clusterPointsOnly) {
			this.clusterPointsOnly = options.clusterPointsOnly ;
		}
		/**
		* @type {number}
		*/
		this.threshold = options.threshold;

		/**
		*  @type {number}
		*/
		this.resolution = 1;

		/**
		*  @type {string}
		*/
		this.projection = null;

		/**
		* @type {string}
		*/
		this.clusterPrefix = 'cluster_' + $n2.getUniqueId() + '_';

		/**
		* @type {number}
		*/
		this.clusterId = 1;

	}
	/**
	* Loading the feature from the layer source, and config the resolution and projection
	* @override
	*/
	loadFeatures(extent, resolution, projection) {
		this.source.loadFeatures(extent, resolution, projection);
		if (resolution !== this.resolution) {
			this.clear();
			this.resolution = resolution;
			this.projection = projection;
			this.cluster();
			this.addFeatures(this.features);
		}
	}

	/**
	* The cluster function for cluster Point, Line and Geometry
	* @override
	*/
	cluster() {
		var that_ = this;
		if (this.resolution === undefined) {
			return;
		}
		this.features.length = 0;
		const extent = createEmpty();
		const mapDistance = this.distance * this.resolution;
		const features = this.source.getFeatures();
		/**
		* @type {!Object<string, boolean>}
		*/
		const clustered = {};
		const ineligibleList = {};
		for (let i = 0, ii = features.length; i < ii; i++) {
			let feature = features[i];
			const uid = getUid(feature);
			if (!this._isEligibleFeature(feature)) {
				ineligibleList[uid] = true;
				this.features.push(feature);
				continue;
			}
			if (!(getUid(feature) in clustered)) {
				// Pass in infinity extent to by-pass OpenLayers bug
				var geomExtent = feature.getGeometry().getExtent();
				const geomCentroid = getCenter(geomExtent);
				createOrUpdateFromCoordinate(geomCentroid, extent);
				buffer(extent, mapDistance, extent);

				let neighbors = this.source.getFeaturesInExtent(extent);
				neighbors = neighbors.filter(function (neighbor) {
					const uid = getUid(neighbor);
					if (!(uid in clustered) &&
					!( (uid in ineligibleList) ||
					!that_._isEligibleFeature(feature) ) ) {
						clustered[uid] = true;
						return true;
					} else {
						return false;
					}
				});
				this.features.push(this.createCluster(neighbors));
			}
		}
	}

	/**
	* @param {Array<Feature>} features Features
	* @return {Feature} The cluster feature.
	* @protected
	*/
	createCluster(features) {

		const centroid = [0, 0];
		var count = 0;
		for (let i = features.length - 1; i >= 0; --i) {
			var geom = features[i].getGeometry();
			if( geom ){
				// Pass in infinity extent to by-pass OpenLayers bug
				var geomExtent = geom.getExtent();
				if( geomExtent ){
					const geomCentroid = getCenter(geomExtent);
					if (geomCentroid) {
						addCoordinate(centroid, geomCentroid);
						++count;
					}
				}
			}
		}
		scaleCoordinate(centroid, 1/count);

		const cluster = new Feature(new Point(centroid));
		cluster.set('features', features);
		cluster.set('fid', this.clusterPrefix + this.clusterId);
		++this.clusterId;
		return cluster;

	}

	/**
	* @param {Feature} feature The feature from source
	* @return {boolean} true if a feature is eligible feature to be clustered
	* @protected
	*/
	_isEligibleFeature(feature) {
		if (feature.n2DisableClustering) {
			return false;
		}

		// By default, cluster everything
		let eligible = true;

		if (!this.disableDynamicClustering) {
			// Dynamic Clustering
			// Small polygons and lines are turned into a cluster
			eligible = false;

			const extent = this._computeFullBoundingBox(feature);
			if (extent) {
				// If the original bounds are larger than what is expected
				// by the resolution, do not cluster. At one point, the correct
				// geometry will arrive to show this feature.
				const xLen = (extent[2] - extent[0]) / this.resolution;
				const yLen = (extent[3] - extent[1]) / this.resolution;
				if ((xLen) < this.minimumLinePixelSize
				&& (yLen) < this.minimumLinePixelSize) {
					eligible = true;
				}
			} else {
				// We are unable to compute the bounds for this feature.
				// Use the geometry for the purpose of clustering
				if (feature.getGeometry().getType().indexOf('Point') >= 0) {
					eligible = true;
				} else {
					// Pass in infinity extent to by-pass OpenLayers bug
					const bounds = feature.getGeometry().getExtent();

					const xLen = (bounds[2]-bounds[0])/ this.resolution;
					const yLen = (bounds[3]-bounds[1]) / this.resolution;
					if ((xLen) < this.minimumLinePixelSize
					&& (yLen) < this.minimumLinePixelSize) {
						eligible = true;
					}
				}
			}

		} else if (this.clusterPointsOnly) {
			// Cluster Point Only
			// Do not cluster polygons and lines
			eligible = false;
			if (feature.getGeometry().getType().indexOf('Point') >= 0) {
				eligible = true;
			}
		}

		return eligible;
	}

	/**
	* Compute the bounding box of the original geometry. This may differ from
	* the bounding box of the geometry on the feature since this can be a
	* simplification.
	* @param {Feature} f The bounding box value from nunaliit project, which considers both the simplified geometries and original one.
	* @return {Array<number>} Extent
	* @protected
	*/
	_computeFullBoundingBox(f) {
		return this._ComputeFeatureOriginalBboxForMapProjection(f, this.projection);
	}
	_ComputeFeatureOriginalBboxForMapProjection(f, mapProj) {
		// Each feature has a projection stored at f.n2GeomProj
		// that represents the original projection for a feature
		//
		// Each feature has a property named 'n2ConvertedBbox' that contains
		// the full geometry bbox converted for the map projection, if
		// already computed.

		if (f && f.n2ConvertedBbox) {
			return f.n2ConvertedBbox;
		}

		let geomBounds = undefined;
		if (f.data
			&& f.data.nunaliit_geom
			&& f.data.nunaliit_geom.bbox
			&& f.n2GeomProj
			&& mapProj) {

				const bbox = f.data.nunaliit_geom.bbox;
				if (Array.isArray(bbox)
				&& bbox.length >= 4) {
					geomBounds = bbox;

					if (mapProj.getCode() !== f.n2GeomProj.getCode) {
						geomBounds = transformExtent(bbox, f.n2GeomProj, mapProj);
					}

					f.n2ConvertedBbox = geomBounds;
				}
			}

			return geomBounds;
		}
	}

	export default N2Cluster;
