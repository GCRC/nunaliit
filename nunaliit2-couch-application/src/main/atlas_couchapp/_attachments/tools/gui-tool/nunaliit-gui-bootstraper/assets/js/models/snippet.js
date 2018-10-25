define([
      'jquery', 'underscore', 'backbone'
], function($, _, Backbone) {
  return Backbone.Model.extend({
    initialize: function() {
      this.set("fresh", true);
      this.set("fromDb", false);
    }
    , getValues: function(){
      return _.reduce(this.get("fields"), function(o, v, k){
        if (v["type"] == "select") {
          o[k] = _.find(v["value"], function(o){return o.selected})["value"];
        } else {
          o[k] = v["value"];
        }
        return o;
      }, {});
    }

    , idFriendlyTitle: function(){
      return this.get("title").replace(/\W/g,'').toLowerCase();
    }
    , setField: function(name, value) {
      var fields = this.get("fields")
      fields[name]["value"] = value;
      this.set("fields", fields);
    }
    , setFieldFromJson: function(name, value){

      var fields = this.get("fields")
      if(typeof fields[name] === "undefined") {
        console.log("CAUSION: one of the field is missing in ", name)
        return;
      }
      var type = fields[name]["type"]
      switch(type) {
        case "string":
          fields[name]["value"] = value
          this.set("fields", fields);
          break;
        case "checkbox":
          fields[name]["value"] = value
          this.set("fields", fields);
          break;
        case "input":
          if(fields[name]["hide"] !== "undefined" && fields[name]["hide"]) {

          } else {
             fields[name]["value"] = value
             this.set("fields", fields);
          }
          break;
        case "textarea":
          fields[name]["value"] = JSON.parse(JSON.stringify(value))
          this.set("fields", fields);
          break;
        case "textarea-split":
          var checkboxvalarr = _.map(value, function(t){return $.trim(t["label"])})
          fields[name]["value"] = checkboxvalarr
          this.set("fields", fields);
          break;
        case "select":
          var valmatch = _.find(fields[name]["value"], function(v){
            return value.startsWith(v["value"])
          });
          var valarr = _.map(fields[name]["value"], function(v){
            return {value: v["value"], label: v["label"], selected: value.startsWith(v["value"])
                    ,needExtra :  v["needExtra"]  }
          });

          if(typeof valmatch["needExtra"] !=="undefined" && valmatch["needExtra"]) {
            fields["customField"]["value"] = value.substring(value.indexOf("(")+2, value.lastIndexOf(")")-1)
          }
          fields[name]["value"] = valarr;
          this.set("fields", fields);
          break;
      }


    }
    , mergeField: function(snippet){
	    var fields = this.get("fields")
	    var thatFields = snippet.get("fields")
	    this.set("fields", _.extend(fields, thatFields))

      }

  });
});
