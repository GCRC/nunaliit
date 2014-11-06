/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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

*/

;(function($,$n2) {

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

//=========================================================================
var operationPatterns = [];

function addOperationPattern(pattern, aClass){
	operationPatterns.push({
		pattern: pattern
		,supportingClass: aClass
	});
};

function createOperationFromString(opString){
	for(var i=0,e=operationPatterns.length; i<e; ++i){
		var opPattern = operationPatterns[i];
		var matches = opPattern.pattern.test(opString);
		if( matches ){
			var op = new opPattern.supportingClass(opString);
			return op;
		};
	};
	
	return null;
};

//=========================================================================
var UpgradeAnalysis = $n2.Class({
	
	profile: null,
	
	changesById: null,
	
	dbDocsByImportId: null,
	
	entriesByImportId: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			profile: null
		},opts_);
		
		this.profile = opts.profile;
		
		this.changesById = {};
		this.dbDocsByImportId = {};
		this.entriesByImportId = {};
		
		this.modificationCount = 0;
		this.additionCount = 0;
		this.deletionCount = 0;
	},
	
	getImportProfile: function(){
		return this.profile;
	},
	
	getChange: function(changeId){
		return this.changesById[changeId];
	},
	
	getChanges: function(){
		var changes = [];
		for(var changeId in this.changesById){
			changes.push( this.changesById[changeId] );
		};
		return changes;
	},
	
	removeChange: function(changeId){
		delete this.changesById[changeId];
	},
	
	getDbDoc: function(importId){
		return this.dbDocsByImportId[importId];
	},
	
	getDbDocs: function(){
		var dbDocs = [];
		for(var importId in this.dbDocsByImportId){
			var dbDoc = this.dbDocsByImportId[importId];
			dbDocs.push(dbDoc);
		};
		return dbDocs;
	},
	
	getImportEntry: function(importId){
		return this.entriesByImportId[importId];
	},
	
	getImportEntries: function(){
		var entries = [];
		for(var importId in this.entriesByImportId){
			var entry = this.entriesByImportId[importId];
			entries.push(entry);
		};
		return entries;
	},
	
	addAddition: function(opts_){
		var opts = $n2.extend({
			importId: null
			,importEntry: null
		},opts_);
		
		this.entriesByImportId[opts.importId] = opts.importEntry;
		
		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'addition'
			,isAddition: true
			,importId: opts.importId
		};
		++this.additionCount;
		this.changesById[changeId] = change;
		return change;
	},
	
	addModification: function(opts_){
		var opts = $n2.extend({
			importId: null // string
			,modifiedProperties: null // array
			,inconsistentProperties: null // array
			,modifiedGeometry: null // boolean
			,dbDoc: null // doc
			,importEntry: null // entry
		},opts_);
		
		this.entriesByImportId[opts.importId] = opts.importEntry;
		this.dbDocsByImportId[opts.importId] = opts.dbDoc;

		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'modification'
			,isModification: true
			,importId: opts.importId
			,modifiedProperties: opts.modifiedProperties
			,inconsistentProperties: opts.inconsistentProperties
			,modifiedGeometry: opts.modifiedGeometry
		};
		++this.modificationCount;
		this.changesById[changeId] = change;
		return change;
	},
	
	addDeletion: function(opts_){
		var opts = $n2.extend({
			importId: id
			,dbDoc: dbDocsByImportId[id]
		},opts_);

		this.dbDocsByImportId[opts.importId] = opts.dbDoc;
		
		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'deletion'
			,isDeletion: true
			,importId: opts.importId
		};
		++this.deletionCount;
		this.changesById[changeId] = change;
		return change;
	}
});

//=========================================================================
var UpgradeAnalyzer = $n2.Class({
	
	profile: null,
	
	atlasDesign: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			profile: null
			,atlasDesign: null
		},opts_);
		
		this.profile = opts.profile;
		this.atlasDesign = opts.atlasDesign;
	},

	analyzeEntries: function(opts_){
		var opts = $n2.extend({
			entries: null
			,onSuccess: function(analysis){}
			,onError: function(err){}
		},opts_);

		var _this = this;
		var profileId = this.profile.getId();
		var analysis = new UpgradeAnalysis({
			profile: this.profile
		});
		var dbDocsByImportId = {};
		
		this.atlasDesign.queryView({
			viewName: 'nunaliit-import'
			,reduce: false
			,include_docs: true
			,startkey: [profileId,null]
			,endkey: [profileId,{}]
			,onSuccess: function(rows){
				var count = 0;
				for(var i=0,e=rows.length; i<e; ++i){
					var doc = rows[i].doc;
					if( doc 
					 && doc.nunaliit_import 
					 && doc.nunaliit_import.id ) {
						++count;
						dbDocsByImportId[doc.nunaliit_import.id] = doc;
					};
				};
				
				dbDocumentsLoaded();
			}
			,onError: function(err){
				opts.onError( _loc('Error loading documents from database: {err}',{err:err}) );
			}
		});
		
		function dbDocumentsLoaded(){
			// Explore input import data for changes
			importEntriesById = {};
			if( opts.entries ){
				for(var i=0,e=opts.entries.length; i<e; ++i){
					var entry = opts.entries[i];
					var id = entry.getId();
					
					if( id ){
						importEntriesById[id] = entry;
						
						if( dbDocsByImportId[id] ){
							// Already exists in database
							// Check if modified
							var c = _this._compare(
								importEntriesById[id]
								,dbDocsByImportId[id]);
							if( c ){
								analysis.addModification({
									importId: c.importId
									,modifiedProperties: c.modifiedProperties
									,inconsistentProperties: c.inconsistentProperties
									,modifiedGeometry: c.modifiedGeometry
									,dbDoc: dbDocsByImportId[id]
									,importEntry: importEntriesById[id]
								});
							};
							
						} else {
							// New to database
							analysis.addAddition({
								importId: id
								,importEntry: importEntriesById[id]
							});
						};
					} else {
						opts.onError( _loc('Imported entry does not contains an id attribute') );
						return;
					};
				};
			};
			
			for(var id in dbDocsByImportId){
				if( importEntriesById[id] ) {
					// OK
				} else {
					analysis.addDeletion({
						importId: id
						,dbDoc: dbDocsByImportId[id]
					});
				};
			};

			opts.onSuccess(analysis);
		};
	},
	
	_compare: function(importEntry, doc){
		var props = importEntry.getProperties();
		var dbData = doc.nunaliit_import.data;
		var importId = doc.nunaliit_import.id;
		
		var change = null;
		
		// Look at values that have changed since the last import
		for(var propName in props){
			var value = props[propName];
			
			if( value !== dbData[propName] ){
				if( !change ) change = {
					id:importId
					,modifiedProperties: []
					,modifiedGeometry: false
					,inconsistentProperties: []
				};
				change.modifiedProperties.push(propName);
			};
		};
		
		// Look for values that have become inconsistent since the last
		// import
		var inconsistentProperties = this.profile.getInconsistentProperties(doc);
		if( inconsistentProperties.length > 0 ){
			if( !change ) change = {
				id:importId
				,modifiedProperties: []
				,modifiedGeometry: false
				,inconsistentProperties: []
			};
			for(var i=0,e=inconsistentProperties.length; i<e; ++i){
				var inconsistentProp = inconsistentProperties[i];
				change.inconsistentProperties.push(inconsistentProp);
			};
		};
		
//		var remoteGeom = null;
//		var localGeom = doc.nunaliit_import.geometry ? doc.nunaliit_import.geometry : {};
//		var deltaGeom = patcher.computePatch(localGeom, remoteGeom);
//		if( deltaGeom ){
//			if( !change ) change = {
//				id:importId
//				,modifiedProperties: []
//				,modifiedGeometry: false
//			};
//			change.modifiedGeometry = true;
//		};
		
		return change;
	}
});

//=========================================================================
var AnalysisReport = $n2.Class({
	elemId: null,
	analysis: null,
	logFn: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			elem: null
			,elemId: null
			,analysis: null
			,logFn: null
		},opts_);
		
		var _this = this;
		
		this.elemId = opts.elemId;
		if( !this.elemId && opts.elem ){
			var $elem = $(opts.elem);
			this.elemId = $elem.attr('id');
			if( !this.elemId ){
				this.elemId = $n2.getUniqueId();
				$elem.attr('id',this.elemId);
			};
		};
		
		this.analysis = opts.analysis;
		this.logFn = opts.logFn;
		
		var $elem = _this._getElem();
		$elem.empty();
		
		// Title
		$('<div class="title">')
			.appendTo($elem)
			.text( _loc('Verification') );
		
		$('<div class="changes">')
			.appendTo($elem);
		
		this._reportChanges();
	},

	_getElem: function(){
		return $('#'+this.elemId);
	},
	
	_log: function(str){
		if( this.logFn ){
			this.logFn(str);
		};
	},
	
	_reportChanges: function(){
		var _this = this;
		
		var $changes = this._getElem().find('.changes')
			.empty();
		
		var proceedClickFn = function(){
			var $btn = $(this);
			_this._proceed($btn);
			return false;
		};
		var discardClickFn = function(){
			var $btn = $(this);
			_this._discard($btn);
			return false;
		};
		
		var analysis = this.analysis;
		var changes = analysis.getChanges();
		
		if( changes.length < 1 ){
			$changes.text( _loc('No changes detected in the import data') );
			return;
		};
		
		if(analysis.getDbDocs().length < 1){
			var $div = $('<div>')
				.addClass('prompt')
				.appendTo($changes);
			$div.text( _loc('This appears to be the first time that you are importing this profile. Accept all?') );
			$('<button>')
				.text( _loc('Proceed') )
				.appendTo($div)
				.click(function(){
					_this._proceedAll();
				});
			$('<button>')
				.text( _loc('Discard') )
				.appendTo($div)
				.click(function(){
					var $button = $(this);
					var $promptElem = $button.parents('.prompt');
					$promptElem.remove();
				});
		};
		
		// Report new
		for(var i=0,e=changes.length; i<e; ++i){
			var change = changes[i];
			if( change.isAddition ) {
				var importId = change.importId;
				var importEntry = analysis.getImportEntry(importId);
				var importProperties = importEntry.getProperties();
				var $div = $('<div>')
					.attr('id',change.changeId)
					.addClass('addition operation')
					.appendTo($changes);
				$('<button>')
					.addClass('discard')
					.text( _loc('Discard') )
					.appendTo($div)
					.click(discardClickFn);
				$('<button>')
					.addClass('proceed')
					.text( _loc('Create new document') )
					.appendTo($div)
					.click(proceedClickFn);
				$('<div>')
					.addClass('explanation')
					.text( _loc('Create new document') )
					.appendTo($div);
				$('<div>')
					.addClass('geoJsonId')
					.text( 'Import ID: '+importId )
					.appendTo($div);
				var $properties = $('<div>')
					.addClass('properties')
					.appendTo($div);
				if( importEntry ){
					for(var propName in importProperties){
						var propValue = importProperties[propName];
						var $prop = $('<div>')
							.addClass('property')
							.appendTo($properties);
						$('<div>')
							.addClass('propertyName')
							.text(propName)
							.appendTo($prop);
						$('<div>')
							.addClass('newValue')
							.text(propValue)
							.appendTo($prop);
					};
				};
			};
		};
		
		// Report modifications
		for(var i=0,e=changes.length; i<e; ++i){
			var change = changes[i];
			if( change.isModification ) {
				var importId = change.importId;
				var importEntry = analysis.getImportEntry(importId);
				var importProperties = importEntry.getProperties();
				var doc = analysis.getDbDoc(importId);
				var $div = $('<div>')
					.attr('id',change.changeId)
					.addClass('modify operation')
					.appendTo($changes);
				$('<button>')
					.addClass('discard')
					.text( _loc('Discard') )
					.appendTo($div)
					.click(discardClickFn);
				$('<button>')
					.addClass('proceed')
					.text( _loc('Modify Document') )
					.appendTo($div)
					.click(proceedClickFn);
				$('<div>')
					.addClass('explanation')
					.text( _loc('Modify existing document') )
					.appendTo($div);
				$('<div>')
					.addClass('geoJsonId')
					.text( 'Import ID: '+importId )
					.appendTo($div);
				$('<div>')
					.addClass('docId')
					.text( 'Database ID: '+doc._id )
					.appendTo($div);
				var $properties = $('<div>')
					.addClass('properties')
					.appendTo($div);
				if( importEntry ){
					for(var propName in importProperties){
						var propValue = importProperties[propName];
						var docValue = null;
						if( doc 
						 && doc.nunaliit_import 
						 && doc.nunaliit_import.data ){
							docValue = doc.nunaliit_import.data[propName];
						};

						if( propValue !== docValue ) {
							var $prop = $('<div>')
								.addClass('property')
								.appendTo($properties);
							$('<div>')
								.addClass('propertyName')
								.text(propName)
								.appendTo($prop);
							$('<div>')
								.addClass('previousValue')
								.text(docValue)
								.appendTo($prop);
							$('<div>')
								.addClass('newValue')
								.text(propValue)
								.appendTo($prop);
						};
					};
				};
				if( change.modifiedGeometry ){
					var $prop = $('<div>')
						.addClass('property')
						.appendTo($properties);
					$('<div>')
						.addClass('propertyName')
						.text( _loc('Geometry is modified') )
						.appendTo($prop);
				};
			};
		};
		
		// Report deletions
		for(var i=0,e=changes.length; i<e; ++i){
			var change = changes[i];
			if( change.isDeletion ) {
				var importId = change.importId;
				var doc = analysis.getDbDoc(importId);
				var $div = $('<div>')
					.attr('id',change.changeId)
					.addClass('delete operation')
					.appendTo($changes);
				$('<button>')
					.addClass('discard')
					.text( _loc('Discard') )
					.appendTo($div)
					.click(discardClickFn);
				$('<button>')
					.addClass('proceed')
					.text( _loc('Delete Database Document') )
					.appendTo($div)
					.click(proceedClickFn);
				$('<div>')
					.addClass('explanation')
					.text( _loc('Delete existing document') )
					.appendTo($div);
				$('<div>')
					.addClass('geoJsonId')
					.text( 'Import ID: '+change.id )
					.appendTo($div);
				$('<div>')
					.addClass('docId')
					.text( 'Database ID: '+doc._id )
					.appendTo($div);
				var $properties = $('<div>')
					.addClass('properties')
					.appendTo($div);
				if( doc 
				 && doc.nunaliit_import 
				 && doc.nunaliit_import.data ){
					for(var propName in doc.nunaliit_import.data){
						var propValue = doc.nunaliit_import.data[propName];
						var $prop = $('<div>')
							.addClass('property')
							.appendTo($properties);
						$('<div>')
							.addClass('propertyName')
							.text(propName)
							.appendTo($prop);
						$('<div>')
							.addClass('previousValue')
							.text(propValue)
							.appendTo($prop);
					};
				};
			};
		};
	},
	
	_proceed: function($button){
		var $opsElem = $button.parents('.operation');
		this._proceedWithOperationElement($opsElem);
	},

	_proceedAll: function(){
		var _this = this;
		
		var $elem = this._getElem();
		var $changes = $elem.find('.changes');
		var $ops = $changes.find('.operation');
		
		$ops.each(function(){
			var $op = $(this);
			_this._proceedWithOperationElement($op);
		});
	},
	
	_proceedWithOperationElement: function($opsElem){
		var changeId = $opsElem.attr('id');
		var change = this.analysis.getChange(changeId);
		if( change.isAddition ){
			// Create doc
			this._createDocument(change);
			
		} else if( change.isModification ){
			// Modify document
			this._modifyDocument(change);
			
		} else if( change.isDeletion ){
			// Delete database document
			this._deleteDocument(change);
			
		} else {
			alert( _loc('Operation not recognized') );
		};
	},

	_discard: function($button){
		var $opsElem = $button.parents('.operation');
		var elemId = $opsElem.attr('id');
		this._completed(elemId);
	},

	_completed: function(elemId){
		this.analysis.removeChange(elemId);
		$('#'+elemId).remove();
	},
	
	_createDocument: function(change){
		var _this = this;
		
		var importId = change.importId;
		var importEntry = this.analysis.getImportEntry(importId);
		var importProperties = importEntry.getProperties();
		var importProfile = this.analysis.getImportProfile();
		var schema = importProfile.getSchema();
		var layerName = importProfile.getLayerName();
		
		var doc = null;
		if( schema ){
			doc = schema.createObject();
		} else {
			doc = {};
		};
		
		// Schema name
		if( !doc.nunaliit_schema
		 && schema ) {
			doc.nunaliit_schema = schema.name;
		};
		
		// Layer id
		if( layerName ) {
			if( !doc.nunaliit_layers ){
				doc.nunaliit_layers = [];
			};
			if( doc.nunaliit_layers.indexOf(layerName) < 0 ){
				doc.nunaliit_layers.push(layerName);
			};
		};
		
		// nunaliit_import
		if( !doc.nunaliit_import ) {
			doc.nunaliit_import = {
				data:{}
			};
		};
		doc.nunaliit_import.id = importId;
		doc.nunaliit_import.profile = importProfile.getId();
		
		// Copy properties
		var propNames = [];
		for(var propName in importProperties){
			var propValue = importProperties[propName];
			doc.nunaliit_import.data[propName] = propValue;
			propNames.push(propName);
		};
		
		// Copy data to user's location
		importProfile.copyImportProperties(doc, propNames);
		
		// Cache copy of GeoJSON geometry
//		doc.geojson.nunaliit_geometry = importEntry.geometry;
		
		// Import geometry
//		if( importEntry.geometry ){
//			if( typeof OpenLayers !== 'undefined'
//			 && OpenLayers.Format
//			 && OpenLayers.Format.GeoJSON ) {
//				var format = new OpenLayers.Format.GeoJSON();
//				var geom = format.read(importEntry.geometry, 'Geometry');
//				if( geom ){
//					var wkt = geom.toString();
//					var bounds = geom.getBounds();
//					doc.nunaliit_geom = {
//						nunaliit_type:'geometry'
//						,bbox: [
//							bounds.left
//							,bounds.bottom
//							,bounds.right
//							,bounds.top
//						]
//						,wkt: wkt
//					};
//				};
//			} else {
//				abort( _loc('OpenLayers is not present. Can not import feature with geometry.') );
//				return;
//			};
//		};
		
		// Adjust document with created, last updated
		if( $n2.couchMap
		 && $n2.couchMap.adjustDocument ) {
			$n2.couchMap.adjustDocument(doc);
		};
		
		// Save
		var atlasDb = importProfile.getAtlasDb();
		atlasDb.createDocument({
			data: doc
			,onSuccess: function(docInfo){
				_this._log( _loc('Created document with id: {id}',{id:docInfo.id}) );
				_this._completed(change.changeId);
			}
			,onError: function(errorMsg){ 
				//reportError(errorMsg);
				alert( _loc('Unable to create document. Are you logged in?') );
			}
		});
	},
	
	_modifyDocument: function(change){
		var _this = this;
		
		var importId = change.importId;
		var importEntry = this.analysis.getImportEntry(importId);
		var importProperties = importEntry.getProperties();
		var doc = this.analysis.getDbDoc(importId);
		var importProfile = this.analysis.getImportProfile();
		var schema = importProfile.getSchema();

		if( !doc.nunaliit_import ){
			doc.nunaliit_import = {
				id: importId
				,profile: importProfile.getId()
			};
		};
		if( !doc.nunaliit_import.data ){
			doc.nunaliit_import.data = {};
		};
		
		// Schema name
		if( !doc.nunaliit_schema
		 && schema ) {
			doc.nunaliit_schema = schema.name;
		};
		
		// Copy only properties that have changed
		var propNames = [];
		for(var i=0,e=change.modifiedProperties.length; i<e; ++i){
			var propName = change.modifiedProperties[i];
			var propValue = importProperties[propName];
			doc.nunaliit_import.data[propName] = propValue;
			propNames.push(propName);
		};
		
		// Copy data to user's location
		importProfile.copyImportProperties(doc, propNames);
		
		// Import geometry (how to detect a changed geometry?)
//		if( change.modifiedGeometry ){
//			// Remember change in geometry
//			doc.geojson.nunaliit_geometry = importEntry.geometry;
//			
//			// Update geometry
//			if( typeof OpenLayers !== 'undefined'
//			 && OpenLayers.Format
//			 && OpenLayers.Format.GeoJSON ) {
//				var format = new OpenLayers.Format.GeoJSON();
//				var geom = format.read(importEntry.geometry, 'Geometry');
//				if( geom ){
//					var wkt = geom.toString();
//					var bounds = geom.getBounds();
//					doc.nunaliit_geom = {
//						nunaliit_type:'geometry'
//						,bbox: [
//							bounds.left
//							,bounds.bottom
//							,bounds.right
//							,bounds.top
//						]
//						,wkt: wkt
//					};
//				};
//			} else {
//				abort( _loc('OpenLayers is not present. Can not update feature with geometry.') );
//				return;
//			};
//		};
		
		// Adjust document with created, last updated
		if( $n2.couchMap
		 && $n2.couchMap.adjustDocument ) {
			$n2.couchMap.adjustDocument(doc);
		};
		
		// Save
		var atlasDb = importProfile.getAtlasDb();
		atlasDb.updateDocument({
			data: doc
			,onSuccess: function(docInfo){
				_this._log( _loc('Updated document with id: {id}',{id:docInfo.id}) );
				_this._completed(change.changeId);
			}
			,onError: function(errorMsg){ 
				// reportError(errorMsg);
				alert( _loc('Unable to update document. Are you logged in?') );
			}
		});
	},
	
	_deleteDocument: function(change){
		var _this = this;
		
		var importId = change.importId;
		var doc = this.analysis.getDbDoc(importId);
		var importProfile = this.analysis.getImportProfile();
		
		// Delete
		var atlasDb = importProfile.getAtlasDb();
		atlasDb.deleteDocument({
			data: doc
			,onSuccess: function(docInfo){
				_this._log( _loc('Deleted document with id: {id}',{id:docInfo.id}) );
				_this._completed(change.elemId);
			}
			,onError: function(errorMsg){ 
				// reportError(errorMsg);
				alert( _loc('Unable to delete document. Are you logged in?') );
			}
		});
	}
});

//=========================================================================
var ImportProfileOperation = $n2.Class({
	initialize: function(){
		
	},
	
	copyProperties: function(doc, importData, filterProperties){
		throw 'Subclasses of ImportProfileOperation must implement "copyProperties()"';
	},
	
	reportInconsistentProperties: function(doc, importData, propertiesArray){
		throw 'Subclasses of ImportProfileOperation must implement "reportInconsistentProperties()"';
	}
});

//=========================================================================
var OPERATION_COPY_ALL = /^\s*copyAll\((.*)\)\s*$/;

var ImportProfileOperationCopyAll = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	targetSelector: null,
	
	initialize: function(operationString){
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = operationString;
		
		var matcher = OPERATION_COPY_ALL.exec(operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationCopyAll: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
	},
	
	copyProperties: function(doc, importData, filterProperties){
		var targetObj = this.targetSelector.getValue(doc);
		if( typeof targetObj === 'undefined'){
			targetObj = {};
			this.targetSelector.setValue(doc, targetObj, true);
		};
		
		for(var key in importData){
			if( filterProperties.indexOf(key) >= 0 ){
				targetObj[key] = importData[key];
			};
		};
	},
	
	reportInconsistentProperties: function(doc, importData, propertiesArray){
		var targetObj = this.targetSelector.getValue(doc);
		for(var key in importData){
			var targetValue = undefined;
			if( targetObj ){
				targetValue = targetObj[key];
			};
			
			if( importData[key] !== targetValue ){
				var sourceValue = importData[key];
				var target = this.targetSelector.getSelectorString() + '.' + key;
				
				propertiesArray.push({
					source: key
					,sourceValue: sourceValue
					,target: target
					,targetValue: targetValue
				});
			};
		};
	}
});

addOperationPattern(OPERATION_COPY_ALL, ImportProfileOperationCopyAll);

//=========================================================================
var OPERATION_COPY_ALL_AND_FIX_NAMES = /^\s*copyAllAndFixNames\((.*)\)\s*$/;

var ImportProfileOperationCopyAllAndFixNames = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	targetSelector: null,
	
	initialize: function(operationString){
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = operationString;
		
		var matcher = OPERATION_COPY_ALL_AND_FIX_NAMES.exec(operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationCopyAllAndFixNames: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
	},
	
	copyProperties: function(doc, importData, filterProperties){
		var targetObj = this.targetSelector.getValue(doc);
		if( typeof targetObj === 'undefined'){
			targetObj = {};
			this.targetSelector.setValue(doc, targetObj, true);
		};
		
		for(var key in importData){
			if( filterProperties.indexOf(key) >= 0 ){
				var fixedKey = this._fixKey(key);
				targetObj[fixedKey] = importData[key];
			};
		};
	},
	
	reportInconsistentProperties: function(doc, importData, propertiesArray){
		var targetObj = this.targetSelector.getValue(doc);
		for(var key in importData){
			var fixedKey = this._fixKey(key);

			var targetValue = undefined;
			if( targetObj ){
				targetValue = targetObj[fixedKey];
			};
			
			if( importData[key] !== targetValue ){
				var sourceValue = importData[key];
				var target = this.targetSelector.getSelectorString() + '.' + fixedKey;
				
				propertiesArray.push({
					source: key
					,sourceValue: sourceValue
					,target: target
					,targetValue: targetValue
				});
			};
		};
	},
	
	_fixKey: function(key){
		var fixedKey = [];
		
		var lastCharWasUnderscore = false;
		for(var i=0,e=key.length; i<e; ++i){
			var c = key[i];
			
			if( c >= '0' && c <= '9' ){ 
				fixedKey.push(c);
				lastCharWasUnderscore = false;
				
			} else if( c >= 'a' && c <= 'z' ){ 
				fixedKey.push(c); 
				lastCharWasUnderscore = false;
				
			} else if( c >= 'A' && c <= 'Z' ){ 
				fixedKey.push(c); 
				lastCharWasUnderscore = false;

			} else if( !lastCharWasUnderscore ){ 
				fixedKey.push('_');
				lastCharWasUnderscore = true;
				
			} else {
				// do nothing
			};
		};
		
		return fixedKey.join('');
	}
});

addOperationPattern(OPERATION_COPY_ALL_AND_FIX_NAMES, ImportProfileOperationCopyAllAndFixNames);

//=========================================================================
var ImportEntry = $n2.Class({
	initialize: function(){
		
	},
	
	getId: function(){
		throw 'Subclasses to ImportEntry must implement getId()';
	},
	
	getProperties: function(){
		throw 'Subclasses to ImportEntry must implement getProperties()';
	}
});

//=========================================================================
var ImportProfile = $n2.Class({
	id: null,
	
	label: null,
	
	layerName: null,
	
	schema: null,
	
	operations: null,

	atlasDb: null,

	atlasDesign: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			id: null
			,label: null
			,layerName: null
			,schema: null
			,operations: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		this.id = opts.id;
		this.label = opts.label;
		this.layerName = opts.layerName;
		this.schema = opts.schema;
		this.operations = opts.operations;
		this.atlasDb = opts.atlasDb;
		this.atlasDesign = opts.atlasDesign;
	},
	
	getType: function(){
		throw 'getType() must be implemented by all subclasses of ImportProfile';
	},
	
	parseEntries: function(opts){
		throw 'parseEntries() must be implemented by all subclasses of ImportProfile';
	},
	
	getId: function(){
		return this.id;
	},
	
	getLabel: function(){
		return this.label;
	},
	
	getLayerName: function(){
		return this.layerName;
	},
	
	getSchema: function(){
		return this.schema;
	},
	
	getAtlasDb: function(){
		return this.atlasDb;
	},
	
	performUpgradeAnalysis: function(opts_){
		var opts = $n2.extend({
			entries: null
			,onSuccess: function(analysis){}
			,onError: function(err){}
		},opts_);
		
		var analyzer = new UpgradeAnalyzer({
			profile: this
			,atlasDesign: this.atlasDesign
		});
		analyzer.analyzeEntries({
			entries: opts.entries
			,onSuccess: opts.onSuccess
			,onError: opts.onError
		});
	},
	
	getInconsistentProperties: function(doc){
		var properties = [];
		
		var importData = doc.nunaliit_import.data;
		
		for(var i=0,e=this.operations.length; i<e; ++i){
			var op = this.operations[i];
			op.reportInconsistentProperties(doc, importData, properties);
		};
		
		return properties;
	},
	
	copyImportProperties: function(doc, filterProperties){
		var importData = doc.nunaliit_import.data;
		
		for(var i=0,e=this.operations.length; i<e; ++i){
			var op = this.operations[i];
			op.copyProperties(doc, importData, filterProperties);
		};
	}
});

//=========================================================================
var ImportEntryJson = $n2.Class(ImportEntry, {
	
	data: null,
	
	profile: null,
	
	initialize: function(opts_){
		
		ImportEntry.prototype.initialize.call(this,opts_);
		
		var opts = $n2.extend({
			data: null
			,profile: null
		},opts_);
		
		this.data = opts.data;
		this.profile = opts.profile;
	},
	
	getId: function(){
		var idAttribute = this.profile.idAttribute;
		return this.data[idAttribute];
	},
	
	getProperties: function(){
		return this.data;
	}
});

//=========================================================================
var ImportProfileJson = $n2.Class(ImportProfile, {
	
	idAttribute: null,
	
	initialize: function(opts_){
		
		ImportProfile.prototype.initialize.call(this, opts_);

		if( opts_ ){
			if( opts_.options ){
				this.idAttribute = opts_.options.idAttribute;
			};
		};
		
		if( !this.idAttribute ){
			throw 'Option "idAttribute" must be specified for ImportProfileJson';
		};
	},
	
	getType: function(){
		return 'json';
	},
	
	parseEntries: function(opts_){
		var opts = $n2.extend({
			importData: null
			,onSuccess: function(entries){}
			,onError: function(err){}
		},opts_);

		var importData = opts.importData;
		if( !importData ){
			opts.onError( _loc('Import data must be provided') );
			return;
		};
		
		// Parse JSON input
		var jsonObj = null;
		try {
			jsonObj = JSON.parse(importData);
		} catch(e) {
			opts.onError( _loc('Unable to parse import data: {err}',{err:e}) );
			return;
		};
		
		
		if( !$n2.isArray(jsonObj) ){
			opts.onError( _loc('JSON definition must be an array') );
			return;
		}
		
		var entries = [];
		for(var i=0,e=jsonObj.length; i<e; ++i){
			var jsonEntry = jsonObj[i];
			
			var props = {};
			for(var key in jsonEntry){
				if( !key ){
					// skip
				} else if( $n2.trim(key) === '' ) {
					// skip
				} else {
					props[key] = jsonEntry[key];
				};
			};
			
			var entry = new ImportEntryJson({
				data: props
				,profile: this
			});
			entries.push(entry);
		};
		
		opts.onSuccess(entries);
	}
});

//=========================================================================
var ImportProfileService = $n2.Class({
	
	schemaRepository: null,

	atlasDb: null,

	atlasDesign: null,
	
	profileClasses: null,
	
	initialize: function(opts_){
		var opts= $n2.extend({
			atlasDb: null
			,atlasDesign: null
			,schemaRepository: null
		},opts_);
		
		this.atlasDb = opts.atlasDb;
		this.atlasDesign = opts.atlasDesign;
		this.schemaRepository = opts.schemaRepository;
		
		this.profileClasses = {};
		
		this.addImportProfileClass('json',ImportProfileJson);
	},
	
	addImportProfileClass: function(type, aClass){
		this.profileClasses[type] = aClass;
	},
	
	loadImportProfiles: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(profiles){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		this.atlasDesign.queryView({
			viewName: 'nunaliit-import-profile'
			,include_docs: true
			,onSuccess: function(rows){
				var profiles = [];
				var waiting = rows.length + 1;
				for(var i=0,e=rows.length; i<e; ++i){
					var doc = rows[i].doc;
					if( doc ){
						_this._parseImportProfile({
							doc: doc
							,onSuccess: function(profile){
								profiles.push(profile);
								check();
							}
							,onError: function(err){
								$n2.log('Unable to load profile: '+err);
								check();
							}
						});
					} else {
						--waiting;
					};
				};
				check();
				
				function check(){
					--waiting;
					if( waiting <= 0 ){
						opts.onSuccess(profiles);
					};
				};
			}
			,onError: function(err){
				opts.onError( _loc('Unable to load import profiles: {err}',{err:err}) );
			}
		});
	},
	
	_parseImportProfile: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importProfile: null
			,onSuccess: function(profile){}
			,onError: function(err){}
		},opts_);
		
		var importProfile = opts.importProfile;
		if( !importProfile && opts.doc ){
			if( opts.doc.nunaliit_import_profile ){
				importProfile = opts.doc.nunaliit_import_profile;
			};
		};
		if( !importProfile ){
			opts.onError('Import profile must be provided');
			return;
		};
		
		var profileClass = null;
		
		if( !importProfile.type ){
			opts.onError('Import profile must contain a type');
		} else {
			var type = importProfile.type;
			profileClass = this.profileClasses[type];
			if( !profileClass ){
				opts.onError( _loc('Unknown import profile type: {type}',{type:type}) );
				return;
			} else {
				var classOpts = {
					id: importProfile.id
					,label: importProfile.label
					,options: importProfile.options
					,layerName: importProfile.layerName
					,atlasDb: this.atlasDb
					,atlasDesign: this.atlasDesign
				};
				
				if( importProfile.schemaName ){
					this.schemaRepository.getSchema({
						name:importProfile.schemaName
						,onSuccess: function(schema){
							classOpts.schema = schema;
							parseOperations(classOpts);
						}
						,onError: function(err){
							opts.onError( _loc('Unknown schema: {name}',{name:importProfile.schemaName}) );
						}
					});
				} else {
					parseOperations(classOpts);
				};
			};
		};
		
		function parseOperations(classOpts){
			var operations = [];
			classOpts.operations = operations;
			
			if( importProfile.operations ){
				for(var i=0,e=importProfile.operations.length; i<e; ++i){
					var opString = importProfile.operations[i];
					var op = createOperationFromString(opString);
					if( !op ){
						opts.onError( _loc('Error creating import profile. Unknown operation string: {string}',{string:opString}) );
						return;
					};
					operations.push(op);
				};
			};
			
			done(classOpts);
		};
		
		function done(classOpts){
			try {
				var profile = new profileClass(classOpts);
				opts.onSuccess(profile);
			} catch(err) {
				opts.onError( _loc('Error creating import profile: {err}',{err:err}) );
			};
		};
	}
});

// =========================================================================

$n2.couchImportProfile = {
	ImportProfileService: ImportProfileService
	,AnalysisReport: AnalysisReport
};	
	
})(jQuery,nunaliit2);
