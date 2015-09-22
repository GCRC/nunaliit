package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.util.List;
import java.util.Vector;

public class SimplifiedGeometryRequest {

	private List<GeometryAttachmentRequest> requests = 
		new Vector<GeometryAttachmentRequest>();
	private Long sizeLimit = null;
	private Integer timeLimit = null;
	
	public SimplifiedGeometryRequest(){
		
	}

	public List<GeometryAttachmentRequest> getRequests() {
		return requests;
	}

	public void addRequest(String docId, String attName) {
		this.requests.add(
			new GeometryAttachmentRequest(docId, attName)
		);
	}

	public Long getSizeLimit() {
		return sizeLimit;
	}

	public void setSizeLimit(Long sizeLimit) {
		this.sizeLimit = sizeLimit;
	}

	public Integer getTimeLimit() {
		return timeLimit;
	}

	public void setTimeLimit(Integer timeLimit) {
		this.timeLimit = timeLimit;
	}
	
}
