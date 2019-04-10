import util from "./util.js";

document.addEventListener('DOMContentLoaded', function domLoaded() {
	let btnLogout = document.getElementById('btn-logout');
	if (btnLogout) {
		btnLogout.addEventListener('click', () => {
			util.eraseCookie('auth_token');
		});
	}
	let btnProfile = document.getElementById('btn-profile');
	if (btnProfile) {
		btnProfile.addEventListener('click', () => {
			util.setCookie('active_tab_profile', 'profile', 1);
		});
	}
	let btnCart = document.getElementById('btn-cart');
	if (btnCart) {
		btnCart.addEventListener('click', () => {
			util.setCookie('active_tab_profile', 'cart', 1);
		});
	}
	$(document).ready(function(){
		$('[data-toggle="tooltip"]').tooltip();
	});
	document.removeEventListener('DOMContentLoaded', domLoaded);
});
