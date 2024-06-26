---
title: "EkoPartyCTF - Docs"
author: "Lyell Read"
date: 2020-09-28T00:00:00-07:00
categories: ['Writeups']
tags: ['ekoparty2020']
caption: "EkoPartyCTF logo"

draft: false
---

EkoParty CTF 2020 Git 2

# Prompt

Exact prompt has been forgotten. Linked to [this GitHub repo](https://github.com/lyellread/ctf-writeups/blob/master/2020-ekoparty/docs/ekolabs.tar.gz)

# Solution

As I mentioned in the writeup for [leak](https://github.com/lyellread/ctf-writeups/blob/master/2020-ekoparty/leak), I was in a very `github`by mindset when I started this challenge. For that reason, I solved this challenge first.

A quick inspection of the repo shows that it features an accidentally committed SSH private key and matching public key. I copied the text of these out of the commit log, and into [chall](https://github.com/lyellread/ctf-writeups/blob/master/2020-ekoparty/docs/chall) and [chall.pub](https://github.com/lyellread/ctf-writeups/blob/master/2020-ekoparty/docs/chall.pub). Now I have ssh access, however what to?

The next part of this challenge involves the git actions for the repo, in `.github/workflows/`. In there we get an `issue-bouncer.yml` and corresponding `issue-bouncer.py`. Reading through these two, we notice something useful:

```
DST_REPO: 'ekoparty2020/ekoparty-internal'
```

The python script essentially moves an issue to that `DST_REPO`, so I figured why not try to clone it?

```
eval `ssh-agent` && ssh-add chall && git clone git@github.com:ekoparty2020/ekoparty-internal.git
```

> Note: I had to modify permissions on the private key `chall` to get this to work.

This clones [the internal repo](https://github.com/lyellread/ctf-writeups/blob/master/2020-ekoparty/docs/ekoparty-internal.tar.gz), which conveniently features our flag in the root README.md

```
EKO{1ca688c86b0548d8f26675d85dd77d73c573ebb6}
```

~ Lyell Read
