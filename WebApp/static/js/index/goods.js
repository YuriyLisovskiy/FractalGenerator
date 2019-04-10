import util from '../util.js'

let goodsPage = 1;

let createGoodsItem = (item) => {
	let img = document.createElement('img');
	img.style.objectFit = 'contain';
	if (item.image) {
		img.src = item.image;
	} else {
		img.src = 'https://vignette.wikia.nocookie.net/cartoonsserbia/images/4/42/Image-not-available_1.jpg/revision/latest?cb=20180603222946';
	}
	img.alt = 'Goods image';
	img.style.height = '100%';
	img.style.width = '100%';

	let imgDiv = document.createElement('div');
	imgDiv.className = 'card-img-top';
	imgDiv.style.verticalAlign = 'top';
	imgDiv.style.textAlign = 'center';
	imgDiv.style.overflowX = 'hidden';

	imgDiv.style.height = '310px';
	imgDiv.appendChild(img);

	let cardTitle = document.createElement('h4');
	cardTitle.className = 'card-title';
	cardTitle.appendChild(document.createTextNode(item['title']));

	let description = document.createElement('p');
	description.className = 'text-truncate';
	description.style.width = '80%';
	description.appendChild(document.createTextNode(item['description']));

	let cardText = document.createElement('div');
	cardText.className = 'card-text';
	if (item['description'].length > 26) {
		let popover = document.createElement('button');
		popover.className = 'btn btn-secondary';
		popover.setAttribute('data-toggle', 'popover');
		popover.setAttribute('data-placement', 'top');
		popover.setAttribute('data-trigger', 'focus');
		popover.setAttribute('data-content', item['description']);
		popover.style.float = 'right';
		popover.style.height = '25px';
		popover.style.padding = '5px';
		popover.style.paddingTop = '0';
		popover.style.paddingBottom = '7px';
		popover.appendChild(document.createTextNode('more'));
		cardText.appendChild(popover);
	}
	cardText.appendChild(description);

	let price = document.createElement('span');
	price.className = 'badge badge-pill badge-danger';
	price.style.float = 'left';
	if (!item.discount_price) {
		price.style.backgroundColor = '#517c1b';
	} else {
		price.style.textDecoration = 'line-through';
	}
	price.appendChild(document.createTextNode('₴ ' + item['price']));

	let discount_price = document.createElement('span');
	if (item.discount_price) {
		discount_price.className = 'badge badge-pill badge-danger';
		discount_price.style.float = 'left';
		discount_price.style.marginLeft = '10px';
		discount_price.style.backgroundColor = '#517c1b';
		discount_price.appendChild(document.createTextNode('₴ ' + item.discount_price));
	}

	let btn = document.createElement('button');
	btn.className = 'btn btn-success';
	btn.style.float = 'right';
	let addBtnContent = (target, title, icon_name) => {
		target.innerHTML = '';
		let icon = document.createElement('i');
		icon.className = 'fa ' + icon_name;
		target.appendChild(icon);
		target.appendChild(document.createTextNode(' ' + title));
	};

	if (item['is_in_cart']) {
		btn.setAttribute('value', 'true');
		addBtnContent(btn, 'Remove', 'fa-times');
	} else {
		btn.setAttribute('value', 'false');
		addBtnContent(btn, 'Add', 'fa-cart-plus');
	}

	btn.addEventListener('click', function() {
		let cartBadge = document.getElementById('btn-cart-badge');
		if (this.value === 'false') {
			util.sendAjax({
				method: 'POST',
				url: '/api/cart/goods/add',
				params: {
					goods_code: item['code'],
					amount: 1
				},
				success: () => {
					this.value = 'true';
					addBtnContent(this, 'Remove', 'fa-times');
					cartBadge.innerText = parseInt(cartBadge.innerText) + 1;
				},
				error: (err) => {
					console.log(err.status);
					if (err.status === 403) {
						document.getElementById('btn-open-login').click();
					} else {
						alert(err.detail);
					}
				}
			});
		} else {
			util.sendAjax({
				method: 'POST',
				url: '/api/cart/goods/remove',
				params: {
					goods_code: item['code'],
					amount: 1
				},
				success: () => {
					this.value = 'false';
					addBtnContent(this, 'Add', 'fa-cart-plus');
					cartBadge.innerText = parseInt(cartBadge.innerText) - 1;
				},
				error: (err) => {
					if (err.status === 403) {
						document.getElementById('btn-open-login').click();
					} else {
						alert(err.detail.detail);
					}
				}
			});
		}
	});

	let cardBody = document.createElement('div');
	cardBody.className = 'card-body';
	cardBody.appendChild(cardTitle);
	cardBody.appendChild(cardText);
	cardBody.appendChild(price);
	if (item.discount_price) {
		cardBody.appendChild(discount_price);
	}
	cardBody.appendChild(btn);

	let card = document.createElement('div');
	card.className = 'card ml-5 mb-5';
	card.style.width = '300px';
	card.style.height = 'auto';
	card.appendChild(imgDiv);
	card.appendChild(cardBody);

	return card;
};

let refreshGoods = (data, container, createFunction, currPage, moreBtn, root, listener, dataName) => {
	if (data[dataName].length > 0) {
		let row = document.createElement('div');
		row.className = 'row';
		for (let i = 0; i < data[dataName].length; i++) {
			row.appendChild(createFunction(data[dataName][i]));
		}
		root.appendChild(row);
	} else {
		util.appendNoDataMessage(root, 'No ' + dataName);
	}
	if (parseInt(data['pages']) <= currPage && moreBtn != null) {
		moreBtn.removeEventListener('click', listener);
		moreBtn.parentNode.removeChild(moreBtn);
	}
};

let loadMore = (moreBtn, moreBtnListener, container) => {
	let sortBySelection = document.getElementById('sort-by');
	util.sendAjax({
		method: 'GET',
		url: '/api/goods',
		params: {
			page: goodsPage,
			limit: 9,
			sort_by: sortBySelection.value
		},
		success: (data) => {
			refreshGoods(
				data,
				null,
				createGoodsItem,
				goodsPage, moreBtn,
				container,
				moreBtnListener,
				'goods'
			);
			goodsPage++;
			for (let i = 0; i < sortBySelection.children.length; i++) {
				if (sortBySelection.children[i].value === data.sort_by) {
					sortBySelection.children[i].setAttribute('selected', 'selected');
					break;
				}
			}
		},
		error: (data) => {
			alert(data.detail.detail);
		}
	});
};

let createMoreBtn = (containerInner) => {
	let moreBtn = document.createElement('button');
	moreBtn.className = 'btn btn-secondary';
	moreBtn.appendChild(document.createTextNode('Load more'));
	moreBtn.addEventListener('click', function moreBtnListener() {
		loadMore(this, moreBtnListener, containerInner);
	});
	return moreBtn;
};

document.addEventListener('DOMContentLoaded', function onLoadedEvent() {
	let containerInner = document.getElementById('inner-container');

	let moreBtn = createMoreBtn(containerInner);
	moreBtn.click();

	let container = document.getElementById('container');
	container.appendChild(moreBtn);

	document.getElementById('sort-by').addEventListener('change', () => {
		goodsPage = 1;
		containerInner.innerHTML = '';
		if (!container.contains(moreBtn)) {
			moreBtn = createMoreBtn(containerInner);
			container.appendChild(moreBtn);
		}
		loadMore(moreBtn, null, containerInner);
	});
	document.removeEventListener('DOMContentLoaded', onLoadedEvent);
});
