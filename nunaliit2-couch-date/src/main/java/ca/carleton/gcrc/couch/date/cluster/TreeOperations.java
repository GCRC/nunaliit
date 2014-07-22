package ca.carleton.gcrc.couch.date.cluster;

import java.util.List;

public interface TreeOperations {

	List<TreeElement> getElementsForClusterId(int clusterId) throws Exception;
}
