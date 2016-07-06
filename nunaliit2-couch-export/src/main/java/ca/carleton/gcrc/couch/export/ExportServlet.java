package ca.carleton.gcrc.couch.export;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.Date;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

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
import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class ExportServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private ExportConfiguration configuration;
	
	public ExportServlet() {
		
	}
	
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Pick up configuration
		Object configurationObj = config.getServletContext().getAttribute(ExportConfiguration.CONFIGURATION_KEY);
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
			
			if( "welcome".equalsIgnoreCase(path) ) {
				doGetWelcome(request, response);
				
			} else if( "test".equalsIgnoreCase(path) ) {
				doGetTest(request, response);
					
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
			if( paths.size() > 0 ){
				path = paths.get(0);
			}
			
			if( "definition".equalsIgnoreCase(path) ) {
				doPostDefinition(request, response);

			} else if( "records".equalsIgnoreCase(path) ) {
				doPostRecords(request, response);
					
			} else {
				throw new Exception("Unknown request");
			}

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
			
			// Parse records
			List<String> records = new Vector<String>();
			{
				String[] recs = request.getParameterValues("record");
				if( null != recs ) {
					for(String rec : recs){
						records.add(rec);
					}
				}
				logger.debug("Number of records: "+records.size());
			}
			
			// Build doc retrieval based on method
//			DocumentRetrieval docRetrieval = null;
//			if( Method.LAYER == method ) {
//				try {
//					docRetrieval = DocumentRetrievalLayer.create(configuration.getCouchDb(), identifier);
//				} catch (Exception e) {
//					throw new Exception("Problem retrieving documents from layer: "+identifier,e);
//				}
//				
//			} else if( Method.SCHEMA == method ) {
//				try {
//					docRetrieval = DocumentRetrievalSchema.create(configuration.getCouchDb(), identifier);
//				} catch (Exception e) {
//					throw new Exception("Problem retrieving documents from schema: "+identifier,e);
//				}
//				
//			} else if( Method.DOC_ID == method ) {
//				try {
//					docRetrieval = DocumentRetrievalId.create(configuration.getCouchDb(), identifiers);
//				} catch (Exception e) {
//					throw new Exception("Problem retrieving documents from doc ids: "+identifiers,e);
//				}
//				
//			} else {
//				throw new Exception("Do not know how to handle method: "+method.name());
//			}
			
//			ExportFormat outputFormat = null;
//			if( Format.GEOJSON == format ) {
//				try {
//					SchemaCache schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
//					outputFormat = new ExportFormatGeoJson(schemaCache, docRetrieval);
//				} catch (Exception e) {
//					throw new Exception("Problem setting up format: "+format.name(),e);
//				}
//	
//			} else if( Format.CSV == format ) {
//				try {
//					SchemaCache schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
//					outputFormat = new ExportFormatCSV(schemaCache, docRetrieval);
//				} catch (Exception e) {
//					throw new Exception("Problem setting up format: "+format.name(),e);
//				}
//			
//			} else {
//				throw new Exception("Do not know how to handle format: "+format.name());
//			}
			
//			String charEncoding = outputFormat.getCharacterEncoding();
//			if( null != charEncoding ) {
//				response.setCharacterEncoding( charEncoding );
//			}
//			if( null == contentType ) {
//				contentType = outputFormat.getMimeType();
//			}
//			if( null != contentType ) {
//				response.setContentType(contentType);
//			}
//			response.setHeader("Cache-Control", "no-cache,must-revalidate");
//			response.setDateHeader("Expires", (new Date()).getTime());
//			
//			OutputStream os = response.getOutputStream();
//			
//			try {
//				outputFormat.outputExport(os);
//			} catch (Exception e) {
//				throw new Exception("Error during export process",e);
//			}
//			
//			os.flush();

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
			pw.println("</body></html>");
			
			osw.flush();

		} catch (Exception e) {
			throw new Exception("Can not generate test message",e);
		}
	}
}
