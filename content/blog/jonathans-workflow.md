---
title: "How I Approach pwn Challenges"
author: "Jonathan Keller"
date: 2024-01-24T22:25:26-07:00
categories: ['Writeups']
tags: []
caption: ""

draft: false
---

*The below write-up was posted in our internal CTF League discord server. Replicated here for posterity.*

Generally, my process for a pwn challenge is:

## 1. Recon

- Figure out what kind of program you're dealing with -- run `file` to see what kind of binary it is, maybe [`checksec`](https://github.com/slimm609/checksec.sh) to see what kind of security measures it has, figure out how to get it to run on your system
- Run the program a few times as a user, just so you can be familiar with what it does. It's much easier to reverse engineer code when you have some idea of what it's trying to accomplish.
  - You can also try giving it weird/invalid input -- ridiculously long strings, invalid/out-of-bounds/misformatted values, etc. -- just to see how it behaves. If you get unexpected behavior -- and *especially* a crash -- take note. You're looking for bugs, and you just found one.
  - One time Andrew (former OSUSECer and legendary ctf god) got a flag by entering `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` into a challenge
- open up the program in my decompiler of choice, run auto analysis

## 2. Revving

- Start reverse-engineering the code. `main` is often a good place to start. Try to figure out what it does. As you identify the purpose of functions/variables/blocks of code, give them names and comments. When you see things that look like structs (functions accessing a lot of `*(somePointer + 4)` etc), create struct types.
- You WILL get stuck often when reverse-engineering, because you are constantly missing the forest for the trees -- the disassembler/decompiler gives you very low-level steps of the program, and turning that into a high level "what does this code do" is hard. If you're making progress revving a piece of code, stick with it & related functions -- the notes and names you make there will shed light on the rest of the program. But once you start spinning your wheels and not making progress, here's some tips:
  - Take a break from the function you're stuck on, start working on a different part of the program and come back later. That way, you can see the program's data structures and variables from different angles, giving you a more complete picture of how they're created and used.
    - Sometimes, I'll switch back and forth between working "forwards" along the call graph from `main` to the leaf functions, and "backwards" from the leaf functions to `main`. Higher-level functions are more useful for understanding the overall structure of the program; leaf functions are useful for understanding smaller components in more detail.
  - Use your intuition to fill in the code. Think about what the program needs to do to fulfill its design requirements, and think about how you would write that code (like, "I'd write a loop over the pokemon in my array, searching for the one with the highest HP value"). Then, look for code that matches that structure within the binary (is there a loop that iterates over an array of some objects and compares some field over them?)
  - If you're not sure what something does, take a guess. If you're not sure what a piece of code does but you can take a plausible guess given the context, name it what you think it might be, then read the rest of the code and see if it makes sense -- you can always change the name later.
    - If you have no idea what something does, give it the best name you can anyway. A stupid name like `maybe_allocate_some_buffer_or_something` is infinitely more helpful than `sub_1234`.
  - If a variable doesn't make sense, try running the program in a debugger and watching its values.
  - If you see a huge chunk of hundreds of lines of terrifying bitwise operators and weird loops and pointer arithmetic, it's probably `memcpy`.
    - More generally speaking, understand the signatures and implementations of common functions/library code.
    - Sometimes, binaries have bits of open-source libraries compiled into them. If you see any distinctive-looking strings or function names, try Googling them to see if they're part of any publicly available code.
  - If a bit of decompiled code looks weird to you, the assembly might be easier to read.
  - Decompilers aren't always right about the type and number of function parameters. Understand the calling conventions of your architecture, and look at the assembly if something looks odd.
      - If you see a value getting moved into an argument register right before calling a function, it's probably an argument even if your decompiler doesn't think so.
      - If the decompiler thinks an argument is getting passed into a function, but that argument is never used, maybe it's actually just a leftover register value.
  - Some things aren't worth your time to reverse-engineer -- if the code looks like boilerplate, compiler-generated, or part of library/system code, no need to waste time revving it.    You don't need to rev the whole program -- just don't skip the part with the bug!

## 3. Vuln Hunting

- Once you've reverse-engineered to the point that you have a good understanding of the internals of the program, look for the bug!
  - Pwn challenges are usually memory-corruption-based, so look for memory bugs (buffer overflow, use-after-free, etc.)
  - Get the program to crash somehow, don't worry about the precise inputs as long as you find something that crashes and you understand why
  - Automate a testcase for the crash in [pwntools](https://github.com/Gallopsled/pwntools/). From now on, you'll be interacting with the program pretty much exclusively through pwntools and GDB. Automating the necessary inputs will save you a LOT of time.
    - My pwntools template looks like this, feel free to steal or adapt:

```python
#!/usr/bin/env python3

from pwn import *

{bindings}

context.binary = {bin_name}
debug_script='''
decompiler connect binja
'''

def conn():
    if args.REMOTE:
        p = remote("addr", 1337)
    elif args.D:
        p = gdb.debug([{bin_name}.path], gdbscript=debug_script, env=[('SHELL', '/bin/bash')])
    else:
        p = process([{bin_name}.path])

    return p

def main():
    p = conn()
    
    # tick 197 certified

    p.interactive()


if __name__ == "__main__":
    main()
```

## 4. Exploit Development

  - Look at the crash in gdb, make sure you understand how it's crashing.
    - You can use a GDB script to automatically run the program/set useful breakpoints/print out useful things every time you run your exploit script.
    - Think about how you can control the crash. What can you overwrite? If you can control a return address or function pointer, great! If not, you either need to use the control you have to corrupt the program even further, or you need to find a way to get the flag without arbitrary code execution.
  - Figure out a proof-of-concept of what memory addresses you need to overwrite, and what you can put in your input to control those addresses. Put distinctive values in your script like 0xAAAAAAAA or "ZZZZZZZZ" or something so you can see them show up in memory.
  - Figure out how to defeat any security measures.
    - W^X: use onegadget or ROP techniques instead of shellcoding
    - ASLR: either find a way to get the program to leak a memory address, or find a way to corrupt part of a pointer or an offset/index instead of a whole pointer
      - The fact that modern CPUs are little-endian can help -- if you can get a buffer overflow to stop midway through a pointer, you can control that to overwrite just the low bytes)
      - If you have the ability to leak one or two pointers per execution, but not enough at one time for full arbitrary code execution, you can overwrite the return address of a function to jump back to `main` -- effectively re-running the program with the same ASLR seed 
    - Stack canaries: you must either corrupt data before the canary, find a way to "jump over" the canary, or somehow get the value of the canary and overwrite the canary with itself
  - [pwndbg](https://github.com/pwndbg/pwndbg) is your best friend in the whole wide world

Once it works locally, run it on remote and hope it works there too!
  - If not, see if you can get a clue as to why. Maybe some offsets or conditions are slightly different, and oftentimes you can use clever payloads extract the information you need
  - If there's a Docker container provided, and you didn't use it before, try running locally with the docker container.

Hope that's helpful and not too overwhelming. It's trying to be somewhere between "general mindset" and "useful tips for when you get stuck", so don't feel like you have to memorize it and digest it all at once.
