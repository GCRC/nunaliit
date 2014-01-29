package ca.carleton.gcrc.security.ber.encoding;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.ByteBuffer;
import java.util.Stack;

import ca.carleton.gcrc.security.ber.BerBytes;
import ca.carleton.gcrc.security.ber.BerConstructed;
import ca.carleton.gcrc.security.ber.BerInteger;
import ca.carleton.gcrc.security.ber.BerObject;
import ca.carleton.gcrc.security.ber.BerString;

public class BerEncoder {
	
	static public byte[] encode(BerObject obj) throws Exception {
		Stack<ByteBuffer> components = new Stack<ByteBuffer>();
		int size = encode(obj,components);
		
		byte[] result = new byte[size];
		
		int index = 0;
		while( components.size() > 0 ) {
			ByteBuffer buffer = components.pop();
			
			byte[] data = buffer.array();
			
			if( (index + data.length) > result.length ) {
				throw new Exception("Error while BER encoding an object");
			}
			for(int loop=0; loop<data.length; ++loop) {
				result[index] = data[loop];
				++index;
			}
		}
		
		return result;
	}

	static private int encode(BerObject obj, Stack<ByteBuffer> components ) throws Exception {
		if( obj instanceof BerConstructed ) {
			return encodeConstructed((BerConstructed)obj, components);
		}
		return encodePrimitive(obj, components);
	}

	private static int encodePrimitive(BerObject obj, Stack<ByteBuffer> components) throws Exception {
		byte[] value = null;
		if( obj instanceof BerBytes ) {
			BerBytes berBytes = (BerBytes)obj;
			value = berBytes.getValue();

		} else if( obj instanceof BerInteger ) {
			BerInteger berInt = (BerInteger)obj;
			value = computeIntegerValue(berInt);

		} else if( obj instanceof BerString ) {
			BerString berStr = (BerString)obj;
			value = computeStringValue(berStr);

		} else {
			throw new Exception("Unknown encoding method for primitive type: "+obj.getClass());
		}
		
		if( null == value ) {
			throw new Exception("Unknown value for primitive type: "+obj.getClass());
		}
		
		ByteBuffer dataBuffer = ByteBuffer.wrap(value);
		components.push(dataBuffer);
		
		byte[] len = BerLengthEncoder.encodeLength(value.length);
		ByteBuffer lenBuffer = ByteBuffer.wrap(len);
		components.push(lenBuffer);
		
		byte[] tag = BerTagEncoder.encodeTag(obj);
		ByteBuffer tagBuffer = ByteBuffer.wrap(tag);
		components.push(tagBuffer);
		
		int totalLen = value.length + len.length + tag.length;
		
		return totalLen;
	}

	private static int encodeConstructed(BerConstructed contructedObj, Stack<ByteBuffer> components) throws Exception {
		int totalLen = 0;
		
		// Starting from the last object, push unto stack
		for(int loop=contructedObj.size()-1; loop>=0; --loop) {
			BerObject thisObj = contructedObj.get(loop);
			int thisLen = encode(thisObj, components);
			totalLen = totalLen + thisLen;
		}
		
		byte[] len = BerLengthEncoder.encodeLength(totalLen);
		ByteBuffer lenBuffer = ByteBuffer.wrap(len);
		components.push(lenBuffer);
		
		byte[] tag = BerTagEncoder.encodeTag(contructedObj);
		ByteBuffer tagBuffer = ByteBuffer.wrap(tag);
		components.push(tagBuffer);
		
		totalLen = totalLen + len.length + tag.length;
		
		return totalLen;
	}

	private static byte[] computeIntegerValue(BerInteger integerObj) throws Exception {
		Long valueObj = integerObj.getValue();
		
		int value = 0;
		if( null != valueObj ) {
			value = valueObj.intValue();
		}
		
		int size = 1;
		int work = value >> 8;
		while(work > 0) {
			++size;
			work = work >> 8;
		}
		
		byte[] result = new byte[size];
		int index = size-2;
		result[size-1] = (byte)(value & 0xff);
		work = value >> 8;
		while(work > 0) {
			if( index < 0 ) {
				throw new Exception("Error encoding integer: "+value);
			}
			
			result[index] = (byte)(work & 0xff);
			work = work >> 8;
			--index;
		}
		
		return result;
	}

	private static byte[] computeStringValue(BerString berStr) throws Exception {
		String value = berStr.getValue();
		if( null == value ) {
			value = "";
		}

		if( berStr.getType() == BerObject.UniversalTypes.UTF8_STRING.getCode() ) {
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8");
			
			osw.write(value);
			osw.flush();
			
			byte[] result = baos.toByteArray();
			return result;
		} else {
			throw new Exception("Unknown string encoding for type: "+berStr.getType());
		}
	}
}
