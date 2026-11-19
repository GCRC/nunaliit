# About Atlascine
Atlascine builds off of previous versions of a similar platform, aiming to streamline the full process of transforming digital text (e.g. transcript of audiovisual material) to a digital map and to enable the full interaction between these texts, the audio/video files from which they are derived, and the maps. With this version of the platform it is hoped that researchers across disciplines can use the digital map not only as a way to visually synthesize large volumes of "story data" and to identify new patterns and structures in these stories, but also to use the map to navigate within the stories, to find specific information and similarities between stories and between places.
## Details for Atlascine builder
### Obtaining and Installing Nunaliit Atlascine branch
Atlascine is running off of branch ("branch-for-atlascine"). To obtain and install this branch to your local environment, run the command below:
```
git clone https://github.com/GCRC/nunaliit.git
git checkout branch-for-atlascine
mvn -T4 clean install
```
Make sure you have all the prerequisites installed before starting your atlas. 
Please consult the [[Installation]] page for installing prerequisites.

## Details for Atlascine programmer
- [Facilities for Atlascine](#facilities-for-atlascine)
- [Customized Rendering Style (Donut) for Atlascine](#customized-rendering-style-donut-for-atlascine)
- [Point Aggregator (N2StackingHistory)](#point-aggregator-n2stackinghistory)
### Facilities for Atlascine
[[images/atlascine/atlascine_facility_relation.png|]]

- [Utilities](#utilities)
  * [cinemaSelectionRedirector](#cinemaselectionredirector)
  * [tagUtility](#tagutility)
  * [placeUtility](#placeutility)
- [Models](#models)
  * [couchDb (atlascine2_places)](#couchdb-atlascine2_places)
  * [couchDb (atlascine2_cinemaps)](#couchdb-atlascine2_cinemaps)
  * [cineMapFilter](#cinemapfilter)
  * [cineTimeIndexTransform](#cinetimeindextransform)
  * [cineData2DonutTransform](#cinedata2donuttransform)
- [Widgets](#widgets)
  * [singleFilterSelectionWidget](#singlefilterselectionwidget)
  * [transcriptWidget](#transcriptwidget)
  * [annotationEditorWidget](#annotationeditorwidget)

#### Utilities

##### cinemaSelectionRedirector

(ATLAS_FOLDER/htdocs/js/redirector.js)

This utility changes the behaviour that happens when a atlascine geometry is clicked/hovered on a map canvas. 

An example of the configuration for this utility is shown here:

```
{
	"utilityType" : "cinemaSelectionRedirector"
}
```

##### tagUtility

(ATLAS_FOLDER/htdocs/nunaliit_custom.js)

This utility facilitates the tag profile retriving and sentence coloring, based on the cinemap document.

An example of the configuration for this utility is shown here:

```
{
    "utilityType" :  "tagUtility",
    "name" : "tagUtility",
    "sourceModelId" : "cineMapFilter"
}
```

##### placeUtility

(ATLAS_FOLDER/htdocs/nunaliit_custom.js)

This utility returns the placename:placeDocId dictionary, which is computed based on atlascine2_place documents.

An example of the configuration for this utility is shown here:

```
{
	"utilityType" : "placeUtility",
	"name" : "placeUtility",
	"logging" : false,
	"sourceModelId" : "atlascine2_places"
}
```

#### Models

##### couchDb (atlascine2_places)

[Jump to n2.couchDbPerspective.js](https://github.com/GCRC/nunaliit/blob/9ddd950bae022a9349fdb6e4cd902d24e3437287/nunaliit2-js/src/main/js/nunaliit2/n2.couchDbPerspective.js#L233)

An couchDb type model that selects on schema:atlascine2_place

An example of the configuration for this model is shown here:

```
{         
        "modelId": "atlascine2_places",
	"modelType": "couchDb",
	"selectors":[
		{
			"type" : "couchDbSchema",
			"name" : "",
			"options" : {
						"schemaName" : "atlascine2_place"
			}
		}
	] }

```

##### couchDb (atlascine2_cinemaps)

[Jump to n2.couchDbPerspective.js](https://github.com/GCRC/nunaliit/blob/9ddd950bae022a9349fdb6e4cd902d24e3437287/nunaliit2-js/src/main/js/nunaliit2/n2.couchDbPerspective.js#L233)

An couchDb type model selects on schema:atlascine2_cinemaps

An example of the configuration for this model is shown here:

```
{         
        "modelId": "atlascine2_cinemaps",
	"modelType": "couchDb",
	"selectors":[
		{
			"type" : "couchDbSchema",
			"name" : "",
			"options" : {
						"schemaName" : "atlascine2_cinemap"
			}
		}
	] }

```

##### cineMapFilter

(ATLAS_FOLDER/htdocs/nunaliit_custom.js)

A subclass of the SelectableDocumentFilter, which connects to the  singleFilterSelectionWidget and outputs the user selected cinemap.

An example of the configuration for this model is shown here:

```
{
            "modelId": "cineMapFilter",	  
            "modelType": "cineMapFilter",
	    
	    "initialSelection": [
		 			"stock.cinemap.anita3"
	    ],
	    "saveSelection": true,
	    "sourceModelId": "atlascine2_cinemaps"
}
```

##### cineTimeIndexTransform

(ATLAS_FOLDER/htdocs/nunaliit_custom.js)

This is a document transform. This means that it is a document model that generates virtual documents visible to downstream models, widgets and canvas. It is a subclass of the TimeIntervalModel, which computes effective cineData(s) based on current timeInterval and existing placeDoc.

An example of the configuration for this model is shown here:

```
{
	"modelId": "time",
	"cinemapModelId": "cineMapFilter",
	"modelType": "cineTimeIndexTransform",
	"sourceModelId": "couchDb",
	
}
```
##### cineData2DonutTransform

(ATLAS_FOLDER/htdocs/nunaliit_custom.js)

This is a document transform. This means that it is a document model that generates virtual documents visible to downstream models, widgets and canvas. This transform calculates the populated place point opacity and radius based on upstream cineData.

An example of the configuration for this model is shown here:


```
{
	"modelId": "donut",
	"modelType": "cineData2DonutTransform",
	"sourceModelId": "time",
	"modelType": "cineData2DonutTransform",
	"sourceModelId": "time"
}
```

#### Widgets

##### singleFilterSelectionWidget

[Jump to n2.widgetSelectableFilter.js](https://github.com/GCRC/nunaliit/blob/319d793b4846abd8f70b4327460b277bc247af43/nunaliit2-js/src/main/js/nunaliit2/n2.widgetSelectableFilter.js#L45)

This is the singleFilterSelectionWidget that connects to the cineMapFilter model

An example of the configuration for this widget is shown here:

```
{
	"containerClass": "nunaliit_module_title",
	"suppressAllChoices": true,
	"suppressNoChoice": true,
	"sourceModelId": "cineMapFilter",
	"widgetType": "singleFilterSelectionWidget"

}
```

##### transcriptWidget

[Jump to n2.widgetTranscript.js](https://github.com/GCRC/nunaliit/blob/9ddd950bae022a9349fdb6e4cd902d24e3437287/nunaliit2-js/src/main/js/nunaliit2/n2.widgetTranscript.js#L63)

This is the widget that renders the video and transcript panel. This widget listens on the interval parameter of sourceModel and sends the timeInterval updates whenever users clicking on the sentence or clicking and dragging the playback cursor.

An example of the configuration for this widget is shown here:

```
{
	"containerClass": "n2_content_text",
	"name": "trans1",
	"sourceModelId": "time",
	"widgetType": "transcriptWidget"

}
```

##### annotationEditorWidget

[Jump to n2.widgetAnnotationEditor.js](https://github.com/GCRC/nunaliit/blob/9ddd950bae022a9349fdb6e4cd902d24e3437287/nunaliit2-js/src/main/js/nunaliit2/n2.widgetAnnotationEditor.js#L1294)

This is the widget that renders the annotation editor in leftside drawer. This widget renders the annotationEditorView in response to "annotationEditorStart" event.

An example of the configuration for this widget is shown here:

```
{
	"containerId": "content",
	"sourceModelId": "cineMapFilter",
	"widgetType": "annotationEditorWidget"
}
```
### Customized Rendering Style (Donut) for Atlascine

The atlascine style is build off the conditional map styling system in nunaliit. 

In classic conditional map styling, a number of rules are defined. Each rule is made of a condition and a set of named basic rendering styles. The basic rendering style has a number of basic rendering styles. Each of those styles is made of a set of attributes (key-value pairs). In comparison, the customized rendering style (v2_style), is made of a style class name and style instance configuration.

The following is an example of v2_style rendering style:

```
{
	"condition": "hasProperty('doc._ldata')",
	"normal":{
		"v2_style": true,
		"n2es6.n2mapModule.N2CustomPointStyle": {
			"donutScaleFactor": "=doc._ldata.scaleFactor",
			"color": "=doc._ldata.style.fillColor",
			"data": "=doc._ldata",
			"startupOffset": 5,
			"text": "",
			"type": "treeRingB",
			"opacity": 0.8,
			"stroke": "#ffffff"
		}
	}
}
```
### Point Aggregator (N2StackingHistory)

[Jump to N2StackingHistory.js](https://github.com/GCRC/nunaliit/blob/9ddd950bae022a9349fdb6e4cd902d24e3437287/nunaliit2-js/src/main/nunaliit-es6/src/n2es6/n2mapModule/N2StackingHistory.js#L6)

The StackingHistory class is created to retain the "stacking" history of previous donuts at the very same geographical point. 

Every geometry point applies the N2CustomPointStyle will be automatically memorized and stacked accordingly. For instance, two geometry points located at the same geographical (lon-lat) position will be stacked as a donut with two rings.

Because the styling system is extremely tight with the openlayer's rendering system, thus highly time-sensitive, the N2StackingHistory is statically registered to the N2CustomPointStyle class.