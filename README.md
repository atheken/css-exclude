#What is `css-exclude`?

css-exclude is a simple utility that allows you to input two css files, and have the utility print out the rules/at-rules that are found in the first file, but not the second.

css-exclude doesn't care about document order, which makes it dangerous to use on complex CSS files, but if you're trying to resolve missing declarations between two css files, it's a great diagnostic tool.


###&lt;blink>WARNING: ALPHA!&lt;/blink>

I cooked up this utility to take two files, and remove all the rules from the first that are present in the second so:

Given `file1.css`

```css
.rule-in-first-test{
  display: none;
}

.rule-not-matching-in-both{
  background: red;
}

.rule-matching-in-both{
  color: purple;
}
```

And `file2.css`

```css
.rule-in-second-test{
  display: none;
}

.rule-not-matching-in-both{
  background: green;
}

.rule-matching-in-both{
  color: purple;
}
```

Run `cssexclude`

```bash
cssexclude ./file1.css ./file2.css
```

And get this result:

```css
.rule-in-first-test {
  display : none;
}
.rule-not-matching-in-both{
  background: red;
}
```


To Install:

```bash
npm install -g atheken/css-exclude
```

