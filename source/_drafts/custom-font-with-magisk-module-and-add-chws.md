---
title: Android自制Magisk字体模块并添加标点挤压
date: 2021-12-27 17:42:41
---

包括OTC字体和可变字体。
<!--more-->

下载[Visual Studio Code](https://code.visualstudio.com/)。

打开Visual Studio Code，点击左下角小齿轮，然后选择settings。
![vsc-settings.png](https://s2.loli.net/2021/12/27/ATklIqo324KMazb.png)

在设置页面上方的搜索框中输入「eol」，将「Files: Eol」的设置选为「\n」，如图：
![vsc-eof.png](https://s2.loli.net/2021/12/27/2SzIPn9E4wO5cfR.png)

随便新建一个文件夹，我在桌面新建一个「module」作为示范。回到Visual Studio Code，关闭设置页面，点击左上角「File」，然后选择「Open Folder...（打开文件夹）」，选择我们新建的文件夹。
![vsc-open-folder.png](https://s2.loli.net/2021/12/27/wtUfXZh5GpdLu3r.png)

选择蓝色的「Yes, I trust the authors（信任我们新建的文件夹）」：
![vsc-trust-authors.png](https://s2.loli.net/2021/12/27/zJLEG1cqd6ts5Qf.png)

按照[Magisk官方文档](https://topjohnwu.github.io/Magisk/guides.html#magisk-module-installer)，我们右键左边窗格的空白处，选择「New Folder（新建文件夹）」，然后输入`META-INF/com/google/android/`：
![vsc-new-folder.png](https://s2.loli.net/2021/12/27/rUp86GxkeBt7cSz.png)

创建完以后应该像这样：
![finished-meta-inf.png](https://s2.loli.net/2021/12/27/mrIToCQdS6RVtXc.png)

右键「android」，选择「New File（新建文件）」，文件名为`update-binary`：
![create-update-binary.png](https://s2.loli.net/2021/12/27/QYr82HoXDUWFpGI.png)

打开[Magisk/module_installer.sh at master · topjohnwu/Magisk](https://github.com/topjohnwu/Magisk/blob/master/scripts/module_installer.sh)，复制全文，如图：
![select-and-copy-module-installer-sh.png](https://s2.loli.net/2021/12/27/jUCxuvHLOiIbS8d.png)

粘贴到我们新建的`update-binary`中，注意这个小黑点，它代表着你还没有保存。然后按「Ctrl+S」保存（macOS快捷键为「⌘Command+S」）：
![vsc-update-binary.png](https://s2.loli.net/2021/12/27/5emdaWuksgh8E1j.png)

按刚刚的方法，再在`android`下新建一个叫`updater-script`的文件，内容为`#MAGISK`。

此时左侧窗格应该如图所示：
![init-meta.png](https://s2.loli.net/2021/12/27/nvZeWOMNxPaKdu6.png)

在左侧窗格的下方空白处右键，点击「New File」，命名为「module.prop」：
![create-module-prop.png](https://s2.loli.net/2021/12/27/G7RbJWzkjEwZoLh.png)

粘贴如下内容：
```
id=<string>
name=<string>
version=<string>
versionCode=<int>
author=<string>
description=<string>
```

- id必须为大小写字母、-、.和_，具体规则：`^[a-zA-Z][a-zA-Z0-9._-]+$`，不能和别人的模块重复。
- versionCode必须为整数。

示例。留意右下角，必须是LF，否则倒回去重新看VSC设置的部分：
![module-prop-example.png](https://s2.loli.net/2021/12/27/jlrFpkhUNec3nK2.png)

到这一步，你的Magisk模块已经形成骨架并可以刷入了，我们来往里面填内容。

新建文件夹`system/fonts`，然后把字体拖动到`fonts`下：
![copy-to-system-fonts.png](https://s2.loli.net/2021/12/27/tNQj1ulS8IabAUK.png)

然后，右键左侧窗格的下方空白处，新建文件`customize.sh`，并复制以下内容：
```sh
# Fork from https://github.com/simonsmh/notocjk/blob/master/customize.sh
# Mirror of system
[ -x "$(which magisk)" ] && MIRRORPATH=$(magisk --path)/.magisk/mirror || unset MIRRORPATH
# Edit fonts_base.xml for OnePlus
FILES="fonts.xml fonts_base.xml"
# Location of font config
FILEPATH=/system/etc/

for FILE in $FILES
do
    ui_print "- Migrating $FILE"
    # Create directories for font config of mod
    mkdir -p $MODPATH$FILEPATH
    # Copy font config from system
    cp -af $MIRRORPATH$FILEPATH$FILE $MODPATH$FILEPATH$FILE

    # 英文无衬线字体
    sed -i '
      /<family name=\"sans-serif\">/,/<\/family>/ {/<\/family>/      ! d;
      /<\/family>/ s/.*/【填入内容】/};
      ' $MODPATH$FILEPATH$FILE

    # 其他语言无衬线字体
    sed -i '
      /<family lang=\"【语言】\">/,/<\/family>/ {:a;N;/<\/family>/!ba;
      s/<family lang=\"【语言】\">.*Noto.*CJK.*<\/family>/<family lang="zh-Hans">\n【填入内容】\n        <font weight="400" style="normal" index="2" fallbackFor="serif"\n               postScriptName="NotoSerifCJKjp-Regular">NotoSerifCJK-Regular.ttc\n        <\/font>\n<\/family>/};
      ' $MODPATH$FILEPATH$FILE
done

ui_print "- Migration done."
```

## OTF
如果是英文字体，字体名为RobotoStatic-Regular.ttf，填：
```sh
sed -i '
  /<family name=\"sans-serif\">/,/<\/family>/ {/<\/family>/      ! d;
  /<\/family>/ s/.*/<font weight="400" style="normal">RobotoStatic-Regular.ttf<\/font>/};
  ' $MODPATH$FILEPATH$FILE
```

如果是简中字体，替换无衬线体，字体名为NotoSansSC-Regular.otf，填：
```sh
sed -i '
  /<family lang=\"zh-Hans\">/,/<\/family>/ {:a;N;/<\/family>/!ba;
  s/<family lang=\"zh-Hans\">.*Noto.*CJK.*<\/family>/<family lang="zh-Hans">\n<font weight="400" style="normal">RobotoStatic-Regular.ttf<\/font>\n<\/family>/};
  ' $MODPATH$FILEPATH$FILE
```
