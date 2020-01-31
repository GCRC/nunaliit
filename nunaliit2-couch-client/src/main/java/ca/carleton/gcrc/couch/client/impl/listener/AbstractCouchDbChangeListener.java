package ca.carleton.gcrc.couch.client.impl.listener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeListener;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.tuple.Pair;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Provides an implementation of the {@link CouchDbChangeListener}. Ensures that no work is done in the thread that calls
 * {@link CouchDbChangeListener#change(Type, String, String, JSONObject, JSONObject)} by using a blocking queue
 * to store document Ids received from the {@link CouchDbChangeMonitor} publisher.  Document Ids are taken off this
 * queue in this class' thread, and subclass can do their work in {@link #processDocIdChanged(Pair)}.
 */
public abstract class AbstractCouchDbChangeListener extends Thread implements CouchDbChangeListener {
    private static final Logger logger = LoggerFactory.getLogger(AbstractCouchDbChangeListener.class);
    private static final long IDENTICAL_CHANGE_THRESHOLD_MILLIS = 5000L;
    /**
     * Indicates whether the thread is running.
     */
    private final AtomicBoolean running = new AtomicBoolean(false);
    /**
     * All change doc notifications received through the interface are put here and processed on this thread. Pairs of
     * (docId, changeType).
     */
    private BlockingQueue<Pair<String, Type>> changedDocIdQueue;

    private long lastChangeTime = System.currentTimeMillis();
    private Pair<String, Type> lastChangePair;

    /**
     * Creates a database change listener. Registers to the {@link CouchDbChangeMonitor} and fires events when the
     * change monitor notifies that a document has changed.
     *
     * @param couchDb The CouchDB client to acces the database.
     * @throws NunaliitException If an exception occurs while registering to the CouchDB change monitor.
     */
    public AbstractCouchDbChangeListener(CouchDb couchDb) throws NunaliitException {
        super();
        changedDocIdQueue = new LinkedBlockingQueue<>();
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
        logger.info("Starting DB change listener thread");
        performStartupTasks();

        try {
            while (running.get()) {
                try {
                    Pair<String, Type> docChanged = changedDocIdQueue.take();
                    processDocIdChanged(docChanged);
                }
                catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    logger.warn("DB change listener thread was interrupted. May have failed to complete an operation.");
                }
            }
        }
        finally {
            logger.info("Shutting down DB change listener thread");
        }
    }

    public void shutdown() {
        running.set(false);
    }

    /**
     * {@inheritDoc}
     * Don't want to do any work in this method since it's run in the thread that calls it
     * ({@link ca.carleton.gcrc.couch.client.impl.CouchDbChangeMonitorThread}). So we put the doc Id on a queue and
     * process them in this thread's run method.
     */
    @Override
    public void change(Type type, String docId, String rev, JSONObject rawChange, JSONObject doc) {
        try {
            Pair<String, Type> currentChangePair = Pair.of(docId, type);

            // Watch out for identical events in quick sequence.
            if (lastChangePair != null &&
                    !lastChangePair.equals(currentChangePair) || identicalChangeThresholdExceeded()) {
                lastChangePair = currentChangePair;
                lastChangeTime = System.currentTimeMillis();
                changedDocIdQueue.put(currentChangePair);
            }
            else {
                logger.trace("Skipping change {}:{} because identical changes within {} ms", docId, type, IDENTICAL_CHANGE_THRESHOLD_MILLIS);
            }
        }
        catch (InterruptedException e) {
            logger.warn("Couldn't add document Id {} to changed document queue, due to thread interrupted", docId);
            Thread.currentThread().interrupt();
        }
    }

    /**
     * Checks that current time is at least {@link #IDENTICAL_CHANGE_THRESHOLD_MILLIS} later than the last change time
     * for identical document change. Used to throttle multiple events fired for same document change in quick
     * sequence.
     *
     * @return True if the threshold was exceeded and the change should be processed, otherwise false.
     */
    private boolean identicalChangeThresholdExceeded() {
        long currentTime = System.currentTimeMillis();

        return (currentTime - lastChangeTime) > IDENTICAL_CHANGE_THRESHOLD_MILLIS;
    }

    /**
     * Keep in mind that CREATED events are immediately followed by an UPDATED event for the same docId. Process document
     * Ids wisely.
     *
     * @param docChanged The document Id and change type that occurred.
     */
    protected abstract void processDocIdChanged(Pair<String, Type> docChanged);

    /**
     * Gives subclasses an opportunity to run initialization or one-time startup tasks when the thread starts.
     */
    protected abstract void performStartupTasks();
}
