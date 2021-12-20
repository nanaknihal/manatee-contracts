# Documentation


## Programs
### BookFactory
Has one method: createBook(). This takes the hash of the book to be minted, the address of the marketplace the user wants to publish on, the addresses who will have shares, the number of shares to each address, the price of the book, token (address) which the price is denominated in, and whether resales are enabled.

*address*: 0xaddress

*methods*: createBook(arguments)

### Book
Books are ERC20 tokens with the following fields:
hash of the book to be minted, the address of the marketplace the user wants to publish on, the addresses who will have shares, the number of shares to each address, the price of the book, token (address) which the price is denominated in, and whether resales are enabled.

The ability of the owner to call setBookHash() enables distribution of shares *before* the book is finished, so that parties such as editors can be paid in shares

transferOwnership() and renounceOwnership(), among other functions, are inherited by OpenZeppelin's Ownership 2.x contract. That way, control of the book can be transferred to any address (including a DAO or voting contract, such as a ShareBasedVoter in Manatee 2.0), and can be revoked to finalize the contract. As revoking ownership ensures no future changes to the book are possible, it should be done with caution; changes to price and even content (thus the hash and/or external link) may be necessary later yet would be sacrificied if ownership is revoked.

*address*: will be a new address

*methods*: setPrice(), setDemoninationToken(), setBookHash()


### Marketplace
Any address can be a Marketplace. Marketplaces are simply where a portion of transaction fees go. Any web-based book exchange will likely want an associated address. It can check that payments have been made to that address before allowing users to read the corresponding book.

*addresses*: put list of marketplaces here

*methods*: none

### Provisioner
This is the program which grants users access tokens in exchange for payment. It does not distribute the payment unless payment distribution is requested (pull payments, for security and efficiency). Any user can be credited the amount they are owed by the provisioner at any time, at the user's request.

*address*: 0xaddress

*methods*: purchaseBook(), giveMeAllThatImOwed(), 
purchaseBook sends user an AccessToken (which can be read by marketplaces to determine whether user currently has access to view a book).

### AccessToken
Used to show on-chain that the holder of an unexpired AccessToken has viewing access to a book right now. 
AccessTokens aren't resellable except when their Book's author or tokenholders have elected resellable = true on the Book. 

### Auditor
Used to verify whether books actually belong to the purported author. Any program which implements the following methods can be an Auditor, although it is up to marketplaces and the community to trust a given auditor. marketplaces can display next to books they are showing whether the book is verified. Note that anonymously authored books can be verified as well, as long as they are first issued on the blockchain and thus can be verified with only cryptographic keys.

*addresses*: suggested auditors

*methods*: getApprovalStatus(), setApprovalStatus()
