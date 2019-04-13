import util from "./util.js";

document.addEventListener('DOMContentLoaded', function domLoaded() {
	let btnLogout = document.getElementById('btn-logout');
	if (btnLogout) {
		btnLogout.addEventListener('click', () => {
			util.eraseCookie('auth_token');
		});
	}
	$(document).ready(function(){
		$('[data-toggle="tooltip"]').tooltip();
	});
	document.removeEventListener('DOMContentLoaded', domLoaded);
});
