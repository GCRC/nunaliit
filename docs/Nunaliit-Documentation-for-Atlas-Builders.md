<h2>Table of Contents</h2>
<ol>
<li><a href="#introduction">Introduction</a></li>
<li><a href="#overview">Nunaliit Overview</a></li>
<li><a href="#obtaining">Obtaining and Installing Nunaliit</a></li>
<li><a href="#using">Using Nunaliit</a>
<ul>
<li><a href="#atlas_creation">Creating an Atlas</a></li>
<li><a href="#atlas_update">Updating and Running an Atlas</a></li>
<li><a href="#atlas_google_mapapi_key">Including Google Map API Key</a></li>
</ul>
</li>
<li><a href="#daemon">Running the Atlas as a Daemon</a>
<ul>
<li><a href="#daemon_systemd">Configuring Service with systemd</a></li>
<li><a href="#daemon_systemd">Configuring Service with SysVinit</a></li>
</ul>
</li>
<li><a href="#directory_structure">Atlas Directory Structure</a></li>
<li><a href="#commands">Nunaliit Commands</a>
<ul>
<li><a href="#command_help">help</a></li>
<li><a href="#command_version">version</a></li>
<li><a href="#command_create">create</a></li>
<li><a href="#command_config">config</a></li>
<li><a href="#command_update">update</a></li>
<li><a href="#command_run">run</a></li>
<li><a href="#command_add_schema">add-schema</a></li>
<li><a href="#command_update_schema">update-schema</a></li>
<li><a href="#command_dump">dump</a></li>
<li><a href="#command_restore">restore</a></li>
<li><a href="#command_upgrade">upgrade</a></li>
<li><a href="#command_schemas-for-inreach">schemas-for-inreach</a></li>
<li><a href="#command_options">&lt;global-options&gt;</a></li>
</ul>
</li>
<li><a href="#configuration">Nunaliit Configuration</a>
<ul>
<li><a href="#configuration_logs">Logging</a></li>
<li><a href="#configuration_multimedia">Multimedia</a></li>
<li><a href="#configuration_locked_down">Locked-Down Atlas</a></li>
<li><a href="#configuration_mail">Mail Service</a></li>
<li><a href="#configuration_registration">User Registration</a></li>
<li><a href="#configuration_notification">Notifications</a></li>
</ul>
</li>
<li><a href="#upload_process">Upload Process</a></li>
<li><a href="#disk_format">On-Disk Document Format</a>
<ul>
<li><a href="#disk_format_attachments">Attachments</a></li>
</ul>
</li>
<li><a href="#upgrading">Upgrading Nunaliit</a>
<ul>
<li><a href="#upgrading_install">Install new version of Nunaliit</a></li>
<li><a href="#upgrading_stop">Stop the Atlas</a></li>
<li><a href="#upgrading_reconfigure">Re-Configuring the Atlas</a></li>
<li><a href="#upgrading_update">Update Atlas</a></li>
<li><a href="#upgrading_restart">Re-Starting Atlas</a></li>
<li><a href="#upgrading_revert">Reverting to an older version of Nunaliit</a></li>
</ul>
</li>
<li><a href="#atlas_content">Atlas Content</a>
<ul>
<li><a href="#atlas_content_design_documents">Design Documents</a></li>
<li><a href="#atlas_content_urls">URLs</a></li>
<li><a href="#atlas_content_init">Initialization</a></li>
<li><a href="#atlas_content_atlas_document">Atlas Documents</a></li>
<li><a href="#atlas_content_module">Module Document</a></li>
<li><a href="#atlas_content_map_styles">Map Styles</a>
<ul>
<li><a href="#atlas_content_map_styles_legacy">Legacy Map Styling</a></li>
<li><a href="#atlas_content_map_styles_conditional">Conditional Map Styling</a></li>
</ul>
</li>
<li><a href="#atlas_content_schema_document">Schema Document</a></li>
<li><a href="#atlas_content_schema_arrays">Arrays in Schema Templates</a></li>
<li><a href="#atlas_content_schema_definition">Schema Definition</a></li>
<li><a href="#atlas_content_schema_custom_type">Schema Custom Type</a>
<ul>
<li><a href="#atlas_content_schema_custom_type_name">Naming Convention</a></li>
<li><a href="#atlas_content_schema_custom_type_definition">Definition File</a></li>
<li><a href="#atlas_content_schema_custom_type_rendering">Rendering of Custom Type</a></li>
</ul>
</li>
<li><a href="#atlas_content_show_service">Show Service</a>
<ul>
<li><a href="#atlas_content_show_service_invoking">Invoking the Show Service</a></li>
<li><a href="#atlas_content_show_service_context">Context Document</a></li>
<li><a href="#atlas_content_show_service_classes">Classes</a></li>
</ul>
</li>
<li><a href="#atlas_content_wiki_markup">Wiki Markup</a></li>
<li><a href="#atlas_content_navigation_document">Navigation Document</a></li>
<li><a href="#atlas_content_atlas_language_configuration">Atlas Language Configuration</a></li>
<li><a href="#atlas_content_skeleton_document">Skeleton Document</a></li>
<li><a href="#atlas_content_user_document">User Document</a></li>
<li><a href="#atlas_content_user_roles">User Roles</a></li>
</ul>
</li>
<li><a href="#atlas_model">Module Models</a>
<ul>
<li><a href="#atlas_model_couchdb_data_source">CouchDB Data Source</a></li>
<li><a href="#atlas_model_couchdbview_document_source">CouchDBView Data Source</a></li>
<li><a href="#atlas_model_static_document_source">Static Document Source</a></li>
<li><a href="#atlas_model_time_filter">Time Filter</a></li>
<li><a href="#atlas_model_no_time_filter">No-Time Filter</a></li>
<li><a href="#atlas_model_reference_filter">Reference Filter</a></li>
<li><a href="#atlas_model_single_document_filter">Single Document Filter</a></li>
<li><a href="#atlas_model_multi_document_filter">Multi Document Filter</a></li>
<li><a href="#atlas_model_layer_filter">Layer Filter</a></li>
<li><a href="#atlas_model_document_filter_by_creator">Document Filter By Creator</a></li>
<li><a href="#atlas_model_filter">Filter</a></li>
<li><a href="#atlas_model_time_transform">Time Transform</a></li>
<li><a href="#atlas_model_union">Union Model</a></li>
<li><a href="#atlas_model_intersect">Intersect Model</a></li>
<li><a href="#atlas_model_schema_docs_join">Schema Documents Join Model</a></li>
<li><a href="#atlas_model_selectable_document_filter">Selectable Document Filters</a></li>
<li><a href="#atlas_model_document_filter_by_creator">Document Filter By Creator</a></li>
<li><a href="#atlas_model_layer_filter2">Layer Filter 2</a></li>
<li><a href="#atlas_model_schema_filter">Schema Filter</a></li>
<li><a href="#atlas_model_simultaneous_filters">Simultaneous Filters</a></li>
<li><a href="#atlas_model_custom_filters">Custom Model Filters</a></li>
</ul>
</li>
<li><a href="#atlas_widget">Module Widgets</a>
<ul>
<li><a href="#atlas_widget_create_document">Create Document Widget</a></li>
<li><a href="#atlas_widget_create_document_from_schema">Create Document From Schema Widget</a></li>
<li><a href="#atlas_widget_duplicate">Duplicate Document Widget</a></li>
<li><a href="#atlas_widget_document_selector">Document Selector</a></li>
<li><a href="#atlas_widget_couchdb_selector">CouchDb Selector</a></li>
<li><a href="#atlas_widget_exporting">Exporting Widgets</a></li>
<li><a href="#atlas_widget_legend">Legend Widget</a></li>
<li><a href="#atlas_widget_navigation">Navigation Widget</a></li>
<li><a href="#atlas_widget_wait">Wait Widget</a></li>
<li><a href="#atlas_widget_polar_stereographic_projection_selector">Polar Stereographic Projection Selector Widget</a></li>
<li><a href="#atlas_widget_time_line">Timeline</a></li>
<li><a href="#atlas_widget_map_time_line_bridge">Timeline Associated with a Map</a></li>
<li><a href="#atlas_widget_date_range">Date Range</a></li>
<li><a href="#atlas_widget_map_date_range_bridge">Date Range Associated with a Map</a></li>
<li><a href="#atlas_widget_model_to_map_and_control_bridge">Model to Map Bridge</a></li>
<li><a href="#atlas_widget_layer_selection_widget">Layer Selection Widget</a></li>
<li><a href="#atlas_widget_single_filter_selection_widget">Single Selection Filter Widget</a></li>
<li><a href="#atlas_widget_multi_filter_selection_widget">Multiple Selection Filter Widget</a></li>
<li><a href="#atlas_widget_multi_filter_selection_drop_down_widget">Multiple Selection Filter Drop-Down Widget</a></li>
<li><a href="#atlas_widget_splash_page">Splash Page</a></li>
<li><a href="#atlas_widget_container">Widget Container</a></li>
<li><a href="#atlas_widget_collapsible_widget_container">Collapsible Widget Container</a></li>
</ul>
</li>
<li><a href="#atlas_canvas">Module Canvas</a>
<ul>
<li><a href="#atlas_canvas_customSvg">Custom SVG Canvas</a></li>
<li><a href="#atlas_canvas_customHtml">Custom HTML Canvas</a></li>
<li><a href="#atlas_canvas_referenceBrowser">Reference Browser Canvas</a></li>
<li><a href="#atlas_canvas_table">Table Canvas</a></li>
<li><a href="#atlas_canvas_grid">Grid Canvas</a></li>
<li><a href="#atlas_canvas_vertical_timeline">Vertical Timeline Canvas</a></li>
<li><a href="#atlas_canvas_force_graph">Force Graph Canvas</a></li>
<li><a href="#atlas_canvas_radial">Radial Canvas</a></li>
<li><a href="#atlas_canvas_radial_tree">Radial Tree Canvas</a></li>
<li><a href="#atlas_canvas_collapsible_radial_tree">Collapsible Radial Tree Canvas</a></li>
<li><a href="#atlas_elementgenerator">ElementGenerator</a></li>
</ul>
</li>
<li><a href="#atlas_utilities">Module Utilities</a>
<ul>
<li><a href="#atlas_utilities_assignLayerOnDocumentCreation">Assign Layer On Document Creation</a></li>
<li><a href="#atlas_utilities_filterMonitor">Filter Monitor</a></li>
<li><a href="#atlas_utilities_selectDocumentOnModuleIntroduction">Select Document on Module Introduction</a></li>
<li><a href="#atlas_utilities_selectDocumentOnFilterChange">Select Document on Filter Change</a></li>
<li><a href="#atlas_utilities_mapClusterClickToZoom">Map Cluster Click to Zoom</a></li>
<li><a href="#atlas_utilities_mapClusterClickToMultiSelect">Map Cluster Click to Multi Selection</a></li>
<li><a href="#atlas_utilities_mapClusterClickHandler">Map Cluster Click Handler</a></li>
<li><a href="#atlas_utilities_mapAutoZoom">Map Auto Zoom</a></li>
</ul>
</li>
<li><a href="#atlas_instances">Instances in Module Definitions</a>
<ul>
<li><a href="#atlas_instances_action_setFilterSelection">Set Filter Selection Action</a></li>
</ul>
</li>
<li><a href="#atlas_custom">Atlas Customization</a>
<ul>
<li><a href="#atlas_custom_loadScript">Loading of Script Files</a></li>
<li><a href="#atlas_custom_service">Custom Service</a></li>
<li><a href="#atlas_custom_moduleNavigation">Default Module and Navigation Documents</a></li>
<li><a href="#atlas_custom_displayFormatTiled">Tiled Display Format</a></li>
<li><a href="#atlas_custom_sliding_display">Sliding Display</a></li>
<li><a href="#atlas_custom_tag_assignment_display">Tag Assignment Display</a></li>
<li><a href="#atlas_custom_displayWidgetWithComments">Show Comments in Display Widget</a></li>
<li><a href="#atlas_custom_disableUserCreate">Disable User Creation Button</a></li>
<li><a href="#atlas_custom_disableDocumentHoverFunctions">Disable Document Hover Functions</a></li>
<li><a href="#atlas_custom_restrictAddRelatedButton">Restrict Add Releated Button</a></li>
<li><a href="#atlas_custom_mapPopup">Custom Map Popup</a></li>
<li><a href="#atlas_custom_mapClickCluster">Change Map Cluster Click Behaviour</a></li>
<li><a href="#atlas_custom_welcomeDisplayPane">Custom Welcome Pane</a></li>
<li><a href="#atlas_custom_authWidgetLabels">Change Labels on Authentication Widget</a></li>
<li><a href="#atlas_custom_simplifiedGeometry">Change limits on Simplified Geometry Requests</a></li>
<li><a href="#atlas_custom_document_display">Custom Document Display</a></li>
<li><a href="#atlas_custom_edit">Custom Editing</a></li>
<li><a href="#atlas_custom_create">Custom Document Creation</a></li>
<li><a href="#atlas_custom_projections">Custom Projections</a></li>
<li><a href="#atlas_custom_language_toggler">Language Toggling Widget</a></li>
<li><a href="#atlas_custom_add_language">Add Supported Language</a></li>
<li><a href="#atlas_custom_user_agreement">User Agreement</a></li>
<li><a href="#atlas_custom_user_questionnaire">User Questionnaire</a></li>
<li><a href="#atlas_custom_email_templates">E-mail Templates</a></li>
<li><a href="#atlas_custom_searchWidgetLabel">Custom Label for Search Widget</a></li>
<li><a href="#atlas_custom_mailForm">Custom Mail Form</a></li>
<li><a href="#atlas_custom_googleAnalytics">Google Analytics</a></li>
<li><a href="#atlas_custom_forceCouchDbCaching">Force CouchDb Caching</a></li>
</ul>
</li>
<li><a href="#atlas_dates">Handling of Dates</a>
<ul>
<li><a href="#atlas_dates_syntax">Date Syntax</a></li>
<li><a href="#atlas_dates_structure">Object Structure</a></li>
<li><a href="#atlas_dates_form">Schema Form</a></li>
<li><a href="#atlas_dates_display">Schema Display</a></li>
<li><a href="#atlas_dates_search">Searching for Dates</a></li>
</ul>
</li>
<li><a href="#atlas_l10n">Multi-Language Support</a>
<ul>
<li><a href="#atlas_l10n_ui">User Interface Strings</a></li>
<li><a href="#atlas_l10n_obj_structure">Localized String Structure</a></li>
<li><a href="#atlas_l10n_structure_in_schema">Displaying Localized String Structure in a Schema</a></li>
<li><a href="#atlas_l10n_structure_in_form">Schema Forms with Localized String Structures</a></li>
<li><a href="#atlas_l10n_service">Localization Service</a></li>
<li><a href="#atlas_l10n_db_strings">Translations from Database</a></li>
<li><a href="#atlas_l10n_file_strings">Translation Files</a></li>
<li><a href="#atlas_l10n_fixing_english">Fixing an English string</a></li>
<li><a href="#atlas_l10n_javascript">Localized Strings in Javascript</a></li>
<li><a href="#atlas_l10n_javascript_args">Localized Strings with Arguments</a></li>
</ul>
</li>
<li><a href="#submission_database">Submission Database</a>
<ul>
<li><a href="#submission_database_how_it_works">How does the Submission Database work?</a></li>
<li><a href="#submission_database_configure">Configuring the Submission Database</a></li>
</ul>
</li>
<li><a href="#atlas_tools">Atlas Tools</a>
<ul>
<li><a href="#atlas_tools_approval">Approval Page</a></li>
<li><a href="#atlas_tools_modification">Modification Tool</a>
<ul>
<li><a href="#atlas_tools_modification_refine_list">Refining a Document List</a></li>
<li><a href="#atlas_tools_modification_js_filtering">Javascript Filtering</a></li>
<li><a href="#atlas_tools_modification_filter_examples">Javascript Filter Examples</a>
<ul>
<li><a href="#atlas_tools_modification_filter_examples_invalid_geom">Filter Invalid Geometries</a></li>
</ul>
</li>
<li><a href="#atlas_tools_modification_report">Reporting</a>
<ul>
<li><a href="#atlas_tools_modification_report_schemas">Report Schema Distribution</a></li>
<li><a href="#atlas_tools_modification_report_structure">Report Document Structure</a></li>
</ul>
</li>
<li><a href="#atlas_tools_modification_transform">Document Transformation</a></li>
</ul>
</li>
<li><a href="#atlas_tools_debug">Debug Page</a>
<ul>
<li><a href="#atlas_tools_debug_badProxy">Bad Proxy</a></li>
<li><a href="#atlas_tools_debug_logging">Event Logging</a></li>
</ul>
</li>
<li><a href="#atlas_tools_bulk_media_upload">Bulk Media Upload</a></li>
</ul>
</li>
<li><a href="#importing_data">Importing Data</a>
<ul>
<li><a href="#importing_data_profile">Import Profile</a>
<ul>
<li><a href="#importing_data_profile_json">JSON Import Profile</a></li>
<li><a href="#importing_data_profile_geojson">GeoJSON Import Profile</a></li>
<li><a href="#importing_data_profile_csv">CSV Import Profile</a></li>
</ul>
</li>
<li><a href="#importing_data_geojson">GeoJSON Import</a></li>
</ul>
</li>
<li><a href="#exporting_data">Exporting Data</a>
<ul>
<li><a href="#exporting_data_geojson">Exporting GeoJSON Format</a></li>
<li><a href="#exporting_data_csv">Exporting CSV Format</a></li>
<li><a href="#exporting_data_tool_select">Modification Tool</a></li>
<li><a href="#exporting_data_tool_export">Export Tool</a></li>
</ul>
</li>
<li><a href="#inreach">inReach Device Support</a></li>
</ol>


<!-- ****************************************************************************** -->
<h2><a name="introduction">Introduction</a></h2>

<p>This documentation applies to the latest available version of Nunaliit (2.1). For
notes on changes from previous releases and required upgrade procedures, visit the 
[[Changes and Upgrades|Changes-and-Upgrades]] page.</p>

<!-- ****************************************************************************** -->
<h2><a name="overview">Nunaliit Overview</a></h2>

<p>The Nunaliit Atlas Framework aims to make it easy to tell stories and highlight relationships 
between many different forms of information from a variety of sources, using maps as a central 
way to connect and interact with the data.</p>

<p>The Nunaliit Atlas Framework was born out of a multi-disciplinary research project led by 
Dr. Fraser Taylor, a Distinguished Research Professor in the department of Geography and Environmental 
Studies and director of the <a href="http://gcrc.carleton.ca">Geomatics and Cartographic 
Research Centre</a> at Carleton University in Ottawa, Canada.</p>

<p>Please consider including a credit and link to Nunaliit if you use it so that we can grow our 
community and support. <a href="http://nunaliit.org/assets.html">Assets</a> have been developed to help.</p>

<p>The Nunaliit home page is <a href="http://nunaliit.org/">http://nunaliit.org</a>.</p>

<p>The documentation you are reading lives at <a href="https://github.com/GCRC/nunaliit/wiki/">https://github.com/GCRC/nunaliit/wiki/</a></p>

<p>If you are interested in working on the development of Nunaliit itself, see the [[Nunaliit Documentation for Developers|Nunaliit Documentation for Developers]]

<p>Nunaliit bugs, questions, and feature requests can be submitted in our 
<a href="https://github.com/GCRC/nunaliit/issues">issue tracker</a>.</p>

<!-- ****************************************************************************** -->
<h2><a name="obtaining">Obtaining and Installing Nunaliit</a></h2>

<p>Please consult the [[Installation]] page for a fresh installation. If you are upgrading from a previous release, it is important that you consult the [[Changes and Upgrades]] page to see what, if any, special steps must be taken. Then refer to the [[Nunaliit Commands - Upgrade|Nunaliit Documentation for Atlas Builders#upgrade]] section of this document for documentation on Nunaliit's built-in upgrade command.</p>

<!-- ****************************************************************************** -->
<h2><a name="using">Using Nunaliit</a></h2>

<p>Nunaliit comes with a command-line tool ("nunaliit") that allows a user to create, maintain
and publish an on-line atlas. It manages each atlas in its own directory, keeping
files relating to an atlas in a confined area of disk, facilitating back-ups and
other life cycle tasks.</p>

<p>Nunaliit packages Jetty within its distribution, permitting the publication of 
the atlas without requiring any other downloads or set-up. The command-line tool
can publish the atlas directly.</p>

<p>The remaining of this section assumes that Nunaliit is installed and
that the PATH variable has been updated to include the "bin" directory found within
the nunaliit folder.</p> 

<h3><a name="atlas_creation">Creating an Atlas</a></h3>

<p>In an atlas creation, a new directory is created already populated with a number
of starting files. The command is: </p>
<pre>
nunaliit create
</pre>
<p>The user must answer a number of questions relating to the atlas:</p>
<pre>
Enter location where atlas should be created: atlas1
Created atlas directory at: /.../atlas1
Copying templates from: /.../templates
Enter the name of the atlas [atlas1]: 
Enter the URL to CouchDB [http://127.0.0.1:5984/]: 
Enter the name of the database where atlas resides [atlas1]: 
Do you wish to manually verify each document submission?(Y/N) [N]:
Enter the name of the admin user for CouchDB [admin]: 
Enter the password for the admin user: password
Enter the port where the atlas is served [8080]:
Enter a Google Map API key (empty if not using):
</pre>
<p>If the initial configuration must be changed, it can be accomplished by running the
configuration command:</p>
<pre>
cd atlas1
nunaliit config
</pre>

<p>In general, all commands other than the creation command should be run from the
top directory of an atlas as such:</p>
<pre>
cd &lt;atlas-dir&gt;
nunaliit &lt;command&gt;
</pre>

<p>However, if the command is not run from the top directory of an atlas, the atlas
can be specified using the "--atlas-dir" option, as shown here:</p>
<pre>
nunaliit --atlas-dir &lt;atlas-dir&gt; &lt;command&gt;
</pre>

<h3><a name="atlas_update">Updating and Running an Atlas</a></h3>

<p>Before running an atlas, the files found in the atlas directory must be propagated
to their appropriate place. This process is known as "updating" the atlas. This
is accomplished using the "update" command.</p>

<pre>
nunaliit update
</pre>

<p>Once an atlas is up to date, it can be published using the "run" command.</p> 

<pre>
nunaliit run
</pre>

<p>When the atlas is running, it can be viewed using a web browser. The address for
the atlas is the local host, localhost or 127.0.0.1. However, the port on which
the atlas is published is configured during the "config" command.</p>

<h3><a name="atlas_google_mapapi_key">Including Google Map API Key</a></h3>

<p>During configuration, the user is prompted for a "Google Map API Key". If the
key is not provided, then map backgrounds based on the Google Map services will not
be available.</p>

<p>A key can be obtained directly from Google from this 
<a href="https://developers.google.com/maps/documentation/javascript/get-api-key">page</a>.
</p>

<!-- ****************************************************************************** -->
<h2><a name="daemon">Running the Atlas as a Daemon</a></h2>

<p>This section explains how to run an instance of Nunaliit atlas as a service. In this section,
when a file name is in the form "nunaliit-XXX", it should be assumed that the XXX is the
name of the atlas.</p>

<h3><a name="daemon_systemd">Configuring Service with systemd</a></h3>

<p>Ubuntu, as of version 16.04, is using systemd for managing services. Therefore, for
platforms running Ubuntu 16.04 or newer, the following procedures should be used
to install a Nunaliit instance as a service.</p>

<p>In the "extra" directory, a file named "nunaliit-XXX.service" is created when the commands
"nunaliit create" or "nunaliit config" are run. First, this file should be edited and the line 
where the user is set should be changed to the name of the user under which the service should
run (User=).</p>

<p>Then, the following commands should be issued:
<pre>
cd .../extra
sudo cp nunaliit-XXX.service /etc/systemd/system/.
sudo systemctl enable nunaliit-XXX
sudo systemctl start nunaliit-XXX
</pre>
</p>

<h3><a name="daemon_systemd">Configuring Service with SysVinit</a></h3>

<p>Platforms running Ubuntu with a version older than 16.04 should use the following procedures
to install a Nunaliit instance as a service.</p>

<p>In the "extra" directory, a file named "nunaliit-XXX.service" is created when the commands
"nunaliit create" or "nunaliit config" are run. First, this file should be edited and the line 
where the user is set should be changed to the name of the user under which the service should
run (NUNALIIT_USER).</p>

<p>Then, the following commands should be issued:
<pre>
cd .../extra
sudo cp nunaliit-XXX.sh /etc/init.d/nunaliit-XXX
cd /etc/init.d
sudo update-rc.d nunaliit-XXX defaults 95
sudo /etc/init.d/nunaliit-XXX start
</pre>
</p>


<!-- ****************************************************************************** -->
<h2><a name="directory_structure">Atlas Directory Structure</a></h2>

<p>An atlas directory is created using the "create" command. At first, an atlas
is populated with a number of default files. Most of these files can be modified
to change the look and behaviour of the atlas.</p>

<p>This section discusses the directory structure of the atlas and the types of
files found in it.</p>

<p>The top directory contain a number of sub-directories:<ul>
<li><b>htdocs</b> : This directory contain files that are served to the clients
visiting the atlas. This is similar to any web site, where HTML and Javascript files
are served along with other required resources.</li>

<li><b>docs</b> : This directory contain documents that are loaded to the database.
Database documents are accessed by the web application during the viewing of an
atlas.</li>

<li><b>media</b> : This directory is used by the atlas while running and contains
files uploaded by users of the atlas. When files stored in this directory are 
approved, they are copied in the database along the document they relate to.</li>

<li><b>config</b> : This directory contains a number of configuration files that
influences the functioning of the atlas.</li>

<li><b>logs</b> : This directory contains log files that are generated while the
atlas is running.</li>

<li><b>extra</b> : This directory contains a script, nunaliit.sh, that can be used
to run the atlas in a "daemon" mode.</li>

<li><b>dump</b> : This directory is used to save snapshots of the database using
the "dump" command.</li>

<li><b>site</b> : This directory contains files to make up a CouchDb Design Document
specific to the published atlas. The content of this directory is mixed with the
files found in "htdocs" to create the "site design document" (_design/site) where
all atlas-specific resources are stored. The "site" directory is useful to add
CouchDB views (database index), list functions, show functions and a 
validate_doc_update function, that are not already part of Nunaliit. </li>

</ul></p>
 
<!-- ****************************************************************************** -->
<h2><a name="commands">Nunaliit Commands</a></h2>

<h3><a name="command_help">help</a></h3>

<pre>nunaliit help [&lt;command&gt;]</pre>

<p>This command provides general help about syntax and purpose, if a command is not
specified. If a nunaliit command is specified as argument, help is reported
about the syntax and purpose of the requested command.</p>

<h3><a name="command_version">version</a></h3>

<pre>nunaliit version</pre>

<p>This command provides the version of the command line tool.</p>

<h3><a name="command_create">create</a></h3>

<pre>nunaliit [&lt;global-options&gt;] create [&lt;create-options&gt;]</pre>

<p>This command creates a new directory structure to hold the content of an atlas
managed by Nunaliit. Then, the configuration command is run to
set-up the appropriate configuration properties. </p>

<p>The options that can be specified for the create command (&lt;create-options&gt;)
are defined as follows:
<ul>
<li><b>--no-config</b> : If this option is specified, the directory structure is created,
without running the implicit "config" command.</li>
</ul>
</p>

<h3><a name="command_config">config</a></h3>

<pre>nunaliit [&lt;global-options&gt;] config</pre>

<p>This command configures the atlas by asking the user a number of questions and
setting the atlas configuration properties accordingly.</p>

<p>Details about the Google Map API Key can be found in this 
<a href="#atlas_google_mapapi_key">section</a>.</p>

<h3><a name="command_update">update</a></h3>

<pre>nunaliit [&lt;global-options&gt;] update</pre>

<p>This command updates the CouchDb database used to support the atlas with the files
found in the atlas directory. This command should be run every time changes are performed
on the files found within the atlas directory.</p>

<p>If the CouchDb database associated with the atlas is not yet created, the update
command creates it.</p>

<p>The update process is complex and encompasses many activities:
<ul>
<li><b>_design/site</b> : The document _design/site is created by merging together
a template from the framework, files found in the "site" sub-directory and the files 
found in "htdocs". This design document
is then uploaded to the CouchDb database associated with the atlas.</li>
<li><b>_design/atlas</b> : The document _design/atlas is special design document that
contains views, validation functions and common javascript libraries used by the atlas.
This design document is generated by using a basic template from the framework and
adjusting settings for the given atlas. It is uploaded to the CouchDb database 
associated with the atlas.</li>
<li><b>_design/mobile</b> : The document _design/mobile is special design document that
is used to access the atlas using mobile devices. This design document is
obtained from the framework and uploaded to the CouchDb database associated with the 
atlas.</li>
<li><b>docs</b> : All documents found in the "docs" directory are uploaded to the 
CouchDb database associated with the atlas. The documents found in the "docs"
directory are documents that are under the control of the atlas developper.</li>
<li><b>framework documents</b> : A number of documents are required by the atlas
and are specified by the framework. These documents are uploaded to the CouchDb
database associated with the atlas.</li>
</ul>
</p>

<h3><a name="command_run">run</a></h3>

<pre>nunaliit [&lt;global-options&gt;] run</pre>

<p>This command updates starts an HTTP service which serves the content of
the atlas. The address used by the service is the localhost. The port used
by the service is specified during configuration.</p>

<p>During the run command, the console output is used to report log messages.
The service is ended by using CTRL-C</p>

<p>Log messages are also sent to a file located in the "logs" directory</p>


<h3><a name="command_add_schema">add-schema</a></h3>

<pre>nunaliit [&lt;global-options&gt;] add-schema [&lt;add-schema-options&gt;]</pre>

<p>This creates a new schema for the atlas. More specifically, it creates a new directory
under the "docs" directory. The content of this new directory is a set of files that represent a
schema document. The command add-schema performs
operations on disk alone and does not affect the database in any way. To push the created schema
to the database, one must first execute the command "update".</p>

<p>The options that can be specified for the add-schema command (&lt;add-schema-options&gt;)
are defined as follows:
<ul>

<li><b>--id &lt;name&gt;</b> : Either this option or the <b>--def</b> must be specified.
If this option is provided, it contributes to the name of the schema. It is good practice to
have schema names be specific to an atlas, to avoid name collision. Therefore, the name of
a schema is &lt;group&gt;_&lt;id&gt;. The <b>--id</b> option provides the tail of the name.</li>

<li><b>--group &lt;name&gt;</b> : This option is considered only if the <b>--id</b> option
is specified. The group option contributes to the name. However, if this option is not specified,
it defaults to the name of the atlas.</li>

<li><b>--def &lt;file&gt;</b> : Either this option or the <b>--id</b> must be specified.
If this option is specified, it locates a file that contains a schema definition. This file is then
used to gather all information needed to create a new schema.</li>

</ul>
</p>

<p>The add-schema command is useful to create a skeleton schema. After a schema is create this
way, a user should edit and augment the file "definition.json", found in the new directory. Then,
the command "update-schema" should be used to modified the schema, based on the definition.</p>

<p>See <a href="#atlas_content_schema_definition">Schema Definition</a> for more information 
on schema defitions.</p>


<h3><a name="command_update_schema">update-schema</a></h3>

<pre>nunaliit [&lt;global-options&gt;] update-schema [&lt;update-schema-options&gt;]</pre>

<p>This refreshes the content of a schema based on its definition. More specifically, it 
reads a schema definition file (definition.json) from the atlas directory and updates the
associated files accordingly. This does not modify the content of the database in any way.</p>

<p>The options that can be specified for the update-schema command (&lt;update-schema-options&gt;)
are defined as follows:
<ul>

<li><b>--name &lt;name&gt;</b> : This is the name of the schema that should be refreshed.
When spcified, the atlas directory is searched for a schema that matches the given name. If
found, the definition file associated with the schema is loaded and all files derived from the
definition are recreated.</li>

<li><b>--all</b> : When this option is specified, all schemas defined on disk that have
a schema definition file are refreshed. One must use the command "update" to push the changes 
that have been accomplished using the update-schema command.</li>

</ul>
</p>

<p>When a schema is refreshed, the definition file is loaded (definition.json) and all derived files
are re-created from the informaition provided in the definition.</p>

<p>See <a href="#atlas_content_schema_definition">Schema Definition</a> for more information 
on schema defitions.</p>


<h3><a name="command_dump">dump</a></h3>

<pre>nunaliit [&lt;global-options&gt;] dump [&lt;dump-options&gt;]</pre>

<p>This command takes a snapshot of some or all the documents found in the database
associated with the atlas and stores them to disk. This snapshot can be later restored using
the "restore" command.</p>

<p>Specific documents can be selected for the dump using the options <b>--doc-id</b> or
<b>--skeleton</b>. If no specific document is selected, then the dump process is performed
over all documents found in the database.</p>

<p>The options that can be specified for the dump command (&lt;dump-options&gt;)
are defined as follows:
<ul>

<li><b>--dump-dir &lt;dir&gt;</b> : If this option is specified, it indicates the
directory where the snapshot is to be stored. If this option is not specified,
the dump command creates a dated sub-directory under the "dump" directory.</li>

<li><b>--doc-id &lt;doc-id&gt;</b> : If this option is specified, it indicates 
a document that is to be dumped. This option can be specified multiple times.</li>
<li><b>--schema &lt;schema id&gt;</b> : Specifies which document(s) should be dumped by selecting a schema type.</li>
<li><b>--layer &lt;layer id&gt;</b> : Specifies which document(s) should be dumped by selecting a layer identifier.</li>
<li><b>--skeleton</b> : If this option is specified, it indicates that the documents
that form the atlas itself, not the documents that represent the data, are desired in
the dump. This usually include the schema documents, the module documents, the navigation
documents and documents specially marked as skeleton documents.</li>
<li><b>--overwrite-docs</b> : If this option is specified, it implies the --skeleton option.
Furthermore, it implies that the --dump-dir option is set to the "docs" directory of the
atlas. This should be used to update the atlas implementation with the documents found
in the database. One should make a copy of the atlas directory before using this option.</li>
</ul>
</p>

<h3><a name="command_restore">restore</a></h3>

<pre>nunaliit [&lt;global-options&gt;] restore --dump-dir &lt;dir&gt; [&lt;restore-options&gt;]</pre>

<p>This command restores documents previously saved using the "dump" command. It
can restore a complete snapshot, when the "--doc-id" option is not used. It can also
restore a subset of the documents by using the "doc-id" option once or multiple times. The
option "--dump-dir" must be specified and refers to a directory created by previously running
the "dump" command.</p>

<p>The options that can be specified for the restore command (&lt;restore-options&gt;)
are defined as follows:
<ul>
<li><b>--dump-dir &lt;dir&gt;</b> : This option must be specified. If the specified
directory is a fully qualified path, then this directory is used to find the document
to be restored. If the specified directory is not fully qualified, then it is used
as a relative path from the "dump" directory.</li>
<li><b>--doc-id &lt;doc-id&gt;</b> : If this option is specified, it indicates 
a document that is to be restored. This option can be specified multiple times. If this
option is not specified, then all documents are restored.</li>
</ul>
</p>

<h3><a name="command_upgrade">upgrade</a></h3>

<pre>nunaliit [&lt;global-options&gt;] upgrade [&lt;upgrade-options&gt;]</pre>

<p>This command upgrades an atlas from one version of Nunaliit to another. During the
upgrade, the files that would be used to create a new atlas under the upgraded version
are copied in the atlas directory to overwrite the files that were initially installed
at creation. Since the files found in the atlas directory can be modified by a user,
only files that were unchanged are replaced. Files that were modified or deleted are
considered as "collisions" and are not replaced. Instead, collisions are reported during
the upgrade process, and the files that would have been copied are stored in a directory
under the "upgrade" sub-directory of the atlas.</p>

<p>Once the upgrade process is completed, a "config" command is automatically initiated
unless the "--test" or "--no-config" options are used.</p>

<p>After the "upgrade" command is completed, a user should run the following commands:
<ol>
<li><b>config</b> : A config command is required to update the references stored in the
atlas directory to the new Nunaliit tool. This is usually not necessary since a "config"
command is naturally initiated at the end of the upgrade process.</li>
<li><b>update</b> : An update command is required to push to the atlas the new versions 
of the files found in the atlas directory.</li>
</ol>
</p>

<p>The options that can be specified for the upgrade command (&lt;upgrade-options&gt;)
are defined as follows:
<ul>
<li><b>--test</b> : When this option is specified, the upgrade process does not modify the
atlas directory. Instead, it computes and reports the changes that would happen if the
upgrade process was allowed to take place. Also, the automatic "config" command is skipped.</li>
<li><b>--no-config</b> : When this option is specified, the upgrade process does not start 
a "config" command automatically when completed.</li>
</ul>
</p>

<h3><a name="command_schemas-for-inreach">schemas-for-inreach</a></h3>

<pre>nunaliit [&lt;global-options&gt;] schemas-for-inreach [&lt;command-options&gt;]</pre>

<p>This is a helper command to help generate schemas based on inReach form definitions. inReach form
definitions are saved in a file named .../config/inreach_forms.xml. These forms are used to load
inReach device to submit information back to the database. The Nunaliit robot uses these form to interpret
and augment the documents submitted that way. However, schemas are needed for displaying the information
correctly.</p>

<p>The command "schemas-for-inreach" reads the form definitions and prints schema definitions derived from
the forms. It is up to the atlas builder to integrate these schemas to the atlas.</p>

<h3><a name="command_options">&lt;global-options&gt;</a></h3>

<p>Global options are accepted by a number of commands and are defined as follows:
<ul>

<li><b>--atlas-dir &lt;dir&gt;</b> : If specified, indicates the location of the atlas
directory. If this option is omitted, then the current directory is assumed to be the
atlas directory. The atlas directory contains all the atlas files.</li>

<li><b>--debug</b> : When specified, sets the logging level of the current logger to DEBUG.
The current logger is controlled by --set-logger. If --set-logger has not yet been specified,
then the root logger is affected.</li>

<li><b>--trace</b> : When specified, sets the logging level of the current logger to TRACE.
The current logger is controlled by --set-logger. If --set-logger has not yet been specified,
then the root logger is affected.</li>

<li><b>--info</b> : When specified, sets the logging level of the current logger to INFO.
The current logger is controlled by --set-logger. If --set-logger has not yet been specified,
then the root logger is affected.</li>

<li><b>--error</b> : When specified, sets the logging level of the current logger to ERROR.
The current logger is controlled by --set-logger. If --set-logger has not yet been specified,
then the root logger is affected.</li>

<li><b>--set-logger &lt;logger-name&gt;</b> : This option can be specified multiple times.
It sets the current logger to the named one. Subsequent --debug, --trace, --info and --error
options set the level of the current logger.</li>

</ul></p>

<!-- ****************************************************************************** -->
<h2><a name="configuration">Nunaliit Configuration</a></h2>

<!-- .............................................................................. -->
<h3><a name="configuration_logs">Logging</a></h3>

<p>It is possible to change the behaviour of the logging system used in Nunaliit by
adding options to the command line. The options used are '--set-logger', '--error',
'--info', '--debug' and '--trace'. These options can be specified multiple times. The
'--set-logger' option is used to name a specific logger and make it current. All other
logging options affect this current logger.</p>

<p>For example, to have all processes at ERROR level, all GCRC code at INFO level and
the utility classes reporting at DEBUG, the following command can be used:

<pre>
  > nunaliit run --error --set-logger ca.carleton.gcrc --info --set-logger ca.carleton.gcrc.utils --debug
</pre>
</p>

<p>If this level is insufficient, it is possible to configure the level that is reported by 
adding a file named "log4j.properties" to the "config" directory of an atlas. This file 
follows the syntax imposed by log4j. As an example, the following content would prompt 
Nunaliit to log all DEBUG messages:
<pre>
log4j.debug=TRUE

log4j.rootLogger=ERROR, GCRC_CONSOLE

log4j.logger.ca.carleton.gcrc=DEBUG, GCRC_CONSOLE

log4j.appender.GCRC_CONSOLE=org.apache.log4j.ConsoleAppender
log4j.appender.GCRC_CONSOLE.layout=org.apache.log4j.PatternLayout
log4j.appender.GCRC_CONSOLE.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss.SSSS} %p %t %c - %m%n
</pre>
</p>

<!-- .............................................................................. -->
<h3><a name="configuration_multimedia">Multimedia</a></h3>

<p>Nunaliit uses external tools to handle multimedia files submitted to an atlas. For processing images, 
the tool ImageMagick is used. For audio and video files, ffmpeg is invoked.</p>

<p>From platform to platform, these tools can be slightly different. For example, not all CODECs are 
available on all platforms. Therefore, Nunaliit offers a means to change the commands that are used to 
invoke external tools for processing multimedia uploads. A file named ".../config/multimedia.properties" 
contains a number of commented out entries which relate to the way Nunaliit calls external tools. 
This file can be modified to change the behaviour of those calls.</p>

<p>For example, some platforms used "avconv" in place of "ffmpeg". Since Nunaliit
uses "ffmpeg" by default, failures can be encountered when uploading a video. To fix this situation, avconv equivalents can be substituted in the "multimedia.properties" file. This might look similar to:
<pre>
ffmpegVersionCommand=avconv -version
ffmpegInfoCommand=avprobe %1$s
ffmpegConvertVideoCommand=avconv -i %1$s -y -acodec aac -ab 48000 -ac 2 -vcodec libx264 -b:v 128000 -r 24 -vf scale=320:-2 -threads 0 -f mp4 %2$s
ffmpegConvertAudioCommand=avconv -i %1$s -y -acodec libmp3lame -ab 48000 -ac 2 -threads 0 -f mp3 %2$s
ffmpegCreateThumbnailCommand=avconv -y -ss %5$s -i %1$s -s %3$dx%4$d -r 1 -vframes 1 -f image2 %2$s
</pre>
</p>

<h4>Configuring Audio and Video Upload Thresholds</a></h4>

<p>The "multimedia.properties" file has settings that allows an atlas builder to specifiy one or more sets of valid image, audio, and video threshholds to be evaluated when an upload occurs.  If at least one of these threshold sets is met, then no conversion is performed.  If none of the thresholds are met, the media file will be converted using Nunaliit's default settings or the overriding settings in multimedia.properties.</p>

<p>It is generally best to use the preconfigured defaults for multimedia file conversion.  These settings offered here can be used to support specific atlas limitations (e.g., bandwidth, file sizes, etc.).</p>

<p>Media type-specific thresholds are explained below. All media type threshold settings offer the ability to specify more than one threshold. Only one must be met in order to pass and not undergo conversion. The '|' is an "OR" conditional. However, all tests in a single threshold must be met for the requirement to pass. For example, an image threshold of "jpeg,500,*" requires that image file be of JPEG type **and** 500px maximum dimension **and** any file size.</p>

<h5>Image Thresholds</h5>
<p>The default image thresholds require that the image file is in JPEG, GIF, or PNG format and has a maximum width or height of 500px to avoid conversion. These settings can be changed with the following configuration item.</p>
<p>
<pre>
#
# multimedia.conversion.image.threshold
#
# Values, separated by commas, used as threshold to initiate conversion of external image
# files. Multiple thresholds can be defined and separated by an OR operator ('|'). For example:
#    jpeg,500,*|png,500,*|gif,500,*
#
# Each threshold is defined with these fields:
# 0 : Acceptable image format (* for any)
# 1 : Largest acceptable dimension, in pixels (* for any)
# 2 : Maximum file size in megabytes (MB), whole numbers only (* for any)
#
#multimedia.conversion.image.threshold=JPEG,500,*
</pre>
</p>

<h5>Audio Thresholds</h5>
<p>The default audio thresholds require that the audio file is in AAC format and has a bitrate of 250,0000 or less to avoid conversion. These settings can be changed with the following configuration item.</p>
<p>
<pre>
#
# multimedia.conversion.audio.threshold
#
# Values, separated by commas, used as threshold to initiate conversion of external audio
# files. Multiple thresholds can be defined and separated by an OR operator ('|'). For example:
#    mpeg,250000,10|mov,128000,10
#
# Each threshold is defined with these fields:
# 0 : Acceptable codec (* for any)
# 1 : Maximum audio bitrate (* for any)
# 2 : Maximum file size in megabytes (MB), whole numbers only (* for any)
#
#multimedia.conversion.audio.threshold=mpeg,250000,10
</pre>
</p>

<h5>Video Thresholds</h5>
<p>The default video thresholds require that the video file is in H264 format, the audio encoding is AAC, both tracks have a maximum average bitrate of 250,0000, and has a maximum file size of 1GB to avoid conversion. These settings can be changed with the following configuration item.</p>
<p>
<pre>
#
# multimedia.conversion.video.threshold
#
# Values, separated by commas, used as threshold to initiate conversion of external video
# files.  Multiple thresholds can be defined and separated by an OR operator ('|'). For example:
#    h264,250000,aac,250000,*,1000|mp4,250000,aac,250000,*,1000
#
# Each threshold is defined with these fields:
# 0 : Acceptable video codec (* for any)
# 1 : Maximum video bitrate (* for any)
# 2 : Acceptable audio codec (* for any)
# 3 : Maximum audio bitrate (* for any)
# 4 : Largest acceptable dimension, in pixels (* for any)
# 5 : Maximum file size in megabytes (MB), whole numbers only (* for any)
#
#multimedia.conversion.video.threshold=h264,250000,aac,250000,*,1000
</pre>
</p>

<!-- .............................................................................. -->
<h3><a name="configuration_locked_down">Locked-Down Atlas</a></h3>

<p>By default, an atlas allows any user to create new documents. This behaviour is intended
to foster contributions from the community. However, there are instances when a published
atlas should restrict the creation of new documents to a restricted number of users. This
latter approach is a "Locked-Down Atlas" and only users that have an atlas-specific role can
create or modify documents. The most common role for a locked-down atlas is the "Atlas User"
role. See section on <a href="#atlas_content_user_roles">User Roles</a> for more information.</p>

<p>A locked-down atlas requires special configuration. The first step is to set the
"atlas.restricted" configuration option. This option is found in the "install.properties" file
under the atlas sub-directory named "config". To set this option, replace the appropriate line
with:
<pre>
atlas.restricted=true
</pre>
</p>

<p>The final step is to update the atlas. See the <a href="#command_update">update</a> command.</p>

<!-- .............................................................................. -->
<h3><a name="configuration_mail">Mail Service</a></h3>

<p>The Nunaliit framework sends mail notifications to support user registration and upload
notifications. For these services to work, the mail configuration parameters must be set
correctly.</p>

<p>The mail configuration file is named "mail.properties" and is located in the "config"
sub-directory of the atlas. Here is an excerpt from an example mail configuration file:
<pre>
mail.transport.protocol=smtp
mail.smtp.host=<host>
mail.smtp.port=25
</pre>
</p>

<p>The example above works correctly for an SMTP server accepting un-authenticated requests
on the standard port.</p>

<p>Since Nunaliit uses JavaMail for mail delivery, it is possible to set any parameters
valid for JavaMail 1.4 in the mail configuration file. Documentation about JavaMail
can be found <a href="http://docs.oracle.com/javaee/6/api/javax/mail/package-summary.html">here</a>.</p>

<p>If Nunaliit is installed on a platform where a SMTP server accepts any requests from local
processes, it is possible to comment out all mail properties. By default, JavaMail connects
to port 25 on "localhost"</p>

<p>To specify a user name and password for authentication, the following properties must
be added to the configuration file:
<pre>
mail.smtp.auth=true
mail.smtp.user=<username>
mail.smtp.password=<password>
</pre>
</p>

<p>If configuring the mail service to use a SMTP server that supports STARTTLS, then the
mail properties should be adjusted according to the following example:
<pre>
mail.transport.protocol=smtp
mail.smtp.host=<host>
mail.smtp.port=587
mail.smtp.starttls.enable=true
</pre>
</p>

<p>If configuring the mail service to use SMTP over SSL, then the mail properties should be
adjusted according to the following example:
<pre>
mail.transport.protocol=smtp
mail.smtp.host=<host>
mail.smtp.port=465
mail.smtp.socketFactory.port=465
mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
</pre>
</p>

<p>Finally, to help debugging problems occurring with the mail service, the following
property can be added so that JavaMail outputs explanations in the logs:
<pre>
mail.debug=true
</pre>
</p>

<p>When the mail properties are changed, the server must be restarted for the changes to
take effect.</p>

<p>The following is an example provided by a user of Nunaliit where they used their Gmail account (which uses SSL) to send emails on behalf of the atlas. They note that you may receive an email on your Gmail account blocking Nunaliit from using it to send emails, and that you must override this setting in Gmail to continue.
 The Nunaliit developers recommend caution with this approach since it involves storing your Google password in plain text in the config file. Setting up your own SMTP relay or using one provided by your ISP would be better options in most cases.</p>
<pre>
mail.transport.protocol=smtp
mail.smtp.host=<i>smtp.gmail.com</i>
mail.smtp.port=465
mail.smtp.auth=true
mail.smtp.socketFactory.port=465
mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
mail.smtp.user=<i>atlasadmin@gmail.com</i>
mail.smtp.password=<i>mygmailpassword</i>
mail.debug=true

user.sendNotification=true
user.sender=<i>atlasadmin@gmail.com</i>
user.url.creation=http://<i>atlasURL</i>/tools/user_creation.html
user.url.passwordRecovery=http://<i>atlasURL</i>/tools/user_password_recovery.html
</pre>

<!-- .............................................................................. -->
<h3><a name="configuration_registration">User Registration</a></h3>

<p>The Nunaliit framework sends e-mail messages during user auto-registration and password
recovery. Before the user registration service can send e-mail notifications, the mail configuration
file must be set correctly. See <a href="#configuration_mail">the mail configuration section</a>
for more details.</p>

<p>The configuration parameters relating to the user registration service are stored in the same file
as the mail parameters. The configuration file is named "mail.properties" and is located in the "config"
sub-directory of the atlas.</p>

<p>Here is an example for the user registration properties:
<pre>
user.sendNotification=true
user.sender=atlas@yourcompany.com|Atlas Server
user.url.creation=http://atlas.yourcompany.com/tools/user_creation.html
user.url.passwordRecovery=http://atlas.yourcompany.com/tools/user_password_recovery.html
user.url.management=http://atlas.yourcompany.com/tools/users.html
admin.notify.userCreation=true
</pre>
</p>

<p>The property <b>user.sendNotification</b> acts as a global switch to enable/disable e-mail
notifications altogether, without disrupting any other properties.</p>

<p>The property <b>user.sender</b> is a string that controls the "From" field in the notification
e-mails. This string should contain the e-mail address of the server. If a display name is
provided, it should follow the e-mail address, separated by a vertical bar ('|') character.</p>

<p>The property <b>user.url.creation</b> is a string that should contain the URL for the user
creation page. This URL is sent in the user registration notifications to help users reach
back to the server.</p>

<p>The property <b>user.url.passwordRecovery</b> is a string that should contain the URL for the user
password recovery page. This URL is sent in the user recovery notifications to help users reach
back to the server.</p>

<p>The property <b>user.url.management</b> is a string that should contain the URL that links to the user
management page. This URL is included in an email (if provided) for ease of access.</p>

<p>The property <b>admin.notify.userCreation</b> is a switch/boolean value that should either be <b>true</b> or
<b>false</b>. When set to <b>true</b>, all administrators will be notified by email whenever a user has registered 
an account with the atlas if auto-registration is active. When <b>false</b>, administrators are not emailed when
a user registers an account.</p>

<!-- .............................................................................. -->
<h3><a name="configuration_notification">Notifications</a></h3>

<p>The Nunaliit framework can send e-mail notifications when uploaded files are waiting for
approval. Before the framework can send upload notification e-mails, the mail configuration
file must be set correctly. See <a href="#configuration_mail">the mail configuration section</a>
for more details.</p>

<p>The configuration parameters relating to the upload notifications are stored in the same file
as the mail parameters. The configuration file is named "mail.properties" and is located in the "config"
sub-directory of the atlas.</p>

<p>Here is an example for the upload notification properties:
<pre>
upload.sendNotification=true
upload.sender=atlas@yourcompany.com|Atlas Server
upload.approval.url=http://atlas.yourcompany.com/upload_approval.html
</pre>
</p>

<p>The property <b>upload.sendNotification</b> acts as a global switch to enable/disable e-mail
notifications altogether, without disrupting any other properties.</p>

<p>The property <b>upload.sender</b> is a string that controls the "From" field in the notification
e-mails. This string should contain the e-mail address of the server. If a display name is
provided, it should follow the e-mail address, separated by a vertical bar ('|') character.</p>

<p>The property <b>upload.approval.url</b> is a string that should contain the URL of the file
upload approval page. This URL is sent in the upload notification e-mails to help users to reach
back to the server.</p>

<!-- ****************************************************************************** -->
<h2><a name="upload_process">Upload Process</a></h2>

<p>Nunaliit uses an upload process during atlas updating, upgrading
and restoring. This process modifies documents in the database with the content of
documents found on disk.</p>

<p>When the upload process installs a document in the database, it creates a
fingerprint of the document that it stores along with the document. When this document
is modified, the fingerprint computed by the upload process no longer matches
the content of the document. By verifying the fingerprint stored with a document, the 
upload process can determine if the document was modified since it was last installed 
in the database.</p>

<p>The upload process uses the following approach for each document to be uploaded:
<ol>
<li>The document to be uploaded is read in memory, a fingerprint is computed against 
it and the fingerprint is added to the document.</li>
<li>The database is queried for a document that has the same identifier.</li>
<li>If a document with the same identifier is not found in the database, the 
document in memory is uploaded and the process ends.</li>
<li>If the document found in the database is equivalent to the one in memory, the
process ends.</li>
<li>If the document found in the database does not contain a fingerprint, it is deemed
modified. In this case, the upload process is aborted and an error is reported.</li>
<li>If the document found in the database contains a fingerprint and that the fingerprint
does not match its content, the document is deemed modified. In this case, the upload
process is aborted and an error is reported.</li>
<li>The document in memory is uploaded to the database.</li>
</ol>
</p>

<!-- ****************************************************************************** -->
<h2><a name="disk_format">On-Disk Document Format</a></h2>

<p>Documents in CouchDb are represented as JSON objects. Therefore, all document transfers
between CouchDb and applications are performed using JSON objects. In the Nunaliit
framework, there are a number of instances where documents are stored on disk within the
atlas directory. This section describes the format used by Nunaliit to load documents
from disk.</p>

<p>A document stored on disk is represented by a directory. The name of the directory
is not relevant to the loading process and should be selected to help user locate documents.
This directory is known as the "document directory".</p>

<p>In the document directory, each entry (file or sub-directory) represents a key of the 
top-most object that constitutes the document. Each file contains the value associated
with the key. Each sub-directory contains the object or array value associated with the key.</p>

<p>For each entry (file and sub-directory) in the document directory, a key is derived from
the name. The extension for the entry name is used to determine the format of the entry
while the remainder of the name is used as the key.</p>

<p>For a file entry with an extension of "txt", the content of the file is used as
a string value. For a file entry with an extension of "json", the content of the file
is interpreted as JSON and used as the value.</p>

<p>For a directory entry without an extension, the content of the directory is used to
create an object that is used as the value. The process to load this object is identical
to the one used by the document loader, and thus is recursive.</p>

<p>For a directory entry with an extension of "array", the content of the directory
represents an array. The names of the entries in directory are sorted and values are
loaded in this order.</p>

<p>Here is an example illustrates this process. In this example, the directory structure is:</p>

<pre>
/
|- _id.txt : 123456
|- a.txt   : Just a test
|- b.json  : {"array":[1,2,3]}
|- inner
|  |- c.txt  : Another string value
|  |- d.json : {}
|- e.array
   |- 0.txt : one
   |- 1.json : 2  
</pre>

<p>From the above directory structure, the loading process would create a JSON object equivalent
to:</p>

<pre>
{
	"_id":"123456"
	,"a":"Just a test"
	,"b": {
		"array":[1,2,3]
	}
	,"inner":{
		"c":"Another string value"
		,"d": {}
	}
	,"e":["one",2]
}
</pre>

<h3><a name="disk_format_attachments">Attachments</a></h3>

<p>CouchDb associates files to documents as attachments. Attachments
are saved in a document under a special key: "_attachments"". On disk, the attachments are saved
in a directory called "_attachments" in the top document directory.</p>

<p>Each file found in the "_attachments" directory structure is uploaded as an attachment to
the document, with a name that is the relative path from the "_attachments" directory. 
Sub-drectories to the "_attachments" directory have no meaning other than to contribute to the
naming of the files deemed as attachments.</p>

<p>Other information is associated with attachments, such as the content-type. This information
is stored in a file adjacent to the attachment itself. This information file has the same name
as the attachment, however it is appended with "._nunaliit". The content of the information file
is plain text that contains a JSON object that is examplified as:</p>

<pre>
{
	"name": &lt;attachment-name&gt;
	,"content_type": &lt;content-type&gt;
}
</pre> 

<p>The &lt;attachment-name&gt; is a string specifying the name of the attachment and is useful 
in case the name associated with an attachment can not be converted into a directory structure.
The field &lt;content-type&gt; is a string depicting the content type of the attachment, such as
"text/plain", "text/html" or "video/mp4".</p> 

<h4>VTT attachments</h4>
If you want subtitles associated with a video file being attached then upload .vtt files with the file 
`name pattern <video_filename_without_extension>_<language_code>.vtt` to the same document as the video file.
The language code will be run through the localization to find a label. For instance if you have the video
file `mytest.mp4` and want to add vtt files for English and French you would upload files `mytest_en.vtt` and
`mytest_fr.vtt`.

<!-- ****************************************************************************** -->
<h2><a name="upgrading">Upgrading Nunaliit</a></h2>

<p>Over the life of an atlas, new releases of Nunaliit might become available. This section
discusses the procedure to migrate from one version of Nunaliit to another. In this process,
new and updated libraries will be installed as well as new and updated documents that are
specified by the framework.</p>

<p>At a high level, the upgrade process follows these steps:
<ol>
<li>Install new version of Nunaliit</li>
<li>Stop atlas</li>
<li>Re-configure atlas</li>
<li>Update atlas</li>
<li>Restart atlas</li>
</ol></p>

<h3><a name="upgrading_install">Install new version of Nunaliit</a></h3>

<p>When a new version of Nunaliit is installed on a platform, it should be hosted in a directory
different than the previous version. The old version of Nunaliit should be
kept until the new atlas is performing properly. This enables a user of the Nunaliit
framework to revert to an earlier version.</p>

<p>Installing Nunaliit is as simple as uncompressing the distributed file in its own directory.
To make this new version active, modify the PATH variable used by the operating system
to detect executable files. The PATH variable should include the "bin" directory of the
new installation, not the old one.</p>

<h3><a name="upgrading_stop">Stop the Atlas</a></h3>

<p>Stopping the atlas is dependent on the way the atlas was started. If the atlas
was started using the "run" command, then pressing CTRL-C in the console window where
the atlas is run should be sufficient. If the atlas was started as a daemon, the following
command should be used:</p>

<pre>.../nunaliit.sh stop</pre>

<h3><a name="upgrading_reconfigure">Re-Configuring the Atlas</a></h3>

<p>Some of the files in the atlas directory reference the location of the Nunaliit
framework. These files must be updated to reference the new framework
location. This is accomplished by running the configuration command. In the case of
re-configuring, all default values can be accepted during the "config" command.</p>

<pre>
cd &lt;atlas-dir&gt;
nunaliit config
</pre>
  
<h3><a name="upgrading_update">Update Atlas</a></h3>

<p>Updating the atlas is required to load new and modified documents and libraries. If an
updated document was changed manually in the database, then the document is skipped
during the upload process. This means that a user upgrading Nunaliit should remain
vigilent of the errors reported during the update process.</p>

<h3><a name="upgrading_restart">Re-Starting Atlas</a></h3>

<p>After the re-configuration, the script used to start Nunaliit as a daemon is modified.
One should review this file to ensure that all properties are in order. Then:</p>

<pre>
&lt;atlas-dir&gt;/nunaliit.sh start
</pre>

<h3><a name="upgrading_revert">Reverting to an older version of Nunaliit</a></h3>

<p>Reverting to an older version of Nunaliit is similar. Instead of installing a new version
of Nunaliit, change the PATH variable back to the "bin" directory of the
desired version. Then, follow the remaining steps of this section.</p>

<!-- ****************************************************************************** -->
<h2><a name="atlas_content">Atlas Content</a></h2>

<p>There are two main types of documents that are served from a running instance of the atlas
framework: Web Resources and Database Documents.</p>

<p>Web resources are files that generally build a web site and include such things as
HTML files, CSS files, Javascript libraries, images, etc. A number of web resources are
provided by the atlas framework, itself. Others are specified by the atlas designer by
including them in the "htdocs" directory of the atlas.</p>

<p>On the other hand, database documents are JSON objects that are stored in CouchDb. These
documents can be accessed directly by providing the document identifier to the database,
or via views that are installed by the atlas framework. As with web resources, a certain
number of database documents are provided by the framework. Atlas designers can specify
documents to be loaded to the database by including them in the "docs" directory of the
atlas.</p>

<p>Although database documents can be specified and uploaded by the framework, the majority
of documents found in the database are created and updated by using the atlas itself. Geometries,
comments, and most of the interactions that users have with the atlas ends up recorded as
database documents.</p>

<p>The main distinction between web resources and database documents is that web resources
are static, while database documents can be modified at run-time. Updating an atlas provides
an opportunity to the atlas designer to change the web resources. However, between updates,
web resources remain unchanged.</p>

<p>All documents, including those provided by the framework, can be modified by users as long
as the modifications respect the authorization rules. Some of the documents found in the database,
such as schemas, affect the run-time behaviour of the atlas. Since some of these documents are
provided by the framework, that these documents are subject to modifications and that the update
process does not overwrite documents that were modified while stored in the database, great care
must be taken when modifying framework provided documents. This is because an upgrade/update process
would not revert these modifications.</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_design_documents">Design Documents</a></h3>

<p>In CouchDb, there is a special class of documents called "Design Documents". These documents
have identifiers that begins with the prefix "_design/" and are used to provide index
functions (views), validation functions (authorization), list functions and show functions. These
documents generally contains web resources for on-line applications served out of the database.</p>

<p>In Nunaliit, a number of design documents are in use:
<ul>
<li><b>_design/atlas</b> : This design document contains all views (index functions) and web resources necessary for Nunaliit.</li>

<li><b>_design/site</b> : This design document contains all views (index functions) and web resources that are specific to the atlas. This documents is built from content found in the atlas directory. The attachments found in this	design documents are loaded from the "htdocs" sub-directory in the atlas directory.</li>

<li><b>_design/server</b> : This design document contains views necessary to the proper functioning of the "robot" component of the atlas. This document is maintained by the servlet that implements the "robot".</li>

<li><b>_design/mobile</b> : This design document contains views and list functions needed for mobile devices that attach to the atlas. This document is provided by the framework.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_urls">URLs</a></h3>

<p>Nunaliit serves the web resources and the database documents through
an HTTP connection, accessible from a web browser. For simplification, all URL paths
used by the atlas web application are relative to the root, where the atlas web
resources are served. URL redirection is used to make CouchDb resources appear adjacent
to one another.</p>

<p>Here are the paths served by Nunaliit:
<ul>
<li><b>/</b> : The root directory is redirected to the attachments of the
"_design/site" design document. The attachments to this document are loaded from
the "htdocs" sub-directory of the atlas directory. All sub-directories from
the "htdocs" sub-directory are served by following a relative path from the root,
unless it is a path that is redirected elsewhere.</li>

<li><b>/media</b> : This path is re-directed to the sub-directory "media" found
in the atlas directory. This directory is used by the framework to store files
uploaded by user, via the atlas interface.</li>

<li><b>/server</b> : This path is re-directed to the root of the CouchDb server.
This path is useful to access CouchDb server information, access the user database
or perform replication.</li>

<li><b>/db</b> : This path is re-directed to the top most directory of the
CouchDb database that serves the atlas, regardless of the database name. This
path is used by the framework to access all documents, views or other sevices
from the database. A document is located at /db/&lt;document-id&gt;</li>

<li><b>/submitDb</b> : This path is re-directed to the location of the submission
database, if one is associated with the atlas.</li>

<li><b>/servlet</b> : This path is re-directed to the various Java servlets that
form the "robot" component of the framework. Among those paths are: 
<b>/servlet/configuration</b>, <b>/servlet/upload</b>, <b>/servlet/progress</b>, 
<b>/servlet/user</b> and <b>/servlet/export</b>.</li>

<li><b>/config</b> : This path is not actually re-directed, but reserved to
hold a configuration script to specify the location of all resources.</li>

<li><b>/nunaliit2</b> : This path is re-directed to the path /db/_design/atlas/nunaliit2.
It contains all the Javascript libraries written specifically for the atlas framework.</li>

<li><b>/js-external</b> : This path is re-directed to the path 
/db/_design/atlas/js-external. This path contains all the Javascript libraries obtained from
projects other than Nunaliit, but required for the proper functioning of the framework.</li>

<li><b>/lib</b> : This path is re-directed to /db/_design/atlas/lib and contains special 
scripts that are shared between the web resources and internal workings of views and lists.
These scripts contain some information specific to an atlas.</li>

<li><b>/tools</b> : This path is re-directed to /db/_design/atlas/tools and contains 
web pages and web tools used to managed an atlas. These tools are common to all instances
of atlas and are provided by the framework.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_init">Initialization</a></h3>

<p>HTML documents and other web resources provided by an atlas designer should be located
in the "htdocs" sub-directory of the atlas directory. In particular, HTML documents that
are expected to perform interactions with the framework should:
<ul>
<li>include all CSS required by the framework</li>
<li>include all Javascript librairies required by the framework</li>
<li>include a Javascript section to initiate the configuration</li>
</ul>
</p>

<p>The CSS resources required by Nunaliit should be defined in the
header of a HTML file as follows:
<pre>
&lt;link rel="stylesheet" href="js-external/css/jquery-ui/smoothness/jquery-ui.custom.css" type="text/css" /&gt;
&lt;link rel="stylesheet" href="js-external/css/jquery.lightbox-0.5.css" type="text/css" /&gt;
&lt;link rel="stylesheet" href="nunaliit2/css/basic/nunaliit2.css" type="text/css" /&gt;
&lt;link rel="stylesheet" href="_list/css_merge/css" type="text/css" /&gt;
</pre>
</p>

<p>The Javascript libraries required by Nunaliit should be defined in the
header or the body of a HTML file as follows:
<pre>
&lt;script type="text/javascript" src="js-external/js/jquery.min.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/jquery-ui.min.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/OpenLayers/OpenLayers.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/jquery.lightbox-0.5.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/jquery.cycle.pack.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/jquery.form.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/jquery.cookie-1.0.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="js-external/js/sha1.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="lib/atlas.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="nunaliit2/nunaliit2.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="lib/utils.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="config/configuration.js"&gt;&lt;/script&gt;
&lt;script type="text/javascript" src="nunaliit_custom.js"&gt;&lt;/script&gt;
</pre>
</p>

<p>The initialization of Nunaliit is performed in multiple steps:
<ol>
<li>The initialization should be started by the application once the document is loaded</li>
<li>The atlas framework creates components that are configured in a default manner</li>
<li>Custom configuration code is called</li>
<li>Control is returned to the application via a callback</li>
</ol>
</p>

<p>Initialization is started by the application by calling a function called "nunaliitConfigure".
This should be done after the document completed to load. Since jQuery is available (jQuery is
required by Nunaliit), a simple way to perform this is to use the jQuery's
"ready" function, as demontrated in this example:
<pre>
jQuery().ready(function() {
	nunaliitConfigure({
		configuredFunction: main_init
		,rootPath: './'
	});
});
</pre> 
</p>

<p>The nunaliitConfigure() takes an object as argument to pass options to the configuration
process. There are two options that can be specified:
<ul>
<li><b>configuredFunction</b> : This is a function (callback) that is executed when
the configuration process has completed. This function has one argument, which is an
object that contains all configuration information.</li>

<li><b>rootPath</b> : This is a string that specifies the relative path to the root
of the application. If not specified, the rootPath is assumed to be './'. This relative
path should always end with a slash character. For all HTML documents in the root
directory, the default value is correct. For all HTML documents in direct sub-directories,
this value should be '../'.</li>
</ul>
</p>

<p>During the configuration process, custom configuration code is called. This is covered
in its own section, later.</p>

<p>At the end of the framework configuration, a callback is executed. This callback can be
thought of as the application's main entry point or main function. As described earlier,
this callback is specified in the "nunaliitConfigure()" function. The main function receives
an object, which contains all configuration information. The structure of this object
is:
<ul>
<li><b>atlasDb</b> : Javascript object configured to access the CouchDb database 
associated with the atlas.</li>

<li><b>atlasDesign</b> : Javascript object configured to access the design document
"_design/atlas"	in the CouchDb database.</li>

<li><b>siteDesign</b> : Javascript object configured to access the design document
"_design/site"	in the CouchDb database.</li>

<li><b>mediaRelativePath</b> : String that depicts the relative path, from the current
application, to the directory where media files are uploaded.</li>

<li><b>documentSource</b> : Database abstraction for accessing document.</li>

<li><b>directory.authService</b> : Javascript object that provides authentication services.</li>

<li><b>directory.customService</b> : Javascript object that provides custom services. It accepts
and distributes named options.</li>

<li><b>directory.dispatchService</b> : Javascript object that communicates events throughout
the Nunaliit framework.</li>
	
<li><b>directory.dispatchSupport</b> : Javascript object used to listen to some events and take
actions on them.</li>

<li><b>directory.editService</b> : Javascript object that provides the functions to edit a
database document based on schemas.</li>
	
<li><b>directory.eventService</b> : Javascript object used to derive some events given
original ones. Among others, it translates events such as 'userSelect' to 'selected'.</li>

<li><b>directory.exportService</b> : Javascript object used to communicate with the export
servlet and provides services to export data from the atlas.</li>

<li><b>directory.geoNamesService</b> : Javascript object used to perform gazeteer services.</li>

<li><b>directory.historyMonitor</b> : Javascript object used to monitor the changes in
browser history.</li>

<li><b>directory.historyTracker</b> : Javascript object used to replay events relating to
changes in the browser's URL.</li>

<li><b>directory.hoverSoundService</b> : Javascript object which plays ambient sound
that is generally associated with hovering over a feature.</li>

<li><b>directory.languageService</b> : Javascript object which keeps track of currently
selected language and provides the translated strings to the rest of the Nunaliit
components.</li>
	
<li><b>directory.notifierService</b> : Javascript object that monitors changes in the document
database. This object will be deprecated in future.</li>
	
<li><b>directory.progressService</b> : Javascript object that communicates with the progress
servlet.</li>

<li><b>directory.requestService</b> : Javascript object that asynchronously retrieves documents
from the document database. The request service uses caches to minimize the
communication to the database.</li>

<li><b>directory.schemaEditorService</b> : Javascript object that provides a document editor
with the schema perspective.</li>

<li><b>directory.schemaRepository</b> : Javascript object that provides access to
all schemas defined in the atlas.</li>

<li><b>directory.searchService</b> : Javascript object that provides search services for
the atlas.</li>

<li><b>directory.serverSideNotifier</b> : Javascript object that provides functions
needed access notifications sent from the server.</li>

<li><b>directory.showService</b> : Javascript object that provides the functions needed
to display the content of a database document based on schemas.</li>

<li><b>directory.uploadService</b> : Javascript object that provides services to upload
files to the atlas.</li>

<li><b>directory.userService</b> : Javascript object that provides communications to
the users servlet and information from the users database.</li>
</ul>
</p>

<p>From the main application function, an application can create a map, a side text panel,
and many more widgets, based on the configuration. This is covered later. The next script
fragment shows the "nunaliitConfigure()" and application main function together:
<pre>
function main(config){
	// Here starts the application
};

jQuery().ready(function() {
	nunaliitConfigure({
		configuredFunction: main
		,rootPath: './'
	});
});
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_atlas_document">Atlas Documents</a></h3>

<p>Information in Nunaliit is saved in documents that are represented as JSON objects.
In order for Nunaliit to not collide with other applications that may be using the
same database, the keys used within the Nunaliit all start with a prefix "nunaliit_".</p>

<p>This section describes the keys reserved by the Nunaliit framework. The following document
is not valid but is shown as a quick reference for the keys reserved by Nunaliit:
<pre>
{
	"nunaliit_attachments": {
		"nunaliit_type": "attachments"
		...
	},
	"nunaliit_created": {
		"nunaliit_type": "actionstamp",
		"time": <number>,
		"name": <string>,
		"action": "created"
	},
	"nunaliit_date_clusters": {
		...
	},
	"nunaliit_email_template": {
		...
	},
	"nunaliit_geom": {
		"nunaliit_type": "geometry"
		...
	},
	"nunaliit_help": {
		...
	},
	"nunaliit_last_updated": {
		"nunaliit_type": "actionstamp",
		"time": <number>,
		"name": <string>,
		"action": "updated"
	},
	"nunaliit_layer_definition": {
		"id": <string>
		,"name": <localized string>
	},
	"nunaliit_layers": [ <string>, ... ],
	"nunaliit_manifest": {
		...
	},
	"nunaliit_module": {
		...
	},
	"nunaliit_navigation": {
		...
	},
	"nunaliit_origin": <reference>,
	"nunaliit_relations": [ <reference>, ... ],
	"nunaliit_schema": <string>,
	"nunaliit_script": {
		...
	},
	"nunaliit_source": <reference>,
	"nunaliit_type": <string>,
	"nunaliit_user_agreement": {
		...
	}
}
</pre>
</p>

<p>The keys reserved by the Nunaliit framework are explained in this list:
<ul>
<li><b>nunaliit_attachments</b> : Reserved for internal use. This section is used
to keep information about each attachment.</li>

<li><b>nunaliit_created</b> : Time stamp that reports the when the document was
first created. In this structure, the name attribute is the identifier for the user
that created the document. The attribute time represents when the document was created.</li>

<li><b>nunaliit_date_clusters</b> : Reserved for internal use</li>

<li><b>nunaliit_email_template</b> : Reserved for internal use</li>

<li><b>nunaliit_geom</b> : Structure used to save information about a feature geometry.</li>

<li><b>nunaliit_help</b> : Reserved for internal use</li>

<li><b>nunaliit_hoverSound</b> : Reference to a document that contains an audio file
that should be played as "hover sound".</li>

<li><b>nunaliit_key_media_ref</b> : Reference to a document that contains media to use 
when displaying this document (tile display, etc)</li>

<li><b>nunaliit_last_updated</b> : Time stamp that reports the when the document was
last updated. In this structure, the name attribute is the identifier for the user
that updated the document. The attribute time represents when the document was updated.</li>

<li><b>nunaliit_layer_definition</b> : This structure is used to report a layer. This
associates a layer identifier with a localized name.</li>

<li><b>nunaliit_layers</b> : Array of layer identifiers. If a document is associated with
one or multiple layers, then this array list the identifiers associated with those layers.</li>

<li><b>nunaliit_manifest</b> : Reserved for internal use</li>

<li><b>nunaliit_module</b> : This structure is used to define a module. This is better explained
in its own <a href="#atlas_content_module">section</a></li>

<li><b>nunaliit_navigation</b> : Reserved for internal use</li>

<li><b>nunaliit_origin</b> : This reference is used in comments. In a comment stream, the
attribute "nunaliit_origin" is a reference to the document associated with the subject of the 
stream. The attribute "nunaliit_source" represents the document that this comment was in reply
to. Top level comments have "nunaliit_origin" and "nunaliit_source" set to the subject document.</li>

<li><b>nunaliit_relations</b> : Generic array of references.</li>

<li><b>nunaliit_schema</b> : String identifier of the schema associated with this document.
The associated schema defines how a document is displayed and how it should be presented in an
edit session.</li>

<li><b>nunaliit_script</b> : Reserved for internal use</li>

<li><b>nunaliit_source</b> : Reference to a document that is related to this one. When a user
selects to "add a related item", then the new document contains "nunaliit_source" pointing to
the document that was selected when the relation was added.</li>

<li><b>nunaliit_type</b> : Reserved for internal use</li>

<li><b>nunaliit_user_agreement</b> : Reserved for internal use</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_module">Module Document</a></h3>

<p>One of the way to build an atlas page is to use a module document. A module document
specifies the characteristics of a module, such as which map layers are used, what the
introductory text is, which schemas are used, etc. A module document can be stored in the
database or specified in-line by Javascript code. With a module document, the ModuleDisplay
class can be used to display the module to a web page, by specifying where the elements should
be displayed.</p>

<h4>Module Document</h4>

<p>The example of a module document is shown here to help with explanation:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		,"introduction": {
			"type": "html"
			,"content": "&lt;div class=\"intro\"&gt;&lt;b&gt;Welcome to a Nunaliit atlas served from CouchDB&lt;/b&gt;&lt;br/&gt;&lt;a href=\"./tools/index.html\"&gt;Nunaliit Tools&lt;/a&gt;&lt;/div&gt;"
		}
		,"map":{
			"coordinates": {
				"initialBounds": [-75.72,45.41,-75.67,45.43]
				,"srsName": "EPSG:4326"
			}
			,"backgrounds": [
				{ 
					"name": "Google Satellite"
					,"type": "Google Maps"
					,"options": {
						"type": "SATELLITE"
						, "numZoomLevels": 19 
					}
				}
				,{ 
					"name": "Google Hybrid"
					,"type": "Google Maps"
					,"options": {
						"type": "HYBRID"
						,"numZoomLevels": 19
					}
				}
				,{ 
					"name": "Google Physical"
					,"type": "Google Maps"
					,"options": {
						"type": "TERRAIN"
						,"numZoomLevels": 19 
					}
				}
			]
			,"overlays": [
				{
					"name": "Approved Layer"
					,"type": "couchdb"
					,"options": {
						"layerName": "approved"
					}
					,"featurePopupDelayMs": 0
					,"useHoverSound": true
				}
				,{
					"name": "Public"
					,"type": "couchdb"
					,"options": {
						"layerName": "public"
					}
					,"featurePopupDelayMs": 0
					,"useHoverSound": true
					,"minimumLinePixelSize": 20
					,"minimumPolygonPixelSize": 20
					,"clustering": {
						"distance": 20
						,"threshold": 1
						,"disableDynamicClustering": false
						,"clusterPointsOnly": false
					}
				}
				,{
					"name": "Geometries"
					,"type": "model"
					,"options": {
						"sourceModelId": "geometries"
					}
					,"featurePopupDelayMs": 0
					,"useHoverSound": true
				}
			]
			,"styles":{
				"base":{
					"normal":{
						"fillColor": "#ffffff"
					}
				}
			}
			,"addPointsOnly": false
			,"showSRSAttribution": true
			,"enableKeyboardControls": true
			,"toggleClick": true
			,"scaleLine":{
				"visible": true
			}
			,"enableWheelZoom": true
			,"layerSelector":{
				"suppress": false
				,"initiallyOpened": false
			}
		}
		,"canvas": null
		,"display":{
			"defaultSchemaName":"genericDoc" 
		}
		,"edit":{
			"defaultSchemaName": "genericDoc"
			,"newDocumentSchemaNames": "ALL_SCHEMAS" 
		}
		,"search":{
			"disabled":false
			,"constraint": {
                            "type": "layer",
                            "layerNames": ["layer1", "layer2"]
                        }
		}
		,"widgets":[
			{
				"widgetType": "createDocument"
				,"showAsLink": true
				,"containerId": "module_title_bar"
			}
		]
		,"utilities":[
			{
				"utilityType": "assignLayerOnDocumentCreation"
				,"layerId": "public"
			}
		]
		,"css": ".allo { border: #000 1px solid; }"
	}
}
</pre>
</p>

<p>At the top level of a module document, a key "nunaliit_module" must be present. This
key is associated with an object (module object) that contains all the pertinent information
relating to a module. The keys that can be specified in a module object are:
<ul>
<li><b>title</b> : String used to populate the title elements of the displayed module.</li>

<li><b>introduction</b> : Object that specifies the introductory text displayed when
a module is first loaded. This object must contain a "type" key which can be: "html",
"text" or "attachment". If the specified type is "html" or "text", then another key named
"content" must be specified. In the case of "html", the "content" key must be associated with
a String that contains the HTML markup to be displayed. In the case of "text", the "content" key
must be associated with a String that contains plain text to be displayed. If the "type" specified
is "attachment", then a key named "attachmentName" must be specified. The "attachmentName" refers
to the attachment, associated with the document, that contains the text to be displayed.
The type "attachment" is meaningful only when a module document is stored in the database.
The values associated with "content", "text" or "attachmentName" can be localized string
structures.</li>

<li><b>display</b> : If specified, this object is used to provide configuration information
to the display process. The possible options are:
<ul>
<li><i>type</i> : specifies the type of display process. There are two possible
values: <b>classic</b> and <b>tiled</b>.</li>
<li><i>defaultSchemaName</i> : specifies the name of the schema used if the diplsay 
process attempts to show a document that is not associated with any schema.</li>
</ul>
</li>

<li><b>edit</b> : If specified, this object is used to provide configuration information
to the document editor. The key "defaultSchemaName" can be defined, which specifies
the name of the schema used if the editor attempts to show a document that is not
associated with any schema. The key "newDocumentSchemaNames", if provided, controls the
set of schemas available to create new documents. If the string "ALL_SCHEMAS" is used,
then all schemas will be offered when a new document is created. Otherwise, the key
"newDocumentSchemaNames" should be associated with an array of strings, each string
specifying the name of a schema to be included at the creation process.</li>

<li><b>search</b> : If specified, this object is used to provide configuration information
to the search service. The attribute "disabled" (boolean) can be defined, which specifies
if the search bar will be included in the display of the module. The attribute "constraint",
if specified, can be a layer string (i.e. a single layer constraint), an array of layer constraints, 
or an object with a type of either "layer" or "model" with an array of strings which identify 
the constraint imposed on the search results (either "layerNames" or "sourceModelIds"). E.g. 
If layer identifiers are specified, then only documents posted on those layers are reported 
in search results.</li>

<li><b>widgets</b> : If specified, this array is used to provide definitinos for additional widgets
displayed by the module. A widget is a graphical representation which may include controls.
The array contains object, each of which must have the compulsory attribute "widgetType". The
widget type defines what widget is added to the display of the module. The order of the
array defines the order in which the widgets are created. All other attributes in the widget
definition object are dependent on the type of the requested widget.</li>

<li><b>canvas</b> : If specified, this object defines the main canvas (map, graph) of the
module. This option is mutually exclusive with the "map" attribute. Therefore, one must
specify "map" or "canvas", but not both.</li>

<li><b>utilities</b> : If specified, this array is used to provide definitions for utilities
to be operating while the module is displayed. A utility is a logical process
that modifies the stock Nunaliit operations.
The array contains object, each of which must have the compulsory attribute "utilityType". The
type defines what utility is added to the module. The order of the
array defines the order in which the utilities are created. All other attributes in the utility
definition object are dependent on the type of the requested utility.</li>

<li><b>css</b> : If specified, this string is loaded as CSS style when the module
is loaded. This allows a module creator to override CSS rules for a specific module.</li>
</ul>
</p>

<p>The module object can also define a key named "map", which is associated with an object
that describes a map that can be displayed. The map description object is defined with the
following keys:
<ul>
<li><b>coordinates</b> : Object that describes the coordinate system used by the map.
A key named "initialBounds" must be specified, which is an array that describes the
bounding box in the format [minX, minY, maxX, maxY] where the map should be initially opened. If the key "autoInitialBounds"
contains <b>true</b>, then the map attempts to open over a region that encompasses all
geometries. Optionally, a map projection can be specified with the key "srsName" and 
the mouse position projection can be set with the key "mousePositionSrsName". </li>

<li><b>addPointsOnly</b> : If this key is specified and that this is associated with
the Boolean true, then while editing, the map accepts only new geometries that are points.
Otherwise, the map offers point, lines and polygons for newly created geometries.</li>

<li><b>showSRSAttribution</b> : If this property is specified and is set to true, then
the map shows attribution for the spatial reference system (SRS) in use.</li>

<li><b>enableKeyboardControls</b> : If this property is specified and is set to true, then
the map will be keyboard navigable when it is focused. While the map is focused, a plus icon should be visible. Arrow keys pan the map, +/- zoom in and out, Page Up/Page Down/Home/End scroll the map by a larger step (than panning), and the Enter will select nearby features (hit detection varies by map zoom level).</li>

<li><b>toggleClick</b> : If this key is specified and that this is associated with
the Boolean true, then the map unselects a feature when an already selected feature
is clicked again. If false, clicking on an already selected feature selects it again.</li>

<li><b>scaleLine</b>: An object that specifies options related to the scale line.  This functionality is only available from Nunaliit 2.2.9 onwards. A scale line can have the following options: 
<ul>
<li><b>visible</b>: Required Boolean. Determines if the scale line is initially visible (true), or not (false). Default is false.</li>
<li><b>bottomOutUnits</b>: Optional String. Define the type of units used for the bottom label of the scale line when zoomed out. Valid unit types include: “m”, “km”, “inches”, “ft”, and “mi”. Default is "mi".</li> 
<li><b>bottomInUnits</b>: Optional String. Define the type of units used for the bottom label of the scale line when zoomed in. Default is "ft". </li>
<li><b>topOutUnits</b>: Optional String. Define the type of units used for the top label of the scale line when zoomed out. Default is "km". </li>
<li><b>topInUnits</b>: Optional String. Define the type of units used for the top label of the scale line when zoomed in.  Default is "m". </li>
<li><b>maxWidth</b>: Optional Number. Defines in pixels the max width of the scale line. Default is 100.</li> 
<li><b>geodesic</b>: Optional Boolean. Use a geodesic measurement. Default is false.</li>
</ul>
</li>

<li><b>enableWheelZoom</b> : If this key is specified and that this is associated with
the Boolean true, then the map can be zoomed in and out using the mouse wheel. This option
is off, by default. This functionality is only available from Nunaliit 2.2.9 onwards.</li>

<li>
	<b>gazetteerFeatureFilter</b> : If specified, sets the feature classes to be used when using the Gazetteer process to create features. Defaults to querying for "Places" if not specified, or if the provided array of strings do not correspond to any accepted values. Must be an array of any of the following strings:
	<ul>
		<li>ADMIN</li>
		<li>HYDRO</li>
		<li>LANDMARKS</li>
		<li>PLACES</li>
		<li>ROADS</li>
		<li>SPOT</li>
		<li>MOUNTAINS</li>
		<li>UNDERSEA</li>
		<li>FOREST</li>
	</ul>
</li>

<li><b>backgrounds</b> : This key must be associated with an array of objects, each object
describing a background layer for the map. A background layer provides imaging on which
the map displays features. Multiple background layers can be specified, but only one is
shown at an given time.</li>

<li><b>overlays</b> : This key must be associated with an array of objects, each object
describing a foreround layer for the map. Overlays generally draw features on a map.
Multiple overlays can be specified and shown simultaneously.</li>

<li><b>styles</b> : This key must be associated with an object that describes the styling
of the geometries on the map. This object is complex in itself and is covered in its 
own <a href="#atlas_content_map_styles">section</a>.</li>

<li><b>layerSelector</b> : Object that specifies options relating to the layer selector.
If the option "suppress" is set, then the layer selector will not be drawn on the map.
If the option "initiallyOpened" is set, then the layer selector will initially be maximized
when the map is first drawn.</li>
</ul>
</p>

<p>When defining a map background, the object must contain a key named "name" for specifying
the name of the background, a key named "type" for specifying the type of the background and
a key named "options", which is an object that contains information about the background
depending on the type of background. The possible background types are: "Bing", "Google Maps", "wms", "wmts", "osm", "stamen", "stadia", and "image".</p>

<p>A "Bing" background layer must specify the following options:
<ul>
<li><b>key</b> : Bing Maps API key for your application. One can get a new 
key at <a href="http://bingmapsportal.com/">http://bingmapsportal.com/</a></li>

<li><b>type</b> : Bing layer identifier.</li>
</ul>
</p>

<p>A "Google Maps" background layer must specify the following options:
<ul>
<li><b>type</b> : This is a required string which specifies the Google map 
-layer identifier. Possible values are (but not resricted to): "SATELLITE", 
"HYBRID" and "TERRAIN".</li>

<li><b>numZoomLevels</b> : Specifies how many zoom levels are available to the
imagery.</li>
</ul>
</p>

<p>A "wms" background layer refers to a layer that is served from a WMS server. The
object associated with a WMS layer can specify the following options:
<ul>
<li><b>url</b> : Required. The URL of the WMS server</li>

<li><b>layers</b> : Required. A string containing a list of comma-separated layer names, to
be assembled by the WMS server.</li>

<li><b>styles</b> : Required. A string containing a list of comma-separated style names, to
apply style to each named layer.</li>

<li><b>srsName</b> : Optional. Sets the projection associated with the layer.</li>
</ul>
</p>

<p>A "wmts" background layer refers to a layer that is served from a WMTS server. The
object associated with a WMTS layer can specify the following options:
<ul>
<li><b>url</b> : Required. The URL of the WMTS server</li>

<li><b>layer</b> : Required. A string containing the layer name, to
be assembled by the WMTS server.</li>

<li><b>style</b> : Required. A string containing the style name, to
apply style to each named layer.</li>

<li><b>requestEncoding</b> : Required. Sets the encoding (REST|KVP) of the tile requests.

<li><b>numZoomLevels</b> : Required. Sets the number of zoom levels associated with the service.</li>

<li><b>matrixSet</b> : Required. Sets the matrixSet/projection name associated with the layer.</li>

<li><b>srsName</b> : Optional. Sets the projection associated with the layer.</li>

<li><b>layername</b> : Optional. Sets the layername associated with the layer.</li>

<li><b>fullTileExtent</b> : Optional. An object configuration specifying the bounds of the extent and the source and destination projections.</li>

<li><b>opacity</b> : Optional. Sets the opacity associated with the layer.

<li><b>isBaseLayer</b> : Required.

<li><b>noCustomMatrixIds</b> : Optional. Uses zoom levels as MatrixIds for template URL instead of the custom '<SRS>:<Zoom>' string.
</ul>
Hint: Similar to wms service, the information and options list above, can be obtained from GetCapabilities request.
An exmaple wmts background definition would be:
<pre>
{
	"name" : "GCRC"
	,"type" : "wmts"
	,"options" : {
		"name": "GCRC"
		,"layer": "s2cloudless"
		,"requestEncoding": "REST"
		,"url": "http://localhost:8080/geowebcache/service/wmts/rest/s2cloudless-2018_3857/{style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}?format=image/jpeg"
		,"style": "raster"
		,"matrixSet": "EPSG:900913"
		,"numZoomLevels" : 31
		,"srsName" :"EPSG:900913"
		,"opacity": 1.0
		,"layername": "s2cloudless"
		,"isBaseLayer": true
		,"tileFullExtent": {
			"bounds": [-95.1530662,42.0583162,-74.3477424,51.0745523000001],
			"sourceProjection": "EPSG:4326",
			"destinationProjection": "EPSG:900913"
		}
	}
}
</pre>
</p>

<p>An "osm" background layer refers to a layer that is served by <a href="http://www.openstreetmap.org/">OpenStreetMap</a>. The
object associated with a OSM layer does not require any other option. However, the following options can be specified:
<ul>
<li><b>url</b> : An array of URL strings, denoting the URL scheme to access the OpenStreetMap layer.</li>
</ul>
An example osm background definition would be:
<pre>
{
  "name": "Open Street Map",
  "type": "osm",
  "options": {
    "url": [
      "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png",
      "https://cartodb-basemaps-b.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png",
      "https://cartodb-basemaps-c.global.ssl.fastly.net/light_all/${z}/${x}/${y}.png"
    ]
  }
}
</pre>
</p>
<hr>
<p>A "stamen" background layer refered to a layer that was served from <a href="http://maps.stamen.com/">Stamen Design</a>. <b>Note that the Stamen services referenced using this type were taken down by Stamen Designs on October 31st, 2023. The reference information on this type is here to assist with migration. Use another background type instead. Stadia Maps (documented below) is the successor service where Stamen Designs layers may still be available.</b></p>
<p>For Stamen background layers to be served, the page that hosts the map must include the Javascript library explicitly. If the library is omitted, then the background layer definition is skipped. The object associated with a Stamen layer must specify the following options:
<ul>
<li><b>layerName</b> : A string specifying which map design is to be used.</li>
</ul>
The Javascript library to support Stamen background layers can be added by inserting the following line in the
host page (index.html). Ensure that the following Javascript inclusion statement appears after the inclusion
of OpenLayers:
<pre>
&lt;script type="text/javascript" src="http://maps.stamen.com/js/tile.stamen.js?v1.2.1"&gt;&lt;/script&gt;
</pre>
</p>
<hr>
<p>A "stadia" background layer refers to a layer that is served by <a href="https://stadiamaps.com/">StadiaMaps</a>, the successor to the Stamen background type. The only configuration option to provide is the layer name. Stadia backgrounds require the use of an <b>account</b> in order to set up domain authentication or an API key. It is recommended that <b>domain-based authentication</b> is used.
<ul>
	<li><b>layerName</b> : A string specifying which map design is to be used.</li>
</ul>
<p>Currently, all free map styles are configurable. <a href="https://docs.stadiamaps.com/themes/">All out-of-the-box map styles from Stadia can be found here</a>. A valid list of layer names currently accepted are:</p>
<ul>
	<li>alidade_smooth</li>
	<li>alidade_smooth_dark</li>
	<li>outdoors</li>
	<li>stamen_toner</li>
	<li>stamen_terrain</li>
	<li>stamen_watercolor</li>
	<li>osm_bright</li>
</ul>
<pre>
{
	"name": "OSM Bright",
	"type": "stadia",
	"options": {
		"layerName": "osm_bright"
	}
}
</pre>
</p>

#### xyz
A generic XYZ layer. Provide options with the following configuration:
* `"url": "<string>"`: Required. URL template string for the XYZ provider. Example: `https://myserver/xyztiles/{z}/{x}/{y}.png`.
* `"projection": "<string>"`: Required. Projection SRS identifier string. Example: `"EPSG:4326"`
* `"extent": "<array of 4 numbers>"`: Required. Grid extent
* `"origin": "<array of 2 numbers>"`: Required. Grid origin
* `"resolutions": "<array of numbers>"`: Required. Grid resolutions
* `"tileSize": "<array of 2 numbers>"`: Required. Tile size

```json
{
	"name": "myData",
	"options": {
		"projection": "EPSG:4326",
		"extent": [
			...
		],
		"resolutions": [
			...
		],
		"origin": [
			...
		],
		"tileSize": [256,256],
		"url": "http://localhost:9999/data/${z}/${x}/${y}.png"
	},
	"type": "xyz"
}
```

<p>An "image" background layer refers to a layer that serves an image file. The
object associated with an image layer requires a url for the image file, image dimensions (width and height), and spatial extent to be specified:
<ul>
<li><b>url</b>: A string denoting the URL to access the image file.</li>
<li><b>width</b>: The width of the image file in pixels</li>
<li><b>height</b>: The height of the image file in pixels</li>
<li><b>extent</b>: An array representing the spatial extent the image will cover. e.g. [lower-left-x, lower-left-y, upper-right-x, upper-right-y]</li>
<li><b>numZoomLevels</b>: The number of zoom levels provided for the image (optional)</li>
</ul>
An example image background definition would be:
<pre>
{
                        "name": "My Image",
                        "type": "image"
                        ,"options": {
                            "url": "images/my_image.gif",
                            "width": 2000,
                            "height": 1200,
                            "extent": [-180, -88, 180, 88],
                            "numZoomLevels": 5
                        }
                }
</pre>
</p>

<p>When defining map overlays, any layer definition acceptable for background can be included
as an overlay. When defining an overlay, the overlay object is specified as follows:
<ul>
<li><b>name</b> : String that specifies the name of the layer</li>
<li><b>type</b> : String that specifies the type of overlay. Possible values are: "couchdb", 
"model" and "wfs".</li>
<li><b>options</b> : Object defining parameters. Based on the type of overlay.</li>
<li><b>featurePopupDelayMs</b> : A number that specifies the delay, in milliseconds,
between the time a mouse hovers over a feature and that the pop-up window is displayed.</li>
<li><b>clustering</b> : An object. If specified, a clustering algorithm is used to group
geometries that are close on the map. This object contains attributes to configure the
clustering algorithm: "distance", an integer representing the maximum distance, in pixels,
for two	geometries to be considered as a cluster; "threshold", an integer that represents
the minimum number of geometries in a cluster; "disableDynamicClustering", a boolean that
controls how small lines and polygons are clustered; "clusterPointsOnly", a boolean
that, if set, disable the clustering algorithm for lines and polygons. If "clusterPointsOnly" is set to true, "disableDynamicClustering" also needs to be set to true.</li>
<li><b>visibility</b> : Optional Boolean. Determines if the layer is initially visible (true),
or not (false).</li>
<li><b>minimumLinePixelSize</b> : Optional Number. Determines the smallest size for a line.
Lines smaller than this specified size are converted to a point.</li>
<li><b>minimumPolygonPixelSize</b> : Optional Number. Determines the smallest size for a
polygon. Polygons smaller than this specified size are converted to a point.</li>
</ul>
</p>

<p>A "couchdb" overlay is associated with an options object defined as follows:
<ul>
<li><b>layerName</b> : String that specifies the layer identifier.</li>
</ul>
</p>

<p>A "model" overlay is associated with an options object defined as follows:
<ul>
<li><b>sourceModelId</b> : String that specifies the identifier of the document model
used to retrieve geometries for map.</li>
</ul>
</p>

<p>A "wfs" overlay is associated with an options object defined as follows:
<ul>
<li><b>url</b> : Required. String that contains the URL to the WFS server</li>
<li><b>featureType</b> : String that specifies the feature type requested from the
WFS server.</li>
<li><b>featureNS</b> : String that specifies the full name space associated with the
feature type.</li>
<li><b>featurePrefix</b> : String that specifies the prefix relating to the name space.</li>
<li><b>version</b> : Optional. Version of WFS protocol used to access WFS server.</li>
<li><b>geometryName</b> : Optional String. Attribute name of the geometry used to
display feature. If not specified, defaults to 'the_geom'.</li>
<li><b>sourceSrsName</b> : Optional String. Specifies the projection name of the geometries
served by the WFS server. Defaults to 'EPSG:4326'</li>
<li><b>filter</b> : Optional Object. Specifies a filter to select the features returned
by the WFS server.</li>
</ul>
</p>

<h4>Module Display</h4>

<p>A document module can be rendered by a web application by using the module display function.
There are two methods: using an in-line module document, or using a module document saved in the
database.</p>

<p>The following script shows how to call the display function:
<pre>
function main_init(config) {
	
	// Get module name from URL parameters
	var moduleName = 'generic.module:default';

	var moduleDisplay = new $n2.couchModule.ModuleDisplay({
		moduleName: moduleName
		,config: config
		,titleName: 'title'
		,mapName: 'map'
		,sidePanelName: 'side'
		,searchPanelName: 'searchInput'
		,navigationName: 'navigation'
		,navigationDoc: 'navigation.demo'
		,languageSwitcherName: 'language_switcher'
		,helpButtonName: 'help_button'
		,onSuccess: function(){}
		,onError: function(err){ alert('Unable to display module('+moduleName+'): '+err); }
	});
};
</pre>
</p>

<p>The instance of ModuleDisplay is initialized using an object that provided all necessary parameters.
This initialization object is defined as follows:
<ul>
<li><b>moduleName</b> : This is the identifier for the document, saved in the database, that
contains the module object to be rendered. This option is mutually exclusive with "moduleDoc".</li>

<li><b>moduleDoc</b> : This is the module document to be rendered. This option is mutually 
exclusive with "moduleName".</li>

<li><b>config</b> : Configuration object generated by the configuration process.</li>

<li><b>titleName</b> : HTML identifier of the element where the title of the module
is rendered.</li>

<li><b>mapName</b> : HTML identifier of the element where the map of the module
is rendered.</li>

<li><b>sidePanelName</b> : HTML identifier of the element where the textual information of
the module is rendered.</li>

<li><b>searchPanelName</b> : HTML identifier of the element where the database search input
is rendered.</li>

<li><b>navigationName</b> : (Optional) HTML identifier of the element where the Table
of Content (TOC) is rendered. The TOC is derived from the information found in the 
navigation document.</li>

<li><b>navigationDoc</b> : (Optional) Identifier of the document that contains the Table
of Content for the atlas.</li>

<li><b>languageSwitcherName</b> : (Optional) HTML identifier of the element where the button
to change language is installed. This option makes sense for instances of Nunaliit atlas where
multiple languages are employed.</li>

<li><b>helpButtonName</b> : (Optional) HTML identifier of the element where the help button
is installed.</li>

<li><b>onSuccess</b> : Function called when the rendering initialization is completed.</li>

<li><b>onError</b> : Function called when an error is encountered in the rendering
initialization.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_map_styles">Map Styles</a></h3>

<p>The styling of geometries is controlled by an object found within the map object contained in a 
<a href="#atlas_content_module">module document</a>. There are many styles that can be defined
for a map, and two map styling approaches exist; a conditional map styling and a legacy map styling.</p>

<p>Both approaches include a value to the "styles" attribute of a map object. In the case of the conditional
styling, an array is installed as the value of the "styles" attribute; in the legacy case, it is an object.</p>


<h4><a name="atlas_content_map_styles_legacy">Legacy Map Styling</a></h4>

<p>In legacy map styling, a number of styles are computed. Each style is composed of four basic rendering styles that corresponds
to the four states:
<ul>
<li><b>normal</b>: This is the default state of a geometry.</li>

<li><b>hovered</b>: This is the state of a geometry when the user's mouse is on top of 
(hovering over)	the geometry.</li>

<li><b>clicked</b>: This is the state of a geometry when it has previously been selected
by a user. This generally happens when a user clicks on the geometry.</li>

<li><b>hoveredClicked</b>: This is the state of a geometry when a geometry is both
selected and hovered over.</li>
</ul>
</p>

<p>The styles computed in this approach are:
<ul>
<li><b>base</b> : The base style is the default style of a map. While drawing a map,
if a geometry is not matched by any particular style, then the map base style is applied.
Since all other styles found in a map are derived from the base style, it is important that
it is fully defined.</li>

<li><b>geometry type styles</b> : It is possible to apply a style different than the base
style given the type of a geometry: "point", "line" or "polygon". Geometry type styles can be 
defined at the same level as the base style, or within layer, schema or intent styles. A geometry 
type style does not need to be fully defined, since the definition of a geometry type style simply 
indicates the changes from the map base style.</li>

<li><b>layer styles</b> : It is possible to apply a style different than the base style given
the layer that a geometry belongs to. A layer style does not need to be fully defined, since
the definition of a layer style simply indicates the changes from the map base style.</li>

<li><b>schema styles</b> : It is possible to apply a style different than the base style given
the schema of the document that contains a geometry. A schema style does not need to be 
fully defined, since the definition of a schema style simply indicates the changes from the
map base style.</li>

<li><b>intent styles</b> : In some circumstances, it is possible to apply an "intent" to a
feature. When this happens, if a style is associated with the intent, then it is used to
define the appearance of the feature. An intent style does not need to be 
fully defined, since the definition of the intent style simply indicates the changes from the
map base style.</li>
</ul></p>

<p>For a geometry, all styles are considered and those that apply are merged in order of precedence: 
<ol>
<li>intent style</li>
<li>schema style</li>
<li>layer style</li>
<li>geometry type style</li>
<li>base style</li>
</ol></p>

<p>The way that two styles are merged is performed by merging the matching basic rendering styles (normal, hovered, clicked,
hoveredClicked) of each merged style. The resulting basic rendering style is a union of all attributes found in the two
merged ones. In the case of a collision, the basic rendering style with precedence wins.</p>

<p>The final rendering style for a geometry is based on the state of the geometry. The four basic rendering styles are
merged to represent the state of the geometry. In this process, the "normal" component is taken as the base and all
other states are simply denoting the differences from the "normal" styling.</p>

<p>An example of a map style object is as follow:<pre>
...
"styles":{
	"base":{
		"normal":{
			"fillColor": "#ffffff"
			,"strokeColor": "#ee9999"
			,"strokeWidth": 2
			,"fillOpacity": 0.4
			,"strokeOpacity": 1
			,"strokeLinecap": "round"
			,"strokeDashstyle": "solid"
			,"pointRadius": 6
			,"pointerEvents": "visiblePainted"
		}
		,"clicked":{
			"strokeColor": "#ff2200"
			,"strokeWidth": 3
		}
		,"hovered":{
			"fillColor": "#0000ff"
			,"cursor": "pointer"
		}
		,"hoveredClicked":{
			"fillColor": "#0000ff"
			,"strokeColor": "#ff2200"
			,"strokeWidth": 3
			,"cursor": "pointer"
		}
	}
	,"line":{
		"normal":{
			"strokeWidth": 4
		}
		,"hovered":{
			"strokeColor": "#0000ff"
		}
	}
	,"layers":{
		"approved":{
			"base":{
				"normal":{
					"fillColor": "#ee9900"
				}
			}
		}
	}
	,"schemas":{
		"research_document":{
			"base":{
				"normal":{
					"fillColor": "#bbbb00"
					,"strokeColor": "#eeee00"
					,"graphicName": "square"
				}
			}
		}
	}
	,"intents":{
		"red":{
			"base":{
				"normal":{
					"fillColor": "#ff0000"
				}
			}
		}
	}
}
...
</pre></p>

<p>In the previous example, a base style is defined where hovering is denoted with a change in
fill colour and selection is denoted with a change in stroke colour. Since line geometries do not
have a fill colour, a geometry type style is defined for lines overriding the hover behaviour so
that it is shown using the stroke colour. The example also demonstrates how the geometries on the
layer identified by "approved" are styled differently from the map base style. Geometries
from documents known as "research_document" (schema name) are also styled differently, regardless of
which layer they appear on. Finally, if a geometry is associated with an intent named "red", then its
fill colour is red (#ff0000).</p>

<p>Currently, there are two intents defined by the Nunaliit framework: 'cluster' and 'find'. The use
for those intent styles are as follows:
<ul>
<li><b>cluster</b>: This is the style used when a number of geometries are combined as one on
the map. This usually happens given the proximity of the geometries.</li>

<li><b>find</b>: This is the style used when a geometry is currently highlighted as a result
of the 'Find on Map' button.</li>
</ul> 
</p>
<p>
The following example of a cluster intent style defines a square marker labelled with the number of features contained in the cluster:
<pre>
...
,"intents":{
			"cluster":{
				"base":{
					"normal":{
						"fillColor": "#ee9900",
						"fontColor": "#ffffff",
						"pointRadius": 14,
						"fontFamily": "Courier New, monospace",
						"fontSize": "14px",
						"fontWeight": "bold",
						"graphicName": "square",
						"label": "${count}",
						"labelAlign": "cm",
						"labelOutlineColor": "#000000",
						"labelOutlineWidth": 3,
						"labelXOffset": "0",
						"labelYOffset": "0",
						"strokeColor": "#ffffff",
						"strokeWidth":2 
					}
				}
			}
		}
...
</pre>
</p>


<h4><a name="atlas_content_map_styles_conditional">Conditional Map Styling</a></h4>

<p>In conditional map styling, a number of rules are defined in an array. The order of the rules in
the array is important as it defines the order of precedence, with a later rule taking precedence
over all previous ones.</p>

<p>Each rule is made of a condition a set of named basic rendering styles. The condition of the rule,
is used to determine if a rule applies to a geometry, or not. The basic rendering styles are used to
holds styling information to be applied to the geometries.</p>

<p>The named basic rendering styles are:
<ul>
<li>normal: This is the default style for a geometry.</li>
<li>hovered: This is the style applied when the user's mouse is on top of (hovering over) the geometry.</li>
<li>selected: This is the style applied when the geometry is selected. This generally happens when a user clicks on the geometry.</li>
<li>found: This is the style applied when a geometry is found using the "Find on Map" button.</li>
</ul>
</p>

<p>For a given geometry, all rules are considered. The rules where the condition is met (condition returns true), are retained
and merged in order of precedence. Two rules are merged by combining the basic rendering styles with the same name. The merging is
the union of the attributes found in each basic rendering style. In case of collision, the style with precedence wins.</p>

<p>Once all the rules have been merged, a final rendering style is derived from the basic rendering styles. This merging is performed 
as described above, with the following precedence:
<ul>
<li>hovered</li>
<li>found</li>
<li>selected</li>
<li>normal</li>
</ul>
</p>

<p>The rendering style computed from this last merge is used to affect the rendering of geometry.</p>

<strong>Rule Conditions:</strong>
<p>A rule condition is written similar to a condition in a Javascript program. In the context of a condition, not all facilities
available in standard Javascript are provided. However, a number of objects and functions are defined to ease the writing of those
conditions:
<ul>
<li>doc : The document associated with this geometry</li>
<li>n2_selected : A boolean representing if this geometry is selected</li>
<li>n2_hovered : A boolean representing if this geometry is in focus</li>
<li>n2_found : A boolean representing if this geometry is in "found" state</li>
<li>n2_elem : The actual DOM element being rendered</li>
<li>isSelected() : A function that returns true if the geometry is selected</li>
<li>isHovered() : A function that returns true if the geometry is in focus</li>
<li>isFound() : A function that returns true if the geometry is in focus</li>
<li>isPoint() : A function that returns true if the geometry is a point</li>
<li>isLine() : A function that returns true if the geometry is a line</li>
<li>isPolygon() : A function that returns true if the geometry is a polygon</li>
<li>isSchema(schemaName) : A function that returns true if the document associated with this geometry 
                           is of the type "schemaName".</li>
<li>onLayer(layerId) : A function that returns true if the document associated with this geometry 
                       is on the layer "layerId".</li>
<li>hasClass(className) : A function that returns true if the DOM element associated with this geometry 
                          contains the class "className).</li>
<li>Math : Javascript object that provides all mathematical functions.</li>
</ul>
</p>
<p>In addition to all the attributes and function defined above, all variables provided in the context by an element
generator are also available in the context of a rule condition.
</p>
<p>Finally, other functions can be added to the list via the global context. The global context can be obtained via
the function nunaliit.styleRuleParser.getGlobalContext().
</p>


<strong>Basic Rendering Style:</strong> 
<p>Each rule has a number of basic rendering styles. Each of those styles is made of a set of attributes (key-value pairs).
These attributes are applied similar to many modern styling systems (e.g. css). The following style attributes
are available: 
<ul>
	<li><b>fill</b>: The fill rule defines the colour used for the fill of a geometry. e.g. "fill":"#ff0000"</li>
	<li><b>fill-opacity</b>: The fill-opacity rule defines the opacity of the fill in a geometry, ranging from 0 (transparent) to 1 (opaque). e.g. "fill-opacity":0.5</li> 
	<li><b>stroke</b>: The stroke rule defines the colour used for the stroke (i.e. the outline) of a geometry. e.g. "stroke":"#00ff00"</li>
	<li><b>stroke-width</b>: The stroke-width rule defines the width of the stroke. e.g. "stroke-width":4</li>
	<li><b>stroke-opacity</b>: The stroke-opacity rule defines the opacity of the stroke in a geometry, ranging from 0 (completely see though) to 1 (completely opaque). e.g. "stroke-opacity":0.8 </li>
	<li><b>stroke-linecap</b>: The stroke-linecap rule defines the style of the start and end points of the stroke line, and can be set to round, butt, or square. e.g. "stroke-linecap":"round"</li>
	<li><b>stroke-dasharray</b>: The stroke-dasharray rule defines the stroke style pattern, and can be set to; dot, dash, dashdot, longdash, longdashdot, or solid (default). e.g. "stroke-dasharray":"dash"</li>
	<li><b>r</b>: The r rule defines the radius of a point geometry.  e.g. "r": 8</li>
	<li><b>graphicName</b>: The name of a graphic which defines a shape used by a point geometry. e.g. "graphicName": "square"</li>
	<li><b>label</b>: The label rule defines the map label placed over the feature. e.g. "label":"Nunaliit" or "label":"=doc.demo_doc.title"</li>
	<li><b>color</b>: The color rule defines the font colour of text. e.g. "color":"#ffffff"</li>
	<li><b>font-family</b>: The font-family rule defines the font family used by text. e.g. "font-family": "Courier New, monospace"</li>
	<li><b>font-size</b>: The font-size rule defines the size of the font used by text. e.g. "font-size": “12px”</li>
	<li><b>font-weight</b>: The font-weight rule defines the font weight used by text. e.g. "font-weight": "bold"</li>
	<li><b>iconSrc</b>: Path to an image file (PNG, SVG, etc.). e.g. "iconSrc": "fish.svg" (typically relative to where index.html is)</li>
	<li><b>width</b>: Only applicable if iconSrc is specified, numerical value. e.g. "width": 32</li>
	<li><b>height</b>: Only applicable if iconSrc is specified, numerical value. e.g. "height": 32</li>
</ul>
</p>

<p>In addition to the style attributes mentioned above, any style attribute understood by the underlying rendering engine
can be used.</p>

<p>The following is an example of map conditional styling:</p>
<pre> 
...
,"styles":[
	{ 
		"condition": "true"
		,"normal": {
			"stroke-width": 2
			,"stroke": "#559955"
			,"fill": "#99FF99"
			,"fill-opacity": 0.4
			,"r": 8
		}
		,"selected": {
			"stroke-width": 4
			,"stroke": "#FF9999"
			,"fill": "#FF9999"
			,"r": 10
		}
		,"hovered": {
			"iconSrc": "fish.svg",
			"width": 24,
			"height": 24
		}
		,"found": {
			"stroke-width": 4
			,"stroke": "#FF9999"
			,"fill": "#9999FF"
		}
	}
	,{
		"condition": "isPoint()"
		,"normal": {
			"r": 4
		}
	}
	,{
		"condition": "isLine()"
		,"normal": {
			"stroke-width": 8
			,"stroke-linecap": "round"
			,"stroke-dasharray": "dash"
			,"stroke": "#555555"
		}
	}
	,{
		"condition": "isPolygon()"
		,"normal": {
			"stroke-width": 1
			,"stroke": "#333333"
			,"fill": "#bbbbbb"
			,"fill-opacity": 0.8
		}
	}
	,{
		"condition": "onLayer('approved')"
		,"normal": {
			"stroke": "#009955"
			,"fill": "#00FF99"
			,"fill-opacity": 0.4
		}
	}
	,{
		"condition": "isSchema('demo_media')"
		,"normal": {
			"stroke": "#AAAAAA"
			,"fill": "#AA8888"
			,"fill-opacity": 0.6
		}
	}
	,{
		"condition": "doc.nunaliit_layers.length > 2"
		,"normal": {
			"fill": "rgb(223,223,12)"
			,"r": 15
			,"label": "=doc.demo_doc.title"
			,"color": "#000000"
			,"font-family": "Courier New, monospace"
			,"font-size": "12px"
			,"font-weight": "bold"
			,"graphicName": "square"
		}
	}
]
...
</pre>

<!-- .................................................................. -->
<h3><a name="atlas_content_schema_document">Schema Document</a></h3>

<p>Schemas are used to define how a database document is displayed to the user within the context of an
atlas. There are multiple instances when a user can be presented the content of a database document, and
a schema handles all those cases. Among those cases are the "display" case, when a user is focusing
on a particular database document. Another case is the "brief" view, which is displayed in a bubble
when a user mouses over a map feature that relates to the database document. Yet another case is the
"edit" view, displayed when a user is editting a database document.</p>

<p>In Nunaliit, schemas are used in conjunction with a technology called "Handlebars templates" 
(<a href="http://handlebarsjs.com/">http://handlebarsjs.com</a>) to render the HTML fragments
necessary to display the information contained in a document. Handlebars templating, based on
Mustache templates, was designed specifically for this purpose and documentation for this technology
is readily available on the Internet.</p>

<p>A database document is associated with a schema by recording the schema name in a special key
named "nunaliit_schema", at the top level of the database document. The document, offered here as
an example, is associated with a schema named "placename":
<pre>
{
	"_id": "just a test"
	,"place": {
		"name": "test place"
		,"description": "just a description"
	}
	,"nunaliit_schema": "placename"
}
</pre>
</p>

<p>A schema is a document that can be saved in the database. When schemas are saved in the database,
it offers greater flexibility since the information recorded and displayed for each document type
can be tailored at run-time to suit the atlas' needs.</p>

<p>Following is an example of a schema document:
<pre>
{
   "_id": "myschema:placename",
   "nunaliit_type": "schema",
   "nunaliit_schema": "schema",
   "name": "placename",
   "label": "Place Name",
   "isRootSchema": true,
   "create": {
       "place": {
           "name": "",
           "description": ""
       },
       "nunaliit_schema": "placename"
   },
   "brief": "PlaceName({{#place}}{{name}}{{/place}})",
   "display": "&lt;div&gt;\n\t{{#place}}\n\t\t{{#name}}\n\t\t\t&lt;div&gt;\n\t\t\t\t&lt;div class=\"label n2_localize\"&gt;Name&lt;/div&gt;\n\t\t\t\t&lt;div class=\"value\"&gt;{{name}}&lt;/div&gt;\n\t\t\t\t&lt;div class=\"end\"&gt;&lt;/div&gt;\n\t\t\t&lt;/div&gt;\n\t\t{{/name}}\n\t\t{{#description}}\n\t\t\t&lt;div&gt;\n\t\t\t\t&lt;div class=\"label n2_localize\"&gt;Description&lt;/div&gt;\n\t\t\t\t&lt;div class=\"value n2s_preserveSpaces\"&gt;{{description}}&lt;/div&gt;\n\t\t\t\t&lt;div class=\"end\"&gt;&lt;/div&gt;\n\t\t\t&lt;/div&gt;\n\t\t{{/description}}\n\t\t{{/place}}\n\n\t&lt;/div&gt;",
   "form": "&lt;div&gt;\n\t{{#place}}\n\t\t&lt;div&gt;\n\t\t\t&lt;div class=\"label n2_localize\"&gt;Name&lt;/div&gt;\n\t\t\t&lt;div class=\"value\"&gt;{{#:field}}name{{/:field}}&lt;/div&gt;\n\t\t\t&lt;div class=\"end\"&gt;&lt;/div&gt;\n\t\t&lt;/div&gt;\n\t\t&lt;div&gt;\n\t\t\t&lt;div class=\"label n2_localize\"&gt;Description&lt;/div&gt;\n\t\t\t{{#:field}}description,textarea{{/:field}}&lt;/div&gt;\n\t\t\t&lt;div class=\"end\"&gt;&lt;/div&gt;\n\t\t&lt;/div&gt;\n\t{{/place}}\n&lt;/div&gt;",
   "export": [
       {
           "select": "place.name",
           "label": "name"
       },
       {
           "select": "place.description",
           "label": "description"
       }
   ],
   "relatedSchemas": [
       "genericMedia"
   ]
}
</pre>
</p>

<p>An explication of each entry of the schema document is offered here:
<ul>
<li><b>nunaliit_type</b> : For a schema document, this key must be associated with a fixed string:
"schema". Otherwise, the document is not recognized as a schema.</li>

<li><b>nunaliit_schema</b> : Optional. This informs the framework that the schema document
should be viewed using the schema named "schema".</li>

<li><b>name</b> : Required string. This string field contains the name that the schema is
known as.</li>

<li><b>label</b> : Optional string. This string field contains the label that should be presented
to a user when a schema is to be selected.</li>

<li><b>isRootSchema</b> : Required boolean. A schema that can be used to display a document should
have this field set (true). Extensions, which are schemas used to display a fragment of a document,
should have this field reset (false). In general, this field should be set (true).</li>

<li><b>create</b> : Required object. This object field is the template for a new document when
a new document based on the schema is requested.</li>

<li><b>brief</b> : Required string. This string field contains a Handlebars template of a HTML
fragment to be used when displaying a document associated with this schema in "brief" mode.</li>

<li><b>display</b> : Required string. This string field contains a Handlebars template of a HTML
fragment to be used when displaying a document associated with this schema in "display" mode.</li>

<li><b>form</b> : Required string. This string field contains a Handlebars template of a HTML
fragment to be used when editing a document associated with this schema.</li>

<li><b>export</b> : Optional array. This array is used while exporting documents from the database.
This export array specifies which fields from a document (associated with the schema) are sent
during an export process. The array contains objects. Each object contains a string field called
"label" that represents the name of the field being exported. Each object also contains
a string field called "select", which is selector to pick the field from the object to be exported.
This selector is using a dotted notation, where inner fields are accessed by naming the parent field,
followed by a period and completed using the inner field's name.</li>

<li><b>relatedSchemas</b> : Optional array. This array contains strings, which are names of other
schemas. During the operation of the atlas, when a user is adding information relating to
a document, this array is used to figure which schemas can be used to relate this new information.</li>

<li><b>definiton</b> : Optional object. This structure contains the definition for the schema. A
schema definition is an alternate view of the schema where all information needed to produce the
other schema attributes can be found. See <a href="#atlas_content_schema_definition">Schema Definition</a>
for more information.</li>
</ul>
</p>

<p>Because the "display" field of a schema is a Javascript string containing a Handlebars template of
a HTML fragment, many characters must be escaped which hinders comprehension. However,
if one was to access this field using an editor that showed the content without escaping characters, this
is what the "display" field from the example above would look like:
<pre>
&lt;div&gt;
	{{#place}}
		{{#name}}
			&lt;div&gt;
				&lt;div class="label n2_localize"&gt;Name&lt;/div&gt;
				&lt;div class="value"&gt;{{.}}&lt;/div&gt;
				&lt;div class="end"&gt;&lt;/div&gt;
			&lt;/div&gt;
		{{/name}}
		{{#description}}
			&lt;div&gt;
				&lt;div class="label n2_localize"&gt;Description&lt;/div&gt;
				&lt;div class="value n2s_preserveSpaces"&gt;{{.}}&lt;/div&gt;
				&lt;div class="end"&gt;&lt;/div&gt;
			&lt;/div&gt;
		{{/description}}
		{{#person}}
			&lt;div&gt;
				&lt;div class="label n2_localize"&gt;Person&lt;/div&gt;
				&lt;div class="value"&gt;{{.}}&lt;/div&gt;
				&lt;div class="end"&gt;&lt;/div&gt;
			&lt;/div&gt;
		{{/person}}
	{{/place}}
&lt;/div&gt;
</pre>
</p>

<p>In the same manner, the "form" field from the schema example is unescaped here to help with comprehension:
<pre>
&lt;div&gt;
	{{#place}}
		&lt;div&gt;
			&lt;div class="label n2_localize"&gt;Name&lt;/div&gt;
			&lt;div class="value"&gt;{{#:field}}name{{/:field}}&lt;/div&gt;
			&lt;div class="end"&gt;&lt;/div&gt;
		&lt;/div&gt;
		&lt;div&gt;
			&lt;div class="label n2_localize"&gt;Description&lt;/div&gt;
			&lt;div class="value"&gt;{{#:field}}description,textarea{{/:field}}&lt;/div&gt;
			&lt;div class="end"&gt;&lt;/div&gt;
		&lt;/div&gt;
		&lt;div&gt;
			&lt;select class="{{#:input}}person{{/:input}}"&gt;
				&lt;option value="amos"&gt;Amos&lt;/option&gt;
				&lt;option value="jp"&gt;JP&lt;/option&gt;
				&lt;option value="peter"&gt;Peter&lt;/option&gt;
			&lt;/select>
		&lt;/div&gt;
	{{/place}}
&lt;/div&gt;
</pre>
</p>

<p>A Handlebars template defines how a given JSON object, a database document, is scanned to generate
a HTML fragment to represent the object. All functions offered by Handlebars are available to the templates.
Furthermore, in the context of the Nunaliit framework, some accessors and built-in functions are added
to help with the processing of documents and generation of forms:
<ul>
<li><b>:parent</b> : Accesses the parent object structure. Example <i>{{#:parent}}{{name}}{{/:parent}}</i>
displays the name attribute from the parent's object structure.</li>

<li><b>:iterate</b> : For an object structure, returns an array of objects. Each object contains
two keys: "key" and "value". This is a way to iterate over all key-value pairs defined in an object.</li>

<li><b>:empty</b> : Returns true for an object that contains no key.</li>

<li><b>:input</b> : This is a function that prints all classes needed for the proper function of
the editor. The classes reported by this function associate HTML input tags (&lt;input&gt; and
&lt;textarea&gt;) to the proper field within an object. The syntax for a the ":input" function
is: <i>{{#:input}}field-name,field-type{{/:input}}</i>, where <i>field-name</i> is the name of
the field being editted; and, <i>field-type</i> is the type of the field. The field-type can be
ommitted. Possible values for <i>field-type</i> are: reference, date and numeric. For a reference field,
a string is presumed to be a document identifier. For a date field, a numeric value is assumed to
be a date that respects the Javascript Date convention. For a numeric field, only numbers are
accepted.</li>

<li><b>:field</b> : This is a function that prints HTML containing editor inputs for a given document
attribute. This function is preferred over <b>:input</b>. The syntax for the ":field" function is:
<i>{{#:field}}field-name[,field-option]...{{/:field}}</i>, where <i>field-name</i> is the name of
the field being edited; and, <i>field-option</i> is one or multiple of the possible options 
(<b>textarea</b>,<b>checkbox</b>,<b>reference</b>,<b>date</b>,<b>numeric</b>,<b>layers</b>,<b>localized</b>,
<b>placeholder</b>).
For example: <i>{{#desc}}Description: {{#:field}}.,textarea{{/:field}}{{/desc}}</i>
</li>

<li><b>:localize</b> : This is a function that prints HTML to report a localized string from a document.
In Nunaliit, if a string found in a document must contain versions for multiple language, then a special
structure can be used to report the various languages. The ":localize" function is used to display
the most appropriate language available, and if not generate the appropriate markup to show that a fallback
language was used. The syntax for the ":localize" function is:
<i>{{#:localize}}name[,option]...{{/:localize}}</i>, where <i>name</i> is the name of
the attribute being displayed; and, <i>option</i> is one or multiple of the possible options 
(<b>html</b>).
For example: <i>{{#desc}}Description: {{#:localize}}.{{/:localize}}{{/desc}}</i>
</li>

<li><b>:array</b> : This is a function that prints HTML containing editor inputs for an array
found in a document. The syntax for the ":array" function is:
<i>{{#:array selector}}template{{/:array}}</i>, where <i>selector</i> is the name of
the field which is an array; and, <i>template</i> is a Handlebars template used to edit each
element of the array.
For example: <i>Layers: {{#:array nunaliit_layers}}&lt;div&gt;{{#:field}}.{{/:field}}&lt;/div&gt;{{/:array}}</i>
</li>
</ul>
</p>

<p>Once a HTML fragment is generated using the Handlebars templating, the Show Service is called on the 
result to modify the HTML tags according to a set of rules. See the section on the 
<a href="#atlas_content_show_service">Show Service</a> for more details.
</p>


<!-- .................................................................. -->
<h3><a name="atlas_content_schema_arrays">Arrays in Schema Templates</a></h3>

<p>Arrays are supported in the templates provided by schemas. However, there is a
special case when it comes to input forms. In fact, Handlebars.js supports the
displaying of information found in arrays using the stock implementation. On the
other hand, a special Nunaliit function is provided to deal with the input side
of array elements.</p>

<p>For the purpose of demonstration, the following object structure is used
as document to be displayed and edited:
<pre>
{
	"data":{
		"title":"a Book"
		,"authors":[
			"John Smith"
			,"Jane Doe"
		]
	}
}
</pre>
</p>

<p>To display the array of authors, a template using the Handlebars iteration
primitives could be used:
<pre>
	{{#data}}
		{{#authors}} &lt;!-- this iterates over all authors --&gt;
			&lt;div&gt; {{.}} &lt;/div&gt;
		{{/authors}}
	{{/data}}
</pre>
</p>

<p>However, when it comes to editing a document containing an array, some operations
are required on the array itself: adding a new entry at the end of the array, deleting
an item from an array and resorting the order of the array. By using the function :array,
defined by Nunaliit, the proper HTML is added to manage the array operation. Within the
:array tags, a proper template must be provided to handle each element of the array. The
following is an example of a template to handle the input form for authors:
<pre>
	{{#data}}
		{{#:array authors}} &lt;!-- this iterates over all authors, adding HTML to manage array --&gt;
			&lt;div&gt; {{#:field}}.{{/:field}} &lt;/div&gt; &lt;!-- for an author name, use simple text input --&gt;
		{{/:array}}
	{{/data}}
</pre>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_content_schema_definition">Schema Definition</a></h3>

<p>The creation and maintenance of schemas can be quite daunting. This is because there are multiple
fields that must be kept synchronized with the attributes carried by documents of that schema. To help
with the synchronization of all these fields, a tool has been developed to alleviate the work: the commands
<a href="#command_add_schema">add-schema</a> and <a href="#command_update_schema">update-schema</a>.</p>

<p>These two commands, with the help of a schema definition file, can create and updates schemas based
on simpler means to define what is expected to be found in documents of that schema type. A schema 
definition is a JSON structure that specifies the information needed to produce a schema. If a schema is
derived from such a definition, then the definition can be found in the "definition" attribute. This means
that when a schema is stored on disk, its definition, if present, can be found in a file named 
"definition.json".</p>

<p>The structure of a schema definition is shown in the following example:
<pre>
{
	"group": "demo"
	,"id": "doc"
	,"label": "Document"
	,"emailOnCreate": false
	,"relatedSchemas": [ "demo_media" ]
	,"initialLayers": [ "public" ]
	,"attributes": [
		{...}
		,{...}
	]
}
</pre>
</p>

<p>The top attributes for the schema definition are defined as follows:
<ul>

<li><b>group</b> : This is a string and should be the name of the atlas, or some other name to represent
the group under which this schema falls under. This helps avoiding collisions in the global
schema name space.</li>

<li><b>id</b> : String which is the unique identifier for this schema under the given group. 
The resulting schema name if the concatenation of the group name and the schema identifier: 
&lt;group&gt;_&lt;id&gt;.</li>

<li><b>label</b> : This is a string presented to users of the atlas when referring to this schema.</li>

<li><b>emailOnCreate</b> : This is a boolean value indicating whether or not an email should be sent whenever a document of the particular schema type is created. It will email the user that created the document, all atlas vetters, as well as all atlas administrators. It defaults to false when not specified.</li>

<li><b>relatedSchemas</b> : This is an array of strings. Each entry in this array represents the name
of a schema which is related to this one.</li>

<li><b>initialLayers</b> : This is an array of strings. Each entry in this array represents a layer identifier
which is added to a document of this schema when first created.</li>

<li><b>attributes</b> : This is an array of objects. Each entry in this array represents an attribute
definition. The set of attribute definitions specifies the information carried by documents associated with 
this schema. This array of attribute definitions is the bulk of the schema definition.</li>

</ul>
</p>

<p>An example of an attribute definition is given here:
<pre>
{
	"id": "title"
	,"label":"Title"
	,"type": "string"
	,"includedInBrief": true
}
</pre>
</p>

<p>The top attributes for an attribute definition are defined as follows:
<ul>

<li><b>id</b> : This is a string that represents the name of the attribute under which information
is stored in documents associated with the schema. It is compulsory for all types except "title",
"geometry", "hover_sound", "createdBy" and "createdTime".</li>

<li><b>label</b> : This is a string presented to users of the atlas when referring to this attribute.</li>

<li><b>type</b> : This is a compulsory string that represents the type of the attribute. Possible values are:
<ul>
<li>string</li>
<li>localized</li>
<li>date</li>
<li>reference</li>
<li>array</li>
<li>tag</li>
<li>selection</li>
<li>checkbox</li>
<li>checkbox_group</li>
<li>file</li>
<li>title</li>
<li>geometry</li>
<li>hover_sound</li>
<li>nunaliit_key_media_ref</li>
<li>triple</li>
<li>createdBy</li>
<li>createdTime</li>
<li>custom</li>
</ul>
</li>

<li><b>textarea</b> : This is a boolean. If set, then when this attribute is shown in an editor, a
textarea is used to capture the content. When displayed, the spaces entered in the editor are preserved
for printed out.</li>

<li><b>disableDatePicker</b> : This is a boolean. If set to true on an attribute with type 'date', then the
date picker widget will not appear when a user attempts to edit a date attribute.</li>

<li><b>includedInBrief</b> : This is a boolean. If true, this attribute is included in the "brief"
portion of the schema. If includedInBrief is not specified, then it is assumed that it is set to false.</li>

<li><b>excludedFromDisplay</b> : This is a boolean. If true, this attribute is excluded from the "display"
portion of the schema. If excludedFromDisplay is not specified, then it is assumed that it is set to false.</li>

<li><b>excludedFromForm</b> : This is a boolean. If true, this attribute is excluded from the "form"
portion of the schema. If excludedFromForm is not specified, then it is assumed that it is set to false.</li>

<li><b>urlsToLinks</b> : This is a boolean. This option is applicable for "string" and "localized". If true, 
when the field is displayed, the URLs are converted to links.</li>

<li><b>wikiTransform</b> : This is a boolean. If true, this attribute is transformed using Wiki markup. If wikiTransform is not specified, then it is assumed that it is set to false.</li>

<li><b>subject</b>, <b>predicate</b>, and <b>object</b> : These are nested configurations that are parsed when "type" is set to "triple". These three should all be used together. It accepts "id", "label", and "type". When "type" is specified, triple configurations can accept "string", "localized", "reference", and "selection". The respective configuration options for those types apply.</li>

<p>An example of an triple definition using various types follows:
<pre>
{
	"type": "triple",
	"label": "Placename with Meaning",
	"id": "placename_with_meaning",
	"subject": {
		"label": "Placename Document",
		"type": "reference",
		"id": "placename"
	},
	"predicate": {
		"type": "selection",
		"id": "predicate",
		"options": [
			{
				"label": "has primary meaning",
				"value": "has_primary_meaning",
				"isDefault": true
			},
			{
				"label": "has secondary meaning",
				"value": "has_secondary_meaning",
				"isDefault": false
			}
		],
		"excludedFromDisplay": false,
		"excludedFromForm": false
	},
	"object": {
		"label": "Meaning",
		"type": "localized",
		"id": "meaning"
	}
}
</pre>
</p>


<li><b>elementType</b> : This is a string. "elementType" must be specified if "type" is set to "array".
"elementType" represents the type of the items in the array. It can take one of the following values:
<ul>
<li>string</li>
<li>localized</li>
<li>date</li>
<li>reference</li>
<li>triple</li>
</ul>
</li>

<li><b>elementOptions</b> : This is a nested configuration for configuring triples as elements of an array type, if "type" is "array" and "elementType" is "triple". The same configuration rules for triples applies under this option.</li>

<p>An example of an array of triples definition using various types follows:
<pre>
{
	"type": "array",
	"label": "Placenames with Meaning",
	"id": "placenames_with_meaning",
	"elementType": "triple",
	"elementOptions": {
		"subject": {
			"label": "Placename Document",
			"type": "reference",
			"id": "placename"
		},
		"predicate": {
			"type": "selection",
			"id": "predicate",
			"options": [
				{
					"label": "has primary meaning",
					"value": "has_primary_meaning",
					"isDefault": true
				},
				{
					"label": "has secondary meaning",
					"value": "has_secondary_meaning",
					"isDefault": false
				}
			],
			"excludedFromDisplay": false,
			"excludedFromForm": false
		},
		"object": {
			"label": "Meaning",
			"type": "string",
			"id": "meaning"
		}
	}
}
</pre>
</p>


<li><b>referenceType</b> : This is an optional string. This option is considered only if "type" is set to
"reference". If specified, influences how a reference is displayed. If set to "thumbnail", then
the first thumbnail found in the referenced document is shown.</li>

<li><b>customType</b> : This is a string that must be provided if the type is set to "custom". This
represents the name of the custom type.</li>

<li><b>searchFunction</b> : This is a string. This option is considered only if "type" is set to
"reference". This is the name of the function used to bring up a dialog to set a reference in the
"form" version of the schema. Nunaliit provides the following functions:
<ul>
<li><strong>getDocumentId</strong>: Provides the same search results as the atlas search box in module header.</li>
<li><strong>getDocumentFromSchema('&lt;schema-name&gt;')</strong>: Generates a list of documents using a specified schema name (e.g. 'demo-doc').</li>
<li><strong>getDocumentFromLayer('&lt;layer-id&gt;')</strong>: Generates a list of documents on a specified layer id (e.g. public).</li>
<li><strong>getDocumentFromModel('&lt;model-id&gt;')</strong>: Generates a list of documents in a specified model.</li>
<li><strong>getLayers</strong>: Displays a list of available atlas layers, similar to the layer select dialog window.</li>
<li><strong>getRelatedMedia</strong>: Filters the search results to a list of documents which have an attachment (e.g. if you did a search for the key word 'demo', and that returned a list of 10 documents, but only 3 of which had an attached media file. Only those 3 documents would display in the list).</li>
<li><strong>getRelatedImage</strong>: Filters the search results to a list of documents which have an attachment of the file class type 'image'.</li>
<li><strong>getRelatedAudio</strong>: Filters the search results to a list of documents which have an attachment of the file class type 'audio'.</li>
<li><strong>getRelatedVideo</strong>: Filters the search results to a list of documents which have an attachment of the file class type 'video'.</li>
<li><strong>getHoverSound</strong>: Filters the search results to a list of documents which have an attachment of the file class type 'audio'.</li>
</ul>
</li>

<li><b>maxHeight</b> : This is an integer that represents a number of pixels. This attribute is considered
only if "textarea" is set. When this option is set, the associated text area is displayed with a maximum 
height. This maximum height is equal to a number of pixels specified by the "maxHeight" option. If maxHeight
is specified but is zero or negative, it is ignored.</li>

<li><b>uploadOptional</b> : This is a boolean value that represents if a file attribute is optional
when a document is created. This attribute is considered
only if the type is "file". If ommitted, then a file upload is required in order to create a new
document.</li>

<li><b>placeholder</b> : This is a string. This attribute is considered only if the type is "string". 
If provided, it represents the "placeholder" attribute of the &lt;input&gt; or &lt;textarea&gt; elements
used in the form to accept entry of this attribute. In other words, it the input field is blank, it
offers a suggestion as to what to enter.</li>

<li><b>options</b> : This is an array of objects. "options" are considered only if the "type"
is set to "selection". Each entry in the array represents an option in the selection box.</li>
</ul>
</p>

<p>Each object in the "options" array have the following structure:
<ul>
<li><b>label</b> : This is a string. It must be specified. This is the text presented to
the user for this selection option.</li>

<li><b>value</b> : This is a string. It must be specified. This is the text used as value in
the document when this selection option is chosen.</li>

<li><b>isDefault</b> : This is a boolean. If not specified, it is assumed to be false. This
attribute should be set on a single selection option. This is the selection option that is
first shown to the user when no value is set.</li>
</ul>
</p>

<li><b>checkboxes</b> : This is an array of objects. "checkboxes" are considered only if the "type"
is set to "checkbox_group". Each entry in the array represents a checkbox in the group. Each object in the "checkboxes" array have the following structure:
<p>
<ul>
<li><b>id</b> : This is a string. It must be specified. This is the name of the attribute,
in the document, where the state of the checkbox is stored.</li>

<li><b>label</b> : This is a string. It must be specified. This is the text presented to the
user to inform about this checkbox.</li>
</ul>
</p>
</li>

<p>The following is a complete example of creating a new schema using this approach:
<ol>
<li>nunaliit add-schema --group demo --id place</li>
<li>Edit the file .../docs/schema.demo_place/definition.json and modify the content:
<pre>
{
	"group": "demo"
	,"id": "place"
	,"label": "Place"
	,"relatedSchemas": [ "place_media" ]
	,"initialLayers": [ "places" ]
	,"attributes":[
		{
			"type":"title"
			,"label":"Place"
			,"includedInBrief":true
		}
		,{
			"type":"string"
			,"id":"name"
			,"label":"Name"
			,"includedInBrief":true
		}
		,{
			"type":"string"
			,"id":"description"
			,"label":"Description"
			,"textarea": true
		}
		,{
			"type":"date"
			,"id":"period"
			,"label":"Period"
		}
		,{
			"type":"reference"
			,"id":"author"
			,"label":"Author"
		}
		,{
			"type":"selection"
			,"id":"type"
			,"label":"Type"
			,"options":[
				{
					"label": "City"
					,"value": "city"
				}
				,{
					"label": "Village"
					,"value": "village"
				}
			]
		}
		,{
			"type":"checkbox"
			,"id":"verified"
			,"label":"Has been verified"
		}
		,{
			"type":"checkbox_group"
			,"id":"attributes"
			,"label":"Attributes"
			,"checkboxes": [
				{
					"id": "has_library"
					,"label": "Has a library"
				}
				,{
					"id": "has_postoffice"
					,"label": "Has a post office"
				}
			]
		}
	]
}
</pre>
</li>
<li>nunaliit update-schema --name demo_place</li>
<li>nunaliit update</li>
</ol>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_schema_custom_type">Schema Custom Type</a></h3>

<p>Schemas supports a variety of types: strings, localized strings, dates, numbers and references.
When this set of types is insufficient for an application, it is possible to define a
custom type. Custom types require a number of steps to be enabled in Nunaliit. This section
covers those requirements.</p>

<p>It is important to note that custom types are available for any type other than the primary
Javascript types. Nunaliit does not support custom types that translate to a primary type.</p>

<h4><a name="atlas_content_schema_custom_type_name">Naming Convention</a></h4>
<p>Within Nunaliit, there is a location used to store types. This location is accessible
by all components using Nunaliit. Therefore, the name of a custom type must be unique. Therefore,
we suggest that all names for custom types be prefixed with the name of the company or project
creating the type. For example, if company ABC was creating a new type of string, the name of the
custom type should probably be something like 'abcString'.</p>

<p>Names of custom types should be made of alphanumeric characters, including the underscore
character (_). All other special characters should be avoided.</p>

<h4><a name="atlas_content_schema_custom_type_definition">Definition File</a></h4>
<p>If a definition file is used to generate a schema where a custom type is used, then the
attribute type should be set to "custom" and the field "customType" should be set to the name
of the custom type. For example:
<pre>
{
	"group": "abc"
	,"id": "place"
	,"label": "Place"
	,"relatedSchemas": []
	,"initialLayers": []
	,"attributes":[
		{
			"type":"title"
			,"label":"Place"
			,"includedInBrief":true
		}
		,{
			"type":"custom"
			,"id":"name"
			,"label":"Name"
			,"includedInBrief":true
			,"customType": "abcString"
		}
	]
}
</pre>
</p>

<h4><a name="atlas_content_schema_custom_type_rendering">Rendering of Custom Type</a></h4>

<p>The Nunaliit framework offers an abstract class to manage custom types: nunaliit2.customType.CustomType</p>

<p>Creating a subclass to this abstract class is the easiest way to implement a custom type. Here is
an example to describe the process:
<pre>
var AbcStringCustomType = $n2.Class('AbcStringCustomType',$n2.customType.CustomType, {

	initialize: function(opts_){
		var opts = $n2.extend({
			dispatchService: undefined
		},opts_);
		
		$n2.customType.CustomType.prototype.initialize.apply(this,arguments);
	},
	
	getTypeName: function(){
		return 'abcString';
	},

	show: function(opts_){
		var opts = $n2.extend({
    		elem: undefined
    		,doc: undefined
    		,selector: undefined
    		,showService: undefined
    		,m: undefined
		},opts_);

		var $elem = opts.elem;
	    var doc = opts.doc;
	    var selector = opts.selector;
	    var showService = opts.showService;
	    
		var value = doc;
		if( selector ){
			value = selector.getValue(doc);
		};
		
		$elem.empty();
		
		if( value && value.str ){
			$elem.text( '***' + value.str + '***' );
		};
	},
	
	fieldHandler: function(opts_){
		var opts = $n2.extend({
	        elem: null
	        ,doc: null
	        ,selector: null
	        ,callbackFn: null
		},opts_);

		var $elem = opts.elem;
	    var doc = opts.doc;
	    var selector = opts.selector;

		var $input = $('&lt;input&gt;')
			.attr('type','text')
			.appendTo($elem)
			.change(function(e){
				var $input = $(this);
				var str = $input.val();
				var value = {'abc':true,'str':str};
				if( '' === str ){
					value = undefined;
				};
				selector.setValue(doc,value);
				opts.callbackFn(value);
				return true;
			});
		
		var value = selector.getValue(doc);
		if( value && value.str ){
			$input.val(value.str);
		};
	}
});

window.nunaliit_custom.configuration = function(config, callback){

	// Install custom type: abcString
	new AbcStringCustomType({
		dispatchService: config.directory.dispatchService
	});
	
	callback();
};

</pre>
</p>

<p>There are three main concerns when creating a custom type. First, one must design the structure
of the data type. Second, one must implement a way to display the information found in the structure
to the user. This is usually a process where HTML is generated to show the state of the content.
Finally, one must design a method of entering or modifying the data found in the custom structure.
This is generally also a portion of HTML that actively interacts with an editor.</p>

<p>In the example above, the custom data follows this structure:
<pre>
{
	abc: true
	,str: <string>
}
</pre>
</p>

<p>When subclassing nunaliit2.customType.CustomType, three methods must be provided:
<ul>
<li><b>getTypeName</b>: This method returns the name of the custm type</li>
<li><b>show</b>: This method displays the data to the user</li>
<li><b>fieldHandler</b>: This method creates a portion of HTML that interacts with the editor
to change the state of the data.</li>
</ul>
</p>

<p>The "show" method produces HTML to represent the state of the custom type. It receives one parameter
which is an object containing all the attributes necessary to perform the display. Here is a list
of attributes:
<ul>
<li><b>elem</b>: jQuery element. This is where the description of the data should be inserted</li>
<li><b>doc</b>: Object. This is the complete document containing the custom type to be displayed.</li>
<li><b>selector</b>: Optional instance of nunaliit2.objectSelector.ObjectSelector. This is a 
selector representing where in the document the custom data should be retrieved. If selector is
not provided, then assume that the document is the actual value.</li>
<li><b>showService</b>: Instance of ShowService. This is useful for delegating display tasks to this
service.</li>
<li><b>m</b>: Event. Event that triggerred the custom display. Should not be used directly.</li>
</ul>
</p>

<p>The "fieldHandler" method produces HTML that actively interacts with the editor. This allows the
entry and modification of the custom type. At first, when the method is called, a HTML skeleton must be
produced to display the current state. This usually involves input fields to enable a user to change the
values found in the variable of custom type. Every time these values are changed, a callback function
must be called to report the change. The "fieldHandler" method receives one parameter
which is an object containing all the attributes necessary to perform the handling. Here is a list
of attributes:
<ul>
<li><b>elem</b>: jQuery element. This is where the description of the data should be inserted</li>
<li><b>doc</b>: Object. This is the complete document containing the custom type to be displayed.</li>
<li><b>selector</b>: Optional instance of nunaliit2.objectSelector.ObjectSelector. This is a 
selector representing where in the document the custom data should be retrieved. If selector is
not provided, then assume that the document is the actual value.</li>
<li><b>callbackFn</b>: Function. This must be called everytime the value of the custom type
variable is changed. This enables the editor to refresh all the perspective showing this variable.</li>
</ul>
</p>

<p>The "fieldHandler" method is given the responsibility to create HTML, at the given location (elem), to
accept information from the user. When the user changes the input, the new information should
be stored in the document (doc) at the location specified by the selector (selector). It is
important to call the callback function (callbackFn) every time the value is changed to
give the opportunity to the other views of the document to update themselves.</p>


<!-- .................................................................. -->
<h3><a name="atlas_content_show_service">Show Service</a></h3>

<p>Nunaliit provides the "Show Service" in its configuration. The Show Service is logic
that tranforms HTML according to a set of rules. The rules are defined by HTML classes assigned
to elements. The Show Service scans the HTML content for those special classes and performs
transformations accordingly.</p>

<p>The following example demonstrates how the Show Service can be used to insert a translation
into a HTML fragment:
<pre>
	&lt;span class="n2s_localize"&gt;Title&lt;/span&gt;
</pre>
If the above HTML was processed by the Show Service, then the word "Title" would be replaced by
an equivalent word in the currently selected language. Obviously, if the currently selected language
is English, then the word would remain unchanged. However, if the currently selected language was
French, then the content of the "span" element would be replaced with "Titre". Note that the translation
occurs only if a translation is found in the localization dictionary.
</p>

<p>In general, the classes used by the Show Service have a prefix of "n2s_".</p>


<h4><a name="atlas_content_show_service_invoking">Invoking the Show Service</a></h4>

<p>The Show Service can be retrieved in the configuration object via the directory object.</p>

<p>The Show Service is invoked after a schema is used to generate HTML and after the introduction
text is displayed. Therefore, any HTML specified in a schema or in a module introduction can take advantage
of the classes understood by the Show Service.</p>

<p>It is possible to call the Show Service directly via the function "fixElementAndChildren". Here
is an example of obtaining the Show Service in nunaliit_custom.js and asking it to transform some
HTML: 
<pre>
window.nunaliit_custom.configuration = function(config, callback){

	var showService = null;
	if( config && config.directory ){
		showService = config.directory.showService;
	};

	var doc = null;	
	if( showService ){
		showService.fixElementAndChildren($('#fixme'), {}, doc);
	};
	
	// Done with configuration
	callback();
};
</pre>
</p>


<h4><a name="atlas_content_show_service_context">Context Document</a></h4>

<p>Some transformations performed by the Show Service need a document in context. For example,
the class "n2s_insertFirstThumbnail" requests that the first thumbnail associated with a
document be displayed. In this case, no action can be taken unless a document is specified.</p>

<p>When invoking the Show Service directly, by calling the function "fixElementAndChildren", the
caller can specify the context document.</p>

<p>When the Show Service is invoked by the schema translation process, then the document used
during the schema translation is offered as the context.</p>

<p>If the Show Service is not invoked directly and there is no context document (introduction text),
or if the document in context is not the one desired, it is possible to use the HTML
attribute "nunaliit-document" to indicate the identifier of the document that should be used
in context.</p>

<p>In the following example, a portion of the introduction text is made to react to user events
associated with a particular document. The document in question has the identifier "12345".
<pre>
	&lt;div&gt;
		&lt;span class="n2s_userEvents" nunaliit-document="12345"&gt;This document&lt;/span&gt;
	&lt;/div&gt;
</pre>
</p>


<h4><a name="atlas_content_show_service_classes">Classes</a></h4>

<p>The following list describes the classes understood by the Show Service:
<ul>
<li><b>n2s_briefDisplay</b> : A HTML element with this class must contain only one child, which is
a text node. The content of the text node should be the identifier for a document. When the
Show Service detects the class "n2s_briefDisplay", it replaces the content of the element with
a brief description of the referenced document.</li>

<li><b>n2s_clickAddLayerFromDefinition</b> : When the Show Service detects an element with the class
"n2s_clickAddLayerFromDefinition", it verifies if the document in context is associated with a layer
definition. If so, it installs a "click" event handler on the element. When the element is clicked,
the map is added with a new layer based on the layer definition found in the context document.
If the document is not associated with any layer definition, then the element with the class
"n2s_clickAddLayerFromDefinition" is removed.</li>
	
<li><b>n2s_clickDelete</b> : When the Show Service detects an element with the class
"n2s_clickDelete", it installs a "click" event handler on the element. When the element is clicked,
the process to delete the context document is initiated.</li>
	
<li><b>n2s_clickEdit</b> : When the Show Service detects an element with the class
"n2s_clickEdit", it installs a "click" event handler on the element. When the element is clicked,
an edit session associated with the context document is initiated.</li>
	
<li><b>n2s_clickFindGeometryOnMap</b> : When the Show Service detects an element with the class
"n2s_clickFindGeometryOnMap", it verifies if the document in context is associated with a geometry.
If so, it installs a "click" event handler on the element. When the element is clicked, the map
is centred on the geometry. If the document is not associated with any geometry, then the element
with the class "n2s_clickFindGeometryOnMap" is removed.</li>
	
<li><b>n2s_clickLogin</b> : When the Show Service detects an element with the class
"n2s_clickLogin", it installs a click listener on the associated element. When the element
is clicked, the login form is shown.</li>
	
<li><b>n2s_clickMapEdit</b> : When the Show Service detects an element with the class
"n2s_clickMapEdit", it installs a click listener on the associated element. When the element
is clicked, if a map is shown, it is changed into edit mode.</li>
	
<li><b>n2s_convertTextUrlToLink</b> : When the Show Service detects an element with the class
"n2s_convertTextUrlToLink", it searches all text nodes within this element for possible
URLs. For each found URLs, it replaces the text with an anchor element (&lt;a&gt;) with
a "href" attribute pointing to the URL.</li>

<li><b>n2s_custom</b> : When the Show Service detects an element with the class
"n2s_custom", it dispatches a 'showCustom' message to find a handler to populate the
content of this element. When the class 'n2s_custom' is used, a number of attributes are
expected on the element. The attribute "nunaliit-custom" should be set to a name representing
the type of information that should be displayed. The optional attribute "nunaliit-document" can
be used to specify the context document. In the case of a schema,
this attribute is not necessary since the document in context is expected to be displayed.
Finally, the attribute "nunaliit-selector" should be used if a portion of the document to
be displayed must be specified. The syntax of the selector should follow that produced by
nunaliit2.objectSelector.</li>

<li><b>n2s_externalMediaLink</b> : This class is deprecated. Use <b>n2s_insertExternalMediaLink</b>
instead.</li>
	
<li><b>n2s_fullDisplay</b> : A HTML element with this class must contain an attribute named
"nunaliit-document" which contains the identifier of a document. When the
Show Service detects the class "n2s_fullDisplay", it replaces the content of the element with
a full description of the referenced document.</li>

<li><b>n2s_handleHover</b> : When the Show Service detects an element with the class
"n2s_handleHover", it installs a "hover" event handler on the element. When the element is moused
over, an event is sent to the dispatcher informing that the context document is hovered. This generally
results in behaviour specific to an atlas, such as playing "hover sound" or changing the colours
of associated geometries on the map.</li>

<li><b>n2s_insertDocumentList</b> : When the Show Service detects an element with the class
"n2s_insertDocumentList", it empties the element and replaces its content with a list
of reference links according to the requested list. The list of documents displayed is
based on the list type and a name. The list type is specified using the attribute "nunaliit-list-type".
The list name is specified using the attribute "nunaliit-list-name". Optionally, the attribute
"nunaliit-list-live" can be specified to keep the list updating with changes in state. 
Here are the list types offered by Nunaliit:
<ul>
<li><b>layer</b> : When the list type is "layer", then the attribute "nunaliit-list-name" should
be set to a comma separated list of layer identifiers. All documents found on those layers
are displayed in the list.</li>
<li><b>schema</b> : When the list type is "schema", then the attribute "nunaliit-list-name" should
be set to a comma separated list of schema names. All documents associated with those
schemas are displayed in the list.</li>
<li><b>model</b> : When the list type is "model", then the attribute "nunaliit-list-name" should
be set to the identifier of a document model. All documents reported by the identified
model are displayed in the list.</li>
</ul></li>

<li><b>n2s_insertExternalMediaLink</b> : A HTML element with this class must contain an attribute named
"nunaliit-attachment". The "nunaliit-attachment" attribute must contain the name of an attachment associated
with the context document. If an attachment with the given name is detected, then the element is populated 
with a link (&lt;a&gt; element) to reach the media file directly. This is useful for user that intend to 
download the media file. If the file originally uploaded to the database is available, then the original 
file is offered by the link. When the link element is clicked, the user is warned that the atlas is about to 
be exited, before following the link. This class is generally used with &lt;div&gt; tags.</li>

<li><b>n2s_insertFirstThumbnail</b> : When the Show Service detects the class "n2s_insertFirstThumbnail", 
it replaces the content of the element with an &lt;img&gt; tag that points to the first thumbnail
found within a document. If no thumbnail is available, then the element is emptied. 
Optionally, the attribute "nunaliit-document" can be supplied to specify which document contains the 
thumbnail. If "nunaliit-document" is not specified, then the document in context is used.</li>

<li><b>n2s_insertHoverSoundIcon</b> : When the Show Service detects an element with the class
"n2s_insertHoverSoundIcon", it verifies if the context document is associated with a hover sound. If so,
it appends the element with an icon looking like a speaker.
If the speaker icon is clicked, the hover sound is played. This is useful for environments with a touch
interface, where mouse hover is not generally dispatched to the atlas client.</li>

<li><b>n2s_insertLayerName</b> : A HTML element with this class must contain only one child, which is
a text node. The content of the text node should be the identifier for a layer. When the
Show Service detects the class "n2s_insertLayerName", it replaces the content of the element with
the name associated with the layer.</li>

<li><b>n2s_insertMailFormButton</b> : A HTML element with this class has its content replaced with
a link that opens a web mail form, when selected. The link is displayed only if the mail service
is configured to send web mail. The attribute 'nunaliit-label' can be added to the element to 
specify the text displayed by the link.</li>

<li><b>n2s_insertMediaPlayer</b> : A HTML element with this class must contain an attribute named
"nunaliit-attachment". The "nunaliit-attachment" attribute must contain the name of an attachment 
associated with the document in context. When the Show Service detects the class "n2s_insertMediaPlayer", 
it replaces the content of the element with an inline media player for the attachment. If a thumbnail is 
available, the thumbnail will be used as the initial image in the media player. Optionally, the attribute 
"nunaliit-document" can be supplied to specify which document contains the attachment. If "nunaliit-document" 
is not specified, then the document in context is used.</li>

<li><b>n2s_insertMediaView</b> : A HTML element with this class must contain an attribute named
"nunaliit-attachment". The "nunaliit-attachment" attribute must contain the name of an attachment 
associated with the document in context. When the Show Service detects the class "n2s_insertMediaView", 
it replaces the content of the element with an icon that represents the attachment. If a thumbnail is 
available, the thumbnail is used instead of the icon. Furthermore, when the icon or thumbnail is clicked 
by the user, the media is displayed using a dialog. Optionally, the attribute "nunaliit-document" can be 
supplied to specify which document contains the attachment. If "nunaliit-document" is not specified, then 
the document in context is used.</li>

<li><b>n2s_insertModuleName</b> : The content of this HTML element is replaced with the title of
a module document. The module document can be specified by providing the document identifier
using the attribute "nunaliit-document". If the attribute "nunaliit-document" is not specified, then
the document in context is used.</li>
	
<li><b>n2s_insertShowSplashPageButton</b> : A HTML element with this class has its content 
replaced with a link that opens the splash page, when clicked. The link is displayed only if the 
splash page widget is present. The attribute 'nunaliit-label' can be added to the element to 
specify the text displayed by the link.</li>

<li><b>n2s_insertTime</b> : A HTML element with this class must contain only one child, which is
a text node. The content of the text node should be a number that represents time, according to the
Javascript Date convention. When the Show Service detects the class "n2s_insertTime", it replaces
the content of the element with textual representation of the time based on the user's locale.</li>

<li><b>n2s_insertUserName</b> : A HTML element with this class has its content modified with displaying
the name of a user. The user name is initially obtained using one of two ways. One way is to insert
the user name has the only text element of the element. The second way is to set the user name
in the attribute named 'nunaliit-user'. The latter approach is preferred. The user name refers
to the identifier for that user found in the user database. When the Show Service detects the 
class "n2s_insertUserName", it replaces the content of the element with a span containing the display
name, if available, and a span containing the user name.</li>

<li><b>n2s_insertWidget</b> : A HTML element with this class has its content replaced with a widget.
The type of widget is specified by the attribute "nunaliit-widget". The configuration for the
widget is specified as a JSON object within the HTML element.</li>
	
<li><b>n2s_installMaxHeight</b> : When the Show Service detects an element with the class
"n2s_installMaxHeight", it installs a widget within the element to truncate the content
to a maximum size. The maximum size is specified using an attribute named <b>_maxheight</b>,
which should be set to a number that represents the maximum height in pixels. This widget
adds a link to expand and shrink the element.</li>

<li><b>n2s_installTiledImageClick</b> : This tranformation is specialized for documents that contain
tiled map resources as attachments. The HTML element with the class "n2s_installTiledImageClick"
should also have an attribute "nunaliit-attachment", which should be set to the directory name at the
root of all tiles. These tiles must all be uploaded as attachments to the context document. Finally,
the context document should also have an attachment called "tilemapresource.xml', which is a file
that conforms to the TMS (Tile Map Service). The show service installs a click handler on the element.
When the click handler is invoked, a display is rendered to show the tiled map.</li>

<li><b>n2s_localize</b> : HTML elements that have the class n2_localize have the text child element
replaced by text found to translate the initial text to the language in which the page is displayed.
Nunaliit offers tools to define string replacements from the native English strings, to
any other language. If the atlas page is displayed in a language other than English, that the language
is supported by a translation page and that the string found as child of the element is associated with
a translated replacement, then that replacement is used to populate the text of the element with the
"n2_localize" class.</li>

<li><b>n2s_preserveSpaces</b> : HTML elements that have the class n2s_preserveSpaces are modified
so that newline characters are respected. n2s_preserveSpaces is generally used in schema fields that are
accepted using a &lt;textarea&gt; tag in the "form" of the schema. This way, newline characters
inserted by users during document editing are displayed in other perspectives.</li>

<li><b>n2s_referenceLink</b> : A HTML element with this class must contain only one child, which is
a text node. The content of the text node should be the identifier for a database document.  When the
Nunaliit framework detects the class "n2s_referenceLink", it replaces the content of the element with
a brief description of the referenced document. Furthermore, the content is clickable and when clicked,
a selection to this document is dispatched to the framework. In general, this results in the new
document becoming the focus of the atlas.</li>

<li><b>n2s_select</b> : A HTML element containing this class must also have an attribute named "n2-choice".
When the show service detects this situation, it finds all children of the original element with a class
"n2s_choice". All the children are removed except for a child that has a matching "n2-choice" attribute.
Finally, the show service removes the child associated with the class "n2s_choiceDefault", unless no
matching choice was found. This is useful for creating a portion of HTML where only one of multiple
possible children is desired.</li>

<li><b>n2s_userEvents</b> : A HTML element containing this class is linked to the context document.
From this point on, when a user mouses over the element, the "userFocusOn" event is dispatched within
Nunaliit. Similarly, when a user clicks on the element, the "userSelect" event is dispatched. Finally,
when the user intention changes within Nunaliit, the classes "nunaliit_hovered", "nunaliit_selected"
and "nunaliit_found" are added, or removed, from the HTML element, following the user's intention.
Optional attributes "nunaliit-disable-click" and "nunaliit-disable-hover" can be set to "true" to prevent
the appropriate events from being dispatched.</li>

<li><b>n2s_wikiTransform</b> : A HTML element containing this class is expected to contain text
with Wiki markup. When the Show Service detects this element, the text is converted to HTML using
the wiki markup processor. The content of the original element is replaced with the HTML
markup.</li>
</ul>
</p>
<!-- .................................................................. -->

<h3><a name="atlas_content_wiki_markup">Wiki Markup</a></h3>
Nunaliit supports the use of various wiki markups for styling text contained in HTML elements that have the n2s_wikiTransform class. Found below are examples of how to add various markups supported by Nunaliit.

<h4>Headings</h4>

| Wiki Markup     	    | Result	               |
| ------------------------- |:------------------------:|
| ```=Heading 1=```         |   <h1>Heading 1<h1>      |
| ```==Heading 2==```       |   <h2>Heading 2</h2>     |
| ```===Heading 3===```     |  <h3>Heading 3</h3>      |
| ```====Heading 4====```   |    <h4>Heading 4</h4>    |

<h4>Bold and Italicizing Text</h4>

| Wiki Markup     	        | Result	           |
| ----------------------------- |:------------------------:|
| ```'''Bold''' text ```        |   **Bold** text          |
| ```''Italicizied'' text   ``` |    *Italicizied* text    |

<h4>Horizontal Rule</h4>
Wiki Markup Sample
```
----
```

Results of Wiki Markup
<hr>

<h4>Sections</h4>

Wiki Markup Sample
```
{{ class="abc" | alt="alt text"
Section content
}}
```

Results of Wiki Markup

<div class="abc" alt="alt text">
Section content
</div>


<h4>Lists</h4>
Wiki Markup Sample
```
*item a
*item b
**item b-2
``` 
Results of Wiki Markup
<ul>
<li>item a</li>
<li>item b
<ul><li>item b-2</li></ul>
</li>
</ul>

Wiki Markup Sample
```
#item a
#item b
##item b-2
``` 
Results of Wiki Markup
<ol>
<li>item a</li>
<li>item b
<ol><li>item b-2</li></ol>
</li>
</ol>

<h4>Hyperlinks</h4>

| Wiki Markup     	                  | Result	                      |
| --------------------------------------- |:---------------------------------:|
| <code>[[http://nunaliit.org]]</code>          |   <http://nunaliit.org>           |
| <code>[[http://nunaliit.org&#124;Nunaliit]]</code>  |   [Nunaliit](http://nunaliit.org) |

<h4>Insert a Nunaliit Show Service</h4>

| Show Service   	                  | Wiki Markup	                      |
| --------------------------------------- |:---------------------------------:|
| Insert a full view of a document (e.g. doc id = 0987654321) | <code>[[nunaliit:n2s_fullDisplay&#124;nunaliit-document="0987654321"]]</code>  |
| Insert an atlas media document (e.g. doc id =1234567890) | <code>[[nunaliit:n2s_insertMediaView&#124;nunaliit-document="1234567890" nunaliit-attachment="imagename.png"]]</code>|

<!-- .................................................................. -->
<h3><a name="atlas_content_navigation_document">Navigation Document</a></h3>

<p>A Table of Content (TOC) can be stored in a "navigation document" and be rendered as
part of the atlas interface. Details on how the navigation document is selected and where
it is displayed is specified with the <a href="#atlas_custom_moduleNavigation">default module and 
navigation documents</a>.</p>

<p>To explain the structure of the navigation document, an example is offered:
<pre>
{
	"_id": "12345"
	,"nunaliit_navigation": {
		"nunaliit_type":"navigation"
		,"title": {
			"nunaliit_type":"localized"
			,"en":"Our Atlas"
			,"fr":"Notre Atlas"
		}
		,"items":[
			{
				"title": {
					"nunaliit_type":"localized"
					,"en":"Default Module"
					,"fr":"Module de Base"
				}
				,"href": "./index.html?module=generic.module:default"
				,"items":[
					{
						"title": {
							"nunaliit_type":"localized"
							,"en":"Default Module"
							,"fr":"Module de Base"
						}
						,"href": "./index.html?module=generic.module:default"
					}
				]
			}
			,{
				"title": {
					"nunaliit_type":"localized"
					,"en":"Test Module"
					,"fr":"Module d'Essai"
				}
				,"module": "module.test"
			}
		]
	}
}
</pre>
</p>

<p>A navigation document contains an attribute titled "nunaliit_navigation" that is
associated with an object structure, the navigation structure. The navigation structure
contains three attributes:
<ul>
<li><b>nunaliit_type</b>: (Compulsory String) Must be set with a string that contains "navigation".</li>
<li><b>title</b>: (Compulsory String or Localized String) The title attribute can either be a string 
that contains the title of the entire atlas, or a localized string structure.</li>
<li><b>items</b>: (Compulsory Array) An array of objects, where each object represents a navigation item.</li>
</ul> 
</p>

<p>Each navigation item is a JSON object that contains some of these attributes:
<ul>
<li><b>title</b>: (Compulsory String or Localized String) The title attribute can either be a string that contains the title of the module (item), or a localized string structure.</li>
<li><b>href</b>: (Optional String) Full URL associated with the item. Either "href" or "module" must
be specified, but not both. When this item is selected, the full URL is used to jump to the new "page".</li>
<li><b>module</b>: (Optional String) Module identifier associated with the item. Either "href" or "module" must
be specified, but not both. When this item is selected, a new URL is computed and used to find the
new "page". The new URL is computed by taking the current URL and replacing the "module" parameter to
the value of the module identifier.</li>
<li><b>items</b>: (Optional Array) An array of navigation items. These items are sub-items
to the one being defined.</li>
</ul> 
</p>

<p>The navigation document used by an atlas can be specified in two manners:
<ol>
<li>By specifying the navigation document identifier in the URL by using the parameter "navigation".</li>
<li>By specifying the navigation document identifier in the custom service using the option 
"defaultNavigationIdentifier".</li>
</ol>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_atlas_language_configuration">Atlas Specific Languages</a></h3>

<p>The `nunaliit_atlas.json` file found under the `atlas` folder in an atlas template's `docs` folder can be configured to specify languages for the atlas. This overrides the default languages.</p>

```json
{
  "nunaliit_type": "atlas",
  ...
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
  ...
}
```

<p>If the `nunaliit_languages` key is provided, it must be an array of objects containing at minimum two properties: `name` and `code`. The `default` property should be set on at least one of the languages.</p>

<ul>
<li><b>name</b>: (Required string) The name of the language that can be chosen</li>
<li><b>code</b>: (Required string) The corresponding language code of the language</li>
<li><b>default</b>: (Boolean) Whether or not a provided language is the atlas default. At least one of the provided languages should be set to true, meaning at least one language should be a default language</li>
</ul> 

<!-- .................................................................. -->
<h3><a name="atlas_content_skeleton_document">Skeleton Document</a></h3>

<p>Skeleton documents are a class of documents, rather than a type. They are the documents
needed to structure the atlas and do not contain direct data that supports the story told
by an atlas.</p>

<p>During the "dump" command, it is possible to select only skeleton documents using a special
option.</p>

<p>The Nunaliit framework recognizes module, navigation and schema documents as 
skeleton documents. To have other documents selected as "skeleton", one must mark them
specially by setting the "nunaliit_skeleton" boolean field. The following example demonstrates
a document that would be selected as a skeleton document:
<pre>
{
	"_id": "12345"
	,"nunaliit_skeleton": true
	,"content": {
		"text": "Just a test"
	}
}
</pre>
</p>

<p>The "atlas" design document offers a view, named "skeleton-docs", to report all skeleton documents
found in a database.</p>

<p>If one wishes to create a new document type using a schema, where all instances of this type
are considered skeleton documents, then the "nunaliit_skeleton" flag should be added to the
"create" portion of the schema, as shown here:
<pre>
{
   "_id": "myschema:placename",
   "nunaliit_type": "schema",
   "nunaliit_schema": "schema",
   "name": "mySkeletonDoc",
   "label": "My Skeleton Doc",
   "isRootSchema": true,
   "create": {
       "content": {
           "text": ""
       },
       "nunaliit_schema": "mySkeletonDoc",
       "nunaliit_skeleton": true
   },
   "brief": ...,
   "display": ...,
   "form": ...
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_user_document">User Document</a></h3>

<p>CouchDB uses a special database, the _users database, to store information about
each user, such as user identifier, password and roles. This information is used to
perform authentication and authorization. In CouchDb, authorization is usually based
on roles assigned to a user.</p>

<p>The content of the _users database is accessible only to administrators. However, each
user can retrieve and modify the user document associated with that user. This exception
allows a user to change his or her own information, such as password, display name, etc.
However, the roles associated with a user can only be modified by an administrator.</p>

<p>In Nunaliit, some special fields are defined for user documents in addition to the ones
generally employed by CouchDb. This is information that the Nunaliit framework uses in association
with users that authenticate to the platform. This section covers the additional information
added to user documents. The following JSON structure is an example for a user document:
<pre>
{
   "_id": "org.couchdb.user:jsmith",
   "_rev": "1-abcdefg",
   "display": "John Smith",
   "type": "user",
   "name": "jsmith",
   "password_sha": "5ba675d7eb549a02b812e59f53a5029299307def",
   "salt": "5601de7a7d996d487bcf0fe7ae123456",
   "roles": [
       "demo_user"
   ],
   "nunaliit_emails": [
       "jsmith@company.com"
   ],
   "nunaliit_validated_emails": [
       "jsmith@company.com"
   ],
   "nunaliit_options": {
       "vetterNotificationDaily": false,
       "vetterNotificationInstant": true
   },
   "nunaliit_accepted_user_agreements": {
      "demo": {
         "atlas": "demo",
         "content": "This is an agreement between you, the user, and the provider...",
         "time": 1400217619737
      }
   },
   "nunaliit_answers": {
      "postscrap": {
         "favouriteColour": "red",
         "version": 1
      }
   },
   "nunaliit_atlases": {
      "demo": {
         "name": "demo",
         "auth": true
      }
   } 
}
</pre>
</p>

<p>Some of the attributes found in the user document are specific to the Nunaliit framework:
<ul>
<li><b>display</b> : This attribute is a string that contains the name of the user. 
This is the string that should be displayed when a user is reported in Nunaliit.</li>
	
<li><b>nunaliit_emails</b> and <b>nunaliit_validated_emails</b> : These attributes are an 
arrays of strings. Each string in the arrays represent an e-mail address associated with 
the user. These addresses can be used by the Nunaliit platform to inform the user via e-mail. 
The addresses stored in the array named "nunaliit_emails" are addresses provided by the user. 
The addresses found in the "nunaliit_validated_emails" are the ones that have been verified 
by the framework. This list can not be edited by the user.</li>
		
<li><b>nunaliit_options</b> : This attribute is covered later in this section.</li>
		
<li><b>nunaliit_accepted_user_agreements</b> : This attribute is used to keep track of
which atlases a user has accepted a user agreement. It also keeps track of the content of
the user agreement that the user actually agreed to.</li>
		
<li><b>nunaliit_answers</b> : This attribute keeps trask, on a per-atlas basis, of the answers
given during the user questionnaire. The user questionnaire is an optional feature where users
are asked questions the first time they authenticate with the atlas.</li>
		
<li><b>nunaliit_atlases</b> : This attribute keeps track of which atlas instance a user has
authenticated with.</li>
</ul> 
</p>

<p>The <b>nunaliit_options</b> attribute is a JSON object that contains various fields:
<ul>
<li><b>vetterNotificationDaily</b>: If this option is set (true) and that the user
is a vetter (see "vetter" role), then this user is sent a daily e-mail that lists
the outstanding files waiting for approval.</li>

<li><b>vetterNotificationInstant</b>: If a user is a vetter (see "vetter" role), then by default the user is immediately sent a e-mail each time an approval action is required in the atlas. If this option is present and set to false, the immediate emails are not generated.</li>

<li><b>advanced</b>: If this option is to true, then this user will have access to two advanced UI features: The model browser at bottom right corner and the tree view button in the doc info display panel.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_content_user_roles">User Roles</a></h3>

<p>Document creation and updates are controlled by a set of rules based on user roles.
Each user that authenticate to the atlas is represented by a document located in a special
database, the CouchDb _users database.</p>

<p>User documents contain a "roles" attribute, associated with an array of strings, where
each string contains a role assigned to that user. The roles used by Nunaliit to
control access are:
<ul>
<li><b>_admin</b>: This is a role defined by CouchDb. This role allows a
user to create new databases and delete them. It also allows a user to make
any modification to any database.</li>

<li><b>administrator</b>: This role allows a user to modify the roles
associated to other users. This role should be given to any user that
manages a set of atlas on a server.</li>

<li><b>&lt;atlas&gt;_administrator</b>: This role is an "atlas role" given to
a user that is ultimately responsible for the atlas: the Atlas Administrator.
An Atlas Administrator is allowed to create, modify and delete and documents
located on the associated atlas. The Atlas Administrator is also allowed to view
all user documents and, add or remove "atlas roles" to other users. They can also
create and delete users. An atlas role is depicted by a name that begins with 
the atlas name, followed by an underscore and the specific role.</li>

<li><b>&lt;atlas&gt;_vetter</b>: This role is associated to an atlas and defines
users that are "Atlas Vetter". An Atlas Vetter is allowed to approve or deny files
that were uploaded to the atlas. Until a file is approved, it is not accessible
for viewing by other users.</li>

<li><b>&lt;atlas&gt;_layer_&lt;name&gt;</b>: This atlas role should be given
to a user that manages a layer. Documents are associated to a layer via the
"nunaliit_layers" attribute. A document associated with a layer can not be modified or
deleted unless the user manages this layer. The only exception is the "public"
layer, which does not require a manager.</li>

<li><b>&lt;atlas&gt;_user</b>: This atlas role should be given to "Atlas Users" and
is useful only for a "locked-down" atlas. A locked-down atlas restricts the creation
of new documents to Atlas Users.</li>
</ul>
</p>

<!-- ****************************************************************************** -->
<h2><a name="atlas_model">Module Models</a></h2>

<p>Models are software entities that can be observed. Readers familiar with the
Model-View-Controller concept can readily understand the value of models within Nunaliit.</p>

<p>A module document can specify a number of models to be used by Nunaliit while displaying that
module. Other components, such as widgets, canvas, or other models can observe models defined this 
way. These connections are expressed within the module definition via the use of model identifiers.</p>

<p>Models defined within a module are managing a set of documents. As such, each model report
changes to the set of documents to observers. Changes usually include addtions, removals and the
updating of documents. Therefore, the models defined in a module could be referred to as
"document models".</p>

<p>Document models come in four general categories:
<ul>
<li><b>Data Sources</b> : Data sources are models that obtain documents from external
entities. For example, a couchDbDataSource fetches documents from a back end CouchDb database.</li>

<li><b>Filters</b> : Filters are models that connect to other models and restrict the
list of reported document based on a filter algorithm. As filters are dependent on
the state of another model, their configuration usually requires a "source model", which
specifies the identifier of the model to provide a state (document set).</li>

<li><b>Transforms</b> : Transforms are models that connect to other models and makes 
modifications to the observed documents. These modifications are then visible to
obervers of the tranforms.</li>

<li><b>Utilities</b> : Some models do not fall in the other categories and perform specialized
operations. These models can be referred to as utlity models.</li>
</ul>
</p>

<p>The models defined within a module document are specified in the module structure within
an array called "models". Here is an excerpt of a module document specifying models:
<pre>
{
	...
	"nunaliit_module": {
		...
		"models": [
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
					,{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "approved"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Approved"
						}
						,"visibility": true
					}
				]
			}
			,{
				"modelType":"timeFilter"
				,"modelId": "documentsFilteredByTime"
				,"sourceModelId": "documentModel"
				,"range": "2000/2020"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>Within the "models" array, a number of configuration objects are inserted, one for each
model defined within the module. Each object defining a model must include the following attributes:
<ul>
<li><b>modelType</b> : Required string. Type of model being defined.</li>
<li><b>modelId</b> : Required string. Identifier used to distinguish this model from all
others defined in the same module.</li>
</ul>
</p>

<p>Besides the two compulsory attributes (modelType and modelId), a number of other attributes can 
or must be specified. However, these other attributes are dependent on the model type and are 
imposed by each model. Refer to the documentation associated with each model type.</p>


<!-- .................................................................. -->
<h3><a name="atlas_model_couchdb_data_source">CouchDB Data Source</a></h3>

<p>A CouchDB Data Source is a model that retrieves documents from the back end CouchDB
database. It selects the retrieved documents based on selectors. All documents obtained
from selectors are merged into one set which are then visible to any observers (other
models, widgets or canvas).</p>

<p>A CouchDB Data Source is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "couchDbDataSource"
	,"modelId": "databaseDocuments"
	,"selectors": [
		{
			"type": "couchDbLayer"
			,"name": "Public"
			,"options": {
				"layerId": "public"
			}
		}
		,{
			"type": "couchDbSchema"
			,"name": "Demo Documents"
			,"options": {
				"schemaName": "demo_doc"
			}
		}
	]
}
</pre>
</p>

<p>At least one selector must be specified for CouchDB Data Source. There are currently two type
of selectors: one selector based on layers and one based on schemas.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_couchdbview_document_source">couchDbView Document Source</a></h3>

<p>A couchDbView document source is a model that holds a set of documents derived from a couch database view.</p>
 
<p>A couchDbView Document Source is configured in a module document under the "models" attribute. Here is an example of a configuration object:
<pre>
{
	"modelType": "couchDbView"
	,”modelId”: “myModelId”
	,”view": "myViewName"
	,”isSiteView”: true
	,”includeValue”: true
	,”startKey”: “2012-01-01”
	,”endKey”: “2018-01-01”
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b>: Required string that must be set to "couchDbView".</li>
<li><b>modelId</b>: Required string that must be set to an identifier that uniquely distinguishes this model from other ones.</li>
<li><b>view</b>: Required string that must be set to the CouchDb view name.</li>
<li><b>isSiteView</b>: Optional boolean. If set to true, the modelType will attempt to query a view in the site design document, otherwise it will query the view in the atlas design document.</li>
<li><b>includeValue</b>: Optional boolean. If set to true, the queried view document results will be include the returned docs in a ‘__view’ property. Otherwise, only the document will be returned.</li>
<li><b>startKey</b>: Optional string that if set would define the start of a range of key values to include from the queried view. For example if you had a view which included key values from “1” – “10”, and you only wanted documents from “5” – “10”, you could set the startKey value to “5”.</li>
<li><b>endKey</b>: Optional string that if set would define the end of a range of key values to include from a queried view.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_static_document_source">Static Document Source</a></h3>

<p>A static document source is a model that virtually creates the documents as specified in its `docs` array and makes them available to other components observing the model. It does not retrieve anything from the database.</p>

<p>A Static Document Source is configured in a module document under the "models" attribute. Here
is an example of a configuration object that creates a model holding a single document with the _id "example1" and other attributes as specified:
<pre>
{
	"modelType": "staticDocumentSource"
	,"modelId": "myDocuments"
	,"docs": [
		{
			"_id": "example1"
			,"title": "Example 1"
			,"description": "Just an example"
		}
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
	<li><b>modelType</b> : Required string that must be set to "staticDocumentSource"</li>
	<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
	distinguishes this model from other ones</li>
	<li><b>docs</b> : Optional array of documents. Specifies the set of documents that should
	be made available. If not specified, the initial set of documents is empty.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_time_filter">Time Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter is based on a time interval.</p>

<p>The time filter model is associated with a time interval. Each document presented by 
the source model is scanned for date structures. If any of the date structure found this way
intersects with the time interval set for the model, then the document is retained and passed
to observers. The documents that do not match the model's time interval are removed from the
managed set, or in toher words, filtered out.</p>

<p>A time filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "timeFilter"
	,"modelId": "time"
	,"sourceModelId":"databaseDocuments"
	,"range": "2011-05-01/-"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "timeFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
<li><b>range</b> : Optional string. Defines the range that the time filter operates over.</li>
</ul>
</p>

<p>When a time filter is first built, the allowed interval is the full range that is set. If a range
is not set, then range is computed as the union of all intervals observed in documents presented from
the source model.</p>

<p>The interval used by a time filter can be controlled dynamically. There are multiple ways to change the interval set for a time filter is to employ a widget. See the <a href="#atlas_widget_time_line">Timeline Widget</a> or <a href="#atlas_widget_date_range">Date Range Widget</a> for more details.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_no_time_filter">No-Time Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows documents that do not
contain any date structure.</p>

<p>A no-time filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "noTimeFilter"
	,"modelId": "noTime"
	,"sourceModelId":"databaseDocuments"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "noTimeFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_reference_filter">Reference Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows documents that are associated
with a specified reference and filters the other ones out.</p>

<p>A reference filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "referenceFilter"
	,"modelId": "docsWithReference"
	,"sourceModelId":"databaseDocuments"
	,"reference": "062e30d43cbd3d8529f199880506085a"
	,"references": [
		"0cab53021976eba1d41e664792062b54"
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "schemaFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
<li><b>reference</b> : Optional string. This is the identifier for a document.</li>
<li><b>references</b> : Optional array of strings. Each string in the array is a document
identifier.</li>
</ul>
</p>

<p>The filter is associated with a number of document identifiers established at configuration.
Each document observed from the source model is scanned from all references If any of the references
matches one of the configured document identifiers, the the document is allowed through the filter.
All other observed documents are filtered out.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_single_document_filter">Single Document Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows through only one document,
the one associated with the selected document identifier (selectedDocumentId). All other
documents are filtered out.</p>

<p>A single document filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "singleDocumentFilter"
	,"modelId": "selectedDocument"
	,"sourceModelId":"databaseDocuments"
	,"selectedDocId": "062e30d43cbd3d8529f199880506085a"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "singleDocumentFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
<li><b>selectedDocId</b> : Optional string. This is the identifier of the document that is
allowed through the filter.</li>
</ul>
</p>

<p>The filter is associated with a single document identifier, optionally established at configuration.
Only the document with an identifier matching the selected one is allowed through the filter.
All other observed documents are filtered out.</p>

<p>This filter can be set statically by using the attribute "selectedDocId" in the configuration.
Generally, the selected document identifier is set dynamically with the use of the 
<a href=#atlas_widget_document_selector">document selector widget</a>.</p>


<!-- .................................................................. -->
<h3><a name="atlas_model_multi_document_filter">Multi Document Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows through only a specified 
list of selected document identifiers (selectedDocumentIds). All other
documents are filtered out.</p>

<p>A single document filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "multiDocumentFilter"
	,"modelId": "multiDocFilter"
	,"sourceModelId":"databaseDocuments"
	,"selectedDocIds": [
            "fa17a8bab74388d7e6a8c5fb5d010a71",
            "fa17a8bab74388d7e6a8c5fb5d00fb25"
        ]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "multiDocumentFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
<li><b>selectedDocIds</b> : Optional array of strings. This is a list of document identifiers that are
allowed through the filter.</li>
</ul>
</p>

<p>The filter is associated with a multiple document identifiers, optionally established at configuration.
Only the document with an identifier matching the selected one is allowed through the filter.
All other observed documents are filtered out.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_layer_filter">Layer Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows documents that are associated
with a specified layer and filters the other ones out.</p>

<p>A layer filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "layerFilter2"
	,"modelId": "DocsFilteredByLayer"
	,"sourceModelId":"databaseDocuments"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "layerFilter2"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
</ul>
</p>

<p>The filter needs a widget to control which layer is allowed through the filter. See
<a href="#atlas_widget_layer_selection_widget">Layer Selection Widget</a> for example.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_document_filter_by_creator">Document Filter By Creator</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows documents that are associated
with a specified creator and filters the other ones out.</p>

<p>A document filter by creator is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "documentFilterByCreator"
	,"modelId": "DocsFilteredByCreator"
	,"sourceModelId":"databaseDocuments"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "documentFilterByCreator"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
</ul>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_model_filter">Filter</a></h3>

<p>This model is a filter, meaning that it connects to another model, a source model,
and filters documents from it. In this case, the filter allows documents that are associated
with a specified reference and filters the other ones out.</p>

<p>A reference filter is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "filter"
	,"modelId": "conditional"
	,"sourceModelId":"databaseDocuments"
	,"condition": "doc.demo_doc.description"
	,"useBuiltInFunction": "all"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "schemaFilter"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the filter observes</li>
<li><b>condition</b> : Optional string. This string is parsed and a condition is generated from it. </li>
<li><b>useBuiltInFunction</b> : Optional string. Name of a built-in function.</li>
</ul>
</p>

<p>Only one of "condition" or "useBuiltInFunction" should be specified.</p>

<p>If "condition" is used, then the filter tests each observed document against this condition. If
the condition return a value that is considered "true", then the document is allowed through. Otherwise,
it is filtered out.</p>

<p>If the filter is configured with "useBuiltInFunction", then the specified built-in function is
used for testing each document. The possible built-in funcitons are:
<ul>
<li><b>all</b> : All documents are allowed</li>
<li><b>none</b> : All documents are filtered out</li>
<li><b>withDates</b> : All documents that contain a date structure are allowed</li>
<li><b>withoutDates</b> : All documents that contain a date structure are filtered out</li>
<li><b>withoutGeometry</b> : All documents that contain a geometry structure are filtered out</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_time_transform">Time Transform</a></h3>

<p>This is a transform model, meaning that it connects to another model, a source model,
and tranforms documents from it. In this case, the documents are augmented with information
relating to a time interval.</p>

<p>The time transform model is associated with a time interval. Each document presented by 
the source model is scanned for date structures. The date structures are compared to the
configured time interval and the document is augmented with information on how well the document
matches.</p>

<p>A time transform is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "timeTransform"
	,"modelId": "time"
	,"sourceModelId":"databaseDocuments"
	,"range": "2011-05-01/-"
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "timeTransform"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string. Identifier of the model that the transform observes</li>
<li><b>range</b> : Optional string. Defines the range that the time transform operates over.</li>
</ul>
</p>

<p>When a time transformed is first built, the allowed interval is the full range that is set. If a range
is not set, then range is computed as the union of all intervals observed in documents presented from
the source model.</p>

<p>The interval used by a time filter can be controlled dynamically. There are multiple ways to change the interval set for a time filter is to employ a widget. See the <a href="#atlas_widget_time_line">Timeline Widget</a> or <a href="#atlas_widget_date_range">Date Range Widget</a> for more details.</p>

<p>All documents observed from the source model are made available to observers of the time transform.
The work performed by the time transform is stored in a special attribute on the document, named 
"_n2TimeTransform". The content of the object stored at _n2TimeTransform is:
<pre>
{
	"intersects": <boolean>
	,"intervalSize": <number>
	,"intersectionSize": <number>
	,"filterIntervalSize": <number>
}
</pre>
</p>

<p>The information found in the _n2TimeTransform object is explained here:
<ul>
<li><b>intersects</b> : Boolean. Set to true if any of the date structures intersects with the
model's time interval. Otherwise, false.</li>
<li><b>intervalSize</b> : Number. The size of the interval reported by the date structures found
in the document.</li>
<li><b>intersectionSize</b> : Number. The size of the inersection between the time interval reported
by the document and the one examined by the time transform.</li>
<li><b>filterIntervalSize</b> : Number. The size of the interval examined by the transform model.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_union">Union Model</a></h3>

<p>This is a utility model that accepts documents from multiple models and merge them into
one set of managed documents. Observers of this model are given the merged perspective.</p>

<p>A union model is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "union"
	,"modelId": "allDocs"
	,"sourceModelIds": [
		"time"
		,"noTime"
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "union"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelIds</b> : Required array of strings. Identifiers of the models that the 
union model observes</li>
</ul>
</p>

<p>All documents reported by the observed models are reported to the observers of the union
model.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_intersect">Intersect Model</a></h3>

<p>This is a utility model that accepts documents from multiple models and merge them into
one set of managed documents. The documents are added to the managed set only if they
are present in all the source models (intersection). Observers of this model are given 
the managed perspective.</p>

<p>An intersect model is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "intersect"
	,"modelId": "intersectionDocs"
	,"sourceModelIds": [
		"time"
		,"noTime"
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "intersect"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelIds</b> : Required array of strings. Identifiers of the models that the 
intersect model observes</li>
</ul>
</p>

<p>Only the documents reported by the all observed models are reported to the observers 
of the intersect model.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_schema_docs_join">Schema Documents Join Model</a></h3>

<p>This is a utility model that simplifies the process of consolidating document content. The utility accepts documents from a model and copies copyFromSchema document content into a copyToSchema document, which is stored under a '_schema-name' key in the copyToSchema. This allows atlas builders to access related document content more easily.</p>

<p>A schema documents join model is configured in a module document under the "models" attribute. Here is an example of a configuration object:
<pre>
{
	"modelType": "schemaDocsJoin"
	,"modelId": "joinedDocs"
	,"sourceModelId": "documentModel"
	,"joins": [
		{
			"copyToSchema": "myatlas_account",
			"copyToJoinKey": "myatlas_account.bank",
			"copyFromSchema": "myatlas_bank",
			"copyFromJoinKey": "_id",
			"keysToCopy": [
				"_id",
				"myatlas_bank.name"
			]
		},
		{
			"copyToSchema": "myatlas_account",
			"copyToJoinKey": "myatlas_account.person",
			"copyFromSchema": "myatlas_person",
			"copyFromJoinKey": "_id" 
		}
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "schemaDocsJoin"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string identifying the model that the 
schemaDocJoin model observes</li>
<li><b>joins</b> : Required array of objects which describes the joins performed with the following attributes;
<ul>
<li><b>copyToSchema</b> : Required string that must be set to the name of the copyToSchema.</li>
<li><b>copyToJoinKey</b> : Required string that must specify the key in the copyToSchema document which will be used to match with the copyFromSchema document.</li>
<li><b>copyFromSchema</b> : Required string that must be set to the name of the copyFromSchema.</li>
<li><b>copyFromJoinKey</b> : Required string that must specify the key in the copyFromSchema document which will be used to match with the copyToSchema document.</li>
<li><b>keysToCopy</b> : Optional array of strings which specify the keys which should be copied from the copyFromSchema to the copyToSchema. If this option is not used, the entire document's content will be copied.</li>
</ul>
</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_selectable_document_filter">Selectable Document Filters</a></h3>

<p>There exists a set of document filters that are based on the class SelectableDocumentFilter. All these
filters are used to filter out documents from a model stream based on specific conditions. What sets those
filters apart from others is that they all work with the generic filter widgets such as 
<a href="#atlas_widget_single_filter_selection_widget">Single Selection Filter Widget</a>,
<a href="#atlas_widget_multi_filter_selection_widget">Multiple Selection Filter Widget</a> and
<a href="#atlas_widget_multi_filter_selection_drop_down_widget">Multiple Selection Filter Drop-Down Widget</a>.</p>

<p>Since all these filters are based on the same class, they inherit a number of common options. These
options are explained here:
<pre>
{
	"modelType": &lt;dependent on filter type&gt;
	,"modelId": &lt;identifier for filter&gt;
	,"sourceModelId": &lt;identifier for source model&gt;
	,"initialSelection": [
		"test"
	]
	,"saveSelection": false
}
</pre>

<ul>
<li><b>initialSelection</b> : Optional array of strings. If specified, dictates what is the first
selection filtered by the model. Each string represents the identifier of an acceptable choice associated
with documents that are allowed through the model.</li>
<li><b>saveSelection</b> : Optional boolean. If set to true, the last selection is remembered from
one session to the next.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_document_filter_by_creator">Document Filter By Creator</a></h3>

<p>This is a subclass of <a href="#atlas_model_selectable_document_filter">Selectable Document Filter</a>.
Therefore all options of that class apply to this filter.</p>

<p>This is a document model that implements a filter. It filters documents based on the user that
created a document. Here is an example of a configuration:
<pre>
{
	"modelType": "documentFilterByCreator"
	,"modelId": &lt;identifier for filter&gt;
	,"sourceModelId": &lt;identifier for source model&gt;
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_layer_filter2">Layer Filter 2</a></h3>

<p>This is a subclass of <a href="#atlas_model_selectable_document_filter">Selectable Document Filter</a>.
Therefore all options of that class apply to this filter.</p>

<p>This is a document model that implements a filter. It filters documents based on the layers associated
with a document. Here is an example of a configuration:
<pre>
{
	"modelType": "layerFilter2"
	,"modelId": &lt;identifier for filter&gt;
	,"sourceModelId": &lt;identifier for source model&gt;
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_schema_filter">Schema Filter</a></h3>

<p>This is a subclass of <a href="#atlas_model_selectable_document_filter">Selectable Document Filter</a>.
Therefore all options of that class apply to this filter.</p>

<p>This is a document model that implements a filter. It filters documents based on the schema associated
with a document. Here is an example of a configuration:
<pre>
{
	"modelType": "schemaFilter"
	,"modelId": &lt;identifier for filter&gt;
	,"sourceModelId": &lt;identifier for source model&gt;
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_simultaneous_filters">Simultaneous Filters</a></h3>

<p>This is a document model constructs that combines multiple filters together.
It accepts multiple filters of type <a href="#atlas_model_selectable_document_filter">Selectable Document Filter</a>
and let them work in parallel.</p>

<p>A simultaneous filters model is configured in a module document under the "models" attribute. Here
is an example of a configuration object:
<pre>
{
	"modelType": "simultaneousFilters"
	,"modelId": "documents"
	,"sourceModelId": "sourceDocuments"
	,"filters": [
		{
			"modelType":"layerFilter2"
			,"modelId": "byLayer"
		}
		,{
			"modelType":"schemaFilter"
			,"modelId": "bySchema"
		}
	]
}
</pre>
</p>

<p>Here is an explanation of the configuration attributes:
<ul>
<li><b>modelType</b> : Required string that must be set to "simultaneousFilters"</li>
<li><b>modelId</b> : Required string that must be set to an identifier that uniquely
distinguishes this model from other ones</li>
<li><b>sourceModelId</b> : Required string that must be set to the identifier of the 
model that is observed.</li>
<li><b>filters</b> : Required array of objects. Each object in the array represent the
configuration object for a filter. The filter must be an implementation of 
<a href="#atlas_model_selectable_document_filter">Selectable Document Filter</a>. The configuration
objects in this array should respect the requirements of each type of filter with one exception:
the "sourceModelId" attribute should not be set. There should be at least two filters defined in
this array.</li>
</ul>
</p>

<p>Document models that are located down stream of this combination should use the identifier
for the "simultaneousFilters" to receive the resulting perspective. The widgets controlling
the independent filters within this construct should use directly the model identifier
of the component filter.</p>

<!-- .................................................................. -->
<h3><a name="atlas_model_custom_filters">Custom Model Filter:</a></h3>

<p>Nunaliit provides a large selection of model filters (as listed above), however its also possible to create your own custom model filter. This can be done by either extending an existing model filter class, or creating your own from scratch.</p>

<p>There’s no single way to create a custom model filter since it’s design and functionality is only limited by the imagination of the developer. So instead, this section provides the general process that is commonly followed to create and use a custom model filter.</p>

<b>General Steps:</b>
1. Develop the custom filter class code. Often this is written in nunaliit_custom.js, but it doesn’t need to be stored in this file. Again there is no single way to create a custom filter class, but Nunaliit does provide a large selection of different filter classes in it’s codebase to draw inspiration from. I would recommend looking at the [n2.modelFilter.js](https://github.com/GCRC/nunaliit/blob/master/nunaliit2-js/src/main/js/nunaliit2/n2.modelFilter.js) module for numerous filter examples, since you may find a class which can be extended.
2. You will also need to include a function (often stored in nunaliit_custom.js), to handle model create events. This function will be used to create a new custom filter object (based on class developed in step 1) when a dispatcher message includes a specific model type.
3. Next, inside an atlas module document, the custom filter will need to be used. Since the filters are model driven you will need to define the model(s) in your models.json file. Inside your models.json file, one of the defined models should have a model types that matches the model type being handled by the function in step 2.
4. (Optional) Lastly if the filter includes a widget, you will need to add it to your modules widgets.json file, and make sure the model id matches the model id specified in step 3.


<!-- ****************************************************************************** -->
<h2><a name="atlas_widget">Module Widgets</a></h2>

<p>Widgets are graphical representations, which may include controls, that can be added to 
the rendered display in Nunaliit. Widgets can be defined in a module document using the 
"widgets" array. Each entry in this array is a widget definition for a particular widget, 
which includes configuration information.</p>

<p>The following example shows a portion of the module definition which includes configuration
of widgets:
<pre>
	{
		...
		"widgets":[
			{
				"widgetType": "example_abc"
				,"containerId": "elemId"
			}
			,{
				"widgetType": "example_def"
				,"containerClass": "aDisplayClass"
			}
		]
		...
	}
</pre>
</p>

<p>Every widget definition includes a compulsory attribute: "widgetType". This attribute is a
string which identifies the type of widget the user is interested in having displayed by Nunaliit.
There are a number of pre-defined widget types. It is also possible to have custom widget types
implemented by an atlas. In all cases, if a widget definition includes a widget type which is not
recognized, the definition is ignored and the expected widget is not displayed.</p>

<p>A widget definition can optionally include an attribute named "containerId". This attribute is a
string, which should be set to an HTML element identifier (id). This indicates to
Nunaliit where the widget should be displayed. If the element associated with the identifier is not found, 
then the widget is not displayed.</p>

<p>A widget definition can optionally include an attribute named "containerClass". This attribute is a
string, which should be set to a class name found on one or multiple HTML elements. When the container 
class attribute is specified, the entire HTML tree is searched for elements that indicate this class 
name. For each found element, a widget is created and appended to the element. If no element is 
found with the specified class name, then the widget is not displayed.</p>

<p>If a widget definition does not include a "containerId" attribute nor a "containerClass" attribute,
then one instance of the widget is created at the default location, which is the content pane found in
the layout.</p>

<p>Besides the attributes specified above, a number of other attributes can or must be specified. However,
these other attributes are dependent on the widget type and are imposed by each widget. Refer to the
documentation associated with each widget type.</p>

<p>The remainder of this section deals with the widgets offered by Nunaliit and the requirements for 
the associated configuration objects.</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_create_document">Create Document Widget</a></h3>

<p>The "create document" widget adds a button to the display. When the button is pressed
by the user, the process of creating a new document is initiated.</p>

<p>The configuration object for the create document widget is examplified here:
<pre>
	{
		"widgetType": "createDocument"
		,"showAsLink": false
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : This is a required attribute and must be set to the string "createDocument"</li>

<li><b>showAsLink</b> : This is an optional boolean attribute. If set, the button used to
create a new document is rendered using an &lt;a&gt; element. Otherwise, if this attribute
is false or not defined, the button is rendered using a &lt;button&gt; element.</li>
</ul>
</p>

<p>If you wish to have the create document widget displayed in the module title bar, the
following definition is probably preferred:
<pre>
	{
		"widgetType": "createDocument"
		,"containerClass": "nunaliit_module_title"
		,"showAsLink": true
	}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_create_document_from_schema">Create Document From Schema Widget</a></h3>

<p>The "create document from schema" widget adds a button to the display. When the button is pressed
by the user, the process of creating a new document based on the configured schema is initiated.</p>

<p>Here is an example for the configuration object required for this widget:
<pre>
{
	"widgetType": "createDocumentFromSchema"
	,"schemaName": "demo_doc"
	,"showAsLink": false
	,"label": "Create a Demo Doc"
}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : This is a required attribute and must be set to the string 
"createDocumentFromSchema"</li>

<li><b>schemaName</b> : This is an required string attribute. This is the name of the schema
that should be used to create a new document.</li>
	
<li><b>showAsLink</b> : This is an optional boolean attribute. If set, the button used to
create a new document is rendered using an &lt;a&gt; element. Otherwise, if this attribute
is false or not defined, the button is rendered using a &lt;button&gt; element.</li>

<li><b>label</b> : This is an optional string attribute. If provided, the label for the link will be
set to the provided label string. </li>
</ul>
</p>

<p>If you wish to have this widget displayed in the module title bar, then the following
configuration should be used:
<pre>
{
	"widgetType": "createDocumentFromSchema"
	,"schemaName": "demo_doc"
	,"containerClass": "nunaliit_module_title"
	,"showAsLink": true
	,"label": "Create a Demo Doc"
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_duplicate">Duplicate Document Widget</a></h3>

<p>The duplicate document widget adds a button to the display. When the button is pressed
by the user, a clone of the currently selected document is created and an edit session
is started on the new copy.</p>

<p>Here is an example for the configuration object required for this widget:
<pre>
{
	"widgetType": "duplicateDocument"
	,"containerClass": "nunaliit_module_title"
	,"duplicateAllDocs": false
	,"duplicateOnSchemas": {
		"demo_doc": ["demo_doc","nunaliit_layers"]
		,"demo_media": "ALL_ATTRIBUTES"
	}
}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : This is a required attribute and must be set to the string 
"duplicateDocument"</li>

<li><b>duplicateAllDocs</b> : This is an optional attribute. If this attribute is set
to anything other than "false", then it must be set to a copy descriptor. If a copy
descriptor is set, then the duplicate document widget accepts to clone any selected document.</li>
	
<li><b>duplicateOnSchemas</b> : This is an optional Object attribute. The object should be
set with keys set to schema names and values set to copy descriptors. When a schema is referenced
in this manner, then the associated copy descriptor is used to create a clone of the selected
document.</li>

</ul>
</p>

<p><b>Copy Descriptor</b> A copy descriptor can be defined in one of the following ways:
<ul>
<li><b>false</b> : If set to false, then no copy is performed.</li>

<li><b>"ALL_ATTRIBUTES"</b> : If a copy descriptor is the string "ALL_ATTRIBUTES", then
all attributes found in a document are copied, except for attributes that should remain unique
to a document (_id, _rev, _attachments, nunaliit_attachements, nunaliit_created, 
nunaliit_last_updated, etc.)</li>

<li><b>Array of Strings</b> : If a copy descriptor an array of strings, then each string is
parsed as an object selector. Each selector is used to copy a portion of the source document
to the cloned one. Object selectors are parsed from a series of dotted keys. For examples,
"demo_doc", "demo_doc.title", etc. </li>

</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_document_selector">Document Selector</a></h3>

<p>The "document selector" widget adds a drop-down list to the display. The list
contains a set of documents and the widget enables a user to select one of them.</p>

<p>This widget requires two document models to operate correctly:
<ol>
<li><b>list model</b> : a document model used to establish the list used in the
drop-down</li>

<li><b>single document filter</b> : a filter for a single document. Usually, an 
instance of <a href="#atlas_model_single_document_filter">single document filter</a></li>
</ol>
</p>

<p>Here is an example for the configuration object required for this widget:
<pre>
	{
		"widgetType": "documentSelector"
		,"label": "Select one..."
		,"filterModelId": "selectedDocument"
		,"filterParameterId": "selectedDocumentId"
		,"listModelId": "documents"
		,"listLabelSelectors": [
			"demo_doc.name"
		]
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : This is a required attribute and must be set to the string 
"documentSelector"</li>

<li><b>label</b> : This is an optional localized string attribute. This is the label
used on the first drop-down option. This option is used when no document is selected.</li>

<li><b>filterModelId</b> : This is a required string attribute. This is the identifier for
a <a href="#atlas_model_single_document_filter">single document filter</a>, or another
model that behaves similarly.</li>

<li><b>filterParameterId</b> : This is an optional string attribute. If provided, it specifies
the name of the model parameter used to set the selected document identifier. If not specified,
it is assumed to be 'selectedDocumentId', since this is the parameter name used by the
<a href="#atlas_model_single_document_filter">single document filter</a>.</li>
<li><b>listModelId</b> : This is a required string attribute. This is the identifier for
a document model. The drop-down list is built from the documents observed from this
model. For each document reported by this model, an entry is added to the drop-down list.
The list is updated with changes observed in this model.</li>

<li><b>listLabelSelectors</b> : This is an optional array of strings. Each string represents
an object selector. Selectors are tested in declared order against each document used to 
create the list. The first valid value obtained from the selectors is used as text in the
list to represent the document. If selectors are ommitted, or if a valid value can not be
derived in this process, then the brief is used to represent the document in the list.</li>
</ul>
</p>

<p>For the document selector widget to function properly, it should be configured with two
related models, where the single document filter is fed by model used to generate the list.
Here is an example using the excerpt of a module document:
<pre>
"nunaliit_module": {
	"models": [
		{
			"_comment": "Load documents from database"
			,"modelType":"couchDb"
			,"modelId": "couchDb"
			,"selectors": [
				...
			]
		}
		,{
			"_comment": "Filter category documents"
			,"modelType":"schemaFilter"
			,"modelId": "categories"
			,"sourceModelId": "couchDb"
			,"schemaName": "demo_category"
		}
		,{
			"_comment": "Select a single category"
			,"modelType":"singleDocumentFilter"
			,"modelId": "selectedCategory"
			,"sourceModelId": "categories"
		}
	]
	,"widgets": [
		{
	        "widgetType": "documentSelector"
	        ,"label": "Categories"
	        ,"filterModelId": "selectedCategory"
	        ,"listModelId": "categories"
	     }
     ]
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_couchdb_selector">CouchDb Selector</a></h3>

<p>This widget displays a panel where different CouchDbDataSource selectors can be
enable/disable. Disabling a selector renders the documents managed by that selector invisible
to the observers. In general, it hides the information from these documents from the map or
canvas displayed to the user.</p>

<p>The CouchDbSelector widget must be used in conjunction with a CouchDbDataSource model.
Here is an example of a module document where a CouchDbDataSource model and a CouchDbSelector
widget are in use:
<pre>
{
	...
	"nunaliit_module": {
		"models": [
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
					,{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "approved"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Approved"
						}
						,"visibility": true
					}
				]
			}
			...
		]
		,"widgets": [
			{
				"widgetType": "couchDbSelector"
				,"sourceModelId": "documentModel"
			}
			...
		]
		...
	}
	...
}
</pre>
</p>

<p>The configuration object for defining a CouchDbSelector widget can contain the following
attributes:
<ul>
<li><b>widgetType</b> : Required string. Must be set to "couchDbSelector"</li>
<li><b>sourceModelId</b> : Required string. Must be set to the identifier for
a CouchDbDataSource model.</li>
</ul>
</p>

<!-- ... -->
<h3><a name="atlas_widget_exporting">Exporting Widgets</a></h3>

<h4>Export Widget</h4>

<p>This widget accepts a source model and will bring up the Export By Script dialog found in the Tools section.</p>

<pre>
{
	"widgetType": "exportWidget",
	"containerId": "myContainerWhereTheWidgetShouldGo",
	"sourceModelId": "mySourceModelId",
	"label": "Export"
}
</pre>

<ul>
	<li><b>widgetType</b>: A string. It must be "exportWidget" for the default behaviour.</li>
	<li><b>containerId</b>: A string. The "id" of an HTML element on the page that this element should render within.</li>
	<li><b>sourceModelId</b>: A string. The model ID of the model that contains state.</li>
	<li><b>label</b>: Optional, a string. The text that should be shown on the created widget element. Defaults to "Export" if not provided.</li>
</ul>

<h4>Model Export Widget</h4>

<p>This widget accepts a source model and will provide the state of the model for download as JSON. This will immediately start a download when clicked.</p>

<pre>
{
	"widgetType": "modelExportWidget",
	"containerId": "myContainerWhereTheWidgetShouldGo",
	"sourceModelId": "mySourceModelId",
	"label": "Download Model State"
}
</pre>

<ul>
	<li><b>widgetType</b>: A string. It must be "modelExportWidget" for the default behaviour.</li>
	<li><b>containerId</b>: A string. The "id" of an HTML element on the page that this element should render within.</li>
	<li><b>sourceModelId</b>: A string. The model ID of the model that contains state.</li>
	<li><b>label</b>: Optional, a string. The text that should be shown on the created widget element. Defaults to "Export <sourceModelId> Data" if not provided.</li>
</ul>

<p>If this widget is extended, it will also require "dispatchService" and "moduleDisplay" (from nunaliit_custom). If this widget is extended, note that there are pre and post download functions, plus a <b>shapeState</b> function that can be implemented.</p>


<!-- .................................................................. -->
<h3><a name="atlas_widget_legend">Legend Widget</a></h3>

<p>The legend widget is used to display a legend of the styles, each with an associated
description, in use by a canvas. For a legend widget to work properly, three details must
be configured appropriately:
<ol>
<li>The legend widget must be defined in the module's widget definitions</li>
<li>The associated canvas must be named</li>
<li>The styles to be displayed in the legend must have a label assigned.</li>
</ol>
</p>

<p>Here is an example of a legend widget definition:
<pre>
{
	...
	"nunaliit_module": {
		,"widgets": [
			{
				"widgetType": "legendWidget"
				,"containerClass": "nunaliit_content"
				,"sourceCanvasName": "The Map"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>In the previous example, the attributes "widgetType" and "containerClass" are similar
to any other widget. What is particular about this widget is the association to a specific
canvas via a named specified using "sourceCanvasName". Optionally a user can also define a  
"labels" array of strings to include in the legend and what order they should appear in.</p>

<p>To continue this example, the following excerpt could be used in the same module, where the
legend widget is associated with a map canvas:
<pre>
{
	...
	"nunaliit_module": {
		"map": {
			"canvasName": "The Map"
			,"styles":[
				{
					"condition": "true"
					,"label" :"Observation"
					,"normal": {
		                		"strokeColor": "#FF0093",
		                		"fillOpacity": 0.2
					}
				}
				,{
					"condition": "cluster.length > 1"
					,"label" :"Cluster"
					,"normal": {
						"fillColor": "#ee9900",
						"fontColor": "#ffffff",
						"pointRadius": 14,
						"fontFamily": "Courier New, monospace",
						"fontSize": "14px",
						"fontWeight": "bold",
						"graphicName": "square",
						"label": "=cluster.length",
						"labelAlign": "cm",
						"labelOutlineColor": "#000000",
						"labelOutlineWidth": 3,
						"labelXOffset": "0",
						"labelYOffset": "0",
						"strokeColor": "#ffffff",
						"strokeWidth":2 
					}
				}
			]
			...
		}
		...
	}
	...
}
</pre>
</p>

<p>The second part of this example shows how the map is given a canvas name identical to
the one specified in the legend widget definition. Also, the two styles in use are given labels
(Observation and Cluster). Styles without a label are not shown in the legend.</p>

<h4>Filterable Legend Widget</h4>
The filterable legend widget allows for model filtering control within a legend for a map canvas.

Note that the logic of the filterable legend widget is contained mostly in the upstream filter model (sourceModelId) where it will decide what documents to allow through and what labels show up.

A sample configuration follows:  
<pre>
{
	"widgetType": "filterableLegendWidgetWithGraphic",
	"name": "My Filterable Legend Widget",
	"containerId": "htmlElementId",
	"sourceModelId": "myFilteringModel",
	"sourceCanvasName": "My Map",
	"allLabel": "All Selections",
	"graphicType": "none"
}
</pre>

<ul>
<li><b>widgetType</b>: A string. It must be "filterableLegendWidgetWithGraphic" for the default behaviour.</li>
<li><b>name</b>: A string.</li>
<li><b>containerId</b>: A string. The "id" of an HTML element on the page that this element should start rendering in reference to.</li>
<li><b>sourceModelId</b>: A string. The "modelId" of the model that is providing documents to the filterable legend widget. This model should be a filter model. This will also be the source of documents for the state of the graphic to draw from, if the widget is specified to have a graphic.</li>
<li><b>sourceCanvasName</b>: A string. This is the name of the corresponding canvas that this widget will be drawn on.</li>
<li><b>allLabel</b>: A string. The name of the label that toggles all entries in the legend widget on or off.</li>
<li><b>graphicType</b>: A string.</li>
<ul>
		<li>
			"none", for no graphic to appear beside the legend
		</li>
		<li>
			"custom", where the user must override/extend the existing widget and define behaviour for drawing the graphic themselves. The function <i>drawCustom</i> must be implemented.
		</li>
</ul>
</ul>

If graphicType is not "none", then <i>prepareGraphicData</i> must be implemented.  
  
Advanced: The filterable legend widget contains a property <i>this.preloadCallback</i>, which is available to receive a function reference to load in data before loading in other data/graphics.

<!-- .................................................................. -->
<h3><a name="atlas_widget_navigation">Navigation Widget</a></h3>

<p>When Nunaliit is deployed, it generally includes a navigation bar based on the navigation
document defined for the atlas. However, it is possible to use the navigaiton widget to
insert a navigation bar anywhere in the module.</p>


<p>The configuration object for a navigation widget can contain the following attribute:
<ul>
<li><b>widgetType</b> : Required string. Must be set to "navigation"</li>
</ul>
</p>

<p>For positioning this widget, use "containerClass" and "containerId".</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_wait">Wait Widget</a></h3>

<p>The wait widget displays a representation of the tasks waiting for completion. This is a
way to convey to the user the reasons for delays. This is particularly useful for modules
where a large amount of data needs to be loaded.</p>

<p>Here is an example of the configuration object for this widget:
<pre>
	{
		"widgetType": "wait"
		,"showNames": true
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : Required string. This is must be set to "wait"</li>

<li><b>showNames</b> : Optional boolean. If set, the widget displays the names of
the tasks waiting for completion.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_polar_stereographic_projection_selector">Polar Stereographic Projection Selector Widget</a></h3>

<p>The "polar stereographic projection selector" widget adds a graphic representation of the north
to enable a user to select one of the polar stereographic projections used in a module. When specifying 
this widget, the graphic is displayed only if a number of conditions are met:
<ol>
<li>Multiple base layers must be specified in the map</li>
<li>Each base layer must specify a different projection</li>
<li>Each base layer must specify a polar stereographic projection</li>
</ol>
</p>

<p>Here is an example of the configuration object for this widget:
<pre>
	{
		"widgetType": "polarStereographicProjectionSelector"
		,"imageLocation": "nunaliit2/images/arctic.svg"
		,"imageRotation": 0
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>widgetType</b> : This is a required attribute and must be set to the string 
"polarStereographicProjectionSelector"</li>
	
<li><b>imageLocation</b> : This is an optional string attribute. If set, it specifies the relative
path to the image used to represent the arctic.</li>
	
<li><b>imageRotation</b> : This is an optional numbaer attribute. If set, it specifies the angle,
in degrees, to the prime meridian in the image.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_time_line">Timeline</a></h3>

<p>A timeline is dependent on one of two models: TimeFilter or TimeTransform. In fact, those two
models analyze the incoming documents for date structures and adjust the range of time according
to what is reported.</p>

<p>The timeline widget has two functions. First, it reports the range currently available in the
model. Second, it actuates the user intended interval. In this second function, the timeline widget
changes the interval reported by the model.</p>

<p>Here is an example of a timeline widget along with a TimeFilter model:
<pre>
{
	...
	"nunaliit_module":{
		"models":[
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
				]
			}
			,{
				"modelType":"timeFilter"
				,"modelId": "timeFilter"
				,"sourceModelId": "documentModel"
			}
		]
		,"widgets":[
			{
				"widgetType": "timeline"
				,"sourceModelId": "timeFilter"
			}
		]
		...
	}
	...
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_map_time_line_bridge">Timeline Associated with a Map</a></h3>

<p>The technology built to display a map, mapAndControl, is much older than some of the
models and widgets. Therefore, to use timelines with maps, a bridge is required.</p>

<p>Mainly, once a map is defined, a model to retrieve the same documents as the map is required.
Then, a timeTransform model is needed along with a bridge between the timeTransform model and
the map.</p>

<p>Here is an example:
<pre>
{
	...
	"nunaliit_module":{
		"models":[
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
				]
			}
			,{
				"modelType":"timeTransform"
				,"modelId": "timeTransform"
				,"sourceModelId": "documentModel"
			}
		]
		,"widgets":[
			{
				"widgetType": "timeline"
				,"sourceModelId": "timeTransform"
			}
			,{
				"widgetType": "timeTransformToMapAndControlBridge"
				,"sourceModelId": "timeTransform"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>The configuration object for defining a timeTransformToMapAndControlBridge widget can contain 
the following attributes:
<ul>
<li><b>widgetType</b> : Required string. Must be set to "timeTransformToMapAndControlBridge"</li>
<li><b>sourceModelId</b> : Required string. Must be set to the identifier of the associated
time transform model.</li>
</ul>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_widget_date_range">Date Range</a></h3>

<p>A date range widget can be used independently or with one of two models: TimeFilter or TimeTransform. In fact, those two models analyze the incoming documents for date structures and adjust the range of time according to what is reported.</p>

<p>Here is an example of a date range widget along with a TimeFilter model:
<pre>
{
	...
	"nunaliit_module":{
		"models":[
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
				]
			}
			,{
				"modelType":"timeFilter"
				,"modelId": "timeFilter"
				,"sourceModelId": "documentModel"
			}
		]
		,"widgets":[
			{
				"widgetType": "dateRange",
				"containerId": "module_title_bar",
				"sourceModelId": "timefilter"
			}
		]
		...
	}
	...
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_map_date_range_bridge">Date Range Associated with a Map</a></h3>

<p>The technology built to display a map, mapAndControl, is much older than some of the
models and widgets. Therefore, to use a date range widget with maps, a bridge is required.</p>

<p>Mainly, once a map is defined, a model to retrieve the same documents as the map is required.
Then, a timeTransform model is needed along with a bridge between the timeTransform model and
the map.</p>

<p>Here is an example:
<pre>
{
	...
	"nunaliit_module":{
		"models":[
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
				]
			}
			,{
				"modelType":"timeTransform"
				,"modelId": "timeTransform"
				,"sourceModelId": "documentModel"
			}
		]
		,"widgets":[
			{
				"widgetType": "dateRange",
				"containerId": "module_title_bar",
				"sourceModelId": "timeTransform"
			}
			,{
				"widgetType": "timeTransformToMapAndControlBridge"
				,"sourceModelId": "timeTransform"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>The configuration object for defining a timeTransformToMapAndControlBridge widget can contain 
the following attributes:
<ul>
<li><b>widgetType</b> : Required string. Must be set to "timeTransformToMapAndControlBridge"</li>
<li><b>sourceModelId</b> : Required string. Must be set to the identifier of the associated
time transform model.</li>
</ul>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_widget_model_to_map_and_control_bridge">Model to Map Bridge</a></h3>

<p>The previous example shows how a timeline and a time tranform model can be used to
control the features displayed on a legacy map (the "map" attribute of a module document).
</p>

<p>However, any model can be connected to a map via the modelToMapAndControlBridge widget.
When this widget is used, features displayed on the map, which are not also reported by the associated
model, are made invisible. The net effect is to leave on the map only features associated with
documents also reported by the model.</p>

<p>While the "timeTransformToMapAndControlBridge" is specialized for time transform models,
the "modelToMapAndControlBridge" can be used with any model.</p>

<p>Here is an excerpt of a module document using the "modelToMapAndControlBridge" to
control the features displayed on a map:
<pre>
{
	"nunaliit_module": {
		"models": [
			{
				"modelType":"couchDbDataSource"
				,"modelId": "documentModel"
				,"selectors": [
					{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "public"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Public"
						}
						,"visibility": true
					}
					,{
						"type":"couchDbLayer"
						,"options": {
							"layerId": "approved"
						}
						,"name": {
							"nunaliit_type": "localized"
							,"en": "Approved"
						}
						,"visibility": true
					}
				]
			}
		]
		,"widgets": [
			{
				"widgetType": "couchDbSelector"
				,"sourceModelId": "documentModel"
			}
			,{
				"widgetType": "modelToMapAndControlBridge"
				,"sourceModelId": "documentModel"
			}
		]
		,"map": {
			"coordinates": {
				"initialBounds": [-75.72,45.41,-75.67,45.43]
				,"autoInitialBounds": false
			}
			,"backgrounds": [
				{ 
					"name": "Google Satellite"
					,"type": "Google Maps"
					,"options": {
						"type": "SATELLITE"
						, "numZoomLevels": 19 
					}
				}
			]
			,"overlays": [
				{
					"id": "approved"
					,"name": {
						"nunaliit_type":"localized"
						,"en":"Approved Layer"
						,"fr":"Couche Approuvée"
					}
					,"type": "couchdb"
					,"options": {
						"layerName": "approved"
					}
					,"featurePopupDelayMs": 0
				}
				,{
					"id": "public"
					,"name": {
						"nunaliit_type":"localized"
						,"en":"Public"
						,"fr":"Couche Publique"
					}
					,"type": "couchdb"
					,"options": {
						"layerName": "public"
					}
					,"featurePopupDelayMs": 0
				}
			]
			,"toggleClick": true
			,"enableWheelZoom": true
		}
		...
	}
	...
}
</pre>
</p>

<p>The configuration object for defining a modelToMapAndControlBridge widget can contain 
the following attributes:
<ul>
<li><b>widgetType</b> : Required string. Must be set to "modelToMapAndControlBridge"</li>
<li><b>sourceModelId</b> : Required string. Must be set to the identifier of the source model.</li>
</ul>
</p>



<!-- .................................................................. -->
<h3><a name="atlas_widget_layer_selection_widget">Layer Selection Widget</a></h3>

<p>When a layer filter document model is in use (see <a href="#atlas_model_layer_filter">Layer Filter</a>),
a widget is required to control the which layers are filtered. This widget is used to control
the layer filter. 
</p>

<p>The layer selection widget can be specified, like any other widgets, by adding a widget configuration
object in the "widgets" array of the module document, as shown here:
<pre>
{
	"widgetType": "layerSelectionWidget"
	,"sourceModelId":"filterDocsByLayer"
    ,"containerClass": "nunaliit_module_title"
}
</pre>
</p>

<p>Here is an explanation of the attributes found in the layer selection configuration object:
<ul>
<li><b>widgetType</b> : Required string that must be set to 'layerSelectionWidget'.</li>
<li><b>sourceModelId</b> : Required string that must be set to model identifier for the
layer filter model.</li>
<li><b>containerClass</b> : Optional string. Specified the class of the element where the
widget should be displayed.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_single_filter_selection_widget">Single Selection Filter Widget</a></h3>

<p>There are a number of document filters that are based on the class
<a href="#atlas_model_selectable_document_filter">SelectableDocumentFilter</a>.
The single filter selection widget is a generic widget that allows a user to modify the filter,
one selection at a time.</p>

<p>The single filter selection widget can be specified, like any other widgets, by adding a widget 
configuration object in the "widgets" array of the module document. Since the document filter of
type 'documentFilterByCreator' is a subclass of SelectableDocumentFilter, the following example
demonstrates how the single filter selection widget can be used with one of those filters:
<pre>
{
	"nunaliit_module":{
		"models":[
			{
				"modelType":"documentFilterByCreator"
				,"modelId": "filterByCreator"
				,"sourceModelId": "couchDb"
			}
			...
		]
		,"widgets":[
			{
				"widgetType": "singleFilterSelectionWidget"
				,"sourceModelId":"filterByCreator"
			    ,"containerClass": "nunaliit_module_title"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>Here is an explanation of the attributes found in the layer selection configuration object:
<ul>
<li><b>widgetType</b> : Required string that must be set to 'singleFilterSelectionWidget'.</li>
<li><b>sourceModelId</b> : Required string that must be set to model identifier for the
controlled document filter model.</li>
<li><b>containerClass</b> : Optional string. Specified the class of the element where the
widget should be displayed.</li>
<li><b>allChoicesLabel</b> : Optional string. Specifies the label that should be used to
select all choices.</li>
<li><b>noChoiceLabel</b> : Optional string. Specifies the label that should be used to
deselect all choices.</li>
<li><b>tooltip</b> : Optional string. Specifies the tooltip text shown when a user hovers the cursor over the widget.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_multi_filter_selection_widget">Multiple Selection Filter Widget</a></h3>

<p>There are a number of document filters that are based on the class 
<a href="#atlas_model_selectable_document_filter">SelectableDocumentFilter</a>.
The multiple filter selection widget is a generic widget that allows a user to modify the filter,
allowing to control multiple selections simultaneously.</p>

<p>The multiple filter selection widget can be specified, like any other widgets, by adding a widget 
configuration object in the "widgets" array of the module document. Since the document filter of
type 'documentFilterByCreator' is a subclass of SelectableDocumentFilter, the following example
demonstrates how the multiple filter selection widget can be used with one of those filters:
<pre>
{
	"nunaliit_module":{
		"models":[
			{
				"modelType":"documentFilterByCreator"
				,"modelId": "filterByCreator"
				,"sourceModelId": "couchDb"
			}
			...
		]
		,"widgets":[
			{
				"widgetType": "multiFilterSelectionWidget"
				,"sourceModelId":"filterByCreator"
			    ,"containerClass": "nunaliit_content"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>Here is an explanation of the attributes found in the layer selection configuration object:
<ul>
<li><b>widgetType</b> : Required string that must be set to 'singleFilterSelectionWidget'.</li>
<li><b>sourceModelId</b> : Required string that must be set to model identifier for the
controlled document filter model.</li>
<li><b>containerClass</b> : Optional string. Specified the class of the element where the
widget should be displayed.</li>
<li><b>allChoicesLabel</b> : Optional string. Specifies the label that should be used to
select all choices.</li>
<li><b>tooltip</b> : Optional string. Specifies the tooltip text shown when a user hovers the cursor over the widget.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_multi_filter_selection_drop_down_widget">Multiple Selection Filter Drop-Down Widget</a></h3>

<p>There are a number of document filters that are based on the class 
<a href="#atlas_model_selectable_document_filter">SelectableDocumentFilter</a>.
The multiple filter selection widget is a generic widget that allows a user to modify the filter,
allowing to control multiple selections simultaneously using a drop-down list.</p>

<p>The multiple filter selection widget can be specified, like any other widgets, by adding a widget 
configuration object in the "widgets" array of the module document. Since the document filter of
type 'documentFilterByCreator' is a subclass of SelectableDocumentFilter, the following example
demonstrates how the multiple filter selection widget can be used with one of those filters:
<pre>
{
	"nunaliit_module":{
		"models":[
			{
				"modelType":"documentFilterByCreator"
				,"modelId": "filterByCreator"
				,"sourceModelId": "couchDb"
			}
			...
		]
		,"widgets":[
			{
				"widgetType": "multiFilterSelectionDropDownWidget"
				,"sourceModelId":"filterByCreator"
			    ,"containerClass": "nunaliit_module_title"
			}
		]
		...
	}
	...
}
</pre>
</p>

<p>Here is an explanation of the attributes found in the layer selection configuration object:
<ul>
<li><b>widgetType</b> : Required string that must be set to 'multiFilterSelectionDropDownWidget'.</li>
<li><b>sourceModelId</b> : Required string that must be set to model identifier for the
controlled document filter model.</li>
<li><b>containerClass</b> : Optional string. Specified the class of the element where the
widget should be displayed.</li>
<li><b>label</b> : Optional string. Specifies the label that should be used on the button that toggles
the display of the drop-down list.</li>
<li><b>showAsLink</b> : Optional boolean. If true, the button is displayed as a link.</li>
<li><b>allChoicesLabel</b> : Optional string. Specifies the label that should be used to
select all choices.</li>
<li><b>tooltip</b> : Optional string. Specifies the tooltip text shown when a user hovers the cursor over the widget.</li>
</ul>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_widget_splash_page">Splash Page</a></h3>

<p>Many sites feature a help splash page the first time a site is visited. Nunaliit offers
this function via the use of a widget. If the splash page widget is configured for a module,
then the first time this module is visited, the splash page is shown to the user.</p>

<p>In fact, the splash page can be made of multiple screens (pages) that a user can
click through before dismissing.</p>

<p>The splash page widget can be specified, like any other widgets, by adding a widget configuration
object in the "widgets" array of the module document, as shown here:
<pre>
{
	"widgetType": "splashPage"
	,"title": {
		"nunaliit_type":"localized"
		,"en": "Welcome"
		,"fr": "Bienvenue"
	}
	,"dialogWidth": 800
	,"version": 1
	,"cookieName": "NunaliitWelcomeSplashDontShow"
        ,"checkboxLabel": {
                "nunaliit_type": "localized"
                ,"en": "I agree to the Terms of Use"
                ,"fr": "J'accepte les conditions d'utilisation"
        }
        ,"cookieExpirySeconds": 300
        ,"checkboxRequired": true
        ,"checkboxRequiredMessage": "Please accept the Terms of Use to continue"
        ,"closeButtonLabel": "Continue"
	,"pages": [
		{
                	"html": {
				"nunaliit_type": "localized"
				,"en": "<p>Hello!</p>"
				,"fr": "<p>Salut!</p>"
                	}
		}
	]
}
</pre>
</p>

<p>Here is an explanation of the attributes found in the splash page configurtion object:
<ul>
<li>widgetType : Required string that must be set to 'splashPage'.</li>
<li>title : Optional string that specifies the title of the splash dialog. If not
set, defaults to "Welcome". This can be a localized string or a regular string.</li>
<li>dialogWidth : Optional number. It specifies the width of the dialog.</li>
<li>version : Optional number. This is the version of the splash page. If the splash page 
is later changed, this version can be increased. Users that have not yet seen this version 
of the splash page will be shown the page, again, at the next visit.</li>
<li>cookieName : Optional string. This is the name of the cookie, installed in the
user's browser, to keep track of whether the splash page has been seen, or not.</li>
<li>checkboxLabel : Optional string. This is the text to show next to the checkbox. This can 
be a localized string or a regular string. Defaults to "Do not show again"</li>
<li>closeButtonLabel : Optional string. This is the close button label. This can 
be a localized string or a regular string. Defaults to "Close"</li>
<li>cookieExpirySeconds : Optional number. Seconds from when the checkbox is clicked to when
the cookie (cookieName) expires. Defaults to 34560000 (400 days)</li>
<li>checkboxRequired : Optional boolean. If the checkbox is required to close the dialog.
Defaults to false.</li>
<li>checkboxRequiredMessage : Optional string. If the checkbox is required ("checkboxRequired": true)
and the user tries to close the dialog without checking the box, this is the message that is shown.
No default (nothing displayed if not set).</li>
<li>pages : Optional array of strings or array of localized strings. This array contains the
content of the pages displayed to in the splash screen.</li>
</ul>
</p>

<p>The pages for the splash screen can be defined in the module document. However, this might
not be the best approach:
<ul>
<li>It means that the pages must be copied in all modules</li>
<li>It means that the content of the pages is fixed and can not be derived from
information found the in the database.</li>
</ul>
</p>

<p>Another approach is to set the pages for the splash screen in the nunaliit_custom.js file.
This approach ensures that all modules using the splash screen are synchronized. Also, the
pages for the splash screen can be generated from information found in the database.</p>

<p>Here is an example where the splash pages are set from the nunaliit_custom.js file. This example
uses the dispatcher event 'splashWidgetSetPages':
<pre>

var g_dispatchService = null;

//++++++++++++++++++++++++++++++++++++++++++++++
function handleStart(m){
	g_dispatchService.send(DH,{
		type: 'splashWidgetSetPages'
		,pages: [
			{
				"nunaliit_type": "localized"
				,"en": "This is the help page"
				,"fr": "C'est votre page d'aide"
			}
		]
		,version: 2
		,cookieName: 'myAtlasSplash'
	});
};

//++++++++++++++++++++++++++++++++++++++++++++++
window.nunaliit_custom.configuration = function(config, callback){
	
	// Dispatch service
	if( config.directory.dispatchService ){
		g_dispatchService = config.directory.dispatchService;
		
		// Handler called when atlas starts
		g_dispatchService.register('obi','start',handleStart);
	};
	
	callback();
};
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_container">Widget Container</a></h3>

<p>A widget container is a widget that holds other widgets. Since a widget is a visual
element, its placement can be an essential attribute that an atlas designer wishes to control.</p>

<p>A widget container is itself a widget. But, it functions primarily as a holder for one or
multiple other widgets. In general, a widget container will be defined with a number of
widget configurations, representing each of the contained widget.</p>

<p>Here is an excerpt of a module document where a widget container is in use:
<pre>
{
	"nunaliit_module": {
		,"widgets": [
			{
				"widgetType": "aWidgetContainerType"
				,"containerClass": "nunaliit_module_title"
				,"widgets": [
					{
						"widgetType": "legendWidget"
						,"sourceCanvasName": "The Map"
					}
				]
			}
			...
		]
		...
	}
	...
}
</pre>
</p>

<p>From the above example, there are a number of points to note:
<ul>
<li>The container widget definition emcompasses defintion(s) for other widget (internal widgets)</li>
<li>Internal widget definitions do not specify the "containerClass" attribute, or any other placement
attribute</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_widget_collapsible_widget_container">Collapsible Widget Container</a></h3>

<p>This is a widget container used to add a button to a canvas. When the button is opened, a
sheet is shown with the content of other widgets. The internal widgets are selected from the
definition.</p>

<p>As an example, here is an excerpt of a module document where a collapisble widget container
is used to old a legend:
<pre>
{
	"nunaliit_module": {
		,"widgets": [
			{
		        "widgetType": "collapsibleWidgetContainer"
		        ,"containerClass": "nunaliit_content"
		        ,"addClasses": [ "abcdef" ]
		        ,"initiallyOpened": false
		        ,"widgets": [
				    {
				        "widgetType": "legendWidget"
				        ,"sourceCanvasName": "The Map"
				    }
		        ]
			}
			...
		]
		...
	}
	...
}
</pre>
</p>

<p>The definition of the collapsible widget container is similar to that of other widget
containers. Here are the attributes that differ from others:
<ul>
<li><b>initiallyOpened</b> : Boolean. If set, the widget will initialze opened, as opposed to
closed. The default behaviour is to initialize closed.</li>
<li><b>addClasses</b> : Array of strings. Class names to be added to the top element of the
widget. This is useful to allow a designer to change the theme of a particular widget.</li>
</ul>
</p>

<!-- ****************************************************************************** -->
<h2><a name="atlas_canvas">Module Canvas</a></h2>

<p>A canvas is a graphical representation, which may include controls, that is the main visual
vehicle for information. If a canvas is specified, it takes the place of the geographical
map.</p>

<p>A canvas can be defined in a module document using the "canvas" key. If a canvas is specified,
then the map key can not be included. Both "canvas" and "map" are mutually exclusive.</p>

<p>The following module document demonstrates the inclusion of a fake canvas:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		,"introduction": {
			"type": "html"
			,"content": "&lt;div class=\"intro\"&gt;&lt;b&gt;Welcome to a Nunaliit atlas served from CouchDB&lt;/b&gt;&lt;br/&gt;&lt;a href=\"./tools/index.html\"&gt;Nunaliit Tools&lt;/a&gt;&lt;/div&gt;"
		}
		,"canvas": {
			"canvasType": "typeOfCanvas"
		}
		,"display":{
			"defaultSchemaName":"genericDoc" 
		}
		,"edit":{
			"defaultSchemaName": "genericDoc"
			,"newDocumentSchemaNames": "ALL_SCHEMAS" 
		}
		,"search":{
			"disabled":false
			,"constraint": null
		}
		,"widgets":[
			{
				"widgetType": "createDocument"
				,"showAsLink": true
				,"containerId": "module_title_bar"
			}
		]
	}
}
</pre>
</p>

<p>The content of the canvas structure is dependent on the type of canvas. However, one key
must always be present: "canvasType". This is a string that describes the kind of canvas
desired. All other attributes in the canvas structure are interpreted based on the value of
"canvasType".</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_map">Map Canvas</a></h3>

<p>The "map" canvas uses OpenLayers (https://openlayers.org) to display map a dynamic map with data. 
The full documentation is at [[OpenLayers 6 Canvas|Map---OpenLayers-6-Canvas]]</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_customSvg">Custom SVG Canvas</a></h3>

<p>The "customSvg" canvas allows a module designer to replace the map with a custom SVG
image used to interact with the underlying data. When this canvas type is specified, a
SVG file must be provided. When the module is displayed, the specified SVG file is loaded
and presented to the user. There are means to capture user interactions with the image and
affect the behaviour of the atlas accordingly. Furthermore, it is possible to change the 
styling of the image based on changes in the atlas.</p>

<p>The customSvg canvas is designed to import SVG files created by other tools (Inkscape, OmniGraffle)
and integrate the image with the behaviour of the atlas.</p>

<p>A customSvg canvas is specified in a module document by using the canvas type "customSvg", as
demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas": {
			"canvasType": "customSvg"
			,"svgAttachment": "image.svg"
			,"cssAttachment": "style.css"
			,"elemIdToDocId":{
				"g3044":"2f6cf81060bfa0bcb5214a4e68403233"
				,"g3037":"2f6cf81060bfa0bcb5214a4e6840a227"
			}
			,"unselectIds":[
				"g3013"
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a customSvg canvas structure are defined
here:
<ul>
<li><b>canvasType</b> : This is a required string and must be set to "customSvg"</li>

<li><b>svgAttachment</b> : This is a required string. It represents the attachment name
for the SVG file. The SVG file must be an attachment to the module document.</li>

<li><b>cssAttachment</b> : This is an optional attribute. If specified, it must be a string. 
It represents the attachment name for a CSS file. The content of the CSS file is loaded and
included within the SVG file.</li>

<li><b>elemIdToDocId</b> : This is an optional attribute. If specified, it must be an object
which is a dictionary of strings. This dictionary is used to match portions of the SVG image
with documents found in the atlas. The keys represent identifiers of SVG elements found in
the file. The values represent identifiers for documents that are associated with the portions
of the SVG image.</li>

<li><b>unselectIds</b> : This is an optional attribute. If specified, it must be an array
of strings. Each string in the array represents a SVG element identifier that should
be associated with performing a de-selection.</li>
</ul>
</p>

<p>When the module is displayed, the SVG file is loaded and inserted in the canvas portion of
the viewport. Then, the content of the SVG image is scanned and portions are associated with
documents in the database. The associations between SVG elements and documents are bi-directional.
Mouse events with SVG elements are captured and the appropriate events for the associated document
are sent via the dispatcher. On the other hand, when events are received for documents that are
associated with SVG elements, those SVG elements are modified with classes that represent the
interactions.</p>

<p>The are two methods for associating SVG elements with database documents: using in-line attributes 
and using a dictionary. If someone is creating a SVG file manually (without the use of a tool), the 
in-line attributes approach is probably the easier. In this approach, to associate a SVG element to 
a document, one must add the class "n2canvas_linkDocId" to the element and an attribute named 
"n2-doc-id" that specifies the document identifier. Here is an example of a SVG file where in-line
attributes are used:
<pre>
&lt;?xml version="1.0"?&gt;
&lt;!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"&gt;
 
&lt;svg
	xmlns="http://www.w3.org/2000/svg" 
	version="1.1"
	width="100%" 
	height="100%" 
	viewBox="0 0 236 120"
	class="n2canvas_unselect"
	&gt;

	&lt;style type="text/css" &gt;
		 &lt;![CDATA[
			.normal {
				fill: lime;
				stroke: black;
				stroke-width: 1;
			}

			.n2canvas_hovered {
				fill: blue;
			}
			
			.n2canvas_selected {
				stroke: yellow;
			}
		]]&gt;
	&lt;/style&gt;

	&lt;rect 
		x="14" 
		y="10" 
		width="100" 
		height="100"
		class="normal n2canvas_linkDocId"
		n2-doc-id="0cab53021976eba1d41e66479206aa97"
		/&gt;

	&lt;circle 
		cx="150" 
		cy="55"
		r="50" 
		class="normal n2canvas_linkDocId"
		n2-doc-id="327130f3851bfc0e0c5e025c7b04639c"
		/&gt;
&lt;/svg&gt;
</pre>
</p>

<p>If the SVG file is produced by a tool, it might be inconvenient augmenting the resulting
file with in-line attributes since these attributes might be removed by the tool if an
edit of the image is required. In that case, an association dictionary is preferred. To
specify an association dictionary, a structure named "elemdIdToDocId" must be added to
the definition of the customSvg canvas. The keys of the dictionary represent identifiers
of elements found in the SVG element. The values represent identifiers for documents found
in the database. Here is an example of a SVG file:
<pre>
&lt;?xml version="1.0"?&gt;
&lt;!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"&gt;
 
&lt;svg
	xmlns="http://www.w3.org/2000/svg" 
	version="1.1"
	width="100%" 
	height="100%" 
	viewBox="0 0 236 120"
	class="n2canvas_unselect"
	&gt;

	&lt;style type="text/css" &gt;
		 &lt;![CDATA[
			.normal {
				fill: lime;
				stroke: black;
				stroke-width: 1;
			}

			.n2canvas_hovered {
				fill: blue;
			}
			
			.n2canvas_selected {
				stroke: yellow;
			}
		]]&gt;
	&lt;/style&gt;

	&lt;rect 
		id="g1001"
		x="14" 
		y="10" 
		width="100" 
		height="100"
		class="normal"
		/&gt;

	&lt;circle 
		id="g1002"
		cx="150" 
		cy="55"
		r="50" 
		class="normal"
		/&gt;
&lt;/svg&gt;
</pre>
To continue this example, here is the canvas structure that includes an association
dictionary:
<pre>
{
	"canvasType": "customSvg"
	,"svgAttachment": "image.svg"
	,"elemIdToDocId":{
		"g1001":"0cab53021976eba1d41e66479206aa97"
		,"g1002":"327130f3851bfc0e0c5e025c7b04639c"
	}
}
</pre>
</p>

<p>To provide visual cues to the user of the atlas, the styles of the SVG elements must be
modified to represent the interactions. To achieve this, the Nunaliit framework changes the
classes specified on the SVG elements to represent the state of the associated document. The
following classes are added or removed:
<ul>
<li><b>n2canvas_hovered</b> : This class is added to a SVG element when the associated
document is in focus. When the document goes out of focus, this class is removed.</li>

<li><b>n2canvas_selected</b> : This class is added to a SVG element when the associated
document is selected. When the document becomes unselected, this class is removed.</li>

<li><b>n2canvas_selectedHovered</b> : This class is added to a SVG element when the associated
document is both selected and in focus. When either conditions becomes false, this class is 
removed. When this class is present, both classes "n2canvas_hovered" and "n2canvas_selected"
are also present.</li>
</ul>
</p>

<p>Since the only changes made to the SVG elements as a result of user interactions are the additions
and removals of classes, the visual changes must be defined using a cascading style sheet (CSS). There
are two main approaches to inserting CSS in the SVG file. The first is to edit the file and insert
a style block. However, this is not pratical if using an external tool to modify the file, since
the CSS block might not be retained. The second approach is to store the CSS content in a file
attached to the module and specify the name of the attachment in the customSvg canvas definition
using the cssAttachment attribute. If a CSS file is specified, then the content is loaded and inserting in a style block within
the SVG content.</p>

<p>Example of a file containing CSS content is shown here:
<pre>
.n2canvas_hovered {
	fill: blue;
}

.n2canvas_selected {
	stroke: yellow;
}
</pre>
</p>

<p>There are instances when clicking on a particular SVG element should un-select all documents
currently selected. For example, if the background of the image is clicked, the desired behaviour
might be to return to the state previous to any document selected. In the approach using in-line 
attributes, this effect can be accomplished by adding the class 'n2canvas_unselect' to the elements
providing the de-selection. In the approach using an association dictionary, this effect is achieved
by listing the SVG identifiers in the section 'unselectIds' of the canvas definition.</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_customHtml">Custom HTML Canvas</a></h3>

<p>The "customHtml" canvas shows all the relationships between a number of selected
documents. The relations are shown in a sortable tabular format that allows a user to perform
analysis. Documents are selected based on schemas.</p>

<p>A custom html canvas is specified in a module document by using the canvas type "customHtml", as
demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas": {
			"canvasType": "customHtml"
    		        ,"htmlAttachment": "website.html"
			,"cssAttachment": "styling.css"
	 		,"elemIdToDocId": {
				"g1001":"0cab53021976eba1d41e66479206aa97"
				,"g1002":"327130f3851bfc0e0c5e025c7b04639c"
                        }
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a customHtml canvas structure are defined
here:
<ul>
<li><b>canvasType</b> : This is a required string and must be set to "customHtml"</li>

<li><b>htmlAttachment</b> : This is a required string. It represents the attachment name
for the HTML file. The HTML file must be an attachment to the module document.</li>

<li><b>cssAttachment</b> : This is an optional attribute. If specified, it must be a string. 
It represents the attachment name for a CSS file. The content of the CSS file is loaded and
included within the HTML file.</li>

<li><b>elemIdToDocId</b> : This is an optional attribute. If specified, it must be an object
which is a dictionary of strings. This dictionary is used to match portions of the HTML
with documents found in the atlas. The keys represent identifiers of HTML elements found in
the file. The values represent identifiers for documents that are associated with the portions
of the HTML.</li>

</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_referenceBrowser">Reference Browser Canvas</a></h3>

<p>The "referenceBrowser" canvas shows all the relationships between a number of selected
documents. The relations are shown in a sortable tabular format that allows a user to perform
analysis. Documents are selected based on schemas.</p>

<p>A reference browser canvas is specified in a module document by using the canvas type "referenceBrowser", as
demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas": {
			"canvasType": "referenceBrowser"
			,"schemaNames": [
				"demo_doc"
				,"demo_media"
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a referenceBrowser canvas structure are defined
here:
<ul>
<li><b>canvasType</b> : This is a required string and must be set to "referenceBrowser"</li>

<li><b>schemaNames</b> : This is a required array of strings. It represents the schemas selected.
All documents associated with these schemas are loaded in the browser.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_table">Table Canvas</a></h3>

<p>The table canvas displays data in an HTML table consisting of elements produced by an element generators, which can be in the format of a row or a cell.</p>

<p>Row elements represent a row in a table which contain cells that represent the values under each heading. 
A table canvas is specified in a module document by using the canvas type "table", as demonstrated below:</p>
<pre>
{
        "nunaliit_module": {
                "title":"Generic Atlas"
                ...
                ,"canvas": {
                        "canvasType": "table"
                	,"elementGeneratorType": "nameOfElementGenerator"
			,"elementGeneratorOptions": {
			}
                        ,"showRowCount": true
			,"sourceModelId": "idOfSourceModel"
			,"styleRules":[
			]
                }
                ...
        }
}
</pre>

<p>The attributes that should be specified in a table canvas structure are defined here:</p>
<ul>
<li><strong>canvasType</strong>: This is a required string and must be set to "table"</li>
<li><strong>sourceModelId</strong>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the table cells are created from. The string should point towards a ModelID that you define in the models.json for this module.</li>
<li><strong>elementGeneratorType</strong>: This is a required string providing the name of the <a href="#atlas_elementgenerator">ElementGenerator</a> which prepares the model documents for the table canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>
<li><strong>elementGeneratorOptions</strong>: Optional property containing possible options for the element generator.</li>
<li><strong>showRowCount</strong>: Optional property. When set to true, a row counter is displayed above the table.</li>
<li><strong>styleRyles</strong>: Optional property containing an array of style rules relating to the table. See example below:</li>
</ul>
<pre>
[
	{
		"condition":"true"
		,"selected":{
			"font-weight":"bold"
		}
		,"normal":{
			"background-color":"none" 
			,"font-weight":"normal"
		}
		,"hovered":{
			"background-color":"#ccffcc"
		}
	}
]
</pre>

<strong>Format of Row Elements</strong>: 
<pre>
{
	id: <string>  (Unique identifier for this element)
	cells: {
		"heading1": {
			value: "value1"
			,sortValue: "value1"
			,exportValue: "value1"
			,type: "string"
		}
		,"heading2": {
			value: "123456789"
			,display: function($td, cell, element){ ... }
			,sortValue: "ABC"
			,exportValue: "ABC"
			,type: "reference"
		}
	}
}
</pre>

<strong>Format of Cell Elements:</strong> 
<pre>
{
	id: <string>  (Unique identifier for this element)
	,row: <string> (Identifier of the row)
	,column: <string> (Identifier of the colmun)
	,value: "value1"
	,display: function($td, cell, element){ ... }
	,sortValue: "value1"
	,exportValue: "value1"
	,type: "string"  ("string" or "reference")
}
</pre>

<p>The attribute for each cell is described here:</p>
<ul>
<li><strong>value</strong>: Required. This is the value of the cell. It can be a string, a number, a boolean, etc. If it is a function, it will be called with the following signature: function(cell, row). Note that depending on the type of elements provided by the element generator, it is possible that the element is the cell or the row.</li>
<li><strong>sortValue</strong>: Optional. Value to be used when sorting the column based on this value. If not specified, the value is used.</li>
<li><strong>exportValue</strong>: Optional. Value to be used when table is exported. If not specified, the value is used. If this is a function, the following signature is used: function(cell, row). Note that depending on the type of elements provided by the element generator, it is possible that the element is the cell or the row.</li>
<li><strong>type</strong>: Optional. Type of the value. If not specified, it assumed to be 'string'. Supported types are 'string' and 'reference'.</li>
<li><strong>display</strong>: Optional. Function to be used when displaying this value to the user. This replaces the default behaviour and allows the element generator to supply any display function. When used, the following signature is used: function($td, cell, row).</li>
</ul> 

<strong>Table Header Element:</strong>
<p>One element can be provided to specify the columns and the order in which they should be displayed. This element has the following format:</p>
<pre>
{
	isHeader: true,
	columns: [
		{
			name: 'heading1'
			,label: 'First'
			,title: 'Explanation of First'
		}
		,{
			name: 'heading2'
			,label: {
				nunaliit_type: 'localized'
				,en: 'Second'
			}
			,title: {
				nunaliit_type: 'localized'
				,en: 'Explanation of Second'
			}
		}
	]
}
</pre>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_grid">Grid Canvas</a></h3>

<p>The "grid" canvas displays a collections of cells representing selected documents. </p>

<p>A grid canvas is specified in a module document by using the canvas type "grid", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas": {
			"canvasType": "grid"
			,"sourceModelId": "modelId"
			,"elementGeneratorType": "elementGeneratorName"
			,"elementGeneratorOptions": {
			}
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a grid canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "grid"</li>

<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the grid cells are created from. The string should point towards a ModelID that you define in the models.json for this module.</li>

<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the grid canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>

<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
<li><b>multiSelect</b>: Optional property, false by default. If true then multiple documents can be selected by clicking on them.</li>
</ul>
</p>


<p>Grid cell documents are commonly generated with an <a href="#atlas_elementgenerator"> ElementGenerator</a> with elements requiring the following properties to be use in a grid canvas:
<ul>
<li><b>element.id</b> : String. Unique identifier for this element (typically the element id is the id of an existing document)</li>
<li><b>element.sort</b> : Optional String. Used to sort the cells in the grid.</li>
<li><b>element.fragments</b> : Map of fragments that make this element. Gives a list of documents used to make up this element.</li>
<li><b>element.gridImage</b> : An object which contains two properties (doc and attachment) to provide the required information for the insertMediaView show service inserting an image into a grid cell. <ul>
<li><b>element.gridImage.doc</b> : Provides the doc id of the image</li>
<li><b>element.gridImage.attachement</b> : Provides the filename of the attachment</li>
</ul></li>

</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_vertical_timeline">Vertical Timeline Canvas</a></h3>

<p>The vertical timeline canvas presents a chronological vertical listing of selected documents. </p>

<p>A vertical timeline canvas is specified in a module document by using the canvas type "vertical_timeline", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas": {
			"canvasType": "vertical_timeline"
			,"sourceModelId": "modelId"
		}
		...
	}
}
</pre>
</p>

<p>The attributes that can be specified in a vertical timeline canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "vertical_timeline"</li>

<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the vertical timeline cells are created from. The string should point towards a ModelID that you define in the models.json for this module.</li>

<li><b>ascendingSortOrder</b>: This is an optional boolean value which can be set to either true (default) or false. If set to true, the timeline order is ascending, otherwise it's descending.</li>

<li><b>displayIndex</b>: This is an optional boolean value which can be set to either true (default) or false. If set to true, the side vertical timeline index is shown, if set to false the index is excluded from the canvas.</li>

<li><b>labelDateFormat</b>: This is an optional string which allows the user to define the format for the date labels in the canvas (e.g. “MMMM DD, YYYY”). Date formatting is provided using the luxon.js library, and available formatting options can be found on the <a href="https://moment.github.io/luxon/docs/manual/formatting.html#table-of-tokens"> luxon documentation page</a>.</li>

<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the vertical timeline canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>

<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
</ul>
</p>


<p>If vertical timeline items are generated with an <a href="#atlas_elementgenerator"> ElementGenerator</a>, each element should have the following properties;
<ul>
<li><b>element.id</b> : String. Unique identifier for this element (typically the element id is the id of an existing document)</li>
<li><b>element.sort</b> : String. Used to sort the items in the vertical timeline canvas.</li>
<li><b>element.label</b> : String. Used to specify the label for each item in the vertical timeline canvas.</li>
<li><b>element.fragments</b> : Map of fragments that make this element. Gives a list of documents used to make up this element.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_force_graph">Force Graph Canvas</a></h3>

<p>The force graph canvas displays nodes and links using a d3js (v 3.4.13) force graph layout.</p>

<p>A force graph canvas is specified in a module document by using the canvas type "forceGraph", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		,"canvas":{
			"canvasType": "forceGraph"
			,"elementGeneratorType": "nameOfElementGenerator"
			,"elementGeneratorOptions": {
			}
			,"force":{
				"gravity": 0.5
				,"friction": 0.6
				,"charge": -150
				
			}
			,"sourceModelId": "documentModel"
			,"background": {
				"fill": "#333333"
			}
			,"popup":{
				"delay": 2000
			}
			,toggleSelection: true
			,"styleRules":[
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that can be specified in a force graph canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "forceGraph"</li>
<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the canvas nodes and links. The string should point towards a modelId that you define in the models.json for this module.</li>
<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the force graph canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>
<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
<li><b>force</b>: Optional property containing overrides of various d3js force graph parameters. Default parameter values include; 
<ul>
<li><b>gravity</b>: 0.1</li>
<li><b>friction</b>: 0.9</li>
<li><b>theta</b>: 0.8</li>
<li><b>charge</b>: -30</li>
<li><b>chargeDistance</b>: null</li>
<li><b>linkDistance</b>: 30</li>
<li><b>linkStrength</b>: 1</li>
</ul></li>
<li><b>background</b>: Optional style properties for the canvas background</li>
<li><b>popup</b>: Optional property used to define the popup delay in milliseconds</li>
<li><b>toggleSelection</b>: Optional property used to turn on/off toggleSelection. 
If toggleSelection is set to true, a user is able to select a node when clicking on it, 
and unselect it when they click on it again.</li>
<li><b>styleRyles</b>: Optional property containing an array of style rules relating to the force graph. See Table Canvas documentation for example.</li> 
<li><b>nodeLabelOffsetX</b>: Positive or negative number indicating how much the label of the node should be offset horizontally relative to the node</li> 
<li><b>nodeLabelOffsetY</b>: Positive or negative number indicating how much the label of the node should be offset vertically relative to the node</li> 
</ul>
</p>

<p>Force graph elements are commonly generated with an <a href="#atlas_elementgenerator"> ElementGenerator</a> with elements requiring the following properties to be use in a force graph canvas:
<ul>
<li><b>element.id</b>: Required. Identifier that uniquely identifies the node or the link</li>
<li><b>element.isNode</b>: Set if this element is a node</li>
<li><b>element.isLink</b>: Set if this element is a link between two nodes</li>
<li><b>element.source</b>: Required for links. Node that is one end of the link</li>
<li><b>element.target</b>: Required for links. Node that is the other end of the link</li>
</ul>

The following attributes are added to the elements by the force graph canvas
<ul>
<li><b>x</b>: <number> X position. Added only to nodes.</li>
<li><b>y</b>: <number> Y position. Added only to nodes.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_radial">Radial Canvas</a></h3>

<p>The radial canvas displays nodes and links using a d3js (v 3.4.13) radial graph layout.</p>

<p>A radial canvas is specified in a module document by using the canvas type "radial", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		{
			"canvasType": "radial"
			,"elementGeneratorType": "nameOfElementGenerator"
			,"elementGeneratorOptions": {
			}
			,"sourceModelId": "documentModel"
			,"background": {
				"fill": "#333333"
			}
			,toggleSelection: true
			,"styleRules":[
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that can be specified in a radial canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "radial"</li>
<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the canvas nodes and links. The string should point towards a modelId that you define in the models.json for this module.</li>
<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the radial canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>
<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
<li><b>background</b>: Optional style properties for the canvas background</li>
<li><b>toggleSelection</b>: Optional property used to turn on/off toggleSelection. 
If toggleSelection is set to true, a user is able to select a node when clicking on it, 
and unselect it when they click on it again.</li>
<li><b>styleRyles</b>: Optional property containing an array of style rules relating to the radial canvas. See Table Canvas documentation for example.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_radial_tree">Radial Tree Canvas</a></h3>

<p>The radial tree canvas displays nodes and links using a d3js (v 3.4.13) cluster layout of radial lines.</p>

<p>A radial tree canvas is specified in a module document by using the canvas type "radialTree", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		{
			"canvasType": "radialTree"
			,"elementGeneratorType": "nameOfElementGenerator"
			,"sourceModelId": "documentModel"
			,"background": {
				"color": "#333333"
			}
			,"toggleSelection": true
			,"styleRules":[
			...
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a radial canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "radial"</li>
<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the canvas nodes and links. The string should point towards a modelId that you define in the models.json for this module.</li>
<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the radial canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>
<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
<li><b>background</b>: Optional style properties for the canvas background</li>
<li><b>toggleSelection</b>: Optional property used to turn on/off toggleSelection. 
If toggleSelection is set to true, a user is able to select a node when clicking on it, 
and unselect it when they click on it again.</li>
<li><b>styleRyles</b>: Optional property containing an array of style rules relating to the radial canvas. See Table Canvas documentation for example.</li>
</ul>
</p>

<p>If radial tree items are generated with an <a href="#atlas_elementgenerator"> ElementGenerator</a>, each element should have the following properties;
<ul>
<li><b>element.id</b>: String. Unique identifier for this element (typically the element id is the id of an existing document)</li>
<li><b>element.parentId</b>: String. If this element is part of a tree, id of parent element, otherwise set to null.</li>
<li><b>element.isNode</b>: Boolean. Set true if this is a node element (part of tree).</li>
<li><b>element.isLink</b>: Boolean. Set true if this is a link element (lines between nodes).</li>
<li><b>element.source</b>: Object. Element which is at the beginning of the line (only links).</li>
<li><b>element.target</b>: Object. Element which is at the end of the line (only links).</li>
<li><b>element.sortValue</b>: String. Value used to sort the elements between themselves.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_canvas_collapsible_radial_tree">Collapsible Radial Tree Canvas</a></h3>

<p>The collapsible radial tree canvas displays nodes and links using d3js (v 3.4.13).</p>

<p>A collapsible radial tree canvas is specified in a module document by using the canvas type "collapsibleRadialTree", as demonstrated below:
<pre>
{
	"nunaliit_module": {
		"title":"Generic Atlas"
		...
		{
			"canvasType": "collapsibleRadialTree"
			,"elementGeneratorType": "nameOfElementGenerator"
			,"sourceModelId": "documentModel"
			,"background": {
				"color": "#333333"
			}
			,"toggleSelection": true
			,"radius": 300
			,"originalAngle": 0
			,"collapseBeforeExpand": true
			,"transitionDuration": 250
			,"styleRules":[
			...
			]
		}
		...
	}
}
</pre>
</p>

<p>The attributes that should be specified in a radial canvas structure are defined here:
<ul>
<li><b>canvasType</b>: This is a required string and must be set to "radial"</li>
<li><b>sourceModelId</b>: This is a required string providing the id of a model. The model represents the collection of documents in which elements representing the canvas nodes and links. The string should point towards a modelId that you define in the models.json for this module.</li>
<li><b>elementGeneratorType</b>: This is a required string providing the name of the ElementGenerator which prepares the model documents for the radial canvas. This is the name of the ElementGenerator, whose behaviour will be defined by the following elementGeneratorOptions</li>
<li><b>elementGeneratorOptions</b>: Optional property containing possible options for the ElementGenerator.</li>
<li><b>background</b>: Optional style properties for the canvas background</li>
<li><b>toggleSelection</b>: Optional property used to turn on/off toggleSelection. 
If toggleSelection is set to true, a user is able to select a node when clicking on it, 
and unselect it when they click on it again.</li>
<li><b>radius</b>: Optional property used to set the radius size of canvas graph. Default radius is 300 pixels in size.</li>
<li><b>originalAngle</b>: Optional property used to define the starting angle for radial canvas. 0 is the default angle. </li>
<li><b>collapseBeforeExpand</b>: Optional property used to turn on/off collapsing before expanding a selection. Default is true</li>
<li><b>transitionDuration</b>: Optional property used to set the duration of transition. Default is 250 ms.</li>
<li><b>styleRyles</b>: Optional property containing an array of style rules relating to the radial canvas. See Table Canvas documentation for example.</li>
</ul>
</p>

<p>If collapsible radial tree items are generated with an <a href="#atlas_elementgenerator"> ElementGenerator</a>, each element should have the following properties;
<ul>
<li><b>element.id</b>: String. Unique identifier for this element (typically the element id is the id of an existing document)</li>
<li><b>element.parentId</b>: String. If this element is part of a tree, id of parent element, otherwise set to null.</li>
<li><b>element.isNode</b>: Boolean. Set true if this is a node element (part of tree).</li>
<li><b>element.isLink</b>: Boolean. Set true if this is a link element (lines between nodes).</li>
<li><b>element.source</b>: Object. Element which is at the beginning of the line (only links).</li>
<li><b>element.target</b>: Object. Element which is at the end of the line (only links).</li>
<li><b>element.sortValue</b>: String. Value used to sort the elements between themselves.</li>
<li><b>element.group</b>: String. Optional. Grouping nodes.</li>
<li><b>element.showArc</b>: Boolean. Optional. If set, an arc is drawn around this node.</li>
</ul>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_elementgenerator">ElementGenerator</a></h3>

<p><strong>Description:</strong> An instance of the ElementGenerator class is responsible for taking a set of documents from a data source and producing a set of graphic elements for a canvas.</p>

<p>The instance of the ElementGenerator is informed when the data set is changed and propagates those changes, in terms of elements, to the canvas. It is also responsible to keep track of user intents on the source documents, translate these intents in terms of elements and inform the canvas.</p>

<p>In reverse, an instance of the ElementGenerator is informed by the canvas when the user clicks or hovers an element. It translates these intents from elements to documents and informs the remainder of the system by sending the appropriate events through the dispatcher.</p>

<p>The algorithm used by instances of the ElementGenerator is to break up documents into fragments and then combine the fragments into elements.</p>

<strong>Elements provided to the canvas have the following attributes:</strong>
<ul>
<li><b>id</b>: String. Unique identifier for this element fragments: Array of Objects. Used internally by ElementGenerator</li>
<li><b>n2_selected</b>: Boolean. Set if element is selected</li>
<li><b>n2_selectedIntent</b>: String. Selection intent, if one is specified.</li>
<li><b>n2_hovered</b>: Boolean. Set if element is in focus</li>
<li><b>n2_hoveredIntent</b>: String. Focus intent, if one is specified.</li>
<li><b>n2_found</b>: Boolean. Set if the element is found.</li>
<li><b>n2_intent</b>: String. Effective intention (selected or hovered), if one is specified.</li>
<li><b>n2_doc</b>: Optional Object. Document, if only one is associated with the element.</li>
</ul>

<p>
<strong>Conversion of Documents to Elements:</strong>
doc 1---1 context 1---N fragment N---N element</p>

<ul>
<li><b>doc</b>: Must have the following attributes:<ul>
	<li>_id</li>
</ul></li>
<li><b>context</b>: Must have the following attributes:
	<ul>
	<li>n2_id : document identifier for the supporting document</li>
	<li>n2_doc : supporting document</li>
	<li>fragments : list of fragments generated from supporting document</li>
	</ul>
</li>

<li><b>fragment</b>: Must have the following attributes:
	<ul>
	<li>id : unique identifier for fragment</li>
	<li>n2_id : document identifier for the supporting document</li>
	<li>n2_doc : supporting document</li>
	<li>context : context associated with supporting document</li>
	<li>elements : element map, by element id, for each element associated with the fragment</li>
	</ul>
</li>

<li><b>element</b>: Must have the following attributes:
	<ul>
	<li>id : unique identifier for element</li>
	<li>fragments : map of fragments, by fragment id, making up element</li>
	</ul>
</li>
</ul>

<p>Elements are typically used with Nunaliit canvases, however each canvas has specific element property requirements. For example the <a href="#atlas_canvas_grid">Grid Canvas</a> requires elements to have a property called gridImage which specifies the document information for an image document. Consequently it’s common practice to extend the existing $n2.canvasElementGenerator.ElementGenerator class to create a custom ElementGenerator instance which generates elements with the required properties for the canvas type.</p>

<!-- ****************************************************************************** -->
<h2><a name="atlas_utilities">Module Utilities</a></h2>

<p>Utilities are logical processes that modifies the stock operations provided by Nunaliit, 
that can be added to a module document using the 
"utilities" array. Each entry in this array is a utility definition for a particular utility, 
which includes configuration information.</p>

<p>The following example shows a portion of the module definition which includes configuration
of utilities:
<pre>
	{
		...
		"utilities":[
			{
				"utilityType": "example_abc"
				,"abcOption1": "option"
			}
			,{
				"utilityType": "example_def"
				,"defOption1": "option"
			}
		]
		...
	}
</pre>
</p>

<p>Every utility definition includes a compulsory attribute: "utilityType". This attribute is a
string which identifies the type of utility the module designer is interested in having included.
There are a number of pre-defined utility types. It is also possible to have custom utility types
implemented by an atlas. In all cases, if a utility definition includes a utility type which is not
recognized, the definition is ignored.</p>

<p>Besides the attribute specified above, a number of other attributes can or must be specified. However,
these other attributes are dependent on the utility type and are imposed by the design of the
utility. Refer to the documentation associated with each utility type.</p>

<p>The remainder of this section deals with the utilities offered by Nunaliit and the requirements 
for the associated configuration objects.</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_assignLayerOnDocumentCreation">Assign Layer On Document Creation</a></h3>

<p>The "assign layer on document creation" utility adds a process that adds a particular
layer identifier to a newly created document.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "assignLayerOnDocumentCreation"
		,"layerId": "test"
		,"onlyWithGeometries": false
	}
</pre>
<pre>
	{
		"utilityType": "assignLayerOnDocumentCreation"
		,"layerId": ["test", "test2", "test3"]
		,"onlyWithGeometries": false
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "assignLayerOnDocumentCreation".</li>

<li><b>layerId</b> : This is a required string or array of strings attribute. It must be set to the identifier of the layer that should be added to a document upon creation.</li>

<li><b>onlyWithGeometries</b> : This is an optional boolean attribute. If set, the layer identifier is set on the new document only if
a geometry is associated with the document.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_filterMonitor">Filter Monitor</a></h3>

<p>The "filter monitor" utility observes the selected choices from a specified
document filter. On given state, it performs a specified action.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "filterMonitor"
		,"sourceModelId": "testModel"
		,"onAllSelected": {
			"actionType": "setFilterSelection"
			,"modelId": "targetModel"
			,"selection": ["choiceId1"]
		}
		,"onNotAllSelected": {
			...
		}
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "filterMonitor".</li>

<li><b>sourceModelId</b> : This is a required string attribute. It must be set to the identifier of the filter model 
that is monitored.</li>

<li><b>onAllSelected</b> : This is an optional object attribute. The object is an instance 
definition for an action. If specified, this action is executed when the monitored filter selects
"all".</li>

<li><b>onNotAllSelected</b> : This is an optional object attribute. The object is an instance
definition for an action. If specified, this action is executed when the monitored filter performs
a selection other than "all".</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_selectDocumentOnModuleIntroduction">Select Document on Module Introduction</a></h3>

<p>This utility selects one or multiple documents instead of displaying a regular module
introduction. This happens when a module is first loaded or when a user unselects the currently
displayed document.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "selectDocumentOnModuleIntroduction"
		,"docId": "1234abcd"
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "selectDocumentOnModuleIntroduction".</li>

<li><b>docId</b> : This is a string attribute. It must be set to the identifier of the document that should be selected as module introduction.</li>

<li><b>docIds</b> : This attribute is an array of strings. It must contain the document identifiers that should be selected as module introduction.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_selectDocumentOnFilterChange">Select Document on Filter Change</a></h3>

<p>This utility selects a document when an appropriate change is observed in a filter
document model. In particular, the document model must be one of the types compatible
with SelectableDocumentFilter (for example, one of its subclasses such as "documentFilterByCreator"
or "layerFilter2").</p>

<p>This utility registers with the specified filter model and observes changes in selection.
When the appropriate selection is observed, it sends an event to select the associated document.
The selection can be one or multiple simultaneous choices.</p>

<p>For example, if a model (identified as filterDocsByLayer) was filtering documents based
on layers, and that among the expected layers were "public" and "approved", the 
following configuration object for this utility could be used:
<pre>
    {
	    "utilityType": "selectDocumentOnFilterChange"
	    ,"sourceModelId": "filterDocsByLayer"
	    ,"performSelectedEvent": false
	    ,"selectionMap": {
	    	"123": "public"
	    	,"456": ["public","approved"]
	    }
	}
</pre>
</p>

<p>In this example, if the layer "public" was selected, then the document "123" would be
selected. On the other hand, if both layers "public" and "approved" were selected, then
document "456" would be selected.</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "selectDocumentOnFilterChange".</li>

<li><b>sourceModelId</b> : This is a required string attribute. It represents the identifier for the observed model.</li>

<li><b>performSelectedEvent</b> : This attribute is an optional boolean. If set, the utility uses event "selected", instead of "userSelect", as a means to select the document.</li>

<li><b>selectionMap</b> : This attribute is required. It is a map where keys are identifiers of documents to be selected. The value associated with each key can be either a string or an array of strings. The value or values represent the choices to be selected in the observed model.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_mapClusterClickToZoom">Map Cluster Click to Zoom</a></h3>

<p>This utility changes the behaviour that happens when a cluster is clicked on a map
canvas. This utility zooms the map.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "mapClusterClickToZoom"
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "mapClusterClickToZoom".</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_mapClusterClickToMultiSelect">Map Cluster Click to Multi Selection</a></h3>

<p>This utility changes the behaviour that happens when a cluster is clicked on a map
canvas. When this utility is specified, then all documents associated with the cluster
become selected.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "mapClusterClickToMultiSelect"
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to "mapClusterClickToMultiSelect"</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_utilities_mapClusterClickHandler">Map Cluster Click Handler</a></h3>

<p>This utility changes the behaviour that happens when a cluster is clicked on a map
canvas. When this utility is specified and a map cluster is clicked, one of two possible 
outcomes is performed: the map might be zoomed, or all the associated document might be
selected.</p>

<p>The selected behaviour is dependent on the number of documents associated with the
cluster and the map resoultion.</p>

<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "mapClusterClickHandler"
		,"minimumCountToZoom": 6
		,"minimumResolutionToZoom": 5
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to
"mapClusterClickToMultiSelect".</li>

<li><b>minimumCountToZoom</b> : This is an optional number attribute. If a cluster
is associated with a number of documents equal or greater to this number, then a zoom
of the map is performed.</li>

<li><b>minimumResolutionToZoom</b> : This is an optional number attribute. If the
resolution of the map is smaller or equal to this number, then a multi-selection
is performed instead of a zoom.</li>
</ul>
</p>
<!-- .................................................................. -->
<h3><a name="atlas_utilities_mapAutoZoom">Map Auto Zoom</a></h3>
<p>This utility automatically changes the viewport to fit all the features on a module's map (or new ol5 canvas), whenever its source model updates. This happens after all the updated features finish loading.
</p>
<p>An example of the configuration object for this utility is shown here:
<pre>
	{
		"utilityType": "mapAutoZoom"
		,"includes" : [
                      [-75.72,45.41,-75.67,45.43]
                 ]
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:</p>
<ul>
<li><b>utilityType</b> : This is a required string attribute and must be set to
"mapAutoZoom".</li>

<li><b>includes</b> : This is an optional array attribute. Each entry in this array is a bounding box of the format [minX, minY, maxX, maxY] in decimal degrees (EPSG:4326) (similar to the autoInitialBounds map option). If this attribute is provided, the mapAutoZoom functionality will always ensure that the areas specified will remain included in the area rendered. An example use could be to anchor the map to a community so the user can retain context as features are shown nearby.</li>
</ul>

<!-- ****************************************************************************** -->
<h2><a name="atlas_instances">Instances in Module Definitions</a></h2>

<p>In module definitions, a number of well defined constructs are built by providing the
correct definitions. For example, constructs such as models, widgets and utilities can be added
to a module in a "plug-in" fashion. These definitions specify the behaviour demonstrated to
the end user of the Nunaliit application, at run-time.</p>

<p>Some of these constructs need further specialization. For example, there is a module utility that
monitors a model filter and performs an action on a given state
(<a href="#atlas_utilities_filterMonitor">Filter Monitor</a>). This utility is configured with
an action to perform when a given state is observed.</p>

<p>The Nunaliit framework provides a means to define a configuration object in JSON
and create a generic instance within the application. This facility makes it possible
to extend the behaviour of the main constructs.</p>

<p>Unlike the other constructs, instances created this way do not have a set interface. Instead, 
the interface required by instances is defined by the construct that uses them.</p>

<p>All instance definitions follow this format:
<pre>
	{
		"type": "type of instance"
		...
	}
</pre>
</p>

<p>Each instance definition includes a compulsory attribute: "type". This attribute is a
string which identifies the type of instance the module designer is interested in having included.</p>

<!-- .................................................................. -->
<h3><a name="atlas_instances_action_setFilterSelection">Set Filter Selection Action</a></h3>

<p>The "set filter selection action" instance is an action that sets the current selection
on a document filter model defined in the module.</p>

<p>An example of the configuration object for this instance is shown here:
<pre>
	{
		"type": "setFilterSelection"
		,"modelId": "test"
		,"selection": [ "a", "b" ]
		,"selectAll": true
	}
</pre>
</p>

<p>The attributes of the configuration have the following meaning:
<ul>
<li><b>type</b> : This is a required string attribute and must be set to "setFilterSelection".</li>

<li><b>modelId</b> : This is a required string attribute. It must be set to the identifier of 
a document filter model. This is the model that is modified with a selection when the action
is executed.</li>

<li><b>selection</b> : This is an optional array of strings. This represents the selection
that is set to the associated filter.</li>

<li><b>selectAll</b> : This is an optional boolean. If set, then when the action is executed,
all available choices on the filter are selected.</li>

</ul>
</p>

<!-- ****************************************************************************** -->
<h2><a name="atlas_custom">Atlas Customization</a></h2>

<p>Customization refers to the ability of changing the behaviour or appearance of the
web client application, within the Nunaliit Framework. Nunaliit applications are built
by creating widgets and combining them to provide the services required. This complex
task is usually performed by a simplified configuration script.</p>

<p>All tools provided by the Nunaliit Framework, including the default atlas page,
explicitely include a Javascript file named "nunaliit_custom.js" located in the top most
directory of the atlas (root). 
If an atlas designer is interested in influencing the configuration script, before any
tool has an opporunity to start, it can be accomplished by adding custom code to a file 
named "nunaliit_custom.js" in the "htdocs" sub-directory of the atlas directory. If this 
file exists at run-time, it is loaded and all functions exposed by this file are available
to the web application.</p>

<p>In general, the structure of the "nunaliit_custom.js" file is as follows:
<pre>
;(function($n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
// @param config Object that contains all configuration
// @param callback Function to be called when custom code is complete. This
//                 allows asynchronous calls to be performed in the custom
//                 code. 
window.nunaliit_custom.configuration = function(config, callback){

	// --- This is where custom code would be inserted ---

	// Done with configuration, perform the offered callback
	// to complete configuration and initialize application.
	callback();
};

})(nunaliit2);
</pre>
</p>

<p>As shown in the example above, the callback function given in argument must be
called at the end of the customization. This approach is used to enable custom code to
perform asynchronous calls. If the callback function is not called, then the configuration
script will not complete and the application does not start appropriately.</p>

<p>The configuration object provided as argument is described in a previous section and
is fully populated by the time the custom configuration function is called.</p>

<p>All web pages created by an atlas designer should include "nunaliit_custom.js" to
provide the custom code an opportunity to run.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_loadScript">Loading of Script Files</a></h3>

<p>A number of Javascript files are already included in the HTML files provided by
Nunaliit. If other Javascript files are needed, the function nunaliit2.scripts.loadCustomScripts()
can be used to load them.</p>

<p>The loadCustomScripts() function is preferred to including a script element in the index.html
file since it includes the Javascript file not only in the main page, but also in all page
that use the Nunaliit initialization function. This includes the tool pages.</p>

<p>Another advantage of the loadCustomScripts() function is that the running of the configuration
function (window.nunaliit_custom.configuration()) is delayed until all custom scripts are loaded.</p>

<p>Here is an example where the d3 library is loaded using the loadCustomScripts() function. 
<pre>
;(function($n2){
"use strict";

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

...

window.nunaliit_custom.configuration = function(config, callback){

	...
	
	// Done with configuration
	callback();
};

$n2.scripts.loadCustomScripts([
   'js-external/d3/d3.min.js'
]);

})(nunaliit2);
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_service">Custom Service</a></h3>

<p>A certain amount of customizations in the Nunaliit framework are transacted via
the custom service. The custom service can record options from the atlas creator and
offer them to the various components in the Nunaliit framework to modify the default behaviour.</p>

<p>Options can be specified to the custom service in during the configuration of the Nunaliit
framework. The best place to set options with the custom service is in the file "nunaliit_custom.js",
located in the "htdocs" directory of the atlas.</p>

<p>It is possible to install a configuration function which is called after the Nunaliit services
are instantiated, but before the application main line is performed. This configuration function is
given a configuration object, which contains all the services. The following excerpt of Javascript
should be inserted into the file named "nunaliit_custom.js". It shows how to set an option with the
custom service. 
<pre>
window.nunaliit_custom.configuration = function(config, callback){

	var customService = null;
	if( config && config.directory ){
		customService = config.directory.customService;
	};
	
	if( customService ){
		customService.setOption('disableCreateUserButton',true);
	};
	
	// Done with configuration
	callback();
};
</pre>
</p>

<p>The options are set on the custom service by using the customService.setOption() function. The
first argument to this function is a string, which is the name of the option. The second argument could
be of any type, and is dependent on the option.</p>

<p>Here is a list of custom options currently supported by Nunaliit:
<ul>
<li>authWidgetLoginLabel</li>
<li>authWidgetLogoutLabel</li>
<li>authWidgetWelcomeLabel</li>
<li>couchDbCachingDisabled</li>
<li>couchDbCachingEnabled</li>
<li>disableCreateUserButton</li>
<li>disableDocumentHoverFunctions</li>
<li>displayBriefInRelatedInfo</li>
<li>displayDocumentInfoFunction</li>
<li>displayFilterFactory</li>
<li>displayFormat</li>
<li>displayOnlyRelatedSchemas</li>
<li>displayPostProcessFunctions</li>
<li>displayRelatedInfoFunction</li>
<li>displayRelatedInfoProcess</li>
<li>displaySortFunction</li>
<li>displaySuppressLeaveConfirmation</li>
<li>editorEnableAddFile</li>
<li>editorOnRefreshFunctions</li>
<li>editorSuppressFormView</li>
<li>editorSuppressSlideView</li>
<li>editorSuppressTreeView</li>
<li>mapClusterClickCallback</li>
<li>mapFeaturePopupCallback</li>
<li>mapFeaturePopupCallback</li>
<li>mapGetStyleFunctionForLayer</li>
<li>mapLabelCancelEdit</li>
<li>mapLabelEditFeature</li>
<li>moduleDisplayIntroFunction</li>
<li>relatedDocumentDiscoveryProcess</li>
<li>restrictAddRelatedButtonToLoggedIn</li>
<li>restrictReplyButtonToLoggedIn</li>
<li>searchButtonText</li>
<li>searchWidgetText</li>
<li>simplifiedGeometriesSizeLimit</li>
<li>simplifiedGeometriesTimeLimit</li>
<li>soundPlayMultipleOnFocus</li>
</ul>	
</p>

<p>Some of these options are discussed, below.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_moduleNavigation">Default Module and Navigation Documents</a></h3>

<p>When Nunaliit first create an atlas, it offers default module and navigation documents. When
the atlas is displayed, it displays the default module and navigation. To modifiy this behaviour
and have the atlas display different modules and navigation, by default, options on the custom
service can be used:
<ol>
<li><b>defaultModuleIdentifier</b> : This custom service option is a string and represents
the document identifier of the default module. By default, it is 'module.demo'.</li>

<li><b>defaultNavigationIdentifier</b> : This custom service option is a string and represents
the document identifier of the default navigation document. By default, it is 'navigation.demo'.</li>
</ol>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_displayFormatTiled">Tiled Display Format</a></h3>

<p>When Nunaliit displays an atlas page and a document is selected, a display pane is used to
given information about this document. By default, Nunaliit uses the "classic" display pane, where
the document is shown and below it, the related documents.</p>

<p>There is another format of display pane where the documents are represented by tiles and animation
is used to move the tiles has selection is changed. This format is known as the "Tiled Display Format".</p>

<p>There are two ways to specify that the tiled display is desired: atlas-wide or module-specific.</p>

<p>The custom service is used to order Nunaliit to use the tiled display format across the entire atlas. In
the nunaliit_custom.js file, add the following line:
<pre>
	customService.setOption('displayFormat','tiled');
</pre>
</p>

<p>If the tiled display process is to be used with a set of modules (not atlas wide), then each
module document must be modified accordingly. Here is an exaample:
<pre>
{
	...
	"nunaliit_module":{
		...
		"display":{
			"type": "tiled"
		}
		...
	}
	...
}
</pre>
</p>

<p>The tiled display format, by default, shows the related documents in tiles surrounding the selected
one. However, the tiled display format is very flexible and can be configured using other options in the
custom service:
<ol>
<li><b>relatedDocumentDiscoveryProcess</b> : This is an object that implements the interface
for requesting related documents. This controls what documents are deemed related to the
selected one.</li>

<li><b>displayDocumentInfoFunction</b> : This is a function that, given a set of document
identifiers, returns an information structure on each document found. This information
structure gives information which is relevant to sorting and filtering.</li>

<li><b>displaySortFunction</b> : This is a function that, given an array of information
structures, the array in a sorted order. This dictates the order in which the related information
is presented to the user.</li>

<li><b>displayFilterFactory</b> : This is an object that implements an interface where a new
filter can be created. A filter is used to minimize the number of tiles displayed and allow a user
to quickly narrow the number of displayed document to the relevant ones. A filter operates on the
information structures returned by the document info function.</li>
</ol>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_sliding_display">Sliding Display</a></h3>

<p>When Nunaliit displays an atlas page and a document is selected, a display pane is used to
given information about this document. By default, Nunaliit displays selected documents and its related
documents on a static panel on the right.</p>

<p>Alternatively, a module can allow the side panel to function as a sliding panel, which can free up 
screen real estate, when a document is not selected or being edited.</p>

<p>To enable the sliding side panel add the "sliding" key to the module display.json, and set it the 
option to true:
<pre>
{
	...
	"nunaliit_module":{
		...
		"display":{
			"sliding": true
		}
		...
	}
	...
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_tag_assignment_display">Tag Assignment Display</a></h3>
<p>The tag assignment display is used to assign tags to multiple selected documents. It should be used
with the grid display with multi select. Here is an example config:
<pre>
{
	...
	"nunaliit_module":{
		...
		"display":{
			"type": "tagAssignment"
		}
		...
	}
	...
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_displayWidgetWithComments">Show Comments in Display Widget</a></h3>

<p>When using the "classic" display pane, it generally displays related information along with the 
currently selected document. "Related" information means documents that are linked by the selected
document and documents that link to the selected document.</p>

<p>There is a customization that allows a replacment of the related information with comment thread.
In this case, instead of showing all related information, only comments about the currently selected
document are show in a discussion thread. When this customization is selected, user are prompted
to enter comments instead of adding related information.</p>

<p>The comment customization is appropriate for those atlas that are designed to gather feedback on 
locations as opposed to letting the user discover relationships between entities.</p>

<p>To enable the comment customization, the following script fragment should be added to
the nunaliit_custom.js file, after the dispatchService has been defined:
<pre>
		config.directory.schemaRepository.getSchema({
			name: 'demo_comment'
			,onSuccess: function(schema){
				if( config.directory.commentService ){
					config.directory.commentService.setCommentSchema(schema);
				};
			}
		});	
		var commentProcess = new $n2.couchDisplay.CommentRelatedInfo({
			dispatchService: config.directory.dispatchService
		});
		customService.setOption('displayRelatedInfoProcess',commentProcess);

</pre>
</p>

<p>Prior to nunaliit2-2.2.9, this script fragment should be used:
<pre>
	var commentProcess = new $n2.couchDisplay.CommentRelatedInfo({
		schema: null
		,dispatchService: config.directory.dispatchService
	});
	config.directory.schemaRepository.getSchema({
		name: 'demo_comment'
		,onSuccess: function(schema){
			commentProcess.commentSchema = schema;
		}
	});	
	customService.setOption('displayRelatedInfoProcess',commentProcess);
</pre>
</p>

<p>In the example above, the comment display process uses an atlas-specific schema for
comments named 'demo_comment'. Each atlas must define its own schema to support comments.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_disableUserCreate">Disable User Creation Button</a></h3>

<p>By default, when a user is prompted for authentication, a button offering to create a new
user is made available in the login dialog. It is possible to use the custom service to
remove this button.
<pre>
	customService.setOption('disableCreateUserButton',true);
</pre>
</p>
<!-- .................................................................. -->
<h3><a name="atlas_custom_disableDocumentHoverFunctions">Disable Document Hover Functions</a></h3>

<p>By default, hover functions are active in the document tile and display ribbon layouts. They can be disabled with the following custom service setting.
<pre>
	customService.setOption('disableDocumentHoverFunctions', true);
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_restrictAddRelatedButton">Restrict Add Releated Button</a></h3>

<p>By default, when a document is displayed, a button titled "Add Related Info" allows a user
to add related information to the database. If a user is not logged in when the button is pressed,
then the user is prompted to login.</p>

<p>Having this button displayed all the time encourages new user to submit data. However, in some
cases (locked-down atlas), having this button displayed all the time is confusing since most visitors
to the atlas do not have the ability of posting any information. To display the "add related" button
only to visitors that are logged in, the following option to the custom service can be used:
<pre>
	customService.setOption('restrictAddRelatedButtonToLoggedIn',true);
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_mapPopup">Custom Map Popup</a></h3>

<p>When a user moves the mouse over a feature found on the map, a pop-up bubble is
displayed over the map with brief information about the feature.</p>

<p>It is possible to customize the information provided in the pop-up bubble by
providing a special function via the custom service:
<pre>
	customService.setOption('mapFeaturePopupCallback',popUpFunction);
</pre>
</p>

<p>The expected interface for the popUpFunction is:
<pre>
	function popUpFunction(opts_){
		var opts = $n2.extend({
			feature: null
			,layerInfo: null
			,onSuccess: function(html){}
			,onError: function(err){}
		},opts_);
		
		...
	};
</pre>
</p>

<p>When the pop-up function is called, it is provided with a map feature and a layerInfo object.
The map feature contains the information displayed on the map. The layerInfo object contains
information about the layer where the feature is displayed.</p>

<p>The function is expected to compute a HTML fragment to be displayed in the pop-up bubble. When
done computing the HTML fragment, the function providing in 'onSuccess' parameter should be called
with the fragment returned as a text string. If no HTML should be display for the particular feature,
'onSuccess' should be called with a parameter of null.</p>

<p>The default function for pop-up display can be found here: nunaliit2.mapAndControls.DefaultPopupHtmlFunction().
Also, a special function used to suppress the pop-up behaviour is declared at: 
nunaliit2.mapAndControls.SuppressPopupHtmlFunction(). Therefore, to suppress all pop-ups:
<pre>
	customService.setOption('mapFeaturePopupCallback',nunaliit2.mapAndControls.SuppressPopupHtmlFunction);
</pre>
</p>

<p>Here is an example where a pop-up function shows a special text for a cluster (by default, no pop-up is
generated for a cluster) and the default behaviour is called for any other feature:
<pre>
	customService.setOption('mapFeaturePopupCallback',mySpecialPopUpFn);
	
	function mySpecialPopUpFn(opts_){
		var opts = $n2.extend({
			feature: null
			,layerInfo: null
			,onSuccess: function(html){}
			,onError: function(err){}
		},opts_);
		
		var feature = opts.feature;
		
		// If a cluster, say so
		if( feature && feature.cluster && feature.cluster.length > 1 ){
			opts.onSuccess('&lt;p&gt;This is a &lt;b&gt;cluster&lt;/b&gt;!&lt;/p&gt;');
			return;
		};
		
		// If not a cluster, revert to default behaviour
		if( nunaliit2 
		 && nunaliit2.mapAndControls
		 && nunaliit2.mapAndControls.DefaultPopupHtmlFunction ){
		 	nunaliit2.mapAndControls.DefaultPopupHtmlFunction(opts_);
		} else {
			// Not supposed to get here
			opts.onSuccess(null);
		};
	};
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_mapClickCluster">Change Map Cluster Click Behaviour</a></h3>

<p>It is possible to add automatic clustering to the map via options found in the module
document. When clustering is enabled for a map, the default behaviour to clicking on cluster
is to have the map zoom in on the cluster. This usually results in some of the features
segregating from the cluster, allowing a user to explore each one individually.</p>

<p>An optional behaviour is possible where all features making the cluster are selected when
the cluster is clicked. This generally results in all the features (actually the docuemnts) making
the cluster be displayed in the display pane.</p>

<p>To enable this optional behaviour, the custom service is used, as follows:
<pre>
	customService.setOption('mapClusterClickCallback',$n2.mapAndControls.MultiSelectClusterClickCallback);
</pre>
</p>

<p>It is possible to change the behaviour when a cluster is clicked by using module utilities.
See <a href="#atlas_utilities_mapClusterClickHandler">Map Cluster Click Handler</a> for more
information.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_welcomeDisplayPane">Custom Welcome Pane</a></h3>

<p>When an atlas is first loaded, information is shown in the display pane which is usually
a welcome message obtained from the module document. The same text is also shown when the last 
selected document is unselected.</p>

<p>The message displayed in the pane is already customizable, since its content can be modified
in the module document. However, if a behaviour other than displaying static text is desired, it is
possible to pass a special function via the custom service:
<pre>
	customService.setOption('moduleDisplayIntroFunction',myDisplayIntroFunction);
</pre>
</p>

<p>The expected interface for this special function is:
<pre>
	function myDisplayIntroFunction(opts_){
		var opts = $n2.extend({
			elem: null
			,config: null
		},opts_);
		
		...
	};
</pre>
</p>

<p>The argument named 'elem' is the DOM element (in a jQuery set) where the information should
be displayed. The argument 'config' contains the object passed during configuration with the 
declaration of all services. This is sufficient to obtain the necessary information for
displaying a welcome message.</p>

<p>Here is a complete example:
<pre>
customService.setOption('moduleDisplayIntroFunction',function(opts_){
	var opts = $n2.extend({
		elem: null
		,config: null
	},opts_);
	
	$n2.log('config',opts.config);
	
	var $elem = opts.elem;
	$elem.empty().text('Hello World!');
});
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_authWidgetLabels">Change Labels on Authentication Widget</a></h3>

<p>The authentication widget, the portion of the UI dedicated to logging in and out of the atlas,
uses default text strings to prompt the user. The custom service can be used to configure other
text strings:
<ol>
<li><b>authWidgetLoginLabel</b> : This custom service option is a string and represents
the label used on the button to allow a user to log in. By default, it is 'Login'. </li>

<li><b>authWidgetLogoutLabel</b> : This custom service option is a string and represents
the label used on the button to allow a user to log out. By default, it is 'Logout'. </li>

<li><b>authWidgetWelcomeLabel</b> : This custom service option is a string and represents
the text showed in the box next to the login/logout button. This is the text that replaces the
user name when the atlas is in 'logged out' state. By default, it is 'Welcome'. </li>
</ol>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_simplifiedGeometry">Change limits on Simplified Geometry Requests</a></h3>

<p>When the client (browser) makes simplified geometry requests to the server,
it passes limits as to the size of the response and the amount of time required
to respond. These limits can be modified via the custom service.
<ul>
<li><b>simplifiedGeometriesSizeLimit</b> : This is a number specifying the
maximum number of bytes that should be returned by the simplified geometry
services when querying for attachments.</li>
	
<li><b>simplifiedGeometriesTimeLimit</b> : This is a number specifying the
maximum number of milliseconds that the simplified geometry
services should spend responding to the request.</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_document_display">Custom Document Display</a></h3>

<p>As part of custom configuration, it is possible to influence how a document appears by
adding custom values to the document before it is displayed by the "ShowService". Schemas
are used to render the content of a document. However, schemas contain only simple templates and
do not provide a way to perform complex computations based on the content of the document.</p>

<p>The "ShowService" offers the opportunity to install a function that may modify any document
before it is presented to the templating process. The following script demonstrates this
capability:
<pre>
window.nunaliit_custom.configuration = function(config, callback){

	/*
	 * This is the function where documents are modified before being displayed
	 * by the Show Service
	 */
	config.directory.showService.options.preprocessDocument = function(doc) {
		
		// At this point, perform any modification required
		doc.justATest = 'TestValue';
	
		return doc;
	};
	
	// Done with configuration
	callback();
};
</pre>
</p>

<p>The example above shows the ability of installing a "preprocessDocument" function to the
ShowService during custom configuration. Modifications made to a document during the preprocess
function are available to the schema templates.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_edit">Custom Editing</a></h3>

<p>When a document is being edited, a number of views of the document are presented
to allow a user to modify the content of the document. One of those views is based
on the schema associated with the document. Since a schema offers only a template,
it is not possible to specify complex operations using the template alone. There is
a facility, using the SchemaEditor, to modify the HTML produced by the template. To do
so, one must register a "post process" function with the document editor based on schema.
The following script shows how this can be accomplished:
<pre>
if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){

	/*
	 * The following function is called after a schema editor has been
	 * called to display a document. This is useful to add UI elements
	 * to the edit window.
	 * @param doc {Object} Document that is being edited
	 * @param $div {Object} jQuery element that contains the rendered template
	 *                      for editing. 
	 */
	config.directory.schemaEditorService.addPostProcessFunction(function(doc, $div) {
	
		// Find elements with class 'insertRevision' and change content with document
		// revision
		$div.find('.insertRevision').text(doc._rev);
	});

	// Done with configuration
	callback();
};
</pre>
</p>

<p>The simplistic example above shows how to enable this feature within the custom configuration
function. The custom configuration function, within "nunaliit_custom.js", is the appropriate
place to define this function as to make the changes available to all Nunaliit tools.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_create">Custom Document Creation</a></h3>

<p>Within the atlas framework, when a new document is created, it is generally done
specifying a document schema. The schema provides a basic template for a new and empty
document. If a more complex process is required when creating a new document, it is
possible to install a function with the schema repository to intercept all new documents
created from a schema and modify the content of the document. The following script
demonstrate how a custom function can be installed:
<pre>
if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){

	/*
	 * The following function is called when a document is created from
	 * a schema.
	 */
	var repositoryFunctions = config.directory.schemaRepository.getRepositoryFunctions();
	repositoryFunctions.addOnDocumentCreateFunction(function(doc, schema){
	
		if( schema.name === 'mySchema' ){
			doc.mySchema = ['something special'];
		};
	
	});
	

	// Done with configuration
	callback();
};
</pre>
</p>

<p>The function called at creation is given both the new document and the schema used
to create it. The schema can be used to discriminate which documents require modifications.
The document given in argument can be modified, if it is needed.</p>

<p>The example above shows how the custom creation function can be added via the use of the
custom configuration function. This is the appropriate location for this definition so as
to have all tools offered in the framework behave the same when a new document is created.</p> 


<!-- .............................................................................. -->
<h3><a name="atlas_custom_projections">Custom Projections</a></h3>

<p>Only a handful of projections are supported by the stock installation of Nunaliit, including EPSG:4326 
and EPSG:900913 (needed for Google Maps). When other projections are needed by an atlas, they must be specified 
in the atlas page. Here are the steps required to add a new projection to Nunaliit.</p>

<p>The first step is to add the projection definition to the nunaliit_custom.js file.
In this example, let's say the projection to be added is EPSG:32661, then the definition
would be:
<pre>
Proj4js.defs["EPSG:32661"]="+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";
</pre>
</p>

<p>Following this example, the nunaliit_custom.js file would be modified as follows:
<pre>
;(function($,$n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

Proj4js.defs["EPSG:32661"]="+proj=stere +lat_0=90 +lat_ts=90 +lon_0=0 +k=0.994 +x_0=2000000 +y_0=2000000 +ellps=WGS84 +datum=WGS84 +units=m +no_defs";

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){
	
	config.directory.showService.options.preprocessDocument = function(doc) {
		
		return doc;
	};
	
	
	callback();
};

})(jQuery,nunaliit2);
</pre>
</p>

<p>The definition string can be found online at <a href="http://spatialreference.org/">http://spatialreference.org/</a> 
for most projection. Select the "Proj4js" format to obtain the correct definition string.</p>

<p>The final step to using a projection is to specify the projection in the 
<a href="#atlas_content_module">module document</a>. The name of the projection needs to be
specified in the attribute titled "srsName" under nunaliit_module/map/coordinates.</p>

<p>To continue the example above, the module document would contain the following
fragment:
<pre>
{
...
	,"map":{
		"coordinates": {
			"initialBounds": [650000,-200000,1350000,220000]
			,"autoInitialBounds": false
			,"srsName":"EPSG:32661"
		}
	...
	}
...
}
</pre>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_custom_language_toggler">Language Toggling Widget</a></h3>

<p>When the atlas page is drawn, if a language switcher is specified, then a language
switcher widget is provided. This widget allows switching to any defined languages. In
a bilingual atlas, a language toggling widget might be preferred. The custom configuration
file is used to specify this option, as shown below:
<pre>
if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

// This is the a custom function that can be installed and give opportunity
// for an atlas to configure certain components before modules are displayed
window.nunaliit_custom.configuration = function(config, callback){

	config.directory.languageService.setUseToggleWidget(true);

	// Done with configuration
	callback();
};
</pre>
</p>
<p>
To remove the language selection widget altogether, one can add the following CSS to css/atlas.css
<pre>
.nunaliit_header_language {
    display: none;
}
</pre>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_custom_add_language">Add Supported Language</a></h3>

<p>To add a supported language to the atlas, one must provide the name of the language (its
label) and the language code associated with it. This is generally done in the nunaliit_custom.js
file. Here is an example: 
<pre>
var langDef = {
    code: 'xx',
    name: 'Language X'
};

config.directory.languageService.addLanguage(langDef);
</pre>
</p>


<!-- .................................................................. -->
<h3><a name="atlas_custom_user_agreement">User Agreement</a></h3>

<p>When an atlas is created, Nunaliit generates a document that holds a user
agreement. By default, the generated user agreement is not enabled.</p>

<p>To enable the user agreement, two modifications must be made to the
user agreement document (identifier is org.nunaliit.user_agreement),
located at &lt;atlas-dir&gt;/docs/org.nunaliit.user_agreement:
<ul>
<li>Customize the text of the user agreement (nunaliit_user_agreement/content). This
is a localized string which can be offered in multiple languages.</li>
<li>Enable the user agreement by changing the "enabled" field from false to true. Within the
document, this is located at nunaliit_user_agreement/enabled</li>
</ul>
</p>

<p>When the user agreement is in effect (enabled), a user must accept the agreement at user
creation. If the user agreement is modified after a user is registered, then the user is prompted
to accept a new agreement the next time he/she logs in.</p>

<p>The last user agreement accepted is stored in the document associated with the user, in the
user database, under the key nunaliit_accepted_user_agreements/&lt;atlas-name&gt;.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_user_questionnaire">User Questionnaire</a></h3>

<p>It is possible to canvas users for a set of questions by installing a user
questionnaire in the database. When a questionnaire is installed, users are prompted
to answer questions found in the questionnaire at log in.</p>

<p>The user questionnaire is an optional component which is not enabled by default when
an atlas is created with Nunaliit. To enable this feature, a special document must be created.
This special document is a schema with a name set to "nunaliit_user_questions". As a reminder,
the name of a schema is not the document identifier.</p>

<p>The schema used to hold the user questionnaire has to meet certain constraints:
<ol>
<li>A version must be set (non-null) in the "create" section of the schema.</li>
<li>The schema must not be a root schema.</li>
<li>The schema name must be set to "nunaliit_user_questions"</li>
</ol>
</p>

<p>Here is an example of a schema that, if installed, queries users at log in with a
questionnaire:
<pre>
{
   "_id": "schema.demo.user_questions",
   "_rev": "2-83c7efa5585a58e9a580afc46f1899c2",
   "name": "nunaliit_user_questions",
   "isRootSchema": false,
   "create": {
       "version": 1,
       "yob": null
   },
   "brief": "&lt;span class=\"n2s_localize\"&gt;User Questions&lt;/span&gt;",
   "display": "&lt;div&gt;&lt;span class=\"n2s_localize\"&gt;Year of Birth&lt;/span&gt; : {{yob}}&lt;/div&gt;",
   "form": "&lt;div&gt;&lt;span class=\"n2s_localize\"&gt;Year of Birth&lt;/span&gt; {{#:field}}yob{{/:field}}&lt;/div&gt;",
   "label": "User Questions",
   "extensions": [
   ],
   "nunaliit_schema": "schema",
   "nunaliit_type": "schema"
}
</pre>
</p>

<p>When a questionnaire is installed, a user is prompted the first time they log in with
a question form created from the special schema. When the questions are answered, the
answers are saved in the document associated with the user in the user database. The
answers are atlas specific and are saved in a key unique to the atlas where the answers
were provided. The exact location of the answers are nunaliit_answers/&lt;atlas-name&gt;
Here is an example of answers saved in a user document:
<pre>
{
   "_id": "org.couchdb.user:user-123",
   "_rev": "20-bea217173d22ef488fe4b49c766dd559",
   "name": "user-123",
   "type": "user",
   "display": "Test User",
   "roles": [],
   "nunaliit_answers": {
       "demo": {
           "version": 1,
           "yob": "1900"
       }
   }
}
</pre>
</p>

<p>It is important to note that the special schema operates directly on the object where
the answers are saved and it is not required to de-reference the all the keys to the answers
from the user document.</p>

<p>After the questionnaire is created, it is possible to modify the questions that are asked.
However, users that have already answered the previous questions will not be re-canvassed unless
the version number saved in the schema is changed. It is therefore a good idea to increase
the version number anytime the questionnaire schema is modified.</p>

<p>If the questionnaire needs to be disabled after it is created, it is possible to do
so without deleting the schema. Simply set the version number to 0.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_email_templates">E-mail Templates</a></h3>

<p>At times the Nunaliit server must contact users via e-mail messages. The subject line
and content of these e-mail messages can be customized via e-mail templates. E-mail templates
are a special type of documents which specifies the contents of a subject line and message body
using Handlebars templates.</p>

<p>The structure of an e-mail template document is explained using an example:
<pre>
{
   "_id": "org.nunaliit.email_template.user_creation",
   "nunaliit_email_template": {
       "body": "&lt;html&gt;\n\t&lt;head&gt;\n\t\t&lt;title&gt;Nunaliit User Creation&lt;/title&gt; ... &lt;/p&gt;\n\t&lt;/body&gt;\n&lt;/html&gt;",
       "subject": "Nunaliit User Creation"
   },
   "nunaliit_schema": "email_template",
}	
</pre>
</p>

<p>As show in the example, an e-mail template document names "email_template" as its schema and contains
a structure under the key "nunaliit_email_template". The structure contains two string attributes:
<ul>
<li><b>subject</b> : This is a Handlebars template that should yield to a plain text string. The
result of this template is used in the subject line of the e-mail message sent to the user.</li>

<li><b>body</b> : This is a Handlebars template that should yield to a HTML string. The result
of this template is used in the HTML body of the message sent to the user.</li>
</ul>
</p>

<p>As the subject line and body content are created from their templates, an object is provided to the
Handlebars templates. This object conatins information appropriate to the message being sent. To continue
the example provided above, the complete HTML template for body is reproduced, unescaped, here below:
<pre>
&lt;html&gt;
	&lt;head&gt;
		&lt;title&gt;Nunaliit User Creation&lt;/title&gt;
	&lt;/head&gt;
	&lt;body&gt;
		&lt;h1&gt;Nunaliit User Creation&lt;/h1&gt;
		&lt;p&gt;Someone has requested to create a user for a Nunaliit Atlas. If it
		was you, please follow the link below to complete the registration process.&lt;/p&gt;
		&lt;p&gt;If you did not request a user to be created, simply disregard this e-mail.&lt;/p&gt;
		&lt;p&gt;To complete the registration process, click on the link below, or paste
		it in your favourite web browser.&lt;/p&gt;
		&lt;p&gt;&lt;a href="{{link}}"&gt;{{link}}&lt;/a&gt;&lt;/p&gt;
	&lt;/body&gt;
&lt;/html&gt;	
</pre>
</p>

<p>As shown in the body template, the text sent to the user contains a link which is inserted
using the Handlebars tag "{{link}}".</p>

<p>The following list describes the various e-mail templates and the object available to the Handlbars
templates:
<ul>
<li><b>org.nunaliit.email_template.daily_vetter</b> : This template is used to create
a message sent to a vetter user, once a day, to remind that a number of vetting tasks
are outstanding. The object used to populate the template has the following attributes:
<ul>
<li>count : The number of outstanding vetting tasks</li>
<li>approvalPageLink : URL to the media approval page.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.password_recovery</b> : This template is used to create
a message sent to a user that has requested a password recovery. The object 
used to populate the template has the following attributes:
<ul>
<li>link : URL to the user recovery page, including the special token
to uniquely identify the user.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.password_reminder</b> : This template is used to create
a message sent to a user after it is first created. During the creation process, if the user
requests an e-mail with a password reminder, this message is created and sent. The object 
used to populate the template has the following attributes:
<ul>
<li>password : Password, in plain text, that the user entered.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.submission_approval</b> : This template is used to create
a message sent to a vetter when a new database change is uploaded to the submission
database. The object used to populate the template has the following attributes:
<ul>
<li>submissionDocId : Identifier for the submission document.</li>
<li>submissionPageLink : URL to the submission tool page.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.submission_rejection</b> : This template is used to create
a message sent to a user that submitted changes to the database that have been rejected by
a vetter. The object used to populate the template has the following attributes:
<ul>
<li>submissionDocId : Identifier for the submission document.</li>
<li>submissionPageLink : URL to the submission tool page.</li>
<li>rejectionReason : Text entered by vetter explaining the reason that the
submission was rejected.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.schema_emailOnCreate</b> : This template is used when a schema definition's top level attribute "emailOnCreate" is set to true and a document of that schema is created. The creator of the email, atlas vetters, and atlas administrators are sent this email. The object used to populate the template has the following attributes:
<ul>
<li>submissionDocId : Identifier for the document.</li>
<li>schemaName : The name of the schema.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.upload</b> : This template is used to create
a message sent to a vetter when a new media file was uploaded to the database. The object 
used to populate the template has the following attributes:
<ul>
<li>docId : Identifier for the document where the media file was uploaded</li>
<li>attachmentName : Name of the attachment that was uploaded</li>
<li>approvalPageLink : URL to the media approval page.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.user_creation</b> : This template is used to create
a message sent to a user to validate the user's e-mail at creation time. The object 
used to populate the template has the following attributes:
<ul>
<li>link : URL to the user creation page, including the special token
to uniquely identify the user.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.user_registration</b> : This template is used when a user follows their initially received user creation link and completes registration of their account with an atlas. Atlas administrators are sent this email. The object used to populate the template has the following attributes:
<ul>
<li>link : URL to the user management page, if specified in mail properties.</li>
<li>userEmail : The email of the user that completed registration.</li>
</ul>
</li>

<li><b>org.nunaliit.email_template.form_email</b> : This template is used to send e-mails
to recipients registered for "Form Submission E-mails". This is when a user submits an
e-mail to the Nunaliit Atlas using an on-line form. The object 
used to populate the template has the following attributes:
<ul>
<li>atlasName : Name of the atlas where form was submitted</li>
<li>destination : Destination for the e-mail. This represents a group
of users registered to receive those notifications.</li>
<li>subject : The subject of the message</li>
<li>body : The text of the message</li>
<li>contactInfo : This is a string representing the contact information.</li>
</ul>
Other attributes can be available, based on the options given in the form e-mail dialog.
</li>
</ul>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_searchWidgetLabel">Custom Label for Search Widget</a></h3>

<p>The search widget displayed in the atlas populated with an initial text string to indicate to
the user that the widget can be used to search the atlas. By the default, the text string is:
'search the atlas'.</p>

<p>It is possible to change this string to any value via the custom service:
<pre>
	customService.setOption('searchWidgetText','Search');
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_mailForm">Custom Mail Form</a></h3>

<p>Nunaliit allows a user to send e-mails to administrators via an on-line web form.
The form contains fields for contact information and message. An atlas can change the
contact information requested by specifying custom fields.</p>

<p>To specify a field, an object with proper options must be provided. Here is an example:
<pre>
{
	"name": "contact_info"
	,"label": "Contact Information"
	,"placeholder": "Information to contact you"
	,"required": true
	,"textarea": true
}
</pre>
The meaning for each attribute for a field object is as follows:
<ul>
<li>name : Required string. Name of the field. This is transmitted to the server.</li>
<li>label : Required string. The label associated with the field. This should be localized.</li>
<li>placeholder : Optional string. Explanation for the field. This should be localized.</li>
<li>required : Optional boolean. If set, the user must fill the field before submitting the mail form.</li>
<li>textarea : Optional boolean. If set, a textarea is used for entry of the field.</li>
</ul>
</p>

<p>When customizing the contact information, an array of fields must be specified using the
custom option 'mailFormContactFields'. Here is an example of how this can be accomplished within
the nunaliit_custom.js file:
<pre>
		customService.setOption('mailFormContactFields', [
			{
				"name": "last_name"
				,"label": _loc('Last Name')
				,"required": true
			}
			,{
				"name": "first_name"
				,"label": _loc('First Name')
				,"required": true
			}
			,{
				"name": "email"
				,"label": _loc('E-Mail')
				,"required": true
			}
		]);
</pre>
</p>

<p>There are two other aspects of the web mail form that can be controlled by customization:
the form title and the mail subject. Here is an example for those:
<pre>
		customService.setOption('mailFormTitle', _loc('Contact Us Form'));
		customService.setOption('mailFormSubject', 'Contact Us Form');
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_googleAnalytics">Google Analytics</a></h3>

<p>If you are using Google Analytics to track usage of your site, some events
are defined by Nunaliit to keep track of loaded modules and selected documents.</p>

<p>To integrate Google Analytics in your Nunaliit site, adapt and add the following
code to the nunaliit_custom.js file:
<pre>
	// Google Analytics
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	ga('create', 'UA-XXXXXX-Y', 'mydomain.com');
	ga('send', 'pageview');
</pre>
</p>

<p>Particular attention is needed on the line with the "create" command, where the
appropriate tracking ID and host domain is needed.</p>

<!-- .................................................................. -->
<h3><a name="atlas_custom_forceCouchDbCaching">Force CouchDb Caching</a></h3>

<p>CouchDb caching can greatly improve the performance of the Nunaliit, especially for 
users that behind networks with constrained speed. This performance improvement comes
with caching the documents to the browser's database.</p>

<p>Since the caching logic is still experimental, it is disabled by default. A user can opt 
to turn this feature on in the debug tool page.</p>

<p>To invert the default, or enable the caching by default, it is possible to set a custom option
that applies to all users of an atlas. To enable CouchDB caching, by default, add the following
lines near the end of nunaliit_custom.js:
<pre>

// This atlas allows caching of CouchDb in IndexedDB, by default
if( !window.nunaliit_custom.options ) window.nunaliit_custom.options = {};
window.nunaliit_custom.options.couchDbCachingEnabled = true;

</pre>
</p>

<p>The resulting nunaliit_custom.js would look like this:
<pre>
;(function($,$n2){

if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};

...

window.nunaliit_custom.configuration = function(config, callback){

...

	callback();
};

// This atlas allows caching of CouchDb in IndexedDB, by default
if( !window.nunaliit_custom.options ) window.nunaliit_custom.options = {};
window.nunaliit_custom.options.couchDbCachingEnabled = true;

})(jQuery,nunaliit2);
</pre>
</p>

<p>If CouchDb caching is causing an issue to a user, it is possible to disable it in the
debug tool page.</p>

<!-- ****************************************************************** -->
<h2><a name="atlas_dates">Handling of Dates</a></h2>

<p>The Nunaliit Atlas Framework provides the ability to record and display
dates, and query documents based on dates recorded in them. The interpretation of 
dates within the framework attempts to mimick the way dates are conveyed by humans
to facilitate the process of recording them.</p>

<p>In Nunaliit, all recorded dates are interpreted as a time interval. As a result,
the precision of the time interval is proportional to the precision of the given date.
For example:
<ul>
<li>If a user was to record a date simply as a year like "2009", Nunaliit interprets this
as a time interval spanning from January 1st, 2009 to December 31st, 2009.</li>
<li>If a user was to record a date using a year-month format, such as "2009-08", Nunaliit 
interprets this as a time interval spanning from August 1st, 2009 to August 31st, 2009.</li>
<li>If a user was to record a date using a format that specifies minutes, such as 
"2009-08-05 10:02", Nunaliit interprets this as a time interval spanning from 10:02:00 to 
10:02:59 on August 5th, 2009.</li>
</ul>
</p>

<p>Within Nunaliit, in every instance where a date is accepted, a date range can be provided.
A date range differs from a date in that instead of a single instance of a date, two dates
are provided: one to define the start of the range and one to define the end. A date range is
generally displayed as two dates separated by a slash character, such as "2009/2011". In this
example, Nunaliit would interpret this instance as a time interval from January 1st, 2009 tp
December 31st, 2011.</p>

<p>Nunaliit also supports the concept of "on-going" date intervals. An on-going date refers to
an activity which has began at a set point in the past, but continues to the present, without
a set ending time. For example, if one wanted to record the fact that someone has been employed
since 2008, and is still employed to this day, one could record "2008/-" in any location where a
date is accepted. In this example, Nunaliit would interpret the date as a time interval that spans
from January 1st, 2008 to now.</p>

<p>Because of this interpretation of time, it is pointless to build forms that ask for a start and end
date. Instead, one date entry is preferred where the time interval can be expressed more fully.</p>

<!-- ------------------------------------------------------------------ -->
<h3><a name="atlas_dates_syntax">Date Syntax</a></h3>

<p>When entering a date on a form, in a date field, a number of acceptable syntax is allowed
to the user. Any date field accepts a time-interval. Here is the definition of a time-interval:
<pre>
  time-interval := date-time '/' date-time-or-now
                 | date-time;

  date-time-or-now := date-time
                    | '-';

  date-time := date [ time ]
  
  date := YYYY-MM-DD
        | YYYY-MM
        | YYYY;
  
  time := hh:mm:ss
        | hh:mm;
</pre>
</p>

<p>Examples of entries that meet this syntax:
<ul>
<li>2001-03-11 22:05</li>
<li>2003-04-19 / -</li>
<li>1990 / 1999</li>
</ul>
</p>

<!-- ------------------------------------------------------------------ -->
<h3><a name="atlas_dates_structure">Object Structure</a></h3>

<p>Nunaliit indexes all dates found in every document stored in the database.
This allows to find any document that match a queried date interval. For this
process to work correctly, dates must be recorded in structure format recognized
by the framework.</p>

<p>A date element has the following structure:
<pre>
{
	"nunaliit_type":"date"
	,"date": "2002 / -"
	,"min": 1009861200000
	,"max": 1009861200000
	,"ongoing": true
	,"index": 23
}
</pre>
<ul>
<li><b>nunaliit_type</b> : For a date structure, this must be set to "date".</li>
<li><b>date</b> : This is the string that was originally entered by the user. This is useful
in case the user wishes to edit and modify the original date.</li>
<li><b>min</b> : This is a number that represents the lower boundary time of the date
interval. The time is represented as the number of seconds, since January 1st, 1970.</li>
<li><b>max</b> : This is a number that represents the higher boundary time of the date
interval. The time is represented as the number of seconds, since January 1st, 1970. If
the attribute "ongoing" is set (true), then "max" is not required.</li>
<li><b>ongoing</b> : This is a boolean. If set, it means that the date is on-going. In this
case, the "max" parameter is superfluous.</li>
<li><b>index</b> : This is a number used by the Nunaliit framework to index the date
intervals. When a date is saved to the database, this parameter must not be present.
Only the Nunaliit server should be populating this attribute.</li>
</ul>
</p>

<!-- ------------------------------------------------------------------ -->
<h3><a name="atlas_dates_form">Schema Form</a></h3>

<p>Populating a date structure in a document is facilitated by the use of a schema form.
In schema forms, a special date field is provided to manage date elements. The following
document structure helps illustrate the example:
<pre>
{
	"_id": "xxx"
	,"_rev": "yyy"
	,"employment":{
		"period":{
			"nunaliit_type":"date"
			,"date": "2002 / -"
			,"min": 1009861200000
			,"max": 1009861200000
			,"ongoing": true
			,"index": 23
		}
	}
}
</pre>
</p>

<p>Based on the previous document structure, the following schema form would manage
the date element:
<pre>
{{#employment}}
	Date: {{#:field}}period,date{{/:field}}
{{/employment}}
</pre>
</p>

<!-- ------------------------------------------------------------------ -->
<h3><a name="atlas_dates_display">Schema Display</a></h3>

<p>Since a copy of the string entered by the original user is saved in the "date" attribute,
displaying a date interval requires only the display of that attribute. The following schema
display is based on the previous example:
<pre>
{{#employment}}
	{{#period}}
		Date: {{date}}
	{{/period}}
{{/employment}}
</pre>
</p>

<!-- ------------------------------------------------------------------ -->
<h3><a name="atlas_dates_search">Searching for Dates</a></h3>

<p>The search box (the one used for text search) can be utilized to query
for documents that match a date interval. In a search box, a date or a date
range can be entered along with other search terms.</p>

<p>For example, the search terms "test 1980/1990" would return all documents
that contain the word "test" and had a date that intersects with the period
from 1-Jan-1980 to 31-Dec-1990.</p>


<!-- ****************************************************************** -->
<h2><a name="atlas_l10n">Multi-Language Support</a></h2>

<p>The Nunaliit Atlas Framework provides multi-language support. Atlases published
using Nunaliit can offer translations for all elements found in the User Interface (UI)
as well as designated data found in the database.</p>

<p>The Nunaliit UI is designed in English and can be translated by specifying translations
in other languages for each encountered English string. These translations can be stored
in the database or consolidated into translation files.</p>

<p>Nunaliit ships with French translation files.</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_ui">User Interface Strings</a></h3>

<p>The "showService" handles portions of the User Interface (UI) that needs
translating by searching for elements that contains a class "n2s_localize". All
encountered elements associated with this class are localized. The process of
localizing these elements is to retrieve the text content from the element 
containing the "n2s_localize" and replacing it a localized version. If the localized
version is not found, then the text is left unchanged.</p>

<p>The process of modifying HTML elements this way is applied to the whole HTML 
document, at the start of Nunaliit, as well as all HTML fragments created
by schema templating.</p>

<p>For example, if the following HTML fragment is found in the main page
or in a schema:
<pre>
	&lt;span class="n2s_localize"&gt;OK&lt;/span&gt;
</pre>
On a French page, the described process would replace the fragment above to:  
<pre>
	&lt;span class="n2s_localized"&gt;Accepter&lt;/span&gt;
</pre>
</p>

<p>When HTML is generated dynamically, it is possible to invoke the "showService"
to detect and replace all localized elements. The "showService" can be obtained from the
configuration object provided in the application initialization. Here is an example:
<pre>
function main(config){
	config.directory.showService.fixElementAndChildren( $('.select') );
};

jQuery().ready(function() {
	nunaliitConfigure({
		configuredFunction: main
		,rootPath: './'
	});
});
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_obj_structure">Localized String Structure</a></h3>

<p>When text is stored in a document, it generally is stored using the Javascript 
primitive type: String. In Nunaliit, when storing text that should be localized to various
languages when displayed, a special structure is used: the "localized string structure".</p>

<p>Here is an example of a document that stores textual information without locale
information:
<pre>
book = {
	"title":"A Book"
	,"author":"John Smith"
}
</pre>
</p>

<p>To follow the previous example, here is the equivalent document using the localized
string structure to represent that the title should be translated:
<pre>
book = {
	"title":{
		"nunaliit_type":"localized"
		,"en":"A Book"
		,"fr":"Un Livre"
	}
	,"author":"John Smith"
}
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_structure_in_schema">Displaying Localized String Structure in a Schema</a></h3>

<p>The templating used by Nunaliit schema documents is based on Handlebars.js. Regular Javascript
strings can be displayed easily with a mustache tag containing the name of the attribute. However,
when a string is localizable, the "localized string structure" is used instead of the primitive type.
In a Nunaliit schema, to display a string stored in localized string structure, a special function
is needed: :localize</p>

<p>For the following example, this document content is used:
<pre>
book = {
	"title":{
		"nunaliit_type":"localized"
		,"en":"A Book"
		,"fr":"Un Livre"
	}
	,"author":"John Smith"
}
</pre>
</p>

<p>Here is a possible schema to display this information:
<pre>
	&lt;div&gt;
		Title: {{#:localize}}title{{/:localize}}
	&lt;/div&gt;
	&lt;div&gt;
		Author: {{author}}
	&lt;/div&gt;
</pre>
</p>

<p>The schema presented above would work, even if the "title" attribute contained a primitive
string. This is to allow the gradual conversion from primitive strings to localized string structures.</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_structure_in_form">Schema Forms with Localized String Structures</a></h3>

<p>In forms created using a schema, localized string structures must be handled in a special manner.
As other attributes, the function used to display a form element is ":field". However, the "localized"
option is needed, as well as initial language codes. The language codes are used to display the appropriate
languages even if the language has not yet been filled.</p>

<p>For the following example, this document content is used:
<pre>
book = {
	"title":{
		"nunaliit_type":"localized"
		,"en":"A Book"
		,"fr":"Un Livre"
	}
	,"author":"John Smith"
}
</pre>
</p>

<p>Here is a possible schema to provide input fields to gather this information:
<pre>
	&lt;div&gt;
		Title: {{#:field}}title,localized=en+fr{{/:field}}
	&lt;/div&gt;
	&lt;div&gt;
		Author: {{#:field}}author{{/:field}}
	&lt;/div&gt;
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_service">Localization Service</a></h3>

<p>As a user navigates through the user interface (UI) provided by a Nunaliit atlas, various
strings that need to be translated to the user's locale are encountered. The initial string, in
English, is submitted to the localization service along with the desired language. If the service
contains a suitable translation for the given English string in the desired language, then
the string found in the UI is replaced with its appropriate translation. However, if the localization
service does not contain a suitable translation, then the original string is left in the UI (English).
</p>

<p>The localization service employs two methods to find translations:
<ol>
<li>It loads a number of translation files</li>
<li>It loads translations found in the database</li>
</ol>
</p>

<p>When a user is logged in and a missing translation is discovered, the localization service
submits a translation request to the database. A translation request contains the initial Englih
string as well as the language code for the locale that is missing the translation.</p>

<p>In this manner, it is possible to discover the stings that have been missed during the
localization process.</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_db_strings">Translations from Database</a></h3>

<p>It is possible to provide translations to the localization service via the "localization" 
tool, a web application located along the Nunaliit pages at ./tools/translation.html</p>

<p>Using this tool, an administrator can upload new translations associated with the 
translation requests submitted by the localization service. Once a translation has been 
submitted to the database, it becomes available to all the instances of the atlas.</p>

<p>This is particularly useful to circumvent the generation of a new translation file and is
meant to quickly correct errors found in atlas pages. However, this method is not as efficient
as using a translation file. Therefore, after a number of translations have been captured
using the database method, the translations should be moved to a translation file.</p>

<p>The web localization tool provides a way to display the content what an equivalent
translation file would have.</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_file_strings">Translation Files</a></h3>

<p>It is possible to add a number of already translated strings to the Nunaliit
framework by loading a resource file from the HTML file. An example of such a resource
file follows:
<pre>
;(function($n2){

var lang = 'fr';

if( !$n2.l10n ) $n2.l10n = {};
if( !$n2.l10n.strings ) $n2.l10n.strings = {};	
if( !$n2.l10n.strings[lang] ) $n2.l10n.strings[lang] = {};

function loadStrings(strings) {
	var dic = $n2.l10n.strings[lang];
	for(var key in strings) {
		dic[key] = strings[key];
	};
};

loadStrings({
	,"definition":"d&eacute;finition"
	,"author":"auteur"
});

})(nunaliit2);
</pre>
</p>

<p>The example above shows how some English strings are translated to French.</p>

<p>The Nunaliit framework automatically loads files for the currently selected language. 
The pattern of the file name is nunaliit_lang.&lt;lang&gt;.js and should be located in the directory
"htdocs" of the atlas. For example, if French was the currently selected language, the file
"nunaliit_lang.fr.js" would be loaded.</p>

<p>When using the "localization" tool, a web application
located along the Nunaliit pages at ./tools/translation.html, it is possible to obtain
the content of a would be translation file based on the full-filled translation requests found in the 
database by using the option "Translated".</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_fixing_english">Fixing an English string</a></h3>

<p>Using a translation file, it is possible to fix an error found in an English string.
The translation file "nunaliit_lang.en.js" is loaded when the current locale is English.
Although initially empty, it is possible to provide some content to provide a translation
from English to English. For the sake of an example, if one wishes to fix a typo from
"Wrang" to "Wrong", the following content can be used:
<pre>
;(function($n2){

$n2.l10n.addLocalizedStrings("en",{
"Wrang":"Wrong"
});

})(nunaliit2);
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_javascript">Localized Strings in Javascript</a></h3>

<p>When a portion of Javascript creates dynamically DOM elements, the textual
components of the DOM tree should be translated before they are inserted into the tree.
The l10n Javascript library provides an API to request a translated string for the
current locale based on an English string. The following example demonstrates this:
<pre>
	var okText = $n2.loc('OK','myPackage');
	$('.select').text(okText);
</pre>
</p>

<p>As demonstrated in the example above, a package name must be supplied when calling the
localization routine. This information is recorded when a proper translation is not found in
the repository and a translation request is recorded in the database. The package name helps
in sorting which translated strings belong to a which resource file.</p>

<p>Package names containing "nunaliit" are reserved for internal use.</p>

<p>A good practice is to define a local function at the top each script that redirects
"_loc" to the localization functions, including the approriate package name. This leads to
more concise code and helps quickly identify the text portion that requires translation. The
following example demonstrates this principle:
<pre>
;(function($n2){

// Local function
var _loc = function(str,args){ return $n2.loc(str,'myPackage',args); };

$('.select').text( _loc('OK') );

})(nunaliit2);
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_l10n_javascript_args">Localized Strings with Arguments</a></h3>

<p>Arguments can be inserted in strings used for translation. Arguments are named and replace
the portion of the string where the argument name is found, surrounded with curly braces. For example,
the following script:
<pre>
	var text = $n2.loc('This round: {a}  Total: {b}','myPackage',{"a":1,"b":2});
</pre>
would yield, in the English locale, the following value for the variable text:
<pre>
This round: 1  Total: 2
</pre>
</p>

<p>It is important to note that the arguments are passed as a dictionary of key-value pairs,
transported in a Javascript object. When translating localized strings, the argument names
must be left unchanged. In other words, argument names must not be translated.</p>

<!-- ****************************************************************** -->
<h2><a name="submission_database">Submission Database</a></h2>

<p>One of the features in Nunaliit is to enforce a submission database. When this feature
is enabled, all changes to the database are first recorded in a separate database, where
the changes are held until approved. Once approved, the changes are migrated to the main
document database.</p>

<p>The submission database is a way to ensure that the content published by an atlas is approved
before it is viewed by visitors. Without the use of a submission database, changes submitted by
users are immediately available to visitors.</p>

<p>Without the use of a submission database, controlling of the content published on an atlas
can be achieved by restricting the users that can authenticate to the atlas. The submisson database
allows accepting changes from a larger audience with jeopardizing the published information.</p>

<!-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ -->
<h3><a name="submission_database_how_it_works">How does the Submission Database work?</a></h3>

<p>A visitor to the atlas is not able to submit changes to the database until he/she first authenticate
with the atlas. Until a user is logged in, the user interface offered by Nunaliit do not present any
button or widget that suggests that a user can make changes to the atlas.</p>

<p>After logging in, a user specify changes to the database: new documents, modify or delete existing documents.
However, when a submission database is employed, the changes are not applied to the document database. Instead,
a new document, known as a submission, is created in the submission database. The submission document contains
a copy of the new or modified document. However, the document which the submission is based on is left
unchanged.</p>

<p>As the submission document is saved in the submission database, a number of rules based on role are
verified. A regular user of the atlas can add any new document. However, a regular user can only modify
or delete documents that he/she created. If these rules are broken, the submissions are rejected before
they are saved in the submission database.</p>

<p>Submission documents that are stored in the submission database are monitored by the server application. The
server application can make a number of decisions, based on the state of the submission document:
<ul>
<li>If a regular user submitted the changes, an e-mail is sent to all users that are able to
approve the changes (users with the vetter role)</li>

<li>If the user that submitted the changes has the ability to approve changes (user with vetter role),
then the submission is automatically approved.</li>

<li>If the submission is approved, the server application attempts to merge the changes to the
document database. If the merge succeeds, then the changes are available in the atlas. If the
merge does not succeed, an e-mail is sent to all users that are able to approve changes (users
with vetter role) to notify the conflict.</li>
</ul>
</p>

<p>Some users are given a special role, which is the vetter role. These users are known as "vetters".
Vetters are notified by e-mail when new changes are submitted to the atlas, via the submission database.
Also, they are notified when merging collisions occur. Vetters can use a special tool to approve or deny
changes. The tool also allows a vetter to modify the submission before it is approved.</p>

<p>Once a submission is approved by a vetter, the server application move the changes to the document
database. At this point, it is available in the atlas.</p>

<!-- ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ -->
<h3><a name="submission_database_configure">Configuring the Submission Database</a></h3>

<p>To enable the submission database, a special option must be set during the configuration of
the atlas. Move to the atlas directory and re-run the configuration:
<pre>
$ nunaliit config
</pre>
</p>

<p> During the configuration questions, enable the submission database. By default, the name of the
submission database is the name of the document database appended with "submissions".
<pre>
Enter the name of the atlas [atlas1]: 
Enter the URL to CouchDB [http://127.0.0.1:5984/]: 
Enter the name of the main database where atlas resides [atlas1]: 
Do you wish to manually verify each document submission?(Y/N) [N]: Y
Enter the name of the database where submissions will be uploaded [atlas1submissions]: 
Enter the name of the admin user for CouchDB [admin]: 
Enter the password for the admin user [XXXXXX]: 
Enter the port where the atlas is served [8080]: 
Enter a Google Map API key (empty if not using) [XXXXXXX]:
</pre>
</p>

<!-- ****************************************************************** -->
<h2><a name="atlas_tools">Atlas Tools</a></h2>

<p>A number of tools are offered by the Nunaliit Atlas framework. These tools
are linked in a page located at &lt;atlas-url&gt;/tools/index.html.
</p>

<!-- .................................................................. -->
<h3><a name="atlas_tools_approval">Approval Page</a></h3>

<p>Whenever a file is uploaded, it first must be approved before it is displayed
by the atlas. The approval page is a tool that reports which files area awaiting
for approval and which files have already been denied.</p>

<p>Only certain users are allowed to approve/deny file uploads. These special users
are given the role of "vetter". Users that have the role of "admin" are also allowed
to approve uploaded files.</p>

<!-- .................................................................. -->
<h3><a name="atlas_tools_modification">Modification Tool</a></h3>

<p> The modification tool allows a user to query for a set of documents and perform
reports, modifications and export based on the list documents. A list of document can be
created by various aspects of the database presented by Nunaliit. Then, a list can be refined
by filtering some documents. Finally, actions can be taken such as reporting, transforming or
exporting. 
</p>

<p>The modification tool provides four panes:
<ul>
<li><b>Queries Pane</b> : This is where a user creates lists of documents. All queries
performed during the session are listed here.</li>

<li><b>Query View Pane</b> : When a document list is selected in the top pane, the list
of documents associated with the query is displayed in this pane. This pane can also be 
used to refine the selected query or transform all the documents found in the query.</li>

<li><b>Document View Pane</b> : When a document is selected in the "Query View Pane", 
this pane displays the content of the document. From this pane, it is possible to manually edit
a single document.</li>

<li><b>Log Pane</b> : This pane keeps track of the operations performed by the modification
tool.</li>
</ul>

<h4><a name="atlas_tools_modification_refine_list">Refining a Document List</a></h4>

<p>To refine a document list, select a list from the "Queries Pane" and press the button titled
"Refine List" in the "Query View Pane". A dialog box appear and a list of refining algorithms
appear. Select the algorithm appropriate for the filtering and press "OK".</p>

<h4><a name="atlas_tools_modification_js_filtering">Javascript Filtering</a></h4>

<p>When creating a new query or when refining an existing query, it is possible to use a
Javascript function to filter the documents to be selected. This is a very powerful approach
to select document. However, one must be able to code Javascript.</p>

<p>The Javascript function is called with the content of each document. The aim of the function
is to return true, for document that should be selected, or false, for documents that should be
rejected.</p>

<p>The Javascript function is also given a configuration object to access services offered by Nunaliit
and the modification tool.</p>

<p>The following function selects documents that are associated with layer "a" or layer "b":
<pre>
function(doc, config){
   var layers = doc.nunaliit_layers; // nunaliit_layers is an array
   if( layers ){
      if( layers.indexOf('a') >= 0 ) return true;
      if( layers.indexOf('b') >= 0 ) return true;
   };
   return false;
}
</pre>
</p>


<h4><a name="atlas_tools_modification_filter_examples">Javascript Filter Examples</a></h4>

<h5><a name="atlas_tools_modification_filter_examples_invalid_geom">Filter Invalid Geometries</a></h5>

<pre>
function(doc, config){
	function isValidOlGeom(geom){
		if( geom.components ){
			for(var i=0,e=geom.components.length; i&lt;e; ++i){
				var c = geom.components[i];
				if( !isValidOlGeom(c) ){
					return false;
				};
			};
		} else {
			if( geom.x !== geom.x ){
				return false;
			};
			if( geom.y !== geom.y ){
				return false;
			};
		};
		
		return true;
	};

	function countChar(str,c){
		return str.split(c).length - 1;
	};
	
	function log(str){
		if( console && 'function' === typeof console.log ){
			console.log(str);
		};
		if( config && 'function' === typeof config.log ){
			config.log(str);
		};
	};

	if( doc && doc.nunaliit_geom ){
		if( 'geometry' !== doc.nunaliit_geom.nunaliit_type ){
			log(doc._id + ' invalid nunaliit_type');
			return true;
		};
		if( 'object' !== typeof doc.nunaliit_geom.bbox ){
			log(doc._id + ' no bbox');
			return true;
		};
		if( 4 !== doc.nunaliit_geom.bbox.length ){
			log(doc._id + ' invalid length on bbox');
			return true;
		};
		for(var i=0,e=doc.nunaliit_geom.bbox.length; i&lt;e; ++i){
			if( 'number' !== typeof doc.nunaliit_geom.bbox[i] ){
				log(doc._id + ' bbox without a number');
				return true;
			};
		};
		if( 'string' !== typeof doc.nunaliit_geom.wkt ){
			log(doc._id + ' no wkt');
			return true;
		};
		if( doc.nunaliit_geom.wkt.length &lt; 1 ){
			log(doc._id + ' empty wkt');
			return true;
		};

		// Balance the parentheses in WKT
		var openCount = countChar(doc.nunaliit_geom.wkt,'(');
		var closeCount = countChar(doc.nunaliit_geom.wkt,')');
		if( openCount != closeCount ){
			log(doc._id + ' wkt with unbalanced parentheses');
			return true;
		};   
		
		// Parse WKT if OpenLayers is available
		if( OpenLayers 
		 && OpenLayers.Geometry 
		 && 'function' === typeof OpenLayers.Geometry.fromWKT ){
			try {
				var geom = OpenLayers.Geometry.fromWKT(doc.nunaliit_geom.wkt);
				if( !geom ){
					log(doc._id + ' OpenLayers return null geometry');
					return true;
				} else if( !isValidOlGeom(geom) ){
					log(doc._id + ' OpenLayers geometry is not valid');
					return true;
				};
			} catch(e){
				log(doc._id + ' error during OpenLayers parsing');
				return true;
			};
		};
	};
	
	return false;
}
</pre>

<h4><a name="atlas_tools_modification_report">Reporting</a></h4>

<p>For a given list of documents, it is possible to generate a report. The report is
generated by a Javascript function which is called for each document in the list, and then
once more (without a document) to finalize the report.</p>

<p>To create a report, select a document list in the "Queries" pane and then press the button
titled "Report" in the "Queries View Pane". A Javascript function must be entered.</p>

<p>A report Javascript function should be written similar to the following example:
<pre>
function(opts_){
	var opts = nunaliit2.extend({
		config: null
		,doc: null
		,logger: null
	},opts_);
	
	if( opts.doc ){
		// This portion is executed once, for each document
	} else {
		// This portion is executed only once, after all documents
		// have been processed
		var logger = opts.logger;
		
		logger.log("Finished");
	};
}
</pre>
</p>

<h5><a name="atlas_tools_modification_report_schemas">Report Schema Distribution</a></h5>

<p>The following report function is an example where a document list is analyzed for the
schema each document is associated with. The report shows how many documents are associated
with each schema.</p>

<pre>
function(opts_){
	var opts = nunaliit2.extend({
		config: null
		,doc: null
		,logger: null
	},opts_);
	
	var schemaMap = opts.config.schemaMap;
	if( !schemaMap ){
		schemaMap = {};
		opts.config.schemaMap = schemaMap;
	};

	if( opts.doc ){
		var doc = opts.doc;
		if( doc.nunaliit_schema ){
			if( schemaMap[doc.nunaliit_schema] ){
				schemaMap[doc.nunaliit_schema] = schemaMap[doc.nunaliit_schema] + 1;
			} else {
				schemaMap[doc.nunaliit_schema] = 1;
			};
		};
	} else {
		opts.logger.log("Schema Names:");
		var schemaNames = [];
		for(var schemaName in schemaMap){
			schemaNames.push(schemaName);
		};
		schemaNames.sort();
		schemaNames.forEach(function(schemaName){
			var count = schemaMap[schemaName];
			opts.logger.log(''+schemaName+' ('+count+')');
		});
	}
}
</pre>

<h5><a name="atlas_tools_modification_report_structure">Report Document Structure</a></h5>

<p>The following report function is an example where the structure of the listed document
is presented. A variable called "selector" can be adjusted so that only a portion of the
document is analyzed. Each document is traversed from the point of the selector and each
attribute of the document is itemized in the report, stating the type of the attribute and
the number of occurrences. This is a useful report to get an idea of which attributes are in
use in a document list.</p>

<pre>
function(opts_){
	var opts = nunaliit2.extend({
		config: null
		,doc: null
		,logger: null
	},opts_);
	
	var selector = 
		$n2.objectSelector.parseSelector(''); // root
		//$n2.objectSelector.parseSelector('demo_doc');
		//$n2.objectSelector.parseSelector('demo_media');

	var config = opts.config;
    var attributesMap = config.attributesMap;
    if( !attributesMap ){
        attributesMap = {};
        config.attributesMap = attributesMap;
    };
	
	if( opts.doc ){
		var doc = opts.doc;

		selector.traverse(doc,function(value, childSelector){
	        if( typeof value === 'number' ){
	            insert(childSelector,'number');
	        } else if( typeof value === 'string' ){
	            if( value !== '' ){
	                insert(childSelector,'string');
	            } else {
	                insert(childSelector,'stringEmpty');
	            };
	        } else if( null === value ){
	            insert(childSelector,'null');
	        } else if( typeof value === 'object' ){
	            insert(childSelector,'object');
	        } else if( typeof value === 'function' ){
	            insert(childSelector,'function');
	        };
		});

	} else {
		var logger = opts.logger;
		
		logger.log("Finished");
		
		// Accumulate selectors
		var selectorStrings = [];
		for(var selectorString in attributesMap){
			selectorStrings.push(selectorString);
		};
		selectorStrings.sort();
		
		// Report each selector
		selectorStrings.forEach(function(selectorString){
			logger.log(selectorString);
			
			// Accumulate the types for this selector
			var info = attributesMap[selectorString];
			var types = [];
			for(var type in info){
				types.push(type);
			};
			types.sort();
			
			// Report each type
			types.forEach(function(type){
				var count = info[type];
				logger.log('- '+type+': '+count);
			});
		});
	};

	function insert(selector, type){
        var selectorString = selector.getSelectorString();

        var info = attributesMap[selectorString];
        if( !info ){
            info = {};
            attributesMap[selectorString] = info;
        };
        
        if( typeof info[type] === 'number' ){
            info[type] = info[type] + 1;
        } else {
            info[type] = 1;
        };
    };
}
</pre>

<h4><a name="atlas_tools_modification_transform">Document Transformation</a></h4>

<p>When transforming documents from a query, a Javascript function is used to perform the
modifications. The Javascript function is given three arguments:
<ol>
<li>The content of the document that is a candidate for transformation</li>
<li>A callback function to save the document</li>
<li>A callback function to skip this document</li>
</ol>
</p>

<p>Two callbacks are provided to allow a function to perform asynchronous operations. When
transformations are completed on a document, the proper callback must be invoked. If during
the execution of the function it is discovered that the document should remain unchanged, then
the skip callback must be invoked. Only one of the two callbacks should be called.</p>

<p>If no callback is invoked, then the transformation process stalls.</p>

<p>Finally, the transformation function is given a configuration object which provides
access to all services offered by Nunaliit and the modification tool. This is useful to
query other views or documents prior to modifying the current document.</p>

<p>The following example function shows how it is possible to assign a set of documents to
the "genericDoc" schema:
<pre>
function(doc,onTransformedFn,onSkippedFn,config){
   doc.nunaliit_schema = "genericDoc";
   onTransformedFn();
};
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="atlas_tools_debug">Debug Page</a></h3>

<p>There exists a tool page to configure parameters specific to a browser, known as
the Debug Page. The Debug Page is located at <atlas>/tools/debug.html</p>

<p>The configuration parameters as discussed below.</p>

<h4><a name="atlas_tools_debug_badProxy">Bad Proxy</a></h4>

<p>When this parameter is enabled, Nunaliit tries to reach resources using a different
URL for each attempt. This is to circumvent caching proxy servers. This parameter should
be set only if you experience strange behaviour from Nunaliit or errors relating to
update conflicts.</p>

<p>Since Nunaliit relies heavily on a RESTful API, it is susceptible to badly configured
caching proxy server. Setting this parameter and reloading the Nunaliit page should fix
issues with those servers.</p>

<p>Note that one should not turn on this parameter if it is not warranted since it greatly
reduce performance.</p>

<h4><a name="atlas_tools_debug_logging">Event Logging</a></h4>

<p>When this parameter is enabled, Nunaliit prints to the console an entry for each dispatching
event that is sent. This is useful if one is attempting to track the reason behind an
unexpected behavior displayed by Nunaliit. </p>

<p>This is a debugging tool and one should not turn on this parameter if it is not warranted since
it greatly reduce performance.</p>

<!-- .................................................................. -->
<h3><a name="atlas_tools_bulk_media_upload">Bulk Media Upload</a></h3>
<p>This tool is for uploading lots of media files in bulk. The tool starts with selecting a
schema to use for the uploaded media. After selecting the schema the fields of the schema are displayed.
Values put into the fields will be applied to every media file uploaded. Last select the media to upload
using the file chooser 'Choose Files' and then click the upload button. The files will all have an 
import_profile created with the id bulk_media_upload_<date time string>. As the files are uploaded
a status table is displayed to show the progress.</p>

<!-- ****************************************************************************** -->
<h2><a name="importing_data">Importing Data</a></h2>

<p>The natural way for Nunaliit to gain data is via the module interface where a user can add
features to the map. There various other methods which includes using tools such a the "Data
Browser", where any documents can be created.</p>

<p>However, when a large amount of data needs to be imported, then the manual approach is not
suitable. This section deals with the methods available to import data.</p>

<!-- .................................................................. -->
<h3><a name="importing_data_profile">Import Profile</a></h3>

<p>The Nunaliit framework offers a tool page to import data using a profile, known as
"Import Profile". Import profiles are documents that dictate how external data sets are
imported to the database employed by the framework. The import tool page is located
at &lt;url&gt;/tools/import.html</p>

<p>The advantages of using import profiles are:
<ul>
<li>Different formats are supported: JSON, GeoJSON and CSV.</li>
<li>Data sets can be re-synchronized over time. This means that if a data set is re-imported
later, the changes in the external values are taken into account and propagated to the
database. Collisions are detected and presented to the user for resolution.</li>
</ul>
</p>

<p>During the import, the content of the input data set is broken into a list of
import entries. A document is created for each import entry. On subsequent imports,
each entry is matched to the associated document and the appropriate updates are performed.</p>

<p>Each import entry contributes properties and, optionally, a geometry. During import, those
properties are copied to the desired location in the database document.</p>

<p>For each data set to be imported, an import profile must be created. Here is an example
of an import profile:
<pre>
{
   "_id": "import_profile.demo_test",
   "nunaliit_import_profile": {
       "nunaliit_type": "import_profile",
       "id": "demo_test",
       "label": {
           "nunaliit_type": "localized",
           "en": "Demo Test"
       },
       "type": "geojson",
       "options": {
       },
       "operations": [
           "copyAllAndFixNames(demo_test)"
       ],
       "schemaName": "demo_test",
       "layerName": "public"
   }
}
</pre>
</p>

<p>The main section of the import profile document is the structure "nunaliit_import_profile".
In fact, this structure contains all the information conveyed by the import profile. The attributes
of this structure are defined here:
<ul>
<li><b>nunaliit_type</b> : For an import profile, this must be set to the string "import_profile".</li>

<li><b>id</b> : This is a compulsory string. This is the identifier for the import profile. It must
be unique among all import profiles.</li>

<li><b>label</b> : This is a localized string structure. It is optional. It represents the text
shown to a user when selecting this import profile.</li>

<li><b>type</b> : This is a compulsory string. It represents the type of data set imported
using this profile. Possible values are: "json", "geojson" and "csv".</li>

<li><b>options</b> : This is an optional object structure. It content is dependent on the
type of the import profile.</li>

<li><b>operations</b> : This is an array of operation strings. The operation strings are
specifying how the data is copied from the data set into documents.</li>

<li><b>schemaName</b> : This is an optional string. It represents the name of the schema
assigned to documents created by the import profile.</li>

<li><b>layerName</b> : This is an optional string or array of strings. It represents the identifier of the layer(s)
assigned to documents created by the import profile.</li>
</ul>
</p>

<p>The possible operation strings are:
<ul>
<li><b>copyAll(&lt;key&gt;)</b> : This operation copies all properties found in import
entry to a location specified by &lt;key&gt;.</li>

<li><b>copyAllAndFixNames(&lt;key&gt;)</b> : This operation copies all properties found 
in import entry to a location specified by &lt;key&gt;, similar to "copyAll". However,
the attribute names are corrected to be more compatible with JSON. One such correction is
to replace spaces found in the attribute name with underscores.</li>

<li><b>assign(&lt;key&gt;, '&lt;prop-name&gt;')</b> : This operation copies a single property
from the import entry to the target document. The name of the property to be copied is
specified by '&lt;prop-name&gt;'. The location in the database document where the property
is copied to is specified by the selector &lt;key&gt;.</li>

<li><b>reference(&lt;key&gt;, '&lt;prop-name&gt;')</b> : This operation copies a single property
from the import entry to the target document, similar to "assign". However, the resulting
value in the database document is a reference to the property value.</li>

<li><b>importReference(&lt;key&gt;, '&lt;prop-id&gt;', '&lt;import-id&gt;')</b> : This operation 
copies a single property from the import entry to the target document, similar to "reference". 
However, this operation references other documents that were previously imported. The string
'&lt;prop-id&gt;' specifies the name of the import profile. The string '&lt;import-id&gt;'
is the name of the property in the import entry that supplies the import identifier.</li>
</ul>
</p>

<h4><a name="importing_data_profile_json">JSON Import Profile</a></h4>

<p>When the type of the import profile is "json", then the "options" structure is
defined with the following attributes:
<ul>
<li><b>idAttribute</b> : This is a compulsory string, unless ignoreId is set. This is the name of the
property that specifies a unique value for each import entry.</li>
<li><b>unrelated</b> : This is an optional boolean. If set, the import profile is used to import
unrelated data sets. If this is set, then every import is creating a new set of documents, regardless
if the same data is provided.</li>
<li><b>ignoreId</b> : This is an optional boolean. If set, ids are not assigned to the entries.
This means that idAttribute does not need to be provided. This also sets the unrelated property.</li>
</ul> 
</p>

<p>As a complete example for importing JSON data, here is a set of steps to test JSON import:</p>

<p>1. Create an import profile document: 
<pre>
{
   "_id": "import_profile.demo",
   "nunaliit_import_profile": {
       "nunaliit_type": "import_profile",
       "id": "demo",
       "label": {
           "nunaliit_type": "localized",
           "en": "Demo Doc"
       },
       "type": "json",
       "operations": [
           "copyAllAndFixNames(demo_doc)"
       ],
       "options": {
           "idAttribute": "id"
       },
       "schemaName": "demo_doc",
       "layerName": "public"
   }
}
</pre>
</p>

<p>2. Import JSON data: 
<pre>
[
{"id":"0001","title":"Test Import 0001","description":"Description 1"}
,
{"id":"0002","title":"Test Import 0002","description":"Description 2"}
]
</pre>
</p>

<h4><a name="importing_data_profile_geojson">GeoJSON Import Profile</a></h4>

<p>When the type of the import profile is "geojson", then the "options" structure is
defined with the following attributes:
<ul>
<li><b>idAttribute</b> : This is an optional string. This is the name of the property
that specifies a unique value for each import entry. This is needed only if the 
GeoJSON features do not include the "id" attribute.</li>
<li><b>unrelated</b> : This is an optional boolean. If set, the import profile is used to import
unrelated data sets. If this is set, then every import is creating a new set of documents, regardless
if the same data is provided.</li>
</ul> 
</p>

<p>As a complete example for importing GeoJSON data, here is a set of steps to test import:</p>

<p>1. Create an import profile document: 
<pre>
{
   "_id": "import_profile.demo_test",
   "nunaliit_import_profile": {
       "nunaliit_type": "import_profile",
       "id": "demo_test",
       "label": {
           "nunaliit_type": "localized",
           "en": "Demo Test"
       },
       "type": "geojson",
       "options": {
           "idAttribute": "id"
       },
       "operations": [
           "copyAllAndFixNames(demo_test)"
       ],
       "schemaName": "demo_test",
       "layerName": "public"
   }
}
</pre>
</p>

<p>2. Import GeoJSON data: 
<pre>
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": 1,
            "properties": {
                "gid": 1,
                "PID": "9-18-3",
                "BCT": "BCT126",
                "OWNER_TYPE": "A",
                "LOCNO": 0,
                "LOCEXT": "",
                "STREET": "CROSBY LANE",
                "ACQUIRED": "5/7/2010",
                "GRANTOR": "John A. SPARGO",
                "UPLAND": 0,
                "WETLAND": 3.96,
                "TOTAL": 3.96,
                "HABITAT": "salt marsh"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -70.03209,
                    41.78278
                ]
            }
        }
    ]
}
</pre>
</p>

<h4><a name="importing_data_profile_csv">CSV Import Profile</a></h4>

<p>When the type of the import profile is "csv", then the "options" structure is
defined with the following attributes:
<ul>
<li><b>idAttribute</b> : This is a compulsory string, unless ignoreId is set. This is the name of the
column that specifies a unique value for each import entry.</li>
<li><b>unrelated</b> : This is an optional boolean. If set, the import profile is used to import
unrelated data sets. If this is set, then every import is creating a new set of documents, regardless
if the same data is provided.</li>
<li><b>ignoreId</b> : This is an optional boolean. If set, ids are not assigned to the entries.
This means that idAttribute does not need to be provided. This also sets the unrelated property.</li>
</ul> 
</p>

<p>As a complete example for importing CSV data, here is a set of steps to test CSV import:</p>

<p>1. Create an import profile document: 
<pre>
{
   "_id": "import_profile.demo",
   "nunaliit_import_profile": {
       "nunaliit_type": "import_profile",
       "id": "demo_csv",
       "label": {
           "nunaliit_type": "localized",
           "en": "Demo Doc CSV"
       },
       "type": "csv",
       "operations": [
           "copyAllAndFixNames(demo_doc)"
       ],
       "options": {
           "idAttribute": "id"
       },
       "schemaName": "demo_doc",
       "layerName": "public"
   }
}
</pre>
</p>

<p>2. Import CSV data: 
<pre>
id,title,description,x,y,%_graph
0,"Test Import 0001","Description 1",-75.5,45.5,5
1,"Test Import 0002","Description 2",-75.6,45.6,10
</pre>
</p>

<!-- .................................................................. -->
<h3><a name="importing_data_geojson">GeoJSON Import</a></h3>

<p>The "robot", a server component, is called whenever a new file is uploaded. The robot analyzes
the file and queues the file for approval. In the case of a GeoJSON file, once it is approved,
the features found in the GeoJSON file are parsed and a document for each feature is added to the
database. Since features must generally be associated with a layer, a new layer definition is created
and added to the document where the GeoJSON file is attached.</p>

<p>For each feature, the document created looks like:
<pre>
{
   "_id": "ced904e20a5c75b00f59452a2700bb90",
   "_rev": "1-639899baf65c77077979ad0d6314ff1a",
   "nunaliit_geom": {
       "nunaliit_type": "geometry",
       "bbox": [-164.418029,60.614723,-164.418029,60.614723],
       "wkt": "POINT(-164.418029 60.614723)"
   },
   "geojson": {
       "desc": "",
       "cmt": "",
       "ogr_LabelStyle": "water"
   },
   "source": {
       "nunaliit_type": "reference",
       "doc": "ced904e20a5c75b00f59452a2700b10a"
   },
   "nunaliit_layers": ["ced904e20a5c75b00f59452a2700b10a"]
 }
</pre>
</p>

<p>All attributes found for the GeoJSON feature are stored in a key called "geojson". The geometry
associated with the feature is transposed to the special key named "nunaliit_geom". The key
"source" contains a reference to the document where the original GeoJSON attachment is found. Finally,
the special key "nunaliit_layers" is populated with the layer identifier for the new feature.
</p>

<p>The layer definition added to the document that contains the GeoJSON attachement is examplified
here:
<pre>
 "nunaliit_layer_definition": {
       "id": "ced904e20a5c75b00f59452a2700b10a",
       "nunaliit_type": "layerDefinition",
       "name": "GeoJSON - mygeojson.json",
       "bbox": [-165.416304,60.030395,-163.345956,61.247857]
   }
</pre>
</p>

<p>In a layer definition, an identifier (attribute "id") is given. This identifier is
used to associate a feature to a layer via the "nunaliit_layers" array. The layer definition
also contains a name, which is the label used to report the layer to a user. The name
can be modified to suit the atlas. Finally, a bounding box can be specified ("bbox") that
represents the portion of space covered by the layer.</p>

<p>The following steps explain how to exercise the import of a GeoJSON file starting from
the default generic atlas that is created by Nunaliit:
<ul>
<li>Using the map interface (main page), add a point to the map, choosing "genericDoc" as the schema.</li>
<li>Select new point from the map and click on "Add Related" button in the display. If a schema selection
is presented, select "genericMedia".</li>
<li>While adding a related generic media, choose the desired GeoJSON file for upload. Press "OK"</li>
<li>Once the file is uploaded, go to the "Approval Page" and approve the newly uploaded file.</li>
<li>Once the file is approved, return to the map page. The related media under the original point
now shows a link titled "Add Layer".</li>
<li>Pressing on "Add Layer" adds the layer definition found in the document to the current map. The map moves the displayed area to show the portion covered by the layer definition.</li>
</ul>
</p>

<p>In general, features imported this way can not be displayed in the side pane because the document
does not specify the schema to use for display. However, the content of the document can be viewed by
first editing the document and then selecting the "Tree View". Using this approach, one can determine
the layer identifier for the new points. Once the layer identifier is obtained, it is possible
to use the <a href="#atlas_tools_modification">Modification Tool</a> to perform bulk changes on all the
points of a layer.</p>

<!-- ****************************************************************************** -->
<h2><a name="exporting_data">Exporting Data</a></h2>

<p>Nunaliit provides two methods to export data out of Nuanliit. On of these method is via the 
<a href="#atlas_tools_modification">Modify Tool</a>, while the other is via the "Export Tool"
(look under tools page).</p>

<p>Both these methods allow exporting of data into GeoJSON and CSV format. Some preparations are
required to enable export of documents and depending on the intended format, these preparations
differ slightly.</p>


<h3><a name="exporting_data_geojson">Exporting GeoJSON Format</a></h3>

<p>When a document is exported in GeoJSON format, the schema associated with the document is examined
and the property "export" is fetched. This property controls which attributes from the
document are included during export. The "export" property found in the schema should be an
array of objects. Each object represents an exported attribute. The following is an exmaple of
a schema that specifies exported attributes.</p>

<pre>
{
   "_id": "schema.place",
   "nunaliit_type": "schema",
   "nunaliit_schema": "schema",
   "brief": ...,
   "display": ...,
   "form": ...,
   "isRootSchema": true,
   "export": [
       {
           "select": "place.name",
           "label": "name",
           "type": "text"
       },
       {
           "select": "place.description",
           "label": "description",
           "type": "text"
       },
	   {
           "select": "nunaliit_created.time",
           "label": "created_timestamp",
           "type": "date"
       }
   ]
}
</pre>

<p>Each object in the "export" array should contain three properties:
<ul>
<li><b>select</b>: This is a string containing a dotted notation of the document property
that is exported.</li>

<li><b>label</b>: This is a string which is the name of the key under which the selected
value is exported.</li>

<li><b>type</b>: This is a string which describes the type of the exported value. It can be either "text" or "date". If "date" is specified, it must be used on a Unix timestamp and an ISO 8601 date timestamp will be exported.</li>
</ul>
</p>

<p>When exporting in GeoJSON format, a document is skipped if it does not contain a geometry.</p>


<h3><a name="exporting_data_csv">Exporting CSV Format</a></h3>

<p>The process of exporting data in CSV format is very similar to the one exporting in GeoJSON
format. The main difference is that the schema property used to control exported attributes is
named "csvExport" instead of "export". The following is an example of a schema containing the
required information to export in CSV format:</p>

<pre>
{
   "_id": "schema.place",
   "nunaliit_type": "schema",
   "nunaliit_schema": "schema",
   "brief": ...,
   "display": ...,
   "form": ...,
   "isRootSchema": true,
   "csvExport": [
       {
           "select": "place.name",
           "label": "name",
           "type": "text"
       },
       {
           "select": "place.description",
           "label": "description",
           "type": "text"
       },
	   {
           "select": "nunaliit_created.time",
           "label": "created_timestamp",
           "type": "date"
       },
       {
           "label": "geom",
           "type": "geometry"
       }
   ]
}
</pre>

<p>In CSV format, to export the geometry associated with a document, the type "geometry" must
be used in the csvExport entries. When "geometry" is specified, the "select" property must not
be provided.</p>

<h3><a name="exporting_data_tool_select">Modification Tool</a></h3>

<p>Using the modification tool, a user can export data by selecting a set of document via a query.
Once this is done and that the list of documents is listed, the button titled "Export Geometries"
initiates the export process. During this process, a file of the appropriate format is downloaded from Nunaliit
containing an entry for most documents selected. Documents that are associated with a schema that 
does not contain the required export information are skipped.</p>

<h3><a name="exporting_data_tool_export">Export Tool</a></h3>

<p>Using the export tool, a user can export data by selecting a schema type or a layer.
Based on the selection, the list of associated documents is retrieved and displayed (or downloaded)
in the selected format by accessing the appropriate controls. During the export process, documents 
that are associated with a schema that does not contain the required export information are skipped.</p>

<h3><a name="full_atlas_export">Export Full Atlas</a></h3>
<p>Export all documents and media for an atlas. See 
<a href="https://github.com/GCRC/nunaliit/wiki/Full-Atlas-Export">Full Atlas Export</a> wiki page for details.</p>
<!-- ****************************************************************************** -->
<h2><a name="inreach">inReach Device Support</a></h2>

<p>See <a href="https://github.com/GCRC/nunaliit/wiki/inReach-Device-Support">inReach Device Support</a> wiki page.</p>
