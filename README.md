# IP cmd utils

Should enable you to add/del ip on your local computer without a pain.

It provides wrapper commands around both ```ifconfig``` and ```ip```.

Maybe it is possible to add support for both macos and windows. 

### you may need to use su

The bin will let you know when it is required.


### Beware Beware Beware Beware

It is not production ready at all. 

Feel free to improve if you feel to. 

I intent to use that to dynamically build network on my local computer.


# Usage

```
  Usage: ip-cmd-utils [options] [command]


  Commands:

    show [options]               Show configuration
    add <ip> <mask> <interface>  add IP address
    del <ip> <mask> <interface>  del IP address
    *                            display help

  Options:

    -h, --help          output usage information
    -V, --version       output the version number
    -q, --quiet         Less verbose
    -v, --verbose       More verbose
    --prefer <bin>      Prefered bin (ip, ifconfig)
    -p, --pretty-print  Pretty printing

  Output: JSON data

```

# Examples

Show network settings
```
ip-cmd-utils show -p
... output some JSON, -p will pretty print
```

Add ip
```
ip-cmd-utils add <ipName> <mask> <interface>
[empty response is good]
```

Del ip
```
ip-cmd-utils del <ipName> <mask> <interface>
[empty response is good]
```

Auto configure new ip @todo @todo
```
ip-cmd-utils add-ip
xxx.xxxx.Xxx.Xx
```

Delete ip automatically and correctly @todo @todo
```
ip-cmd-utils del-ip xxx.xxxx.Xxx.Xx
[empty response is good]
```

View more information
```
ip-cmd-utils show -v
...Displays all debug information
```

```
ip-cmd-utils show -p --filter lan --only ip,name
...Show only IP names from LAN interfaces
```

```
ip-cmd-utils show -p --filter ipv6 --only ip
...Show only IP settings of ipv6 addresses
```

```
ip-cmd-utils show -p --filter ipv6 --only intf,name
...Show only Interfaces names which have ipv6 addresses
```



## Using with jq

show interface, ipv type, and their ip
```
ip-cmd-utils | jq '.[] | {name, ips: .ips[] | {ip,interfaceName,type} }'
```

show interface only
```
ip-cmd-utils | jq  '.[] | {name}'
```

show ip only
```
ip-cmd-utils | jq  '.[] | {ips[] | {ip} }'
```