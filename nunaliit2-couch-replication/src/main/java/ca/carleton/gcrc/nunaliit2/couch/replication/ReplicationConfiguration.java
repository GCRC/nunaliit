package ca.carleton.gcrc.nunaliit2.couch.replication;

import java.util.List;
import java.util.Vector;

import ca.carleton.gcrc.couch.client.ReplicationRequest;

public class ReplicationConfiguration {

	private Integer replicationInterval = null;
	private List<ReplicationRequest> replications = new Vector<ReplicationRequest>();
	
	public Integer getReplicationInterval() {
		return replicationInterval;
	}

	public void setReplicationInterval(Integer replicationInterval) {
		this.replicationInterval = replicationInterval;
	}

	public List<ReplicationRequest> getReplications() {
		return replications;
	}
	
	public void addReplication(ReplicationRequest replication) {
		replications.add(replication);
	}
}
