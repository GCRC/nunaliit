DBSEC
-----

This is a project that provides a perspective on a database where
user access control is enforced using rules in the database. This
security is not based on the underlying database security functions,
therefore it is portable between databases.

DBSEC is a light weight access control to data found in a database.


Schema
------

Here is a schema for PostgreSQL


CREATE TABLE dbsec_tables (
    id serial primary key
    ,logical_name character varying
    ,group_id integer
    ,physical_name character varying
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


Table Options
-------------

Example:
	query:true,insert:true,update:true,delete:true
	
Syntax:
	query:<access>,insert:<access>,update:<access>,delete:<access>

where <access>
   is true          For unconditional access
      false         For unconditional deny
      [<where>,...] For access based on column comparison


Column Options
--------------

Example:
	where:[{comparison:'EQUAL',value:1}],onInsert:{assignValue:1}
	
Syntax:
	[where:[<where>,...]][,onInsert:<on-insert>]


Column Comparison
-----------------

<where> is:
{
	column: <column-name>
	,comparison: <comparison-name>
	,value: <value>
	,variable: <variable-name>
}

<column-name> is a string and is optional in a column option. It is compulsory in
                 a table option.
                 
<comparison-name> is one of the following strings: 'EQUAL', 'NOT_EQUAL', 'GREATER_THAN',
                     'LESS_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL',
                     'IS_NULL', 'IS_NOT_NULL'
                     
<value> is a string or an integer that is the constant in the comparison. It is compulsory 
           for comparisons that requires an expression. Is exclusive to 'variable'.
           
<variable> is a string which is the name of the variable that contains the value for the
              expression in a comparison. It is compulsory for comparisons that requires an
              expression. Is exclusive to 'value'.           
              
              
OnInsert Column Option
----------------------

<on-insert> is:
{
	assignValue: <constant>
	,assignVariable: <variable>
	,incrementInteger: <sequence-name>
}

<constant> is a string or an integer that is the constant in the assignment. If a row is
              inserted, this constant value will be assigned to the column of the new
              row.  This can not be used in conjunction with 'assignVariable' or
              'incrementInteger'.
           
<variable> is a string which is the name of the variable that contains the value for the
              assignment. This can not be used in conjunction with 'assignValue' or
              'incrementInteger'.          
           
<sequence-name> is a string which is the name of database sequence. When a row is inserted,
                   the sequence is incremented and the new value is assigned to the column
                   of the new row. This option works only with columns that are defined
                   integer.  This can not be used in conjunction with 'assignValue' or
                   'assignVariable'.
              assignment. This can not be used in conjunction with 'assignValue'.           
              
              