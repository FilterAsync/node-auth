(function($) {
	"use strict";
	const newPassword = $("#new-password"),
	newPasswordConfirm = $("#repeat-new-password"),
	forms = document.querySelectorAll(".needs-validation"),
	alert = $("#password-reset-alert"),
	submitBtn = $("#submit-btn");

	[newPassword, newPasswordConfirm].forEach(field => {
		field.on("input", function() {
			if ($(this).val().length > 8 &&
			(newPassword.val() === newPasswordConfirm.val())) {
				submitBtn.removeDisableAttr();
				return;
			}
			submitBtn.addDisableAttr();
		});
	});
	Array.prototype.slice.call(forms).forEach((form) => {
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			form.classList.add("was-validated");
			[newPassword,newPasswordConfirm,].forEach((e) => e.prop("readonly", true));
			submitBtn.removeDisableAttr();
			if (!form.checkValidity()) {
				[newPassword, newPasswordConfirm, submitBtn,].forEach((e) =>
					e.prop("readonly", false).prop("disabled", false)
				);
				return;
			}

			const request = new Request(location.href, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
				}),
				body: JSON.stringify({
					password: newPassword.val(),
					passwordConfirm: newPasswordConfirm.val(),
				}),
			});
			const response = await fetch(request);
			try {
				var body = await response.json();
			} catch (err) {
				body = void 0;
			}

			submitBtn.removeDisableAttr().text("Resend");
			const message = body && body.message;
			if (!response.ok) {
					[newPassword, newPasswordConfirm,].forEach((e) => e.prop("readonly", false));
					alert.attr("class", "alert alert-danger")
						.html(`
							<strong class="semi-bold">
								<span class="fas fa-exclamation-circle" aria-hidden="true"></span>
								Error!
							</strong>
							<p class="mb-0">
								${message || "Failed to reset password."}
							</p>
					`);
					throw new Error(message || "Failed to reset password.");
			}
			alert.attr("class", "alert alert-success")
				.html(`
					<strong class="semi-bold">
						<span class="fas fa-check-circle" aria-hidden="true"></span>
						Success!
					</strong>
					<p class="mb-0">
						Successfully changed password. Please wait a few moment...
					</p>
			`);
			setTimeout(function() {
				redirect("/");
			}, 500);
		});
	});
})(window.jQuery);
