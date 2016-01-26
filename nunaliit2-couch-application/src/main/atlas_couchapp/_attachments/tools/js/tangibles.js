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
	var ConfigurationEditor = $n2.Class({

		divId: null,
		
		confObj: null,
		
		tuioConfiguration: null,

		initialize: function(opts_){
			var opts = $n2.extend({
				div: null
			},opts_);

			var _this = this;

			this.divId = $n2.utils.getElementIdentifier( opts.div );
			
			this.tuioConfiguration = new $n2.tuioClient.TuioConfiguration();
			this.confObj = this.tuioConfiguration.loadConfiguration();

			var $outer = this._getDiv();
			$outer
				.addClass('n2tangibles_editor')
				.empty();
			
			var $header = $('<div>')
				.addClass('n2tangibles_editor_menu')
				.appendTo($outer);
			$('<span>')
				.text( _loc('Configuration') )
				.appendTo($header);
			$('<button>')
				.addClass('n2tangibles_editor_button n2tangibles_editor_button_refresh')
				.text( _loc('Refresh') )
				.appendTo($header)
				.click(function(){
					_this._refresh();
					return false;
				});
			$('<button>')
				.addClass('n2tangibles_editor_button n2tangibles_editor_button_enable')
				.text( _loc('?') )
				.appendTo($header)
				.click(function(){
					_this._toggleEnable();
					return false;
				});
			$('<button>')
				.addClass('n2tangibles_editor_button n2tangibles_editor_button_save')
				.text( _loc('Save') )
				.appendTo($header)
				.click(function(){
					_this._save();
					return false;
				});
			$('<button>')
				.addClass('n2tangibles_editor_button n2tangibles_editor_button_delete')
				.text( _loc('Delete') )
				.appendTo($header)
				.click(function(){
					_this._delete();
					return false;
				});

			$('<div>')
				.addClass('n2tangibles_editor_tree')
				.appendTo($outer);
			
			this._refresh();
		},

		_getDiv: function(){
			return $('#'+this.divId);
		},
		
		_refresh: function(){
			var $tree = this._getDiv().find('.n2tangibles_editor_tree');
			
			this.confObj = this.tuioConfiguration.loadConfiguration();

			$tree.empty();
			var objectTree = new $n2.tree.ObjectTree($tree, this.confObj);
			new $n2.tree.ObjectTreeEditor(objectTree, this.confObj);
			
			if( this.tuioConfiguration.isEnabled() ){
				this._getDiv().find('.n2tangibles_editor_button_enable').text( _loc('Disable') );
			} else {
				this._getDiv().find('.n2tangibles_editor_button_enable').text( _loc('Enable') );
			};
		},
		
		_toggleEnable: function(){
			var enabled = this.tuioConfiguration.isEnabled();
			enabled = !enabled;
			this.tuioConfiguration.setEnabled(enabled);
			this._refresh();
		},

		_save: function(){
			this.tuioConfiguration.saveConfiguration(this.confObj);
			this._refresh();
		},

		_delete: function(){
			this.tuioConfiguration.deleteConfiguration();
			this._refresh();
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

			var $editor = $('<div>')
				.addClass('n2tangibles_editor')
				.appendTo($div);
			new ConfigurationEditor({
				div: $editor
			});
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