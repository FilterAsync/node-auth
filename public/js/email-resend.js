(function($) {
	const resendBtn = $("#resend-btn"),
	alert = $("#resend-alert");
	resendBtn.on("click", async function() {
		resendBtn.addDisableAttr();
		const params = new URL(location.search).searchParams;
		const request = new Request(
			"/email/resend?email=" + params.get("email"), {
				method: "POST",
				headers: new Headers({
					"Accept": "application/json",
				}),
			},
		);
		const response = await fetch(request),
		body = await response.json();
		if (!response.ok) {
			resendBtn.removeDisableAttr();
			alert.attr("class", "alert alert-danger")
				.html(`
				<strong class="semi-bold">
					<span class="fas fa-exclamation-circle" aria-hidden="true"></span>
					Error!
				</strong>
				<p>${body.message}</p>
			`);
			throw new Error(body.message);
		}
		alert.attr("class", "alert alert-success")
			.html(`
			<strong class="semi-bold">
				<span class="fas fa-check-circle" aria-hidden="true"></span>
				Success!
			</strong>
			<p class="mb-0">${body.message}</p>
		`);
	});
})(window.jQuery);
