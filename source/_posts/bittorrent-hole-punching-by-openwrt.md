---
title: 用OpenWRT为BitTorrent打洞
date: 2026-01-18 03:45:13
---

本文将使用OpenWRT上的natmap，设置防火墙规则开放和转发端口，然后以qBittorrent为例，将通告端口改为公网端口。

# 前言
## 一定要用OpenWRT吗？
因为路由器本身就是管理NAT的设备，管理打洞和转发逻辑上就很合适。如果不想将natmap安装在OpenWRT上，可以安装在客户端上。如果没有OpenWRT，设置防火墙可以改为使用natmap的转发模式。

## 为什么不使用UPnP？
UPnP假设内网开放端口的请求都是安全的，没有任何权限控制，本文倾向于手动控制防火墙规则。

## 端口转发结构
运营商会将打洞端口转为公网端口，本文用natmap从STUN服务器检测公网端口。STUN的检测流程可以看[检测 NAT 类型 - NAT 类型初探 | Yesterday17's Blog](https://blog.mmf.moe/post/nat-types/#%E6%A3%80%E6%B5%8B-nat-%E7%B1%BB%E5%9E%8B)里的一张图，非常清晰。
```
+--------------------+          +-------------------+          +-------------------+
| 路由器              |          | 运营商             |          | STUN 服务器        |
|                    | -------->|                   | -------->|                   |
| [natmap打洞端口]    |          | [公网端口]         |          |                   |
+--------------------+          +-------------------+          +-------------------+
```

为了让BT客户端宣告的是公网端口，我们将BT监听端口改成和公网端口一样，然后让OpenWRT防火墙将传入打洞端口的流量转到BT监听端口上
```
                                                                                (Peer)
                                                                                  |
                                                                                  v
+----------------------------+          +--------------------+          +-------------------+ 
| BT客户端                    |          | 路由器              |          | 运营商             |
|                            |<-------- |                    |<-------- |                   |
| [监听端口（改成和公网端口一样）] |          | [natmap打洞端口]    |          | [公网端口]         |
+----------------------------+          +--------------------+          +-------------------+ 
```

# 安装natmap
```sh
opkg install natmap
# OpenWRT 22.03+
opkg install luci-app-natmap
```

# 配置natmap
```sh
uci set natmap.qbt=natmap
uci set natmap.qbt.enable='1'
# 只有IPv4需要打洞
uci set natmap.qbt.family='ipv4'
# 只需要为TCP打洞，UDP协议的uTP会基于BEP-55自己打洞
uci set natmap.qbt.udp_mode='0'
uci set natmap.qbt.interface='wan'
# BitTorrent经常有连接，不需要natmap来维持打洞时间，此处设置了一个月的保活间隔
uci set natmap.qbt.interval='2592000'
# 挑一个连接性好的公共STUN服务器，可以看讨论： https://github.com/heiher/natmap/issues/18
uci set natmap.qbt.stun_server='turn.cloudflare.com'
# 我的路由是小米的，就写了小米路由官网
uci set natmap.qbt.http_server='www.miwifi.com'
# 打洞时会用路由器的这个端口出去，可以随意挑选一个自己喜欢的数字，不要太小（1024~65535）
uci set natmap.qbt.port='<hole punch port>'
# 接下来会在这个位置创建脚本，修改防火墙规则和qBittorrent监听端口
uci set natmap.qbt.notify_script='/usr/bin/notify-firewall-and-qbt.sh'
# 保存但先不重启服务
uci commit natmap
```

# 分配静态地址
首先给运行BT的机器分配静态的IPv4地址
```sh
uci set dhcp.bt_client=host
# 运行BT的机器的MAC地址
uci set dhcp.bt_client.mac='<BT client MAC address>'
# 随意挑选喜欢的内网IPv4，比如192.168.1.2
uci set dhcp.bt_client.ip='<BT client IP address>'
# 保存并重启服务
uci commit dhcp
/etc/init.d/dnsmasq restart
```

# 新建防火墙规则
分别为IPv4 TCP、IPv4 UDP和IPv6创建防火墙规则，用来允许入站，后续会动态修改
```sh
# 转发IPv4 TCP端口
uci set firewall.qbt_ipv4_tcp=redirect
uci set firewall.qbt_ipv4_tcp.name='qBittorrent-IPv4-TCP'
uci set firewall.qbt_ipv4_tcp.src='wan'
# 设置为打洞端口
uci set firewall.qbt_ipv4_tcp.src_dport='<hole punch port>'
uci set firewall.qbt_ipv4_tcp.dest='lan'
# 给BT的机器分配的内网IPv4地址
uci set firewall.qbt_ipv4_tcp.dest_ip='<BT client IP address>'
uci set firewall.qbt_ipv4_tcp.target='DNAT'
uci set firewall.qbt_ipv4_tcp.proto='tcp'
# 之后dest_port会被修改为BT监听端口
uci set firewall.qbt_ipv4_tcp.dest_port='<hole punch port>'

# 转发IPv4 UDP端口
uci set firewall.qbt_ipv4_udp=redirect
uci set firewall.qbt_ipv4_udp.name='qBittorrent-IPv4-UDP'
uci set firewall.qbt_ipv4_udp.src='wan'
uci set firewall.qbt_ipv4_udp.dest='lan'
# 给BT的机器分配的内网IPv4地址
uci set firewall.qbt_ipv4_udp.dest_ip='<BT client IP address>'
uci set firewall.qbt_ipv4_udp.target='DNAT'
uci set firewall.qbt_ipv4_udp.proto='udp'
# 之后src_dport和dest_port会被修改为BT监听端口
uci set firewall.qbt_ipv4_udp.src_dport='<hole punch port>'
uci set firewall.qbt_ipv4_udp.dest_port='<hole punch port>'

# 开放IPv6端口
uci set firewall.qbt_ipv6=rule
uci set firewall.qbt_ipv6.src='wan'
uci set firewall.qbt_ipv6.dest='lan'
uci set firewall.qbt_ipv6.target='ACCEPT'
uci set firewall.qbt_ipv6.family='ipv6'
uci set firewall.qbt_ipv6.proto='tcp udp'
uci set firewall.qbt_ipv6.name='qBittorrent-IPv6'
# 之后dest_port会被修改为BT监听端口
uci set firewall.qbt_ipv6.dest_port='<hole punch port>'

# 保存并重启服务
uci commit firewall
/etc/init.d/firewall restart
```

# 打洞完成后触发的脚本
此脚本会修改防火墙规则，并以qBittorrent为例，通过API设置监听端口
新建脚本并赋予可执行权限
```sh
touch /usr/bin/notify-firewall-and-qbt.sh
chmod +x /usr/bin/notify-firewall-and-qbt.sh
```

安装curl
```sh
opkg install curl
```

写入如下内容
```sh
#!/bin/sh

# https://github.com/heiher/natmap?tab=readme-ov-file#script-arguments
PUBLIC_PORT=$2

# 给BT的机器分配的内网IPv4地址
QBT_HOST="<BT client IP address>"
# qBittorrent WebUI监听端口
QBT_PORT="7474"

# IPv4 TCP
uci set firewall.qbt_ipv4_tcp.dest_port=$PUBLIC_PORT
# IPv4 UDP
uci set firewall.qbt_ipv4_udp.src_dport=$PUBLIC_PORT
uci set firewall.qbt_ipv4_udp.dest_port=$PUBLIC_PORT
# IPv6
uci set firewall.qbt_ipv6.dest_port=$PUBLIC_PORT

uci commit firewall
/etc/init.d/firewall restart >/dev/null 2>&1
echo -e "Setting firewall to forward and open port of $PUBLIC_PORT"

QBT_API_URL="http://$QBT_HOST:$QBT_PORT/api/v2/app/setPreferences"
JSON_PAYLOAD="{\"listen_port\":$PUBLIC_PORT}"

curl -X POST "$QBT_API_URL" \
     --data-urlencode "json=$JSON_PAYLOAD" \
     -H "Content-Type: application/x-www-form-urlencoded"

if [ $? -eq 0 ]; then
    echo -e "Update qBittorrent port to $PUBLIC_PORT"
else
    echo -e "Failed to connect qBittorrent API"
fi
```

# 启动
现在启动qBittorrent，然后观察系统日志，可以用LuCI，或者：
```sh
logread -fe natmap
```

重启natmap
```sh
/etc/init.d/natmap restart
```

# 调试
## notify-firewall-and-qbt.sh
```
/usr/bin/notify-firewall-and-qbt.sh 0 <port>
```

## natmap
如果TCP已经打洞成功，又重启natmap的话，会触发错误（[[E] Cannot assign requested address · Issue #27 · heiher/natmap](https://github.com/heiher/natmap/issues/27)）
```
daemon.err natmap[22007]: [E] hev_sock_client_tcp src/hev-sock.c:171 Cannot assign requested address, Please check is another instance exists or wait a minute. More: https://github.com/heiher/natmap/issues/27
daemon.err natmap[22007]: [E] tnsk_run src/hev-tnsk.c:103 Start TCP keep-alive service failed.
```

natmap会自动重试，忽略即可。如果很急，可以更换一个STUN服务器
```sh
uci set natmap.qbt.stun_server='turn.cloudflare.com'
uci commit natmap
/etc/init.d/natmap restart
```

## 检测打洞是否成功
```sh
telnet <公网IP> <端口>
Connected to <公网IP>
```

## uTP BEP-55
下图展示了主动用uTP连接过我的IPv4地址：
![有I和P flag的IPv4地址](https://s2.loli.net/2026/01/18/DKGg9UdQL4h1WsH.png)
