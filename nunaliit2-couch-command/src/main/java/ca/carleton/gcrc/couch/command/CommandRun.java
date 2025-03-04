package ca.carleton.gcrc.couch.command;

import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.impl.TransparentProxyFixedEscaped;
import ca.carleton.gcrc.couch.command.impl.TransparentWithRedirectServlet;
import ca.carleton.gcrc.couch.command.impl.InReachProxy;
import ca.carleton.gcrc.couch.command.servlet.ConfigServlet;
import ca.carleton.gcrc.couch.date.DateServlet;
import ca.carleton.gcrc.couch.export.ExportServlet;
import ca.carleton.gcrc.couch.metadata.IndexServlet;
import ca.carleton.gcrc.couch.metadata.RobotsServlet;
import ca.carleton.gcrc.couch.metadata.SitemapServlet;
import ca.carleton.gcrc.couch.simplifiedGeometry.SimplifiedGeometryServlet;
import ca.carleton.gcrc.couch.submission.SubmissionServlet;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.mail.MailServlet;
import ca.carleton.gcrc.progress.ProgressServlet;
import ca.carleton.gcrc.upload.UploadServlet;
import org.apache.log4j.Logger;
import org.apache.log4j.PatternLayout;
import org.apache.log4j.rolling.RollingFileAppender;
import org.apache.log4j.rolling.TimeBasedRollingPolicy;
import org.eclipse.jetty.proxy.ProxyServlet;
import org.eclipse.jetty.server.Connector;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.server.ServerConnector;
import org.eclipse.jetty.server.handler.gzip.GzipHandler;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;

import java.io.File;
import java.io.PrintStream;
import java.net.URL;

public class CommandRun implements Command {
	public static final String REQ_BUFFER_SIZE = "16384";

	@Override
	public String getCommandString() {
		return "run";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean isDeprecated() {
		return false;
	}

	@Override
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Run Command");
		ps.println();
		ps.println("The run command starts a server which serves the atlas content");
		ps.println("over the port specified during configuration. A user accesses");
		ps.println("the atlas by pointing a web browser to this port.");
		ps.println();
		ps.println("Once the server is started, it can be stopped by pressing CTRL-C.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit run <options>");
		ps.println();
		ps.println("options:");
		CommandHelp.reportGlobalOptions(ps,getExpectedOptions());
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}

		File atlasDir = gs.getAtlasDir();

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		// Send logs to file
		{
			Logger rootLogger = Logger.getRootLogger();

			TimeBasedRollingPolicy rollingPolicy = new TimeBasedRollingPolicy();
			File logDir = new File(gs.getAtlasDir(), "logs");
			rollingPolicy.setFileNamePattern(logDir.getAbsolutePath()+"/nunaliit.%d.gz");
			rollingPolicy.activateOptions();
			
			RollingFileAppender fileAppender = new RollingFileAppender();
			fileAppender.setRollingPolicy(rollingPolicy);
			fileAppender.setTriggeringPolicy(rollingPolicy);
			fileAppender.setLayout(new PatternLayout("%d{ISO8601}[%-5p]: %m%n"));
			fileAppender.activateOptions();
			
			rootLogger.addAppender(fileAppender);
		}
		
		// Verify that connection to the database is available
		CommandSupport.createCouchClient(gs, atlasProperties);
		
		// Figure out URLs to CouchDb
		URL serverUrl = null;
		URL dbUrl = null;
		URL siteRedirect = null;
		URL inreachUrl = null;
		{
			serverUrl = atlasProperties.getCouchDbUrl();
			String dbName = atlasProperties.getCouchDbName();

			dbUrl = new URL(serverUrl,dbName);
			siteRedirect = new URL(serverUrl,dbName+"/_design/site/_rewrite/");
			if(!atlasProperties.getInReachDbName().isEmpty()) {
				inreachUrl = new URL(serverUrl, atlasProperties.getInReachDbName());
			}
			
		}
		
		// Figure out media directory
		File mediaDir = new File(atlasDir, "media");

		// Create server
		Server server = new Server();
		ServerConnector serverConnector = new ServerConnector(server);
		serverConnector.setPort(atlasProperties.getServerPort());
		serverConnector.setIdleTimeout(300000L);
		server.setConnectors(new Connector[]{serverConnector});
		
		ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
		context.setContextPath("/");
		
		GzipHandler gzipHandler = new GzipHandler();
		gzipHandler.setIncludedMethods("GET", "POST");
		gzipHandler.setHandler(context);
		server.setHandler(gzipHandler);

        // Proxy to server
        {
        	ServletHolder servletHolder = new ServletHolder(new TransparentProxyFixedEscaped());
        	servletHolder.setInitParameter("proxyTo", serverUrl.toExternalForm());
        	servletHolder.setInitParameter("prefix", "/server");
        	servletHolder.setInitParameter("requestBufferSize", REQ_BUFFER_SIZE);
        	context.addServlet(servletHolder,"/server/*");
        }

        // Proxy to main database
        {
        	ServletHolder servletHolder = new ServletHolder(new TransparentProxyFixedEscaped());
        	servletHolder.setInitParameter("proxyTo", dbUrl.toExternalForm());
        	servletHolder.setInitParameter("prefix", "/db");
        	servletHolder.setInitParameter("requestBufferSize", REQ_BUFFER_SIZE);
        	context.addServlet(servletHolder,"/db/*");
        }

        // Proxy to submission database
        if( atlasProperties.isCouchDbSubmissionDbEnabled() ) {
			String submissionDbName = atlasProperties.getCouchDbSubmissionDbName();
			URL submissionDbUrl = new URL(serverUrl,submissionDbName);
        	
        	ServletHolder servletHolder = new ServletHolder(new ProxyServlet.Transparent());
        	servletHolder.setInitParameter("proxyTo", submissionDbUrl.toExternalForm());
        	servletHolder.setInitParameter("prefix", "/submitDb");
        	servletHolder.setInitParameter("requestBufferSize", REQ_BUFFER_SIZE);
        	context.addServlet(servletHolder,"/submitDb/*");
        }

		// Proxy to inreach DB
        if( !atlasProperties.getInReachDbName().isEmpty() ) {
			ServletHolder servletHolder = new ServletHolder(new InReachProxy(atlasProperties.getCouchDbAdminUser(), atlasProperties.getCouchDbAdminPassword()));
			servletHolder.setInitParameter("proxyTo", inreachUrl.toExternalForm());
			servletHolder.setInitParameter("prefix", "/"+atlasProperties.getInReachDbName());
			servletHolder.setInitParameter("requestBufferSize", REQ_BUFFER_SIZE);
			context.addServlet(servletHolder,"/" + atlasProperties.getInReachDbName() + "/*");
		}

        // Proxy to media
        {
        	ServletHolder servletHolder = new ServletHolder(new DefaultServlet());
        	servletHolder.setInitParameter("dirAllowed", "false");
        	servletHolder.setInitParameter("gzip", "true");
        	servletHolder.setInitParameter("pathInfoOnly", "true");
        	servletHolder.setInitParameter("resourceBase", mediaDir.getAbsolutePath());
        	context.addServlet(servletHolder,"/media/*");
        }

        // Servlet for configuration
        {
        	ServletHolder servletHolder = new ServletHolder(new ConfigServlet());
        	servletHolder.setInitParameter("atlasDir", atlasDir.getAbsolutePath());
        	servletHolder.setInitParameter("installDir", gs.getInstallDir().getAbsolutePath());
        	servletHolder.setInitOrder(1);
        	context.addServlet(servletHolder,"/servlet/configuration/*");
        }

        // Servlet for upload
        {
        	ServletHolder servletHolder = new ServletHolder(new UploadServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/upload/*");
        }

        // Servlet for progress
        {
        	ServletHolder servletHolder = new ServletHolder(new ProgressServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/progress/*");
        }

        // Servlet for export
        {
        	ServletHolder servletHolder = new ServletHolder(new ExportServlet());
			servletHolder.setInitParameter("exportUser", atlasProperties.getExportUser());
			servletHolder.setInitParameter("atlasRootPath", atlasProperties.getAtlasRootPath());
			servletHolder.setInitParameter("exportPassword", atlasProperties.getExportPassword());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/export/*");
        }

        // Servlet for user
        {
        	ServletHolder servletHolder = new ServletHolder(new UserServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/user/*");
        }

        // Servlet for submission
        {
        	ServletHolder servletHolder = new ServletHolder(new SubmissionServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/submission/*");
        }

        // Servlet for date
        {
        	ServletHolder servletHolder = new ServletHolder(new DateServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/date/*");
        }

        // Servlet for simplified geometry
        {
        	ServletHolder servletHolder = new ServletHolder(new SimplifiedGeometryServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/geometry/*");
        }

        // Servlet for mail
        {
        	ServletHolder servletHolder = new ServletHolder(new MailServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/mail/*");
        }

		// index.html servlet
		ServletHolder indexServlet = new ServletHolder(new IndexServlet());
		indexServlet.setInitOrder(2);
		context.addServlet(indexServlet, "/index.html");

		// Servlet for serving sitemap.xml
		ServletHolder sitemapServlet = new ServletHolder(new SitemapServlet());
		sitemapServlet.setInitOrder(2);
		context.addServlet(sitemapServlet, "/sitemap.xml");

		// robots.txt servlet
		ServletHolder robotsServlet = new ServletHolder(new RobotsServlet());
		robotsServlet.setInitOrder(2);
		context.addServlet(robotsServlet, "/robots.txt");

        // Proxy to site
        {
        	ServletHolder servletHolder = new ServletHolder(new TransparentWithRedirectServlet());
        	servletHolder.setInitParameter("proxyTo", siteRedirect.toExternalForm());
        	servletHolder.setInitParameter("prefix", "/");
        	servletHolder.setInitParameter("requestBufferSize", REQ_BUFFER_SIZE);
        	context.addServlet(servletHolder,"/*");
        }

		// Start server
		server.start();
		server.join();
	}
}
