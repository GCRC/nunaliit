Current version of OpenLayers was taken from 
https://github.com/openlayers/openlayers.git


Version: febf048d9dbd234d849f480567b922300e837d53
Tag: release-2.12-rc1

Patch:

diff --git a/lib/OpenLayers/SingleFile.js b/lib/OpenLayers/SingleFile.js
index 234c9c0..ae34ef9 100644
--- a/lib/OpenLayers/SingleFile.js
+++ b/lib/OpenLayers/SingleFile.js
@@ -25,7 +25,7 @@ var OpenLayers = {
      * {String} Path to this script
      */
     _getScriptLocation: (function() {
-        var r = new RegExp("(^|(.*?\\/))(OpenLayers.*?\\.js)(\\?|$)"),
+        var r = new RegExp("(^|(.*?\\/))(OpenLayers[^\\/]*?\\.js)(\\?|$)"),
             s = document.getElementsByTagName('script'),
             src, m, l = "";
         for(var i=0, len=s.length; i<len; i++) {
diff --git a/lib/OpenLayers/Util.js b/lib/OpenLayers/Util.js
index f106da5..d0818d0 100644
--- a/lib/OpenLayers/Util.js
+++ b/lib/OpenLayers/Util.js
@@ -1523,6 +1523,7 @@ OpenLayers.Util.getRenderedDimensions = function(contentHT
     // create temp container div with restricted size
     var container = document.createElement("div");
     container.style.visibility = "hidden";
+    container.style.position = "absolute";
         
     var containerElement = (options && options.containerElement) 
        ? options.containerElement : document.body;

        
Upgrading OpenLayers
--------------------

To upgrade OpenLayers, a new version must be fetched from the github repository.
Then, the appropriate files must copied over to the Subversion repository. Finally,
a new version of minimized OpenLayers.js must be generated using the following
procedure:

> cd .../OpenLayers/build
> ./build.py
> rm ../OpenLayers.js
> mv OpenLayers.js ../.