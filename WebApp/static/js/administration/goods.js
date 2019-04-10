import util from '../util.js';

let page = 1;

let createGoodsRow = (item) => {
	let pTitle = document.createElement('p');
	pTitle.style.textOverflow = 'word-wrap';
	pTitle.appendChild(document.createTextNode(item['title']));

	let title = document.createElement('th');
	title.appendChild(pTitle);

	let price = document.createElement('th');
	price.appendChild(document.createTextNode('₴ ' + item['price']));

	let pDescription = document.createElement('p');
	pDescription.style.textOverflow = 'word-wrap';
	pDescription.style.width = '100%';
	pDescription.appendChild(document.createTextNode(item['description']));

	let description = document.createElement('th');
	description.appendChild(pDescription);

	let btnEdit = document.createElement('a');
	btnEdit.className = 'dropdown-item';
	btnEdit.style.cursor = 'pointer';
	btnEdit.href = '/administration/goods/' + item.code + '/edit';
	btnEdit.appendChild(document.createTextNode('Edit'));

	let tr = document.createElement('tr');

	let btnDelete = document.createElement('button');
	btnDelete.className = 'dropdown-item';
	btnDelete.type = 'button';
	btnDelete.style.cursor = 'pointer';
	btnDelete.appendChild(document.createTextNode('Delete'));
	btnDelete.addEventListener('click', function btnDeleteListener(event) {
		util.sendAjax({
			method: 'DELETE',
			url: '/api/goods',
			params: {
				goods_code: item['code']
			},
			success: () => {
				event.target.removeEventListener('click', btnDeleteListener);
				tr.parentNode.removeChild(tr);
			},
			error: (data) => {
				alert(data);
			}
		});
	});

	let btnToggleGear = document.createElement('i');
	btnToggleGear.className = 'fa fa-gear';

	let btnToggle = document.createElement('button');
	btnToggle.setAttribute('type', 'button');
	btnToggle.className = 'btn btn-default dropdown-toggle';
	btnToggle.setAttribute('data-toggle', 'dropdown');
	btnToggle.appendChild(btnToggleGear);

	let div = document.createElement('div');
	div.className = 'dropdown-menu';
	div.appendChild(btnEdit);
	div.appendChild(btnDelete);

	let manageBtnGroup = document.createElement('div');
	manageBtnGroup.className = 'btn-group';
	manageBtnGroup.appendChild(btnToggle);
	manageBtnGroup.appendChild(div);

	let manage = document.createElement('th');
	manage.appendChild(manageBtnGroup);

	tr.appendChild(title);
	tr.appendChild(price);
	tr.appendChild(description);
	tr.appendChild(manage);

	return tr;
};

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let active_tab = util.getCookie('active_tab');

	let goodsDiv = document.getElementById('goods');
	let goodsTab = document.getElementById('goods-tab');
	goodsTab.addEventListener('click', () => {
		util.setCookie('active_tab', 'goods', 1);
	});

	let promotionsDiv = document.getElementById('promotions');
	let promotionsTab = document.getElementById('promotions-tab');
	promotionsTab.addEventListener('click', () => {
		util.setCookie('active_tab', 'promotions', 1);
	});

	let ordersDiv = document.getElementById('orders');
	let ordersTab = document.getElementById('orders-tab');
	ordersTab.addEventListener('click', () => {
		util.setCookie('active_tab', 'orders', 1);
	});

	if (active_tab && active_tab === 'promotions') {
		goodsDiv.className += ' fade';
		ordersDiv.className += ' fade';
		promotionsDiv.className += ' active show';
		promotionsTab.className += ' active show';
	} else if (active_tab && active_tab === 'orders') {
		ordersDiv.className += ' active show';
		ordersTab.className += ' active show';
		promotionsDiv.className += ' fade';
		goodsDiv.className += ' fade';
	} else {
		goodsDiv.className += ' active show';
		goodsTab.className += ' active show';
		promotionsDiv.className += ' fade';
		ordersDiv.className += ' fade';
	}

	let showMoreGoodsTab = document.getElementById('show-more-goods-tab');
	showMoreGoodsTab.addEventListener('click', function showMoreGoodsListener() {
		util.loadPage(
			'api/goods',
			10,
			page,
			document.getElementById('available-goods-tbody'),
			createGoodsRow,
			document.getElementById('show-more-goods-tab'),
			document.getElementById('available-goods'),
			showMoreGoodsListener,
			'goods'
		);
		page++;
	});
	showMoreGoodsTab.click();

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
