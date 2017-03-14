$(document).ready(function() {

	$('#uploadBtnContainer').hide();

	$('#uploadBtn').change(function() {

		var formObj = $('#uploadForm');
		var formURL = formObj.attr("action");
		var formData = new FormData(document.getElementById("uploadForm"));

		var reader = new FileReader();

		reader.addEventListener("load", function () {

			var canvas = document.createElement("canvas");
			canvas.width = 512;
			canvas.height = 512;
			document.body.appendChild(canvas);
			var ctx = canvas.getContext("2d");

			var img = new Image;
			img.onload = function(){
  				drawImageScaled(img,ctx);
  				console.log(canvas.width + ", " + canvas.height);
  				var dataURL = canvas.toDataURL('image/jpeg', 0.5);
  				var blob = dataURItoBlob(dataURL);
  				console.log($('#comment').val());
  				formData.delete("uploadBtn");
				formData.append("image", blob);
				console.log(formData);

				$.ajax({
					url: formURL,
					type: 'POST',
					data:  formData,
					mimeType:"multipart/form-data",
					contentType: false,
					cache: false,
					processData:false,
					success: function(data, textStatus, jqXHR)
					{
						$('#responseImage').attr("src",data);
					},
					error: function(jqXHR, textStatus, errorThrown) 
					{
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
   var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
   var centerShift_y = ( canvas.height - img.height*ratio ) / 2;  
   ctx.clearRect(0,0,canvas.width, canvas.height);
   ctx.drawImage(img, 0,0, img.width, img.height,
                      centerShift_x,centerShift_y,img.width*ratio, img.height*ratio);  
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