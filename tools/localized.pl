#!/usr/bin/perl

my $cmd = qq|grep -R "_loc([^)]*)" *|;    
my @output = `$cmd`;    
chomp @output;

my %dict;
foreach my $line (@output) {
	if( $line =~ m/_loc\s*\(\s*'([^)]*)'\s*\)/ ) {
		$dict{$1} = 1;
	} 
	
	if( $line =~ m/_loc\s*\(\s*"([^)]*)"\s*\)/ ) {
		$dict{$1} = 1;
	}
}

#while (($key, $value) = each(%dict)){
#     print qq|$key\n|;
#}

foreach $key (sort {$a cmp $b} keys %dict)
{
     print qq|$key\n|;
}