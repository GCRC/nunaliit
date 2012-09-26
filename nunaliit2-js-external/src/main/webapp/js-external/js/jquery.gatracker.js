/* 	gaTracker 1.0.1: jQuery Google Analytics Integration 
	A quicker, automated way to embed Google Analytics.
	(c)2007 Jason Huck/Core Five Creative
	
	* BETA Support for new Analytics API (ga.js) by Jamie Thompson - http://jamazon.co.uk
	* Requires jQuery 1.2.x or higher (for cross-domain $.getScript)
	* TODO: more testing, delay after $.getScript for Safari
	
	Usage:
	Only a tracking code is required:
	$.gaTracker('UA-XXXXX-XX');

	...but other options can be specified:
	$.gaTracker(
		'UA-XXXXX-XX',
		{
			external:	'/external/',
			mailto:		'/mailto/',
			download:	'/downloads/',
			extensions:	[
				'pdf','doc','xls','csv','jpg','gif', 'mp3',
				'swf','txt','ppt','zip','gz','dmg','xml'		
			]
		}
	);

*/


(function($){
	$.gaTracker = function(code, opts){
		opts = jQuery.extend({
			external:	'/external/',
			mailto:		'/mailtos/',
			download:	'/downloads/',
			extensions: [
					'pdf','doc','xls','csv','jpg','gif','png','mp3',
					'swf','txt','ppt','zip','gz','dmg','xml', 'js',
					'mov', 'mp4', 'tar', 'tgz'		
			]	
		}, opts);
		
		// Returns the given URL prefixed if it is:
		//		a) a link to an external site
		//		b) a mailto link
		//		c) a downloadable file
		// ...otherwise returns an empty string.
		function decorateLink(u){
			var trackingURL = '';
			
			if(u.indexOf('://') == -1 && u.indexOf('mailto:') != 0){
				// no protocol or mailto - internal link - check extension
				var ext = u.split('.')[u.split('.').length - 1];			
				var exts = opts.extensions;
				
				for(i = 0; i < exts.length; i++){
					if(ext == exts[i]){
						trackingURL = opts.download + u;
						break;
					}
				}				
			} else {
				if(u.indexOf('mailto:') == 0){
					// mailto link - decorate
					trackingURL = opts.mailto + u.substring(7);					
				} else {
					// complete URL - check domain
					var regex = /([^:\/]+)*(?::\/\/)*([^:\/]+)(:[0-9]+)*\/?/i;
					var linkparts = regex.exec(u);
					var urlparts = regex.exec(location.href);					
					if(linkparts[2] != urlparts[2]) trackingURL = opts.external + u;
				}
			}
			
			return trackingURL;			
		}
		
		// add tracking code to the current page
		function addTracking(){
			$.pageTracker = _gat._getTracker(code);
			$.pageTracker._initData();
			$.pageTracker._trackPageview();
		
			// examine every link in the page
			$('a').each(function(){
				var u = $(this).attr('href');
				
				if(typeof(u) != 'undefined'){
					var newLink = decorateLink(u);

					// if it needs to be tracked manually,
					// bind a click event to call GA with
					// the decorated/prefixed link
					if(newLink.length){
						$(this).click(function(){
							$.pageTracker._trackPageview(newLink);
						});
					}
				}				
			});
		}
		
		// include the external GA script in try/catch to play nice
		function initGA(){
			try{
				// determine whether to include the normal or SSL version
				var gaURL = (location.href.indexOf('https') == 0 ? 'https://ssl' : 'http://www');
				gaURL += '.google-analytics.com/ga.js';
		
				// include the script
				$.getScript(gaURL, function(){
					addTracking();
				});
			} catch(err) {
				// log any failure
				console.log('Failed to load Google Analytics:' + err);
			}
		}
		
		initGA();
	}
})(jQuery);