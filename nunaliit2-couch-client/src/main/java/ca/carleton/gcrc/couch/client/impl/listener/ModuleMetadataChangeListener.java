package ca.carleton.gcrc.couch.client.impl.listener;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.exception.NunaliitException;
import org.apache.commons.lang3.tuple.Pair;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Stores module metadata in memory, updates this data if the module is changed in the database.
 */
public final class ModuleMetadataChangeListener extends AbstractCouchDbChangeListener
{
    private static final Logger logger = LoggerFactory.getLogger(ModuleMetadataChangeListener.class);
    private static final Object lockObj = new Object();
    private final CouchDb couchDb;
    private final Set<String> moduleIds;
    private final Map<String, JSONObject> moduleMetadata;

    public ModuleMetadataChangeListener(CouchDb couchDb) throws NunaliitException {
        super(couchDb);

        this.couchDb = couchDb;
        moduleIds = Collections.synchronizedSet(new HashSet<String>());
        moduleMetadata = Collections.synchronizedMap(new HashMap<String, JSONObject>());
    }

    /**
     * Request metadata for the given module Id. If the metadata is not stored in memory, will add the module to watch
     * list and update metadata if it exists. This is how we start tracking new module metadata, only if their
     * metadata is requested.
     *
     * @param moduleId The module to fetch metadata for.
     * @return The contents of "nunaliit_metdata" in the module document.
     */
    public JSONObject findMetadata(String moduleId) {
        JSONObject metadata;

        synchronized (lockObj) {
            // Need to add it
            if (!moduleIds.contains(moduleId)) {
                logger.trace("Module Id not in list to watch, adding and fetching metadata");
                addModuleId(moduleId);
                metadata = updateMetadata(moduleId);
            }
            else {
                logger.trace("Module Id in list, fetching metadata from memory");
                // Get latest in memory
                metadata = moduleMetadata.get(moduleId);
            }
        }

        return metadata;
    }

    @Override
    protected void processDocIdChanged(Pair<String, Type> docChanged) {
        if (moduleIds.contains(docChanged.getKey())) {
            logger.debug("Process document {} change type {}", docChanged.getKey(), docChanged.getValue());
            if (docChanged.getValue().equals(Type.DOC_DELETED)) {
                removeModuleId(docChanged.getKey());
            }
            else {
                updateMetadata(docChanged.getKey());
            }
        }
    }

    /**
     * Finds all module document Ids in the database and adds them to a list of document Ids to watch for changes. Then
     * iterates through these module Ids and loads each of their metadata in memory.
     */
    @Override
    protected void performStartupTasks() {
        findAllModuleIds();
        for (String docId : moduleIds) {
            updateMetadata(docId);
        }
    }

    /**
     * Gets the module document from the database and reads the nunaliit_metadata object into memory, if it exists.
     *
     * @param moduleDocId The module document Id.
     * @return The contents of the nunaliit_metadata object.
     */
    private JSONObject updateMetadata(String moduleDocId) {
        JSONObject doc = null;
        JSONObject metadata = null;
        try {
            if (couchDb.documentExists(moduleDocId)) {
                doc = couchDb.getDocument(moduleDocId);
            }
        }
        catch (Exception e) {
            logger.error("Problem querying database for doc Id {}: {}", moduleDocId, e.getMessage());
        }
        if (doc != null) {
            JSONObject module = doc.optJSONObject("nunaliit_module");
            if (module != null) {
                metadata = module.optJSONObject("nunaliit_metadata");
                if (metadata != null) {
                    moduleMetadata.put(moduleDocId, metadata);
                }
            }
        }

        return metadata;
    }

    /**
     * Only happens once, at startup. Finds all module Ids using the modules view and builds a list of document Ids to
     * watch for changes.
     */
    private void findAllModuleIds() {
        logger.debug("Finding all module Ids to watch for changes");
        try {
            CouchDesignDocument designDoc = couchDb.getDesignDocument("atlas");
            CouchQuery query = new CouchQuery();
            query.setViewName("modules");
            CouchQueryResults results = designDoc.performQuery(query);
            List<JSONObject> rows = results.getRows();
            for (JSONObject row : rows) {
                String docId = row.getString("id");
                synchronized (lockObj) {
                    addModuleId(docId);
                }
            }
        }
        catch (Exception e) {
            logger.error("Problem querying atlas design document view 'modules'", e);
        }
    }

    /**
     * Add a module Id to the list of documents to watch and store metadata.
     *
     * @param moduleId The module document Id.
     */
    private void addModuleId(String moduleId) {
        moduleIds.add(moduleId);
        moduleMetadata.put(moduleId, null);
    }

    /**
     * Remove a module Id to the list of documents to watch and store metadata.
     *
     * @param moduleId The module document Id.
     */
    private void removeModuleId(String moduleId) {
        synchronized (lockObj) {
            moduleIds.remove(moduleId);
            moduleMetadata.remove(moduleId);
        }
    }
}
