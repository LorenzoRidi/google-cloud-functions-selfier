document.getElementById("uploadBtn").onchange = function () {
	document.getElementById("uploadForm").submit();
};

document.getElementById("comment").onkeyup = function () {
	if(document.getElementById("comment").value) {
		document.getElementById("uploadBtnContainer").style.visibility = 'visible'
	} else {
		document.getElementById("uploadBtnContainer").style.display = 'hidden'
	}
};