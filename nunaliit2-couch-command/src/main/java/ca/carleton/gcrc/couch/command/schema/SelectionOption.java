package ca.carleton.gcrc.couch.command.schema;

import org.json.JSONObject;

public class SelectionOption {
	
	static public SelectionOption fromJson(JSONObject jsonOption) throws Exception {
		SelectionOption option = new SelectionOption();
		
		// value
		{
			String value = jsonOption.getString("value");
			option.setValue(value);
		}
		
		// label
		{
			String label = jsonOption.optString("label", null);
			if( null != label ) {
				option.setLabel(label);
			}
		}
		
		// isDefault
		{
			boolean isDefault = jsonOption.optBoolean("isDefault",false);
			option.setDefault(isDefault);
		}
		
		return option;
	}

	private String label;
	private String value;
	private boolean isDefault;

	public SelectionOption(){
		
	}
	
	public String getLabel() {
		return label;
	}

	public void setLabel(String label) {
		this.label = label;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public boolean isDefault() {
		return isDefault;
	}

	public void setDefault(boolean isDefault) {
		this.isDefault = isDefault;
	}
	
	public JSONObject toJson() throws Exception {
		JSONObject jsonOption = new JSONObject();
		
		if( null != value ) jsonOption.put("value", value);
		if( null != label ) jsonOption.put("label", label);
		
		return jsonOption;
	}
}
