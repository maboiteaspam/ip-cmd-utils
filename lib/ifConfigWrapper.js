
var child_process = require('child_process');
var pkg = require('../package.json');

var ifConfigWrapper = function(binPath){

  var debug = require('debug')(pkg.name);

  this.showSettings = function(){
    // ifconfig
    return child_process.spawn(binPath, ['-a']).stdout;
  };
  this.addIp = function(ip, mask, intf){
    // ifconfig enp5s0:0 192.168.1.15 netmask ip up
    var pArgs = [intf,ip];
    if(mask) pArgs.push('netmask');
    if(mask) pArgs.push(mask);
    pArgs.push('up');
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
    // ifconfig enp5s0:0 192.168.1.15 netmask ip down
    var a = [intf,ip];
    if(mask) a.push('netmask');
    if(mask) a.push(mask);
    a.push('down');
    var spawned = child_process.spawn(binPath, a);
    var out = '';
    spawned.stdout.on('data', function (data) {
      out+=''+data;
    });
    spawned.stderr.on('data', function (data) {
      out+=''+data;
    });
    spawned.on('close', function (code) {
      debug('%s code %s', binPath, code);
      debug('%s says %s', binPath, out);
      spawned.emit('done',out==='');
    });
    return spawned;
  };
};

module.exports = ifConfigWrapper;
