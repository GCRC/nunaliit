package ca.carleton.gcrc.couch.client.impl.listener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Attachment change listener for database documents with attachment of type text. Stores a {@link String} as the
 * attachment object.
 */
public final class TextAttachmentChangeListener extends AttachmentChangeListener<String> {
    private static final Logger logger = LoggerFactory.getLogger(TextAttachmentChangeListener.class);

    /**
     * {@inheritDoc}
     */
    public TextAttachmentChangeListener(CouchDb couchDb, String documentIdToWatch, String attachmentFilename) throws NunaliitException {
        super(couchDb, documentIdToWatch, attachmentFilename);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    protected String readInputStream(InputStream inputStream) {
        String text = null;
        try {
            text = IOUtils.toString(inputStream, StandardCharsets.UTF_8);
        }
        catch (IOException e) {
            logger.error("Could not read attachment into string: {}", getAttachmentFilename(), e);
        }

        return text;
    }

    @Override
    protected void performStartupTasks() {
        // No startup tasks required.
    }
}
