(function ($) {
	const password = $("#password");
	let isChecked = false;

	$("#show-password-btn").on("click", function () {
		isChecked = !isChecked;
		password.attr("type", isChecked ? "text" : "password");
		$(this).text((isChecked ? "Hide" : "Reveal") + " Password");
	});
})(window.jQuery);
