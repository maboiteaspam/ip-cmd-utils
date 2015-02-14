
var pkg = require('./package.json');
var which = require('npm-which')(__dirname);
var _ = require('underscore');

var IpCmdUtils = function(prefered){

  var debug = require('debug')(pkg.name);

  var knownBin = {};
  var foundBin = {};

  this.addCapability = function(name, config){
    if(!config){
      config = require('./capabilities/'+name+'.js');
    }
    knownBin[name] = config;
  };

  var toDebug = function(data){
    debug('%s',(data+''));
  };
  var mustBeRoot = function(data){
    if((data+'').match(/Operation not permitted/)){
      console.error('You should run as root')
    }
    if((data+'').match(/Opération non permise/)){
      console.error('You should run as root')
    }
  };
  this.logStreamLike = function(streamLike){

    if(streamLike.stdout && streamLike.stderr ){
      streamLike.on('close', function (code) {
        debug('code %s', code);
      });
      streamLike.stderr
        .on('data', toDebug)
        .on('data', mustBeRoot);
      streamLike.stdout
        .on('data', toDebug)
        .on('data', mustBeRoot);
    } else {
      streamLike
        .on('data', toDebug)
        .on('data', mustBeRoot);
    }

    return streamLike;
  };

  this.detectCapabilities = function(){
    if(!Object.keys(foundBin).length){
      _.each(knownBin, function(value, key){
        try{
          foundBin[key] = which.sync(value.binFile);
        }catch(ex){
          debug('bin file not found %s', value.binFile);
        }
      });
    }
    if( !Object.keys(foundBin).length ){
      throw 'no capable bin found';
    }
    return true;
  };

  // it returns a byline as a stream !
  this.loadSystemSettings = function(){

    this.detectCapabilities();

    if(!prefered) prefered = Object.keys(foundBin)[0];

    debug('selected %s ', prefered);

    if(!knownBin[prefered] || !foundBin[prefered]){
      throw 'Cannot satisfy preferred bin '+ prefered;
    }

    var BinWrapper = knownBin[prefered].wrapper;
    var StreamParser = knownBin[prefered].parser;
    return (new StreamParser()).parse(
      (new BinWrapper(foundBin[prefered]))
        .showSettings()
    );
  };


  // it returns a process as a stream !
  this.addIp = function(ip, mask, intf){

    this.detectCapabilities();

    if(!prefered) prefered = Object.keys(foundBin)[0];

    debug('selected %s ', prefered);

    if(!knownBin[prefered] || !foundBin[prefered]){
      throw 'Cannot satisfy preferred bin '+ prefered;
    }

    var BinWrapper = knownBin[prefered].wrapper;
    return (new BinWrapper(foundBin[prefered]))
      .addIp(ip, mask, intf);
  };

  // it returns a process as a stream !
  this.removeIp = function(ip, mask, intf){

    this.detectCapabilities();

    if(!prefered) prefered = Object.keys(foundBin)[0];

    debug('selected %s ', prefered);

    if(!knownBin[prefered] || !foundBin[prefered]){
      throw 'Cannot satisfy preferred bin '+ prefered;
    }

    var BinWrapper = knownBin[prefered].wrapper;
    return (new BinWrapper(foundBin[prefered]))
      .removeIp(ip, mask, intf);
  };

  this.filterResults = function(filters, results){
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
    return results;
  };

  this.selectResults = function(selector, results){
    if(selector.match(/ip/)){
      // get ips only
      var ips = [];
      _.each(results, function(settings){
        ips = ips.concat(settings.ips);
      });
      results = ips;
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
    return results;
  }

};

module.exports = IpCmdUtils;