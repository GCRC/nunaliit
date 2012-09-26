package ca.carleton.gcrc.couch.export;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;

public class SchemaExportProperty {

	static public SchemaExportProperty parseJson(JSONObject jsonExportProperty) throws Exception {

		String type = jsonExportProperty.optString("type");
		String label = jsonExportProperty.optString("label");
		String selectString = jsonExportProperty.optString("select");
		if( null == selectString ){
			throw new Exception("Attribute 'select' must be provided in an export property: "+label);
		}
		
		if( null == label ) {
			label = selectString;
		}
		
		String[] selectors = selectString.split("\\.");
		ArrayList<String> selector = new ArrayList<String>(selectors.length);
		for(int i=0; i<selectors.length; ++i){
			selector.add( selectors[i] );
		}

		SchemaExportProperty property = new SchemaExportProperty();
		
		property.setSelector(selector);
		property.setLabel(label);
		property.setType(type);
		
		return property;
	}

	private String label;
	private List<String> selector;
	private String type;
	
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}
	
	public List<String> getSelector() {
		return selector;
	}
	
	public void setSelector(List<String> selector) {
		this.selector = selector;
	}
	
	public String getType() {
		return type;
	}
	
	public void setType(String type) {
		this.type = type;
	}
	
	public Object select(JSONObject doc){
		return select(doc,0);
	}

	private Object select(Object doc, int index){
		if( index >= selector.size() ){
			return null;
		}

		String propertyName = selector.get(index);
		Object value = null;
		
		if( doc instanceof JSONObject ) {
			JSONObject jsonObj = (JSONObject)doc;
			value = jsonObj.opt(propertyName);
			if( null != value 
			 && index < (selector.size()-1) ) {
				value = select(value, index+1);
			}
		}
		
		return value;
	}
}
