/*
Copyright (c) 2012, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id: n2.couchImportData.js 8456 2012-08-29 01:08:01Z glennbrauen $
*/
;(function($,$n2){

	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch-import',args); };

	var StatusLogger = $n2.Class({
		divId: null
		
		,initialize: function(opts_){
			var opts = $n2.extend({
				div: null
			},opts_);
			
			if( opts.div ){
				var $div = $(opts.div);
				var id = $div.attr('id');
				if( !id ){
					id = $n2.getUniqueId();
					$div.attr('id',id);
				};
				this.divId = id;
			};
		}
	
		,log: function(text){
			var $log = this._getLog();
			var id = $n2.getUniqueId();
			$('<div class="data_import_status"></div>')
				.attr('id',id)
				.text(text)
				.appendTo( $log );
			return id;
		}
		
		,error: function(text){
			var $log = this._getLog();
			var id = $n2.getUniqueId();
			$('<div class="data_import_status data_import_error"></div>')
				.attr('id',id)
				.text('Error: '+text)
				.appendTo( $log );
			return id;
		}
		
		,empty: function(){
			var $log = this._getLog();
			$log.empty();
		}
		
		,_getLog: function(){
			return $('#'+this.divId);
		}
	});

	/**
	 * Base class for data importers.  Instantiate one that includes
	 * a data loading method (e.g. $.getJSON) below or instantiate 
	 * this with a hard coded data array (this.options.dataArray)
	 * 
	 * In each case, an input JSON object is converted to be used as one 
	 * or more documents
	 * in the underlying atlas data according to atlas application requirements.
	 * The reason to do this would be because the input entry is logically
	 * composed of multiple records which in the couchdb application make
	 * more sense as a group of linked documents (i.e., documents refer 
	 * to each other using their _id fields).
	 * 
	 * To accomplish this using asynchronous document updates to push each
	 * portion of the original information to the database requires that 
	 * each piece be uploaded, then fetched to find the allocated ID, using
	 * that ID to update the related records referring to the original
	 * information portion, and then uploading the piece.
	 * 
	 * The process will support a 1:N conversion, defined as:
	 * 
	 * convertJsonForUpload: A function that takes a single
	 *                       object as input and returns an array, A, containing
	 *                       1 object ready for upload and N-1 interim objects 
	 *                       that at least potentially may be further updated
	 *                       before upload.  A[0] will be uploaded as returned
	 *                       by this function.  
	 *              
	 * incrementalUpdateFns: An array of N-1 incremental update functions, each called
	 *                       after a data portion, originally created by convertJsonForUpload,
	 *                       is uploaded to the database.
	 *                       Entry k is called after A[k] has been uploaded to update
	 *                       entries A[k+1 ... N-1] given A[k]'s doc ID.
	 *                       If when ready for upload, A[k] is
	 *                       null or undefined, it is skipped (useful for optional
	 *                       data portions).
	 *                       
	 * viewNames[]: an array of N viewNames that will be used in conjunction with 
	 *              an array of N key value functions to determine whether or not
	 *              the component objects to be uploaded already exist in the
	 *              database.  A null entry in either the viewNames array or in the
	 *              key values array means that the existence of that subcomponent
	 *              record is not checked.  This is valid if the record is only 
	 *              potentially unique in its generated document ID used to reference
	 *              it from the other information components.
	 *              
	 * keyValueFns[]: see description of viewNames above.  viewNames[k] and keyValueFns[k]
	 *                correspond to each other.
	 *                
	 * containsGeometry[]: N element array of boolean flags defining whether or not each
	 *                     output information component contains a geometry field.  Normally
	 *                     at most only one of the output records would contain geometry but
	 *                     depending on the data relationships between information components
	 *                     there's no way to know which record would contain the geometry.
	 *                     
	 * descriptiveLabels[]: an array of data type descriptive labels used in error and status
	 *                      message displays, corresponding to each information component
	 *                      created during conversion.
	 * 
	 * +------+          +--------+
	 * |  IN  |  -+-->   | OUT 1  | <----+
	 * +------+   |      +--------+      |
	 *            |                      |
	 *            |      +--------+      |
	 *            +-->   | OUT 2  |      |
	 *            |      +--------+      |
	 * conversion |                      | (example reference; later upload references earlier)
	 *  process   |                      |
	 *            |         ...          |
	 *            |                      |
	 *            |                      |
	 *            |      +--------+      |
	 *            +-->   | OUT N  | -----+
	 *                   +--------+
	 * 
	 */
	$n2.OneToManyDataImporter = $n2.Class(
		'$n2.OneToManyDataImporter',
		{
			options: {
				db: null,
				designDoc: null,
				atlasDesign: null,
				dataArray: [], // array of json objects to be converted
				statusDiv: null, // for output messages (legacy)
				logger: null,
				eraseStatusDiv: true,
				
				/*
				 * need to pause for tiling updates, per output info portion
				 */
				containsGeometry: [ false ],
				
				/*
				 * descriptive labels describing data type of each output info portion
				 * created by the conversion function.  Used in output status messages.
				 */
				descriptiveLabels: [ '' ],
				
				/*
				 * couchdb viewnames array, each of which can be used to find a 
				 * single document with a key generated from the corresponding entry 
				 * in the keyValueFns array (below).
				 */
				viewNames: [ '' ],
				
				/**
				 * Take an entry to be added and generate the key for it.  Note
				 * that each of these functions is always called on the pre-converted
				 * record (see  below).
				 * 
				 * function signature: function(entry) {}
				 * @param enrty pre-conversion data entry to be added to database.
				 * @return key value (possibly complex)
				 */
				keyValueFns: [ function(entry) { return null; } ],
				
				/**
				 * Verify that a record to be converted and added contains the required fields
				 * @param enrty pre-conversion data entry to be added to database.
				 */
				jsonPropertiesVerifyFn: function(entry) {
					return true;
				},
				
				/**
				 * convert the imported entry for adding to the database according
				 * to the current system's templates.
				 * @param entry pre-conversion data entry to be added to database.
				 * @return array of converted javascript object.
				 */
				convertJsonForUpload: function(entry) {
					return [ entry ];
				},
				
				/**
				 * incrementally update the remaining data portions for upload using
				 * the input document ID to update necessary inter-document references.
				 * @param docId database document ID
				 * @param uploadArray array of remaining document objects to be updated
				 */
				incrementalUpdateFns: [ function(docId, uploadArray) { return; } ]
			},
			
			statusId: 1, // for naming status message divs
		
			initialize: function(opts_) {
				this.options = $n2.extend({}, this.options, opts_);
				
				if( this.options.logger ){
					this.logger = this.options.logger;
					
				} else if( this.options.statusDiv ){
					this.logger = new StatusLogger({div:this.options.statusDiv});
				};
				
				if( this.options.eraseStatusDiv && this.logger ) {
					this.logger.empty();
				};
			},
			
			/**
			 * @param aIndex index of entry in data array at which to start loading.
			 */
			loadEntry: function(aIndex) {
				if (aIndex >= this.options.dataArray.length) {
					this.postStatusMsgImmediate(_loc('Done'));
					return;
				};

				var entry = this.options.dataArray[aIndex];
				var designDoc = this.options.designDoc;
				
				/*
				 * make modifiable copies of option arrays.
				 */
				var _t_viewNames = this.options.viewNames.slice(0);
				var _t_keyValueFns = this.options.keyValueFns.slice(0);
				var _t_descriptiveLabels = this.options.descriptiveLabels.slice(0);
				
				var entryStatusId = this.allocateStatusMsgSpace();
			
				confirmDocumentsDoNotExist(this, entry, function(caller) {
					/*
					 * Once all documents that need to be unique have been
					 * confirmed to not exist, begin the uploads.
					 */
					caller.createEntry(aIndex, entry);
				});				

				function confirmDocumentsDoNotExist(caller, entry, doNotExistFn) {
					if (_t_viewNames.length <= 0  ||
							_t_keyValueFns.length <= 0 ||
							_t_descriptiveLabels.length <= 0) {
						doNotExistFn(caller); // did not find an existing record in the list
						return;
					};
					
					var currKeyValFn = _t_keyValueFns.shift();
					var currViewName = _t_viewNames.shift();
					var currDescriptiveLabel = _t_descriptiveLabels.shift();

					if (! $n2.isDefined(currKeyValFn) ||
							! $n2.isDefined(currViewName)) {
						confirmDocumentsDoNotExist(caller, entry, doNotExistFn);
						return;
					};
					
					var keyVal = currKeyValFn(entry);
					if (null === keyVal) { // signal from application key value routine to skip this entry
						caller.loadEntry(aIndex+1); // skip to next entry
						return;
					};

					// Check if it exists
					designDoc.queryView({
						viewName: currViewName,
						startkey: keyVal,
						endkey: keyVal,
						onSuccess: function(rows) {
							if( rows.length > 0 ) { // already exist
								var locStr = _loc('{label} definition ({key}) already exists - not loaded or updated',{
									label: _loc(currDescriptiveLabel)
									,key: keyVal
								});
								caller.updateStatusMsgAsynch(locStr,entryStatusId);
								caller.loadEntry(aIndex+1); // skip to next entry
							} else {
								confirmDocumentsDoNotExist(caller, entry, doNotExistFn);
							};
						},
						onError: function(errorMsg){ 
							var locStr = _loc('Error: query error while verifying {label} definition ({key})',{
								label: _loc(currDescriptiveLabel)
								,key: keyVal
							});
							caller.updateStatusMsgAsynch(locStr,entryStatusId);
							caller.loadEntry(aIndex+1); // skip to next entry
						}
					});
				};				
			},
			
			/**
			 * @param aIndex index of current entry in this.options.dataArray
			 * @param entry the current json data entry
			 */
			createEntry: function(aIndex, entry) {
				var uploadDataArray = [];
				var db = this.options.db;
				var atlasDesign = this.options.atlasDesign;

				if (this.options.jsonPropertiesVerifyFn(entry)) {
					
					/*
					 * Convert input, creating possibly multiple outputs.
					 * Array of outputs returned.
					 */
					uploadDataArray = this.options.convertJsonForUpload(entry);
					
					/*
					 * The interface for the simple data importer advertises the 
					 * convertJsonForUpload fn 
					 * as simply returning a struct, not an array of structures.  Catch
					 * that case and adapt it.....
					 */
					if (! $n2.isArray(uploadDataArray)) {
						uploadDataArray = [ uploadDataArray ];
					};
					
					/*
					 * make modifiable copies of option arrays.
					 */
					var _t_descriptiveLabels = this.options.descriptiveLabels.slice(0);
					var _t_incrementalUpdateFns = this.options.incrementalUpdateFns.slice(0);
					var _t_containsGeometry = this.options.containsGeometry.slice(0);
					
					/*
					 * NOTE: one-pass update.  Data portions created as documents
					 * later can only refer to ones created earlier.
					 * 
					 * 1) upload uploadDataArray[0]
					 * 2) for each subsequent element of uploadDataArray, k:
					 *    2a) update uploadDataArray elements [k ... N-1]
					 *    2b) upload uploadDataArray[k]
					 *    2c) if uploadDataArray[k] contains geometry, query 
					 *        the database tiling views to allow the server
					 *        to keep up.
					 */
					createEntryUpdateSubsequentEntries(this);

					
				} else {
					this.postStatusMsgImmediate(_loc('Required fields missing for ') +
							this.options.descriptiveLabels[0] + _loc(' definition: ') + aIndex);
					next(this);
				};
				
				function next(caller) {
					if (uploadDataArray.length > 0) {
						createEntryUpdateSubsequentEntries(caller);
					} else {
						caller.loadEntry(aIndex+1);
					};
				};
				
				function createEntryUpdateSubsequentEntries(caller) {
					if (uploadDataArray.length <= 0) { // done - no more entries to upload
						return;
					};
					
					/*
					 * Generate asynch status div, even though it may not be used.  This
					 * keeps asynch and immediate messages in a consistent order, aligning with
					 * the order of elements in the uploadDataArray.
					 */
					var entryStatusId = caller.allocateStatusMsgSpace();

					var nextUpload = uploadDataArray.shift();
					var currDescriptiveLabel = _t_descriptiveLabels.shift();
					var currContainsGeometry = _t_containsGeometry.shift();
					var currIncrementalUpdateFn = null;
					if (uploadDataArray.length >= 1) { // at least one subsequent record, so should be an incremental update fn
						currIncrementalUpdateFn = _t_incrementalUpdateFns.shift();
					};
					
					if (! $n2.isDefined(nextUpload)) { // move to next data portion or next record.
						caller.postStatusMsgImmediate(currDescriptiveLabel + _loc(' definition null and skipped.'));
						next(caller);
						return;
					};

					$n2.couchDocument.adjustDocument(nextUpload);

					db.createDocument({
						data: nextUpload,
						onSuccess: function(docInfo) { // @param docInfo JSON object {ok: <bool>, id: <id>, rev: <rev> }
							caller.updateStatusMsgAsynch(
								currDescriptiveLabel + _loc(' definition (') + docInfo.id + ')', 
								entryStatusId);
							
							if ($n2.isDefined(currIncrementalUpdateFn)) {
								var uploadedDoc = $n2.extend({},nextUpload,{
									_id: docInfo.id
									,_rev: docInfo.rev
								});
								currIncrementalUpdateFn(docInfo.id, uploadDataArray,uploadedDoc);
							};
							
							/*
							 *  this will initiate next record's upload, after delaying to
							 *  allow the server to perform geometry indexing if required.
							 */
							queryViews(atlasDesign, caller, currContainsGeometry, next);
						},
						onError: function(err) {
							$n2.log('Error creating document: '+err, nextUpload);
							caller.updateStatusMsgAsynch(
								_loc('Error creating ') + currDescriptiveLabel + 
									_loc(' definition (index: ') + aIndex + _loc('). STOPPING: ') + err, 
								entryStatusId);
						}
					});
					
				};
			},
			
			/**
			 * set the input data array
			 * @param data array of JSON objects
			 */
			setDataArray: function(data) {
				this.options.dataArray = data;
			},
			
			/**
			 * post a synchronous status message
			 */
			postStatusMsgImmediate: function(msg) {
				if( this.logger ){
					return this.logger.log(msg);
				};
				return null;
			},
			
			/**
			 * allocate a spot for an asynchronous message, return the 
			 * allocated div ID for use later updating
			 */
			allocateStatusMsgSpace: function() {
				if( this.logger ){
					return this.logger.log('');
				};
				return null;
			},
			
			/**
			 * Update an asynchronously allocated status space
			 */
			updateStatusMsgAsynch: function(msg, id) {
				if( id ) $('#'+id).text(msg);
			}
		});
		
	/**
	 * Simple data importer - without 1:n data splitting.
	 * 
	 * Encapsulates an above one-to-many instance.  Note that, as opposed to
	 * the 1:n converter above, some of the options for this class are expected to be
	 * singleton values rather than arrays of values.  See comments and usage in
	 * this.initialize.
	 */
	$n2.DataImporter = $n2.Class(
		'$n2.DataImporter',
		{
			options: {
				db: null,
				designDoc: null,
				atlasDesign: null,
				dataArray: [], // array of json objects
				containsGeometry: false, // need to pause for tiling updates?
				statusDiv: null, // for output messages (legacy)
				logger: null,
				descriptiveLabel: '', // for output messages

				/*
				 * couchdb viewName array used to find a 
				 * single document with a key
				 * generated using the keyValueFn (below).
				 */
				viewName: '',

				/**
				 * Take an entry to be added and generate the key for it.  Note
				 * that this function is always called on the pre-converted
				 * record (see convertJsonForUpload below).
				 * 
				 * function signature: function(entry) {}
				 * @param enrty pre-conversion data entry to be added to database.
				 * @return key value (possibly complex)
				 */
				keyValueFn: function(entry) { return null; },

				/**
				 * Verify that a record to be added contains the required fields
				 * @param enrty pre-conversion data entry to be added to database.
				 */
				jsonPropertiesVerifyFn: function(entry) {
					return true;
				},

				/**
				 * convert the imported entry for adding to the database according
				 * to the current system's templates.
				 * @param enrty pre-conversion data entry to be added to database.
				 * @return convert javascript object.
				 */
				convertJsonForUpload: function(entry) {
					return entry;
				}
			},
			
			/*
			 * encapsulated importer
			 */
			importer: null,

			initialize: function(opts_) {
				this.options = $n2.extend({}, this.options, opts_);
				
				this.importer = new $n2.OneToManyDataImporter({
					db: this.options.db,
					designDoc: this.options.designDoc,
					atlasDesign: this.options.atlasDesign,
					dataArray: this.options.dataArray,
					containsGeometry: [ this.options.containsGeometry ],
					statusDiv: this.options.statusDiv,
					logger: this.options.logger,
					descriptiveLabels: [ this.options.descriptiveLabel ],
					viewNames: [ this.options.viewName ],
					keyValueFns: [ this.options.keyValueFn ],
					jsonPropertiesVerifyFn: this.options.jsonPropertiesVerifyFn,
					convertJsonForUpload: this.options.convertJsonForUpload,
					incrementalUpdateFns: [] // n-1 entries (see comments)
				});
			},
			
			loadEntry: function(aIndex) {
				this.importer.loadEntry(aIndex);
			},
			
			/**
			 * set the input data array
			 * @param data array of JSON objects
			 */
			setDataArray: function(data) {
				this.options.dataArray = data;
				this.importer.setDataArray(data);
			}
		});
	
	/*
	 * Input plug-ins.  Add input handling, resulting in the definition of the
	 * DataImporter's dataArray option and finally the calling of the importer's
	 * loadEntry function.
	 * 
	 * Required of dataImporter:
	 * - setDataArray fn
	 * - loadEntry fn
	 */
	$n2.JSONInputPlugInForDataImport = $n2.Class(
		'$n2.JSONInputPlugInForDataImport',
		{
			options: {
				jsonFile: '',
				importer: null,
				entriesFromData: function(data){
					return data;
				}
			},
			
			initialize: function(opts_) {
				this.options = $n2.extend({}, this.options, opts_);
			},
			
			loadJson: function() {
				var this_ = this;
				$.getJSON(
					this.options.jsonFile, 
					function(data, textStatus) {
						var entries = null;
						if( data ){
							entries = this_.options.entriesFromData(data);
						};
						if( entries && $n2.isArray(entries) ) {
							this_.options.importer.setDataArray(entries);
							this_.options.importer.loadEntry(0);
						};
					});
			}

		});

	$n2.GeoJSONInputPlugInForDataImport = $n2.Class(
		'$n2.GeoJSONInputPlugInForDataImport',
		{
			options: {
				jsonFile: '',
				importer: null,
				
				 /* 
				  * convertJsonForUpload fn probably wants to use the crs for each GeoJson.
				  */
				crs: 'EPSG:4326'
			},
			
			geojsonParser: null,

			initialize: function(opts_) {
				this.options = $n2.extend({}, this.options, opts_);
				this.geojsonParser = new OpenLayers.Format.GeoJSON();
			},

			loadGeoJson: function() {
				var this_ = this;
				$.getJSON(
					this.options.jsonFile, 
					function(data, textStatus) {
						if ($n2.isDefined(data) &&
								$n2.isDefined(data.crs) &&
								$n2.isDefined(data.crs.type) &&
								'name' === data.crs.type &&
								$n2.isDefined(data.crs.properties) &&
								$n2.isDefined(data.crs.properties.name)) {
							this_.options.crs = data.crs.properties.name;
						};

						if ($n2.isDefined(data) &&
								$n2.isDefined(data.type) && 
								'featurecollection' === data.type.toLowerCase() &&
								$n2.isDefined(data.features) && 
								$n2.isArray(data.features)) {

							var dataArray = [];

							for (var i=0, len=data.features.length; i < len; i++) {

								var olVector = this_.geojsonParser.read(
										data.features[i], 
										"Feature", 
										null);
								dataArray.push(olVector);

							};
							
							this_.options.importer.setDataArray(dataArray);
							this_.options.importer.loadEntry(0);
						};

				});
			},
			
			/**
			 * Convert an openlayers vector object, created by parsing the 
			 * geojson, to Well Known Text structured as a JS object
			 * containing a nunaliit_geom.
			 * 
			 * Although this is a locally scoped function within the class, it actually
			 * needs to be called (most likely) from the context of a convertJsonForUpload
			 * function in code using these importer classes.  Because this function is
			 * really stateless, it could simply be invoked through the object prototype:
			 * 
			 * 	var geom_obj = $n2.GeoJSONInputPlugInForDataImport.prototype.convertGeomToWkt.call(this, olVector);
			 * 
			 * @param entry openlayers vector object
			 */
			convertGeomToWkt: function(olVector) {
                var wkt = olVector.geometry.toString();
                var bounds = olVector.geometry.getBounds();
                var xmin = bounds.left;
                var xmax = bounds.right;
                var ymin = bounds.bottom;
                var ymax = bounds.top;

				return {
                	nunaliit_geom: {
                		nunaliit_type: "geometry",
                		wkt: wkt,
                		bbox: [ xmin, ymin, xmax, ymax ]
                	}
				};
			}
		});

	/*
	 * helper functions
	 */
	
	/**
	 * @param containsGeometry true if this data type contains geometry
	 * @param doNextEntryFn fn to call when view checking is done and it is 
	 *                      time to load the next entry
	 */
	function queryViews(atlasDesign, caller, containsGeometry, doNextEntryFn) {
		var viewsToQuery;

		function doViewCheck(firstCall) {
			if (firstCall) {
				tilingViews = [
				                'geom-layer-tile200',
				                'geom-layer-tile25m',
				                'geom-layer-tile65k',
				                'geom-tile200',
				                'geom-tile25m',
				                'geom-tile65k'
				                ];
			};
			
			/*
			 * only query tiling views for data that contains geometry
			 */
			if (!containsGeometry || tilingViews.length < 1) {
				doNextEntryFn(caller);
			} else {
				var viewName = tilingViews.pop();
				atlasDesign.queryView({
					viewName: viewName,
					limit: 1,
					onSuccess: function() { doViewCheck(false); }, // query next
					onError: function(err) {
						$('#status').append( 
								$('<div>' + 
								_loc('STOPPING: Failed verifying view ') +
								viewName + 
								' ('+err+')' ));
					}
				});
			};
		};
		doViewCheck(true);
	};

})(jQuery,nunaliit2);
