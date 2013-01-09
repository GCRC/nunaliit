package ca.carleton.gcrc.relations.config;

import java.sql.Connection;
import java.util.Properties;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;

import ca.carleton.gcrc.auth.common.UserRepositoryDb;
import ca.carleton.gcrc.auth.common.UserRepositorySingleton;
import ca.carleton.gcrc.contributions.Contributions;
import ca.carleton.gcrc.contributions.ContributionsUtils;
import ca.carleton.gcrc.jdbc.JdbcConnections;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.onUpload.OnUpload;
import ca.carleton.gcrc.search.SearchServlet;
import ca.carleton.gcrc.upload.OnUploadedListenerSingleton;
import ca.carleton.gcrc.upload.UploadServlet;
import ca.carleton.gcrc.upload.UploadUtils;
import ca.carleton.gcrc.utils.ConfigUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class ConfigServlet extends HttpServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private JdbcConnections jdbcConnections = null;
	private ConfigUtils configUtils = null;
	
	public ConfigServlet() {
		configUtils = new ConfigUtils();
	}

	public void init(ServletConfig config) throws ServletException {

		// Figure out configuration directories
		try {
			configUtils.computeConfigurationDirectories(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while computing configuration directories",e);
			throw e;
		}
		
		// Configure JDBC
		try {
			initJDBC(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing JDBC",e);
			throw e;
		}
		
		// Configure User Repository
		try {
			initUserRepository(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing user repository",e);
			throw e;
		}
		
		// Configure contributions
		try {
			initContributions(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing contributions",e);
			throw e;
		}
		
		// Configure multimedia
		try {
			initMultimedia(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing multimedia",e);
			throw e;
		}
		
		// Configure search
		try {
			initSearch(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing search",e);
			throw e;
		}
		
		// Configure upload
		try {
			initUpload(config.getServletContext());
		} catch(ServletException e) {
			logger.error("Error while initializing upload",e);
			throw e;
		}

		logger.info("Completed Relations Configuration");
	}
	
	private void initJDBC(ServletContext context) throws ServletException {
		Properties props = configUtils.loadProperties("jdbc.properties", false);
		context.setAttribute(
				JdbcConnections.PROPERTIES_SERVLET_ATTRIB_NAME
				,props
				);
		jdbcConnections = JdbcConnections.connectionsFromServletContext(context);
	}

	private void initUserRepository(ServletContext context) throws ServletException {
		UserRepositoryDb userRepository = new UserRepositoryDb( context );
		UserRepositorySingleton.setSingleton(userRepository);
	}

	private void initMultimedia(ServletContext context) throws ServletException {
		Properties props = configUtils.loadProperties("multimedia.properties", true);
		
		MultimediaConfiguration.configureFromProperties(props);
	}

	private void initUpload(ServletContext context) throws ServletException {
		Connection connection = null;
		try {
			connection = jdbcConnections.getDb();
		} catch (Exception e) {
			throw new ServletException("Error while connecting to database",e);
		}
		Contributions contributions = ContributionsUtils.createContibutionHandler(context, connection);
		if (null != contributions) {
			OnUpload onUpload = new OnUpload(context);
			onUpload.setContributions(contributions);
			context.setAttribute(UploadServlet.OnUploadedListenerAttributeName, onUpload);
			OnUploadedListenerSingleton.configure(onUpload);
		} else {
			throw new ServletException("Unable to configure onUpload process");
		}
		
		Properties props = configUtils.loadProperties("upload.properties", false);
		context.setAttribute(
				UploadUtils.PROPERTIES_ATTRIBUTE
				,props
				);
	}

	private void initContributions(ServletContext context) throws ServletException {
		Properties props = configUtils.loadProperties("contributions.properties", true);
		context.setAttribute(
				ContributionsUtils.PROPERTIES_SERVLET_ATTRIB_NAME
				,props
				);
	}

	private void initSearch(ServletContext context) throws ServletException {
		Properties props = configUtils.loadProperties("search.properties", true);
		context.setAttribute(
				SearchServlet.PROPERTIES_SERVLET_ATTRIB_NAME
				,props
				);
	}
	
	public void destroy() {
		if( null != jdbcConnections ) {
			jdbcConnections.closeAllConnections();
			jdbcConnections = null;
		}
		
		super.destroy();
	}
}