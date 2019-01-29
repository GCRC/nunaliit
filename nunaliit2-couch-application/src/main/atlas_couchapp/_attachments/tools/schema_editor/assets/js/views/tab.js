define([
       'jquery', 'underscore', 'backbone'
       , "text!templates/app/tab-nav.html"
       , "text!templates/app/tab-nav-dropdown.html"
, "views/existing-schema"
], function($, _, Backbone,
           _tabNavTemplate, _tabNavDropTemplate, SchemaListItemView){
  return Backbone.View.extend({
    tagName: "div"
    , className: "tab-pane"
    , initialize: function() {
      this.id = this.options.title.toLowerCase().replace(/\W/g,'');
      if(!this.options.dropdown)
       {
         this.tabNavTemplate = _.template(_tabNavTemplate);
       }
       else{
         this.tabNavTemplate = _.template(_tabNavDropTemplate)
       }
      this.render();
    },
	appendSchemaListFromDb : function(){

		var that = this;
		$("ul.dropdown-menu#dropdown-menu-for-schemas").empty();
		this.options.n2Config.directory.schemaRepository.getRootSchemas({
			onSuccess: schemasLoaded
			,onError: function(err){
				$n2.logError('Unable to load schemas');
			}
		});
		
		function schemasLoaded(schemas){
			schemas.forEach(function(data){
				// Discount the schemas which _id starts with org.nunaliit
				if( data 
				 && data.jsonDefinition 
				 && data.jsonDefinition._id 
				 && data.jsonDefinition._id.startsWith('org.nunaliit') ){
					// Ignore
				} else if( data && data.definition ){
					new SchemaListItemView({
						model: new Backbone.Model(data["definition"])
					});
				};
			});
		};
	},
    render: function(){
      // Render Snippet Views
      var that = this;
      // Render & append nav for tab
      $("#formtabs").append(this.tabNavTemplate({title: this.options.title, id: this.id}))
      if (that.collection !== undefined) {
        _.each(this.collection.renderAll(), function(snippet){
          that.$el.append(snippet);
        });
      } else if(that.options.dropdown){

          $("li.dropdown#"+that["id"]).append(that.options.content);
          $("li.dropdown#"+that["id"]).on("click", function(event) {
              event.preventDefault();
              that.appendSchemaListFromDb()
          } )
      } else if (that.options.content){
        that.$el.append(that.options.content);
      }



      // Render tab
      this.$el.attr("id", this.id);
      this.$el.appendTo(".tab-content");
      this.delegateEvents();
    }

  });
});
