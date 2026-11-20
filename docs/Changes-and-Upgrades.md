<h2>From version 2.1.1 to version 2.1.2</h2>

<h3>Dynamic Atlas Content</h3>

Prior to version 2.1.2, all modules stored in the database had to include a map. From
version 2.1.2 and on, modules can omit declaring a map. However, for this feature to work,
changes to files index.html and index.js must be done.

Atlas instances created prior to 2.1.2 have an index.html file with the following tags to represent
the content:
```html
<!--/CONTENT SECTION/-->
<!-- Added New Container Div around body content-->
<div class="nunaliit_content">
	<div id="map" class="nunaliit_map">
		<noscript>
			<p>You appear to have disabled Javascript support in your browser. You have to enable Javascript for proper functioning of this site.</p>

			<p>Votre fureteur ne semble pas supporter Javascript.  Vous devez permettre l'exécution de Javascript pour ce site.</p>
		</noscript>
	</div>
	<div id="map_interaction_div" class="map_interaction"></div>
	<div id="searchInput" class="nunaliit_searchInput"></div>
	<div id="side" class="nunaliit_side"></div>
</div>
```

Starting in version 2.1.2, the html tags of the content div element are generated dynamically to adjust for modules that
do not include maps. Instances of atlas that need this new feature should adjust the content portion a follows:

```html
<!--/CONTENT SECTION/-->
<!-- Added New Container Div around body content-->
<div id="content" class="nunaliit_content">
	<noscript>
		<p>You appear to have disabled Javascript support in your browser. You have to enable Javascript for proper functioning of this site.</p>

		<p>Votre fureteur ne semble pas supporter Javascript.  Vous devez permettre l'exécution de Javascript pour ce site.</p>
	</noscript>
</div>
```

If the changes above are applied to the HTML file, then the following changes must also be performed to the file titled index.js.
Prior to version 2.1.2, the file index.js contains a portion as follows:

```js
var moduleDisplay = new $n2.couchModule.ModuleDisplay({
	moduleName: moduleName
	,config: config
	,titleName: 'title'
	,moduleTitleName: 'module_title'
	,sidePanelName: 'side'
	,filterPanelName: 'filters'
	,searchPanelName: 'searchInput'
	,navigationName: 'navigation'
	,navigationDoc: 'navigation.demo'
	,languageSwitcherName: 'language_switcher'
	,helpButtonName: 'help_button'
	,onSuccess: function(){
		config.start();
			
		if( bounds ) {
			config.directory.dispatchService.send('index.js',{
				type:'mapSetInitialExtent'
				,extent: bounds
				,srsName: srsName
				,reset: true
			});
		};
	}
	,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
});
```
This portion must be replaced with the following portion:

```js
var moduleDisplay = new $n2.couchModule.ModuleDisplay({
	moduleName: moduleName
	,config: config
	,titleName: 'title'
	,moduleTitleName: 'module_title'
	,contentName: 'content'
	,navigationName: 'navigation'
	,navigationDoc: 'navigation.demo'
	,languageSwitcherName: 'language_switcher'
	,helpButtonName: 'help_button'
	,onSuccess: function(){
		config.start();
			
		if( bounds ) {
			config.directory.dispatchService.send('index.js',{
				type:'mapSetInitialExtent'
				,extent: bounds
				,srsName: srsName
				,reset: true
			});
		};
	}
	,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
});
```
As for the changes in the Javascript code, care must be taken in removing the parameters: sidePanelName, filterPanelName
and searchPanelName. Also, the parameter 'contentName' must be added with the identifier of the content div element in
the HTML file.

<h3>n2s_externalMediaLink</h3>

In 2.1.2, a new display class is supported: n2s_insertExternalMediaLink. This is to replace instances of the use of
the class "n2s_externalMediaLink" in templates. Templates that use "n2s_externalMediaLink" should be upgraded to use
"n2s_insertExternalMediaLink". Here is an example of a template that uses "n2s_externalMediaLink":

```html
{{#nunaliit_attachments}}
	{{#files}}
		{{#:iterate}}
			{{#value}}
				{{^source}}{{! do not include thumbnails !}}

					{{#attachmentName}}
	<div class="n2_mediaView">
		<div class="n2s_insertMediaView">{{.}}</div>
	</div>
					{{/attachmentName}}

					{{#originalAttachment}}

	<div>
		<a class="n2s_externalMediaLink" href="{{.}}"><span class="n2s_externalMediaLinkName">({{../originalName}})</span></a>
	</div>
					{{/originalAttachment}}
					{{^originalAttachment}}
						{{#attachmentName}}

	<div>
		<a class="n2s_externalMediaLink" href="{{.}}"><span class="n2s_externalMediaLinkName">({{../originalName}})</span></a>
	</div>
						{{/attachmentName}}
						{{^attachmentName}}
	<div>{{../originalName}}</div>
						{{/attachmentName}}
					{{/originalAttachment}}

	<div style="clear:both"></div>
				{{/source}}
			{{/value}}
		{{/:iterate}}
	{{/files}}
{{/nunaliit_attachments}}
```

Here is the same template using the class "n2s_insertExternalMediaLink":

```html
{{#nunaliit_attachments}}
	{{#files}}
		{{#:iterate}}
			{{#value}}
				{{^source}}{{! do not include thumbnails !}}

					{{#attachmentName}}
	<div class="n2_mediaView">
		<div class="n2s_insertMediaView" nunaliit-attachment="{{.}}"> </div>
	</div>
	<div class="n2s_insertExternalMediaLink" nunaliit-attachment="{{.}}"> </div>
					{{/attachmentName}}

				{{/source}}
			{{/value}}
		{{/:iterate}}
	{{/files}}
{{/nunaliit_attachments}}
```


<h2>From version 2.0.3 to version 2.1</h2>

<h3>Handlebars</h3>

The technology used to render content based on a schema was changed from mustache.js to handlebars.js. Both libraries used a similar mark up language. However, there are slight variations between the two that can cause issues to atlas already deployed. Mainly, in Handlebars, there is no inheritance of properties in a given context. Therefore, given a JSON object:

<pre>
{
   "a": {
      "number": 1
   }
}
</pre>

the following is valid in a Handlebars template:

<pre>
{{#a}}
   {{#number}}
      &lt;div&gt;
         A Number: {{.}}
      &lt;/div&gt;
   {{/number}}
{{/a}}
</pre>

However, templates previously based on Mustache.js may no longer work. For example, the following template, which used to work with Mustache.js, is no longer valid when using Handlebars.js:

<pre>
{{#a}}
   {{#number}}
      &lt;div&gt;
         A Number: {{number}}
      &lt;/div&gt;
   {{/number}}
{{/a}}
</pre>

The process a revising all instances of schema in a database can be accomplished by using a document transformation function within the "Modification Tool". The code for the transformation function is:

<pre>
function(doc, onTransformedFn, onSkippedFn){
    if( doc.nunaliit_type !== 'schema' ) {
        onSkippedFn();
        return;
    };

    var reFind = /\{\{([^#\/:{][^}]*)\}\}/;

    function findPreviousOpen(str,tag){
        var openIndex = str.lastIndexOf('{{#'+tag+'}}');
        if( openIndex &lt; 0 ){
            // no open context
            return false;
        };

        var closeIndex = str.indexOf('{{/'+tag+'}}',openIndex);
        if( closeIndex &lt; 0 ){
            // open context found, without a close context
            return true;
        };

        // open context found, but closed again
        return false;
    };

    function fixField(str,status){
        var result = reFind.exec(str);
        if( !result ) return str;

        var tag = result[1]
        var preStr = str.substr(0,result.index);
        var postStr = str.substr(result.index + result[0].length);
        if( findPreviousOpen(preStr,tag) && tag !== 'date' ){
            // Must make replacement
            // Special case: there is valid instances of 'date' inside 'date'
            status.changed = true;
            postStr = fixField(postStr,status);
            return preStr + '{{.}}' + postStr;
        };

        // Continue search
        postStr = fixField(postStr,status);
        return preStr + result[0] + postStr;
    };

    var status = {
        changed: false
    };
    doc.display = fixField(doc.display,status);
    doc.brief = fixField(doc.brief,status);
    doc.form = fixField(doc.form,status);

    if( status.changed ){
        onTransformedFn();
    } else {
        onSkippedFn();
    };
}
</pre>

More information on template formatting, visit the <a href="http://handlebarsjs.com/">Handlebars.js site</a>.

<h3>Changes in index.html Format and CSS</h3>

The file index.html that is installed when an atlas is created has been changed to accommodate new and more versatile styling. When upgrading from 2.0.3 to 2.1, the current index.html needs to be revised to include the changes brought by the newer version. These changes are numerous and are not listed individually. In most cases, it is easier to delete the file prior to upgrading, and re-apply the changes to the new version.

In the same effort, many of the CSS styling definitions used by previous versions Nunaliit have been modified to separate the classes used for layout, themes and widgets.

<h3>Changes to names of installed documents</h3>

For consistency, some of the files installed in the "docs" directory of a Nunaliit atlas have been renamed. If upgrading to 2.1, the old versions of the documents might be left on disk along the new versions. Here is the list of renamed documents:
<ul>
   <li><b>generic.module.default</b> renamed to <b>module.demo</b></li>
   <li><b>org.nunaliit.schema.genericDoc</b> renamed to <b>schema.demo_doc</b></li>
   <li><b>org.nunaliit.schema.genericMedia</b> renamed to <b>schema.demo_media</b></li>
</ul>

After upgrading, the changes previously made in the older versions of the documents should be applied to the new versions. Then, the old versions of the documents should be deleted from disk and from the database.

An easy method to delete the documents specific to this upgrade is to use the "Modification Tool" and filter the documents using a Javascript function:

<pre>
function(doc){
	if( doc._id === 'org.nunaliit.schema:genericDoc'
	 || doc._id === 'org.nunaliit.schema:genericMedia'
	 || doc._id === 'generic.module:default'
	 ) {
		return true;
	};
	return false;
}
</pre>