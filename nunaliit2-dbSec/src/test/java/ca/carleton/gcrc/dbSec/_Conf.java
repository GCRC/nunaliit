/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id$
*/
package ca.carleton.gcrc.dbSec;

import java.sql.Connection;
import java.sql.Statement;
import java.util.Properties;

import ca.carleton.gcrc.jdbc.JdbcConnections;

/*

> createdb test
> psql test

CREATE TABLE dbsec_tables (
    id serial primary key
    ,logical_name character varying
    ,physical_name character varying
    ,group_id integer
    ,priority integer default 0
    ,options character varying
);


CREATE TABLE dbsec_columns (
    id serial primary key
    ,logical_name character varying
    ,group_id integer
    ,column_name character varying
    ,read boolean
    ,write boolean
    ,options character varying
);


CREATE TABLE features (
    id serial primary key
    ,feature_id integer NOT NULL
    ,feature_type_id integer
    ,creator_id integer
    ,dataset_id integer
    ,name character varying
    ,value character varying
);

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES ('f1','features',1,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',1,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',1,'feature_type_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES ('f1','features',10,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',10,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',10,'feature_type_id',true,false,'onInsert:{assignValue:10}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES ('f1','features',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',0,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('f1',0,'feature_type_id',true,false,'onInsert:{assignValue:0}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES ('creator1','features',0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('creator1',0,'creator_id',true,false,'where:[{comparison:"EQUAL",value:1}]');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES ('userId','features',1,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('userId',1,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('userId',1,'feature_type_id',true,false,'onInsert:{assignValue:1}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('userId',1,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES (
	'record1','features',1
	,'query:true,insert:true,update:[{column:"creator_id",comparison:"EQUAL",value:1}],delete:[{column:"creator_id",comparison:"EQUAL",value:1}]'
	);
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('record1',1,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('record1',1,'feature_type_id',true,false,'onInsert:{assignValue:1}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('record1',1,'creator_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES (
	'viewCreator1','features',1
	,'query:[{column:"creator_id",comparison:"EQUAL",value:1}],insert:false,update:false,delete:false'
	);

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,options) VALUES (
	'owner1','features',10
	,'query:true,insert:true,update:[{column:"creator_id",comparison:"EQUAL",variable:"user.id"}],delete:[{column:"creator_id",comparison:"EQUAL",variable:"user.id"}]'
	);
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('owner1',10,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('owner1',10,'feature_type_id',true,false,'onInsert:{assignValue:1}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('owner1',10,'creator_id',true,false,'onInsert:{assignVariable:"user.id"}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,priority,options) VALUES ('multi','features',10,0,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',10,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',10,'feature_type_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,priority,options) VALUES ('multi','features',11,1,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',11,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',11,'feature_type_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,priority,options) VALUES ('multi','features',12,3,'query:true,insert:true,update:true,delete:true');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',12,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',12,'feature_type_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,priority,options) VALUES ('multi','features',13,2,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',13,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',13,'feature_type_id',true,false,'onInsert:{assignValue:1}');

INSERT INTO dbsec_tables (logical_name,physical_name,group_id,priority,options) VALUES ('multi','features',14,2,'query:true,insert:false,update:false,delete:false');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',14,'id',true,false,'onInsert:{incrementInteger:"features_id_seq"}');
INSERT INTO dbsec_columns (logical_name,group_id,column_name,read,write,options) VALUES ('multi',14,'feature_type_id',true,false,'onInsert:{assignValue:1}');

JSON Specs
----------
where: [
	{
		comparison: 'EQUAL'
		,value: 5
	}
]
=> where:[{comparison:'EQUAL',value:5}]

onInsert: {
	incrementInteger: 'features_id_seq'
}
=> onInsert:{incrementInteger:'features_id_seq'}

onInsert: {
	assignValue: 1
}
=>onInsert:{assignValue: 1}

onInsert: {
	assignVariable: 'user.id'
}
=>onInsert:{assignVariable:'user.id'}

 */
public class _Conf {

	static private boolean performTests = false;
	
	static private Connection testConnection = null;
	static private Connection s_getTestConnection() throws Exception {
		if( null == testConnection ) {
			Properties props = new Properties();
			props.setProperty("default", "org.postgresql.Driver|jdbc:postgresql:test|postgres|postgres");

			JdbcConnections jdbc = new JdbcConnections(props);
			testConnection = jdbc.getDb();
			
			Statement stmt = testConnection.createStatement();
			stmt.execute("DELETE FROM features;");
		}
		
		return testConnection;
	}
	
	static final public int ANONYMOUS_USERID = 100;
	static final public int ADMIN_USERID = 101;
	static final public int USER1_USERID = 102;
	static final public int USER2_USERID = 103;
	static final public int USER3_USERID = 104;
	
	static public _Conf getConfiguration() {
		return new _Conf();
	}
	
	public boolean isPerformingTests() {
		return performTests;
	}

	public Connection getTestConnection() throws Exception {
		return s_getTestConnection();
	}
	
	public DbUser getAdminUser() {
		return new _DbUser(ADMIN_USERID,1);
	}

	public DbUser getRegularUser1() {
		return new _DbUser(USER1_USERID,10);
	}

	public DbUser getRegularUser2() {
		return new _DbUser(USER2_USERID,10);
	}

	public DbUser getRegularUserMultiGroup() {
		_DbUser user =  new _DbUser(USER3_USERID,10);
		user.addGroup(11);
		user.addGroup(12);
		user.addGroup(13);
		user.addGroup(14);
		return user;
	}

	public DbUser getAnonymousUser() {
		return new _DbUser(ANONYMOUS_USERID,0);
	}
}
