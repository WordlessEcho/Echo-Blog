---
title: Using Built-in Variable Font on Android
date: 2021-11-08 16:05:11
---

You can use variable font for **some writing system** after Android Oreo.
<!--more-->
----

In Android Oreo, it is the first time that Android support variable font. And Android add `NotoSansKhmer-VF.ttf` for Khmer language.

[Line 214 in fonts.xml of Android Oreo](https://cs.android.com/android/platform/superproject/+/android-8.0.0_r1:frameworks/base/data/fonts/fonts.xml;l=214)
```xml
<!-- ... -->

<family lang="und-Khmr" variant="elegant">
    <font weight="100" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="26.0" />
    </font>
    <font weight="200" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="39.0" />
    </font>
    <font weight="300" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="58.0" />
    </font>
    <font weight="400" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="90.0" />
    </font>
    <font weight="500" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="108.0" />
    </font>
    <font weight="600" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="128.0" />
    </font>
    <font weight="700" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="151.0" />
    </font>
    <font weight="800" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="169.0" />
    </font>
    <font weight="900" style="normal">NotoSansKhmer-VF.ttf
        <axis tag="wdth" stylevalue="100.0" />
        <axis tag="wght" stylevalue="190.0" />
    </font>
</family>

<!-- ... -->
```

Android will use different font in different language automatically. You can directly set [fontVariationSettings](https://developer.android.com/reference/android/widget/TextView#attr_android:fontVariationSettings) for Khmer language.

# How to use variable font?
In this example, we set width to 25, and weight to 32.
```xml
<EditText
    <!-- ... -->
    <!-- Khmer language as example -->
    android:text="ភាសាខ្មែរ"
    android:fontVariationSettings="'wdth' 25, 'wght' 32" />
```

You should follow the syntax in [Android document](https://developer.android.com/reference/android/widget/TextView#setFontFeatureSettings(java.lang.String)) to `fontVariationSettings`.

...and check OpenType document to learn more about axis tags:
- [OpenType Font Variations overview (OpenType 1.8.4) - Typography | Microsoft Docs](https://docs.microsoft.com/en-us/typography/opentype/spec/otvaroverview)
- [OpenType Design-Variation Axis Tag Registry (OpenType 1.8.4) - Typography | Microsoft Docs](https://docs.microsoft.com/en-us/typography/opentype/spec/dvaraxisreg)

# Which language have built-in variable font?
You can directly check [fonts.xml](https://cs.android.com/android/platform/superproject/+/master:frameworks/base/data/fonts/fonts.xml). Switch branch for different version of Android. Search `axis`(tags in fonts.xml for variable font) in `fonts.xml`.

For example, this is a serif (`fallbackFor="serif"`) font of Armenian (`lang="und-Armn"`) that support variable. At regular weight (`weight="400"`) Android will set its 'wght' to 400.
```xml
<family lang="und-Armn">
  <!-- ... -->

  <font weight="400" style="normal" fallbackFor="serif"
        postScriptName="NotoSerifEthiopic-Regular">NotoSerifEthiopic-VF.ttf
      <axis tag="wght" stylevalue="400"/>
  </font>

  <!-- ... -->
</family>
```

## For English
Android add variable version of Roboto (default font of English) since Android 12. But for some reason, they use static version in regular weight.

```xml
<font weight="400" style="normal">RobotoStatic-Regular.ttf</font>
```

You can set `textStyle` to bold (or any other you want) to use variable version of Roboto. Then you can set any "text style" you like (`"'wght' 400"` for regular if you wish) by `fontVariationSettings`.
```xml
<EditText
    <!-- ... -->
    android:text="A quick brown fox jumps over a lazy dog"
    <!-- or any text style you want -->
    android:textStyle="bold"
    android:fontVariationSettings="'ital' 0.5, 'wdth' 85.5, 'wght' 450" />
```

## For CJK (Chinese, Japanese and Korean)
Unfortunately, Android doesn't include variable Noto CJK yet. There is a [issue](https://issuetracker.google.com/issues/186033995) to request Google add variable version of Noto CJK into Android. Please **star it** to support the request.

# My app
I wrote a app that use Android API to set variation. And it allows user to import own fonts to try.

![App Preview en](doc/pics/variable-font-test-en.gif)

[WordlessEcho/Variable-Font-Test: A simple app to test variable font in system.](https://github.com/WordlessEcho/Variable-Font-Test)
