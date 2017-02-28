// jQuery noconflict
(function($) {
	$(document).ready(function() {
		var search = new CumulusSearch();
		search.setConfig(configFileData);
		search.init();	
	});
})(jQuery);
