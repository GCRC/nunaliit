package ca.carleton.gcrc.json;

import java.util.Collections;
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import org.json.JSONObject;

public class JSONObjectComparator implements Comparator<JSONObject> {

	static public JSONObjectComparator singleton = new JSONObjectComparator();
	
	@Override
	public int compare(JSONObject obj1, JSONObject obj2) {
		if( obj1 == obj2 ) {
			return 0;
			
		} else if( null == obj1 ) {
			return -1;
			
		} else if( null == obj2 ) {
			return 1;
		}
		
		// Check keys
		List<String> keys1 = new Vector<String>();
		{
			Iterator<?> it = obj1.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ) {
					String key = (String)keyObj;
					keys1.add(key);
				}
			}
		}
		List<String> keys2 = new Vector<String>();
		{
			Iterator<?> it = obj2.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ) {
					String key = (String)keyObj;
					keys2.add(key);
				}
			}
		}
		if( keys1.size() != keys2.size() ) {
			return keys1.size() - keys2.size();
		}
		Collections.sort(keys1);
		Collections.sort(keys2);
		for(int loop=0,e=keys1.size(); loop<e; ++loop){
			String key1 = keys1.get(loop);
			String key2 = keys2.get(loop);
			int c = key1.compareTo(key2);
			if( 0 != c ) return c;
		}
		
		// Check values
		for(String key : keys1){
			Object e1 = obj1.opt(key);
			Object e2 = obj2.opt(key);
			int c = JSONSupport.compare(e1, e2);
			if( 0 != c ) return c;
		}
		
		return 0;
	}

}
