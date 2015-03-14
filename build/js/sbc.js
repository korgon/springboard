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
			// add home click for title
			$('.heading .title').click(function() {
				window.location = '/';
			})

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
	}

  self.updateFrame = function(new_location) {
    $("#frameview").attr('src', new_location);
  }

	self.switchSite = function(switchsite, url) {
		$('#loading').fadeIn(300);
		// show loading modal
		// switch the watch of a site
		$.get('/api/sites/commit/' + self.site, function(data) {
			if (data.site !== undefined) {
				$.get('/api/sites/watch/' + switchsite, function(data) {
					if (data.name !== undefined) {
						// update the site selectordiv and frame url
						$('title, #currentsite').text(data.name);
						self.updateFrame(url);
						$('#loading').fadeOut(300);
						self.site = switchsite;
					} else {
						console.log('error: ' + data.error);
					}
				});
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.refreshSiteList = function() {
		$.get('/api/sites/sync', function(data) {
			if (Object.keys(data) > 1 && !data.error) {
				// update the site selectordiv and frame url
				self.updateFrame(url);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.pushSite = function(site) {
		$('#loading').fadeIn(300);
		$.get('/api/sites/push/' + site, function(data) {
			if (data.site !== undefined) {
				// update the site selectordiv and frame url
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.publishSite = function(site) {
		$('#loading').fadeIn(300);
		$.get('/api/sites/publish/' + site, function(data) {
			if (Object.keys(data) > 1 && !data.error) {
				// update the site selectordiv and frame url
				self.updateFrame(url);
				$('#loading').fadeOut(300);
			} else {
				console.log('error: ' + data.error);
			}
		});
	}

	self.createSiteInput = function() {
		$('#input .wrap').empty();
		$('\
		<form id="createSite"> \
			<label for="input_name">Site Name</label> \
			<input type="text" name="name" id="input_name"> \
			<label for="input_siteid">Site Id</label> \
			<input type="text" name="siteid" id="input_siteid"> \
			<label for="input_template">Template</label> \
			<select id="input_template"> \
				<option>Skeleton</option> \
			</select> \
			<div class="buttons"> \
				<input type="submit" name="submit" value="Add Site"> \
				<input type="button" name="cancel" value="Cancel"> \
			</div> \
		</form>').appendTo('#input .wrap');
		$('#input').fadeIn(500);

		$('#createSite input[name="cancel"]').click(function() {
			$('#input').fadeOut(500);
		});

		$("#createSite").submit(function(e){
			var site = {};
			site['name'] = $('#createSite #input_name').val();
			site['siteid'] = $('#createSite #input_siteid').val();
			site['template'] = $('#createSite #input_template').val();

			if (site.name.match(/.*\..+/i) && site.siteid.match(/[a-z0-9]{6}/i)) {
				$('#input').fadeOut(200);
				$('#loading').fadeIn(300);

				$.post('/api/sites/create', site, function(data) {
					$('#loading').fadeOut(300);
					if (data.name !== undefined) {
						window.location = '/';
					} else {
						console.log('error: ' + data.error);
						$('#loading').fadeOut(1000);
					}
				});
			}
			return false;
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
					$('#frameview').toggleClass('maximized');
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
}
