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
"use strict";

// Localization
var _loc = function(str,args){ return $n2.loc(str,'nunaliit2',args); };

//*******************************************************
var DateInterval = $n2.Class({
	
	dateStr: null,

	min: null,
	
	max: null,
	
	ongoing: null,
	
	initialize: function(opts_){
		var opts = $n2.extend({
			dateStr: null
			,min: null
			,max: null
			,ongoing: false
			,now: null
		},opts_);
		
		this.ongoing = opts.ongoing;
		this.dateStr = opts_.dateStr;
		
		if( typeof opts.min !== 'number' ){
			throw _loc('Interval min must be a number');
		};
		this.min = opts.min;
		
		if( this.ongoing ) {
			this.max = this.min;
			
			if( opts.now ){
				if( this.min > opts.now ){
					throw _loc('Ongoing time interval must begin before now');
				};
			};
			
		} else {
			if( typeof opts.max !== 'number' ){
				throw _loc('Interval max must be a number');
			};
			if( opts.min > opts.max ){
				throw _loc('Interval min can not be greater than max');
			};
			this.max = opts.max;
		};
	},
	
	getMin: function(){
		return this.min;
	},
	
	getMax: function(now){
		if( this.ongoing ){
			return now;
		};
		
		return this.max;
	},
	
	getDateString: function(){
		return this.dateStr;
	},
	
	/**
	 * Returns an object structure that can be saved in a
	 * document.
	 */
	getDocumentStructure: function(){
		var obj = {
			nunaliit_type: 'date'
			,date: this.dateStr
			,min: this.min
		};
		
		if( this.ongoing ){
			obj.ongoing = true;
		} else {
			obj.max = this.max;
		};
		
		return obj;
	},

	size: function(now){
		return (this.getMax(now) - this.min);
	},

	equals: function(interval){
		if( !interval ){
			return false;
		};
		
		// Check that it is an instance of DateInterval
		if( typeof interval.min !== 'number' ){
			return false;
		};
		var isOngoing = false;
		if( typeof interval.ongoing === 'boolean' ){
			isOngoing = interval.ongoing;
		};
		if( !isOngoing ){
			if( typeof interval.max !== 'number' ){
				return false;
			};
		};
		
		if( this.ongoing !== isOngoing ){
			return false;
		};
		
		if( this.ongoing ){
			if( this.min === interval.min ){
				return true;
			};
		} else {
			if( this.min === interval.min 
			 && this.max === interval.max ){
				return true;
			};
		};

		return false;
	},

	isIncludedIn: function(interval, now){
		if( !interval ){
			return false;
		};
		
		if( this.getMin() >= interval.getMin() 
		 && this.getMax(now) <= interval.getMax(now) ){
			return true;
		};

		return false;
	},

	extendTo: function(interval){
		if( !interval ){
			return this;
		};
		
		if( this.ongoing !== interval.ongoing ){
			throw 'Can not extend ongoing and regular date intervals';
		};
		
		if( this.ongoing ){
			if( this.min > interval.min ){
				return new DateInterval({
					ongoing: true
					,min: interval.min
				});
				
			} else {
				return this;
			};
			
		} else {
			var extended = false;
			var min = this.min;
			var max = this.max;
			
			if( min > interval.min ){
				min = interval.min;
				extended = true;
			};
			
			if( max < interval.max ){
				max = interval.max;
				extended = true;
			};

			if( extended ){
				return new DateInterval({
					ongoing: false
					,min: min
					,max: max
				});
			} else {
				return this;
			};
		};
	},

	intersectsWith: function(interval, now){
		if( !interval ){
			return false;
		};
		
		if( this.getMin() > interval.getMax(now) ){
			return false;
		};
		if( this.getMax(now) < interval.getMin() ){
			return false;
		};
		
		return true;
	},

	intersection: function(interval, now){
		if( !this.intersectsWith(interval, now) ){
			return null;
		};
		
		if( this.ongoing 
		 && interval.ongoing ){
			if( this.min >= interval.min ){
				return this;
			} else {
				return new DateInterval({
					ongoing: true
					,min: interval.min
				});
			};
			
		} else {
			var min = this.getMin();
			var max = this.getMax(now);

			if( min < interval.getMin() ){
				min = interval.getMin();
			};

			if( max > interval.getMax(now) ){
				max = interval.getMax(now);
			};
			
			return new DateInterval({
				ongoing: false
				,min: min
				,max: max
			});
		};
	},
	
	save: function(){
		var obj = null;
		
		if( this.ongoing ){
			obj = {ongoing:true,min:this.min};
		} else {
			obj = {min:this.min,max:this.max};
		};
		
		if( this.dateStr ){
			obj.dateStr = this.dateStr;
		};
		
		return obj;
	}
});

//*******************************************************
var reYear = /^\s*(\d\d\d\d)\s*$/;
var reYearMonth = /^\s*(\d\d\d\d)-(\d\d)\s*$/;
var reYearMonthDay = /^\s*(\d\d\d\d)(\d\d)(\d\d)\s*$/;
var reYearMonthDay2 = /^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/;
var reYearMonthDayHM = /^\s*(\d\d\d\d)(\d\d)(\d\d)( +|T)(\d\d):(\d\d)\s*$/;
var reYearMonthDayHM2 = /^\s*(\d\d\d\d)-(\d\d)-(\d\d)( +|T)(\d\d):(\d\d)\s*$/;
var reYearMonthDayHMS = /^\s*(\d\d\d\d)(\d\d)(\d\d)( +|T)(\d\d):(\d\d):(\d\d)\s*$/;
var reYearMonthDayHMS2 = /^\s*(\d\d\d\d)-(\d\d)-(\d\d)( +|T)(\d\d):(\d\d):(\d\d)\s*$/;
var rePeriod = /^([^\/]*)\/([^\/]*)$/;

	
function parseUserDate(dateStr){
	var matchPeriod = rePeriod.exec(dateStr);
	var matchYear = reYear.exec(dateStr);
	var matchYearMonth = reYearMonth.exec(dateStr);
	var matchYearMonthDay = reYearMonthDay.exec(dateStr);
	var matchYearMonthDay2 = reYearMonthDay2.exec(dateStr);
	var matchYearMonthDayHM = reYearMonthDayHM.exec(dateStr);
	var matchYearMonthDayHM2 = reYearMonthDayHM2.exec(dateStr);
	var matchYearMonthDayHMS = reYearMonthDayHMS.exec(dateStr);
	var matchYearMonthDayHMS2 = reYearMonthDayHMS2.exec(dateStr);
	
	// Period, special case
	if( matchPeriod ){
		var startDateStr = matchPeriod[1];
		var endDateStr = matchPeriod[2];
		
		var startDate = null;
		var endDate = null;
		try {
			startDate = parseUserDate(startDateStr);
			
			if( "-" === $n2.trim(endDateStr) ){
				// on going date
			} else {
				endDate = parseUserDate(endDateStr);
			};
		} catch(e) {
			// Ignore. Leave startDate or endDate null
		};
		
		if( startDate ){
			if( endDate ){
				var exDate = startDate.extendTo(endDate);
				exDate.dateStr = dateStr;
				return exDate;
			} else {
				// on going
				var now = Date.now();
				return new DateInterval({
					ongoing: true
					,dateStr: dateStr
					,min: startDate.min
					,now: now
				});
			};
		};
	};
	
	if( matchYear ){
		var year = 1 * matchYear[1];
		var min = (new Date(year,0,1)).getTime();
		var max = (new Date(year+1,0,1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYear[0]
		});
		
	} else if( matchYearMonth ){
		var year = 1 * matchYearMonth[1];
		var month = 1 * matchYearMonth[2];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};

		var min = (new Date(year,month-1,1)).getTime();
		var max = (new Date(year,month,1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonth[0]
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
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDay[0]
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
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDay2[0]
		});

	} else if( matchYearMonthDayHM ){
		var year = 1 * matchYearMonthDayHM[1];
		var month = 1 * matchYearMonthDayHM[2];
		var day = 1 * matchYearMonthDayHM[3];
		var hour = 1 * matchYearMonthDayHM[5];
		var minutes = 1 * matchYearMonthDayHM[6];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};
		if( hour < 0 || hour > 23 ){
			throw _loc('Hour must be an integer between 0 and 23');
		};
		if( minutes < 0 || minutes > 59 ){
			throw _loc('Minutes must be an integer between 0 and 59');
		};

		var min = (new Date(year,month-1,day,hour,minutes)).getTime();
		var max = (new Date(year,month-1,day,hour,minutes+1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDayHM[0]
		});

	} else if( matchYearMonthDayHM2 ){
		var year = 1 * matchYearMonthDayHM2[1];
		var month = 1 * matchYearMonthDayHM2[2];
		var day = 1 * matchYearMonthDayHM2[3];
		var hour = 1 * matchYearMonthDayHM2[5];
		var minutes = 1 * matchYearMonthDayHM2[6];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};
		if( hour < 0 || hour > 23 ){
			throw _loc('Hour must be an integer between 0 and 23');
		};
		if( minutes < 0 || minutes > 59 ){
			throw _loc('Minutes must be an integer between 0 and 59');
		};

		var min = (new Date(year,month-1,day,hour,minutes)).getTime();
		var max = (new Date(year,month-1,day,hour,minutes+1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDayHM2[0]
		});

	} else if( matchYearMonthDayHMS ){
		var year = 1 * matchYearMonthDayHMS[1];
		var month = 1 * matchYearMonthDayHMS[2];
		var day = 1 * matchYearMonthDayHMS[3];
		var hour = 1 * matchYearMonthDayHMS[5];
		var minutes = 1 * matchYearMonthDayHMS[6];
		var secs = 1 * matchYearMonthDayHMS[7];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};
		if( hour < 0 || hour > 23 ){
			throw _loc('Hour must be an integer between 0 and 23');
		};
		if( minutes < 0 || minutes > 59 ){
			throw _loc('Minutes must be an integer between 0 and 59');
		};
		if( secs < 0 || secs > 59 ){
			throw _loc('Seconds must be an integer between 0 and 59');
		};

		var min = (new Date(year,month-1,day,hour,minutes,secs)).getTime();
		var max = (new Date(year,month-1,day,hour,minutes,secs+1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDayHMS[0]
		});

	} else if( matchYearMonthDayHMS2 ){
		var year = 1 * matchYearMonthDayHMS2[1];
		var month = 1 * matchYearMonthDayHMS2[2];
		var day = 1 * matchYearMonthDayHMS2[3];
		var hour = 1 * matchYearMonthDayHMS2[5];
		var minutes = 1 * matchYearMonthDayHMS2[6];
		var secs = 1 * matchYearMonthDayHMS2[7];
		
		if( month < 1 || month > 12 ){
			throw _loc('Month must be an integer between 1 and 12');
		};
		if( day < 1 || day > 31 ){
			throw _loc('Day must be an integer between 1 and 31');
		};
		if( hour < 0 || hour > 23 ){
			throw _loc('Hour must be an integer between 0 and 23');
		};
		if( minutes < 0 || minutes > 59 ){
			throw _loc('Minutes must be an integer between 0 and 59');
		};
		if( secs < 0 || secs > 59 ){
			throw _loc('Seconds must be an integer between 0 and 59');
		};

		var min = (new Date(year,month-1,day,hour,minutes,secs)).getTime();
		var max = (new Date(year,month-1,day,hour,minutes,secs+1)).getTime();
		
		return new DateInterval({
			min: min
			,max: max-1000
			,dateStr: matchYearMonthDayHMS2[0]
		});

	} else {
		throw _loc('Can not parse date');
	};
};

//*******************************************************
var rFindYear = /(\d\d\d\d)/;
var rFindMonthDay = /^-(\d\d)-(\d\d)/;
var rFindMonthDay2 = /^(\d\d)(\d\d)/;
var rFindMonth = /^-?(\d\d)/;
var rFindHMS = /^( +|T)(\d\d):(\d\d)(:(\d\d))?/;
var rFindHMS2 = /^( +|T)(\d\d)(\d\d)(\d\d)?/;
var rDurationSeparator = /^\s*\/\s*/;

function findDateString(str,index){
	var result = null;
	
	var index = index ? index : 0;
	var next = (index>0) ? str.substr(index) : str;
	
	var mFindYear = rFindYear.exec(next);
	if( mFindYear ){
		result = {
			input: str
			,index: mFindYear.index + index
			,year: 1 * mFindYear[1]
		};
		
		index = index + mFindYear.index + mFindYear[1].length;
		var next = str.substr(index);
		
		var parseTime = false;
		var mFindMonthDay = rFindMonthDay.exec(next);
		if( mFindMonthDay ) {
			result.month = 1 * mFindMonthDay[1];
			result.day = 1 * mFindMonthDay[2];
			
			if( result.month < 1 
			 || result.month > 12 
			 || result.day < 1 
			 || result.day > 31 ){
				// Error. Continue searching
				return findDateString(str,index);
			};
			
			index += mFindMonthDay[0].length;

			parseTime = true;
			next = str.substr(index);
			
		} else {
			var mFindMonthDay2 = rFindMonthDay2.exec(next);
			if( mFindMonthDay2 ) {
				result.month = 1 * mFindMonthDay2[1];
				result.day = 1 * mFindMonthDay2[2];

				if( result.month < 1 
				 || result.month > 12 
				 || result.day < 1 
				 || result.day > 31 ){
					// Error. Continue searching
					return findDateString(str,index);
				};

				index += mFindMonthDay2[0].length;

				parseTime = true;
				next = str.substr(index);
				
			} else {
				var mFindMonth = rFindMonth.exec(next);
				if( mFindMonth ){
					result.month = 1 * mFindMonth[1];

					if( result.month < 1 
					 || result.month > 12 ){
						// Error. Continue searching
						return findDateString(str,index);
					};

					index += mFindMonth[0].length;
				};
			};
		};
		
		if( parseTime ){
			var mFindHMS = rFindHMS.exec(next);
			var mFindHMS2 = rFindHMS2.exec(next);
			
			if(mFindHMS) {
				result.hours = 1 * mFindHMS[2];
				result.minutes = 1 * mFindHMS[3];
				if( typeof mFindHMS[5] !== 'undefined' ){
					result.seconds = 1 * mFindHMS[5];
				};

				if( result.hours > 23 
				 || result.minutes > 59 ){
					// Error. Continue searching
					return findDateString(str,index);
				};
				if( typeof result.seconds !== 'undefined' ){
					if( result.seconds > 59 ){
						// Error. Continue searching
						return findDateString(str,index);
					};
				};

				index += mFindHMS[0].length;
				
			} else if(mFindHMS2) {
				result.hours = 1 * mFindHMS2[2];
				result.minutes = 1 * mFindHMS2[3];
				if( typeof mFindHMS2[4] !== 'undefined' ){
					result.seconds = 1 * mFindHMS2[4];
				};

				if( result.hours > 23 
				 || result.minutes > 59 ){
					// Error. Continue searching
					return findDateString(str,index);
				};
				if( typeof result.seconds !== 'undefined' ){
					if( result.seconds > 59 ){
						// Error. Continue searching
						return findDateString(str,index);
					};
				};

				index += mFindHMS2[0].length;
			};
		};

		// Compute date string
		var l = index - result.index;
		result.str = str.substr(result.index, l);
		
		if( typeof result.seconds !== 'undefined' ){
			var min = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours,
					result.minutes,
					result.seconds)).getTime();
			var max = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours,
					result.minutes,
					result.seconds+1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});

		} else if( typeof result.minutes !== 'undefined' ){
			var min = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours,
					result.minutes)).getTime();
			var max = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours,
					result.minutes+1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});

		} else if( typeof result.hours !== 'undefined' ){
			var min = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours)).getTime();
			var max = (new Date(
					result.year,
					result.month-1,
					result.day,
					result.hours+1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});

		} else if( typeof result.day !== 'undefined' ){
			var min = (new Date(
					result.year,
					result.month-1,
					result.day)).getTime();
			var max = (new Date(
					result.year,
					result.month-1,
					result.day+1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});

		} else if( typeof result.month !== 'undefined' ){
			var min = (new Date(
					result.year,
					result.month-1,
					1)).getTime();
			var max = (new Date(
					result.year,
					result.month,
					1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});

		} else {
			var min = (new Date(
					result.year,
					0,
					1)).getTime();
			var max = (new Date(
					result.year+1,
					0,
					1)).getTime();
			
			result.interval = new DateInterval({
				min: min
				,max: max-1000
				,dateStr: result.str
			});
		};
		
		// At this point, we have one date. See if this is a duration, with
		// another date after an appropriate separator. There two variants:
		// - date / date  This is a regular date interval
		// - date / -     This is an ongoing date interval
		next = str.substr(index);
		var mDurationSeparator = rDurationSeparator.exec(next);
		if( mDurationSeparator ){
			index += mDurationSeparator[0].length;
			
			if( '-' === str[index] ){
				// On-Going
				++index;
				
				var l = index - result.index;
				result.str = str.substr(result.index, l);
				
				result.interval = new DateInterval({
					ongoing: true
					,min: result.interval.min
					,dateStr: result.str
				});

				if( typeof result.year !== 'undefined' ) delete result.year;
				if( typeof result.month !== 'undefined' ) delete result.month;
				if( typeof result.day !== 'undefined' ) delete result.day;
				if( typeof result.hours !== 'undefined' ) delete result.hours;
				if( typeof result.minutes !== 'undefined' ) delete result.minutes;
				if( typeof result.seconds !== 'undefined' ) delete result.seconds;
				
			} else {
				var another = findDateString(str,index);
				if( another && another.index == index ){
					// This is a regular duration
					result.str = str.substr(result.index,another.index+another.str.length-result.index);
					result.interval = result.interval.extendTo(another.interval);
					result.interval.dateStr = result.str;
					
					if( typeof result.year !== 'undefined' ) delete result.year;
					if( typeof result.month !== 'undefined' ) delete result.month;
					if( typeof result.day !== 'undefined' ) delete result.day;
					if( typeof result.hours !== 'undefined' ) delete result.hours;
					if( typeof result.minutes !== 'undefined' ) delete result.minutes;
					if( typeof result.seconds !== 'undefined' ) delete result.seconds;
				};
			};
		};
	};
	
	return result;
};

//*******************************************************
function findAllDateStrings(str){
	var results = [];
	
	var d = findDateString(str);
	while(d){
		results.push(d);
		
		var index = d.index + d.str.length;
		d = findDateString(str,index);
	};
	
	return results;
};

//*******************************************************
function parseDateStructure(obj){
	if( !obj || typeof obj.date !== 'string' ){
		throw _loc('Invalid date structure');
	};
	
	var dateInt = parseUserDate(obj.date);
	
	return dateInt;
};

//*******************************************************
$n2.date = {
	DateInterval: DateInterval
	,parseUserDate: parseUserDate
	,parseDateStructure: parseDateStructure
	,findDateString: findDateString
	,findAllDateStrings: findAllDateStrings
};

})(nunaliit2);
