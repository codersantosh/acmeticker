# AcmeTicker - News Ticker 

A very lightweight jQuery plugin for creating advanced news ticker.

Demo: [Gutentor News Ticker](https://www.demo.gutentor.com/news-ticker/)


## Ticker Type

 - Vertical
 - Horizontal
 - Marquee
 - Typewriter 

## Available Options

 - type :  (string)
vertical/horizontal/marquee/typewriter

 - autoplay: ( number ) 
Recommended : For vertical/horizontal 4000, For typewriter 2000, marquee doesnot take this option

 - speed: ( number )
Recommended : For vertical/horizontal 600, For typewriter 50, For marquee 0.05

 - direction: ( string )
Recommended : For vertical up/down, For horizontal/marquee right/left

 - pauseOnFocus: ( boolean )

 - pauseOnHover: ( boolean )

 - controls : Set of selectors for prev, next and toggle button
     
controls: {  
       prev: /*Can be used for vertical/horizontal/typewriter*//*not work for marquee*/  
      next: '',/*Can be used for vertical/horizontal/typewriter*//*not work for marquee*/  
      toggle: ''/*Can be used for vertical/horizontal/marquee/typewriter*/  
    }

## Code Example

        jQuery(document).ready(function ($) {  

        $('.my-news-ticker').AcmeTicker({  
            type:'horizontal',
            direction: 'right',
            controls: {  
                prev: $('.acme-news-ticker-prev'),
                toggle: $('.acme-news-ticker-pause'),
                next: $('.acme-news-ticker-next')
            }  
        });  
        })

See ***example*** folder
