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
      // check for changes in frameurl and send them to frame
      $('#frameurl').keypress(function(event) {
        if (event.keyCode == 13) {
          self.updateFrame($('#frameurl').val());
        }
      });

			// bind new tab button
			$('.heading .open').click(function() {
				window.open($("#frameview").attr('src'), '_blank');
			});

			// initialize sites dropdown
			siteSelector();

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

		// bind hotkeys to iframe (if it exists)
		if ($iframe.length == 1) {
			$iframe.load(function() {
				$(this).contents().keydown(function(event) {
					bindKeys(event)
				});
			});
		}
	}

	self.updateUrl = function() {
    $('#frameurl').val($("#frameview").attr('src'));
	}

  self.updateFrame = function(new_location) {
    $("#frameview").attr('src', new_location);
  }

	// hotkeys!!!
	function bindKeys(event) {
		if (event.ctrlKey || event.metaKey) {
			switch (String.fromCharCode(event.which).toLowerCase()) {
				// ctrl-s or command-s
				// hide springboard panel
				case 's':
					event.preventDefault();
					$('.heading').toggleClass('hidden');
					$('#frameview').toggleClass('maximized');
					break;
			}
		}
	}

	function siteSelector() {
		$('.selection .selected').click(function() {
			$('.websiteselect').toggle();
		});
	}
}
