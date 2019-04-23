import util from "./util.js";

let page = 1;

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let fractalsRoot = document.getElementById('fractals-root');
	if (fractalsRoot != null) {
		let showMoreFractals = document.getElementById('show-more-fractals');
		showMoreFractals.addEventListener('click', function loadMoreListener() {
			loadFractals(loadMoreListener);
		});

		let loadFractals = (moreListener) => {
			util.sendAjax({
				method: 'PUT',
				url: '/api/user/fractals',
				params: {
					page: page,
					limit: 5,
				},
				success: (data) => {
					for (let i = 0; i < data['fractals'].length; i++) {
						let img = document.createElement('img');
						img.className = 'mx-auto d-block img-thumbnail';
						img.style.width = '70%';
						img.style.marginBottom = '20px';
						img.style.marginTop = '20px';
						img.setAttribute('src', data['fractals'][i].url_path);
						img.setAttribute('alt', data['fractals'][i].title);
						fractalsRoot.appendChild(img);
					}
					if (data['pages'] <= page && showMoreFractals != null) {
						showMoreFractals.removeEventListener('click', moreListener);
						showMoreFractals.parentNode.removeChild(showMoreFractals);
					}
					page++;
				},
				error: (err) => {
					alert(err.detail);
				}
			});
		};

		loadFractals();
	}
	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
