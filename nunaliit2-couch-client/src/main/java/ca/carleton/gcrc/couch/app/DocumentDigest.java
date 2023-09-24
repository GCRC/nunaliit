package ca.carleton.gcrc.couch.app;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

import org.json.JSONObject;

public class DocumentDigest {

	static public DocumentDigest fromJSONObject(JSONObject jsonObj){
		DocumentDigest dd = new DocumentDigest();
		
		if( null != jsonObj ){
			// Type
			{
				String type = jsonObj.optString("type", null);
				if( null != type ) {
					dd.setType(type);
				}
			}
			
			// digest on main document
			{
				String digest = jsonObj.optString("digest", null);
				if( null != digest ) {
					dd.setDocDigest(digest);
				}
			}
			
			// Attachments
			{
				JSONObject attachments = jsonObj.optJSONObject("attachments");
				if( null != attachments ){
					Iterator<?> it = attachments.keys();
					while( it.hasNext() ){
						Object keyObj = it.next();
						if( keyObj instanceof String ) {
							String attachmentName = (String)keyObj;
							
							JSONObject attObj = attachments.optJSONObject(attachmentName);
							if( null != attObj ){
								String digest = attObj.optString("digest", null);
								if( null != digest ){
									dd.addAttachmentDigest(attachmentName, digest);
								}
							}
						}
					}
				}
			}
		}
		
		return dd;
	}
	
	private String type;
	private String docDigest;
	private Map<String,String> attachmentDigestByName = new HashMap<String,String>();
	
	public DocumentDigest(){
		
	}
	
	public boolean equals(Object obj){
		if( null == obj ) {
			return false;
		}

		if( this == obj ) {
			return true;
		}
		
		if( obj instanceof DocumentDigest ) {
			DocumentDigest another = (DocumentDigest)obj;
			
			// Check that the same digest type is used 
			if( null == type && type != another.type ) {
				return false;
			} else if( false == type.equals(another.type) ) {
				return false;
			}
			
			// Verify digest of main document
			if( null == docDigest && docDigest != another.docDigest ) {
				return false;
			} else if( false == docDigest.equals(another.docDigest) ) {
				return false;
			}
			
			// Verify digests for attachments
			Set<String> myAttachmentNames = attachmentDigestByName.keySet();
			Set<String> otherAttachmentNames = another.attachmentDigestByName.keySet();
			if( myAttachmentNames.size() != otherAttachmentNames.size() ) {
				// not same number of attachments
				return false;
			} else if( false == myAttachmentNames.containsAll(otherAttachmentNames) ){
				// not same attachments
				return false;
			} else {
				// Verify digest for each attachment
				for(String attachmentName : myAttachmentNames){
					String myDigest = attachmentDigestByName.get(attachmentName);
					String otherDigest = another.attachmentDigestByName.get(attachmentName);
					if( null == myDigest && myDigest != otherDigest ) {
						// Not the same, one is null and not the other
						return false;
					} else if( false == myDigest.equals(otherDigest) ){
						// Different digest
						return false;
					}
				}
			}
			
			return true;
		}
		
		return false;
	}
	
	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getDocDigest() {
		return docDigest;
	}

	public void setDocDigest(String docDigest) {
		this.docDigest = docDigest;
	}

	public Set<String> getAttachmentNames(){
		return attachmentDigestByName.keySet();
	}

	public String getAttachmentDigest(String attachmentName){
		return attachmentDigestByName.get(attachmentName);
	}

	public void addAttachmentDigest(String attachmentName, String digest){
		attachmentDigestByName.put(attachmentName, digest);
	}
}
