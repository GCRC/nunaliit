package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.net.URL;
import java.util.Stack;

import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.log4j.PatternLayout;
import org.apache.log4j.rolling.RollingFileAppender;
import org.apache.log4j.rolling.TimeBasedRollingPolicy;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.DefaultServlet;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlets.ProxyServlet;
import org.slf4j.bridge.SLF4JBridgeHandler;

import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.servlet.ConfigServlet;
import ca.carleton.gcrc.couch.export.ExportServlet;
import ca.carleton.gcrc.couch.user.UserServlet;
import ca.carleton.gcrc.progress.ProgressServlet;
import ca.carleton.gcrc.upload.UploadServlet;

public class CommandRun implements Command {

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
		ps.println("  nunaliit [<global-options>] run");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {
		
		File atlasDir = gs.getAtlasDir();

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);
		
		// Run command log4j configuration
		{
			Logger rootLogger = Logger.getRootLogger();
			
			rootLogger.setLevel(Level.INFO);

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

		// Capture java.util.Logger
		{
			 // Optionally remove existing handlers attached to j.u.l root logger
			 SLF4JBridgeHandler.removeHandlersForRootLogger();  // (since SLF4J 1.6.5)

			 // add SLF4JBridgeHandler to j.u.l's root logger, should be done once during
			 // the initialization phase of your application
			 SLF4JBridgeHandler.install();
		}
		
		// Verify that connection to the database is available
		CommandSupport.createCouchClient(gs, atlasProperties);
		
		// Figure out URLs to CouchDb
		URL serverUrl = null;
		URL dbUrl = null;
		URL siteRedirect = null;
		{
			serverUrl = atlasProperties.getCouchDbUrl();
			String dbName = atlasProperties.getCouchDbName();
			
			dbUrl = new URL(serverUrl,dbName);
			siteRedirect = new URL(serverUrl,dbName+"/_design/site/_rewrite/");
		}
		
		// Figure out media directory
		File mediaDir = new File(atlasDir, "media");

		// Create server
		Server server = new Server(atlasProperties.getServerPort());
		
		ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);

        // Proxy to server
        {
        	ServletHolder servletHolder = new ServletHolder(new ProxyServlet.Transparent());
        	servletHolder.setInitParameter("ProxyTo", serverUrl.toExternalForm());
        	servletHolder.setInitParameter("Prefix", "/server");
        	context.addServlet(servletHolder,"/server/*");
        }

        // Proxy to database
        {
        	ServletHolder servletHolder = new ServletHolder(new ProxyServlet.Transparent());
        	servletHolder.setInitParameter("ProxyTo", dbUrl.toExternalForm());
        	servletHolder.setInitParameter("Prefix", "/db");
        	context.addServlet(servletHolder,"/db/*");
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
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/export/*");
        }

        // Servlet for user
        {
        	ServletHolder servletHolder = new ServletHolder(new UserServlet());
        	servletHolder.setInitOrder(2);
        	context.addServlet(servletHolder,"/servlet/user/*");
        }

        // Proxy to site
        {
        	ServletHolder servletHolder = new ServletHolder(new ProxyServlet.Transparent());
        	servletHolder.setInitParameter("ProxyTo", siteRedirect.toExternalForm());
        	servletHolder.setInitParameter("Prefix", "/");
        	context.addServlet(servletHolder,"/*");
        }

		// Start server
		server.start();
		server.join();
	}

}
