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
;(function($,$n2){

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };

//========================================================================

var Attachment = $n2.Class({
	doc: null,
	
	attName: null,
	
	mediaRelativePath: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			doc: null
			,attName: null
			,mediaRelativePath: null
		},opts_);
		
		this.doc = opts_.doc;
		this.attName = opts_.attName;
		this.mediaRelativePath = opts_.mediaRelativePath;
	},
	
	getName: function(){
		return this.attName;
	},
	
	getStatus: function(){
		var att = this._getAtt();
		return att.status;
	},
	
	getFileClass: function(){
		var att = this._getAtt();
		return att.fileClass;
	},
	
	getMediaFileUrl: function(){
		var att = this._getAtt();
		if( att 
		 && att.mediaFile 
		 && this.mediaRelativePath ){
			return this.mediaRelativePath + att.mediaFile;
		};
		return null;
	},
	
	getStructure: function(){
		return this._getAtt();
	},
	
	isSource: function(){
		var att = this._getAtt();
		return !att.source;
	},
	
	getThumbnailAttachment: function(){
		var thumbAtt = null;
		
		var att = this._getAtt();
		if( att ){
			var thumbName = att.thumbnail;
			if( thumbName ) {
				var otherAtt = this._getAtt(thumbName);
				if( otherAtt ) {
					thumbAtt = new Attachment({
						doc: this.doc
						,attName: thumbName
						,mediaRelativePath: this.mediaRelativePath
					});
				};
			};
		};
		
		return thumbAtt;
	},
	
	getOriginalAttachment: function(){
		var originalAtt = null;
		
		var att = this._getAtt();
		if( att ){
			var originalName = att.originalAttachment;
			if( originalName ) {
				var otherAtt = this._getAtt(originalName);
				if( otherAtt ) {
					originalAtt = new Attachment({
						doc: this.doc
						,attName: originalName
						,mediaRelativePath: this.mediaRelativePath
					});
				};
			};
		};
		
		return originalAtt;
	},
	
	getSourceAttachment: function(){
		var originalAtt = null;
		
		var att = this._getAtt();
		if( att ){
			var sourceName = att.source;
			if( sourceName ) {
				var otherAtt = this._getAtt(sourceName);
				if( otherAtt ) {
					originalAtt = new Attachment({
						doc: this.doc
						,attName: sourceName
						,mediaRelativePath: this.mediaRelativePath
					});
				};
			};
		};
		
		return originalAtt;
	},
	
	changeStatus: function(status){
		var att = this._getAtt();
		if( att ) {
			
			att.status = status;
			
			var thumbName = att.thumbnail;
			if( null != thumbName ) {
				var thumbAtt = this._getAtt(thumbName);
				if( thumbAtt ) {
					thumbAtt.status = status;
				};
			};
			
			var originalName = att.originalAttachment;
			if( null != originalName ) {
				var originalAtt = this._getAtt(originalName);
				if( originalAtt ) {
					originalAtt.status = status;
				};
			};
		};
	},
	
	_getAtt: function(name){
		name = name ? name : this.attName;
		if( this.doc
		 && this.doc.nunaliit_attachments
		 && this.doc.nunaliit_attachments.files
		 && this.doc.nunaliit_attachments.files[name] ) {
			
			return this.doc.nunaliit_attachments.files[name];
		};
		
		return null;
	}
});

//========================================================================

/*
 * Returns the attachment structure associated with the attachment name.
 * Returns null if nothing is found.
 */
function getAttachmentFromName(doc, attachmentName, mediaRelativePath){
	var att = null;
	
	if( doc
	 && doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files
	 && doc.nunaliit_attachments.files[attachmentName] ) {
		
		att = new Attachment({
			doc: doc
			,attName: attachmentName
			,mediaRelativePath: mediaRelativePath
		});
	};
	
	return att;
};
//========================================================================

/*
 * Returns a list of attachment structures associated with the document.
 */
function getAttachments(doc, mediaRelativePath){
	var result = [];
	
	if( doc
	 && doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files ) {
		
		for(var attName in doc.nunaliit_attachments.files){
			var att = new Attachment({
				doc: doc
				,attName: attName
				,mediaRelativePath: mediaRelativePath
			});
			
			if( att ){
				result.push(att);
			};
		};
	};
	
	return result;
};

// ========================================================================

var AttachmentService = $n2.Class({
	
	mediaRelativePath: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			mediaRelativePath: null
		},opts_);
		
		this.mediaRelativePath = opts.mediaRelativePath;
	}

	,getAttachments: function(doc){
		return getAttachments(doc, this.mediaRelativePath);
	}

	,getAttachment: function(doc, attachmentName){
		return getAttachmentFromName(doc, attachmentName, this.mediaRelativePath);
	}
});

//========================================================================

$n2.couchAttachment = {
	AttachmentService: AttachmentService
	,getAttachments: getAttachments
	,getAttachmentFromName: getAttachmentFromName
};

})(jQuery,nunaliit2);
