package ca.carleton.gcrc.javascript;

import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;

import junit.framework.TestCase;

public class RhinoTest extends TestCase {

	public void testA() throws Exception {
		Context cx = null;
		try {
			ContextFactory factory = new ContextFactory();
			cx = factory.enterContext();
			Scriptable scope = cx.initStandardObjects();
			
			// Add a library
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				pw.println("function test2(){ return 5; };");
				pw.println("function test(){ ");
				pw.println("  var a = test2();");
				pw.println("  return {a:a}; };");
				pw.flush();
				String code = sw.toString();

				StringReader sr = new StringReader(code);
				Script script = cx.compileReader(sr, "code.js", 1, null);
				script.exec(cx, scope);
			}

			// Main
			Object result = null;
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				pw.println("test();");
				pw.flush();
				String code2 = sw.toString();

				StringReader sr = new StringReader(code2);
				result = cx.evaluateReader(scope, sr, "main", 1, null);
			}
			
			System.out.println("Result: "+result+" ("+result.getClass().getName()+")");
			
		} catch(EvaluatorException e) {
			fail("Compile error: "+e.details()+" ("+e.sourceName()+", line "+e.lineNumber()+", column "+e.columnNumber()+")");
			
		} catch(EcmaError e) {
			fail("Run-time error: "+e.details()+" ("+e.sourceName()+", line "+e.lineNumber()+")");
			
		} catch(Exception e) {
			e.printStackTrace();
			
		} finally {
			if( null != cx ) {
				Context.exit();
			}
		}
	}
}
