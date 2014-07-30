package ca.carleton.gcrc.couch.onUpload.conversion;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;

public class CreateUpdateInfo extends AbstractDescriptor {

	private DocumentDescriptor documentDescriptor;
	private String key;
	
	public CreateUpdateInfo(DocumentDescriptor documentDescriptor, String key){
		this.documentDescriptor = documentDescriptor;
		this.key = key;
	}
	
	public long getTime() throws Exception {
		return getLongAttribute(CouchNunaliitConstants.CREATE_UPDATE_KEY_TIME);
	}
	
	public String getUserName() throws Exception {
		return getStringAttribute(CouchNunaliitConstants.CREATE_UPDATE_KEY_NAME);
	}
	
	public JSONObject toJson() throws Exception {
		JSONObject obj = new JSONObject();
		
		obj.put("nunaliit_type", "actionstamp");
		if( key.equals("nunaliit_last_updated") ) {
			obj.put("action", "updated");
		} else if( key.equals("nunaliit_created") ) {
			obj.put("action", "created");
		}
		obj.put("name", getUserName());
		obj.put("time", getTime());
		
		return obj;
	}
	
	@Override
	protected JSONObject getJson() throws Exception {
		JSONObject doc = documentDescriptor.getJson();
		
		return doc.getJSONObject(key);
	}
}
