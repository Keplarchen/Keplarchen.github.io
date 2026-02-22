window.HELP_IMPROVE_VIDEOJS = false;

$(document).ready(function () {
  // Navbar burger toggle for mobile
  $(".navbar-burger").click(function () {
    $(".navbar-burger").toggleClass("is-active");
    $(".navbar-menu").toggleClass("is-active");
  });

  // Initialize carousels
  var options = {
    slidesToScroll: 1,
    slidesToShow: 3,
    loop: true,
    infinite: true,
    autoplay: false,
    autoplaySpeed: 3000,
  };

  var carousels = bulmaCarousel.attach('.carousel', options);

  for (var i = 0; i < carousels.length; i++) {
    carousels[i].on('before:show', function (state) {
      console.log(state);
    });
  }

  // Initialize sliders
  bulmaSlider.attach();
});
