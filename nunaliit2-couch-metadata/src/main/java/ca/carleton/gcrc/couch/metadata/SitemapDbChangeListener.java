package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Database change listener for the sitemap builder. Only interested in the site design and navigation documents. When
 * the site design document changes, check if the nunaliit_custom.js attachment has changed. If it has, search it for
 * the navigation document Id.
 * <p>
 * The navigation document Id is found in the "nunaliit_custom.js" attachment of the _design/site document. It is expected
 * to be configured as <code>customService.setOption('defaultNavigationIdentifier','navigation.demo');</code>, where
 * 'navigation.demo' is the navigation document Id.
 */
public class SitemapDbChangeListener extends Thread implements CouchDbChangeListener {
    private static final Logger logger = LoggerFactory.getLogger(SitemapDbChangeListener.class);

    /**
     * Regex used to find the navigation doc Id. Group 4 is the navigation doc id.
     */
    private static final Pattern pattern = Pattern.compile(".*(\"|')defaultNavigationIdentifier(\"|')[ ]*,[ ]*(\"|')([^\"']+)(\"|').*", Pattern.DOTALL);
    /**
     * Indicates whether the thread is running.
     */
    private final AtomicBoolean running = new AtomicBoolean(false);
    private CouchDb couchDb;
    /**
     * All change doc notifications received through the interface are put here and processed on this thread.
     */
    private BlockingQueue<String> changedDocIdQueue;
    /**
     * Document Ids to watch for changes in the database.
     */
    private Set<String> docsToWatch;
    /**
     * The hash/digest of the {@link ca.carleton.gcrc.couch.utils.CouchNunaliitConstants#NUNALIIT_CUSTOM_JS} file last time it was processed.
     */
    private String currentNunaliitCustomJsHash;
    /**
     * The navigation document Id found in the {@link ca.carleton.gcrc.couch.utils.CouchNunaliitConstants#NUNALIIT_CUSTOM_JS} file last time it was processed.
     */
    private String currentNavigationDocId;
    /**
     * Regex matching object for finding navigation doc Id.
     */
    private Matcher matcher;
    /**
     * Shared queue used to task {@link SitemapBuilderThread} with work.
     */
    private BlockingQueue<String> sharedNavigationDocIdQueue;

    public SitemapDbChangeListener(CouchDb couchDb, BlockingQueue<String> sharedNavigationDocIdQueue) throws NunaliitException {
        super(SitemapDbChangeListener.class.getSimpleName());
        this.couchDb = couchDb;
        this.sharedNavigationDocIdQueue = sharedNavigationDocIdQueue;
        // Only need to watch the site design doc and navigation document.
        docsToWatch = new HashSet<>(2);
        docsToWatch.add(CouchNunaliitConstants.SITE_DESIGN_DOC_ID);
        changedDocIdQueue = new LinkedBlockingQueue<>();
        matcher = pattern.matcher("");

        try {
            CouchDbChangeMonitor changeMonitor = couchDb.getChangeMonitor();
            changeMonitor.addChangeListener(this);
        }
        catch (Exception e) {
            throw new NunaliitException("Problem registering to CouchDB change monitor", e);
        }
    }

    @Override
    public void run() {
        running.set(true);
        logger.info("Starting sitemap DB change listener thread");
        // Process design doc at startup to kick off navigation doc processing for sitemap generation.
        processSiteDesign(CouchNunaliitConstants.SITE_DESIGN_DOC_ID);

        try {
            while (running.get()) {
                try {
                    filterDocIdQueue();
                }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.warn("Sitemap DB change listener thread was interrupted. May have failed to complete an operation.");
                }
            }
        }
        finally {
            logger.info("Shutting down sitemap DB change listener thread");
        }
    }

    public void terminate() {
        running.set(false);
    }

    //TODO: need to watch out for multiple updates to same doc in short timeframe...

    /**
     * {@inheritDoc}
     * Don't want to do any work in this method since it's run in the thread that calls it
     * ({@link ca.carleton.gcrc.couch.client.impl.CouchDbChangeMonitorThread}). So we put the doc Id on a queue and
     * process them in this thread's run method.
     */
    @Override
    public void change(Type type, String docId, String rev, JSONObject rawChange, JSONObject doc) {
        try {
            // Drop CREATED events because they are immediately followed by an UPDATED event for the same docId.
            if (StringUtils.isNotBlank(docId) && Type.DOC_UPDATED.equals(type)) {
                changedDocIdQueue.put(docId);
            }
        }
        catch (InterruptedException e) {
            logger.warn("Couldn't add document Id {} to changed document queue, due to thread interrupted", docId);
        }
    }

    /**
     * Processes all docIds that have been received through the {@link CouchDbChangeListener} interface. Filters out
     * only those docIds that are relevant to sitemap updates and adds these to a queue shared with metadata builder.
     *
     * @throws InterruptedException Thread was interrupted while waiting on a take off the concurrent changed docIds
     *                              queue.
     */
    private void filterDocIdQueue() throws InterruptedException {
        String docId = changedDocIdQueue.take();

        try {
            if (docsToWatch.contains(docId)) {
                logger.debug("Relevant docId {} changed, processing for updates", docId);
                if (CouchNunaliitConstants.SITE_DESIGN_DOC_ID.equals(docId)) {
                    processSiteDesign(docId);
                }
                else if (docId.equals(currentNavigationDocId)) {
                    // Put the doc Id on the shared queue to trigger a rebuild of the sitemap links.
                    sharedNavigationDocIdQueue.put(currentNavigationDocId);
                }
            }
        }
        catch (Exception e) {
            logger.error("Problem occurred while reading document", e);
        }
    }

    /**
     * Process the site design document (_design/site). Only interested in the nunaliit_custom.js attachment. If the
     * file hasn't been processed, or the hash has changed, need to process. Otherwise, no further work to do.
     *
     * @param docId The site design document identifier.
     */
    private void processSiteDesign(String docId) {
        JSONObject siteDesignDoc = null;
        try {
            siteDesignDoc = couchDb.getDocument(docId);
        }
        catch (Exception e) {
            logger.error("Problem fetching docId {} from database", docId, e);
        }

        if (siteDesignDoc != null) {
            JSONObject attachments = siteDesignDoc.optJSONObject("_attachments");
            if (attachments != null) {
                JSONObject nunaliitCustomJs = attachments.optJSONObject(CouchNunaliitConstants.NUNALIIT_CUSTOM_JS);
                if (nunaliitCustomJs != null) {
                    String hash = nunaliitCustomJs.optString("digest");
                    if (StringUtils.isNotBlank(hash) && !hash.equals(currentNunaliitCustomJsHash)) {
                        currentNunaliitCustomJsHash = hash;
                        logger.debug("{} has changed, checking for navigation document change", CouchNunaliitConstants.NUNALIIT_CUSTOM_JS);
                        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                            couchDb.downloadAttachment(CouchNunaliitConstants.SITE_DESIGN_DOC_ID, CouchNunaliitConstants.NUNALIIT_CUSTOM_JS, os);
                            String navigationDocId = findNavigationDocId(os);
                            // Navigation doc Id changed.
                            if (StringUtils.isNotBlank(navigationDocId) && !navigationDocId.equals(currentNavigationDocId)) {
                                // Remove the old one from the watch list.
                                if (StringUtils.isNotBlank(currentNavigationDocId)) {
                                    docsToWatch.remove(currentNavigationDocId);
                                }

                                currentNavigationDocId = navigationDocId;
                                docsToWatch.add(currentNavigationDocId);
                                changedDocIdQueue.put(currentNavigationDocId);
                            }
                        }
                        catch (Exception e) {
                            logger.error("Could not read {} from database", CouchNunaliitConstants.NUNALIIT_CUSTOM_JS, e);
                        }
                    }
                }
            }
        }
    }

    /**
     * Searches the output stream for the navigation document Id, based on a regex pattern built with the key
     * 'defaultNavigationIdentifier' to identify the navigation document identifier.
     *
     * @param os Ouptut stream to search.
     * @return The navigation document Id or null if it was not found.
     */
    protected String findNavigationDocId(ByteArrayOutputStream os) {
        String navigationDocId = null;
        try (InputStream is = new ByteArrayInputStream(os.toByteArray());
             BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {

            String line;
            while ((line = reader.readLine()) != null) {
                matcher.reset(line);
                if (matcher.matches()) {
                    navigationDocId = matcher.group(4);
                    break;
                }
            }
        }
        catch (Exception e) {
            logger.error("Could not search file for navigation document Id: {}", e.getMessage());
        }

        return navigationDocId;
    }
}
