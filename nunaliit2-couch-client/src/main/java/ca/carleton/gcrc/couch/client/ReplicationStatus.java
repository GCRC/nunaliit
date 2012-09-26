package ca.carleton.gcrc.couch.client;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;

public class ReplicationStatus {

	static private Pattern patternTask0 = Pattern.compile("^`(.*)`:\\s+`(.*)` -> `(.*)`$");
	static private Pattern patternTask1 = Pattern.compile("^(.*):\\s+(.*) -> (.*)$");
	
	static public ReplicationStatus parseActiveTask(JSONObject obj) {
		ReplicationStatus status = null;
		if( null != obj ) {
			String type = obj.optString("type");
			String task = obj.optString("task");
			if( null != type
			 && null != task ) {
				Matcher matcherTask0 = patternTask0.matcher(task);
				Matcher matcherTask1 = patternTask1.matcher(task);
				
				if( matcherTask0.matches() ) {
					// matches 1.2.0
					String taskId = matcherTask0.group(1);
					String source = matcherTask0.group(2);
					String target = matcherTask0.group(3);
					
					status = new ReplicationStatus(taskId, source, target);
					
				} else if( matcherTask1.matches() ) {
					// matches prior to 1.2.0
					String taskId = matcherTask1.group(1);
					String source = matcherTask1.group(2);
					String target = matcherTask1.group(3);
					
					status = new ReplicationStatus(taskId, source, target);
				}
			}
		}
		return status;
	}
	
	static public ReplicationStatus findReplicationTask(
			JSONArray tasks
			,String source
			,String target
			) throws Exception {

		for(int i=0,e=tasks.length(); i<e; ++i) {
			JSONObject task = tasks.getJSONObject(i);
			ReplicationStatus status = ReplicationStatus.parseActiveTask(task);
			if( null != status ) {
				if( source.equals(status.getSource())
				 && target.equals(status.getTarget()) ) {
					return status;
				}
			}
		}
		
		return null;
	}
	
	private String taskId = null;
	private String source = null;
	private String target = null;

	private ReplicationStatus(
			String taskId
			,String source
			,String target
			) {
		this.taskId = taskId;
		this.source = source;
		this.target = target;
	}

	public String getTaskId() {
		return taskId;
	}

	public String getSource() {
		return source;
	}

	public String getTarget() {
		return target;
	}
}
