package ca.carleton.gcrc.couch.onUpload.inReach;

public class InReachConfiguration {

	static private InReachSettings g_settings = new InReachSettingsNone();
	
	static public InReachSettings getInReachSettings() {
		return g_settings;
	}

	static public void setInReachSettings(InReachSettings settings) {
		g_settings = settings;
	}
}
