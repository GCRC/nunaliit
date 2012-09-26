package ca.carleton.gcrc.geom;

import junit.framework.TestCase;

public class BoundingBoxTest extends TestCase {
	
	static private boolean isWithin(Number x1, Number x2, double tolerance){
		double delta = x1.doubleValue() - x2.doubleValue();
		double absDelta = Math.abs(delta);
		return( absDelta <= tolerance );
	}

	public void testExtendToInclude() throws Exception {
		BoundingBox bbox = new BoundingBox(-1,-2,1,2);
		
		Point point = new Point(3,4);
		
		bbox.extendToInclude(point);
		
		Number minX = bbox.getMinX();
		Number minY = bbox.getMinY();
		Number maxX = bbox.getMaxX();
		Number maxY = bbox.getMaxY();
		
		if( false == isWithin(minX, -1, 0.25) ) {
			fail("Unexpected minX: "+minX);
		}
		if( false == isWithin(minY, -2, 0.25) ) {
			fail("Unexpected minY: "+minY);
		}
		if( false == isWithin(maxX, 3, 0.25) ) {
			fail("Unexpected minX: "+maxX);
		}
		if( false == isWithin(maxY, 4, 0.25) ) {
			fail("Unexpected minY: "+maxY);
		}
	}

	public void testExtendToIncludeBoundingBox() throws Exception {
		BoundingBox bbox = new BoundingBox(-1,-2,1,2);
		BoundingBox bbox2 = new BoundingBox(3,4,5,6);
		
		bbox.extendToInclude(bbox2);
		
		Number minX = bbox.getMinX();
		Number minY = bbox.getMinY();
		Number maxX = bbox.getMaxX();
		Number maxY = bbox.getMaxY();
		
		if( false == isWithin(minX, -1, 0.25) ) {
			fail("Unexpected minX: "+minX);
		}
		if( false == isWithin(minY, -2, 0.25) ) {
			fail("Unexpected minY: "+minY);
		}
		if( false == isWithin(maxX, 5, 0.25) ) {
			fail("Unexpected minX: "+maxX);
		}
		if( false == isWithin(maxY, 6, 0.25) ) {
			fail("Unexpected minY: "+maxY);
		}
	}
}
