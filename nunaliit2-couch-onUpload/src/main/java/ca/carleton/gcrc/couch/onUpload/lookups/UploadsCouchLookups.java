package ca.carleton.gcrc.couch.onUpload.lookups;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.onUpload.DocumentsInError;
import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.couch.onUpload.Work;
import ca.carleton.gcrc.couch.onUpload.WorkDocumentDb;
import ca.carleton.gcrc.couch.onUpload.utils.AttachmentUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Map;

public final class UploadsCouchLookups {

    public static Work lookForWork(final CouchDesignDocument designDocument, final String viewName,
                                   final DocumentsInError documentsInError) throws Exception {
        Map<String, JSONObject> rowsByUploadId = null;
        CouchQuery query = new CouchQuery();
        query.setViewName(viewName);
        CouchQueryResults results;
        results = designDocument.performQuery(query);
        rowsByUploadId = AttachmentUtils.findUploadIds(results);

        for(JSONObject row : results.getRows()) {

            String id = row.optString("id");
            if (documentsInError.isDocumentInError(id)) continue;

            String state = null;
            String attachmentName = null;
            JSONArray key = row.optJSONArray("key");
            if (key != null) {
                if (key.length() > 0) {
                    state = key.getString(0);
                }
                if (key.length() > 1) {
                    attachmentName = key.getString(1);
                }
            }

            if (UploadConstants.UPLOAD_WORK_UPLOADED_FILE.equals(state)) continue;
            if (UploadConstants.UPLOAD_STATUS_WAITING_FOR_UPLOAD.equals(state)) {
                // In the case of "waiting_for_upload", the attachment name
                // refers to the uploadId
                JSONObject uploadIdRow = rowsByUploadId.get(attachmentName);
                if (uploadIdRow == null) {
                    // Missing information to continue
                    continue;
                } else {
                    String uploadRequestDocId = uploadIdRow.getString("id");
                    WorkDocumentDb work = new WorkDocumentDb(designDocument, state, id);
                    work.setUploadId(attachmentName);
                    work.setUploadRequestDocId(uploadRequestDocId);
                    return work;
                }
            } else {
                WorkDocumentDb work = new WorkDocumentDb(designDocument, state, id);
                work.setAttachmentName(attachmentName);
                return work;
            }
        }

        return null;
    }

}
