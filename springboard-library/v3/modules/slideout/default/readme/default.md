# Slideout Module

The module <i>will</i> create a slidout container. To target this, use a standard v3 template and add the 'slideout' directive.

|Option|Description|
|------|-----------|
|*width*|width the slideout should be enabled|

```js
this.importer.include('slideout', { width: 767 });
```

Additionally, any elements inside your templates that use the 'slideout' directive will gain the click action to 'toggle' the slideout open/close.
Target the element inside the slideout template (in this case ".searchspring-facets") with your facets template.

```html
<!-- Slideout Menu -->
<script type="text/ss-template" slideout>
	<div ng-if="facets.length > 0" id="searchspring-slideout_header">
		<h4>Filter Options</h4><a class="searchspring-slideout_button" href="" slideout></a>
	</div>
	<div ng-if="facets.length > 0" id="searchspring-slideout_facets" ng-swipe-left="slideout.toggleSlideout()">
		<div class="searchspring-facets"></div>
	</div>
</script>
```

```html
<!-- Slideout Button -->
<script type="text/ss-template" target=".searchspring-slideout_button.searchspring-slideout_filter">
	<span class="searchspring-slideout_button_icon">
		<span class="button-line"></span><span class="button-line"></span><span class="button-line"></span>
	</span>
	<span class="searchspring-slideout_button_text">Filter Options</span>
</script>
```
