define([
       "jquery", "underscore", "backbone"
       ,"helper/pubsub"
       , "text!templates/app/schema-list-item.html"
], function(
  $, _, Backbone,
  PubSub, SchemaItemTemplate
){
  return Backbone.View.extend({
    tagName: "li"
    ,className: "schemamenuitem"
    ,initialize: function(){
      this.template= _.template(SchemaItemTemplate)
      this.render()
    }
    ,events:{
      "click"   : "loadingSchema" //stops checkbox / radio reacting.
    }
    , render: function(){
      var that = this;
      //console.log(that.dbname)
      this.$el.html(that.template({ id : that.model.get("id")
        , group: that.model.get("group")}))
      this.$el.appendTo("ul.dropdown-menu#dropdown-menu-for-schemas")

    }
    ,loadingSchema: function() {
       PubSub.trigger("loadingExistingSchema", this.model)

    }
  });
});
