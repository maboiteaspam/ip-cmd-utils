
var pkg = require('./package.json');
var program = require('commander');
var _ = require('underscore');
var IpCmdUtils = require('./index');

program
  .version(pkg.version)
  .option('-q, --quiet', 'Less verbose')
  .option('-v, --verbose', 'More verbose')
  .option('--prefer <bin>', 'Prefered bin (ip, ifconfig)')
  .option('-p, --pretty-print', 'Pretty printing');

program.command('show')
  .option('--filter <items>', 'loopback || lo, lan, ipv4, ipv6')
  .option('--only <selector>', 'ip ||interface || intf [,name]?')
  .description('Show configuration')
  .action(function(command){

    if (program.verbose) {
      process.env['DEBUG'] = pkg.name;
    }

    var cmdUtils = new IpCmdUtils(program.prefer || false);
    cmdUtils.addCapability('ip');
    cmdUtils.addCapability('ifconfig');
    var streamProcess = cmdUtils.loadSystemSettings();
    cmdUtils.logStreamLike(streamProcess )
      .on('parsed', function(results){

        // apply filters
        if(command.filter){
          results = cmdUtils.filterResults(command.filter.split(','), results);
        }

        // apply selectors
        if(command.only){
          results = cmdUtils.selectResults(command.only, results);
        }

        // pretty print
        if(program.prettyPrint)
          results = JSON.stringify(results, null, 4);
        else
          results = JSON.stringify(results);

        // output.
        if(!program.quiet){
          console.log(results);
        }
      });

  });

program.command('add <ip> <mask> <interface>')
  .description('add IP address')
  .action(function(ip, mask, intf){

    if (program.verbose) {
      process.env['DEBUG'] = pkg.name;
    }

    var cmdUtils = new IpCmdUtils(program.prefer || false);
    // load capabilities
    cmdUtils.addCapability('ip');
    cmdUtils.addCapability('ifconfig');
    // add new ip
    var streamProcess = cmdUtils.addIp(ip, mask, intf);
    // log process output
    cmdUtils.logStreamLike(streamProcess )
      // output result.
      .on('done', function(success){
      if(!success){
        console.log('failed');
      }
    });
  });

program.command('del <ip> <mask> <interface>')
  .description('del IP address')
  .action(function(ip, mask, intf){

    if (program.verbose) {
      process.env['DEBUG'] = pkg.name;
    }

    var cmdUtils = new IpCmdUtils(program.prefer || false);
    // load capabilities
    cmdUtils.addCapability('ip');
    cmdUtils.addCapability('ifconfig');
    // rem ip
    var streamProcess = cmdUtils.removeIp(ip, mask, intf);
    // log process output
    cmdUtils.logStreamLike(streamProcess )
      // output result.
      .on('done', function(success){
        if(!success){
          console.log('failed');
        }
      });
  });

program.command('*')
  .description('display help')
  .action(function(){
    program.outputHelp();
  });


program
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}