(function() {
	"use strict";

	const username = $("#username"),
	email = $("#email"),
	password = $("#password"),
	alert = $("#register-alert"),
	submitBtn = $("form > button[type='submit']");
	[username, email, password].forEach((field) => {
		field.on("input", function() {
			if (username.val() && email.val() && password.val()) {
				submitBtn.removeDisableAttr();
				return;
			}
			submitBtn.addDisableAttr();
		});
	});
	[username, email].forEach((field) => {
		field.on("change", async function() {
			const name = $(this).prop("name"),
			value = $(this).val(),
			invalidFeedback = $("#" + name + "-invalid-feedback"),
			hint = $("#" + name + "-hint"),
			request = new Request(
				`/available?field=${encodeURIComponent(name)}&value=${
					encodeURIComponent(value)
				}`, {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					"Accept": "application/json",
				}),
			});
			const response = await fetch(request);
			const body = await response.json();
			if (body.wasTaken) {
				hint.bootstrapHide();
				invalidFeedback.html(`
					${name[0].toUpperCase() + name.slice(1)} was taken. If it is yours, please <a href="/login">Login</a>.
				`);
				hint.bootstrapHide();
				field.showValidate();

				throw new Error("Credentials was taken.");
			}
			hint.bootstrapShow();
			field.hideValidate();
			invalidFeedback.html(`
				${name === "username"
					? "Username only contains alphabetic characters (a-z, A-Z), numeric characters (0-9), include an underscore(_), and can be from 3 characters to 20 characters."
					: "Email does not match, please follow this pattern: <em>name@example.domain</em>."}
			`);
		});
	});
	const forms = document.querySelectorAll(".needs-validation");
	Array.prototype.slice.call(forms).forEach((form) => {
		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			event.stopPropagation();
			disableMultipleElements([
				username,
				email,
				password,
				submitBtn,
			]);

			form.classList.add("was-validated");
			if (!form.checkValidity()) {
				enableMultipleElements([
					username,
					email,
					password,
					submitBtn,
				]);
				["username", "email", "password"]
				.forEach((field) => {
					$("#" + field + "-hint").bootstrapHide();
				});
				return;
			}
			const request = new Request("/register", {
				method: "POST",
				headers: new Headers({
					"Content-Type": "application/json",
					"Accept": "application/json",
				}),
				body: JSON.stringify({
					username: username.val(),
					email: email.val(),
					password: password.val(),
				}),
			});
			const response = await fetch(request);
			try {
				var body = await response.json();
			} catch {
				body = void 0;
			}
			if (!response.ok) {
				enableMultipleElements([
					username,
					email,
					password,
					submitBtn,
				]);
				const message = body?.message || "Failed to register.";
				submitBtn.removeDisableAttr();
				alert.attr("class", "alert alert-danger")
					.html(`
						<strong class="semi-bold">
							<span class="fas fa-exclamation-circle" aria-hidden="true"></span>
							Error!
						</strong>
						<p>${message}</p>
				`);
				throw new Error(message);
			}
			username.off("input").off("change");
			email.off("input").off("change");
			password.off("input");

			redirect(body.link);
		});
	});
})();
