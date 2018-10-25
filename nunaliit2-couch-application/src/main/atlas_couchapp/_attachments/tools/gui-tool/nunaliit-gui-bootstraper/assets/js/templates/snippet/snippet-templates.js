define(function(require) {

    var formname               = require('text!templates/snippet/formname.html')
    , n2attributeboolean = require('text!templates/snippet/n2attributeboolean.json')
    , n2attributedefault = require('text!templates/snippet/n2attributedefault.json')
    , n2attributedefaulthtml = require('text!templates/snippet/n2attributedefault.html')
    , n2mandatory               = require('text!templates/snippet/n2schemamandatory.json')
    , n2mandatoryhtml        = require('text!templates/snippet/n2schemamandatory.html')
    , n2attributetitle = require('text!templates/snippet/n2attributetitle.json')
    , n2attributestring = require('text!templates/snippet/n2attributestring.json')
    , n2attributetitlehtml = require('text!templates/snippet/n2attributetitle.html')
    , n2attributestringhtml = require('text!templates/snippet/n2attributestring.html')
    , n2attributeselection = require('text!templates/snippet/n2attributeselection.json')
    , n2attributeselectionhtml = require('text!templates/snippet/n2attributeselection.html')
    , n2attributereference = require('text!templates/snippet/n2attributereference.json')
    , n2attributereferencehtml = require('text!templates/snippet/n2attributereference.html')
    , n2attributecheckbox = require('text!templates/snippet/n2attributecheckbox.json')
    , n2attributecheckboxhtml = require('text!templates/snippet/n2attributecheckbox.html')
    , n2attributecheckboxgroup = require('text!templates/snippet/n2attributecheckboxgroup.json')
    , n2attributecheckboxgrouphtml = require('text!templates/snippet/n2attributecheckboxgroup.html')
    , n2attributearray = require('text!templates/snippet/n2attributearray.json')
    , n2attributearrayhtml = require('text!templates/snippet/n2attributearray.html')
    , n2attributegeometry = require('text!templates/snippet/n2attributegeometry.json')
    , n2attributecreatedby = require('text!templates/snippet/n2attributecreatedby.json')
    , n2attributecreatedtime = require('text!templates/snippet/n2attributecreatedtime.json')
    , n2attributehoversound = require('text!templates/snippet/n2attributehoversound.json')
  return {
      formname                   : formname
      , n2attributedefault : n2attributedefault
      , n2attributedefaulthtml: n2attributedefaulthtml
      , n2schemainfo        : n2mandatory
      , n2schemainfohtml    : n2mandatoryhtml
      , n2attributetitlehtml  : n2attributetitlehtml
      , n2attributetitle  : n2attributetitle+ n2attributeboolean
      , n2attributestring : n2attributestring + n2attributeboolean
      , n2attributestringhtml : n2attributestringhtml
      , n2attributeselection : n2attributeselection+ n2attributeboolean
      , n2attributeselectionhtml : n2attributeselectionhtml
      , n2attributereference : n2attributereference+ n2attributeboolean
      , n2attributereferencehtml : n2attributereferencehtml
      , n2attributecheckbox   : n2attributecheckbox+ n2attributeboolean
      , n2attributecheckboxhtml : n2attributecheckboxhtml
      , n2attributecheckboxgroup : n2attributecheckboxgroup+ n2attributeboolean
      , n2attributecheckboxgrouphtml : n2attributecheckboxgrouphtml
      , n2attributearray : n2attributearray+ n2attributeboolean
      , n2attributearrayhtml : n2attributearrayhtml
      , n2attributegeometry : n2attributegeometry + n2attributeboolean
      , n2attributecreatedby : n2attributecreatedby + n2attributeboolean
      , n2attributecreatedtime : n2attributecreatedtime + n2attributeboolean
      , n2attributehoversound : n2attributehoversound + n2attributeboolean

  }
});
