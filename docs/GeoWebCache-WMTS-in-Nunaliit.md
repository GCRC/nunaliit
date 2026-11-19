[[GeoWebCache|https://www.geowebcache.org/]] is an open source Java web application used to cache map tiles coming from a variety of sources such as OGC Web Map Service (WMS). It implements various service interfaces (such as WMS-C, WMTS, TMS, Google Maps KML, Virtual Earth) in order to accelerate and optimize map image delivery. It can also recombine tiles to work with regular WMS clients.

Nunaliit can access a GeoWebCache endpoint using its map overlays (see the "wmts" overlay type in the [[Nunaliit Documentation for Atlas Builders]].)

Setting up a GeoWebCache instance on an Ubuntu 18.04 server is fairly straightforward but takes a few steps to do well.

1. `apt install jetty9`
2. Download and unzip the latest war.zip version of GeoWebCache from their site.
3. Copy the geowebcache.war file to /var/lib/jetty9/webapps then unzip it and remove the .war file.
4. `adduser geowebcache`
5. `mkdir /home/geowebcache/cache && chown jetty: /home/geowebcache/cache`

**To be continued (sorry! Dinner time!)**