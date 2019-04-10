import util from '../util.js';

let page = 1;
let modalGoodsPage = 1;
let goodsSelectionPage = 1;

let createPromotionGoodsRow = (item) => {
	let title = document.createElement('th');
	title.appendChild(document.createTextNode(item['title']));

	let price = document.createElement('th');
	price.appendChild(document.createTextNode('₴ ' + item['price']));

	let priceWithDiscount = document.createElement('th');
	priceWithDiscount.appendChild(document.createTextNode('₴ ' + item['discount_price']));

	let btnDelete = document.createElement('button');
	btnDelete.className = 'btn btn-danger';
	btnDelete.type = 'button';
	btnDelete.appendChild(document.createTextNode('Remove'));

	let tr = document.createElement('tr');

	btnDelete.addEventListener('click', function removeFromPromotionFromGoods() {
		util.sendAjax({
			method: 'PUT',
			url: '/api/promotion/goods',
			params: {
				goods_code: item['code']
			},
			success: () => {
				btnDelete.removeEventListener('click', removeFromPromotionFromGoods);
				tr.parentNode.removeChild(tr);
			},
			error: (data) => {
				alert(data);
			}
		});
	});

	let btnDeleteTh = document.createElement('th');
	btnDeleteTh.appendChild(btnDelete);

	tr.appendChild(title);
	tr.appendChild(price);
	tr.appendChild(priceWithDiscount);
	tr.appendChild(btnDeleteTh);

	return tr;
};

function refreshPromotionGoods(data, item, root) {
	let pmt = document.getElementById('promotion-modal-title');
	pmt.innerText = '-' + item['percentage'] + '% | ' + item['comment'];
	util.refreshData(
		data,
		document.getElementById('promotion-goods-tbody'),
		createPromotionGoodsRow,
		modalGoodsPage,
		document.getElementById('show-more-promotion-goods-btn'),
		root,
		refreshPromotionGoods,
		'goods'
	);
}

let createTableBase = (appendBtn = false, data, item, root) => {
	let title = document.createElement('th');
	title.appendChild(document.createTextNode('Title'));

	let price = document.createElement('th');
	price.appendChild(document.createTextNode('Price'));

	let priceWithDiscount = document.createElement('th');
	priceWithDiscount.appendChild(document.createTextNode('Price with discount'));

	let manage = document.createElement('th');
	manage.appendChild(document.createTextNode('Manage'));

	let tr = document.createElement('tr');
	tr.appendChild(title);
	tr.appendChild(price);
	tr.appendChild(priceWithDiscount);
	tr.appendChild(manage);

	let thead = document.createElement('thead');
	thead.className = 'thead-dark';
	thead.appendChild(tr);

	let tbody = document.createElement('tbody');
	tbody.id = 'promotion-goods-tbody';

	let table = document.createElement('table');
	table.className = 'table';
	table.appendChild(thead);
	table.appendChild(tbody);

	let result = table;
	if (appendBtn) {
		let moreBtn = document.createElement('button');
		moreBtn.appendChild(document.createTextNode('Load more...'));
		moreBtn.className = 'btn btn-secondary';
		moreBtn.id = 'show-more-promotion-goods-btn';
		moreBtn.addEventListener('click', function () {
			util.sendAjax({
				method: 'GET',
				url: '/api/promotion/goods',
				params: {
					promotion: item['id'],
					page: modalGoodsPage,
					limit: 5
				},
				success: (data) => {
					refreshPromotionGoods(data, item, root);
					modalGoodsPage++;
				},
				error: (data) => {
					alert(data);
				}
			});
		});

		result = document.createElement('div');
		result.appendChild(table);
		result.appendChild(moreBtn);
	}
	return result;
};

let createPromotionRow = (item) => {
	let tr = document.createElement('tr');

	let id = document.createElement('th');
	id.appendChild(document.createTextNode(item['id']));

	let percentage = document.createElement('th');
	percentage.appendChild(document.createTextNode(item['percentage'] + '%'));

	let comment = document.createElement('p');
	comment.style.textOverflow = 'word-wrap';
	comment.style.width = '100%';
	comment.appendChild(document.createTextNode(item['comment']));

	let commentTh = document.createElement('th');
	commentTh.appendChild(comment);

	let btnViewPromotionGoods = document.createElement('button');
	btnViewPromotionGoods.className = 'btn btn-success';
	btnViewPromotionGoods.type = 'button';
	btnViewPromotionGoods.appendChild(document.createTextNode('View'));
	btnViewPromotionGoods.setAttribute('data-toggle', 'modal');
	btnViewPromotionGoods.setAttribute('data-target', '#promotionModal');
	btnViewPromotionGoods.addEventListener('click', () => {
		util.sendAjax({
			method: 'GET',
			url: '/api/promotion/goods',
			params: {
				promotion: item['id'],
				page: 1,
				limit: 5
			},
			success: (data) => {
				modalGoodsPage = 1;
				let root = document.getElementById('promotion-goods-modal-body');
				root.innerHTML = '';
				root.appendChild(createTableBase(data['goods'].length > 0, data, item, root));
				refreshPromotionGoods(data, item, root);
				modalGoodsPage++;
			},
			error: (data) => {
				alert(data);
			}
		});
	});
	let btnViewPromotionGoodsTh = document.createElement('th');
	btnViewPromotionGoodsTh.appendChild(btnViewPromotionGoods);

	let btnEdit = document.createElement('a');
	btnEdit.className = 'dropdown-item';
	btnEdit.style.cursor = 'pointer';
	btnEdit.href = '/administration/promotions/' + item.id + '/edit';
	btnEdit.appendChild(document.createTextNode('Edit'));

	let btnDeletePromotion = document.createElement('button');
	btnDeletePromotion.className = 'dropdown-item';
	btnDeletePromotion.type = 'button';
	btnDeletePromotion.appendChild(document.createTextNode('Delete'));
	btnDeletePromotion.addEventListener('click', function deletePromotionEvent(event) {
		util.sendAjax({
			method: 'DELETE',
			url: '/api/promotions',
			params: {
				promotion: item.id
			},
			success: () => {
				event.target.removeEventListener('click', deletePromotionEvent);
				tr.parentNode.removeChild(tr);
			},
			error: (err) => {
				alert(err);
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
	div.appendChild(btnDeletePromotion);

	let manageBtnGroup = document.createElement('div');
	manageBtnGroup.className = 'btn-group';
	manageBtnGroup.appendChild(btnToggle);
	manageBtnGroup.appendChild(div);

	let manage = document.createElement('th');
	manage.appendChild(manageBtnGroup);

	tr.appendChild(id);
	tr.appendChild(percentage);
	tr.appendChild(commentTh);
	tr.appendChild(btnViewPromotionGoodsTh);
	tr.appendChild(manage);

	return tr;
};

let loadGoodsSelection = (selection) => {
	util.sendAjax({
		method: 'GET',
		url: '/api/goods',
		params: {
			page: goodsSelectionPage,
			limit: 10,
			withoutPromotions: true
		},
		success: (data) => {
			if (data.goods.length > 0) {
				for (let i = 0; i < data.goods.length; i++) {
					let option = document.createElement('option');
					option.value = data.goods[i].code;
					option.appendChild(document.createTextNode(data.goods[i].title));
					selection.appendChild(option);
				}
			}
			let btn = document.getElementById('select-goods-load-more-btn');
			if (data.pages < goodsSelectionPage) {
				if (btn) {
					btn.removeEventListener('click', loadGoodsSelectionEvent);
					btn.parentNode.removeChild(btn);
				}
			} else {
				if (!btn) {
					let button = document.createElement('button');
					button.setAttribute('type', 'button');
					button.className = 'btn btn-secondary';
					button.id = 'select-goods-load-more-btn';
					button.appendChild(document.createTextNode('Load more'));
					button.addEventListener(
						'click', loadGoodsSelectionEvent
					);
					document.getElementById('select-goods-form-group').appendChild(button);
				}
			}
		},
		error: (data) => {
			alert(data);
		}
	});
};

let loadGoodsSelectionEvent = () => {
	loadGoodsSelection(document.getElementById('select-goods'));
	goodsSelectionPage++;
};

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let showMorePromotionsTab = document.getElementById('show-more-promotions-tab');
	showMorePromotionsTab.addEventListener('click', function showMorePromotionsListener() {
		util.loadPage(
			'api/promotions',
			10,
			page,
			document.getElementById('available-promotions-tbody'),
			createPromotionRow,
			this,
			document.getElementById('available-promotions'),
			showMorePromotionsListener,
			'promotions'
		);
		page++;
	});
	showMorePromotionsTab.click();

	let reloadGoodsBtn = document.getElementById('select-goods-reload-btn');
	reloadGoodsBtn.addEventListener('click', () => {
		goodsSelectionPage = 1;
		let selection = document.getElementById('select-goods');
		selection.innerHTML = '';
		loadGoodsSelection(selection);
		goodsSelectionPage++;
	});
	reloadGoodsBtn.click();

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
