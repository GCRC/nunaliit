#!/bin/sh

# This script can be used to bootstrap the daily cron job
# > sudo crontab -e
# 
# Add the following line:
# 0 4 * * * @ATLAS_CONFIG_DIR@/cron.sh

CRON_LOCATION="@CRON_WORKING_DIR@/cron";

cd $CRON_LOCATION
ant > cron.log