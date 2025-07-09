package ca.carleton.gcrc.endpoint;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.graalvm.polyglot.Context;
import org.graalvm.polyglot.HostAccess;
import org.graalvm.polyglot.PolyglotException;
import org.graalvm.polyglot.Value;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class EndpointServlet extends HttpServlet {

	public static final String ENDPOINT_CONFIG_ATTRIBUTE_ATLAS = "EndpointServlet_AtlasName";
	public static final String ENDPOINT_CONFIG_ATTRIBUTE_ATLAS_DESIGN = "EndpointServlet_AtlasDesign";
	public static final String ENDPOINT_CONFIG_ATTRIBUTE_SITE_DESIGN = "EndpointServlet_SiteDesign";
	public static final String ENDPOINT_CONFIG_ATTRIBUTE_DOCUMENT_DESIGN = "EndpointServlet_DocumentDesign";

	private static final Logger logger = LoggerFactory.getLogger(EndpointServlet.class);

	private final static String SERVLET_PREFIX = "endpoint";

	private final static String CONTEXT_LANG = "js";
	private final static String JS_PREFIX = "let docs = Java.from(source);";
	private final static String JS_POSTFIX = "docs;";

	private final static String QUERY_PARAMETER_SCHEMA = "schema";
	private final static String QUERY_PARAMETER_LAYER = "layer";
	private final static String QUERY_PARAMETER_SITE_VIEW = "siteView";
	private final static String QUERY_PARAMETER_TRANSFORM = "transform";

	private final static String NUNALIIT_SCHEMA_VIEW = "nunaliit-schema";
	private final static String NUNALIIT_LAYER_VIEW = "layers";

	private String atlasName = "";
	private CouchDesignDocument atlasDesign = null;
	private CouchDesignDocument siteDesign = null;
	private CouchDesignDocument documentDesign = null;
	private CouchDb documentDb = null;

	private final String[] emptyDefault = new String[0];

	public EndpointServlet() {
	}

	@Override
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		ServletContext context = config.getServletContext();

		Object atlasNameObj = context.getAttribute(ENDPOINT_CONFIG_ATTRIBUTE_ATLAS);
		Object atlasDesignObj = context.getAttribute(ENDPOINT_CONFIG_ATTRIBUTE_ATLAS_DESIGN);
		Object siteDesignObj = context.getAttribute(ENDPOINT_CONFIG_ATTRIBUTE_SITE_DESIGN);
		Object documentDesignObj = context.getAttribute(ENDPOINT_CONFIG_ATTRIBUTE_DOCUMENT_DESIGN);

		if (null == atlasNameObj) {
			logger.error("Missing atlas name");
			throw new ServletException("Missing atlas name");
		} else if (atlasNameObj instanceof String) {
			atlasName = (String) atlasNameObj;
		} else {
			throw new ServletException("Unexpected object type for atlasName: " + atlasNameObj.getClass().getName());
		}

		if (null == atlasDesignObj) {
			logger.error("Missing atlas design document");
			throw new ServletException("Missing atlas design document");
		} else if (atlasDesignObj instanceof CouchDesignDocument) {
			atlasDesign = (CouchDesignDocument) atlasDesignObj;
		} else {
			throw new ServletException(
					"Unexpected object type for atlasDesign: " + atlasDesignObj.getClass().getName());
		}

		if (null == siteDesignObj) {
			logger.error("Missing site design document");
			throw new ServletException("Missing site design document");
		} else if (siteDesignObj instanceof CouchDesignDocument) {
			siteDesign = (CouchDesignDocument) siteDesignObj;
		} else {
			throw new ServletException("Unexpected object type for siteDesign: " + siteDesignObj.getClass().getName());
		}

		if (null == documentDesignObj) {
			logger.error("Missing document design document");
			throw new ServletException("Missing document design document");
		} else if (documentDesignObj instanceof CouchDesignDocument) {
			documentDesign = (CouchDesignDocument) documentDesignObj;
			documentDb = documentDesign.getDatabase();
		} else {
			throw new ServletException(
					"Unexpected object type for documentDesign: " + documentDesignObj.getClass().getName());
		}
	}

	@Override
	public void destroy() {
		super.destroy();
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		String[] paths = request.getRequestURI().split("/");
		String path = paths[paths.length - 1];
		if (path.equals(SERVLET_PREFIX)) {
			Map<String, String[]> queryParameters = request.getParameterMap();

			String[] schemas = queryParameters.getOrDefault(QUERY_PARAMETER_SCHEMA, emptyDefault);
			String[] layers = queryParameters.getOrDefault(QUERY_PARAMETER_LAYER, emptyDefault);
			// String[] siteViews = queryParameters.getOrDefault(QUERY_PARAMETER_SITE_VIEW, emptyDefault);
			String[] transformScript = queryParameters.getOrDefault(QUERY_PARAMETER_TRANSFORM, emptyDefault);

			JSONObject obj = new JSONObject();

			if (schemas.length < 1 && layers.length < 1) {
				obj.put("message", "At least one schema or layer must be specified");
				this.prepareResponse(response, HttpServletResponse.SC_BAD_REQUEST);
			} else if (transformScript.length != 1) {
				obj.put("message", "Exactly one transform script must be specified");
				this.prepareResponse(response, HttpServletResponse.SC_BAD_REQUEST);
			} else if (transformScript[0].isBlank()) {
				obj.put("message", "The name of a transform script must be specified");
				this.prepareResponse(response, HttpServletResponse.SC_BAD_REQUEST);
			} else {

				List<JSONObject> results = new ArrayList<>();
				String scriptName = transformScript[0];
				String fullExpectedScriptName = CONTEXT_LANG + "." + scriptName;
				JSONObject scriptDoc = null;

				try {
					scriptDoc = documentDb.getDocument(fullExpectedScriptName);
				} catch (Exception e) {
					logger.debug("Could not find document " + fullExpectedScriptName);
					obj.put("message", "Failed to find document '" + fullExpectedScriptName + "'");
					this.prepareResponse(response, HttpServletResponse.SC_NOT_FOUND);
				}

				if (scriptDoc != null) {
					boolean querySuccess = true;
					try {
						for (String schema : schemas) {
							this.getDocuments(results, NUNALIIT_SCHEMA_VIEW, schema, schema, atlasDesign);
						}
						for (String layer : layers) {
							this.getDocuments(results, NUNALIIT_LAYER_VIEW, layer, layer, atlasDesign);
						}
					} catch (Exception e) {
						querySuccess = false;
						obj.put("message", "Failed to query view: " + e.getMessage());
						this.prepareResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
					}

					if (querySuccess == true) {
						try {
							List<Map<String, Object>> output = this.applyScript(results, scriptDoc);
							JSONObject[] convertedArray = output.stream()
									.map((JSONObject::new))
									.toArray(JSONObject[]::new);
							JSONArray jsonOutputArray = new JSONArray(convertedArray);
							obj.put("data", jsonOutputArray);
							this.prepareResponse(response, HttpServletResponse.SC_OK);
						} catch (PolyglotException e) {
							obj.put("message", "Error while applying transformation script: " + e.getMessage());
							this.prepareResponse(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
						}
					}
				}
			}

			try {
				OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(), "UTF-8");
				obj.write(osw);
				osw.flush();
			} catch (UnsupportedEncodingException e) {
				logger.warn("Endpoint servlet unsupported encoding exception: " + e.getMessage());
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
						"Unsupported encoding when trying to write");
			} catch (IOException e) {
				logger.warn("Endpoint servlet IOException: " + e.getMessage());
				response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "IO exception when trying to write");
			}

		} else {
			response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Requests must be sent to /endpoint");
		}
	}

	private List<Map<String, Object>> applyScript(List<JSONObject> docs, JSONObject script) throws PolyglotException {
		Context context = Context.newBuilder(CONTEXT_LANG)
				.allowHostAccess(HostAccess.ALL)
				.allowHostClassLookup(s -> true)
				.build();

		List<Map<String, Object>> scriptInputData = new ArrayList<>();
		for (int i = 0; i < docs.size(); i++) {
			scriptInputData.add(docs.get(i).toMap());
		}

		context.getBindings(CONTEXT_LANG).putMember("source", scriptInputData);

		Value result = null;
		try {
			result = context.eval(CONTEXT_LANG, JS_PREFIX + script.getString("contents") + JS_POSTFIX);
		} catch (PolyglotException pge) {
			throw pge;
		}
		return result.as(List.class);
	}

	private void getDocuments(List<JSONObject> results, String viewName, String startKey, String endKey,
			CouchDesignDocument design) throws Exception {
		CouchQuery query = new CouchQuery();
		query.setViewName(viewName);
		query.setReduce(false);
		query.setStartKey(startKey);
		query.setEndKey(endKey);
		try {
			query.setIncludeDocs(true);
		} catch (Exception e) {
			logger.warn("Failed to set include docs on query: " + e.getMessage());
			throw new Exception("Failed to set include_docs on query");
		}
		CouchQueryResults queryRes = null;
		try {
			queryRes = design.performQuery(query);
		} catch (Exception e) {
			logger.warn("Failed query: " + e.getMessage());
			throw new Exception("Failed query");
		}
		if (null == queryRes) {
			logger.warn("Query response null");
			throw new Exception("Null query");
		} else {
			for (JSONObject row : queryRes.getRows()) {
				JSONObject value = row.getJSONObject("doc");
				results.add(value);
			}
		}
	}

	private void prepareResponse(HttpServletResponse response, int statusCode) {
		response.setStatus(statusCode);
		response.setCharacterEncoding("utf-8");
		response.setContentType("application/json");
		response.setHeader("Cache-Control", "must-revalidate,no-cache,no-store");
		response.setDateHeader("Expires", (new Date()).getTime());
	}
}
