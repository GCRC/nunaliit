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

/*

The concept of using profiles to import data is designed to help importing a set
of data to create an initial set of documents that can be updated later wen re-importing
a newer version of the external data.

In this design, "external data" refers to a set of data obtained by a party wishing to
import information to a Nunaliit atlas. The external data can be a spreadsheet, a JSON file,
a GeoJSON file, etc.

An import profile is used to keep track of a data set that is imported. An import profile is
a document with a structure that follows:

{
	"nunaliit_import_profile": {
	   "id": "demo",
	   "nunaliit_type": "import_profile",
	   "label": {
	       "nunaliit_type": "localized",
	       "en": "Demo"
	   },
	   "type": "json",
	   "options": {
	       "idAttribute": "id"
	   },
	   "operations": [
	       "copyAllAndFixNames(demo_doc)"
	   ],
	   "layerName": "public",
	   "schemaName": "demo_doc"
	}
}

The main responsibility of an import profile is to indicate how an external data set is
broken into entries with unique identifiers. For each entry generated from the external
data, a document is created with the following structure:

{
	"nunaliit_import": {
		"id": "123"
		,"profile": "demo"
		,"data": {
			"id": "123"
			,"a": "abc"
			,"b": "def"
		}
	}
	,"demo_doc": {
		"id": "123"
		,"a": "abc"
		,"b": "def"
	}
	,"nunaliit_layers": [
		"public"
	]
	,"nunaliit_schema": "demo_doc"
}

 */


;(function($,$n2) {
"use strict";

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

function createOperation(opts_){
	var opts = $n2.extend({
		operationString: null
		,atlasDb: null
		,atlasDesign: null
	},opts_);
	
	for(var i=0,e=operationPatterns.length; i<e; ++i){
		var opPattern = operationPatterns[i];
		var matches = opPattern.pattern.test(opts.operationString);
		if( matches ){
			var op = new opPattern.supportingClass(opts);
			return op;
		};
	};
	
	// At this point, we are looking for an operation which is supported by the
	// JISON parser
	try {
		var program = $n2.importProfileOperation.parse(opts.operationString);
		var op = new ImportProfileOperationParsed({
			operationString: opts.operationString
			,program: program
			,atlasDb: opts.atlasDb
			,atlasDesign: opts.atlasDesign
		});
		
		$n2.log('ImportProfileOperationParsed',op);
		
		return op;

	} catch(err) {
		$n2.logError("Error while parsing operation string: "+opts.operationString, err);
	};
	
	return null;
};

//=========================================================================
// An instance of this class is used to report all changes that would occur
// if an import was performed. This allows a user to peruse changes before
// applying them to the database.
var ImportAnalysis = $n2.Class({
	
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
			importId: undefined
			,importEntry: undefined
		},opts_);

		// If no import id, associate one so that we can refer to it
		var importId = opts.importId;
		if( !importId ){
			importId = $n2.getUniqueId();
		};
		this.entriesByImportId[importId] = opts.importEntry;
		
		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'addition'
			,isAddition: true
			,auto: true
			,importId: importId
		};
		++this.additionCount;
		this.changesById[changeId] = change;
		return change;
	},
	
	addModification: function(opts_){
		var opts = $n2.extend({
			// String that uniquely identifies an import record
			importId: null,
			
			// Entry that is being imported
			importEntry: null,

			// array of objects with the following structure:
			// {
			//    property: <name of the import property>
			//    ,lastImportValue: <value during last import>
			//    ,externalValue: <value from this import>
			//    ,collisions: []
			// }
			// The collisions array contains collisions pertinent to
			// this property. It is an array of objects with the following
			// structure:
			// {
			//    source: <name of the import property>
			//    ,sourceValue: <value during last import>
			//    ,target: <string that represent the selector for where the data should go>
			//    ,targetValue: <value currently found by selector>
			// }
			modifiedProperties: null, 
			
			// Boolean. Set if the geometry was modified
			modifiedGeometry: null,

			// Boolean. Set if the geometry was modified and a collision 
			// is detected
			collisionGeometry: null,
			
			// Document from database which is associated with importId
			dbDoc: null,
			
			// Some modification are automatic. Modifications that
			// have a collision should not be performed automatically
			auto: false
		},opts_);
		
		this.entriesByImportId[opts.importId] = opts.importEntry;
		this.dbDocsByImportId[opts.importId] = opts.dbDoc;

		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'modification'
			,isModification: true
			,auto: opts.auto
			,importId: opts.importId
			,modifiedProperties: opts.modifiedProperties
			,modifiedGeometry: opts.modifiedGeometry
			,collisionGeometry: opts.collisionGeometry
		};
		++this.modificationCount;
		this.changesById[changeId] = change;
		return change;
	},
	
	addDeletion: function(opts_){
		var opts = $n2.extend({
			importId: null
			,dbDoc: null
		},opts_);

		this.dbDocsByImportId[opts.importId] = opts.dbDoc;
		
		var changeId = $n2.getUniqueId();
		var change = {
			changeId: changeId
			,type: 'deletion'
			,isDeletion: true
			,auto: false
			,importId: opts.importId
		};
		++this.deletionCount;
		this.changesById[changeId] = change;
		return change;
	}
});

//=========================================================================
// Instances of this class are used to create an analysis about an import.
var ImportAnalyzer = $n2.Class({
	
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
		var analysis = new ImportAnalysis({
			profile: this.profile
		});
		var dbDocsByImportId = {};
		var entriesLeft = [];

		// Verify import entries and store them in a dictionary
		// for easy access by import id
		var importEntriesById = {};
		var collidingIdMap = {};
		var noIdCount = 0;
		if( opts.entries ){
			for(var i=0,e=opts.entries.length; i<e; ++i){
				var entry = opts.entries[i];
				var id = entry.getId();
				
				if( typeof id === 'undefined' || null === id){
					noIdCount++;
					entriesLeft.push( entry );

				} else if( importEntriesById[id] ){
					if( !collidingIdMap[id] ){
						collidingIdMap[id] = 2;
					} else {
						collidingIdMap[id] = collidingIdMap[id] + 1;
					};

				} else {
					importEntriesById[id] = entry;
					entriesLeft.push( entry );
				};
			};
			
			if( noIdCount > 0 ){
				if( this.profile.ignoreId ){
					// Ok
				} else {
					opts.onError( _loc('Number of imported entries without an id attribute: {count}',{count:noIdCount}) );
					return;
				};
			};
			
			var collidingIds = [];
			for(var collidingId in collidingIdMap){
				collidingIds.push(collidingId);
			};
			if( collidingIds.length > 0 ){
				opts.onError( _loc('Colliding id attributes: {ids}',{
					ids: collidingIds.join(',')
				}) );
				return;
			};
		};
		
		// Load documents previously imported using the same profile
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
					 && typeof doc.nunaliit_import.id !== 'undefined'
					 && null !== doc.nunaliit_import.id ) {
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
			// Discover deletions
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
			
			processEntries();
		};
			
		function processEntries(){
			if( entriesLeft.length < 1 ){
				opts.onSuccess(analysis);
				return;
			};
			
			var entry = entriesLeft.shift();
			var id = entry.getId();

			if( dbDocsByImportId[id] ){
				// Already exists in database
				// Check if modified
				_this._compare({
					importEntry: entry
					,doc: dbDocsByImportId[id]
					,onSuccess: function(c){
						if( c ){
							analysis.addModification({
								importId: c.importId
								,auto: c.auto
								,modifiedProperties: c.modifiedProperties
								,modifiedGeometry: c.modifiedGeometry
								,collisionGeometry: c.collisionGeometry
								,dbDoc: dbDocsByImportId[id]
								,importEntry: entry
							});
						};
						
						// Next entry
						window.setTimeout(processEntries,0); // Do not blow stack on large files
						//processEntries(); 
					}
				});
				
			} else {
				// New to database
				analysis.addAddition({
					importId: id
					,importEntry: entry
				});
				
				// Next entry
				window.setTimeout(processEntries,0); // Do not blow stack on large files
				//processEntries();
			};
		};
	},
	
	_compare: function(opts_){
		var opts = $n2.extend({
			importEntry: null
			,doc: null
			,onSuccess: function(change){}
		},opts_);
		
		var importEntry = opts.importEntry;
		var props = importEntry.getProperties();
		var dbImportObj = opts.doc.nunaliit_import;
		var dbData = dbImportObj.data;
		var importId = opts.doc.nunaliit_import.id;
		
		var change = null;
		
		// Create a map of all property names
		var allPropNamesMap = {};
		for(var propName in props){
			allPropNamesMap[propName] = true;
		};
		for(var propName in dbData){
			allPropNamesMap[propName] = true;
		};
		
		// Geometry
		var isGeometryModified = false;
		var externalGeom = importEntry.getGeometry();
		if( externalGeom ){
			if( dbImportObj.geometry ){
				if( externalGeom !== dbImportObj.geometry.wkt ){
					// Geometry modified
					isGeometryModified = true;
				};
			} else {
				// Geometry added
				isGeometryModified = true;
			};
		} else if( dbImportObj.geometry 
		 && dbImportObj.geometry.wkt ){
			// Deleted
			isGeometryModified = true;
		};
		if( isGeometryModified ){
			change = {
				importId:importId
				,auto: true
				,modifiedProperties: []
				,modifiedGeometry: true
				,collisionGeometry: false
			};
			
			// Check if geometry was modified since last import
			var lastImportGeometry = undefined;
			var currentGeometry = undefined;
			if( dbImportObj.geometry ){
				lastImportGeometry = dbImportObj.geometry.wkt;
			};
			if( opts.doc.nunaliit_geom ){
				currentGeometry = opts.doc.nunaliit_geom.wkt;
			};
			
			if( lastImportGeometry !== currentGeometry ){
				// Collision on geometry only if not equal to
				// new external value
				if( currentGeometry !== externalGeom ){
					change.collisionGeometry = true;
					change.auto = false;
				};
			};
		};
		
		// Look at values that have changed since the last import
		var modificationsByPropName = {};
		var allPropertyNames = [];
		for(var propName in allPropNamesMap){
			var lastImportValue = dbData[propName];
			var externalValue = props[propName];
			
			allPropertyNames.push(propName);
			
			if( externalValue !== lastImportValue ){
				if( !change ) change = {
					importId:importId
					,auto: true
					,modifiedProperties: []
					,modifiedGeometry: false
					,collisionGeometry: false
				};

				var mod = {
					property: propName
					,lastImportValue: lastImportValue
					,externalValue: externalValue
					,collisions: []
					,copyOperations: []
				};
				
				modificationsByPropName[propName] = mod;
				
				change.modifiedProperties.push(mod);
			};
		};
		
		// Get all copy operations that are to be executed on import
		this.profile.reportCopyOperations({
			doc: opts.doc
			,allPropertyNames: allPropertyNames
			,onSuccess: function(copyOperations){
				// Sort the copy operations with the appropriate property modification
				for(var copyIndex=0,copyIndexEnd=copyOperations.length; copyIndex<copyIndexEnd; ++copyIndex){
					var copyOperation = copyOperations[copyIndex];
					
					var propertyNames = copyOperation.propertyNames;
					if( propertyNames ){
						for(var propIndex=0,propIndexEnd=propertyNames.length; propIndex<propIndexEnd; ++propIndex){
							var propName = propertyNames[propIndex];
							
							var mod = modificationsByPropName[propName];
							if( mod ){
								if( copyOperation.isInconsistent ){
									// It is a collision only if target value is not the same as
									// the external data. If the external data and the modified
									// data agree, then this is not a collision
									if( mod.externalValue !== copyOperation.targetValue ){
										// This is a collision
										mod.collisions.push(copyOperation);
										
										// Can not perform this change automatically
										change.auto = false;
										
									} else {
										mod.copyOperations.push(copyOperation);
									};
									
								} else {
									mod.copyOperations.push(copyOperation);
								};
							};
						};
					};
				};
				
				opts.onSuccess(change);
			}
		});
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
		var radioButtonClickFn = function(){
			var $btn = $(this);
			_this._radioButtonClicked($btn);
			return true;
		};
		
		var analysis = this.analysis;
		var changes = analysis.getChanges();
		
		if( changes.length < 1 ){
			$changes.text( _loc('No changes detected in the import data') );
			return;
		};
		
		if(analysis.getDbDocs().length < 1){
			var proceedDivId = $n2.getUniqueId();
			var $div = $('<div>')
				.attr('id',proceedDivId)
				.addClass('prompt')
				.appendTo($changes);
			$div.text( _loc('This appears to be the first time that you are importing this profile. Accept all?') );
			$('<button>')
				.text( _loc('Proceed') )
				.appendTo($div)
				.click(function(){
					_this._proceedAll({
						onSuccess: function(){ $('#'+proceedDivId).remove(); }
					});
				});
			$('<button>')
				.text( _loc('Discard') )
				.appendTo($div)
				.click(function(){
					var $button = $(this);
					var $promptElem = $button.parents('.prompt');
					$promptElem.remove();
				});
			
		} else {
			var autoChanges = [];
			for(var changeIndex=0;changeIndex<changes.length;++changeIndex){
				var change = changes[changeIndex];
				if( change.auto ){
					autoChanges.push(change);
				};
			};
			if( autoChanges.length > 0 ){
				var autoDivId = $n2.getUniqueId();
				var $div = $('<div>')
					.attr('id',autoDivId)
					.addClass('prompt')
					.appendTo($changes);
				$div.text( _loc('It appears that {count} changes can be completed automatically. Accept automatic changes?',{
					count: autoChanges.length
				}));
				$('<button>')
					.text( _loc('Proceed') )
					.appendTo($div)
					.click(function(){
						_this._proceedAutomatics({
							onSuccess: function(){ $('#'+autoDivId).remove(); }
						});
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
				
				if( change.auto ){
					$div.addClass('autoOperation');
				};
				
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

				var explanation = _loc('Create new document');
				if( change.auto ){
					explanation += ' ' +_loc('AUTO');
				};
				$('<div>')
					.addClass('explanation')
					.text( explanation )
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
						var propValueStr = this._printValue(propValue);
						var $prop = $('<div>')
							.addClass('property')
							.appendTo($properties);
						$('<div>')
							.addClass('propertyName')
							.text(propName)
							.appendTo($prop);
						$('<div>')
							.addClass('newValue')
							.text(propValueStr)
							.appendTo($prop);
					};
				};
				
				// Geometry
				var externalGeom = importEntry.getGeometry();
				if( externalGeom ){
					var $prop = $('<div>')
						.addClass('property')
						.appendTo($properties);
					$('<div>')
						.addClass('propertyName')
						.text( _loc('Geometry') )
						.appendTo($prop);
					$('<div>')
						.addClass('newValue')
						.text( this._printValue(externalGeom) )
						.appendTo($prop);
				};
			};
		};
		
		// Report modifications
		for(var i=0,e=changes.length; i<e; ++i){
			var change = changes[i];
			if( change.isModification ) {
				var importId = change.importId;
				var doc = analysis.getDbDoc(importId);
				var importEntry = analysis.getImportEntry(importId);

				// Go through all the properties that need to be modified
				var sortedPropNames = [];
				var modificationsByPropNames = {};
				var collisionDetected = false;
				for(var j=0,k=change.modifiedProperties.length; j<k; ++j){
					var mod = change.modifiedProperties[j];
					var propName = mod.property;
					sortedPropNames.push(propName);
					modificationsByPropNames[propName] = mod;
					if( mod.collisions && mod.collisions.length > 0 ){
						collisionDetected = true;
					};
				};
				if( change.modifiedGeometry && change.collisionGeometry ){
					collisionDetected = true;
				};
				sortedPropNames.sort();
				
				var $div = $('<div>')
					.attr('id',change.changeId)
					.addClass('modify operation')
					.appendTo($changes);
				if( collisionDetected ){
					$div.addClass('collision');
				};
				if( change.auto ){
					$div.addClass('autoOperation');
				};
				
				
				$('<button>')
					.addClass('discard')
					.text( _loc('Discard') )
					.appendTo($div)
					.click(discardClickFn);
				
				var $proceedButton = $('<button>')
					.attr('id',change.changeId + '_proceed')
					.addClass('proceed')
					.text( _loc('Modify Document') )
					.appendTo($div)
					.click(proceedClickFn);
				if( collisionDetected ) {
					$proceedButton.attr('disabled','disabled');
				};
				
				var explanation = _loc('Modify existing document');
				if( change.auto ){
					explanation += ' ' +_loc('AUTO');
				};
				if( change.collisions && change.collisions.length > 0 ){
					explanation += ' ' + _loc('COLLISION');
				};
				$('<div>')
					.addClass('explanation')
					.text( explanation )
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
				
				for(var propNameIndex=0,propNameEnd=sortedPropNames.length; propNameIndex<propNameEnd; ++propNameIndex){
					var propName = sortedPropNames[propNameIndex];
					var mod = modificationsByPropNames[propName];

					var $prop = $('<div>')
						.addClass('property')
						.appendTo($properties);
					$('<div>')
						.addClass('propertyName')
						.text(propName)
						.appendTo($prop);
					$('<div>')
						.addClass('previousValue')
						.text( this._printValue(mod.lastImportValue) )
						.appendTo($prop);
					$('<div>')
						.addClass('newValue')
						.text( this._printValue(mod.externalValue) )
						.appendTo($prop);
					
					// Report collisions
					if( mod.collisions && mod.collisions.length > 0 ){
						for(var colIndex=0,colEnd=mod.collisions.length; colIndex<colEnd; ++colIndex){
							// collision is a copyOperation
							var collision = mod.collisions[colIndex];
							
							var $prop = $('<div>')
								.addClass('property')
								.appendTo($properties);
							$('<div>')
								.addClass('propertyName')
								.text( _loc('Collision on property {property}',{
									property:propName
								}) )
								.appendTo($prop);
							$('<div>')
								.addClass('targetSelector')
								.text(collision.targetSelector.getSelectorString())
								.appendTo($prop);
							var targetValue = collision.targetValue;
							$('<div>')
								.addClass('targetValue')
								.text( this._printValue(targetValue) )
								.appendTo($prop);
							
							var $collision = $('<div>')
								.addClass('collision')
								.appendTo($properties);
							
							var collisionName = propName + '_' + colIndex;
							
							var externalId = $n2.getUniqueId();
							var $externalValueDiv = $('<div>')
								.appendTo($collision);
							$('<input>')
								.attr('type','radio')
								.attr('id',externalId)
								.attr('name',collisionName)
								.attr('value','external')
								.click(radioButtonClickFn)
								.appendTo($externalValueDiv);
							$('<label>')
								.attr('for',externalId)
								.text( this._printValue(mod.externalValue) )
								.appendTo($externalValueDiv);
							
							var currentId = $n2.getUniqueId();
							var $currentValueDiv = $('<div>')
								.appendTo($collision);
							$('<input>')
								.attr('type','radio')
								.attr('id',currentId)
								.attr('name',collisionName)
								.attr('value','current')
								.click(radioButtonClickFn)
								.appendTo($currentValueDiv);
							$('<label>')
								.attr('for',currentId)
								.text( this._printValue(targetValue) )
								.appendTo($currentValueDiv);
						};
					};
				};

				if( change.modifiedGeometry ){
					var lastImportGeometry = undefined;
					var externalGeometry = importEntry.getGeometry();
					if( doc.nunaliit_import 
					 && doc.nunaliit_import.geometry ){
						lastImportGeometry = doc.nunaliit_import.geometry.wkt;
					};
					
					var $prop = $('<div>')
						.addClass('property')
						.appendTo($properties);
					$('<div>')
						.addClass('propertyName')
						.text( _loc('Geometry') )
						.appendTo($prop);
					$('<div>')
						.addClass('previousValue')
						.text( this._printValue(lastImportGeometry) )
						.appendTo($prop);
					$('<div>')
						.addClass('newValue')
						.text( this._printValue(externalGeometry) )
						.appendTo($prop);

					if( change.collisionGeometry ){
						var $prop = $('<div>')
							.addClass('property')
							.appendTo($properties);
						$('<div>')
							.addClass('propertyName')
							.text( _loc('Collision on Geometry') )
							.appendTo($prop);
						$('<div>')
							.addClass('targetSelector')
							.text('nunaliit_geom.wkt')
							.appendTo($prop);
						var targetValue = undefined;
						if( doc.nunaliit_geom ){
							targetValue = doc.nunaliit_geom.wkt;
						};
						$('<div>')
							.addClass('targetValue')
							.text( this._printValue(targetValue) )
							.appendTo($prop);

						// Select value to resolve collision
						var $collision = $('<div>')
							.addClass('collision')
							.appendTo($properties);
						
						var collisionName = '__geometry__';
						
						var externalId = $n2.getUniqueId();
						var $externalValueDiv = $('<div>')
							.appendTo($collision);
						$('<input>')
							.attr('type','radio')
							.attr('id',externalId)
							.attr('name',collisionName)
							.attr('value','external')
							.click(radioButtonClickFn)
							.appendTo($externalValueDiv);
						$('<label>')
							.attr('for',externalId)
							.text( this._printValue(externalGeometry) )
							.appendTo($externalValueDiv);
						
						var currentId = $n2.getUniqueId();
						var $currentValueDiv = $('<div>')
							.appendTo($collision);
						$('<input>')
							.attr('type','radio')
							.attr('id',currentId)
							.attr('name',collisionName)
							.attr('value','current')
							.click(radioButtonClickFn)
							.appendTo($currentValueDiv);
						$('<label>')
							.attr('for',currentId)
							.text( this._printValue(targetValue) )
							.appendTo($currentValueDiv);
					};
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
				if( change.auto ){
					$div.addClass('autoOperation');
				};
				
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

				var explanation = _loc('Delete existing document');
				if( change.auto ){
					explanation += ' ' +_loc('AUTO');
				};
				$('<div>')
					.addClass('explanation')
					.text( explanation )
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
	
	_printValue: function(value){
		if( value === null ){
			return 'null';
			
		} else if( typeof value === 'undefined' ){
			return 'undefined';

		} else if( typeof value === 'string' ){
			return '"'+value+'"';

		} else if( typeof value === 'number' ){
			return ''+value;

		} else if( typeof value === 'boolean' ){
			return ''+value;
		};
		
		return '<?>';
	},
	
	_proceed: function($button){
		var $opsElem = $button.parents('.operation');
		this._proceedWithOperationElement({
			elem: $opsElem
		});
	},

	_proceedAll: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		this._proceedElementsWithSelector({
			selector: '.operation'
			,onSuccess: opts.onSuccess
			,onError: opts.onError
		});
	},

	_proceedAutomatics: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		this._proceedElementsWithSelector({
			selector: '.autoOperation'
			,onSuccess: opts.onSuccess
			,onError: opts.onError
		});
	},

	_proceedElementsWithSelector: function(opts_){
		var opts = $n2.extend({
			selector: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);

		var _this = this;

		// Open dialog
		var dialogId = $n2.getUniqueId();
		var $diag = $('<div>')
			.attr('id',dialogId);
		$('<span>')
			.addClass('n2ImportProfile_progressDialog_text')
			.appendTo($diag);
		$diag.dialog({
			autoOpen: true
			,title: _loc('Proceed with Import Operations')
			,modal: true
			,width: 'auto'
			,close: function(event, ui){
				var $diag = $('#'+dialogId);
				$diag.remove();
			}
		});
		
		// Remember count
		var count = undefined;

		processNext();
		
		function processNext(){
			var $elem = _this._getElem();
			var $changes = $elem.find('.changes');
			var $ops = $changes.find(opts.selector);
			
			if( typeof count === 'undefined' ){
				count = $ops.length;
			};
			
			if( $ops.length > 0 ){
				var index = count - $ops.length + 1;
				$('#'+dialogId).find('.n2ImportProfile_progressDialog_text')
					.text( _loc('Operation {index} of {count}',{
						index: index
						,count: count
					}) );
				
				_this._proceedWithOperationElement({
					elem: $ops.first()
					,onSuccess: processNext
					,onError: opts.onError
				});
			} else {
				// Done
				$('#'+dialogId).dialog('close');
				opts.onSuccess();
			};
		};
	},
	
	_proceedWithOperationElement: function(opts_){
		var opts = $n2.extend({
			elem: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var $opsElem = opts.elem;
		
		var changeId = $opsElem.attr('id');
		var change = this.analysis.getChange(changeId);
		if( change.isAddition ){
			// Create doc
			this._createDocument({
				change:change
				,onSuccess: opts.onSuccess
				,onError: opts.onError
			});
			
		} else if( change.isModification ){
			// Modify document
			this._modifyDocument({
				change:change
				,onSuccess: opts.onSuccess
				,onError: opts.onError
			});
			
		} else if( change.isDeletion ){
			// Delete database document
			this._deleteDocument({
				change:change
				,onSuccess:opts.onSuccess
				,onError: opts.onError
			});
			
		} else {
			alert( _loc('Operation not recognized') );
			opts.onError('Operation not recognized');
		};
	},

	_discard: function($button){
		var $opsElem = $button.parents('.operation');
		var elemId = $opsElem.attr('id');
		this._completed(elemId);
	},
	
	_radioButtonClicked: function(){
		var analysis = this.analysis;
		var changes = analysis.getChanges();
		
		for(var i=0,e=changes.length; i<e; ++i){
			var change = changes[i];
			var changeId = change.changeId;

			if( change.isModification ) {
				var allCollisionsResolved = true;
				
				for(var j=0,k=change.modifiedProperties.length; j<k; ++j){
					var mod = change.modifiedProperties[j];
					var propName = mod.property;
					if( mod.collisions && mod.collisions.length > 0 ){
						for(var colIndex=0,colEnd=mod.collisions.length; colIndex<colEnd; ++colIndex){
							var collision = mod.collisions[colIndex];
							var collisionName = propName + '_' + colIndex;
							var value = $('input[name="'+collisionName+'"]:checked').val();
							collision.selectedValue = value;
							if( typeof value !== 'string' ){
								allCollisionsResolved = false;
							};
						};
					};
				};
				
				if( change.modifiedGeometry && change.collisionGeometry ){
					var collisionName = '__geometry__';
					var value = $('input[name="'+collisionName+'"]:checked').val();
					change.selectedGeometry = value;
					if( typeof value !== 'string' ){
						allCollisionsResolved = false;
					};
				};
				
				var proceedBtnId = changeId + '_proceed';
				if( allCollisionsResolved ) {
					$('#'+proceedBtnId).removeAttr('disabled');

				} else {
					$('#'+proceedBtnId).attr('disabled','disabled');
				};
			};
		};
	},

	_completed: function(elemId){
		this.analysis.removeChange(elemId);
		$('#'+elemId).remove();
	},
	
	_createDocument: function(opts_){
		var opts = $n2.extend({
			change: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var change = opts.change;
		
		var changeId = change.importId;
		var importEntry = this.analysis.getImportEntry(changeId);
		var importProperties = importEntry.getProperties();
		var importProfile = this.analysis.getImportProfile();
		var schema = importProfile.getSchema();
		var layerName = importProfile.getLayerName();
		
		var doc = null;
		if( schema ){
			doc = schema.createObject();
			
			// Remove attachment instructions
			if( doc.nunaliit_attachments ){
				delete doc.nunaliit_attachments;
			};

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
		doc.nunaliit_import.id = importEntry.getId();
		doc.nunaliit_import.profile = importProfile.getId();
		
		// Geometry
		var geom = importEntry.getGeometry();
		if( geom ){
			doc.nunaliit_import.geometry = {
				wkt: geom
			};
			doc.nunaliit_geom = {
				nunaliit_type: 'geometry'
			};
			doc.nunaliit_geom.wkt = geom;

			var olWkt = new OpenLayers.Format.WKT();
			var vectorFeature = olWkt.read(geom);
			var bounds = vectorFeature.geometry.getBounds();
			doc.nunaliit_geom.bbox = [ 
				bounds.left
				,bounds.bottom
				,bounds.right
				,bounds.top
			];
		};
		
		// Copy properties
		var propNames = [];
		for(var propName in importProperties){
			var propValue = importProperties[propName];
			doc.nunaliit_import.data[propName] = propValue;
			propNames.push(propName);
		};
		
		// Copy data to user's location
		importProfile.reportCopyOperations({
			doc: doc
			,allPropertyNames: propNames
			,onSuccess: onCopyOperations
		});
		
		function onCopyOperations(copyOperations){
			importProfile.performCopyOperations(doc, copyOperations);
			
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
					opts.onSuccess();
				}
				,onError: function(errorMsg){ 
					//reportError(errorMsg);
					alert( _loc('Unable to create document. Are you logged in?') );
					opts.onError(errorMsg);
				}
			});
		};
	},
	
	_modifyDocument: function(opts_){
		var opts = $n2.extend({
			change: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;
		
		var change = opts.change;
		
		var importId = change.importId;
		var doc = this.analysis.getDbDoc(importId);
		var importEntry = this.analysis.getImportEntry(importId);
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
		
		// Geometry (change only if it was modified)
		if( change.modifiedGeometry ){
			var externalGeom = importEntry.getGeometry();
			var changeCurrentGeometry = true;
			if( change.collisionGeometry ){
				if( 'external' == change.selectedGeometry ) {
					// OK
				} else if( 'current' == change.selectedGeometry ) {
					changeCurrentGeometry = false;
				} else {
					throw 'Invalid state for change since geometry collision is not resolved';
				};
			};
			if( externalGeom ){
				if( !doc.nunaliit_import.geometry ){
					doc.nunaliit_import.geometry = {};
				};
				doc.nunaliit_import.geometry.wkt = externalGeom;
				
				if( changeCurrentGeometry ){
					if( !doc.nunaliit_geom ){
						doc.nunaliit_geom = {};
					};
					doc.nunaliit_geom.nunaliit_type = 'geometry';
					doc.nunaliit_geom.wkt = externalGeom;

					var olWkt = new OpenLayers.Format.WKT();
					var vectorFeature = olWkt.read(externalGeom);
					var bounds = vectorFeature.geometry.getBounds();
					doc.nunaliit_geom.bbox = [ 
						bounds.left
						,bounds.bottom
						,bounds.right
						,bounds.top
					];
				};
				
			} else {
				if( doc.nunaliit_import.geometry ) {
					delete doc.nunaliit_import.geometry;
				};

				if( changeCurrentGeometry ){
					if( doc.nunaliit_geom ) {
						delete doc.nunaliit_geom;
					};
				};
			};
		};
		
		// Copy only properties that have changed
		var copyOperations = [];
		for(var i=0,e=change.modifiedProperties.length; i<e; ++i){
			var mod = change.modifiedProperties[i];
			var propName = mod.property;
			var propValue = mod.externalValue;
			
			// Update import data
			if( typeof propValue === 'undefined' ){
				if( typeof doc.nunaliit_import.data[propName] !== 'undefined' ){
					delete doc.nunaliit_import.data[propName];
				};
			} else {
				doc.nunaliit_import.data[propName] = propValue;
			};
			
			// Check that all collisions are resolved
			var allCollisionsResolved = true;
			if( mod.collisions && mod.collisions.length > 0 ){
				for(var colIndex=0,colEnd=mod.collisions.length; colIndex<colEnd; ++colIndex){
					var collision = mod.collisions[colIndex];
					if( !collision.selectedValue ){
						allCollisionsResolved = false;
					} else if( 'external' === collision.selectedValue ) {
						copyOperations.push(collision);
					};
				};
			};
			
			if( !allCollisionsResolved ){
				throw 'Invalid state for change since some collision is not resolved';
			};
			
			// Remember operations to be performed
			if( mod.copyOperations && mod.copyOperations.length > 0 ){
				for(var copyIndex=0,copyIndexEnd=mod.copyOperations.length; copyIndex<copyIndexEnd; ++copyIndex){
					var copy = mod.copyOperations[copyIndex];
					copyOperations.push(copy);
				};
			};
		};
		
		// Copy data to user's location according to operations
		importProfile.performCopyOperations(doc, copyOperations);
		
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
				opts.onSuccess();
			}
			,onError: function(errorMsg){ 
				// reportError(errorMsg);
				alert( _loc('Unable to update document. Are you logged in?') );
				opts.onError(errorMsg);
			}
		});
	},
	
	_deleteDocument: function(opts_){
		var opts = $n2.extend({
			change: null
			,onSuccess: function(){}
			,onError: function(err){}
		},opts_);
		
		var _this = this;

		var change = opts.change;
		
		var importId = change.importId;
		var doc = this.analysis.getDbDoc(importId);
		var importProfile = this.analysis.getImportProfile();
		
		// Delete
		var atlasDb = importProfile.getAtlasDb();
		atlasDb.deleteDocument({
			data: doc
			,onSuccess: function(docInfo){
				_this._log( _loc('Deleted document with id: {id}',{id:docInfo.id}) );
				_this._completed(change.changeId);
				opts.onSuccess();
			}
			,onError: function(errorMsg){ 
				// reportError(errorMsg);
				alert( _loc('Unable to delete document. Are you logged in?') );
				opts.onError(errorMsg);
			}
		});
	}
});

//=========================================================================
var ImportProfileOperation = $n2.Class({
	initialize: function(){
		
	},
	
	reportCopyOperations: function(opts_){
		throw 'Subclasses of ImportProfileOperation must implement "reportCopyOperations()"';
	},
	
	performCopyOperation: function(opts_){
		throw 'Subclasses of ImportProfileOperation must implement "performCopyOperation()"';
	}
});

//=========================================================================
var OPERATION_COPY_ALL = /^\s*copyAll\((.*)\)\s*$/;

var ImportProfileOperationCopyAll = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_COPY_ALL.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationCopyAll: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);

		
		var copyOperations = [];
		
		for(var i=0,e=opts.allPropertyNames.length; i<e; ++i){
			var key = opts.allPropertyNames[i];
			
			var targetSelector = this.targetSelector.getChildSelector(key);
			var targetValue = targetSelector.getValue(opts.doc);
			
			var importValue = opts.importData[key];
			
			var isInconsistent = false;
			if( importValue !== targetValue ){
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [key]
				,computedValue: importValue
				,targetSelector: targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
		};
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var key = opts.copyOperation.propertyNames[0];
		var targetSelector = opts.copyOperation.targetSelector;
		var importValue = opts.importData[key];
		
		if( typeof importValue === 'undefined' ){
			targetSelector.removeValue(opts.doc);
		} else {
			targetSelector.setValue(opts.doc, importValue, true);
		};
	}
});

addOperationPattern(OPERATION_COPY_ALL, ImportProfileOperationCopyAll);

//=========================================================================
var OPERATION_COPY_ALL_AND_FIX_NAMES = /^\s*copyAllAndFixNames\((.*)\)\s*$/;

var ImportProfileOperationCopyAllAndFixNames = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_COPY_ALL_AND_FIX_NAMES.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationCopyAllAndFixNames: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);

		
		var copyOperations = [];
		
		for(var i=0,e=opts.allPropertyNames.length; i<e; ++i){
			var key = opts.allPropertyNames[i];
			
			var fixedKey = this._fixKey(key);
			
			var targetSelector = this.targetSelector.getChildSelector(fixedKey);
			var targetValue = targetSelector.getValue(opts.doc);
			
			var importValue = opts.importData[key];
			
			var isInconsistent = false;
			if( importValue !== targetValue ){
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [key]
				,computedValue: importValue
				,targetSelector: targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
		};
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var key = opts.copyOperation.propertyNames[0];
		var targetSelector = opts.copyOperation.targetSelector;
		var importValue = opts.importData[key];
		
		if( typeof importValue === 'undefined' ){
			targetSelector.removeValue(opts.doc);
		} else {
			targetSelector.setValue(opts.doc, importValue, true);
		};
	},
	
	_fixKey: function(key){
		var fixedKey = [];
		var specialChars = " _.(){}[]!@#$%^&*-+=:;,'\"\\/~`<>";
		
		var lastCharWasUnderscore = false;
		for(var i=0,e=key.length; i<e; ++i){
			var c = key[i];
			
			if( specialChars.indexOf(c) >= 0 ) {
				if( !lastCharWasUnderscore ){ 
					fixedKey.push('_');
					lastCharWasUnderscore = true;
				};
			} else {
				fixedKey.push(c); 
				lastCharWasUnderscore = false;
			};
		};
		
		return fixedKey.join('');
	}
});

addOperationPattern(OPERATION_COPY_ALL_AND_FIX_NAMES, ImportProfileOperationCopyAllAndFixNames);

//=========================================================================
// assign(demo_doc.title,'title')
var OPERATION_ASSIGN = /^\s*assign\((.*),\s*'([^']*)'\s*\)\s*$/;

var ImportProfileOperationAssign = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	sourceName: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_ASSIGN.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationAssign: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
		this.sourceName = matcher[2];
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var copyOperations = [];

		if( opts.allPropertyNames.indexOf(this.sourceName) >= 0 ){
			var importValue = opts.importData[this.sourceName];

			var targetValue = this.targetSelector.getValue(opts.doc);
			
			var isInconsistent = false;
			if( importValue !== targetValue ){
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [this.sourceName]
				,computedValue: importValue
				,targetSelector: this.targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
		};
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var importValue = opts.importData[this.sourceName];
		if( typeof importValue === 'undefined' ){
			// Must delete
			this.targetSelector.removeValue(opts.doc);
		} else {
			this.targetSelector.setValue(opts.doc, importValue, true);
		};
	}
});

addOperationPattern(OPERATION_ASSIGN, ImportProfileOperationAssign);

//=========================================================================
var OPERATION_LONGLAT = /^\s*longLat\(\s*'([^']*)'\s*,\s*'([^']*)'\s*\)\s*$/;

var ImportProfileOperationLongLat = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	longName: null,
	
	latName: null,
	
	targetSelector: null,
	
	isLegacyLongLat: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
	
		this.isLegacyLongLat = true;
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_LONGLAT.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationLongLat: '+operationString;
		};
		
		this.longName = matcher[1];
		this.latName = matcher[2];
		
		this.targetSelector = $n2.objectSelector.parseSelector('nunaliit_geom.wkt');
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var copyOperations = [];

		if( opts.allPropertyNames.indexOf(this.longName) >= 0 
		 && opts.allPropertyNames.indexOf(this.latName) >= 0 ){
			var longValue = opts.importData[this.longName];
			var latValue = opts.importData[this.latName];
			
			var importValue = undefined;
			if( typeof longValue !== 'undefined' 
			 && typeof latValue !== 'undefined' ){
				longValue = 1 * longValue;
				latValue = 1 * latValue;
				importValue = 'MULTIPOINT(('+longValue+' '+latValue+'))';
			};

			var targetValue = this.targetSelector.getValue(opts.doc);
			
			var isInconsistent = false;
			if( importValue !== targetValue ){
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [this.longName, this.latName]
				,computedValue: importValue
				,targetSelector: this.targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
		};
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var doc = opts.doc;
		
		var longValue = opts.importData[this.longName];
		var latValue = opts.importData[this.latName];
		
		var importValue = undefined;
		if( typeof longValue !== 'undefined' 
		 && typeof latValue !== 'undefined' ){
			longValue = 1 * longValue;
			latValue = 1 * latValue;
			importValue = 'MULTIPOINT(('+longValue+' '+latValue+'))';
		};

		if( typeof importValue === 'undefined' ){
			// Must delete
			if( doc.nunaliit_geom ){
				delete doc.nunaliit_geom;
			};
		} else {
			doc.nunaliit_geom = {
				nunaliit_type: 'geometry'
				,wkt: importValue
				,bbox: [
					longValue
					,latValue
					,longValue
					,latValue
				]
			};
		};
	},
	
	getGeometry: function(importData){
		var longValue = importData[this.longName];
		var latValue = importData[this.latName];
		
		var importValue = undefined;
		if( typeof longValue !== 'undefined' 
		 && typeof latValue !== 'undefined' ){
			longValue = 1 * longValue;
			latValue = 1 * latValue;
			importValue = 'MULTIPOINT(('+longValue+' '+latValue+'))';
		};
		
		return importValue;
	}
});

addOperationPattern(OPERATION_LONGLAT, ImportProfileOperationLongLat);

//=========================================================================
var OPERATION_REF = /^\s*reference\(([^,]*),\s*'([^']*)'\s*\)\s*$/;

var ImportProfileOperationReference = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	refKey: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_REF.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationReference: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
		this.refKey = matcher[2];
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var copyOperations = [];

		if( opts.allPropertyNames.indexOf(this.refKey) >= 0 ){
			var refId = opts.importData[this.refKey];
			
			var importValue = undefined;
			if( refId ){
				importValue = {
					nunaliit_type: 'reference'
					,doc: refId
				};
			};
			
			var targetValue = this.targetSelector.getValue(opts.doc);
			
			var isInconsistent = false;
			if( importValue === targetValue ){
				// takes care of both undefined
			} else if( importValue 
			 && targetValue 
			 && importValue.doc === targetValue.doc ){
				// Consistent
			} else {
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [this.refKey]
				,computedValue: importValue
				,targetSelector: this.targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
		};
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var doc = opts.doc;
		
		var refId = opts.importData[this.refKey];
		
		var importValue = undefined;
		if( refId ){
			importValue = {
				nunaliit_type: 'reference'
				,doc: refId
			};
		};

		if( typeof importValue === 'undefined' ){
			// Must delete
			this.targetSelector.removeValue(doc);
		} else {
			this.targetSelector.setValue(doc, importValue, true);
		};
	}
});

addOperationPattern(OPERATION_REF, ImportProfileOperationReference);

//=========================================================================
var OPERATION_IMPORT_REF = /^\s*importReference\(([^,]*),\s*'([^']*)'\s*,\s*'([^']*)'\s*\)\s*$/;

var ImportProfileOperationImportReference = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	atlasDesign: null,
	
	profileId: null,
	
	importId: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		this.atlasDesign = opts.atlasDesign;
		
		var matcher = OPERATION_IMPORT_REF.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationImportReference: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
		this.profileId = matcher[2];
		this.importId = matcher[3];
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var _this = this;

		if( opts.allPropertyNames.indexOf(this.importId) >= 0 ){
			var importId = opts.importData[this.importId];
			
			this.atlasDesign.queryView({
				viewName: 'nunaliit-import'
				,startkey: [this.profileId, importId]
				,endkey: [this.profileId, importId]
				,onSuccess: function(rows){
					var refId = null;
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						refId = row.id;
					};
					setReference(refId);
				}
				,onError: function(){
					// there are no document with profileId/importId combination
					setReference(null);
				}
			});
			
		} else {
			// entry does not have data for import id
			setReference(null);
		};
		
		function setReference(refId){
			var copyOperations = [];
			
			var importValue = undefined;
			if( refId ){
				importValue = {
					nunaliit_type: 'reference'
					,doc: refId
				};
			};
			
			var targetValue = _this.targetSelector.getValue(opts.doc);
			
			var isInconsistent = false;
			if( importValue === targetValue ){
				// takes care of both undefined
			} else if( importValue 
			 && targetValue 
			 && importValue.doc === targetValue.doc ){
				// Consistent
			} else {
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [_this.importId]
				,computedValue: importValue
				,targetSelector: _this.targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
			
			opts.onSuccess(copyOperations);
		};
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var doc = opts.doc;
		
		var refId = opts.importData[this.refKey];
		
		var importValue = undefined;
		if( opts.copyOperation 
		 && opts.copyOperation.computedValue ){
			importValue = opts.copyOperation.computedValue;
		};

		if( typeof importValue === 'undefined' ){
			// Must delete
			this.targetSelector.removeValue(doc);
		} else {
			this.targetSelector.setValue(doc, importValue, true);
		};
	}
});

addOperationPattern(OPERATION_IMPORT_REF, ImportProfileOperationImportReference);

//=========================================================================
var OPERATION_SET_VALUE = /^\s*setValue\((.*),\s*(.*)\s*\)\s*$/;

var ImportProfileOperationSetValue = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	value: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		
		var matcher = OPERATION_SET_VALUE.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationSetValue: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
		var value = matcher[2];
		if( value.length > 2 
		 && value[0] === '\'' 
		 && value[value.length-1] === '\'' ){
			this.value = value.substr(1,value.length-2);
		} else if( 'null' === value ){
			this.value = null;
		} else if( 'true' === value ){
			this.value = true;
		} else if( 'false' === value ){
			this.value = false;
		} else {
			this.value = 1 * value;
		};
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var copyOperations = [];

		var targetValue = this.targetSelector.getValue(opts.doc);
		
		var isInconsistent = false;
		if( this.value !== targetValue ){
			isInconsistent = true;
		};
		
		copyOperations.push({
			propertyNames: []
			,computedValue: this.value
			,targetSelector: this.targetSelector
			,targetValue: targetValue
			,isInconsistent: isInconsistent
		});
		
		opts.onSuccess(copyOperations);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		if( this.value === undefined ){
			// Must delete
			this.targetSelector.removeValue(opts.doc);
		} else {
			this.targetSelector.setValue(opts.doc, this.value, true);
		};
	}
});

addOperationPattern(OPERATION_SET_VALUE, ImportProfileOperationSetValue);

//=========================================================================
// findReference(<target-selector>,<key-selection>,<reference-selection>)
var OPERATION_FIND_REF = /^\s*findReference\(([^,]*),\s*'([^']*)'\s*,\s*'([^']*)'\s*\)\s*$/;

var ImportProfileOperationFindReference = $n2.Class(ImportProfileOperation, {
	
	operationString: null,
	
	atlasDesign: null,
	
	profileId: null,
	
	importId: null,
	
	targetSelector: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: null
			,atlasDb: null
			,atlasDesign: null
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);
		
		this.operationString = opts.operationString;
		this.atlasDesign = opts.atlasDesign;
		
		var matcher = OPERATION_IMPORT_REF.exec(this.operationString);
		if( !matcher ) {
			throw 'Invalid operation string for ImportProfileOperationImportReference: '+operationString;
		};
		
		this.targetSelector = $n2.objectSelector.parseSelector(matcher[1]);
		this.profileId = matcher[2];
		this.importId = matcher[3];
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var _this = this;

		if( opts.allPropertyNames.indexOf(this.importId) >= 0 ){
			var importId = opts.importData[this.importId];
			
			this.atlasDesign.queryView({
				viewName: 'nunaliit-import'
				,startkey: [this.profileId, importId]
				,endkey: [this.profileId, importId]
				,onSuccess: function(rows){
					var refId = null;
					for(var i=0,e=rows.length; i<e; ++i){
						var row = rows[i];
						refId = row.id;
					};
					setReference(refId);
				}
				,onError: function(){
					// there are no document with profileId/importId combination
					setReference(null);
				}
			});
			
		} else {
			// entry does not have data for import id
			setReference(null);
		};
		
		function setReference(refId){
			var copyOperations = [];
			
			var importValue = undefined;
			if( refId ){
				importValue = {
					nunaliit_type: 'reference'
					,doc: refId
				};
			};
			
			var targetValue = _this.targetSelector.getValue(opts.doc);
			
			var isInconsistent = false;
			if( importValue === targetValue ){
				// takes care of both undefined
			} else if( importValue 
			 && targetValue 
			 && importValue.doc === targetValue.doc ){
				// Consistent
			} else {
				isInconsistent = true;
			};
			
			copyOperations.push({
				propertyNames: [_this.importId]
				,computedValue: importValue
				,targetSelector: _this.targetSelector
				,targetValue: targetValue
				,isInconsistent: isInconsistent
			});
			
			opts.onSuccess(copyOperations);
		};
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		var doc = opts.doc;
		
		var refId = opts.importData[this.refKey];
		
		var importValue = undefined;
		if( opts.copyOperation 
		 && opts.copyOperation.computedValue ){
			importValue = opts.copyOperation.computedValue;
		};

		if( typeof importValue === 'undefined' ){
			// Must delete
			this.targetSelector.removeValue(doc);
		} else {
			this.targetSelector.setValue(doc, importValue, true);
		};
	}
});

addOperationPattern(OPERATION_FIND_REF, ImportProfileOperationFindReference);

//=========================================================================

var ImportProfileOperationParsed = $n2.Class('ImportProfileOperationParsed', ImportProfileOperation, {

	operationString: null,

	program: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			operationString: undefined
			,program: undefined
			,atlasDb: undefined
			,atlasDesign: undefined
		},opts_);
		
		ImportProfileOperation.prototype.initialize.call(this);

		this.operationString = opts.operationString;
		this.program = opts.program;
		
		this.program.configure(opts);
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		this.program.reportCopyOperations(opts);
	},
	
	performCopyOperation: function(opts_){
		var opts = $n2.extend({
			doc: null
			,importData: null
			,copyOperation: null
		},opts_);
		
		this.program.performCopyOperation(opts);
	}
});

//=========================================================================
var ImportEntry = $n2.Class({
	initialize: function(){
		
	},
	
	getId: function(){
		throw 'Subclasses to ImportEntry must implement getId()';
	},
	
	getProperties: function(){
		throw 'Subclasses to ImportEntry must implement getProperties()';
	},
	
	getGeometry: function(){
		throw 'Subclasses to ImportEntry must implement getGeometry()';
	}
});

//=========================================================================
var ImportProfile = $n2.Class({
	id: null,
	
	sessionId: null,
	
	label: null,
	
	unrelated: null,
	
	layerName: null,
	
	schema: null,
	
	operations: null,
	
	operationsById: null,

	atlasDb: null,

	atlasDesign: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			id: undefined
			,label: undefined
			,unrelated: false
			,layerName: undefined
			,schema: undefined
			,operations: undefined
			,atlasDb: undefined
			,atlasDesign: undefined
		},opts_);
		
		this.id = opts.id;
		this.label = opts.label;
		this.unrelated = opts.unrelated;
		this.layerName = opts.layerName;
		this.schema = opts.schema;
		this.operations = opts.operations;
		this.atlasDb = opts.atlasDb;
		this.atlasDesign = opts.atlasDesign;
		
		this.operationsById = {};
		for(var i=0,e=this.operations.length; i<e; ++i){
			var operation = this.operations[i];
			var opId = operation._n2OpId;
			if( !opId ){
				opId = $n2.getUniqueId();
				operation._n2OpId = opId;
			};
			this.operationsById[opId] = operation;
		};
		
		this.sessionId = this.id + '_' +  (new Date()).toISOString();
	},
	
	getType: function(){
		throw 'getType() must be implemented by all subclasses of ImportProfile';
	},
	
	parseEntries: function(opts){
		throw 'parseEntries() must be implemented by all subclasses of ImportProfile';
	},
	
	getId: function(){
		// unrelated means that this import does not relate
		// to any other import. Therefore, assign a session id
		// instead of a profile id. This way, next time this profile
		// is used, it will not relate to anything that was imported
		// previously
		if( this.unrelated ){
			return this.sessionId;
		};

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
	
	performImportAnalysis: function(opts_){
		var opts = $n2.extend({
			entries: null
			,onSuccess: function(analysis){}
			,onError: function(err){}
		},opts_);
		
		var analyzer = new ImportAnalyzer({
			profile: this
			,atlasDesign: this.atlasDesign
		});
		analyzer.analyzeEntries({
			entries: opts.entries
			,onSuccess: opts.onSuccess
			,onError: opts.onError
		});
	},
	
	reportCopyOperations: function(opts_){
		var opts = $n2.extend({
			doc: null
			,allPropertyNames: null
			,onSuccess: function(copyOperations){}
		},opts_);
		
		var copyOperations = [];
		
		var importData = opts.doc.nunaliit_import.data;
		
		var operations = this.operations.slice(0); // clone
		
		report();
		
		function report(){
			if( operations.length < 1 ){
				opts.onSuccess(copyOperations);
				return;
			};
			
			var op = operations.shift(); // remove first element

			op.reportCopyOperations({
				doc: opts.doc
				,importData: importData
				,allPropertyNames: opts.allPropertyNames
				,onSuccess: function(copies){
					if( copies && copies.length ){
						copies.forEach(function(copy){
							copy._n2OpId = op._n2OpId;
							
							copyOperations.push(copy);
						});
					};
					
					// Perform next one
					window.setTimeout(report,0); // Do not blow stack on large operations
				}
			});
		};
	},
	
	performCopyOperations: function(doc, copyOperations){
		var _this = this;

		var importData = doc.nunaliit_import.data;
			
		copyOperations.forEach(function(copy){
			var opId = copy._n2OpId;
			var op = _this.operationsById[opId];
			
			if( op ){
				op.performCopyOperation({
					doc: doc
					,importData: importData
					,copyOperation: copy
				});
			};
		});
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
		if( this.profile.ignoreId ){
			return undefined;
		};

		var idAttribute = this.profile.idAttribute;
		return this.data[idAttribute];
	},
	
	getProperties: function(){
		return this.data;
	},
	
	getGeometry: function(){
		if( this.profile.legacyLongLat ){
			return this.profile.legacyLongLat.getGeometry(this.data);
		};
		
		return undefined;
	}
});

//=========================================================================
var ImportProfileJson = $n2.Class(ImportProfile, {
	
	idAttribute: null,

	ignoreId: null,
	
	legacyLongLat: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			idAttribute: undefined
			,ignoreId: false
			,legacyLongLat: undefined
		},opts_);
		
		if( opts.ignoreId ){
			opts_.unrelated = true;
		};
		
		ImportProfile.prototype.initialize.call(this, opts_);

		this.legacyLongLat = opts.legacyLongLat;
		this.idAttribute = opts.idAttribute;
		this.ignoreId = opts.ignoreId;
		
		if( this.ignoreId ){
			// Ignoring ids. Import all data
		} else if( !this.idAttribute ){
			throw 'Option "ignoreId" is set or "idAttribute" must be specified for ImportProfileJson';
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
var ImportEntryGeoJson = $n2.Class(ImportEntry, {
	
	id: null,
	
	data: null,
	
	profile: null,
	
	geom: undefined,
	
	initialize: function(opts_){
		
		ImportEntry.prototype.initialize.call(this,opts_);
		
		var opts = $n2.extend({
			id: null
			,data: null
			,geom: undefined
			,profile: null
		},opts_);
		
		this.id = opts.id;
		this.data = opts.data;
		this.geom = opts.geom;
		this.profile = opts.profile;
	},
	
	getId: function(){
		return this.id;
	},
	
	getProperties: function(){
		return this.data;
	},
	
	getGeometry: function(){
		return this.geom;
	}
});

//=========================================================================
var ImportProfileGeoJson = $n2.Class(ImportProfile, {
	
	idAttribute: null,
	
	olGeoJsonFormat: null,
	
	olWktFormat: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			idAttribute: undefined
		},opts_);
		
		ImportProfile.prototype.initialize.call(this, opts_);

		this.idAttribute = opts.idAttribute;
		
		if(OpenLayers 
		 && OpenLayers.Format 
		 && OpenLayers.Format.GeoJSON ){
			this.olGeoJsonFormat = new OpenLayers.Format.GeoJSON({
				ignoreExtraDims: true
			});
		};
		if(OpenLayers 
		 && OpenLayers.Format 
		 && OpenLayers.Format.WKT ){
			this.olWktFormat = new OpenLayers.Format.WKT();
		};
		if( !this.olGeoJsonFormat || !this.olWktFormat ){
			throw 'OpenLayers is required for ImportProfileGeoJson';
		};

	},
	
	getType: function(){
		return 'geojson';
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
		
		// Deal with computed idAttribute values
		var idAttributeFn = undefined;
		if( typeof this.idAttribute === 'string'
		 && this.idAttribute.length > 0 
		 && this.idAttribute[0] === '=' ){
			idAttributeFn = $n2.styleRuleParser.parse(this.idAttribute.substr(1));
		};
		
		// Parse GeoJSON input
		var jsonObj = null;
		try {
			jsonObj = JSON.parse(importData);
		} catch(e) {
			opts.onError( _loc('Unable to parse import data: {err}',{err:e}) );
			return;
		};
		
		if( jsonObj.type !== 'FeatureCollection' ){
			opts.onError( _loc('GeoJSON import is supported only for type "FeatureCollection"') );
			return;
		};
		if( !$n2.isArray(jsonObj.features) ){
			opts.onError( _loc('GeoJSON definition must include an array named "features"') );
			return;
		}
		
		var entries = [];
		for(var i=0,e=jsonObj.features.length; i<e; ++i){
			var feature = jsonObj.features[i];
			
			var id = undefined;
			if( feature.id ){
				id = feature.id;
			};
			
			var props = {};
			if( feature.properties ){
				for(var key in feature.properties){
					if( !key ){
						// skip
					} else if( $n2.trim(key) === '' ) {
						// skip
					} else {
						props[key] = feature.properties[key];
					};
					
					if( key === this.idAttribute && !id ){
						id = feature.properties[key];
					};
				};
			};
			
			// Compute id from formula?
			if( typeof id === 'undefined'
			 && idAttributeFn
			 && typeof idAttributeFn.getValue === 'function' ){
				id = idAttributeFn.getValue(feature);
			};

			var geom = null;
			if( feature.geometry 
			 && this.olGeoJsonFormat ){
				var olGeom = this.olGeoJsonFormat.parseGeometry(feature.geometry);
				geom = this.olWktFormat.extractGeometry(olGeom);
			};
			
			var entry = new ImportEntryGeoJson({
				id: id
				,data: props
				,geom: geom
				,profile: this
			});
			entries.push(entry);
		};
		
		opts.onSuccess(entries);
	}
});

//=========================================================================
var ImportProfileCsv = $n2.Class(ImportProfile, {
	
	idAttribute: null,
	
	ignoreId: null,
	
	legacyLongLat: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			idAttribute: undefined
			,ignoreId: false
			,legacyLongLat: undefined
		},opts_);
		
		if( opts.ignoreId ){
			opts_.unrelated = true;
		};
		
		ImportProfile.prototype.initialize.call(this, opts_);

		this.legacyLongLat = opts.legacyLongLat;
		this.idAttribute = opts.idAttribute;
		this.ignoreId = opts.ignoreId;

		if( this.ignoreId ){
			// Ignoring ids. Import all data
		} else if( !this.idAttribute ){
			throw 'Option "ignoreId" is set or "idAttribute" must be specified for ImportProfileCsv';
		};
	},
	
	getType: function(){
		return 'csv';
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
		
		// Parse CSV input
		var jsonObj = null;
		try {
			jsonObj = $n2.csv.Parse({csv:importData});
		} catch(e) {
			opts.onError( _loc('Unable to parse import data: {err}',{err:e}) );
			return;
		};
		
		
		if( !$n2.isArray(jsonObj) ){
			opts.onError( _loc('CSV definition should yield an array') );
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
var ReferencesFromSchema = $n2.Class('ReferencesFromSchema',{

	atlasDesign: null,

	docsbySchemaName: null,
	
	initialize: function(opts_){
		var opts= $n2.extend({
			atlasDesign: undefined
			,globalContext: undefined
		},opts_);

		var _this = this;

		this.atlasDesign = opts.atlasDesign;
		
		this.docsbySchemaName = {};
		
		if( opts.globalContext ){
			opts.globalContext.referencesFromSchema = function(){
				var ctxt = this;
				_this._getReferences(ctxt, schemaName, expression);
			};
		};
	},

	_getReferences: function(ctxt, cb, schemaName, expression){
		
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
		this.addImportProfileClass('geojson',ImportProfileGeoJson);
		this.addImportProfileClass('csv',ImportProfileCsv);
		
		if( $n2.importProfileOperation 
		 && typeof $n2.importProfileOperation.getGlobalContext === 'function' ){
			var globalContext = $n2.importProfileOperation.getGlobalContext();

			globalContext.test = function(success, error, x){
				success(2 * x);
			};
		};
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
		
		var _this = this;
		
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
				var classOpts = {};
				
				if( typeof importProfile.options === 'object' ){
					for(var key in importProfile.options){
						var value = importProfile.options[key];
						classOpts[key] = value;
					};
				};
				
				classOpts.id = importProfile.id;
				classOpts.label = importProfile.label;
				classOpts.layerName = importProfile.layerName;
				classOpts.atlasDb = this.atlasDb;
				classOpts.atlasDesign = this.atlasDesign;
				classOpts.schema = undefined;
				
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
					var op = createOperation({
						operationString: opString
						,atlasDb: _this.atlasDb
						,atlasDesign: _this.atlasDesign
					});
					if( !op ){
						opts.onError( _loc('Error creating import profile. Unknown operation string: {string}',{string:opString}) );
						return;
					};
					if( op.isLegacyLongLat ){
						classOpts.legacyLongLat = op;
					} else {
						operations.push(op);
					};
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
