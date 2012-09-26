package ca.carleton.gcrc.upload;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;

public class UploadUtils {

	static final protected Logger logger = Logger.getLogger(UploadUtils.class);
	
	public static final String CONF_DIR_ATTRIBUTE = "UploadConfigurationDirectory";
	static public final String PROPERTIES_ATTRIBUTE = "UploadProperties";
	static public final String MEDIA_DIR_ATTRIBUTE = "UploadMediaDirectory";
	
	static public Properties getProperties(ServletContext servletContext) {
		// Check if already computed
		Object propObj = servletContext.getAttribute(PROPERTIES_ATTRIBUTE);
		if( null != propObj && propObj instanceof Properties ) {
			return (Properties)propObj;
		}

		// Figure configuration directory
		File configurationDir = null;
		{
			Object configurationDirectory = 
				servletContext.getAttribute(CONF_DIR_ATTRIBUTE);
			if( configurationDirectory instanceof File ) {
				configurationDir = (File)configurationDirectory;
			}
		}
		if( null == configurationDir ) {
			String realRoot = servletContext.getRealPath("./WEB-INF");
			if( null != realRoot ) {
				configurationDir = new File(realRoot);
			}
		}

		// Figure default directory
		File defaultDir = null;
		{
			String realRoot = servletContext.getRealPath("./WEB-INF");
			if( null != realRoot ) {
				defaultDir = new File(realRoot);
			}
		}
		
		// Load up configuration information
		Properties props = new Properties();
		{
			File propFile = null;
			if( null != configurationDir ) {
				propFile = new File(configurationDir, "upload.properties");
				if( false == propFile.exists() 
				 || false == propFile.isFile() ) {
					propFile = null;
				}
			}
			if( null != defaultDir && null == propFile ) {
				propFile = new File(defaultDir, "upload.properties");
				if( false == propFile.exists() 
				 || false == propFile.isFile() ) {
					propFile = null;
				}
			}
			if( null != defaultDir && null == propFile ) {
				propFile = new File(defaultDir, "upload.properties.default");
				if( false == propFile.exists() 
				 || false == propFile.isFile() ) {
					propFile = null;
				}
			}
			if( null == propFile ) {
				logger.error("Property file location can not be determined");
			} else {
				logger.info("Reading properties from "+propFile.getAbsolutePath());
				FileInputStream fis = null;
				try {
					fis = new FileInputStream(propFile);
					props.load(fis);
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
		
		servletContext.setAttribute(PROPERTIES_ATTRIBUTE, props);
		
		return props;
	}
	
	static public File getMediaDir(ServletContext servletContext) {
		// Check if already computed
		Object dirObj = servletContext.getAttribute(MEDIA_DIR_ATTRIBUTE);
		if( null != dirObj && dirObj instanceof File ) {
			return (File)dirObj;
		}

		// Figure out root file
		File rootFile = null;
		{
			String realRoot = servletContext.getRealPath(".");
			if( null != realRoot ) {
				rootFile = new File(realRoot);
			}
		}
		
		Properties props = getProperties(servletContext);

		// Repository directory (this is where files are sent to)
		File repositoryDir = null;
		String repositoryDirName = props.getProperty("upload.repository.dir");
		if( null == repositoryDirName ) {
			repositoryDirName = props.getProperty("repositoryDir"); // legacy
		}
		if( null != repositoryDirName ) {
			repositoryDir = new File(repositoryDirName);
			if( false == repositoryDir.isAbsolute() ) {
				repositoryDir = new File(rootFile, repositoryDir.getPath());
			}
		} else {
			repositoryDir = new File(rootFile, "."); // current dir
		}
		logger.info("Repository directory is "+repositoryDir.getAbsolutePath());
		if( false == repositoryDir.exists() ) {
			logger.error("Repository directory does not exist! "+repositoryDir.getAbsolutePath());
		} else if( false == repositoryDir.isDirectory() ) {
			logger.error(repositoryDir.getAbsolutePath()+" is not a directory!");
		}
		
		servletContext.setAttribute(MEDIA_DIR_ATTRIBUTE, repositoryDir);
		
		return repositoryDir;
	}
}
