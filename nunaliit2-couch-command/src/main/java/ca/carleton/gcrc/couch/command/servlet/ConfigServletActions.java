package ca.carleton.gcrc.couch.command.servlet;

import org.json.JSONObject;

public class ConfigServletActions {

	private boolean submissionDbEnabled = false;
	private JSONObject cached_welcome = null;

	public ConfigServletActions(){
	}
	
	synchronized public JSONObject getWelcome() throws Exception{
		if( null == cached_welcome ){
			cached_welcome = new JSONObject();
			cached_welcome.put("ConfigServlet", true);
			
			cached_welcome.put("submissionDbEnabled", submissionDbEnabled);
		}
		
		return cached_welcome;
	}
	
	public boolean isSubmissionDbEnabled(){
		return submissionDbEnabled;
	}
	
	public void setSubmissionDbEnabled(boolean submissionDbEnabled){
		this.submissionDbEnabled = submissionDbEnabled;
	}
}
