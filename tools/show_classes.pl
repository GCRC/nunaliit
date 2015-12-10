#!/usr/bin/perl

use Data::Dumper;

my %dict;

print STDERR qq|Accumulate show classes strings\n|;
Load_Javascripts(\%dict);

print STDERR qq|Report\n|;

#print Dumper(\%dict);
#exit 0;

my @classNames = (sort {$a cmp $b} keys %dict);
foreach $className (@classNames)
{
	print qq|$className\n|;
}


sub Load_Javascripts
{
	my ($dictRef) = @_;

	# Find translation files in nunaliit2 project
	my $cmd = qq|find ./nunaliit2-js -name *.js|;    
		
	my @output = `$cmd`;    
	chomp @output;
	
	foreach my $file (@output) {
		Load_JavascriptFile($file, $dictRef);
	}
}


sub Load_JavascriptFile
{
	my ($file, $dictRef) = @_;

	print STDERR qq|Load Javascript: $file\n|;

	open FILE, "<$file" or die $!;

	while (my $line = <FILE>)
	{
		if( $line =~ m/'\.(n2s_[^']*)'/ ) {
			my $classString = $1;

			#print STDERR qq|$classString\n|;
			
			$dictRef->{$classString} = 1;
		}
		if( $line =~ m/"\.(n2s_[^"]*)"/ ) {
			my $classString = $1;

			#print STDERR qq|$classString\n|;
			
			$dictRef->{$classString} = 1;
		}
	}

	close(FILE);
}

