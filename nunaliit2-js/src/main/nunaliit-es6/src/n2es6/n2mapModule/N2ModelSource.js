/**
 * @module n2es6/n2mapModule/N2ModelSource
 */

import Vector from 'ol/source/Vector.js';
import WKT from 'ol/format/WKT.js';
import Feature from 'ol/Feature.js';
import {getTransform} from 'ol/proj.js';
import {default as Projection} from 'ol/proj/Projection.js';

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };
var DH = 'n2.canvas.OL6Map.Model';

/**
 * @classdesc
 * The N2ModelSource class is the vector source using in
 * nunaliit map module, which connects the nunaliit model and openlayers 5
 * @api
 */

class N2ModelSource extends Vector {
	constructor(opt_options){
		var options = $n2.extend({
			sourceModelId: undefined
			,dispatchService: undefined
			,projCode: undefined
		}, opt_options);
		super(options);

		this.dispatchService = options.dispatchService;
		this.sourceModelId = options.sourceModelId;
		this.mapProjCode = options.projCode;

		this.epsg4326Resolution = null;
		this.onUpdateCallback = options.onUpdateCallback;
		this.callback = null;
		this.scope = null;
		this.notification = null;
		this.wildcarded = false;


		this.sourceId = $n2.getUniqueId();
		this.infoByDocId = {};

		this.loading = false;

		var _this = this;
		this.cnt = 0;
		this.modelObserver = new $n2.model.DocumentModelObserver({
			dispatchService : this.dispatchService,
			sourceModelId: this.sourceModelId,
			updatedCallback : function(state){
				_this._modelSourceUpdated(state);
			}
		});
		if( this.dispatchService ){
			var f = function(m, addr, dispatcher){
				_this._handleDispatch(m, addr, dispatcher);
			};
		}
	}

	refresh(){
	}
	_modelSourceUpdated (state) {
		
		var _this = this;
		if( typeof state.loading === 'boolean' ){
			state.loading = state.loading;
			this._reportLoading(state.loading);
		}

		if( state.added ){
			state.added.forEach(function(addedDoc){
				var docId = addedDoc._id;
				var docInfo = _this.infoByDocId[docId];
				if( !docInfo ){
					docInfo = {};
					_this.infoByDocId[docId] = docInfo;
				}
				docInfo.doc = addedDoc;
			});
		}
		if( state.updated ){
			state.updated.forEach(function(updatedDoc){
				var docId = updatedDoc._id;
				var docInfo = _this.infoByDocId[docId];
				if( !docInfo ){
					docInfo = {};
					_this.infoByDocId[docId] = docInfo;
				}

				if( docInfo.doc ){
					if( docInfo.doc._rev !== updatedDoc._rev ){
						// New version of document. Clear simplified info
						delete docInfo.simplifications;
						delete docInfo.simplifiedName;
						delete docInfo.simplifiedResolution;
						delete docInfo.simplifiedInstalled;
					}
				}
				docInfo.doc = updatedDoc;
			});
		}

		if( state.removed ){
			state.removed.forEach(function(removedDoc){
				var docId = removedDoc._id;
				delete _this.infoByDocId[docId];
			});
		}
		this._reloadAllFeatures();
		
	}
	
	loadFeatures(extent, resolution, projection) {
	}

	_reportLoading(flag){
		if( this.loading && !flag ){
			this.loading = false;
			if( this.notifications 
					&& typeof this.notifications.readEnd === 'function'){
				this.notifications.readEnd();
			}
			this._reloadAllFeatures();

		} else if( !this.loading && flag ){
			this.loading = true;
			if( this.notifications 
					&& typeof this.notifications.readStart === 'function'){
				this.notifications.readStart();
			}
		}
	}

	
	_handleDispatch(m, addr, dispatcher){
		var _this = this;

		if('simplifiedGeometryReport' === m.type) {
			if( $n2.isArray(m.simplifiedGeometries) ){
				var atLeastOne = false;
				m.simplifiedGeometries.forEach(function(simplifiedGeom){
					var docId = simplifiedGeom.id;
					var attName = simplifiedGeom.attName;
					var wkt = simplifiedGeom.wkt;

					var docInfo = _this.infoByDocId[docId];
					if( docInfo ){
						if( !docInfo.simplifications ){
							docInfo.simplifications = {};
						}
						docInfo.simplifications[attName] = wkt;
						atLeastOne = true;
					}
				});

				if( atLeastOne ){
					this._reloadAllFeatures();
				}
			}
		}
	}

	/**
	 * This function is called when the map resolution is changed
	 */
	onChangedResolution(res, proj, extent){

		this.epsg4326Resolution = this._getResolutionInProjection(res,proj);
		
		var geometriesRequested = [];
		
		for(let docId in this.infoByDocId){
			var docInfo = this.infoByDocId[docId];
			
			var doc = docInfo.doc;
			if( doc && doc.nunaliit_geom
					&& doc.nunaliit_geom.simplified
					&& doc.nunaliit_geom.simplified.resolutions ){
				var bestAttName = undefined;
				var bestResolution = undefined;
				for(let attName in doc.nunaliit_geom.simplified.resolutions){
					var attRes = parseFloat(doc.nunaliit_geom.simplified.resolutions[attName]);
					if( attRes < this.epsg4326Resolution ){
						if( typeof bestResolution === 'undefined' ){
							bestResolution = attRes;
							bestAttName = attName;
						} else if( attRes > bestResolution ){
							bestResolution = attRes;
							bestAttName = attName;
						}
					}
				}

				// At this point, if bestResolution is set, then this is the geometry we should
				// be displaying
				if( undefined !== bestResolution ){
					docInfo.simplifiedName = bestAttName;
					docInfo.simplifiedResolution = bestResolution;
				}
				
				if( docInfo.simplifiedName ) {
					// There is a simplification needed, do I have it already?
					var wkt = undefined;
					if( docInfo.simplifications ){
						wkt = docInfo.simplifications[docInfo.simplifiedName];
					}

					// If I do not have it, request it
					if( !wkt ){
						var geomRequest = {
								id: docId
								,attName: docInfo.simplifiedName
								,doc: doc
						};
						geometriesRequested.push(geomRequest);
					}
				}
			}
		}

		this._reloadAllFeatures();
		
	}

	_getResolutionInProjection(targetResolution, proj){

		if( proj.getCode() !== 'EPSG:4326' ){
			var transformFn = getTransform(proj.getCode(), 'EPSG:4326')
			// Convert [0,0] and [0,1] to proj
			var p0 = transformFn([0,0]);
			var p1 = transformFn([0,1]);

			var factor = Math.sqrt( ((p0[0]-p1[0])*(p0[0]-p1[0])) + ((p0[1]-p1[1])*(p0[1]-p1[1])) );

			targetResolution = targetResolution * factor;
		}

		return targetResolution;
	}

	_reloadAllFeatures(){
		var _this = this;

		var wktFormat = new WKT();

		let features = [];
		var proj_4326 = new Projection({code: 'EPSG:4326'});
		for(var docId in this.infoByDocId){
			
			var docInfo = this.infoByDocId[docId];
			var doc = docInfo.doc;
			if( doc
					&& doc.nunaliit_geom
					&& doc.nunaliit_geom.wkt ){
				var wkt = doc.nunaliit_geom.wkt;
				if( docInfo.simplifiedName
						&& docInfo.simplifications
						&& docInfo.simplifications[docInfo.simplifiedName] ) {
					// If there is a simplification loaded for this geometry,
					// use it
					wkt = docInfo.simplifications[docInfo.simplifiedName];
					docInfo.simplifiedInstalled = docInfo.simplifiedName;
				}
				var geometry = wktFormat.readGeometryFromText(wkt);
				geometry.transform('EPSG:4326', _this.mapProjCode);
				var feature = new Feature();

				try {
					feature.setGeometry(geometry);
				}catch (err){
					$n2.log('Error while setGeometry', err);
					alert (err);
				}

				if (docId && geometry) {
					feature.setId(docId);
					feature.data = doc;
					feature.fid =  docId;
					feature.n2GeomProj = proj_4326 ;
					features.push(feature);
				} else {
					$n2.log('Invalid feature', doc);
				}
			}
		}

		this.clear(true);
		this.addFeatures(features);
		
	}	
}

export default N2ModelSource; 
