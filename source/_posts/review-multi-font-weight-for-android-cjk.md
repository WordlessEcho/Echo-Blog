---
title: 为Android的CJK加上多字重之拾遗
date: 2020-05-31 00:11:01
---

各位好，我是回音。是[Android 7+ 添加全字重 Noto Sans CJK](https://zhuanlan.zhihu.com/p/25027320)的作者。在过去三年多的时间里，Android经历了两个版本的迭代。
从这篇文章落稿后，我又回顾了「为Android CJK字体加上多字重」的事情。

## Maigsk模块
首先是[@simonsmh](https://github.com/simonsmh)维护的NotoCJK这个Magisk模块。它的旧名为magisk-notosanscjk-nougat，一开始由于GitHub免费版单文件最大大小限制为100MB，
所以并没有采用单文件的super OTC方案，而是一个字重分一个文件。后来Android P加入了Noto Serif CJK，[@simonsmh](https://github.com/simonsmh)又做了一个NotoCJK-P。
不久后合并到一个模块，即notocjk中处理。

后来Magisk框架的主要维护者，John Wu决定清理低质模块，[顺带一并清除了所有字体模块](https://twitter.com/topjohnwu/status/1229896206584664065)。我能理解他的做法，
大多数字体模块只是简单的将字体重命名为Roboto-Regular.ttf，然后把系统默认字体替换掉。不过NotoCJK这个模块绝不是，因为涉及到要加字重，所以必须要修改fonts.xml。
具体大家可以看我原来写的文章。

## Rikka的FontProvider
Rikka在半年后推出了一个叫[FontProvider](https://github.com/RikkaApps/FontProvider)的应用。本质上是通过安装一个应用，下载全字重的字体文件，然后供各种应用调用。
本意是希望建立一个生态，替换掉Google稀烂的downloadable fonts，提供给不希望修改系统的用户。然而建立生态是十分困难的，
Rikka作为一个独立开发者很难推动用户和开发者两边的人都使用这个应用，项目在一段时间后停止维护，在Android 10上字体预览也不太正常


## Android中的使用
接下来说说Android和这套字体的关系。细心的朋友可能会注意到，Noto Sans CJK还提供了等宽字体（monospace）的常规字重和粗体字重。在Android P之前，
CJK字体和西文字体并不是「对等关系」。西文有非衬线体、衬线体、condensed（抱歉，我真不知道它的中文是什么）和等宽字体，这些不同类型的字体遇到中文后，
只能统一转到CJK的「非衬线体」（中文里对应的是黑体）。Android P则加入了fallbackFor这个属性，Google用来支持CJK的「衬线体」（中文里对应的是宋体）。
其实也就同时开放了CJK字体对condensed和等宽字体的支持。

在Android P以前，Android调用不同字重的字体靠的是fontFamily属性，比如我想调用非衬线体的medium字重的话，我需要指定fontFamily为sans-serif-medium。
对我的文章有比较深入了解的朋友就会好奇了，我们在fonts.xml中，指定字重写的是一个个数值，根本没有见到字重的名字啊？其实fonts.xml里用了一个alias（别名）标签，
给这些数值取名，然后开发者才能正确调用这些字重。Noto Sans CJK总共7种字重，相较于Roboto，多一个demi-light（350）字重。而Noto Serif CJK也有7种字重，
Noto Serif则仅有可怜的regular和bold字重，多了足足5种。这也就意味着系统里本身是不会自带sans-serif-demi-light这类标签的，这导致了这类字重处在一个很尴尬的位置——
没有办法被调用。Android P则给开发者引入了一个新的textFontWeight属性，允许开发者设定具体数值。

这里讲一个小插曲，中文注音符号的字体从[7.0预览版](https://android.googlesource.com/platform/frameworks/base/+/refs/heads/nougat-dev/data/fonts/fonts.xml#340)
开始就一直处于TODO状态。
```xml
<!-- TODO: Add Bopo -->
```

但是直到[9.0](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-9.0.0_r56/data/fonts/fonts.xml#527) Google才正式把这个坑填上
```xml
<family lang="zh-Hant zh-Bopo">
```

然后在[10.0](https://android.googlesource.com/platform/frameworks/base/+/refs/tags/android-10.0.0_r36/data/fonts/fonts.xml#552)里又改了一次，加了个逗号进去
```xml
<family lang="zh-Hant,zh-Bopo">
```

## 孪生兄弟：思源字体
再讲讲Noto CJK和它的孪生兄弟思源字体。Noto和思源本质上是同一套字体，不过他们之间又有一些细微的差别。首先是字重，各位看下面这张表就可以了，我怕绕晕大家。
![font-weight-between-the-source-han-and-noto.jpg](https://i.loli.net/2020/05/31/KENmsWrp5nJGjVb.jpg)

其次是字形，Noto CJK分为简体中文、繁体中文、日语和韩语。而思源黑体则分为简体中文、繁体中文、香港、日语和韩语。这时可能马上就会跳出一个人说，香港出现在这里十分突兀啊！
这是因为两者的繁体中文都是基于台湾标准的，所以和香港标准的多少有所不同。不过如果你在[Adobe的ultra OTC项目](https://github.com/adobe-fonts/source-han-super-otc)
里下载的话，就会得到一份Noto CJK HK，这说明Noto也是可以打包出香港版本的。遗憾的是，Android的字体仍不能做到这么精确设定，期待Android后续的改进了。

最后，仍要感谢[Toby Tso](https://twitter.com/tsopn)写了很多关于这方面的文章，除了查阅AOSP源代码，很多关键部分少不了他的支持。
顺便宣传一下[我做的super otc的模块](https://github.com/WordlessEcho/Noto-Super-OTC-Installer)。感谢阅读！
