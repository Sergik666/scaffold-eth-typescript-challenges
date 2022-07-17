pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts/access/Ownable.sol';
import './YourToken.sol';

contract Vendor is Ownable {
  YourToken public yourToken;

  uint256 public constant c_tokensPerEth = 100;

  event BuyTokens(address buyer, uint256 amountOfEth, uint256 amountOfTokens);
  event SellTokens(address saller, uint256 amountOfEth, uint256 amountOfTokens);

  constructor(address tokenAddress) {
    yourToken = YourToken(tokenAddress);
  }

  function buyTokens() public payable {
    require(msg.value > 0, 'No ETH for buy tokens');
    uint256 amountOfTokens = msg.value * c_tokensPerEth;
    yourToken.transfer(msg.sender, amountOfTokens);
    emit BuyTokens(msg.sender, msg.value, amountOfTokens);
  }

  function withdraw() public payable onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, 'No ETH on contract balance');
    payable(msg.sender).transfer(balance);
  }

  function sellTokens(uint256 amountOfTokens) public payable {
    uint256 amountOfEth = amountOfTokens / c_tokensPerEth;
    uint256 balance = address(this).balance;
    require(balance >= amountOfEth, 'No ETH on contract balance');

    require(yourToken.balanceOf(msg.sender) >= amountOfTokens, 'No TOKEN balance on saller');

    yourToken.transferFrom(msg.sender, address(this), amountOfTokens);

    payable(msg.sender).transfer(amountOfEth);

    emit SellTokens(msg.sender, amountOfEth, amountOfTokens);
  }

  function tokensPerEth() public pure returns (uint256) {
    return c_tokensPerEth;
  }
}
