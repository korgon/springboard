// client side javascripts

// need to utilize browserify to include:
// jquery
// whatever else

var $ = require('jquery');
window.$ = $;

var sb = new sb();
window.sb = sb;
sb.init();


function sb() {
	var self = this;

	/*	_________________
	//
	//	private variables
	//	_________________
	*/

  var version = '1.0.0';

	/*	______________
	//
	//	public methods
	//	______________
	*/

  self.version = version;

  self.init = function() {
    // do stuff


    // do stuff when dom has loaded
    $(function() {
      // check for changes in frameurl and send them to fram
      $('#frameurl').keypress(function(event) {
        if (event.keyCode == 13) {
          self.updateFrame($('#frameurl').val());
        }
      });

      // bind hotkeys!
      $(document).bind('keydown', function(event) {
        if (event.ctrlKey || event.metaKey) {
          switch (String.fromCharCode(event.which).toLowerCase()) {
            case 's':
              event.preventDefault();
              $('.heading').toggle();
              break;
          }
        }
      });

    });
  }

	self.updateUrl = function() {
    $('#frameurl').val($("#mockupwindow").attr('src'));
	}

  self.updateFrame = function(new_location) {
    $("#mockupwindow").attr('src', new_location);
  }
}
