package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.exception.NunaliitException;

import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

/**
 * Manages two threads that are responsible for a couple of tasks:
 * - Watching the database for changes to relevant documents that would affect sitemap links;
 * - Processing the navigation document to build a list of relative URLs to be used in the sitemap.
 * <p>
 * On startup, the sitemap URL list is generated and ready for any requests to serve sitemap.xml.
 * <p>
 * Worker threads are started using {@link #start()}. Be sure to call {@link #shutdown()} to stop and cleanup those threads.
 * To access the latest relative URLs applicable to sitemap, use {@link #getRelativeUrls()}
 */
public class SitemapBuilder {
    /**
     * A queue shared between the DB change listener and sitemap builder. The DB change listener puts the navigation doc
     * Id on this queue when it detects a change. The builder thread pulls of the queue and processes the navigation
     * document for sitemap links.
     */
    private BlockingQueue<String> navigationDocIdQueue;
    /**
     * Database access, required by worker threads.
     */
    private CouchDb couchDb;
    /**
     * Listens for relevant changes to the database.
     */
    private SitemapDbChangeListener dbChangeListener;
    /**
     * Builds a list of relative links for the sitemap by parsing the navigation document.
     */
    private SitemapBuilderThread sitemapBuilderThread;

    public SitemapBuilder(CouchDb couchDb) {
        this.couchDb = couchDb;
        navigationDocIdQueue = new LinkedBlockingQueue<>();
    }

    public void start() throws NunaliitException {
        dbChangeListener = new SitemapDbChangeListener(couchDb, navigationDocIdQueue);
        sitemapBuilderThread = new SitemapBuilderThread(couchDb, navigationDocIdQueue);
        sitemapBuilderThread.start();
        dbChangeListener.start();
    }

    public void shutdown() {
        dbChangeListener.shutdown();
        sitemapBuilderThread.terminate();
    }

    /**
     * Returns a list of unique relative URLs for use in the sitemap.
     *
     * @return A unique list of relative URLs for use in the sitemap.
     */
    public List<String> getRelativeUrls() {
        return sitemapBuilderThread.getRelativeUrls();
    }
}
