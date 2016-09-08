Current version of OpenLayers was taken from 
https://github.com/openlayers/openlayers.git


Version: f4a4090814f240414548e8eda55070d16f3d3901
Tag: release-2.13.1

Patches
-------

The following patch was applied to release-2.13.1. This is to fix an incompatibility with Google
Map API version >= 3.20

Refs:
http://osgeo-org.1560.x6.nabble.com/Openlayers-2-13-1-Google-maps-not-showing-recently-Sep-2015-td5222280.html#a5237389
https://github.com/Indicia-Team/media/commit/730d9b5800c1e2c5376fec3517266799cd472794

diff --git a/nunaliit2-js-external/src/main/js/js-external/OpenLayers/lib/OpenLa
index 067b7a0..f4081ce 100644
--- a/nunaliit2-js-external/src/main/js/js-external/OpenLayers/lib/OpenLayers/La
+++ b/nunaliit2-js-external/src/main/js/js-external/OpenLayers/lib/OpenLayers/La
@@ -147,11 +147,10 @@ OpenLayers.Layer.Google.v3 = {
                             me.setGMapVisibility(me.getVisibility());
                             me.moveTo(me.map.getCenter());
                         });
-                    } else {
-                        map.div.appendChild(container);
-                        cache.googleControl.appendChild(map.viewPortDiv);
-                        google.maps.event.trigger(this.mapObject, 'resize');
                     }
+                    map.div.appendChild(container);
+                    cache.googleControl.appendChild(map.viewPortDiv);
+                    google.maps.event.trigger(this.mapObject, 'resize');
                 }
                 this.mapObject.setMapTypeId(type);                
             } else if (cache.googleControl.hasChildNodes()) {

        
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
