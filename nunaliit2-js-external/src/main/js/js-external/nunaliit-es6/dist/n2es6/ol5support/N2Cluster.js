'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require('ol/util.js');

var _Cluster2 = require('ol/source/Cluster.js');

var _Cluster3 = _interopRequireDefault(_Cluster2);

var _proj = require('ol/proj.js');

var _extent = require('ol/extent.js');

var _Point = require('ol/geom/Point.js');

var _Point2 = _interopRequireDefault(_Point);

var _Feature = require('ol/Feature.js');

var _Feature2 = _interopRequireDefault(_Feature);

var _coordinate = require('ol/coordinate.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * @module n2es6/ol5support/N2Cluster
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                */

/**
 * @classdesc
 * Layer source to cluster vector data. Working module for nunaliit webgis
 * system
 * @api
 */
var N2Cluster = function (_Cluster) {
  _inherits(N2Cluster, _Cluster);

  /**
   * @param {Options} options CLuster options
   */
  function N2Cluster(options) {
    _classCallCheck(this, N2Cluster);

    /**
     * @type {number|undefined}
     * @protected
     */
    var _this = _possibleConstructorReturn(this, (N2Cluster.__proto__ || Object.getPrototypeOf(N2Cluster)).call(this, options));

    _this.distance = options.distance !== undefined ? options.distance : 20;

    /**
     * @type {number}
     */
    _this.minimumPolygonPixelSize = options.minimumPolygonPixelSize !== undefined ? options.minimumPolygonPixelSize : _this.distance;

    /**
     * @type {number}
     */
    _this.minimumLinePixelSize = options.minimumLinePixelSize !== undefined ? options.minimumLinePixelSize : _this.distance;

    /**
     * @type {boolean}
     */
    _this.disableDynamicClustering = options.disableDynamicClustering !== undefined ? options.disableDynamicClustering : false;

    /**
     * @type {boolean}
     */
    _this.clusterPointsOnly = options.clusterPointsOnly !== undefined ? options.clusterPointsOnly : false;

    /**
     * @type {number}
     */
    _this.threshold = options.threshold !== undefined ? options.threshold : null;

    /**
     *  @type {number}
     */
    _this.resolution = 1;

    /**
     *  @type {string}
     */
    _this.projection = null;

    /**
     * @type {string}
     */
    _this.clusterPrefix = options.clusterPrefix;

    /**
     * @type {number}
     */
    _this.clusterId = 1;

    return _this;
  }
  /**
   * Loading the feature from the layer source, and config the resolution and projection
   * @override
   */


  _createClass(N2Cluster, [{
    key: 'loadFeatures',
    value: function loadFeatures(extent, resolution, projection) {
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

  }, {
    key: 'cluster',
    value: function cluster() {
      var _this2 = this;

      var that_ = this;
      if (this.resolution === undefined) {
        return;
      }
      this.features.length = 0;
      var extent = (0, _extent.createEmpty)();
      var mapDistance = this.distance * this.resolution;
      var features = this.source.getFeatures();
      /**
      * @type {!Object<string, boolean>}
      */
      var clustered = {};
      var ineligibleList = {};

      var _loop = function _loop(i, ii) {
        var feature = features[i];
        var uid = (0, _util.getUid)(feature);
        if (!_this2._isEligibleFeature(feature)) {
          ineligibleList[uid] = true;
          _this2.features.push(feature);
          return 'continue';
        }
        if (!((0, _util.getUid)(feature) in clustered)) {

          var coordinates = (0, _extent.getCenter)(feature.getGeometry().computeExtent());
          (0, _extent.createOrUpdateFromCoordinate)(coordinates, extent);
          (0, _extent.buffer)(extent, mapDistance, extent);

          var neighbors = _this2.source.getFeaturesInExtent(extent);
          neighbors = neighbors.filter(function (neighbor) {
            var uid = (0, _util.getUid)(neighbor);
            if (!(uid in clustered) && !(uid in ineligibleList || !that_._isEligibleFeature(feature))) {
              clustered[uid] = true;
              return true;
            } else {
              return false;
            }
          });
          _this2.features.push(_this2.createCluster(neighbors));
        }
      };

      for (var i = 0, ii = features.length; i < ii; i++) {
        var _ret = _loop(i, ii);

        if (_ret === 'continue') continue;
      }
    }

    /**
     * @param {Array<Feature>} features Features
     * @return {Feature} The cluster feature.
     * @protected
     */

  }, {
    key: 'createCluster',
    value: function createCluster(features) {

      var centroid = [0, 0];
      for (var i = features.length - 1; i >= 0; --i) {
        var centerDelta = (0, _extent.getCenter)(features[i].getGeometry().computeExtent());
        if (centerDelta) {
          (0, _coordinate.add)(centroid, centerDelta);
        }
      }
      (0, _coordinate.scale)(centroid, 1 / features.length);

      var cluster = new _Feature2.default(new _Point2.default(centroid));
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

  }, {
    key: '_isEligibleFeature',
    value: function _isEligibleFeature(feature) {
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
          if (xLen < this.minimumLinePixelSize && yLen < this.minimumLinePixelSize) {
            eligible = true;
          }
        } else {
          // We are unable to compute the bounds for this feature.
          // Use the geometry for the purpose of clustering
          if (feature.getGeometry().getType().indexOf('Point') >= 0) {
            eligible = true;
          } else {
            var bounds = feature.getGeometry().computeExtent();

            var _xLen = (bounds[2] - bounds[0]) / this.resolution;
            var _yLen = (bounds[3] - bounds[1]) / this.resolution;
            if (_xLen < this.minimumLinePixelSize && _yLen < this.minimumLinePixelSize) {
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

  }, {
    key: '_computeFullBoundingBox',
    value: function _computeFullBoundingBox(f) {
      return this._ComputeFeatureOriginalBboxForMapProjection(f, this.projection);
    }
  }, {
    key: '_ComputeFeatureOriginalBboxForMapProjection',
    value: function _ComputeFeatureOriginalBboxForMapProjection(f, mapProj) {
      // Each feature has a projection stored at f.n2GeomProj
      // that represents the original projection for a feature
      //
      // Each feature has a property named 'n2ConvertedBbox' that contains
      // the full geometry bbox converted for the map projection, if
      // already computed.

      if (f && f.n2ConvertedBbox) {
        return f.n2ConvertedBbox;
      }

      var geomBounds = undefined;
      if (f.data && f.data.nunaliit_geom && f.data.nunaliit_geom.bbox && f.n2GeomProj && mapProj) {

        var bbox = f.data.nunaliit_geom.bbox;
        if (Array.isArray(bbox) && bbox.length >= 4) {
          geomBounds = bbox;

          if (mapProj.getCode() !== f.n2GeomProj.getCode) {
            geomBounds = (0, _proj.transformExtent)(bbox, f.n2GeomProj, mapProj);
          }

          f.n2ConvertedBbox = geomBounds;
        }
      }

      return geomBounds;
    }
  }]);

  return N2Cluster;
}(_Cluster3.default);

exports.default = N2Cluster;