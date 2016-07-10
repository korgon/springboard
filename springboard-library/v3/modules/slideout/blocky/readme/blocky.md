# Slideout Module
## Blocky Theme

The module <i>will</i> create a slidout container. To target this, use a standard v3 template and add the 'slideout' directive.

Additionally, any elements inside your templates that use the 'slideout' directive will gain the click action to 'toggle' the slideout open/close.
Simply target the container inside the slideout template (in this case "#searchspring-slideout_facets") with your facets template.

```html
<h1>Hello</h1>
there
<br>
```

```js
function test() {
  console.log("yuno render html?");
}
```

The button template code can be moved wherever it best fits.
