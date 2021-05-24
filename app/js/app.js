var lazyLoadInstance = new LazyLoad({
	// Your custom settings go here, add class "lazy" on img for work
});

$('.owl-carousel').owlCarousel({
	loop: true,
	margin: 0,
	lazyLoad: true,
	nav: false,
	dots: false,
	items: 1,
	// responsive: {
	// 	0: {
	// 		items: 1,
	// 	},
	// 	600: {
	// 		items: 3,
	// 	},
	// 	1000: {
	// 		items: 2,
	// 	},
	// },
});
