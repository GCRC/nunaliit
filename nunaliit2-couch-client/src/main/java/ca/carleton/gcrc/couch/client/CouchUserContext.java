package ca.carleton.gcrc.couch.client;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

public class CouchUserContext {
	private String name;
	private List<String> roles = new Vector<String>();
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	
	public List<String> getRoles() {
		return roles;
	}
	public void setRoles(List<String> roles) {
		this.roles = roles;
	}
	
	public String toString(){
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		pw.print("User ");
		pw.print(name);
		pw.print(" [");
		if( null != roles ) {
			boolean first = true;
			for(String role : roles){
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.print(role);
			}
		}
		pw.print("]");
		pw.flush();
		
		return sw.toString();
	}
}
