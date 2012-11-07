package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import junit.framework.TestCase;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.command.impl.FileManifest;
import ca.carleton.gcrc.couch.command.impl.FileSetManifest;

public class FileSetManifestTest extends TestCase {

	public void testFromDirectory() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File test = new File(testDir, "fileSetManifest");
		FileSetManifest fileSetManifest = FileSetManifest.fromDirectory(test);
		
		Set<String> expected = new HashSet<String>();
		expected.add("a.txt");
		expected.add("b.txt");
		expected.add("sub");
		expected.add("sub/c.txt");
		
		Collection<FileManifest> fileManifests = fileSetManifest.getAllFileManifest();
		if( fileManifests.size() != expected.size() ) {
			fail("Unexpected number of manifests returned: "+fileManifests.size());
		}
		for(FileManifest fileManifest : fileManifests){
			String path = fileManifest.getRelativePath();
			if( false == expected.contains(path) ) {
				fail("Non-expected path: "+path);
			} else {
				expected.remove(path);
			}
		}
		if( expected.size() > 0 ){
			fail("Expected paths not reported: "+expected.iterator().next());
		}
	}

	public void testToJson() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File test = new File(testDir, "fileSetManifest");
		FileSetManifest fileSetManifest = FileSetManifest.fromDirectory(test);

		JSONObject json = fileSetManifest.toJson();
		FileSetManifest fileSetManifest2 = FileSetManifest.fromJSON(json);
		
		if( false == fileSetManifest.equals(fileSetManifest2) ) {
			fail("Error during JSON conversion");
		}
	}
}
