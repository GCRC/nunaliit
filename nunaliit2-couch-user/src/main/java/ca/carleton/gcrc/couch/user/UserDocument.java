package ca.carleton.gcrc.couch.user;

import java.util.HashSet;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

public class UserDocument {
	
	final static public String PROP_NAME_EMAILS = "nunaliit_emails";
	final static public String PROP_NAME_OPTIONS = "nunaliit_options";

	private JSONObject json;
	
	public UserDocument(JSONObject json){
		this.json = json;
	}
	
	public JSONObject getJSON(){
		return json;
	}

	public String getId(){
		return json.optString("_id",null);
	}

	public String getName(){
		return json.optString("name",null);
	}

	public String getDisplayName(){
		return json.optString("display",null);
	}
	
	public Set<String> getRoles(){
		Set<String> roles = new HashSet<String>();
		
		JSONArray roleArray = json.optJSONArray("roles");
		if( null != roleArray ){
			for(int i=0,e=roleArray.length(); i<e; ++i){
				String role = roleArray.optString(i, null);
				if( null != role ){
					roles.add(role);
				}
			}
		}
		
		return roles;
	}
	
	public Set<String> getEmails(){
		Set<String> emails = new HashSet<String>();
		
		JSONArray emailArray = json.optJSONArray(PROP_NAME_EMAILS);
		if( null != emailArray ){
			for(int i=0,e=emailArray.length(); i<e; ++i){
				String email = emailArray.optString(i, null);
				if( null != email ){
					emails.add(email);
				}
			}
		}
		
		return emails;
	}
	
	public boolean isReceivingVetterInstantNotifications(){
		JSONObject options = getNunaliitOptions();

		// By default
		boolean result = true;
		
		if( null != options ){
			result = options.optBoolean("vetterNotificationInstant", true);
		}
		
		return result;
	}
	
	public boolean isReceivingVetterDailyNotifications(){
		JSONObject options = getNunaliitOptions();

		// By default
		boolean result = false;
		
		if( null != options ){
			result = options.optBoolean("vetterNotificationDaily", false);
		}
		
		return result;
	}

	public Set<String> getMailDestinations() {
		JSONObject options = getNunaliitOptions();

		Set<String> mailDestinations = new HashSet<String>();
		
		if( null != options ){
			JSONArray arr = options.optJSONArray("mailDestinations");
			if( null != arr ){
				for(int i=0,e=arr.length(); i<e; ++i){
					Object obj = arr.opt(i);
					if( null != obj && obj instanceof String ){
						String destination = (String)obj;
						mailDestinations.add(destination);
					}
				}
			}
		}
		
		return mailDestinations;
	}
	
	private JSONObject getNunaliitOptions(){
		JSONObject options = json.optJSONObject(PROP_NAME_OPTIONS);
		return options;
	}
	
//	private JSONObject getNunaliitOptions(boolean create) throws Exception {
//		JSONObject options = json.optJSONObject(PROP_NAME_OPTIONS);
//		
//		if( null == options && create ){
//			options = new JSONObject();
//			json.put(PROP_NAME_OPTIONS, options);
//		}
//		
//		return options;
//	}
	
	public String toString(){
		String name = getDisplayName();
		if( null == name ){
			name = getName();
		}
		if( null == name ){
			name = "<unknown>";
		}
		return "UserDocument("+name+")";
	}
}
