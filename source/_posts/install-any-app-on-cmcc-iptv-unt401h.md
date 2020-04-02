---
title: 在移动魔百盒（UNT401H）上安装任意应用
date: 2019/05/10 09:53:09
---
由于广电政策限制，IPTV 是无法随意安装应用的，但这个盒子搭载 Andorid 系统还有 Wi-Fi，不用实在太可惜。一般这样的设备都会开放网络 ADB，用 ADB 安装之后再用 ADB 打开就可以了。

ADB 的端口开放在 30016，找到盒子的 IP 然后连接：
```shell
adb connect <IP>:30016
```

连接成功后再安装 APK：
```shell
adb install <path-to-your-apk>.apk
```

再使用 monkey 打开应用：
```shell
adb shell monkey -p app.package.name -c android.intent.category.LAUNCHER 1
```

# 感谢
- [UNT401H 破解 思路_中国移动魔百盒_ZNDS](https://www.znds.com/forum.php?mod=viewthread&tid=1138683)
- [九联UNT401H魔百合adb安装当贝桌面 - 机顶盒/智能电视 数码之家](https://www.mydigit.cn/forum.php?mod=viewthread&tid=8849)
- [How to start an application using android ADB tools? - Stack Overflow](https://stackoverflow.com/a/25398877)
