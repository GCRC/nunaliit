package ca.carleton.gcrc.security.ber;

public interface BerObject {

	enum TypeClass {
		UNIVERSAL
		,APPLICATION
		,PRIVATE
		,CONTEXT_SPECIFIC
	};
	
	enum UniversalTypes {
		INTEGER(0x02)
		,BIT_STRING(0x03)
		,OCTECT_STRING(0x04)
		,NULL(0x05)
		,OBJECT_IDENTIFIER(0x06)
		,UTF8_STRING(0x0c)
		,SEQUENCE(0x10)
		,SET(0x11)
		;
		
		private int code;
		
		UniversalTypes(int code) {
			this.code = code;
		}
		
		public int getCode() { return code; }
	};
	
	public TypeClass getTypeClass();
	
	public boolean isTypeConstructed();
	
	public int getType();
}
