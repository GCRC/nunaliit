/*
Copyright (c) 2010, Geomatics and Cartographic Research Centre, Carleton 
University
All rights reserved.

Redistribution and use in source and binary forms, with or without 
modification, are permitted provided that the following conditions are met:

 - Redistributions of source code must retain the above copyright notice, 
   this list of conditions and the following disclaimer.
 - Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
 - Neither the name of the Geomatics and Cartographic Research Centre, 
   Carleton University nor the names of its contributors may be used to 
   endorse or promote products derived from this software without specific 
   prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE 
POSSIBILITY OF SUCH DAMAGE.

$Id$
*/
package ca.carleton.gcrc.contributions;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.ServletContext;

import org.apache.log4j.Logger;
import org.cometd.Bayeux;
import org.cometd.Channel;
import org.cometd.Client;

public class ContributionCometImpl implements ContributionComet {
	final protected Logger logger = Logger.getLogger(this.getClass());
	
	private ServletContext servletContext;
	private Bayeux bayeux;
	private Channel channel;
	private Client client;
	private int messageId = 0;
	
	public ContributionCometImpl(ServletContext servletContext) {
		
		this.servletContext = servletContext;

		bayeux = (Bayeux)this.servletContext.getAttribute(Bayeux.ATTRIBUTE);
		channel = bayeux.getChannel("/contribution",true);
		
		client = bayeux.newClient("server_user");
		
		logger.info(this.getClass().getName()+" configured");
	}
	
	
	synchronized public void reportNewContribution(String placeId, String contributionId) {
		Map<String,Object> message = new HashMap<String,Object>();
		message.put("action", "add");
		message.put("id", contributionId);
		message.put("place_id", placeId);

		channel.publish(client,message, ""+messageId);
		++messageId;
	}
	
	synchronized public void reportDeletedContribution(String placeId, String contributionId) {
		Map<String,Object> message = new HashMap<String,Object>();
		message.put("action", "delete");
		message.put("id", contributionId);
		message.put("place_id", placeId);

		channel.publish(client,message, ""+messageId);
		++messageId;
	}
}
