package ca.carleton.gcrc.couch.onUpload;

public class UploadConstants {


	static public final String UPLOAD_STATUS_KEY = "status";
	
	static public final String UPLOAD_STATUS_WAITING_FOR_UPLOAD = "waiting for upload"; // submitted without a file
	static public final String UPLOAD_STATUS_SUBMITTED = "submitted"; // submitted by robot
	static public final String UPLOAD_STATUS_SUBMITTED_INLINE = "submitted_inline"; // submitted directly by user
	static public final String UPLOAD_STATUS_ANALYZED = "analyzed"; // basic information established by robot
	static public final String UPLOAD_STATUS_WAITING_FOR_APPROVAL = "waiting for approval"; // waiting for a vetter to approve
	static public final String UPLOAD_STATUS_APPROVED = "approved"; // vetter has approved file
	static public final String UPLOAD_STATUS_DENIED = "denied"; // vetter has denied file
	static public final String UPLOAD_STATUS_ATTACHED = "attached"; // file has been attached to document

	// Keys on file descriptors
	static public final String ATTACHMENT_NAME_KEY = "attachmentName";
	static public final String MIME_CLASS_KEY = "fileClass";
	static public final String MEDIA_FILE_KEY = "mediaFile";
	static public final String SIZE_KEY = "size";
	static public final String MIME_KEY = "mimeType";
	static public final String ENCODING_KEY = "mimeEncoding";
	static public final String DATA_KEY = "data";
	static public final String SERVER_KEY = "server";
	static public final String THUMBNAIL_KEY = "thumbnail";
	static public final String ORIGINAL_ATTACHMENT_KEY = "originalAttachment";
	static public final String ORIGINAL_FILE_KEY = "original";
	static public final String HEIGHT_KEY = "height";
	static public final String WIDTH_KEY = "width";
	static public final String ORIGINAL_NAME_KEY = "originalName";
	static public final String IS_ORIGINAL_UPLOAD_KEY = "isOriginalUpload";
	static public final String SUBMITTER_KEY = "submitter";
	static public final String CONVERSION_PERFORMED_KEY = "conversionPerformed";
	static public final String SOURCE_KEY = "source";
	static public final String WORK_KEY = "work";
	static public final String EXIF_DATA_KEY = "exif";
	static public final String XMP_DATA_KEY = "xmp";
	static public final String PHOTOSPHERE_DATA_KEY = "photosphere";
	static public final String UPLOAD_ID_KEY = "uploadId";
	
	// Keys on server work performed
	static public final String SERVER_ORIENTATION_KEY = "orientation";
	static public final int    SERVER_ORIENTATION_VALUE = 1;
	static public final String SERVER_THUMBNAIL_KEY = "thumbnail";
	static public final int    SERVER_THUMBNAIL_VALUE = 1;
	
	// Work request
	static public final String UPLOAD_WORK_ORIENTATION = "orientation";
	static public final String UPLOAD_WORK_THUMBNAIL = "thumbnail";
	static public final String UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE = "uploadOriginalImage";
	static public final String UPLOAD_WORK_ROTATE_CW = "rotateClockwise";
	static public final String UPLOAD_WORK_ROTATE_CCW = "rotateCounterClockwise";
	static public final String UPLOAD_WORK_ROTATE_180 = "rotate180";
	static public final String UPLOAD_WORK_UPLOADED_FILE = "uploadId";
	static public final String UPLOAD_WORK_SIMPLIFY_GEOMETRY = "simplifyGeometry";
	static public final String UPLOAD_WORK_INREACH_SUBMIT = "inReachSubmit";

	// Top level document keys
	static public final String KEY_DOC_ID = "_id";
	static public final String KEY_DOC_REV = "_rev";
	static public final String KEY_DOC_GEOMETRY = "nunaliit_geom";
	static public final String KEY_DOC_ATTACHMENTS = "nunaliit_attachments";
	
	// nunaliit_type
	static public final String VALUE_NUNALIIT_TYPE_ATTACHMENTS = "attachment_descriptions";
	static public final String VALUE_NUNALIIT_TYPE_GEOMETRY = "geometry";
	
}
