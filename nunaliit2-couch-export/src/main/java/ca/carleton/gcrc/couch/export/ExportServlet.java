package ca.carleton.gcrc.couch.export;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.Date;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.json.JSONObject;

import ca.carleton.gcrc.couch.export.ExportUtils.Filter;
import ca.carleton.gcrc.couch.export.ExportUtils.Format;
import ca.carleton.gcrc.couch.export.ExportUtils.Method;
import ca.carleton.gcrc.couch.export.impl.DocumentFilterGeometryType;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalId;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalLayer;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalSchema;
import ca.carleton.gcrc.couch.export.impl.ExportFormatGeoJson;
import ca.carleton.gcrc.couch.export.impl.SchemaCacheCouchDb;

@SuppressWarnings("serial")
public class ExportServlet extends HttpServlet {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
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
	
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String paths[] = request.getRequestURI().split("/");
		String path = paths[ paths.length - 1 ];
		
		if( "welcome".equalsIgnoreCase(path) ) {
			doGetWelcome(request, response);
			
		} else if( "test".equalsIgnoreCase(path) ) {
			doGetTest(request, response);
				
		} else {
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Unknown request");
		}
	}

	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// Ignore path. Allows client to set any download file name
		
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
				Exception e = new Exception("Unknown format");
				reportError(response,HttpServletResponse.SC_INTERNAL_SERVER_ERROR,e);
				return;
			}
			logger.debug("Export Format: "+format.name());
		}
		
		// Parse filter
		Filter filter = null;
		{
			String filterStr = request.getParameter("filter");
			if( null == filterStr ) {
				filter = Filter.ALL;
			} else {
				for(Filter f : Filter.values()){
					if( f.matches(filterStr) ){
						filter = f;
					}
				}
			}
			
			if( null == filter ) {
				Exception e = new Exception("Unknown filter");
				reportError(response,HttpServletResponse.SC_INTERNAL_SERVER_ERROR,e);
				return;
			}
			logger.debug("Export Filter: "+filter.name());
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
				Exception e = new Exception("Unknown method");
				reportError(response,HttpServletResponse.SC_INTERNAL_SERVER_ERROR,e);
				return;
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
				Exception e = new Exception("Unknown name");
				reportError(response,HttpServletResponse.SC_INTERNAL_SERVER_ERROR,e);
				return;
			}
			logger.debug("Export Name: "+identifier);
		}
		
		// Build doc retrieval based on method
		DocumentRetrieval docRetrieval = null;
		if( Method.LAYER == method ) {
			try {
				docRetrieval = DocumentRetrievalLayer.create(configuration.getCouchDb(), identifier);
			} catch (Exception e) {
				throw new ServletException("Problem retrieving documents from layer: "+identifier,e);
			}
			
		} else if( Method.SCHEMA == method ) {
			try {
				docRetrieval = DocumentRetrievalSchema.create(configuration.getCouchDb(), identifier);
			} catch (Exception e) {
				throw new ServletException("Problem retrieving documents from schema: "+identifier,e);
			}
			
		} else if( Method.DOC_ID == method ) {
			try {
				docRetrieval = DocumentRetrievalId.create(configuration.getCouchDb(), identifiers);
			} catch (Exception e) {
				throw new ServletException("Problem retrieving documents from doc ids: "+identifiers,e);
			}
			
		} else {
			throw new ServletException("Do not know how to handle method: "+method.name());
		}
		
		// Build document filter based on filter type
		DocumentFilter docFilter = null;
		{
			docFilter = new DocumentFilterGeometryType(filter);
		}
		
		ExportFormat outputFormat = null;
		if( Format.GEOJSON == format ) {
			try {
				SchemaCache schemaCache = new SchemaCacheCouchDb(configuration.getCouchDb());
				outputFormat = new ExportFormatGeoJson(schemaCache, docRetrieval, docFilter);
			} catch (Exception e) {
				throw new ServletException("Problem setting up format: "+format.name(),e);
			}
		} else {
			throw new ServletException("Do not know how to handle format: "+format.name());
		}
		
		String charEncoding = outputFormat.getCharacterEncoding();
		if( null != charEncoding ) {
			response.setCharacterEncoding( charEncoding );
		}
		String contentType = outputFormat.getMimeType();
		if( null != contentType ) {
			response.setContentType(contentType);
		}
		response.setHeader("Cache-Control", "no-cache,must-revalidate");
		response.setDateHeader("Expires", (new Date()).getTime());
		
		OutputStream os = response.getOutputStream();
		
		try {
			outputFormat.outputExport(os);
		} catch (Exception e) {
			throw new ServletException("Error during export process",e);
		}
		
		os.flush();
	}

	private void doGetWelcome(HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			// Return JSON object to acknowledge the welcome
			{
				JSONObject obj = new JSONObject();
				obj.put("ok", true);
				obj.put("message", "export service");
				
				response.setCharacterEncoding("utf-8");
				response.setContentType("text/plain");
				response.setHeader("Cache-Control", "no-cache,must-revalidate");
				response.setDateHeader("Expires", (new Date()).getTime());
				
				OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
				obj.write(osw);
				osw.flush();
			}
		} catch (Exception e) {
			reportError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e);
		}
	}

	private void doGetTest(HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			response.setCharacterEncoding("utf-8");
			response.setContentType("text/html");
			response.setHeader("Cache-Control", "no-cache,must-revalidate");
			response.setDateHeader("Expires", (new Date()).getTime());
			
			OutputStreamWriter osw = new OutputStreamWriter(response.getOutputStream(),"UTF-8");
			PrintWriter pw = new PrintWriter(osw);
			
			pw.println("<html><head><title>Export Test Page</title></head><body>");
			pw.println("<form action=\"export\" method=\"POST\">");
			
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
			reportError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e);
		}
	}

	private void reportError(HttpServletResponse response, int code, Throwable error) throws IOException {
		if( null != error ) {
			response.sendError(code, error.getMessage());
		} else {
			response.sendError(code);
		}
	}
}
