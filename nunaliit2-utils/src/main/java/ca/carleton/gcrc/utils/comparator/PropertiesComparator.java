package ca.carleton.gcrc.utils.comparator;

import java.util.Comparator;
import java.util.Enumeration;
import java.util.Properties;

public class PropertiesComparator implements Comparator<Properties> {

	@Override
	public int compare(Properties o1, Properties o2) {
		if( o1.size() != o2.size() ) {
			return o1.size() - o2.size();
		}
		Enumeration<Object> e = o1.keys();
		while( e.hasMoreElements() ){
			Object keyObj = e.nextElement();
			if( keyObj instanceof String ) {
				String key = (String)keyObj;
				Object value1 = o1.get(key);
				Object value2 = o2.get(key);
				
				if( value1 == null && value2 == null ) {
					// OK
				} else if( value1 == null ) {
					return -1;
				} else if( value2 == null ) {
					return 1;
				} else if( value1 instanceof String 
					&& value2 instanceof String) {
					int c = ((String)value1).compareTo( (String)value2 );
					if( 0 != c ) {
						return c;
					}
				} else if( value1 instanceof String ) {
					return -1;
				} else if( value2 instanceof String ) {
					return 1;
				} else {
					// Both have a value under the key, but both values
					// are not String instances. Ignore.
				}
			}
		}
		return 0;
	}

}
