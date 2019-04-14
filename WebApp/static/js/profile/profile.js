import util from "../util.js";

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let active_tab_profile = util.getCookie('active_tab_profile');

	let profileDiv = document.getElementById('profile');
	let profileTab = document.getElementById('profile-tab');
	let tasksDiv = document.getElementById('tasks');
	let tasksTab = document.getElementById('tasks-tab');

	switch (active_tab_profile) {
		case 'tasks':
			profileDiv.className += ' fade';
			tasksDiv.className += ' active show';
			tasksTab.className += ' active show';
			break;
		default:
			profileDiv.className += ' active show';
			profileTab.className += ' active show';
			tasksDiv.className += ' fade';
			break;
	}

	profileTab.addEventListener('click', () => {
		util.setCookie('active_tab_profile', 'profile', 1);
	});

	tasksTab.addEventListener('click', () => {
		util.setCookie('active_tab_profile', 'tasks', 1);
	});

	document.getElementById('save-profile').addEventListener('click', function (e) {
		e.preventDefault();
		util.sendAjax({
			method: 'POST',
			url: '/api/profile/edit',
			params: {
				username: document.getElementById('username').value,
				email: document.getElementById('email').value
			},
			success: (data) => {
				util.setCookie('auth_token', data['key'], 1);
				document.location.href = data['redirect_url'];
			},
			error: (err) => {
				alert(err.detail);
			}
		})
	});

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
