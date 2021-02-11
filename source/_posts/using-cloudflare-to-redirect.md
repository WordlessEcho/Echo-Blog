---
title: 用CloudFlare重定向域名
date: 2018/12/22 03:14:16
---
拥有多个域名后的烦恼。
<!--more-->
----

# 需求
我有一个用我真名命名的域名，姑且称为 xiaoming.com。有一个圈名命名的域名，姑且称为 example.com。
- 将 xiaoming.com/ 和 www.xiaoming.com/ 的请求 301 重定向到 example.com/about
- 向下兼容以前在 xiaoming.com 下创建过的文章链接
- 将 www.example.com 的请求全部重定向到 example.com

# 配置
## 页面规则（Page Rules）
CloudFlare 有一个强大的功能，叫做 Page Rules，它可以实现链接匹配并进行一些特殊操作，例如：始终使用 HTTPS、始终在线（always online）和链接跳转等功能。免费版下，每个域名有三条规则的上限，不过对于现有需求来说也够用了。

首先打开 CloudFlare 面板 > xiaoming.com > Page Rules 来创建两条规则：
- If：\*xiaoming.com/，then：https://example.com/about
- If：\*xiaoming.com/\*，then：https://example.com/$2

> 因为规则是顺位匹配的，所以在添加规则时，一定要注意规则的排序。

同样，打开 example.com 的 Page Rules：
- If：\*example.com/\*，then：https://example.com/$2

上述几条规则对于有编程经验的人来说应该不难理解，这里稍微做一些说明：
- \* 即通配符，在此位置上的任意字符都会被判定为符合规则。比如 blog.example.com、www.example.com 和 example.com/foobar 都会匹配到 \*example.com/\* 这条规则，而 example.com/foobar 和 www.example.com/foobar 就不会匹配到 \*example.com/ 这条规则。
- $ 类似于参数，\$1 代表着 if 中第一个 * 里的字段，以此类推，\$2 就是第二个 \* 中的字段。例如 https://example.com/foobar 在上述 example.com 的规则一里，\$1 就是「https://」，\$2 就是「foobar」。

# DNS 解析记录
一开始在这里百思不得其解，没有解析记录的域名当然是无法被解析的，访问时找不到 IP，当然没法跳转。

所以我们需要新建 www.xiaoming.com、xiaoming.com 和 www.example.com 这三条解析记录，在这里我将解析类型设为 CNAME，值设为了 example.com，而 CDN 保持默认开启状态，否则可能会出现证书问题。至此，我们设定的 Page Rules 就生效了。

# 参考
- [How do I perform URL forwarding or redirects with Cloudflare?](https://support.cloudflare.com/hc/en-us/articles/200172286-How-do-I-perform-URL-forwarding-or-redirects-with-Cloudflare)
- [正则表达式 - 维基百科，自由的百科全书](https://zh.wikipedia.org/zh-cn/正则表达式)
- [What are the special dollar sign shell variables? - Stack Overflow](https://stackoverflow.com/questions/5163144/what-are-the-special-dollar-sign-shell-variables)
- [Redirecting www to non www - Getting Started - CloudFlare Community](https://community.cloudflare.com/t/redirecting-www-to-non-www/2949/24)
