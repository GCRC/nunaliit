#!/usr/bin/perl

my $cmd = qq|grep -R -E "n2s?_localize" *|;    
my @output = `$cmd`;    
chomp @output;

my %dict;
foreach my $line (@output) {
	if( $line =~ m/n2s?_localize[^>]*>([^<]*)</ ) {
		$dict{$1} = 1;
	}
}

foreach $key (sort {$a cmp $b} keys %dict)
{
     print qq|$key\n|;
}