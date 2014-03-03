package ca.carleton.gcrc.couch.client;

public class CouchDocumentOptions {

	private String revision = null;
	private boolean revsInfo = false;
	private boolean revisions = false;
	private boolean conflicts = false;
	private boolean deletedConflicts = false;
	
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
}
