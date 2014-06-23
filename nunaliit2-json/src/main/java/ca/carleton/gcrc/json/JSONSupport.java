package ca.carleton.gcrc.json;

import java.util.Collection;
import java.util.Iterator;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONString;

public class JSONSupport {

	static public boolean containsKey(JSONObject obj, String key){
		Iterator<?> it = obj.keys();
		while( it.hasNext() ){
			Object keyObj = it.next();
			if( keyObj instanceof String ) {
				String k = (String)keyObj;
				if( k.equals(key) ) return true;
			}
		}
		return false;
	}

	static public String valueToString(Object value) throws Exception {
        if (value == null || value.equals(null)) {
            return "null";
        }
        if (value instanceof JSONString) {
            Object object;
            try {
                object = ((JSONString)value).toJSONString();
            } catch (Exception e) {
                throw new JSONException(e);
            }
            if (object instanceof String) {
                return (String)object;
            }
            throw new JSONException("Bad value from toJSONString: " + object);
        }
        if (value instanceof Number) {
            return numberToString((Number) value);
        }
        if (value instanceof Boolean || value instanceof JSONObject ||
                value instanceof JSONArray) {
            return value.toString();
        }
        if (value instanceof Map) {
            return new JSONObject((Map<?,?>)value).toString();
        }
        if (value instanceof Collection) {
            return new JSONArray((Collection<?>)value).toString();
        }
        if (value.getClass().isArray()) {
            return new JSONArray(value).toString();
        }
        return JSONObject.quote(value.toString());
    }

	static public String numberToString(Number number) throws Exception {
        if (number == null) {
            throw new JSONException("Null pointer");
        }
        testValidity(number);

// Shave off trailing zeros and decimal point, if possible.

        String string = number.toString();
        if (string.indexOf('.') > 0 && string.indexOf('e') < 0 &&
                string.indexOf('E') < 0) {
            while (string.endsWith("0")) {
                string = string.substring(0, string.length() - 1);
            }
            if (string.endsWith(".")) {
                string = string.substring(0, string.length() - 1);
            }
        }
        return string;
    }

	static public void testValidity(Object o) throws Exception {
        if (o != null) {
            if (o instanceof Double) {
                if (((Double)o).isInfinite() || ((Double)o).isNaN()) {
                    throw new JSONException(
                        "JSON does not allow non-finite numbers.");
                }
            } else if (o instanceof Float) {
                if (((Float)o).isInfinite() || ((Float)o).isNaN()) {
                    throw new JSONException(
                        "JSON does not allow non-finite numbers.");
                }
            }
        }
    }
	
	static public int compare(Object obj1, Object obj2){
		if( obj1 == obj2 ) {
			return 0;
		}
		if( obj1 == null ) {
			return -1;
		}
		if( obj2 == null ) {
			return 1;
		}
		if( obj1.getClass() != obj2.getClass() ) {
			// Not same class, sort by class name
			return obj1.getClass().getName().compareTo( obj2.getClass().getName() );
		}
		if( obj1 instanceof JSONObject ) {
			return JSONObjectComparator.singleton.compare((JSONObject)obj1, (JSONObject)obj2);
		}
		if( obj1 instanceof JSONArray ) {
			return JSONArrayComparator.singleton.compare((JSONArray)obj1, (JSONArray)obj2);
		}
		if( obj1 instanceof String ) {
			return ((String)obj1).compareTo((String)obj2);
		}
		if( obj1 instanceof Number ) {
			double d1 = ((Number)obj1).doubleValue();
			double d2 = ((Number)obj2).doubleValue();
			if( d1 < d2 ) return -1;
			if( d1 > d2 ) return 1;
			return 0;
		}
		if( obj1 instanceof Boolean ) {
			return ((Boolean)obj1).compareTo((Boolean)obj2);
		}
		return 0;
	}
	
	static public JSONObject copyObject(JSONObject obj){
		if( null == obj ) {
			return null;
		}
		
		JSONObject c = new JSONObject();
		
		Iterator<?> keyIt = obj.keys();
		while( keyIt.hasNext() ){
			Object keyObj = keyIt.next();
			if( keyObj instanceof String ){
				String key = (String)keyObj;
				Object value = obj.get(key);
				
				if( null == value ){
					c.put(key, value);
					
				} else if( value instanceof JSONObject ) {
					c.put(key, copyObject((JSONObject)value));
					
				} else if( value instanceof JSONArray ) {
					c.put(key, copyArray((JSONArray)value));
					
				} else {
					c.put(key, value);
				}
			}
		}
		
		return c;
	}
	
	static public JSONArray copyArray(JSONArray arr){
		if( null == arr ) {
			return null;
		}
		
		JSONArray c = new JSONArray();
		
		for(int i=0,e=arr.length(); i<e; ++i){
			Object value = arr.get(i);
			
			if( null == value ){
				c.put(value);
				
			} else if( value instanceof JSONObject ) {
				c.put(copyObject((JSONObject)value));
				
			} else if( value instanceof JSONArray ) {
				c.put(copyArray((JSONArray)value));
				
			} else {
				c.put(value);
			}
		}
		
		return c;
	}
	
	static public JSONObject fromError(Throwable t){
		return fromError(t, 8);
	}
	
	static public JSONObject fromError(Throwable t, int limit){
		if( limit < 0 ){
			return null;
		}
		if( null == t ){
			return null;
		}
		
		JSONObject errorObj = new JSONObject();
		String message = t.getMessage();
		if( null == message ){
			message = t.getClass().getName();
		}
		errorObj.put("error", message);

		// Stack trace
		{
			StackTraceElement[] stackTrace = t.getStackTrace();
			if( null != stackTrace && stackTrace.length > 0 ){
				errorObj.put("stack", stackTrace[0].toString());
			}
		}
		
		// Cause
		JSONObject causeObj = fromError(t.getCause(), limit-1);
		if( null != causeObj ){
			errorObj.put("cause", causeObj);
		}
		
		return errorObj;
	}
}
