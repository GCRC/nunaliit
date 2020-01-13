package ca.carleton.gcrc.couch.command.impl;

import org.eclipse.jetty.proxy.ProxyServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@SuppressWarnings("serial")
public class TransparentProxyFixedEscaped extends ProxyServlet.Transparent {

	private static final Pattern rDesign2f = Pattern.compile("/_design%2[fF]");

	protected final Logger logger = LoggerFactory.getLogger(this.getClass());

	public static String unescapeUriString(String uriString){
		Matcher mDesign2f = rDesign2f.matcher(uriString);
		if( mDesign2f.find() ){
			return uriString.substring(0, mDesign2f.start())
    				+ "/_design/"
    				+ uriString.substring(mDesign2f.end());
		}
		
		return null;
    }

	@Override
	protected String rewriteTarget(HttpServletRequest request)
	{
		String target = super.rewriteTarget(request);

		if (null != target) {
			String fixedTarget = unescapeUriString(target);
			if (null != fixedTarget) {
				try {
					logger.debug(String.format("proxy decode %s -> %s", target, fixedTarget));

					target = fixedTarget;

				}
				catch (Exception e) {
					logger.error("Unable to decode URI: " + target, e);
				}
			}
		}

		return target;
    }
}
