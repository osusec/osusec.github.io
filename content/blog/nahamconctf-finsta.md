---
title: "NahamConCTF - Finsta"
author: "Lyell Read"
date: 2020-06-14T00:00:00-07:00
categories: ['Writeups']
tags: ['nahamconctf']
caption: "NahamConCTF banner"

draft: false
---

50 points

## Prompt

> This time we have a username. Can you track down `NahamConTron`?

## Solution

I used the `namechk` tools from the [OSINT Framework Site](https://osintframework.com/). Specifically, I used `OSINT Framework > Username > Username Search Engines > Namechk`, similarly to in AUCTF.

`namechk` tells me that there are claimed usernames for the name `NahamConTron` for many sites, including Instagram.

![Screenshot of website namechk for username NahamConTron](/static/blog/nahamconctf-finsta-namechk.jpg)

Checking out [the Instagram account](https://www.instagram.com/NahamConTron/), we get the flag.

```
flag{i_feel_like_that_was_too_easy}
```

~ Lyell
