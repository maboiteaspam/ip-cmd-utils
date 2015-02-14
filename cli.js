
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

        var filters = [];
        // load filters
        if(command.filter){
          filters = command.filter.split(',');
        }
        // apply filters
        _.each(filters,function(filter){
          if( filter.match(/^lan$/) ){
            results = _.where(results, {isEther: true});
          }
          if( filter.match(/^loopback|lo$/) ){
            results = _.where(results, {isLoop: true});
          }
          if( filter.match(/^ipv(4|6)$/) ){
            results = _.filter(results, function(settings){
              settings.ips = _.filter(settings.ips, function(ipSettings){
                return ipSettings.type.match(filter)
              });
              return !!settings.ips.length;
            });
          }
        });
        var selector = false;
        // load selectors
        if(command.only){
          selector = command.only;
        }
        // apply selectors
        if(selector){
          if(selector.match(/ip/)){
            // get ips only
            var ips = [];
            _.each(results, function(settings){
              ips = ips.concat(settings.ips);
            });
            results = ips;
            console.error(selector)
            // get ip value only
            if(selector.match(/name/)){
              ips = [];
              _.each(results, function(settings){
                ips = ips.concat(settings.ip);
              });
              results = ips;
            }
          }else if(selector.match(/interface|intf/)){
            // get interfaces only
            results = _.each(results, function(settings, name){
              delete results[name].ips;
            });
            // get interfaces value only
            if(selector.match(/name/)){
              var intfs = [];
              _.each(results, function(settings){
                intfs = intfs.concat(settings.name);
              });
              results = intfs;
            }
          }
        }

        if(program.prettyPrint)
          results = JSON.stringify(results, null, 4);
        else
          results = JSON.stringify(results);
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
    cmdUtils.addCapability('ip');
    cmdUtils.addCapability('ifconfig');
    var streamProcess = cmdUtils.addIp(ip, mask, intf);
    cmdUtils.logStreamLike(streamProcess )
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
    cmdUtils.addCapability('ip');
    cmdUtils.addCapability('ifconfig');
    var streamProcess = cmdUtils.removeIp(ip, mask, intf);
    cmdUtils.logStreamLike(streamProcess )
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