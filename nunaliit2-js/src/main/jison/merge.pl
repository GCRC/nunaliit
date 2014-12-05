#!/usr/bin/perl

# This script is used for merging two files into a third one.
# Usage:
# 
# merge.pl <template file> <input file>
#
# where <template file> is the template file
#       <input file>    is the name of the file to be inserted in the template
#
# The template file is read until a line containing $merge$ is detected. Then,
# the input file is inserted. Finally, the remaining of the template file
# is sent to the output.
#

my $numArgs = $#ARGV + 1;

if( $numArgs < 2 ){
	print STDERR qq|You must provide three file names: template and input\n|;
	exit;
};

MergeFiles($ARGV[0], $ARGV[1]);

sub MergeFiles
{
	my ($templateFile, $inFile) = @_;

	open TEMPLATEFILE, "<$templateFile" or die $!;
	open INFILE, "<$inFile" or die $!;

	# Everything in template prior to $merge$
	my $cont = 1;
	my $line = <TEMPLATEFILE>;
	while( $cont > 0 )
	{
		if ($line =~ m/\$merge\$/)
		{
			$cont = 0;
		}
		else
		{
			print $line;
			$line = <TEMPLATEFILE>;
		}
	}

	# The whole input file
	while (my $line = <INFILE>)
	{
		print $line;
	}
	
	# The remaining portion of the template file
	while (my $line = <TEMPLATEFILE>)
	{
		print $line;
	}

	close(INFILE);
	close(TEMPLATEFILE);
}
