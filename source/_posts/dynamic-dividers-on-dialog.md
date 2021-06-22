---
title: Dynamic display dividers on scrollable Dialog of Material UI
date: 2021/06/22 08:48:19
---

Hide top divider while scrolling to the top, hide bottom divider while scrolling to the end?
<!--more-->
----

首发于[[Dialog] Add Divider to Dialog · Issue #3155 · mui-org/material-ui · GitHub](https://github.com/mui-org/material-ui/issues/3155#issuecomment-863226215)，故用英文行文。

### Example

Here is an example on [CodeSandbox](https://codesandbox.io/s/dialog-with-dynamic-dividers-j1ucw).

![dialog-example](https://user-images.githubusercontent.com/12007025/122402749-5c05a680-cfb0-11eb-8f16-1cfb910c44ed.gif)

### Details

Create two variables to control dividers.

```jsx
const [topDivider, setTopDivider] = useState(false);
const [bottomDivider, setBottomDivider] = useState(false);
```

Create a function to initilize status of dividers. Because `Dialog` have its own "lifecycle". (You will see the explanation below)

```jsx
const initializeDividers = () => {
  setTopDivider(false);
  setBottomDivider(false);

  /* ... */
};
```

Detect if scrollbar exist by comparing [`scrollHeight`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight) with [`clientHeight`](https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight).[^1]

The id in `getElementById` is for `DialogContent`.

```jsx
const initializeDividers = () => {
  /* ... */

  const dialogContent = document.getElementById('dialog-content');

  if (dialogContent !== null) {
    if (dialogContent.scrollHeight > dialogContent.clientHeight) {
      setBottomDivider(true);
    }
  }
};
```

Adding `initializeDividers` to `Dialog` in [`onEnter`](https://material-ui.com/api/dialog/#props). Because display of `Dialog` is control by `open`. (Now you know why we don't use Effect Hook) You will get `null` if you are using React Effect Hook to get element.

```jsx
<Dialog
  open={/* variable from caller */}
  onEnter={initializeDividers}
  scroll="paper"
>

{/* ... */}
```

Add `Divider`s before & after `DialogContent` with its variable from State Hook. And don't forget to set a id for `DialogContent`.

```jsx
{topDivider ? <Divider /> : null}
<DialogContent id="dialog-content">
  {/* ... */}
</DialogContent>
{bottomDivider ? <Divider /> : null}
```

Now let's handle the scrolling.

You need to listen the `onScroll` event in `DialogContent`.

```jsx
const handleScrolling = (e: React.UIEvent<HTMLDivElement>) => {
  /* ... */
};

/* ... */

<DialogContent id="dialog-content" onScroll={handleScrolling}>
  {/* ... */}
</DialogContent>
```

Assert the type of `event.target` to `HTMLDivElement`.[^2] [^3]

```jsx
const handleScrolling = (e: React.UIEvent<HTMLDivElement>) => {
  const target = e.target as HTMLDivElement;

  /* ... */
};
```

Compare the [`scrollTop`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollTop) with the difference between [`scrollHeight`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight) and [`scrollHeight`](https://developer.mozilla.org/zh-CN/docs/Web/API/Element/scrollHeight).[^4] [^5]

```jsx
const handleScrolling = (e: React.UIEvent<HTMLDivElement>) => {
  /* ... */

  setTopDivider(target.scrollTop !== 0);
  setBottomDivider(target.scrollTop !== target.scrollHeight - target.offsetHeight);
};
```

### Credits & Reference

[^1]: [Check whether HTML element has scrollbars using JavaScript - GeeksforGeeks](https://www.geeksforgeeks.org/check-whether-html-element-has-scrollbars-using-javascript/)
[^2]: [angular - Property 'value' does not exist on type 'EventTarget' - Stack Overflow](https://stackoverflow.com/a/42066698)
[^3]: [TypeScript: Documentation - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions)
[^4]: [reactjs - is this possible to get scroll position in material-ui select list on Scroll? - Stack Overflow](https://stackoverflow.com/a/55262502)
[^5]: [browser - How to get scrollbar position with Javascript? - Stack Overflow](https://stackoverflow.com/a/2481370)
