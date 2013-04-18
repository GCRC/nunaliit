package ca.carleton.gcrc.json;

import java.io.Writer;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class JSONPrettyPrinter {
	
	private Writer writer;
	private String tab = "\t";
	
	public JSONPrettyPrinter(Writer writer){
		this.writer = writer;
	}

	public String getTab() {
		return tab;
	}

	public void setTab(String tab) {
		this.tab = tab;
	}
	
	public void prettyPrint(Object obj) throws Exception {
		prettyPrint(obj, 0);
	}
	
	public void prettyPrint(Object obj, int indentLevel) throws Exception {
		if( obj instanceof JSONObject ){
			prettyPrintObject((JSONObject)obj, indentLevel);
			
		} else if( obj instanceof JSONArray ){
			prettyPrintArray((JSONArray)obj, indentLevel);
		} else {
			writer.write( JSONSupport.valueToString(obj) );
		}
	}
	
	public void prettyPrintObject(JSONObject jsonObj, int indentLevel) throws Exception {
		writer.write("{");
		
		Iterator<?> it = jsonObj.keys();
		if( it.hasNext() ) {
			// Accumulate keys
			List<String> keys = new Vector<String>();
			while( it.hasNext() ){
				Object key = it.next();
				if( key instanceof String ){
					keys.add( (String)key );
				}
			}
			
			// Sort keys
			Collections.sort(keys);
			
			// Print out each key
			boolean first = true;
			for(String key : keys){
				Object value = jsonObj.get(key);
				
				// Print indentation
				writer.write("\n");
				for(int i=0,e=indentLevel+1;i<e;++i){
					writer.write(tab);
				}
				
				// Print comma, if needed
				if( first ) {
					first = false;
				} else {
					writer.write(",");
				}
				
				// Print key
				writer.write(JSONObject.quote(key));
				writer.write(":");
				
				// Print value
				prettyPrint(value, indentLevel+1);
			}

			// Print indentation
			writer.write("\n");
			for(int i=0,e=indentLevel;i<e;++i){
				writer.write(tab);
			}
		}

		writer.write("}");
	}
	
	public void prettyPrintArray(JSONArray jsonArray, int indentLevel) throws Exception {
		writer.write("[");
		
		if( jsonArray.length() > 0 ) {
			// Print out each item
			boolean first = true;
			for(int loop=0,arrayEnd=jsonArray.length(); loop<arrayEnd; ++loop){
				Object value = jsonArray.get(loop);
				
				// Print indentation
				writer.write("\n");
				for(int i=0,e=indentLevel+1;i<e;++i){
					writer.write(tab);
				}
				
				// Print comma, if needed
				if( first ) {
					first = false;
				} else {
					writer.write(",");
				}
				
				// Print value
				prettyPrint(value, indentLevel+1);
			}

			// Print indentation
			writer.write("\n");
			for(int i=0,e=indentLevel;i<e;++i){
				writer.write(tab);
			}
		}

		writer.write("]");
	}
}
