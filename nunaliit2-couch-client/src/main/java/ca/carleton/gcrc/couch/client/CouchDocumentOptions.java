package ca.carleton.gcrc.couch.client;

import org.json.JSONObject;
import ca.carleton.gcrc.json.JSONSupport;

public class CouchDocumentOptions {

	private String revision = null;
	private boolean revsInfo = false;
	private boolean revisions = false;
	private boolean conflicts = false;
	private boolean deletedConflicts = false;
	private boolean fullRowResults = false;
	private String startKey = null;
	private String endKey = null;
	
	public String getRevision() {
		return revision;
	}
	public void setRevision(String revision) {
		this.revision = revision;
	}
	
	public boolean isRevsInfo() {
		return revsInfo;
	}
	public void setRevsInfo(boolean revsInfo) {
		this.revsInfo = revsInfo;
	}
	
	public boolean isRevisions() {
		return revisions;
	}
	public void setRevisions(boolean revisions) {
		this.revisions = revisions;
	}
	
	public boolean isConflicts() {
		return conflicts;
	}
	public void setConflicts(boolean conflicts) {
		this.conflicts = conflicts;
	}
	
	public boolean isDeletedConflicts() {
		return deletedConflicts;
	}
	public void setDeletedConflicts(boolean deletedConflicts) {
		this.deletedConflicts = deletedConflicts;
	}

	public boolean isFullRowResults() {
		return fullRowResults;
	}
	public void setFullRowResults(boolean fullRowResults) {
		this.fullRowResults = fullRowResults;
	}

	public String getStartKey() {
		return startKey;
	}
	public void setStartKey(String startKey) {
		this.startKey = JSONObject.quote(startKey);
	}
	public void setStartKey(Object startKey) throws Exception {
		this.startKey = JSONSupport.valueToString(startKey);
	}
	
	public String getEndKey() {
		return endKey;
	}
	public void setEndKey(String endKey) {
		this.endKey = JSONObject.quote(endKey);
	}
	public void setEndKey(Object endKey) throws Exception {
		this.endKey = JSONSupport.valueToString(endKey);
	}
}
