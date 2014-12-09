package ca.carleton.gcrc.couch.date.impl;

public class TimeInterval {
	
	private long min;
	private long max;
	private boolean endsNow;

	public TimeInterval(long min, long max) throws Exception {
		
		if( max < min ){
			throw new Exception("Interval can not be created with max lesser than min");
		}
		
		this.min = min;
		this.max = max;
		this.endsNow = false;
	}

	public TimeInterval(long min, NowReference now) throws Exception {
		
		if( now.getTime() < min ){
			throw new Exception("Interval bounded by now can not be created with min greater than now reference");
		}
		
		this.min = min;
		this.max = min;
		this.endsNow = true;
	}
	
	public boolean endsNow(){
		return this.endsNow;
	}

	public long getMin() {
		return min;
	}

	public long getMax(NowReference now) throws Exception {
		if( endsNow ){
			if( null == now ){
				throw new Exception("Must provide now reference to access now interval max");
			}
			return now.getTime();
		}
		return max;
	}

	public long getSize(NowReference now) throws Exception {
		return getMax(now)-min;
	}

	@Override
	public boolean equals(Object obj) {
		if( super.equals(obj) ) {
			return true;
		}
		
		if( obj instanceof TimeInterval ){
			TimeInterval another = (TimeInterval)obj;
			
			if( another.endsNow != endsNow ){
				return false;
			}
		
			if( endsNow ){
				if( another.min == min ) {
					return true;
				}
			} else {
				if( another.min == min 
				 && another.max == max ) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	public boolean isIncludedIn(TimeInterval interval, NowReference now) throws Exception {
		if( null == interval ){
			return false;
		};
		
		if( this.min >= interval.min 
		 && this.getMax(now) <= interval.getMax(now) ){
			return true;
		};

		return false;
	}
	
	public TimeInterval extendTo(TimeInterval interval) throws Exception {
		if( endsNow != interval.endsNow ){
			throw new Exception("Can not extend between time intervals which are fixed and based on now");
		}
		
		boolean newInstanceRequired = false;
		
		// Adjust min
		long nextMin = min;
		if( nextMin > interval.min ){
			nextMin = interval.min;
			newInstanceRequired = true;
		}

		// Adjust max
		long nextMax = max;
		if( endsNow ){
			if( nextMax != nextMin ){
				nextMax = nextMin;
				newInstanceRequired = true;
			}
		} else {
			if( nextMax < interval.max ){
				nextMax = interval.max;
				newInstanceRequired = true;
			}
		}
		
		if( newInstanceRequired ) {
			if( endsNow ){
				return new TimeInterval(nextMin, new NowReference(nextMin));
			} else {
				return new TimeInterval(nextMin, nextMax);
			}
		} else {
			return this;
		}
	}
	
	public boolean intersectsWith(TimeInterval interval, NowReference now) throws Exception {
		if( null == interval ){
			return false;
		};
		
		if( this.min > interval.getMax(now) ){
			return false;
		};
		if( this.getMax(now) < interval.min ){
			return false;
		};
		
		return true;
	}
	
	public TimeInterval getIntersection(TimeInterval interval, NowReference now) throws Exception {
		if( !this.intersectsWith(interval, now) ){
			return null;
		};
		
		if( this.isIncludedIn(interval, now) ) {
			return this;

		} else if(interval.isIncludedIn(this, now)) {
			return interval;
		
		} else {
			long min = this.min;
			long max = this.getMax(now);

			if( min < interval.min ){
				min = interval.min;
			};

			if( max > interval.getMax(now) ){
				max = interval.max;
			};
			
			return new TimeInterval(min,max);
		}
	}
	
	public String toString(){
		if( endsNow ){
			return "["+min+",now]";
		} else {
			return "["+min+","+max+"]";
		}
	}
}
