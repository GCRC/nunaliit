package ca.carleton.gcrc.couch.client.impl.listener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * Watches for changes to attachment file in the site design document. Stores a local copy of the document and
 * updates it only when it changes in the database.  Use {@link #getAttachment()} to retrieve a copy of the latest
 * document.
 */
public abstract class AttachmentChangeListener<T> extends AbstractCouchDbChangeListener {
    private static final Logger logger = LoggerFactory.getLogger(AttachmentChangeListener.class);

    /**
     * Hash from DB from last retrieval of attachment document.
     */
    private String currentAttachmentHash;

    /**
     * Current attachment document downloaded from DB. Only updated if the hash changes.
     */
    private T attachment;
    /**
     * Lock object for getting and setting the attachment object.
     */
    private final Object lock = new Object();

    /**
     * The database document Id to watch for changes.
     */
    private String documentIdToWatch;

    /**
     * The attachment in the {@link #documentIdToWatch} to keep latest version of in memory. Only updated if attachment
     * digest has changed.
     */
    private String attachmentFilename;
    private CouchDb couchDb;

    /**
     * Create a new DB change listener thread to watch for document changes. If the {@link #documentIdToWatch} changes
     * in the database, the {@link #attachmentFilename} will be checked for changes. If the attachment changed, it is
     * downloaded and stored in memory for access using {@link #getAttachment()}.
     *
     * @param couchDb            Database access.
     * @param documentIdToWatch  The document Id to watch for changes.
     * @param attachmentFilename The attachment found in the given {@link #documentIdToWatch} to check for changes and
     *                           store in memory.
     */
    public AttachmentChangeListener(CouchDb couchDb, String documentIdToWatch, String attachmentFilename) throws NunaliitException {
        super(couchDb);
        this.couchDb = couchDb;
        this.documentIdToWatch = documentIdToWatch;
        this.attachmentFilename = attachmentFilename;
        // Initialise the attachment from the database on startup.
        updateDocument();
    }

    /**
     * Returns a shared reference of the latest attachment found in the database. Clients should clone this object if
     * they are modifying it.
     *
     * @return A reference to the latest attachment stored in memory.
     */
    public T getAttachment() {
        T result = null;
        synchronized (lock) {
            if (attachment != null) {
                result = attachment;
            }
        }

        return result;
    }

    /**
     * Thread safe method to set the current attachment object.
     *
     * @param attachment The latest attachment document.
     */
    protected void setAttachment(T attachment) {
        if (attachment != null) {
            synchronized (lock) {
                this.attachment = attachment;
            }
        }
    }

    public String getAttachmentFilename() {
        return attachmentFilename;
    }

    @Override
    protected void processDocIdChanged(Pair<String, Type> docChanged) {
        if (docChanged.getKey().equals(documentIdToWatch) &&
                docChanged.getValue().equals(Type.DOC_UPDATED)) {
            logger.debug("Document {} change type {}", docChanged.getKey(), docChanged.getValue());
            updateDocument();
        }
    }

    /**
     * Subclasses must implement this method to read the attachment input stream into the appropriate expected data
     * type.
     *
     * @param inputStream The attachment input stream.
     */
    protected abstract T readInputStream(InputStream inputStream);

    /**
     * Finds the attachment document in the given document. Only downloads the latest if the digest of the attachment
     * has changed. Updates the stored in memory object representation of the attachment.
     */
    private void updateDocument() {
        JSONObject sourceDocument = null;
        try {
            sourceDocument = couchDb.getDocument(documentIdToWatch);
        }
        catch (Exception e) {
            logger.error("Problem fetching docId {} from database", documentIdToWatch, e);
        }

        if (sourceDocument != null) {
            JSONObject attachments = sourceDocument.optJSONObject("_attachments");
            if (attachments != null) {
                JSONObject attachmentDoc = attachments.optJSONObject(attachmentFilename);
                if (attachmentDoc != null) {
                    String hash = attachmentDoc.optString("digest");
                    // Get latest attachment file if we don't already have it or digest changed.
                    if (StringUtils.isBlank(currentAttachmentHash) || !currentAttachmentHash.equals(hash)) {
                        logger.debug("Attachment document {} changed, getting from database", attachmentFilename);
                        currentAttachmentHash = hash;
                        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                            couchDb.downloadAttachment(documentIdToWatch, attachmentFilename, os);
                            InputStream inputStream = new ByteArrayInputStream(os.toByteArray());
                            T latestAttachment = readInputStream(inputStream);
                            setAttachment(latestAttachment);
                        }
                        catch (Exception e) {
                            logger.error("Could not read {} from database", attachmentFilename, e);
                        }
                    }
                }
            }
        }
    }
}
