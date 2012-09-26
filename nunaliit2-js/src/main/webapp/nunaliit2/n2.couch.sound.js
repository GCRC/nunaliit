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

$Id: n2.couch.sound.js 8439 2012-08-14 19:17:25Z jpfiset $
*/
;(function($,$n2){

// ===========================================================================
function defaultInstallSound(info) {};
function defaultHandleDocumentSound(info_, cb_){cb_(info_);};

var HoverSoundService = $n2.Class({
	options: null
	
	,dispatcher: null
	
	,requestService: null
	
	,currentFocusSoundDocId: null
	
	,dispatchHandle: null
	
	,initialize: function(options_){
		var _this = this;
		
		this.options = $n2.extend({
			db: null // couchDb needed to access documents
			,serviceDirectory: null
			,handleDocumentSound: defaultHandleDocumentSound
		},options_);

		this.currentFocusSoundDocId = null;
		
		if( this.options.serviceDirectory ) {
			this.dispatcher = this.options.serviceDirectory.dispatchService;
			this.requestService = this.options.serviceDirectory.requestService;
		};
		
		if( this.dispatcher ) {
			var f = function(m){ _this._handleDispatch(m); };
			
			this.dispatchHandle = this.dispatcher.getHandle('n2.couch.sound');
			this.dispatcher.register(this.dispatchHandle, 'focusOn', f);
			this.dispatcher.register(this.dispatchHandle, 'focusOff', f);
			this.dispatcher.register(this.dispatchHandle, 'playHoverSoundOn', f);
			this.dispatcher.register(this.dispatchHandle, 'playHoverSoundOff', f);
		};
	}

	,handleFeatureHover: function(feature, opts_) {

		if( !feature ) return;
		
		var data = feature.attributes;
		if( !data ) {
			data = feature.data;
		};
		if( !data ) {
			// can not do anything
			return;
		};

		this.findDocumentHoverSound(data, opts_);
	}

	,findDocumentHoverSound: function(data, opts_) {

		var opts = $.extend({
			installSoundFn: defaultInstallSound
			,handleDocumentSound: this.options.handleDocumentSound
		},opts_);
		
		var _this = this;

		if( !data ) return;
		
		var info = {
			docId: data._id
			,doc: data
			,soundUrl: null
			,installSoundFn: opts.installSoundFn
		};
		
		opts.handleDocumentSound(info, function(info_){
			_this._defaultDocumentSound(info_);
		});
	}

	,_defaultDocumentSound: function(info) {

		var _this = this;

		if( info.soundUrl ) {
			info.installSoundFn(info);
			
		} else {
			GetHoverSoundUrlFromDocument({
				db: this.options.db
				,serviceDirectory: this.options.serviceDirectory
				,doc: info.doc
				,onSuccess: function(soundUrl){
					info.soundUrl = soundUrl;
					info.installSoundFn(info);
				}
			});
		};
	}
	
	,_handleDispatch: function(m){
		var _this = this;
		
		if(m.type==='focusOn'){
			if(m.doc) {
				if( this.currentFocusSoundDocId ) {
					this._removeFocusSound(this.currentFocusSoundDocId);
				};
				
				this.currentFocusSoundDocId = m.doc._id;
				
				this.findDocumentHoverSound(m.doc, {
					installSoundFn: function(info){
						_this._installFocusSound(info);
					}
				});
				
			} else if(m.docId) {
				if( this.currentFocusSoundDocId ) {
					this._removeFocusSound(this.currentFocusSoundDocId);
				};
				
				this.currentFocusSoundDocId = m.docId;
				
				if( this.requestService ) {
					this.requestService.requestDocument(m.docId, function(doc){
						_this.findDocumentHoverSound(doc, {
							installSoundFn: function(info){
								_this._installFocusSound(info);
							}
						});
					});
				};
			};
			
		} else if(m.type==='focusOff'){
			if(m.doc) {
				this._removeFocusSound(m.doc._id);
				
			} else if(m.docId) {
				this._removeFocusSound(m.docId);
			};
			
		} else if(m.type==='playHoverSoundOn'){
			if(m.doc) {
				this._initiatePlaySound(m.doc._id);
				this.findDocumentHoverSound(m.doc, {
					installSoundFn: function(info){
						_this._installPlaySound(info);
					}
				});
			};
			
		} else if(m.type==='playHoverSoundOff'){
			if(m.doc) {
				this._removePlaySound(m.doc._id);
			};
		};
	}
	
	,_installFocusSound: function(info){
		var docId = info.docId;
		var url = info.soundUrl;
		
		if( url && this.currentFocusSoundDocId === docId ) {
			var $div = this._getFocusSoundDiv();
			this._insertSoundElement($div, url);
		};
	}
	
	,_removeFocusSound: function(docId){
		if( this.currentFocusSoundDocId === docId ) {
			var $div = this._getFocusSoundDiv();
			$div.empty();
			this.currentFocusSoundDocId = null;
		};
	}

	/**
	 * Create a div to receive the play sound. If div is removed, then
	 * sound is no longer needed
	 */
	,_initiatePlaySound: function(docId){
		var divId = 'n2CouchPlaySound_' + $n2.utils.stringToHtmlId(docId);

		var $div = $('#'+divId);
		if( $div.length < 1 ) {
			$div = $('<div id="'+divId+'"></div>');
			this._getSoundDiv().append($div);
		};
	}
	
	/**
	 * Takes the sound url and installs a playing element in the
	 * appropriate div. If the div has disappeared, then the sound
	 * is no longer needed and should be ignored.
	 */
	,_installPlaySound: function(info){
		var docId = info.docId;
		var url = info.soundUrl;

		var $div = $('#n2CouchPlaySound_'+$n2.utils.stringToHtmlId(docId));
		this._insertSoundElement($div, url);
	}

	/**
	 * Sound no longer needed. Remove associated div.
	 */
	,_removePlaySound: function(docId){
		var $div = $('#n2CouchPlaySound_'+$n2.utils.stringToHtmlId(docId));
		$div.remove();
	}
	
	,_getSoundDiv: function(){
		var $div = $('#n2CouchSound');
		if( $div.length < 1 ) {
			$div = $('<div id="n2CouchSound"></div>');
			$('body').append( $div );
		};
		return $div;
	}
	
	,_getFocusSoundDiv: function(){
		var $div = $('#n2CouchFocusSound');
		if( $div.length < 1 ) {
			var $parent = this._getSoundDiv();
			$div = $('<div id="n2CouchFocusSound"></div>');
			$parent.append( $div );
		};
		return $div;
	}
	
	,_insertSoundElement: function($div, url){
		$div.html('<embed src="'+url+'" hidden="true" autostart="true" loop="false"/>');
	}
});	

//===========================================================================
var GetHoverSoundUrlFromDocument = function(opts_){
	var opts = $n2.extend({
		db: null // required
		,serviceDirectory: null // required
		,doc: null // required
		,onSuccess: function(soundUrl){}
		,onError: function(err){}
	},opts_);
	
	var data = opts.doc;
	
	var requestService = null;
	if( opts && opts.serviceDirectory ){
		requestService = opts.serviceDirectory.requestService;
	};
	if( !requestService ) {
		opts.onError('Request service not available');
		return;
	};

	// Legacy for Kitikmeot?
	if( data.sound
	 && data.sound.nunaliit_type 
	 && data.sound.nunaliit_type === 'reference' 
	 && data.sound.doc ) {
		// There is a sound associated
		
		// Compute sound URL
		var docUrl = opts.db.getDocumentUrl(data.sound.doc);
		var soundUrl = docUrl+'/converted';
		opts.onSuccess(soundUrl);
		return;
	};
	
	// Loop through attached media, looking for one that claims the hover sound
	if( data.nunaliit_attachments 
	 && data.nunaliit_attachments.nunaliit_type === 'attachment_descriptions'
	 && data.nunaliit_attachments.files
	 ) {
		var hoverSoundAttName = null;
		for(var attName in data.nunaliit_attachments.files ){
			var attDesc = data.nunaliit_attachments.files[attName];
			if( attDesc && attDesc.data && attDesc.data.hoverSound ) {
				hoverSoundAttName = attName;
				break;
			};
		};
		
		if( hoverSoundAttName ) {
			// Compute sound URL
			var docUrl = opts.db.getDocumentUrl(data._id);
			var soundUrl = docUrl+'/'+attName;
			opts.onSuccess(soundUrl);
			return;
		};
	};
	
	// Look for a nunaliit_hoverSound reference
	if( data.nunaliit_hoverSound
	 && data.nunaliit_hoverSound.nunaliit_type === 'reference'
	 && data.nunaliit_hoverSound.doc
	 ) {
		// Sound by reference
		var soundDocId = data.nunaliit_hoverSound.doc;
		requestService.requestDocument(soundDocId, function(doc){
			if( doc 
			 && doc.nunaliit_attachments
			 && doc.nunaliit_attachments.files
			 ) {
				// Get first sound
				for(var attName in doc.nunaliit_attachments.files){
					var attDesc = doc.nunaliit_attachments.files[attName];
					if( doc._attachments 
					 && doc._attachments[attName]
					 && attDesc.fileClass == 'audio'
					 ){
						var docUrl = opts.db.getDocumentUrl(doc._id);
						var soundUrl = docUrl+'/'+attName;
						opts.onSuccess(soundUrl);
						return;
					};
				};
			};
			opts.onError('Can not find sound url');
		});
		return;
	};

	opts.onError('Can not find sound url');
};

//===========================================================================
var DocumentContainsHoverSound = function(data){

	// Legacy for Kitikmeot?
	if( data.sound
	 && data.sound.nunaliit_type 
	 && data.sound.nunaliit_type === 'reference' 
	 && data.sound.doc ) {
		// There is a sound associated
		return true;
	};
	
	// Loop through attached media, looking for one that claims the hover sound
	if( data.nunaliit_attachments 
	 && data.nunaliit_attachments.nunaliit_type === 'attachment_descriptions'
	 && data.nunaliit_attachments.files
	 ) {
		var hoverSoundAttName = null;
		for(var attName in data.nunaliit_attachments.files ){
			var attDesc = data.nunaliit_attachments.files[attName];
			if( attDesc && attDesc.data && attDesc.data.hoverSound ) {
				hoverSoundAttName = attName;
				break;
			};
		};
		
		if( hoverSoundAttName ) {
			return true;
		};
	};
	
	// Look for a nunaliit_hoverSound reference
	if( data.nunaliit_hoverSound
	 && data.nunaliit_hoverSound.nunaliit_type === 'reference'
	 && data.nunaliit_hoverSound.doc
	 ) {
		return true;
	};

	return false;
};
	
//===========================================================================
$n2.couchSound = {
	HoverSoundService: HoverSoundService
	,GetHoverSoundUrlFromDocument: GetHoverSoundUrlFromDocument
	,DocumentContainsHoverSound: DocumentContainsHoverSound
};

})(jQuery,nunaliit2);