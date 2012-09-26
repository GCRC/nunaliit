package ca.carleton.gcrc.couch.onUpload.gpx;

public class GpxConversionContext {

	private String layerName;
	private String sourceDocumentId;
	private GpxBounds layerBounds = new GpxBounds();

	public String getLayerName() {
		return layerName;
	}

	public void setLayerName(String layerName) {
		this.layerName = layerName;
	}

	public String getSourceDocumentId() {
		return sourceDocumentId;
	}

	public void setSourceDocumentId(String sourceDocumentId) {
		this.sourceDocumentId = sourceDocumentId;
	}

	public GpxBounds getLayerBounds() {
		return layerBounds;
	}

	public void setLayerBounds(GpxBounds layerBounds) {
		this.layerBounds = layerBounds;
	}
}
