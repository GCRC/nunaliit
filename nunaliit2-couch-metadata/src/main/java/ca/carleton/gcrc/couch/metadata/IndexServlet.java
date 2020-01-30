package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.client.impl.listener.HtmlAttachmentChangeListener;
import ca.carleton.gcrc.couch.client.impl.listener.ModuleMetadataChangeListener;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.OutputStream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Services all requests for /index.html*. Checks if the index.html document has changed in the database (site design doc)
 * by comparing the file hash ('digest' field). If it has changed, downloads and updates a local copy.  If it hasn't,
 * the servlet uses the local copy.  The Schema.org compliant JSON-LD data is injected on every request. Depending on
 * the query string, it will respond with either the atlas metadata, or module specific metadata in a script tag.
 */
public class IndexServlet extends HttpServlet {
    public static final String CONFIG_DOCUMENT_DB = "IndexServlet_DocumentDatabase";
    public static final String INDEX_DB_CHANGE_LISTENER = "IndexServlet_IndexDbChangeListener";
    public static final String MODULE_METADATA_CHANGE_LISTENER = "IndexServlet_ModuleMetadataChangeListener";

    private static final Logger logger = LoggerFactory.getLogger(IndexServlet.class);

    /**
     * Regex to parse module document Id from query string.
     */
    private static final Pattern URL_PATTERN = Pattern.compile("module=([^#]+)#?.*");

    /**
     * Regex matcher used to find module Id in query string.
     */
    private static Matcher matcher = URL_PATTERN.matcher("");

    private CouchDb couchDb;
    private HtmlAttachmentChangeListener indexDbChangeListener;
    private ModuleMetadataChangeListener moduleMetadataChangeListener;

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

        Object dbListener = context.getAttribute(INDEX_DB_CHANGE_LISTENER);
        if (dbListener == null) {
            logger.error(String.format("Index DB change listener is not specified (%s)", INDEX_DB_CHANGE_LISTENER));
            throw new ServletException(String.format("Index DB change listener is not specified (%s)", INDEX_DB_CHANGE_LISTENER));
        }
        else if (dbListener instanceof HtmlAttachmentChangeListener) {
            indexDbChangeListener = (HtmlAttachmentChangeListener) dbListener;
        }
        else {
            throw new ServletException("Unexpected object type for index DB change listener: " + dbListener.getClass().getName());
        }

        Object metadataListener = context.getAttribute(MODULE_METADATA_CHANGE_LISTENER);
        if (metadataListener == null) {
            logger.error(String.format("Module metadata change listener is not specified (%s)", MODULE_METADATA_CHANGE_LISTENER));
            throw new ServletException(String.format("Module metadata change listener is not specified (%s)", MODULE_METADATA_CHANGE_LISTENER));
        }
        else if (metadataListener instanceof ModuleMetadataChangeListener) {
            moduleMetadataChangeListener = (ModuleMetadataChangeListener) metadataListener;
        }
        else {
            throw new ServletException("Unexpected object type for module metadata change listener: " + metadataListener.getClass().getName());
        }

        logger.info("Initialization finished");
    }

    /**
     * {@inheritDoc}
     * <p>
     * Uses query string to determine whether the request for metadata came from a module page or the base atlas. Responds
     * with corresponding metadata.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) {
        JSONObject metadata = null;

        String queryString = request.getQueryString();

        logger.debug(String.format("Received request with query string %s", queryString));
        if (StringUtils.isNotBlank(queryString)) {
            String moduleDocId = findModuleDocId(queryString);
            if (StringUtils.isNotBlank(moduleDocId)) {
                logger.debug(String.format("Found module %s in query string", moduleDocId));
                try {
                    metadata = findModuleMetadata(moduleDocId);
                }
                catch (Exception e) {
                    logger.error("Problem accessing module {} metadata: {}", moduleDocId, e.getMessage());
                }
            }
            else {
                logger.debug("Could not find module in query string: {}", queryString);
            }
        }
        else {
            logger.debug("Query string did not contain module Id, outputting atlas metadata.");
            try {
                metadata = findAtlasMetadata();
            }
            catch (Exception e) {
                logger.info("Failed to access atlas metadata. May not exist.");
            }
        }

        // Clone the HTML document so we don't modify shared copy.
        Document indexHtml = indexDbChangeListener.getAttachment().clone();
        if (indexHtml != null) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("text/html");

            if (metadata != null) {
                Element jsonLd = indexHtml.createElement("script");
                jsonLd.attr("type", "application/ld+json");
                jsonLd.text(metadata.toString());

                indexHtml.head().appendChild(jsonLd);
            }
            else {
                logger.debug("No metadata found for publishing");
            }

            try {
                OutputStream os = response.getOutputStream();
                os.write(indexHtml.html().getBytes());
            }
            catch (Exception e) {
                logger.error("Problem outputting index.html", e);
            }
        }
        else {
            logger.error("No index.html found, returning {}", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void destroy() {
        super.destroy();
        logger.info("Destroyed");
    }

    /**
     * Finds the metadata object associated with the module document.
     *
     * @param moduleDocId Module document Id to find metdata for.
     * @return The JSON-LD document representing the metadata.
     * @throws Exception If the database returns an error on querying the view.
     */
    private JSONObject findModuleMetadata(String moduleDocId) throws Exception {

        return moduleMetadataChangeListener.findMetadata(moduleDocId);
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
        CouchDesignDocument atlasDesignDocument = couchDb.getDesignDocument("atlas");
        CouchQuery query = new CouchQuery();
        query.setViewName("atlas");
        CouchQueryResults results = null;
        try {
            results = atlasDesignDocument.performQuery(query);
        }
        catch (Exception e) {
            logger.warn("Error accessing atlas metadata: {}", e.getMessage());
        }

        if (results != null) {
            // Only expecting one document.
            String docId = results.getRows().get(0).optString("id");
            if (docId != null && !docId.isEmpty()) {
                JSONObject doc = couchDb.getDocument(docId);
                JSONObject atlas = doc.optJSONObject("nunaliit_atlas");
                if (atlas != null) {
                    // The nunaliit_metadata contains the JSON-LD document to publish.
                    atlasMetadata = atlas.getJSONObject("nunaliit_metadata");
                }
            }
        }

        return atlasMetadata;
    }

    /**
     * Looks for the module document Id in the given query string.
     * <p>
     * Examples:<br/>
     * <code>
     * ?module=module.test3_canvas finds 'module.test3_canvas'<br/>
     * ?module=module.sleepyriver.boundaries#eyJ0ImZmFiMiIsInMiOjE1NzY2OTc5Nzc5MDZ9
     * finds 'module.sleepyriver.boundaries'<br/>
     * "" does not find a module and returns null;
     * </code>
     *
     * @param queryString The URL to find the module identifier.
     * @return The module document Id if it was found in the URL, otherwise null.
     */
    protected String findModuleDocId(String queryString) {
        String docId = null;

        if (StringUtils.isNotBlank(queryString)) {
            matcher.reset(queryString);
            if (matcher.matches()) {
                docId = matcher.group(1);
            }
        }

        return docId;
    }
}

