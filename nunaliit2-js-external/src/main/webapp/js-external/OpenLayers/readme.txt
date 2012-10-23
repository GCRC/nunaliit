Current version of OpenLayers was taken from 
https://github.com/openlayers/openlayers.git


Version: 0412410be0ec43dc9a5c258b640a793fad41bd88
Tag: release-2.12


        
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