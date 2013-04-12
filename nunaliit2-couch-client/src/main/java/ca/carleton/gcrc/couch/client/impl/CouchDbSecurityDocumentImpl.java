package ca.carleton.gcrc.couch.client.impl;

import java.util.Collection;
import java.util.List;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;

public class CouchDbSecurityDocumentImpl implements CouchDbSecurityDocument {

	private JSONObject sec;
	
	public CouchDbSecurityDocumentImpl(JSONObject sec){
		this.sec = sec;
	}
	
	@Override
	public JSONObject getJSON() {
		return sec;
	}

	@Override
	public Collection<String> getAdminUsers() {
		return extractStringsFromArray("admins", "names");
	}

	@Override
	public void addAdminUser(String name) throws Exception {
		JSONArray ary = createArray("admins", "names");
		ary.put(name);
	}

	@Override
	public void removeAdminUser(String name) throws Exception {
		JSONArray ary = getArray("admins", "names");
		removeStringFromArray(ary, name);
	}

	@Override
	public Collection<String> getAdminRoles() {
		return extractStringsFromArray("admins", "roles");
	}

	@Override
	public void addAdminRole(String name) throws Exception {
		JSONArray ary = createArray("admins", "roles");
		ary.put(name);
	}

	@Override
	public void removeAdminRole(String name) throws Exception {
		JSONArray ary = getArray("admins", "roles");
		removeStringFromArray(ary, name);
	}

	@Override
	public Collection<String> getMemberUsers() {
		return extractStringsFromArray("members", "names");
	}

	@Override
	public void addMemberUser(String name) throws Exception {
		JSONArray ary = createArray("members", "names");
		ary.put(name);
	}

	@Override
	public void removeMemberUser(String name) throws Exception {
		JSONArray ary = getArray("members", "names");
		removeStringFromArray(ary, name);
	}

	@Override
	public Collection<String> getMemberRoles() {
		return extractStringsFromArray("members", "roles");
	}

	@Override
	public void addMemberRole(String name) throws Exception {
		JSONArray ary = createArray("members", "roles");
		ary.put(name);
	}

	@Override
	public void removeMemberRole(String name) throws Exception {
		JSONArray ary = getArray("members", "roles");
		removeStringFromArray(ary, name);
	}

	private void removeStringFromArray(JSONArray ary, String value) throws Exception {
		if( null != ary ){
			// find index
			int index = -1;
			for(int i=0,e=ary.length(); i<e; ++i){
				String v = ary.getString(i);
				if( value.equals(v) ){
					index = i;
					break;
				}
			}
			
			if( index >= 0 ){
				ary.remove(index);
			}
		}
	}
	
	private JSONArray createArray(String sectionName, String arrayName) throws Exception {
		JSONObject section = createSection(sectionName);
		
		JSONArray ary = section.optJSONArray(arrayName);
		if( null == ary ){
			ary = new JSONArray();
			section.put(arrayName, ary);
		}
		
		return ary;
	}

	private JSONObject createSection(String name) throws Exception {
		if( null == sec ){
			sec = new JSONObject();
		}

		JSONObject section = sec.optJSONObject(name);
		if( null == section ){
			section = new JSONObject();
			
			section.put("names", new JSONArray());
			section.put("roles", new JSONArray());
			
			sec.put(name, section);
		}
		
		return section;
	}
	
	private List<String> extractStringsFromArray(String sectionName, String arrayName){
		List<String> result = new Vector<String>();
		
		JSONArray ary = getArray(sectionName, arrayName);
		if( null != ary ){
			for(int i=0,e=ary.length(); i<e; ++i){
				String n = ary.optString(i);
				if( null != n ) {
					result.add(n);
				}
			}
		}
		
		return result;
	}

	private JSONArray getArray(String sectionName, String arrayName) {
		JSONObject section = getSection(sectionName);
		if( null == section ){
			return null;
		}
		
		return section.optJSONArray(arrayName);
	}

	private JSONObject getSection(String name) {
		if( null == sec ){
			return null;
		}

		return sec.optJSONObject(name);
	}
}
