package ca.carleton.gcrc.couch.onUpload.mail;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Timer;
import java.util.TimerTask;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;

public class MailVetterDailyNotificationTask extends TimerTask {

	static final private Logger logger = LoggerFactory.getLogger(MailVetterDailyNotificationTask.class);

	static final public long DAILY_PERIOD = 1000 * 60 * 60 * 24; // 24 hours in ms
	
	static public MailVetterDailyNotificationTask scheduleTask(
			CouchDesignDocument serverDesignDoc
			,MailNotification mailNotification
			){
		
		Timer timer = new Timer();

		MailVetterDailyNotificationTask installedTask = new MailVetterDailyNotificationTask(
				timer
				,serverDesignDoc
				,mailNotification
				);
		
		Calendar calendar = Calendar.getInstance(); // now
		
		Date now = calendar.getTime();
		
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		calendar.set(Calendar.MINUTE, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MILLISECOND, 0);

		Date start = calendar.getTime();
				
		while( start.getTime() < now.getTime() ){
			start = new Date( start.getTime() + DAILY_PERIOD );
		}

		if( true ) {
			timer.schedule(installedTask, start, DAILY_PERIOD);
//		} else {
			// This code to test with a shorter period
//			start = new Date( now.getTime() + (1000*30) );
//			timer.schedule(installedTask, start, 1000 * 30);
		}
		
		// Log
		{
			SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		    String startString = sdf.format(start);
			logger.info("Vetter daily notifications set to start at: "+startString);
		}
		
		return installedTask;
	}
	
	private Timer timer = null;
	private boolean stopped = false;
	private CouchDesignDocument serverDesignDoc = null;
	private MailNotification mailNotification = null;
	
	public MailVetterDailyNotificationTask(
		Timer timer
		,CouchDesignDocument serverDesignDoc
		,MailNotification mailNotification
		){
		this.timer = timer;
		this.serverDesignDoc = serverDesignDoc;
		this.mailNotification = mailNotification;
	}
	
	public void stop(){
		synchronized(this){
			if( stopped ){
				return;
			}
			stopped = true;
		}
		
		if( null != timer ){
			timer.cancel();
		}
	}
	
	@Override
	public void run() {
		
		synchronized(this){
			if( stopped ) return;
			
			// Check if any media is waiting for approval
			int count = 0; 
			try {
				CouchQuery query = new CouchQuery();
				query.setViewName("approval");
				
				CouchQueryResults results = serverDesignDoc.performQuery(query);
				count = results.getRows().size();
			} catch(Exception e){
				logger.error("Unable to obtain list of media for approvals",e);
			}
			
			if( count < 1 ){
				logger.info("No daily vetter notifications required - nothing waiting for approval");
				return;
			}
			
			// Send notification
			try {
				mailNotification.sendVetterDailyNotification(count);
			} catch(Exception e) {
				logger.error("Unable to send vetter daily notifications",e);
			}
		}
	}

}
