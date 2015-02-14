
var child_process = require('child_process');
var pkg = require('../package.json');

var ipAddrWrapper = function(binPath){

  var debug = require('debug')(pkg.name);

  this.showSettings = function(){
    // ip addr show
    return child_process.spawn(binPath,['addr','show']).stdout;
  };
  this.addIp = function(ip, mask, intf){
    //ip addr add 192.168.1.15 dev enp5s0
    mask = mask || '24';
    var pArgs = ['addr','add',ip+'/'+mask,'dev',intf];
    debug('%s args %s', binPath, pArgs.join(' '));
    var spawned = child_process.spawn(binPath, pArgs);
    var out = '';
    spawned.stdout.on('data', function (data) {
      out+=''+data;
    });
    spawned.stderr.on('data', function (data) {
      out+=''+data;
    });
    spawned.on('close', function (code) {
      spawned.emit('done',out==='');
    });
    return spawned;
  };
  this.removeIp = function(ip, mask, intf){
    //ip addr del 192.168.1.15/32 dev enp5s0
    mask = mask || '24';
    var spawned = child_process.spawn(binPath,['addr','del',ip+'/'+mask,'dev',intf]);
    var out = '';
    spawned.stdout.on('data', function (data) {
      out+=''+data;
    });
    spawned.stderr.on('data', function (data) {
      out+=''+data;
    });
    spawned.on('close', function (code) {
      spawned.emit('done',out==='');
    });
    return spawned;
  };
};

module.exports = ipAddrWrapper;
