import util from '../util.js'

let credentialsAreValid = ({username, password}, success, error) => {
	let errors = '';
	if (username.length < 1) {
		errors += '* Username can not be empty\n';
	}
	if (password.length < 1) {
		errors += '* Password can not be empty';
	}
	if (errors.length > 0) {
		error(errors);
	} else {
		success();
	}
};

let login = () => {
	let username = document.getElementById('username-login').value;
	let password = document.getElementById('password-login').value;
	credentialsAreValid({username: username, password: password},
		() => {
			util.sendAjax({
				method: 'POST',
				url: '/api/login',
				params: {
					username: username,
					password: password
				},
				success: (data) => {
					util.setCookie('auth_token', data['key'], 1);
					document.location.href = '/';
				},
				error: (data) => {
					alert('Login failed: ' + data.detail.detail);
				}
			});
		},
		(errors) => {
			alert('Credentials are invalid:\n' + errors);
		}
	)
};

document.addEventListener('DOMContentLoaded', () => {
	let btnLogin = document.getElementById('btn-login');
	if (btnLogin) {
		btnLogin.addEventListener('click', login);
	}
});
