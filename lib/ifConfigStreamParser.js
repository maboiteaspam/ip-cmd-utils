
var byline = require('byline');
var pkg = require('../package.json');

var ifConfigStreamParser = function(){

  var debug = require('debug')(pkg.name);

  var currentInterface = null;
  var foundInterfaces = {};
  var curLineIndex = 0;
  var currentInterfaceIndex = '';

  this.parse = function(cliStream){
    var lineStream = byline(cliStream);
    lineStream.on('data', this.findInterfaceName);
    lineStream.on('data', this.checkfirstInterfaceName);
    lineStream.on('data', this.findInterfaceIndex);
    lineStream.on('data', this.findLoop);
    lineStream.on('data', this.findEther);
    lineStream.on('data', this.findIp);
    lineStream.on('data', this.lineIndex);
    lineStream.on('end', function(){
      lineStream.emit('parsed', foundInterfaces);
    });
    return lineStream;
  };

  this.lineIndex = function(){
    curLineIndex++;
  };
  this.findInterfaceName = function(line){
    line = ''+line;
    if(line.match(/^[a-z0-9]+:([0-9]+:)?\s+/i)){
      var m = line.match(/^([a-z0-9]+):(([0-9]+):)?\s+/i);
      currentInterface = m && m[1];
      var mtu = line.match(/mtu\s+([^ ]+)/i);
      var state = line.match(/UP,/i)?'UP':'DOWN';
      if(!foundInterfaces[currentInterface]){
        foundInterfaces[currentInterface] = {
          name:currentInterface,
          mtu: mtu && mtu[1],
          qdisc: null,
          state: state,
          group: null,
          qlen: null,
          ips:[]
        };
      }
      return currentInterface;
    }
  };
  this.findInterfaceIndex = function(line){
    line = ''+line;
    if(line.match(/^[a-z0-9]+:/i)
      && line.match(/mtu\s+[0-9]+$/i)){
      var m = line.match(/^([a-z0-9]+):([0-9]+)?/i);
      var cntInterface = m && m[1];
      if(currentInterface === cntInterface && m && m[2] ){
        currentInterfaceIndex = ':'+m[2];
      } else {
        currentInterfaceIndex = '';
      }
    }
  };
  this.checkfirstInterfaceName = function(){
    if(curLineIndex===0 && !currentInterface){
      throw 'Could not find interface !';
    }
  };
  this.findIp = function(line){
    line = ''+line;
    var ipvType = line.match(/^\s+(inet[6]?)/);
    if(ipvType){
      var ipDesc = line.match(/^\s+(inet[6]?)\s+([^ ]+)/);
      var ip = ipDesc[2].match(/^([^ ]+)/);
      var scope = line.match(/scopeid\s+[a-z0-9]+<([^ ]+)>/i);
      var netmask = ipDesc[2].match(/netmask\s+([^ ]+)/);
      var broadcast = line.match(/broadcast\s+([^ ]+)/i);
      debug('ipvType=%s ip=%s scope=%s netmask=%s broadcast=%s',
        ipvType[1],
        ip && ip[1],
        scope && scope[1],
        netmask && netmask[1],
        broadcast && broadcast[1]);
      foundInterfaces[currentInterface].ips.push({
        type:(ipvType && ipvType[1].match(/inet6/))?'ipv6':'ipv4',
        ip: ip && ip[1],
        scope:scope && scope[1],
        dynamic:null,
        interfaceName:currentInterface+''+currentInterfaceIndex,
        netmask:netmask && netmask[1],
        broadcast:broadcast && broadcast[1]
      });
    }


  };
  this.findLoop = function(line){
    line = ''+line;
    if(line.match(/^\s+loop/)){
      foundInterfaces[currentInterface].isLoop = true;
      foundInterfaces[currentInterface].qlen = line.match(/txqueuelen\s+([^ ]+)/)[1];
    }
  };
  this.findEther = function(line){
    line = ''+line;
    if(line.match(/^\s+ether/)){
      foundInterfaces[currentInterface].isEther = true;
      foundInterfaces[currentInterface].etherAddress = line.match(/^\s+ether\s+([^ ]+)/)[1];
      foundInterfaces[currentInterface].qlen = line.match(/txqueuelen\s+([^ ]+)/)[1];
    }
  };
  this.printLog = function(line){
    console.log(line.toString())
  };
  this.printInfo = function(){
    console.log(JSON.stringify(foundInterfaces,null,4))
  };
};

module.exports = ifConfigStreamParser;