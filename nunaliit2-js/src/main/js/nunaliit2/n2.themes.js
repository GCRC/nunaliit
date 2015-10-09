/*
Copyright (c) 2015, Geomatics and Cartographic Research Centre, Carleton 
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
;(function($n2){
"use strict";

//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//*******************************************************
var Theme = $n2.Class({
	themeName: null,
	
	themePath: null,

	styles: null,
	
	libraries: null,
	
	templatePath: null,

	templateHtml: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			themeName: null
			,themePath: null
			,jsonTheme: null
		},opts_);
		
		this.themeName = opts.themeName;
		this.themePath = opts.themePath;
		this.styles = [];
		this.libraries = [];
		this.templatePath = undefined;
		this.templateHtml = undefined;
		
		if( opts.jsonTheme ){
			var jsonTheme = opts.jsonTheme;
			
			if( jsonTheme.styles && jsonTheme.styles.length ){
				for(var i=0,e=jsonTheme.styles.length; i<e; ++i){
					var style = jsonTheme.styles[i];
					this.styles.push(style);
				};
			};
			
			if( jsonTheme.libraries && jsonTheme.libraries.length ){
				for(var i=0,e=jsonTheme.libraries.length; i<e; ++i){
					var lib = jsonTheme.libraries[i];
					this.libraries.push(lib);
				};
			};
			
			if( typeof jsonTheme.template === 'string' ){
				this.templatePath = this._computeEffectiveUrl(jsonTheme.template);
			};
		};
	},
	
	loadTemplate: function(opts_){
		var opts = $n2.extend({
			onSuccess: function(html){}
			,onError: function(msg){}
		},opts_);
		
		var _this = this;
		
		if( this.templateHtml ){
			opts.onSuccess(this.templateHtml);

		} else if( this.templatePath ) {
			$.ajax({
				url: this.templatePath
				,type: 'get'
				,async: true
				,dataType: 'html'
				,success: function(htmlDocument) {
					_this.templateHtml = htmlDocument;
					opts.onSuccess(_this.templateHtml);
				}
				,error: function(XMLHttpRequest, textStatus, errorThrown) {
					opts.onError( _loc('Error loading HTML template for theme: {name}',{
						name: _this.themeName
					}) );
				}
			});
			
		} else {
			// Nothing to load
			opts.onSuccess();
		};
	},
	
	install: function(opts_){
		var opts = $n2.extend({
			elem: null
			,onSuccess: function(){}
			,onError: function(msg){}
		},opts_);
		
		var _this = this;
		
		this.loadTemplate({
			onSuccess: loaded
			,onError: opts.onError
		});
		
		function loaded(){
			// Load CSS style sheets
			for(var i=0,e=_this.styles.length; i<e; ++i){
				var style = _this.styles[i];
				
				// Attribute rel
				if( typeof style.rel !== 'string' ){
					style.rel = '';
				};
				if( style.rel.indexOf('stylesheet') < 0 ){
					var parts = style.rel.split(' ');
					parts.push('stylesheet');
					style.rel = parts.join(' ');
				};
				
				// Attribute type
				if( typeof style.type !== 'string' ){
					style.type = 'text/css';
				};
				
				if( typeof style.href === 'string' ){
					var $link = $('<link>');
					
					for(var name in style){
						var value = style[name];
						
						if( 'href' === name ){
							value = _this._computeEffectiveUrl(value);
						};
						
						if( typeof value === 'string' ){
							$link.attr(name,value);
						};
					};
					
					$('head').append($link);
				};
			};
			
			// Insert HTML
			if( opts.elem ){
				var $elem = $(opts.elem);
				
				if( _this.templateHtml ){
					$elem.html(_this.templateHtml);
				};
			};
			
			// Insert libraries
			for(var i=0,e=_this.libraries.length; i<e; ++i){
				var library = _this.libraries[i];
				
				if( typeof library.src === 'string' ){
					var effectiveSrc = _this._computeEffectiveUrl(library.src);
					$n2.scripts.loadScript(effectiveSrc, true);
				};
			};
			
			opts.onSuccess();
		};
	},
	
	_computeEffectiveUrl: function(path){
		return this.themePath + path;
	}
});

//*******************************************************
var ThemesService = $n2.Class({
	rootPath: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			rootPath: null
		},opts_);
		
		this.rootPath = opts.rootPath;
	},
	
	loadTheme: function(opts_){
		var opts = $n2.extend({
			path: null
			,onSuccess: function(theme){}
			,onError: function(msg){}
		},opts_);
		
		var effectiveUrl = this.rootPath + opts.path;
		
		$.ajax({
			url: effectiveUrl
			,type: 'get'
			,async: true
			,dataType: 'json'
			,success: function(jsonTemplate) {
				// Compute theme directory
				var themePath = null;
				var index = effectiveUrl.lastIndexOf('/');
				if( index >= 0 ){
					themePath = effectiveUrl.substr(0,index+1);
				} else {
					themePath = '';
				};
				
				var theme = new Theme({
					themeName: opts.path
					,themePath: themePath
					,jsonTheme : jsonTemplate
				});
				
				theme.loadTemplate({
					onSuccess: function(){
						opts.onSuccess(theme);
					}
					,onError: function(msg){
						opts.onError(msg);
					}
				});
			}
			,error: function(XMLHttpRequest, textStatus, errorThrown) {
				opts.onError('Error loading theme '+opts.path+': '+textStatus);
			}
		});
	}
});

//*******************************************************
$n2.themes = {
	ThemesService: ThemesService
};

})(nunaliit2);
