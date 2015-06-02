package ca.carleton.gcrc.couch.simplifiedGeometry;

public class GeometryAttachmentRequest {
	private String docId;
	private String attName;

	public GeometryAttachmentRequest(){
		
	}

	public GeometryAttachmentRequest(String docId, String attName){
		this.docId = docId;
		this.attName = attName;
	}

	public String getDocId() {
		return docId;
	}
	public void setDocId(String docId) {
		this.docId = docId;
	}

	public String getAttName() {
		return attName;
	}
	public void setAttName(String attName) {
		this.attName = attName;
	}
	
}
