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
;(function($,$n2){

function adjustDocument(doc) {

	// Get user name
	var userName = null;
	var sessionContext = $n2.couch.getSession().getContext();
	if( sessionContext ) {
		userName = sessionContext.name;
	};
	
	// Get now
	var nowTime = (new Date()).getTime();
	
	if( userName ) {
		if( null == doc.nunaliit_created ) {
			doc.nunaliit_created = {
				nunaliit_type: 'actionstamp'
				,name: userName
				,time: nowTime
				,action: 'created'
			};
		};
		
		doc.nunaliit_last_updated = {
			nunaliit_type: 'actionstamp'
			,name: userName
			,time: nowTime
			,action: 'updated'
		};
	};
};

function isAdmin() {

	var admin = false;
	var sessionContext = $n2.couch.getSession().getContext();
	if( sessionContext
	 && sessionContext.roles ) {
		if( sessionContext.roles.indexOf('_admin') !== -1 ) {
			admin = true;
		};
		if( sessionContext.roles.indexOf('administrator') !== -1 ) {
			admin = true;
		};
		if( typeof(n2atlas) === 'object' 
		 && typeof(n2atlas.name) === 'string' ) {
			var dbAdmin = n2atlas.name + '_administrator';
			if( sessionContext.roles.indexOf(dbAdmin) !== -1 ) {
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

function OnFeatureEdit(feature) {
	if( !feature ) return;
	var data = feature.data;
	if( !data ) {
		data = feature.attributes;
	}
	if( !data ) return;

	adjustDocument(data);
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
$.olkitMap = {
	OnFeatureEdit: OnFeatureEdit
};

$n2.couchMap = {
	adjustDocument: adjustDocument
	,isAdmin: isAdmin
	,canEditDoc: canEditDoc
	,canDeleteDoc: canDeleteDoc
	,documentContainsMedia: documentContainsMedia
	,documentContainsApprovedMedia: documentContainsApprovedMedia
	,documentContainsDeniedMedia: documentContainsDeniedMedia
};

})(jQuery,nunaliit2);
