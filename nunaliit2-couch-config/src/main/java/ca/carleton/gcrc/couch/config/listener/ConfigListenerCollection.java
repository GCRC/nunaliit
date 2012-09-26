package ca.carleton.gcrc.couch.config.listener;

import java.util.Collection;

public class ConfigListenerCollection implements ConfigListener {

	private Collection<ConfigListener> collection;
	
	public Collection<ConfigListener> getCollection() {
		return collection;
	}

	public void setCollection(Collection<ConfigListener> collection) {
		this.collection = collection;
	}

	@Override
	public void configurationUpdated(CouchConfig config) {
		if( null != collection ) {
			for(ConfigListener l : collection) {
				l.configurationUpdated(config);
			}
		}
	}

}
