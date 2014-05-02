package ca.carleton.gcrc.couch.user.mail;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;

import junit.framework.TestCase;

public class MustacheTest extends TestCase {

	public void testMustache() {
		StringReader reader = new StringReader("abc{{link}}def");
		
		MustacheFactory mf = new DefaultMustacheFactory();
	    Mustache mustache = mf.compile(reader, "test");
	    
	    Map<String,String> obj = new HashMap<String,String>();
	    obj.put("link", "111");
	    
	    StringWriter sw = new StringWriter();
	    mustache.execute(sw, obj);
	    
	    String generated = sw.toString();
	    if( false == "abc111def".equals(generated) ){
	    	fail("Unexpected value");
	    }
	}
}
