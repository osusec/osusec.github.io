---
title: "AUCTF - Who Made Me"
author: "Lyell Read"
date: 2020-04-05T00:00:00-07:00
categories: ['Writeups']
tags: ['auctf']
caption: "AUCTF logo"

draft: false
---

950 points

## Prompt

> One of the developers of this CTF worked really hard on this challenge.

> note: the answer is not the author’s name

> Author: c

## Solution:

Now for a much more real-world OSINT challenge. First, I started by doing a bit of recon. I ascertained that:

- `AU` in `AUCTF` is for Auburn University ([homeapge](https://www.auburn.edu/))
- `AUCTF` is run by members of the `AUEHC` ([Auburn University Ethical Hacking Club](https://ehc.auburn.edu/)). `AUEHC` is comprised of members:
    - President – Jordan Sosnowski: [jjs@auburn.edu](mailto:jjs@auburn.edu)
    - Vice President – DeMarcus Campbell: [dec0013@auburn.edu](mailto:dec0013@auburn.edu)
    - Treasure – Luke Gleba: [ljg0019@auburn.edu](mailto:ljg0019@auburn.edu)
    - Technical Lead – Charlie Harper: [cah0111@auburn.edu](mailto:cah0111@auburn.edu)
    - Technical Lead – Drew Batten: [akb0046@auburn.edu](akb0046@auburn.edu)
    - [Source](https://ehc.auburn.edu/about/)
- `AUCTF` Discord is run by discord users:
    - c AKA _c#9643
    - FireKing AKA Iamfireking#2686
    - JohnsonJangler AKA JohnsonJangler#0353
    - Kensocolo AKA Kensocolo#1000
    - nadrojisk AKA nadrojisk#6700
    - OG_Commando AKA The OG Commando#6632
    - vincent AKA FlaminArrowz#5042
    - 死神 (shinigami) AKA demarcus1621#6819
- `AUEHC` also has a [Github Organization](https://github.com/auehc), which the following github users are a part of:
    - Demarcus Campbell AKA demarcus1621
    - Jordan Sosnowski AKA nadrojisk
    - Vincent Chu AKA vincentchu37
- Within that organization are repos for:
    - [AUCTF-2020](https://github.com/auehc/AUCTF-2020) Which contains entirely commits by `nadrojisk`, with a pending pull request formulated by `demarcus1621`, with nothing interesting in it.
    - [Their site](https://github.com/auehc/auehc.github.io)
    - Past competitions, mostly irrelevant to this challenge.
- Reddit account has posted three things, none of which are of use here: [https://www.reddit.com/user/auehc/](https://www.reddit.com/user/auehc/)
- CTFTime Team `AUEHC` only has one player, `nadrojisk`. [https://ctftime.org/team/82180](https://ctftime.org/team/82180)

With that in mind, I went about composing this table:

| Name              | Discord                                | Github                          | Gitlab                                 | Twitter                       | Notes                                                                                                                                     |
|-------------------|----------------------------------------|---------------------------------|----------------------------------------|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|
| Jordan Sosnowski  | nadrojisk AKA nadrojisk#6700           | [https://github.com/nadrojisk](https://github.com/nadrojisk)    | NA                                     | [https://twitter.com/nadrojisk](https://twitter.com/nadrojisk) | All commits to the challenge repo. Prime suspect. Nothing interesting on twitter                                                          |
| Vincent Chu       | vincent AKA FlaminArrowz#5042          | [https://github.com/vincentchu37](https://github.com/vincentchu37) | [https://github.com/vincentchu37/gitlab](https://github.com/vincentchu37/gitlab) | Private                       | Has commits to the site @  [https://github.com/auehc/auehc.github.io](https://github.com/auehc/auehc.github.io) ,  [https://www.linkedin.com/in/vincentchu37/](https://www.linkedin.com/in/vincentchu37/)                          |
| Demarcus Campbell | 死神 (shinigami) AKA demarcus1621#6819 | [https://github.com/demarcus1621](https://github.com/demarcus1621) | NA                                     | Does not exist                | Has pull request to auehc/AUCTF-2020 @  [https://github.com/auehc/AUCTF-2020/pull/1](https://github.com/auehc/AUCTF-2020/pull/1) but changes only to README.md, and from private repo 🙁 |
| Abhinav V.        | Kensocolo AKA Kensocolo#1000           | NA                              | NA                                     | [https://twitter.com/kensocolo](https://twitter.com/kensocolo) | Twitter, not much found                                                                                                                   |
| Charlie Harper    | c AKA _c#9643                          | [https://github.com/chharles](https://github.com/chharles)     | NA                                     | NA                            | Pretty sure this is Charlie Harper                                                                                                        |

The flag was in a repo that was *conveniently* not pinned in Vincent Chu’s github. This was in one of the past commits in their repo `AUCTF-2020` [link](AUCTF-2020) [archive](AUCTF-2020) made by github user `chharles`, who I have retroactively added to the table above.

```
auctf{G1tHuB_4lwAY5_r3mEmB3r5_8923_1750921}
```

~Lyell Read
