package ca.carleton.gcrc.couch.command.servlet;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

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
import ca.carleton.gcrc.couch.command.AtlasProperties;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.export.ExportConfiguration;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.onUpload.UploadListener;
import ca.carleton.gcrc.couch.onUpload.UploadWorker;
import ca.carleton.gcrc.couch.onUpload.UploadWorkerSettings;
import ca.carleton.gcrc.couch.onUpload.geojson.GeoJsonFileConverter;
import ca.carleton.gcrc.couch.onUpload.gpx.GpxFileConverter;
import ca.carleton.gcrc.couch.onUpload.mail.MailDeliveryImpl;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationImpl;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationNull;
import ca.carleton.gcrc.couch.onUpload.mail.MailVetterDailyNotificationTask;
import ca.carleton.gcrc.couch.onUpload.multimedia.MultimediaFileConverter;
import ca.carleton.gcrc.couch.onUpload.pdf.PdfFileConverter;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.upload.OnUploadedListenerSingleton;
import ca.carleton.gcrc.upload.UploadServlet;
import ca.carleton.gcrc.upload.UploadUtils;

/**
 * Configures the properties of the other servlets. Accepts init
 * parameters for configuration.
 *
 */
@SuppressWarnings("serial")
public class ConfigServlet extends HttpServlet {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private File atlasDir = null;
	private File installDir = null;
	private AtlasProperties atlasProperties = null;
	private CouchClient couchClient = null;
	private CouchDb serverDesign = null;
	private CouchDesignDocument couchDd = null;
	private UploadWorker uploadWorker = null;
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
			computeConfigurationDirectories(config);
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
			initServerDesignDocument(servletContext);
		} catch(ServletException e) {
			logger.error("Error while updating server design document",e);
			throw e;
		}
		
		// Upload design documents for _users database
		try {
			initUserDesignDocument(servletContext);
		} catch(ServletException e) {
			logger.error("Error while updating user design document",e);
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
		
		logger.info("Completed Couch Configuration");
	}

	private Properties loadProperties(String baseName, boolean loadDefault) throws ServletException {

		File configurationDirectory = new File(atlasDir,"config");
		File fallbackConfigurationDirectory = new File("/etc/nunaliit2");
		
		Properties props = new Properties();
		boolean atLeastOneFileFound = false;
		
		// Attempt to load default properties
		if( loadDefault ){
			File propFile = new File(fallbackConfigurationDirectory, baseName);
			if( propFile.exists() && propFile.isFile() ) {
				logger.info("Reading properties from "+propFile.getAbsolutePath());
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(propFile);
					props.load(fis);
					atLeastOneFileFound = true;
				} catch (Exception e) {
					logger.error("Unable to read properties from "+propFile.getAbsolutePath(),e);
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
		
		// Load up atlas-specific properties (overriding default properties)
		{
			File propFile = new File(configurationDirectory, baseName);
			if( propFile.exists() && propFile.isFile() ) {
				logger.info("Reading properties from "+propFile.getAbsolutePath());
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(propFile);
					props.load(fis);
					atLeastOneFileFound = true;
				} catch (Exception e) {
					logger.error("Unable to read properties from "+propFile.getAbsolutePath(),e);
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
		
		// Return null if nothing was read
		if( false == atLeastOneFileFound ) {
			props = null;
		}
		
		return props;
	}
	
	private void computeConfigurationDirectories(ServletConfig config) throws ServletException {
		
		if( null == config ) {
			throw new ServletException("No servlet configuration provided");
		}
		
		// Find directory for atlas
		{
			String atlasDirString = config.getInitParameter("atlasDir");
			if( null == atlasDirString ){
				throw new ServletException("Init parameter 'atlasDir' must be provided");
			}
			atlasDir = new File(atlasDirString);
			if( false == atlasDir.exists() ){
				throw new ServletException("Atlas directory not found: "+atlasDir.getAbsolutePath());
			}
			if( false == atlasDir.isDirectory() ){
				throw new ServletException("Atlas directory is not a directory: "+atlasDir.getAbsolutePath());
			}
		}

		// Load properties for atlas
		try {
			atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		} catch(Exception e) {
			throw new ServletException("Problem reading atlas properties",e);
		}
		
		// Pick up installation location
		{
			String installDirString = config.getInitParameter("installDir");
			if( null == installDirString ){
				throw new ServletException("Init parameter 'installDir' must be provided");
			}
			installDir = new File(installDirString);
			if( false == installDir.exists() ){
				throw new ServletException("Install directory not found: "+installDir.getAbsolutePath());
			}
			if( false == installDir.isDirectory() ){
				throw new ServletException("Install directory is not a directory: "+installDir.getAbsolutePath());
			}
		}
	}

	private void initCouchDbClient(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = new Properties();
		
		props.setProperty("couchdb.server", atlasProperties.getCouchDbUrl().toExternalForm());
		props.setProperty("couchdb.user", atlasProperties.getCouchDbAdminUser());
		props.setProperty("couchdb.password", atlasProperties.getCouchDbAdminPassword());
		
		// Create Couch Server from properties
		CouchFactory factory = new CouchFactory();
		try {
			couchClient = factory.getClient(props);
			
		} catch(Exception e) {
			logger.error("Unable to get Couch Server",e);
			throw new ServletException("Unable to get Couch Server",e);
		}
		
		// Create database
		String dbName = atlasProperties.getCouchDbName();
		try {
			serverDesign = couchClient.getDatabase(dbName);
		} catch(Exception e) {
			logger.error("Unable to connect to database: "+dbName,e);
			throw new ServletException("Unable to connect to database: "+dbName,e);
		}
		logger.info("CouchDb configured: "+serverDesign.getUrl());
	}

	private void initServerDesignDocument(ServletContext servletContext) throws ServletException {
		// Find root directory for design document
		File ddDir = PathComputer.computeServerDesignDir(installDir);
		if( null == ddDir ) {
			throw new ServletException("Unable to find design document source for upload");
		}
		if( false == ddDir.exists() || false == ddDir.isDirectory() ) {
			throw new ServletException("Invalid directory for server design doc: "+ddDir.getAbsolutePath());
		}

		// Load server design document
		Document doc = null;
		try {
			FSEntry entry = new FSEntryFile(ddDir);
			doc = DocumentFile.createDocument(entry);
		} catch(Exception e){
			throw new ServletException("Unable to read server design document",e);
		}
		
		// Update document
		try {
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(serverDesign);
			updateProcess.update(doc);
		} catch(Exception e) {
			throw new ServletException("Unable to update server design document",e);
		}
		
		try {
			couchDd = serverDesign.getDesignDocument("server");
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

	private void initMultimedia(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("multimedia.properties", true);
		if( null == props ){
			logger.error("Unable to load multimedia.properties");
		} else {
			MultimediaConfiguration.configureFromProperties(props);
		}
	}

	private void initMail(ServletContext servletContext) throws ServletException {
		
		// Load up configuration information
		Properties props = loadProperties("mail.properties", true);
		if( null == props ){
			logger.error("Unable to load mail.properties");
			mailNotification = new MailNotificationNull();
			
		} else {
			// Create mail notification
			MailNotificationImpl mail = null;
			try {
				MailDeliveryImpl mailDelivery = new MailDeliveryImpl();
				mailDelivery.setMailProperties(props);

				mail = new MailNotificationImpl(
					atlasProperties.getAtlasName()
					,mailDelivery
					,couchDd.getDatabase()
					);
				mail.setMailProperties(props);
				
			} catch(Exception e) {
				logger.error("Unable to configure mail notification",e);
			}

			mailNotification = mail;
		}
	}

	private void initUpload(ServletContext servletContext) throws ServletException {
		
		Properties props = loadProperties("upload.properties", true);
		if( null == props ){
			props = new Properties();
		}
		
		// Hard coded media dir overwrites user selection
		File mediaDir = new File(atlasDir, "media");
		if( false == mediaDir.exists() || false == mediaDir.isDirectory() ){
			throw new ServletException("Invalid media directory: "+mediaDir.getAbsolutePath());
		}
		props.setProperty("upload.repository.dir", mediaDir.getAbsolutePath());
		
		servletContext.setAttribute(UploadUtils.PROPERTIES_ATTRIBUTE, props);

		// Repository directory (this is where files are sent to)
		File repositoryDir = UploadUtils.getMediaDir(servletContext);
		
		UploadListener uploadListener = new UploadListener(couchDd,repositoryDir);
		servletContext.setAttribute(UploadServlet.OnUploadedListenerAttributeName, uploadListener);
		OnUploadedListenerSingleton.configure(uploadListener);
		
		try {
			UploadWorkerSettings settings = new UploadWorkerSettings(props);
			settings.setAtlasName(atlasProperties.getAtlasName());
			
			uploadWorker = new UploadWorker(settings);
			uploadWorker.setDesignDocument(couchDd);
			uploadWorker.setMediaDir(repositoryDir);
			uploadWorker.setMailNotification(mailNotification);
			{
				MultimediaFileConverter mmPlugin = new MultimediaFileConverter(props);
				mmPlugin.setAtlasName(atlasProperties.getAtlasName());
				uploadWorker.addConversionPlugin( mmPlugin );
			}
			uploadWorker.addConversionPlugin( new GpxFileConverter() );
			uploadWorker.addConversionPlugin( new GeoJsonFileConverter() );
			{
				PdfFileConverter pdfPlugin = new PdfFileConverter(props);
				pdfPlugin.setAtlasName(atlasProperties.getAtlasName());
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
			CouchDb couchDb = couchDd.getDatabase();
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
			servletContext.setAttribute(
				UserServlet.ConfigAttributeName_AtlasName
				,atlasProperties.getAtlasName()
				);
		} catch(Exception e) {
			logger.error("Error configuring user service",e);
			throw new ServletException("Error configuring user service",e);
		}
	}

	public void destroy() {
		try {
			uploadWorker.stopTimeoutMillis(5*1000); // 5 seconds
		} catch (Exception e) {
			logger.error("Unable to shutdown upload worker", e);
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
