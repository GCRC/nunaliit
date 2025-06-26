package ca.carleton.gcrc.couch.onUpload;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;

import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class MockCouchQueryResults implements CouchQueryResults {

    @Override
    public JSONObject getFullResults() {
        return null;
    }

    @Override
    public int getTotal() {
        return 0;
    }

    @Override
    public int getOffset() {
        return 0;
    }

    @Override
    public List<JSONObject> getRows() {
        return new ArrayList<JSONObject>();
    }

    @Override
    public List<JSONObject> getValues() {
        return null;
    }
}