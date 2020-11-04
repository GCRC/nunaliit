package ca.carleton.gcrc.couch.onUpload.utils;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.couch.onUpload.Work;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.DocumentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContext;
import ca.carleton.gcrc.couch.onUpload.conversion.FileConversionContextImpl;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

public final class AttachmentUtils {

    public static AttachmentDescriptor getAttachmentDescriptor(final FileConversionContext conversionContext,
                                                               final Work work) throws Exception {
        String attachmentName = work.getAttachmentName();
        DocumentDescriptor docDescriptor = conversionContext.getDocument();
        AttachmentDescriptor attachmentDescriptor = null;
        if (docDescriptor.isAttachmentDescriptionAvailable(attachmentName)) {
            attachmentDescriptor = docDescriptor.getAttachmentDescription(attachmentName);
        }
        return attachmentDescriptor;
    }

    public static String computeEffectiveAttachmentName(String attachmentName, Integer counter){
        String prefix = "";
        String suffix = "";
        int pos = attachmentName.indexOf('.', 1);
        if( pos < 0 ) {
            prefix = attachmentName;
        } else {
            prefix = attachmentName.substring(0, pos);
            suffix = attachmentName.substring(pos);
        }

        // Remove leading '_' from prefix
        while( prefix.length() > 0 && prefix.charAt(0) == '_' ){
            prefix = prefix.substring(1);
        }
        if( prefix.length() < 1 ){
            prefix = "a";
        }
        String effectiveAttachmentName = null;
        if( null != counter ){
            effectiveAttachmentName = prefix + "." + counter + suffix;
        } else {
            effectiveAttachmentName = prefix + suffix;
        }

        return effectiveAttachmentName;
    }

    public static Map<String, JSONObject> findUploadIds(CouchQueryResults results) throws Exception {
        Map<String,JSONObject> rowsByUploadId = new HashMap<String,JSONObject>();

        for(JSONObject row : results.getRows()) {
            String state = null;
            String uploadId = null;
            JSONArray key = row.optJSONArray("key");
            if( null != key ){
                if( key.length() > 0 ){
                    state = key.getString(0);
                }
                if( key.length() > 1 ){
                    uploadId = key.getString(1);
                }
            }

            if( UploadConstants.UPLOAD_WORK_UPLOADED_FILE.equals(state) ) {
                rowsByUploadId.put(uploadId, row);
            }
        }

        return rowsByUploadId;
    }

}
