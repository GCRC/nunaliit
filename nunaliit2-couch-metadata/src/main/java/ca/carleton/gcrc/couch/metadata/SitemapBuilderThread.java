package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
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
    private BlockingQueue<String> sharedNavigationDocIdQueue;
    /**
     * The list of relative URLs found in the navigation document.
     */
    private List<String> relativeUrls;
    /**
     * Mutex for accessing and modifying the relative URLs list.
     */
    private final Object lockObj = new Object();

    public SitemapBuilderThread(CouchDb couchDb, BlockingQueue<String> sharedNavigationDocIdQueue) {
        this.couchDb = couchDb;
        this.sharedNavigationDocIdQueue = sharedNavigationDocIdQueue;
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
                    String navigationDocId = sharedNavigationDocIdQueue.take();
                    processNavigationDoc(navigationDocId);
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
     * Processes the navigation document, extracting "href" and "module" properties to build a map of links that should
     * go in the sitemap.
     *
     * @param navigationDocId The navigation document Id in the database.
     * @return A map containing two lists of property values found in the navigation document
     * {"href" -> [..], "module" -> [..]}.
     */
    protected Map<String, Set<String>> processNavigationDoc(String navigationDocId) {
        logger.debug("Processing the navigation document to build the sitemap");

        Map<String, Set<String>> links = new HashMap<>(2);
        Set<String> hrefSet = new HashSet<>();
        Set<String> moduleSet = new HashSet<>();
        links.put("href", hrefSet);
        links.put("module", moduleSet);
        if (StringUtils.isNotBlank(navigationDocId)) {
            try {
                if (couchDb.documentExists(navigationDocId)) {
                    JSONObject navDoc = couchDb.getDocument(navigationDocId);
                    JSONObject navigation = navDoc.optJSONObject("nunaliit_navigation");
                    if (navigation != null) {
                        recurseOnItems(navigation.getJSONArray("items"), links);
                    }
                }
            }
            catch (Exception e) {
                logger.error("Could not access navigation document {} from database: {}", navigationDocId, e.getMessage());
            }
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

        return links;
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
