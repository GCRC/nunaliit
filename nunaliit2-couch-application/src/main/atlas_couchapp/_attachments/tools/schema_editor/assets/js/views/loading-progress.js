define([
       "jquery", "underscore", "backbone"
      , "helper/pubsub"
], function(
  $, _, Backbone
  , PubSub
){
  return Backbone.View.extend({
    tagName: "div"
    ,className: "progress-bar"
    ,loading : 0
    ,loaded : 0
    , initialize : function(){
    	PubSub.on("loadingBarStartOver", this.startOver, this);
    	PubSub.on("rapeSnippetsDecre", this.addLoaded , this);
    	PubSub.on("rapeSnippetsIncre", this.addLoading , this);
    	this.render();

    }
      , render: function(){
	  this.$el.appendTo(".navbar-fixed-top");
      }
      , startOver : function() {
    	  this.loading = 0;
    	  this.loaded = 0;
      }
    , addLoading : function(){
      if( this.loading === 0) {
        this.show();
        }
        ++this.loading;
        this.update();

    }
    ,addLoaded : function(){
    //If nothing is waitng to be loaded, no showing.
     if(this.loading !== 0){
      var this_ = this;
      setTimeout(function(){
        ++this_.loaded;
        this_.update();
      },100);
      }
    }
    ,update : function(){
      var width = (this.loaded / this.loading * 100).toFixed(1) + '%';
      this.el.style.width = width;
      if (this.loading === this.loaded) {
        this.loading = 0;
        this.loaded = 0;
        var this_ = this;
        setTimeout(function() {
          this_.hide();
        }, 500);
      }
    }
    , show : function(){
      this.el.style.visibility = 'visible';
    }
    , hide : function(){
      if( this.loading === this.loaded) {
        this.el.style.visibility = 'hidden';
        this.el.style.width = 0;
      }
    }

  })


});