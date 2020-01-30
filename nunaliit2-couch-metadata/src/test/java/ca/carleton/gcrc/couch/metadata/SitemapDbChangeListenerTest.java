package ca.carleton.gcrc.couch.metadata;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbChangeMonitor;
import junit.framework.TestCase;
import org.mockito.Mockito;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.LinkedBlockingQueue;

import static org.mockito.Mockito.mock;

public class SitemapDbChangeListenerTest extends TestCase {

    private SitemapDbChangeListener sitemapDbChangeListener;

    private static final String CUSTOM_JS_MINIFIED = ";(function($,$n2){if(typeof(window.nunaliit_custom)==='undefined')window.nunaliit_custom={};window.nunaliit_custom.configuration=function(config,callback){config.directory.showService.options.preprocessDocument=function(doc){return doc;};if(config.directory.customService){var customService=config.directory.customService;customService.setOption('defaultNavigationIdentifier','navigation.demo');customService.setOption('defaultModuleIdentifier','module.demo');};if(config.directory.dispatchService){var dispatchService=config.directory.dispatchService;dispatchService.register('demo','start',function(m){});dispatchService.register('demo','loadedModuleContent',function(m){});};callback();};})(jQuery,nunaliit2);";

    private static final String CUSTOM_JS = ";(function($,$n2){\n" +
            "\n" +
            "if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};\n" +
            "\n" +
            "// This is the a custom function that can be installed and give opportunity\n" +
            "// for an atlas to configure certain components before modules are displayed\n" +
            "// test 2\n" +
            "window.nunaliit_custom.configuration = function(config, callback){\n" +
            "\t\n" +
            "\tconfig.directory.showService.options.preprocessDocument = function(doc) {\n" +
            "\t\t\n" +
            "\t\treturn doc;\n" +
            "\t};\n" +
            "\n" +
            "\t// Custom service\n" +
            "\tif( config.directory.customService ){\n" +
            "\t\tvar customService = config.directory.customService;\n" +
            "\n" +
            "\t\t// Default table of content\n" +
            "       customService.setOption('defaultNavigationIdentifier','navigation.demo');\n" +
            "\t\t\n" +
            "\t\t// Default module\n" +
            "\t\tcustomService.setOption('defaultModuleIdentifier','module.demo');\n" +
            "\t};\n" +
            "\t\n" +
            "\t// Dispatch service\n" +
            "\tif( config.directory.dispatchService ){\n" +
            "\t\tvar dispatchService = config.directory.dispatchService;\n" +
            "\t\t\n" +
            "\t\t// Handler called when atlas starts\n" +
            "\t\tdispatchService.register('demo','start',function(m){\n" +
            "\t\t});\n" +
            "\t\t\n" +
            "\t\t// Handler called when the module content is loaded\n" +
            "\t\tdispatchService.register('demo','loadedModuleContent',function(m){\n" +
            "\t\t});\n" +
            "\t};\n" +
            "\t\n" +
            "\tcallback();\n" +
            "};\n" +
            "\n" +
            "})(jQuery,nunaliit2);";

    private static final String CUSTOM_JS_NAV_COMMENTED_OUT = ";(function($,$n2){\n" +
            "\n" +
            "if( typeof(window.nunaliit_custom) === 'undefined' ) window.nunaliit_custom = {};\n" +
            "\n" +
            "// This is the a custom function that can be installed and give opportunity\n" +
            "// for an atlas to configure certain components before modules are displayed\n" +
            "// test 2\n" +
            "window.nunaliit_custom.configuration = function(config, callback){\n" +
            "\t\n" +
            "\tconfig.directory.showService.options.preprocessDocument = function(doc) {\n" +
            "\t\t\n" +
            "\t\treturn doc;\n" +
            "\t};\n" +
            "\n" +
            "\t// Custom service\n" +
            "\tif( config.directory.customService ){\n" +
            "\t\tvar customService = config.directory.customService;\n" +
            "\n" +
            "\t\t// Default table of content\n" +
            "    //       customService.setOption('defaultNavigationIdentifier','navigation.demo');\n" +
            "\t\t\n" +
            "\t\t// Default module\n" +
            "\t\tcustomService.setOption('defaultModuleIdentifier','module.demo');\n" +
            "\t};\n" +
            "\t\n" +
            "\t// Dispatch service\n" +
            "\tif( config.directory.dispatchService ){\n" +
            "\t\tvar dispatchService = config.directory.dispatchService;\n" +
            "\t\t\n" +
            "\t\t// Handler called when atlas starts\n" +
            "\t\tdispatchService.register('demo','start',function(m){\n" +
            "\t\t});\n" +
            "\t\t\n" +
            "\t\t// Handler called when the module content is loaded\n" +
            "\t\tdispatchService.register('demo','loadedModuleContent',function(m){\n" +
            "\t\t});\n" +
            "\t};\n" +
            "\t\n" +
            "\tcallback();\n" +
            "};\n" +
            "\n" +
            "})(jQuery,nunaliit2);";

    @Override
    protected void setUp() throws Exception {
        super.setUp();

        CouchDb couchDb = mock(CouchDb.class);
        Mockito.when(couchDb.getChangeMonitor()).thenReturn(mock(CouchDbChangeMonitor.class));

        sitemapDbChangeListener = new SitemapDbChangeListener(couchDb, new LinkedBlockingQueue<String>());
    }

    public void testCustomJs() throws IOException {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        os.write(CUSTOM_JS.getBytes());

        String navigationDocId = sitemapDbChangeListener.findNavigationDocId(os);

        assertEquals("navigation.demo", navigationDocId);
    }

    public void testMinifiedCustomJs() throws IOException {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        os.write(CUSTOM_JS_MINIFIED.getBytes());

        String navigationDocId = sitemapDbChangeListener.findNavigationDocId(os);

        assertEquals("navigation.demo", navigationDocId);
    }

    public void testNavCommentedOut() throws IOException {
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        os.write(CUSTOM_JS_NAV_COMMENTED_OUT.getBytes());

        String navigationDocId = sitemapDbChangeListener.findNavigationDocId(os);

        assertNull("Navigation document Id should be null when commented out", navigationDocId);
    }
}