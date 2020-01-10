package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serves Schema.org compliant JSON-LD data to crawlers. Depending on the referrer, it will respond with either the
 * atlas metadata, or module specific metadata.
 */
public class MetadataServlet extends HttpServlet {
    public static final String CONFIG_DOCUMENT_DB = "MetadataServlet_DocumentDatabase";

    private static final Logger logger = LoggerFactory.getLogger(MetadataServlet.class);
    private static final String REFERRER = "Referer";
    /**
     * Regex to parse module document Id from URL.
     */
    private static final Pattern URL_PATTERN = Pattern.compile("https?://.+\\?module=([^#]+)#?.*");

    private CouchDb couchDb;
    private Matcher matcher;

    public MetadataServlet() {
        matcher = URL_PATTERN.matcher("");
    }

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        logger.info("Initialization started");

        ServletContext context = config.getServletContext();

        Object obj = context.getAttribute(CONFIG_DOCUMENT_DB);
        if (obj == null) {
            logger.error(String.format("Document database is not specified (%s)", CONFIG_DOCUMENT_DB));
            throw new ServletException(String.format("Document database is not specified (%s)", CONFIG_DOCUMENT_DB));
        }
        else if (obj instanceof CouchDb) {
            couchDb = (CouchDb) obj;
        }
        else {
            throw new ServletException("Unexpected object type for document database: " + obj.getClass().getName());
        }

        logger.info("Initialization finished");
    }

    /**
     * {@inheritDoc}
     *
     * Uses referrer to determine whether the request for metadata came from a module page or the base atlas. Reponds
     * with corresponding metadata.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) {
        JSONObject metadata = null;

        // If no referrer found, this servlet path was typed in manually. No really a valid case so we return 204.
        String referrer = request.getHeader(REFERRER);
        logger.debug(String.format("Received request with referrer %s", referrer));
        if (StringUtils.isNotBlank(referrer)) {
            String moduleDocId = findModuleDocId(referrer);
            if (StringUtils.isNotBlank(moduleDocId)) {
                logger.debug(String.format("Found module %s in URL", moduleDocId));
                try {
                    metadata = findModuleMetadata(moduleDocId);
                }
                catch (Exception e) {
                    logger.error("Problem accessing module {} metadata: {}", moduleDocId, e.getMessage());
                }
            }
            else {
                logger.debug("Referrer did not contain module Id, outputting atlas metadata.");
                try {
                    metadata = findAtlasMetadata();
                }
                catch (Exception e) {
                    logger.info("Failed to access atlas metadata. May not exist.");
                }
            }
        }

        if (metadata != null) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("application/ld+json");
            try {
                OutputStreamWriter outputStreamWriter = new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8);
                metadata.write(outputStreamWriter);
                outputStreamWriter.flush();
            }
            catch (IOException ioe) {
                logger.error("Problem writing to response output stream {}", ioe.getMessage());
            }
        }
        else {
            logger.debug("No metadata found, returning {}", HttpServletResponse.SC_NO_CONTENT);
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
        }
    }

    @Override
    public void destroy() {
        super.destroy();
        logger.info("Destroyed");
    }

    /**
     * Finds the metadata document associated with the module document Id.
     *
     * @param moduleDocId Module document Id to find metdata for.
     * @return The JSON-LD document representing the metadata.
     * @throws Exception If the database returns an error on querying the view.
     */
    private JSONObject findModuleMetadata(String moduleDocId) throws Exception {
        JSONObject moduleMetadata = null;
        CouchDesignDocument metadataDesignDocument = couchDb.getDesignDocument("atlas");
        CouchQuery query = new CouchQuery();
        // View returns {id=metadata-doc-id, value=metadata-doc-id, key=module-id}
        query.setViewName("metadata-module-link");
        CouchQueryResults results = null;
        try {
            results = metadataDesignDocument.performQuery(query);
        }
        catch (Exception e) {
            logger.warn("Error accessing module metadata: {}", e.getMessage());
        }

        if (results != null) {
            // Find metadata for given module.
            for (JSONObject row : results.getRows()) {
                if (row.has("value") && moduleDocId.equals(row.get("value"))) {
                    String metadataDocId = row.getString("id");
                    if (StringUtils.isNotBlank(metadataDocId)) {
                        JSONObject doc = couchDb.getDocument(metadataDocId);
                        // The nunaliit_metadata contains the JSON-LD document to publish.
                        moduleMetadata = doc.getJSONObject("nunaliit_metadata");
                    }
                }
            }
        }

        return moduleMetadata;
    }

    /**
     * Finds the atlas metadata document in the database. The atlas metadata document is identified by the fact that it
     * is the only metadata document without a reference to a module.
     *
     * @return The JSON-LD document representing the metadata.
     * @throws Exception If the database returns an error on querying the view.
     */
    private JSONObject findAtlasMetadata() throws Exception {
        JSONObject atlasMetadata = null;
        CouchDesignDocument metadataDesignDocument = couchDb.getDesignDocument("atlas");
        CouchQuery query = new CouchQuery();
        query.setViewName("metadata-atlas");
        CouchQueryResults results = null;
        try {
            results = metadataDesignDocument.performQuery(query);
        }
        catch (Exception e) {
            logger.warn("Error accessing atlas metadata: {}", e.getMessage());
        }

        if (results != null) {
            // Only expecting one document.
            String docId = results.getRows().get(0).optString("id");
            if (docId != null && !docId.isEmpty()) {
                JSONObject doc = couchDb.getDocument(docId);
                // The nunaliit_metadata contains the JSON-LD document to publish.
                atlasMetadata = doc.getJSONObject("nunaliit_metadata");
            }
        }

        return atlasMetadata;
    }

    /**
     * Looks for the module document Id in the given URL.
     * <p>
     * Examples:<br/>
     * <code>
     * http://localhost:8081/index.html?module=module.test3_canvas finds 'module.test3_canvas'<br/>
     * https://clyderiveratlas.ca/index.html?module=module.sleepyriver.boundaries#eyJ0ImZmFiMiIsInMiOjE1NzY2OTc5Nzc5MDZ9
     * finds 'module.sleepyriver.boundaries'<br/>
     * https://sleepyriveratlas.ca/index.html does not find a module and returns null;
     * </code>
     *
     * @param url The URL to find the module identifier.
     * @return The module document Id if it was found in the URL, otherwise null.
     */
    protected String findModuleDocId(String url) {
        String docId = null;

        matcher.reset(url);
        if (matcher.matches()) {
            docId = matcher.group(1);
        }

        return docId;
    }
}
