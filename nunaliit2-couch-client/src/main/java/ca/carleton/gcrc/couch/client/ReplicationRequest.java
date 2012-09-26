package ca.carleton.gcrc.couch.client;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;

public class ReplicationRequest {
	
	final static public String REMOTE_USER_NAME = "<remote user name>";
	final static public String REMOTE_USER_PASSWORD = "<remote user password>";

	private String sourceServerUrl = null;
	private String sourceDbName = null;
	private String sourceUserName = null;
	private String sourcePassword = null;
	private String targetServerUrl = null;
	private String targetDbName = null;
	private String targetUserName = null;
	private String targetPassword = null;
	private boolean continuous = false;
	private boolean cancel = false;
	private String filter = null;
	private List<String> docIds = null;
	
	public String getSourceServerUrl() {
		return sourceServerUrl;
	}
	public void setSourceServerUrl(String sourceServerUrl) {
		this.sourceServerUrl = sourceServerUrl;
	}

	public String getSourceDbName() {
		return sourceDbName;
	}
	public void setSourceDbName(String sourceDbName) {
		this.sourceDbName = sourceDbName;
	}

	public String getSourceUserName() {
		return sourceUserName;
	}
	public void setSourceUserName(String sourceUserName) {
		this.sourceUserName = sourceUserName;
	}

	public String getSourcePassword() {
		return sourcePassword;
	}
	public void setSourcePassword(String sourcePassword) {
		this.sourcePassword = sourcePassword;
	}

	public String getTargetServerUrl() {
		return targetServerUrl;
	}
	public void setTargetServerUrl(String targetServerUrl) {
		this.targetServerUrl = targetServerUrl;
	}

	public String getTargetDbName() {
		return targetDbName;
	}
	public void setTargetDbName(String targetDbName) {
		this.targetDbName = targetDbName;
	}
	
	public String getTargetUserName() {
		return targetUserName;
	}
	public void setTargetUserName(String targetUserName) {
		this.targetUserName = targetUserName;
	}
	
	public String getTargetPassword() {
		return targetPassword;
	}
	public void setTargetPassword(String targetPassword) {
		this.targetPassword = targetPassword;
	}
	
	public boolean isContinuous() {
		return continuous;
	}
	public void setContinuous(boolean continuous) {
		this.continuous = continuous;
	}
	
	public boolean isCancel() {
		return cancel;
	}
	public void setCancel(boolean cancel) {
		this.cancel = cancel;
	}
	
	public String getFilter() {
		return filter;
	}
	public void setFilter(String filter) {
		this.filter = filter;
	}
	
	public List<String> getDocIds() {
		return docIds;
	}
	public void setDocIds(List<String> docIds) {
		this.docIds = docIds;
	}

	public String toString() {
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		if( null != sourceServerUrl ) {
			pw.print(sourceServerUrl);
			if( false == sourceServerUrl.endsWith("/") ) {
				pw.print("/");
			}
		}
		pw.print(sourceDbName);
		if( null != sourceUserName ) {
			pw.print("(");
			pw.print(sourceUserName);
			pw.print(")");
		}
		pw.print("->");
		if( null != targetServerUrl ) {
			pw.print(targetServerUrl);
			if( false == targetServerUrl.endsWith("/") ) {
				pw.print("/");
			}
		}
		pw.print(targetDbName);
		if( null != targetUserName ) {
			pw.print("(");
			pw.print(targetUserName);
			pw.print(")");
		}
		if( continuous ) {
			pw.print("<continuous>");
		}
		if( cancel ) {
			pw.print("<cancel>");
		}
		if( null != filter ) {
			pw.print("<filter:");
			pw.print(filter);
			pw.print(">");
		}
		if( null != docIds 
		 && docIds.size() > 0 ) {
			pw.print("<docIds:");
			boolean first = true;
			for(String docId : docIds) {
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(docId);
			}
			pw.print(">");
		}
		
		pw.flush();
		
		return sw.toString();
	}
}
