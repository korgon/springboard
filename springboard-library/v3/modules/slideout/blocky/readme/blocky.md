# Slideout Module

The module <i>will</i> create a slidout container. To target this, use a standard v3 template and add the 'slideout' directive.

```js
this.importer.include('slideout', { width: 1024 });
```

|Option|Description|
|------|-----------|
|*width*|width the slideout should be enabled|

Additionally, any elements inside your templates that use the 'slideout' directive will gain the click action to 'toggle' the slideout open/close.
Simply target the container inside the slideout template (in this case "#searchspring-slideout_facets") with your facets template.

```html
<!-- Slideout Template -->
<script type="text/ss-template" slideout>
  <a href="" slideout><div class="searchspring-slideout_button"></div></a>
  <div id="searchspring-slideout_facets" ng-swipe-left="slideout.toggleSlideout()"></div>
</script>
```

```html
<div class="searchspring-slideout_button" slideout ng-if="pagination.totalResults && facets.length > 0">
  <span class="searchspring-slideout_button_icon"></span>
  <span class="searchspring-slideout_button_text">Filter Options</span>
</div>
```

The button template code can be moved wherever it best fits.
