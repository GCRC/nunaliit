package ca.carleton.gcrc.utils;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConfigUtils {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private File configurationDirectory = null;
	private File fallbackConfigurationDirectory = null;
	
	public ConfigUtils() {
		
	}

	public Properties loadProperties(String baseName, boolean loadDefault) throws ServletException {

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
	
	public void computeConfigurationDirectories(ServletContext servletContext) throws ServletException {
		
		logger.info("Initializing Relations Configuration");

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

}
