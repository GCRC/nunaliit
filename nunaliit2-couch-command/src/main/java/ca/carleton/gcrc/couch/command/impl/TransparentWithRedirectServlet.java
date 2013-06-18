package ca.carleton.gcrc.couch.command.impl;

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.eclipse.jetty.servlets.ProxyServlet;

public class TransparentWithRedirectServlet extends ProxyServlet.Transparent {

	@Override
	public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {
        final HttpServletRequest request = (HttpServletRequest)req;
        final HttpServletResponse response = (HttpServletResponse)res;

        if( request.getMethod().equalsIgnoreCase("GET")
         && request.getPathInfo().equals("/") ){
        	performRedirect(request, response);
        } else {
        	super.service(req, res);
        }
	}

	private void performRedirect(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		response.setStatus(301);
		response.setHeader("Location", "./index.html");

//		response.setStatus(200);
//		response.setHeader("Content-Type", "text/html");
//		ServletOutputStream sos = response.getOutputStream();
//		PrintStream ps = new PrintStream(sos);
//		ps.print("<html><head></head><body>");
//		ps.print("getPathInfo: " + request.getPathInfo()+"<br/>");
//		ps.print("</body></html>");
	}
}
