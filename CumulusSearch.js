/**
 * Class CumulusSearch
 */
function CumulusSearch() {
	this.config = {};
	this.searchResults = null;
	this.token = null;
	this.user = {};
};

CumulusSearch.prototype.setConfig = function(config) {
	console.log("Config: ");
	console.log(config);
	this.config = config;
};

CumulusSearch.prototype.init = function() {
	console.log("init");
	var lthis = this;
	// load auth and user info
	this.load(function() {
		console.log('Auth chargée');
		console.log(lthis.user);
		lthis.loadEventListeners();
	});
};

CumulusSearch.prototype.load = function(cb) {
	console.log("auth tb chargeage !!");
	var lthis = this;
	// get TB auth token
	var authURL = this.config['auth']['url'] + '/identite';
	$.ajax({
	    url: authURL,
	    type: "GET",
	    dataType: 'json',
	    xhrFields: {
	         withCredentials: true
	    }
	}).done(function(data) {
		var decodedToken = null;
		// logged-in
		if (data.token != undefined) {
			lthis.token = data.token;
			decodedToken = lthis.decodeToken(lthis.token);
			lthis.user = decodedToken.sub;
		}
		// always add Authorization header; not recommanded by jQuery doc (?!)
		var customHeaders = {},
			headerName = lthis.config['auth']['headerName'];
		customHeaders[headerName] = lthis.token;
		// tell jQuery to always send authorization header
		$.ajaxSetup({
		   headers : customHeaders
		});
		// go on
		cb();
	}).fail(function() {
		// only read rights by default
		lthis.user = {};
		cb(); // no one is identified; load app anyway
	});
};

/**
 * Decodes an SSO token @WARNING considers it is valid - true if the token comes
 * directly from the "annuaire" (here, it does) but cannot be guaranteed otherwise
 */
CumulusSearch.prototype.decodeToken = function(token) {
	parts = token.split('.');
	payload = parts[1];
	payload = atob(payload);
	payload = JSON.parse(payload, true);
	return payload;
};

CumulusSearch.prototype.loadEventListeners = function() {
	console.log('load event listeners');
	var lthis = this;

	$('#search').click(function() {
		lthis.search();
	});
	$('#search-terms').keypress(function(e) {
		if(e.which == 13) {
			lthis.search();
		}
	});
};

CumulusSearch.prototype.search = function() {
	console.log('searching !');
	//console.log(this.config.cumulus.url);
	var lthis = this;

	var searchTerms = $('#search-terms').val();
	//console.log('search terms: ' + searchTerms);

	if (searchTerms != '') {
		var searchUrl = this.config.cumulus.url + '/api/search';
		//var params = [];
		//searchUrl += '?' + params.join('&');
		searchUrl += '/' + searchTerms;
		// start wait cursor
		$('#wait-cursor').show();
		// empty results list
		$('#results-list').html('');
		$.getJSON(searchUrl, null, function(data) {
			lthis.onSearchSuccess(data);
		});
	}
};

CumulusSearch.prototype.onSearchSuccess = function(data) {
	// @TODO stop wait cursor
		$('#wait-cursor').hide();
	console.log('search success !');
	console.log(data);
	this.searchResults = data;

	// format results data
	var results = [];
	for (var i=0; i < data.results.length; ++i) {
		var d = data.results[i];
		results.push({
			fkey: d.fkey,
			name: d.name,
			href: d.href,
			path: d.path,
			mimetype: d.mimetype,
			size: filesize(d.size),
			permissions: d.permissions,
			license: d.license,
			creation_date: d.creation_date,
			creation_date_moment: moment(d.creation_date, 'YYYY-MM-DD HH:ii:ss').fromNow(),
			last_modification_date: d.last_modification_date,
			last_modification_date_moment: moment(d.last_modification_date, 'YYYY-MM-DD HH:ii:ss').fromNow(),
			keywords: d.keywords ? d.keywords.join(', ') : '',
			owner: d.owner || 'anonymous',
			meta: JSON.stringify(d.meta),
			groups: d.groups ? d.groups.join(', ') : ''
		});
	}
	this.renderTemplate('results-info', {
		nb_results: data.count
	});
	this.renderTemplate('results-list', {
		results: results
	});
};

/**
 * Renders #tpl-{id} template inside #{id} element, using {data}
 */
CumulusSearch.prototype.renderTemplate = function(id, data) {
	var container = $('#' + id),
		template = $('#tpl-' + id).html(),
		output = Mustache.render(template, data);
	container.html(output);
};
