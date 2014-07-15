/*
Copyright (c) 2014, Geomatics and Cartographic Research Centre, Carleton 
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
*/
;(function($n2){

// Localization
//var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

var reYear = /^\s*(\d\d\d\d)\s*$/;
var reYearMonth = /^\s*(\d\d\d\d)-(\d\d)\s*$/;
var reYearMonthDay = /^\s*(\d\d\d\d)(\d\d)(\d\d)\s*$/;
var reYearMonthDay2 = /^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/;
	
function parseUserDate(dateStr){
	var matchYear = reYear.exec(dateStr);
	var matchYearMonth = reYearMonth.exec(dateStr);
	var matchYearMonthDay = reYearMonthDay.exec(dateStr);
	var matchYearMonthDay2 = reYearMonthDay2.exec(dateStr);
	
	if( matchYear ){
		var year = 1 * matchYear[1];
		var min = (new Date(year,0,1)).getTime();
		var max = (new Date(year+1,0,1)).getTime();
		
		return new $n2.range.Range({
			min: min
			,max: max-1000
		});
		
	} else if( matchYearMonth ){
		var year = 1 * matchYearMonth[1];
		var month = 1 * matchYearMonth[2];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};

		var min = (new Date(year,month-1,1)).getTime();
		var max = (new Date(year,month,1)).getTime();
		
		return new $n2.range.Range({
			min: min
			,max: max-1000
		});
		
	} else if( matchYearMonthDay ){
		var year = 1 * matchYearMonthDay[1];
		var month = 1 * matchYearMonthDay[2];
		var day = 1 * matchYearMonthDay[3];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};

		var min = (new Date(year,month-1,day)).getTime();
		var max = (new Date(year,month-1,day+1)).getTime();
		
		return new $n2.range.Range({
			min: min
			,max: max-1000
		});
		
	} else if( matchYearMonthDay2 ){
		var year = 1 * matchYearMonthDay2[1];
		var month = 1 * matchYearMonthDay2[2];
		var day = 1 * matchYearMonthDay2[3];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};

		var min = (new Date(year,month-1,day)).getTime();
		var max = (new Date(year,month-1,day+1)).getTime();
		
		return new $n2.range.Range({
			min: min
			,max: max-1000
		});
	} else {
		throw _loc('Can not parse date');
	};
};

//*******************************************************
$n2.date = {
	parseUserDate: parseUserDate
};

})(nunaliit2);
