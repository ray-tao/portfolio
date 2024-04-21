$(window).scroll(function () {
	if ($(this).scrollTop() > 100) {
		// css when small
		$('.logo').css('width', Math.max(100, 600 - window.scrollY));
		$('h1').css('font-size', Math.max(17, 500 - window.scrollY) + 'px');
		$('h1').css('margin', '2px');
	} else {
		// css when big
		$('.logo').css('width', '500');
		$('h1').css('font-size', '50px');
		$('h1').css('margin', '50px');
	}
});
