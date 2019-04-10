import util from "../util.js";

function manageGoods (url, code, amount, rmItem, success) {
	util.sendAjax({
		method: 'POST',
		url: url,
		params: {
			amount: amount,
			goods_code: code
		},
		success: (data) => {
			success();
			if (data.amount < 1) {
				rmItem();
			} else {
				let amountContainer = document.getElementById('amount-' + code);
				amountContainer.innerText = data.amount.toString();
				amountContainer.setAttribute('value', data.amount);
			}
			let tBody = document.getElementById('goods-table-body');
			if (tBody.childElementCount < 1) {
				let noGoodsMsg = document.createElement('h4');
				noGoodsMsg.className = 'text-muted no-goods-in-cart-title';
				noGoodsMsg.appendChild(document.createTextNode('No goods in cart'));

				let cart = document.getElementById('cart');
				cart.innerHTML = '';
				cart.appendChild(document.createElement('br'));
				cart.appendChild(noGoodsMsg);

				document.getElementById('btn-cart-badge').innerHTML = '0';
			}
		},
		error: (err) => {
			alert(err.detail.detail);
		}
	});
}

function resetSum (totalSumContainer, code, sign = 1) {
	let totalSum = parseFloat(totalSumContainer.getAttribute('value'));
	let itemPrice = parseFloat(document.getElementById('item-price-' + code).getAttribute('value'));
	let newSum = Number(totalSum + itemPrice * sign).toFixed(2);
	totalSumContainer.innerText = '₴ ' + (newSum).toString();
	totalSumContainer.setAttribute('value', newSum);
}

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let active_tab_profile = util.getCookie('active_tab_profile');

	let profileDiv = document.getElementById('profile');
	let profileTab = document.getElementById('profile-tab');
	let cartDiv = document.getElementById('cart');
	let cartTab = document.getElementById('cart-tab');

	let ordersDiv = document.getElementById('orders');
	let ordersTab = document.getElementById('orders-tab');
	ordersTab.addEventListener('click', () => {
		util.setCookie('active_tab_profile', 'orders', 1);
	});

	if (active_tab_profile && active_tab_profile === 'cart') {
		profileDiv.className += ' fade';
		ordersDiv.className += ' fade';
		cartDiv.className += ' active show';
		cartTab.className += ' active show';
	} else if (active_tab_profile && active_tab_profile === 'profile') {
		profileDiv.className += ' active show';
		profileTab.className += ' active show';
		cartDiv.className += ' fade';
		ordersDiv.className += ' fade';
	} else {
		ordersDiv.className += ' active show';
		ordersTab.className += ' active show';
		cartDiv.className += ' fade';
		profileDiv.className += ' fade';
	}

	let totalSumContainer = document.getElementById('total-sum');

	let increaseButtons = document.getElementsByName('increase-goods');
	for (let i = 0; i < increaseButtons.length; i++) {
		increaseButtons[i].addEventListener('click', function addGoods() {
			manageGoods('/api/cart/goods/add', this.value, 1, () => {},
				() => {
					resetSum(totalSumContainer, this.value, 1);
				}
			);
		});
	}

	let decreaseButtons = document.getElementsByName('decrease-goods');
	for (let i = 0; i < decreaseButtons.length; i++) {
		decreaseButtons[i].addEventListener('click', function decreaseGoods() {
			manageGoods('/api/cart/goods/remove', this.value, 1,
			() => {
				this.removeEventListener('click', decreaseGoods);
				let row = document.getElementById('goods-item-' + this.value);
				this.parentNode.parentNode.parentNode.removeChild(row);
			},
			() => {
				resetSum(totalSumContainer, this.value, -1);
			});
		});
	}

	let removeGoodsButtons = document.getElementsByName('remove-goods');
	for (let i = 0; i < removeGoodsButtons.length; i++) {
		removeGoodsButtons[i].addEventListener('click', function rmGoods() {
			let amount = parseInt(document.getElementById('amount-' + this.value).getAttribute('value'));

			console.log(amount);

			manageGoods('/api/cart/goods/remove', this.value, amount,
			() => {
				this.removeEventListener('click', rmGoods);
				let row = document.getElementById('goods-item-' + this.value);
				this.parentNode.parentNode.parentNode.removeChild(row);
			},
			() => {
				resetSum(totalSumContainer, this.value, -amount);
			});
		});
	}
	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
