---
title: "HITCON CTF 2018 EV3 Basic"
author: "Zander Work"
date: 2018-10-22T00:00:00-07:00
categories: ['Writeups']
tags: ['hitconctf2018']
caption: ""

draft: false
---

[Link to Github](https://github.com/zzzanderw/ctf-writeups/tree/master/hitcon2018/ev3basic)

![Screenshot of a CTFd challenge called EV3 Basic with a TAR archive to download.](/blog/hitcon-ctf-2018-ctfd.png)

Even though this was a pretty simple challenge, I really enjoyed it and wanted to do a write-up for it anyways.

EV3 is the latest generation of the [LEGO Mindstorms](https://www.lego.com/en-us/mindstorms) robots, and thanks to this challenge I know a lot more about the Mindstorms Communication and Firmware Developer Kits than I ever thought I would.

The challenge includes two files: A picture of the screen of the robot, and a .pklg file, which turned out to be a Bluetooth HCI Log.

![Photo of a LEGO Mindstorms EV3, displaying a screen of a challenge flag with most of the characters missing](/blog/hitcon-ctf-2018-ev3.jpg)

Based on the photo, it was pretty easy to figure out that we needed to get some data out of the Bluetooth log to identify the missing characters.

After opening the log in Wireshark and doing some display filtering, we can see a conversation between “localhost” (turned out to be a Macbook Pro) and the EV3.

![Screenshot of many lines of Bluetooth dialog in Wireshark](/blog/hitcon-ctf-2018-wireshark.png)

Looking at the data revealed a pretty simple conversation. The MacBook would send a command, and the EV3 would acknowledge it.

![Screenshot of Wireguard, showing a command sent from the laptop to the EV3](/blog/hitcon-ctf-2018-wireshark1.png)

![Screenshot of Wireguard, showing an acknowledgement sent from the EV3 to the laptop](/blog/hitcon-ctf-2018-wireshark2.png)

The responses from the EV3 were constant, so I didn’t spend time analyzing those and solely worked on data being sent by the MacBook.

Thanks to some nice Google searches, I found two developer docs from LEGO: the [Communication Developer Kit](https://le-www-live-s.legocdn.com/sc/media/files/ev3-developer-kit/lego%20mindstorms%20ev3%20communication%20developer%20kit-f691e7ad1e0c28a4cfb0835993d76ae3.pdf?la=en-us) and the [Firmware Development Kit](https://le-www-live-s.legocdn.com/sc/media/files/ev3-developer-kit/lego%20mindstorms%20ev3%20firmware%20developer%20kit-7be073548547d99f7df59ddfd57c0088.pdf?la=en-us). These documents made analyzing the data much easier.

Here is the data for one packet sent by the MacBook:

```
12 00 2a 00 00 00 00 84 05 01 81 5a 81 28 84 31 00 84 00 80
                      |  |  |  |  |  |  |  |  |  |
                      |  |  |  |  |  |  |  |  =====> string (1)
                      |  |  |  |  |  |  |  |
                      |  |  |  |  |  |  ===========> y coord
                      |  |  |  |  |  |
                      |  |  |  ====================> x coord
                      |  |  |
                      |  |  =======================> color
                      |  |
                      |  ==========================> command (TEXT)
                      |
                      =============================> opcode (opUI_DRAW)

(the first few bytes are length, sequence number, and local/global variable declaration, and aren't important for this challenge)
```

This command would write the character “1” at (0x5a, 0x28).

You’ll notice that there are three bytes for the x coord, and two bytes for the y coord. Turns out, there are some inconsistencies with the documentation and the Bluetooth log for how big the coordinates are supposed to be (or there is other data being put in there that isn’t consistent/documented). The log has packets with data sizes of 19, 20, and 21 bytes (the example above is 20 bytes). Here’s what I figured out for parsing data on the various length packets:

- If there are 19 bytes of data, the x coord is at the 10th byte (starting with 0 on the left), and the y coord is at the 12th byte.
- If there are 20 bytes of data, the x coord is somewhere in the 10th-12th byte, and whichever byte is lower than 0x80 is the correct byte. The y coord is constant at the 13th byte.
- If there are 21 bytes of data, the x coord is at the 11th byte, the y coord is somewhere between the 14th-17th byte, and whichever byte is lower than 0x80 is the correct byte.

With that information at hand, I wrote a Python script to analyze the data (exported as JSON from Wireshark) and output the flag:

```
$ ./solve.py
hitcon{m1nd5t0rm_communication_and_firmware_developer_kit}
```

Here is a [link to my folder on GitHub](https://github.com/zzzanderw/ctf-writeups/tree/master/hitcon2018/ev3basic) where I have the files for the challenge and my script to get the flag.
