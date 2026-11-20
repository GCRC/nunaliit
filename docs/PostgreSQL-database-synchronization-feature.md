# BETA
> [!WARNING]
> This feature is in beta currently, development and testing are ongoing!

# Overview
Nunaliit 2.4.0+ will be able to synchronize data to a PostgreSQL database. This configurable feature will be off by default. When enabled, documents in Nunaliit's CouchDB database will be synchronized to a specified PostgreSQL database.

# Configuration
## Nunaliit Configuration
PostgreSQL sync has the following configuration options that should be set in `install.properties` configuration file:
* `postgres.dbName`: **Required** Name of the DB to sync data to. Setting this configuration value enables the PostgreSQL synchronization feature.
* `postgres.host`: Host to connect to.
* `postgres.port`: (defaults to 5432) Port to connect to.
* `postgres.user`: PostgreSQL user to connect as.
* `postgres.recreateOnStart`: (defaults to true) If the DB should be recreated when Nunaliit starts.
* `postgres.syncOnChange`: (defaults to false) If document changes detected in CouchDB should be synchronized to PostgreSQL DB as they are detected. If true then changes to schema documents will result in a DB recreation using the new structure(s) and changes to schema documents will be synchronized for the document changed to the PostgreSQL DB.

If setting a password for postgres it should be set in the `sensitive.properties` file:
* `postgres.password`: PostgreSQL password for connection.

## Schema Configuration
Only schemas that have a `pgExport` key will be synchronized to the PostgreSQL DB. The file to create this key/value is automatically created and updated from definition.json when you run the `nunaliit update-schema` command.

Common Nunaliit fields are always exported and do not need to be configured and include:
* `_id` -> table `n2.docs`, column `id`
* `_rev`-> table `n2.docs`, column `nunaliit_rev`
* `nunaliit_schema`-> table `n2.docs`, column `nunaliit_schema`
* doc -> table `n2.docs`, column `nunaliit_values`: This is the entire CouchDB document inserted into a jsonb column.
* `nunaliit_geom`-> table `n2.docs`, column `nunaliit_geom`: original full resolution geometry
* `nunaliit_source` -> table `n2.docs`, column `nunaliit_source`
* `nunaliit_layers` -> tables `n2.docs_layers` (doc_id, layer_id), `n2.layers` (unique list of layers)
* `nunaliit_relations` -> table `n2.docs_docs`, columns `src_id` and `tgt_id`

The pgExport.json file is an array of objects to configure each schema specific field that will be synchronized with the PostgreSQL. A small example looks like:
```
[
	{
		"select": "testschema.localized_field",
		"field": "localized_field",
		"strategy": "column",
		"language_codes": ["en", "fr"],
		"type": "localized"
	},
	{
		"select": "testschema.selfield",
		"field": "selfield",
		"type": "selection"
	},
	{
		"select": "testschema.name",
		"field": "name",
		"type": "string"
	},
	{
		"select": "testschema.strarr",
		"field": "strarr",
		"type": "array",
		"strategy": "array",
		"elementType": "string"
	}
]
```
Each entry in the array must include `select`, `type` and `field` keys with values, malformed entries will be skipped. These keys provide the following info:
* `select`: A selector to find the value in dot notation. For instance `testschema.name` will fetcht the name value from the object value for the key `testschema` at the root of the document.
* `field`: The name of the column to create in the PostgreSQL DB.
* `type`: The type of data in the field. 

### Types
Currently supported types are:
  * `string` - PostgreSQL `TEXT` column.
  * `localized` - See below for additional configuration. Can be `TEXT` columns or table with `TEXT` values.
  * `date` - PostgreSQL `TEXT` column.
  * `array` - See below for additional configuration and PostgreSQL details.
  * `tag` - Creates a table to store tag values and a join table to link tag values with documents.
  * `selection` - PostgreSQL `TEXT` column.
  * `checkbox` - PostgreSQL `BOOLEAN` column.
  * `checkbox_group` - A PostgreSQL `BOOLEAN` column for each checkbox in the group.
  * `geometry` - PostGIS `GEOMETRY` column.

Defined but not yet supported types are
  * `reference`
  * `file`
  * `title`
  * `hover_sound`
  * `nunaliit_key_media_ref`
  * `triple`
  * `createdBy`
  * `createdTime`
  * `custom`

### Types with additional configuration

#### localized
Localized data in CouchDB is stored as an object with a key for each langauge text. There are two ways to transfer this data to postgres and they are configured using the `strategy` key.

**Column Strategy** 
This creates a column per language in the schema table. This strategy is configured with `"strategy": "column"` and requires an array of language codes (e.x. `"language_codes": ["en", "fr"]`) For example the config:
```
"select": "testschema.localized_field",
"field": "localized_field",
"strategy": "column",
"language_codes": ["en", "fr"],
"type": "localized"
```
Will create two columns in the schema table `localized_field_en` and `localized_field_fr`. Any localization data in CouchDB in other languages will be ignored.

**Table Strategy** 
This creates a localization table with one entry per language discovered in the localization object in CouchDB. For instance if the schema is `testschema` and the config is:
```
"select": "testschema.localized_field",
"strategy": "table",
"type": "localized"
```
A table `testschema_localized_field` will be created with columns `id`, `doc_id`, `text` and `code`.

#### array
Array data requires additional configuration to be transferred to PostgreSQL. You must provide a `strategy` and the `elementType`. Currently only `"strategy": "array"` and `"elementType": "string"` are supported. This will create an array of text (`TEXT[]`) column in PostgreSQL.

# Manually starting recreation of PostgreSQL DB
If the PostgreSQL synchronization has been enabled you can start a synchronization on the data export tools page:
1. Navigate to <atlas_url>/tools/export.html and click the 'Start PG Reload' button.

# PostgreSQL Structure
The PostgreSQL DB configured for use by Nunaliit will have an n2 schema. Nunaliit will always create the following tables:
* `docs`: Consistent information that Nunaliit documents have across schemas, see the "Schema Configuration" section for details.
* `layers`: Unique list of layers used by data transferred to PostgresSQL from CouchDB.
* `docs_layers`: Doc/layer join table.
* `docs_docs`: Doc/doc join table, used to transfer nunaliit_relations data.

In addition to these tables schema specific tables are created for every schema with a `pgExport` key. These tables are named the same as the schema name. So the schema in CouchDB with name `test_schema` will have a table `test_schema` in the n2 PostgreSQL schema.

Information that is specific to a schema and requires a new table will result in a table being created in the form `<schema_name>_<field>`. However, information that can be shared across schemas (for example tags) will be place in a new table for that data. Consider two schemas `test_schema` and `first_schema`. They both have a tag field `data_tags`. This will result in the following tables being created:
* `test_schema`: The test_schema data that can be put directly in columns (other data, not tags)
* `first_schema`: The first_schema data data that can be put directly in columns (other data, not tags)
* `data_tags`: Table containing unique tags, has columns `id` and `value`
* `test_schema_data_tags`: Join table between test_schema docs and data_tags.
* `first_schema_data_tags`: Join table between test_schema docs and data_tags.