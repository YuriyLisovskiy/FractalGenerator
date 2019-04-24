document.addEventListener('DOMContentLoaded', function domLoadedListener() {
	let maxIterationsInput = document.getElementById('max-iterations');
	document.getElementById('type-selection').addEventListener("change", function(e) {
		switch (parseInt(e.target.value)) {
			case 1:
				maxIterationsInput.removeAttribute('disabled');
				break;
			case 2:
				maxIterationsInput.setAttribute('disabled', 'true');
				maxIterationsInput.value = '';
				break;
			default:
				break;
		}
	});
	document.removeEventListener('DOMContentLoaded', domLoadedListener);
});
