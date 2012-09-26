package ca.carleton.gcrc.couch.app;

import org.json.JSONObject;


public interface DigestComputer {
	
	String getType();

	DocumentDigest computeDocumentDigest(Document doc) throws Exception;
	
	String computeDigestFromJsonObject(JSONObject jsonObj) throws Exception;
}
