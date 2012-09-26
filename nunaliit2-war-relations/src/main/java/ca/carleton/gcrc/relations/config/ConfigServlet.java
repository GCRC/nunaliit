package ca.carleton.gcrc.relations.config;

import java.io.File;
import java.io.FileInputStream;
import java.sql.Connection;
import java.util.Properties;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;

import org.apache.log4j.Logger;

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

@SuppressWarnings("serial")
public class ConfigServlet extends HttpServlet {

	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private File configurationDirectory = null;
	private File fallbackConfigurationDirectory = null;
	private JdbcConnections jdbcConnections = null;
	
	public ConfigServlet() {
		
	}

	public void init(ServletConfig config) throws ServletException {

		logger.info("Initializing Relations Configuration");

		// Figure out configuration directories
		try {
			computeConfigurationDirectories(config.getServletContext());
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
	
	private Properties loadProperties(String baseName, boolean loadDefault) throws ServletException {

		// Load up contribution properties file....
		Properties props = null;
		{
			File propFile = new File(configurationDirectory, baseName);
			if( false == propFile.exists() || false == propFile.isFile() ) {
				propFile = null;
			}
			if( null == propFile ) {
				propFile = new File(fallbackConfigurationDirectory, baseName);
				if( false == propFile.exists() || false == propFile.isFile() ) {
					propFile = null;
				}
			}
			if( loadDefault && null == propFile ) {
				propFile = new File(fallbackConfigurationDirectory, baseName+".default");
				if( false == propFile.exists() || false == propFile.isFile() ) {
					propFile = null;
				}
			}
			if( null == propFile ) {
				logger.error("Property file location can not be determined for: "+baseName);
			} else {
				logger.info("Reading properties from "+propFile.getAbsolutePath());
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(propFile);
					props = new Properties();
					props.load(fis);
				} catch (Exception e) {
					logger.error("Unable to read properties from "+propFile.getAbsolutePath(),e);
					props = null;
				} finally {
					if( null != fis ) {
						try {
							fis.close();
						} catch (Exception e) {
							// Ignore
						}
					}
				}
			}
		}
		
		return props;
	}
	
	private void computeConfigurationDirectories(ServletContext servletContext) throws ServletException {
		
		// Look for ./WEB-INF/atlas.properties
		{
			if( null != servletContext ) {
				String realRootString = servletContext.getRealPath("./WEB-INF");
				File realRoot = new File(realRootString);
				if( realRoot.exists()
				 && realRoot.isDirectory() ) {
					File atlasPropsFile = new File(realRoot, "atlas.properties");
					if( false == atlasPropsFile.exists() 
					 || false == atlasPropsFile.isFile() ) {
						atlasPropsFile = null;
					}
					if( null == atlasPropsFile ) {
						atlasPropsFile = new File(realRoot, "atlas.properties.default");
						if( false == atlasPropsFile.exists() 
						 || false == atlasPropsFile.isFile() ) {
							atlasPropsFile = null;
						}
					}
					if( null != atlasPropsFile ) {
						// Read in properties
						Properties atlasProps = new Properties();
						logger.info("Reading atlas properties from "+atlasPropsFile.getAbsolutePath());
						FileInputStream fis = null;
						try {
							fis = new FileInputStream(atlasPropsFile);
							atlasProps.load(fis);
						} catch (Exception e) {
							logger.error("Unable to read atlas properties from "+atlasPropsFile.getAbsolutePath(),e);
						} finally {
							if( null != fis ) {
								try {
									fis.close();
								} catch (Exception e) {
									// Ignore
								}
							}
						}
						
						// Look for atlas.config.dir
						if( atlasProps.containsKey("atlas.config.dir") ) {
							String atlasConfigDirString = atlasProps.getProperty("atlas.config.dir");
							logger.info("Atlas config directory specified: "+atlasConfigDirString);
							File atlasConfigDir = new File(atlasConfigDirString);
							if( atlasConfigDir.exists() && atlasConfigDir.isDirectory() ) {
								// OK
								configurationDirectory = atlasConfigDir;
							} else {
								logger.error("Invalid configuration directory specified. Ignoring.");
							}
						}
						
						// Look for atlas.name
						if( atlasProps.containsKey("atlas.name") ) {
							String atlasName = atlasProps.getProperty("atlas.name");
							logger.info("Atlas name specified: "+atlasName);
							File atlasConfigDir = new File("/etc/nunaliit2/atlas",atlasName);
							if( atlasConfigDir.exists() && atlasConfigDir.isDirectory() ) {
								// OK
								configurationDirectory = atlasConfigDir;
							} else {
								logger.error("Configuration directory associated with name not found. Ignoring. "+atlasConfigDir.getAbsolutePath());
							}
						}
					}
				}
			}
		}
		
		// Check WEB-INF directory
		{
			if( null != servletContext ) {
				String webInfString = servletContext.getRealPath("./WEB-INF");
				File webInfDir = new File(webInfString);
				if( webInfDir.exists() ) {
					if( webInfDir.isDirectory() ) {
						fallbackConfigurationDirectory = webInfDir;
					}
				}
			}
		}

		if( null == configurationDirectory ) {
			configurationDirectory = fallbackConfigurationDirectory;
		}
		
		if( null == configurationDirectory ) {
			throw new ServletException("Can not determine configuration directory");
		}
		if( null == fallbackConfigurationDirectory ) {
			throw new ServletException("Can not determine fallback configuration directory");
		}
		
		logger.info("Configuration directory: "+configurationDirectory.getAbsolutePath());
		logger.info("Configuration directory on fallback: "+fallbackConfigurationDirectory.getAbsolutePath());
	}

	private void initJDBC(ServletContext context) throws ServletException {
		Properties props = loadProperties("jdbc.properties", false);
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
		Properties props = loadProperties("multimedia.properties", true);
		
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
		
		Properties props = loadProperties("upload.properties", false);
		context.setAttribute(
				UploadUtils.PROPERTIES_ATTRIBUTE
				,props
				);
	}

	private void initContributions(ServletContext context) throws ServletException {
		Properties props = loadProperties("contributions.properties", true);
		context.setAttribute(
				ContributionsUtils.PROPERTIES_SERVLET_ATTRIB_NAME
				,props
				);
	}

	private void initSearch(ServletContext context) throws ServletException {
		Properties props = loadProperties("search.properties", true);
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