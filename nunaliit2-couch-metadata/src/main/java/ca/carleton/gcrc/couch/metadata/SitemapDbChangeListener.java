package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.couch.client.impl.listener.AbstractCouchDbChangeListener;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
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
public class SitemapDbChangeListener extends AbstractCouchDbChangeListener {
    private static final Logger logger = LoggerFactory.getLogger(SitemapDbChangeListener.class);

    /**
     * Regex used to find the navigation doc Id. Group 4 is the navigation doc id.
     */
    private static final Pattern pattern = Pattern.compile("(?!\\s*//).*(\"|')defaultNavigationIdentifier(\"|')[ ]*,[ ]*(\"|')([^\"']+)(\"|').*", Pattern.DOTALL);

    private CouchDb couchDb;
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
     * Indicates whether to use the navigation specification in the atlas document, instead of what is in the {@link ca.carleton.gcrc.couch.utils.CouchNunaliitConstants#NUNALIIT_CUSTOM_JS} file.
     */
    private boolean useAtlasDocNavigation;//TODO: need to cleanup docsToWatch on switching between two places to get nav
    /**
     * Regex matching object for finding navigation doc Id.
     */
    private Matcher matcher;
    /**
     * Shared queue used to task {@link SitemapBuilderThread} with work.
     */
    private BlockingQueue<String> sharedDocIdQueue;

    public SitemapDbChangeListener(CouchDb couchDb, BlockingQueue<String> sharedDocIdQueue) throws NunaliitException {
        super(couchDb);
        this.couchDb = couchDb;
        this.sharedDocIdQueue = sharedDocIdQueue;
        // Only need to watch the site design doc and navigation document.
        docsToWatch = new HashSet<>(2);
        docsToWatch.add(CouchNunaliitConstants.SITE_DESIGN_DOC_ID);
        matcher = pattern.matcher("");

        try {
            CouchDbChangeMonitor changeMonitor = couchDb.getChangeMonitor();
            changeMonitor.addChangeListener(this);
        }
        catch (Exception e) {
            throw new NunaliitException("Problem registering to CouchDB change monitor", e);
        }
    }

    /**
     * Processes all docIds that have been received through the {@link CouchDbChangeListener} interface. Filters out
     * only those docIds that are relevant to sitemap updates and adds these to a queue shared with metadata builder.
     */
    @Override
    protected void processDocIdChanged(Pair<String, Type> docChanged) {
        if (docsToWatch.contains(docChanged.getKey()) && docChanged.getValue().equals(Type.DOC_UPDATED)) {
            logger.debug("Relevant docId {} changed, processing for updates", docChanged.getKey());
            if (CouchNunaliitConstants.SITE_DESIGN_DOC_ID.equals(docChanged.getKey())) {
                processSiteDesign(docChanged.getKey());
            }
            else if (docChanged.getKey().equals(currentNavigationDocId)) {
                try {
                    // Put the doc Id on the shared queue to trigger a rebuild of the sitemap links.
                    sharedDocIdQueue.put(currentNavigationDocId);
                }
                catch (InterruptedException e) {
                    logger.warn("Couldn't add navigation document Id to work queue: {}", currentNavigationDocId);
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    @Override
    protected void performStartupTasks() {
        // Process design doc at startup to kick off navigation doc processing for sitemap generation.
        processSiteDesign(CouchNunaliitConstants.SITE_DESIGN_DOC_ID);
        // Cause the worker thread to build the sitemap.
        try {//TODO: should sharedDocIdQueue be "put" in processSiteDesign instead?
            if (StringUtils.isNotBlank(currentNavigationDocId)) {
                sharedDocIdQueue.put(currentNavigationDocId);
            }
            else {
                // Didn't find navigation doc Id in nunaliit_custom.js, check the atlas document.
                sharedDocIdQueue.put(CouchNunaliitConstants.ATLAS_DOC_ID);
            }
        }
        catch (InterruptedException e) {
            logger.warn("Couldn't add navigation document Id to work queue: {}", currentNavigationDocId);
            Thread.currentThread().interrupt();
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

        //TODO: need to check hash on atlas doc if that's the one we're using
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
                            // Navigation doc Id changed or was removed.
                            if (StringUtils.isNotBlank(navigationDocId) && !navigationDocId.equals(currentNavigationDocId)) {
                                // Remove the old one from the watch list.
                                if (StringUtils.isNotBlank(currentNavigationDocId)) {
                                    docsToWatch.remove(currentNavigationDocId);
                                }
                                // In case the atlas doc is the current source of navigation data.
                                docsToWatch.remove(CouchNunaliitConstants.ATLAS_DOC_ID);

                                currentNavigationDocId = navigationDocId;
                                docsToWatch.add(currentNavigationDocId);
                                //TODO: put on shared queue?
                            }
                            else if (StringUtils.isBlank(navigationDocId)) {
                                // No navigation found in nunaliit_custom.js. Look to atlas doc.
                                if (StringUtils.isNotBlank(currentNavigationDocId)) {
                                    docsToWatch.remove(currentNavigationDocId);
                                }

                                currentNavigationDocId = CouchNunaliitConstants.ATLAS_DOC_ID;
                                docsToWatch.add(currentNavigationDocId);
                                //TODO: put on shared queue?
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
