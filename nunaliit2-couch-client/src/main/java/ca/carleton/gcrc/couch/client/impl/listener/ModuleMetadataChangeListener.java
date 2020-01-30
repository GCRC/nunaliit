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
 * Manages module metadata in memory, updates this data if the module is changed in the database.
 */
public class ModuleMetadataChangeListener extends AbstractCouchDbChangeListener {
    private static final Logger logger = LoggerFactory.getLogger(ModuleMetadataChangeListener.class);
    private static final Object lockObj = new Object();
    private static final String DOC_KEY_LAST_UPDATED = "nunaliit_last_updated";
    private CouchDb couchDb;
    private Set<String> moduleIds;
    private Map<String, Long> lastUpdatedTimes;
    private Map<String, JSONObject> moduleMetadata;

    public ModuleMetadataChangeListener(CouchDb couchDb) throws NunaliitException {
        super(couchDb);

        this.couchDb = couchDb;
        moduleIds = Collections.synchronizedSet(new HashSet<String>());
        lastUpdatedTimes = Collections.synchronizedMap(new HashMap<String, Long>());
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

        // Need to add it
        if (!moduleIds.contains(moduleId)) {
            logger.info("SARAH: module Id not in list, adding");
            addModuleId(moduleId);
            metadata = updateMetadata(moduleId);
        }
        else {
            logger.info("SARAH: module Id in list, fetch from memory");
            // Get latest in memory
            metadata = moduleMetadata.get(moduleId);
        }

        return metadata;
    }

    @Override
    protected void processDocIdChanged(Pair<String, Type> docChanged) {
        if (moduleIds.contains(docChanged.getKey())) {
            logger.info("SARAH: processDocIdChanged: {}", docChanged.getKey());
            if (docChanged.getValue().equals(Type.DOC_DELETED)) {
                removeModuleId(docChanged.getKey());
            }
            else {
                updateMetadata(docChanged.getKey());
            }
        }
    }

    @Override
    protected void performStartupTasks() {
        findAllModuleIds();
        for (String docId : moduleIds) {
            updateMetadata(docId);
        }
    }

    private JSONObject updateMetadata(String docId) {
        JSONObject doc = null;
        JSONObject metadata = null;
        try {
            doc = couchDb.getDocument(docId);
        }
        catch (Exception e) {
            logger.error("Problem querying database for doc Id {}", docId, e);
        }
        if (doc != null) {
            // If the module Id isn't tracked, add it.
            if (!moduleIds.contains(docId)) {
                addModuleId(docId);
            }

            JSONObject lastUpdate = doc.optJSONObject(DOC_KEY_LAST_UPDATED);
            // We update by default, in case nunaliit_last_updated not found.
            long time = System.currentTimeMillis();
            if (lastUpdate != null) {
                lastUpdate.optLong("time", System.currentTimeMillis());
            }

            if (time > lastUpdatedTimes.get(docId)) {
                JSONObject module = doc.optJSONObject("nunaliit_module");
                if (module != null) {
                    metadata = module.optJSONObject("nunaliit_metadata");
                    if (metadata != null) {
                        moduleMetadata.put(docId, metadata);
                    }
                }
            }
        }

        return metadata;
    }

    /**
     * Only happens at startup.
     */
    private void findAllModuleIds() {
        logger.info("SARAH: find all module Ids");
        try {
            CouchDesignDocument designDoc = couchDb.getDesignDocument("atlas");
            CouchQuery query = new CouchQuery();
            query.setViewName("modules");
            CouchQueryResults results = designDoc.performQuery(query);
            List<JSONObject> rows = results.getRows();
            for (JSONObject row : rows) {
                String docId = row.getString("id");
                addModuleId(docId);
            }

//            // Now cleanup last updated time hashmap.
//            for (String docId : moduleIds) {
//                if (!lastUpdatedTimes.containsKey(docId)) {
//                    lastUpdatedTimes.put(docId, System.currentTimeMillis());
//                }
//            }
//            // Check if any need to be removed.
//            if (moduleIds.size() != lastUpdatedTimes.size()) {
//                for (String docId : lastUpdatedTimes.keySet()) {
//                    if (!moduleIds.contains(docId)) {
//                        lastUpdatedTimes.remove(docId);
//                    }
//                }
//            }
        }
        catch (Exception e) {
            logger.error("Problem querying atlas design document view 'modules'", e);
        }
    }

    private void addModuleId(String moduleId) {
        synchronized (lockObj) {
            moduleIds.add(moduleId);
            lastUpdatedTimes.put(moduleId, 0L);
            moduleMetadata.put(moduleId, null);
        }
    }

    private void removeModuleId(String moduleId) {
        synchronized (lockObj) {
            moduleIds.remove(moduleId);
            lastUpdatedTimes.remove(moduleId);
            moduleMetadata.remove(moduleId);
        }
    }
}
