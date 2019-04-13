import util from '../util.js';

let page = 1;

let createManageButton = (name, method, task_id, btn_id, success) => {
	let btn = document.createElement('button');
	btn.className = 'dropdown-item';
	btn.type = 'button';
	btn.style.cursor = 'pointer';
	btn.appendChild(document.createTextNode(name));
	btn.addEventListener('click', function btnListener() {
		util.sendAjax({
			method: method,
			url: '/api/administration/task',
			params: {
				task_id: task_id
			},
			success: success,
			error: (data) => {
				alert(data);
			}
		});
	});
	return btn;
};

let createTaskRow = (item) => {
	let pTitle = document.createElement('p');
	pTitle.style.textOverflow = 'word-wrap';
	pTitle.appendChild(document.createTextNode(item['title']));

	let title = document.createElement('th');
	title.appendChild(pTitle);

	let userName = document.createElement('th');
	userName.appendChild(document.createTextNode('@' + item['owner_name']));

	let pProgress = document.createElement('p');
	pProgress.style.textOverflow = 'word-wrap';
	pProgress.style.width = '100%';
	pProgress.setAttribute('id', 'progress_' + item['id']);
	pProgress.appendChild(document.createTextNode(item['progress'] + '%'));

	let progress = document.createElement('th');
	progress.appendChild(pProgress);

	let status = document.createElement('th');
	status.setAttribute('id', 'status_' + item['id']);
	status.appendChild(document.createTextNode(item['status']));
	switch (item['status']) {
		case 'Running':
			status.style.backgroundColor = 'lightgreen';
			break;
		case 'Finished':
			status.style.backgroundColor = 'lightgray';
			break;
		case 'In Queue':
			status.style.backgroundColor = 'yellow';
			break;
		default:
			status.style.backgroundColor = 'transparent';
			break;
	}
	let btnStart = createManageButton('Start', 'POST', item['id'], 'start_' + item['id'], () => {
		btnStart.setAttribute('disabled', 'true');
		btnStop.removeAttribute('disabled');
	});
	let btnStop = createManageButton('Stop', 'PUT', item['id'], 'stop_' + item['id'], () => {
		btnStart.removeAttribute('disabled');
		btnStop.setAttribute('disabled', 'true');
	});
	let intervalId = setInterval(function() {
		util.sendAjax({
			method: 'GET',
			url: '/api/administration/task',
			params: {
				task_id: item['id']
			},
			success: (data) => {
				if (data['task_status'] === 'Finished') {
					clearInterval(intervalId);
				} else {
					let prs = document.getElementById('progress_' + item['id']);
					let sts = document.getElementById('status_' + item['id']);
					let srv = document.getElementById('task_server_' + item['id']);
					prs.innerText = data['task_progress'] + '%';
					sts.innerText = data['task_status'].toString();
					srv.innerText = data['task_server'].toString();
					switch (data['task_status']) {
						case 'Running':
							sts.style.backgroundColor = 'lightgreen';
							break;
						case 'Finished':
							sts.style.backgroundColor = 'lightgray';
							break;
						case 'In Queue':
							sts.style.backgroundColor = 'yellow';
							break;
						default:
							sts.style.backgroundColor = 'transparent';
							break;
					}
				}
			},
			error: (data) => {
				console.log(data);
			}
		});
	}, 1000);
	let btnDelete = createManageButton('Delete', 'DELETE', item['id'], 'delete_' + item['id'], () => {
		let currRow = document.getElementById('task_row_' + item['id']);
		currRow.parentNode.removeChild(currRow);
		clearInterval(intervalId);
	});
	
	switch (item['status']) {
		case 'Not Started':
			btnStop.disabled = true;
			break;
		case 'In Queue':
		case 'Running':
			btnStart.disabled = true;
			break;
	}

	let div = document.createElement('div');
	div.className = 'dropdown-menu';
	if (item['status'] !== 'Finished'){
		div.appendChild(btnStart);
		div.appendChild(btnStop);
	}
	div.appendChild(btnDelete);

	let btnToggleGear = document.createElement('i');
	btnToggleGear.className = 'fa fa-gear';

	let btnToggle = document.createElement('button');
	btnToggle.setAttribute('type', 'button');
	btnToggle.className = 'btn btn-default dropdown-toggle';
	btnToggle.setAttribute('data-toggle', 'dropdown');
	btnToggle.appendChild(btnToggleGear);

	let manageBtnGroup = document.createElement('div');
	manageBtnGroup.className = 'btn-group';
	manageBtnGroup.appendChild(btnToggle);
	manageBtnGroup.appendChild(div);

	let manage = document.createElement('th');
	manage.appendChild(manageBtnGroup);

	let idTh = document.createElement('th');
	idTh.appendChild(document.createTextNode(item['id']));

	let pServer = document.createElement('p');
	pServer.style.textOverflow = 'word-wrap';
	pServer.style.width = '100%';
	pServer.setAttribute('id', 'task_server_' + item['id']);
	if (item['server_host'] === null || item['server_port'] === null) {
		pServer.appendChild(document.createTextNode('-'));
	} else {
		pServer.appendChild(document.createTextNode(item['server_host'] + ':' + item['server_port']));
	}

	let server = document.createElement('th');
	server.appendChild(pServer);

	let tr = document.createElement('tr');
	tr.setAttribute('id', 'task_row_' + item['id']);
	tr.appendChild(idTh);
	tr.appendChild(title);
	tr.appendChild(userName);
	tr.appendChild(status);
	tr.appendChild(progress);
	tr.appendChild(server);
	let fractal = document.createElement('th');
	if (item['fractal_link'] !== null) {
		let fLink = document.createElement('a');
		fLink.href = item['fractal_link'];
		fLink.className = 'btn btn-dark';
		fLink.setAttribute('role', 'button');
		fLink.appendChild(document.createTextNode('Image'));
		fractal.appendChild(fLink);
	} else {
		let fP = document.createElement('p');
		fP.style.width = '100%';
		fP.style.textAlign = 'center';
		fP.appendChild(document.createTextNode('-'));
		fractal.appendChild(fP);
	}
	tr.appendChild(fractal);
	tr.appendChild(manage);

	return tr;
};

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let showMoreTasksTab = document.getElementById('show-more-tasks-tab');
	showMoreTasksTab.addEventListener('click', function showMoreTasksListener() {
		util.loadPage(
			'api/administration/tasks',
			10,
			page,
			document.getElementById('tasks-tbody'),
			createTaskRow,
			document.getElementById('show-more-tasks-tab'),
			document.getElementById('tasks'),
			showMoreTasksListener,
			'tasks'
		);
		page++;
	});
	showMoreTasksTab.click();

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
