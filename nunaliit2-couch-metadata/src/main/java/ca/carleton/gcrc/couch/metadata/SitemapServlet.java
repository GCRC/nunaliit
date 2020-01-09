package ca.carleton.gcrc.couch.metadata;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.XMLStreamWriter;
import java.io.IOException;
import java.util.List;

/**
 * Generates an XML response for sitemap.xml requests.
 */
public class SitemapServlet extends HttpServlet {
    public static final String SITEMAP_BUILDER = "SitemapServlet_SitemapBuilder";
    private static final Logger logger = LoggerFactory.getLogger(SitemapServlet.class);

    private static final String SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9";

    /**
     * Provides access to the current list of relative URLs required to create sitemap XML response.
     */
    private SitemapBuilder sitemapBuilder;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        logger.info("Initialization started");

        ServletContext context = config.getServletContext();
        Object obj = context.getAttribute(SITEMAP_BUILDER);
        if (obj == null) {
            logger.error(String.format("SitemapBuilder is not specified (%s)", SITEMAP_BUILDER));
            throw new ServletException(String.format("SitemapBuilder is not specified (%s)", SITEMAP_BUILDER));
        }
        else if (obj instanceof SitemapBuilder) {
            sitemapBuilder = (SitemapBuilder) obj;
        }
        else {
            throw new ServletException("Unexpected object type for SitemapBuilder: " + obj.getClass().getName());
        }

        logger.info("Initialization finished");
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) {
        logger.debug("Sitemap request received");
        List<String> relativeUrls = sitemapBuilder.getRelativeUrls();
        if (relativeUrls != null && !relativeUrls.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_OK);
            response.setContentType("text/xml");
            // Build the URLs using the incoming request scheme/serverName/port.
            String scheme = request.getScheme();
            String serverName = request.getServerName();
            int port = request.getServerPort();
            StringBuilder builder = new StringBuilder();
            builder.append(String.format("%s://%s", scheme, serverName));
            if (port > 0) {
                builder.append(":").append(port);
            }
            builder.append("/");
            String baseUrl = builder.toString();

            if (StringUtils.isNotBlank(baseUrl)) {
                logger.debug("Sitemap using base URL: {}", baseUrl);

                XMLOutputFactory outputFactory = XMLOutputFactory.newFactory();
                try {
                    XMLStreamWriter stream = outputFactory.createXMLStreamWriter(response.getWriter());
                    stream.writeStartDocument("1.0");

                    stream.writeStartElement("", "urlset", SITEMAP_NAMESPACE);
                    stream.writeNamespace("", SITEMAP_NAMESPACE);

                    for (String url : relativeUrls) {
                        stream.writeStartElement("url");
                        stream.writeStartElement("loc");
                        stream.writeCharacters(String.format("%s%s", baseUrl, url));
                        stream.writeEndElement();
                        stream.writeEndElement();
                    }

                    // urlset
                    stream.writeEndElement();
                    stream.writeEndDocument();
                }
                catch (XMLStreamException | IOException e) {
                    logger.warn("Problem occurred while building sitemap.xml: {}", e.getMessage());
                }
            }
        }
        else {
            logger.debug("No sitemap URLs found, returning {}", HttpServletResponse.SC_NO_CONTENT);
            response.setStatus(HttpServletResponse.SC_NO_CONTENT);
        }
    }

    @Override
    public void destroy() {
        super.destroy();
        logger.info("Destroyed");
    }
}
