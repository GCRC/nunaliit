package ca.carleton.gcrc.couch.client.impl;

import java.io.OutputStream;

public interface StreamProducer {

	void produce(OutputStream os) throws Exception;
}
