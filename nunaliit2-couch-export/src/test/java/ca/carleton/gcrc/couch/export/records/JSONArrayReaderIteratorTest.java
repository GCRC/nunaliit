package ca.carleton.gcrc.couch.export.records;

import java.io.StringReader;
import junit.framework.TestCase;

public class JSONArrayReaderIteratorTest  extends TestCase {

	public void testEmptyArray() throws Exception {
		StringReader sr = new StringReader("[]");
		JSONArrayReaderIterator it = new JSONArrayReaderIterator(sr);
		
		if( it.hasNext() ){
			fail("Empty array should not report hasNext()");
		}

		Object value = it.next();
		if( null != value ){
			fail("Empty array should not return object on next()");
		}
	}

	public void testSingleArray() throws Exception {
		StringReader sr = new StringReader("[{\"a\":1}]");
		JSONArrayReaderIterator it = new JSONArrayReaderIterator(sr);
		
		int numberOfObjects = 1;
		int i = 0;
		for(i=0; i<numberOfObjects; ++i){
			if( false == it.hasNext() ){
				fail("hasNext() should return true on index "+i);
			}

			Object value = it.next();
			if( null == value ){
				fail("next() should return an object on index "+i);
			}
		}

		if( it.hasNext() ){
			fail("hasNext() should return false on index "+i);
		}

		Object value = it.next();
		if( null != value ){
			fail("next() should return null on index "+i);
		}
	}

	public void testDoubleArray() throws Exception {
		StringReader sr = new StringReader("[{\"a\":1},{\"a\":2}]");
		JSONArrayReaderIterator it = new JSONArrayReaderIterator(sr);
		
		int numberOfObjects = 2;
		int i = 0;
		for(i=0; i<numberOfObjects; ++i){
			if( false == it.hasNext() ){
				fail("hasNext() should return true on index "+i);
			}

			Object value = it.next();
			if( null == value ){
				fail("next() should return an object on index "+i);
			}
		}

		if( it.hasNext() ){
			fail("hasNext() should return false on index "+i);
		}

		Object value = it.next();
		if( null != value ){
			fail("next() should return null on index "+i);
		}
	}

	public void testMultipleArray() throws Exception {
		StringReader sr = new StringReader("[{\"a\":1},{\"a\":2},{\"a\":3},{\"a\":4}]");
		JSONArrayReaderIterator it = new JSONArrayReaderIterator(sr);
		
		int numberOfObjects = 4;
		int i = 0;
		for(i=0; i<numberOfObjects; ++i){
			if( false == it.hasNext() ){
				fail("hasNext() should return true on index "+i);
			}

			Object value = it.next();
			if( null == value ){
				fail("next() should return an object on index "+i);
			}
		}

		if( it.hasNext() ){
			fail("hasNext() should return false on index "+i);
		}

		Object value = it.next();
		if( null != value ){
			fail("next() should return null on index "+i);
		}
	}
}
