import util from '../util.js';

let page = 1;

let createTableBase = () => {
	let id = document.createElement('th');
	id.appendChild(document.createTextNode('Id'));

	let title = document.createElement('th');
	title.appendChild(document.createTextNode('Title'));

	let amount = document.createElement('th');
	amount.appendChild(document.createTextNode('Amount'));

	let totalSum = document.createElement('th');
	totalSum.appendChild(document.createTextNode('Total sum'));

	let tr = document.createElement('tr');
	tr.appendChild(id);
	tr.appendChild(title);
	tr.appendChild(amount);
	tr.appendChild(totalSum);

	let thead = document.createElement('thead');
	thead.className = 'thead-dark';
	thead.appendChild(tr);

	let tbody = document.createElement('tbody');
	tbody.id = 'order-goods-tbody';

	let table = document.createElement('table');
	table.className = 'table';
	table.appendChild(thead);
	table.appendChild(tbody);
	return table;
};

let createOrderedGoodsRow = (item) => {
	let id = document.createElement('th');
	id.appendChild(document.createTextNode(item.id));

	let title = document.createElement('th');
	title.style.textOverflow = 'word-wrap';
	title.appendChild(document.createTextNode(item.title));

	let amount = document.createElement('th');
	amount.appendChild(document.createTextNode(item.amount));

	let totalSum = document.createElement('th');
	totalSum.appendChild(document.createTextNode('₴' + item.total_sum.toFixed(2)));

	let tr = document.createElement('tr');
	tr.appendChild(id);
	tr.appendChild(title);
	tr.appendChild(amount);
	tr.appendChild(totalSum);

	return tr;
};

function refreshOrderedGoods(data, item, root) {
	let pmt = document.getElementById('order-modal-title');
	pmt.innerText = item.destination_address;
	util.refreshData(
		data,
		document.getElementById('order-goods-tbody'),
		createOrderedGoodsRow,
		0,
		null,
		root,
		refreshOrderedGoods,
		'goods'
	);
}

let createOrderRow = (item) => {
	let firstName = document.createElement('th');
	firstName.appendChild(document.createTextNode(item.u_first_name));

	let lastName = document.createElement('th');
	lastName.appendChild(document.createTextNode(item.u_last_name));

	let destination = document.createElement('th');
	destination.appendChild(document.createTextNode(item.destination_address));

	let phone = document.createElement('th');
	phone.appendChild(document.createTextNode(item.u_phone));

	let email = document.createElement('th');
	if (item.u_email) {
		email.appendChild(document.createTextNode(item.u_email));
	} else {
		email.className = 'text-muted';
		email.style.textAlign = 'center';
		email.appendChild(document.createTextNode('no data'));
	}

	let btnView = document.createElement('button');
	btnView.className = 'btn btn-success';
	btnView.type = 'button';
	btnView.appendChild(document.createTextNode('View'));
	btnView.setAttribute('data-toggle', 'modal');
	btnView.setAttribute('data-target', '#orderedGoodsModal');
	btnView.addEventListener('click', () => {
		util.sendAjax({
			method: 'GET',
			url: '/api/orders/goods',
			params: {
				order_id: item.id
			},
			success: (data) => {
				let root = document.getElementById('ordered-goods-modal-body');
				root.innerHTML = '';
				root.appendChild(createTableBase());
				refreshOrderedGoods(data, item, root);
			},
			error: (data) => {
				alert(data);
			}
		});
	});
	let btnViewTh = document.createElement('th');
	btnViewTh.appendChild(btnView);

	let codeToStatus = (code) => {
		switch (code) {
			case 1:
				return 'On it\'s way';
			case 2:
				return 'Delivered';
			case 3:
				return 'Rejected';
			default:
				return 'Being loaded';
		}
	};

	let selection = document.createElement('select');
	for (let i = 0; i < 4; i++) {
		let option = document.createElement('option');
		option.setAttribute('value', i.toString());
		option.appendChild(document.createTextNode(codeToStatus(i)));
		if (i === parseInt(item.status)) {
			option.setAttribute('selected', 'selected');
		}
		selection.appendChild(option);
	}
	selection.className = 'form-control';
	selection.addEventListener('change', () => {
		util.sendAjax({
			method: 'PUT',
			url: '/api/orders/all',
			params: {
				order_id: item.id,
				status: selection.value
			},
			success: () => {},
			error: (err) => {
				alert(err.detail.detail);
			}
		});
	});

	let statusDiv = document.createElement('div');
	statusDiv.className = 'form-group';
	statusDiv.appendChild(selection);

	let statusTh = document.createElement('th');
	statusTh.style.minWidth = '170px';
	statusTh.appendChild(statusDiv);

	let tr = document.createElement('tr');
	tr.appendChild(firstName);
	tr.appendChild(lastName);
	tr.appendChild(destination);
	tr.appendChild(phone);
	tr.appendChild(email);
	tr.appendChild(btnViewTh);
	tr.appendChild(statusTh);

	return tr;
};

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let showMoreOrders = document.getElementById('show-more-orders');
	showMoreOrders.addEventListener('click', function showMoreOrders() {
		util.loadPage(
			'/api/orders/all',
			10,
			page,
			document.getElementById('orders-table-body'),
			createOrderRow,
			this,
			document.getElementById('orders'),
			showMoreOrders,
			'orders'
		);
		page++;
	});
	showMoreOrders.click();

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
