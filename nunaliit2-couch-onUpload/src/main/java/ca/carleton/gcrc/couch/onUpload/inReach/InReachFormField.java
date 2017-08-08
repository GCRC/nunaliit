package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.List;

public interface InReachFormField {
	
	public enum Type {
		PICKLIST("PickList"),
		TEXT("Text");
		
		private String label;
		private Type(String label){
			this.label = label;
		}
		public String getLabel(){
			return label;
		}
	};

	String getName();
	
	Type getType() throws Exception;

	String getTypeString();
	
	boolean isRequired();
	
	List<String> getValues();
	
	Long getLength();
	
	String getDefault();
}
