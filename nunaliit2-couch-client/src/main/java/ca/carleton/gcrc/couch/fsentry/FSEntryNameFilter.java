package ca.carleton.gcrc.couch.fsentry;

public interface FSEntryNameFilter {

	static final public FSEntryNameFilter all = new FSEntryNameFilter() {
		@Override
		public boolean accept(FSEntry parent, String name) {
			return true;
		}
	};

	static final public FSEntryNameFilter none = new FSEntryNameFilter() {
		@Override
		public boolean accept(FSEntry parent, String name) {
			return false;
		}
	};
	
	boolean accept(FSEntry parent, String name);

}
