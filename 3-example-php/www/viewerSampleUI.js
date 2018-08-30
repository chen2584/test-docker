var viewer;
var searchPage = 0;
var searchIndex = 0;

document.addEventListener("DOMContentLoaded", function(event) {
	// Create viewer
	loading_start();
	PdfWebViewer_create('viewerContainer').then(function (value) {
		loading_end();
		viewer = value;
		viewer.setLicenseKey('1-M8AAN-XA951-5D9A5-796GJ-VCHK5-3G6VC-1BW91').then(function () {
			console.log("License accepted");
		}, function (errorMessage) {
			alert("License invalid: " + errorMessage);
		});

		/*
		 * Add event listeners
		 */

		viewer.eventBus.addEventListener('firstVisiblePage', function (e) { update_pageno(e); });
		viewer.eventBus.addEventListener('zoom',             function (e) { document.getElementById('menu_zoomp').value = Math.round(e * 100) + '%'; });
		viewer.eventBus.addEventListener('fitMode',          function (e) { update_fitmode(e); });
		viewer.eventBus.addEventListener('pageLayoutMode', function (e) { update_layoutmode(e); });
		viewer.eventBus.addEventListener('busyState', function (isBusy) { if (isBusy) { busy_start(); } else { busy_end(); } });

		document.getElementById('menu_file').addEventListener('change', menu_file);

		/*
		 * Initialize viewer
		 */
		var urlenc = /(?:\?|&)file=([^&]*)/.exec(location.search);
		if (urlenc != null) {
			// Open document passed in url
			var url = decodeURIComponent(urlenc[1]);
			var xhr = new XMLHttpRequest();
			xhr.open("GET", url);
			xhr.responseType = 'arraybuffer';
			xhr.onerror = function () {
				alert('Failed to download ' + url);
			}
			xhr.onload  = function () {
				if (xhr.status != 200) {
					alert('Failed to download ' + url);
					set_menu_item_state(true, 'menu_open', menu_open);
				} else {
					doopen(xhr.response, url, '');
				}
			}
			xhr.send(null);
		} else {
			// Activate open menu item
			set_menu_item_state(true, 'menu_open', menu_open);
		}
		
		var showThumbnails = /(?:\?|&)showThumbnails=([^&]*)/.exec(location.search);
		viewer.showThumbnails(showThumbnails != null && showThumbnails[1] == 'true');

		/*
		 * Initialize searching menu
		 */

		set_menu_item_state(true, 'search_prev', search_prev);
		set_menu_item_state(true, 'search_next', search_next);
		set_menu_item_state(true, 'search_config', search_open_config);
		set_menu_item_state(true, 'search_close', search_close);
		document.getElementById("searchText").addEventListener('input', search_clearResult);
		document.getElementById("searchMatchCase").addEventListener('change', search_clearResult);
		document.getElementById("searchWrap").addEventListener('change', search_clearResult);
		document.getElementById("searchRegex").addEventListener('change', search_clearResult);
		document.getElementById("searchText").addEventListener('keydown', function (e) {
			switch (e.key) {
				case "Enter":
					search_next(e);
					break;
				case "Escape":
					search_close(e);
					break;
				default:
					return;
			}
			event.preventDefault();
		});

	});
});

/*
 * Menu item click handlers
 */

function menu_open(event) {
	document.getElementById('menu_file').click();
}

function menu_close() {
	return viewer.close().then(function () {
		set_menu_item_state(false, 'menu_save', menu_save);
		set_menu_item_state(false, 'menu_close', menu_close);
		set_menu_item_state(false, 'menu_page_prev', menu_page_prev);
		set_menu_item_state(false, 'menu_page', null);
		set_menu_item_state(false, 'menu_page_next', menu_page_next);
		set_menu_item_state(false, 'menu_zoomout', menu_zoomout);
		set_menu_item_state(false, 'menu_zoom', null);
		set_menu_item_state(false, 'menu_zoomin', menu_zoomin);
		set_menu_item_state(false, 'menu_fit_page', menu_fit_page);
		set_menu_item_state(false, 'menu_fit_width', menu_fit_width);
		set_menu_item_state(false, 'menu_fit_actual', menu_fit_actual);
		set_menu_item_state(false, 'menu_layout_singlepage', menu_layout_singlepage);
		set_menu_item_state(false, 'menu_layout_onecolumn', menu_layout_onecolumn);
		set_menu_item_state(false, 'menu_rotate_left', menu_rotate_left);
		set_menu_item_state(false, 'menu_rotate_right', menu_rotate_right);
		set_menu_item_state(false, 'menu_search', menu_search);
		document.getElementById('menu_pageno').readOnly = true;
		document.getElementById('menu_zoomp').readOnly = true;
		search_close();
	}, function (error) {
		console.log(error);
	});
}

function menu_save(event) {
	viewer.saveFile(false).then(function (data) {
		var file = new Blob([data], { type: 'application/pdf' });
		if (window.navigator.msSaveOrOpenBlob) {
			window.navigator.msSaveOrOpenBlob(file, "saved.pdf");
		} else {
			var a = document.createElement('a');
			var url = window.URL.createObjectURL(file);
			a.href = url;
			a.download = 'saved.pdf';
			document.body.appendChild(a);
			a.click();
			setTimeout(function () {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);
			}, 500);
		}
	}, function (error) {
		alert('Failed to save file: ' + error);
	});
}


function menu_page_prev(event) { viewer.setPageNo(viewer.getPageNo() - 1); }
function menu_pageno(event)    { viewer.setPageNo(parseInt(document.getElementById('menu_pageno').value)); }
function menu_page_next(event) { viewer.setPageNo(viewer.getPageNo() + 1); }

function menu_zoomout(event) { viewer.setZoom(viewer.getZoom() * 0.8); }
function menu_zoomp(event)   { viewer.setZoom(parseFloat(document.getElementById('menu_zoomp').value.replace('%', '')) / 100.0); }
function menu_zoomin(event)  { viewer.setZoom(viewer.getZoom() * 1.25); }

function menu_fit_page(event)   { viewer.setFitMode(viewer.PdfFitMode.FitPage); }
function menu_fit_width(event)  { viewer.setFitMode(viewer.PdfFitMode.FitWidth); }
function menu_fit_actual(event) { viewer.setFitMode(viewer.PdfFitMode.ActualSize); }

function menu_rotate_left(event)  { viewer.setRotation(viewer.getRotation() + 270); }
function menu_rotate_right(event) { viewer.setRotation(viewer.getRotation() + 90); }

function menu_layout_singlepage(event) { viewer.setPageLayoutMode(viewer.PdfPageLayoutMode.SinglePage); }
function menu_layout_onecolumn(event)  { viewer.setPageLayoutMode(viewer.PdfPageLayoutMode.OneColumn); }

function menu_search(event) {
	var isActive = get_menu_item_active('menu_search');
	set_menu_item_active(!isActive, 'menu_search');
	setVisible('search-form-div', !isActive);
	if (!isActive) {
		document.getElementById("searchText").focus();
	}
}
function search_prev(event) {
	search_update(false);
}
function search_next(event) {
	search_update(true);
}
function search_update(searchForward) {
	var matchCase = document.getElementById("searchMatchCase").checked;
	var regex = document.getElementById("searchRegex").checked;
	var wrap = document.getElementById("searchWrap").checked;
	viewer.configureSearcher(matchCase, wrap, !searchForward, regex);
	if (searchPage <= 0) {
		searchPage = viewer.getPageNo();
		searchIndex = 0;
	}
	search_setColor('white');
	document.getElementById('searchTextBusy').classList.add('searchTextBusy');

	viewer.search(document.getElementById("searchText").value, searchPage, searchIndex).then(function (searchResult) {
		searchPage = searchResult.page;
		searchIndex = searchResult.index;
		document.getElementById('searchTextBusy').classList.remove('searchTextBusy');
		search_setColor('green');
	}, function (error) {
		console.log(error);
		document.getElementById('searchTextBusy').classList.remove('searchTextBusy');
		search_setColor('red');
	});
}
function search_open_config(event) {
	var isVisible = getVisible('search-config-form');
	setVisible('search-config-form', !isVisible);
}
function search_close(event) {
	setVisible('search-config-form', false);
	setVisible('search-form-div', false);
	searchPage = 0;
	set_menu_item_active(false, 'menu_search');
	search_setColor('white');
	viewer.search("".searchPage, searchIndex).then(function (searchResult) { }, function (error) { });
}
function search_setColor(color) {
	var classlist = document.getElementById("searchText").classList;
	classlist.remove('white');
	classlist.remove('red');
	classlist.remove('green');
	classlist.add(color);
}
function search_clearResult(e) {
	search_setColor('white');
}

function menu_file(event) {
	var file = event.target.files[0];
	if (file == undefined || file == null)
		return;
	var reader = new FileReader();
	reader.addEventListener('loadend', function (e) {
		doopen(e.target.result, file.name, '');
		event.target.value = null;
	});
	reader.readAsArrayBuffer(file);
}

function menu_file(event) {
	var file = event.target.files[0];
	if (file == undefined || file == null)
		return;
	var reader = new FileReader();
	reader.addEventListener('loadend', function (e) {
		doopen(e.target.result, file.name, '');
		event.target.value = null;
	});
	reader.readAsArrayBuffer(file);
}

/*
 * Helper methods
 */

/* Do open document */
function doopen(bytes, file, password) {
	set_menu_item_state(false, 'menu_open', menu_open);
	loading_start();
	menu_close().then(function () {
		viewer.openBlob(new Blob([bytes]), password).then(function () {
			loading_end();
			set_menu_item_state(true, 'menu_open', menu_open);
			set_menu_item_state(true, 'menu_save', menu_save);
			set_menu_item_state(true, 'menu_close', menu_close);
			set_menu_item_state(true, 'menu_page_prev', menu_page_prev);
			set_menu_item_state(true, 'menu_page', null);
			set_menu_item_state(true, 'menu_page_next', menu_page_next);
			set_menu_item_state(true, 'menu_zoomout', menu_zoomout);
			set_menu_item_state(true, 'menu_zoom', null);
			set_menu_item_state(true, 'menu_zoomin', menu_zoomin);
			set_menu_item_state(true, 'menu_fit_page', menu_fit_page);
			set_menu_item_state(true, 'menu_fit_width', menu_fit_width);
			set_menu_item_state(true, 'menu_fit_actual', menu_fit_actual);
			set_menu_item_state(true, 'menu_layout_singlepage', menu_layout_singlepage);
			set_menu_item_state(true, 'menu_layout_onecolumn', menu_layout_onecolumn);
			set_menu_item_state(true, 'menu_rotate_left', menu_rotate_left);
			set_menu_item_state(true, 'menu_rotate_right', menu_rotate_right);
			set_menu_item_state(true, 'menu_search', menu_search);

			document.getElementById('menu_pageno').readOnly = false;
			document.getElementById('menu_zoomp').readOnly = false;
			update_pageno(viewer.getPageNo());
			update_fitmode(viewer.getFitMode());
			update_layoutmode(viewer.getPageLayoutMode());
		}, function (errorMessage) {
			loading_end();
			if (errorMessage === 'The authentication failed due to a wrong password.') {
				var password = window.prompt('Password required to open ' + file, '');
				if (password != null) {
					doopen(bytes, file, password);
					return;
				}
			} else {
				alert('Failed to open file ' + file + ': ' + errorMessage);
				set_menu_item_state(true, 'menu_open', menu_open);
			}
		});
	});
}

/* Enable/disable menu item */
function set_menu_item_state(newState, name, action) {
	var item = document.getElementById(name);
	var state = item.className.search(' enabled') != -1;
	if (newState != state) {
		if (newState) {
			if (action != null) {
				if (item.addEventListener) {
					item.addEventListener('click', action);
				} else if (item.attachEvent) {
					item.attachEvent('onclick', action);
				}
			}
			item.className += ' enabled';
		} else {
			if (action != null) {
				if (item.removeEventListener) {
					item.removeEventListener('click', action);
				} else if (detachEvent) {
					item.detachEvent('onclick', action);
				}
			}
			item.className = item.className.replace(' enabled', '').replace(' active', '');
		}
	}
}

/* Activate/deactivate menu item */
function set_menu_item_active(newState, name) {
	var item = document.getElementById(name);
	var state = item.className.search(' active') != -1;
	if (newState != state) {
		if (newState) {
			item.className += ' active';
		} else {
			item.className = item.className.replace(' active', '');
		}
	}
}

/* get menu item active */
function get_menu_item_active(name) {
	var item = document.getElementById(name);
	var state = item.className.search(' active') != -1;
	return state;
}

/* Update menu item states */

function update_pageno(pageno) {
	document.getElementById('menu_pageno').value = pageno;
	set_menu_item_state(pageno > 1, 'menu_page_prev', menu_page_prev);
	set_menu_item_state(pageno < viewer.getPageCount(), 'menu_page_next', menu_page_next);
}

function update_fitmode(mode) {
	set_menu_item_active(mode == viewer.PdfFitMode.FitPage, 'menu_fit_page');
	set_menu_item_active(mode == viewer.PdfFitMode.FitWidth, 'menu_fit_width');
	set_menu_item_active(mode == viewer.PdfFitMode.ActualSize, 'menu_fit_actual');
}

function update_layoutmode(mode) {
	set_menu_item_active(mode == viewer.PdfPageLayoutMode.SinglePage, 'menu_layout_singlepage');
	set_menu_item_active(mode == viewer.PdfPageLayoutMode.OneColumn, 'menu_layout_onecolumn');
}

/*
 * Loading animation
 */
function loading_start() {
	document.getElementById('loading').style.display = 'block';
	document.getElementById('body').style.cursor = 'wait';
}
function loading_end() {
	document.getElementById('loading').style.display = 'none';
	document.getElementById('body').style.cursor = 'auto';
}

function busy_start() {
	document.getElementById('busy').style.display = 'block';
}
function busy_end() {
	document.getElementById('busy').style.display = 'none';
}


/*
 * show/hide Element
 */
function setVisible(element, visible) {
	var item = document.getElementById(element);
	item.style.visibility = visible ? "visible" : "hidden";
}
function getVisible(element) {
	var item = document.getElementById(element);
	return item.style.visibility == "visible";
}

