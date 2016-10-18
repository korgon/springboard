# Facet Slider Module

Add ability to use a slider for facets.

This module has no options.

```js
this.importer.include('facet-slider');
```

Use the directive 'ss-facet-slider' as shown below.

```html
<!-- Facet Slider Example -->
<div ng-repeat="facet in facets" ng-switch="facet.type">
  <div ng-switch-when="slider" class="facet-range-slider"></div>
</div>
```
