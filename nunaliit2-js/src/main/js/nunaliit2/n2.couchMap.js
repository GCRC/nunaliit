/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.couchMap.js 8437 2012-08-14 17:59:23Z jpfiset $
*/
;(function($n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
	
/*
 * This function retained for backward compatibility
 */
function adjustDocument(doc) {
	
	$n2.couchDocument.adjustDocument(doc);
};

function isAdmin() {

	var admin = false;
	var sessionContext = $n2.couch.getSession().getContext();
	if( sessionContext
	 && sessionContext.roles ) {
		if( $n2.inArray('_admin',sessionContext.roles) !== -1 ) {
			admin = true;
		};
		if( $n2.inArray('administrator',sessionContext.roles) !== -1 ) {
			admin = true;
		};
		if( typeof(n2atlas) === 'object' 
		 && typeof(n2atlas.name) === 'string' ) {
			var dbAdmin = n2atlas.name + '_administrator';
			if( $n2.inArray(dbAdmin,sessionContext.roles) !== -1 ) {
				admin = true;
			};
		};
	};
	
	return admin;
};

function canEditDoc(data) {

	if( isAdmin() ) {
		return true;
	};

	var userName = null;
	var sessionContext = $n2.couch.getSession().getContext();
	if( sessionContext ) {
		userName = sessionContext.name;
	};

	if( data.nunaliit_created
	 && data.nunaliit_created.nunaliit_type
	 && data.nunaliit_created.nunaliit_type === 'actionstamp'
	 && data.nunaliit_created.name === userName
	 ) {
		return true;
	};
	
	return false;
};

function canDeleteDoc(data) {

	if( isAdmin() ) {
		return true;
	};

	var userName = null;
	var sessionContext = $n2.couch.getSession().getContext();
	if( sessionContext ) {
		userName = sessionContext.name;
	};

	if( data.nunaliit_created
	 && data.nunaliit_created.nunaliit_type
	 && data.nunaliit_created.nunaliit_type === 'actionstamp'
	 && data.nunaliit_created.name === userName
	 ) {
		return true;
	};
	
	return false;
};

function documentContainsMedia(doc){
	var containsMedia = false;
	
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files
	 ) {
		for(var attName in doc.nunaliit_attachments.files){
			containsMedia = true;
		};
	};
	
	return containsMedia;
};

function documentContainsApprovedMedia(doc){
	var containsApprovedMedia = false;
	
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files
	 ) {
		for(var attName in doc.nunaliit_attachments.files){
			var att = doc.nunaliit_attachments.files[attName];
			
			if( att.status === 'approved' 
			 || att.status === 'attached' ) {
				containsApprovedMedia = true;
			};
		};
	};
	
	return containsApprovedMedia;
};

function documentContainsDeniedMedia(doc){
	var containsDeniedMedia = false;
	
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files
	 ) {
		for(var attName in doc.nunaliit_attachments.files){
			var att = doc.nunaliit_attachments.files[attName];
			
			if( att.status === 'denied' ) {
				containsDeniedMedia = true;
			};
		};
	};
	
	return containsDeniedMedia;
};

function getNunaliitAtlases(opts_){
	var opts = $n2.extend({
		couchServer: null
		,onSuccess: function(array){}
		,onError: function(msg){}
	},opts_);
	
	var databasesToQuery = {};
	
	if( !opts.couchServer 
	 || !opts.couchServer.listDatabases ){
		opts.onError( 'Couch Server is required' );
	};
	
	opts.couchServer.listDatabases({
		onSuccess: databaseList
		,onError: opts.onError
	});
	
	function databaseList(dbNames){
		var found = false;
		for(var i=0,e=dbNames.length; i<e; ++i){
			var n = dbNames[i];
			if( n.length > 0 && n[0] != '_' ){
				getDesignDocAtlas(n);
				found = true;
			};
		};
		if( !found ) {
			testResults();
		};
	};
	
	function getDesignDocAtlas(dbName){
		var db = opts.couchServer.getDb({dbName: dbName});
		
		databasesToQuery[dbName] = false;
		
		db.getDocument({
			docId: '_design/atlas'
			,onSuccess: function(dd){
				if( dd 
				 && dd.nunaliit ){
					databasesToQuery[dbName] = {
						dbName: dbName
						,atlasName: dd.nunaliit.name
						,restricted: dd.nunaliit.restricted
						,db: db
					};
				} else {
					delete databasesToQuery[dbName];
				};
				testResults();
			}
			,onError: function(){
				// On error, can not retrieve document. Assume
				// it is not a Nunaliit Atlas
				delete databasesToQuery[dbName];
				testResults();
			}
		});
	};
	
	function testResults(){
		for(var dbName in databasesToQuery){
			if( !databasesToQuery[dbName] ){
				// Not all have returned, yet
				return;
			};
		};
		
		// Return results
		var results = [];
		for(var dbName in databasesToQuery){
			results.push(databasesToQuery[dbName]);
		};
		
		opts.onSuccess(results);
	};
};

function getAllAtlasRoles(opts_){
	var opts = $n2.extend({
		db: null
		,atlasName: null
		,restricted: false
		,include_layer_roles: false
		,onSuccess: function(roles){}
		,onError: function(msg){}
	},opts_);

	var roles = [];
	var atlasName = opts.atlasName;
	var restricted = opts.restricted;
	
	if( atlasName ){
		computeDatabaseRoles();
	} else {
		opts.db.getDocument({
			docId: '_design/atlas'
			,onSuccess: function(dd){
				if( dd 
				 && dd.nunaliit ){
					atlasName = dd.nunaliit.name;
					restricted = dd.nunaliit.restricted;
				};
				computeDatabaseRoles();
			}
			,onError: function(){
				// On error, can not retrieve document. Assume
				// it is not a Nunaliit Atlas
				done();
			}
		});
	};
	
	function computeDatabaseRoles(){
		if( atlasName ){
			roles.push( atlasName + '_administrator' );
			roles.push( atlasName + '_vetter' );
			
			if( restricted ){
				roles.push( atlasName + '_user' );
			};
			
			if( opts.include_layer_roles ){
				computeRolesFromLayerDefinitions();
				
				return;
			};
		};
		
		done();
	};
	
	function computeRolesFromLayerDefinitions(){
		var dd = opts.db.getDesignDoc({ddName:'atlas'});
		dd.queryView({
			viewName: 'layer-definitions'
			,onSuccess: function(rows){
				for(var i=0,e=rows.length;i<e;++i){
					var r = rows[i];
					var layerId = r.key;
					if( typeof(layerId) === 'string' && layerId !== 'public' ) {
						var role = atlasName + '_layer_' + layerId;
						if( roles.indexOf(role) < 0 ) {
							roles.push(role);
						};
					};
				};
				computeRolesFromLayersInUse();
			}
			,onError: function(){
				$n2.log('Unable to obtain layer definitions from database: '+atlasName);
				computeRolesFromLayersInUse();
			}
		});
	};
	
	function computeRolesFromLayersInUse(){
		var dd = opts.db.getDesignDoc({ddName:'atlas'});
		dd.queryView({
			viewName: 'layers'
			,reduce: true
			,group: true
			,onSuccess: function(rows){
				for(var i=0,e=rows.length;i<e;++i){
					var r = rows[i];
					var layerId = r.key;
					if( typeof(layerId) === 'string' && layerId !== 'public' ) {
						var role = atlasName + '_layer_' + layerId;
						if( roles.indexOf(role) < 0 ) {
							roles.push(role);
						};
					};
				};
				done();
			}
			,onError: function(){
				$n2.log('Unable to obtain layers from database: '+atlasName);
				done();
			}
		});
	};
	
	function done(){
		opts.onSuccess(roles);
	};
};

function getAllServerRoles(opts_){
	var opts = $n2.extend({
		couchServer: null
		,include_layer_roles: false
		,onSuccess: function(roles){}
		,onError: function(msg){}
	},opts_);
	
	var roles = {
		administrator: true
	};
	var dbsToQuery = {};
	
	$n2.couchMap.getNunaliitAtlases({
		couchServer: opts.couchServer
		,onSuccess: function(dbs){
			for(var i=0,e=dbs.length; i<e; ++i){
				var db = dbs[i];
				
				dbsToQuery[db.dbName] = true;
				
				getDatabaseRoles(db);
			};
			
			testResults();
		}
		,onError: opts.onError
	});
	
	function getDatabaseRoles(db){
		getAllAtlasRoles({
			db: db.db
			,atlasName: db.atlasName
			,restricted: db.restricted
			,include_layer_roles: opts.include_layer_roles
			,onSuccess: function(atlasRoles){
				for(var i=0,e=atlasRoles.length; i<e; ++i){
					var role = atlasRoles[i];
					roles[role] = true;
				};
				delete dbsToQuery[db.dbName];
				testResults();
			}
			,onError: function(msg){
				delete dbsToQuery[db.dbName];
				testResults();
			}
		});
	};
	
	function testResults(){
		for(var dbName in dbsToQuery){
			// Not all have returned, yet
			return;
		};
		
		// Return results
		var results = [];
		for(var r in roles){
			results.push(r);
		};
		
		opts.onSuccess(results);
	};
};


// Exports
$n2.couchMap = {
	adjustDocument: adjustDocument
	,isAdmin: isAdmin
	,canEditDoc: canEditDoc
	,canDeleteDoc: canDeleteDoc
	,documentContainsMedia: documentContainsMedia
	,documentContainsApprovedMedia: documentContainsApprovedMedia
	,documentContainsDeniedMedia: documentContainsDeniedMedia
	,getNunaliitAtlases: getNunaliitAtlases
	,getAllAtlasRoles: getAllAtlasRoles
	,getAllServerRoles: getAllServerRoles
};

})(nunaliit2);
