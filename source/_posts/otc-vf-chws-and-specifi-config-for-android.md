---
title: Android上使用OTC、可变字体、标点挤压和特别修改
date: 2021-12-27 23:04:40
tags:
---

Android上使用字体使用OTC和可变字体时需要修改fonts.xml，而Noto CJK需要删除一些cmap条目。
<!--more-->

## 依赖
安装Python和[pipx](https://pypa.github.io/pipx/installation/)。

## Android对Noto CJK的修改
详情可见此[README.android](https://android.googlesource.com/platform/external/noto-fonts/+/refs/heads/master/cjk/README.android)。

安装[nototools](https://github.com/googlefonts/nototools)：
```sh
pipx install notofonttools
```

从AOSP下载[subset_noto_cjk.py](https://android.googlesource.com/platform/external/noto-fonts/+/refs/heads/master/cjk/subset_noto_cjk.py)（[Download raw file · Issue #106 · google/gitiles](https://github.com/google/gitiles/issues/106#issuecomment-462030196)）：
```sh
curl "https://android.googlesource.com/platform/external/noto-fonts/+/refs/heads/master/cjk/subset_noto_cjk.py?format=TEXT" | base64 --decode > subset_noto_cjk.py
```

将`subset_noto_cjk.py`中的这行：
```python
TTC_NAMES = ('NotoSansCJK-Regular.ttc', 'NotoSerifCJK-Regular.ttc')
```

修改为：
```python
TTC_NAMES = ('NotoSansCJK-VF.otf.ttc', )
```

**注意，只有一个字体时，不要把末尾的逗号去掉。**

执行：
```sh
# notofonttools虚拟环境
source ~/.local/pipx/venvs/notofonttools/bin/activate
python3 ./subset_noto_cjk.py
# 退出虚拟环境
deactivate
```

这个脚本会去掉一些cmap，避免[Emoji显示的问题](https://github.com/simonsmh/notocjk/issues/21)。输出的字体在当前文件夹的subsetted文件夹下。

## 标点挤压（Contextual Spacing）
详情可见此[README.android](https://android.googlesource.com/platform/external/noto-fonts/+/refs/heads/master/cjk/README.android)，但早期版本的Android实际上并没有使用过这个工具。

安装[East Asian Contextual Spacing](https://github.com/kojiishi/east_asian_spacing)：
```sh
pipx install east-asian-spacing
```

执行：
```sh
east-asian-spacing -o build subsetted/NotoSansCJK-VF.otf.ttc
```

`-o build`参数代表字体输出在当前文件夹的build文件夹下。

## OTC Index
安装[afdko](https://github.com/adobe-type-tools/afdko)：
```sh
pipx install afdko
```

然后执行：
```sh
otc2otf -r NotoSansCJK-VF.otf.ttc | grep Font

Font 0: NotoSansCJKjp-Thin.otf
Font 1: NotoSansCJKkr-Thin.otf
Font 2: NotoSansCJKsc-Thin.otf
Font 3: NotoSansCJKtc-Thin.otf
Font 4: NotoSansCJKhk-Thin.otf
```

这里的数字与TTC index一一对应，如简体中文为2，fonts.xml中zh-Hans的index就为2：
```xml
<family lang="zh-Hans">
    <font weight="100" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
    <!-- ... -->
```

## 可变字体
安装[fonttools](https://github.com/fonttools/fonttools)：
```
pipx install fonttools
```

执行：
```sh
# -y 代表OTC index
ttx -y 2 -t fvar NotoSansCJK-VF.otf.ttc
```

输出内容：
```xml
cat NotoSansCJK-VF.otf.ttx
<?xml version="1.0" encoding="UTF-8"?>
<ttFont sfntVersion="OTTO" ttLibVersion="4.28">

  <fvar>

    <!-- Weight -->
    <Axis>
      <AxisTag>wght</AxisTag>
      <Flags>0x0</Flags>
      <MinValue>100.0</MinValue>
      <DefaultValue>100.0</DefaultValue>
      <MaxValue>900.0</MaxValue>
      <AxisNameID>265</AxisNameID>
    </Axis>

    <!-- Thin -->
    <!-- PostScript: NotoSansCJKsc-Thin -->
    <NamedInstance flags="0x0" postscriptNameID="267" subfamilyNameID="266">
      <coord axis="wght" value="100.0"/>
    </NamedInstance>

    <!-- Light -->
    <!-- PostScript: NotoSansCJKsc-Light -->
    <NamedInstance flags="0x0" postscriptNameID="269" subfamilyNameID="268">
      <coord axis="wght" value="300.0"/>
    </NamedInstance>

    <!-- DemiLight -->
    <!-- PostScript: NotoSansCJKsc-DemiLight -->
    <NamedInstance flags="0x0" postscriptNameID="271" subfamilyNameID="270">
      <coord axis="wght" value="350.0"/>
    </NamedInstance>

    <!-- Regular -->
    <!-- PostScript: NotoSansCJKsc-Regular -->
    <NamedInstance flags="0x0" postscriptNameID="273" subfamilyNameID="272">
      <coord axis="wght" value="400.0"/>
    </NamedInstance>

    <!-- Medium -->
    <!-- PostScript: NotoSansCJKsc-Medium -->
    <NamedInstance flags="0x0" postscriptNameID="275" subfamilyNameID="274">
      <coord axis="wght" value="500.0"/>
    </NamedInstance>

    <!-- Bold -->
    <!-- PostScript: NotoSansCJKsc-Bold -->
    <NamedInstance flags="0x0" postscriptNameID="277" subfamilyNameID="276">
      <coord axis="wght" value="700.0"/>
    </NamedInstance>

    <!-- Black -->
    <!-- PostScript: NotoSansCJKsc-Black -->
    <NamedInstance flags="0x0" postscriptNameID="279" subfamilyNameID="278">
      <coord axis="wght" value="900.0"/>
    </NamedInstance>
  </fvar>

</ttFont>
```

找出Noto Sans CJK各字重的weight值：
```xml
# afdko，见上文OTC index
otc2otf -r NotoSansCJK.ttc | grep jp
Font 0: NotoSansCJKjp-Thin.otf
Font 5: NotoSansCJKjp-Light.otf
Font 10: NotoSansCJKjp-DemiLight.otf
Font 15: NotoSansCJKjp-Medium.otf
Font 20: NotoSansCJKjp-Black.otf
Font 25: NotoSansCJKjp-Regular.otf
Font 30: NotoSansMonoCJKjp-Regular.otf
Font 35: NotoSansCJKjp-Bold.otf
Font 40: NotoSansMonoCJKjp-Bold.otf

ttx -y 0 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="100"/>

ttx -y 5 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="300"/>

ttx -y 10 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="350"/>

ttx -y 25 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="400"/>

ttx -y 15 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="500"/>

ttx -y 35 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="700"/>

ttx -y 20 -t OS/2 NotoSansCJK.ttc
<usWeightClass value="900"/>
```

```xml
<family lang="zh-Hans">
    <font weight="100" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="100.0" />
    </font>
    <font weight="300" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="300.0" />
    </font>
    <font weight="350" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="350.0" />
    </font>
    <font weight="400" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="400.0" />
    </font>
    <font weight="500" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="500.0" />
    </font>
    <font weight="700" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="700.0" />
    </font>
    <font weight="900" style="normal" index="2" postScriptName="NotoSansCJKjp-Thin">NotoSansCJK-VF.otf.ttc
        <axis tag="wght" stylevalue="900.0" />
    </font>

    <!-- ... -->
</family>
```

我记录下来的[Noto Sans CJK和Noto Serif CJK字重数值表](https://github.com/WordlessEcho/Noto-Super-OTC-Magisk#sans-serif)

## 测试
此处安利本人写的[可变字体测试](https://github.com/WordlessEcho/Variable-Font-Test)。
![variable-font-test-zh-tw](https://github.com/WordlessEcho/Variable-Font-Test/raw/main/doc/pics/variable-font-test-zh-tw.gif)
