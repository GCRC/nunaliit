define([
       "jquery", "underscore", "backbone",
       "views/snippet", "views/temp-snippet",
       "helper/pubsub"
], function(
  $, _, Backbone,
  SnippetView, TempSnippetView,
  PubSub
){
  return SnippetView.extend({
    events:{
      "click"   : "preventPropagation" //stops checkbox / radio reacting.
      , "mousedown" : "mouseDownHandler"
      , "mouseup"   : "mouseUpHandler"
    }

    , mouseDownHandler : function(mouseDownEvent){
	  if(this.model.get("title") !== "n2 schema info"){
	      mouseDownEvent.stopPropagation();
	      mouseDownEvent.preventDefault();
	      var that = this;
	      //popover
	      $(".popover").remove();
	      this.$el.popover({placement: 'bottom'});
	      this.$el.popover("show");
	      $(".popover #save").on("click", this.saveHandler(that));
	      $(".popover #cancel").on("click", this.cancelHandler(that));
	      $(".popover #label").on("change", this.updateN2idUsingLabel(that));
             // $(".popover .n2id-label-in-popover").on("click", this.updateN2id(that));
        $("body").on("mousemove", function(mouseMoveEvent){
		  if(
		      Math.abs(mouseDownEvent.pageX - mouseMoveEvent.pageX) > 10 ||
			    Math.abs(mouseDownEvent.pageY - mouseMoveEvent.pageY) > 10
		  ){
		      that.$el.popover('destroy');
		      PubSub.trigger("mySnippetDrag", mouseDownEvent, that.model);
		      that.mouseUpHandler();
		  };
              });
	  } else {
	      // for schema profile info
	      var that = this;
	      $(".field").on("change", this.saveHandlerForInfo(that));

	  }
    }

    , preventPropagation: function(e) {
      e.stopPropagation();
      e.preventDefault();
    }

    , mouseUpHandler : function(mouseUpEvent) {
        $("body").off("mousemove");
    }
    , saveHandlerForInfo : function(boundContext) {
      return function(e) {
        e.preventDefault();
        var fields = $(".field");
        _.each(fields, function(ele) {
          var $ele = $(ele)
          , type = $ele.attr("type")
          , name = $ele.attr("n2id");
          switch(type){
            case "info-input":
              boundContext.model.setField(name, $ele.val());
              break;
            case "info-input-textarea":
               boundContext.model.setField(name,
                 _.chain($ele.val().split("\n"))
                 .map(function(t){return $.trim(t)})
                 .filter(function(t){return t.length > 0})
                 .value()
               );
               break;
          }

        });
        boundContext.model.trigger("change");
      }

    }
      , updateN2idUsingLabel : function(boundContext){
	  var that = this
	return function(keyboardEvent) {
	    keyboardEvent.preventDefault();
	    if(that.model.get("fromDb")){
		return;
	    }
	 var fields = $(".popover .field");
         var labelInputField = _.find(fields, function(field){
          return $(field).attr("id") ==="label"
        });
         var  idFromLabel = $(labelInputField).val()
         		.toLowerCase()
         		.replace(/\s+/g, '_')
         		.replace(/^_+|_+$/g,'');

        var n2idInputField = _.find(fields,function(e){
          return $(e).attr("id") === "n2id";
        });
        $(n2idInputField).val(idFromLabel)
	}
     } 
    , updateN2id :function(boundContext ) {
      return function(mouseEvent) {
        mouseEvent.preventDefault();

        var fields = $(".popover .field");
        var labelInputField = _.find(fields, function(field){
          return $(field).attr("id") ==="label"
        });
        var idFromLabel = $(labelInputField).val()
                             .toLowerCase()
                             .replace(/\s+/g, '_')
                             .replace(/^_+|_+$/g,'');
        var n2idInputField = _.find(fields,function(e){
          return $(e).attr("id") === "n2id";
        });
        $(n2idInputField).html(idFromLabel)
      }
    }
    , saveHandler : function(boundContext) {
      return function(mouseEvent) {
        mouseEvent.preventDefault();
        var fields = $(".popover .field");
        _.each(fields, function(e){

          var $e = $(e)
          , type = $e.attr("data-type")
          , name = $e.attr("id");

          switch(type) {
            case "string":
               console.log($e.html())
               boundContext.model.setField(name, $e.html());
               break;
            case "checkbox":
              boundContext.model.setField(name, $e.is(":checked"));
              break;
            case "input":
              boundContext.model.setField(name, $e.val());
              break;
            case "textarea":
              boundContext.model.setField(name, $e.val());
              break;
            case "textarea-split":
              boundContext.model.setField(name,
                _.chain($e.val().split("\n"))
                  .map(function(t){return $.trim(t)})
                  .filter(function(t){return t.length > 0})
                  .value()
                  );
              break;
            case "select":
              var valarr = _.map($e.find("option"), function(e){
		  return {value: e.value, selected: e.selected, label:$(e).text()
			  , needExtra: (typeof $(e).attr("needextra") !== "undefined") ? $(e).attr("needextra") : false
			 };
              });
              boundContext.model.setField(name, valarr);
              break;
          }
        });
          boundContext.model.trigger("change");
          $(".popover").remove();
      }
    }

    , cancelHandler : function(boundContext) {
      return function(mouseEvent) {
        mouseEvent.preventDefault();
          $(".popover").remove();
        boundContext.model.trigger("change");
      }
    }

  });
});
