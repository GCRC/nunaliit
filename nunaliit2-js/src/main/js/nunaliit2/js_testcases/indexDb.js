"use strict";

var $n2 = nunaliit2;

var _loc = function(str,args){ return $n2.loc(str,'nunaliit_demo',args); };

function main_init() {
	var documentDatabase = undefined;
	
	$n2.indexdb.openIndexDb({
		onSuccess: function(n2IndexDb){
			documentDatabase = n2IndexDb.getDocumentDatabase({
				dbName: 'test'
			});
			dbOpened();
		}
	});
	
	function dbOpened(){
		documentDatabase.updateDocument({
			doc: {
				_id: 'abc'
				,_rev: '1-abc'
				,data: {
					a: 'test'
				}
			}
			,onSuccess: docAdded
		});
	};
	
	function docAdded(){
		documentDatabase.getDocument({
			docId: 'abc'
			,onSuccess: function(doc){
				$n2.log('getDocument(abc)',doc);
				docRetrieved();
			}
		});
	};
	
	function docRetrieved(){
		documentDatabase.getDocument({
			docId: 'invalid'
			,onSuccess: function(doc){
				$n2.log('getDocument(invalid)',doc);
				testDelete1();
			}
		});
	};
	
	function testDelete1(){
		documentDatabase.deleteDocument({
			docId: 'abc'
			,onSuccess: function(){
				$n2.log('deleteDocument(abc) success');
				testDelete2();
			}
			,onError: function(err){
				$n2.log('deleteDocument(abc) error',err);
			}
		});
	};
	
	function testDelete2(){
		documentDatabase.deleteDocument({
			docId: 'abc'
			,onSuccess: function(){
				$n2.log('deleteDocument(abc) success');
				loadMultipleDocs();
			}
			,onError: function(err){
				$n2.log('deleteDocument(abc) error',err);
			}
		});
	};
	
	function loadMultipleDocs(){
		var docs = [
	        {_id:"a",_rev:"1-a",value:"a"}
	        ,{_id:"b",_rev:"1-b",value:"b"}
	        ,{_id:"c",_rev:"1-c",value:"c"}
	        ,{_id:"d",_rev:"1-d",value:"d"}
	        ,{_id:"e",_rev:"1-e",value:"e"}
		];
		
		load();
		
		function load(){
			if( docs.length > 0 ){
				var doc = docs.pop();
				documentDatabase.updateDocument({
					doc: doc
					,onSuccess: load
				});
				
			} else {
				retrieve();
			};
		};
		
		function retrieve(){
			documentDatabase.getDocuments({
				docIds: ['a','c','e']
				,onSuccess: function(docs){
					$n2.log('getDocuments(a,c,e)',docs);
				}
			});
		};
	};
};

jQuery().ready(function() {
	main_init();
});
