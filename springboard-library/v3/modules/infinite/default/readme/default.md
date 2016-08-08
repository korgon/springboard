# Infinite Module

Add infinite scroll to the site.

This module has no options.

```js
this.importer.include('infinite');
```

Use the directive on the results container (or any other) and when the bottom of it comes into view more results will load. Alternatively, use a button click to load more.

```html
<!-- Infinite Directive Example -->
<div class="results_container" infinite>
  <ul class="items">
    <li ng-repeat="result in results" class="item"><!-- results --></li>
  </ul>
</div>
<div class="ss-loading" ng-if="infinite.loading">&nbsp;</div>
```

```html
<!-- Infinite Button Example -->
<div class="load-more" ng-if="!infinite.done && !infinite.loading">
  <a ng-click="infinite.loadMore()">Load More</a>
</div>
<div class="ss-loading" ng-if="infinite.loading">&nbsp;</div>
```
