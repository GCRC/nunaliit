package ca.carleton.gcrc.couch.onUpload.plugin;

import java.io.File;

import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import org.apache.tika.mime.MediaType;

public interface FileConversionPlugin {
	
	final static public String WORK_ANALYZE = "analyze";
	final static public String WORK_APPROVE = "approve";
	final static public String WORK_ORIENT = "orient";
	final static public String WORK_THUMBNAIL = "thumbnail";
	final static public String WORK_UPLOAD_ORIGINAL = "uploadOriginal";
	final static public String WORK_ROTATE_CW = "rotateClockwise";
	final static public String WORK_ROTATE_CCW = "rotateCounterClockwise";
	final static public String WORK_ROTATE_180 = "rotate180";

	String getName();
	
	FileConversionMetaData getFileMetaData(File file);
	
	boolean handlesFileClass(String fileClass, String work);
	
	boolean handlesWorkType(MediaType mediaType, String work);

	void performWork(String work, AttachmentDescriptor attachmentDescriptor) throws Exception;
	
//	void analyzeFile(FileConversionContext conversionContext) throws Exception;
//	
//	void approveFile(FileConversionContext conversionContext) throws Exception;
}
