require.config({
  baseUrl: "gui-tool/nunaliit-gui-bootstraper/assets/js/lib/"
  , shim: {
    'backbone': {
      deps: ['underscore', 'jquery'],
      exports: 'Backbone'
    },
    'underscore': {
      exports: '_'
    },
    'bootstrap': {
      deps: ['jquery'],
      exports: '$.fn.popover'
    }
    ,'bootstrap-waitingfor':{
        deps: ['jquery','bootstrap'],
        exports: 'Waitingfor'
    },
    'jquery.couch': {
	  deps: ['jquery'],
	  exports: '$.couch'
      }
  }
  , paths: {
    app         : ".."
    , collections : "../collections"
    , data        : "../data"
    , models      : "../models"
    , helper      : "../helper"
    , templates   : "../templates"
    , views       : "../views"
  }
});
require([ 'app/app'], function(app){
  app.initialize();
});
