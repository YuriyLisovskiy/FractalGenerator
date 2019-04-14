import util from "./util.js";

let page = 1;
let imageNumber = 1;
let threshold = -1;

document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let nextBtn = document.getElementById('slide-next');
	let carouselRoot = document.getElementById('carousel-inner');

	let loadFractals = (btnNext, nextListener) => {
		util.sendAjax({
			method: 'PUT',
			url: '/api/user/fractals',
			params: {
				page: page,
				limit: 2,
			},
			success: (data) => {
				for (let i = 0; i < data['fractals'].length; i++) {
					let p = document.createElement('p');
					p.appendChild(document.createTextNode(data['fractals'][i].title));
					let carouselCaption = document.createElement('div');
					carouselCaption.className = 'carousel-caption';
					carouselCaption.appendChild(p);
					let img = document.createElement('img');
					img.setAttribute('src', data['fractals'][i].url_path);
					img.setAttribute('alt', data['fractals'][i].title);
					img.setAttribute('width', '500');
					img.setAttribute('height', '200');
					let carouselItem = document.createElement('div');
					carouselItem.className = 'carousel-item';
					carouselItem.appendChild(img);
					carouselItem.appendChild(carouselCaption);
					carouselRoot.appendChild(carouselItem);
				}
				if (data['fractals'].length > 0) {
					carouselRoot.childNodes[0].className += ' active';
				}
				threshold = data.threshold;
				if (threshold === -1) {
					btnNext.removeEventListener('click', nextListener);
				}
				page++;
			},
			error: (err) => {
				alert(err.detail);
			}
		});
	};
	let slideNextListener = () => {
		imageNumber++;
		if (imageNumber > threshold) {
			loadFractals(nextBtn, slideNextListener);
		}
	};
	nextBtn.addEventListener('click', slideNextListener);

	loadFractals(nextBtn, slideNextListener);

	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
