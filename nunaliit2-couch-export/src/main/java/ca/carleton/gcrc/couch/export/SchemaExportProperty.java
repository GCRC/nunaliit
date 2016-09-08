package ca.carleton.gcrc.couch.export;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;

public class SchemaExportProperty {
	
	public enum Type {
		TEXT("text")
		,JSON("json")
		,GEOMETRY("geometry")
		;
		
		private String definitionString;
		private Type(String definitionString){
			this.definitionString = definitionString;
		}
		public String getDefinitionString(){
			return definitionString;
		}
	};
	
	static public Type typeFromDefinitionString(String definitionString) throws Exception{
		for(Type type : Type.values()){
			if( type.getDefinitionString().equals(definitionString) ){
				return type;
			};
		};
		
		throw new Exception("Unknown export type: "+definitionString);
	};

	static public SchemaExportProperty parseJson(JSONObject jsonExportProperty) throws Exception {

		String typeStr = jsonExportProperty.optString("type",null);
		String label = jsonExportProperty.optString("label",null);
		String selectString = jsonExportProperty.optString("select",null);
		
		Type type = Type.TEXT;
		if( null != typeStr ){
			type = typeFromDefinitionString(typeStr);
		}
		
		// Verify select attribute
		if( type == Type.GEOMETRY ){
			// Geometry does not required a 'select'
			if( null != selectString ){
				throw new Exception("Attribute 'select' should not be provided in an export property of type GEOMETRY: "+label);
			}
		} else if( null == selectString ){
			throw new Exception("Attribute 'select' must be provided in an export property: "+label);
		}
		
		if( null == label ) {
			label = selectString;
		}
		
		ArrayList<String> selector = null;
		if( null != selectString ){
			String[] selectors = selectString.split("\\.");
			selector = new ArrayList<String>(selectors.length);
			for(int i=0; i<selectors.length; ++i){
				selector.add( selectors[i] );
			}
		}

		SchemaExportProperty property = new SchemaExportProperty();
		
		property.setSelector(selector);
		property.setLabel(label);
		property.setType(type);
		
		return property;
	}

	private String label;
	private List<String> selector;
	private Type type = Type.TEXT;
	
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
	
	public Type getType() {
		return type;
	}
	
	public void setType(Type type) {
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
