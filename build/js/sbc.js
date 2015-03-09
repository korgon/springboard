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

  self.init = function() {
    // do stuff


    // do stuff when dom has loaded
    $(function() {
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

	self.switchSite = function(site, url) {
		// show loading modal
		// switch the watch of a site
		$.get('/api/mockups/watch/' + site, function(data) {
			if (data.site !== undefined) {
				// update the site selectordiv and frame url
				$('title, .currentsite_name').text(data.site.name);
				self.updateFrame(url);
			} else {
				console.log('error: ' + data.error);
			}
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
