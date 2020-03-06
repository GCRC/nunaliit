package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.impl.listener.AbstractCouchDbChangeListener;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Listens for changes to the atlas document. Builds a list of relative URLs found in the navigation content every time
 * the atlas document changes.
 */
public final class SitemapBuilderAtlasChangeListener extends AbstractCouchDbChangeListener
{
    private static final Logger logger = LoggerFactory.getLogger(SitemapBuilderAtlasChangeListener.class);
    public static final String MODULE = "module";
    public static final String HREF = "href";
    public static final String ITEMS = "items";

    /**
     * The database document Id to watch for changes.
     */
    private final String docIdToWatch;
    private final CouchDb couchDb;
    /**
     * The list of relative URLs found in the navigation document.
     */
    private final List<String> relativeUrls;
    /**
     * Mutex for accessing and modifying the relative URLs list.
     */
    private final Object lockObj = new Object();

    /**
     * Create a sitemap builder that listens for changes to the given atlas document Id.
     *
     * @param couchDb    The CouchDB client to acces the database.
     * @param atlasDocId Atlas document Id to watch for changes.
     * @throws NunaliitException If an exception occurs while registering to the CouchDB change monitor.
     */
    public SitemapBuilderAtlasChangeListener(CouchDb couchDb, String atlasDocId) throws NunaliitException {
        super(couchDb);
        this.couchDb = couchDb;
        this.docIdToWatch = atlasDocId;
        relativeUrls = Collections.synchronizedList(new ArrayList<String>());
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

    @Override
    protected void processDocIdChanged(Pair<String, Type> docChanged) {
        if (docChanged.getKey().equals(docIdToWatch)) {
            logger.debug("Document {} change type {}", docChanged.getKey(), docChanged.getValue());
            if (docChanged.getValue().equals(Type.DOC_UPDATED)) {
                updateSitemap(docChanged.getKey());
            }
            else if (docChanged.getValue().equals(Type.DOC_DELETED)) {
                synchronized (lockObj) {
                    relativeUrls.clear();
                }
            }
        }
    }

    @Override
    protected void performStartupTasks() {
        updateSitemap(docIdToWatch);
    }

    /**
     * @param docId The atlas document identifier.
     */
    protected void updateSitemap(String docId) {
        JSONObject navigation = null;
        JSONObject document = null;
        try {
            if (couchDb.documentExists(docId)) {
                document = couchDb.getDocument(docId);
            }
        }
        catch (Exception e) {
            logger.error("Problem fetching docId '{}' from database", docIdToWatch, e);
        }
        if (document != null && document.has(CouchNunaliitConstants.DOC_KEY_ATLAS)) {
            JSONObject atlasDoc = document.optJSONObject(CouchNunaliitConstants.DOC_KEY_ATLAS);
            navigation = atlasDoc.optJSONObject(CouchNunaliitConstants.DOC_KEY_NAVIGATION);
        }

        if (navigation != null) {
            logger.debug("Regenerating sitemap from atlas document '{}' navigation", docId);
            processNavigation(navigation);
        }
        else {
            logger.warn("Cannot get navigation info from document '{}'", docId);
        }
    }

    /**
     * Processes the navigation document, extracting "href" and "module" properties to build a map of links that should
     * go in the sitemap.
     *
     * @param navigation The navigation document (or subsection of atlas document) in the database.
     */
    private void processNavigation(JSONObject navigation) {
        // A map containing two lists of property values found in the navigation document {"href" -> [..], "module" -> [..]}.
        Map<String, Set<String>> links = new HashMap<>(2);
        Set<String> hrefSet = new HashSet<>();
        Set<String> moduleSet = new HashSet<>();
        links.put(HREF, hrefSet);
        links.put(MODULE, moduleSet);
        if (navigation != null && navigation.has(ITEMS)) {
            recurseOnItems(navigation.getJSONArray(ITEMS), links);
        }
        else {
            logger.debug("Navigation does not have items for sitemap");
        }

        // Now build final set of relative URLs.
        Set<String> tempRelativeUrls = new HashSet<>(links.get(HREF));
        // Add root path, in case it's not linked in navigation menu.
        tempRelativeUrls.add("index.html");
        for (String module : links.get(MODULE)) {
            tempRelativeUrls.add(String.format("index.html?module=%s", module));
        }

        synchronized (lockObj) {
            relativeUrls.clear();
            relativeUrls.addAll(tempRelativeUrls);
        }
    }

    /**
     * Go throw the items array and pull out unique module and href properties. If an item has an items array, recurse.
     * HREF's that start with "http" are omitted, since we use relative URLs in our atlas navigation. The sitemap
     * should not contain external links.
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
                    if (next.has(MODULE) && StringUtils.isNotBlank(next.optString(MODULE))) {
                        links.get(MODULE).add(next.getString(MODULE));
                    }
                    else if (next.has(HREF) && StringUtils.isNotBlank(next.optString(HREF))
                            && !next.optString(HREF).startsWith("http")) {
                        // Remove ./ or / at the beginning of the HREF.
                        String href = next.getString(HREF);
                        if (href.startsWith("./")) {
                            href = href.substring(2);
                        }
                        else if (href.startsWith("/")) {
                            href = href.substring(1);
                        }
                        links.get(HREF).add(href);
                    }
                    // Recurse if this item has sub-items.
                    if (next.has(ITEMS)) {
                        recurseOnItems(next.getJSONArray(ITEMS), links);
                    }
                }
            }
        }
    }
}
