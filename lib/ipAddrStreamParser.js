
var byline = require('byline');
var pkg = require('../package.json');

var ipAddrStreamParser = function(){

  var debug = require('debug')(pkg.name);

  var currentInterface = null;
  var foundInterfaces = {};
  var curLineIndex = 0;

  this.parse = function(cliStream){
    var lineStream = byline(cliStream);
    lineStream.on('data', this.findInterfaceName);
    lineStream.on('data', this.checkfirstInterfaceName);
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
    if(line.match(/^[0-9]+:\s+[a-z0-9]+:/i)){
      var m = line.match(/^([0-9]+):\s+([a-z0-9]+):/i);
      currentInterface = m && m[2];
      var mtu = line.match(/mtu\s+([^ ]+)/i);
      var qdisc = line.match(/qdisc\s+([^ ]+)/i);
      var state = line.match(/state\s+([^ ]+)/i);
      var group = line.match(/group\s+([^ ]+)/i);
      var qlen = line.match(/qlen\s+([^ ]+)/i);
      foundInterfaces[currentInterface] = {
        name:currentInterface,
        mtu: mtu && mtu[1],
        qdisc: qdisc && qdisc[1],
        state: state && state[1],
        group: group && group[1],
        qlen: qlen && qlen[1],
        ips:[]
      };
      return currentInterface;
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
      var ip = ipDesc[2].match(/^([^/]+)[/]/);
      var scope = line.match(/scope\s+([^ ]+)/i);
      var dynamic = line.match(/scope\s+[^ ]+\s+(dynamic|secondary)/i);
      var interfaceName = line.match(/([^ ]+)\s*$/i);
      var netmask = ipDesc[2].match(/[/]([0-9]+)/);
      var broadcast = line.match(/brd\s+([^ ]+)/i);

      foundInterfaces[currentInterface].ips.push({
        type: (ipvType && ipvType[1] === 'inet6') ?'ipv6':'ipv4',
        ip: ip && ip[1],
        scope:scope && scope[1],
        dynamic:dynamic && dynamic[1],
        interfaceName:interfaceName && interfaceName[1].match(currentInterface) && interfaceName[1] || currentInterface,
        netmask:netmask && netmask[1],
        broadcast:broadcast && broadcast[1]
      });
    }
  };
  this.findLoop = function(line){
    line = ''+line;
    if(line.match(/^\s+loop/)){
      foundInterfaces[currentInterface].isLoop = line.match(/^\s+link\/loopback/) || false;
    }
  };
  this.findEther = function(line){
    line = ''+line;
    if(line.match(/^\s+link\/ether/)){
      foundInterfaces[currentInterface].isEther = !!line.match(/^\s+link\/ether/).length;
      foundInterfaces[currentInterface].etherAddress = line.match(/^\s+link\/ether\s+([^ ]+)/)[1];
    }
  };
  this.printLog = function(line){
    console.log(line.toString())
  };
  this.printInfo = function(){
    console.log(JSON.stringify(foundInterfaces,null,4))
  };
};

module.exports = ipAddrStreamParser;