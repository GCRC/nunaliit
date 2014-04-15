package ca.carleton.gcrc.couch.user.agreement;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONObject;

public class AgreementUtils {

	static public boolean getEnabledFromAgreementDocument(
			JSONObject agreementDoc
			) throws Exception {
		
		boolean enabled = false;
		
		JSONObject agreementInfo = agreementDoc.optJSONObject("nunaliit_user_agreement");
		if( null != agreementInfo ){
			enabled = agreementInfo.optBoolean("enabled",false);
		}
		
		return enabled;
	}

	static public Set<String> getContentsFromAgreementDocument(
			JSONObject agreementDoc
			) throws Exception {
		
		Set<String> agreementContents = new HashSet<String>();
		JSONObject agreementInfo = agreementDoc.optJSONObject("nunaliit_user_agreement");
		if( null != agreementInfo ){
			Object content = agreementInfo.opt("content");
			if( null == content ) {
				// Nothing to do. It is not available
			} else if( content instanceof String ){
				agreementContents.add( (String)content );
			} else if( content instanceof JSONObject ){
				// Localized string
				// {
				//    "nunaliit_type": "localized"
				//    ,"en": "..."
				//    ,"fr": "..."
				// }
				// Any version is fine
				JSONObject jsonContent = (JSONObject)content;
				Iterator<?> it = jsonContent.keys();
				while( it.hasNext() ){
					Object keyObj = it.next();
					if( keyObj instanceof String ){
						String key = (String)keyObj;
						Object valueObj = jsonContent.get(key);
						if( valueObj instanceof String ){
							String value = (String)valueObj;
							
							if( "nunaliit_type".equals(key) ) {
								if( false == "localized".equals(value) ){
									throw new Exception("Expected localized string for user agreement content");
								}
							} else {
								agreementContents.add(value);
							};
						}
					}
				}
			}
		}
		
		return agreementContents;
	}
}
