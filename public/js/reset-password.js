(function($) {
	"use strict";
	const submitBtn = $("#submit-btn"),
	alert = $("#reset-password-alert"),
	email = $("#email");
	email.on("input", function() {
		const regex = new RegExp($(this).attr("pattern"), "g");
		if (!regex.test($(this).val())) {
			$(this).showValidate();
			submitBtn.addDisableAttr();
			return;
		}
		submitBtn.removeDisableAttr();
		$(this).hideValidate();
	});
	const forms = document.querySelectorAll(".needs-validation");
	Array.prototype.slice.call(forms).forEach((form) => {
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			submitBtn.addDisableAttr();
			const request = new Request("/reset-password", {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					"Accept": "application/json",
				}),
				body: JSON.stringify({
					email: email.val(),
				}),
			});
			const response = await fetch(request);
			const body = await response.json();
			submitBtn.removeDisableAttr();
			if (!response.ok) {
				alert.attr("class", "alert alert-danger")
					.html(`
					<strong class="semi-bold">
						<span class="fas fa-exclamation-circle" aria-hidden="true"></span>
						Error!
					</strong>
					<p>
						Sorry we cannot send an email to ${email.val()}.
					</p>
				`);
				throw new Error(body.message || "Failed to reset password.");
			}
			alert.attr("class", "alert alert-success")
				.html(`
				<strong class="semi-bold">
					<span class="fas fa-check-circle" aria-hidden="true"></span>
					Success!
				</strong>
				<p>
					We've sent an email to <strong class="semi-bold">${email.val()}</strong>.
				</p>
			`);
			submitBtn.text("Resend");
		});
	});
})(window.jQuery);
