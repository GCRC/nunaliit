package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.Vector;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.ContextFactory;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;

public class JavascriptRunner {
	
	static public Object opt(Object o, String attributeName, Object def){
		Object result = null;

		if( o instanceof Scriptable ){
			Scriptable s = (Scriptable)o;
			result = s.get(attributeName, s);
		}
		
		if( null == result ){
			return def;
		}
		
		return result;
	}
	
	static public Object opt(Object o, int index, Object def){
		Object result = null;

		if( o instanceof Scriptable ){
			Scriptable s = (Scriptable)o;
			result = s.get(index, s);
		}
		
		if( null == result ){
			return def;
		}
		
		return result;
	}
	
	static public Object opt(Object o, String attributeName){
		return opt(o, attributeName, null);
	}
	
	static public Object opt(Object o, int index){
		return opt(o, index, null);
	}
	
	static public String optString(Object o, String attributeName){
		Object result = opt(o, attributeName);
		if( null == result ){
			return null;
		}
		
		if( result instanceof String ){
			return (String)result;
		}
		
		return null;
	}
	
	static public String optString(Object o, int index){
		Object result = opt(o, index);
		if( null == result ){
			return null;
		}
		
		if( result instanceof String ){
			return (String)result;
		}
		
		return null;
	}
	
	static public String optString(Object o, String attributeName, String defaultValue){
		String result = optString(o, attributeName);
		if( null == result ){
			return defaultValue;
		}
		
		return result;
	}
	
	static public String optString(Object o, int index, String defaultValue){
		String result = optString(o, index);
		if( null == result ){
			return defaultValue;
		}
		
		return result;
	}
	
	static public Integer optInteger(Object o, String attributeName){
		Object result = opt(o, attributeName);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.intValue();
		}
		
		return null;
	}
	
	static public Integer optInteger(Object o, int index){
		Object result = opt(o, index);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.intValue();
		}
		
		return null;
	}
	
	static public int optInteger(Object o, String attributeName, int defaultValue){
		Integer result = optInteger(o, attributeName);
		if( null == result ){
			return defaultValue;
		}
		
		return result.intValue();
	}
	
	static public int optInteger(Object o, int index, int defaultValue){
		Integer result = optInteger(o, index);
		if( null == result ){
			return defaultValue;
		}
		
		return result.intValue();
	}
	
	static public Long optLong(Object o, String attributeName){
		Object result = opt(o, attributeName);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.longValue();
		}
		
		return null;
	}
	
	static public Long optLong(Object o, int index){
		Object result = opt(o, index);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.longValue();
		}
		
		return null;
	}
	
	static public long optLong(Object o, String attributeName, long defaultValue){
		Long result = optLong(o, attributeName);
		if( null == result ){
			return defaultValue;
		}
		
		return result.longValue();
	}
	
	static public long optLong(Object o, int index, long defaultValue){
		Long result = optLong(o, index);
		if( null == result ){
			return defaultValue;
		}
		
		return result.longValue();
	}
	
	static public Double optDouble(Object o, String attributeName){
		Object result = opt(o, attributeName);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.doubleValue();
		}
		
		return null;
	}

	static public Double optDouble(Object o, int index){
		Object result = opt(o, index);
		if( null == result ){
			return null;
		}
		
		if( result instanceof Number ){
			Number n = (Number)result;
			return n.doubleValue();
		}
		
		return null;
	}
	
	static public double optDouble(Object o, String attributeName, double defaultValue){
		Double result = optDouble(o, attributeName);
		if( null == result ){
			return defaultValue;
		}
		
		return result.doubleValue();
	}

	static public double optDouble(Object o, int index, double defaultValue){
		Double result = optDouble(o, index);
		if( null == result ){
			return defaultValue;
		}
		
		return result.doubleValue();
	}
	
	static public List<?> optArray(Object o, String attributeName){
		Object obj = opt(o, attributeName);
		if( null == obj ){
			return null;
		}
		
		if( obj instanceof Scriptable ){
			Scriptable s = (Scriptable)obj;
			if( "Array".equals(s.getClassName()) ){
				int length = optInteger(s,"length",0);
				
				List<Object> result = new Vector<Object>();
				for(int i=0; i<length; ++i){
					Object elem = opt(s, i);
					result.add(elem);
				}
				
				return result;
			}
		}
		
		return null;
	}

	private Context cx = null;
	private Scriptable scope = null;
	private List<JavascriptRunnerListener> listeners = new Vector<JavascriptRunnerListener>();
	
	public JavascriptRunner() {
		ContextFactory factory = new ContextFactory();
		cx = factory.enterContext();
		scope = cx.initStandardObjects();
	}
	
	public void cleanup() {
		Context.exit();
		cx = null;
		scope = null;
	}
	
	public void addListener(JavascriptRunnerListener listener){
		listeners.add(listener);
	}
	
	public Object evaluateJavascript(String javascript) throws Exception {
		try {
			Object result = cx.evaluateString(scope, javascript, "main", 1, null);
			return result;
			
		} catch(EcmaError e) {
			for(JavascriptRunnerListener listener : listeners){
				listener.runtimeError(e.details(), e.sourceName(), e.lineNumber());
			}
			throw e;
		}
	}
	
	public void addJavascript(File file) throws Exception {
		FileInputStream fis = null;
		try {
			fis = new FileInputStream(file);
			InputStreamReader isr = new InputStreamReader(fis,"UTF-8");
			addJavascript(isr, file.getAbsolutePath(), 1);
			
		} catch(FileNotFoundException e) {
			reportUnexpectedError(e);
			throw e;
			
		} catch(UnsupportedEncodingException e) {
			reportUnexpectedError(e);
			throw e;
			
		} catch(Exception e) {
			throw e;
			
		} finally {
			if( null != fis ){
				try {
					fis.close();
					fis = null;
				} catch(Exception e) {
					// ignore
				}
			}
		}
	}
	
	public void addJavascript(Reader reader, String name, int lineno) throws Exception {
		try {
			Script script = cx.compileReader(reader, name, lineno, null);
			script.exec(cx, scope);
			
		} catch(EvaluatorException e) {
			for(JavascriptRunnerListener listener : listeners){
				listener.compileError(e.details(), e.sourceName(), e.lineNumber(), e.columnNumber());
			}
			throw e;

		} catch(Exception e) {
			reportUnexpectedError(e);
			throw e;
		}
	}
	
	private void reportUnexpectedError(Exception e){
		for(JavascriptRunnerListener listener : listeners){
			listener.unexpectedError(e);
		}
	}
}
