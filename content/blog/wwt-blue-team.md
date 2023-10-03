---
title: "WWT Blue Team CyberRange"
author: "Casey Colley"
date: 2023-10-02T17:24:37-07:00
categories: ['Club News']
tags: []
caption: "Final scoreboard of WWT Blue Team CyberRange event."

draft: true
---

Last Thursday, OSUSEC assembled a team of 4 students to compete in WWT's fantastic blue team CyberRange! We had a ton of fun and are very proud to announce that we placed 3rd among many teams from federal agencies & Fortune 500 companies! We played from 3pm to 3am the next morning, all in one shot. The crash afterwards was not pleasant but it was still worth it -- incident response takes on a wilder and much more creative tone when it's an odd hour in the morning.

One such response was when they compromised and defaced our website. We quickly realized that it was only the root path and NOT the identical `/index.php`. By checking `/var/www/html`, we could see that user `www-data` had dropped in another file `index.html`. In contrast, every other file was owned by root. We didn't have enough time to figure out how they were in our website, but for mitigation we quickly realized that root should own the entire folder, so we `chmod`ed the entire folder so that root was the only one able to modify the contents of the website. This was a creative, spur of the moment solution: containment of the threat before all else.

Overall, we had a ton of fun and we're super excited to play in WWT's next event in October -- for red teaming!

GO BEAVS!
