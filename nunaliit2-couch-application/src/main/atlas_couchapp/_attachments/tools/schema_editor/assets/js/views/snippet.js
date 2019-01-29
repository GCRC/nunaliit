define([
  "jquery", "underscore", "backbone"
  , "text!templates/popover/popover-main.html"
  , "text!templates/popover/popover-input.html"
  , "text!templates/popover/popover-select.html"
  , "text!templates/popover/popover-textarea.html"
  , "text!templates/popover/popover-textarea-split.html"
    , "text!templates/popover/popover-checkbox.html"
    , "text!templates/popover/popover-string.html"
  , "templates/snippet/snippet-templates"
  , "bootstrap"
], function(
  $, _, Backbone
  , _PopoverMain
  , _PopoverInput
  , _PopoverSelect
  , _PopoverTextArea
  , _PopoverTextAreaSplit
    , _PopoverCheckbox
    , _PopoverString
  , _snippetTemplates
){
  return Backbone.View.extend({
    tagName: "div"
    , className: "component"
      , initialize: function(){
	 // console.log("which two problem: " , this.model.idFriendlyTitle() + "html")
      var templatehtmlfile = _snippetTemplates[this.model.idFriendlyTitle()+ "html"] || _snippetTemplates["n2attributedefaulthtml"]
	  this.template = _.template(templatehtmlfile)
	  this.popoverTemplates = {
              "input" : _.template(_PopoverInput)
              , "select" : _.template(_PopoverSelect)
              , "textarea" : _.template(_PopoverTextArea)
              , "textarea-split" : _.template(_PopoverTextAreaSplit)
              , "checkbox" : _.template(_PopoverCheckbox)
	             ,"string" : _.template(_PopoverString)
	  }
      }
    , render: function(withAttributes){
      var that = this;
      var content = _.template(_PopoverMain)({
        "title": that.model.get("title"),
        "items" : that.model.get("fields"),
        "popoverTemplates": that.popoverTemplates
      });
	//console.log("which one problem: " , this.model.idFriendlyTitle())

	if (withAttributes) {
    //
        var templatefile =  _snippetTemplates[this.model.idFriendlyTitle()] || _snippetTemplates["n2attributedefault"]
        var objVal= that.model.getValues()
        objVal = _.extend(objVal, {id : objVal["n2id"]})
	    var jsonContent =  _.template(templatefile)(_.omit(objVal, "n2id"));
            return this.$el.html(
            that.template(that.model.getValues())
        ).attr({
           "data-content"    : content
          , "json-content"   : jsonContent
          , "data-title"     : that.model.get("title")
          , "data-trigger"   : "manual"
          , "data-html"      : true
        });
      } else {
        return this.$el.html(
          that.template(that.model.getValues())
        )
      }
    }
  });
});
