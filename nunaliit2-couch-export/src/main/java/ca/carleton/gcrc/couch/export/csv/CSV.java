package ca.carleton.gcrc.couch.export.csv;

import java.io.Writer;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

public class CSV {

	static public void printCsvLine(Writer writer, List<Object> values) throws Exception {
		boolean first = true;
		for(Object value : values){
			if( first ){
				first = false;
			} else {
				writer.write(",");
			}
			
			if( null == value ){
				writer.write("\"\"");
			
			} else if( value instanceof String ) {
				String str = (String)value;
				printEscapedString(writer, str);
			
			} else if( value instanceof Number ) {
				Number n = (Number)value;
				writer.write( n.toString() );
				
			} else if( value instanceof Boolean ) {
				Boolean b = (Boolean)value;
				writer.write( b.toString() );

			} else if( value instanceof JSONObject ) {
				JSONObject obj = (JSONObject)value;
				String jsonStr = obj.toString();
				printEscapedString(writer, jsonStr);

			} else if( value instanceof JSONArray ) {
				JSONArray arr = (JSONArray)value;
				String jsonStr = arr.toString();
				printEscapedString(writer, jsonStr);
			}
		}
		
		writer.write("\n");
	}

	static public void printEscapedString(Writer writer, String str) throws Exception {
		writer.write("\"");
		
		for(int loop=0; loop<str.length(); ++loop){
			char c = str.charAt(loop);
			switch(c){
			case '"':
				writer.write("\"\"");
				break;
			default:
				writer.write(c);
			}
		}
		
		writer.write("\"");
	}

}
