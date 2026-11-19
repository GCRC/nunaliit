# Map Canvas Documentation
A module canvas object with a `canvasType` attribute with value `map` is similar to the original module `map` object; however, this new implementation is based on a more recent OpenLayers library (version 10.5 as of this writing - see the dependencies.ol attribute in https://github.com/GCRC/nunaliit/blob/master/nunaliit2-js/src/main/nunaliit-es6/package.json). These newer versions of OpenLayers were heavily refactored to make the most of ECMAScript 6 and modern JavaScript best practices.

This new Nunaliit canvas provides a lot of functionality not available in the old OpenLayers 2-based map and is in use in production atlases but may lack support for some Nunaliit map integrations. It is still in active development. Please open an issue if you find bugs or are missing capabilities from the older OpenLayers 2-based map.

## Example complex configuration
canvas.json contents:
```json
{
	"canvasType": "map",
	"canvasName": "mymap",
	"backgrounds": [
		{
			"name": "Open Street Map",
			"type": "osm",
			"options": {
				"url": "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
			}
		},
		{
			"type": "google",
			"name": "Google Satellite",
			"options": {
				"mapType": "satellite",
				"imageFormat": "jpeg"
			}
		},
		{
			"id": "bmng",
			"name": "BMNG",
			"type": "xyz",
			"options": {
				"url": "/bmng3413tiles/{z}/{x}/{y}.png",
				"projection": "EPSG:3413",
				"tileGrid": {
					"extent": [
						-12324304.8832362052,
						-12330366.6146071944,
						12324267.1598586943,
						12330389.1859431472
					],
					"origin": [
						-12324304.8832362052,
						12330389.1859431472
					],
					"resolutions": [
						141774.632208780415,
						70887.3161043902073,
						35443.6580521951037,
						17721.8290260975518,
						8860.91451304877592,
						4430.45725652438796,
						2215.22862826219398,
						1107.61431413109699,
						553.807157065548495,
						276.903578532774247,
						138.451789266387124
					],
					"tileSize": [
						256,
						256
					]
				}
			}
		}
	],
	"coordinates": {
		"initialBounds": [
			-12324304.8832362052,
			-12330366.6146071944,
			12324267.1598586943,
			12330389.1859431472
		],
		"autoInitialBounds": false
	},
	"rotationControl": {
		"autoRotateCurrentPosition": true
	},
	"defaultProjectionCode": "EPSG:3413",
	"projDefs": [
		{
			"code": "EPSG:3572",
			"definition": "+proj=laea +lat_0=90 +lon_0=-150 +x_0=0 +y_0=0 +ellps=WGS84 +datum=WGS84 +units=m +no_defs",
			"extent": [
				-9000000,
				-9000000,
				9000000,
				9000000
			]
		},
		{
			"code": "EPSG:3413",
			"definition": "+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs",
			"extent": [
				-12324304.8832362052,
				-12330366.6146071944,
				12324267.1598586943,
				12330389.1859431472
			]
		}
	],
	"layerSwipe": true,
	"wmsGetFeatureInfo": true,
	"overlays": [
		{
			"id": "projections",
			"name": {
				"nunaliit_type": "localized",
				"en": "Docs"
			},
			"type": "model",
			"options": {
				"sourceModelId": "docsForMap"
			},
			"featurePopupDelayMs": 0,
			"useHoverSound": true
		},
		{
			"id": "overlay1",
			"name": "Overlay 1",
			"type": "wms",
			"visibility": true,
			"swipe": "left",
			"options": {
				"layers": "layername1",
				"url": "https://mycustomwmsserver/geoserver/wms?",
				"wmsLegend": true
			}
		},
		{
			"id": "overlay2",
			"name": "Overlay 2",
			"type": "wms",
			"visibility": true,
			"swipe": "right",
			"options": {
				"layers": "layername2",
				"url": "https://mycustomwmsserver/geoserver/wms?",
				"wmsLegend": true
			}
		},
		{
			"id": "overlay3",
			"name": "Overlay 3",
			"type": "wms",
			"visibility": false,
			"swipe": "right",
			"options": {
				"layers": "layername3",
				"url": "https://eloka.nsidcrg/geoserver/wms?",
				"wmsLegend": true
			}
		}
	],
	"styles": [
		{
			"condition": "true",
			"normal": {
				"stroke-width": 0.7,
				"stroke": "#000066",
				"fill": "#A9A9A9",
				"fill-opacity": 1,
				"r": 4
			},
			"selected": {
				"stroke-width": 4,
				"stroke": "#00FFFF",
				"r": 6
			},
			"hovered": {
				"stroke-width": 3,
				"stroke": "#0000ff",
				"fill": "#CCBB44",
				"r": 6
			},
			"found": {
				"stroke-width": 4,
				"stroke": "#FF9999",
				"fill": "#9999FF"
			}
		},
		{
			"condition": "isSchema('myschema')",
			"label": {
				"nunaliit_type": "localized",
				"en": "Community"
			},
			"normal": {
				"fill": "#FFFF00",
				"stroke": "#000000",
				"fill-opacity": 0.9,
				"stroke-width": 1
			},
			"selected": {
				"fill": "#fc0303",
				"stroke": "#000000",
				"fill-opacity": 0.9,
				"stroke-width": 1
			},
			"hovered": {
				"stroke-width": 1,
				"stroke": "#000000",
				"fill": "#FFFF00",
				"r": 6
			}
		},
		{
			"condition": "isSchema('schema2')",
			"label": {
				"nunaliit_type": "localized",
				"en": "Community"
			},
			"normal": {
				"fill": "#8B0000",
				"stroke": "#000066",
				"fill-opacity": 0.9,
				"stroke-width": 1,
				"graphicName": "square"
			},
			"selected": {
				"fill": "#fc0303",
				"stroke-width": 2
			},
			"hovered": {
				"stroke-width": 2,
				"stroke": "#000066",
				"fill": "#FFFF00",
				"r": 6
			}
		},
		{
			"condition": "cluster.length > 1",
			"label": "Cluster",
			"normal": {
				"fill": "blue",
				"stroke": "#FFFFFF",
				"stroke-width": 2,
				"graphicName": "circle",
				"r": 10,
				"fontColor": "#ffffff",
				"fontFamily": "Courier New, monospace",
				"fontSize": "14px",
				"fontWeight": "bold",
				"label": "=cluster.length",
				"labelAlign": "cm",
				"labelOutlineColor": "#000000",
				"labelOutlineWidth": 3,
				"labelXOffset": "0",
				"labelYOffset": "0"
			}
		}
	],
	"addPointsOnly": false,
	"toggleClick": true,
	"layerSelector": {
		"suppress": false,
		"initiallyOpened": true
	}
}
```

## Required configuration
### canvasType
`"canvasType": "map"`  
Selects this canvas

### canvasName
`"canvasName": "<string>"`  
Name of this canvas for widgets and anything else to register against

### coordinates 
```json
"coordinates": {
    "initialBounds": [
      <minX>,
      <minY>,
      <maxX>,
      <maxY>
    ],
    "autoInitialBounds": <boolean>
}
```
Initial coordinates to fit into the map view when the module loads. If no bounds are provided the map will load, but will not be in a useful location. `autoInitialBounds` can be set to `true` or `false` but currently isn't working, see issue https://github.com/GCRC/nunaliit/issues/1082. The array values
must be number type, strings will not reliably work.

### backgrounds
`"backgrounds": [<array of background configs>]`  
Every map should have at least on background layer. Each background config has fields name, type and options.  
```json
"backgrounds": [
    {
      "name": "<string>",
      "type": "<string>",
      "options": <options>
    }
]
```
* name: Label for this background layer
* type: One of `"bing"`, `"wms"`, `"wmts"`, `"osm"`,`"stadia"`, `"xyz"`, `"google"`.
* options: Object with keys and values to configure the specific background. Options for each background type:

#### bing
Provide options with keys:
* `"key": "<string>": Bing API key from Bing service
* `"imagerySet": <string>`: Imagery set to use, see Bing documentation (https://docs.microsoft.com/en-us/bingmaps/rest-services/imagery/get-imagery-metadata)
* All options are passed through to the OpenLayers BingMaps source (https://openlayers.org/en/latest/apidoc/module-ol_source_BingMaps-BingMaps.html)

#### osm
Provide options with keys:
* `"url": <string>`: URL template to use. See https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames for details on URL structure. An example URL that will work is `"https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png"`

#### stadia
Stadia backgrounds require the use of an **account** in order to set up domain authentication or an API key. It is recommended that **domain-based authentication** is used.  
Provide options with keys:
* `"layerName": "<string>"`: One of `alidade_smooth`, `alidade_smooth_dark`, `outdoors`, `stamen_toner`, `stamen_terrain`, `stamen_watercolor`, or `osm_bright`. See https://docs.stadiamaps.com/themes/ for (free) themes

#### wms
Provide options with keys:
* `"url": "<string>"`: WMS url
* `"layers": "<string>"`: WMS layer
* `"srs": "<string>"`: Source reference system projection (e.x. "EPSG:3338")
* `"styles": "<string>"`: (optional) WMS styles
* `"wmsLegend": "<boolean>"`: (optional) defaults to false. If true a legend will be fetched and displayed in the legend widget.
* `"WIDTH": "<string>"`: (optional) WMS width parameter.
* `"HEIGHT": "<string>"`: (optional) WMS height parameter.
* `"VERSION": "<string>"`: (optional) WMS version parameter.
* `"BBOX": "<bbox>"`: (optional) WMS bbox parameter.
* `"CRS": "<string>"`: (optional) WMS CRS (coordinate reference system) parameter.
* `"bgcolor": "<integer>": (optional) Background color parameter (e.x. -9999).
* `"attributions": <array of strings OR string>`: (optional) String which can include HTML of the attribution to show for this option. Can be an array of multiple strings for multiple attributions.

#### wmst
Provide options with keys:
* `"url": "<string>"`: The URL of the WMTS server
* `"layer": "<string>"`: A string containing the layer name, to be assembled by the WMTS server.
* `"style": "<string>"`: A string containing the style name, to apply style to each named layer.
* `"requestEncoding": "<string>"`: Sets the encoding (REST|KVP) of the tile requests.
* `"numZoomLevels": "<integer>"`: Sets the number of zoom levels associated with the service.
* `"matrixSet": "<string>"`: Sets the matrixSet/projection name associated with the layer.
* `"srsName": "<string>"`: (optional) Sets the projection associated with the layer.
* `"layername": "<string>"`: (optional) Sets the layername associated with the layer.
* `"opacity": "<string>"`: (optional) Sets the opacity associated with the layer.
* `"isBaseLayer": "<boolean>"`: (optional) `true` or `false`.
* `"attributions": <array of strings OR string>`: (optional) String which can include HTML of the attribution to show for this option. Can be an array of multiple strings for multiple attributions.

#### xyz
XYZ background layer. Provide options with keys:
* `"url": "<string>"`: URL template string for the XYZ provider. Example `https://myserver/xyztiles/{z}/{x}/{y}.png`.
* `"projection": "<string>"`: (optional) Projection SRS identifier string. Exmaple `"EPSG:4326"` or `"EPSG:3413"`.
* `"tileGrid": "<object>"`: (optional) Define properties of the tileGrid. Valid keys are
  * `"extent": "<array of 4 numbers>"`: (optional) grid extent.
  * `"origin": "<array of 2 numbers>"`: (optional) grid origin.
  * `"resolutions": "<array of numbers>"`: (optional) grid resolutions.
  * `"tileSize": "<array of 2 numbers>"`: (optional) tile size

#### google
Google Maps background layer. The Google API key should be set in the atlas template.

* `"mapType": "<string>"`: Defaults to "roadmap", see https://developers.google.com/maps/documentation/tile/session_tokens#required_fields
* `"language": "<string>"`: Defaults to "en-US", see https://developers.google.com/maps/documentation/tile/session_tokens#required_fields
* `"region": "<string>"`: Defaults to "US", see https://developers.google.com/maps/documentation/tile/session_tokens#required_fields
* `"imageFormat": "<string>"`: Optional, but preferable - "jpeg" or "png"
* `"scale": "<string>"`: Optional, scale size of map elements such as labels - "scaleFactor1x", "scaleFactor2x", "scaleFactor4x"
* `"highDpi": "<boolean>"`: Defaults to false
* `"layerTypes": "<Array of strings>"`: Optional - "layerRoadmap", "layerStreetView", "layerTraffic"

For all options, the options follow the Google options for OpenLayers as of Version 10.5 (https://openlayers.org/en/latest/apidoc//module-ol_source_Google-Google.html)

```json
{
	"type": "google",
	"name": "Google Satellite",
	"options": {
		"mapType": "satellite",
		"imageFormat": "jpeg"
	}
}
```

#### mvt
MVT (Mapbox Vector Tiles) background layer. Configuration follows https://openlayers.org/en/latest/apidoc/module-ol_source_VectorTile-VectorTile.html

* `"url": "<string>"`: Required.
* `"projection": "<string>"`: Optional, projection SRS identifier string.
* `"maxZoom": "<number>"`: Optional, defaults to 22.

```json
{
    "type": "mvt",
    "name": "Quebec",
    "options": {
        "maxZoom": 8,
        "url": "http://localhost:9999/quebec/{z}/{x}/{y}.pbf"
    }
}
```

### Overlays
Overlays to show on the map. Each entry in the overlay array has configuration for that overlay.
```json
"overlays": [
    {
      "name": "2070's - RCP8.5 (in.)",
      "type": "wms",
      "visibility": false,
      "swipe": "right",
      "options": {}
	}  
]
```
* `"name": "<string>"`: Name of the layer
type : String that specifies the type of overlay. Possible values are: "couchdb", "model" and "wms".
options : Object defining parameters. Based on the type of overlay.
clustering : (optional) `true` or `false
swipe: (optional) `left` or `right`. Defaults to showing on both sides. Requires that `layerSwipe` is `true`.
visibility: (optional) if `true` the layer is visible by default, if `false` it is hidden by default.

#### couchdb
Gets features from couchdb query. Options:
* `"layerName": <string>`: String that specifies the layer identifier. 

#### model
Fetch features to display from a model (https://github.com/GCRC/nunaliit/wiki/Nunaliit-Documentation-for-Atlas-Builders#atlas_model). Options:
* `"sourceModelId": <string>`: The model ID to get features from.

#### wms
Same options as for WMS background, see: https://github.com/GCRC/nunaliit/wiki/OpenLayers-6-Canvas#wms

### styles
See the conditional map styling documentation  at https://github.com/GCRC/nunaliit/wiki/Nunaliit-Documentation-for-Atlas-Builders#conditional-map-styling
  
Icons have a slightly different configuration in the OpenLayers 6 canvas.
* `"iconSrc": "cat.jpg"`: Path to an image file.
* `"scale": [0.3, 0.3]`: Array of two values that must be between 0 and 1 that specify scaling of width and height.
* `"iconColor": "#13E42F"`: Optional hex color for the icon.


### Optional configuration
Configuration that can be provided but has defaults.
* `"layerSwipe": <boolean>`: Defaults to false. When set to true the map will have a slider in the middle that can be moved left and right to show layers based on their config. Overlay layers will be displayed on the right, left or both depending on the `swipe` config. Valid options are:
  * `"swipe": "right"`: Overlay displayed on the right side of the slider.
  * `"swipe": "left"`: Overlay displayed on the left side of the slider.
  * `swipe` config set to any other value or left out: Overlay displayed on both sides of the slider.
* `"wmsGetFeatureInfo": <boolean>`: `true` or `false`, defaults to false. If true then clicking on the WMS overlays will request feature info from the WMS service and display the value in a popup dialog.
* `"couchDbSourceTitle": <string>`: Title to use for the couchDb layer in the layer chooser`
* `"defaultProjectionCode": <string>`: Starting projection for the map such as `"EPSG:4326"` or `"EPSG:3413"`. Defaults to `"EPSG:3857"`. Defines 
the view projection, sources will be reprojected into this projection for display.
* `"projDefs": <array of objects>`: Definitions for projections used in the canvas (for instance by the defaultProjectionCode). Each object
can have the following properties:
  * `"code": <string>`: Projection code for this definition entry. Examples:`"EPSG:4326"` or `"EPSG:3413"`.
  * `"definition": <string>`: Projection definition string in Proj4 format. For example `"+proj=stere +lat_0=90 +lon_0=-150 +k=0.994 +x_0=2000000 +y_0=2000000 +datum=WGS84 +units=m +no_defs +type=crs"`
  * `"extent": <array of 4 numbers>`: Extent for the projection as numbers in the order `<minx>, <miny>, <maxx>, <maxy>` for example: `[-180, -90, 180, 90]`.
* `"rotationControl": <boolean OR object>`: If a true value will add buttons to the interface to rotate the map. In addition you can provide an object with options:
  * `"autoRotateCurrentPosition": <boolean>`: `true` or `false`, defaults to false. If true the map will automatically rotate for the users location. Only makes sense for a polar projection map.