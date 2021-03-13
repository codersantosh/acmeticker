(function ($) {
	'use strict';
	$.fn.AcmeTicker = function (options) {
		/*Merge options and default options*/
		let opts = $.extend({}, $.fn.AcmeTicker.defaults, options);

		/*Functions Scope*/
		let thisTicker = $(this), intervalID, timeoutID, isPause = false;

		/*Always wrap, used in many place*/
		thisTicker.wrap("<div class='acmeticker-wrap'></div>");

		/*Wrap is always relative*/
		thisTicker.parent().css({
			position: 'relative'
		})
		/*Hide expect first*/
		thisTicker.children("li").not(":first").hide();

		/*Lets init*/
		init();
		function init() {
			switch (opts.type) {
				case 'vertical':
				case 'horizontal':
					vertiZontal()
					break;

				case 'marquee':
					marQuee()
					break;

				case 'typewriter':
					typeWriter()
					break;

				default:
					break
			}
		}

		/*Vertical - horizontal
		* **Do not change code lines*/
		function vertiZontal(prevNext = false) {
			let speed = opts.speed,
				autoplay = opts.autoplay,
				direction = opts.direction;

			if (prevNext) {
				speed = 0;
				autoplay = 0;
				clearInterval(intervalID);
				intervalID = false;
			}

			function play() {
				if (isPause) {
					clearInterval(intervalID);
					intervalID = false;
					return false;
				}
				let dChild,
					eqType,
					mType,
					mVal;

				dChild = thisTicker.find('li:first');
				if (direction === 'up' || direction === 'right') {
					eqType = '-=';
				}
				else {
					eqType = '+=';
				}
				if (opts.type === 'horizontal') {
					mType = 'left';
					mVal = dChild.outerWidth(true);
				}
				else {
					mType = 'margin-top';
					mVal = dChild.outerHeight(true);
				}
				if (prevNext === 'prev') {
					thisTicker.find('li:last').detach().prependTo(thisTicker);
				}
				else {
					dChild.detach().appendTo(thisTicker);
				}

				thisTicker.find('li').css({
					opacity: '0',
					display: 'none'
				});
				thisTicker.find('li:first').css({
					opacity: '1',
					position: 'absolute',
					display: 'block',
					[mType]: eqType + mVal + 'px',
				});
				thisTicker.find('li:first').animate(
					{ [mType]: '0px' },
					speed,
					function () {
						clearInterval(intervalID);
						intervalID = false;
						vertiZontal();
					});
			}
			if (intervalID) {
				return false
			}
			intervalID = setInterval(play, autoplay);
		}

		/*Type-Writer
		* **Do not change code lines*/
		function typeWriter(prevNext = false) {
			if (isPause) {
				return false;
			}
			if (prevNext) {
				clearInterval(intervalID);
				intervalID = false;

				clearTimeout(timeoutID);
				timeoutID = false;

				if (prevNext === 'prev') {
					thisTicker.find('li:last').detach().prependTo(thisTicker);
				}
				else {
					thisTicker.find('li:first').detach().appendTo(thisTicker);
				}
			}

			let speed = opts.speed,
				autoplay = opts.autoplay,
				typeEl = thisTicker.find('li:first'),
				wrapEl = typeEl.children(),
				count = 0;

			if (typeEl.attr('data-text')) {
				wrapEl.text(typeEl.attr('data-text'))
			}

			let allText = typeEl.text();

			thisTicker.find('li').css({
				opacity: '0',
				display: 'none'
			});

			function tNext() {
				thisTicker.find('li:first').detach().appendTo(thisTicker);

				clearTimeout(timeoutID);
				timeoutID = false;

				typeWriter();
			}

			function type() {
				count++;
				let typeText = allText.substring(0, count);
				if (!typeEl.attr('data-text')) {
					typeEl.attr('data-text', allText);
				}

				if (count <= allText.length) {
					wrapEl.text(typeText);
					typeEl.css({
						opacity: '1',
						display: 'block',
					});
				}
				else {
					clearInterval(intervalID);
					intervalID = false;
					timeoutID = setTimeout(tNext, autoplay);
				}
			}
			if (!intervalID) {
				intervalID = setInterval(type, speed);
			}
		}

		/*marQuee
		* **Do not change code lines*/
		function marQuee() {
			/*Marquee Special*/
			let speed = opts.speed,
				direction = opts.direction,
				wrapWidth,
				dir = 'left',
				totalTravel,
				defTiming,
				listWidth = 0,
				mPause = false;

			mInit();
			function mInit() {
				thisTicker.css({
					position: 'absolute'
				})
				thisTicker.find('li').css({
					display: 'inline-block',
					marginRight: '10px',
				});
				let tickerList = thisTicker.find("li");
				wrapWidth = thisTicker.parent().outerWidth(true);

				if (direction === 'right') {
					dir = 'right'
				}

				/*Calculating ticker width*/
				thisTicker.width(10000);/*temporary width to prevent inline elements wrapping to initial width of ticker*/
				tickerList.each(function () {
					listWidth += $(this).outerWidth(true) + 5;/*+5 for some missing px*/
				});
				thisTicker.width(listWidth);

				totalTravel = listWidth + wrapWidth;
				defTiming = totalTravel / speed;

				marQueeIt(listWidth, listWidth / speed);
			}

			function marQueeIt(lPos, lSpeed) {
				thisTicker.animate(
					{ [dir]: '-=' + lPos },
					lSpeed,
					"linear",
					function () {
						thisTicker.css({
							[dir]: wrapWidth
						});
						marQueeIt(totalTravel, defTiming);
					}
				);
			}

			function mRestart() {
				let offset = thisTicker.offset(),
					rOffset = direction === 'right' ? (listWidth - offset.left) : offset.left,
					remainingSpace = rOffset + listWidth,
					remainingTime = remainingSpace / speed;

				marQueeIt(remainingSpace, remainingTime);
			}
			function mToggle() {
				console.log('mToggle')

				mPause = !mPause;
				$(document).trigger('acmeTickerToggle', thisTicker, mPause)
				if (mPause) {
					thisTicker.stop();
				}
				else {
					mRestart();
				}
			}

			opts.controls.toggle && opts.controls.toggle.on('click', function (e) {
				mToggle();
			});
			if (opts.pauseOnHover) {
				thisTicker.on('mouseenter', function () {
					thisTicker.stop();
				}).on('mouseleave', function () {
					mRestart();
				});
			}
			if (opts.pauseOnFocus) {
				thisTicker.on('focusin', function () {
					thisTicker.stop();
				}).on('focusout', function () {
					mRestart();
				});
			}
		}
		/*marQuee End*/

		/*Actions/Controls*/
		if (opts.type !== 'marquee') {
			opts.controls.prev && opts.controls.prev.on('click', function (e) {
				e.preventDefault();
				switch (opts.type) {
					case 'typewriter':
						typeWriter('prev')
						break;

					default:
						vertiZontal('prev')
						break
				}
			});
			opts.controls.next && opts.controls.next.on('click', function (e) {
				e.preventDefault();
				switch (opts.type) {
					case 'typewriter':
						typeWriter('next')
						break;

					default:
						vertiZontal('next')
						break
				}
			});
			function restart() {
				if (!isPause) {
					init();
				}
			}
			opts.controls.toggle && opts.controls.toggle.on('click', function (e) {
				e.preventDefault();
				isPause = !isPause;
				$(document).trigger('acmeTickerToggle', thisTicker, isPause)
				restart();
			});
			if (opts.pauseOnHover) {
				thisTicker.on('mouseenter', function () {
					isPause = true;
					restart();
				}).on('mouseleave', function () {
					isPause = false;
					restart();
				});
			}
			if (opts.pauseOnFocus) {
				thisTicker.on('focusin', function () {
					isPause = true;
					restart();
				}).on('focusout', function () {
					isPause = false;
					restart();
				});
			}
		}
	};

	// plugin defaults - added as a property on our plugin function
	$.fn.AcmeTicker.defaults = {
		/*Note: Marquee only take speed not autoplay*/
		type: 'horizontal',/*vertical/horizontal/marquee/typewriter*/
		autoplay: 2000,/*true/false/number*/ /*For vertical/horizontal 4000*//*For typewriter 2000*/
		speed: 50,/*true/false/number*/ /*For vertical/horizontal 600*//*For marquee 0.05*//*For typewriter 50*/
		direction: 'up',/*up/down/left/right*//*For vertical up/down*//*For horizontal/marquee right/left*//*For typewriter direction doesnot work*/
		pauseOnFocus: true,
		pauseOnHover: true,
		controls: {
			prev: '',/*Can be used for vertical/horizontal/typewriter*//*not work for marquee*/
			next: '',/*Can be used for vertical/horizontal/typewriter*//*not work for marquee*/
			toggle: ''/*Can be used for vertical/horizontal/marquee/typewriter*/
		}
	};
})(jQuery);