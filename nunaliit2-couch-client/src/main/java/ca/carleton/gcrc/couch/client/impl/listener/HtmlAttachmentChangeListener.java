package ca.carleton.gcrc.couch.client.impl.listener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.exception.NunaliitException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Attachment change listener for database documents with attachment of type HTML. Stores a {@link Document} as the
 * attachment object.
 */
public class HtmlAttachmentChangeListener extends AttachmentChangeListener<Document> {
    private static final Logger logger = LoggerFactory.getLogger(HtmlAttachmentChangeListener.class);

    /**
     * {@inheritDoc}
     */
    public HtmlAttachmentChangeListener(CouchDb couchDb, String documentIdToWatch, String attachmentFilename) throws NunaliitException {
        super(couchDb, documentIdToWatch, attachmentFilename);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected Document readInputStream(InputStream inputStream) {
        Document indexDoc = null;
        try {
            indexDoc = Jsoup.parse(inputStream, StandardCharsets.UTF_8.toString(), "");
        }
        catch (IOException e) {
            logger.error("Could not read attachment into HTML document: {}", getAttachmentFilename(), e);
        }

        return indexDoc;
    }

    @Override
    protected void performStartupTasks() {
        // No startup work to do.
    }
}
