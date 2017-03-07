$(document).ready(function() {

	$('#uploadBtnContainer').hide();

	$('#uploadBtn').change(function() {

		var formObj = $('#uploadForm');
		var formURL = formObj.attr("action");
		var formData = new FormData(document.getElementById('uploadForm'));

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

	});

	$('#comment').keyup(function() {
		if($('#comment').val()) {
			$('#uploadBtnContainer').show();
		} else {
			$('#uploadBtnContainer').hide();
		}
	});
});