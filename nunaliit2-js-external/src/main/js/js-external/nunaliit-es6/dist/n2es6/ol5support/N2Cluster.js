/**
* @module n2es6/ol5support/N2Cluster
*/

import {getUid} from 'ol/util.js';
import {assign} from 'ol/obj.js';
import {listen, unlistenByKey} from 'ol/events.js';
import EventType from 'ol/events/EventType.js';
import VectorSource from 'ol/source/Vector.js';
//import VectorSource from '';
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
class N2Cluster extends VectorSource {

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
			clusterPrefix: null,
			disableDynamicClustering : false
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

		this.clusterPointsOnly = options.clusterPointsOnly ;

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
		
	    /**
	     * @type {Array<Feature>}
	     * @protected
	     */
	    this.features = [];
	    this.source = options.source;
	    
	    listen(this.source, EventType.CHANGE, this.refresh, this);

	}
	/**
	* Loading the feature from the layer source, and config the resolution and projection
	* @override
	*/
	loadFeatures(extent, resolution, projection) {
		this.source.loadFeatures(extent, resolution, projection);
		if (resolution !== this.resolution) {
			this.clear(true);
			this.resolution = resolution;
			this.projection = projection;
			this.extent = extent;
			this.cluster();
			this.addFeatures(this.features);
		}
	}
	
	refresh () {
		this.clear();
		this.cluster();
		this.addFeatures(this.features);
		
	}
	clear(opt_fast){
		
		 if (opt_fast) {
		      for (var featureId in this.featureChangeKeys_) {
		        var keys = this.featureChangeKeys_[featureId];
		        keys.forEach(unlistenByKey);
		      }
		      if (!this.featuresCollection_) {
		        this.featureChangeKeys_ = {};
		        this.idIndex_ = {};
		        this.undefIdIndex_ = {};
		      }
		    } else {
		      if (this.featuresRtree_) {
		        this.featuresRtree_.forEach(this.removeFeatureInternal, this);
		        for (var id in this.nullGeometryFeatures_) {
		          this.removeFeatureInternal(this.nullGeometryFeatures_[id]);
		        }
		      }
		    }
		    if (this.featuresCollection_) {
		      this.featuresCollection_.clear();
		    }

		    if (this.featuresRtree_) {
		      this.featuresRtree_.clear();
		    }
		    this.loadedExtentsRtree_.clear();
		    this.nullGeometryFeatures_ = {};

		
	}
	/**
	* The cluster function for cluster Point, Line and Geometry
	* @override
	*/
	cluster(opt_extent) {
		var that_ = this;
		if (this.resolution === undefined) {
			return;
		}
		this.features.length = 0;
		var extent = createEmpty();
		var mapDistance = this.distance * this.resolution;
		var features = null;
		if (opt_extent){
			features = this.source.getFeaturesInExtent(opt_extent);
		} else {
			features = this.source.getFeatures();
		}
		/**
		* @type {!Object<string, boolean>}
		*/
		var clustered = {};
		var taboo = {};
		for (let i = 0, ii = features.length; i < ii; i++) {
			let feature = features[i];
			var uid = getUid(feature);
			let hasInTaboo = (getUid(feature) in taboo);
			if (hasInTaboo){
				continue;
			}

			if (!(getUid(feature) in clustered)) {
				if (!this._isEligibleFeature(feature)){
					taboo[uid] = true;
					this.features.push(feature);
					continue;
				}
				// Pass in infinity extent to by-pass OpenLayers bug
				var geomExtent = feature.getGeometry().getExtent();
				var geomCentroid = getCenter(geomExtent);
				createOrUpdateFromCoordinate(geomCentroid, extent);
				buffer(extent, mapDistance, extent);

				let neighbors = this.source.getFeaturesInExtent(extent);
				neighbors = neighbors.filter(function (neighbor) {
					let uid = getUid(neighbor);
					if (! (uid in clustered)){
						if (! (uid in taboo) ){
							if (that_._isEligibleFeature(neighbor)){
								clustered[uid] = true;
								return true;
							}
						}
					}
					return false;
					
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

		var centroid = [0, 0];
		var count = 0;
		for (let i = features.length - 1; i >= 0; --i) {
			var geom = features[i].getGeometry();
			if( geom ){
				// Pass in infinity extent to by-pass OpenLayers bug
				var geomExtent = geom.getExtent();
				if( geomExtent ){
					var geomCentroid = getCenter(geomExtent);
					if (geomCentroid) {
						addCoordinate(centroid, geomCentroid);
						++count;
					}
				}
			}
		}
		scaleCoordinate(centroid, 1/count);

		var cluster = new Feature(new Point(centroid));
		cluster.cluster = features;
		cluster.fid = this.clusterPrefix + this.clusterId;
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
		var eligible = true;

		if (!this.disableDynamicClustering) {
			// Dynamic Clustering
			// Small polygons and lines are turned into a cluster
			eligible = false;

			var extent = this._computeFullBoundingBox(feature);
			if (extent) {
				// If the original bounds are larger than what is expected
				// by the resolution, do not cluster. At one point, the correct
				// geometry will arrive to show this feature.
				var xLen = (extent[2] - extent[0]) / this.resolution;
				var yLen = (extent[3] - extent[1]) / this.resolution;
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
					var bounds = feature.getGeometry().getExtent();

					var xLen = (bounds[2]-bounds[0])/ this.resolution;
					var yLen = (bounds[3]-bounds[1]) / this.resolution;
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
		return this._computeFeatureOriginalBboxForMapProjection(f, this.projection);
	}
	_computeFeatureOriginalBboxForMapProjection(f, mapProj) {
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

				var bbox = f.data.nunaliit_geom.bbox;
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
