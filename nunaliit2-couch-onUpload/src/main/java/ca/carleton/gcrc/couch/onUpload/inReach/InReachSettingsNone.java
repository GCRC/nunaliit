package ca.carleton.gcrc.couch.onUpload.inReach;

import java.util.ArrayList;
import java.util.Collection;

public class InReachSettingsNone implements InReachSettings {

	@Override
	public Collection<InReachForm> getForms() {
		return new ArrayList<InReachForm>();
	}

}
