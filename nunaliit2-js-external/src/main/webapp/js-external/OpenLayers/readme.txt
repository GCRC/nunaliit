Current version of OpenLayers was taken from 
https://github.com/openlayers/openlayers.git


Version: f4a4090814f240414548e8eda55070d16f3d3901
Tag: release-2.13.1


        
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
