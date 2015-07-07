// client side javascripts

var $ = require('jquery');
window.$ = $;

var sb = new sb();
window.sb = sb;
sb.init();

function sb() {
	var self = this;
  var version = '1.0.0';

  self.version = version;
	self.site = "";

  self.init = function() {
    // do stuff


    // do stuff when dom has loaded
    $(function() {
			self.site = $('#currentsite').text();
			// add click to keep menus open
			$('.heading .title').click(function() {
				$('#above .mainmenu').toggleClass('show');
			})
			$('.worksite .currentsite').click(function() {
				$('.worksite .siteselect').toggleClass('show');
				if ($('.worksite .siteselect').hasClass('show')) {
					$('#searchbox').focus();
				}
			})
			$('#searchbox').focus(function() {
				$('#above .siteselect').addClass('show');
			}).focusout(function() {
				$('#above .siteselect').removeClass('show');
			});

			// run resize function on window resize
			$(window).resize(resize);
			resize();

      // bind hotkeys!
			self.hotkeyInit();
    });
  }

	self.hotkeyInit = function() {
		var $iframe = $('body #frameview');

		// bind hotkeys to document
		$(document).keydown(function(event) {
			bindKeys(event)
		});

		// bind hotkeys to iframe (if it exists) and if in mockup mode
		if ($iframe.length == 1) {
			// check for changes in frameurl and send them to frame
			$('#frameurl').keypress(function(event) {
				if (event.keyCode == 13) {
					self.updateFrame($('#frameurl').val());
				}
			});

			// bind new tab button
			$('.heading .openurl').click(function() {
				window.open($('#frameurl').val(), '_blank');
			});

			// look for key events inside the iframe too
			$iframe.load(function() {
				$(this).contents().keydown(function(event) {
					bindKeys(event)
				});
			});
		}
	}

	self.updateUrl = function() {
    $('#frameurl').val($("#frameview").get(0).contentWindow.location);
		$('#frame').show();
	}

  self.updateFrame = function(new_location) {
    $("#frameview").attr('src', new_location);
  }

	self.switchSite = function(usesite, url) {
		// show loading modal
		$('#loading').fadeIn(300);
		$('#frame').hide();
		// switch the watch of a site
		$.get('/api/site/commit', function(data) {
			$.get('/api/site/watch/' + usesite, function(data) {
				if (!data.error) {
					// update the site selectordiv and frame url
					$('title, #currentsite').text(data.name);
					self.updateFrame(url);
					$('#frame').fadeIn(1000);
					$('#loading').fadeOut(600);
					self.site = usesite;
				} else {
					console.log('error: ' + data.message);
				}
			});
		});
	}

	self.viewSite = function(usesite, url) {
		// show loading modal
		$('#loading').fadeIn(300);
		$.get('/api/site/commit', function(data) {
			$.get('/api/site/watch/' + usesite, function(data) {
				if (!data.error) {
					$('#loading').fadeOut(600);
					self.site = usesite;
					window.location = '/';
				} else {
					console.log('error: ' + data.message);
				}
			});
		});
	}

	self.refreshSiteList = function() {
		$('#loading').fadeIn(300);
		$.get('/api/sites/sync/', function(data) {
			if (Object.keys(data).length >= 1 && !data.error) {
				// TBD
				// update the site selectordiv with new sites
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.commitSite = function() {
		$('#loading').fadeIn(300);
		$.get('/api/site/commit/', function(data) {
			if (data.site !== undefined) {
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.pushSite = function() {
		$('#loading').fadeIn(300);

		$.get('/api/site/push/', function(data) {
			if (data.site !== undefined) {
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.mergeSite = function() {
		$('#loading').fadeIn(300);
		$.get('/api/site/merge/', function(data) {
			if (data.site !== undefined) {
				// update the site selectordiv and frame url
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.publishSite = function() {
		$('#loading').fadeIn(300);
		$.get('/api/site/publish/', function(data) {
			if (data.status == 'success') {
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.createSite = function() {
		var site = {};
		site.name = $('#createSite #input_name').val();
		site.siteid = $('#createSite #input_siteid').val();
		site.template = $('#createSite #input_template').val();

		if (site.name.match(/.*\..+/i) && site.siteid.match(/[a-z0-9]{6}/i)) {
			$('#input').fadeOut(200);
			$('#loading').fadeIn(300);

			$.post('/api/site/create', site, function(data) {
				console.log(data);
				if (data.name !== undefined) {
					setTimeout(function() {
						window.location = '/';
					}, 900);
				} else {
					console.log('error: ' + data.error);
					$('#loading').fadeOut(1000);
				}
			});
		}
		return false;
	}

	self.createSiteInput = function() {
		$('#input .wrap').empty();
		$('\
		<div class="boxwrap"> \
			<div class="boxtop"> \
				<div class="box"></div> \
				<ul class="boxbuttons"> \
					<li class="move"><a></a></li> \
					<li><a class="close"></a></li> \
				</ul> \
			</div> \
			<div class="boxcontent"> \
				<form id="createSite"> \
					<label for="input_name">Site Name</label> \
					<input type="text" name="name" id="input_name"> \
					<label for="input_siteid">Site Id</label> \
					<input type="text" name="siteid" id="input_siteid"> \
					<label for="input_template">Template</label> \
					<select id="input_template"> \
						<option>None</option> \
						<option>Skeleton</option> \
					</select> \
					<div class="buttons"> \
						<input type="submit" name="submit" value="Add Site"> \
					</div> \
				</form> \
			</div> \
		</div>').appendTo('#input .wrap');
		$('#input').fadeIn(500);

		$('.boxbuttons .close').click(function() {
			$('#input').fadeOut(500);
		});

		$("#createSite").submit(function(e) {
			e.preventDefault();
			self.createSite();
		});
	}

	// hotkeys!!!
	function bindKeys(event) {
		if (event.ctrlKey || event.metaKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				// ctrl-d or command-d
				// hide springboard panel
				case 'd':
					event.preventDefault();
					$('.heading').toggleClass('hidden');
					$('#content').toggleClass('fullscreen');
					$('#frameview').toggleClass('maximized');
					resize();
					break;
				// ctrl-s or command-s
				// save work / commit to repo
				case 's':
					event.preventDefault();
					// TBD
					break;
			}
		}
	}

	function resize() {
		// set siteselect sitescroller to max-height of window
		$('.siteselect .sitescroller').css('max-height', $(window).height() - 121);
		if ($('#content').hasClass('fullscreen')) var mod = 0;
		else var mod = 40;
		$('#content').css('height', $(window).height() - mod);
	}
}
