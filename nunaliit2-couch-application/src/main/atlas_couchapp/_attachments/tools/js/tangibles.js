;(function($,$n2){
"use strict";
	
	// Localization
	var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); },
		DH = 'tangibles.js';

	// -----------------------------------------------------------------
	var Logger = $n2.Class({
		
		divId: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				div: null
			},opts_);
			
			var _this = this;
			
			this.divId = $n2.utils.getElementIdentifier( opts.div );
			
			var $outer = $('#'+this.divId);
			$outer
				.addClass('n2log_outer')
				.empty();
			
			var $header = $('<h1>')
				.appendTo($outer);
			$('<span>')
				.text( _loc('Logs') )
				.appendTo($header);
			$('<button>')
				.text( _loc('Clear') )
				.appendTo($header)
				.click(function(){
					_this._clear();
					return false;
				});

			$('<div>')
				.addClass('n2log_entries')
				.appendTo($outer);
		},
		
		_getLogEntries: function(){
			var $entries = $('#'+this.divId).find('.n2log_entries');
			return $entries;
		},
		
		_clear: function(){
			var $d = this._getLogEntries();
			$d.empty();
		},
		
		reportError: function(err){
			var $e = this._getLogEntries();
	
			var $d = $('<div class="n2log_error"></div>');
			$d.text(err);
			$e.append($d);
		},
		
		log: function(msg){
			var $e = this._getLogEntries();
	
			var $d = $('<div class="n2log_log"></div>');
			$d.text(msg);
			$e.append($d);
		}
	});

	// -----------------------------------------------------------------
	var TangiblesApp = $n2.Class({
		
		dispatchService: null,
		
		divId: null,
		
		logger: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				div: null
				,logger: null
				,dispatchService: null
			},opts_);

			var _this = this;
			
			this.divId = $n2.utils.getElementIdentifier( opts.div );
			this.dispatchService = opts.dispatchService;
			this.logger = opts.logger;
			
			if( this.dispatchService ){
				var f = function(m, addr, dispatcher){
					_this._handle(m, addr, dispatcher);
				};
				this.dispatchService.register(DH, 'tuioTangiblesUpdate', f);
			};
			
			var $div = this._getDiv();
			$div.empty();
			
			$('<div>')
				.addClass('n2tangibles_state')
				.appendTo($div);
		},
		
		_getDiv: function(){
			return $('#'+this.divId);
		},
		
		_handle: function(m, addr, dispatcher){
			if( 'tuioTangiblesUpdate' === m.type ){
				var $state = this._getDiv().find('.n2tangibles_state');
				if( typeof JSON !== 'undefined' 
				 && JSON.stringify 
				 && m.tangibles ){
					var text = JSON.stringify(m.tangibles, null, 3);

					$state.empty();
					$('<pre>')
						.text( text )
						.appendTo($state);
				};
			}
		}
	});
	
	// -----------------------------------------------------------------
	function main(opts_) {
		var config = opts_.config;
		var $div = opts_.div;
		var $loggerDiv = opts_.loggerDiv;

		var dispatchService = null;
		if( config ){
			if( config.directory ){
				dispatchService = config.directory.dispatchService;
			};
		};

		var logger = new Logger({
			div: $loggerDiv
		});

		var App = new TangiblesApp({
			div: $div
			,logger: logger
			,dispatchService: dispatchService
		});

		$('.tangiblesAppTitle').text( _loc('Tangibles Application') );

		logger.log( _loc('Tangibles application started') );
	};

	
	$n2.tangiblesApp = {
		main: main
		,TangiblesApp: TangiblesApp
		,Logger: Logger
	};
})(jQuery,nunaliit2);