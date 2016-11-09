package ca.carleton.gcrc.couch.export.csv;

import java.util.List;
import java.util.Vector;

public class CSVSettings {

	private List<CSVColumn> columns = new Vector<CSVColumn>();
	
	public List<CSVColumn> getColumns(){
		return columns;
	}
	
	public void addColumn(CSVColumn column){
		columns.add(column);
	}
}
