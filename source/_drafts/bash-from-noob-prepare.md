---
title: Bash命令行小白入门：第0节⸺环境准备
date: 2021-02-14 18:12:51
---

各位好！欢迎大家来学习《Bash命令行小白入门》。
<!--more-->

我是没有字的回音。在开始之前，我想和各位介绍一下Bash。

## 什么是Bash
> Bash is the shell, or command language interpreter, for the GNU operating system.
>
>（引自：[Bash Reference Manual](https://www.gnu.org/savannah-checkouts/gnu/bash/manual/bash.html#What-is-Bash_003f)）

简单翻译一下：「Bash是为GNU操作系统打造的shell⸺一种命令语言解释器。」。用大白话说，这就是Linux系统上的命令行。

这句话一下引申出两个概念：Linux系统和命令行。

## 什么是Linux系统
![Linux形象](https://i.loli.net/2021/02/14/hPOBvfEoJcYs4uD.png)
和Windows一样，Linux是一种系统。它被广泛应用在服务器、嵌入式设备（比如智能硬件和路由器）中，还有Android操作系统里也有它的影子。

## 什么是命令行
命令行是一种人和机器交流的方式，相对应的则是图形化交互界面。有些朋友可能已经接触过一些简单的命令行了，比如用`ping baidu.com`测试网络是否正常。
![网络测试](https://i.loli.net/2021/02/14/FWBO4SqZKtAXVH7.png)

我给大家举一个例子，平时大家登录QQ，是像这样输入QQ号和密码：

![QQ登录界面](https://i.loli.net/2021/02/14/B25dnkTEo7xyZc9.png)

在命令行里，会是像这样：

```bash
$ qq login --id "123456789" --password "password"
```

（实际上QQ并未提供命令行版本）

## 环境准备
下面我们就进入今天的正题：环境准备。不用担心，这门课不需要各位安装Linux系统。

### Windows用户
大部分人都使用的是Windows系统，Windows的同学需要先安装一个叫「子系统」的应用，这个东西我们可以理解为一个模拟器，就像是我们平时玩手游用的模拟器。下面我会教大家如何安装这个虚拟机。

首先点击开始，找到「Microsoft Store」这个应用商店。
![找到开始菜单](https://i.loli.net/2021/02/14/J9xUuaGTBNbfksl.png)

点击右上角的搜索按钮。
![搜索按钮](https://i.loli.net/2021/02/14/CMj9PXyGeTlEfDs.png)

在搜索框内输入「Ubuntu」后按回车。
![搜索Ubuntu](https://i.loli.net/2021/02/14/xfbi5eDKkBJzpS7.png)

点击第一个搜索结果。
![搜索详情](https://i.loli.net/2021/02/14/G9172UZJ6emrcPB.png)

然后按「获取」或者「安装」。
![获取Ubuntu](https://i.loli.net/2021/02/14/QW7CgIzZNlGn5dc.png)

如果提示需要登录帐户，直接关闭忽略即可。
![忽略登录请求](https://i.loli.net/2021/02/14/WcmiKry5FGejh8l.png)
![关闭登录窗口](https://i.loli.net/2021/02/14/mb2PJS6eivdGIYx.png)

下载完成后，不急着打开。先打开开始菜单，然后直接输入「启用或关闭Windows功能」。
[![启用Windows功能](https://s3.ax1x.com/2021/02/14/yyKpvD.gif)](https://imgchr.com/i/yyKpvD)

勾选「适用于Linux的Windows子系统」，然后按确定。
![启用子系统](https://i.loli.net/2021/02/14/t2kwBXgIxJEpV3f.png)

在接下来的窗口里点击重启。
![重启请求](https://i.loli.net/2021/02/14/gkrwaLq7feIctZN.png)

重启后，点击开始菜单，找到「Ubuntu」应用。
![Ubuntu应用](https://i.loli.net/2021/02/14/FDqJveNG8RcoOAi.png)

打开后，Ubuntu会执行安装，耐心等待一段时间。
![正在安装](https://i.loli.net/2021/02/14/enApdjhXBkzS7wY.png)

当界面上出现「Enter new UNIX username:」时，说明安装已经完成。下面需要设定一下用户名和密码。

给自己起一个用户名，这个用户名可以随意命名，不必与Windows中的一致。例如我想叫「echo」，输入后按回车。
![用户名例子](https://i.loli.net/2021/02/14/iY7RAhwSEjJHfy8.png)

给自己起一个密码，这个密码也是可以随意起的，不必与Windows中的一致。需要输入两次，但是输入密码时是没有任何提示的，直接盲打就可以了。
![两次输入密码](https://i.loli.net/2021/02/14/ynFHSDfTIaduJeA.png)

如果看到一行绿色的字，就代表配置已经完成了。注意，红框中的内容会因为用户名和计算机名而有差异，所以与图中内容有所不同十分正常。重要的是后面闪烁的横线。
![命令行提示](https://i.loli.net/2021/02/14/lLEFDeNZO2J1SGu.png)

输入（不要直接复制粘贴）「echo HelloWorld」后按回车键，返回「HelloWorld」代表bash运行正常。
```bash
$ echo HelloWorld
```
![echo运行结果](https://i.loli.net/2021/02/14/ox6YDCTKOQ7AaMP.png)

### macOS用户
macOS也就是所谓的「苹果系统」，它的内核其实和Linux有千丝万缕的关系。对于macOS用户来说，只需要找到「终端」并打开就行了。

点击「启动台（launchpad）」。
![启动台](https://i.loli.net/2021/02/14/cyGeY7RDhmM5NuZ.png)

在搜索框输入「终端」或「Terminal」。
![搜索终端](https://i.loli.net/2021/02/14/HwP3Z7iAY6JRlC2.png)

点击打开终端。注意，红框中的内容会因为用户名和计算机名而有差异，所以与图中内容有所不同十分正常。重要的是后面闪烁的竖线。
![命令行提示](https://i.loli.net/2021/02/14/Nq9GfM8dKBtmSLP.png)

输入（不要直接复制粘贴）「echo HelloWorld」后按回车键，返回「HelloWorld」代表bash运行正常。
```bash
$ echo HelloWorld
```
![echo运行结果](https://i.loli.net/2021/02/14/PrjhTiNbgtLd4Fq.png)

### Linux用户
Linux发行版种类繁多，但打开「终端」的步骤大同小异，下面我会演示一下Ubuntu打开终端的过程。

点击「显示应用程序」。
![显示应用程序](https://i.loli.net/2021/02/14/UCTGMJR32pv1tW7.png)

在搜索框输入「终端」。
![搜索终端](https://i.loli.net/2021/02/14/KOpxJgR9zoTkwFM.png)

点击打开终端。注意，红框中的内容会因为用户名和计算机名而有差异，所以与图中内容有所不同十分正常。重要的是后面闪烁的竖线。
![命令行提示](https://i.loli.net/2021/02/14/7hVdOls8ELTYnzZ.png)

输入（不要直接复制粘贴）「echo HelloWorld」后按回车键，返回「HelloWorld」代表bash运行正常。
```bash
$ echo HelloWorld
```
![echo运行结果](https://i.loli.net/2021/02/14/noiZR3khcSUvKOs.png)

## 小结
- **学会打开命令行**：Windows用户要打开「Ubuntu」应用，而macOS和Linux用户需要找到「终端」应用并打开。
- **执行第一条命令**：用「echo HelloWorld」命令来测试我们是否正确打开了bash。

以上就是本节课的全部内容，我们下节课见。

