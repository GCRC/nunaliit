;(function($,$n2){

//=============================================================
var GetMediaClass = function(doc, attName){
	var mediaClass = null;
	
	if( doc._attachments
	 && doc._attachments[attName] ) {
		var _att = doc._attachments[attName];
		
		if( _att.content_type ) {
			var classSeperatorIndex = _att.content_type.search('/');
			if( classSeperatorIndex >= 0 ) {
				mediaClass = _att.content_type.substr(0,classSeperatorIndex);
			};
		};
	};
	
	if( doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files
	 && doc.nunaliit_attachments.files[attName] ) {
		var nunaliit_att = doc.nunaliit_attachments.files[attName];
		
		if( nunaliit_att.fileClass ) {
			mediaClass = nunaliit_att.fileClass;
		};
	};
	
	return mediaClass;
};

//=============================================================
var DisplayMedia = function(db, $elem, doc, attName){
	
	$elem.empty();
	
	var mediaClass = GetMediaClass(doc, attName);
	if( !mediaClass ) {
		return;
	};
	
	var mimeType = null;
	if( doc._attachments
	 && doc._attachments[attName] ) {
		var _att = doc._attachments[attName];
		
		if( _att.content_type ) {
			mimeType = _att.content_type;
		};
	};
	if( !mimeType ){
		return;
	};
	
	if( _att && _att.data ) {
		// inline data
		if( mediaClass === 'video' || mediaClass === 'audio') {
			// iPhone/iPad does not support data:uri for video and audio
			var src = null;
		} else {
			var src = 'data:'+_att.content_type+';base64,'+_att.data;
		};
		
	} else {
		// Content retrieved from database
		var docUrl = db.getDocumentUrl(doc);
		var src = docUrl+'/'+attName+'?_='+(new Date()).getTime();
	};

	if( mediaClass === 'image' ) {
		$elem.append( $('<img src="'+src+'"/>') );

    } else if( mediaClass === 'video' ) {
    	if( null === src ) {
			$elem.text('Video can not be played back until document is saved');
    	} else {
//Dynamic video tags in iOS are causing issues        	
//			$content.append( $('<div><video width="320" height="240" controls="controls" src="'+src+'" type="'+mimeType+'">'
//				+'Video can not be played back'
//				+'</video></div>') );
			$elem.append( $('<embed width="320" height="240" controller="true" src="'+src+'" type="'+mimeType+'">'
				+'  </embed>') );
    	};

    } else if( mediaClass === 'audio' ) {
    	if( null === src ) {
			$elem.text( 'Audio can not be played back until document is saved' );
    	} else {
			$elem.append( $('<audio controls="controls" src="'+src+'" type="'+mimeType+'">'
				+'Audio can not be played back'
				+'</audio>') );
    	};
	};
};

//=============================================================
var DisplayMediaThumbnail = function(db, $elem, doc, attName){
	
	$elem.empty();

	var attachment = null;
	if( doc 
	 && doc.nunaliit_attachments
	 && doc.nunaliit_attachments.files 
	 && doc.nunaliit_attachments.files[attName]
	 ){
		attachment = doc.nunaliit_attachments.files[attName];
	};
	if( !attachment ) {
		return;
	};
	
	// Try to display thumbnail
	if( attachment.thumbnail ) {
		var thumbName = attachment.thumbnail;
		if( doc._attachments
		 && doc._attachments[thumbName]
		 ) {
			DisplayMedia(db, $elem, doc, thumbName);
			return;
		};
	};
	
	var mediaClass = GetMediaClass(doc, attName);
	
	// If this is an image
	if( 'image' === mediaClass ) {
		var _att = null;
		if( doc._attachments ) {
			_att = doc._attachments[attName];
		};
		if( _att ) {
			if( _att.data ) {
				// inline data
				var src = 'data:'+_att.content_type+';base64,'+_att.data;
			} else {
				// Content retrieved from database
				var docUrl = db.getDocumentUrl(doc);
				var src = docUrl+'/'+attName+'?_='+(new Date()).getTime();
			};
			$elem.append( $('<img src="'+src+'" height="60" width="60"/>') );
			return;
		};
	};

	// At this point, show some icon
	if( 'image' === mediaClass ) {
		$elem.append( $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_image"></div></div>') );
	} else if( 'audio' === mediaClass ) {
		$elem.append( $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_audio"></div></div>') );
	} else if( 'video' === mediaClass ) {
		$elem.append( $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_video"></div></div>') );
	} else {
		// default
		$elem.append( $('<div class="n2Show_icon_wrapper"><div class="n2Show_icon_image"></div></div>') );
	};
};

//=============================================================
var MobileMediaViewer = $n2.Class({
	
	options: null
	
	,pageId: null
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,initialize: function(opts_){
		this.options = $n2.extend({
			currentDb: null
			,doc: null
			,attachmentName: null
		},opts_);
		
		this.createPage();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getCurrentDb: function(){
		return this.options.currentDb;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDb: function(){
		return this.options.currentDb.getDb();
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getAttachmentName: function(){
		return this.options.attachmentName;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDoc: function(){
		return this.options.doc;
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getDocId: function(){
		return this.options.doc._id;
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,getPage: function(){
		return $('#'+this.pageId);
	}
	
	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,createPage: function(){

		var pageId = 'media_'+this.options.doc._id+'_'+this.options.attachmentName;
		
		var documentBase = $.mobile.getDocumentBase(true);
		var absUrl = $.mobile.path.makeUrlAbsolute( pageId, documentBase.hrefNoHash );
		var dataUrl = $.mobile.path.convertUrlToDataUrl( absUrl );
		
		var $newPage = $.mobile.pageContainer.children('#'+pageId);
		if( $newPage.length < 1 ) {
			// Create page
			$newPage = $('<div id="'+pageId+'" data-url="'+dataUrl+'" data-role="page" data-add-back-btn="true" data-theme="b"></div>');
			$newPage.append('<div data-role="header" data-theme="b"><h1>View Media&nbsp;&nbsp;<span class="mobileMediaViewLabel"></span></h1></div>');
			$newPage.append('<div class="mobileMediaViewContent" data-role="content" data-theme="d"></div>');
			$newPage.append('<div class="mobileMediaViewFooter" data-role="footer" data-theme="b"></div>');
			
			$.mobile.pageContainer.append($newPage);
			
			// Enhance page
			$newPage.page();
			$newPage.bind('pagehide',function(){
				var $this = $( this ),
					prEvent = new $.Event( "pageremove" );

				$this.trigger( prEvent );

				if( !prEvent.isDefaultPrevented() ){
					$this.removeWithDependents();
				};
			});
		};
		
		this.pageId = pageId;
		
		this.showDocument();
		
		// Load this page
		$.mobile.changePage($newPage);
	}

	// +*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*+*
	,showDocument: function(){
		var _this = this;
		
		var currentDb = this.getCurrentDb();
		var doc = this.getDoc();
		var attName = this.getAttachmentName();
		
		var $page = this.getPage();
		var $content = $page.find('.mobileMediaViewContent');
		var $label = $page.find('.mobileMediaViewLabel');
		
		// Label
		var $docBrief = $('<span></span>');
		$label
			.empty()
			.append($docBrief)
			.append( $('<span> / '+this.getAttachmentName()+'</span>') );
		currentDb.getShowService().displayBriefDescription($docBrief, null, doc);

		// Describe content
		$content.empty();

		// Report type and size
		if( doc._attachments
		 && doc._attachments[attName] ) {
			var _att = doc._attachments[attName];
			
			if( _att.content_type ) {
				$content.append( $('<div>Type: '+_att.content_type+'</div>') );
			};
			
			if( _att.length ) {
				$content.append( $('<div>Size: '+_att.length+'</div>') );
			};
		};
		
		// Report title and description
		if( doc.nunaliit_attachments
		 && doc.nunaliit_attachments.files
		 && doc.nunaliit_attachments.files[attName] ) {
			var nunaliit_att = doc.nunaliit_attachments.files[attName];
			
			var data = nunaliit_att.data;
			if( data ) {
				if( data.title ) {
					var $title = $('<div>Title: <span></span></div>');
					$content.append( $title );
					$title.find('span').text(data.title);
				};
	
				if( data.description ) {
					var $description = $('<div>Description: <span></span></div>');
					$content.append( $description );
					$description.find('span').text(data.description);
				};
			};
		};
		
		// Print out media
		var $div = $('<div></div>');
		$content.append( $div );
		DisplayMedia(this.getDb(), $div, doc, attName);
		
		$page.trigger('create');
	}
});

$n2.mobile.GetMediaClass = GetMediaClass;
$n2.mobile.DisplayMedia = DisplayMedia;
$n2.mobile.DisplayMediaThumbnail = DisplayMediaThumbnail;
$n2.mobile.MobileMediaViewer = MobileMediaViewer;

})(jQuery,nunaliit2);