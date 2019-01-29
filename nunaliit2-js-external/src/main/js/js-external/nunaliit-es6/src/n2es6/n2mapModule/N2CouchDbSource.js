
/**
 * @module n2es6/n2mapModule/N2CouchDbSource
 */


import Vector from 'ol/source/Vector.js';

class N2CouchDbSource extends Vector {


 	constructor(opts_){


 	 	this.sourceId = null;
 	 	this.sourceModelId = null;
 	 	this.dispatchService = null;
 	 	this.elementGenerator =  null;
 	 	this.infoByDocId = null;
 	 	this.mapProjCode =  null;
 	 	this.epsg4326Resolution =  null;


 		var opts = $n2.extend({
 			sourceModelId: undefined
 			,dispatchService: undefined
 			,projCode: undefined
 		},opts_);

 		var _this = this;

 		this.sourceId = $n2.getUniqueId();
 		this.infoByDocId = {};

 		CouchDbSource.base(this, 'constructor', opts_);

 		this.sourceModelId = opts.sourceModelId;
 		this.dispatchService = opts.dispatchService;
 		this.mapProjCode = opts.projCode;

 		// Register to events
 		if( this.dispatchService ){
 			var f = function(m, addr, dispatcher){
 				_this._handleDispatch(m, addr, dispatcher);
 			};

 			this.dispatchService.register(DH,'modelGetInfo',f);
 			this.dispatchService.register(DH,'modelStateUpdated',f);
 			this.dispatchService.register(DH,'simplifiedGeometryReport',f);
 		};

 		// Request for current state
  		if( this.sourceModelId ){
  			if( this.dispatchService ){
  				var msg = {
  					type: 'modelGetState'
  					,modelId: this.sourceModelId
  					,state: null
  				};
  				this.dispatchService.synchronousCall(DH,msg);
  				if( msg.state ){
  					this._sourceModelStateUpdated(msg.state);
  				};
  			};
  		};
 	};

 	_sourceModelStateUpdated(state){
 		var _this = this;

 		//$n2.log('map canvas receives update',state);
 		if( state.added ){
 			state.added.forEach(function(addedDoc){
 				var docId = addedDoc._id;
 				var docInfo = _this.infoByDocId[docId];
 				if( !docInfo ){
 					docInfo = {};
 					_this.infoByDocId[docId] = docInfo;
 				};
 				docInfo.doc = addedDoc;
 			});
 		};
 		if( state.updated ){
 			state.updated.forEach(function(updatedDoc){
 				var docId = updatedDoc._id;
 				var docInfo = _this.infoByDocId[docId];
 				if( !docInfo ){
 					docInfo = {};
 					_this.infoByDocId[docId] = docInfo;
 				};
 				if( docInfo.doc ){
 					if( docInfo.doc._rev !== updatedDoc._rev ){
 						// New version of document. Clear simplified info
 						delete docInfo.simplifications;
 						delete docInfo.simplifiedName;
 						delete docInfo.simplifiedResolution;
 						delete docInfo.simplifiedInstalled;
 					};
 				}
 				docInfo.doc = updatedDoc;
 			});
 		};
 		if( state.removed ){
 			state.removed.forEach(function(removedDoc){
 				var docId = removedDoc._id;
 				delete _this.infoByDocId[docId];
 			});
 		};

 		this._reloadAllFeatures();
 	}

 	_handleDispatch(m, addr, dispatcher){
 		var _this = this;

 		if('modelStateUpdated' === m.type) {
 			if( this.sourceModelId === m.modelId ){
 				this._sourceModelStateUpdated(m.state);
 			};
 		} else if('simplifiedGeometryReport' === m.type) {
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
 						};
 						docInfo.simplifications[attName] = wkt;
 						atLeastOne = true;
 					};
 				});

 				if( atLeastOne ){
 					this._reloadAllFeatures();
 				};
 			};
 		}
 	}

 	/**
 	 * This function is called when the map resolution is changed
 	 */
 	changedResolution(res,proj){
 		//$n2.log('resolution',res,proj);
 		this.epsg4326Resolution = this._getResolutionInProjection(res,proj);

 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( doc && doc.nunaliit_geom
 			 && doc.nunaliit_geom.simplified
 			 && doc.nunaliit_geom.simplified.resolutions ){
 				var bestAttName = undefined;
 				var bestResolution = undefined;
 				for(var attName in doc.nunaliit_geom.simplified.resolutions){
 					var attRes = 1 * doc.nunaliit_geom.simplified.resolutions[attName];
 					if( attRes < this.epsg4326Resolution ){
 						if( typeof bestResolution === 'undefined' ){
 							bestResolution = attRes;
 							bestAttName = attName;
 						} else if( attRes > bestResolution ){
 							bestResolution = attRes;
 							bestAttName = attName;
 						};
 					};
 				};

 				// At this point, if bestResolution is set, then this is the geometry we should
 				// be displaying
 				if( undefined !== bestResolution ){
 					docInfo.simplifiedName = bestAttName;
 					docInfo.simplifiedResolution = bestResolution;
 				};
 			};
 		};

 		var geometriesRequested = [];
 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( docInfo.simplifiedName ) {
 				// There is a simplification needed, do I have it already?
 				var wkt = undefined;
 				if( docInfo.simplifications ){
 					wkt = docInfo.simplifications[docInfo.simplifiedName];
 				};

 				// If I do not have it, request it
 				if( !wkt ){
 					var geomRequest = {
 						id: docId
 						,attName: docInfo.simplifiedName
 						,doc: doc
 					};
 					geometriesRequested.push(geomRequest);
 				};
 			};
 		}

 		this.dispatchService.send(DH,{
 			type: 'simplifiedGeometryRequest'
 			,geometriesRequested: geometriesRequested
 			,requester: this.sourceId
 		});

 		this._reloadAllFeatures();
 	}

 	_getResolutionInProjection(targetResolution, proj){

 		if( proj.getCode() !== 'EPSG:4326' ){
 			var transformFn = ol.proj.getTransform(proj.getCode(), 'EPSG:4326')
 			// Convert [0,0] and [0,1] to proj
 			var p0 = transformFn([0,0]);
 			var p1 = transformFn([0,1]);

 			var factor = Math.sqrt( ((p0[0]-p1[0])*(p0[0]-p1[0])) + ((p0[1]-p1[1])*(p0[1]-p1[1])) );

 			targetResolution = targetResolution * factor;
 		};

 		return targetResolution;
 	}

 	_reloadAllFeatures(){
 		var _this = this;

 		var wktFormat = new ol.format.WKT();

 		var features = [];
 		for(var docId in this.infoByDocId){
 			var docInfo = this.infoByDocId[docId];
 			var doc = docInfo.doc;
 			if( doc
 			 && doc.nunaliit_geom
 			 && doc.nunaliit_geom.wkt ){
 				var wkt = doc.nunaliit_geom.wkt;
 				if( docInfo.simplifiedName
 				 && docInfo.simplifications
 				 && docInfo.simplifications[docInfo.simplifiedName] ){
 					// If there is a simplification loaded for this geometry,
 					// use it
 					wkt = docInfo.simplifications[docInfo.simplifiedName];
 					docInfo.simplifiedInstalled = docInfo.simplifiedName;
 				};

 				var geometry = wktFormat.readGeometryFromText(wkt);
 				geometry.transform('EPSG:4326', _this.mapProjCode);

 				var feature = new ol.Feature();
 				feature.setGeometry(geometry);
 				feature.setId(docId);

 				docInfo.feature = feature;

// 				if (geoJSONFeature['properties']) {
// 					feature.setProperties(geoJSONFeature['properties']);
// 				}

 				features.push(feature);
 			};
 		};

 		this.clear();
 		this.addFeatures(features);
 	}
}

export default N2CouchDbSource;
