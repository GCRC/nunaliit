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
*/

;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
var DH = 'n2.couchMap';
	
var g_dispatcher;

function Configure(opts_){
	var opts = $n2.extend({
		dispatchService: null
	},opts_);
	
	if( opts.dispatchService ){
		g_dispatcher = opts.dispatchService;
	};
};

function getCurrentContext(){
	var sessionContext = null;
	
	if( g_dispatcher ){
		var isLoggedInMsg = {
			type: 'authIsLoggedIn'
		};
		g_dispatcher.synchronousCall(DH,isLoggedInMsg);
		
		sessionContext = isLoggedInMsg.context;
	};
	
	return sessionContext;
};

/*
 * This function retained for backward compatibility
 */
function adjustDocument(doc) {
	
	$n2.couchDocument.adjustDocument(doc);
};

function isAdmin() {

	var admin = false;
	var sessionContext = getCurrentContext();
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
	var roleMap = {};
	var sessionContext = getCurrentContext();
	if( sessionContext ) {
		userName = sessionContext.name;
		
		if( sessionContext.roles ){
			for(var i=0,e=sessionContext.roles.length; i<e; ++i){
				roleMap[sessionContext.roles[i]] = true;
			};
		};
	};

	// On an atlas with a submission database, any user can submit
	// a change to any document
	if( typeof(n2atlas) === 'object' 
	 && n2atlas.submissionDbEnabled
	 && userName ) {
		return true;
	};
	
	// If a document is on a layer, then one must have the roles
	// associated with all layers. If a document is not on a layer,
	// then the roles are not relevant.
	var documentIsControlledLayer = false;
	if( data.nunaliit_layers && data.nunaliit_layers.length ){
		for(var i=0,e=data.nunaliit_layers.length; i<e; ++i){
			var layerId = data.nunaliit_layers[i];
			if( 'public' === layerId ){
				// Public layer. Ignore
			} else if( 'public_' === layerId.substr(0,7) ){
					// Public layer. Ignore
			} else {
				documentIsControlledLayer = true;
				
				var requiredRole = null;
				if( typeof(n2atlas) === 'object' 
				 && typeof(n2atlas.name) === 'string' ) {
					requiredRole = n2atlas.name + '_layer_' + layerId;
				} else {
					requiredRole = 'layer_' + layerId;
				};
				
				if( !roleMap[requiredRole] ){
					return false;
				};
			};
		};
		
		if( documentIsControlledLayer ){
			// At this point, there is at least one controlled layer
			// and we have the roles for all of them.
			return true;
		};
	};

	// If a document is not on a controlled layer, then the creator of the
	// document can edit it
	if (documentOwnedBySessionUser(data)) {
		return true;
	};

	// By default, can not edit a document
	return false;
};

function canDeleteDoc(data) {

	// At this time, if one can edit a document, one can delete it
	return canEditDoc(data);
};

function documentOwnedBySessionUser(doc) {
	const sessionContext = getCurrentContext()
	if (sessionContext) {
		const username = sessionContext.name
		return (doc
			&& doc.nunaliit_created
			&& doc.nunaliit_created.nunaliit_type === 'actionstamp'
			&& doc.nunaliit_created.name === username)
	}
	return false
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

// Exports
$n2.couchMap = {
	Configure: Configure
	,adjustDocument: adjustDocument
	,isAdmin: isAdmin
	,canEditDoc: canEditDoc
	,canDeleteDoc: canDeleteDoc
	,documentContainsMedia: documentContainsMedia
	,documentContainsApprovedMedia: documentContainsApprovedMedia
	,documentContainsDeniedMedia: documentContainsDeniedMedia
	,documentOwnedBySessionUser
};

})(nunaliit2);
