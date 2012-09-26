package ca.carleton.gcrc.json;

import java.util.Comparator;

import org.json.JSONArray;

public class JSONArrayComparator implements Comparator<JSONArray> {

	static public JSONArrayComparator singleton = new JSONArrayComparator();
	
	@Override
	public int compare(JSONArray arr1, JSONArray arr2) {
		if( arr1 == arr2 ) {
			return 0;
			
		} else if( null == arr1 ){
			return -1;
			
		} else if( null == arr2 ){
			return 1;
			
		} else if( arr1.length() != arr2.length() ){
			return arr1.length() - arr2.length();
		}
		
		for(int loop=0,e=arr1.length(); loop<e; ++loop){
			Object e1 = arr1.opt(loop);
			Object e2 = arr2.opt(loop);
			int c = JSONSupport.compare(e1, e2);
			if( 0 != c ) return c;
		}
		
		return 0;
	}

}
