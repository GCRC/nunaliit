package ca.carleton.gcrc.security.rng;

import java.security.SecureRandom;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RngFactory {
	static protected Logger logger = LoggerFactory.getLogger(RngFactory.class);
	
	static private SecureRandom s_rng = null;
	synchronized static private SecureRandom buildSeeder(){
		if( null == s_rng ){
			SecureRandom seedGen = new SecureRandom();
			byte[] seed = new byte[64];
			seedGen.nextBytes(seed);
			s_rng = new SecureRandom(seed);
			
			logger.info("RNG: "+s_rng.getAlgorithm());
		}
		
		return s_rng;
	}
	
	public SecureRandom createRng(){
		SecureRandom seeder = buildSeeder();
		byte seed[] = new byte[64];
		synchronized(seeder){
		    seeder.nextBytes(seed);
		}
		return new SecureRandom(seed);
	}

}
