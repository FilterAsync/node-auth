(async function($) {
	"use strict";
	const email = $("#credential"),
	password = $("#password"),
	submitBtn = $("button[type='submit']"),
	remMe = $("#rem-me");
	const remMeData = document.getCookie("rem-me");

	if (remMeData) {
		const request = new Request(
			"/remember-me/load?requestToken=" + remMeData, {
			method: "POST",
			headers: new Headers({
				"Content-Type": "application/json",
			}),
		});
		const response = await fetch(request);
		try {
			var body = await response.json();
		} catch (err) {
			body = void 0;
		}
		if (body && body.data) {
			const { data } = body;
			email.val(data[0]);
			password.val(data[1]);
			remMe.prop("checked", true);
			submitBtn.removeDisableAttr();
		}
	}
	[email, password].forEach((field) => {
		field.on("input", function() {
			if (email.val() && password.val()) {
				submitBtn.removeDisableAttr();
				return;
			}
			submitBtn.addDisableAttr();
		});
	});
	const forms = document.querySelectorAll(".needs-validation");
	Array.prototype.slice.call(forms).forEach((form) => {
		form.addEventListener("submit", (event) => {
			[email, password,].forEach((e) => e.prop("readonly", true));
			submitBtn.addDisableAttr();
			if (!form.checkValidity()) {
				event.preventDefault();
				event.stopPropagation();
				[email, password, submitBtn,].forEach((e) =>
					e.prop("readonly", false).prop("disabled", false)
				);
			}
			form.classList.add("was-validated");
		}, false);
	});
})(window.jQuery);
