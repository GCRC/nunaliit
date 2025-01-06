package ca.carleton.gcrc.couch.command.servlet;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.client.CouchUserDb;
import ca.carleton.gcrc.couch.client.impl.listener.HtmlAttachmentChangeListener;
import ca.carleton.gcrc.couch.client.impl.listener.ModuleMetadataChangeListener;
import ca.carleton.gcrc.couch.client.impl.listener.TextAttachmentChangeListener;
import ca.carleton.gcrc.couch.command.AtlasProperties;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.date.DateServletConfiguration;
import ca.carleton.gcrc.couch.export.ExportConfiguration;
import ca.carleton.gcrc.couch.export.ExportServlet;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.metadata.IndexServlet;
import ca.carleton.gcrc.couch.metadata.RobotsServlet;
import ca.carleton.gcrc.couch.metadata.SitemapBuilderAtlasChangeListener;
import ca.carleton.gcrc.couch.metadata.SitemapServlet;
import ca.carleton.gcrc.couch.onUpload.UploadListener;
import ca.carleton.gcrc.couch.onUpload.UploadWorker;
import ca.carleton.gcrc.couch.onUpload.UploadWorkerSettings;
import ca.carleton.gcrc.couch.onUpload.geojson.GeoJsonFileConverter;
import ca.carleton.gcrc.couch.onUpload.gpx.GpxFileConverter;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachConfiguration;
import ca.carleton.gcrc.couch.onUpload.inReach.InReachSettingsFromXmlFile;
import ca.carleton.gcrc.couch.onUpload.mail.DailyVetterNotificationGenerator;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotification;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationImpl;
import ca.carleton.gcrc.couch.onUpload.mail.MailNotificationNull;
import ca.carleton.gcrc.couch.onUpload.mail.MailVetterDailyNotificationTask;
import ca.carleton.gcrc.couch.onUpload.mail.UploadNotificationGenerator;
import ca.carleton.gcrc.couch.onUpload.multimedia.MultimediaFileConverter;
import ca.carleton.gcrc.couch.onUpload.pdf.PdfFileConverter;
import ca.carleton.gcrc.couch.simplifiedGeometry.SimplifiedGeometryServletConfiguration;
import ca.carleton.gcrc.couch.submission.SubmissionRobot;
import ca.carleton.gcrc.couch.submission.SubmissionRobotSettings;
import ca.carleton.gcrc.couch.submission.SubmissionServlet;
import ca.carleton.gcrc.couch.submission.mail.DocumentCreatedGenerator;
import ca.carleton.gcrc.couch.submission.mail.SubmissionApprovalGenerator;
import ca.carleton.gcrc.couch.submission.mail.SubmissionMailNotifier;
import ca.carleton.gcrc.couch.submission.mail.SubmissionMailNotifierImpl;
import ca.carleton.gcrc.couch.submission.mail.SubmissionMailNotifierNull;
import ca.carleton.gcrc.couch.submission.mail.SubmissionRejectionGenerator;
import ca.carleton.gcrc.couch.submission.mail.SubmissionAcceptedGenerator;
import ca.carleton.gcrc.couch.submission.SubmissionConstants;
import ca.carleton.gcrc.couch.user.UserDesignDocumentImpl;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.couch.utils.CouchDbTemplateMailMessageGenerator;
import ca.carleton.gcrc.couch.utils.CouchNunaliitConstants;
import ca.carleton.gcrc.json.servlet.JsonServlet;
import ca.carleton.gcrc.mail.MailDelivery;
import ca.carleton.gcrc.mail.MailDeliveryImpl;
import ca.carleton.gcrc.mail.MailDeliveryNull;
import ca.carleton.gcrc.mail.MailServiceRecipients;
import ca.carleton.gcrc.mail.MailServletConfiguration;
import ca.carleton.gcrc.mail.messageGenerator.FormEmailMessageGenerator;
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;
import ca.carleton.gcrc.olkit.multimedia.utils.MultimediaConfiguration;
import ca.carleton.gcrc.security.rng.RngFactory;
import ca.carleton.gcrc.upload.OnUploadedListenerSingleton;
import ca.carleton.gcrc.upload.UploadServlet;
import ca.carleton.gcrc.upload.UploadUtils;
import ca.carleton.gcrc.utils.VersionUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Collection;
import java.util.Enumeration;
import java.util.List;
import java.util.Properties;

/**
 * Configures the properties of the other servlets. Accepts init
 * parameters for configuration.
 *
 */
@SuppressWarnings("serial")
public class ConfigServlet extends JsonServlet {
	final protected static char[] hexArray = "0123456789ABCDEF".toCharArray();
	static public String bytesToHex(byte[] bytes) {
	    char[] hexChars = new char[bytes.length * 2];
	    for ( int j = 0; j < bytes.length; j++ ) {
	        int v = bytes[j] & 0xFF;
	        hexChars[j * 2] = hexArray[v >>> 4];
	        hexChars[j * 2 + 1] = hexArray[v & 0x0F];
	    }
	    return new String(hexChars);
	}

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private File atlasDir = null;
	private File installDir = null;
	private AtlasProperties atlasProperties = null;
	private CouchClient couchClient = null;
	private String documentDatabaseName = null;
	private CouchDb documentDatabase = null;
	private CouchUserDb userDb = null;
	private CouchDb submissionDb = null;
	private CouchDesignDocument couchDd = null;
	private UploadWorker uploadWorker = null;
	private SubmissionRobot submissionRobot = null;
	private MailNotification mailNotification = null;
	private SubmissionMailNotifier submissionNotifier = null;
	private MailVetterDailyNotificationTask vetterDailyTask = null;
	private ConfigServletActions actions = null;
	private SitemapBuilderAtlasChangeListener sitemapBuilder;
	private HtmlAttachmentChangeListener indexChangeListener;
	private TextAttachmentChangeListener robotsChangeListener;
	private ModuleMetadataChangeListener moduleMetadataChangeListener;
	private SecureRandom rng = null;

	public ConfigServlet() {

	}

	public void init(ServletConfig config) throws ServletException {
		super.init(config);

		logger.info("Initializing Couch Configuration");

		// Build RNG
		{
			RngFactory rngFactory = new RngFactory();
			rng = rngFactory.createRng();
		}

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
		}

		// Configure upload
		try {
			initUpload(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing upload",e);
			throw e;
		}

		// Configure submission robot
		try {
			initSubmissionRobot(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing submission robot",e);
			throw e;
		}

		// Configure submission servlet
		try {
			initSubmission(servletContext);
		} catch(ServletException e) {
			logger.error("Error while configuring submission servlet",e);
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

		// Configure date
		try {
			initDate(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing date service",e);
			throw e;
		}

		// Configure simplifiedGeometry
		try {
			initSimplifiedGeometry(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing simplified geometry service",e);
			throw e;
		}

		// Configure user
		try {
			initUser(servletContext);
		} catch(ServletException e) {
			logger.error("Error while initializing user service",e);
			throw e;
		}

		// Configure actions
		try {
			initActions(servletContext);
		} catch(ServletException e) {
			logger.error("Error while creating actions",e);
			throw e;
		}

		try {
			initSitemap(servletContext);
		}
		catch (ServletException e) {
			logger.error("Error initializing sitemap servlet", e);
			throw e;
		}

		try {
			initIndex(servletContext);
		}
		catch (ServletException e) {
			logger.error("Error initializing index servlet", e);
			throw e;
		}

		try {
			initRobots(servletContext);
		}
		catch (ServletException e) {
			logger.error("Error initializing robots servlet", e);
			throw e;
		}

		logger.info("Completed Couch Configuration");
	}

	private Properties loadProperties(String baseName, boolean loadDefault) throws ServletException {
		return loadProperties(baseName, loadDefault, null);
	}

	private Properties loadProperties(String baseName, boolean loadDefault, Properties defaultValues) throws ServletException {

		File configurationDirectory = new File(atlasDir,"config");
		File fallbackConfigurationDirectory = new File("/etc/nunaliit2");

		Properties props = new Properties();
		boolean atLeastOneFileFound = false;

		if( null != defaultValues ) {
			atLeastOneFileFound = true;

			Enumeration<?> propNameEnum = defaultValues.propertyNames();
			while(propNameEnum.hasMoreElements()){
				Object keyObj = propNameEnum.nextElement();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					String value = defaultValues.getProperty(key);
					props.put(key, value);
				}
			}
		}


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
		documentDatabaseName = atlasProperties.getCouchDbName();
		try {
			documentDatabase = couchClient.getDatabase(documentDatabaseName);
		} catch(Exception e) {
			logger.error("Unable to connect to document database: "+documentDatabaseName,e);
			throw new ServletException("Unable to connect to document database: "+documentDatabaseName,e);
		}
		logger.info("Document database configured: "+documentDatabase.getUrl());

		// User database
		try {
			userDb = couchClient.getUserDatabase();
		} catch(Exception e) {
			logger.error("Unable to connect to _users database",e);
			throw new ServletException("Unable to connect to _users database",e);
		}
		logger.info("User database configured: "+userDb.getUrl());

		// Submission database
		if( atlasProperties.isCouchDbSubmissionDbEnabled() ){
			try {
				String submissionDbName = atlasProperties.getCouchDbSubmissionDbName();
				submissionDb = couchClient.getDatabase(submissionDbName);

			} catch(Exception e) {
				logger.error("Unable to connect to submission database",e);
				throw new ServletException("Unable to connect to submission database",e);
			}
			logger.info("Submission database configured: "+submissionDb.getUrl());
		}
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
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(documentDatabase);
			updateProcess.update(doc);
		} catch(Exception e) {
			throw new ServletException("Unable to update server design document",e);
		}

		try {
			couchDd = documentDatabase.getDesignDocument("server");
		} catch (Exception e) {
			throw new ServletException("Unable to get design document", e);
		}
	}

	private void initUserDesignDocument(ServletContext servletContext) throws ServletException {
		// Update document
		try {
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
		try {
			MailDelivery mailDelivery = null;

			MailServiceRecipients mailServiceRecipients = new MailServiceRecipientsCouchDb(
					atlasProperties.getAtlasName(),
					UserDesignDocumentImpl.getUserDesignDocument(couchClient)
					);

			// Load up configuration information
			Properties sensitiveProps = loadProperties("sensitive.properties", true);
			Properties props = loadProperties("mail.properties", true, sensitiveProps);
			if( null == props  ){
				logger.error("Unable to load mail.properties");
				mailNotification = new MailNotificationNull();
				this.submissionNotifier = new SubmissionMailNotifierNull();

				mailDelivery = new MailDeliveryNull();

			} else {
				// Create mail notification
				MailNotificationImpl mail = null;
				SubmissionMailNotifierImpl submissionNotifier = null;

				// Mail delivery
				{
					MailDeliveryImpl mailDeliveryImpl = new MailDeliveryImpl();
					mailDeliveryImpl.setMailProperties(props);
					servletContext.setAttribute(MailDelivery.ConfigAttributeName_MailDelivery, mailDeliveryImpl);
					mailDelivery = mailDeliveryImpl;
				}

				mail = new MailNotificationImpl(
					atlasProperties.getAtlasName()
					,mailDelivery
					,couchDd.getDatabase()
					);
				mail.setMailProperties(props);

				// Mail templates
				{
					MailMessageGenerator template = new UploadNotificationGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.upload",
						template
						);
					mail.setUploadNotificationGenerator(couchdbTemplate);
				}
				{
					MailMessageGenerator template = new DailyVetterNotificationGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.daily_vetter",
						template
						);
					mail.setDailyVetterNotificationGenerator(couchdbTemplate);
				}

				submissionNotifier = new SubmissionMailNotifierImpl(
					atlasProperties.getAtlasName()
					,mailDelivery
					,couchDd.getDatabase()
					);
				submissionNotifier.parseMailProperties(props);

				// Mail templates
				{
					MailMessageGenerator template = new SubmissionApprovalGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.submission_approval",
						template
						);
					submissionNotifier.setApprovalGenerator(couchdbTemplate);
				}
				{
					MailMessageGenerator template = new SubmissionRejectionGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.submission_rejection",
						template
						);
					submissionNotifier.setRejectionGenerator(couchdbTemplate);
				}
				{
					MailMessageGenerator template = new DocumentCreatedGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.schema_emailOnCreate",
						template
						);
					submissionNotifier.setDocumentCreatedGenerator(couchdbTemplate);
				}
				{
					MailMessageGenerator template = new SubmissionAcceptedGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.submission_accepted",
						template
						);
					submissionNotifier.setSubmissionAcceptedGenerator(couchdbTemplate);
				}

				mailNotification = mail;
				this.submissionNotifier = submissionNotifier;

			}

			// Mail Service
			{
				MailServletConfiguration mailServletConfiguration = new MailServletConfiguration();
				mailServletConfiguration.setAtlasName(atlasProperties.getAtlasName());
				mailServletConfiguration.setMailDelivery(mailDelivery);
				mailServletConfiguration.setRecipients(mailServiceRecipients);

				// Mail template for form e-mail
				{
					MailMessageGenerator template = new FormEmailMessageGenerator();
					CouchDbTemplateMailMessageGenerator couchdbTemplate = new CouchDbTemplateMailMessageGenerator(
						documentDatabase,
						"org.nunaliit.email_template.form_email",
						template
						);
					mailServletConfiguration.setFormEmailGenerator(couchdbTemplate);
				}

				servletContext.setAttribute(MailServletConfiguration.CONFIGURATION_KEY, mailServletConfiguration);
			}

		} catch(Exception e) {
			mailNotification = new MailNotificationNull();
			this.submissionNotifier = new SubmissionMailNotifierNull();

			logger.error("Unable to configure mail notification",e);
			throw new ServletException("Unable to configure mail notification",e);
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
			boolean created = mediaDir.mkdir();
			if( false == created ){
				throw new ServletException("Unable to create media directory: "+ mediaDir.getAbsolutePath());
			} else {
				logger.info("Created media directory: "+ mediaDir.getAbsolutePath());
			}
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
			if( atlasProperties.isGeometrySimplificationDisabled() ){
				settings.setGeometrySimplificationDisabled(true);
			}

			// InReach configuration
			File configDir = new File(atlasDir, "config");
			if( configDir.exists() && configDir.isDirectory() ){
				File inReachFile = new File(configDir, "inreach_forms.xml");
				if( inReachFile.exists() && inReachFile.isFile() ){
					InReachSettingsFromXmlFile inReachSettings = new InReachSettingsFromXmlFile(inReachFile);
					inReachSettings.load();
					InReachConfiguration.setInReachSettings(inReachSettings);
				}
			}

			uploadWorker = new UploadWorker(settings);
			uploadWorker.setDocumentDbDesign(couchDd);
			uploadWorker.setMediaDir(repositoryDir);
			uploadWorker.setMailNotification(mailNotification);
			props.setProperty("atlas.name", atlasProperties.getAtlasName());
			uploadWorker.setUploadProperties(props);
			{
				MultimediaFileConverter mmPlugin = new MultimediaFileConverter(props);
				mmPlugin.setAtlasName(atlasProperties.getAtlasName());
			}
			{
				PdfFileConverter pdfPlugin = new PdfFileConverter(props);
				pdfPlugin.setAtlasName(atlasProperties.getAtlasName());
			}
			if( null != submissionDb ){
				CouchDesignDocument submissionDbDesign = submissionDb.getDesignDocument("submission");
				uploadWorker.setSubmissionDbDesign(submissionDbDesign);
			}
			uploadWorker.start();
		} catch (Exception e) {
			logger.error("Error starting upload worker",e);
			throw new ServletException("Error starting upload worker",e);
		}
	}

	private void initSubmissionRobot(ServletContext servletContext) throws ServletException {

		try {
			// Is submission DB enabled
			if( null != submissionDb ){
				CouchDesignDocument submissionDesign = submissionDb.getDesignDocument("submission");

				SubmissionRobotSettings settings = new SubmissionRobotSettings();
				settings.setAtlasName(atlasProperties.getAtlasName());
				settings.setDocumentDesignDocument(couchDd);
				settings.setSubmissionDesignDocument(submissionDesign);
				settings.setUserDb(userDb);
				settings.setMailNotifier(submissionNotifier);

				submissionRobot = new SubmissionRobot(settings);

				submissionRobot.start();

			} else {
				logger.info("Submission database is not enabled");
			}

		} catch (Exception e) {
			logger.error("Error starting submission worker",e);
			throw new ServletException("Error starting submission worker",e);
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
			servletContext.setAttribute(ExportServlet.ConfigAttributeName_AtlasName, atlasProperties.getAtlasName());

		} catch(Exception e) {
			logger.error("Error configuring export service",e);
			throw new ServletException("Error configuring export service",e);
		}
	}

	private void initDate(ServletContext servletContext) throws ServletException {

		try {
			DateServletConfiguration config = new DateServletConfiguration();
			CouchDb couchDb = couchDd.getDatabase();
			config.setCouchDb(couchDb);
			CouchDesignDocument atlasDesign = couchDb.getDesignDocument("atlas");
			config.setAtlasDesignDocument(atlasDesign);
			servletContext.setAttribute(DateServletConfiguration.CONFIGURATION_KEY, config);

		} catch(Exception e) {
			logger.error("Error configuring date service",e);
			throw new ServletException("Error configuring date service",e);
		}
	}

	private void initSimplifiedGeometry(ServletContext servletContext) throws ServletException {

		try {
			SimplifiedGeometryServletConfiguration config = new SimplifiedGeometryServletConfiguration();
			CouchDb couchDb = couchDd.getDatabase();
			config.setCouchDb(couchDb);
			servletContext.setAttribute(SimplifiedGeometryServletConfiguration.CONFIGURATION_KEY, config);

		} catch(Exception e) {
			logger.error("Error configuring simplified geometry service",e);
			throw new ServletException("Error configuring simplified geometry service",e);
		}
	}

	private void initUser(ServletContext servletContext) throws ServletException {

		try {
			servletContext.setAttribute(UserServlet.ConfigAttributeName_UserDb, userDb);
			servletContext.setAttribute(
				UserServlet.ConfigAttributeName_AtlasName
				,atlasProperties.getAtlasName()
				);
			servletContext.setAttribute(UserServlet.ConfigAttributeName_DocumentDb, documentDatabase);

			byte[] serverKey = atlasProperties.getServerKey();
			if( null != serverKey ) {
				ByteBuffer serverKeyBuffer = ByteBuffer.wrap( serverKey );
				servletContext.setAttribute(
					UserServlet.ConfigAttributeName_ServerKey
					,serverKeyBuffer
					);
			}
		} catch(Exception e) {
			logger.error("Error configuring user service",e);
			throw new ServletException("Error configuring user service",e);
		}
	}

	private void initSubmission(ServletContext servletContext) throws ServletException {
		try {
			servletContext.setAttribute(SubmissionServlet.ConfigAttributeName_AtlasName,
					atlasProperties.getAtlasName());
			servletContext.setAttribute(SubmissionServlet.ConfigAttributeName_UserDb, userDb);
			servletContext.setAttribute(SubmissionServlet.ConfigAttributeName_DocumentDesign, couchDd);
			servletContext.setAttribute(
					SubmissionServlet.ConfigAttributeName_Submission_UnauthenticatedRecordsEndpointEnabled,
					atlasProperties.isCouchDbSubmissionUnauthenticatedRecordsEndpointEnabled());
			servletContext.setAttribute("couchdb.server", atlasProperties.getCouchDbUrl().toExternalForm());
			servletContext.setAttribute(SubmissionConstants.PROP_ATTR_SUBMISSION_UNAUTHENTICATED_RECORDS_USER,
					atlasProperties.getCouchDbSubmissionUnauthenticatedRecordsUser());
			servletContext.setAttribute(SubmissionConstants.PROP_ATTR_SUBMISSION_UNAUTHENTICATED_RECORDS_USER_PASSWORD,
					atlasProperties.getCouchDbSubmissionUnauthenticatedRecordsUserPassword());

			// Is submission DB enabled?
			if( null != submissionDb ){
				CouchDesignDocument submissionDesign = submissionDb.getDesignDocument("submission");

				servletContext.setAttribute(SubmissionServlet.ConfigAttributeName_SubmissionDesign, submissionDesign);
			}

		} catch (Exception e) {
			logger.error("Error configuring submission servlet",e);
			throw new ServletException("Error configuring submission servlet",e);
		}

		try {
			servletContext.setAttribute(UserServlet.ConfigAttributeName_UserDb, userDb);
			servletContext.setAttribute(
				UserServlet.ConfigAttributeName_AtlasName
				,atlasProperties.getAtlasName()
				);
			servletContext.setAttribute(UserServlet.ConfigAttributeName_DocumentDb, documentDatabase);

			byte[] serverKey = atlasProperties.getServerKey();
			if( null != serverKey ) {
				ByteBuffer serverKeyBuffer = ByteBuffer.wrap( serverKey );
				servletContext.setAttribute(
					UserServlet.ConfigAttributeName_ServerKey
					,serverKeyBuffer
					);
			}
		} catch(Exception e) {
			logger.error("Error configuring user service",e);
			throw new ServletException("Error configuring user service",e);
		}
	}

	private void initActions(ServletContext servletContext) throws ServletException {

		try {
			this.actions = new ConfigServletActions(documentDatabase, documentDatabaseName);
			this.actions.setSubmissionDbEnabled( atlasProperties.isCouchDbSubmissionDbEnabled() );
		} catch(Exception e) {
			logger.error("Error configuring actions",e);
			throw new ServletException("Error configuring actions",e);
		}
	}

	private void initSitemap(ServletContext servletContext) throws ServletException {
		try {
			sitemapBuilder = new SitemapBuilderAtlasChangeListener(documentDatabase, CouchNunaliitConstants.ATLAS_DOC_ID);
			sitemapBuilder.start();

			servletContext.setAttribute(SitemapServlet.SITEMAP_BUILDER, sitemapBuilder);
		}
		catch (Exception e) {
			logger.error("Error configuring sitemap servlet", e);
			throw new ServletException("Error configuring sitemap servlet", e);
		}
	}

	private void initIndex(ServletContext servletContext) throws ServletException {
		try {
			// Watch index.html
			indexChangeListener = new HtmlAttachmentChangeListener(documentDatabase, CouchNunaliitConstants.SITE_DESIGN_DOC_ID,
					CouchNunaliitConstants.INDEX_HTML);
			indexChangeListener.start();
			// Watches all module documents.
			moduleMetadataChangeListener = new ModuleMetadataChangeListener(documentDatabase);
			moduleMetadataChangeListener.start();

			servletContext.setAttribute(IndexServlet.CONFIG_DOCUMENT_DB, documentDatabase);
			servletContext.setAttribute(IndexServlet.INDEX_DB_CHANGE_LISTENER, indexChangeListener);
			servletContext.setAttribute(IndexServlet.MODULE_METADATA_CHANGE_LISTENER, moduleMetadataChangeListener);
		}
		catch (Exception e) {
			logger.error("Error configuring index servlet", e);
			throw new ServletException("Error configuring index servlet", e);
		}
	}

	private void initRobots(ServletContext servletContext) throws ServletException {
		try {
			robotsChangeListener = new TextAttachmentChangeListener(documentDatabase, CouchNunaliitConstants.SITE_DESIGN_DOC_ID,
					CouchNunaliitConstants.ROBOTS_TXT);
			robotsChangeListener.start();

			servletContext.setAttribute(RobotsServlet.ROBOTS_TXT_CHANGE_LISTENER, robotsChangeListener);
		}
		catch (Exception e) {
			logger.error("Error configuring index servlet", e);
			throw new ServletException("Error configuring index servlet", e);
		}
	}

	public void destroy() {
		try {
			uploadWorker.stopTimeoutMillis(5*1000); // 5 seconds
		} catch (Exception e) {
			logger.error("Unable to shutdown upload worker", e);
		}

		try {
			if( submissionRobot != null ) {
				submissionRobot.stopTimeoutMillis(5*1000); // 5 seconds
			}
		} catch (Exception e) {
			logger.error("Unable to shutdown submission worker", e);
		}

		try {
			if(null != vetterDailyTask){
				vetterDailyTask.stop();
			}
		} catch (Exception e) {
			logger.error("Unable to shutdown daily vetter notifications", e);
		}

		try {
			documentDatabase.getChangeMonitor().shutdown();
		} catch(Exception e) {
			logger.error("Unable to shutdown change monitor on document database", e);
		}

		try {
			userDb.getChangeMonitor().shutdown();
		} catch(Exception e) {
			logger.error("Unable to shutdown change monitor on user database", e);
		}

		try {
			if( null != submissionDb ) {
				submissionDb.getChangeMonitor().shutdown();
			}
		} catch(Exception e) {
			logger.error("Unable to shutdown change monitor on submission database", e);
		}

		try {
			if (sitemapBuilder != null) {
				sitemapBuilder.shutdown();
			}
		}
		catch (Exception e) {
			logger.error("Error occurred while attempting to shutdown sitemap builder", e);
		}

		try {
			if (indexChangeListener != null) {
				indexChangeListener.shutdown();
			}
		}
		catch (Exception e) {
			logger.error("Error occurred while attempting to shutdown index.html DB change listener", e);
		}

		try {
			if (moduleMetadataChangeListener != null) {
				moduleMetadataChangeListener.shutdown();
			}
		}
		catch (Exception e) {
			logger.error("Error occurred while attempting to shutdown module metadata DB change listener", e);
		}

		try {
			if (robotsChangeListener != null) {
				robotsChangeListener.shutdown();
			}
		}
		catch (Exception e) {
			logger.error("Error occurred while attempting to shutdown robots.txt DB change listener", e);
		}
	}

	@Override
	protected void doGet(
		HttpServletRequest req
		,HttpServletResponse resp
		) throws ServletException, IOException {

		try {
			List<String> path = computeRequestPath(req);


			if( path.size() < 1 ) {
				JSONObject result = actions.getWelcome();
				sendJsonResponse(resp, result);

			} else if( path.size() == 1
			 && "getAtlases".equals(path.get(0)) ) {
				List<AtlasInfo> atlases = actions.getNunaliitAtlases();

				JSONObject result = new JSONObject();
				result.put("ok", true);

				JSONArray jsonAtlases = new JSONArray();
				for(AtlasInfo info : atlases){
					jsonAtlases.put( info.toJSON() );
				}
				result.put("atlases", jsonAtlases);

				sendJsonResponse(resp, result);

			} else if( path.size() == 1
			 && "getServerRoles".equals(path.get(0)) ) {
				Collection<String> roles = actions.getNunaliitServerRoles();

				JSONObject result = new JSONObject();
				result.put("ok", true);

				JSONArray jsonRoles = new JSONArray();
				for(String role : roles){
					jsonRoles.put( role );
				}
				result.put("roles", jsonRoles);

				sendJsonResponse(resp, result);

			} else if( path.size() == 1
			 && "getAtlasRoles".equals(path.get(0)) ) {
				AtlasInfo currentInfo = actions.getCurrentAtlasInfo();

				Collection<String> roles = actions.getNunaliitAtlasRoles(currentInfo);

				JSONObject result = new JSONObject();
				result.put("ok", true);

				JSONArray jsonRoles = new JSONArray();
				for(String role : roles){
					jsonRoles.put( role );
				}
				result.put("roles", jsonRoles);

				sendJsonResponse(resp, result);

			} else if( path.size() == 1
			 && "testChannel".equals(path.get(0)) ) {
				// This call should always return a different answer.
				// It is used by clients to test if it is sitting behind
				// a proxy that does not respect caching headings

				JSONObject result = new JSONObject();
				result.put("ok", true);

				{
					String version = VersionUtils.getVersion();
					if( null != version ){
						result.put("version", version);
					}
				}

				{
					String buildStr = VersionUtils.getBuildString();
					if( null != buildStr ){
						result.put("build", buildStr);
					}
				}

				// Get 128 random bits
				byte[] bytes = new byte[16];
				rng.nextBytes(bytes);
				String hexBytes = bytesToHex(bytes);
				result.put("random", hexBytes);

				// Do not use sendJsonResponse. Instead, imitate CouchDB response headers
				// sendJsonResponse(resp, result);
				resp.setContentType("application/json");
				resp.setCharacterEncoding("utf-8");
				resp.addHeader("Cache-Control", "must-revalidate");

				OutputStreamWriter osw = new OutputStreamWriter(resp.getOutputStream(), "UTF-8");
				result.write(osw);
				osw.flush();

			} else {
				throw new Exception("Invalid action requested");
			}

		} catch(Exception e) {
			reportError(e, resp);
		}
	}
}
