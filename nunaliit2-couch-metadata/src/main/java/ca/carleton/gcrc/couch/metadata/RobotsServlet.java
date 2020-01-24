package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.impl.listener.TextAttachmentChangeListener;
import ca.carleton.gcrc.couch.utils.CouchNunaliitUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Adds "Sitemap:" to the robots.txt from the database. Crawlers assume full access to site unless "Disallow" specified
 * in robots.txt. Currently implementation assumes full access.
 * See https://developers.google.com/search/reference/robots_txt for robots.txt specs.
 */
public class RobotsServlet extends HttpServlet {
    public static final String ROBOTS_TXT_CHANGE_LISTENER = "RobotsServlet_RobotsDbChangeListener";
    private static final Logger logger = LoggerFactory.getLogger(RobotsServlet.class);

    private TextAttachmentChangeListener robotsDbChangeListener;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        logger.info("Initialization started");

        ServletContext context = config.getServletContext();

        Object dbListener = context.getAttribute(ROBOTS_TXT_CHANGE_LISTENER);
        if (dbListener == null) {
            logger.error(String.format("Robots DB change listener is not specified (%s)", ROBOTS_TXT_CHANGE_LISTENER));
            throw new ServletException(String.format("Robots DB change listener is not specified (%s)", ROBOTS_TXT_CHANGE_LISTENER));
        }
        else if (dbListener instanceof TextAttachmentChangeListener) {
            robotsDbChangeListener = (TextAttachmentChangeListener) dbListener;
        }
        else {
            throw new ServletException("Unexpected object type for robots DB change listener: " + dbListener.getClass().getName());
        }

        logger.info("Initialization finished");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) {
        StringBuilder robotsResponse = new StringBuilder();
        String baseUrl = CouchNunaliitUtils.buildBaseUrl(request);
        // Latest robots.txt from DB listener.
        String robotsTxt = robotsDbChangeListener.getAttachment();
        if (StringUtils.isNotBlank(robotsTxt)) {
            robotsResponse.append(robotsTxt);
            robotsResponse.append(System.lineSeparator());
            robotsResponse.append(System.lineSeparator());
        }
        // Add sitemap link.
        robotsResponse.append(String.format("Sitemap: %ssitemap.xml", baseUrl));

        response.setStatus(HttpServletResponse.SC_OK);
        response.setContentType("text/plain");
        response.setCharacterEncoding(StandardCharsets.UTF_8.toString());
        try {
            OutputStream os = response.getOutputStream();
            os.write(robotsResponse.toString().getBytes());
        }
        catch (IOException e) {
            logger.error("Problem outputting robots.txt", e);
        }
    }

    @Override
    public void destroy() {
        super.destroy();
        logger.info("Destroyed");
    }
}
