---
title: "UTCTF 2019 - Rogue Leader"
author: "Andrew Quach"
date: 2019-03-10T00:00:00-07:00
categories: ['Writeups']
tags: []
caption: ""

draft: false
---

### Problem Description

Our once-venerable president has committed the unspeakable crime of dine-and-dashing the pizza during our own club meetings. He’s on the run as we speak, but we’re not sure where he’s headed.

Luckily, he forgot that we had planted a packet sniffer on his laptop, and we were able to retrieve the following capture when we raided his apartment: [\[pcap\].](https://storage.googleapis.com/utctf/capture.pcapng)

He’s too smart to email his plans to himself, but I’m certain he took them with him somehow. Can you help us figure out which country he’s fleeing to?

### Reconnaissance

Loading the file in Wireshark, we can clearly see that it is a USB packet capture. First thing is first, let’s figure out which devices were connected to the machine.

![Screenshot of Wireshark listing USB traffic](/blog/utctf-2019-rogue-leader-wireshark.png)

![Screenshot of Wireshark identifying a device as a flash drive](/static/blog/utctf-2019-rogue-leader-flashdrive.png)

So, device 2 (with bus id 1) is a flash drive. Other notable devices include a gaming mouse (device 9, bus id 2), a keyboard (device 5, bus id 2), and a tablet (device 4, bus id 2).

### Dumping the Flash Drive

Let’s try to find any files that have been transferred in/out of the flash drive. These packets will be rather large and have the URB_BULK in/out flags set. Filtering just by size nets us one of these packets.

![Screenshot of Wireshark entry with URB_BULK out flag set](/static/blog/utctf-2019-rogue-leader-urb-bulk.png)

We can dump this data (File > Export packet bytes). This file turns out to be GPG encrypted data.

```
$ file raw.out
raw.out: GPG symmetrically encrypted data (AES256 cipher)
```

Now that we have the encrypted file, a natural thing to look for is the password. We can try to get this password from the packets storing data about keyboard presses.

### Recovering Key Presses

We can filter for packets with information about keyboard presses.

![Screenshot of Wireshark USB packets with keyboard presses](/static/blog/utctf-2019-rogue-leader-keyboard-presses.png)

The “Leftover Data Capture” looks something like this.

```
00000a0000000000
0000000000000000
0000130000000000
```

These 8 bytes include the scan code of the keyboard presses. Keyboard modifiers (ctrl, alt, shift) are stored in the first byte. Other key presses are stored in the third byte to the last byte.

```
[MODIFIER] [RESERVED] [KEY PRESS x6]
```

Let’s use tshark to dump out all the keyboard data. Note that we’ll filter out empty data.

```
$ tshark -r capture.pcapng -Y "((usb.transfer_type == 0x01) && !(usb.capdata == 00:00:00:00:00:00:00:00) && (usb.device_address == 5) && (usb.urb_type == 67))" -e "usb.capdata" -Tfields > keyboard.data
$ head keyboard.data
00:00:0a:00:00:00:00:00
00:00:13:00:00:00:00:00
00:00:0a:00:00:00:00:00
00:00:0a:2c:00:00:00:00
00:00:2c:00:00:00:00:00
00:00:2d:00:00:00:00:00
00:00:06:00:00:00:00:00
00:00:2c:00:00:00:00:00
00:00:09:00:00:00:00:00
00:00:09:0f:00:00:00:00
```

We can use a python script to decode the key presses. I found a script online that does most of the work for me. I only changed it a little to fit my needs (e.g. adding more scan codes).

```
# Original Source: https://bitvijays.github.io/LFC-Forensics.html
# More Scan Codes: https://gist.github.com/MightyPork/6da26e382a7ad91b5496ee55fdc73db2

usb_codes = {
        0x04:"aA", 0x05:"bB", 0x06:"cC", 0x07:"dD", 0x08:"eE", 0x09:"fF",
        0x0A:"gG", 0x0B:"hH", 0x0C:"iI", 0x0D:"jJ", 0x0E:"kK", 0x0F:"lL",
        0x10:"mM", 0x11:"nN", 0x12:"oO", 0x13:"pP", 0x14:"qQ", 0x15:"rR",
        0x16:"sS", 0x17:"tT", 0x18:"uU", 0x19:"vV", 0x1A:"wW", 0x1B:"xX",
        0x1C:"yY", 0x1D:"zZ", 0x1E:"1!", 0x1F:"2@", 0x20:"3#", 0x21:"4$",
        0x22:"5%", 0x23:"6^", 0x24:"7&", 0x25:"8*", 0x26:"9(", 0x27:"0)",
        0x2C:"  ", 0x2D:"-_", 0x2E:"=+", 0x2F:"[{", 0x30:"]}",  0x32:"#~",
        0x33:";:", 0x34:"'\"",  0x36:",<",  0x37:".>", 0x38:"/?", 0x4f:">",
        0x50:"<"
        }

lines = ['']

pos = 0
for x in open("keyboard.data","r").readlines():
    x = x.split(':')
    code = int(x[2], 16)

    if code == 0:
        continue

    # 0x51 -> Keyboard Down
    # 0x28 -> Enter;
    if code == 0x51 or code == 0x28:
        pos += 1

        if pos > len(lines)-1:
            lines.append('')
        continue

    # 0x52 -> Keyboard Up;
    if code == 0x52:
        pos -= 1
        continue

    # Shift modifier
    if int(x[0],16) == 2:
        lines[pos] += usb_codes[code][1]
    else:
        lines[pos] += usb_codes[code][0]

for x in lines:
    print(x)
```

The output of this is:

```
$ python decode.py
gpgg -c fflaagss.ppng
utNOTflag{try_haardeer}
utNOTflag{try_hardeer}
cp flaggs.png.gpg /media/usserr/USB/
```

Although there are some duplicated letters, we can still see the password is
**utNOTflag{try_harder}**. We can now decrypt the file we found before.

```
$ gpg -o flags.png -d raw.out
 <type utNOTflag{try_harder} twice>
$ file flags.png
 flags.png: PNG image data, 112 x 163, 8-bit/color RGBA, non-interlaced
```

And we get flags.png!

![Picture of United Nations country flags](/static/blog/utctf-2019-rogue-leader-flags.png)

### Last Steps Before (getting the flag)

Now that we have flags.png, perhaps the flag is hidden with some steganography techniques. After fiddling around with it, we find that another image is hidden in the LSB of flags.png. Using an [online tool](https://incoherency.co.uk/image-steganography), we get the hidden image.

![Picture of the state of Texas overlaid with the Texan flag and the CTF flag](/static/blog/utctf-2019-rogue-leader-flags.png)

**Flag: utflag{t3x45_1s_my_f4v0r1te_c0untry}**