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

	extendTo: function(interval, now){
		if( !interval ){
			return this;
		};
		
		if( now ){
			// Ok to extend mixed
		} else if( this.ongoing !== interval.ongoing ){
			throw 'Can not extend ongoing and regular date intervals';
		};
		
		if( this.ongoing && interval.ongoing ){
			// Extending two on-going intervals
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
			var myMin = this.min;
			var otherMin = interval.min;
			var myMax = this.getMax(now);
			var otherMax = interval.getMax(now);
			
			if( myMin > otherMin ){
				myMin = otherMin;
				extended = true;
			};
			
			var updatedOngoing = false;
			if( myMax < otherMax ){
				myMax = otherMax;
				extended = true;
				
				if( interval.ongoing ){
					updatedOngoing = true;
				};
			} else if( this.ongoing ){
				updatedOngoing = true;
			};

			if( extended ){
				if( updatedOngoing ){
					return new DateInterval({
						ongoing: true
						,min: myMin
					});
				} else {
					return new DateInterval({
						ongoing: false
						,min: myMin
						,max: myMax
					});
				};
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
var rFindYear = /(^|[^a-zA-Z0-9])(\d\d\d\d)/;
var rFindMonthDay = /^-(\d\d)-(\d\d)/;
var rFindMonthDay2 = /^(\d\d)(\d\d)/;
var rFindMonth = /^-?(\d\d)/;
var rFindHMS = /^( +|T)(\d\d):(\d\d)(:(\d\d))?/;
var rFindHMS2 = /^( +|T)(\d\d)(\d\d)(\d\d)?/;
var rFindEod = /^([^a-zA-Z0-9]|$)/;
/*
year            9999
year month      999999
                9999-99
year month date 99999999
                9999-99-99
hour minute       99:99
                  9999
                T99:99
                T9999
hour min sec     99:99:99
                 999999
                T99:99:99
                T999999
 */

/**
 * Finds a date string in the form of YYYY-MM-DD hh:mm:ss
 * and returns an object specifying the found string. Returns
 * null if nothing is found.
 * 
 * If a date string is found, the following structure is returned:
 * {
 *    input: <string> original string given to routine
 *    ,index: <number> index into string where found date string begins
 *    ,str: <string> date string found in original string
 *    ,interval: <object> instance of DateInterval that is interpreted from the found date string
 *    ,year: <number> year specified in found date string
 *    ,month: <number> month specified in found date string
 *    ,day: <number> day of month specified in found date string
 *    ,hours: <number> hours specified in found date string
 *    ,minutes: <number> minutes specified in found date string
 *    ,seconds: <number> seconds specified in found date string
 * }
 */
function findSingleDateString(str,index){
	var result = undefined;
	
	index = index ? index : 0;
	var next = (index>0) ? str.substr(index) : str;
	
	var mFindYear = rFindYear.exec(next);
	if( mFindYear ){
		var parseTime = false;

		result = {
			input: str
			,index: mFindYear.index + index + mFindYear[1].length
			,year: 1 * mFindYear[2]
		};
		
		index = index + mFindYear.index + mFindYear[1].length + mFindYear[2].length;
		var next = str.substr(index);
		
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
			next = str.substr(index);

			parseTime = true;
			
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
				next = str.substr(index);

				parseTime = true;
				
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
					next = str.substr(index);
				};
			};
		};
		
		if( parseTime ){
			var timeStruct = startsWithTimeStringAt(next);
			if( timeStruct ){
				// Followed by time string
				result.hours = timeStruct.hours;
				result.minutes = timeStruct.minutes;
				result.seconds = timeStruct.seconds;
				index += timeStruct.index + timeStruct.str.length;
				next = str.substr(index);
			};
		};

		// At this point, we should have either reached the end of the string
		// or encountered a white space
		var mFindEod = rFindEod.exec(next);
		if( !mFindEod ){
			// Error. Continue searching
			return findDateString(str,index);
		};
		
		// Compute date string
		var l = index - result.index;
		result.str = str.substr(result.index, l);
		next = str.substr(index);
		
		// OK, reached end of string
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
	};
	
	return result;
};

/**
 * Finds a time string in the form of T?hh:mm:ss
 * and returns an object specifying the found string. Returns
 * null if nothing is found.
 * 
 * If a time string is found, the following structure is returned:
 * {
 *    input: <string> original string given to routine
 *    ,index: <number> index into string where found date string begins
 *    ,str: <string> date string found in original string
 *    ,hours: <number> hours specified in found time string
 *    ,minutes: <number> minutes specified in found time string
 *    ,seconds: <number> seconds specified in found time string
 * }
 */
function startsWithTimeStringAt(str,index){
	var result = undefined;
	
	index = index ? index : 0;
	var next = (index>0) ? str.substr(index) : str;
	
		
	var mFindHMS = rFindHMS.exec(next);
	var mFindHMS2 = rFindHMS2.exec(next);
	
	if(mFindHMS) {
		result = {
			index: index
			,hours: 1 * mFindHMS[2]
			,minutes: 1 * mFindHMS[3]
		};
		if( typeof mFindHMS[5] !== 'undefined' ){
			result.seconds = 1 * mFindHMS[5];
		};

		if( result.hours > 23 
		 || result.minutes > 59 
		 || (typeof result.seconds !== 'undefined' && result.seconds > 59) ){
			return undefined;
		};

		index += mFindHMS[0].length;
		
	} else if(mFindHMS2) {
		result = {
				index: index
				,hours: 1 * mFindHMS2[2]
				,minutes: 1 * mFindHMS2[3]
			};
		if( typeof mFindHMS2[4] !== 'undefined' ){
			result.seconds = 1 * mFindHMS2[4];
		};

		if( result.hours > 23 
		 || result.minutes > 59 
		 || (typeof result.seconds !== 'undefined' && result.seconds > 59) ){
			return undefined;
		};

		index += mFindHMS2[0].length;
	} else {
		return result;
	};

	// Compute date string
	var l = index - result.index;
	result.str = str.substr(result.index, l);
	next = str.substr(index);
		
	// At this point, we should have either reached the end of the string
	// or encountered a white space
	var mFindEod = rFindEod.exec(next);
	if( mFindEod ){
		// OK, reached end of date
	} else {
		// Not ended properly
		result = undefined;
	};

	return result;
};

var rDurationSeparator = /^\s*\/\s*/;

/**
 * Finds a date string or a date range string.
 * date-range :=  date-string '/' date-string
 *             |  date-string;
 * 
 * If a date range is found, the following structure is returned:
 * {
 *    input: <string> original string given to routine
 *    ,index: <number> index into string where found date range begins
 *    ,str: <string> date range found in original string
 *    ,interval: <object> instance of DateInterval that is interpreted from the found date range
 * }
 */
function findDateString(str,index){

	var result = findSingleDateString(str,index);
	if( result ){
		// At this point, we have one date. See if this is a duration, with
		// another date after an appropriate separator. There are two variants:
		// - date / date  This is a regular date interval
		// - date / -     This is an ongoing date interval
		index = result.index + result.str.length;
		var next = str.substr(index);
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
				var another = findSingleDateString(str,index);
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
/**
 * If the input string contains a date, returns an instance of
 * DateInterval. Otherwise, returns null.
 */
function parseUserDate(dateStr){
	var dateInterval = null;
	
	var effectiveStr = $n2.trim(dateStr);
	var findStr = findDateString(effectiveStr, 0);
	if( findStr ){
		if( effectiveStr === findStr.str ){
			dateInterval = findStr.interval;
		};
	};
	
	if( null == dateInterval ){
		throw _loc('Can not parse date: {date}',{date:dateStr});
	};
	
	return dateInterval;
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
