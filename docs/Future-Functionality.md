This page describes some potential upcoming features in Nunaliit.  Please keep in mind that these features are under active development and iteration, and may evolve before they are integrated into a release.

- [Atlas Document](#atlas-document)
  * [Navigation](#navigation)
  * [Default Module](#default-module)
  * [Metadata](#metadata)
  * [sitemap.xml](#sitemapxml)
  * [robots.txt](#robotstxt)
- [Atlas and Module Metadata](#atlas-and-module-metadata)
- [Upgrade Notes](#upgrade-notes)
  * [Migrate Navigation](#migrate-navigation)
  * [Migrate Default Module](#migrate-default-module)
  * [Add Metadata](#add-metadata)

# Atlas Document
* Introduces a new document to Nunaliit atlases.  This document has a fixed identifier of `atlas`.
* Resides under `/docs/atlas/`, and should be named `nunaliit_atlas.json`. The contents of the `/docs/atlas` folder are:
```
atlas
├── _id.txt
├── nunaliit_atlas.json
└── nunaliit_schema.txt
```
* The atlas document contains a title, navigation, atlas-specific languages and metadata.  For example:
```
{
  "nunaliit_type": "atlas",
  "title": "Atlas Title",
  "nunaliit_navigation": {
    "nunaliit_type": "navigation",
    "title": {
      "nunaliit_type": "localized",
      "en": "Atlas",
      "fr": "L'Atlas"
    },
    "items": [
      {
        "title": {
          "nunaliit_type": "localized",
          "en": "Demo Module",
          "fr": "Module de Demo"
        },
        "module": "module.demo",
        "items": [
          {
            "module": "module.demo"
          }
        ]
      },
      {
        "title": {
          "nunaliit_type": "localized",
          "en": "Tools",
          "fr": "Outils"
        },
        "href": "./tools/index.html"
      }
    ]
  },
  "nunaliit_languages": [
    {
      "name": "Brazilian Portuguese",
      "code": "pt-BR",
      "default": true
    },
    {
      "name": "Portuguese",
      "code": "pt-PT"
    },
    {
      "name": "Esperanto",
      "code": "eo"
    }
  ],
  "default_module": "module.demo",
  "nunaliit_metadata": {
    "license": "https://www.apache.org/licenses/LICENSE-2.0.html",
    "creator": {
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Office",
        "telephone": "+1-111-111-1111",
        "email": "info@example.com"
      },
      "@type": "Organization",
      "name": "Example.com",
      "url": "https://example.com/"
    },
    "dateCreated": "2020-01-31",
    "keywords": [
    ],
    "temporalCoverage": "2018-01/..",
    "@type": "Dataset",
    "name": "An Atlas Example",
    "description": "A description of the atlas, should be minimum of 50 characters to meet the Schema.org specification.",
    "spatialCoverage": {
      "geo": {
        "@type": "GeoShape",
        "box": "-75.1,45.1 -75.2,45.2"
      },
      "@type": "Place"
    },
    "@context": {
      "@vocab": "http://schema.org"
    },
    "url": "https://example.com/atlas"
  }
}
```

The immediate intents of using this new atlas document are:
1. A single document for atlas-wide settings;
1. Store the atlas navigation configuration, under `nunaliit_navigation`;
1. Specify the default module to load, via `default_module`;
1. Store atlas metadata (e.g., Schema.org), for dataset discovery and any other motivations to share atlas metadata. Metadata goes under `nunaliit_metadata`;

## Navigation

Within the `atlas` document is a new location to store atlas navigation.  Navigation configuration is found under `nunaliit_atlas/nunaliit_navigation`, and follows the same format as existing navigation documents.

A future release will remove support for specifying the navigation document in `nunaliit_custom.js`.

## Default Module

The default module should now be configured in the `atlas` document.  This setting is under `default_module` and  refers to the module document identifier.

A future release will remove support for specifying the default module in `nunaliit_custom.js`.

## Metadata

Also in the `atlas` document is a structure to store metadata, under `nunaliit_atlas/nunaliit_metadata`. See below for more information on metadata support.

## sitemap.xml

Nunaliit now provides a servlet mapping to `<scheme>://<atlas-url>:<optional-port>/sitemap.xml`. The sitemap is built using the `nunaliit_navigation` items in the `atlas` document.  The contents of `sitemap.xml` cannot be overwritten by an atlas builder.

## robots.txt

Nunaliit now provides a servlet mapping to `<scheme>://<atlas-url>:<optional-port>/robots.txt`.  The default response is simply:

```
Sitemap: <scheme>://<atlas-url>:<optional-port>/sitemap.xml
```

An atlas builder can customize the robots.txt that is served to web crawlers.  Simply add a `robots.txt` file to the root of `htdocs`, add any custom configuration and run `nunaliit update`.  Remember that the servlet automatically adds a path to the sitemap, so this should not be included in the custom `robots.txt` file.  The robots.txt specification is documented here:  https://developers.google.com/search/reference/robots_txt

# Atlas and Module Metadata

The new `atlas` and existing module documents now support additional descriptors in the form of `nunaliit_metadata`.  Nunaliit will automatically insert this metadata in Schema.org compliant format when either the root atlas URL is requested, or when a specific module URL is requested.  This allows crawlers such as Google Dataset Search to located and describe datasets.

# Upgrade Notes

The functionality described above can be upgrade into an existing atlas without any additional effort.  When the atlas builder is ready, the following changes should be made post `upgrade` and `update`.  As always, run a `nunaliit upgrade --test` to verify what changes will happen.

## Migrate Navigation

* Move the contents of `nunaliit_navigation` from the current navigation document into the atlas document. 
* Update `nunaliit_custom.js` to comment-out or remove the line of code that configures the navigation document identifier.  For example, comment-out the navigation document configuration:
```
	// Default table of content
	//customService.setOption('defaultNavigationIdentifier','navigation.demo');
```
* If this option is removed, by default the navigation configuration is pulled from the `atlas` document.
* Once navigation has been moved to the `atlas` document, it is recommended to delete the old navigation document.

## Migrate Default Module

* Set the value of `default_module` in the `atlas` document. 
* Update `nunaliit_custom.js` to comment-out or remove the line of code that configures the default module identifier.  For example, delete or comment-out the following:
```
	// Default module
	//customService.setOption('defaultModuleIdentifier','module.demo');
```
* If this option is removed, the default module is taken from the `atlas` document.

## Add Metadata

* Login as an admin or vetter user and go to `Tools > Metadata Editor`.
* Add descriptive metadata information to the atlas and each module document.