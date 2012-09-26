Setup Instructions
------------------


############
#
# Database
#
############

One must create some tables:
- names table : table with all geographic points
- contributions table : table with contributions associated to points
- users table : authentication table for users
- sec_tables table : DbSec requirement.
- sec_columns table : DbSec requirement.
- a number of views to export tables via DbSec

To create database:
> sudo su -l postgres
> createdb <db-name> --encoding utf8
> createlang plpgsql <db-name>
> psql -d <db-name> -f /usr/share/postgresql/8.4/contrib/postgis-1.5/postgis.sql
> psql -d <db-name> -f /usr/share/postgresql/8.4/contrib/postgis-1.5/spatial_ref_sys.sql
> psql <db-name>

-- ************
-- Names Table
-- This is the original table that contains records of
-- placenames.
-- ************

CREATE TABLE names (
    id serial primary key,
    place_id serial,
    map_sheet character varying,
    placename character varying,
    syllabics character varying,
    entity character varying,
    meaning character varying,
    moreinfo text,
    old_id character varying,
    ici_name character varying,
    old_name character varying,
    alt_name character varying,
    source character varying,
    questions text,
    hover_audio character varying,
    layer integer default 0,
    the_geom geometry,
    CONSTRAINT enforce_dims_the_geom CHECK ((ndims(the_geom) = 2)),
    CONSTRAINT enforce_srid_the_geom CHECK ((srid(the_geom) = 4326))
);


-- Add geometry to geometry columns
INSERT INTO geometry_columns 
	(f_table_catalog,f_table_schema,f_table_name,f_geometry_column,coord_dimension,srid,type) 
	VALUES ('','public','names','the_geom',2,4326,'GEOMETRY');
 

-- *************
-- names_0 View
-- View of table 'names' exported for admin users.
-- *************

CREATE VIEW names_0 AS SELECT id,place_id,placename,syllabics,entity,meaning,moreinfo,alt_name,source,questions,hover_audio,layer,the_geom from names;

CREATE RULE names_0_ins AS ON INSERT TO names_0
  DO INSTEAD
    INSERT INTO names(
      id
      ,place_id
      ,placename
      ,syllabics
      ,entity
      ,meaning
      ,moreinfo
      ,alt_name
      ,source
      ,questions
      ,hover_audio
      ,layer
      ,the_geom
    ) VALUES (
      NEW.id
      ,NEW.place_id
      ,NEW.placename
      ,NEW.syllabics
      ,NEW.entity
      ,NEW.meaning
      ,NEW.moreinfo
      ,NEW.alt_name
      ,NEW.source
      ,NEW.questions
      ,NEW.hover_audio
      ,NEW.layer
      ,NEW.the_geom
    );

CREATE RULE names_0_upd AS ON UPDATE TO names_0
  DO INSTEAD
    UPDATE names
      SET placename = NEW.placename
      ,syllabics = NEW.syllabics
      ,entity = NEW.entity
      ,meaning = NEW.meaning
      ,moreinfo = NEW.moreinfo
      ,alt_name = NEW.alt_name
      ,source = NEW.source
      ,questions = NEW.questions
      ,hover_audio = NEW.hover_audio
      ,layer = NEW.layer
      ,the_geom = NEW.the_geom
    WHERE id = OLD.id;

CREATE RULE names_0_del AS ON DELETE TO names_0
  DO INSTEAD
    DELETE FROM names
      WHERE id = OLD.id;


-- *************
-- names_1 View
-- View of table 'names' that exports the table for regular users. Note
-- that column 'layer' remains fixed to 1 for this view.
-- *************

CREATE VIEW names_1 AS SELECT id,place_id,placename,syllabics,entity,meaning,moreinfo,alt_name,source,questions,the_geom from names where layer=1;

CREATE RULE names_1_ins AS ON INSERT TO names_1
  DO INSTEAD
    INSERT INTO names(
      id
      ,place_id
      ,placename
      ,syllabics
      ,entity
      ,meaning
      ,moreinfo
      ,alt_name
      ,source
      ,questions
      ,layer
      ,the_geom
    ) VALUES (
      NEW.id
      ,NEW.place_id
      ,NEW.placename
      ,NEW.syllabics
      ,NEW.entity
      ,NEW.meaning
      ,NEW.moreinfo
      ,NEW.alt_name
      ,NEW.source
      ,NEW.questions
      ,1
      ,NEW.the_geom
    );

CREATE RULE names_1_upd AS ON UPDATE TO names_1
  DO INSTEAD
    UPDATE names
      SET placename = NEW.placename
      ,syllabics = NEW.syllabics
      ,entity = NEW.entity
      ,meaning = NEW.meaning
      ,moreinfo = NEW.moreinfo
      ,alt_name = NEW.alt_name
      ,source = NEW.source
      ,questions = NEW.questions
      ,the_geom = NEW.the_geom
    WHERE id = OLD.id AND layer = 1;

CREATE RULE names_1_del AS ON DELETE TO names_1
  DO INSTEAD
    DELETE FROM names
      WHERE id = OLD.id AND layer = 1;     

-- ************
-- Contributions table
-- ************

-- Mar. 2, 2009
--
-- Contributions table definition - PostgreSQL version:
--
-- unnormalized contributions table:
-- place_id    : Matches unique place_id in names table
-- contributor : Account identifier for creator of the contribution
-- email       : Email address for creator of the contribution
-- title       : Contribution heading
-- notes       : Text comments of contribution
-- filename    : Filename of uploaded file, if appropriate
-- mimetype    : Mimtype of the uploaded file
-- fileuse     : A tag for special uses of the uploaded file, if it
--               exists.  Only current case, is the designation of
--               sound file as a 'hoversound' to indicate that the
--               sound has a special use in map UI.
-- create_time : Time contribution was entered into the system.
-- related_to  : Reference to a contribution this is a response to.
-- likes       : Number of votes for this contribution. May be used in
--               ordering search results.
-- dislikes    : Number of votes against this contribution.  May be used
--               in ordering search results. 

create table contributions (
	id          serial primary key,
	place_id    integer not null,
	contributor_id integer,
	title       varchar,
	notes       varchar,
	filename    varchar,
	original_filename varchar,
	mimetype    varchar,
	fileuse     varchar,
	create_ts   timestamp,
	create_ms   bigint,
	related_to  integer,
	likes       integer,
	dislikes    integer
);

-- ************
-- User Auth
-- Table that contains all authorized users.
-- ************

CREATE TABLE users (
    id serial PRIMARY KEY,
    name varchar not null,
    email varchar unique not null,
    password varchar not null,
    group_id int not null default 10 -- group_id : 0=>anonymous  1=>admin  other=>regular users
);

insert into users (name,email,password,group_id) values ('Administrator','admin','admin',1);
insert into users (name,email,password) values ('Test User','test','test');
insert into users (name,email,password,group_id) values ('Anonymous User','anonymous','anonymous',0);

-- ***************
-- sec_tables Table
-- Required by dbSec
-- ***************

CREATE TABLE dbsec_tables (
    id serial primary key
    ,logical_name character varying
    ,group_id integer
    ,physical_name character varying
    ,priority integer default 0
    ,options character varying
);

-- *****************
-- sec_columns Table
-- Required by dbSec.
-- *****************

CREATE TABLE dbsec_columns (
    id serial primary key
    ,logical_name character varying
    ,group_id integer
    ,column_name character varying
    ,read boolean
    ,write boolean
    ,options character varying
);

-- *****************
-- Load DbSec data
-- *****************

-- *** features

-- admin
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('features',1,'features',0,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',1,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',1,'feature_id',true,false,'onInsert:{incrementInteger:"features_feature_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',1,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- regular users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('features',10,'features',0,'query:true,insert:true,update:true,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',10,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',10,'feature_id',true,false,'onInsert:{incrementInteger:"features_feature_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- anonymous users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('features',0,'features',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',0,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',0,'feature_id',true,false,'onInsert:{incrementInteger:"features_feature_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',0,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('features',0,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- *** relations

-- admin
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('relations',1,'relations',0,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',1,'id',true,false,'onInsert:{incrementInteger:"relations_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',1,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- regular user
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('relations',10,'relations',0,'query:true,insert:true,update:true,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'id',true,false,'onInsert:{incrementInteger:"relations_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- anonymous users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('relations',10,'relations',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'id',true,false,'onInsert:{incrementInteger:"relations_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('relations',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- *** contributions

-- admin
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('contributions',1,'contributions',0,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',1,'id',true,false,'onInsert:{incrementInteger:"contributions_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',1,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- regular user
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('contributions',10,'contributions',0,'query:true,insert:true,update:true,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'id',true,false,'onInsert:{incrementInteger:"contributions_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- anonymous users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('contributions',10,'contributions',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'id',true,false,'onInsert:{incrementInteger:"contributions_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('contributions',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');

-- *** persons

-- admin
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('persons',1,'persons',0,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',1,'id',true,false,'onInsert:{incrementInteger:"persons_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',1,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- regular user
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('persons',10,'persons',0,'query:true,insert:true,update:true,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',10,'id',true,false,'onInsert:{incrementInteger:"persons_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',10,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');
	
-- anonymous users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('persons',0,'persons',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',0,'id',true,false,'onInsert:{incrementInteger:"persons_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',0,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('persons',0,'dataset_id',true,false,'onInsert:{assignValue:1},where:[{comparison:"EQUAL",value:1}]');

-- *** roles

-- admin
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('roles',1,'roles',0,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',1,'id',true,false,'onInsert:{incrementInteger:"roles_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
	
-- regular user
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('roles',10,'roles',0,'query:true,insert:true,update:true,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',10,'id',true,false,'onInsert:{incrementInteger:"roles_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');
	
-- anonymous users
INSERT INTO dbsec_tables (logical_name,group_id,physical_name,priority,options) 
	VALUES ('roles',0,'roles',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',0,'id',true,false,'onInsert:{incrementInteger:"roles_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) 
	VALUES ('roles',0,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');


#########
# Geoserver

For the atlas to work, an instance of geoserver newer than 2009-04-14 is required. One
layer is required

Set up geoserver:

1. Create a namespace with prefix <prefix> and URI 'http://schemas.gcrc.carleton.ca/<prefix>'

2. Create a POSTGIS datastore with the name <db-name>. Details:
   - namespace: <prefix>
   
3. Create new FeatureType
	- one feature type is created: '<prefix>:::<db-name>'
	- SRS: 4326
	- Extents: -180,-90,180,90
   * See note on multiple geometry types
	
4. Ensure WFS-T is not allowed 
	> Config > Wfs > Contents > Service Level: Basic


* Multiple Geometry Types

  For Geoserver to serve out a layer with multiple geometry types allowed for a single
  property, a number of things should be checked:
  
  1. The table in POSTGIS that serves the geometry should not have a constraint forcing
     a single geometry type.
     sql> ALTER TABLE <table> DROP CONSTRAINT <enforce_geotype_the_geom>;
  
  2. The column should be declared as GEOMETRY (not MULTIPOINT, or other)
     sql> select AddGeometryColumn('<table>','the_geom',4326,'GEOMETRY',2);
     
  3. After above steps are performed, one might have to delete and add again the
     associated feature type for the change to take effect.
     
  Examples:
  sql> INSERT INTO <table> (the_geom) VALUES ( GeometryFromText('MULTIPOINT(-102.436523423237 68.25718070093)',4326) ); 
  sql> INSERT INTO <table> (the_geom) VALUES ( GeometryFromText('MULTILINESTRING((-104.04 68.61,-104.14 68.71)',4326) ); 
  sql> INSERT INTO <table> (the_geom) VALUES ( GeometryFromText('MULTIPOLYGON(((-104.14 68.61,-104.24 68.61,-104.14 68.81,-104.14 68.61)))',4326) ); 
