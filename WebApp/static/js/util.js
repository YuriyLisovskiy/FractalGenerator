let sendAjax = ({method, url, params, headers, success, error}) => {
	let formatParams = (params) => {
		return '?' + Object
			.keys(params)
			.map(function(key){
				return key+'=' + encodeURIComponent(params[key])
			})
			.join('&')
	};
	method = method.toLowerCase();
	let formattedParams = '';
	if (method === 'get') {
		if (params) {
			formattedParams = formatParams(params);
		}
	}
	let request = new XMLHttpRequest();
	request.open(method, url + formattedParams, true);
	request.setRequestHeader('Content-type', 'application/json');
	request.setRequestHeader('Accept', 'application/json');
	if (headers) {
		for (let key in headers) {
			request.setRequestHeader(key, headers[key]);
		}
	}
	request.addEventListener('load', () => {
		if (request.status < 400) {
			success(JSON.parse(request.responseText));
		} else {
			error({detail: JSON.parse(request.responseText), status: request.status});
		}
	}, false);
	if (params) {
		request.send(JSON.stringify(params));
	} else {
		request.send(null);
	}
};

let setCookie = (name, value, hours) => {
	let expires = "";
	if (hours) {
		let date = new Date();
		date.setTime(date.getTime() + (hours * 60 * 60 * 1000));
		expires = "; expires=" + date.toUTCString();
	}
	document.cookie = name + "=" + (value || "")  + expires + "; path=/";
};

let getCookie = (name) => {
	let nameEQ = name + "=";
	let ca = document.cookie.split(';');
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === ' ') {
			c = c.substring(1, c.length);
		}
		if (c.indexOf(nameEQ) === 0) {
			return c.substring(nameEQ.length, c.length);
		}
	}
	return null;
};

let eraseCookie = (name) => {
	document.cookie = name+'=; Max-Age=-1;';
};

let userIsAuthenticated = (success, failed) => {
	sendAjax({
		method: 'POST',
		url: '/api/token/verify',
		success: (data) => {
			success(data);
		},
		error: (data) => {
			eraseCookie('auth_token');
			failed(data);
		}
	});
};

let appendNoDataMessage = (root, message) => {
	let listEmpty = document.createElement('h4');
	listEmpty.style.textAlign = 'center';
	listEmpty.style.marginTop = '10px';
	listEmpty.className = 'text-muted';
	listEmpty.appendChild(document.createTextNode(message));
	root.innerHTML = '';
	root.appendChild(listEmpty);
};

let refreshData = (data, container, createFunction, currPage, moreBtn, root, listener, dataName) => {
	if (data[dataName].length > 0) {
		for (let i = 0; i < data[dataName].length; i++) {
			container.appendChild(createFunction(data[dataName][i]));
		}
		if (data.pages) {
			if (parseInt(data['pages']) <= currPage && moreBtn != null) {
				moreBtn.removeEventListener('click', listener);
				moreBtn.parentNode.removeChild(moreBtn);
			}
		}
	} else {
		appendNoDataMessage(root, 'No ' + dataName);
	}
};

let loadPage = (url, limit, page, container, createFn, moreBtn, root, listener, dataName, refreshFunction = refreshData) => {
	sendAjax({
		method: 'GET',
		url: url,
		params: {
			page: page,
			limit: limit
		},
		success: (data) => {
			refreshFunction(data, container, createFn, page, moreBtn, root, listener, dataName);
		},
		error: (data) => {
			alert(data.detail.detail);
		}
	});
};

export default {
	sendAjax: sendAjax,
	setCookie: setCookie,
	getCookie: getCookie,
	eraseCookie: eraseCookie,
	userIsAuthenticated: userIsAuthenticated,
	appendNoDataMessage: appendNoDataMessage,
	refreshData: refreshData,
	loadPage: loadPage
};
