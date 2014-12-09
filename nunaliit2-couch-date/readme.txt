This module implements a servlet that deals with issues relating to dates, on the server
side of Nunaliit.

Servlet
-------

The date servlet is used mainly to obtain document identifiers that match a date interval,
expressed as two numbers: min and max.

* Connection

url: .../date
response: {"service":"date","ok":true}

* Get Doc Ids From Interval

url: .../date/docIdsFromInterval?min=0&max=400000000000
response: {"intervalMatched":1,"intervalCount":1,"clusterCount":1,"docIds":["aca774a0626534ff2ff563c79a01827d"]}

* Get Info

url: .../date/getInfo
response:
Node count: 1
Legacy node count: 0
Max node depth: 1
Full interval: [0,1500000000000]
Min interval size: 1500000000000

* Get Graphical Info

url: .../date/getDot
response:


CouchDb
-------

There is a view installed on CouchDb, on the _design/atlas document, named date-index.
This view is an index of all dates found in all documents. This view is keyed on the
index found in the date element.

Date Structure
--------------

{
	nunaliit_type: 'date'
	,date: '2006'
	,min: 11000000
	,max: 22000000
	,index: 5
}

