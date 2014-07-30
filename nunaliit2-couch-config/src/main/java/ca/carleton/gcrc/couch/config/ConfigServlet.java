package ca.carleton.gcrc.couch.config;

import java.io.File;
import java.io.FileInputStream;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Vector;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.config.impl.UpdateListener;
import ca.carleton.gcrc.couch.config.listener.ConfigListener;
import ca.carleton.gcrc.couch.config.listener.ConfigListenerCollection;
import ca.carleton.gcrc.couch.config.listener.ConfigWorker;
import ca.carleton.gcrc.couch.config.listener.CouchConfig;
import ca.carleton.gcrc.couch.config.listener.CouchConfigFactory;
import ca.carleton.gcrc.couch.export.ExportConfiguration;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.onUpload.UploadListener;
import ca.carleton.gcrc.couch.onUpload.UploadWorker;
import ca.carleton.gcrc.couch.onUpload.UploadWorkerSettings;
import ca.carleton.gcrc.couch.onUpload.geojson.GeoJsonFileConverter;
import ca.carleton.gcrc.couch.onUpload.gpx.GpxFileConverter;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationImpl;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationNull;
import ca.carleton.gcrc.couch.onUpload.mail.MailVetterDailyNotificationTask;
import ca.carleton.gcrc.couch.onUpload.multimedia.MultimediaFileConverter;
import ca.carleton.gcrc.couch.onUpload.pdf.PdfFileConverter;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.mail.MailDelivery;
import ca.carleton.gcrc.mail.MailDeliveryImpl;
import ca.carleton.gcrc.nunaliit2.couch.replication.ReplicationWorker;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.upload.OnUploadedListenerSingleton;
import ca.carleton.gcrc.upload.UploadServlet;
import ca.carleton.gcrc.upload.UploadUtils;

@SuppressWarnings("serial")
public class ConfigServlet extends HttpServlet {

	final static public String ATLAS_DESIGN_SERVER = "server";
	final static public String USER_DESIGN_AUTH = "_auth";

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private File configurationDirectory = null;
	private File fallbackConfigurationDirectory = null;
	private File rootDirectory = null;
	private File webInfDirectory = null;
	private String atlasName = null;
	private String serverName = null;
	private CouchClient couchClient = null;
	private CouchDb couchDb = null;
	private CouchDesignDocument couchDd = null;
	private CouchDb configDb = null;
	private CouchDesignDocument configDesign = null;
	private String couchReplicationUserName = null;
	private String couchReplicationPassword = null;
	private UploadWorker uploadWorker = null;
	private ReplicationWorker replicationWorker = null;
	private ConfigWorker configWorker = null;
	private MailNotification mailNotification = null;
	private MailVetterDailyNotificationTask vetterDailyTask = null;
	
	public ConfigServlet() {
		
	}

	public void init(ServletConfig config) throws ServletException {
		super.init(config);
		
		logger.info("Initializing Couch Configuration");
		
		ServletContext servletContext = config.getServletContext();

		// Figure out configuration directories
		try {
			computeConfigurationDirectories(servletContext);
		} catch(ServletException e) {
			logger.error("Error while computing configuration directories",e);
			throw e;
		}
		
		// Instantiate CouchDb client
		try {
			initCouchDbClient(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing couch client",e);
			throw e;
		}
		
		// Upload design documents for atlas server
		try {
			initAtlasServerDesignDocument(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing design document for atlas server",e);
			throw e;
		}
		
		// Upload design documents for _users database
		try {
			initUserDesignDocument(servletContext);
		} catch(ServletException e) {
			logger.error("Error while updating user design document",e);
			throw e;
		}
		
		// Upload documents to database
		try {
			initDatabaseDocuments(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing design document for atlas server",e);
			throw e;
		}
		
		// Configure replication worker
		try {
			initReplicationWorker(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing replication worker",e);
			throw e;
		}
		
		// Configure config listeners
		try {
			initCouchConfigListener(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing couch config listener",e);
			throw e;
		}
		
		// Configure multimedia
		try {
			initMultimedia(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing multimedia",e);
			throw e;
		}

		// Configure mail notification
		try {
			initMail(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing mail notification",e);
			mailNotification = new MailNotificationNull();
		}
		
		// Configure upload
		try {
			initUpload(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing upload",e);
			throw e;
		}
		
		// Configure vetter daily notifications
		try {
			initVetterDailyNotifications(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing daily vetter notifications",e);
			throw e;
		}
		
		// Configure export
		try {
			initExport(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing export service",e);
			throw e;
		}
		
		// Configure user
		try {
			initUser(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing user service",e);
			throw e;
		}
		
		// Upload logs on startup
		try {
			uploadLogs(servletContext);
		} catch(ServletException e) {
			logger.error("Error while uploading logs",e);
		}
		
		logger.info("Completed Couch Configuration");
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
		
		if( null == servletContext ) {
			throw new ServletException("No servlet context provided");
		}
		
		// Parse environment variables
		{
			Map<String,String> envMap = System.getenv();
			for(String variable : envMap.keySet()) {
				String value = envMap.get(variable);
				
				//logger.info("env("+variable+"):"+value);
				
				if( "NUNALIIT_CONF_DIR".equalsIgnoreCase(variable) ) {
					File atlasConfigDir = new File(value);
					if( atlasConfigDir.exists() && atlasConfigDir.isDirectory() ) {
						// OK
						configurationDirectory = atlasConfigDir;
					} else {
						logger.error("Configuration directory associated with environment varible not found. Ignoring. "+atlasConfigDir.getAbsolutePath());
					}
				}
			}
		}
		
		// Find root directory
		{
			if( null != servletContext ) {
				String rootString = servletContext.getRealPath(".");
				rootDirectory = new File(rootString);
				if( false == rootDirectory.exists() ) {
					throw new ServletException("Can not find root directory");
				}
			}
		}
		
		// Find WEB-INF directory
		{
			if( null != servletContext ) {
				String webInfString = servletContext.getRealPath("./WEB-INF");
				webInfDirectory = new File(webInfString);
				if( false == webInfDirectory.exists() ) {
					throw new ServletException("Can not find WEB-INF directory");
				}
			}
		}
		
		// Look for ./WEB-INF/atlas.properties or ./WEB-INF/atlas.properties.default
		{
			File atlasPropsFile = new File(webInfDirectory, "atlas.properties");
			if( false == atlasPropsFile.exists() 
			 || false == atlasPropsFile.isFile() ) {
				atlasPropsFile = null;
			}
			if( null == atlasPropsFile ) {
				atlasPropsFile = new File(webInfDirectory, "atlas.properties.default");
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
				if( null == configurationDirectory 
				 && atlasProps.containsKey("atlas.config.dir") ) {
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
					atlasName = atlasProps.getProperty("atlas.name");
					logger.info("Atlas name specified: "+atlasName);
					if( null == configurationDirectory ) {
						File atlasConfigDir = new File("/etc/nunaliit2",atlasName);
						File atlasConfigLegacyDir = new File("/etc/nunaliit2/couchdb",atlasName);
						if( atlasConfigDir.exists() 
						 && atlasConfigDir.isDirectory() ) {
							// OK
							configurationDirectory = atlasConfigDir;
						} else if( atlasConfigLegacyDir.exists() 
								&& atlasConfigLegacyDir.isDirectory() ) {
							// OK
							configurationDirectory = atlasConfigLegacyDir;
						} else {
							logger.error("Configuration directory associated with name not found. Ignoring. "+atlasConfigDir.getAbsolutePath());
						}
					}
				}
			}
		}
		
		// Fall back on WEB-INF directory
		{
			fallbackConfigurationDirectory = webInfDirectory;
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

	private void initCouchDbClient(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("couch.properties", false);
		
		// Our user is the admin user
		if( props.containsKey("couchdb.admin.user") ) {
			props.setProperty("couchdb.user", props.getProperty("couchdb.admin.user"));
		}
		if( props.containsKey("couchdb.admin.password") ) {
			props.setProperty("couchdb.password", props.getProperty("couchdb.admin.password"));
		}
		
		// Read couch db replication information
		if( props.containsKey("couchdb.replication.user") ) {
			couchReplicationUserName = props.getProperty("couchdb.replication.user");
		}
		if( props.containsKey("couchdb.replication.password") ) {
			couchReplicationPassword = props.getProperty("couchdb.replication.password");
		}
		
		// Create Couch Server from properties
		CouchFactory factory = new CouchFactory();
		try {
			couchClient = factory.getClient(props);
			
		} catch(Exception e) {
			logger.error("Unable to get Couch Server",e);
			throw new ServletException("Unable to get Couch Server",e);
		}
		
		// Create database
		try {
			if( props.containsKey("couchdb.dbUrl") ) {
				couchDb = factory.getDb(couchClient, props.getProperty("couchdb.dbUrl"));
			} else if( props.containsKey("couchdb.dbName") ) {
				couchDb = couchClient.getDatabase(props.getProperty("couchdb.dbName"));
			} else {
				throw new Exception("dbUrl or dbName must be provided");
			}
		} catch(Exception e) {
			logger.error("Unable to build Couch Database",e);
			throw new ServletException("Unable to build Couch Database",e);
		}
		logger.info("CouchDb configured: "+couchDb.getUrl());
	}

	private void initAtlasServerDesignDocument(ServletContext servletContext) throws ServletException {
		// Find root directory for design document
		File ddDir = null;
		{
			ddDir = new File(webInfDirectory, "uploadDesignDoc");
			if( false == ddDir.exists() || false == ddDir.isDirectory() ) {
				ddDir = null;
			}
			if( null == ddDir ) {
				throw new ServletException("Unable to find design document source for upload");
			}
		}

		try {
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.setListener(UpdateListener._singleton);
			
			FSEntry fileEntry = new FSEntryFile(ddDir);
			Document doc = DocumentFile.createDocument(fileEntry);

			updateProcess.update(
					doc
					,DocumentUpdateProcess.Schedule.UPDATE_EVEN_IF_MODIFIED
					);
			
		} catch(Exception e) {
			throw new ServletException("Problem pushing design document: "+ATLAS_DESIGN_SERVER, e);
		}
		
		try {
			couchDd = couchDb.getDesignDocument(ATLAS_DESIGN_SERVER);
		} catch (Exception e) {
			throw new ServletException("Unable to get design document", e);
		}
	}

	private void initUserDesignDocument(ServletContext servletContext) throws ServletException {
		// Update document
		try {
			CouchDb userDb = couchClient.getDatabase("_users");
			UserDesignDocumentImpl.updateDesignDocument(userDb);
		} catch(Exception e) {
			throw new ServletException("Error while updating user design document",e);
		}
	}

	private void initDatabaseDocuments(ServletContext servletContext) throws ServletException {

		// Create update process for database
		DocumentUpdateProcess updateProcess = null;
		try {
			updateProcess = new DocumentUpdateProcess(couchDb);
			updateProcess.setListener(UpdateListener._singleton);
		} catch (Exception e) {
			throw new ServletException("Unable to create update process", e);
		}

		// Find root directory for initializing documents
		{
			File documentsDir = null;
			{
				documentsDir = new File(webInfDirectory, "initializeDocs");
				if( false == documentsDir.exists() || false == documentsDir.isDirectory() ) {
					documentsDir = null;
				}
			}
			
			if( null == documentsDir ) {
				logger.error("Unable to find document directory for initializing");
			} else {
				String[] fileNames = documentsDir.list();
				for(String fileName : fileNames) {
					File file = new File(documentsDir, fileName);
		
					try {
						FSEntry fileEntry = new FSEntryFile(file);
						Document doc = DocumentFile.createDocument(fileEntry);

						updateProcess.update(doc);

					} catch(Exception e) {
						throw new ServletException("Problem pushing document: "+file.getAbsolutePath(), e);
					}
				}
			}
		}
		
		// Find root directory for updating documents
		{
			File documentsDir = null;
			{
				documentsDir = new File(webInfDirectory, "updateDocs");
				if( false == documentsDir.exists() || false == documentsDir.isDirectory() ) {
					documentsDir = null;
				}
			}
			
			if( null == documentsDir ) {
				logger.error("Unable to find document directory for updating");
			} else {
				String[] fileNames = documentsDir.list();
				for(String fileName : fileNames) {
					File file = new File(documentsDir, fileName);
		
					try {
						FSEntry fileEntry = new FSEntryFile(file);
						Document doc = DocumentFile.createDocument(fileEntry);

						updateProcess.update(
							doc
							,DocumentUpdateProcess.Schedule.UPDATE_EVEN_IF_MODIFIED
							);

					} catch(Exception e) {
						throw new ServletException("Problem pushing document: "+file.getAbsolutePath(), e);
					}
				}
			}
		}
	}

	private void initReplicationWorker(ServletContext servletContext) throws ServletException {

		if( null == couchClient ) {
			throw new ServletException("Replication worker requires a CouchDb client");
		}
		
		try {
			replicationWorker = new ReplicationWorker();
			replicationWorker.setCouchClient(couchClient);
			replicationWorker.start();
			
		} catch (Exception e) {
			throw new ServletException("Error starting replication worker",e);
		}
	}

	private void initCouchConfigListener(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("config.properties", true);
		
		// Interpret configuration
		serverName = props.getProperty("config.serverName");
		String dbName = props.getProperty("config.dbName");

		if( null == serverName ) {
			throw new ServletException("Can not determine server name for querying configuration information");
		}
		if( null == dbName ) {
			throw new ServletException("Can not determine database name for querying configuration information");
		}
		
		logger.info("Server Name: "+serverName);
		
		try {
			configDb = couchClient.getDatabase(dbName);
			configDesign = configDb.getDesignDocument("config");
			
			ConfigListenerCollection configListener = new ConfigListenerCollection();
			List<ConfigListener> collection = new Vector<ConfigListener>();
			collection.add( new ReplicationConfigListener(
					couchReplicationUserName
					,couchReplicationPassword
					,replicationWorker
					) );
			configListener.setCollection(collection);

			configWorker = new ConfigWorker();
			configWorker.setDesignDocument(configDesign);
			configWorker.setServerName(serverName);
			configWorker.setConfigListener(configListener);
			configWorker.start();
			
		} catch (Exception e) {
			throw new ServletException("Error starting config listener worker",e);
		}
		
		logger.info("CouchDb configured: "+couchDb.getUrl());
	}

	private void initMultimedia(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("multimedia.properties", true);
		
		MultimediaConfiguration.configureFromProperties(props);
	}

	private void initMail(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("mail.properties", true);
		
		// Create mail notification
		MailNotificationImpl mail = null;
		try {
			MailDeliveryImpl mailDelivery = new MailDeliveryImpl();
			mailDelivery.setMailProperties(props);
			servletContext.setAttribute(MailDelivery.ConfigAttributeName_MailDelivery, mailDelivery);

			mail = new MailNotificationImpl(atlasName, mailDelivery, couchDb);
			mail.setMailProperties(props);
			
		} catch(Exception e) {
			logger.error("Unable to configure mail notification",e);
		}

		mailNotification = mail;
	}

	private void initUpload(ServletContext servletContext) throws ServletException {
		
		Properties props = loadProperties("upload.properties", true);
		servletContext.setAttribute(UploadUtils.PROPERTIES_ATTRIBUTE, props);

		// Repository directory (this is where files are sent to)
		File repositoryDir = UploadUtils.getMediaDir(servletContext);
		
		UploadListener uploadListener = new UploadListener(couchDd,repositoryDir);
		servletContext.setAttribute(UploadServlet.OnUploadedListenerAttributeName, uploadListener);
		OnUploadedListenerSingleton.configure(uploadListener);
		
		try {
			UploadWorkerSettings settings = new UploadWorkerSettings(props);
			settings.setAtlasName(atlasName);
			
			uploadWorker = new UploadWorker(settings);
			uploadWorker.setDocumentDbDesign(couchDd);
			uploadWorker.setMediaDir(repositoryDir);
			uploadWorker.setMailNotification(mailNotification);
			{
				MultimediaFileConverter mmPlugin = new MultimediaFileConverter(props);
				mmPlugin.setAtlasName(atlasName);
				uploadWorker.addConversionPlugin( mmPlugin );
			}
			uploadWorker.addConversionPlugin( new GpxFileConverter() );
			uploadWorker.addConversionPlugin( new GeoJsonFileConverter() );
			{
				PdfFileConverter pdfPlugin = new PdfFileConverter(props);
				pdfPlugin.setAtlasName(atlasName);
				uploadWorker.addConversionPlugin( pdfPlugin );
			}
			uploadWorker.start();
		} catch (Exception e) {
			logger.error("Error starting upload worker",e);
			throw new ServletException("Error starting upload worker",e);
		}
	}

	private void initVetterDailyNotifications(ServletContext servletContext) throws ServletException {
		
		try {
			vetterDailyTask = MailVetterDailyNotificationTask.scheduleTask(
				couchDd
				,mailNotification
				);
		} catch (Exception e) {
			logger.error("Error starting daily vetter notifications",e);
			throw new ServletException("Error starting daily vetter notifications",e);
		}
	}

	private void initExport(ServletContext servletContext) throws ServletException {
		
		try {
			ExportConfiguration config = new ExportConfiguration();
			config.setCouchDb(couchDb);
			CouchDesignDocument atlasDesign = couchDb.getDesignDocument("atlas");
			config.setAtlasDesignDocument(atlasDesign);
			servletContext.setAttribute(ExportConfiguration.CONFIGURATION_KEY, config);

		} catch(Exception e) {
			logger.error("Error configuring export service",e);
			throw new ServletException("Error configuring export service",e);
		}
	}

	private void initUser(ServletContext servletContext) throws ServletException {
		
		try {
			CouchDb userDb = couchClient.getDatabase("_users");
			servletContext.setAttribute(UserServlet.ConfigAttributeName_UserDb, userDb);
			servletContext.setAttribute(UserServlet.ConfigAttributeName_AtlasName, atlasName);
		} catch(Exception e) {
			logger.error("Error configuring user service",e);
			throw new ServletException("Error configuring user service",e);
		}
	}

	private void uploadLogs(ServletContext servletContext) throws ServletException {
		// Load up configuration information
		Properties props = loadProperties("install.properties", true);
		
		if( false == props.containsKey("cron.working.dir") ) {
			logger.error("Property cron.working.dir not set in install.properties. Not uploading logs.");
			return;
		}
		
		// See if directory where CRON scripts are located can be found
		File workingDir = new File( props.getProperty("cron.working.dir") );
		File cronDir = new File(workingDir,"cron");
		if( false == cronDir.exists() || false == cronDir.isDirectory() ) {
			logger.error("Can not find cron directory at: "+cronDir.getAbsolutePath()+". Not uploading logs.");
			return;
		}
		
		// See if CRON logs are present
		File cronLogFile = new File(cronDir, "cron.log");
		if( false == cronLogFile.exists() || false == cronLogFile.isFile() ) {
			logger.error("Can not find cron log file at: "+cronLogFile.getAbsolutePath()+". Not uploading logs.");
			return;
		}
		
		CouchConfigFactory factory = new CouchConfigFactory();
		factory.setServerName(serverName);
		factory.setConfigDesign(configDesign);
		CouchConfig couchConfig = null;
		try {
			couchConfig = factory.retrieveConfigurationObject();
		} catch (Exception e) {
			logger.error("Can not load configuration object. Not uploading logs.",e);
			return;
		}

		try {
			couchConfig.uploadCronLogs(cronLogFile);
			logger.info("cron.log uploaded to configuration object");
		} catch (Exception e) {
			logger.error("Error while uploading cron logs. Not uploading logs.",e);
			return;
		}
	}
	
	public void destroy() {
		try {
			uploadWorker.stopTimeoutMillis(5*1000); // 5 seconds
		} catch (Exception e) {
			logger.error("Unable to shutdown upload worker", e);
		}

		try {
			configWorker.stopTimeoutMillis(5*1000); // 5 seconds
		} catch (Exception e) {
			logger.error("Unable to shutdown config listener worker", e);
		}

		try {
			replicationWorker.stopTimeoutMillis(5*1000); // 5 seconds
		} catch (Exception e) {
			logger.error("Unable to shutdown replication worker", e);
		}

		try {
			if(null != vetterDailyTask){
				vetterDailyTask.stop();
			}
		} catch (Exception e) {
			logger.error("Unable to shutdown daily vetter notifications", e);
		}
	}
}
