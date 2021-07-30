(function ($) {
	"use strict";
	String.prototype.toCapitalize = function () {
		return this.charAt(0).toUpperCase() + this.slice(1);
	};
	document.getCookie = (cookieName) => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${cookieName}=`);
		if (parts.length === 2) {
			return parts.pop().split(";").shift();
		}
		return parts[1];
	};
	$.fn.extend({
		removeDisableAttr: function () {
			$(this).prop("disabled", false);
		},
		addDisableAttr: function () {
			$(this).prop("disabled", true);
		},
		bootstrapHide: function () {
			$(this).addClass("d-none");
		},
		bootstrapShow: function () {
			$(this).removeClass("d-none");
		},
		showInvalidValidate: function () {
			$(this).addClass("is-invalid");
		},
		hideInvalidValidate: function () {
			$(this).removeClass("is-invalid");
		},
	});
	window.redirect = (url) => {
		location.href = !url.startsWith("/") ? "/" + url : url;
	};
	navigator.cookieEnabled ||
		(function () {
			setTimeout(function () {
				console.warn("Cookies are disabled.");
				$("html").remove();
			}, 10);
		})();
})(window.jQuery);
