$(document).ready(function() {

	$('#uploadBtnContainer').hide();
	$('#preloader').hide();
	$('#errorText').hide();

	$('#uploadBtn').change(function() {

		var formObj = $('#uploadForm');
		var formURL = formObj.attr("action");

		var reader = new FileReader();

		reader.addEventListener("load", function () {

			var canvas = document.createElement("canvas");
			canvas.width = 512;
			canvas.height = 512;
			canvas.style.backgroundColor = "white";

			var canvasContainer = document.getElementById("canvasContainer");
			while (canvasContainer.firstChild) {
    		canvasContainer.removeChild(canvasContainer.firstChild);
			}
			$('#responseImage').attr("src","");

			canvasContainer.appendChild(canvas);
			var ctx = canvas.getContext("2d");

			var img = new Image;
			img.onload = function(){
				$('#responseImage').hide();
				$('#preloader').show();

  				drawImageScaled(img,ctx);
  				
  				var dataURL = canvas.toDataURL('image/jpeg', 0.5);
  				var blob = dataURItoBlob(dataURL);

  				var callData = new FormData();
  				callData.append("comment", $("#comment").val());
				callData.append("image", blob);

				$.ajax({
					url: formURL,
					type: 'POST',
					data:  callData,
					mimeType:"multipart/form-data",
					contentType: false,
					cache: false,
					processData:false,
					success: function(data, textStatus, jqXHR)
					{
						$('#preloader').hide();
						$('#responseImage').attr("src",data);
						$('#responseImage').show();
					},
					error: function(jqXHR, textStatus, errorThrown) 
					{
						// Try again. (I know, sorry for that.)
						// FIXME: do this in a decent way.
						$.ajax({
							url: formURL,
							type: 'POST',
							data:  callData,
							mimeType:"multipart/form-data",
							contentType: false,
							cache: false,
							processData:false,
							success: function(data, textStatus, jqXHR)
							{
								$('#preloader').hide();
								$('#responseImage').attr("src",data);
								$('#responseImage').show();
							},
							error: function(jqXHR, textStatus, errorThrown) 
							{
								$('#preloader').hide();
								$('#errorText').show();
							}          
						});
					}          
				});
			};
			
			img.src = reader.result;

		  }, false);

		reader.readAsDataURL(document.getElementById('uploadBtn').files[0]);

	});

	$('#comment').keyup(function() {
		if($('#comment').val()) {
			$('#uploadBtnContainer').show();
		} else {
			$('#uploadBtnContainer').hide();
		}
	});
});

function drawImageScaled(img, ctx) {
   var canvas = ctx.canvas ;
   var hRatio = canvas.width  / img.width    ;
   var vRatio =  canvas.height / img.height  ;
   var ratio  = Math.min ( hRatio, vRatio );
   canvas.height = img.height * ratio;
   canvas.width = img.width * ratio;
   ctx.clearRect(0,0,canvas.width, canvas.height);
   ctx.drawImage(img, 0,0, img.width, img.height,
                      0,0,img.width*ratio, img.height*ratio);  
}

function dataURItoBlob(dataURI) {
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}