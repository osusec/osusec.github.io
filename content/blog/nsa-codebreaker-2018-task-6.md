---
title: "NSA Codebreaker 2018 - Task 6"
author: "Andrew Quach"
date: 2019-01-16T00:00:00-07:00
categories: ['Writeups']
tags: ['codebreaker']
caption: ""

draft: false
---

**Loophole – (Smart-Contract Development; Vulnerability Analysis; Exploit Development)**

Task 6 has us exploit a loophole in the smart-contracts to recover the decryption key without spending any ether (not including transaction costs). We are given the source for three smart contracts: [the Escrow contract, the Ransom contract, and the Registry contract.](https://gist.github.com/Aqcurate/1759ad80cf1d443d23a20fb7e012d38d)

#### Decryption Overview

Let’s first look at the intended method of recovering the decryption key.

![Diagram of the Escrow Contract](/blog/nsa-codebreaker-2018-task-6-escrow-contract.png)

1. From the Escrow contract, the victim calls **payRansom()** to pay the ransom amount. The victim is marked as having paid.
2. The **payRansom()** function calls **requestKey()** in the Ransom contract.
3. The **requestKey()** function in the Ransom contract calls **decryptKey()** in the Escrow contract.
4. The **decryptKey()** function in the Escrow contract emits a **DecryptEvent**.
5. An off-chain oracle processes this **DecryptEvent**, calling **decryptCallback()**. If the processing is successful, the Ransom contract is marked as fulfilled. Otherwise, the victim gets a refund.
6. The victim can now call **getDecryptionKey()** to get their decryption key.

#### Scanning for Vulnerabilities

Let’s look at the entry point for this decryption process: **payRansom()**.

```
function payRansom(uint id, string encFile) external restrictSenderToVictim(id) payable {
    Victim storage vicInfo = victimMap[id];
    Ransom ransom = Ransom(vicInfo.ransomAddr);

    if (msg.value >= vicInfo.ransomAmount && !ransom.isFulFilled()) {
            
        escrowMap[id] += msg.value;
        encFileMap[id] = encFile;
        vicToPayerMap[id] = msg.sender;
        ransom.requestKey(); 
    } else {
        emit BadPaymentEvent(id);
    }
}
```

If we want to start this decryption process without paying, we must bypass the **msg.value >= vicInfo.ransomAmount** condition. Since spoofing **msg.value** isn’t an option, we can instead try to find a way to modify **vicInfo.ransomAmount**, setting it to zero.

```
function registerRansom(uint ransomAmount,
                        uint victimId, 
                        address victimAddr) external onlyAuthenticated(msg.sender)  { 
    victimMap[victimId] = Victim(victimId, ransomAmount, victimAddr, msg.sender);
}
```

We find that **vicInfo.ransomAmount** is set when the ransom contract is registered. Unfortunately, we do not the permissions to register our own ransom contract since we are not authenticated. So, the natural question that emerges: how is a contract authenticated?

#### Registering Ransom Contracts

Here is quick overview of the deployment process for ransom contracts.

![Diagram of Registration of Escrow Contract](/blog/nsa-codebreaker-2018-task-6-ransom-register.png)

1. In the constructor of the Ransom contract, the **registerVictim()** function of the Registry contract is called with two arguments: the victim ID and the authentication token.
2. The **registerVictim()** function emits an **AuthEvent** with four arguments: the victim ID, the Ransom contract address, the authentication token, and the person who deployed the Ransom contract.
3. An off-chain oracle processes this **AuthEvent**, calling **authCallback()** in the Registry contract.
4. The **authCallback()** function in the Registry contract calls the **authCallback()** functions in the Escrow and Ransom contracts.
5. The Escrow contract’s **authCallback()** function authenticates the Ransom contract’s address if the result is successful.
6. The Ransom contract’s **authCallback()** function calls the **registerRansom()** function in the Escrow contract if the result is successful.

#### Deploying a Custom Ransom Contract (Attempt 1)

The key to authenticating a ransom contract is emitting an **AuthEvent** which the off-chain oracle deems successful. But what constitutes as successful? 

```
function registerVictim(uint id, uint authToken) external returns (bool) {
    if (MAX_PENDING_AUTH_REQUESTS > 0 && pendingAuthCount == MAX_PENDING_AUTH_REQUESTS) {
        return false;
    }
    pendingAuthCount++;
    authMap[id] = VictimInfo(id, msg.sender, 0);

    emit AuthEvent(id, msg.sender, authToken, tx.origin);

    return true;
}
```

We can quickly rule out the first two parameters: the victim ID and the Ransom contract address. These two parameters likely have no impact on the return of **AuthEvent**. The victim ID is just going to be set to our own ID and the new Ransom contract address can’t really be controlled.

But of the two remaining degrees of freedom, the use of **tx.origin** particularly eye-catching. [Using tx.origin as a means for checking authorization of ownership is a well known vulnerability.](https://solidity.readthedocs.io/en/v0.4.24/security-considerations.html#tx-origin) Since the oracle initiates a transaction every time it performs a callback, we can trick the oracle into emitting the **AuthEvent** for us.

```
function authCallback(address _escrowAddr, bool authResult) external restrictSenderToRegistry {
    authenticated = authResult;
    if (authResult == true){
        escrowAddr = _escrowAddr;

        // 0 ether ransom default
        Escrow(escrowAddr).registerRansom(0 ether, victimId, victimAddr);
    } else {
        Registry(registryAddr).registerVictim(victimId, authToken);
    }
}
```

Although this is definitely sloppy (potential infinite loop until the gas runs out), re-registering the victim in the callback function allows us to use the oracle’s address as the transaction origin.

Unfortunately for us, on further investigation, the **tx.origin** parameter does not seem to play a part in the authentication process. In fact, if we scan the blockchain for events emitted, we can see the origin address used in the original Ransom contract’s authentication event is something we cannot replicate (without phishing).

**Original AuthEvent:**

0x9f7727801209b9f92e263cca5d8c3bdf26eedcbf8abb375bcbd101d57acb354d0000000000000000000000002b438d42631256b6e16d9709f176b9f3b1fc3ece0000000000000000000000000000000000000000000000000000000000076c7f000000000000000000000000**63d85378eb4d57c4ae14f6a39b05e495de08b1a8**

**AuthEvent w/ tx.origin as our own address:**

0x9f7727801209b9f92e263cca5d8c3bdf26eedcbf8abb375bcbd101d57acb354d0000000000000000000000004a722e89bea34984647fefec01f1eccecd9d5afc000000000000000000000000000000000000000000000000000000000007c99b000000000000000000000000**7d8687379ea4882b3b279bbc5c97b47ae73cb0e8**

**AuthEvent w/ tx.origin as the oracle’s address:**

0x9f7727801209b9f92e263cca5d8c3bdf26eedcbf8abb375bcbd101d57acb354d000000000000000000000000237d008839b32a959e845d5ba94f10a6d142a1970000000000000000000000000000000000000000000000000000000000076c7f000000000000000000000000**191b13d28df6b574275405e485dfc0f6794ad831**

(Notice the **(id, msg.sender, authToken, tx.origin)** tuple in the authentication event data.)

#### Deploying a Custom Ransom Contract (Attempt 2) 

So, the authentication event depends solely on the authentication code. But how is this authentication code generated?

Luckily for us, the one time password (OTP) generation function was leaked in a previously given shared object file (libclient_crypt.so).

![Screenshot of disassembly of OTP generation function](/blog/nsa-codebreaker-2018-task-6-asm.png)

Reversing this function nets us the following code.

```
#include <openssl/evp.h>
#include <stdlib.h>
#include <stdio.h>

int main() {
    const char key[21] = {'\xed', '{', '\xe8', 'e', '\x89', 'D', 'K',
                                   '\xcd', '\xd0', '\xe1', '\x1b', 'n', '\xd3', '\x02',
                                   ',', 'Z', 'W', '\xc3', 'p', '\xd3', '\x00'};
    long now = time(NULL);

    // Time seed will update every 30 seconds
    unsigned long long seed = (unsigned long long) __builtin_bswap32((now / 30)) << 32;

    const EVP_MD* sha1 = EVP_sha1();
    EVP_MD_CTX* mdctx = EVP_MD_CTX_create();
    EVP_PKEY* pkey = EVP_PKEY_new_mac_key(EVP_PKEY_HMAC, NULL, key, 20);
    EVP_DigestSignInit(mdctx, NULL, sha1, NULL, pkey);
    EVP_DigestUpdate(mdctx, &seed, 8);

    size_t siglen = 0;
    unsigned char sig[20];
    int res = EVP_DigestSignFinal(mdctx, sig, &siglen);

    int offset = sig[siglen-1] & 0xf;
    unsigned int otp = ((
                (sig[offset+1] << 16) + sig[offset+3] + (sig[offset+0] << 24) + (sig[offset+2] << 8)
                ) & 0x7FFFFFFF
                ) % 0xF4240;

    printf("OTP: %d\n", otp);
}
```

Note that the key array is the secret key (found in task 2) base-32 decoded.

We can now deploy any Ransom contract we want. The arguments for the Ransom contract constructor (e.g. _encKey, _registryAddr) can be found using the same method shown in task 4.

![Screenshot of deploying a fake ransom contract](/blog/nsa-codebreaker-2018-task-6-noransom.png)

![Screenshot of the fake ransom contract, completed](/blog/nsa-codebreaker-2018-task-6-noransom2.png)

#### Finishing Off the Exploit

Now, we can make a simple modification in our new Ransom contract—changing the Ransom amount from 100 ether to 0 ether. 

```
uint constant RANSOMAMOUNT = 0 ether; //!< The ransom amount the victim must pay
```

When we call payRansom() with no ether sent and the correct arguments, then call getDecryptionKey(), we receive the decryption key—no payment necessary! 

![Screenshot of making a payment on the fake ransom contract and extraction of flag](/blog/nsa-codebreaker-2018-task-6-payransom.png)

By exploiting a weakness in the off-chain contract validation system, we were able to bypass the ransom.

#### Submission Details

**Decryption Key:** 0xc2f5676c865a230f72e9bc36bdf90e4dd9a2de697f21267213147ebefbeef7b5

**Transaction Hash:** 0x9c23c90b7a6d143b23efe96555e846b289a937b69dcfe75cdb3f9a9529fd7bc9 

![Screenshot of Task 6 on NSA Codebreaker Challenge website complete](/blog/nsa-codebreaker-2018-task-6-finished.png)
