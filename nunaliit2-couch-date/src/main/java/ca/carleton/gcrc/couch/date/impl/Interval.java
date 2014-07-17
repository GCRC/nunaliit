package ca.carleton.gcrc.couch.date.impl;

public class Interval {

	private long min;
	private long max;

	public Interval(long min, long max) throws Exception {
		
		if( max < min ){
			throw new Exception("Interval can not be created with max lesser than min");
		}
		
		this.min = min;
		this.max = max;
	}

	public long getMin() {
		return min;
	}

	public long getMax() {
		return max;
	}

	public long getSize(){
		return max-min;
	}

	@Override
	public boolean equals(Object obj) {
		if( super.equals(obj) ) {
			return true;
		}
		
		if( obj instanceof Interval ){
			Interval another = (Interval)obj;
			
			if( another.min == min 
			 && another.max == max ) {
				return true;
			}
		}
		
		return false;
	}
	
	public boolean isIncludedIn(Interval interval){
		if( null == interval ){
			return false;
		};
		
		if( this.min >= interval.min 
		 && this.max <= interval.max ){
			return true;
		};

		return false;
	}
	
	public Interval extendTo(Interval interval) throws Exception {
		long nextMin = min;
		long nextMax = max;
		
		if( nextMin > interval.min ){
			nextMin = interval.min;
		}
		if( nextMax > interval.max ){
			nextMax = interval.max;
		}
		
		if( min == nextMin && max == nextMax ) {
			return this;
		} else {
			return new Interval(nextMin, nextMax);
		}
	}
	
	public boolean intersectsWith(Interval interval){
		if( null == interval ){
			return false;
		};
		
		if( this.min > interval.max ){
			return false;
		};
		if( this.max < interval.min ){
			return false;
		};
		
		return true;
	}
	
	public Interval getIntersection(Interval interval) throws Exception {
		if( !this.intersectsWith(interval) ){
			return null;
		};
		
		if( this.isIncludedIn(interval) ) {
			return this;

		} else if(interval.isIncludedIn(this)) {
			return interval;
		
		} else {
			long min = this.min;
			long max = this.max;

			if( min < interval.min ){
				min = interval.min;
			};

			if( max > interval.max ){
				max = interval.max;
			};
			
			return new Interval(min,max);
		}
	}
}
