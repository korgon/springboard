(function(window){

	window.SearchSpring.Catalog = window.SearchSpring.Catalog || {};
	if ( window.SearchSpring.Catalog.version ) {
		return;
	}

	(function($){

		$.extend(SearchSpring.Catalog, {

			version: "1.15.00",

			intellisuggestData: [],

			intellisuggest: function intellisuggest(element, data, signature) {
				if(document.images){

					if ('https:' == location.protocol) {
						var api_url = 'https://api.searchspring.net/api/';
					} else {
						var api_url = 'http://api.searchspring.net/api/';
					}

					var imgTag = new Image;
					var escapeFn = encodeURIComponent || escape;
					this.intellisuggestData.push(imgTag);
					imgTag.src= api_url+'track/track.json?d='+data
                        +'&s='+signature+'&u='+escapeFn(element.href)+'&r='+escapeFn(document.referrer);
				}
				return true;
			},

			trackEvent : function(type) {
				if(typeof ga != 'undefined' && typeof ga == 'function') {
					ga('send', 'event', 'SearchSpring', 'AJAX Catalog', type, {'nonInteraction': 1});
				} else {
					try {
						_gaq.push(['_trackEvent', 'SearchSpring', 'AJAX Catalog', type,,true]);
					} catch(ga_err) {}
				}
			},

			init: function(init_options) {

				var init_defaults = {
					leaveInitialResults : false,
					facets : '.searchspring-facets_container',
					results : '.searchspring-results_container',
					result_layout: 'grid',
					results_per_page : 30,
					layout: 'left',
					filters: {},
					backgroundFilters: {},
					queryParam : 'q',
					maxFacets: 100,
					maxFacetsHardLimit: true,
					excludedFacets : [],
					maxFacetOptions: 100,
					maxFacetFieldOptions: {},
					disableGA: false,
					filterText: 'Filter Your Results',
                    afterFacetsChange: null,
                    afterResultsChange: null,
					filterData: null,
					loadCSS: true,
					facebook: false,
					previousText: 'prev',
					nextText: 'Next',
					forwardSingle: true,
					filterPrefix: '',
					resultsPerPageText: 'Items per page',
					resultsPerPageType: 'link',
					resultsPerPageOptions : undefined,
					sortType: 'link',
					sortText: 'Sorting: ',
					scrollType: 'jump',
					scrollTo: '#searchspring-main',
					backgroundSortField: '',
					backgroundSortDir: 'asc',
					summaryText: 'Your Refinements',
					showSummary: false,
					subSearchText: 'Search Within Results',
					showSubSearch: false,
					showReset: false,
					historyText: 'Recent Searches',
					showSearchHistory: false,
					resetText : 'Reset',
					compareText: 'Compare',
					breadcrumbSeparator: ' &#0187; ',
					collapseAll: false,
					facetOptionCallback: false,
					facetTitleCallback: false,
					compareCallback: false,
					expandedText : 'Show Less Options',
					collapsedText : 'Show More Options',
					modifyRequest: false,
					intellisuggest: true,
					template : 'default',
					waitForReady : true,
					css : undefined,
					siteId: undefined,
					siteKey: undefined,
					stickySlider: false,
					stickySliderSlideCallback: false,
					stickySliderStopCallback: false,
					stickySliderNoResultsCallback: false,
					apiHost: 'api.searchspring.net',
					protectCartResults: false
				};


				if(typeof SearchSpringConf == 'object') {
					// Load Legacy SearchSpringConf
					init_defaults.siteId = SearchSpringConf.id;
					init_defaults.siteKey = SearchSpringConf.key;
					init_defaults.css = SearchSpringConf.css;
					init_defaults.result_layout = SearchSpringConf.result_layout;
					init_defaults.results_per_page = SearchSpringConf.results_per_page;
				}


				$.extend(init_defaults, init_options);

				init_options = init_defaults;

				if(!init_options.disableGA) {
					SearchSpring.Catalog.trackEvent('Display');
				}

				if (init_options.facebook) {
					init_options.result_layout = 'grid';
				}

				var layout = init_options.layout;
				var result_layout = init_options.result_layout;
				var results_per_page = init_options.results_per_page;

				if(!init_options.resultsPerPageOptions) {
					init_options.resultsPerPageOptions = [Math.ceil(results_per_page / 2), results_per_page, results_per_page * 2];
				}

				var params = {};

				// Build Params to grab query, in the future we might use this to also override init_options or request
				// variables in the URL
				window.location.search.replace(
					new RegExp("([^?=&]+)(=([^&]*))?", "g"),
					function(re_full, re_name, re_equals, re_value) {
						if (re_value) {
							params[re_name] = decodeURIComponent(re_value.replace(/\+/g, ' '));
						}
					}
				);


				if ('https:' == location.protocol) {
					var api_url = 'https://' + init_options.apiHost + '/api/';
				} else {
					var api_url = 'http://' + init_options.apiHost + '/api/';
				}


				$.address.autoUpdate(false);
				$.ajaxSettings.traditional = true;

				if (init_options.leaveInitialResults && $.address.parameterNames().length > 0) {
					init_options.leaveInitialResults = false;
				}

				var collapsed = {};

				var show_more_on = {};

				var query = '';

				var search_spring;

				var request;

				var initialized_ui = false;
				var finished_ui = false;

				var compare = [];

				if ($.address.parameter('resultLayout')) {
					result_layout = $.address.parameter('resultLayout');
				}

				var default_results_per_page = results_per_page;

				if ($.address.parameter('resultsPerPage')) {
					results_per_page = $.address.parameter('resultsPerPage');
				}

				var userId;

				var firstLoad = true;

				var bottomPaginationHidden = false;

				var poweredByHidden = false;

				var requestTimeout;

				var requestTimeoutCount = 0;
				var requestId = 0;

				var src_dir = '//cdn.searchspring.net/ajax_search/';

				var sliderRanges = {};
				var sliderLastRanges = {};
				var lastSliderFacet = null;
				var addressNoOp = false;

				var SearchSpringAjaxUI;
				SearchSpringAjaxUI = function () {

					if(init_options.waitForReady) {
						$(init);
					} else {
						init();
					}

					function init() {
						if (init_options.loadCSS) {
							loadCSS('css/jquery-ui.custom.css', src_dir);

							if (init_options.facebook) {
								loadCSS('css/facebook.css', src_dir);
							} else {
								loadCSS('css/'+init_options.template+'.css', src_dir);
							}

							// Only load the css if specified
							if (typeof init_options.css !== "undefined") {
								if(window.location.href.match(/sspreview=1/)) {
									loadCSS('sites/' + init_options.siteId + '/css/preview.css', src_dir);
								} else {
									loadCSS('sites/' + init_options.siteId + '/css/' + init_options.css + '.css', src_dir);
								}
							}
						}


						query = params[init_options.queryParam] ? params[init_options.queryParam] : '';

						buildFacetUI();

						// if some dummy sets both to true, wat do?
						if(init_options.leaveInitialResults && init_options.protectCartResults) {
							init_options.protectCartResults = false;
						}

						if (!(init_options.leaveInitialResults || init_options.protectCartResults)) {
							buildUI();
							buildResultsPerPage();
						}

						handleSortClick();


						$.address.change(function(event) {
							fetchData();
						});

						// If DOM is already loaded we need to trigger the fetch because the address.change event won't trigger.
						if(document.readyState == 'complete' && (!$.browser.msie || (parseInt($.browser.version, 10) > 8))) {
							fetchData();
						}

						function loadCSS(file, path) {

							var head = document.getElementsByTagName('head')[0];
							var script = document.createElement('link');
							script.rel = 'stylesheet';
							script.type = 'text/css';
							script.href = path + file;

							head.appendChild(script);
						}

						function buildFacetUI() {

							// If there's already a searchspring UI built just use it instead
							if($('#searchspring-sidebar').length > 0) {
								return;
							}

							var facet_UI = '<div style="display:none" id="searchspring-sidebar" class="sidebar searchspring-widget_container ' + init_options.layout + '">  \
										<h3 class="filter">' + init_options.filterText + '</h3>  \
										';

							if(init_options.showSearchHistory) {
								facet_UI = facet_UI + '<h3 id="searchspring-history_header">' + init_options.historyText + '</h3><ul id="searchspring-history"></ul>';
							}

							if(init_options.showSummary) {
								facet_UI = facet_UI + '<h3 id="searchspring-summary_header">' + init_options.summaryText + '</h3><ul id="searchspring-summary"></ul>';
							}

							if(init_options.showReset) {
								facet_UI = facet_UI + '<div id="searchspring-reset">' + init_options.resetText + '</div>';
							}

							if(init_options.showSubSearch) {
								facet_UI = facet_UI + '<form id="searchspring-refine_search"><h3 id="searchspring-refine_header">' + init_options.subSearchText + '</h3><input type="text" name="rq" id="searchspring-refine_query" /><input type="submit" value="Search" id="searchspring-refine_submit"></form>'
							}

							facet_UI = facet_UI + '<ul id="searchspring-facets">  \
										</ul>  \
										<div class="merchandising" id="searchspring-merch_left"></div> \
										<div class="dummy"></div> \
									</div>	<!-- /navigation -->';

							$(init_options.facets).html(facet_UI);
						}

						// Build containers for the search results and search facts
						function buildUI() {
							initialized_ui = true;

							if($('#searchspring').length > 0) {
								search_spring = $('#searchspring');
								$('.searchspring-' + result_layout + '_result_layout').addClass('highlight');
								return;
							}

							var UI = ' \
					<div id="searchspring" class="searchspring-widget_container ' + init_options.layout + '">	\
						<div class="container">  \
					  		<div id="searchspring-loading"></div> \
							<div id="searchspring-main" style="display:none">  \
					  \
								<div id="searchspring-options"> \
									<h1>Showing <span id="searchspring-first_item" class="searchspring-first_item">1</span> - <span id="searchspring-last_item" class="searchspring-last_item">30</span> of <span id="searchspring-total_items" class="searchspring-total_items">0</span> ' + (query.length == 0 ? 'items' : 'Search Results for &ldquo;<span id="searchspring-query" class="searchspring-query_display"></span>&rdquo;') + '</h1> \
									<p class="view-type"><a id="searchspring-grid_result_layout" title="Grid View" class="searchspring-grid_result_layout result_layout"></a> <a id="searchspring-list_result_layout" title="List View" class="searchspring-list_result_layout result_layout"></a></p>  \
									<p class="per-page"></p>  \
								</div>	<!-- sort-->  \
					  \
								<table class="pagination top"> \
									<tbody> \
										<tr> \
											<td class="searchspring-previous">' + init_options.previousText + '</td> \
											<td class="searchspring-pageOf"> of </td> \
											<td class="searchspring-total_pages">1</td> \
											<td class="searchspring-next">' + init_options.nextText + '</td> \
										</tr> \
									</tbody> \
								</table> \
								  \
								<div class="breadcrumbs"></div>  \
								<p class="sort-by">' + init_options.sortText + '<span id="searchspring-sorting" class="searchspring-sorting"></span></p> \
								<div class="merchandising" id="searchspring-merch_header"></div><div class="merchandising" id="searchspring-merch_banner"></div> \
								<div id="searchspring-compare_box" class="searchspring-compare_box" style="display: none"><div><span id="searchspring-compare_text">' + init_options.compareText + '</span> <span id="searchspring-compare_button"></span><div class="clear"></div></div> \
									<div class="searchspring-compare_image_container" id="searchspring-compare_image_container1"></div> \
									<div class="searchspring-compare_image_container" id="searchspring-compare_image_container2"></div> \
									<div class="searchspring-compare_image_container" id="searchspring-compare_image_container3"></div> \
									<div class="searchspring-compare_image_container" id="searchspring-compare_image_container4"></div> \
								</div> <div style="clear:right"></div> \
								<div id="searchspring-did_you_mean" /> \
								<div id="searchspring-search_results" class="' + result_layout + '"></div> \
								<div class="clear"></div> \
								<div id="searchspring-bottom_container"> \
									<div id="searchspring-show_more" style="display:none">Show More Results</div> \
									<table class="pagination bottom"> \
										<tbody> \
											<tr> \
												<td class="searchspring-previous">' + init_options.previousText + '</td> \
												<td class="searchspring-pageOf"> of </td> \
												<td class="searchspring-total_pages">1</td> \
												<td class="searchspring-next">' + init_options.nextText + '</td> \
											</tr> \
										</tbody> \
									</table> \
									<a title="Powered by SearchSpring"><img id="searchspring-powered_by" src="' + src_dir + 'img/powered.png" alt="SearchSpring" width="138" height="25" /></a> \
								</div>  \
								<div class="clear"></div>  \
								<div class="merchandising" id="searchspring-merch_footer"></div> \
							</div>	<!-- /main -->  \
						</div>	<!-- /container --> \
						<div id="searchspring-compare_results"></div> \
					</div>';

							$(init_options.results).html(UI);

							search_spring = $('#searchspring');
							$('.searchspring-' + result_layout + '_result_layout').addClass('highlight');

						}


						function handleSortClick() {
							$('#searchspring-sort_click').click(function() {
								$('.searchspring-sorting, #searchspring-sorting').toggle();
							});
						}

						// Fetch the data form the web service
						function fetchData() {
							// if this change to the address was just a reset to a known good state, we don't want to make another request.
							if(addressNoOp) {
								addressNoOp = false;
								return;
							}
							if (!firstLoad) {
								var curr_offset = $(document).scrollTop();

								if ($(init_options.scrollTo) && $(init_options.scrollTo).length > 0) {
									var new_offset = $(init_options.scrollTo).offset().top;
								} else if ($(init_options.results)) {
									var new_offset = $(init_options.results).offset().top;
								} else {
									var new_offset = 0;
								}

								if (curr_offset > new_offset) {

									if (init_options.scrollType == 'scroll') {
										$('html, body').animate({scrollTop: new_offset}, 'slow');
									} else if (init_options.scrollType == 'jump') {
										$('html, body').scrollTop(new_offset);
									}
								}
							} else {
								if(init_options.showSubSearch) {
									$('#searchspring-refine_search').submit(handleSubSearch);
								}

								if(init_options.showReset) {
									$('#searchspring-reset').click(resetSearch);
								}
							}

							// We only want to load the filters on the initial page in order to avoid issues with back buttons direct URLs.
							if(!$.address.parameter('_')) {
								$.address.parameter('_', 1);

								var escapeFn = encodeURIComponent || escape;
								// Add filters to the URL on first load
								var filters = $.extend(true, {}, init_options.filters);
								for (var filter in filters) {

									if(!$.isArray(filters[filter])) {
										$.address.parameter('filter.' + filter, escapeFn(filters[filter]), true);
									} else {
										for(var i = 0; i < filters[filter].length; i++) {
											$.address.parameter('filter.' + filter, escapeFn(filters[filter][i]), true);
										}
									}
								}
							}

							firstLoad = false;
							if (!(init_options.leaveInitialResults || init_options.protectCartResults)) {
								if (!search_spring) {
									buildUI();
									buildResultsPerPage();
								}
								//search_spring.show();
							}

							request = {
								method : 'search',
								q : query,
								format: 'json',
								resultLayout: result_layout,
								resultsPerPage: results_per_page,
								domain: window.location.href,
								referer: document.referrer,
								userId: getUserId(),
								facebook: init_options.facebook ? 1 : 0
							};

							if(init_options.excludedFacets.length > 0) {
								request.excludedFacets = init_options.excludedFacets;
							}


							// If we have a key use it, otherwise use id
							if(init_options.siteKey) {
								request.websiteKey = init_options.siteKey;
							} else {
								request.siteId = init_options.siteId;
							}

							var sorted = false;

							var parameters = $.address.parameterNames();

							for (var index = 0; index < parameters.length; index++) {

								if (!sorted && parameters[index].indexOf('sort.') == 0) {
									sorted = true;
								}

								var value = $.address.parameter(parameters[index]);


								// Defaults in the request object need to be handled differently
								if (parameters[index] == 'q' || parameters[index] == 'resultLayout' || parameters[index] == 'resultsPerPage') {
									request[parameters[index]] = decodeURIComponent(value);
									continue;
								}

								if (request[parameters[index]]) {
									if (!$.isArray(request[parameters[index]])) {
										request[parameters[index]] = [request[parameters[index]]];
									}

									if ($.isArray(value)) {
										for (i = 0; i < value.length; i++) {
											request[parameters[index]][request[parameters[index]].length] = decodeURIComponent(value[i]);
										}
									} else {
										request[parameters[index]][request[parameters[index]].length] = decodeURIComponent(value);
									}
								} else {
									if ($.isArray(value)) {

										for (i = 0; i < value.length; i++) {
											value[i] = decodeURIComponent(value[i]);
										}
									} else {
										value = decodeURIComponent(value)
									}
									request[parameters[index]] = value;
								}
							}

							var bg_filters = $.extend(true, {}, init_options.backgroundFilters);

							for (filter in bg_filters) {
								if(!request['bgfilter.' + filter]) {
									request['bgfilter.' + filter] = bg_filters[filter];
								}
							}

							for (var param in request) {
								if($.isArray(request[param])) {
									for(var param_index in request[param]) {
										if(request[param][param_index] == 'null') {
											request[param].splice(param_index, 1);
										}
									}
								} else {
									if(request[param] == 'null') {
										delete request[param];
									}
								}
							}

							request['intellisuggest'] = init_options.intellisuggest?1:0;

							if (!sorted && init_options.backgroundSortField.length > 0) {
								request['sort.' + init_options.backgroundSortField] = init_options.backgroundSortDir;
							}

							$('#searchspring-search_results').hide();
							$('#searchspring-bottom_container').hide();
							$('#searchspring-loading').show();

							$('#searchspring-did_you_mean').hide();

							if (null !== init_options.modifyRequest && typeof init_options.modifyRequest == 'function') {
								request = init_options.modifyRequest(request);
							}

							request['requestId'] = Math.random()*100000000000000000;
							request['requestCount'] = requestTimeoutCount;

							SearchSpring.Catalog.request = request;

							// Clear the requestTimeout before (re)setting it as we can now ignore the previous one
							clearTimeout(requestTimeout);
							requestTimeout = setTimeout(requestTimeoutError, 10000);


							if(!request.websiteKey && !request.siteId) {
								window.console && console.log && console.log( "error 5 - website not specified" );
								return;
							}

							$.ajax({
								url: api_url + 'search/search.json',
								dataType: 'jsonp',
								success : displayResults,
								error : function () {
									window.console && console.log && console.log( "error 1" );
								},
								data : request
							});
						}

						function requestTimeoutError() {

							requestTimeoutCount++;

							if(document.images) {
								var imgUrl = '//d3cgm8py10hi0z.cloudfront.net/ss.gif';
								var imgTag = new Image;
								var escapeFn = encodeURIComponent || escape;
								imgTag.src = imgUrl+'?u='+escapeFn(getUserId())+'&i='+escapeFn(request['requestId'])+'&t=AJAXCatalogTimeout&c='+escapeFn(requestTimeoutCount);
							}

							if(requestTimeoutCount < 2) {
								request['requestId'] = Math.random()*100000000000000000;
								request['requestCount'] = requestTimeoutCount;

								// Clear the requestTimeout before (re)setting it as we can now ignore the previous one
								clearTimeout(requestTimeout);
								requestTimeout = setTimeout(requestTimeoutError, 30000);

								$.ajax({
									url: api_url + 'search/search.json',
									dataType: 'jsonp',
									success : displayResults,
									error : function () {
										window.console && console.log && console.log( "error 2" );
									},
									data : request
								});
							} else {
								window.console && console.log && console.log( "error 4" );
							}
						}

						function displayResults(data, status, req) {
							clearTimeout(requestTimeout);

							if(requestTimeoutCount >= 2) {
								return;
							}

							requestTimeoutCount = 0;

							finished_ui = false;

							var filtered = false;
							for (var index in SearchSpring.Catalog.request) {
								if (index.match(/^filter/)) {
									filtered = true;
								}
							}

							var redirecting = false;

							if (!init_options.facebook && data['merchandising'] && data['merchandising'].redirect) {
								redirecting = true;
								window.location.replace(data['merchandising'].redirect);
							}

							if (init_options.forwardSingle && !filtered && !$.address.parameter('rq') && !init_options.facebook && data['singleResult'] && query) {
								redirecting = true;
								window.location.replace(data['singleResult']);
							}

							if (!redirecting) {
								if (null !== init_options.filterData && typeof init_options.filterData == 'function') {
									init_options.filterData(data);
								}

								if (data.pagination.totalResults > 0) {
									if (init_options.protectCartResults && !search_spring) {
										buildUI();
										buildResultsPerPage();
									}
									$('#searchspring-sidebar, #searchspring-main').removeClass('searchspring-no_results');
								} else {
									// if the last selection was a sticky slider
									if(init_options.stickySlider && lastSliderFacet) {
										// reset the slider
										lastSliderFacet.slider('option', 'values', [sliderLastRanges[lastSliderFacet.data('facet')][0], sliderLastRanges[lastSliderFacet.data('facet')][1]]);
										lastSliderFacet.prev().prev().text(sprintf(lastSliderFacet.data('format'),
											sliderLastRanges[lastSliderFacet.data('facet')][0], sliderLastRanges[lastSliderFacet.data('facet')][1]));
										// reshow the last good results set
										$('#searchspring-search_results').show();
										$('#searchspring-bottom_container').show();
										$('#searchspring-loading').hide();

										addressNoOp = true;
										history.back(1);

										// user callback for no results caused by a slider
										if (null !== init_options.stickySliderNoResultsCallback && typeof init_options.stickySliderNoResultsCallback == 'function') {
											init_options.stickySliderNoResultsCallback(lastSliderFacet);
										}
										// unset the last facet selection state
										lastSliderFacet = null;

										// don't bother trying to render any more
										return;
									}
									$('#searchspring-sidebar, #searchspring-main').addClass('searchspring-no_results');
								}
								$('#searchspring-sidebar, #searchspring-main').show();

								// clear the last sticky
								lastSliderFacet = null;


								if(init_options.showSearchHistory) {
									updateHistory();
								}

								if (data['facets'].length) {
									updateFacets(data['facets'], data['pagination'].totalResults);
								}


								if (init_options.showSummary) {
									updateSummary(data['filterSummary']);
								}

								if(init_options.showReset) {
									if (data['filterSummary'].length == 0) {
										$('#searchspring-reset').hide();
									} else {
										$('#searchspring-reset').show();
									}
								}

								if (null !== init_options.afterFacetsChange && typeof init_options.afterFacetsChange == 'function') {
									init_options.afterFacetsChange(data);
								}

								if (init_options.leaveInitialResults) {
									init_options.leaveInitialResults = false;
									return;
								}

								updateSearchResults(data['results']);
								updateDidYouMean(data['didYouMean']);

								if (!init_options.facebook) {
									updateMerchandising(data['merchandising']);
								}

								updatePagination(data['pagination']);
								updateSorting(data['sorting']);
								updateResultLayout(data['resultLayout']);
								verifyResultLayout(data['resultLayout']);
								updateBreadCrumbs(data['breadcrumbs']);

								updateCompare();
								finished_ui = true;

								if (null !== init_options.afterResultsChange && typeof init_options.afterResultsChange == 'function') {
									init_options.afterResultsChange(data);
								}
							}
						}

						function updateCompare() {
							search_spring.find('.searchspring-compare').click(compareToggle);

							for (var i = 0; i < compare.length; i++) {
								$('#' + compare[i].id).attr('checked', true);
							}

							$('#searchspring-compare_button, #searchspring-compare_text').unbind('click').click(doCompare);

							$('#searchspring-compare_same').click(highlightSame);
							$('#searchspring-compare_diff').click(highlightDiff);
						}

						function highlightSame() {
							$('.searchspring-compare_same_hl').addClass('searchspring-compare_highlight');
							$('.searchspring-compare_diff_hl').removeClass('searchspring-compare_highlight');
						}

						function highlightDiff() {
							$('.searchspring-compare_diff_hl').addClass('searchspring-compare_highlight');
							$('.searchspring-compare_same_hl').removeClass('searchspring-compare_highlight');
						}

						function doCompare(ev) {
							if (compare.length < 2) {
								alert("Select 2 to 4 items to compare");
								return;
							}

							request = {
								method : 'compare',
								q : query,
								format: 'json',
								id: []
							};


							// If we have a key use it, otherwise use id
							if(init_options.siteKey) {
								request.websiteKey = init_options.siteKey;
							} else {
								request.siteId = init_options.siteId;
							}

							for (var i = 0; i < compare.length; i++) {
								request.id.push(compare[i].id);
							}

							$.ajax({
								url: api_url + 'compare/compare.json',
								dataType: 'jsonp',
								success : displayCompare,
								error : function () {
									window.console && console.log && console.log( "error 3" );
								},
								data : request
							});
						}

						function displayCompare(data) {
							$('#searchspring-compare_results').html(data.html).dialog({
								height: $(window).height() - 50,
								width: (data.result_count * 180) + 200,
								title: '',
								modal: true,
								autoOpen: true,
								dialogClass: 'searchspring-dialog'
							});

							var i = 1;

							$('#searchspring-compare_table tr').each(function() {
								if (i % 2 == 0) {
									$(this).addClass('even');
								}
								i++;
							});

							if(!init_options.disableGA) {
								SearchSpring.Catalog.trackEvent('Compare');
							}

							if (null !== init_options.compareCallback && typeof init_options.compareCallback == 'function') {
								init_options.compareCallback();
							}
						}

						function compareToggle() {
							$('#searchspring-compare_box, .searchspring-compare_box').show();
							if ($(this).attr('checked')) {
								if (compare.length < 4) {
									img_src = $(this).val();

									compare.push({id: $(this).attr('id'), image: img_src});
									var item_img = $('<img />').attr('src', img_src).addClass('searchspring-compare_image');

									var item_del = $('<div />').data('id', $(this).attr('id')).attr('id', 'del_' + $(this).attr('id')).addClass('searchspring-compare_del').click(removeFromCompare);

									$('#searchspring-compare_image_container' + compare.length).append(item_del).append(item_img).hover(function() {
										$($(this).children()[0]).show();
									}, function() {
										$($(this).children()[0]).hide();
									});

								} else {
									$(this).attr('checked', false);
									alert('You can only compare up to 4 items');
								}
							} else {
								$('#del_' + $(this).attr('id')).click();
							}

						}

						function removeFromCompare() {
							var idx;

							for (var i = 0; i < compare.length; i++) {
								if (compare[i].id == $(this).data('id')) {
									$('#' + $(this).data('id')).attr('checked', false);
									idx = i;
								}
								$('#searchspring-compare_image_container' + (i + 1)).empty();
							}

							var rest = compare.slice(idx + 1);
							compare.length = idx;
							compare.push.apply(compare, rest);

							for (i = 0; i < compare.length; i++) {
								var item_img = $('<img />').attr('src', compare[i].image).addClass('searchspring-compare_image').mouseover(function() {
									$(this).prev().show()
								});
								var item_del = $('<div />').data('id', compare[i].id).attr('id', 'del_' + compare[i].id).addClass('searchspring-compare_del').mouseout(
									function() {
										$(this).hide()
									}).click(removeFromCompare);
								$('#searchspring-compare_image_container' + (i + 1)).append(item_del).append(item_img);
							}
						}

						function updateDidYouMean(didYouMean) {
							if (didYouMean) {
								didYouMean['query'] = didYouMean['query'].replace(/(^[^\w]+)|([^\w]+$)/g, '');
								if(didYouMean['query'] != request.q) {
									var dym_link = $('<a />').text(didYouMean['query']).click(function() {
										$.address.parameter('q', didYouMean['query']);
										$.address.parameter('page', 1);
										$.address.update();
									});

									$('#searchspring-did_you_mean').html('Did you mean ').append(dym_link).append(' ?');
									$('#searchspring-did_you_mean').show();
									return;
								}
							}
							$('#searchspring-did_you_mean').hide();
						}

						function updateBreadCrumbs(breadcrumbs) {
							var links = $('div.breadcrumbs', '#searchspring').empty();

							for (var i = 0; i < breadcrumbs.length; i++) {
								if (i == (breadcrumbs.length - 1)) {
									// Don't link the last breadcrumb
									var label = $('<span />').addClass('searchspring-breadcrumb_label').text(breadcrumbs[i]['filterLabel']+': ');
									var value = $('<span />').addClass('searchspring-breadcrumb_value').text('"'+breadcrumbs[i]['filterValue']+'"')
									links.append(label).append(value);
								}
								else {
									var label = $('<span />').addClass('searchspring-breadcrumb_label').text(breadcrumbs[i]['filterLabel']+': ');
									var value = $('<span />').addClass('searchspring-breadcrumb_value').text('"'+breadcrumbs[i]['filterValue']+'"');
									var breadcrumb = $('<a />')
									breadcrumb.append(label).append(value).data('removeFilters', breadcrumbs[i]['removeFilters']).data('removeRefineQuery', breadcrumbs[i]['removeRefineQuery']).click(removeBreadCrumb);
									links.append(breadcrumb);
								}

								if (i < breadcrumbs.length - 1) {
									links.append(init_options.breadcrumbSeparator);
								}
							}
						}



						function buildResultsPerPage() {

							//init_options.resultsPerPageOptions
							if(init_options.resultsPerPageType == 'link') {
								$('#searchspring .per-page').append(init_options.resultsPerPageText + " ");

								for(var i = 0; i < init_options.resultsPerPageOptions.length; i++) {
									var rpp = init_options.resultsPerPageOptions[i];
									var link = $("<a></a>").attr('id', 'searchspring_rpp_' + rpp).text(rpp).click(function() {
										$.address.parameter('resultsPerPage', $(this).text());
										$.address.parameter('page', 1);
										search_spring.find('.per-page').find('.highlight').removeClass('highlight');
										$(this).addClass('highlight');
										$.address.update();
									});

									if(results_per_page == rpp) {
										$('#searchspring_rpp_' + results_per_page).addClass('highlight');
									}

									$('#searchspring .per-page').append(link);

									// Don't append | for last option
									if(i != init_options.resultsPerPageOptions.length - 1) {
										$('#searchspring .per-page').append(' | ')
									}
								}
							} else {

								var select = $('<select />').bind('change', function() {
									$.address.parameter('resultsPerPage',  $(this).find(':selected').data('perPage'));
									$.address.parameter('page', 1);
									$.address.update();
								});

								for(var i = 0; i < init_options.resultsPerPageOptions.length; i++) {
									var rpp = init_options.resultsPerPageOptions[i];
									var option = $('<option />').data('perPage', rpp).text('View ' + rpp + ' Items Per Page');
									if(results_per_page == rpp) {
										option.attr('selected', 'selected');
									}
									select.append(option);
								}

								$('#searchspring .per-page').append(select);
							}

						}

						function updateResultLayout(resultLayout) {

							if (resultLayout == 'grid') {
								$('.searchspring-list_result_layout').unbind('click').click(function() {
									$.address.parameter('resultLayout', 'list');
									$('#searchspring-search_results').removeClass('grid').addClass('list');
									$('.searchspring-list_result_layout').addClass('highlight');
									$('.searchspring-grid_result_layout').removeClass('highlight');
									$.address.update();
								});
							}
							else {
								$('.searchspring-grid_result_layout').unbind('click').click(function() {
									$.address.parameter('resultLayout', 'grid');
									$('#searchspring-search_results').removeClass('list').addClass('grid');
									$('.searchspring-grid_result_layout').addClass('highlight');
									$('.searchspring-list_result_layout').removeClass('highlight');
									$.address.update();
								});
							}
						}

						function verifyResultLayout(resultLayout) {
							//just makes sure the class is correct (fixes issue with back button)
							if(!$('#searchspring-search_results').hasClass(resultLayout)) {
								if (resultLayout == 'list') {
									$('#searchspring-search_results').removeClass('grid').addClass('list');
									$('.searchspring-list_result_layout').addClass('highlight');
									$('.searchspring-grid_result_layout').removeClass('highlight');
								}
								else {
									$('#searchspring-search_results').removeClass('list').addClass('grid');
									$('.searchspring-grid_result_layout').addClass('highlight');
									$('.searchspring-list_result_layout').removeClass('highlight');
								}
							}
						}

						function updateSearchResults(results) {
							//$('#searchspring-search_results').html(results).fadeIn(1500);
							document.getElementById('searchspring-search_results').innerHTML = results;



							$('#searchspring-loading').hide();
							$('#searchspring-search_results').show();
							$('#searchspring-bottom_container').show();

						}

						function appendSearchResults(results) {
							$('#searchspring-search_results').append(results);
							$('#searchspring-loading').hide();
						}

						function updateMerchandising(merchandising) {
							$('#searchspring-merch_left').html('');
							$('#searchspring-merch_header').html('');
							$('#searchspring-merch_banner').html('');
							$('#searchspring-merch_footer').html('');

							if (merchandising && merchandising['content']) {
								for (var area in merchandising['content']) {
									for (var i = 0; i < merchandising['content'][area].length; i++) {
										$('#searchspring-merch_' + area).append(merchandising['content'][area][i]);
									}
								}
							}
						}

						function updateHistory() {
							var history_query = SearchSpring.Catalog.request.q;

							// Fetch query history
							var history = readCookie('search_history');

							if(history) {
								history = history.split('|');
								$('#searchspring-history_header, #searchspring-history').show();
							} else {
								$('#searchspring-history_header, #searchspring-history').hide();
								history = [];
							}

							$('#searchspring-history').empty();

							// Display query history
							for(var history_index = 0; history_index < history.length; history_index++) {
								var history_item = history[history_index];
								var li = $('<li />').addClass('searchspring-history_value').text(history_item).click(historyClick);
								$('#searchspring-history').append(li);
							}

							if(history_query) {

								// Add query to query history
								var pos = $.inArray(history_query, history);

								if(pos != -1) {
									history.splice(pos, 1);
								}

								history.unshift(history_query);

								if(history.length > 5) {
									history.pop();
								}

								// Write query history cookie
								createCookie('search_history', history.join('|'));
							}

						}

						function historyClick() {
							window.location = '#/?q=' + $(this).text();
						}

						function updateSummary(summary) {
							$('#searchspring-summary').empty();

							if (summary.length == 0) {
								$('#searchspring-summary_header, #searchspring-summary').hide();
							} else {
								$('#searchspring-summary_header, #searchspring-summary').show();
							}

							for (var summary_index = 0; summary_index < summary.length; summary_index++) {
								summary_item = summary[summary_index];
								var label = $('<span />').addClass('searchspring-summary_label').text(summary_item['filterLabel']+': ');
								var value = $('<span />').addClass('searchspring-summary_value').text('"'+summary_item['filterValue']+'"');
								var li = $('<li />').append(label).append(value).data('field', summary_item['field']).data('value', summary_item['value']).click(removeSummary);
								$('#searchspring-summary').append(li);
							}
						}

						function updateFacets(facets, numResults) {
							var active_facets = [];

							var facet_count = 0;
							$('#searchspring-facets').empty();

							for (var facet_index = 0; facet_index < facets.length; facet_index++) {

								var facet = facets[facet_index];

								if (facet_count >= init_options.maxFacets && facet['facet_active'] == 0) {
									continue;
								}

								if (facet['facet_active'] == 0 || init_options.maxFacetsHardLimit) {
									facet_count++;
								}

								active_facets.push('searchspring-' + facet['field'] + '_container');

								if (facet['values']) {
									for (var i = 0; i < facet['values'].length; i++) {
										facet['values'][i]['value'] = encodeURIComponent(facet['values'][i]['value']);
									}

									$('#searchspring-facets').append(buildFacet(facet));

									if (init_options.layout != 'top' && (facet['collapse'] || init_options.collapseAll) && facet['facet_active'] == 0) {
										$('#searchspring-' + facet['field'] + '_container').find('.facet_title').click();
									}
								}
							}

							$('.facet_container').each(function() {
								if($(this).hasClass('hierarchy') && ($(this).find('ul.element_container li').length == 0)) {
									// Remove empty hierarchies
									$(this).remove();
								} else if ($.inArray(this.id, active_facets) == -1) {
									// Remove inactive facets
									$(this).remove();
								}
							});
						}

						function buildFacet(facet) {

							var facet_container = $("<li />").addClass('facet_container').addClass(facet['type']).attr('id', 'searchspring-' + facet['field'] + '_container');

							var facet_title = $("<a />").text(init_options.filterPrefix + facet['label']).addClass('facet_title open').attr('title', facet['label']).data('facet', facet['field']);
							if (init_options.layout != 'top' && facet['facet_active'] == 0) {
								facet_title.click(facetCollapse);
							}

							if (null !== init_options.facetTitleCallback && typeof init_options.facetTitleCallback == 'function') {
								init_options.facetTitleCallback(facet_container, facet_title, facet);
							}

							facet_container.append(facet_title);

							var facetElement;

							switch (facet['type']) {
								case 'slider':
									facetElement = buildSliderFacet(facet);
									break;
								case 'multi':
									facetElement = buildMultiFacet(facet);
									break;
								case 'dropdown':
									facetElement = buildDropdownFacet(facet);
									break;
								case 'list':
								case 'grid':
								case 'palette':
								case 'hierarchy':
								case 'rating':
								default:
									facetElement = buildListFacet(facet)
									break;
							}

							if (!facetElement) return;

							facet_container.append(facetElement);

							return facet_container;
						}

						function buildListFacet(facet) {

							var element_container = $('<ul />').addClass('element_container');

							var show_more = false;

							var limit = init_options.maxFacetFieldOptions[facet['field']]?init_options.maxFacetFieldOptions[facet['field']]:init_options.maxFacetOptions;


							if(facet['type'] == 'hierarchy') {
								if(facet['facet_active']) {
									var filtered = request['filter.'+facet['field']]?request['filter.'+facet['field']]:'';
									var bgFiltered = request['bgfilter.'+facet['field']]?request['bgfilter.'+facet['field']]:'';
									if(typeof facet.hierarchyDelimiter === 'undefined') {
										var delim = '/';
									} else {
										var delim = facet.hierarchyDelimiter;
									}

									if(bgFiltered.length == 0) {
										var filteredValues = filtered.split(delim);
									} else if(filtered.length > 0  && filtered != bgFiltered) {
										var filterDiff = ('!!ss'+filtered).replace('!!ss'+bgFiltered+delim, '');
										var filteredValues = filterDiff.split(delim);
									} else {
										filteredValues = [];
									}

									var label = 'View All';
									var prev_value = bgFiltered;
									for(var value_index = 0; value_index < filteredValues.length; value_index++) {
										var value = filteredValues[value_index];

										var filtered_li = $('<li />')
											.addClass('filtered_link')
											.data('facet', facet)
											.data('value', encodeURIComponent(prev_value))
											.bind('click', filteredListClick);

										filtered_li.html("&laquo; " + label);
										element_container.append(filtered_li);

										label = value;

										if(prev_value.length == 0) {
											prev_value = value;
										} else {
											prev_value += '/' + value;
										}
									}

									if(filteredValues.length > 0) {
										var filtered_li = $('<li />')
											.addClass('filtered_current');

										filtered_li.text(label);
										element_container.append(filtered_li);
									}

								}
							}


							for (var value_index = 0; value_index < facet['values'].length; value_index++) {

								var facet_li = $('<li />');

								var value = facet['values'][value_index];
								var value_option = $('<a />')
									.addClass('option_link')
									.data('facet', facet)
									.data('value', value)
									.bind('click', facetListClick);
								if(facet['type'] == 'hierarchy' && facet['facet_active']) {
									facet_li.addClass('filtered_sub');
								}

								if (value_index >= limit) {
									if (!show_more_on[facet['field']]) {
										facet_li.css('display', 'none');
									}
									facet_li.addClass('overage');
									show_more = true;
								}

								switch (facet['type']) {
									case 'grid':
										value_option.text(value['label']);
										break;
									case 'palette':
										try {
											value_option.css('background-color', value['label'].toLowerCase());
										} catch (err) {
											value_option.text(value['label']);
										}
										break;
									case 'list':
									case 'hierarchy':
										var count_span = $('<span />').addClass('searchspring-facet_count').text('(' + value['count'] + ')');
										value_option.text(value['label'] + ' ');
										value_option.append(count_span);
										break;
									case 'rating':
										var count_span = $('<span />').addClass('searchspring-facet_count').text('(' + value.count + ')');
										var stars = $('<span />').addClass('searchspring-rating_star').addClass('searchspring-rating_star_' + value.value);
										value_option.append(stars).append(count_span);
										break;
									default:
										facet['type'] = 'list';
										var count_span = $('<span />').addClass('searchspring-facet_count').text('(' + value['count'] + ')');
										value_option.text(value['label'] + ' ');
										value_option.append(count_span);
										break;
								}

								if (value['active'] == true) {
									value_option.addClass('highlight');

									if (facet['type'] == 'list') {
										var remove_link = $('<a />').attr('title', 'Remove').addClass('remove');

										//var remove_img = $('<img />').attr('src', src_dir+'img/x.png').attr('alt', 'x');
										var remove_img = $('<div />').attr('class', 'remove_facet');

										remove_link.append(remove_img).data('facet', facet).data('value', value).click(removeFacetValue);
										value_option.unbind('click').click(removeFacetValue);

										facet_li.append(remove_link);
									}
									else {
										value_option.unbind('click').click(removeFacetValue);
									}
								}


								if (null !== init_options.facetOptionCallback && typeof init_options.facetOptionCallback == 'function') {
									init_options.facetOptionCallback(value_option, facet, value);
								}


								facet_li.append(value_option);

								element_container.append(facet_li);
							}

							if (show_more) {
								var show_more_li = $('<li />').data('facet', facet).addClass('show_more').click(toggleOverages);

								if(show_more_on[facet.field]) {
									show_more_li.text(init_options.expandedText);
								} else {
									show_more_li.text(init_options.collapsedText);
								}

								element_container.append(show_more_li);
							}

							return element_container;
						}

						function filteredListClick() {
							var value = $(this).data('value');
							if(value.length == 0) {
								value = 'null';
							}
							$.address.parameter('filter.' + $(this).data('facet')['field'], value, false);
							$.address.parameter('page', 1);
							$.address.update();

						}

						function toggleOverages() {
							facet = $(this).data('facet');

							if (show_more_on[facet['field']]) {
								show_more_on[facet['field']] = 0;
								$(this).text(init_options.collapsedText);
							} else {
								show_more_on[facet['field']] = 1;
								$(this).text(init_options.expandedText);
							}

							$(this).siblings('.overage').toggle();
						}

						function buildDropdownFacet(facet) {
							var element_container = $('<select />').data('facet', facet['field']).addClass('element_container').change(facetDropdownChange);

							if(facet['values'][0]['type'] == 'value') {
								element_container.append($("<option />").val('').text('Select ' + facet['label']).data('facet', facet).data('value', {type: 'value'}));
							} else if (facet['values'][0]['type'] == 'range') {
								element_container.append($("<option />").val('').text('Select ' + facet['label']).data('facet', facet).data('value', {type: 'range'}));
							}

							for (var value_index = 0; value_index < facet['values'].length; value_index++) {
								var value = facet['values'][value_index];
								var value_option = $("<option />").val(value['label']).text(value['label']).data('facet', facet).data('value', value);
								if(value['active']) {
									value_option.attr('selected', 'selected');
								}
								element_container.append(value_option);
							}

							return element_container;
						}

						function buildMultiFacet(facet) {
							var element_container = $('<select />').data('facet', facet['field']).addClass('element_container').attr('multiple', 'multiple');

							for (var value_index = 0; value_index < facet['values'].length; value_index++) {
								var value = facet['values'][value_index];
								var value_option = $("<option />").val(value['value']).text(value['label']);
								element_container.append(value_option);
							}

							return element_container;
						}

						function buildSliderFacet(facet) {
							if (!facet['range'] || facet['range'][0] >= facet['range'][1]) return; // Invalid range

							if(init_options.stickySlider) {
								return buildStickySliderFacet(facet);
							}

							var element_container = $('<div />').addClass('element_container');

							var value = $('<span />').addClass('slider_value');
							var reset = $('<a />').addClass('slider_reset').data('facet', facet['field']).text('Reset').click(resetSlider);
							var slider = $('<div />').addClass('slider').data('facet', facet['field']);
							slider.slider({
								range: true,
								min: facet['range'][0],
								max: facet['range'][1],
								values: facet['active'],
								step: facet['step'],
								slide: function(event, ui) {
									$(this).prev().prev().text(sprintf(facet['format'], ui.values[0], ui.values[1]));
								},
								stop: facetSliderStop
							});


							value.text(sprintf(facet['format'], slider.slider('values', 0), slider.slider('values', 1)));

							element_container.append(value).append(reset).append(slider);

							return element_container;
						}

						function buildStickySliderFacet(facet) {
							if(!sliderRanges[facet.field] || !facet['facet_active']) {
								sliderRanges[facet.field] = facet.range;
							}
							if(!sliderLastRanges[facet.field] || sliderLastRanges[facet.field] != facet.active) {
								sliderLastRanges[facet.field] = facet.active;
							}

							var element_container = $('<div />').addClass('element_container');

							var value = $('<span />').addClass('slider_value');
							var reset = $('<a />').addClass('slider_reset').data('facet', facet['field']).text('Reset').click(resetSlider);
							// no need to display the reset if reset is not going to do anything
							if(!facet['facet_active']) {
								reset.hide();
							}
							var slider = $('<div />').addClass('slider').data('format', facet['format']).data('facet', facet['field']).data('facet_active', facet['facet_active']);
							slider.slider({
								range: true,
								min: sliderRanges[facet.field][0],
								max: sliderRanges[facet.field][1],
								values: facet['active'],
								step: facet['step'],
								slide: function(event, ui) {
									$(this).prev().prev().text(sprintf(facet['format'], ui.values[0], ui.values[1]));
									// user callback for sticky slide
									if (null !== init_options.stickySliderSlideCallback && typeof init_options.stickySliderSlideCallback == 'function') {
										init_options.stickySliderSlideCallback(ui, $(this));
									}
								},
								stop: facetStickySliderStop
							});


							value.text(sprintf(facet['format'], slider.slider('values', 0), slider.slider('values', 1)));

							element_container.append(value).append(reset).append(slider);

							return element_container;
						}
						function facetStickySliderStop(event, ui) {
							// user callback for sticky stop
							if (null !== init_options.stickySliderStopCallback && typeof init_options.stickySliderStopCallback == 'function') {
								ui = init_options.stickySliderStopCallback(ui, $(this)) || ui;
							}

							lastSliderFacet = $(this);
							lastSliderFacet.data('page', $.address.parameter('page'));
							$.address.parameter('filter.' + $(this).data('facet') + '.low', ui.values[0]);
							$.address.parameter('filter.' + $(this).data('facet') + '.high', ui.values[1]);

							if(!init_options.disableGA) {
								SearchSpring.Catalog.trackEvent('Facet Slider Use');
							}

							$.address.parameter('page', 1);
							$.address.update();
						}
						function resetSlider() {
							facet = $(this).data('facet');
							$.address.parameter('filter.' + facet + '.low', '');
							$.address.parameter('filter.' + facet + '.high', '');
							$.address.update();
						}

						function facetCollapse() {
							$('#searchspring-' + $(this).data('facet') + '_container').find('.element_container').hide((finished_ui ? 'blind' : ''));
							$(this).removeClass('open').unbind('click').click(facetExpand);
							collapsed[$(this).data('facet')] = 1;
						}

						function facetExpand() {
							$('#searchspring-' + $(this).data('facet') + '_container').find('.element_container').show('blind');
							$(this).addClass('open').unbind('click').click(facetCollapse);
							collapsed[$(this).data('facet')] = 0;
						}

						function facetListClick() {
							var append = $(this).data('facet')['multiple'] == 'multiple-intersect' || $(this).data('facet')['multiple'] == 'multiple-union';
							var type = $(this).data('value')['type'];
							var cur_val = $.address.parameter('filter.' + $(this).data('facet')['field']);

							if(append && cur_val) {
								if (cur_val == $(this).data('value')['value'] || $.inArray($(this).data('value')['value'], cur_val) != -1) {
									type = "invalid";
								}
							}


							if (type == 'value') {
								$.address.parameter('filter.' + $(this).data('facet')['field'], $(this).data('value')['value'], append);
							}
							else if (type == 'range') {
								$.address.parameter('filter.' + $(this).data('facet')['field'] + '.low', $(this).data('value')['low'], append);
								$.address.parameter('filter.' + $(this).data('facet')['field'] + '.high', $(this).data('value')['high'], append);
							}

							if(!init_options.disableGA) {
								SearchSpring.Catalog.trackEvent('Facet Click');
							}

							$.address.parameter('page', 1);
							$.address.update();

						}

						function facetDropdownChange() {
							if($(this).val() == '') {
								if ($(this).find(':selected').data('value')['type'] == 'value') {
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'], 'null');
								} else if ($(this).find(':selected').data('value')['type'] == 'range') {
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'] + '.low', 'null');
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'] + '.high', 'null');
								}
							} else {
								if ($(this).find(':selected').data('value')['type'] == 'value') {
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'], $(this).find(':selected').data('value')['value'], false);
								} else if ($(this).find(':selected').data('value')['type'] == 'range') {
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'] + '.low', $(this).find(':selected').data('value')['low'], false);
									$.address.parameter('filter.' + $(this).find(':selected').data('facet')['field'] + '.high', $(this).find(':selected').data('value')['high'], false);
								}

								if(!init_options.disableGA) {
									SearchSpring.Catalog.trackEvent('Facet Click');
								}
							}

							$.address.parameter('page', 1);
							$.address.update();
						}


						function removeFacetValue() {
							removeAddressValue($(this).data('facet')['field'], $(this).data('value'), 'null');

							$.address.parameter('page', 1);
							$.address.update();
						}

						function removeBreadCrumb() {
							var filters = $(this).data('removeFilters');
							for (var i = 0; i < filters.length; i++) {
								if (filters[i]['value']) {
									var value = {
										type : 'value',
										value : filters[i]['value']
									}
								}
								else {
									var value = {
										type : 'range',
										low : filters[i]['rangeLow'],
										high : filters[i]['rangeHigh']
									}
								}
								removeAddressValue(filters[i]['field'], value, '');
							}

							var refineQuery = $(this).data('removeRefineQuery');
							for (var i =0; i < refineQuery.length; i++) {
								removeRefineQueryValue(refineQuery[i]);
							}

							$.address.parameter('page', 1);
							$.address.update();
						}

						function removeSummary() {
							var value = $(this).data('value');
							var field = $(this).data('field');

							var escapeFn = encodeURIComponent || escape;

							if(field == 'rq') {
								removeRefineQueryValue(value);
							} else {
								// Ranged Based Facet
								if (value['rangeLow']) {
									var rem_value = {
										type : 'range',
										low: value['rangeLow'],
										high: value['rangeHigh']
									};
								} else {
									var rem_value = {
										type : 'value',
										value : escapeFn(value)
									};
								}

								removeAddressValue(field, rem_value, '');
							}
							$.address.parameter('page', 1);
							$.address.update();
						}

						function removeAddressValue(facet, value, null_value) {
							var current, i;

							var unescapeFn = decodeURIComponent || unescape;
							var escapeFn = encodeURIComponent || escape;
							if (value['type'] == 'value') {
								current = $.address.parameter('filter.' + facet);
								if (current) {
									if (current.constructor.toString().indexOf("Array") == -1) {
										$.address.parameter('filter.' + facet, null_value);
									} else {
										// Chrome passes values back unescaped
										for (i = 0; i < current.length; i++) {
											current[i] = unescapeFn(current[i]);
										}

										current.splice($.inArray(unescapeFn(value['value']), current), 1);

										// Re-escape everything
										for (i = 0; i < current.length; i++) {
											current[i] = escapeFn(current[i]);
										}

										if(current.length == 0 ) {
											$.address.parameter('filter.' + facet, null_value);
										} else {
											$.address.parameter('filter.' + facet, '');
											for (i = 0; i < current.length; i++) {
												$.address.parameter('filter.' + facet, current[i], true);
											}
										}

									}
								} else {
									$.address.parameter('filter.' + facet, null_value);
								}
							} else if (value['type'] == 'range') {
								current = $.address.parameter('filter.' + facet + '.low');
								if (current) {
									if (current.constructor.toString().indexOf("Array") == -1) {
										$.address.parameter('filter.' + facet + '.low', '');
									}
									else {
										current.splice($.inArray(unescapeFn(value['low']), current), 1);
										$.address.parameter('filter.' + facet + '.low', '');
										for (i = 0; i < current.length; i++) {
											$.address.parameter('filter.' + facet + '.low', current[i], true);
										}
									}
								}

								current = $.address.parameter('filter.' + facet + '.high');
								if (current) {
									if (current.constructor.toString().indexOf("Array") == -1) {
										$.address.parameter('filter.' + facet + '.high', '');
									}
									else {
										current.splice($.inArray(unescapeFn(value['high']), current), 1);
										$.address.parameter('filter.' + facet + '.high', '');
										for (i = 0; i < current.length; i++) {
											$.address.parameter('filter.' + facet + '.high', current[i], true);
										}
									}
								}
							}
						}

						function removeRefineQueryValue(value) {
							var current, i;

							var unescapeFn = decodeURIComponent || unescape;

							current = $.address.parameter('rq');

							if (current) {
								if (current.constructor.toString().indexOf("Array") == -1) {
									$.address.parameter('rq', '');
								}
								else {
									current.splice($.inArray(unescapeFn(value), current), 1);
									$.address.parameter('rq', '');
									for (i = 0; i < current.length; i++) {
										$.address.parameter('rq', current[i], true);
									}
								}
							}
						}

						function facetSliderStop(event, ui) {
							$.address.parameter('filter.' + $(this).data('facet') + '.low', ui.values[0]);
							$.address.parameter('filter.' + $(this).data('facet') + '.high', ui.values[1]);

							if(!init_options.disableGA) {
								SearchSpring.Catalog.trackEvent('Facet Slider Use');
							}

							$.address.parameter('page', 1);
							$.address.update();
						}

						function facetMultiClose() {
							$.address.parameter('filter.' + $(this).data('facet'), $(this).multiselect('values'));
							$.address.parameter('page', 1);
							$.address.update();
						}


						function toggleHover() {
							$(this).toggleClass('ui-searchspring-state-hover');
						}

						function updatePagination(pagination) {

							$('.searchspring-first_item').text(pagination['begin']);
							$('.searchspring-last_item').text(pagination['end']);
							$('.searchspring-total_items').text(pagination['totalResults']);

							$('.searchspring-query_display').text(request['q']);


							search_spring.find('.searchspring-previous').unbind().bind('click', {page: pagination['currentPage'] - 1}, changePage);
							search_spring.find('.searchspring-next').unbind().bind('click', {page: pagination['currentPage'] + 1}, changePage);

							if (pagination['currentPage'] == 1) {
								search_spring.find('.searchspring-previous').hide();
							} else {
								search_spring.find('.searchspring-previous').show();
							}

							if (pagination['currentPage'] == pagination['totalPages']) {
								search_spring.find('.searchspring-next').hide();
							} else {
								search_spring.find('.searchspring-next').show();
							}

							var start = pagination['currentPage'] - 2;
							var finish = pagination['currentPage'] + 2;

							if (start < 1) {
								start = 1;
							}

							if (finish > pagination['totalPages']) {
								finish = pagination['totalPages'];
							}


							$('.searchspring-pageSelect').remove();

							for (var i = finish; i >= start; i--) {

								var page = $('<td />').text(i).bind('click', {page: i}, changePage).addClass('searchspring-pageSelect');

								if (i == pagination['currentPage']) {
									page.addClass('highlight');
								}

								top_page = page;
								bot_page = page.clone(true);
								$('.pagination.top .searchspring-previous').after(top_page);
								$('.pagination.bottom .searchspring-previous').after(bot_page);

							}

							search_spring.find('.searchspring-total_pages').text(pagination['totalPages']).unbind('click').bind('click', {page: pagination['totalPages']}, changePage);
						}

						function changePage(event) {
							$.address.parameter('page', event.data['page']);
							$.address.update();
						}


						function updateSorting(sorting) {
							$('.searchspring-sorting, #searchspring-sorting').empty();
							if (init_options.sortType == 'dropdown') {
								buildSortDropdown(sorting);
							} else {
								buildSortLinks(sorting);
							}
						}

						function buildSortDropdown(sorting) {

							var dropdown = $('<select />').bind('change', {sorting: sorting}, sortingDropdownChange);
							var active = false;
							var option;

							var addDefault = init_options.backgroundSortField.length > 0;

							for (var index = 0; index < sorting['options'].length; index++) {
								var sort_option = sorting['options'][index];

								option = $('<option></option>').data('field', sort_option).text(sort_option['label']);

								if(sort_option.field == init_options.backgroundSortField && sort_option.direction == init_options.backgroundSortDir) {
									addDefault = false;
								}

								if (sort_option.active) {
									option.attr('selected', 'selected');
									active = true;
								}

								dropdown.append(option);
							}

							if(addDefault) {

								var default_sort = {
									label : 'Default',
									field : init_options.backgroundSortField,
									direction : init_options.backgroundSortDir
								};

								option = $('<option></option>').data('field', default_sort).text(default_sort['label']);

								if(!active) {
									option.attr('selected', 'selected');
								}

								dropdown.append(option);
							}

							$('.searchspring-sorting, #searchspring-sorting').append(dropdown);
						}

						// Wrap dropdown event to use link changeSort event
						function sortingDropdownChange(event) {
							event.data['field'] = $(this).find(':selected').data('field');
							changeSort(event);
						}

						function buildSortLinks(sorting) {
							for (var index = 0; index < sorting['options'].length; index++) {
								var option = sorting['options'][index];
								var sort_option = $('<a />');
								sort_option.text(option['label']);
								sort_option.bind('click', {field: option, sorting: sorting}, changeSort);

								if (option['active']) {
									sort_option.addClass('highlight');
								}

								$('.searchspring-sorting, #searchspring-sorting').append(sort_option).append(' ');
							}
						}

						function changeSort(event) {

							var field = event.data['field'];
							var sorting = event.data['sorting'];

							var direction = field['direction'];

							for (var i = 0; i < sorting.options.length; i++) {
								$.address.parameter('sort.' + sorting.options[i]['field'], '');
							}

							$.address.parameter('sort.' + field['field'], direction);
							$.address.parameter('page', 1);
							$.address.update();
						}

						function handleSubSearch(ev) {
							ev.preventDefault();

							if($('#searchspring-refine_query').val()) {
								$.address.parameter('page', 1);
								$.address.parameter('rq', $('#searchspring-refine_query').val(), true);
								$.address.update();
							}
						}

						function resetSearch(ev) {
							window.location = window.location.protocol+"//"+window.location.hostname+window.location.pathname+window.location.search+"#";
						}

						function getUserId() {
							if (!userId) {
								userId = readCookie('_isuid');
								if (!userId || userId.length == 0) {
									userId = generateUserId();
									createCookie('_isuid', userId, 365);
								}
							}
							return userId;
						}

						function generateUserId() {
							var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split(''), uuid = [], r;
							uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
							uuid[14] = '4';
							for (var i = 0; i < 36; i++) {
								if (!uuid[i]) {
									r = 0 | Math.random() * 16;
									uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
								}
							}
							return uuid.join('');
						}

						function createCookie(name, value, days) {
							if (days) {
								var date = new Date();
								date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
								var expires = "; expires=" + date.toGMTString();
							}
							else var expires = "";
							document.cookie = name + "=" + value + expires + "; path=/";
						}

						function readCookie(name) {
							var nameEQ = name + "=";
							var ca = document.cookie.split(';');
							for (var i = 0; i < ca.length; i++) {
								var c = ca[i];
								while (c.charAt(0) == ' ') c = c.substring(1, c.length);
								if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
							}
							return null;
						}

						function eraseCookie(name) {
							createCookie(name, "", -1);
						}
					}


				}();

			}


		});

	})(SearchSpring.jQuery);

})(window);
