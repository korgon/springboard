# Facet Slider Module

Add ability to use a slider for facets.

This module has no options.

```js
this.importer.include('facet-slider');
```

Use the directive 'ss-facet-slider' as shown below.

```html
<!-- Facet Slider Example -->
<div ng-repeat="facet in facets">
  <ul class="facet-options-list" ng-if="facet.type == 'slider'">
    <div ss-facet-slider="facet"></div>
  </ul>
</div>
```
