package ca.carleton.gcrc.mail;

import java.io.IOException;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.json.servlet.JsonServlet;

@SuppressWarnings("serial")
public class MailServlet extends JsonServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private MailServletConfiguration configuration;
	private MailServiceActions mailActions;
	
	public MailServlet() {
		
	}
	
	@Override
	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		// Pick up configuration
		Object configurationObj = config.getServletContext().getAttribute(MailServletConfiguration.CONFIGURATION_KEY);
		if( null == configurationObj ) {
			throw new ServletException("Can not find configuration object");
		}
		if( configurationObj instanceof MailServletConfiguration ){
			configuration = (MailServletConfiguration)configurationObj;

			mailActions = new MailServiceActions(
					configuration.getMailDelivery(),
					configuration.getRecipients()
					);
			
		} else {
			throw new ServletException("Invalid class for configuration: "+configurationObj.getClass().getName());
		}
	}
	
	@Override
	public void destroy() {
	}

	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				JSONObject result = mailActions.getWelcome();

				sendJsonResponse(response, result);
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		try {
			List<String> paths = computeRequestPath(request);
			
			if( paths.size() < 1 ) {
				throw new Exception("Unrecognized request");
				
			} else if( paths.size() == 1
			 && "sendFormMail".equals(paths.get(0)) ) {

				// Destination
				String destination = null;
				{
					String[] destinationStrings = request.getParameterValues("destination");
					if( null == destinationStrings || destinationStrings.length < 1 ){
						// optional
					} else if( destinationStrings.length > 1 ){
						throw new Exception("'destination' parameter must be specified at most once");
					} else {
						destination = destinationStrings[0];
					}
				}

				// Contact Information
				String contact = null;
				{
					String[] contactStrings = request.getParameterValues("contact");
					if( null == contactStrings || contactStrings.length < 1 ){
						throw new Exception("'contact' parameter must be specified");
					} else if( contactStrings.length > 1 ){
						throw new Exception("'contact' parameter must be specified exactly once");
					} else {
						contact = contactStrings[0];
					}
				}

				// Body
				String body = null;
				{
					String[] bodyStrings = request.getParameterValues("body");
					if( null == bodyStrings || bodyStrings.length < 1 ){
						throw new Exception("'body' parameter must be specified");
					} else if( bodyStrings.length > 1 ){
						throw new Exception("'body' parameter must be specified exactly once");
					} else {
						body = bodyStrings[0];
					}
				}
				
				JSONObject result = mailActions.sendFormEmail(destination, contact, body);
				
				sendJsonResponse(response, result);
				
			} else {
				throw new Exception("Unrecognized request");
			}
		} catch (Exception e) {
			reportError(e, response);
		}
	}
}
