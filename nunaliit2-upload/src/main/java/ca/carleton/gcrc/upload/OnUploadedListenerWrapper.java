package ca.carleton.gcrc.upload;

import java.security.Principal;
import java.util.List;
import java.util.Map;

import javax.servlet.http.Cookie;

import org.json.JSONObject;

public class OnUploadedListenerWrapper implements OnUploadedListener {

	private OnUploadedListener wrapped;

	public OnUploadedListenerWrapper() {
	}
	
	public OnUploadedListenerWrapper(OnUploadedListener wrapped) {
		this.wrapped = wrapped;
	}
	
	public OnUploadedListener getWrapped() {
		return wrapped;
	}

	public void setWrapped(OnUploadedListener wrapped) {
		this.wrapped = wrapped;
	}
	
	@Override
	public JSONObject onLoad(
		String progressId
		,List<LoadedFile> uploadedFiles
		,Map<String, List<String>> parameters
		,Principal userPrincipal
		,Cookie[] cookies
		) throws Exception {

		return wrapped.onLoad(progressId, uploadedFiles, parameters, userPrincipal, cookies);
	}

	@Override
	public void onError(String progressId, 
			List<LoadedFile> uploadedFiles,
			Map<String, List<String>> parameters, 
			Principal userPrincipal,
			Cookie[] cookies) {
		wrapped.onError(progressId, uploadedFiles, parameters, userPrincipal, cookies);
	}

}
