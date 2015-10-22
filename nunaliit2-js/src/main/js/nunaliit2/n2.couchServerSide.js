/*
Copyright (c) 2011, Geomatics and Cartographic Research Centre, Carleton 
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

$Id: n2.couchServerSide.js 8443 2012-08-16 18:04:28Z jpfiset $
*/
;(function($n2){
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2-couch',args); }
,DH = 'n2.couchServerSide'
;

var Notifier = $n2.Class({

	dispatchService: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dbChangeNotifier: null
			,dispatchService: null
		},opts_);
		
		var _this = this;
		if( opts.dbChangeNotifier ) {
			opts.dbChangeNotifier.addListener(function(changes){
				_this._dbChanges(changes);
			});
		};
	},

	_dbChanges: function(changes){
		$n2.log('update',changes);
		var lastSeq = changes.last_seq;
		var results = changes.results;
		
		if( this.dispatchService ){
			for(var i=0,e=results.length; i<e; ++i){
				var updateRecord = results[i];
	
				var isAdded = false;
				var latestRev = null;
	
				if(updateRecord.changes) {
					for(var l=0,k=updateRecord.changes.length; l<k; ++l){
						latestRev = updateRecord.changes[l].rev;
						if( latestRev.substr(0,2) === '1-' ) {
							isAdded = true;
						};
					};
				};
				
				if( latestRev ){
					// Send 'documentVersion' before create/update so
					// that caches can invalidate before document is
					// requested
					this.dispatchService.send(DH,{
						type: 'documentVersion'
						,docId: updateRecord.id
						,rev: latestRev
					});
				};
				
				if( updateRecord.deleted ){
					this.dispatchService.send(DH,{
						type: 'documentDeleted'
						,docId: updateRecord.id
					});
					
				} else if( isAdded ){
					this.dispatchService.send(DH,{
						type: 'documentCreated'
						,docId: updateRecord.id
					});
					
				} else {
					// Updated
					this.dispatchService.send(DH,{
						type: 'documentUpdated'
						,docId: updateRecord.id
					});
				};
			};
		};
	}
});


// ================ API ===============================

$n2.couchServerSide = {
	Notifier: Notifier
	,DefaultNotifier: null
};

})(nunaliit2);