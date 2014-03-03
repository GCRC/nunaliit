package ca.carleton.gcrc.couch.client;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Vector;

import org.json.JSONArray;
import org.json.JSONObject;

public class RevisionInfo {
	
	static public List<RevisionInfo> parseDoc(JSONObject doc) throws Exception {
		
		List<String> revOrder = new Vector<String>();
		Map<String,RevisionInfo> infoFromRev = new HashMap<String,RevisionInfo>();
		
		// Get current revision
		RevisionInfo current = null;
		{
			String rev = doc.optString("_rev");
			if( null != rev ){
				current = parseRevisionString(rev);
				
				revOrder.add(rev);
				infoFromRev.put(rev, current);
			}
		}
		
		// Handle the _revisions field
		if( null != doc.opt("_revisions") ){
			JSONObject revisions = doc.getJSONObject("_revisions");
			int start = revisions.getInt("start");
			JSONArray ids = revisions.getJSONArray("ids");
			
			for(int i=0,e=ids.length(); i<e; ++i){
				String h = ids.getString(i);
				String rev = "" + (start - i) + "-" + h;
				
				if( false == revOrder.contains(rev) ) {
					revOrder.add(rev);
				}
				
				if( false == infoFromRev.containsKey(rev) ){
					RevisionInfo revInfo = RevisionInfo.parseRevisionString(rev);
					infoFromRev.put(rev, revInfo);
				}
			}
		}
		
		// Handle the _revs_info field
		if( null != doc.opt("_revs_info") ){
			JSONArray revs_info = doc.getJSONArray("_revs_info");
			for(int i=0,e=revs_info.length(); i<e; ++i){
				JSONObject rev_info = revs_info.getJSONObject(i);
				String rev = rev_info.getString("rev");
				Status status = parseStatusString( rev_info.getString("status") );
				
				if( false == revOrder.contains(rev) ) {
					revOrder.add(rev);
				}
				
				if( false == infoFromRev.containsKey(rev) ){
					RevisionInfo revInfo = RevisionInfo.parseRevisionString(rev);
					revInfo.setStatus(status);
					infoFromRev.put(rev, revInfo);
				} else {
					// Set status
					infoFromRev.get(rev).setStatus(status);
				}
			}
		}

		// Create result
		List<RevisionInfo> result = new Vector<RevisionInfo>();
		for(String rev : revOrder){
			RevisionInfo revInfo = infoFromRev.get(rev);
			result.add(revInfo);
		}
		return result;
	}
	
	static public RevisionInfo parseRevisionString(String rev){
		if( rev == null ){
			return null;
		}
		
		RevisionInfo result = new RevisionInfo();
		
		result.setRev(rev);
		
		String[] components = rev.split("-");
		if( components.length == 2 ){
			int sequence = Integer.parseInt(components[0]);
			result.setSequence(sequence);
		}
		
		return result;
	}
	
	static public Status parseStatusString(String status){
		if( "available".equalsIgnoreCase(status) ){
			return Status.AVAILABLE;
			
		} else if( "missing".equalsIgnoreCase(status) ){
			return Status.MISSING;
			
		} else if( "deleted".equalsIgnoreCase(status) ){
			return Status.DELETED;
		}
		
		return Status.UNKNOWN;
	}

	public enum Status {
		UNKNOWN
		,AVAILABLE
		,MISSING
		,DELETED
	};
	
	private String rev = null;
	private int sequence = 0;
	private Status status = Status.UNKNOWN;

	public String getRev() {
		return rev;
	}
	public void setRev(String rev) {
		this.rev = rev;
	}
	
	public int getSequence(){
		return sequence;
	}
	public void setSequence(int sequence){
		this.sequence = sequence;
	}
	
	public Status getStatus() {
		return status;
	}
	public void setStatus(Status status) {
		this.status = status;
	}
	
	public String toString(){
		return ""+rev+"("+status+")";
	}
}
