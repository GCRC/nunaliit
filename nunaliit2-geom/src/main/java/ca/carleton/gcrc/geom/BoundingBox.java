package ca.carleton.gcrc.geom;

import java.util.List;
import java.util.Vector;

public class BoundingBox {

	private List<Number> minimumPositions;
	private List<Number> maximumPositions;
	
	public BoundingBox(){
		minimumPositions = new Vector<Number>();
		maximumPositions = new Vector<Number>();
	}
	
	public BoundingBox(double minX, double minY, double maxX, double maxY){
		minimumPositions = new Vector<Number>();
		minimumPositions.add(minX);
		minimumPositions.add(minY);

		maximumPositions = new Vector<Number>();
		maximumPositions.add(maxX);
		maximumPositions.add(maxY);
	}
	
	public Number getMinX(){
		Number result = null;
		if( minimumPositions.size() > 0 ) {
			result = minimumPositions.get(0);
		}
		return result;
	}
	
	public Number getMinY(){
		Number result = null;
		if( minimumPositions.size() > 1 ) {
			result = minimumPositions.get(1);
		}
		return result;
	}
	
	public Number getMaxX(){
		Number result = null;
		if( maximumPositions.size() > 0 ) {
			result = maximumPositions.get(0);
		}
		return result;
	}
	
	public Number getMaxY(){
		Number result = null;
		if( maximumPositions.size() > 1 ) {
			result = maximumPositions.get(1);
		}
		return result;
	}
	
	public void extendToInclude(BoundingBox another){
		// Minimums
		{
			int anotherSize = another.minimumPositions.size();
			for(int i=0,e=minimumPositions.size(); i<e; ++i){
				if( anotherSize > i ) {
					Number n = another.minimumPositions.get(i);
					if( n.doubleValue() < minimumPositions.get(i).doubleValue() ) {
						minimumPositions.set(i, n);
					}
				}
			}
			for(int i=minimumPositions.size(); i<anotherSize; ++i){
				minimumPositions.add( another.minimumPositions.get(i) );
			}
		}

		// Maximums
		{
			int anotherSize = another.maximumPositions.size();
			for(int i=0,e=maximumPositions.size(); i<e; ++i){
				if( anotherSize > i ) {
					Number n = another.maximumPositions.get(i);
					if( n.doubleValue() > maximumPositions.get(i).doubleValue() ) {
						maximumPositions.set(i, n);
					}
				}
			}
			for(int i=maximumPositions.size(); i<anotherSize; ++i){
				maximumPositions.add( another.maximumPositions.get(i) );
			}
		}
	}
	
	public void extendToInclude(Point point){
		List<Number> positions = point.getPositions();
		int pointSize = positions.size();
		
		// Minimums
		{
			for(int i=0,e=minimumPositions.size(); i<e; ++i){
				if( pointSize > i ) {
					Number n = positions.get(i);
					if( n.doubleValue() < minimumPositions.get(i).doubleValue() ) {
						minimumPositions.set(i, n);
					}
				}
			}
			for(int i=minimumPositions.size(); i<pointSize; ++i){
				minimumPositions.add( positions.get(i) );
			}
		}

		// Maximums
		{
			for(int i=0,e=maximumPositions.size(); i<e; ++i){
				if( pointSize > i ) {
					Number n = positions.get(i);
					if( n.doubleValue() > maximumPositions.get(i).doubleValue() ) {
						maximumPositions.set(i, n);
					}
				}
			}
			for(int i=maximumPositions.size(); i<pointSize; ++i){
				maximumPositions.add( positions.get(i) );
			}
		}
	}
}
