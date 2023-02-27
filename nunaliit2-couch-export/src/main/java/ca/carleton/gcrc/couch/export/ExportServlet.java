package ca.carleton.gcrc.couch.export;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.Date;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.fileupload.FileItemIterator;
import org.apache.commons.fileupload.FileItemStream;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.commons.fileupload.util.Streams;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.export.ExportUtils.Filter;
import ca.carleton.gcrc.couch.export.ExportUtils.Format;
import ca.carleton.gcrc.couch.export.ExportUtils.Method;
import ca.carleton.gcrc.couch.export.impl.DocumentFilterGeometryType;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalFiltered;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalId;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalLayer;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalSchema;
import ca.carleton.gcrc.couch.export.impl.ExportFormatCSV;
import ca.carleton.gcrc.couch.export.impl.ExportFormatGeoJson;
import ca.carleton.gcrc.couch.export.impl.SchemaCacheCouchDb;
import ca.carleton.gcrc.couch.export.records.ExportRecordsCSV;
import ca.carleton.gcrc.couch.export.records.ExportRecordsGeoJson;
import ca.carleton.gcrc.couch.export.records.JSONArrayReaderIterator;
import ca.carleton.gcrc.json.servlet.JsonServlet;

/**
 * temp imports start
 */
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.utils.NunaliitDocument;
import ca.carleton.gcrc.couch.export.SchemaExportInfo;
import ca.carleton.gcrc.couch.export.SchemaExportProperty;
 /**
  * temp imports end
  */

import org.apache.jena.rdf.model.Resource;
import org.apache.jena.rdf.model.Property;
import org.apache.jena.rdf.model.Model;
import org.apache.jena.rdf.model.ModelFactory;
import org.apache.jena.vocabulary.RDF;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.riot.Lang;

@SuppressWarnings("serial")
public class ExportServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	public static final String ConfigAttributeName_AtlasName = "ExportServlet_AtlasName";

	private ExportConfiguration configuration;
	private String atlasName = null;
	
	public ExportServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		ServletContext context = config.getServletContext();
		
		Object obj = context.getAttribute(ConfigAttributeName_AtlasName);
		if (null == obj) {
			throw new ServletException("Atlas name is not specified (" + ConfigAttributeName_AtlasName + ")");
		}
		if (obj instanceof String) {
			atlasName = (String) obj;
		} else {
			throw new ServletException("Unexpected object for atlas name: " + obj.getClass().getName());
		}

		// Pick up configuration
		Object configurationObj = context.getAttribute(ExportConfiguration.CONFIGURATION_KEY);
		if( null == configurationObj ) {
			throw new ServletException("Can not find configuration object");
		}
		if( configurationObj instanceof ExportConfiguration ){
			configuration = (ExportConfiguration)configurationObj;
		} else {
			throw new ServletException("Invalid class for configuration: "+configurationObj.getClass().getName());
		}
	}
	
	public void destroy() {
		
	}
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException {
		try {
			List<String> paths = computeRequestPath(request);
			String path = null;
			if( paths.size() > 0 ){
				path = paths.get(0);
			}
			
			if ("welcome".equalsIgnoreCase(path)) {
				doGetWelcome(request, response);
			} else if ("test".equalsIgnoreCase(path)) {
				doGetTest(request, response);
			} else if( "rdf".equalsIgnoreCase(path)) {
				doGetRDF(request, response);
			} else {
				throw new Exception("Unknown request");
			}

		} catch (Exception e) {
			reportError(e, response);
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException {
		try {
			List<String> paths = computeRequestPath(request);
			String path = null;
			if (paths.size() > 0) {
				path = paths.get(0);
			}

			if ("definition".equalsIgnoreCase(path)) {
				doPostDefinition(request, response);

			} else if ("records".equalsIgnoreCase(path)) {
				doPostRecords(request, response);

			} else {
				throw new Exception("Unknown request: " + path);
			}

		} catch (Exception e) {
			reportError(e, response);
		}
	}

	protected void doGetRDF(HttpServletRequest request, HttpServletResponse response) throws ServletException {
		try {
			Method method = null;
			{
				String methodStr = request.getParameter("method");
				if (null != methodStr) {
					for (Method m : Method.values()) {
						// Only do schema for now
						if (m.matches(methodStr) && methodStr.equalsIgnoreCase("schema")) {
							method = m;
						}
					}
				}
				if (null == method) {
					throw new Exception("Unknown method for RDF export");
				}
				logger.debug("Export Method: " + method.name());
			}

			Lang language = Lang.TURTLE;
			{
				String langParam = request.getParameter("language");
				if (null != langParam) {
					if (langParam.equals("turtle") || langParam.equals("ttl")) {
						language = Lang.TURTLE;
					} else if (langParam.equals("jsonld")) {
						language = Lang.JSONLD;
					} else if (langParam.equals("rdf") || langParam.equals("rdfxml")) {
						language = Lang.RDFXML;
					} else {
						throw new Exception("Unsupported language for RDF export: " + langParam);
					}
				}
			}

			String identifier = null;
			List<String> identifiers = new Vector<String>();
			{
				String[] ids = request.getParameterValues("name");
				if (null != ids) {
					for (String id : ids) {
						identifiers.add(id);
					}
				}
				if (identifiers.size() > 0) {
					identifier = identifiers.get(0);
				}
				if (null == identifier) {
					throw new Exception("Unknown name for RDF export");
				}
				logger.debug("Export Name: " + identifier);
			}

			DocumentRetrieval docRetrieval = null;
			if (Method.SCHEMA == method) {
				try {
					docRetrieval = DocumentRetrievalSchema.create(configuration.getCouchDb(), identifier);
				} catch (Exception e) {
					throw new Exception("Problem retrieving documents from schema: " + identifier, e);
				}
			} else {
				throw new Exception("Unhandled method: " + method.name());
			}

			SchemaCache schemaCache = null;
			try {
				schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
				// outputFormat = new ExportFormatCSV(schemaCache, docRetrieval);
			} catch (Exception e) {
				throw new Exception("RDF Export Failure Message 1", e);
			}

			String defaultNs = "http://" + atlasName + "/ontology/#";
			Model graph = ModelFactory.createDefaultModel();
			graph.setNsPrefix(atlasName, defaultNs);

			while (docRetrieval.hasNext()) {
				Document doc = docRetrieval.getNext();
				if (doc == null)
					break;
				try {
					/* start of function probably */
					NunaliitDocument nunaliitDoc = new NunaliitDocument(doc);
					JSONObject json = nunaliitDoc.getJSONObject();
					String schemaName = json.optString("nunaliit_schema");
					if (schemaName == null)
						continue;
					SchemaExportInfo exportInfo = schemaCache.getExportInfo(schemaName);
					if (exportInfo == null)
						continue;
					Resource type = graph.createResource(defaultNs + schemaName);
					Resource blankInstance = graph.createResource();
					graph.add(blankInstance, RDF.type, type);
					for (SchemaExportProperty exportProperty : exportInfo.getProperties()) {
						Object value = exportProperty.select(json);
						if (null != value) {
							Property schemaProperty = graph.createProperty(defaultNs + exportProperty.getLabel());
							// does not consider if value is another object
							graph.add(blankInstance, schemaProperty, graph.createLiteral(value.toString(), false));
						}
					}
					/* end of probable function */
				} catch (Exception e) {
					throw new Exception("RDF Export Failure Message 2: " + doc.getId(), e);
				}
			}

			OutputStream os = response.getOutputStream();
			RDFDataMgr.write(os, graph, language);
			os.flush();
		} catch (Exception e) {
			reportError(e, response);
		}
	}

	protected void doPostDefinition(HttpServletRequest request, HttpServletResponse response) throws ServletException {
		// Ignore final path. Allows client to set any download file name
		
		try {
			// Parse format
			Format format = null;
			{
				String formatStr = request.getParameter("format");
				if( null == formatStr ) {
					format = Format.GEOJSON;
				} else {
					for(Format f : Format.values()){
						if( f.matches(formatStr) ){
							format = f;
						}
					}
				}
				
				if( null == format ) {
					throw new Exception("Unknown format");
				}
				logger.debug("Export Format: "+format.name());
			}
			
			// Parse filter
			Filter filter = null;
			{
				String filterStr = request.getParameter("filter");
				if( null != filterStr ) {
					for(Filter f : Filter.values()){
						if( f.matches(filterStr) ){
							filter = f;
						}
					}
				}
				
				if( null != filter ) {
					logger.debug("Export Filter: "+filter.name());
				}
			}
			
			// Parse method
			Method method = null;
			{
				String methodStr = request.getParameter("method");
				if( null != methodStr ) {
					for(Method m : Method.values()){
						if( m.matches(methodStr) ){
							method = m;
						}
					}
				}
				
				if( null == method ) {
					throw new Exception("Unknown method");
				}
				logger.debug("Export Method: "+method.name());
			}
			
			// Parse identifier
			String identifier = null;
			List<String> identifiers = new Vector<String>();
			{
				String[] ids = request.getParameterValues("name");
				if( null != ids ) {
					for(String id : ids){
						identifiers.add(id);
					}
				}
				
				if( identifiers.size() > 0 ) {
					identifier = identifiers.get(0);
				}
				
				if( null == identifier ) {
					throw new Exception("Unknown name");
				}
				logger.debug("Export Name: "+identifier);
			}
			
			// Parse contentType
			String contentType = null;
			{
				String[] contentTypes = request.getParameterValues("contentType");
				if( null != contentTypes ) {
					for(String t : contentTypes){
						contentType = t;
					}
				}
				
				if( null != contentType ) {
					logger.debug("Content-Type: "+contentType);
				}
			}
			
			// Build doc retrieval based on method
			DocumentRetrieval docRetrieval = null;
			if( Method.LAYER == method ) {
				try {
					docRetrieval = DocumentRetrievalLayer.create(configuration.getCouchDb(), identifier);
				} catch (Exception e) {
					throw new Exception("Problem retrieving documents from layer: "+identifier,e);
				}
				
			} else if( Method.SCHEMA == method ) {
				try {
					docRetrieval = DocumentRetrievalSchema.create(configuration.getCouchDb(), identifier);
				} catch (Exception e) {
					throw new Exception("Problem retrieving documents from schema: "+identifier,e);
				}
				
			} else if( Method.DOC_ID == method ) {
				try {
					docRetrieval = DocumentRetrievalId.create(configuration.getCouchDb(), identifiers);
				} catch (Exception e) {
					throw new Exception("Problem retrieving documents from doc ids: "+identifiers,e);
				}
				
			} else {
				throw new Exception("Do not know how to handle method: "+method.name());
			}
			
			// Build document filter based on filter type
			if( null != filter ){
				DocumentFilter docFilter = new DocumentFilterGeometryType(filter);
				DocumentRetrievalFiltered filteredRetrieval = 
						new DocumentRetrievalFiltered(docRetrieval, docFilter);
				docRetrieval = filteredRetrieval;
			}
			
			ExportFormat outputFormat = null;
			if( Format.GEOJSON == format ) {
				try {
					SchemaCache schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
					outputFormat = new ExportFormatGeoJson(schemaCache, docRetrieval);
				} catch (Exception e) {
					throw new Exception("Problem setting up format: "+format.name(),e);
				}
	
			} else if( Format.CSV == format ) {
				try {
					SchemaCache schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
					outputFormat = new ExportFormatCSV(schemaCache, docRetrieval);
				} catch (Exception e) {
					throw new Exception("Problem setting up format: "+format.name(),e);
				}
			
			} else {
				throw new Exception("Do not know how to handle format: "+format.name());
			}
			
			String charEncoding = outputFormat.getCharacterEncoding();
			if( null != charEncoding ) {
				response.setCharacterEncoding( charEncoding );
			}
			if( null == contentType ) {
				contentType = outputFormat.getMimeType();
			}
			if( null != contentType ) {
				response.setContentType(contentType);
			}
			response.setHeader("Cache-Control", "no-cache,must-revalidate");
			response.setDateHeader("Expires", (new Date()).getTime());
			
			OutputStream os = response.getOutputStream();
			
			try {
				outputFormat.outputExport(os);
			} catch (Exception e) {
				throw new Exception("Error during export process",e);
			}
			
			os.flush();

		} catch(Exception e) {
			reportError(e,response);
		}
	}

	protected void doPostRecords(HttpServletRequest request, HttpServletResponse response) throws ServletException {
		// Ignore final path. Allows client to set any download file name
		
		try {
			boolean isMultipart = ServletFileUpload.isMultipartContent(request);
			if( !isMultipart ){
				throw new Exception("Must be multipart form data");
			}

			Format format = Format.GEOJSON;
			Filter filter = null;
			String contentType = null;
			
			// Parse the request
			ServletFileUpload upload = new ServletFileUpload();
			FileItemIterator iter = upload.getItemIterator(request);
			while (iter.hasNext()) {
			    FileItemStream item = iter.next();
			    String name = item.getFieldName();
			    InputStream stream = item.openStream();

		    	// Parse format
			    if( "format".equals(name) ){
					String formatStr = Streams.asString(stream);
					
					boolean found = false;
					for(Format f : Format.values()){
						if( f.matches(formatStr) ){
							format = f;
							found = true;
						}
					}
					
					if( !found ) {
						throw new Exception("Unknown format: "+formatStr);
					}

			    } else if( "filter".equals(name) ){
			    	// Parse filter
					String filterStr = Streams.asString(stream);

					
					boolean found = false;
					for(Filter f : Filter.values()){
						if( f.matches(filterStr) ){
							filter = f;
							found = true;
						}
					}
					
					if( !found ) {
						throw new Exception("Unknown filter: "+filterStr);
					}

			    } else if( "contentType".equals(name) ){
			    	// Parse contentType
			    	contentType = Streams.asString(stream);

			    } else if( "data".equals(name) ){
			    	// Start export. Item "data" should be last item in form
					logger.debug("Export Format: "+format.name());
					logger.debug("Filter: "+filter);
					logger.debug("Content-Type: "+contentType);
					
					String encoding = request.getCharacterEncoding();
					if( null == encoding ){
						encoding = "UTF-8";
					}
					
					InputStreamReader isr = new InputStreamReader(stream,encoding);
					JSONArrayReaderIterator recordsReader = new JSONArrayReaderIterator(isr);

					// Create export process
					ExportFormat exportProcess = null;
					if( Format.GEOJSON == format ){
						ExportRecordsGeoJson exportRecordsGeoJson = new ExportRecordsGeoJson(configuration.getCouchDb(),recordsReader);
						if( null != filter ){
							exportRecordsGeoJson.setFilter(filter);
						}
						exportProcess = exportRecordsGeoJson;

					} else if( Format.CSV == format ){
						ExportRecordsCSV exportRecordsCSV = new ExportRecordsCSV(configuration.getCouchDb(),recordsReader);
						if( null != filter ){
							exportRecordsCSV.setFilter(filter);
						}
						exportProcess = exportRecordsCSV;
					
					} else {
						throw new Exception("Unsupported format: "+format.getLabel());
					}
					
					// Set headers on response
					String charEncoding = exportProcess.getCharacterEncoding();
					if( null != charEncoding ) {
						response.setCharacterEncoding( charEncoding );
					}
					if( null == contentType ) {
						contentType = exportProcess.getMimeType();
					}
					if( null != contentType ) {
						response.setContentType(contentType);
					}
					response.setHeader("Cache-Control", "no-cache,must-revalidate");
					response.setDateHeader("Expires", (new Date()).getTime());
					
					OutputStream os = response.getOutputStream();
					
					try {
						exportProcess.outputExport(os);
					} catch (Exception e) {
						throw new Exception("Error during export process",e);
					}
					
					os.flush();
			    }
			}

		} catch(Exception e) {
			reportError(e,response);
		}
	}

	private void doGetWelcome(HttpServletRequest request, HttpServletResponse response) throws Exception {
		try {
			// Return JSON object to acknowledge the welcome
			{
				JSONObject obj = new JSONObject();
				obj.put("ok", true);
				obj.put("message", "export service");
				
				// Formats
				{
					JSONArray formats = new JSONArray();
					for(Format f : Format.values()){
						formats.put(f.getLabel());
					}
					obj.put("formats", formats);
				}
				
				// Filters
				{
					JSONArray filters = new JSONArray();
					for(Filter f : Filter.values()){
						filters.put(f.getLabel());
					}
					obj.put("filters", filters);
				}
				
				// Methods
				{
					JSONArray methods = new JSONArray();
					for(Method f : Method.values()){
						methods.put(f.getLabel());
					}
					obj.put("methods", methods);
				}
				
				response.setCharacterEncoding("utf-8");
				response.setContentType("text/plain");
				response.setHeader("Cache-Control", "no-cache,must-revalidate");
				response.setDateHeader("Expires", (new Date()).getTime());
				
				OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
				obj.write(osw);
				osw.flush();
			}
		} catch (Exception e) {
			throw new Exception("Can not generate welcome message",e);
		}
	}

	private void doGetTest(HttpServletRequest request, HttpServletResponse response) throws Exception {
		try {
			response.setCharacterEncoding("utf-8");
			response.setContentType("text/html");
			response.setHeader("Cache-Control", "no-cache,must-revalidate");
			response.setDateHeader("Expires", (new Date()).getTime());
			
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
			PrintWriter pw = new PrintWriter(osw);
			
			pw.println("<html><head><title>Export Test Page</title></head><body>");

			pw.println("<h1>Export using Schema Definition</h1>");
			pw.println("<form action=\"definition/export\" method=\"POST\">");
			
			pw.println("<label for=\"format\">Format: </label>");
			pw.println("<select id=\"format\" name=\"format\">");
			pw.println("<option value=\"geojson\">GEOJson</option>");
			pw.println("<option value=\"invalid\">Invalid Format</option>");
			pw.println("</select>");
			pw.println("<br/>");
			
			pw.println("<label for=\"filter\">Filter: </label>");
			pw.println("<select id=\"filter\" name=\"filter\">");
			pw.println("<option value=\"all\">All Documents</option>");
			pw.println("<option value=\"points\">Only Point Geometries</option>");
			pw.println("<option value=\"lines\">Only Line Geometries</option>");
			pw.println("<option value=\"polygons\">Only Polygon Geometries</option>");
			pw.println("</select>");
			pw.println("<br/>");
			
			pw.println("<label for=\"method\">Method: </label>");
			pw.println("<select id=\"method\" name=\"method\">");
			pw.println("<option value=\"layer\">Features from a Layer</option>");
			pw.println("<option value=\"schema\">Documents with a schema type</option>");
			pw.println("<option value=\"doc-id\">Document with identifier</option>");
			pw.println("</select>");
			pw.println("<br/>");
			
			pw.println("<label for=\"name\">Name: </label>");
			pw.println("<input id=\"name\" type=\"text\" name=\"name\"/>");
			pw.println("<br/>");
			
			pw.println("<input type=\"submit\" value=\"OK\"/>");
			pw.println("</form>");

			pw.println("<h1>Export using Records</h1>");
			pw.println("<form action=\"records/export\" method=\"POST\">");
			
			pw.println("<label for=\"format\">Format: </label>");
			pw.println("<select id=\"format\" name=\"format\">");
			pw.println("<option value=\"geojson\">GEOJson</option>");
			pw.println("<option value=\"invalid\">Invalid Format</option>");
			pw.println("</select>");
			pw.println("<br/>");
			
			pw.println("<label for=\"filter\">Filter: </label>");
			pw.println("<select id=\"filter\" name=\"filter\">");
			pw.println("<option value=\"all\">All Documents</option>");
			pw.println("<option value=\"points\">Only Point Geometries</option>");
			pw.println("<option value=\"lines\">Only Line Geometries</option>");
			pw.println("<option value=\"polygons\">Only Polygon Geometries</option>");
			pw.println("</select>");
			pw.println("<br/>");
			
			pw.println("<label for=\"rec1\">Record: </label>");
			pw.println("<input id=\"rec1\" type=\"text\" name=\"record\" value=\"&quot;_id&quot;,&quot;_geometry&quot;,&quot;value&quot;\"/>");
			pw.println("<br/>");
			pw.println("<label for=\"rec2\">Record: </label>");
			pw.println("<input id=\"rec2\" type=\"text\" name=\"record\" value=\"&quot;123&quot;,&quot;456&quot;,&quot;abc&quot;\"/>");
			pw.println("<br/>");
			
			pw.println("<input type=\"submit\" value=\"OK\"/>");
			pw.println("</form>");

			pw.println("</body></html>");
			
			osw.flush();

		} catch (Exception e) {
			throw new Exception("Can not generate test message",e);
		}
	}
}
