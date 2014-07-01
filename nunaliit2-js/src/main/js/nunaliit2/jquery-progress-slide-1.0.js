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

$Id: jquery-progress-slide-1.0.js 8165 2012-05-31 13:14:37Z jpfiset $
*/
(function($){

	function CreateHolder() {
		var $holder = $('#progress-slider');
		if( $holder.size() === 0 ) {
			$holder = $('<div id="progress-slider" class="prog-holder">' +
			'<div id="progress-slider-background" class="prog-background" style="position:absolute;top:0px;left:0px;width:100%;height:100%;">' +
			'</div>' +
			'</div>' );
			
			$(document.body).append($holder);
		}
		var $holder = $('#progress-slider');
	};
	
	function PutAway(elemId) {
	    var elem = $('#'+elemId);
		elem.animate({
			left:"0px"
			,bottom:"0px"
			}
			,function(){
				elem.one('click',function(){
					PutUp(elemId);
				});
				elem.attr('prog-slider-viewed',0);
				CheckReadyRemove(elemId);
			}
		);
	};
	       
	function Close(elemId) {
	    var $downElem = $('#'+elemId+'_down');
	
	    if( $downElem.size() > 0 ) {
		    $downElem.slideUp(function(){
				PutAway(elemId);
			});
	    } else {
			PutAway(elemId);
	    }
	};
	       
	function PutUp(elemId) {
	    var elem = $('#'+elemId);
	    var win = $(window);
		    
		// Figure out center of screen
		var screenCenterX = win.width() / 2;
		var screenCenterY = win.height() / 2;
	
		// Figure out offset of element
		var elemOffset = elem.offset();
	
		// Figure out dimension of object
		var elemWidth = elem.width();
		var elemHeight = elem.height();
	
		var elemFinalPosX = Math.floor(screenCenterX - (elemWidth / 2));
		var elemFinalPosY = Math.floor(screenCenterY - (elemHeight / 2));
	    
	    elem.attr('prog-slider-viewed',1);
		elem.animate({
			left:''+elemFinalPosX+'px'
			,bottom:''+elemFinalPosY+'px'
			}
			,function(){
				Open(elemId);
			});
	};
	
	function Open(elemId) {
	    var elem = $('#'+elemId);
	    elem.one("click",function(){
			Close(elemId);
		});
	    
		$('#'+elemId+'_down').slideDown();
	};
	
	function AddBar(id,description) {

		CreateHolder();
		
		var newBar = $('<div id="'+id+'" title="'+description+'" class="prog-moveBar" style="position:relative;left:0px;bottom:0px;">' +
			'<div id="'+id+'_value" class="prog-moveBar-colour" style="width:0%"></div>' +
			'<div id="'+id+'_down" style="position:absolute;display:none;left:-200px;top:-2px;width:600px;margin:0px;background:#ffffff;border:1px solid #000000">' +
				'<div id="'+id+'_value2" class="prog-moveBar-colour" style="width:0%"></div>' +
				'<table class="prog-description-table"><tr><th>Description:</th><td id="'+id+'_description">'+description+'</td></tr>' +
				'<tr><th>Progress:</th><td id="'+id+'_percent"></td></tr>' +
				'<tr><th></th><td><a id="'+id+'_cancel" href="#">Cancel Reporting</a></td></tr></table>' +
			'</div>' +
		'</div>');
	
		$('#progress-slider-background').after(newBar);
		$('#'+id+'_cancel').click(function(evt){
			RemoveBar(id);
			return false;
		});
	
		newBar.one('click',function(){
			PutUp(id);
		});
		newBar.attr('prog-slider-viewed',0);
	
		return id;
	}
	
	function RemoveBar(elemId) {
	    var $elem = $('#'+elemId);
	    $elem.slideUp(function(){
		    $elem.remove();
		});
	}
	
	function SetValue(elemId,percent) {
	    if( percent > 100 ) percent = 100;
	    if( percent < 0 ) percent = 0;
	    $('#'+elemId+'_value').css({width:''+percent+'%'});
	    $('#'+elemId+'_value2').css({width:''+percent+'%'});
	    $('#'+elemId+'_percent').text(''+percent+'%');
	}
	
	function CheckReadyRemove(elemId) {
		var $elem = $('#'+elemId);
		
		if( $elem.size() > 0 ) {
			var ready = 1 * $elem.attr('prog-slider-ready-remove');
			var viewed = 1 * $elem.attr('prog-slider-viewed');
			
			if( ready && !viewed ) {
				RemoveBar(elemId);
			};
		};
	}
	
	var onStartDefault = function(keyInfo,options) {
		var key = 'prog-slider_' + keyInfo.key;
		AddBar(key,keyInfo.desc);
	};
	 
	var onCompleteDefault = function(keyInfo,options) {
		var key = 'prog-slider_' + keyInfo.key;
		SetValue(key,100);
	    $('#'+key+'_percent').text('Done');
	    $('#'+key).attr('title',keyInfo.desc+'. Done.');
	    
	    // Remember to remove this bar after a delay
	    $('#'+key)
	    	.attr('prog-slider-stopped',1)
	    	.attr('prog-slider-ready-remove',0);
	    
	    setTimeout(function(){
		    $('#'+key).attr('prog-slider-ready-remove',1);
	    	CheckReadyRemove(key);
	    },5000); // 5 seconds
	};

	var onUpdateDefault = function(keyInfo,options) {
		var key = 'prog-slider_' + keyInfo.key;
		SetValue(key,keyInfo.value);
	    $('#'+key).attr('title',keyInfo.desc+' ('+keyInfo.value+'%)');
	};

	var onRemoveDefault = function(key,options) {
		var key = 'prog-slider_' + key;
		RemoveBar(key);
	};
	
	// Install global tracker
	if( $.progress && $.progress.addProgressTracker ) {
		var trackerOptions = {
			onStart: onStartDefault
			,onUpdate: onUpdateDefault 
			,onComplete: onCompleteDefault
			,onRemove: onRemoveDefault
		};
		
		$.progress.addProgressTracker(trackerOptions);
	};
})(jQuery);
