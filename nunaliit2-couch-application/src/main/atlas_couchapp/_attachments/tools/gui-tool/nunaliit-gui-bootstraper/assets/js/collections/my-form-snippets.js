define([
       "jquery" , "underscore" , "backbone","bootstrap-waitingfor"
       , "models/snippet"
       , "collections/snippets"
    , "views/my-form-snippet"
    , "text!data/n2attributeboolean.json"
    , "text!data/n2.json" , "text!data/n2attributes.json"
   , "text!data/testrape.json"
], function(
  $, _, Backbone, Waitingfor
  , SnippetModel
  , SnippetsCollection
    , MyFormSnippetView
    , n2AttrBoolean
    ,n2mandatoryJSON , attributesJSON
    , testRape
){
  return SnippetsCollection.extend({
    model: SnippetModel
    , initialize: function() {
      this.counter = {};
      this.on("add", this.giveUniqueIdandN2boolean);

    }
    , giveUniqueIdandN2boolean: function(snippet){
	if(!snippet.get("fresh")) {
        return;
      }
      snippet.set("fresh", false);
      var snippetType = snippet.attributes.fields.type.value;

      if(typeof this.counter[snippetType] === "undefined") {
        this.counter[snippetType] = 0;
      } else {
        this.counter[snippetType] += 1;
      }

      snippet.setField("n2id", "nunaliit-" + snippetType + "-" + this.counter[snippetType]);
      if(typeof snippet.get("fields")["id2"] !== "undefined") {
        snippet.setField("id2", snippetType + "2-" + this.counter[snippetType]);
      }
    	snippet.mergeField(new Backbone.Model(JSON.parse(n2AttrBoolean)[0]))
    }
    , giveUniqueId: function(snippet){
      if(!snippet.get("fresh")) {
        return;
      }
      snippet.set("fresh", false);
      var snippetType = snippet.attributes.fields.type.value;

      if(typeof this.counter[snippetType] === "undefined") {
        this.counter[snippetType] = 0;
      } else {
        this.counter[snippetType] += 1;
      }

      snippet.setField("n2id", "nunaliit-" + snippetType + "-" + this.counter[snippetType]);

      if(typeof snippet.get("fields")["id2"] !== "undefined") {
        snippet.setField("id2", snippetType + "2-" + this.counter[snippetType]);
      }
    }
    , containsFileType: function(){
      return !(typeof this.find(function(snippet){
        return snippet.attributes.title === "File Button"
      }) === "undefined");
    }
    , readRapeSnippets: function(modelJSON){
       // var waitingDialog = Waitingfor.constructDialog();
        waitingDialog.show();
        setTimeout(function(){waitingDialog.hide();},1500)
	    this.reset();
      var rapeSnippets = modelJSON;
      var infoSnippetJson = JSON.parse(n2mandatoryJSON);
      var attrSnippetJson = JSON.parse(attributesJSON);
      var attrBoolSnippetInstance = JSON.parse(n2AttrBoolean) [0]
      var that = this;
      //adding info-snippet
      _.each( infoSnippetJson, function(infoSnippetInstance){
        var infoSnippet = new SnippetModel(infoSnippetInstance)
          infoSnippet.set("fresh", false);
	  infoSnippet.set("fromDb", true);
        _.each(_.keys(rapeSnippets), function(fieldname){
          if(fieldname !== "attributes"){
            fieldnameDecorated = fieldname === "id"? "n2id" : fieldname;
            infoSnippet.setFieldFromJson(fieldnameDecorated, rapeSnippets[fieldname])
          }
        })
        that.push(infoSnippet);
      });
      //adding attributes-Snippets
      var attrs = rapeSnippets["attributes"];
      _.each( attrs, function(attr){
        var candidateSnippetModel = _.find(attrSnippetJson, function(n2attr) {
          return n2attr["fields"]["type"]["value"] === attr["type"]
        })
        if(typeof candidateSnippetModel  !== "undefined"){

          var newCandidateSnippetModel =JSON.parse(JSON.stringify(candidateSnippetModel))
          var candidateSnippetInstance = new SnippetModel(newCandidateSnippetModel);
          candidateSnippetInstance.set("fresh", false);
          candidateSnippetInstance.set("fromDb", true);
          var newAttrBoolSnippetInstance = JSON.parse(JSON.stringify(attrBoolSnippetInstance))
          candidateSnippetInstance.mergeField(new Backbone.Model(newAttrBoolSnippetInstance));
          _.each(_.keys(attr), function(fieldname){
            if(typeof candidateSnippetInstance.get("fields")[fieldname] !== "undefined" ||
             fieldname === "id"
          ){
              fieldnameDecorated = fieldname === "id"? "n2id" : fieldname;
              candidateSnippetInstance.setFieldFromJson( fieldnameDecorated, attr[fieldname]);
            }
          })
        }else{
          console.log("CAUSION: there is one or more types not defined");
        }
        that.push(candidateSnippetInstance);
      })
      //this.renderAll();



    }


    , renderAll: function(){

      return this.map(function(snippet){
        return new MyFormSnippetView({model: snippet}).render(true);
      })
    }
    , renderAllClean: function(){
      return this.map(function(snippet){
        return new MyFormSnippetView({model: snippet}).render(false);
      });
    }
  });
});
