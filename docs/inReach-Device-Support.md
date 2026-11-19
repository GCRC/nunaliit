<h2><a name="inreach">inReach Device Support</a></h2>

<p>Nunaliit provides integration of inReach devices. It is possible to load inReach devices with preset
forms that can be filled out in the field and sent back to the Nunaliit database.</p>

<h3><a name="inreach_forms">Device Forms</a></h3>

<p>Device forms are defined using a XML file with a format resembling this example:
<pre>
&lt;?xml version="1.0" encoding="utf-8"?&gt;
&lt;root&gt;
  &lt;table tableName="Forms" version="1"&gt;
    &lt;form id="1"&gt;
      &lt;title&gt;Place&lt;/title&gt;
      &lt;destination&gt;tsfn-manager@gcrc.carleton.ca&lt;/destination&gt;
      &lt;prefix&gt;TSFN-P-1-&lt;/prefix&gt;
      &lt;delimiter&gt;|&lt;/delimiter&gt;
      &lt;field id="1"&gt;
        &lt;name&gt;Type&lt;/name&gt;
        &lt;type&gt;PickList&lt;/type&gt;
        &lt;value&gt;camp&lt;/value&gt;
        &lt;value&gt;waypoint&lt;/value&gt;
        &lt;value&gt;historic&lt;/value&gt;
        &lt;value&gt;other (put in notes)&lt;/value&gt;
        &lt;required&gt;Y&lt;/required&gt;
      &lt;/field&gt;
      &lt;field id="2"&gt;
        &lt;name&gt;Name&lt;/name&gt;
        &lt;type&gt;Text&lt;/type&gt;
        &lt;length&gt;140&lt;/length&gt;
        &lt;required&gt;N&lt;/required&gt;
        &lt;default/&gt;
      &lt;/field&gt;
      &lt;field id="3"&gt;
        &lt;name&gt;Notes&lt;/name&gt;
        &lt;type&gt;Text&lt;/type&gt;
        &lt;length&gt;140&lt;/length&gt;
        &lt;required&gt;N&lt;/required&gt;
        &lt;default/&gt;
      &lt;/field&gt;
    &lt;/form&gt;
  &lt;/table&gt;
&lt;/root&gt;
</pre>
</p>

<h3><a name="inreach_config">Nunaliit Configuration</a></h3>

<p>To configure Nunaliit to accepts the messages sent by inReach devices, copy the form
definition file to &lt;atlas&gt;/config/inreach_forms.xml  After copying the file, the
server must be restarted.</p>

<p>This configuration is read and passed to the Nunaliit robot. The robot monitors the database for new incoming
messages (documents) and augments them with the following information:
<ul>
<li>The geometry (nunaliit_geom) is derived from geographic information</li>
<li>A schema name (nunaliit_schema) is assigned. If a form is associated with the message,
then the schema name is "inReach_&lt;form title&gt;". In the case that no form is
associated with the message, then the schema name is set to "inReach".</li>
<li>The form data is added to a special document location. An object is added at
location "inReach_&lt;form title&gt;". Each field is added to this structure with the
appropriate value.</li>	
</ul>
</p>

<h3><a name="inreach_schemas">Schemas</a></h3>

<p>In order to display the values in the augmented documents, schemas are needed. These schemas
can be generated from schema definitions automatically generated from the device forms. This command
is explained <a href="https://github.com/GCRC/nunaliit/wiki/Nunaliit-Documentation-for-Atlas-Builders#schemas-for-inreach">in this section</a>.</p>

<h3><a name="inreach_garmin">Garmin Explore</a></h3>
<p>The Garmin Explore inreach subscriptions support pushing messages out to a URL (webhook) as they are received. The catch is that their code to do this will only accept an HTTP 200 response header as successful. In HTTP, that is the standard response to a get request for a document. After receiving a POST request to submit something, a server is expected to return an HTTP 201 to indicate receipt of the data. This is what CouchDB does. To make this easy in Nunaliit, a special proxy was developed that receives these requests from Garmin, posts them to a dedicated DB in CouchDB, watches for the 201, and returns a 200 to Garmin to indicate success in their system. This proxy was added in <a href="https://github.com/GCRC/nunaliit/pull/1219">pull request #1219</a>. Additional documentation remains to be written.
