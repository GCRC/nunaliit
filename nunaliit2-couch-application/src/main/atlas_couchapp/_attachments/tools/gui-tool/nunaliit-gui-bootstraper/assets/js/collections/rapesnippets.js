define([
    "jquery", "underscore" ,"backbone"
    , "models/snippet"
    , "collections/snippets"

], function(
    $, _, Backbone
    ,SnippetModel
    , SnippetsCollection
){
    var parser = function(){ 
	model: SnippetModel
	, transferAll: function() {
	    return this.map

	}
   };
    return parser;
    }); 


