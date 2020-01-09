package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import junit.framework.TestCase;
import org.apache.commons.io.IOUtils;
import org.json.JSONObject;
import org.mockito.Mockito;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.LinkedBlockingQueue;

import static org.mockito.Mockito.mock;

public class SitemapBuilderThreadTest extends TestCase {

    private SitemapBuilderThread sitemapBuilderThread;

    @Override
    protected void setUp() throws Exception {
        super.setUp();

        CouchDb couchDb = mock(CouchDb.class);
        Mockito.when(couchDb.getDocument("level_1")).thenReturn(new JSONObject(
                IOUtils.toString(getClass().getResourceAsStream("/navigation/levels_1.json"), StandardCharsets.UTF_8)));
        Mockito.when(couchDb.documentExists("level_1")).thenReturn(true);
        Mockito.when(couchDb.getDocument("level_2")).thenReturn(new JSONObject(
                IOUtils.toString(getClass().getResourceAsStream("/navigation/levels_2.json"), StandardCharsets.UTF_8)));
        Mockito.when(couchDb.documentExists("level_2")).thenReturn(true);
        Mockito.when(couchDb.getDocument("level_3")).thenReturn(new JSONObject(
                IOUtils.toString(getClass().getResourceAsStream("/navigation/levels_3.json"), StandardCharsets.UTF_8)));
        Mockito.when(couchDb.documentExists("level_3")).thenReturn(true);

        sitemapBuilderThread = new SitemapBuilderThread(couchDb, new LinkedBlockingQueue<String>());
    }

    public void testOneLevelNavigation() {
        Map<String, Set<String>> links = sitemapBuilderThread.processNavigationDoc("level_1");

        assertNotNull(links);

        Set<String> hrefs = links.get("href");
        assertEquals(1, hrefs.size());
        assertTrue(hrefs.contains("./tools/index.html"));

        Set<String> modules = links.get("module");
        assertEquals(2, modules.size());
        assertTrue(modules.contains("module.demo"));
        assertTrue(modules.contains("module.test2_canvas"));
    }

    //TODO: more verification
    public void testTwoLevelNavigation() {
        Map<String, Set<String>> links = sitemapBuilderThread.processNavigationDoc("level_2");

        assertNotNull(links);

        Set<String> hrefs = links.get("href");
        assertEquals(10, hrefs.size());
        assertTrue(hrefs.contains("./index.html?module=module.sleepyriver"));

        Set<String> modules = links.get("module");
        assertEquals(4, modules.size());
        assertTrue(modules.contains("module.sleepyriver.ncri.explore"));
    }

    //TODO: more verification
    public void testThreeLevelNavigation() {
        Map<String, Set<String>> links = sitemapBuilderThread.processNavigationDoc("level_3");

        assertNotNull(links);

        Set<String> hrefs = links.get("href");
        assertEquals(1, hrefs.size());
        assertTrue(hrefs.contains("./tools/index.html"));

        Set<String> modules = links.get("module");
        assertEquals(3, modules.size());
        assertTrue(modules.contains("module.test5_anothermodule"));
    }
}
