package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Worker thread that processes the navigation document for links to use in the sitemap. Builds a list of relative
 * URLs that could be used in the sitemap.
 */
public class SitemapBuilderThread extends Thread {
    private static final Logger logger = LoggerFactory.getLogger(SitemapBuilderThread.class);
    /**
     * Indicates whether this thread is running.
     */
    private final AtomicBoolean running = new AtomicBoolean(false);
    private CouchDb couchDb;
    /**
     * Shared queue used to task this thread with work.
     */
    private BlockingQueue<String> sharedDocIdQueue;
    /**
     * The list of relative URLs found in the navigation document.
     */
    private List<String> relativeUrls;
    /**
     * Mutex for accessing and modifying the relative URLs list.
     */
    private final Object lockObj = new Object();

    public SitemapBuilderThread(CouchDb couchDb, BlockingQueue<String> sharedDocIdQueue) {
        this.couchDb = couchDb;
        this.sharedDocIdQueue = sharedDocIdQueue;
        relativeUrls = new ArrayList<>();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Pulls navigation document Ids off the shared queue to process for building the list of sitemap links.
     */
    @Override
    public void run() {
        running.set(true);
        logger.info("Starting sitemap builder thread");

        try {
            while (running.get()) {
                try {
                    String docId = sharedDocIdQueue.take();
                    processDocId(docId);
                }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.warn("Sitemap builder thread was interrupted. May have failed to complete an operation.");
                }
            }
        }
        finally {
            logger.info("Shutting down sitemap builder thread");
        }
    }

    /**
     * Attempts to gracefully shutdown this thread.
     */
    public void terminate() {
        running.set(false);
    }

    /**
     * Returns list of relative URLs to use in the sitemap.
     *
     * @return The list of relative URLs.
     */
    protected List<String> getRelativeUrls() {
        List<String> urls = new ArrayList<>(relativeUrls.size());
        synchronized (lockObj) {
            urls.addAll(relativeUrls);
        }

        return urls;
    }

    /**
     * Document will either be a navigation document or the atlas document. Handles accordingly by checking the
     * schema associated with the document.
     *
     * @param docId The docId to find nunaliit_navigation within. Can be of schema type 'navigation' or 'atlas'.
     */
    protected void processDocId(String docId) {
        if (StringUtils.isNotBlank(docId)) {
            try {
                if (couchDb.documentExists(docId)) {
                    JSONObject document = couchDb.getDocument(docId);
                    JSONObject navigation = null;
                    String schemaName = document.optString(CouchNunaliitConstants.DOC_KEY_SCHEMA, null);
                    if (StringUtils.isNotBlank(schemaName)) {
                        if (schemaName.equals("atlas") && document.has(CouchNunaliitConstants.DOC_KEY_ATLAS)) {
                            JSONObject atlasDoc = document.optJSONObject(CouchNunaliitConstants.DOC_KEY_ATLAS);
                            navigation = atlasDoc.optJSONObject(CouchNunaliitConstants.DOC_KEY_NAVIGATION);
                            if (navigation != null) {
                                logger.info("Using atlas document ({}) to generate sitemap", docId);
                            }
                        }
                        else if (schemaName.equals("navigation")) {
                            navigation = document.optJSONObject(CouchNunaliitConstants.DOC_KEY_NAVIGATION);
                            if (navigation != null) {
                                logger.info("Using navigation document ({}) to generate sitemap", docId);
                            }
                        }
                        else {
                            logger.warn("Cannot get navigation from document '{}' with unsupported schema '{}'", docId, schemaName);
                        }
                    }
                    else {
                        logger.warn("Document '{}' does not have nunaliit_schema, cannot process for navigation", docId);
                    }

                    if (navigation != null) {
                        processNavigationDoc(navigation);
                    }
                }
            }
            catch (Exception e) {
                logger.error("Could not access navigation document {} from database: {}", docId, e.getMessage());
            }
        }
    }

    /**
     * Processes the navigation document, extracting "href" and "module" properties to build a map of links that should
     * go in the sitemap.
     *
     * @param navigation The navigation document (or subsection of atlas document) in the database.
     */
    private void processNavigationDoc(JSONObject navigation) {
        logger.debug("Processing the navigation document to build the sitemap");

        // A map containing two lists of property values found in the navigation document {"href" -> [..], "module" -> [..]}.
        Map<String, Set<String>> links = new HashMap<>(2);
        Set<String> hrefSet = new HashSet<>();
        Set<String> moduleSet = new HashSet<>();
        links.put("href", hrefSet);
        links.put("module", moduleSet);
        if (navigation != null) {
            recurseOnItems(navigation.getJSONArray("items"), links);
        }
        else {
            logger.warn("Navigation JSON object was null, cannot build sitemap");
        }

        // Now build final set of relative URLs.
        Set<String> tempRelativeUrls = new HashSet<>(links.get("href"));
        // Add root path, in case it's not linked in navigation menu.
        tempRelativeUrls.add("./index.html");
        for (String module : links.get("module")) {
            tempRelativeUrls.add(String.format("./index.html?module=%s", module));
        }

        synchronized (lockObj) {
            relativeUrls.clear();
            relativeUrls.addAll(tempRelativeUrls);
        }
    }

    /**
     * Go throw the items array and pull out unique module and href properties. If an item has an items array, recurse.
     *
     * @param items The array of links, possibly containing items arrays.
     * @param links A hashmap to add href and module properties to. Keys are "href" and "module". Passed recursively.
     */
    private void recurseOnItems(JSONArray items, Map<String, Set<String>> links) {
        if (items != null && !items.isEmpty()) {
            JSONObject next;
            for (Object obj : items) {
                if (obj instanceof JSONObject) {
                    next = (JSONObject) obj;
                    if (next.has("module") && StringUtils.isNotBlank(next.optString("module"))) {
                        links.get("module").add(next.getString("module"));
                    }
                    else if (next.has("href") && StringUtils.isNotBlank(next.optString("href"))) {
                        links.get("href").add(next.getString("href"));
                    }
                    // Recurse if this item has sub-items.
                    if (next.has("items")) {
                        recurseOnItems(next.getJSONArray("items"), links);
                    }
                }
            }
        }
    }
}
