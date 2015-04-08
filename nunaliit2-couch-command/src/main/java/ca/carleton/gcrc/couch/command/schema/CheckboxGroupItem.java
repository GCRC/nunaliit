package ca.carleton.gcrc.couch.command.schema;

import org.json.JSONObject;

public class CheckboxGroupItem {
	
	static public CheckboxGroupItem fromJson(JSONObject jsonOption) throws Exception {
		CheckboxGroupItem option = new CheckboxGroupItem();
		
		// id
		{
			String id = jsonOption.getString("id");
			option.setId(id);
		}
		
		// label
		{
			String label = jsonOption.optString("label", null);
			if( null != label ) {
				option.setLabel(label);
			}
		}
		
		return option;
	}

	private String id;
	private String label;
	
	public String getId() {
		return id;
	}
	
	public void setId(String id) {
		this.id = id;
	}
	
	public String getLabel() {
		return label;
	}
	
	public void setLabel(String label) {
		this.label = label;
	}

	public JSONObject toJson() throws Exception {
		JSONObject json = new JSONObject();
		
		json.put("id", id);
		if( null != label ) json.put("label", label);
		
		return json;
	}
}
