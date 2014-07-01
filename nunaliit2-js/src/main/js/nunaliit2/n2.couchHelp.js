/*
Copyright (c) 2013, Geomatics and Cartographic Research Centre, Carleton 
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

var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); };
	
var HelpDocument = $n2.Class({
	
	db: null
	
	,doc: null
	
	,initialize: function(opts_){
		var opts = $n2.extend({
			db: null
			,doc: null
		},opts_);

		this.db = opts.db;
		this.doc = opts.doc;
	}

	,getHtmlDescription: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(html){}
			,onError: function(err){}
		},opts_);
		
		var doc = this.doc;
		if( doc 
		 && doc.nunaliit_help 
		 && doc.nunaliit_help.nunaliit_type === 'help') {
			var help = doc.nunaliit_help;
			if( 'attachment' === help.type ){
				this._getAttachment(opts);
				return;
				
			} else if( 'html' === help.type ){
				this._getHtml(opts);
				return;
				
			} else if( 'text' === help.type ){
				this._getText(opts);
				return;
			}
		};
		
		opts.onError( _loc('Invalid help document content') );
	}
	
	,_getAttachment: function(opts){
		var doc = this.doc;
		
		if( doc.nunaliit_help.attachmentName ){
			var localeStr = $n2.l10n.getStringForLocale(doc.nunaliit_help.attachmentName);
			if( localeStr.str ) {
				var attUrl = this.db.getAttachmentUrl(doc,localeStr.str);
				
				$.ajax({
			    	url: attUrl
			    	,type: 'get'
			    	,async: true
			    	,success: function(intro) {
			    		if( localeStr.fallback ){
			    			var $outer = $('<span class="n2_localized_string n2_localize_fallback"></span>');
			    			$('<span class="n2_localize_fallback_lang"></span>')
			    				.text('('+localeStr.lang+')')
			    				.appendTo($outer);
			    			$('<span></span>')
			    				.html(intro)
			    				.appendTo($outer);
		    				opts.onSuccess( $outer.html() );
			    		} else {
		    				opts.onSuccess( intro );
			    		};
			    	}
			    	,error: function(XMLHttpRequest, textStatus, errorThrown) {
						opts.onError( _loc('Error fetching attachment from help document') );
			    	}
				});
				
				// do not trigger error
				return;
			};
		};
		
		opts.onError( _loc('Invalid attachment in help document') );
	}
	
	,_getHtml: function(opts){
		var doc = this.doc;
		
		if( doc.nunaliit_help.content ){
			var localeStr = $n2.l10n.getStringForLocale(doc.nunaliit_help.content);
			if( localeStr.str ) {
	    		if( localeStr.fallback ){
	    			var $outer = $('<span class="n2_localized_string n2_localize_fallback"></span>');
	    			$('<span class="n2_localize_fallback_lang"></span>')
	    				.text('('+localeStr.lang+')')
	    				.appendTo($outer);
	    			$('<span></span>')
	    				.html(localeStr.str)
	    				.appendTo($outer);
    				opts.onSuccess( $outer.html() );
	    		} else {
    				opts.onSuccess(localeStr.str);
	    		};
				
				// do not trigger error
				return;
			};
		};
		
		opts.onError( _loc('Invalid content in help document') );
	}
	
	,_getText: function(opts){
		var doc = this.doc;
		
		if( doc.nunaliit_help.content ){
			var localeStr = $n2.l10n.getStringForLocale(doc.nunaliit_help.content);
			if( localeStr.str ) {
	    		if( localeStr.fallback ){
	    			var $outer = $('<span class="n2_localized_string n2_localize_fallback"></span>');
	    			$('<span class="n2_localize_fallback_lang"></span>')
	    				.text('('+localeStr.lang+')')
	    				.appendTo($outer);
	    			$('<span></span>')
	    				.text(localeStr.str)
	    				.appendTo($outer);
    				opts.onSuccess( $outer.html() );
	    		} else {
	    			var $outer = $('<span class="n2_localized_string"></span>')
	    				.text(localeStr.str);
    				opts.onSuccess( $outer.html() );
	    		};
				
				// do not trigger error
				return;
			};
		};
		
		opts.onError( _loc('Invalid content in help document') );
	}
});

var LoadHelpDocument = function(opts_){
	var opts = $n2.extend({
		db: null
		,id: null
		,onSuccess: function(helpDoc){}
		,onError: function(err){}
	},opts_);
	
	if( !opts.db ){
		opts.onError( _loc('A database must be provided') );
	};
	if( !opts.id ){
		opts.onError( _loc('A document identifier must be provided') );
	};
	
	opts.db.getDocument({
		docId: opts.id
		,onSuccess: function(doc){
			var hd = new HelpDocument({
				db: opts.db
				,doc: doc
			});
			opts.onSuccess(hd);
		}
		,onError: function(errorMsg){
			opts.onError( _loc('Unable to access help document: {{docId}}',{docId: opts.id}) );
		}
	});
};

var CheckBrowserCompliance = function(opts_){
	var opts = $n2.extend({
		db: null
		,helpDocumentId: 'help.browsers'
	},opts_);
	
	var browserInfo = $n2.utils.getBrowserInfo();
	if( browserInfo && browserInfo.browser === 'Explorer' ){
		// Welcome to Microsoft IE. Your mileage might vary.
		if( typeof(browserInfo.version) === 'number' ){
			if( browserInfo.version == 9 || browserInfo.version < 8 ){
				// IE6-7 and IE9 are not supported
				reportUnsupportedBrowser(opts);
			};
		};
	};

	function reportUnsupportedBrowser(opts){
		LoadHelpDocument({
			db: opts.db
			,id: opts.helpDocumentId
			,onSuccess: function(helpDoc){
				helpDoc.getHtmlDescription({
					onSuccess: function(html){
						openDialog(html);
					}
					,onError: error
				});
			}
			,onError: error
		});
		
		function error(){
			alert( _loc('Your browser is not supported by this web site.') );
		};
	};

	function openDialog(htmlContent){
		var helpDialogId = $n2.getUniqueId();
		
		var $dialog = $('<div id="'+helpDialogId+'" class="n2module_help_content"></div>');
		$dialog
			.html(htmlContent)
			.appendTo( $('body') );
		
		var initialHeight = $dialog.height();
		
		var windowHeight = $(window).height();
		var diagMaxHeight = Math.floor(windowHeight * 0.8);

		var dialogOptions = {
			autoOpen: true
			,dialogClass:'n2module_help_dialog'
			,title: _loc('Unsupported Browser')
			,modal: true
			,close: function(event, ui){
				var diag = $(event.target);
				diag.dialog('destroy');
				diag.remove();
			}
		};
		
		// Ensure height does not exceed maximum
		if( initialHeight > diagMaxHeight ){
			dialogOptions.height = diagMaxHeight;
		};
		
		$dialog.dialog(dialogOptions);
	};
};
	
$n2.couchHelp = {
	LoadHelpDocument: LoadHelpDocument
	,CheckBrowserCompliance: CheckBrowserCompliance
};

})(jQuery,nunaliit2);
