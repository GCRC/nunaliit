package ca.carleton.gcrc.couch.command.servlet;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONObject;
import org.jsoup.Jsoup;
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
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Services all requests for /index.html*. Checks if the index.html document has changed in the database (site design doc)
 * by comparing the file hash ('digest' field). If it has changed, downloads and updates a local copy.  If it hasn't,
 * the servlet uses the local copy.  The Schema.org compliant JSON-LD data is injected on every request. Depending on
 * the query string, it will respond with either the atlas metadata, or module specific metadata in a script tag.
 */
public class IndexServlet extends HttpServlet {
    public static final String CONFIG_DOCUMENT_DB = "MetadataServlet_DocumentDatabase";

    private static final Logger logger = LoggerFactory.getLogger(IndexServlet.class);

    /**
     * Regex to parse module document Id from query string.
     */
    private static final Pattern URL_PATTERN = Pattern.compile("module=([^#]+)#?.*");

    /**
     * Hash from DB from last retrieval of index.html document.
     */
    private final AtomicReference<String> currentIndexHtmlHash = new AtomicReference<>();
    /**
     * Current index.html document downloaded from DB. Only updated if the hash changes.
     */
    private final AtomicReference<Document> currentIndexDoc = new AtomicReference<>();
    /**
     * Regex matcher used to find module Id in query string.
     */
    private static Matcher matcher = URL_PATTERN.matcher("");

    private CouchDb couchDb;

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
     * <p>
     * Uses query string to determine whether the request for metadata came from a module page or the base atlas. Responds
     * with corresponding metadata.
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
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

        // Make a copy so we don't alter the cached document.
        Document indexHtml = findIndexHtml().clone();
        if (indexHtml != null) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("text/html");

            if (metadata != null) {
                Element jsonLd = indexHtml.createElement("script");
                jsonLd.attr("type", "application/ld+json");
                jsonLd.text(metadata.toString());

                indexHtml.head().appendChild(jsonLd);
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
     * Finds the index.html document in the site design document. Caches it in memory, and only downloads and updates the
     * variable if it isn't already stored, or if the digest of the attachment has changed.
     *
     * @return The index.html document.
     */
    private Document findIndexHtml() {
        Document indexDoc = currentIndexDoc.get();
        JSONObject siteDesignDoc = null;
        try {
            siteDesignDoc = couchDb.getDocument(CouchNunaliitConstants.SITE_DESIGN_DOC_ID);
        }
        catch (Exception e) {
            logger.error("Problem fetching docId {} from database", CouchNunaliitConstants.SITE_DESIGN_DOC_ID, e);
        }

        if (siteDesignDoc != null) {
            JSONObject attachments = siteDesignDoc.optJSONObject("_attachments");
            if (attachments != null) {
                JSONObject indexHtml = attachments.optJSONObject(CouchNunaliitConstants.INDEX_HTML);
                if (indexHtml != null) {
                    String hash = indexHtml.optString("digest");
                    // Get latest index.html if we don't already have it or digest changed.
                    if (StringUtils.isBlank(currentIndexHtmlHash.get()) || !currentIndexHtmlHash.get().equals(hash)) {
                        logger.debug("Index document changed or not yet stored, getting from database");
                        currentIndexHtmlHash.set(hash);
                        try (ByteArrayOutputStream os = new ByteArrayOutputStream()) {
                            couchDb.downloadAttachment(CouchNunaliitConstants.SITE_DESIGN_DOC_ID, CouchNunaliitConstants.INDEX_HTML, os);
                            InputStream inputStream = new ByteArrayInputStream(os.toByteArray());
                            indexDoc = Jsoup.parse(inputStream, StandardCharsets.UTF_8.toString(), "");
                            currentIndexDoc.set(indexDoc);
                        }
                        catch (Exception e) {
                            logger.error("Could not read {} from database", CouchNunaliitConstants.INDEX_HTML, e);
                        }
                    }
                }
            }
        }

        return indexDoc;
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

