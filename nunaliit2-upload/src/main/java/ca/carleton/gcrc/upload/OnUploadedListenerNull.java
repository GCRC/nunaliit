package ca.carleton.gcrc.upload;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;

import org.json.JSONObject;

public class OnUploadedListenerNull implements OnUploadedListener {

	@Override
	public JSONObject onLoad(
		String progressId
		,List<LoadedFile> uploadedFiles
		,Map<String, List<String>> parameters
		,Principal userPrincipal
		,Cookie[] cookies
		) throws Exception {

		return null;
	}

	@Override
	public void onError(
			String progressId, 
			List<LoadedFile> uploadedFiles,
			Map<String, List<String>> parameters, 
			Principal userPrincipal,
			Cookie[] cookies) {
	}

}
