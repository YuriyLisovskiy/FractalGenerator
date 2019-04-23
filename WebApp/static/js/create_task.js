document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let maxIterationsInput = document.getElementById('max-iterations');
	document.getElementById('type-selection').addEventListener("change", function(e) {

		console.log(e.target.value, typeof parseInt(e.target.value));

		switch (parseInt(e.target.value)) {
			case 1:
				maxIterationsInput.removeAttribute('disabled');
				break;
			case 2:
				maxIterationsInput.setAttribute('disabled', 'true');
				break;
			default:
				break;
		}
	});
	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
