;(function($,$n2){

// =============================================================

function ShowWaitScreen(message){
	var $message = $('.n2MobileMessage');
	if( $message.length ) {
		$message.find('h1').text(message);
		return;
	};

	var $window = $( window );
	var top = $.support.scrollTop && $window.scrollTop() + $window.height() / 2 || 100;
	$('<div class="n2MobileMessage ui-loader ui-body-a ui-corner-all" style="display:block"><span class="ui-icon ui-icon-loading spin"></span><h1></h1></div>')
		.find( 'h1' )
			.text( message )
			.end()
		.appendTo( $.mobile.pageContainer )
		.css({
			top: top
		});
};

//=============================================================
function SetWaitMessage(message){
	$('.n2MobileMessage').find('h1').text(message);
};

// =============================================================
function HideWaitScreen(){
	$('.n2MobileMessage').remove();
};

// =============================================================
// API
$n2.mobile.ShowWaitScreen = ShowWaitScreen;
$n2.mobile.HideWaitScreen = HideWaitScreen;
$n2.mobile.SetWaitMessage = SetWaitMessage;


})(jQuery,nunaliit2);