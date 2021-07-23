(function() {
	"use strict";
	const email = $("#credential"),
	password = $("#password"),
	submitBtn = $("button[type='submit']");
	try {
		var remMeData = JSON.parse(
			decodeURIComponent(document.getCookie("rem-me"))
		);
	} catch {
		remMeData = void 0;
	}
	if (remMeData) {
		email.val(remMeData?.username);
		password.val(remMeData?.password);
		submitBtn.removeDisableAttr();
		$("#rem-me").prop("checked", true);
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
			disableMultipleElements([email, password, submitBtn,]);
			if (!form.checkValidity()) {
				event.preventDefault();
				event.stopPropagation();
				enableMultipleElements([email, password, submitBtn,]);
			}
			form.classList.add("was-validated");
		}, false);
	});
})();
