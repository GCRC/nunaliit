package ca.carleton.gcrc.couch.onUpload.plugin;

public class FileConversionMetaData {

	private boolean isFileConvertable = false;
	private String mimeType = null;
	private String mimeEncoding = null;
	private String fileClass = null;
	public boolean isFileConvertable() {
		return isFileConvertable;
	}
	public void setFileConvertable(boolean isFileConvertable) {
		this.isFileConvertable = isFileConvertable;
	}

	public String getMimeType() {
		return mimeType;
	}
	public void setMimeType(String mimeType) {
		this.mimeType = mimeType;
	}

	public String getMimeEncoding() {
		return mimeEncoding;
	}
	public void setMimeEncoding(String mimeEncoding) {
		this.mimeEncoding = mimeEncoding;
	}

	public String getFileClass() {
		return fileClass;
	}
	public void setFileClass(String fileClass) {
		this.fileClass = fileClass;
	}
}
